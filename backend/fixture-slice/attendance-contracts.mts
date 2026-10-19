// Canonical type-only contracts: approved sections 35/36 v0.1, recorded in 37.
// No HTTP, SQL, driver, provider, runtime validation or messaging implementation.
import type {
  DecimalId, LocalDateTime, PrincipalV1, ProblemV1, ShiftDayId,
} from "./contracts.mts";
import type {
  CatalogValueV1, CurrentShiftDataSourceV1, CurrentShiftRowV1,
  LocalDateV1, MinuteV1, UnitCodeV1,
} from "./current-shifts-contracts.mts";
import type {
  ShiftSearchFilterContextV1, ShiftSearchListV1, ShiftSearchRequestV1,
  ShiftSearchWorkLocationV1,
} from "./shift-search-contracts.mts";

// Exact existing search context/query SHAPES, not search membership or readers.
// Defaults: ONE configured-zone Clock sample; minute<=10 => this hour, else
// next hour, both times equal HH:00. Advance date across midnight; at the year
// 9999 boundary clamp to 9999-12-31/23:00. Seconds do not alter the threshold.
// Sole scoped parent => default moked; otherwise null. Other arrays are [].
export type AttendanceFilterContextV1 = ShiftSearchFilterContextV1;

// Validated application input, NOT raw HTTP values. Required one Gregorian
// YYYY-MM-DD (0001-9999) + two HH:mm; from<=to, equality valid, no rollover.
// Optional lists: ONE comma-delimited value each, no repeated/empty tokens.
// teamCodes 1-100 distinct exact codes; innerJobCodes 1-100 positive canonical
// 1-38 digit IDs; workLocations 1-2 distinct home/site. Omission means no filter,
// NOT a sentinel/null/empty wire value. limit 1-100/default25, offset
// 0-10000/default0; sole/default sort effective-start-asc. No coercion.
export type AttendanceRequestV1 = ShiftSearchRequestV1;

export interface AttendanceRowV1 {
  // Public nullable slot is NOT an employee+date lookup promise. This approved
  // employee-day source MUST emit an exact nonnull positive 1-10 digit day ID;
  // missing/invalid => INVALID_SOURCE_DATA. No attendance-only rows introduced.
  shiftDayId: ShiftDayId | null;
  employee: CurrentShiftRowV1["employee"];
  planned: {
    startLocal: LocalDateTime | null;
    endLocal: LocalDateTime | null;
    workingFromHome: boolean | null;
    activities: CatalogValueV1[];
    activityFallback: CatalogValueV1 | null;
    innerJob: CatalogValueV1 | null;
  };
  attendance: {
    stageArrivalLocal: LocalDateTime | null;
    stationArrivalLocal: LocalDateTime | null;
    stationExitLocal: LocalDateTime | null;
    missingReasonCode: string | null;
    briefingRecorded: boolean | null;
  };
}

