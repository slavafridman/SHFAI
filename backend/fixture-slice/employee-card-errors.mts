import type { EmployeeOperationalCardProblemV1 } from "./employee-card-contracts.mts";
import { SliceError, toProblem } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export class EmployeeCardError extends Error {
  readonly code: EmployeeOperationalCardProblemV1["code"];
  readonly invalidParameters?: EmployeeOperationalCardProblemV1["invalidParameters"];
  constructor(code: EmployeeOperationalCardProblemV1["code"],
    invalidParameters?: EmployeeOperationalCardProblemV1["invalidParameters"]) {
    super(code); this.code = code; this.invalidParameters = invalidParameters;
  }
}
export function cardProblem(error: unknown, requestId: string): EmployeeOperationalCardProblemV1 {
  const allowed = ["INVALID_REQUEST", "UNAUTHENTICATED", "FORBIDDEN",
    "DEPENDENCY_UNAVAILABLE", "DEPENDENCY_TIMEOUT", "INVALID_SOURCE_DATA", "INTERNAL_ERROR"];
  let safe = error instanceof EmployeeCardError ? error : new EmployeeCardError("INTERNAL_ERROR");
  if ((error instanceof SliceError || error instanceof CurrentShiftError) && allowed.includes(error.code)) {
    const code = error.code;
    if (code === "INVALID_REQUEST" || code === "UNAUTHENTICATED" || code === "FORBIDDEN" ||
        code === "DEPENDENCY_UNAVAILABLE" || code === "DEPENDENCY_TIMEOUT" ||
        code === "INVALID_SOURCE_DATA" || code === "INTERNAL_ERROR")
      safe = new EmployeeCardError(code, error instanceof SliceError ? error.invalidParameters?.flatMap(p =>
        p.name === "employeeId" || p.name === "body" || p.name === "query"
          ? [{ name: p.name, reason: p.reason }] : []) : undefined);
  }
  if (safe.code === "EMPLOYEE_NOT_FOUND" || safe.code === "AMBIGUOUS_EMPLOYEE")
    return { type: `urn:shf:problem:${safe.code}`, title: safe.code === "EMPLOYEE_NOT_FOUND"
      ? "Employee not found" : "Ambiguous employee", status: safe.code === "EMPLOYEE_NOT_FOUND" ? 404 : 500,
    code: safe.code, requestId };
  const base = toProblem(new SliceError(safe.code), requestId);
  return { type: base.type, title: base.title, status: base.status, requestId, code: safe.code,
    ...(safe.invalidParameters ? { invalidParameters: safe.invalidParameters } : {}) };
}
