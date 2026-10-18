import test from "node:test";
import assert from "node:assert/strict";
import type { BindParameters } from "oracledb";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleMyShiftsReader } from "../oracle-my-shifts-reader.mts";
import { ReadMyShifts } from "../read-my-shifts.mts";
import { myShiftsAccessPolicy } from "../access-policy.mts";
import { sampleConfig } from "../my-shifts-sample.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { myShiftsProblem } from "../my-shifts-errors.mts";
import { record } from "../contract-validation.mts";

const principal = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const request = { mode: "selected" as const, employeeId: "9007199254740993",
  dateFrom: "2024-02-29", dateTo: "2024-03-01", limit: 2 };
const actor = { employeeId: request.employeeId, firstName: "עובד", lastName: "סינתטי",
  actorReference: "TEST0001-private", teamCode: "T01", teamLabel: "צוות סינתטי", teamType: "J01",
  parentCode: "01", parentLabel: "מוקד סינתטי", parentType: "G01" };
const row = { shiftDayId: "1", startLocal: "2024-02-29T23:30:37", endLocal: "2024-03-01T01:00:19", activityData: "1;UNKNOWN;1" };
function mock(answer?: (sql: string, binds: BindParameters) => Promise<unknown[] | undefined>,
  options: { rollbackFailure?: boolean; breakFailure?: boolean; closeFailure?: boolean; acquisitionFailure?: boolean } = {}) {
  const events: string[] = [], statements: Array<{ sql: string; binds: BindParameters; bound: number }> = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      statements.push({ sql, binds, bound });
      if (sql === "SET TRANSACTION READ ONLY") { events.push("read-only"); return []; }
      const result = await answer?.(sql, binds);
      if (result !== undefined) return result;
      if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
      if (sql.includes('AS "actorReference"')) return [actor];
      if (sql.includes('MAX("orphan")')) return [];
      if (sql.includes("ROW_NUMBER()")) return [row];
      if (sql.includes("shf_activity_type")) return [{ code: "1", label: "פעילות" }];
      return [];
    },
    async break() { events.push("break"); if (options.breakFailure) throw Error("secret"); },
    async rollback() { events.push("rollback"); if (options.rollbackFailure) throw Error("secret"); },
    async close(drop) { events.push(drop ? "discard" : "release"); if (options.closeFailure) throw Error("secret"); },
  };
  const pool: OraclePool = { async getConnection() {
    events.push("acquire"); if (options.acquisitionFailure) throw Error("secret"); return connection;
  }, async close() { events.push("pool-close"); } };
  const reader = new OracleMyShiftsReader(new OracleReadSession(pool));
  return { reader, events, statements, service: new ReadMyShifts(reader, myShiftsAccessPolicy(sampleConfig),
    { now: () => new Date("2024-02-29T00:00:00Z") }, "Asia/Jerusalem", "oracle-read-only") };
}
test("MY18-05/09/10 Oracle one snapshot actor/probe/page/labels, bounded binds and pure Oracle11 SQL", async () => {
  const m = mock();
  const result = await m.service.list(principal, request);
  assert.equal(result.items[0].employee.employeeId, request.employeeId);
  assert.equal(result.items[0].endLocal, row.endLocal);
  assert.deepEqual(result.items[0].activities.map(a => a.label), ["פעילות", null, "פעילות"]);
  assert.equal(result.dataSource, "oracle-read-only");
  assert.deepEqual(m.events, ["acquire", "read-only", "rollback", "release"]);
  assert.equal(m.statements.filter(s => s.sql.includes('AS "actorReference"')).length, 1);
  const actorQuery = m.statements.find(s => s.sql.includes('AS "actorReference"'))!;
  assert.equal(actorQuery.bound, 2); assert.ok(record(actorQuery.binds));
  assert.equal(actorQuery.binds.employeeId, request.employeeId); assert.equal(actorQuery.binds.team0, "T01");
  const probe = m.statements.find(s => s.sql.includes('MAX("orphan")'))!;
  const page = m.statements.find(s => s.sql.includes("ROW_NUMBER()"))!;
  assert.ok(m.statements.indexOf(probe) < m.statements.indexOf(page)); assert.equal(probe.bound, 1);
  assert.equal(page.bound, 3); assert.ok(record(page.binds));
  assert.equal(page.binds.actorReference, actor.actorReference); assert.equal(page.binds.actorPrefix, "TEST0001");
  assert.equal(page.binds.fromLocal, "2024-02-29T00:00:00"); assert.equal(page.binds.toLocal, "2024-03-01T23:59:59");
  assert.equal(page.binds.lowerBound, 0); assert.equal(page.binds.upperBound, 3);
  assert.match(page.sql, /NOT EXISTS/); assert.match(page.sql, /UNION ALL/);
  assert.match(page.sql, /c\.new_day_type=:dayType/); assert.match(page.sql, /c\.new_shift_start >=/);
  assert.match(page.sql, /c\.new_employee_id=:actorPrefix/); assert.match(page.sql, /c\.cancel_reason_code IS NULL/);
  assert.match(page.sql, /NVL\(c\.new_shift_end,d\.wm_shift_end_datetime\)/);
  assert.match(page.sql, /ORDER BY "orderStart","orderDay","orderEmployee"/);
  assert.ok(m.statements.every(s => s.bound <= 1001));
  const sql = m.statements.map(s => s.sql).join("\n");
  assert.doesNotMatch(sql, /shf_attendance|cancel_login|miss_reason|e\.active|DISTINCT|OFFSET|FETCH|FOR UPDATE|INSERT|UPDATE |DELETE|SHF_INS|NEXTVAL|SHF_[A-Z]+\(/i);
  assert.ok(!sql.includes(actor.actorReference)); assert.ok(!sql.includes(request.employeeId));
});
test("MY18-03 Oracle actor uniqueness, exact J01/G01 labels, nonleak missing actors and empty grants", async () => {
  for (const values of [[], [{ ...actor, teamType: "G01" }], [{ ...actor, parentType: "J01" }],
    [{ ...actor, teamLabel: "" }], [{ ...actor, parentLabel: null }]]) {
    const m = mock(async sql => sql.includes('AS "actorReference"') ? values : undefined);
    await assert.rejects(m.service.list(principal, request), { code: "FORBIDDEN" });
    assert.equal(m.statements.some(s => s.sql.includes("ROW_NUMBER()")), false);
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
  const ambiguous = mock(async sql => sql.includes('AS "actorReference"') ? [actor, actor] : undefined);
  await assert.rejects(ambiguous.service.list(principal, request), { code: "INVALID_SOURCE_DATA" });
  const m = mock();
  assert.equal(await m.reader.readEmployeeContext(request.employeeId, []), null);
  assert.equal(m.statements.length, 1); // snapshot setup only; no hierarchy/actor lookup.
});
test("MY18-07 Oracle ambiguity and orphan failures precede off-page and empty page, without dedup", async () => {
  for (const orphan of [0, 1]) {
    const m = mock(async sql => sql.includes('MAX("orphan")') ? [{ orphan, multiplicity: 2 }] : undefined);
    await assert.rejects(m.service.list(principal, { ...request, offset: 10000 }),
      { code: orphan ? "INVALID_SOURCE_DATA" : "AMBIGUOUS_MY_SHIFTS" });
    assert.equal(m.statements.some(s => s.sql.includes("ROW_NUMBER()")), false);
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
});
test("MY18-08/09 Oracle <=101 page and scoped label lookup, null end, duplicate catalog rejection", async () => {
  const m = mock(async sql => sql.includes("ROW_NUMBER()") ? [{ ...row, endLocal: null }] : undefined);
  const r = await m.service.list(principal, { ...request, limit: 100 });
  assert.equal(r.items[0].endLocal, null); assert.equal(m.statements.find(s => s.sql.includes("ROW_NUMBER()"))!.bound, 101);
  const catalog = m.statements.find(s => s.sql.includes("shf_activity_type"))!;
  assert.equal(catalog.bound, 3); assert.ok(record(catalog.binds));
  assert.deepEqual(Object.values(catalog.binds).sort(), [3, "1", "UNKNOWN"].sort());
  const dup = mock(async sql => sql.includes("shf_activity_type") ? [{ code: "1", label: "a" }, { code: "1", label: "b" }] : undefined);
  await assert.rejects(dup.service.list(principal, request), { code: "INVALID_SOURCE_DATA" });
});
test("MY18-08/10 Oracle source corruption/errors never fallback or leak SQL/reference", async () => {
  for (const answer of [
    async (sql: string) => { if (sql.includes("ROW_NUMBER()")) throw Error("secret SQL password"); return undefined; },
    async (sql: string) => sql.includes("ROW_NUMBER()") ? [{ ...row, shiftDayId: 1 }] : undefined,
    async (sql: string) => sql.includes("ROW_NUMBER()") ? [{ ...row, endLocal: "2020-01-01T00:00:00" }] : undefined,
    async (sql: string) => sql.includes("ROW_NUMBER()") ? Array(4).fill(row) : undefined,
    async (sql: string) => sql.includes("nls_session_parameters") ? [{ calendar: "OTHER" }] : undefined,
  ]) {
    const m = mock(answer);
    try { await m.service.list(principal, request); assert.fail("expected failure"); }
    catch (error) {
      const p = myShiftsProblem(error, "request");
      assert.ok(["DEPENDENCY_UNAVAILABLE", "INVALID_SOURCE_DATA"].includes(p.code));
      assert.doesNotMatch(JSON.stringify(p), /secret|TEST0001|SELECT/);
    }
    assert.deepEqual(m.events.slice(-2), ["rollback", "release"]);
  }
});
test("MY18-10 Oracle actor/page abort waits for native break and cleanup; unsafe lease discarded", async () => {
  for (const phase of ['AS "actorReference"', "ROW_NUMBER()"]) {
    for (const breakFailure of [false, true]) {
      const controller = new AbortController();
      const m = mock(async sql => {
        if (sql.includes(phase)) { controller.abort(); await new Promise(resolve => setTimeout(resolve, 10)); }
        return undefined;
      }, { breakFailure });
      await assert.rejects(withRequestBudget(controller.signal, 5000, () => m.service.list(principal, request)),
        { code: "DEPENDENCY_TIMEOUT" });
      assert.deepEqual(m.events.slice(-3), ["break", "rollback", breakFailure ? "discard" : "release"]);
    }
  }
  for (const option of [{ rollbackFailure: true }, { closeFailure: true }, { acquisitionFailure: true }]) {
    const m = mock(undefined, option);
    await assert.rejects(m.service.list(principal, request), { code: "DEPENDENCY_UNAVAILABLE" });
    if (option.rollbackFailure) assert.equal(m.events.at(-1), "discard");
  }
});
test("MY18-10 permission/null-link failures make zero Oracle calls; no fallback on context dependency failure", async () => {
  const m = mock();
  await m.service.context(principal, { mode: "self" });
  await assert.rejects(m.service.list(principal, { mode: "self", dateFrom: request.dateFrom, dateTo: request.dateTo }),
    { code: "EMPLOYEE_CONTEXT_REQUIRED" });
  await assert.rejects(m.service.context({ ...principal, synthetic: false, provider: "real", subject: "isolated:real",
    employeeId: null, capabilities: [], roles: [] }, { mode: "self" }), { code: "FORBIDDEN" });
  assert.equal(m.events.length, 0);
  const failed = mock(async sql => { if (sql.includes('AS "actorReference"')) throw Error("secret"); return undefined; });
  await assert.rejects(failed.service.context(principal, { mode: "selected", employeeId: request.employeeId }),
    { code: "DEPENDENCY_UNAVAILABLE" });
  assert.deepEqual(failed.events.slice(-2), ["rollback", "release"]);
});
