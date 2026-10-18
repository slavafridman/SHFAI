import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { createRuntime } from "../synthetic-identity.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { SearchFixtureReader } from "../shift-search-fixture.mts";
import { sampleConfig, sampleSearchFixture, sampleSearchDetailRows } from "../shift-search-sample.mts";
import { sampleCurrentFixture } from "../current-shifts-sample.mts";
import { principal } from "./current-fixtures.mts";
import type { PrincipalV1 } from "../contracts.mts";
import type { ShiftSearchListV1, ShiftSearchFilterContextV1, ShiftSearchProblemV1 } from "../shift-search-contracts.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";

const valid = "/api/v1/shift-search?attendanceDate=2026-10-15&timeFrom=10:00&timeTo=10:00";
async function runtime(claims?: PrincipalV1) {
  const options = { reader: new CurrentFixtureReader(sampleCurrentFixture),
    searchReader: new SearchFixtureReader(sampleSearchFixture) };
  if (!claims) return createRuntime(sampleConfig, new FixtureReader(sampleSearchDetailRows), undefined, options);
  return createRuntime({ ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
    syntheticOrgUnitIds: undefined, realProviderId: "isolated-double" }, new FixtureReader(sampleSearchDetailRows),
  async () => ({ authenticate: async () => claims }), options);
}
async function withServer<T>(rt: Awaited<ReturnType<typeof runtime>>, work: (url: string) => Promise<T>) {
  const server = createLoopbackServer(rt);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test loopback unavailable");
  try { return await work(`http://127.0.0.1:${address.port}`); }
  finally { const closed = once(server, "close"); server.close(); server.closeAllConnections(); await closed; }
}
test("SEARCH01 HTTP context/search/detail same selected synthetic identity, exact source and no-store", async () => {
  await withServer(await runtime(), async url => {
    const responses = await Promise.all([fetch(url + "/api/v1/identity"),
      fetch(url + "/api/v1/shift-search/filter-context"), fetch(url + valid)]);
    for (const response of responses) {
      assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
      assert.match(response.headers.get("content-type")!, /application\/json/);
    }
    const identity = await responses[0].json() as { principal: PrincipalV1 };
    const context = await responses[1].json() as ShiftSearchFilterContextV1;
    const list = await responses[2].json() as ShiftSearchListV1;
    assert.deepEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read"]);
    assert.equal(identity.principal.employeeId, null);
    assert.equal(context.dataSource, "isolated-fixture");
    assert.equal(list.dataSource, "isolated-fixture");
    assert.equal(list.items[0].shiftDayId, "3001");
    const detail = await fetch(url + `/api/v1/employees/${list.items[0].employee.employeeId}/shift-days/${list.items[0].shiftDayId}`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json() as { shiftDayId: string }).shiftDayId, "3001");
  });
});
test("SEARCH01 HTTP strict grammar/date/time/arrays/bounds/context query and sanitized problem", async () => {
  await withServer(await runtime(), async url => {
    const paths = [
      "/api/v1/shift-search/filter-context?x=1", "/api/v1/shift-search/filter-context?",
      "/api/v1/shift-search", valid + "&x=secret", valid + "&timeFrom=10:01",
      valid.replace("2026-10-15", "2023-02-29"), valid.replace("10:00", "1:00"),
      valid.replace("timeTo=10:00", "timeTo=09:59"), valid + "&teamCodes=T01,T01",
      valid + "&teamCodes=", valid + "&innerJobCodes=0", valid + "&innerJobCodes=1%2C1",
      valid + "&innerJobCodes=2", valid + "&workLocations=home,site,home", valid + "&limit=101", valid + "&offset=-1",
      valid + "&sort=name", valid + "&mokedCode=-1", valid + "&mokedCode=%FF",
      valid + "&teamCodes=" + Array.from({ length: 101 }, (_, i) => "T" + i).join(","),
      valid + "&teamCodes=" + "X".repeat(8193),
    ];
    for (const path of paths) {
      const response = await fetch(url + path);
      assert.equal(response.status, 400, path.slice(0, 120));
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.match(response.headers.get("content-type")!, /application\/problem\+json/);
      const problem = await response.json() as ShiftSearchProblemV1;
      assert.equal(problem.code, "INVALID_REQUEST"); assert.ok(problem.requestId);
      assert.ok(!JSON.stringify(problem).includes("secret"));
    }
    const response = await fetch(url + valid + "&teamCodes=unknown");
    assert.equal(response.status, 403); assert.equal((await response.json() as ShiftSearchProblemV1).code, "FORBIDDEN");
  });
});
test("SEARCH01 HTTP GET bodies and non-GET never mutate/read, grammar before capability", async () => {
  await withServer(await runtime(principal({ capabilities: [] })), async url => {
    const malformed = await fetch(url + valid + "&limit=0");
    assert.equal(malformed.status, 400);
    const denied = await fetch(url + valid); assert.equal(denied.status, 403);
    const post = await fetch(url + valid, { method: "POST", body: "{}" }); assert.equal(post.status, 400);
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = httpRequest(url + valid, { method: "GET", headers: { "Content-Length": "2" } }, res => {
        let body = ""; res.on("data", c => { body += c; });
        res.on("end", () => resolve({ status: res.statusCode!, body }));
      });
      req.on("error", reject); req.end("{}");
    });
    assert.equal(result.status, 400);
    assert.deepEqual(JSON.parse(result.body).invalidParameters, [{ name: "body", reason: "unsupported" }]);
  });
});
test("SEARCH01 search-only cannot access current/detail, real provider errors do not become Administrator", async () => {
  await withServer(await runtime(principal({ capabilities: ["shift-search:read"] })), async url => {
    assert.equal((await fetch(url + valid)).status, 200);
    assert.equal((await fetch(url + "/api/v1/current-shifts/filter-context")).status, 403);
    assert.equal((await fetch(url + "/api/v1/employees/1001/shift-days/3001")).status, 403);
  });
  const rt = await runtime();
  await withServer({ ...rt, authenticate: async () => { throw new Error("secret"); } }, async url => {
    const response = await fetch(url + valid);
    assert.equal(response.status, 500);
    const text = await response.text(); assert.ok(!text.includes("Administrator")); assert.ok(!text.includes("secret"));
  });
});
test("SEARCH01 missing explicit reader fails 503, no current/default/fixture fallback", async () => {
  const rt = await createRuntime(sampleConfig, new FixtureReader(sampleSearchDetailRows));
  await withServer(rt, async url => {
    const response = await fetch(url + valid);
    assert.equal(response.status, 503); assert.equal((await response.json() as ShiftSearchProblemV1).code, "DEPENDENCY_UNAVAILABLE");
  });
  await assert.rejects(createRuntime(sampleConfig, new FixtureReader(sampleSearchDetailRows), undefined, {
    reader: new CurrentFixtureReader(sampleCurrentFixture), searchReader: Object.assign(new SearchFixtureReader(sampleSearchFixture),
      { dataSource: "oracle-read-only" }),
  }), /source mismatch/);
});
test("SEARCH01 environment bootstrap loads only explicitly selected fixture and closes listener", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
    SHF_FIXTURE_ROWS: JSON.stringify(sampleSearchDetailRows), SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
    SHF_SHIFT_SEARCH_FIXTURE: JSON.stringify(sampleSearchFixture) };
  const server = await startFromEnvironment(env);
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test listener unavailable");
    assert.equal((await fetch(`http://127.0.0.1:${address.port}` + valid)).status, 200);
  } finally { await stopBackendServer(server); }
  await assert.rejects(startFromEnvironment({ ...env, SHF_CURRENT_SHIFTS_FIXTURE: undefined }));
  await assert.rejects(startFromEnvironment({ ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...sampleConfig,
    deploymentClass: "production" }) }));
});
test("SEARCH01 shared five-second HTTP budget suppresses late search success and propagates abort", async () => {
  const rt = await runtime();
  let observed = false;
  await withServer({ ...rt, searchList: async (_principal, _request, signal) => {
    await new Promise<void>(resolve => signal?.addEventListener("abort", () => { observed = true; resolve(); }, { once: true }));
    return rt.searchList(await rt.authenticate({ authorization: null }), { attendanceDate: "2026-10-15", timeFrom: "10:00", timeTo: "10:00" });
  } }, async url => {
    const response = await fetch(url + valid);
    assert.equal(response.status, 503); assert.equal((await response.json() as ShiftSearchProblemV1).code, "DEPENDENCY_TIMEOUT");
    assert.equal(observed, true);
  });
});
