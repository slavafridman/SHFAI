// Canonical TYPE-ONLY v0.1 materialization of approved §§41–42.
// Approval: PROJECT_STATUS.md approval ledger, 2026-10-20 14:21;
// baseline §43 authority chronology supersedes historical proposal headings.
// No runtime grant, parser, business rule, store, HTTP or native adapter here.
import type {
  DecimalId, LocalDateTime, PrincipalV1, ShiftDayId,
} from "./contracts.mts";
import type { Clock, UnitCodeV1 } from "./current-shifts-contracts.mts";
import type {
  StageArrivalActorBindingV1, StageArrivalCommandIdV1,
  StageArrivalConfigurationV1, StageArrivalFactsV1, StageArrivalFingerprintV1,
  StageArrivalInstantV1, StageArrivalMinutesV1, StageArrivalSelectionV1,
  StageArrivalSourceBindingV1, StageArrivalValidationTokenV1,
} from "./stage-arrival-contracts.mts";

// Reuse F1 scalar grammars, NOT F1 eligibility or lateness-offset rules.
// All shown properties required; explicit nulls only. Runtime admission must
// reject unknown/duplicate keys, coercions and invalid/ambiguous source facts.
export type StationArrivalModeV1 = "disabled" | "isolated-fixture";
export interface StationArrivalDraftV1 {
  lateReasonCode: DecimalId | null;
}
export type StationArrivalBlockerV1 =
  | "ATTENDANCE_ROW_REQUIRED" | "MISSING_PRESENT" | "REPORT_REVIEW_REQUIRED"
  | "UNSUPPORTED_DAY" | "EXISTING_STATION_LATE" | "EXIT_PRESENT"
  | "FLAG_PRESENT" | "EMPLOYEE_LOCKED" | "FULL_DAY_EXCEPTION" | "OVERLAPPING_SHIFT";
export interface StationArrivalContextV1 {
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
  arrivalWindow: { earliestLocal: LocalDateTime; latestLocal: LocalDateTime };
  withinArrivalWindow: boolean;
  eligibility: "eligible" | "already-recorded" | "deferred";
  blockers: StationArrivalBlockerV1[];
  lateReasonOptions: Array<{ code: DecimalId; label: string | null }>;
  dataSource: "isolated-fixture";
}
export interface StationArrivalWarningV1 {
  code: "STATION_ARRIVAL_LATE";
  minutes: StageArrivalMinutesV1;
}
export interface StationArrivalValidationV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  state: "ready" | "warning-requires-confirmation";
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  expiresAt: StageArrivalInstantV1;
  businessTimeZone: string;
  fingerprint: StageArrivalFingerprintV1;
  validationToken: StageArrivalValidationTokenV1;
  warnings: StationArrivalWarningV1[];
  confirmationRequired: boolean;
  dataSource: "isolated-fixture";
}
export interface StationArrivalCommitV1 {
  commandId: StageArrivalCommandIdV1;
  draft: StationArrivalDraftV1;
  validationToken: StageArrivalValidationTokenV1;
  fingerprint: StageArrivalFingerprintV1;
  confirmation: null | {
    accepted: true;
    warningCodes: ["STATION_ARRIVAL_LATE"];
  };
}
export interface StationArrivalReceiptV1 {
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  outcome: "fixture-committed";
  recorded: {
    stageArrivalLocal: LocalDateTime | null;
    stationArrivalLocal: LocalDateTime;
    stationExitLocal: null;
    briefing: boolean | null;
    stationLate: null | {
      reasonCode: DecimalId; minutes: StageArrivalMinutesV1; remark: null;
    };
  };
  committedAt: StageArrivalInstantV1;
  businessTimeZone: string;
  replayed: boolean;
  partnerCompletion: "not-invoked";
  dataSource: "isolated-fixture";
}

