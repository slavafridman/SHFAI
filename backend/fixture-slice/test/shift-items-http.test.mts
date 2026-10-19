import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { ShiftItemsFixtureReader } from "../shift-items-fixture.mts";
import { sampleCurrentFixture } from "../current-shifts-sample.mts";
import { sampleConfig, sampleShiftItemsFixture, sampleShiftItemsDetailRows } from "../shift-items-sample.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { ShiftItemsError, itemsProblem } from "../shift-items-errors.mts";
import { SliceError } from "../errors.mts";

const path = "/api/v1/employees/9007199254740993/shift-days/1/breaks-and-exceptions";
const runtime = () => createRuntime(sampleConfig, new FixtureReader(sampleShiftItemsDetailRows), undefined,
  { reader: new CurrentFixtureReader(sampleCurrentFixture, ["T01"]),
    shiftItemsReader: new ShiftItemsFixtureReader(sampleShiftItemsFixture) });
async function withServer(rt: SliceRuntime, work: (url: string) => Promise<void>) {
  const server = createLoopbackServer(rt);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try { await work(`http://127.0.0.1:${address.port}`); }
  finally { await stopBackendServer(server); }
}
test("BRX18-01/03 HTTP single endpoint, five-capability identity, headers and selected fixture", async () => {
  await withServer(await runtime(), async url => {
    const response = await fetch(url + path + "?limit=1&sort=start-asc");
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff"); assert.equal(response.headers.get("etag"), null);
    const body = await response.json() as { items: unknown[]; shiftDay: { dataSource: string } };
    assert.equal(body.items.length, 1); assert.equal(body.shiftDay.dataSource, "isolated-fixture");
    const identity = await (await fetch(url + "/api/v1/identity")).json() as { principal: { capabilities: string[]; employeeId: null } };
    assert.deepEqual(identity.principal.capabilities,
      ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"]);
    assert.equal(identity.principal.employeeId, null);
  });
});
test("BRX18-03 HTTP rejects unknown/duplicate/decoded duplicate/invalid query, paths and any body before reader", async () => {
  const rt = await runtime(); let calls = 0;
  await withServer({ ...rt, shiftItems: async () => { calls++; throw Error("unexpected"); } }, async url => {
    for (const suffix of ["?kind=break", "?limit=1&%6cimit=2", "?limit=0", "?offset=10001",
      "?sort=start-desc", "?limit=1e2", "?offset=", "?%ff=x", "?x=" + "x".repeat(8193)]) {
      const r = await fetch(url + path + suffix); assert.equal(r.status, 400, suffix.slice(0, 40));
      const body = await r.json() as { code: string; invalidParameters?: unknown };
      assert.equal(body.code, "INVALID_REQUEST");
      assert.ok(body.invalidParameters);
    }
    for (const bad of [path.replace("/1/", "/01/"), path.replace("9007199254740993", "9".repeat(39))])
      assert.equal((await fetch(url + bad)).status, 400);
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = httpRequest(url + path, { method: "GET", headers: { "Content-Length": "1" } }, res => {
        let body = ""; res.on("data", b => { body += b; });
        res.on("end", () => resolve({ status: res.statusCode!, body }));
      });
      req.on("error", reject); req.end("x");
    });
    assert.equal(response.status, 400); assert.match(response.body, /"name":"body"/);
  });
  assert.equal(calls, 0);
});
test("BRX18-03 all non-GET405 Allow GET and zero reader calls", async () => {
  const rt = await runtime(); let calls = 0;
  await withServer({ ...rt, shiftItems: async () => { calls++; throw Error("unexpected"); } }, async url => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
      const r = await fetch(url + path, { method });
      assert.equal(r.status, 405); assert.equal(r.headers.get("allow"), "GET");
      assert.equal(r.headers.get("cache-control"), "no-store"); await r.arrayBuffer();
    }
  });
  assert.equal(calls, 0);
});
test("BRX18-04 generic404 does not disclose wrong owner or vanished day", async () => {
  await withServer(await runtime(), async url => {
    for (const target of [path.replace("9007199254740993", "2"), path.replace("/1/", "/999/")]) {
      const r = await fetch(url + target); assert.equal(r.status, 404);
      const p = await r.json() as { code: string; title: string };
      assert.equal(p.code, "SHIFT_DAY_NOT_FOUND"); assert.equal(p.title, "Shift day unavailable");
      assert.ok(!JSON.stringify(p).includes("9007199254740993"));
    }
    const r = await fetch(url + path + "?offset=10000");
    assert.equal(r.status, 200); assert.deepEqual((await r.json() as { items: unknown[] }).items, []);
  });
});
test("BRX18-09 HTTP full5s budget includes authentication, no late read or success", async () => {
  const rt = await runtime(); let reads = 0;
  await withServer({ ...rt, authenticate: async () => {
    await new Promise(resolve => setTimeout(resolve, 5100)); return rt.authenticate({ authorization: null });
  }, shiftItems: async (...args) => { reads++; return rt.shiftItems(...args); } }, async url => {
    const r = await fetch(url + path); assert.equal(r.status, 503);
    assert.equal((await r.json() as { code: string }).code, "DEPENDENCY_TIMEOUT");
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(reads, 0);
  });
});
test("BRX18-09/12 source failure503 never falls back; exact sanitized problem statuses no409/422", async () => {
  for (const [code, status] of [["INVALID_REQUEST", 400], ["UNAUTHENTICATED", 401], ["FORBIDDEN", 403],
    ["SHIFT_DAY_NOT_FOUND", 404], ["DEPENDENCY_UNAVAILABLE", 503], ["DEPENDENCY_TIMEOUT", 503],
    ["AMBIGUOUS_SHIFT_DAY", 500], ["AMBIGUOUS_SHIFT_ITEMS", 500], ["INVALID_SOURCE_DATA", 500], ["INTERNAL_ERROR", 500]] as const) {
    const p = itemsProblem(new ShiftItemsError(code), "synthetic-id");
    assert.equal(p.status, status); assert.equal(p.type, `urn:shf:problem:${code}`);
    assert.deepEqual(Object.keys(p).sort(), ["type", "title", "status", "code", "requestId"].sort());
  }
  const rt = await runtime();
  await withServer({ ...rt, shiftItems: async () => { throw new SliceError("DEPENDENCY_UNAVAILABLE"); } }, async url => {
    const r = await fetch(url + path); assert.equal(r.status, 503);
    assert.equal((await r.json() as { code: string }).code, "DEPENDENCY_UNAVAILABLE");
  });
});
test("BRX18-01/10 explicit environment fixture bootstrap and detail coherence, no source mixing", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
    SHF_FIXTURE_ROWS: JSON.stringify(sampleShiftItemsDetailRows),
    SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
    SHF_SHIFT_ITEMS_FIXTURE: JSON.stringify(sampleShiftItemsFixture) };
  const server = await startFromEnvironment(env);
  try {
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const response = await fetch(`http://127.0.0.1:${a.port}` + path);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { items: unknown[] }).items.length, 3);
  } finally { await stopBackendServer(server); }
  await assert.rejects(startFromEnvironment({ ...env, SHF_FIXTURE_ROWS: "[]" }));
  await assert.rejects(startFromEnvironment({ ...env, SHF_CURRENT_SHIFTS_FIXTURE: undefined }));
  await assert.rejects(startFromEnvironment({ ...env, SHF_FIXTURE_CONFIG: JSON.stringify({
    ...sampleConfig, deploymentClass: "production" }) }));
});
test("BRX18-01/12 mock disabled/invalid environment no Administrator fallback, source-bound readers", async () => {
  const rt = await runtime();
  await assert.rejects(createRuntime({ ...sampleConfig, syntheticAdministratorEnabled: false },
    new FixtureReader(sampleShiftItemsDetailRows)));
  await assert.rejects(createRuntime({ ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
    syntheticOrgUnitIds: undefined, realProviderId: "not-installed" }, new FixtureReader(sampleShiftItemsDetailRows)));
  await assert.rejects(createRuntime(sampleConfig, new FixtureReader(sampleShiftItemsDetailRows), undefined,
    { reader: new CurrentFixtureReader(sampleCurrentFixture, ["T01"]), shiftItemsReader: {
      dataSource: "oracle-read-only", read: async () => ({ kind: "not-found" }) } }));
  await withServer({ ...rt, authenticate: async () => { throw new SliceError("UNAUTHENTICATED"); } }, async url => {
    assert.equal((await fetch(url + path)).status, 401);
  });
  test("BRX18-10 client disconnect propagates abort to in-flight items port", async () => {
    const rt = await runtime();
    const c = new AbortController();
    let signalSeen: AbortSignal | undefined;
    let entered!: () => void, cancelled!: () => void;
    const entry = new Promise<void>(resolve => { entered = resolve; });
    const cancellation = new Promise<void>(resolve => { cancelled = resolve; });
    await withServer({ ...rt, shiftItems: async (_p, _r, signal) => {
      signalSeen = signal; entered();
      await new Promise<void>((_resolve, reject) => {
        signal!.addEventListener("abort", () => { cancelled(); reject(signal!.reason); }, { once: true });
      });
      throw Error("unreachable");
    } }, async url => {
      const response = fetch(url + path, { signal: c.signal }).catch(() => undefined);
      await entry; c.abort(); await response;
      await cancellation;
      assert.equal(signalSeen?.aborted, true);
    });
  });
});
