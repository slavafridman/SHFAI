import type { CatalogValueV1, MokedOptionV1 } from "./current-shifts-contracts.mts";
import type { CurrentFixtureDay, CurrentFixtureEmployee } from "./current-shifts-fixture.mts";
import { projectCurrentShift } from "./current-shifts-projection.mts";
import { decimalId, text } from "./contract-validation.mts";
import { sourceFailure } from "./current-shifts-validation.mts";
import type { ShiftSearchRowV1 } from "./shift-search-contracts.mts";

export interface SearchMarkers {
  remark: string | null;
  cancelLoginApplier: string | null;
  baselineSplit: string | null;
  changedSplit: string | null;
  source: string | null;
  baselineExtension: string | null;
  changedExtension: string | null;
  exceptionCode: string | null;
}
export function validateMarkers(v: SearchMarkers): void {
  for (const key of ["remark", "cancelLoginApplier", "baselineSplit", "changedSplit", "source",
    "baselineExtension", "changedExtension"] as const)
    if (!(v[key] === null || text(v[key], key === "remark" ? 4000 : 256))) sourceFailure();
  if (!(v.exceptionCode === null || v.exceptionCode === "0" || decimalId(v.exceptionCode))) sourceFailure();
}
export function projectSearchShift(day: CurrentFixtureDay, employee: CurrentFixtureEmployee,
  team: { code: string; label: string }, parent: MokedOptionV1, markers: SearchMarkers,
  labels: { activities: readonly CatalogValueV1[]; innerJobs: readonly CatalogValueV1[]; exceptions: readonly CatalogValueV1[] },
): ShiftSearchRowV1 {
  validateMarkers(markers);
  const { attendanceDisplay: _attendance, ...core } = projectCurrentShift(day, employee, team, parent,
    undefined, { ...labels, missingReasons: [] });
  const nonblank = (v: string | null) => v !== null && v.trim().length > 0;
  return { ...core,
    activityFallback: core.activities.length === 0 && markers.exceptionCode !== null &&
      markers.exceptionCode !== "0" ? { code: markers.exceptionCode,
        label: labels.exceptions.find(v => v.code === markers.exceptionCode)?.label ?? null } : null,
    indicators: {
      hasRemark: nonblank(markers.remark), hasCancelLoginAnnotation: nonblank(markers.cancelLoginApplier),
      timeOrLocationChanged: (day.changedStartLocal !== null && day.changedStartLocal !== day.baselineStartLocal) ||
        (day.changedEndLocal !== null && day.changedEndLocal !== day.baselineEndLocal) ||
        (day.employeeKey === day.changedEmployeeKey && day.changedHome !== null && day.changedHome !== day.baselineHome),
      split: (markers.changedSplit ?? markers.baselineSplit)?.toLowerCase() === "y",
      addedStaffing: markers.source?.startsWith("f") ?? false,
      employeeReassigned: day.changedEmployeeKey !== null && day.changedEmployeeKey !== day.employeeKey,
      // AgentDayBean.getShiftExtNum: a changed start suppresses baseline fallback.
      extensionAllocated: core.workingFromHome === true
        ? markers.changedExtension !== null ||
          (day.changedStartLocal === null && markers.baselineExtension !== null) : null,
    } };
}
