import type { PrincipalV1, RawShiftDay, StartupConfig } from "./contracts.mts";
import { SliceError } from "./errors.mts";

export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function text(value: unknown, max: number, min = 0): value is string {
  if (typeof value !== "string") return false;
  // Reject unpaired surrogates rather than letting JSON/UTF-8 repair source characters.
  if (!value.isWellFormed()) return false;
  const length = [...value].length;
  return length >= min && length <= max;
}
export function decimalId(value: unknown, max = 38): value is string {
  return typeof value === "string" && new RegExp(`^[1-9][0-9]{0,${max - 1}}$`).test(value);
}
export function localDateTime(value: unknown): value is string {
  if (typeof value !== "string" ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(value)) return false;
  const [year, month, day, hour, minute, second] = value.split(/[-T:]/).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 &&
    day <= days[month - 1] && hour <= 23 && minute <= 59 && second <= 59;
}
function units(value: unknown, nonempty: boolean): value is string[] {
  return Array.isArray(value) && (!nonempty || value.length > 0) &&
    value.every(unit => text(unit, 8, 1) && unit !== "*") &&
    new Set(value).size === value.length;
}
export function validateConfig(value: unknown): StartupConfig {
  const fail = (): never => { throw new Error("Invalid fixture-slice startup configuration"); };
  if (!record(value)) return fail();
  if (typeof value.deploymentClass !== "string" ||
      !["local-development", "isolated-test-demo", "production"].includes(value.deploymentClass) ||
      typeof value.authenticationMode !== "string" ||
      !["synthetic", "real"].includes(value.authenticationMode) ||
      typeof value.syntheticAdministratorEnabled !== "boolean" ||
      value.dataSource !== "isolated-fixture" || !text(value.businessTimeZone, 128, 1)) return fail();
  // Intl validates interpretation only. Require IANA-style names, not numeric offset zones.
  if (!/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(value.businessTimeZone)) return fail();
  try { new Intl.DateTimeFormat("en", { timeZone: value.businessTimeZone }); } catch { return fail(); }
  if (value.deploymentClass === "production" &&
      (value.authenticationMode === "synthetic" || value.syntheticAdministratorEnabled)) return fail();
  if (value.authenticationMode === "synthetic") {
    if (value.syntheticAdministratorEnabled !== true || !units(value.syntheticOrgUnitIds, true) ||
        value.syntheticOrgUnitIds.length > 100 ||
        value.realProviderId !== undefined) return fail();
  } else if (value.syntheticAdministratorEnabled !== false || !text(value.realProviderId, 128, 1) ||
      value.realProviderId.trim().length === 0 || value.syntheticOrgUnitIds !== undefined) return fail();
  return structuredClone(value) as StartupConfig;
}
export function validatePrincipal(value: unknown): asserts value is PrincipalV1 {
  const fail = (): never => { throw new SliceError("UNAUTHENTICATED"); };
  if (!record(value) || !text(value.subject, 128, 1) || !text(value.displayName, 128) ||
      typeof value.provider !== "string" || !["synthetic", "real"].includes(value.provider) ||
      typeof value.synthetic !== "boolean" || value.synthetic !== (value.provider === "synthetic") ||
      !Array.isArray(value.roles) || value.roles.some(role => role !== "Administrator") ||
      new Set(value.roles).size !== value.roles.length ||
      !Array.isArray(value.capabilities) ||
      value.capabilities.some(c => c !== "shift-day:read" && c !== "current-shifts:read" && c !== "shift-search:read" && c !== "my-shifts:read" && c !== "shift-items:read" && c !== "employee:read" && c !== "attendance:read") ||
      new Set(value.capabilities).size !== value.capabilities.length ||
      !(value.employeeId === null || decimalId(value.employeeId)) ||
      !record(value.resourceScope) || !units(value.resourceScope.orgUnitIds, false)) return fail();
  if (value.synthetic && (value.subject !== "synthetic:administrator" ||
      value.displayName !== "Synthetic Administrator (local/isolated only)" ||
      value.employeeId !== null || value.roles.length !== 1 || value.capabilities.length !== 7 ||
      value.capabilities[0] !== "shift-day:read" || value.capabilities[1] !== "current-shifts:read" ||
      value.capabilities[2] !== "shift-search:read" || value.capabilities[3] !== "my-shifts:read" ||
      value.capabilities[4] !== "shift-items:read" || value.capabilities[5] !== "employee:read" ||
      value.capabilities[6] !== "attendance:read" ||
      value.resourceScope.orgUnitIds.length === 0 || value.resourceScope.orgUnitIds.length > 100)) return fail();
}
export function validateIds(employeeId: unknown, shiftDayId: unknown): void {
  const invalidParameters: NonNullable<import("./contracts.mts").ProblemV1["invalidParameters"]> = [];
  for (const [name, value, max] of [
    ["employeeId", employeeId, 38], ["shiftDayId", shiftDayId, 10],
  ] as const) {
    if (!decimalId(value, max)) invalidParameters.push({
      name, reason: value === "" || value === undefined || value === null ? "required" : "invalid-format",
    });
  }
  if (invalidParameters.length) throw new SliceError("INVALID_REQUEST", invalidParameters);
}
export function validateRaw(value: unknown): asserts value is RawShiftDay {
  const fail = (): never => { throw new SliceError("INVALID_SOURCE_DATA"); };
  if (!record(value) || !decimalId(value.employeeId) || !decimalId(value.shiftDayId, 10) ||
      !text(value.firstName, 40) || !text(value.lastName, 40) ||
      !(value.orgUnitId === null || text(value.orgUnitId, 8, 1))) return fail();
  for (const field of [
    "baselineStartLocal", "changedStartLocal", "baselineEndLocal", "changedEndLocal",
    "stageArrivalLocal", "stationArrivalLocal", "stationExitLocal",
  ]) if (!(value[field] === null || localDateTime(value[field]))) return fail();
  for (const field of ["baselineActivityData", "changedActivityData"])
    if (!(value[field] === null || text(value[field], 100))) return fail();
  for (const field of ["baselineSiteId", "changedSiteId"])
    if (!(value[field] === null || decimalId(value[field]))) return fail();
}
