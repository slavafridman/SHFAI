// Isolated synthetic UI/QA entrypoint helper; no process ENV fallback, Oracle
// protocol authority, metadata certificate, operator path or credential source.
export const cancellationFixtureConfig = {
  attendanceStationExitCancellationMode: "isolated-fixture",
  attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
  attendanceStationArrivalLateMode: "disabled", attendanceStationExitMode: "disabled", shiftManagementMode: "disabled",
  deploymentClass: "isolated-test-demo", authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
  syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC", dataSource: "isolated-fixture",
};
export const cancellationFixtureOrigin = "http://localhost:4200";
export function cancellationFixtureEnvironment(scenarioId = "ready"): NodeJS.ProcessEnv {
  return { SHF_APP_ENV: "test", SHF_FIXTURE_CONFIG: JSON.stringify(cancellationFixtureConfig), SHF_FIXTURE_PORT: "0",
    SHF_STATION_EXIT_CANCELLATION_ORIGINS: JSON.stringify([cancellationFixtureOrigin]),
    SHF_STATION_EXIT_CANCELLATION_FIXTURE: JSON.stringify({ version: "shf-station-exit-cancellation-fixture-v1",
      scenarioId, clockInstant: "2026-11-01T12:00:00.123Z" }),
    SHF_FIXTURE_ROWS: JSON.stringify([{ employeeId: "9001", shiftDayId: "6201", firstName: "Synthetic",
      lastName: "Fixture", orgUnitId: "T001", baselineStartLocal: "2026-11-01T11:00:00", changedStartLocal: null,
      baselineEndLocal: "2026-11-01T12:01:00", changedEndLocal: null, baselineActivityData: null, changedActivityData: null,
      baselineSiteId: "7001", changedSiteId: null, stageArrivalLocal: null, stationArrivalLocal: "2026-11-01T11:00:00",
      stationExitLocal: scenarioId === "not-recorded" ? null : scenarioId === "early-deferred" ?
        "2026-11-01T11:00:00" : "2026-11-01T11:59:50" }]),
    SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify({ catalog: {
      mokedUnits: [{ code: "M001", label: "Synthetic parent", unitType: "G01" }],
      teams: [{ code: "T001", label: "Synthetic team", unitType: "J01", parentMokedCode: "M001" }] },
      employees: [], days: [], attendance: [], activities: [], innerJobs: [], missingReasons: [] }) };
}
