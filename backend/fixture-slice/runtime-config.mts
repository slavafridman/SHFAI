import type { StartupConfig } from "./contracts.mts";
import { record, text, validateConfig } from "./contract-validation.mts";
import { validateStageArrivalMode } from "./stage-arrival-validation.mts";
import { stationMode } from "./station-arrival-validation.mts";
import { stationExitMode } from "./native-station-exit-config.mts";
import { shiftManagementMode } from "./shift-management-config.mts";
import { lateMode, legacyRuntimeShape } from "./native-station-arrival-late-config.mts";
import { cancellationMode, cancellationLegacyProjection, validateCancellationConfig } from "./station-exit-cancellation-config.mts";

type OracleMode = { dataSource: "oracle-read-only"; oracleTestScopeConfirmed: true };
export type OracleStartupConfig =
  | (Omit<Extract<StartupConfig, { authenticationMode: "synthetic" }>, "dataSource"> & OracleMode)
  | (Omit<Extract<StartupConfig, { authenticationMode: "real" }>, "dataSource"> & OracleMode);
export type RuntimeConfig = (StartupConfig | OracleStartupConfig) & {
  attendanceStationArrivalLateMode?: "disabled" | "test-oracle-controlled";
  attendanceStationExitCancellationMode?: "disabled" | "isolated-fixture" | "test-oracle-controlled";
};
export function validateRuntimeConfig(value: unknown): RuntimeConfig {
  const cancellation = cancellationMode(value);
  if (cancellation !== "disabled") return validateCancellationConfig(value);
  // Only a request for the larger Oracle capacity enters the new gate. Preserve
  // existing <=100/native/fixture legacy projections and their exact key rules.
  // Validate ALL modes on ORIGINAL input before granting the private larger limit.
  let largeScope = false;
  if (record(value) && value.dataSource === "oracle-read-only" &&
      Array.isArray(value.syntheticOrgUnitIds) && value.syntheticOrgUnitIds.length > 100) {
    const modes = [lateMode(value), shiftManagementMode(value), stationExitMode(value),
      stationMode(value), validateStageArrivalMode(value)];
    largeScope = modes.every(mode => mode === "disabled") &&
      (value.shiftManagementMode === undefined || value.shiftManagementMode === "disabled") &&
      value.deploymentClass === "isolated-test-demo" && value.authenticationMode === "synthetic" &&
      value.syntheticAdministratorEnabled === true && value.oracleTestScopeConfirmed === true;
  }
  value = cancellationLegacyProjection(value);
  const late = lateMode(value), old = legacyRuntimeShape(value);
  shiftManagementMode(old);
  stationExitMode(old);
  stationMode(old);
  validateStageArrivalMode(old);
  if (!record(value) || value.dataSource !== "oracle-read-only") return validateConfig(old);
  if (value.oracleTestScopeConfirmed !== true || value.deploymentClass === "production")
    throw new Error("Explicit isolated Oracle test scope required");
  const common = validateConfig({ ...record(old) && old, dataSource: "isolated-fixture" }, largeScope ? 1000 : 100);
  return { ...common, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
    ...(Object.hasOwn(value, "attendanceStationArrivalLateMode") ? { attendanceStationArrivalLateMode: late } : {}) };
}
export interface OracleEnvironment {
  connectString: string;
  user: string;
  password: string;
  clientLibDir: string;
}
export function oracleEnvironment(env: NodeJS.ProcessEnv): OracleEnvironment {
  const connectString = env.SHF_ORACLE_CONNECT_STRING, user = env.SHF_ORACLE_USER;
  const password = env.SHF_ORACLE_PASSWORD, clientLibDir = env.SHF_ORACLE_CLIENT_LIB_DIR;
  if (!text(connectString, 4096, 1) || !text(user, 128, 1) || !text(password, 1024, 1) ||
      !text(clientLibDir, 4096, 1) || connectString.trim() !== connectString ||
      user.trim() !== user || clientLibDir.trim() !== clientLibDir ||
      !["CTIDBT_WFMT", "CTIDBT_WFMT.WORLD"].includes(connectString.toUpperCase()))
    throw new Error("Oracle environment configuration unavailable");
  return { connectString, user, password, clientLibDir };
}
