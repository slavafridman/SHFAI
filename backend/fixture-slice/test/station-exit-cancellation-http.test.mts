import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import type { BackendPoolFactories } from "../server.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { createCancellationFixture } from "../station-exit-cancellation-fixture.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { request } from "node:http";
import { once } from "node:events";
import type { PrincipalV1 } from "../contracts.mts";
import { validateRuntimeConfig } from "../runtime-config.mts";
import { loadEnvironmentConfig } from "../environment-profiles.mts";
import { cancellationOrigins } from "../station-exit-cancellation-config.mts";
import { cancellationManifest } from "../station-exit-cancellation-fixture.mts";
import { record } from "../contract-validation.mts";
import { cancellationFixtureConfig as config, cancellationFixtureOrigin as origin,
  cancellationFixtureEnvironment as env } from "./station-exit-cancellation-fixture-environment.mts";
async function json(response: Response) {
  const value: unknown = await response.json(); assert.ok(record(value)); return value;
}
const neverFactories = () => {
  let calls = 0;
  const factories: BackendPoolFactories = { read: async () => { calls++; throw Error("No live read"); },
    native: async () => { calls++; throw Error("No live write"); } };
  return { factories, count: () => calls };
};
async function start(scenarioId = "ready") {
  const guard = neverFactories(), server = await startFromEnvironment(env(scenarioId), undefined, guard.factories);
  const address = server.address(); assert.ok(address && typeof address !== "string");
  assert.equal(address.address, "127.0.0.1"); assert.equal(guard.count(), 0);
  return { server, base: `http://127.0.0.1:${address.port}`, route: `http://127.0.0.1:${address.port}` +
    "/api/v1/employees/9001/shift-days/6201/station-exit-cancellation" };
}
async function instrumented() {
  const inputs = env(), f = createCancellationFixture(cancellationManifest(inputs.SHF_STATION_EXIT_CANCELLATION_FIXTURE!),
    "UTC", "T001");
  const runtime = { ...await createRuntime(config, new FixtureReader([]), undefined, {
    reader: new CurrentFixtureReader(JSON.parse(inputs.SHF_CURRENT_SHIFTS_FIXTURE!), ["T001"]), cancellation: f.app,
  }) };
  const calls = { context: 0, validate: 0, command: 0, auth: 0 };
  runtime.cancellation = {
    context: (...args) => { calls.context++; return f.app.context(...args); },
    validate: (...args) => { calls.validate++; return f.app.validate(...args); },
    command: (...args) => { calls.command++; return f.app.command(...args); },
  };
  const authenticate = runtime.authenticate;
  runtime.authenticate = input => { calls.auth++; return authenticate(input); };
  const server = createLoopbackServer(runtime, { stationExitCancellationOrigins: [origin] });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  return { server, runtime, calls, f, route: `http://127.0.0.1:${address.port}` +
    "/api/v1/employees/9001/shift-days/6201/station-exit-cancellation" };
}
test("actual startFromEnvironment fixture integrates exactly context/validations/commands", async () => {
  const s = await start();
  try {
    const identity = await json(await fetch(s.base + "/api/v1/identity"));
    assert.ok(record(identity.principal)); assert.ok(Array.isArray(identity.principal.capabilities));
    assert.equal(identity.principal.employeeId, null); assert.equal(identity.principal.synthetic, true);
    assert.equal(identity.principal.capabilities.length, 9);
    const c = await fetch(s.route + "/context", { headers: { Origin: origin } });
    assert.equal(c.status, 200); assert.equal(c.headers.get("cache-control"), "no-store");
    const context = await json(c); assert.ok(record(context.recorded)); assert.equal(context.mode, "isolated-fixture");
    assert.equal(context.eligibility, "eligible"); assert.equal(context.recorded.briefing, null);
    const vr = await fetch(s.route + "/validations", { method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(vr.status, 200); const v = await json(vr);
    const cmd = { commandId: randomUUID(), draft: {}, validationToken: v.validationToken, fingerprint: v.fingerprint,
      warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true } };
    const r = await fetch(s.route + "/commands", { method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
    assert.equal(r.status, 200); const receipt = await json(r); assert.ok(record(receipt.recorded));
    assert.equal(receipt.originalExitLocal, context.recorded.stationExitLocal);
    assert.equal(receipt.recorded.stationExitLocal, null); assert.equal(receipt.outcome, "simulated");
    assert.equal(receipt.commitAcknowledgedAt, null); assert.equal(receipt.readBackVerifiedAt, null);
    assert.equal(receipt.partnerCompletion, "not-invoked");
    const detail = await json(await fetch(s.base + "/api/v1/employees/9001/shift-days/6201"));
    assert.ok(record(detail.attendance)); assert.equal(detail.attendance.stationExitLocal, null);
    assert.equal(detail.attendance.stationArrivalLocal, context.recorded.stationArrivalLocal);
    const again = await fetch(s.route + "/commands", { method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ ...cmd, commandId: randomUUID() }) });
    assert.equal(again.status, 403); assert.equal((await json(again)).code, "LIVE_WRITES_DISABLED");
  } finally { await stopBackendServer(s.server); }
});
test("HTTP strict Origin/query/method/body guards, no consumption by rejection", async () => {
  const s = await start();
  try {
    for (const [suffix, options, status] of [
      ["/context", { headers: { Origin: "http://foreign.invalid" } }, 403],
      ["/context?x=1", { headers: { Origin: origin } }, 400],
      ["/context", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" }, 405],
      ["/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain" }, body: "{}" }, 415],
      ["/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: '{"reason":null}' }, 400],
      ["/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: '{"draft":{},"draft":{}}' }, 400],
      ["/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: " ".repeat(16385) }, 413],
    ] as const) {
      const r = await fetch(s.route + suffix, options); assert.equal(r.status, status);
      assert.equal((await json(r)).effect, "none");
    }
    const r = await fetch(s.route + "/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(r.status, 200);
  } finally { await stopBackendServer(s.server); }
});
test("actual context GET admits absent or allowlisted Origin without consuming command authority", async () => {
  const s = await start();
  try {
    for (const headers of [{}, { Origin: origin }]) {
      const r = await fetch(s.route + "/context", { headers });
      assert.equal(r.status, 200);
      const c = await json(r); assert.ok(record(c.recorded));
      assert.equal(c.eligibility, "eligible"); assert.ok(c.recorded.stationExitLocal);
      assert.equal("validationToken" in c, false);
    }
    const r = await fetch(s.route + "/validations", { method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(r.status, 200);
  } finally { await stopBackendServer(s.server); }
});
test("actual HTTP duplicate GET Origin is invalid and POST missing/foreign Origin never reaches ports", async () => {
  const s = await instrumented(), before = s.f.store.read();
  try {
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const r = request(s.route + "/context", { headers: { Origin: [origin, origin] } }, response => {
        response.resume(); response.once("end", () => resolve(response.statusCode));
      });
      r.once("error", reject); r.end();
    });
    assert.equal(status, 400);
    for (const suffix of ["/validations", "/commands"])
      for (const headers of [{ "Content-Type": "application/json" },
        { "Content-Type": "application/json", Origin: "http://foreign.invalid" }]) {
        const r = await fetch(s.route + suffix, { method: "POST", headers, body: "{}" });
        assert.equal(r.status, 403); assert.equal((await json(r)).code, "FORBIDDEN");
      }
    assert.deepEqual(s.calls, { context: 0, validate: 0, command: 0, auth: 0 });
    assert.deepEqual(s.f.store.read(), before); s.f.store.assertAvailable();
  } finally { await stopBackendServer(s.server); }
});
test("Origin-free GET still requires authentication and exact capability/employee/team scope", async () => {
  const s = await instrumented(), before = s.f.store.read(), authenticate = s.runtime.authenticate;
  try {
    s.runtime.authenticate = async () => { throw new StageArrivalError("UNAUTHENTICATED"); };
    let r = await fetch(s.route + "/context"); assert.equal(r.status, 401);
    assert.equal((await json(r)).code, "UNAUTHENTICATED"); assert.equal(s.calls.context, 0);
    s.runtime.authenticate = async () => { throw Error("Synthetic provider failure"); };
    r = await fetch(s.route + "/context"); assert.equal(r.status, 500);
    assert.equal(s.calls.context, 0); // No Administrator fallback.
    const principal = await authenticate({ authorization: null });
    const rejected: [PrincipalV1, number][] = [[{ ...principal, capabilities: principal.capabilities.slice(0, 7) }, 403],
      [{ ...principal, employeeId: "9001" }, 401],
      [{ ...principal, resourceScope: { orgUnitIds: ["T002"] } }, 404]];
    for (const [bad, status] of rejected) {
      s.runtime.authenticate = async () => bad;
      r = await fetch(s.route + "/context"); assert.equal(r.status, status);
    }
    s.runtime.authenticate = authenticate;
    r = await fetch(s.route.replace("/9001/", "/9002/") + "/context"); assert.equal(r.status, 404);
    assert.equal(s.calls.validate, 0); assert.equal(s.calls.command, 0);
    assert.deepEqual(s.f.store.read(), before); s.f.store.assertAvailable();
  } finally { await stopBackendServer(s.server); }
});
test("actual immutable GET rejects query/body and leaves all fixture facts unchanged", async () => {
  const s = await instrumented(), before = s.f.store.read();
  try {
    assert.equal((await fetch(s.route + "/context?x=1")).status, 400);
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const r = request(s.route + "/context", { headers: { "Content-Length": "2" } }, response => {
        response.resume(); response.once("end", () => resolve(response.statusCode));
      });
      r.once("error", reject); r.end("{}");
    });
    assert.equal(status, 400);
    for (const headers of [{}, { Origin: origin }])
      assert.equal((await fetch(s.route + "/context", { headers })).status, 200);
    assert.deepEqual(s.calls, { context: 2, validate: 0, command: 0, auth: 3 });
    assert.deepEqual(s.f.store.read(), before); s.f.store.assertAvailable();
  } finally { await stopBackendServer(s.server); }
});
for (const scenario of ["not-recorded", "early-deferred", "partner-required", "partner-unknown", "outcome-unknown"])
  test(`actual fixture HTTP ${scenario} reports honest source/outcome`, async () => {
    const s = await start(scenario);
    try {
      const vr = await fetch(s.route + "/validations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}" });
      const v = await json(vr);
      if (scenario !== "outcome-unknown") {
        assert.equal(vr.status, 409); assert.equal(v.effect, "none");
        assert.equal(v.code, scenario === "not-recorded" ? "EXIT_NOT_RECORDED" : "COMMAND_SCOPE_DEFERRED");
      } else {
        assert.equal(vr.status, 200);
        const r = await fetch(s.route + "/commands", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
          body: JSON.stringify({ commandId: randomUUID(), draft: {}, validationToken: v.validationToken, fingerprint: v.fingerprint,
            warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true } }) });
        assert.equal(r.status, 503); const p = await json(r);
        assert.equal(p.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(p.effect, "unknown"); assert.equal(p.nextAction, "reconcile");
      }
    } finally { await stopBackendServer(s.server); }
  });
