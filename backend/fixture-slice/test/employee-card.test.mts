import { test } from "node:test";
import assert from "node:assert/strict";
import { GetEmployeeOperationalCard } from "../read-employee-card.mts";
import { employeeCardAccessPolicy } from "../access-policy.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { sampleConfig } from "../current-shifts-sample.mts";
import type { PrincipalV1 } from "../contracts.mts";
import { EmployeeCardFixtureReader } from "../employee-card-fixture.mts";
import { sampleEmployeeCardFixture } from "../employee-card-sample.mts";
import { numericCardCode, validateCardRequest } from "../read-employee-card.mts";
import { createRuntime } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { validatePrincipal } from "../contract-validation.mts";
import { cardProblem, EmployeeCardError } from "../employee-card-errors.mts";
import { accessPolicy } from "../access-policy.mts";

const id = "9007199254740993";
const principal = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const realConfig = { ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
  syntheticOrgUnitIds: undefined, realProviderId: "test-only" };
const real = (overrides: Partial<PrincipalV1> = {}): PrincipalV1 => ({
  subject: "test:actor", displayName: "test", provider: "real", synthetic: false, roles: [],
  capabilities: ["employee:read"], employeeId: id, resourceScope: { orgUnitIds: ["T01"] }, ...overrides,
});
const fixture = () => structuredClone(sampleEmployeeCardFixture);
const appFor = (data = fixture(), config: unknown = sampleConfig) =>
  new GetEmployeeOperationalCard(new EmployeeCardFixtureReader(data), employeeCardAccessPolicy(config), "Asia/Jerusalem");

