// Canonical type-only contracts: approved sections 32/33 v0.1, recorded in 34.
// No HTTP, SQL, driver, provider, runtime validation or messaging implementation.
import type { DecimalId, PrincipalV1, ProblemV1 } from "./contracts.mts";
import type {
  CatalogValueV1, CurrentShiftDataSourceV1, CurrentShiftRowV1, UnitCodeV1,
} from "./current-shifts-contracts.mts";

export interface EmployeeOperationalCardV1 {
  employeeId: DecimalId;
  employee: Pick<CurrentShiftRowV1["employee"], "firstName" | "lastName" | "unit"> & {
    job: CatalogValueV1 | null;
    innerJob: CatalogValueV1 | null;
  };
  businessTimeZone: string;
  dataSource: CurrentShiftDataSourceV1;
}

// Validated application input, NOT raw HTTP values. Canonical positive ASCII
// decimal string, 1–38 digits; no leading zero/sign/whitespace/exponent/coercion.
export interface EmployeeOperationalCardRequestV1 {
  employeeId: DecimalId;
}

// Resource-specific allowlist; existing detail/list problem sets stay unchanged.
export interface EmployeeOperationalCardProblemV1
  extends Omit<ProblemV1, "code" | "invalidParameters"> {
  code: Extract<ProblemV1["code"],
    "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
    | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR">
    | "EMPLOYEE_NOT_FOUND" | "AMBIGUOUS_EMPLOYEE";
  invalidParameters?: Array<{
    name: "employeeId" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}

// Central backend policy constructed with validated existing startup config.
// Authenticate/validate principal -> grammar -> capability/actor -> copy exact
// scope once -> read -> recheck result ID/scope/source -> explicit projection.
// Malformed principal=>401; missing capability/disallowed actor=>403 BEFORE
// any DB/hierarchy call. Zero teams=>generic404, never unrestricted access.
export interface EmployeeOperationalCardAccessPolicy {
  requireEmployeeRead(principal: PrincipalV1): void; // employee:read only
  // Explicit local/isolated synthetic Administrator selection; principal's
  // employeeId stays null. Future real provider: verified nonnull employeeId
  // MUST equal path ID; no real administrative browsing or actor fallback.
  canReadSelectedEmployee(principal: PrincipalV1, employeeId: DecimalId): boolean;
  // <=100 distinct exact current J01 grants, each with one direct G01 parent.
  // No parent/company/site/sibling/role/prefix inheritance; leading zeroes exact.
  authorizedEmployeeTeamIds(principal: PrincipalV1): string[];
}

// GET /api/v1/employees/{employeeId}/operational-card
// ONE endpoint; no context/catalog/directory endpoint, pagination or collection.
// No query keys (including duplicates/decoded duplicates), body/day/asOf/include/
// expand/private switch. Existing raw-query ceiling 8192 UTF-8 bytes applies.
// Non-GET=>405, Allow: GET, zero reader calls; no legacy aliases/commands.
// INVALID_REQUEST400, UNAUTHENTICATED401, FORBIDDEN403, EMPLOYEE_NOT_FOUND404,
// dependencies503, AMBIGUOUS_EMPLOYEE/INVALID_SOURCE_DATA/INTERNAL_ERROR500.
// No409/422. Missing/private/ungranted/null-team/reassigned=>identical404.
// RFC9457 type=urn:shf:problem:<code>, stable sanitized title/opaque requestId;
// no offending values, names, path/query IDs, raw rows, SQL/binds or secrets
// in problems/logs. JSON / problem+json; no-store + nosniff on success/errors.
// No ETag/304/persistent cache/automatic retry/stale or partial success.
// Reuse total5000ms budget through auth/acquisition/read/validation/projection/
// serialization/abort/cleanup; no late success. Not a measured native SLA.
//
// All response properties required. Names nonempty plain Unicode <=40 code
// points each; preserve text, no truncation/fallback. Exact unit code1–8 with
// no whitespace/controls; required team/direct-G01 labels nonempty <=256 plain
// code points, unchanged current hierarchy shape. No extra company hierarchy.
//
// Job/innerJob source null or numeric0=>null; otherwise exact signed integral
// decimal text, <=38 digits: [1-9][0-9]{0,37}|-[1-9][0-9]{0,37}.
// No JS Number/parseInt, nonintegral/overprecision or legacy "00" string ID.
// Reuse CatalogValueV1 bounds; never trim/renumber string/unit keys.
// Oracle empty label=>null; trim label edges per legacy tables tag. Present
// code + missing/null/empty-after-trim label=>{code,label:null}, NOT absent job,
// raw-code-as-name, selected employee JOB_NAME or another employee fallback.
//
// Positive job label: ONLY selected code, active SHF_EMPLOYEES, JOB_ID>0,
// GROUP BY JOB_ID,JOB_NAME as ComplexCodeTable.getJobRows. Identical repeated
// pairs intentionally group once. >1 grouped pair (even null vs nonnull or
// labels that trim equally)=>INVALID_SOURCE_DATA BEFORE projection.
// No active match/negative code=>label null; no invented jobs table/helper.
// Inner job: selected SHF_INNER_JOBS.INNER_JOB_ID/INNER_JOB_NAME only, no
// invented active/org filter; >1 row fails even for equal labels.
// Missing optional label keeps code; malformed label/hierarchy fails atomically.
//
// Source isolated-fixture | oracle-read-only; identity/detail retain existing
// isolated-fixture | oracle pair, SAME configured source, not literal equality.
// businessTimeZone is existing configured marker, NOT a source DATE conversion.
// No HR/national ID/photo/contact/birth/hire/admin/events/attendance, personal
// reference/manager/policy fields, shift activity/site/home/working-now or dates.
// Selected employee is NOT actor identity. No new capability grants other APIs.

export interface EmployeeOperationalCardReadSelection {
  employeeId: DecimalId;
  exactTeamIds: readonly UnitCodeV1[]; // copied admission scope; empty never all
}

export type EmployeeOperationalCardReadResult =
  | { kind: "not-found" }
  | { kind: "ambiguous-employee" }
  | {
    kind: "one";
    row: Pick<EmployeeOperationalCardV1, "employeeId" | "employee">;
  };

// ONE bounded operation, usable by fixture and Oracle construction through the
// SAME port. Source-bound context = this port marker + one read snapshot;
// application supplies configured businessTimeZone and explicitly builds DTO,
// revalidating row ID/scope/text/codes/source. No raw EmployeeBean/extra bag.
export interface EmployeeOperationalCardReadPort {
  readonly dataSource: CurrentShiftDataSourceV1;
  // Adapter owns one immutable fixture snapshot or OracleReadSession.read
  // lease/explicit read-only transaction for employee+scope+bounded labels.
  // Reuse session-bound teamsAndParents/numberText/labelsFor(innerJobs) and
  // existing session/budget/cancellation seams, NOT nested reader transactions
  // or separate context/list/detail HTTP calls. Typed returns need validation.
  //
  // One bound exact EMPLOYEE_ID lookup; explicit six columns ONLY:
  // EMPLOYEE_ID,FIRST_NAME,LAST_NAME,ORG_UNIT_ID,JOB_ID,INNER_JOB_ID.
  // Oracle11 outer ROWNUM<=2; <=2 candidates, no DISTINCT/first-row/readAll,
  // prefix/manager/day/change/attendance join, SELECT * or Node directory scan.
  // 0=>not-found. Any missing/ungranted-team candidate=>not-found BEFORE label
  // bodies/public projection. Two admitted candidates=>ambiguous-employee;
  // never filter ambiguity down to one. Unique admitted employee requires one
  // valid J01/direct-G01 with labels; malformed/multiple hierarchy=>source error.
  //
  // <=100 grants, hierarchy<=101 returned rows using existing bounded context.
  // Only selected positive job code's active grouped code/name pairs, <=2;
  // STATUS_ID predicate internal only, no other employee identities/names/HR.
  // Only selected nonzero inner-job code/name, <=2. Detect grouped/identity
  // ambiguity before trimming/projection; no global catalog preload/fallback.
  // All membership/bounds/grouping in Oracle11-compatible SQL with binds and
  // explicit aliases, no OFFSET FETCH/fetchAll. Transfer cap is not plan proof.
  //
  // Allowlisted plain-table/catalog SELECTs and reviewed nonmutating built-ins;
  // NO custom functions/procedures, DML/DDL/business commit/FOR UPDATE/sequence,
  // SMS/updateParamSMS/events/validateUpdate/ledger/legacy initialization/EMS.
  // SHF_INS_AND_RETURN_LASTID autonomously INSERTs+COMMITs even in SELECT;
  // outer rollback cannot undo it. SELECT-prefix checks alone prove no purity.
  // Always rollback/end read snapshot and release/drop safely; await abort/
  // native break/cleanup, never reuse busy/unsafe lease or return late success.
  // Subsequent GET reauthorizes; no cross-request snapshot/instant revocation,
  // lock/version/ETag/idempotency/partner completion promise.
  // Source/dependency failures reject via sanitized resource problem mapping;
  // application maps result kinds, never maps dependency failure to404/empty200.
  read(
    selection: EmployeeOperationalCardReadSelection, signal: AbortSignal,
  ): Promise<EmployeeOperationalCardReadResult>;
}
