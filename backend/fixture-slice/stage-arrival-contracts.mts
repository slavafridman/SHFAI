// Canonical TYPE-ONLY v0.1: approved sections 38/39, recorded in section 40.
// Draft names intentionally match section 38 exactly. No runtime consumer,
// HTTP parser, token implementation, Oracle adapter or messaging implementation.
import type {
  DecimalId, LocalDateTime, PrincipalV1, ShiftDayId,
} from "./contracts.mts";
import type { Clock, UnitCodeV1 } from "./current-shifts-contracts.mts";

// Required properties throughout; only explicit nulls are legal. Runtime
// validation MUST reject unknown/duplicate keys, coercions and unsafe unknown
// source values. These string aliases do not establish runtime validation.
export type StageArrivalInstantV1 = string; // RFC3339 UTC, Z
export type StageArrivalFingerprintV1 = string; // exactly 64 lowercase hex
export type StageArrivalValidationTokenV1 = string; // opaque base64url, 43 chars
export type StageArrivalCommandIdV1 = string; // lowercase UUID v4
export type StageArrivalMinutesV1 = string; // 0|[1-9][0-9]{0,9}
export type StageArrivalModeV1 = "disabled" | "isolated-fixture";

export interface StageArrivalDraftV1 {
  lateReasonCode: DecimalId | null; // positive canonical decimal, 1-38 digits
  lateRemark: string | null; // <=500 Unicode code points, plain/no controls
}
export type StageArrivalBlockerV1 =
  | "ATTENDANCE_ROW_REQUIRED" | "MISSING_PRESENT" | "REPORT_REVIEW_REQUIRED"
  | "UNSUPPORTED_DAY" | "DEPENDENT_ATTENDANCE_PRESENT" | "EXISTING_STAGE_LATE"
  | "BRIEFING_PRESENT";
export interface StageArrivalContextDraftV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  orgUnitId: UnitCodeV1;
  planned: { startLocal: LocalDateTime; endLocal: LocalDateTime };
  recorded: {
    stageArrivalLocal: LocalDateTime | null;
    stationArrivalLocal: LocalDateTime | null;
    stationExitLocal: LocalDateTime | null;
    briefing: boolean | null;
  };
  serverTime: {
    instant: StageArrivalInstantV1;
    local: LocalDateTime;
    businessTimeZone: string;
  };
  eligibility: "eligible" | "already-recorded" | "deferred";
  blockers: StageArrivalBlockerV1[];
  lateReasonOptions: Array<{ code: DecimalId; label: string | null }>;
  dataSource: "isolated-fixture";
}
export interface StageArrivalWarningDraftV1 {
  code: "STAGE_ARRIVAL_LATE";
  minutes: StageArrivalMinutesV1;
}
export interface StageArrivalValidationDraftV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  state: "ready" | "warning-requires-confirmation";
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  expiresAt: StageArrivalInstantV1;
  businessTimeZone: string;
  fingerprint: StageArrivalFingerprintV1;
  validationToken: StageArrivalValidationTokenV1;
  warnings: StageArrivalWarningDraftV1[];
  confirmationRequired: boolean;
  dataSource: "isolated-fixture";
}
export interface StageArrivalCommitDraftV1 {
  commandId: StageArrivalCommandIdV1;
  draft: StageArrivalDraftV1;
  validationToken: StageArrivalValidationTokenV1;
  fingerprint: StageArrivalFingerprintV1;
  confirmation: null | {
    accepted: true;
    warningCodes: ["STAGE_ARRIVAL_LATE"];
  };
}
export interface StageArrivalReceiptDraftV1 {
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  outcome: "fixture-committed";
  recorded: {
    stageArrivalLocal: LocalDateTime;
    briefing: false;
    stageLate: null | {
      reasonCode: DecimalId; minutes: StageArrivalMinutesV1; remark: string | null;
    };
  };
  committedAt: StageArrivalInstantV1;
  businessTimeZone: string;
  replayed: boolean;
  partnerCompletion: "not-invoked";
  dataSource: "isolated-fixture";
}

