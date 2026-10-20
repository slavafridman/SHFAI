// Canonical §38/40 v0.1 imports are erased. No backend runtime in the browser.
import type { StageArrivalContextDraftV1, StageArrivalValidationDraftV1,
  StageArrivalReceiptDraftV1, StageArrivalCommitDraftV1, StageArrivalProblemDraftV1
} from '../../../backend/fixture-slice/stage-arrival-contracts.mts';
import { id, localTime, identity, f1Capabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
export type { StageArrivalContextDraftV1, StageArrivalValidationDraftV1,
  StageArrivalReceiptDraftV1, StageArrivalCommitDraftV1, StageArrivalDraftV1
} from '../../../backend/fixture-slice/stage-arrival-contracts.mts';
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
  return identity(v) && keys(v, 'principal dataSource') &&
    keys(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    keys(v.principal.resourceScope, 'orgUnitIds') &&
    v.dataSource === 'isolated-fixture' && v.principal.synthetic &&
    v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    v.principal.capabilities.join(',') === f1Capabilities.join(',');
}
export interface ArrivalSelection {
  employeeId: string; shiftDayId: string; attendanceKey: { shiftDayId: string };
  orgUnitId: string; name: string; startLocal: string; endLocal: string;
  dataSource: 'isolated-fixture'; actor: string;
}
export const actorBinding = (p: IdentityResponseV1) => JSON.stringify(p);
export function arrivalContext(v: unknown, s: ArrivalSelection): v is StageArrivalContextDraftV1 {
  if (!keys(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime eligibility blockers lateReasonOptions dataSource') ||
    v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId || !id(v.employeeId) || !id(v.shiftDayId, 10) ||
    s.attendanceKey.shiftDayId !== s.shiftDayId || v.orgUnitId !== s.orgUnitId || !unitCode(v.orgUnitId) ||
    v.dataSource !== 'isolated-fixture' || !keys(v.planned, 'startLocal endLocal') ||
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
  if (v.eligibility === 'eligible') return !v.blockers.length &&
    v.recorded.stageArrivalLocal === null && v.recorded.stationArrivalLocal === null &&
    v.recorded.stationExitLocal === null && v.recorded.briefing !== true;
  return (v.eligibility === 'already-recorded' && v.recorded.stageArrivalLocal !== null) ||
    (v.eligibility === 'deferred' && v.blockers.length > 0);
}
export function arrivalValidation(v: unknown, c: StageArrivalContextDraftV1): v is StageArrivalValidationDraftV1 {
  if (!keys(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') ||
    v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId || v.dataSource !== c.dataSource ||
    v.businessTimeZone !== c.serverTime.businessTimeZone || !instant(v.evaluatedAt) || !instant(v.expiresAt) ||
    !localTime(v.evaluatedLocal) || !clean(v.fingerprint, 64) || !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    !clean(v.validationToken, 43) || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
    Date.parse(v.expiresAt) <= Date.parse(v.evaluatedAt) ||
    Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) > 120000 || !Array.isArray(v.warnings)) return false;
  return (v.state === 'ready' && v.confirmationRequired === false && v.warnings.length === 0) ||
    (v.state === 'warning-requires-confirmation' && v.confirmationRequired === true &&
      v.warnings.length === 1 && keys(v.warnings[0], 'code minutes') &&
      v.warnings[0].code === 'STAGE_ARRIVAL_LATE' && minutes(v.warnings[0].minutes));
}
export function arrivalReceipt(v: unknown, c: StageArrivalContextDraftV1, cmd: StageArrivalCommitDraftV1,
  validation: StageArrivalValidationDraftV1): v is StageArrivalReceiptDraftV1 {
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
export function arrivalProblem(v: unknown, status: number, commandId: string | null): v is StageArrivalProblemDraftV1 {
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
        'fingerprint', 'confirmation', 'query', 'body'].includes(String(p.name)) &&
      ['required', 'invalid-format', 'unsupported'].includes(String(p.reason))));
}
