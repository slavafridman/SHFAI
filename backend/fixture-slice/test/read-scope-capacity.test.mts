import { test } from "node:test";
import assert from "node:assert/strict";
import { validateConfig, validatePrincipal } from "../contract-validation.mts";
import { validateRuntimeConfig } from "../runtime-config.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { scopeBinds, teamsAndParents } from "../oracle-readers.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { startFromEnvironment } from "../server.mts";
import { stageArrivalAccessPolicy } from "../access-policy.mts";
import { record } from "../contract-validation.mts";

// Isolated synthetic identities/query doubles only; no Oracle access.
const ids = (n: number) => Array.from({ length: n }, (_, i) => `T${String(i).padStart(4, "0")}`);
const config = (n: number) => ({
  deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ids(n),
  businessTimeZone: "Asia/Jerusalem", dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
});
for (const n of [1, 100, 101, 1000]) test(`pure Oracle R7 admits exactly ${n} grants`, async () => {
  const c = validateRuntimeConfig(config(n));
  const p = await new SyntheticAdministratorProvider(c).authenticate({ authorization: null });
  validatePrincipal(p);
  assert.deepEqual(p.resourceScope.orgUnitIds, ids(n));
  assert.deepEqual(p.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read",
    "my-shifts:read", "shift-items:read", "employee:read", "attendance:read"]);
});
test("1001 is never truncated; fixture and original writer principals retain 100", async () => {
  assert.throws(() => validateRuntimeConfig(config(1001)));
  assert.throws(() => validateConfig({ ...config(101), dataSource: "isolated-fixture" }));
  const p = await new SyntheticAdministratorProvider(config(100)).authenticate({ authorization: null });
  for (const prefix of ["attendance-stage-arrival", "attendance-station-arrival", "attendance-station-exit",
    "attendance-station-arrival-late", "attendance-station-exit-cancellation"]) {
    const writer = { ...p, capabilities: [...p.capabilities, `${prefix}:prepare`, `${prefix}:commit`,
      `${prefix}:test-oracle-write`], resourceScope: { orgUnitIds: ids(101) } };
    assert.throws(() => validatePrincipal(writer), prefix);
  }
});
test("1000 hierarchy grants use sequential <=100-branch queries with exact membership", async () => {
  const requested = ids(1000), calls: number[] = [];
  let active = false;
  const result = await teamsAndParents(async (sql, binds, bound) => {
    assert.equal(active, false); active = true;
    const values = Object.entries(binds).filter(([k]) => /^team\d+$/.test(k)).map(([, v]) => v);
    calls.push(values.length);
    assert.ok(values.length <= 100); assert.equal(bound, values.length + 1);
    assert.ok((sql.match(/FROM dual/g) ?? []).length <= 100);
    await Promise.resolve(); active = false;
    return values.map(code => ({ grantCode: code, teamCode: code, teamLabel: "Synthetic team",
      teamType: "J01", code: "PARENT", label: "Synthetic parent", unitType: "G01" }));
  }, requested);
  assert.deepEqual(calls, Array(10).fill(100));
  assert.deepEqual(result.teams.map(t => t.code), requested);
  assert.equal(result.options.length, 1);
  assert.equal(scopeBinds(requested).placeholders.length, 1000);
  assert.throws(() => scopeBinds(ids(1001)));
  await assert.rejects(teamsAndParents(async () => requested.slice(1, 101).map(code => ({
    grantCode: code, teamCode: code, teamLabel: "Synthetic", teamType: "J01",
    code: "PARENT", label: "Synthetic", unitType: "G01",
  })), requested));
});

const peers = { attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
  attendanceStationArrivalLateMode: "disabled", attendanceStationExitMode: "disabled", shiftManagementMode: "disabled" };