export interface AttendanceListV1 {
  items: AttendanceRowV1[];
  applied: ShiftSearchListV1["applied"];
  page: ShiftSearchListV1["page"];
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

// Resource-specific allowlist, no widening of any existing problem union.
export interface AttendanceProblemV1
  extends Omit<ProblemV1, "code" | "invalidParameters"> {
  code: Extract<ProblemV1["code"],
    "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR">
    | "AMBIGUOUS_ATTENDANCE";
  invalidParameters?: Array<{
    name: "attendanceDate" | "timeFrom" | "timeTo" | "mokedCode"
      | "teamCodes" | "innerJobCodes" | "workLocations"
      | "limit" | "offset" | "sort" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

// Central backend decisions, never inferred from UI/Administrator/other rights.
// Authenticate/validate principal -> grammar -> capability -> copy exact scope
// once -> same-snapshot hierarchy/filter validation -> read/projection.
// Invalid principal401 and missing attendance:read403 BEFORE any reader/DB.
// Approved explicit local/isolated synthetic Admin remains employeeId=null,
// not the selected employee. Future configured real provider uses explicitly
// granted team inquiry scope, NOT employee-card's self-only actor rule.
export interface AttendanceAccessPolicy {
  requireAttendanceRead(principal: PrincipalV1): void;
  authorizedAttendanceTeamIds(principal: PrincipalV1): UnitCodeV1[];
}

// GET /api/v1/attendance/filter-context: no query (even bare ?) or body.
// GET /api/v1/attendance: exact AttendanceRequestV1 keys only, no body.
// Non-GET405/Allow: GET with INVALID_REQUEST envelope, zero reader calls.
// Reject unknown/duplicate/decoded-duplicate keys, malformed UTF-8/escapes,
// fragment/array/object notation, empty/coerced values; decode once, <=8192
// raw query UTF-8 bytes. Reverse interval => timeTo/invalid-format400.
// No selected employee/date range/actual-time/mode/status/include/private key.
//
// INVALID_REQUEST400, UNAUTHENTICATED401, FORBIDDEN403, dependencies503,
// AMBIGUOUS_ATTENDANCE/INVALID_SOURCE_DATA/INTERNAL_ERROR500. Empty200, no404/
// 409/422; source failure is not empty success. RFC9457 urn:shf:problem:<code>,
// stable sanitized title/opaque requestId, no offending values/private data.
// JSON / problem+json, no-store + nosniff both, no304/ETag/persistent cache,
// automatic retry/stale/partial/late success. No IDs/names/query echo/reasons/
// SQL/binds/raw rows/credentials in problems/logs. Total5000ms through
// acquisition/reads/projection/serialization/abort/cleanup; reuse budget seam.
// Success/context <=2MiB, problem <=16KiB; overflow INTERNAL_ERROR, no partial.
//
// All DTO properties required except request optionals/invalidParameters.
// IDs precision-safe strings; names nonempty plain Unicode <=40 code points;
// exact J01/direct-G01 codes/required labels retain existing current shape.
// Dates are stored Gregorian YYYY-MM-DDTHH:mm:ss with full seconds, NEVER
// UTC/Z/offset/epoch/JS Date. Planned source pairs choose changed nonnull else
// baseline independently; null start valid for split-only match. Nonnull end
// before nonnull start => INVALID_SOURCE_DATA; overnight dates stay unchanged.
// Actual endpoints independent: retain dates outside query/plan, station-only,
// exit-only and contradictory values; never reorder/repair/derive status.
// NULL = not recorded/unknown, not absent/false/midnight/working now.
//
// missingReasonCode is exact signed integral text <=38 digits:
// 0|[1-9][0-9]{0,37}|-[1-9][0-9]{0,37}; source NULL/Oracle empty => null.
// Zero/negative/positive stay distinct, no reason-label/absence classification.
// TADREECH NULL/0/1 => null/false/true; other/nonintegral => invalid source.
// No attendance row => all FIVE attendance fields null, not synthetic zeroes.
// Home effective Y/N case-insensitive => true/false, NULL=>null, other invalid.
// Activities <=100 ordered tokens with duplicates/unresolved labels retained;
// fallback positive baseline exception ONLY when no nonempty activity tokens.
// InnerJob null/numeric0=>null, otherwise exact integral code+nullable label.
// Reuse CatalogValueV1 bounds/Oracle-empty/Unicode rules; no HTML/truncation,
// label guessing or duplicate catalog first/last-wins. No derived status,
// split-end wire field, indicators/totals/private text/CTI/report/HR payload.

export interface AttendanceReadSelection {
  // Already intersected with selected teams/parent; empty NEVER unrestricted.
  authorizedTeamUnitIds: readonly UnitCodeV1[];
  attendanceDate: LocalDateV1;
  timeFrom: MinuteV1;
  timeTo: MinuteV1;
  mokedCode: UnitCodeV1 | null;
  innerJobCodes: readonly DecimalId[];
  workLocations: readonly ShiftSearchWorkLocationV1[];
  limit: number; // 1-100; return <=limit+1 projected rows
  offset: number; // 0-10000
  sort: "effective-start-asc";
}

// Same port for deterministic isolated fixture and future Oracle construction.
// Marker isolated-fixture|oracle-read-only matches configured list source;
// existing identity/detail retain isolated-fixture|oracle, SAME underlying
// source, not literal marker equality. Never compose fixture with Oracle.
export interface AttendanceReadPort {
  readonly dataSource: CurrentShiftDataSourceV1;
  // Independent context GET: scoped options only, no attendance/result rows.
  // <=100 distinct original exact J01 grants, each one direct G01 parent,
  // no parent/company/site/sibling/prefix inheritance, leading zeroes exact.
  // Context <=100 parents/1000 teams/1000 roles, code-point ordering;
  // roles ACTIVE=1 and ORG_UNIT_ID in ORIGINAL exact grants. Locations fixed
  // home then site. Empty scope => empty scoped options, fixed locations stay.
  // Overflow (one sentinel), malformed/duplicate hierarchy/catalog => source
  // error, never truncate or preload full catalogs. Labels required nonempty
  // plain <=256 here. Use existing hierarchy/catalog services, not inventories.
  readContext(
    exactTeamIds: readonly UnitCodeV1[], signal?: AbortSignal,
  ): Promise<Pick<AttendanceFilterContextV1,
    "mokedOptions" | "teamOptions" | "innerJobOptions" | "workLocationOptions">>;

  // ONE immutable fixture snapshot OR ONE OracleReadSession.read/explicit
  // READ ONLY snapshot per GET: scope hierarchy, scoped catalog eligibility,
  // ambiguity, rows and selected labels. List validates filters against OWN
  // same-session facts with shared pure policy validators, NOT readContext
  // followed by read in separate snapshots or nested helper transactions.
  // Private parent/team/mismatch/nonselectable role => generic403. Retain
  // original copied grants for role eligibility even after team intersection;
  // original scope is operation-scoped admission context, NOT a new wire key.
  //
  // Baseline D with no ANY C, matched E via legacy prefix, D dayType4.
  // Changed D/C requires OWN C employee/type4, CANCEL_REASON_CODE IS NULL.
  // Both bind ONE selected DATE+HH:mm+:00 bounds inclusive to branch OWN
  // shift start OR split end. Split-only/null start may qualify. No arrival,
  // overlap-at-now, WM_DATE, employee-active or missing-reason predicate.
  // No changed membership NVL rescue. Remove E_OLD/CTI joins; left A by day.
  // Exact E team scope + optional parent/role/raw branch Y/N location filters
  // in SQL BEFORE paging. home+site excludes raw NULL; omitted does not.
  // UNION ALL disjoint branches, no DISTINCT/dedup/first-row suppression.
  //
  // For admitted scoped filtered days check underlying D/C, matched E/A
  // multiplicity BEFORE page, even duplicates off-page/empty requested page.
  // Do not hide duplicate overlays with branch/filter selection; probes return
  // <=1 offender or <=2 candidates, no global private-record scan. Reject
  // AMBIGUOUS_ATTENDANCE; hierarchy/catalog duplicates INVALID_SOURCE_DATA.
  // Effective start ASC NULLS LAST, numeric day then employee IDs ASC without
  // JS Number. Oracle11 bound analytic/nested ROWNUM: offset+limit+1 upper,
  // transfer <=101. No OFFSET FETCH/SELECT */readAll/fetchAll/Node global
  // directory sort/slice; execution cost still requires plan verification.
  // Hierarchy <=101 rows; scoped catalogs <=1001 incl overflow sentinel;
  // selected activity/exception/inner-job label probes <=2 per identity,
  // <=100 activity tokens per row. No all-reasons catalog/private columns.
  // Reuse session-bound teamsAndParents/numberText/civil/catalog/error/budget
  // seams; validate Gregorian session, explicit precision-safe text aliases.
  //
  // Application trims lookahead; nextOffset=offset+items.length iff hasMore
  // and <=10000 else null; no total/cursor/SCN/cross-request snapshot promise.
  // Every GET reauthorizes, reload resets offset; source changes may move rows.
  // Always end/rollback and safely release/drop after failure/abort/disconnect;
  // await native break/cleanup, never reuse unsafe lease. Cleanup may outlast
  // response deadline; no measured cancellation/performance guarantee.
  // Reviewed allowlisted plain-table SELECT/nonmutating built-ins ONLY:
  // no legacy validation/register/cancelMissing/loginAudit initialization,
  // custom functions/procedures (autonomous commits survive rollback), DML/
  // DDL/sequence/locks/business commit/ledger/audit/SMS/CTI/EMS/batch.
  // Errors reject via AttendanceProblemV1 mapping; consumers must preserve
  // attendance errors through session wrappers, not convert all to dependency.
  read(selection: AttendanceReadSelection, signal?: AbortSignal): Promise<AttendanceRowV1[]>;
}
