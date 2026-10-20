import { createHash } from "node:crypto";
import type { StageArrivalBlockerV1, StageArrivalDraftV1, StageArrivalFactsV1,
  StageArrivalWarningDraftV1 } from "./stage-arrival-contracts.mts";
import { localDateTime } from "./contract-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return "{" + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ":" + canonical(Reflect.get(value, key))).join(",") + "}";
}
export const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
export const fingerprint = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");

export function civil(now: Date, zone: string): string {
  if (!Number.isFinite(now.getTime())) stageFail("INVALID_SOURCE_DATA");
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (key: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === key)?.value ?? "";
  const local = `${get("year").padStart(4, "0")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  if (!localDateTime(local)) stageFail("INVALID_SOURCE_DATA");
  return local;
}
// Resolve civil seconds against actual zone offsets; reject gaps/folds. The
// bounded samples cover both sides of DST, not machine-locale interpretation.
export function instantFor(local: string, zone: string): number {
  if (!localDateTime(local)) stageFail("INVALID_SOURCE_DATA");
  const nominal = Date.parse(local + "Z"), offsets = new Set<number>();
  for (let h = -36; h <= 36; h += 3) {
    const t = nominal + h * 3600000;
    const year = new Date(t).getUTCFullYear();
    if (year < 1 || year > 9999) continue;
    offsets.add(Date.parse(civil(new Date(t), zone) + "Z") - t);
  }
  const matches = [...offsets].map(offset => nominal - offset)
    .filter(t => civil(new Date(t), zone) === local);
  if (matches.length !== 1) stageFail("INVALID_SOURCE_DATA");
  return matches[0];
}
export function blockers(f: StageArrivalFactsV1): StageArrivalBlockerV1[] {
  const a = f.attendance, result: StageArrivalBlockerV1[] = [];
  if (!a) result.push("ATTENDANCE_ROW_REQUIRED");
  if (f.missingPresent) result.push("MISSING_PRESENT");
  if (f.outstandingReportsPresent) result.push("REPORT_REVIEW_REQUIRED");
  if (f.splitOrP2 || f.cancelledOrNonActivityDay) result.push("UNSUPPORTED_DAY");
  if (a?.stationArrivalLocal !== null && a?.stationArrivalLocal !== undefined ||
      a?.stationExitLocal !== null && a?.stationExitLocal !== undefined) result.push("DEPENDENT_ATTENDANCE_PRESENT");
  if (a && (a.stageLateReasonCode !== null || a.stageLateMinutes !== null || a.stageLateRemark !== null))
    result.push("EXISTING_STAGE_LATE");
  if (a?.briefing === true) result.push("BRIEFING_PRESENT");
  return result;
}
export function eligible(f: StageArrivalFactsV1) {
  if (f.attendance?.stageArrivalLocal != null) stageFail("ALREADY_REGISTERED");
  if (blockers(f).length) stageFail("COMMAND_SCOPE_DEFERRED");
}
export function classify(f: StageArrivalFactsV1, now: Date, zone: string) {
  const start = instantFor(f.planned.startLocal, zone);
  const end = instantFor(f.planned.endLocal, zone);
  if (end < start) stageFail("INVALID_SOURCE_DATA");
  const local = civil(now, zone);
  // A repeated civil second cannot safely be represented by the existing DATE
  // analogue. Do not record an ambiguous arrival even if plan is unambiguous.
  instantFor(local, zone);
  const threshold = start - f.policy.configuredMinutes * 60000;
  if (!Number.isSafeInteger(threshold) || !Number.isFinite(new Date(threshold).getTime()))
    stageFail("INVALID_SOURCE_DATA");
  const difference = now.getTime() - threshold, late = difference > 0;
  const minutes = String(Math.max(0, Math.floor(difference / 60000)));
  if (!/^(0|[1-9][0-9]{0,9})$/.test(minutes)) stageFail("INVALID_SOURCE_DATA");
  const warnings: StageArrivalWarningDraftV1[] = late ? [{ code: "STAGE_ARRIVAL_LATE", minutes }] : [];
  // Strict equality is on-time; invalidate an equality preparation at the next
  // representable millisecond, before the zero-minute late classification.
  const transition = late ? threshold + (Math.floor(difference / 60000) + 1) * 60000 : threshold + 1;
  return { local, warnings, confirmationRequired: late, transition };
}
export function validateBusiness(f: StageArrivalFactsV1, d: StageArrivalDraftV1,
  now: Date, zone: string) {
  eligible(f);
  const c = classify(f, now, zone);
  if (!c.confirmationRequired) {
    if (d.lateReasonCode !== null || d.lateRemark !== null) stageFail("BUSINESS_VALIDATION_FAILED");
  } else if (d.lateReasonCode === null || !f.lateReasonOptions.some(o => o.code === d.lateReasonCode))
    stageFail("BUSINESS_VALIDATION_FAILED");
  return c;
}
