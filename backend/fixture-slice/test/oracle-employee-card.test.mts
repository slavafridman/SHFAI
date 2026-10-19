import test from "node:test";
import assert from "node:assert/strict";
import type { BindParameters } from "oracledb";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleEmployeeCardReader, employeeCardSql, employeeJobLabelSql } from "../oracle-employee-card-reader.mts";
import { GetEmployeeOperationalCard } from "../read-employee-card.mts";
import { employeeCardAccessPolicy } from "../access-policy.mts";
import { sampleConfig } from "../employee-card-sample.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { record } from "../contract-validation.mts";

const id = "9007199254740993";
const actor = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const employee = { employeeId: id, firstName: "דנה", lastName: "לוי", orgUnitId: "T01",
  jobCode: "11", innerJobCode: "101" };
const team = { grantCode: "T01", teamCode: "T01", teamLabel: "צוות", teamType: "J01",
  code: "01", label: "מוקד", unitType: "G01" };
function mock(answer?: (sql: string, binds: BindParameters) => Promise<unknown[] | undefined>,
  options: { rollbackFailure?: boolean; breakFailure?: boolean; acquisitionFailure?: boolean;
    delayedAcquisition?: boolean } = {}) {
  const events: string[] = [], statements: Array<{ sql: string; binds: BindParameters; bound: number }> = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      statements.push({ sql, binds, bound });
      if (sql === "SET TRANSACTION READ ONLY") { events.push("snapshot"); return []; }
      const result = await answer?.(sql, binds); if (result !== undefined) return result;
      if (sql === employeeCardSql) return [employee];
      if (sql.includes('AS "grantCode"')) return [team];
      if (sql === employeeJobLabelSql) return [{ code: "11", label: " תפקיד " }];
      if (sql.includes("shf_inner_jobs")) return [{ code: "101", label: "" }];
      throw Error("unexpected SQL");
    },
    async break() { events.push("break"); if (options.breakFailure) throw Error("private"); },
    async rollback() { events.push("rollback"); if (options.rollbackFailure) throw Error("private"); },
    async close(drop) { events.push(drop ? "discard" : "release"); },
  };
  const pool: OraclePool = { async getConnection() {
    events.push("acquire"); if (options.acquisitionFailure) throw Error("private");
    if (options.delayedAcquisition) await new Promise(r => setTimeout(r, 30));
    return connection;
  }, async close() { events.push("pool-close"); } };
  const reader = new OracleEmployeeCardReader(new OracleReadSession(pool));
  const app = new GetEmployeeOperationalCard(reader, employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
  return { reader, app, events, statements };
}
test("EC18-11/12 Oracle one readonly snapshot, precise binds/six employee columns and bounded scoped labels", async () => {
  const m = mock(); const r = await m.app.execute(actor, { employeeId: id });
  assert.equal(r.employee.job?.label, "תפקיד"); assert.equal(r.employee.innerJob?.label, null);
  assert.equal(r.dataSource, "oracle-read-only");
  assert.deepEqual(m.events, ["acquire", "snapshot", "rollback", "release"]);
  assert.equal(m.statements.length, 5);
  const lookup = m.statements[1]; assert.equal(lookup.bound, 2);
  assert.ok(record(lookup.binds)); assert.equal(lookup.binds.employeeId, id);
  assert.doesNotMatch(lookup.sql, /status_id|DISTINCT|JOIN|e\.\*/i);
  const all = m.statements.map(v => v.sql).join("\n");
  assert.doesNotMatch(all, /emp_id_number|manager|birth|hire|phone|email|address|photo|attendance|employee_day|day_changes|site|SELECT\s+e\.\*|INSERT|DELETE|COMMIT|NEXTVAL|FOR UPDATE|OFFSET|FETCH|SHF_INS/i);
  assert.match(employeeJobLabelSql, /GROUP BY e.job_id,e.job_name/);
  assert.match(employeeJobLabelSql, /e.job_id>0 AND e.status_id=:activeStatus/);
  assert.ok(!all.includes(id)); assert.ok(m.statements.every(s => s.bound <= 101));
  const job = m.statements.find(s => s.sql === employeeJobLabelSql)!;
  assert.equal(job.bound, 2); assert.ok(record(job.binds)); assert.equal(job.binds.activeStatus, 3);
  assert.doesNotMatch(m.statements.at(-1)!.sql, /active|org_unit|status_id/i);
});
test("EC18-04/06 Oracle missing/private duplicate404 or admitted duplicate500 before catalog bodies", async () => {
  for (const [rows, code] of [
    [[], "EMPLOYEE_NOT_FOUND"], [[{ ...employee, orgUnitId: null }], "EMPLOYEE_NOT_FOUND"],
    [[employee, { ...employee, orgUnitId: "T02" }], "EMPLOYEE_NOT_FOUND"],
    [[employee, employee], "AMBIGUOUS_EMPLOYEE"],
  ] as const) {
    const m = mock(async sql => sql === employeeCardSql ? [...rows] : undefined);
    await assert.rejects(m.app.execute(actor, { employeeId: id }), { code });
    assert.equal(m.statements.length, 2);
    assert.deepEqual(m.events, ["acquire", "snapshot", "rollback", "release"]);
  }
});
test("EC18-07/09 Oracle 38-digit and negative codes, no active label fallback or selected-employee exclusion", async () => {
  const precise = "9".repeat(38);
  const m = mock(async sql => sql === employeeCardSql
    ? [{ ...employee, employeeId: precise, jobCode: "-9", innerJobCode: null }] : undefined);
  const r = await m.app.execute(actor, { employeeId: precise });
  assert.equal(r.employeeId, precise); assert.deepEqual(r.employee.job, { code: "-9", label: null });
  assert.equal(m.statements.length, 3);
  const absent = mock(async sql => sql === employeeJobLabelSql ? [] : undefined);
  assert.equal((await absent.app.execute(actor, { employeeId: id })).employee.job?.label, null);
});
test("EC18-06/07/09 Oracle duplicate grouped labels/inner jobs/hierarchy and malformed source reject500", async () => {
  for (const answer of [
    async (s: string) => s === employeeJobLabelSql ? [{ code: "11", label: "A" }, { code: "11", label: null }] : undefined,
    async (s: string) => s.includes("shf_inner_jobs") ? [{ code: "101", label: "A" }, { code: "101", label: "A" }] : undefined,
    async (s: string) => s.includes('AS "grantCode"') ? [team, team] : undefined,
    async (s: string) => s.includes('AS "grantCode"') ? [{ ...team, code: "T01" }] : undefined,
    async (s: string) => s === employeeCardSql ? [{ ...employee, jobCode: "1.5" }] : undefined,
    async (s: string) => s === employeeCardSql ? [{ ...employee, firstName: null }] : undefined,
  ]) {
    const m = mock(answer);
    await assert.rejects(m.app.execute(actor, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
    assert.ok(m.events.includes("rollback")); assert.ok(m.events.includes("release"));
  }
});
test("EC18-10/12 Oracle driver error, acquisition and rollback failure never become404 or fixture success", async () => {
  for (const m of [mock(async () => { throw { code: "ORA-00942", message: "private" }; }),
    mock(undefined, { acquisitionFailure: true }), mock(undefined, { rollbackFailure: true })]) {
    await assert.rejects(m.app.execute(actor, { employeeId: id }), { code: "DEPENDENCY_UNAVAILABLE" });
    if (m.events.includes("rollback")) assert.ok(m.events.includes("release") || m.events.includes("discard"));
  }
});
test("EC18-10/11 timeout waits native work/break before rollback and discards failed break", async () => {
  for (const breakFailure of [false, true]) {
    const m = mock(async sql => {
      if (sql === employeeCardSql) { await new Promise(r => setTimeout(r, 35)); m.events.push("native-done"); return [employee]; }
      return undefined;
    }, { breakFailure });
    await assert.rejects(withRequestBudget(new AbortController().signal, 10,
      () => m.app.execute(actor, { employeeId: id })), { code: "DEPENDENCY_TIMEOUT" });
    assert.ok(m.events.indexOf("break") < m.events.indexOf("native-done"));
    assert.ok(m.events.indexOf("native-done") < m.events.indexOf("rollback"));
    assert.equal(m.events.at(-1), breakFailure ? "discard" : "release");
  }
});
test("EC18-10/11 explicit abort and late acquisition release without queries or leaked lease", async () => {
  const m = mock(undefined, { delayedAcquisition: true });
  await assert.rejects(withRequestBudget(new AbortController().signal, 5,
    () => m.app.execute(actor, { employeeId: id })), { code: "DEPENDENCY_TIMEOUT" });
  assert.equal(m.statements.length, 0);
  assert.deepEqual(m.events, ["acquire", "rollback", "release"]);
  const c = new AbortController(); c.abort();
  const n = mock();
  await assert.rejects(n.reader.read({ employeeId: id, exactTeamIds: ["T01"] }, c.signal),
    { code: "DEPENDENCY_TIMEOUT" });
  assert.equal(n.events.length, 0);
});
