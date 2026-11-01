import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { CancellationOracleDouble, cancellationSelection as selection } from "./native-exit-cancellation-double.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { record } from "../contract-validation.mts";
import { writeFileSync, readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

test("actual native context GET without Origin stays READ ONLY: zero writer/SEQ/locks or authority changes", async () => {
  const d = new CancellationOracleDouble();
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  const authorityFiles = () => readdirSync(d.directory, { recursive: true }).map(String).sort()
    .map(name => [name, statSync(join(d.directory, name)).isFile() ? readFileSync(join(d.directory, name)) : null]);
  try {
    await d.certifyCancellation();
    server = await startFromEnvironment(d.environment(), undefined, {
      read: async () => d.readPool, native: async () => d.cancellationWritePool,
      resolveEndpoint: async () => { throw Error("No DNS allowed in isolated protocol test"); },
    });
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/employees/${selection.employeeId}/shift-days/${selection.shiftDayId}/station-exit-cancellation`;
    const rows = structuredClone(d.rows), files = authorityFiles(), eventStart = d.events.length, sqlStart = d.sql.length;
    for (const headers of [{}, { Origin: "http://127.0.0.1:4200" }]) {
      const r = await fetch(base + "/context", { headers }); assert.equal(r.status, 200);
      const c: unknown = await r.json(); assert.ok(record(c)); assert.equal(c.eligibility, "eligible");
      assert.equal("validationToken" in c, false);
    }
    assert.equal((await fetch(base + "/context", { headers: { Origin: "http://foreign.invalid" } })).status, 403);
    for (const suffix of ["/validations", "/commands"])
      for (const headers of [{ "Content-Type": "application/json" },
        { "Content-Type": "application/json", Origin: "http://foreign.invalid" }])
        assert.equal((await fetch(base + suffix, { method: "POST", headers, body: "{}" })).status, 403);
    assert.deepEqual(d.rows, rows); assert.deepEqual(authorityFiles(), files);
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    assert.equal(d.events.slice(eventStart).some(e => e.startsWith("write:")), false);
    assert.equal(d.sql.slice(sqlStart).some(s => s.source !== "read" || /NEXTVAL|FOR UPDATE|\bUPDATE\b/i.test(s.sql)), false);
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});

test("actual native startFromEnvironment + all three HTTP routes use dedicated protocol; fixtureClock cannot govern native", async () => {
  const d = new CancellationOracleDouble();
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    await d.certifyCancellation();
    let read = 0, write = 0, endpoint = 0;
    server = await startFromEnvironment(d.environment(), { now: () => new Date("0001-01-01T00:00:00.000Z") }, {
      read: async () => { read++; return d.readPool; }, native: async () => { write++; return d.cancellationWritePool; },
      resolveEndpoint: async () => { endpoint++; throw Error("No DNS allowed in isolated service-reference test"); },
    });
    assert.equal(read, 1); assert.equal(write, 1); assert.equal(endpoint, 0);
    const root = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const base = `${root}/api/v1/employees/${selection.employeeId}/shift-days/${selection.shiftDayId}/station-exit-cancellation`;
    const headers = { Origin: "http://127.0.0.1:4200", "Content-Type": "application/json" };
    const c = await fetch(base + "/context", { headers });
    assert.equal(c.status, 200); const context: unknown = await c.json();
    assert.ok(record(context)); assert.equal(context.dataSource, "oracle-test");
    assert.ok(record(context.serverTime)); assert.notEqual(context.serverTime.instant, "0001-01-01T00:00:00.000Z");
    const v = await fetch(base + "/validations", { method: "POST", headers, body: "{}" });
    assert.equal(v.status, 200); const validation: unknown = await v.json(); assert.ok(record(validation));
    const command = { commandId: randomUUID(), draft: {}, validationToken: validation.validationToken,
      fingerprint: validation.fingerprint, warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" },
      operationConfirmation: { accepted: true } };
    const r = await fetch(base + "/commands", { method: "POST", headers, body: JSON.stringify(command) });
    assert.equal(r.status, 200); const receipt: unknown = await r.json(); assert.ok(record(receipt));
    assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.partnerCompletion, "not-invoked");
    assert.equal(receipt.receiptPersistence, "none"); assert.ok(receipt.commitAcknowledgedAt); assert.ok(receipt.readBackVerifiedAt);
    assert.ok(!JSON.stringify(receipt).includes("synthetic-original-exit"));
    assert.ok(!JSON.stringify(receipt).includes("SHF_EMPLOYEES"));
    const again = await fetch(base + "/commands", { method: "POST", headers,
      body: JSON.stringify({ ...command, commandId: randomUUID() }) });
    assert.equal(again.status, 403);
    await stopBackendServer(server); server = undefined;
    assert.ok(d.events.includes("write:pool-close")); assert.ok(d.events.includes("read:pool-close"));
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
for (const fault of ["production", "invalid-env", "old-operation", "extra-binding", "not-nullable", "wrong-type",
  "missing-source", "missing-provider", "missing-certificate", "missing-coordinator", "missing-port", "duplicate-config", "consumed-allowance"])
  test(`native startup ${fault} rejects before pool factories`, async () => {
    const d = new CancellationOracleDouble();
    try {
      await d.certifyCancellation(); const env = d.environment();
      const b = JSON.parse(env.SHF_NATIVE_EXIT_CANCELLATION_BINDING!);
      if (fault === "production") env.NODE_ENV = "production";
      if (fault === "invalid-env") env.SHF_APP_ENV = "TEST";
      if (fault === "old-operation") b.operation = "native-station-exit-v0.1";
      if (fault === "extra-binding") b.metadataDigest = "0".repeat(64);
      if (fault === "not-nullable" || fault === "wrong-type") {
        const column = b.cancellationCertificate.metadataProof.proof[0].find((c: {columnName: string}) => c.columnName === "STATION_EXIT_USER");
        if (fault === "not-nullable") column.nullable = "N"; else column.dataType = "CHAR";
      }
      if (fault === "missing-source") delete b.expectedDaySource;
      if (fault === "missing-provider") delete b.metadataProvider;
      if (fault === "missing-certificate") delete b.cancellationCertificate;
      if (fault === "missing-coordinator") delete env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG;
      if (fault === "missing-port") delete env.SHF_ORACLE_PORT;
      if (fault === "duplicate-config") env.SHF_ORACLE_CONFIG = env.SHF_ORACLE_CONFIG!.replace(
        '"businessTimeZone":"UTC"', '"businessTimeZone":"UTC","businessTimeZone":"UTC"');
      if (fault === "consumed-allowance") writeFileSync(d.cancellationBinding.allowanceFile, "synthetic-consumed");
      env.SHF_NATIVE_EXIT_CANCELLATION_BINDING = JSON.stringify(b);
      let calls = 0;
      await assert.rejects(startFromEnvironment(env, undefined, { read: async () => { calls++; return d.readPool; },
        native: async () => { calls++; return d.cancellationWritePool; }, resolveEndpoint: async () => { calls++; return []; } }));
      assert.equal(calls, 0); assert.equal(d.events.includes("write:update"), false);
    } finally { d.dispose(); }
  });
test("native shutdown aborts/drains actual SQL before closing either owned pool", async () => {
  const d = new CancellationOracleDouble();
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  try {
    await d.certifyCancellation();
    server = await startFromEnvironment(d.environment(), undefined, { read: async () => d.readPool,
      native: async () => d.cancellationWritePool, resolveEndpoint: async () => [] });
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/employees/${selection.employeeId}/shift-days/${selection.shiftDayId}/station-exit-cancellation`;
    const headers = { Origin: "http://127.0.0.1:4200", "Content-Type": "application/json" };
    const validation: unknown = await (await fetch(base + "/validations", { method: "POST", headers, body: "{}" })).json();
    assert.ok(record(validation));
    let entered!: () => void, release!: () => void;
    const atLock = new Promise<void>(r => { entered = r; }), settled = new Promise<void>(r => { release = r; });
    d.hook = async event => {
      if (event === "write:cancellation:lock:SHF_ATTENDANCE") { entered(); await settled; }
      if (event === "write:break") release();
    };
    const request = fetch(base + "/commands", { method: "POST", headers, body: JSON.stringify({
      commandId: randomUUID(), draft: {}, validationToken: validation.validationToken, fingerprint: validation.fingerprint,
      warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true },
    }) }).catch(() => undefined);
    await atLock;
    await stopBackendServer(server); server = undefined; await request;
    assert.equal(d.events.includes("write:update"), false);
    const close = d.events.lastIndexOf("write:close:false");
    assert.ok(close >= 0); assert.ok(d.events.indexOf("write:pool-close", close) > close);
    assert.ok(d.events.indexOf("read:pool-close", close) > close);
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
