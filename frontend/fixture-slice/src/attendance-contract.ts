// Runtime guards; normative wire types are imported type-only from §37.
export type { AttendanceFilterContextV1, AttendanceRequestV1, AttendanceRowV1,
  AttendanceListV1, AttendanceProblemV1 } from '../../../backend/fixture-slice/attendance-contracts.mts';
import type { AttendanceFilterContextV1, AttendanceRequestV1, AttendanceRowV1,
  AttendanceListV1, AttendanceProblemV1 } from '../../../backend/fixture-slice/attendance-contracts.mts';
import { id, localTime } from './contract';
import { obj, clean, unitCode, parent, catalog } from './current-shifts-contract';
import { searchContext, searchProblem } from './shift-search-contract';

const keys = (v: unknown, names: string): v is Record<string, unknown> => obj(v) &&
  Object.keys(v).sort().join(',') === names.split(' ').sort().join(',');
const nullableTime = (v: unknown) => v === null || localTime(v);
const nullableBool = (v: unknown) => v === null || typeof v === 'boolean';
const integral = (v: unknown): v is string => typeof v === 'string' &&
  /^(?:0|[1-9][0-9]{0,37}|-[1-9][0-9]{0,37})$/.test(v);
const value = (v: unknown) => keys(v, 'code label') && catalog(v);
export function attendanceContext(v: unknown): v is AttendanceFilterContextV1 {
  if (!searchContext(v) || !keys(v, 'defaults mokedOptions teamOptions innerJobOptions workLocationOptions businessTimeZone dataSource') ||
      !keys(v.defaults, 'attendanceDate timeFrom timeTo mokedCode teamCodes innerJobCodes workLocations')) return false;
  const parents = v.mokedOptions.map(p => p.code);
  return v.mokedOptions.every(p => keys(p, 'code label unitType') &&
      v.teamOptions.some(t => t.parentMokedCode === p.code)) &&
    v.teamOptions.length <= 100 &&
    v.teamOptions.every(t => keys(t, 'code label unitType parentMokedCode') && !parents.includes(t.code) &&
      t.code !== t.parentMokedCode) &&
    v.innerJobOptions.every(value) && v.workLocationOptions.every(l => keys(l, 'code label'));
}
export function attendanceRow(v: unknown): v is AttendanceRowV1 {
  if (!keys(v, 'shiftDayId employee planned attendance') || !id(v['shiftDayId'], 10) ||
      !keys(v['employee'], 'employeeId firstName lastName unit') ||
      !keys(v['planned'], 'startLocal endLocal workingFromHome activities activityFallback innerJob') ||
      !keys(v['attendance'], 'stageArrivalLocal stationArrivalLocal stationExitLocal missingReasonCode briefingRecorded')) return false;
  const e = v['employee'], p = v['planned'], a = v['attendance'];
  if (!id(e['employeeId']) || !clean(e['firstName'], 40) || !clean(e['lastName'], 40) ||
      !keys(e['unit'], 'code label moked') || !unitCode(e['unit']['code']) || !clean(e['unit']['label'], 256) ||
      !parent(e['unit']['moked']) || !keys(e['unit']['moked'], 'code label unitType') ||
      e['unit']['code'] === e['unit']['moked'].code ||
      !nullableTime(p['startLocal']) || !nullableTime(p['endLocal']) ||
      (typeof p['startLocal'] === 'string' && typeof p['endLocal'] === 'string' && p['endLocal'] < p['startLocal']) ||
      !nullableBool(p['workingFromHome']) || !Array.isArray(p['activities']) || p['activities'].length > 100 ||
      !p['activities'].every(value) ||
      !(p['activityFallback'] === null || (value(p['activityFallback']) && obj(p['activityFallback']) && id(p['activityFallback']['code']))) ||
      (p['activities'].length > 0 && p['activityFallback'] !== null) ||
      !(p['innerJob'] === null || (value(p['innerJob']) && obj(p['innerJob']) && integral(p['innerJob']['code']) && p['innerJob']['code'] !== '0'))) return false;
  return [a['stageArrivalLocal'], a['stationArrivalLocal'], a['stationExitLocal']].every(nullableTime) &&
    (a['missingReasonCode'] === null || integral(a['missingReasonCode'])) && nullableBool(a['briefingRecorded']);
}
const same = (a: unknown, b: readonly string[]) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
const decimal = (a: string, b: string) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
export function attendanceList(v: unknown, request: AttendanceRequestV1,
  context: AttendanceFilterContextV1): v is AttendanceListV1 {
  if (!keys(v, 'items applied page businessTimeZone dataSource') || v['dataSource'] !== context.dataSource ||
      v['businessTimeZone'] !== context.businessTimeZone || !keys(v['applied'],
        'attendanceDate timeFrom timeTo mokedCode teamCodes innerJobCodes workLocations sort') ||
      !keys(v['page'], 'limit offset hasMore nextOffset') || !Array.isArray(v['items']) ||
      !v['items'].every(attendanceRow)) return false;
  const a = v['applied'], p = v['page'], limit = request.limit ?? 25, offset = request.offset ?? 0;
  if (a['attendanceDate'] !== request.attendanceDate || a['timeFrom'] !== request.timeFrom || a['timeTo'] !== request.timeTo ||
      a['mokedCode'] !== (request.mokedCode ?? null) || a['sort'] !== 'effective-start-asc' ||
      !same(a['teamCodes'], [...request.teamCodes ?? []].sort()) ||
      !same(a['innerJobCodes'], [...request.innerJobCodes ?? []].sort()) ||
      !same(a['workLocations'], ['home', 'site'].filter(x => request.workLocations?.includes(x as 'home' | 'site'))) ||
      p['limit'] !== limit || p['offset'] !== offset || typeof p['hasMore'] !== 'boolean' ||
      v['items'].length > limit || (p['hasMore'] && v['items'].length !== limit) ||
      p['nextOffset'] !== (p['hasMore'] && offset + v['items'].length <= 10000 ? offset + v['items'].length : null)) return false;
  const seen = new Set<string>();
  let previous: AttendanceRowV1 | undefined;
  for (const row of v['items']) {
    const team = context.teamOptions.find(t => t.code === row.employee.unit.code);
    const moked = context.mokedOptions.find(m => m.code === row.employee.unit.moked.code);
    if (!team || !moked || team.parentMokedCode !== moked.code || team.label !== row.employee.unit.label ||
        moked.label !== row.employee.unit.moked.label || seen.has(row.shiftDayId!) ||
        (request.mokedCode && request.mokedCode !== moked.code) ||
        (request.teamCodes?.length && !request.teamCodes.includes(team.code)) ||
        (request.innerJobCodes?.length && (!row.planned.innerJob || !request.innerJobCodes.includes(row.planned.innerJob.code)))) return false;
    // Split-end is deliberately not public. Neither actual times nor planned
    // start can prove membership; never copy search's start-in-range predicate.
    // Home filtering uses raw branch source, not this display fallback.
    if (previous) {
      const x = previous.planned.startLocal, y = row.planned.startLocal;
      if ((x === null && y !== null) || (x !== null && y !== null && x > y) ||
          (x === y && (decimal(previous.shiftDayId!, row.shiftDayId!) ||
            decimal(previous.employee.employeeId, row.employee.employeeId)) > 0)) return false;
    }
    seen.add(row.shiftDayId!); previous = row;
  }
  return true;
}
export function attendanceProblem(v: unknown, status: number): v is AttendanceProblemV1 {
  if (!obj(v)) return false;
  const code = v['code'];
  // Reuse the exact parameter grammar, not search's resource-specific error.
  if (code === 'AMBIGUOUS_ATTENDANCE') return status === 500 &&
    searchProblem({ ...v, code: 'AMBIGUOUS_SHIFT_SEARCH', type: 'urn:shf:problem:AMBIGUOUS_SHIFT_SEARCH' }, status);
  return code !== 'AMBIGUOUS_SHIFT_SEARCH' && searchProblem(v, status);
}
