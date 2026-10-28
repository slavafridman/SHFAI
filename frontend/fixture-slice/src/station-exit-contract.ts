// §47 v0.1. Canonical TYPE-ONLY imports; no backend runtime in the browser.
import type { StationExitContextV1, StationExitValidationV1, StationExitCommitV1,
  StationExitReceiptV1, StationExitProblemV1 } from '../../../backend/fixture-slice/station-exit-contracts.mts';
export type { StationExitModeV1, StationExitBlockerV1, StationExitRecordedV1, StationExitContextV1,
  StationExitValidationV1, StationExitCommitV1, StationExitReceiptV1,
  StationExitProblemV1 } from '../../../backend/fixture-slice/station-exit-contracts.mts';
import { identity, id, localTime, nativeExitCapabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
import { exact } from './station-arrival-contract';
import { sameLocal, uuid, type ArrivalSelection } from './stage-arrival-contract';
export const exitInstant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  localTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v));
const policy = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 2147483647;
const nullableTime = (v: unknown) => v === null || localTime(v);
const fingerprint = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const token = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);
export function exitIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && exact(v, 'principal dataSource') && v.dataSource === 'oracle' &&
    exact(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    exact(v.principal.resourceScope, 'orgUnitIds') && v.principal.synthetic &&
    v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    v.principal.capabilities.join(',') === nativeExitCapabilities.join(',');
}
export const exitBlockerCopy = {
  ATTENDANCE_ROW_REQUIRED: 'נדרשת רשומת נוכחות קיימת — לא תיווצר רשומה חדשה',
  STATION_ARRIVAL_REQUIRED: 'נדרשת הגעה רשומה לעמדה לפני יציאה',
  MISSING_PRESENT: 'קיים דיווח חוסר — נדרשת בדיקה מחוץ לתהליך זה',
  REPORT_REVIEW_REQUIRED: 'נדרשת בדיקת דיווחים ממתינים',
  UNSUPPORTED_DAY: 'יום המשמרת אינו נתמך בתהליך יציאה רגילה זה',
  EXISTING_LATE: 'קיים דיווח איחור — תיקון אינו זמין בתהליך זה',
  FLAG_PRESENT: 'קיים סימון נוכחות המונע פעולה בתהליך זה',
  EMPLOYEE_LOCKED: 'העובד/ת נעול/ה לפעולה זו',
  OVERLAPPING_SHIFT: 'קיימת חפיפה בין משמרות — נדרשת בדיקה',
} as const;
export function exitContext(v: unknown, s: ArrivalSelection): v is StationExitContextV1 {
  if (!exact(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime policy exitWindow classification withinExitWindow eligibility blockers dataSource') ||
    s.dataSource !== 'oracle-test' || v.dataSource !== 'oracle-test' ||
    !id(v.employeeId) || !id(v.shiftDayId, 10) || v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId ||
    s.attendanceKey.shiftDayId !== s.shiftDayId || !unitCode(v.orgUnitId) || v.orgUnitId !== s.orgUnitId ||
    !exact(v.planned, 'startLocal endLocal') || !localTime(v.planned.startLocal) || !localTime(v.planned.endLocal) ||
    v.planned.startLocal > v.planned.endLocal || v.planned.startLocal !== s.startLocal || v.planned.endLocal !== s.endLocal ||
    !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing') ||
    ![v.recorded.stageArrivalLocal, v.recorded.stationArrivalLocal, v.recorded.stationExitLocal].every(nullableTime) ||
    !(v.recorded.briefing === null || typeof v.recorded.briefing === 'boolean') ||
    !exact(v.serverTime, 'instant local businessTimeZone') || !exitInstant(v.serverTime.instant) ||
    !localTime(v.serverTime.local) || !zone(v.serverTime.businessTimeZone) ||
    !sameLocal(v.serverTime.instant, v.serverTime.local, String(v.serverTime.businessTimeZone)) ||
    !exact(v.policy, 'maxEarlyWholeMinutes maxAfterEndMinutes') ||
    !policy(v.policy.maxEarlyWholeMinutes) || !policy(v.policy.maxAfterEndMinutes) ||
    !exact(v.exitWindow, 'earliestInclusiveAt latestInclusiveAt') ||
    !exitInstant(v.exitWindow.earliestInclusiveAt) || !exitInstant(v.exitWindow.latestInclusiveAt) ||
    typeof v.withinExitWindow !== 'boolean' ||
    !['ordinary', 'early-manager-decision-deferred', 'outside-window'].includes(String(v.classification)) ||
    !Array.isArray(v.blockers) || new Set(v.blockers).size !== v.blockers.length ||
    !v.blockers.every(b => typeof b === 'string' && Object.hasOwn(exitBlockerCopy, b))) return false;
  const r = v.recorded, clock = v.serverTime.local;
  if (r.stageArrivalLocal !== null && r.stationArrivalLocal !== null && String(r.stageArrivalLocal) > String(r.stationArrivalLocal) ||
    r.stationExitLocal !== null && (r.stationArrivalLocal === null || String(r.stationExitLocal) < String(r.stationArrivalLocal)) ||
    [r.stageArrivalLocal, r.stationArrivalLocal, r.stationExitLocal].some(t => t !== null && String(t) > clock)) return false;
  if (v.withinExitWindow && (Date.parse(v.serverTime.instant) < Date.parse(v.exitWindow.earliestInclusiveAt) ||
    Date.parse(v.serverTime.instant) > Date.parse(v.exitWindow.latestInclusiveAt) || v.classification !== 'ordinary')) return false;
  // Validate source coherence only. The server alone classifies/adjudicates
  // B/A, TODAY/operator bounds and business eligibility; no browser-clock rule.
  return v.eligibility === 'already-recorded' ? r.stationArrivalLocal !== null && r.stationExitLocal !== null :
    v.eligibility === 'eligible' ? !v.blockers.length && r.stationArrivalLocal !== null &&
      r.stationExitLocal === null && v.classification === 'ordinary' && v.withinExitWindow :
    v.eligibility === 'deferred' && r.stationExitLocal === null &&
      (v.blockers.length > 0 || !v.withinExitWindow || v.classification !== 'ordinary');
}
export function exitValidation(v: unknown, c: StationExitContextV1): v is StationExitValidationV1 {
  return c.eligibility === 'eligible' && c.classification === 'ordinary' && c.withinExitWindow &&
    exact(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone fingerprint validationToken warnings confirmationRequired dataSource') &&
    v.employeeId === c.employeeId && v.shiftDayId === c.shiftDayId && v.dataSource === 'oracle-test' &&
    v.businessTimeZone === c.serverTime.businessTimeZone && exitInstant(v.evaluatedAt) && exitInstant(v.expiresAt) &&
    localTime(v.evaluatedLocal) && sameLocal(v.evaluatedAt, v.evaluatedLocal, String(v.businessTimeZone)) &&
    Date.parse(v.evaluatedAt) >= Date.parse(c.serverTime.instant) &&
    Date.parse(v.evaluatedAt) >= Date.parse(c.exitWindow.earliestInclusiveAt) &&
    Date.parse(v.evaluatedAt) <= Date.parse(c.exitWindow.latestInclusiveAt) &&
    v.evaluatedLocal.slice(0, 10) === c.serverTime.local.slice(0, 10) &&
    Date.parse(v.expiresAt) > Date.parse(v.evaluatedAt) &&
    Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) <= 120000 &&
    Date.parse(v.expiresAt) <= Date.parse(c.exitWindow.latestInclusiveAt) + 1 &&
    fingerprint(v.fingerprint) && token(v.validationToken) && v.state === 'ready' &&
    v.confirmationRequired === false && Array.isArray(v.warnings) && v.warnings.length === 0;
}
export const emptyExitDraft = (v: unknown): v is Record<string, never> => obj(v) && Object.keys(v).length === 0;
export function exitCommand(v: unknown): v is StationExitCommitV1 {
  return exact(v, 'commandId draft validationToken fingerprint operationConfirmation') && uuid(v.commandId) &&
    emptyExitDraft(v.draft) && token(v.validationToken) && fingerprint(v.fingerprint) &&
    exact(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true;
}
export function exitReceipt(v: unknown, c: StationExitContextV1, cmd: StationExitCommitV1,
  validation: StationExitValidationV1): v is StationExitReceiptV1 {
  if (!exitCommand(cmd) || !exitValidation(validation, c) ||
    cmd.validationToken !== validation.validationToken || cmd.fingerprint !== validation.fingerprint) return false;
  if (!exact(v, 'commandId employeeId shiftDayId outcome recorded commitAcknowledgedAt readBackVerifiedAt businessTimeZone replayed receiptPersistence partnerCompletion dataSource') ||
    v.commandId !== cmd.commandId || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
    v.outcome !== 'oracle-test-committed' || v.dataSource !== 'oracle-test' ||
    v.businessTimeZone !== validation.businessTimeZone || v.replayed !== false ||
    v.receiptPersistence !== 'none' || v.partnerCompletion !== 'not-invoked' ||
    !exitInstant(v.commitAcknowledgedAt) || !exitInstant(v.readBackVerifiedAt) ||
    Date.parse(v.commitAcknowledgedAt) < Date.parse(validation.evaluatedAt) ||
    Date.parse(v.readBackVerifiedAt) < Date.parse(v.commitAcknowledgedAt) ||
    !exact(v.recorded, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing') ||
    v.recorded.stageArrivalLocal !== c.recorded.stageArrivalLocal ||
    v.recorded.stationArrivalLocal !== c.recorded.stationArrivalLocal || !localTime(v.recorded.stationArrivalLocal) ||
    v.recorded.briefing !== c.recorded.briefing || !localTime(v.recorded.stationExitLocal) ||
    v.recorded.stationExitLocal < validation.evaluatedLocal ||
    v.recorded.stationExitLocal < v.recorded.stationArrivalLocal ||
    v.recorded.stationExitLocal.slice(0, 10) !== validation.evaluatedLocal.slice(0, 10)) return false;
  const ackLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: validation.businessTimeZone,
    dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(v.commitAcknowledgedAt)).replace(' ', 'T');
  return v.recorded.stationExitLocal <= ackLocal;
}
const problemCases: Record<number, Record<string, string>> = {
  400: { INVALID_REQUEST: 'correct-and-validate' }, 405: { INVALID_REQUEST: 'correct-and-validate' },
  413: { REQUEST_TOO_LARGE: 'correct-and-validate' }, 415: { UNSUPPORTED_MEDIA_TYPE: 'correct-and-validate' },
  422: { BUSINESS_VALIDATION_FAILED: 'correct-and-validate' }, 401: { UNAUTHENTICATED: 'stop' },
  403: { FORBIDDEN: 'stop', LIVE_WRITES_DISABLED: 'stop' }, 404: { SHIFT_DAY_NOT_FOUND: 'stop' },
  409: { STALE_PREPARATION: 'prepare-again', ALREADY_REGISTERED: 'stop', COMMAND_SCOPE_DEFERRED: 'stop',
    COMMAND_ID_CONFLICT: 'stop', COMMAND_IN_PROGRESS: 'stop' },
  500: { AMBIGUOUS_ATTENDANCE: 'stop', INVALID_SOURCE_DATA: 'stop', INTERNAL_ERROR: 'stop' },
  503: { DEPENDENCY_UNAVAILABLE: 'stop', DEPENDENCY_TIMEOUT: 'stop', COMMAND_OUTCOME_UNKNOWN: 'reconcile' },
};
export function exitProblem(v: unknown, status: number, commandId: string | null): v is StationExitProblemV1 {
  if (!obj(v) || !exact(v, 'type title status code requestId commandId effect nextAction' +
    (v.invalidParameters === undefined ? '' : ' invalidParameters')) || v.status !== status ||
    !clean(v.code, 64) || !Object.hasOwn(problemCases[status] ?? {}, v.code) ||
    v.nextAction !== problemCases[status][v.code] || v.type !== `urn:shf:problem:${v.code}` ||
    !clean(v.title, 256) || !clean(v.requestId, 128) || !/^[A-Za-z0-9_-]+$/.test(v.requestId) ||
    v.commandId !== commandId ||
    (v.code === 'COMMAND_OUTCOME_UNKNOWN' ? v.effect !== 'unknown' : !['none', 'rolled-back'].includes(String(v.effect)))) return false;
  return v.invalidParameters === undefined || Array.isArray(v.invalidParameters) && v.invalidParameters.length <= 20 &&
    v.invalidParameters.every(p => exact(p, 'name reason') &&
      ['employeeId', 'shiftDayId', 'commandId', 'draft', 'validationToken', 'fingerprint', 'operationConfirmation', 'query', 'body'].includes(String(p.name)) &&
      ['required', 'invalid-format', 'unsupported'].includes(String(p.reason)));
}
