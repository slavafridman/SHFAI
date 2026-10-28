import type { AccessPolicy } from "./contracts.mts";
import type { CurrentShiftAccessPolicy } from "./current-shifts-contracts.mts";
import type { ShiftSearchAccessPolicy } from "./shift-search-contracts.mts";
import { SliceError } from "./errors.mts";
import type { MyShiftsAccessPolicy } from "./my-shifts-contracts.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";
import type { SelectedShiftItemsAccessPolicy } from "./shift-items-contracts.mts";
import type { EmployeeOperationalCardAccessPolicy } from "./employee-card-contracts.mts";
import type { AttendanceAccessPolicy } from "./attendance-contracts.mts";
import type { StageArrivalAccessPolicy } from "./stage-arrival-contracts.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { unitCode } from "./current-shifts-validation.mts";
import type { StationArrivalAccessPolicy } from "./station-arrival-contracts.mts";

export const stationArrivalAccessPolicy: StationArrivalAccessPolicy = {
  requirePrepare(p) {
    if (!p.capabilities.includes("attendance-station-arrival:prepare")) stageFail("FORBIDDEN");
  },
  requireCommit(p) {
    this.requirePrepare(p);
    if (!p.capabilities.includes("attendance-station-arrival:commit")) stageFail("FORBIDDEN");
  },
  authorizedTeamIds(p) { return stageArrivalAccessPolicy.authorizedTeamIds(p); },
};

export const stageArrivalAccessPolicy: StageArrivalAccessPolicy = {
  requirePrepare(p) {
    if (!p.capabilities.includes("attendance-stage-arrival:prepare")) stageFail("FORBIDDEN");
  },
  requireCommit(p) {
    this.requirePrepare(p);
    if (!p.capabilities.includes("attendance-stage-arrival:commit")) stageFail("FORBIDDEN");
  },
  authorizedTeamIds(p) {
    const grants = [...p.resourceScope.orgUnitIds];
    if (grants.length > 100 || grants.some(g => !unitCode(g)) ||
        new Set(grants).size !== grants.length) stageFail("UNAUTHENTICATED");
    return grants;
  },
};

export const nativeStageArrivalAccessPolicy = {
  requirePrepare(p: import("./contracts.mts").PrincipalV1) {
    stageArrivalAccessPolicy.requirePrepare(p);
    if (!p.synthetic || p.provider !== "synthetic" || p.employeeId !== null ||
        !p.capabilities.includes("attendance-stage-arrival:test-oracle-write")) stageFail("FORBIDDEN");
  },
  requireCommit(p: import("./contracts.mts").PrincipalV1) {
    this.requirePrepare(p); stageArrivalAccessPolicy.requireCommit(p);
  },
};
export const nativeStationArrivalAccessPolicy = {
  requirePrepare(p: import("./contracts.mts").PrincipalV1) {
    stationArrivalAccessPolicy.requirePrepare(p);
    if (!p.synthetic || p.provider !== "synthetic" || p.employeeId !== null ||
        !p.capabilities.includes("attendance-station-arrival:test-oracle-write")) stageFail("FORBIDDEN");
  },
  requireCommit(p: import("./contracts.mts").PrincipalV1) {
    this.requirePrepare(p); stationArrivalAccessPolicy.requireCommit(p);
  },
};

export function employeeCardAccessPolicy(configuration: unknown): EmployeeOperationalCardAccessPolicy {
  const config = validateRuntimeConfig(configuration);
  const actor = shiftItemsAccessPolicy(config);
  return {
    requireEmployeeRead(p) { accessPolicy.requireCapability(p, "employee:read"); },
    canReadSelectedEmployee: (p, id) => actor.canReadSelectedEmployee(p, id),
    authorizedEmployeeTeamIds: p => [...p.resourceScope.orgUnitIds],
  };
}

export const accessPolicy: AccessPolicy & CurrentShiftAccessPolicy & ShiftSearchAccessPolicy & AttendanceAccessPolicy = {
  requireAttendanceRead(p) { this.requireCapability(p, "attendance:read"); },
  authorizedAttendanceTeamIds(p) { return [...p.resourceScope.orgUnitIds]; },
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
