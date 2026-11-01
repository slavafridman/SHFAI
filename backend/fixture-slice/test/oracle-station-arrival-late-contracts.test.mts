import { test } from "node:test";
import assert from "node:assert/strict";
import * as canonical from "../oracle-station-arrival-late-contracts.mts";
import type {
  CapabilityV1, IdentityResponseV1, PrincipalV1,
} from "../contracts.mts";
import type {
  LateStationArrivalApplicationPort, NativeLateStationCapabilityV1,
  NativeLateStationCommitV1, NativeLateStationContextV1,
  NativeLateStationDraftV1, NativeLateStationModeV1, NativeLateStationProblemV1,
  NativeLateStationReceiptV1, NativeLateStationValidationV1,
  PartnerStationArrivalObligationPort,
} from "../oracle-station-arrival-late-contracts.mts";
import type {
  NativeStationArrivalCommitV1, NativeStationArrivalContextV1,
  NativeStationArrivalProblemV1, NativeStationArrivalReceiptV1,
  NativeStationArrivalValidationV1,
} from "../oracle-station-arrival-contracts.mts";
import type {
  StageArrivalMinutesV1, StageArrivalSelectionV1,
} from "../stage-arrival-contracts.mts";

// tsc assertions, NOT validated by Node's native type stripping.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type WithoutInvalid<T> = T extends unknown ? Omit<T, "invalidParameters"> : never;
type InvalidName<T extends { invalidParameters?: Array<{ name: string }> }> =
  NonNullable<T["invalidParameters"]>[number]["name"];
type LateRights = "attendance-station-arrival-late:prepare"
  | "attendance-station-arrival-late:commit"
  | "attendance-station-arrival-late:test-oracle-write";
