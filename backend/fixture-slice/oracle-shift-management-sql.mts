// Private Oracle49 physical core. Values are always binds. The only writable
// tables/columns are the approved baseline and overlay allowlists below.
import type { ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan, ShiftSnapshot } from "./shift-management-model.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { civil, numberText } from "./oracle-readers.mts";
import { shiftFail } from "./shift-management-errors.mts";
import { same } from "./stage-arrival-domain.mts";

export type ShiftOracleTable = "SHF_EMPLOYEES" | "SHF_EMPLOYEE_DAY" | "SHF_DAY_CHANGES" | "SHF_ATTENDANCE";
export type ShiftOracleRow = Record<string, string | null>;
export interface ShiftOracleColumn {
  name: string; kind: "text" | "number" | "date"; nullable: boolean;
  dataLength: number; charUsed: "B" | "C" | null;
  // Actual DATA_DEFAULT LONG text; undefined is NOT "no default".
  defaultSql: string | null;
}
export type ShiftOracleSchema = Record<ShiftOracleTable, ShiftOracleColumn[]>;
export interface ShiftOracleCore {
  employee: ShiftOracleRow; prefixEmployees: ShiftOracleRow[];
  days: ShiftOracleRow[]; overlays: ShiftOracleRow[]; attendance: ShiftOracleRow[];
}
export interface ShiftOracleStatement {
  sql: string; binds: Record<string, string | null>; after: ShiftOracleRow;
}
const tables: readonly ShiftOracleTable[] = ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE"];
const dayInsertColumns = ["SHF_EMPLOYEE_DAY_ID", "WM_DATE", "WM_DAY_TYPE", "EMP_ID_NUMBER", "SOURCE",
  "WM_SCH_ACTIVITY_ID_DATA", "WM_START_DATETIME", "WM_END_DATETIME", "WM_SHIFT_START_DATETIME",
  "WM_SHIFT_END_DATETIME", "WM_SITE_ID", "WM_PAID_MINUTES", "WM_WORK_MINUTES", "REMARK", "WORK_FROM_HOME", "SPLIT_SHIFT"];
const overlayInsertColumns = ["SHF_EMPLOYEE_DAY_ID", "NEW_EMPLOYEE_ID", "NEW_DAY_TYPE", "NEW_DAY_START", "NEW_DAY_END",
  "NEW_SHIFT_START", "NEW_SHIFT_END", "NEW_ACTIVITY", "NEW_SITE_ID", "NEW_PAID_MINUTES", "NEW_WORK_MINUTES",
  "NEW_WORK_FROM_HOME", "NEW_SPLIT_SHIFT", "NEW_EXCEPTION_TYPE_ID", "NEW_TIMEOFF_TYPE_ID",
  "START_CHANGE_REASON", "END_CHANGE_REASON", "CANCEL_REASON_CODE", "CANCEL_REASON_REMARK", "MODIFICATION_TIME", "MODIFICATION_USER"];
