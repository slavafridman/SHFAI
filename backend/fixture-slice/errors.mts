import type { ProblemCode, ProblemV1 } from "./contracts.mts";

const definitions: Record<ProblemCode, [number, string]> = {
  INVALID_REQUEST: [400, "Invalid request"],
  UNAUTHENTICATED: [401, "Authentication required"],
  FORBIDDEN: [403, "Required capability absent"],
  SHIFT_DAY_NOT_FOUND: [404, "Shift day unavailable"],
  DEPENDENCY_UNAVAILABLE: [503, "Dependency unavailable"],
  DEPENDENCY_TIMEOUT: [503, "Request budget exhausted"],
  AMBIGUOUS_SHIFT_DAY: [500, "Ambiguous shift day"],
  INVALID_SOURCE_DATA: [500, "Invalid source data"],
  INTERNAL_ERROR: [500, "Internal error"],
};
export class SliceError extends Error {
  readonly code: ProblemCode;
  readonly invalidParameters?: ProblemV1["invalidParameters"];
  constructor(code: ProblemCode, invalidParameters?: ProblemV1["invalidParameters"]) {
    super(definitions[code][1]);
    this.code = code;
    this.invalidParameters = invalidParameters;
  }
}
export function toProblem(error: unknown, requestId: string): ProblemV1 {
  const safe = error instanceof SliceError ? error : new SliceError("INTERNAL_ERROR");
  const [status, title] = definitions[safe.code];
  return {
    type: `urn:shf:problem:${safe.code}`, title, status, code: safe.code, requestId,
    ...(safe.invalidParameters ? { invalidParameters: safe.invalidParameters } : {}),
  };
}
