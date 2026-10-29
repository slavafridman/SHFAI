// Canonical TYPE-ONLY §49 v0.1, approved 29 October 2026: "Agree 49".
// C49 source GO is separate from O49 operational permission. No runtime exports,
// grants, parser, configuration loader, Oracle/sequence/fuse IO or transport.
import type {
  DecimalId, LocalDateTime, PrincipalV1, ShiftDayId,
} from "./contracts.mts";
import type { UnitCodeV1 } from "./current-shifts-contracts.mts";

// Aliases document grammar, NOT runtime validation or trusted/branded input.
export type ShiftInstantV1 = string; // RFC3339 UTC Z, observation not commit time
export type ShiftCommandIdV1 = string; // lowercase UUID v4
export type ShiftFingerprintV1 = string; // 64 lowercase hex
export type ShiftPreparationTokenV1 = string; // random32bytes, base64url43
export type ShiftMinutesV1 = string; // canonical nonnegative integer <=10 digits
export type ShiftManagementModeV1 =
  | "disabled" | "isolated-fixture" | "test-oracle-controlled";
export type ShiftManagementSourceV1 = "isolated-fixture" | "oracle-test";
export type ShiftOperationKindV1 = "create" | "change" | "cancel" | "csv-create";
export type ShiftManagementCapabilityV1 =
  | "shift-management:prepare" | "shift-management:create"
  | "shift-management:change" | "shift-management:cancel"
  | "shift-management:csv-preview" | "shift-management:csv-apply"
  | "shift-management:test-oracle-write";
export type ShiftWarningCodeV1 =
  | "DURATION_CHANGED" | "SOURCE_BECOMES_SHF"
  | "OVERNIGHT_NORMALIZED" | "LOGICAL_CANCEL_PRESERVES_HISTORY";
export type CsvColumnV1 =
  | "personalId" | "activityCode" | "date" | "location" | "startTime" | "endTime";
export type CsvShiftEncodingV1 = "utf-8" | "windows-1255";
export type ShiftRuleCodeV1 =
  | "EMPLOYEE_NOT_ACTIVE" | "UNSUPPORTED_DAY" | "UNSUPPORTED_SOURCE"
  | "INVALID_TIME_RANGE" | "AMBIGUOUS_LOCAL_TIME" | "OFFSET_TRANSITION_UNSUPPORTED"
  | "PAST_OR_STARTED_SHIFT" | "OUTSIDE_SCHEDULE_WEEK" | "DURATION_OUT_OF_POLICY"
  | "SHIFT_OVERLAP_OR_GAP" | "SITE_ACTIVITY_MISMATCH" | "HOME_POLICY_UNAVAILABLE"
  | "UNSUPPORTED_MINUTE_ACCOUNTING" | "DEPENDENT_FLOW_UNSUPPORTED"
  | "ATTENDANCE_PRESENT" | "MISSING_PRESENT" | "REPORT_REVIEW_REQUIRED"
  | "EXCHANGE_PRESENT" | "POOL_DEPENDENCY_PRESENT" | "PARTNER_REQUIRED_OR_UNKNOWN"
  | "NO_CHANGE" | "CSV_INVALID_HEADER" | "CSV_INVALID_ROW" | "CSV_DUPLICATE"
  | "CSV_EMPLOYEE_MISMATCH" | "CSV_LIMIT_EXCEEDED" | "TEXT_NOT_REPRESENTABLE";

export type ShiftDraftV1 =
  | { kind: "create"; startLocal: LocalDateTime; endLocal: LocalDateTime;
      activityCode: DecimalId; workLocation: "home" | "site"; remark: string | null }
  | { kind: "change"; shiftDayId: ShiftDayId; startLocal: LocalDateTime;
      endLocal: LocalDateTime; activityCode: DecimalId; workLocation: "home" | "site";
      startReasonCode: DecimalId | null; endReasonCode: DecimalId | null }
  | { kind: "cancel"; shiftDayId: ShiftDayId;
      reasonCode: string; remark: string | null };
