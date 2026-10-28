import { test } from "node:test";
import assert from "node:assert/strict";
import * as exitContracts from "../station-exit-contracts.mts";
import type {
  AuthenticationProvider, AuthenticationRequest, CapabilityV1, IdentityResponseV1,
  PrincipalV1,
} from "../contracts.mts";
import type {
  StationExitBlockerV1, StationExitCommitV1, StationExitContextV1,
  StationExitModeV1, StationExitProblemV1, StationExitReceiptV1,
  StationExitRecordedV1, StationExitValidationV1,
} from "../station-exit-contracts.mts";
import type {
  StationArrivalModeV1, StationArrivalProblemV1, StationArrivalReceiptV1,
  StationArrivalUnitOfWorkPort,
} from "../station-arrival-contracts.mts";
import type {
  NativeStationArrivalReceiptV1, StationArrivalModeVNext,
} from "../oracle-station-arrival-contracts.mts";

// Compiler assertions only, not runtime parsing, grants, SQL or workflow proof.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type Read7 = "shift-day:read" | "current-shifts:read" | "shift-search:read"
  | "my-shifts:read" | "shift-items:read" | "employee:read" | "attendance:read";
type ArrivalRights =
  | "attendance-stage-arrival:prepare" | "attendance-stage-arrival:commit"
  | "attendance-stage-arrival:test-oracle-write"
  | "attendance-station-arrival:prepare" | "attendance-station-arrival:commit"
  | "attendance-station-arrival:test-oracle-write";
type ExitRights = "attendance-station-exit:prepare" | "attendance-station-exit:commit"
  | "attendance-station-exit:test-oracle-write";
// Exact approved order for backend runtime owner; this is NOT a runtime grant.
type NativeExit10 = [
  "shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read",
  "shift-items:read", "employee:read", "attendance:read",
  "attendance-station-exit:prepare", "attendance-station-exit:commit",
  "attendance-station-exit:test-oracle-write",
];
type ParameterName =
  NonNullable<StationExitProblemV1["invalidParameters"]>[number]["name"];
