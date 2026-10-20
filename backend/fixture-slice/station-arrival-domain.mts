import type { StageArrivalFactsV1 } from "./stage-arrival-contracts.mts";
import type { StationArrivalBlockerV1, StationArrivalDraftV1, StationArrivalFactsV1,
  StationArrivalWarningV1 } from "./station-arrival-contracts.mts";
import { civil, instantFor } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { Clock } from "./current-shifts-contracts.mts";

export function stationNow(clock: Clock): Date {
  const now = clock.now();
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      now.getUTCFullYear() < 1 || now.getUTCFullYear() > 9999) stageFail("INVALID_SOURCE_DATA");
  return now;
}

export function stationClassify(f: StageArrivalFactsV1, now: Date, zone: string) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      now.getUTCFullYear() < 1 || now.getUTCFullYear() > 9999) stageFail("INVALID_SOURCE_DATA");
  const start = instantFor(f.planned.startLocal, zone), end = instantFor(f.planned.endLocal, zone);
  const earliest = start - 3600000;
  if (new Date(earliest).getUTCFullYear() < 1 || new Date(earliest).getUTCFullYear() > 9999)
    stageFail("INVALID_SOURCE_DATA");
  const local = civil(now, zone);
  instantFor(local, zone);
  const earliestLocal = civil(new Date(earliest), zone);
  instantFor(earliestLocal, zone);
  if (end < start) stageFail("INVALID_SOURCE_DATA");
  const difference = now.getTime() - start, late = difference > 0;
  const minutes = String(Math.max(0, Math.floor(difference / 60000)));
  if (!/^(0|[1-9][0-9]{0,9})$/.test(minutes)) stageFail("INVALID_SOURCE_DATA");
  const warnings: StationArrivalWarningV1[] = late ? [{ code: "STATION_ARRIVAL_LATE", minutes }] : [];
  const transition = Math.min(end + 1, late ? start + (Math.floor(difference / 60000) + 1) * 60000 : start + 1);
  for (const value of [f.attendance?.stageArrivalLocal, f.attendance?.stationArrivalLocal,
    f.attendance?.stationExitLocal]) if (value != null) instantFor(value, zone);
  if (f.attendance?.stageArrivalLocal && f.attendance.stationArrivalLocal &&
      f.attendance.stageArrivalLocal > f.attendance.stationArrivalLocal ||
      f.attendance?.stationArrivalLocal && f.attendance.stationExitLocal &&
      f.attendance.stationArrivalLocal > f.attendance.stationExitLocal)
    stageFail("INVALID_SOURCE_DATA");
  return { local, warnings, confirmationRequired: late, transition,
    arrivalWindow: { earliestLocal, latestLocal: f.planned.endLocal },
    withinArrivalWindow: now.getTime() >= earliest && now.getTime() <= end };
}
export function stationBlockers({ base: f, extra: x }: StationArrivalFactsV1): StationArrivalBlockerV1[] {
  const result: StationArrivalBlockerV1[] = [];
  if (!f.attendance) result.push("ATTENDANCE_ROW_REQUIRED");
  if (f.missingPresent) result.push("MISSING_PRESENT");
  if (f.outstandingReportsPresent) result.push("REPORT_REVIEW_REQUIRED");
  if (f.splitOrP2 || f.cancelledOrNonActivityDay) result.push("UNSUPPORTED_DAY");
  if (x.stationLate) result.push("EXISTING_STATION_LATE");
  if (f.attendance?.stationExitLocal != null) result.push("EXIT_PRESENT");
  if (x.flagPresent) result.push("FLAG_PRESENT");
  if (x.locked) result.push("EMPLOYEE_LOCKED");
  if (x.fullDayExceptionPresent) result.push("FULL_DAY_EXCEPTION");
  if (x.overlappingShiftPresent) result.push("OVERLAPPING_SHIFT");
  return result;
}
export function stationBusiness(f: StationArrivalFactsV1, draft: StationArrivalDraftV1, now: Date, zone: string) {
  const c = stationClassify(f.base, now, zone);
  if (f.base.attendance?.stationArrivalLocal != null) stageFail("ALREADY_REGISTERED");
  if (stationBlockers(f).length) stageFail("COMMAND_SCOPE_DEFERRED");
  if (f.base.attendance?.stageArrivalLocal && f.base.attendance.stageArrivalLocal > c.local)
    stageFail("INVALID_SOURCE_DATA");
  if (!c.withinArrivalWindow || (c.confirmationRequired
    ? draft.lateReasonCode === null || !f.base.lateReasonOptions.some(o => o.code === draft.lateReasonCode)
    : draft.lateReasonCode !== null)) stageFail("BUSINESS_VALIDATION_FAILED");
  return c;
}
