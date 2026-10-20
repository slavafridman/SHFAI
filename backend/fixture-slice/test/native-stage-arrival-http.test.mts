import test from "node:test";
import assert from "node:assert/strict";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { NativeOracleDouble, nativeConfig, cleanNative } from "./native-stage-arrival-double.mts";
import { record } from "../contract-validation.mts";
import { nativeCommand } from "../native-stage-arrival-validation.mts";
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { existsSync } from "node:fs";

const origin = "http://localhost:4521";
const route = "/api/v1/employees/9001/shift-days/6201/stage-arrival";
function environment(d: NativeOracleDouble): NodeJS.ProcessEnv {
  return { SHF_ORACLE_CONFIG: JSON.stringify(nativeConfig), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SHIFTER",
    SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused-client-path",
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true", SHF_STAGE_ARRIVAL_ORIGINS: JSON.stringify([origin]),
    SHF_NATIVE_STAGE_CONNECT_STRING: "CTIDBT_WFMT", SHF_NATIVE_STAGE_USER: "SHIFTER",
    SHF_NATIVE_STAGE_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_STAGE_CLIENT_LIB_DIR: "synthetic-unused-client-path",
    SHF_NATIVE_STAGE_BINDING: JSON.stringify(d.binding) };
}
const factories = (d: NativeOracleDouble) => ({ read: async () => d.readPool, native: async () => d.writePool });
async function json(r: Response) { const v: unknown = await r.json(); assert.ok(record(v)); return v; }
function post(url: string, value: unknown, requestOrigin = origin) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin,
    "sec-ch-ua": '"Chromium";v="141"', "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"Windows"' },
  body: JSON.stringify(value) });
}
test("N07 actual startFromEnvironment native HTTP: source oracle/10, context+PURE0, confirmed commit+readback1", async () => {
  const d = new NativeOracleDouble(true);
  let server;
  try {
    server = await startFromEnvironment(environment(d), { now: () => new Date("2000-01-01T00:00:00Z") }, factories(d));
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const identity = await json(await fetch(base + "/api/v1/identity"));
    assert.equal(identity.dataSource, "oracle");
    assert.ok(record(identity.principal)); assert.equal(identity.principal.employeeId, null);
    assert.ok(Array.isArray(identity.principal.capabilities)); assert.equal(identity.principal.capabilities.length, 10);
    const context = await fetch(base + route + "/context", { headers: { Origin: origin } });
    assert.equal(context.status, 200); assert.equal(context.headers.get("Access-Control-Allow-Origin"), origin);
    assert.equal((await json(context)).dataSource, "oracle-test");
    const response = await post(base + route + "/validations", cleanNative);
    assert.equal(response.status, 200); const v = await json(response);
    assert.ok(!d.events.includes("write:update"));
    assert.ok(!d.sql.some(q => /FOR UPDATE/.test(q.sql)));
    const command = nativeCommand({ commandId: "90000000-0000-4000-8000-000000000001", draft: cleanNative,
      confirmation: null, operationConfirmation: { accepted: true }, validationToken: v.validationToken, fingerprint: v.fingerprint });
    const bad = await post(base + route + "/commands", { ...command, operationConfirmation: { accepted: false } });
    assert.equal(bad.status, 400); assert.equal((await json(bad)).effect, "none");
    const csrf = await post(base + route + "/commands", command, "http://localhost:4522");
    assert.equal(csrf.status, 403); assert.equal(csrf.headers.get("Access-Control-Allow-Origin"), null);
    assert.ok(!d.events.includes("write:update")); assert.ok(!existsSync(d.binding.allowanceFile));
    const result = await post(base + route + "/commands", command);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("Cache-Control"), "no-store");
    const r = await json(result); assert.equal(r.outcome, "oracle-test-committed");
    assert.equal(r.dataSource, "oracle-test"); assert.equal(r.replayed, false); assert.equal(r.receiptPersistence, "none");
    assert.ok(!Object.hasOwn(r, "committedAt"));
    assert.equal(d.events.filter(e => e === "write:update").length, 1);
    const replay = await post(base + route + "/commands", command);
    assert.equal(replay.status, 409); assert.equal((await json(replay)).code, "ALREADY_REGISTERED");
    assert.equal(d.events.filter(e => e === "write:commit").length, 1);
  } finally {
    if (server) await stopBackendServer(server);
    assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
    d.dispose();
  }
});
test("N07 expired prepared native data stops actual startup; no fixture refresh/backdate/lock", async () => {
  const d = new NativeOracleDouble(true);
  try {
    d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME = new Date(Date.now() - 60000).toISOString().slice(0, 19);
    await assert.rejects(startFromEnvironment(environment(d), undefined, factories(d)), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.ok(!d.sql.some(q => /FOR UPDATE|UPDATE |INSERT|MERGE/.test(q.sql)));
    assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
  } finally { d.dispose(); }
});
for (const invalid of ["missing-flag", "false-flag", "bad-flag", "missing-binding", "missing-account", "production",
  "real-auth", "fixture-native", "local-native", "origins-absent", "origin-wildcard", "origin-remote", "origin-duplicates",
  "origin-unbounded", "fixture-mixed", "freeze-absent"] as const)
  test(`N07 entrypoint ${invalid} rejects before pooling/listen`, async () => {
    const d = new NativeOracleDouble(true);
    try {
      const e = environment(d);
      if (invalid === "missing-flag") delete e.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED;
      if (invalid === "false-flag") e.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = "false";
      if (invalid === "bad-flag") e.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = "TRUE";
      if (invalid === "missing-binding") delete e.SHF_NATIVE_STAGE_BINDING;
      if (invalid === "missing-account") delete e.SHF_NATIVE_STAGE_USER;
      if (invalid === "production") e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, deploymentClass: "production" });
      if (invalid === "real-auth") e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, authenticationMode: "real" });
      if (invalid === "fixture-native") e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, dataSource: "isolated-fixture" });
      if (invalid === "local-native") e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, deploymentClass: "local-development" });
      if (invalid === "origins-absent") delete e.SHF_STAGE_ARRIVAL_ORIGINS;
      if (invalid === "origin-wildcard") e.SHF_STAGE_ARRIVAL_ORIGINS = '["*"]';
      if (invalid === "origin-remote") e.SHF_STAGE_ARRIVAL_ORIGINS = '["https://example.invalid"]';
      if (invalid === "origin-duplicates") e.SHF_STAGE_ARRIVAL_ORIGINS = JSON.stringify([origin, origin]);
      if (invalid === "origin-unbounded") e.SHF_STAGE_ARRIVAL_ORIGINS = " ".repeat(4097);
      if (invalid === "fixture-mixed") e.SHF_STAGE_ARRIVAL_FIXTURE = JSON.stringify([sampleStageArrivalFacts]);
      if (invalid === "freeze-absent") e.SHF_NATIVE_STAGE_BINDING = JSON.stringify({ ...d.binding, writerFreezeConfirmed: false });
      await assert.rejects(startFromEnvironment(e, undefined, factories(d)));
      assert.ok(!d.events.includes("read:lease")); assert.ok(!d.events.includes("write:lease"));
    } finally { d.dispose(); }
  });
