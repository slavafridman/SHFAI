import { test } from "node:test";
import assert from "node:assert/strict";
import * as canonical from "../shift-management-contracts.mts";
import type {
  CapabilityV1, IdentityResponseV1, PrincipalV1, ProblemCode,
} from "../contracts.mts";
import type {
  CsvColumnV1, CsvShiftCommandV1, CsvShiftPreviewV1,
  PartnerShiftPort, ShiftAdmissionOutcomeV1, ShiftAdmissionReferenceV1,
  ShiftCommandAdmission, ShiftCommandBindingV1, ShiftCommandUnitOfWork,
  ShiftCommandV1, ShiftConsumedAdmissionV1, ShiftDraftV1, ShiftEffectV1,
  ShiftLockedWork, ShiftManagementApplicationPort, ShiftManagementCapabilityV1,
  ShiftManagementContextV1, ShiftManagementProblemV1, ShiftMetadataReferenceV1,
  ShiftPreparationV1, ShiftReceiptV1, ShiftRuleCodeV1,
  ShiftSelectionV1, ShiftSnapshotPort, ShiftWarningCodeV1,
} from "../shift-management-contracts.mts";
import type { StationExitCommitV1 } from "../station-exit-contracts.mts";
import type { NativeStageArrivalReceiptV1 } from "../oracle-stage-arrival-contracts.mts";

// These assertions are checked by tsc, NOT by native Node's type stripping.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type Reads = "shift-day:read" | "current-shifts:read" | "shift-search:read"
  | "my-shifts:read" | "shift-items:read" | "employee:read" | "attendance:read";
type Management = "shift-management:prepare" | "shift-management:create"
  | "shift-management:change" | "shift-management:cancel"
  | "shift-management:csv-preview" | "shift-management:csv-apply"
  | "shift-management:test-oracle-write";
