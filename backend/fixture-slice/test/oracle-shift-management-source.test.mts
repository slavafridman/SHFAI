import test from "node:test";
import assert from "node:assert/strict";
import { readNativeShiftSource, nativeShiftMembershipGuard } from "../oracle-shift-management-source.mts";
import { sourceFixture } from "./oracle-shift-management-source-double.mts";
import { shiftBlockers } from "../shift-management-rules.mts";
import { shiftManagementPolicyKeys } from "../native-shift-management-scope.mts";
import { oracleBaseline } from "./oracle-shift-management-double.mts";
import { effectiveShift } from "../shift-management-rules.mts";

test("native actual source assembler reads scoped hierarchy/site/catalog/policy and retains absence witnesses", async () => {
  const f = await sourceFixture(), result = await readNativeShiftSource(f.query, f.metadata, f.scope,
    { employeeId: "1", shiftDayId: null });
  assert.deepEqual(result.snapshot.policy, { minimumMinutes: 30, maximumMinutes: 720, gapMinutes: 60 });
  assert.deepEqual(result.snapshot.employee.siteIds, ["1"]);
  assert.deepEqual(result.snapshot.startEndReasonOptions.map(row => row.code), ["1"]);
  assert.deepEqual(result.snapshot.cancelReasonOptions.map(row => row.code), ["2"]);
  assert.equal(result.snapshot.partnerPolicy.cti, "unknown");
  assert.ok(shiftBlockers(result.snapshot, null).includes("PARTNER_REQUIRED_OR_UNKNOWN"));
  const guard = nativeShiftMembershipGuard(result, f.scope, f.metadata.schemas);
  assert.match(guard.sql, /COUNT\(\*\)/); assert.match(guard.sql, /SHF_EMPLOYEE_EVENTS/);
  assert.ok(Object.keys(guard.binds).every(key => key.startsWith("w_")));
  for (const sql of f.calls) assert.doesNotMatch(sql, /\bNEXTVAL\b|\bFOR UPDATE\b|\bINSERT\b|\bDELETE\b/);
});
test("native source missing policy, ambiguous site or unsupported home facts never become guessed defaults", async () => {
  const f = await sourceFixture();
  f.data.SHF_SYSTEM_PARAM = f.data.SHF_SYSTEM_PARAM.filter(row => row.PARAM_KEY !== shiftManagementPolicyKeys.gap);
  await assert.rejects(readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null }),
    { code: "INVALID_SOURCE_DATA" });
});
test("native source requires unique site/hierarchy and exact policy precision without defaults", async () => {
  for (const scenario of ["sites", "parent", "maximum", "precision", "duplicate-override"] as const) {
    const f = await sourceFixture();
    if (scenario === "sites") f.data.SHF_ORG_UNITS_SHF_SITES.push({ SOU_ORG_UNIT_ID: "M01", SS_SITE_ID: "2" });
    if (scenario === "parent") f.data.SHF_ORG_UNIT[1].UNIT_TYPE_ID = "J01";
    if (scenario === "maximum") {
      const row = f.data.SHF_SYSTEM_PARAM.find(row => row.PARAM_KEY === shiftManagementPolicyKeys.maximum); assert.ok(row);
      row.DEFAULT_VALUE = "20";
    }
    if (scenario === "precision") {
      const row = f.data.SHF_SYSTEM_PARAM.find(row => row.PARAM_KEY === shiftManagementPolicyKeys.gap); assert.ok(row);
      row.DEFAULT_VALUE = "0.01";
    }
    if (scenario === "duplicate-override") f.data.SHF_UNIT_PARAM = [
      { ORG_UNIT_ID: "M01", PARAM_KEY: shiftManagementPolicyKeys.gap, PARAM_VALUE: "1" },
      { ORG_UNIT_ID: "M01", PARAM_KEY: shiftManagementPolicyKeys.gap, PARAM_VALUE: "2" },
    ];
    await assert.rejects(readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null }),
      { code: "INVALID_SOURCE_DATA" });
  }
});
test("native source uses actual unit override and exact fractional hours to integral civil minutes", async () => {
  const f = await sourceFixture();
  f.data.SHF_UNIT_PARAM = [{ ORG_UNIT_ID: "M01", PARAM_KEY: shiftManagementPolicyKeys.gap, PARAM_VALUE: "0.5" }];
  const result = await readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null });
  assert.equal(result.snapshot.policy.gapMinutes, 30);
});
test("native original-value witness uses metadata type, never guesses DATE from a VARCHAR value", async () => {
  const f = await sourceFixture(), row = f.data.SHF_SYSTEM_PARAM.find(row => row.PARAM_KEY === shiftManagementPolicyKeys.managed);
  assert.ok(row); row.DEFAULT_VALUE = "2027-01-03T00:00:00";
  const current = await readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null });
  const guard = nativeShiftMembershipGuard(current, f.scope, f.metadata.schemas);
  assert.doesNotMatch(guard.sql, /TO_CHAR\(r\.DEFAULT_VALUE/);
  assert.ok(Object.values(guard.binds).includes(row.DEFAULT_VALUE));
  assert.equal(current.snapshot.partnerPolicy.managedBreaks, "unknown");
});
for (const table of ["SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EVENTS", "SHF_EMPLOYEE_EXCEPTIONS",
  "SHF_EMPLOYEE_EXCEPTIONS_BASE", "SHF_REPLACE_CANDIDATES", "SHF_REPLACE_BREAK_CANDIDATES",
  "SHF_TIME_CHANGE_CANDIDATES", "SHF_SHIFT_REDUCE_CANDIDATE"]) {
  test(`native source retains scoped ${table} presence as a hard dependency, not fake absence`, async () => {
    const f = await sourceFixture();
    f.data.SHF_EMPLOYEE_DAY = [{ ...Object.fromEntries(f.schemas.SHF_EMPLOYEE_DAY.map(c => [c.name, null])), ...oracleBaseline() }];
    const row: Record<string, string | null> = Object.fromEntries(f.schemas[table].map(c =>
      [c.name, c.kind === "date" ? "2027-01-04T09:00:00" : "1"]));
    if (Object.hasOwn(row, "APPROVED_TIME")) row.APPROVED_TIME = null;
    if (Object.hasOwn(row, "APPROVE_TIME")) row.APPROVE_TIME = null;
    for (const key of ["SHF_EMPLOYEE_DAY_ID", "EMPLOYEE_DAY_ID", "AGENT_DAY_ID"]) if (Object.hasOwn(row, key)) row[key] = "7";
    f.data[table] = [row];
    const current = await readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null });
    assert.ok(current.snapshot.dependencies.length > 0);
    assert.ok(shiftBlockers(current.snapshot, null).some(code => code === "REPORT_REVIEW_REQUIRED" ||
      code === "DEPENDENT_FLOW_UNSUPPORTED" || code === "EXCHANGE_PRESENT"));
  });
}
test("native source preserves nullable day bounds, zero overlays and cancellation before employee-sentinel resolution", async () => {
  const f = await sourceFixture();
  f.data.SHF_EMPLOYEE_DAY = [{ ...Object.fromEntries(f.schemas.SHF_EMPLOYEE_DAY.map(c => [c.name, null])),
    ...oracleBaseline(), WM_START_DATETIME: null, WM_END_DATETIME: null }];
  const overlay = Object.fromEntries(f.schemas.SHF_DAY_CHANGES.map(c => [c.name, null]));
  Object.assign(overlay, { SHF_EMPLOYEE_DAY_ID: "7", NEW_WORK_FROM_HOME: "N", NEW_SPLIT_SHIFT: "N",
    NEW_PAID_MINUTES: "0", NEW_WORK_MINUTES: "0" });
  f.data.SHF_DAY_CHANGES = [overlay];
  let current = await readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: null });
  assert.equal(current.snapshot.days[0].baseline.dayStartLocal, null);
  assert.equal(effectiveShift(current.snapshot, current.snapshot.days[0]).paidMinutes, "0");
  Object.assign(overlay, { NEW_EMPLOYEE_ID: "99999999", NEW_DAY_TYPE: "1" });
  current = await readNativeShiftSource(f.query, f.metadata, f.scope, { employeeId: "1", shiftDayId: "7" });
  assert.equal(effectiveShift(current.snapshot, current.snapshot.days[0]).status, "cancelled");
  assert.equal(current.snapshot.employee.employeeNumber, "001234567");
});
