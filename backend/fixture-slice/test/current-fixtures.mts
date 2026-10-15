import type { CurrentFixtureData, CurrentFixtureDay } from "../current-shifts-fixture.mts";
import type { PrincipalV1 } from "../contracts.mts";
export function day(overrides: Partial<CurrentFixtureDay> = {}): CurrentFixtureDay {
  return { shiftDayId: "1", employeeKey: "TEST0001", changedEmployeeKey: null,
    baselineStartLocal: "2024-02-29T23:00:17", changedStartLocal: null,
    baselineEndLocal: "2024-03-01T02:00:19", changedEndLocal: null,
    baselineDayType: 4, changedDayType: null, cancellationReason: null,
    baselineActivityData: "A;UNKNOWN;A;;", changedActivityData: null,
    baselineHome: null, changedHome: null, ...overrides };
}
export function data(days: CurrentFixtureDay[] = [day()]): CurrentFixtureData {
  return {
    catalog: { mokedUnits: [
      { code: "01", label: "Synthetic parent one", unitType: "G01" },
      { code: "02", label: "Synthetic parent two", unitType: "G01" },
    ], teams: [
      { code: "T01", label: "Synthetic team one", unitType: "J01", parentMokedCode: "01" },
      { code: "T02", label: "Synthetic sibling", unitType: "J01", parentMokedCode: "01" },
      { code: "T03", label: "Synthetic team three", unitType: "J01", parentMokedCode: "02" },
    ] },
    employees: [
      { employeeId: "9007199254740993", employeeNumber: "TEST0001-extra",
        firstName: "Synthetic", lastName: "One", teamCode: "T01", innerJobCode: "00" },
      { employeeId: "9007199254740994", employeeNumber: "TEST0002-extra",
        firstName: "Synthetic", lastName: "Two", teamCode: "T02", innerJobCode: "J" },
      { employeeId: "9007199254740995", employeeNumber: "TEST0003-extra",
        firstName: "Synthetic", lastName: "Three", teamCode: "T03", innerJobCode: null },
    ],
    days, attendance: [], activities: [{ code: "A", label: "Synthetic activity" }],
    innerJobs: [], missingReasons: [],
  };
}
export function principal(overrides: Partial<PrincipalV1> = {}): PrincipalV1 {
  return { subject: "test:reader", provider: "real", synthetic: false,
    displayName: "Synthetic test identity", roles: [],
    capabilities: ["shift-day:read", "current-shifts:read"], employeeId: null,
    resourceScope: { orgUnitIds: ["T01"] }, ...overrides };
}
export const at = { mode: "at" as const, attendanceDate: "2024-03-01", currentTime: "00:00" };
