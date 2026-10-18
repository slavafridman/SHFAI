import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import type { PrincipalV1 } from "../contracts.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { SearchFixtureReader } from "../shift-search-fixture.mts";
import { MyShiftsFixtureReader } from "../my-shifts-fixture.mts";
import { sampleConfig, sampleMyShiftsFixture, sampleMyShiftsDetailRows } from "../my-shifts-sample.mts";
import { sampleCurrentFixture } from "../current-shifts-sample.mts";
import { sampleSearchFixture } from "../shift-search-sample.mts";
import { createLoopbackServer, serializeSuccess, CURRENT_RESPONSE_LIMIT_BYTES } from "../http-adapter.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { SliceError } from "../errors.mts";
import { myShiftsProblem } from "../my-shifts-errors.mts";
import { MyShiftsError } from "../my-shifts-errors.mts";
import type { MyShiftsListV1 } from "../my-shifts-contracts.mts";

const selected = "/api/v1/my-shifts?mode=selected&employeeId=9007199254740993&dateFrom=2024-02-29&dateTo=2024-03-01";
const options = () => ({ reader: new CurrentFixtureReader(sampleCurrentFixture),
  searchReader: new SearchFixtureReader(sampleSearchFixture), myShiftsReader: new MyShiftsFixtureReader(sampleMyShiftsFixture),
  clock: { now: () => new Date("2024-02-28T23:30:00Z") } });
