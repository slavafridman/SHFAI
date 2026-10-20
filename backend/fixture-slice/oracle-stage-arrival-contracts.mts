// Canonical TYPE-ONLY §43 v0.1; approval/handoff recorded in §45.
// No adapter, parser, configuration loader, DB access or runtime enablement.
import type { LocalDateTime } from "./contracts.mts";
import type {
  StageArrivalCommitDraftV1,
  StageArrivalContextDraftV1,
  StageArrivalInstantV1,
  StageArrivalProblemDraftV1,
  StageArrivalReceiptDraftV1,
  StageArrivalValidationDraftV1,
} from "./stage-arrival-contracts.mts";

// Keep StageArrivalModeV1 fixture-only for existing consumers.
export type StageArrivalModeVNext =
  | "disabled" | "isolated-fixture" | "test-oracle-controlled";
export type NativeStageArrivalCapabilityV1 =
  "attendance-stage-arrival:test-oracle-write";

export type NativeStageArrivalContextV1 =
  Omit<StageArrivalContextDraftV1, "dataSource" | "lateReasonOptions"> & {
    dataSource: "oracle-test";
    lateReasonOptions: [];
  };
export type NativeStageArrivalValidationV1 =
  Omit<StageArrivalValidationDraftV1,
    "dataSource" | "state" | "warnings" | "confirmationRequired"> & {
    dataSource: "oracle-test";
    state: "ready";
    warnings: [];
    confirmationRequired: false;
  };
export type NativeStageArrivalCommitV1 =
  Omit<StageArrivalCommitDraftV1, "draft" | "confirmation"> & {
    draft: { lateReasonCode: null; lateRemark: null };
    confirmation: null;
    operationConfirmation: { accepted: true };
  };
export type NativeStageArrivalReceiptV1 =
  Omit<StageArrivalReceiptDraftV1,
    "outcome" | "dataSource" | "committedAt" | "replayed" | "recorded"> & {
    outcome: "oracle-test-committed";
    dataSource: "oracle-test";
    recorded: {
      stageArrivalLocal: LocalDateTime; briefing: false; stageLate: null;
    };
    commitAcknowledgedAt: StageArrivalInstantV1;
    readBackVerifiedAt: StageArrivalInstantV1;
    replayed: false;
    receiptPersistence: "none";
  };

// Same discriminated status/code/effect/nextAction cases as F1. Only native
// invalidParameters.name adds operationConfirmation; old problem stays intact.
type WithNativeInvalidParameters<T> = T extends unknown
  ? Omit<T, "invalidParameters"> & {
    invalidParameters?: Array<{
      name: NonNullable<
        StageArrivalProblemDraftV1["invalidParameters"]
      >[number]["name"] | "operationConfirmation";
      reason: "required" | "invalid-format" | "unsupported";
    }>;
  } : never;
export type NativeStageArrivalProblemV1 =
  WithNativeInvalidParameters<StageArrivalProblemDraftV1>;

// B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/stage-arrival.
// GET B/context -> NativeStageArrivalContextV1.
// POST B/validations -> NativeStageArrivalValidationV1, PURE null/null draft.
// POST B/commands -> NativeStageArrivalReceiptV1 only after COMMIT ACK AND
// separate authorized matching readback. Branch strict JSON grammar by mode;
// no unknown-key dropping, fixture parser reuse or extra status/retry endpoint.
// IdentityResponseV1.dataSource remains "oracle" (connection/read identity);
// native context/validation/receipt dataSource is "oracle-test". Existing
// oracle-read-only lists and "oracle" detail keep their approved markers.
//
// Native mode: existing seven reads + prepare + commit + test-oracle-write,
// in that order. Context/validate need prepare plus native admission; commit
// needs all three command rights. Central backend checks before ports and
// again under transaction ownership; synthetic principal employeeId stays null.
// No F2 capabilities, role bypass, real credential-auth claim or DB grant.
//
// Default OFF. Explicit SHF_TEST_ORACLE_STAGE_WRITE_ENABLED="true" requires
// test-oracle-controlled + oracle-read-only read source + isolated-test-demo
// + explicitly enabled synthetic auth, separate TEST write account and private
// exact-marker/record/window/allowance binding. Invalid/mixed/production modes
// fail before listen; no fixture/dev/Admin fallback. Secrets stay operator-only.
//
// Dedicated native UoW/account, never OracleReadSession mutation or memory UoW.
// Pure snapshot/token ends before review; shortest NOWAIT row lock only during
// command. Same-transaction reread, fresh configured Clock, complete original
// value predicates and external eligibility-context writer exclusion required.
// TODAY and start-60min<=now<=end AND now+actualPolicyMinutes<=start.
// Write existing row only: STAGE_ARRIVAL_TIME, server-principal-bound
// STAGE_ARRIVAL_USER, TADREECH=0; old stage NULL, briefing NULL/0; no INSERT,
// native late triplet, extra DB audit/receipt, functions, schema, CTI or EMS.
// rowsAffected 0 -> stale + proven rollback; 1 -> commit candidate;
// >1/undefined -> invariant failure + rollback, never success.
//
// Explicit AbortSignal AND ambient ALS/deadline guards at admission, after
// decision and final synchronous pre-DML/pre-COMMIT boundary, with no await
// between final guard and initiating the operation. Await native break/cleanup;
// no COMMIT initiated after cancellation. Post-send abort cannot undo COMMIT.
// Unproved attempted effect, COMMIT ACK loss or missing matching readback ->
// 503 COMMAND_OUTCOME_UNKNOWN/effect unknown/nextAction reconcile; no retry,
// synthetic replay, inferred success or receipt from row equality. Proven full
// rollback only permits rolled-back; none only before attempted effect.
// Native receipt has no committedAt/durable persistence/global exactly-once.
// External operator allowance consumed on one attempted command incl UNKNOWN;
// restart/new UUID cannot reopen it. Retained successful TEST change is allowed.
// Partner completion inherited as "not-invoked"; never a simulation receipt.
