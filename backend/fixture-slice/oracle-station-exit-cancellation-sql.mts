import type { NativeSchema, NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeCancellationSnapshot } from "./oracle-station-exit-cancellation-snapshot.mts";
import { cancellationDependencies } from "./oracle-station-exit-cancellation-snapshot.mts";
import { stationCandidateScope } from "./oracle-station-arrival-snapshot.mts";
import { exitPolicyKeys } from "./oracle-station-exit-snapshot.mts";
import { nativeMarker } from "./native-stage-arrival-config.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { exact } from "./stage-arrival-validation.mts";

// Dedicated two-NULL plan. Never calls/relabels an old writer builder.
export function cancellationUpdate(schema: NativeSchema, f: NativeCancellationSnapshot) {
  const a = f.rows.SHF_ATTENDANCE;
  if (!a?.STATION_EXIT_TIME || !a.STATION_EXIT_USER || !a.STATION_ARRIVAL_TIME || !a.STATION_ARRIVAL_USER ||
      !exact(f.dependencies.completeEvidence.dependencies, cancellationDependencies)) stageFail("COMMAND_SCOPE_DEFERRED");
  const binds: Record<string, string | number | null> = { dayId: f.shiftDayId, employeeId: f.employeeId,
    orgUnitId: f.orgUnitId, prefix: f.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER!.slice(0, 8), marker: nativeMarker,
    site: f.rows.mapping!.SS_SITE_ID, parentUnit: f.rows.parent!.ORG_UNIT_ID };
  let index = 0;
  const originals = (table: string, row: NativeRow, alias: string) => {
    if (!exact(row, schema[table].map(c => c.name))) stageFail("INVALID_SOURCE_DATA");
    return schema[table].map(c => {
      const key = `old${index++}`; binds[key] = row[c.name];
      const value = c.kind === "date" ? `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')` :
        c.kind === "number" ? `TO_NUMBER(:${key})` : `:${key}`;
      return `(${alias}.${c.name}=${value} OR (${alias}.${c.name} IS NULL AND :${key} IS NULL))`;
    }).join(" AND ");
  };
  const where = [originals("SHF_ATTENDANCE", a, "a")];
  const relations = [
    ["SHF_EMPLOYEES", "SHF_EMPLOYEES", "e.EMPLOYEE_ID=TO_NUMBER(:employeeId)"],
    ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY", "e.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)"],
    ["SHF_DAY_CHANGES", "SHF_DAY_CHANGES", "e.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)"],
    ["team", "SHF_ORG_UNIT", "e.ORG_UNIT_ID=:orgUnitId"],
    ["parent", "SHF_ORG_UNIT", "e.ORG_UNIT_ID=:parentUnit"],
    ["mapping", "SHF_ORG_UNITS_SHF_SITES", "e.SS_SITE_ID=:site"],
  ];
  for (const [i, key] of exitPolicyKeys.entries()) {
    binds[`policy${i}`] = key;
    relations.push([`system${i}`, "SHF_SYSTEM_PARAM", `e.PARAM_KEY=:policy${i}`],
      [`unit${i}`, "SHF_UNIT_PARAM", `e.PARAM_KEY=:policy${i} AND e.ORG_UNIT_ID=:parentUnit`]);
  }
  for (const [key, table, relation] of relations) {
    const row = f.rows[key];
    where.push(row ? `(SELECT COUNT(*) FROM SHIFTER.${table} e WHERE ${relation})=1 AND
      EXISTS (SELECT 1 FROM SHIFTER.${table} e WHERE ${relation} AND ${originals(table, row, "e")})` :
      `NOT EXISTS (SELECT 1 FROM SHIFTER.${table} e WHERE ${relation})`);
  }
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE SUBSTR(e.EMP_ID_NUMBER,1,8)=:prefix)=1`,
    `(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEES e WHERE e.FIRST_NAME=:marker OR e.LAST_NAME=:marker)=1`);
  for (const table of cancellationDependencies) {
    const rows = f.dependencies.completeEvidence.dependencies[table];
    const relation = table === "SHF_EMPLOYEE_REPORTS" ? "e.EMPLOYEE_ID=TO_NUMBER(:employeeId)" : "e.AGENT_DAY_ID=TO_NUMBER(:dayId)";
    const key = `count${index++}`; binds[key] = rows.length;
    where.push(`(SELECT COUNT(*) FROM SHIFTER.${table} e WHERE ${relation})=:${key}`);
    for (const row of rows) where.push(`EXISTS (SELECT 1 FROM SHIFTER.${table} e WHERE ${relation} AND ${originals(table, row, "e")})`);
  }
  const candidates = f.dependencies.completeEvidence.candidates;
  binds.candidateCount = candidates.length;
  where.push(`(SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_DAY d LEFT JOIN SHIFTER.SHF_DAY_CHANGES c
    ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID WHERE ${stationCandidateScope})=:candidateCount`);
  for (const candidate of candidates) where.push(`EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_DAY d
    LEFT JOIN SHIFTER.SHF_DAY_CHANGES c ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID
    WHERE ${stationCandidateScope} AND ${originals("SHF_EMPLOYEE_DAY", candidate.day, "d")} AND
    ${candidate.change ? originals("SHF_DAY_CHANGES", candidate.change, "c") : "c.SHF_EMPLOYEE_DAY_ID IS NULL"})`);
  return { sql: `/* cancellation:update */ UPDATE SHIFTER.SHF_ATTENDANCE a SET
    STATION_EXIT_TIME=NULL,STATION_EXIT_USER=NULL WHERE a.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId)
    AND a.STATION_EXIT_TIME IS NOT NULL AND a.STATION_EXIT_USER IS NOT NULL
    AND a.STATION_ARRIVAL_TIME IS NOT NULL AND a.STATION_ARRIVAL_USER IS NOT NULL AND ${where.join(" AND ")}`, binds };
}
