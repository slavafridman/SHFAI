import { civil, instantFor } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import type { StageArrivalBlockerV1 } from "./stage-arrival-contracts.mts";

// Pure native tightening, not a change to fixture F1 or a legacy lateness fix.
export function nativeOnTime(f: { planned: { startLocal: string; endLocal: string };
  policy: { configuredMinutes: number } }, now: Date, zone: string) {
  const local = civil(now, zone), start = instantFor(f.planned.startLocal, zone);
  const end = instantFor(f.planned.endLocal, zone), t = now.getTime();
  instantFor(local, zone);
  if (!Number.isSafeInteger(f.policy.configuredMinutes) || end < start) stageFail("INVALID_SOURCE_DATA");
  const transition = Math.min(start - f.policy.configuredMinutes * 60000, end) + 1;
  if (local.slice(0, 10) !== f.planned.startLocal.slice(0, 10) ||
      t < start - 3600000 || t > end || t + f.policy.configuredMinutes * 60000 > start)
    stageFail("COMMAND_SCOPE_DEFERRED");
  return { local, transition };
}

// Pure business classification, shared by preparation/locked command/readback.
// Raw originals remain separate and are never rewritten into an eligible state.
export function nativeBlockers(rows: Record<string, NativeRow | null>, reports: string): StageArrivalBlockerV1[] {
  const a = rows.SHF_ATTENDANCE, d = rows.SHF_EMPLOYEE_DAY, c = rows.SHF_DAY_CHANGES;
  if (!d) stageFail("INVALID_SOURCE_DATA");
  if (a?.STAGE_ARRIVAL_TIME === null && a.STAGE_ARRIVAL_USER !== null)
    stageFail("COMMAND_SCOPE_DEFERRED"); // Orphan provenance must never be overwritten.
  const blockers: StageArrivalBlockerV1[] = [];
  if (!a) blockers.push("ATTENDANCE_ROW_REQUIRED");
  if (a && ["MISS_REASON_ID", "MISSING_TIME", "MISSING_REMARK"].some(k => a[k] !== null)) blockers.push("MISSING_PRESENT");
  if (reports !== "0") blockers.push("REPORT_REVIEW_REQUIRED");
  const flags = [d.SPLIT_SHIFT, c?.NEW_SPLIT_SHIFT ?? null];
  if (flags.some(v => v !== null && !["Y", "N", "y", "n"].includes(v))) stageFail("INVALID_SOURCE_DATA");
  if (flags.some(v => v?.toUpperCase() === "Y") || d.SPLIT_START !== null || d.SPLIT_END !== null ||
      c && (c.NEW_SPLIT_START !== null || c.NEW_SPLIT_END !== null) ||
      a && Object.keys(a).some(k => /P2/.test(k) && a[k] !== null && !(/^TADREECH/.test(k) && a[k] === "0")))
    blockers.push("UNSUPPORTED_DAY");
  // Ordinary activity only in this pilot. No incomplete/unknown provenance
  // silently becomes eligibility and there is no native warning override.
  if ((c?.NEW_DAY_TYPE ?? d.WM_DAY_TYPE) !== "4" || c?.CANCEL_REASON_CODE != null ||
      (c?.NEW_ACTIVITY ?? d.WM_SCH_ACTIVITY_ID_DATA) !== null ||
      (c?.NEW_EXCEPTION_TYPE_ID ?? d.WM_EXCEPTION_TYPE_ID) !== null) blockers.push("UNSUPPORTED_DAY");
  if (a?.STATION_ARRIVAL_TIME != null || a?.STATION_EXIT_TIME != null) blockers.push("DEPENDENT_ATTENDANCE_PRESENT");
  if (a && ["STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "STAGE_LATE_REMARK"].some(k => a[k] !== null))
    blockers.push("EXISTING_STAGE_LATE");
  if (a && ![null, "0", "1"].includes(a.TADREECH)) stageFail("INVALID_SOURCE_DATA");
  if (a?.TADREECH === "1") blockers.push("BRIEFING_PRESENT");
  if (a && Object.keys(a).some(k => !["SHF_EMPLOYEE_DAY_ID", "STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH"].includes(k) &&
      a[k] !== null && !(/^TADREECH/.test(k) && a[k] === "0"))) blockers.push("DEPENDENT_ATTENDANCE_PRESENT");
  return [...new Set(blockers)];
}
