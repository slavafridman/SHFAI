import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { request } from "node:http";
import type { OutgoingHttpHeaders, Server } from "node:http";
import { createConnection } from "node:net";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { createStationArrivalFixture } from "../station-arrival-fixture.mts";
import { MemoryStageArrivalStore } from "../stage-arrival-memory.mts";
import { record } from "../contract-validation.mts";
import type { StationArrivalFixtureEnvelopeV1 } from "../station-arrival-contracts.mts";
import { SliceError } from "../errors.mts";
import { VirtualClock } from "./stage-arrival-helpers.mts";
import { backendLifecycle } from "../backend-lifecycle.mts";

const base = "/api/v1/employees/9001/shift-days/6201/station-arrival";
const stage = base.replace("/station-arrival", "/stage-arrival");
const config = { ...sampleStageArrivalConfig, attendanceStationArrivalMode: "isolated-fixture" };
function envelope(): StationArrivalFixtureEnvelopeV1 {
  return { stageRows: [structuredClone(sampleStageArrivalFacts)], stationFacts: [{
    ...sampleStageArrivalFacts.selection, revision: "station-original", stationArrivalUser: null,
    stationExitUser: null, stationLate: null, flagPresent: false, locked: false,
    fullDayExceptionPresent: false, overlappingShiftPresent: false, policyRevision: "station-policy",
  }] };
}
function environment(): NodeJS.ProcessEnv {
  return { SHF_FIXTURE_CONFIG: JSON.stringify(config), SHF_FIXTURE_PORT: "0",
    SHF_STATION_ARRIVAL_FIXTURE: JSON.stringify(envelope()) };
}
async function serve(work: (url: string) => Promise<void>, env = environment()) {
  const server = await startFromEnvironment(env, new VirtualClock());
  try {
    const address = server.address(); assert.ok(address && typeof address !== "string");
    await work(`http://127.0.0.1:${address.port}`);
  } finally { await stopBackendServer(server); }
}
async function rejected(env: NodeJS.ProcessEnv) {
  let unexpected: Server | undefined;
  try { await assert.rejects(async () => { unexpected = await startFromEnvironment(env, new VirtualClock()); }); }
  finally { if (unexpected) await stopBackendServer(unexpected); }
}
function raw(url: string, method = "GET", payload: string | Buffer = "", headers: OutgoingHttpHeaders | string[] = {}) {
  return new Promise<{ status: number; headers: OutgoingHttpHeaders; body: unknown }>((resolve, reject) => {
    // Preserve a literal trailing '?' (the URL overload normalizes it away).
    const target = new URL(url);
    const req = request({ hostname: target.hostname, port: target.port,
      path: url.slice(target.origin.length), method, headers }, res => {
      const parts: Buffer[] = [];
      res.on("data", part => parts.push(Buffer.from(part)));
      res.on("end", () => {
        try { resolve({ status: res.statusCode!, headers: res.headers,
          body: JSON.parse(Buffer.concat(parts).toString()) }); } catch (e) { reject(e); }
      });
    });
    req.once("error", reject); req.end(payload);
  });
}
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
for (const feature of ["station-arrival", "stage-arrival"] as const) {
  for (const configured of [false, true]) {
    for (const malformedOrigin of ["", " \t "]) {
      test(`F2-QA-01 actual joint startup ${feature} ${configured ? "configured" : "missing"} allowlist rejects ${JSON.stringify(malformedOrigin)}`, async t => {
        const observed: MemoryStageArrivalStore[] = [], original = MemoryStageArrivalStore.prototype.readStation;
        t.mock.method(MemoryStageArrivalStore.prototype, "readStation",
          function(this: MemoryStageArrivalStore, ...args: Parameters<typeof original>) {
            observed.push(this); return original.apply(this, args);
          });
        const origin = "http://localhost:4522", env = environment();
        if (configured) {
          env.SHF_STATION_ARRIVAL_ORIGINS = JSON.stringify([origin]);
          env.SHF_STAGE_ARRIVAL_ORIGINS = JSON.stringify([origin]);
        }
        const server = await startFromEnvironment(env, new VirtualClock());
        const receivedOrigins: string[] = [];
        server.prependListener("request", req => {
          if (req.headers.origin !== undefined) receivedOrigins.push(req.headers.origin);
        });
        try {
          const address = server.address(); assert.ok(address && typeof address !== "string");
          const url = `http://127.0.0.1:${address.port}`;
          // A legitimate Origin-absent preparation obtains the bootstrap-owned
          // store; neither feature may write merely because malformed Origin
          // was normalized by the actual Node parser to the empty string.
          await prepared(url);
          const store = observed[0]; assert.ok(store);
          const endpoint = feature === "station-arrival" ? base : stage;
          const draft = feature === "station-arrival" ? { lateReasonCode: null } :
            { lateReasonCode: null, lateRemark: null };
          const validation = await raw(url + endpoint + "/validations", "POST", JSON.stringify(draft), jsonHeaders);
          assert.equal(validation.status, 200); assert.ok(record(validation.body));
          const command = { commandId: randomUUID(), draft, validationToken: validation.body.validationToken,
            fingerprint: validation.body.fingerprint, confirmation: null };
          const before = store.inspectSnapshot();
          for (const [suffix, method, payload] of [
            ["context", "GET", ""], ["validations", "POST", JSON.stringify(draft)],
            ["commands", "POST", JSON.stringify(command)],
          ]) {
            const result = await raw(url + endpoint + "/" + suffix, method, payload,
              { ...jsonHeaders, Origin: malformedOrigin });
            assert.equal(receivedOrigins.at(-1), ""); // Node trims actual wire OWS.
            assert.equal(result.status, 403, suffix); assert.ok(record(result.body));
            assert.equal(result.body.code, "FORBIDDEN"); assert.equal(result.body.effect, "none");
            assert.equal(result.headers["access-control-allow-origin"], undefined);
            assert.deepEqual(store.inspectSnapshot(), before); // business/receipt/audit/active zero delta
          }
          const denied = await raw(url + endpoint + "/context", "GET", "", { Origin: "http://localhost:4599" });
          assert.equal(denied.status, 403);
          assert.deepEqual(store.inspectSnapshot(), before);
          assert.equal((await raw(url + endpoint + "/context")).status, 200);
          if (configured)
            assert.equal((await raw(url + endpoint + "/context", "GET", "", { Origin: origin })).status, 200);
          const success = await raw(url + endpoint + "/commands", "POST", JSON.stringify(command),
            configured ? { ...jsonHeaders, Origin: origin } : jsonHeaders);
          assert.equal(success.status, 200);
          // Missing Origin remains legal even with a configured allowlist.
          const replay = await raw(url + endpoint + "/commands", "POST", JSON.stringify(command), jsonHeaders);
          assert.equal(replay.status, 200); assert.ok(record(replay.body)); assert.equal(replay.body.replayed, true);
        } finally { await stopBackendServer(server); }
      });
    }
  }
}
async function prepared(url: string, headers: OutgoingHttpHeaders = {}) {
  const r = await raw(url + base + "/validations", "POST", '{"lateReasonCode":null}', { ...jsonHeaders, ...headers });
  assert.equal(r.status, 200); assert.ok(record(r.body));
  assert.equal(typeof r.body.validationToken, "string"); assert.equal(typeof r.body.fingerprint, "string");
  return { commandId: randomUUID(), draft: { lateReasonCode: null }, validationToken: r.body.validationToken,
    fingerprint: r.body.fingerprint, confirmation: null };
}

