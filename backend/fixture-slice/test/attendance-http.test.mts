import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { createLoopbackServer } from "../http-adapter.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { sampleCurrentFixture } from "../current-shifts-sample.mts";
import { sampleConfig, sampleAttendanceFixture, sampleAttendanceDetailRows } from "../attendance-sample.mts";
import { AttendanceFixtureReader } from "../attendance-fixture.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { SliceError } from "../errors.mts";
import { AttendanceError } from "../attendance-errors.mts";
import { serializeSuccess, CURRENT_RESPONSE_LIMIT_BYTES } from "../http-adapter.mts";

const valid = "/api/v1/attendance?attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00";
const runtime = () => createRuntime(sampleConfig, new FixtureReader(sampleAttendanceDetailRows), undefined,
  { reader: new CurrentFixtureReader(sampleCurrentFixture), attendanceReader: new AttendanceFixtureReader(sampleAttendanceFixture) });
async function serve(rt: SliceRuntime, work: (url: string) => Promise<void>) {
  const server = createLoopbackServer(rt); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); if (!address || typeof address === "string") throw Error();
  try { await work(`http://127.0.0.1:${address.port}`); } finally { await stopBackendServer(server); }
}
test("AT19-11 HTTP identity/context/list and own detail, exact privacy/source/no cache", async () => {
  await serve(await runtime(), async url => {
    for (const path of ["/api/v1/identity", "/api/v1/attendance/filter-context", valid]) {
      const r = await fetch(url + path, { headers: { "If-None-Match": "*" } });
      assert.equal(r.status, 200); assert.equal(r.headers.get("cache-control"), "no-store");
      assert.equal(r.headers.get("x-content-type-options"), "nosniff"); assert.equal(r.headers.get("etag"), null);
      const body = await r.json() as any;
      if (path.endsWith("identity")) { assert.equal(body.principal.employeeId, null); assert.equal(body.principal.capabilities.length, 7); }
      else assert.equal(body.dataSource, "isolated-fixture");
      if (path === valid) {
        assert.equal(body.items.length, 2);
        const row = body.items[0];
        assert.deepEqual(Object.keys(row).sort(), ["attendance","employee","planned","shiftDayId"]);
        assert.deepEqual(Object.keys(row.attendance).sort(), ["briefingRecorded","missingReasonCode","stageArrivalLocal","stationArrivalLocal","stationExitLocal"]);
        const detail = await fetch(url + `/api/v1/employees/${row.employee.employeeId}/shift-days/${row.shiftDayId}`);
        assert.equal(detail.status, 200);
        assert.equal((await detail.json() as any).shiftDayId, row.shiftDayId);
      }
    }
  });
});
test("AT19-03 HTTP strict raw decode/body/method/bounds, generic forbidden and independent capability", async () => {
  let reads = 0;
  const rt = await runtime();
  await serve({ ...rt, attendanceList: async (...args) => { reads++; return rt.attendanceList(...args); } }, async url => {
    for (const path of ["/api/v1/attendance/filter-context?", "/api/v1/attendance/filter-context?x=1",
      valid + "&x=private", valid + "&%74imeTo=10:00", valid + "&teamCodes[]=T01",
      valid + "&mokedCode=%FF", valid + "&x=%", valid + "&limit=01", valid + "&offset=10001",
      valid + "&workLocations=home,home", valid + "&innerJobCodes=0", valid + "&teamCodes=",
      valid + "&sort=name", valid + "&x=" + "a".repeat(8192)]) {
      const r = await fetch(url + path);
      assert.equal(r.status, 400, path.slice(0,130));
      assert.equal(r.headers.get("cache-control"), "no-store");
      const problem = await r.json() as any;
      assert.equal(problem.code, "INVALID_REQUEST"); assert.ok(problem.requestId);
      assert.equal(JSON.stringify(problem).includes("private"), false);
    }
    for (const method of ["POST","PUT","DELETE","HEAD","OPTIONS"]) {
      const r = await fetch(url + valid, { method });
      assert.equal(r.status, 405); assert.equal(r.headers.get("allow"), "GET");
    }
    const bodyStatus = await new Promise<number>((resolve, reject) => {
      const req = httpRequest(url + valid, { method: "GET", headers: { "Content-Length": 2 } }, res => {
        res.resume(); res.on("end", () => resolve(res.statusCode!));
      }); req.on("error", reject); req.end("{}");
    });
    assert.equal(bodyStatus, 400); assert.equal(reads, 0);
    assert.equal((await fetch(url + valid + "&teamCodes=private")).status, 403);
  });
  const p = await rt.authenticate({ authorization: null });
  await serve({ ...rt, authenticate: async () => ({ ...p, provider: "real", synthetic: false,
    roles: ["Administrator"], capabilities: p.capabilities.filter(c => c !== "attendance:read") }) }, async url => {
    assert.equal((await fetch(url + valid)).status, 403);
    assert.equal((await fetch(url + "/api/v1/attendance/filter-context")).status, 403);
    assert.equal((await fetch(url + valid + "&limit=0")).status, 400);
  });
});
test("AT19-10/11 dependency and provider errors never fallback, overflow fails closed", async () => {
  const rt = await runtime();
  for (const code of ["DEPENDENCY_UNAVAILABLE", "DEPENDENCY_TIMEOUT"] as const)
    await serve({ ...rt, attendanceList: async () => { throw new SliceError(code); } }, async url => {
      const r = await fetch(url + valid); assert.equal(r.status, 503); assert.equal((await r.json() as any).code, code);
    });
  await serve({ ...rt, authenticate: async () => { throw new Error("private"); } }, async url => {
    const r = await fetch(url + valid); assert.equal(r.status, 500);
    assert.equal((await r.text()).includes("private"), false);
  });
  assert.throws(() => serializeSuccess("x".repeat(CURRENT_RESPONSE_LIMIT_BYTES), CURRENT_RESPONSE_LIMIT_BYTES), { code: "INTERNAL_ERROR" });
  await serve({ ...rt, attendanceList: async () => ({ body: "x".repeat(CURRENT_RESPONSE_LIMIT_BYTES) }) as never }, async url => {
    const r = await fetch(url + valid); assert.equal(r.status, 500);
    assert.equal((await r.json() as any).code, "INTERNAL_ERROR");
  });
});
test("AT19-11 executable explicit SHF_ATTENDANCE_FIXTURE and mixed source rejection", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
    SHF_FIXTURE_ROWS: JSON.stringify(sampleAttendanceDetailRows), SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
    SHF_ATTENDANCE_FIXTURE: JSON.stringify(sampleAttendanceFixture) };
  const server = await startFromEnvironment(env);
  try {
    const address = server.address(); if (!address || typeof address === "string") throw Error();
    assert.equal((await fetch(`http://127.0.0.1:${address.port}` + valid)).status, 200);
  } finally { await stopBackendServer(server); }
  await assert.rejects(startFromEnvironment({ ...env, SHF_CURRENT_SHIFTS_FIXTURE: undefined }));
  await assert.rejects(startFromEnvironment({ ...env, SHF_ORACLE_CONFIG: JSON.stringify({ ...sampleConfig, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true }) }));
});
test("AT19-10 HTTP five-second budget suppresses late success and propagates disconnect cancellation", async () => {
  const rt = await runtime(); let aborted = 0;
  const slow: SliceRuntime = { ...rt, attendanceList: async (_p,_r,signal) => {
    await new Promise<void>((resolve) => {
      const stop = () => { aborted++; resolve(); };
      if (signal?.aborted) stop(); else signal?.addEventListener("abort", stop, { once: true });
    });
    return { items: [], private: "late success must not escape" } as never;
  } };
  await serve(slow, async url => {
    const response = await fetch(url + valid);
    assert.equal(response.status, 503);
    assert.equal((await response.json() as any).code, "DEPENDENCY_TIMEOUT");
    assert.equal(aborted, 1);
    const control = new AbortController();
    const pending = fetch(url + valid, { signal: control.signal });
    await new Promise(r => setTimeout(r, 30)); control.abort();
    await assert.rejects(pending);
    for (let i = 0; i < 30 && aborted < 2; i++) await new Promise(r => setTimeout(r,10));
    assert.equal(aborted, 2);
  });
});
test("AT19-11 problem payload is bounded to16KiB with sanitized overflow fallback", async () => {
  const rt = await runtime();
  await serve({ ...rt, attendanceList: async () => {
    throw new AttendanceError("INVALID_REQUEST", Array.from({ length: 1000 },
      () => ({ name: "query" as const, reason: "unsupported" as const })));
  } }, async url => {
    const response = await fetch(url + valid), text = await response.text();
    assert.equal(response.status, 500); assert.ok(Buffer.byteLength(text) <= 16384);
    assert.equal(JSON.parse(text).code, "INTERNAL_ERROR");
  });
});
