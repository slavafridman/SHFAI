import type { BindParameters } from "oracledb";
import type { AttendanceReadPort, AttendanceReadSelection } from "./attendance-contracts.mts";
import type { AttendanceCatalog } from "./attendance-validation.mts";
import type { AttendanceFacts } from "./attendance-projection.mts";
import { attendanceGrants, attendanceLocations, eligibleAttendanceTeams, validateAttendanceCatalog, validateAttendanceSelection } from "./attendance-validation.mts";
import { AttendanceError, attendanceSource } from "./attendance-errors.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { alias, civil, labelsFor, numberText, requireGregorian, scopeBinds, teamsAndParents } from "./oracle-readers.mts";
import { compareCode } from "./current-shifts-fixture.mts";
import { record } from "./contract-validation.mts";
import { activityTokens } from "./current-shifts-projection.mts";
import { projectAttendance } from "./attendance-projection.mts";

type Query = (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]>;
export function attendanceBranches(columns: string, predicate: (changed: boolean) => string) {
  const branch = (changed: boolean) => {
    const key = changed ? "c.new_employee_id" : "d.emp_id_number";
    const start = changed ? "c.new_shift_start" : "d.wm_shift_start_datetime";
    const split = changed ? "c.new_split_end" : "d.split_end";
    const from = `TO_DATE(:fromLocal,'YYYY-MM-DD"T"HH24:MI:SS')`;
    const to = `TO_DATE(:toLocal,'YYYY-MM-DD"T"HH24:MI:SS')`;
    return `SELECT ${columns.replaceAll("$KEY", key)} FROM SHIFTER.shf_employee_day d
      ${changed ? "JOIN" : "LEFT JOIN"} SHIFTER.shf_day_changes c ON c.shf_employee_day_id=d.shf_employee_day_id
      JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=${key}
      LEFT JOIN SHIFTER.shf_attendance a ON a.shf_employee_day_id=d.shf_employee_day_id
      WHERE e.employee_id IS NOT NULL
      AND ${changed ? "c.new_day_type" : "d.wm_day_type"}=:dayType
      AND (${start} BETWEEN ${from} AND ${to} OR ${split} BETWEEN ${from} AND ${to})
      AND ${changed ? "c.cancel_reason_code IS NULL" : `NOT EXISTS
        (SELECT 1 FROM SHIFTER.shf_day_changes ac WHERE ac.shf_employee_day_id=d.shf_employee_day_id)`}
      ${predicate(changed)}`;
  };
  return branch(false) + "\nUNION ALL\n" + branch(true);
}
export const attendanceFields = [
  alias(numberText("d.shf_employee_day_id"), "shiftDayId"),
  alias(numberText("e.employee_id"), "employeeId"), alias("e.first_name", "firstName"),
  alias("e.last_name", "lastName"), alias("e.org_unit_id", "teamCode"),
  alias(numberText("e.inner_job_id"), "innerJobCode"),
  alias(civil("d.wm_shift_start_datetime"), "baselineStartLocal"),
  alias(civil("c.new_shift_start"), "changedStartLocal"),
  alias(civil("d.wm_shift_end_datetime"), "baselineEndLocal"),
  alias(civil("c.new_shift_end"), "changedEndLocal"),
  alias("d.work_from_home", "baselineHome"), alias("c.new_work_from_home", "changedHome"),
  alias("d.wm_sch_activity_id_data", "baselineActivityData"), alias("c.new_activity", "changedActivityData"),
  alias(numberText("d.wm_exception_type_id"), "exceptionCode"),
  alias(civil("a.stage_arrival_time"), "stageArrivalLocal"),
  alias(civil("a.station_arrival_time"), "stationArrivalLocal"),
  alias(civil("a.station_exit_time"), "stationExitLocal"),
  alias(numberText("a.miss_reason_id"), "missingReasonCode"), alias(numberText("a.tadreech"), "briefingCode"),
].join(",\n");
export async function attendanceCatalog(query: Query, grants: readonly string[]): Promise<AttendanceCatalog> {
  const { binds, placeholders } = scopeBinds(grants);
  const hierarchy = await teamsAndParents(query, grants);
  const roles = grants.length ? await query(`SELECT "code","label" FROM (
    SELECT ${numberText("inner_job_id")} AS "code", inner_job_name AS "label"
    FROM SHIFTER.shf_inner_jobs WHERE active=:active AND org_unit_id IN (${placeholders.join(",")}))
    WHERE ROWNUM <= :catalogBound`, { ...binds, active: 1, catalogBound: 1001 }, 1001) : [];
  const c = { mokedOptions: hierarchy.options,
    teamOptions: hierarchy.teams.map(t => ({ code: t.code, label: t.label,
      unitType: "J01" as const, parentMokedCode: t.parent.code })).sort((a,b) => compareCode(a.code,b.code)),
    innerJobOptions: roles.map(r => {
      if (!record(r) || typeof r.code !== "string" || typeof r.label !== "string") attendanceSource();
      return { code: r.code, label: r.label };
    }).sort((a,b) => compareCode(a.code,b.code)), workLocationOptions: attendanceLocations };
  validateAttendanceCatalog(c, grants);
  return c;
}
export function attendanceSqlSelection(s: AttendanceReadSelection, teams: readonly string[]) {
  const { binds, placeholders } = scopeBinds(teams);
  const common: Record<string, string | number | null> = { ...binds, dayType: 4,
    fromLocal: s.attendanceDate + "T" + s.timeFrom + ":00", toLocal: s.attendanceDate + "T" + s.timeTo + ":00" };
  const roles = s.innerJobCodes.map((v,i) => { common[`role${i}`] = v; return `TO_NUMBER(:role${i})`; });
  const homes = s.workLocations.map((v,i) => { common[`home${i}`] = v === "home" ? "Y" : "N"; return `:home${i}`; });
  const predicate = (changed: boolean) => `AND e.org_unit_id IN (${placeholders.join(",")})
    ${roles.length ? `AND e.inner_job_id IN (${roles.join(",")})` : ""}
    ${homes.length ? `AND ${changed ? "c.new_work_from_home" : "d.work_from_home"} IN (${homes.join(",")})` : ""}`;
  return { common, predicate };
}
const multiplicity = `CASE WHEN
  (SELECT COUNT(*) FROM SHIFTER.shf_employee_day pd WHERE pd.shf_employee_day_id=d.shf_employee_day_id)>1 OR
  (SELECT COUNT(*) FROM SHIFTER.shf_day_changes pc WHERE pc.shf_employee_day_id=d.shf_employee_day_id)>1 OR
  (SELECT COUNT(*) FROM SHIFTER.shf_employees pe WHERE SUBSTR(pe.emp_id_number,1,8)=$KEY)>1 OR
  (SELECT COUNT(*) FROM SHIFTER.shf_attendance pa WHERE pa.shf_employee_day_id=d.shf_employee_day_id)>1
  THEN 1 ELSE 0 END AS "ambiguous"`;