export interface ShiftStateV1 {
  shiftDayId: ShiftDayId;
  status: "scheduled" | "cancelled";
  startLocal: LocalDateTime;
  endLocal: LocalDateTime;
  activityCode: DecimalId;
  siteId: DecimalId;
  workLocation: "home" | "site";
  paidMinutes: ShiftMinutesV1;
  workMinutes: ShiftMinutesV1;
  source: string;
}
export interface ShiftEffectV1 {
  row: number; // CRUD=1, CSV physical line>=2
  before: ShiftStateV1 | null; // null only create
  after: Omit<ShiftStateV1, "shiftDayId"> & { shiftDayId: ShiftDayId | null };
  warningCodes: ShiftWarningCodeV1[];
}
// Receipt after IDs are allocated. Equality of IDs/before/after, row ordering,
// exact warning sets and cardinalities need runtime checks, not TS alone.
export type ShiftRecordedEffectV1 = Omit<ShiftEffectV1, "after"> & {
  after: ShiftStateV1;
};
type ShiftSourceCaseV1 =
  | { dataSource: "isolated-fixture" }
  | { dataSource: "oracle-test" };
export type ShiftManagementContextV1 = {
  contractVersion: "49-v0.1";
  employeeId: DecimalId;
  employee: { firstName: string; lastName: string; orgUnitId: UnitCodeV1 };
  selected: ShiftStateV1 | null;
  eligibility: "supported" | "deferred" | "already-cancelled";
  blockers: ShiftRuleCodeV1[];
  siteId: DecimalId;
  activityOptions: Array<{ code: DecimalId; label: string | null }>;
  startEndReasonOptions: Array<{ code: DecimalId; label: string | null }>;
  cancelReasonOptions: Array<{ code: string; label: string | null }>;
  workLocationOptions: Array<"home" | "site">;
  limits: { csvBytes: 1048576; csvRows: 100; atomicApply: true };
  serverTime: { instant: ShiftInstantV1; local: LocalDateTime };
  businessTimeZone: string;
} & (
  | { mode: "isolated-fixture"; dataSource: "isolated-fixture" }
  | { mode: "test-oracle-controlled"; dataSource: "oracle-test" }
);
export type ShiftPreparationV1 = {
  contractVersion: "49-v0.1";
  employeeId: DecimalId;
  validationToken: ShiftPreparationTokenV1;
  fingerprint: ShiftFingerprintV1;
  expiresAt: ShiftInstantV1;
  effects: [ShiftEffectV1];
  businessTimeZone: string;
} & ShiftSourceCaseV1;
export interface ShiftCommandV1 {
  commandId: ShiftCommandIdV1;
  draft: ShiftDraftV1;
  validationToken: ShiftPreparationTokenV1;
  fingerprint: ShiftFingerprintV1;
  operationConfirmation: { accepted: true };
  acknowledgedWarningCodes: ShiftWarningCodeV1[];
}
export interface CsvShiftPreviewRowV1 {
  line: number;
  effect: ShiftEffectV1 | null;
  errors: Array<{ column: CsvColumnV1 | "row"; code: ShiftRuleCodeV1 }>;
}
export type CsvShiftPreviewV1 = {
  contractVersion: "49-v0.1";
  employeeId: DecimalId;
  encoding: CsvShiftEncodingV1;
  rows: CsvShiftPreviewRowV1[]; // 1..100, no errors when ready
  businessTimeZone: string;
} & ShiftSourceCaseV1 & (
  | { state: "ready"; previewToken: ShiftPreparationTokenV1;
      fingerprint: ShiftFingerprintV1; expiresAt: ShiftInstantV1 }
  | { state: "invalid"; previewToken: null; fingerprint: null; expiresAt: null }
);
export interface CsvShiftCommandV1 {
  commandId: ShiftCommandIdV1;
  previewToken: ShiftPreparationTokenV1;
  fingerprint: ShiftFingerprintV1;
  operationConfirmation: { accepted: true };
  acknowledgedWarningCodes: ShiftWarningCodeV1[];
}
export type ShiftReceiptV1 = {
  contractVersion: "49-v0.1";
  commandId: ShiftCommandIdV1;
  employeeId: DecimalId;
  kind: ShiftOperationKindV1;
  effects: ShiftRecordedEffectV1[];
  commitAcknowledgedAt: ShiftInstantV1;
  readBackVerifiedAt: ShiftInstantV1;
  businessTimeZone: string;
  replayed: false;
  receiptPersistence: "none";
  partnerCompletion: "not-invoked";
} & (
  | { outcome: "fixture-committed"; dataSource: "isolated-fixture" }
  | { outcome: "oracle-test-committed"; dataSource: "oracle-test" }
);
export type ShiftInvalidParameterNameV1 =
  | "employeeId" | "shiftDayId" | "query" | "body" | "charset" | "draft" | "kind"
  | "startLocal" | "endLocal" | "activityCode" | "workLocation" | "remark"
  | "startReasonCode" | "endReasonCode" | "reasonCode" | "commandId"
  | "validationToken" | "previewToken" | "fingerprint" | "operationConfirmation"
  | "accepted" | "acknowledgedWarningCodes" | CsvColumnV1;
