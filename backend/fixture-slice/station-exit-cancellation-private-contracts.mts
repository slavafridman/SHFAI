// Backend-private TYPE-ONLY 52-config-v0.1. Never HTTP/UI schema or raw SQL API.
import type { DecimalId, ShiftDayId } from "./contracts.mts";
import type { UnitCodeV1 } from "./current-shifts-contracts.mts";
import type {
  StageArrivalFingerprintV1, StageArrivalInstantV1,
} from "./stage-arrival-contracts.mts";
import type { NativeIdentity, nativeMarker } from "./native-stage-arrival-config.mts";
import type {
  LimitedObservations, LimitedMetadataEvidence, ParsedMetadataRow,
} from "./native-metadata-limited.mts";
import type { NativeCommandCoordinatorConfigV1 } from "./native-command-coordinator-contracts.mts";

export type CancellationScopeV1 = {
  bindingScopeDigest: StageArrivalFingerprintV1;
  completeOriginalsDigest: StageArrivalFingerprintV1;
};
export type CancellationPartnerReviewV1 = {
  version: "shf-exit-cancellation-partner-review-v1";
  purpose: "clear-recorded-ordinary-station-exit";
  assessment: "not-required" | "required" | "unknown";
  reviewReference: string;
  reviewedBy: string;
  reviewedAt: StageArrivalInstantV1;
  expiresAt: StageArrivalInstantV1;
  bindingScopeDigest: StageArrivalFingerprintV1;
  completeOriginalsDigest: StageArrivalFingerprintV1;
};
export type CancellationMetadataCoverageWaiverV1 = {
  id: "shf-test-exit-cancellation-two-view-waiver-v0.1";
  accepted: true;
  externalEffectsAssessment: "unknown-user-waived";
  operation: "native-station-exit-cancellation-v0.1";
};
// Existing parsed row schemas/order/limits are reused, NOT legacy proof authority.
export type CancellationFullMetadataProofV1 = {
  version: "shf-native-exit-cancellation-metadata-v1";
  provider: "dba-v1" | "owner-hybrid-v1";
  owner: "SHIFTER";
  operation: "native-station-exit-cancellation-v0.1";
  tableScope: string[];
  proof: [
    LimitedObservations["columns"], LimitedObservations["constraints"],
    LimitedObservations["constraintColumns"], ParsedMetadataRow[],
    LimitedObservations["policies"], LimitedObservations["tablePrivileges"],
    LimitedObservations["columnPrivileges"], ParsedMetadataRow[],
    LimitedObservations["dependencies"],
  ];
};
export type CancellationLimitedMetadataProofV1 = Omit<LimitedMetadataEvidence,
  "version" | "operation" | "waiverId"> & {
  version: "shf-exit-cancellation-owner-test-limited-proof-v1";
  operation: "native-station-exit-cancellation-v0.1";
  waiverId: "shf-test-exit-cancellation-two-view-waiver-v0.1";
};
export type CancellationMetadataProofV1 =
  | CancellationFullMetadataProofV1 | CancellationLimitedMetadataProofV1;
