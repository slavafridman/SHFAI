// Executable isolated fixture composition. Oracle composition lives separately
// and is imported only by an explicitly enabled native startup path.
import { once } from "node:events";
import type { Clock, CurrentShiftReadPort } from "./current-shifts-contracts.mts";
import type { EmployeeShiftDayReader, RawShiftDay } from "./contracts.mts";
import { CurrentFixtureReader } from "./current-shifts-fixture.mts";
import { createIsolatedShiftManagement } from "./shift-management-fixture.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { validateShiftManagementHttpOptions } from "./shift-management-http.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { record, text } from "./contract-validation.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";
import { shiftManagementMode, validateShiftManagementEnvironment } from "./shift-management-config.mts";
import { shiftFail } from "./shift-management-errors.mts";

export function managementOrigins(raw: string | undefined): readonly string[] {
  if (typeof raw !== "string" || Buffer.byteLength(raw) > 4096) throw Error("Explicit management origins required");
  const parsed: unknown = parseStageJson(raw);
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.some(value => typeof value !== "string"))
    throw Error("Explicit management origins required");
  const origins: string[] = [];
  for (const origin of parsed) { if (typeof origin !== "string") throw Error("Invalid management origin"); origins.push(origin); }
  validateShiftManagementHttpOptions({ shiftManagementOrigins: origins });
  return Object.freeze(origins);
}
export function managementPort(raw: string | undefined): number {
  if (typeof raw !== "string" || !/^(?:0|[1-9][0-9]{0,4})$/.test(raw) || Number(raw) > 65535)
    throw Error("Explicit management loopback port required");
  return Number(raw);
}
function fixtureJson(raw: string | undefined): unknown {
  if (typeof raw !== "string" || Buffer.byteLength(raw) > 2097152 || !raw.isWellFormed())
    throw Error("Explicit bounded synthetic management fixture required");
  return parseStageJson(raw);
}
export function managementFixtureAdapters(input: unknown, clock: Clock, zone: string, grants: readonly string[]) {
  if (!exact(input, ["snapshot", "catalog"]) || !exact(input.catalog, ["mokedUnits", "teams"]) ||
      !Array.isArray(input.catalog.mokedUnits) || !Array.isArray(input.catalog.teams) ||
      input.catalog.mokedUnits.some(row => !exact(row, ["code", "label", "unitType"])) ||
      input.catalog.teams.some(row => !exact(row, ["code", "label", "unitType", "parentMokedCode"])))
    throw Error("Exact synthetic management envelope required");
  const fixture = createIsolatedShiftManagement(input.snapshot, clock, zone), catalog = structuredClone(input.catalog);
  const dayType = (value: string) => {
    if (!/^(?:0|[1-9][0-9]{0,8})$/.test(value)) shiftFail("INVALID_SOURCE_DATA");
    return Number(value); // Bounded day-type enum, never an identity conversion.
  };
  const currentReader = () => {
    const snapshot = fixture.inspect().snapshot, e = snapshot.employee;
    return new CurrentFixtureReader({ catalog,
      employees: [{ employeeId: e.employeeId, employeeNumber: e.employeeNumber, firstName: e.firstName,
        lastName: e.lastName, teamCode: e.orgUnitId, innerJobCode: null }],
      days: snapshot.days.map(({ baseline: b, overlay: o }) => ({
        shiftDayId: b.shiftDayId, employeeKey: b.employeeNumber, changedEmployeeKey: o?.employeeNumber ?? null,
        baselineStartLocal: b.startLocal, changedStartLocal: o?.startLocal ?? null,
        baselineEndLocal: b.endLocal, changedEndLocal: o?.endLocal ?? null,
        baselineDayType: dayType(b.dayType), changedDayType: o?.dayType == null ? null : dayType(o.dayType),
        cancellationReason: o?.cancelReasonCode ?? null, baselineActivityData: b.activityCode,
        changedActivityData: o?.activityCode ?? null, baselineHome: b.workFromHome, changedHome: o?.workFromHome ?? null,
      })), attendance: snapshot.days.flatMap(day => {
        if (day.attendance === null) return [];
        for (const name of ["MISS_REASON_ID", "STATION_ARRIVAL_TIME"])
          if (!Object.hasOwn(day.attendance, name)) shiftFail("INVALID_SOURCE_DATA");
        return [{ shiftDayId: day.baseline.shiftDayId, missingReason: day.attendance.MISS_REASON_ID,
          stationArrivalLocal: day.attendance.STATION_ARRIVAL_TIME }];
      }), activities: snapshot.activityOptions, innerJobs: [], missingReasons: [],
    }, grants);
  };
  currentReader(); // Validate the exact configured direct-J01 catalog before listen.
  const current: CurrentShiftReadPort & { dataSource: "isolated-fixture" } = {
    dataSource: "isolated-fixture", readMokedOptions: ids => currentReader().readMokedOptions(ids),
    readRows: selection => currentReader().readRows(selection),
  };
  const detail: EmployeeShiftDayReader & { dataSource: "isolated-fixture" } = {
    dataSource: "isolated-fixture",
    async readByDayId(id) {
      const snapshot = fixture.inspect().snapshot, e = snapshot.employee;
      const day = snapshot.days.find(day => day.baseline.shiftDayId === id);
      if (!day || (day.overlay?.employeeNumber ?? day.baseline.employeeNumber) !== e.employeeNumber.slice(0, 8))
        return { kind: "not-found" };
      const { baseline: b, overlay: o, attendance: a } = day;
      const attendance = (name: string): string | null => {
        if (a === null) return null;
        if (!Object.hasOwn(a, name) || !(a[name] === null || typeof a[name] === "string")) shiftFail("INVALID_SOURCE_DATA");
        return a[name];
      };
      const row: RawShiftDay = { employeeId: e.employeeId, shiftDayId: id, firstName: e.firstName,
        lastName: e.lastName, orgUnitId: e.orgUnitId, baselineStartLocal: b.startLocal, changedStartLocal: o?.startLocal ?? null,
        baselineEndLocal: b.endLocal, changedEndLocal: o?.endLocal ?? null, baselineActivityData: b.activityCode,
        changedActivityData: o?.activityCode ?? null, baselineSiteId: b.siteId, changedSiteId: o?.siteId ?? null,
        stageArrivalLocal: attendance("STAGE_ARRIVAL_TIME"), stationArrivalLocal: attendance("STATION_ARRIVAL_TIME"),
        stationExitLocal: attendance("STATION_EXIT_TIME") };
      return { kind: "one", row };
    },
  };
  return { ...fixture, detail, current };
}
export async function startManagementFixture(env: NodeJS.ProcessEnv, configuration: unknown, clock: Clock) {
  const config = validateRuntimeConfig(configuration);
  if (shiftManagementMode(config) !== "isolated-fixture" || config.authenticationMode !== "synthetic" ||
      validateShiftManagementEnvironment(config, env) !== "isolated-fixture")
    throw Error("Explicit synthetic management fixture mode required");
  const origins = managementOrigins(env.SHF_SHIFT_MANAGEMENT_ORIGINS), port = managementPort(env.SHF_FIXTURE_PORT);
  if (Object.keys(env).some(key => key.startsWith("SHF_FIXTURE_") && !["SHF_FIXTURE_CONFIG", "SHF_FIXTURE_PORT"].includes(key) ||
      key.endsWith("_FIXTURE") && key !== "SHF_SHIFT_MANAGEMENT_FIXTURE" || key === "SHF_ORACLE_CONFIG"))
    throw Error("Management fixture requires one coherent explicit source");
  const f = managementFixtureAdapters(fixtureJson(env.SHF_SHIFT_MANAGEMENT_FIXTURE), clock,
    config.businessTimeZone, config.syntheticOrgUnitIds);
  const runtime = await createRuntime(config, f.detail, undefined, { reader: f.current, clock, shiftManagement: f.app });
  const server = createLoopbackServer(runtime, { shiftManagementOrigins: origins });
  const listening = once(server, "listening");
  server.listen(port, "127.0.0.1"); await listening;
  return server;
}
