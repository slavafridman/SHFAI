import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import type { DemoReplacementCandidate, DemoReplacementFacts, DemoReplacementShift } from './replacement-contracts.js';

export function syntheticReplacementScenario() {
  const source: DemoReplacementShift = {
    id: '91000001', employeeId: '00000001', employeeName: 'עובד הדגמה ראשון',
    startLocal: '2026-10-16T08:00:00', endLocal: '2026-10-16T16:00:00', siteId: 'synthetic-site-x',
  };
  const facts: DemoReplacementFacts = {
    jobsCompatible: true, sourceAttendanceClear: true, candidateAttendanceClear: true,
    restMinutes: [660, 720, 720, 660], reviewRequired: false,
  };
  const profiles = [
    { id: 'candidate-1', employeeId: '00000002', start: '08:00', end: '16:00', facts: { ...facts } },
    { id: 'candidate-2', employeeId: '00000003', start: '08:00', end: '16:00',
      facts: { ...facts, jobsCompatible: false, candidateAttendanceClear: false, restMinutes: [659, 720, 720, 660] } },
    { id: 'candidate-3', employeeId: '00000002', start: '10:00', end: '18:00', facts: { ...facts, reviewRequired: true } },
    { id: 'candidate-4', employeeId: '00000003', start: '10:00', end: '18:00',
      facts: { ...facts, jobsCompatible: null, candidateAttendanceClear: null, restMinutes: [null, 720, 720, 660], reviewRequired: null } },
    { id: 'candidate-5', employeeId: '00000004', start: '08:00', end: '16:00', facts: { ...facts } },
  ] satisfies readonly {
    id: string; employeeId: string; start: string; end: string; facts: DemoReplacementFacts;
  }[];
  const rows: { candidate: DemoReplacementCandidate; facts: DemoReplacementFacts }[] = [];
  for (const profile of profiles) {
    const employee = syntheticEmployees().find(item => item.id === profile.employeeId && item.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    if (employee === undefined) { continue; }
    rows.push({
      candidate: {
        id: profile.id,
        shift: {
          id: '92' + profile.id.slice(-1).padStart(6, '0'),
          employeeId: employee.id, employeeName: employee.displayName,
          startLocal: `2026-10-17T${profile.start}:00`, endLocal: `2026-10-17T${profile.end}:00`,
          siteId: 'synthetic-site-x',
        },
      },
      facts: { ...profile.facts, restMinutes: [...profile.facts.restMinutes] },
    });
  }
  return { source, rows };
}
