// U52 / C52-v0.2. Type-only canonical imports; backend owns eligibility.
import type { CancellationRecordedV1, CancellationContextV1, CancellationValidationV1, CancellationCommandV1,
  CancellationReceiptV1, CancellationProblemV1 } from '../../../backend/fixture-slice/station-exit-cancellation-contracts.mts';
export type { CancellationContextV1, CancellationValidationV1, CancellationCommandV1,
  CancellationReceiptV1, CancellationProblemV1 } from '../../../backend/fixture-slice/station-exit-cancellation-contracts.mts';
import { identity, id, localTime, fixtureCancellationCapabilities, nativeCancellationCapabilities, type IdentityResponseV1 } from './contract';
import { obj, clean, zone, unitCode } from './current-shifts-contract';
import { exact } from './station-arrival-contract';
import { sameLocal, uuid, type ArrivalSelection } from './stage-arrival-contract';
import { exitBlockerCopy } from './station-exit-contract';

export const cancellationFixtureCapabilities = fixtureCancellationCapabilities;
export const cancellationNativeCapabilities = nativeCancellationCapabilities;
export function cancellationIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && exact(v, 'principal dataSource') &&
    exact(v.principal, 'subject provider synthetic displayName roles employeeId capabilities resourceScope') &&
    exact(v.principal.resourceScope, 'orgUnitIds') && v.principal.synthetic &&
    v.principal.provider === 'synthetic' && v.principal.employeeId === null &&
    v.principal.capabilities.join(',') === (v.dataSource === 'oracle' ?
      cancellationNativeCapabilities : cancellationFixtureCapabilities).join(',');
}
export function cancellationSource(v: unknown): ArrivalSelection['dataSource'] | null {
  return cancellationIdentity(v) ? v.dataSource === 'oracle' ? 'oracle-test' : 'isolated-fixture' : null;
}
const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && localTime(v.slice(0, 19)) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const token = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);
const fingerprint = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const policy = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 2147483647;
const recorded = (v: unknown): v is CancellationRecordedV1 => exact(v, 'stageArrivalLocal stationArrivalLocal stationExitLocal briefing') &&
  [v.stageArrivalLocal, v.stationArrivalLocal, v.stationExitLocal].every(t => t === null || localTime(t)) &&
  (v.briefing === null || typeof v.briefing === 'boolean');
