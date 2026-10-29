import type { PrincipalV1 } from "./contracts.mts";
import type { PartnerShiftPort, ShiftDraftV1, ShiftEffectV1, ShiftRuleCodeV1,
  ShiftStateV1 } from "./shift-management-contracts.mts";
import type { ShiftDayFacts, ShiftOverlay, ShiftPlan, ShiftPlanEntry, ShiftSnapshot } from "./shift-management-model.mts";
import { assertShiftWorkAllowed, shiftDurationMinutes, shiftIntervalsConflict, shiftWithinOriginalWeek,
  validateShiftDurationPolicy, validateShiftInterval } from "./shift-management-domain.mts";
import { requireShiftTextFits } from "./shift-management-text.mts";
import { shiftFail } from "./shift-management-errors.mts";
import { civil, same } from "./stage-arrival-domain.mts";

export function shiftDay(snapshot: ShiftSnapshot, id: string): ShiftDayFacts {
  const day = snapshot.days.find(day => day.baseline.shiftDayId === id);
  if (!day) shiftFail("SHIFT_DAY_NOT_FOUND");
  return day;
}
export function effectiveShift(snapshot: ShiftSnapshot, day: ShiftDayFacts): ShiftStateV1 {
  const b = day.baseline, o = day.overlay, key = snapshot.employee.employeeNumber.slice(0, 8);
  const cancelled = o?.employeeNumber === "99999999" && o.dayType === "1";
  if (o?.employeeNumber === "99999999" && !cancelled) shiftFail("INVALID_SOURCE_DATA");
  if (cancelled ? b.employeeNumber !== key :
      b.employeeNumber !== key && (o?.employeeNumber ?? b.employeeNumber) !== key)
    shiftFail("SHIFT_DAY_NOT_FOUND");
  const location = o?.workFromHome ?? b.workFromHome;
  if (location !== "Y" && location !== "N") shiftFail("INVALID_SOURCE_DATA");
  return { shiftDayId: b.shiftDayId, status: cancelled ? "cancelled" : "scheduled",
    startLocal: o?.startLocal ?? b.startLocal, endLocal: o?.endLocal ?? b.endLocal,
    activityCode: o?.activityCode ?? b.activityCode, siteId: o?.siteId ?? b.siteId,
    workLocation: location === "Y" ? "home" : "site", paidMinutes: o?.paidMinutes ?? b.paidMinutes,
    workMinutes: o?.workMinutes ?? b.workMinutes, source: b.source };
}
export function snapshotPartnerPort(snapshot: ShiftSnapshot): PartnerShiftPort {
  // Assessment uses explicit observed policy. Missing/unknown never defaults
  // to not-required; isolated fixture policy is explicitly synthetic evidence.
  return { assess(plan) {
    const managed = snapshot.partnerPolicy.managedBreaks, cti = snapshot.partnerPolicy.cti;
    return {
      state: managed === "unknown" || cti === "unknown" ? "unknown" :
        managed === "enabled" || cti === "required" ? "required" : "not-required",
      effects: [
        ...(managed === "enabled" ? plan.effects.map(effect => ({
          kind: "managed-break-change" as const, shiftDayId: effect.after.shiftDayId,
        })) : []),
        ...(cti === "required" ? plan.effects.map(effect => ({
          kind: "cti-shift-change" as const, shiftDayId: effect.after.shiftDayId,
        })) : []),
      ],
    };
  } };
}
export function shiftBlockers(snapshot: ShiftSnapshot, selected: ShiftDayFacts | null): ShiftRuleCodeV1[] {
  const result: ShiftRuleCodeV1[] = [];
  if (snapshot.employee.statusCode !== "3") result.push("EMPLOYEE_NOT_ACTIVE");
  if (!["0", "1", null].includes(snapshot.employee.workFromHome)) result.push("UNSUPPORTED_SOURCE");
  for (const d of snapshot.dependencies) {
    if (d.state === "inactive") continue;
    const code = d.kind === "report" || d.kind === "event" ? "REPORT_REVIEW_REQUIRED" :
      d.kind === "exchange" ? "EXCHANGE_PRESENT" : d.kind === "pool" ? "POOL_DEPENDENCY_PRESENT" :
      "DEPENDENT_FLOW_UNSUPPORTED";
    result.push(code);
  }
  if (selected) {
    const b = selected.baseline, o = selected.overlay, state = effectiveShift(snapshot, selected);
    if (state.status === "cancelled") return [...new Set(result)];
    if ((o?.dayType ?? b.dayType) !== "4" || (o?.splitShift ?? b.splitShift) !== "N" ||
        (o?.exceptionType ?? b.exceptionType) !== null || (o?.timeoffType ?? b.timeoffType) !== null)
      result.push("UNSUPPORTED_DAY");
    if (b.switchDayId !== null || (o?.employeeNumber ?? b.employeeNumber) !== b.employeeNumber)
      result.push("EXCHANGE_PRESENT");
    if (!["WFM", "SHF", "fExtra"].includes(b.source)) result.push("UNSUPPORTED_SOURCE");
    if (state.siteId !== snapshot.employee.siteIds[0] ||
        !snapshot.activityOptions.some(option => option.code === state.activityCode))
      result.push("SITE_ACTIVITY_MISMATCH");
    const a = selected.attendance;
    if (a !== null) {
      if (a.MISSING_TIME != null || a.MISSING_REMARK != null ||
          a.MISS_REASON_ID != null && a.MISS_REASON_ID !== "0" && a.MISS_REASON_ID !== 0)
        result.push("MISSING_PRESENT");
      if (Object.entries(a).some(([column, value]) => {
        if (column === "SHF_EMPLOYEE_DAY_ID") return false;
        if (column === "TADREECH" || column === "MISS_REASON_ID") return value !== null && value !== "0" && value !== 0;
        return value !== null;
      })) result.push("ATTENDANCE_PRESENT");
    }
  }
  if (snapshotPartnerPort(snapshot).assess({ kind: "create", effects: [] }).state !== "not-required")
    result.push("PARTNER_REQUIRED_OR_UNKNOWN");
  return [...new Set(result)];
}
function violation(code: ShiftRuleCodeV1, row: number): never {
  return shiftFail("BUSINESS_VALIDATION_FAILED", { ruleViolations: [{ row, field: null, code }] });
}
function sourceDuration(state: ShiftStateV1): number {
  try { return shiftDurationMinutes(state); }
  catch { return shiftFail("INVALID_SOURCE_DATA"); }
}
export function planShifts(snapshot: ShiftSnapshot, entries: ShiftPlanEntry[],
  principal: PrincipalV1, now: Date, zone: string, signal?: AbortSignal): ShiftPlan {
  assertShiftWorkAllowed(signal);
  validateShiftDurationPolicy(snapshot.policy);
  if (!entries.length || entries.length > 100) shiftFail("INVALID_REQUEST");
  const csv = entries[0].row >= 2;
  if (!csv && entries.length !== 1 || entries.some(entry => csv && entry.draft.kind !== "create"))
    shiftFail("INVALID_REQUEST");
  const effects: ShiftEffectV1[] = [];
  for (const entry of entries) {
    assertShiftWorkAllowed(signal);
    const draft = entry.draft, selected = draft.kind === "create" ? null : shiftDay(snapshot, draft.shiftDayId);
    const before = selected ? effectiveShift(snapshot, selected) : null;
    if (before?.status === "cancelled") shiftFail("ALREADY_CANCELLED");
    const blockers = shiftBlockers(snapshot, selected);
    if (blockers.length) shiftFail("BUSINESS_VALIDATION_FAILED", {
      ruleViolations: blockers.map(code => ({ row: entry.row, field: null, code })),
    });
    requireShiftTextFits(principal.subject, Math.min(100, snapshot.textStorage.actorBytes), snapshot.textStorage.charset, null);
    if (before) validateShiftInterval(before, { minimumMinutes: 1, maximumMinutes: 9999999999,
      gapMinutes: snapshot.policy.gapMinutes }, now, zone, signal);
    let after: ShiftEffectV1["after"];
    const warnings: ShiftEffectV1["warningCodes"] = [];
    if (draft.kind === "cancel") {
      if (!before) shiftFail("INVALID_SOURCE_DATA");
      if (!snapshot.cancelReasonOptions.some(option => option.code === draft.reasonCode))
        violation("UNSUPPORTED_SOURCE", entry.row);
      requireShiftTextFits(draft.reasonCode, Math.min(10, snapshot.textStorage.cancelReasonBytes), snapshot.textStorage.charset, "reasonCode");
      requireShiftTextFits(draft.remark, Math.min(500, snapshot.textStorage.remarkBytes), snapshot.textStorage.charset, "remark");
      after = { ...before, status: "cancelled", source: before.source === "WFM" ? "SHF" : before.source };
      if (before.source === "WFM") warnings.push("SOURCE_BECOMES_SHF");
      warnings.push("LOGICAL_CANCEL_PRESERVES_HISTORY");
    } else {
      const interval = validateShiftInterval(draft, snapshot.policy, now, zone, signal);
      if (!snapshot.activityOptions.some(option => option.code === draft.activityCode))
        violation("SITE_ACTIVITY_MISMATCH", entry.row);
      if (draft.workLocation === "home" && snapshot.employee.workFromHome !== "1")
        violation("HOME_POLICY_UNAVAILABLE", entry.row);
      if (draft.kind === "create") {
        requireShiftTextFits(draft.remark, Math.min(500, snapshot.textStorage.remarkBytes), snapshot.textStorage.charset, "remark");
        after = { shiftDayId: null, status: "scheduled", startLocal: draft.startLocal,
          endLocal: draft.endLocal, activityCode: draft.activityCode, siteId: snapshot.employee.siteIds[0],
          workLocation: draft.workLocation, paidMinutes: interval.durationMinutes,
          workMinutes: interval.durationMinutes, source: "fExtra" };
      } else {
        if (!before) shiftFail("INVALID_SOURCE_DATA");
        const duration = String(sourceDuration(before));
        if (before.paidMinutes !== duration || before.workMinutes !== duration)
          violation("UNSUPPORTED_MINUTE_ACCOUNTING", entry.row);
        if (!shiftWithinOriginalWeek(draft, before)) violation("OUTSIDE_SCHEDULE_WEEK", entry.row);
        for (const [changed, reason] of [[draft.startLocal !== before.startLocal, draft.startReasonCode],
          [draft.endLocal !== before.endLocal, draft.endReasonCode]] as const) {
          if (changed ? reason === null || !snapshot.startEndReasonOptions.some(option => option.code === reason) :
              reason !== null) violation("UNSUPPORTED_SOURCE", entry.row);
        }
        if (draft.startLocal === before.startLocal && draft.endLocal === before.endLocal &&
            draft.activityCode === before.activityCode && draft.workLocation === before.workLocation)
          violation("NO_CHANGE", entry.row);
        after = { ...before, startLocal: draft.startLocal, endLocal: draft.endLocal,
          activityCode: draft.activityCode, workLocation: draft.workLocation,
          paidMinutes: interval.durationMinutes, workMinutes: interval.durationMinutes,
          source: before.source === "WFM" ? "SHF" : before.source };
        if (duration !== interval.durationMinutes) warnings.push("DURATION_CHANGED");
        if (before.source === "WFM") warnings.push("SOURCE_BECOMES_SHF");
      }
      for (const day of snapshot.days) {
        const old = effectiveShift(snapshot, day);
        if (old.status === "cancelled" || (day.overlay?.dayType ?? day.baseline.dayType) !== "4" ||
            old.shiftDayId === before?.shiftDayId) continue;
        if (shiftIntervalsConflict(after, old, snapshot.policy.gapMinutes))
          violation("SHIFT_OVERLAP_OR_GAP", entry.row);
      }
    }
    if (entry.overnight) warnings.push("OVERNIGHT_NORMALIZED");
    effects.push({ row: entry.row, before, after, warningCodes: warnings });
  }
  // Report all participants; no "last row wins" or per-row skipping.
  const conflicting = new Set<number>();
  for (let i = 0; i < effects.length; i++) for (let j = i + 1; j < effects.length; j++) {
    assertShiftWorkAllowed(signal);
    if (shiftIntervalsConflict(effects[i].after, effects[j].after, snapshot.policy.gapMinutes)) {
      conflicting.add(effects[i].row); conflicting.add(effects[j].row);
    }
  }
  if (conflicting.size) shiftFail("BUSINESS_VALIDATION_FAILED", {
    ruleViolations: [...conflicting].sort((a, b) => a - b).map(row =>
      ({ row, field: null, code: "SHIFT_OVERLAP_OR_GAP" })),
  });
  const kind = csv ? "csv-create" : entries[0].draft.kind;
  if (snapshotPartnerPort(snapshot).assess({ kind, effects }).state !== "not-required")
    violation("PARTNER_REQUIRED_OR_UNKNOWN", entries[0].row);
  return { kind, entries: structuredClone(entries), effects };
}
export function changedOverlay(day: ShiftDayFacts, draft: Exclude<ShiftDraftV1, { kind: "create" }>,
  effect: ShiftEffectV1, actor: string, now: Date, zone: string): ShiftOverlay {
  const b = day.baseline, o = day.overlay;
  const after: ShiftOverlay = o ? structuredClone(o) : {
    employeeNumber: draft.kind === "change" ? b.employeeNumber : null,
    dayType: draft.kind === "change" ? b.dayType : null,
    startLocal: null, endLocal: null, dayStartLocal: null, dayEndLocal: null,
    activityCode: draft.kind === "change" ? b.activityCode : null,
    siteId: draft.kind === "change" ? b.siteId : null,
    paidMinutes: null, workMinutes: null, workFromHome: b.workFromHome, splitShift: "N",
    exceptionType: draft.kind === "change" ? b.exceptionType : null,
    timeoffType: draft.kind === "change" ? b.timeoffType : null,
    startReasonCode: null, endReasonCode: null, cancelReasonCode: null, cancelRemark: null,
    modificationLocal: civil(now, zone), modificationUser: actor, preserved: {},
  };
  after.modificationLocal = civil(now, zone); after.modificationUser = actor;
  if (draft.kind === "cancel") {
    after.dayType = "1"; after.employeeNumber = "99999999";
    after.cancelReasonCode = draft.reasonCode; after.cancelRemark = draft.remark;
  } else {
    after.startLocal = effect.after.startLocal; after.dayStartLocal = effect.after.startLocal;
    after.endLocal = effect.after.endLocal; after.dayEndLocal = effect.after.endLocal;
    after.activityCode = effect.after.activityCode;
    after.paidMinutes = effect.after.paidMinutes; after.workMinutes = effect.after.workMinutes;
    after.workFromHome = effect.after.workLocation === "home" ? "Y" : "N";
    after.startReasonCode = draft.startReasonCode; after.endReasonCode = draft.endReasonCode;
  }
  return after;
}
export function sameShiftSnapshot(a: ShiftSnapshot, b: ShiftSnapshot): boolean { return same(a, b); }