test("F2 actual bootstrap: exact11, pure preparations, station-only success, replay and coherent reads", async t => {
  const observed: MemoryStageArrivalStore[] = [], original = MemoryStageArrivalStore.prototype.readStation;
  t.mock.method(MemoryStageArrivalStore.prototype, "readStation",
    function(this: MemoryStageArrivalStore, ...args: Parameters<typeof original>) {
      observed.push(this); return original.apply(this, args);
    });
  await serve(async url => {
    const identity = await raw(url + "/api/v1/identity");
    assert.ok(record(identity.body) && record(identity.body.principal));
    assert.ok(Array.isArray(identity.body.principal.capabilities));
    assert.equal(identity.body.principal.employeeId, null);
    assert.equal(identity.body.principal.capabilities.length, 11);
    const context = await raw(url + base + "/context");
    assert.equal(context.status, 200); assert.ok(record(context.body));
    assert.equal(context.body.eligibility, "eligible"); assert.equal(context.body.withinArrivalWindow, true);
    assert.equal(context.headers["cache-control"], "no-store");
    assert.equal(context.headers["x-content-type-options"], "nosniff");
    const store = observed[0]; assert.ok(store);
    const before = store.inspectSnapshot(), cmd = await prepared(url);
    assert.deepEqual(store.inspectSnapshot(), before);
    const result = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), jsonHeaders);
    assert.equal(result.status, 200); assert.ok(record(result.body) && record(result.body.recorded));
    assert.equal(result.body.recorded.stageArrivalLocal, null);
    assert.equal(result.body.recorded.stationExitLocal, null);
    assert.equal(result.body.partnerCompletion, "not-invoked");
    const after = store.inspectSnapshot();
    assert.deepEqual([after.receipts, after.audits, after.stationReceipts, after.stationAudits], [0, 0, 1, 1]);
    const replay = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), jsonHeaders);
    assert.equal(replay.status, 200); assert.ok(record(replay.body)); assert.equal(replay.body.replayed, true);
    assert.deepEqual(store.inspectSnapshot(), after);
    const detail = await raw(url + "/api/v1/employees/9001/shift-days/6201");
    assert.equal(detail.status, 200);
    assert.ok(JSON.stringify(detail.body).includes(after.rows[0].attendance!.stationArrivalLocal!));
    const f1 = await raw(url + stage + "/validations", "POST", '{"lateReasonCode":null,"lateRemark":null}', jsonHeaders);
    assert.equal(f1.status, 409); assert.ok(record(f1.body)); assert.equal(f1.body.code, "COMMAND_SCOPE_DEFERRED");
  });
});

