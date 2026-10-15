import type {
  AuthenticationProvider, AuthenticationRequest, EmployeeShiftDayReader, PrincipalV1, StartupConfig,
} from "./contracts.mts";
import { validateConfig, validatePrincipal } from "./contract-validation.mts";
import { SliceError } from "./errors.mts";
import { readEmployeeShiftDay } from "./read-employee-shift-day.mts";

export class SyntheticAdministratorProvider implements AuthenticationProvider {
  private readonly orgUnitIds: string[];
  constructor(configuration: unknown) {
    const config = validateConfig(configuration);
    if (config.authenticationMode !== "synthetic") throw new Error("Synthetic provider disabled");
    this.orgUnitIds = [...config.syntheticOrgUnitIds];
  }
  async authenticate(_request: AuthenticationRequest): Promise<PrincipalV1> {
    // No password collection, token parsing, credential verification or secret logging.
    return {
      subject: "synthetic:administrator",
      displayName: "Synthetic Administrator (local/isolated only)",
      provider: "synthetic", synthetic: true, roles: ["Administrator"],
      capabilities: ["shift-day:read"], employeeId: null,
      resourceScope: { orgUnitIds: [...this.orgUnitIds] },
    };
  }
}
// Replacement seam only. No real provider is implemented or automatically installed.
export type ProviderResolver = (id: string) => Promise<AuthenticationProvider | undefined>;
export async function createRuntime(
  configuration: unknown, reader: EmployeeShiftDayReader, resolveProvider?: ProviderResolver,
) {
  const config: StartupConfig = validateConfig(configuration);
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
    identity: (principal: PrincipalV1) => ({ principal, dataSource: "isolated-fixture" as const }),
    read: (principal: PrincipalV1, employeeId: string, shiftDayId: string) =>
      readEmployeeShiftDay(principal, employeeId, shiftDayId, reader, config.businessTimeZone),
  });
}
export type SliceRuntime = Awaited<ReturnType<typeof createRuntime>>;
