import assert from "node:assert/strict";
import { request } from "node:http";
import type { BindParameters } from "oracledb";
import type { OraclePool, OracleConnection } from "../oracle-session.mts";
import { record } from "../contract-validation.mts";

// Pure isolated fixtures: importing this module registers no tests or listeners.
export const env = { SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_ORACLE_USER: "shifter",
  SHF_ORACLE_PASSWORD: "synthetic-only-not-a-real-password", SHF_ORACLE_CLIENT_LIB_DIR: "C:\\synthetic\\bin",
  TNS_ADMIN: "C:\\synthetic\\network\\admin" };
export const options = { testReadOnly: true, orgUnitId: "DEMO", port: 0 };
export function protocolDouble(scope?: unknown[]) {
  let closed = 0, leases = 0, rollbacks = 0, releases = 0, probes = 0, breaks = 0;
  const statements: Array<{ sql: string; binds: BindParameters; bound: number; lease: number; timeout: number }> = [];
  let fail = false, badProbe = false;
  let hierarchy: ((rows: unknown[]) => unknown[]) | undefined;
  let waitDiscovery: (() => Promise<void>) | undefined;
  let waitProbe: (() => Promise<void>) | undefined;
  const pool: OraclePool = {
    async getConnection() {
      leases++;
      const lease = leases;
      const connection: OracleConnection = {
        callTimeout: 0,
        async execute(sql, binds, bound) {
          statements.push({ sql, binds, bound, lease, timeout: this.callTimeout });
          if (fail) throw { code: "ORA-01017", message: "private-host SQL password record" };
          if (sql === "SET TRANSACTION READ ONLY") return [];
          if (sql === 'SELECT 1 AS "probe" FROM dual') {
            probes++; await waitProbe?.(); return badProbe ? [] : [{ probe: 1 }];
          }
          if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
          if (sql.includes('"scopeRow"')) {
            await waitDiscovery?.();
            assert.ok(record(binds));
            assert.equal(binds.teamType, "J01");
            assert.equal(typeof binds.lowerBound, "number"); assert.equal(typeof binds.upperBound, "number");
            return (scope ?? []).slice(Number(binds.lowerBound), Number(binds.upperBound));
          }
          if (scope && sql.includes('"grantCode"')) {
            assert.ok(record(binds));
            const rows = Object.entries(binds).filter(([key]) => /^team\d+$/.test(key)).map(([, id]) => ({
              grantCode: id, teamCode: id, teamLabel: "Synthetic team", teamType: "J01",
              code: "PARENT", label: "Synthetic parent", unitType: "G01",
            }));
            return hierarchy ? hierarchy(rows) : rows;
          }
          if (sql.includes('"grantCode"')) return [{
            grantCode: "DEMO", teamCode: "DEMO", teamLabel: "Synthetic team", teamType: "J01",
            code: "DEMO-P", label: "Synthetic parent", unitType: "G01",
          }];
          return []; // Honest empty/not-found records from this labeled protocol double.
        },
        async rollback() { rollbacks++; },
        async close() { releases++; },
        async break() { breaks++; },
      };
      return connection;
    },
    async close() { closed++; },
  };
  return { pool, statements, get closed() { return closed; }, get leases() { return leases; },
    get rollbacks() { return rollbacks; }, get releases() { return releases; }, get probes() { return probes; },
    get breaks() { return breaks; }, set fail(value: boolean) { fail = value; },
    set hierarchy(value: ((rows: unknown[]) => unknown[]) | undefined) { hierarchy = value; },
    set waitDiscovery(value: (() => Promise<void>) | undefined) { waitDiscovery = value; },
    set badProbe(value: boolean) { badProbe = value; }, set waitProbe(value: (() => Promise<void>) | undefined) { waitProbe = value; } };
}
export async function raw(url: string, path: string, headers: Record<string, string> = {}, method = "GET") {
  const target = new URL(url);
  return new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: string }>((done, fail) => {
    const req = request({ hostname: target.hostname, port: target.port, path, headers, method, agent: false }, response => {
      let body = "";
      response.setEncoding("utf8"); response.on("data", part => { body += part; });
      response.on("end", () => done({ status: response.statusCode ?? 0, headers: response.headers, body }));
    });
    req.on("error", fail); req.end();
  });
}
