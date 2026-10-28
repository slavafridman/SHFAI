import { civil, instantFor } from "./stage-arrival-domain.mts";
import { decimalId, localDateTime } from "./contract-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import type { StationArrivalBlockerV1 } from "./station-arrival-contracts.mts";

// §46 station offset is ZERO; F1's unit offset is deliberately not consulted.
export function stationOnTime(f: { planned: { startLocal: string; endLocal: string } }, now: Date, zone: string) {
  const start = instantFor(f.planned.startLocal, zone), end = instantFor(f.planned.endLocal, zone);
  const local = civil(now, zone), t = now.getTime();
  instantFor(local, zone);
  if (!Number.isFinite(t) || end < start) stageFail("INVALID_SOURCE_DATA");
  if (local.slice(0, 10) !== f.planned.startLocal.slice(0, 10) ||
      t < start - 3600000 || t > Math.min(start, end)) stageFail("COMMAND_SCOPE_DEFERRED");
  return { local, transition: Math.min(start, end) + 1,
    arrivalWindow: { earliestLocal: civil(new Date(start - 3600000), zone), latestLocal: civil(new Date(end), zone) } };
}
export interface StationCandidate { day: NativeRow; change: NativeRow | null }
export function stationOverlap(candidates: StationCandidate[], selected: string,
  planned: { startLocal: string; endLocal: string }, zone: string, prefix: string, assertActive: () => void): boolean {
  if (candidates.length > 1000) stageFail("INVALID_SOURCE_DATA");
  if (!/^[0-9]{8}$/.test(prefix)) stageFail("INVALID_SOURCE_DATA");
  const ids = new Set<string>();
  const instants = new Map<string, number>();
  const instant = (local: string) => {
    assertActive();
    const known = instants.get(local);
    if (known !== undefined) return known;
    const value = instantFor(local, zone); instants.set(local, value); return value;
  };
  const selectedStart = instant(planned.startLocal), selectedEnd = instant(planned.endLocal);
  let overlap = false;
  for (const { day: d, change: c } of candidates) {
    const id = d.SHF_EMPLOYEE_DAY_ID;
    if (!decimalId(id, 10) || ids.has(id) || c && c.SHF_EMPLOYEE_DAY_ID !== id) stageFail("INVALID_SOURCE_DATA");
    ids.add(id);
    // Validate every candidate BEFORE cancellation/filtering. Unknown endpoints
    // cannot establish nonoverlap, including overnight/changed-employee days.
    const start = c?.NEW_SHIFT_START ?? d.WM_SHIFT_START_DATETIME;
    const end = c?.NEW_SHIFT_END ?? d.WM_SHIFT_END_DATETIME;
    if (!localDateTime(start) || !localDateTime(end) || end < start) stageFail("INVALID_SOURCE_DATA");
    const candidateStart = instant(start), candidateEnd = instant(end);
    if (candidateEnd < candidateStart) stageFail("INVALID_SOURCE_DATA");
    const effectiveEmployee = c?.NEW_EMPLOYEE_ID ?? d.EMP_ID_NUMBER;
    if (typeof effectiveEmployee !== "string" || !/^[0-9]{8}$/.test(effectiveEmployee)) stageFail("INVALID_SOURCE_DATA");
    // Multiplicity, ownership and endpoint validity are established before
    // scope/cancellation filters. Every overlay for a candidate day was read.
    if (effectiveEmployee !== prefix) continue;
    if ((c?.NEW_DAY_TYPE ?? d.WM_DAY_TYPE) !== "4" ||
        (c?.NEW_ACTIVITY ?? d.WM_SCH_ACTIVITY_ID_DATA) !== null ||
        (c?.NEW_EXCEPTION_TYPE_ID ?? d.WM_EXCEPTION_TYPE_ID) !== null)
      stageFail("COMMAND_SCOPE_DEFERRED");
    for (const flag of [d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT ?? null])
      if (flag !== null && !["Y", "N", "y", "n"].includes(flag ?? "")) stageFail("INVALID_SOURCE_DATA");
    if ([d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT].some(v => v?.toUpperCase() === "Y") ||
        [d.SPLIT_START, d.SPLIT_END, c?.NEW_SPLIT_START ?? null, c?.NEW_SPLIT_END ?? null].some(v => v !== null))
      stageFail("COMMAND_SCOPE_DEFERRED");
    if (id !== selected && c?.CANCEL_REASON_CODE == null && start < end &&
        selectedStart < selectedEnd && candidateStart < selectedEnd && selectedStart < candidateEnd)
      overlap = true;
  }
  if (!ids.has(selected)) stageFail("INVALID_SOURCE_DATA");
  return overlap;
}
export function stationBlockers(rows: Record<string, NativeRow | null>,
  reports: string, exceptions: { current: string; base: string }, overlap: boolean): StationArrivalBlockerV1[] {
  const e = rows.SHF_EMPLOYEES, d = rows.SHF_EMPLOYEE_DAY, c = rows.SHF_DAY_CHANGES, a = rows.SHF_ATTENDANCE;
  if (!e || !d || !["0", "1"].includes(e.SHF_LOCKED ?? "") ||
      !/^(0|[1-9][0-9]*)$/.test(reports) ||
      !/^(0|[1-9][0-9]*)$/.test(exceptions.current) || !/^(0|[1-9][0-9]*)$/.test(exceptions.base) ||
      typeof overlap !== "boolean") stageFail("INVALID_SOURCE_DATA");
  const b: StationArrivalBlockerV1[] = [];
  if (e.SHF_LOCKED === "1") b.push("EMPLOYEE_LOCKED");
  if (reports !== "0") b.push("REPORT_REVIEW_REQUIRED");
  // Both partial and full-day exception rows are conservatively deferred;
  // absence is proved from both relations, not a fixture boolean.
  if (exceptions.current !== "0" || exceptions.base !== "0") b.push("UNSUPPORTED_DAY");
  if (overlap) b.push("OVERLAPPING_SHIFT");
  if (!a) b.push("ATTENDANCE_ROW_REQUIRED");
  for (const flag of [d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT ?? null])
    if (flag !== null && !["Y", "N", "y", "n"].includes(flag)) stageFail("INVALID_SOURCE_DATA");
  if ((c?.NEW_DAY_TYPE ?? d.WM_DAY_TYPE) !== "4" || c?.CANCEL_REASON_CODE != null ||
      (c?.NEW_ACTIVITY ?? d.WM_SCH_ACTIVITY_ID_DATA) !== null ||
      (c?.NEW_EXCEPTION_TYPE_ID ?? d.WM_EXCEPTION_TYPE_ID) !== null ||
      [d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT].some(v => v?.toUpperCase() === "Y") ||
      [d.SPLIT_START, d.SPLIT_END, c?.NEW_SPLIT_START ?? null, c?.NEW_SPLIT_END ?? null].some(v => v !== null))
    b.push("UNSUPPORTED_DAY");
  if (a) {
    if (![null, "0", "1"].includes(a.TADREECH)) stageFail("INVALID_SOURCE_DATA");
    if (["MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK"].some(k => a[k] !== null)) b.push("MISSING_PRESENT");
    if (a.OPTIONAL1 !== null) b.push("FLAG_PRESENT");
    if (a.STATION_EXIT_TIME !== null || a.STATION_EXIT_USER !== null) b.push("EXIT_PRESENT");
    if (["STATION_LATE_REASON_ID", "STATION_LATE_MINUTES", "STATION_LATE_REMARK"].some(k => a[k] !== null))
      b.push("EXISTING_STATION_LATE");
    const stage = a.STAGE_ARRIVAL_TIME, user = a.STAGE_ARRIVAL_USER;
    if ((stage === null) !== (user === null) || stage !== null &&
        (!localDateTime(stage) || !user || a.STATION_ARRIVAL_TIME !== null && stage > a.STATION_ARRIVAL_TIME))
      stageFail("INVALID_SOURCE_DATA");
    if (a.STATION_ARRIVAL_TIME !== null &&
        (!localDateTime(a.STATION_ARRIVAL_TIME) || !a.STATION_ARRIVAL_USER)) stageFail("INVALID_SOURCE_DATA");
    if (a.STATION_ARRIVAL_TIME === null && a.STATION_ARRIVAL_USER !== null) b.push("UNSUPPORTED_DAY");
    const admitted = new Set(["SHF_EMPLOYEE_DAY_ID", "STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH",
      "STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "STATION_EXIT_TIME", "STATION_EXIT_USER",
      "MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK", "OPTIONAL1",
      "STATION_LATE_REASON_ID", "STATION_LATE_MINUTES", "STATION_LATE_REMARK"]);
    for (const [k, v] of Object.entries(a))
      if (!admitted.has(k) && v !== null && !(k.startsWith("TADREECH") && k.includes("P2") && v === "0"))
        b.push("UNSUPPORTED_DAY");
  }
  return [...new Set(b)];
}
