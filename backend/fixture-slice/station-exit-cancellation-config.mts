import { record, validateConfig } from "./contract-validation.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import type { CancellationModeV1 } from "./station-exit-cancellation-contracts.mts";
import type { CancellationEnabledConfigurationV1 } from "./station-exit-cancellation-private-contracts.mts";
import { cancellationManifest } from "./station-exit-cancellation-validation.mts";

const key = "attendanceStationExitCancellationMode";
const peers = ["attendanceStageArrivalMode", "attendanceStationArrivalMode", "attendanceStationArrivalLateMode",
  "attendanceStationExitMode", "shiftManagementMode"];
export function cancellationMode(v: unknown): CancellationModeV1 {
  if (!record(v)) throw Error("Invalid cancellation configuration");
  if (Object.keys(v).some(k => k.startsWith("attendanceStationExitCancellation") && k !== key))
    throw Error("Unsupported cancellation configuration key");
  if (v[key] === undefined || v[key] === "disabled") return "disabled";
  if (v[key] !== "isolated-fixture" && v[key] !== "test-oracle-controlled")
    throw Error("Invalid cancellation mode");
  return v[key];
}
export function cancellationLegacyProjection(v: unknown): unknown {
  if (!record(v)) return v;
  const { attendanceStationExitCancellationMode: _mode, ...old } = v;
  return old;
}
export function validateCancellationConfig(v: unknown): CancellationEnabledConfigurationV1 {
  const mode = cancellationMode(v);
  const native = mode === "test-oracle-controlled";
  if (mode === "disabled" || !exact(v, [key, ...peers, "deploymentClass", "authenticationMode",
    "syntheticAdministratorEnabled", "syntheticOrgUnitIds", "businessTimeZone", "dataSource",
    ...(native ? ["oracleTestScopeConfirmed"] : [])]) ||
      peers.some(k => v[k] !== "disabled") || v.authenticationMode !== "synthetic" ||
      v.syntheticAdministratorEnabled !== true || v.dataSource !== (native ? "oracle-read-only" : "isolated-fixture") ||
      native && (v.deploymentClass !== "isolated-test-demo" || v.oracleTestScopeConfirmed !== true))
    throw Error("Explicit exclusive cancellation profile required");
  const common = validateConfig({ ...v, dataSource: "isolated-fixture" });
  if (common.authenticationMode !== "synthetic" || common.deploymentClass === "production")
    throw Error("Cancellation requires isolated synthetic mode");
  const base = { authenticationMode: "synthetic" as const, syntheticAdministratorEnabled: true as const,
    syntheticOrgUnitIds: [...common.syntheticOrgUnitIds], businessTimeZone: common.businessTimeZone,
    attendanceStageArrivalMode: "disabled" as const, attendanceStationArrivalMode: "disabled" as const,
    attendanceStationArrivalLateMode: "disabled" as const, attendanceStationExitMode: "disabled" as const,
    shiftManagementMode: "disabled" as const };
  return native ? { ...base, attendanceStationExitCancellationMode: "test-oracle-controlled",
    deploymentClass: "isolated-test-demo", dataSource: "oracle-read-only", oracleTestScopeConfirmed: true } :
    { ...base, attendanceStationExitCancellationMode: "isolated-fixture",
      deploymentClass: common.deploymentClass, dataSource: "isolated-fixture" };
}
export function cancellationOrigins(raw: string | undefined): readonly string[] {
  if (raw === undefined || Buffer.byteLength(raw) > 4096) throw Error("Cancellation origins required");
  const v = parseStageJson(raw);
  if (!Array.isArray(v) || v.length < 1 || v.length > 16 || new Set(v).size !== v.length)
    throw Error("Invalid cancellation origins");
  const origins: string[] = [];
  for (const origin of v) {
    if (typeof origin !== "string") throw Error("Invalid cancellation origin");
    const u = new URL(origin);
    if (u.origin !== origin || !["http:", "https:"].includes(u.protocol) ||
        !["127.0.0.1", "[::1]", "localhost"].includes(u.hostname) || origin.length > 128)
      throw Error("Exact loopback cancellation origins required");
    origins.push(origin);
  }
  return Object.freeze(origins);
}
export function validateCancellationEnvironment(v: unknown, env: NodeJS.ProcessEnv) {
  const mode = cancellationMode(v);
  const prefix = "SHF_NATIVE_EXIT_CANCELLATION_";
  const privateKeys = Object.keys(env).filter(k => k.startsWith(prefix));
  const flag = env.SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED;
  if (mode === "disabled") {
    if (privateKeys.length || env.SHF_STATION_EXIT_CANCELLATION_ORIGINS !== undefined ||
        env.SHF_STATION_EXIT_CANCELLATION_FIXTURE !== undefined || flag !== undefined && flag !== "false")
      throw Error("Cancellation disabled");
    return;
  }
  const c = validateCancellationConfig(v);
  // JSON.parse at the shared loader must not hide duplicate decoded profile
  // keys for this new exact enabled profile. OFF/old profiles are unchanged.
  const rawConfig = env.SHF_ORACLE_CONFIG ?? env.SHF_FIXTURE_CONFIG;
  if (rawConfig !== undefined) validateCancellationConfig(parseStageJson(rawConfig));
  if (env.NODE_ENV === "production" || env.SHF_APP_ENV === "production" ||
      env.SHF_APP_ENV !== undefined && !["dev", "test"].includes(env.SHF_APP_ENV) ||
      env.SHF_APP_ENV === "dev" && c.deploymentClass !== "local-development" ||
      env.SHF_APP_ENV === "test" && c.deploymentClass !== "isolated-test-demo")
    throw Error("Cancellation environment conflict");
  cancellationOrigins(env.SHF_STATION_EXIT_CANCELLATION_ORIGINS);
  const oldFlags = ["SHF_TEST_ORACLE_STAGE_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_WRITE_ENABLED",
    "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED", "SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED"];
  if (Object.keys(env).some(k => !k.startsWith(prefix) &&
      (k.startsWith("SHF_NATIVE_STAGE_") || k.startsWith("SHF_NATIVE_STATION_") || k.startsWith("SHF_NATIVE_LATE_") ||
       k.startsWith("SHF_NATIVE_EXIT_") || k.startsWith("SHF_NATIVE_SHIFT_") ||
       ["SHF_STAGE_ARRIVAL_ORIGINS", "SHF_STATION_ARRIVAL_ORIGINS", "SHF_STATION_EXIT_ORIGINS",
         "SHF_STATION_ARRIVAL_LATE_ORIGINS", "SHF_SHIFT_MANAGEMENT_ORIGINS",
         "SHF_STAGE_ARRIVAL_FIXTURE", "SHF_STATION_ARRIVAL_FIXTURE", "SHF_SHIFT_MANAGEMENT_FIXTURE"].includes(k))) ||
      oldFlags.some(k => env[k] !== undefined && env[k] !== "false")) throw Error("Cancellation cannot share mutation inputs");
  if (mode === "isolated-fixture") {
    if (privateKeys.length || Object.keys(env).some(k => k.startsWith("SHF_ORACLE_")) ||
        env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG !== undefined ||
        env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED !== undefined && env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED !== "false" ||
        flag !== undefined && flag !== "false") throw Error("Fixture cannot receive native inputs");
    cancellationManifest(env.SHF_STATION_EXIT_CANCELLATION_FIXTURE ?? "");
  } else {
    const names = ["BINDING", "CONNECT_STRING", "USER", "PASSWORD", "CLIENT_LIB_DIR"].map(k => prefix + k);
    if (env.SHF_APP_ENV !== "test" || flag !== "true" ||
        privateKeys.some(k => !names.includes(k)) || names.some(k => !env[k]) ||
        env.SHF_STATION_EXIT_CANCELLATION_FIXTURE !== undefined ||
        Object.keys(env).some(k => k.startsWith("SHF_FIXTURE_") || k.endsWith("_FIXTURE")) ||
        env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG === undefined)
      throw Error("Explicit native cancellation envelope required");
  }
}
