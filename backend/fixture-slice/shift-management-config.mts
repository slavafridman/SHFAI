import { record } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import type { ShiftManagementModeV1 } from "./shift-management-contracts.mts";

export function shiftManagementMode(value: unknown): ShiftManagementModeV1 {
  if (!record(value)) throw Error("Explicit backend configuration required");
  if (value.shiftManagement === undefined) return "disabled";
  if (!exact(value.shiftManagement, ["mode"])) throw Error("Exact management configuration required");
  const mode = value.shiftManagement.mode;
  if (mode === "disabled") return mode;
  if (mode !== "isolated-fixture" && mode !== "test-oracle-controlled")
    throw Error("Unsupported management mode");
  if (value.authenticationMode !== "synthetic" || value.syntheticAdministratorEnabled !== true ||
      !["local-development", "isolated-test-demo"].includes(String(value.deploymentClass)) ||
      ["attendanceStageArrivalMode", "attendanceStationArrivalMode", "attendanceStationExitMode"]
        .some(key => value[key] !== undefined && value[key] !== "disabled"))
    throw Error("Explicit exclusive isolated synthetic management mode required");
  if (mode === "isolated-fixture" && value.dataSource !== "isolated-fixture" ||
      mode === "test-oracle-controlled" && (value.dataSource !== "oracle-read-only" ||
        value.deploymentClass !== "isolated-test-demo" || value.oracleTestScopeConfirmed !== true))
    throw Error("Management source and mode must match");
  const allowed = ["deploymentClass", "authenticationMode", "syntheticAdministratorEnabled",
    "syntheticOrgUnitIds", "businessTimeZone", "dataSource", "oracleTestScopeConfirmed",
    "attendanceStageArrivalMode", "attendanceStationArrivalMode", "attendanceStationExitMode", "shiftManagement"];
  if (Object.keys(value).some(key => !allowed.includes(key)))
    throw Error("Unsupported management startup configuration");
  return mode;
}
export function validateShiftManagementEnvironment(config: unknown, env: NodeJS.ProcessEnv): ShiftManagementModeV1 {
  const mode = shiftManagementMode(config), flag = env.SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED;
  if (flag !== undefined && flag !== "false" && flag !== "true")
    throw Error("Exact management native TEST opt-in required");
  const privateInputs = Object.keys(env).some(key => key.startsWith("SHF_NATIVE_SHIFT_") ||
    key === "SHF_SHIFT_MANAGEMENT_FIXTURE" || key === "SHF_SHIFT_MANAGEMENT_ORIGINS");
  if (mode === "disabled" && (flag === "true" || privateInputs))
    throw Error("Management inputs require an explicitly enabled mode");
  if (mode !== "disabled" && env.NODE_ENV === "production")
    throw Error("Production prohibits synthetic management mode");
  if (mode === "isolated-fixture" && (flag === "true" ||
      Object.keys(env).some(key => key.startsWith("SHF_NATIVE_SHIFT_"))))
    throw Error("Isolated management fixture cannot acquire native authority");
  if (mode === "test-oracle-controlled" && (env.SHF_APP_ENV !== "test" ||
      flag !== "true" || env.SHF_SHIFT_MANAGEMENT_FIXTURE !== undefined))
    throw Error("Explicit TEST management environment required");
  return mode;
}