test("new profiles grant read7+cancel2 or read7+cancel3; no old mutation grants", async () => {
  for (const c of [config, { ...config, attendanceStationExitCancellationMode: "test-oracle-controlled",
    dataSource: "oracle-read-only", oracleTestScopeConfirmed: true }]) {
    const p = await new SyntheticAdministratorProvider(c).authenticate({ authorization: "not-verified" });
    assert.equal(p.capabilities.length, c.dataSource === "isolated-fixture" ? 9 : 10);
    assert.equal(p.employeeId, null); assert.equal(p.synthetic, true);
    assert.ok(p.capabilities.slice(7).every(x => x.startsWith("attendance-station-exit-cancellation:")));
  }
});
test("strict enabled configuration rejects extras, peer omissions and production synthetic mode", () => {
  for (const patch of [{ extra: true }, { attendanceStationExitMode: "test-oracle-controlled" },
    { deploymentClass: "production" }, { syntheticAdministratorEnabled: false }, { realProviderId: "unauthorized" },
    { attendanceStationArrivalLateMode: undefined }, { attendanceStationExitCancellationMode: "fixture" }])
    assert.throws(() => validateRuntimeConfig({ ...config, ...patch }));
});
test("OFF rejects new private inputs and production/invalid environment reject before factories", async () => {
  const guard = neverFactories();
  for (const patch of [{ NODE_ENV: "production" }, { SHF_APP_ENV: "production" }, { SHF_APP_ENV: "invalid" },
    { SHF_NATIVE_EXIT_CANCELLATION_PASSWORD: "synthetic-never-used" },
    { SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: "{}" }, { SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED: "true" },
    { SHF_ORACLE_CONNECT_STRING: "SYNTHETIC_NEVER_RESOLVED" }, { SHF_STATION_EXIT_ORIGINS: "[]" }])
    await assert.rejects(startFromEnvironment({ ...env(), ...patch }, undefined, guard.factories));
  const off = { ...config, attendanceStationExitCancellationMode: "disabled" };
  assert.throws(() => loadEnvironmentConfig({ ...env(), SHF_FIXTURE_CONFIG: JSON.stringify(off) }));
  assert.equal(guard.count(), 0);
});
test("origin and manifest grammar are exact, bounds unchanged", () => {
  for (const origins of [[], ["*"], ["null"], [origin, origin], [origin + "/"], ["http://user@localhost:4200"],
    ["https://foreign.invalid"], Array.from({ length: 17 }, (_, i) => "http://localhost:" + (1000 + i))])
    assert.throws(() => cancellationOrigins(JSON.stringify(origins)));
  assert.throws(() => cancellationManifest(" ".repeat(16385)));
});
