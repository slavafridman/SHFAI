import type { CurrentFixtureData, CurrentFixtureDay } from "./current-shifts-fixture.mts";
import { validateFixture, compareCode, compareRows } from "./current-shifts-fixture.mts";
import { employeePrefix } from "./current-shifts-projection.mts";
import { decimalId, record } from "./contract-validation.mts";
import { plainLabel, sourceFailure, unitCode } from "./current-shifts-validation.mts";
import type { ShiftSearchReadPort, ShiftSearchReadSelection, ShiftSearchRowV1 } from "./shift-search-contracts.mts";
import type { SearchMarkers } from "./shift-search-projection.mts";
import { projectSearchShift, validateMarkers } from "./shift-search-projection.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";
import { validateSearchCatalog } from "./shift-search-validation.mts";
import type { CatalogValueV1 } from "./current-shifts-contracts.mts";

export interface SearchFixtureDay extends CurrentFixtureDay {
  hasChange: boolean; // ANY row, even with all nullable fields, suppresses baseline.
  markers: SearchMarkers;
}
export interface SearchFixtureData extends Omit<CurrentFixtureData, "days" | "innerJobs"> {
  days: readonly SearchFixtureDay[];
  innerJobs: readonly (CatalogValueV1 & { orgUnitId: string; active: number })[];
  exceptions: readonly CatalogValueV1[];
  cancelLogins: readonly { shiftDayId: string; applier: string | null }[];
}
// Isolated relational double only, never an Oracle fallback.
export class SearchFixtureReader implements ShiftSearchReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly data: SearchFixtureData;
  constructor(value: unknown) {
    validateFixture(value);
    if (!record(value) || !Array.isArray(value.days) || !value.days.every(d => record(d) &&
        typeof d.hasChange === "boolean" && record(d.markers)) ||
        !Array.isArray(value.innerJobs) || !value.innerJobs.every(j => record(j) &&
          unitCode(j.orgUnitId) && typeof j.active === "number" && Number.isSafeInteger(j.active)) ||
        !Array.isArray(value.exceptions) || value.exceptions.length > 25000 ||
        !value.exceptions.every(j => record(j) && decimalId(j.code) &&
          (j.label === null || plainLabel(j.label, 1))) ||
        new Set(value.exceptions.map(j => j.code)).size !== value.exceptions.length ||
        !Array.isArray(value.cancelLogins) || value.cancelLogins.length > 25000 ||
        !value.cancelLogins.every(l => record(l) && decimalId(l.shiftDayId, 10) &&
          (l.applier === null || typeof l.applier === "string"))) sourceFailure();
    this.data = structuredClone(value) as unknown as SearchFixtureData;
    for (const day of this.data.days) validateMarkers(day.markers);
  }
  async readCatalog(grants: readonly string[]) {
    if (grants.length > 100 || new Set(grants).size !== grants.length || !grants.every(unitCode) ||
        grants.some(g => !this.data.catalog.teams.some(t => t.code === g))) sourceFailure();
    const teamOptions = this.data.catalog.teams.filter(t => grants.includes(t.code)).sort((a, b) => compareCode(a.code, b.code));
    const catalog = {
      teamOptions, mokedOptions: this.data.catalog.mokedUnits.filter(p => teamOptions.some(t => t.parentMokedCode === p.code))
        .sort((a, b) => compareCode(a.code, b.code)),
      innerJobOptions: this.data.innerJobs.filter(j => j.active === 1 && grants.includes(j.orgUnitId))
        .map(j => ({ code: j.code, label: j.label })).sort((a, b) => compareCode(a.code, b.code)),
      workLocationOptions: [{ code: "home" as const, label: "בית" }, { code: "site" as const, label: "אתר" }],
    };
    validateSearchCatalog(catalog, grants);
    return structuredClone(catalog);
  }
  async readRows(s: ShiftSearchReadSelection): Promise<ShiftSearchRowV1[]> {
    const catalog = await this.readCatalog(s.authorizedTeamUnitIds);
    const rows: ShiftSearchRowV1[] = [], seen = new Set<string>();
    const changedIds = new Set(this.data.days.filter(d => d.hasChange).map(d => d.shiftDayId));
    for (const d of this.data.days) {
      if (!d.hasChange && changedIds.has(d.shiftDayId)) continue;
      const start = d.hasChange ? d.changedStartLocal : d.baselineStartLocal;
      const key = d.hasChange ? d.changedEmployeeKey : d.employeeKey;
      const home = d.hasChange ? d.changedHome : d.baselineHome;
      if ((d.hasChange ? d.changedDayType : d.baselineDayType) !== 4 || key === null ||
          (d.hasChange && d.cancellationReason !== null) || start === null ||
          start < s.attendanceDate + "T" + s.timeFrom + ":00" ||
          start > s.attendanceDate + "T" + s.timeTo + ":00" ||
          (s.workLocations.length && !s.workLocations.some(l => home === (l === "home" ? "Y" : "N")))) continue;
      const matching = this.data.employees.filter(e => employeePrefix(e.employeeNumber) === key);
      const attendance = this.data.attendance.filter(a => a.shiftDayId === d.shiftDayId);
      const qualifyingAttendance = attendance.length ? attendance.filter(a => a.missingReason === null).length : 1;
      const logins = this.data.cancelLogins.filter(l => l.shiftDayId === d.shiftDayId);
      for (const e of matching) {
        if (!s.authorizedTeamUnitIds.includes(e.teamCode) ||
            (s.innerJobCodes.length && !s.innerJobCodes.includes(e.innerJobCode ?? ""))) continue;
        const team = catalog.teamOptions.find(t => t.code === e.teamCode)!;
        if (s.mokedCode !== null && team.parentMokedCode !== s.mokedCode) continue;
        const multiplicity = matching.length * qualifyingAttendance * Math.max(1, logins.length);
        if (!multiplicity) continue;
        if (multiplicity > 1 || seen.has(d.shiftDayId)) throw new ShiftSearchError("AMBIGUOUS_SHIFT_SEARCH");
        seen.add(d.shiftDayId);
        const parent = catalog.mokedOptions.find(p => p.code === team.parentMokedCode)!;
        const effectiveDay = d.hasChange ? d : { ...d, changedEmployeeKey: null, changedStartLocal: null,
          changedEndLocal: null, changedHome: null, changedActivityData: null };
        rows.push(projectSearchShift(effectiveDay, e, team, parent,
          { ...d.markers, ...(d.hasChange ? {} : { changedSplit: null, changedExtension: null }),
            cancelLoginApplier: logins[0]?.applier ?? null }, this.data));
      }
    }
    return rows.sort((a, b) => compareRows({ ...a, attendanceDisplay: { kind: "not-recorded" } },
      { ...b, attendanceDisplay: { kind: "not-recorded" } })).slice(s.offset, s.offset + s.limit + 1);
  }
}
