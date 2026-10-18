import type { EmployeeShiftDayResponseV1, IdentityResponseV1, ProblemV1 } from './contract';

// Entirely synthetic. No captured business or personal data.
export function fixtureIdentity(): IdentityResponseV1 {
  return {
    principal: {
      subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
      displayName: 'Synthetic Administrator (local/isolated only)',
      roles: ['Administrator'], capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read'], employeeId: null,
      resourceScope: { orgUnitIds: ['TEST-U'] },
    },
    dataSource: 'isolated-fixture',
  };
}
export function fixtureRow(employeeId = '1001', shiftDayId = '2001'): EmployeeShiftDayResponseV1 {
  return {
    employeeId, shiftDayId,
    employee: { firstName: 'בדיקה', lastName: 'סינתטית', orgUnitId: 'TEST-U' },
    effectiveShift: {
      startLocal: '2026-10-15T23:30:00', endLocal: '2026-10-16T07:00:00',
      activityData: 'בדיקה;TEST', siteId: '9001',
    },
    attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
  };
}
export function fixtureProblem(status: number, code: ProblemV1['code']): ProblemV1 {
  return { type: `urn:shf:problem:${code}`, title: 'Synthetic test failure',
    status, code, requestId: 'synthetic-request-01' };
}
