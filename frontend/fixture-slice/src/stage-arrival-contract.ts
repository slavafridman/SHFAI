// Canonical §38/40 v0.1 imports are erased. No backend runtime in the browser.
import type { StageArrivalContextDraftV1, StageArrivalValidationDraftV1,
  StageArrivalReceiptDraftV1, StageArrivalCommitDraftV1, StageArrivalProblemDraftV1
} from '../../../backend/fixture-slice/stage-arrival-contracts.mts';
import type { NativeStageArrivalContextV1, NativeStageArrivalValidationV1, NativeStageArrivalReceiptV1,
  NativeStageArrivalCommitV1, NativeStageArrivalProblemV1 } from '../../../backend/fixture-slice/oracle-stage-arrival-contracts.mts';
import { id, localTime, identity, f1Capabilities, jointArrivalCapabilities, nativeArrivalCapabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
export type { StageArrivalContextDraftV1, StageArrivalValidationDraftV1,
  StageArrivalReceiptDraftV1, StageArrivalCommitDraftV1, StageArrivalDraftV1
} from '../../../backend/fixture-slice/stage-arrival-contracts.mts';
export type ArrivalContext = StageArrivalContextDraftV1 | NativeStageArrivalContextV1;
export type ArrivalValidation = StageArrivalValidationDraftV1 | NativeStageArrivalValidationV1;
export type ArrivalReceipt = StageArrivalReceiptDraftV1 | NativeStageArrivalReceiptV1;
export type ArrivalCommand = StageArrivalCommitDraftV1 | NativeStageArrivalCommitV1;
export type ArrivalSource = ArrivalContext['dataSource'];
const keys = (v: unknown, names: string): v is Record<string, unknown> => obj(v) &&
  Object.keys(v).sort().join(',') === names.split(' ').sort().join(',');
const nullableTime = (v: unknown) => v === null || localTime(v);
export const uuid = (v: unknown): v is string => typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const minutes = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v);
const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(v) &&
  localTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v));
export function f1Identity(v: unknown): v is IdentityResponseV1 {
  return arrivalIdentity(v) && v.dataSource === 'isolated-fixture';
}
export function arrivalIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && keys(v, 'principal dataSource') &&
    keys(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    keys(v.principal.resourceScope, 'orgUnitIds') &&
    v.principal.synthetic &&
    v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    ((v.dataSource === 'isolated-fixture' && [f1Capabilities.join(','), jointArrivalCapabilities.join(',')].includes(v.principal.capabilities.join(','))) ||
      (v.dataSource === 'oracle' && v.principal.capabilities.join(',') === nativeArrivalCapabilities.join(',')));
}
export const arrivalSource = (p: unknown): ArrivalSource | null =>
  arrivalIdentity(p) ? p.dataSource === 'oracle' ? 'oracle-test' : 'isolated-fixture' : null;
