import test from "node:test";
import assert from "node:assert/strict";
import type { BindParameters } from "oracledb";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleShiftItemsReader } from "../oracle-shift-items-reader.mts";
import { GetSelectedShiftItems } from "../read-shift-items.mts";
import { shiftItemsAccessPolicy } from "../access-policy.mts";
import { sampleConfig, sampleShiftItemsDetailRows, sampleShiftItemsFixture } from "../shift-items-sample.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { itemsProblem } from "../shift-items-errors.mts";
import { record } from "../contract-validation.mts";

const principal = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const request = { employeeId: "9007199254740993", shiftDayId: "1", limit: 2 };
const context = { ...sampleShiftItemsDetailRows[0], employeeReference: "TEST0001-private",
  teamLabel: "צוות", teamType: "J01", parentCode: "01", parentLabel: "מוקד", parentType: "G01", innerJobCode: "00" };
const raw = sampleShiftItemsFixture.items[0];
function mock(answer?: (sql: string, binds: BindParameters) => Promise<unknown[] | undefined>,
  options: { rollbackFailure?: boolean; breakFailure?: boolean; acquisitionFailure?: boolean } = {}) {
  const events: string[] = [], statements: Array<{ sql: string; binds: BindParameters; bound: number }> = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      statements.push({ sql, binds, bound });
      if (sql === "SET TRANSACTION READ ONLY") { events.push("read-only"); return []; }
      const result = await answer?.(sql, binds);
      if (result !== undefined) return result;
      if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
      if (sql.includes('AS "employeeReference"')) return [context];
      if (sql.includes("HAVING COUNT(*)>1")) return [];
      if (sql.includes("ROW_NUMBER()")) return [raw];
      return [];
    },
    async break() { events.push("break"); if (options.breakFailure) throw Error("private"); },
    async rollback() { events.push("rollback"); if (options.rollbackFailure) throw Error("private"); },
    async close(drop) { events.push(drop ? "discard" : "release"); },
  };
  const pool: OraclePool = { async getConnection() {
    events.push("acquire"); if (options.acquisitionFailure) throw Error("private"); return connection;
  }, async close() { events.push("pool-close"); } };
  const reader = new OracleShiftItemsReader(new OracleReadSession(pool));
  const service = new GetSelectedShiftItems(reader, shiftItemsAccessPolicy(sampleConfig), "Asia/Jerusalem");
  return { reader, events, statements, service };
}
test("BRX18-10/11 one readonly lease, full context/probe/page/catalog, parameterized Oracle11 bounded SQL purity", async () => {
  const m = mock();
  const r = await m.service.read(principal, request);
  assert.equal(r.shiftDay.dataSource, "oracle");
  assert.equal(r.items[0].sourceCode, "DEL");
  assert.deepEqual(m.events, ["acquire", "read-only", "rollback", "release"]);
  assert.equal(m.statements.filter(s => s.sql.includes('AS "employeeReference"')).length, 1);
  const contextSQL = m.statements.find(s => s.sql.includes('AS "employeeReference"'))!;
  assert.equal(contextSQL.bound, 2); assert.ok(record(contextSQL.binds));
  assert.equal(contextSQL.binds.dayId, request.shiftDayId);
  assert.doesNotMatch(contextSQL.sql, /employee_id=TO_NUMBER\(:employeeId\)|org_unit_id IN/);
  assert.match(contextSQL.sql, /shf_attendance/); assert.match(contextSQL.sql, /NVL\(c.new_employee_id,d.emp_id_number\)/);
  const probe = m.statements.find(s => s.sql.includes("HAVING COUNT(*)>1"))!;
  const page = m.statements.find(s => s.sql.includes("ROW_NUMBER()"))!;
  assert.ok(m.statements.indexOf(probe) < m.statements.indexOf(page));
  assert.equal(probe.bound, 1); assert.equal(page.bound, 3); assert.ok(record(page.binds));
  assert.equal(page.binds.lowerBound, 0); assert.equal(page.binds.upperBound, 3);
  assert.equal(page.binds.dayId, "1");
  assert.match(probe.sql, /GROUP BY x.agent_day_id,x.start_time/);
  assert.match(page.sql, /x.state_type>0 AND x.cancel_reason_code IS NULL/);
  assert.doesNotMatch(page.sql, /JOIN|source\s*(?:<>|!=)|wm_date|switch_day/i);
  const sql = m.statements.map(s => s.sql).join("\n");
  assert.doesNotMatch(sql, /SELECT\s+\*|DISTINCT|OFFSET|FETCH|FOR UPDATE|INSERT|UPDATE |DELETE|COMMIT|NEXTVAL|SHF_INS|validateUpdate|candidate|_BASE|_OLD/i);
  assert.ok(!sql.includes(context.employeeReference)); assert.ok(!sql.includes(request.employeeId));
  assert.ok(m.statements.every(s => s.bound <= 101));
});
test("BRX18-04 context zero/two/moved/scope denial before item reads, ambiguity cannot be filtered", async () => {
  for (const [rows, code] of [
    [[], "SHIFT_DAY_NOT_FOUND"], [[context, { ...context, employeeId: "2" }], "AMBIGUOUS_SHIFT_DAY"],
    [[{ ...context, employeeId: "2" }], "SHIFT_DAY_NOT_FOUND"],
    [[{ ...context, orgUnitId: "OTHER" }], "SHIFT_DAY_NOT_FOUND"],
  ] as const) {
    const m = mock(async sql => sql.includes('AS "employeeReference"') ? [...rows] : undefined);
    await assert.rejects(m.service.read(principal, request), { code });
    assert.equal(m.statements.some(s => s.sql.includes("shf_employee_exceptions")), false);
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
});
test("BRX18-04 duplicate tuple before off-page and beyond-end page without first-row dedup", async () => {
  const m = mock(async sql => sql.includes("HAVING COUNT(*)>1") ? [{ ambiguous: 1 }] : undefined);
  await assert.rejects(m.service.read(principal, { ...request, offset: 10000 }), { code: "AMBIGUOUS_SHIFT_ITEMS" });
  assert.equal(m.statements.some(s => s.sql.includes("ROW_NUMBER()")), false);
  assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
});
test("BRX18-07 hierarchy malformed and catalog duplicate labels fail safely", async () => {
  for (const patch of [{ teamType: "G01" }, { parentType: "J01" }, { parentLabel: null }, { teamLabel: "" }]) {
    const m = mock(async sql => sql.includes('AS "employeeReference"') ? [{ ...context, ...patch }] : undefined);
    await assert.rejects(m.service.read(principal, request), { code: "INVALID_SOURCE_DATA" });
    assert.equal(m.statements.some(s => s.sql.includes("shf_employee_exceptions")), false);
  }
  const m = mock(async sql => sql.includes("shf_activity_type") ? [{ code: "A", label: "a" }, { code: "A", label: "b" }] : undefined);
  await assert.rejects(m.service.read(principal, request), { code: "INVALID_SOURCE_DATA" });
});
test("BRX18-05/07 scoped type catalogs 2 vs other signed0/-9, labels unknown, no activity fallback", async () => {
  const m = mock(async sql => {
    if (sql.includes("ROW_NUMBER()")) return sampleShiftItemsFixture.items;
    if (sql.includes("shf_exception_type")) return [{ code: "-9", label: "חריגה" }];
    return undefined;
  });
  const r = await m.service.read(principal, { ...request, limit: 3 });
  assert.equal(r.items[1].type?.label, null); assert.equal(r.items[2].type?.label, "חריגה");
  assert.ok(m.statements.some(s => s.sql.includes("shf_timeoff_types") && record(s.binds) && s.binds.code0 === "0"));
  assert.ok(m.statements.some(s => s.sql.includes("shf_exception_type") && record(s.binds) && s.binds.code0 === "-9"));
});
test("BRX18-08 <=101 network rows, scoped page labels exclude lookahead, empty retains context", async () => {
  const m = mock(async sql => sql.includes("ROW_NUMBER()") ? [] : undefined);
  const r = await m.service.read(principal, { ...request, limit: 100, offset: 10000 });
  assert.deepEqual(r.items, []); assert.equal(r.shiftDay.shiftDayId, "1");
  const page = m.statements.find(s => s.sql.includes("ROW_NUMBER()"))!;
  assert.equal(page.bound, 101); assert.ok(record(page.binds)); assert.equal(page.binds.upperBound, 10101);
  const sentinel = mock(async sql => sql.includes("ROW_NUMBER()") ? sampleShiftItemsFixture.items.slice(0, 2) : undefined);
  const result = await sentinel.service.read(principal, { ...request, limit: 1 });
  assert.equal(result.items.length, 1); assert.equal(result.page.hasMore, true);
  assert.equal(sentinel.statements.some(s => s.sql.includes("shf_timeoff_types")), false);
});
test("BRX18-06 NULL duration and non-Gregorian source reject with rollback", async () => {
  for (const [match, values] of [["ROW_NUMBER()", [{ ...raw, durationMinutes: null }]],
    ["nls_session_parameters", [{ calendar: "PERSIAN" }]]] as const) {
    const m = mock(async sql => sql.includes(match) ? [...values] : undefined);
    await assert.rejects(m.service.read(principal, request), { code: match === "ROW_NUMBER()" ? "INVALID_SOURCE_DATA" : "DEPENDENCY_UNAVAILABLE" });
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
});
test("BRX18-09/10 dependency failure is sanitized503, never fixture fallback; rollback failure discards", async () => {
  for (const options of [{ acquisitionFailure: true }, { rollbackFailure: true }]) {
    const m = mock(undefined, options);
    const error = await m.service.read(principal, request).catch(e => e);
    const p = itemsProblem(error, "synthetic-request");
    assert.equal(p.status, 503); assert.equal(p.code, "DEPENDENCY_UNAVAILABLE");
    assert.ok(!JSON.stringify(p).includes("private"));
    if (options.rollbackFailure) assert.deepEqual(m.events.slice(-2), ["rollback", "discard"]);
  }
});
test("BRX18-09/10 native abort awaits operation and break, no follow-on SQL, unsafe lease discarded", async () => {
  const c = new AbortController();
  const m = mock(async sql => {
    if (sql.includes("ROW_NUMBER()")) {
      c.abort(); await new Promise(resolve => setTimeout(resolve, 20)); return [raw];
    }
    return undefined;
  }, { breakFailure: true });
  await assert.rejects(withRequestBudget(c.signal, 1000, () => m.service.read(principal, request, c.signal)),
    { code: "DEPENDENCY_TIMEOUT" });
  assert.deepEqual(m.events, ["acquire", "read-only", "break", "rollback", "discard"]);
  assert.equal(m.statements.some(s => s.sql.includes("shf_activity_type")), false);
});
test("BRX18-02/09 denied capabilities make zero acquisitions; preaborted signal no lease", async () => {
  const m = mock();
  const c = new AbortController(); c.abort();
  await assert.rejects(m.reader.read({ ...request, exactTeamIds: ["T01"], offset: 0, sort: "start-asc" }, c.signal));
  const p = { ...principal, subject: "real:double", provider: "real" as const, synthetic: false,
    employeeId: request.employeeId, capabilities: [] };
  await assert.rejects(m.service.read(p, request), { code: "FORBIDDEN" });
  assert.deepEqual(m.events, []);
});
test("BRX18-10 total deadline interrupts native page and awaits cleanup, no catalogs or late success", async () => {
  const c = new AbortController();
  const m = mock(async sql => {
    if (sql.includes("ROW_NUMBER()")) { await new Promise(resolve => setTimeout(resolve, 60)); return [raw]; }
    return undefined;
  });
  await assert.rejects(withRequestBudget(c.signal, 30, () => m.service.read(principal, request, c.signal)),
    { code: "DEPENDENCY_TIMEOUT" });
  assert.deepEqual(m.events, ["acquire", "read-only", "break", "rollback", "release"]);
  assert.equal(m.statements.some(s => s.sql.includes("shf_activity_type")), false);
});
