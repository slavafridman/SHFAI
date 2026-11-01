// U52 isolated startup/protocol composition. No inherited ENV, real driver,
// DNS, credentials source, test registration or native operator provisioning.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { BindParameters } from "oracledb";
import { CancellationOracleDouble } from "../../../backend/fixture-slice/test/native-exit-cancellation-double.mts";
import { syntheticCoordinator } from "../../../backend/fixture-slice/test/native-coordinator-provision.mts";
import { startFromEnvironment, stopBackendServer } from "../../../backend/fixture-slice/server.mts";
import { record } from "../../../backend/fixture-slice/contract-validation.mts";
import { cancellationFixtureEnvironment } from "../../../backend/fixture-slice/test/station-exit-cancellation-fixture-environment.mts";
import type { AttendanceFixtureData } from "../../../backend/fixture-slice/attendance-fixture.mts";

export function cancellationNavigationEnvironment(): NodeJS.ProcessEnv {
  const env = cancellationFixtureEnvironment("ready");
  const catalog = {
    mokedUnits: [{ code: "M001", label: "Synthetic parent", unitType: "G01" as const }],
    teams: [{ code: "T001", label: "Synthetic team", unitType: "J01" as const, parentMokedCode: "M001" }],
  };
  // 105 synthetic relational rows exercise a real page boundary. The selected
  // row agrees with the dedicated C52 fixture; reads are not receipt JSON proof.
  const data: AttendanceFixtureData = { catalog, employees: [], days: [], attendance: [],
    activities: [], innerJobs: [], exceptions: [] };
  const employees = [], days = [], attendance = [];
  for (let i = 1; i <= 105; i++) {
    const shiftDayId = String(6100 + i);
    employees.push({ employeeId: String(8900 + i), employeeNumber: String(99000000 + i) + "1",
      firstName: "Synthetic", lastName: "Fixture", teamCode: "T001", innerJobCode: null });
    days.push({ shiftDayId, employeeKey: String(99000000 + i), changedEmployeeKey: null,
      baselineStartLocal: "2026-11-01T11:00:00", changedStartLocal: null,
      baselineEndLocal: "2026-11-01T12:01:00", changedEndLocal: null,
      baselineDayType: 4, changedDayType: null, cancellationReason: null,
      baselineActivityData: null, changedActivityData: null, baselineHome: "N", changedHome: null,
      hasChange: false, baselineSplitEndLocal: null, changedSplitEndLocal: null, exceptionCode: null });
    attendance.push({ shiftDayId, stageArrivalLocal: null, stationArrivalLocal: "2026-11-01T11:00:00",
      stationExitLocal: "2026-11-01T11:59:50", missingReasonCode: null, briefingCode: null });
  }
  env.SHF_ATTENDANCE_FIXTURE = JSON.stringify({ ...data, employees, days, attendance });
  return env;
}

