import test from "node:test";
import assert from "node:assert/strict";
import { shiftManagementMode, validateShiftManagementEnvironment } from "../shift-management-config.mts";
import { SyntheticAdministratorProvider, createRuntime } from "../synthetic-identity.mts";
import { startFromEnvironment } from "../server.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { shiftManagementAccessPolicy } from "../access-policy.mts";
import { validatePrincipal } from "../contract-validation.mts";
import { managementPrincipal } from "./shift-management-helpers.mts";
const base = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["J01"], dataSource: "isolated-fixture",
  businessTimeZone: "UTC" };
const config = { ...base, shiftManagement: { mode: "isolated-fixture" } };
test("management modes default off and reject wrong/extra/mixed/provider/source configuration", () => {
  assert.equal(shiftManagementMode(base), "disabled");
  assert.equal(shiftManagementMode(config), "isolated-fixture");
  for (const patch of [
    { shiftManagement: {} }, { shiftManagement: { mode: "isolated-fixture", extra: true } },
    { shiftManagement: { mode: "on" } }, { authenticationMode: "real" }, { syntheticAdministratorEnabled: false },
    { deploymentClass: "production" }, { dataSource: "oracle-read-only" },
    { attendanceStageArrivalMode: "isolated-fixture" }, { attendanceStationExitMode: "test-oracle-controlled" },
  ]) assert.throws(() => shiftManagementMode({ ...config, ...patch }));
});
test("environment rejects stray opt-in and production/native DEV before factories/allowance IO", async () => {
  for (const env of [
    { SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "TRUE" }, { SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "true" },
    { SHF_NATIVE_SHIFT_BINDING: "{}" }, { SHF_SHIFT_MANAGEMENT_FIXTURE: "{}" },
  ]) assert.throws(() => validateShiftManagementEnvironment(base, env));
  assert.throws(() => validateShiftManagementEnvironment(config, { NODE_ENV: "production" }));
  assert.throws(() => validateShiftManagementEnvironment(config, { SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "true" }));
  const native = { ...config, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
    shiftManagement: { mode: "test-oracle-controlled" } };
  assert.throws(() => validateShiftManagementEnvironment(native, {
    SHF_APP_ENV: "dev", SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "true",
  }));
  let pools = 0;
  const factories = { read: async () => { pools++; throw Error("not permitted"); },
    native: async () => { pools++; throw Error("not permitted"); } };
  await assert.rejects(startFromEnvironment({
    SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(native), SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "true",
  }, undefined, factories), /Explicit management metadata binding required/);
  assert.equal(pools, 0);
  await assert.rejects(createRuntime(native, new FixtureReader([])), /Explicit concrete native management application required/);
});
test("enabled mode requires an actual matching application; no fallback or implicit provider", async () => {
  await assert.rejects(createRuntime(config, new FixtureReader([])), /Explicit isolated management application required/);
  assert.throws(() => new SyntheticAdministratorProvider({ ...config, authenticationMode: "real" }));
});
test("central policy enforces every management right independently, never Administrator role alone", () => {
  const enabled = managementPrincipal(), policy = shiftManagementAccessPolicy("isolated-fixture");
  validatePrincipal(enabled, "shift-management");
  for (const kind of ["create", "change", "cancel", "csv-create"] as const) policy.requireCommand(enabled, kind);
  policy.requireCsvPreview(enabled);
  const real = { ...enabled, provider: "real" as const, synthetic: false };
  for (const capability of enabled.capabilities.filter(cap => cap.startsWith("shift-management:"))) {
    const reduced = { ...real, capabilities: real.capabilities.filter(cap => cap !== capability) };
    if (capability === "shift-management:prepare")
      assert.throws(() => policy.requirePrepare(reduced), { code: "FORBIDDEN" });
    if (capability === "shift-management:create" || capability === "shift-management:csv-preview" ||
        capability === "shift-management:csv-apply")
      assert.throws(() => policy.requireCommand(reduced, "csv-create"), { code: "FORBIDDEN" });
    if (capability === "shift-management:change") assert.throws(() => policy.requireCommand(reduced, "change"), { code: "FORBIDDEN" });
    if (capability === "shift-management:cancel") assert.throws(() => policy.requireCommand(reduced, "cancel"), { code: "FORBIDDEN" });
  }
  assert.throws(() => policy.requirePrepare({ ...real, capabilities: [] }), { code: "FORBIDDEN" });
  assert.throws(() => shiftManagementAccessPolicy("disabled").requirePrepare(enabled), { code: "LIVE_WRITES_DISABLED" });
  assert.throws(() => validatePrincipal({ ...enabled, capabilities: [...enabled.capabilities].reverse() }, "shift-management"));
  assert.throws(() => validatePrincipal(enabled, "disabled"));
  assert.throws(() => shiftManagementAccessPolicy("test-oracle-controlled").requirePrepare(real), { code: "FORBIDDEN" });
});