// Independent F2 problem allowlist: no widening of read/F1/native problems.
export type StationArrivalProblemCaseV1 =
  | { status: 400 | 405; code: "INVALID_REQUEST"; nextAction: "correct-and-validate" }
  | { status: 413; code: "REQUEST_TOO_LARGE"; nextAction: "correct-and-validate" }
  | { status: 415; code: "UNSUPPORTED_MEDIA_TYPE"; nextAction: "correct-and-validate" }
  | { status: 422; code: "BUSINESS_VALIDATION_FAILED"; nextAction: "correct-and-validate" }
  | { status: 401; code: "UNAUTHENTICATED"; nextAction: "stop" }
  | { status: 403; code: "FORBIDDEN" | "LIVE_WRITES_DISABLED"; nextAction: "stop" }
  | { status: 404; code: "SHIFT_DAY_NOT_FOUND"; nextAction: "stop" }
  | { status: 409; code: "STALE_PREPARATION" | "CONFIRMATION_REQUIRED";
      nextAction: "prepare-again" }
  | { status: 409; code: "ALREADY_REGISTERED" | "COMMAND_SCOPE_DEFERRED"
      | "COMMAND_ID_CONFLICT" | "COMMAND_IN_PROGRESS"; nextAction: "stop" }
  | { status: 500; code: "AMBIGUOUS_ATTENDANCE" | "INVALID_SOURCE_DATA"
      | "INTERNAL_ERROR"; nextAction: "stop" }
  | { status: 503; code: "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT";
      nextAction: "stop" };
export type StationArrivalProblemV1 = {
  type: string; // urn:shf:problem:<code>
  title: string; // stable sanitized text
  requestId: string;
  commandId: StageArrivalCommandIdV1 | null;
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "lateReasonCode" | "commandId"
      | "draft" | "validationToken" | "fingerprint" | "confirmation" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
} & (
  | (StationArrivalProblemCaseV1 & { effect: "none" | "rolled-back" })
  | { status: 503; code: "COMMAND_OUTCOME_UNKNOWN";
      effect: "unknown"; nextAction: "reconcile" }
);
// none: proven pre-install rejection; rolled-back: proven complete rollback.
// Attempted effect with unproved outcome/ack is UNKNOWN, never timeout/none.

// Consumer construction only; existing StartupConfig and identity DTO unchanged.
export type StationArrivalConfigurationV1 =
  | { attendanceStationArrivalMode?: "disabled" }
  | (Extract<StageArrivalConfigurationV1,
      { attendanceStageArrivalMode: "isolated-fixture" }> & {
      attendanceStationArrivalMode: "isolated-fixture";
    });
// Combined fixture mode requires explicit F1+F2 opt-in, local/isolated mock,
// coherent shared readers/store/Clock. R=7, F1=9, native F1=10 unchanged;
// joint fixture=11 (R + F1 pair + F2 pair), NEVER native-write capability.
// Reject production/mock, Oracle/native/mixed adapters, F2 without F1,
// malformed configuration before listener/pool/import. No fallback/admin on
// auth error. Outside mock require installed real provider or explicit failure.
// Known disabled routes:403 LIVE_WRITES_DISABLED before context/UoW access.
export interface StationArrivalAccessPolicy {
  requirePrepare(principal: PrincipalV1): void;
  requireCommit(principal: PrincipalV1): void; // BOTH F2 rights
  authorizedTeamIds(principal: PrincipalV1): UnitCodeV1[];
}
// Validate identity/grammar/rights and copy <=100 exact J01 grants before ports.
// Reauthorize on every operation; no role/self/parent/prefix grant. Selected
// worker != synthetic actor (employeeId=null). Missing/private pair -> same404.

// Exact approved combined startup envelope and per-row extra facts (§41.3).
// Arrays cover SAME unique tuples, <=1000; reject unmatched/duplicate keys.
export interface StationArrivalFixtureExtraV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  revision: string;
  stationArrivalUser: string | null;
  stationExitUser: string | null;
  stationLate: StationArrivalReceiptV1["recorded"]["stationLate"];
  flagPresent: boolean;
  locked: boolean;
  fullDayExceptionPresent: boolean;
  overlappingShiftPresent: boolean;
  policyRevision: string;
}
export interface StationArrivalFixtureEnvelopeV1 {
  stageRows: StageArrivalFactsV1[];
  stationFacts: StationArrivalFixtureExtraV1[];
}
// INTERNAL coherent aggregate only, not another store or public context field.
// Both projections come from ONE owned snapshot; compare base AND extra facts,
// not revision alone. Either operation advances shared relevant row revision.
export interface StationArrivalFactsV1 {
  base: StageArrivalFactsV1;
  extra: StationArrivalFixtureExtraV1;
}
export type StationArrivalSourceStateV1 =
  | { kind: "not-found" }
  | { kind: "ambiguous" }
  | { kind: "one"; facts: StationArrivalFactsV1 };
