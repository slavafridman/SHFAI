import { pathToFileURL } from "node:url";
import { once } from "node:events";
import { lookup } from "node:dns/promises";
import oracledb from "oracledb";
import type { Server } from "node:http";
import type { OraclePool } from "./oracle-session.mts";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { civil, numberText, OracleCurrentReader, OracleDetailReader, requireGregorian } from "./oracle-readers.mts";
import { attendanceBranches, OracleAttendanceReader } from "./oracle-attendance-reader.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { stopBackendServer } from "./server.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { attendanceRow, copyAttendance } from "./attendance-projection.mts";
import { isDeepStrictEqual } from "node:util";
import { SliceError } from "./errors.mts";
import type { AttendanceListV1 } from "./attendance-contracts.mts";

// Operator-only env API. No file/brief/credential parser; never automatically
// invoked by app startup/tests. All output is allowlisted aggregate evidence.
export const attendanceIdentitySql = `SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "databaseName",
  SYS_CONTEXT('USERENV','SERVER_HOST') AS "serverHost",
  SYS_CONTEXT('USERENV','SESSION_USER') AS "sessionUser" FROM dual`;
export const attendanceTeamSql = `SELECT t.org_unit_id AS "teamCode"
  FROM SHIFTER.shf_org_unit t JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit
  WHERE t.unit_type_id=:teamType AND p.unit_type_id=:parentType
  AND EXISTS (SELECT 1 FROM SHIFTER.shf_employees e WHERE e.org_unit_id=t.org_unit_id)
  AND ROWNUM <= 1`;
// One scoped candidate day (<=10 keys), scheduling columns only, not actual
// attendance or private personal-reference projections. No unbounded discovery.
export const attendanceCandidateSql = `SELECT "shiftDayId","startLocal","splitLocal" FROM (
  SELECT ${numberText("d.shf_employee_day_id")} AS "shiftDayId",
    ${civil("d.wm_shift_start_datetime")} AS "startLocal", ${civil("d.split_end")} AS "splitLocal"
  FROM SHIFTER.shf_employee_day d JOIN SHIFTER.shf_employees e
    ON SUBSTR(e.emp_id_number,1,8)=d.emp_id_number
  WHERE e.org_unit_id=:team AND d.wm_day_type=:dayType
    AND (d.wm_shift_start_datetime IS NOT NULL OR d.split_end IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM SHIFTER.shf_day_changes c WHERE c.shf_employee_day_id=d.shf_employee_day_id)
  UNION ALL
  SELECT ${numberText("d.shf_employee_day_id")} AS "shiftDayId",
    ${civil("c.new_shift_start")} AS "startLocal", ${civil("c.new_split_end")} AS "splitLocal"
  FROM SHIFTER.shf_employee_day d JOIN SHIFTER.shf_day_changes c ON c.shf_employee_day_id=d.shf_employee_day_id
    JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=c.new_employee_id
  WHERE e.org_unit_id=:team AND c.new_day_type=:dayType AND c.cancel_reason_code IS NULL
    AND (c.new_shift_start IS NOT NULL OR c.new_split_end IS NOT NULL))
  WHERE ROWNUM <= 10`;
const probeSql = 'SELECT 1 AS "probe" FROM dual';
const mappingSql = `SELECT ${numberText("99999999999999999999999999999999999999")} AS "largeId",
  ${civil("TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS')")} AS "civilDate",
  :hebrew AS "unicodeEcho" FROM dual`;
