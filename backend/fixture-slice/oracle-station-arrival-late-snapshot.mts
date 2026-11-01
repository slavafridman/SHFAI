import { stationTables, stationSafety, stationSnapshot, stationPreparedSnapshot, stationUpdate } from "./oracle-station-arrival-snapshot.mts";
import type { StationSnapshot } from "./oracle-station-arrival-snapshot.mts";
import type { LateBinding } from "./native-station-arrival-late-config.mts";
import type { NativeQuery, NativeRow, NativeSchema } from "./oracle-stage-arrival-snapshot.mts";
import { expression } from "./oracle-stage-arrival-snapshot.mts";
import { record } from "./contract-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { lateReasonCatalog, requireLateReason } from "./oracle-station-arrival-late-domain.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { exact } from "./stage-arrival-validation.mts";
import type { StationBinding } from "./native-station-arrival-config.mts";
export const lateTables = { ...stationTables,
  SHF_EMPLOYEE_DAY: [...stationTables.SHF_EMPLOYEE_DAY, "WM_DATE", "WM_START_DATETIME", "WM_END_DATETIME",
    "WM_PAID_MINUTES", "WM_WORK_MINUTES"],
  SHF_DAY_CHANGES: [...stationTables.SHF_DAY_CHANGES, "NEW_DAY_START", "NEW_DAY_END", "NEW_PAID_MINUTES", "NEW_WORK_MINUTES"],
  SHF_EVENT_REASON: ["REASON_ID", "BRANCH_ID", "REASON_DESC", "REPORTED", "REPORT_REQUESTED", "SER_TYPE"] } as const;
