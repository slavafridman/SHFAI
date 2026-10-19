import type { PrincipalV1 } from "./contracts.mts";
import type { Clock, CurrentShiftDataSourceV1 } from "./current-shifts-contracts.mts";
import type { AttendanceReadPort, AttendanceRequestV1, AttendanceFilterContextV1, AttendanceListV1 } from "./attendance-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { AttendanceError, attendanceSource } from "./attendance-errors.mts";
import { attendanceAdmission, validateAttendanceCatalog, validateAttendanceRequest } from "./attendance-validation.mts";
import { attendanceRow, compareAttendance, copyAttendance } from "./attendance-projection.mts";
import { clockMinute } from "./read-current-shifts.mts";
import { unitCode } from "./current-shifts-validation.mts";

export function attendanceDefaults(clock: Clock, zone: string) {
  // Sample once. The existing zone-aware rounding advances the instant through DST.
  const instant = clock.now();
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) attendanceSource();
  try { return clockMinute({ now: () => instant }, zone, true); }
  catch (e) {
    const parts = new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", era: "short",
    }).formatToParts(instant);
    const v = (key: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === key)?.value;
    if (v("era") === "AD" && v("year") === "9999" && v("month") === "12" && v("day") === "31" &&
        v("hour") === "23" && Number(v("minute")) > 10)
      return { attendanceDate: "9999-12-31", currentTime: "23:00" };
    throw e;
  }
}
export class ReadAttendance {
  private readonly reader: AttendanceReadPort;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly source: CurrentShiftDataSourceV1;
  constructor(reader: AttendanceReadPort, clock: Clock, zone: string, source: CurrentShiftDataSourceV1) {
    if (reader.dataSource !== source) throw new Error("Attendance source mismatch");
    this.reader = reader; this.clock = clock; this.zone = zone; this.source = source;
  }
  private grants(p: PrincipalV1, signal?: AbortSignal) {
    validatePrincipal(p); accessPolicy.requireAttendanceRead(p); signal?.throwIfAborted();
    const grants = accessPolicy.authorizedAttendanceTeamIds(p);
    if (grants.length > 100 || !grants.every(unitCode)) attendanceSource();
    return Object.freeze(grants);
  }
  async context(p: PrincipalV1, signal?: AbortSignal): Promise<AttendanceFilterContextV1> {
    const grants = this.grants(p, signal);
    const c = await this.reader.readContext(grants, signal);
    signal?.throwIfAborted();
    if (this.reader.dataSource !== this.source) attendanceSource();
    validateAttendanceCatalog(c, grants);
    const at = attendanceDefaults(this.clock, this.zone);
    return { defaults: { attendanceDate: at.attendanceDate, timeFrom: at.currentTime, timeTo: at.currentTime,
      mokedCode: c.mokedOptions.length === 1 ? c.mokedOptions[0].code : null,
      teamCodes: [], innerJobCodes: [], workLocations: [] },
      mokedOptions: c.mokedOptions.map(p => ({ code: p.code, label: p.label, unitType: p.unitType })),
      teamOptions: c.teamOptions.map(t => ({ code: t.code, label: t.label, unitType: t.unitType, parentMokedCode: t.parentMokedCode })),
      innerJobOptions: c.innerJobOptions.map(j => ({ code: j.code, label: j.label })),
      workLocationOptions: c.workLocationOptions.map(l => ({ code: l.code, label: l.label })),
      businessTimeZone: this.zone, dataSource: this.source };
  }
  async list(p: PrincipalV1, input: AttendanceRequestV1, signal?: AbortSignal): Promise<AttendanceListV1> {
    validatePrincipal(p);
    const r = validateAttendanceRequest(input), grants = this.grants(p, signal);
    // All hierarchy/catalog/filter checks happen INSIDE the reader's single snapshot.
    const limit = r.limit ?? 25, offset = r.offset ?? 0, parent = r.mokedCode ?? null;
    const selected = r.teamCodes ?? [...grants];
    const rows = await attendanceAdmission.run({ grants, explicitTeams: r.teamCodes !== undefined }, () =>
      this.reader.read({ authorizedTeamUnitIds: selected, attendanceDate: r.attendanceDate,
        timeFrom: r.timeFrom, timeTo: r.timeTo, mokedCode: parent,
        innerJobCodes: r.innerJobCodes ?? [], workLocations: r.workLocations ?? [],
        limit, offset, sort: "effective-start-asc" }, signal));
    signal?.throwIfAborted();
    if (this.reader.dataSource !== this.source) attendanceSource();
    if (!Array.isArray(rows) || rows.length > limit + 1 || !rows.every(attendanceRow)) attendanceSource();
    const seen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      if (seen.has(row.shiftDayId!)) throw new AttendanceError("AMBIGUOUS_ATTENDANCE");
      seen.add(row.shiftDayId!);
      if (!grants.includes(row.employee.unit.code) || !selected.includes(row.employee.unit.code) ||
          (parent !== null && row.employee.unit.moked.code !== parent) ||
          (r.innerJobCodes && !r.innerJobCodes.includes(row.planned.innerJob?.code ?? "")) ||
          (i > 0 && compareAttendance(rows[i-1], row) >= 0)) attendanceSource();
    }
    const items = rows.slice(0, limit).map(copyAttendance), hasMore = rows.length > limit, next = offset + items.length;
    return { items, applied: { attendanceDate: r.attendanceDate, timeFrom: r.timeFrom, timeTo: r.timeTo,
      mokedCode: parent, teamCodes: r.teamCodes ?? [], innerJobCodes: r.innerJobCodes ?? [],
      workLocations: r.workLocations ?? [], sort: "effective-start-asc" },
      page: { limit, offset, hasMore, nextOffset: hasMore && next <= 10000 ? next : null },
      businessTimeZone: this.zone, dataSource: this.source };
  }
}
