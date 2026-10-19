import { describe, it, expect } from 'vitest';
import { employeeCard, employeeCardProblem, projectEmployeeCard } from './employee-card-contract';
import { fixtureEmployeeCard } from './employee-card-fixtures';
import { fixtureIdentity } from './test-fixtures';

describe('CARD exact unknown boundary / approved 32+33+34', () => {
  const actor = fixtureIdentity();
  it('accepts exact fixture and oracle source pairs, never mixed', () => {
    const v = fixtureEmployeeCard(), p = fixtureIdentity();
    expect(employeeCard(v, '1001', p)).toBe(true);
    p.dataSource = 'oracle'; expect(employeeCard(v, '1001', p)).toBe(false);
    v.dataSource = 'oracle-read-only'; expect(employeeCard(v, '1001', p)).toBe(true);
    p.dataSource = 'isolated-fixture'; expect(employeeCard(v, '1001', p)).toBe(false);
  });
  it.each(['id', 'scope', 'self-parent', 'parent-type', 'parent-label', 'name', 'zone',
    'missing-job', 'zero', 'negative-zero', 'leading-zero', 'precision', 'fraction', 'label', 'negative-label',
    'markup-label', 'sentinel-team', 'sentinel-parent'])(
    'rejects entire malformed %s response', kind => {
      const v: any = fixtureEmployeeCard();
      if (kind === 'id') v.employeeId = '1002';
      if (kind === 'scope') v.employee.unit.code = 'TEST';
      if (kind === 'self-parent') v.employee.unit.moked.code = v.employee.unit.code;
      if (kind === 'parent-type') v.employee.unit.moked.unitType = 'J01';
      if (kind === 'parent-label') v.employee.unit.moked.label = null;
      if (kind === 'name') v.employee.firstName = '\u0000';
      if (kind === 'zone') v.businessTimeZone = 'bad/zone';
      if (kind === 'missing-job') delete v.employee.job;
      if (kind === 'zero') v.employee.job.code = '0';
      if (kind === 'negative-zero') v.employee.job.code = '-0';
      if (kind === 'leading-zero') v.employee.job.code = '01';
      if (kind === 'precision') v.employee.job.code = '9'.repeat(39);
      if (kind === 'fraction') v.employee.innerJob.code = '1.2';
      if (kind === 'label') v.employee.innerJob.label = ' ';
      if (kind === 'negative-label') v.employee.job = { code: '-9', label: 'fabricated' };
      if (kind === 'markup-label') v.employee.unit.label = '<invalid>';
      if (kind === 'sentinel-team') v.employee.unit.code = '*';
      if (kind === 'sentinel-parent') v.employee.unit.moked.code = 'null';
      expect(employeeCard(v, '1001', actor)).toBe(false);
    });
  it('preserves long exact IDs, signed precision and optional null vs unknown', () => {
    const v = fixtureEmployeeCard('9'.repeat(38));
    v.employee.job = { code: '-' + '9'.repeat(38), label: null }; v.employee.innerJob = null;
    expect(employeeCard(v, v.employeeId, actor)).toBe(true);
    v.employee.firstName = '😀'.repeat(40); expect(employeeCard(v, v.employeeId, actor)).toBe(true);
    v.employee.firstName += 'א'; expect(employeeCard(v, v.employeeId, actor)).toBe(false);
  });
  it('projects only approved data, including nested objects; extra sentinel never survives', () => {
    const v: any = fixtureEmployeeCard();
    v.privateSentinel = 'DO_NOT_RENDER'; v.employee.privateSentinel = 'DO_NOT_RENDER';
    v.employee.unit.privateSentinel = 'DO_NOT_RENDER'; v.employee.job.privateSentinel = 'DO_NOT_RENDER';
    expect(employeeCard(v, '1001', actor)).toBe(true);
    expect(JSON.stringify(projectEmployeeCard(v))).not.toContain('DO_NOT_RENDER');
    expect(projectEmployeeCard(v)).toEqual(fixtureEmployeeCard());
  });
  it.each([[400,'INVALID_REQUEST'],[401,'UNAUTHENTICATED'],[403,'FORBIDDEN'],[404,'EMPLOYEE_NOT_FOUND'],
    [500,'AMBIGUOUS_EMPLOYEE'],[500,'INVALID_SOURCE_DATA'],[500,'INTERNAL_ERROR'],
    [503,'DEPENDENCY_TIMEOUT'],[503,'DEPENDENCY_UNAVAILABLE']])('accepts only card problem %s/%s', (status,code) => {
      const v = { type:`urn:shf:problem:${code}`,title:'Synthetic failure',status,code,requestId:'test-opaque' };
      expect(employeeCardProblem(v, Number(status))).toBe(true);
      expect(employeeCardProblem({ ...v, invalidParameters:[{name:'shiftDayId',reason:'required'}] },Number(status))).toBe(false);
    });
});
