import type { ShiftSearchReadPort, ShiftSearchReadSelection } from "./shift-search-contracts.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { alias, currentFields, joinedCurrent, labelsFor, numberText, requireGregorian,
  scopeBinds, teamsAndParents } from "./oracle-readers.mts";
import { compareCode } from "./current-shifts-fixture.mts";
import { activityTokens } from "./current-shifts-projection.mts";
import { record } from "./contract-validation.mts";
import { sourceFailure } from "./current-shifts-validation.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";
import { projectSearchShift, validateMarkers } from "./shift-search-projection.mts";
import type { SearchMarkers } from "./shift-search-projection.mts";
import { validateSearchCatalog, validateSearchRequest } from "./shift-search-validation.mts";

const locations = [{ code: "home" as const, label: "בית" }, { code: "site" as const, label: "אתר" }];
// Only static source-observed identifiers; every selection value is bound.
export function searchBranches(columns: string, predicate: (changed: boolean) => string): string {
  const branch = (changed: boolean) => {
    const key = changed ? "c.new_employee_id" : "d.emp_id_number";
    const start = changed ? "c.new_shift_start" : "d.wm_shift_start_datetime";
    return `SELECT ${columns} FROM SHIFTER.shf_employee_day d
      ${changed ? "JOIN" : "LEFT JOIN"} SHIFTER.shf_day_changes c ON d.shf_employee_day_id=c.shf_employee_day_id
      JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=${key}
      LEFT JOIN SHIFTER.shf_employees e_old ON SUBSTR(e_old.emp_id_number,1,8)=${key}
      LEFT JOIN SHIFTER.shf_attendance a ON d.shf_employee_day_id=a.shf_employee_day_id
      LEFT JOIN SHIFTER.shf_cti_cancel_login_shifts l ON d.shf_employee_day_id=l.shf_employee_day_id
      LEFT JOIN SHIFTER.shf_org_unit u ON u.org_unit_id=e.org_unit_id
      WHERE e.employee_id IS NOT NULL AND a.miss_reason_id IS NULL
      AND ${changed ? "c.new_day_type" : "d.wm_day_type"}=:dayType
      AND ${start} >= TO_DATE(:fromLocal,'YYYY-MM-DD"T"HH24:MI:SS')
      AND ${start} <= TO_DATE(:toLocal,'YYYY-MM-DD"T"HH24:MI:SS')
      AND ${changed ? "c.cancel_reason_code IS NULL" : `NOT EXISTS
        (SELECT 1 FROM SHIFTER.shf_day_changes any_change WHERE any_change.shf_employee_day_id=d.shf_employee_day_id)`}
      ${predicate(changed)}`;
  };
  return branch(false) + "\nUNION ALL\n" + branch(true);
}
const extraFields = [
  alias("d.emp_id_number", "employeeKey"), alias("c.new_employee_id", "changedEmployeeKey"),
  alias("e.emp_id_number", "employeeNumber"), alias(numberText("e.inner_job_id"), "innerJobCode"),
  alias(numberText("a.miss_reason_id"), "missingReason"), alias("d.work_from_home", "baselineHome"),
  alias("c.new_work_from_home", "changedHome"), alias("d.wm_day_type", "baselineDayType"),
  alias("c.new_day_type", "changedDayType"), alias("c.cancel_reason_code", "cancellationReason"),
  // Presence only crosses the driver boundary; never fetch remark/applier bodies.
  alias("CASE WHEN REGEXP_LIKE(d.remark,'[^[:space:]]') THEN 'Y' ELSE NULL END", "remark"),
  alias("CASE WHEN REGEXP_LIKE(l.applier_name,'[^[:space:]]') THEN 'Y' ELSE NULL END", "cancelLoginApplier"),
  alias("d.split_shift", "baselineSplit"), alias("c.new_split_shift", "changedSplit"),
  alias("d.source", "source"),
  alias("CASE WHEN d.pool_ext_num IS NOT NULL THEN 'Y' ELSE NULL END", "baselineExtension"),
  alias("CASE WHEN c.new_pool_ext_num IS NOT NULL THEN 'Y' ELSE NULL END", "changedExtension"),
  alias(numberText("d.wm_exception_type_id"), "exceptionCode"),
].join(",\n");
const fields = currentFields + "," + extraFields;

