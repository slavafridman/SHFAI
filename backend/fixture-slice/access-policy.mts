import type { AccessPolicy } from "./contracts.mts";
import type { CurrentShiftAccessPolicy } from "./current-shifts-contracts.mts";
import { SliceError } from "./errors.mts";

export const accessPolicy: AccessPolicy & CurrentShiftAccessPolicy = {
  requireCurrentShiftRead(principal) {
    this.requireCapability(principal, "current-shifts:read");
  },
  authorizedCurrentShiftUnitIds(principal) {
    return [...principal.resourceScope.orgUnitIds];
  },
  requireCapability(principal, capability) {
    if (!principal.capabilities.includes(capability)) throw new SliceError("FORBIDDEN");
  },
  canReadShiftDay(principal, context) {
    return context.orgUnitId !== null && principal.resourceScope.orgUnitIds.includes(context.orgUnitId);
  },
};
