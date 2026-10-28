// Canonical TYPE-ONLY §46 v0.1.
// User approval 28Oct2026 09:00+02: "Одобряю §46.1-bootstrap и §46 native F2".
// Implementation approval only; operational GO and all private gates separate.
// No adapter, parser, grant, config loader, connection or runtime enablement.
import type { LocalDateTime } from "./contracts.mts";
import type { StageArrivalInstantV1 } from "./stage-arrival-contracts.mts";
import type {
  StationArrivalCommitV1,
  StationArrivalContextV1,
  StationArrivalProblemV1,
  StationArrivalReceiptV1,
  StationArrivalValidationV1,
} from "./station-arrival-contracts.mts";

// Keep existing fixture mode/configuration/ports unchanged.
export type StationArrivalModeVNext =
  | "disabled" | "isolated-fixture" | "test-oracle-controlled";
export type NativeStationArrivalCapabilityV1 =
  "attendance-station-arrival:test-oracle-write";

export type NativeStationArrivalContextV1 =
  Omit<StationArrivalContextV1, "dataSource" | "lateReasonOptions"> & {
    dataSource: "oracle-test";
    lateReasonOptions: [];
  };
export type NativeStationArrivalValidationV1 =
  Omit<StationArrivalValidationV1,
    "dataSource" | "state" | "warnings" | "confirmationRequired"> & {
    dataSource: "oracle-test";
    state: "ready";
    warnings: [];
    confirmationRequired: false;
  };
export type NativeStationArrivalCommitV1 =
  Omit<StationArrivalCommitV1, "draft" | "confirmation"> & {
    draft: { lateReasonCode: null };
    confirmation: null;
    operationConfirmation: { accepted: true };
  };
export type NativeStationArrivalReceiptV1 =
  Omit<StationArrivalReceiptV1,
    "dataSource" | "outcome" | "recorded" | "committedAt" | "replayed"> & {
    dataSource: "oracle-test";
    outcome: "oracle-test-committed";
    recorded: {
      stageArrivalLocal: LocalDateTime | null;
      stationArrivalLocal: LocalDateTime;
      stationExitLocal: null;
      briefing: boolean | null;
      stationLate: null;
    };
    commitAcknowledgedAt: StageArrivalInstantV1;
    readBackVerifiedAt: StageArrivalInstantV1;
    replayed: false;
    receiptPersistence: "none";
  };

// Distribute over the existing discriminated problem union; preserve every
// status/code/effect/nextAction case. Only the invalid-parameter name changes.
type WithNativeInvalidParameters<T> = T extends unknown
  ? Omit<T, "invalidParameters"> & {
    invalidParameters?: Array<{
      name: NonNullable<
        StationArrivalProblemV1["invalidParameters"]
      >[number]["name"] | "operationConfirmation";
      reason: "required" | "invalid-format" | "unsupported";
    }>;
  } : never;
export type NativeStationArrivalProblemV1 =
  WithNativeInvalidParameters<StationArrivalProblemV1>;

// B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-arrival.
// GET B/context -> NativeStationArrivalContextV1 (no token allocation).
// POST B/validations -> NativeStationArrivalValidationV1; exact null-reason
// draft, PURE except ephemeral preparation; no allowance consumption.
// POST B/commands -> NativeStationArrivalReceiptV1 only after COMMIT ACK AND
// separate identity-checked matching readback of station + preserved fields.
// Native operationConfirmation is whole-operation consent; confirmation=null
// means no late-warning ACK. Branch strict grammar by explicit mode, reject
// unknown/duplicate keys; never drop fields or use fixture success validators.
//
// Native-station10 = ordered R7 + station prepare + station commit + station
// test-oracle-write. Context/validate require prepare AND native right; commit
// requires all three centrally before ports and under transaction ownership.
// F1 command mode DISABLED; no combined native writers. Existing read7,
// fixture-stage9, native-stage10 and joint-fixture11 remain unchanged.
// Identity/provider/principal DTOs unchanged; synthetic employeeId=null;
// identity source "oracle", command DTOs "oracle-test", inquiries unchanged.
//
// Default OFF. Explicit SHF_TEST_ORACLE_STATION_WRITE_ENABLED="true" requires
// controlled native mode + oracle-read-only inquiries + isolated-test-demo +
// explicit synthetic auth + separate TEST writer/private tuple/window/target/
// allowance binding + station Origin allowlist. Reject malformed, mixed,
// production/mock/native or missing gates BEFORE pool/listener creation.
// No auth-error Administrator fallback; outside approved mock, installed real
// provider or explicit failure. Application rights grant no DB/broker access.
//
// Dedicated backend-private native station snapshot/UoW, NOT the fixture
// StationArrivalUnitOfWorkPort, F1 native blockers/UPDATE or memory receipts.
// Do not add a shared native port by guessing a shape absent from §46.
// Snapshot must include complete attendance originals, SHF_LOCKED, effective
// employee/day/overlay/org, reports, both per-day exception relations and
// bounded complete overlapping-day candidates. Fixture booleans and F1
// NativeSnapshot alone cannot supply this evidence. Apply §46.3 exact rules.
//
// On-time only: TODAY, start-60min<=fresh now<=min(start,end), station offset0,
// never F1 configuredMinutes. Full instant check: start+1ms is unsupported.
// Null or coherent pre-existing stage admitted, stage<=new station; preserve
// briefing NULL/0/1. This subset defers stage-late/exception/dependent cases.
// No token for unsupported native state; invalid/ambiguous evidence fails.
//
// Existing synthetic attendance row only. Short command NOWAIT row lock,
// same-transaction reread, full null-safe originals/dependency predicates and
// externally certified eligibility-context writer exclusion remain required.
// SET ONLY STATION_ARRIVAL_TIME and server-principal-bound STATION_ARRIVAL_USER.
// Preserve EVERY other column incl stage/user, briefing, late, exit and P2.
// No INSERT/upsert/functions, audit/receipt tables, schema, CTI, EMS or batch.
// rowsAffected0 -> stale with proven rollback;1 -> commit candidate only;
// >1/undefined -> invariant failure + rollback, never success.
//
// Backend-private application->UoW must propagate optional explicit AbortSignal
// AND ambient ALS/deadline. Check admission, decision and final synchronous
// pre-DML/pre-COMMIT boundary, NO await gap before initiating the operation.
// Await native break/cleanup, drop unsafe lease, never initiate COMMIT after
// known cancellation; post-send abort cannot undo commit.
// Unproved attempted effect/COMMIT ACK/readback -> UNKNOWN/reconcile, never
// replay, inferred success, fixture receipt or unproved rollback/none.
// Native receipt is nonpersistent, not durable attribution/exact commit time.
// External operation-bound single-attempt allowance survives restart/new UUID;
// distinct from F1 allowance, no API reset/auto-replay/compensating cancel.
// Partner completion inherited as "not-invoked". Host-bootstrap approval does
// not bypass frozen target proof, metadata, scope, freeze or operational GO.
