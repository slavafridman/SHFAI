// Shared wire types are architect-owned. Runtime guards below do not grant scope.
export type {
  CurrentShiftFilterContextV1, CurrentShiftListV1, CurrentShiftRequestV1,
  CurrentShiftRowV1, CatalogValueV1, CurrentShiftProblemV1,
} from '../../../backend/fixture-slice/current-shifts-contracts.mts';
import type {
  CurrentShiftFilterContextV1, CurrentShiftListV1, CurrentShiftRequestV1, CurrentShiftProblemV1,
  CurrentShiftRowV1, CatalogValueV1, MokedOptionV1,
} from '../../../backend/fixture-slice/current-shifts-contracts.mts';
import { id, localTime } from './contract';

export const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
export const txt = (v: unknown, max: number, min = 0): v is string =>
  typeof v === 'string' && !/[\uD800-\uDFFF]/u.test(v) && [...v].length >= min && [...v].length <= max;
export const clean = (v: unknown, max: number, min = 1): v is string =>
  txt(v, max, min) && !/[\u0000-\u001f\u007f-\u009f]/u.test(v);
export const unitCode = (v: unknown): v is string => clean(v, 8) && !/\s/u.test(v);
export const civilDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && localTime(`${v}T00:00:00`);
export const minute = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const zone = (v: unknown) => {
  if (!clean(v, 128)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; }
};
export const parent = (v: unknown): v is MokedOptionV1 => obj(v) && unitCode(v['code']) && clean(v['label'], 256) && v['unitType'] === 'G01';
export const catalog = (v: unknown): v is CatalogValueV1 => obj(v) && clean(v['code'], 128) &&
  (v['label'] === null || clean(v['label'], 256));
export const coherentSource = (identitySource: unknown, listSource: unknown): boolean =>
  (identitySource === 'isolated-fixture' && listSource === 'isolated-fixture') ||
  (identitySource === 'oracle' && listSource === 'oracle-read-only');
export function filterContext(v: unknown): v is CurrentShiftFilterContextV1 {
  if (!obj(v) || !['isolated-fixture', 'oracle-read-only'].includes(String(v['dataSource'])) || !zone(v['businessTimeZone']) ||
    !obj(v['defaults']) || !Array.isArray(v['mokedOptions']) || v['mokedOptions'].length > 100 ||
    !v['mokedOptions'].every(parent)) return false;
  const codes = v['mokedOptions'].map((p: { code: string }) => p.code);
  const d = v['defaults'];
  return new Set(codes).size === codes.length && codes.every((c: string, i: number) => !i || codes[i - 1] < c) &&
    d['mode'] === 'at' && civilDate(d['attendanceDate']) && minute(d['currentTime']) &&
    d['mokedCode'] === (codes.length === 1 ? codes[0] : null);
}
export function coreRow(v: unknown): v is Omit<CurrentShiftRowV1, 'attendanceDisplay'> & Record<string, unknown> {
  if (!obj(v) || !id(v['shiftDayId'], 10) || !obj(v['employee']) || !localTime(v['startLocal']) ||
    !localTime(v['endLocal']) || !(v['workingFromHome'] === null || typeof v['workingFromHome'] === 'boolean') ||
    !Array.isArray(v['activities']) || v['activities'].length > 100 || !v['activities'].every(catalog) ||
    !(v['innerJob'] === null || catalog(v['innerJob']))) return false;
  const e = v['employee'];
  return id(e['employeeId']) && txt(e['firstName'], 40) && txt(e['lastName'], 40) &&
    obj(e['unit']) && unitCode(e['unit']['code']) && clean(e['unit']['label'], 256) &&
    parent(e['unit']['moked']);
}
function row(v: unknown): v is CurrentShiftRowV1 {
  if (!coreRow(v) || !obj(v) || !obj(v['attendanceDisplay'])) return false;
  const a = v['attendanceDisplay'];
  return (
      a['kind'] === 'not-recorded' ||
      (a['kind'] === 'station-arrival' && localTime(a['atLocal'])) ||
      (a['kind'] === 'missing-reason' && catalog(a['reason']) && id(a['reason']['code']))
    );
}
export function currentList(v: unknown, request: CurrentShiftRequestV1,
  context: CurrentShiftFilterContextV1): v is CurrentShiftListV1 {
  if (!obj(v) || v['dataSource'] !== context.dataSource || v['businessTimeZone'] !== context.businessTimeZone ||
    !obj(v['applied']) || !obj(v['page']) || !Array.isArray(v['items']) || !v['items'].every(row)) return false;
  const a = v['applied'], p = v['page'], limit = request.limit ?? 25, offset = request.offset ?? 0;
  if (a['requestedMode'] !== request.mode || !civilDate(a['attendanceDate']) || !minute(a['currentTime']) ||
    a['sort'] !== 'effective-start-asc' || a['mokedCode'] !== (request.mokedCode ?? null) ||
    (request.mode === 'at' && (a['attendanceDate'] !== request.attendanceDate || a['currentTime'] !== request.currentTime)) ||
    p['limit'] !== limit || p['offset'] !== offset || typeof p['hasMore'] !== 'boolean' ||
    v['items'].length > limit || (p['hasMore'] && v['items'].length !== limit)) return false;
  const next = offset + v['items'].length;
  if (p['nextOffset'] !== (p['hasMore'] && next <= 10000 ? next : null)) return false;
  const seen = new Set<string>();
  let prior: CurrentShiftRowV1 | null = null;
  const decimalCompare = (x: string, y: string) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
  for (const item of v['items']) {
    if (seen.has(item.shiftDayId)) return false;
    seen.add(item.shiftDayId);
    if (!context.mokedOptions.some(p => p.code === item.employee.unit.moked.code &&
      p.label === item.employee.unit.moked.label) ||
      (request.mokedCode && item.employee.unit.moked.code !== request.mokedCode)) return false;
    if (prior && (prior.startLocal > item.startLocal || (prior.startLocal === item.startLocal &&
      (decimalCompare(prior.shiftDayId, item.shiftDayId) || decimalCompare(prior.employee.employeeId, item.employee.employeeId)) > 0))) return false;
    prior = item;
  }
  return true;
}
const codes: Record<number, string[]> = {
  400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'],
  503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
  500: ['AMBIGUOUS_CURRENT_SHIFT', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'],
};
export function currentProblem(v: unknown, status: number): v is CurrentShiftProblemV1 {
  if (!obj(v) || v['status'] !== status || typeof v['code'] !== 'string' || !codes[status]?.includes(v['code']) ||
    v['type'] !== `urn:shf:problem:${v['code']}` || !txt(v['title'], 256) ||
    typeof v['requestId'] !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v['requestId'])) return false;
  return v['invalidParameters'] === undefined || (Array.isArray(v['invalidParameters']) &&
    v['invalidParameters'].every(p => obj(p) && ['mode', 'attendanceDate', 'currentTime', 'mokedCode', 'limit', 'offset', 'sort', 'query', 'body']
      .includes(String(p['name'])) && ['required', 'invalid-format', 'unsupported'].includes(String(p['reason']))));
}
