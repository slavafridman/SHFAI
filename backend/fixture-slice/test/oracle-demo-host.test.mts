import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, writeFile, rm, symlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { env, options, protocolDouble, raw } from "./oracle-demo-test-helper.mts";
import { startOracleDemo, demoEnvironment, parseDemoArguments, loadDemoAssets, attachDemoShutdown, DemoHostError } from "../oracle-demo-host.mts";
import { SliceError } from "../errors.mts";
import { CurrentShiftError } from "../current-shifts-errors.mts";
import { record } from "../contract-validation.mts";
import { loadEnvironmentConfig, RealAuthenticationNotConfiguredError } from "../environment-profiles.mts";

// ISOLATED TEST DOUBLE ONLY. Never real credentials, orgs, records or Oracle connectivity.
const assets = async () => new Map([
  ["/index.html", Buffer.from("<!doctype html><title>Isolated double TEST UI</title>")],
  ["/main.js", Buffer.from("/* isolated TEST asset */")],
]);
const allOptions = { testReadOnly: true, allTestUnits: true as const, port: 0 };
const scopeRows = (count: number) => Array.from({ length: count }, (_, i) => ({
  orgUnitId: `T${String(i).padStart(3, "0")}`, unitType: "J01", parentUnit: "PARENT",
}));
test("safe scope diagnostic serialization boundary rejects malformed or secret-bearing objects", () => {
  const valid = { stage: "discovery" as const, reason: "EMPTY_SCOPE" as const, discoveredCount: 0, validatedCount: 0 };
  const failure = new DemoHostError("DEMO_SCOPE_INVALID", undefined, valid);
  assert.deepEqual(failure.scopeDiagnostic, valid);
  assert.ok(Object.isFrozen(failure.scopeDiagnostic));
  for (const unsafe of [
    { ...valid, row: "SECRET_ROW" }, { ...valid, reason: "SECRET_REASON" }, { ...valid, stage: "SECRET_STAGE" },
    ...[NaN, Infinity, -1, 1001, 0.1, "1", null, true].flatMap(count =>
      [{ ...valid, discoveredCount: count }, { ...valid, validatedCount: count }]),
  ]) {
    const error = new DemoHostError("DEMO_SCOPE_INVALID", { message: "SECRET_SQL_PASSWORD" }, unsafe as typeof valid);
    assert.equal(error.scopeDiagnostic, undefined);
    assert.doesNotMatch(JSON.stringify(error), /SECRET/);
  }
  assert.equal(new DemoHostError("DEMO_SCOPE_TOO_LARGE", undefined, valid).scopeDiagnostic, undefined);
});
for (const point of ["SET TRANSACTION READ ONLY", '"scopeRow"', '"grantCode"']) {
  test(`safe scope diagnostic snapshot source failure at ${point}`, async () => {
    const oracle = protocolDouble(scopeRows(1)), getConnection = oracle.pool.getConnection.bind(oracle.pool);
    oracle.pool.getConnection = async () => {
      const connection = await getConnection(), execute = connection.execute.bind(connection);
      connection.execute = async (sql, binds, bound) => {
        if (sql.includes(point)) throw new SliceError("INVALID_SOURCE_DATA");
        return execute(sql, binds, bound);
      };
      return connection;
    };
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(error instanceof DemoHostError);
      assert.deepEqual(error.scopeDiagnostic, { stage: "snapshot", reason: "UNCLASSIFIED_SOURCE_FAILURE",
        discoveredCount: point === '"grantCode"' ? 1 : 0, validatedCount: 0 });
      return true;
    });
    assert.equal(oracle.closed, 1); assert.equal(oracle.rollbacks, 1); assert.equal(oracle.releases, 1);
  });
}
test("safe scope diagnostic recognizes generic current-shift source codes, not raw database errors", async () => {
  for (const source of [new CurrentShiftError("INVALID_SOURCE_DATA"),
    { code: "ORA-01017", message: "SECRET_DATABASE_SQL_PASSWORD" }]) {
    const oracle = protocolDouble(scopeRows(1));
    oracle.hierarchy = () => { throw source; };
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(error instanceof DemoHostError);
      if (source instanceof CurrentShiftError) {
        assert.equal(error.message, "DEMO_SCOPE_INVALID");
        assert.equal(error.scopeDiagnostic?.stage, "snapshot");
      } else {
        assert.equal(error.message, "DEMO_STARTUP_FAILED");
        assert.equal(error.oracleCode, "ORA-01017"); assert.equal(error.scopeDiagnostic, undefined);
      }
      assert.doesNotMatch(JSON.stringify(error), /SECRET_DATABASE/);
      return true;
    });
    assert.equal(oracle.closed, 1); assert.equal(oracle.releases, 1);
  }
});
for (const crossChunk of [false, true]) {
  test(`safe scope diagnostic hierarchy parent label conflict cross-chunk=${crossChunk}`, async () => {
    const count = crossChunk ? 101 : 2, oracle = protocolDouble(scopeRows(count));
    let queries = 0;
    oracle.hierarchy = rows => {
      queries++;
      return rows.map((row, i) => ({ ...row as object,
        label: (crossChunk ? queries === 2 : i === 1) ? "SECRET_CONFLICT_LABEL" : "First synthetic" }));
    };
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(error instanceof DemoHostError);
      assert.deepEqual(error.scopeDiagnostic, { stage: "hierarchy", reason: "PARENT_LABEL_CONFLICT",
        discoveredCount: count, validatedCount: count - 1 });
      assert.doesNotMatch(JSON.stringify(error), /SECRET_CONFLICT/); return true;
    });
    assert.equal(oracle.closed, 1); assert.equal(oracle.releases, 1);
  });
}
for (const [label, rows, reason, validatedCount] of [
  ["empty", [], "EMPTY_SCOPE", 0],
  ["shape", [{ ORGANIZATIONAL: "SECRET_ROW" }], "INVALID_ROW_SHAPE", 0],
  ["padded code", [{ ...scopeRows(1)[0], orgUnitId: " T000" }], "INVALID_TEAM_CODE", 0],
  ["type", [{ ...scopeRows(1)[0], unitType: "G01" }], "INVALID_TEAM_TYPE", 0],
  ["null parent", [{ ...scopeRows(1)[0], parentUnit: null }], "MISSING_OR_INVALID_PARENT", 0],
  ["padded parent", [{ ...scopeRows(1)[0], parentUnit: " PARENT" }], "MISSING_OR_INVALID_PARENT", 0],
  ["self", [{ ...scopeRows(1)[0], parentUnit: "T000" }], "SELF_PARENT", 0],
  ["duplicate", [...scopeRows(1), ...scopeRows(1)], "DUPLICATE_TEAM", 1],
  ["late page", [...scopeRows(100), { ...scopeRows(101)[100], parentUnit: null }],
    "MISSING_OR_INVALID_PARENT", 100],
  ["whole returned page counted", [...scopeRows(50), { ...scopeRows(100)[50], parentUnit: null },
    ...scopeRows(100).slice(51)], "MISSING_OR_INVALID_PARENT", 50],
  ["last admitted row", [...scopeRows(999), { ...scopeRows(1000)[999], parentUnit: null }],
    "MISSING_OR_INVALID_PARENT", 999],
] as Array<[string, unknown[], string, number]>) {
  test(`safe scope diagnostic discovery ${label}`, async () => {
    const oracle = protocolDouble(rows);
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(record(error));
      assert.equal(error.message, "DEMO_SCOPE_INVALID");
      assert.deepEqual(error.scopeDiagnostic, { stage: "discovery", reason,
        discoveredCount: rows.length, validatedCount });
      assert.doesNotMatch(JSON.stringify(error), /SECRET_ROW|T000|"PARENT"|password|SQL/);
      return true;
    });
    assert.equal(oracle.closed, 1); assert.equal(oracle.rollbacks, 1); assert.equal(oracle.releases, 1);
    assert.equal(oracle.probes, 0);
  });
}
for (const [label, transform, reason, validatedCount] of [
  ["missing", () => [], "HIERARCHY_CARDINALITY", 0],
  ["extra", (rows: unknown[]) => [...rows, ...rows], "HIERARCHY_CARDINALITY", 0],
  ["shape", () => [null], "INVALID_ROW_SHAPE", 0],
  ["wrong aliases", () => [{ ORGANIZATIONAL: "SECRET_ROW" }], "INVALID_ROW_SHAPE", 0],
  ["grant", (rows: unknown[]) => rows.map(row => ({ ...row as object, grantCode: "FOREIGN" })),
    "FOREIGN_OR_MISSING_TEAM", 0],
  ["parent type", (rows: unknown[]) => rows.map(row => ({ ...row as object, unitType: "J01" })), "PARENT_NOT_G01", 0],
  ["team type", (rows: unknown[]) => rows.map(row => ({ ...row as object, teamType: "G01" })), "INVALID_TEAM_TYPE", 0],
  ["null label", (rows: unknown[]) => rows.map(row => ({ ...row as object, teamLabel: null })), "TEAM_LABEL_INVALID", 0],
  ["empty label", (rows: unknown[]) => rows.map(row => ({ ...row as object, teamLabel: "" })), "TEAM_LABEL_INVALID", 0],
  ["unsafe label", (rows: unknown[]) => rows.map(row => ({ ...row as object, teamLabel: "<SECRET_LABEL>" })),
    "TEAM_LABEL_INVALID", 0],
  ["parent label", (rows: unknown[]) => rows.map(row => ({ ...row as object, label: null })), "PARENT_LABEL_INVALID", 0],
  ["parent missing", (rows: unknown[]) => rows.map(row => ({ ...row as object, code: null })), "MISSING_OR_INVALID_PARENT", 0],
  ["parent changed", (rows: unknown[]) => rows.map(row => ({ ...row as object, code: "OTHER" })), "PARENT_CHANGED", 0],
] as Array<[string, (rows: unknown[]) => unknown[], string, number]>) {
  test(`safe scope diagnostic hierarchy ${label}`, async () => {
    const oracle = protocolDouble(scopeRows(1)); oracle.hierarchy = transform;
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(record(error));
      assert.deepEqual(error.scopeDiagnostic, { stage: "hierarchy", reason, discoveredCount: 1, validatedCount });
      assert.doesNotMatch(JSON.stringify(error), /SECRET_LABEL|T000|"PARENT"|password|SQL/);
      return true;
    });
    assert.equal(oracle.closed, 1); assert.equal(oracle.releases, 1); assert.equal(oracle.probes, 0);
  });
}
for (const count of [1, 50, 51, 100, 101, 1000]) {
  test(`all TEST units discovers complete ${count} grants in one bounded snapshot and reuses one pool`, async () => {
    const rows = scopeRows(count), oracle = protocolDouble(rows);
    let factories = 0;
    const demo = await startOracleDemo(env, allOptions, { assets, read: async () => { factories++; return oracle.pool; } });
    try {
      assert.equal(factories, 1);
      const discovery = oracle.statements.filter(s => s.sql.includes('"scopeRow"'));
      assert.deepEqual(discovery.map(s => [record(s.binds) && s.binds.lowerBound,
        record(s.binds) && s.binds.upperBound, s.bound]),
      Array.from({ length: Math.floor(count / 100) + 1 }, (_, i) =>
        [i * 100, i * 100 + (i === 10 ? 1 : 100), i === 10 ? 1 : 100]));
      assert.ok(discovery.every(s => s.lease === 1 && s.timeout <= 5000 && s.timeout > 0 &&
        s.sql.includes("ORDER BY t.org_unit_id,t.parent_unit") && s.sql.includes("ORDER BY \"scopeRow\"")));
      const hierarchy = oracle.statements.find(s => s.sql.includes('"grantCode"'));
      assert.equal(hierarchy?.lease, 1);
      const discoveryHierarchy = oracle.statements.filter(s => s.lease === 1 && s.sql.includes('"grantCode"'));
      assert.equal(discoveryHierarchy.length, Math.ceil(count / 100));
      assert.deepEqual(discoveryHierarchy.flatMap(s => Object.entries(s.binds)
        .filter(([key]) => /^team\d+$/.test(key)).map(([, id]) => id)), rows.map(row => row.orgUnitId));
      assert.equal(oracle.statements[0].sql, "SET TRANSACTION READ ONLY");
      const identity = await (await fetch(demo.url + "/api/v1/identity")).json();
      assert.ok(record(identity) && record(identity.principal) && record(identity.principal.resourceScope));
      assert.deepEqual(identity.principal.resourceScope.orgUnitIds, rows.map(row => row.orgUnitId));
      assert.deepEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read",
        "my-shifts:read", "shift-items:read", "employee:read", "attendance:read"]);
      const status = await (await fetch(demo.url + "/demo-status")).json();
      assert.ok(record(status));
      assert.equal(status.scope, "all-test-units"); assert.equal(status.authorizedUnitCount, count);
      for (const flag of ["targetIdentityVerified", "nativeWritesAuthorized", "releaseReady"]) assert.equal(status[flag], false);
      assert.equal(status.syntheticAuthentication, true); assert.equal(status.dataSource, "oracle-read-only");
      assert.doesNotMatch(JSON.stringify(status), /T000|PARENT|Synthetic team/);
      for (const [path, expected] of [
        ["/api/v1/current-shifts/filter-context", 200], ["/api/v1/shift-search/filter-context", 200],
        ["/api/v1/attendance/filter-context", 200], ["/api/v1/employees/1/shift-days/1", 404],
        ["/api/v1/employees/1/operational-card", 404],
        ["/api/v1/employees/1/shift-days/1/breaks-and-exceptions?limit=10&offset=0&sort=start-asc", 404],
        ["/api/v1/my-shifts/context?mode=selected&employeeId=1", 403],
        ["/api/v1/current-shifts?mode=at&atLocal=bad&teamCode=OTHER", 400],
        ["/api/v1/current-shifts?mode=at&attendanceDate=2024-03-01&currentTime=00:00&mokedCode=OTHER", 403],
        ["/api/v1/current-shifts?mode=at&attendanceDate=2024-03-01&currentTime=00:00&limit=101", 400],
      ] as const) assert.equal((await raw(demo.url, path)).status, expected, path);
      for (const statement of oracle.statements.filter(s => s.sql.includes('"grantCode"'))) {
        assert.ok(record(statement.binds));
        const boundIds = Object.entries(statement.binds).filter(([key]) => /^team\d+$/.test(key)).map(([, id]) => id);
        assert.ok(boundIds.length <= 100 && statement.bound === boundIds.length + 1);
        assert.ok(boundIds.every(id => rows.some(row => row.orgUnitId === id)));
      }
      assert.ok(oracle.statements.every(s => s.sql === "SET TRANSACTION READ ONLY" || /^\s*SELECT\b/i.test(s.sql)));
    } finally { await demo.stop(); }
    assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.rollbacks); assert.equal(oracle.leases, oracle.releases);
  });
}
for (const [label, rows, code] of [
  ["empty", [], "DEMO_SCOPE_INVALID"], ["overflow", scopeRows(1001), "DEMO_SCOPE_TOO_LARGE"],
  ["duplicate", [scopeRows(1)[0], scopeRows(1)[0]], "DEMO_SCOPE_INVALID"],
  ["cross-page duplicate", [...scopeRows(100), scopeRows(1)[0]], "DEMO_SCOPE_INVALID"],
  ["late-page malformed", [...scopeRows(999), { ...scopeRows(1000)[999], parentUnit: null }], "DEMO_SCOPE_INVALID"],
  ["discovery/hierarchy parent mismatch", [{ ...scopeRows(1)[0], parentUnit: "OTHER" }], "DEMO_SCOPE_INVALID"],
  ...["", " T001", "T001 ", "*", "A,B", "null", "-1", "123456789"].map(orgUnitId =>
    [`unsafe code ${JSON.stringify(orgUnitId)}`, [{ ...scopeRows(1)[0], orgUnitId }], "DEMO_SCOPE_INVALID"]),
  ...[null, "", "T000", "*", 12].map(parentUnit =>
    [`invalid parent ${JSON.stringify(parentUnit)}`, [{ ...scopeRows(1)[0], parentUnit }], "DEMO_SCOPE_INVALID"]),
  ["wrong class", [{ ...scopeRows(1)[0], unitType: "G01" }], "DEMO_SCOPE_INVALID"],
  ["wrong alias", [{ ORGUNITID: "T000", unitType: "J01", parentUnit: "PARENT" }], "DEMO_SCOPE_INVALID"],
] as Array<[string, unknown[], string]>) {
  test(`all scope rejects ${label} with no partial runtime`, async () => {
    const oracle = protocolDouble(rows);
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), error => {
      assert.ok(error instanceof DemoHostError);
      assert.equal(error.message, code);
      if (code === "DEMO_SCOPE_TOO_LARGE") assert.equal(error.scopeDiagnostic, undefined);
      return true;
    });
    assert.equal(oracle.probes, 0); assert.equal(oracle.closed, 1);
    assert.equal(oracle.leases, 1); assert.equal(oracle.rollbacks, 1); assert.equal(oracle.releases, 1);
  });
}
for (const [label, transform] of [
  ["missing", () => []],
  ["duplicate", (rows: unknown[]) => [...rows, ...rows]],
  ...["unitType", "teamType", "teamLabel", "label", "code", "teamCode"].map(key =>
    [key, (rows: unknown[]) => rows.map(row => ({ ...(record(row) ? row : {}), [key]: null }))]),
] as Array<[string, (rows: unknown[]) => unknown[]]>) {
  test(`all scope validates existing hierarchy ${label} inside discovery transaction`, async () => {
    const oracle = protocolDouble(scopeRows(1)); oracle.hierarchy = transform;
    await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), /DEMO_SCOPE_INVALID/);
    assert.equal(oracle.probes, 0); assert.equal(oracle.closed, 1); assert.equal(oracle.releases, 1);
  });
}
test("all mode cannot manufacture config before discovery; exact CLI grammar only", () => {
  assert.throws(() => demoEnvironment(env, allOptions), /DEMO_SCOPE_PENDING/);
  assert.deepEqual(parseDemoArguments(["--test-read-only", "--all-test-units"]),
    { testReadOnly: true, allTestUnits: true, port: 18083 });
  assert.deepEqual(parseDemoArguments(["--test-read-only", "--all-test-units", "--port", "18084"]),
    { testReadOnly: true, allTestUnits: true, port: 18084 });
  for (const args of [["--all-test-units"], ["--test-read-only", "--all-test-units", "--org-unit", "T001"],
    ["--test-read-only", "--all-test-units", "--all-test-units"],
    ["--test-read-only", "--all-test-units", "--port", "-1"],
    ["--test-read-only", "--org-unit", "T001", "--all-test-units"]]) assert.throws(() => parseDemoArguments(args));
});
test("all mode requires opt-in and rejects mixed runtime scope before any IO", async () => {
  let calls = 0;
  for (const unsafe of [{ ...allOptions, testReadOnly: false }, { ...allOptions, orgUnitId: "T001" }]) {
    // Deliberately adversarial JS input, not a new permitted options shape.
    await assert.rejects(startOracleDemo(env, unsafe as typeof allOptions,
      { assets: async () => { calls++; return assets(); }, read: async () => { calls++; return protocolDouble().pool; } }),
    /DEMO_CONFIGURATION_REJECTED/);
  }
  assert.equal(calls, 0);
});
test("all mode startup probe failure after transfer closes only once", async () => {
  const oracle = protocolDouble(scopeRows(1)); oracle.badProbe = true;
  await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }), /DEMO_STARTUP_FAILED/);
  assert.equal(oracle.closed, 1); assert.equal(oracle.releases, 2);
});
test("all mode assets and occupied port reject before pool acquisition", async () => {
  let calls = 0;
  await assert.rejects(startOracleDemo(env, allOptions, { assets: async () => { throw Error("synthetic assets"); },
    read: async () => { calls++; return protocolDouble().pool; } }));
  const occupant = createServer();
  await new Promise<void>(done => occupant.listen(0, "127.0.0.1", done));
  const address = occupant.address(); assert.ok(address && typeof address !== "string");
  try {
    await assert.rejects(startOracleDemo(env, { ...allOptions, port: address.port },
      { assets, read: async () => { calls++; return protocolDouble().pool; } }), /DEMO_PORT_UNAVAILABLE/);
  } finally { await new Promise<void>(done => occupant.close(() => done())); }
  assert.equal(calls, 0);
});
for (const phase of ["pool", "lease", "discovery"] as const) {
  test(`all mode abort waits for pending ${phase} before pool close`, async () => {
    const oracle = protocolDouble(scopeRows(1)), controller = new AbortController();
    let release!: () => void, reached!: () => void;
    const gate = new Promise<void>(done => { release = done; });
    const active = new Promise<void>(done => { reached = done; });
    const wait = async () => { reached(); await gate; };
    if (phase === "discovery") oracle.waitDiscovery = wait;
    if (phase === "lease") {
      const original = oracle.pool.getConnection;
      oracle.pool.getConnection = async () => { await wait(); return original(); };
    }
    test("all discovery pages share the unchanged cumulative 5s budget and drain timed-out native work", async () => {
      const oracle = protocolDouble(scopeRows(101));
      let pages = 0, release!: () => void, reached!: () => void;
      const gate = new Promise<void>(done => { release = done; });
      const active = new Promise<void>(done => { reached = done; });
      oracle.waitDiscovery = async () => {
        if (++pages === 1) await sleep(2600);
        else { reached(); await gate; }
      };
      const rejected = assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }),
        /DEMO_STARTUP_FAILED/);
      await active;
      const discovery = oracle.statements.filter(s => s.sql.includes('"scopeRow"'));
      assert.equal(discovery.length, 2); assert.ok(discovery[1].timeout < 2500);
      await sleep(2600);
      assert.equal(oracle.breaks, 1); assert.equal(oracle.closed, 0); assert.equal(oracle.releases, 0);
      release(); await rejected;
      assert.equal(oracle.closed, 1); assert.equal(oracle.rollbacks, 1); assert.equal(oracle.releases, 1);
    });
    test("all discovery Oracle failure preserves only safe diagnostic code and closes host-owned pool", async () => {
      const oracle = protocolDouble(scopeRows(1)); oracle.fail = true;
      await assert.rejects(startOracleDemo(env, allOptions, { assets, read: async () => oracle.pool }),
        error => record(error) && error.oracleCode === "ORA-01017" &&
          !JSON.stringify(error).includes("private-host"));
      assert.equal(oracle.closed, 1); assert.equal(oracle.probes, 0); assert.equal(oracle.releases, 1);
    });
    const startup = startOracleDemo(env, allOptions, { assets, signal: controller.signal,
      read: async () => { if (phase === "pool") await wait(); return oracle.pool; } });
    const rejected = assert.rejects(startup);
    await active; controller.abort(); await sleep(20);
    assert.equal(oracle.closed, 0); assert.equal(oracle.releases, 0);
    if (phase === "discovery") assert.equal(oracle.breaks, 1);
    release(); await rejected;
    assert.equal(oracle.closed, 1); assert.equal(oracle.leases, oracle.releases);
  });
}
async function launch() {
  const oracle = protocolDouble();
  let factories = 0;
  const demo = await startOracleDemo(env, options, { assets, read: async () => { factories++; return oracle.pool; } });
  return { oracle, demo, get factories() { return factories; } };
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
  { SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: "{}" },
]) {
  for (const scope of [options, allOptions]) test(`demo ${scope === options ? "single" : "all"} rejects unsafe/missing source ${Object.keys(change)[0]} before factories/listeners`, async () => {
    let calls = 0;
    await assert.rejects(startOracleDemo({ ...env, ...change }, scope, {
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
