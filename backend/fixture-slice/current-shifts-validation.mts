import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import type {
  CatalogValueV1, CurrentShiftRequestV1, CurrentShiftRowV1, MokedOptionV1,
} from "./current-shifts-contracts.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export const unitCode = (v: unknown): v is string =>
  text(v, 8, 1) && !/[\s\p{Cc}]/u.test(v) && !["-1", "null", "*"].includes(v);
export const plainLabel = (v: unknown, min = 0): v is string =>
  text(v, 256, min) && !/[\p{Cc}<>]/u.test(v);
export const catalogCode = (v: unknown): v is string =>
  text(v, 128, 1) && !/\p{Cc}/u.test(v);
export const localDate = (v: unknown): v is string =>
  typeof v === "string" && localDateTime(v + "T00:00:00");
export const minute = (v: unknown): v is string =>
  typeof v === "string" && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
export function sourceFailure(): never { throw new CurrentShiftError("INVALID_SOURCE_DATA"); }
export function mokedOption(v: unknown): v is MokedOptionV1 {
  return record(v) && unitCode(v.code) && plainLabel(v.label, 1) && v.unitType === "G01";
}
export function catalogValue(v: unknown): v is CatalogValueV1 {
  return record(v) && catalogCode(v.code) && (v.label === null || plainLabel(v.label, 1));
}
export function currentRow(v: unknown): v is CurrentShiftRowV1 {
  if (!record(v) || !decimalId(v.shiftDayId, 10) || !record(v.employee) ||
      !decimalId(v.employee.employeeId) || !text(v.employee.firstName, 40) ||
      !text(v.employee.lastName, 40) || !record(v.employee.unit) ||
      !unitCode(v.employee.unit.code) || !plainLabel(v.employee.unit.label, 1) ||
      !mokedOption(v.employee.unit.moked) || !localDateTime(v.startLocal) ||
      !localDateTime(v.endLocal) || !(v.workingFromHome === null || typeof v.workingFromHome === "boolean") ||
      !Array.isArray(v.activities) || v.activities.length > 100 || !v.activities.every(catalogValue) ||
      !(v.innerJob === null || catalogValue(v.innerJob)) || !record(v.attendanceDisplay)) return false;
  const a = v.attendanceDisplay;
  return a.kind === "not-recorded" ||
    (a.kind === "station-arrival" && localDateTime(a.atLocal)) ||
    (a.kind === "missing-reason" && catalogValue(a.reason) && decimalId(a.reason.code));
}
function invalid(name: NonNullable<import("./current-shifts-contracts.mts").CurrentShiftProblemV1["invalidParameters"]>[number]["name"],
  reason: "required" | "invalid-format" | "unsupported" = "invalid-format"): never {
  throw new CurrentShiftError("INVALID_REQUEST", [{ name, reason }]);
}
export function parseCurrentQuery(params: URLSearchParams): CurrentShiftRequestV1 {
  const allowed = ["mode", "attendanceDate", "currentTime", "mokedCode", "limit", "offset", "sort"];
  for (const key of params.keys())
    if (!allowed.includes(key) || params.getAll(key).length !== 1) invalid("query", "unsupported");
  const mode = params.get("mode");
  if (mode === null || mode === "") invalid("mode", "required");
  if (mode !== "at" && mode !== "current") invalid("mode");
  const date = params.get("attendanceDate"), time = params.get("currentTime");
  if (mode === "current" && (date !== null || time !== null)) invalid("query", "unsupported");
  if (mode === "at") {
    if (date === null || date === "") invalid("attendanceDate", "required");
    if (!localDate(date)) invalid("attendanceDate");
    if (time === null || time === "") invalid("currentTime", "required");
    if (!minute(time)) invalid("currentTime");
  }
  const moked = params.get("mokedCode");
  if (moked !== null && !unitCode(moked)) invalid("mokedCode");
  const integer = (key: "limit" | "offset", fallback: number, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^(0|[1-9][0-9]*)$/.test(raw) || raw.length > 5 ||
        Number(raw) < min || Number(raw) > max) invalid(key);
    return Number(raw);
  };
  const limit = integer("limit", 25, 1, 100), offset = integer("offset", 0, 0, 10000);
  if (mode === "current" && offset !== 0) invalid("offset");
  const sort = params.get("sort");
  if (sort !== null && sort !== "effective-start-asc") invalid("sort", "unsupported");
  const common = { limit, sort: "effective-start-asc" as const,
    ...(moked === null ? {} : { mokedCode: moked }) };
  if (mode === "current") return { ...common, mode, offset: 0 };
  // Recheck narrowing rather than coercing an unvalidated value.
  if (!localDate(date) || !minute(time)) invalid("query");
  return { ...common, mode, attendanceDate: date, currentTime: time, offset };
}
export function validateCurrentRequest(v: unknown): asserts v is CurrentShiftRequestV1 {
  if (!record(v)) invalid("query");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(v)) {
    if (key === "limit" || key === "offset") {
      if (typeof value !== "number" || !Number.isInteger(value)) invalid(key);
      params.append(key, String(value));
    } else {
      if (typeof value !== "string") invalid("query");
      params.append(key, value);
    }
  }
  parseCurrentQuery(params);
}
