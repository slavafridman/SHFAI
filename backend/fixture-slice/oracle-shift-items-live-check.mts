import { pathToFileURL } from "node:url";
import oracledb from "oracledb";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { civil, detailContextRows, numberText, rawDetail, requireGregorian } from "./oracle-readers.mts";
import { decimalId, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";
import { project } from "./projection.mts";
import type { SelectedShiftItemsV1 } from "./shift-items-contracts.mts";
import { isDeepStrictEqual } from "node:util";
import type { OraclePool } from "./oracle-session.mts";
import { OracleShiftItemsReader } from "./oracle-shift-items-reader.mts";
import { GetSelectedShiftItems } from "./read-shift-items.mts";
import { shiftItemsAccessPolicy } from "./access-policy.mts";
import { SyntheticAdministratorProvider } from "./synthetic-identity.mts";

// Operator-supplied app environment only. No brief/secret-file reads, values,
// SQL, records or identifiers printed. Never auto-run from npm test/start.
export async function runOracleShiftItemsLiveCheck(env: NodeJS.ProcessEnv) {
  if (env.SHF_ORACLE_TEST_SCOPE_CONFIRMED !== "true") throw Error("Explicit test scope required");
  const native = await createOraclePool(oracleEnvironment(env));
  const leases: Array<{ readonly: number; context: number; probe: number; page: number;
    maxBound: number; rollback: boolean; released: boolean }> = [];
  const pool: OraclePool = {
    async getConnection() {
      const c = await native.getConnection();
      const metric = { readonly: 0, context: 0, probe: 0, page: 0, maxBound: 0, rollback: false, released: false };
      leases.push(metric);
      return {
        get callTimeout() { return c.callTimeout; }, set callTimeout(v: number) { c.callTimeout = v; },
        async execute(sql, binds, bound) {
          metric.maxBound = Math.max(metric.maxBound, bound);
          if (sql === "SET TRANSACTION READ ONLY") metric.readonly++;
          if (sql.includes('AS "employeeReference"')) metric.context++;
          if (sql.includes("HAVING COUNT(*)>1")) metric.probe++;
          if (sql.includes("ROW_NUMBER()")) metric.page++;
          return c.execute(sql, binds, bound);
        },
        break: () => c.break(),
        async rollback() { await c.rollback(); metric.rollback = true; },
        async close(drop) { await c.close(drop); metric.released = true; },
      };
    },
    close: () => native.close(),
  };
  let phase = "native-mapping";
  try {
    const session = new OracleReadSession(pool);
    const mapping = await session.read(async q => {
      await requireGregorian(q);
      const probe = await q('SELECT 1 AS "probe" FROM dual', {}, 1);
      const rows = await q(`SELECT ${numberText("9007199254740993")} AS "largeId",
        ${civil("TO_DATE('2024-02-29 23:59:37','YYYY-MM-DD HH24:MI:SS')")} AS "civilDate",
        :hebrew AS "unicodeEcho" FROM dual`, { hebrew: "בדיקה סינתטית" }, 1);
      return probe.length === 1 && record(probe[0]) && probe[0].probe === 1 &&
        rows.length === 1 && record(rows[0]) && rows[0].largeId === "9007199254740993" &&
        rows[0].civilDate === "2024-02-29T23:59:37" && rows[0].unicodeEcho === "בדיקה סינתטית";
    });
    if (!mapping || oracledb.thin || !oracledb.oracleClientVersionString.startsWith("19.3."))
      throw Error("Native mapping failed");
    phase = "bounded-candidate-keys";
    // <=10 candidate keys only; no employee directory or broad row projection.
    // Picking a candidate key is NOT accepting its detail uniqueness: the exact
    // one-day full join below still resolves <=2 and rejects multiplicity.
    const keys = await session.read(q => q(`SELECT ${numberText("x.agent_day_id")} AS "dayId"
      FROM SHIFTER.shf_employee_exceptions x WHERE x.state_type>0
      AND x.cancel_reason_code IS NULL AND x.agent_day_id IS NOT NULL AND ROWNUM<=10`, {}, 10));
    if (!keys.length) return { mapping, thick: true, candidateKeyCount: 0, selectedDayCount: 0,
      workflow: "NOT_RUN_NO_CANDIDATE" };
    const key = keys[0];
    if (!record(key) || !decimalId(key.dayId, 10)) throw Error("Invalid candidate key");
    phase = "one-day-context";
    const contexts = await session.read(async q => {
      await requireGregorian(q); return detailContextRows(q, key.dayId as string);
    });
    if (contexts.length !== 1) return { mapping, thick: true, candidateKeyCount: keys.length, selectedDayCount: 1,
      workflow: contexts.length ? "NOT_RUN_AMBIGUOUS_CANDIDATE" : "NOT_RUN_UNRESOLVED_CANDIDATE" };
    const detail = rawDetail(contexts[0]);
    if (detail.orgUnitId === null || !unitCode(detail.orgUnitId)) throw Error("Invalid candidate unit");
    const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: [detail.orgUnitId],
      dataSource: "oracle-read-only", oracleTestScopeConfirmed: true, businessTimeZone: "Asia/Jerusalem" };
    phase = "bounded-snapshot";
    const principal = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
    const itemsReader = new OracleShiftItemsReader(session);
    const direct = await new GetSelectedShiftItems(itemsReader, shiftItemsAccessPolicy(config), "Asia/Jerusalem")
      .read(principal, { employeeId: detail.employeeId, shiftDayId: detail.shiftDayId, limit: 2 });
    const itemLeases = leases.filter(l => l.page > 0);
    const boundedSnapshot = itemLeases.length === 1 && itemLeases[0].readonly === 1 &&
      itemLeases[0].context === 1 && itemLeases[0].probe === 1 && itemLeases[0].page === 1 &&
      itemLeases[0].maxBound <= 101 && itemLeases[0].rollback && itemLeases[0].released;
    if (!boundedSnapshot) throw Error("Bounded snapshot failed");
    phase = "environment-bootstrap";
    const server = await startFromEnvironment({ ...env, SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0" });
    let itemCount = 0, detailCoherent = false, sources = false;
    try {
      const a = server.address();
      if (!a || typeof a === "string") throw Error("Owned loopback unavailable");
      const base = `http://127.0.0.1:${a.port}`;
      phase = "items-http";
      const response = await fetch(base + `/api/v1/employees/${detail.employeeId}/shift-days/${detail.shiftDayId}/breaks-and-exceptions?limit=2`);
      if (response.status !== 200 || response.headers.get("cache-control") !== "no-store" ||
          response.headers.get("x-content-type-options") !== "nosniff") throw Error("Items HTTP failed");
      const body = await response.json() as SelectedShiftItemsV1;
      itemCount = body.items.length;
      detailCoherent = isDeepStrictEqual(body.shiftDay, project(detail, "Asia/Jerusalem", "oracle")) &&
        isDeepStrictEqual(body.shiftDay, direct.shiftDay) &&
        body.displayContext.unit.code === detail.orgUnitId;
      phase = "identity";
      const identity = await (await fetch(base + "/api/v1/identity")).json() as {
        dataSource: string; principal: { employeeId: null; capabilities: string[] } };
      sources = body.shiftDay.dataSource === "oracle" && identity.dataSource === "oracle" &&
        identity.principal.employeeId === null && identity.principal.capabilities.join(",") ===
        "shift-day:read,current-shifts:read,shift-search:read,my-shifts:read,shift-items:read";
      if (!detailCoherent || !sources || itemCount > 2) throw Error("Coherence failed");
    } finally { await stopBackendServer(server); }
    return { mapping, thick: true, client19_3: true, candidateKeyCount: keys.length, selectedDayCount: 1,
      itemLimit: 2, itemCount, detailCoherent, sources, environmentBootstrap: true,
      boundedSnapshot, observedItemSnapshots: itemLeases.length,
      observedLeasesCleaned: leases.every(l => l.rollback && l.released),
      httpGets: 2, ownedListenersClosed: true, workflow: "PASS" };
  } catch {
    // Only fixed phase names, never raw native failures, SQL, config or records.
    throw Error(`Selected-items live check failed at ${phase}`);
  } finally { await pool.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(JSON.stringify(await runOracleShiftItemsLiveCheck(process.env)) + "\n"); }
  catch { process.stderr.write("Selected-items live check failed (sanitized)\n"); process.exitCode = 1; }
}
