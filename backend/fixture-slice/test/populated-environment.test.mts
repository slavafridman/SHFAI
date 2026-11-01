import test from "node:test";
import assert from "node:assert/strict";
import { startFullTestEnvironment, createFullTestWorld, checkFullTestReadiness } from "../populated-server.mts";
import { stopBackendServer } from "../server.mts";
import { SyntheticAdministratorProvider, createRuntime } from "../synthetic-identity.mts";
import { fullConfiguration, fullOptionsFromEnvironment } from "../populated-config.mts";
import { fullInquiryPaths } from "../populated-world.mts";
import { createLoopbackServer } from "../http-adapter.mts";
import { once } from "node:events";
import { createServer } from "node:http";
import type { Socket } from "node:net";
import { driverImportAttempts } from "./populated-driver-tripwire.mts";
import type { CancellationFixtureManifestV1 } from "../station-exit-cancellation-private-contracts.mts";
import type { FullTestMode, FullTestOptions } from "../populated-config.mts";
import { record } from "../contract-validation.mts";

const options = { profile: "test", deploymentClass: "isolated-test-demo",
  syntheticAdministratorEnabled: true, port: 0, origins: ["http://localhost:4200"], environment: {} };
const q = "attendanceDate=2026-11-01&timeFrom=11:00&timeTo=11:00&teamCodes=T001&innerJobCodes=101&workLocations=site";
const readPaths = (employee = "1", day = "19001") => [
  "/api/v1/current-shifts?mode=at&attendanceDate=2026-11-01&currentTime=12:00",
  "/api/v1/shift-search?" + (employee === "9001" ? q.replace("&innerJobCodes=101&workLocations=site", "") : q),
  `/api/v1/my-shifts?mode=selected&employeeId=${employee}&dateFrom=2026-11-01&dateTo=2026-11-07`,
  `/api/v1/employees/${employee}/shift-days/${day}`,
  `/api/v1/employees/${employee}/shift-days/${day}/breaks-and-exceptions`,
  `/api/v1/employees/${employee}/operational-card`,
  "/api/v1/attendance?" + (employee === "9001" ? q.replace("&innerJobCodes=101&workLocations=site", "") : q),
];
test("FULLREAD processes seven populated inquiries from one synthetic world", async () => {
  const s = await startFullTestEnvironment("READONLY", options);
  try {
    for (const path of readPaths()) {
      const response = await fetch(s.url + path);
      const body = await response.text();
      assert.equal(response.status, 200, path + ": " + body);
      assert.match(body, /isolated-fixture/);
      assert.match(body, /"employeeId":"1"/);
      assert.match(body, /T001/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      if (!path.endsWith("operational-card")) assert.match(body, /19001/);
    }
  } finally { await stopBackendServer(s.server); }
});

function object(value: unknown): Record<string, unknown> { assert.ok(record(value)); return value; }
function array(value: unknown): unknown[] { assert.ok(Array.isArray(value)); return value; }
function string(value: unknown): string { assert.equal(typeof value, "string"); return value as string; }
function after(value: unknown) { return object(object(value).after); }
async function body(response: Response, status = 200): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  return object(value);
}
function url(s: Awaited<ReturnType<typeof startFullTestEnvironment>>, path: string) { return s.url + path; }
const headers = { origin: options.origins[0], "content-type": "application/json" };
const managementBase = "/api/v1/employees/1/shift-management";
function post(s: Awaited<ReturnType<typeof startFullTestEnvironment>>, path: string, input: unknown) {
  return fetch(url(s, path), { method: "POST", headers, body: JSON.stringify(input) });
}
function command(prep: Record<string, unknown>, draft: unknown, n: number) {
  return { commandId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, draft,
    validationToken: prep.validationToken, fingerprint: prep.fingerprint,
    operationConfirmation: { accepted: true },
    acknowledgedWarningCodes: [...new Set(array(prep.effects).flatMap(e => array(object(e).warningCodes)))] };
}
async function apply(s: Awaited<ReturnType<typeof startFullTestEnvironment>>, draft: unknown, n: number) {
  const before = s.world.management!.inspect();
  const prep = await body(await post(s, managementBase + "/preparations", { draft }));
  assert.deepEqual(s.world.management!.inspect(), before);
  return body(await post(s, managementBase + "/commands", command(prep, draft, n)));
}
async function projections(s: Awaited<ReturnType<typeof startFullTestEnvironment>>, id: string, date: string, end: string) {
  const query = `attendanceDate=${date}&timeFrom=09:00&timeTo=09:00&teamCodes=T001&innerJobCodes=101&workLocations=site`;
  const detail = await body(await fetch(url(s, `/api/v1/employees/1/shift-days/${id}`)));
  assert.ok(JSON.stringify(detail).includes(end));
  for (const path of [
    `/api/v1/current-shifts?mode=at&attendanceDate=${date}&currentTime=09:30`,
    "/api/v1/shift-search?" + query, "/api/v1/attendance?" + query,
    `/api/v1/my-shifts?mode=selected&employeeId=1&dateFrom=${date}&dateTo=${date}`,
    `/api/v1/employees/1/shift-days/${id}/breaks-and-exceptions`,
  ]) {
    const result = await body(await fetch(url(s, path)));
    const serialized = JSON.stringify(result);
    assert.ok(serialized.includes(`"shiftDayId":"${id}"`), path);
    assert.ok(serialized.includes(end), path + ": " + serialized);
    assert.ok(serialized.includes("isolated-fixture"));
  }
}
test("management real create/change/cancel/CSV refresh all seven relational readers", async () => {
  const s = await startFullTestEnvironment("management", options);
  try {
    for (const path of readPaths()) await body(await fetch(url(s, path)));
    const draft = { kind: "create", startLocal: "2026-11-05T09:00:00", endLocal: "2026-11-05T10:00:00",
      activityCode: "1", workLocation: "site", remark: null };
    const created = await apply(s, draft, 1);
    assert.equal(created.outcome, "fixture-committed");
    assert.equal(created.partnerCompletion, "not-invoked");
    const id = string(after(array(created.effects)[0]).shiftDayId);
    await projections(s, id, "2026-11-05", "2026-11-05T10:00:00");
    const changed = { kind: "change", shiftDayId: "19003", startLocal: "2026-11-04T09:00:00",
      endLocal: "2026-11-04T10:30:00", activityCode: "1", workLocation: "site",
      startReasonCode: null, endReasonCode: "1" };
    await apply(s, changed, 2);
    await projections(s, "19003", "2026-11-04", "2026-11-04T10:30:00");
    const cardBefore = await body(await fetch(url(s, "/api/v1/employees/1/operational-card")));
    await apply(s, { kind: "cancel", shiftDayId: "19003", reasonCode: "C1", remark: null }, 3);
    await body(await fetch(url(s, "/api/v1/employees/1/shift-days/19003")), 404);
    await body(await fetch(url(s, "/api/v1/employees/1/shift-days/19003/breaks-and-exceptions")), 404);
    for (const path of [
      "/api/v1/current-shifts?mode=at&attendanceDate=2026-11-04&currentTime=09:30",
      "/api/v1/shift-search?attendanceDate=2026-11-04&timeFrom=09:00&timeTo=09:00",
      "/api/v1/attendance?attendanceDate=2026-11-04&timeFrom=09:00&timeTo=09:00",
      "/api/v1/my-shifts?mode=selected&employeeId=1&dateFrom=2026-11-04&dateTo=2026-11-04",
    ]) assert.ok(!JSON.stringify(await body(await fetch(url(s, path)))).includes('"shiftDayId":"19003"'));
    assert.equal((await body(await fetch(url(s, managementBase + "/shift-days/19003/context")))).eligibility, "already-cancelled");
    const csv = "personalId,activityCode,date,location,startTime,endTime\n" +
      "001234567,1,06/11/2026,m,09:00,10:00\n001234567,1,07/11/2026,m,09:00,10:00";
    const preview = await body(await fetch(url(s, managementBase + "/csv-previews"), {
      method: "POST", headers: { origin: headers.origin, "content-type": "text/csv; charset=utf-8" }, body: csv,
    }));
    assert.equal(preview.state, "ready");
    const receipt = await body(await post(s, managementBase + "/csv-commands", {
      commandId: "00000000-0000-4000-8000-000000000004", previewToken: preview.previewToken,
      fingerprint: preview.fingerprint, operationConfirmation: { accepted: true }, acknowledgedWarningCodes: [],
    }));
    assert.equal(array(receipt.effects).length, 2);
    for (const effect of array(receipt.effects)) {
      const state = after(effect);
      await projections(s, string(state.shiftDayId), string(state.startLocal).slice(0, 10), string(state.endLocal));
    }
    assert.deepEqual(await body(await fetch(url(s, "/api/v1/employees/1/operational-card"))), cardBefore);
    const state = s.world.management!.inspect();
    assert.equal(state.commits, 4);
    assert.equal(new Set(state.snapshot.days.map(d => d.baseline.shiftDayId)).size, state.snapshot.days.length);
    const dependent = await body(await fetch(url(s, managementBase + "/shift-days/19001/context")));
    assert.notEqual(dependent.eligibility, "supported");
    const before = s.world.management!.inspect();
    const blocked = await post(s, managementBase + "/preparations", {
      draft: { kind: "cancel", shiftDayId: "19001", reasonCode: "C1", remark: null },
    });
    assert.notEqual(blocked.status, 200);
    assert.deepEqual(s.world.management!.inspect(), before);
  } finally { await stopBackendServer(s.server); }
});

