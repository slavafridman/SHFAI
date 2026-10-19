import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { setImmediate as nextTurn } from "node:timers/promises";
import { createLoopbackServer, REQUEST_BUDGET_MS, REQUEST_TARGET_LIMIT_BYTES,
  CURRENT_RESPONSE_LIMIT_BYTES, serializeSuccess } from "../http-adapter.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { FixtureReader } from "../fixture-reader.mts";
import type { CurrentShiftReadPort } from "../current-shifts-contracts.mts";
import { record } from "../contract-validation.mts";
import { startFromEnvironment } from "../server.mts";
import { SliceError } from "../errors.mts";
import { data, day, principal } from "./current-fixtures.mts";
import { config, row } from "./fixtures.mts";
import { clockMinute } from "../read-current-shifts.mts";
import { sampleConfig, sampleCurrentFixture, sampleDetailRows } from "../current-shifts-sample.mts";

const contextPath = "/api/v1/current-shifts/filter-context";
const listPath = "/api/v1/current-shifts";
const atQuery = "?mode=at&attendanceDate=2024-03-01&currentTime=00:00";
const syntheticConfig = { ...config, syntheticOrgUnitIds: ["T01"] };
const realConfig = { deploymentClass: "isolated-test-demo", authenticationMode: "real",
  syntheticAdministratorEnabled: false, realProviderId: "isolated-test-double",
  dataSource: "isolated-fixture", businessTimeZone: "UTC" };
async function runtime(reader: CurrentShiftReadPort = new CurrentFixtureReader(data())) {
  return createRuntime(syntheticConfig, new FixtureReader([row({ orgUnitId: "T01" })]), undefined,
    { reader, clock: { now: () => new Date("2024-03-01T00:00:59Z") } });
}
async function withServer(rt: SliceRuntime, run: (url: string) => Promise<void>) {
  const server = createLoopbackServer(rt);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally {
    const closed = once(server, "close");
    server.close(); server.closeAllConnections();
    await closed;
  }
}
async function expectProblem(response: Response, code: string, status: number) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json/);
  const problem: unknown = await response.json();
  assert.ok(record(problem));
  assert.equal(problem.code, code);
  assert.equal(problem.type, `urn:shf:problem:${code}`);
  assert.equal(problem.status, status);
  assert.ok(typeof problem.requestId === "string" && /^[0-9a-f-]{36}$/.test(problem.requestId));
  assert.ok(!JSON.stringify(problem).includes("sensitive") && !("items" in problem));
  return problem;
}
function rawRequest(url: string, path: string, body?: string) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const req = httpRequest(url + path, { method: "GET",
      headers: body === undefined ? {} : { "Content-Length": Buffer.byteLength(body) } }, res => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(text) }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

test("NEXT01-06/10/13 HTTP: exact capabilities, fixtures, context, list and unchanged detail link", async () => {
  await withServer(await runtime(), async url => {
    const identity = await (await fetch(url + "/api/v1/identity")).json();
    assert.ok(record(identity) && record(identity.principal));
    assert.deepEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read", "attendance:read"]);
    assert.equal(identity.principal.employeeId, null);
    const ctx = await fetch(url + contextPath);
    assert.equal(ctx.status, 200);
    assert.equal(ctx.headers.get("cache-control"), "no-store");
    assert.deepEqual(await ctx.json(), {
      defaults: { mode: "at", attendanceDate: "2024-03-01", currentTime: "02:00", mokedCode: "01" },
      mokedOptions: [{ code: "01", label: "Synthetic parent one", unitType: "G01" }],
      businessTimeZone: "Asia/Jerusalem", dataSource: "isolated-fixture",
    });
    const response = await fetch(url + listPath + atQuery);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json; charset=utf-8$/);
    const list = await response.json();
    assert.ok(record(list) && Array.isArray(list.items));
    assert.deepEqual(Object.keys(list).sort(), ["applied", "businessTimeZone", "dataSource", "items", "page"]);
    assert.equal(list.dataSource, "isolated-fixture");
    const item = list.items[0];
    assert.ok(record(item) && record(item.employee));
    assert.equal(item.employee.employeeId, "9007199254740993");
    // A row link is refetched, not a guessed identity/detail or fabricated match.
    await expectProblem(await fetch(url + `/api/v1/employees/${item.employee.employeeId}/shift-days/${item.shiftDayId}`),
      "SHIFT_DAY_NOT_FOUND", 404);
    const detail = await fetch(url + "/api/v1/employees/1001/shift-days/2001");
    assert.equal(detail.status, 200);
    const detailDto = await detail.json();
    assert.ok(record(detailDto));
    assert.deepEqual(Object.keys(detailDto).sort(),
      ["attendance", "businessTimeZone", "dataSource", "effectiveShift", "employee", "employeeId", "shiftDayId"]);
  });
});