export const cancellationBlockerCopy = { ...exitBlockerCopy,
  ORDINARY_EXIT_REQUIRED: 'נדרשת יציאה רגילה — יציאה מוקדמת אינה ניתנת לביטול כאן',
  PARTNER_REVIEW_REQUIRED: 'נדרשת בדיקת חובות שותף — חובה נדרשת או לא ידועה מונעת פעולה',
  OUTSIDE_CANCELLATION_WINDOW: 'מחוץ לחלון ביטול רישום היציאה',
} as const;
export function cancellationContext(v: unknown, s: ArrivalSelection): v is CancellationContextV1 {
  if (!exact(v, 'employeeId shiftDayId orgUnitId planned recorded serverTime policy mode dataSource eligibility blockers') ||
    !id(v.employeeId) || !id(v.shiftDayId, 10) || v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId ||
    s.attendanceKey.shiftDayId !== s.shiftDayId || v.dataSource !== s.dataSource ||
    v.mode !== (s.dataSource === 'oracle-test' ? 'test-oracle-controlled' : 'isolated-fixture') ||
    !unitCode(v.orgUnitId) || v.orgUnitId !== s.orgUnitId ||
    !exact(v.planned, 'startLocal endLocal') || !localTime(v.planned.startLocal) || !localTime(v.planned.endLocal) ||
    v.planned.startLocal !== s.startLocal || v.planned.endLocal !== s.endLocal ||
    v.planned.startLocal > v.planned.endLocal || !recorded(v.recorded) ||
    !exact(v.serverTime, 'instant local businessTimeZone') || !instant(v.serverTime.instant) ||
    !localTime(v.serverTime.local) || typeof v.serverTime.businessTimeZone !== 'string' || !zone(v.serverTime.businessTimeZone) ||
    !sameLocal(v.serverTime.instant, v.serverTime.local, v.serverTime.businessTimeZone) ||
    !exact(v.policy, 'maxEarlyWholeMinutes maxAfterEndMinutes') ||
    !policy(v.policy.maxEarlyWholeMinutes) || !policy(v.policy.maxAfterEndMinutes) ||
    !Array.isArray(v.blockers) || new Set(v.blockers).size !== v.blockers.length ||
    !v.blockers.every(b => typeof b === 'string' && Object.hasOwn(cancellationBlockerCopy, b))) return false;
  // No original ordinary-exit/window calculation here: server-owned.
  return v.eligibility === 'eligible' ? !v.blockers.length && localTime(v.recorded.stationArrivalLocal) &&
    localTime(v.recorded.stationExitLocal) :
    v.eligibility === 'not-recorded' ? v.recorded.stationExitLocal === null :
    v.eligibility === 'deferred' && v.blockers.length > 0;
}
export function cancellationValidation(v: unknown, c: CancellationContextV1): v is CancellationValidationV1 {
  return c.eligibility === 'eligible' &&
    exact(v, 'employeeId shiftDayId state evaluatedAt evaluatedLocal expiresAt businessTimeZone validationToken fingerprint originalExitLocal warnings confirmationRequired dataSource') &&
    v.employeeId === c.employeeId && v.shiftDayId === c.shiftDayId && v.dataSource === c.dataSource &&
    v.originalExitLocal === c.recorded.stationExitLocal && localTime(v.originalExitLocal) &&
    v.state === 'ready' && v.businessTimeZone === c.serverTime.businessTimeZone &&
    instant(v.evaluatedAt) && instant(v.expiresAt) && localTime(v.evaluatedLocal) &&
    sameLocal(v.evaluatedAt, v.evaluatedLocal, v.businessTimeZone) &&
    Date.parse(v.evaluatedAt) >= Date.parse(c.serverTime.instant) &&
    Date.parse(v.expiresAt) > Date.parse(v.evaluatedAt) &&
    Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) <= 30000 &&
    token(v.validationToken) && fingerprint(v.fingerprint) && v.confirmationRequired === true &&
    Array.isArray(v.warnings) && v.warnings.length === 1 && v.warnings[0] === 'RECORDED_EXIT_WILL_BE_CLEARED';
}
export const cancellationDraft = (v: unknown): v is Record<string, never> => obj(v) && Object.keys(v).length === 0;
export function cancellationCommand(v: unknown): v is CancellationCommandV1 {
  return exact(v, 'commandId draft validationToken fingerprint warningConfirmation operationConfirmation') &&
    uuid(v.commandId) && cancellationDraft(v.draft) && token(v.validationToken) && fingerprint(v.fingerprint) &&
    exact(v.warningConfirmation, 'accepted code') && v.warningConfirmation.accepted === true &&
    v.warningConfirmation.code === 'RECORDED_EXIT_WILL_BE_CLEARED' &&
    exact(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true;
}
export function cancellationReceipt(v: unknown, c: CancellationContextV1, cmd: CancellationCommandV1,
  preparation: CancellationValidationV1): v is CancellationReceiptV1 {
  if (!cancellationCommand(cmd) || !cancellationValidation(preparation, c) ||
    cmd.validationToken !== preparation.validationToken || cmd.fingerprint !== preparation.fingerprint ||
    !exact(v, 'commandId employeeId shiftDayId originalExitLocal recorded businessTimeZone replayed receiptPersistence partnerCompletion outcome dataSource commitAcknowledgedAt readBackVerifiedAt') ||
    v.commandId !== cmd.commandId || v.employeeId !== c.employeeId || v.shiftDayId !== c.shiftDayId ||
    v.originalExitLocal !== preparation.originalExitLocal || v.dataSource !== c.dataSource ||
    v.businessTimeZone !== preparation.businessTimeZone || v.replayed !== false ||
    v.receiptPersistence !== 'none' || v.partnerCompletion !== 'not-invoked' || !recorded(v.recorded) ||
    !obj(v.recorded) || v.recorded.stationExitLocal !== null || !localTime(v.recorded.stationArrivalLocal) ||
    v.recorded.stationArrivalLocal !== c.recorded.stationArrivalLocal ||
    v.recorded.stageArrivalLocal !== c.recorded.stageArrivalLocal || v.recorded.briefing !== c.recorded.briefing) return false;
  return c.dataSource === 'isolated-fixture' ? v.outcome === 'simulated' &&
    v.commitAcknowledgedAt === null && v.readBackVerifiedAt === null :
    v.outcome === 'oracle-test-committed' && instant(v.commitAcknowledgedAt) && instant(v.readBackVerifiedAt) &&
    Date.parse(v.commitAcknowledgedAt) >= Date.parse(preparation.evaluatedAt) &&
    Date.parse(v.readBackVerifiedAt) >= Date.parse(v.commitAcknowledgedAt);
}
const cases: Record<number, Record<string, string>> = {
  400: { INVALID_REQUEST: 'correct-and-validate' }, 405: { INVALID_REQUEST: 'correct-and-validate' },
  413: { REQUEST_TOO_LARGE: 'correct-and-validate' }, 415: { UNSUPPORTED_MEDIA_TYPE: 'correct-and-validate' },
  422: { BUSINESS_VALIDATION_FAILED: 'correct-and-validate' }, 401: { UNAUTHENTICATED: 'stop' },
  403: { FORBIDDEN: 'stop', LIVE_WRITES_DISABLED: 'stop' }, 404: { SHIFT_DAY_NOT_FOUND: 'stop' },
  409: { STALE_PREPARATION: 'prepare-again', CONFIRMATION_REQUIRED: 'correct-and-validate',
    EXIT_NOT_RECORDED: 'stop', COMMAND_SCOPE_DEFERRED: 'stop', COMMAND_ID_CONFLICT: 'stop', COMMAND_IN_PROGRESS: 'stop' },
  500: { AMBIGUOUS_ATTENDANCE: 'stop', INVALID_SOURCE_DATA: 'stop', INTERNAL_ERROR: 'stop' },
  503: { DEPENDENCY_UNAVAILABLE: 'stop', DEPENDENCY_TIMEOUT: 'stop', COMMAND_OUTCOME_UNKNOWN: 'reconcile' },
};
export function cancellationProblem(v: unknown, status: number, commandId: string | null): v is CancellationProblemV1 {
  return obj(v) && exact(v, 'type title status code requestId commandId effect nextAction' +
    (v.invalidParameters === undefined ? '' : ' invalidParameters')) && v.status === status &&
    clean(v.code, 64) && Object.hasOwn(cases[status] ?? {}, v.code) && v.nextAction === cases[status][v.code] &&
    v.type === `urn:shf:problem:${v.code}` && clean(v.title, 256) && clean(v.requestId, 128) &&
    /^[A-Za-z0-9_-]+$/.test(v.requestId) && v.commandId === commandId &&
    (v.code === 'COMMAND_OUTCOME_UNKNOWN' ? v.effect === 'unknown' : ['none', 'rolled-back'].includes(String(v.effect))) &&
    (v.invalidParameters === undefined || Array.isArray(v.invalidParameters) && v.invalidParameters.length <= 10 &&
      v.invalidParameters.every(p => exact(p, 'name reason') &&
        ['employeeId', 'shiftDayId', 'commandId', 'draft', 'validationToken', 'fingerprint',
          'warningConfirmation', 'operationConfirmation', 'query', 'body'].includes(String(p.name)) &&
        ['required', 'invalid-format', 'unsupported'].includes(String(p.reason))));
}
