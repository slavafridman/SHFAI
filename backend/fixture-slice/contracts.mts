// Local implementation of approved section 13 v0.1; shared contract stays architect-owned.
export type DecimalId = string;
export type ShiftDayId = string;
export type LocalDateTime = string;
export type CapabilityV1 = "shift-day:read" | "current-shifts:read" | "shift-search:read" | "my-shifts:read" | "shift-items:read" | "employee:read";
export interface PrincipalV1 {
  subject: string;
  provider: "synthetic" | "real";
  synthetic: boolean;
  displayName: string;
  roles: Array<"Administrator">;
  capabilities: CapabilityV1[];
  employeeId: DecimalId | null;
  resourceScope: { orgUnitIds: string[] };
}
export interface IdentityResponseV1 {
  principal: PrincipalV1;
  dataSource: "isolated-fixture" | "oracle";
}
export interface AuthenticationRequest { authorization: string | null }
export interface AuthenticationProvider {
  authenticate(request: AuthenticationRequest): Promise<PrincipalV1>;
}
export interface AccessPolicy {
  requireCapability(principal: PrincipalV1, capability: CapabilityV1): void;
  canReadShiftDay(principal: PrincipalV1,
    context: { employeeId: DecimalId; orgUnitId: string | null }): boolean;
}
export interface RawShiftDay {
  shiftDayId: ShiftDayId;
  employeeId: DecimalId;
  firstName: string;
  lastName: string;
  orgUnitId: string | null;
  baselineStartLocal: LocalDateTime | null;
  changedStartLocal: LocalDateTime | null;
  baselineEndLocal: LocalDateTime | null;
  changedEndLocal: LocalDateTime | null;
  baselineActivityData: string | null;
  changedActivityData: string | null;
  baselineSiteId: DecimalId | null;
  changedSiteId: DecimalId | null;
  stageArrivalLocal: LocalDateTime | null;
  stationArrivalLocal: LocalDateTime | null;
  stationExitLocal: LocalDateTime | null;
}
export type ShiftDayReadResult =
  | { kind: "not-found" } | { kind: "one"; row: RawShiftDay } | { kind: "ambiguous" };
export interface EmployeeShiftDayReader {
  readByDayId(shiftDayId: ShiftDayId): Promise<ShiftDayReadResult>;
}
export interface EmployeeShiftDayResponseV1 {
  employeeId: DecimalId;
  shiftDayId: ShiftDayId;
  employee: { firstName: string; lastName: string; orgUnitId: string };
  effectiveShift: {
    startLocal: LocalDateTime | null;
    endLocal: LocalDateTime | null;
    activityData: string | null;
    siteId: DecimalId | null;
  };
  attendance: {
    stageArrivalLocal: LocalDateTime | null;
    stationArrivalLocal: LocalDateTime | null;
    stationExitLocal: LocalDateTime | null;
  };
  businessTimeZone: string;
  dataSource: "isolated-fixture" | "oracle";
}
export type ProblemCode = "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN"
  | "SHIFT_DAY_NOT_FOUND" | "DEPENDENCY_UNAVAILABLE" | "DEPENDENCY_TIMEOUT"
  | "AMBIGUOUS_SHIFT_DAY" | "INVALID_SOURCE_DATA" | "INTERNAL_ERROR";
export interface ProblemV1 {
  type: string;
  title: string;
  status: number;
  code: ProblemCode;
  requestId: string;
  invalidParameters?: Array<{
    name: "employeeId" | "shiftDayId" | "query" | "body";
    reason: "required" | "invalid-format" | "unsupported";
  }>;
}
export type StartupConfig = {
  deploymentClass: "local-development" | "isolated-test-demo" | "production";
  dataSource: "isolated-fixture";
  businessTimeZone: string;
} & ({
  authenticationMode: "synthetic";
  syntheticAdministratorEnabled: true;
  syntheticOrgUnitIds: string[];
} | {
  authenticationMode: "real";
  syntheticAdministratorEnabled: false;
  realProviderId: string;
});