export type CancellationCertificateV1 = {
  version: "shf-native-exit-cancellation-certificate-v1";
  operation: "native-station-exit-cancellation-v0.1";
  tableScope: string[];
  metadataProof: CancellationMetadataProofV1;
  updateColumns: ["STATION_EXIT_TIME", "STATION_EXIT_USER"];
  replacement: { STATION_EXIT_TIME: null; STATION_EXIT_USER: null };
  completeOriginalsDigest: StageArrivalFingerprintV1;
  bindingScopeDigest: StageArrivalFingerprintV1;
};
export type CancellationBindingV1 = {
  operation: "native-station-exit-cancellation-v0.1";
  marker: typeof nativeMarker;
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  orgUnitId: UnitCodeV1;
  expectedDaySource: string | null; // REQUIRED exact SOURCE; no inherited default.
  readIdentity: NativeIdentity;
  writeIdentity: NativeIdentity;
  cancellationMetadataDigest: StageArrivalFingerprintV1;
  cancellationCertificate: CancellationCertificateV1;
  partnerReview: CancellationPartnerReviewV1;
  approval: string;
  freezeOwner: string;
  recoveryOwner: string;
  writerFreezeConfirmed: true;
  singleExecutorConfirmed: true;
  windowStart: StageArrivalInstantV1;
  windowEnd: StageArrivalInstantV1;
  allowanceFile: string;
} & (
  | { metadataProvider: "dba-v1" | "owner-hybrid-v1"; noExternalEffectsConfirmed: true }
  | { metadataProvider: "owner-test-limited-v1";
      metadataCoverageWaiver: CancellationMetadataCoverageWaiverV1 }
);
type CancellationPeerModesV1 = {
  attendanceStageArrivalMode: "disabled";
  attendanceStationArrivalMode: "disabled";
  attendanceStationArrivalLateMode: "disabled";
  attendanceStationExitMode: "disabled";
  shiftManagementMode: "disabled";
};
export type CancellationEnabledConfigurationV1 = CancellationPeerModesV1 & {
  authenticationMode: "synthetic";
  syntheticAdministratorEnabled: true;
  syntheticOrgUnitIds: string[];
  businessTimeZone: string;
} & (
  | { attendanceStationExitCancellationMode: "isolated-fixture";
      deploymentClass: "local-development" | "isolated-test-demo";
      dataSource: "isolated-fixture" }
  | { attendanceStationExitCancellationMode: "test-oracle-controlled";
      deploymentClass: "isolated-test-demo"; dataSource: "oracle-read-only";
      oracleTestScopeConfirmed: true }
);
export type CancellationFixtureManifestV1 = {
  version: "shf-station-exit-cancellation-fixture-v1";
  scenarioId: "ready" | "not-recorded" | "early-deferred" | "partner-required"
    | "partner-unknown" | "outcome-unknown" | "authority-consumed";
  clockInstant: StageArrivalInstantV1;
};
// ENV values are JSON/text, not parsed binding objects. No working values here.
export type CancellationFixtureEnvironmentV1 = {
  SHF_FIXTURE_CONFIG: string;
  SHF_STATION_EXIT_CANCELLATION_ORIGINS: string;
  SHF_STATION_EXIT_CANCELLATION_FIXTURE: string;
  SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED?: "false";
};
export type CancellationNativeEnvironmentV1 = {
  SHF_APP_ENV: "test";
  SHF_ORACLE_CONFIG: string;
  SHF_STATION_EXIT_CANCELLATION_ORIGINS: string;
  SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED: "true";
  SHF_NATIVE_EXIT_CANCELLATION_BINDING: string;
  SHF_NATIVE_EXIT_CANCELLATION_CONNECT_STRING: string;
  SHF_NATIVE_EXIT_CANCELLATION_USER: string;
  SHF_NATIVE_EXIT_CANCELLATION_PASSWORD: string;
  SHF_NATIVE_EXIT_CANCELLATION_CLIENT_LIB_DIR: string;
  SHF_ORACLE_CONNECT_STRING: string;
  SHF_ORACLE_USER: string;
  SHF_ORACLE_PASSWORD: string;
  SHF_ORACLE_CLIENT_LIB_DIR: string;
  SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: string; // JSON NativeCommandCoordinatorConfigV1
} & (
  | { SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: "true" }
  | { SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED?: "false" }
);
// Parsed shared config remains exactly §50, never a cancellation namespace.
export type CancellationCoordinatorConfigurationV1 = NativeCommandCoordinatorConfigV1;

// Runtime strictness is mandatory: exact enabled profile keys, five peer modes
// explicitly disabled; absent/disabled new mode OFF, unchanged old projection.
// OFF rejects new private inputs/Origin/manifest (flag absent/false only).
// Fixture rejects Oracle/native/coordinator/old Origins; native rejects fixture
// and old native prefixes/Origins; old flags absent/false. Reject unknown new
// SHF_NATIVE_EXIT_CANCELLATION_* keys and production/NODE_ENV conflicts before
// factories/authority/listen. Origins exact canonical loopback HTTP(S) array
// 1..16 unique, no wildcard/null/userinfo/path/query/fragment or permissive CORS.
// Manifest16KiB/depth8, binding1MiB/depth12, proof1MiB/depth8, rows<=1000.
// Provider/env/certificate must match; new wrappers/digests/waiver purpose only.
// Limited coverage remains DBA_TRIGGERS/DBA_ROLE_PRIVS UNKNOWN, owner triggers
// owner-only observed; noExternalEffectsConfirmed cannot accompany limited mode.
// Read/write independently match same physical target/schema; current Thick
// driver/client/database compatibility NOT established by historical metadata.
// SOURCE exact null or nonempty control-free UTF8<=15 bytes, no default/trim.
// Marker and existing synthetic employee-number/prefix validation unchanged.
// Operator reference strings control-free/nonblank1..128, no private values in
// public logs. Window canonical same business day, start<end, [start,end).
// External trusted absolute local allowance prefix station-exit-cancellation-;
// no links/network/repo paths or reused old allowances. No provisioning here.
// Digests/preimages and exact exitTables insertion order: design §52.4.2–3.
// Complete all physical attendance AND owned baseline/overlay/employee/unit/
// site/policy before-images; unsupported/noncomparable columns deny native.
// Current DATE exit-time and VARCHAR2 exit-user BOTH nullable/nonvirtual;
// constraints/grants/effects/certificate/review/freeze required, never inferred.
// Only two NULL SET fields above; backend owns SQL/driver/physical projections.
