import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { record } from "../contract-validation.mts";
import { lateOracleDouble, lateDraft, lateSelection, lateConfig } from "./native-station-arrival-late-double.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { nativeLateStationArrivalAccessPolicy } from "../access-policy.mts";
const route = `/api/v1/employees/${lateSelection.employeeId}/shift-days/${lateSelection.shiftDayId}/station-arrival-late`;
const origin = "http://localhost:4521";
const post = (url: string, body: unknown) => fetch(url, { method: "POST",
  headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
async function object(response: Response, status = 200) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body: unknown = await response.json(); assert.ok(record(body)); return body;
}
test("late actual startup, Oracle identity R7+late3, strict HTTP, real systemClock not fixtureClock, PURE0 and ACK/full-readback", async () => {
  const f = lateOracleDouble(true); let server;
  try {
    server = await startFromEnvironment(f.environment(), { now: () => new Date("1900-01-01T00:00:00Z") }, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    const identity = await object(await fetch(url + "/api/v1/identity"));
    assert.equal(identity.dataSource, "oracle"); assert.ok(record(identity.principal));
    assert.deepEqual(identity.principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read",
      "my-shifts:read", "shift-items:read", "employee:read", "attendance:read",
      "attendance-station-arrival-late:prepare", "attendance-station-arrival-late:commit",
      "attendance-station-arrival-late:test-oracle-write"]);
    assert.equal(identity.principal.employeeId, null); assert.equal(identity.principal.synthetic, true);
    const context = await object(await fetch(url + route + "/context"));
    assert.ok(record(context.serverTime)); assert.notEqual(String(context.serverTime.instant).slice(0, 4), "1900");
    const before = f.d.sql.length;
    for (const [suffix, request, status] of [
      ["/context?now=0", () => fetch(url + route + "/context?now=0"), 400],
      ["/validations", () => post(url + route + "/validations", { ...lateDraft, minutes: "1" }), 400],
      ["/validations", () => post(url + route + "/validations", { ...lateDraft, lateRemark: "" }), 400],
      ["/validations", () => fetch(url + route + "/validations", { method: "POST",
        headers: { origin, "content-type": "application/json" }, body: '{"lateReasonCode":"1001","lateReasonCode":"1001","lateRemark":null}' }), 400],
      ["/context", () => fetch(url + route + "/context", { headers: { Origin: "" } }), 403],
    ] as const) { const error = await object(await request(), status); assert.equal(error.effect, "none", suffix); }
    assert.equal(f.d.sql.length, before);
    const v = await object(await post(url + route + "/validations", lateDraft));
    assert.equal(v.state, "warning-requires-confirmation"); assert.equal(v.confirmationRequired, true);
    assert.equal(existsSync(f.binding.allowanceFile), false);
    const cmd = { commandId: randomUUID(), draft: lateDraft, validationToken: v.validationToken, fingerprint: v.fingerprint,
      confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] }, operationConfirmation: { accepted: true } };
    assert.equal((await object(await post(url + route + "/commands", { ...cmd, confirmation: null }), 409)).code, "CONFIRMATION_REQUIRED");
    const receipt = await object(await post(url + route + "/commands", cmd));
    assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.receiptPersistence, "none");
    assert.ok(record(receipt.recorded)); assert.ok(record(receipt.recorded.stationLate));
    assert.equal(receipt.recorded.stationLate.remark, null); assert.equal(receipt.recorded.stationLate.minutes, "0");
    await object(await fetch(url + route + "/context"), 403);
    await stopBackendServer(server); server = undefined;
    await assert.rejects(startFromEnvironment(f.environment(), undefined, f.factories), { code: "LIVE_WRITES_DISABLED" });
    assert.equal(f.d.events.filter(e => e === "write:commit").length, 1);
  } finally { if (server) await stopBackendServer(server); f.d.dispose(); }
});
test("late rights and provider failures have no Administrator fallback; disabled/production/mixed/typo/read-account/startup scope deny prepool", async () => {
  const p = await new SyntheticAdministratorProvider(lateConfig).authenticate({ authorization: null });
  nativeLateStationArrivalAccessPolicy.requirePrepare(p); nativeLateStationArrivalAccessPolicy.requireCommit(p);
  for (const capability of p.capabilities.slice(7)) {
    assert.throws(() => nativeLateStationArrivalAccessPolicy.requireCommit({ ...p,
      capabilities: p.capabilities.filter(c => c !== capability) }));
  }
  for (const patch of [
    { SHF_APP_ENV: "dev" }, { SHF_APP_ENV: "TEST" }, { NODE_ENV: "production" },
    { SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED: "TRUE" }, { SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED: undefined },
    { SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: undefined }, { SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: "{}" },
    { SHF_NATIVE_LATE_BINDING: "{}" }, { SHF_STATION_ARRIVAL_LATE_ORIGINS: undefined },
    { SHF_ORACLE_USER: "WRONG_SYNTHETIC" },
    { SHF_ORACLE_CONFIG: JSON.stringify({ ...lateConfig, attendanceStageArrivalMode: "test-oracle-controlled" }) },
    { SHF_ORACLE_CONFIG: JSON.stringify({ ...lateConfig, attendanceStationArrivalLateMode: "disabled" }) },
    { SHF_ORACLE_CONFIG: JSON.stringify({ ...lateConfig, syntheticAdministratorEnabled: false }) },
    { SHF_ORACLE_CONFIG: JSON.stringify({ ...lateConfig, authenticationMode: "real" }) },
  ]) {
    const f = lateOracleDouble(true);
    try {
      await assert.rejects(startFromEnvironment({ ...f.environment(), ...patch }, undefined, f.factories));
      assert.equal(f.d.events.length, 0); assert.equal(existsSync(f.binding.allowanceFile), false);
    } finally { f.d.dispose(); }
  }
});
test("late actual HTTP shutdown owns uncooperative COMMIT/BREAK drain before either pool closes", async () => {
  const f = lateOracleDouble(true); let server;
  let enter!: () => void, release!: () => void;
  const reached = new Promise<void>(r => { enter = r; }), gate = new Promise<void>(r => { release = r; });
  try {
    server = await startFromEnvironment(f.environment(), undefined, f.factories);
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    const v = await object(await post(url + route + "/validations", lateDraft));
    f.d.hook = async event => { if (event === "write:commit") { enter(); await gate; } };
    const running = post(url + route + "/commands", { commandId: randomUUID(), draft: lateDraft,
      validationToken: v.validationToken, fingerprint: v.fingerprint,
      confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] }, operationConfirmation: { accepted: true } }).catch(() => null);
    await reached;
    const stopping = stopBackendServer(server);
    void stopping.catch(() => {});
    await new Promise(r => setTimeout(r, 20));
    assert.equal(f.d.events.some(e => e.endsWith("pool-close")), false);
    assert.equal(f.d.events.includes("write:break"), true);
    release(); await stopping; server = undefined;
    const response = await running;
    if (response) assert.notEqual(response.status, 200);
    assert.equal(f.d.events.filter(e => e.endsWith("pool-close")).length, 2);
    assert.equal(f.d.events.filter(e => e === "write:commit").length, 1);
  } finally { release?.(); if (server) await stopBackendServer(server); f.d.dispose(); }
});
