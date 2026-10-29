import test from "node:test";
import assert from "node:assert/strict";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { nativeRuntimeFixture } from "./native-shift-management-runtime-double.mts";
import { record } from "../contract-validation.mts";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { setImmediate as turn } from "node:timers/promises";
const origin = "http://localhost:16040", path = "/api/v1/employees/1/shift-management";
async function object(response: Response, status = 200) {
  assert.equal(response.status, status);
  const body: unknown = await response.json(); assert.ok(record(body)); return body;
}
async function prepare(url: string, f: Awaited<ReturnType<typeof nativeRuntimeFixture>>) {
  const csv = f.binding.operation.kind === "csv-create";
  const prepared = await object(await fetch(url + path + (csv ? "/csv-previews" : "/preparations"), {
    method: "POST", headers: { origin, "content-type": csv ? "text/csv; charset=utf-8" : "application/json" },
    body: csv ? f.csv : JSON.stringify({ draft: f.draft }),
  }));
  const warnings = csv ? [] : (() => {
    assert.ok(Array.isArray(prepared.effects));
    return prepared.effects.flatMap(effect => { assert.ok(record(effect) && Array.isArray(effect.warningCodes)); return effect.warningCodes; });
  })();
  return { commandId: "00000000-0000-4000-8000-000000000001", fingerprint: prepared.fingerprint,
    operationConfirmation: { accepted: true }, acknowledgedWarningCodes: warnings,
    ...(csv ? { previewToken: prepared.previewToken } : { validationToken: prepared.validationToken, draft: f.draft }) };
}
function command(url: string, f: Awaited<ReturnType<typeof nativeRuntimeFixture>>, body: unknown) {
  return fetch(url + path + (f.binding.operation.kind === "csv-create" ? "/csv-commands" : "/commands"), {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
for (const kind of ["create", "change", "cancel", "csv-create"] as const) {
  test(`actual native environment factory and HTTP ${kind} only return receipt after separate readback`, async () => {
    const f = await nativeRuntimeFixture(kind);
    let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
    try {
      server = await startFromEnvironment(f.env, undefined, f.factories);
      const address = server.address(); assert.ok(address && typeof address !== "string");
      const url = `http://127.0.0.1:${address.port}`;
      const context = await object(await fetch(url + path + "/context"));
      assert.equal(context.mode, "test-oracle-controlled"); assert.equal(context.dataSource, "oracle-test");
      const preparation = kind === "csv-create" ?
        await object(await fetch(url + path + "/csv-previews", { method: "POST",
          headers: { origin, "content-type": "text/csv; charset=utf-8" }, body: f.csv })) :
        await object(await fetch(url + path + "/preparations", { method: "POST",
          headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ draft: f.draft }) }));
      assert.equal(f.stats.commits, 0); assert.equal(f.stats.locks, 0); assert.equal(f.stats.sequence, 0);
      const warningCodes = kind === "csv-create" ? [] : (() => {
        assert.ok(Array.isArray(preparation.effects)); return preparation.effects.flatMap(effect => {
          assert.ok(record(effect) && Array.isArray(effect.warningCodes)); return effect.warningCodes;
        });
      })();
      const body = { commandId: "00000000-0000-4000-8000-000000000001",
        fingerprint: preparation.fingerprint, operationConfirmation: { accepted: true }, acknowledgedWarningCodes: warningCodes,
        ...(kind === "csv-create" ? { previewToken: preparation.previewToken } :
          { validationToken: preparation.validationToken, draft: f.draft }) };
      const receipt = await object(await fetch(url + path + (kind === "csv-create" ? "/csv-commands" : "/commands"),
        { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) }));
      assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.dataSource, "oracle-test");
      assert.equal(receipt.partnerCompletion, "not-invoked");
      assert.equal(f.stats.commits, 1); assert.equal(f.stats.active, 0);
      assert.ok(f.events.indexOf("read-acquire", f.events.indexOf("commit")) > f.events.indexOf("writer-close", f.events.indexOf("commit")));
      assert.ok(Array.isArray(receipt.effects) && record(receipt.effects[0]) && record(receipt.effects[0].after));
      const selectedContext = await object(await fetch(url + path + `/shift-days/${receipt.effects[0].after.shiftDayId}/context`));
      if (kind === "cancel") assert.equal(selectedContext.eligibility, "already-cancelled");
      else assert.ok(record(selectedContext.selected));
    } finally { if (server) await stopBackendServer(server); f.close(); }
  });
}
for (const fault of ["commitAck", "readbackIdentity", "readbackMismatch"] as const) {
  test(`actual native HTTP ${fault} produces UNKNOWN and persistent restart denial`, async () => {
    const f = await nativeRuntimeFixture("create");
    let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
    try {
      server = await startFromEnvironment(f.env, undefined, f.factories);
      const address = server.address(); assert.ok(address && typeof address !== "string");
      const url = `http://127.0.0.1:${address.port}`, body = await prepare(url, f);
      f.faults[fault] = true;
      const problem = await object(await command(url, f, body), 503);
      assert.equal(problem.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(problem.effect, "unknown");
      assert.equal(f.stats.commits, 1);
      assert.equal((await object(await fetch(url + path + "/preparations", { method: "POST",
        headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ draft: f.draft }) }), 409)).code,
      "COMMAND_SCOPE_DEFERRED");
      await stopBackendServer(server); server = undefined; f.faults[fault] = false;
      await assert.rejects(startFromEnvironment(f.env, undefined, f.factories), { code: "COMMAND_SCOPE_DEFERRED" });
      assert.equal(f.stats.commits, 1);
    } finally { if (server) await stopBackendServer(server); f.close(); }
  });
}
test("actual native CSV second-row failure rolls back every ordinary row and retains the consumed fence", async () => {
  const f = await nativeRuntimeFixture("csv-create");
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    server = await startFromEnvironment(f.env, undefined, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`, body = await prepare(url, f); f.faults.insert2 = true;
    const problem = await object(await command(url, f, body), 503);
    assert.equal(problem.effect, "rolled-back"); assert.equal(f.stats.commits, 0); assert.equal(f.stats.sequence, 2);
    assert.equal(f.data.SHF_EMPLOYEE_DAY.length, 0);
    const namespace: unknown = JSON.parse(readFileSync(join(f.directory, "namespace.json"), "utf8"));
    assert.ok(record(namespace)); assert.equal(namespace.state, "consumed");
  } finally { if (server) await stopBackendServer(server); f.close(); }
});
test("native CSV full9 mismatch is returned before any prefix/day mapping; preview consumes no authority", async () => {
  const f = await nativeRuntimeFixture("csv-create");
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    server = await startFromEnvironment(f.env, undefined, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`, prefixes = f.sqlCalls.filter(sql => sql.includes("shf49:prefix")).length;
    const preview = await object(await fetch(url + path + "/csv-previews", { method: "POST",
      headers: { origin, "content-type": "text/csv; charset=utf-8" }, body: f.csv.replaceAll("001234567", "001234568") }));
    assert.equal(preview.state, "invalid"); assert.equal(preview.previewToken, null);
    assert.equal(f.sqlCalls.filter(sql => sql.includes("shf49:prefix")).length, prefixes);
    assert.equal(f.stats.commits, 0); assert.equal(f.stats.sequence, 0); assert.equal(f.stats.locks, 0);
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { if (server) await stopBackendServer(server); f.close(); }
});
test("native unknown partner decision is a hard defer, never constructor-supplied not-required", async () => {
  const f = await nativeRuntimeFixture("create");
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    f.env.SHF_NATIVE_SHIFT_BINDING = JSON.stringify({ ...f.binding, review: null });
    server = await startFromEnvironment(f.env, undefined, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`, context = await object(await fetch(url + path + "/context"));
    assert.equal(context.eligibility, "deferred");
    const rejected = await object(await fetch(url + path + "/preparations", { method: "POST",
      headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ draft: f.draft }) }), 422);
    assert.equal(rejected.code, "BUSINESS_VALIDATION_FAILED");
    assert.equal(f.stats.sequence, 0); assert.equal(f.stats.locks, 0); assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { if (server) await stopBackendServer(server); f.close(); }
});
test("invalid native flag/auth/cert/scope/origin/endpoint inputs fail before pool or authority consumption", async () => {
  const f = await nativeRuntimeFixture("create");
  try {
    const changes: NodeJS.ProcessEnv[] = [
      { SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: undefined }, { SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "TRUE" },
      { NODE_ENV: "production" }, { SHF_SHIFT_MANAGEMENT_ORIGINS: undefined },
      { SHF_NATIVE_SHIFT_BINDING: JSON.stringify({ ...f.binding, extra: true }) },
      { SHF_NATIVE_SHIFT_BINDING: JSON.stringify({ ...f.binding, metadata: { ...f.binding.metadata, certificate: "bad" } }) },
      { SHF_NATIVE_SHIFT_BINDING: JSON.stringify({ ...f.binding, orgUnitId: "OTHER" }) },
      { SHF_ORACLE_CONFIG: JSON.stringify({ ...f.config, syntheticAdministratorEnabled: false }) },
    ];
    for (const patch of changes) await assert.rejects(startFromEnvironment({ ...f.env, ...patch }, undefined, f.factories));
    await assert.rejects(startFromEnvironment(f.env, undefined, { ...f.factories, resolveEndpoint: async () => ["127.0.0.2"] }));
    assert.equal(f.stats.readPools, 0); assert.equal(f.stats.nativePools, 0); assert.equal(f.stats.commits, 0);
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { f.close(); }
});
test("failed actual metadata observation closes both pools without listening or consuming authority", async () => {
  const f = await nativeRuntimeFixture("create");
  try {
    f.faults.metadata = true;
    await assert.rejects(startFromEnvironment(f.env, undefined, f.factories));
    assert.equal(f.stats.poolCloses, 2); assert.equal(f.stats.commits, 0); assert.equal(f.stats.sequence, 0);
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { f.close(); }
});
const deferred = () => { let resolve: () => void = () => {};
  const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; };
test("actual native server shutdown drains underlying SQL/BREAK before pool closure", async () => {
  const f = await nativeRuntimeFixture("create"), entered = deferred(), release = deferred();
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    server = await startFromEnvironment(f.env, undefined, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`, body = await prepare(url, f);
    f.pauseSql(async () => { entered.resolve(); await release.promise; });
    const pending = command(url, f, body).then(response => response.text(), () => "isolated transport lost");
    await entered.promise;
    const stopping = stopBackendServer(server); await turn();
    assert.equal(f.stats.active, 1); assert.equal(f.stats.poolCloses, 0);
    release.resolve(); await stopping; server = undefined; await pending;
    assert.equal(f.stats.active, 0); assert.equal(f.stats.poolCloses, 2); assert.ok(f.stats.breaks >= 1);
    assert.equal(f.stats.commits, 0);
  } finally { release.resolve(); if (server) await stopBackendServer(server); f.close(); }
});
