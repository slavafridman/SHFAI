// §§41–42 v0.1. Canonical imports are erased; no backend runtime in browser.
import type { StationArrivalContextV1, StationArrivalValidationV1, StationArrivalCommitV1,
  StationArrivalReceiptV1, StationArrivalProblemV1 } from '../../../backend/fixture-slice/station-arrival-contracts.mts';
import type { NativeStationArrivalContextV1, NativeStationArrivalValidationV1, NativeStationArrivalCommitV1,
  NativeStationArrivalReceiptV1, NativeStationArrivalProblemV1 } from '../../../backend/fixture-slice/oracle-station-arrival-contracts.mts';
import { identity, id, localTime, jointArrivalCapabilities, nativeStationCapabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
import { arrivalProblem, sameLocal, uuid, type ArrivalSelection, type ArrivalSource } from './stage-arrival-contract';
export type { StationArrivalContextV1, StationArrivalValidationV1, StationArrivalCommitV1,
  StationArrivalReceiptV1 } from '../../../backend/fixture-slice/station-arrival-contracts.mts';
export type StationContext = StationArrivalContextV1 | NativeStationArrivalContextV1;
export type StationValidation = StationArrivalValidationV1 | NativeStationArrivalValidationV1;
export type StationCommand = StationArrivalCommitV1 | NativeStationArrivalCommitV1;
export type StationReceipt = StationArrivalReceiptV1 | NativeStationArrivalReceiptV1;
export const exact = (v: unknown, names: string): v is Record<string, unknown> => obj(v) &&
  Object.keys(v).sort().join(',') === names.split(' ').sort().join(',');
const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(v) &&
  localTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v));
const minutes = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v);
const nullableTime = (v: unknown) => v === null || localTime(v);
export function stationIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && exact(v, 'principal dataSource') &&
    exact(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    exact(v.principal.resourceScope, 'orgUnitIds') &&
    v.principal.synthetic && v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    (v.dataSource === 'isolated-fixture' ? v.principal.capabilities.join(',') === jointArrivalCapabilities.join(',') :
      v.dataSource === 'oracle' && v.principal.capabilities.join(',') === nativeStationCapabilities.join(','));
}
export const stationSource = (p: unknown): ArrivalSource | null =>
  stationIdentity(p) ? p.dataSource === 'oracle' ? 'oracle-test' : 'isolated-fixture' : null;
