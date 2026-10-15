import type {
  EmployeeShiftDayReader, EmployeeShiftDayResponseV1, PrincipalV1,
} from "./contracts.mts";
import { record, validateIds, validatePrincipal, validateRaw } from "./contract-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { SliceError } from "./errors.mts";
import { project } from "./projection.mts";

export async function readEmployeeShiftDay(
  principal: PrincipalV1, employeeId: string, shiftDayId: string,
  reader: EmployeeShiftDayReader, businessTimeZone: string,
  dataSource: EmployeeShiftDayResponseV1["dataSource"] = "isolated-fixture",
): Promise<EmployeeShiftDayResponseV1> {
  validatePrincipal(principal);
  validateIds(employeeId, shiftDayId);
  accessPolicy.requireCapability(principal, "shift-day:read");
  const result: unknown = await reader.readByDayId(shiftDayId);
  if (!record(result)) throw new SliceError("INVALID_SOURCE_DATA");
  if (result.kind === "not-found") throw new SliceError("SHIFT_DAY_NOT_FOUND");
  if (result.kind === "ambiguous") throw new SliceError("AMBIGUOUS_SHIFT_DAY");
  if (result.kind !== "one") throw new SliceError("INVALID_SOURCE_DATA");
  validateRaw(result.row);
  if (result.row.shiftDayId !== shiftDayId) throw new SliceError("INVALID_SOURCE_DATA");
  if (result.row.employeeId !== employeeId ||
      !accessPolicy.canReadShiftDay(principal, result.row)) throw new SliceError("SHIFT_DAY_NOT_FOUND");
  return project(result.row, businessTimeZone, dataSource);
}
