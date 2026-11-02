// Windows operator demonstration host, NOT independent Oracle TEST certification.
// No domain endpoints, credentials, retry policy or write authority are added here.
import { createServer, request as httpRequest } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { readFile, readdir, lstat } from "node:fs/promises";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { oracleEnvironment } from "./runtime-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { createOraclePool, OracleReadSession } from "./oracle-session.mts";
import type { OraclePool } from "./oracle-session.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";
import { loadEnvironmentConfig } from "./environment-profiles.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { record } from "./contract-validation.mts";
import { validateConnectionRuntime } from "./oracle-connection-check.mts";
import { backendLifecycle } from "./backend-lifecycle.mts";
import { teamsAndParents } from "./oracle-readers.mts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const oracleKeys = ["SHF_ORACLE_CONNECT_STRING", "SHF_ORACLE_USER", "SHF_ORACLE_PASSWORD",
  "SHF_ORACLE_CLIENT_LIB_DIR", "TNS_ADMIN"] as const;
const falseAuthority = Object.freeze({
  targetIdentityVerified: false, nativeWritesAuthorized: false, releaseReady: false,
});
export type OracleDemoOptions = {
  testReadOnly: boolean;
  port?: number;
} & ({ orgUnitId: string; allTestUnits?: never } | { allTestUnits: true; orgUnitId?: never });
const scopeReasons = ["EMPTY_SCOPE", "INVALID_ROW_SHAPE", "INVALID_TEAM_CODE", "INVALID_TEAM_TYPE",
  "MISSING_OR_INVALID_PARENT", "SELF_PARENT", "DUPLICATE_TEAM", "HIERARCHY_CARDINALITY",
  "TEAM_LABEL_INVALID", "PARENT_NOT_G01", "PARENT_LABEL_INVALID", "PARENT_LABEL_CONFLICT",
  "FOREIGN_OR_MISSING_TEAM", "PARENT_CHANGED", "UNCLASSIFIED_SOURCE_FAILURE"] as const;
type ScopeDiagnostic = Readonly<{
  stage: "discovery" | "hierarchy" | "snapshot";
  reason: typeof scopeReasons[number];
  discoveredCount: number;
  validatedCount: number;
}>;
function safeScopeDiagnostic(value: ScopeDiagnostic): ScopeDiagnostic | undefined {
  const count = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 1000;
  if (!record(value) || Object.keys(value).sort().join(",") !== "discoveredCount,reason,stage,validatedCount" ||
      !["discovery", "hierarchy", "snapshot"].includes(value.stage) || !scopeReasons.includes(value.reason) ||
      !count(value.discoveredCount) || !count(value.validatedCount) || value.validatedCount > value.discoveredCount)
    return undefined;
  return Object.freeze({ stage: value.stage, reason: value.reason,
    discoveredCount: value.discoveredCount, validatedCount: value.validatedCount });
}
export class DemoHostError extends Error {
  readonly oracleCode?: string;
  readonly scopeDiagnostic?: ScopeDiagnostic;
  constructor(code: string, cause?: unknown, scopeDiagnostic?: ScopeDiagnostic) {
    super(code);
    if (code === "DEMO_SCOPE_INVALID" && scopeDiagnostic)
      this.scopeDiagnostic = safeScopeDiagnostic(scopeDiagnostic);
    const detail = record(cause) && record(cause.cause) ? cause.cause : cause;
    const candidate = record(detail) ? detail.oracleCode ?? detail.code : undefined;
    if (typeof candidate === "string" && /^(?:ORA-\d{5}|NJS-\d{3}|DPI-\d{4})$/.test(candidate))
      this.oracleCode = candidate;
  }
}
function localPath(value: string | undefined) {
  return typeof value === "string" && value.length <= 4096 && value.trim() === value &&
    /^[A-Za-z]:[\\/]/.test(value) && !/[\u0000-\u001f]/.test(value);
}
function exactUnit(value: unknown): value is string {
  return unitCode(value) && !/[*%?\\/,;]/.test(value);
}
function preflightEnvironment(source: NodeJS.ProcessEnv, options: OracleDemoOptions): NodeJS.ProcessEnv {
  if (options.testReadOnly !== true ||
      (options.allTestUnits === true ? options.orgUnitId !== undefined
        : options.allTestUnits !== undefined || !exactUnit(options.orgUnitId)) ||
      !Number.isInteger(options.port ?? 18083) || (options.port ?? 18083) < 0 || (options.port ?? 18083) > 65535 ||
      source.NODE_ENV !== undefined && !["development", "test"].includes(source.NODE_ENV) ||
      source.SHF_APP_ENV !== undefined && source.SHF_APP_ENV !== "test" ||
      source.NODE_OPTIONS !== undefined && source.NODE_OPTIONS !== "" ||
      Object.keys(source).some(key => key.startsWith("SHF_") &&
        ![...oracleKeys, "SHF_APP_ENV"].some(allowed => allowed === key)))
    throw new DemoHostError("DEMO_CONFIGURATION_REJECTED");
  let oracle: OracleEnvironment;
  try { oracle = oracleEnvironment(source); } catch { throw new DemoHostError("DEMO_ORACLE_INPUTS_REQUIRED"); }
  if (!/^shifter$/i.test(oracle.user) || !localPath(oracle.clientLibDir) || !localPath(source.TNS_ADMIN))
    throw new DemoHostError("DEMO_ORACLE_INPUTS_REJECTED");
  // Only process inputs, never any .env file or unrelated native/fixture authority.
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", SHF_APP_ENV: "test", SHF_ORACLE_PORT: "0" };
  for (const key of oracleKeys) env[key] = source[key];
  return env;
}
function scopedEnvironment(env: NodeJS.ProcessEnv, orgUnitIds: string[]): NodeJS.ProcessEnv {
  env.SHF_ORACLE_CONFIG = JSON.stringify({
    deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: orgUnitIds,
    dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
    businessTimeZone: "Asia/Jerusalem",
    attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
    attendanceStationExitMode: "disabled",
  });
  loadEnvironmentConfig(env); // Original production/authentication/business gates.
  return env;
}
export function demoEnvironment(source: NodeJS.ProcessEnv, options: OracleDemoOptions): NodeJS.ProcessEnv {
  const env = preflightEnvironment(source, options);
  if (options.allTestUnits) throw new DemoHostError("DEMO_SCOPE_PENDING");
  return scopedEnvironment(env, [options.orgUnitId]);
}

