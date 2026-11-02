import { test } from "node:test";
import assert from "node:assert/strict";
import { ChildProcess, spawn } from "node:child_process";
import { getEventListeners, once } from "node:events";
import { fileURLToPath } from "node:url";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import {
  connectionCheckExitCode, runConnectionCheck, runConnectionProbe, validateConnectionRuntime,
} from "../oracle-connection-check.mts";

// Synthetic inputs and isolated infrastructure doubles only. No TNS/network access.
function environment(): NodeJS.ProcessEnv {
  return {
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "shifter",
    SHF_ORACLE_PASSWORD: "UNIT_SECRET", SHF_ORACLE_CLIENT_LIB_DIR: "C:\\unit-client",
    TNS_ADMIN: "C:\\unit-tns",
  };
}
function protocol(failAt?: string, rows: unknown[] = [{ ok: 1 }]) {
  const calls: string[] = [];
  const connection: OracleConnection = {
    callTimeout: 0,
    async execute(sql, binds, bound) {
      calls.push("execute");
      assert.equal(sql, 'SELECT 1 AS "ok" FROM dual');
      assert.deepEqual(binds, {});
      assert.equal(bound, 2);
      assert.equal(connection.callTimeout, 3000);
      if (failAt === "execute") throw { code: "ORA-01017", message: "UNIT_SECRET" };
      return rows;
    },
    async break() { throw new Error("not used"); },
    async rollback() { calls.push("rollback"); if (failAt === "rollback") throw Error("UNIT_SECRET"); },
    async close() { calls.push("close"); if (failAt === "close") throw Error("UNIT_SECRET"); },
  };
  const pool: OraclePool = {
    async getConnection() {
      calls.push("connect");
      if (failAt === "connect") throw { cause: { oracleCode: "ORA-01017" }, message: "UNIT_SECRET" };
      return connection;
    },
    async close() { calls.push("drain"); if (failAt === "drain") throw Error("UNIT_SECRET"); },
  };
  return { calls, createPool: async () => { calls.push("pool"); return pool; } };
}
async function goodPacket() {
  return runConnectionProbe(environment(), true, protocol());
}
class OwnedChild extends ChildProcess {
  killedByParent = false;
  acknowledgeKill = true;
  constructor() { super(); Object.defineProperty(this, "pid", { value: 123 }); }
  exit(code: number | null = 0, signal: NodeJS.Signals | null = null) {
    Object.defineProperty(this, "exitCode", { value: code, configurable: true });
    Object.defineProperty(this, "signalCode", { value: signal, configurable: true });
    this.emit("exit", code, signal);
  }
  override kill(): boolean {
    this.killedByParent = true;
    if (this.acknowledgeKill) queueMicrotask(() => this.exit(null, "SIGKILL"));
    return true;
  }
}

function released(child: ChildProcess, signal?: AbortSignal) {
  assert.equal(child.listenerCount("message"), 0);
  assert.equal(child.listenerCount("exit"), 0);
  if (signal) assert.equal(getEventListeners(signal, "abort").length, 0);
}
// All real subprocesses belong to this file. Even a failed assertion or a
// supervisor UNKNOWN must kill and await close (exit alone does not close stdio).
async function ownedProcess<T>(args: string[], env: NodeJS.ProcessEnv,
  use: (child: ChildProcess, closed: Promise<void>) => Promise<T>): Promise<T> {
  const child = spawn(process.execPath, args, { env, stdio: ["ignore", "pipe", "pipe", "ipc"] });
  let spawnError: Error | undefined;
  child.on("error", error => { spawnError = error; });
  const closed = new Promise<void>(resolve => child.once("close", () => resolve()));
  const watchdog = setTimeout(() => child.kill("SIGKILL"), 5000);
  try {
    const result = await use(child, closed);
    if (spawnError) throw spawnError;
    return result;
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await closed;
    clearTimeout(watchdog);
    assert.ok(child.exitCode !== null || child.signalCode !== null || spawnError);
  }
}
async function isolatedCli(args: string[], env: NodeJS.ProcessEnv) {
  return ownedProcess(args, env, async (child, closed) => {
    let stdout = "", stderr = "";
    child.stdout!.setEncoding("utf8"); child.stderr!.setEncoding("utf8");
    child.stdout!.on("data", chunk => { stdout += chunk; });
    child.stderr!.on("data", chunk => { stderr += chunk; });
    await closed;
    return { status: child.exitCode, stdout, stderr };
  });
}

