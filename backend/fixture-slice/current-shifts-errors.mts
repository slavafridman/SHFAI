import type { CurrentShiftProblemV1 } from "./current-shifts-contracts.mts";
import { SliceError, toProblem } from "./errors.mts";

export class CurrentShiftError extends Error {
  readonly code: CurrentShiftProblemV1["code"];
  readonly invalidParameters?: CurrentShiftProblemV1["invalidParameters"];
  constructor(
    code: CurrentShiftProblemV1["code"],
    invalidParameters?: CurrentShiftProblemV1["invalidParameters"],
  ) { super(code); this.code = code; this.invalidParameters = invalidParameters; }
}
export function currentProblem(error: unknown, requestId: string): CurrentShiftProblemV1 {
  if (error instanceof CurrentShiftError) {
    const status = error.code === "INVALID_REQUEST" ? 400
      : error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403
      : error.code.startsWith("DEPENDENCY_") ? 503 : 500;
    const titles: Record<CurrentShiftProblemV1["code"], string> = {
      INVALID_REQUEST: "Invalid request", UNAUTHENTICATED: "Authentication required",
      FORBIDDEN: "Current shift scope unavailable",
      DEPENDENCY_UNAVAILABLE: "Current shifts dependency unavailable",
      DEPENDENCY_TIMEOUT: "Request budget exhausted",
      AMBIGUOUS_CURRENT_SHIFT: "Ambiguous current shift",
      INVALID_SOURCE_DATA: "Invalid source data", INTERNAL_ERROR: "Internal error",
    };
    return { type: `urn:shf:problem:${error.code}`, title: titles[error.code],
      status, code: error.code, requestId,
      ...(error.invalidParameters ? { invalidParameters: error.invalidParameters } : {}) };
  }
  if (error instanceof SliceError) {
    const problem = toProblem(error, requestId);
    if (problem.code !== "SHIFT_DAY_NOT_FOUND" && problem.code !== "AMBIGUOUS_SHIFT_DAY")
      return { type: problem.type, title: problem.title, status: problem.status,
        code: problem.code, requestId };
  }
  return currentProblem(new CurrentShiftError("INTERNAL_ERROR"), requestId);
}
