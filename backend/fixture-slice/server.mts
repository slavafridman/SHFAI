import { pathToFileURL } from "node:url";
import { createRuntime } from "./synthetic-identity.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { validateRaw } from "./contract-validation.mts";
import type { RawShiftDay } from "./contracts.mts";
import { CurrentFixtureReader } from "./current-shifts-fixture.mts";
import { validateRuntimeConfig, oracleEnvironment } from "./runtime-config.mts";
import type { OraclePool } from "./oracle-session.mts";
import type { Server } from "node:http";
import { once } from "node:events";
import { SearchFixtureReader } from "./shift-search-fixture.mts";
import { MyShiftsFixtureReader } from "./my-shifts-fixture.mts";
import { ShiftItemsFixtureReader } from "./shift-items-fixture.mts";
import { EmployeeCardFixtureReader } from "./employee-card-fixture.mts";
import { AttendanceFixtureReader } from "./attendance-fixture.mts";
import { validateStageArrivalMode } from "./stage-arrival-validation.mts";
import { createStageArrivalFixture } from "./stage-arrival-fixture.mts";
import { systemClock } from "./read-current-shifts.mts";

const resources = new WeakMap<Server, OraclePool>();
export async function stopBackendServer(server: Server) {
  const closed = once(server, "close");
  server.close(); server.closeAllConnections();
  await closed;
  const pool = resources.get(server);
  if (pool) { resources.delete(server); await pool.close(); }
}