async function runtime(claims?: PrincipalV1) {
  return claims ? createRuntime({ ...sampleConfig, authenticationMode: "real",
    syntheticAdministratorEnabled: false, syntheticOrgUnitIds: undefined, realProviderId: "isolated-test-double" },
  new FixtureReader(sampleMyShiftsDetailRows), async () => ({ authenticate: async () => claims }), options())
    : createRuntime(sampleConfig, new FixtureReader(sampleMyShiftsDetailRows), undefined, options());
}
async function withServer(rt: SliceRuntime, work: (url: string) => Promise<void>) {
  const server = createLoopbackServer(rt);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  try { await work(`http://127.0.0.1:${address.port}`); }
  finally { await stopBackendServer(server); }
}
test("MY18-11/12 HTTP existing current/search -> selected schedule -> same detail, independent identity", async () => {
  await withServer(await runtime(), async url => {
    for (const discovery of [
      "/api/v1/current-shifts?mode=at&attendanceDate=2024-03-01&currentTime=00:00",
      "/api/v1/shift-search?attendanceDate=2026-10-15&timeFrom=10:00&timeTo=10:00",
    ]) {
      const discovered = await fetch(url + discovery); assert.equal(discovered.status, 200);
      const upstream = await discovered.json() as { items: Array<{ employee: { employeeId: string } }> };
      const id = upstream.items[0].employee.employeeId;
      const context = await fetch(url + `/api/v1/my-shifts/context?mode=selected&employeeId=${id}`);
      assert.equal(context.status, 200); assert.equal((await context.json() as { selectionRequired: boolean }).selectionRequired, false);
      const dates = id === "1001" ? ["2026-10-15", "2026-10-15"] : ["2024-02-29", "2024-03-01"];
      const response = await fetch(url + `/api/v1/my-shifts?mode=selected&employeeId=${id}&dateFrom=${dates[0]}&dateTo=${dates[1]}`);
      assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      const list = await response.json() as MyShiftsListV1; assert.equal(list.dataSource, "isolated-fixture");
      for (const row of list.items) {
        assert.deepEqual(Object.keys(row).sort(), ["activities", "employee", "endLocal", "shiftDayId", "startLocal"]);
        const detail = await fetch(url + `/api/v1/employees/${id}/shift-days/${row.shiftDayId}`);
        assert.equal(detail.status, 200);
        const d = await detail.json() as { effectiveShift: { startLocal: string; endLocal: string | null } };
        assert.equal(d.effectiveShift.startLocal, row.startLocal); assert.equal(d.effectiveShift.endLocal, row.endLocal);
      }
    }
    const self = await fetch(url + "/api/v1/my-shifts/context?mode=self");
    assert.equal(self.status, 200);
    assert.equal((await self.json() as { actor: { employee: unknown } }).actor.employee, null);
    const missing = await fetch(url + "/api/v1/my-shifts?mode=self&dateFrom=2024-02-29&dateTo=2024-03-01");
    assert.equal(missing.status, 409);
    const identity = await fetch(url + "/api/v1/identity");
    assert.equal((await identity.json() as { principal: PrincipalV1 }).principal.employeeId, null);
  });
});
test("MY18-02/04/10 HTTP strict duplicates, decode-once, required dates, query cap and nonleak errors", async () => {
  await withServer(await runtime(), async url => {
    const invalid = [
      "/api/v1/my-shifts", "/api/v1/my-shifts/context", "/api/v1/my-shifts/context?mode=self&limit=1",
      "/api/v1/my-shifts/context?mode=self&employeeId=1", "/api/v1/my-shifts/context?mode=selected",
      selected + "&mode=self", selected + "&unknown=secret", selected + "&limit=01", selected + "&offset=10001",
      selected + "&sort=name", selected.replace("2024-03-01", "2024-04-01"),
      selected.replace("2024-02-29", "2023-02-29"), selected.replace("2024-03-01", "0000-01-01"),
      selected.replace("employeeId=9007199254740993", "employeeId=01"),
      selected.replace("employeeId=9007199254740993", "employeeId=%2531"),
      selected + "&mode=%FF", selected + "&mode=%", selected + "&employeeId[]=1",
      selected + "&dateTo=null", selected + "&limit=1.0", selected + "&offset=+1",
      selected + "&secret=" + "x".repeat(8193),
    ];
    for (const path of invalid) {
      const r = await fetch(url + path); assert.equal(r.status, 400, path.slice(0, 130));
      assert.equal(r.headers.get("cache-control"), "no-store");
      assert.match(r.headers.get("content-type")!, /application\/problem\+json/);
      const p = await r.json() as { code: string; requestId: string }; assert.equal(p.code, "INVALID_REQUEST");
      assert.ok(p.requestId); assert.ok(!JSON.stringify(p).includes("secret"));
    }
    for (const id of ["8", "9"]) {
      const r = await fetch(url + `/api/v1/my-shifts/context?mode=selected&employeeId=${id}`);
      assert.equal(r.status, 403); assert.equal((await r.json() as { title: string }).title, "Schedule scope unavailable");
    }
    const post = await fetch(url + selected, { method: "POST", body: "{}" }); assert.equal(post.status, 400);
    const body = await new Promise<{ status: number; text: string }>((resolve, reject) => {
      const req = httpRequest(url + selected, { method: "GET", headers: { "Content-Length": "2" } }, res => {
        let text = ""; res.on("data", chunk => { text += chunk; });
        res.on("end", () => resolve({ status: res.statusCode!, text }));
      });
      req.on("error", reject); req.end("{}");
    });
    assert.equal(body.status, 400);
    assert.deepEqual(JSON.parse(body.text).invalidParameters, [{ name: "body", reason: "unsupported" }]);
  });
});
test("MY18-01/12 real bound self via provider seam, selected forbidden and all capabilities independent", async () => {
  const claims: PrincipalV1 = { subject: "isolated:provider-double", displayName: "test", provider: "real",
    synthetic: false, roles: ["Administrator"], capabilities: ["my-shifts:read"], employeeId: "9007199254740993",
    resourceScope: { orgUnitIds: ["T01"] } };
  await withServer(await runtime(claims), async url => {
    assert.equal((await fetch(url + selected)).status, 403);
    const self = await fetch(url + "/api/v1/my-shifts?mode=self&dateFrom=2024-02-29&dateTo=2024-03-01");
    assert.equal(self.status, 200);
    for (const path of ["/api/v1/current-shifts/filter-context", "/api/v1/shift-search/filter-context",
      "/api/v1/employees/9007199254740993/shift-days/1"]) assert.equal((await fetch(url + path)).status, 403);
  });
  await withServer(await runtime({ ...claims, capabilities: ["shift-day:read", "current-shifts:read", "shift-search:read"] }), async url => {
    assert.equal((await fetch(url + "/api/v1/my-shifts/context?mode=self")).status, 403);
    assert.equal((await fetch(url + selected + "&limit=0")).status, 400);
  });
});
test("MY18-10 authentication/config errors never become Administrator or fixture fallback", async () => {
  const realConfig = { ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
    syntheticOrgUnitIds: undefined, realProviderId: "isolated-test-double" };
  for (const failure of [new Error("secret"), new SliceError("UNAUTHENTICATED")]) {
    const rt = await createRuntime(realConfig, new FixtureReader([]),
      async () => ({ authenticate: async () => { throw failure; } }), options());
    await withServer(rt, async url => {
      const r = await fetch(url + selected);
      assert.equal(r.status, failure instanceof SliceError ? 401 : 503);
      assert.ok(!JSON.stringify(await r.json()).includes("secret"));
    });
  }
  await assert.rejects(createRuntime(realConfig, new FixtureReader([])), /not installed/);
  for (const config of [{ ...sampleConfig, deploymentClass: "production" },
    { ...sampleConfig, syntheticAdministratorEnabled: false }, { ...sampleConfig, businessTimeZone: "invalid/zone" }])
    await assert.rejects(createRuntime(config, new FixtureReader([])));
  const malformed = await createRuntime(realConfig, new FixtureReader([]),
    async () => ({ authenticate: async () => ({}) as PrincipalV1 }), options());
  await withServer(malformed, async url => assert.equal((await fetch(url + selected)).status, 401));
});
test("MY18-10 total budget includes schedule actor work; response cap sanitized and no late result", async () => {
  const rt = await runtime();
  let aborted = false, completed = false;
  const delayed = { ...rt, myShiftsList: async (_p: PrincipalV1, _r: unknown, signal?: AbortSignal) => {
    await new Promise<void>(resolve => signal?.addEventListener("abort", () => {
      aborted = true; resolve();
    }, { once: true }));
    completed = true;
    throw new Error("secret late success prevented");
  } };
  await withServer(delayed, async url => {
    const r = await fetch(url + selected); assert.equal(r.status, 503);
    assert.equal((await r.json() as { code: string }).code, "DEPENDENCY_TIMEOUT");
    assert.equal(aborted, true); assert.equal(completed, true);
  });
  assert.throws(() => serializeSuccess({ value: "x".repeat(CURRENT_RESPONSE_LIMIT_BYTES) }, CURRENT_RESPONSE_LIMIT_BYTES),
    { code: "INTERNAL_ERROR" });
  const oversized = { ...rt, myShiftsContext: async () => ({ value: "x".repeat(CURRENT_RESPONSE_LIMIT_BYTES) }) as never };
  await withServer(oversized, async url => {
    const r = await fetch(url + "/api/v1/my-shifts/context?mode=self");
    assert.equal(r.status, 500); assert.equal((await r.json() as { code: string }).code, "INTERNAL_ERROR");
  });
  assert.equal(myShiftsProblem({ code: "AMBIGUOUS_SHIFT_DAY" }, "request").code, "INTERNAL_ERROR");
});
test("MY18-10 explicit environment bootstrap schedule fixture; rejects mixing with Oracle before pool", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
    SHF_FIXTURE_ROWS: JSON.stringify(sampleMyShiftsDetailRows),
    SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
    SHF_SHIFT_SEARCH_FIXTURE: JSON.stringify(sampleSearchFixture),
    SHF_MY_SHIFTS_FIXTURE: JSON.stringify(sampleMyShiftsFixture) };
  const server = await startFromEnvironment(env);
  try {
    const address = server.address(); assert.ok(address && typeof address !== "string");
    assert.equal((await fetch(`http://127.0.0.1:${address.port}` + selected)).status, 200);
  } finally { await stopBackendServer(server); }
  await assert.rejects(startFromEnvironment({ ...env, SHF_CURRENT_SHIFTS_FIXTURE: undefined }), /catalog/);
  await assert.rejects(startFromEnvironment({ SHF_ORACLE_CONFIG: JSON.stringify({ ...sampleConfig,
    dataSource: "oracle-read-only", oracleTestScopeConfirmed: true }), SHF_ORACLE_PORT: "0",
    SHF_MY_SHIFTS_FIXTURE: "{}" }), /prohibits fixture/);
});
test("MY18-10 HTTP allowlisted schedule error/status mapping and fragment/raw path grammar", async () => {
  const rt = await runtime();
  for (const [code, status] of [["AMBIGUOUS_MY_SHIFTS", 500], ["INVALID_SOURCE_DATA", 500],
    ["DEPENDENCY_UNAVAILABLE", 503], ["DEPENDENCY_TIMEOUT", 503]] as const) {
    await withServer({ ...rt, myShiftsList: async () => { throw new MyShiftsError(code); } }, async url => {
      const r = await fetch(url + selected); assert.equal(r.status, status);
      const p = await r.json() as { code: string; requestId: string };
      assert.equal(p.code, code); assert.ok(p.requestId);
      assert.equal(r.headers.get("cache-control"), "no-store");
    });
  }
  await withServer(rt, async url => {
    for (const path of [selected + "#fragment", selected + "&%6dode=selected", "/api/v1/my-shifts/?mode=self"]) {
      const status = await new Promise<number>((resolve, reject) => {
        const base = new URL(url);
        const req = httpRequest({ hostname: base.hostname, port: base.port, path, method: "GET" }, res => {
          res.resume(); res.once("end", () => resolve(res.statusCode!));
        });
        req.once("error", reject); req.end();
      });
      assert.equal(status, 400);
    }
  });
});
