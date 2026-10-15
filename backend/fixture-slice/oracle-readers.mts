import type { BindParameters } from "oracledb";
import type { EmployeeShiftDayReader, RawShiftDay, ShiftDayReadResult } from "./contracts.mts";
import type { CatalogValueV1, CurrentShiftReadPort, CurrentShiftReadSelection, MokedOptionV1 } from "./current-shifts-contracts.mts";
import { decimalId, localDateTime, record, text, validateRaw } from "./contract-validation.mts";
import { catalogCode, catalogValue, mokedOption, plainLabel, sourceFailure, unitCode } from "./current-shifts-validation.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { compareCode } from "./current-shifts-fixture.mts";
import { activityTokens, employeePrefix, projectCurrentShift } from "./current-shifts-projection.mts";
import type { CurrentFixtureDay, CurrentFixtureEmployee, CurrentFixtureAttendance } from "./current-shifts-fixture.mts";
import { SliceError } from "./errors.mts";

type Query = (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]>;
const numberText = (column: string) => `TO_CHAR(${column}, 'TM9', 'NLS_NUMERIC_CHARACTERS=''.,''')`;
const civil = (column: string) =>
  `CASE WHEN ${column} IS NULL THEN NULL WHEN TO_CHAR(${column},'AD','NLS_DATE_LANGUAGE=ENGLISH') = 'AD'
    THEN TO_CHAR(${column},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH') ELSE 'invalid-era' END`;
const alias = (expression: string, name: string) => `${expression} AS "${name}"`;
const detailExpressions = [
  alias(numberText("d.shf_employee_day_id"), "shiftDayId"),
  alias(numberText("e.employee_id"), "employeeId"), alias("e.first_name", "firstName"),
  alias("e.last_name", "lastName"), alias("e.org_unit_id", "orgUnitId"),
  alias(civil("d.wm_shift_start_datetime"), "baselineStartLocal"),
  alias(civil("c.new_shift_start"), "changedStartLocal"),
  alias(civil("d.wm_shift_end_datetime"), "baselineEndLocal"),
  alias(civil("c.new_shift_end"), "changedEndLocal"),
  alias("d.wm_sch_activity_id_data", "baselineActivityData"), alias("c.new_activity", "changedActivityData"),
  alias(numberText("d.wm_site_id"), "baselineSiteId"), alias(numberText("c.new_site_id"), "changedSiteId"),
  alias(civil("a.stage_arrival_time"), "stageArrivalLocal"),
  alias(civil("a.station_arrival_time"), "stationArrivalLocal"),
  alias(civil("a.station_exit_time"), "stationExitLocal"),
];
const detailFields = detailExpressions.join(",\n");
const currentCoreNames = new Set(["shiftDayId", "employeeId", "firstName", "lastName", "orgUnitId",
  "baselineStartLocal", "changedStartLocal", "baselineEndLocal", "changedEndLocal",
  "baselineActivityData", "changedActivityData", "stationArrivalLocal"]);
const currentFields = detailExpressions.filter(expression =>
  currentCoreNames.has(/AS "([A-Za-z]+)"$/.exec(expression)?.[1] ?? "")).join(",\n");
// Table/column names are exclusively static, source-observed identifiers.
const baseJoin = `FROM SHIFTER.shf_employee_day d
 LEFT JOIN SHIFTER.shf_day_changes c ON d.shf_employee_day_id=c.shf_employee_day_id
 LEFT JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=NVL(c.new_employee_id,d.emp_id_number)
 LEFT JOIN SHIFTER.shf_attendance a ON d.shf_employee_day_id=a.shf_employee_day_id
 LEFT JOIN SHIFTER.shf_org_unit u ON u.org_unit_id=e.org_unit_id`;
const listTail = `LEFT JOIN SHIFTER.shf_attendance a ON d.shf_employee_day_id=a.shf_employee_day_id
 LEFT JOIN SHIFTER.shf_org_unit u ON u.org_unit_id=e.org_unit_id
 LEFT JOIN SHIFTER.shf_employees e_old ON SUBSTR(e_old.emp_id_number,1,8)=d.emp_id_number`;