// 55-scope-v0.2: one snapshot, 100-row pages + 1001st sentinel; never a partial grant.
async function discoverUnitScope(session: OracleReadSession, signal?: AbortSignal): Promise<string[]> {
  let scopeFailure: DemoHostError | undefined;
  let discoveredCount = 0, validatedCount = 0;
  let stage: ScopeDiagnostic["stage"] = "discovery";
  const invalid: (reason: ScopeDiagnostic["reason"]) => never = reason => {
    scopeFailure = new DemoHostError("DEMO_SCOPE_INVALID", undefined,
      { stage, reason, discoveredCount, validatedCount });
    throw scopeFailure;
  };
  try {
    return await session.read(async query => {
      const ids: string[] = [];
      const seen = new Set<string>();
      const parents = new Map<string, string>();
      for (let lowerBound = 0; lowerBound <= 1000; lowerBound += 100) {
        const bound = lowerBound === 1000 ? 1 : 100, upperBound = lowerBound + bound;
        const rows = await query(`SELECT "orgUnitId","unitType","parentUnit" FROM (
  SELECT t.org_unit_id AS "orgUnitId", t.unit_type_id AS "unitType",
    t.parent_unit AS "parentUnit",
    ROW_NUMBER() OVER (ORDER BY t.org_unit_id,t.parent_unit) AS "scopeRow"
  FROM SHIFTER.shf_org_unit t WHERE t.unit_type_id=:teamType
) WHERE "scopeRow">:lowerBound AND "scopeRow"<=:upperBound
ORDER BY "scopeRow"`, { teamType: "J01", lowerBound, upperBound }, bound);
        if (lowerBound === 1000 && rows.length) {
          scopeFailure = new DemoHostError("DEMO_SCOPE_TOO_LARGE"); throw scopeFailure;
        }
        // Includes this page, not just the prefix before a malformed row; sentinel excluded.
        discoveredCount += rows.length;
        for (const row of rows) {
          if (!record(row) || Object.keys(row).sort().join(",") !== "orgUnitId,parentUnit,unitType")
            invalid("INVALID_ROW_SHAPE");
          if (!exactUnit(row.orgUnitId)) invalid("INVALID_TEAM_CODE");
          if (row.unitType !== "J01") invalid("INVALID_TEAM_TYPE");
          if (!exactUnit(row.parentUnit)) invalid("MISSING_OR_INVALID_PARENT");
          if (row.parentUnit === row.orgUnitId) invalid("SELF_PARENT");
          if (seen.has(row.orgUnitId)) invalid("DUPLICATE_TEAM");
          seen.add(row.orgUnitId); ids.push(row.orgUnitId); parents.set(row.orgUnitId, row.parentUnit);
          validatedCount++;
        }
        if (rows.length < bound) break;
      }
      if (!ids.length) invalid("EMPTY_SCOPE");
      stage = "hierarchy"; validatedCount = 0;
      const hierarchy = await teamsAndParents(query, ids, (reason, count) => {
        validatedCount = count;
        // Do not throw from the observer: retain the reader's original source error.
        scopeFailure = new DemoHostError("DEMO_SCOPE_INVALID", undefined,
          { stage, reason, discoveredCount, validatedCount });
      });
      for (const team of hierarchy.teams) {
        if (parents.get(team.code) !== team.parent.code) invalid("PARENT_CHANGED");
        validatedCount++;
      }
      return ids;
    }, signal);
  } catch (error) {
    if (scopeFailure) throw scopeFailure;
    if (record(error) && error.code === "INVALID_SOURCE_DATA")
      throw new DemoHostError("DEMO_SCOPE_INVALID", undefined, {
        stage: "snapshot", reason: "UNCLASSIFIED_SOURCE_FAILURE", discoveredCount, validatedCount,
      });
    throw error;
  }
}