export interface LateSnapshot extends StationSnapshot { reasons: NativeRow[]; dependencies: Record<string, NativeRow[]> }
export const lateDependencyTables = ["SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"] as const;
// The common inquiry/update builders contain no operation authority. Their old
// queries and old digest outputs remain unchanged; dedicated certificate above
// covers the additional catalog and all five UPDATE privileges.
function inquiryBinding(b: LateBinding): StationBinding {
  const { operation: _op, lateMetadataDigest, ...common } = b;
  return { ...common, operation: "native-station-arrival-v0.1", stationMetadataDigest: lateMetadataDigest };
}
export async function lateSafety(q: NativeQuery, b: LateBinding) {
  const { lateMetadataDigest, ...common } = b;
  const schema = await stationSafety(q, { ...common, stationMetadataDigest: lateMetadataDigest }, lateTables,
    ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"], true);
  for (const c of schema.SHF_EVENT_REASON) {
    if (c.name !== "BRANCH_ID" && c.kind !== (c.name === "REASON_DESC" ? "text" : "number")) stageFail("LIVE_WRITES_DISABLED");
  }
  for (const [table, names] of [
    ["SHF_EMPLOYEE_DAY", ["WM_DATE", "WM_START_DATETIME", "WM_END_DATETIME", "WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME"]],
    ["SHF_DAY_CHANGES", ["NEW_DAY_START", "NEW_DAY_END", "NEW_SHIFT_START", "NEW_SHIFT_END"]],
  ] as const) for (const name of names) if (schema[table].find(c => c.name === name)?.kind !== "date") stageFail("LIVE_WRITES_DISABLED");
  return schema;
}
export async function lateSnapshot(q: NativeQuery, schema: NativeSchema, b: LateBinding, zone: string,
  signal?: AbortSignal, prepared?: LateSnapshot): Promise<LateSnapshot> {
  const base = prepared ? await stationPreparedSnapshot(q, schema, inquiryBinding(b), zone, prepared, signal) :
    await stationSnapshot(q, schema, inquiryBinding(b), zone, signal);
  checkStageBudget(signal);
  const columns = schema.SHF_EVENT_REASON;
  const raw = await q(`/* station-late:reasons */ SELECT * FROM (SELECT ${columns.map(c =>
    `${expression(c)} AS "${c.name}"`).join(",")} FROM SHIFTER.SHF_EVENT_REASON
    WHERE SER_TYPE=2 ORDER BY REASON_ID) WHERE ROWNUM<=1001`, {}, 1001);
  if (raw.length > 1000) stageFail("INVALID_SOURCE_DATA");
  const reasons = raw.map(r => {
    if (!record(r) || Object.keys(r).length !== columns.length) stageFail("INVALID_SOURCE_DATA");
    const row: NativeRow = {};
    for (const c of columns) {
      const v = r[c.name];
      if (!(v === null || typeof v === "string")) stageFail("INVALID_SOURCE_DATA");
      row[c.name] = v;
    }
    return row;
  });
  lateReasonCatalog(reasons); checkStageBudget(signal);
  const dependencies: Record<string, NativeRow[]> = {};
  for (const [table, column, value] of [
    ["SHF_EMPLOYEE_REPORTS", "EMPLOYEE_ID", b.employeeId],
    ["SHF_EMPLOYEE_EXCEPTIONS", "AGENT_DAY_ID", b.shiftDayId],
    ["SHF_EMPLOYEE_EXCEPTIONS_BASE", "AGENT_DAY_ID", b.shiftDayId],
  ]) {
    const cols = schema[table];
    const result = await q(`/* station-late:dependency:${table} */ SELECT ${cols.map(c =>
      `${expression(c)} AS "${c.name}"`).join(",")} FROM SHIFTER.${table}
      WHERE ${column}=TO_NUMBER(:key) AND ROWNUM<=1001`, { key: value }, 1001);
    if (result.length > 1000) stageFail("INVALID_SOURCE_DATA");
    dependencies[table] = result.map(row => {
      if (!record(row) || Object.keys(row).length !== cols.length) stageFail("INVALID_SOURCE_DATA");
      return Object.fromEntries(cols.map(c => {
        const v = row[c.name];
        if (!(v === null || typeof v === "string")) stageFail("INVALID_SOURCE_DATA");
        return [c.name, v];
      }));
    });
  }
  checkStageBudget(signal);
  return { ...base, reasons, dependencies };
}
export function lateUpdate(schema: NativeSchema, before: LateSnapshot, b: LateBinding,
  next: { local: string; actor: string; reasonCode: string; minutes: number }) {
  if (!exact(before.dependencies, lateDependencyTables)) stageFail("INVALID_SOURCE_DATA");
  requireLateReason(before.reasons, next.reasonCode);
  if (!Number.isSafeInteger(next.minutes) || next.minutes < 0 || next.minutes > 9999999999 ||
      next.actor !== "synthetic:administrator") stageFail("INVALID_SOURCE_DATA");
  const base = stationUpdate(schema, before, inquiryBinding(b), next.local, next.actor);
  const binds: Record<string, string | number | null> = { ...base.binds, lateReason: next.reasonCode,
    lateMinutes: next.minutes, lateRemark: null, reasonCount: before.reasons.length };
  const predicates: string[] = [
    `(SELECT COUNT(*) FROM SHIFTER.SHF_EVENT_REASON WHERE SER_TYPE=2)=:reasonCount`,
  ];
  for (const [i, reason] of before.reasons.entries()) {
    predicates.push(`EXISTS (SELECT 1 FROM SHIFTER.SHF_EVENT_REASON r WHERE ${schema.SHF_EVENT_REASON.map(c => {
      const key = `reason${i}_${c.name}`; binds[key] = reason[c.name];
      const value = c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
      return `(r.${c.name}=${value} OR (r.${c.name} IS NULL AND :${key} IS NULL))`;
    }).join(" AND ")})`);
  }
  let dependencyBind = 0;
  for (const table of lateDependencyTables) {
    const rows = before.dependencies[table]!;
    const relation = table === "SHF_EMPLOYEE_REPORTS" ? "r.EMPLOYEE_ID=TO_NUMBER(:employeeId)" : "r.AGENT_DAY_ID=TO_NUMBER(:dayId)";
    const countKey = `dep${dependencyBind++}`; binds[countKey] = rows.length;
    predicates.push(`(SELECT COUNT(*) FROM SHIFTER.${table} r WHERE ${relation})=:${countKey}`);
    for (const row of rows) {
      predicates.push(`EXISTS (SELECT 1 FROM SHIFTER.${table} r WHERE ${relation} AND ${schema[table].map(c => {
        const key = `dep${dependencyBind++}`; binds[key] = row[c.name];
        const value = c.kind === "date" ? `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')` :
          c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
        return `(r.${c.name}=${value} OR (r.${c.name} IS NULL AND :${key} IS NULL))`;
      }).join(" AND ")})`);
    }
  }
  return { sql: base.sql.replace("/* station:update */", "/* station-late:update */")
    .replace("STATION_ARRIVAL_USER=:actor WHERE", `STATION_ARRIVAL_USER=:actor,
      LATE_REASON_ID=TO_NUMBER(:lateReason), LATE_MINUTES=TO_NUMBER(:lateMinutes), LATE_REMARK=:lateRemark WHERE`) +
      ` AND ${predicates.join(" AND ")}`, binds };
}