export class OracleSearchReader implements ShiftSearchReadPort {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async readCatalog(grants: readonly string[]) {
    const { binds, placeholders } = scopeBinds(grants);
    if (!grants.length) return { mokedOptions: [], teamOptions: [], innerJobOptions: [], workLocationOptions: locations };
    return this.session.read(async query => {
      await requireGregorian(query);
      const hierarchy = await teamsAndParents(query, grants);
      const roles = await query(`SELECT * FROM (SELECT ${numberText("inner_job_id")} AS "code",
        inner_job_name AS "label" FROM SHIFTER.shf_inner_jobs
        WHERE active=:active AND org_unit_id IN (${placeholders.join(",")}))
        WHERE ROWNUM <= :catalogBound`, { ...binds, active: 1, catalogBound: 1001 }, 1001);
      const catalog = { mokedOptions: hierarchy.options,
        teamOptions: hierarchy.teams.map(t => ({ code: t.code, label: t.label, unitType: "J01" as const,
          parentMokedCode: t.parent.code })).sort((a, b) => compareCode(a.code, b.code)),
        innerJobOptions: roles.map(r => {
          if (!record(r) || typeof r.code !== "string" || typeof r.label !== "string") sourceFailure();
          return { code: r.code, label: r.label };
        }).sort((a, b) => compareCode(a.code, b.code)), workLocationOptions: locations };
      validateSearchCatalog(catalog, grants);
      return catalog;
    });
  }
  async readRows(s: ShiftSearchReadSelection) {
    validateSearchRequest({ attendanceDate: s.attendanceDate, timeFrom: s.timeFrom, timeTo: s.timeTo,
      ...(s.mokedCode === null ? {} : { mokedCode: s.mokedCode }),
      ...(s.innerJobCodes.length ? { innerJobCodes: [...s.innerJobCodes] } : {}),
      ...(s.workLocations.length ? { workLocations: [...s.workLocations] } : {}),
      limit: s.limit, offset: s.offset, sort: s.sort });
    const { binds, placeholders } = scopeBinds(s.authorizedTeamUnitIds);
    if (!s.authorizedTeamUnitIds.length) return [];
    return this.session.read(async query => {
      await requireGregorian(query);
      const catalog = await teamsAndParents(query, s.authorizedTeamUnitIds);
      if (s.mokedCode !== null && !catalog.options.some(p => p.code === s.mokedCode)) throw new ShiftSearchError("FORBIDDEN");
      const common: Record<string, string | number | null> = { ...binds, dayType: 4,
        fromLocal: s.attendanceDate + "T" + s.timeFrom + ":00",
        toLocal: s.attendanceDate + "T" + s.timeTo + ":00", parent: s.mokedCode };
      const roles = s.innerJobCodes.map((code, i) => { common[`role${i}`] = code; return `TO_NUMBER(:role${i})`; });
      const homes = s.workLocations.map((location, i) => { common[`home${i}`] = location === "home" ? "Y" : "N"; return `:home${i}`; });
      const predicate = (changed: boolean) => `AND e.org_unit_id IN (${placeholders.join(",")})
        AND (:parent IS NULL OR u.parent_unit=:parent)
        ${roles.length ? `AND e.inner_job_id IN (${roles.join(",")})` : ""}
        ${homes.length ? `AND ${changed ? "c.new_work_from_home" : "d.work_from_home"} IN (${homes.join(",")})` : ""}`;
      const duplicate = await query(`SELECT 1 AS "ambiguous" FROM (
        SELECT "orderDay" FROM (${searchBranches('d.shf_employee_day_id AS "orderDay"', predicate)})
        GROUP BY "orderDay" HAVING COUNT(*) > 1) WHERE ROWNUM <= 1`, common, 1);
      if (duplicate.length) throw new ShiftSearchError("AMBIGUOUS_SHIFT_SEARCH");
      const projected = [...fields.matchAll(/AS "([A-Za-z]+)"/g)].map(m => `"${m[1]}"`).join(",");
      const order = `NVL(c.new_shift_start,d.wm_shift_start_datetime) AS "orderStart",
        d.shf_employee_day_id AS "orderDay", e.employee_id AS "orderEmployee"`;
      const rows = await query(`SELECT ${projected} FROM (SELECT q.*,
        ROW_NUMBER() OVER (ORDER BY "orderStart","orderDay","orderEmployee") AS "rowNumber"
        FROM (${searchBranches(fields + "," + order, predicate)}) q)
        WHERE "rowNumber" > :lowerBound AND "rowNumber" <= :upperBound ORDER BY "rowNumber"`,
      { ...common, lowerBound: s.offset, upperBound: s.offset + s.limit + 1 }, s.limit + 1);
      const joined = rows.map(value => {
        const j = joinedCurrent(value);
        if (!record(value)) sourceFailure();
        const markers: SearchMarkers = {
          remark: value.remark as string | null, cancelLoginApplier: value.cancelLoginApplier as string | null,
          baselineSplit: value.baselineSplit as string | null, changedSplit: value.changedSplit as string | null,
          source: value.source as string | null, baselineExtension: value.baselineExtension as string | null,
          changedExtension: value.changedExtension as string | null, exceptionCode: value.exceptionCode as string | null,
        };
        validateMarkers(markers);
        return { ...j, markers };
      });
      const labels = {
        activities: await labelsFor(query, "activities", joined.flatMap(j => activityTokens(j.day.changedActivityData ?? j.day.baselineActivityData))),
        innerJobs: await labelsFor(query, "innerJobs", joined.flatMap(j => j.employee.innerJobCode === null ||
          j.employee.innerJobCode === "00" ? [] : [j.employee.innerJobCode])),
        exceptions: await labelsFor(query, "exceptions", joined.flatMap(j => activityTokens(
          j.day.changedActivityData ?? j.day.baselineActivityData).length === 0 &&
          j.markers.exceptionCode !== null && j.markers.exceptionCode !== "0" ? [j.markers.exceptionCode] : [])),
      };
      return joined.map(j => {
        const team = catalog.teams.find(t => t.code === j.employee.teamCode);
        if (!team) sourceFailure();
        return projectSearchShift(j.day, j.employee, team, team.parent, j.markers, labels);
      });
    });
  }
}
