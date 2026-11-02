import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, writeFile, rm, symlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import type { BindParameters } from "oracledb";
import type { OraclePool, OracleConnection } from "../oracle-session.mts";
import { startOracleDemo, demoEnvironment, parseDemoArguments, loadDemoAssets, attachDemoShutdown } from "../oracle-demo-host.mts";
import { record } from "../contract-validation.mts";
import { loadEnvironmentConfig, RealAuthenticationNotConfiguredError } from "../environment-profiles.mts";

// ISOLATED TEST DOUBLE ONLY. Never real credentials, orgs, records or Oracle connectivity.
const env = { SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_ORACLE_USER: "shifter",
  SHF_ORACLE_PASSWORD: "synthetic-only-not-a-real-password", SHF_ORACLE_CLIENT_LIB_DIR: "C:\\synthetic\\bin",
  TNS_ADMIN: "C:\\synthetic\\network\\admin" };
const options = { testReadOnly: true, orgUnitId: "DEMO", port: 0 };
const assets = async () => new Map([
  ["/index.html", Buffer.from("<!doctype html><title>Isolated double TEST UI</title>")],
  ["/main.js", Buffer.from("/* isolated TEST asset */")],
]);
function protocolDouble() {
  let closed = 0, leases = 0, rollbacks = 0, releases = 0, probes = 0, breaks = 0;
  const statements: Array<{ sql: string; binds: BindParameters }> = [];
  let fail = false, badProbe = false;
  let waitProbe: (() => Promise<void>) | undefined;
  const pool: OraclePool = {
    async getConnection() {
      leases++;
      const connection: OracleConnection = {
        callTimeout: 0,
        async execute(sql, binds) {
          statements.push({ sql, binds });
          if (fail) throw { code: "ORA-01017", message: "private-host SQL password record" };
          if (sql === "SET TRANSACTION READ ONLY") return [];
          if (sql === 'SELECT 1 AS "probe" FROM dual') {
            probes++; await waitProbe?.(); return badProbe ? [] : [{ probe: 1 }];
          }
          if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
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
    set badProbe(value: boolean) { badProbe = value; }, set waitProbe(value: (() => Promise<void>) | undefined) { waitProbe = value; } };
}
async function launch() {
  const oracle = protocolDouble();
  let factories = 0;
  const demo = await startOracleDemo(env, options, { assets, read: async () => { factories++; return oracle.pool; } });
  return { oracle, demo, get factories() { return factories; } };
}
async function raw(url: string, path: string, headers: Record<string, string> = {}, method = "GET") {
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
test("demo shares one pool, exact R7 identity/read scope and seven existing Oracle adapters; no commands", async () => {
  const started = await launch();
  const { demo, oracle } = started;
  try {
    assert.equal(started.factories, 1); assert.equal(oracle.probes, 1);
    const identity = await (await fetch(demo.url + "/api/v1/identity")).json();
    assert.ok(record(identity));
    const serialized = JSON.stringify(identity);
    assert.match(serialized, /synthetic:administrator/);
    assert.equal(identity.dataSource, "oracle"); // Existing identity DTO marker, unchanged.
    assert.match(serialized, /"DEMO"/);
    assert.doesNotMatch(serialized, /test-oracle-write|:commit|:prepare|DEMO-P/);
    // DTO shape is owned by existing identity; inspect principal without casting.
    const principal = record(identity.principal) ? identity.principal : identity;
    assert.deepEqual(principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read",
      "my-shifts:read", "shift-items:read", "employee:read", "attendance:read"]);
    for (const [path, status] of [
      ["/api/v1/current-shifts/filter-context", 200],
      ["/api/v1/shift-search/filter-context", 200],
      ["/api/v1/attendance/filter-context", 200],
      ["/api/v1/employees/1/shift-days/1", 404],
      ["/api/v1/employees/1/operational-card", 404],
      ["/api/v1/employees/1/shift-days/1/breaks-and-exceptions?limit=10&offset=0&sort=start-asc", 404],
      ["/api/v1/my-shifts/context?mode=selected&employeeId=1", 403],
    ] as const) {
      const result = await fetch(demo.url + path);
      assert.equal(result.status, status, `${path}: ${await result.text()}`);
    }
    assert.equal(started.factories, 1);
    assert.ok(oracle.statements.some(s => s.sql.includes("shf_employees")));
    assert.ok(oracle.statements.every(s => s.sql === "SET TRANSACTION READ ONLY" || /^\s*SELECT\b/i.test(s.sql)));
    assert.equal(oracle.leases, oracle.rollbacks); assert.equal(oracle.leases, oracle.releases);
  } finally { await demo.stop(); }
  assert.equal(oracle.closed, 1);
});
test("demo same-origin assets, SPA, real API errors and single nosniff; raw query/header preserved", async () => {
  const { demo } = await launch();
  try {
    assert.match((await raw(demo.url, "/")).body, /Isolated double TEST UI/);
    assert.equal((await raw(demo.url, "/current-shifts", { Accept: "text/html" })).status, 200);
    assert.equal((await raw(demo.url, "/missing.js", { Accept: "text/html" })).status, 404);
    assert.equal((await raw(demo.url, "/not-a-file")).status, 404);
    const api = await raw(demo.url, "/api/v1/identity", { "Sec-Fetch-Dest": "empty", Authorization: "synthetic-not-real" });
    assert.equal(api.status, 200);
    assert.equal(api.headers["x-content-type-options"], "nosniff");
    const bad = await raw(demo.url, "/api/v1/current-shifts/filter-context?unsupported=1", { Accept: "text/html" });
    assert.equal(bad.status, 400); assert.match(bad.headers["content-type"] ?? "", /json/);
    assert.doesNotMatch(bad.body, /<!doctype|Isolated double/);
    assert.equal((await raw(demo.url, "/api/unknown", { Accept: "text/html" })).status, 400);
    assert.equal((await raw(demo.url, "/livez")).status, 200);
    assert.equal((await raw(demo.url, "/main.js", {}, "HEAD")).body, "");
  } finally { await demo.stop(); }
});
for (const path of ["/../backend/server.mts", "/%2e%2e/server.mts", "/a/%2E%2E/b", "/%5csecret",
  "/%00", "/%zz", "//outside/api/v1/identity"]) {
  test(`demo rejects traversal/malformed target ${path}`, async () => {
    const { demo } = await launch();
    try { assert.equal((await raw(demo.url, path)).status, 400); } finally { await demo.stop(); }
  });
}
test("demo rejects POST/body/foreign Host and never executes/retries a command", async () => {
  const { demo, oracle } = await launch();
  try {
    const before = oracle.statements.length;
    assert.equal((await raw(demo.url, "/api/v1/attendance/stage-arrival/commit", {}, "POST")).status, 405);
    assert.equal((await raw(demo.url, "/api/v1/identity", { "Content-Length": "1" })).status, 405);
    assert.equal((await raw(demo.url, "/", { Host: "attacker.invalid" })).status, 400);
    assert.equal(oracle.statements.length, before);
  } finally { await demo.stop(); }
});
test("demo health is honest, rate limited and single-flight on the same read-only pool; no DB error fallback", async () => {
  const { demo, oracle } = await launch();
  try {
    const first = await raw(demo.url, "/demo-status");
    assert.equal(first.status, 200);
    const status: unknown = JSON.parse(first.body);
    assert.ok(record(status));
    for (const field of ["targetIdentityVerified", "nativeWritesAuthorized", "releaseReady"]) assert.equal(status[field], false);
    assert.match(first.body, /not independently certified/);
    assert.equal(oracle.probes, 1);
    await sleep(1100);
    let release!: () => void;
    const gate = new Promise<void>(done => { release = done; });
    let reached!: () => void;
    const active = new Promise<void>(done => { reached = done; });
    oracle.waitProbe = async () => { reached(); await gate; };
    const requests = Array.from({ length: 12 }, () => raw(demo.url, "/readyz"));
    await active; release();
    assert.ok((await Promise.all(requests)).every(result => result.status === 200));
    assert.equal(oracle.probes, 2);
    oracle.waitProbe = undefined;
    oracle.fail = true;
    await sleep(1100);
    const failed = await raw(demo.url, "/demo-status");
    assert.equal(failed.status, 503); assert.match(failed.body, /ORA-01017/);
    assert.doesNotMatch(failed.body, /private-host|SQL|password|record/);
    const data = await raw(demo.url, "/api/v1/attendance/filter-context");
    assert.equal(data.status, 503);
    assert.doesNotMatch(data.body, /private-host|password|Synthetic team/);
    assert.equal((await raw(demo.url, "/livez")).status, 200);
  } finally { await demo.stop(); }
  assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.releases);
});
test("demo shutdown stops admission, awaits native health and closes pool exactly once for both signals", async () => {
  const { demo, oracle } = await launch();
  await sleep(1100);
  let release!: () => void, reached!: () => void;
  const active = new Promise<void>(done => { reached = done; });
  const gate = new Promise<void>(done => { release = done; });
  oracle.waitProbe = async () => { reached(); await gate; };
  const pendingRequest = raw(demo.url, "/readyz").catch(() => undefined);
  await active;
  const signals = new EventEmitter();
  const detach = attachDemoShutdown(demo, signals, () => assert.fail("Unexpected signal cleanup failure"));
  signals.emit("SIGINT"); signals.emit("SIGTERM");
  const stopped = demo.stop();
  assert.equal(oracle.closed, 0); assert.equal(oracle.breaks, 1);
  release(); await stopped; await pendingRequest; await demo.stop(); detach();
  assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.releases);
  await assert.rejects(fetch(demo.url + "/livez"));
});
test("demo startup probe failure is redacted and pool is closed once, no listener/fallback", async () => {
  const oracle = protocolDouble(); oracle.fail = true;
  await assert.rejects(startOracleDemo(env, options, { assets, read: async () => oracle.pool }),
    error => error instanceof Error && error.message === "DEMO_STARTUP_FAILED" &&
      record(error) && error.oracleCode === "ORA-01017" && !JSON.stringify(error).includes("private-host"));
  assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.releases);
});
test("demo startup empty constant probe fails closed and closes pool once", async () => {
  const oracle = protocolDouble(); oracle.badProbe = true;
  await assert.rejects(startOracleDemo(env, options, { assets, read: async () => oracle.pool }), /DEMO_STARTUP_FAILED/);
  assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.releases);
});
test("demo rejects missing native-client directory before assets or Oracle driver loading", async () => {
  let assetCalls = 0;
  await assert.rejects(startOracleDemo({
    ...env, SHF_ORACLE_CLIENT_LIB_DIR: "C:\\shf-synthetic-missing-" + "0".repeat(32),
  }, options, { assets: async () => { assetCalls++; return assets(); } }), /DEMO_ORACLE_DIRECTORIES_REQUIRED/);
  assert.equal(assetCalls, 0);
});
test("demo occupied port fails without a pool, without killing/replacing the occupant", async () => {
  const occupant = createServer((_request, response) => response.end("unchanged"));
  await new Promise<void>(done => occupant.listen(0, "127.0.0.1", done));
  const address = occupant.address(); assert.ok(address && typeof address !== "string");
  let factories = 0;
  try {
    await assert.rejects(startOracleDemo(env, { ...options, port: address.port },
      { assets, read: async () => { factories++; return protocolDouble().pool; } }), /DEMO_PORT_UNAVAILABLE/);
    assert.equal(factories, 0);
    assert.equal(await (await fetch(`http://127.0.0.1:${address.port}`)).text(), "unchanged");
  } finally { await new Promise<void>(done => { occupant.close(() => done()); occupant.closeAllConnections(); }); }
});
for (const change of [
  { NODE_ENV: "production" }, { NODE_ENV: "invalid" }, { SHF_APP_ENV: "production" }, { SHF_APP_ENV: "dev" },
  { SHF_ORACLE_CONNECT_STRING: "UNKNOWN" }, { SHF_ORACLE_USER: "other" }, { SHF_ORACLE_PASSWORD: "" },
  { SHF_ORACLE_CLIENT_LIB_DIR: "" }, { TNS_ADMIN: "\\\\remote\\tns" }, { SHF_NATIVE_EXIT_CONFIG: "{}" },
  { SHF_ORACLE_CONFIG: "{}" }, { SHF_FIXTURE_ROWS: "[]" }, { SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "false" },
  { NODE_OPTIONS: "--import=unapproved" },
]) {
  test(`demo rejects unsafe/missing source ${Object.keys(change)[0]} before factories/listeners`, async () => {
    let calls = 0;
    await assert.rejects(startOracleDemo({ ...env, ...change }, options, {
      assets: async () => { calls++; return assets(); }, read: async () => { calls++; return protocolDouble().pool; },
    }));
    assert.equal(calls, 0);
  });
}
for (const unit of ["", "*", "%", "null", "-1", "DEMO,OTHER", "DEMO/ANY", "too-long-unit", " space", "A?"]) {
  test(`demo rejects unspecified/wildcard/list scope ${JSON.stringify(unit)} before any IO`, () => {
    assert.throws(() => demoEnvironment(env, { ...options, orgUnitId: unit }));
  });
}
test("demo explicit opt-in/CLI rejects password/manual config; existing production real-auth guard unchanged", () => {
  assert.throws(() => demoEnvironment(env, { ...options, testReadOnly: false }));
  for (const args of [[], ["--password", "do-not-use"], ["--test-read-only", "--org-unit", "DEMO", "--password", "x"]])
    assert.throws(() => parseDemoArguments(args));
  assert.deepEqual(parseDemoArguments(["--test-read-only", "--org-unit", "DEMO"]),
    { testReadOnly: true, orgUnitId: "DEMO", port: 18083 });
  const config = loadEnvironmentConfig(demoEnvironment(env, options));
  assert.equal(config.dataSource, "oracle-read-only");
  assert.throws(() => loadEnvironmentConfig({
    NODE_ENV: "production", SHF_APP_ENV: "production",
    SHF_ORACLE_CONFIG: JSON.stringify({ deploymentClass: "production", authenticationMode: "real",
      syntheticAdministratorEnabled: false, realProviderId: "configured-later", dataSource: "oracle-read-only",
      businessTimeZone: "UTC" }),
  }), RealAuthenticationNotConfiguredError);
});
test("demo preserves business validation, scoped catalogs never grant parent or unknown requested team", async () => {
  const { demo, oracle } = await launch();
  try {
    const result = await raw(demo.url, "/api/v1/current-shifts?mode=at&atLocal=bad&teamCode=OTHER");
    assert.equal(result.status, 400);
    assert.doesNotMatch(result.body, /Synthetic team/);
    const context = await raw(demo.url, "/api/v1/current-shifts/filter-context");
    assert.equal(context.status, 200);
    assert.ok(oracle.statements.filter(s => s.sql.includes('"grantCode"')).every(s =>
      record(s.binds) && s.binds.team0 === "DEMO" && s.binds.team1 === undefined));
  } finally { await demo.stop(); }
});
test("demo actual compiled TEST browser plus source API host run with an explicitly isolated protocol double", async () => {
  const oracle = protocolDouble();
  const demo = await startOracleDemo(env, options, { read: async () => oracle.pool });
  try {
    const page = await raw(demo.url, "/");
    assert.equal(page.status, 200); assert.match(page.body, /<html\b/i);
    const identity = await raw(demo.url, "/api/v1/identity", { "Sec-Fetch-Dest": "empty" });
    assert.equal(identity.status, 200); assert.match(identity.body, /"dataSource":"oracle"/);
    assert.match(identity.body, /synthetic:administrator/);
    assert.equal((await raw(demo.url, "/readyz")).status, 200);
  } finally { await demo.stop(); }
  assert.equal(oracle.closed, 1);
});
async function stagedBrowser() {
  const stage = await mkdtemp(join(tmpdir(), "shf-oracle-demo-assets-"));
  await mkdir(join(stage, "frontend/browser"), { recursive: true });
  const files = new Map([
    ["index.html", Buffer.from("<!doctype html>synthetic TEST")],
    ["main.js", Buffer.from('Object.freeze({appEnv:"test",apiBasePath:"/api"})')],
  ]);
  const manifest = ["Profile: test; full source validation requested: True"];
  for (const [name, bytes] of files) {
    await writeFile(join(stage, "frontend/browser", name), bytes);
    manifest.push(`frontend/browser/${name}\t${bytes.length}\t${createHash("sha256").update(bytes).digest("hex").toUpperCase()}`);
  }
  await writeFile(join(stage, "BUILD.md"), manifest.join("\n"));
  return stage;
}
test("demo asset loader verifies exact shipped byte manifest and existing TEST public profile checker", async () => {
  const stage = await stagedBrowser();
  try { assert.equal((await loadDemoAssets(stage)).size, 2); }
  finally { await rm(stage, { recursive: true, force: true }); }
});
for (const mutation of ["changed", "extra", "missing", "profile", "public-profile", "traversal", "link"] as const) {
  test(`demo asset loader rejects ${mutation}, never builds/downloads/substitutes`, async () => {
    const stage = await stagedBrowser();
    try {
      const browser = join(stage, "frontend/browser");
      if (mutation === "changed") await writeFile(join(browser, "main.js"), "tampered");
      if (mutation === "extra") await writeFile(join(browser, "extra.js"), "unlisted");
      if (mutation === "missing") await rm(join(browser, "index.html"));
      if (mutation === "profile") {
        const content = await readFile(join(stage, "BUILD.md"), "utf8");
        await writeFile(join(stage, "BUILD.md"), content.replace("Profile: test", "Profile: production"));
      }
      if (mutation === "public-profile") {
        const bytes = Buffer.from('Object.freeze({appEnv:"production",apiBasePath:"/api"})');
        await writeFile(join(browser, "main.js"), bytes);
        const content = await readFile(join(stage, "BUILD.md"), "utf8");
        await writeFile(join(stage, "BUILD.md"), content.replace(/^frontend\/browser\/main\.js\t.*$/m,
          `frontend/browser/main.js\t${bytes.length}\t${createHash("sha256").update(bytes).digest("hex").toUpperCase()}`));
      }
      if (mutation === "traversal") await writeFile(join(stage, "BUILD.md"),
        "Profile: test; full source validation requested: True\nfrontend/browser/../secret\t1\t" + "A".repeat(64));
      if (mutation === "link") {
        await rm(join(stage, "frontend"), { recursive: true });
        await mkdir(join(stage, "real/browser"), { recursive: true });
        await symlink(join(stage, "real"), join(stage, "frontend"), "junction");
      }
      await assert.rejects(loadDemoAssets(stage), /DEMO_TEST_ASSETS_REQUIRED/);
    } finally { await rm(stage, { recursive: true, force: true }); }
  });
}
