import type { CatalogValueV1 } from "./current-shifts-contracts.mts";
import type { SelectedShiftItemV1 } from "./shift-items-contracts.mts";
import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { catalogValue } from "./current-shifts-validation.mts";
import { itemsSourceFailure, selectedItem, signedInteger } from "./shift-items-validation.mts";

// Source row conversion is pure; no elapsed-time/status/eligibility inference.
export function projectItem(v: unknown, label: string | null = null): SelectedShiftItemV1 {
  if (!record(v) || !decimalId(v.shiftDayId, 10) || !decimalId(v.stateCode) ||
      !localDateTime(v.startLocal) || !localDateTime(v.endLocal) || !signedInteger(v.durationMinutes) ||
      !(v.remark === null || text(v.remark, 1000))) itemsSourceFailure();
  const item = {
    key: { shiftDayId: v.shiftDayId, startLocal: v.startLocal },
    kind: v.stateCode === "4" ? "break" : v.stateCode === "2" ? "timeoff" : "exception",
    stateCode: v.stateCode, type: v.stateCode === "4" ? null : { code: v.typeCode, label },
    startLocal: v.startLocal, endLocal: v.endLocal, durationMinutes: v.durationMinutes,
    breakExitLocal: v.stateCode === "4" ? v.breakExitLocal : null,
    breakReturnLocal: v.stateCode === "4" ? v.breakReturnLocal : null,
    remark: v.remark === "" ? null : v.remark, sourceCode: v.sourceCode,
  };
  if (!selectedItem(item)) itemsSourceFailure();
  return item;
}
export function scopedLabels(values: readonly unknown[], codes: readonly string[]): CatalogValueV1[] {
  const result: CatalogValueV1[] = [], seen = new Set<string>();
  for (const v of values) {
    if (!record(v) || !codes.includes(String(v.code))) continue;
    if (!catalogValue(v) || seen.has(v.code)) itemsSourceFailure();
    seen.add(v.code); result.push({ code: v.code, label: v.label });
  }
  return result;
}