type ArrivalFamily = "prepare" | "commit" | "test-oracle-write";
type Create = Extract<ShiftDraftV1, { kind: "create" }>;
type Change = Extract<ShiftDraftV1, { kind: "change" }>;
type Cancel = Extract<ShiftDraftV1, { kind: "cancel" }>;
type Ready = Extract<CsvShiftPreviewV1, { state: "ready" }>;
type Invalid = Extract<CsvShiftPreviewV1, { state: "invalid" }>;
type Native = Extract<ShiftReceiptV1, { dataSource: "oracle-test" }>;
type Fixture = Extract<ShiftReceiptV1, { dataSource: "isolated-fixture" }>;
type Unknown = Extract<ShiftManagementProblemV1, { effect: "unknown" }>;
type Problems = ShiftManagementProblemV1;
type Snapshot = { readonly parsedFactsRevision: string };
type CreatePlan = { kind: "create"; employeeId: string };
type OverlayPlan = { kind: "change" | "cancel"; shiftDayId: string };
type SourcePlan = { kind: "mark-source"; shiftDayId: string };
type Uow = ShiftCommandUnitOfWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan>;
type Locked = ShiftLockedWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan>;
type Checks = [
  Assert<Equal<ShiftManagementCapabilityV1, Management>>,
  Assert<Equal<Extract<CapabilityV1, `shift-management:${string}`>, Management>>,
  Assert<Equal<Exclude<CapabilityV1,
    `attendance-${string}` | `shift-management:${string}`>, Reads>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-stage-arrival:${string}`>,
    `attendance-stage-arrival:${ArrivalFamily}`>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival:${string}`>,
    `attendance-station-arrival:${ArrivalFamily}`>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-exit:${string}`>,
    `attendance-station-exit:${ArrivalFamily}`>>,
  Assert<Equal<keyof PrincipalV1, "subject" | "provider" | "synthetic" | "displayName"
    | "roles" | "capabilities" | "employeeId" | "resourceScope">>,
  Assert<Equal<PrincipalV1["employeeId"], string | null>>,
  Assert<Equal<keyof IdentityResponseV1, "principal" | "dataSource">>,
  Assert<Equal<IdentityResponseV1["dataSource"], "isolated-fixture" | "oracle">>,
  Assert<Equal<Extract<ProblemCode, "COMMAND_OUTCOME_UNKNOWN">, never>>,
  Assert<Equal<ShiftDraftV1["kind"], "create" | "change" | "cancel">>,
  Assert<Equal<keyof Create, "kind" | "startLocal" | "endLocal" | "activityCode"
    | "workLocation" | "remark">>,
  Assert<Equal<Create["remark"], string | null>>,
  Assert<Equal<keyof Change, "kind" | "shiftDayId" | "startLocal" | "endLocal"
    | "activityCode" | "workLocation" | "startReasonCode" | "endReasonCode">>,
  Assert<Equal<Change["startReasonCode"], string | null>>,
  Assert<Equal<keyof Cancel, "kind" | "shiftDayId" | "reasonCode" | "remark">>,
  Assert<Equal<Assignable<{}, ShiftDraftV1>, false>>,
  Assert<Equal<Assignable<StationExitCommitV1["draft"], ShiftDraftV1>, false>>,
  Assert<Equal<keyof ShiftCommandV1, "commandId" | "draft" | "validationToken"
    | "fingerprint" | "operationConfirmation" | "acknowledgedWarningCodes">>,
  Assert<Equal<ShiftCommandV1["operationConfirmation"], { accepted: true }>>,
  Assert<Equal<keyof CsvShiftCommandV1, "commandId" | "previewToken"
    | "fingerprint" | "operationConfirmation" | "acknowledgedWarningCodes">>,
  Assert<Equal<Assignable<ShiftCommandV1, CsvShiftCommandV1>, false>>,
  Assert<Equal<Assignable<CsvShiftCommandV1, ShiftCommandV1>, false>>,
  Assert<Equal<ShiftPreparationV1["effects"], [ShiftEffectV1]>>,
  Assert<Equal<Ready["previewToken" | "fingerprint" | "expiresAt"], string>>,
  Assert<Equal<Invalid["previewToken" | "fingerprint" | "expiresAt"], null>>,
  Assert<Equal<CsvShiftPreviewV1["encoding"], "utf-8" | "windows-1255">>,
  Assert<Equal<CsvColumnV1, "personalId" | "activityCode" | "date"
    | "location" | "startTime" | "endTime">>,
  Assert<Equal<ShiftWarningCodeV1, "DURATION_CHANGED" | "SOURCE_BECOMES_SHF"
    | "OVERNIGHT_NORMALIZED" | "LOGICAL_CANCEL_PRESERVES_HISTORY">>,
  Assert<Equal<ShiftRuleCodeV1,
    "EMPLOYEE_NOT_ACTIVE" | "UNSUPPORTED_DAY" | "UNSUPPORTED_SOURCE"
    | "INVALID_TIME_RANGE" | "AMBIGUOUS_LOCAL_TIME" | "OFFSET_TRANSITION_UNSUPPORTED"
    | "PAST_OR_STARTED_SHIFT" | "OUTSIDE_SCHEDULE_WEEK" | "DURATION_OUT_OF_POLICY"
    | "SHIFT_OVERLAP_OR_GAP" | "SITE_ACTIVITY_MISMATCH" | "HOME_POLICY_UNAVAILABLE"
    | "UNSUPPORTED_MINUTE_ACCOUNTING" | "DEPENDENT_FLOW_UNSUPPORTED"
    | "ATTENDANCE_PRESENT" | "MISSING_PRESENT" | "REPORT_REVIEW_REQUIRED"
    | "EXCHANGE_PRESENT" | "POOL_DEPENDENCY_PRESENT" | "PARTNER_REQUIRED_OR_UNKNOWN"
    | "NO_CHANGE" | "CSV_INVALID_HEADER" | "CSV_INVALID_ROW" | "CSV_DUPLICATE"
    | "CSV_EMPLOYEE_MISMATCH" | "CSV_LIMIT_EXCEEDED" | "TEXT_NOT_REPRESENTABLE">>,
  Assert<Equal<ShiftManagementContextV1["limits"],
    { csvBytes: 1048576; csvRows: 100; atomicApply: true }>>,
  Assert<Equal<Extract<ShiftManagementContextV1,
    { mode: "test-oracle-controlled" }>["dataSource"], "oracle-test">>,
  Assert<Equal<Native["outcome"], "oracle-test-committed">>,
  Assert<Equal<Fixture["outcome"], "fixture-committed">>,
  Assert<Equal<Assignable<Omit<Native, "dataSource"> & {
    dataSource: "isolated-fixture" }, ShiftReceiptV1>, false>>,
  Assert<Equal<Assignable<Omit<Ready, "previewToken"> & {
    previewToken: null }, CsvShiftPreviewV1>, false>>,
  Assert<Equal<Assignable<Omit<Invalid, "fingerprint"> & {
    fingerprint: string }, CsvShiftPreviewV1>, false>>,
  Assert<Equal<ShiftReceiptV1["effects"][number]["after"]["shiftDayId"], string>>,
  Assert<Equal<ShiftReceiptV1["replayed"], false>>,
  Assert<Equal<ShiftReceiptV1["receiptPersistence"], "none">>,
  Assert<Equal<ShiftReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<Extract<keyof ShiftReceiptV1, "committedAt">, never>>,
  Assert<Equal<Assignable<NativeStageArrivalReceiptV1, ShiftReceiptV1>, false>>,
  Assert<Equal<Unknown["code"], "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<Unknown["status"], 503>>,
  Assert<Equal<Unknown["nextAction"], "reconcile">>,
  Assert<Equal<Assignable<Omit<Unknown, "nextAction"> & {
    nextAction: "prepare-again" }, Problems>, false>>,
  Assert<Equal<Extract<Problems, { code: "COMMAND_OUTCOME_UNKNOWN" }>["effect"],
    "unknown">>,
  Assert<Equal<Extract<Problems, { code: "INVALID_REQUEST" }>["effect"], "none">>,
  // The canonical case groups both codes in one union-valued property.
  // Extract does not split that property into separate object-union members.
  Assert<Equal<Extract<Problems, {
    code: "STALE_PREPARATION" | "CONFIRMATION_REQUIRED" }>["nextAction"],
    "prepare-again">>,
  Assert<Equal<Extract<Problems, { nextAction: "prepare-again" }>["code"],
    "STALE_PREPARATION" | "CONFIRMATION_REQUIRED">>,
  Assert<Equal<Problems["code"], "INVALID_REQUEST" | "REQUEST_TOO_LARGE"
    | "UNSUPPORTED_MEDIA_TYPE" | "BUSINESS_VALIDATION_FAILED" | "UNAUTHENTICATED"
    | "FORBIDDEN" | "LIVE_WRITES_DISABLED" | "SHIFT_DAY_NOT_FOUND"
    | "STALE_PREPARATION" | "CONFIRMATION_REQUIRED" | "ALREADY_CANCELLED"
    | "COMMAND_IN_PROGRESS" | "COMMAND_ID_CONFLICT" | "COMMAND_SCOPE_DEFERRED"
    | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT" | "INVALID_SOURCE_DATA"
    | "AMBIGUOUS_SHIFT_DAY" | "INTERNAL_ERROR" | "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<ShiftAdmissionReferenceV1["namespace"], "shift-management-v0.1">>,
  Assert<Equal<Extract<ShiftAdmissionReferenceV1,
    { mode: "isolated-fixture" }>["metadata"], null>>,
  Assert<Equal<Extract<ShiftMetadataReferenceV1,
    { provider: "owner-test-limited-v1" }>["unavailable"],
    readonly ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"]>>,
  Assert<Equal<ShiftCommandAdmission["reference"], Readonly<ShiftAdmissionReferenceV1>>>,
  Assert<Equal<Parameters<ShiftCommandAdmission["consume"]>[0], ShiftCommandBindingV1>>,
  Assert<Equal<Extract<ShiftAdmissionOutcomeV1, { kind: "unknown" }>["problem"], Unknown>>,
  Assert<Equal<Parameters<Uow["run"]>[0],
    ShiftSelectionV1 & { admission: ShiftConsumedAdmissionV1 }>>,
  Assert<Equal<keyof Locked, "readLockedSnapshot" | "nextDayId" | "insertDay"
    | "insertOverlay" | "updateOverlay" | "markSource">>,
  Assert<Equal<Parameters<Locked["insertDay"]>[0], CreatePlan>>,
  Assert<Equal<ReturnType<Locked["insertDay"]>, Promise<number | undefined>>>,
  Assert<Equal<ReturnType<ShiftSnapshotPort<Snapshot>["read"]>, Promise<Snapshot>>>,
  Assert<Equal<Parameters<ShiftManagementApplicationPort["previewCsv"]>[2], Uint8Array>>,
  Assert<Equal<Parameters<ShiftManagementApplicationPort["previewCsv"]>[3],
    "utf-8" | "windows-1255">>,
  Assert<Equal<Parameters<ShiftManagementApplicationPort["commandCsv"]>[2],
    CsvShiftCommandV1>>,
  Assert<Equal<Extract<keyof CsvShiftPreviewV1,
    "personalId" | "rawPersonalId" | "normalizedFullPersonalId" | "dayEmployeeKey">,
    never>>,
  Assert<Equal<Parameters<Uow["run"]>[2], AbortSignal | undefined>>,
  Assert<Equal<keyof PartnerShiftPort, "assess">>,
];
type AllChecks = Assert<Equal<Checks[number], true>>;

test("§49 canonical module is type-only: no grants, factories or IO exports", () => {
  assert.deepEqual(Object.keys(canonical), []);
});
