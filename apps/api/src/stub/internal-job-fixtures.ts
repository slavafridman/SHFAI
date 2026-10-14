import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import type { DemoInternalJob } from './internal-job-contracts.js';

export function syntheticInternalJobs(): readonly DemoInternalJob[] {
  const unit = { id: DEMO_EMPLOYEE_UNIT, name: 'צוות הדגמה א׳' };
  return [
    { id: '95000001', name: 'תפקיד פעיל לדוגמה', orgUnit: { ...unit }, active: true, groupCode: '12' },
    { id: '95000002', name: 'תפקיד לא פעיל לדוגמה', orgUnit: { ...unit }, active: false, groupCode: '0' },
    { id: '9007199254740997', name: '<b>תפקיד הדגמה בלבד</b> — Demo ABC', orgUnit: { ...unit }, active: null, groupCode: null },
    { id: '95000004', name: 'synthetic-hidden-job', orgUnit: { id: 'synthetic-team-b', name: 'synthetic-hidden-unit' }, active: true, groupCode: '12' },
  ];
}