export function attendanceHasExactPublicShape(v: unknown): v is AttendanceListV1 {
  if (!record(v) || !Array.isArray(v.items) || v.items.length > 2 || !v.items.every(attendanceRow) ||
      !record(v.applied) || !record(v.page) || v.page.limit !== 2 || v.page.offset !== 0 ||
      typeof v.page.hasMore !== "boolean" || !(v.page.nextOffset === null || v.page.nextOffset === 2) ||
      v.businessTimeZone !== "Asia/Jerusalem" || v.dataSource !== "oracle-read-only") return false;
  return isDeepStrictEqual(v, { items: v.items.map(copyAttendance), applied: {
    attendanceDate: v.applied.attendanceDate, timeFrom: v.applied.timeFrom, timeTo: v.applied.timeTo,
    mokedCode: null, teamCodes: [], innerJobCodes: [], workLocations: [], sort: "effective-start-asc",
  }, page: { limit: 2, offset: 0, hasMore: v.page.hasMore, nextOffset: v.page.nextOffset },
  businessTimeZone: "Asia/Jerusalem", dataSource: "oracle-read-only" });
}
export interface AttendanceLiveTestDouble {
  createPool: (env: OracleEnvironment) => Promise<OraclePool>;
  resolveEndpoint: (host: string) => Promise<void>;
}
export async function runOracleAttendanceLiveCheck(env: NodeJS.ProcessEnv, double?: AttendanceLiveTestDouble) {
  const result = {
    source: double ? "isolated-test-double" : "native-oracle",
    workflow: "BLOCKED", phase: "configuration", code: "",
    node24: process.versions.node.startsWith("24."), driver26: oracledb.versionString.startsWith("26."),
    thick: false, client19_3: false, endpointDnsVerified: false, databaseIdentityVerified: false,
    databaseNameMatches: false, sessionUserMatches: false, serverHostMatches: false,
    mapping: false, candidateTeamCount: 0, candidateKeyCount: 0, manualRows: 0, listRows: 0,
    contextStatus: 0, listStatus: 0, identityStatus: 0, sourceCoherent: false, privacyAllowlist: false,
    manualInclusiveMatch: false, oneSnapshotPerGet: false, leases: 0, statements: 0,
    readOnlyTransactions: 0, leasesCleaned: true, ownedListenerClosed: true, poolClosed: false,
  };
  let native: OraclePool | undefined, server: Server | undefined;
  const leases: { snapshots: number; hierarchy: number; page: number; rollback: boolean; release: boolean }[] = [];
  try {
    if (env.SHF_ORACLE_ATTENDANCE_SCOPE_CONFIRMED !== "true" || env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true" ||
        env.SHF_ORACLE_EXPECTED_DB_NAME?.toUpperCase() !== "WFMT" ||
        !env.SHF_ORACLE_EXPECTED_SERVER_HOST || !/^[A-Za-z0-9_.-]{1,128}$/.test(env.SHF_ORACLE_EXPECTED_SERVER_HOST) ||
        !env.SHF_ORACLE_TNS_ENDPOINT || !/^[A-Za-z0-9_.-]{1,253}$/.test(env.SHF_ORACLE_TNS_ENDPOINT))
      throw new SliceError("INVALID_REQUEST");
    const configuration = oracleEnvironment(env);
    result.phase = "endpoint-dns";
    const endpointAddresses = double ? [] : await lookup(env.SHF_ORACLE_TNS_ENDPOINT, { all: true });
    if (double) await double.resolveEndpoint(env.SHF_ORACLE_TNS_ENDPOINT);
    result.endpointDnsVerified = true;
    result.phase = "native-pool";
    native = await (double ? double.createPool(configuration) : createOraclePool(configuration));
    result.thick = !double && !oracledb.thin;
    result.client19_3 = !double && oracledb.oracleClientVersionString.startsWith("19.3.");
    if (!double && (!result.node24 || !result.driver26 || !result.thick || !result.client19_3))
      throw new SliceError("DEPENDENCY_UNAVAILABLE");
    const guarded: OraclePool = {
      async getConnection() {
        const c = await native!.getConnection();
        const metric = { snapshots: 0, hierarchy: 0, page: 0, rollback: false, release: false };
        leases.push(metric);
        return {
          get callTimeout() { return c.callTimeout; }, set callTimeout(v: number) { c.callTimeout = v; },
          async execute(sql, binds, bound) {
            if (!result.databaseIdentityVerified && sql !== attendanceIdentitySql && sql !== "SET TRANSACTION READ ONLY")
              throw new SliceError("FORBIDDEN");
            // Reviewed plain-table SELECTs/nonmutating built-ins only. Private
            // source join inputs appear ONLY in predicates, never SELECT aliases.
            if (/\b(?:INSERT|UPDATE|DELETE|MERGE|COMMIT|NEXTVAL|EXECUTE|BEGIN)\b|SELECT\s+\*|\w+\.\*|shf_cti|remark|phone|national|stage_arrival_user|station_arrival_user|missing_time/i.test(sql))
              throw new SliceError("FORBIDDEN");
            if (sql === "SET TRANSACTION READ ONLY") { metric.snapshots++; result.readOnlyTransactions++; }
            if (sql.includes('AS "grantCode"')) metric.hierarchy++;
            if (sql.includes('AS "rowNumber"')) metric.page++;
            if (bound > 1001) throw new SliceError("FORBIDDEN");
            result.statements++;
            return c.execute(sql, binds, bound);
          },
          break: () => c.break(), async rollback() { await c.rollback(); metric.rollback = true; },
          async close(drop) { await c.close(drop); metric.release = true; },
        };
      }, close: () => native!.close(),
    };
    const session = new OracleReadSession(guarded);
    result.phase = "database-identity";
    await session.read(async q => {
      const rows = await q(attendanceIdentitySql, {}, 1), r = rows[0];
      if (rows.length !== 1 || !record(r) || typeof r.databaseName !== "string" ||
          typeof r.serverHost !== "string" || typeof r.sessionUser !== "string") throw new SliceError("FORBIDDEN");
      result.databaseNameMatches = r.databaseName.toUpperCase() === env.SHF_ORACLE_EXPECTED_DB_NAME!.toUpperCase();
      result.sessionUserMatches = r.sessionUser.toUpperCase() === configuration.user.toUpperCase();
      result.serverHostMatches = r.serverHost.toUpperCase() === env.SHF_ORACLE_EXPECTED_SERVER_HOST!.toUpperCase();
      // TNS may use a DNS alias while SERVER_HOST is the canonical machine.
      // Accept alias equivalence only after BOTH expected/actual names resolve
      // to the already verified TNS endpoint, before any business read.
      if (!result.serverHostMatches && !double && /^[A-Za-z0-9_.-]{1,253}$/.test(r.serverHost)) {
        const expected = await lookup(env.SHF_ORACLE_EXPECTED_SERVER_HOST!, { all: true });
        const actual = await lookup(r.serverHost, { all: true });
        result.serverHostMatches = endpointAddresses.some(a => expected.some(e => e.address === a.address) &&
          actual.some(e => e.address === a.address));
      }
      if (!result.databaseNameMatches || !result.sessionUserMatches || !result.serverHostMatches)
        throw new SliceError("FORBIDDEN");
      result.databaseIdentityVerified = true;
    });
    result.phase = "mapping";
    await session.read(async q => {
      await requireGregorian(q);
      const probe = await q(probeSql, {}, 1);
      const rows = await q(mappingSql, { hebrew: "בדיקה סינתטית" }, 1), r = rows[0];
      if (probe.length !== 1 || !record(probe[0]) || probe[0].probe !== 1 || rows.length !== 1 ||
          !record(r) || r.largeId !== "9".repeat(38) || r.civilDate !== "2024-02-29T23:59:37" ||
          r.unicodeEcho !== "בדיקה סינתטית") throw new SliceError("INVALID_SOURCE_DATA");
      result.mapping = true;
    });
    result.phase = "bounded-candidates";
    let team = "", date = "";
    await session.read(async q => {
      const teams = await q(attendanceTeamSql, { teamType: "J01", parentType: "G01" }, 1);
      result.candidateTeamCount = teams.length;
      if (teams.length !== 1 || !record(teams[0]) || !unitCode(teams[0].teamCode)) throw new SliceError("INVALID_SOURCE_DATA");
      team = teams[0].teamCode;
      const keys = await q(attendanceCandidateSql, { team, dayType: 4 }, 10);
      result.candidateKeyCount = keys.length;
      for (const k of keys) {
        if (!record(k) || !decimalId(k.shiftDayId, 10)) throw new SliceError("INVALID_SOURCE_DATA");
        const time = k.startLocal ?? k.splitLocal;
        if (!localDateTime(time)) throw new SliceError("INVALID_SOURCE_DATA");
        if (!date) date = time.slice(0,10);
      }
      if (!date) throw new SliceError("DEPENDENCY_UNAVAILABLE");
    });
    const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [team], dataSource: "oracle-read-only",
      businessTimeZone: "Asia/Jerusalem", oracleTestScopeConfirmed: true };
    const runtime = await createRuntime(config, new OracleDetailReader(session), undefined,
      { reader: new OracleCurrentReader(session), attendanceReader: new OracleAttendanceReader(session) });
    server = createLoopbackServer(runtime); server.listen(0, "127.0.0.1"); await once(server, "listening");
    result.ownedListenerClosed = false;
    const address = server.address(); if (!address || typeof address === "string") throw new SliceError("INTERNAL_ERROR");
    const base = `http://127.0.0.1:${address.port}`;
    result.phase = "identity-context-list";
    const identity = await fetch(base + "/api/v1/identity"); result.identityStatus = identity.status;
    const i: unknown = await identity.json();
    if (!record(i) || i.dataSource !== "oracle" || !record(i.principal) || i.principal.employeeId !== null ||
        !Array.isArray(i.principal.capabilities) || i.principal.capabilities.length !== 7 ||
        i.principal.capabilities[6] !== "attendance:read") throw new SliceError("INVALID_SOURCE_DATA");
    const beforeContext = leases.length;
    const context = await fetch(base + "/api/v1/attendance/filter-context"); result.contextStatus = context.status;
    const c: unknown = await context.json();
    if (context.status !== 200 || !record(c) || c.dataSource !== "oracle-read-only") throw new SliceError("INVALID_SOURCE_DATA");
    const beforeList = leases.length;
    const params = new URLSearchParams({ attendanceDate: date, timeFrom: "00:00", timeTo: "23:59", limit: "2" });
    const response = await fetch(base + "/api/v1/attendance?" + params); result.listStatus = response.status;
    const list: unknown = await response.json();
    if (response.status !== 200 || !attendanceHasExactPublicShape(list)) {
      if (record(list) && typeof list.code === "string" &&
          ["DEPENDENCY_TIMEOUT","DEPENDENCY_UNAVAILABLE","INVALID_SOURCE_DATA","AMBIGUOUS_ATTENDANCE"].includes(list.code)) {
        result.code = list.code;
      }
      throw new SliceError("INVALID_SOURCE_DATA");
    }
    result.listRows = list.items.length; result.privacyAllowlist = true; result.sourceCoherent = true;
    const listLease = leases[beforeList], contextLease = leases[beforeContext];
    result.oneSnapshotPerGet = beforeList === beforeContext + 1 && leases.length === beforeList + 1 &&
      contextLease.snapshots === 1 && contextLease.hierarchy === 1 && contextLease.page === 0 &&
      listLease.snapshots === 1 && listLease.hierarchy === 1 && listLease.page === 1;
    result.phase = "manual-inclusive";
    // Independent bounded manual row check: branch-owned planned start/split,
    // never actual attendance. At most10 keys from this ONE team/day/interval.
    const fields = `${numberText("d.shf_employee_day_id")} AS "dayId",${numberText("e.employee_id")} AS "employeeId",
      ${civil("d.wm_shift_start_datetime")} AS "baselineStart",
      ${civil("c.new_shift_start")} AS "changedStart",
      ${civil("d.split_end")} AS "baselineSplit",${civil("c.new_split_end")} AS "changedSplit",
      CASE WHEN c.shf_employee_day_id IS NULL THEN 0 ELSE 1 END AS "changed",
      NVL(c.new_shift_start,d.wm_shift_start_datetime) AS "orderStart",
      d.shf_employee_day_id AS "orderDay",e.employee_id AS "orderEmployee"`;
    await session.read(async q => {
      const rows = await q(`SELECT "dayId","employeeId","baselineStart","changedStart","baselineSplit","changedSplit","changed" FROM (
        SELECT "dayId","employeeId","baselineStart","changedStart","baselineSplit","changedSplit","changed"
        FROM (${attendanceBranches(fields, () => "AND e.org_unit_id=:team")})
        ORDER BY "orderStart" ASC NULLS LAST,"orderDay","orderEmployee") WHERE ROWNUM <= 10`,
      { team, dayType: 4, fromLocal: date + "T00:00:00", toLocal: date + "T23:59:00" }, 10);
      result.manualRows = rows.length;
      const from = date + "T00:00:00", to = date + "T23:59:00";
      const within = (v: unknown) => localDateTime(v) && v >= from && v <= to;
      if (!rows.every(r => record(r) && (within(r.changed === 1 ? r.changedStart : r.baselineStart) ||
          within(r.changed === 1 ? r.changedSplit : r.baselineSplit))) ||
          !isDeepStrictEqual(list.items.map(r => [r.shiftDayId,r.employee.employeeId]),
            rows.slice(0,2).map(r => record(r) ? [r.dayId,r.employeeId] : [])) ||
          list.page.hasMore !== (rows.length > 2)) throw new SliceError("INVALID_SOURCE_DATA");
      result.manualInclusiveMatch = true;
    });
    if (!result.oneSnapshotPerGet || result.listRows === 0 || result.identityStatus !== 200)
      throw new SliceError("INVALID_SOURCE_DATA");
    result.workflow = "PASS"; result.phase = "complete";
  } catch (e) {
    if (!result.code) result.code = e instanceof SliceError ? e.code : "DEPENDENCY_UNAVAILABLE";
  } finally {
    if (server) {
      try { await stopBackendServer(server); result.ownedListenerClosed = true; }
      catch { result.ownedListenerClosed = false; }
    }
    result.leases = leases.length;
    result.leasesCleaned = leases.every(l => l.rollback && l.release && l.snapshots === 1);
    if (native) { try { await native.close(); result.poolClosed = true; } catch { result.poolClosed = false; } }
    if (result.workflow === "PASS" && (!result.leasesCleaned || !result.poolClosed || !result.ownedListenerClosed))
      result.workflow = "BLOCKED";
  }
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runOracleAttendanceLiveCheck(process.env);
  process.stdout.write(JSON.stringify(result) + "\n");
  if (result.workflow !== "PASS") process.exitCode = 1;
}
