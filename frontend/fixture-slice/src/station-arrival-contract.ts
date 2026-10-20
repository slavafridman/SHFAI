// §§41–42 v0.1. Canonical imports are erased; no backend runtime in browser.
import type { StationArrivalContextV1, StationArrivalValidationV1, StationArrivalCommitV1,
  StationArrivalReceiptV1, StationArrivalProblemV1 } from '../../../backend/fixture-slice/station-arrival-contracts.mts';
import { identity, id, localTime, jointArrivalCapabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
import { arrivalIdentity, arrivalProblem, sameLocal, uuid, type ArrivalSelection } from './stage-arrival-contract';
export type { StationArrivalContextV1, StationArrivalValidationV1, StationArrivalCommitV1,
  StationArrivalReceiptV1 } from '../../../backend/fixture-slice/station-arrival-contracts.mts';
export const exact = (v: unknown, names: string): v is Record<string, unknown> => obj(v) &&
  Object.keys(v).sort().join(',') === names.split(' ').sort().join(',');
const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(v) &&
  localTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v));
const minutes = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v);
const nullableTime = (v: unknown) => v === null || localTime(v);
export function stationIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && arrivalIdentity(v) && v.dataSource === 'isolated-fixture' &&
    v.principal.capabilities.join(',') === jointArrivalCapabilities.join(',');
}
export function stationContext(v: unknown, s: ArrivalSelection): v is StationArrivalContextV1 {
  if (!exact(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime arrivalWindow withinArrivalWindow eligibility blockers lateReasonOptions dataSource') ||
    v.dataSource !== 'isolated-fixture' || s.dataSource !== v.dataSource ||
    !id(v.employeeId) || !id(v.shiftDayId, 10) || v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId ||
    s.attendanceKey.shiftDayId !== s.shiftDayId || !unitCode(v.orgUnitId) || v.orgUnitId !== s.orgUnitId ||
    !exact(v.planned, 'startLocal endLocal') || !localTime(v.planned.startLocal) || !localTime(v.planned.endLocal) ||
    v.planned.startLocal !== s.startLocal || v.planned.endLocal !== s.endLocal || v.planned.startLocal > v.planned.endLocal ||
    !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing') ||
    ![v.recorded.stageArrivalLocal, v.recorded.stationArrivalLocal, v.recorded.stationExitLocal].every(nullableTime) ||
    !(v.recorded.briefing === null || typeof v.recorded.briefing === 'boolean') ||
    !exact(v.serverTime, 'instant local businessTimeZone') || !instant(v.serverTime.instant) ||
    !localTime(v.serverTime.local) || !zone(v.serverTime.businessTimeZone) ||
    !sameLocal(v.serverTime.instant, v.serverTime.local, String(v.serverTime.businessTimeZone)) ||
    !exact(v.arrivalWindow, 'earliestLocal latestLocal') || !localTime(v.arrivalWindow.earliestLocal) ||
    !localTime(v.arrivalWindow.latestLocal) || v.arrivalWindow.earliestLocal > v.arrivalWindow.latestLocal ||
    typeof v.withinArrivalWindow !== 'boolean' ||
    !Array.isArray(v.blockers) || new Set(v.blockers).size !== v.blockers.length ||
    !v.blockers.every(b => ['ATTENDANCE_ROW_REQUIRED', 'MISSING_PRESENT', 'REPORT_REVIEW_REQUIRED',
      'UNSUPPORTED_DAY', 'EXISTING_STATION_LATE', 'EXIT_PRESENT', 'FLAG_PRESENT', 'EMPLOYEE_LOCKED',
      'FULL_DAY_EXCEPTION', 'OVERLAPPING_SHIFT'].includes(b)) ||
    !Array.isArray(v.lateReasonOptions) || v.lateReasonOptions.length > 100 ||
    !v.lateReasonOptions.every(r => exact(r, 'code label') && id(r.code) && (r.label === null || clean(r.label, 256))) ||
    new Set(v.lateReasonOptions.map(r => r.code)).size !== v.lateReasonOptions.length) return false;
  return v.eligibility === 'eligible' ? v.blockers.length === 0 && v.recorded.stationArrivalLocal === null &&
    v.recorded.stationExitLocal === null : v.eligibility === 'already-recorded'
    ? v.recorded.stationArrivalLocal !== null : v.eligibility === 'deferred' && v.blockers.length > 0;
}
export function stationValidation(v: unknown, c: StationArrivalContextV1): v is StationArrivalValidationV1 {
  if (!exact(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') ||
    v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId || v.dataSource !== 'isolated-fixture' ||
    v.businessTimeZone !== c.serverTime.businessTimeZone || !instant(v.evaluatedAt) || !instant(v.expiresAt) ||
    !localTime(v.evaluatedLocal) || !sameLocal(v.evaluatedAt, v.evaluatedLocal, String(v.businessTimeZone)) ||
    Date.parse(v.evaluatedAt) < Date.parse(c.serverTime.instant) ||
    !clean(v.fingerprint, 64) || !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    !clean(v.validationToken, 43) || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) || Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) > 120000 ||
    !Array.isArray(v.warnings)) return false;
  return v.state === 'ready' ? v.confirmationRequired === false && v.warnings.length === 0 :
    v.state === 'warning-requires-confirmation' && v.confirmationRequired === true && v.warnings.length === 1 &&
    exact(v.warnings[0], 'code minutes') && v.warnings[0].code === 'STATION_ARRIVAL_LATE' && minutes(v.warnings[0].minutes);
}
export function stationReceipt(v: unknown, c: StationArrivalContextV1, cmd: StationArrivalCommitV1,
  validation: StationArrivalValidationV1): v is StationArrivalReceiptV1 {
  if (!exact(v, 'commandId employeeId shiftDayId outcome recorded committedAt businessTimeZone replayed partnerCompletion dataSource') ||
    v.commandId !== cmd.commandId || !uuid(v.commandId) || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
    v.outcome !== 'fixture-committed' || v.dataSource !== 'isolated-fixture' || v.partnerCompletion !== 'not-invoked' ||
    v.businessTimeZone !== validation.businessTimeZone || typeof v.replayed !== 'boolean' || !instant(v.committedAt) ||
    Date.parse(v.committedAt) < Date.parse(validation.evaluatedAt) || Date.parse(v.committedAt) >= Date.parse(validation.expiresAt) ||
    !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing stationLate') ||
    v.recorded.stageArrivalLocal !== c.recorded.stageArrivalLocal || v.recorded.briefing !== c.recorded.briefing ||
    v.recorded.stationExitLocal !== null || !localTime(v.recorded.stationArrivalLocal) ||
    v.recorded.stationArrivalLocal < validation.evaluatedLocal ||
    !sameLocal(v.committedAt, v.recorded.stationArrivalLocal, String(v.businessTimeZone)) ||
    (c.recorded.stageArrivalLocal !== null && v.recorded.stationArrivalLocal < c.recorded.stageArrivalLocal) ||
    v.recorded.stationArrivalLocal < c.arrivalWindow.earliestLocal || v.recorded.stationArrivalLocal > c.arrivalWindow.latestLocal) return false;
  const late = v.recorded.stationLate;
  return validation.confirmationRequired ? exact(late, 'reasonCode minutes remark') &&
    late.reasonCode === cmd.draft.lateReasonCode && minutes(late.minutes) &&
    late.minutes === validation.warnings[0].minutes && late.remark === null : late === null && cmd.draft.lateReasonCode === null;
}
export function stationProblem(v: unknown, status: number, commandId: string | null): v is StationArrivalProblemV1 {
  // Same closed status/code/effect table as F1, with F2's narrower parameter names.
  return arrivalProblem(v, status, commandId, 'isolated-fixture') &&
    (!v.invalidParameters || v.invalidParameters.every(p => p.name !== 'lateRemark'));
}
