// Owned synthetic protocol composition ONLY: actual HTTP/domain/UoW/coordinator,
// injected read/write ports, real systemClock. No environment/driver/DNS resolution.
// Not startFromEnvironment startup proof or native-live evidence.
import assert from "node:assert/strict";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { lateOracleDouble, lateConfig } from "../../../backend/fixture-slice/test/native-station-arrival-late-double.mts";
import { OracleLateStationArrivalUow } from "../../../backend/fixture-slice/oracle-station-arrival-late-uow.mts";
import { OracleLateStationArrivalApplication } from "../../../backend/fixture-slice/oracle-station-arrival-late-application.mts";
import { OracleReadSession } from "../../../backend/fixture-slice/oracle-session.mts";
import { BoundedLateStationObligations } from "../../../backend/fixture-slice/station-arrival-late-obligations.mts";
import { systemClock } from "../../../backend/fixture-slice/read-current-shifts.mts";
import { createRuntime } from "../../../backend/fixture-slice/synthetic-identity.mts";
import { createLoopbackServer } from "../../../backend/fixture-slice/http-adapter.mts";
import type { EmployeeShiftDayReader } from "../../../backend/fixture-slice/contracts.mts";
import type { AttendanceReadPort, AttendanceRowV1 } from "../../../backend/fixture-slice/attendance-contracts.mts";
import type { CurrentShiftReadPort } from "../../../backend/fixture-slice/current-shifts-contracts.mts";

