import type { CurrentShiftFixtureCatalog, CurrentShiftReadPort, CurrentShiftReadSelection,
  CurrentShiftRowV1, CatalogValueV1 } from "./current-shifts-contracts.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { catalogCode, catalogValue, mokedOption, plainLabel, sourceFailure, unitCode } from "./current-shifts-validation.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";
import { activityTokens, employeePrefix, projectCurrentShift } from "./current-shifts-projection.mts";

// Synthetic relational fixture only. No persistence adapter or real employee data.
export interface CurrentFixtureEmployee {
  employeeId: string;
  employeeNumber: string; // legacy join uses the first eight characters
  firstName: string;
  lastName: string;
  teamCode: string;
  innerJobCode: string | null;
}
export interface CurrentFixtureDay {
  shiftDayId: string;
  employeeKey: string;
  changedEmployeeKey: string | null;
  baselineStartLocal: string | null;
  changedStartLocal: string | null;
  baselineEndLocal: string | null;
  changedEndLocal: string | null;
  baselineDayType: number | null;
  changedDayType: number | null;
  cancellationReason: string | null;
  baselineActivityData: string | null;
  changedActivityData: string | null;
  baselineHome: string | null;
  changedHome: string | null;
}
export interface CurrentFixtureAttendance {
  shiftDayId: string;
  missingReason: string | null;
  stationArrivalLocal: string | null;
}
export interface CurrentFixtureData {
  catalog: CurrentShiftFixtureCatalog;
  activities: readonly CatalogValueV1[];
  innerJobs: readonly CatalogValueV1[];
  missingReasons: readonly CatalogValueV1[];
  employees: readonly CurrentFixtureEmployee[];
  days: readonly CurrentFixtureDay[];
  attendance: readonly CurrentFixtureAttendance[];
}
export function validateFixture(v: unknown): asserts v is CurrentFixtureData {
  if (!record(v) || !record(v.catalog) || !Array.isArray(v.catalog.mokedUnits) ||
      v.catalog.mokedUnits.length > 100 || !v.catalog.mokedUnits.every(mokedOption) ||
      !Array.isArray(v.catalog.teams) || v.catalog.teams.length > 25000) sourceFailure();
  const parents = new Set(v.catalog.mokedUnits.map(p => p.code));
  if (parents.size !== v.catalog.mokedUnits.length) sourceFailure();
  const teamCodes = new Set<string>();
  for (const t of v.catalog.teams) {
    if (!record(t) || !unitCode(t.code) || !plainLabel(t.label, 1) || t.unitType !== "J01" ||
        !unitCode(t.parentMokedCode) || !parents.has(t.parentMokedCode) || teamCodes.has(t.code) ||
        parents.has(t.code)) sourceFailure();
    teamCodes.add(t.code);
  }
  for (const field of ["activities", "innerJobs", "missingReasons"] as const) {
    const values = v[field];
    if (!Array.isArray(values) || values.length > 25000 || !values.every(catalogValue) ||
        new Set(values.map(c => c.code)).size !== values.length) sourceFailure();
  }
  if (!Array.isArray(v.employees) || v.employees.length > 25000 ||
      !Array.isArray(v.days) || v.days.length > 25000 ||
      !Array.isArray(v.attendance) || v.attendance.length > 25000) sourceFailure();
  const employeeIds = new Set<string>();
  for (const e of v.employees) {
    if (!record(e) || !decimalId(e.employeeId) || employeeIds.has(e.employeeId) ||
        !text(e.employeeNumber, 128, 8) || !text(e.firstName, 40) || !text(e.lastName, 40) ||
        !unitCode(e.teamCode) || !teamCodes.has(e.teamCode) ||
        !(e.innerJobCode === null || e.innerJobCode === "" || catalogCode(e.innerJobCode))) sourceFailure();
    employeeIds.add(e.employeeId);
  }
  for (const d of v.days) {
    if (!record(d) || !decimalId(d.shiftDayId, 10) || !text(d.employeeKey, 8, 1) ||
        !(d.changedEmployeeKey === null || text(d.changedEmployeeKey, 8, 1)) ||
        !(d.cancellationReason === null || catalogCode(d.cancellationReason))) sourceFailure();
    for (const key of ["baselineStartLocal", "changedStartLocal", "baselineEndLocal", "changedEndLocal"])
      if (!(d[key] === null || localDateTime(d[key]))) sourceFailure();
    for (const key of ["baselineDayType", "changedDayType"])
      if (!(d[key] === null || (typeof d[key] === "number" && Number.isSafeInteger(d[key])))) sourceFailure();
    for (const key of ["baselineActivityData", "changedActivityData"]) {
      if (!(d[key] === null || text(d[key], 12900))) sourceFailure();
      if (typeof d[key] === "string") activityTokens(d[key]);
    }
    for (const key of ["baselineHome", "changedHome"])
      if (!(d[key] === null || text(d[key], 128))) sourceFailure();
  }
  for (const a of v.attendance) {
    if (!record(a) || !decimalId(a.shiftDayId, 10) ||
        !(a.stationArrivalLocal === null || localDateTime(a.stationArrivalLocal)) ||
        !(a.missingReason === null || a.missingReason === "0" || decimalId(a.missingReason))) sourceFailure();
  }
}
export function compareCode(a: string, b: string): number {
  const aa = [...a], bb = [...b];
  for (let i = 0; i < Math.min(aa.length, bb.length); i++) {
    const delta = aa[i].codePointAt(0)! - bb[i].codePointAt(0)!;
    if (delta) return delta;
  }
  return aa.length - bb.length;
}
export function compareRows(a: CurrentShiftRowV1, b: CurrentShiftRowV1): number {
  return compareCode(a.startLocal, b.startLocal) ||
    (BigInt(a.shiftDayId) < BigInt(b.shiftDayId) ? -1 : BigInt(a.shiftDayId) > BigInt(b.shiftDayId) ? 1 : 0) ||
    (BigInt(a.employee.employeeId) < BigInt(b.employee.employeeId) ? -1 :
      BigInt(a.employee.employeeId) > BigInt(b.employee.employeeId) ? 1 : 0);
}
export class CurrentFixtureReader implements CurrentShiftReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly data: CurrentFixtureData;
  constructor(data: unknown, configuredTeamIds: readonly string[] = []) {
    validateFixture(data);
    this.data = structuredClone(data);
    this.validateTeams(configuredTeamIds);
  }
  validateTeams(ids: readonly string[]): void {
    if (ids.length > 100 || new Set(ids).size !== ids.length ||
        ids.some(id => !this.data.catalog.teams.some(t => t.code === id))) sourceFailure();
  }
  async readMokedOptions(ids: readonly string[]) {
    this.validateTeams(ids);
    const parents = new Set(this.data.catalog.teams.filter(t => ids.includes(t.code)).map(t => t.parentMokedCode));
    return structuredClone(this.data.catalog.mokedUnits.filter(p => parents.has(p.code))
      .sort((a, b) => compareCode(a.code, b.code)));
  }
  async readRows(selection: CurrentShiftReadSelection): Promise<CurrentShiftRowV1[]> {
    this.validateTeams(selection.authorizedTeamUnitIds);
    const at = selection.attendanceDate + "T" + selection.currentTime + ":00";
    const rows: CurrentShiftRowV1[] = [], seen = new Set<string>();
    const oldEmployeeMatches = new Map<string, number>();
    for (const e of this.data.employees) {
      const key = employeePrefix(e.employeeNumber);
      oldEmployeeMatches.set(key, (oldEmployeeMatches.get(key) ?? 0) + 1);
    }
    const employeesByKey = new Map<string, CurrentFixtureEmployee[]>();
    for (const e of this.data.employees) {
      if (!selection.authorizedTeamUnitIds.includes(e.teamCode)) continue;
      const key = employeePrefix(e.employeeNumber);
      const group = employeesByKey.get(key) ?? [];
      group.push(e);
      employeesByKey.set(key, group);
    }
    const attendanceByDay = new Map<string, CurrentFixtureAttendance[]>();
    for (const a of this.data.attendance) {
      const group = attendanceByDay.get(a.shiftDayId) ?? [];
      group.push(a);
      attendanceByDay.set(a.shiftDayId, group);
    }
    for (const d of this.data.days) {
      const start = d.changedStartLocal ?? d.baselineStartLocal;
      const end = d.changedEndLocal ?? d.baselineEndLocal;
      if (d.cancellationReason !== null || (d.changedDayType ?? d.baselineDayType) !== 4 ||
          start === null || end === null || !(start <= at && at < end)) continue;
      for (const e of employeesByKey.get(d.changedEmployeeKey ?? d.employeeKey) ?? []) {
        const team = this.data.catalog.teams.find(t => t.code === e.teamCode);
        const parent = this.data.catalog.mokedUnits.find(p => p.code === team?.parentMokedCode);
        if (!team || !parent) sourceFailure();
        if (selection.mokedCode !== null && selection.mokedCode !== parent.code) continue;
        const attendance = attendanceByDay.get(d.shiftDayId) ?? [];
        if (seen.has(d.shiftDayId) || attendance.length > 1 || (oldEmployeeMatches.get(d.employeeKey) ?? 0) > 1)
          throw new CurrentShiftError("AMBIGUOUS_CURRENT_SHIFT");
        seen.add(d.shiftDayId);
        rows.push(projectCurrentShift(d, e, team, parent, attendance[0], this.data));
      }
    }
    return rows.sort(compareRows).slice(selection.offset, selection.offset + selection.limit + 1);
  }
}