export interface StationArrivalContextPort {
  readonly dataSource: "isolated-fixture";
  read(selection: StageArrivalSelectionV1,
    authorizedTeamIds: readonly UnitCodeV1[]): Promise<StationArrivalSourceStateV1>;
}
export interface StationArrivalPreparationBindingV1 {
  operation: "station-arrival";
  source: StageArrivalSourceBindingV1;
  actor: StageArrivalActorBindingV1;
  facts: StationArrivalFactsV1;
  draft: StationArrivalDraftV1;
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  businessTimeZone: string;
  warnings: readonly StationArrivalWarningV1[];
  confirmationRequired: boolean;
  fingerprint: StageArrivalFingerprintV1;
  expiresAt: StageArrivalInstantV1;
  nextWarningOrMinuteTransitionAt: StageArrivalInstantV1 | null;
}
export interface StationArrivalValidationTokenPort {
  issue(binding: StationArrivalPreparationBindingV1): StageArrivalValidationTokenV1;
  find(token: StageArrivalValidationTokenV1): StationArrivalPreparationBindingV1 | null;
}
// Ephemeral allocation only. Operation-tagged full server binding includes
// exact actor/grants/auth epoch, source/session, full base+extra originals,
// policy/catalog/zone/draft/warning/minutes. No new auth-epoch wire field.
// randomBytes(32) base64url43; SHA256 lowercase64. F1 tokens cannot authorize F2.
// Expiry=min(evaluated+120s,next warning/minute transition,window-end+1ms).
// Reject at/after expiry. Same code with changed minutes requires new ACK.

export interface StationArrivalCommandBindingV1 {
  operation: "station-arrival";
  source: StageArrivalSourceBindingV1;
  actor: StageArrivalActorBindingV1;
  selection: StageArrivalSelectionV1;
  command: StationArrivalCommitV1;
}
export type StationArrivalReceiptStateV1 =
  | { kind: "new" } | { kind: "in-progress" } | { kind: "conflict" }
  | { kind: "completed"; receipt: StationArrivalReceiptV1 };
export interface StationArrivalCommandReceiptPort {
  inspect(binding: StationArrivalCommandBindingV1): StationArrivalReceiptStateV1;
}
export interface StationArrivalFixtureAuditV1 {
  operation: "station-arrival";
  subject: string;
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  outcome: "fixture-committed";
}
export interface StationArrivalCommandAuditPort {
  // Pure staging; NEVER a separately committed or asynchronous audit.
  stage(binding: StationArrivalCommandBindingV1): StationArrivalFixtureAuditV1;
}
export interface StationArrivalFixtureWriteV1 {
  attendanceKey: { shiftDayId: ShiftDayId };
  stationArrivalLocal: LocalDateTime;
  stationArrivalUser: string; // trusted synthetic actor stamp
  stationLate: StationArrivalReceiptV1["recorded"]["stationLate"];
}
export type StationArrivalAtomicDecisionV1 =
  | { kind: "reject"; problem: StationArrivalProblemV1 }
  | { kind: "replay"; receipt: StationArrivalReceiptV1 }
  | { kind: "install"; expected: StationArrivalFactsV1;
      write: StationArrivalFixtureWriteV1;
      receipt: StationArrivalReceiptV1; audit: StationArrivalFixtureAuditV1 };