export interface ArrivalSelection {
  employeeId: string; shiftDayId: string; attendanceKey: { shiftDayId: string };
  orgUnitId: string; name: string; startLocal: string; endLocal: string;
  dataSource: ArrivalSource; actor: string;
}
export const actorBinding = (p: IdentityResponseV1) => JSON.stringify(p);
// Native clock strings must describe the SAME instant in the declared zone.
export function sameLocal(utc: string, local: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(utc));
  const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${p['year']}-${p['month']}-${p['day']}T${p['hour']}:${p['minute']}:${p['second']}` === local;
}
export function arrivalContext(v: unknown, s: ArrivalSelection): v is ArrivalContext {
  if (!keys(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime eligibility blockers lateReasonOptions dataSource') ||
    v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId || !id(v.employeeId) || !id(v.shiftDayId, 10) ||
    s.attendanceKey.shiftDayId !== s.shiftDayId || v.orgUnitId !== s.orgUnitId || !unitCode(v.orgUnitId) ||
    !['isolated-fixture', 'oracle-test'].includes(s.dataSource) || v.dataSource !== s.dataSource || !keys(v.planned, 'startLocal endLocal') ||
    !localTime(v.planned.startLocal) || !localTime(v.planned.endLocal) || v.planned.endLocal < v.planned.startLocal ||
    v.planned.startLocal !== s.startLocal || v.planned.endLocal !== s.endLocal ||
    !keys(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing') ||
    ![v.recorded.stageArrivalLocal, v.recorded.stationArrivalLocal, v.recorded.stationExitLocal].every(nullableTime) ||
    !(v.recorded.briefing === null || typeof v.recorded.briefing === 'boolean') ||
    !keys(v.serverTime, 'instant local businessTimeZone') || !instant(v.serverTime.instant) ||
    !localTime(v.serverTime.local) || !zone(v.serverTime.businessTimeZone) ||
    !Array.isArray(v.blockers) || new Set(v.blockers).size !== v.blockers.length ||
    !v.blockers.every(b => ['ATTENDANCE_ROW_REQUIRED', 'MISSING_PRESENT', 'REPORT_REVIEW_REQUIRED',
      'UNSUPPORTED_DAY', 'DEPENDENT_ATTENDANCE_PRESENT', 'EXISTING_STAGE_LATE', 'BRIEFING_PRESENT'].includes(b)) ||
    !Array.isArray(v.lateReasonOptions) || v.lateReasonOptions.length > 100 ||
    !v.lateReasonOptions.every(r => keys(r, 'code label') && id(r.code) && (r.label === null || clean(r.label, 256))) ||
    new Set(v.lateReasonOptions.map(r => r.code)).size !== v.lateReasonOptions.length) return false;
  if (v.dataSource === 'oracle-test' && (v.lateReasonOptions.length !== 0 ||
    !sameLocal(v.serverTime.instant, v.serverTime.local, String(v.serverTime.businessTimeZone)))) return false;
  if (v.eligibility === 'eligible') return !v.blockers.length &&
    v.recorded.stageArrivalLocal === null && v.recorded.stationArrivalLocal === null &&
    v.recorded.stationExitLocal === null && v.recorded.briefing !== true;
  return (v.eligibility === 'already-recorded' && v.recorded.stageArrivalLocal !== null) ||
    (v.eligibility === 'deferred' && v.blockers.length > 0);
}
export function arrivalValidation(v: unknown, c: ArrivalContext): v is ArrivalValidation {
  if (!keys(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') ||
    v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId || v.dataSource !== c.dataSource ||
    v.businessTimeZone !== c.serverTime.businessTimeZone || !instant(v.evaluatedAt) || !instant(v.expiresAt) ||
    !localTime(v.evaluatedLocal) || !clean(v.fingerprint, 64) || !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    !clean(v.validationToken, 43) || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) ||
    Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) > 120000 || !Array.isArray(v.warnings)) return false;
  if (c.dataSource === 'oracle-test' && (v.state !== 'ready' || v.confirmationRequired !== false ||
    v.warnings.length !== 0 || !sameLocal(v.evaluatedAt, v.evaluatedLocal, v.businessTimeZone) ||
    Date.parse(v.evaluatedAt) < Date.parse(c.serverTime.instant))) return false;
  return (v.state === 'ready' && v.confirmationRequired === false && v.warnings.length === 0) ||
    (v.state === 'warning-requires-confirmation' && v.confirmationRequired === true &&
      v.warnings.length === 1 && keys(v.warnings[0], 'code minutes') &&
      v.warnings[0].code === 'STAGE_ARRIVAL_LATE' && minutes(v.warnings[0].minutes));
}
export function arrivalCommand(v: unknown, source: ArrivalSource): v is ArrivalCommand {
  const native = source === 'oracle-test';
  if (!keys(v, 'commandId draft validationToken fingerprint confirmation' + (native ? ' operationConfirmation' : '')) ||
    !uuid(v.commandId) || !keys(v.draft, 'lateReasonCode lateRemark') ||
    !(v.draft.lateReasonCode === null || id(v.draft.lateReasonCode)) ||
    !(v.draft.lateRemark === null || clean(v.draft.lateRemark, 500)) ||
    typeof v.validationToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    typeof v.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(v.fingerprint)) return false;
  return native ? v.draft.lateReasonCode === null && v.draft.lateRemark === null && v.confirmation === null &&
    keys(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true :
    v.confirmation === null || (keys(v.confirmation, 'accepted warningCodes') && v.confirmation.accepted === true &&
      Array.isArray(v.confirmation.warningCodes) && v.confirmation.warningCodes.join(',') === 'STAGE_ARRIVAL_LATE');
}
export function arrivalReceipt(v: unknown, c: ArrivalContext, cmd: ArrivalCommand,
  validation: ArrivalValidation): v is ArrivalReceipt {
  if (cmd.validationToken !== validation.validationToken || cmd.fingerprint !== validation.fingerprint ||
    validation.employeeId !== c.employeeId || validation.shiftDayId !== c.shiftDayId) return false;
  if (c.dataSource === 'oracle-test') {
    if (!arrivalCommand(cmd, c.dataSource) || !arrivalValidation(validation, c) ||
      !keys(v, 'commandId employeeId shiftDayId outcome recorded commitAcknowledgedAt readBackVerifiedAt businessTimeZone replayed partnerCompletion dataSource receiptPersistence') ||
      v.commandId !== cmd.commandId || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
      v.outcome !== 'oracle-test-committed' || v.dataSource !== 'oracle-test' ||
      v.partnerCompletion !== 'not-invoked' || v.businessTimeZone !== validation.businessTimeZone ||
      v.replayed !== false || v.receiptPersistence !== 'none' ||
      !instant(v.commitAcknowledgedAt) || !instant(v.readBackVerifiedAt) ||
      Date.parse(v.commitAcknowledgedAt) < Date.parse(validation.evaluatedAt) ||
      Date.parse(v.readBackVerifiedAt) < Date.parse(v.commitAcknowledgedAt) ||
      !keys(v.recorded, 'stageArrivalLocal briefing stageLate') || !localTime(v.recorded.stageArrivalLocal) ||
      v.recorded.stageArrivalLocal < validation.evaluatedLocal ||
      v.recorded.stageArrivalLocal.slice(0, 10) !== validation.evaluatedLocal.slice(0, 10) ||
      v.recorded.briefing !== false || v.recorded.stageLate !== null) return false;
    // Stage seconds may precede COMMIT ACK; they must not be later than ACK.
    const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: v.businessTimeZone,
      dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(v.commitAcknowledgedAt)).replace(' ', 'T');
    return v.recorded.stageArrivalLocal <= parts;
  }
  if (validation.dataSource !== 'isolated-fixture' || !arrivalCommand(cmd, 'isolated-fixture')) return false;
  if (!keys(v, 'commandId employeeId shiftDayId outcome recorded committedAt businessTimeZone replayed partnerCompletion dataSource') ||
    v.commandId !== cmd.commandId || !uuid(v.commandId) || v.employeeId !== c.employeeId ||
    v.shiftDayId !== c.shiftDayId || v.outcome !== 'fixture-committed' || v.dataSource !== 'isolated-fixture' ||
    v.partnerCompletion !== 'not-invoked' || v.businessTimeZone !== validation.businessTimeZone ||
    typeof v.replayed !== 'boolean' || !instant(v.committedAt) ||
    Date.parse(v.committedAt) < Date.parse(validation.evaluatedAt) ||
    Date.parse(v.committedAt) >= Date.parse(validation.expiresAt) ||
    !keys(v.recorded, 'stageArrivalLocal briefing stageLate') ||
    !localTime(v.recorded.stageArrivalLocal) || v.recorded.briefing !== false) return false;
  const late = v.recorded.stageLate;
  return validation.confirmationRequired
    ? keys(late, 'reasonCode minutes remark') && late.reasonCode === cmd.draft.lateReasonCode &&
      minutes(late.minutes) && late.minutes === validation.warnings[0].minutes && late.remark === cmd.draft.lateRemark
    : late === null && cmd.draft.lateReasonCode === null && cmd.draft.lateRemark === null;
}
const cases: Record<number, Record<string, string>> = {
  400: { INVALID_REQUEST: 'correct-and-validate' }, 405: { INVALID_REQUEST: 'correct-and-validate' },
  413: { REQUEST_TOO_LARGE: 'correct-and-validate' }, 415: { UNSUPPORTED_MEDIA_TYPE: 'correct-and-validate' },
  401: { UNAUTHENTICATED: 'stop' }, 403: { FORBIDDEN: 'stop', LIVE_WRITES_DISABLED: 'stop' },
  404: { SHIFT_DAY_NOT_FOUND: 'stop' }, 422: { BUSINESS_VALIDATION_FAILED: 'correct-and-validate' },
  409: { STALE_PREPARATION: 'prepare-again', CONFIRMATION_REQUIRED: 'prepare-again', ALREADY_REGISTERED: 'stop',
    COMMAND_SCOPE_DEFERRED: 'stop', COMMAND_ID_CONFLICT: 'stop', COMMAND_IN_PROGRESS: 'stop' },
  503: { DEPENDENCY_UNAVAILABLE: 'stop', DEPENDENCY_TIMEOUT: 'stop', COMMAND_OUTCOME_UNKNOWN: 'reconcile' },
  500: { AMBIGUOUS_ATTENDANCE: 'stop', INVALID_SOURCE_DATA: 'stop', INTERNAL_ERROR: 'stop' },
};
export function arrivalProblem(v: unknown, status: number, commandId: string | null,
  source: ArrivalSource = 'isolated-fixture'): v is StageArrivalProblemDraftV1 | NativeStageArrivalProblemV1 {
  if (!obj(v)) return false;
  const base = 'type title status code requestId commandId effect nextAction';
  if (!keys(v, base + (v.invalidParameters === undefined ? '' : ' invalidParameters')) ||
    v.status !== status || !clean(v.code, 64) || v.type !== `urn:shf:problem:${v.code}` ||
    !cases[status]?.[v.code] || v.nextAction !== cases[status][v.code] ||
    !clean(v.title, 256) || !clean(v.requestId, 128) || !/^[A-Za-z0-9_-]+$/.test(v.requestId) ||
    v.commandId !== commandId ||
    (v.code === 'COMMAND_OUTCOME_UNKNOWN' ? v.effect !== 'unknown' : !['none', 'rolled-back'].includes(String(v.effect)))) return false;
  return v.invalidParameters === undefined || (Array.isArray(v.invalidParameters) && v.invalidParameters.length <= 20 &&
    v.invalidParameters.every(p => keys(p, 'name reason') &&
      ['employeeId', 'shiftDayId', 'lateReasonCode', 'lateRemark', 'commandId', 'draft', 'validationToken',
        'fingerprint', 'confirmation', 'query', 'body', ...(source === 'oracle-test' ? ['operationConfirmation'] : [])].includes(String(p.name)) &&
      ['required', 'invalid-format', 'unsupported'].includes(String(p.reason))));
}
