import type { SelectedShiftItemsProblemV1 } from "./shift-items-contracts.mts";
import { SliceError, toProblem } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";

export class ShiftItemsError extends Error {
  readonly code: SelectedShiftItemsProblemV1["code"];
  readonly invalidParameters?: SelectedShiftItemsProblemV1["invalidParameters"];
  constructor(code: SelectedShiftItemsProblemV1["code"],
    invalidParameters?: SelectedShiftItemsProblemV1["invalidParameters"]) {
    super(code); this.code = code; this.invalidParameters = invalidParameters;
  }
}
export function itemsProblem(error: unknown, requestId: string): SelectedShiftItemsProblemV1 {
  const safe = error instanceof ShiftItemsError ? error
    : error instanceof SliceError ? new ShiftItemsError(error.code, error.invalidParameters)
      : error instanceof CurrentShiftError && error.code === "INVALID_SOURCE_DATA"
        ? new ShiftItemsError("INVALID_SOURCE_DATA") : new ShiftItemsError("INTERNAL_ERROR");
  if (safe.code === "AMBIGUOUS_SHIFT_ITEMS") return {
    type: "urn:shf:problem:AMBIGUOUS_SHIFT_ITEMS", title: "Ambiguous shift items",
    status: 500, code: safe.code, requestId,
  };
  const base = toProblem(new SliceError(safe.code), requestId);
  return { ...base, ...(safe.invalidParameters ? { invalidParameters: safe.invalidParameters } : {}) };
}
