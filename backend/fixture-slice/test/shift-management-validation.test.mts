import test from "node:test";
import assert from "node:assert/strict";
import { parseShiftDraft, parseShiftCommand, parseCsvShiftCommand, parseShiftJson,
  requireShiftAcknowledgments, parseShiftSelection, parseShiftPreparationRequest } from "../shift-management-validation.mts";
import { ShiftManagementError, shiftProblem } from "../shift-management-errors.mts";
import type { ShiftDraftV1, ShiftWarningCodeV1 } from "../shift-management-contracts.mts";

const create: ShiftDraftV1 = { kind: "create", startLocal: "2027-01-04T09:00:00",
  endLocal: "2027-01-04T10:00:00", activityCode: "1", workLocation: "site", remark: null };
const change: ShiftDraftV1 = { kind: "change", shiftDayId: "7", startLocal: create.startLocal,
  endLocal: create.endLocal, activityCode: "2", workLocation: "home",
  startReasonCode: null, endReasonCode: "1" };
const cancel: ShiftDraftV1 = { kind: "cancel", shiftDayId: "7", reasonCode: "C1", remark: "סינתטי" };
const binding = { commandId: "00000000-0000-4000-8000-000000000001",
  fingerprint: "a".repeat(64), operationConfirmation: { accepted: true },
  acknowledgedWarningCodes: [] };
const token = Buffer.alloc(32, 1).toString("base64url");
const code = (expected: string) => (error: unknown) =>
  error instanceof ShiftManagementError && error.code === expected;

