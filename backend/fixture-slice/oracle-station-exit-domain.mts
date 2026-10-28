import type { StationExitBlockerV1, StationExitContextV1 } from "./station-exit-contracts.mts";
import type { NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import { localDateTime } from "./contract-validation.mts";
import { civil, instantFor } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";

export function exitPolicy(system: NativeRow, unit: NativeRow | null): number {
  const v = unit?.PARAM_VALUE ?? system.DEFAULT_VALUE;
  if (typeof v !== "string" || !/^[0-9]+$/.test(v) || v.length > 8192 ||
      !Number.isSafeInteger(Number(v)) || Number(v) > 2147483647) stageFail("INVALID_SOURCE_DATA");
  return Number(v);
}
export function exitTiming(f: { planned: { startLocal: string; endLocal: string };
  policy: { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number };
  rows: Record<string, NativeRow | null> }, now: Date, zone: string,
  binding: { windowStart: string; windowEnd: string }) {
  const start = instantFor(f.planned.startLocal, zone), end = instantFor(f.planned.endLocal, zone);
  const local = civil(now, zone), t = now.getTime();
  instantFor(local, zone); // DATE cannot represent a repeated civil second.
  const { maxEarlyWholeMinutes: b, maxAfterEndMinutes: a } = f.policy;
  if (![a, b].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 2147483647) || end < start)
    stageFail("INVALID_SOURCE_DATA");
  const earlyBoundary = end - (b + 1) * 60000, upper = end + a * 60000;
  const arrival = f.rows.SHF_ATTENDANCE?.STATION_ARRIVAL_TIME;
  const earliest = Math.max(start - 3600000, earlyBoundary + 1, arrival == null ? -Infinity : instantFor(arrival, zone));
  if (![earlyBoundary, upper, earliest].every(v => Number.isSafeInteger(v) &&
      Number.isFinite(new Date(v).getTime()) && new Date(v).getUTCFullYear() >= 1 &&
      new Date(v).getUTCFullYear() <= 9999)) stageFail("INVALID_SOURCE_DATA");
  const today = local.slice(0, 10), planDay = f.planned.startLocal.slice(0, 10);
  const sameDay = today === planDay && f.planned.endLocal.slice(0, 10) === planDay;
  const nextDay = new Date(Date.parse(planDay + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  const midnight = instantFor(nextDay + "T00:00:00", zone);
  const operator = t >= Date.parse(binding.windowStart) && t < Date.parse(binding.windowEnd);
  const withinExitWindow = sameDay && operator && t >= earliest && t <= upper;
  const classification: StationExitContextV1["classification"] = t <= earlyBoundary
    ? "early-manager-decision-deferred" : sameDay && operator && t >= start - 3600000 && t <= upper
      ? "ordinary" : "outside-window";
  return { local, classification, withinExitWindow,
    exitWindow: { earliestInclusiveAt: new Date(earliest).toISOString(), latestInclusiveAt: new Date(upper).toISOString() },
    transition: Math.min(upper + 1, midnight, Date.parse(binding.windowEnd)) };
}
export function exitBlockers(rows: Record<string, NativeRow | null>, reports: string,
  exceptions: { current: string; base: string }, overlap: boolean): StationExitBlockerV1[] {
  const e = rows.SHF_EMPLOYEES, d = rows.SHF_EMPLOYEE_DAY, c = rows.SHF_DAY_CHANGES, a = rows.SHF_ATTENDANCE;
  if (!e || !d || !["0", "1"].includes(e.SHF_LOCKED ?? "") ||
      ![reports, exceptions.current, exceptions.base].every(v => typeof v === "string" && /^(0|[1-9][0-9]*)$/.test(v)) ||
      typeof overlap !== "boolean") stageFail("INVALID_SOURCE_DATA");
  const b: StationExitBlockerV1[] = [];
  if (e.SHF_LOCKED === "1") b.push("EMPLOYEE_LOCKED");
  if (reports !== "0") b.push("REPORT_REVIEW_REQUIRED");
  if (exceptions.current !== "0" || exceptions.base !== "0") b.push("UNSUPPORTED_DAY");
  if (overlap) b.push("OVERLAPPING_SHIFT");
  for (const flag of [d.SPLIT_SHIFT, c ? c.NEW_SPLIT_SHIFT : null])
    if (flag !== null && !["Y", "N", "y", "n"].includes(flag ?? "")) stageFail("INVALID_SOURCE_DATA");
  if ((c?.NEW_DAY_TYPE ?? d.WM_DAY_TYPE) !== "4" || c?.CANCEL_REASON_CODE != null ||
      (c?.NEW_ACTIVITY ?? d.WM_SCH_ACTIVITY_ID_DATA) !== null ||
      (c?.NEW_EXCEPTION_TYPE_ID ?? d.WM_EXCEPTION_TYPE_ID) !== null ||
      [d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT].some(v => v?.toUpperCase() === "Y") ||
      [d.SPLIT_START, d.SPLIT_END, c ? c.NEW_SPLIT_START : null, c ? c.NEW_SPLIT_END : null].some(v => v !== null))
    b.push("UNSUPPORTED_DAY");
  if (!a) return [...new Set([...b, "ATTENDANCE_ROW_REQUIRED" as const])];
  const required = ["SHF_EMPLOYEE_DAY_ID", "STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH",
    "STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "STATION_EXIT_TIME", "STATION_EXIT_USER",
    "MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK", "OPTIONAL1",
    "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK",
    "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "STAGE_LATE_REMARK"];
  if (required.some(k => !Object.hasOwn(a, k) || a[k] !== null && typeof a[k] !== "string") ||
      ![null, "0", "1"].includes(a.TADREECH)) stageFail("INVALID_SOURCE_DATA");
  for (const prefix of ["STAGE_ARRIVAL", "STATION_ARRIVAL", "STATION_EXIT"]) {
    const time = a[prefix + "_TIME"], user = a[prefix + "_USER"];
    if ((time === null) !== (user === null) || time !== null &&
        (!localDateTime(time) || !user || !user.isWellFormed() || !user.trim())) stageFail("INVALID_SOURCE_DATA");
  }
  if (a.STAGE_ARRIVAL_TIME !== null && a.STATION_ARRIVAL_TIME !== null && a.STAGE_ARRIVAL_TIME > a.STATION_ARRIVAL_TIME ||
      a.STATION_EXIT_TIME !== null && (a.STATION_ARRIVAL_TIME === null || a.STATION_ARRIVAL_TIME > a.STATION_EXIT_TIME))
    stageFail("INVALID_SOURCE_DATA");
  if (a.STATION_ARRIVAL_TIME === null) b.push("STATION_ARRIVAL_REQUIRED");
  if (["MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK"].some(k => a[k] !== null)) b.push("MISSING_PRESENT");
  if (a.OPTIONAL1 !== null) b.push("FLAG_PRESENT");
  if (["STAGE_LATE_", "LATE_"].some(p => ["REASON_ID", "MINUTES", "REMARK"].some(k => a[p + k] !== null)))
    b.push("EXISTING_LATE");
  const admitted = new Set(required);
  for (const [k, v] of Object.entries(a))
    if (!admitted.has(k) && v !== null && !(k.startsWith("TADREECH") && k.includes("P2") && v === "0"))
      b.push("UNSUPPORTED_DAY");
  return [...new Set(b)];
}