test("F2 actual bootstrap wires independent normalized Origin allowlists and Chrome metadata", async () => {
  const origin = "http://localhost:4522", f1origin = "http://localhost:4521";
  await serve(async url => {
    const browserHeaders = { Origin: origin, "sec-ch-ua": '"Chromium";v="141"',
      "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"Windows"' };
    const allowed = await raw(url + base + "/context", "GET", "", browserHeaders);
    assert.equal(allowed.status, 200); assert.equal(allowed.headers["access-control-allow-origin"], origin);
    assert.equal(allowed.headers["access-control-allow-credentials"], undefined);
    const cmd = await prepared(url, browserHeaders);
    const denied = await raw(url + base + "/commands", "POST", JSON.stringify(cmd),
      { ...jsonHeaders, Origin: f1origin });
    assert.equal(denied.status, 403); assert.ok(record(denied.body));
    assert.equal(denied.body.effect, "none");
    const committed = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), { ...jsonHeaders, ...browserHeaders });
    assert.equal(committed.status, 200);
    assert.equal((await raw(url + stage + "/context", "GET", "", { Origin: origin })).status, 403);
    assert.equal((await raw(url + stage + "/context", "GET", "", { Origin: f1origin })).status, 200);
  }, { ...environment(), SHF_STATION_ARRIVAL_ORIGINS: JSON.stringify([origin]),
    SHF_STAGE_ARRIVAL_ORIGINS: JSON.stringify([f1origin]) });
});