// Separate problem allowlist: existing seven read Problem/DTO shapes unchanged.
export type StageArrivalProblemCaseV1 =
  | { status: 400 | 405; code: "INVALID_REQUEST"; nextAction: "correct-and-validate" }
  | { status: 413; code: "REQUEST_TOO_LARGE"; nextAction: "correct-and-validate" }
  | { status: 415; code: "UNSUPPORTED_MEDIA_TYPE"; nextAction: "correct-and-validate" }
  | { status: 401; code: "UNAUTHENTICATED"; nextAction: "stop" }
  | { status: 403; code: "FORBIDDEN" | "LIVE_WRITES_DISABLED"; nextAction: "stop" }
  | { status: 404; code: "SHIFT_DAY_NOT_FOUND"; nextAction: "stop" }
  | { status: 422; code: "BUSINESS_VALIDATION_FAILED"; nextAction: "correct-and-validate" }
  | { status: 409; code: "STALE_PREPARATION" | "CONFIRMATION_REQUIRED";
      nextAction: "prepare-again" }
  | { status: 409; code: "ALREADY_REGISTERED" | "COMMAND_SCOPE_DEFERRED"
      | "COMMAND_ID_CONFLICT" | "COMMAND_IN_PROGRESS"; nextAction: "stop" }
  | { status: 503; code: "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT";
      nextAction: "stop" }
  | { status: 500; code: "AMBIGUOUS_ATTENDANCE" | "INVALID_SOURCE_DATA"
      | "INTERNAL_ERROR"; nextAction: "stop" };
export type StageArrivalProblemDraftV1 = {
  type: string; // urn:shf:problem:<code>
  title: string; // stable, sanitized
  requestId: string;
  commandId: StageArrivalCommandIdV1 | null;
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "lateReasonCode" | "lateRemark"
      | "commandId" | "draft" | "validationToken" | "fingerprint"
      | "confirmation" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
} & (
  | (StageArrivalProblemCaseV1 & {
      effect: "none" | "rolled-back";
    })
  | { status: 503; code: "COMMAND_OUTCOME_UNKNOWN";
      effect: "unknown"; nextAction: "reconcile" }
);
// none only BEFORE attempted effect; rolled-back only after complete proven
// fixture rollback with no internal/external commit. nextAction is precisely:
// 400/405/413/415/422 -> correct-and-validate; STALE_PREPARATION/
// CONFIRMATION_REQUIRED -> prepare-again; other known rejections -> stop.
// An attempted effect with unproved outcome MUST use COMMAND_OUTCOME_UNKNOWN,
// never DEPENDENCY_TIMEOUT/none. Transport loss/malformed or wrong-source
// command success is likewise UNKNOWN client-side, not a fabricated receipt.

// INTERNAL application seams below; not new HTTP/identity fields or DB schema.
export interface StageArrivalSelectionV1 {
  employeeId: DecimalId; // positive canonical 1-38 digits
  shiftDayId: ShiftDayId; // positive canonical 1-10 digits
}
export interface StageArrivalAccessPolicy {
  requirePrepare(principal: PrincipalV1): void;
  requireCommit(principal: PrincipalV1): void; // requires BOTH new capabilities
  authorizedTeamIds(principal: PrincipalV1): UnitCodeV1[];
}
// Authenticate/validate principal -> grammar -> capability -> exact scope copy
// BEFORE ports. <=100 original exact J01 grants, direct G01 policy lookup only.
// Missing/mismatched/out-of-scope -> same404; invalid principal401, rights403.
// No parent/prefix expansion, self/actAs, or Administrator-label bypass.
// Synthetic principal remains employeeId=null, NOT selection.employeeId.

// Feature setting is an addition at consumer construction, not an alteration
// to StartupConfig/IdentityResponseV1 or existing Oracle read configuration.
// Omitted setting means disabled. Reject unknown/mixed values before listen.
export type StageArrivalConfigurationV1 =
  | { attendanceStageArrivalMode?: "disabled" }
  | { attendanceStageArrivalMode: "isolated-fixture";
      dataSource: "isolated-fixture";
      deploymentClass: "local-development" | "isolated-test-demo";
      authenticationMode: "synthetic"; syntheticAdministratorEnabled: true };
