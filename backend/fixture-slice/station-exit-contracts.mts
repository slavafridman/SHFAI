// Canonical TYPE-ONLY §47 v0.1.
// User approval 28Oct2026 11:08+02: "Agree and continue", contextually
// approving ordinary native station-exit APP/API/identity/UI/persistence.
// Implementation only: no runtime grants, adapters, public persistence ports
// or live execution authority. Early-manager/late/correction/cancel excluded.
import type { DecimalId, LocalDateTime, ShiftDayId } from "./contracts.mts";
import type { UnitCodeV1 } from "./current-shifts-contracts.mts";
import type {
  StageArrivalCommandIdV1, StageArrivalFingerprintV1,
  StageArrivalInstantV1, StageArrivalValidationTokenV1,
} from "./stage-arrival-contracts.mts";

// Native-only first slice; no fixture mode or fixture receipt widening.
export type StationExitModeV1 = "disabled" | "test-oracle-controlled";
export type StationExitBlockerV1 =
  | "ATTENDANCE_ROW_REQUIRED" | "STATION_ARRIVAL_REQUIRED"
  | "MISSING_PRESENT" | "REPORT_REVIEW_REQUIRED" | "UNSUPPORTED_DAY"
  | "EXISTING_LATE" | "FLAG_PRESENT" | "EMPLOYEE_LOCKED" | "OVERLAPPING_SHIFT";
export interface StationExitRecordedV1 {
  stageArrivalLocal: LocalDateTime | null;
  stationArrivalLocal: LocalDateTime | null;
  stationExitLocal: LocalDateTime | null;
  briefing: boolean | null;
}
export interface StationExitContextV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  orgUnitId: UnitCodeV1;
  planned: { startLocal: LocalDateTime; endLocal: LocalDateTime };
  recorded: StationExitRecordedV1;
  serverTime: {
    instant: StageArrivalInstantV1;
    local: LocalDateTime;
    businessTimeZone: string;
  };
  policy: { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number };
  exitWindow: {
    earliestInclusiveAt: StageArrivalInstantV1;
    latestInclusiveAt: StageArrivalInstantV1;
  };
  classification: "ordinary" | "early-manager-decision-deferred" | "outside-window";
  withinExitWindow: boolean;
  eligibility: "eligible" | "already-recorded" | "deferred";
  blockers: StationExitBlockerV1[];
  dataSource: "oracle-test";
}
export interface StationExitValidationV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  state: "ready";
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  expiresAt: StageArrivalInstantV1;
  businessTimeZone: string;
  fingerprint: StageArrivalFingerprintV1;
  validationToken: StageArrivalValidationTokenV1;
  warnings: [];
  confirmationRequired: false;
  dataSource: "oracle-test";
}
export interface StationExitCommitV1 {
  commandId: StageArrivalCommandIdV1;
  draft: {}; // Approved spelling; runtime MUST require EXACT empty object.
  validationToken: StageArrivalValidationTokenV1;
  fingerprint: StageArrivalFingerprintV1;
  operationConfirmation: { accepted: true };
}
export interface StationExitReceiptV1 {
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  outcome: "oracle-test-committed";
  recorded: StationExitRecordedV1 & {
    stationArrivalLocal: LocalDateTime;
    stationExitLocal: LocalDateTime;
  };
  commitAcknowledgedAt: StageArrivalInstantV1;
  readBackVerifiedAt: StageArrivalInstantV1;
  businessTimeZone: string;
  replayed: false;
  receiptPersistence: "none";
  partnerCompletion: "not-invoked";
  dataSource: "oracle-test";
}

