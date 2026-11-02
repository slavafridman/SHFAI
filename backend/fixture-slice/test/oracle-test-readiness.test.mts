import { test } from "node:test";
import assert from "node:assert/strict";
import { ChildProcess, fork, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { OracleConnection, OraclePool } from "../oracle-session.mts";
import { isReadinessSummary, runReadinessCli, runOracleTestReadiness } from "../oracle-test-readiness.mts";
import { validateRuntimeConfig } from "../runtime-config.mts";
import { shiftManagementMode } from "../shift-management-config.mts";

test("IPC guard rejects extra fields, secrets and invalid finite/count/ACK projections", async () => {
  const base = await runOracleTestReadiness({});
  assert.equal(isReadinessSummary(base), true);
  for (const bad of [
    { ...base, token: "UNIT_SECRET" }, { ...base, codes: ["UNIT_SECRET"] },
    { ...base, oracleCode: "ORA-12345 UNIT_SECRET" }, { ...base, queries: NaN },
    { ...base, queries: 9 }, { ...base, poolAttempts: -1 },
    { ...base, connectionAttempts: 2 }, { ...base, metadataRows: 5 },
    { ...base, rollbackAck: "true" }, { ...base, presence: { ...base.presence, token: false } },
    { ...base, presence: {} }, { ...base, missing: ["NODE_ENV"] },
    { ...base, unknown: ["UNIT_SECRET"] }, { ...base, status: "PASS" },
    { ...base, status: "UNIT_SECRET" }, { ...base, codes: [] },
    { ...base, version: "unit-secret" }, { ...base, unknown: [...base.unknown, "CROSS_OWNER_TRIGGERS"] },
    { ...base, missing: [...base.missing, base.missing[0]] },
    { ...base, codes: ["MISSING_CONFIG", "MISSING_CONFIG"] },
    { ...base, queries: Infinity }, { ...base, queries: 0.5 },
    { ...base, oracleCode: undefined }, { ...base, poolDrainAck: true },
    { ...base, connectionAttempts: 1 }, { ...base, metadataPass: true },
    { ...base, missing: ["UNIT_SECRET"] }, { ...base, presence: { ...base.presence, NODE_ENV: 1 } },
  ]) assert.equal(isReadinessSummary(bad), false);
  assert.equal(isReadinessSummary({ ...base, oracleCode: "ORA-12345" }), true);
});

// Owned isolated fork double: kill delivery and actual exit are separate facts.
class OwnedChild extends ChildProcess {
  hasExited = false;
  killRequested = false;
  delayExit = false;
  failKill = false;
  constructor() { super(); Object.defineProperty(this, "pid", { value: 123, configurable: true }); }
  override kill(): boolean {
    this.killRequested = true;
    this.emit("kill-request");
    if (this.failKill) return false;
    if (!this.delayExit) queueMicrotask(() => this.ackExit());
    return true;
  }
  ackExit() {
    this.hasExited = true;
    Object.defineProperty(this, "exitCode", { value: 2 });
    this.emit("exit", 2, null);
  }
}
test("CLI empty configuration is pure parent preflight with no child or timer", async t => {
  let forks = 0;
  t.mock.method(globalThis, "setTimeout", () => { throw Error("preflight must not schedule IO"); });
  const expected = await runOracleTestReadiness({});
  const result = await runReadinessCli({}, { forkChild: () => {
    forks++; throw Error("preflight must not fork");
  } });
  assert.equal(forks, 0);
  assert.deepEqual(result, { ...expected, childExitAck: true });
  assert.deepEqual(result.codes, ["MISSING_CONFIG"]);
  assert.equal(isReadinessSummary(expected), true);
  assert.equal(result.rollbackAck || result.leaseCloseAck || result.poolDrainAck, false);
});
test("CLI rejects invalid owned IPC without printing payload and observes exit", async () => {
  const child = new OwnedChild();
  const pending = runReadinessCli(environment(), { forkChild: () => {
    queueMicrotask(() => child.emit("message", { kind: "complete", summary: { token: "UNIT_SECRET" } }));
    return child;
  } });
  const result = await pending;
  assert.equal(child.hasExited, true);
  assert.equal(result.childExitAck, true);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.codes.includes("CLI_INVALID_SUMMARY"));
  assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
});
test("CLI complete waits for delayed exit ACK rather than a kill request", async () => {
  const p = protocol(), summary = await runOracleTestReadiness(environment(), p.deps);
  const child = new OwnedChild(); child.delayExit = true;
  let returned = false;
  const pending = runReadinessCli(environment(), { forkChild: () => {
    queueMicrotask(() => child.emit("message", { kind: "complete", summary }));
    return child;
  } }).then(r => { returned = true; return r; });
  await new Promise<void>(r => setImmediate(r));
  assert.equal(child.killRequested, true);
  assert.equal(child.hasExited, false);
  assert.equal(returned, false);
  child.ackExit();
  const result = await pending;
  assert.equal(child.hasExited, true);
  assert.equal(result.childExitAck, true);
  assert.equal(result.status, "PASS");
  assert.equal(isReadinessSummary(summary), true);
  for (const bad of [
    { ...summary, poolDrainAck: false }, { ...summary, rollbackAck: false },
    { ...summary, leaseCloseAck: false }, { ...summary, identityPass: false },
    { ...summary, codes: ["MISSING_CONFIG"] }, { ...summary, metadataRows: 0 },
    { ...summary, oracleCode: "ORA-12345" },
  ]) assert.equal(isReadinessSummary(bad), false);
});
test("actual owned fork complete/exit has exited before CLI returns", async () => {
  let hasExited = false;
  // Valid parent preflight selects supervision; this owned test child alone
  // receives empty inputs, so its IPC/exit is exercised without DNS/native IO.
  const result = await runReadinessCli(environment(), { forkChild: () => {
    const child = fork(fileURLToPath(new URL("../oracle-test-readiness.mts", import.meta.url)), [], {
      env: {}, execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    child.once("exit", () => { hasExited = true; });
    return child;
  } });
  assert.equal(hasExited, true);
  assert.equal(result.childExitAck, true);
  assert.deepEqual(result.codes, ["MISSING_CONFIG"]);
  assert.equal(result.missing.length, 8);
  assert.ok(Object.values(result.presence).every(v => v === false));
  assert.equal(result.poolAttempts + result.connectionAttempts + result.queries, 0);
});
test("CLI cancellation waits for actual owned exit with no retry", async () => {
  const child = new OwnedChild(); child.delayExit = true;
  const controller = new AbortController();
  let forks = 0, returned = false;
  const requested = new Promise<void>(r => child.once("kill-request", r));
  const pending = runReadinessCli(environment(), { signal: controller.signal, forkChild: () => {
    forks++; queueMicrotask(() => controller.abort()); return child;
  } }).then(r => { returned = true; return r; });
  await requested;
  assert.equal(returned, false);
  assert.equal(child.hasExited, false);
  child.ackExit();
  const result = await pending;
  assert.equal(child.hasExited, true);
  assert.equal(result.childExitAck, true);
  assert.ok(result.codes.includes("CLI_CANCELLED_UNACKNOWLEDGED"));
  assert.equal(forks, 1);
});
test("CLI timeout never treats kill delivery as termination ACK", async () => {
  const child = new OwnedChild(); child.delayExit = true;
  const start = performance.now();
  const result = await runReadinessCli(environment(), { budgetMs: 60, forkChild: () => child });
  assert.ok(performance.now() - start < 500);
  assert.equal(child.hasExited, false);
  assert.equal(result.childExitAck, false);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.codes.includes("CLI_EXIT_UNACKNOWLEDGED"));
  assert.ok(result.codes.includes("CLI_DEADLINE_UNACKNOWLEDGED"));
  child.ackExit(); // isolated double only; not evidence of native cancellation
});
test("CLI complete does not reset the original absolute exit deadline", async () => {
  const p = protocol(), summary = await runOracleTestReadiness(environment(), p.deps);
  const child = new OwnedChild(); child.delayExit = true;
  let faultTimer: ReturnType<typeof setTimeout> | undefined;
  const start = performance.now();
  const result = await runReadinessCli(environment(), { budgetMs: 90, forkChild: () => {
    // Fault-controlled completion arrives during the original budget; the
    // child then deliberately withholds exit. There is no new five-second wait.
    faultTimer = setTimeout(() => child.emit("message", { kind: "complete", summary }), 25);
    return child;
  } });
  if (faultTimer) clearTimeout(faultTimer);
  assert.ok(performance.now() - start < 500);
  assert.equal(child.hasExited, false);
  assert.equal(result.childExitAck, false);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.codes.includes("CLI_EXIT_UNACKNOWLEDGED"));
  assert.ok(!result.codes.includes("READ_ONLY_CHECK_PASSED_NOT_RELEASE"));
  child.ackExit();
});
test("CLI kill failure cannot PASS, even if exit is subsequently observed", async () => {
  const p = protocol(), summary = await runOracleTestReadiness(environment(), p.deps);
  const child = new OwnedChild(); child.failKill = true;
  const requested = new Promise<void>(r => child.once("kill-request", r));
  const pending = runReadinessCli(environment(), { forkChild: () => {
    queueMicrotask(() => child.emit("message", { kind: "complete", summary })); return child;
  } });
  await requested;
  child.ackExit();
  const result = await pending;
  assert.equal(child.hasExited, true);
  assert.equal(result.childExitAck, true);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.codes.includes("CLI_EXIT_UNACKNOWLEDGED"));
});
test("CLI already-exited child needs no kill or extra timer", async () => {
  const child = new OwnedChild(); child.ackExit();
  const result = await runReadinessCli(environment(), { forkChild: () => child });
  assert.equal(child.hasExited, true);
  assert.equal(child.killRequested, false);
  assert.equal(result.childExitAck, true);
  assert.equal(result.status, "BLOCKED"); // no complete IPC
});
test("CLI complete with already-observed exit state never kills an exited child", async () => {
  const summary = await runOracleTestReadiness({});
  const child = new OwnedChild(); child.failKill = true;
  const result = await runReadinessCli(environment(), { forkChild: () => {
    queueMicrotask(() => {
      Object.defineProperty(child, "exitCode", { value: 2 });
      child.emit("message", { kind: "complete", summary });
      child.emit("exit", 2, null);
      child.emit("close", 2, null);
    });
    return child;
  } });
  assert.equal(child.killRequested, false);
  assert.deepEqual(result, { ...summary, childExitAck: true });
});
test("CLI complete waits for close ACK when exit event is not delivered", async () => {
  const summary = await runOracleTestReadiness({});
  const child = new OwnedChild(); child.delayExit = true;
  const requested = new Promise<void>(r => child.once("kill-request", r));
  let returned = false;
  const pending = runReadinessCli(environment(), { forkChild: () => {
    queueMicrotask(() => child.emit("message", { kind: "complete", summary }));
    return child;
  } }).then(r => { returned = true; return r; });
  await requested;
  assert.equal(returned, false);
  child.emit("close", 2, null);
  assert.deepEqual(await pending, { ...summary, childExitAck: true });
});
for (const mode of ["throw", "missing-pid", "error"] as const)
  test(`CLI spawn failure ${mode} is sanitized and does not wait for an impossible exit`, async () => {
    const start = performance.now();
    const result = await runReadinessCli(environment(), { forkChild: () => {
      if (mode === "throw") throw Error("UNIT_SECRET");
      const child = new OwnedChild();
      Object.defineProperty(child, "pid", { value: undefined });
      if (mode === "error") queueMicrotask(() => child.emit("error", Error("UNIT_SECRET")));
      return child;
    } });
    assert.ok(performance.now() - start < 500);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.childExitAck, false);
    assert.ok(result.codes.includes("DEPENDENCY_OR_CONFIG_UNAVAILABLE"));
    assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
  });