export type DemoAssets = ReadonlyMap<string, Buffer>;
/** Verify only shipped TEST browser bytes; do not certify a stale whole-source snapshot. */
export async function loadDemoAssets(stage = join(root, ".shifter-developer-delivery/test/stage")): Promise<DemoAssets> {
  try {
    const browser = join(stage, "frontend/browser");
    const noLinks = async (path: string) => {
      const stat = await lstat(path);
      if (stat.isSymbolicLink()) throw Error();
      return stat;
    };
    // Check ancestors as well as leaves (including Windows junctions).
    for (let path = resolve(browser); ; path = dirname(path)) {
      await noLinks(path);
      if (dirname(path) === path) break;
    }
    if ((await noLinks(join(stage, "BUILD.md"))).size > 1024 * 1024) throw Error();
    const manifest = await readFile(join(stage, "BUILD.md"), "utf8");
    if (!manifest.includes("Profile: test; full source validation requested: True")) throw Error();
    const expected = new Map<string, { bytes: number; hash: string }>();
    for (const line of manifest.split(/\r?\n/)) {
      if (!line.startsWith("frontend/browser/")) continue;
      const match = /^frontend\/browser\/([A-Za-z0-9][A-Za-z0-9._/-]*)\t([0-9]+)\t([A-F0-9]{64})$/.exec(line);
      if (!match || match[1].split("/").some(part => !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(part)) ||
          expected.has(match[1])) throw Error();
      expected.set(match[1], { bytes: Number(match[2]), hash: match[3] });
    }
    if (!expected.has("index.html") || expected.size > 512) throw Error();
    const assets = new Map<string, Buffer>();
    let total = 0;
    let entries = 0;
    const walk = async (directory: string, prefix = "") => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (++entries > 1024 || prefix.split("/").length > 8) throw Error();
        const name = prefix + entry.name;
        const path = join(directory, entry.name);
        const stat = await noLinks(path);
        if (stat.isDirectory()) { await walk(path, name + "/"); continue; }
        const proof = expected.get(name);
        if (!stat.isFile() || !proof || stat.size !== proof.bytes || (total += stat.size) > 32 * 1024 * 1024)
          throw Error();
        const bytes = await readFile(path);
        if (createHash("sha256").update(bytes).digest("hex").toUpperCase() !== proof.hash) throw Error();
        assets.set("/" + name, bytes);
      }
    };
    await walk(browser);
    if (assets.size !== expected.size) throw Error();
    // Existing public TEST profile checker, no install/build or secret inheritance.
    await promisify(execFile)(process.execPath, [
      join(root, "frontend/fixture-slice/checks/environment-build-check.mjs"), "test", browser,
    ], { env: { SystemRoot: process.env.SystemRoot }, timeout: 10000, maxBuffer: 4096 });
    return assets;
  } catch { throw new DemoHostError("DEMO_TEST_ASSETS_REQUIRED"); }
}
function addressPort(server: Server) {
  const address = server.address();
  if (!address || typeof address === "string") throw new DemoHostError("DEMO_LISTENER_FAILED");
  return address.port;
}
async function listen(server: Server, port: number) {
  await new Promise<void>((done, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => { server.removeListener("error", fail); done(); });
  });
}
async function closeHost(server: Server) {
  if (!server.listening) return;
  await new Promise<void>((done, fail) => {
    server.close(error => error ? fail(error) : done());
    server.closeAllConnections();
  });
}
function text(response: ServerResponse, code: number, body: string) {
  response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(body);
}
const hopHeaders = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade"]);
function forwardHeaders(headers: IncomingMessage["headers"]) {
  const denied = new Set([...hopHeaders, ...(headers.connection ?? "").toLowerCase().split(",").map(s => s.trim())]);
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !denied.has(key.toLowerCase())));
}
const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8" };