export type ShiftRuleFieldV1 = CsvColumnV1 | "kind" | "shiftDayId"
  | "startLocal" | "endLocal" | "workLocation" | "remark"
  | "startReasonCode" | "endReasonCode" | "reasonCode";
export type ShiftManagementProblemV1 = {
  type: string; // urn:shf:problem:<code>
  title: string; // fixed sanitized title
  requestId: string;
  commandId: ShiftCommandIdV1 | null;
  invalidParameters?: Array<{ name: ShiftInvalidParameterNameV1;
    reason: "required" | "invalid-format" | "unsupported" }>;
  ruleViolations?: Array<{ row: number | null; field: ShiftRuleFieldV1 | null;
    code: ShiftRuleCodeV1 }>;
} & (
  | { status: 400 | 405; code: "INVALID_REQUEST"; effect: "none";
      nextAction: "correct-and-validate" }
  | { status: 413; code: "REQUEST_TOO_LARGE"; effect: "none";
      nextAction: "correct-and-validate" }
  | { status: 415; code: "UNSUPPORTED_MEDIA_TYPE"; effect: "none";
      nextAction: "correct-and-validate" }
  | { status: 422; code: "BUSINESS_VALIDATION_FAILED"; effect: "none";
      nextAction: "correct-and-validate" }
  | { status: 401; code: "UNAUTHENTICATED"; effect: "none"; nextAction: "stop" }
  | { status: 403; code: "FORBIDDEN" | "LIVE_WRITES_DISABLED";
      effect: "none"; nextAction: "stop" }
  | { status: 404; code: "SHIFT_DAY_NOT_FOUND"; effect: "none"; nextAction: "stop" }
  | { status: 409; code: "STALE_PREPARATION" | "CONFIRMATION_REQUIRED";
      effect: "none" | "rolled-back"; nextAction: "prepare-again" }
  | { status: 409; code: "ALREADY_CANCELLED" | "COMMAND_IN_PROGRESS"
        | "COMMAND_ID_CONFLICT" | "COMMAND_SCOPE_DEFERRED";
      effect: "none" | "rolled-back"; nextAction: "stop" }
  | { status: 503; code: "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT";
      effect: "none" | "rolled-back"; nextAction: "stop" }
  | { status: 500; code: "INVALID_SOURCE_DATA" | "AMBIGUOUS_SHIFT_DAY" | "INTERNAL_ERROR";
      effect: "none" | "rolled-back"; nextAction: "stop" }
  | { status: 503; code: "COMMAND_OUTCOME_UNKNOWN"; effect: "unknown";
      nextAction: "reconcile" }
);

