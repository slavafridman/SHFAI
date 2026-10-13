export interface PersonalShiftQuery {
  readonly from: string;
  readonly toExclusive: string;
  readonly limit: number;
}

export interface PersonalShiftScope {
  readonly actorEmployeeId: string;
  readonly canViewBaseline: boolean;
}

export interface ShiftSchedule {
  readonly employeeId: string;
  readonly startLocal: string;
  readonly endLocal: string;
  readonly siteId: string | null;
  readonly activityId: string | null;
  readonly workFromHome: boolean | null;
  readonly split: {
    readonly enabled: boolean | null;
    readonly gapStartLocal: string | null;
    readonly gapEndLocal: string | null;
  };
}

export interface PersonalShiftItem {
  readonly id: string;
  readonly projection: 'baseline' | 'override';
  readonly effective: ShiftSchedule;
  readonly baseline: ShiftSchedule | null;
  readonly baselineAvailability: 'available' | 'not-authorized' | 'not-present';
}

export interface PersonalShiftSelection {
  readonly items: readonly PersonalShiftItem[];
  readonly hasMore: boolean;
}

export interface PersonalShiftList {
  readonly items: readonly PersonalShiftItem[];
  readonly nextCursor: string | null;
  readonly fetchedAt: string;
  readonly businessTimeZone: string;
}
