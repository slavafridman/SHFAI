import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createLoopbackServer } from "../http-adapter.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { createIsolatedShiftManagement } from "../shift-management-fixture.mts";
import { record } from "../contract-validation.mts";
import { stopBackendServer } from "../server.mts";
import { managementFixtureSnapshot, managementClock, createDraft } from "./shift-management-helpers.mts";

const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["J01"], dataSource: "isolated-fixture",
  businessTimeZone: "UTC", shiftManagement: { mode: "isolated-fixture" } };
const origin = "http://localhost:16040";
const base = "/api/v1/employees/1/shift-management";
const jsonHeaders = { "content-type": "application/json", origin };
async function fixture() {
  const clock = managementClock(), f = createIsolatedShiftManagement(managementFixtureSnapshot(), clock, "UTC");
  const current = new CurrentFixtureReader({ catalog: {
    mokedUnits: [{ code: "M01", label: "סינתטי", unitType: "G01" }],
    teams: [{ code: "J01", label: "סינתטי", unitType: "J01", parentMokedCode: "M01" }],
  }, employees: [], days: [], attendance: [], activities: [], innerJobs: [], missingReasons: [] });
  const runtime = await createRuntime(config, new FixtureReader([]), undefined,
    { reader: current, clock, shiftManagement: f.app });
  const server = createLoopbackServer(runtime, { shiftManagementOrigins: [origin] });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  return { ...f, runtime, url: `http://127.0.0.1:${address.port}`,
    close: () => stopBackendServer(server) };
}
async function object(response: Response, status = 200) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const value: unknown = await response.json(); assert.ok(record(value)); return value;
}
function post(url: string, operation: string, body: unknown) {
  return fetch(url + base + "/" + operation, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
}
function command(preparation: Record<string, unknown>, draft: unknown, suffix: number) {
  assert.ok(Array.isArray(preparation.effects));
  const warningCodes = preparation.effects.flatMap(effect => {
    assert.ok(record(effect) && Array.isArray(effect.warningCodes)); return effect.warningCodes;
  });
  return { commandId: `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`, draft,
    validationToken: preparation.validationToken, fingerprint: preparation.fingerprint,
    operationConfirmation: { accepted: true }, acknowledgedWarningCodes: [...new Set(warningCodes)] };
}
test("actual canonical HTTP paths perform isolated CRUD and whole-file CSV without native claims", async () => {
  const f = await fixture();
  try {
    const identity = await object(await fetch(f.url + "/api/v1/identity"));
    assert.ok(record(identity.principal) && Array.isArray(identity.principal.capabilities));
    assert.equal(identity.principal.capabilities.length, 14);
    const before = f.inspect();
    assert.equal((await object(await fetch(f.url + base + "/context"))).eligibility, "supported");
    const draft = createDraft(), prepared = await object(await post(f.url, "preparations", { draft }));
    assert.deepEqual(f.inspect(), before);
    const receipt = await object(await post(f.url, "commands", command(prepared, draft, 1)));
    assert.equal(receipt.outcome, "fixture-committed"); assert.equal(receipt.partnerCompletion, "not-invoked");
    assert.ok(Array.isArray(receipt.effects) && record(receipt.effects[0]) && record(receipt.effects[0].after));
    const id = receipt.effects[0].after.shiftDayId; assert.equal(typeof id, "string");
    const changed = { kind: "change", shiftDayId: id, startLocal: "2027-01-04T10:00:00",
      endLocal: "2027-01-04T11:00:00", activityCode: "2", workLocation: "home",
      startReasonCode: "1", endReasonCode: "1" };
    const prep2 = await object(await post(f.url, "preparations", { draft: changed }));
    await object(await post(f.url, "commands", command(prep2, changed, 2)));
    const cancel = { kind: "cancel", shiftDayId: id, reasonCode: "C1", remark: null };
    const prep3 = await object(await post(f.url, "preparations", { draft: cancel }));
    await object(await post(f.url, "commands", command(prep3, cancel, 3)));
    assert.equal((await object(await fetch(f.url + base + `/shift-days/${id}/context`))).eligibility, "already-cancelled");
    const csv = "personalId,activityCode,date,location,startTime,endTime\n" +
      "001234567,1,05/01/2027,m,09:00,10:00\nX001234567,1,06/01/2027,h,09:00,10:00";
    const beforePreview = f.inspect();
    const preview = await object(await fetch(f.url + base + "/csv-previews",
      { method: "POST", headers: { origin, "content-type": "text/csv; charset=utf-8" }, body: csv }));
    assert.equal(preview.state, "ready"); assert.deepEqual(f.inspect(), beforePreview);
    assert.ok(!JSON.stringify(preview).includes("001234567"));
    const applied = await object(await post(f.url, "csv-commands", {
      commandId: "00000000-0000-4000-8000-000000000004", previewToken: preview.previewToken,
      fingerprint: preview.fingerprint, operationConfirmation: { accepted: true }, acknowledgedWarningCodes: [],
    }));
    assert.equal(applied.kind, "csv-create"); assert.ok(Array.isArray(applied.effects));
    assert.equal(applied.effects.length, 2);
    assert.equal(f.inspect().commits, 4); assert.equal(f.inspect().snapshot.days.length, 3);
    assert.equal(f.inspect().active, 0);
  } finally { await f.close(); }
});
test("HTTP invalid CSV returns complete non-applicable rows and all authority fields null", async () => {
  const f = await fixture();
  try {
    const body = "personalId,activityCode,date,location,startTime,endTime\n" +
      "001234568,1,05/01/2027,m,09:00,10:00\n001234567,1,31/02/2027,m,09:00,10:00";
    const preview = await object(await fetch(f.url + base + "/csv-previews", {
      method: "POST", headers: { origin, "content-type": "text/csv; charset=windows-1255" }, body,
    }));
    assert.equal(preview.state, "invalid");
    for (const key of ["previewToken", "fingerprint", "expiresAt"]) assert.equal(preview[key], null);
    assert.ok(Array.isArray(preview.rows)); assert.equal(preview.rows.length, 2);
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
    assert.equal(f.admission.inspect().preparations, 0);
  } finally { await f.close(); }
});
test("HTTP rejects provenance/media/unknown keys/query/method before effects", async () => {
  const f = await fixture();
  try {
    const cases: Array<{ path: string; method: string; headers: Record<string, string>; body?: string; status: number }> = [
      { path: "/preparations", method: "POST", headers: { "content-type": "application/json" }, body: "{}", status: 403 },
      { path: "/preparations", method: "POST", headers: { ...jsonHeaders, origin: "http://evil.invalid" }, body: "{}", status: 403 },
      { path: "/preparations", method: "POST", headers: { ...jsonHeaders, "sec-fetch-site": "cross-site" }, body: "{}", status: 403 },
      { path: "/csv-previews", method: "POST", headers: jsonHeaders, body: "{}", status: 415 },
      { path: "/csv-previews", method: "POST", headers: { origin, "content-type": "text/csv" }, body: "", status: 415 },
      { path: "/preparations", method: "POST", headers: { ...jsonHeaders, "content-encoding": "gzip" }, body: "{}", status: 415 },
      { path: "/preparations", method: "POST", headers: { ...jsonHeaders, "x-actor": "Administrator" }, body: "{}", status: 400 },
      { path: "/preparations", method: "POST", headers: jsonHeaders, body: '{"draft":{},"draft":{}}', status: 400 },
      { path: "/preparations", method: "POST", headers: jsonHeaders, body: JSON.stringify({ draft: createDraft(), extra: true }), status: 400 },
      { path: "/context?x=1", method: "GET", headers: {}, status: 400 },
      { path: "/context", method: "POST", headers: jsonHeaders, body: "{}", status: 405 },
      { path: "/csv-previews", method: "GET", headers: {}, status: 405 },
    ];
    for (const input of cases) {
      const response = await fetch(f.url + base + input.path, input);
      if (input.status === 405) assert.ok(response.headers.get("allow"));
      await object(response, input.status);
    }
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
    assert.equal(f.admission.inspect().preparations, 0);
  } finally { await f.close(); }
});
test("HTTP missing/out-of-scope employee/day share sanitized 404, malformed selectors are 400", async () => {
  const f = await fixture();
  try {
    for (const path of [base.replace("/1/", "/2/") + "/context", base + "/shift-days/99/context"])
      assert.equal((await object(await fetch(f.url + path), 404)).code, "SHIFT_DAY_NOT_FOUND");
    f.reviseForIsolatedTest(snapshot => { snapshot.employee.orgUnitId = "OTHER"; });
    assert.equal((await object(await fetch(f.url + base + "/context"), 404)).code, "SHIFT_DAY_NOT_FOUND");
    await object(await fetch(f.url + base.replace("/1/", "/01/") + "/context"), 400);
    assert.equal(f.inspect().sequenceCalls, 0);
  } finally { await f.close(); }
});
test("management synthetic provider is explicit; existing disabled provider remains read7", async () => {
  const enabled = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
  assert.equal(enabled.capabilities.length, 14);
  const { shiftManagement: _, ...disabled } = config;
  const old = await new SyntheticAdministratorProvider(disabled).authenticate({ authorization: null });
  assert.equal(old.capabilities.length, 7);
});
test("HTTP wrong-source receipt after an attempted command is UNKNOWN, never fixture-to-native success", async () => {
  const f = await fixture();
  try {
    const original = f.app.command.bind(f.app);
    f.app.command = async (...args) => {
      const actual = await original(...args);
      return { ...actual, outcome: "oracle-test-committed", dataSource: "oracle-test" };
    };
    const draft = createDraft(), preparation = await object(await post(f.url, "preparations", { draft }));
    const problem = await object(await post(f.url, "commands", command(preparation, draft, 1)), 503);
    assert.equal(problem.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(problem.effect, "unknown");
    assert.equal(f.inspect().commits, 1);
    assert.equal((await object(await post(f.url, "preparations", { draft }), 409)).code, "COMMAND_SCOPE_DEFERRED");
  } finally { await f.close(); }
});
test("HTTP JSON16KiB and CSV1MiB bounds reject oversized bodies without state", async () => {
  const f = await fixture();
  try {
    for (const [operation, type, size] of [
      ["preparations", "application/json", 16385],
      ["csv-previews", "text/csv; charset=utf-8", 1048577],
    ] as const) {
      const response = await fetch(f.url + base + "/" + operation, {
        method: "POST", headers: { origin, "content-type": type }, body: " ".repeat(size),
      });
      assert.equal((await object(response, 413)).code, "REQUEST_TOO_LARGE");
    }
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
  } finally { await f.close(); }
});
