// Canonical type-only contracts: approved sections 29/30 v0.1, recorded in 31.
// No HTTP, SQL, driver, provider, runtime validation or messaging implementation.
import type {
  DecimalId, EmployeeShiftDayResponseV1, LocalDateTime, PrincipalV1,
  ProblemV1, RawShiftDay, ShiftDayId,
} from "./contracts.mts";
import type {
  CatalogValueV1, CurrentShiftDataSourceV1, CurrentShiftListV1,
  CurrentShiftRowV1, UnitCodeV1,
} from "./current-shifts-contracts.mts";

export type SelectedShiftItemKindV1 = "break" | "timeoff" | "exception";

export interface SelectedShiftItemV1 {
  key: { shiftDayId: ShiftDayId; startLocal: LocalDateTime };
  kind: SelectedShiftItemKindV1;
  stateCode: string; // positive canonical decimal, 1–38 digits
  type: CatalogValueV1 | null; // null iff break; signed/zero type code retained
  startLocal: LocalDateTime; // equals key.startLocal, full seconds
  endLocal: LocalDateTime;
  durationMinutes: string; // 0|[1-9][0-9]{0,37}|-[1-9][0-9]{0,37}; no -0
  breakExitLocal: LocalDateTime | null; // always null for non-break
  breakReturnLocal: LocalDateTime | null; // always null for non-break
  remark: string | null; // <=1000 Unicode code points; null/empty => null
  sourceCode: string; // plain Unicode, 1–10 code points, no controls
}

export interface SelectedShiftItemsV1 {
  shiftDay: EmployeeShiftDayResponseV1; // unchanged detail DTO/null semantics
  displayContext: {
    unit: CurrentShiftRowV1["employee"]["unit"]; // exact J01 + labelled G01
    activities: CatalogValueV1[]; // <=100, source order/duplicates retained
    innerJob: CatalogValueV1 | null;
  };
  items: SelectedShiftItemV1[];
  applied: { sort: "start-asc" };
  page: CurrentShiftListV1["page"];
}

// Validated application input, NOT raw HTTP values. Both path IDs required:
// employee canonical positive 1–38 digits; day canonical positive 1–10 digits.
// No sign, leading zero, whitespace, exponent or numeric ID coercion.
export interface SelectedShiftItemsRequestV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  limit?: number; // canonical wire integer 1–100; default 25
  offset?: number; // canonical wire integer 0–10000; default 0
  sort?: "start-asc"; // sole order and default
}

