import { pathToFileURL } from "node:url";
import { createRuntime } from "./synthetic-identity.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { validateRaw } from "./contract-validation.mts";
import type { RawShiftDay } from "./contracts.mts";
import { CurrentFixtureReader } from "./current-shifts-fixture.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { loadEnvironmentConfig, RealAuthenticationNotConfiguredError } from "./environment-profiles.mts";
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
import { validateStageArrivalHttpOptions } from "./stage-arrival-http.mts";
import { nativeEnvironment } from "./native-stage-arrival-config.mts";
import type { NativePool } from "./oracle-stage-arrival-uow.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { backendLifecycle, waitForBackendDrain, BackendDrainPendingError } from "./backend-lifecycle.mts";
import { stationMode } from "./station-arrival-validation.mts";
import { createStationArrivalFixture } from "./station-arrival-fixture.mts";
import { stationEnvironment } from "./native-station-arrival-config.mts";

const resources = new WeakMap<Server, Array<OraclePool | NativePool>>();
const shutdowns = new WeakMap<Server, Promise<void>>();
async function closePools(pools: Array<OraclePool | NativePool>) {
  const results = await Promise.allSettled(pools.map(p => p.close()));
  if (results.some(r => r.status === "rejected")) throw Error("Backend pool cleanup failed");
}
export async function stopBackendServer(server: Server) {
  let completion = shutdowns.get(server);
  if (!completion) {
    const lifecycle = backendLifecycle(server);
    lifecycle?.beginShutdown(); // Reject admission and abort pre-COMMIT work.
    const closed = once(server, "close");
    void closed.catch(() => {}); // Owned below; avoid a late unhandled close-error during native drain.
    server.close(); server.closeAllConnections(); // HTTP sockets, NOT Oracle leases.
    completion = (async () => {
      // Request handlers can finish on a race/transport loss while their native
      // promises still run. The lifecycle also owns the underlying budget work.
      await lifecycle?.drain();
      await closed;
      const pools = resources.get(server);
      if (pools) { resources.delete(server); await closePools(pools); }
    })();
    shutdowns.set(server, completion);
  }
  // Bounded caller wait, not a forced native cancellation/release. On timeout
  // the owned completion remains registered, pools stay open until safe drain,
  // and another stop call awaits that same completion.
  await waitForBackendDrain(completion);
}
// Internal typed injection seam for isolated entrypoint tests, never ENV/HTTP.
export interface BackendPoolFactories {
  read(env: OracleEnvironment): Promise<OraclePool>;
  native(env: OracleEnvironment): Promise<NativePool>;
}

