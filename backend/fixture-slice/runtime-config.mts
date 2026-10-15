import type { StartupConfig } from "./contracts.mts";
import { record, text, validateConfig } from "./contract-validation.mts";

type OracleMode = { dataSource: "oracle-read-only"; oracleTestScopeConfirmed: true };
export type OracleStartupConfig =
  | (Omit<Extract<StartupConfig, { authenticationMode: "synthetic" }>, "dataSource"> & OracleMode)
  | (Omit<Extract<StartupConfig, { authenticationMode: "real" }>, "dataSource"> & OracleMode);
export type RuntimeConfig = StartupConfig | OracleStartupConfig;
export function validateRuntimeConfig(value: unknown): RuntimeConfig {
  if (!record(value) || value.dataSource !== "oracle-read-only") return validateConfig(value);
  if (value.oracleTestScopeConfirmed !== true || value.deploymentClass === "production")
    throw new Error("Explicit isolated Oracle test scope required");
  const common = validateConfig({ ...value, dataSource: "isolated-fixture" });
  return { ...common, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true };
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
