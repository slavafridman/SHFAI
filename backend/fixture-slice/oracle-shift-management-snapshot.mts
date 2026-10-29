// Actual bounded plain-table collector for the physical employee/day/overlay/
// attendance core. Complete policy/catalog/dependency normalization is separate.
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import type { ShiftSelectionV1 } from "./shift-management-contracts.mts";
import type { ShiftOracleCore, ShiftOracleRow, ShiftOracleSchema, ShiftOracleTable } from "./oracle-shift-management-sql.mts";
import { parseShiftOracleRow, shiftOracleProjection, validateShiftOracleSchema } from "./oracle-shift-management-sql.mts";
import { decimalId, localDateTime, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { shiftFail } from "./shift-management-errors.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { pilotEmployeeNumber } from "./native-pilot-identity.mts";

export interface ShiftOracleScope {
  employeeId: string; orgUnitId: string;
  // Operator/configured source window covers planned ranges, original weeks
  // and spacing. It is not inferred from host time or an all-history scan.
  rangeStart: string; rangeEnd: string;
  expectedEmployeeNumber?: string;
}
const dateBind = (key: string) => `TO_DATE(:${key},'YYYY-MM-DD"T"HH24:MI:SS','NLS_DATE_LANGUAGE=ENGLISH')`;
export async function readShiftOracleWindow(query: NativeQuery, schema: ShiftOracleSchema,
  selection: ShiftSelectionV1, scope: ShiftOracleScope, signal?: AbortSignal): Promise<ShiftOracleCore> {
  validateShiftOracleSchema(schema); assertShiftWorkAllowed(signal);
  if (!decimalId(scope.employeeId) || !unitCode(scope.orgUnitId) ||
      selection.employeeId !== scope.employeeId ||
      !(selection.shiftDayId === null || decimalId(selection.shiftDayId, 10)) ||
      !localDateTime(scope.rangeStart) || !localDateTime(scope.rangeEnd) || scope.rangeStart >= scope.rangeEnd)
    shiftFail("LIVE_WRITES_DISABLED");
  const project = (table: ShiftOracleTable, alias: string) =>
    schema[table].map(c => `${shiftOracleProjection(c, alias)} AS "${c.name}"`).join(",");
  const employees = await query(`SELECT /* shf49:employee */ ${project("SHF_EMPLOYEES", "e.")}
    FROM SHIFTER.SHF_EMPLOYEES e WHERE e.EMPLOYEE_ID=TO_NUMBER(:employeeId)
      AND e.ORG_UNIT_ID=:orgUnitId AND ROWNUM<=2`,
  { employeeId: scope.employeeId, orgUnitId: scope.orgUnitId }, 2);
  if (employees.length !== 1) shiftFail(employees.length ? "INVALID_SOURCE_DATA" : "SHIFT_DAY_NOT_FOUND");
  const employee = parseShiftOracleRow(employees[0], schema.SHF_EMPLOYEES);
  if (employee.EMPLOYEE_ID !== scope.employeeId || employee.ORG_UNIT_ID !== scope.orgUnitId ||
      !pilotEmployeeNumber(employee.EMP_ID_NUMBER)) shiftFail("INVALID_SOURCE_DATA");
  if (scope.expectedEmployeeNumber !== undefined && employee.EMP_ID_NUMBER !== scope.expectedEmployeeNumber)
    shiftFail("STALE_PREPARATION");
  const prefix = employee.EMP_ID_NUMBER.slice(0, 8);
  const owners = await query(`SELECT /* shf49:prefix */ TO_CHAR(EMPLOYEE_ID,'TM9',
    'NLS_NUMERIC_CHARACTERS=''.,''') AS "EMPLOYEE_ID" FROM SHIFTER.SHF_EMPLOYEES
    WHERE SUBSTR(EMP_ID_NUMBER,1,8)=:employeeKey AND ROWNUM<=2`, { employeeKey: prefix }, 2);
  const owner = owners[0];
  if (owners.length !== 1 || !record(owner) || Object.keys(owner).length !== 1 ||
      owner.EMPLOYEE_ID !== scope.employeeId)
    shiftFail("INVALID_SOURCE_DATA");
  const binds = { employeeKey: prefix, selectedDay: selection.shiftDayId,
    rangeStart: scope.rangeStart, rangeEnd: scope.rangeEnd };
  // UNION membership avoids a correlated per-day query or an unbounded
  // employee-history OR predicate. Include hidden/moved overlay days and the
  // selected ID. Cancelled sentinel rows are NOT lost in an employee join.
  const candidates = `WITH candidate_ids AS (${shiftOracleCandidateBody()})`;
  const collect = async (table: ShiftOracleTable, label: string) => {
    assertShiftWorkAllowed(signal);
    const rows = await query(`${candidates}
      SELECT /* shf49:${label} */ ${project(table, "r.")} FROM SHIFTER.${table} r
      WHERE r.SHF_EMPLOYEE_DAY_ID IN (SELECT SHF_EMPLOYEE_DAY_ID FROM candidate_ids)
      ORDER BY r.SHF_EMPLOYEE_DAY_ID`, binds, 1001);
    if (rows.length > 1000) shiftFail("DEPENDENCY_UNAVAILABLE");
    const result = rows.map(row => parseShiftOracleRow(row, schema[table])), ids = new Set<string>();
    for (const row of result) {
      const id = row.SHF_EMPLOYEE_DAY_ID;
      if (!decimalId(id, 10) || ids.has(id)) shiftFail("INVALID_SOURCE_DATA");
      ids.add(id);
    }
    return result;
  };
  const days = await collect("SHF_EMPLOYEE_DAY", "days");
  if (selection.shiftDayId !== null && !days.some(row => row.SHF_EMPLOYEE_DAY_ID === selection.shiftDayId))
    shiftFail("SHIFT_DAY_NOT_FOUND");
  const overlays = await collect("SHF_DAY_CHANGES", "overlays");
  const attendance = await collect("SHF_ATTENDANCE", "attendance");
  const ids = new Set(days.map(row => row.SHF_EMPLOYEE_DAY_ID));
  if ([...overlays, ...attendance].some(row => !ids.has(row.SHF_EMPLOYEE_DAY_ID))) shiftFail("INVALID_SOURCE_DATA");
  const prefixEmployees: ShiftOracleRow[] = [{ EMPLOYEE_ID: owner.EMPLOYEE_ID }];
  assertShiftWorkAllowed(signal); return { employee, prefixEmployees, days, overlays, attendance };
}
// One controlling candidate expression for reads AND command membership
// witnesses. Prefixing affects only these four known bind names.
export function shiftOracleCandidateBody(prefix: "" | "w_" = ""): string {
  const body = `SELECT d.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY d
    WHERE d.EMP_ID_NUMBER=:employeeKey AND d.WM_SHIFT_START_DATETIME<${dateBind("rangeEnd")}
      AND d.WM_SHIFT_END_DATETIME>${dateBind("rangeStart")}
    UNION SELECT d.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY d
      JOIN SHIFTER.SHF_DAY_CHANGES c ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID
      WHERE c.NEW_EMPLOYEE_ID=:employeeKey
        AND NVL(c.NEW_SHIFT_START,d.WM_SHIFT_START_DATETIME)<${dateBind("rangeEnd")}
        AND NVL(c.NEW_SHIFT_END,d.WM_SHIFT_END_DATETIME)>${dateBind("rangeStart")}
    UNION SELECT d.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY d
      JOIN SHIFTER.SHF_DAY_CHANGES c ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID
      WHERE d.EMP_ID_NUMBER=:employeeKey
        AND NVL(c.NEW_SHIFT_START,d.WM_SHIFT_START_DATETIME)<${dateBind("rangeEnd")}
        AND NVL(c.NEW_SHIFT_END,d.WM_SHIFT_END_DATETIME)>${dateBind("rangeStart")}
    UNION SELECT d.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY d
      WHERE d.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:selectedDay) AND d.EMP_ID_NUMBER=:employeeKey
    UNION SELECT d.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY d
      JOIN SHIFTER.SHF_DAY_CHANGES c ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID
      WHERE d.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:selectedDay) AND c.NEW_EMPLOYEE_ID=:employeeKey`;
  return body.replace(/:(employeeKey|selectedDay|rangeStart|rangeEnd)\b/g, `:${prefix}$1`);
}
