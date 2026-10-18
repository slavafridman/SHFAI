import type { MyShiftsContextRequestV1, MyShiftsRequestV1, MyShiftsProblemV1,
  MyShiftRowV1 } from "./my-shifts-contracts.mts";
import type { CurrentShiftRowV1 } from "./current-shifts-contracts.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { catalogValue, localDate, mokedOption, plainLabel, unitCode } from "./current-shifts-validation.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";

export function invalidMyShifts(
  name: NonNullable<MyShiftsProblemV1["invalidParameters"]>[number]["name"],
  reason: "required" | "invalid-format" | "unsupported" = "invalid-format",
): never { throw new MyShiftsError("INVALID_REQUEST", [{ name, reason }]); }
export function scheduleSourceFailure(): never { throw new MyShiftsError("INVALID_SOURCE_DATA"); }
const daysInMonth = (y: number, m: number) =>
  [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
// Civil arithmetic only; never interpret a calendar label as UTC or a duration.
export function nextCivilDate(date: string): string {
  if (!localDate(date)) scheduleSourceFailure();
  if (date === "9999-12-31") return date;
  let [y, m, d] = date.split("-").map(Number);
  if (++d > daysInMonth(y, m)) { d = 1; if (++m > 12) { m = 1; y++; } }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function addCivilDates(date: string, count: number): string {
  for (let i = 0; i < count; i++) date = nextCivilDate(date);
  return date;
}
export function parseMyShiftsQuery(params: URLSearchParams, list: true): MyShiftsRequestV1;
export function parseMyShiftsQuery(params: URLSearchParams, list: false): MyShiftsContextRequestV1;
export function parseMyShiftsQuery(params: URLSearchParams, list: boolean): MyShiftsContextRequestV1 | MyShiftsRequestV1 {
  const allowed = ["mode", "employeeId", ...(list ? ["dateFrom", "dateTo", "limit", "offset", "sort"] : [])];
  for (const key of params.keys())
    if (!allowed.includes(key) || params.getAll(key).length !== 1) invalidMyShifts("query", "unsupported");
  const mode = params.get("mode");
  if (mode === null || mode === "") invalidMyShifts("mode", "required");
  if (mode !== "self" && mode !== "selected") invalidMyShifts("mode");
  const id = params.get("employeeId");
  if (mode === "self" && id !== null) invalidMyShifts("employeeId", "unsupported");
  if (mode === "selected" && (id === null || id === "")) invalidMyShifts("employeeId", "required");
  if (mode === "selected" && !decimalId(id)) invalidMyShifts("employeeId");
  const actor: MyShiftsContextRequestV1 = mode === "self" ? { mode } : { mode, employeeId: id! };
  if (!list) return actor;
  const dateFrom = params.get("dateFrom"), dateTo = params.get("dateTo");
  for (const [key, date] of [["dateFrom", dateFrom], ["dateTo", dateTo]] as const) {
    if (date === null || date === "") invalidMyShifts(key, "required");
    if (!localDate(date)) invalidMyShifts(key);
  }
  if (!localDate(dateFrom) || !localDate(dateTo)) invalidMyShifts("query");
  if (dateTo < dateFrom || dateTo > addCivilDates(dateFrom, 30)) invalidMyShifts("dateTo");
  const integer = (key: "limit" | "offset", fallback: number, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^(0|[1-9][0-9]*)$/.test(raw) || raw.length > 5 || Number(raw) < min || Number(raw) > max)
      invalidMyShifts(key);
    return Number(raw);
  };
  const sort = params.get("sort");
  if (sort !== null && sort !== "effective-start-asc") invalidMyShifts("sort", "unsupported");
  return { ...actor, dateFrom, dateTo, limit: integer("limit", 25, 1, 100),
    offset: integer("offset", 0, 0, 10000), sort: "effective-start-asc" };
}
export function validateMyShiftsRequest(value: unknown, list: true): MyShiftsRequestV1;
export function validateMyShiftsRequest(value: unknown, list: false): MyShiftsContextRequestV1;
export function validateMyShiftsRequest(value: unknown, list: boolean) {
  if (!record(value)) invalidMyShifts("query");
  const params = new URLSearchParams();
  for (const [key, v] of Object.entries(value)) {
    if (key === "limit" || key === "offset") {
      if (typeof v !== "number" || !Number.isInteger(v)) invalidMyShifts(key);
    } else if (typeof v !== "string") invalidMyShifts("query");
    params.append(key, String(v));
  }
  return list ? parseMyShiftsQuery(params, true) : parseMyShiftsQuery(params, false);
}
export function scheduleEmployee(v: unknown): v is CurrentShiftRowV1["employee"] {
  return record(v) && decimalId(v.employeeId) && text(v.firstName, 40) && text(v.lastName, 40) &&
    record(v.unit) && unitCode(v.unit.code) && plainLabel(v.unit.label, 1) && mokedOption(v.unit.moked) &&
    v.unit.code !== v.unit.moked.code;
}
export function scheduleRow(v: unknown): v is MyShiftRowV1 {
  return record(v) && decimalId(v.shiftDayId, 10) && scheduleEmployee(v.employee) &&
    localDateTime(v.startLocal) && (v.endLocal === null || (localDateTime(v.endLocal) && v.endLocal >= v.startLocal)) &&
    Array.isArray(v.activities) && v.activities.length <= 100 && v.activities.every(catalogValue);
}
export function cleanEmployee(e: CurrentShiftRowV1["employee"]): CurrentShiftRowV1["employee"] {
  return { employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName,
    unit: { code: e.unit.code, label: e.unit.label,
      moked: { code: e.unit.moked.code, label: e.unit.moked.label, unitType: "G01" } } };
}
