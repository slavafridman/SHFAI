import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import { resolveDemoParameter, type DemoSystemParameter } from './system-parameter-contracts.js';

export function syntheticSystemParameters(): readonly DemoSystemParameter[] {
  const unit = { id: DEMO_EMPLOYEE_UNIT, name: 'צוות הדגמה א׳' };
  return [
    {
      code: 'shf.param.minutesArrivalBeforeStation', name: 'תזמון כניסה לתחנה — דוגמה',
      orgUnit: { id: 'synthetic-team-b', name: 'synthetic-hidden-unit' },
      unitValue: '999', defaultValue: null, ...resolveDemoParameter('999', null), measurement: 'unverified',
    },
    {
      code: 'shf.param.minutesArrivalBeforeStation', name: 'תזמון כניסה לתחנה — דוגמה', orgUnit: { ...unit },
      unitValue: '0', defaultValue: '5', ...resolveDemoParameter('0', '5'), measurement: 'unverified',
    },
    {
      code: 'shf.param.differenceBetweenShifts', name: 'מרווח בין משמרות — דוגמה', orgUnit: { ...unit },
      unitValue: null, defaultValue: '11.50', ...resolveDemoParameter(null, '11.50'), measurement: 'unverified',
    },
    {
      code: 'shf.param.minimalShiftDuration', name: 'משך משמרת מזערי — דוגמה', orgUnit: { ...unit },
      unitValue: null, defaultValue: null, ...resolveDemoParameter(null, null), measurement: 'unverified',
    },
  ];
}
