import type { AccessPolicy } from "./contracts.mts";
import { SliceError } from "./errors.mts";

export const accessPolicy: AccessPolicy = {
  requireCapability(principal, capability) {
    if (!principal.capabilities.includes(capability)) throw new SliceError("FORBIDDEN");
  },
  canReadShiftDay(principal, context) {
    return context.orgUnitId !== null && principal.resourceScope.orgUnitIds.includes(context.orgUnitId);
  },
};
