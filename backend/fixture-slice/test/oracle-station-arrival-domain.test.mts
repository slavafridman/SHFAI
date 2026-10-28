import test from "node:test";
import assert from "node:assert/strict";
import { stationBlockers, stationOnTime, stationOverlap } from "../oracle-station-arrival-domain.mts";

const planned = { startLocal: "2026-10-28T12:00:00", endLocal: "2026-10-28T20:00:00" };
function rows() {
  return { SHF_EMPLOYEES: { SHF_LOCKED: "0" },
    SHF_EMPLOYEE_DAY: { WM_DAY_TYPE: "4", WM_SCH_ACTIVITY_ID_DATA: null, WM_EXCEPTION_TYPE_ID: null,
      SPLIT_SHIFT: "N", SPLIT_START: null, SPLIT_END: null }, SHF_DAY_CHANGES: null,
    SHF_ATTENDANCE: { SHF_EMPLOYEE_DAY_ID: "1", STAGE_ARRIVAL_TIME: null as string | null,
      STAGE_ARRIVAL_USER: null as string | null, TADREECH: null as string | null,
      STATION_ARRIVAL_TIME: null, STATION_ARRIVAL_USER: null, STATION_EXIT_TIME: null, STATION_EXIT_USER: null,
      OPTIONAL1: null, MISS_REASON_ID: null, MISSING_TIME: null, MISSING_REMARK: null,
      STATION_LATE_REASON_ID: null, STATION_LATE_MINUTES: null, STATION_LATE_REMARK: null } };
}
test("native F2 admits null stage and preserves briefing NULL/0/1 and coherent existing stage", () => {
  for (const briefing of [null, "0", "1"]) for (const stage of [null, "2026-10-28T11:00:00"]) {
    const r = rows(); r.SHF_ATTENDANCE.TADREECH = briefing;
    r.SHF_ATTENDANCE.STAGE_ARRIVAL_TIME = stage; r.SHF_ATTENDANCE.STAGE_ARRIVAL_USER = stage && "synthetic";
    const before = structuredClone(r);
    assert.deepEqual(stationBlockers(r, "0", { current: "0", base: "0" }, false), []);
    assert.deepEqual(r, before);
  }
});
test("station uses inclusive full-instant offset-zero boundary, not F1 offset", () => {
  for (const t of ["11:00:00.000", "12:00:00.000"])
    assert.ok(stationOnTime({ planned }, new Date(`2026-10-28T${t}Z`), "UTC"));
  for (const t of ["10:59:59.999", "12:00:00.001"])
    assert.throws(() => stationOnTime({ planned }, new Date(`2026-10-28T${t}Z`), "UTC"), /COMMAND_SCOPE_DEFERRED/);
});
test("required lock/report/exception/overlap facts fail closed, never default false", () => {
  assert.deepEqual(stationBlockers(rows(), "1", { current: "0", base: "0" }, true),
    ["REPORT_REVIEW_REQUIRED", "OVERLAPPING_SHIFT"]);
  for (const current of ["1", "2"]) assert.ok(stationBlockers(rows(), "0", { current, base: "0" }, false).includes("UNSUPPORTED_DAY"));
  for (const lock of ["1", "", " 0", "false"]) {
    const r = rows(); r.SHF_EMPLOYEES.SHF_LOCKED = lock;
    if (lock === "1") assert.ok(stationBlockers(r, "0", { current: "0", base: "0" }, false).includes("EMPLOYEE_LOCKED"));
    else assert.throws(() => stationBlockers(r, "0", { current: "0", base: "0" }, false), /INVALID_SOURCE_DATA/);
  }
});
test("overlap validates multiplicity/endpoints before filters; half-open adjacency and zero length are empty", () => {
  const day = (id: string, start: string, end: string) => ({ day: { SHF_EMPLOYEE_DAY_ID: id, EMP_ID_NUMBER: "99999999",
    WM_SHIFT_START_DATETIME: start, WM_SHIFT_END_DATETIME: end, WM_DAY_TYPE: "4",
    WM_SCH_ACTIVITY_ID_DATA: null, WM_EXCEPTION_TYPE_ID: null, SPLIT_SHIFT: "N", SPLIT_START: null, SPLIT_END: null }, change: null });
  const selected = day("1", planned.startLocal, planned.endLocal);
  const active = () => {};
  assert.equal(stationOverlap([selected, day("2", planned.endLocal, "2026-10-29T01:00:00")], "1", planned, "UTC", "99999999", active), false);
  assert.equal(stationOverlap([selected, day("2", planned.startLocal, planned.startLocal)], "1", planned, "UTC", "99999999", active), false);
  assert.equal(stationOverlap([selected, day("2", "2026-10-27T23:00:00", "2026-10-28T13:00:00")], "1", planned, "UTC", "99999999", active), true);
  assert.throws(() => stationOverlap([selected, selected], "1", planned, "UTC", "99999999", active), /INVALID_SOURCE_DATA/);
  assert.throws(() => stationOverlap([selected, day("2", "", "")], "1", planned, "UTC", "99999999", active), /INVALID_SOURCE_DATA/);
});
test("overlap rejects genuine DST fold/gap candidate endpoints even outside the selected day", () => {
  const day = (id: string, start: string, end: string) => ({ day: { SHF_EMPLOYEE_DAY_ID: id, EMP_ID_NUMBER: "99999999",
    WM_SHIFT_START_DATETIME: start, WM_SHIFT_END_DATETIME: end, WM_DAY_TYPE: "4",
    WM_SCH_ACTIVITY_ID_DATA: null, WM_EXCEPTION_TYPE_ID: null, SPLIT_SHIFT: "N", SPLIT_START: null, SPLIT_END: null }, change: null });
  const selected = day("1", planned.startLocal, planned.endLocal);
  for (const date of ["2026-03-29", "2026-10-25"])
    assert.throws(() => stationOverlap([selected, day("2", `${date}T01:30:00`, `${date}T03:00:00`)],
      "1", planned, "Europe/London", "99999999", () => {}), /INVALID_SOURCE_DATA/);
});
