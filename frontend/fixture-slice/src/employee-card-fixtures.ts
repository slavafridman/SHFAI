import type { EmployeeOperationalCardV1 } from './employee-card-contract';
/** Entirely invented local test data, not captured employee data. */
export function fixtureEmployeeCard(employeeId = '1001'): EmployeeOperationalCardV1 {
  return { employeeId, employee: {
    firstName: 'דנה', lastName: 'לוי',
    unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: { code: 'TEST-M', label: 'מוקד בדיקה', unitType: 'G01' } },
    job: { code: '11', label: 'תפקיד בדיקה' }, innerJob: { code: '101', label: 'תפקיד פנימי לבדיקה' },
  }, businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
}
