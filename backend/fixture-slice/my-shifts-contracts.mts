// Canonical type-only contracts: approved sections 26/27 v0.1, recorded in section 28.
// No HTTP, SQL, driver, provider, runtime validation or messaging implementation.
import type { DecimalId, LocalDateTime, PrincipalV1, ProblemV1 } from "./contracts.mts";
import type {
  CurrentShiftDataSourceV1, CurrentShiftListV1, CurrentShiftRowV1,
  LocalDateV1, UnitCodeV1,
} from "./current-shifts-contracts.mts";

export type ScheduleModeV1 = "self" | "selected";

export interface MyShiftsActorV1 {
  mode: ScheduleModeV1;
  employee: CurrentShiftRowV1["employee"] | null;
}

export interface MyShiftsContextV1 {
  actor: MyShiftsActorV1;
  selectionRequired: boolean;
  canSelectEmployee: boolean;
  defaults: { dateFrom: LocalDateV1; dateTo: LocalDateV1 };
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

export type MyShiftRowV1 =
  Pick<CurrentShiftRowV1, "shiftDayId" | "employee" | "startLocal" | "activities"> & {
    endLocal: LocalDateTime | null;
  };

export interface MyShiftsListV1 {
  actor: MyShiftsActorV1; // employee NONNULL on every 200 list, even empty
  items: MyShiftRowV1[];
  applied: {
    mode: ScheduleModeV1;
    employeeId: DecimalId; // resolved actor, including verified real-self
    dateFrom: LocalDateV1;
    dateTo: LocalDateV1;
    sort: "effective-start-asc";
  };
  page: CurrentShiftListV1["page"];
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

// Validated application inputs, NOT raw HTTP values. Mode is always required.
// self forbids employeeId; selected requires a canonical positive 1–38 digit ID.
// No implicit actor/profile/personal-reference binding or first-row default.
export type MyShiftsContextRequestV1 =
  | { mode: "self"; employeeId?: never }
  | { mode: "selected"; employeeId: DecimalId };

export type MyShiftsRequestV1 = MyShiftsContextRequestV1 & {
  dateFrom: LocalDateV1; // strict Gregorian YYYY-MM-DD, years 0001–9999
  dateTo: LocalDateV1; // >=dateFrom, <=31 inclusive calendar dates
  limit?: number; // canonical wire integer 1–100; omitted = 25
  offset?: number; // canonical wire integer 0–10000; omitted = 0
  sort?: "effective-start-asc"; // sole order and default
};

// Reuse the canonical problem envelope and allowlisted common codes only.
// No SHIFT_DAY_NOT_FOUND/AMBIGUOUS_SHIFT_DAY leakage or changes to ProblemV1.
export interface MyShiftsProblemV1 extends Omit<ProblemV1, "code" | "invalidParameters"> {
  code: Extract<ProblemV1["code"],
    "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR">
    | "EMPLOYEE_CONTEXT_REQUIRED" | "AMBIGUOUS_MY_SHIFTS";
  invalidParameters?: Array<{
    name: "mode" | "employeeId" | "dateFrom" | "dateTo"
      | "limit" | "offset" | "sort" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

// Central backend policy, constructed with validated existing startup config.
// Capability and selected-mode permission precede EVERY DB/hierarchy lookup.
// canSelectEmployee is true only for explicitly enabled local/isolated synthetic
// Administrator + my-shifts:read; never for a real provider or production.
// Selected mode with false permission => generic 403, not an employee lookup.
// self uses only a verified real principal.employeeId, never synthetic linkage.
// Exact J01 grants apply to both modes; no parent inheritance or role bypass.
export interface MyShiftsAccessPolicy {
  requireMyShiftsRead(principal: PrincipalV1): void;
  canSelectEmployee(principal: PrincipalV1): boolean;
  authorizedMyShiftsUnitIds(principal: PrincipalV1): string[];
}

// GET /api/v1/my-shifts/context: only mode + selected employeeId; no list keys.
// GET /api/v1/my-shifts: actor keys + required dates + optional limit/offset/sort.
// Each key once; decode once, reject malformed UTF-8/escapes, unknown keys,
// arrays/objects, null/empty/sentinels, whitespace coercion and fragment syntax.
// No nonempty bodies. Raw query <=8192 UTF-8 bytes. Invalid/reversed/>31-date
// range reports dateTo/invalid-format (individual date grammar remains strict).
// Context samples configured-zone Clock once: today..today+13, end clamped to
// 9999-12-31. These defaults are NOT implicit list inputs; no browser clock.
// Context employee null iff selectionRequired; null only for unlinked self.
// Synthetic self context: null/true/canSelectEmployee=true; no actor DB read.
// Unlinked real self: null/true/canSelectEmployee=false. Self list without
// verified real link => 409 EMPLOYEE_CONTEXT_REQUIRED, zero schedule query.
// Selected/linked-self context must have nonnull scoped employee or fail 403.
// List actor and every row employeeId must equal applied.employeeId.
// Exact names/team/parent/activity bounds and hierarchy reuse current contracts;
// <=100 activity tokens, source order/duplicates, unknown labels null; no
// attendance, exception fallback, personal references or extra row indicators.
// Sources: context/list isolated-fixture | oracle-read-only; identity/detail
// retain their existing isolated-fixture | oracle pair without shape changes.
// Page: strip lookahead; hasMore from lookahead; nextOffset=offset+items.length
// iff hasMore and <=10000, otherwise null. No total/cross-request snapshot.
// Authenticate -> grammar -> capability/actor-mode permission -> scoped actor/
// range -> read/projection. Reuse 5000ms TOTAL budget/abort/cleanup, no retry,
// no late/partial success. JSON UTF-8 / problem+json; no-store + nosniff for both.
// Context/list serialized bound 2MiB; overflow => 500 INTERNAL_ERROR.
// Status map: INVALID_REQUEST 400, UNAUTHENTICATED 401, FORBIDDEN 403,
// EMPLOYEE_CONTEXT_REQUIRED 409, dependencies 503, ambiguity/source/internal 500.
// Unknown/vanished/out-of-scope/unlabelable actor => same generic 403, not 404.
// Empty valid schedule => 200. Problems/logs omit offending input, SQL, driver
// messages, personal linkage and existence details. Manual retry only.

export interface MyShiftsReadSelection {
  employeeId: DecimalId;
  authorizedTeamUnitIds: readonly UnitCodeV1[]; // exact scope; empty never = all
  dateFrom: LocalDateV1;
  dateTo: LocalDateV1;
  limit: number; // 1–100; at most limit+1 returned rows
  offset: number; // 0–10000
  sort: "effective-start-asc";
}

// Internal bounded port, NOT an employee directory or another REST endpoint.
// Operation-scoped adapter/unit of work must use existing OracleReadSession.read:
// one snapshot for actor resolution, ambiguity probe, page and page labels in
// ONE resource request. Not an independent transaction per port method.
// Resolve the requested actor once per context/list operation (<=2 rows for
// uniqueness); list revalidates independently of prior context. Keep resolved
// full reference/prefix internal to this operation; no implicit profile ID.
export interface MyShiftsReadPort {
  // Exact employee ID AND exact authorized current J01 employee unit, with
  // direct G01 parent/labels. Bind actor/scope, no full directory/hierarchy scan.
  // 0 => null (application maps to generic 403); >1 => INVALID_SOURCE_DATA.
  // Empty exact scope cannot broaden; no source fallback or arbitrary first.
  readEmployeeContext(
    employeeId: DecimalId, exactTeamIds: readonly UnitCodeV1[],
  ): Promise<CurrentShiftRowV1["employee"] | null>;

  // Baseline: day type 4, no ANY change (NOT EXISTS), requested actor reference.
  // Changed: OWN nonnull new employee/type4/start, cancellation reason NULL;
  // never rescue membership with baseline NVL. Join baseline by day ID for
  // display; orphan changed day => INVALID_SOURCE_DATA. Display nonnull changed
  // start/end/activity else baseline; end can remain null. No employee-active,
  // missing-reason/attendance predicate, SHF_ATTENDANCE or cancel-login join.
  // Bind actor's internal full reference/prefix and exact scope/range in SQL
  // BEFORE paging. Inclusive START from00:00:00..to23:59:59, not overlap.
  // Civil full dates/seconds, no JS Date/UTC conversion or midnight repair;
  // malformed source/end-before-start => INVALID_SOURCE_DATA.
  // Detect duplicate qualifying day across FULL actor+scope+range BEFORE page,
  // including off-page/empty-page cases => AMBIGUOUS_MY_SHIFTS. No DISTINCT,
  // latest/first-row selection. Bounded ambiguity probe, not full row transfer.
  // Order effective start, numeric day ID, numeric employee ID; exact string
  // IDs, never JS Number. Oracle 11.2 analytic/nested-ROWNUM SQL window <=101,
  // no OFFSET FETCH/readAll/Node sort+slice; only bounded page-code label reads
  // through existing catalogs. Inactive labels may resolve; unknown stay null.
  // All related reads share above snapshot; rollback/end + release/drop lease
  // always. On timeout/abort await native break/cleanup, no busy lease return.
  // Allowlisted plain-table/catalog SELECT chain only: no DML/DDL/row locks,
  // business commit/custom function/procedure/sequence/autonomous call/EMS.
  // SELECT-prefix check alone does not guarantee purity. Existing ledger's
  // autonomous INSERT+COMMIT cannot be undone by an outer rollback.
  // Rejections use MyShiftsProblemV1 codes and existing request-budget seam.
  readRows(selection: MyShiftsReadSelection): Promise<MyShiftRowV1[]>;
}
