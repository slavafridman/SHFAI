import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { StationOracleDouble, stationConfig, stationSelection, stationDraft } from "./native-station-arrival-double.mts";
import { SyntheticAdministratorProvider, createRuntime } from "../synthetic-identity.mts";
import { validatePrincipal, record } from "../contract-validation.mts";
import { stationMode } from "../station-arrival-validation.mts";
import { nativeStationCommand } from "../native-station-arrival-validation.mts";
import { nativeStationArrivalAccessPolicy } from "../access-policy.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { sampleCurrentFixture } from "../current-shifts-sample.mts";
import { nativeConfig } from "./native-stage-arrival-double.mts";
import { stationBinding } from "../native-station-arrival-config.mts";

const base = `/api/v1/employees/${stationSelection.employeeId}/shift-days/${stationSelection.shiftDayId}/station-arrival`;
const origin = "http://localhost:4521";
function env(d: StationOracleDouble): NodeJS.ProcessEnv {
  return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(stationConfig), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
    SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused",
    SHF_TEST_ORACLE_STATION_WRITE_ENABLED: "true", SHF_STATION_ARRIVAL_ORIGINS: JSON.stringify([origin]),
    SHF_NATIVE_STATION_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_NATIVE_STATION_USER: d.binding.writeIdentity.user,
    SHF_NATIVE_STATION_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_STATION_CLIENT_LIB_DIR: "synthetic-unused",
    SHF_NATIVE_STATION_BINDING: JSON.stringify(d.binding) };
}
async function raw(port: number, path: string, method = "GET", data?: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: Record<string, unknown>; headers: import("node:http").IncomingHttpHeaders }>((resolve, reject) => {
    const r = request({ host: "127.0.0.1", port, path, method, headers: {
      ...(data === undefined ? {} : { "content-type": "application/json", "content-length": String(Buffer.byteLength(data)) }), ...headers,
    } }, response => {
      const chunks: Buffer[] = [];
      response.on("data", c => chunks.push(Buffer.from(c)));
      response.on("end", () => {
        const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!record(body)) { reject(Error("Unexpected synthetic response")); return; }
        resolve({ status: response.statusCode!, body, headers: response.headers });
      });
    });
    r.once("error", reject); r.end(data);
  });
}
test("native-station10 is EXACT ordered R7+F2 pair+native right; F1 and fixture rights cannot substitute", async () => {
  const p = await new SyntheticAdministratorProvider(stationConfig).authenticate({ authorization: null });
  validatePrincipal(p, "native-station");
  assert.deepEqual(p.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read",
    "shift-items:read", "employee:read", "attendance:read", "attendance-station-arrival:prepare",
    "attendance-station-arrival:commit", "attendance-station-arrival:test-oracle-write"]);
  nativeStationArrivalAccessPolicy.requirePrepare(p); nativeStationArrivalAccessPolicy.requireCommit(p);
  for (const cap of p.capabilities.slice(7)) {
    const missing = { ...p, capabilities: p.capabilities.filter(c => c !== cap) };
    assert.throws(() => nativeStationArrivalAccessPolicy.requireCommit(missing), /FORBIDDEN/);
    assert.throws(() => validatePrincipal(missing, "native-station"));
  }
  for (const mode of ["disabled", "isolated-fixture", "test-oracle-controlled", "joint-fixture"] as const)
    assert.throws(() => validatePrincipal(p, mode));
  const f1 = await new SyntheticAdministratorProvider(nativeConfig).authenticate({ authorization: null });
  assert.throws(() => nativeStationArrivalAccessPolicy.requirePrepare(f1), /FORBIDDEN/);
  assert.equal(p.employeeId, null);
});
test("native station strict grammar requires explicit whole-operation consent and null-only draft", () => {
  const c = { commandId: randomUUID(), draft: stationDraft, validationToken: "a".repeat(43), fingerprint: "a".repeat(64),
    confirmation: null, operationConfirmation: { accepted: true } };
  assert.ok(nativeStationCommand(c));
  for (const invalid of [{ ...c, operationConfirmation: undefined }, { ...c, operationConfirmation: { accepted: false } },
    { ...c, draft: { lateReasonCode: "1" } }, { ...c, draft: { lateReasonCode: null, lateRemark: null } },
    { ...c, confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] } }, { ...c, extra: true }])
    assert.throws(() => nativeStationCommand(invalid), /INVALID_REQUEST/);
});
for (const [label, mutate] of [
  ["default off flag", (e: NodeJS.ProcessEnv) => { delete e.SHF_TEST_ORACLE_STATION_WRITE_ENABLED; }],
  ["malformed flag", (e: NodeJS.ProcessEnv) => { e.SHF_TEST_ORACLE_STATION_WRITE_ENABLED = "TRUE"; }],
  ["missing Origin list", (e: NodeJS.ProcessEnv) => { delete e.SHF_STATION_ARRIVAL_ORIGINS; }],
  ["empty Origin list", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_ARRIVAL_ORIGINS = "[]"; }],
  ["invalid Origin list", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_ARRIVAL_ORIGINS = '["http://example.test"]'; }],
  ["NODE_ENV production", (e: NodeJS.ProcessEnv) => { e.NODE_ENV = "production"; }],
  ["production profile", (e: NodeJS.ProcessEnv) => { e.SHF_APP_ENV = "production"; }],
  ["invalid environment", (e: NodeJS.ProcessEnv) => { e.SHF_APP_ENV = "TEST"; }],
  ["mixed F1 flag", (e: NodeJS.ProcessEnv) => { e.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = "true"; }],
  ["mixed F1 private binding", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_STAGE_BINDING = "{}"; }],
  ["fixture input", (e: NodeJS.ProcessEnv) => { e.SHF_STATION_ARRIVAL_FIXTURE = "{}"; }],
  ["F1 input", (e: NodeJS.ProcessEnv) => { e.SHF_STAGE_ARRIVAL_FIXTURE = "{}"; }],
  ["unknown private input", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_STATION_SKIP = "true"; }],
  ["bad account", (e: NodeJS.ProcessEnv) => { e.SHF_NATIVE_STATION_USER = "WRONG"; }],
] as const) test(`native F2 startup ${label} denies BEFORE either pool/listener`, async () => {
  const d = new StationOracleDouble(true);
  try {
    const e = env(d); mutate(e);
    await assert.rejects(startFromEnvironment(e, d.clock, { read: async () => { throw Error("pool created"); },
      native: async () => { throw Error("pool created"); } }), e => e instanceof Error && e.message !== "pool created");
    assert.equal(d.events.length, 0); assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("native F2 mode rejects dev, fixture/native mixing, real provider, and combined native writers", () => {
  assert.equal(stationMode(stationConfig), "test-oracle-controlled");
  for (const patch of [{ deploymentClass: "local-development" }, { authenticationMode: "real" },
    { attendanceStageArrivalMode: "test-oracle-controlled" }, { attendanceStageArrivalMode: "isolated-fixture" },
    { attendanceStageArrivalMode: undefined }, { dataSource: "isolated-fixture" }, { syntheticAdministratorEnabled: false },
    { oracleTestScopeConfirmed: false }]) assert.throws(() => stationMode({ ...stationConfig, ...patch }));
});
test("F2 separate operation/digest/allowance required; no F1 digest or token grammar fallback", () => {
  const d = new StationOracleDouble();
  try {
    assert.ok(stationBinding(d.binding));
    for (const patch of [{ operation: "native-stage-arrival-v0.1" }, { operation: undefined },
      { stationMetadataDigest: undefined, metadataDigest: "a".repeat(64) },
      { allowanceFile: d.binding.allowanceFile.replace("station-arrival-", "stage-arrival-") }])
      assert.throws(() => stationBinding({ ...d.binding, ...patch }));
  } finally { d.dispose(); }
});
test("native F2 owned-loopback startup/HTTP has Oracle disclosure, strict Origin incl EMPTY, no mutation in prepare, disabled F1", async () => {
  const d = new StationOracleDouble(true);
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    server = await startFromEnvironment(env(d), d.clock, { read: async () => d.readPool, native: async () => d.writePool });
    const addr = server.address(); assert.ok(addr && typeof addr !== "string");
    const port = addr.port;
    const identity = await raw(port, "/api/v1/identity");
    assert.equal(identity.status, 200); assert.equal(identity.body.dataSource, "oracle");
    assert.ok(record(identity.body.principal));
    validatePrincipal(identity.body.principal, "native-station");
    for (const badOrigin of ["", "http://localhost:4522", "null"]) {
      const response = await raw(port, base + "/validations", "POST", JSON.stringify(stationDraft), { origin: badOrigin });
      assert.equal(response.status, 403); assert.equal(response.body.code, "FORBIDDEN");
    }
    const context = await raw(port, base + "/context");
    assert.equal(context.status, 200); assert.equal(context.body.dataSource, "oracle-test");
    assert.equal(context.headers["cache-control"], "no-store");
    const f1 = await raw(port, base.replace("station-arrival", "stage-arrival") + "/context");
    assert.equal(f1.status, 403); assert.equal(f1.body.code, "LIVE_WRITES_DISABLED");
    const validation = await raw(port, base + "/validations", "POST", JSON.stringify(stationDraft), { origin });
    assert.equal(validation.status, 200); assert.equal(validation.body.state, "ready");
    assert.equal(existsSync(d.binding.allowanceFile), false);
    const duplicate = await raw(port, base + "/validations", "POST", '{"lateReasonCode":null,"lateReasonCode":null}', { origin });
    assert.equal(duplicate.status, 400); assert.equal(existsSync(d.binding.allowanceFile), false);
    const bad = await raw(port, base + "/commands", "POST", JSON.stringify({ commandId: randomUUID(), draft: stationDraft,
      validationToken: validation.body.validationToken, fingerprint: validation.body.fingerprint, confirmation: null }), { origin });
    assert.equal(bad.status, 400); assert.equal(existsSync(d.binding.allowanceFile), false);
    const command = { commandId: randomUUID(), draft: stationDraft, validationToken: validation.body.validationToken,
      fingerprint: validation.body.fingerprint, confirmation: null, operationConfirmation: { accepted: true } };
    const result = await raw(port, base + "/commands", "POST", JSON.stringify(command), { origin });
    assert.equal(result.status, 200); assert.equal(result.body.outcome, "oracle-test-committed");
    assert.equal(result.body.receiptPersistence, "none"); assert.equal(result.headers["access-control-allow-origin"], origin);
    assert.ok(d.events.includes("write:commit-ack")); assert.equal(d.committed, true);
  } finally {
    if (server) await stopBackendServer(server);
    assert.ok(!server || d.events.includes("write:pool-close"));
    d.dispose();
  }
});
test("native F2 metadata/readiness failure closes both owned pools without listener/fuse", async () => {
  const d = new StationOracleDouble(true);
  try {
    d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1";
    await assert.rejects(startFromEnvironment(env(d), d.clock, { read: async () => d.readPool, native: async () => d.writePool }));
    assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("disabled station routes remain disabled; native adapter injection cannot escalate fixture runtime", async () => {
  const d = new StationOracleDouble();
  try {
    const { app } = await d.application();
    const disabled = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
      dataSource: "isolated-fixture", businessTimeZone: "UTC", syntheticOrgUnitIds: ["T001"] };
    await assert.rejects(createRuntime(disabled, new FixtureReader([]), undefined, {
      reader: new CurrentFixtureReader(sampleCurrentFixture, ["T01"]), nativeStationArrival: app }));
    const runtime = await createRuntime(disabled, new FixtureReader([]));
    const server = createLoopbackServer(runtime); server.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
      const addr = server.address(); assert.ok(addr && typeof addr !== "string");
      const result = await raw(addr.port, base + "/context"); assert.equal(result.body.code, "LIVE_WRITES_DISABLED");
    } finally { await stopBackendServer(server); }
  } finally { d.dispose(); }
});
for (const phase of ["write:update", "write:commit"])
  test(`F2 entrypoint shutdown drains underlying ${phase} BEFORE closing either pool`, async () => {
    const d = new StationOracleDouble(true);
    let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
    let stopping: Promise<void> | undefined, pending: Promise<unknown> | undefined;
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
    try {
      server = await startFromEnvironment(env(d), d.clock, { read: async () => d.readPool, native: async () => d.writePool });
      const addr = server.address(); assert.ok(addr && typeof addr !== "string");
      const v = await raw(addr.port, base + "/validations", "POST", JSON.stringify(stationDraft), { origin });
      assert.equal(v.status, 200);
      d.hook = async e => { if (e === phase) { enter(); await gate; } };
      pending = raw(addr.port, base + "/commands", "POST", JSON.stringify({ commandId: randomUUID(), draft: stationDraft,
        validationToken: v.body.validationToken, fingerprint: v.body.fingerprint, confirmation: null,
        operationConfirmation: { accepted: true } }), { origin }).catch(() => ({ transportLost: true }));
      await entered;
      stopping = stopBackendServer(server);
      await new Promise<void>(r => setTimeout(r, 25));
      assert.equal(d.events.some(e => e.endsWith("pool-close")), false);
      assert.equal(d.committed, false);
      release(); await pending; await stopping;
      assert.equal(d.committed, phase === "write:commit");
      assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
      if (phase === "write:update") assert.equal(d.events.includes("write:commit"), false);
      else assert.ok(d.events.includes("write:close:true"));
    } finally {
      release(); await pending;
      if (stopping) await stopping; else if (server) await stopBackendServer(server);
      d.dispose();
    }
  });