// APPLICATION/PACKAGE PORTS, not additional REST fields or SQL interfaces.
export interface ShiftSelectionV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId | null; // null for employee workspace/create/import
}
export interface ShiftManagementAccessPolicy {
  requirePrepare(principal: PrincipalV1): void;
  requireCommand(principal: PrincipalV1, kind: ShiftOperationKindV1): void;
  requireCsvPreview(principal: PrincipalV1): void;
  authorizedTeamIds(principal: PrincipalV1): readonly UnitCodeV1[];
}
export type PartnerShiftEffectV1 = {
  kind: "managed-break-change" | "cti-shift-change";
  shiftDayId: ShiftDayId | null;
};
export interface PartnerShiftPort {
  // Pure, snapshot-derived assessment, never partner transport/completion.
  assess(plan: { kind: ShiftOperationKindV1; effects: readonly ShiftEffectV1[] }): {
    state: "not-required" | "required" | "unknown";
    effects: PartnerShiftEffectV1[];
  };
}
export interface ShiftManagementApplicationPort {
  context(principal: PrincipalV1, selection: ShiftSelectionV1,
    signal?: AbortSignal): Promise<ShiftManagementContextV1>;
  prepare(principal: PrincipalV1, employeeId: DecimalId, draft: ShiftDraftV1,
    signal?: AbortSignal): Promise<ShiftPreparationV1>;
  command(principal: PrincipalV1, employeeId: DecimalId, command: ShiftCommandV1,
    signal?: AbortSignal): Promise<ShiftReceiptV1>;
  // HTTP owns bounded byte collection/header validation. No JSON upload DTO.
  // CSV personalId: exact9 digits OR uppercase X+exact9. Strip ONLY that one
  // transport marker before exact full9 selected-employee comparison; preserve
  // zeros. Derive first8 private day key only after full9/uniqueness admission.
  // Raw cell/full9/first8 are distinct private values, never public DTO fields.
  previewCsv(principal: PrincipalV1, employeeId: DecimalId, bytes: Uint8Array,
    encoding: CsvShiftEncodingV1, signal?: AbortSignal): Promise<CsvShiftPreviewV1>;
  commandCsv(principal: PrincipalV1, employeeId: DecimalId, command: CsvShiftCommandV1,
    signal?: AbortSignal): Promise<ShiftReceiptV1>;
}

