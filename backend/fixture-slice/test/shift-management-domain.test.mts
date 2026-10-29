import test from "node:test";
import assert from "node:assert/strict";
import { shiftIntervalsConflict, nextShiftCivilDate, shiftCivilMinute, shiftDurationMinutes,
  shiftWithinOriginalWeek, validateShiftInterval, validateShiftDurationPolicy } from "../shift-management-domain.mts";
import { ShiftManagementError } from "../shift-management-errors.mts";
import { withRequestBudget } from "../request-budget-context.mts";

test("complete symmetric interval comparison rejects whole containment", () => {
  const outer = { startLocal: "2027-01-04T08:00:00", endLocal: "2027-01-04T18:00:00" };
  const inner = { startLocal: "2027-01-04T10:00:00", endLocal: "2027-01-04T12:00:00" };
  assert.equal(shiftIntervalsConflict(outer, inner, 60), true);
  assert.equal(shiftIntervalsConflict(inner, outer, 60), true);
});

const interval = (start = "2027-01-04T09:00:00", end = "2027-01-04T10:00:00") =>
  ({ startLocal: start, endLocal: end });
const policy = { minimumMinutes: 30, maximumMinutes: 720, gapMinutes: 60 };
const now = new Date("2027-01-01T00:00:00Z");
const code = (expected: string) => (error: unknown) =>
  error instanceof ShiftManagementError && error.code === expected;
const violation = (expected: string) => (error: unknown) =>
  error instanceof ShiftManagementError &&
    error.details.ruleViolations?.some(rule => rule.code === expected) === true;

