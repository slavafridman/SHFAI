import { test } from "node:test";
import assert from "node:assert/strict";
import * as stationContracts from "../station-arrival-contracts.mts";
import type { CapabilityV1 } from "../contracts.mts";
import type {
  StageArrivalCommitDraftV1, StageArrivalReceiptDraftV1,
} from "../stage-arrival-contracts.mts";
import type {
  StationArrivalAtomicDecisionV1, StationArrivalCommandBindingV1,
  StationArrivalCommitV1, StationArrivalConfigurationV1,
  StationArrivalContextV1, StationArrivalDraftV1,
  StationArrivalFixtureEnvelopeV1, StationArrivalFixtureWriteV1,
  StationArrivalPreparationBindingV1, StationArrivalProblemV1,
  StationArrivalReceiptV1, StationArrivalUnitOfWorkPort,
} from "../station-arrival-contracts.mts";

// These are compiler assertions, not runtime validation or workflow evidence.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type ContractChecks = [
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival:${string}`>,
    "attendance-station-arrival:prepare" | "attendance-station-arrival:commit"
    | "attendance-station-arrival:test-oracle-write">>,
  Assert<Equal<Extract<CapabilityV1, "attendance-stage-arrival:test-oracle-write">,
    "attendance-stage-arrival:test-oracle-write">>,
  Assert<Equal<keyof StationArrivalDraftV1, "lateReasonCode">>,
  Assert<Equal<keyof StationArrivalContextV1,
    "employeeId" | "shiftDayId" | "orgUnitId" | "planned" | "recorded"
    | "serverTime" | "arrivalWindow" | "withinArrivalWindow" | "eligibility"
    | "blockers" | "lateReasonOptions" | "dataSource">>,
  Assert<Equal<StationArrivalReceiptV1["dataSource"], "isolated-fixture">>,
  Assert<Equal<StationArrivalReceiptV1["outcome"], "fixture-committed">>,
  Assert<Equal<StationArrivalReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<StationArrivalReceiptV1["recorded"]["stageArrivalLocal"], string | null>>,
  Assert<Equal<StationArrivalReceiptV1["recorded"]["stationExitLocal"], null>>,
  Assert<Equal<NonNullable<StationArrivalReceiptV1["recorded"]["stationLate"]>["remark"], null>>,
  Assert<Equal<NonNullable<StationArrivalCommitV1["confirmation"]>["warningCodes"],
    ["STATION_ARRIVAL_LATE"]>>,
  Assert<Equal<Assignable<StageArrivalCommitDraftV1, StationArrivalCommitV1>, false>>,
  Assert<Equal<Assignable<StageArrivalReceiptDraftV1, StationArrivalReceiptV1>, false>>,
  Assert<Equal<StationArrivalPreparationBindingV1["operation"], "station-arrival">>,
  Assert<Equal<StationArrivalCommandBindingV1["operation"], "station-arrival">>,
  Assert<Equal<keyof StationArrivalFixtureEnvelopeV1, "stageRows" | "stationFacts">>,
  Assert<Equal<keyof StationArrivalFixtureWriteV1,
    "attendanceKey" | "stationArrivalLocal" | "stationArrivalUser" | "stationLate">>,
  Assert<Equal<Extract<StationArrivalProblemV1, { effect: "unknown" }>["code"],
    "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<Extract<StationArrivalProblemV1, { effect: "unknown" }>["nextAction"],
    "reconcile">>,
  Assert<Equal<Extract<StationArrivalConfigurationV1,
    { attendanceStationArrivalMode: "isolated-fixture" }>["attendanceStageArrivalMode"],
    "isolated-fixture">>,
  Assert<Equal<Extract<StationArrivalConfigurationV1,
    { attendanceStationArrivalMode: "isolated-fixture" }>["deploymentClass"],
    "local-development" | "isolated-test-demo">>,
  Assert<Equal<Parameters<StationArrivalUnitOfWorkPort["compareCheckAndCommit"]>[2],
    AbortSignal | undefined>>,
  Assert<Equal<ReturnType<Parameters<
    StationArrivalUnitOfWorkPort["compareCheckAndCommit"]>[1]>,
    StationArrivalAtomicDecisionV1>>,
];
// Force the tuple to remain compiler-visible without exporting runtime values.
type AllChecksAreTrue = Assert<Equal<ContractChecks[number], true>>;

test("station arrival canonical contract module is type-only", () => {
  assert.deepEqual(Object.keys(stationContracts), []);
});
