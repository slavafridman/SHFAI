import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { ExitOracleDouble, exitConfig, exitSelection } from "./native-station-exit-double.mts";
import { SyntheticAdministratorProvider, createRuntime } from "../synthetic-identity.mts";
import { validatePrincipal, record } from "../contract-validation.mts";
import { stationExitMode, exitBinding } from "../native-station-exit-config.mts";
import { exitCommand } from "../station-exit-validation.mts";
import { stationExitAccessPolicy } from "../access-policy.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { once } from "node:events";
import { nativeConfig } from "./native-stage-arrival-double.mts";
import { stationConfig } from "./native-station-arrival-double.mts";
import { sampleStageArrivalConfig } from "../stage-arrival-sample.mts";
import { exitProblem } from "../station-exit-errors.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { setTimeout as sleep } from "node:timers/promises";

const route = `/api/v1/employees/${exitSelection.employeeId}/shift-days/${exitSelection.shiftDayId}/station-exit`;
const origin = "http://localhost:4521";
function env(d: ExitOracleDouble): NodeJS.ProcessEnv {
  return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(exitConfig), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
    SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused",
    SHF_TEST_ORACLE_EXIT_WRITE_ENABLED: "true", SHF_STATION_EXIT_ORIGINS: JSON.stringify([origin]),
    SHF_NATIVE_EXIT_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_NATIVE_EXIT_USER: d.binding.writeIdentity.user,
    SHF_NATIVE_EXIT_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_EXIT_CLIENT_LIB_DIR: "synthetic-unused",
    SHF_NATIVE_EXIT_BINDING: JSON.stringify(d.binding) };
}
function headerList(v: Record<string, string> | readonly string[]): v is readonly string[] { return Array.isArray(v); }
async function raw(port: number, path: string, method = "GET", data?: string, headers: Record<string, string> | readonly string[] = {}) {
  return new Promise<{ status: number; body: Record<string, unknown> }>((resolve, reject) => {
    const h = headerList(headers) ? ["Host", "127.0.0.1", "Content-Type", "application/json",
      "Content-Length", String(Buffer.byteLength(data ?? "")), ...headers] :
      { ...(data === undefined ? {} : { "content-type": "application/json", "content-length": String(Buffer.byteLength(data)) }), ...headers };
    const r = request({ host: "127.0.0.1", port, path, method, headers: h }, response => {
      const chunks: Buffer[] = [];
      response.on("data", c => chunks.push(Buffer.from(c)));
      response.on("end", () => {
        try {
          const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (!record(body)) { reject(Error("Unexpected synthetic response")); return; }
          resolve({ status: response.statusCode!, body });
        } catch (e) { reject(e); }
      });
    });
    r.once("error", reject); r.end(data);
  });
}
test("native-exit10 exact capabilities/null employee, cannot substitute arrival/fixture rights", async () => {
  const p = await new SyntheticAdministratorProvider(exitConfig).authenticate({ authorization: null });
  validatePrincipal(p, "native-exit");
  assert.deepEqual(p.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read",
    "shift-items:read", "employee:read", "attendance:read", "attendance-station-exit:prepare",
    "attendance-station-exit:commit", "attendance-station-exit:test-oracle-write"]);
  stationExitAccessPolicy.requirePrepare(p); stationExitAccessPolicy.requireCommit(p);
  for (const cap of p.capabilities.slice(7)) {
    const missing = { ...p, capabilities: p.capabilities.filter(c => c !== cap) };
    assert.throws(() => stationExitAccessPolicy.requireCommit(missing), /FORBIDDEN/);
    assert.throws(() => validatePrincipal(missing, "native-exit"));
  }
  for (const config of [nativeConfig, stationConfig, sampleStageArrivalConfig]) {
    const foreign = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
    assert.throws(() => stationExitAccessPolicy.requirePrepare(foreign), /FORBIDDEN/);
  }
  for (const mode of ["disabled", "isolated-fixture", "test-oracle-controlled", "native-station", "joint-fixture"] as const)
    assert.throws(() => validatePrincipal(p, mode));
  assert.equal(p.employeeId, null);
});
test("exit grammar has exact empty draft/consent and no warning confirmation", () => {
  const c = { commandId: randomUUID(), draft: {}, validationToken: "a".repeat(43), fingerprint: "a".repeat(64),
    operationConfirmation: { accepted: true } };
  assert.ok(exitCommand(c));
  for (const bad of [{ ...c, draft: null }, { ...c, draft: [] }, { ...c, draft: { lateReasonCode: null } },
    { ...c, draft: { stationExitLocal: "2026-10-28T16:00:00" } }, { ...c, confirmation: null },
    { ...c, operationConfirmation: undefined }, { ...c, operationConfirmation: { accepted: false } },
    { ...c, operationConfirmation: { accepted: true, extra: true } }, { ...c, source: "oracle-test" }])
    assert.throws(() => exitCommand(bad), /INVALID_REQUEST/);
  assert.equal(exitProblem(new StageArrivalError("CONFIRMATION_REQUIRED"), "synthetic").code, "INTERNAL_ERROR");
});
for (const [label, mutate] of [
  ["flag missing", (e: NodeJS.ProcessEnv) => { delete e.SHF_TEST_ORACLE_EXIT_WRITE_ENABLED; }],
  ["flag typo", (e: NodeJS.ProcessEnv) => { e.SHF_TEST_ORACLE_EXIT_WRITE_ENABLED = "TRUE"; }],
  ["Origin missing", (e: NodeJS.ProcessEnv) => { delete e.SHF_STATION_EXIT_ORIGINS; }],
  ["Origin empty", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_EXIT_ORIGINS = "[]"; }],
  ["Origin remote", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_EXIT_ORIGINS = '["http://example.test"]'; }],
  ["NODE_ENV prod", (e: NodeJS.ProcessEnv) => { e.NODE_ENV = "production"; }],
  ["prod profile", (e: NodeJS.ProcessEnv) => { e.SHF_APP_ENV = "production"; }],
  ["dev profile", (e: NodeJS.ProcessEnv) => { e.SHF_APP_ENV = "dev"; }],
  ["invalid profile", (e: NodeJS.ProcessEnv) => { e.SHF_APP_ENV = "TEST"; }],
  ["F1 flag", (e: NodeJS.ProcessEnv) => { e.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = "true"; }],
  ["F2 flag", (e: NodeJS.ProcessEnv) => { e.SHF_TEST_ORACLE_STATION_WRITE_ENABLED = "true"; }],
  ["F2 private", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_STATION_BINDING = "{}"; }],
  ["fixture", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_EXIT_FIXTURE = "{}"; }],
  ["unknown private", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_EXIT_BYPASS = "true"; }],
  ["account mismatch", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_EXIT_USER = "WRONG"; }],
  ["binding missing", (e: NodeJS.ProcessEnv) => { delete e.SHF_NATIVE_EXIT_BINDING; }],
] as const) test(`exit startup ${label} fails BEFORE pools/listen`, async () => {
  const d = new ExitOracleDouble(true);
  try {
    const e = env(d); mutate(e); let calls = 0;
    await assert.rejects(startFromEnvironment(e, d.clock, { read: async () => { calls++; return d.readPool; },
      native: async () => { calls++; return d.writePool; } }));
    assert.equal(calls, 0); assert.equal(d.events.length, 0); assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("exit default-off, invalid/mixed/local/real/mock configurations fail closed", () => {
  assert.equal(stationExitMode({}), "disabled");
  for (const patch of [{ attendanceStationExitMode: "isolated-fixture" }, { deploymentClass: "local-development" },
    { authenticationMode: "real" }, { syntheticAdministratorEnabled: false }, { oracleTestScopeConfirmed: false },
    { attendanceStageArrivalMode: "test-oracle-controlled" }, { attendanceStationArrivalMode: "test-oracle-controlled" },
    { attendanceStageArrivalMode: undefined }, { attendanceStationArrivalMode: undefined }, { dataSource: "isolated-fixture" }])
    assert.throws(() => stationExitMode({ ...exitConfig, ...patch }));
  const d = new ExitOracleDouble();
  try {
    for (const patch of [{ operation: "native-station-arrival-v0.1" }, { exitMetadataDigest: undefined, stationMetadataDigest: "a".repeat(64) },
      { allowanceFile: d.binding.allowanceFile.replace("station-exit-", "station-arrival-") }, { metadataProvider: "all-v1" }])
      assert.throws(() => exitBinding({ ...d.binding, ...patch }));
  } finally { d.dispose(); }
});
test("exit actual entrypoint with isolated pools: identity oracle, prepare PURE0, consent then ACK/readback", async () => {
  const d = new ExitOracleDouble(true); let server;
  try {
    server = await startFromEnvironment(env(d), { now: () => new Date("2000-01-01T00:00:00Z") },
      { read: async () => d.readPool, native: async () => d.writePool });
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const p = address.port;
    const identity = await raw(p, "/api/v1/identity");
    assert.equal(identity.body.dataSource, "oracle"); assert.ok(record(identity.body.principal));
    assert.equal(identity.body.principal.employeeId, null);
    const c = await raw(p, route + "/context");
    assert.equal(c.status, 200); assert.equal(c.body.classification, "ordinary");
    const v = await raw(p, route + "/validations", "POST", "{}",
      { Origin: origin, "sec-ch-ua": '"Chromium";v="141"', "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"Windows"' });
    assert.equal(v.status, 200); assert.equal(v.body.dataSource, "oracle-test");
    assert.equal(d.sql.some(q => /FOR UPDATE/.test(q.sql)), false);
    const cmd = exitCommand({ commandId: randomUUID(), draft: {}, validationToken: v.body.validationToken,
      fingerprint: v.body.fingerprint, operationConfirmation: { accepted: true } });
    const before = d.sql.length;
    for (const o of ["", "http://localhost:4522"]) {
      const r = await raw(p, route + "/commands", "POST", JSON.stringify(cmd), { Origin: o });
      assert.equal(r.status, 403); assert.equal(r.body.effect, "none");
    }
    for (const [suffix, method, data, headers, status] of [
      ["/validations?x=1", "POST", "{}", {}, 400],
      ["/validations", "POST", '{"x":1,"x":1}', {}, 400],
      ["/validations", "POST", '{"draft":{}}', {}, 400],
      ["/context", "GET", "{}", {}, 400],
      ["/commands", "GET", undefined, {}, 405],
      ["/validations", "POST", "{}", { "content-type": "text/plain" }, 415],
      ["/validations", "POST", "{}", ["X-Test", "a", "X-Test", "b"], 400],
      ["/validations", "POST", "{}", ["Origin", origin, "Origin", origin], 400],
      ["/validations", "POST", "{}", { "content-encoding": "gzip" }, 415],
      ["/validations", "POST", " ".repeat(8193), {}, 413],
      ["/commands", "POST", '{"operationConfirmation":{"accepted":true,"accepted":true}}', {}, 400],
      ["/commands", "POST", JSON.stringify({ ...cmd, operationConfirmation: { accepted: false } }), {}, 400],
    ] as const) {
      const r = await raw(p, route + suffix, method, data, headers);
      assert.equal(r.status, status); assert.equal(r.body.effect, "none");
    }
    assert.equal(d.sql.length, before); assert.equal(existsSync(d.binding.allowanceFile), false);
    const result = await raw(p, route + "/commands", "POST", JSON.stringify(cmd), { Origin: origin });
    assert.equal(result.status, 200); assert.equal(result.body.outcome, "oracle-test-committed");
    assert.equal(result.body.partnerCompletion, "not-invoked");
    assert.equal((await raw(p, route + "/context")).body.eligibility, "already-recorded");
    assert.equal((await raw(p, route + "/commands", "POST", JSON.stringify(cmd))).body.code, "ALREADY_REGISTERED");
    assert.equal((await raw(p, route.replace("station-exit", "station-arrival") + "/context")).body.code, "LIVE_WRITES_DISABLED");
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
test("exit disabled known routes stop before any read/auth fallback", async () => {
  let reads = 0;
  const runtime = await createRuntime({ ...sampleStageArrivalConfig, attendanceStageArrivalMode: "disabled" },
    new FixtureReader([]));
  const server = createLoopbackServer({ ...runtime, authenticate: async () => { reads++; throw Error("no fallback"); } });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  try {
    const a = server.address(); assert.ok(a && typeof a !== "string");
    assert.equal((await raw(a.port, route + "/context")).body.code, "LIVE_WRITES_DISABLED");
    assert.equal(reads, 0);
  } finally { await stopBackendServer(server); }
});
test("exit shutdown drains an uncooperative COMMIT before pool close; no false receipt", async () => {
  const d = new ExitOracleDouble(true); let server;
  let release!: () => void, entered!: () => void;
  const hold = new Promise<void>(r => { release = r; }), at = new Promise<void>(r => { entered = r; });
  try {
    server = await startFromEnvironment(env(d), undefined, { read: async () => d.readPool, native: async () => d.writePool });
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const v = await raw(a.port, route + "/validations", "POST", "{}");
    const cmd = exitCommand({ commandId: randomUUID(), draft: {}, validationToken: v.body.validationToken,
      fingerprint: v.body.fingerprint, operationConfirmation: { accepted: true } });
    d.hook = async e => { if (e === "write:commit") { entered(); await hold; } };
    const pending = raw(a.port, route + "/commands", "POST", JSON.stringify(cmd)).catch(() => undefined);
    await at;
    let stopped = false;
    const stop = stopBackendServer(server).then(() => { stopped = true; });
    await sleep(20);
    assert.equal(stopped, false); assert.ok(!d.events.includes("write:pool-close"));
    release(); await pending; await stop;
    assert.ok(d.events.indexOf("write:commit-ack") < d.events.indexOf("write:pool-close"));
    assert.ok(d.events.includes("write:break")); assert.ok(d.events.includes("write:close:true"));
  } finally { release(); if (server) await stopBackendServer(server); d.dispose(); }
});
