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
import type { AttendanceReadPort, AttendanceRequestV1 } from "./attendance-contracts.mts";
import { ReadAttendance } from "./read-attendance.mts";
import { validateAttendanceRequest } from "./attendance-validation.mts";
import { AttendanceError } from "./attendance-errors.mts";
import { validateStageArrivalMode } from "./stage-arrival-validation.mts";
import { StageArrivalApplication } from "./stage-arrival-application.mts";
import { MemoryStageArrivalStore } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { same } from "./stage-arrival-domain.mts";
import type { OracleStageArrivalApplication } from "./oracle-stage-arrival-application.mts";
import type { StageArrivalReceiptDraftV1 } from "./stage-arrival-contracts.mts";
import type { NativeStageArrivalReceiptV1 } from "./oracle-stage-arrival-contracts.mts";
import { stationMode } from "./station-arrival-validation.mts";
import { StationArrivalApplication } from "./station-arrival-application.mts";
import type { OracleStationArrivalApplication } from "./oracle-station-arrival-application.mts";
import type { StationArrivalReceiptV1 } from "./station-arrival-contracts.mts";
import type { NativeStationArrivalReceiptV1 } from "./oracle-station-arrival-contracts.mts";
import { stationExitMode } from "./native-station-exit-config.mts";
import type { OracleStationExitApplication } from "./oracle-station-exit-application.mts";
import { shiftManagementMode } from "./shift-management-config.mts";
import { shiftManagementActorCapabilities } from "./shift-management-capabilities.mts";
import { ShiftManagementApplication } from "./shift-management-application.mts";

export interface CurrentRuntimeOptions {
  reader: CurrentShiftReadPort;
  clock?: Clock;
  searchReader?: ShiftSearchReadPort;
  myShiftsReader?: MyShiftsReader;
  shiftItemsReader?: SelectedShiftItemsReadPort;
  employeeCardReader?: EmployeeOperationalCardReadPort;
  attendanceReader?: AttendanceReadPort;
  stageArrivalStore?: MemoryStageArrivalStore;
  nativeStageArrival?: OracleStageArrivalApplication;
  nativeStationArrival?: OracleStationArrivalApplication;
  nativeStationExit?: OracleStationExitApplication;
  shiftManagement?: ShiftManagementApplication;
}

