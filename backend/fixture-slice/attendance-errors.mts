import type { AttendanceProblemV1 } from "./attendance-contracts.mts";
import { SliceError } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";

export class AttendanceError extends Error {
  readonly code: AttendanceProblemV1["code"];
  readonly invalidParameters?: AttendanceProblemV1["invalidParameters"];
  constructor(code: AttendanceProblemV1["code"], invalidParameters?: AttendanceProblemV1["invalidParameters"]) {
    super(code); this.code = code; this.invalidParameters = invalidParameters;
  }
}
export function attendanceProblem(error: unknown, requestId: string): AttendanceProblemV1 {
  if (!(error instanceof AttendanceError)) {
    if (error instanceof SliceError || error instanceof CurrentShiftError || error instanceof ShiftSearchError) {
      const allowed = ["INVALID_REQUEST", "UNAUTHENTICATED", "FORBIDDEN", "DEPENDENCY_UNAVAILABLE",
        "DEPENDENCY_TIMEOUT", "INVALID_SOURCE_DATA", "INTERNAL_ERROR"];
      if (allowed.includes(error.code)) return attendanceProblem(new AttendanceError(
        error.code as AttendanceProblemV1["code"], error.code === "INVALID_REQUEST"
          ? error.invalidParameters?.map(p => ({ name: p.name === "body" ? "body" : "query", reason: p.reason }))
          : undefined), requestId);
    }
    return attendanceProblem(new AttendanceError("INTERNAL_ERROR"), requestId);
  }
  const titles = {
    INVALID_REQUEST: "Invalid request", UNAUTHENTICATED: "Authentication required",
    FORBIDDEN: "Attendance scope unavailable", DEPENDENCY_UNAVAILABLE: "Attendance dependency unavailable",
    DEPENDENCY_TIMEOUT: "Request budget exhausted", INVALID_SOURCE_DATA: "Invalid source data",
    AMBIGUOUS_ATTENDANCE: "Ambiguous attendance", INTERNAL_ERROR: "Internal error",
  };
  return { type: `urn:shf:problem:${error.code}`, title: titles[error.code], code: error.code, requestId,
    status: error.code === "INVALID_REQUEST" ? 400 : error.code === "UNAUTHENTICATED" ? 401
      : error.code === "FORBIDDEN" ? 403 : error.code.startsWith("DEPENDENCY_") ? 503 : 500,
    ...(error.invalidParameters ? { invalidParameters: error.invalidParameters } : {}) };
}
export function attendanceSource(): never { throw new AttendanceError("INVALID_SOURCE_DATA"); }
