import type { CancellationBlockerV1, CancellationRecordedV1 } from "./station-exit-cancellation-contracts.mts";
import type { CancellationPartnerReviewV1, CancellationScopeV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationPartnerAssessmentPort } from "./station-exit-cancellation-ports.mts";
import type { NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import { exitBlockers } from "./oracle-station-exit-domain.mts";
import { civil, instantFor, fingerprint } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";

export function cancellationWindow(f: {
  start: number; end: number; arrival: number; exit: number; now: number;
  maxEarlyWholeMinutes: number; maxAfterEndMinutes: number;
  windowStart: number; windowEnd: number;
}) {
  const { start: s, end: e, now: n, maxEarlyWholeMinutes: b, maxAfterEndMinutes: a } = f;
  if (![a, b].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 2147483647) ||
      ![s, e, f.arrival, f.exit, n, f.windowStart, f.windowEnd].every(v =>
        Number.isSafeInteger(v) && Number.isFinite(new Date(v).getTime())) ||
      e < s || f.windowStart >= f.windowEnd) stageFail("INVALID_SOURCE_DATA");
  const early = e - (b + 1) * 60000, upper = e + a * 60000;
  if (![early, upper].every(Number.isSafeInteger)) stageFail("INVALID_SOURCE_DATA");
  return {
    ordinary: f.exit > early && f.exit >= s - 3600000 && f.exit <= upper &&
      f.arrival <= f.exit && f.exit <= n,
    within: n >= s - 3600000 && n <= upper && n >= f.windowStart && n < f.windowEnd,
    transition: Math.min(upper + 1, f.windowEnd),
  };
}
// Complete preservation facts are private, not a public raw-row contract.
export type CancellationSnapshot = {
  employeeId: string; shiftDayId: string; orgUnitId: string;
  planned: { startLocal: string; endLocal: string };
  policy: { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number };
  policyProvenance: { early: NativeRow; after: NativeRow };
  rows: Record<string, NativeRow | null>;
  dependencies: { reports: string; exceptions: { current: string; base: string };
    overlap: boolean; completeEvidence: unknown };
  expectedDaySource: string | null;
  source: "isolated-fixture" | "oracle-test";
  bindingScopeDigest: string; windowStart: string; windowEnd: string;
  partnerReview: CancellationPartnerReviewV1;
};
export const completeCancellationOriginalsDigest = (f: CancellationSnapshot) => fingerprint({
  employeeId: f.employeeId, shiftDayId: f.shiftDayId, orgUnitId: f.orgUnitId,
  planned: f.planned, policy: f.policy, policyProvenance: f.policyProvenance,
  rows: f.rows, dependencies: f.dependencies, expectedDaySource: f.expectedDaySource, source: f.source,
});
export function cancellationRecorded(f: CancellationSnapshot): CancellationRecordedV1 {
  const a = f.rows.SHF_ATTENDANCE;
  return { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null,
    stationArrivalLocal: a?.STATION_ARRIVAL_TIME ?? null,
    stationExitLocal: a?.STATION_EXIT_TIME ?? null,
    briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null };
}
export function cancellationPartnerAssessment(now: number, windowEnd: number): CancellationPartnerAssessmentPort {
  return { assess(input: CancellationScopeV1 & { purpose: "clear-recorded-ordinary-station-exit";
    review: CancellationPartnerReviewV1 }) {
    const r = input.review;
    if (!r || r.version !== "shf-exit-cancellation-partner-review-v1" ||
        r.purpose !== input.purpose || r.bindingScopeDigest !== input.bindingScopeDigest ||
        r.completeOriginalsDigest !== input.completeOriginalsDigest ||
        !r.reviewReference?.trim() || !r.reviewedBy?.trim() ||
        !(Date.parse(r.reviewedAt) <= now && now < Date.parse(r.expiresAt) &&
          Date.parse(r.expiresAt) <= windowEnd)) return { assessment: "unknown" };
    return { assessment: ["not-required", "required", "unknown"].includes(r.assessment) ? r.assessment : "unknown" };
  } };
}
export function decideCancellation(f: CancellationSnapshot, now: Date, zone: string) {
  const blockers: CancellationBlockerV1[] = exitBlockers(f.rows, f.dependencies.reports,
    f.dependencies.exceptions, f.dependencies.overlap);
  if (!f.rows.SHF_EMPLOYEE_DAY || f.rows.SHF_EMPLOYEE_DAY.SOURCE !== f.expectedDaySource)
    stageFail("INVALID_SOURCE_DATA");
  const recorded = cancellationRecorded(f), local = civil(now, zone);
  let transition = Date.parse(f.windowEnd), ordinary = false, within = false;
  try {
    // Repeated/gap civil seconds, including serverNow, conservatively defer.
    instantFor(local, zone);
    const s = instantFor(f.planned.startLocal, zone), e = instantFor(f.planned.endLocal, zone);
    const day = local.slice(0, 10), nextDay = new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
    const midnight = instantFor(nextDay + "T00:00:00", zone);
    const sameDay = f.planned.startLocal.slice(0, 10) === day && f.planned.endLocal.slice(0, 10) === day &&
      civil(new Date(f.windowStart), zone).slice(0, 10) === day &&
      civil(new Date(f.windowEnd), zone).slice(0, 10) === day;
    const t = cancellationWindow({ start: s, end: e, arrival: recorded.stationArrivalLocal === null ? s :
      instantFor(recorded.stationArrivalLocal, zone), exit: recorded.stationExitLocal === null ? s :
      instantFor(recorded.stationExitLocal, zone), now: now.getTime(), ...f.policy,
      windowStart: Date.parse(f.windowStart), windowEnd: Date.parse(f.windowEnd) });
    ordinary = t.ordinary && recorded.stationArrivalLocal !== null;
    within = t.within && sameDay;
    transition = Math.min(t.transition, midnight);
  } catch { blockers.push("OUTSIDE_CANCELLATION_WINDOW"); }
  if (!ordinary && recorded.stationExitLocal !== null) blockers.push("ORDINARY_EXIT_REQUIRED");
  if (!within) blockers.push("OUTSIDE_CANCELLATION_WINDOW");
  const scope = { bindingScopeDigest: f.bindingScopeDigest,
    completeOriginalsDigest: completeCancellationOriginalsDigest(f) };
  if (cancellationPartnerAssessment(now.getTime(), Date.parse(f.windowEnd)).assess({
    ...scope, purpose: "clear-recorded-ordinary-station-exit", review: f.partnerReview,
  }).assessment !== "not-required") blockers.push("PARTNER_REVIEW_REQUIRED");
  return { blockers: [...new Set(blockers)], recorded, local, transition, scope,
    eligibility: recorded.stationExitLocal === null ? "not-recorded" as const :
      blockers.length ? "deferred" as const : "eligible" as const };
}