function qualifyingBranches(columns: string, predicate: string): string {
  // Disjoint NVL employee branches preserve every joined row while exposing the
  // existing day.employee-number / employee-prefix indexes to Oracle 11.
  return `SELECT ${columns} FROM SHIFTER.shf_employee_day d
    LEFT JOIN SHIFTER.shf_day_changes c ON d.shf_employee_day_id=c.shf_employee_day_id
    JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=d.emp_id_number
    ${listTail} ${predicate} AND c.new_employee_id IS NULL
    UNION ALL
    SELECT ${columns} FROM SHIFTER.shf_employee_day d
    JOIN SHIFTER.shf_day_changes c ON d.shf_employee_day_id=c.shf_employee_day_id
    JOIN SHIFTER.shf_employees e ON SUBSTR(e.emp_id_number,1,8)=c.new_employee_id
    ${listTail} ${predicate} AND c.new_employee_id IS NOT NULL`;
}
async function requireGregorian(query: Query) {
  const rows = await query("SELECT value AS \"calendar\" FROM nls_session_parameters WHERE parameter='NLS_CALENDAR'", {}, 1);
  if (rows.length !== 1 || !record(rows[0]) || rows[0].calendar !== "GREGORIAN")
    throw new SliceError("DEPENDENCY_UNAVAILABLE");
}
export class OracleDetailReader implements EmployeeShiftDayReader {
  readonly dataSource = "oracle" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async readByDayId(shiftDayId: string): Promise<ShiftDayReadResult> {
    if (!decimalId(shiftDayId, 10)) throw new SliceError("INVALID_REQUEST");
    return this.session.read(async query => {
      await requireGregorian(query);
      const rows = await query(`SELECT * FROM (
        SELECT ${detailFields} ${baseJoin}
        WHERE e.employee_id IS NOT NULL AND d.shf_employee_day_id=TO_NUMBER(:dayId)
        ) WHERE ROWNUM <= 2`, { dayId: shiftDayId }, 2);
      if (rows.length === 0) return { kind: "not-found" };
      if (rows.length > 1) return { kind: "ambiguous" };
      const row = rawDetail(rows[0]);
      return { kind: "one", row };
    });
  }
}
function rawDetail(value: unknown): RawShiftDay {
  validateRaw(value);
  return {
    shiftDayId: value.shiftDayId, employeeId: value.employeeId,
    firstName: value.firstName, lastName: value.lastName, orgUnitId: value.orgUnitId,
    baselineStartLocal: value.baselineStartLocal, changedStartLocal: value.changedStartLocal,
    baselineEndLocal: value.baselineEndLocal, changedEndLocal: value.changedEndLocal,
    baselineActivityData: value.baselineActivityData, changedActivityData: value.changedActivityData,
    baselineSiteId: value.baselineSiteId, changedSiteId: value.changedSiteId,
    stageArrivalLocal: value.stageArrivalLocal, stationArrivalLocal: value.stationArrivalLocal,
    stationExitLocal: value.stationExitLocal,
  };
}
function scopeBinds(ids: readonly string[]) {
  if (ids.length > 100 || new Set(ids).size !== ids.length || !ids.every(unitCode)) sourceFailure();
  const binds: Record<string, string | number | null> = {};
  const placeholders = ids.map((id, i) => { binds[`team${i}`] = id; return `:team${i}`; });
  return { binds, placeholders };
}
async function teamsAndParents(query: Query, ids: readonly string[]) {
  const { binds, placeholders } = scopeBinds(ids);
  if (ids.length === 0) return { options: [], teams: [] };
  const grants = placeholders.map(p => `SELECT ${p} AS grant_id FROM dual`).join(" UNION ALL ");
  const rows = await query(`SELECT * FROM (SELECT g.grant_id AS "grantCode", t.org_unit_id AS "teamCode",
    t.org_unit_name AS "teamLabel", t.unit_type_id AS "teamType",
    p.org_unit_id AS "code", p.org_unit_name AS "label", p.unit_type_id AS "unitType"
    FROM (${grants}) g LEFT JOIN SHIFTER.shf_org_unit t ON t.org_unit_id=g.grant_id
    LEFT JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=t.parent_unit) WHERE ROWNUM <= :catalogBound`,
  { ...binds, catalogBound: ids.length + 1 }, ids.length + 1);
  if (rows.length !== ids.length) sourceFailure();
  const teams: Array<{ code: string; label: string; parent: MokedOptionV1 }> = [];
  const parentMap = new Map<string, MokedOptionV1>();
  const seen = new Set<string>();
  for (const row of rows) {
    if (!record(row) || !unitCode(row.grantCode) || row.teamCode !== row.grantCode ||
        !plainLabel(row.teamLabel, 1) || row.teamType !== "J01" || !mokedOption(row) ||
        row.code === row.teamCode || seen.has(row.grantCode)) sourceFailure();
    seen.add(row.grantCode);
    const parent: MokedOptionV1 = { code: row.code, label: row.label, unitType: "G01" };
    const previous = parentMap.get(parent.code);
    if (previous && previous.label !== parent.label) sourceFailure();
    parentMap.set(parent.code, parent);
    teams.push({ code: row.grantCode, label: row.teamLabel, parent });
  }
  return { options: [...parentMap.values()].sort((a, b) => compareCode(a.code, b.code)), teams };
}
const catalogSql = {
  activities: { table: "SHIFTER.shf_activity_type", id: "activity_type_id", label: "activity_type_name" },
  innerJobs: { table: "SHIFTER.shf_inner_jobs", id: "inner_job_id", label: "inner_job_name" },
  missingReasons: { table: "SHIFTER.shf_event_reason", id: "reason_id", label: "reason_desc" },
} as const;
async function labelsFor(query: Query, kind: keyof typeof catalogSql, requested: readonly string[]): Promise<CatalogValueV1[]> {
  const unique = [...new Set(requested)];
  if (unique.length > 10100 || !unique.every(catalogCode)) sourceFailure();
  const result: CatalogValueV1[] = [], seen = new Set<string>();
  const catalog = catalogSql[kind];
  for (let offset = 0; offset < unique.length; offset += 1000) {
    const chunk = unique.slice(offset, offset + 1000);
    const binds: Record<string, string | number> = {};
    const placeholders = chunk.map((code, i) => { binds[`code${i}`] = code; return `:code${i}`; });
    // Explicit numeric-to-text code conversion avoids converting unknown client/source tokens to NUMBER.
    const id = numberText(catalog.id);
    const rows = await query(`SELECT * FROM (SELECT ${id} AS "code", ${catalog.label} AS "label"
      FROM ${catalog.table} WHERE ${id} IN (${placeholders.join(",")}))
      WHERE ROWNUM <= :lookupBound`, { ...binds, lookupBound: chunk.length + 1 }, chunk.length + 1);
    if (rows.length > chunk.length) sourceFailure();
    for (const row of rows) {
      if (!catalogValue(row) || seen.has(row.code) || !chunk.includes(row.code)) sourceFailure();
      seen.add(row.code); result.push({ code: row.code, label: row.label });
    }
  }
  return result;
}
interface JoinedCurrent {
  day: CurrentFixtureDay;
  employee: CurrentFixtureEmployee;
  attendance: CurrentFixtureAttendance;
}
function joinedCurrent(value: unknown): JoinedCurrent {
  if (!record(value) || !decimalId(value.shiftDayId, 10) || !decimalId(value.employeeId) ||
      !text(value.firstName, 40) || !text(value.lastName, 40) || !unitCode(value.orgUnitId) ||
      !text(value.employeeKey, 240, 1) ||
      !(value.changedEmployeeKey === null || text(value.changedEmployeeKey, 9, 1)) ||
      !text(value.employeeNumber, 128, 8) ||
      !(value.innerJobCode === null || catalogCode(value.innerJobCode)) ||
      !(value.missingReason === null || value.missingReason === "0" || decimalId(value.missingReason))) sourceFailure();
  const date = (key: string): string | null => {
    const v = value[key];
    if (v === null || localDateTime(v)) return v;
    return sourceFailure();
  };
  const activity = (key: string): string | null => {
    const v = value[key];
    if (v === null || text(v, 12900)) return v;
    return sourceFailure();
  };
  for (const key of ["baselineHome", "changedHome"])
    if (!(value[key] === null || text(value[key], 128))) sourceFailure();
  for (const key of ["baselineDayType", "changedDayType"])
    if (!(value[key] === null || (typeof value[key] === "number" && Number.isSafeInteger(value[key])))) sourceFailure();
  // Repeat narrowing at the field boundary; no unchecked Oracle row casts.
  const baselineHome = value.baselineHome, changedHome = value.changedHome;
  const baselineType = value.baselineDayType, changedType = value.changedDayType;
  if (!(baselineHome === null || typeof baselineHome === "string") ||
      !(changedHome === null || typeof changedHome === "string") ||
      !(baselineType === null || typeof baselineType === "number") ||
      !(changedType === null || typeof changedType === "number") || value.cancellationReason !== null) sourceFailure();
  const day: CurrentFixtureDay = {
    shiftDayId: value.shiftDayId, employeeKey: value.employeeKey, changedEmployeeKey: value.changedEmployeeKey,
    baselineStartLocal: date("baselineStartLocal"), changedStartLocal: date("changedStartLocal"),
    baselineEndLocal: date("baselineEndLocal"), changedEndLocal: date("changedEndLocal"),
    baselineDayType: baselineType, changedDayType: changedType, cancellationReason: null,
    baselineActivityData: activity("baselineActivityData"), changedActivityData: activity("changedActivityData"),
    baselineHome, changedHome,
  };
  const employee: CurrentFixtureEmployee = {
    employeeId: value.employeeId, employeeNumber: value.employeeNumber, firstName: value.firstName, lastName: value.lastName,
    teamCode: value.orgUnitId, innerJobCode: value.innerJobCode,
  };
  if (employeePrefix(employee.employeeNumber) !== (day.changedEmployeeKey ?? day.employeeKey) ||
      (day.changedDayType ?? day.baselineDayType) !== 4) sourceFailure();
  // Validate both baseline/change token sets, not only whichever is effective.
  activityTokens(day.baselineActivityData);
  activityTokens(day.changedActivityData);
  return { day, employee, attendance: { shiftDayId: value.shiftDayId,
    missingReason: value.missingReason, stationArrivalLocal: date("stationArrivalLocal") } };
}
export class OracleCurrentReader implements CurrentShiftReadPort {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async readMokedOptions(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return this.session.read(async query => {
      await requireGregorian(query);
      return (await teamsAndParents(query, ids)).options;
    });
  }
  async readRows(selection: CurrentShiftReadSelection) {
    const { binds, placeholders } = scopeBinds(selection.authorizedTeamUnitIds);
    if (!localDateTime(selection.attendanceDate + "T" + selection.currentTime + ":00") ||
        !Number.isInteger(selection.limit) || selection.limit < 1 || selection.limit > 100 ||
        !Number.isInteger(selection.offset) || selection.offset < 0 || selection.offset > 10000 ||
        selection.sort !== "effective-start-asc") throw new SliceError("INVALID_REQUEST");
    if (selection.authorizedTeamUnitIds.length === 0) {
      if (selection.mokedCode !== null) throw new CurrentShiftError("FORBIDDEN");
      return [];
    }
    return this.session.read(async query => {
      await requireGregorian(query);
      const catalog = await teamsAndParents(query, selection.authorizedTeamUnitIds);
      if (selection.mokedCode !== null && !catalog.options.some(p => p.code === selection.mokedCode))
        throw new CurrentShiftError("FORBIDDEN");
      const commonBinds = { ...binds, at: selection.attendanceDate + "T" + selection.currentTime + ":00",
        parent: selection.mokedCode, dayType: 4 };
      const predicate = `WHERE e.employee_id IS NOT NULL AND c.cancel_reason_code IS NULL
        AND NVL(c.new_day_type,d.wm_day_type)=:dayType
        AND TO_DATE(:at,'YYYY-MM-DD"T"HH24:MI:SS') >= NVL(c.new_shift_start,d.wm_shift_start_datetime)
        AND TO_DATE(:at,'YYYY-MM-DD"T"HH24:MI:SS') < NVL(c.new_shift_end,d.wm_shift_end_datetime)
        AND e.org_unit_id IN (${placeholders.join(",")})
        AND (:parent IS NULL OR u.parent_unit=:parent)`;
      const duplicate = await query(`SELECT 1 AS "ambiguous" FROM (
        SELECT "orderDay" FROM (${qualifyingBranches('d.shf_employee_day_id AS "orderDay"', predicate)})
        GROUP BY "orderDay" HAVING COUNT(*) > 1) WHERE ROWNUM <= 1`, commonBinds, 1);
      if (duplicate.length) throw new CurrentShiftError("AMBIGUOUS_CURRENT_SHIFT");
      const extraFields = [
        alias("d.emp_id_number", "employeeKey"), alias("c.new_employee_id", "changedEmployeeKey"),
        alias("e.emp_id_number", "employeeNumber"), alias(numberText("e.inner_job_id"), "innerJobCode"),
        alias(numberText("a.miss_reason_id"), "missingReason"),
        alias("d.work_from_home", "baselineHome"), alias("c.new_work_from_home", "changedHome"),
        alias("d.wm_day_type", "baselineDayType"), alias("c.new_day_type", "changedDayType"),
        alias("c.cancel_reason_code", "cancellationReason"),
      ].join(",\n");
      const projectedNames = [...(currentFields + "," + extraFields).matchAll(/AS "([A-Za-z]+)"/g)]
        .map(match => `"${match[1]}"`).join(",");
      const orderColumns = `NVL(c.new_shift_start,d.wm_shift_start_datetime) AS "orderStart",
        d.shf_employee_day_id AS "orderDay", e.employee_id AS "orderEmployee"`;
      const qualified = qualifyingBranches(`${currentFields},${extraFields},${orderColumns}`, predicate);
      const rows = await query(`SELECT ${projectedNames} FROM (SELECT q.*,
        ROW_NUMBER() OVER (ORDER BY "orderStart","orderDay","orderEmployee") AS "rowNumber"
        FROM (${qualified}) q) WHERE "rowNumber" > :lowerBound AND "rowNumber" <= :upperBound
        ORDER BY "rowNumber"`, { ...commonBinds, lowerBound: selection.offset,
        upperBound: selection.offset + selection.limit + 1 }, selection.limit + 1);
      const joined = rows.map(joinedCurrent);
      const labels = {
        activities: await labelsFor(query, "activities", joined.flatMap(j => activityTokens(j.day.changedActivityData ?? j.day.baselineActivityData))),
        innerJobs: await labelsFor(query, "innerJobs", joined.flatMap(j =>
          j.employee.innerJobCode === null || j.employee.innerJobCode === "00" ? [] : [j.employee.innerJobCode])),
        missingReasons: await labelsFor(query, "missingReasons", joined.flatMap(j =>
          j.attendance.missingReason === null || j.attendance.missingReason === "0" ? [] : [j.attendance.missingReason])),
      };
      return joined.map(j => {
        const team = catalog.teams.find(t => t.code === j.employee.teamCode);
        if (!team) sourceFailure();
        return projectCurrentShift(j.day, j.employee, team, team.parent, j.attendance, labels);
      });
    });
  }
}