// No defaults: executable requires explicit source, isolated synthetic identity and port.
// Oracle credentials are environment-only database configuration, not login passwords.
export async function startFromEnvironment(environment: NodeJS.ProcessEnv, fixtureClock = systemClock) {
  if (environment.SHF_ORACLE_CONFIG !== undefined && environment.SHF_FIXTURE_CONFIG !== undefined)
    throw new Error("Choose exactly one backend source configuration");
  const oracleMode = environment.SHF_ORACLE_CONFIG !== undefined;
  const config = validateRuntimeConfig(JSON.parse(
    (oracleMode ? environment.SHF_ORACLE_CONFIG : environment.SHF_FIXTURE_CONFIG) ?? "null"));
  if ((config.dataSource === "oracle-read-only") !== oracleMode)
    throw new Error("Explicit backend source configuration mismatch");
  if (config.deploymentClass === "production" || config.authenticationMode !== "synthetic")
    throw new Error("Executable backend requires explicit isolated synthetic mode");
  const portText = oracleMode ? environment.SHF_ORACLE_PORT : environment.SHF_FIXTURE_PORT;
  if (typeof portText !== "string" || !/^(0|[1-9][0-9]{0,4})$/.test(portText) || Number(portText) > 65535)
    throw new Error("Explicit loopback port required");
  let pool: OraclePool | undefined;
  let runtime;
  try {
    if (config.dataSource === "oracle-read-only") {
      if (environment.SHF_FIXTURE_ROWS !== undefined || environment.SHF_CURRENT_SHIFTS_FIXTURE !== undefined ||
          environment.SHF_SHIFT_SEARCH_FIXTURE !== undefined || environment.SHF_MY_SHIFTS_FIXTURE !== undefined ||
          environment.SHF_SHIFT_ITEMS_FIXTURE !== undefined || environment.SHF_EMPLOYEE_CARD_FIXTURE !== undefined ||
          environment.SHF_ATTENDANCE_FIXTURE !== undefined || environment.SHF_STAGE_ARRIVAL_FIXTURE !== undefined)
        throw new Error("Oracle mode prohibits fixture input");
      // Fixture startup never loads a driver/native client. The existing
      // read-only Oracle path is lazy and still requires its original gates.
      const [{ createOraclePool, OracleReadSession }, { OracleCurrentReader, OracleDetailReader },
        { OracleSearchReader }, { OracleMyShiftsReader }, { OracleShiftItemsReader },
        { OracleEmployeeCardReader }, { OracleAttendanceReader }] = await Promise.all([
        import("./oracle-session.mts"), import("./oracle-readers.mts"), import("./oracle-search-reader.mts"),
        import("./oracle-my-shifts-reader.mts"), import("./oracle-shift-items-reader.mts"),
        import("./oracle-employee-card-reader.mts"), import("./oracle-attendance-reader.mts"),
      ]);
      pool = await createOraclePool(oracleEnvironment(environment));
      const session = new OracleReadSession(pool);
      await session.read(async query => {
        const result = await query("SELECT 1 AS \"probe\" FROM dual", {}, 1);
        if (result.length !== 1) throw new Error("Oracle readiness failed");
      });
      runtime = await createRuntime(config, new OracleDetailReader(session), undefined,
        { reader: new OracleCurrentReader(session), searchReader: new OracleSearchReader(session),
          myShiftsReader: new OracleMyShiftsReader(session), shiftItemsReader: new OracleShiftItemsReader(session),
          employeeCardReader: new OracleEmployeeCardReader(session), attendanceReader: new OracleAttendanceReader(session) });
    } else if (validateStageArrivalMode(config) === "isolated-fixture") {
      if (["SHF_FIXTURE_ROWS", "SHF_CURRENT_SHIFTS_FIXTURE", "SHF_SHIFT_SEARCH_FIXTURE",
        "SHF_MY_SHIFTS_FIXTURE", "SHF_SHIFT_ITEMS_FIXTURE", "SHF_EMPLOYEE_CARD_FIXTURE",
        "SHF_ATTENDANCE_FIXTURE"].some(key => environment[key] !== undefined))
        throw new Error("F1 requires a single coherent fixture snapshot");
      const f1 = createStageArrivalFixture(JSON.parse(environment.SHF_STAGE_ARRIVAL_FIXTURE ?? "null"), fixtureClock);
      runtime = await createRuntime(config, f1.detail, undefined, { reader: f1.current,
        attendanceReader: f1.attendance, stageArrivalStore: f1.store, clock: fixtureClock });
    } else {
      if (environment.SHF_STAGE_ARRIVAL_FIXTURE !== undefined)
        throw new Error("Stage-arrival fixture requires explicit enabled mode");
      const rows: unknown = JSON.parse(environment.SHF_FIXTURE_ROWS ?? "null");
      if (!Array.isArray(rows)) throw new Error("Explicit synthetic fixture rows required");
      const validatedRows: RawShiftDay[] = rows.map((value: unknown) => { validateRaw(value); return value; });
      const itemsReader = environment.SHF_SHIFT_ITEMS_FIXTURE === undefined ? undefined
        : new ShiftItemsFixtureReader(JSON.parse(environment.SHF_SHIFT_ITEMS_FIXTURE));
      itemsReader?.assertDetailCoherence(validatedRows);
      const currentOptions = environment.SHF_CURRENT_SHIFTS_FIXTURE === undefined ? undefined
        : { shiftItemsReader: itemsReader,
          attendanceReader: environment.SHF_ATTENDANCE_FIXTURE === undefined ? undefined
            : new AttendanceFixtureReader(JSON.parse(environment.SHF_ATTENDANCE_FIXTURE)),
          employeeCardReader: environment.SHF_EMPLOYEE_CARD_FIXTURE === undefined ? undefined
            : new EmployeeCardFixtureReader(JSON.parse(environment.SHF_EMPLOYEE_CARD_FIXTURE), config.syntheticOrgUnitIds),
          reader: new CurrentFixtureReader(JSON.parse(environment.SHF_CURRENT_SHIFTS_FIXTURE),
          config.syntheticOrgUnitIds), ...(environment.SHF_SHIFT_SEARCH_FIXTURE === undefined ? {} :
          { searchReader: new SearchFixtureReader(JSON.parse(environment.SHF_SHIFT_SEARCH_FIXTURE)) }),
          ...(environment.SHF_MY_SHIFTS_FIXTURE === undefined ? {} :
          { myShiftsReader: new MyShiftsFixtureReader(JSON.parse(environment.SHF_MY_SHIFTS_FIXTURE)) }) };
      if (environment.SHF_SHIFT_SEARCH_FIXTURE !== undefined && !currentOptions)
        throw new Error("Search fixture requires explicit shared current catalog configuration");
      if (environment.SHF_MY_SHIFTS_FIXTURE !== undefined && !currentOptions)
        throw new Error("Schedule fixture requires explicit shared current catalog configuration");
      if (itemsReader && !currentOptions)
        throw new Error("Shift items fixture requires explicit shared current catalog configuration");
      if (environment.SHF_EMPLOYEE_CARD_FIXTURE !== undefined && !currentOptions)
        throw new Error("Employee card fixture requires explicit shared current catalog configuration");
      if (environment.SHF_ATTENDANCE_FIXTURE !== undefined && !currentOptions)
        throw new Error("Attendance fixture requires explicit shared current catalog configuration");
      runtime = await createRuntime(config, new FixtureReader(validatedRows), undefined, currentOptions);
    }
  } catch (error) {
    if (pool) await pool.close();
    throw error;
  }
  const server = createLoopbackServer(runtime);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(Number(portText), "127.0.0.1", () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
  } catch (error) { if (pool) await pool.close(); throw error; }
  if (pool) resources.set(server, pool);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = await startFromEnvironment(process.env);
    const stop = () => {
      stopBackendServer(server).catch(() => {
        process.stderr.write("Backend cleanup failed\n"); process.exitCode = 1;
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch {
    // Never print configuration, fixtures, authorization or raw exception messages.
    process.stderr.write("Backend startup rejected\n");
    process.exitCode = 1;
  }
}
