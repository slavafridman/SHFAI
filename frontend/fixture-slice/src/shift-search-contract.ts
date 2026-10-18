// Runtime validation only; all wire types belong to the canonical architect file.
export type {
  ShiftSearchFilterContextV1, ShiftSearchRequestV1, ShiftSearchRowV1, ShiftSearchListV1,
  ShiftSearchProblemV1, ShiftSearchWorkLocationV1,
} from '../../../backend/fixture-slice/shift-search-contracts.mts';
import type {
  ShiftSearchFilterContextV1, ShiftSearchRequestV1, ShiftSearchRowV1, ShiftSearchListV1, ShiftSearchProblemV1,
} from '../../../backend/fixture-slice/shift-search-contracts.mts';
import { id } from './contract';
import { obj, txt, clean, zone, parent, catalog, unitCode, civilDate, minute, coreRow } from './current-shifts-contract';

const ordered = (values: string[]) => values.every((c, i) => !i || values[i - 1] < c);
const empty = (v: unknown) => Array.isArray(v) && v.length === 0;
export function searchContext(v: unknown): v is ShiftSearchFilterContextV1 {
  if (!obj(v) || !(v['dataSource'] === 'isolated-fixture' || v['dataSource'] === 'oracle-read-only') ||
      !zone(v['businessTimeZone']) || !obj(v['defaults']) ||
      !Array.isArray(v['mokedOptions']) || v['mokedOptions'].length > 100 || !v['mokedOptions'].every(parent) ||
      !Array.isArray(v['teamOptions']) || v['teamOptions'].length > 1000 ||
      !Array.isArray(v['innerJobOptions']) || v['innerJobOptions'].length > 1000 ||
      !Array.isArray(v['workLocationOptions']) || v['workLocationOptions'].length !== 2) return false;
  const parents = v['mokedOptions'].map(p => p.code);
  if (!ordered(parents) || !v['teamOptions'].every(t => obj(t) && unitCode(t['code']) &&
      clean(t['label'], 256) && t['unitType'] === 'J01' && typeof t['parentMokedCode'] === 'string' && parents.includes(t['parentMokedCode'])) ||
      !ordered(v['teamOptions'].map(t => t.code)) ||
      !v['innerJobOptions'].every(r => catalog(r) && id(r.code) && r.label !== null) ||
      !ordered(v['innerJobOptions'].map(r => r.code)) ||
      !v['workLocationOptions'].every((l, i) => obj(l) && l['code'] === ['home', 'site'][i] && clean(l['label'], 256))) return false;
  const d = v['defaults'];
  return civilDate(d['attendanceDate']) && minute(d['timeFrom']) && minute(d['timeTo']) &&
    d['timeFrom'] === d['timeTo'] && d['mokedCode'] === (parents.length === 1 ? parents[0] : null) &&
    empty(d['teamCodes']) && empty(d['innerJobCodes']) && empty(d['workLocations']);
}
export function searchRow(v: unknown): v is ShiftSearchRowV1 {
  if (!coreRow(v) || !obj(v) || !(v['activityFallback'] === null ||
      (catalog(v['activityFallback']) && id(v['activityFallback'].code))) || !obj(v['indicators'])) return false;
  const i = v['indicators'];
  return ['hasRemark', 'hasCancelLoginAnnotation', 'timeOrLocationChanged', 'split', 'addedStaffing', 'employeeReassigned']
    .every(k => typeof i[k] === 'boolean') &&
    (v.workingFromHome === true ? typeof i['extensionAllocated'] === 'boolean' : i['extensionAllocated'] === null) &&
    (v.activities.length === 0 || v['activityFallback'] === null);
}
const same = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
export function searchList(v: unknown, request: ShiftSearchRequestV1,
  context: ShiftSearchFilterContextV1): v is ShiftSearchListV1 {
  if (!obj(v) || v['dataSource'] !== context.dataSource || v['businessTimeZone'] !== context.businessTimeZone ||
      !obj(v['applied']) || !obj(v['page']) || !Array.isArray(v['items']) || !v['items'].every(searchRow)) return false;
  const a = v['applied'], p = v['page'], limit = request.limit ?? 25, offset = request.offset ?? 0;
  if (a['attendanceDate'] !== request.attendanceDate || a['timeFrom'] !== request.timeFrom || a['timeTo'] !== request.timeTo ||
      a['mokedCode'] !== (request.mokedCode ?? null) || a['sort'] !== 'effective-start-asc' ||
      !same(a['teamCodes'], [...(request.teamCodes ?? [])].sort()) ||
      !same(a['innerJobCodes'], [...(request.innerJobCodes ?? [])].sort()) ||
      !same(a['workLocations'], ['home', 'site'].filter(x => request.workLocations?.includes(x as 'home' | 'site'))) ||
      p['limit'] !== limit || p['offset'] !== offset || typeof p['hasMore'] !== 'boolean' ||
      v['items'].length > limit || (p['hasMore'] && v['items'].length !== limit) ||
      p['nextOffset'] !== (p['hasMore'] && offset + v['items'].length <= 10000 ? offset + v['items'].length : null)) return false;
  const seen = new Set<string>();
  let prior: ShiftSearchRowV1 | undefined;
  const compare = (x: string, y: string) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
  for (const item of v['items']) {
    const team = context.teamOptions.find(t => t.code === item.employee.unit.code);
    const moked = context.mokedOptions.find(m => m.code === item.employee.unit.moked.code);
    if (seen.has(item.shiftDayId) || !team || !moked || team.label !== item.employee.unit.label ||
        team.parentMokedCode !== moked?.code || moked.label !== item.employee.unit.moked.label ||
        (request.mokedCode && moked.code !== request.mokedCode) ||
        (request.teamCodes?.length && !request.teamCodes.includes(team.code)) ||
        (request.innerJobCodes?.length && (!item.innerJob || !request.innerJobCodes.includes(item.innerJob.code))) ||
        item.startLocal < `${request.attendanceDate}T${request.timeFrom}:00` ||
        item.startLocal > `${request.attendanceDate}T${request.timeTo}:00`) return false;
    if (prior && (prior.startLocal > item.startLocal || (prior.startLocal === item.startLocal &&
      (compare(prior.shiftDayId, item.shiftDayId) || compare(prior.employee.employeeId, item.employee.employeeId)) > 0))) return false;
    seen.add(item.shiftDayId); prior = item;
  }
  return true;
}
const codes: Record<number, string[]> = {
  400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'],
  503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
  500: ['AMBIGUOUS_SHIFT_SEARCH', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'],
};
export function searchProblem(v: unknown, status: number): v is ShiftSearchProblemV1 {
  return obj(v) && v['status'] === status && typeof v['code'] === 'string' && !!codes[status]?.includes(v['code']) &&
    v['type'] === `urn:shf:problem:${v['code']}` && txt(v['title'], 256) &&
    typeof v['requestId'] === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v['requestId']) &&
    (v['invalidParameters'] === undefined || (Array.isArray(v['invalidParameters']) && v['invalidParameters'].every(p =>
      obj(p) && ['attendanceDate', 'timeFrom', 'timeTo', 'mokedCode', 'teamCodes', 'innerJobCodes', 'workLocations', 'limit', 'offset', 'sort', 'query', 'body']
        .includes(typeof p['name'] === 'string' ? p['name'] : '') &&
      ['required', 'invalid-format', 'unsupported'].includes(typeof p['reason'] === 'string' ? p['reason'] : ''))));
}
