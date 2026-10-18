import type { PrincipalV1 } from "./contracts.mts";
import type { Clock, CurrentShiftDataSourceV1 } from "./current-shifts-contracts.mts";
import type { ShiftSearchReadPort, ShiftSearchRequestV1, ShiftSearchFilterContextV1, ShiftSearchListV1 } from "./shift-search-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { clockMinute } from "./read-current-shifts.mts";
import { invalidSearch, searchRow, validateSearchCatalog, validateSearchRequest } from "./shift-search-validation.mts";
import { compareRows } from "./current-shifts-fixture.mts";
import { sourceFailure, unitCode } from "./current-shifts-validation.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";

export class ReadShiftSearch {
  private readonly reader: ShiftSearchReadPort;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly dataSource: CurrentShiftDataSourceV1;
  constructor(reader: ShiftSearchReadPort, clock: Clock, zone: string, dataSource: CurrentShiftDataSourceV1) {
    this.reader = reader; this.clock = clock; this.zone = zone; this.dataSource = dataSource;
  }
  private async scope(principal: PrincipalV1, signal?: AbortSignal) {
    signal?.throwIfAborted(); validatePrincipal(principal);
    accessPolicy.requireShiftSearchRead(principal);
    const grants = accessPolicy.authorizedShiftSearchUnitIds(principal);
    if (grants.length > 100 || !grants.every(unitCode)) sourceFailure();
    const catalog = await this.reader.readCatalog(grants);
    signal?.throwIfAborted(); validateSearchCatalog(catalog, grants);
    return { grants, catalog };
  }
  async context(principal: PrincipalV1, signal?: AbortSignal): Promise<ShiftSearchFilterContextV1> {
    const { catalog } = await this.scope(principal, signal);
    const at = clockMinute(this.clock, this.zone, true);
    return { defaults: { attendanceDate: at.attendanceDate, timeFrom: at.currentTime, timeTo: at.currentTime,
      mokedCode: catalog.mokedOptions.length === 1 ? catalog.mokedOptions[0].code : null,
      teamCodes: [], innerJobCodes: [], workLocations: [] },
    mokedOptions: catalog.mokedOptions.map(p => ({ code: p.code, label: p.label, unitType: p.unitType })),
    teamOptions: catalog.teamOptions.map(t => ({ code: t.code, label: t.label,
      unitType: t.unitType, parentMokedCode: t.parentMokedCode })),
    innerJobOptions: catalog.innerJobOptions.map(j => ({ code: j.code, label: j.label })),
    workLocationOptions: catalog.workLocationOptions.map(l => ({ code: l.code, label: l.label })),
    businessTimeZone: this.zone, dataSource: this.dataSource };
  }
  async list(principal: PrincipalV1, input: ShiftSearchRequestV1, signal?: AbortSignal): Promise<ShiftSearchListV1> {
    validatePrincipal(principal);
    const r = validateSearchRequest(input);
    const { catalog } = await this.scope(principal, signal);
    const parent = r.mokedCode ?? null;
    if (parent !== null && !catalog.mokedOptions.some(p => p.code === parent)) throw new ShiftSearchError("FORBIDDEN");
    if (r.teamCodes?.some(code => !catalog.teamOptions.some(t => t.code === code))) throw new ShiftSearchError("FORBIDDEN");
    if (r.teamCodes?.some(code => parent !== null &&
        !catalog.teamOptions.some(t => t.code === code && t.parentMokedCode === parent))) invalidSearch("teamCodes");
    if (r.innerJobCodes?.some(code => !catalog.innerJobOptions.some(j => j.code === code))) invalidSearch("innerJobCodes");
    const teams = catalog.teamOptions.filter(t => (parent === null || t.parentMokedCode === parent) &&
      (!r.teamCodes || r.teamCodes.includes(t.code))).map(t => t.code);
    const limit = r.limit ?? 25, offset = r.offset ?? 0;
    const rows = await this.reader.readRows({ attendanceDate: r.attendanceDate, timeFrom: r.timeFrom, timeTo: r.timeTo,
      authorizedTeamUnitIds: teams, mokedCode: parent, innerJobCodes: r.innerJobCodes ?? [],
      workLocations: r.workLocations ?? [], limit, offset, sort: "effective-start-asc" });
    signal?.throwIfAborted();
    if (!Array.isArray(rows) || rows.length > limit + 1 || !rows.every(searchRow)) sourceFailure();
    const seen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      if (seen.has(row.shiftDayId)) throw new ShiftSearchError("AMBIGUOUS_SHIFT_SEARCH");
      seen.add(row.shiftDayId);
      const team = catalog.teamOptions.find(t => t.code === row.employee.unit.code);
      const moked = catalog.mokedOptions.find(p => p.code === row.employee.unit.moked.code);
      if (!teams.includes(row.employee.unit.code) || !team || !moked ||
          team.label !== row.employee.unit.label || team.parentMokedCode !== moked.code ||
          row.employee.unit.moked.label !== moked.label ||
          row.startLocal < r.attendanceDate + "T" + r.timeFrom + ":00" ||
          row.startLocal > r.attendanceDate + "T" + r.timeTo + ":00" ||
          (r.innerJobCodes && !r.innerJobCodes.includes(row.innerJob?.code ?? "")) ||
          (i && compareRows({ ...rows[i - 1], attendanceDisplay: { kind: "not-recorded" } },
            { ...row, attendanceDisplay: { kind: "not-recorded" } }) >= 0)) sourceFailure();
    }
    // Allowlisted wire projection: never serialize a raw reader/provider record.
    const items = rows.slice(0, limit).map(row => ({
      shiftDayId: row.shiftDayId, employee: { employeeId: row.employee.employeeId,
        firstName: row.employee.firstName, lastName: row.employee.lastName,
        unit: { code: row.employee.unit.code, label: row.employee.unit.label,
          moked: { code: row.employee.unit.moked.code, label: row.employee.unit.moked.label, unitType: "G01" as const } } },
      startLocal: row.startLocal, endLocal: row.endLocal, workingFromHome: row.workingFromHome,
      activities: row.activities.map(v => ({ code: v.code, label: v.label })),
      innerJob: row.innerJob === null ? null : { code: row.innerJob.code, label: row.innerJob.label },
      activityFallback: row.activityFallback === null ? null : { code: row.activityFallback.code, label: row.activityFallback.label },
      indicators: { hasRemark: row.indicators.hasRemark, hasCancelLoginAnnotation: row.indicators.hasCancelLoginAnnotation,
        timeOrLocationChanged: row.indicators.timeOrLocationChanged, split: row.indicators.split,
        addedStaffing: row.indicators.addedStaffing, employeeReassigned: row.indicators.employeeReassigned,
        extensionAllocated: row.indicators.extensionAllocated },
    }));
    const hasMore = rows.length > limit, next = offset + items.length;
    return { items, applied: { attendanceDate: r.attendanceDate, timeFrom: r.timeFrom, timeTo: r.timeTo,
      mokedCode: parent, teamCodes: r.teamCodes ?? [], innerJobCodes: r.innerJobCodes ?? [],
      workLocations: r.workLocations ?? [], sort: "effective-start-asc" },
    page: { limit, offset, hasMore, nextOffset: hasMore && next <= 10000 ? next : null },
    businessTimeZone: this.zone, dataSource: this.dataSource };
  }
}
