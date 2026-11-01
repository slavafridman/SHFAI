import { test } from "node:test";
import assert from "node:assert/strict";
import * as dto from "../station-exit-cancellation-contracts.mts";
import * as ports from "../station-exit-cancellation-ports.mts";
import * as privateContracts from "../station-exit-cancellation-private-contracts.mts";
import type {
  AuthenticationProvider, AuthenticationRequest, CapabilityV1, IdentityResponseV1,
  PrincipalV1,
} from "../contracts.mts";
import type {
  CancellationBlockerV1, CancellationCapabilityV1, CancellationCommandV1,
  CancellationContextV1, CancellationDraftV1, CancellationModeV1,
  CancellationProblemV1, CancellationReceiptV1, CancellationRecordedV1,
  CancellationValidationV1,
} from "../station-exit-cancellation-contracts.mts";
import type {
  CancellationApplicationPort, CancellationNativeCompletionV1,
  CancellationOperationAdmissionV1, CancellationOperatorAdmissionPort,
  CancellationPartnerAssessmentPort, CancellationReader, CancellationRules,
  CancellationUow,
} from "../station-exit-cancellation-ports.mts";
import type {
  CancellationBindingV1, CancellationCertificateV1,
  CancellationEnabledConfigurationV1, CancellationFixtureEnvironmentV1,
  CancellationFixtureManifestV1, CancellationFullMetadataProofV1,
  CancellationLimitedMetadataProofV1, CancellationMetadataCoverageWaiverV1,
  CancellationMetadataProofV1, CancellationNativeEnvironmentV1,
  CancellationPartnerReviewV1, CancellationScopeV1,
} from "../station-exit-cancellation-private-contracts.mts";
import type {
  NativeCommandAdmissionV1, NativeCommandCoordinatorPort, NativeCommandOperationV1,
} from "../native-command-coordinator-contracts.mts";
import type {
  StageArrivalSelectionV1,
} from "../stage-arrival-contracts.mts";
import type {
  StationExitBlockerV1, StationExitCommitV1, StationExitProblemV1, StationExitReceiptV1,
} from "../station-exit-contracts.mts";
import type { NativeIdentity } from "../native-stage-arrival-config.mts";
import type { LimitedMetadataEvidence } from "../native-metadata-limited.mts";

// These exact assertions require TSC. Node's type stripping does NOT check them.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type Reads = "shift-day:read" | "current-shifts:read" | "shift-search:read"
  | "my-shifts:read" | "shift-items:read" | "employee:read" | "attendance:read";
type Rights = "prepare" | "commit" | "test-oracle-write";
type OldAttendance = `attendance-${"stage-arrival" | "station-arrival"
  | "station-arrival-late" | "station-exit"}:${Rights}`;
type Management = "shift-management:prepare" | "shift-management:create"
  | "shift-management:change" | "shift-management:cancel"
  | "shift-management:csv-preview" | "shift-management:csv-apply"
  | "shift-management:test-oracle-write";
type CancelRights = `attendance-station-exit-cancellation:${Rights}`;
type Native = Extract<CancellationReceiptV1, { dataSource: "oracle-test" }>;
type Fixture = Extract<CancellationReceiptV1, { dataSource: "isolated-fixture" }>;
type Full = Extract<CancellationBindingV1, { metadataProvider: "dba-v1" | "owner-hybrid-v1" }>;
type Limited = Extract<CancellationBindingV1, { metadataProvider: "owner-test-limited-v1" }>;
type FixtureConfig = Extract<CancellationEnabledConfigurationV1,
  { attendanceStationExitCancellationMode: "isolated-fixture" }>;
type NativeConfig = Extract<CancellationEnabledConfigurationV1,
  { attendanceStationExitCancellationMode: "test-oracle-controlled" }>;