// Immutable binding reference for ONE management namespace across all4 flows.
// These fields are backend-only; do not serialize, log or use as credentials.
export type ShiftMetadataReferenceV1 =
  | { provider: "dba-v1" | "owner-hybrid-v1"; certificate: string }
  | { provider: "owner-test-limited-v1"; certificate: string;
      waiverId: "shf-test-dba-two-view-waiver-20261028-v0.1";
      unavailable: readonly ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"] };
export type ShiftAdmissionReferenceV1 = {
  namespace: "shift-management-v0.1";
  identityRevision: string;
  operatorScopeRevision: string;
} & (
  | { mode: "isolated-fixture"; dataSource: "isolated-fixture"; metadata: null }
  | { mode: "test-oracle-controlled"; dataSource: "oracle-test";
      metadata: ShiftMetadataReferenceV1 }
);
export type ShiftAdmissionPlanV1 = Readonly<{
  reference: Readonly<ShiftAdmissionReferenceV1>;
  kind: ShiftOperationKindV1;
  employeeId: DecimalId;
  principal: Readonly<PrincipalV1>;
  authGeneration: string;
  authorizedTeamIds: readonly UnitCodeV1[];
  // Digest includes full originals/dependency membership/policy/zone/row order,
  // not just public effects. No public raw snapshot bag or private personal IDs.
  planDigest: ShiftFingerprintV1;
  snapshotRevision: ShiftFingerprintV1;
  expiresAt: ShiftInstantV1;
  effects: readonly ShiftEffectV1[];
}>;
export interface ShiftAdmissionPreparationV1 {
  validationToken: ShiftPreparationTokenV1; // CSV maps this to previewToken
  fingerprint: ShiftFingerprintV1;
  expiresAt: ShiftInstantV1;
}
export interface ShiftCommandBindingV1 {
  reference: Readonly<ShiftAdmissionReferenceV1>;
  kind: ShiftOperationKindV1;
  employeeId: DecimalId;
  principal: Readonly<PrincipalV1>;
  authGeneration: string;
  authorizedTeamIds: readonly UnitCodeV1[];
  commandId: ShiftCommandIdV1;
  validationToken: ShiftPreparationTokenV1;
  fingerprint: ShiftFingerprintV1;
  planDigest: ShiftFingerprintV1;
  operationConfirmation: { accepted: true };
  acknowledgedWarningCodes: readonly ShiftWarningCodeV1[];
}
export interface ShiftConsumedAdmissionV1 {
  reference: Readonly<ShiftAdmissionReferenceV1>;
  kind: ShiftOperationKindV1;
  employeeId: DecimalId;
  commandId: ShiftCommandIdV1;
  planDigest: ShiftFingerprintV1;
  // Opaque process-owned handle, not a fuse path, durable receipt or HTTP token.
  attemptHandle: string;
}
export type ShiftAdmissionOutcomeV1 =
  | { kind: "verified"; receipt: ShiftReceiptV1 }
  | { kind: "rejected"; problem: Exclude<ShiftManagementProblemV1,
      { effect: "unknown" }> }
  | { kind: "unknown"; problem: Extract<ShiftManagementProblemV1,
      { effect: "unknown" }> };
export interface ShiftCommandAdmission {
  readonly reference: Readonly<ShiftAdmissionReferenceV1>;
  prepare(plan: ShiftAdmissionPlanV1,
    signal?: AbortSignal): Promise<ShiftAdmissionPreparationV1>;
  // Reserve employee across4 flows before effect; native private allowance
  // consumed before NEXTVAL/DML. Wrong bindings must not consume usable tokens.
  consume(binding: ShiftCommandBindingV1,
    signal?: AbortSignal): Promise<ShiftConsumedAdmissionV1>;
  // UNKNOWN quarantines employee/all imported rows, including after reload.
  // Never reopen allowance on rejection/rollback or replay verified success.
  finish(attempt: ShiftConsumedAdmissionV1,
    outcome: ShiftAdmissionOutcomeV1): Promise<void>;
}

// Deliberately parameterized only over backend-private parsed snapshot/plans:
// canonical owns method signatures; B49 owns physical Oracle representations.
// No public raw-table DTO, arbitrary execute, generic repository or SQL string.
export interface ShiftSnapshotPort<Snapshot> {
  readonly reference: Readonly<ShiftAdmissionReferenceV1>;
  read(selection: ShiftSelectionV1, signal?: AbortSignal): Promise<Snapshot>;
}
export interface ShiftLockedWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan> {
  readLockedSnapshot(): Promise<Snapshot>;
  nextDayId(): Promise<ShiftDayId>; // existing allowed sequence; NEVER preview
  insertDay(plan: CreatePlan): Promise<number | undefined>;
  insertOverlay(plan: OverlayPlan): Promise<number | undefined>;
  updateOverlay(plan: OverlayPlan): Promise<number | undefined>;
  markSource(plan: SourcePlan): Promise<number | undefined>;
}
export interface ShiftTransactionAcknowledgmentV1 {
  effects: ShiftRecordedEffectV1[];
  commitAcknowledgedAt: ShiftInstantV1;
  // NOT a receipt: separate identity-checked full-preservation readback required.
}
export interface ShiftCommandUnitOfWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan> {
  readonly reference: Readonly<ShiftAdmissionReferenceV1>;
  run(selection: ShiftSelectionV1 & { admission: ShiftConsumedAdmissionV1 },
    work: (locked: ShiftLockedWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan>) =>
      Promise<ShiftRecordedEffectV1[]>,
    signal?: AbortSignal): Promise<ShiftTransactionAcknowledgmentV1>;
}

// CONSUMER OBLIGATIONS (§49): strict unknown/duplicate keys, exact URI methods,
// same-origin/provenance, minute-aligned civil values/DST, byte/charset limits,
// full scope/identity certificates, fresh clock/ALS/deadline guards, warnings,
// rowcount exactly1 and complete preservation/readback require runtime checks.
// Readonly/reference/handle types are not authentication or deep-freeze proof:
// runtime must validate immutable provenance and match actor/employee/kind/
// command/reference/plan on consume, locked execution, finish and readback.
// UoW must match its frozen reference to consumed admission/command ownership; no
// callback may commit/release/transport. autoCommit=false, NOWAIT employee then
// ordered day locks; cross-table legacy writers need named external exclusion.
// All ordinary CSV rows commit together; NEXTVAL gaps/autonomous effects cannot
// be undone by ordinary rollback. No durable idempotency/outbox/receipt storage.
// Unproved effect/COMMIT ACK/readback/transport -> UNKNOWN, no retry/newUUID.
// GET B/context, GET B/shift-days/{shiftDayId}/context; POST B/preparations,
// B/commands, B/csv-previews (raw text/csv + explicit charset), B/csv-commands.
// B=/api/v1/employees/{employeeId}/shift-management, no query params.
// Production and mock/native startup safety remain fail-closed; no grant/DDL/
// sequence permission, operator packet/GO or partner completion is supplied here.
