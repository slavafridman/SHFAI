import type { StationExitProblemV1 } from "./station-exit-contracts.mts";
import { StageArrivalError, stageProblem } from "./stage-arrival-errors.mts";
// Independent exit allowlist: arrival warning confirmation is never an exit
// API state. Strip arrival-only parameter metadata rather than widening types.
export function exitProblem(error: unknown, requestId: string, commandId: string | null = null): StationExitProblemV1 {
  const { invalidParameters: _parameters, ...p } = stageProblem(error, requestId, commandId);
  if (p.nextAction === "prepare-again") {
    if (p.code === "CONFIRMATION_REQUIRED")
      return exitProblem(new StageArrivalError("INTERNAL_ERROR"), requestId, commandId);
    return { ...p, code: "STALE_PREPARATION" };
  }
  return p;
}
