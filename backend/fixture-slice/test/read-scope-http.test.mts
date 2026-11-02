import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { BindParameters } from "oracledb";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { createLoopbackServer, CURRENT_RESPONSE_LIMIT_BYTES, RESPONSE_LIMIT_BYTES, serializeSuccess } from "../http-adapter.mts";
import { OracleReadSession } from "../oracle-session.mts";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { OracleCurrentReader, OracleDetailReader } from "../oracle-readers.mts";
import { OracleSearchReader } from "../oracle-search-reader.mts";
import { OracleAttendanceReader } from "../oracle-attendance-reader.mts";
import { OracleEmployeeCardReader, employeeCardSql } from "../oracle-employee-card-reader.mts";
import { OracleMyShiftsReader } from "../oracle-my-shifts-reader.mts";
import { OracleShiftItemsReader } from "../oracle-shift-items-reader.mts";
import { record } from "../contract-validation.mts";
import { row } from "./fixtures.mts";

// ISOLATED SQL protocol double. No driver, credentials, DNS, Oracle or real records.
for (const count of [101, 1000]) test(`all seven Oracle HTTP inquiries admit tail of ${count} exact R7 grants`, async () => {
  // Eight Unicode scalars per code, >16KiB actual UTF-8 identity at 1000.
  const ids = Array.from({ length: count }, (_, i) => `😀😀😀😀${String(i).padStart(4, "0")}`);
  const parents = ids.map((_, i) => `P${String(i).padStart(4, "0")}`);
  const tail = ids.at(-1)!, parent = parents.at(-1)!;
  const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ids,
    dataSource: "oracle-read-only", oracleTestScopeConfirmed: true, businessTimeZone: "Asia/Jerusalem" };
  let leases = 0, releases = 0, rollbacks = 0, wrongTeam = false;
  const statements: Array<{ sql: string; binds: BindParameters; bound: number; lease: number; timeout: number }> = [];
  const detail = () => row({ shiftDayId: "1", employeeId: "1", orgUnitId: wrongTeam ? "OTHER" : tail,
    baselineStartLocal: "2026-10-19T10:00:00", baselineEndLocal: "2026-10-19T11:00:00",
    baselineActivityData: null, changedActivityData: null });
  const pool: OraclePool = {
    async getConnection() {
      const lease = ++leases;
      const connection: OracleConnection = {
        callTimeout: 0,
        async execute(sql, binds, bound) {
          statements.push({ sql, binds, bound, lease, timeout: this.callTimeout });
          assert.ok(bound <= 1001);
          if (sql === "SET TRANSACTION READ ONLY") return [];
          assert.match(sql, /^\s*SELECT\b/);
          assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|MERGE|COMMIT|BEGIN|NEXTVAL)\b|SHF_INS_AND_RETURN_LASTID/i);
          if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
          if (sql.includes('AS "grantCode"')) {
            assert.ok(record(binds));
            const grants = Object.entries(binds).filter(([k]) => /^team\d+$/.test(k)).map(([, v]) => v);
            assert.ok(grants.length <= 100); assert.equal(bound, grants.length + 1);
            return grants.map(code => {
              assert.equal(typeof code, "string"); const index = ids.indexOf(code as string);
              assert.ok(index >= 0);
              return { grantCode: code, teamCode: code, teamLabel: "Synthetic team", teamType: "J01",
                code: parents[index], label: "Synthetic parent", unitType: "G01" };
            });
          }
          if (sql === employeeCardSql) return [{ employeeId: "1", firstName: "Synthetic", lastName: "Employee",
            orgUnitId: wrongTeam ? "OTHER" : tail, jobCode: null, innerJobCode: null }];
          if (sql.includes('AS "actorReference"')) return [{ employeeId: "1", firstName: "Synthetic",
            lastName: "Employee", actorReference: "TEST0001-private", teamCode: wrongTeam ? "OTHER" : tail,
            teamLabel: "Synthetic team", teamType: "J01", parentCode: parent,
            parentLabel: "Synthetic parent", parentType: "G01" }];
          if (sql.includes('AS "employeeReference"')) return [{ ...detail(), employeeReference: "TEST0001-private",
            teamLabel: "Synthetic team", teamType: "J01", parentCode: parent,
            parentLabel: "Synthetic parent", parentType: "G01", innerJobCode: null }];
          if (sql.includes("active=:active") || sql.includes("lookupBound")) return [];
          if (sql.includes("HAVING COUNT(*)") || sql.includes('WHERE "ambiguous"=1') ||
              sql.includes('AS "ambiguous"')) return [];
          if (sql.includes('AS "rowNumber"')) {
            if (sql.includes("shf_employee_exceptions")) return [];
            if (!sql.includes("shf_attendance")) return [{ shiftDayId: "1", startLocal: "2026-10-19T10:00:00",
              endLocal: "2026-10-19T11:00:00", activityData: null }];
            if (sql.includes('AS "missingReasonCode"')) return [{
              ...detail(), teamCode: wrongTeam ? "OTHER" : tail, innerJobCode: null, baselineHome: null,
              changedHome: null, exceptionCode: null, missingReasonCode: null, briefingCode: null,
            }];
            return [{ ...detail(), employeeKey: "TEST0001", changedEmployeeKey: null,
              employeeNumber: "TEST0001-private", innerJobCode: null, missingReason: null,
              baselineHome: null, changedHome: null, baselineDayType: 4, changedDayType: null,
              cancellationReason: null, remark: null, cancelLoginApplier: null, baselineSplit: null,
              changedSplit: null, source: null, baselineExtension: null, changedExtension: null, exceptionCode: null }];
          }
          if (record(binds) && binds.dayId === "1" && bound === 2) return [detail()];
          throw Error("Unexpected isolated scope SQL");
        },
        async rollback() { rollbacks++; }, async close() { releases++; }, async break() {},
      };
      return connection;
    },
    async close() {},
  };
  const session = new OracleReadSession(pool);
  const runtime = await createRuntime(config, new OracleDetailReader(session), undefined, {
    reader: new OracleCurrentReader(session), searchReader: new OracleSearchReader(session),
    myShiftsReader: new OracleMyShiftsReader(session), shiftItemsReader: new OracleShiftItemsReader(session),
    employeeCardReader: new OracleEmployeeCardReader(session), attendanceReader: new OracleAttendanceReader(session),
  });
  const server = createLoopbackServer(runtime); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const get = async (path: string) => {
    const response = await fetch(url + path), body = await response.text();
    return { status: response.status, text: body, value: JSON.parse(body) };
  };
  try {
    const identity = await get("/api/v1/identity");
    assert.equal(identity.status, 200); assert.deepEqual(identity.value.principal.resourceScope.orgUnitIds, ids);
    if (count === 1000) {
      assert.ok(Buffer.byteLength(identity.text, "utf8") > RESPONSE_LIMIT_BYTES);
      assert.ok(Buffer.byteLength(identity.text, "utf8") <= CURRENT_RESPONSE_LIMIT_BYTES);
      assert.throws(() => serializeSuccess(identity.value)); // Other identities retain default16KiB.
    }
    for (const path of ["/api/v1/current-shifts/filter-context", "/api/v1/shift-search/filter-context",
      "/api/v1/attendance/filter-context"]) {
      const response = await get(path); assert.equal(response.status, 200, path);
      assert.equal(response.value.mokedOptions.length, count);
      assert.equal(response.value.mokedOptions.at(-1).code, parent);
      if (response.value.teamOptions) assert.deepEqual(response.value.teamOptions.map((t: {code: string}) => t.code), ids);
    }
    const paths = [
      "/api/v1/employees/1/shift-days/1",
      "/api/v1/current-shifts?mode=at&attendanceDate=2026-10-19&currentTime=10:00",
      "/api/v1/shift-search?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00",
      "/api/v1/my-shifts?mode=selected&employeeId=1&dateFrom=2026-10-19&dateTo=2026-10-19",
      "/api/v1/employees/1/shift-days/1/breaks-and-exceptions",
      "/api/v1/employees/1/operational-card",
      "/api/v1/attendance?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00",
    ];
    for (const path of paths) {
      const response = await get(path); assert.equal(response.status, 200, path + " " + response.text);
      assert.ok(response.text.includes(tail), path);
      if (response.value.items && !path.includes("breaks-and-exceptions")) assert.equal(response.value.items.length, 1);
    }
    assert.equal((await get("/api/v1/my-shifts/context?mode=selected&employeeId=1")).status, 200);
    const explicit = ids.slice(0, 101).map(encodeURIComponent).join(",");
    for (const route of ["shift-search", "attendance"]) {
      assert.equal((await get(`/api/v1/${route}?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00&teamCodes=${explicit}`)).status, 400);
      assert.equal((await get(`/api/v1/${route}?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00&teamCodes=OTHER`)).status, 403);
    }
    wrongTeam = true;
    for (const path of paths) {
      const response = await get(path); assert.notEqual(response.status, 200, path);
      assert.ok(!response.text.includes("OTHER"));
    }
    assert.equal(leases, rollbacks); assert.equal(leases, releases);
    assert.ok(statements.every(s => s.timeout > 0 && s.timeout <= 5000));
    const principal = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
    assert.equal(principal.capabilities.length, 7);
  } finally { await new Promise<void>((done, reject) => server.close(e => e ? reject(e) : done())); }
});
