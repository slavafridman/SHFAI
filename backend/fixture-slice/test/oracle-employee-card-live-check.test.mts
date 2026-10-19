import test from "node:test";
import assert from "node:assert/strict";
import { cardHasExactPublicShape, employeeCardIdentitySql, employeeCardTeamCandidateSql,
  employeeCardCandidateKeysSql, runOracleEmployeeCardLiveCheck } from "../oracle-employee-card-live-check.mts";
import type { OraclePool } from "../oracle-session.mts";
import { employeeCardSql, employeeJobLabelSql } from "../oracle-employee-card-reader.mts";

const env = { SHF_ORACLE_TEST_SCOPE_CONFIRMED: "true", SHF_ORACLE_EXPECTED_DB_NAME: "WFMT",
  SHF_ORACLE_EXPECTED_SERVER_HOST: "CTIDBT", SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT",
  SHF_ORACLE_USER: "SYNTHETIC_TEST", SHF_ORACLE_PASSWORD: "synthetic-not-a-credential", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic" };
const card = { employeeId: "1", employee: { firstName: "בדיקה", lastName: "סינתטי",
  unit: { code: "T01", label: "צוות", moked: { code: "01", label: "מוקד", unitType: "G01" } },
  job: { code: "11", label: "תפקיד" }, innerJob: null }, businessTimeZone: "Asia/Jerusalem", dataSource: "oracle-read-only" };
function double(options: { wrongDb?: boolean; wrongHost?: boolean; ambiguousJob?: boolean; noKeys?: boolean } = {}) {
  const statements: string[] = [];
  let closed = false;
  const pool: OraclePool = {
    async getConnection() { return {
      callTimeout: 0,
      async execute(sql) {
        statements.push(sql);
        if (sql === "SET TRANSACTION READ ONLY") return [];
        if (sql === employeeCardIdentitySql) return [{ databaseName: options.wrongDb ? "OTHER" : "WFMT",
          serverHost: options.wrongHost ? "other.example.invalid" : "ctidbt.example.invalid",
          sessionUser: env.SHF_ORACLE_USER }];
        if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
        if (sql === 'SELECT 1 AS "probe" FROM dual') return [{ probe: 1 }];
        if (sql.includes('AS "largeId"')) return [{ largeId: "9".repeat(38),
          civilDate: "2024-02-29T23:59:37", unicodeEcho: "בדיקה סינתטית" }];
        if (sql === employeeCardTeamCandidateSql) return [{ teamCode: "T01" }];
        if (sql === employeeCardCandidateKeysSql) return options.noKeys ? [] : [{ employeeId: "1" }];
        if (sql.includes('AS "grantCode"')) return [{ grantCode: "T01", teamCode: "T01", teamLabel: "צוות",
          teamType: "J01", code: "01", label: "מוקד", unitType: "G01" }];
        if (sql === employeeCardSql) return [{ employeeId: "1", firstName: "בדיקה", lastName: "סינתטי",
          orgUnitId: "T01", jobCode: "11", innerJobCode: null }];
        if (sql === employeeJobLabelSql) return options.ambiguousJob
          ? [{ code: "11", label: "A" }, { code: "11", label: "B" }] : [{ code: "11", label: "תפקיד" }];
        throw Error("unexpected isolated-test SQL");
      },
      async break() {}, async rollback() {}, async close() {},
    }; },
    async close() { closed = true; },
  };
  return { dependencies: { createPool: async () => pool }, statements, isClosed: () => closed };
}
test("native checker first coherent edit: exact public allowlist rejects extras at every level", () => {
  assert.equal(cardHasExactPublicShape(card, "1", "T01"), true);
  for (const value of [{ ...card, extra: "excluded" },
    { ...card, employee: { ...card.employee, extra: "excluded" } },
    { ...card, employee: { ...card.employee, unit: { ...card.employee.unit, extra: "excluded" } } },
    { ...card, employee: { ...card.employee, job: { ...card.employee.job, extra: "excluded" } } }])
    assert.equal(cardHasExactPublicShape(value, "1", "T01"), false);
  assert.equal(cardHasExactPublicShape(card, "2", "T01"), false);
});
test("native checker refuses unconfirmed configuration and actual non-TEST identity before business reads", async () => {
  const noConfig = double();
  assert.equal((await runOracleEmployeeCardLiveCheck({}, noConfig.dependencies)).phase, "configuration");
  assert.equal(noConfig.statements.length, 0);
  for (const options of [{ wrongDb: true }, { wrongHost: true }]) {
    const mismatch = double(options);
    const result = await runOracleEmployeeCardLiveCheck(env, mismatch.dependencies);
    assert.equal(result.workflow, "BLOCKED"); assert.equal(result.databaseIdentityVerified, false);
    assert.deepEqual(mismatch.statements, ["SET TRANSACTION READ ONLY", employeeCardIdentitySql]);
    assert.ok(result.leasesCleaned); assert.ok(mismatch.isClosed());
  }
});
test("isolated checker double: one bounded employee/snapshot and two HTTP GETs; never native-labeled", async () => {
  const mock = double();
  const r = await runOracleEmployeeCardLiveCheck(env, mock.dependencies);
  assert.equal(r.source, "isolated-test-double"); assert.equal(r.workflow, "PASS");
  assert.equal(r.thick, false); assert.equal(r.client19_3, false);
  assert.equal(r.httpGets, 2); assert.equal(r.employeeQueries, 1); assert.equal(r.cardSnapshots, 1);
  assert.ok(r.mapping && r.databaseIdentityVerified && r.privacyAllowlist && r.sourceCoherent && r.boundedSnapshot);
  assert.ok(r.poolClosed && r.leasesCleaned && r.ownedListenersClosed);
  assert.doesNotMatch(mock.statements.join("\n"), /SELECT\s+\*|emp_id_number|attendance|employee_day|phone|email|birth|photo|manager/i);
  assert.equal(JSON.stringify(r).includes(env.SHF_ORACLE_PASSWORD), false);
});
test("native checker preserves canonical ambiguity instead of selecting another employee or fallback", async () => {
  const mock = double({ ambiguousJob: true });
  const r = await runOracleEmployeeCardLiveCheck(env, mock.dependencies);
  assert.equal(r.workflow, "CANONICAL_ERROR"); assert.equal(r.code, "INVALID_SOURCE_DATA");
  assert.equal(r.cardHttpStatus, 500); assert.equal(r.httpGets, 2);
  assert.equal(r.employeeQueries, 1); assert.equal(r.selectedEmployeeCount, 1);
  assert.ok(r.identityVerified && r.poolClosed && r.leasesCleaned && r.ownedListenersClosed);
});
test("native checker no candidate is honest non-PASS and pool is closed", async () => {
  const mock = double({ noKeys: true });
  const r = await runOracleEmployeeCardLiveCheck(env, mock.dependencies);
  assert.equal(r.workflow, "NO_CANDIDATE"); assert.equal(r.httpGets, 0);
  assert.ok(r.poolClosed && r.leasesCleaned);
});