type UnknownProblem = Extract<StationExitProblemV1, { code: "COMMAND_OUTCOME_UNKNOWN" }>;
type ContractChecks = [
  Assert<Equal<CapabilityV1, Read7 | ArrivalRights | ExitRights>>,
  Assert<Equal<Exclude<CapabilityV1, Read7 | ArrivalRights>, ExitRights>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-exit:${string}`>, ExitRights>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-stage-arrival:${string}`>,
    Extract<ArrivalRights, `attendance-stage-arrival:${string}`>>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival:${string}`>,
    Extract<ArrivalRights, `attendance-station-arrival:${string}`>>>,
  Assert<Equal<NativeExit10["length"], 10>>,
  Assert<Equal<NativeExit10[number], Read7 | ExitRights>>,
  Assert<Assignable<NativeExit10[number], CapabilityV1>>,
  Assert<Equal<StationExitModeV1, "disabled" | "test-oracle-controlled">>,
  Assert<Equal<StationArrivalModeV1, "disabled" | "isolated-fixture">>,
  Assert<Equal<StationArrivalModeVNext,
    "disabled" | "isolated-fixture" | "test-oracle-controlled">>,
  Assert<Equal<PrincipalV1["employeeId"], string | null>>,
  Assert<Equal<IdentityResponseV1["dataSource"], "isolated-fixture" | "oracle">>,
  Assert<Equal<keyof AuthenticationRequest, "authorization">>,
  Assert<Equal<Parameters<AuthenticationProvider["authenticate"]>, [request: AuthenticationRequest]>>,
  Assert<Equal<ReturnType<AuthenticationProvider["authenticate"]>, Promise<PrincipalV1>>>,
  Assert<Equal<StationExitBlockerV1,
    "ATTENDANCE_ROW_REQUIRED" | "STATION_ARRIVAL_REQUIRED" | "MISSING_PRESENT"
    | "REPORT_REVIEW_REQUIRED" | "UNSUPPORTED_DAY" | "EXISTING_LATE"
    | "FLAG_PRESENT" | "EMPLOYEE_LOCKED" | "OVERLAPPING_SHIFT">>,
  Assert<Equal<keyof StationExitRecordedV1,
    "stageArrivalLocal" | "stationArrivalLocal" | "stationExitLocal" | "briefing">>,
  Assert<Equal<StationExitRecordedV1, {
    stageArrivalLocal: string | null; stationArrivalLocal: string | null;
    stationExitLocal: string | null; briefing: boolean | null;
  }>>,
  Assert<Equal<keyof StationExitContextV1,
    "employeeId" | "shiftDayId" | "orgUnitId" | "planned" | "recorded"
    | "serverTime" | "policy" | "exitWindow" | "classification"
    | "withinExitWindow" | "eligibility" | "blockers" | "dataSource">>,
  Assert<Equal<StationExitContextV1["policy"],
    { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number }>>,
  Assert<Equal<StationExitContextV1["exitWindow"],
    { earliestInclusiveAt: string; latestInclusiveAt: string }>>,
  Assert<Equal<StationExitContextV1["classification"],
    "ordinary" | "early-manager-decision-deferred" | "outside-window">>,
  Assert<Equal<StationExitContextV1["dataSource"], "oracle-test">>,
  Assert<Equal<keyof StationExitValidationV1,
    "employeeId" | "shiftDayId" | "state" | "evaluatedAt" | "evaluatedLocal"
    | "expiresAt" | "businessTimeZone" | "fingerprint" | "validationToken"
    | "warnings" | "confirmationRequired" | "dataSource">>,
  Assert<Equal<StationExitValidationV1["state"], "ready">>,
  Assert<Equal<StationExitValidationV1["warnings"], []>>,
  Assert<Equal<StationExitValidationV1["confirmationRequired"], false>>,
  Assert<Equal<StationExitValidationV1["dataSource"], "oracle-test">>,
  Assert<Equal<keyof StationExitCommitV1,
    "commandId" | "draft" | "validationToken" | "fingerprint" | "operationConfirmation">>,
  Assert<Equal<StationExitCommitV1["draft"], {}>>,
  Assert<Equal<StationExitCommitV1["operationConfirmation"], { accepted: true }>>,
  Assert<Equal<Extract<keyof StationExitCommitV1, "confirmation" | "managerId" | "clock">, never>>,
  Assert<Equal<keyof StationExitReceiptV1,
    "commandId" | "employeeId" | "shiftDayId" | "outcome" | "recorded"
    | "commitAcknowledgedAt" | "readBackVerifiedAt" | "businessTimeZone"
    | "replayed" | "receiptPersistence" | "partnerCompletion" | "dataSource">>,
  Assert<Equal<StationExitReceiptV1["recorded"]["stageArrivalLocal"], string | null>>,
  Assert<Equal<StationExitReceiptV1["recorded"]["stationArrivalLocal"], string>>,
  Assert<Equal<StationExitReceiptV1["recorded"]["stationExitLocal"], string>>,
  Assert<Equal<StationExitReceiptV1["recorded"]["briefing"], boolean | null>>,
  Assert<Equal<StationExitReceiptV1["outcome"], "oracle-test-committed">>,
  Assert<Equal<StationExitReceiptV1["dataSource"], "oracle-test">>,
  Assert<Equal<StationExitReceiptV1["replayed"], false>>,
  Assert<Equal<StationExitReceiptV1["receiptPersistence"], "none">>,
  Assert<Equal<StationExitReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<Assignable<StationArrivalReceiptV1, StationExitReceiptV1>, false>>,
  Assert<Equal<Assignable<NativeStationArrivalReceiptV1, StationExitReceiptV1>, false>>,
  Assert<Equal<Assignable<StationExitReceiptV1, NativeStationArrivalReceiptV1>, false>>,
  Assert<Equal<StationExitProblemV1["code"],
    Exclude<StationArrivalProblemV1["code"], "CONFIRMATION_REQUIRED">>>,
  Assert<Equal<ParameterName, "employeeId" | "shiftDayId" | "commandId" | "draft"
    | "validationToken" | "fingerprint" | "operationConfirmation" | "query" | "body">>,
  Assert<Equal<UnknownProblem["status"], 503>>,
  Assert<Equal<UnknownProblem["effect"], "unknown">>,
  Assert<Equal<UnknownProblem["nextAction"], "reconcile">>,
  Assert<Equal<Extract<StationExitProblemV1, { effect: "unknown" }>["code"],
    "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<Exclude<StationExitProblemV1, { effect: "unknown" }>["effect"],
    "none" | "rolled-back">>,
  Assert<Equal<StationArrivalReceiptV1["outcome"], "fixture-committed">>,
  Assert<Equal<StationArrivalUnitOfWorkPort["dataSource"], "isolated-fixture">>,
];
type AllChecksAreTrue = Assert<Equal<ContractChecks[number], true>>;

test("station exit canonical module is type-only: no grants, configuration, SQL or ports", () => {
  assert.deepEqual(Object.keys(exitContracts), []);
});
