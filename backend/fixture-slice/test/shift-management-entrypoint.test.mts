import test from "node:test";
import assert from "node:assert/strict";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { record } from "../contract-validation.mts";
import { managementClock, managementFixtureSnapshot, createDraft } from "./shift-management-helpers.mts";

const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["J01"], dataSource: "isolated-fixture",
  businessTimeZone: "UTC", shiftManagement: { mode: "isolated-fixture" } };
const origin = "http://localhost:16040";
function environment(): NodeJS.ProcessEnv {
  return { SHF_APP_ENV: "test", SHF_FIXTURE_CONFIG: JSON.stringify(config), SHF_FIXTURE_PORT: "0",
    SHF_SHIFT_MANAGEMENT_ORIGINS: JSON.stringify([origin]),
    SHF_SHIFT_MANAGEMENT_FIXTURE: JSON.stringify({
      snapshot: managementFixtureSnapshot(),
      catalog: { mokedUnits: [{ code: "M01", label: "סינתטי", unitType: "G01" }],
        teams: [{ code: "J01", label: "סינתטי", unitType: "J01", parentMokedCode: "M01" }] },
    }) };
}
async function object(response: Response, status = 200) {
  assert.equal(response.status, status);
  const body: unknown = await response.json(); assert.ok(record(body)); return body;
}
test("actual environment entrypoint loads explicit management fixture and refreshes the same inquiry state", async () => {
  const server = await startFromEnvironment(environment(), managementClock());
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`, base = "/api/v1/employees/1/shift-management";
  try {
    const identity = await object(await fetch(url + "/api/v1/identity"));
    assert.ok(record(identity.principal) && Array.isArray(identity.principal.capabilities));
    assert.equal(identity.principal.capabilities.length, 14);
    const context = await object(await fetch(url + base + "/context"));
    assert.equal(context.mode, "isolated-fixture");
    const draft = createDraft();
    const prep = await object(await fetch(url + base + "/preparations", {
      method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ draft }),
    }));
    const receipt = await object(await fetch(url + base + "/commands", {
      method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({
        commandId: "00000000-0000-4000-8000-000000000001", draft, validationToken: prep.validationToken,
        fingerprint: prep.fingerprint, operationConfirmation: { accepted: true }, acknowledgedWarningCodes: [],
      }),
    }));
    assert.equal(receipt.outcome, "fixture-committed");
    assert.ok(Array.isArray(receipt.effects) && record(receipt.effects[0]) && record(receipt.effects[0].after));
    const id = receipt.effects[0].after.shiftDayId; assert.equal(typeof id, "string");
    const detail = await object(await fetch(url + `/api/v1/employees/1/shift-days/${id}`));
    assert.equal(detail.shiftDayId, id);
    const current = await object(await fetch(url + "/api/v1/current-shifts?mode=at&attendanceDate=2027-01-04&currentTime=09:30"));
    assert.ok(Array.isArray(current.items)); assert.equal(current.items.length, 1);
  } finally { await stopBackendServer(server); }
});
test("fixture entrypoint rejects implicit/mixed/unknown fixture data before pool/listener work", async () => {
  let pools = 0;
  const factories = { read: async () => { pools++; throw Error("Isolated unexpected pool"); },
    native: async () => { pools++; throw Error("Isolated unexpected pool"); } };
  for (const patch of [
    { SHF_SHIFT_MANAGEMENT_FIXTURE: undefined }, { SHF_SHIFT_MANAGEMENT_ORIGINS: undefined },
    { SHF_FIXTURE_ROWS: "[]" }, { SHF_NATIVE_SHIFT_BINDING: "{}" },
    { SHF_SHIFT_MANAGEMENT_FIXTURE: '{"snapshot":{},"catalog":{},"extra":true}' },
  ]) await assert.rejects(startFromEnvironment({ ...environment(), ...patch }, managementClock(), factories));
  assert.equal(pools, 0);
});
