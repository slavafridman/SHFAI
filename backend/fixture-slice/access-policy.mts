import type { AccessPolicy } from "./contracts.mts";
import type { CurrentShiftAccessPolicy } from "./current-shifts-contracts.mts";
import type { ShiftSearchAccessPolicy } from "./shift-search-contracts.mts";
import { SliceError } from "./errors.mts";
import type { MyShiftsAccessPolicy } from "./my-shifts-contracts.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";
import type { SelectedShiftItemsAccessPolicy } from "./shift-items-contracts.mts";

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

export function shiftItemsAccessPolicy(configuration: unknown): SelectedShiftItemsAccessPolicy {
  const config = validateRuntimeConfig(configuration);
  return {
    requireSelectedShiftItemsRead(p) {
      accessPolicy.requireCapability(p, "shift-items:read");
      accessPolicy.requireCapability(p, "shift-day:read");
    },
    canReadSelectedEmployee(p, employeeId) {
      if (p.provider === "real") return config.authenticationMode === "real" && p.employeeId === employeeId;
      return config.authenticationMode === "synthetic" && config.deploymentClass !== "production" &&
        config.syntheticAdministratorEnabled && p.synthetic && p.employeeId === null &&
        p.subject === "synthetic:administrator" && p.roles.includes("Administrator");
    },
    authorizedSelectedShiftItemsUnitIds(p) { return [...p.resourceScope.orgUnitIds]; },
  };
}

// Constructed only from validated startup configuration, never a UI role/grant.
export function myShiftsAccessPolicy(configuration: unknown): MyShiftsAccessPolicy {
  const config = validateRuntimeConfig(configuration);
  return {
    requireMyShiftsRead(p) { accessPolicy.requireCapability(p, "my-shifts:read"); },
    authorizedMyShiftsUnitIds(p) { return [...p.resourceScope.orgUnitIds]; },
    canSelectEmployee(p) {
      return config.deploymentClass !== "production" && config.authenticationMode === "synthetic" &&
        config.syntheticAdministratorEnabled && p.provider === "synthetic" && p.synthetic &&
        p.subject === "synthetic:administrator" && p.roles.includes("Administrator") &&
        p.capabilities.includes("my-shifts:read");
    },
  };
}
