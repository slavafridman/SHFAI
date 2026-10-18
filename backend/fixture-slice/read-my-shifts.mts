import type { PrincipalV1 } from "./contracts.mts";
import type { Clock, CurrentShiftDataSourceV1 } from "./current-shifts-contracts.mts";
import type { MyShiftsAccessPolicy, MyShiftsReadPort, MyShiftsContextRequestV1,
  MyShiftsRequestV1, MyShiftsActorV1, MyShiftsContextV1, MyShiftsListV1, MyShiftRowV1 } from "./my-shifts-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { clockMinute } from "./read-current-shifts.mts";
import { addCivilDates, cleanEmployee, scheduleEmployee, scheduleRow, scheduleSourceFailure,
  validateMyShiftsRequest } from "./my-shifts-validation.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";

// Optional operation unit-of-work is internal infrastructure, not a public DTO.
export interface MyShiftsReader extends MyShiftsReadPort {
  withRead?<T>(work: (port: MyShiftsReadPort) => Promise<T>): Promise<T>;
}
export function compareScheduleRows(a: MyShiftRowV1, b: MyShiftRowV1): number {
  return a.startLocal < b.startLocal ? -1 : a.startLocal > b.startLocal ? 1
    : BigInt(a.shiftDayId) < BigInt(b.shiftDayId) ? -1 : BigInt(a.shiftDayId) > BigInt(b.shiftDayId) ? 1
    : BigInt(a.employee.employeeId) < BigInt(b.employee.employeeId) ? -1
    : BigInt(a.employee.employeeId) > BigInt(b.employee.employeeId) ? 1 : 0;
}
export class ReadMyShifts {
  private readonly reader: MyShiftsReader;
  private readonly policy: MyShiftsAccessPolicy;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly dataSource: CurrentShiftDataSourceV1;
  constructor(
    reader: MyShiftsReader, policy: MyShiftsAccessPolicy,
    clock: Clock, zone: string, dataSource: CurrentShiftDataSourceV1,
  ) { this.reader = reader; this.policy = policy; this.clock = clock; this.zone = zone; this.dataSource = dataSource; }
  private prepare(p: PrincipalV1, r: MyShiftsContextRequestV1, signal?: AbortSignal) {
    signal?.throwIfAborted(); validatePrincipal(p); this.policy.requireMyShiftsRead(p);
    if (r.mode === "selected" && !this.policy.canSelectEmployee(p)) throw new MyShiftsError("FORBIDDEN");
    const grants = this.policy.authorizedMyShiftsUnitIds(p);
    if (grants.length > 100 || new Set(grants).size !== grants.length || !grants.every(unitCode))
      scheduleSourceFailure();
    return { id: r.mode === "selected" ? r.employeeId : p.provider === "real" ? p.employeeId : null, grants };
  }
  private operation<T>(work: (port: MyShiftsReadPort) => Promise<T>) {
    return this.reader.withRead ? this.reader.withRead(work) : work(this.reader);
  }
  private async actor(port: MyShiftsReadPort, mode: MyShiftsContextRequestV1["mode"],
    id: string, grants: string[], signal?: AbortSignal): Promise<MyShiftsActorV1> {
    if (!grants.length) throw new MyShiftsError("FORBIDDEN");
    const employee = await port.readEmployeeContext(id, grants);
    signal?.throwIfAborted();
    if (employee === null) throw new MyShiftsError("FORBIDDEN");
    if (!scheduleEmployee(employee) || employee.employeeId !== id || !grants.includes(employee.unit.code))
      scheduleSourceFailure();
    return { mode, employee: cleanEmployee(employee) };
  }
  async context(p: PrincipalV1, input: MyShiftsContextRequestV1, signal?: AbortSignal): Promise<MyShiftsContextV1> {
    validatePrincipal(p);
    const r = validateMyShiftsRequest(input, false), { id, grants } = this.prepare(p, r, signal);
    const today = clockMinute(this.clock, this.zone, false).attendanceDate;
    const actor = id === null ? { mode: r.mode, employee: null }
      : await this.operation(port => this.actor(port, r.mode, id, grants, signal));
    signal?.throwIfAborted();
    return { actor, selectionRequired: actor.employee === null, canSelectEmployee: this.policy.canSelectEmployee(p),
      defaults: { dateFrom: today, dateTo: addCivilDates(today, 13) },
      businessTimeZone: this.zone, dataSource: this.dataSource };
  }
  async list(p: PrincipalV1, input: MyShiftsRequestV1, signal?: AbortSignal): Promise<MyShiftsListV1> {
    validatePrincipal(p);
    const r = validateMyShiftsRequest(input, true), { id, grants } = this.prepare(p, r, signal);
    if (id === null) throw new MyShiftsError("EMPLOYEE_CONTEXT_REQUIRED");
    const limit = r.limit ?? 25, offset = r.offset ?? 0;
    return this.operation(async port => {
      const actor = await this.actor(port, r.mode, id, grants, signal);
      const rows = await port.readRows({ employeeId: id, authorizedTeamUnitIds: grants,
        dateFrom: r.dateFrom, dateTo: r.dateTo, limit, offset, sort: "effective-start-asc" });
      signal?.throwIfAborted();
      if (!Array.isArray(rows) || rows.length > limit + 1 || !rows.every(scheduleRow)) scheduleSourceFailure();
      const seen = new Set<string>();
      for (const [i, row] of rows.entries()) {
        if (seen.has(row.shiftDayId)) throw new MyShiftsError("AMBIGUOUS_MY_SHIFTS");
        seen.add(row.shiftDayId);
        if (JSON.stringify(cleanEmployee(row.employee)) !== JSON.stringify(actor.employee) ||
            row.startLocal < r.dateFrom + "T00:00:00" || row.startLocal > r.dateTo + "T23:59:59" ||
            (i > 0 && compareScheduleRows(rows[i - 1], row) >= 0)) scheduleSourceFailure();
      }
      const items = rows.slice(0, limit).map(row => ({ shiftDayId: row.shiftDayId,
        employee: cleanEmployee(row.employee), startLocal: row.startLocal, endLocal: row.endLocal,
        activities: row.activities.map(a => ({ code: a.code, label: a.label })) }));
      const hasMore = rows.length > limit, next = offset + items.length;
      return { actor, items, applied: { mode: r.mode, employeeId: id, dateFrom: r.dateFrom, dateTo: r.dateTo,
        sort: "effective-start-asc" }, page: { limit, offset, hasMore,
        nextOffset: hasMore && next <= 10000 ? next : null }, businessTimeZone: this.zone, dataSource: this.dataSource };
    });
  }
}
