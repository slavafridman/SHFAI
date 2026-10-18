import type { SelectedShiftItemsRequestV1, SelectedShiftItemsV1, SelectedShiftItemV1,
  SelectedShiftItemsProblemV1 } from "./shift-items-contracts.mts";
import { decimalId, localDateTime, record, text, validateIds } from "./contract-validation.mts";
import { catalogValue, mokedOption, plainLabel, unitCode } from "./current-shifts-validation.mts";
import { ShiftItemsError } from "./shift-items-errors.mts";

export function itemsSourceFailure(): never { throw new ShiftItemsError("INVALID_SOURCE_DATA"); }
export function invalidItems(name: NonNullable<SelectedShiftItemsProblemV1["invalidParameters"]>[number]["name"],
  reason: "required" | "invalid-format" | "unsupported" = "invalid-format"): never {
  throw new ShiftItemsError("INVALID_REQUEST", [{ name, reason }]);
}
export function parseItemsQuery(raw: string): Pick<SelectedShiftItemsRequestV1, "limit" | "offset" | "sort"> {
  if (Buffer.byteLength(raw, "utf8") > 8192) invalidItems("query", "unsupported");
  try {
    for (const pair of raw.split("&"))
      for (const part of pair.split("=")) decodeURIComponent(part.replaceAll("+", " "));
  } catch { invalidItems("query"); }
  if (raw.includes("#")) invalidItems("query");
  const p = new URLSearchParams(raw);
  for (const key of p.keys())
    if (!["limit", "offset", "sort"].includes(key) || p.getAll(key).length !== 1)
      invalidItems("query", "unsupported");
  const integer = (key: "limit" | "offset", fallback: number, min: number, max: number) => {
    const value = p.get(key);
    if (value === null) return fallback;
    if (!/^(0|[1-9][0-9]*)$/.test(value) || value.length > 5 ||
        Number(value) < min || Number(value) > max) invalidItems(key);
    return Number(value);
  };
  const sort = p.get("sort");
  if (sort !== null && sort !== "start-asc") invalidItems("sort", "unsupported");
  return { limit: integer("limit", 25, 1, 100), offset: integer("offset", 0, 0, 10000), sort: "start-asc" };
}
export function validateItemsRequest(value: unknown): asserts value is SelectedShiftItemsRequestV1 {
  if (!record(value)) invalidItems("query");
  validateIds(value.employeeId, value.shiftDayId);
  const p = new URLSearchParams();
  for (const [key, v] of Object.entries(value)) {
    if (key === "employeeId" || key === "shiftDayId") continue;
    if (key === "limit" || key === "offset") {
      if (typeof v !== "number" || !Number.isInteger(v)) invalidItems(key);
    } else if (typeof v !== "string") invalidItems("query");
    p.append(key, String(v));
  }
  parseItemsQuery(p.toString());
}
export const signedInteger = (v: unknown): v is string =>
  typeof v === "string" && /^(?:0|[1-9][0-9]{0,37}|-[1-9][0-9]{0,37})$/.test(v);
export function itemsDisplayContext(v: unknown): v is SelectedShiftItemsV1["displayContext"] {
  return record(v) && record(v.unit) && unitCode(v.unit.code) && plainLabel(v.unit.label, 1) &&
    mokedOption(v.unit.moked) && v.unit.code !== v.unit.moked.code &&
    Array.isArray(v.activities) && v.activities.length <= 100 && v.activities.every(catalogValue) &&
    (v.innerJob === null || catalogValue(v.innerJob));
}
export function selectedItem(v: unknown): v is SelectedShiftItemV1 {
  if (!record(v) || !record(v.key) || !decimalId(v.key.shiftDayId, 10) ||
      !localDateTime(v.startLocal) || v.key.startLocal !== v.startLocal || !localDateTime(v.endLocal) ||
      !decimalId(v.stateCode) || !signedInteger(v.durationMinutes) ||
      !(v.remark === null || text(v.remark, 1000, 1)) ||
      !text(v.sourceCode, 10, 1) || /\p{Cc}/u.test(v.sourceCode)) return false;
  if (v.stateCode === "4") return v.kind === "break" && v.type === null &&
    (v.breakExitLocal === null || localDateTime(v.breakExitLocal)) &&
    (v.breakReturnLocal === null || localDateTime(v.breakReturnLocal));
  return v.kind === (v.stateCode === "2" ? "timeoff" : "exception") &&
    catalogValue(v.type) && signedInteger(v.type.code) &&
    v.breakExitLocal === null && v.breakReturnLocal === null;
}