test("C52 separate pre-recorded exit world clears only two originals and every read refreshes", async () => {
  const s = await startFullTestEnvironment("cancellation", options);
  const route = "/api/v1/employees/9001/shift-days/6201/station-exit-cancellation";
  try {
    for (const path of readPaths("9001", "6201")) await body(await fetch(url(s, path)));
    const original = s.world.cancellation!.store.read();
    const prep = await body(await post(s, route + "/validations", {}));
    assert.deepEqual(s.world.cancellation!.store.read(), original);
    const cmd = { commandId: "00000000-0000-4000-8000-000000000010", draft: {},
      validationToken: prep.validationToken, fingerprint: prep.fingerprint,
      warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" },
      operationConfirmation: { accepted: true } };
    const receipt = await body(await post(s, route + "/commands", cmd));
    assert.equal(receipt.outcome, "simulated");
    assert.equal(receipt.commitAcknowledgedAt, null); assert.equal(receipt.readBackVerifiedAt, null);
    assert.equal(receipt.partnerCompletion, "not-invoked");
    const after = s.world.cancellation!.store.read();
    const expected = structuredClone(original);
    expected.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = null;
    expected.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = null;
    assert.deepEqual(after, expected);
    const detail = await body(await fetch(url(s, "/api/v1/employees/9001/shift-days/6201")));
    assert.equal(object(detail.attendance).stationExitLocal, null);
    const attendance = await body(await fetch(url(s, readPaths("9001", "6201")[6])));
    assert.ok(!JSON.stringify(attendance).includes("11:59:50"));
    assert.ok(JSON.stringify(attendance).includes('"shiftDayId":"6201"'));
    await body(await post(s, route + "/commands", cmd), 403);
    await body(await post(s, route + "/validations", {}), 403);
    assert.deepEqual(s.world.cancellation!.store.read(), after);
  } finally { await stopBackendServer(s.server); }
});