const invalidRequests = [
  { name: "bare query", path: "/context?", method: "GET", body: "", status: 400 },
  { name: "query", path: "/context?x=1", method: "GET", body: "", status: 400 },
  { name: "wrong method", path: "/context", method: "POST", body: "", status: 405 },
  { name: "GET body", path: "/context", method: "GET", body: "{}", status: 400, headers: { "Content-Length": "2" } },
  { name: "duplicate JSON", path: "/validations", method: "POST", body: '{"lateReasonCode":null,"lateReasonCode":null}', status: 400 },
  { name: "escaped duplicate JSON", path: "/validations", method: "POST", body: '{"lateReasonCode":null,"lateReason\\u0043ode":null}', status: 400 },
  { name: "unknown key", path: "/validations", method: "POST", body: '{"lateReasonCode":null,"lateRemark":null}', status: 400 },
  { name: "coercion", path: "/validations", method: "POST", body: '{"lateReasonCode":1}', status: 400 },
  { name: "media", path: "/validations", method: "POST", body: "{}", status: 415, headers: { "Content-Type": "text/plain" } },
  { name: "compression", path: "/validations", method: "POST", body: "{}", status: 415, headers: { "Content-Encoding": "gzip" } },
  { name: "too large", path: "/validations", method: "POST", body: " ".repeat(8193), status: 413 },
  { name: "wrong origin", path: "/context", method: "GET", body: "", status: 403, headers: { Origin: "http://localhost:4522" } },
  { name: "unknown header", path: "/context", method: "GET", body: "", status: 400, headers: { "X-Actor": "Administrator" } },
];
for (const c of invalidRequests) {
  test(`F2 HTTP ${c.name} rejected without effects`, async () => {
    await serve(async url => {
      const r = await raw(url + base + c.path, c.method, c.body, { ...jsonHeaders, ...c.headers });
      assert.equal(r.status, c.status); assert.ok(record(r.body)); assert.equal(r.body.effect, "none");
      assert.equal(r.headers["cache-control"], "no-store");
      if (c.status === 405) assert.equal(r.headers.allow, "GET");
      assert.equal((await prepared(url)).confirmation, null);
    });
  });
}
test("F2 malformed UTF8 and duplicate headers rejected", async () => {
  await serve(async url => {
    const utf = await raw(url + base + "/validations", "POST", Buffer.from([0xc3, 0x28]), jsonHeaders);
    assert.equal(utf.status, 400);
    const duplicate = await raw(url + base + "/context", "GET", "", ["Host", "localhost", "Accept", "application/json", "Accept", "*/*"]);
    assert.equal(duplicate.status, 400);
  });
});
test("F2 Node parser header overflow returns canonical sanitized problem", async () => {
  await serve(async url => {
    const u = new URL(url);
    const result = await new Promise<string>((resolve, reject) => {
      const socket = createConnection({ host: u.hostname, port: Number(u.port) });
      const chunks: Buffer[] = [];
      socket.once("connect", () => socket.end(`GET ${base}/context HTTP/1.1\r\nHost: localhost\r\nAccept: ${"a".repeat(33000)}\r\n\r\n`));
      socket.on("data", part => chunks.push(part));
      socket.once("end", () => resolve(Buffer.concat(chunks).toString()));
      socket.once("error", reject);
    });
    assert.match(result, /413/); assert.match(result, /REQUEST_TOO_LARGE/);
    assert.match(result, /application\/problem\+json/);
  });
});

