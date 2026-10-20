import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { appEnvironment, loadEnvironmentConfig, RealAuthenticationNotConfiguredError } from "../environment-profiles.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import type { BackendPoolFactories } from "../server.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { oracleEnvironment } from "../runtime-config.mts";
import { config } from "./fixtures.mts";
import { NativeOracleDouble, nativeConfig } from "./native-stage-arrival-double.mts";

const dev = { ...config, deploymentClass: "local-development" };
const production = { deploymentClass: "production", authenticationMode: "real",
  syntheticAdministratorEnabled: false, realProviderId: "", dataSource: "oracle-read-only",
  businessTimeZone: "UTC", attendanceStageArrivalMode: "disabled" };

// QA-ENV-01 PURE BEGIN
// Self-contained regression block: runnable with only node:test, assert and
// environment-profiles imports while server/native sources have another owner.
for (const scenario of [
  { profile: "dev", deploymentClass: "local-development" },
  { profile: "test", deploymentClass: "isolated-test-demo" },
  { profile: undefined, deploymentClass: "local-development" },
  { profile: undefined, deploymentClass: "isolated-test-demo" },
]) {
  test(`QA-ENV-01 production NODE_ENV rejects ${scenario.profile ?? "profileless"}/${scenario.deploymentClass}`, () => {
    const fixture = { deploymentClass: scenario.deploymentClass,
      authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
      syntheticOrgUnitIds: ["DEMO"], dataSource: "isolated-fixture", businessTimeZone: "UTC" };
    assert.throws(() => loadEnvironmentConfig({
      NODE_ENV: "production", SHF_APP_ENV: scenario.profile, SHF_FIXTURE_CONFIG: JSON.stringify(fixture),
    }), { message: "NODE_ENV production conflicts with application environment" });
  });
}
test("QA-ENV-01 nonconflicting and missing NODE_ENV preserve explicit/profileless configuration", () => {
  for (const nodeEnv of [undefined, "development", "test", "production-like"]) {
    for (const scenario of [
      { profile: "dev", deploymentClass: "local-development" },
      { profile: "test", deploymentClass: "isolated-test-demo" },
      { profile: undefined, deploymentClass: "local-development" },
      { profile: undefined, deploymentClass: "isolated-test-demo" },
    ]) {
      const fixture = { deploymentClass: scenario.deploymentClass,
        authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
        syntheticOrgUnitIds: ["DEMO"], dataSource: "isolated-fixture", businessTimeZone: "UTC" };
      assert.deepEqual(loadEnvironmentConfig({
        NODE_ENV: nodeEnv, SHF_APP_ENV: scenario.profile, SHF_FIXTURE_CONFIG: JSON.stringify(fixture),
      }), fixture);
    }
  }
});
test("QA-ENV-01 aligned production still blocks missing real authentication", () => {
  const config = { deploymentClass: "production", authenticationMode: "real",
    syntheticAdministratorEnabled: false, realProviderId: "", dataSource: "oracle-read-only",
    businessTimeZone: "UTC", attendanceStageArrivalMode: "disabled" };
  for (const profile of ["production", undefined]) {
    assert.throws(() => loadEnvironmentConfig({
      NODE_ENV: "production", SHF_APP_ENV: profile, SHF_ORACLE_CONFIG: JSON.stringify(config),
    }), RealAuthenticationNotConfiguredError);
  }
});
test("QA-ENV-01 NODE_ENV never supplies a missing application configuration", () => {
  for (const nodeEnv of [undefined, "test", "production"])
    assert.throws(() => loadEnvironmentConfig({ NODE_ENV: nodeEnv }), /Explicit backend configuration required/);
});
// QA-ENV-01 PURE END

