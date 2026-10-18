import type { ShiftSearchRequestV1, ShiftSearchProblemV1, ShiftSearchCatalogV1, ShiftSearchRowV1 } from "./shift-search-contracts.mts";
import { decimalId, record } from "./contract-validation.mts";
import { catalogValue, currentRow, localDate, minute, mokedOption, plainLabel, sourceFailure, unitCode } from "./current-shifts-validation.mts";
import { compareCode } from "./current-shifts-fixture.mts";

import { ShiftSearchError } from "./shift-search-errors.mts";
type Parameter = NonNullable<ShiftSearchProblemV1["invalidParameters"]>[number]["name"];
export function invalidSearch(name: Parameter, reason: "required" | "invalid-format" | "unsupported" = "invalid-format"): never {
  throw new ShiftSearchError("INVALID_REQUEST", [{ name, reason }]);
}
const lists = ["teamCodes", "innerJobCodes", "workLocations"] as const;
export function parseSearchQuery(params: URLSearchParams): ShiftSearchRequestV1 {
  const allowed = ["attendanceDate", "timeFrom", "timeTo", "mokedCode", ...lists, "limit", "offset", "sort"];
  for (const key of params.keys())
    if (!allowed.includes(key) || params.getAll(key).length !== 1) invalidSearch("query", "unsupported");
  const date = params.get("attendanceDate"), from = params.get("timeFrom"), to = params.get("timeTo");
  for (const [key, value, valid] of [
    ["attendanceDate", date, localDate(date)], ["timeFrom", from, minute(from)], ["timeTo", to, minute(to)],
  ] as const) {
    if (value === null) invalidSearch(key, "required");
    if (!valid) invalidSearch(key);
  }
  if (!localDate(date) || !minute(from) || !minute(to)) invalidSearch("query");
  if (from > to) invalidSearch("timeTo");
  const result: ShiftSearchRequestV1 = { attendanceDate: date, timeFrom: from, timeTo: to };
  const parent = params.get("mokedCode");
  if (parent !== null) {
    if (!unitCode(parent) || parent.includes(",")) invalidSearch("mokedCode");
    result.mokedCode = parent;
  }
  for (const key of lists) {
    const raw = params.get(key);
    if (raw === null) continue;
    const values = raw.split(",");
    if (values.length < 1 || values.length > (key === "workLocations" ? 2 : 100) ||
        new Set(values).size !== values.length ||
        !values.every(v => key === "teamCodes" ? unitCode(v) && !v.includes(",")
          : key === "innerJobCodes" ? decimalId(v) : v === "home" || v === "site")) invalidSearch(key);
    if (key === "teamCodes") result.teamCodes = values.sort(compareCode);
    else if (key === "innerJobCodes") result.innerJobCodes = values.sort(compareCode);
    else result.workLocations = (["home", "site"] as const).filter(v => values.includes(v));
  }
  for (const [key, fallback, min, max] of [["limit", 25, 1, 100], ["offset", 0, 0, 10000]] as const) {
    const raw = params.get(key);
    if (raw !== null && (!/^(0|[1-9][0-9]*)$/.test(raw) || raw.length > 5 ||
        Number(raw) < min || Number(raw) > max)) invalidSearch(key);
    result[key] = raw === null ? fallback : Number(raw);
  }
  const sort = params.get("sort");
  if (sort !== null && sort !== "effective-start-asc") invalidSearch("sort", "unsupported");
  result.sort = "effective-start-asc";
  return result;
}
export function validateSearchRequest(v: unknown): ShiftSearchRequestV1 {
  if (!record(v)) invalidSearch("query");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(v)) {
    if (lists.some(k => k === key)) {
      if (!Array.isArray(value) || !value.every(x => typeof x === "string" && !x.includes(",")))
        invalidSearch("query");
      params.append(key, value.join(","));
    } else if (key === "limit" || key === "offset") {
      if (typeof value !== "number" || !Number.isInteger(value)) invalidSearch(key);
      params.append(key, String(value));
    } else {
      if (typeof value !== "string") invalidSearch("query");
      params.append(key, value);
    }
  }
  return parseSearchQuery(params);
}
export function validateSearchCatalog(v: unknown, grants: readonly string[]): asserts v is ShiftSearchCatalogV1 {
  if (!record(v)) sourceFailure();
  for (const [key, max] of [["mokedOptions", 100], ["teamOptions", 1000], ["innerJobOptions", 1000]] as const) {
    const values = v[key];
    if (!Array.isArray(values) || values.length > max) sourceFailure();
    const codes: string[] = [];
    for (const item of values) {
      if (!record(item) || typeof item.code !== "string") sourceFailure();
      if (codes.length && compareCode(codes[codes.length - 1], item.code) >= 0) sourceFailure();
      codes.push(item.code);
      if (key === "mokedOptions" && !mokedOption(item)) sourceFailure();
      if (key === "teamOptions" && (!unitCode(item.code) || item.code.includes(",") ||
          !grants.includes(item.code) || item.unitType !== "J01" || !plainLabel(item.label, 1) ||
          !unitCode(item.parentMokedCode))) sourceFailure();
      if (key === "innerJobOptions" && (!catalogValue(item) || !decimalId(item.code) ||
          !plainLabel(item.label, 1))) sourceFailure();
    }
  }
  // Narrow explicitly after structural validation.
  const parents = v.mokedOptions as ShiftSearchCatalogV1["mokedOptions"];
  const teams = v.teamOptions as ShiftSearchCatalogV1["teamOptions"];
  if (teams.length !== grants.length || teams.some(t => !parents.some(p => p.code === t.parentMokedCode)) ||
      parents.some(p => teams.some(t => t.code === p.code) || !teams.some(t => t.parentMokedCode === p.code)) ||
      (grants.length === 0 && (parents.length !== 0 || (v.innerJobOptions as unknown[]).length !== 0))) sourceFailure();
  if (!Array.isArray(v.workLocationOptions) || v.workLocationOptions.length !== 2 ||
      !v.workLocationOptions.every((x, i) => record(x) && x.code === ["home", "site"][i] && plainLabel(x.label, 1))) sourceFailure();
}
export function searchRow(v: unknown): v is ShiftSearchRowV1 {
  if (!record(v) || !currentRow({ ...v, attendanceDisplay: { kind: "not-recorded" } }) ||
      !(v.activityFallback === null || (catalogValue(v.activityFallback) && decimalId(v.activityFallback.code) &&
        Array.isArray(v.activities) && v.activities.length === 0)) || !record(v.indicators)) return false;
  const indicators = v.indicators;
  return ["hasRemark", "hasCancelLoginAnnotation", "timeOrLocationChanged", "split", "addedStaffing",
    "employeeReassigned"].every(k => typeof indicators[k] === "boolean") &&
    (v.workingFromHome === true ? typeof indicators.extensionAllocated === "boolean"
      : indicators.extensionAllocated === null);
}