test("CLI rejects extra IPC envelope fields and unknown kinds explicitly", async () => {
  const summary = await runOracleTestReadiness({});
  for (const value of [
    { kind: "complete", summary, token: "UNIT_SECRET" }, { kind: "UNIT_SECRET", summary },
    { kind: "progress", summary: { ...summary, codes: ["UNIT_SECRET"] } }, null,
  ]) {
    const child = new OwnedChild();
    const result = await runReadinessCli(environment(), { forkChild: () => {
      queueMicrotask(() => child.emit("message", value)); return child;
    } });
    assert.equal(child.hasExited, true);
    assert.equal(result.childExitAck, true);
    assert.equal(result.status, "BLOCKED");
    assert.ok(result.codes.includes("CLI_INVALID_SUMMARY"));
    assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
  }
});

test("missing process configuration blocks before any pool or query", async () => {
  let factories = 0;
  const result = await runOracleTestReadiness({}, {
    createPool: async () => { factories++; throw Error("must not connect"); },
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(factories, 0);
  assert.equal(result.poolAttempts, 0);
  assert.equal(result.connectionAttempts, 0);
  assert.equal(result.queries, 0);
  assert.deepEqual(result.codes, ["MISSING_CONFIG"]);
  assert.equal(result.missing.length, 8);
  assert.ok(Object.values(result.presence).every(v => v === false));
  assert.equal(result.presence.SHF_ORACLE_PASSWORD, false);
});

  // ISOLATED protocol fixtures: reserved addresses, invented DB/instance/service,
  // fake password/client path and operator references. No network/filesystem IO.
  function packet() {
    const endpointProof = {
      kind: "configured-address-sets", revision: "unit-revision",
      connectionAliases: ["CTIDBT_WFMT"],
      endpoint: { kind: "dns", name: "unit-endpoint.invalid", addresses: ["192.0.2.1"] },
      serverHosts: [{ kind: "dns", name: "unit-server.invalid", addresses: ["192.0.2.1"] }],
    };
    return {
      version: "oracle-test-readiness-v1", purpose: "metadata-review", environment: "test",
      independentOperatorPinned: true, frozenIdentityReference: "unit-frozen",
      runtimeAliasBindingReference: "unit-alias-binding", runtimeAlias: "CTIDBT_WFMT",
      windowStart: new Date(Date.now() - 10000).toISOString(),
      windowEnd: new Date(Date.now() + 60000).toISOString(),
      readIdentity: { database: "UNIT_DB", user: "SHIFTER", schema: "SHIFTER",
        target: { kind: "sid", instanceSid: "UNIT_SID", endpointProof } },
      endpointProof, serviceName: "UNIT_SERVICE",
    };
  }
  function environment(): NodeJS.ProcessEnv {
    return {
      SHF_APP_ENV: "test", NODE_ENV: "test",
      SHF_ORACLE_CONFIG: JSON.stringify({
        deploymentClass: "isolated-test-demo", dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
        authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
        syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC",
        attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
        attendanceStationExitMode: "disabled", shiftManagementMode: "disabled",
      }),
      SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SHIFTER",
      SHF_ORACLE_PASSWORD: "UNIT_SECRET_NEVER_PRINT", SHF_ORACLE_CLIENT_LIB_DIR: "C:\\unit-only-client",
      TNS_ADMIN: "C:\\unit-only-tns",
      SHF_ORACLE_READINESS_PROOF: JSON.stringify(packet()), SHF_ORACLE_READINESS_METADATA: "M26",
    };
  }
  function protocol() {
    const log: string[] = [], drops: boolean[] = [], timeouts: number[] = [], resolutions: string[] = [];
    const identity = { database: "UNIT_DB", host: "unit-server.invalid", service: "UNIT_SERVICE",
      instance: "UNIT_SID", user: "SHIFTER", schema: "SHIFTER" };
    const columns = [
      { tableName: "SHF_ATTENDANCE", columnName: "STATION_EXIT_TIME", dataType: "DATE",
        dataLength: 7, charUsed: null, nullable: "Y", virtualColumn: "NO" },
      { tableName: "SHF_ATTENDANCE", columnName: "STATION_EXIT_USER", dataType: "VARCHAR2",
        dataLength: 64, charUsed: "B", nullable: "Y", virtualColumn: "NO" },
    ];
    const charset = [{ parameter: "NLS_CHARACTERSET", value: "UNIT_CHARSET" },
      { parameter: "NLS_NCHAR_CHARACTERSET", value: "UNIT_NCHARSET" }];
    const connection: OracleConnection = {
      set callTimeout(n: number) { timeouts.push(n); }, get callTimeout() { return timeouts.at(-1) ?? 0; },
      async execute(sql, binds) {
        if (sql === "SET TRANSACTION READ ONLY") { log.push("readOnly"); return []; }
        if (sql.includes("SYS_CONTEXT")) { log.push("identity"); return [identity]; }
        if (sql.includes("user_tab_cols")) {
          log.push("columns");
          assert.deepEqual(binds, { exitTime: "STATION_EXIT_TIME", exitUser: "STATION_EXIT_USER" });
          assert.ok(sql.includes("hidden_column='NO'"));
          assert.ok(!/\bDBA_|NEXTVAL|FOR UPDATE|COMMIT|UPDATE\s|INSERT\s|DELETE\s/i.test(sql));
          return columns;
        }
        if (sql.includes("nls_database_parameters")) { log.push("charset"); return charset; }
        throw Error("unapproved query");
      },
      async break() { log.push("break"); },
      async rollback() { log.push("rollback"); },
      async close(drop) { log.push("close"); drops.push(drop ?? false); },
    };
    const pool: OraclePool = {
      async getConnection() { log.push("acquire"); return connection; },
      async close() { log.push("drain"); },
    };
    return { log, drops, timeouts, identity, columns, charset, connection, pool, resolutions,
      deps: {
        async createPool() { log.push("factory"); return pool; },
        async resolveEndpoint(name: string, signal: AbortSignal) {
          signal.throwIfAborted(); resolutions.push(name); return ["192.0.2.1"];
        },
      },
    };
  }
  // Startup tuple from nativeRuntimeFixture, without its native authority,
  // filesystem or operational inputs. The independent read proof stays synthetic.
  function managementConfiguration() {
    return {
      deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
      syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"],
      dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
      businessTimeZone: "UTC", shiftManagement: { mode: "test-oracle-controlled" },
    };
  }
  test("valid nested native management: denied before endpoint resolution, pools and queries", async () => {
    const env = environment(), p = protocol();
    env.SHF_ORACLE_CONFIG = JSON.stringify(managementConfiguration());
    const config = validateRuntimeConfig(JSON.parse(env.SHF_ORACLE_CONFIG));
    assert.equal(config.dataSource, "oracle-read-only");
    assert.equal(shiftManagementMode(config), "test-oracle-controlled");
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(result.codes, ["INVALID_READ_PROFILE"]);
    assert.deepEqual(p.resolutions, []);
    assert.deepEqual(p.log, []);
    assert.equal(result.poolAttempts + result.connectionAttempts + result.queries, 0);
  });
  for (const [name, configuration] of [
    ["explicit nested disabled", { ...managementConfiguration(), shiftManagement: { mode: "disabled" } }],
    ["omitted default disabled", (() => {
      const { shiftManagement, ...configuration } = managementConfiguration();
      return configuration;
    })()],
  ] as const) test(`valid management ${name}: accepted with independent synthetic read proof`, async () => {
    const env = environment(), p = protocol();
    env.SHF_ORACLE_CONFIG = JSON.stringify(configuration);
    const config = validateRuntimeConfig(JSON.parse(env.SHF_ORACLE_CONFIG));
    assert.equal(config.dataSource, "oracle-read-only");
    assert.equal(shiftManagementMode(config), "disabled");
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "PASS");
    assert.deepEqual(result.codes, ["READ_ONLY_CHECK_PASSED_NOT_RELEASE"]);
    assert.equal(result.poolAttempts, 1);
    assert.equal(result.connectionAttempts, 1);
    assert.equal(result.queries, 4);
    assert.deepEqual(p.resolutions, ["unit-endpoint.invalid", "unit-server.invalid"]);
    assert.deepEqual(p.log, ["factory", "acquire", "readOnly", "identity", "columns", "charset", "rollback", "close", "drain"]);
  });
  for (const key of [
    "attendanceStageArrivalMode", "attendanceStationArrivalMode", "attendanceStationArrivalLateMode",
    "attendanceStationExitMode", "attendanceStationExitCancellationMode", "shiftManagementMode",
  ]) test(`existing native mode ${key}: still blocked before endpoint resolution and pools`, async () => {
    const env = environment(), p = protocol();
    const { shiftManagement, ...configuration } = managementConfiguration();
    env.SHF_ORACLE_CONFIG = JSON.stringify({ ...configuration, [key]: "test-oracle-controlled" });
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(p.resolutions, []);
    assert.deepEqual(p.log, []);
    assert.equal(result.poolAttempts + result.connectionAttempts + result.queries, 0);
  });
  for (const key of [
    "SHF_TEST_ORACLE_STAGE_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_WRITE_ENABLED",
    "SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED", "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED",
    "SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED", "SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED",
  ]) test(`existing writer flag ${key}: key presence still blocks before endpoint resolution and pools`, async () => {
    const env = environment(), p = protocol();
    env[key] = "false"; // Even false is a stray native key in this independent tool.
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(result.codes, ["STRAY_CONFIG"]);
    assert.deepEqual(p.resolutions, []);
    assert.deepEqual(p.log, []);
    assert.equal(result.poolAttempts + result.connectionAttempts + result.queries, 0);
  });
  test("full injected handler: pinned identity, READ ONLY, two metadata queries, rollback and drain", async () => {
    const p = protocol(), result = await runOracleTestReadiness(environment(), p.deps);
    assert.deepEqual(result.codes, ["READ_ONLY_CHECK_PASSED_NOT_RELEASE"]);
    assert.equal(result.status, "PASS");
    assert.equal(result.queries, 4);
    assert.equal(result.connectionAttempts, 1);
    assert.equal(result.identityPass, true);
    assert.equal(result.metadataPass, true);
    assert.equal(result.metadataRows, 4);
    assert.equal(result.rollbackAck && result.leaseCloseAck && result.poolDrainAck, true);
    assert.deepEqual(p.log, ["factory", "acquire", "readOnly", "identity", "columns", "charset", "rollback", "close", "drain"]);
    assert.deepEqual(p.drops, [false]);
    assert.ok(p.timeouts.every(n => n > 0 && n <= 5000));
    assert.deepEqual(p.resolutions, ["unit-endpoint.invalid", "unit-server.invalid"]);
    for (const forbidden of ["UNIT_SECRET", "UNIT_DB", "UNIT_SID", "UNIT_SERVICE", "unit-server", "unit-only-client",
      "unit-frozen", "unit-alias-binding", "UNIT_CHARSET", "SELECT "])
      assert.ok(!JSON.stringify(result).includes(forbidden));
    assert.ok(result.unknown.includes("CROSS_OWNER_TRIGGERS"));
    assert.ok(result.unknown.includes("ROLE_PUBLIC_PRIVILEGES"));
  });
  test("metadata is opt-in: identity-only check has two statements", async () => {
    const env = environment(), p = protocol();
    delete env.SHF_ORACLE_READINESS_METADATA;
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "PASS");
    assert.equal(result.queries, 2);
    assert.equal(result.metadataPass, false);
    assert.ok(!p.log.includes("columns"));
  });
  const preflightCases: [string, (env: NodeJS.ProcessEnv) => void][] = [
    ["production", e => { e.NODE_ENV = "production"; }],
    ["invalid application environment", e => { e.SHF_APP_ENV = "development"; }],
    ["disabled read configuration", e => {
      const c = JSON.parse(e.SHF_ORACLE_CONFIG!); c.dataSource = "isolated-fixture";
      delete c.oracleTestScopeConfirmed; e.SHF_ORACLE_CONFIG = JSON.stringify(c);
    }],
    ["missing independent proof", e => { delete e.SHF_ORACLE_READINESS_PROOF; }],
    ["not independent", e => { const p = packet(); p.independentOperatorPinned = false; e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["same proof references", e => { const p = packet(); p.runtimeAliasBindingReference = p.frozenIdentityReference; e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["expired proof", e => { const p = packet(); p.windowEnd = new Date(Date.now() - 1000).toISOString(); e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["future window", e => { const p = packet(); p.windowStart = new Date(Date.now() + 10000).toISOString(); e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["wrong proof purpose", e => { const p = { ...packet(), purpose: "business-command" }; e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["unknown TNS alias", e => { e.SHF_ORACLE_CONNECT_STRING = "UNKNOWN_ALIAS"; }],
    ["runtime alias not exact", e => { e.SHF_ORACLE_CONNECT_STRING = "ctidbt_wfmt"; }],
    ["wrong owner identity", e => { const p = packet(); p.readIdentity.schema = "UNIT_OTHER"; e.SHF_ORACLE_READINESS_PROOF = JSON.stringify(p); }],
    ["unknown readiness key", e => { e.SHF_ORACLE_READINESS_SQL = "UNIT_SECRET"; }],
    ["stray native binding key (value never parsed)", e => { e.SHF_NATIVE_EXIT_CANCELLATION_BINDING = "UNIT_SECRET"; }],
    ["stray writer flag", e => { e.SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED = "true"; }],
    ["bad JSON", e => { e.SHF_ORACLE_READINESS_PROOF = "UNIT_SECRET"; }],
    ["duplicate proof JSON", e => { e.SHF_ORACLE_READINESS_PROOF = '{"purpose":"metadata-review","purpose":"metadata-review"}'; }],
    ["unsupported metadata scope", e => { e.SHF_ORACLE_READINESS_METADATA = "ALL"; }],
    ["missing client path", e => { delete e.SHF_ORACLE_CLIENT_LIB_DIR; }],
    ["missing explicit runtime TNS directory", e => { delete e.TNS_ADMIN; }],
    ["UNC runtime TNS directory", e => { e.TNS_ADMIN = "\\\\unit.invalid\\tns"; }],
    ["UNC client path", e => { e.SHF_ORACLE_CLIENT_LIB_DIR = "\\\\unit.invalid\\client"; }],
    ["real auth configuration error never becomes Administrator", e => {
      const c = JSON.parse(e.SHF_ORACLE_CONFIG!); c.authenticationMode = "real";
      e.SHF_ORACLE_CONFIG = JSON.stringify(c);
    }],
  ];
  for (const [name, change] of preflightCases) test(`${name}: zero pools, zero queries`, async () => {
    const env = environment(), p = protocol(); change(env);
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.poolAttempts, 0);
    assert.equal(result.connectionAttempts, 0);
    assert.equal(result.queries, 0);
    assert.deepEqual(p.log, []);
    assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
    let forks = 0;
    const cli = await runReadinessCli(env, { forkChild: () => {
      forks++; throw Error("invalid configuration must not fork");
    } });
    assert.equal(forks, 0);
    assert.deepEqual(cli, { ...result, childExitAck: true });
    assert.equal(cli.rollbackAck || cli.leaseCloseAck || cli.poolDrainAck, false);
    assert.deepEqual(p.resolutions, []);
  });
  test("DNS address drift blocks before pool, never learns aliases from database", async () => {
    const p = protocol();
    const result = await runOracleTestReadiness(environment(), {
      ...p.deps, resolveEndpoint: async () => ["192.0.2.2"],
    });
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(result.codes, ["ENDPOINT_PROOF_MISMATCH"]);
    assert.deepEqual(p.log, []);
  });
  for (const key of ["database", "host", "service", "instance", "user", "schema"] as const)
    test(`live identity ${key} drift: no metadata, rollback, drop, drain`, async () => {
      const p = protocol(); p.identity[key] = "UNIT_DRIFT";
      const result = await runOracleTestReadiness(environment(), p.deps);
      assert.equal(result.status, "BLOCKED");
      assert.deepEqual(result.codes, ["IDENTITY_MISMATCH"]);
      assert.equal(result.queries, 2);
      assert.equal(result.identityPass, false);
      assert.deepEqual(p.log.slice(-3), ["rollback", "close", "drain"]);
      assert.deepEqual(p.drops, [true]);
      assert.ok(!p.log.includes("columns"));
    });
  test("nullable business-column prerequisite remains enforced", async () => {
    const p = protocol(); p.columns[1].nullable = "N";
    const result = await runOracleTestReadiness(environment(), p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.metadataPass, false);
    assert.deepEqual(result.codes, ["METADATA_MISMATCH"]);
    assert.equal(result.rollbackAck, true);
    assert.deepEqual(p.drops, [true]);
  });
  test("raw dependency errors redact messages, stack, SQL, tokens and fake diagnostic fields", async () => {
    const p = protocol();
    p.connection.execute = async () => {
      throw Object.assign(Error("UNIT_SECRET SELECT * FROM unit_table"), {
        code: "ORA-01017", readinessCode: "UNIT_SECRET", connectString: "UNIT_SECRET",
      });
    };
    const result = await runOracleTestReadiness(environment(), p.deps);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.oracleCode, "ORA-01017");
    assert.deepEqual(result.codes, ["DEPENDENCY_OR_CONFIG_UNAVAILABLE"]);
    assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
    assert.equal(result.rollbackAck && result.leaseCloseAck && result.poolDrainAck, true);
  });
  test("factory failure is dependency-unavailable, not an auth or synthetic fallback", async () => {
    const p = protocol();
    const result = await runOracleTestReadiness(environment(), {
      ...p.deps, createPool: async () => { throw Error("UNIT_SECRET"); },
    });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.poolAttempts, 1);
    assert.equal(result.connectionAttempts, 0);
    assert.equal(result.queries, 0);
    assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
  });
  test("already cancelled signal blocks before resolving or constructing pools", async () => {
    const p = protocol(), c = new AbortController(); c.abort();
    const result = await runOracleTestReadiness(environment(), { ...p.deps, signal: c.signal });
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(p.log, []);
    assert.deepEqual(p.resolutions, []);
  });
  test("duration cancellation breaks active operation before rollback/drop/drain", async () => {
    const p = protocol();
    let release: (() => void) | undefined;
    const original = p.connection.execute;
    p.connection.execute = async (sql, binds, maxRows) => {
      if (sql.includes("SYS_CONTEXT")) {
        p.log.push("waiting"); await new Promise<void>(r => { release = r; }); return [p.identity];
      }
      return original(sql, binds, maxRows);
    };
    p.connection.break = async () => { p.log.push("break"); release?.(); };
    const start = performance.now();
    const result = await runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 90 });
    assert.ok(performance.now() - start < 500);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.queries, 2);
    assert.deepEqual(p.log.slice(-4), ["break", "rollback", "close", "drain"]);
    assert.equal(result.rollbackAck && result.leaseCloseAck && result.poolDrainAck, true);
  });
  test("pool acquisition deadline: no query, late lease dropped, no retry", async t => {
    const p = protocol();
    // Date-only timer mocks do not control the production monotonic deadline.
    // Move both scheduling and performance.now explicitly; do not rely on the
    // OS scheduling cleanup inside a real 20ms reserve under the full runner.
    let now = performance.now();
    t.mock.method(performance, "now", () => now);
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let acquired: (() => void) | undefined, dropped: (() => void) | undefined;
    const acquiring = new Promise<void>(r => { acquired = r; });
    const closed = new Promise<void>(r => { dropped = r; });
    let release: ((c: OracleConnection) => void) | undefined;
    p.pool.getConnection = () => new Promise<OracleConnection>(r => {
      p.log.push("acquire"); release = r; acquired?.();
    });
    const close = p.connection.close;
    p.connection.close = async drop => { await close(drop); dropped?.(); };
    const pending = runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 60 });
    await acquiring;
    now += 40; t.mock.timers.tick(40);
    const result = await pending;
    assert.equal(result.status, "BLOCKED");
    assert.ok(result.codes.includes("DEADLINE_EXCEEDED"));
    assert.equal(result.poolAttempts, 1);
    assert.equal(result.connectionAttempts, 1);
    assert.equal(result.queries, 0);
    assert.equal(result.poolDrainAck, true);
    assert.deepEqual(p.log, ["factory", "acquire", "drain"]);
    release?.(p.connection);
    await closed;
    assert.deepEqual(p.drops, [true]);
    assert.deepEqual(p.log, ["factory", "acquire", "drain", "close"]);
    assert.equal(result.leaseCloseAck, false); // Late disposal is not an in-budget ACK.
    assert.equal(result.status, "BLOCKED");
    t.diagnostic("acquisition work deadline=40ms; drain ACK at monotonic 40ms; late lease drop observed");
  });
  test("pool acquisition total deadline exhausted: no fake drain ACK and late lease still dropped", async t => {
    const p = protocol();
    let now = performance.now();
    t.mock.method(performance, "now", () => now);
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let acquired: (() => void) | undefined, dropped: (() => void) | undefined;
    const acquiring = new Promise<void>(r => { acquired = r; });
    const closed = new Promise<void>(r => { dropped = r; });
    let release: ((c: OracleConnection) => void) | undefined;
    p.pool.getConnection = () => new Promise<OracleConnection>(r => {
      p.log.push("acquire"); release = r; acquired?.();
    });
    const close = p.connection.close;
    p.connection.close = async drop => { await close(drop); dropped?.(); };
    const pending = runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 60 });
    await acquiring;
    now += 60; t.mock.timers.tick(60);
    const result = await pending;
    assert.equal(result.status, "BLOCKED");
    assert.ok(result.codes.includes("DEADLINE_EXCEEDED"));
    assert.ok(result.codes.includes("POOL_DRAIN_UNACKNOWLEDGED"));
    assert.equal(result.poolAttempts, 1); assert.equal(result.connectionAttempts, 1);
    assert.equal(result.queries, 0);
    assert.equal(result.poolDrainAck, false);
    assert.equal(result.rollbackAck, false); assert.equal(result.leaseCloseAck, false);
    assert.deepEqual(p.log, ["factory", "acquire"]);
    release?.(p.connection); await closed;
    assert.deepEqual(p.drops, [true]);
    assert.deepEqual(p.log, ["factory", "acquire", "close"]);
    assert.equal(result.status, "BLOCKED"); assert.equal(result.poolDrainAck, false);
    t.diagnostic("acquisition resumed at total monotonic deadline=60ms; no drain ACK; late lease drop observed");
  });
  test("drain deadline reports unknown ACK, never PASS", async () => {
    const p = protocol();
    p.pool.close = () => new Promise<void>(() => {});
    const start = performance.now();
    const result = await runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 60 });
    assert.equal(result.status, "BLOCKED");
    assert.ok(performance.now() - start < 500);
    assert.equal(result.rollbackAck && result.leaseCloseAck, true);
    assert.equal(result.poolDrainAck, false);
    assert.ok(result.codes.includes("POOL_DRAIN_UNACKNOWLEDGED"));
  });
  test("unacknowledged rollback never releases a busy lease", async () => {
    const p = protocol();
    p.connection.rollback = () => new Promise<void>(() => {});
    const result = await runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 60 });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.rollbackAck, false);
    assert.equal(result.leaseCloseAck, false);
    assert.ok(!p.log.includes("close"));
  });
  test("actual CLI with empty ENV reports BLOCKED and zero actual connection/query attempts", () => {
    const child = spawnSync(process.execPath, [new URL("../oracle-test-readiness.mts", import.meta.url).pathname
      .replace(/^\/([A-Za-z]:)/, "$1")], { env: {}, encoding: "utf8", timeout: 5000 });
    assert.equal(child.status, 2);
    assert.equal(child.stderr, "");
    const result = JSON.parse(child.stdout);
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.poolAttempts, 0);
    assert.equal(result.connectionAttempts, 0);
    assert.equal(result.queries, 0);
    assert.equal(result.childExitAck, true);
    assert.deepEqual(result.codes, ["MISSING_CONFIG"]);
    assert.equal(result.missing.length, 8);
    assert.ok(Object.values(result.presence).every(v => v === false));
  });

