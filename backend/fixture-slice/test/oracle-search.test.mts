import { test } from "node:test";
import assert from "node:assert/strict";
import type { BindParameters } from "oracledb";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleSearchReader } from "../oracle-search-reader.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { searchProblem } from "../shift-search-errors.mts";
import { record } from "../contract-validation.mts";

const team = { grantCode: "T01", teamCode: "T01", teamLabel: "צוות", teamType: "J01",
  code: "01", label: "מוקד", unitType: "G01" };
const selection = { authorizedTeamUnitIds: ["T01"], attendanceDate: "2026-10-15", timeFrom: "10:00", timeTo: "10:00",
  mokedCode: null, innerJobCodes: [], workLocations: [], limit: 2, offset: 0, sort: "effective-start-asc" as const };
function joined() {
  return { shiftDayId: "3001", employeeId: "9007199254740993", firstName: "עובד", lastName: "סינתטי", orgUnitId: "T01",
    employeeKey: "TEST0001", changedEmployeeKey: null, employeeNumber: "TEST0001-extra", innerJobCode: "1",
    baselineStartLocal: "2026-10-15T10:00:00", changedStartLocal: null,
    baselineEndLocal: "2026-10-16T01:00:37", changedEndLocal: null,
    baselineActivityData: null, changedActivityData: null, baselineHome: "Y", changedHome: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null, missingReason: null,
    stationArrivalLocal: null, remark: "Y", cancelLoginApplier: "Y", baselineSplit: "Y", changedSplit: null,
    source: "fixture", baselineExtension: "Y", changedExtension: null, exceptionCode: "1" };
}
function mock(answer?: (sql: string, binds: BindParameters) => Promise<unknown[]>,
  cleanupFailure = false, breakFailure = false) {
  const events: string[] = [], statements: Array<{ sql: string; binds: BindParameters; bound: number }> = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      statements.push({ sql, binds, bound });
      if (sql === "SET TRANSACTION READ ONLY") { events.push("read-only"); return []; }
      if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
      if (sql.includes('"grantCode"')) return [team];
      if (answer) return answer(sql, binds);
      if (sql.includes('AS "ambiguous"')) return [];
      if (sql.includes('ROW_NUMBER()')) return [joined()];
      if (sql.includes("shf_exception_type")) return [{ code: "1", label: "חריגה" }];
      if (sql.includes("shf_inner_jobs")) return [{ code: "1", label: "תפקיד" }];
      return [];
    },
    async break() { events.push("break"); if (breakFailure) throw new Error("secret"); },
    async rollback() { events.push("rollback"); if (cleanupFailure) throw new Error("secret"); },
    async close(drop) { events.push(drop ? "discard" : "release"); },
  };
  const pool: OraclePool = { async getConnection() { events.push("acquire"); return connection; }, async close() {} };
  return { events, statements, reader: new OracleSearchReader(new OracleReadSession(pool)), connection };
}
test("SEARCH01 Oracle SQL binds, actual branch predicates, numeric stable Oracle11 pagination <=limit+1 and scoped labels", async () => {
  const m = mock();
  const catalog = await m.reader.readCatalog(["T01"]);
  assert.equal(catalog.innerJobOptions[0].code, "1");
  const rows = await m.reader.readRows({ ...selection, innerJobCodes: ["1"], workLocations: ["home", "site"] });
  assert.equal(rows[0].employee.employeeId, "9007199254740993");
  assert.equal(rows[0].activityFallback?.label, "חריגה");
  assert.equal(rows[0].endLocal, "2026-10-16T01:00:37");
  assert.equal(rows[0].indicators.hasCancelLoginAnnotation, true);
  const page = m.statements.find(s => s.sql.includes("ROW_NUMBER()"))!;
  assert.equal(page.bound, 3);
  assert.ok(record(page.binds)); assert.equal(page.binds.fromLocal, "2026-10-15T10:00:00");
  assert.equal(page.binds.toLocal, "2026-10-15T10:00:00");
  assert.equal(page.binds.upperBound, 3);
  assert.match(page.sql, /UNION ALL/); assert.match(page.sql, /NOT EXISTS/);
  assert.match(page.sql, /e_old\.emp_id_number,1,8\)=c\.new_employee_id/);
  assert.match(page.sql, /a\.miss_reason_id IS NULL/); assert.match(page.sql, /c\.new_day_type=:dayType/);
  assert.match(page.sql, /c\.new_shift_start >=/); assert.match(page.sql, /c\.new_shift_start <=/);
  assert.match(page.sql, /d\.work_from_home IN/); assert.match(page.sql, /c\.new_work_from_home IN/);
  assert.match(page.sql, /e\.inner_job_id IN \(TO_NUMBER\(:role0\)\)/);
  assert.match(page.sql, /ORDER BY "orderStart","orderDay","orderEmployee"/);
  assert.doesNotMatch(page.sql, /OFFSET|FETCH|DISTINCT|e\.active|shf_ins|FOR UPDATE/i);
  assert.equal(m.statements.filter(s => s.sql.includes('AS "ambiguous"')).length, 1);
  assert.ok(m.statements.findIndex(s => s.sql.includes('AS "ambiguous"')) < m.statements.indexOf(page));
  assert.ok(m.statements.every(s => s.bound <= 1001 && (s.sql === "SET TRANSACTION READ ONLY" || /^\s*SELECT/.test(s.sql))));
  assert.deepEqual(m.events, ["acquire", "read-only", "rollback", "release", "acquire", "read-only", "rollback", "release"]);
});
test("SEARCH01 Oracle ambiguity BEFORE empty pagination remains search-specific, rollback/release", async () => {
  const m = mock(async sql => sql.includes('AS "ambiguous"') ? [{ ambiguous: 1 }] : []);
  await assert.rejects(m.reader.readRows({ ...selection, offset: 10000 }), { code: "AMBIGUOUS_SHIFT_SEARCH" });
  assert.equal(m.statements.some(s => s.sql.includes("ROW_NUMBER()")), false);
  assert.deepEqual(m.events, ["acquire", "read-only", "rollback", "release"]);
});
test("SEARCH01 Oracle bounded catalogs reject overflow/duplicates/invalid labels and never broaden empty scope", async () => {
  for (const roles of [Array.from({ length: 1001 }, (_, i) => ({ code: String(i + 1), label: "x" })),
    [{ code: "1", label: "x" }, { code: "1", label: "x" }], [{ code: "1", label: "" }]]) {
    const m = mock(async () => roles);
    await assert.rejects(m.reader.readCatalog(["T01"]), { code: "INVALID_SOURCE_DATA" });
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
  const m = mock();
  assert.equal((await m.reader.readCatalog([])).teamOptions.length, 0);
  assert.deepEqual(await m.reader.readRows({ ...selection, authorizedTeamUnitIds: [] }), []);
  assert.equal(m.statements.length, 0);
});
test("SEARCH01 Oracle failure/invalid source no fallback, sanitized problem and rollback even after mapping failure", async () => {
  for (const answer of [
    async () => { throw new Error("secret SQL password"); },
    async (sql: string) => sql.includes('ROW_NUMBER()') ? [{ ...joined(), employeeId: 9007199254740993 }] : [],
  ]) {
    const m = mock(answer);
    try { await m.reader.readRows(selection); assert.fail("Expected failure"); }
    catch (error) {
      const problem = searchProblem(error, "request");
      assert.ok(["DEPENDENCY_UNAVAILABLE", "INVALID_SOURCE_DATA"].includes(problem.code));
      assert.ok(!JSON.stringify(problem).includes("secret"));
    }
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
});
test("SEARCH01 Oracle cleanup failure discards lease; no success after abort, native break then rollback/release", async () => {
  const unsafe = mock(undefined, true);
  await assert.rejects(unsafe.reader.readRows(selection), { code: "DEPENDENCY_UNAVAILABLE" });
  assert.deepEqual(unsafe.events.slice(-2), ["rollback", "discard"]);
  for (const breakFailure of [false, true]) {
    const controller = new AbortController();
    const m = mock(async sql => {
      if (sql.includes('AS "ambiguous"')) {
        controller.abort(); await new Promise(resolve => setTimeout(resolve, 5));
      }
      return [];
    }, false, breakFailure);
    await assert.rejects(withRequestBudget(controller.signal, 5000, () => m.reader.readRows(selection)),
      { code: "DEPENDENCY_TIMEOUT" });
    assert.deepEqual(m.events.slice(-3), ["break", "rollback", breakFailure ? "discard" : "release"]);
  }
});
