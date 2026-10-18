import type { SearchFixtureData } from "./shift-search-fixture.mts";
import type { RawShiftDay } from "./contracts.mts";
import { sampleConfig, sampleCurrentFixture } from "./current-shifts-sample.mts";
export { sampleConfig };

// Explicit isolated fixture handoff. Not loaded implicitly and never a DB fallback.
// GET search?attendanceDate=2026-10-15&timeFrom=10:00&timeTo=10:00
export const sampleSearchFixture: SearchFixtureData = {
  ...sampleCurrentFixture,
  employees: [{ employeeId: "1001", employeeNumber: "TEST0001-extra",
    firstName: "עובד", lastName: "סינתטי", teamCode: "T01", innerJobCode: "1" }],
  days: [{
    shiftDayId: "3001", employeeKey: "TEST0001", changedEmployeeKey: null, hasChange: false,
    baselineStartLocal: "2026-10-15T10:00:00", changedStartLocal: null,
    baselineEndLocal: "2026-10-15T18:00:37", changedEndLocal: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null,
    baselineActivityData: "A;UNKNOWN;A", changedActivityData: null,
    baselineHome: "Y", changedHome: null,
    markers: { remark: "synthetic", cancelLoginApplier: null, baselineSplit: "Y",
      changedSplit: null, source: "fixture", baselineExtension: "synthetic",
      changedExtension: null, exceptionCode: "1" },
  }],
  attendance: [], cancelLogins: [],
  innerJobs: [{ code: "1", label: "תפקיד סינתטי", orgUnitId: "T01", active: 1 }],
  exceptions: [{ code: "1", label: "חריגה סינתטית" }],
};
export const sampleSearchDetailRows: RawShiftDay[] = sampleSearchFixture.days.map(d => ({
  shiftDayId: d.shiftDayId, employeeId: "1001", firstName: "עובד", lastName: "סינתטי", orgUnitId: "T01",
  baselineStartLocal: d.baselineStartLocal, changedStartLocal: null,
  baselineEndLocal: d.baselineEndLocal, changedEndLocal: null,
  baselineActivityData: d.baselineActivityData, changedActivityData: null,
  baselineSiteId: null, changedSiteId: null, stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
}));