async function selectedLabels(query: Query, kind: "activities" | "innerJobs" | "exceptions", codes: readonly string[]) {
  const labels = [];
  // <=2 rows per selected identity, no unrelated catalog scan/duplicate suppression.
  for (const code of new Set(codes)) labels.push(...await labelsFor(query, kind, [code]));
  return labels;
}
export class OracleAttendanceReader implements AttendanceReadPort {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async readContext(grants: readonly string[], signal?: AbortSignal) {
    return this.session.read(async q => { await requireGregorian(q); return attendanceCatalog(q, grants); }, signal);
  }
  async read(s: AttendanceReadSelection, signal?: AbortSignal) {
    validateAttendanceSelection(s);
    const original = [...attendanceGrants(s)];
    return this.session.read(async query => {
      await requireGregorian(query);
      const c = await attendanceCatalog(query, original);
      const teams = eligibleAttendanceTeams(c, s, original);
      if (!teams.length) return [];
      const { common, predicate } = attendanceSqlSelection(s, teams);
      const duplicate = await query(`SELECT "ambiguous" FROM (${attendanceBranches(multiplicity, predicate)})
        WHERE "ambiguous"=1 AND ROWNUM <= 1`, common, 1);
      if (duplicate.length) throw new AttendanceError("AMBIGUOUS_ATTENDANCE");
      const names = [...attendanceFields.matchAll(/AS "([A-Za-z]+)"/g)].map(m => `"${m[1]}"`).join(",");
      const order = `NVL(c.new_shift_start,d.wm_shift_start_datetime) AS "orderStart",
        d.shf_employee_day_id AS "orderDay",e.employee_id AS "orderEmployee"`;
      const rows = await query(`SELECT ${names} FROM (SELECT ${names},
        ROW_NUMBER() OVER (ORDER BY "orderStart" ASC NULLS LAST,"orderDay","orderEmployee") AS "rowNumber"
        FROM (${attendanceBranches(attendanceFields + "," + order, predicate)}))
        WHERE "rowNumber">:lowerBound AND "rowNumber"<=:upperBound ORDER BY "rowNumber"`,
      { ...common, lowerBound: s.offset, upperBound: s.offset + s.limit + 1 }, s.limit + 1);
      const facts = rows.map(r => {
        if (!record(r)) attendanceSource();
        // Driver boundary: every selected alias is required; NUMBER fields are text.
        for (const key of [...attendanceFields.matchAll(/AS "([A-Za-z]+)"/g)].map(m => m[1])) {
          if (!(r[key] === null || typeof r[key] === "string")) attendanceSource();
        }
        return r as unknown as AttendanceFacts;
      });
      const labels = {
        activities: await selectedLabels(query, "activities", facts.flatMap(f =>
          activityTokens(f.changedActivityData ?? f.baselineActivityData))),
        innerJobs: await selectedLabels(query, "innerJobs", facts.flatMap(f =>
          f.innerJobCode === null || f.innerJobCode === "0" ? [] : [f.innerJobCode])),
        exceptions: await selectedLabels(query, "exceptions", facts.flatMap(f =>
          !activityTokens(f.changedActivityData ?? f.baselineActivityData).length &&
          f.exceptionCode !== null && /^[1-9][0-9]{0,37}$/.test(f.exceptionCode) ? [f.exceptionCode] : [])),
      };
      return facts.map(f => {
        const t = c.teamOptions.find(t => t.code === f.teamCode);
        const p = c.mokedOptions.find(p => p.code === t?.parentMokedCode);
        if (!t || !p) attendanceSource();
        return projectAttendance(f, { code: t.code, label: t.label, moked: p }, labels);
      });
    }, signal);
  }
}
