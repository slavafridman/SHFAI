import type { RawShiftDay } from "./contracts.mts";
import type { CatalogValueV1 } from "./current-shifts-contracts.mts";
import type { SelectedShiftItemsReadPort, SelectedShiftItemsReadSelection,
  SelectedShiftItemsReadResult, SelectedShiftItemsV1 } from "./shift-items-contracts.mts";
import { record, decimalId, validateRaw } from "./contract-validation.mts";
import { activityTokens } from "./current-shifts-projection.mts";
import { itemsDisplayContext, itemsSourceFailure, signedInteger, validateItemsRequest } from "./shift-items-validation.mts";
import { projectItem, scopedLabels } from "./shift-items-projection.mts";
import { catalogCode } from "./current-shifts-validation.mts";
import { isDeepStrictEqual } from "node:util";

// Isolated test double only. Context rows are the full resolved detail join,
// including multiplicity, not a directory from which to select the first owner.
export interface ShiftItemsFixtureData {
  contexts: Array<{ detail: RawShiftDay; unit: SelectedShiftItemsV1["displayContext"]["unit"];
    innerJobCode: string | null }>;
  items: Array<{ shiftDayId: string; stateCode: string; typeCode: string | null;
    startLocal: string | null; endLocal: string | null; durationMinutes: string | null;
    breakExitLocal: string | null; breakReturnLocal: string | null; remark: string | null;
    sourceCode: string; cancellationReason: string | null }>;
  activities: CatalogValueV1[];
  innerJobs: CatalogValueV1[];
  exceptions: CatalogValueV1[];
  timeoffs: CatalogValueV1[];
}
export class ShiftItemsFixtureReader implements SelectedShiftItemsReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly data: ShiftItemsFixtureData;
  constructor(value: unknown) {
    if (!record(value) || !["contexts", "items", "activities", "innerJobs", "exceptions", "timeoffs"]
      .every(k => Array.isArray(value[k]))) itemsSourceFailure();
    this.data = structuredClone(value) as unknown as ShiftItemsFixtureData;
  }
  assertDetailCoherence(rows: readonly RawShiftDay[]) {
    for (const c of this.data.contexts) validateRaw(c.detail);
    const remaining = [...rows];
    for (const c of this.data.contexts) {
      const index = remaining.findIndex(r => isDeepStrictEqual(r, c.detail));
      if (index < 0) throw Error("Explicit fixture detail snapshot mismatch");
      remaining.splice(index, 1);
    }
    if (remaining.length)
      throw Error("Explicit fixture detail snapshot mismatch");
  }
  async read(s: SelectedShiftItemsReadSelection, signal: AbortSignal): Promise<SelectedShiftItemsReadResult> {
    validateItemsRequest({ employeeId: s.employeeId, shiftDayId: s.shiftDayId,
      limit: s.limit, offset: s.offset, sort: s.sort });
    signal.throwIfAborted();
    const snapshot = structuredClone(this.data);
    if (!snapshot.contexts.every(c => record(c) && record(c.detail)) ||
        !snapshot.items.every(r => record(r) && typeof r.shiftDayId === "string")) itemsSourceFailure();
    const contexts = snapshot.contexts.filter(c => c.detail.shiftDayId === s.shiftDayId);
    if (contexts.length > 1) return { kind: "ambiguous-context" };
    if (!contexts.length) return { kind: "not-found" };
    const c = contexts[0], d = c.detail;
    validateRaw(d);
    if (d.employeeId !== s.employeeId || d.orgUnitId === null || !s.exactTeamIds.includes(d.orgUnitId))
      return { kind: "not-found" };
    const tokens = activityTokens(d.changedActivityData ?? d.baselineActivityData);
    const activityLabels = scopedLabels(snapshot.activities, tokens);
    if (!(c.innerJobCode === null || catalogCode(c.innerJobCode))) itemsSourceFailure();
    const job = c.innerJobCode === null || c.innerJobCode === "00" || c.innerJobCode === "" ? null : c.innerJobCode;
    const jobLabels = scopedLabels(snapshot.innerJobs, job === null ? [] : [job]);
    const displayContext = { unit: c.unit,
      activities: tokens.map(code => ({ code, label: activityLabels.find(v => v.code === code)?.label ?? null })),
      innerJob: job === null ? null : { code: job, label: jobLabels.find(v => v.code === job)?.label ?? null } };
    if (!itemsDisplayContext(displayContext) || displayContext.unit.code !== d.orgUnitId) itemsSourceFailure();
    for (const r of snapshot.items) if (r.shiftDayId === s.shiftDayId && !signedInteger(r.stateCode)) itemsSourceFailure();
    const members = snapshot.items.filter(r => r.shiftDayId === s.shiftDayId &&
      r.cancellationReason === null && decimalId(r.stateCode));
    // Fixture uses in-memory rows; Oracle performs this full-selection probe SQL-side.
    const seen = new Set<string | null>();
    for (const row of members) {
      if (seen.has(row.startLocal)) return { kind: "ambiguous-items" };
      seen.add(row.startLocal);
    }
    const page = members.sort((a, b) => (a.startLocal ?? "") < (b.startLocal ?? "") ? -1 : 1)
      .slice(s.offset, s.offset + s.limit + 1);
    const codes = (state: "2" | "other") => page.slice(0, s.limit).filter(r =>
      state === "2" ? r.stateCode === "2" : r.stateCode !== "2" && r.stateCode !== "4")
      .map(r => { if (!signedInteger(r.typeCode)) itemsSourceFailure(); return r.typeCode; });
    const timeoffs = scopedLabels(snapshot.timeoffs, codes("2")), exceptions = scopedLabels(snapshot.exceptions, codes("other"));
    const rows = page.map((r, i) => projectItem(r, i >= s.limit ? null :
      (r.stateCode === "2" ? timeoffs : exceptions).find(v => v.code === r.typeCode)?.label ?? null));
    signal.throwIfAborted();
    return { kind: "one", detail: d, displayContext, rows };
  }
}
