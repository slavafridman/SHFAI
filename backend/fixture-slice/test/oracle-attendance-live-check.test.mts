import test from "node:test";
import assert from "node:assert/strict";
import type { OraclePool } from "../oracle-session.mts";
import { runOracleAttendanceLiveCheck, attendanceIdentitySql, attendanceTeamSql, attendanceCandidateSql,
  attendanceHasExactPublicShape } from "../oracle-attendance-live-check.mts";
import type { AttendanceLiveTestDouble } from "../oracle-attendance-live-check.mts";
import { sampleAttendanceFixture } from "../attendance-sample.mts";
import { attendanceRow } from "../attendance-projection.mts";

const env = {
  SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SYNTHETIC_TEST",
  SHF_ORACLE_PASSWORD: "isolated-double-only", SHF_ORACLE_CLIENT_LIB_DIR: "isolated-client",
  SHF_ORACLE_TEST_SCOPE_CONFIRMED: "true", SHF_ORACLE_ATTENDANCE_SCOPE_CONFIRMED: "true",
  SHF_ORACLE_EXPECTED_DB_NAME: "WFMT", SHF_ORACLE_EXPECTED_SERVER_HOST: "SYNTHETIC_HOST",
  SHF_ORACLE_TNS_ENDPOINT: "synthetic.invalid",
};
function double(options: { identityMismatch?: boolean; mappingFailure?: boolean; dnsFailure?: boolean; sqlFailure?: boolean } = {}) {
  const statements: string[] = [], events: string[] = [];
  const day = sampleAttendanceFixture.days[0];
  const pool: OraclePool = {
    async getConnection() {
      events.push("acquire");
      return {
        callTimeout: 0,
        async execute(sql, binds, bound) {
          assert.ok(bound <= 1001); statements.push(sql);
          if (sql === "SET TRANSACTION READ ONLY") return [];
          if (sql === attendanceIdentitySql) return [{ databaseName: options.identityMismatch ? "OTHER" : "WFMT",
            serverHost: "SYNTHETIC_HOST", sessionUser: "SYNTHETIC_TEST" }];
          if (sql.includes('AS "calendar"')) return [{ calendar: "GREGORIAN" }];
          if (sql.includes('AS "probe"')) return [{ probe: 1 }];
          if (sql.includes('AS "largeId"')) return [{ largeId: "9".repeat(38), civilDate: "2024-02-29T23:59:37",
            unicodeEcho: options.mappingFailure ? "wrong" : "בדיקה סינתטית" }];
          if (options.sqlFailure) throw Error("private driver error");
          if (sql === attendanceTeamSql) return [{ teamCode: "T01" }];
          if (sql === attendanceCandidateSql) return [{ shiftDayId: day.shiftDayId, startLocal: day.baselineStartLocal, splitLocal: null }];
          if (sql.includes('AS "grantCode"')) return [{ grantCode: "T01", teamCode: "T01", teamLabel: "צוות", teamType: "J01",
            code: "01", label: "מוקד", unitType: "G01" }];
          if (sql.includes("active=:active")) return [{ code: "101", label: "תפקיד" }];
          if (sql.includes('WHERE "ambiguous"=1')) return [];
          if (sql.includes('AS "rowNumber"')) return [{ ...day, employeeId: "9007199254740993", firstName: "עובד", lastName: "סינתטי",
            teamCode: "T01", innerJobCode: "101", stageArrivalLocal: null, stationArrivalLocal: null,
            stationExitLocal: null, missingReasonCode: null, briefingCode: null }];
          if (sql.includes("shf_activity_type")) return [];
          if (sql.includes("shf_inner_jobs")) return [{ code: "101", label: "תפקיד" }];
          if (sql.startsWith('SELECT "dayId"')) return [{ dayId: day.shiftDayId, employeeId: "9007199254740993",
            baselineStart: day.baselineStartLocal, changedStart: null, baselineSplit: null, changedSplit: null, changed: 0 }];
          throw Error("unexpected SQL");
        },
        async break() { events.push("break"); }, async rollback() { events.push("rollback"); },
        async close() { events.push("release"); },
      };
    }, async close() { events.push("pool-close"); },
  };
  const seam: AttendanceLiveTestDouble = {
    async createPool() { return pool; },
    async resolveEndpoint() { events.push("dns"); if (options.dnsFailure) throw Error("private DNS error"); },
  };
  return { seam, statements, events };
}
test("AT19 native checker isolated seam validates entire bounded workflow but never claims native", async () => {
  const m = double(), result = await runOracleAttendanceLiveCheck(env, m.seam);
  assert.equal(result.source, "isolated-test-double"); assert.equal(result.workflow, "PASS");
  assert.equal(result.thick, false); assert.equal(result.client19_3, false);
  assert.equal(result.oneSnapshotPerGet, true); assert.equal(result.manualInclusiveMatch, true);
  assert.equal(result.candidateKeyCount, 1); assert.equal(result.listRows, 1); assert.equal(result.leasesCleaned, true);
  assert.equal(result.ownedListenerClosed, true); assert.equal(result.poolClosed, true);
  assert.equal(m.events[0], "dns"); assert.equal(m.events.at(-1), "pool-close");
  assert.equal(JSON.stringify(result).includes("SYNTHETIC_HOST"), false);
  assert.equal(JSON.stringify(result).includes(env.SHF_ORACLE_PASSWORD), false);
});
test("AT19 native checker explicit approval/config and DNS/identity gate before business SQL", async () => {
  for (const changes of [{ SHF_ORACLE_ATTENDANCE_SCOPE_CONFIRMED: undefined },
    { SHF_ORACLE_TEST_SCOPE_CONFIRMED: "false" }, { SHF_ORACLE_CONNECT_STRING: "PRODUCTION" },
    { SHF_ORACLE_EXPECTED_DB_NAME: "OTHER" }, { SHF_ORACLE_TNS_ENDPOINT: undefined }]) {
    const m = double(); const r = await runOracleAttendanceLiveCheck({ ...env, ...changes }, m.seam);
    assert.equal(r.workflow, "BLOCKED"); assert.equal(m.statements.length, 0);
  }
  const dns = double({ dnsFailure: true });
  assert.equal((await runOracleAttendanceLiveCheck(env, dns.seam)).endpointDnsVerified, false);
  assert.equal(dns.statements.length, 0);
  const wrong = double({ identityMismatch: true }), r = await runOracleAttendanceLiveCheck(env, wrong.seam);
  assert.equal(r.databaseIdentityVerified, false); assert.equal(r.code, "FORBIDDEN");
  assert.equal(wrong.statements.length, 2); assert.equal(r.leasesCleaned, true); assert.equal(r.poolClosed, true);
});
test("AT19 native checker mapping/driver failure sanitized cleanup and no fixture fallback", async () => {
  const mapping = double({ mappingFailure: true });
  const r = await runOracleAttendanceLiveCheck(env, mapping.seam);
  assert.equal(r.mapping, false); assert.equal(r.candidateKeyCount, 0); assert.equal(r.workflow, "BLOCKED");
  const failure = double({ sqlFailure: true }), f = await runOracleAttendanceLiveCheck(env, failure.seam);
  assert.equal(f.workflow, "BLOCKED"); assert.equal(f.code, "DEPENDENCY_UNAVAILABLE");
  assert.equal(f.poolClosed, true); assert.equal(f.leasesCleaned, true);
  assert.equal(JSON.stringify(f).includes("private"), false);
  assert.equal(attendanceHasExactPublicShape({ items: [] }), false);
});
