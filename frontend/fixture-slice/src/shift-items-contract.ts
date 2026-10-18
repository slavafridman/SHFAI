// Canonical exports are type-only. All network data enters as unknown.
export type { SelectedShiftItemKindV1, SelectedShiftItemsV1, SelectedShiftItemV1, SelectedShiftItemsRequestV1,
  SelectedShiftItemsProblemV1 } from '../../../backend/fixture-slice/shift-items-contracts.mts';
import type { SelectedShiftItemsV1, SelectedShiftItemV1, SelectedShiftItemsRequestV1,
  SelectedShiftItemsProblemV1 } from '../../../backend/fixture-slice/shift-items-contracts.mts';
import type { IdentityResponseV1 } from './contract';
import { detail, id, localTime } from './contract';
import { obj, txt, clean, unitCode, parent, catalog } from './current-shifts-contract';

const signed = (v: unknown): v is string => typeof v === 'string' && /^(?:0|-?[1-9][0-9]{0,37})$/.test(v);
export function itemsQuery(query: string): Required<Pick<SelectedShiftItemsRequestV1, 'limit' | 'offset' | 'sort'>> | null {
  if (new TextEncoder().encode(query).length > 8192) return null;
  const p = new URLSearchParams(query), seen = new Set<string>();
  for (const [key, value] of p) {
    if (!['limit', 'offset', 'sort'].includes(key) || seen.has(key)) return null;
    seen.add(key);
    if (key === 'sort' ? value !== 'start-asc' : !/^(?:0|[1-9][0-9]*)$/.test(value)) return null;
  }
  const limit = Number(p.get('limit') ?? 25), offset = Number(p.get('offset') ?? 0);
  return limit >= 1 && limit <= 100 && offset >= 0 && offset <= 10000
    ? { limit, offset, sort: 'start-asc' } : null;
}
function item(v: unknown, day: string): v is SelectedShiftItemV1 {
  if (!obj(v) || !obj(v['key']) || v['key']['shiftDayId'] !== day ||
    v['key']['startLocal'] !== v['startLocal'] || !localTime(v['startLocal']) ||
    !localTime(v['endLocal']) || !id(v['stateCode']) || !signed(v['durationMinutes']) ||
    !clean(v['sourceCode'], 10) || !(v['remark'] === null || txt(v['remark'], 1000, 1))) return false;
  if (v['stateCode'] === '4') return v['kind'] === 'break' && v['type'] === null &&
    [v['breakExitLocal'], v['breakReturnLocal']].every(t => t === null || localTime(t));
  return v['kind'] === (v['stateCode'] === '2' ? 'timeoff' : 'exception') &&
    obj(v['type']) && signed(v['type']['code']) &&
    (v['type']['label'] === null || clean(v['type']['label'], 256)) &&
    v['breakExitLocal'] === null && v['breakReturnLocal'] === null;
}
export function itemsResponse(v: unknown, r: SelectedShiftItemsRequestV1,
  source: IdentityResponseV1['dataSource']): v is SelectedShiftItemsV1 {
  if (!obj(v) || !detail(v['shiftDay'], r.employeeId, r.shiftDayId, source) ||
    !obj(v['displayContext']) || !obj(v['applied']) || v['applied']['sort'] !== 'start-asc' ||
    !obj(v['page']) || !Array.isArray(v['items'])) return false;
  const c = v['displayContext'], u = c['unit'], p = v['page'], rows = v['items'];
  if (!obj(u) || !unitCode(u['code']) || u['code'] !== v['shiftDay'].employee.orgUnitId ||
    !clean(u['label'], 256) || !parent(u['moked']) || u['moked'].code === u['code'] ||
    !Array.isArray(c['activities']) || c['activities'].length > 100 || !c['activities'].every(catalog) ||
    !(c['innerJob'] === null || catalog(c['innerJob']))) return false;
  const limit = r.limit ?? 25, offset = r.offset ?? 0, next = offset + rows.length;
  if (p['limit'] !== limit || p['offset'] !== offset || rows.length > limit ||
    typeof p['hasMore'] !== 'boolean' || (p['hasMore'] && rows.length !== limit) ||
    p['nextOffset'] !== (p['hasMore'] && next <= 10000 ? next : null)) return false;
  let previous = '';
  for (const row of rows) {
    if (!item(row, r.shiftDayId) || row.startLocal <= previous) return false;
    previous = row.startLocal;
  }
  return true;
}
const codes: Record<number, string[]> = {
  400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'], 404: ['SHIFT_DAY_NOT_FOUND'],
  500: ['AMBIGUOUS_SHIFT_DAY', 'AMBIGUOUS_SHIFT_ITEMS', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'],
  503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
};
export function itemsProblem(v: unknown, status: number): v is SelectedShiftItemsProblemV1 {
  return obj(v) && v['status'] === status && typeof v['code'] === 'string' &&
    !!codes[status]?.includes(v['code']) && v['type'] === `urn:shf:problem:${v['code']}` &&
    txt(v['title'], 256) && typeof v['requestId'] === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v['requestId']) &&
    (v['invalidParameters'] === undefined || (Array.isArray(v['invalidParameters']) &&
      v['invalidParameters'].every(p => obj(p) &&
        ['employeeId', 'shiftDayId', 'limit', 'offset', 'sort', 'query', 'body'].includes(String(p['name'])) &&
        ['required', 'invalid-format', 'unsupported'].includes(String(p['reason'])))));
}