export function stationContext(v: unknown, s: ArrivalSelection): v is StationContext {
  if (!exact(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime arrivalWindow withinArrivalWindow eligibility blockers lateReasonOptions dataSource') ||
    !['isolated-fixture', 'oracle-test'].includes(s.dataSource) || s.dataSource !== v.dataSource ||
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
    new Set(v.lateReasonOptions.map(r => r.code)).size !== v.lateReasonOptions.length ||
    (v.dataSource === 'oracle-test' && v.lateReasonOptions.length !== 0)) return false;
  return v.eligibility === 'eligible' ? v.blockers.length === 0 && v.recorded.stationArrivalLocal === null &&
    v.recorded.stationExitLocal === null : v.eligibility === 'already-recorded'
    ? v.recorded.stationArrivalLocal !== null : v.eligibility === 'deferred' && v.blockers.length > 0;
}
export function stationValidation(v: unknown, c: StationContext): v is StationValidation {
  if (!exact(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') ||
    v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId || v.dataSource !== c.dataSource ||
    v.businessTimeZone !== c.serverTime.businessTimeZone || !instant(v.evaluatedAt) || !instant(v.expiresAt) ||
    !localTime(v.evaluatedLocal) || !sameLocal(v.evaluatedAt, v.evaluatedLocal, String(v.businessTimeZone)) ||
    Date.parse(v.evaluatedAt) < Date.parse(c.serverTime.instant) ||
    !clean(v.fingerprint, 64) || !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    !clean(v.validationToken, 43) || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) || Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) > 120000 ||
    !Array.isArray(v.warnings)) return false;
  if (c.dataSource === 'oracle-test' && (v.state !== 'ready' || v.confirmationRequired !== false ||
    v.warnings.length !== 0 || v.evaluatedLocal < c.arrivalWindow.earliestLocal ||
    v.evaluatedLocal > c.arrivalWindow.latestLocal || v.evaluatedLocal > c.planned.startLocal ||
    v.evaluatedLocal > c.planned.endLocal ||
    v.evaluatedLocal.slice(0, 10) !== c.serverTime.local.slice(0, 10))) return false;
  return v.state === 'ready' ? v.confirmationRequired === false && v.warnings.length === 0 :
    v.state === 'warning-requires-confirmation' && v.confirmationRequired === true && v.warnings.length === 1 &&
    exact(v.warnings[0], 'code minutes') && v.warnings[0].code === 'STATION_ARRIVAL_LATE' && minutes(v.warnings[0].minutes);
}
export function stationCommand(v: unknown, source: ArrivalSource): v is StationCommand {
  const native = source === 'oracle-test';
  if (!exact(v, 'commandId draft validationToken fingerprint confirmation' + (native ? ' operationConfirmation' : '')) ||
    !uuid(v.commandId) || !exact(v.draft, 'lateReasonCode') ||
    !(v.draft.lateReasonCode === null || id(v.draft.lateReasonCode)) ||
    typeof v.validationToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    typeof v.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(v.fingerprint)) return false;
  return native ? v.draft.lateReasonCode === null && v.confirmation === null &&
    exact(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true :
    v.confirmation === null || (exact(v.confirmation, 'accepted warningCodes') && v.confirmation.accepted === true &&
      Array.isArray(v.confirmation.warningCodes) && v.confirmation.warningCodes.join(',') === 'STATION_ARRIVAL_LATE');
}
export function stationReceipt(v: unknown, c: StationContext, cmd: StationCommand,
  validation: StationValidation): v is StationReceipt {
  if (cmd.validationToken !== validation.validationToken || cmd.fingerprint !== validation.fingerprint ||
    !stationCommand(cmd, c.dataSource) || !stationValidation(validation, c)) return false;
  if (c.dataSource === 'oracle-test') {
    if (!exact(v, 'commandId employeeId shiftDayId outcome recorded commitAcknowledgedAt readBackVerifiedAt businessTimeZone replayed partnerCompletion dataSource receiptPersistence') ||
      v.commandId !== cmd.commandId || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
      v.outcome !== 'oracle-test-committed' || v.dataSource !== 'oracle-test' ||
      v.partnerCompletion !== 'not-invoked' || v.businessTimeZone !== validation.businessTimeZone ||
      v.replayed !== false || v.receiptPersistence !== 'none' ||
      !instant(v.commitAcknowledgedAt) || !instant(v.readBackVerifiedAt) ||
      Date.parse(v.commitAcknowledgedAt) < Date.parse(validation.evaluatedAt) ||
      Date.parse(v.readBackVerifiedAt) < Date.parse(v.commitAcknowledgedAt) ||
      !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing stationLate') ||
      v.recorded.stageArrivalLocal !== c.recorded.stageArrivalLocal || v.recorded.briefing !== c.recorded.briefing ||
      v.recorded.stationExitLocal !== null || v.recorded.stationLate !== null ||
      !localTime(v.recorded.stationArrivalLocal) || v.recorded.stationArrivalLocal < validation.evaluatedLocal ||
      v.recorded.stationArrivalLocal.slice(0, 10) !== validation.evaluatedLocal.slice(0, 10) ||
      v.recorded.stationArrivalLocal > c.planned.startLocal ||
      v.recorded.stationArrivalLocal < c.arrivalWindow.earliestLocal ||
      v.recorded.stationArrivalLocal > c.arrivalWindow.latestLocal ||
      (c.recorded.stageArrivalLocal !== null && v.recorded.stationArrivalLocal < c.recorded.stageArrivalLocal)) return false;
    const ackLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: v.businessTimeZone,
      dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(v.commitAcknowledgedAt)).replace(' ', 'T');
    return v.recorded.stationArrivalLocal <= ackLocal;
  }
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
export function stationProblem(v: unknown, status: number, commandId: string | null,
  source: ArrivalSource = 'isolated-fixture'): v is StationArrivalProblemV1 | NativeStationArrivalProblemV1 {
  // Same closed status/code/effect table as F1, with F2's narrower parameter names.
  return arrivalProblem(v, status, commandId, source) &&
    (!v.invalidParameters || v.invalidParameters.every(p => p.name !== 'lateRemark'));
}
