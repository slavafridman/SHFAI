// Normative DTOs remain backend/architect-owned. These imports are erased at build.
export type {
  IdentityResponseV1, EmployeeShiftDayResponseV1, ProblemV1,
} from '../../../backend/fixture-slice/contracts.mts';
import type {
  IdentityResponseV1, EmployeeShiftDayResponseV1, ProblemV1,
} from '../../../backend/fixture-slice/contracts.mts';

const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number, min = 0): v is string =>
  typeof v === 'string' && !/[\uD800-\uDFFF]/u.test(v) &&
  [...v].length >= min && [...v].length <= max;
export const id = (v: unknown, max = 38): v is string =>
  typeof v === 'string' && new RegExp(`^[1-9][0-9]{0,${max - 1}}$`).test(v);
const unique = (v: unknown, test: (v: unknown) => boolean): v is string[] =>
  Array.isArray(v) && v.every(test) && new Set(v).size === v.length;
const unit = (v: unknown): v is string => text(v, 8, 1) && v !== '*';
export const readCapabilities = ['shift-day:read', 'current-shifts:read', 'shift-search:read',
  'my-shifts:read', 'shift-items:read', 'employee:read', 'attendance:read'] as const;
export const f1Capabilities = [...readCapabilities, 'attendance-stage-arrival:prepare',
  'attendance-stage-arrival:commit'] as const;
export const nativeArrivalCapabilities = [...f1Capabilities, 'attendance-stage-arrival:test-oracle-write'] as const;
export const jointArrivalCapabilities = [...f1Capabilities, 'attendance-station-arrival:prepare',
  'attendance-station-arrival:commit'] as const;
export const nativeStationCapabilities = [...readCapabilities, 'attendance-station-arrival:prepare',
  'attendance-station-arrival:commit', 'attendance-station-arrival:test-oracle-write'] as const;
export const nativeExitCapabilities = [...readCapabilities, 'attendance-station-exit:prepare',
  'attendance-station-exit:commit', 'attendance-station-exit:test-oracle-write'] as const;
export const managementCapabilities = [...readCapabilities, 'shift-management:prepare', 'shift-management:create',
  'shift-management:change', 'shift-management:cancel', 'shift-management:csv-preview',
  'shift-management:csv-apply', 'shift-management:test-oracle-write'] as const;

export function identity(v: unknown): v is IdentityResponseV1 {
  if (!object(v) || !['isolated-fixture', 'oracle'].includes(String(v.dataSource)) || !object(v.principal)) return false;
  const p = v.principal;
  if (!text(p.subject, 128, 1) || !text(p.displayName, 128) ||
      !['synthetic', 'real'].includes(String(p.provider)) ||
      p.synthetic !== (p.provider === 'synthetic') ||
      !unique(p.roles, r => r === 'Administrator') ||
      !unique(p.capabilities, c => typeof c === 'string' && ([...nativeArrivalCapabilities, ...jointArrivalCapabilities, ...nativeStationCapabilities, ...nativeExitCapabilities, ...managementCapabilities] as readonly string[]).includes(c)) ||
      !(p.employeeId === null || id(p.employeeId)) ||
      !object(p.resourceScope) || !unique(p.resourceScope.orgUnitIds, unit)) return false;
  return !p.synthetic || (p.subject === 'synthetic:administrator' &&
    p.displayName === 'Synthetic Administrator (local/isolated only)' &&
    p.employeeId === null && p.roles.length === 1 &&
    (p.capabilities.join(',') === readCapabilities.join(',') ||
      (v.dataSource === 'isolated-fixture' && p.capabilities.join(',') === f1Capabilities.join(',')) ||
      (v.dataSource === 'isolated-fixture' && p.capabilities.join(',') === jointArrivalCapabilities.join(',')) ||
      p.capabilities.join(',') === managementCapabilities.join(',') ||
      (v.dataSource === 'oracle' && [nativeArrivalCapabilities.join(','), nativeStationCapabilities.join(','), nativeExitCapabilities.join(',')].includes(p.capabilities.join(',')))) &&
    p.resourceScope.orgUnitIds.length > 0 && p.resourceScope.orgUnitIds.length <= 100);
}

export function localTime(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return false;
  const [y, m, d, h, min, s] = v.split(/[-T:]/).map(Number);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 &&
    d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] &&
    h <= 23 && min <= 59 && s <= 59;
}
function zone(v: unknown): v is string {
  if (!text(v, 128, 1) || !/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(v)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; }
}
export function detail(v: unknown, employeeId: string, shiftDayId: string,
  expectedSource: IdentityResponseV1['dataSource'] = 'isolated-fixture'): v is EmployeeShiftDayResponseV1 {
  if (!object(v) || v.employeeId !== employeeId || v.shiftDayId !== shiftDayId ||
      !id(v.employeeId) || !id(v.shiftDayId, 10) || v.dataSource !== expectedSource ||
      !zone(v.businessTimeZone) || !object(v.employee) ||
      !text(v.employee.firstName, 40) || !text(v.employee.lastName, 40) ||
      !text(v.employee.orgUnitId, 8, 1) || !object(v.effectiveShift) || !object(v.attendance)) return false;
  const s = v.effectiveShift, a = v.attendance;
  return [s.startLocal, s.endLocal, a.stageArrivalLocal, a.stationArrivalLocal, a.stationExitLocal]
    .every(t => t === null || localTime(t)) &&
    (s.activityData === null || text(s.activityData, 100)) &&
    (s.siteId === null || id(s.siteId));
}
export const problemCodes: Readonly<Record<number, readonly string[]>> = {
  400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'],
  404: ['SHIFT_DAY_NOT_FOUND'], 503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
  500: ['AMBIGUOUS_SHIFT_DAY', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'],
};
export function problem(v: unknown, status: number): v is ProblemV1 {
  if (!object(v) || v.status !== status || typeof v.code !== 'string' ||
      !problemCodes[status]?.includes(v.code) || v.type !== `urn:shf:problem:${v.code}` ||
      !text(v.title, 256) || typeof v.requestId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(v.requestId)) return false;
  return v.invalidParameters === undefined || (Array.isArray(v.invalidParameters) &&
    v.invalidParameters.every(p => object(p) &&
      ['employeeId', 'shiftDayId', 'query', 'body'].includes(String(p.name)) &&
      ['required', 'invalid-format', 'unsupported'].includes(String(p.reason))));
}
export function displayTime(v: string | null): string {
  return v === null ? 'לא זמין' : `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)} ${v.slice(11)}`;
}
