// §49-v0.1 consumer guards. Canonical types are erased; no backend runtime imports.
import type { IdentityResponseV1 } from './contract';
import { identity, id, localTime } from './contract';
import { zone, unitCode } from './current-shifts-contract';
import { sameLocal } from './stage-arrival-contract';
import type {
  ShiftManagementContextV1, ShiftPreparationV1, ShiftDraftV1, ShiftEffectV1,
  ShiftStateV1, ShiftReceiptV1, CsvShiftPreviewV1, CsvShiftEncodingV1,
  ShiftCommandV1, CsvShiftCommandV1, ShiftWarningCodeV1, ShiftManagementProblemV1,
  ShiftOperationKindV1, ShiftManagementSourceV1,
} from '../../../backend/fixture-slice/shift-management-contracts.mts';
export type {
  ShiftManagementContextV1, ShiftPreparationV1, ShiftDraftV1, ShiftEffectV1,
  ShiftStateV1, ShiftReceiptV1, CsvShiftPreviewV1, CsvShiftEncodingV1,
  ShiftCommandV1, CsvShiftCommandV1, ShiftWarningCodeV1, ShiftManagementProblemV1,
  ShiftOperationKindV1, ShiftManagementSourceV1,
};
export const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
export const exact = (v: unknown, keys: string): v is Record<string, unknown> =>
  object(v) && Object.keys(v).sort().join(' ') === keys.split(' ').filter(Boolean).sort().join(' ');
const plain = (v: unknown, max: number, min = 1): v is string =>
  typeof v === 'string' && [...v].length >= min && [...v].length <= max &&
  !/[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF]/u.test(v);
const bytes = (v: unknown, max: number) => plain(v, max) && new TextEncoder().encode(v).length <= max;
export const minuteLocal = (v: unknown): v is string => localTime(v) && v.endsWith(':00');
export const instant = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(v) && localTime(v.slice(0, 19));
const instantKey = (v: string) => v.slice(0, 19) + (v.includes('.') ? v.slice(20, -1) : '').padEnd(9, '0');
const afterInstant = (a: string, b: string) => instantKey(a) > instantKey(b);
const token = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export const commandId = (v: unknown): v is string => typeof v === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const minutes = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(v);
const remark = (v: unknown) => v === null || plain(v, 500);
export const warningCodes = ['DURATION_CHANGED', 'SOURCE_BECOMES_SHF', 'OVERNIGHT_NORMALIZED',
  'LOGICAL_CANCEL_PRESERVES_HISTORY'] as const satisfies readonly ShiftWarningCodeV1[];
export const columns = ['personalId', 'activityCode', 'date', 'location', 'startTime', 'endTime'] as const;
export const ruleCodes = [
  'EMPLOYEE_NOT_ACTIVE', 'UNSUPPORTED_DAY', 'UNSUPPORTED_SOURCE', 'INVALID_TIME_RANGE',
  'AMBIGUOUS_LOCAL_TIME', 'OFFSET_TRANSITION_UNSUPPORTED', 'PAST_OR_STARTED_SHIFT',
  'OUTSIDE_SCHEDULE_WEEK', 'DURATION_OUT_OF_POLICY', 'SHIFT_OVERLAP_OR_GAP', 'SITE_ACTIVITY_MISMATCH',
  'HOME_POLICY_UNAVAILABLE', 'UNSUPPORTED_MINUTE_ACCOUNTING', 'DEPENDENT_FLOW_UNSUPPORTED',
  'ATTENDANCE_PRESENT', 'MISSING_PRESENT', 'REPORT_REVIEW_REQUIRED', 'EXCHANGE_PRESENT',
  'POOL_DEPENDENCY_PRESENT', 'PARTNER_REQUIRED_OR_UNKNOWN', 'NO_CHANGE', 'CSV_INVALID_HEADER',
  'CSV_INVALID_ROW', 'CSV_DUPLICATE', 'CSV_EMPLOYEE_MISMATCH', 'CSV_LIMIT_EXCEEDED', 'TEXT_NOT_REPRESENTABLE',
] as const;
const member = (v: unknown, values: readonly string[]): v is string => typeof v === 'string' && values.includes(v);
const set = (v: unknown, values: readonly string[]): v is string[] =>
  Array.isArray(v) && v.every(x => member(x, values)) && new Set(v).size === v.length;
