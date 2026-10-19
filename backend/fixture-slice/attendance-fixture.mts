import type { AttendanceReadPort, AttendanceReadSelection } from "./attendance-contracts.mts";
import type { CurrentFixtureDay, CurrentFixtureEmployee } from "./current-shifts-fixture.mts";
import type { CatalogValueV1, CurrentShiftFixtureCatalog } from "./current-shifts-contracts.mts";
import { compareCode } from "./current-shifts-fixture.mts";
import { employeePrefix } from "./current-shifts-projection.mts";
import { attendanceSource, AttendanceError } from "./attendance-errors.mts";
import { attendanceLocations, attendanceGrants, eligibleAttendanceTeams, validateAttendanceCatalog, validateAttendanceSelection } from "./attendance-validation.mts";
import { compareAttendance, projectAttendance } from "./attendance-projection.mts";
import type { AttendanceFacts } from "./attendance-projection.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { catalogValue, mokedOption, plainLabel, unitCode } from "./current-shifts-validation.mts";

export interface AttendanceFixtureDay extends CurrentFixtureDay {
  hasChange: boolean; baselineSplitEndLocal: string | null; changedSplitEndLocal: string | null; exceptionCode: string | null;
}
export interface AttendanceFixtureData {
  catalog: CurrentShiftFixtureCatalog;
  employees: readonly CurrentFixtureEmployee[];
  days: readonly AttendanceFixtureDay[];
  attendance: readonly Pick<AttendanceFacts, "shiftDayId" | "stageArrivalLocal" | "stationArrivalLocal" |
    "stationExitLocal" | "missingReasonCode" | "briefingCode">[];
  activities: readonly CatalogValueV1[];
  innerJobs: readonly (CatalogValueV1 & { active: number; orgUnitId: string })[];
  exceptions: readonly CatalogValueV1[];
}
export class AttendanceFixtureReader implements AttendanceReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly data: AttendanceFixtureData;
  constructor(value: unknown) {
    if (!record(value) || !record(value.catalog) ||
        !["days", "employees", "attendance", "activities", "innerJobs", "exceptions"].every(k =>
          Array.isArray(value[k]) && value[k].length <= 25000) ||
        !Array.isArray(value.catalog.teams) || !Array.isArray(value.catalog.mokedUnits)) attendanceSource();
    this.data = structuredClone(value) as unknown as AttendanceFixtureData;
    // Emulate Oracle VARCHAR2 empty=NULL only at the isolated fixture boundary.
    for (const group of [
      { rows: this.data.employees, keys: ["innerJobCode"] },
      { rows: this.data.days, keys: ["changedEmployeeKey", "cancellationReason", "baselineHome", "changedHome",
        "baselineActivityData", "changedActivityData", "exceptionCode"] },
      { rows: this.data.attendance, keys: ["missingReasonCode", "briefingCode"] },
    ]) for (const row of group.rows) {
      const raw: unknown = row;
      if (!record(raw)) attendanceSource();
      for (const key of group.keys) if (raw[key] === "") raw[key] = null;
    }
    if (this.data.catalog.teams.length > 25000 || this.data.catalog.mokedUnits.length > 100 ||
        !this.data.catalog.teams.every(t => record(t) && unitCode(t.code) && plainLabel(t.label, 1) &&
          t.unitType === "J01" && unitCode(t.parentMokedCode)) ||
        !this.data.catalog.mokedUnits.every(mokedOption) ||
        !this.data.activities.every(catalogValue) || !this.data.exceptions.every(catalogValue) ||
        !this.data.innerJobs.every(j => catalogValue(j) && decimalId(j.code) && unitCode(j.orgUnitId) &&
          Number.isSafeInteger(j.active))) attendanceSource();
    for (const e of this.data.employees)
      if (!record(e) || !decimalId(e.employeeId) || !text(e.employeeNumber, 128, 8) ||
          !unitCode(e.teamCode) || !text(e.firstName, 40, 1) || !text(e.lastName, 40, 1) ||
          !(e.innerJobCode === null || typeof e.innerJobCode === "string")) attendanceSource();
    for (const d of this.data.days) {
      if (!record(d) || !decimalId(d.shiftDayId, 10) || typeof d.hasChange !== "boolean" ||
          !text(d.employeeKey, 8, 1) || !(d.changedEmployeeKey === null || text(d.changedEmployeeKey, 8, 1)) ||
          !(d.cancellationReason === null || typeof d.cancellationReason === "string") ||
          !(d.exceptionCode === null || typeof d.exceptionCode === "string")) attendanceSource();
      for (const key of ["baselineStartLocal", "changedStartLocal", "baselineEndLocal", "changedEndLocal",
        "baselineSplitEndLocal", "changedSplitEndLocal"])
        if (!(d[key] === null || localDateTime(d[key]))) attendanceSource();
      for (const key of ["baselineDayType", "changedDayType"])
        if (!(d[key] === null || (typeof d[key] === "number" && Number.isSafeInteger(d[key])))) attendanceSource();
      for (const key of ["baselineHome", "changedHome", "baselineActivityData", "changedActivityData"])
        if (!(d[key] === null || text(d[key], 12900))) attendanceSource();
    }
    for (const a of this.data.attendance) {
      if (!record(a) || !decimalId(a.shiftDayId, 10)) attendanceSource();
      for (const key of ["stageArrivalLocal", "stationArrivalLocal", "stationExitLocal"] as const)
        if (!(a[key] === null || localDateTime(a[key]))) attendanceSource();
      for (const key of ["missingReasonCode", "briefingCode"] as const)
        if (!(a[key] === null || typeof a[key] === "string")) attendanceSource();
    }
  }
  private context(grants: readonly string[]) {
    const teams = this.data.catalog.teams.filter(t => grants.includes(t.code)).sort((a,b) => compareCode(a.code,b.code));
    const c = { teamOptions: teams, mokedOptions: this.data.catalog.mokedUnits
      .filter(p => teams.some(t => t.parentMokedCode === p.code)).sort((a,b) => compareCode(a.code,b.code)),
      innerJobOptions: this.data.innerJobs.filter(j => j.active === 1 && grants.includes(j.orgUnitId))
        .map(j => ({ code: j.code, label: j.label })).sort((a,b) => compareCode(a.code,b.code)),
      workLocationOptions: attendanceLocations };
    validateAttendanceCatalog(c, grants);
    return c;
  }
  async readContext(grants: readonly string[], signal?: AbortSignal) {
    signal?.throwIfAborted();
    return structuredClone(this.context(grants));
  }
  async read(s: AttendanceReadSelection, signal?: AbortSignal) {
    validateAttendanceSelection(s);
    signal?.throwIfAborted();
    const original = attendanceGrants(s), c = this.context(original);
    const teams = eligibleAttendanceTeams(c, s, original);
    const rows = [], seen = new Set<string>();
    const from = s.attendanceDate + "T" + s.timeFrom + ":00", to = s.attendanceDate + "T" + s.timeTo + ":00";
    const within = (v: string | null) => v !== null && v >= from && v <= to;
    for (const d of this.data.days) {
      if (!d.hasChange && this.data.days.some(x => x.shiftDayId === d.shiftDayId && x.hasChange)) continue;
      if ((d.hasChange ? d.changedDayType : d.baselineDayType) !== 4 ||
          (d.hasChange && d.cancellationReason !== null) ||
          !(within(d.hasChange ? d.changedStartLocal : d.baselineStartLocal) ||
            within(d.hasChange ? d.changedSplitEndLocal : d.baselineSplitEndLocal))) continue;
      const key = d.hasChange ? d.changedEmployeeKey : d.employeeKey;
      const employees = this.data.employees.filter(e => key !== null && employeePrefix(e.employeeNumber) === key);
      const admitted = employees.filter(e => teams.includes(e.teamCode) &&
        (!s.innerJobCodes.length || s.innerJobCodes.includes(e.innerJobCode ?? "")));
      const home = d.hasChange ? d.changedHome : d.baselineHome;
      if (!admitted.length || (s.workLocations.length && !s.workLocations.some(l => home === (l === "home" ? "Y" : "N")))) continue;
      const a = this.data.attendance.filter(a => a.shiftDayId === d.shiftDayId);
      // Relevant key probes ignore overlay/filter suppression; never silently pick one.
      if (employees.length !== 1 || a.length > 1 || seen.has(d.shiftDayId) ||
          this.data.days.filter(x => x.shiftDayId === d.shiftDayId && !x.hasChange).length > 1 ||
          this.data.days.filter(x => x.shiftDayId === d.shiftDayId && x.hasChange).length > 1)
        throw new AttendanceError("AMBIGUOUS_ATTENDANCE");
      seen.add(d.shiftDayId);
      const e = admitted[0], team = c.teamOptions.find(t => t.code === e.teamCode)!;
      const moked = c.mokedOptions.find(p => p.code === team.parentMokedCode)!;
      rows.push(projectAttendance({ ...d, ...e, ...(d.hasChange ? {} : {
        changedStartLocal: null, changedEndLocal: null, changedActivityData: null, changedHome: null }),
        stageArrivalLocal: a[0]?.stageArrivalLocal ?? null, stationArrivalLocal: a[0]?.stationArrivalLocal ?? null,
        stationExitLocal: a[0]?.stationExitLocal ?? null, missingReasonCode: a[0]?.missingReasonCode ?? null,
        briefingCode: a[0]?.briefingCode ?? null },
      { code: team.code, label: team.label, moked }, this.data));
    }
    signal?.throwIfAborted();
    return rows.sort(compareAttendance).slice(s.offset, s.offset + s.limit + 1);
  }
}