for (const origins of [
  ["*"], ["https://example.invalid"], ["http://localhost:4522/"], ["http://user@localhost:4522"],
  ["http://localhost:4522", "http://localhost:4522"], Array.from({ length: 11 }, (_, i) => `http://localhost:${4520 + i}`),
]) {
  test(`F2 startup rejects invalid origins ${JSON.stringify(origins).slice(0, 70)}`, async () => {
    await rejected({ ...environment(), SHF_STATION_ARRIVAL_ORIGINS: JSON.stringify(origins) });
  });
}
test("F2 startup rejects absent/mixed fixtures, invalid source/mode/production before pools", async () => {
  const env = environment();
  for (const invalid of [
    { ...env, SHF_STATION_ARRIVAL_FIXTURE: undefined },
    { ...env, SHF_STAGE_ARRIVAL_FIXTURE: "[]" },
    { ...env, SHF_FIXTURE_ROWS: "[]" },
    { ...env, SHF_CURRENT_SHIFTS_FIXTURE: "{}" },
    { ...env, SHF_STATION_ARRIVAL_FIXTURE: '{"stageRows":[],"stationFacts":[]}' },
    { ...env, SHF_STATION_ARRIVAL_ORIGINS: "null" },
    { ...env, SHF_STATION_ARRIVAL_ORIGINS: " ".repeat(4097) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...config, attendanceStageArrivalMode: "disabled" }) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...config, dataSource: "oracle-read-only" }) },
    { ...env, NODE_ENV: "production" },
    { ...env, SHF_APP_ENV: "unknown" },
  ]) await rejected(invalid);
  let pools = 0;
  await assert.rejects(startFromEnvironment({ SHF_ORACLE_CONFIG: JSON.stringify({ ...config,
    dataSource: "oracle-read-only", oracleTestScopeConfirmed: true }), SHF_ORACLE_PORT: "0" }, new VirtualClock(), {
    read: async () => { pools++; throw Error("must not connect"); },
    native: async () => { pools++; throw Error("must not connect"); },
  }));
  assert.equal(pools, 0);
});

test("F2 disabled routes fail403 without context/UoW, no synthetic fallback on auth failure", async () => {
  const { attendanceStageArrivalMode: _, ...disabled } = sampleStageArrivalConfig;
  const rt = await createRuntime(disabled, new FixtureReader([]));
  const server = createLoopbackServer(rt); server.listen(0, "127.0.0.1"); await once(server, "listening");
  try {
    const a = server.address(); assert.ok(a && typeof a !== "string");
    for (const [path, method, payload] of [["context", "GET", ""], ["validations", "POST", '{"lateReasonCode":null}']] as const) {
      const r = await raw(`http://127.0.0.1:${a.port}` + base + "/" + path, method, payload, jsonHeaders);
      assert.equal(r.status, 403); assert.ok(record(r.body)); assert.equal(r.body.code, "LIVE_WRITES_DISABLED");
    }
    assert.throws(() => rt.stationArrivalCommit({}, {}, {}), { code: "LIVE_WRITES_DISABLED" });
  } finally { await stopBackendServer(server); }
  const real = { ...disabled, authenticationMode: "real", syntheticAdministratorEnabled: false,
    syntheticOrgUnitIds: undefined, realProviderId: "isolated-failing-provider" };
  await assert.rejects(createRuntime(real, new FixtureReader([])));
  for (const error of [new Error("provider failure"), new SliceError("UNAUTHENTICATED")]) {
    const failed = await createRuntime(real, new FixtureReader([]), async () => ({ authenticate: async () => { throw error; } }));
    await assert.rejects(failed.authenticate({ authorization: null }), { code: error instanceof SliceError ? "UNAUTHENTICATED" : "DEPENDENCY_UNAVAILABLE" });
  }
});

test("F2 malformed/wrong-source/lost command result is UNKNOWN, never fabricated success", async () => {
  const clock = new VirtualClock(), f = createStationArrivalFixture(envelope(), clock, "Asia/Jerusalem");
  const rt = await createRuntime(config, f.detail, undefined, { reader: f.current, attendanceReader: f.attendance,
    stageArrivalStore: f.store, clock });
  let retained: Awaited<ReturnType<typeof prepared>> | undefined;
  for (const mode of ["malformed", "wrong-source", "lost"] as const) {
    const broken: SliceRuntime = { ...rt, stationArrivalCommit: async (...args) => {
      if (mode === "lost") throw Error("isolated response loss");
      const receipt = await rt.stationArrivalCommit(...args);
      assert.equal(receipt.dataSource, "isolated-fixture");
      if (receipt.dataSource !== "isolated-fixture") throw Error("Fixture test source mismatch");
      if (mode === "malformed") return { ...receipt, recorded: { ...receipt.recorded, stationArrivalLocal: "invalid" } };
      // Deliberately isolated malformed adapter, not an actual native provider.
      return Object.assign(receipt, { dataSource: "oracle" });
    } };
    const server = createLoopbackServer(broken); server.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
      const a = server.address(); assert.ok(a && typeof a !== "string");
      const url = `http://127.0.0.1:${a.port}`;
      // Replay the same retained command across malformed adapters.
      const cmd = mode === "malformed" ? await prepared(url) : retained;
      assert.ok(cmd);
      retained = cmd;
      const r = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), jsonHeaders);
      assert.equal(r.status, 503); assert.ok(record(r.body));
      assert.equal(r.body.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(r.body.effect, "unknown");
    } finally { await stopBackendServer(server); }
  }
});