export function equal(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  if (object(a) && object(b)) return Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
  return a === b;
}
export const sameWarnings = (a: readonly string[], b: readonly string[]) =>
  new Set(a).size === a.length && new Set(b).size === b.length &&
  a.length === b.length && a.every(x => b.includes(x));
export function managementIdentity(v: unknown): v is IdentityResponseV1 {
  return identity(v) && exact(v, 'principal dataSource') &&
    exact(v.principal, 'subject provider synthetic displayName roles capabilities employeeId resourceScope') &&
    exact(v.principal.resourceScope, 'orgUnitIds');
}
export const managementSource = (p: IdentityResponseV1): ShiftManagementSourceV1 =>
  p.dataSource === 'oracle' ? 'oracle-test' : 'isolated-fixture';
export function canManage(p: IdentityResponseV1 | null, kind?: ShiftOperationKindV1 | 'csv-preview'): boolean {
  if (!p) return false;
  const c = p.principal.capabilities;
  const required = ['shift-management:prepare'];
  if (p.dataSource === 'oracle') required.push('shift-management:test-oracle-write');
  if (kind === 'csv-preview' || kind === 'csv-create') required.push('shift-management:create', 'shift-management:csv-preview');
  if (kind === 'csv-create') required.push('shift-management:csv-apply');
  else if (kind && kind !== 'csv-preview') required.push(`shift-management:${kind}`);
  return required.every(v => c.some(x => x === v));
}
export function shiftState(v: unknown): v is ShiftStateV1;
export function shiftState(v: unknown, nullableId: boolean): v is ShiftEffectV1['after'];
export function shiftState(v: unknown, nullableId = false): v is ShiftEffectV1['after'] {
  return exact(v, 'shiftDayId status startLocal endLocal activityCode siteId workLocation paidMinutes workMinutes source') &&
    ((nullableId && v.shiftDayId === null) || id(v.shiftDayId, 10)) &&
    member(v.status, ['scheduled', 'cancelled']) && minuteLocal(v.startLocal) && minuteLocal(v.endLocal) &&
    v.startLocal < v.endLocal && id(v.activityCode) && id(v.siteId) &&
    member(v.workLocation, ['home', 'site']) && minutes(v.paidMinutes) && minutes(v.workMinutes) && bytes(v.source, 15);
}
function options(v: unknown, numeric: boolean): boolean {
  return Array.isArray(v) && v.length <= 100 && v.every((o, i) =>
    exact(o, 'code label') && (numeric ? id(o.code) : bytes(o.code, 10)) &&
    (o.label === null || plain(o.label, 256, 0)) &&
    (!numeric || !i || BigInt(v[i - 1].code) < BigInt(String(o.code)))) &&
    new Set(v.map(o => o.code)).size === v.length;
}
export function managementContext(v: unknown, employeeId: string, dayId: string | null,
  p: IdentityResponseV1): v is ShiftManagementContextV1 {
  if (!exact(v, 'contractVersion employeeId employee selected eligibility blockers siteId activityOptions startEndReasonOptions cancelReasonOptions workLocationOptions limits serverTime businessTimeZone mode dataSource') ||
    v.contractVersion !== '49-v0.1' || !id(employeeId) || v.employeeId !== employeeId ||
    v.dataSource !== managementSource(p) ||
    v.mode !== (v.dataSource === 'oracle-test' ? 'test-oracle-controlled' : 'isolated-fixture') ||
    !exact(v.employee, 'firstName lastName orgUnitId') || !plain(v.employee.firstName, 40, 0) ||
    !plain(v.employee.lastName, 40, 0) || !unitCode(v.employee.orgUnitId) ||
    !p.principal.resourceScope.orgUnitIds.includes(v.employee.orgUnitId) ||
    !id(v.siteId) || !zone(v.businessTimeZone) || !exact(v.serverTime, 'instant local') ||
    !instant(v.serverTime.instant) || !localTime(v.serverTime.local) ||
    !sameLocal(v.serverTime.instant, v.serverTime.local, String(v.businessTimeZone)) ||
    !exact(v.limits, 'csvBytes csvRows atomicApply') || v.limits.csvBytes !== 1048576 ||
    v.limits.csvRows !== 100 || v.limits.atomicApply !== true ||
    !options(v.activityOptions, true) || !options(v.startEndReasonOptions, true) ||
    !options(v.cancelReasonOptions, false) || !set(v.workLocationOptions, ['home', 'site']) ||
    !set(v.blockers, ruleCodes)) return false;
  if (v.selected !== null && !shiftState(v.selected)) return false;
  if (dayId === null ? v.selected !== null : v.selected === null || v.selected.shiftDayId !== dayId) return false;
  if (v.dataSource === 'oracle-test' && v.selected && !member(v.selected.source, ['WFM', 'SHF', 'fExtra'])) return false;
  return v.eligibility === 'supported' ? v.blockers.length === 0 && (!v.selected || v.selected.status === 'scheduled') :
    v.eligibility === 'deferred' ? v.blockers.length > 0 :
    v.eligibility === 'already-cancelled' && !!v.selected && v.selected.status === 'cancelled';
}
export function draft(v: unknown): v is ShiftDraftV1 {
  if (!object(v)) return false;
  if (v.kind === 'cancel') return exact(v, 'kind shiftDayId reasonCode remark') &&
    id(v.shiftDayId, 10) && bytes(v.reasonCode, 10) && remark(v.remark);
  if (!minuteLocal(v.startLocal) || !minuteLocal(v.endLocal) || v.startLocal >= v.endLocal ||
    !id(v.activityCode) || !member(v.workLocation, ['home', 'site'])) return false;
  return v.kind === 'create' ? exact(v, 'kind startLocal endLocal activityCode workLocation remark') && remark(v.remark) :
    v.kind === 'change' && exact(v, 'kind shiftDayId startLocal endLocal activityCode workLocation startReasonCode endReasonCode') &&
    id(v.shiftDayId, 10) && [v.startReasonCode, v.endReasonCode].every(x => x === null || id(x));
}
function effect(v: unknown, csv = false): v is ShiftEffectV1 {
  if (!(exact(v, 'row before after warningCodes') && Number.isInteger(v.row) &&
    (csv ? Number(v.row) >= 2 && Number(v.row) <= 101 : v.row === 1) &&
    (v.before === null || shiftState(v.before)) && shiftState(v.after, v.before === null) &&
    set(v.warningCodes, warningCodes))) return false;
  const expected: string[] = [];
  if (v.before) {
    if (v.before.source === 'WFM' && v.after.source === 'SHF') expected.push('SOURCE_BECOMES_SHF');
    if (v.after.status === 'cancelled') expected.push('LOGICAL_CANCEL_PRESERVES_HISTORY');
    else if (v.before.paidMinutes !== v.after.paidMinutes) expected.push('DURATION_CHANGED');
  }
  if (csv && v.warningCodes.includes('OVERNIGHT_NORMALIZED')) expected.push('OVERNIGHT_NORMALIZED');
  return sameWarnings(v.warningCodes, expected);
}
function draftEffect(e: ShiftEffectV1, d: ShiftDraftV1, c: ShiftManagementContextV1): boolean {
  if (!equal(e.before, c.selected) || e.after.siteId !== c.siteId) return false;
  if (d.kind === 'cancel') return !!e.before && e.after.status === 'cancelled' &&
    equal(e.after, { ...e.before, status: 'cancelled', source: e.before.source === 'WFM' ? 'SHF' : e.before.source });
  if (e.after.startLocal !== d.startLocal || e.after.endLocal !== d.endLocal ||
    e.after.activityCode !== d.activityCode || e.after.workLocation !== d.workLocation ||
    e.after.status !== 'scheduled') return false;
  return d.kind === 'create' ? e.before === null && e.after.shiftDayId === null && e.after.source === 'fExtra' :
    !!e.before && e.before.shiftDayId === d.shiftDayId && e.after.shiftDayId === d.shiftDayId &&
    e.after.source === (e.before.source === 'WFM' ? 'SHF' : e.before.source);
}
export function preparation(v: unknown, c: ShiftManagementContextV1, d: ShiftDraftV1): v is ShiftPreparationV1 {
  return exact(v, 'contractVersion employeeId validationToken fingerprint expiresAt effects businessTimeZone dataSource') &&
    v.contractVersion === '49-v0.1' && v.employeeId === c.employeeId && v.dataSource === c.dataSource &&
    v.businessTimeZone === c.businessTimeZone && token(v.validationToken) && hash(v.fingerprint) &&
    instant(v.expiresAt) && afterInstant(v.expiresAt, c.serverTime.instant) &&
    Array.isArray(v.effects) && v.effects.length === 1 && effect(v.effects[0]) &&
    draftEffect(v.effects[0], d, c);
}
export function csvPreview(v: unknown, c: ShiftManagementContextV1, encoding: CsvShiftEncodingV1): v is CsvShiftPreviewV1 {
  if (!exact(v, 'contractVersion employeeId encoding rows businessTimeZone dataSource state previewToken fingerprint expiresAt') ||
    v.contractVersion !== '49-v0.1' || v.employeeId !== c.employeeId || v.dataSource !== c.dataSource ||
    v.businessTimeZone !== c.businessTimeZone || v.encoding !== encoding ||
    !Array.isArray(v.rows) || !v.rows.length || v.rows.length > 100 ||
    !v.rows.every((r, i) => exact(r, 'line effect errors') && r.line === i + 2 &&
      (r.effect === null || effect(r.effect, true) && r.effect.row === r.line && r.effect.before === null &&
        r.effect.after.shiftDayId === null && r.effect.after.siteId === c.siteId &&
        r.effect.after.status === 'scheduled' && r.effect.after.source === 'fExtra') &&
      Array.isArray(r.errors) && r.errors.length <= 6 &&
      r.errors.every(e => exact(e, 'column code') && member(e.column, [...columns, 'row']) && member(e.code, ruleCodes)) &&
      new Set(r.errors.map(e => `${e.column}:${e.code}`)).size === r.errors.length)) return false;
  const invalid = v.rows.some(r => r.errors.length || r.effect === null);
  return v.state === 'ready' ? !invalid && token(v.previewToken) && hash(v.fingerprint) &&
    instant(v.expiresAt) && afterInstant(v.expiresAt, c.serverTime.instant) :
    v.state === 'invalid' && invalid && v.previewToken === null && v.fingerprint === null && v.expiresAt === null;
}
export const warningsFor = (effects: readonly ShiftEffectV1[]): ShiftWarningCodeV1[] =>
  warningCodes.filter(w => effects.some(e => e.warningCodes.includes(w)));
