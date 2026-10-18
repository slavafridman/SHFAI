import type { ShiftSearchProblemV1 } from "./shift-search-contracts.mts";
import { SliceError } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export class ShiftSearchError extends Error {
  readonly code: ShiftSearchProblemV1["code"];
  readonly invalidParameters?: ShiftSearchProblemV1["invalidParameters"];
  constructor(code: ShiftSearchProblemV1["code"], invalidParameters?: ShiftSearchProblemV1["invalidParameters"]) {
    super(code); this.code = code; this.invalidParameters = invalidParameters;
  }
}
export function searchProblem(error: unknown, requestId: string): ShiftSearchProblemV1 {
  if (!(error instanceof ShiftSearchError)) {
    if ((error instanceof SliceError || error instanceof CurrentShiftError) &&
        ["INVALID_REQUEST", "UNAUTHENTICATED", "FORBIDDEN", "DEPENDENCY_UNAVAILABLE",
          "DEPENDENCY_TIMEOUT", "INVALID_SOURCE_DATA", "INTERNAL_ERROR"].includes(error.code)) {
      const code = error.code as ShiftSearchProblemV1["code"];
      return searchProblem(new ShiftSearchError(code, error.code === "INVALID_REQUEST"
        ? error.invalidParameters?.map(p => ({ name: p.name === "body" ? "body" : "query", reason: p.reason }))
        : undefined), requestId);
    }
    return searchProblem(new ShiftSearchError("INTERNAL_ERROR"), requestId);
  }
  const titles: Record<ShiftSearchProblemV1["code"], string> = {
    INVALID_REQUEST: "Invalid request", UNAUTHENTICATED: "Authentication required",
    FORBIDDEN: "Search scope unavailable", DEPENDENCY_UNAVAILABLE: "Search dependency unavailable",
    DEPENDENCY_TIMEOUT: "Request budget exhausted", INVALID_SOURCE_DATA: "Invalid source data",
    AMBIGUOUS_SHIFT_SEARCH: "Ambiguous shift search", INTERNAL_ERROR: "Internal error",
  };
  const status = error.code === "INVALID_REQUEST" ? 400 : error.code === "UNAUTHENTICATED" ? 401
    : error.code === "FORBIDDEN" ? 403 : error.code.startsWith("DEPENDENCY_") ? 503 : 500;
  return { type: `urn:shf:problem:${error.code}`, title: titles[error.code], status,
    code: error.code, requestId, ...(error.invalidParameters ? { invalidParameters: error.invalidParameters } : {}) };
}
