import type { PersonalShiftItem } from '../personal-shifts/contracts.js';

export interface DemoOperationalShift {
  readonly employeeName: string;
  readonly shift: PersonalShiftItem;
}

export interface DemoAttendance {
  readonly stageArrivalLocal: string | null;
  readonly stationArrivalLocal: string | null;
  readonly stationExitLocal: string | null;
  readonly lateMinutes: number | null;
  readonly missingReason: string | null;
}

export interface DemoAttendanceRow extends DemoOperationalShift {
  readonly attendance: DemoAttendance;
}