export function command(v: unknown, csv = false): v is ShiftCommandV1 | CsvShiftCommandV1 {
  return exact(v, `commandId ${csv ? 'previewToken' : 'draft validationToken'} fingerprint operationConfirmation acknowledgedWarningCodes`) &&
    commandId(v.commandId) && token(v[csv ? 'previewToken' : 'validationToken']) && hash(v.fingerprint) &&
    (csv || draft(v.draft)) && exact(v.operationConfirmation, 'accepted') && v.operationConfirmation.accepted === true &&
    set(v.acknowledgedWarningCodes, warningCodes);
}
export interface ReceiptBinding {
  employeeId: string; kind: ShiftOperationKindV1; commandId: string;
  dataSource: ShiftManagementSourceV1; businessTimeZone: string; effects: readonly ShiftEffectV1[];
  observedAt?: string; // private UI binding to context's server observation, never serialized
}
export function receipt(v: unknown, b: ReceiptBinding): v is ShiftReceiptV1 {
  if (!exact(v, 'contractVersion commandId employeeId kind effects commitAcknowledgedAt readBackVerifiedAt businessTimeZone replayed receiptPersistence partnerCompletion outcome dataSource') ||
    v.contractVersion !== '49-v0.1' || v.commandId !== b.commandId || !commandId(v.commandId) ||
    v.employeeId !== b.employeeId || v.kind !== b.kind || v.dataSource !== b.dataSource ||
    v.businessTimeZone !== b.businessTimeZone || v.replayed !== false || v.receiptPersistence !== 'none' ||
    v.partnerCompletion !== 'not-invoked' ||
    v.outcome !== (b.dataSource === 'oracle-test' ? 'oracle-test-committed' : 'fixture-committed') ||
    !instant(v.commitAcknowledgedAt) || !instant(v.readBackVerifiedAt) ||
    instantKey(v.readBackVerifiedAt) < instantKey(v.commitAcknowledgedAt) ||
    (b.observedAt !== undefined && (!instant(b.observedAt) || instantKey(v.commitAcknowledgedAt) < instantKey(b.observedAt))) ||
    !Array.isArray(v.effects) || v.effects.length !== b.effects.length || !v.effects.length) return false;
  const ids = new Set<string>();
  return v.effects.every((e, i) => {
    const expected = b.effects[i];
    if (!effect(e, b.kind === 'csv-create') || !id(e.after.shiftDayId, 10) || ids.has(e.after.shiftDayId) ||
      e.row !== expected.row || !equal(e.before, expected.before) || !sameWarnings(e.warningCodes, expected.warningCodes)) return false;
    ids.add(e.after.shiftDayId);
    return equal(e.after, { ...expected.after, shiftDayId: expected.after.shiftDayId ?? e.after.shiftDayId });
  });
}
const invalidNames = ['employeeId', 'shiftDayId', 'query', 'body', 'charset', 'draft', 'kind',
  'startLocal', 'endLocal', 'activityCode', 'workLocation', 'remark', 'startReasonCode', 'endReasonCode',
  'reasonCode', 'commandId', 'validationToken', 'previewToken', 'fingerprint', 'operationConfirmation',
  'accepted', 'acknowledgedWarningCodes', ...columns];
