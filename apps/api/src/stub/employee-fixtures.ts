import type { DemoEmployee } from './employee-contracts.js';

export const DEMO_EMPLOYEE_UNIT = 'synthetic-team-a';

export function syntheticEmployees(): readonly DemoEmployee[] {
  const unit = { id: DEMO_EMPLOYEE_UNIT, name: 'צוות הדגמה א׳' };
  return [
    { id: '00000001', displayName: 'עובד הדגמה ראשון', orgUnit: { ...unit }, jobName: 'נציג הדגמה' },
    { id: '00000002', displayName: 'עובדת הדגמה שנייה', orgUnit: { ...unit }, jobName: 'אחראית צוות הדגמה' },
    {
      id: '00000003',
      displayName: 'עובד הדגמה עם שם ארוך לבדיקת תצוגה משולבת בעברית ובאנגלית — Demo ABC',
      orgUnit: { ...unit }, jobName: null,
    },
    {
      id: '00000004', displayName: 'synthetic-hidden-employee',
      orgUnit: { id: 'synthetic-team-b', name: 'synthetic-hidden-unit' }, jobName: null,
    },
  ];
}
