import type { AttendanceRequestV1, AttendanceReadSelection, AttendanceFilterContextV1 } from "./attendance-contracts.mts";
import { parseSearchQuery, validateSearchRequest, validateSearchCatalog } from "./shift-search-validation.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";
import { AttendanceError, attendanceSource } from "./attendance-errors.mts";
import { AsyncLocalStorage } from "node:async_hooks";
import { unitCode } from "./current-shifts-validation.mts";

export type AttendanceCatalog = Pick<AttendanceFilterContextV1,
  "mokedOptions" | "teamOptions" | "innerJobOptions" | "workLocationOptions">;
export const attendanceAdmission = new AsyncLocalStorage<{ grants: readonly string[]; explicitTeams: boolean }>();
export const attendanceLocations = [{ code: "home" as const, label: "בית" }, { code: "site" as const, label: "אתר" }];
export function invalidAttendance(name: NonNullable<import("./attendance-contracts.mts").AttendanceProblemV1["invalidParameters"]>[number]["name"],
  reason: "required" | "invalid-format" | "unsupported" = "invalid-format"): never {
  throw new AttendanceError("INVALID_REQUEST", [{ name, reason }]);
}
function grammar<T>(work: () => T): T {
  try { return work(); } catch (e) {
    if (e instanceof ShiftSearchError && e.code === "INVALID_REQUEST")
      throw new AttendanceError("INVALID_REQUEST", e.invalidParameters);
    throw e;
  }
}
export function parseAttendanceQuery(raw: string): AttendanceRequestV1 {
  if (Buffer.byteLength(raw, "utf8") > 8192) invalidAttendance("query", "unsupported");
  try { for (const p of raw.split("&")) for (const v of p.split("=")) decodeURIComponent(v.replaceAll("+", " ")); }
  catch { invalidAttendance("query"); }
  if (raw.includes("#")) invalidAttendance("query");
  return grammar(() => parseSearchQuery(new URLSearchParams(raw)));
}
export const validateAttendanceRequest = (v: unknown) => grammar(() => validateSearchRequest(v));
export function validateAttendanceCatalog(v: unknown, grants: readonly string[]): asserts v is AttendanceCatalog {
  if (grants.length > 100 || new Set(grants).size !== grants.length || !grants.every(unitCode)) attendanceSource();
  validateSearchCatalog(v, grants);
}
// Operation-local admission retains ORIGINAL grants for role eligibility.
// It is never a wire key, global mutable grant, or a second catalog snapshot.
export function attendanceGrants(s: AttendanceReadSelection): readonly string[] {
  return attendanceAdmission.getStore()?.grants ?? s.authorizedTeamUnitIds;
}
export function validateAttendanceSelection(s: AttendanceReadSelection) {
  validateAttendanceRequest({ attendanceDate: s.attendanceDate, timeFrom: s.timeFrom, timeTo: s.timeTo,
    ...(s.mokedCode === null ? {} : { mokedCode: s.mokedCode }),
    ...(s.innerJobCodes.length ? { innerJobCodes: [...s.innerJobCodes] } : {}),
    ...(s.workLocations.length ? { workLocations: [...s.workLocations] } : {}),
    limit: s.limit, offset: s.offset, sort: s.sort });
  if (s.authorizedTeamUnitIds.length > 100 || new Set(s.authorizedTeamUnitIds).size !== s.authorizedTeamUnitIds.length ||
      !s.authorizedTeamUnitIds.every(unitCode)) attendanceSource();
}
export function eligibleAttendanceTeams(c: AttendanceCatalog, s: AttendanceReadSelection, original: readonly string[]) {
  validateAttendanceCatalog(c, original);
  const explicitTeams = attendanceAdmission.getStore()?.explicitTeams ?? true;
  if ((s.mokedCode !== null && !c.mokedOptions.some(p => p.code === s.mokedCode)) ||
      s.authorizedTeamUnitIds.some(code => !c.teamOptions.some(t => t.code === code &&
        (!explicitTeams || s.mokedCode === null || t.parentMokedCode === s.mokedCode))) ||
      s.innerJobCodes.some(code => !c.innerJobOptions.some(j => j.code === code)))
    throw new AttendanceError("FORBIDDEN");
  return c.teamOptions.filter(t => s.authorizedTeamUnitIds.includes(t.code) &&
    (s.mokedCode === null || t.parentMokedCode === s.mokedCode)).map(t => t.code);
}