test("NEXT01-01/02 HTTP grammar, percent encoding, repeated/unknown keys, methods, body, target bound", async () => {
  let catalog = 0, reads = 0;
  const port: CurrentShiftReadPort = {
    async readMokedOptions() { catalog++; return []; }, async readRows() { reads++; return []; },
  };
  const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() { return principal({ resourceScope: { orgUnitIds: [] } }); },
  }), { reader: port });
  await withServer(rt, async url => {
    for (const path of [
      contextPath + "?", contextPath + "?anything=1", listPath, listPath + "?mode=current&mode=current",
      listPath + "?mode=current&team=T01", listPath + "?mode=current&mode%5B%5D=current",
      listPath + "?mode=%ZZ", listPath + "?mode=current&mokedCode=%FF",
      listPath + "?mode=current&attendanceDate=2024-03-01",
      listPath + "?mode=at&attendanceDate=2024-02-30&currentTime=00:00",
      listPath + "?mode=at&attendanceDate=2024-03-01&currentTime=9:00",
      listPath + "?mode=current&offset=1", listPath + "?mode=current&limit=01",
      listPath + "?mode=current&sort=SQL", listPath + "?mode=current&mokedCode=-1",
      listPath + "?mode=current&x=" + "a".repeat(REQUEST_TARGET_LIMIT_BYTES),
    ]) await expectProblem(await fetch(url + path), "INVALID_REQUEST", 400);
    for (const method of ["POST", "PUT", "DELETE"])
      await expectProblem(await fetch(url + listPath + atQuery, { method }), "INVALID_REQUEST", 400);
    for (const path of [contextPath, listPath + atQuery]) {
      const result = await rawRequest(url, path, "sensitive-untrusted-body");
      assert.equal(result.status, 400);
      assert.ok(record(result.body));
      assert.deepEqual(result.body.invalidParameters, [{ name: "body", reason: "unsupported" }]);
      assert.ok(!JSON.stringify(result.body).includes("sensitive"));
    }
    for (const path of [listPath + "/", contextPath + "/extra", "/api/v1/current-shifts-evil"])
      assert.equal((await fetch(url + path)).status, 400);
    assert.equal(catalog, 0);
    assert.equal(reads, 0);
  });
});

test("NEXT01-06/09 HTTP: no capability means no port reads; unknown and forbidden parents identical", async () => {
  let calls = 0;
  const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() { return principal({ capabilities: ["shift-day:read"] }); },
  }), { reader: { async readMokedOptions() { calls++; return []; }, async readRows() { calls++; return []; } } });
  await withServer(rt, async url => {
    for (const path of [contextPath, listPath + atQuery])
      await expectProblem(await fetch(url + path), "FORBIDDEN", 403);
    assert.equal(calls, 0);
  });
  await withServer(await runtime(), async url => {
    const first = await expectProblem(await fetch(url + listPath + atQuery + "&mokedCode=02"), "FORBIDDEN", 403);
    const second = await expectProblem(await fetch(url + listPath + atQuery + "&mokedCode=99"), "FORBIDDEN", 403);
    assert.deepEqual({ ...first, requestId: "" }, { ...second, requestId: "" });
  });
});

test("NEXT01-07/09 HTTP: default endpoints disabled 503, invalid provider no Administrator fallback", async () => {
  await withServer(await createRuntime(config, new FixtureReader([row()])), async url => {
    for (const path of [contextPath, listPath + atQuery])
      await expectProblem(await fetch(url + path), "DEPENDENCY_UNAVAILABLE", 503);
    assert.equal((await fetch(url + "/api/v1/identity")).status, 200);
    assert.equal((await fetch(url + "/api/v1/employees/1001/shift-days/2001")).status, 200);
  });
  for (const mode of ["authentication-error", "invalid-principal", "dependency-error"] as const) {
    const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
      async authenticate() {
        if (mode === "authentication-error") throw new SliceError("UNAUTHENTICATED");
        if (mode === "dependency-error") throw new Error("sensitive-provider-exception");
        return principal({ subject: "" });
      },
    }));
    await withServer(rt, async url => {
      await expectProblem(await fetch(url + listPath + atQuery),
        mode === "dependency-error" ? "DEPENDENCY_UNAVAILABLE" : "UNAUTHENTICATED",
        mode === "dependency-error" ? 503 : 401);
    });
  }
});

