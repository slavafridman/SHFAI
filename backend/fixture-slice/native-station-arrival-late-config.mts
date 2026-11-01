import { basename } from "node:path";
import { exact } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { nativeBinding, checkedNativeWriter, metadataBindingProvenance, daySourceBindingProvenance } from "./native-stage-arrival-config.mts";
import type { NativeBindingWithoutDigest } from "./native-stage-arrival-config.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { fingerprint } from "./stage-arrival-domain.mts";
import { requireLimitedMetadataEnvironment } from "./native-metadata-limited.mts";
export type LateBinding = NativeBindingWithoutDigest & {
  operation: "native-station-arrival-late-v0.1"; lateMetadataDigest: string;
};
export function lateMode(v: unknown): "disabled" | "test-oracle-controlled" {
  if (!record(v)) throw Error("Invalid late configuration");
  if (v.attendanceStationArrivalLateMode === undefined || v.attendanceStationArrivalLateMode === "disabled") return "disabled";
  if (v.attendanceStationArrivalLateMode !== "test-oracle-controlled" ||
      v.deploymentClass !== "isolated-test-demo" || v.authenticationMode !== "synthetic" ||
      v.syntheticAdministratorEnabled !== true || v.dataSource !== "oracle-read-only" ||
      v.oracleTestScopeConfirmed !== true || v.attendanceStageArrivalMode !== "disabled" ||
      ["attendanceStationArrivalMode", "attendanceStationExitMode", "shiftManagementMode"].some(k =>
        v[k] !== undefined && v[k] !== "disabled") ||
      Object.keys(v).some(k => !["attendanceStationArrivalLateMode", "attendanceStageArrivalMode", "attendanceStationArrivalMode",
        "attendanceStationExitMode", "shiftManagementMode", "deploymentClass", "authenticationMode", "syntheticAdministratorEnabled",
        "dataSource", "oracleTestScopeConfirmed", "syntheticOrgUnitIds", "businessTimeZone"].includes(k)))
    throw Error("Explicit late-only isolated native TEST configuration required");
  return "test-oracle-controlled";
}
export function lateBinding(value: unknown): LateBinding {
  if (!record(value) || value.operation !== "native-station-arrival-late-v0.1" ||
      !Object.hasOwn(value, "lateMetadataDigest")) throw Error("Dedicated late operation binding required");
  const { operation: _operation, lateMetadataDigest, ...common } = value;
  const parsed = nativeBinding({ ...common, metadataDigest: lateMetadataDigest });
  if (!basename(parsed.allowanceFile).startsWith("station-arrival-late-") ||
      [parsed.windowStart, parsed.windowEnd].some(t => new Date(t).toISOString() !== t))
    throw Error("Separate late allowance/canonical window required");
  const { metadataDigest, ...binding } = parsed;
  return Object.freeze({ ...binding, operation: "native-station-arrival-late-v0.1", lateMetadataDigest: metadataDigest });
}
export function lateIdentityReference(b: LateBinding) {
  return fingerprint({ ...daySourceBindingProvenance(b), operation: b.operation, read: b.readIdentity, write: b.writeIdentity,
    metadata: { ...metadataBindingProvenance(b), digest: b.lateMetadataDigest } });
}
export function legacyRuntimeShape(v: unknown): unknown {
  if (!record(v)) return v;
  const { attendanceStationArrivalLateMode: _late, ...old } = v;
  return old;
}
export function lateEnvironment(env: NodeJS.ProcessEnv, enabled: boolean) {
  const names = Object.keys(env).filter(k => k.startsWith("SHF_NATIVE_LATE_"));
  if (!enabled) {
    if (names.length || env.SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED !== undefined &&
        env.SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED !== "false" ||
        env.SHF_STATION_ARRIVAL_LATE_ORIGINS !== undefined) throw Error("Late mode disabled");
    return undefined;
  }
  if (env.SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED !== "true" || names.some(k =>
      !["SHF_NATIVE_LATE_BINDING", "SHF_NATIVE_LATE_CONNECT_STRING", "SHF_NATIVE_LATE_USER",
        "SHF_NATIVE_LATE_PASSWORD", "SHF_NATIVE_LATE_CLIENT_LIB_DIR"].includes(k))) throw Error("Explicit late writer required");
  const binding = lateBinding(JSON.parse(env.SHF_NATIVE_LATE_BINDING ?? "null"));
  if (binding.metadataProvider === "owner-test-limited-v1") requireLimitedMetadataEnvironment(env);
  const { operation: _op, lateMetadataDigest, ...common } = binding;
  const writer = oracleEnvironment({
    SHF_ORACLE_CONNECT_STRING: env.SHF_NATIVE_LATE_CONNECT_STRING, SHF_ORACLE_USER: env.SHF_NATIVE_LATE_USER,
    SHF_ORACLE_PASSWORD: env.SHF_NATIVE_LATE_PASSWORD, SHF_ORACLE_CLIENT_LIB_DIR: env.SHF_NATIVE_LATE_CLIENT_LIB_DIR,
  });
  checkedNativeWriter(env, nativeBinding({ ...common, metadataDigest: lateMetadataDigest }), writer);
  if (env.SHF_ORACLE_USER !== binding.readIdentity.user) throw Error("Late independent read account mismatch");
  return { writer, binding };
}
