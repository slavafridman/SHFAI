import type { RawShiftDay } from "../contracts.mts";

// Entirely synthetic; no employee directory or data imported from legacy/Oracle.
export const config = {
  deploymentClass: "isolated-test-demo",
  authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true,
  syntheticOrgUnitIds: ["TEST-U"],
  dataSource: "isolated-fixture",
  businessTimeZone: "Asia/Jerusalem", // Synthetic test interpretation, not confirmed business zone.
} as const;
export function row(overrides: Partial<RawShiftDay> = {}): RawShiftDay {
  return {
    employeeId: "1001", shiftDayId: "2001", firstName: "עובד", lastName: "סינתטי",
    orgUnitId: "TEST-U",
    baselineStartLocal: "2026-10-15T23:30:00", changedStartLocal: null,
    baselineEndLocal: "2026-10-16T07:00:00", changedEndLocal: null,
    baselineActivityData: "synthetic;activity", changedActivityData: null,
    baselineSiteId: "3001", changedSiteId: null,
    stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
    ...overrides,
  };
}
