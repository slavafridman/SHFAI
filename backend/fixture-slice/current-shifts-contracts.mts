// Canonical type-only contracts: approved section 19 v0.1 (15 October 2026).
// Types do not validate runtime input. No Oracle, HTTP or messaging implementation.
import type {
  DecimalId, LocalDateTime, PrincipalV1, ShiftDayId,
} from "./contracts.mts";

export type LocalDateV1 = string; // Gregorian YYYY-MM-DD, valid year 0001–9999
export type MinuteV1 = string; // exact HH:mm, 00:00–23:59
export type UnitCodeV1 = string; // exact 1–8 characters; no whitespace/control chars
export type CurrentShiftDataSourceV1 = "isolated-fixture" | "oracle-read-only";

export interface MokedOptionV1 {
  code: UnitCodeV1;
  label: string; // nonempty Unicode plain text, <=256 code points
  unitType: "G01";
}

export interface CurrentShiftFilterContextV1 {
  defaults: {
    mode: "at";
    attendanceDate: LocalDateV1;
    currentTime: MinuteV1;
    mokedCode: UnitCodeV1 | null;
  };
  mokedOptions: MokedOptionV1[];
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

// Validated query: omitted pagination/sort uses 25 / 0 / effective-start-asc.
// Raw HTTP keys must first be checked for duplicates, unknown keys and grammar.
// Both GETs forbid a body; filter-context also forbids every query key.
export type CurrentShiftRequestV1 = (
  | {
    mode: "at";
    attendanceDate: LocalDateV1;
    currentTime: MinuteV1;
    offset?: number; // canonical wire integer 0–10000
  }
  | {
    mode: "current";
    attendanceDate?: never;
    currentTime?: never;
    offset?: 0;
  }
) & {
  mokedCode?: UnitCodeV1; // omitted = all authorized parents; never null/-1
  limit?: number; // canonical wire integer 1–100
  sort?: "effective-start-asc";
};

export interface CatalogValueV1 {
  code: string; // nonempty <=128 code points; no control chars
  label: string | null; // plain Unicode <=256 code points; null = unresolved
}

export type CurrentAttendanceDisplayV1 =
  | { kind: "missing-reason"; reason: CatalogValueV1 }
  | { kind: "station-arrival"; atLocal: LocalDateTime }
  | { kind: "not-recorded" };

export interface CurrentShiftRowV1 {
  shiftDayId: ShiftDayId;
  employee: {
    employeeId: DecimalId;
    firstName: string; // <=40 Unicode characters
    lastName: string; // <=40 Unicode characters
    unit: {
      code: UnitCodeV1; // employee's exact J01 team, NOT its G01 parent
      label: string; // nonempty plain Unicode, <=256 code points
      moked: MokedOptionV1;
    };
  };
  startLocal: LocalDateTime;
  endLocal: LocalDateTime;
  workingFromHome: boolean | null;
  activities: CatalogValueV1[]; // <=100 tokens; source order/duplicates retained
  innerJob: CatalogValueV1 | null;
  attendanceDisplay: CurrentAttendanceDisplayV1;
}

export interface CurrentShiftListV1 {
  items: CurrentShiftRowV1[];
  applied: {
    requestedMode: "at" | "current";
    attendanceDate: LocalDateV1;
    currentTime: MinuteV1;
    mokedCode: UnitCodeV1 | null;
    sort: "effective-start-asc";
  };
  page: {
    limit: number;
    offset: number;
    hasMore: boolean;
    nextOffset: number | null;
  };
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

export interface CurrentShiftProblemV1 {
  type: string; // urn:shf:problem:<exact code>
  title: string; // stable sanitized summary; no offending input
  status: number;
  code: "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "AMBIGUOUS_CURRENT_SHIFT" | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR";
  requestId: string;
  invalidParameters?: Array<{
    name: "mode" | "attendanceDate" | "currentTime" | "mokedCode"
      | "limit" | "offset" | "sort" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

export interface CurrentShiftAccessPolicy {
  requireCurrentShiftRead(principal: PrincipalV1): void;
  authorizedCurrentShiftUnitIds(principal: PrincipalV1): string[];
}

// Minimal internal ports realizing section 19.3, not additional REST fields.
// Clock returns an instant only; source/response civil dates never become Date.
export interface Clock {
  now(): Date;
}

export interface CurrentShiftReadSelection {
  authorizedTeamUnitIds: readonly UnitCodeV1[]; // exact scope; no parent inheritance
  attendanceDate: LocalDateV1;
  currentTime: MinuteV1; // already resolved once by the application clock/zone
  mokedCode: UnitCodeV1 | null;
  limit: number; // requested page size 1–100; reader returns at most limit+1
  offset: number; // 0–10000
  sort: "effective-start-asc";
}

export interface CurrentShiftReadPort {
  // Distinct G01 parents of exactly these authorized J01 teams, code-point sorted.
  // Maximum 100; missing/wrong hierarchy is invalid fixture configuration.
  readMokedOptions(authorizedTeamUnitIds: readonly UnitCodeV1[]): Promise<MokedOptionV1[]>;
  // One consistent fixture or Oracle read: authorize/filter, project, sort, window.
  // Start inclusive/end exclusive, cancellation null, effective day-type 4.
  // Sort: local start, numeric day ID, numeric employee ID; never JS Number IDs.
  // Duplicate qualifying day => sanitized AMBIGUOUS_CURRENT_SHIFT, not first-row.
  // Includes at most one lookahead row, consumed by application pagination.
  // Oracle must apply these predicates/window in SQL, not readAll into Node.
  // Detect ambiguity across the qualifying scoped selection BEFORE windowing,
  // including an empty requested page. Rejections use existing problem codes.
  // Read-only transaction/snapshot and connection cleanup belong to the adapter.
  readRows(selection: CurrentShiftReadSelection): Promise<CurrentShiftRowV1[]>;
}

// Fixture hierarchy used with existing StartupConfig.syntheticOrgUnitIds.
// Every configured grant must be an exact J01 team with a direct G01 parent.
// This is internal fixture metadata, not a new identity/startup wire protocol.
export interface CurrentShiftFixtureCatalog {
  mokedUnits: readonly MokedOptionV1[];
  teams: ReadonlyArray<{
    code: UnitCodeV1;
    label: string;
    unitType: "J01";
    parentMokedCode: UnitCodeV1;
  }>;
}