const { oracleTestScopeConfirmed: _oracle, ...fixture } = { ...config(100), dataSource: "isolated-fixture" };
const profiles = [
  ["fixture R7", fixture],
  ["fixture stage", { ...fixture, attendanceStageArrivalMode: "isolated-fixture" }],
  ["fixture joint station", { ...fixture, attendanceStageArrivalMode: "isolated-fixture", attendanceStationArrivalMode: "isolated-fixture" }],
  ["fixture management", { ...fixture, shiftManagement: { mode: "isolated-fixture" },
    attendanceStationArrivalLateMode: "disabled", attendanceStationExitCancellationMode: "disabled" }],
  ["fixture cancellation", { ...fixture, ...peers, attendanceStationExitCancellationMode: "isolated-fixture" }],
  ["native stage", { ...config(100), attendanceStageArrivalMode: "test-oracle-controlled" }],
  ["native station", { ...config(100), attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "test-oracle-controlled" }],
  ["native exit", { ...config(100), attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled", attendanceStationExitMode: "test-oracle-controlled" }],
  ["native late", { ...config(100), attendanceStageArrivalMode: "disabled", attendanceStationArrivalLateMode: "test-oracle-controlled" }],
  ["native management", { ...config(100), shiftManagement: { mode: "test-oracle-controlled" } }],
  ["native cancellation", { ...config(100), ...peers, attendanceStationExitCancellationMode: "test-oracle-controlled" }],
] as const;
for (const [label, profile] of profiles) test(`${label} keeps original config/principal 100 boundary`, async () => {
  const c = validateRuntimeConfig(profile), provider = new SyntheticAdministratorProvider(c);
  const p = await provider.authenticate({ authorization: null });
  validatePrincipal(p);
  assert.equal(p.resourceScope.orgUnitIds.length, 100);
  for (const n of [101, 1000, 1001]) {
    assert.throws(() => validateRuntimeConfig({ ...profile, syntheticOrgUnitIds: ids(n) }), `${label} ${n}`);
    // Fixture R7 structurally permits R7; runtime and source-specific use cases enforce100.
    if (label !== "fixture R7") assert.throws(() => validatePrincipal({ ...p, resourceScope: { orgUnitIds: ids(n) } }));
  }
});
test("large eligibility rejects invalid/extra modes, disabled authentication, local and production", async () => {
  for (const change of [
    { attendanceStageArrivalMode: "invalid" }, { attendanceStationArrivalMode: "invalid" },
    { attendanceStationExitMode: "invalid" }, { attendanceStationArrivalLateMode: "invalid" },
    { attendanceStationExitCancellationMode: "invalid" }, { shiftManagement: { mode: "invalid" } },
    { shiftManagement: { mode: "disabled", extra: true } }, { shiftManagementMode: "test-oracle-controlled" },
    { deploymentClass: "local-development" }, { deploymentClass: "production" },
    { syntheticAdministratorEnabled: false }, { oracleTestScopeConfirmed: false },
    { authenticationMode: "real", syntheticAdministratorEnabled: false, realProviderId: "isolated-double" },
  ]) assert.throws(() => validateRuntimeConfig({ ...config(101), ...change }));
  const p = await new SyntheticAdministratorProvider(config(101)).authenticate({ authorization: null });
  for (const capabilities of [p.capabilities.slice(1), [...p.capabilities].reverse(), [...p.capabilities, "other:read"]])
    assert.throws(() => validatePrincipal({ ...p, capabilities }));
  assert.throws(() => validatePrincipal({ ...p, provider: "real", synthetic: false }));
  assert.throws(() => stageArrivalAccessPolicy.authorizedTeamIds(p));
});
test("all writer environment flags fail before any pool factory with large R7 config", async () => {
  let acquisitions = 0;
  const factories = {
    async read(): Promise<never> { acquisitions++; throw Error("Must not acquire"); },
    async native(): Promise<never> { acquisitions++; throw Error("Must not acquire"); },
  };
  for (const flag of ["SHF_TEST_ORACLE_STAGE_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_WRITE_ENABLED",
    "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED", "SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED",
    "SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED", "SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED"]) {
    await assert.rejects(startFromEnvironment({ SHF_APP_ENV: "test", SHF_ORACLE_PORT: "0",
      SHF_ORACLE_CONFIG: JSON.stringify(config(1000)), [flag]: "true" }, undefined, factories));
  }
  for (const [label, profile] of profiles.filter(([label]) => label.startsWith("native"))) {
    await assert.rejects(startFromEnvironment({ SHF_APP_ENV: "test", SHF_ORACLE_PORT: "0",
      SHF_ORACLE_CONFIG: JSON.stringify({ ...profile, syntheticOrgUnitIds: ids(101) }) }, undefined, factories), label);
  }
  assert.equal(acquisitions, 0);
});
for (const fault of ["missing", "foreign", "duplicate", "teamType", "parentType", "orphan", "label", "throw"]) {
  test(`hierarchy ${fault} in later chunk fails closed with same-session rollback/release`, async () => {
    let queries = 0, leases = 0, rollbacks = 0, releases = 0;
    const session = new OracleReadSession({
      async getConnection() {
        leases++;
        return { callTimeout: 0,
          async execute(sql, binds, bound) {
            if (sql === "SET TRANSACTION READ ONLY") return [];
            queries++; assert.ok(record(binds)); assert.ok(bound <= 101);
            const rows = Object.entries(binds).filter(([key]) => /^team\d+$/.test(key)).map(([, code]) => ({
              grantCode: code, teamCode: code, teamLabel: "Synthetic team", teamType: "J01",
              code: "PARENT", label: "Synthetic parent", unitType: "G01",
            }));
            if (queries !== 2) return rows;
            if (fault === "throw") throw Error("Synthetic chunk fault");
            if (fault === "missing") return rows.slice(1);
            if (fault === "foreign") return rows.map((r, i) => i ? r : { ...r, grantCode: "FOREIGN", teamCode: "FOREIGN" });
            if (fault === "duplicate") return rows.map((r, i) => i ? r : rows[1]);
            return rows.map(r => ({ ...r, ...(fault === "teamType" ? { teamType: "G01" } :
              fault === "parentType" ? { unitType: "J01" } : fault === "orphan" ? { code: null } :
              { label: "Inconsistent parent label" }) }));
          },
          async rollback() { rollbacks++; }, async close() { releases++; }, async break() {},
        };
      }, async close() {},
    });
    await assert.rejects(session.read(q => teamsAndParents(q, ids(1000))));
    assert.equal(queries, 2); assert.equal(leases, 1); assert.equal(rollbacks, 1); assert.equal(releases, 1);
  });
}