test("missing five keys blocks before pool or child creation", async () => {
  let attempts = 0;
  const result = await runConnectionCheck({}, true, { forkChild: () => { attempts++; throw Error(); } });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.missing.length, 5);
  assert.equal(attempts, 0);
  for (const key of Object.keys(environment())) {
    const env = environment(); delete env[key];
    const p = protocol();
    assert.equal((await runConnectionProbe(env, true, p)).status, "BLOCKED");
    assert.deepEqual(p.calls, []);
  }
});
test("explicit opt-in is required before infrastructure", async () => {
  const p = protocol();
  assert.equal((await runConnectionProbe(environment(), false, p)).status, "BLOCKED");
  assert.deepEqual(p.calls, []);
});
test("known TEST aliases and unquoted account casing accepted without changing supplied username", async () => {
  for (const alias of ["CTIDBT_WFMT", "ctidbt_wfmt.world"]) {
    const env = { ...environment(), SHF_ORACLE_CONNECT_STRING: alias, SHF_ORACLE_USER: "ShIfTeR" };
    const p = protocol();
    const result = await runConnectionProbe(env, true, { createPool: async inputs => {
      assert.equal(inputs.user, "ShIfTeR"); return p.createPool();
    } });
    assert.equal(result.status, "CONNECTIVITY_OK");
    assert.equal(result.targetIdentityVerified, false);
    assert.equal(result.nativeWritesAuthorized, false);
    assert.equal(result.releaseReady, false);
  }
});
test("unknown alias, quoted/other account, invalid local paths reject before factory", async () => {
  for (const change of [
    { SHF_ORACLE_CONNECT_STRING: "unknown" }, { SHF_ORACLE_USER: '"SHIFTER"' },
    { SHF_ORACLE_USER: "other" }, { SHF_ORACLE_CLIENT_LIB_DIR: "\\\\unit\\share" },
    { TNS_ADMIN: "relative" },
  ]) {
    const p = protocol();
    assert.equal((await runConnectionProbe({ ...environment(), ...change }, true, p)).status, "BLOCKED");
    assert.deepEqual(p.calls, []);
  }
});
test("production and writer/native/coordinator config reject by presence", async () => {
  for (const change of [
    { NODE_ENV: "production" }, { NODE_ENV: "PRODUCTION" }, { SHF_APP_ENV: "production" },
    { NODE_ENV: "invalid" }, { SHF_APP_ENV: "invalid" },
    { SHF_ORACLE_CONFIG: "UNIT_SECRET" }, { SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: "" },
    { SHF_TEST_ORACLE_STAGE_WRITE: "false" }, { SHF_NATIVE_STAGE_CONFIG: "" },
  ]) {
    const p = protocol();
    assert.equal((await runConnectionProbe({ ...environment(), ...change }, true, p)).status, "BLOCKED");
    assert.deepEqual(p.calls, []);
  }
});
test("basic check needs no app env/config/proof; exact query then rollback, close, drain", async () => {
  const p = protocol();
  const result = await runConnectionProbe(environment(), true, p);
  assert.equal(result.status, "CONNECTIVITY_OK");
  assert.deepEqual(p.calls, ["pool", "connect", "execute", "rollback", "close", "drain"]);
  assert.equal(result.childExitAck, false);
  assert.ok(result.connected && result.querySucceeded && result.rollbackAck && result.closeAck && result.poolDrainAck);
});
test("query requires exactly one row containing only numeric ok=1", async () => {
  for (const rows of [[], [{ ok: "1" }], [{ ok: 1 }, { ok: 1 }], [{ ok: 1, extra: "UNIT_SECRET" }]]) {
    const p = protocol(undefined, rows);
    const r = await runConnectionProbe(environment(), true, p);
    assert.equal(r.status, "CONNECTION_FAILED");
    assert.equal(r.querySucceeded, false);
    assert.ok(r.rollbackAck && r.closeAck && r.poolDrainAck);
  }
});
test("failed login reports only safe Oracle code and still drains pool", async () => {
  const p = protocol("connect");
  const r = await runConnectionProbe(environment(), true, p);
  assert.equal(r.status, "CONNECTION_FAILED");
  assert.equal(r.oracleCode, "ORA-01017");
  assert.deepEqual(p.calls, ["pool", "connect", "drain"]);
  assert.ok(!JSON.stringify(r).includes("UNIT_SECRET"));
  const child = new OwnedChild();
  const pending = runConnectionCheck(environment(), true, { forkChild: () => child });
  const noPool = await runConnectionProbe(environment(), true, {
    createPool: async () => { throw { code: "DPI-1047 UNIT_SECRET", message: "UNIT_SECRET" }; },
  });
  child.emit("message", noPool); child.exit(1);
  const noPoolResult = await pending;
  assert.equal(noPoolResult.status, "CONNECTION_FAILED");
  assert.equal(noPoolResult.oracleCode, undefined);
  assert.ok(!JSON.stringify(noPoolResult).includes("UNIT_SECRET"));
});
test("query errors are redacted; rollback and close still acknowledged", async () => {
  const r = await runConnectionProbe(environment(), true, protocol("execute"));
  assert.equal(r.status, "CONNECTION_FAILED");
  assert.equal(r.oracleCode, "ORA-01017");
  assert.ok(r.rollbackAck && r.closeAck && r.poolDrainAck);
  assert.ok(!JSON.stringify(r).includes("UNIT_SECRET"));
});
test("rollback, close or drain failure is UNKNOWN, never successful", async () => {
  for (const stage of ["rollback", "close", "drain"]) {
    const p = protocol(stage);
    const r = await runConnectionProbe(environment(), true, p);
    assert.equal(r.status, "UNKNOWN");
    assert.deepEqual(p.calls, ["pool", "connect", "execute", "rollback", "close", "drain"]);
    assert.ok(!JSON.stringify(r).includes("UNIT_SECRET"));
  }
});
test("unapproved runtime/driver rejected by version guard", () => {
  assert.doesNotThrow(() => validateConnectionRuntime("win32", "24.21.0", "26.0.0"));
  for (const [platform, node, driver] of [
    ["linux", "24.21.0", "26.0.0"], ["win32", "22.0.0", "26.0.0"],
    ["win32", "24.21.0", "7.0.0"],
  ]) assert.throws(() => validateConnectionRuntime(platform, node, driver));
});
test("parent waits for actual normal exit before success; child env is allowlisted", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const clear = t.mock.method(globalThis, "clearTimeout");
  const controller = new AbortController();
  const packet = await goodPacket(), child = new OwnedChild();
  let returned = false;
  const pending = runConnectionCheck({ ...environment(), PRIVATE_UNIT_KEY: "UNIT_SECRET" }, true, {
    signal: controller.signal,
    forkChild: env => {
      assert.equal(env.PRIVATE_UNIT_KEY, undefined);
      assert.equal(env.SHF_APP_ENV, undefined);
      assert.equal(env.SHF_ORACLE_PASSWORD, "UNIT_SECRET");
      return child;
    },
  }).then(r => { returned = true; return r; });
  child.emit("message", packet);
  await new Promise<void>(r => setImmediate(r));
  assert.equal(returned, false);
  child.exit();
  const result = await pending;
  assert.equal(result.status, "CONNECTIVITY_OK");
  assert.equal(result.childExitAck, true);
  assert.equal(child.killedByParent, false);
  assert.equal(connectionCheckExitCode(result), 0);
  released(child, controller.signal);
  assert.equal(clear.mock.callCount(), 2);
  assert.ok(clear.mock.calls.every(call => call.arguments[0] !== undefined));
  t.mock.timers.tick(5000);
  assert.equal(child.killedByParent, false);
  assert.equal(clear.mock.callCount(), 2);
});
test("malformed/extra/unsafe IPC and inconsistent ACKs are discarded, not echoed", async () => {
  const packet = await goodPacket();
  for (const bad of [
    { ...packet, secret: "UNIT_SECRET" }, { ...packet, oracleCode: "ORA-01017 UNIT_SECRET" },
    { ...packet, closeAck: false }, { ...packet, status: "READINESS_PASS" },
    { ...packet, targetIdentityVerified: true }, { ...packet, childExitAck: true },
    { ...packet, missing: ["UNIT_SECRET"] },
  ]) {
    const child = new OwnedChild();
    const pending = runConnectionCheck(environment(), true, { forkChild: () => child });
    child.emit("message", bad);
    const r = await pending;
    assert.equal(r.status, "UNKNOWN");
    assert.equal(r.connected, false);
    assert.equal(r.childExitAck, true);
    assert.ok(!JSON.stringify(r).includes("UNIT_SECRET"));
  }
});
test("worker exits without packet or with wrong exit code cannot pass", async () => {
  for (const withPacket of [false, true]) {
    const child = new OwnedChild();
    const pending = runConnectionCheck(environment(), true, { forkChild: () => child });
    if (withPacket) child.emit("message", await goodPacket());
    child.exit(1);
    const r = await pending;
    assert.equal(r.status, "UNKNOWN");
    assert.equal(r.childExitAck, true);
  }
});
test("duplicate packets and worker error cannot become success", async () => {
  const packet = await goodPacket();
  for (const event of ["duplicate", "error"]) {
    const child = new OwnedChild();
    const pending = runConnectionCheck(environment(), true, { forkChild: () => child });
    child.emit("message", packet);
    if (event === "duplicate") child.emit("message", packet);
    else child.emit("error", Error("UNIT_SECRET"));
    assert.equal((await pending).status, "UNKNOWN");
  }
});
test("hang termination awaits actual exit; unacknowledged kill remains UNKNOWN", async t => {
  // Exercise the unchanged absolute 5s production schedule without real sleeps.
  // A kill request is not an exit ACK; neither IPC nor close substitutes for it.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const clear = t.mock.method(globalThis, "clearTimeout");
  for (const ack of [true, false]) {
    const child = new OwnedChild(); child.acknowledgeKill = ack;
    const controller = new AbortController();
    let returned = false;
    const pending = runConnectionCheck(environment(), true, {
      forkChild: () => child, signal: controller.signal,
    }).then(r => { returned = true; return r; });
    t.mock.timers.tick(4499);
    assert.equal(child.killedByParent, false);
    t.mock.timers.tick(1);
    assert.equal(child.killedByParent, true);
    assert.equal(returned, false);
    await Promise.resolve(); // Only an acknowledged kill queues an actual exit.
    if (!ack) {
      child.emit("close", null, "SIGKILL");
      t.mock.timers.tick(499);
      await Promise.resolve();
      assert.equal(returned, false);
      t.mock.timers.tick(1);
    }
    const r = await pending;
    assert.equal(child.killedByParent, true);
    assert.equal(r.status, "UNKNOWN");
    assert.equal(r.childExitAck, ack);
    assert.equal(connectionCheckExitCode(r), 2);
    released(child, controller.signal);
    const snapshot = { ...r };
    child.emit("message", await goodPacket()); child.exit();
    assert.deepEqual(r, snapshot); // Late completion cannot upgrade UNKNOWN.
  }
  assert.equal(clear.mock.callCount(), 4); // Both owned timers cleared per run.
  assert.ok(clear.mock.calls.every(call => call.arguments[0] !== undefined));
  const child = new OwnedChild(), controller = new AbortController();
  const pending = runConnectionCheck(environment(), true, {
    forkChild: () => child, signal: controller.signal,
  });
  controller.abort();
  assert.equal((await pending).status, "UNKNOWN");
  assert.equal(child.killedByParent, true);
  released(child, controller.signal);
  assert.equal(clear.mock.callCount(), 6);
  t.mock.timers.tick(5000);
  assert.equal(clear.mock.callCount(), 6); // No surviving deadline callbacks.
});
test("actual isolated hanging Node child is killed and exit acknowledged before owned close", async () => {
  await ownedProcess(["-e", 'process.send("ready"); setInterval(() => {}, 1000)'], {},
    async (child, closed) => {
      // Start supervising only once this isolated idle worker is actually ready.
      // Deadline scheduling is tested above; cancellation has no wall-clock race.
      const readiness = new AbortController();
      void closed.then(() => readiness.abort());
      const [ready] = await once(child, "message", { signal: readiness.signal });
      assert.equal(ready, "ready");
      const controller = new AbortController();
      const pending = runConnectionCheck(environment(), true, {
        forkChild: () => child, signal: controller.signal,
      });
      controller.abort();
      const r = await pending;
      assert.equal(r.status, "UNKNOWN");
      assert.equal(r.childExitAck, true);
      assert.equal(child.signalCode, "SIGKILL");
      released(child, controller.signal);
      await closed;
  });
});
test("exit codes distinguish acknowledged failure from blocked/unknown and basic success", async () => {
  assert.equal(connectionCheckExitCode(await runConnectionCheck({}, true)), 2);
  const packet = await runConnectionProbe(environment(), true, protocol("connect"));
  const child = new OwnedChild();
  const pending = runConnectionCheck(environment(), true, { forkChild: () => child });
  child.emit("message", packet); child.exit(1);
  const r = await pending;
  assert.equal(r.status, "CONNECTION_FAILED");
  assert.equal(connectionCheckExitCode(r), 1);
});
test("offline CLI with empty child ENV reports exactly five missing keys and exits 2", async () => {
  const child = await isolatedCli([
    fileURLToPath(new URL("../oracle-connection-check.mts", import.meta.url)), "--test-connectivity",
  ], {});
  assert.equal(child.status, 2);
  assert.equal(child.stderr, "");
  const result = JSON.parse(child.stdout);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reason, "MISSING_INPUTS");
  assert.deepEqual(result.missing, Object.keys(environment()));
  assert.equal(result.connected, false);
  assert.equal(result.childExitAck, false);
});
test("module load and missing opt-in never resolve the real Oracle driver", async () => {
  const url = new URL("../oracle-connection-check.mts", import.meta.url).href;
  const script = `
    import { registerHooks } from "node:module";
    registerHooks({ resolve(specifier, context, next) {
      if (specifier === "oracledb") throw Error("Real driver resolution forbidden");
      return next(specifier, context);
    } });
    const { runConnectionProbe } = await import(${JSON.stringify(url)});
    const result = await runConnectionProbe(process.env, false);
    if (result.status !== "BLOCKED") process.exitCode = 1;
  `;
  const child = await isolatedCli(["--input-type=module", "-e", script], environment());
  assert.equal(child.status, 0);
  assert.equal(child.stdout, "");
  assert.equal(child.stderr, "");
});
