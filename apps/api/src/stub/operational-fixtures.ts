import { HttpException } from '@nestjs/common';
import { parsePersonalShiftQuery, selectPersonalShifts } from '../personal-shifts/personal-shifts.js';
import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import { createSyntheticShiftFacts } from './fixtures.js';
import type { DemoAttendance, DemoAttendanceRow, DemoOperationalShift } from './operational-contracts.js';
import { stubProblem } from './stub-http.js';

export function syntheticOperationalShifts(input: unknown): readonly DemoOperationalShift[] {
  const query = parsePersonalShiftQuery(input);
  const facts = [
    ...createSyntheticShiftFacts(),
    {
      id: '9007199254741001', projection: 'override', eligibility: 'included', baseline: null,
      effective: {
        employeeId: '00000004', startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T16:00:00',
        siteId: null, activityId: null, workFromHomeFlag: null,
        split: { flag: null, gapStartLocal: null, gapEndLocal: null },
      },
    },
  ];
  const rows = syntheticEmployees().filter(employee => employee.orgUnit.id === DEMO_EMPLOYEE_UNIT)
    .flatMap(employee => selectPersonalShifts(facts, {
      actorEmployeeId: employee.id, canViewBaseline: false,
    }, { ...query, limit: 100 }).items.map(shift => ({ employeeName: employee.displayName, shift })));
  rows.sort((left, right) => {
    const a = left.shift;
    const b = right.shift;
    if (a.effective.startLocal !== b.effective.startLocal) {
      return a.effective.startLocal < b.effective.startLocal ? 1 : -1;
    }
    return BigInt(a.id) < BigInt(b.id) ? 1 : BigInt(a.id) > BigInt(b.id) ? -1 : 0;
  });
  if (rows.length > query.limit) {
    throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
  }
  return rows;
}

export function syntheticAttendance(input: unknown): readonly DemoAttendanceRow[] {
  const attendance: Readonly<Record<string, DemoAttendance>> = {
    '9007199254740993': {
      stageArrivalLocal: '2026-10-14T07:55:00', stationArrivalLocal: '2026-10-14T08:00:00',
      stationExitLocal: '2026-10-14T16:00:00', lateMinutes: 0, missingReason: null,
    },
    '9007199254740994': {
      stageArrivalLocal: '2026-10-15T08:02:00', stationArrivalLocal: '2026-10-15T08:05:00',
      stationExitLocal: null, lateMinutes: 5, missingReason: null,
    },
    '9007199254740995': {
      stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
      lateMinutes: null, missingReason: 'סיבת היעדרות סינתטית לדוגמה',
    },
    '9007199254740996': {
      stageArrivalLocal: '2026-10-17T07:58:00', stationArrivalLocal: null,
      stationExitLocal: null, lateMinutes: null, missingReason: null,
    },
    '9007199254740998': {
      stageArrivalLocal: '2026-10-16T22:55:00', stationArrivalLocal: '2026-10-16T23:00:00',
      stationExitLocal: '2026-10-17T06:00:00', lateMinutes: 0, missingReason: null,
    },
    '9007199254740999': {
      stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
      lateMinutes: null, missingReason: null,
    },
    '9007199254741000': {
      stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
      lateMinutes: null, missingReason: null,
    },
  };
  return syntheticOperationalShifts(input).map(row => {
    const actual = attendance[row.shift.id];
    if (actual === undefined) {
      throw new HttpException(stubProblem(503, 'STUB_ATTENDANCE_UNAVAILABLE', 'נתוני נוכחות ההדגמה אינם מוגדרים.'), 503);
    }
    return { ...row, attendance: { ...actual } };
  });
}
