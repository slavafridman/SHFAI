import { basename } from "node:path";
import { exact } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { nativeBinding, nativeEnvironment } from "./native-stage-arrival-config.mts";
import type { NativeBinding, NativeConfiguration } from "./native-stage-arrival-config.mts";
import { fingerprint } from "./stage-arrival-domain.mts";
import type { StationArrivalModeVNext } from "./oracle-station-arrival-contracts.mts";

export interface StationBinding extends Omit<NativeBinding, "metadataDigest"> {
  operation: "native-station-arrival-v0.1";
  stationMetadataDigest: string;
}
const keys = ["marker", "employeeId", "shiftDayId", "orgUnitId", "readIdentity", "writeIdentity",
  "stationMetadataDigest", "operation", "approval", "freezeOwner", "recoveryOwner", "windowStart", "windowEnd",
  "allowanceFile", "writerFreezeConfirmed", "noExternalEffectsConfirmed", "singleExecutorConfirmed"];
export function stationBinding(value: unknown): StationBinding {
  if (!exact(value, keys) || value.operation !== "native-station-arrival-v0.1")
    throw Error("Exact private station operation binding required");
  const { operation: _operation, stationMetadataDigest, ...common } = value;
  const parsed = nativeBinding({ ...common, metadataDigest: stationMetadataDigest });
  if ([parsed.windowStart, parsed.windowEnd].some(t => new Date(t).toISOString() !== t))
    throw Error("Canonical station operation window required");
  if (!basename(parsed.allowanceFile).startsWith("station-arrival-"))
    throw Error("Separate station operation allowance required");
  const { metadataDigest, ...binding } = parsed;
  return Object.freeze({ ...binding, operation: "native-station-arrival-v0.1", stationMetadataDigest: metadataDigest });
}
export function stationIdentityReference(b: StationBinding) {
  return fingerprint({ operation: b.operation, read: b.readIdentity, write: b.writeIdentity });
}
// Does not resolve DNS or weaken the shared immutable identity/proof parser.
export function nativeStationMode(v: unknown): StationArrivalModeVNext {
  if (!record(v)) throw Error("Invalid station configuration");
  if (v.attendanceStationArrivalMode !== "test-oracle-controlled") {
    if (v.attendanceStationArrivalMode === undefined || v.attendanceStationArrivalMode === "disabled") return "disabled";
    if (v.attendanceStationArrivalMode === "isolated-fixture") return "isolated-fixture";
    throw Error("Invalid station mode");
  }
  if (v.attendanceStageArrivalMode !== "disabled" || v.dataSource !== "oracle-read-only" ||
      v.deploymentClass !== "isolated-test-demo" || v.oracleTestScopeConfirmed !== true ||
      v.authenticationMode !== "synthetic" || v.syntheticAdministratorEnabled !== true ||
      Object.keys(v).some(k => !["attendanceStationArrivalMode", "attendanceStageArrivalMode", "dataSource",
        "deploymentClass", "oracleTestScopeConfirmed", "authenticationMode", "syntheticAdministratorEnabled",
        "syntheticOrgUnitIds", "businessTimeZone"].includes(k)))
    throw Error("Explicit station-only controlled TEST configuration required");
  return "test-oracle-controlled";
}
export function stationEnvironment(env: NodeJS.ProcessEnv, enabled: boolean):
  { writer: NativeConfiguration["writer"]; binding: StationBinding } | undefined {
  const names = Object.keys(env).filter(k => k.startsWith("SHF_NATIVE_STATION_"));
  const flag = env.SHF_TEST_ORACLE_STATION_WRITE_ENABLED;
  if (!enabled) {
    if (flag !== undefined && flag !== "false" || names.length) throw Error("Native station mode disabled");
    return undefined;
  }
  if (flag !== "true" || names.some(k => !["SHF_NATIVE_STATION_CONNECT_STRING", "SHF_NATIVE_STATION_USER",
    "SHF_NATIVE_STATION_PASSWORD", "SHF_NATIVE_STATION_CLIENT_LIB_DIR", "SHF_NATIVE_STATION_BINDING"].includes(k)))
    throw Error("Explicit native station write enablement required");
  let raw: unknown;
  try { raw = JSON.parse(env.SHF_NATIVE_STATION_BINDING ?? "null"); } catch { throw Error("Invalid station binding"); }
  const binding = stationBinding(raw);
  const { operation: _operation, stationMetadataDigest, ...common } = binding;
  // Reuse only F1's account/endpoint/environment validation, never its gates,
  // metadata digest, allowance or runtime mode. No filesystem write occurs.
  const translated: NodeJS.ProcessEnv = {
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true",
    SHF_ORACLE_CONNECT_STRING: env.SHF_ORACLE_CONNECT_STRING, SHF_ORACLE_USER: env.SHF_ORACLE_USER,
    SHF_NATIVE_STAGE_CONNECT_STRING: env.SHF_NATIVE_STATION_CONNECT_STRING,
    SHF_NATIVE_STAGE_USER: env.SHF_NATIVE_STATION_USER, SHF_NATIVE_STAGE_PASSWORD: env.SHF_NATIVE_STATION_PASSWORD,
    SHF_NATIVE_STAGE_CLIENT_LIB_DIR: env.SHF_NATIVE_STATION_CLIENT_LIB_DIR,
    SHF_NATIVE_STAGE_BINDING: JSON.stringify({ ...common, metadataDigest: stationMetadataDigest }),
  };
  const checked = nativeEnvironment(translated, true);
  if (!checked || checked.writer.user !== binding.writeIdentity.user ||
      env.SHF_ORACLE_USER !== binding.readIdentity.user) throw Error("Station account mismatch");
  return { writer: checked.writer, binding };
}