test("NEXT01-07 startup: explicit fixture env, exact grants, production/invalid/missing rejected", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(syntheticConfig), SHF_FIXTURE_ROWS: "[]",
    SHF_FIXTURE_PORT: "0", SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(data()) };
  for (const bad of [
    { ...env, SHF_CURRENT_SHIFTS_FIXTURE: "{}" },
    { ...env, SHF_CURRENT_SHIFTS_FIXTURE: "{" },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...syntheticConfig, syntheticOrgUnitIds: ["01"] }) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...syntheticConfig, deploymentClass: "production" }) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...syntheticConfig, businessTimeZone: "bad/zone" }) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...syntheticConfig, syntheticAdministratorEnabled: false }) },
    { ...env, SHF_FIXTURE_CONFIG: JSON.stringify(realConfig) },
  ]) await assert.rejects(startFromEnvironment(bad));
  const server = await startFromEnvironment(env);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const dto = await (await fetch(`http://127.0.0.1:${address.port}` + contextPath)).json();
    assert.ok(record(dto));
    assert.equal(dto.dataSource, "isolated-fixture");
    assert.equal(dto.businessTimeZone, syntheticConfig.businessTimeZone);
  } finally {
    const closed = once(server, "close");
    server.close(); server.closeAllConnections();
    await closed;
  }
});

test("NEXT01-09 HTTP: catalog/source exceptions and ambiguity sanitized; no retry/cache fallback", async () => {
  for (const variant of ["catalog", "rows", "invalid-options", "ambiguity"] as const) {
    let catalogCalls = 0, rowCalls = 0;
    const f = new CurrentFixtureReader(data([day(), day()]));
    const port: CurrentShiftReadPort = {
      async readMokedOptions(ids) {
        catalogCalls++;
        if (variant === "catalog") throw new SliceError("DEPENDENCY_UNAVAILABLE");
        if (variant === "invalid-options") return [{ code: "01", label: "", unitType: "G01" }];
        return f.readMokedOptions(ids);
      },
      async readRows(selection) {
        rowCalls++;
        if (variant === "rows") throw new Error("sensitive SQL source exception");
        return f.readRows(selection);
      },
    };
    const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
      async authenticate() { return principal(); },
    }), { reader: port });
    await withServer(rt, async url => {
      await expectProblem(await fetch(url + listPath + atQuery),
        variant === "catalog" ? "DEPENDENCY_UNAVAILABLE" :
          variant === "rows" ? "INTERNAL_ERROR" : variant === "invalid-options" ? "INVALID_SOURCE_DATA" :
            "AMBIGUOUS_CURRENT_SHIFT", variant === "catalog" ? 503 : 500);
      assert.equal(catalogCalls, 1);
      assert.equal(rowCalls, variant === "catalog" || variant === "invalid-options" ? 0 : 1);
    });
  }
});

test("NEXT01-08/11 HTTP: full 100-row page budget and concurrent purity, serialized UTF-8 bound", async () => {
  const f = data(Array.from({ length: 101 }, (_, i) => day({ shiftDayId: String(i + 1) })));
  const before = JSON.stringify(f);
  await withServer(await runtime(new CurrentFixtureReader(f)), async url => {
    const responses = await Promise.all(Array.from({ length: 6 }, () => fetch(url + listPath + atQuery + "&limit=100")));
    const dtos = await Promise.all(responses.map(async response => {
      assert.equal(response.status, 200); return response.json();
    }));
    const first = dtos[0];
    assert.ok(record(first) && Array.isArray(first.items) && record(first.page));
    assert.equal(first.items.length, 100);
    assert.equal(first.page.nextOffset, 100);
    for (const dto of dtos) assert.deepEqual(dto, dtos[0]);
  });
  assert.equal(JSON.stringify(f), before);
  assert.throws(() => serializeSuccess({ label: "א".repeat(CURRENT_RESPONSE_LIMIT_BYTES) },
    CURRENT_RESPONSE_LIMIT_BYTES), { code: "INTERNAL_ERROR" });
});

test("NEXT01-09/12 HTTP: one 5s budget, no late success/retry after authentication/catalog/read timeouts", async () => {
  for (const phase of ["auth", "catalog", "rows"] as const) {
    let calls = 0;
    let release: () => void = () => {};
    const pending = new Promise<void>(resolve => { release = resolve; });
    const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
      async authenticate() { if (phase === "auth") { calls++; await pending; } return principal(); },
    }), { reader: {
      async readMokedOptions() {
        if (phase === "catalog") { calls++; await pending; }
        return [{ code: "01", label: "Synthetic parent one", unitType: "G01" }];
      },
      async readRows() { calls++; await pending; return []; },
    } });
    await withServer(rt, async url => {
      try {
        const started = performance.now();
        await expectProblem(await fetch(url + listPath + atQuery), "DEPENDENCY_TIMEOUT", 503);
        assert.ok(performance.now() - started >= REQUEST_BUDGET_MS - 100);
        assert.equal(calls, 1);
      } finally { release(); }
      await nextTurn();
      assert.equal(calls, 1);
    });
  }
});

