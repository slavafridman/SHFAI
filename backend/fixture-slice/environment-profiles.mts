import { record } from "./contract-validation.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";
import type { RuntimeConfig } from "./runtime-config.mts";
import { validateLimitedMetadataStartup } from "./native-metadata-limited.mts";

export type AppEnvironment = "dev" | "test" | "production";
export const deploymentClasses = Object.freeze({
  dev: "local-development",
  test: "isolated-test-demo",
  production: "production",
} as const);

// Safe constant diagnostic: the executable must never print raw config/errors.
export class RealAuthenticationNotConfiguredError extends Error {
  constructor() { super("Real authentication provider not configured"); }
}

/** An absent profile preserves explicit legacy config; it never selects DEV. */
export function appEnvironment(value: string | undefined): AppEnvironment | undefined {
  if (value === undefined) return undefined;
  if (value !== "dev" && value !== "test" && value !== "production")
    throw Error("SHF_APP_ENV must be exactly dev, test or production");
  return value;
}

/** Server-only gate, before driver imports, pool creation or native allowance IO. */
export function validateEnvironmentProfile(value: unknown, env: NodeJS.ProcessEnv): void {
  const profile = appEnvironment(env.SHF_APP_ENV);
  const limitedFlag = env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED;
  if (limitedFlag !== undefined && limitedFlag !== "true" && limitedFlag !== "false")
    throw Error("Invalid TEST limited metadata opt-in");
  if (limitedFlag === "true" && (profile !== "test" || env.NODE_ENV === "production"))
    throw Error("TEST profile required for limited metadata");
  if (!record(value)) throw Error("Explicit backend configuration required");
  if (env.NODE_ENV === "production" &&
      (profile !== undefined && profile !== "production" ||
       value.deploymentClass !== deploymentClasses.production))
    throw Error("NODE_ENV production conflicts with application environment");
  if (profile !== undefined && value.deploymentClass !== deploymentClasses[profile])
    throw Error("SHF_APP_ENV deploymentClass mismatch");
  if (value.deploymentClass === "production") {
    if (value.syntheticAdministratorEnabled !== false || value.authenticationMode !== "real" ||
        value.syntheticOrgUnitIds !== undefined)
      throw Error("Production prohibits synthetic authentication");
    if (value.dataSource !== "oracle-read-only" || value.oracleTestScopeConfirmed !== undefined ||
        value.attendanceStageArrivalMode !== undefined && value.attendanceStageArrivalMode !== "disabled" ||
        value.attendanceStationArrivalMode !== undefined && value.attendanceStationArrivalMode !== "disabled" ||
        value.attendanceStationExitMode !== undefined && value.attendanceStationExitMode !== "disabled")
      throw Error("Production prohibits fixture and TEST sources/modes");
    if (Object.keys(env).some(key =>
      key.startsWith("SHF_NATIVE_STAGE_") || key.startsWith("SHF_NATIVE_STATION_") || key.startsWith("SHF_NATIVE_EXIT_") || key.startsWith("SHF_FIXTURE_") ||
      key.endsWith("_FIXTURE") || key === "SHF_STAGE_ARRIVAL_ORIGINS" ||
      key === "SHF_STATION_ARRIVAL_ORIGINS" || key === "SHF_STATION_EXIT_ORIGINS" ||
      key === "SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED" && env[key] !== "false" ||
      ["SHF_TEST_ORACLE_STAGE_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_WRITE_ENABLED", "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED"].includes(key) && env[key] !== "false"))
      throw Error("Production prohibits synthetic/TEST environment context");
    // No fake provider or production DB implementation. Even otherwise clean
    // configuration must stop here, before examining Oracle secret inputs.
    throw new RealAuthenticationNotConfiguredError();
  }
  if (profile === "dev" && (value.dataSource !== "isolated-fixture" ||
      value.attendanceStageArrivalMode === "test-oracle-controlled" || value.attendanceStationArrivalMode === "test-oracle-controlled" ||
      value.attendanceStationExitMode === "test-oracle-controlled"))
    throw Error("DEV requires isolated fixtures; native TEST is forbidden");
}

export function loadEnvironmentConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  // Validate spelling even with missing/malformed JSON; no typo fallback.
  appEnvironment(env.SHF_APP_ENV);
  if (env.SHF_ORACLE_CONFIG !== undefined && env.SHF_FIXTURE_CONFIG !== undefined)
    throw Error("Choose exactly one backend source configuration");
  const oracleMode = env.SHF_ORACLE_CONFIG !== undefined;
  const value: unknown = JSON.parse((oracleMode ? env.SHF_ORACLE_CONFIG : env.SHF_FIXTURE_CONFIG) ?? "null");
  validateEnvironmentProfile(value, env);
  const config = validateRuntimeConfig(value);
  validateLimitedMetadataStartup(env, config);
  if ((config.dataSource === "oracle-read-only") !== oracleMode)
    throw Error("Explicit backend source configuration mismatch");
  return config;
}