type Snapshot = { completeParsedFacts: string };
type Decision = { allowed: boolean };
type Uow = CancellationUow<Snapshot, Decision, CancellationNativeCompletionV1>;
type Invalid = NonNullable<CancellationProblemV1["invalidParameters"]>[number];
type Unknown = Extract<CancellationProblemV1, { effect: "unknown" }>;
type Checks = [
  Assert<Equal<CapabilityV1, Reads | OldAttendance | Management | CancelRights>>,
  Assert<Equal<Exclude<CapabilityV1, CancelRights>, Reads | OldAttendance | Management>>,
  Assert<Equal<CancellationCapabilityV1, CancelRights>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-exit-cancellation:${string}`>, CancelRights>>,
  Assert<Equal<NativeCommandOperationV1,
    "stage-arrival" | "station-arrival" | "station-arrival-late" | "station-exit"
    | "create" | "change" | "cancel" | "csv-create" | "station-exit-cancellation">>,
  Assert<Equal<keyof PrincipalV1, "subject" | "provider" | "synthetic" | "displayName"
    | "roles" | "capabilities" | "employeeId" | "resourceScope">>,
  Assert<Equal<PrincipalV1["employeeId"], string | null>>,
  Assert<Equal<PrincipalV1["roles"], Array<"Administrator">>>,
  Assert<Equal<IdentityResponseV1["dataSource"], "isolated-fixture" | "oracle">>,
  Assert<Equal<keyof AuthenticationRequest, "authorization">>,
  Assert<Equal<Parameters<AuthenticationProvider["authenticate"]>, [request: AuthenticationRequest]>>,
  Assert<Equal<ReturnType<AuthenticationProvider["authenticate"]>, Promise<PrincipalV1>>>,
  Assert<Equal<CancellationModeV1, "disabled" | "isolated-fixture" | "test-oracle-controlled">>,
  Assert<Equal<CancellationDraftV1, {}>>,
  Assert<Equal<CancellationRecordedV1, {
    stageArrivalLocal: string | null; stationArrivalLocal: string | null;
    stationExitLocal: string | null; briefing: boolean | null;
  }>>,
  Assert<Equal<CancellationBlockerV1, StationExitBlockerV1 | "ORDINARY_EXIT_REQUIRED"
    | "PARTNER_REVIEW_REQUIRED" | "OUTSIDE_CANCELLATION_WINDOW">>,
  Assert<Equal<keyof CancellationContextV1, "employeeId" | "shiftDayId" | "orgUnitId"
    | "planned" | "recorded" | "serverTime" | "policy" | "mode" | "dataSource"
    | "eligibility" | "blockers">>,
  Assert<Equal<CancellationContextV1["mode"], "isolated-fixture" | "test-oracle-controlled">>,
  Assert<Equal<CancellationContextV1["dataSource"], "isolated-fixture" | "oracle-test">>,
  Assert<Equal<CancellationContextV1["eligibility"], "eligible" | "not-recorded" | "deferred">>,
  Assert<Equal<CancellationContextV1["policy"],
    { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number }>>,
  Assert<Equal<Extract<keyof CancellationContextV1, "classification" | "exitWindow" | "exitUser">, never>>,
  Assert<Equal<keyof CancellationValidationV1, "employeeId" | "shiftDayId" | "state"
    | "evaluatedAt" | "evaluatedLocal" | "expiresAt" | "businessTimeZone"
    | "validationToken" | "fingerprint" | "originalExitLocal" | "warnings"
    | "confirmationRequired" | "dataSource">>,
  Assert<Equal<CancellationValidationV1["warnings"], ["RECORDED_EXIT_WILL_BE_CLEARED"]>>,
  Assert<Equal<CancellationValidationV1["confirmationRequired"], true>>,
  Assert<Equal<CancellationValidationV1["state"], "ready">>,
  Assert<Equal<CancellationValidationV1["originalExitLocal"], string>>,
  Assert<Equal<CancellationValidationV1["dataSource"], "isolated-fixture" | "oracle-test">>,
  Assert<Equal<keyof CancellationCommandV1, "commandId" | "draft" | "validationToken"
    | "fingerprint" | "warningConfirmation" | "operationConfirmation">>,
  Assert<Equal<CancellationCommandV1["warningConfirmation"],
    { accepted: true; code: "RECORDED_EXIT_WILL_BE_CLEARED" }>>,
  Assert<Equal<CancellationCommandV1["operationConfirmation"], { accepted: true }>>,
  Assert<Equal<Assignable<Omit<CancellationCommandV1, "warningConfirmation">, CancellationCommandV1>, false>>,
  Assert<Equal<Assignable<Omit<CancellationCommandV1, "operationConfirmation">, CancellationCommandV1>, false>>,
  Assert<Equal<Assignable<StationExitCommitV1, CancellationCommandV1>, false>>,
  Assert<Equal<keyof Native, "commandId" | "employeeId" | "shiftDayId" | "originalExitLocal"
    | "recorded" | "businessTimeZone" | "replayed" | "receiptPersistence"
    | "partnerCompletion" | "outcome" | "dataSource" | "commitAcknowledgedAt" | "readBackVerifiedAt">>,
  Assert<Equal<keyof Fixture, keyof Native>>,
  Assert<Equal<Native["recorded"]["stageArrivalLocal"], string | null>>,
  Assert<Equal<Native["recorded"]["stationArrivalLocal"], string>>,
  Assert<Equal<Native["recorded"]["stationExitLocal"], null>>,
  Assert<Equal<Native["recorded"]["briefing"], boolean | null>>,
  Assert<Equal<Native["commitAcknowledgedAt"] | Native["readBackVerifiedAt"], string>>,
  Assert<Equal<Fixture["commitAcknowledgedAt"], null>>,
  Assert<Equal<Fixture["readBackVerifiedAt"], null>>,
  Assert<Equal<Fixture["recorded"], Native["recorded"]>>,
  Assert<Equal<Native["outcome"], "oracle-test-committed">>,
  Assert<Equal<Fixture["outcome"], "simulated">>,
  Assert<Equal<CancellationReceiptV1["replayed"], false>>,
  Assert<Equal<CancellationReceiptV1["receiptPersistence"], "none">>,
  Assert<Equal<CancellationReceiptV1["partnerCompletion"], "not-invoked">>,
  Assert<Equal<Assignable<Fixture, Native>, false>>,
  Assert<Equal<Assignable<Native, Fixture>, false>>,
  Assert<Equal<Assignable<StationExitReceiptV1, CancellationReceiptV1>, false>>,
  Assert<Equal<Assignable<Omit<Native, "dataSource"> & { dataSource: "isolated-fixture" },
    CancellationReceiptV1>, false>>,
  Assert<Equal<Assignable<Omit<Fixture, "commitAcknowledgedAt"> & { commitAcknowledgedAt: string },
    CancellationReceiptV1>, false>>,
  Assert<Equal<Assignable<Omit<Fixture, "readBackVerifiedAt"> & { readBackVerifiedAt: string },
    CancellationReceiptV1>, false>>,
  Assert<Equal<Invalid["name"], "employeeId" | "shiftDayId" | "commandId" | "draft"
    | "validationToken" | "fingerprint" | "warningConfirmation" | "operationConfirmation" | "query" | "body">>,
  Assert<Equal<Invalid["reason"], "required" | "invalid-format" | "unsupported">>,
  Assert<Equal<CancellationProblemV1["code"],
    Exclude<StationExitProblemV1["code"], "ALREADY_REGISTERED"> | "EXIT_NOT_RECORDED" | "CONFIRMATION_REQUIRED">>,
  Assert<Equal<Extract<CancellationProblemV1, { code: "CONFIRMATION_REQUIRED" }>["nextAction"],
    "correct-and-validate">>,
  Assert<Equal<Extract<CancellationProblemV1, { code: "EXIT_NOT_RECORDED" }>["nextAction"], "stop">>,
  Assert<Equal<Unknown["code"], "COMMAND_OUTCOME_UNKNOWN">>,
  Assert<Equal<Unknown["status"], 503>>,
  Assert<Equal<Unknown["nextAction"], "reconcile">>,
  Assert<Equal<Exclude<CancellationProblemV1, Unknown>["effect"], "none" | "rolled-back">>,
  Assert<Equal<keyof CancellationApplicationPort, "context" | "validate" | "command">>,
  Assert<Equal<Parameters<CancellationApplicationPort["context"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<CancellationApplicationPort["validate"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1, draft: {}, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<CancellationApplicationPort["command"]>,
    [principal: PrincipalV1, selection: StageArrivalSelectionV1,
      command: CancellationCommandV1, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<CancellationApplicationPort["command"]>, Promise<CancellationReceiptV1>>>,
  Assert<Equal<ReturnType<CancellationApplicationPort["context"]>, Promise<CancellationContextV1>>>,
  Assert<Equal<ReturnType<CancellationApplicationPort["validate"]>, Promise<CancellationValidationV1>>>,
  Assert<Equal<ReturnType<CancellationReader<Snapshot>["read"]>, Promise<Snapshot>>>,
  Assert<Equal<Parameters<CancellationRules<Snapshot, Decision>["decide"]>,
    [snapshot: Snapshot, serverNow: string]>>,
  Assert<Equal<ReturnType<CancellationPartnerAssessmentPort["assess"]>,
    { assessment: "not-required" | "required" | "unknown" }>>,
  Assert<Equal<Parameters<CancellationPartnerAssessmentPort["assess"]>[0],
    CancellationScopeV1 & { purpose: "clear-recorded-ordinary-station-exit";
      review: CancellationPartnerReviewV1 }>>,
  Assert<Equal<keyof CancellationOperatorAdmissionPort, "assertAvailable" | "consume" | "assertMutationAllowed">>,
  Assert<Equal<Parameters<CancellationOperatorAdmissionPort["assertAvailable"]>,
    [scope: CancellationScopeV1, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<CancellationOperatorAdmissionPort["assertMutationAllowed"]>,
    [handle: CancellationOperationAdmissionV1, scope: CancellationScopeV1, commandId: string]>>,
  Assert<Equal<Parameters<CancellationOperatorAdmissionPort["consume"]>,
    [scope: CancellationScopeV1, commandId: string,
      globalAdmission: NativeCommandAdmissionV1, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<CancellationOperatorAdmissionPort["consume"]>,
    Promise<CancellationOperationAdmissionV1>>>,
  Assert<Equal<Assignable<{}, CancellationOperationAdmissionV1>, false>>,
  Assert<Equal<Assignable<NativeCommandAdmissionV1, CancellationOperationAdmissionV1>, false>>,
  Assert<Equal<Assignable<CancellationOperationAdmissionV1, NativeCommandAdmissionV1>, false>>,
  Assert<Equal<Uow["coordinator"], NativeCommandCoordinatorPort>>,
  Assert<Equal<Parameters<Uow["execute"]>,
    [before: Snapshot, decide: (current: Snapshot) => Decision,
      globalAdmission: NativeCommandAdmissionV1,
      operationAdmission: CancellationOperationAdmissionV1, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<Uow["execute"]>, Promise<CancellationNativeCompletionV1>>>,
  Assert<Equal<keyof CancellationScopeV1, "bindingScopeDigest" | "completeOriginalsDigest">>,
  Assert<Equal<keyof CancellationCertificateV1, "version" | "operation" | "tableScope"
    | "metadataProof" | "updateColumns" | "replacement" | "completeOriginalsDigest" | "bindingScopeDigest">>,
  Assert<Equal<CancellationCertificateV1["updateColumns"], ["STATION_EXIT_TIME", "STATION_EXIT_USER"]>>,
  Assert<Equal<CancellationCertificateV1["replacement"], { STATION_EXIT_TIME: null; STATION_EXIT_USER: null }>>,
  Assert<Equal<CancellationBindingV1["expectedDaySource"], string | null>>,
  Assert<Equal<CancellationBindingV1["operation"], "native-station-exit-cancellation-v0.1">>,
  Assert<Equal<CancellationBindingV1["readIdentity"], NativeIdentity>>,
  Assert<Equal<CancellationBindingV1["writeIdentity"], NativeIdentity>>,
  Assert<Equal<keyof Full, "operation" | "marker" | "employeeId" | "shiftDayId"
    | "orgUnitId" | "expectedDaySource" | "readIdentity" | "writeIdentity"
    | "cancellationMetadataDigest" | "cancellationCertificate" | "partnerReview"
    | "approval" | "freezeOwner" | "recoveryOwner" | "writerFreezeConfirmed"
    | "singleExecutorConfirmed" | "windowStart" | "windowEnd" | "allowanceFile"
    | "metadataProvider" | "noExternalEffectsConfirmed">>,
  Assert<Equal<keyof Limited, Exclude<keyof Full, "noExternalEffectsConfirmed"> | "metadataCoverageWaiver">>,
  Assert<Equal<keyof CancellationPartnerReviewV1, "version" | "purpose" | "assessment"
    | "reviewReference" | "reviewedBy" | "reviewedAt" | "expiresAt"
    | "bindingScopeDigest" | "completeOriginalsDigest">>,
  Assert<Equal<CancellationPartnerReviewV1["purpose"], "clear-recorded-ordinary-station-exit">>,
  Assert<Equal<Extract<keyof Full, "metadataCoverageWaiver">, never>>,
  Assert<Equal<Extract<keyof Limited, "noExternalEffectsConfirmed">, never>>,
  Assert<Equal<Limited["metadataCoverageWaiver"], CancellationMetadataCoverageWaiverV1>>,
  Assert<Equal<CancellationMetadataProofV1,
    CancellationFullMetadataProofV1 | CancellationLimitedMetadataProofV1>>,
  Assert<Equal<CancellationFullMetadataProofV1["proof"]["length"], 9>>,
  Assert<Equal<keyof CancellationFullMetadataProofV1,
    "version" | "provider" | "owner" | "operation" | "tableScope" | "proof">>,
  Assert<Equal<keyof CancellationLimitedMetadataProofV1, keyof LimitedMetadataEvidence>>,
  Assert<Equal<CancellationMetadataCoverageWaiverV1["id"],
    "shf-test-exit-cancellation-two-view-waiver-v0.1">>,
  Assert<Equal<CancellationMetadataCoverageWaiverV1["operation"],
    "native-station-exit-cancellation-v0.1">>,
  Assert<Equal<Assignable<LimitedMetadataEvidence, CancellationLimitedMetadataProofV1>, false>>,
  Assert<Equal<CancellationLimitedMetadataProofV1["coverage"], LimitedMetadataEvidence["coverage"]>>,
  Assert<Equal<CancellationFixtureManifestV1["scenarioId"], "ready" | "not-recorded"
    | "early-deferred" | "partner-required" | "partner-unknown" | "outcome-unknown" | "authority-consumed">>,
  Assert<Equal<FixtureConfig["dataSource"], "isolated-fixture">>,
  Assert<Equal<NativeConfig["dataSource"], "oracle-read-only">>,
  Assert<Equal<NativeConfig["oracleTestScopeConfirmed"], true>>,
  Assert<Equal<NativeConfig["deploymentClass"], "isolated-test-demo">>,
  Assert<Equal<keyof FixtureConfig, "attendanceStageArrivalMode" | "attendanceStationArrivalMode"
    | "attendanceStationArrivalLateMode" | "attendanceStationExitMode" | "shiftManagementMode"
    | "authenticationMode" | "syntheticAdministratorEnabled" | "syntheticOrgUnitIds"
    | "businessTimeZone" | "attendanceStationExitCancellationMode" | "deploymentClass" | "dataSource">>,
  Assert<Equal<keyof NativeConfig, keyof FixtureConfig | "oracleTestScopeConfirmed">>,
  Assert<Equal<FixtureConfig["attendanceStageArrivalMode"] | FixtureConfig["attendanceStationArrivalMode"]
    | FixtureConfig["attendanceStationArrivalLateMode"] | FixtureConfig["attendanceStationExitMode"]
    | FixtureConfig["shiftManagementMode"], "disabled">>,
  Assert<Equal<CancellationFixtureEnvironmentV1["SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED"],
    "false" | undefined>>,
  Assert<Equal<CancellationNativeEnvironmentV1["SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED"], "true">>,
];
type AllChecks = Assert<Equal<Checks[number], true>>;

test("C52 canonical DTO, private config and port namespaces are runtime-empty", () => {
  assert.deepEqual(Object.keys(dto), []);
  assert.deepEqual(Object.keys(privateContracts), []);
  assert.deepEqual(Object.keys(ports), []);
});
