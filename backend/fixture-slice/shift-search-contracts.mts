// Canonical type-only contracts: approved sections 23/24 v0.1, recorded in section 25.
// No HTTP, SQL, driver, validation or identity-provider implementation.
import type { DecimalId, PrincipalV1 } from "./contracts.mts";
import type {
  CatalogValueV1, CurrentShiftDataSourceV1, CurrentShiftListV1,
  CurrentShiftRowV1, LocalDateV1, MinuteV1, MokedOptionV1, UnitCodeV1,
} from "./current-shifts-contracts.mts";

export type ShiftSearchWorkLocationV1 = "home" | "site";

export interface ShiftSearchFilterContextV1 {
  defaults: {
    attendanceDate: LocalDateV1;
    timeFrom: MinuteV1;
    timeTo: MinuteV1;
    mokedCode: UnitCodeV1 | null;
    teamCodes: UnitCodeV1[]; // [] = all authorized within optional parent
    innerJobCodes: string[]; // [] = no restriction
    workLocations: ShiftSearchWorkLocationV1[]; // [] = no restriction
  };
  mokedOptions: MokedOptionV1[];
  teamOptions: Array<{
    code: UnitCodeV1;
    label: string; // nonempty plain Unicode <=256 code points
    unitType: "J01";
    parentMokedCode: UnitCodeV1;
  }>;
  innerJobOptions: CatalogValueV1[]; // active/selectable; labels nonnull/nonempty
  workLocationOptions: Array<{ code: ShiftSearchWorkLocationV1; label: string }>;
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

// Validated application input, NOT raw HTTP values. Only the three list keys
// use a single comma-delimited wire value, decoded once; no repeated keys.
// Both GETs forbid bodies; context forbids all query keys. Unknown keys fail.
// Raw query <=8192 UTF-8 bytes. No sentinels, nulls, empty values or coercion.
export interface ShiftSearchRequestV1 {
  attendanceDate: LocalDateV1; // one valid Gregorian date, years 0001–9999
  timeFrom: MinuteV1; // strict HH:mm; timeFrom <= timeTo, equality permitted
  timeTo: MinuteV1; // reversed range => timeTo/invalid-format, no rollover
  mokedCode?: UnitCodeV1;
  teamCodes?: UnitCodeV1[]; // 1–100 distinct exact authorized codes, no commas
  innerJobCodes?: DecimalId[]; // 1–100 distinct canonical positive 1–38 digit IDs
  workLocations?: ShiftSearchWorkLocationV1[]; // 1–2 distinct tokens
  limit?: number; // canonical wire integer 1–100; default 25
  offset?: number; // canonical wire integer 0–10000; default 0
  sort?: "effective-start-asc"; // default and sole order
}

export type ShiftSearchRowV1 =
  Omit<CurrentShiftRowV1, "attendanceDisplay"> & {
    // Baseline WM_EXCEPTION_TYPE_ID >0, only if effective activity has no
    // nonempty raw tokens; unresolved activity labels do not trigger fallback.
    activityFallback: CatalogValueV1 | null;
    indicators: {
      hasRemark: boolean; // nonblank remark, never its body
      hasCancelLoginAnnotation: boolean; // nonblank applier, NOT cancellation
      // Nonnull changed start/end differs from respective baseline, OR baseline
      // employee reference equals changed reference and nonnull changed home
      // differs from baseline. Compare references internally, never expose/log.
      timeOrLocationChanged: boolean;
      split: boolean; // changed iff nonnull else baseline; case-insensitive Y
      addedStaffing: boolean; // case-sensitive source startsWith("f"), null=false
      employeeReassigned: boolean; // nonnull changed employee != baseline
      extensionAllocated: boolean | null; // effective home: extension != null; else null
    };
  };

export interface ShiftSearchListV1 {
  items: ShiftSearchRowV1[];
  applied: {
    attendanceDate: LocalDateV1;
    timeFrom: MinuteV1;
    timeTo: MinuteV1;
    mokedCode: UnitCodeV1 | null;
    teamCodes: UnitCodeV1[]; // normalized exact code-point order; omitted => []
    innerJobCodes: string[]; // normalized exact code-point order; omitted => []
    workLocations: ShiftSearchWorkLocationV1[]; // home then site; omitted => []
    sort: "effective-start-asc";
  };
  // limit/offset/hasMore/nextOffset; no total or cross-request snapshot.
  // nextOffset=offset+items.length iff hasMore and <=10000, else null.
  page: CurrentShiftListV1["page"];
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

export interface ShiftSearchProblemV1 {
  type: string; // urn:shf:problem:<exact code>
  title: string; // stable sanitized summary, no offending input/source details
  status: number;
  code: "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "AMBIGUOUS_SHIFT_SEARCH" | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR";
  requestId: string;
  invalidParameters?: Array<{
    name: "attendanceDate" | "timeFrom" | "timeTo" | "mokedCode"
      | "teamCodes" | "innerJobCodes" | "workLocations"
      | "limit" | "offset" | "sort" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

// GET /api/v1/shift-search/filter-context and GET /api/v1/shift-search:
// no-store for success/errors; application/json or application/problem+json.
// Authenticate -> grammar -> capability -> catalog/scope -> read -> projection.
// Reuse five-second total request budget/abort context; no retry or late success.
// Codes map to 400/401/403, dependencies 503, ambiguity/source/internal 500.
// Empty results are 200. Forbidden filters never disclose existence via 404.
export interface ShiftSearchAccessPolicy {
  requireShiftSearchRead(principal: PrincipalV1): void;
  authorizedShiftSearchUnitIds(principal: PrincipalV1): string[];
}

// Internal bounded catalog view, reusing current hierarchy/catalog services.
// Not an extra REST DTO/endpoint or a duplicate fixture-unit inventory.
export type ShiftSearchCatalogV1 = Pick<ShiftSearchFilterContextV1,
  "mokedOptions" | "teamOptions" | "innerJobOptions" | "workLocationOptions">;

export interface ShiftSearchReadSelection {
  // Already intersected exact J01 grants with selected teams/optional parent.
  // Never parent inheritance; empty remains empty, not unrestricted.
  authorizedTeamUnitIds: readonly UnitCodeV1[];
  attendanceDate: LocalDateV1;
  timeFrom: MinuteV1;
  timeTo: MinuteV1;
  mokedCode: UnitCodeV1 | null;
  innerJobCodes: readonly DecimalId[]; // [] = no predicate; validated selectable
  workLocations: readonly ShiftSearchWorkLocationV1[]; // [] = no predicate
  limit: number; // 1–100; reader returns at most limit+1 projected rows
  offset: number; // 0–10000
  sort: "effective-start-asc";
}

export interface ShiftSearchReadPort {
  // Scope-bound options only: <=100 parents, <=1000 exact teams, <=1000 roles.
  // Overflow/malformed hierarchy/duplicate code => sanitized source/config error,
  // never truncate or load the full catalog. Exact code-point ordering.
  // Teams require direct G01 parents. Selectable roles require active==1 and
  // ORG_UNIT_ID in the original exact grants, not inferred ancestors/descendants.
  // Labels nonempty <=256 code points; locations are fixed home then site.
  // Empty scope yields empty scoped options (two location constants remain).
  readCatalog(authorizedTeamUnitIds: readonly UnitCodeV1[]): Promise<ShiftSearchCatalogV1>;

  // Separate search semantics, NOT CurrentShiftReadPort point-in-time overlap:
  // baseline with no ANY day-change UNION ALL changed rows, preserving joined
  // e_old/attendance/cancel-login multiplicity. Matched employee required.
  // Baseline day type 4; changed requires OWN new employee/type 4/start and NULL
  // cancellation (no NVL membership rescue). Missing reason must be NULL, not 0;
  // absent attendance may qualify. No employee-active or same-day-end predicate.
  // Bind one selected DATE + timeFrom/timeTo + :00; both STARTTIME bounds
  // inclusive, including equal bounds. No UTC conversion or whole-minute upper.
  // Exact scope AND optional parent/role/location predicates precede pagination.
  // Location filters baseline WORK_FROM_HOME vs changed NEW_WORK_FROM_HOME:
  // home/site => Y/N; both excludes raw NULL, unlike omitted. Display may fall
  // back to baseline. Projection retains effective nonnull source pairs for
  // full start/end/home/activity and source order/duplicates of activity tokens.
  // Detect >1 qualifying joined row/day across FULL scoped selection BEFORE
  // window, including empty pages: AMBIGUOUS_SHIFT_SEARCH, never DISTINCT/dedup.
  // Order qualifying start, numeric day ID, numeric employee ID; IDs remain
  // precision-safe strings, civil DATE values never JS Date/implicit offsets.
  // Oracle 11.2: bind-safe SQL-side analytic/nested-ROWNUM bounds <=101 rows,
  // bounded ambiguity probe and page-code label lookups (inactive labels may
  // resolve; unresolved labels null). No readAll/unbounded DB or catalog fetch.
  // Related reads share one explicit read-only snapshot/connection; cleanup
  // rollback/release always, discard unsafe connection on cancellation failure.
  // No DML/DDL/locks/business commit/custom function/procedure/sequence/EMS.
  // Rejections use ShiftSearchProblemV1 codes and existing request budget seam.
  readRows(selection: ShiftSearchReadSelection): Promise<ShiftSearchRowV1[]>;
}