// Extend only the synthetic READ port's missing detail query. Actual
// OracleDetailReader/session/projection/HTTP still execute; no HTTP JSON stub.
class BrowserCancellationDouble extends CancellationOracleDouble {
  protected override async query(sql: string, binds: BindParameters, source: "read" | "write") {
    if (source === "read" && sql.includes('AS "baselineStartLocal"') &&
        sql.includes("d.shf_employee_day_id=TO_NUMBER(:dayId)")) {
      this.sql.push({ sql, binds: structuredClone(binds), source });
      await this.point("read:detail");
      assert(record(binds)); assert.equal(binds.dayId, "6201");
      const e = this.rows.SHF_EMPLOYEES!, d = this.rows.SHF_EMPLOYEE_DAY!, a = this.rows.SHF_ATTENDANCE!;
      return [{ employeeId: e.EMPLOYEE_ID, shiftDayId: d.SHF_EMPLOYEE_DAY_ID,
        firstName: e.FIRST_NAME, lastName: e.LAST_NAME, orgUnitId: e.ORG_UNIT_ID,
        baselineStartLocal: d.WM_SHIFT_START_DATETIME, changedStartLocal: null,
        baselineEndLocal: d.WM_SHIFT_END_DATETIME, changedEndLocal: null,
        baselineActivityData: d.WM_SCH_ACTIVITY_ID_DATA, changedActivityData: null,
        baselineSiteId: d.WM_SITE_ID, changedSiteId: null, stageArrivalLocal: a.STAGE_ARRIVAL_TIME,
        stationArrivalLocal: a.STATION_ARRIVAL_TIME, stationExitLocal: a.STATION_EXIT_TIME }];
    }
    return super.query(sql, binds, source);
  }
}
export type CancellationBrowserFault = "success" | "ack-loss" | "readback-mismatch" | "rollback" | "preconsumed";
export async function startCancellationProtocolWorld(origin: string, fault: CancellationBrowserFault) {
  const d = new BrowserCancellationDouble();
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  const factories = { read: 0, native: 0, endpoint: 0 };
  const files = () => readdirSync(d.directory, { recursive: true }).map(String).sort()
    .filter(n => statSync(join(d.directory, n)).isFile()).map(n => [n, readFileSync(join(d.directory, n))]);
  try {
    // Native uses SYSTEM clock. All changes are pre-certification synthetic
    // provisioning in this world's TEMP; never reset any authority after use.
    const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
    if (now - Date.parse(day + "T00:00:00Z") < 600000 ||
        Date.parse(day + "T23:59:59Z") - now < 1200000)
      throw Error("Native browser world unavailable at UTC boundary; clock is not altered");
    d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME = new Date(now - 2000).toISOString().slice(0, 19);
    d.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = "synthetic-legacy-exit";
    await d.certifyCancellation();
    const coordinator = syntheticCoordinator(d.directory, d.cancellationBinding);
    await coordinator.assertAvailable("9001");
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    assert.equal(existsSync(d.binding.allowanceFile), false); // original F1/exit fuse is not touched
    if (fault === "preconsumed") await coordinator.consume({
      employeeId: "9001", operation: "station-exit", commandId: randomUUID(),
    });
    const authorityBefore = files(), rowsBefore = structuredClone(d.rows);
    const env = d.environment();
    env.SHF_STATION_EXIT_CANCELLATION_ORIGINS = JSON.stringify([origin]);
    const ports = {
      read: async () => { factories.read++; return d.readPool; },
      native: async () => { factories.native++; return d.cancellationWritePool; },
      resolveEndpoint: async () => { factories.endpoint++; throw Error("No DNS in U52 protocol world"); },
    };
    if (fault === "preconsumed") {
      await assert.rejects(startFromEnvironment(env, undefined, ports));
      assert.deepEqual(factories, { read: 0, native: 0, endpoint: 0 });
      assert.deepEqual(files(), authorityBefore); assert.deepEqual(d.rows, rowsBefore);
      d.dispose(); assert.equal(existsSync(d.directory), false);
      return null;
    }
    server = await startFromEnvironment(env, { now: () => new Date("0001-01-01T00:00:00Z") }, ports);
    assert.deepEqual(factories, { read: 1, native: 1, endpoint: 0 });
    const address = server.address(); assert(address && typeof address !== "string");
    const pureOffset = d.events.length;
    return {
      server, port: address.port,
      assertPure() {
        assert.deepEqual(d.rows, rowsBefore); assert.deepEqual(files(), authorityBefore);
        assert.equal(d.events.slice(pureOffset).some(e => e.startsWith("write:")), false);
        assert.equal(d.sql.some(q => /NEXTVAL|FOR UPDATE|\bUPDATE\b/i.test(q.sql)), false);
      },
      armFault() {
        if (fault === "rollback") d.count = 0;
        d.hook = e => {
          if (fault === "ack-loss" && e === "write:commit-ack") throw Error("Synthetic lost ACK");
          if (fault === "readback-mismatch" && e === "write:commit-ack")
            d.rows.SHF_ATTENDANCE!.SYNTHETIC_UNOWNED = "synthetic-drift";
        };
      },
      async assertResult(receipt: unknown) {
        d.hook = undefined;
        assert.equal(d.events.filter(e => e === "write:update").length, 1);
        assert.equal(existsSync(d.cancellationBinding.allowanceFile), true);
        assert.equal(existsSync(d.binding.allowanceFile), false);
        await assert.rejects(coordinator.assertAvailable("9001"));
        const update = d.sql.find(q => q.sql.includes("cancellation:update")); assert(update);
        assert.match(update.sql, /SET\s+STATION_EXIT_TIME=NULL,STATION_EXIT_USER=NULL WHERE/);
        assert.doesNotMatch(update.sql, /\bINSERT\b|NEXTVAL|:actor/);
        const expected = structuredClone(rowsBefore);
        if (fault !== "rollback") {
          expected.SHF_ATTENDANCE!.STATION_EXIT_TIME = null;
          expected.SHF_ATTENDANCE!.STATION_EXIT_USER = null;
        }
        if (fault === "readback-mismatch") expected.SHF_ATTENDANCE!.SYNTHETIC_UNOWNED = "synthetic-drift";
        assert.deepEqual(d.rows, expected);
        if (fault === "success") {
          assert(record(receipt)); assert.equal(receipt.outcome, "oracle-test-committed");
          assert.equal(receipt.dataSource, "oracle-test");
          assert.equal(typeof receipt.commitAcknowledgedAt, "string");
          assert.equal(typeof receipt.readBackVerifiedAt, "string");
          const ack = d.events.indexOf("write:commit-ack");
          const release = d.events.indexOf("write:close:false", ack);
          const read = d.events.indexOf("read:lease", release);
          assert(ack >= 0 && release > ack && read > release);
          assert(d.sql.some(q => q.source === "read" && q.sql === "SET TRANSACTION READ ONLY"));
        } else assert.equal(receipt, undefined);
        const retained = files();
        await assert.rejects(startFromEnvironment(env, undefined, ports));
        assert.deepEqual(factories, { read: 1, native: 1, endpoint: 0 });
        assert.deepEqual(files(), retained); // no retry, rollback or UNKNOWN reset
      },
      async close() {
        d.hook = undefined;
        await stopBackendServer(server!); server = undefined;
        assert(d.events.includes("read:pool-close") && d.events.includes("write:pool-close"));
        d.dispose(); assert.equal(existsSync(d.directory), false);
      },
    };
  } catch (error) {
    if (server) await stopBackendServer(server);
    d.dispose(); throw error;
  }
}
