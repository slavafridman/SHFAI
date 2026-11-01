// Dedicated canonical50-v0.1 consumer. Backend imports are type-only.
import type { NativeLateStationContextV1, NativeLateStationValidationV1,
  NativeLateStationCommitV1, NativeLateStationReceiptV1, NativeLateStationProblemV1,
  NativeLateStationDraftV1 } from '../../../backend/fixture-slice/oracle-station-arrival-late-contracts.mts';
import { identity, nativeLateCapabilities, id, localTime, type IdentityResponseV1 } from './contract';
import { clean } from './current-shifts-contract';
import { exact, stationContext } from './station-arrival-contract';
import { sameLocal, uuid, arrivalProblem, type ArrivalSelection } from './stage-arrival-contract';
export type { NativeLateStationContextV1, NativeLateStationValidationV1, NativeLateStationCommitV1,
  NativeLateStationReceiptV1, NativeLateStationDraftV1 };
const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(v) &&
  localTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v));
const minutes = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v);
export function lateIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && exact(v, 'principal dataSource') && v.dataSource === 'oracle' &&
    exact(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    exact(v.principal.resourceScope, 'orgUnitIds') && v.principal.synthetic &&
    v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    v.principal.capabilities.join(',') === nativeLateCapabilities.join(',');
}
export function lateContext(v: unknown, s: ArrivalSelection): v is NativeLateStationContextV1 {
  // Reuse the ordinary shape/pair/unit/time/blocker checks, not its on-time catalog restriction.
  if (!exact(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime arrivalWindow withinArrivalWindow eligibility blockers lateReasonOptions dataSource') ||
    s.dataSource !== 'oracle-test' || v.dataSource !== 'oracle-test' ||
    !stationContext({ ...v, lateReasonOptions: [] }, s) ||
    !Array.isArray(v.lateReasonOptions) || v.lateReasonOptions.length > 1000 ||
    !v.lateReasonOptions.every(r => exact(r, 'code label') && id(r.code) && clean(r.label, 256) && r.label !== '') ||
    new Set(v.lateReasonOptions.map(r => r.code)).size !== v.lateReasonOptions.length ||
    !v.lateReasonOptions.every((r, i, list) => i === 0 || list[i - 1].code.length < r.code.length ||
      list[i - 1].code.length === r.code.length && list[i - 1].code < r.code) ||
    !exact(v.planned, 'startLocal endLocal') || !localTime(v.planned.startLocal) || !localTime(v.planned.endLocal) ||
    !exact(v.serverTime, 'instant local businessTimeZone') || !localTime(v.serverTime.local) || !instant(v.serverTime.instant) ||
    !exact(v.arrivalWindow, 'earliestLocal latestLocal')) return false;
  const observed = Date.parse(v.serverTime.local + 'Z') + Date.parse(v.serverTime.instant) % 1000;
  return v.planned.startLocal < v.planned.endLocal &&
    v.arrivalWindow.earliestLocal === v.planned.startLocal && v.arrivalWindow.latestLocal === v.planned.endLocal &&
    v.withinArrivalWindow === (observed > Date.parse(v.planned.startLocal + 'Z') &&
      observed <= Date.parse(v.planned.endLocal + 'Z') && v.serverTime.local.slice(0, 10) === v.planned.startLocal.slice(0, 10));
}
export function lateValidation(v: unknown, c: NativeLateStationContextV1): v is NativeLateStationValidationV1 {
  if (c.eligibility !== 'eligible' || !c.withinArrivalWindow ||
    !exact(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') ||
    v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId || v.dataSource !== 'oracle-test' ||
    v.businessTimeZone !== c.serverTime.businessTimeZone || !instant(v.evaluatedAt) || !instant(v.expiresAt) ||
    !localTime(v.evaluatedLocal) || !sameLocal(v.evaluatedAt, v.evaluatedLocal, c.serverTime.businessTimeZone) ||
    Date.parse(v.evaluatedLocal + 'Z') + Date.parse(v.evaluatedAt) % 1000 <= Date.parse(c.planned.startLocal + 'Z') ||
    Date.parse(v.evaluatedLocal + 'Z') + Date.parse(v.evaluatedAt) % 1000 > Date.parse(c.planned.endLocal + 'Z') ||
    v.evaluatedLocal.slice(0, 10) !== c.planned.startLocal.slice(0, 10) ||
    Date.parse(v.evaluatedAt) < Date.parse(c.serverTime.instant) ||
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) || Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) > 120000 ||
    typeof v.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    typeof v.validationToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    v.state !== 'warning-requires-confirmation' || v.confirmationRequired !== true ||
    !Array.isArray(v.warnings) || v.warnings.length !== 1 || !exact(v.warnings[0], 'code minutes') ||
    v.warnings[0].code !== 'STATION_ARRIVAL_LATE' || !minutes(v.warnings[0].minutes)) return false;
  // Check the minute/expiry boundary in the server's civil snapshot, never generate a client timestamp.
  const start = Date.parse(c.planned.startLocal + 'Z'), evaluated = Date.parse(v.evaluatedLocal + 'Z');
  const elapsed = evaluated - start + Date.parse(v.evaluatedAt) % 1000;
  return Math.floor(elapsed / 60000).toString() === v.warnings[0].minutes &&
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) + (60000 - elapsed % 60000) &&
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) + Date.parse(c.planned.endLocal + 'Z') - evaluated -
      Date.parse(v.evaluatedAt) % 1000 + 1;
}
export function lateDraft(v: unknown): v is NativeLateStationDraftV1 {
  return exact(v, 'lateReasonCode lateRemark') && id(v.lateReasonCode) && v.lateRemark === null;
}
export function lateCommand(v: unknown): v is NativeLateStationCommitV1 {
  return exact(v, 'commandId draft validationToken fingerprint confirmation operationConfirmation') && uuid(v.commandId) &&
    lateDraft(v.draft) && typeof v.validationToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v.validationToken) &&
    typeof v.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(v.fingerprint) &&
    exact(v.confirmation, 'accepted warningCodes') && v.confirmation.accepted === true &&
    Array.isArray(v.confirmation.warningCodes) && v.confirmation.warningCodes.length === 1 &&
    v.confirmation.warningCodes[0] === 'STATION_ARRIVAL_LATE' &&
    exact(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true;
}
export function lateReceipt(v: unknown, c: NativeLateStationContextV1, cmd: NativeLateStationCommitV1,
  validation: NativeLateStationValidationV1): v is NativeLateStationReceiptV1 {
  if (!lateValidation(validation, c) || !lateCommand(cmd) ||
    !exact(v, 'commandId employeeId shiftDayId outcome recorded commitAcknowledgedAt readBackVerifiedAt businessTimeZone replayed receiptPersistence partnerCompletion dataSource') ||
    v.commandId !== cmd.commandId || !uuid(v.commandId) || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
    v.dataSource !== 'oracle-test' || v.outcome !== 'oracle-test-committed' || v.replayed !== false ||
    v.receiptPersistence !== 'none' || v.partnerCompletion !== 'not-invoked' ||
    v.businessTimeZone !== validation.businessTimeZone || !instant(v.commitAcknowledgedAt) || !instant(v.readBackVerifiedAt) ||
    Date.parse(v.commitAcknowledgedAt) < Date.parse(validation.evaluatedAt) ||
    Date.parse(v.readBackVerifiedAt) < Date.parse(v.commitAcknowledgedAt) ||
    !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing stationLate') ||
    v.recorded.stageArrivalLocal !== c.recorded.stageArrivalLocal || v.recorded.briefing !== c.recorded.briefing ||
    v.recorded.stationExitLocal !== c.recorded.stationExitLocal || !localTime(v.recorded.stationArrivalLocal) ||
    v.recorded.stationArrivalLocal < validation.evaluatedLocal || v.recorded.stationArrivalLocal < c.planned.startLocal ||
    v.recorded.stationArrivalLocal > c.planned.endLocal ||
    v.recorded.stationArrivalLocal.slice(0, 10) !== validation.evaluatedLocal.slice(0, 10) ||
    (c.recorded.stageArrivalLocal !== null && v.recorded.stationArrivalLocal < c.recorded.stageArrivalLocal) ||
    !exact(v.recorded.stationLate, 'reasonCode minutes remark') ||
    v.recorded.stationLate.reasonCode !== cmd.draft.lateReasonCode || v.recorded.stationLate.remark !== null ||
    v.recorded.stationLate.minutes !== validation.warnings[0].minutes) return false;
  const recordedElapsed = Date.parse(v.recorded.stationArrivalLocal + 'Z') - Date.parse(c.planned.startLocal + 'Z');
  const ackLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: validation.businessTimeZone,
    dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(v.commitAcknowledgedAt)).replace(' ', 'T');
  return Math.floor(recordedElapsed / 60000).toString() === v.recorded.stationLate.minutes &&
    v.recorded.stationArrivalLocal <= ackLocal &&
    Date.parse(v.recorded.stationArrivalLocal + 'Z') <
      Date.parse(validation.evaluatedLocal + 'Z') + Date.parse(validation.evaluatedAt) % 1000 +
      Date.parse(validation.expiresAt) - Date.parse(validation.evaluatedAt);
}
export function lateProblem(v: unknown, status: number, commandId: string | null): v is NativeLateStationProblemV1 {
  return arrivalProblem(v, status, commandId, 'oracle-test');
}
