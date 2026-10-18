import type { BindParameters } from "oracledb";
import type { MyShiftsReadPort, MyShiftsReadSelection, MyShiftRowV1 } from "./my-shifts-contracts.mts";
import type { CurrentShiftRowV1 } from "./current-shifts-contracts.mts";
import type { MyShiftsReader } from "./read-my-shifts.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { alias, civil, labelsFor, numberText, requireGregorian, scopeBinds } from "./oracle-readers.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { activityTokens, employeePrefix } from "./current-shifts-projection.mts";
import { scheduleEmployee, scheduleRow, scheduleSourceFailure, validateMyShiftsRequest } from "./my-shifts-validation.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";

type Query = (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]>;
// Static allowlisted plain tables only. Separate membership from display NVL.
export function scheduleBranches(columns: (changed: boolean) => string, placeholders: readonly string[]): string {
  const branch = (changed: boolean) => `SELECT ${columns(changed)}
    FROM ${changed ? `SHIFTER.shf_day_changes c
      LEFT JOIN SHIFTER.shf_employee_day d ON d.shf_employee_day_id=c.shf_employee_day_id`
    : `SHIFTER.shf_employee_day d
      LEFT JOIN SHIFTER.shf_day_changes c ON c.shf_employee_day_id=d.shf_employee_day_id`}
    JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=${changed ? "c.new_employee_id" : "d.emp_id_number"}
    WHERE e.employee_id IS NOT NULL AND e.emp_id_number=:actorReference
    AND ${changed ? "c.new_employee_id" : "d.emp_id_number"}=:actorPrefix
    AND e.org_unit_id IN (${placeholders.join(",")})
    AND ${changed ? "c.new_day_type" : "d.wm_day_type"}=:dayType
    AND ${changed ? "c.new_shift_start" : "d.wm_shift_start_datetime"} >= TO_DATE(:fromLocal,'YYYY-MM-DD"T"HH24:MI:SS')
    AND ${changed ? "c.new_shift_start" : "d.wm_shift_start_datetime"} <= TO_DATE(:toLocal,'YYYY-MM-DD"T"HH24:MI:SS')
    AND ${changed ? "c.cancel_reason_code IS NULL" : `NOT EXISTS
      (SELECT 1 FROM SHIFTER.shf_day_changes any_change WHERE any_change.shf_employee_day_id=d.shf_employee_day_id)`}`;
  return branch(false) + "\nUNION ALL\n" + branch(true);
}
function scopedPort(query: Query): MyShiftsReadPort {
  let resolved: { employee: CurrentShiftRowV1["employee"]; reference: string; grants: readonly string[] } | undefined;
  return {
    async readEmployeeContext(employeeId, grants) {
      if (resolved) throw new MyShiftsError("INTERNAL_ERROR");
      if (!decimalId(employeeId)) throw new MyShiftsError("INVALID_REQUEST");
      const { binds, placeholders } = scopeBinds(grants);
      if (!grants.length) return null;
      await requireGregorian(query);
      // Requested actor only, <=2 including hierarchy multiplicity. No active predicate.
      const rows = await query(`SELECT * FROM (SELECT
        ${alias(numberText("e.employee_id"), "employeeId")}, e.first_name AS "firstName",
        e.last_name AS "lastName", e.emp_id_number AS "actorReference",
        e.org_unit_id AS "teamCode", t.org_unit_name AS "teamLabel",
        t.unit_type_id AS "teamType", p.org_unit_id AS "parentCode",
        p.org_unit_name AS "parentLabel", p.unit_type_id AS "parentType"
        FROM SHIFTER.shf_employees e
        LEFT JOIN SHIFTER.shf_org_unit t ON t.org_unit_id=e.org_unit_id
        LEFT JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit
        WHERE e.employee_id=TO_NUMBER(:employeeId) AND e.org_unit_id IN (${placeholders.join(",")}))
        WHERE ROWNUM <= 2`, { ...binds, employeeId }, 2);
      if (rows.length > 1) scheduleSourceFailure();
      const r = rows[0];
      if (!r) return null;
      if (!record(r)) scheduleSourceFailure();
      const employee = { employeeId: r.employeeId, firstName: r.firstName, lastName: r.lastName,
        unit: { code: r.teamCode, label: r.teamLabel,
          moked: { code: r.parentCode, label: r.parentLabel, unitType: r.parentType } } };
      if (r.teamType !== "J01" || !scheduleEmployee(employee)) return null;
      if (employee.employeeId !== employeeId || !grants.includes(employee.unit.code) ||
          !text(r.actorReference, 128, 8)) scheduleSourceFailure();
      resolved = { employee, reference: r.actorReference, grants: [...grants] };
      return employee;
    },
    async readRows(s: MyShiftsReadSelection): Promise<MyShiftRowV1[]> {
      validateMyShiftsRequest({ mode: "selected", employeeId: s.employeeId, dateFrom: s.dateFrom,
        dateTo: s.dateTo, limit: s.limit, offset: s.offset, sort: s.sort }, true);
      const { binds, placeholders } = scopeBinds(s.authorizedTeamUnitIds);
      if (!s.authorizedTeamUnitIds.length) return [];
      if (!resolved || resolved.employee.employeeId !== s.employeeId ||
          JSON.stringify(resolved.grants) !== JSON.stringify(s.authorizedTeamUnitIds))
        throw new MyShiftsError("INTERNAL_ERROR");
      const common = { ...binds, actorReference: resolved.reference,
        actorPrefix: employeePrefix(resolved.reference), dayType: 4,
        fromLocal: s.dateFrom + "T00:00:00", toLocal: s.dateTo + "T23:59:59" };
      const day = (changed: boolean) => changed ? "c.shf_employee_day_id" : "d.shf_employee_day_id";
      const probe = await query(`SELECT * FROM (
        SELECT "orderDay", MAX("orphan") AS "orphan", COUNT(*) AS "multiplicity"
        FROM (${scheduleBranches(ch => `${day(ch)} AS "orderDay",
          CASE WHEN d.shf_employee_day_id IS NULL THEN 1 ELSE 0 END AS "orphan"`, placeholders)})
        GROUP BY "orderDay" HAVING COUNT(*) > 1 OR MAX("orphan")=1
        ORDER BY "orphan" DESC) WHERE ROWNUM <= 1`, common, 1);
      if (probe.length) {
        if (!record(probe[0]) || probe[0].orphan !== 0) scheduleSourceFailure();
        throw new MyShiftsError("AMBIGUOUS_MY_SHIFTS");
      }
      const columns = (ch: boolean) => [
        alias(numberText(day(ch)), "shiftDayId"),
        alias(civil(ch ? "NVL(c.new_shift_start,d.wm_shift_start_datetime)" : "d.wm_shift_start_datetime"), "startLocal"),
        alias(civil(ch ? "NVL(c.new_shift_end,d.wm_shift_end_datetime)" : "d.wm_shift_end_datetime"), "endLocal"),
        alias(ch ? "NVL(c.new_activity,d.wm_sch_activity_id_data)" : "d.wm_sch_activity_id_data", "activityData"),
        `${ch ? "NVL(c.new_shift_start,d.wm_shift_start_datetime)" : "d.wm_shift_start_datetime"} AS "orderStart"`,
        `${day(ch)} AS "orderDay"`,
        `e.employee_id AS "orderEmployee"`,
      ].join(",");
      const values = await query(`SELECT "shiftDayId","startLocal","endLocal","activityData"
        FROM (SELECT q.*, ROW_NUMBER() OVER (ORDER BY "orderStart","orderDay","orderEmployee") AS "rowNumber"
        FROM (${scheduleBranches(columns, placeholders)}) q)
        WHERE "rowNumber" > :lowerBound AND "rowNumber" <= :upperBound ORDER BY "rowNumber"`,
      { ...common, lowerBound: s.offset, upperBound: s.offset + s.limit + 1 }, s.limit + 1);
      const rows = values.map(v => {
        if (!record(v) || !decimalId(v.shiftDayId, 10) || !localDateTime(v.startLocal) ||
            !(v.endLocal === null || localDateTime(v.endLocal)) ||
            !(v.activityData === null || text(v.activityData, 12900))) scheduleSourceFailure();
        return { shiftDayId: v.shiftDayId, startLocal: v.startLocal, endLocal: v.endLocal,
          tokens: activityTokens(v.activityData) };
      });
      const labels = await labelsFor(query, "activities", rows.flatMap(r => r.tokens));
      return rows.map(r => {
        const row: MyShiftRowV1 = { shiftDayId: r.shiftDayId, employee: resolved!.employee,
          startLocal: r.startLocal, endLocal: r.endLocal,
          activities: r.tokens.map(code => ({ code, label: labels.find(a => a.code === code)?.label ?? null })) };
        if (!scheduleRow(row)) scheduleSourceFailure();
        return row;
      });
    },
  };
}
export class OracleMyShiftsReader implements MyShiftsReader {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  withRead<T>(work: (port: MyShiftsReadPort) => Promise<T>) {
    return this.session.read(query => work(scopedPort(query)));
  }
  readEmployeeContext(id: string, grants: readonly string[]) {
    return this.withRead(port => port.readEmployeeContext(id, grants));
  }
  readRows(s: MyShiftsReadSelection) {
    return this.withRead(async port => {
      if (!await port.readEmployeeContext(s.employeeId, s.authorizedTeamUnitIds))
        throw new MyShiftsError("FORBIDDEN");
      return port.readRows(s);
    });
  }
}
