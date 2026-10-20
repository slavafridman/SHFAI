import test from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { symlinkSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { NativeOracleDouble, nativeConfig, nativeSelection, cleanNative } from "./native-stage-arrival-double.mts";
import { nativeBinding } from "../native-stage-arrival-config.mts";
import { nativeCommand, validNativeReceipt } from "../native-stage-arrival-validation.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { record } from "../contract-validation.mts";
import { NativeAllowance } from "../oracle-stage-arrival-application.mts";
import { BackendDrainPendingError, BackendLifecycle } from "../backend-lifecycle.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { runtimeFixture } from "./stage-arrival-helpers.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { once } from "node:events";
import type { BackendPoolFactories } from "../server.mts";
import type { OracleConnection } from "../oracle-session.mts";
import type { NativeConnection } from "../oracle-stage-arrival-uow.mts";

const origin = "http://localhost:4521";
const route = "/api/v1/employees/9001/shift-days/6201/stage-arrival";
function environment(d: NativeOracleDouble): NodeJS.ProcessEnv {
  return { SHF_ORACLE_CONFIG: JSON.stringify(nativeConfig), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SHIFTER",
    SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused-path",
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true", SHF_STAGE_ARRIVAL_ORIGINS: JSON.stringify([origin]),
    SHF_NATIVE_STAGE_CONNECT_STRING: "CTIDBT_WFMT", SHF_NATIVE_STAGE_USER: "SHIFTER",
    SHF_NATIVE_STAGE_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_STAGE_CLIENT_LIB_DIR: "synthetic-unused-path",
    SHF_NATIVE_STAGE_BINDING: JSON.stringify(d.binding) };
}
function factories(d: NativeOracleDouble): BackendPoolFactories {
  let active = 0, closing = false;
  const run = async <T,>(point: string, operation: () => Promise<T>) => {
    assert.equal(closing, false, "native/read operation admitted after pool shutdown");
    active++;
    try { return await operation(); }
    finally { active--; d.events.push(`qa:${point}:settled`); }
  };
  const close = async (kind: "read" | "write") => {
    assert.equal(active, 0, "pool.close while a lease/SQL/COMMIT/break/rollback/release is active");
    closing = true;
    await (kind === "read" ? d.readPool : d.writePool).close();
  };
  return {
    read: async () => ({
      getConnection: () => run("read-lease", async (): Promise<OracleConnection> => {
        const c = await d.readPool.getConnection();
        return {
          get callTimeout() { return c.callTimeout; }, set callTimeout(n: number) { c.callTimeout = n; },
          execute: (sql, binds, bound) => run("read-sql", () => c.execute(sql, binds, bound)),
          break: () => run("read-break", () => c.break()),
          rollback: () => run("read-rollback", () => c.rollback()),
          close: drop => run("read-release", () => c.close(drop)),
        };
      }), close: () => close("read"),
    }),
    native: async () => ({
      getConnection: () => run("write-lease", async (): Promise<NativeConnection> => {
        const c = await d.writePool.getConnection();
        return {
          get callTimeout() { return c.callTimeout; }, set callTimeout(n: number) { c.callTimeout = n; },
          execute: (sql, binds, bound) => run("write-sql", () => c.execute(sql, binds, bound)),
          commit: () => run("write-commit", () => c.commit()),
          break: () => run("write-break", () => c.break()),
          rollback: () => run("write-rollback", () => c.rollback()),
          close: drop => run("write-release", () => c.close(drop)),
        };
      }), close: () => close("write"),
    }),
  };
}
async function json(r: Response) { const v: unknown = await r.json(); assert.ok(record(v)); return v; }
function post(url: string, value: unknown) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(value) });
}
function command(v: unknown) {
  assert.ok(record(v));
  return nativeCommand({ commandId: "90000000-0000-4000-8000-000000000001", draft: cleanNative,
    confirmation: null, operationConfirmation: { accepted: true }, validationToken: v.validationToken, fingerprint: v.fingerprint });
}
test("D01 orphan stage user must reject preparation without token or DML", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application();
    d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_USER = "synthetic:orphan";
    await assert.rejects(app.validate(principal, nativeSelection, cleanNative), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
test("D01 orphan introduced AFTER validation must fail locked revalidation without UPDATE", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_USER = "synthetic:orphan";
    await assert.rejects(app.commit(principal, nativeSelection, command(v)), { code: "COMMAND_SCOPE_DEFERRED", effect: "none" });
    assert.ok(d.events.includes("write:native:lock:SHF_ATTENDANCE"));
    assert.ok(!d.events.includes("write:update")); assert.ok(!d.events.includes("write:commit"));
    assert.equal(d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_USER, "synthetic:orphan");
  } finally { d.dispose(); }
});
test("D01 NULL/NULL stage provenance and zero briefing flags remain legal", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    const r = await app.commit(principal, nativeSelection, command(v));
    assert.equal(r.outcome, "oracle-test-committed");
    assert.equal(d.events.filter(e => e === "write:update").length, 1);
  } finally { d.dispose(); }
});
test("D02 actual entrypoint shutdown cannot close pools while COMMIT is pending", async () => {
  const d = new NativeOracleDouble(true);
  let server, stopping: Promise<void> | undefined, request: Promise<unknown> | undefined;
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
  try {
    server = await startFromEnvironment(environment(d), undefined, factories(d));
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const base = `http://127.0.0.1:${a.port}` + route;
    const v = await json(await post(base + "/validations", cleanNative));
    d.hook = async event => { if (event === "write:commit") { enter(); await gate; } };
    request = post(base + "/commands", command(v)).then(async r => ({ status: r.status, body: await json(r) }),
      () => ({ transportLost: true }));
    await entered;
    stopping = stopBackendServer(server);
    await sleep(25);
    assert.equal(d.committed, false);
    assert.ok(!d.events.some(e => e.endsWith("pool-close")), "pool close before native COMMIT settled");
  } finally {
    release();
    await request;
    if (stopping) await stopping; else if (server) await stopBackendServer(server);
    d.dispose();
  }
});
test("D03 impossible readback instant must not pass native receipt guard", () => {
  const c = command({ validationToken: "A".repeat(43), fingerprint: "a".repeat(64) });
  const receipt = { commandId: c.commandId, ...nativeSelection, outcome: "oracle-test-committed",
    dataSource: "oracle-test", recorded: { stageArrivalLocal: "2026-10-20T12:00:00", briefing: false, stageLate: null },
    commitAcknowledgedAt: "2026-10-20T12:00:00.000Z", readBackVerifiedAt: "2026-99-99T99:99:99.999Z",
    businessTimeZone: "UTC", replayed: false, receiptPersistence: "none", partnerCompletion: "not-invoked" };
  assert.equal(validNativeReceipt(receipt, c, nativeSelection), false);
});
for (const field of ["commitAcknowledgedAt", "readBackVerifiedAt"] as const)
  test(`D03 strict Gregorian/finite/format matrix for ${field}`, () => {
    const c = command({ validationToken: "A".repeat(43), fingerprint: "a".repeat(64) });
    const receipt = { commandId: c.commandId, ...nativeSelection, outcome: "oracle-test-committed",
      dataSource: "oracle-test", recorded: { stageArrivalLocal: "2026-10-20T12:00:00", briefing: false, stageLate: null },
      commitAcknowledgedAt: "2026-10-20T12:00:00.000Z", readBackVerifiedAt: "2026-10-20T12:00:01.000Z",
      businessTimeZone: "UTC", replayed: false, receiptPersistence: "none", partnerCompletion: "not-invoked" };
    assert.equal(validNativeReceipt(receipt, c, nativeSelection), true);
    for (const invalid of ["2026-99-99T99:99:99.999Z", "2026-02-29T12:00:00.000Z", "2026-02-30T12:00:00.000Z",
      "2026-04-31T12:00:00.000Z", "2026-10-20T24:00:00.000Z", "2026-10-20T12:60:00.000Z",
      "2026-10-20T12:00:60.000Z", "0000-01-01T12:00:00.000Z", "2026-10-20T12:00:00Z",
      "2026-10-20T12:00:00.000+00:00", " 2026-10-20T12:00:00.000Z", "2026-10-20T12:00:00.000Z "])
      assert.equal(validNativeReceipt({ ...receipt, [field]: invalid }, c, nativeSelection), false, invalid);
    assert.equal(validNativeReceipt({ ...receipt, readBackVerifiedAt: receipt.commitAcknowledgedAt }, c, nativeSelection), true);
    assert.equal(validNativeReceipt({ ...receipt, readBackVerifiedAt: "2026-10-20T11:59:59.999Z" }, c, nativeSelection), false);
    assert.equal(validNativeReceipt({ ...receipt, commitAcknowledgedAt: "2024-02-29T12:00:00.000Z",
      readBackVerifiedAt: "2024-02-29T12:00:00.001Z" }, c, nativeSelection), true);
  });
