import type { AttendanceRowV1 } from "./attendance-contracts.mts";
import type { CatalogValueV1 } from "./current-shifts-contracts.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { catalogValue, plainLabel, unitCode, mokedOption } from "./current-shifts-validation.mts";
import { activityTokens } from "./current-shifts-projection.mts";
import { attendanceSource } from "./attendance-errors.mts";
import { compareCode } from "./current-shifts-fixture.mts";
import { signedInteger } from "./shift-items-validation.mts";

export interface AttendanceFacts {
  shiftDayId: string; employeeId: string; firstName: string; lastName: string;
  teamCode: string; innerJobCode: string | null;
  baselineStartLocal: string | null; changedStartLocal: string | null;
  baselineEndLocal: string | null; changedEndLocal: string | null;
  baselineHome: string | null; changedHome: string | null;
  baselineActivityData: string | null; changedActivityData: string | null; exceptionCode: string | null;
  stageArrivalLocal: string | null; stationArrivalLocal: string | null; stationExitLocal: string | null;
  missingReasonCode: string | null; briefingCode: string | null;
}
const dateOrNull = (v: unknown) => v === null || localDateTime(v);
const name = (v: unknown) => text(v, 40, 1) && plainLabel(v, 1);
export function attendanceRow(v: unknown): v is AttendanceRowV1 {
  if (!record(v) || !decimalId(v.shiftDayId, 10) || !record(v.employee) ||
      !decimalId(v.employee.employeeId) || !name(v.employee.firstName) || !name(v.employee.lastName) ||
      !record(v.employee.unit) || !unitCode(v.employee.unit.code) || !plainLabel(v.employee.unit.label, 1) ||
      !mokedOption(v.employee.unit.moked) || !record(v.planned) || !record(v.attendance)) return false;
  const p = v.planned, a = v.attendance;
  return dateOrNull(p.startLocal) && dateOrNull(p.endLocal) &&
    !(typeof p.startLocal === "string" && typeof p.endLocal === "string" && p.endLocal < p.startLocal) &&
    (p.workingFromHome === null || typeof p.workingFromHome === "boolean") &&
    Array.isArray(p.activities) && p.activities.length <= 100 && p.activities.every(catalogValue) &&
    (p.innerJob === null || (catalogValue(p.innerJob) && signedInteger(p.innerJob.code) && p.innerJob.code !== "0")) &&
    (p.activityFallback === null || (catalogValue(p.activityFallback) && decimalId(p.activityFallback.code) && p.activities.length === 0)) &&
    dateOrNull(a.stageArrivalLocal) && dateOrNull(a.stationArrivalLocal) && dateOrNull(a.stationExitLocal) &&
    (a.missingReasonCode === null || signedInteger(a.missingReasonCode)) &&
    (a.briefingRecorded === null || typeof a.briefingRecorded === "boolean");
}
export function projectAttendance(f: AttendanceFacts, unit: AttendanceRowV1["employee"]["unit"],
  labels: { activities: readonly CatalogValueV1[]; innerJobs: readonly CatalogValueV1[]; exceptions: readonly CatalogValueV1[] }): AttendanceRowV1 {
  const lookup = (code: string, values: readonly CatalogValueV1[]) => {
    const matches = values.filter(v => v.code === code);
    if (matches.length > 1 || matches.some(v => !catalogValue(v))) attendanceSource();
    return { code, label: matches[0]?.label ?? null };
  };
  for (const d of [f.baselineStartLocal, f.changedStartLocal, f.baselineEndLocal, f.changedEndLocal])
    if (!dateOrNull(d)) attendanceSource();
  const nullable = (v: string | null) => v === "" ? null : v;
  const rawHome = nullable(f.changedHome) ?? nullable(f.baselineHome);
  const briefing = nullable(f.briefingCode), innerJob = nullable(f.innerJobCode);
  if (rawHome !== null && !/^[yn]$/i.test(rawHome)) attendanceSource();
  if (briefing !== null && briefing !== "0" && briefing !== "1") attendanceSource();
  if (innerJob !== null && !signedInteger(innerJob)) attendanceSource();
  const activities = activityTokens(nullable(f.changedActivityData) ?? nullable(f.baselineActivityData)).map(c => lookup(c, labels.activities));
  const row: AttendanceRowV1 = {
    shiftDayId: f.shiftDayId, employee: { employeeId: f.employeeId, firstName: f.firstName, lastName: f.lastName,
      unit: { code: unit.code, label: unit.label, moked: { code: unit.moked.code, label: unit.moked.label, unitType: "G01" } } },
    planned: { startLocal: f.changedStartLocal ?? f.baselineStartLocal, endLocal: f.changedEndLocal ?? f.baselineEndLocal,
      workingFromHome: rawHome === null ? null : rawHome.toUpperCase() === "Y", activities,
      innerJob: innerJob === null || innerJob === "0" ? null : lookup(innerJob, labels.innerJobs),
      activityFallback: activities.length === 0 && f.exceptionCode !== null && decimalId(f.exceptionCode)
        ? lookup(f.exceptionCode, labels.exceptions) : null },
    attendance: { stageArrivalLocal: f.stageArrivalLocal, stationArrivalLocal: f.stationArrivalLocal,
      stationExitLocal: f.stationExitLocal, missingReasonCode: nullable(f.missingReasonCode),
      briefingRecorded: briefing === null ? null : briefing === "1" },
  };
  if (!attendanceRow(row)) attendanceSource();
  return row;
}
export function compareAttendance(a: AttendanceRowV1, b: AttendanceRowV1) {
  const x = a.planned.startLocal, y = b.planned.startLocal;
  const start = x === y ? 0 : x === null ? 1 : y === null ? -1 : compareCode(x, y);
  const numeric = (x: string, y: string) => BigInt(x) < BigInt(y) ? -1 : BigInt(x) > BigInt(y) ? 1 : 0;
  return start || numeric(a.shiftDayId!, b.shiftDayId!) || numeric(a.employee.employeeId, b.employee.employeeId);
}
export function copyAttendance(row: AttendanceRowV1): AttendanceRowV1 {
  // Construct from allowlisted fields; reader extensions never reach HTTP.
  const p = row.planned, a = row.attendance, e = row.employee;
  const cv = (v: CatalogValueV1) => ({ code: v.code, label: v.label });
  return { shiftDayId: row.shiftDayId, employee: { employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName,
    unit: { code: e.unit.code, label: e.unit.label, moked: { code: e.unit.moked.code, label: e.unit.moked.label, unitType: "G01" } } },
    planned: { startLocal: p.startLocal, endLocal: p.endLocal, workingFromHome: p.workingFromHome,
      activities: p.activities.map(cv), activityFallback: p.activityFallback === null ? null : cv(p.activityFallback),
      innerJob: p.innerJob === null ? null : cv(p.innerJob) },
    attendance: { stageArrivalLocal: a.stageArrivalLocal, stationArrivalLocal: a.stationArrivalLocal,
      stationExitLocal: a.stationExitLocal, missingReasonCode: a.missingReasonCode, briefingRecorded: a.briefingRecorded } };
}
