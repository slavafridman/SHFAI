import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import type { DemoBuilding } from './building-contracts.js';

export function syntheticBuildings(): readonly DemoBuilding[] {
  const unit = { id: DEMO_EMPLOYEE_UNIT, name: 'צוות הדגמה א׳' };
  return [
    { id: '94000001', name: 'מבנה ראשי לדוגמה', orgUnit: { ...unit }, address: 'רחוב הדגמה 1 — כתובת מומצאת בלבד', seatCapacity: 72 },
    { id: '94000002', name: 'מבנה ללא מושבים לדוגמה', orgUnit: { ...unit }, address: '<b>כתובת הדגמה בלבד</b>', seatCapacity: 0 },
    { id: '94000003', name: 'מבנה עם פרטים לא ידועים — Demo ABC', orgUnit: { ...unit }, address: null, seatCapacity: null },
    { id: '94000004', name: 'synthetic-hidden-building', orgUnit: { id: 'synthetic-team-b', name: 'synthetic-hidden-unit' }, address: 'synthetic-hidden-address', seatCapacity: 99 },
  ];
}
