import type {
  AuthenticationProvider, AuthenticationRequest, EmployeeShiftDayReader, PrincipalV1,
} from "./contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { SliceError } from "./errors.mts";
import { readEmployeeShiftDay } from "./read-employee-shift-day.mts";
import type { Clock, CurrentShiftReadPort, CurrentShiftRequestV1 } from "./current-shifts-contracts.mts";
import { ReadCurrentShifts, systemClock } from "./read-current-shifts.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";
import { validateCurrentRequest } from "./current-shifts-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";

export interface CurrentRuntimeOptions {
  reader: CurrentShiftReadPort;
  clock?: Clock;
}

export class SyntheticAdministratorProvider implements AuthenticationProvider {
  private readonly orgUnitIds: string[];
  constructor(configuration: unknown) {
    const config = validateRuntimeConfig(configuration);
    if (config.authenticationMode !== "synthetic") throw new Error("Synthetic provider disabled");
    this.orgUnitIds = [...config.syntheticOrgUnitIds];
  }
  async authenticate(_request: AuthenticationRequest): Promise<PrincipalV1> {
    // No password collection, token parsing, credential verification or secret logging.
    return {
      subject: "synthetic:administrator",
      displayName: "Synthetic Administrator (local/isolated only)",
      provider: "synthetic", synthetic: true, roles: ["Administrator"],
      capabilities: ["shift-day:read", "current-shifts:read"], employeeId: null,
      resourceScope: { orgUnitIds: [...this.orgUnitIds] },
    };
  }
}
// Replacement seam only. No real provider is implemented or automatically installed.
export type ProviderResolver = (id: string) => Promise<AuthenticationProvider | undefined>;
export async function createRuntime(
  configuration: unknown, reader: EmployeeShiftDayReader, resolveProvider?: ProviderResolver,
  currentOptions?: CurrentRuntimeOptions,
) {
  const config = validateRuntimeConfig(configuration);
  if (config.dataSource === "oracle-read-only" && !currentOptions)
    throw new Error("Coherent Oracle readers required");
  if (config.dataSource === "oracle-read-only" &&
      (!("dataSource" in reader) || reader.dataSource !== "oracle" ||
        !currentOptions || !("dataSource" in currentOptions.reader) ||
        currentOptions.reader.dataSource !== "oracle-read-only"))
    throw new Error("Coherent Oracle source-bound readers required");
  if (config.dataSource === "isolated-fixture" &&
      (("dataSource" in reader && reader.dataSource !== "isolated-fixture") ||
        (currentOptions && "dataSource" in currentOptions.reader &&
          currentOptions.reader.dataSource !== "isolated-fixture")))
    throw new Error("Explicit fixture source mismatch");
  if (currentOptions && config.deploymentClass === "production")
    throw new Error("Current shifts fixture requires isolated deployment");
  const current = currentOptions
    ? new ReadCurrentShifts(currentOptions.reader, currentOptions.clock ?? systemClock,
      config.businessTimeZone, config.dataSource)
    : undefined;
  if (current && config.authenticationMode === "synthetic") {
    // Validate the configured exact grants/catalog before accepting requests.
    await current.context(await new SyntheticAdministratorProvider(config).authenticate({ authorization: null }));
  }
  const configuredProvider = config.authenticationMode === "synthetic"
    ? new SyntheticAdministratorProvider(config)
    : await resolveProvider?.(config.realProviderId);
  if (!configuredProvider || typeof configuredProvider.authenticate !== "function")
    throw new Error("Configured authentication provider is not installed");
  const provider = configuredProvider;

  async function authenticate(request: AuthenticationRequest): Promise<PrincipalV1> {
    let principal: unknown;
    try { principal = await provider.authenticate(request); }
    catch (error) {
      if (error instanceof SliceError && [
        "UNAUTHENTICATED", "DEPENDENCY_UNAVAILABLE", "DEPENDENCY_TIMEOUT",
      ].includes(error.code)) throw error;
      throw new SliceError("DEPENDENCY_UNAVAILABLE");
    }
    validatePrincipal(principal);
    if (principal.provider !== config.authenticationMode) throw new SliceError("UNAUTHENTICATED");
    if (config.authenticationMode === "synthetic" &&
        (principal.resourceScope.orgUnitIds.length !== config.syntheticOrgUnitIds.length ||
        principal.resourceScope.orgUnitIds.some(unit => !config.syntheticOrgUnitIds.includes(unit))))
      throw new SliceError("UNAUTHENTICATED");
    // Explicit projection: unknown provider fields can never reach the identity DTO.
    return {
      subject: principal.subject, provider: principal.provider, synthetic: principal.synthetic,
      displayName: principal.displayName, roles: [...principal.roles],
      capabilities: [...principal.capabilities], employeeId: principal.employeeId,
      resourceScope: { orgUnitIds: [...principal.resourceScope.orgUnitIds] },
    };
  }
  return Object.freeze({
    authenticate,
    identity: (principal: PrincipalV1) => ({
      principal, dataSource: config.dataSource === "oracle-read-only" ? "oracle" as const : "isolated-fixture" as const,
    }),
    read: (principal: PrincipalV1, employeeId: string, shiftDayId: string) =>
      readEmployeeShiftDay(principal, employeeId, shiftDayId, reader, config.businessTimeZone,
        config.dataSource === "oracle-read-only" ? "oracle" : "isolated-fixture"),
    currentContext: (principal: PrincipalV1, signal?: AbortSignal) => {
      validatePrincipal(principal);
      accessPolicy.requireCurrentShiftRead(principal);
      if (!current) throw new CurrentShiftError("DEPENDENCY_UNAVAILABLE");
      return current.context(principal, signal);
    },
    currentList: (principal: PrincipalV1, request: CurrentShiftRequestV1, signal?: AbortSignal) => {
      validatePrincipal(principal);
      validateCurrentRequest(request);
      accessPolicy.requireCurrentShiftRead(principal);
      if (!current) throw new CurrentShiftError("DEPENDENCY_UNAVAILABLE");
      return current.list(principal, request, signal);
    },
  });
}
export type SliceRuntime = Awaited<ReturnType<typeof createRuntime>>;
