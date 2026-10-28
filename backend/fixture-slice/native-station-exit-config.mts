import { basename } from "node:path";
import { exact } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { nativeBinding, nativeEnvironment, metadataBindingProvenance, checkedNativeWriter, daySourceBindingProvenance } from "./native-stage-arrival-config.mts";
import type { NativeBindingWithoutDigest, NativeConfiguration } from "./native-stage-arrival-config.mts";
import { requireLimitedMetadataEnvironment } from "./native-metadata-limited.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import type { StationExitModeV1 } from "./station-exit-contracts.mts";
import { fingerprint } from "./stage-arrival-domain.mts";

export type ExitBinding = NativeBindingWithoutDigest & {
  operation: "native-station-exit-v0.1";
  exitMetadataDigest: string;
};
export function exitBinding(v: unknown): ExitBinding {
  const provider = record(v) && Object.hasOwn(v, "metadataProvider");
  const limited = record(v) && v.metadataProvider === "owner-test-limited-v1";
  const hasDaySource = record(v) && Object.hasOwn(v, "expectedDaySource");
  if (!exact(v, ["marker", "employeeId", "shiftDayId", "orgUnitId", "readIdentity", "writeIdentity",
    "exitMetadataDigest", "operation", "approval", "freezeOwner", "recoveryOwner", "windowStart", "windowEnd",
    "allowanceFile", "writerFreezeConfirmed", ...(limited ? ["metadataCoverageWaiver"] : ["noExternalEffectsConfirmed"]), "singleExecutorConfirmed",
    ...(provider ? ["metadataProvider"] : []), ...(hasDaySource ? ["expectedDaySource"] : [])]) || v.operation !== "native-station-exit-v0.1")
    throw Error("Exact private exit binding required");
  const { operation: _operation, exitMetadataDigest, ...common } = v;
  const { metadataDigest, ...b } = nativeBinding({ ...common, metadataDigest: exitMetadataDigest });
  if (!basename(b.allowanceFile).startsWith("station-exit-") ||
      [b.windowStart, b.windowEnd].some(t => new Date(t).toISOString() !== t))
    throw Error("Separate canonical exit window and allowance required");
  return Object.freeze({ ...b, operation: "native-station-exit-v0.1", exitMetadataDigest: metadataDigest });
}
export function exitIdentityReference(b: ExitBinding) {
  return fingerprint({ ...daySourceBindingProvenance(b), operation: b.operation, read: b.readIdentity, write: b.writeIdentity,
    metadata: { ...metadataBindingProvenance(b), digest: b.exitMetadataDigest } });
}
export function stationExitMode(v: unknown): StationExitModeV1 {
  if (!record(v)) throw Error("Invalid exit configuration");
  if (v.attendanceStationExitMode === undefined || v.attendanceStationExitMode === "disabled") return "disabled";
  if (v.attendanceStationExitMode !== "test-oracle-controlled" ||
      v.attendanceStageArrivalMode !== "disabled" || v.attendanceStationArrivalMode !== "disabled" ||
      v.dataSource !== "oracle-read-only" || v.deploymentClass !== "isolated-test-demo" ||
      v.oracleTestScopeConfirmed !== true || v.authenticationMode !== "synthetic" ||
      v.syntheticAdministratorEnabled !== true || Object.keys(v).some(k => ![
        "attendanceStationExitMode", "attendanceStageArrivalMode", "attendanceStationArrivalMode", "dataSource",
        "deploymentClass", "oracleTestScopeConfirmed", "authenticationMode", "syntheticAdministratorEnabled",
        "syntheticOrgUnitIds", "businessTimeZone"].includes(k)))
    throw Error("Explicit exclusive native exit TEST configuration required");
  return "test-oracle-controlled";
}
export function exitEnvironment(env: NodeJS.ProcessEnv, enabled: boolean):
  { writer: NativeConfiguration["writer"]; binding: ExitBinding } | undefined {
  const keys = Object.keys(env).filter(k => k.startsWith("SHF_NATIVE_EXIT_"));
  const flag = env.SHF_TEST_ORACLE_EXIT_WRITE_ENABLED;
  if (!enabled) {
    if (flag !== undefined && flag !== "false" || keys.length) throw Error("Native exit disabled");
    return undefined;
  }
  if (flag !== "true" || keys.some(k => !["SHF_NATIVE_EXIT_CONNECT_STRING", "SHF_NATIVE_EXIT_USER",
    "SHF_NATIVE_EXIT_PASSWORD", "SHF_NATIVE_EXIT_CLIENT_LIB_DIR", "SHF_NATIVE_EXIT_BINDING"].includes(k)))
    throw Error("Explicit native exit enablement required");
  let raw: unknown;
  try { raw = JSON.parse(env.SHF_NATIVE_EXIT_BINDING ?? "null"); } catch { throw Error("Invalid exit binding"); }
  if (record(raw) && raw.metadataProvider === "owner-test-limited-v1") requireLimitedMetadataEnvironment(env);
  const binding = exitBinding(raw);
  const { operation: _operation, exitMetadataDigest, ...common } = binding;
  const checked = binding.metadataProvider === "owner-test-limited-v1"
    ? checkedNativeWriter(env, nativeBinding({ ...common, metadataDigest: exitMetadataDigest }), oracleEnvironment({
      SHF_ORACLE_CONNECT_STRING: env.SHF_NATIVE_EXIT_CONNECT_STRING, SHF_ORACLE_USER: env.SHF_NATIVE_EXIT_USER,
      SHF_ORACLE_PASSWORD: env.SHF_NATIVE_EXIT_PASSWORD, SHF_ORACLE_CLIENT_LIB_DIR: env.SHF_NATIVE_EXIT_CLIENT_LIB_DIR,
    })) : nativeEnvironment({
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true",
    SHF_ORACLE_CONNECT_STRING: env.SHF_ORACLE_CONNECT_STRING, SHF_ORACLE_USER: env.SHF_ORACLE_USER,
    SHF_NATIVE_STAGE_CONNECT_STRING: env.SHF_NATIVE_EXIT_CONNECT_STRING,
    SHF_NATIVE_STAGE_USER: env.SHF_NATIVE_EXIT_USER, SHF_NATIVE_STAGE_PASSWORD: env.SHF_NATIVE_EXIT_PASSWORD,
    SHF_NATIVE_STAGE_CLIENT_LIB_DIR: env.SHF_NATIVE_EXIT_CLIENT_LIB_DIR,
    SHF_NATIVE_STAGE_BINDING: JSON.stringify({ ...common, metadataDigest: exitMetadataDigest }),
  }, true);
  if (!checked || checked.writer.user !== binding.writeIdentity.user || env.SHF_ORACLE_USER !== binding.readIdentity.user)
    throw Error("Exit account mismatch");
  return { writer: checked.writer, binding };
}