for (const mode of ["READONLY", "management", "cancellation"] as const) {
  test(`${mode}: exact provider capability family and unsupported commands unavailable`, async () => {
    const s = await startFullTestEnvironment(mode, options);
    try {
      const identity = await body(await fetch(url(s, "/api/v1/identity")));
      const principal = object(identity.principal), capabilities = array(principal.capabilities);
      assert.equal(principal.employeeId, null);
      assert.equal(principal.synthetic, true);
      assert.equal(capabilities.length, mode === "READONLY" ? 7 : mode === "management" ? 14 : 9);
      assert.deepEqual(object(principal.resourceScope).orgUnitIds, ["T001"]);
      for (const name of ["attendance-stage-arrival", "attendance-station-arrival", "attendance-station-exit", "attendance-station-arrival-late"])
        assert.ok(!capabilities.includes(name + ":commit"));
      const bad = await post(s, "/api/v1/employees/1/shift-days/19001/stage-arrival/commands", {});
      assert.notEqual(bad.status, 200);
    } finally { await stopBackendServer(s.server); }
  });
}
for (const [name, changes] of [
  ["missing profile", { profile: undefined }], ["dev profile", { profile: "dev" }],
  ["production deployment", { deploymentClass: "production" }], ["disabled mock", { syntheticAdministratorEnabled: false }],
  ["invalid port", { port: 65536 }], ["nonloopback origin", { origins: ["https://example.invalid"] }],
  ["production NODE_ENV", { environment: { NODE_ENV: "production" } }],
  ...["SHF_NATIVE_CONFIG", "SHF_ORACLE_CONFIG", "SHF_ORACLE_PASSWORD", "SHF_NATIVE_COORDINATOR",
    "NODE_OPTIONS", "SHF_FIXTURE_ROWS", "SHF_SHIFT_MANAGEMENT_FIXTURE"].map(key =>
      [key, { environment: { [key]: "forbidden-synthetic-input" } }]),
] as Array<[string, Record<string, unknown>]>) {
  test(`preflight rejects ${name} before construction`, async () => {
    await assert.rejects(startFullTestEnvironment("READONLY", { ...options, ...changes } as FullTestOptions));
  });
}
test("default NONE / unknown modes fail explicitly", async () => {
  for (const mode of [undefined, "", "NONE", "all", "test-oracle-controlled"])
    await assert.rejects(startFullTestEnvironment(mode as FullTestMode, options));
});
test("read grammar/scope/paging negatives preserve problem contracts and zero effects", async () => {
  const s = await startFullTestEnvironment("management", options);
  try {
    const before = s.world.management!.inspect();
    for (const path of [
      "/api/v1/employees/2/shift-days/19001", "/api/v1/employees/1/shift-days/99999",
      "/api/v1/employees/1/shift-days/99999/breaks-and-exceptions", "/api/v1/employees/2/operational-card",
    ]) await body(await fetch(url(s, path)), 404);
    for (const path of [
      "/api/v1/current-shifts?mode=at&attendanceDate=2026-11-01&currentTime=12:00&native=true",
      "/api/v1/shift-search?" + q + "&attendanceDate=2026-11-01",
      "/api/v1/attendance?" + q + "&sort=garbage",
      "/api/v1/my-shifts?mode=selected&employeeId=1&dateFrom=2026-11-07&dateTo=2026-11-01",
      "/api/v1/employees/1/shift-days/19001/breaks-and-exceptions?limit=0",
    ]) await body(await fetch(url(s, path)), 400);
    for (const endpoint of ["shift-search", "attendance"]) {
      const response = await fetch(url(s, `/api/v1/${endpoint}?` + q.replace("T001", "T002")));
      await body(response, 403);
      const empty = await body(await fetch(url(s, `/api/v1/${endpoint}?` + q.replace("11:00&timeTo=11:00", "10:00&timeTo=10:00"))));
      assert.ok(!JSON.stringify(empty).includes('"shiftDayId":"19001"'));
    }
    const page = await body(await fetch(url(s, "/api/v1/employees/1/shift-days/19001/breaks-and-exceptions?limit=1&offset=1")));
    assert.ok(JSON.stringify(page).includes('"durationMinutes":"5"'));
    assert.deepEqual(s.world.management!.inspect(), before);
  } finally { await stopBackendServer(s.server); }
});
for (const mode of ["READONLY", "management", "cancellation"] as const) {
  test(`${mode}: readiness checks seven real ports plus four contexts, exact mode and driver zero`, async () => {
    const s = await startFullTestEnvironment(mode, options);
    try {
      const ready = await checkFullTestReadiness(s, mode);
      assert.deepEqual(ready, { mode, syntheticOnly: true, clock: "frozen-demo",
        probes: fullInquiryPaths(mode).map(path => ({ path, status: 200 })) });
      assert.equal(ready.probes.length, 11);
      assert.ok(ready.probes.every(p => p.status === 200));
      assert.deepEqual(ready.probes.map(p => p.path), fullInquiryPaths(mode));
      await assert.rejects(checkFullTestReadiness(s, mode === "READONLY" ? "management" : "READONLY"));
      assert.equal(driverImportAttempts(), 0);
    } finally { await stopBackendServer(s.server); }
  });
}
test("readiness rejects an unavailable port even though identity is healthy", async () => {
  const s = await startFullTestEnvironment("READONLY", options);
  try {
    const reader = s.world.options.shiftItemsReader!;
    const read = reader.read;
    reader.read = async () => { throw Error("Isolated unavailable port"); };
    await assert.rejects(checkFullTestReadiness(s, "READONLY"));
    reader.read = read;
  } finally { await stopBackendServer(s.server); }
});
for (const stalled of ["headers", "body"] as const) {
  test(`readiness total deadline aborts stalled inquiry ${stalled} and releases owned sockets`, { timeout: 3000 }, async t => {
    // Capture legitimate current facts, then serve them from an owned loopback
    // double. Only GETs: no fixture commands, state reset or native imports.
    const world = await startFullTestEnvironment("READONLY", options);
    const paths = ["/api/v1/identity", ...fullInquiryPaths("READONLY").slice(0, 2)];
    const replies: string[] = [];
    try {
      for (const path of paths) replies.push(await (await fetch(world.url + path)).text());
    } finally { await stopBackendServer(world.server); }
    const sockets = new Set<Socket>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let requests = 0, active = 0;
    let inquiryClosed: Promise<unknown> | undefined;
    const server = createServer((request, response) => {
      assert.equal(request.method, "GET");
      assert.equal(request.url, paths[requests]);
      const index = requests++;
      active++;
      response.once("close", () => { active--; });
      if (index === 2) {
        inquiryClosed = once(response, "close");
        if (stalled === "body") {
          response.writeHead(200, { "cache-control": "no-store", "x-content-type-options": "nosniff" });
          response.write(replies[index].slice(0, 20)); // Headers arrive; body never finishes.
        }
        return;
      }
      // Identity AND first inquiry consume the same budget before the stall.
      const timer = setTimeout(() => {
        timers.delete(timer);
        response.writeHead(200, { "cache-control": "no-store", "x-content-type-options": "nosniff" });
        response.end(replies[index]);
      }, 20);
      timers.add(timer);
    });
    server.on("connection", socket => {
      sockets.add(socket);
      socket.once("close", () => { sockets.delete(socket); });
    });
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const started = { mode: "READONLY" as const, url: `http://127.0.0.1:${address.port}` };
    const start = performance.now();
    const signal = stalled === "body" ? AbortSignal.timeout(100) : undefined;
    try {
      await assert.rejects(checkFullTestReadiness(started, "READONLY", signal),
        error => error instanceof DOMException && error.name === "TimeoutError" &&
          (signal === undefined || error === signal.reason));
      const elapsed = performance.now() - start;
      t.diagnostic(`Total readiness elapsed: ${elapsed.toFixed(1)}ms; budget: ${signal ? 100 : 1000}ms`);
      assert.ok(elapsed < (signal ? 250 : 1500), `Total elapsed ${elapsed}ms`);
      assert.equal(requests, 3);
      assert.ok(inquiryClosed);
      await inquiryClosed; // Abort closes the pending HTTP request, not just its await.
      assert.equal(active, 0);
      const controller = new AbortController(), reason = Error("Owned readiness cancellation");
      controller.abort(reason);
      await assert.rejects(checkFullTestReadiness(started, "READONLY", controller.signal),
        error => error === reason);
      assert.equal(requests, 3); // No Administrator/success fallback or new probe.
      assert.equal(driverImportAttempts(), 0);
    } finally {
      for (const timer of timers) clearTimeout(timer);
      const closed = [...sockets].map(socket => once(socket, "close"));
      await stopBackendServer(server);
      await Promise.all(closed);
      assert.equal(sockets.size, 0);
      assert.equal(active, 0);
      t.diagnostic("Owned cleanup: 0 sockets, 0 active HTTP requests");
    }
  });
}
test("authentication errors never become Administrator responses", async () => {
  const s = await startFullTestEnvironment("management", options);
  const original = SyntheticAdministratorProvider.prototype.authenticate;
  try {
    const before = s.world.management!.inspect();
    SyntheticAdministratorProvider.prototype.authenticate = async () => { throw Error("Synthetic provider fault"); };
    const failed = await body(await fetch(url(s, "/api/v1/identity")), 503);
    assert.ok(!JSON.stringify(failed).includes("Administrator"));
    const commandResponse = await post(s, managementBase + "/preparations", {
      draft: { kind: "create", startLocal: "2026-11-05T09:00:00", endLocal: "2026-11-05T10:00:00",
        activityCode: "1", workLocation: "site", remark: null },
    });
    assert.equal(commandResponse.status, 503);
    assert.deepEqual(s.world.management!.inspect(), before);
  } finally {
    SyntheticAdministratorProvider.prototype.authenticate = original;
    await stopBackendServer(s.server);
  }
});
test("management whole-file rollback preserves originals, receipts and sequence gaps", async () => {
  const s = await startFullTestEnvironment("management", options);
  try {
    const f = s.world.management!, original = f.inspect();
    const csv = "personalId,activityCode,date,location,startTime,endTime\n" +
      "001234567,1,06/11/2026,m,09:00,10:00\n001234567,1,07/11/2026,m,09:00,10:00";
    const preview = await body(await fetch(url(s, managementBase + "/csv-previews"), {
      method: "POST", headers: { origin: headers.origin, "content-type": "text/csv; charset=windows-1255" }, body: csv,
    }));
    f.failNext("insert-2");
    const result = await post(s, managementBase + "/csv-commands", {
      commandId: "00000000-0000-4000-8000-000000000020", previewToken: preview.previewToken,
      fingerprint: preview.fingerprint, operationConfirmation: { accepted: true }, acknowledgedWarningCodes: [],
    });
    assert.notEqual(result.status, 200);
    const after = f.inspect();
    assert.deepEqual(after.snapshot, original.snapshot);
    assert.equal(after.commits, 0); assert.equal(after.rollbacks, 1);
    assert.equal(after.sequenceCalls, 2); assert.equal(after.active, 0);
    await checkFullTestReadiness(s, "management");
  } finally { await stopBackendServer(s.server); }
});
test("invalid CSV one row denies the whole file without sequence or snapshot effects", async () => {
  const s = await startFullTestEnvironment("management", options);
  try {
    const before = s.world.management!.inspect();
    const csv = "personalId,activityCode,date,location,startTime,endTime\n" +
      "001234567,1,06/11/2026,m,09:00,10:00\n001234567,1,31/02/2026,m,09:00,10:00";
    const preview = await body(await fetch(url(s, managementBase + "/csv-previews"), {
      method: "POST", headers: { origin: headers.origin, "content-type": "text/csv; charset=utf-8" }, body: csv,
    }));
    assert.equal(preview.state, "invalid"); assert.equal(preview.previewToken, null);
    assert.equal(array(preview.rows).length, 2);
    assert.deepEqual(s.world.management!.inspect(), before);
  } finally { await stopBackendServer(s.server); }
});
async function cancellationScenario(scenario: CancellationFixtureManifestV1["scenarioId"]) {
  const w = await createFullTestWorld("cancellation", scenario);
  const runtime = await createRuntime(fullConfiguration("cancellation", options).config, w.detail, undefined,
    { ...w.options, clock: w.clock, cancellation: w.cancellation!.app });
  const server = createLoopbackServer(runtime, { stationExitCancellationOrigins: options.origins });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  return { server, world: w, url: `http://127.0.0.1:${address.port}`,
    route: "/api/v1/employees/9001/shift-days/6201/station-exit-cancellation" };
}
for (const scenario of ["not-recorded", "authority-consumed", "partner-required", "partner-unknown", "early-deferred"] as const) {
  test(`C52 ${scenario} never fabricates command authority or resets state`, async () => {
    const s = await cancellationScenario(scenario);
    try {
      const before = s.world.cancellation!.store.read();
      const response = await fetch(s.url + s.route + "/validations",
        { method: "POST", headers, body: "{}" });
      assert.notEqual(response.status, 200);
      assert.deepEqual(s.world.cancellation!.store.read(), before);
      assert.equal(driverImportAttempts(), 0);
    } finally { await stopBackendServer(s.server); }
  });
}
test("C52 expiry invalidates held authority without reset; rejected consent/origin has zero effects", async () => {
  const s = await startFullTestEnvironment("cancellation", options);
  const route = "/api/v1/employees/9001/shift-days/6201/station-exit-cancellation";
  try {
    const before = s.world.cancellation!.store.read();
    const prep = await body(await post(s, route + "/validations", {}));
    const cmd = { commandId: "00000000-0000-4000-8000-000000000030", draft: {},
      validationToken: prep.validationToken, fingerprint: prep.fingerprint,
      warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true } };
    const denied = await post(s, route + "/commands", { ...cmd, operationConfirmation: { accepted: false } });
    assert.notEqual(denied.status, 200);
    const foreign = await fetch(url(s, route + "/commands"), { method: "POST",
      headers: { ...headers, origin: "http://localhost:4444" }, body: JSON.stringify(cmd) });
    assert.equal(foreign.status, 403);
    assert.deepEqual(s.world.cancellation!.store.read(), before);
    s.world.cancellation!.advanceClock(30001);
    const expired = await body(await post(s, route + "/commands", cmd), 409);
    assert.equal(expired.code, "STALE_PREPARATION");
    assert.deepEqual(s.world.cancellation!.store.read(), before);
  } finally { await stopBackendServer(s.server); }
});
test("C52 isolated unknown outcome retains consumption; refreshed reads cannot manufacture a receipt", async () => {
  const s = await cancellationScenario("outcome-unknown");
  try {
    const prep = await body(await fetch(s.url + s.route + "/validations", { method: "POST", headers, body: "{}" }));
    const cmd = { commandId: "00000000-0000-4000-8000-000000000040", draft: {},
      validationToken: prep.validationToken, fingerprint: prep.fingerprint,
      warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true } };
    const response = await fetch(s.url + s.route + "/commands", { method: "POST", headers, body: JSON.stringify(cmd) });
    const unknown = await body(response, 503);
    assert.equal(unknown.code, "COMMAND_OUTCOME_UNKNOWN");
    assert.equal(unknown.effect, "unknown");
    const detail = await body(await fetch(s.url + "/api/v1/employees/9001/shift-days/6201"));
    assert.equal(object(detail.attendance).stationExitLocal, null);
    const replay = await fetch(s.url + s.route + "/commands", { method: "POST", headers, body: JSON.stringify(cmd) });
    await body(replay, 403);
    assert.equal(driverImportAttempts(), 0);
  } finally { await stopBackendServer(s.server); }
});
test("strict CLI env parser rejects conflicting/unknown values and has no default", () => {
  const valid = { SHF_FULL_MODE: "READONLY", SHF_FULL_PROFILE: "test",
    SHF_FULL_DEPLOYMENT_CLASS: "isolated-test-demo", SHF_FULL_SYNTHETIC_ADMINISTRATOR: "true",
    SHF_FULL_PORT: "0", SHF_FULL_ORIGINS: JSON.stringify(options.origins), NODE_ENV: "test" };
  const parsed = fullOptionsFromEnvironment(valid);
  fullConfiguration(parsed.mode, parsed.options);
  for (const key of Object.keys(valid)) {
    const invalid = { ...valid, [key]: "invalid" };
    assert.throws(() => { const p = fullOptionsFromEnvironment(invalid); fullConfiguration(p.mode, p.options); });
  }
  assert.throws(() => fullOptionsFromEnvironment({}));
  assert.throws(() => fullConfiguration("management", { ...options, environment: valid }));
  assert.equal(driverImportAttempts(), 0);
});