// No defaults: executable requires explicit source, isolated synthetic identity and port.
// Oracle credentials are environment-only database configuration, not login passwords.
export async function startFromEnvironment(environment: NodeJS.ProcessEnv, fixtureClock = systemClock,
  factories?: BackendPoolFactories) {
  const oracleMode = environment.SHF_ORACLE_CONFIG !== undefined;
  const config = loadEnvironmentConfig(environment);
  if (config.deploymentClass === "production" || config.authenticationMode !== "synthetic")
    throw new Error("Executable backend requires explicit isolated synthetic mode");
  const stageMode = validateStageArrivalMode(config);
  const station = stationMode(config);
  if (station !== "isolated-fixture" && environment.SHF_STATION_ARRIVAL_FIXTURE !== undefined ||
      station === "disabled" && environment.SHF_STATION_ARRIVAL_ORIGINS !== undefined)
    throw Error("Station inputs require explicit enabled mode");
  let stationArrivalOrigins: readonly string[] | undefined;
  if (environment.SHF_STATION_ARRIVAL_ORIGINS !== undefined) {
    const raw = environment.SHF_STATION_ARRIVAL_ORIGINS;
    if (Buffer.byteLength(raw) > 4096) throw Error("Invalid station origin allowlist");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(o => typeof o !== "string"))
      throw Error("Invalid station origin allowlist");
    const origins: string[] = [];
    for (const origin of parsed) {
      if (typeof origin !== "string") throw Error("Invalid station origin");
      origins.push(origin);
    }
    validateStageArrivalHttpOptions({ stationArrivalOrigins: origins });
    stationArrivalOrigins = Object.freeze(origins);
  }
  const native = nativeEnvironment(environment, stageMode === "test-oracle-controlled");
  const nativeStation = stationEnvironment(environment, station === "test-oracle-controlled");
  if (nativeStation && !stationArrivalOrigins?.length) throw Error("Explicit native station Origin allowlist required");
  let stageArrivalOrigins: readonly string[] | undefined;
  const originsText = environment.SHF_STAGE_ARRIVAL_ORIGINS;
  if (originsText !== undefined) {
    // Deployment-only input. Never infer an allowed frontend Origin from Host,
    // a request, credentials or an Oracle/read-only configuration.
    if (!["isolated-fixture", "test-oracle-controlled"].includes(stageMode) || typeof originsText !== "string" ||
        Buffer.byteLength(originsText, "utf8") > 4096)
      throw new Error("Explicit isolated F1 origin configuration required");
    let parsed: unknown;
    try { parsed = JSON.parse(originsText); }
    catch { throw new Error("Invalid F1 origin allowlist"); }
    if (!Array.isArray(parsed) || parsed.length > 10) throw new Error("Invalid F1 origin allowlist");
    const origins: string[] = [];
    for (const origin of parsed) {
      if (typeof origin !== "string" || origin.length > 128) throw new Error("Invalid F1 origin allowlist");
      origins.push(origin);
    }
    if (new Set(origins).size !== origins.length) throw new Error("Duplicate F1 origins are unsupported");
    validateStageArrivalHttpOptions({ stageArrivalOrigins: origins });
    stageArrivalOrigins = Object.freeze(origins);
  }
  if (native && !stageArrivalOrigins?.length) throw Error("Explicit native frontend Origin allowlist required");
  const portText = oracleMode ? environment.SHF_ORACLE_PORT : environment.SHF_FIXTURE_PORT;
  if (typeof portText !== "string" || !/^(0|[1-9][0-9]{0,4})$/.test(portText) || Number(portText) > 65535)
    throw new Error("Explicit loopback port required");
  let pool: OraclePool | undefined;
  let writePool: NativePool | undefined;
  let runtime;
  try {
    if (config.dataSource === "oracle-read-only") {
      if (environment.SHF_FIXTURE_ROWS !== undefined || environment.SHF_CURRENT_SHIFTS_FIXTURE !== undefined ||
          environment.SHF_SHIFT_SEARCH_FIXTURE !== undefined || environment.SHF_MY_SHIFTS_FIXTURE !== undefined ||
          environment.SHF_SHIFT_ITEMS_FIXTURE !== undefined || environment.SHF_EMPLOYEE_CARD_FIXTURE !== undefined ||
          environment.SHF_ATTENDANCE_FIXTURE !== undefined || environment.SHF_STAGE_ARRIVAL_FIXTURE !== undefined ||
          environment.SHF_STATION_ARRIVAL_FIXTURE !== undefined)
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
      pool = await (factories?.read ?? createOraclePool)(oracleEnvironment(environment));
      const session = new OracleReadSession(pool);
      await session.read(async query => {
        const result = await query("SELECT 1 AS \"probe\" FROM dual", {}, 1);
        if (result.length !== 1) throw new Error("Oracle readiness failed");
      });
      let nativeStageArrival;
      let nativeStationArrival;
      if (native) {
        // Separate account/UoW, never the read pool or injected fixture Clock.
        const [{ createNativePool, OracleStageArrivalUow }, { OracleStageArrivalApplication }] = await Promise.all([
          import("./oracle-stage-arrival-uow.mts"), import("./oracle-stage-arrival-application.mts"),
        ]);
        writePool = await (factories?.native ?? createNativePool)(native.writer);
        const uow = new OracleStageArrivalUow(writePool, session, native.binding);
        await uow.initialize();
        nativeStageArrival = new OracleStageArrivalApplication(uow, native.binding, systemClock,
          config.businessTimeZone, config.syntheticOrgUnitIds);
        // Exact marker/keys/source/window/real Clock checked with a plain-table
        // READ ONLY snapshot BEFORE native capabilities become reachable.
        await nativeStageArrival.assertReady();
      }
      if (nativeStation) {
        const [{ createNativePool }, { OracleStationArrivalUow }, { OracleStationArrivalApplication }] = await Promise.all([
          import("./oracle-stage-arrival-uow.mts"), import("./oracle-station-arrival-uow.mts"),
          import("./oracle-station-arrival-application.mts"),
        ]);
        writePool = await (factories?.native ?? createNativePool)(nativeStation.writer);
        const uow = new OracleStationArrivalUow(writePool, session, nativeStation.binding, config.businessTimeZone);
        await uow.initialize();
        nativeStationArrival = new OracleStationArrivalApplication(uow, nativeStation.binding, systemClock,
          config.businessTimeZone, config.syntheticOrgUnitIds);
        await nativeStationArrival.assertReady();
      }
      runtime = await createRuntime(config, new OracleDetailReader(session), undefined,
        { reader: new OracleCurrentReader(session), searchReader: new OracleSearchReader(session),
          myShiftsReader: new OracleMyShiftsReader(session), shiftItemsReader: new OracleShiftItemsReader(session),
          employeeCardReader: new OracleEmployeeCardReader(session), attendanceReader: new OracleAttendanceReader(session),
          nativeStageArrival, nativeStationArrival });
    } else if (stageMode === "isolated-fixture") {
      if (["SHF_FIXTURE_ROWS", "SHF_CURRENT_SHIFTS_FIXTURE", "SHF_SHIFT_SEARCH_FIXTURE",
        "SHF_MY_SHIFTS_FIXTURE", "SHF_SHIFT_ITEMS_FIXTURE", "SHF_EMPLOYEE_CARD_FIXTURE",
        "SHF_ATTENDANCE_FIXTURE"].some(key => environment[key] !== undefined))
        throw new Error("F1 requires a single coherent fixture snapshot");
      if (station === "isolated-fixture" && environment.SHF_STAGE_ARRIVAL_FIXTURE !== undefined)
        throw Error("Combined station envelope replaces F1 input");
      const f1 = station === "isolated-fixture"
        ? createStationArrivalFixture(JSON.parse(environment.SHF_STATION_ARRIVAL_FIXTURE ?? "null"), fixtureClock, config.businessTimeZone)
        : createStageArrivalFixture(JSON.parse(environment.SHF_STAGE_ARRIVAL_FIXTURE ?? "null"), fixtureClock);
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
    await closePools([...(pool ? [pool] : []), ...(writePool ? [writePool] : [])]).catch(() => {});
    throw error;
  }
  const server = createLoopbackServer(runtime, { stageArrivalOrigins, stationArrivalOrigins });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(Number(portText), "127.0.0.1", () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
  } catch (error) {
    await closePools([...(pool ? [pool] : []), ...(writePool ? [writePool] : [])]).catch(() => {});
    throw error;
  }
  if (pool || writePool) resources.set(server, [...(pool ? [pool] : []), ...(writePool ? [writePool] : [])]);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = await startFromEnvironment(process.env);
    const stop = () => {
      stopBackendServer(server).catch(error => {
        process.stderr.write(error instanceof BackendDrainPendingError
          ? "Backend shutdown pending; native work remains owned\n" : "Backend cleanup failed\n");
        process.exitCode = 1;
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch (error) {
    // Never print configuration, fixtures, authorization or raw exception messages.
    process.stderr.write(error instanceof RealAuthenticationNotConfiguredError
      ? "Backend startup rejected: Real authentication provider not configured\n" : "Backend startup rejected\n");
    process.exitCode = 1;
  }
}
