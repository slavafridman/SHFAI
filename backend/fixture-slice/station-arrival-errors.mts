import type { StationArrivalProblemV1 } from "./station-arrival-contracts.mts";
import { stageProblem } from "./stage-arrival-errors.mts";

// Reuse the established sanitized cases; never expose F1-only parameter names.
export function stationProblem(error: unknown, requestId: string, commandId: string | null = null): StationArrivalProblemV1 {
  const { invalidParameters: _parameters, ...problem } = stageProblem(error, requestId, commandId);
  return problem;
}