test("required gap equality allowed on either side; one minute less conflicts", () => {
  const current = interval();
  for (const [start, end, conflict] of [
    ["2027-01-04T11:00:00", "2027-01-04T12:00:00", false],
    ["2027-01-04T10:59:00", "2027-01-04T12:00:00", true],
    ["2027-01-04T07:00:00", "2027-01-04T08:00:00", false],
    ["2027-01-04T07:00:00", "2027-01-04T08:01:00", true],
  ] as const) {
    const other = interval(start, end);
    assert.equal(shiftIntervalsConflict(current, other, 60), conflict);
    assert.equal(shiftIntervalsConflict(other, current, 60), conflict);
  }
  assert.equal(shiftIntervalsConflict(current, interval(current.endLocal, "2027-01-04T11:00:00"), 0), false);
  assert.equal(shiftIntervalsConflict(current, current, 0), true);
});
test("civil arithmetic preserves Gregorian leap and year boundaries", () => {
  for (const [date, next] of [
    ["2026-12-31", "2027-01-01"], ["2028-02-28", "2028-02-29"],
    ["2100-02-28", "2100-03-01"], ["2000-02-28", "2000-02-29"],
    ["0001-01-01", "0001-01-02"],
  ]) assert.equal(nextShiftCivilDate(date), next);
  assert.equal(shiftDurationMinutes(interval("2026-12-31T23:00:00", "2027-01-01T01:00:00")), 120);
  assert.equal(shiftDurationMinutes(interval("0001-01-01T00:00:00", "0001-01-01T01:00:00")), 60);
  assert.throws(() => nextShiftCivilDate("9999-12-31"), violation("INVALID_TIME_RANGE"));
  assert.throws(() => nextShiftCivilDate("2027-02-29"), violation("INVALID_TIME_RANGE"));
});
for (const invalid of ["2027-02-29T09:00:00", "0000-01-01T09:00:00",
  "2027-01-04T09:00:01", "2027-01-04T09:00:00Z", "2027-01-04T09:00:00+02:00",
  "2027-01-04T24:00:00", "2027-01-04 09:00:00"]) {
  test(`civil grammar rejects ${invalid}`, () => {
    assert.throws(() => shiftCivilMinute(invalid), violation("INVALID_TIME_RANGE"));
  });
}
test("equal and reversed intervals are invalid, no HTTP overnight inference", () => {
  assert.throws(() => shiftDurationMinutes(interval("2027-01-04T09:00:00", "2027-01-04T09:00:00")),
    violation("INVALID_TIME_RANGE"));
  assert.throws(() => shiftDurationMinutes(interval("2027-01-04T23:00:00", "2027-01-04T01:00:00")),
    violation("INVALID_TIME_RANGE"));
});
test("policy has no guessed defaults, negative gaps or fractional minutes", () => {
  for (const invalid of [
    { ...policy, minimumMinutes: 0 }, { ...policy, maximumMinutes: 29 },
    { ...policy, minimumMinutes: NaN }, { ...policy, gapMinutes: -1 },
    { ...policy, maximumMinutes: Infinity }, { ...policy, gapMinutes: 0.5 },
  ]) assert.throws(() => validateShiftDurationPolicy(invalid), code("INVALID_SOURCE_DATA"));
  for (const invalid of [-1, NaN, 0.1, Infinity])
    assert.throws(() => shiftIntervalsConflict(interval(), interval(), invalid), code("INVALID_SOURCE_DATA"));
});
test("duration and strict fresh-now boundary use configured policy and zone", () => {
  const result = validateShiftInterval(interval(), policy, now, "Asia/Jerusalem");
  assert.equal(result.durationMinutes, "60");
  assert.equal(result.endInstant - result.startInstant, 3600000);
  assert.throws(() => validateShiftInterval(interval(), { ...policy, minimumMinutes: 61 }, now, "UTC"),
    violation("DURATION_OUT_OF_POLICY"));
  assert.throws(() => validateShiftInterval(interval(), { ...policy, maximumMinutes: 59 }, now, "UTC"),
    violation("DURATION_OUT_OF_POLICY"));
  assert.throws(() => validateShiftInterval(interval(), policy, new Date(result.startInstant), "Asia/Jerusalem"),
    violation("PAST_OR_STARTED_SHIFT"));
  assert.equal(validateShiftInterval(interval(), policy, new Date(result.startInstant - 1), "Asia/Jerusalem").durationMinutes, "60");
});
test("DST gap, fold and transition-spanning intervals reject rather than guess", () => {
  const before = new Date("2026-01-01T00:00:00Z");
  for (const proposed of [
    interval("2027-03-28T02:10:00", "2027-03-28T03:30:00"),
    interval("2027-10-31T02:10:00", "2027-10-31T03:30:00"),
  ]) assert.throws(() => validateShiftInterval(proposed, policy, before, "Europe/Berlin"),
    violation("AMBIGUOUS_LOCAL_TIME"));
  assert.throws(() => validateShiftInterval(
    interval("2027-03-28T01:00:00", "2027-03-28T04:00:00"), policy, before, "Europe/Berlin"),
  violation("OFFSET_TRANSITION_UNSUPPORTED"));
});
test("equal offset endpoints do not hide intermediate transitions", () => {
  assert.throws(() => validateShiftInterval(interval("2027-01-01T09:00:00", "2027-12-31T09:00:00"),
    { minimumMinutes: 1, maximumMinutes: 600000, gapMinutes: 0 },
    new Date("2026-01-01T00:00:00Z"), "Europe/Berlin"), violation("OFFSET_TRANSITION_UNSUPPORTED"));
});
test("bounded offset scanning denies overflow instead of unbounded work", () => {
  assert.throws(() => validateShiftInterval(interval("2027-01-01T09:00:00", "2029-01-01T09:00:00"),
    { minimumMinutes: 1, maximumMinutes: 2000000, gapMinutes: 0 },
    new Date("2026-01-01T00:00:00Z"), "UTC"), code("DEPENDENCY_TIMEOUT"));
});
test("change stays inside Sunday week bounds including December-January", () => {
  const original = interval("2026-12-31T23:00:00", "2027-01-01T01:00:00");
  assert.equal(shiftWithinOriginalWeek(interval("2026-12-27T00:00:00", "2027-01-03T00:00:00"), original), true);
  assert.equal(shiftWithinOriginalWeek(interval("2026-12-26T23:59:00", "2027-01-01T01:00:00"), original), false);
  assert.equal(shiftWithinOriginalWeek(interval("2027-01-02T23:00:00", "2027-01-03T00:01:00"), original), false);
  assert.equal(shiftWithinOriginalWeek(interval("2027-01-03T00:00:00", "2027-01-03T01:00:00"), original), false);
});
test("invalid source zone/clock and explicit or ambient cancellation fail closed", async () => {
  for (const zone of ["+02:00", "Invalid/Zone", ""])
    assert.throws(() => validateShiftInterval(interval(), policy, now, zone), code("INVALID_SOURCE_DATA"));
  assert.throws(() => validateShiftInterval(interval(), policy, new Date(NaN), "UTC"), code("INVALID_SOURCE_DATA"));
  const controller = new AbortController(); controller.abort();
  assert.throws(() => validateShiftInterval(interval(), policy, now, "UTC", controller.signal),
    code("DEPENDENCY_TIMEOUT"));
  await withRequestBudget(controller.signal, 5000, async () => {
    assert.throws(() => validateShiftInterval(interval(), policy, now, "UTC"), code("DEPENDENCY_TIMEOUT"));
  });
});
