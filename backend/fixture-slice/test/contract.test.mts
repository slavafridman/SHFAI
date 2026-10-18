import { test } from "node:test";
import assert from "node:assert/strict";
import { decimalId, localDateTime, validateConfig, validateIds, validatePrincipal, validateRaw } from "../contract-validation.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { SliceError, toProblem } from "../errors.mts";
import { startFromEnvironment } from "../server.mts";
import { config, row } from "./fixtures.mts";

test("exact synthetic principal, exact four approved capabilities and no employee impersonation", async () => {
  const provider = new SyntheticAdministratorProvider(config);
  const principal = await provider.authenticate({ authorization: null });
  assert.deepEqual(principal, {
    subject: "synthetic:administrator", provider: "synthetic", synthetic: true,
    displayName: "Synthetic Administrator (local/isolated only)",
    roles: ["Administrator"],     capabilities: ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read"], employeeId: null,
    resourceScope: { orgUnitIds: ["TEST-U"] },
  });
  validatePrincipal(principal);
  principal.resourceScope.orgUnitIds.push("NO");
  assert.deepEqual((await provider.authenticate({ authorization: "ignored-synthetic-only" })).resourceScope.orgUnitIds, ["TEST-U"]);
});

test("fail-closed startup configuration matrix", async () => {
  const invalid = [
    undefined, null, {}, { ...config, deploymentClass: undefined },
    { ...config, deploymentClass: "development" }, { ...config, authenticationMode: undefined },
    { ...config, deploymentClass: { toString: () => "isolated-test-demo" } },
    { ...config, authenticationMode: { toString: () => "synthetic" } },
    { ...config, authenticationMode: "other" }, { ...config, syntheticAdministratorEnabled: undefined },
    { ...config, syntheticAdministratorEnabled: "true" }, { ...config, syntheticAdministratorEnabled: false },
    { ...config, deploymentClass: "production" },
    { ...config, deploymentClass: "production", authenticationMode: "real", realProviderId: "test-double" },
    { ...config, syntheticOrgUnitIds: undefined }, { ...config, syntheticOrgUnitIds: [] },
    { ...config, syntheticOrgUnitIds: ["*"] }, { ...config, syntheticOrgUnitIds: ["TEST-U", "TEST-U"] },
    { ...config, syntheticOrgUnitIds: ["123456789"] }, { ...config, syntheticOrgUnitIds: [3] },
    { ...config, syntheticOrgUnitIds: Array.from({ length: 101 }, (_, i) => `U${i}`) },
    { ...config, dataSource: "oracle" }, { ...config, dataSource: undefined },
    { ...config, businessTimeZone: undefined }, { ...config, businessTimeZone: "bad/zone" },
    { ...config, businessTimeZone: "+03:00" }, { ...config, realProviderId: "ignored" },
  ];
  for (const candidate of invalid) assert.throws(() => validateConfig(candidate));
  assert.equal(validateConfig(config).businessTimeZone, "Asia/Jerusalem");
  assert.equal(validateConfig({ ...config, deploymentClass: "local-development" }).deploymentClass, "local-development");
  await assert.rejects(startFromEnvironment({}));
  await assert.rejects(startFromEnvironment({ SHF_FIXTURE_CONFIG: "{" }));
});
export const realConfig = {
  deploymentClass: "isolated-test-demo", authenticationMode: "real",
  syntheticAdministratorEnabled: false, realProviderId: "isolated-test-double",
  dataSource: "isolated-fixture", businessTimeZone: "Asia/Jerusalem",
};
test("disabled synthetic mode requires installed real provider; initialization failure has no fallback", async () => {
  const reader = new FixtureReader([]);
  await assert.rejects(createRuntime(realConfig, reader));
  await assert.rejects(createRuntime(realConfig, reader, async () => undefined));
  await assert.rejects(createRuntime(realConfig, reader, async () => { throw new Error("isolated init failure"); }));
  assert.throws(() => new SyntheticAdministratorProvider(realConfig));
  assert.throws(() => validateConfig({ ...realConfig, realProviderId: "" }));
  assert.throws(() => validateConfig({ ...realConfig, syntheticAdministratorEnabled: true }));
  assert.throws(() => validateConfig({ ...realConfig, realProviderId: undefined }));
  assert.throws(() => validateConfig({ ...realConfig, deploymentClass: "production", syntheticAdministratorEnabled: true }));
  await assert.rejects(startFromEnvironment({ SHF_FIXTURE_CONFIG: JSON.stringify(realConfig) }));
});
test("real test-double seam never falls back after authentication/provider/principal errors", async () => {
  const reader = new FixtureReader([]);
  for (const code of ["UNAUTHENTICATED", "DEPENDENCY_UNAVAILABLE", "DEPENDENCY_TIMEOUT"] as const) {
    const runtime = await createRuntime(realConfig, reader, async () => ({
      async authenticate() { throw new SliceError(code); },
    }));
    await assert.rejects(runtime.authenticate({ authorization: null }), { code });
  }
  const broken = await createRuntime(realConfig, reader, async () => ({
    async authenticate() { throw new Error("sensitive provider detail"); },
  }));
  await assert.rejects(broken.authenticate({ authorization: null }), { code: "DEPENDENCY_UNAVAILABLE" });
  const synthetic = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
  const wrongMode = await createRuntime(realConfig, reader, async () => ({ async authenticate() { return synthetic; } }));
  await assert.rejects(wrongMode.authenticate({ authorization: null }), { code: "UNAUTHENTICATED" });
  const invalid = await createRuntime(realConfig, reader, async () => ({
    async authenticate() { return {} as never; },
  }));
  await assert.rejects(invalid.authenticate({ authorization: null }), { code: "UNAUTHENTICATED" });
});
test("principal runtime validation rejects wildcard, duplicate, inconsistent and unapproved claims", async () => {
  const p = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
  for (const change of [
    { subject: "" }, { provider: "fake" }, { synthetic: false }, { employeeId: "1001" },
    { provider: { toString: () => "real" } },
    { roles: [] }, { roles: ["Administrator", "Administrator"] },
    { capabilities: [] }, { capabilities: ["*"] }, { capabilities: ["shift-day:read", "shift-day:read"] },
    { resourceScope: { orgUnitIds: ["*"] } }, { resourceScope: { orgUnitIds: ["U", "U"] } },
    { resourceScope: { orgUnitIds: [] } },
    { subject: "x".repeat(129) }, { displayName: "pretend" },
  ]) assert.throws(() => validatePrincipal({ ...p, ...change }), { code: "UNAUTHENTICATED" });
});
test("canonical identifiers preserve decimal precision and reject bad formats", () => {
  assert.ok(decimalId("9".repeat(38)));
  assert.ok(decimalId("9999999999", 10));
  for (const value of ["", "0", "01", " 1", "1 ", "+1", "-1", "1.0", "1e2", "١", "１", "1/2", "1\\2", "1' OR 1=1", 1, null, "9".repeat(39)]) {
    assert.equal(decimalId(value), false);
    assert.throws(() => validateIds(value, "2001"), { code: "INVALID_REQUEST" });
  }
  assert.throws(() => validateIds("1001", "10000000000"), { code: "INVALID_REQUEST" });
});
test("calendar validation independent of host timezone, including leap days and range endpoints", () => {
  for (const v of ["0001-01-01T00:00:00", "9999-12-31T23:59:59", "2000-02-29T01:02:03", "2026-10-25T01:30:00"])
    assert.ok(localDateTime(v), v);
  for (const v of ["0000-01-01T00:00:00", "1900-02-29T00:00:00", "2026-02-30T00:00:00",
    "2026-00-01T00:00:00", "2026-13-01T00:00:00", "2026-01-00T00:00:00",
    "2026-01-01T24:00:00", "2026-01-01T00:60:00", "2026-01-01T00:00:60",
    "2026-01-01T00:00:00Z", "2026-01-01T00:00:00.000", new Date()])
    assert.equal(localDateTime(v), false);
});
test("raw source validation never truncates, repairs or coerces invalid fields", () => {
  validateRaw(row({ firstName: "😀".repeat(40), baselineSiteId: "9".repeat(38) }));
  for (const change of [
    { employeeId: "01" }, { baselineSiteId: "0" }, { changedSiteId: 123 },
    { firstName: "a".repeat(41) }, { lastName: "\uD800" }, { orgUnitId: "123456789" },
    { changedActivityData: "a".repeat(101) }, { baselineStartLocal: "2026-02-30T00:00:00" },
    { changedEndLocal: undefined }, { stageArrivalLocal: "" },
  ]) assert.throws(() => validateRaw({ ...row(), ...change }), { code: "INVALID_SOURCE_DATA" });
});
test("problem envelope omits arbitrary raw failures and offending identifiers", () => {
  const p = toProblem(new Error("secret sql provider 1001"), "opaque");
  assert.deepEqual(p, {
    type: "urn:shf:problem:INTERNAL_ERROR", title: "Internal error", status: 500,
    code: "INTERNAL_ERROR", requestId: "opaque",
  });
  assert.equal(JSON.stringify(p).includes("secret"), false);
});