test("EC18-01/03 employee capability is independent, actor denied before reads; explicit projection", async () => {
  let calls = 0;
  const app = new GetEmployeeOperationalCard({ dataSource: "isolated-fixture", async read() {
    calls++; return { kind: "one", row: { employeeId: "1", employee: {
      firstName: "דנה", lastName: "לוי", unit: { code: "T01", label: "צוות",
        moked: { code: "01", label: "מוקד", unitType: "G01" } }, job: null, innerJob: null },
      privateExtra: "must not escape" } } as never;
  } }, employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
  const mock = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
  assert.equal(mock.employeeId, null); assert.equal(mock.capabilities.length, 6);
  const real: PrincipalV1 = { ...mock, provider: "real", synthetic: false, employeeId: "1",
    capabilities: mock.capabilities.filter(c => c !== "employee:read") };
  await assert.rejects(app.execute(real, { employeeId: "1" }), { code: "FORBIDDEN" });
  assert.equal(calls, 0);
  const result = await app.execute(mock, { employeeId: "1" });
  assert.equal(result.employee.firstName, "דנה");
  assert.equal(JSON.stringify(result).includes("privateExtra"), false);
  assert.equal(calls, 1);
});

test("EC18-01/03 real self needs ONLY employee:read; other/unlinked actor denied before port", async () => {
  assert.equal((await appFor(fixture(), realConfig).execute(real(), { employeeId: id })).employeeId, id);
  let calls = 0;
  const app = new GetEmployeeOperationalCard({ dataSource: "isolated-fixture",
    async read() { calls++; return { kind: "not-found" }; } }, employeeCardAccessPolicy(realConfig), "Asia/Jerusalem");
  for (const actor of [real({ employeeId: null }), real({ employeeId: "2" }),
    real({ capabilities: principal.capabilities.filter(c => c !== "employee:read"), roles: ["Administrator"] })])
    await assert.rejects(app.execute(actor, { employeeId: id }), { code: "FORBIDDEN" });
  assert.equal(calls, 0);
  for (const capability of principal.capabilities.filter(c => c !== "employee:read"))
    assert.throws(() => accessPolicy.requireCapability(real(), capability), { code: "FORBIDDEN" });
  assert.throws(() => validatePrincipal({ ...principal, capabilities: principal.capabilities.slice(0, 5) }),
    { code: "UNAUTHENTICATED" });
});

test("EC18-02 mock disabled/invalid/production, missing provider and auth error never fallback", async () => {
  for (const change of [{ syntheticAdministratorEnabled: false }, { deploymentClass: "production" },
    { deploymentClass: "invalid" }, { realProviderId: "mixed" }])
    assert.throws(() => new SyntheticAdministratorProvider({ ...sampleConfig, ...change }));
  await assert.rejects(createRuntime(realConfig, new FixtureReader([])));
  const rt = await createRuntime(realConfig, new FixtureReader([]), async () => ({
    async authenticate() { throw Error("do not expose"); },
  }));
  await assert.rejects(rt.authenticate({ authorization: null }), { code: "DEPENDENCY_UNAVAILABLE" });
});

test("EC18-04/05 generic missing/null/ungranted/current reassignment and exact zero-prefixed teams", async () => {
  const base = fixture();
  for (const orgUnitId of [null, "01", "T02", "001", "T01 "]) {
    const data = fixture(); data.employees[0].orgUnitId = orgUnitId;
    await assert.rejects(appFor(data).execute(principal, { employeeId: id }), { code: "EMPLOYEE_NOT_FOUND" });
  }
  await assert.rejects(appFor().execute(principal, { employeeId: "7" }), { code: "EMPLOYEE_NOT_FOUND" });
  await assert.rejects(appFor(base, realConfig).execute(real({ resourceScope: { orgUnitIds: [] } }),
    { employeeId: id }), { code: "EMPLOYEE_NOT_FOUND" });
  base.employees[0].orgUnitId = "0023"; base.units[0].code = "0023";
  const actor = real({ resourceScope: { orgUnitIds: ["0023"] } });
  assert.equal((await appFor(base, realConfig).execute(actor, { employeeId: id })).employee.unit.code, "0023");
  await assert.rejects(appFor(base, realConfig).execute(real({ resourceScope: { orgUnitIds: ["23"] } }),
    { employeeId: id }), { code: "EMPLOYEE_NOT_FOUND" });
  assert.equal((await appFor().execute(principal, { employeeId: id })).employeeId, id);
  base.employees[0].orgUnitId = "T02";
  await assert.rejects(appFor(base).execute(principal, { employeeId: id }), { code: "EMPLOYEE_NOT_FOUND" });
});

test("EC18-06 two admitted candidates ambiguous; any private candidate generic404 before malformed labels", async () => {
  const data = fixture(); data.employees.push({ ...data.employees[0] });
  await assert.rejects(appFor(data).execute(principal, { employeeId: id }), { code: "AMBIGUOUS_EMPLOYEE" });
  data.employees.at(-1)!.orgUnitId = null; data.units = [];
  await assert.rejects(appFor(data).execute(principal, { employeeId: id }), { code: "EMPLOYEE_NOT_FOUND" });
});

test("EC18-07/09 signed precision/null codes and active grouped job labels, no selected status exclusion", async () => {
  for (const [code, expected] of [[null, null], [0, null], ["0", null], ["-9", "-9"],
    ["9".repeat(38), "9".repeat(38)]] as const) {
    const data = fixture(); data.employees[0].jobCode = code; data.employees[0].innerJobCode = code;
    const result = await appFor(data).execute(principal, { employeeId: id });
    assert.equal(result.employee.job?.code ?? null, expected);
    assert.equal(result.employee.job?.label ?? null, null);
    assert.equal(result.employee.innerJob?.code ?? null, expected);
  }
  for (const bad of ["00", "01", "-0", "+1", "1.1", "1e1", "9".repeat(39), 1, undefined])
    assert.throws(() => numericCardCode(bad), { code: "INVALID_SOURCE_DATA" });
  for (const label of [null, "", "   ", "  תפקיד  "]) {
    const data = fixture(); data.activeJobPairs[0].label = label; data.innerJobs[0].label = label;
    const e = (await appFor(data).execute(principal, { employeeId: id })).employee;
    assert.equal(e.job?.code, "11"); assert.equal(e.job?.label, label?.trim() || null);
    assert.equal(e.innerJob?.label, label?.trim() || null);
  }
  const grouped = fixture(); grouped.activeJobPairs.push({ ...grouped.activeJobPairs[0] });
  assert.equal((await appFor(grouped).execute(principal, { employeeId: id })).employee.job?.code, "11");
  grouped.activeJobPairs = [];
  assert.equal((await appFor(grouped).execute(principal, { employeeId: id })).employee.job?.label, null);
});

test("EC18-06/07 grouped pair ambiguity before trimming, inner job duplicates even equal", async () => {
  for (const label of [null, "תפקיד אחר", " תפקיד סינתטי "]) {
    const data = fixture(); data.activeJobPairs.push({ code: "11", label });
    await assert.rejects(appFor(data).execute(principal, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
  }
  const data = fixture(); data.innerJobs.push({ ...data.innerJobs[0] });
  await assert.rejects(appFor(data).execute(principal, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
});

test("EC18-04/06/09 missing/duplicate/self/wrong parent and invalid required labels fail atomically", async () => {
  for (const alter of [
    (d: ReturnType<typeof fixture>) => { d.units.pop(); },
    (d: ReturnType<typeof fixture>) => { d.units.push({ ...d.units[0] }); },
    (d: ReturnType<typeof fixture>) => { d.units.push({ ...d.units[1] }); },
    (d: ReturnType<typeof fixture>) => { d.units[0].parentCode = "T01"; },
    (d: ReturnType<typeof fixture>) => { d.units[1].unitType = "E01"; },
    (d: ReturnType<typeof fixture>) => { d.units[0].label = ""; },
    (d: ReturnType<typeof fixture>) => { d.employees[0].firstName = ""; },
    (d: ReturnType<typeof fixture>) => { d.employees[0].lastName = "א".repeat(41); },
    (d: ReturnType<typeof fixture>) => { d.employees[0].firstName = "\ud800"; },
  ]) {
    const d = fixture(); alter(d);
    await assert.rejects(appFor(d).execute(principal, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
  }
});

test("EC18-08 privacy allowlist, immutable fixture snapshot and literal malicious-looking names", async () => {
  const data = fixture(); data.employees[0].firstName = "<img src=x onerror=alert(1)>";
  const input = { ...data, employees: [{ ...data.employees[0], deferred: "not retained",
    nationalId: "synthetic-excluded", email: "synthetic-excluded", phone: "synthetic-excluded",
    address: "synthetic-excluded", manager: "synthetic-excluded", birthDate: "synthetic-excluded",
    photo: "synthetic-excluded", settings: { excluded: true }, attendance: { excluded: true } }] };
  const reader = new EmployeeCardFixtureReader(input);
  input.employees[0].lastName = "changed";
  const app = new GetEmployeeOperationalCard(reader, employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
  const result = await app.execute(principal, { employeeId: id });
  assert.equal(result.employee.firstName, data.employees[0].firstName);
  assert.equal(result.employee.lastName, data.employees[0].lastName);
  assert.deepEqual(Object.keys(result), ["employeeId", "employee", "businessTimeZone", "dataSource"]);
  assert.deepEqual(Object.keys(result.employee), ["firstName", "lastName", "unit", "job", "innerJob"]);
  assert.equal(JSON.stringify(reader).includes("not retained"), false);
  assert.equal(JSON.stringify(result).includes("deferred"), false);
  assert.equal(JSON.stringify(result).includes("synthetic-excluded"), false);
  assert.equal(JSON.stringify(reader).includes("synthetic-excluded"), false);
  assert.equal(principal.employeeId, null);
});

test("EC18-12 row identity/scope/source rechecked after port; unknown fields never copied", async () => {
  const one = await new EmployeeCardFixtureReader(fixture()).read({ employeeId: id, exactTeamIds: ["T01"] });
  assert.equal(one.kind, "one"); if (one.kind !== "one") return;
  for (const [result, code] of [
    [{ kind: "one", row: { ...one.row, employeeId: "2" } }, "INVALID_SOURCE_DATA"],
    [{ kind: "one", row: { ...one.row, employee: { ...one.row.employee,
      unit: { ...one.row.employee.unit, code: "T02" } } } }, "EMPLOYEE_NOT_FOUND"],
  ] as const) {
    const app = new GetEmployeeOperationalCard({ dataSource: "isolated-fixture",
      async read() { return result; } }, employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
    await assert.rejects(app.execute(principal, { employeeId: id }), { code });
  }
  const reader = { dataSource: "isolated-fixture" as "isolated-fixture" | "oracle-read-only",
    async read() { this.dataSource = "oracle-read-only"; return one; } };
  await assert.rejects(new GetEmployeeOperationalCard(reader, employeeCardAccessPolicy(sampleConfig),
    "Asia/Jerusalem").execute(principal, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
});

test("EC18-09/10 grammar and runtime port result checks fail closed without coercion or empty success", async () => {
  for (const employeeId of ["", "0", "01", "-1", " 1", "1e2", "1.1", "١", "9".repeat(39), 1])
    assert.throws(() => validateCardRequest({ employeeId }), { code: "INVALID_REQUEST" });
  validateCardRequest({ employeeId: "9".repeat(38) });
  for (const result of [{}, { kind: "unknown" }, { kind: "one", row: {} }]) {
    const app = new GetEmployeeOperationalCard({ dataSource: "isolated-fixture",
      async read() { return result as never; } }, employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
    await assert.rejects(app.execute(principal, { employeeId: id }), { code: "INVALID_SOURCE_DATA" });
  }
});

test("EC18-10 aborted application never returns late success; errors sanitized and exact codes", async () => {
  const c = new AbortController();
  const app = new GetEmployeeOperationalCard({ dataSource: "isolated-fixture",
    async read() { c.abort(new EmployeeCardError("DEPENDENCY_TIMEOUT")); return { kind: "not-found" }; } },
  employeeCardAccessPolicy(sampleConfig), "Asia/Jerusalem");
  await assert.rejects(app.execute(principal, { employeeId: id }, c.signal), { code: "DEPENDENCY_TIMEOUT" });
  const p = cardProblem(Error("private raw data"), "opaque");
  assert.equal(p.code, "INTERNAL_ERROR"); assert.equal(JSON.stringify(p).includes("private"), false);
  assert.equal(cardProblem(new EmployeeCardError("EMPLOYEE_NOT_FOUND"), "opaque").status, 404);
});
