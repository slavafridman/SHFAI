import type { AccessPolicy } from "./contracts.mts";
import type { CurrentShiftAccessPolicy } from "./current-shifts-contracts.mts";
import type { ShiftSearchAccessPolicy } from "./shift-search-contracts.mts";
import { SliceError } from "./errors.mts";

export const accessPolicy: AccessPolicy & CurrentShiftAccessPolicy & ShiftSearchAccessPolicy = {
  requireShiftSearchRead(principal) {
    this.requireCapability(principal, "shift-search:read");
  },
  authorizedShiftSearchUnitIds(principal) {
    return [...principal.resourceScope.orgUnitIds];
  },
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
