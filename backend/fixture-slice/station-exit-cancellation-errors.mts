import type { CancellationProblemV1 } from "./station-exit-cancellation-contracts.mts";
import { StageArrivalError, stageProblem } from "./stage-arrival-errors.mts";

export class CancellationError extends Error {
  readonly code: "EXIT_NOT_RECORDED" | "CONFIRMATION_REQUIRED";
  constructor(code: CancellationError["code"]) { super(code); this.code = code; }
}
export function cancellationProblem(error: unknown, requestId: string,
  commandId: string | null = null): CancellationProblemV1 {
  if (error instanceof CancellationError) {
    const common = { type: `urn:shf:problem:${error.code}`, title: error.code, requestId, commandId };
    return error.code === "EXIT_NOT_RECORDED"
      ? { ...common, status: 409, code: "EXIT_NOT_RECORDED", effect: "none", nextAction: "stop" }
      : { ...common, status: 409, code: "CONFIRMATION_REQUIRED", effect: "none", nextAction: "correct-and-validate" };
  }
  // Legacy codes are not implicitly admitted to the C52 union.
  if (error instanceof StageArrivalError &&
      ["ALREADY_REGISTERED", "CONFIRMATION_REQUIRED"].includes(error.code))
    return cancellationProblem(error.code === "CONFIRMATION_REQUIRED"
      ? new CancellationError("CONFIRMATION_REQUIRED") : new StageArrivalError("INTERNAL_ERROR"), requestId, commandId);
  const { invalidParameters: _unused, ...p } = stageProblem(error, requestId, commandId);
  if (p.code === "ALREADY_REGISTERED" || p.code === "CONFIRMATION_REQUIRED")
    throw Error("Unreachable cancellation problem mapping");
  if (p.status === 409 && p.nextAction === "prepare-again") return { ...p, code: "STALE_PREPARATION" };
  if (p.status === 409) {
    const code = p.code;
    return { ...p, code };
  }
  return p;
}
