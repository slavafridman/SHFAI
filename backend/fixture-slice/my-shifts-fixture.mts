import type { CurrentFixtureData } from "./current-shifts-fixture.mts";
import { validateFixture } from "./current-shifts-fixture.mts";
import { activityTokens, employeePrefix } from "./current-shifts-projection.mts";
import type { MyShiftsReadPort, MyShiftsReadSelection, MyShiftRowV1 } from "./my-shifts-contracts.mts";
import { record } from "./contract-validation.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";
import { scheduleRow, scheduleSourceFailure } from "./my-shifts-validation.mts";
import { compareScheduleRows } from "./read-my-shifts.mts";

export interface MyShiftsFixtureData extends Omit<CurrentFixtureData, "days"> {
  days: readonly (CurrentFixtureData["days"][number] & { hasChange: boolean; baselinePresent?: boolean })[];
}
// Isolated relational double. Attendance is deliberately never consulted.
export class MyShiftsFixtureReader implements MyShiftsReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly data: MyShiftsFixtureData;
  constructor(value: unknown) {
    validateFixture(value);
    if (!value.days.every(d => record(d) && typeof d.hasChange === "boolean" &&
        (d.baselinePresent === undefined || typeof d.baselinePresent === "boolean"))) scheduleSourceFailure();
    this.data = structuredClone(value) as MyShiftsFixtureData;
  }
  async readEmployeeContext(id: string, grants: readonly string[]) {
    const employees = this.data.employees.filter(e => e.employeeId === id && grants.includes(e.teamCode));
    if (employees.length > 1) scheduleSourceFailure();
    const e = employees[0];
    if (!e) return null;
    const team = this.data.catalog.teams.find(t => t.code === e.teamCode);
    const parent = this.data.catalog.mokedUnits.find(p => p.code === team?.parentMokedCode);
    if (!team || !parent) return null;
    return { employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName,
      unit: { code: team.code, label: team.label, moked: { ...parent } } };
  }
  async withRead<T>(work: (port: MyShiftsReadPort) => Promise<T>): Promise<T> {
    let resolved: { id: string; grants: readonly string[];
      employee: Awaited<ReturnType<MyShiftsReadPort["readEmployeeContext"]>> } | undefined;
    return work({
      readEmployeeContext: async (id, grants) => {
        if (resolved) throw new MyShiftsError("INTERNAL_ERROR");
        const employee = await this.readEmployeeContext(id, grants);
        resolved = { id, grants: [...grants], employee };
        return employee;
      },
      readRows: async s => {
        if (!resolved || !resolved.employee || resolved.id !== s.employeeId ||
            JSON.stringify(resolved.grants) !== JSON.stringify(s.authorizedTeamUnitIds))
          throw new MyShiftsError("INTERNAL_ERROR");
        return this.rows(s, resolved.employee);
      },
    });
  }
  async readRows(s: MyShiftsReadSelection): Promise<MyShiftRowV1[]> {
    const employee = await this.readEmployeeContext(s.employeeId, s.authorizedTeamUnitIds);
    if (!employee) throw new MyShiftsError("FORBIDDEN");
    return this.rows(s, employee);
  }
  private rows(s: MyShiftsReadSelection, employee: NonNullable<Awaited<ReturnType<MyShiftsReadPort["readEmployeeContext"]>>>) {
    const e = this.data.employees.find(e => e.employeeId === s.employeeId)!;
    const key = employeePrefix(e.employeeNumber), rows: MyShiftRowV1[] = [], seen = new Set<string>();
    const changed = new Set(this.data.days.filter(d => d.hasChange).map(d => d.shiftDayId));
    for (const d of this.data.days) {
      if (!d.hasChange && changed.has(d.shiftDayId)) continue;
      const start = d.hasChange ? d.changedStartLocal : d.baselineStartLocal;
      if ((d.hasChange ? d.changedEmployeeKey : d.employeeKey) !== key ||
          (d.hasChange ? d.changedDayType : d.baselineDayType) !== 4 ||
          (d.hasChange && d.cancellationReason !== null) || start === null ||
          start < s.dateFrom + "T00:00:00" || start > s.dateTo + "T23:59:59") continue;
      if (d.hasChange && d.baselinePresent === false) scheduleSourceFailure();
      if (this.data.employees.filter(other => other.employeeNumber === e.employeeNumber &&
          s.authorizedTeamUnitIds.includes(other.teamCode)).length > 1 || seen.has(d.shiftDayId))
        throw new MyShiftsError("AMBIGUOUS_MY_SHIFTS");
      seen.add(d.shiftDayId);
      const row: MyShiftRowV1 = { shiftDayId: d.shiftDayId, employee,
        startLocal: d.hasChange ? d.changedStartLocal ?? d.baselineStartLocal! : d.baselineStartLocal!,
        endLocal: d.hasChange ? d.changedEndLocal ?? d.baselineEndLocal : d.baselineEndLocal,
        activities: activityTokens(d.hasChange ? d.changedActivityData ?? d.baselineActivityData : d.baselineActivityData)
          .map(code => ({ code, label: this.data.activities.find(a => a.code === code)?.label ?? null })) };
      if (!scheduleRow(row)) scheduleSourceFailure();
      rows.push(row);
    }
    return rows.sort(compareScheduleRows).slice(s.offset, s.offset + s.limit + 1);
  }
}
