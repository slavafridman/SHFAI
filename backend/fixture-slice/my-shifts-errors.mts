import type { MyShiftsProblemV1 } from "./my-shifts-contracts.mts";
import { SliceError } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export class MyShiftsError extends Error {
  readonly code: MyShiftsProblemV1["code"];
  readonly invalidParameters?: MyShiftsProblemV1["invalidParameters"];
  constructor(
    code: MyShiftsProblemV1["code"], invalidParameters?: MyShiftsProblemV1["invalidParameters"],
  ) { super(code); this.code = code; this.invalidParameters = invalidParameters; }
}
const titles: Record<MyShiftsProblemV1["code"], string> = {
  INVALID_REQUEST: "Invalid request", UNAUTHENTICATED: "Authentication required",
  FORBIDDEN: "Schedule scope unavailable", EMPLOYEE_CONTEXT_REQUIRED: "Employee context required",
  DEPENDENCY_UNAVAILABLE: "Schedule dependency unavailable", DEPENDENCY_TIMEOUT: "Request budget exhausted",
  INVALID_SOURCE_DATA: "Invalid source data", AMBIGUOUS_MY_SHIFTS: "Ambiguous schedule",
  INTERNAL_ERROR: "Internal error",
};
export function myShiftsProblem(error: unknown, requestId: string): MyShiftsProblemV1 {
  if (!(error instanceof MyShiftsError)) {
    if ((error instanceof SliceError || error instanceof CurrentShiftError) &&
        Object.hasOwn(titles, error.code)) {
      return myShiftsProblem(new MyShiftsError(error.code as MyShiftsProblemV1["code"],
        error.code === "INVALID_REQUEST" ? error.invalidParameters?.map(p => ({
          name: p.name === "body" ? "body" : "query", reason: p.reason,
        })) : undefined), requestId);
    }
    return myShiftsProblem(new MyShiftsError("INTERNAL_ERROR"), requestId);
  }
  const code = error.code;
  const status = code === "INVALID_REQUEST" ? 400 : code === "UNAUTHENTICATED" ? 401
    : code === "FORBIDDEN" ? 403 : code === "EMPLOYEE_CONTEXT_REQUIRED" ? 409
    : code.startsWith("DEPENDENCY_") ? 503 : 500;
  return { type: `urn:shf:problem:${code}`, title: titles[code], status, code, requestId,
    ...(error.invalidParameters ? { invalidParameters: error.invalidParameters } : {}) };
}
