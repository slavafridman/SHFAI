import { test } from "node:test";
import assert from "node:assert/strict";
import { AttendanceFixtureReader } from "../attendance-fixture.mts";
import { parseAttendanceQuery } from "../attendance-validation.mts";
import type { AttendanceFixtureData } from "../attendance-fixture.mts";
import { projectAttendance } from "../attendance-projection.mts";

export const fixture: AttendanceFixtureData = {
  catalog: { mokedUnits: [{ code: "01", label: "מוקד", unitType: "G01" }],
    teams: [{ code: "001", label: "צוות", unitType: "J01", parentMokedCode: "01" }] },
  employees: [{ employeeId: "9007199254740993", employeeNumber: "SYNTH001", firstName: "שם", lastName: "בדיקה",
    teamCode: "001", innerJobCode: null }],
  days: [{ shiftDayId: "12", employeeKey: "SYNTH001", hasChange: false, changedEmployeeKey: null,
    baselineStartLocal: "2026-10-19T08:00:00", changedStartLocal: null,
    baselineEndLocal: "2026-10-20T01:00:00", changedEndLocal: null,
    baselineSplitEndLocal: "2026-10-19T10:00:00", changedSplitEndLocal: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null, baselineHome: "Y", changedHome: null,
    baselineActivityData: "1;1;unknown", changedActivityData: null, exceptionCode: null }],
  attendance: [], activities: [{ code: "1", label: "פעילות" }], innerJobs: [], exceptions: [],
};
export const selection = { attendanceDate: "2026-10-19", timeFrom: "10:00", timeTo: "10:00",
  authorizedTeamUnitIds: ["001"], mokedCode: null, innerJobCodes: [], workLocations: [],
  limit: 25, offset: 0, sort: "effective-start-asc" as const };
test("attendance split-only membership preserves absent record and precision, not arrival filtering", async () => {
  const rows = await new AttendanceFixtureReader(fixture).read(selection);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].employee.employeeId, "9007199254740993");
  assert.deepEqual(rows[0].attendance, { stageArrivalLocal: null, stationArrivalLocal: null,
    stationExitLocal: null, missingReasonCode: null, briefingRecorded: null });
  assert.equal(rows[0].planned.activities.length, 3);
  const data = structuredClone(fixture);
  data.attendance = [{ shiftDayId: "12", stageArrivalLocal: null, stationArrivalLocal: "2026-10-18T04:01:59",
    stationExitLocal: "2026-10-21T00:00:00", missingReasonCode: "-1", briefingCode: "0" }];
  const actual = await new AttendanceFixtureReader(data).read(selection);
  assert.equal(actual[0].attendance.missingReasonCode, "-1");
  assert.equal(actual[0].attendance.stationArrivalLocal, "2026-10-18T04:01:59");
});
test("attendance strict Gregorian query equality, seconds and unsupported grammar", () => {
  assert.equal(parseAttendanceQuery("attendanceDate=2024-02-29&timeFrom=00:00&timeTo=23:59").timeTo, "23:59");
  for (const raw of ["attendanceDate=2023-02-29&timeFrom=00:00&timeTo=23:59",
    "attendanceDate=2024-02-29&timeFrom=23:59&timeTo=00:00",
    "attendanceDate=2024-02-29&timeFrom=10:00:00&timeTo=10:00",
    "attendanceDate=2024-02-29&timeFrom=10:00&timeTo=10:00&%74imeTo=11:00",
    "x=%FF", "teamCodes[]=001", "x=" + "a".repeat(8192)])
    assert.throws(() => parseAttendanceQuery(raw));
});
test("attendance detects relevant duplicate before empty page and rejects cancellation zero", async () => {
  const d = structuredClone(fixture);
  d.attendance = [0,1].map(() => ({ shiftDayId: "12", stageArrivalLocal: null, stationArrivalLocal: null,
    stationExitLocal: null, missingReasonCode: null, briefingCode: null }));
  await assert.rejects(new AttendanceFixtureReader(d).read({ ...selection, offset: 10000 }), { code: "AMBIGUOUS_ATTENDANCE" });
  const changed = structuredClone(fixture);
  changed.days = [{ ...changed.days[0], hasChange: true, changedEmployeeKey: "SYNTH001",
    changedDayType: 4, changedSplitEndLocal: "2026-10-19T10:00:00", cancellationReason: "0" }];
  assert.deepEqual(await new AttendanceFixtureReader(changed).read(selection), []);
});