export class SyntheticAdministratorProvider implements AuthenticationProvider {
  private readonly orgUnitIds: string[];
  private readonly stageArrivalEnabled: boolean;
  private readonly nativeStageArrivalEnabled: boolean;
  private readonly stationArrivalEnabled: boolean;
  private readonly nativeStationArrivalEnabled: boolean;
  private readonly nativeExitEnabled: boolean;
  private readonly managementEnabled: boolean;
  constructor(configuration: unknown) {
    const config = validateRuntimeConfig(configuration);
    if (config.authenticationMode !== "synthetic") throw new Error("Synthetic provider disabled");
    this.orgUnitIds = [...config.syntheticOrgUnitIds];
    this.stageArrivalEnabled = validateStageArrivalMode(configuration) === "isolated-fixture";
    this.nativeStageArrivalEnabled = validateStageArrivalMode(configuration) === "test-oracle-controlled";
    this.stationArrivalEnabled = stationMode(configuration) === "isolated-fixture";
    this.nativeStationArrivalEnabled = stationMode(configuration) === "test-oracle-controlled";
    this.nativeExitEnabled = stationExitMode(configuration) === "test-oracle-controlled";
    this.managementEnabled = shiftManagementMode(configuration) !== "disabled";
  }
  async authenticate(_request: AuthenticationRequest): Promise<PrincipalV1> {
    // No password collection, token parsing, credential verification or secret logging.
    return {
      subject: "synthetic:administrator",
      displayName: "Synthetic Administrator (local/isolated only)",
      provider: "synthetic", synthetic: true, roles: ["Administrator"],
      capabilities: this.managementEnabled ? [...shiftManagementActorCapabilities] :
        ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read", "attendance:read",
        ...(this.stageArrivalEnabled || this.nativeStageArrivalEnabled ? ["attendance-stage-arrival:prepare" as const, "attendance-stage-arrival:commit" as const] : []),
        ...(this.nativeStageArrivalEnabled ? ["attendance-stage-arrival:test-oracle-write" as const] : []),
        ...(this.stationArrivalEnabled || this.nativeStationArrivalEnabled ? ["attendance-station-arrival:prepare" as const, "attendance-station-arrival:commit" as const] : []),
        ...(this.nativeStationArrivalEnabled ? ["attendance-station-arrival:test-oracle-write" as const] : []),
        ...(this.nativeExitEnabled ? ["attendance-station-exit:prepare" as const, "attendance-station-exit:commit" as const,
          "attendance-station-exit:test-oracle-write" as const] : [])], employeeId: null,
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
  const stageMode = validateStageArrivalMode(configuration);
  const station = stationMode(configuration);
  const exitMode = stationExitMode(configuration);
  const managementMode = shiftManagementMode(configuration);
  if (managementMode === "test-oracle-controlled")
    throw Error("Native shift-management factory not installed");
  if (managementMode === "isolated-fixture" && (!(currentOptions?.shiftManagement instanceof ShiftManagementApplication) ||
      currentOptions.shiftManagement.reference.mode !== "isolated-fixture" ||
      currentOptions.shiftManagement.reference.dataSource !== "isolated-fixture"))
    throw Error("Explicit isolated management application required");
  if (managementMode === "disabled" && currentOptions?.shiftManagement)
    throw Error("Management application requires explicit mode");
  if (currentOptions && Object.keys(currentOptions).some(k => !["reader", "clock", "searchReader", "myShiftsReader",
    "shiftItemsReader", "employeeCardReader", "attendanceReader", "stageArrivalStore", "nativeStageArrival", "nativeStationArrival", "nativeStationExit", "shiftManagement"].includes(k)))
    throw new Error("Unsupported backend adapter");
  if (currentOptions?.stageArrivalStore && stageMode !== "isolated-fixture")
    throw new Error("Stage-arrival store requires explicit isolated mode");
  if (currentOptions?.nativeStageArrival && stageMode !== "test-oracle-controlled")
    throw new Error("Explicit controlled native TEST adapter required");
  if (currentOptions?.nativeStationArrival && station !== "test-oracle-controlled")
    throw Error("Explicit controlled station TEST adapter required");
  if (currentOptions?.nativeStationExit && exitMode !== "test-oracle-controlled")
    throw Error("Explicit controlled exit TEST adapter required");
  if (exitMode === "test-oracle-controlled") {
    const { OracleStationExitApplication } = await import("./oracle-station-exit-application.mts");
    if (!(currentOptions?.nativeStationExit instanceof OracleStationExitApplication) ||
        currentOptions?.nativeStageArrival || currentOptions?.nativeStationArrival || currentOptions?.stageArrivalStore)
      throw Error("Exclusive controlled exit TEST adapter required");
  }
  if (station === "test-oracle-controlled") {
    const { OracleStationArrivalApplication } = await import("./oracle-station-arrival-application.mts");
    if (!(currentOptions?.nativeStationArrival instanceof OracleStationArrivalApplication) ||
        currentOptions?.nativeStageArrival || currentOptions?.stageArrivalStore)
      throw Error("Exclusive controlled station TEST adapter required");
  }
  if (stageMode === "test-oracle-controlled") {
    const { OracleStageArrivalApplication } = await import("./oracle-stage-arrival-application.mts");
    if (!(currentOptions?.nativeStageArrival instanceof OracleStageArrivalApplication))
      throw new Error("Explicit controlled native TEST adapter required");
  }
  if (stageMode === "isolated-fixture") {
    if (!(currentOptions?.stageArrivalStore instanceof MemoryStageArrivalStore))
      throw new Error("Process-owned isolated stage-arrival store required");
    for (const adapter of [reader, currentOptions.reader, currentOptions.searchReader,
      currentOptions.myShiftsReader, currentOptions.shiftItemsReader, currentOptions.employeeCardReader,
      currentOptions.attendanceReader]) {
      if (adapter && (!("dataSource" in adapter) || adapter.dataSource !== "isolated-fixture"))
        throw new Error("F1 prohibits mixed/native adapters");
      if (adapter && (!("stageArrivalSource" in adapter) ||
          !same(adapter.stageArrivalSource, currentOptions.stageArrivalStore.source)))
        throw new Error("F1 requires same-session fixture read projections");
    }
  }
  const stageArrival = stageMode === "isolated-fixture" && currentOptions?.stageArrivalStore
    ? new StageArrivalApplication(currentOptions.stageArrivalStore, currentOptions.clock ?? systemClock, config.businessTimeZone)
    : currentOptions?.nativeStageArrival;
  if (currentOptions?.stageArrivalStore?.stationEnabled && station !== "isolated-fixture")
    throw Error("Station store requires explicit joint mode");
  const stationArrival = station === "isolated-fixture" && currentOptions?.stageArrivalStore
    ? new StationArrivalApplication(currentOptions.stageArrivalStore, currentOptions.clock ?? systemClock, config.businessTimeZone)
    : currentOptions?.nativeStationArrival;
  if (station === "isolated-fixture" && !stationArrival) throw Error("Joint fixture store required");
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
  const attendance = currentOptions?.attendanceReader
    ? new ReadAttendance(currentOptions.attendanceReader, currentOptions.clock ?? systemClock,
      config.businessTimeZone, config.dataSource) : undefined;
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
    validatePrincipal(principal, managementMode !== "disabled" ? "shift-management" :
      exitMode === "test-oracle-controlled" ? "native-exit" :
      station === "test-oracle-controlled" ? "native-station" : station === "isolated-fixture" ? "joint-fixture" : stageMode);
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
    shiftManagement: currentOptions?.shiftManagement,
    attendanceStationExitMode: exitMode,
    stationExitContext: (p: unknown, target: unknown, signal?: AbortSignal) => {
      if (!currentOptions?.nativeStationExit) stageFail("LIVE_WRITES_DISABLED");
      return currentOptions.nativeStationExit.context(p, target, signal);
    },
    stationExitValidate: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal) => {
      if (!currentOptions?.nativeStationExit) stageFail("LIVE_WRITES_DISABLED");
      return currentOptions.nativeStationExit.validate(p, target, input, signal);
    },
    stationExitCommit: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal) => {
      if (!currentOptions?.nativeStationExit) stageFail("LIVE_WRITES_DISABLED");
      return currentOptions.nativeStationExit.commit(p, target, input, signal);
    },
    attendanceStageArrivalMode: stageMode,
    attendanceStationArrivalMode: station,
    stationArrivalContext: (p: unknown, target: unknown, signal?: AbortSignal) => {
      if (!stationArrival) stageFail("LIVE_WRITES_DISABLED");
      return stationArrival.context(p, target, signal);
    },
    stationArrivalValidate: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal) => {
      if (!stationArrival) stageFail("LIVE_WRITES_DISABLED");
      return stationArrival.validate(p, target, input, signal);
    },
    stationArrivalCommit: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal):
      Promise<StationArrivalReceiptV1 | NativeStationArrivalReceiptV1> => {
      if (!stationArrival) stageFail("LIVE_WRITES_DISABLED");
      return stationArrival.commit(p, target, input, signal);
    },
    authenticate,
    stageArrivalContext: (p: unknown, target: unknown, signal?: AbortSignal) => {
      if (!stageArrival) stageFail("LIVE_WRITES_DISABLED");
      return stageArrival.context(p, target, signal);
    },
    stageArrivalValidate: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal) => {
      if (!stageArrival) stageFail("LIVE_WRITES_DISABLED");
      return stageArrival.validate(p, target, input, signal);
    },
    stageArrivalCommit: (p: unknown, target: unknown, input: unknown, signal?: AbortSignal):
      Promise<StageArrivalReceiptDraftV1 | NativeStageArrivalReceiptV1> => {
      if (!stageArrival) stageFail("LIVE_WRITES_DISABLED");
      return stageArrival.commit(p, target, input, signal);
    },
    attendanceContext: (p: PrincipalV1, signal?: AbortSignal) => {
      validatePrincipal(p); accessPolicy.requireAttendanceRead(p);
      if (!attendance) throw new AttendanceError("DEPENDENCY_UNAVAILABLE");
      return attendance.context(p, signal);
    },
    attendanceList: (p: PrincipalV1, r: AttendanceRequestV1, signal?: AbortSignal) => {
      validatePrincipal(p); validateAttendanceRequest(r); accessPolicy.requireAttendanceRead(p);
      if (!attendance) throw new AttendanceError("DEPENDENCY_UNAVAILABLE");
      return attendance.list(p, r, signal);
    },
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
