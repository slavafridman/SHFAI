import type { PersonalShiftItem, PersonalShiftScope } from './contracts.js';
import { PersonalShiftsError, projectPersonalShift } from './personal-shifts.js';

function invalid(field: string): never {
  throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'מיפוי נתוני המשמרת אינו מאומת.', field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) { return invalid(field); }
  return value;
}

function column(row: Record<string, unknown>, name: string): unknown {
  if (!Object.hasOwn(row, name)) { return invalid(name); }
  return row[name];
}

function internalEmployeeId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,37}$/.test(value)) { return invalid('employeeId'); }
  return value;
}

function ownerKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 128 || value === '99999999') {
    return invalid('ownerKey');
  }
  return value;
}

function dayId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,9}$/.test(value)) { return invalid('dayId'); }
  return value;
}

function siteId(value: unknown, maximumDigits: number): string {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/.test(value) || value.length > maximumDigits) {
    return invalid('siteId');
  }
  return value;
}

function ownerMap(input: unknown): ReadonlyMap<string, string> {
  if (!Array.isArray(input)) { return invalid('ownerLinks'); }
  const result = new Map<string, string>();
  for (const value of input) {
    const link = record(value, 'ownerLinks');
    const key = ownerKey(column(link, 'ownerKey'));
    const employeeId = internalEmployeeId(column(link, 'employeeId'));
    if (result.has(key)) { return invalid('ownerLinks'); }
    result.set(key, employeeId);
  }
  return result;
}

function resolveOwner(value: unknown, links: ReadonlyMap<string, string>): string {
  const employeeId = links.get(ownerKey(value));
  if (employeeId === undefined) { return invalid('ownerLinks'); }
  return employeeId;
}

function flag(row: Record<string, unknown>, name: string): string {
  const value = column(row, name);
  if (typeof value !== 'string' || !/^[yn]$/i.test(value)) { return invalid(name); }
  return value;
}

function nullableText(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== 'string') { return invalid(field); }
  return value;
}

function activityDay(value: unknown): boolean {
  if (value === 4 || value === '4') { return true; }
  if ((typeof value === 'string' && /^[123567]$/.test(value))
    || (typeof value === 'number' && [1, 2, 3, 5, 6, 7].includes(value))) { return false; }
  return invalid('dayType');
}

function baselineSchedule(day: Record<string, unknown>, links: ReadonlyMap<string, string>) {
  return {
    employeeId: resolveOwner(column(day, 'EMP_ID_NUMBER'), links),
    startLocal: column(day, 'WM_SHIFT_START_DATETIME'),
    endLocal: column(day, 'WM_SHIFT_END_DATETIME'),
    siteId: siteId(column(day, 'WM_SITE_ID'), 10),
    activityId: column(day, 'WM_SCH_ACTIVITY_ID_DATA'),
    workFromHomeFlag: flag(day, 'WORK_FROM_HOME'),
    split: {
      flag: flag(day, 'SPLIT_SHIFT'),
      gapStartLocal: column(day, 'SPLIT_START'),
      gapEndLocal: column(day, 'SPLIT_END'),
    },
  };
}

// Isolated named-column inputs only: no Oracle fetch, Date conversion or authentication.
export function mapOraclePersonalShift(input: unknown, scope: PersonalShiftScope): PersonalShiftItem | null {
  const scopeRecord = record(scope, 'scope');
  const actorId = internalEmployeeId(column(scopeRecord, 'actorEmployeeId'));
  if (typeof scopeRecord['canViewBaseline'] !== 'boolean') { return invalid('scope'); }
  const source = record(input, 'rowGroup');
  const day = record(column(source, 'day'), 'day');
  const id = dayId(column(day, 'SHF_EMPLOYEE_DAY_ID'));
  const changes = column(source, 'changes');
  if (!Array.isArray(changes) || changes.length > 1) { return invalid('changes'); }
  const change = changes.length === 0 ? null : record(changes[0], 'changes');
  if (change !== null && dayId(column(change, 'SHF_EMPLOYEE_DAY_ID')) !== id) { return invalid('changes'); }
  const links = ownerMap(column(source, 'ownerLinks'));
  if (change !== null) {
    const owner = nullableText(column(change, 'NEW_EMPLOYEE_ID'), 'NEW_EMPLOYEE_ID');
    const reason = nullableText(column(change, 'CANCEL_REASON_CODE'), 'CANCEL_REASON_CODE');
    if (owner === '99999999' || reason !== null) { return null; }
  }
  if (!activityDay(change === null ? column(day, 'WM_DAY_TYPE') : column(change, 'NEW_DAY_TYPE'))) {
    return null;
  }
  const baseline = baselineSchedule(day, links);
  let effective = baseline;
  if (change !== null) {
    const inherit = (name: string, original: unknown): unknown => {
      const value = column(change, name);
      return value === null ? original : value;
    };
    const newSite = column(change, 'NEW_SITE_ID');
    effective = {
      employeeId: resolveOwner(column(change, 'NEW_EMPLOYEE_ID'), links),
      startLocal: inherit('NEW_SHIFT_START', baseline.startLocal),
      endLocal: inherit('NEW_SHIFT_END', baseline.endLocal),
      siteId: newSite === null ? baseline.siteId : siteId(newSite, 38),
      activityId: inherit('NEW_ACTIVITY', baseline.activityId),
      workFromHomeFlag: flag(change, 'NEW_WORK_FROM_HOME'),
      split: {
        flag: flag(change, 'NEW_SPLIT_SHIFT'),
        gapStartLocal: inherit('NEW_SPLIT_START', baseline.split.gapStartLocal),
        gapEndLocal: inherit('NEW_SPLIT_END', baseline.split.gapEndLocal),
      },
    };
  }
  // Validate before actual ownership filtering can hide malformed included rows.
  const item = projectPersonalShift({
    id, projection: change === null ? 'baseline' : 'override', eligibility: 'included', baseline, effective,
  }, { actorEmployeeId: effective.employeeId, canViewBaseline: scope.canViewBaseline });
  return effective.employeeId === actorId ? item : null;
}
