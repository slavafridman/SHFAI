import type { BindParameters } from "oracledb";
import type { ExitBinding } from "./native-station-exit-config.mts";
import type { NativeQuery, NativeRow, NativeSchema, NativeColumn } from "./oracle-stage-arrival-snapshot.mts";
import { nativeIdentity, nativeMetadataQueries, one, nativeTables } from "./oracle-stage-arrival-snapshot.mts";
import { stationTables, stationCandidateScope, stationCandidateSql } from "./oracle-station-arrival-snapshot.mts";
import { stationOverlap } from "./oracle-station-arrival-domain.mts";
import type { StationCandidate } from "./oracle-station-arrival-domain.mts";
import type { StationExitBlockerV1 } from "./station-exit-contracts.mts";
import { selectedMetadataProvider, nativeMarker } from "./native-stage-arrival-config.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { fingerprint, instantFor } from "./stage-arrival-domain.mts";
import { numberText } from "./oracle-readers.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { exitPolicy, exitBlockers } from "./oracle-station-exit-domain.mts";

// Private exit scope. F1/F2 certificates cannot certify additional site/policy
// relations or exit UPDATE privileges, even when using the same metadata views.
export const exitTables = {
  ...stationTables,
  // Source AttendanceDataModel and historical Oracle columns: station late is
  // LATE_*, NOT the F2 helper's STATION_LATE_* names. No F2 fact cast/reuse.
  SHF_ATTENDANCE: [...nativeTables.SHF_ATTENDANCE, "STATION_ARRIVAL_USER", "STATION_EXIT_USER",
    "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK", "OPTIONAL1"],
  SHF_EMPLOYEE_DAY: [...stationTables.SHF_EMPLOYEE_DAY, "WM_SITE_ID"],
  SHF_DAY_CHANGES: [...stationTables.SHF_DAY_CHANGES, "NEW_SITE_ID"],
  SHF_SYSTEM_PARAM: nativeTables.SHF_SYSTEM_PARAM,
  SHF_UNIT_PARAM: nativeTables.SHF_UNIT_PARAM,
  SHF_ORG_UNITS_SHF_SITES: ["SS_SITE_ID", "SOU_ORG_UNIT_ID"],
} as const;
export const exitPolicyKeys = ["shf.param.maxToExitBeforEndShift", "shf.param.maximumMinutesExitAfterShift"] as const;
export function exitMetadataDigest(b: Pick<ExitBinding, "operation" | "metadataProvider">, proof: unknown[][]) {
  if (b.operation !== "native-station-exit-v0.1" || proof.length !== 9 || proof.some(r => !Array.isArray(r)))
    stageFail("LIVE_WRITES_DISABLED");
  return fingerprint({ version: "shf-native-exit-metadata-v0.1", provider: selectedMetadataProvider(b),
    owner: "SHIFTER", operation: b.operation, tableScope: Object.keys(exitTables), proof });
}
export async function exitSafety(q: NativeQuery, b: ExitBinding): Promise<NativeSchema> {
  const provider = selectedMetadataProvider(b);
  if (provider === "owner-hybrid-v1" && (b.writeIdentity.user !== "SHIFTER" || b.writeIdentity.schema !== "SHIFTER"))
    stageFail("LIVE_WRITES_DISABLED");
  await nativeIdentity(q, b.writeIdentity);
  const proof: unknown[][] = [];
  for (const [i, sql] of nativeMetadataQueries(Object.keys(exitTables), provider).entries()) {
    // Retained DBA_TRIGGERS/DBA_ROLE_PRIVS are mandatory. ORA-00942 is not
    // absence and never enables a fallback/certificate bypass.
    const r = await q(`/* exit:metadata:${i} */ ${sql}`, i === 7 ? { writeUser: b.writeIdentity.user } : {}, 1001);
    if (r.length > 1000 || r.some(v => !record(v))) stageFail("LIVE_WRITES_DISABLED");
    proof.push(r);
  }
  if (exitMetadataDigest(b, proof) !== b.exitMetadataDigest || !proof[1].length ||
      proof[1].some(r => !record(r) || r.status !== "ENABLED" || r.validated !== "VALIDATED") ||
      proof[3].some(r => !record(r) || r.status !== "DISABLED") ||
      proof[4].some(r => !record(r) || r.enabled !== "NO")) stageFail("LIVE_WRITES_DISABLED");
  const schema: NativeSchema = {};
  for (const [table, required] of Object.entries(exitTables)) {
    const columns: NativeColumn[] = [];
    for (const r of proof[0]) {
      if (!record(r) || r.tableName !== table) continue;
      if (typeof r.columnName !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(r.columnName) ||
          typeof r.dataType !== "string") stageFail("INVALID_SOURCE_DATA");
      if (table !== "SHF_ATTENDANCE" && !required.some(c => c === r.columnName)) continue;
      const kind = r.dataType === "DATE" ? "date" : r.dataType === "NUMBER" ? "number" :
        ["VARCHAR2", "CHAR", "NVARCHAR2", "NCHAR"].includes(r.dataType) ? "text" : null;
      if (!kind || r.virtualColumn !== "NO" || columns.some(c => c.name === r.columnName)) stageFail("LIVE_WRITES_DISABLED");
      if (table === "SHF_ATTENDANCE" && (
        ["STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME", "STATION_EXIT_TIME"].includes(r.columnName) && kind !== "date" ||
        ["SHF_EMPLOYEE_DAY_ID", "TADREECH"].includes(r.columnName) && kind !== "number" ||
        ["STAGE_ARRIVAL_USER", "STATION_ARRIVAL_USER", "STATION_EXIT_USER"].includes(r.columnName) && kind !== "text"))
        stageFail("LIVE_WRITES_DISABLED");
      if (table === "SHF_ATTENDANCE" && r.columnName === "STATION_EXIT_USER" &&
          (r.dataType !== "VARCHAR2" || r.charUsed !== "B" || typeof r.dataLength !== "number" || r.dataLength < 100))
        stageFail("LIVE_WRITES_DISABLED");
      if ((table === "SHF_EMPLOYEES" && r.columnName === "SHF_LOCKED" ||
          ["SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM"].includes(table)) && kind !== "text")
        stageFail("LIVE_WRITES_DISABLED");
      if (["WM_SITE_ID", "NEW_SITE_ID", "SS_SITE_ID"].includes(r.columnName) && kind !== "number" ||
          r.columnName === "SOU_ORG_UNIT_ID" && kind !== "text") stageFail("LIVE_WRITES_DISABLED");
      columns.push({ name: r.columnName, kind });
    }
    if (required.some(name => !columns.some(c => c.name === name))) stageFail("LIVE_WRITES_DISABLED");
    schema[table] = columns;
  }
  const user = b.writeIdentity.user;
  if (user !== "SHIFTER" && !proof[5].some(r => record(r) && r.tableName === "SHF_ATTENDANCE" &&
      r.grantee === user && r.privilege === "UPDATE") &&
      !["STATION_EXIT_TIME", "STATION_EXIT_USER"].every(column => proof[6].some(r => record(r) &&
        r.tableName === "SHF_ATTENDANCE" && r.columnName === column && r.grantee === user && r.privilege === "UPDATE")))
    stageFail("LIVE_WRITES_DISABLED");
  for (const [table, columns] of Object.entries(schema)) {
    if ((await q(`/* exit:privilege:${table} */ SELECT ${columns.map(c => c.name).join(",")}
      FROM SHIFTER.${table} WHERE 1=0`, {}, 1)).length) stageFail("LIVE_WRITES_DISABLED");
  }
  return schema;
}
export interface ExitSnapshot {
  rows: Record<string, NativeRow | null>;
  reports: string;
  exceptions: { current: string; base: string };
  candidates: StationCandidate[];
  planned: { startLocal: string; endLocal: string };
  policy: { maxEarlyWholeMinutes: number; maxAfterEndMinutes: number };
  orgUnitId: string;
  blockers: StationExitBlockerV1[];
}
async function count(q: NativeQuery, tag: string, table: string, where: string, binds: BindParameters) {
  const r = await q(`/* exit:${tag} */ SELECT ${numberText("COUNT(*)")} AS "count"
    FROM SHIFTER.${table} WHERE ${where}`, binds, 1);
  if (r.length !== 1 || !record(r[0]) || typeof r[0].count !== "string" ||
      !/^(0|[1-9][0-9]*)$/.test(r[0].count)) stageFail("INVALID_SOURCE_DATA");
  return r[0].count;
}
function candidate(row: unknown, schema: NativeSchema): StationCandidate {
  if (!record(row) || Object.keys(row).length !== schema.SHF_EMPLOYEE_DAY.length + schema.SHF_DAY_CHANGES.length)
    stageFail("INVALID_SOURCE_DATA");
  const parse = (table: string, alias: string): NativeRow => Object.fromEntries(schema[table].map(c => {
    const v = row[`${alias}_${c.name}`];
    if (v !== null && (typeof v !== "string" || !v.isWellFormed() || Buffer.byteLength(v) > 8192 ||
        c.kind === "date" && !localDateTime(v) ||
        c.kind === "number" && !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(v))) stageFail("INVALID_SOURCE_DATA");
    return [c.name, v];
  }));
  const day = parse("SHF_EMPLOYEE_DAY", "d"), change = parse("SHF_DAY_CHANGES", "c");
  if (change.SHF_EMPLOYEE_DAY_ID === null && Object.values(change).some(v => v !== null)) stageFail("INVALID_SOURCE_DATA");
  return { day, change: change.SHF_EMPLOYEE_DAY_ID === null ? null : change };
}
export async function exitSnapshot(q: NativeQuery, schema: NativeSchema, b: ExitBinding, zone: string,
  signal?: AbortSignal): Promise<ExitSnapshot> {
  const active = () => checkStageBudget(signal); active();
  const e = await one(q, schema, "SHF_EMPLOYEES", "EMPLOYEE_ID=TO_NUMBER(:employeeId)", { employeeId: b.employeeId });
  if (!e || e.EMPLOYEE_ID !== b.employeeId || e.ORG_UNIT_ID !== b.orgUnitId ||
      !/^[0-9]{9}$/.test(e.EMP_ID_NUMBER ?? "") || ![e.FIRST_NAME, e.LAST_NAME].includes(nativeMarker))
    stageFail("SHIFT_DAY_NOT_FOUND");
  const prefix = e.EMP_ID_NUMBER!.slice(0, 8);
  for (const [tag, predicate, binds] of [
    ["marker", "(FIRST_NAME=:marker OR LAST_NAME=:marker)", { marker: nativeMarker }],
    ["prefix", "SUBSTR(EMP_ID_NUMBER,1,8)=:prefix", { prefix }],
  ] as const) {
    const r = await q(`/* exit:${tag} */ SELECT ${numberText("EMPLOYEE_ID")} AS "employeeId"
      FROM SHIFTER.SHF_EMPLOYEES WHERE ${predicate} AND ROWNUM<=2`, binds, 2);
    if (r.length !== 1 || !record(r[0]) || r[0].employeeId !== b.employeeId) stageFail("INVALID_SOURCE_DATA");
  }
  const d = await one(q, schema, "SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId });
  const c = await one(q, schema, "SHF_DAY_CHANGES", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  const a = await one(q, schema, "SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  if (!d || d.SHF_EMPLOYEE_DAY_ID !== b.shiftDayId || (c?.NEW_EMPLOYEE_ID ?? d.EMP_ID_NUMBER) !== prefix ||
      d.SOURCE !== "SYNTHETIC_DAYS") stageFail("SHIFT_DAY_NOT_FOUND");
  const team = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: b.orgUnitId }, true);
  if (!team || team.UNIT_TYPE_ID !== "J01" || !team.PARENT_UNIT) stageFail("INVALID_SOURCE_DATA");
  const parent = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: team.PARENT_UNIT }, true);
  if (!parent || parent.UNIT_TYPE_ID !== "G01") stageFail("INVALID_SOURCE_DATA");
  const site = c?.NEW_SITE_ID ?? d.WM_SITE_ID;
  if (typeof site !== "string" || !site.trim()) stageFail("INVALID_SOURCE_DATA");
  const mapping = await one(q, schema, "SHF_ORG_UNITS_SHF_SITES", "SS_SITE_ID=:site", { site }, true);
  if (!mapping || mapping.SOU_ORG_UNIT_ID !== parent.ORG_UNIT_ID) stageFail("INVALID_SOURCE_DATA");
  const policyRows: Record<string, NativeRow | null> = {};
  const values: number[] = [];
  for (const [i, key] of exitPolicyKeys.entries()) {
    const system = await one(q, schema, "SHF_SYSTEM_PARAM", "PARAM_KEY=:policyKey", { policyKey: key }, true);
    const unit = await one(q, schema, "SHF_UNIT_PARAM", "PARAM_KEY=:policyKey AND ORG_UNIT_ID=:unit",
      { policyKey: key, unit: parent.ORG_UNIT_ID }, true);
    if (!system || system.PARAM_KEY !== key || unit && (unit.PARAM_KEY !== key || unit.ORG_UNIT_ID !== parent.ORG_UNIT_ID))
      stageFail("INVALID_SOURCE_DATA");
    policyRows[`system${i}`] = system; policyRows[`unit${i}`] = unit;
    values.push(exitPolicy(system, unit));
  }
  const start = c?.NEW_SHIFT_START ?? d.WM_SHIFT_START_DATETIME, end = c?.NEW_SHIFT_END ?? d.WM_SHIFT_END_DATETIME;
  if (!localDateTime(start) || !localDateTime(end) || end < start) stageFail("INVALID_SOURCE_DATA");
  const planned = { startLocal: start, endLocal: end };
  for (const k of ["STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME", "STATION_EXIT_TIME"])
    if (a?.[k] != null) instantFor(a[k], zone);
  const reports = await count(q, "reports", "SHF_EMPLOYEE_REPORTS",
    "EMPLOYEE_ID=TO_NUMBER(:employeeId) AND APPROVED_TIME IS NULL", { employeeId: b.employeeId });
  const exceptions = {
    current: await count(q, "exceptions", "SHF_EMPLOYEE_EXCEPTIONS", "AGENT_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }),
    base: await count(q, "exceptions-base", "SHF_EMPLOYEE_EXCEPTIONS_BASE", "AGENT_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }),
  };
  const raw = await q(`/* exit:candidates */ SELECT * FROM (${stationCandidateSql(schema)}
    ORDER BY d.SHF_EMPLOYEE_DAY_ID,c.SHF_EMPLOYEE_DAY_ID) WHERE ROWNUM<=1001`, { prefix }, 1001);
  const candidates = raw.map(r => candidate(r, schema));
  const overlap = stationOverlap(candidates, b.shiftDayId, planned, zone, prefix, active);
  const selected = candidates.find(v => v.day.SHF_EMPLOYEE_DAY_ID === b.shiftDayId);
  if (!selected || fingerprint(selected) !== fingerprint({ day: d, change: c })) stageFail("INVALID_SOURCE_DATA");
  const rows = { SHF_EMPLOYEES: e, SHF_EMPLOYEE_DAY: d, SHF_DAY_CHANGES: c, SHF_ATTENDANCE: a,
    team, parent, mapping, ...policyRows };
  active();
  return { rows, reports, exceptions, candidates, planned, orgUnitId: b.orgUnitId,
    policy: { maxEarlyWholeMinutes: values[0], maxAfterEndMinutes: values[1] },
    blockers: exitBlockers(rows, reports, exceptions, overlap) };
}
export function exitUpdate(schema: NativeSchema, before: ExitSnapshot, b: ExitBinding, local: string, actor: string) {
  if (!localDateTime(local) || actor !== "synthetic:administrator" || Buffer.byteLength(actor) > 100 ||
      !decimalId(b.employeeId)) stageFail("INVALID_SOURCE_DATA");
  const binds: Record<string, string | number | null> = { dayId: b.shiftDayId, employeeId: b.employeeId,
    orgUnitId: b.orgUnitId, prefix: before.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER!.slice(0, 8),
    site: before.rows.mapping!.SS_SITE_ID, parentUnit: before.rows.parent!.ORG_UNIT_ID, newExitLocal: local, actor };
  let n = 0;
  const original = (table: string, row: NativeRow, alias: string) => schema[table].map(c => {
    if (!Object.hasOwn(row, c.name)) stageFail("INVALID_SOURCE_DATA");
    const key = `old${n++}`; binds[key] = row[c.name];
    const bind = c.kind === "date" ? `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')` :
      c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
    return `((${alias}.${c.name}=${bind}) OR (${alias}.${c.name} IS NULL AND :${key} IS NULL))`;
  }).join(" AND ");
  const a = before.rows.SHF_ATTENDANCE;
  if (!a || before.blockers.length || !a.STATION_ARRIVAL_TIME || !a.STATION_ARRIVAL_USER) stageFail("COMMAND_SCOPE_DEFERRED");
  const where = [original("SHF_ATTENDANCE", a, "a")];
  const relations = [
    ["SHF_EMPLOYEES", "SHF_EMPLOYEES", "e", "e.EMPLOYEE_ID=TO_NUMBER(:employeeId)"],
    ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY", "d", "d.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["SHF_DAY_CHANGES", "SHF_DAY_CHANGES", "c", "c.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["team", "SHF_ORG_UNIT", "t", "t.ORG_UNIT_ID=:orgUnitId"],
    ["parent", "SHF_ORG_UNIT", "p", "p.ORG_UNIT_ID=:parentUnit"],
    ["mapping", "SHF_ORG_UNITS_SHF_SITES", "m", "m.SS_SITE_ID=:site"],
  ];
  for (const [i, key] of exitPolicyKeys.entries()) {
    binds[`policy${i}`] = key;
    relations.push([`system${i}`, "SHF_SYSTEM_PARAM", "s", `s.PARAM_KEY=:policy${i}`],
      [`unit${i}`, "SHF_UNIT_PARAM", "u", `u.PARAM_KEY=:policy${i} AND u.ORG_UNIT_ID=:parentUnit`]);
  }
  for (const [key, table, alias, relation] of relations) {
    const r = before.rows[key];
    where.push(r ? `(SELECT COUNT(*) FROM SHIFTER.${table} ${alias} WHERE ${relation})=1 AND
      EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation} AND ${original(table, r, alias)})` :
      `NOT EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation})`);
  }
  binds.marker = nativeMarker;
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE SUBSTR(e.EMP_ID_NUMBER,1,8)=:prefix)=1`,
    `(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE e.FIRST_NAME=:marker OR e.LAST_NAME=:marker)=1`);
  for (const table of ["SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"])
    where.push(`NOT EXISTS (SELECT 1 FROM SHIFTER.${table} x WHERE x.AGENT_DAY_ID=TO_NUMBER(:dayId))`);
  where.push(`NOT EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_REPORTS r
    WHERE r.EMPLOYEE_ID=TO_NUMBER(:employeeId) AND r.APPROVED_TIME IS NULL)`);
  binds.candidateCount = before.candidates.length;
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
    ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID WHERE ${stationCandidateScope})=:candidateCount`);
  for (const v of before.candidates) {
    const day = original("SHF_EMPLOYEE_DAY", v.day, "d");
    const change = v.change ? original("SHF_DAY_CHANGES", v.change, "c") : "c.SHF_EMPLOYEE_DAY_ID IS NULL";
    where.push(`EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
      ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID WHERE ${stationCandidateScope} AND ${day} AND ${change})`);
  }
  return { sql: `/* exit:update */ UPDATE SHIFTER.SHF_ATTENDANCE a SET
    STATION_EXIT_TIME=TO_DATE(:newExitLocal,'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH'),
    STATION_EXIT_USER=:actor WHERE a.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)
    AND a.STATION_EXIT_TIME IS NULL AND a.STATION_EXIT_USER IS NULL
    AND a.STATION_ARRIVAL_TIME IS NOT NULL AND a.STATION_ARRIVAL_USER IS NOT NULL AND ${where.join(" AND ")}`, binds };
}