test("strict canonical draft branches are copied, not aliased or coerced", () => {
  for (const draft of [create, change, cancel]) {
    const parsed = parseShiftDraft(draft);
    assert.deepEqual(parsed, draft);
    assert.notEqual(parsed, draft);
    assert.deepEqual(parseShiftPreparationRequest({ draft }), draft);
  }
});
test("drafts reject unknown/missing fields, write-shaped fields and wrong variants", () => {
  for (const invalid of [
    { ...create, employeeId: "1" }, { ...create, siteId: "1" }, { ...create, source: "SHF" },
    { ...create, paidMinutes: "60" }, { ...create, shiftDayId: "7" },
    { ...create, remark: undefined }, { ...change, remark: null },
    { ...cancel, startLocal: create.startLocal }, { ...create, kind: "replace" },
    null, [], "create",
  ]) assert.throws(() => parseShiftDraft(invalid), code("INVALID_REQUEST"));
  assert.throws(() => parseShiftPreparationRequest({ draft: create, preview: true }), code("INVALID_REQUEST"));
});
test("draft ID, civil-time, explicit-location and text grammar are strict", () => {
  for (const invalid of [
    { ...create, activityCode: "01" }, { ...create, activityCode: 1 },
    { ...create, activityCode: "1".repeat(39) }, { ...create, workLocation: "h" },
    { ...create, workLocation: null }, { ...create, startLocal: "2027-01-04T09:00:00Z" },
    { ...create, startLocal: "2027-02-29T09:00:00" }, { ...create, startLocal: "2027-01-04T09:00:01" },
    { ...create, remark: "" }, { ...create, remark: "a".repeat(501) }, { ...create, remark: "\u0000" },
    { ...create, remark: "\uD800" }, { ...cancel, reasonCode: "" },
    { ...cancel, reasonCode: "a".repeat(11) }, { ...change, shiftDayId: "1".repeat(11) },
    { ...change, startReasonCode: "0" },
  ]) assert.throws(() => parseShiftDraft(invalid), code("INVALID_REQUEST"));
  assert.equal(parseShiftDraft({ ...create, remark: "א".repeat(500) }).kind, "create");
  // Charset/actual BYTE capacity is a separate metadata-backed domain check.
});
test("selection requires internal canonical IDs, nullable day is create workspace only", () => {
  assert.deepEqual(parseShiftSelection({ employeeId: "1", shiftDayId: null }),
    { employeeId: "1", shiftDayId: null });
  assert.deepEqual(parseShiftSelection({ employeeId: "1", shiftDayId: "7" }),
    { employeeId: "1", shiftDayId: "7" });
  for (const invalid of [
    { employeeId: "01", shiftDayId: null }, { employeeId: "1", shiftDayId: "0" },
    { employeeId: "1", shiftDayId: "1".repeat(11) }, { employeeId: "1" },
    { employeeId: 1, shiftDayId: null }, { employeeId: "1", shiftDayId: null, personalId: "PRIVATE" },
  ]) assert.throws(() => parseShiftSelection(invalid), code("INVALID_REQUEST"));
});
test("CRUD/CSV commands require exact distinct shapes and canonical bindings", () => {
  const command = { ...binding, draft: create, validationToken: token };
  const csv = { ...binding, previewToken: token };
  assert.deepEqual(parseShiftCommand(command), command);
  assert.deepEqual(parseCsvShiftCommand(csv), csv);
  assert.throws(() => parseShiftCommand(csv), code("INVALID_REQUEST"));
  assert.throws(() => parseCsvShiftCommand(command), code("INVALID_REQUEST"));
  for (const patch of [
    { commandId: binding.commandId.toUpperCase().replace("00000000", "AAAAAAAA") },
    { commandId: "00000000-0000-1000-8000-000000000001" },
    { fingerprint: "A".repeat(64) }, { validationToken: "a".repeat(43) },
    { operationConfirmation: { accepted: false } }, { operationConfirmation: { accepted: true, extra: true } },
    { operationConfirmation: null }, { acknowledgedWarningCodes: ["UNKNOWN"] },
    { acknowledgedWarningCodes: ["DURATION_CHANGED", "DURATION_CHANGED"] },
    { draft: {} }, { extra: "PRIVATE" },
  ]) assert.throws(() => parseShiftCommand({ ...command, ...patch }), code("INVALID_REQUEST"));
});
test("warning acknowledgment is exact set equality plus whole-operation consent", () => {
  const expected: ShiftWarningCodeV1[] = ["DURATION_CHANGED", "SOURCE_BECOMES_SHF"];
  requireShiftAcknowledgments(expected, ["SOURCE_BECOMES_SHF", "DURATION_CHANGED"], true);
  requireShiftAcknowledgments([], [], true);
  for (const actual of [[], ["DURATION_CHANGED"],
    ["DURATION_CHANGED", "SOURCE_BECOMES_SHF", "OVERNIGHT_NORMALIZED"],
    ["DURATION_CHANGED", "SOURCE_BECOMES_SHF", "SOURCE_BECOMES_SHF"]]) {
    assert.throws(() => requireShiftAcknowledgments(expected, actual, true), code("CONFIRMATION_REQUIRED"));
  }
  assert.throws(() => requireShiftAcknowledgments([], [], false), code("CONFIRMATION_REQUIRED"));
});
test("JSON reuses duplicate-key checks and adds exact 16KiB/eight-container-depth bounds", () => {
  assert.deepEqual(parseShiftJson('{"draft":' + JSON.stringify(create) + "}"), { draft: create });
  for (const input of [
    '{"draft":{},"draft":{}}', '{"draft":{"kind":"create","k\\u0069nd":"change"}}',
    '{"draft":}', '{"draft":{}} trailing', "\uFEFF{}",
    "[".repeat(9) + "0" + "]".repeat(9),
  ]) assert.throws(() => parseShiftJson(input), code("INVALID_REQUEST"));
  assert.doesNotThrow(() => parseShiftJson("[".repeat(8) + "0" + "]".repeat(8)));
  assert.doesNotThrow(() => parseShiftJson("{}" + " ".repeat(16382)));
  assert.throws(() => parseShiftJson("{}" + " ".repeat(16383)), code("REQUEST_TOO_LARGE"));
  assert.throws(() => parseShiftJson('{"x":"' + "א".repeat(8192) + '"}'), code("REQUEST_TOO_LARGE"));
  assert.throws(() => parseShiftJson('{"x":"\uD800"}'), code("INVALID_REQUEST"));
});
test("JSON errors are management problems without legacy code or private input", () => {
  try { parseShiftJson('{"PRIVATE":0,"PRIVATE":1}'); assert.fail("duplicate accepted"); }
  catch (error) {
    const problem = shiftProblem(error, "synthetic-request");
    assert.equal(problem.code, "INVALID_REQUEST");
    assert.equal(problem.effect, "none");
    assert.ok(!JSON.stringify(problem).includes("PRIVATE"));
  }
});