test("D03 malformed receipt AFTER acknowledged double commit becomes UNKNOWN, not success/NONE", async () => {
  const d = new NativeOracleDouble();
  let server;
  try {
    const { app, principal } = await d.application(), fixture = await runtimeFixture();
    const runtime: SliceRuntime = { ...fixture.runtime, attendanceStageArrivalMode: "test-oracle-controlled",
      authenticate: async () => principal,
      stageArrivalValidate: (...args) => app.validate(...args),
      stageArrivalCommit: async (...args) => ({ ...await app.commit(...args), readBackVerifiedAt: "2026-99-99T99:99:99.999Z" }) };
    server = createLoopbackServer(runtime, { stageArrivalOrigins: [origin] });
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const base = `http://127.0.0.1:${a.port}` + route, v = await json(await post(base + "/validations", cleanNative));
    const response = await post(base + "/commands", command(v)), p = await json(response);
    assert.equal(response.status, 503); assert.equal(p.code, "COMMAND_OUTCOME_UNKNOWN");
    assert.equal(p.effect, "unknown"); assert.equal(p.nextAction, "reconcile");
    assert.ok(!Object.hasOwn(p, "recorded")); assert.ok(d.committed);
    assert.equal(d.events.filter(e => e === "write:commit").length, 1);
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
test("D04 external junction into repository must be rejected without consuming allowance", () => {
  const d = new NativeOracleDouble(), link = join(d.directory, "own-junction");
  const target = resolve(import.meta.dirname, ".."), file = "qa-junction-no-create-allowance";
  try {
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: join(link, file) }));
    assert.equal(existsSync(join(target, file)), false);
  } finally {
    if (existsSync(link)) unlinkSync(link); // Unlink only our link; never recurse into its target.
    d.dispose();
  }
});
test("D04 trusted existing ordinary external directory works, exactly one wx consumption", () => {
  const d = new NativeOracleDouble();
  try {
    const binding = nativeBinding(d.binding), allowance = new NativeAllowance(binding);
    allowance.consume(); assert.ok(existsSync(binding.allowanceFile));
    assert.throws(() => allowance.consume(), { code: "LIVE_WRITES_DISABLED" });
    assert.equal(existsSync(join(d.directory, "unexpected")), false);
  } finally { d.dispose(); }
});
test("D04 final symbolic link/junction rejected; also rechecked if swapped after binding", () => {
  const d = new NativeOracleDouble(), target = join(d.directory, "own-target"), link = d.binding.allowanceFile;
  mkdirSync(target);
  try {
    const binding = nativeBinding(d.binding), allowance = new NativeAllowance(binding);
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => nativeBinding(d.binding));
    assert.throws(() => allowance.consume(), { code: "LIVE_WRITES_DISABLED" });
    assert.equal(existsSync(join(target, "operator-allowance")), false);
  } finally { if (existsSync(link)) unlinkSync(link); d.dispose(); }
});
test("D04 ancestor junction into another external directory is rejected too, not just repo junction", () => {
  const d = new NativeOracleDouble(), target = join(d.directory, "own-target"), link = join(d.directory, "own-link");
  mkdirSync(join(target, "child"), { recursive: true });
  try {
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: join(link, "child", "allowance") }));
    assert.equal(existsSync(join(target, "child", "allowance")), false);
  } finally { if (existsSync(link)) unlinkSync(link); d.dispose(); }
});
test("D04 missing parent is not created, repository boundary is module-root based, errors sanitized", () => {
  const d = new NativeOracleDouble();
  try {
    const input = join(d.directory, "absent", "allowance");
    assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: input }), e =>
      e instanceof Error && !e.message.includes(d.directory));
    assert.equal(existsSync(join(d.directory, "absent")), false);
    const root = resolve(import.meta.dirname, "../../..");
    assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: join(root, "no-create-allowance") }));
    if (process.platform === "win32") {
      assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: join(root.toUpperCase(), "no-create-allowance") }));
      assert.equal(nativeBinding({ ...d.binding, allowanceFile: d.binding.allowanceFile.replaceAll("\\", "/") }).allowanceFile,
        nativeBinding(d.binding).allowanceFile);
      assert.equal(nativeBinding({ ...d.binding, allowanceFile: "\\\\?\\" + d.binding.allowanceFile }).allowanceFile,
        nativeBinding(d.binding).allowanceFile);
      assert.equal(nativeBinding({ ...d.binding, allowanceFile: d.binding.allowanceFile.toUpperCase() }).allowanceFile.toLowerCase(),
        nativeBinding(d.binding).allowanceFile.toLowerCase());
      for (const path of [d.binding.allowanceFile + ":stream", d.binding.allowanceFile + ".", d.binding.allowanceFile + " "])
        assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: path }));
      // Reject unsupported namespaces before IO; never contact these hosts/shares.
      for (const path of ["\\\\localhost\\C$\\no-create-allowance", "\\\\?\\UNC\\localhost\\C$\\no-create-allowance",
        "\\\\?\\Volume{00000000-0000-0000-0000-000000000000}\\no-create-allowance", "\\\\.\\C:\\no-create-allowance"])
        assert.throws(() => nativeBinding({ ...d.binding, allowanceFile: path }));
    }
  } finally { d.dispose(); }
});

