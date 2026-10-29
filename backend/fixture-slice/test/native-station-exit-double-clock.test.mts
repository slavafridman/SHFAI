import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { ExitOracleDouble } from "./native-station-exit-double.mts";
import { exitBlockers, exitTiming } from "../oracle-station-exit-domain.mts";

for (const at of [
  "2026-10-29T06:40:00.123Z",
  "2026-10-29T08:00:00.000Z",
  "2026-10-29T15:59:30.123Z",
  "2026-10-29T00:00:00.000Z",
  "2026-10-29T00:00:00.123Z",
  "2026-10-29T23:59:50.000Z",
  "2026-10-29T23:59:55.000Z",
  "2026-10-29T23:59:59.999Z",
  "2028-02-29T12:00:00.123Z",
  "2028-02-29T23:59:59.999Z",
]) test(`isolated exit real-clock interval is coherent at ${at}`, () => {
  const clockMs = Date.parse(at), d = new ExitOracleDouble(true, clockMs);
  try {
    assert.equal(d.clock.now().getTime(), clockMs);
    const day = at.slice(0, 10), midnight = Date.parse(day + "T00:00:00Z");
    const source = d.rows.SHF_EMPLOYEE_DAY!, attendance = d.rows.SHF_ATTENDANCE!;
    const start = source.WM_SHIFT_START_DATETIME, end = source.WM_SHIFT_END_DATETIME;
    assert.equal(typeof start, "string"); assert.equal(typeof end, "string");
    assert.equal(start, new Date(Math.max(midnight, clockMs - 3600000)).toISOString().slice(0, 19));
    const lastWholeSecond = midnight + 86400000 - 1000;
    assert.equal(end, new Date(Math.min(clockMs + 10000, lastWholeSecond)).toISOString().slice(0, 19));
    const startMs = Date.parse(start + "Z"), endMs = Date.parse(end + "Z");
    assert.ok(startMs <= clockMs, "planned start is not in the future");
    assert.ok(clockMs <= endMs + 10 * 60000, "captured clock is within the existing A10 post-end window");
    assert.ok(endMs > startMs, "planned duration is positive");
    assert.equal(start!.slice(0, 10), day, "start belongs to the captured UTC day");
    assert.equal(end!.slice(0, 10), day, "end belongs to the captured UTC day");
    assert.equal(attendance.STATION_ARRIVAL_TIME, start);
    assert.ok(Date.parse(attendance.STATION_ARRIVAL_TIME! + "Z") <= clockMs);
    assert.equal(attendance.STATION_ARRIVAL_USER, "synthetic-original");
    assert.equal(attendance.STATION_EXIT_TIME, null);
    assert.equal(attendance.STATION_EXIT_USER, null);
    assert.equal(source.WM_DAY_TYPE, "4"); assert.equal(source.SOURCE, "SYNTHETIC_DAYS");
    assert.equal(source.SPLIT_SHIFT, "N"); assert.equal(d.rows.SHF_DAY_CHANGES, null);
    assert.ok(Date.parse(d.binding.windowStart) <= clockMs && clockMs < Date.parse(d.binding.windowEnd));
    assert.equal(d.rows.system0!.DEFAULT_VALUE, "0"); assert.equal(d.rows.system1!.DEFAULT_VALUE, "10");
    const timing = exitTiming({ planned: { startLocal: start!, endLocal: end! }, rows: d.rows,
      policy: { maxEarlyWholeMinutes: 0, maxAfterEndMinutes: 10 } }, d.clock.now(), "UTC", d.binding);
    assert.equal(timing.classification, "ordinary");
    assert.equal(timing.withinExitWindow, true);
    assert.equal(Date.parse(timing.exitWindow.latestInclusiveAt), endMs + 10 * 60000);
    assert.ok(Date.parse(timing.exitWindow.earliestInclusiveAt) <= clockMs);
    assert.ok(clockMs <= Date.parse(timing.exitWindow.latestInclusiveAt));
    if (clockMs + 10000 > lastWholeSecond) {
      assert.equal(timing.transition, midnight + 86400000);
      const afterMidnight = exitTiming({ planned: { startLocal: start!, endLocal: end! }, rows: d.rows,
        policy: { maxEarlyWholeMinutes: 0, maxAfterEndMinutes: 10 } },
      new Date(midnight + 86400000), "UTC", d.binding);
      assert.equal(afterMidnight.classification, "outside-window");
      assert.equal(afterMidnight.withinExitWindow, false);
    }
    assert.deepEqual(exitBlockers(d.rows, d.reports,
      { current: d.exceptions, base: d.baseExceptions }, false), []);
    assert.equal(existsSync(d.binding.allowanceFile), false);
    assert.equal(d.sql.length, 0); assert.equal(d.events.length, 0);
  } finally { d.dispose(); assert.equal(existsSync(d.directory), false); }
});

test("isolated exit explicitly mutated next-day end remains outside-window", () => {
  const d = new ExitOracleDouble(true, Date.parse("2026-10-29T23:59:55.000Z"));
  try {
    const source = d.rows.SHF_EMPLOYEE_DAY!;
    source.WM_SHIFT_END_DATETIME = new Date(d.clockMs + 10000).toISOString().slice(0, 19);
    assert.equal(source.WM_SHIFT_END_DATETIME, "2026-10-30T00:00:05");
    const timing = exitTiming({ planned: { startLocal: source.WM_SHIFT_START_DATETIME!,
      endLocal: source.WM_SHIFT_END_DATETIME }, rows: d.rows,
    policy: { maxEarlyWholeMinutes: 0, maxAfterEndMinutes: 10 } }, d.clock.now(), "UTC", d.binding);
    assert.equal(timing.classification, "outside-window");
    assert.equal(timing.withinExitWindow, false);
    assert.equal(d.sql.length, 0); assert.equal(d.events.length, 0);
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); assert.equal(existsSync(d.directory), false); }
});

test("isolated exit default clock and static 08-to-16 interval remain unchanged", () => {
  const d = new ExitOracleDouble();
  try {
    assert.equal(d.clockMs, Date.parse("2026-10-28T15:59:30.123Z"));
    assert.equal(d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME, "2026-10-28T08:00:00");
    assert.equal(d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME, "2026-10-28T16:00:00");
    assert.equal(d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME, "2026-10-28T08:00:00");
  } finally { d.dispose(); assert.equal(existsSync(d.directory), false); }
});

test("isolated exit fixture timestamp is ignored outside real-clock mode", () => {
  const d = new ExitOracleDouble(false, Date.parse("2028-02-29T00:00:00Z"));
  try {
    assert.equal(d.clockMs, Date.parse("2026-10-28T15:59:30.123Z"));
    assert.equal(d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME, "2026-10-28T08:00:00");
    assert.equal(d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME, "2026-10-28T16:00:00");
    assert.equal(d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME, "2026-10-28T08:00:00");
  } finally { d.dispose(); assert.equal(existsSync(d.directory), false); }
});

test("isolated exit real-clock mode captures the actual clock by default", () => {
  const before = Date.now(), d = new ExitOracleDouble(true), after = Date.now();
  try {
    assert.ok(before <= d.clockMs && d.clockMs <= after);
    const lastWholeSecond = Date.parse(new Date(d.clockMs).toISOString().slice(0, 10) + "T23:59:59Z");
    assert.equal(d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME,
      new Date(Math.min(d.clockMs + 10000, lastWholeSecond)).toISOString().slice(0, 19));
  } finally { d.dispose(); assert.equal(existsSync(d.directory), false); }
});
