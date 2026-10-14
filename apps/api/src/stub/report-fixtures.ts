import type { DemoReportSchedule, DemoReportSpan, DemoReportStaff } from './report-contracts.js';

function span(startLocal: string, endLocal: string): DemoReportSpan { return { startLocal, endLocal }; }
function schedule(start: string, end: string): DemoReportSchedule {
  return { active: true, shift: span(start, end), breaks: [], exceptions: [] };
}

export function syntheticReportStaff(): readonly DemoReportStaff[] {
  const original = {
    ...schedule('2026-10-14T08:00:00', '2026-10-14T10:00:00'),
    breaks: [span('2026-10-14T08:20:00', '2026-10-14T08:30:00')],
    exceptions: [span('2026-10-14T08:25:00', '2026-10-14T08:35:00')],
  };
  const second = schedule('2026-10-14T08:00:00', '2026-10-14T09:00:00');
  const third = schedule('2026-10-14T09:00:00', '2026-10-14T10:00:00');
  const night = schedule('2026-10-14T23:00:00', '2026-10-15T01:00:00');
  return [
    {
      employeeId: '00000001', unitId: 'synthetic-team-a', baseline: original,
      modified: { ...original, shift: span('2026-10-14T08:08:00', '2026-10-14T10:00:00') },
    },
    { employeeId: '00000002', unitId: 'synthetic-team-a', baseline: second, modified: { ...second, active: false } },
    {
      employeeId: '00000003', unitId: 'synthetic-team-a', baseline: third,
      modified: schedule('2026-10-14T08:30:00', '2026-10-14T10:00:00'),
    },
    { employeeId: '00000001', unitId: 'synthetic-team-a', baseline: night, modified: structuredClone(night) },
    {
      employeeId: '00000004', unitId: 'synthetic-team-b',
      baseline: schedule('2026-10-14T08:00:00', '2026-10-14T12:00:00'),
      modified: schedule('2026-10-14T08:00:00', '2026-10-14T12:00:00'),
    },
  ];
}

export function syntheticRequiredHeadcount(): Readonly<Record<string, number | null>> {
  return {
    '2026-10-14T08:00:00': 2, '2026-10-14T08:15:00': 2,
    '2026-10-14T08:30:00': 3, '2026-10-14T08:45:00': null,
    '2026-10-14T09:00:00': 2, '2026-10-14T09:15:00': 0,
    '2026-10-14T09:30:00': 3, '2026-10-14T09:45:00': 2,
    '2026-10-14T23:00:00': 1, '2026-10-14T23:15:00': 1,
    '2026-10-14T23:30:00': 1, '2026-10-14T23:45:00': 1,
    '2026-10-15T00:00:00': 1, '2026-10-15T00:15:00': 1,
    '2026-10-15T00:30:00': 1, '2026-10-15T00:45:00': 1,
  };
}
