import type { PrincipalV1 } from "./contracts.mts";
import type { Clock, CurrentShiftReadPort, CurrentShiftRequestV1,
  CurrentShiftFilterContextV1, CurrentShiftListV1, MokedOptionV1,
  CurrentShiftDataSourceV1 } from "./current-shifts-contracts.mts";
import { validatePrincipal, localDateTime } from "./contract-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { currentRow, mokedOption, sourceFailure, unitCode, validateCurrentRequest } from "./current-shifts-validation.mts";
import { compareCode, compareRows } from "./current-shifts-fixture.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export const systemClock: Clock = { now: () => new Date() };
export function clockMinute(clock: Clock, zone: string, roundDefault: boolean) {
  const instant = clock.now();
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) sourceFailure();
  const formatter = new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", era: "short",
  });
  let parts = formatter.formatToParts(instant);
  const get = (name: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === name)?.value ?? "";
  // Calendar.add(HOUR_OF_DAY, 1) advances the sampled instant by an hour;
  // formatting afterwards preserves zone transitions rather than inventing a gap hour.
  if (roundDefault && Number(get("minute")) > 10)
    parts = formatter.formatToParts(new Date(instant.getTime() + 60 * 60 * 1000));
  const date = get("year").padStart(4, "0") + "-" + get("month") + "-" + get("day");
  const time = get("hour") + ":" + (roundDefault ? "00" : get("minute"));
  if (get("era") !== "AD" || !localDateTime(date + "T" + time + ":00")) sourceFailure();
  return { attendanceDate: date, currentTime: time };
}
export class ReadCurrentShifts {
  private readonly reader: CurrentShiftReadPort;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly dataSource: CurrentShiftDataSourceV1;
  constructor(reader: CurrentShiftReadPort, clock: Clock, zone: string,
    dataSource: CurrentShiftDataSourceV1 = "isolated-fixture") {
    this.reader = reader; this.clock = clock; this.zone = zone; this.dataSource = dataSource;
  }
  private async scope(principal: PrincipalV1, signal?: AbortSignal) {
    signal?.throwIfAborted();
    validatePrincipal(principal);
    accessPolicy.requireCurrentShiftRead(principal);
    const teams = accessPolicy.authorizedCurrentShiftUnitIds(principal);
    if (teams.length > 100 || !teams.every(unitCode)) sourceFailure();
    const raw: unknown = await this.reader.readMokedOptions(teams);
    signal?.throwIfAborted();
    if (!Array.isArray(raw) || raw.length > 100 || !raw.every(mokedOption) ||
        new Set(raw.map(p => p.code)).size !== raw.length ||
        raw.some((p, i) => i > 0 && compareCode(raw[i - 1].code, p.code) >= 0)) sourceFailure();
    if (teams.length === 0 && raw.length !== 0) sourceFailure();
    const options: MokedOptionV1[] = raw.map(p => ({ code: p.code, label: p.label, unitType: p.unitType }));
    return { teams, options };
  }
  async context(principal: PrincipalV1, signal?: AbortSignal): Promise<CurrentShiftFilterContextV1> {
    const { options } = await this.scope(principal, signal);
    return { defaults: { mode: "at", ...clockMinute(this.clock, this.zone, true),
      mokedCode: options.length === 1 ? options[0].code : null },
      mokedOptions: options, businessTimeZone: this.zone, dataSource: this.dataSource };
  }
  async list(principal: PrincipalV1, request: CurrentShiftRequestV1,
    signal?: AbortSignal): Promise<CurrentShiftListV1> {
    validatePrincipal(principal);
    validateCurrentRequest(request);
    const { teams, options } = await this.scope(principal, signal);
    const moked = request.mokedCode ?? null;
    if (moked !== null && !options.some(p => p.code === moked)) throw new CurrentShiftError("FORBIDDEN");
    const resolved = request.mode === "current" ? clockMinute(this.clock, this.zone, false)
      : { attendanceDate: request.attendanceDate, currentTime: request.currentTime };
    const limit = request.limit ?? 25, offset = request.offset ?? 0;
    const raw: unknown = await this.reader.readRows({
      ...resolved, authorizedTeamUnitIds: teams, mokedCode: moked,
      limit, offset, sort: "effective-start-asc",
    });
    signal?.throwIfAborted();
    if (!Array.isArray(raw) || raw.length > limit + 1 || !raw.every(currentRow)) sourceFailure();
    const seen = new Set<string>();
    const at = resolved.attendanceDate + "T" + resolved.currentTime + ":00";
    for (const [i, row] of raw.entries()) {
      if (seen.has(row.shiftDayId)) throw new CurrentShiftError("AMBIGUOUS_CURRENT_SHIFT");
      seen.add(row.shiftDayId);
      const parent = options.find(p => p.code === row.employee.unit.moked.code);
      if (!teams.includes(row.employee.unit.code) || !parent ||
          parent.label !== row.employee.unit.moked.label ||
          (moked !== null && parent.code !== moked) ||
          !(row.startLocal <= at && at < row.endLocal) ||
          (i > 0 && compareRows(raw[i - 1], row) >= 0)) sourceFailure();
    }
    // Explicit wire projection discards any extra source/provider fields.
    const items = raw.slice(0, limit).map(row => ({
      shiftDayId: row.shiftDayId,
      employee: { employeeId: row.employee.employeeId, firstName: row.employee.firstName,
        lastName: row.employee.lastName, unit: { code: row.employee.unit.code,
          label: row.employee.unit.label, moked: { code: row.employee.unit.moked.code,
            label: row.employee.unit.moked.label, unitType: row.employee.unit.moked.unitType } } },
      startLocal: row.startLocal, endLocal: row.endLocal, workingFromHome: row.workingFromHome,
      activities: row.activities.map(v => ({ code: v.code, label: v.label })),
      innerJob: row.innerJob === null ? null : { code: row.innerJob.code, label: row.innerJob.label },
      attendanceDisplay: row.attendanceDisplay.kind === "missing-reason"
        ? { kind: "missing-reason" as const, reason: { code: row.attendanceDisplay.reason.code,
          label: row.attendanceDisplay.reason.label } }
        : row.attendanceDisplay.kind === "station-arrival"
          ? { kind: "station-arrival" as const, atLocal: row.attendanceDisplay.atLocal }
          : { kind: "not-recorded" as const },
    }));
    const hasMore = raw.length > limit, next = offset + items.length;
    return { items, applied: { ...resolved, requestedMode: request.mode, mokedCode: moked,
      sort: "effective-start-asc" }, page: { limit, offset, hasMore,
      nextOffset: hasMore && next <= 10000 ? next : null },
      businessTimeZone: this.zone, dataSource: this.dataSource };
  }
}