for (const strategy of ["legacy", "service-reference"] as const)
  test(`original frozen ${strategy} identity is supported without autolearning`, async () => {
    const p = protocol(), env = environment(), v = packet();
    const identity = strategy === "legacy"
      ? { database: "UNIT_DB", user: "SHIFTER", schema: "SHIFTER",
        host: "unit-server.invalid", service: "UNIT_SERVICE" }
      : { database: "UNIT_DB", user: "SHIFTER", schema: "SHIFTER",
        target: { kind: "service-reference", host: "unit-server.invalid", serviceName: "UNIT_SERVICE" } };
    env.SHF_ORACLE_READINESS_PROOF = JSON.stringify({ ...v, readIdentity: identity });
    const result = await runOracleTestReadiness(env, p.deps);
    assert.equal(result.status, "PASS");
    assert.equal(result.queries, 4);
    assert.equal(result.identityPass, true);
  });
test("malformed/missing metadata never certifies the selected columns", async () => {
  const p = protocol(); p.columns.pop();
  const result = await runOracleTestReadiness(environment(), p.deps);
  assert.equal(result.status, "BLOCKED");
  assert.deepEqual(result.codes, ["METADATA_INCOMPLETE"]);
  assert.equal(result.metadataPass, false);
  assert.equal(result.rollbackAck, true);
});
test("unacknowledged native break does not release a busy connection", async () => {
  const p = protocol(), original = p.connection.execute;
  p.connection.execute = async (sql, binds, maxRows) => sql.includes("SYS_CONTEXT")
    ? new Promise<unknown[]>(() => {}) : original(sql, binds, maxRows);
  p.connection.break = async () => { p.log.push("break"); throw Error("UNIT_SECRET"); };
  const result = await runOracleTestReadiness(environment(), { ...p.deps, budgetMs: 60 });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.leaseCloseAck, false);
  assert.equal(result.rollbackAck, false);
  assert.ok(!p.log.includes("close"));
  assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
});
test("external cancellation during an active query propagates break and cleanup", async () => {
  const p = protocol(), controller = new AbortController(), original = p.connection.execute;
  let release: (() => void) | undefined;
  p.connection.execute = async (sql, binds, maxRows) => {
    if (!sql.includes("SYS_CONTEXT")) return original(sql, binds, maxRows);
    const wait = new Promise<void>(r => { release = r; });
    controller.abort();
    await wait;
    return [p.identity];
  };
  p.connection.break = async () => { p.log.push("break"); release?.(); };
  const result = await runOracleTestReadiness(environment(), { ...p.deps, signal: controller.signal });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.identityPass, false);
  assert.equal(result.rollbackAck && result.leaseCloseAck && result.poolDrainAck, true);
  assert.deepEqual(p.log.slice(-4), ["break", "rollback", "close", "drain"]);
});
test("late pool factory resolves only to drain, never connection acquisition", async () => {
  const p = protocol();
  let release: ((p: OraclePool) => void) | undefined;
  const result = await runOracleTestReadiness(environment(), {
    ...p.deps, budgetMs: 60, createPool: () => new Promise<OraclePool>(r => { release = r; }),
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.connectionAttempts, 0);
  assert.equal(result.queries, 0);
  release?.(p.pool);
  await new Promise(r => setImmediate(r));
  assert.deepEqual(p.log, ["drain"]);
});
for (const resource of ["pool", "lease"] as const)
  for (const outcome of ["resolve", "reject"] as const)
    test(`late ${resource} close ${outcome} records sanitized unacknowledged cleanup progress`, async () => {
      const p = protocol();
      let releasePool: ((pool: OraclePool) => void) | undefined;
      let releaseLease: ((lease: OracleConnection) => void) | undefined;
      let settleClose: (() => void) | undefined, rejectClose: ((error: Error) => void) | undefined;
      const close = () => new Promise<void>((resolve, reject) => {
        settleClose = resolve; rejectClose = reject;
      });
      if (resource === "pool") p.pool.close = close;
      else { p.pool.getConnection = () => new Promise(r => { releaseLease = r; }); p.connection.close = close; }
      const code = resource === "pool" ? "POOL_DRAIN_UNACKNOWLEDGED" : "LEASE_CLOSE_UNACKNOWLEDGED";
      let late = false, notices = 0, observed: (() => void) | undefined;
      const updates = new Promise<void>(r => { observed = r; });
      const result = await runOracleTestReadiness(environment(), {
        ...p.deps, budgetMs: 60,
        ...(resource === "pool" ? { createPool: () => new Promise<OraclePool>(r => { releasePool = r; }) } : {}),
        onProgress: summary => {
          if (late && summary.codes.includes(code)) {
            assert.equal(summary.status, "BLOCKED");
            assert.equal(resource === "pool" ? summary.poolDrainAck : summary.leaseCloseAck, false);
            if (++notices === 2) observed?.();
          }
        },
      });
      assert.equal(result.status, "BLOCKED");
      late = true;
      releasePool?.(p.pool); releaseLease?.(p.connection);
      await new Promise<void>(r => setImmediate(r));
      assert.equal(notices, 1); // recorded before the still-pending late close
      if (outcome === "resolve") settleClose?.();
      else rejectClose?.(Error("UNIT_SECRET_RAW_CLOSE"));
      await updates;
      assert.equal(result.status, "BLOCKED");
      assert.ok(result.codes.includes(code));
      assert.ok(!JSON.stringify(result).includes("UNIT_SECRET"));
      assert.equal(result.queries, 0);
    });
test("endpoint resolver deadline blocks before any pool", async () => {
  const p = protocol(), start = performance.now();
  const result = await runOracleTestReadiness(environment(), {
    ...p.deps, budgetMs: 60, resolveEndpoint: () => new Promise<readonly string[]>(() => {}),
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.poolAttempts, 0);
  assert.ok(performance.now() - start < 500);
  assert.deepEqual(p.log, []);
});