// Independent §47 allowlist: same F2 envelope/status/effect semantics,
// WITHOUT late-warning CONFIRMATION_REQUIRED or arrival parameter names.
// Do not alias/widen a fixture/native-arrival problem to enable an exit.
export type StationExitProblemV1 = {
  type: string; // urn:shf:problem:<code>
  title: string; // stable sanitized text
  requestId: string;
  commandId: StageArrivalCommandIdV1 | null;
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "commandId" | "draft"
      | "validationToken" | "fingerprint" | "operationConfirmation" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
} & (
  | ((
    | { status: 400 | 405; code: "INVALID_REQUEST"; nextAction: "correct-and-validate" }
    | { status: 413; code: "REQUEST_TOO_LARGE"; nextAction: "correct-and-validate" }
    | { status: 415; code: "UNSUPPORTED_MEDIA_TYPE"; nextAction: "correct-and-validate" }
    | { status: 422; code: "BUSINESS_VALIDATION_FAILED"; nextAction: "correct-and-validate" }
    | { status: 401; code: "UNAUTHENTICATED"; nextAction: "stop" }
    | { status: 403; code: "FORBIDDEN" | "LIVE_WRITES_DISABLED"; nextAction: "stop" }
    | { status: 404; code: "SHIFT_DAY_NOT_FOUND"; nextAction: "stop" }
    | { status: 409; code: "STALE_PREPARATION"; nextAction: "prepare-again" }
    | { status: 409; code: "ALREADY_REGISTERED" | "COMMAND_SCOPE_DEFERRED"
        | "COMMAND_ID_CONFLICT" | "COMMAND_IN_PROGRESS"; nextAction: "stop" }
    | { status: 500; code: "AMBIGUOUS_ATTENDANCE" | "INVALID_SOURCE_DATA"
        | "INTERNAL_ERROR"; nextAction: "stop" }
    | { status: 503; code: "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT";
        nextAction: "stop" }
  ) & { effect: "none" | "rolled-back" })
  | { status: 503; code: "COMMAND_OUTCOME_UNKNOWN";
      effect: "unknown"; nextAction: "reconcile" }
);

// B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-exit.
// GET B/context: no query/body/token/lock/allowance; pure bounded reads.
// POST B/validations: exact {}; pure reads + ephemeral preparation only.
// POST B/commands: exact StationExitCommitV1, explicit whole-operation consent.
// Strict runtime validators reject unknown/duplicate keys, wrong-source and
// foreign-operation tokens. TS {} accepts extra/nonobject values and TS
// structural typing permits extra fields: neither is runtime authorization.
//
// Native-exit10 = ordered existing read7 + attendance-station-exit:prepare,
// attendance-station-exit:commit, attendance-station-exit:test-oracle-write.
// Context/validate need prepare+native right; command needs all three.
// Central backend checks before ports and under ownership; no role/UI bypass.
// Existing Principal/Identity/AuthenticationProvider signatures unchanged;
// synthetic employeeId=null, identity source oracle, command source oracle-test.
// Exit default OFF; both F1/F2 COMMAND modes disabled, never combined native
// writers. Old read/fixture/native grant arrays unchanged. Only isolated TEST,
// explicit mock/native config, separate writer/binding/Origin/allowance.
// Reject production/mock/native or malformed combinations before pool/listen.
// No auth-error Administrator fallback; real provider configured or fail.
//
// §47.2: require existing coherent station arrival, NOT stage prerequisite.
// Preserve coherent NULL stage and briefing NULL/0/1. Effective S/E from
// shift endpoints, site->G01 and actual system/default/unit policy provenance.
// Nonnegative integer B/A, no invented zero/default. Full actual Clock instant:
// EARLY iff t <= E-(B+1)*60000; ordinary strictly greater (whole-minute rule).
// Also S-60min<=t<=E+Amin, TODAY/operator bounds and arrival<=t; no backdating.
// Reject DST ambiguity/malformed facts; no early token/manager override.
// Persist civil seconds only AFTER full-instant classification; no F1 offset.
//
// Dedicated private exit snapshot/UoW, NOT stationBlockers/OnTime/Update or
// fixture ports. Complete originals, site/policy/membership/dependency reads,
// short NOWAIT ownership, full null-safe predicates and external eligibility
// writer exclusion are required; a hash/JSON revision is not a DB lock.
// SET ONLY STATION_EXIT_TIME and server-principal-bound STATION_EXIT_USER.
// Preserve ALL other attendance columns, incl stage/station/users/briefing,
// late/missing/flag/P2. No INSERT/upsert/functions/events/mood/sequence/DDL.
// rowsAffected0 -> stale with proven rollback;1 -> commit candidate only;
// >1/undefined -> invariant failure and rollback, never success.
// Explicit AbortSignal AND ambient ALS/deadline guards immediately pre-DML
// and pre-COMMIT, no await gap; await break/cleanup, discard unsafe leases.
// Receipt only after COMMIT ACK AND separate identity-checked matching readback
// of expected exit pair and EVERY preserved field. No exact commit timestamp,
// durable attribution/replay or partner completion. Unproved attempted effect,
// rollback/ACK/readback/transport outcome -> UNKNOWN/reconcile, never retry.
// Separate restart-surviving exit allowance and in-flight tuple/command checks;
// no reset/new UUID/reload escape. No cancel/reconcile/status endpoint.
// Reuse approved frozen alias/host all-address-set OS resolver proof, not a
// DNS-only dependency or weakened identity check. Actual grants/metadata/
// freeze/window/support/allowance and operational GO stay operator-owned.
