import type { DemoEmployeeRecord, EmployeeSection } from './employee-contracts.js';

export function syntheticEmployeeRecords(employeeId: string, section: EmployeeSection): readonly DemoEmployeeRecord[] {
  if (employeeId === '00000002') {
    return [];
  }
  if (employeeId === '00000003') {
    return [{ id: `${section}-unknown`, label: 'רשומת הדגמה עם נתונים לא ידועים — Demo ABC', detail: null, dateLocal: null }];
  }
  const fixtures: Record<EmployeeSection, readonly DemoEmployeeRecord[]> = {
    skills: [
      { id: 'skill-demo-1', label: 'מיומנות שירות לדוגמה', detail: 'רמה סינתטית: 2 · פעילה', dateLocal: '2026-10-01' },
      { id: 'skill-demo-2', label: 'שפה לדוגמה — Hebrew / English', detail: null, dateLocal: null },
    ],
    events: [
      { id: 'event-demo-1', label: 'אירוע נוכחות סינתטי', detail: 'תצוגה בלבד; אין רישום או תיקון נוכחות.', dateLocal: '2026-10-14' },
      { id: 'event-demo-2', label: 'אירוע עובד לדוגמה', detail: '<b>טקסט סינתטי בלבד</b>', dateLocal: '2026-10-13' },
    ],
    education: [
      { id: 'education-demo-1', label: 'רשומת השכלה סינתטית', detail: 'נתון מומצא להדגמת ממשק בלבד; אין מקור השכלה מאומת.', dateLocal: null },
    ],
  };
  return fixtures[section].map(item => ({ ...item }));
}
