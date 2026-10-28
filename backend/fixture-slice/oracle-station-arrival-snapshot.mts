import type { BindParameters } from "oracledb";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { numberText } from "./oracle-readers.mts";
import { fingerprint, instantFor } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { nativeMarker, selectedMetadataProvider } from "./native-stage-arrival-config.mts";
import type { StationBinding } from "./native-station-arrival-config.mts";
import { nativeIdentity, nativeMetadataQueries, nativeMetadataDigest, nativeTables, one, expression } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeQuery, NativeRow, NativeSchema, NativeColumn } from "./oracle-stage-arrival-snapshot.mts";
import { stationBlockers, stationOverlap } from "./oracle-station-arrival-domain.mts";
import type { StationCandidate } from "./oracle-station-arrival-domain.mts";
import type { StationArrivalBlockerV1 } from "./station-arrival-contracts.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";

// Separate F2 certification scope, not the F1 digest or NativeSnapshot.
export const stationTables = {
  SHF_EMPLOYEES: [...nativeTables.SHF_EMPLOYEES, "SHF_LOCKED"],
  SHF_EMPLOYEE_DAY: nativeTables.SHF_EMPLOYEE_DAY,
  SHF_DAY_CHANGES: nativeTables.SHF_DAY_CHANGES,
  // Physical addLate columns are LATE_*; STAGE_LATE_* belongs to addStageLate.
  SHF_ATTENDANCE: [...nativeTables.SHF_ATTENDANCE, "STATION_ARRIVAL_USER", "STATION_EXIT_USER",
    "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK", "OPTIONAL1"],
  SHF_ORG_UNIT: nativeTables.SHF_ORG_UNIT,
  SHF_EMPLOYEE_REPORTS: nativeTables.SHF_EMPLOYEE_REPORTS,
  SHF_EMPLOYEE_EXCEPTIONS: ["AGENT_DAY_ID"],
  SHF_EMPLOYEE_EXCEPTIONS_BASE: ["AGENT_DAY_ID"],
} as const;
export const stationMetadataSql = nativeMetadataQueries(Object.keys(stationTables));
export async function stationSafety(q: NativeQuery, b: StationBinding): Promise<NativeSchema> {
  const provider = selectedMetadataProvider(b);
  if (provider === "owner-hybrid-v1" && (b.writeIdentity.user !== "SHIFTER" || b.writeIdentity.schema !== "SHIFTER"))
    stageFail("LIVE_WRITES_DISABLED");
  await nativeIdentity(q, b.writeIdentity);
  const proof: unknown[][] = [];
  for (const [i, sql] of nativeMetadataQueries(Object.keys(stationTables), provider).entries()) {
    const r = await q(`/* station:metadata:${i} */ ${sql}`, i === 7 ? { writeUser: b.writeIdentity.user } : {}, 1001);
    if (r.length > 1000 || r.some(v => !record(v))) stageFail("LIVE_WRITES_DISABLED");
    proof.push(r);
  }
  if (nativeMetadataDigest(provider, b.operation, Object.keys(stationTables), proof) !== b.stationMetadataDigest || !proof[1].length ||
      proof[1].some(r => !record(r) || r.status !== "ENABLED" || r.validated !== "VALIDATED") ||
      proof[3].some(r => !record(r) || r.status !== "DISABLED") ||
      proof[4].some(r => !record(r) || r.enabled !== "NO")) stageFail("LIVE_WRITES_DISABLED");
  const schema: NativeSchema = {};
  for (const [table, required] of Object.entries(stationTables)) {
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
      if (table === "SHF_EMPLOYEES" && r.columnName === "SHF_LOCKED" && kind !== "text")
        stageFail("LIVE_WRITES_DISABLED");
      if (table === "SHF_ATTENDANCE" && (
        ["STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME", "STATION_EXIT_TIME"].includes(r.columnName) && kind !== "date" ||
        ["SHF_EMPLOYEE_DAY_ID", "TADREECH", "LATE_REASON_ID", "LATE_MINUTES"].includes(r.columnName) && kind !== "number" ||
        ["STATION_ARRIVAL_USER", "STAGE_ARRIVAL_USER", "STATION_EXIT_USER", "LATE_REMARK"].includes(r.columnName) && kind !== "text"))
        stageFail("LIVE_WRITES_DISABLED");
      if (table === "SHF_ATTENDANCE" && r.columnName === "STATION_ARRIVAL_USER" &&
          (r.dataType !== "VARCHAR2" || r.charUsed !== "B" || typeof r.dataLength !== "number" || r.dataLength < 100))
        stageFail("LIVE_WRITES_DISABLED");
      columns.push({ name: r.columnName, kind });
    }
    if (required.some(name => !columns.some(c => c.name === name))) stageFail("LIVE_WRITES_DISABLED");
    schema[table] = columns;
  }
  const user = b.writeIdentity.user;
  if (user !== "SHIFTER" && !proof[5].some(r => record(r) && r.tableName === "SHF_ATTENDANCE" &&
      r.grantee === user && r.privilege === "UPDATE") &&
      !["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER"].every(column =>
        proof[6].some(r => record(r) && r.tableName === "SHF_ATTENDANCE" && r.columnName === column &&
          r.grantee === user && r.privilege === "UPDATE"))) stageFail("LIVE_WRITES_DISABLED");
  for (const [table, columns] of Object.entries(schema)) {
    const r = await q(`/* station:privilege:${table} */ SELECT ${columns.map(c => c.name).join(",")}
      FROM SHIFTER.${table} WHERE 1=0`, {}, 1);
    if (r.length) stageFail("LIVE_WRITES_DISABLED");
  }
  return schema;
}
export interface StationSnapshot {
  rows: Record<string, NativeRow | null>;
  reports: string;
  exceptions: { current: string; base: string };
  candidates: StationCandidate[];
  planned: { startLocal: string; endLocal: string };
  orgUnitId: string;
  blockers: StationArrivalBlockerV1[];
}
// Discover a conservative UNION of baseline ownership and ANY changed-owner
// membership BEFORE classifying the joined rows. Filtering the joined c row
// by COALESCE first would hide duplicate overlays moved to another employee.
export const stationCandidateScope = `(d.EMP_ID_NUMBER=:prefix OR EXISTS
  (SELECT 1 FROM SHIFTER.SHF_DAY_CHANGES candidate_owner
   WHERE candidate_owner.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID AND candidate_owner.NEW_EMPLOYEE_ID=:prefix))`;