test("N07 existing read-only actual entrypoint remains seven rights, Oracle source, zero native admission", async () => {
  const d = new NativeOracleDouble(true);
  let server;
  try {
    const e = environment(d);
    e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, attendanceStageArrivalMode: "disabled" });
    for (const key of Object.keys(e)) if (key.startsWith("SHF_NATIVE_STAGE_") ||
        key === "SHF_TEST_ORACLE_STAGE_WRITE_ENABLED" || key === "SHF_STAGE_ARRIVAL_ORIGINS") delete e[key];
    server = await startFromEnvironment(e, undefined, factories(d));
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const base = `http://127.0.0.1:${a.port}`;
    const identity = await json(await fetch(base + "/api/v1/identity"));
    assert.ok(record(identity.principal) && Array.isArray(identity.principal.capabilities));
    assert.equal(identity.principal.capabilities.length, 7); assert.equal(identity.dataSource, "oracle");
    const denied = await fetch(base + route + "/context");
    assert.equal(denied.status, 403); assert.equal((await json(denied)).code, "LIVE_WRITES_DISABLED");
    assert.ok(!d.events.includes("write:lease"));
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
for (const point of ["write:native:metadata:3", "write:pool-close", "write:commit-ack"] as const)
  test(`N07 entrypoint pool cleanup / native UNKNOWN at ${point}`, async () => {
    const d = new NativeOracleDouble(true); let server;
    try {
      if (point === "write:native:metadata:3") {
        d.hook = event => { if (event === point) throw Error("synthetic-failure"); };
        await assert.rejects(startFromEnvironment(environment(d), undefined, factories(d)));
        assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
      } else {
        server = await startFromEnvironment(environment(d), undefined, factories(d));
        const a = server.address(); assert.ok(a && typeof a !== "string");
        const base = `http://127.0.0.1:${a.port}` + route;
        if (point === "write:commit-ack") {
          const v = await json(await post(base + "/validations", cleanNative));
          d.hook = event => { if (event === point) throw { code: "NJS-500" }; };
          const r = await post(base + "/commands", { commandId: "90000000-0000-4000-8000-000000000001",
            draft: cleanNative, confirmation: null, operationConfirmation: { accepted: true },
            validationToken: v.validationToken, fingerprint: v.fingerprint });
          assert.equal(r.status, 503); const p = await json(r);
          assert.equal(p.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(p.effect, "unknown"); assert.equal(p.nextAction, "reconcile");
          assert.ok(!JSON.stringify(p).includes("NJS-500")); assert.ok(!Object.hasOwn(p, "recorded"));
          assert.equal(d.events.filter(e => e === "write:commit").length, 1);
        } else {
          d.hook = event => { if (event === "read:pool-close" || event === "write:pool-close") throw Error("synthetic-cleanup"); };
          const closing = server; server = undefined;
          await assert.rejects(stopBackendServer(closing));
          assert.ok(d.events.includes("read:pool-close")); assert.ok(d.events.includes("write:pool-close"));
        }
      }
    } finally { if (server) await stopBackendServer(server); d.dispose(); }
  });
test("N07 fixture startup cannot carry native flag/account; native config cannot gain fixture9 fallback", async () => {
  const d = new NativeOracleDouble(true);
  try {
    await assert.rejects(startFromEnvironment({ SHF_FIXTURE_CONFIG: JSON.stringify(sampleStageArrivalConfig),
      SHF_FIXTURE_PORT: "0", SHF_STAGE_ARRIVAL_FIXTURE: JSON.stringify([sampleStageArrivalFacts]),
      SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true" }, undefined, factories(d)));
    assert.equal(d.events.length, 0);
  } finally { d.dispose(); }
});