export function validateShiftOracleSchema(schema: ShiftOracleSchema): void {
  if (!record(schema) || Object.keys(schema).length !== tables.length) shiftFail("INVALID_SOURCE_DATA");
  for (const table of tables) {
    const columns = schema[table];
    if (!Array.isArray(columns) || columns.length < 1 || columns.length > 1000) shiftFail("INVALID_SOURCE_DATA");
    const names = new Set<string>();
    for (const column of columns) {
      if (!/^[A-Z][A-Z0-9_]{0,29}$/.test(column.name) || names.has(column.name) ||
          !["text", "number", "date"].includes(column.kind) || typeof column.nullable !== "boolean" ||
          !Number.isSafeInteger(column.dataLength) || column.dataLength <= 0 ||
          !["B", "C", null].includes(column.charUsed) ||
          !(column.defaultSql === null || typeof column.defaultSql === "string" && column.defaultSql.length <= 8192))
        shiftFail("INVALID_SOURCE_DATA");
      names.add(column.name);
    }
  }
  for (const [table, names] of [
    ["SHF_EMPLOYEE_DAY", ["WM_DATE", "WM_START_DATETIME", "WM_END_DATETIME", "WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME"]],
    ["SHF_DAY_CHANGES", ["NEW_DAY_START", "NEW_DAY_END", "NEW_SHIFT_START", "NEW_SHIFT_END", "MODIFICATION_TIME"]],
    ["SHF_ATTENDANCE", ["STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME", "STATION_EXIT_TIME"]],
  ] as const) {
    for (const name of names)
      if (schema[table].find(c => c.name === name)?.kind !== "date") shiftFail("LIVE_WRITES_DISABLED");
  }
}
export function validateShiftOracleInsertability(schema: ShiftOracleSchema,
  table: "SHF_EMPLOYEE_DAY" | "SHF_DAY_CHANGES"): ShiftOracleRow {
  validateShiftOracleSchema(schema);
  const explicit = table === "SHF_EMPLOYEE_DAY" ? dayInsertColumns : overlayInsertColumns;
  for (const name of explicit) columnFor(schema, table, name);
  const defaults: ShiftOracleRow = {};
  for (const column of schema[table])
    if (!explicit.includes(column.name)) defaults[column.name] = shiftOracleStaticDefault(column);
  return defaults;
}
export function shiftOracleProjection(column: ShiftOracleColumn, alias: string): string {
  if (!/^[a-z][a-z0-9_]*\.$/.test(alias) || !/^[A-Z][A-Z0-9_]{0,29}$/.test(column.name))
    shiftFail("INVALID_SOURCE_DATA");
  const expression = alias + column.name;
  return column.kind === "date" ? civil(expression) : column.kind === "number" ? numberText(expression) : expression;
}
export function parseShiftOracleRow(value: unknown, columns: readonly ShiftOracleColumn[]): ShiftOracleRow {
  if (!record(value) || Object.keys(value).length !== columns.length) shiftFail("INVALID_SOURCE_DATA");
  const result: ShiftOracleRow = {};
  for (const column of columns) {
    const v = value[column.name];
    if (v !== null && (typeof v !== "string" || !v.isWellFormed() || Buffer.byteLength(v) > 8192 ||
        column.kind === "number" && !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(v) ||
        column.kind === "date" && !localDateTime(v)) || v === null && !column.nullable)
      shiftFail("INVALID_SOURCE_DATA");
    result[column.name] = v;
  }
  return result;
}
export function shiftOracleStaticDefault(column: ShiftOracleColumn): string | null {
  const sql = column.defaultSql;
  if (sql === null || typeof sql === "string" && /^NULL$/i.test(sql.trim())) {
    if (!column.nullable) shiftFail("LIVE_WRITES_DISABLED");
    return null;
  }
  if (typeof sql !== "string") shiftFail("LIVE_WRITES_DISABLED");
  const trimmed = sql.trim();
  if (column.kind === "text" && /^'(?:[^']|'')*'$/.test(trimmed)) {
    const value = trimmed.slice(1, -1).replaceAll("''", "'");
    if (value === "") {
      if (!column.nullable) shiftFail("LIVE_WRITES_DISABLED");
      return null; // Oracle empty VARCHAR2 is NULL, never a JS empty default.
    }
    if (!value.isWellFormed() || value.includes("\uFFFD")) shiftFail("LIVE_WRITES_DISABLED");
    return value;
  }
  if (column.kind === "number" && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(trimmed)) return trimmed;
  // No evaluation, TO_DATE/SYSDATE, sequence/function, session expression,
  // generated column or guessed default. Actual unreviewed facts deny create.
  return shiftFail("LIVE_WRITES_DISABLED");
}
function columnFor(schema: ShiftOracleSchema, table: ShiftOracleTable, name: string): ShiftOracleColumn {
  const column = schema[table].find(column => column.name === name);
  if (!column) shiftFail("LIVE_WRITES_DISABLED");
  return column;
}
function checkedWitnessBinds(extraBinds: Record<string, string | null>) {
  if (Object.entries(extraBinds).some(([key, value]) => !/^w_[A-Za-z0-9_]+$/.test(key) ||
      !(value === null || typeof value === "string" && value.isWellFormed())))
    shiftFail("INVALID_SOURCE_DATA");
  return { ...extraBinds };
}
function valueBind(column: ShiftOracleColumn, key: string, value: string | null): string {
  if (value === null && !column.nullable) shiftFail("INVALID_SOURCE_DATA");
  if (value !== null && (typeof value !== "string" || !value.isWellFormed())) shiftFail("INVALID_SOURCE_DATA");
  if (column.kind === "date") {
    if (value !== null && !localDateTime(value)) shiftFail("INVALID_SOURCE_DATA");
    return `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')`;
  }
  if (column.kind === "number") {
    // Application-issued numeric writes are exact integers, independent of
    // decimal locale. Original decimals use canonical text comparisons below.
    if (value !== null && !/^-?(?:0|[1-9][0-9]{0,37})$/.test(value)) shiftFail("INVALID_SOURCE_DATA");
    return `TO_NUMBER(:${key})`;
  }
  return `:${key}`;
}
const dayValues = (p: ShiftCreatePlan): ShiftOracleRow => ({
  SHF_EMPLOYEE_DAY_ID: p.day.shiftDayId, WM_DATE: p.day.dateLocal, WM_DAY_TYPE: p.day.dayType,
  EMP_ID_NUMBER: p.day.employeeNumber, SOURCE: p.day.source, WM_SCH_ACTIVITY_ID_DATA: p.day.activityCode,
  WM_START_DATETIME: p.day.dayStartLocal, WM_END_DATETIME: p.day.dayEndLocal,
  WM_SHIFT_START_DATETIME: p.day.startLocal, WM_SHIFT_END_DATETIME: p.day.endLocal,
  WM_SITE_ID: p.day.siteId, WM_PAID_MINUTES: p.day.paidMinutes, WM_WORK_MINUTES: p.day.workMinutes,
  REMARK: p.day.remark, WORK_FROM_HOME: p.day.workFromHome, SPLIT_SHIFT: p.day.splitShift,
});
const overlayValues = (p: ShiftOverlayPlan): ShiftOracleRow => ({
  SHF_EMPLOYEE_DAY_ID: p.dayId, NEW_EMPLOYEE_ID: p.after.employeeNumber, NEW_DAY_TYPE: p.after.dayType,
  NEW_DAY_START: p.after.dayStartLocal, NEW_DAY_END: p.after.dayEndLocal,
  NEW_SHIFT_START: p.after.startLocal, NEW_SHIFT_END: p.after.endLocal,
  NEW_ACTIVITY: p.after.activityCode, NEW_SITE_ID: p.after.siteId,
  NEW_PAID_MINUTES: p.after.paidMinutes, NEW_WORK_MINUTES: p.after.workMinutes,
  NEW_WORK_FROM_HOME: p.after.workFromHome, NEW_SPLIT_SHIFT: p.after.splitShift,
  NEW_EXCEPTION_TYPE_ID: p.after.exceptionType, NEW_TIMEOFF_TYPE_ID: p.after.timeoffType,
  START_CHANGE_REASON: p.after.startReasonCode, END_CHANGE_REASON: p.after.endReasonCode,
  CANCEL_REASON_CODE: p.after.cancelReasonCode, CANCEL_REASON_REMARK: p.after.cancelRemark,
  MODIFICATION_TIME: p.after.modificationLocal, MODIFICATION_USER: p.after.modificationUser,
});
export function shiftOracleInsertDay(schema: ShiftOracleSchema, plan: ShiftCreatePlan): ShiftOracleStatement {
  const d = plan.day;
  if (!decimalId(d.shiftDayId, 10) || !/^[A-Za-z0-9]{8}$/.test(d.employeeNumber) || d.dayType !== "4" ||
      d.source !== "fExtra" || d.splitShift !== "N" || !["Y", "N"].includes(d.workFromHome ?? "") ||
      d.exceptionType !== null || d.timeoffType !== null || d.switchDayId !== null ||
      d.dayStartLocal !== d.startLocal || d.dayEndLocal !== d.endLocal ||
      d.dateLocal !== d.startLocal.slice(0, 10) + "T00:00:00") shiftFail("INVALID_SOURCE_DATA");
  return insert(schema, "SHF_EMPLOYEE_DAY", dayValues(plan));
}
function insert(schema: ShiftOracleSchema, table: "SHF_EMPLOYEE_DAY" | "SHF_DAY_CHANGES",
  values: ShiftOracleRow): ShiftOracleStatement {
  validateShiftOracleSchema(schema);
  const binds: Record<string, string | null> = {}, expressions: string[] = [], after: ShiftOracleRow = {};
  for (const [name, value] of Object.entries(values)) {
    const column = columnFor(schema, table, name), key = `v${expressions.length}`;
    binds[key] = value; expressions.push(valueBind(column, key, value)); after[name] = value;
  }
  for (const column of schema[table]) {
    if (!Object.hasOwn(after, column.name)) after[column.name] = shiftOracleStaticDefault(column);
  }
  return { sql: `INSERT INTO SHIFTER.${table} (${Object.keys(values).join(",")}) VALUES (${expressions.join(",")})`,
    binds, after };
}
function originalWhere(schema: ShiftOracleSchema, table: ShiftOracleTable, before: ShiftOracleRow,
  alias: string, binds: Record<string, string | null>, prefix: string): string {
  parseShiftOracleRow(before, schema[table]);
  return schema[table].map((column, i) => {
    const key = `${prefix}${i}`, value = before[column.name];
    binds[key] = value;
    // Exact NULL semantics; no NVL collisions, positive fallbacks or invented
    // ORA_ROWSCN. DATE comparison retains all observed civil seconds.
    const projected = shiftOracleProjection(column, alias);
    return `((${projected}=:${key}) OR (${alias}${column.name} IS NULL AND :${key} IS NULL))`;
  }).join(" AND ");
}
export function shiftOracleCoreGuard(schema: ShiftOracleSchema, core: ShiftOracleCore,
  binds: Record<string, string | null>): string {
  const parts: string[] = [];
  parts.push(`EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEES eg WHERE ${originalWhere(schema,
    "SHF_EMPLOYEES", core.employee, "eg.", binds, "eg")})`);
  const number = core.employee.EMP_ID_NUMBER;
  if (typeof number !== "string" || !/^[A-Za-z0-9]{8,9}$/.test(number)) shiftFail("INVALID_SOURCE_DATA");
  binds.employeePrefix = number.slice(0, 8);
  parts.push("(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES ep WHERE SUBSTR(ep.EMP_ID_NUMBER,1,8)=:employeePrefix)=1");
  // Peer/policy/dependency-window membership guards are supplied by the owning
  // evidence adapter; this core protects every observed physical target row.
  for (const [table, rows] of [["SHF_EMPLOYEE_DAY", core.days], ["SHF_DAY_CHANGES", core.overlays],
    ["SHF_ATTENDANCE", core.attendance]] as const) {
    for (let i = 0; i < rows.length; i++) {
      const alias = `g${parts.length}.`;
      parts.push(`EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias.slice(0, -1)} WHERE ${
        originalWhere(schema, table, rows[i], alias, binds, `g${parts.length}_`)})`);
    }
  }
  return parts.join(" AND ");
}
export function shiftOracleMarkSource(schema: ShiftOracleSchema, core: ShiftOracleCore,
  plan: ShiftSourcePlan, extraGuard: string, extraBinds: Record<string, string | null>): ShiftOracleStatement {
  const before = core.days.find(row => row.SHF_EMPLOYEE_DAY_ID === plan.dayId);
  if (!before || before.SOURCE !== "WFM" || plan.from !== "WFM" || plan.to !== "SHF" ||
      plan.original.source !== "WFM") shiftFail("STALE_PREPARATION");
  const binds = { ...checkedWitnessBinds(extraBinds), dayId: plan.dayId, newSource: "SHF" };
  const guard = shiftOracleCoreGuard(schema, core, binds);
  return { sql: `UPDATE SHIFTER.SHF_EMPLOYEE_DAY SET SOURCE=:newSource
    WHERE SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId) AND ${guard} AND (${extraGuard})`,
    binds, after: { ...before, SOURCE: "SHF" } };
}
export function shiftOracleOverlay(schema: ShiftOracleSchema, core: ShiftOracleCore, plan: ShiftOverlayPlan,
  kind: "change" | "cancel", inserting: boolean, extraGuard: string,
  extraBinds: Record<string, string | null>): ShiftOracleStatement {
  const values = overlayValues(plan), before = core.overlays.find(row => row.SHF_EMPLOYEE_DAY_ID === plan.dayId);
  if (inserting !== !before || inserting !== (plan.before === null)) shiftFail("STALE_PREPARATION");
  const writeColumns = kind === "change" ? ["NEW_DAY_START", "NEW_SHIFT_START", "NEW_DAY_END", "NEW_SHIFT_END",
    "NEW_ACTIVITY", "NEW_WORK_FROM_HOME", "NEW_PAID_MINUTES", "NEW_WORK_MINUTES",
    "START_CHANGE_REASON", "END_CHANGE_REASON", "MODIFICATION_TIME", "MODIFICATION_USER"] :
    ["NEW_DAY_TYPE", "NEW_EMPLOYEE_ID", "CANCEL_REASON_CODE", "CANCEL_REASON_REMARK", "MODIFICATION_TIME", "MODIFICATION_USER"];
  if (inserting) {
    const statement = insert(schema, "SHF_DAY_CHANGES", values);
    const binds = { ...checkedWitnessBinds(extraBinds), ...statement.binds, targetDay: plan.dayId };
    const guard = shiftOracleCoreGuard(schema, core, binds);
    return { ...statement, binds, sql: statement.sql.replace(" VALUES (", " SELECT ").replace(/\)$/, "") +
      ` FROM dual WHERE ${guard} AND (${extraGuard}) AND NOT EXISTS
      (SELECT 1 FROM SHIFTER.SHF_DAY_CHANGES absent WHERE absent.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:targetDay))` };
  }
  if (!before) shiftFail("STALE_PREPARATION");
  const after = { ...before }, binds: Record<string, string | null> = { ...checkedWitnessBinds(extraBinds), targetDay: plan.dayId };
  const assignments = writeColumns.map((name, i) => {
    const key = `v${i}`; binds[key] = values[name]; after[name] = values[name];
    return `${name}=${valueBind(columnFor(schema, "SHF_DAY_CHANGES", name), key, values[name])}`;
  });
  // Existing-row edits must preserve owner/site/type/split/cancel/pool/other
  // fields not in the operation allowlist, even if a private plan is malformed.
  if (Object.entries(values).some(([name, value]) => !writeColumns.includes(name) && before[name] !== value))
    shiftFail("INVALID_SOURCE_DATA");
  const guard = shiftOracleCoreGuard(schema, core, binds);
  return { sql: `UPDATE SHIFTER.SHF_DAY_CHANGES SET ${assignments.join(",")}
    WHERE SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:targetDay) AND ${guard} AND (${extraGuard})`, binds, after };
}
export function guardedShiftOracleInsert(statement: ShiftOracleStatement, schema: ShiftOracleSchema,
  core: ShiftOracleCore, extraGuard: string, extraBinds: Record<string, string | null>): ShiftOracleStatement {
  const binds = { ...checkedWitnessBinds(extraBinds), ...statement.binds }, guard = shiftOracleCoreGuard(schema, core, binds);
  return { ...statement, binds, sql: statement.sql.replace(" VALUES (", " SELECT ").replace(/\)$/, "") +
    ` FROM dual WHERE ${guard} AND (${extraGuard})` };
}
export function sameShiftOracleRow(a: ShiftOracleRow, b: ShiftOracleRow) { return same(a, b); }
export function validateShiftOracleCoreProjection(snapshot: ShiftSnapshot, core: ShiftOracleCore): void {
  const employee = snapshot.employee, raw = core.employee;
  for (const [column, value] of Object.entries({ EMPLOYEE_ID: employee.employeeId,
    EMP_ID_NUMBER: employee.employeeNumber, FIRST_NAME: employee.firstName, LAST_NAME: employee.lastName,
    ORG_UNIT_ID: employee.orgUnitId, STATUS_ID: employee.statusCode, WORK_FROM_HOME: employee.workFromHome }))
    if (raw[column] !== value) shiftFail("INVALID_SOURCE_DATA");
  if (!same(core.prefixEmployees.map(row => row.EMPLOYEE_ID), employee.prefixEmployeeIds) ||
      snapshot.days.length !== core.days.length) shiftFail("INVALID_SOURCE_DATA");
  for (const day of snapshot.days) {
    const rawDay = core.days.find(row => row.SHF_EMPLOYEE_DAY_ID === day.baseline.shiftDayId);
    if (!rawDay) shiftFail("INVALID_SOURCE_DATA");
    const mapped = { ...dayValues({ day: day.baseline }), WM_EXCEPTION_TYPE_ID: day.baseline.exceptionType,
      WM_TIMEOFF_TYPE_ID: day.baseline.timeoffType };
    const extras = Object.fromEntries(Object.entries(rawDay).filter(([key]) => !Object.hasOwn(mapped, key)));
    if (Object.entries(mapped).some(([key, value]) => rawDay[key] !== value) ||
        !same(extras, day.baseline.preserved)) shiftFail("INVALID_SOURCE_DATA");
    const rawOverlay = core.overlays.find(row => row.SHF_EMPLOYEE_DAY_ID === day.baseline.shiftDayId);
    if (day.overlay === null ? rawOverlay !== undefined : rawOverlay === undefined) shiftFail("INVALID_SOURCE_DATA");
    if (day.overlay && rawOverlay) {
      const values = overlayValues({ dayId: day.baseline.shiftDayId, before: null, after: day.overlay });
      if (Object.entries(values).some(([key, value]) => rawOverlay[key] !== value) ||
          !same(Object.fromEntries(Object.entries(rawOverlay).filter(([key]) => !Object.hasOwn(values, key))),
            day.overlay.preserved)) shiftFail("INVALID_SOURCE_DATA");
    }
    const attendance = core.attendance.find(row => row.SHF_EMPLOYEE_DAY_ID === day.baseline.shiftDayId) ?? null;
    if (!same(attendance, day.attendance)) shiftFail("INVALID_SOURCE_DATA");
  }
}
