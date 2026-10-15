import type { RawShiftDay, StartupConfig } from "./contracts.mts";
import type { CurrentFixtureData } from "./current-shifts-fixture.mts";

// Explicit opt-in local sample, never an automatic fallback. All identities are synthetic.
// Manual filter: attendanceDate=2024-03-01, currentTime=00:00, mokedCode omitted or "01".
export const sampleConfig: StartupConfig = {
  deploymentClass: "local-development", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T01"],
  dataSource: "isolated-fixture", businessTimeZone: "Asia/Jerusalem",
};
export const sampleCurrentFixture: CurrentFixtureData = {
  catalog: {
    mokedUnits: [{ code: "01", label: "מוקד סינתטי", unitType: "G01" }],
    teams: [{ code: "T01", label: "צוות סינתטי", unitType: "J01", parentMokedCode: "01" }],
  },
  employees: [{ employeeId: "9007199254740993", employeeNumber: "TEST0001-extra",
    firstName: "עובד", lastName: "סינתטי", teamCode: "T01", innerJobCode: "00" }],
  days: [{
    shiftDayId: "1", employeeKey: "TEST0001", changedEmployeeKey: null,
    baselineStartLocal: "2024-02-29T23:00:17", changedStartLocal: null,
    baselineEndLocal: "2024-03-01T02:00:19", changedEndLocal: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null,
    baselineActivityData: "A;UNRESOLVED;A", changedActivityData: null,
    baselineHome: null, changedHome: "y",
  }],
  attendance: [{ shiftDayId: "1", missingReason: null, stationArrivalLocal: "2024-02-29T23:00:37" }],
  activities: [{ code: "A", label: "פעילות סינתטית" }], innerJobs: [], missingReasons: [],
};
export const sampleDetailRows: RawShiftDay[] = [{
  employeeId: "9007199254740993", shiftDayId: "1", firstName: "עובד", lastName: "סינתטי", orgUnitId: "T01",
  baselineStartLocal: "2024-02-29T23:00:17", changedStartLocal: null,
  baselineEndLocal: "2024-03-01T02:00:19", changedEndLocal: null,
  baselineActivityData: "A;UNRESOLVED;A", changedActivityData: null,
  baselineSiteId: null, changedSiteId: null,
  stageArrivalLocal: null, stationArrivalLocal: "2024-02-29T23:00:37", stationExitLocal: null,
}];