export interface StationArrivalFixtureTransactionV1 {
  readonly current: StationArrivalSourceStateV1;
  readonly receipts: StationArrivalCommandReceiptPort;
  readonly audit: StationArrivalCommandAuditPort;
  readonly clock: Clock;
}
export type StationArrivalCommandResultV1 =
  | { kind: "receipt"; receipt: StationArrivalReceiptV1 }
  | { kind: "problem"; problem: StationArrivalProblemV1 };
export interface StationArrivalUnitOfWorkPort {
  readonly dataSource: "isolated-fixture";
  compareCheckAndCommit(binding: StationArrivalCommandBindingV1,
    decide: (transaction: StationArrivalFixtureTransactionV1) =>
      StationArrivalAtomicDecisionV1,
    signal?: AbortSignal): Promise<StationArrivalCommandResultV1>;
}
// Backend ownership transition: extend PRIVATE MemoryStageArrivalStore snapshot,
// terminal tags, reservations and installation; leave F1 exported ports intact.
// F1/F2 must share tuple mutex, Clock and snapshot; no copied independent stores.
// Under ownership reauthorize; inspect scoped operation-tagged receipt BEFORE
// token expiry/new-effect eligibility. Exact retained payload replays without
// write; different payload409 conflict; active resource409 in-progress.
// Key includes source/session/server instance + subject + tuple + operation + UUID.
// New UUID on recorded station is409 already, never replay inferred from state.
// Recheck full originals, current identity, lifetime, fresh Clock, window,
// draft/confirmation/warning/minutes before conditional installation.
// Explicit signal AND ambient ALS/deadline: check before ownership, after decide/
// staging and LAST synchronous pre-install boundary, NO await before assignment.
// Cancellation before install ->0/0/0; after install cannot promise rollback.
// Atomically install station fields+F2 terminal+memory audit only; preserve ALL
// stage/late/briefing/exit/missing/report facts and F1 receipts. No INSERT/upsert.
// Shared rows/reservations/tokens/retained receipt+audit pairs each <=1000
// combined; saturation503 before effects, no in-flight eviction. Terminals and
// audits expire together after15min. No restart/durable/global exactly-once.
//
// Pure policy: null stage OR valid stage<=new station admissible. Existing F1
// stage-late/briefing preserved. Require existing attendance, explicit valid
// dependencies and plan. Window [start-60min,end] inclusive. Late iff now>start,
// offset0; floor minutes can be0. Resolve civil times uniquely in configured
// business zone; invalid/ambiguous Clock/DST/originals fail, never repair.
// Validation/review/ACK/cancel/back ->ZERO business/terminal/audit changes.
// Whole-operation explicit confirmation even on-time; clean confirmation=null,
// late exact STATION_ARRIVAL_LATE singleton. No hidden reason write.
//
// HTTP B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-arrival:
// GET B/context; POST B/validations (draft); POST B/commands (commit); all200.
// No query (even '?'), GET body, operation lookup/reset/retry endpoint or202.
// POST UTF-8 JSON, no compression, <=8192 bytes; strict duplicate/unknown keys.
// Headers16KiB, existing three sec-ch hints only; context64KiB, other bodies16KiB,
// total5000ms including serialization; no-store/nosniff. §41.4 exact errors above.
// Combined input SHF_STATION_ARRIVAL_FIXTURE replaces SHF_STAGE_ARRIVAL_FIXTURE;
// reject both/independent read fixtures. Own SHF_STATION_ARRIVAL_ORIGINS array
// <=10 exact normalized loopback origins, JSON<=4096 bytes, entry<=128 chars.
// Wire actual entrypoint→server→handler; no Host inference/wildcards. Missing
// allowlist=[]; missing Origin allowed for direct non-cookie local calls.
//
// UI owns volatile operation/tuple/source/session/generation safety namespaces.
// F1 UNKNOWN blocks dependent F2; F2 UNKNOWN blocks F2 and dependent F1.
// Malformed/wrong-source/lost/stale-generation command success remains UNKNOWN;
// no automatic replay/poll/undo. Reload without active journey stops, never
// reconstructs a command. No new identity/session wire field or browser token
// persistence. Hebrew/RTL/Material3/focus/history acceptance stays §§42/F2UI01–12.