// Enabled mode requires coherent fixture-only app/session/readers/UoW, explicit
// mock opt-in, all nine rights, no Oracle adapters. Production or Oracle source
// with enabled mode -> startup rejection. A native write adapter is unsupported
// and MUST fail construction; disabled/read-only routes deny LIVE_WRITES_DISABLED
// before source/writer access. No fallback from Oracle read failures to F1.

export interface StageArrivalSourceBindingV1 {
  environment: string; // isolated application instance, never credentials
  fixtureSession: string; // process-owned isolated fixture session identity
  dataSource: "isolated-fixture";
}
export interface StageArrivalActorBindingV1 {
  subject: string;
  provider: PrincipalV1["provider"];
  synthetic: boolean;
  authorizedTeamIds: readonly UnitCodeV1[];
}
// Validated facts only, immutable copy from ONE coherent fixture snapshot.
// Unknown/invalid flags/catalog/policy/ambiguous time are NOT normalized to
// eligible. Adapters reject them with INVALID_SOURCE_DATA before these types.
export interface StageArrivalFactsV1 {
  source: StageArrivalSourceBindingV1;
  selection: StageArrivalSelectionV1;
  orgUnitId: UnitCodeV1;
  parentUnitId: UnitCodeV1;
  // Opaque process revision for relevant original facts, NOT a DB VERSION.
  // Must change on any relevant field/policy/catalog change; compare original
  // facts too, never trust revision alone. Never a public context wire field.
  revision: string;
  policy: { revision: string; configuredMinutes: number }; // safe integer
  planned: StageArrivalContextDraftV1["planned"]; // valid end>=start
  attendance: null | {
    attendanceKey: { shiftDayId: ShiftDayId }; // SAME selected day; no attendanceId
    stageArrivalLocal: LocalDateTime | null;
    stageArrivalUser: string | null;
    stationArrivalLocal: LocalDateTime | null;
    stationExitLocal: LocalDateTime | null;
    briefing: boolean | null; // canonical source NULL/0/1, not truthiness
    stageLateReasonCode: DecimalId | null;
    stageLateMinutes: StageArrivalMinutesV1 | null;
    stageLateRemark: string | null;
  };
  missingPresent: boolean;
  outstandingReportsPresent: boolean;
  splitOrP2: boolean;
  cancelledOrNonActivityDay: boolean;
  lateReasonOptions: StageArrivalContextDraftV1["lateReasonOptions"];
}
export type StageArrivalSourceStateV1 =
  | { kind: "not-found" }
  | { kind: "ambiguous" }
  | { kind: "one"; facts: StageArrivalFactsV1 };
export interface StageArrivalContextPort {
  readonly dataSource: "isolated-fixture";
  read(selection: StageArrivalSelectionV1,
    authorizedTeamIds: readonly UnitCodeV1[]): Promise<StageArrivalSourceStateV1>;
}
// No employee/day inference or first-row/dedup. Absent attendance is deferred,
// NOT an insert candidate; duplicates (even equal) -> AMBIGUOUS_ATTENDANCE500.
// Catalog <=100 + overflow detection; duplicate/missing/malformed facts500.

