import type { IdentityResponseV1 } from './contract';
import { id, localTime } from './contract';
import { obj, txt, clean, unitCode, parent, catalog, zone, civilDate, coherentSource } from './current-shifts-contract';
import type { MyShiftsContextRequestV1, MyShiftsContextV1, MyShiftsRequestV1, MyShiftsListV1, MyShiftsProblemV1 } from '../../../backend/fixture-slice/my-shifts-contracts.mts';
export type { MyShiftsContextRequestV1, MyShiftsContextV1, MyShiftsRequestV1, MyShiftsListV1, MyShiftRowV1 } from '../../../backend/fixture-slice/my-shifts-contracts.mts';

/** Gregorian ordinal: calendar arithmetic only, independent of local DST/UTC. */
export function ordinal(date: string): number {
  const [y, m, d] = date.split('-').map(Number), prior = y - 1;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return 365 * prior + Math.floor(prior / 4) - Math.floor(prior / 100) + Math.floor(prior / 400) +
    [0,31,59,90,120,151,181,212,243,273,304,334][m - 1] + (leap && m > 2 ? 1 : 0) + d;
}
export const validRange = (from: string, to: string) =>
  civilDate(from) && civilDate(to) && ordinal(to) >= ordinal(from) && ordinal(to) - ordinal(from) < 31;
export function employee(v: unknown): boolean {
  return obj(v) && id(v['employeeId']) && txt(v['firstName'], 40) && txt(v['lastName'], 40) &&
    obj(v['unit']) && unitCode(v['unit']['code']) && clean(v['unit']['label'], 256) && parent(v['unit']['moked']);
}
const equalEmployee = (a: unknown, b: unknown) => obj(a) && obj(b) &&
  a['employeeId'] === b['employeeId'] && a['firstName'] === b['firstName'] && a['lastName'] === b['lastName'] &&
  obj(a['unit']) && obj(b['unit']) && a['unit']['code'] === b['unit']['code'] && a['unit']['label'] === b['unit']['label'] &&
  obj(a['unit']['moked']) && obj(b['unit']['moked']) && a['unit']['moked']['code'] === b['unit']['moked']['code'] &&
  a['unit']['moked']['label'] === b['unit']['moked']['label'];
export function scheduleContext(v: unknown, request: MyShiftsContextRequestV1, identity: IdentityResponseV1): v is MyShiftsContextV1 {
  if (!obj(v) || !obj(v['actor']) || v['actor']['mode'] !== request.mode ||
    !obj(v['defaults']) || !validRange(v['defaults']['dateFrom'] as string, v['defaults']['dateTo'] as string) ||
    ordinal(v['defaults']['dateTo'] as string) - ordinal(v['defaults']['dateFrom'] as string) !==
      Math.min(13, ordinal('9999-12-31') - ordinal(v['defaults']['dateFrom'] as string)) ||
    !zone(v['businessTimeZone']) || !coherentSource(identity.dataSource, v['dataSource']) ||
    v['canSelectEmployee'] !== identity.principal.synthetic) return false;
  const e = v['actor']['employee'], p = identity.principal;
  if (v['selectionRequired'] !== (e === null)) return false;
  if (request.mode === 'selected') return p.synthetic && employee(e) && obj(e) && e['employeeId'] === request.employeeId;
  if (p.synthetic || p.employeeId === null) return e === null;
  return employee(e) && obj(e) && e['employeeId'] === p.employeeId;
}
export function scheduleList(v: unknown, request: MyShiftsRequestV1, context: MyShiftsContextV1): v is MyShiftsListV1 {
  if (!obj(v) || !obj(v['actor']) || v['actor']['mode'] !== request.mode ||
    !equalEmployee(v['actor']['employee'], context.actor.employee) || !employee(v['actor']['employee']) ||
    v['dataSource'] !== context.dataSource || v['businessTimeZone'] !== context.businessTimeZone ||
    !obj(v['applied']) || !obj(v['page']) || !Array.isArray(v['items'])) return false;
  const a = v['applied'], p = v['page'], items = v['items'], e = context.actor.employee!;
  const offset = request.offset ?? 0, limit = request.limit ?? 25;
  if (a['mode'] !== request.mode || a['employeeId'] !== e.employeeId || a['dateFrom'] !== request.dateFrom ||
    a['dateTo'] !== request.dateTo || a['sort'] !== 'effective-start-asc' || p['offset'] !== offset ||
    p['limit'] !== limit || typeof p['hasMore'] !== 'boolean' || items.length > limit ||
    (p['hasMore'] && items.length !== limit) ||
    p['nextOffset'] !== (p['hasMore'] && offset + items.length <= 10000 ? offset + items.length : null)) return false;
  let prior: { start: string; day: string } | null = null;
  const seen = new Set<string>();
  for (const row of items) {
    if (!obj(row) || !id(row['shiftDayId'], 10) || seen.has(row['shiftDayId']) ||
      !equalEmployee(row['employee'], e) || !localTime(row['startLocal']) ||
      !(row['endLocal'] === null || (localTime(row['endLocal']) && row['endLocal'] >= row['startLocal'])) ||
      row['startLocal'].slice(0, 10) < request.dateFrom || row['startLocal'].slice(0, 10) > request.dateTo ||
      !Array.isArray(row['activities']) || row['activities'].length > 100 || !row['activities'].every(catalog)) return false;
    const day = row['shiftDayId'], start = row['startLocal'];
    if (prior && (start < prior.start || (start === prior.start &&
      (day.length < prior.day.length || (day.length === prior.day.length && day <= prior.day))))) return false;
    prior = { start, day }; seen.add(day);
  }
  return true;
}
const codes: Record<number, string[]> = { 400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'],
  409: ['EMPLOYEE_CONTEXT_REQUIRED'], 503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
  500: ['AMBIGUOUS_MY_SHIFTS', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'] };
export function scheduleProblem(v: unknown, status: number): v is MyShiftsProblemV1 {
  return obj(v) && v['status'] === status && typeof v['code'] === 'string' && !!codes[status]?.includes(v['code']) &&
    v['type'] === `urn:shf:problem:${v['code']}` && txt(v['title'], 256) &&
    typeof v['requestId'] === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v['requestId']) &&
    (v['invalidParameters'] === undefined || (Array.isArray(v['invalidParameters']) && v['invalidParameters'].every(p =>
      obj(p) && ['mode','employeeId','dateFrom','dateTo','limit','offset','sort','query','body'].includes(String(p['name'])) &&
      ['required','invalid-format','unsupported'].includes(String(p['reason'])))));
}
