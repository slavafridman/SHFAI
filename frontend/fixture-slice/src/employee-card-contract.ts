// Erased imports only: shared contract ownership stays with the architect.
export type { EmployeeOperationalCardV1, EmployeeOperationalCardProblemV1 } from '../../../backend/fixture-slice/employee-card-contracts.mts';
import type { EmployeeOperationalCardV1, EmployeeOperationalCardProblemV1 } from '../../../backend/fixture-slice/employee-card-contracts.mts';
import { id, type IdentityResponseV1 } from './contract';
import { obj, clean, unitCode, parent, zone, coherentSource } from './current-shifts-contract';

const signed = (v: unknown): v is string =>
  typeof v === 'string' && /^(?:[1-9][0-9]{0,37}|-[1-9][0-9]{0,37})$/.test(v);
const cardUnit = (v: unknown): v is string => unitCode(v) && !['*', '-1', 'null'].includes(v);
const label = (v: unknown): v is string =>
  clean(v, 256) && !!v.trim() && !/[<>]/u.test(v);
function job(v: unknown, positiveOnly: boolean): boolean {
  return v === null || (obj(v) && signed(v['code']) &&
    (v['label'] === null || (label(v['label']) && v['label'].trim() === v['label'])) &&
    (!positiveOnly || !v['code'].startsWith('-') || v['label'] === null));
}
/** Validate the WHOLE response before projection; never derive scope from an origin row. */
export function employeeCard(v: unknown, employeeId: string, identity: IdentityResponseV1): v is EmployeeOperationalCardV1 {
  if (!obj(v) || !id(employeeId) || v['employeeId'] !== employeeId ||
    !coherentSource(identity.dataSource, v['dataSource']) || !zone(v['businessTimeZone']) ||
    !obj(v['employee'])) return false;
  const e = v['employee'], u = e['unit'];
  return clean(e['firstName'], 40) && !!e['firstName'].trim() &&
    clean(e['lastName'], 40) && !!e['lastName'].trim() &&
    obj(u) && cardUnit(u['code']) && label(u['label']) &&
    parent(u['moked']) && cardUnit(u['moked'].code) && label(u['moked'].label) &&
    u['code'] !== u['moked'].code && identity.principal.resourceScope.orgUnitIds.includes(u['code']) &&
    job(e['job'], true) && job(e['innerJob'], false);
}
/** Explicit allowlist: unknown/private fields must never enter component state or DOM. */
export function projectEmployeeCard(v: EmployeeOperationalCardV1): EmployeeOperationalCardV1 {
  const e = v.employee, u = e.unit;
  const catalog = (v: typeof e.job) => v === null ? null : { code: v.code, label: v.label };
  return { employeeId: v.employeeId, employee: {
    firstName: e.firstName, lastName: e.lastName,
    unit: { code: u.code, label: u.label, moked: { code: u.moked.code, label: u.moked.label, unitType: 'G01' } },
    job: catalog(e.job), innerJob: catalog(e.innerJob),
  }, businessTimeZone: v.businessTimeZone, dataSource: v.dataSource };
}
const codes: Record<number, string[]> = {
  400: ['INVALID_REQUEST'], 401: ['UNAUTHENTICATED'], 403: ['FORBIDDEN'], 404: ['EMPLOYEE_NOT_FOUND'],
  500: ['AMBIGUOUS_EMPLOYEE', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR'],
  503: ['DEPENDENCY_UNAVAILABLE', 'DEPENDENCY_TIMEOUT'],
};
export function employeeCardProblem(v: unknown, status: number): v is EmployeeOperationalCardProblemV1 {
  return obj(v) && v['status'] === status && typeof v['code'] === 'string' &&
    !!codes[status]?.includes(v['code']) && v['type'] === `urn:shf:problem:${v['code']}` &&
    clean(v['title'], 256) && typeof v['requestId'] === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v['requestId']) &&
    (v['invalidParameters'] === undefined || (Array.isArray(v['invalidParameters']) &&
      v['invalidParameters'].every(p => obj(p) && ['employeeId', 'query', 'body'].includes(String(p['name'])) &&
        ['required', 'invalid-format', 'unsupported'].includes(String(p['reason'])))));
}
