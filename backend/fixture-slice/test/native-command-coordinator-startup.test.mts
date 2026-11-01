import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { startFromEnvironment } from "../server.mts";
import { startNativeManagement } from "../oracle-shift-management-application.mts";
import { nativeEmployeeScope } from "../native-command-coordinator.mts";
import { NativeOracleDouble, nativeConfig } from "./native-stage-arrival-double.mts";
import { StationOracleDouble, stationConfig } from "./native-station-arrival-double.mts";
import { ExitOracleDouble, exitConfig } from "./native-station-exit-double.mts";
import { syntheticCoordinatorEnvironment } from "./native-coordinator-provision.mts";
import { lateOracleDouble } from "./native-station-arrival-late-double.mts";
import { nativeRuntimeFixture } from "./native-shift-management-runtime-double.mts";
function attendance(kind: "stage" | "station" | "exit") {
  const d = kind === "stage" ? new NativeOracleDouble(true) : kind === "station" ? new StationOracleDouble(true) : new ExitOracleDouble(true);
  const config = kind === "stage" ? nativeConfig : kind === "station" ? stationConfig : exitConfig;
  const prefix = kind.toUpperCase(), flag = `SHF_TEST_ORACLE_${prefix}_WRITE_ENABLED`;
  const env = { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
    SHF_ORACLE_PASSWORD: "synthetic-only", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused",
    [flag]: "true", [`SHF_${prefix === "STAGE" ? "STAGE_ARRIVAL" : prefix === "STATION" ? "STATION_ARRIVAL" : "STATION_EXIT"}_ORIGINS`]:
      '["http://localhost:4521"]',
    [`SHF_NATIVE_${prefix}_CONNECT_STRING`]: "CTIDBT_WFMT", [`SHF_NATIVE_${prefix}_USER`]: d.binding.writeIdentity.user,
    [`SHF_NATIVE_${prefix}_PASSWORD`]: "synthetic-only", [`SHF_NATIVE_${prefix}_CLIENT_LIB_DIR`]: "synthetic-unused",
    [`SHF_NATIVE_${prefix}_BINDING`]: JSON.stringify(d.binding),
    SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: syntheticCoordinatorEnvironment(d.directory, d.binding) };
  return { env, config, binding: d.binding, directory: d.directory,
    close: () => d.dispose(), events: d.events, factories: { read: async () => d.readPool, native: async () => d.writePool } };
}
for (const kind of ["stage", "station", "exit", "late", "management"] as const) {
  test(`global mandatory ${kind}: all missing/malformed/foreign/absent-guard/consumed namespace inputs deny prepool, including profileless/direct`, async () => {
    for (const fault of ["missing", "extra", "duplicate", "relative", "foreign", "missing-guard", "consumed", "profileless"] as const) {
      const late = kind === "late" ? lateOracleDouble(true) : undefined;
      const management = kind === "management" ? await nativeRuntimeFixture("create") : undefined;
      const a = kind === "stage" || kind === "station" || kind === "exit" ? attendance(kind) : undefined;
      const env = a?.env ?? late?.environment() ?? management!.env;
      const directory = a?.directory ?? late?.d.directory ?? management!.directory;
      const employeeId = a?.binding.employeeId ?? late?.binding.employeeId ?? management!.native.source.employeeId;
      const close = () => { a?.close(); late?.d.dispose(); management?.close(); };
      try {
        const coordinatorDirectory = join(directory, "global-coordinator");
        const guard = join(coordinatorDirectory, `employee-${nativeEmployeeScope("synthetic-local-target", employeeId)}.json`);
        if (fault === "missing" || fault === "profileless") delete env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG;
        if (fault === "profileless") delete env.SHF_APP_ENV;
        if (fault === "extra") env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG = JSON.stringify({ directory: coordinatorDirectory, targetScope: "synthetic-local-target", autoReset: true });
        if (fault === "duplicate") env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG = '{"directory":"x","directory":"x","targetScope":"synthetic-local-target"}';
        if (fault === "relative") env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG = '{"directory":".","targetScope":"synthetic-local-target"}';
        if (fault === "foreign") writeFileSync(join(coordinatorDirectory, "namespace.json"), "{}");
        if (fault === "missing-guard") rmSync(guard);
        if (fault === "consumed") writeFileSync(join(coordinatorDirectory,
          `employee-${nativeEmployeeScope("synthetic-local-target", employeeId)}.attempted`), "");
        let pools = 0;
        const factories = { read: async () => { pools++; throw Error("Prepool read bypass"); },
          native: async () => { pools++; throw Error("Prepool write bypass"); }, resolveEndpoint: async () => ["127.0.0.1"] };
        await assert.rejects(startFromEnvironment(env, undefined, factories));
        if (management) await assert.rejects(startNativeManagement(env, management.config, factories));
        assert.equal(pools, 0);
        assert.equal(a?.events.length ?? late?.d.events.length ?? management!.events.length, 0);
      } finally { close(); }
    }
  });
}
