import type { ShiftManagementProblemV1 } from "./shift-management-contracts.mts";

type CommonKeys = "type" | "title" | "requestId" | "commandId" |
  "invalidParameters" | "ruleViolations";
type CaseOf<P> = P extends ShiftManagementProblemV1 ? Omit<P, CommonKeys> : never;
type ProblemCase = CaseOf<ShiftManagementProblemV1>;
type Details = Pick<ShiftManagementProblemV1, "invalidParameters" | "ruleViolations">;

// Error messages contain fixed codes only, never CSV cells, identifiers or tokens.
export class ShiftManagementError extends Error {
  readonly problemCase: ProblemCase;
  readonly details: Details;
  constructor(problemCase: ProblemCase, details: Details = {}) {
    super(problemCase.code);
    this.problemCase = structuredClone(problemCase);
    this.details = structuredClone(details);
  }
  get code() { return this.problemCase.code; }
}

// Package-private provenance: only the owning UoW creates this after settling
// all work and proving ordinary rollback or zero effects without a lease.
// The proof flag distinguishes those cases; it is not a public DTO field.
export class ShiftUowRejection extends ShiftManagementError {
  readonly ordinaryRollbackProved: boolean;
  constructor(problemCase: ProblemCase, details: Details = {}, ordinaryRollbackProved = true) {
    super(problemCase, details); this.ordinaryRollbackProved = ordinaryRollbackProved;
  }
}
export function shiftAfterRollback(error: unknown): ShiftUowRejection {
  const e = error instanceof ShiftManagementError ? error :
    new ShiftManagementError({ status: 500, code: "INTERNAL_ERROR", effect: "none", nextAction: "stop" });
  const c = e.problemCase;
  if (c.effect === "unknown") throw shiftUnknown();
  return new ShiftUowRejection(c.status === 409 || c.status === 500 || c.status === 503 ?
    { ...c, effect: "rolled-back" } : c, e.details);
}

const pureCases = {
  UNAUTHENTICATED: { status: 401, code: "UNAUTHENTICATED", effect: "none", nextAction: "stop" },
  FORBIDDEN: { status: 403, code: "FORBIDDEN", effect: "none", nextAction: "stop" },
  LIVE_WRITES_DISABLED: { status: 403, code: "LIVE_WRITES_DISABLED", effect: "none", nextAction: "stop" },
  SHIFT_DAY_NOT_FOUND: { status: 404, code: "SHIFT_DAY_NOT_FOUND", effect: "none", nextAction: "stop" },
  ALREADY_CANCELLED: { status: 409, code: "ALREADY_CANCELLED", effect: "none", nextAction: "stop" },
  STALE_PREPARATION: { status: 409, code: "STALE_PREPARATION", effect: "none", nextAction: "prepare-again" },
  COMMAND_IN_PROGRESS: { status: 409, code: "COMMAND_IN_PROGRESS", effect: "none", nextAction: "stop" },
  COMMAND_ID_CONFLICT: { status: 409, code: "COMMAND_ID_CONFLICT", effect: "none", nextAction: "stop" },
  COMMAND_SCOPE_DEFERRED: { status: 409, code: "COMMAND_SCOPE_DEFERRED", effect: "none", nextAction: "stop" },
  DEPENDENCY_UNAVAILABLE: { status: 503, code: "DEPENDENCY_UNAVAILABLE", effect: "none", nextAction: "stop" },
  INVALID_REQUEST: { status: 400, code: "INVALID_REQUEST", effect: "none", nextAction: "correct-and-validate" },
  REQUEST_TOO_LARGE: { status: 413, code: "REQUEST_TOO_LARGE", effect: "none", nextAction: "correct-and-validate" },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", effect: "none", nextAction: "correct-and-validate" },
  BUSINESS_VALIDATION_FAILED: { status: 422, code: "BUSINESS_VALIDATION_FAILED", effect: "none", nextAction: "correct-and-validate" },
  INVALID_SOURCE_DATA: { status: 500, code: "INVALID_SOURCE_DATA", effect: "none", nextAction: "stop" },
  DEPENDENCY_TIMEOUT: { status: 503, code: "DEPENDENCY_TIMEOUT", effect: "none", nextAction: "stop" },
} as const satisfies Record<string, ProblemCase>;

export function shiftUnknown(): ShiftManagementError {
  return new ShiftManagementError({ status: 503, code: "COMMAND_OUTCOME_UNKNOWN",
    effect: "unknown", nextAction: "reconcile" });
}

export function shiftFail(code: keyof typeof pureCases, details: Details = {}): never {
  throw new ShiftManagementError(pureCases[code], details);
}
export function shiftProblem(error: unknown, requestId: string,
  commandId: string | null = null): ShiftManagementProblemV1 {
  const e = error instanceof ShiftManagementError ? error :
    new ShiftManagementError({
      status: 500, code: "INTERNAL_ERROR", effect: "none", nextAction: "stop",
    });
  return { type: `urn:shf:problem:${e.code}`, title: e.code, requestId, commandId,
    ...e.problemCase, ...e.details };
}