for (const phase of ["lease", "query", "update", "commit", "break", "rollback", "release", "readback", "readback-cleanup"] as const)
  test(`D02 actual HTTP shutdown drains gated ${phase} before either pool.close`, async () => {
    const d = new NativeOracleDouble(true);
    let server, stopping: Promise<void> | undefined, request: Promise<unknown> | undefined;
    let enter!: () => void, release!: () => void, breakEnter!: () => void, breakRelease!: () => void;
    const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
    const breakEntered = new Promise<void>(r => { breakEnter = r; }), breakGate = new Promise<void>(r => { breakRelease = r; });
    let nativeSettled = false, breakSettled = false, stopSettled = false;
    const point = phase === "lease" ? "write:lease" : phase === "query" ? "write:native:row:SHF_ATTENDANCE" :
      phase === "update" ? "write:updated" : phase === "rollback" ? "write:rollback" :
      phase === "release" ? "write:close:false" : phase === "readback" ? "read:native:row:SHF_ATTENDANCE" :
      phase === "readback-cleanup" ? "read:rollback" : "write:commit";
    try {
      server = await startFromEnvironment(environment(d), undefined, factories(d));
      const a = server.address(); assert.ok(a && typeof a !== "string");
      const base = `http://127.0.0.1:${a.port}` + route, v = await json(await post(base + "/validations", cleanNative));
      d.hook = async event => {
        if (phase === "rollback" && event === "write:updated") throw { code: "DPI-1067" };
        if (phase === "break" && event === "write:break") {
          breakEnter(); await breakGate; breakSettled = true; d.events.push("qa:break-settled");
        }
        if (event === point && (!phase.startsWith("readback") || d.committed)) {
          enter(); await gate; nativeSettled = true; d.events.push("qa:native-settled");
        }
      };
      request = post(base + "/commands", command(v)).then(async r => {
        const p = await json(r);
        assert.notEqual(r.status, 200);
        if (["commit", "break", "release", "readback", "readback-cleanup"].includes(phase))
          assert.equal(p.effect, "unknown"); // Post-send shutdown cannot prove NONE or success.
        return p;
      }, () => ({ transportLost: true })); // Loss after command send is UNKNOWN to the client.
      await entered;
      stopping = stopBackendServer(server).then(() => { stopSettled = true; });
      if (phase === "break") await breakEntered;
      await sleep(20);
      assert.equal(nativeSettled, false); assert.equal(stopSettled, false);
      assert.ok(!d.events.some(e => e.endsWith("pool-close")));
      release();
      if (phase === "break") {
        await sleep(20); assert.equal(breakSettled, false);
        assert.ok(!d.events.some(e => e.endsWith("pool-close"))); breakRelease();
      }
      await stopping; await request;
      const firstClose = d.events.findIndex(e => e.endsWith("pool-close"));
      assert.ok(firstClose > d.events.indexOf("qa:native-settled"));
      if (phase === "break") assert.ok(firstClose > d.events.indexOf("qa:break-settled"));
      assert.ok(d.events.includes("read:pool-close") && d.events.includes("write:pool-close"));
      assert.equal(d.events.filter(e => e === "write:commit").length,
        ["commit", "break", "release", "readback", "readback-cleanup"].includes(phase) ? 1 : 0);
      assert.equal(d.events.filter(e => e === "write:update").length, phase === "lease" || phase === "query" ? 0 : 1);
    } finally {
      release(); breakRelease(); await request;
      if (stopping) await stopping; else if (server) await stopBackendServer(server);
      d.dispose();
    }
  });