function environment(value: unknown, profile?: string, oracle = false): NodeJS.ProcessEnv {
  return { ...(profile === undefined ? {} : { SHF_APP_ENV: profile }),
    [oracle ? "SHF_ORACLE_CONFIG" : "SHF_FIXTURE_CONFIG"]: JSON.stringify(value),
    [oracle ? "SHF_ORACLE_PORT" : "SHF_FIXTURE_PORT"]: "0", SHF_FIXTURE_ROWS: "[]" };
}
function oracleEnv(value: unknown, profile?: string) {
  const e = environment(value, profile, true);
  delete e.SHF_FIXTURE_ROWS;
  return e;
}
function unreachableFactories() {
  let calls = 0;
  const factories: BackendPoolFactories = {
    read: async () => { calls++; throw Error("Unexpected read factory"); },
    native: async () => { calls++; throw Error("Unexpected write factory"); },
  };
  return { factories, calls: () => calls };
}
test("profile names are exact and absence does not select dev", () => {
  assert.equal(appEnvironment(undefined), undefined);
  for (const p of ["dev", "test", "production"] as const) assert.equal(appEnvironment(p), p);
  for (const p of ["", "DEV", "development", "prod", " test", "test ", "qa"])
    assert.throws(() => appEnvironment(p), /SHF_APP_ENV/);
  assert.throws(() => loadEnvironmentConfig({}), /Explicit backend/);
});
test("DEV and TEST preserve explicit fixture authentication and ordered 7/9 capabilities", async () => {
  for (const [p, c] of [["dev", dev], ["test", config]] as const) {
    for (const mode of ["disabled", "isolated-fixture"]) {
      const actual = loadEnvironmentConfig(environment({ ...c, attendanceStageArrivalMode: mode }, p));
      const identity = await new SyntheticAdministratorProvider(actual).authenticate({ authorization: null });
      assert.equal(identity.capabilities.length, mode === "disabled" ? 7 : 9);
      assert.equal(identity.employeeId, null);
    }
  }
});
test("profileless direct config is preserved, including controlled TEST 10", async () => {
  assert.deepEqual(loadEnvironmentConfig(environment(config)), config);
  assert.deepEqual(loadEnvironmentConfig(oracleEnv(nativeConfig)), nativeConfig);
  const identity = await new SyntheticAdministratorProvider(loadEnvironmentConfig(oracleEnv(nativeConfig))).authenticate({ authorization: null });
  assert.equal(identity.capabilities.length, 10);
});
test("explicit profile validates deploymentClass, source and synthetic opt-in", () => {
  for (const [p, c] of [["test", dev], ["dev", config], ["production", config]] as const)
    assert.throws(() => loadEnvironmentConfig(environment(c, p)), /mismatch/);
  assert.throws(() => loadEnvironmentConfig(oracleEnv({ ...nativeConfig,
    deploymentClass: "local-development", attendanceStageArrivalMode: "disabled" }, "dev")), /DEV requires/);
  assert.throws(() => loadEnvironmentConfig(oracleEnv({ ...nativeConfig,
    deploymentClass: "local-development" }, "dev")), /DEV requires/);
  assert.throws(() => loadEnvironmentConfig(environment({ ...dev, syntheticAdministratorEnabled: false }, "dev")));
  assert.throws(() => loadEnvironmentConfig(environment({ ...dev, authenticationMode: "real" }, "dev")));
});
test("TEST read source needs confirmation and independently supplied nonempty secrets", () => {
  const readonly = { ...nativeConfig, attendanceStageArrivalMode: "disabled" };
  assert.equal(loadEnvironmentConfig(oracleEnv(readonly, "test")).dataSource, "oracle-read-only");
  assert.throws(() => loadEnvironmentConfig(oracleEnv({ ...readonly, oracleTestScopeConfirmed: false }, "test")));
  assert.throws(() => oracleEnvironment({}));
  const placeholders = JSON.parse(readFileSync(new URL("../config-examples/test-secrets.example.json", import.meta.url), "utf8"));
  assert.throws(() => oracleEnvironment(placeholders), /unavailable/);
  const example = JSON.parse(readFileSync(new URL("../config-examples/test.example.json", import.meta.url), "utf8"));
  assert.throws(() => loadEnvironmentConfig(oracleEnv(example, "test")));
});
test("actual DEV and isolated TEST fixture startup stays loopback, without any Oracle factory", async () => {
  const guard = unreachableFactories();
  for (const [p, c] of [["dev", dev], ["test", config], [undefined, config]] as const) {
    const server = await startFromEnvironment(environment(c, p), undefined, guard.factories);
    try {
      const addr = server.address();
      assert.ok(addr && typeof addr !== "string");
      assert.equal(addr.address, "127.0.0.1");
      const response = await fetch(`http://127.0.0.1:${addr.port}/api/v1/identity`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(JSON.stringify(body).includes("attendance-stage-arrival:test-oracle-write"), false);
    } finally { await stopBackendServer(server); }
  }
  assert.equal(guard.calls(), 0);
});
test("DEV cannot enable native via operator flags or forged public profile fields", async () => {
  const guard = unreachableFactories();
  for (const extra of [
    { SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true" },
    { SHF_NATIVE_STAGE_BINDING: "{}" },
  ]) await assert.rejects(startFromEnvironment({ ...environment(dev, "dev"), ...extra }, undefined, guard.factories));
  // Browser labels/extra properties cannot substitute for the existing native mode/source gates.
  assert.throws(() => loadEnvironmentConfig(environment({ ...dev, appEnv: "test",
    attendanceStageArrivalMode: "test-oracle-controlled" }, "dev")));
  assert.equal(guard.calls(), 0);
});
test("TEST controlled native still requires independent operator enablement", async () => {
  const guard = unreachableFactories();
  assert.equal(loadEnvironmentConfig(oracleEnv(nativeConfig, "test")).dataSource, "oracle-read-only");
  await assert.rejects(startFromEnvironment(oracleEnv(nativeConfig, "test"), undefined, guard.factories),
    /Explicit native TEST write enablement/);
  assert.equal(guard.calls(), 0);
});
for (const patch of [
  { authenticationMode: "synthetic" }, { syntheticAdministratorEnabled: true },
  { syntheticOrgUnitIds: [] }, { dataSource: "isolated-fixture" },
  { dataSource: "unknown" }, { oracleTestScopeConfirmed: true },
  { attendanceStageArrivalMode: "isolated-fixture" },
  { attendanceStageArrivalMode: "test-oracle-controlled" },
]) test(`production rejects unsafe config ${JSON.stringify(patch)} before pools`, async () => {
  const guard = unreachableFactories();
  await assert.rejects(startFromEnvironment(oracleEnv({ ...production, ...patch }, "production"),
    undefined, guard.factories));
  assert.equal(guard.calls(), 0);
});
for (const extra of [
  { SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true" }, { SHF_NATIVE_STAGE_BINDING: "{}" },
  { SHF_NATIVE_STAGE_PASSWORD: "" }, { SHF_FIXTURE_ROWS: "[]" },
  { SHF_STAGE_ARRIVAL_FIXTURE: "{}" }, { SHF_STAGE_ARRIVAL_ORIGINS: '["http://localhost:4200"]' },
]) test(`production rejects TEST environment key ${Object.keys(extra)[0]} before pools`, async () => {
  const guard = unreachableFactories();
  await assert.rejects(startFromEnvironment({ ...oracleEnv(production, "production"), ...extra },
    undefined, guard.factories), /Production prohibits/);
  assert.equal(guard.calls(), 0);
});
test("clean production explicitly fails missing real provider, also without new profile", async () => {
  const guard = unreachableFactories();
  for (const profile of ["production", undefined]) {
    await assert.rejects(startFromEnvironment(oracleEnv(production, profile), undefined, guard.factories),
      RealAuthenticationNotConfiguredError);
  }
  assert.equal(guard.calls(), 0);
});
test("executable production diagnostic is explicit and contains no raw configuration", () => {
  const example = JSON.parse(readFileSync(new URL("../config-examples/production.example.json", import.meta.url), "utf8"));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../server.mts", import.meta.url))],
    { env: oracleEnv(example, "production"), encoding: "utf8", timeout: 10000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Backend startup rejected: Real authentication provider not configured\n");
});
test("unknown/mismatched profile fails before any Oracle factories", async () => {
  const guard = unreachableFactories();
  for (const profile of ["typo", "dev", "production"])
    await assert.rejects(startFromEnvironment(oracleEnv(nativeConfig, profile), undefined, guard.factories));
  assert.equal(guard.calls(), 0);
});
test("TEST native profile starts only with unchanged independent double opt-in and loopback origins", async () => {
  const d = new NativeOracleDouble(true);
  let reads = 0, writes = 0;
  const env = { ...oracleEnv(nativeConfig, "test"),
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
    SHF_ORACLE_PASSWORD: "synthetic-double-only", SHF_ORACLE_CLIENT_LIB_DIR: "unused-double",
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true", SHF_STAGE_ARRIVAL_ORIGINS: '["http://localhost:4521"]',
    SHF_NATIVE_STAGE_CONNECT_STRING: "CTIDBT_WFMT", SHF_NATIVE_STAGE_USER: d.binding.writeIdentity.user,
    SHF_NATIVE_STAGE_PASSWORD: "synthetic-double-only", SHF_NATIVE_STAGE_CLIENT_LIB_DIR: "unused-double",
    SHF_NATIVE_STAGE_BINDING: JSON.stringify(d.binding) };
  try {
    const server = await startFromEnvironment(env, undefined, {
      read: async () => { reads++; return d.readPool; },
      native: async () => { writes++; return d.writePool; },
    });
    try {
      const addr = server.address(); assert.ok(addr && typeof addr !== "string");
      assert.equal(addr.address, "127.0.0.1");
      const response = await fetch(`http://127.0.0.1:${addr.port}/api/v1/identity`);
      assert.equal(response.status, 200);
      assert.ok(JSON.stringify(await response.json()).includes("attendance-stage-arrival:test-oracle-write"));
      assert.equal(reads, 1); assert.equal(writes, 1);
      assert.equal(d.committed, false);
    } finally { await stopBackendServer(server); }
  } finally { d.dispose(); }
});
