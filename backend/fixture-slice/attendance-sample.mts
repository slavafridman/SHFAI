import type { AttendanceFixtureData } from "./attendance-fixture.mts";
import type { RawShiftDay } from "./contracts.mts";
import { sampleConfig, sampleCurrentFixture } from "./current-shifts-sample.mts";
export { sampleConfig };
// Explicit isolated synthetic fixture; never a fallback for Oracle.
// attendanceDate=2026-10-19&timeFrom=10:00&timeTo=10:00
export const sampleAttendanceFixture: AttendanceFixtureData = {
  catalog: sampleCurrentFixture.catalog,
  employees: [{ employeeId: "9007199254740993", employeeNumber: "TEST0001-extra",
    firstName: "עובד", lastName: "סינתטי", teamCode: "T01", innerJobCode: "101" }],
  days: [0,1].map(i => ({
    shiftDayId: String(19001 + i), employeeKey: "TEST0001", changedEmployeeKey: null, hasChange: false,
    baselineStartLocal: i ? "2026-10-19T08:00:17" : "2026-10-19T10:00:00", changedStartLocal: null,
    baselineEndLocal: "2026-10-20T01:00:37", changedEndLocal: null,
    baselineSplitEndLocal: i ? "2026-10-19T10:00:00" : null, changedSplitEndLocal: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null,
    baselineActivityData: "A;UNKNOWN;A", changedActivityData: null, baselineHome: "Y", changedHome: null,
    exceptionCode: null,
  })),
  attendance: [{ shiftDayId: "19002", stageArrivalLocal: null,
    stationArrivalLocal: "2026-10-19T08:04:59", stationExitLocal: "2026-10-20T01:02:03",
    missingReasonCode: "-1", briefingCode: "1" }],
  activities: [{ code: "A", label: "פעילות סינתטית" }],
  innerJobs: [{ code: "101", label: "תפקיד פנימי סינתטי", active: 1, orgUnitId: "T01" }], exceptions: [],
};
export const sampleAttendanceDetailRows: RawShiftDay[] = sampleAttendanceFixture.days.map(d => {
  const a = sampleAttendanceFixture.attendance.find(a => a.shiftDayId === d.shiftDayId);
  return { shiftDayId: d.shiftDayId, employeeId: "9007199254740993", firstName: "עובד", lastName: "סינתטי", orgUnitId: "T01",
    baselineStartLocal: d.baselineStartLocal, changedStartLocal: null, baselineEndLocal: d.baselineEndLocal, changedEndLocal: null,
    baselineActivityData: d.baselineActivityData, changedActivityData: null, baselineSiteId: null, changedSiteId: null,
    stageArrivalLocal: a?.stageArrivalLocal ?? null, stationArrivalLocal: a?.stationArrivalLocal ?? null,
    stationExitLocal: a?.stationExitLocal ?? null };
});
