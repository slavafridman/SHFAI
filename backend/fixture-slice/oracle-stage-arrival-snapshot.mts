import type { BindParameters } from "oracledb";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { civil, numberText, requireGregorian } from "./oracle-readers.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { NativeBinding, NativeIdentity } from "./native-stage-arrival-config.mts";
import { nativeMarker, parseNativeIdentity, nativeTargetReference, nativeEndpointHostMatches } from "./native-stage-arrival-config.mts";
import type { StageArrivalBlockerV1 } from "./stage-arrival-contracts.mts";
import { nativeBlockers } from "./oracle-stage-arrival-domain.mts";

// Internal SQL/query seam, not an architect-owned public contract.
export type NativeQuery = (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]>;
export type NativeRow = Record<string, string | null>;
export type NativeColumn = { name: string; kind: "text" | "number" | "date" };
export type NativeSchema = Record<string, NativeColumn[]>;
export const nativeTables = {
  SHF_EMPLOYEES: ["EMPLOYEE_ID", "EMP_ID_NUMBER", "FIRST_NAME", "LAST_NAME", "ORG_UNIT_ID"],
  SHF_EMPLOYEE_DAY: ["SHF_EMPLOYEE_DAY_ID", "EMP_ID_NUMBER", "WM_DAY_TYPE", "WM_SHIFT_START_DATETIME",
    "WM_SHIFT_END_DATETIME", "WM_SCH_ACTIVITY_ID_DATA", "WM_EXCEPTION_TYPE_ID", "SPLIT_SHIFT", "SPLIT_START", "SPLIT_END", "SOURCE"],
  SHF_DAY_CHANGES: ["SHF_EMPLOYEE_DAY_ID", "NEW_EMPLOYEE_ID", "NEW_DAY_TYPE", "NEW_SHIFT_START",
    "NEW_SHIFT_END", "NEW_ACTIVITY", "NEW_EXCEPTION_TYPE_ID", "CANCEL_REASON_CODE", "NEW_SPLIT_SHIFT", "NEW_SPLIT_START", "NEW_SPLIT_END"],
  SHF_ATTENDANCE: ["SHF_EMPLOYEE_DAY_ID", "STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH",
    "STATION_ARRIVAL_TIME", "STATION_EXIT_TIME", "MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK",
    "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "STAGE_LATE_REMARK"],
  SHF_ORG_UNIT: ["ORG_UNIT_ID", "UNIT_TYPE_ID", "PARENT_UNIT"],
  SHF_SYSTEM_PARAM: ["PARAM_KEY", "DEFAULT_VALUE"],
  SHF_UNIT_PARAM: ["PARAM_KEY", "ORG_UNIT_ID", "PARAM_VALUE"],
  SHF_EMPLOYEE_REPORTS: ["EMPLOYEE_ID", "APPROVED_TIME"],
} as const;
export const policyKey = "shf.param.minutesArrivalBeforeStation";
const tablesSql = Object.keys(nativeTables).map(t => `'${t}'`).join(",");
const scope = `owner='SHIFTER' AND table_name IN (${tablesSql})`;
// DBA visibility is deliberately required: ALL_* absence does not certify
// invisible VPD/trigger/grant effects. Failure to inspect is a fail-closed stop.
export const nativeMetadataSql = [
  `SELECT table_name AS "tableName",column_name AS "columnName",data_type AS "dataType",
    data_length AS "dataLength",char_used AS "charUsed",nullable AS "nullable",virtual_column AS "virtualColumn"
    FROM dba_tab_columns tc WHERE ${scope} AND EXISTS
      (SELECT 1 FROM dba_tables tt WHERE tt.owner=tc.owner AND tt.table_name=tc.table_name AND tt.temporary='N')
    ORDER BY table_name,column_id`,
  `SELECT table_name AS "tableName",constraint_name AS "name",constraint_type AS "kind",
    status AS "status",validated AS "validated",r_owner AS "referencedOwner",
    r_constraint_name AS "referencedConstraint" FROM dba_constraints WHERE ${scope} ORDER BY table_name,constraint_name`,
  `SELECT table_name AS "tableName",constraint_name AS "name",column_name AS "columnName",position AS "position"
    FROM dba_cons_columns WHERE ${scope} ORDER BY table_name,constraint_name,position`,
  `SELECT table_name AS "tableName",trigger_name AS "name",status AS "status"
    FROM dba_triggers WHERE table_owner='SHIFTER' AND table_name IN (${tablesSql}) ORDER BY table_name,trigger_name`,
  `SELECT object_name AS "tableName",policy_name AS "name",enable AS "enabled"
    FROM dba_policies WHERE object_owner='SHIFTER' AND object_name IN (${tablesSql}) ORDER BY object_name,policy_name`,
  `SELECT table_name AS "tableName",grantee AS "grantee",privilege AS "privilege"
    FROM dba_tab_privs WHERE ${scope} ORDER BY table_name,grantee,privilege`,
  `SELECT table_name AS "tableName",column_name AS "columnName",grantee AS "grantee",privilege AS "privilege"
    FROM dba_col_privs WHERE ${scope} ORDER BY table_name,column_name,grantee,privilege`,
  `SELECT grantee AS "grantee",granted_role AS "role",default_role AS "defaultRole"
    FROM dba_role_privs WHERE grantee IN (:writeUser,'PUBLIC') ORDER BY grantee,granted_role`,
  `SELECT name AS "name",type AS "type",referenced_owner AS "referencedOwner",
    referenced_name AS "referencedName",referenced_type AS "referencedType"
    FROM dba_dependencies WHERE owner='SHIFTER' AND name IN (${tablesSql})
    ORDER BY name,type,referenced_owner,referenced_name,referenced_type`,
];
export async function nativeIdentity(q: NativeQuery, expected: NativeIdentity) {
  let identity: NativeIdentity;
  try { identity = parseNativeIdentity(expected); } catch { return stageFail("LIVE_WRITES_DISABLED"); }
  const reference = nativeTargetReference(identity), target = reference.target;
  await requireGregorian(q);
  const rows = await q(`/* native:identity */ SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "database",
    SYS_CONTEXT('USERENV','SERVER_HOST') AS "host",SYS_CONTEXT('USERENV','SERVICE_NAME') AS "service",
    ${target.kind === "sid" ? `SYS_CONTEXT('USERENV','INSTANCE_NAME') AS "instance",` : ""}
    SYS_CONTEXT('USERENV','SESSION_USER') AS "user",SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS "schema" FROM dual`, {}, 1);
  if (rows.length !== 1) stageFail("LIVE_WRITES_DISABLED");
  if (target.kind === "service-reference") {
    if (!same(rows[0], { database: reference.database, host: target.host, service: target.serviceName,
      user: identity.user, schema: identity.schema })) stageFail("LIVE_WRITES_DISABLED");
    return;
  }
  const row = rows[0];
  // SERVICE_NAME is deliberately diagnostic-only in the independently selected
  // SID strategy. No fallback or DNS operation is driven by this DB answer.
  if (!record(row) || row.database !== reference.database || row.instance !== target.instanceSid ||
      row.user !== identity.user || row.schema !== identity.schema ||
      !nativeEndpointHostMatches(target.endpointProof, row.host)) stageFail("LIVE_WRITES_DISABLED");
}
export async function nativeSafety(q: NativeQuery, b: NativeBinding): Promise<NativeSchema> {
  await nativeIdentity(q, b.writeIdentity);
  const proof: unknown[][] = [];
  for (const [i, sql] of nativeMetadataSql.entries()) {
    const rows = await q(`/* native:metadata:${i} */ ${sql}`, i === 7 ? { writeUser: b.writeIdentity.user } : {}, 1001);
    if (rows.length > 1000 || rows.some(r => !record(r))) stageFail("LIVE_WRITES_DISABLED");
    proof.push(rows);
  }
  if (fingerprint(proof) !== b.metadataDigest || !proof[1].length ||
      proof[1].some(r => !record(r) || r.status !== "ENABLED" || r.validated !== "VALIDATED") ||
      proof[3].some(r => !record(r) || r.status !== "DISABLED") ||
      proof[4].some(r => !record(r) || r.enabled !== "NO")) stageFail("LIVE_WRITES_DISABLED");
  const schema: NativeSchema = {};
  for (const [table, required] of Object.entries(nativeTables)) {
    const columns: NativeColumn[] = [];
    for (const r of proof[0]) {
      if (!record(r) || r.tableName !== table) continue;
      if (typeof r.columnName !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(r.columnName) ||
          typeof r.dataType !== "string") stageFail("INVALID_SOURCE_DATA");
      if (table !== "SHF_ATTENDANCE" && !required.some(c => c === r.columnName)) continue;
      const kind = r.dataType === "DATE" ? "date" : r.dataType === "NUMBER" ? "number" :
        ["VARCHAR2", "CHAR", "NVARCHAR2", "NCHAR"].includes(r.dataType) ? "text" : null;
      if (kind === null || r.virtualColumn !== "NO" || columns.some(c => c.name === r.columnName))
        stageFail("LIVE_WRITES_DISABLED");
      if (table === "SHF_ATTENDANCE" &&
          (r.columnName === "STAGE_ARRIVAL_TIME" && kind !== "date" ||
           ["SHF_EMPLOYEE_DAY_ID", "TADREECH"].includes(r.columnName) && kind !== "number" ||
           r.columnName === "STAGE_ARRIVAL_USER" && kind !== "text")) stageFail("LIVE_WRITES_DISABLED");
      columns.push({ name: r.columnName, kind });
      if (table === "SHF_ATTENDANCE" && r.columnName === "STAGE_ARRIVAL_USER" &&
          (typeof r.dataLength !== "number" || r.dataLength < 100)) stageFail("LIVE_WRITES_DISABLED");
    }
    if (required.some(name => !columns.some(c => c.name === name))) stageFail("LIVE_WRITES_DISABLED");
    schema[table] = columns;
  }
  // Owner access is recognized honestly; not a least-privilege certification.
  const user = b.writeIdentity.user;
  if (user !== "SHIFTER" && !proof[5].some(r => record(r) && r.tableName === "SHF_ATTENDANCE" &&
      r.grantee === user && r.privilege === "UPDATE") &&
      !["STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH"].every(column =>
        proof[6].some(r => record(r) && r.tableName === "SHF_ATTENDANCE" && r.columnName === column &&
          r.grantee === user && r.privilege === "UPDATE"))) stageFail("LIVE_WRITES_DISABLED");
  // Parse/execute bounded zero-row plain SELECTs on the actual writer account.
  // A catalog grant listing/role name alone does not prove current read access.
  for (const [table, columns] of Object.entries(schema)) {
    const rows = await q(`/* native:privilege:${table} */ SELECT ${columns.map(c => c.name).join(",")}
      FROM SHIFTER.${table} WHERE 1=0`, {}, 1);
    if (rows.length !== 0) stageFail("LIVE_WRITES_DISABLED");
  }
  return schema;
}
function expression(c: NativeColumn, alias = "") {
  const column = alias + c.name;
  return c.kind === "date" ? civil(column) : c.kind === "number" ? numberText(column) : column;
}
export interface NativeSnapshot {
  rows: Record<string, NativeRow | null>;
  reports: string;
  planned: { startLocal: string; endLocal: string };
  policy: { configuredMinutes: number };
  orgUnitId: string;
  blockers: StageArrivalBlockerV1[];
}
async function one(q: NativeQuery, schema: NativeSchema, table: string, where: string, binds: BindParameters,
  optional = false): Promise<NativeRow | null> {
  const columns = schema[table];
  if (!columns?.length) stageFail("INVALID_SOURCE_DATA");
  const rows = await q(`/* native:row:${table} */ SELECT ${columns.map(c =>
    `${expression(c)} AS "${c.name}"`).join(",")} FROM SHIFTER.${table} WHERE ${where} AND ROWNUM<=2`, binds, 2);
  if (rows.length > 1) stageFail("AMBIGUOUS_ATTENDANCE");
  if (!rows.length) { if (optional) return null; stageFail("SHIFT_DAY_NOT_FOUND"); }
  const r = rows[0], result: NativeRow = {};
  if (!record(r) || Object.keys(r).length !== columns.length) stageFail("INVALID_SOURCE_DATA");
  for (const c of columns) {
    const v = r[c.name];
    if (v !== null && (typeof v !== "string" || !v.isWellFormed() || Buffer.byteLength(v) > 8192 ||
        c.kind === "date" && !localDateTime(v) ||
        c.kind === "number" && !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(v))) stageFail("INVALID_SOURCE_DATA");
    result[c.name] = v;
  }
  return result;
}
export async function nativeSnapshot(q: NativeQuery, schema: NativeSchema, b: NativeBinding): Promise<NativeSnapshot> {
  const e = await one(q, schema, "SHF_EMPLOYEES", "EMPLOYEE_ID=TO_NUMBER(:employeeId)", { employeeId: b.employeeId });
  if (!e || e.EMPLOYEE_ID !== b.employeeId || e.ORG_UNIT_ID !== b.orgUnitId ||
      e.FIRST_NAME !== nativeMarker && e.LAST_NAME !== nativeMarker ||
      !/^[0-9]{8,}$/.test(e.EMP_ID_NUMBER ?? "")) stageFail("SHIFT_DAY_NOT_FOUND");
  const marker = await q(`/* native:marker */ SELECT ${numberText("EMPLOYEE_ID")} AS "employeeId"
    FROM SHIFTER.SHF_EMPLOYEES WHERE (FIRST_NAME=:marker OR LAST_NAME=:marker) AND ROWNUM<=2`, { marker: nativeMarker }, 2);
  if (marker.length !== 1 || !record(marker[0]) || marker[0].employeeId !== b.employeeId) stageFail("INVALID_SOURCE_DATA");
  const prefix = e.EMP_ID_NUMBER!.slice(0, 8);
  const owners = await q(`/* native:prefix */ SELECT ${numberText("EMPLOYEE_ID")} AS "employeeId"
    FROM SHIFTER.SHF_EMPLOYEES WHERE SUBSTR(EMP_ID_NUMBER,1,8)=:prefix AND ROWNUM<=2`, { prefix }, 2);
  if (owners.length !== 1 || !record(owners[0]) || owners[0].employeeId !== b.employeeId) stageFail("INVALID_SOURCE_DATA");
  const d = await one(q, schema, "SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId });
  const c = await one(q, schema, "SHF_DAY_CHANGES", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  const a = await one(q, schema, "SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  if (!d || d.SHF_EMPLOYEE_DAY_ID !== b.shiftDayId || d.EMP_ID_NUMBER !== prefix ||
      (c?.NEW_EMPLOYEE_ID ?? prefix) !== prefix || d.SOURCE !== "SYNTHETIC_DAYS") stageFail("SHIFT_DAY_NOT_FOUND");
  const team = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: b.orgUnitId });
  if (!team || team.UNIT_TYPE_ID !== "J01" || !team.PARENT_UNIT) stageFail("INVALID_SOURCE_DATA");
  const parent = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: team.PARENT_UNIT });
  if (!parent || parent.UNIT_TYPE_ID !== "G01") stageFail("INVALID_SOURCE_DATA");
  const p = await one(q, schema, "SHF_SYSTEM_PARAM", "PARAM_KEY=:policy", { policy: policyKey });
  const u = await one(q, schema, "SHF_UNIT_PARAM", "PARAM_KEY=:policy AND ORG_UNIT_ID=:unit",
    { policy: policyKey, unit: parent.ORG_UNIT_ID }, true);
  const minutes = u?.PARAM_VALUE ?? p?.DEFAULT_VALUE;
  if (typeof minutes !== "string" || !/^-?(0|[1-9][0-9]{0,8})$/.test(minutes)) stageFail("INVALID_SOURCE_DATA");
  const start = c?.NEW_SHIFT_START ?? d.WM_SHIFT_START_DATETIME, end = c?.NEW_SHIFT_END ?? d.WM_SHIFT_END_DATETIME;
  if (!localDateTime(start) || !localDateTime(end)) stageFail("INVALID_SOURCE_DATA");
  const reports = await q(`/* native:reports */ SELECT ${numberText("COUNT(*)")} AS "count"
    FROM SHIFTER.SHF_EMPLOYEE_REPORTS WHERE EMPLOYEE_ID=TO_NUMBER(:employeeId) AND APPROVED_TIME IS NULL`,
  { employeeId: b.employeeId }, 1);
  if (reports.length !== 1 || !record(reports[0]) || typeof reports[0].count !== "string" ||
      !/^(0|[1-9][0-9]*)$/.test(reports[0].count)) stageFail("INVALID_SOURCE_DATA");
  const rows = { SHF_EMPLOYEES: e, SHF_EMPLOYEE_DAY: d, SHF_DAY_CHANGES: c, SHF_ATTENDANCE: a,
    team, parent, SHF_SYSTEM_PARAM: p, SHF_UNIT_PARAM: u };
  return { rows, reports: reports[0].count,
    planned: { startLocal: start, endLocal: end }, policy: { configuredMinutes: Number(minutes) },
    orgUnitId: b.orgUnitId, blockers: nativeBlockers(rows, reports[0].count) };
}
// Full null-safe originals, never a fabricated rowversion/hash in Oracle.
export function nativeUpdate(schema: NativeSchema, before: NativeSnapshot, b: NativeBinding,
  local: string, actor: string) {
  if (!localDateTime(local) || Buffer.byteLength(actor) > 100 || !decimalId(b.employeeId)) stageFail("INVALID_SOURCE_DATA");
  const binds: Record<string, string | number | null> = { dayId: b.shiftDayId, employeeId: b.employeeId,
    marker: nativeMarker, orgUnitId: b.orgUnitId, newStageLocal: local, actor };
  let n = 0;
  const original = (table: string, row: NativeRow, alias: string) => schema[table].map(c => {
    const key = `old${n++}`; binds[key] = row[c.name];
    const bind = c.kind === "date" ? `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')` :
      c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
    return `((${alias}.${c.name}=${bind}) OR (${alias}.${c.name} IS NULL AND :${key} IS NULL))`;
  }).join(" AND ");
  const attendance = before.rows.SHF_ATTENDANCE;
  if (!attendance) stageFail("COMMAND_SCOPE_DEFERRED");
  const where = [original("SHF_ATTENDANCE", attendance, "a")];
  for (const [key, table, alias, relation] of [
    ["SHF_EMPLOYEES", "SHF_EMPLOYEES", "e", "e.EMPLOYEE_ID=TO_NUMBER(:employeeId) AND e.ORG_UNIT_ID=:orgUnitId AND (e.FIRST_NAME=:marker OR e.LAST_NAME=:marker)"],
    ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY", "d", "d.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["SHF_DAY_CHANGES", "SHF_DAY_CHANGES", "c", "c.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["team", "SHF_ORG_UNIT", "t", "t.ORG_UNIT_ID=:orgUnitId"],
    ["parent", "SHF_ORG_UNIT", "p", "p.ORG_UNIT_ID=(SELECT t.PARENT_UNIT FROM SHIFTER.SHF_ORG_UNIT t WHERE t.ORG_UNIT_ID=:orgUnitId)"],
    ["SHF_SYSTEM_PARAM", "SHF_SYSTEM_PARAM", "sp", "sp.PARAM_KEY='shf.param.minutesArrivalBeforeStation'"],
    ["SHF_UNIT_PARAM", "SHF_UNIT_PARAM", "up", "up.PARAM_KEY='shf.param.minutesArrivalBeforeStation' AND up.ORG_UNIT_ID=(SELECT t.PARENT_UNIT FROM SHIFTER.SHF_ORG_UNIT t WHERE t.ORG_UNIT_ID=:orgUnitId)"],
  ]) {
    const r = before.rows[key];
    where.push(r ? `EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation} AND ${original(table, r, alias)})` :
      `NOT EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation})`);
  }
  where.push(`NOT EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_REPORTS r
    WHERE r.EMPLOYEE_ID=TO_NUMBER(:employeeId) AND r.APPROVED_TIME IS NULL)`);
  return { sql: `/* native:update */ UPDATE SHIFTER.SHF_ATTENDANCE a SET
    STAGE_ARRIVAL_TIME=TO_DATE(:newStageLocal,'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH'),
    STAGE_ARRIVAL_USER=:actor,TADREECH=0 WHERE a.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)
    AND a.STAGE_ARRIVAL_TIME IS NULL AND ${where.join(" AND ")}`, binds };
}