type App = LateStationArrivalApplicationPort;
type Checks = [
  Assert<Equal<NativeLateStationCapabilityV1, LateRights>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival-late:${string}`>,
    LateRights>>,
  Assert<Equal<NativeLateStationModeV1, "disabled" | "test-oracle-controlled">>,
  Assert<Equal<keyof NativeLateStationDraftV1, "lateReasonCode" | "lateRemark">>,
  Assert<Equal<NativeLateStationDraftV1, { lateReasonCode: string; lateRemark: null }>>,
  Assert<Equal<Assignable<{ lateReasonCode: null; lateRemark: null },
    NativeLateStationDraftV1>, false>>,
  Assert<Equal<Assignable<{ lateReasonCode: string; lateRemark: string },
    NativeLateStationDraftV1>, false>>,
  Assert<Equal<keyof NativeLateStationContextV1, keyof NativeStationArrivalContextV1>>,
  Assert<Equal<Omit<NativeLateStationContextV1, "lateReasonOptions">,
    Omit<NativeStationArrivalContextV1, "lateReasonOptions">>>,
  Assert<Equal<NativeLateStationContextV1["lateReasonOptions"],
    Array<{ code: string; label: string }>>>,
  Assert<Equal<Omit<NativeLateStationValidationV1,
    "state" | "warnings" | "confirmationRequired">,
    Omit<NativeStationArrivalValidationV1,
      "state" | "warnings" | "confirmationRequired">>>,
  Assert<Equal<NativeLateStationValidationV1["state"], "warning-requires-confirmation">>,
  Assert<Equal<NativeLateStationValidationV1["warnings"],
    [{ code: "STATION_ARRIVAL_LATE"; minutes: StageArrivalMinutesV1 }]>>,
  Assert<Equal<NativeLateStationValidationV1["confirmationRequired"], true>>,
  Assert<Equal<keyof NativeLateStationCommitV1, keyof NativeStationArrivalCommitV1>>,
  Assert<Equal<Omit<NativeLateStationCommitV1, "draft" | "confirmation">,
    Omit<NativeStationArrivalCommitV1, "draft" | "confirmation">>>,
  Assert<Equal<NativeLateStationCommitV1["draft"], NativeLateStationDraftV1>>,
  Assert<Equal<NativeLateStationCommitV1["confirmation"],
    { accepted: true; warningCodes: ["STATION_ARRIVAL_LATE"] }>>,
  Assert<Equal<NativeLateStationCommitV1["operationConfirmation"], { accepted: true }>>,
  Assert<Equal<Assignable<NativeStationArrivalCommitV1,
    NativeLateStationCommitV1>, false>>,
  Assert<Equal<Assignable<NativeLateStationCommitV1,
    NativeStationArrivalCommitV1>, false>>,
  Assert<Equal<Assignable<Omit<NativeLateStationCommitV1, "operationConfirmation">,
    NativeLateStationCommitV1>, false>>,
  Assert<Equal<Assignable<Omit<NativeLateStationCommitV1, "confirmation">,
    NativeLateStationCommitV1>, false>>,
  Assert<Equal<Omit<NativeLateStationReceiptV1, "recorded">,
    Omit<NativeStationArrivalReceiptV1, "recorded">>>,
  Assert<Equal<Omit<NativeLateStationReceiptV1["recorded"], "stationLate">,
    Omit<NativeStationArrivalReceiptV1["recorded"], "stationLate">>>,
  Assert<Equal<NativeLateStationReceiptV1["recorded"]["stationLate"],
    { reasonCode: string; minutes: StageArrivalMinutesV1; remark: null }>>,
  Assert<Equal<NativeLateStationReceiptV1["dataSource"], "oracle-test">>,
  Assert<Equal<NativeLateStationReceiptV1["outcome"], "oracle-test-committed">>,
  Assert<Equal<NativeLateStationReceiptV1["replayed"], false>>,
  Assert<Equal<NativeLateStationReceiptV1["receiptPersistence"], "none">>,
  Assert<Equal<NativeLateStationReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<Extract<keyof NativeLateStationReceiptV1, "committedAt">, never>>,
  Assert<Equal<WithoutInvalid<NativeLateStationProblemV1>,
    WithoutInvalid<NativeStationArrivalProblemV1>>>,
  Assert<Equal<InvalidName<NativeLateStationProblemV1>,
    InvalidName<NativeStationArrivalProblemV1> | "lateRemark">>,
  Assert<Equal<Extract<NativeLateStationProblemV1, { effect: "unknown" }>,
    Extract<NativeLateStationProblemV1, { code: "COMMAND_OUTCOME_UNKNOWN" }>>>,
  Assert<Equal<Extract<NativeLateStationProblemV1, { effect: "unknown" }>["nextAction"],
    "reconcile">>,
  Assert<Equal<keyof App, "context" | "validate" | "command">>,
  Assert<Equal<Parameters<App["context"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<App["validate"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1,
      draft: NativeLateStationDraftV1, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<App["command"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1,
      commit: NativeLateStationCommitV1, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<App["context"]>, Promise<NativeLateStationContextV1>>>,
  Assert<Equal<ReturnType<App["validate"]>, Promise<NativeLateStationValidationV1>>>,
  Assert<Equal<ReturnType<App["command"]>, Promise<NativeLateStationReceiptV1>>>,
  Assert<Equal<ReturnType<PartnerStationArrivalObligationPort<{ revision: string }>["assess"]>,
    { state: "not-required" | "required" | "unknown";
      effects: Array<"cti-arrival" | "managed-break-change"> }>>,
  Assert<Equal<keyof PrincipalV1, "subject" | "provider" | "synthetic" | "displayName"
    | "roles" | "capabilities" | "employeeId" | "resourceScope">>,
  Assert<Equal<IdentityResponseV1["dataSource"], "isolated-fixture" | "oracle">>,
];
type AllChecks = Assert<Equal<Checks[number], true>>;

test("§50 late canonical namespace is runtime-empty (not business validation)", () => {
  assert.deepEqual(Object.keys(canonical), []);
});