export async function startLateProtocolWorld(origin: string, fault: "none" | "defer" | "unknown" = "none") {
  const f = lateOracleDouble(true), { d, binding, coordinator } = f;
  // Fresh synthetic world with adequate future end; real application Clock is not replaced.
  const now = Date.now(), midnight = Date.parse(new Date(now).toISOString().slice(0, 10) + "T00:00:00Z");
  if (now - midnight < 120000 || midnight + 86400000 - now < 3600000) {
    d.dispose(); throw Error("Native browser case deferred at UTC date boundary; no clock alteration");
  }
  d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME = new Date(now - 90000).toISOString().slice(0, 19);
  const before = structuredClone(d.rows);
  const parent = { code: "M001", label: "מוקד פרוטוקול סינתטי", unitType: "G01" as const };
  const row = (): AttendanceRowV1 => ({
    shiftDayId: "6201", employee: { employeeId: "9001", firstName: "עובד/ת", lastName: "PROTOCOL DOUBLE",
      unit: { code: "T001", label: "צוות פרוטוקול סינתטי", moked: parent } },
    planned: { startLocal: d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME!,
      endLocal: d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME!, workingFromHome: false,
      activities: [], activityFallback: null, innerJob: null },
    attendance: { stageArrivalLocal: d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_TIME,
      stationArrivalLocal: d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME,
      stationExitLocal: d.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME, missingReasonCode: null, briefingRecorded: null },
  });
  const detail: EmployeeShiftDayReader & { dataSource: "oracle" } = {
    dataSource: "oracle", readByDayId: async day => day !== "6201" ? { kind: "not-found" } : { kind: "one", row: {
      shiftDayId: "6201", employeeId: "9001", firstName: "עובד/ת", lastName: "PROTOCOL DOUBLE", orgUnitId: "T001",
      baselineStartLocal: row().planned.startLocal, changedStartLocal: null, baselineEndLocal: row().planned.endLocal,
      changedEndLocal: null, baselineActivityData: null, changedActivityData: null, baselineSiteId: null,
      changedSiteId: null, stageArrivalLocal: null, stationArrivalLocal: row().attendance.stationArrivalLocal, stationExitLocal: null,
    } },
  };
  const current: CurrentShiftReadPort & { dataSource: "oracle-read-only" } = {
    dataSource: "oracle-read-only", readMokedOptions: async () => [parent], readRows: async () => [],
  };
  const attendance: AttendanceReadPort = {
    dataSource: "oracle-read-only", readContext: async () => ({ mokedOptions: [parent],
      teamOptions: [{ code: "T001", label: "צוות פרוטוקול סינתטי", unitType: "J01", parentMokedCode: "M001" }],
      innerJobOptions: [], workLocationOptions: [{ code: "home", label: "בית" }, { code: "site", label: "אתר" }] }),
    read: async s => s.offset === 0 && s.attendanceDate === row().planned.startLocal!.slice(0, 10) &&
      s.authorizedTeamUnitIds.includes("T001") ? [row()] : [],
  };
  let server: ReturnType<typeof createLoopbackServer> | undefined;
  let release: (() => void) | undefined;
  try {
    const uow = new OracleLateStationArrivalUow(d.writePool, new OracleReadSession(d.readPool), binding, "UTC", coordinator);
    await uow.initialize();
    const app = new OracleLateStationArrivalApplication(uow, binding, systemClock, "UTC", ["T001"],
      fault === "defer" ? { assess: () => ({ state: "unknown", effects: [] }) } : new BoundedLateStationObligations());
    const runtime = await createRuntime(lateConfig, detail, undefined, {
      reader: current, clock: systemClock, attendanceReader: attendance, nativeLateStationArrival: app,
    });
    server = createLoopbackServer(runtime, { stationArrivalLateOrigins: [origin] });
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address(); assert(address && typeof address !== "string");
    return {
      origin: `http://127.0.0.1:${address.port}`, date: row().planned.startLocal!.slice(0, 10),
      inspect: () => ({ events: [...d.events], committed: d.committed, sql: structuredClone(d.sql),
        rows: structuredClone(d.rows), before, allowanceConsumed: existsSync(binding.allowanceFile) }),
      assertPure() {
        assert.equal(d.committed, false); assert.equal(existsSync(binding.allowanceFile), false);
        assert.deepEqual(d.rows, before); assert(!d.sql.some(q => /^\s*(UPDATE|INSERT|DELETE|MERGE)/i.test(q.sql.replace(/\/\*.*?\*\//gs, ""))));
      },
      hold() {
        const gate = new Promise<void>(r => { release = r; });
        d.hook = event => event === "write:update" ? gate : undefined;
      },
      release() {
        if (fault === "unknown") d.hook = event => { if (event === "write:commit-ack") throw Error("Synthetic lost ACK"); };
        else d.hook = undefined;
        release?.(); release = undefined;
      },
      assertSuccess() {
        assert.equal(d.committed, true); assert.equal(existsSync(binding.allowanceFile), true);
        const writes = d.sql.filter(q => /^\s*UPDATE/i.test(q.sql.replace(/\/\*.*?\*\//gs, "")));
        assert.equal(writes.length, 1);
        const set = writes[0]!.sql.split(/\bSET\b/i)[1]!.split(/\bWHERE\b/i)[0]!;
        assert.deepEqual([...set.replace(/'(?:''|[^'])*'/g, "''").matchAll(/([A-Z_]+)\s*=/g)].map(m => m[1]).sort(),
          ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"].sort());
        assert(Number(d.rows.SHF_ATTENDANCE!.LATE_MINUTES) >= 1);
        const retained = structuredClone(d.rows.SHF_ATTENDANCE);
        for (const field of ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"])
          retained![field] = before.SHF_ATTENDANCE![field];
        assert.deepEqual(retained, before.SHF_ATTENDANCE);
        for (const table of Object.keys(before).filter(t => t !== "SHF_ATTENDANCE")) assert.deepEqual(d.rows[table], before[table]);
        assert(d.events.indexOf("write:commit") >= 0);
        assert(d.events.some((e, i) => i > d.events.indexOf("write:commit") && e.startsWith("read:")));
      },
      async assertFence(principal: Parameters<typeof app.context>[0]) {
        await assert.rejects(app.context(principal, { employeeId: "9001", shiftDayId: "6201" }));
      },
      async close() {
        release?.();
        server!.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve()));
        await d.readPool.close(); await d.writePool.close(); d.dispose();
      },
    };
  } catch (error) {
    release?.();
    if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); }
    await d.readPool.close(); await d.writePool.close(); d.dispose(); throw error;
  }
}
