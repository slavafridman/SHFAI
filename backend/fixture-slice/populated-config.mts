// M02 isolated composition metadata, not a public DTO or native configuration.
import { record } from "./contract-validation.mts";
import { managementPort, managementOrigins } from "./shift-management-runtime.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";

export type FullTestMode = "READONLY" | "management" | "cancellation";
export const fixtureEpoch = "2026-11-01T12:00:00.123Z";
export const fullEnvironmentKeys = [
  "SHF_FULL_MODE", "SHF_FULL_PROFILE", "SHF_FULL_DEPLOYMENT_CLASS",
  "SHF_FULL_SYNTHETIC_ADMINISTRATOR", "SHF_FULL_PORT", "SHF_FULL_ORIGINS", "NODE_ENV",
] as const;
// Windows Node adds these OS keys even to spawn(..., {env:{}}). They are
// admitted by NAME only at CLI ingress, never read, logged, forwarded as fixture
// configuration, or used to discover files/endpoints. No NODE_OPTIONS allowed.
export const fullWindowsHostKeys = [
  "HOMEDRIVE", "HOMEPATH", "LOGONSERVER", "PATH", "SYSTEMDRIVE", "SYSTEMROOT",
  "TEMP", "USERDOMAIN", "USERNAME", "USERPROFILE", "WINDIR",
] as const;
export interface FullTestOptions {
  profile: string; deploymentClass: string; syntheticAdministratorEnabled: boolean;
  port: number; origins: readonly string[]; environment: NodeJS.ProcessEnv;
}
export function fullConfiguration(mode: unknown, options: unknown) {
  if (typeof mode !== "string" || !["READONLY", "management", "cancellation"].includes(mode) ||
      !record(options) || Object.keys(options).some(k => ![
        "profile", "deploymentClass", "syntheticAdministratorEnabled", "port", "origins", "environment",
      ].includes(k)) ||
      options.profile !== "test" || options.deploymentClass !== "isolated-test-demo" ||
      options.syntheticAdministratorEnabled !== true || !record(options.environment) ||
      !Number.isInteger(options.port) || !Array.isArray(options.origins))
    throw Error("Explicit isolated FULL fixture configuration required");
  const env = options.environment;
  if (Object.keys(env).some(k => !fullEnvironmentKeys.includes(k as typeof fullEnvironmentKeys[number])) ||
      Object.values(env).some(v => typeof v !== "string") ||
      env.NODE_ENV !== undefined && !["development", "test"].includes(String(env.NODE_ENV)))
    throw Error("FULL fixture environment rejected");
  const port = managementPort(String(options.port));
  const origins = managementOrigins(JSON.stringify(options.origins));
  const expected: NodeJS.ProcessEnv = {
    SHF_FULL_MODE: String(mode), SHF_FULL_PROFILE: "test", SHF_FULL_DEPLOYMENT_CLASS: "isolated-test-demo",
    SHF_FULL_SYNTHETIC_ADMINISTRATOR: "true", SHF_FULL_PORT: String(port),
    SHF_FULL_ORIGINS: JSON.stringify(origins),
  };
  if (Object.keys(expected).some(k => env[k] !== undefined &&
      (k === "SHF_FULL_ORIGINS" ? JSON.stringify(managementOrigins(String(env[k]))) !== expected[k] : env[k] !== expected[k])))
    throw Error("FULL fixture environment conflicts with explicit selection");
  // Configuration has exactly one command family. Existing provider owns order/grants.
  const configuration = {
    deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"],
    dataSource: "isolated-fixture", businessTimeZone: "UTC",
    attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
    attendanceStationArrivalLateMode: "disabled", attendanceStationExitMode: "disabled",
    ...(mode === "cancellation" ? { shiftManagementMode: "disabled" } :
      { shiftManagement: { mode: mode === "management" ? "isolated-fixture" : "disabled" } }),
    attendanceStationExitCancellationMode: mode === "cancellation" ? "isolated-fixture" : "disabled",
  };
  const config = validateRuntimeConfig(configuration);
  return { mode: mode as FullTestMode, config, port, origins };
}
export function fullOptionsFromEnvironment(env: NodeJS.ProcessEnv): { mode: unknown; options: FullTestOptions } {
  // No files, credential loader, implicit mock enablement or inherited native options.
  if (Object.keys(env).some(k => !fullEnvironmentKeys.includes(k as typeof fullEnvironmentKeys[number]) &&
      !(process.platform === "win32" && fullWindowsHostKeys.includes(k as typeof fullWindowsHostKeys[number]))))
    throw Error("FULL fixture environment rejected");
  const configurationEnvironment: NodeJS.ProcessEnv = {};
  for (const key of fullEnvironmentKeys) if (env[key] !== undefined) configurationEnvironment[key] = env[key];
  return { mode: env.SHF_FULL_MODE, options: {
    profile: env.SHF_FULL_PROFILE ?? "", deploymentClass: env.SHF_FULL_DEPLOYMENT_CLASS ?? "",
    syntheticAdministratorEnabled: env.SHF_FULL_SYNTHETIC_ADMINISTRATOR === "true",
    port: managementPort(env.SHF_FULL_PORT), origins: managementOrigins(env.SHF_FULL_ORIGINS), environment: configurationEnvironment,
  } };
}
