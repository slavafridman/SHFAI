import type { StageArrivalProblemCaseV1, StageArrivalProblemDraftV1 } from "./stage-arrival-contracts.mts";

const cases = {
  INVALID_REQUEST: { status: 400, code: "INVALID_REQUEST", nextAction: "correct-and-validate" },
  REQUEST_TOO_LARGE: { status: 413, code: "REQUEST_TOO_LARGE", nextAction: "correct-and-validate" },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", nextAction: "correct-and-validate" },
  UNAUTHENTICATED: { status: 401, code: "UNAUTHENTICATED", nextAction: "stop" },
  FORBIDDEN: { status: 403, code: "FORBIDDEN", nextAction: "stop" },
  LIVE_WRITES_DISABLED: { status: 403, code: "LIVE_WRITES_DISABLED", nextAction: "stop" },
  SHIFT_DAY_NOT_FOUND: { status: 404, code: "SHIFT_DAY_NOT_FOUND", nextAction: "stop" },
  BUSINESS_VALIDATION_FAILED: { status: 422, code: "BUSINESS_VALIDATION_FAILED", nextAction: "correct-and-validate" },
  STALE_PREPARATION: { status: 409, code: "STALE_PREPARATION", nextAction: "prepare-again" },
  CONFIRMATION_REQUIRED: { status: 409, code: "CONFIRMATION_REQUIRED", nextAction: "prepare-again" },
  ALREADY_REGISTERED: { status: 409, code: "ALREADY_REGISTERED", nextAction: "stop" },
  COMMAND_SCOPE_DEFERRED: { status: 409, code: "COMMAND_SCOPE_DEFERRED", nextAction: "stop" },
  COMMAND_ID_CONFLICT: { status: 409, code: "COMMAND_ID_CONFLICT", nextAction: "stop" },
  COMMAND_IN_PROGRESS: { status: 409, code: "COMMAND_IN_PROGRESS", nextAction: "stop" },
  DEPENDENCY_UNAVAILABLE: { status: 503, code: "DEPENDENCY_UNAVAILABLE", nextAction: "stop" },
  DEPENDENCY_TIMEOUT: { status: 503, code: "DEPENDENCY_TIMEOUT", nextAction: "stop" },
  AMBIGUOUS_ATTENDANCE: { status: 500, code: "AMBIGUOUS_ATTENDANCE", nextAction: "stop" },
  INVALID_SOURCE_DATA: { status: 500, code: "INVALID_SOURCE_DATA", nextAction: "stop" },
  INTERNAL_ERROR: { status: 500, code: "INTERNAL_ERROR", nextAction: "stop" },
} as const satisfies Record<string, StageArrivalProblemCaseV1>;
export type StageArrivalCode = keyof typeof cases | "COMMAND_OUTCOME_UNKNOWN";
export class StageArrivalError extends Error {
  readonly code: StageArrivalCode;
  readonly effect: "none" | "rolled-back" | "unknown";
  readonly methodNotAllowed: boolean;
  constructor(code: StageArrivalCode, effect: "none" | "rolled-back" | "unknown" = "none", methodNotAllowed = false) {
    super(code);
    this.code = effect === "unknown" ? "COMMAND_OUTCOME_UNKNOWN" : code;
    this.effect = this.code === "COMMAND_OUTCOME_UNKNOWN" ? "unknown" : effect;
    this.methodNotAllowed = methodNotAllowed;
  }
}
export function stageProblem(error: unknown, requestId: string, commandId: string | null = null): StageArrivalProblemDraftV1 {
  const e = error instanceof StageArrivalError ? error : new StageArrivalError("INTERNAL_ERROR");
  const common = { type: `urn:shf:problem:${e.code}`, title: e.code, requestId, commandId };
  if (e.code === "COMMAND_OUTCOME_UNKNOWN")
    return { ...common, status: 503, code: e.code, effect: "unknown", nextAction: "reconcile" };
  if (e.methodNotAllowed)
    return { ...common, status: 405, code: "INVALID_REQUEST", effect: "none", nextAction: "correct-and-validate" };
  return { ...common, ...cases[e.code], effect: e.effect === "rolled-back" ? "rolled-back" : "none" };
}
export function stageFail(code: StageArrivalCode): never { throw new StageArrivalError(code); }
