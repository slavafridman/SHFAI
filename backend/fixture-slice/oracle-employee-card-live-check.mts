import { pathToFileURL } from "node:url";
import { once } from "node:events";
import { isDeepStrictEqual } from "node:util";
import oracledb from "oracledb";
import type { Server } from "node:http";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import type { OraclePool } from "./oracle-session.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { civil, numberText, OracleCurrentReader, OracleDetailReader, requireGregorian } from "./oracle-readers.mts";
import { OracleEmployeeCardReader, employeeCardSql, employeeJobLabelSql } from "./oracle-employee-card-reader.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { stopBackendServer } from "./server.mts";
import { decimalId, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { projectEmployeeCardRow } from "./read-employee-card.mts";
import { SliceError } from "./errors.mts";

// Operator-only environment configuration. Never reads briefs/files, credentials
// from args, global defaults, source rows, broad directories or other workflows.
// This module is NOT automatically invoked by start/test.
export const employeeCardIdentitySql = `SELECT
  SYS_CONTEXT('USERENV','DB_NAME') AS "databaseName",
  SYS_CONTEXT('USERENV','SERVER_HOST') AS "serverHost",
  SYS_CONTEXT('USERENV','SESSION_USER') AS "sessionUser" FROM dual`;
export const employeeCardTeamCandidateSql = `SELECT t.org_unit_id AS "teamCode"
  FROM SHIFTER.shf_org_unit t JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit
  WHERE t.unit_type_id=:teamType AND p.unit_type_id=:parentType
    AND EXISTS (SELECT 1 FROM SHIFTER.shf_employees e WHERE e.org_unit_id=t.org_unit_id)
    AND ROWNUM <= 1`;
export const employeeCardCandidateKeysSql = `SELECT ${numberText("e.employee_id")} AS "employeeId"
  FROM SHIFTER.shf_employees e WHERE e.org_unit_id=:teamCode AND ROWNUM <= 10`;
const probeSql = 'SELECT 1 AS "probe" FROM dual';
const mappingSql = `SELECT ${numberText("99999999999999999999999999999999999999")} AS "largeId",
  ${civil("TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS')")} AS "civilDate",
  :hebrew AS "unicodeEcho" FROM dual`;

export function cardHasExactPublicShape(value: unknown, employeeId: string, teamCode: string): boolean {
  try {
    if (!record(value) || value.dataSource !== "oracle-read-only" || value.businessTimeZone !== "Asia/Jerusalem")
      return false;
    const row = projectEmployeeCardRow(value, employeeId, [teamCode]);
    return isDeepStrictEqual(value, { employeeId: row.employeeId, employee: row.employee,
      businessTimeZone: "Asia/Jerusalem", dataSource: "oracle-read-only" });
  } catch { return false; }
}
// Explicit isolated unit-test seam. Results from this seam are always labeled
// isolated-test-double, never evidence of native Oracle completion.
export interface EmployeeCardLiveTestDouble {
  createPool: (configuration: OracleEnvironment) => Promise<OraclePool>;
}
type Lease = { readonly: number; employee: number; hierarchy: number; job: number; innerJob: number;
  maxBound: number; rollback: boolean; released: boolean };
export async function runOracleEmployeeCardLiveCheck(env: NodeJS.ProcessEnv, testDouble?: EmployeeCardLiveTestDouble) {
  const result = {
    source: testDouble ? "isolated-test-double" : "native-oracle",
    workflow: "BLOCKED", phase: "configuration", code: "",
    thick: false, client19_3: false, databaseIdentityVerified: false,
    databaseNameMatches: false, serverHostMatches: false, sessionUserMatches: false, mapping: false,
    teamCandidateCount: 0, candidateKeyCount: 0, selectedEmployeeCount: 0,
    httpGets: 0, cardHttpStatus: 0, privacyAllowlist: false, identityVerified: false,
    sourceCoherent: false, boundedSnapshot: false, cardSnapshots: 0,
    leases: 0, readOnlyTransactions: 0, statements: 0, employeeQueries: 0, jobLabelQueries: 0,
    innerJobQueries: 0, maxJobLabelRows: 0, maxInnerJobRows: 0,
    leasesCleaned: true, ownedListenersClosed: true, poolClosed: false,
  };
  let native: OraclePool | undefined, server: Server | undefined;
  const leases: Lease[] = [];
  const canonicalCodes = new Set(["INVALID_REQUEST", "UNAUTHENTICATED", "FORBIDDEN", "EMPLOYEE_NOT_FOUND",
    "DEPENDENCY_UNAVAILABLE", "DEPENDENCY_TIMEOUT", "AMBIGUOUS_EMPLOYEE", "INVALID_SOURCE_DATA", "INTERNAL_ERROR"]);
  try {
    if (env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true" ||
        env.SHF_ORACLE_EXPECTED_DB_NAME?.toUpperCase() !== "WFMT" ||
        typeof env.SHF_ORACLE_EXPECTED_SERVER_HOST !== "string" ||
        !/^[A-Z0-9_-]{1,128}$/.test(env.SHF_ORACLE_EXPECTED_SERVER_HOST))
      throw new SliceError("INVALID_REQUEST");
    const configuration = oracleEnvironment(env);
    result.phase = "native-pool";
    native = await (testDouble ? testDouble.createPool(configuration) : createOraclePool(configuration));
    result.thick = !testDouble && !oracledb.thin;
    result.client19_3 = !testDouble && oracledb.oracleClientVersionString.startsWith("19.3.");
    if (!testDouble && (!result.thick || !result.client19_3)) throw new SliceError("DEPENDENCY_UNAVAILABLE");
    const pool: OraclePool = {
      async getConnection() {
        const c = await native!.getConnection();
        const metric: Lease = { readonly: 0, employee: 0, hierarchy: 0, job: 0, innerJob: 0,
          maxBound: 0, rollback: false, released: false };
        leases.push(metric);
        return {
          get callTimeout() { return c.callTimeout; }, set callTimeout(v: number) { c.callTimeout = v; },
          async execute(sql, binds, bound) {
            // Fail before executing any business SQL if actual TEST identity is
            // unverified. Reused runtime startup can read ONLY bounded hierarchy.
            if (sql !== "SET TRANSACTION READ ONLY" && sql !== employeeCardIdentitySql &&
                !result.databaseIdentityVerified) throw new SliceError("FORBIDDEN");
            if (/\b(?:INSERT|UPDATE|DELETE|MERGE|COMMIT|NEXTVAL|EXECUTE|BEGIN)\b|SELECT\s+\*|\be\.\*/i.test(sql))
              throw new SliceError("FORBIDDEN");
            const hierarchy = sql.includes('AS "grantCode"') && sql.includes("SHIFTER.shf_org_unit");
            const innerJob = sql.includes("FROM SHIFTER.shf_inner_jobs") && sql.includes('AS "code"');
            const gregorian = sql === 'SELECT value AS "calendar" FROM nls_session_parameters WHERE parameter=\'NLS_CALENDAR\'';
            if (![employeeCardIdentitySql, probeSql, mappingSql, employeeCardTeamCandidateSql,
              employeeCardCandidateKeysSql, employeeCardSql, employeeJobLabelSql, "SET TRANSACTION READ ONLY"].includes(sql) &&
                !hierarchy && !innerJob && !gregorian) throw new SliceError("FORBIDDEN");
            metric.maxBound = Math.max(metric.maxBound, bound);
            if (sql === "SET TRANSACTION READ ONLY") metric.readonly++;
            if (sql === employeeCardSql) { metric.employee++; result.employeeQueries++; }
            if (hierarchy) metric.hierarchy++;
            if (sql === employeeJobLabelSql) { metric.job++; result.jobLabelQueries++; }
            if (innerJob) { metric.innerJob++; result.innerJobQueries++; }
            result.statements++;
            const rows = await c.execute(sql, binds, bound);
            if (sql === employeeJobLabelSql) result.maxJobLabelRows = Math.max(result.maxJobLabelRows, rows.length);
            if (innerJob) result.maxInnerJobRows = Math.max(result.maxInnerJobRows, rows.length);
            return rows;
          },
          break: () => c.break(),
          async rollback() { await c.rollback(); metric.rollback = true; },
          async close(drop) { await c.close(drop); metric.released = true; },
        };
      },
      close: () => native!.close(),
    };
    const session = new OracleReadSession(pool);
    result.phase = "database-identity";
    await session.read(async q => {
      const rows = await q(employeeCardIdentitySql, {}, 1);
      if (rows.length !== 1 || !record(rows[0])) throw new SliceError("FORBIDDEN");
      result.databaseNameMatches = typeof rows[0].databaseName === "string" &&
        rows[0].databaseName.toUpperCase() === env.SHF_ORACLE_EXPECTED_DB_NAME;
      result.serverHostMatches = typeof rows[0].serverHost === "string" &&
        rows[0].serverHost.split(".")[0].toUpperCase() === env.SHF_ORACLE_EXPECTED_SERVER_HOST;
      result.sessionUserMatches = rows[0].sessionUser === configuration.user.toUpperCase();
      if (!result.databaseNameMatches || !result.serverHostMatches || !result.sessionUserMatches)
        throw new SliceError("FORBIDDEN");
      result.databaseIdentityVerified = true;
    });
    result.phase = "native-mapping";
    result.mapping = await session.read(async q => {
      await requireGregorian(q);
      const probe = await q(probeSql, {}, 1);
      const rows = await q(mappingSql, { hebrew: "בדיקה סינתטית" }, 1);
      return probe.length === 1 && record(probe[0]) && probe[0].probe === 1 &&
        rows.length === 1 && record(rows[0]) && rows[0].largeId === "9".repeat(38) &&
        rows[0].civilDate === "2024-02-29T23:59:37" && rows[0].unicodeEcho === "בדיקה סינתטית";
    });
    if (!result.mapping) throw new SliceError("INVALID_SOURCE_DATA");
    result.phase = "bounded-candidate";
    const teamRows = await session.read(q => q(employeeCardTeamCandidateSql, { teamType: "J01", parentType: "G01" }, 1));
    result.teamCandidateCount = teamRows.length;
    if (!teamRows.length) { result.workflow = "NO_CANDIDATE"; return result; }
    if (!record(teamRows[0]) || !unitCode(teamRows[0].teamCode)) throw new SliceError("INVALID_SOURCE_DATA");
    const teamCode = teamRows[0].teamCode;
    const keys = await session.read(q => q(employeeCardCandidateKeysSql, { teamCode }, 10));
    result.candidateKeyCount = keys.length;
    if (!keys.length) { result.workflow = "NO_CANDIDATE"; return result; }
    if (!record(keys[0]) || !decimalId(keys[0].employeeId)) throw new SliceError("INVALID_SOURCE_DATA");
    const employeeId = keys[0].employeeId;
    const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [teamCode], dataSource: "oracle-read-only",
      oracleTestScopeConfirmed: true, businessTimeZone: "Asia/Jerusalem" };
    result.selectedEmployeeCount = 1;
    result.phase = "runtime-startup";
    const runtime = await createRuntime(config, new OracleDetailReader(session), undefined, {
      reader: new OracleCurrentReader(session), employeeCardReader: new OracleEmployeeCardReader(session),
    });
    server = createLoopbackServer(runtime);
    server.listen(0, "127.0.0.1"); await once(server, "listening"); result.ownedListenersClosed = false;
    const a = server.address();
    if (!a || typeof a === "string") throw new SliceError("INTERNAL_ERROR");
    const base = `http://127.0.0.1:${a.port}`;
    result.phase = "card-http";
    const response = await fetch(base + `/api/v1/employees/${employeeId}/operational-card`,
      { signal: AbortSignal.timeout(7000) });
    result.httpGets++; result.cardHttpStatus = response.status;
    const card: unknown = await response.json();
    if (response.headers.get("cache-control") !== "no-store" ||
        response.headers.get("x-content-type-options") !== "nosniff" || response.headers.has("etag"))
      throw new SliceError("INTERNAL_ERROR");
    if (response.status === 200) {
      result.privacyAllowlist = response.headers.get("content-type")?.startsWith("application/json") === true &&
        cardHasExactPublicShape(card, employeeId, teamCode);
      if (!result.privacyAllowlist) throw new SliceError("INVALID_SOURCE_DATA");
    } else {
      if (!response.headers.get("content-type")?.startsWith("application/problem+json") ||
          !record(card) || typeof card.code !== "string" || !canonicalCodes.has(card.code) ||
          card.status !== response.status || card.type !== `urn:shf:problem:${card.code}` ||
          Object.keys(card).some(k => !["type", "title", "status", "code", "requestId", "invalidParameters"].includes(k)))
        throw new SliceError("INTERNAL_ERROR");
      result.code = card.code; // canonical outcome, no fallback/second employee.
    }
    result.phase = "identity-http";
    const identityResponse = await fetch(base + "/api/v1/identity", { signal: AbortSignal.timeout(7000) });
    result.httpGets++;
    const identity: unknown = await identityResponse.json();
    result.identityVerified = identityResponse.status === 200 && record(identity) && identity.dataSource === "oracle" &&
      record(identity.principal) && identity.principal.employeeId === null && identity.principal.synthetic === true &&
      isDeepStrictEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read",
        "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"]);
    if (!result.identityVerified) throw new SliceError("INVALID_SOURCE_DATA");
    result.sourceCoherent = result.privacyAllowlist && result.identityVerified;
    result.workflow = result.cardHttpStatus === 200 ? "PASS" : "CANONICAL_ERROR";
    result.phase = "complete";
  } catch (error) {
    result.workflow = "BLOCKED";
    result.code = error instanceof SliceError && canonicalCodes.has(error.code) ? error.code : "INTERNAL_ERROR";
    // Sanitized native code only, never the exception message/SQL/connection.
    if (error instanceof Error && record(error.cause) && typeof error.cause.oracleCode === "string" &&
        /^(?:ORA-[0-9]{5}|DPI-[0-9]{4}|NJS-[0-9]{3})$/.test(error.cause.oracleCode))
      result.code = error.cause.oracleCode;
  } finally {
    try { if (server) { await stopBackendServer(server); result.ownedListenersClosed = true; } }
    catch { result.workflow = "BLOCKED"; result.code = "INTERNAL_ERROR"; }
    try { if (native) { await native.close(); result.poolClosed = true; } }
    catch { result.workflow = "BLOCKED"; result.code = "INTERNAL_ERROR"; }
    result.leases = leases.length;
    result.readOnlyTransactions = leases.reduce((sum, l) => sum + l.readonly, 0);
    result.leasesCleaned = leases.every(l => l.rollback && l.released);
    const cardLeases = leases.filter(l => l.employee > 0);
    result.cardSnapshots = cardLeases.length;
    result.boundedSnapshot = cardLeases.length === 1 && cardLeases.every(l =>
      l.readonly === 1 && l.employee === 1 && l.hierarchy <= 1 && l.job <= 1 && l.innerJob <= 1 &&
      (result.cardHttpStatus !== 200 || l.hierarchy === 1) &&
      l.maxBound <= 101 && l.rollback && l.released);
    if (!result.leasesCleaned || (result.workflow === "PASS" && !result.boundedSnapshot)) {
      result.workflow = "BLOCKED"; result.code = "INTERNAL_ERROR";
    }
  }
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runOracleEmployeeCardLiveCheck(process.env);
  process.stdout.write(JSON.stringify(result) + "\n");
  if (result.workflow !== "PASS") process.exitCode = 1;
}
