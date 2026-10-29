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
import type { ShiftManagementAccessPolicy, ShiftManagementModeV1 } from "./shift-management-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { shiftFail } from "./shift-management-errors.mts";

export function shiftManagementAccessPolicy(mode: ShiftManagementModeV1): ShiftManagementAccessPolicy {
  const validate = (p: import("./contracts.mts").PrincipalV1) => {
    if (mode === "disabled") shiftFail("LIVE_WRITES_DISABLED");
    try { validatePrincipal(p, "shift-management"); }
    catch { shiftFail("UNAUTHENTICATED"); }
  };
  const requirePrepare = (p: import("./contracts.mts").PrincipalV1) => {
    validate(p);
    if (!p.capabilities.includes("shift-management:prepare")) shiftFail("FORBIDDEN");
    if (mode === "test-oracle-controlled" && (!p.synthetic || p.provider !== "synthetic" ||
        !p.capabilities.includes("shift-management:test-oracle-write"))) shiftFail("FORBIDDEN");
  };
  return {
    requirePrepare,
    requireCommand(p, kind) {
      requirePrepare(p);
      if (kind === "csv-create") {
        this.requireCsvPreview(p);
        if (!p.capabilities.includes("shift-management:csv-apply")) shiftFail("FORBIDDEN");
      } else {
        const capability = kind === "create" ? "shift-management:create" :
          kind === "change" ? "shift-management:change" : "shift-management:cancel";
        if (!p.capabilities.includes(capability)) shiftFail("FORBIDDEN");
      }
    },
    requireCsvPreview(p) {
      requirePrepare(p);
      if (!p.capabilities.includes("shift-management:csv-preview") ||
          !p.capabilities.includes("shift-management:create")) shiftFail("FORBIDDEN");
    },
    authorizedTeamIds(p) {
      validate(p);
      if (p.resourceScope.orgUnitIds.some(id => !unitCode(id))) shiftFail("UNAUTHENTICATED");
      return [...p.resourceScope.orgUnitIds];
    },
  };
}

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
export const stationExitAccessPolicy = {
  requirePrepare(p: import("./contracts.mts").PrincipalV1) {
    if (!p.synthetic || p.provider !== "synthetic" || p.employeeId !== null ||
        !p.capabilities.includes("attendance-station-exit:prepare") ||
        !p.capabilities.includes("attendance-station-exit:test-oracle-write")) stageFail("FORBIDDEN");
  },
  requireCommit(p: import("./contracts.mts").PrincipalV1) {
    this.requirePrepare(p);
    if (!p.capabilities.includes("attendance-station-exit:commit")) stageFail("FORBIDDEN");
  },
  authorizedTeamIds(p: import("./contracts.mts").PrincipalV1) {
    return stageArrivalAccessPolicy.authorizedTeamIds(p);
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
