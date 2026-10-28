import test from "node:test";
import assert from "node:assert/strict";
import { exitTiming, exitPolicy, exitBlockers } from "../oracle-station-exit-domain.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import type { NativeRow } from "../oracle-stage-arrival-snapshot.mts";
const planned = { startLocal: "2026-10-28T08:00:00", endLocal: "2026-10-28T16:00:00" };
const window = { windowStart: "2026-10-28T00:00:00.000Z", windowEnd: "2026-10-29T00:00:00.000Z" };
for (const b of [0, 5]) for (const delta of [-1, 0, 1, 999])
  test(`exit whole-minute B=${b}, boundary delta=${delta}ms`, () => {
    const threshold = Date.parse(planned.endLocal + "Z") - (b + 1) * 60000;
    const t = exitTiming({ planned, policy: { maxEarlyWholeMinutes: b, maxAfterEndMinutes: 10 },
      rows: { SHF_ATTENDANCE: { STATION_ARRIVAL_TIME: "2026-10-28T08:00:00" } } },
      new Date(threshold + delta), "UTC", window);
    assert.equal(t.classification, delta <= 0 ? "early-manager-decision-deferred" : "ordinary");
    assert.equal(t.withinExitWindow, delta > 0);
    assert.equal(Date.parse(t.exitWindow.earliestInclusiveAt), threshold + 1);
  });
for (const delta of [0, 1]) test(`exit inclusive upper +${delta}ms`, () => {
  const t = exitTiming({ planned, policy: { maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 10 },
    rows: { SHF_ATTENDANCE: null } }, new Date(Date.parse("2026-10-28T16:10:00Z") + delta), "UTC", window);
  assert.equal(t.withinExitWindow, delta === 0);
  assert.equal(t.transition, Date.parse("2026-10-28T16:10:00.001Z"));
});
test("exit policy uses source override/default, never missing fallback", () => {
  assert.equal(exitPolicy({ DEFAULT_VALUE: "005" }, null), 5);
  assert.equal(exitPolicy({ DEFAULT_VALUE: null }, { PARAM_VALUE: "0" }), 0);
  assert.equal(exitPolicy({ DEFAULT_VALUE: "5" }, { PARAM_VALUE: null }), 5);
  for (const v of [null, "-1", " 5", "+5", "1.1", "2147483648", undefined])
    assert.throws(() => exitPolicy({ DEFAULT_VALUE: v as string | null }, null),
      (e: unknown) => e instanceof StageArrivalError && e.code === "INVALID_SOURCE_DATA");
});
test("exit rejects ambiguous DST and cross-date plan", () => {
  const f = { planned: { startLocal: "2026-10-25T02:30:00", endLocal: "2026-10-25T08:00:00" },
    rows: {}, policy: { maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 10 } };
  assert.throws(() => exitTiming(f, new Date("2026-10-25T07:59:00Z"), "Europe/Berlin", window));
});
test("exit stage is optional; station arrival and complete flags are not", () => {
  const d = { WM_DAY_TYPE: "4", WM_SCH_ACTIVITY_ID_DATA: null, WM_EXCEPTION_TYPE_ID: null,
    SPLIT_SHIFT: "N", SPLIT_START: null, SPLIT_END: null };
  const a: NativeRow = { SHF_EMPLOYEE_DAY_ID: "1", STAGE_ARRIVAL_TIME: null, STAGE_ARRIVAL_USER: null,
    STATION_ARRIVAL_TIME: "2026-10-28T08:00:00", STATION_ARRIVAL_USER: "synthetic-original",
    STATION_EXIT_TIME: null, STATION_EXIT_USER: null, TADREECH: null, MISS_REASON_ID: null,
    MISSING_TIME: null, MISSING_REMARK: null, OPTIONAL1: null,
    LATE_REASON_ID: null, LATE_MINUTES: null, LATE_REMARK: null,
    STAGE_LATE_REASON_ID: null, STAGE_LATE_MINUTES: null, STAGE_LATE_REMARK: null };
  const rows = { SHF_EMPLOYEES: { SHF_LOCKED: "0" }, SHF_EMPLOYEE_DAY: d, SHF_DAY_CHANGES: null, SHF_ATTENDANCE: a };
  for (const briefing of [null, "0", "1"]) {
    a.TADREECH = briefing;
    assert.deepEqual(exitBlockers(rows, "0", { current: "0", base: "0" }, false), []);
  }
  a.STATION_ARRIVAL_TIME = null; a.STATION_ARRIVAL_USER = null;
  assert.deepEqual(exitBlockers(rows, "0", { current: "0", base: "0" }, false), ["STATION_ARRIVAL_REQUIRED"]);
  delete a.OPTIONAL1;
  assert.throws(() => exitBlockers(rows, "0", { current: "0", base: "0" }, false));
});