export interface StageArrivalPreparationBindingV1 {
  source: StageArrivalSourceBindingV1;
  actor: StageArrivalActorBindingV1;
  facts: StageArrivalFactsV1;
  draft: StageArrivalDraftV1;
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  businessTimeZone: string;
  warnings: readonly StageArrivalWarningDraftV1[];
  confirmationRequired: boolean;
  fingerprint: StageArrivalFingerprintV1;
  expiresAt: StageArrivalInstantV1;
  nextWarningOrMinuteTransitionAt: StageArrivalInstantV1 | null;
}
export interface StageArrivalValidationTokenPort {
  // Ephemeral preparation memory ONLY, not a receipt/business/audit write.
  issue(binding: StageArrivalPreparationBindingV1): StageArrivalValidationTokenV1;
  find(token: StageArrivalValidationTokenV1): StageArrivalPreparationBindingV1 | null;
}
// Built-in node:crypto only: randomBytes(32) base64url token; SHA-256 canonical
// relevant facts/draft/policy/time classification -> fingerprint. No new package
// or client-parsed token/HMAC protocol. Server-memory token binds full actor/
// exact grants/source/session/selection/attendanceKey/revision/current facts,
// draft/policy/zone/warning/minutes, not just the publicly returned digest.
// expiresAt=min(evaluatedAt+120s, earliest warning/minute transition).
// Reject at/after expiry. No raw current-second inclusion that would make every
// fresh second stale; compare classification/minutes and original facts.
// On-time draft null/null, warnings[]/false/ready; any late field ->422.
// Late draft requires selectable reason, optional remark; exact one warning/
// true/warning-requires-confirmation, derived floor minutes>=0 (<=10 digits).
// Context grants NO permission/token. Unknown boundary/DST -> reject, not guess.
// Clock: reuse configured business IANA zone. Compare full instant precision
// for strict now+policyMinutes>plannedStart (equality is on-time; subsecond
// crossing can be late with minutes0). Truncate recorded civil seconds, never
// round. One sample per validation; fresh sample under command lock. No request
// time/date/zone/offset or retrospective editing; preview time is not commit time.

export interface StageArrivalCommandBindingV1 {
  source: StageArrivalSourceBindingV1;
  actor: StageArrivalActorBindingV1;
  selection: StageArrivalSelectionV1;
  command: StageArrivalCommitDraftV1;
}
// Read/receipt scope always reauthorized. Key is environment + subject +
// employee/day/commandId (fixtureSession isolates the entire store). Payload
// equality includes exact normalized draft/confirmation/token/fingerprint.
export type StageArrivalReceiptStateV1 =
  | { kind: "new" }
  | { kind: "in-progress" }
  | { kind: "conflict" }
  | { kind: "completed"; receipt: StageArrivalReceiptDraftV1 };
export interface CommandReceiptPort {
  // Transaction-bound synchronous inspection, never an HTTP operation query.
  inspect(binding: StageArrivalCommandBindingV1): StageArrivalReceiptStateV1;
}
export interface StageArrivalFixtureAuditV1 {
  subject: string;
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  outcome: "fixture-committed";
}
export interface CommandAuditPort {
  // Pure staging value, no independent persistent write. Installed ONLY with
  // business state and terminal receipt by the same fixture UoW.
  stage(binding: StageArrivalCommandBindingV1): StageArrivalFixtureAuditV1;
}
export interface StageArrivalFixtureWriteV1 {
  attendanceKey: { shiftDayId: ShiftDayId };
  stageArrivalLocal: LocalDateTime;
  stageArrivalUser: string; // existing synthetic display-name provenance only
  briefing: false; // source TADREECH=0
  stageLate: StageArrivalReceiptDraftV1["recorded"]["stageLate"];
}
export type StageArrivalAtomicDecisionV1 =
  | { kind: "reject"; problem: StageArrivalProblemDraftV1 }
  | { kind: "replay"; receipt: StageArrivalReceiptDraftV1 }
  | { kind: "install"; expected: StageArrivalFactsV1;
      write: StageArrivalFixtureWriteV1;
      receipt: StageArrivalReceiptDraftV1; audit: StageArrivalFixtureAuditV1 };
export interface StageArrivalFixtureTransactionV1 {
  readonly current: StageArrivalSourceStateV1;
  readonly receipts: CommandReceiptPort;
  readonly audit: CommandAuditPort;
  readonly clock: Clock; // fresh sample while mutex owned, not browser/preview
}
export type StageArrivalCommandResultV1 =
  | { kind: "receipt"; receipt: StageArrivalReceiptDraftV1 }
  | { kind: "problem"; problem: StageArrivalProblemDraftV1 };
