import { test } from "node:test";
import assert from "node:assert/strict";
import * as nativeContracts from "../oracle-station-arrival-contracts.mts";
import type { CapabilityV1, PrincipalV1 } from "../contracts.mts";
import type {
  NativeStationArrivalCapabilityV1, NativeStationArrivalCommitV1,
  NativeStationArrivalContextV1, NativeStationArrivalProblemV1,
  NativeStationArrivalReceiptV1, NativeStationArrivalValidationV1,
  StationArrivalModeVNext,
} from "../oracle-station-arrival-contracts.mts";
import type {
  StationArrivalCommitV1, StationArrivalContextV1, StationArrivalModeV1,
  StationArrivalProblemV1, StationArrivalReceiptV1,
  StationArrivalUnitOfWorkPort,
} from "../station-arrival-contracts.mts";
import type {
  NativeStageArrivalCapabilityV1, NativeStageArrivalCommitV1,
} from "../oracle-stage-arrival-contracts.mts";

// Compiler assertions only, not runtime validation or native workflow evidence.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type WithoutInvalidParameters<T> =
  T extends unknown ? Omit<T, "invalidParameters"> : never;
type InvalidName<T extends { invalidParameters?: Array<{ name: string }> }> =
  NonNullable<T["invalidParameters"]>[number]["name"];
type ContractChecks = [
  Assert<Equal<NativeStationArrivalCapabilityV1,
    "attendance-station-arrival:test-oracle-write">>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival:${string}`>,
    "attendance-station-arrival:prepare" | "attendance-station-arrival:commit"
    | NativeStationArrivalCapabilityV1>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-stage-arrival:${string}`>,
    "attendance-stage-arrival:prepare" | "attendance-stage-arrival:commit"
    | NativeStageArrivalCapabilityV1>>,
  Assert<Equal<Exclude<CapabilityV1, `attendance-${string}`>,
    "shift-day:read" | "current-shifts:read" | "shift-search:read"
    | "my-shifts:read" | "shift-items:read" | "employee:read" | "attendance:read">>,
  Assert<Equal<Extract<CapabilityV1, "attendance:read">, "attendance:read">>,
  Assert<Equal<StationArrivalModeVNext,
    "disabled" | "isolated-fixture" | "test-oracle-controlled">>,
  Assert<Equal<StationArrivalModeV1, "disabled" | "isolated-fixture">>,
  Assert<Equal<PrincipalV1["employeeId"], string | null>>,
  Assert<Equal<keyof NativeStationArrivalContextV1, keyof StationArrivalContextV1>>,
  Assert<Equal<NativeStationArrivalContextV1["dataSource"], "oracle-test">>,
  Assert<Equal<NativeStationArrivalContextV1["lateReasonOptions"], []>>,
  Assert<Equal<NativeStationArrivalContextV1["recorded"]["stageArrivalLocal"], string | null>>,
  Assert<Equal<NativeStationArrivalValidationV1["state"], "ready">>,
  Assert<Equal<NativeStationArrivalValidationV1["warnings"], []>>,
  Assert<Equal<NativeStationArrivalValidationV1["confirmationRequired"], false>>,
  Assert<Equal<NativeStationArrivalValidationV1["dataSource"], "oracle-test">>,
  Assert<Equal<keyof NativeStationArrivalCommitV1,
    keyof StationArrivalCommitV1 | "operationConfirmation">>,
  Assert<Equal<NativeStationArrivalCommitV1["draft"], { lateReasonCode: null }>>,
  Assert<Equal<NativeStationArrivalCommitV1["confirmation"], null>>,
  Assert<Equal<NativeStationArrivalCommitV1["operationConfirmation"], { accepted: true }>>,
  Assert<Equal<Assignable<StationArrivalCommitV1, NativeStationArrivalCommitV1>, false>>,
  Assert<Equal<Assignable<NativeStationArrivalCommitV1, NativeStageArrivalCommitV1>, false>>,
  Assert<Equal<NativeStationArrivalReceiptV1["dataSource"], "oracle-test">>,
  Assert<Equal<NativeStationArrivalReceiptV1["outcome"], "oracle-test-committed">>,
  Assert<Equal<NativeStationArrivalReceiptV1["recorded"], {
    stageArrivalLocal: string | null; stationArrivalLocal: string;
    stationExitLocal: null; briefing: boolean | null; stationLate: null;
  }>>,
  Assert<Equal<NativeStationArrivalReceiptV1["replayed"], false>>,
  Assert<Equal<NativeStationArrivalReceiptV1["receiptPersistence"], "none">>,
  Assert<Equal<NativeStationArrivalReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<Extract<keyof NativeStationArrivalReceiptV1, "committedAt">, never>>,
  Assert<Equal<keyof NativeStationArrivalReceiptV1,
    Exclude<keyof StationArrivalReceiptV1, "committedAt">
    | "commitAcknowledgedAt" | "readBackVerifiedAt" | "receiptPersistence">>,
  Assert<Equal<Assignable<StationArrivalReceiptV1, NativeStationArrivalReceiptV1>, false>>,
  Assert<Equal<Assignable<NativeStationArrivalReceiptV1, StationArrivalReceiptV1>, false>>,
  Assert<Equal<WithoutInvalidParameters<NativeStationArrivalProblemV1>,
    WithoutInvalidParameters<StationArrivalProblemV1>>>,
  Assert<Equal<InvalidName<NativeStationArrivalProblemV1>,
    InvalidName<StationArrivalProblemV1> | "operationConfirmation">>,
  Assert<Equal<Extract<NativeStationArrivalProblemV1, { effect: "unknown" }>["code"],
    "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<Extract<NativeStationArrivalProblemV1, { effect: "unknown" }>["nextAction"],
    "reconcile">>,
  Assert<Equal<Extract<NativeStationArrivalProblemV1, { code: "COMMAND_OUTCOME_UNKNOWN" }>["effect"],
    "unknown">>,
  Assert<Equal<StationArrivalReceiptV1["outcome"], "fixture-committed">>,
  Assert<Equal<StationArrivalUnitOfWorkPort["dataSource"], "isolated-fixture">>,
  Assert<Equal<Parameters<StationArrivalUnitOfWorkPort["compareCheckAndCommit"]>[2],
    AbortSignal | undefined>>,
];
type AllChecksAreTrue = Assert<Equal<ContractChecks[number], true>>;

test("native station canonical module is type-only and has no runtime grants or ports", () => {
  assert.deepEqual(Object.keys(nativeContracts), []);
});