const ruleFields = [...columns, 'kind', 'shiftDayId', 'startLocal', 'endLocal', 'workLocation',
  'remark', 'startReasonCode', 'endReasonCode', 'reasonCode'];
export function managementProblem(v: unknown, status: number, expectedCommand: string | null): v is ShiftManagementProblemV1 {
  if (!object(v) || !exact(v, 'type title requestId commandId status code effect nextAction' +
    (Object.hasOwn(v, 'invalidParameters') ? ' invalidParameters' : '') +
    (Object.hasOwn(v, 'ruleViolations') ? ' ruleViolations' : '')) ||
    v.status !== status || v.commandId !== expectedCommand ||
    !plain(v.title, 256) || typeof v.requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v.requestId) ||
    v.type !== `urn:shf:problem:${v.code}` ||
    (v.invalidParameters !== undefined && (!Array.isArray(v.invalidParameters) || v.invalidParameters.length > 32 ||
      !v.invalidParameters.every(p => exact(p, 'name reason') && member(p.name, invalidNames) &&
        member(p.reason, ['required', 'invalid-format', 'unsupported'])))) ||
    (v.ruleViolations !== undefined && (!Array.isArray(v.ruleViolations) || v.ruleViolations.length > 600 ||
      !v.ruleViolations.every(r => exact(r, 'row field code') && (r.row === null ||
        Number.isInteger(r.row) && Number(r.row) >= 1 && Number(r.row) <= 101) &&
        (r.field === null || member(r.field, ruleFields)) && member(r.code, ruleCodes))))) return false;
  if (status === 503 && v.code === 'COMMAND_OUTCOME_UNKNOWN') return v.effect === 'unknown' && v.nextAction === 'reconcile';
  if ([400, 405, 413, 415, 422].includes(status)) return v.effect === 'none' && v.nextAction === 'correct-and-validate' &&
    v.code === ({ 400: 'INVALID_REQUEST', 405: 'INVALID_REQUEST', 413: 'REQUEST_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE', 422: 'BUSINESS_VALIDATION_FAILED' } as Record<number, string>)[status];
  if ([401, 403, 404].includes(status)) return v.effect === 'none' && v.nextAction === 'stop' &&
    (status === 401 ? v.code === 'UNAUTHENTICATED' : status === 403 ?
      member(v.code, ['FORBIDDEN', 'LIVE_WRITES_DISABLED']) : v.code === 'SHIFT_DAY_NOT_FOUND');
  if (!member(v.effect, ['none', 'rolled-back'])) return false;
  if (status === 409) return member(v.code, ['STALE_PREPARATION', 'CONFIRMATION_REQUIRED']) ?
    v.nextAction === 'prepare-again' : member(v.code, ['ALREADY_CANCELLED', 'COMMAND_IN_PROGRESS', 'COMMAND_ID_CONFLICT',
      'COMMAND_SCOPE_DEFERRED']) && v.nextAction === 'stop';
  return v.nextAction === 'stop' && (status === 503 ? member(v.code, ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT']) :
    status === 500 && member(v.code, ['INVALID_SOURCE_DATA', 'AMBIGUOUS_SHIFT_DAY', 'INTERNAL_ERROR']));
}
export const warningLabels: Record<ShiftWarningCodeV1, string> = {
  DURATION_CHANGED: 'משך המשמרת והדקות המחושבות משתנים',
  SOURCE_BECOMES_SHF: 'מקור עסקי משתנה מ־WFM ל־SHF',
  OVERNIGHT_NORMALIZED: 'שעת סיום מוקדמת הותאמה לתאריך הבא בקובץ',
  LOGICAL_CANCEL_PRESERVES_HISTORY: 'ביטול לוגי בלבד — פרטי המשמרת נשמרים להיסטוריה',
};
export const ruleLabels: Record<string, string> = {
  EMPLOYEE_NOT_ACTIVE: 'העובד/ת אינו/ה פעיל/ה', UNSUPPORTED_DAY: 'סוג משמרת אינו נתמך',
  UNSUPPORTED_SOURCE: 'המקור העסקי אינו נתמך', INVALID_TIME_RANGE: 'טווח השעות אינו תקף',
  AMBIGUOUS_LOCAL_TIME: 'השעה המקומית אינה חד־משמעית באזור הזמן העסקי',
  OFFSET_TRANSITION_UNSUPPORTED: 'משמרת שחוצה שינוי שעון אינה נתמכת בתהליך זה',
  PAST_OR_STARTED_SHIFT: 'משמרת שהחלה או חלפה אינה ניתנת לעדכון כאן',
  OUTSIDE_SCHEDULE_WEEK: 'הטווח נמצא מחוץ לשבוע התכנון המותר',
  DURATION_OUT_OF_POLICY: 'משך המשמרת אינו מתאים למדיניות',
  SHIFT_OVERLAP_OR_GAP: 'חפיפה או מרווח לא תקף בין משמרות',
  SITE_ACTIVITY_MISMATCH: 'הפעילות אינה מתאימה לאתר הנגזר',
  HOME_POLICY_UNAVAILABLE: 'לא ניתן לאשר עבודה מהבית לפי הנתונים הקיימים',
  UNSUPPORTED_MINUTE_ACCOUNTING: 'חישוב הדקות הקיים אינו נתמך בתהליך זה',
  DEPENDENT_FLOW_UNSUPPORTED: 'קיימים פרטים תלויים הדורשים תהליך אחר',
  ATTENDANCE_PRESENT: 'קיימת נוכחות — אין אפשרות לעדכן בתהליך זה',
  MISSING_PRESENT: 'קיים דיווח היעדרות הדורש תהליך אחר',
  REPORT_REVIEW_REQUIRED: 'נדרשת בדיקת דיווחים או אירועים לפני עדכון',
  EXCHANGE_PRESENT: 'קיימת החלפה או מועמדות להחלפה',
  POOL_DEPENDENCY_PRESENT: 'קיימת תלות בהארכת משמרת או במאגר',
  PARTNER_REQUIRED_OR_UNKNOWN: 'סנכרון שותף נדרש או אינו ידוע — אין הפעלה אוטומטית',
  NO_CHANGE: 'לא נמצא שינוי בערכים הניתנים לעריכה',
  CSV_INVALID_HEADER: 'כותרת הקובץ אינה תואמת לשש העמודות הנדרשות',
  CSV_INVALID_ROW: 'ערך או מבנה שורה אינו תקף',
  CSV_EMPLOYEE_MISMATCH: 'הזהות בקובץ אינה תואמת לעובד/ת הנבחר/ת',
  CSV_DUPLICATE: 'כפילות או התנגשות בין שורות',
  CSV_LIMIT_EXCEEDED: 'הקובץ חורג ממגבלת הגודל או מספר השורות',
  TEXT_NOT_REPRESENTABLE: 'לא ניתן לשמור את הטקסט בקידוד ובאורך המותרים במסד',
};
const fieldLabels: Record<string, string> = {
  personalId: 'מזהה אישי', activityCode: 'פעילות', date: 'תאריך', location: 'מיקום',
  startTime: 'שעת התחלה', endTime: 'שעת סיום', startLocal: 'תאריך ושעת התחלה',
  endLocal: 'תאריך ושעת סיום', startReasonCode: 'סיבת שינוי התחלה', endReasonCode: 'סיבת שינוי סיום',
  reasonCode: 'סיבת ביטול', remark: 'הערה', workLocation: 'מיקום עבודה', row: 'כל השורה',
  employeeId: 'עובד/ת נבחר/ת', shiftDayId: 'משמרת נבחרת', charset: 'קידוד הקובץ', body: 'מבנה הבקשה',
};
export const fieldLabel = (name: string) => fieldLabels[name] ?? 'פרט בבקשה';
export const ruleLabel = (code: string) => ruleLabels[code] ?? 'השרת דחה את הבקשה לפי כלל עסקי; יש לבדוק את הפרטים';
