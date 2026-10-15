import { test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import type { Server } from "node:http";
import { once } from "node:events";
import { setImmediate as nextTurn } from "node:timers/promises";
import { createLoopbackServer, REQUEST_BUDGET_MS, serializeSuccess } from "../http-adapter.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import type { EmployeeShiftDayReader, PrincipalV1 } from "../contracts.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { SliceError } from "../errors.mts";
import { record } from "../contract-validation.mts";
import { startFromEnvironment } from "../server.mts";
import { config, row } from "./fixtures.mts";

const detail = "/api/v1/employees/1001/shift-days/2001";
const realConfig = {
  deploymentClass: "isolated-test-demo", authenticationMode: "real",
  syntheticAdministratorEnabled: false, realProviderId: "isolated-test-double",
  dataSource: "isolated-fixture", businessTimeZone: config.businessTimeZone,
};
const realPrincipal = (overrides: Partial<PrincipalV1> = {}): PrincipalV1 => ({
  subject: "isolated:test", displayName: "Isolated test double",
  provider: "real", synthetic: false, roles: ["Administrator"], capabilities: ["shift-day:read"],
  employeeId: null, resourceScope: { orgUnitIds: ["TEST-U"] }, ...overrides,
});
function baseUrl(server: Server) {
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}
async function withServer(runtime: SliceRuntime, run: (url: string) => Promise<void>) {
  const server = createLoopbackServer(runtime);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await run(baseUrl(server)); }
  finally {
    const closed = once(server, "close");
    server.close();
    server.closeAllConnections();
    await closed;
  }
}
async function problem(response: Response, code: string, status: number) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json/);
  const dto = await response.json();
  assert.ok(record(dto));
  assert.equal(dto.code, code);
  assert.equal(dto.type, `urn:shf:problem:${code}`);
  assert.equal(dto.status, status);
  assert.ok(typeof dto.requestId === "string");
  assert.match(dto.requestId, /^[0-9a-f-]{36}$/);
  assert.ok(!("employeeId" in dto) && !("effectiveShift" in dto) && !("detail" in dto));
  return dto;
}
test("HTTP identity and exact single detail DTO, UTF-8, source marker and no-store", async () => {
  const runtime = await createRuntime(config, new FixtureReader([row()]));
  await withServer(runtime, async url => {
    const identity = await fetch(`${url}/api/v1/identity`);
    assert.equal(identity.status, 200);
    assert.equal(identity.headers.get("cache-control"), "no-store");
    const dto = await identity.json();
    assert.deepEqual(dto, runtime.identity(await runtime.authenticate({ authorization: null })));
    assert.equal(dto.principal.employeeId, null);
    const response = await fetch(url + detail);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json; charset=utf-8$/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("etag"), null);
    const result = await response.json();
    assert.deepEqual(result, await runtime.read(dto.principal, "1001", "2001"));
    assert.equal(result.employee.firstName, "עובד");
  });
});
test("HTTP invalid identifiers, injection, separators, unsupported routes/method/query never read", async () => {
  let calls = 0;
  const runtime = await createRuntime(config, { async readByDayId() { calls++; return { kind: "not-found" }; } });
  await withServer(runtime, async url => {
    for (const target of [
      "/api/v1/employees//shift-days/2001", "/api/v1/employees/01/shift-days/2001",
      "/api/v1/employees/%201001/shift-days/2001", "/api/v1/employees/1e3/shift-days/2001",
      "/api/v1/employees/%D9%A1/shift-days/2001", "/api/v1/employees/1%2F2/shift-days/2001",
      "/api/v1/employees/1%5C2/shift-days/2001", "/api/v1/employees/1%252F2/shift-days/2001",
      "/api/v1/employees/1%27%20OR%201%3D1/shift-days/2001", "/api/v1/employees/%ZZ/shift-days/2001",
      "/api/v1/employees/1001/shift-days/10000000000", detail + "?unit=TEST-U",
      "/api/v1/identity?unused=true", detail + "/extra", "/api/v1/unknown",
    ]) {
      const dto = await problem(await fetch(url + target), "INVALID_REQUEST", 400);
      assert.equal(JSON.stringify(dto).includes("OR"), false);
    }
    await problem(await fetch(url + detail, { method: "POST" }), "INVALID_REQUEST", 400);
    assert.equal(calls, 0);
  });
});
test("nonempty GET body rejected without buffering or invoking reader, including identity", async () => {
  let calls = 0;
  const runtime = await createRuntime(config, { async readByDayId() { calls++; return { kind: "not-found" }; } });
  await withServer(runtime, async url => {
    for (const path of [detail, "/api/v1/identity"]) {
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const request = httpRequest(url + path, { method: "GET", headers: { "Content-Length": "4" } }, response => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", data => { body += data; });
          response.on("end", () => resolve({ status: response.statusCode!, body }));
        });
        request.on("error", reject);
        request.end("test");
      });
      assert.equal(response.status, 400);
      assert.deepEqual(JSON.parse(response.body).invalidParameters, [{ name: "body", reason: "unsupported" }]);
    }
    assert.equal(calls, 0);
  });
});
test("authentication precedes validation; provider unavailability and invalid principal never return identity", async () => {
  let reads = 0;
  const reader: EmployeeShiftDayReader = { async readByDayId() { reads++; return { kind: "not-found" }; } };
  for (const code of ["UNAUTHENTICATED", "DEPENDENCY_UNAVAILABLE"] as const) {
    const runtime = await createRuntime(realConfig, reader, async () => ({
      async authenticate() { throw new SliceError(code); },
    }));
    await withServer(runtime, async url => {
      await problem(await fetch(url + detail + "?invalid=1"), code, code === "UNAUTHENTICATED" ? 401 : 503);
      await problem(await fetch(url + "/api/v1/identity"), code, code === "UNAUTHENTICATED" ? 401 : 503);
    });
  }
  const invalid = await createRuntime(realConfig, reader, async () => ({
    async authenticate() { return { ...realPrincipal(), capabilities: ["*"] } as never; },
  }));
  await withServer(invalid, async url => {
    await problem(await fetch(url + "/api/v1/identity"), "UNAUTHENTICATED", 401);
  });
  assert.equal(reads, 0);
});
test("capability 403 before read and indistinguishable absence/context/unit 404", async () => {
  let calls = 0;
  const reader: EmployeeShiftDayReader = { async readByDayId() { calls++; return { kind: "not-found" }; } };
  const noCapability = await createRuntime(realConfig, reader, async () => ({
    async authenticate() { return realPrincipal({ capabilities: [] }); },
  }));
  await withServer(noCapability, async url => {
    await problem(await fetch(url + detail), "FORBIDDEN", 403);
    assert.equal(calls, 0);
  });
  let expected: unknown;
  for (const rows of [[], [row({ employeeId: "1002" })], [row({ orgUnitId: "OTHER" })], [row({ orgUnitId: null })]]) {
    await withServer(await createRuntime(config, new FixtureReader(rows)), async url => {
      const dto = await problem(await fetch(url + detail), "SHIFT_DAY_NOT_FOUND", 404);
      delete dto.requestId;
      if (!expected) expected = dto;
      assert.deepEqual(dto, expected);
    });
  }
});
test("source ambiguity/invalid data and reader errors sanitized; no automatic retry", async () => {
  const scenarios: Array<[EmployeeShiftDayReader, string, number]> = [
    [new FixtureReader([row(), row()]), "AMBIGUOUS_SHIFT_DAY", 500],
    [new FixtureReader([row({ changedSiteId: "0" })]), "INVALID_SOURCE_DATA", 500],
    [{ async readByDayId() { throw new SliceError("DEPENDENCY_UNAVAILABLE"); } }, "DEPENDENCY_UNAVAILABLE", 503],
    [{ async readByDayId() { throw new Error("sql secret employee 1001"); } }, "INTERNAL_ERROR", 500],
  ];
  for (const [reader, code, status] of scenarios) {
    let calls = 0;
    const runtime = await createRuntime(config, { async readByDayId(id) { calls++; return reader.readByDayId(id); } });
    await withServer(runtime, async url => {
      const dto = await problem(await fetch(url + detail), code, status);
      assert.equal(JSON.stringify(dto).includes("1001"), false);
      assert.equal(JSON.stringify(dto).includes("secret"), false);
      assert.equal(calls, 1);
    });
  }
});
test("large canonical employee/site IDs remain strings through HTTP", async () => {
  const id = "9".repeat(38);
  const runtime = await createRuntime(config, new FixtureReader([row({ employeeId: id, baselineSiteId: id, shiftDayId: "9999999999" })]));
  await withServer(runtime, async url => {
    const response = await fetch(`${url}/api/v1/employees/${id}/shift-days/9999999999`);
    assert.equal(response.status, 200);
    const dto = await response.json();
    assert.ok(record(dto));
    assert.ok(record(dto.effectiveShift));
    assert.equal(dto.employeeId, id);
    assert.equal(dto.effectiveShift.siteId, id);
    assert.equal(dto.shiftDayId, "9999999999");
  });
});
test("identity response limit is enforced over HTTP; unapproved provider fields never leak", async () => {
  const tooLarge = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() {
      return realPrincipal({ resourceScope: {
        orgUnitIds: Array.from({ length: 3000 }, (_, index) => `UNIT${index}`),
      } });
    },
  }));
  await withServer(tooLarge, async url => {
    await problem(await fetch(url + "/api/v1/identity"), "INTERNAL_ERROR", 500);
  });
  const extra = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() { return { ...realPrincipal({ roles: [] }), internalOnly: "never-public" }; },
  }));
  await withServer(extra, async url => {
    const response = await fetch(url + "/api/v1/identity");
    assert.equal(response.status, 200);
    const dto = await response.json();
    assert.ok(record(dto));
    assert.ok(record(dto.principal));
    assert.equal("internalOnly" in dto.principal, false);
    assert.deepEqual(dto.principal.roles, []);
  });
});
test("5-second reader budget emits 503, not late success; subsequent request succeeds", async () => {
  assert.equal(REQUEST_BUDGET_MS, 5000);
  let release!: (value: Awaited<ReturnType<EmployeeShiftDayReader["readByDayId"]>>) => void;
  const pending = new Promise<Awaited<ReturnType<EmployeeShiftDayReader["readByDayId"]>>>(resolve => { release = resolve; });
  let calls = 0;
  const runtime = await createRuntime(config, {
    async readByDayId() { calls++; return calls === 1 ? pending : { kind: "one", row: row() }; },
  });
  await withServer(runtime, async url => {
    await problem(await fetch(url + detail), "DEPENDENCY_TIMEOUT", 503);
    release({ kind: "one", row: row() });
    await nextTurn();
    assert.equal((await fetch(url + detail)).status, 200);
    assert.equal(calls, 2);
  });
});
test("provider shares total budget, including identity; late provider result cannot start read", async () => {
  let release!: (value: PrincipalV1) => void;
  const pending = new Promise<PrincipalV1>(resolve => { release = resolve; });
  let reads = 0;
  const runtime = await createRuntime(realConfig, {
    async readByDayId() { reads++; return { kind: "not-found" }; },
  }, async () => ({ async authenticate() { return pending; } }));
  await withServer(runtime, async url => {
    // Both requests consume their independent five-second budgets concurrently.
    await Promise.all([detail, "/api/v1/identity"].map(async path => {
      await problem(await fetch(url + path), "DEPENDENCY_TIMEOUT", 503);
    }));
    release(realPrincipal());
    await nextTurn();
    assert.equal(reads, 0);
  });
});
test("client abort while authenticating stops follow-on read and cleans listener/request", async () => {
  let release!: (value: PrincipalV1) => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const pending = new Promise<PrincipalV1>(resolve => { release = resolve; });
  let reads = 0;
  const runtime = await createRuntime(realConfig, {
    async readByDayId() { reads++; return { kind: "not-found" }; },
  }, async () => ({ async authenticate() { entered(); return pending; } }));
  await withServer(runtime, async url => {
    const request = httpRequest(url + detail);
    request.on("error", () => {}); // Intentional isolated client abort.
    request.end();
    await started;
    const closed = once(request, "close").catch(() => {});
    request.destroy();
    await closed;
    // Allow remote close notification to propagate before releasing provider.
    await new Promise(resolve => setTimeout(resolve, 20));
    release(realPrincipal());
    await nextTurn();
    assert.equal(reads, 0);
  });
});
test("client abort during a fixture read discards late success, never retries or mutates input", async () => {
  let entered!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const pending = new Promise<void>(resolve => { release = resolve; });
  const fixture = row();
  const before = structuredClone(fixture);
  let calls = 0;
  const runtime = await createRuntime(config, {
    async readByDayId() {
      calls++;
      entered();
      await pending;
      return { kind: "one", row: fixture };
    },
  });
  await withServer(runtime, async url => {
    const request = httpRequest(url + detail);
    let responses = 0;
    request.on("response", () => { responses++; });
    request.on("error", () => {});
    request.end();
    await started;
    const closed = once(request, "close").catch(() => {});
    request.destroy();
    await closed;
    await new Promise(resolve => setTimeout(resolve, 20));
    release();
    await nextTurn();
    assert.equal(responses, 0);
    assert.equal(calls, 1);
    assert.deepEqual(fixture, before);
  });
});
test("concurrent HTTP requests keep per-request principal/context/errors isolated; fixtures unchanged", async () => {
  const fixtures = [row(), row({ employeeId: "1002", shiftDayId: "2002" })];
  const before = structuredClone(fixtures);
  const runtime = await createRuntime(config, new FixtureReader(fixtures));
  await withServer(runtime, async url => {
    const results = await Promise.all(Array.from({ length: 20 }, async (_, index) => {
      const employee = index % 2 ? "1001" : "1002";
      const day = index % 2 ? "2001" : "2002";
      const response = await fetch(`${url}/api/v1/employees/${employee}/shift-days/${day}`);
      assert.equal(response.status, 200);
      const dto = await response.json();
      assert.ok(record(dto));
      assert.equal(dto.employeeId, employee);
      return problem(await fetch(`${url}/api/v1/employees/9999/shift-days/${day}`), "SHIFT_DAY_NOT_FOUND", 404);
    }));
    assert.equal(new Set(results.map(dto => dto.requestId)).size, 20);
    assert.deepEqual(fixtures, before);
  });
});
test("loopback enforced, response overflow rejected, explicit isolated executable config only", async () => {
  const runtime = await createRuntime(config, new FixtureReader([]));
  const server = createLoopbackServer(runtime);
  assert.throws(() => server.listen(0, "0.0.0.0"), /Loopback/);
  assert.throws(() => server.listen(0), /Loopback/);
  assert.throws(() => serializeSuccess({ oversized: "x".repeat(16 * 1024) }), { code: "INTERNAL_ERROR" });
  assert.equal(serializeSuccess({ exact: "raw" }), '{"exact":"raw"}');
  await assert.rejects(startFromEnvironment({
    SHF_FIXTURE_CONFIG: JSON.stringify(config), SHF_FIXTURE_ROWS: "[]",
  }));
  await assert.rejects(startFromEnvironment({
    SHF_FIXTURE_CONFIG: JSON.stringify(config), SHF_FIXTURE_ROWS: "[]", SHF_FIXTURE_PORT: "65536",
  }));
  const executable = await startFromEnvironment({
    SHF_FIXTURE_CONFIG: JSON.stringify(config), SHF_FIXTURE_ROWS: JSON.stringify([row()]), SHF_FIXTURE_PORT: "0",
  });
  try { assert.equal((await fetch(baseUrl(executable) + detail)).status, 200); }
  finally {
    const closed = once(executable, "close");
    executable.close();
    executable.closeAllConnections();
    await closed;
  }
});
