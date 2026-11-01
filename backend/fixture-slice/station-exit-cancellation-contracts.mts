// Canonical TYPE-ONLY §52-v0.2 / C52-v0.2.
// Explicit user approval 2026-11-01 13:56+02; recorded in design §52.8.
// No parser, runtime grant, HTTP handler, persistence or environment readiness.
import type { DecimalId, LocalDateTime, ShiftDayId } from "./contracts.mts";
import type { UnitCodeV1 } from "./current-shifts-contracts.mts";
import type {
  StageArrivalCommandIdV1, StageArrivalFingerprintV1,
  StageArrivalInstantV1, StageArrivalValidationTokenV1,
} from "./stage-arrival-contracts.mts";
import type { StationExitBlockerV1 } from "./station-exit-contracts.mts";

export type CancellationCapabilityV1 =
  | "attendance-station-exit-cancellation:prepare"
  | "attendance-station-exit-cancellation:commit"
  | "attendance-station-exit-cancellation:test-oracle-write";
export type CancellationModeV1 =
  | "disabled" | "isolated-fixture" | "test-oracle-controlled";
export type CancellationDraftV1 = {}; // Runtime requires EXACT empty object.
export type CancellationBlockerV1 = StationExitBlockerV1
  | "ORDINARY_EXIT_REQUIRED" | "PARTNER_REVIEW_REQUIRED"
  | "OUTSIDE_CANCELLATION_WINDOW";
export type CancellationRecordedV1 = {
  stageArrivalLocal: LocalDateTime | null;
  stationArrivalLocal: LocalDateTime | null;
  stationExitLocal: LocalDateTime | null;
  briefing: boolean | null;
};
export type CancellationContextV1 = {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  orgUnitId: UnitCodeV1;
  planned: { startLocal: LocalDateTime; endLocal: LocalDateTime };
  recorded: CancellationRecordedV1;
  serverTime: {
    instant: StageArrivalInstantV1; local: LocalDateTime; businessTimeZone: string;
  };
  policy: { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number };
  mode: "isolated-fixture" | "test-oracle-controlled";
  dataSource: "isolated-fixture" | "oracle-test";
  eligibility: "eligible" | "not-recorded" | "deferred";
  blockers: CancellationBlockerV1[];
};
export type CancellationValidationV1 = {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  state: "ready";
  evaluatedAt: StageArrivalInstantV1;
  evaluatedLocal: LocalDateTime;
  expiresAt: StageArrivalInstantV1;
  businessTimeZone: string;
  validationToken: StageArrivalValidationTokenV1;
  fingerprint: StageArrivalFingerprintV1;
  originalExitLocal: LocalDateTime;
  warnings: ["RECORDED_EXIT_WILL_BE_CLEARED"]; // STRING tuple, not warning objects.
  confirmationRequired: true;
  dataSource: "isolated-fixture" | "oracle-test";
};
export type CancellationCommandV1 = {
  commandId: StageArrivalCommandIdV1;
  draft: CancellationDraftV1;
  validationToken: StageArrivalValidationTokenV1;
  fingerprint: StageArrivalFingerprintV1;
  warningConfirmation: { accepted: true; code: "RECORDED_EXIT_WILL_BE_CLEARED" };
  operationConfirmation: { accepted: true };
};
export type CancellationReceiptV1 = {
  commandId: StageArrivalCommandIdV1;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  originalExitLocal: LocalDateTime;
  recorded: CancellationRecordedV1 & {
    stationArrivalLocal: LocalDateTime; stationExitLocal: null;
  };
  businessTimeZone: string;
  replayed: false;
  receiptPersistence: "none";
  partnerCompletion: "not-invoked";
} & (
  | { outcome: "oracle-test-committed"; dataSource: "oracle-test";
      commitAcknowledgedAt: StageArrivalInstantV1;
      readBackVerifiedAt: StageArrivalInstantV1 }
  | { outcome: "simulated"; dataSource: "isolated-fixture";
      commitAcknowledgedAt: null; readBackVerifiedAt: null }
);
export type CancellationProblemV1 = {
  type: string;
  title: string;
  requestId: string;
  commandId: StageArrivalCommandIdV1 | null;
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "commandId" | "draft"
      | "validationToken" | "fingerprint" | "warningConfirmation"
      | "operationConfirmation" | "query" | "body";
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
    | { status: 409; code: "CONFIRMATION_REQUIRED"; nextAction: "correct-and-validate" }
    | { status: 409; code: "EXIT_NOT_RECORDED"; nextAction: "stop" }
    | { status: 409; code: "COMMAND_SCOPE_DEFERRED"
        | "COMMAND_ID_CONFLICT" | "COMMAND_IN_PROGRESS"; nextAction: "stop" }
    | { status: 500; code: "AMBIGUOUS_ATTENDANCE" | "INVALID_SOURCE_DATA"
        | "INTERNAL_ERROR"; nextAction: "stop" }
    | { status: 503; code: "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT";
        nextAction: "stop" }
  ) & { effect: "none" | "rolled-back" })
  | { status: 503; code: "COMMAND_OUTCOME_UNKNOWN";
      effect: "unknown"; nextAction: "reconcile" }
);

// B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-exit-cancellation
// GET B/context no body/query; POST B/validations exact {}; POST B/commands
// exact CancellationCommandV1. JSON16KiB/depth8, budget5s, no-store, §47 guards.
// DecimalId positive1–38 digits; ShiftDayId positive1–10; civil Gregorian
// YYYY-MM-DDTHH:mm:ss, years0001–9999; UTC instant exactly .sssZ roundtrip.
// Token43 base64url, fingerprint64 lowercase hex, lowercase RFC4122 UUIDv4.
// Reject unknown/duplicate keys/coercion; TS {} is NOT runtime validation.
// invalidParameters<=10, exact sanitized name/reason pairs, never raw values.
// Mode/source must match (context intentionally retains approved exact shape).
// TTL<=30s, shortened at midnight/operator/upper boundary; bind full originals,
// actor/resource/source/draft/policy/dependencies/config identity/both consents.
// Revalidate server time/full instants under ownership; original ordinary iff
// exit>E-(B+1)*60000 and S-60min<=exit<=E+Amin, arrival<=exit<=now.
// now within [S-60min,E+Amin] and operator [from,to), today/simple same day;
// ambiguous stored seconds/DST/borderline truncation defer, no guessed policy.
// Missing/late/report/flag/locked/overlap/dependencies/partner unknown defer.
// Stage pair coherently null allowed; preserve briefing null/0/1, neutral P2.
// Fixture read7+prepare/commit; native read7+cancellation3, no old grant edits.
// Backend capabilities+exact unit scope before ports/under ownership; no
// employee self/role/UI bypass, synthetic employeeId=null, no infrastructure grant.
// Default OFF; explicit isolated mock only, production rejection, real provider
// otherwise configured or fail; no Administrator fallback after auth errors.
// No retry/reset/status/poll/PATCH/DELETE/upsert/new audit/outbox/partner API.
// Native receipt requires ACK+independent complete preservation readback of BOTH
// cleared private fields; ambiguous result UNKNOWN, permanent attempt quarantine.
// Simulated receipt never establishes native or actual partner completion.
