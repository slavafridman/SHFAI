import { localDateTime } from "./contract-validation.mts";
import { civil } from "./stage-arrival-domain.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { shiftFail } from "./shift-management-errors.mts";
import type { ShiftRuleCodeV1, ShiftRuleFieldV1 } from "./shift-management-contracts.mts";

export interface ShiftInterval {
  startLocal: string;
  endLocal: string;
}
// Already parsed unit policy, in integral civil minutes. Adapters must prove
// source units/precision; these functions do not supply missing policy defaults.
export interface ShiftDurationPolicy {
  minimumMinutes: number;
  maximumMinutes: number;
  gapMinutes: number;
}

export function assertShiftWorkAllowed(signal?: AbortSignal): void {
  const budget = currentRequestBudget();
  if (signal?.aborted || budget?.signal.aborted ||
      budget && performance.now() >= budget.deadline) shiftFail("DEPENDENCY_TIMEOUT");
}
function rule(code: ShiftRuleCodeV1, field: ShiftRuleFieldV1 | null = null): never {
  return shiftFail("BUSINESS_VALIDATION_FAILED", {
    ruleViolations: [{ row: null, field, code }],
  });
}
export function shiftCivilMinute(local: string): number {
  if (!localDateTime(local) || !local.endsWith(":00")) return rule("INVALID_TIME_RANGE");
  // UTC is only a Gregorian arithmetic scratch representation, NOT the
  // business-zone interpretation of a submitted civil time.
  return Date.parse(local + "Z") / 60000;
}
export function shiftDurationMinutes(interval: ShiftInterval): number {
  const duration = shiftCivilMinute(interval.endLocal) - shiftCivilMinute(interval.startLocal);
  if (!Number.isSafeInteger(duration) || duration <= 0) return rule("INVALID_TIME_RANGE");
  return duration;
}
export function nextShiftCivilDate(date: string): string {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date) ||
      !localDateTime(date + "T00:00:00")) return rule("INVALID_TIME_RANGE", "date");
  let [year, month, day] = date.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (++day > days[month - 1]) {
    day = 1;
    if (++month > 12) { month = 1; year++; }
  }
  if (year > 9999) return rule("INVALID_TIME_RANGE", "date");
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function gap(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 9999999999)
    shiftFail("INVALID_SOURCE_DATA");
}
export function validateShiftDurationPolicy(policy: ShiftDurationPolicy): void {
  gap(policy.gapMinutes);
  if (!Number.isSafeInteger(policy.minimumMinutes) || policy.minimumMinutes <= 0 ||
      !Number.isSafeInteger(policy.maximumMinutes) || policy.maximumMinutes < policy.minimumMinutes ||
      policy.maximumMinutes > 9999999999) shiftFail("INVALID_SOURCE_DATA");
}
export function shiftIntervalsConflict(a: ShiftInterval, b: ShiftInterval,
  gapMinutes: number): boolean {
  gap(gapMinutes);
  shiftDurationMinutes(a); shiftDurationMinutes(b);
  return shiftCivilMinute(a.startLocal) < shiftCivilMinute(b.endLocal) + gapMinutes &&
    shiftCivilMinute(a.endLocal) > shiftCivilMinute(b.startLocal) - gapMinutes;
}

function zoneValid(zone: string): void {
  if (typeof zone !== "string" ||
      !/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(zone))
    shiftFail("INVALID_SOURCE_DATA");
  try { new Intl.DateTimeFormat("en", { timeZone: zone }); }
  catch { shiftFail("INVALID_SOURCE_DATA"); }
}
function offsetAt(instant: number, zone: string): number {
  const local = civil(new Date(instant), zone);
  return Date.parse(local + "Z") - instant;
}
function resolveCivil(local: string, zone: string, signal?: AbortSignal): number {
  const nominal = shiftCivilMinute(local) * 60000;
  const offsets = new Set<number>();
  // Reuse the established civil/offset sampling mechanism, not host locale or
  // a fixed Israel offset. Clip samples outside the supported Gregorian range.
  for (let h = -36; h <= 36; h += 3) {
    assertShiftWorkAllowed(signal);
    const instant = nominal + h * 3600000;
    const year = new Date(instant).getUTCFullYear();
    if (year >= 1 && year <= 9999) offsets.add(offsetAt(instant, zone));
  }
  const matches = [...offsets].map(offset => nominal - offset).filter(instant => {
    const year = new Date(instant).getUTCFullYear();
    return year >= 1 && year <= 9999 && civil(new Date(instant), zone) === local;
  });
  if (matches.length !== 1) return rule("AMBIGUOUS_LOCAL_TIME");
  return matches[0];
}

export function validateShiftInterval(interval: ShiftInterval, policy: ShiftDurationPolicy,
  now: Date, zone: string, signal?: AbortSignal): {
    durationMinutes: string; startInstant: number; endInstant: number;
  } {
  assertShiftWorkAllowed(signal);
  validateShiftDurationPolicy(policy);
  zoneValid(zone);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) shiftFail("INVALID_SOURCE_DATA");
  const duration = shiftDurationMinutes(interval);
  if (duration < policy.minimumMinutes || duration > policy.maximumMinutes)
    return rule("DURATION_OUT_OF_POLICY");
  const start = resolveCivil(interval.startLocal, zone, signal);
  const end = resolveCivil(interval.endLocal, zone, signal);
  const startOffset = offsetAt(start, zone);
  if (end <= start || end - start !== duration * 60000 || offsetAt(end, zone) !== startOffset)
    return rule("OFFSET_TRANSITION_UNSUPPORTED");
  // Check intermediate offsets too: equal endpoints alone do not prove that a
  // long interval did not cross two transitions. Deny capacity overflow rather
  // than silently sampling an unbounded interval or inventing a domain maximum.
  let samples = 0;
  for (let t = start; t < end; t += 3 * 3600000) {
    assertShiftWorkAllowed(signal);
    if (++samples > 4096) shiftFail("DEPENDENCY_TIMEOUT");
    if (offsetAt(t, zone) !== startOffset) return rule("OFFSET_TRANSITION_UNSUPPORTED");
  }
  if (start <= now.getTime()) return rule("PAST_OR_STARTED_SHIFT", "startLocal");
  return { durationMinutes: String(duration), startInstant: start, endInstant: end };
}

export function shiftWithinOriginalWeek(proposed: ShiftInterval, original: ShiftInterval): boolean {
  shiftDurationMinutes(proposed); shiftDurationMinutes(original);
  const start = new Date(original.startLocal.slice(0, 10) + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(original.endLocal.slice(0, 10) + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 7 - end.getUTCDay());
  const proposedStart = shiftCivilMinute(proposed.startLocal) * 60000;
  const proposedEnd = shiftCivilMinute(proposed.endLocal) * 60000;
  return proposedStart >= start.getTime() && proposedStart < end.getTime() &&
    proposedEnd <= end.getTime();
}
