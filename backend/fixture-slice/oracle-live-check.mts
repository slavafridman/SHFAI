import { pathToFileURL } from "node:url";
import { oracleEnvironment } from "./runtime-config.mts";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import { OracleCurrentReader, OracleDetailReader } from "./oracle-readers.mts";
import { record, decimalId, localDateTime } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { once } from "node:events";
import { startFromEnvironment, stopBackendServer } from "./server.mts";

// Explicit opt-in live acceptance check. Only aggregate/shape results leave this module.
// Credentials are environment-only; this code never reads the brief or logs source rows.
export async function runOracleLiveCheck(env: NodeJS.ProcessEnv) {
  if (env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true")
    throw new Error("Explicit authorized Oracle test scope required");
  const pool = await createOraclePool(oracleEnvironment(env));
  let phase = "mapping";
  try {
    const session = new OracleReadSession(pool);
    const mapping = await session.read(async query => {
      const rows = await query(`SELECT
        TO_CHAR(9007199254740993,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "largeId",
        TO_CHAR(TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS'),'YYYY-MM-DD"T"HH24:MI:SS') AS "civilDate",
        :hebrew AS "unicodeEcho" FROM dual`, { hebrew: "בדיקה סינתטית" }, 1);
      return rows.length === 1 && record(rows[0]) && rows[0].largeId === "9007199254740993" &&
        rows[0].civilDate === "2024-02-29T23:59:37" && rows[0].unicodeEcho === "בדיקה סינתטית";
    });
    if (!mapping) throw new Error("Oracle mapping failed");
    // One bounded candidate for authorized workflow characterization, no employee/name preload.
    phase = "bounded-candidate-keys";
    const keys = await session.read(query => query(`SELECT
      TO_CHAR(shf_employee_day_id,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "dayId"
      FROM SHIFTER.shf_employee_day WHERE wm_day_type=:dayType
      AND wm_shift_start_datetime IS NOT NULL AND wm_shift_end_datetime IS NOT NULL
      AND ROWNUM <= 10`, { dayType: 4 }, 10));
    const keyBinds: Record<string, string | number> = { dayType: 4 };
    const placeholders = keys.map((key, i) => {
      if (!record(key) || !decimalId(key.dayId, 10)) throw new Error("Invalid Oracle candidate key");
      keyBinds[`day${i}`] = key.dayId;
      return `TO_NUMBER(:day${i})`;
    });
    if (keys.length === 0)
      return { mapping: true, candidateCount: 0, workflow: "NOT_RUN_NO_QUALIFYING_CANDIDATE" };
    phase = "candidate";
    const candidates = await session.read(query => query(`SELECT * FROM (SELECT
      TO_CHAR(d.shf_employee_day_id,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "shiftDayId",
      TO_CHAR(e.employee_id,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "employeeId",
      e.org_unit_id AS "teamCode",
      TO_CHAR(TRUNC(NVL(c.new_shift_start,d.wm_shift_start_datetime),'MI')+1/1440,
        'YYYY-MM-DD"T"HH24:MI:SS') AS "atLocal"
      FROM SHIFTER.shf_employee_day d
      LEFT JOIN SHIFTER.shf_day_changes c ON d.shf_employee_day_id=c.shf_employee_day_id
      JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=NVL(c.new_employee_id,d.emp_id_number)
      JOIN SHIFTER.shf_org_unit t ON t.org_unit_id=e.org_unit_id AND t.unit_type_id='J01'
      JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit AND p.unit_type_id='G01'
      WHERE c.cancel_reason_code IS NULL AND NVL(c.new_day_type,d.wm_day_type)=:dayType
      AND d.shf_employee_day_id IN (${placeholders.join(",")})
      AND TRUNC(NVL(c.new_shift_start,d.wm_shift_start_datetime),'MI')+1/1440
        < NVL(c.new_shift_end,d.wm_shift_end_datetime)) WHERE ROWNUM <= 1`, keyBinds, 1));
    if (candidates.length === 0)
      return { mapping: true, candidateCount: 0, workflow: "NOT_RUN_NO_QUALIFYING_CANDIDATE" };
    const candidate = candidates[0];
    if (!record(candidate) || !decimalId(candidate.shiftDayId, 10) || !decimalId(candidate.employeeId) ||
        !unitCode(candidate.teamCode) || !localDateTime(candidate.atLocal))
      throw new Error("Invalid Oracle candidate");
    const config = {
      deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [candidate.teamCode],
      dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
      businessTimeZone: "Asia/Jerusalem", // explicit test zone, not established real policy
    };
    phase = "runtime-startup";
    const runtime = await createRuntime(config, new OracleDetailReader(session), undefined,
      { reader: new OracleCurrentReader(session) });
    const principal = await runtime.authenticate({ authorization: null });
    phase = "context";
    const context = await runtime.currentContext(principal);
    const request = { mode: "at" as const, attendanceDate: candidate.atLocal.slice(0, 10),
      currentTime: candidate.atLocal.slice(11, 16), limit: 2 };
    phase = "at-list";
    const list = await runtime.currentList(principal, request);
    phase = "detail";
    const detail = await runtime.read(principal, candidate.employeeId, candidate.shiftDayId);
    phase = "current-list";
    const current = await runtime.currentList(principal, { mode: "current", limit: 1 });
    phase = "empty-window";
    const emptyPage = await runtime.currentList(principal, { ...request, offset: 10000 });
    if (context.dataSource !== "oracle-read-only" || list.dataSource !== "oracle-read-only" ||
        detail.dataSource !== "oracle" || runtime.identity(principal).dataSource !== "oracle")
      throw new Error("Oracle source mismatch");
    phase = "http";
    const server = createLoopbackServer(runtime);
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Loopback unavailable");
    try {
      const prefix = `http://127.0.0.1:${address.port}`;
      const paths = ["/api/v1/identity", "/api/v1/current-shifts/filter-context",
        `/api/v1/current-shifts?mode=at&attendanceDate=${request.attendanceDate}&currentTime=${request.currentTime}&limit=2`,
        `/api/v1/employees/${candidate.employeeId}/shift-days/${candidate.shiftDayId}`];
      for (const path of paths) {
        const response = await fetch(prefix + path);
        if (response.status !== 200 || response.headers.get("cache-control") !== "no-store")
          throw new Error("Oracle HTTP check failed");
        await response.arrayBuffer(); // consume only, never print/retain business response
      }
      phase = "environment-bootstrap";
      const boot = await startFromEnvironment({ ...env, SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0" });
      try {
        const bound = boot.address();
        if (!bound || typeof bound === "string") throw new Error("Oracle boot unavailable");
        const response = await fetch(`http://127.0.0.1:${bound.port}/api/v1/identity`);
        const identity = await response.json();
        if (response.status !== 200 || !record(identity) || identity.dataSource !== "oracle")
          throw new Error("Oracle boot source mismatch");
      } finally { await stopBackendServer(boot); }
      return {
        mapping: true, candidateCount: 1, workflow: "PASS", httpGetCount: paths.length,
        optionsCount: context.mokedOptions.length, atItemsCount: list.items.length,
        currentItemsCount: current.items.length, ceilingItemsCount: emptyPage.items.length,
        detailShape: true, sourceMarkers: true,
        environmentBootstrap: true,
      };
    } finally {
      const closed = once(server, "close");
      server.close(); server.closeAllConnections(); await closed;
    }
  } catch (error) {
    if (error instanceof Error)
      error.cause = { ...(record(error.cause) ? error.cause : {}), checkPhase: phase };
    throw error;
  } finally { await pool.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await runOracleLiveCheck(process.env))); }
  catch {
    process.stderr.write("Authorized Oracle read-only check failed\n");
    process.exitCode = 1;
  }
}
