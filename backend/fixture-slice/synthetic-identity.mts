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
import { accessPolicy, myShiftsAccessPolicy, shiftItemsAccessPolicy } from "./access-policy.mts";
import { validateRuntimeConfig } from "./runtime-config.mts";
import type { ShiftSearchReadPort, ShiftSearchRequestV1 } from "./shift-search-contracts.mts";
import { ReadShiftSearch } from "./read-shift-search.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";
import { validateSearchRequest } from "./shift-search-validation.mts";
import { ReadMyShifts } from "./read-my-shifts.mts";
import type { MyShiftsReader } from "./read-my-shifts.mts";
import type { MyShiftsContextRequestV1, MyShiftsRequestV1 } from "./my-shifts-contracts.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";
import { validateMyShiftsRequest } from "./my-shifts-validation.mts";
import type { SelectedShiftItemsReadPort, SelectedShiftItemsRequestV1 } from "./shift-items-contracts.mts";
import { GetSelectedShiftItems } from "./read-shift-items.mts";
import { ShiftItemsError } from "./shift-items-errors.mts";
import { validateItemsRequest } from "./shift-items-validation.mts";
import type { EmployeeOperationalCardReadPort, EmployeeOperationalCardRequestV1 } from "./employee-card-contracts.mts";
import { GetEmployeeOperationalCard, validateCardRequest } from "./read-employee-card.mts";
import { employeeCardAccessPolicy } from "./access-policy.mts";

export interface CurrentRuntimeOptions {
  reader: CurrentShiftReadPort;
  clock?: Clock;
  searchReader?: ShiftSearchReadPort;
  myShiftsReader?: MyShiftsReader;
  shiftItemsReader?: SelectedShiftItemsReadPort;
  employeeCardReader?: EmployeeOperationalCardReadPort;
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
      capabilities: ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"], employeeId: null,
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
  if (currentOptions?.searchReader && (!("dataSource" in currentOptions.searchReader) ||
      currentOptions.searchReader.dataSource !== config.dataSource))
    throw new Error("Explicit search source mismatch");
  const search = currentOptions?.searchReader
    ? new ReadShiftSearch(currentOptions.searchReader, currentOptions.clock ?? systemClock,
      config.businessTimeZone, config.dataSource) : undefined;
  if (currentOptions?.myShiftsReader && (!("dataSource" in currentOptions.myShiftsReader) ||
      currentOptions.myShiftsReader.dataSource !== config.dataSource))
    throw new Error("Explicit schedule source mismatch");
  const schedulePolicy = myShiftsAccessPolicy(config);
  if (currentOptions?.shiftItemsReader && currentOptions.shiftItemsReader.dataSource !== config.dataSource)
    throw new Error("Explicit shift items source mismatch");
  const itemsPolicy = shiftItemsAccessPolicy(config);
  const cardPolicy = employeeCardAccessPolicy(config);
  if (currentOptions?.employeeCardReader && currentOptions.employeeCardReader.dataSource !== config.dataSource)
    throw new Error("Explicit employee card source mismatch");
  const card = currentOptions?.employeeCardReader
    ? new GetEmployeeOperationalCard(currentOptions.employeeCardReader, cardPolicy, config.businessTimeZone) : undefined;
  const shiftItems = currentOptions?.shiftItemsReader
    ? new GetSelectedShiftItems(currentOptions.shiftItemsReader, itemsPolicy, config.businessTimeZone) : undefined;
  const schedule = currentOptions?.myShiftsReader
    ? new ReadMyShifts(currentOptions.myShiftsReader, schedulePolicy, currentOptions.clock ?? systemClock,
      config.businessTimeZone, config.dataSource) : undefined;
  if (current && config.authenticationMode === "synthetic") {
    // Validate the configured exact grants/catalog before accepting requests.
    await current.context(await new SyntheticAdministratorProvider(config).authenticate({ authorization: null }));
    if (search) await search.context(await new SyntheticAdministratorProvider(config).authenticate({ authorization: null }));
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
    employeeCard: async (p: PrincipalV1, request: EmployeeOperationalCardRequestV1, signal?: AbortSignal) => {
      validatePrincipal(p); validateCardRequest(request); cardPolicy.requireEmployeeRead(p);
      if (!cardPolicy.canReadSelectedEmployee(p, request.employeeId)) throw new SliceError("FORBIDDEN");
      if (!card) throw new SliceError("DEPENDENCY_UNAVAILABLE");
      return await card.execute(p, request, signal);
    },
    shiftItems: (p: PrincipalV1, request: SelectedShiftItemsRequestV1, signal?: AbortSignal) => {
      validatePrincipal(p); validateItemsRequest(request); itemsPolicy.requireSelectedShiftItemsRead(p);
      if (!itemsPolicy.canReadSelectedEmployee(p, request.employeeId)) throw new ShiftItemsError("FORBIDDEN");
      if (!shiftItems) throw new ShiftItemsError("DEPENDENCY_UNAVAILABLE");
      return shiftItems.read(p, request, signal);
    },
    myShiftsContext: (p: PrincipalV1, request: MyShiftsContextRequestV1, signal?: AbortSignal) => {
      validatePrincipal(p); validateMyShiftsRequest(request, false); schedulePolicy.requireMyShiftsRead(p);
      if (request.mode === "selected" && !schedulePolicy.canSelectEmployee(p)) throw new MyShiftsError("FORBIDDEN");
      if (!schedule) throw new MyShiftsError("DEPENDENCY_UNAVAILABLE");
      return schedule.context(p, request, signal);
    },
    myShiftsList: (p: PrincipalV1, request: MyShiftsRequestV1, signal?: AbortSignal) => {
      validatePrincipal(p); validateMyShiftsRequest(request, true); schedulePolicy.requireMyShiftsRead(p);
      if (request.mode === "selected" && !schedulePolicy.canSelectEmployee(p)) throw new MyShiftsError("FORBIDDEN");
      if (!schedule) throw new MyShiftsError("DEPENDENCY_UNAVAILABLE");
      return schedule.list(p, request, signal);
    },
    searchContext: (principal: PrincipalV1, signal?: AbortSignal) => {
      validatePrincipal(principal); accessPolicy.requireShiftSearchRead(principal);
      if (!search) throw new ShiftSearchError("DEPENDENCY_UNAVAILABLE");
      return search.context(principal, signal);
    },
    searchList: (principal: PrincipalV1, request: ShiftSearchRequestV1, signal?: AbortSignal) => {
      validatePrincipal(principal); validateSearchRequest(request); accessPolicy.requireShiftSearchRead(principal);
      if (!search) throw new ShiftSearchError("DEPENDENCY_UNAVAILABLE");
      return search.list(principal, request, signal);
    },
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
