import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { EmployeeCardFixtureReader } from "../employee-card-fixture.mts";
import { sampleConfig, sampleEmployeeCardFixture } from "../employee-card-sample.mts";
import { sampleCurrentFixture, sampleDetailRows } from "../current-shifts-sample.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { EmployeeCardError } from "../employee-card-errors.mts";

const path = "/api/v1/employees/9007199254740993/operational-card";
const runtime = () => createRuntime(sampleConfig, new FixtureReader(sampleDetailRows), undefined, {
  reader: new CurrentFixtureReader(sampleCurrentFixture, ["T01"]),
  employeeCardReader: new EmployeeCardFixtureReader(sampleEmployeeCardFixture),
});
async function withServer(rt: SliceRuntime, work: (url: string) => Promise<void>) {
  const server = createLoopbackServer(rt);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  try { await work(`http://127.0.0.1:${address.port}`); }
  finally { await stopBackendServer(server); }
}
test("EC18-01/08/10/12 HTTP exact six capabilities/null actor, one card, privacy headers", async () => {
  await withServer(await runtime(), async url => {
    const r = await fetch(url + path); assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type")!, /^application\/json/);
    assert.equal(r.headers.get("cache-control"), "no-store"); assert.equal(r.headers.get("etag"), null);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    const card = await r.json() as { employeeId: string; employee: Record<string, unknown>; dataSource: string };
    assert.equal(card.employeeId, "9007199254740993"); assert.equal(card.dataSource, "isolated-fixture");
    assert.deepEqual(Object.keys(card.employee), ["firstName", "lastName", "unit", "job", "innerJob"]);
    const identity = await (await fetch(url + "/api/v1/identity")).json() as {
      principal: { employeeId: null; capabilities: string[] }; mockMode: boolean };
    assert.equal(identity.principal.employeeId, null);
    assert.deepEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read",
      "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"]);
  });
});
test("EC18-10 HTTP malformed IDs/query/body rejected before reader, exact invalidParameters", async () => {
  let calls = 0;
  await withServer({ ...await runtime(), employeeCard: async () => { calls++; throw Error("unexpected"); } }, async url => {
    for (const suffix of ["?day=1", "?a=1&a=2", "?a=1&%61=2", "?%ff=x", "?",
      "?x=" + "x".repeat(8193)]) {
      const r = await fetch(url + path + suffix); assert.equal(r.status, 400);
      const p = await r.json() as { code: string; invalidParameters: { name: string }[] };
      assert.equal(p.code, "INVALID_REQUEST"); assert.equal(p.invalidParameters[0].name, "query");
    }
    for (const id of ["01", "0", "-1", "1e2", "%20", "%ff", "9".repeat(39), ""]) {
      const r = await fetch(url + `/api/v1/employees/${id}/operational-card`);
      assert.equal(r.status, 400);
    }
    const status = await new Promise<number>((resolve, reject) => {
      const req = request(url + path, { method: "GET", headers: { "Content-Length": "1" } }, r => {
        r.resume(); r.once("end", () => resolve(r.statusCode!));
      });
      req.on("error", reject); req.end("x");
    });
    assert.equal(status, 400);
  });
  assert.equal(calls, 0);
});
test("EC18-10 non-GET405 Allow GET before authentication or port", async () => {
  let calls = 0;
  await withServer({ ...await runtime(), authenticate: async () => { calls++; throw Error("unexpected"); } }, async url => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
      const r = await fetch(url + path, { method }); assert.equal(r.status, 405);
      assert.equal(r.headers.get("allow"), "GET");
      assert.equal(r.headers.get("cache-control"), "no-store");
    }
  });
  assert.equal(calls, 0);
});
test("EC18-10/12 exact problem media/status/code and sanitized failures, no Oracle fallback", async () => {
  const rt = await runtime();
  for (const [code, status] of [["EMPLOYEE_NOT_FOUND", 404], ["AMBIGUOUS_EMPLOYEE", 500],
    ["INVALID_SOURCE_DATA", 500], ["DEPENDENCY_UNAVAILABLE", 503], ["DEPENDENCY_TIMEOUT", 503]] as const)
    await withServer({ ...rt, employeeCard: async () => { throw new EmployeeCardError(code); } }, async url => {
      const r = await fetch(url + path); assert.equal(r.status, status);
      assert.match(r.headers.get("content-type")!, /^application\/problem\+json/);
      assert.equal(r.headers.get("cache-control"), "no-store");
      const p = await r.json() as { code: string; type: string; requestId: string };
      assert.equal(p.code, code); assert.equal(p.type, `urn:shf:problem:${code}`);
      assert.ok(p.requestId); assert.equal(JSON.stringify(p).includes("9007199254740993"), false);
    });
});
test("EC18-10 real 5000ms HTTP budget suppresses late success and propagates abort", async () => {
  const rt = await runtime(); let aborted = false;
  await withServer({ ...rt, employeeCard: async (_p, _q, signal) => {
    return await new Promise(resolve => signal!.addEventListener("abort", () => {
      aborted = true; resolve({} as never);
    }, { once: true }));
  } }, async url => {
    const started = performance.now(); const r = await fetch(url + path);
    assert.equal(r.status, 503); assert.equal((await r.json() as { code: string }).code, "DEPENDENCY_TIMEOUT");
    assert.ok(performance.now() - started >= 4900); assert.ok(aborted);
  });
});
test("EC18-02/12 explicit server fixture env wiring and source/config fail-closed", async () => {
  const env = {
    SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
    SHF_FIXTURE_ROWS: JSON.stringify(sampleDetailRows), SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
    SHF_EMPLOYEE_CARD_FIXTURE: JSON.stringify(sampleEmployeeCardFixture),
  };
  const server = await startFromEnvironment(env);
  try {
    const address = server.address(); assert.ok(address && typeof address !== "string");
    assert.equal((await fetch(`http://127.0.0.1:${address.port}${path}`)).status, 200);
  } finally { await stopBackendServer(server); }
  await assert.rejects(startFromEnvironment({ ...env, SHF_CURRENT_SHIFTS_FIXTURE: undefined }));
  const badHierarchy = structuredClone(sampleEmployeeCardFixture); badHierarchy.units.pop();
  await assert.rejects(startFromEnvironment({ ...env, SHF_EMPLOYEE_CARD_FIXTURE: JSON.stringify(badHierarchy) }));
  await assert.rejects(createRuntime(sampleConfig, new FixtureReader(sampleDetailRows), undefined, {
    reader: new CurrentFixtureReader(sampleCurrentFixture, ["T01"]),
    employeeCardReader: { dataSource: "oracle-read-only", async read() { return { kind: "not-found" }; } },
  }));
  const noCard = await createRuntime(sampleConfig, new FixtureReader([]));
  const p = await noCard.authenticate({ authorization: null });
  await assert.rejects(noCard.employeeCard(p, { employeeId: "1" }), { code: "DEPENDENCY_UNAVAILABLE" });
});

test("EC18-10 client disconnect propagates abort with no late success or retained listener", async () => {
  let admit!: () => void, done!: () => void;
  const admitted = new Promise<void>(resolve => { admit = resolve; });
  const completed = new Promise<void>(resolve => { done = resolve; });
  let aborted = false;
  await withServer({ ...await runtime(), employeeCard: async (_p, _q, signal) =>
    await new Promise(resolve => {
      signal!.addEventListener("abort", () => {
        aborted = true; resolve({} as never); done();
      }, { once: true }); admit();
    }) }, async url => {
    const req = request(url + path);
    req.on("error", () => {}); req.end();
    await admitted; req.destroy(); await completed; assert.ok(aborted);
  });
});
