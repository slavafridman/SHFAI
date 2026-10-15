import type { EmployeeShiftDayResponseV1, RawShiftDay } from "./contracts.mts";
import { validateRaw } from "./contract-validation.mts";
import { SliceError } from "./errors.mts";

// AgentDayBean.getShiftStart/End/Activity/SiteId: change iff non-null.
// No activity/day-type/cancellation filter, date conversion or duration repair.
export function project(row: RawShiftDay, businessTimeZone: string): EmployeeShiftDayResponseV1 {
  validateRaw(row);
  if (row.orgUnitId === null) throw new SliceError("SHIFT_DAY_NOT_FOUND");
  return {
    employeeId: row.employeeId, shiftDayId: row.shiftDayId,
    employee: { firstName: row.firstName, lastName: row.lastName, orgUnitId: row.orgUnitId },
    effectiveShift: {
      startLocal: row.changedStartLocal !== null ? row.changedStartLocal : row.baselineStartLocal,
      endLocal: row.changedEndLocal !== null ? row.changedEndLocal : row.baselineEndLocal,
      activityData: row.changedActivityData !== null ? row.changedActivityData : row.baselineActivityData,
      siteId: row.changedSiteId !== null ? row.changedSiteId : row.baselineSiteId,
    },
    attendance: {
      stageArrivalLocal: row.stageArrivalLocal,
      stationArrivalLocal: row.stationArrivalLocal, stationExitLocal: row.stationExitLocal,
    },
    businessTimeZone, dataSource: "isolated-fixture",
  };
}