// These factories are an isolated-test seam only; never selected by CLI/ENV/HTTP.
export interface OracleDemoTestDependencies {
  read?: (env: OracleEnvironment) => Promise<OraclePool>;
  assets?: () => Promise<DemoAssets>;
  signal?: AbortSignal;
}
export async function startOracleDemo(source: NodeJS.ProcessEnv, options: OracleDemoOptions,
  isolatedTestDependencies: OracleDemoTestDependencies = {}) {
  let env = preflightEnvironment(source, options); // No placeholder identity before discovery.
  if (!options.allTestUnits) env = scopedEnvironment(env, [options.orgUnitId]);
  const signal = isolatedTestDependencies.signal;
  const checkAbort = () => { if (signal?.aborted) throw new DemoHostError("DEMO_STARTUP_ABORTED"); };
  checkAbort();
  if (!isolatedTestDependencies.read) {
    validateConnectionRuntime(process.platform, process.versions.node);
    try {
      const client = env.SHF_ORACLE_CLIENT_LIB_DIR, tns = env.TNS_ADMIN;
      if (!client || !tns || !(await lstat(client)).isDirectory() ||
          !(await lstat(join(client, "oci.dll"))).isFile() ||
          !(await lstat(tns)).isDirectory()) throw Error();
    } catch { throw new DemoHostError("DEMO_ORACLE_DIRECTORIES_REQUIRED"); }
  }
  const assets = await (isolatedTestDependencies.assets ?? loadDemoAssets)();
  // Fail occupied port before Oracle acquisition; never kill/search for another port.
  const reservation = createServer();
  try { await listen(reservation, options.port ?? 18083); }
  catch { throw new DemoHostError("DEMO_PORT_UNAVAILABLE"); }
  const selectedPort = addressPort(reservation);
  await closeHost(reservation);
  let pool: OraclePool | undefined;
  let transferred = false;
  let backend: Server | undefined;
  let host: Server | undefined;
  let stopping = false;
  let stoppingPromise: Promise<void> | undefined;
  const healthAbort = new AbortController();
  type Health = { ready: boolean; oracleCode?: string };
  let health: Promise<Health> | undefined;
  let lastHealth: Health = { ready: true };
  let healthAt = performance.now(); // startFromEnvironment already runs the constant probe.
  const probe = (): Promise<Health> => {
    if (health) return health;
    if (performance.now() - healthAt < 1000) return Promise.resolve(lastHealth);
    if (!pool || stopping) return Promise.resolve({ ready: false });
    health = new OracleReadSession(pool).read(async query => {
      const rows = await query('SELECT 1 AS "probe" FROM dual', {}, 1);
      if (rows.length !== 1 || !record(rows[0]) || rows[0].probe !== 1) throw Error();
    }, healthAbort.signal).then(() => ({ ready: true }), error => ({
      ready: false, oracleCode: new DemoHostError("DEMO_DATABASE_UNAVAILABLE", error).oracleCode,
    })).then(result => { lastHealth = result; healthAt = performance.now(); health = undefined; return result; });
    return health;
  };
  const stop = () => {
    if (!stoppingPromise) {
      stopping = true; healthAbort.abort();
      if (backend) backendLifecycle(backend)?.beginShutdown();
      stoppingPromise = (async () => {
        try { if (host) await closeHost(host); }
        finally {
          await health; // Wait for native health work/rollback before pool owner closes.
          if (backend) await stopBackendServer(backend);
          else if (pool && !transferred) await pool.close();
        }
      })();
    }
    return stoppingPromise;
  };
  try {
    checkAbort();
    if (!isolatedTestDependencies.read) {
      const { default: driver } = await import("oracledb");
      validateConnectionRuntime(process.platform, process.versions.node, driver.versionString);
    }
    checkAbort();
    pool = await (isolatedTestDependencies.read ?? createOraclePool)(oracleEnvironment(env));
    checkAbort(); // Acquisition may settle only after cancellation; never close a busy lease.
    let authorizedUnitCount = 1;
    if (options.allTestUnits) {
      const ids = await discoverUnitScope(new OracleReadSession(pool), signal);
      checkAbort();
      authorizedUnitCount = ids.length;
      env = scopedEnvironment(env, ids);
    }
    backend = await startFromEnvironment(env, undefined, {
      async read() {
        if (!pool || transferred) throw new DemoHostError("DEMO_POOL_ALREADY_TRANSFERRED");
        transferred = true;
        return pool; // Backend is the sole pool owner, including startup failure.
      },
      async native() { throw new DemoHostError("DEMO_WRITES_FORBIDDEN"); },
    });
    checkAbort();
    const backendPort = addressPort(backend);
    host = createServer({ maxHeaderSize: 32 * 1024 }, (request, response) => {
      void (async () => {
        if (stopping) { text(response, 503, "Demo stopping"); return; }
        if (![`127.0.0.1:${selectedPort}`, `localhost:${selectedPort}`].includes(request.headers.host ?? "")) {
          text(response, 400, "Loopback host required"); return;
        }
        if (request.method !== "GET" && request.method !== "HEAD" ||
            request.headers["transfer-encoding"] !== undefined ||
            request.headers["content-length"] !== undefined && request.headers["content-length"] !== "0") {
          text(response, 405, "Read-only demonstration: empty GET/HEAD only"); request.resume(); return;
        }
        const target = request.url ?? "";
        if (Buffer.byteLength(target) > 8192 || !target.startsWith("/") || target.startsWith("//") ||
            /[\\#\u0000-\u0020]/.test(target)) { text(response, 400, "Invalid path"); return; }
        const rawPath = target.split("?")[0];
        let path: string;
        try { path = decodeURIComponent(rawPath); } catch { text(response, 400, "Invalid path"); return; }
        if (path.includes("\\") || path.split("/").some(p => p === ".." || p === ".") ||
            /[\u0000-\u001f]/.test(path)) { text(response, 400, "Invalid path"); return; }
        if (path === "/demo-status" || path === "/readyz") {
          const result = await probe();
          response.writeHead(result.ready ? 200 : 503, {
            "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          });
          response.end(request.method === "HEAD" ? undefined : JSON.stringify({
            status: result.ready ? "READ_ONLY_CONNECTION_READY" : "DATABASE_UNAVAILABLE",
            probeSummary: result.ready ? "Database credentials accepted; server identity not independently certified"
              : "Database unavailable; no synthetic data fallback",
            ...falseAuthority, syntheticAuthentication: true, dataSource: "oracle-read-only",
            ...(options.allTestUnits ? { scope: "all-test-units", authorizedUnitCount } : {}),
            ...(result.oracleCode ? { oracleCode: result.oracleCode } : {}),
          }));
          return;
        }
        if (path === "/livez") { text(response, 200, "Oracle TEST read-only demo host (liveness only)"); return; }
        if (path === "/api" || path.startsWith("/api/")) {
          if (request.method !== "GET" || rawPath !== path) { text(response, 405, "API requires plain-path empty GET"); return; }
          const upstream = httpRequest({ hostname: "127.0.0.1", port: backendPort,
            method: "GET", path: target, headers: forwardHeaders(request.headers), agent: false }, incoming => {
            response.writeHead(incoming.statusCode ?? 502, forwardHeaders(incoming.headers));
            incoming.on("error", () => response.destroy());
            incoming.pipe(response);
          });
          upstream.setTimeout(6000, () => upstream.destroy());
          upstream.on("error", () => {
            if (!response.headersSent) text(response, 502, "Backend unavailable");
            else response.destroy();
          });
          response.on("close", () => upstream.destroy());
          upstream.end(); // No request body forwarding and no retries.
          return;
        }
        let body = assets.get(path === "/" ? "/index.html" : path);
        // SPA navigation only. Missing assets/API errors must never become HTML.
        if (!body && !extname(path) && /(?:^|,)\s*text\/html(?:[;,]|$)/i.test(request.headers.accept ?? ""))
          body = assets.get("/index.html");
        if (!body) { text(response, 404, "Not found"); return; }
        response.writeHead(200, { "Content-Type": mime[extname(path)] ?? (extname(path) ? "application/octet-stream" : mime[".html"]),
          "Content-Length": body.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
        response.end(request.method === "HEAD" ? undefined : body);
      })().catch(() => {
        if (!response.headersSent) text(response, 503, "Demo unavailable"); else response.destroy();
      });
    });
    host.requestTimeout = 5000; host.headersTimeout = 5000; host.maxHeadersCount = 64;
    host.on("upgrade", (_request, socket) => socket.destroy());
    await listen(host, selectedPort);
    return { url: `http://127.0.0.1:${selectedPort}`, stop };
  } catch (error) {
    // A rejected backend startup has already closed its pool. Never close it twice.
    await stop();
    if (error instanceof DemoHostError) throw error;
    throw new DemoHostError("DEMO_STARTUP_FAILED", error);
  }
}

export function parseDemoArguments(args: string[]): OracleDemoOptions {
  if (args[0] === "--test-read-only" && args[1] === "--all-test-units" &&
      (args.length === 2 || args.length === 4 && args[2] === "--port" && /^[0-9]{1,5}$/.test(args[3])))
    return { testReadOnly: true, allTestUnits: true, port: args.length === 4 ? Number(args[3]) : 18083 };
  if (args.length !== 3 && args.length !== 5 || args[0] !== "--test-read-only" ||
      args[1] !== "--org-unit" || args.length === 5 && (args[3] !== "--port" || !/^[0-9]{1,5}$/.test(args[4])))
    throw new DemoHostError("DEMO_ARGUMENTS_REJECTED");
  return { testReadOnly: true, orgUnitId: args[2], port: args.length === 5 ? Number(args[4]) : 18083 };
}
export function attachDemoShutdown(demo: { stop(): Promise<void> },
  signals: {
    once(event: "SIGINT" | "SIGTERM", listener: () => void): unknown;
    removeListener(event: "SIGINT" | "SIGTERM", listener: () => void): unknown;
  } = process,
  failure = () => { process.stderr.write("Demo cleanup failed\n"); process.exitCode = 1; }) {
  const stop = () => { void demo.stop().catch(failure); };
  signals.once("SIGINT", stop); signals.once("SIGTERM", stop);
  return () => { signals.removeListener("SIGINT", stop); signals.removeListener("SIGTERM", stop); };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let detach: (() => void) | undefined;
  try {
    const controller = new AbortController();
    const startup = startOracleDemo(process.env, parseDemoArguments(process.argv.slice(2)), { signal: controller.signal });
    detach = attachDemoShutdown({ async stop() {
      controller.abort();
      const running = await startup.catch(() => undefined);
      await running?.stop();
    } });
    const demo = await startup;
    process.stdout.write(`Oracle TEST read-only demo: ${demo.url}\nStatus: ${demo.url}/demo-status\n` +
      "Synthetic Administrator; exact operator-attested read scope; all writes disabled.\n" +
      "Connection accepted; server identity NOT independently certified; NOT release-ready. Ctrl+C to stop.\n");
  } catch (error) {
    detach?.();
    const failure = error instanceof DemoHostError ? error : new DemoHostError("DEMO_STARTUP_FAILED", error);
    process.stderr.write(JSON.stringify({ code: failure.message,
      ...(failure.scopeDiagnostic ? { scopeDiagnostic: failure.scopeDiagnostic } : {}),
      ...(failure.oracleCode ? { oracleCode: failure.oracleCode } : {}) }) + "\n");
    if (failure.message === "DEMO_TEST_ASSETS_REQUIRED")
      process.stderr.write("Build TEST assets explicitly: powershell.exe -NoProfile -File scripts\\Build-Shifter.ps1 -Profile test -Validation\n");
    process.exitCode = 1;
  }
}