// Resource-specific allowlist; underlying ProblemV1/other APIs stay unchanged.
export interface SelectedShiftItemsProblemV1
  extends Omit<ProblemV1, "code" | "invalidParameters"> {
  code: Extract<ProblemV1["code"],
    "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "SHIFT_DAY_NOT_FOUND" | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "AMBIGUOUS_SHIFT_DAY" | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR">
    | "AMBIGUOUS_SHIFT_ITEMS";
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "limit" | "offset" | "sort" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

// Central backend policy, constructed with validated existing startup config.
// Authenticate/validate principal -> grammar -> BOTH capabilities -> actor ->
// exact scope -> snapshot/context/resource decision -> item/catalog reads.
// Every policy rejection before context makes zero DB/hierarchy calls.
export interface SelectedShiftItemsAccessPolicy {
  // Requires shift-items:read AND shift-day:read; missing either => 403.
  requireSelectedShiftItemsRead(principal: PrincipalV1): void;
  // False => 403 before DB. Selected synthetic actor only with explicit local/
  // isolated opt-in + validated synthetic Administrator. principal.employeeId
  // stays null. Future real provider requires verified employeeId===path ID;
  // unlinked/other employee/real administrative browsing are forbidden.
  canReadSelectedEmployee(principal: PrincipalV1, employeeId: DecimalId): boolean;
  // Exact current J01 grants only; empty never means all; no G01/site/role
  // inheritance. The unique context must also satisfy existing detail policy.
  authorizedSelectedShiftItemsUnitIds(principal: PrincipalV1): string[];
}

// GET /api/v1/employees/{employeeId}/shift-days/{shiftDayId}/breaks-and-exceptions
// Optional query ONLY limit/offset/sort, each once; reject unknown/duplicate/
// decoded duplicate keys, empty/noncanonical values, >8192-byte query, ANY body.
// No date/time/kind/fullDay/includeCancelled/mode query or extra endpoint.
// Non-GET => 405, Allow: GET, zero reader calls; no legacy aliases.
// Status: INVALID_REQUEST 400, UNAUTHENTICATED 401, FORBIDDEN 403,
// SHIFT_DAY_NOT_FOUND 404, dependencies 503, both ambiguities/source/internal
// 500. No 409/422. Generic 404 covers vanished, wrong employee, reassignment,
// out-of-scope/nonresolving day; never disclose owner/existence differences.
// RFC9457 type=urn:shf:problem:<code>, stable sanitized title/requestId;
// omit offending values, remarks, raw IDs, SQL/driver/infrastructure details.
// JSON or problem+json; no-store + nosniff for success/errors, no ETag/304/cache.
// Reuse 5000ms TOTAL budget through auth/pool/context/probe/page/catalog/
// serialization, existing request-budget/abort/cleanup seam; no auto retry,
// late/partial success, source-error-to-empty mapping or silent fixture fallback.
//
// All properties required except optional request keys/invalidParameters.
// shiftDay IDs must match request; displayContext.unit.code equals nested
// employee.orgUnitId. Nested shiftDay.businessTimeZone/dataSource are the ONLY
// whole-response markers: isolated-fixture | oracle (NOT oracle-read-only).
// Internal read-only port marker uses existing CurrentShiftDataSourceV1:
// isolated-fixture -> nested isolated-fixture; oracle-read-only -> nested oracle.
// Identity/detail keep their existing isolated-fixture | oracle pair.
// Never mix configured fixture/Oracle facts or introduce another source enum.
//
// STATE_TYPE>0 + CANCEL_REASON_CODE IS NULL, exact AGENT_DAY_ID only.
// 4=>break/type null/recorded exit+entry; 2=>timeoff/time-off type catalog;
// other positive=>exception/exception type catalog, including uncommon state7.
// Type code uses duration's signed decimal grammar, not positive ID grammar;
// unknown label=null, <=256 plain code points. Source DEL with null cancellation
// remains, neutrally shown; no source<>'DEL' rule or computed active/status.
// Null/empty remark=>null; preserve nonempty whitespace/text without HTML.
// No whole-day synthesis, attendance-reason filter/report, _BASE/_OLD fallback,
// SWITCH_DAY_ID following, overlap/date matching, clipping or recalculation.
// Items follow CURRENT effective day employee, not an original row owner.
// Reuse RawShiftDay validator/projection, nonnull-change/baseline fallback,
// existing detail joins/attendance ambiguity; no list membership/cancel filter.
// Full Gregorian local YYYY-MM-DDTHH:mm:ss, years 0001–9999; no Z/offset,
// milliseconds/JS Date/UTC/rounding/guessed rollover. Required item start/end
// null/malformed=>INVALID_SOURCE_DATA; earlier end remains unchanged.
// Duration is STORED minutes, preserve zero/negative/38 digits/mismatch.
// Null actuals are recorded absence, not "not yet"/completion/partner failure.
// No elapsed-duration calculation, approval, eligibility or EMS/completion field.
// Labels/activities use current contracts; no item-type activity fallback.
// Natural key is day/start, not surrogate ID or command token; same-minute
// different seconds distinct, duplicate tuple even across states is ambiguity.
// Page strip lookahead, hasMore from extra; nextOffset=offset+items.length iff
// hasMore and <=10000 else null. Empty authorized page=>200 with context.
// No total, cross-request snapshot/cursor/lock/version guarantee; reload offset0
// replaces context/items together. Reauthorize each page/retry/deep link.

export interface SelectedShiftItemsReadSelection {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  exactTeamIds: readonly UnitCodeV1[]; // exact J01, empty never unrestricted
  limit: number; // 1–100; at most limit+1 rows returned
  offset: number; // 0–10000
  sort: "start-asc";
}

export type SelectedShiftItemsReadResult =
  | { kind: "not-found" }
  | { kind: "ambiguous-context" } // AMBIGUOUS_SHIFT_DAY
  | { kind: "ambiguous-items" } // AMBIGUOUS_SHIFT_ITEMS
  | {
    kind: "one";
    detail: RawShiftDay;
    displayContext: SelectedShiftItemsV1["displayContext"];
    rows: SelectedShiftItemV1[]; // <=limit+1, includes pagination lookahead
  };

// ONE bounded operation unifies day authorization/detail context/items/catalogs.
// Not a public context/catalog/employee endpoint, nor an independent transaction
// for each helper. Reuse session-bound detail context primitive and projection;
// never public detail HTTP + second read, or nested OracleDetailReader session.
export interface SelectedShiftItemsReadPort {
  readonly dataSource: CurrentShiftDataSourceV1; // existing internal source type
  // Adapter owns one fixture/OracleReadSession.read snapshot/lease for ALL reads.
  // Resolve day with existing full detail joins, exact day, <=2 context rows.
  // Detect prefix/employee/change/org/attendance multiplicity BEFORE accepting
  // requested employee or filtering scope to hide ambiguity. No DISTINCT/first.
  // Then match requested employee + existing detail resource policy/exact J01
  // before touching item bodies; denial=>not-found. Missing/invalid hierarchy
  // =>INVALID_SOURCE_DATA. Carry employee reference/org/innerJob internally;
  // no second employee lookup or exposed personal reference.
  //
  // Bind exact day/scope; item query has NO prefix/org/attendance joins.
  // Before pagination probe ALL qualifying day rows grouped by day/start,
  // HAVING COUNT(*)>1, outer ROWNUM<=1, including off-page/empty requested page.
  // All membership/scope/order/window work belongs in SQL, not readAll in Node.
  // Oracle11 nested ROWNUM/analytic start-asc window, upper offset+limit+1,
  // <=101 network rows; no OFFSET FETCH, SELECT *, fetchAll, Node sort+slice.
  // Bounded transfer is not a guarantee of bounded database execution cost.
  // Resolve only context/page codes: <=100 activities, <=100 item types,
  // <=1 inner job/team/parent; optional missing label stays null, duplicate
  // catalog rows fail source validation, not fanout/last-wins/global preload.
  // Lookahead need not hydrate labels/remark; never serialize it to the client.
  //
  // Allowlisted plain-table/catalog SELECTs + nonmutating formatting/aggregate
  // built-ins; SELECT-prefix regex alone is NOT purity enforcement.
  // No DML/DDL/business commit/row lock/sequence/custom function/procedure,
  // candidate/checkForChangeBreak/validateUpdate/ledger/EMS/extension calls.
  // SHF_INS_AND_RETURN_LASTID has autonomous INSERT+COMMIT even in SELECT;
  // outer rollback cannot undo it or partner effects. validateUpdate mutates.
  // Start read-only snapshot; always rollback/end + release/drop lease, await
  // abort/native break, never return busy/unsafe lease or late success.
  // Errors reject via SelectedShiftItemsProblemV1 sanitized source/dependency
  // codes; application owns request validation and maps result kinds.
  read(
    selection: SelectedShiftItemsReadSelection, signal: AbortSignal,
  ): Promise<SelectedShiftItemsReadResult>;
}
