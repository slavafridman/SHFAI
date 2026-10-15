import { test } from "node:test";
import assert from "node:assert/strict";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { readEmployeeShiftDay } from "../read-employee-shift-day.mts";
import { project } from "../projection.mts";
import { SliceError, toProblem } from "../errors.mts";
import { config, row } from "./fixtures.mts";

const principal = () => new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
test("baseline, no attendance, exact object and configured zone", async () => {
  const runtime = await createRuntime(config, new FixtureReader([row()]));
  const result = await runtime.read(await principal(), "1001", "2001");
  assert.deepEqual(result, project(row(), config.businessTimeZone));
});
test("all 16 independent overlay combinations use non-null changes only", async () => {
  const changes = {
    changedStartLocal: "2026-10-25T01:30:00", changedEndLocal: "2026-10-15T01:00:00",
    changedActivityData: " ;not-an-enum; ", changedSiteId: "9".repeat(38),
  };
  for (let mask = 0; mask < 16; mask++) {
    const fixture = row();
    Object.entries(changes).forEach(([field, value], index) => {
      if (mask & (1 << index)) Object.assign(fixture, { [field]: value });
    });
    const runtime = await createRuntime(config, new FixtureReader([fixture]));
    assert.deepEqual(await runtime.read(await principal(), "1001", "2001"), project(fixture, config.businessTimeZone));
  }
});
test("Oracle empty activity is null only at fixture boundary; whitespace remains raw", async () => {
  const fixture = row({ changedActivityData: "" });
  const reader = new FixtureReader([fixture]);
  const result = await reader.readByDayId("2001");
  assert.equal(result.kind, "one");
  if (result.kind === "one") assert.equal(result.row.changedActivityData, null);
  assert.equal(fixture.changedActivityData, "");
  assert.equal(project(row({ changedActivityData: "" }), config.businessTimeZone).effectiveShift.activityData, "");
});
test("reassignment, absent day, mismatched context and denied units are identical public 404", async () => {
  const cases = [[], [row({ employeeId: "1002" })], [row({ orgUnitId: "DENIED" })], [row({ orgUnitId: null })]];
  const errors = [];
  for (const rows of cases) {
    const runtime = await createRuntime(config, new FixtureReader(rows));
    try { await runtime.read(await principal(), "1001", "2001"); assert.fail("must deny"); }
    catch (error) { errors.push(toProblem(error, "same-opaque-id")); }
  }
  for (const error of errors) assert.deepEqual(error, errors[0]);
  const runtime = await createRuntime(config, new FixtureReader([row({ employeeId: "1002" })]));
  assert.equal((await runtime.read(await principal(), "1002", "2001")).employeeId, "1002");
});
test("Administrator role without capability gets 403 before reader, invalid input gets 400 first", async () => {
  let calls = 0;
  const reader = { async readByDayId() { calls++; return { kind: "not-found" as const }; } };
  const p = { ...await principal(), provider: "real" as const, synthetic: false, capabilities: [] };
  await assert.rejects(readEmployeeShiftDay(p, "1001", "2001", reader, config.businessTimeZone), { code: "FORBIDDEN" });
  await assert.rejects(readEmployeeShiftDay(p, "01", "2001", reader, config.businessTimeZone), { code: "INVALID_REQUEST" });
  assert.equal(calls, 0);
});
test("duplicate joined rows fail ambiguity rather than choosing first", async () => {
  const runtime = await createRuntime(config, new FixtureReader([row(), row(), row({ employeeId: "1002" })]));
  await assert.rejects(runtime.read(await principal(), "1001", "2001"), { code: "AMBIGUOUS_SHIFT_DAY" });
});
test("invalid source including hidden baseline errors and wrong returned day fails without success", async () => {
  for (const fixture of [
    row({ baselineStartLocal: "bad", changedStartLocal: "2026-10-15T01:00:00" }),
    row({ baselineSiteId: "0", changedSiteId: "2" }),
    row({ baselineActivityData: "x".repeat(101) }), row({ shiftDayId: "2002" }),
  ]) {
    const runtime = await createRuntime(config, { async readByDayId() { return { kind: "one", row: fixture }; } });
    await assert.rejects(runtime.read(await principal(), "1001", "2001"), { code: "INVALID_SOURCE_DATA" });
  }
  const runtime = await createRuntime(config, { async readByDayId() { return { kind: "bogus" } as never; } });
  await assert.rejects(runtime.read(await principal(), "1001", "2001"), { code: "INVALID_SOURCE_DATA" });
});
test("null, overnight, end-before-start and DST repeated local hour are not repaired", () => {
  for (const fixture of [
    row(), row({ baselineStartLocal: null, baselineEndLocal: null }),
    row({ baselineStartLocal: "2026-10-25T01:30:00", baselineEndLocal: "2026-10-25T01:00:00" }),
  ]) {
    const result = project(fixture, config.businessTimeZone);
    assert.equal(result.effectiveShift.startLocal, fixture.baselineStartLocal);
    assert.equal(result.effectiveShift.endLocal, fixture.baselineEndLocal);
  }
});
test("non-activity raw values remain visible, no invented cancellation/status/labels", async () => {
  const runtime = await createRuntime(config, new FixtureReader([row({ baselineActivityData: null, baselineSiteId: null })]));
  const dto = await runtime.read(await principal(), "1001", "2001");
  assert.equal(dto.effectiveShift.activityData, null);
  assert.deepEqual(Object.keys(dto), ["employeeId", "shiftDayId", "employee", "effectiveShift", "attendance", "businessTimeZone", "dataSource"]);
});
test("concurrent repeated reads are independent and pure; no retry on dependency failure", async () => {
  const fixtures = [row(), row({ employeeId: "1002", shiftDayId: "2002" })];
  const before = structuredClone(fixtures);
  const runtime = await createRuntime(config, new FixtureReader(fixtures));
  const p = await principal();
  const results = await Promise.all(Array.from({ length: 40 }, (_, i) =>
    runtime.read(p, i % 2 ? "1001" : "1002", i % 2 ? "2001" : "2002")));
  results[0].employee.firstName = "changed-output";
  assert.deepEqual(await runtime.read(p, "1001", "2001"), project(row(), config.businessTimeZone));
  assert.deepEqual(fixtures, before);
  let calls = 0;
  const broken = await createRuntime(config, { async readByDayId() { calls++; throw new SliceError("DEPENDENCY_UNAVAILABLE"); } });
  await assert.rejects(broken.read(p, "1001", "2001"), { code: "DEPENDENCY_UNAVAILABLE" });
  assert.equal(calls, 1);
});
