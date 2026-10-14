import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import type { DemoStaffingCandidate, DemoStaffingEligibilityFacts, DemoStaffingRequest } from './staffing-contracts.js';

export const STAFFING_CLOCK_LOCAL = '2026-10-13T08:00:00';

export function syntheticStaffingEligibilityFacts(candidateId: string): DemoStaffingEligibilityFacts {
  return {
    jobCompatible: candidateId === 'staff-candidate-1' || candidateId === 'staff-candidate-5' ? true : null,
    intervalCompatible: candidateId === 'staff-candidate-1' || candidateId === 'staff-candidate-5' ? true : null,
    registrationExists: candidateId === 'staff-candidate-5',
  };
}

export function syntheticStaffingRequests(): readonly DemoStaffingRequest[] {
  return [
    {
      id: '93000001', kind: 'reinforcement', unitId: 'synthetic-team-a', title: 'תגבור סינתטי — דוגמת קיבולת פנויה',
      startLocal: '2026-10-16T08:00:00', endLocal: '2026-10-16T16:00:00',
      requested: 3, approved: 1, remaining: 2, deadlineLocal: '2026-10-15T18:00:00',
      deadlineState: 'open', freshness: 'current', note: 'תצוגה בלבד; נתון אישור קיים בדוגמה אינו פעולה שבוצעה כאן.',
    },
    {
      id: '93000002', kind: 'time-change', unitId: 'synthetic-team-a', title: 'שינוי שעות סינתטי — קיבולת מלאה ומועד שחלף',
      startLocal: '2026-10-17T08:00:00', endLocal: '2026-10-17T16:00:00',
      requested: 2, approved: 2, remaining: 0, deadlineLocal: '2026-10-13T07:00:00',
      deadlineState: 'elapsed', freshness: 'stale', note: 'המצב והמועד מומצאים ביחס לשעון התרחיש, לא בזמן אמת.',
    },
    {
      id: '93000003', kind: 'reduction', unitId: 'synthetic-team-a', title: 'צמצום סינתטי — רשימת מועמדים ריקה',
      startLocal: '2026-10-17T10:00:00', endLocal: '2026-10-17T18:00:00',
      requested: 1, approved: 0, remaining: 1, deadlineLocal: '2026-10-16T18:00:00',
      deadlineState: 'open', freshness: 'current', note: null,
    },
    {
      id: '93000004', kind: 'reinforcement', unitId: 'synthetic-team-a', title: 'תגבור סינתטי — מידע לא ידוע',
      startLocal: '2026-10-17T12:00:00', endLocal: '2026-10-17T20:00:00',
      requested: null, approved: null, remaining: null, deadlineLocal: null,
      deadlineState: 'unknown', freshness: 'unknown', note: '<strong>טקסט סינתטי בלבד, לא HTML</strong>',
    },
    {
      id: '93000005', kind: 'time-change', unitId: 'synthetic-team-a', title: 'שינוי שעות סינתטי — מועמד שדורש רענון',
      startLocal: '2026-10-18T08:00:00', endLocal: '2026-10-18T16:00:00',
      requested: 1, approved: 0, remaining: 1, deadlineLocal: '2026-10-17T18:00:00',
      deadlineState: 'open', freshness: 'current', note: 'הצגת מועמד אינה זכאות או אישור לשינוי.',
    },
    {
      id: '93000006', kind: 'reduction', unitId: 'synthetic-team-b', title: 'synthetic-hidden-request',
      startLocal: '2026-10-16T08:00:00', endLocal: '2026-10-16T16:00:00',
      requested: 1, approved: 0, remaining: 1, deadlineLocal: null,
      deadlineState: 'unknown', freshness: 'unknown', note: null,
    },
    {
      id: '93000007', kind: 'reduction', unitId: 'synthetic-team-a', title: 'צמצום סינתטי — דוגמת תצוגה מקדימה',
      startLocal: '2026-10-18T08:00:00', endLocal: '2026-10-18T16:00:00',
      requested: 2, approved: 0, remaining: 2, deadlineLocal: '2026-10-17T18:00:00',
      deadlineState: 'open', freshness: 'current', note: 'חישוב קיבולת בלבד; אין אישור לצמצום או לביטול משמרת.',
    },
  ];
}

export function syntheticStaffingCandidates(requestId: string): readonly DemoStaffingCandidate[] {
  if (requestId === '93000003') { return []; }
  const profiles: readonly {
    id: string; employeeId: string; freshness: DemoStaffingCandidate['freshness']; asOfLocal: string | null;
  }[] = requestId === '93000004' ? [
    { id: 'staff-candidate-3', employeeId: '00000003', freshness: 'unknown', asOfLocal: null },
  ] : [
    { id: 'staff-candidate-1', employeeId: '00000002', freshness: 'current', asOfLocal: STAFFING_CLOCK_LOCAL },
    { id: 'staff-candidate-2', employeeId: '00000003', freshness: 'stale', asOfLocal: '2026-10-12T08:00:00' },
    { id: 'staff-candidate-4', employeeId: '00000004', freshness: 'current', asOfLocal: STAFFING_CLOCK_LOCAL },
  ];
  const scopedProfiles = requestId === '93000005' ? [
    ...profiles, { id: 'staff-candidate-5', employeeId: '00000001', freshness: 'current' as const, asOfLocal: STAFFING_CLOCK_LOCAL },
  ] : profiles;
  return scopedProfiles.flatMap(profile => {
    const employee = syntheticEmployees().find(item => item.id === profile.employeeId && item.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    return employee === undefined ? [] : [{
      ...profile, employeeName: employee.displayName,
      note: 'מועמד לדוגמה בלבד; נדרשת בדיקה מחדש לפני כל פעולה עתידית.',
    }];
  });
}
