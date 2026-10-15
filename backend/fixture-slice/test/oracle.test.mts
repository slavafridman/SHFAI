import { test } from "node:test";
import assert from "node:assert/strict";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleCurrentReader, OracleDetailReader } from "../oracle-readers.mts";
import { row } from "./fixtures.mts";
import { SliceError } from "../errors.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { setImmediate as nextTurn } from "node:timers/promises";
import { validateRuntimeConfig, oracleEnvironment } from "../runtime-config.mts";
import { createRuntime } from "../synthetic-identity.mts";
import { config } from "./fixtures.mts";
import type { BindParameters } from "oracledb";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { data } from "./current-fixtures.mts";
import { ReadCurrentShifts } from "../read-current-shifts.mts";
import { principal, at } from "./current-fixtures.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { once } from "node:events";
import { record } from "../contract-validation.mts";
import { startFromEnvironment } from "../server.mts";

// Explicitly isolated infrastructure double; no real provider/Oracle completion.
function mockPool(answer: (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]> = async () => []) {
  const events: string[] = [], statements: Array<{ sql: string; binds: BindParameters; bound: number }> = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      events.push(sql === "SET TRANSACTION READ ONLY" ? "read-only" : "select");
      statements.push({ sql, binds, bound });
      return answer(sql, binds, bound);
    },
    async break() { events.push("break"); }, async rollback() { events.push("rollback"); },
    async close() { events.push("release"); },
  };
  const pool: OraclePool = {
    async getConnection() { events.push("acquire"); return connection; },
    async close() { events.push("pool-close"); },
  };
  return { pool, connection, events, statements, session: new OracleReadSession(pool) };
}
test("Oracle focused session: explicit read-only, bounded select, rollback/finally release on success and failure", async () => {
  for (const fail of [false, true]) {
    const mock = mockPool(async sql => {
      if (sql === "SET TRANSACTION READ ONLY") return [];
      if (fail) throw new Error("sensitive-oracle-message");
      return [{ probe: "1" }];
    });
    if (fail) await assert.rejects(mock.session.read(q => q("SELECT 1 FROM dual", {}, 1)), { code: "DEPENDENCY_UNAVAILABLE" });
    else assert.deepEqual(await mock.session.read(q => q("SELECT 1 FROM dual", {}, 1)), [{ probe: "1" }]);
    assert.deepEqual(mock.events, ["acquire", "read-only", "select", "rollback", "release"]);
    assert.ok(mock.connection.callTimeout > 0 && mock.connection.callTimeout <= 5000);
  }
});

    const teamRow = { grantCode: "T01", teamCode: "T01", teamLabel: "Synthetic team",
      teamType: "J01", code: "01", label: "Synthetic parent", unitType: "G01" };
    const selection = { authorizedTeamUnitIds: ["T01"], attendanceDate: "2024-03-01", currentTime: "00:00",
      mokedCode: null, limit: 25, offset: 0, sort: "effective-start-asc" as const };
    function joined() {
      return { ...row({
        shiftDayId: "1", employeeId: "9007199254740993", orgUnitId: "T01",
        baselineStartLocal: "2024-02-29T23:00:17", baselineEndLocal: "2024-03-01T02:00:19",
        baselineActivityData: "A;UNKNOWN;A", stationArrivalLocal: "2024-02-29T23:00:37",
      }), employeeKey: "TEST0001", changedEmployeeKey: null, employeeNumber: "TEST0001-extra",
        innerJobCode: "J", missingReason: "1", baselineHome: null, changedHome: "Y",
        baselineDayType: 4, changedDayType: null, cancellationReason: null, rowNumber: 1 };
    }
    async function answer(sql: string): Promise<unknown[]> {
      if (sql === "SET TRANSACTION READ ONLY") return [];
      if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
      if (sql.includes('"grantCode"')) return [teamRow];
      if (sql.includes("HAVING COUNT(*) > 1")) return [];
      if (sql.includes("ROW_NUMBER()")) return [joined()];
      if (sql.includes("shf_activity_type")) return [{ code: "A", label: "Synthetic activity" }];
      if (sql.includes("shf_inner_jobs")) return [];
      if (sql.includes("shf_event_reason")) return [{ code: "1", label: "Synthetic reason" }];
      if (sql.includes("ROWNUM <= 2")) return [joined()];
      throw new Error("Unexpected isolated SQL");
    }
    test("Oracle adapters: precision-safe detail and list, bounded SQL scope/window, labels/source semantics", async () => {
      const mock = mockPool(answer);
      const current = new OracleCurrentReader(mock.session);
      assert.deepEqual(await current.readMokedOptions(["T01"]), [{ code: "01", label: "Synthetic parent", unitType: "G01" }]);
      const rows = await current.readRows({ ...selection, mokedCode: "01", limit: 100, offset: 10000 });
      assert.equal(rows.length, 1);
      assert.equal(rows[0].employee.employeeId, "9007199254740993");
      assert.equal(rows[0].startLocal, "2024-02-29T23:00:17");
      assert.equal(rows[0].endLocal, "2024-03-01T02:00:19");
      assert.equal(rows[0].employee.unit.moked.code, "01");
      assert.deepEqual(rows[0].activities, [{ code: "A", label: "Synthetic activity" },
        { code: "UNKNOWN", label: null }, { code: "A", label: "Synthetic activity" }]);
      assert.deepEqual(rows[0].attendanceDisplay, { kind: "missing-reason", reason: { code: "1", label: "Synthetic reason" } });
      assert.equal(rows[0].workingFromHome, true);
      const detail = await new OracleDetailReader(mock.session).readByDayId("1");
      assert.equal(detail.kind, "one");
      if (detail.kind === "one") assert.equal(detail.row.employeeId, "9007199254740993");
      const window = mock.statements.find(s => s.sql.includes("ROW_NUMBER()"));
      assert.ok(window);
      assert.equal(window.bound, 101);
      assert.deepEqual(window.binds, { team0: "T01", parent: "01", dayType: 4,
        at: "2024-03-01T00:00:00", lowerBound: 10000, upperBound: 10101 });
      assert.match(window.sql, /e\.org_unit_id IN \(:team0\)/);
      assert.match(window.sql, /u\.parent_unit=:parent/);
      assert.match(window.sql, /shf_employees e_old/);
      assert.ok(!/wm_site_id|new_site_id|stage_arrival_time|station_exit_time/.test(window.sql));
      assert.match(window.sql, /c\.new_employee_id IS NULL/);
      assert.match(window.sql, /c\.new_employee_id IS NOT NULL/);
      assert.ok(!window.sql.includes("T01") && !window.sql.includes("OFFSET") && !window.sql.includes("FETCH NEXT"));
      for (const s of mock.statements) {
        assert.ok(s.bound <= 1001);
        assert.ok(s.sql === "SET TRANSACTION READ ONLY" || /^\s*SELECT/.test(s.sql));
        assert.ok(!/SHF_INS_AND_RETURN_LASTID|FOR UPDATE|INSERT INTO|DELETE FROM|UPDATE SHIFTER|COMMIT|BEGIN\b/.test(s.sql));
      }
      assert.equal(mock.events.filter(e => e === "acquire").length, 3);
      assert.equal(mock.events.filter(e => e === "rollback").length, 3);
      assert.equal(mock.events.filter(e => e === "release").length, 3);
    });

    test("Oracle ambiguity is checked before any page, including empty/out-of-range offset, same snapshot", async () => {
      const mock = mockPool(async sql => sql.includes("HAVING COUNT(*) > 1") ? [{ ambiguous: 1 }] : answer(sql));
      await assert.rejects(new OracleCurrentReader(mock.session).readRows({ ...selection, offset: 10000 }),
        { code: "AMBIGUOUS_CURRENT_SHIFT" });
      assert.ok(!mock.statements.some(s => s.sql.includes("ROW_NUMBER()")));
      assert.deepEqual(mock.events.slice(-2), ["rollback", "release"]);
      assert.equal(mock.events.filter(e => e === "acquire").length, 1);
    });

    test("Oracle empty real scope has no database access; unauthorized/missing hierarchy never becomes all", async () => {
      const mock = mockPool(answer);
      const reader = new OracleCurrentReader(mock.session);
      assert.deepEqual(await reader.readMokedOptions([]), []);
      assert.deepEqual(await reader.readRows({ ...selection, authorizedTeamUnitIds: [] }), []);
      assert.equal(mock.events.length, 0);
      await assert.rejects(reader.readRows({ ...selection, mokedCode: "02" }), { code: "FORBIDDEN" });
      assert.ok(!mock.statements.some(s => s.sql.includes("HAVING COUNT(*)")));
      for (const invalid of [
        [], [{ ...teamRow, teamType: "G01" }], [{ ...teamRow, unitType: "J01" }],
        [{ ...teamRow, label: "" }], [{ ...teamRow, teamCode: "T02" }], [teamRow, teamRow],
      ]) {
        const bad = mockPool(async sql => sql.includes('"grantCode"') ? invalid : answer(sql));
        await assert.rejects(new OracleCurrentReader(bad.session).readMokedOptions(["T01"]), { code: "INVALID_SOURCE_DATA" });
        assert.deepEqual(bad.events.slice(-2), ["rollback", "release"]);
      }
    });

    test("Oracle detail zero/two rows and invalid source fail explicitly without first-row selection", async () => {
      for (const [rows, expected] of [[[], "not-found"], [[joined(), joined()], "ambiguous"]] as const) {
        const mock = mockPool(async sql => sql.includes("ROWNUM <= 2") ? [...rows] : answer(sql));
        assert.equal((await new OracleDetailReader(mock.session).readByDayId("1")).kind, expected);
      }
      const mock = mockPool(async sql => sql.includes("ROWNUM <= 2")
        ? [{ ...joined(), employeeId: 9007199254740992 }] : answer(sql));
      await assert.rejects(new OracleDetailReader(mock.session).readByDayId("1"), { code: "INVALID_SOURCE_DATA" });
    });

    test("Oracle source/catalog invalid data, duplicate labels, bad era or calendar fail with cleanup", async () => {
      for (const change of ["duplicate-label", "invalid-date", "invalid-reason", "overbound", "calendar"] as const) {
        const mock = mockPool(async (sql, _binds, bound) => {
          if (change === "calendar" && sql.includes("nls_session_parameters")) return [{ calendar: "PERSIAN" }];
          if (change === "duplicate-label" && sql.includes("shf_activity_type"))
            return [{ code: "A", label: "Synthetic" }, { code: "A", label: "Duplicate" }];
          if (sql.includes("ROW_NUMBER()")) {
            if (change === "invalid-date") return [{ ...joined(), baselineStartLocal: "invalid-era" }];
            if (change === "invalid-reason") return [{ ...joined(), missingReason: "-1" }];
            if (change === "overbound") return Array(bound + 1).fill(joined());
          }
          return answer(sql);
        });
        await assert.rejects(new OracleCurrentReader(mock.session).readRows(selection),
          { code: change === "calendar" ? "DEPENDENCY_UNAVAILABLE" : "INVALID_SOURCE_DATA" });
        assert.deepEqual(mock.events.slice(-2), ["rollback", "release"]);
      }
    });

    test("Oracle transaction rejects mutating SQL; acquisition and cleanup failures never yield success", async () => {
      const mock = mockPool();
      await assert.rejects(mock.session.read(q => q("INSERT INTO anything VALUES (1)", {}, 1)), { code: "INTERNAL_ERROR" });
      assert.equal(mock.statements.length, 1); // only SET TRANSACTION
      const brokenPool: OraclePool = {
        async getConnection() { throw new Error("sensitive-pool-error"); }, async close() {},
      };
      await assert.rejects(new OracleReadSession(brokenPool).read(q => q("SELECT 1 FROM dual", {}, 1)),
        { code: "DEPENDENCY_UNAVAILABLE" });
      for (const phase of ["rollback", "close"] as const) {
        const broken = mockPool();
        broken.connection[phase] = async () => { broken.events.push(phase); throw new Error("sensitive-cleanup"); };
        await assert.rejects(broken.session.read(async () => 1), { code: "DEPENDENCY_UNAVAILABLE" });
        assert.ok(broken.events.includes("rollback"));
        assert.ok(broken.events.includes(phase === "close" ? "close" : "release"));
      }
    });

    test("Oracle deadline/abort: break, wait for operation completion, rollback/release; no follow-on SQL", async () => {
      let entered: () => void = () => {}, finish: () => void = () => {};
      const started = new Promise<void>(r => { entered = r; });
      const pending = new Promise<void>(r => { finish = r; });
      const mock = mockPool(async sql => {
        if (sql !== "SET TRANSACTION READ ONLY") { entered(); await pending; }
        return [];
      });
      const abort = new AbortController();
      const operation = withRequestBudget(abort.signal, 5000,
        () => mock.session.read(async q => { await q("SELECT 1 FROM dual", {}, 1); return q("SELECT 2 FROM dual", {}, 1); }));
      await started;
      abort.abort();
      await nextTurn();
      assert.ok(mock.events.includes("break"));
      assert.ok(!mock.events.includes("release"));
      finish();
      await assert.rejects(operation, { code: "DEPENDENCY_TIMEOUT" });
      assert.deepEqual(mock.events.slice(-2), ["rollback", "release"]);
      assert.ok(!mock.statements.some(s => s.sql.includes("SELECT 2")));
      const timed = mockPool(async sql => {
        if (sql !== "SET TRANSACTION READ ONLY") await new Promise(r => setTimeout(r, 40));
        return [];
      });
      await assert.rejects(withRequestBudget(new AbortController().signal, 10,
        () => timed.session.read(q => q("SELECT 1 FROM dual", {}, 1))), { code: "DEPENDENCY_TIMEOUT" });
      assert.ok(timed.events.includes("break"));
      assert.deepEqual(timed.events.slice(-2), ["rollback", "release"]);
    });

    test("Oracle abort during acquisition releases late lease and executes no SELECT/transaction", async () => {
      let release: (connection: OracleConnection) => void = () => {};
      const mock = mockPool();
      const late: OraclePool = {
        getConnection() { return new Promise(r => { release = r; }); }, async close() {},
      };
      const abort = new AbortController();
      const pending = withRequestBudget(abort.signal, 5000,
        () => new OracleReadSession(late).read(q => q("SELECT 1 FROM dual", {}, 1)));
      abort.abort();
      release(mock.connection);
      await assert.rejects(pending, { code: "DEPENDENCY_TIMEOUT" });
      assert.deepEqual(mock.events, ["rollback", "release"]);
    });

    test("Oracle configuration source/test confirmation/secrets fail closed; never fixture/Administrator fallback", async () => {
      const oracle = { ...config, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true };
      assert.equal(validateRuntimeConfig(oracle).dataSource, "oracle-read-only");
      for (const bad of [
        { ...oracle, oracleTestScopeConfirmed: undefined }, { ...oracle, oracleTestScopeConfirmed: "true" },
        { ...oracle, deploymentClass: "production" }, { ...oracle, dataSource: "oracle" },
        { ...oracle, businessTimeZone: "bad/zone" },
      ]) assert.throws(() => validateRuntimeConfig(bad));
      for (const env of [{}, { SHF_ORACLE_CONNECT_STRING: "some-production" }]) assert.throws(() => oracleEnvironment(env));
      await assert.rejects(createRuntime(oracle, new FixtureReader([]), undefined,
        { reader: new CurrentFixtureReader(data()) }));
      const mock = mockPool(answer);
      const current = new OracleCurrentReader(mock.session), detail = new OracleDetailReader(mock.session);
      await assert.rejects(createRuntime(config, detail, undefined, { reader: current }));
      await assert.rejects(createRuntime(oracle, detail));
      await assert.rejects(startFromEnvironment({
        SHF_ORACLE_CONFIG: JSON.stringify(oracle), SHF_ORACLE_PORT: "0",
      })); // missing environment secrets rejected before client/pool creation
      await assert.rejects(startFromEnvironment({
        SHF_ORACLE_CONFIG: JSON.stringify(oracle), SHF_FIXTURE_CONFIG: JSON.stringify(config),
        SHF_ORACLE_PORT: "0",
      }));
    });

    test("Oracle HTTP isolated double: coherent truthful markers for context/list/identity/detail, no source fallback", async () => {
      const mock = mockPool(answer);
      const oracle = { ...config, syntheticOrgUnitIds: ["T01"], dataSource: "oracle-read-only", oracleTestScopeConfirmed: true };
      const rt = await createRuntime(oracle, new OracleDetailReader(mock.session), undefined,
        { reader: new OracleCurrentReader(mock.session) });
      const app = new ReadCurrentShifts(new OracleCurrentReader(mock.session), { now: () => new Date() },
        "UTC", "oracle-read-only");
      assert.equal((await app.list(principal(), at)).dataSource, "oracle-read-only");
      const server = createLoopbackServer(rt);
      server.listen(0, "127.0.0.1"); await once(server, "listening");
      const address = server.address(); assert.ok(address && typeof address !== "string");
      const url = `http://127.0.0.1:${address.port}`;
      try {
        for (const [path, source] of [
          ["/api/v1/identity", "oracle"],
          ["/api/v1/current-shifts/filter-context", "oracle-read-only"],
          ["/api/v1/current-shifts?mode=at&attendanceDate=2024-03-01&currentTime=00:00", "oracle-read-only"],
          ["/api/v1/employees/9007199254740993/shift-days/1", "oracle"],
        ]) {
          const response = await fetch(url + path);
          assert.equal(response.status, 200);
          const dto = await response.json(); assert.ok(record(dto));
          assert.equal(dto.dataSource, source);
        }
      } finally {
        const closed = once(server, "close");
        server.close(); server.closeAllConnections(); await closed;
      }
    });