for (const point of ["reserved", "installed"] as const) {
  test(`F2 owned backend lifecycle cancellation at ${point}: zero or UNKNOWN1`, async () => {
    const clock = new VirtualClock();
    let server: Server | undefined;
    const data = envelope();
    const store = new MemoryStageArrivalStore(data.stageRows, clock, p => {
      if (p === point) { assert.ok(server); backendLifecycle(server)?.beginShutdown(); }
    }, data.stationFacts);
    const { stageArrivalReadAdapters } = await import("../stage-arrival-fixture.mts");
    const f = stageArrivalReadAdapters(store);
    const rt = await createRuntime(config, f.detail, undefined, { reader: f.current, attendanceReader: f.attendance,
      stageArrivalStore: store, clock });
    server = createLoopbackServer(rt); server.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
      const a = server.address(); assert.ok(a && typeof a !== "string");
      const url = `http://127.0.0.1:${a.port}`, cmd = await prepared(url);
      const r = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), jsonHeaders);
      assert.equal(r.status, 503); assert.ok(record(r.body));
      assert.equal(r.body.code, point === "installed" ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT");
      assert.equal(r.body.effect, point === "installed" ? "unknown" : "none");
      const s = store.inspectSnapshot();
      assert.deepEqual([s.stationReceipts, s.stationAudits, s.active],
        point === "installed" ? [1, 1, 0] : [0, 0, 0]);
    } finally { await stopBackendServer(server); }
  });
}

test("F2 actual HTTP late warning, zero effects before ACK and fresh fixed station time", async t => {
  const observed: MemoryStageArrivalStore[] = [], original = MemoryStageArrivalStore.prototype.readStation;
  t.mock.method(MemoryStageArrivalStore.prototype, "readStation",
    function(this: MemoryStageArrivalStore, ...args: Parameters<typeof original>) {
      observed.push(this); return original.apply(this, args);
    });
  const clock = new VirtualClock(); clock.milliseconds = Date.parse("2026-10-20T07:30:00.001Z");
  const server = await startFromEnvironment(environment(), clock);
  try {
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const url = `http://127.0.0.1:${a.port}`;
    const v = await raw(url + base + "/validations", "POST", '{"lateReasonCode":"1"}', jsonHeaders);
    assert.equal(v.status, 200); assert.ok(record(v.body));
    assert.deepEqual(v.body.warnings, [{ code: "STATION_ARRIVAL_LATE", minutes: "0" }]);
    const store = observed[0]; assert.ok(store); const before = store.inspectSnapshot();
    const cmd = { commandId: randomUUID(), draft: { lateReasonCode: "1" }, fingerprint: v.body.fingerprint,
      validationToken: v.body.validationToken, confirmation: null };
    const noAck = await raw(url + base + "/commands", "POST", JSON.stringify(cmd), jsonHeaders);
    assert.equal(noAck.status, 409); assert.ok(record(noAck.body)); assert.equal(noAck.body.code, "CONFIRMATION_REQUIRED");
    assert.deepEqual(store.inspectSnapshot(), before);
    const ack = await raw(url + base + "/commands", "POST", JSON.stringify({ ...cmd,
      confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] } }), jsonHeaders);
    assert.equal(ack.status, 200); assert.ok(record(ack.body) && record(ack.body.recorded));
    assert.deepEqual(ack.body.recorded.stationLate, { reasonCode: "1", minutes: "0", remark: null });
    assert.equal(ack.body.recorded.stageArrivalLocal, null);
  } finally { await stopBackendServer(server); }
});
