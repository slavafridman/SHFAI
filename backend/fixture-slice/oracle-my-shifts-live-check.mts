import { pathToFileURL } from "node:url";
import { once } from "node:events";
import oracledb from "oracledb";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { civil, numberText, OracleCurrentReader, OracleDetailReader } from "./oracle-readers.mts";
import { OracleMyShiftsReader } from "./oracle-my-shifts-reader.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import type { MyShiftsListV1, MyShiftsContextV1 } from "./my-shifts-contracts.mts";

// Authorized CTIDBT_WFMT only. Environment-injected secrets only; no operator
// brief reads, record/identifier logging, broad employee discovery or fixture fallback.
export async function runOracleMyShiftsLiveCheck(env: NodeJS.ProcessEnv) {
  if (env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true") throw Error("Explicit authorized scope required");
  const pool = await createOraclePool(oracleEnvironment(env));
  let phase = "native-mapping";
  try {
    const session = new OracleReadSession(pool);
    const mapping = await session.read(async q => {
      const probe = await q('SELECT 1 AS "probe" FROM dual', {}, 1);
      const rows = await q(`SELECT ${numberText("9007199254740993")} AS "largeId",
        ${civil("TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS')")} AS "civilDate",
        :hebrew AS "unicodeEcho" FROM dual`, { hebrew: "בדיקה סינתטית" }, 1);
      return probe.length === 1 && rows.length === 1 && record(rows[0]) &&
        rows[0].largeId === "9007199254740993" && rows[0].civilDate === "2024-02-29T23:59:37" &&
        rows[0].unicodeEcho === "בדיקה סינתטית";
    });
    if (!mapping || oracledb.thin || !oracledb.oracleClientVersionString.startsWith("19.3."))
      throw Error("Native mapping check failed");
    phase = "bounded-keys";
    const keys = await session.read(q => q(`SELECT ${numberText("shf_employee_day_id")} AS "dayId"
      FROM SHIFTER.shf_employee_day WHERE wm_day_type=:dayType
      AND wm_shift_start_datetime IS NOT NULL AND ROWNUM <= 10`, { dayType: 4 }, 10));
    if (!keys.length) return { mapping, thick: true, candidateKeyCount: 0, actorCount: 0, workflow: "NOT_RUN_NO_CANDIDATE" };
    const binds: Record<string, string | number> = { dayType: 4 };
    const placeholders = keys.map((r, i) => {
      if (!record(r) || !decimalId(r.dayId, 10)) throw Error("Invalid key");
      binds[`key${i}`] = r.dayId; return `TO_NUMBER(:key${i})`;
    });
    phase = "one-actor";
    const candidates = await session.read(q => q(`SELECT * FROM (
      SELECT ${numberText("e.employee_id")} AS "employeeId", e.org_unit_id AS "teamCode",
        ${civil("NVL(c.new_shift_start,d.wm_shift_start_datetime)")} AS "startLocal"
      FROM SHIFTER.shf_employee_day d
      LEFT JOIN SHIFTER.shf_day_changes c ON c.shf_employee_day_id=d.shf_employee_day_id
      JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=NVL(c.new_employee_id,d.emp_id_number)
      JOIN SHIFTER.shf_org_unit t ON t.org_unit_id=e.org_unit_id AND t.unit_type_id='J01'
      JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit AND p.unit_type_id='G01'
      WHERE d.shf_employee_day_id IN (${placeholders.join(",")}) AND e.employee_id IS NOT NULL
        AND ((c.shf_employee_day_id IS NULL AND d.wm_day_type=:dayType)
          OR (c.new_employee_id IS NOT NULL AND c.new_day_type=:dayType
            AND c.new_shift_start IS NOT NULL AND c.cancel_reason_code IS NULL)))
      WHERE ROWNUM <= 1`, binds, 1));
    if (!candidates.length) return { mapping, thick: true, candidateKeyCount: keys.length,
      actorCount: 0, workflow: "NOT_RUN_NO_CANDIDATE" };
    const candidate = candidates[0];
    if (!record(candidate) || !decimalId(candidate.employeeId) ||
        !unitCode(candidate.teamCode) || !localDateTime(candidate.startLocal)) throw Error("Invalid candidate");
    const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [candidate.teamCode], dataSource: "oracle-read-only",
      oracleTestScopeConfirmed: true, businessTimeZone: "Asia/Jerusalem" };
    phase = "runtime";
    const rt = await createRuntime(config, new OracleDetailReader(session), undefined,
      { reader: new OracleCurrentReader(session), myShiftsReader: new OracleMyShiftsReader(session) });
    const principal = await rt.authenticate({ authorization: null });
    const actorRequest = { mode: "selected" as const, employeeId: candidate.employeeId };
    const listRequest = { ...actorRequest, dateFrom: candidate.startLocal.slice(0, 10),
      dateTo: candidate.startLocal.slice(0, 10), limit: 2 };
    phase = "context";
    const context = await rt.myShiftsContext(principal, actorRequest);
    phase = "schedule";
    const list = await rt.myShiftsList(principal, listRequest);
    if (!list.items.length || list.items.length > 2 || context.actor.employee?.employeeId !== candidate.employeeId)
      throw Error("Schedule workflow failed");
    phase = "detail";
    const row = list.items[0];
    const detail = await rt.read(principal, row.employee.employeeId, row.shiftDayId);
    const detailCoherent = detail.employeeId === row.employee.employeeId && detail.shiftDayId === row.shiftDayId &&
      detail.effectiveShift.startLocal === row.startLocal && detail.effectiveShift.endLocal === row.endLocal;
    const sources = context.dataSource === "oracle-read-only" && list.dataSource === "oracle-read-only" &&
      detail.dataSource === "oracle" && rt.identity(principal).dataSource === "oracle";
    if (!detailCoherent || !sources) throw Error("Coherence failed");
    phase = "http";
    const server = createLoopbackServer(rt);
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    let httpGets = 0;
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw Error("Loopback unavailable");
      const paths = ["/api/v1/my-shifts/context?" + new URLSearchParams(actorRequest).toString(),
        "/api/v1/my-shifts?" + new URLSearchParams({ ...listRequest, limit: "2" }).toString(),
        `/api/v1/employees/${row.employee.employeeId}/shift-days/${row.shiftDayId}`];
      for (const path of paths) {
        const response = await fetch(`http://127.0.0.1:${address.port}` + path);
        if (response.status !== 200 || response.headers.get("cache-control") !== "no-store") throw Error("HTTP failed");
        await response.arrayBuffer(); httpGets++;
      }
    } finally { await stopBackendServer(server); }
    phase = "environment-bootstrap";
    const boot = await startFromEnvironment({ ...env, SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0" });
    try {
      const address = boot.address();
      if (!address || typeof address === "string") throw Error("Bootstrap unavailable");
      const base = `http://127.0.0.1:${address.port}`;
      const response = await fetch(base + "/api/v1/my-shifts/context?" + new URLSearchParams(actorRequest).toString());
      if (response.status !== 200 || (await response.json() as MyShiftsContextV1).dataSource !== "oracle-read-only")
        throw Error("Bootstrap context failed");
      const page = await fetch(base + "/api/v1/my-shifts?" +
        new URLSearchParams({ ...listRequest, limit: "2" }).toString());
      if (page.status !== 200 || (await page.json() as MyShiftsListV1).dataSource !== "oracle-read-only")
        throw Error("Bootstrap list failed");
    } finally { await stopBackendServer(boot); }
    return { mapping, thick: true, client19_3: true, candidateKeyCount: keys.length, actorCount: 1,
      scheduleRows: list.items.length, detailCoherent, sources, httpGets, environmentBootstrap: true,
      listenersClosed: true, workflow: "PASS" };
  } catch (error) {
    // Diagnostic allowlist only, no raw message/SQL/rows/connection string.
    const cause = record(error) && record(error.cause) && typeof error.cause.oracleCode === "string"
      ? error.cause.oracleCode : undefined;
    const code = record(error) && typeof error.code === "string" &&
      /^[A-Z][A-Z_]{0,50}$/.test(error.code) ? error.code : "CHECK_FAILED";
    throw Object.assign(new Error("Authorized schedule live check failed"), { phase, code,
      ...(cause ? { oracleCode: cause } : {}) });
  } finally { await pool.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(JSON.stringify(await runOracleMyShiftsLiveCheck(process.env)) + "\n"); }
  catch (error) {
    process.stderr.write(JSON.stringify({ workflow: "FAIL",
      ...(record(error) ? { phase: error.phase, code: error.code, oracleCode: error.oracleCode } : {}) }) + "\n");
    process.exitCode = 1;
  }
}