test("NEXT01-09/12 HTTP abort cancels response and suppresses subsequent read after slow authentication", async () => {
  let release: () => void = () => {}, entered: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { entered = resolve; });
  let reads = 0;
  const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() { entered(); await pending; return principal(); },
  }), { reader: {
    async readMokedOptions() { reads++; return []; }, async readRows() { reads++; return []; },
  } });
  await withServer(rt, async url => {
    const req = httpRequest(url + listPath + atQuery);
    req.on("error", () => {});
    req.end();
    await started;
    const closed = new Promise<void>(resolve => req.once("close", resolve));
    req.destroy();
    await closed;
    await nextTurn(); await nextTurn();
    release();
    await nextTurn(); await nextTurn();
    assert.equal(reads, 0);
  });

});

test("NEXT01-03/08 HTTP: current date uses real sampled instant in configured zone, freeze page as at-mode", async () => {
  const sampled: Date[] = [];
  const f = data([day({ baselineStartLocal: "0001-01-01T00:00:00", baselineEndLocal: "9999-12-31T23:59:59" })]);
  const rt = await createRuntime(syntheticConfig, new FixtureReader([]), undefined, {
    reader: new CurrentFixtureReader(f),
    clock: { now() { const value = new Date(); sampled.push(value); return value; } },
  });
  sampled.length = 0; // startup configuration validation is not a request
  await withServer(rt, async url => {
    const response = await fetch(url + listPath + "?mode=current&limit=1");
    assert.equal(response.status, 200);
    const dto = await response.json();
    assert.ok(record(dto) && record(dto.applied) && Array.isArray(dto.items));
    assert.equal(sampled.length, 1);
    const expected = clockMinute({ now: () => sampled[0] }, syntheticConfig.businessTimeZone, false);
    assert.equal(dto.applied.attendanceDate, expected.attendanceDate);
    assert.equal(dto.applied.currentTime, expected.currentTime);
    assert.equal(dto.items.length, 1);
    const page = await fetch(url + listPath + `?mode=at&attendanceDate=${expected.attendanceDate}&currentTime=${expected.currentTime}&limit=1&offset=1`);
    assert.equal(page.status, 200);
    assert.equal(sampled.length, 1);
    assert.equal((await fetch(url + listPath + "?mode=current&offset=0")).status, 200);
    assert.equal(sampled.length, 2);
  });
});

test("NEXT01-13 explicit sample handoff: row identifiers open unchanged detail; wrong context stays 404", async () => {
  const rt = await createRuntime(sampleConfig, new FixtureReader(sampleDetailRows), undefined,
    { reader: new CurrentFixtureReader(sampleCurrentFixture) });
  await withServer(rt, async url => {
    const list = await (await fetch(url + listPath + atQuery)).json();
    assert.ok(record(list) && Array.isArray(list.items));
    const item = list.items[0];
    assert.ok(record(item) && record(item.employee));
    const response = await fetch(url + `/api/v1/employees/${item.employee.employeeId}/shift-days/${item.shiftDayId}`);
    assert.equal(response.status, 200);
    const detail = await response.json();
    assert.ok(record(detail) && record(detail.effectiveShift));
    assert.equal(detail.employeeId, item.employee.employeeId);
    assert.equal(detail.shiftDayId, item.shiftDayId);
    assert.equal(detail.effectiveShift.startLocal, item.startLocal);
    assert.equal(detail.effectiveShift.endLocal, item.endLocal);
    await expectProblem(await fetch(url + `/api/v1/employees/1/shift-days/${item.shiftDayId}`),
      "SHIFT_DAY_NOT_FOUND", 404);
  });
});

test("NEXT01-09 HTTP: excessive serialized response rejected with sanitized problem, never partial page", async () => {
  const f = { ...data(Array.from({ length: 100 }, (_, i) => day({
    shiftDayId: String(i + 1), baselineActivityData: Array(100).fill("A").join(";"),
  }))), activities: [{ code: "A", label: "😀".repeat(256) }] };
  await withServer(await runtime(new CurrentFixtureReader(f)), async url => {
    await expectProblem(await fetch(url + listPath + atQuery + "&limit=100"), "INTERNAL_ERROR", 500);
  });
});