test("D02 bounded shutdown reports pending, retains owned drain and never force-closes gated COMMIT", { timeout: 12000 }, async () => {
  const d = new NativeOracleDouble(true);
  let server, request: Promise<unknown> | undefined;
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
  try {
    server = await startFromEnvironment(environment(d), undefined, factories(d));
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const base = `http://127.0.0.1:${a.port}` + route, v = await json(await post(base + "/validations", cleanNative));
    d.hook = async event => { if (event === "write:commit") { enter(); await gate; } };
    request = post(base + "/commands", command(v)).catch(() => null);
    await entered;
    await assert.rejects(stopBackendServer(server), BackendDrainPendingError);
    assert.ok(!d.events.some(e => e.endsWith("pool-close"))); assert.equal(d.committed, false);
    const sameDrain = stopBackendServer(server);
    release(); await sameDrain; await request;
    assert.ok(d.committed);
    assert.equal(d.events.filter(e => e === "read:pool-close").length, 1);
    assert.equal(d.events.filter(e => e === "write:pool-close").length, 1);
    await stopBackendServer(server); // Idempotent; no second close or native retry.
  } finally { release(); await request; if (server) await stopBackendServer(server); d.dispose(); }
});
test("D02 actual read-only entrypoint drains an active query before its sole pool closes", async () => {
  const d = new NativeOracleDouble(true);
  let server, request: Promise<unknown> | undefined, stopping: Promise<void> | undefined;
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
  try {
    const e = environment(d);
    e.SHF_ORACLE_CONFIG = JSON.stringify({ ...nativeConfig, attendanceStageArrivalMode: "disabled" });
    for (const key of Object.keys(e)) if (key.startsWith("SHF_NATIVE_STAGE_") ||
        key === "SHF_TEST_ORACLE_STAGE_WRITE_ENABLED" || key === "SHF_STAGE_ARRIVAL_ORIGINS") delete e[key];
    server = await startFromEnvironment(e, undefined, factories(d));
    const a = server.address(); assert.ok(a && typeof a !== "string");
    d.hook = async event => { if (event === "read:probe") { enter(); await gate; d.events.push("qa:read-settled"); } };
    request = fetch(`http://127.0.0.1:${a.port}/api/v1/current-shifts/filter-context`).catch(() => null);
    await entered; stopping = stopBackendServer(server); await sleep(20);
    assert.ok(!d.events.includes("read:pool-close")); assert.ok(!d.events.includes("write:lease"));
    release(); await stopping; await request;
    assert.ok(d.events.indexOf("read:pool-close") > d.events.indexOf("qa:read-settled"));
    assert.ok(!d.events.includes("write:pool-close"));
  } finally { release(); await request; if (stopping) await stopping; else if (server) await stopBackendServer(server); d.dispose(); }
});
test("D02 F1 fixture shutdown owns pending authentication and preserves zero mutations", async () => {
  const f = await runtimeFixture();
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
  const runtime: SliceRuntime = { ...f.runtime, authenticate: async r => { enter(); await gate; return f.runtime.authenticate(r); } };
  const server = createLoopbackServer(runtime, { stageArrivalOrigins: [origin] });
  let request: Promise<unknown> | undefined, stopping: Promise<void> | undefined, stopped = false;
  try {
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const a = server.address(); assert.ok(a && typeof a !== "string");
    request = post(`http://127.0.0.1:${a.port}` + route + "/validations", cleanNative).catch(() => null);
    await entered;
    stopping = stopBackendServer(server).then(() => { stopped = true; });
    await sleep(20); assert.equal(stopped, false);
    release(); await stopping; await request;
    assert.equal(f.store.inspectSnapshot().receipts, 0); assert.equal(f.store.inspectSnapshot().audits, 0);
  } finally { release(); await request; if (stopping) await stopping; else await stopBackendServer(server); }
});
test("D02 lifecycle rejects new admission after shutdown starts without invoking the task", async () => {
  const lifecycle = new BackendLifecycle();
  lifecycle.beginShutdown();
  let called = false;
  await assert.rejects(lifecycle.run(async () => { called = true; }), { code: "DEPENDENCY_UNAVAILABLE" });
  await lifecycle.drain(); assert.equal(called, false);
});
