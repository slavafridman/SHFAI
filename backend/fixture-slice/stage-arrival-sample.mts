import type { StageArrivalFactsV1, StageArrivalConfigurationV1 } from "./stage-arrival-contracts.mts";
import type { StartupConfig } from "./contracts.mts";

// Separate opt-in sample. Existing seven-read samples/defaults are untouched.
export const sampleStageArrivalConfig = {
  deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["0021"],
  dataSource: "isolated-fixture", businessTimeZone: "Asia/Jerusalem",
  attendanceStageArrivalMode: "isolated-fixture",
} satisfies StartupConfig & StageArrivalConfigurationV1;
export const sampleStageArrivalFacts: StageArrivalFactsV1 = {
  source: { environment: "F1-local-demo", fixtureSession: "replaced-by-store", dataSource: "isolated-fixture" },
  selection: { employeeId: "9001", shiftDayId: "6201" },
  orgUnitId: "0021", parentUnitId: "0012", revision: "f1-original-1",
  policy: { revision: "synthetic-policy-1", configuredMinutes: 0 },
  planned: { startLocal: "2026-10-20T10:30:00", endLocal: "2026-10-20T18:30:00" },
  attendance: { attendanceKey: { shiftDayId: "6201" }, stageArrivalLocal: null, stageArrivalUser: null,
    stationArrivalLocal: null, stationExitLocal: null, briefing: null,
    stageLateReasonCode: null, stageLateMinutes: null, stageLateRemark: null },
  missingPresent: false, outstandingReportsPresent: false, splitOrP2: false,
  cancelledOrNonActivityDay: false,
  lateReasonOptions: [{ code: "1", label: "סיבה סינתטית בלבד" }],
};
