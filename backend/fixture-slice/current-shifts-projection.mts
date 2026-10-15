import type { CatalogValueV1, CurrentShiftRowV1, MokedOptionV1 } from "./current-shifts-contracts.mts";
import type { CurrentFixtureAttendance, CurrentFixtureDay, CurrentFixtureEmployee } from "./current-shifts-fixture.mts";
import { catalogCode, currentRow, sourceFailure } from "./current-shifts-validation.mts";
export function employeePrefix(value: string): string {
  return [...value].slice(0, 8).join(""); // Oracle SUBSTR characters, not UTF-16 code units
}
export function activityTokens(value: string | null): string[] {
  const tokens = value === null ? [] : value.split(";").filter(t => t !== "");
  if (tokens.length > 100 || !tokens.every(catalogCode)) sourceFailure();
  return tokens;
}
export function projectCurrentShift(
  day: CurrentFixtureDay, employee: CurrentFixtureEmployee,
  team: { code: string; label: string }, parent: MokedOptionV1,
  attendance: CurrentFixtureAttendance | undefined,
  labels: { activities: readonly CatalogValueV1[]; innerJobs: readonly CatalogValueV1[];
    missingReasons: readonly CatalogValueV1[] },
): CurrentShiftRowV1 {
  const lookup = (code: string, values: readonly CatalogValueV1[]): CatalogValueV1 =>
    ({ code, label: values.find(v => v.code === code)?.label ?? null });
  const start = day.changedStartLocal ?? day.baselineStartLocal;
  const end = day.changedEndLocal ?? day.baselineEndLocal;
  if (start === null || end === null) sourceFailure();
  const reason = attendance?.missingReason;
  const home = day.changedHome ?? day.baselineHome;
  const row: CurrentShiftRowV1 = {
    shiftDayId: day.shiftDayId,
    employee: { employeeId: employee.employeeId, firstName: employee.firstName, lastName: employee.lastName,
      unit: { code: team.code, label: team.label, moked: { ...parent } } },
    startLocal: start, endLocal: end, workingFromHome: home === null ? null : home.toLowerCase() === "y",
    activities: activityTokens(day.changedActivityData ?? day.baselineActivityData).map(code => lookup(code, labels.activities)),
    innerJob: employee.innerJobCode === null || employee.innerJobCode === "" || employee.innerJobCode === "00"
      ? null : lookup(employee.innerJobCode, labels.innerJobs),
    attendanceDisplay: reason !== undefined && reason !== null && reason !== "0"
      ? { kind: "missing-reason", reason: lookup(reason, labels.missingReasons) }
      : attendance?.stationArrivalLocal != null ? { kind: "station-arrival", atLocal: attendance.stationArrivalLocal }
      : { kind: "not-recorded" },
  };
  if (!currentRow(row)) sourceFailure();
  return row;
}