async function count(q: NativeQuery, tag: string, table: string, where: string, binds: BindParameters) {
  const r = await q(`/* station:${tag} */ SELECT ${numberText("COUNT(*)")} AS "count"
    FROM SHIFTER.${table} WHERE ${where}`, binds, 1);
  if (r.length !== 1 || !record(r[0]) || typeof r[0].count !== "string" ||
      !/^(0|[1-9][0-9]*)$/.test(r[0].count)) stageFail("INVALID_SOURCE_DATA");
  return r[0].count;
}
export function stationCandidateSql(schema: NativeSchema) {
  return `SELECT ${[["SHF_EMPLOYEE_DAY", "d"], ["SHF_DAY_CHANGES", "c"]].flatMap(([table, alias]) =>
    schema[table].map(col => `${expression(col, alias + ".")} AS "${alias}_${col.name}"`)).join(",")}
    FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
    ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID
    WHERE ${stationCandidateScope}`;
}
function parseCandidate(row: unknown, schema: NativeSchema): StationCandidate {
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
export async function stationSnapshot(q: NativeQuery, schema: NativeSchema, b: StationBinding, zone: string,
  signal?: AbortSignal): Promise<StationSnapshot> {
  const deadline = performance.now() + 5000;
  const assertActive = () => {
    checkStageBudget(signal);
    if (performance.now() >= deadline) stageFail("DEPENDENCY_TIMEOUT");
  };
  assertActive();
  const e = await one(q, schema, "SHF_EMPLOYEES", "EMPLOYEE_ID=TO_NUMBER(:employeeId)", { employeeId: b.employeeId });
  if (!e || e.EMPLOYEE_ID !== b.employeeId || e.ORG_UNIT_ID !== b.orgUnitId ||
      e.FIRST_NAME !== nativeMarker && e.LAST_NAME !== nativeMarker ||
      !/^[0-9]{8,}$/.test(e.EMP_ID_NUMBER ?? "")) stageFail("SHIFT_DAY_NOT_FOUND");
  const prefix = e.EMP_ID_NUMBER!.slice(0, 8);
  for (const [tag, predicate, binds] of [
    ["marker", "(FIRST_NAME=:marker OR LAST_NAME=:marker)", { marker: nativeMarker }],
    ["prefix", "SUBSTR(EMP_ID_NUMBER,1,8)=:prefix", { prefix }],
  ] as const) {
    const r = await q(`/* station:${tag} */ SELECT ${numberText("EMPLOYEE_ID")} AS "employeeId"
      FROM SHIFTER.SHF_EMPLOYEES WHERE ${predicate} AND ROWNUM<=2`, binds, 2);
    if (r.length !== 1 || !record(r[0]) || r[0].employeeId !== b.employeeId) stageFail("INVALID_SOURCE_DATA");
  }
  const d = await one(q, schema, "SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId });
  const c = await one(q, schema, "SHF_DAY_CHANGES", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  const a = await one(q, schema, "SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }, true);
  if (!d || d.SHF_EMPLOYEE_DAY_ID !== b.shiftDayId || (c?.NEW_EMPLOYEE_ID ?? d.EMP_ID_NUMBER) !== prefix ||
      d.SOURCE !== "SYNTHETIC_DAYS") stageFail("SHIFT_DAY_NOT_FOUND");
  const team = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: b.orgUnitId });
  if (!team || team.UNIT_TYPE_ID !== "J01" || !team.PARENT_UNIT) stageFail("INVALID_SOURCE_DATA");
  const parent = await one(q, schema, "SHF_ORG_UNIT", "ORG_UNIT_ID=:unit", { unit: team.PARENT_UNIT });
  if (!parent || parent.UNIT_TYPE_ID !== "G01") stageFail("INVALID_SOURCE_DATA");
  const start = c?.NEW_SHIFT_START ?? d.WM_SHIFT_START_DATETIME, end = c?.NEW_SHIFT_END ?? d.WM_SHIFT_END_DATETIME;
  if (!localDateTime(start) || !localDateTime(end) || end < start) stageFail("INVALID_SOURCE_DATA");
  const planned = { startLocal: start, endLocal: end };
  for (const column of ["STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME"]) {
    const stored = a?.[column];
    if (stored != null) instantFor(stored, zone);
  }
  const reports = await count(q, "reports", "SHF_EMPLOYEE_REPORTS",
    "EMPLOYEE_ID=TO_NUMBER(:employeeId) AND APPROVED_TIME IS NULL", { employeeId: b.employeeId });
  const exceptions = {
    current: await count(q, "exceptions", "SHF_EMPLOYEE_EXCEPTIONS", "AGENT_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }),
    base: await count(q, "exceptions-base", "SHF_EMPLOYEE_EXCEPTIONS_BASE", "AGENT_DAY_ID=TO_NUMBER(:dayId)", { dayId: b.shiftDayId }),
  };
  const candidateRows = await q(`/* station:candidates */ SELECT * FROM (${stationCandidateSql(schema)}
    ORDER BY d.SHF_EMPLOYEE_DAY_ID,c.SHF_EMPLOYEE_DAY_ID) WHERE ROWNUM<=1001`, { prefix }, 1001);
  const candidates = candidateRows.map(r => parseCandidate(r, schema));
  const overlap = stationOverlap(candidates, b.shiftDayId, planned, zone, prefix, assertActive);
  const selected = candidates.find(v => v.day.SHF_EMPLOYEE_DAY_ID === b.shiftDayId);
  if (!selected || fingerprint(selected) !== fingerprint({ day: d, change: c })) stageFail("INVALID_SOURCE_DATA");
  const rows = { SHF_EMPLOYEES: e, SHF_EMPLOYEE_DAY: d, SHF_DAY_CHANGES: c, SHF_ATTENDANCE: a, team, parent };
  return { rows, reports, exceptions, candidates, planned, orgUnitId: b.orgUnitId,
    blockers: stationBlockers(rows, reports, exceptions, overlap) };
}
// Every projected original has its own typed, independently bound null-safe
// equality. Hashes bind preparations only; Oracle never compares a fake hash.
export function stationUpdate(schema: NativeSchema, before: StationSnapshot, b: StationBinding, local: string, actor: string) {
  if (!localDateTime(local) || Buffer.byteLength(actor) > 100 || !decimalId(b.employeeId)) stageFail("INVALID_SOURCE_DATA");
  const binds: Record<string, string | number | null> = { dayId: b.shiftDayId, employeeId: b.employeeId,
    orgUnitId: b.orgUnitId, prefix: before.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER!.slice(0, 8), newStationLocal: local, actor };
  let n = 0;
  const original = (table: string, row: NativeRow, alias: string) => schema[table].map(c => {
    if (!Object.hasOwn(row, c.name)) stageFail("INVALID_SOURCE_DATA");
    const key = `old${n++}`; binds[key] = row[c.name];
    const bind = c.kind === "date" ? `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')` :
      c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
    return `((${alias}.${c.name}=${bind}) OR (${alias}.${c.name} IS NULL AND :${key} IS NULL))`;
  }).join(" AND ");
  const a = before.rows.SHF_ATTENDANCE;
  if (!a || before.blockers.length) stageFail("COMMAND_SCOPE_DEFERRED");
  const where = [original("SHF_ATTENDANCE", a, "a")];
  for (const [key, table, alias, relation] of [
    ["SHF_EMPLOYEES", "SHF_EMPLOYEES", "e", "e.EMPLOYEE_ID=TO_NUMBER(:employeeId)"],
    ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY", "d", "d.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["SHF_DAY_CHANGES", "SHF_DAY_CHANGES", "c", "c.SHF_EMPLOYEE_DAY_ID=a.SHF_EMPLOYEE_DAY_ID"],
    ["team", "SHF_ORG_UNIT", "t", "t.ORG_UNIT_ID=:orgUnitId"],
    ["parent", "SHF_ORG_UNIT", "p", "p.ORG_UNIT_ID=(SELECT t.PARENT_UNIT FROM SHIFTER.SHF_ORG_UNIT t WHERE t.ORG_UNIT_ID=:orgUnitId)"],
  ]) {
    const r = before.rows[key];
    where.push(r ? `(SELECT COUNT(*) FROM SHIFTER.${table} ${alias} WHERE ${relation})=1 AND
      EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation} AND ${original(table, r, alias)})` :
      `NOT EXISTS (SELECT 1 FROM SHIFTER.${table} ${alias} WHERE ${relation})`);
  }
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE SUBSTR(e.EMP_ID_NUMBER,1,8)=:prefix)=1`);
  binds.marker = nativeMarker;
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE e.FIRST_NAME=:marker OR e.LAST_NAME=:marker)=1`);
  for (const table of ["SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"])
    where.push(`NOT EXISTS (SELECT 1 FROM SHIFTER.${table} x WHERE x.AGENT_DAY_ID=TO_NUMBER(:dayId))`);
  where.push(`NOT EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_REPORTS r
    WHERE r.EMPLOYEE_ID=TO_NUMBER(:employeeId) AND r.APPROVED_TIME IS NULL)`);
  binds.candidateCount = before.candidates.length;
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
    ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID WHERE ${stationCandidateScope})=:candidateCount`);
  for (const candidate of before.candidates) {
    const day = original("SHF_EMPLOYEE_DAY", candidate.day, "d");
    const change = candidate.change ? original("SHF_DAY_CHANGES", candidate.change, "c") : "c.SHF_EMPLOYEE_DAY_ID IS NULL";
    where.push(`EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
      ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID WHERE ${stationCandidateScope}
      AND ${day} AND ${change})`);
  }
  return { sql: `/* station:update */ UPDATE SHIFTER.SHF_ATTENDANCE a SET
    STATION_ARRIVAL_TIME=TO_DATE(:newStationLocal,'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH'),
    STATION_ARRIVAL_USER=:actor WHERE a.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)
    AND a.STATION_ARRIVAL_TIME IS NULL AND a.STATION_ARRIVAL_USER IS NULL AND ${where.join(" AND ")}`, binds };
}