export interface StageArrivalUnitOfWorkPort {
  readonly dataSource: "isolated-fixture";
  // Implementation owns reservation, exact employee/day lock, coherent reread,
  // compare-check and single atomic install of existing-row fields + terminal
  // receipt + staged audit. decide is SYNCHRONOUS: never await UI/dialog or I/O
  // holding a transaction lock. No effect is installed on reject/replay.
  compareCheckAndCommit(binding: StageArrivalCommandBindingV1,
    decide: (transaction: StageArrivalFixtureTransactionV1) =>
      StageArrivalAtomicDecisionV1,
    signal?: AbortSignal): Promise<StageArrivalCommandResultV1>;
}
// Application passes its explicit signal through to UoW; optional for existing
// callers. Check BOTH explicit signal and ambient request-budget/ALS cancellation
// before ownership, after decide, and at the LAST synchronous pre-install check.
// Either cancelled before install -> no business/terminal receipt/audit install,
// release reservation/lock safely; proven pre-effect rejection has effect=none.
// No await between final check and atomic install. ALS alone is insufficient
// for direct-runtime callers. Cancellation after install does not undo effects
// or prove rollback; lost/unproved acknowledgment remains UNKNOWN.
// Under lock: reauthorize exact scope/owner; inspect receipt BEFORE new-effect
// token expiry. in-progress409; different payload409; retained identical receipt
// replayed=true/no write even if token expired. Else validate all bindings,
// confirmation and lifetime, reread original facts, sample fresh Clock, rerun
// pure rules. Any relevant change/threshold/minutes -> STALE_PREPARATION409.
// Clean confirmation MUST be null; late MUST exactly acknowledge displayed
// STAGE_ARRIVAL_LATE, never generic accept-future. Revalidate before installation.
// Canonical expected facts + field compare, not blind legacy validateUpdate.
// Only stage time/user/briefing and confirmed-late triplet may change. Never
// insert/overwrite/clear missing/reports/other actuals. Pre-install exception
// leaves all business/receipt/audit state unchanged (reservation not an effect).
// Receipt replay cannot be reconstructed from attendance equality.
// No command before explicit full-operation confirmation. Preview/warning/
// acknowledgment/cancel/back write ZERO business fields/receipts/audit; no
// hidden late-reason write or legacy validateUpdate/registerStage/addStageLate.
//
// Reserve at most one command per employee/day, bound tokens<=1000 and
// receipts<=1000; saturation503 before effects, no in-flight eviction. Terminal
// receipt retained15min from completion, tokens<=120s, no cross-process/restart
// durability/global exactly-once. Lost ack after installation => UNKNOWN to
// client, retained receipt does NOT authorize automatic replay/query.
//
// HTTP: B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/stage-arrival
// GET B/context ->200 Context; POST B/validations ->200 Validation (PURE);
// POST B/commands ->200 Receipt only AFTER fixture completion. Known routes
// wrong method405 INVALID_REQUEST + route-specific Allow. No extra endpoint,
// 202/status lookup, native DML/idempotency table/outbox/EMS/CTI/worker.
// No query, even bare '?'; GET no body. POST application/json UTF-8 only,
// no compression, <=8192 bytes, reject duplicate/unknown fields/headers and
// unsupported headers; header budget16KiB. JSON/problem+json, no-store/nosniff.
// Header compatibility exception: allow ONLY these three additional bounded
// browser metadata names (case-insensitive), ignored transport metadata:
// sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform. They confer no authentication,
// source/session/authorization or business input. Existing header byte/syntax/
// duplicate guards remain; no wildcard sec-ch-* or arbitrary-header allowance.
// Origin/CSRF/content-type/method/query/body guards remain unchanged.
// Context<=64KiB, validation/receipt/problem<=16KiB; bound before effect where
// possible. Total5000ms through serialization/abort/cleanup, no retry/poll/
// cache/stale/partial/late success. Loopback isolated use, exact origin allowlist,
// no wildcard credential CORS; cookie auth requires CSRF before use.
// Abort before effect ->none; after attempt cannot imply cancellation/rollback.
// No tokens/payload/IDs/names/SQL in logs or persistent browser business cache.
// UI keeps only volatile preparation; context/draft/source/session/generation
// changes and Back/Forward invalidate token/confirmation. Missing token after
// reload stays blocked, never a reconstructed ready state.
