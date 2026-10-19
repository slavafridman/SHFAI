import test from "node:test";
import assert from "node:assert/strict";
import type { BindParameters } from "oracledb";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { OracleAttendanceReader } from "../oracle-attendance-reader.mts";
import { ReadAttendance } from "../read-attendance.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { sampleConfig, sampleAttendanceFixture } from "../attendance-sample.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { record } from "../contract-validation.mts";

const actor = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const request = { attendanceDate: "2026-10-19", timeFrom: "10:00", timeTo: "10:00" };
const d = sampleAttendanceFixture.days[0], e = sampleAttendanceFixture.employees[0];
const fact = { ...d, employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName, teamCode: e.teamCode,
  innerJobCode: "101", stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
  missingReasonCode: "-1", briefingCode: null };
const team = { grantCode: "T01", teamCode: "T01", teamLabel: "צוות", teamType: "J01", code: "01", label: "מוקד", unitType: "G01" };
function mock(answer?: (sql: string, binds: BindParameters) => Promise<unknown[] | undefined>,
  options: { rollbackFailure?: boolean; breakFailure?: boolean; acquisitionFailure?: boolean; delayAcquisition?: boolean } = {}) {
  const events: string[] = [], statements: { sql: string; binds: BindParameters; bound: number }[] = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      statements.push({ sql, binds, bound });
      if (sql === "SET TRANSACTION READ ONLY") { events.push("snapshot"); return []; }
      const override = await answer?.(sql, binds); if (override !== undefined) return override;
      if (sql.includes('AS "calendar"')) return [{ calendar: "GREGORIAN" }];
      if (sql.includes('AS "grantCode"')) return [team];
      if (sql.includes("active=:active")) return [{ code: "101", label: "תפקיד" }];
      if (sql.includes('WHERE "ambiguous"=1')) return [];
      if (sql.includes('AS "rowNumber"')) return [fact];
      if (sql.includes("shf_activity_type")) {
        assert.ok(record(binds)); return binds.code0 === "A" ? [{ code: "A", label: "פעילות" }] : [];
      }
      if (sql.includes("shf_inner_jobs")) return [{ code: "101", label: "תפקיד" }];
      throw Error("unexpected SQL");
    },
    async break() { events.push("break"); if (options.breakFailure) throw Error("private"); },
    async rollback() { events.push("rollback"); if (options.rollbackFailure) throw Error("private"); },
    async close(drop) { events.push(drop ? "discard" : "release"); },
  };
  const pool: OraclePool = { async getConnection() {
    events.push("acquire"); if (options.acquisitionFailure) throw Error("private");
    if (options.delayAcquisition) await new Promise(r => setTimeout(r, 35)); return connection;
  }, async close() {} };
  const reader = new OracleAttendanceReader(new OracleReadSession(pool));
  const app = new ReadAttendance(reader, { now: () => new Date("2026-10-19T00:00:00Z") }, "Asia/Jerusalem", "oracle-read-only");
  return { app, reader, statements, events };
}
test("AT19-10 Oracle context and list each one read-only snapshot, SQL privacy, bounds, Oracle11 pushdown", async () => {
  const m = mock(); const list = await m.app.list(actor, { ...request, limit: 2 });
  assert.equal(list.items[0].attendance.missingReasonCode, "-1");
  assert.equal(list.items[0].employee.employeeId, "9007199254740993");
  assert.deepEqual(m.events, ["acquire","snapshot","rollback","release"]);
  const all = m.statements.map(s => s.sql).join("\n");
  assert.doesNotMatch(all, /SELECT\s+\*|\w+\.\*|e_old|shf_cti|remark|user_id|phone|national|status_id|missing_time|late_minutes|SHF_INS|FOR UPDATE|NEXTVAL|OFFSET FETCH|\b(?:INSERT|UPDATE|DELETE|COMMIT|MERGE|BEGIN)\b/i);
  assert.match(all, /UNION ALL/); assert.doesNotMatch(all, /DISTINCT|UNION(?! ALL)/);
  assert.match(all, /c.cancel_reason_code IS NULL/); assert.doesNotMatch(all, /a.miss_reason_id IS NULL/);
  assert.match(all, /d.split_end BETWEEN/); assert.match(all, /c.new_split_end BETWEEN/);
  assert.match(all, /SUBSTR\(pe.emp_id_number,1,8\)=c.new_employee_id/);
  assert.match(all, /COUNT\(\*\).*shf_day_changes/);
  assert.match(all, /NULLS LAST/); assert.match(all, /ROW_NUMBER\(\)/);
  assert.doesNotMatch(all, /AS "(?:employeeKey|employeeNumber|changedEmployeeKey)"/);
  const page = m.statements.find(s => s.sql.includes('AS "rowNumber"'))!;
  assert.equal(page.bound, 3); assert.ok(record(page.binds));
  assert.equal(page.binds.upperBound, 3); assert.equal(page.binds.fromLocal, "2026-10-19T10:00:00");
  assert.ok(m.statements.every(s => s.bound <= 1001));
  assert.ok(m.statements.filter(s => s.sql.includes("lookupBound")).every(s => s.bound === 2));
  const context = mock(); await context.app.context(actor);
  assert.deepEqual(context.events, ["acquire","snapshot","rollback","release"]);
  assert.equal(context.statements.some(s => s.sql.includes("shf_attendance")), false);
});
test("AT19-02 Oracle original role grants, generic forbidden filters before business query", async () => {
  for (const filter of [{ innerJobCodes: ["999"] }, { teamCodes: ["private"] }, { mokedCode: "private" }]) {
    const m = mock();
    await assert.rejects(m.app.list(actor, { ...request, ...filter }), { code: "FORBIDDEN" });
    assert.equal(m.statements.some(s => s.sql.includes("shf_attendance")), false);
    assert.equal(m.events.at(-1), "release");
  }
});
test("AT19-09 Oracle pre-page ambiguity even empty/max offset, and no hidden duplicate overlay", async () => {
  const m = mock(async sql => sql.includes('WHERE "ambiguous"=1') ? [{ ambiguous: 1 }] : undefined);
  await assert.rejects(m.app.list(actor, { ...request, offset: 10000 }), { code: "AMBIGUOUS_ATTENDANCE" });
  assert.equal(m.statements.some(s => s.sql.includes('AS "rowNumber"')), false);
  assert.deepEqual(m.events, ["acquire","snapshot","rollback","release"]);
});
test("AT19-08 Oracle duplicate hierarchy/catalog/selected label, missing alias and invalid briefing reject source", async () => {
  for (const answer of [
    async (sql: string) => sql.includes('AS "grantCode"') ? [team,team] : undefined,
    async (sql: string) => sql.includes("active=:active") ? [{ code: "101", label: "תפקיד" }, { code: "101", label: "תפקיד" }] : undefined,
    async (sql: string) => sql.includes("shf_activity_type") ? [{ code: "A", label: "א" }, { code: "A", label: "א" }] : undefined,
    async (sql: string) => sql.includes('AS "rowNumber"') ? [{ ...fact, briefingCode: "2" }] : undefined,
    async (sql: string) => sql.includes('AS "rowNumber"') ? [{ ...fact, stationArrivalLocal: undefined }] : undefined,
    async (sql: string) => sql.includes('AS "calendar"') ? [{ calendar: "HEBREW" }] : undefined,
  ]) {
    const m = mock(answer); await assert.rejects(m.app.list(actor, request));
    assert.equal(m.events.at(-2), "rollback"); assert.equal(m.events.at(-1), "release");
  }
});
test("AT19-10 Oracle driver/acquisition/cleanup failure503 without fallback, unsafe lease discarded", async () => {
  for (const m of [mock(async () => { throw { code: "ORA-00942", message: "private" }; }),
    mock(undefined, { acquisitionFailure: true }), mock(undefined, { rollbackFailure: true })])
    await assert.rejects(m.app.list(actor, request), { code: "DEPENDENCY_UNAVAILABLE" });
  const cleanup = mock(undefined, { rollbackFailure: true });
  await assert.rejects(cleanup.app.list(actor, request)); assert.equal(cleanup.events.at(-1), "discard");
});
test("AT19-10 timeout/abort await native break and rollback, late acquisition released", async () => {
  for (const breakFailure of [false,true]) {
    const m = mock(async sql => {
      if (sql.includes('AS "rowNumber"')) { await new Promise(r => setTimeout(r, 60)); m.events.push("native-done"); return [fact]; }
      return undefined;
    }, { breakFailure });
    await assert.rejects(withRequestBudget(new AbortController().signal, 20, () => m.app.list(actor, request)),
      { code: "DEPENDENCY_TIMEOUT" });
    assert.ok(m.events.indexOf("break") < m.events.indexOf("native-done"));
    assert.ok(m.events.indexOf("native-done") < m.events.indexOf("rollback"));
    assert.equal(m.events.at(-1), breakFailure ? "discard" : "release");
  }
  const late = mock(undefined, { delayAcquisition: true });
  await assert.rejects(withRequestBudget(new AbortController().signal, 5, () => late.app.list(actor, request)),
    { code: "DEPENDENCY_TIMEOUT" });
  assert.deepEqual(late.events, ["acquire","rollback","release"]);
  const aborted = mock(), control = new AbortController(); control.abort();
  await assert.rejects(aborted.app.list(actor, request, control.signal));
  assert.deepEqual(aborted.events, []);
});
