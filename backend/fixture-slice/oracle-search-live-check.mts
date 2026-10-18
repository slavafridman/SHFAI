import { pathToFileURL } from "node:url";
import { once } from "node:events";
import { oracleEnvironment } from "./runtime-config.mts";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import { OracleCurrentReader, OracleDetailReader, civil, numberText } from "./oracle-readers.mts";
import { OracleSearchReader, searchBranches } from "./oracle-search-reader.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";

// Explicit authorized test only. Operator injects environment; no brief/secret-file reads.
// Output is aggregate flags/counts only; never log raw records, IDs or error messages.
export async function runOracleSearchLiveCheck(env: NodeJS.ProcessEnv) {
  if (env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true") throw new Error("Explicit authorized scope required");
  const pool = await createOraclePool(oracleEnvironment(env));
  let phase = "mapping";
  try {
    const session = new OracleReadSession(pool);
    const mapping = await session.read(async q => {
      const rows = await q(`SELECT ${numberText("9007199254740993")} AS "largeId",
        TO_CHAR(TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS'),
          'YYYY-MM-DD"T"HH24:MI:SS') AS "civilDate", :hebrew AS "unicodeEcho" FROM dual`,
      { hebrew: "בדיקה סינתטית" }, 1);
      return rows.length === 1 && record(rows[0]) && rows[0].largeId === "9007199254740993" &&
        rows[0].civilDate === "2024-02-29T23:59:37" && rows[0].unicodeEcho === "בדיקה סינתטית";
    });
    if (!mapping) throw new Error("Mapping check failed");
    phase = "bounded-keys";
    const keys = await session.read(q => q(`SELECT ${numberText("shf_employee_day_id")} AS "dayId"
      FROM SHIFTER.shf_employee_day WHERE wm_day_type=:dayType
      AND wm_shift_start_datetime IS NOT NULL AND wm_shift_end_datetime IS NOT NULL
      AND ROWNUM <= 10`, { dayType: 4 }, 10));
    const binds: Record<string, string | number> = {
      dayType: 4, fromLocal: "0001-01-01T00:00:00", toLocal: "9999-12-31T23:59:00",
    };
    const placeholders = keys.map((r, i) => {
      if (!record(r) || !decimalId(r.dayId, 10)) throw new Error("Invalid candidate");
      binds[`key${i}`] = r.dayId; return `TO_NUMBER(:key${i})`;
    });
    if (!keys.length) return { mapping, candidateKeyCount: 0, candidateCount: 0, workflow: "NOT_RUN_NO_CANDIDATE" };
    phase = "bounded-candidate";
    const candidates = await session.read(q => q(`SELECT * FROM (${searchBranches(
      `${civil("NVL(c.new_shift_start,d.wm_shift_start_datetime)")} AS "startLocal",
       e.org_unit_id AS "teamCode"`, () => `AND d.shf_employee_day_id IN (${placeholders.join(",")})
       AND u.unit_type_id='J01' AND EXISTS (SELECT 1 FROM SHIFTER.shf_org_unit p
         WHERE p.org_unit_id=u.parent_unit AND p.unit_type_id='G01')`)}) WHERE ROWNUM <= 1`, binds, 1));
    if (!candidates.length) return { mapping, candidateKeyCount: keys.length, candidateCount: 0, workflow: "NOT_RUN_NO_CANDIDATE" };
    const c = candidates[0];
    if (!record(c) || !unitCode(c.teamCode) || !localDateTime(c.startLocal)) throw new Error("Invalid candidate");
    // Same civil date, exact :00 bounds. Seconds >0 need the next minute, never a whole-minute upper bound.
    const minute = c.startLocal.slice(11, 16);
    const minuteValue = Number(minute.slice(0, 2)) * 60 + Number(minute.slice(3));
    const upperValue = minuteValue + (c.startLocal.endsWith(":00") ? 0 : 1);
    if (upperValue >= 1440) return { mapping, candidateKeyCount: keys.length, candidateCount: 1, workflow: "NOT_RUN_CIVIL_BOUNDARY" };
    const upper = String(Math.floor(upperValue / 60)).padStart(2, "0") + ":" + String(upperValue % 60).padStart(2, "0");
    const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [c.teamCode], dataSource: "oracle-read-only",
      oracleTestScopeConfirmed: true, businessTimeZone: "Asia/Jerusalem" };
    phase = "runtime-startup";
    const rt = await createRuntime(config, new OracleDetailReader(session), undefined,
      { reader: new OracleCurrentReader(session), searchReader: new OracleSearchReader(session) });
    const p = await rt.authenticate({ authorization: null });
    phase = "context";
    const context = await rt.searchContext(p);
    phase = "search";
    const request = { attendanceDate: c.startLocal.slice(0, 10), timeFrom: minute, timeTo: upper, limit: 2 };
    const list = await rt.searchList(p, request);
    if (!list.items.length) throw new Error("Expected scoped search result");
    const selected = list.items[0];
    phase = "selected-detail";
    const detail = await rt.read(p, selected.employee.employeeId, selected.shiftDayId);
    if (detail.employeeId !== selected.employee.employeeId || detail.shiftDayId !== selected.shiftDayId ||
        detail.effectiveShift.startLocal !== selected.startLocal || detail.effectiveShift.endLocal !== selected.endLocal)
      throw new Error("Selected detail mismatch");
    if (context.dataSource !== "oracle-read-only" || list.dataSource !== "oracle-read-only" ||
        detail.dataSource !== "oracle" || rt.identity(p).dataSource !== "oracle") throw new Error("Source mismatch");
    phase = "http";
    const server = createLoopbackServer(rt);
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test listener unavailable");
      const query = new URLSearchParams({ attendanceDate: request.attendanceDate, timeFrom: request.timeFrom,
        timeTo: request.timeTo, limit: "2" }).toString();
      const paths = ["/api/v1/identity", "/api/v1/shift-search/filter-context", "/api/v1/shift-search?" + query,
        `/api/v1/employees/${selected.employee.employeeId}/shift-days/${selected.shiftDayId}`];
      for (const path of paths) {
        const response = await fetch(`http://127.0.0.1:${address.port}` + path);
        if (response.status !== 200 || response.headers.get("cache-control") !== "no-store")
          throw new Error("Live HTTP check failed");
        await response.arrayBuffer();
      }
      phase = "environment-bootstrap";
      const boot = await startFromEnvironment({ ...env, SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0" });
      try {
        const address = boot.address();
        if (!address || typeof address === "string") throw new Error("Bootstrap unavailable");
        const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/shift-search?` + query);
        if (response.status !== 200) throw new Error("Bootstrap search failed");
        await response.arrayBuffer();
      } finally { await stopBackendServer(boot); }
      return { mapping, candidateKeyCount: keys.length, candidateCount: 1, workflow: "PASS",
        parentCount: context.mokedOptions.length, teamCount: context.teamOptions.length,
        roleCount: context.innerJobOptions.length, searchItemsCount: list.items.length, httpGetCount: paths.length,
        selectedDetailCoherent: true, sourceMarkers: true, environmentBootstrap: true };
    } finally { const closed = once(server, "close"); server.close(); server.closeAllConnections(); await closed; }
  } catch (error) {
    if (error instanceof Error) error.cause = { ...(record(error.cause) ? error.cause : {}), checkPhase: phase };
    throw error;
  } finally { await pool.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await runOracleSearchLiveCheck(process.env))); }
  catch { process.stderr.write("Authorized Oracle search read-only check failed\n"); process.exitCode = 1; }
}
