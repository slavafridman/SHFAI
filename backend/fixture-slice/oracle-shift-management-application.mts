// Concrete installed native composition. No default/empty evidence adapters.
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { lookup } from "node:dns/promises";
import type { PrincipalV1 } from "./contracts.mts";
import type { ShiftSnapshotPort, ShiftSelectionV1 } from "./shift-management-contracts.mts";
import type { ShiftSnapshot } from "./shift-management-model.mts";
import type { NativePool } from "./oracle-stage-arrival-uow.mts";
import { createNativePool } from "./oracle-stage-arrival-uow.mts";
import { OracleReadSession, createOraclePool } from "./oracle-session.mts";
import type { OraclePool } from "./oracle-session.mts";
import { certifyShiftManagementMetadata, verifyShiftManagementReadSchema } from "./oracle-shift-management-metadata.mts";
import { nativeIdentity } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import { parseShiftOracleRow, shiftOracleProjection } from "./oracle-shift-management-sql.mts";
import { readNativeShiftSource, nativeShiftMembershipGuard } from "./oracle-shift-management-source.mts";
import { NativeShiftAdmission } from "./native-shift-management-admission.mts";
import { OracleShiftManagementUow } from "./oracle-shift-management-uow.mts";
import { ShiftManagementApplication } from "./shift-management-application.mts";
import { shiftManagementAccessPolicy } from "./access-policy.mts";
import { systemClock } from "./read-current-shifts.mts";
import { ShiftManagementError, shiftFail } from "./shift-management-errors.mts";
import { record } from "./contract-validation.mts";
import { createRuntime } from "./synthetic-identity.mts";
import { validateRuntimeConfig, oracleEnvironment } from "./runtime-config.mts";
import { parseNativeManagementEnvironment, verifyNativeManagementEndpoints } from "./native-shift-management-config.mts";
import type { NativeManagementConfiguration } from "./native-shift-management-config.mts";
import type { BackendPoolFactories } from "./server.mts";
import { managementOrigins, managementPort } from "./shift-management-runtime.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { OracleCurrentReader, OracleDetailReader } from "./oracle-readers.mts";
import { OracleSearchReader } from "./oracle-search-reader.mts";
import { OracleMyShiftsReader } from "./oracle-my-shifts-reader.mts";
import { OracleShiftItemsReader } from "./oracle-shift-items-reader.mts";
import { OracleEmployeeCardReader } from "./oracle-employee-card-reader.mts";
import { OracleAttendanceReader } from "./oracle-attendance-reader.mts";
import { limitedMetadataWarning } from "./native-metadata-limited.mts";

type Binding = Omit<NativeManagementConfiguration, "writer">;
type Metadata = Awaited<ReturnType<typeof certifyShiftManagementMetadata>>;
async function readOwned<T>(session: OracleReadSession, work: (query: NativeQuery) => Promise<T>, signal?: AbortSignal): Promise<T> {
  let captured: ShiftManagementError | undefined;
  try {
    return await session.read(async query => {
      try { return await work((sql, binds, bound) => query(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound)); }
      catch (error) {
        if (error instanceof ShiftManagementError) captured = error;
        throw error;
      }
    }, signal);
  } catch (error) {
    if (captured) throw captured;
    if (record(error) && error.code === "DEPENDENCY_TIMEOUT") shiftFail("DEPENDENCY_TIMEOUT");
    shiftFail("DEPENDENCY_UNAVAILABLE");
  }
}
function writerReadSession(pool: NativePool): OracleReadSession {
  return new OracleReadSession({ async getConnection() {
    const c = await pool.getConnection();
    return { get callTimeout() { return c.callTimeout; }, set callTimeout(value: number) { c.callTimeout = value; },
      async execute(sql, binds, bound) {
        const result = await c.execute(sql, binds, bound);
        if (sql === "SET TRANSACTION READ ONLY") return [];
        if (!Array.isArray(result.rows)) shiftFail("INVALID_SOURCE_DATA");
        return result.rows;
      }, break: () => c.break(), rollback: () => c.rollback(), close: drop => c.close(drop) };
  }, close: () => pool.close() });
}
export class OracleShiftManagementSnapshot implements ShiftSnapshotPort<ShiftSnapshot> {
  readonly reference;
  private readonly session: OracleReadSession;
  private readonly binding: Binding;
  private readonly metadata: Metadata;
  constructor(session: OracleReadSession, binding: Binding, metadata: Metadata) {
    this.session = session; this.binding = binding; this.metadata = metadata; this.reference = binding.source.reference;
    if (metadata.certificate !== this.reference.metadata.certificate) throw Error("Native metadata reference mismatch");
  }
  private select(selection: ShiftSelectionV1) {
    if (selection.employeeId !== this.binding.source.employeeId ||
        this.binding.source.selectedDayId !== null && selection.shiftDayId !== null &&
        selection.shiftDayId !== this.binding.source.selectedDayId) shiftFail("SHIFT_DAY_NOT_FOUND");
  }
  private async proof(q: NativeQuery, signal?: AbortSignal) {
    await nativeIdentity(q, this.binding.readIdentity);
    await verifyShiftManagementReadSchema(q, this.metadata, signal);
  }
  async read(selection: ShiftSelectionV1, signal?: AbortSignal): Promise<ShiftSnapshot> {
    return this.readForCsv(selection, undefined, signal);
  }
  async readForCsv(selection: ShiftSelectionV1, expectedNumber: string | undefined, signal?: AbortSignal): Promise<ShiftSnapshot> {
    this.select(selection);
    return readOwned(this.session, async q => {
      await this.proof(q, signal);
      return (await readNativeShiftSource(q, this.metadata, this.binding.source, selection, signal, expectedNumber)).snapshot;
    }, signal);
  }
  async readCsvIdentity(principal: PrincipalV1, employeeId: string, signal?: AbortSignal): Promise<string> {
    const policy = shiftManagementAccessPolicy("test-oracle-controlled");
    policy.requireCsvPreview(principal);
    if (employeeId !== this.binding.source.employeeId ||
        !policy.authorizedTeamIds(principal).includes(this.binding.source.orgUnitId)) shiftFail("SHIFT_DAY_NOT_FOUND");
    return readOwned(this.session, async q => {
      await this.proof(q, signal);
      const columns = this.metadata.core.SHF_EMPLOYEES;
      const rows = await q(`SELECT /* shf49:csvIdentity */ ${columns.map(c =>
        `${shiftOracleProjection(c, "e.")} AS "${c.name}"`).join(",")} FROM SHIFTER.SHF_EMPLOYEES e
        WHERE e.EMPLOYEE_ID=TO_NUMBER(:employeeId) AND e.ORG_UNIT_ID=:orgUnitId AND ROWNUM<=2`,
      { employeeId, orgUnitId: this.binding.source.orgUnitId }, 2);
      if (rows.length !== 1) shiftFail(rows.length ? "INVALID_SOURCE_DATA" : "SHIFT_DAY_NOT_FOUND");
      const row = parseShiftOracleRow(rows[0], columns), number = row.EMP_ID_NUMBER;
      if (typeof number !== "string" || !/^[0-9]{9}$/.test(number)) shiftFail("INVALID_SOURCE_DATA");
      const owners = await q(`SELECT /* shf49:csvFullIdentity */ TO_CHAR(EMPLOYEE_ID,'TM9') AS "employeeId"
        FROM SHIFTER.SHF_EMPLOYEES WHERE EMP_ID_NUMBER=:fullNumber AND ROWNUM<=2`, { fullNumber: number }, 2);
      if (owners.length !== 1 || !record(owners[0]) || owners[0].employeeId !== employeeId) shiftFail("INVALID_SOURCE_DATA");
      return number; // No first8 derivation or day lookup before CSV full9 comparison.
    }, signal);
  }
}
export class OracleShiftManagementApplication extends ShiftManagementApplication {
  readonly dataSource = "oracle-test";
  constructor(snapshots: OracleShiftManagementSnapshot, uow: OracleShiftManagementUow,
    admission: NativeShiftAdmission, binding: Binding) {
    if (!(snapshots instanceof OracleShiftManagementSnapshot) || !(uow instanceof OracleShiftManagementUow) ||
        !(admission instanceof NativeShiftAdmission)) throw Error("Concrete native management adapters required");
    const policy = shiftManagementAccessPolicy("test-oracle-controlled"), generation = randomBytes(32).toString("base64url");
    super({ snapshots, uow, admission, policy, clock: systemClock, businessTimeZone: binding.authority.businessTimeZone,
      authGeneration: () => generation, selectedScope: { employeeId: binding.source.employeeId, orgUnitId: binding.source.orgUnitId },
      csvIdentity: { read: (p, id, signal) => snapshots.readCsvIdentity(p, id, signal),
        snapshot: (p, selection, full, signal) => {
          policy.requireCsvPreview(p);
          if (!policy.authorizedTeamIds(p).includes(binding.source.orgUnitId)) shiftFail("SHIFT_DAY_NOT_FOUND");
          return snapshots.readForCsv(selection, full, signal);
        } } });
  }
}
export async function startNativeManagement(env: NodeJS.ProcessEnv, configuration: unknown, factories?: BackendPoolFactories) {
  const config = validateRuntimeConfig(configuration);
  if (config.authenticationMode !== "synthetic") throw Error("Explicit isolated synthetic management provider required");
  const native = parseNativeManagementEnvironment(env, config);
  const origins = managementOrigins(env.SHF_SHIFT_MANAGEMENT_ORIGINS), port = managementPort(env.SHF_ORACLE_PORT);
  const resolver = factories?.resolveEndpoint ?? (async (name: string, signal: AbortSignal) => {
    signal.throwIfAborted(); const rows = await lookup(name, { all: true, verbatim: true });
    signal.throwIfAborted(); return rows.map(row => row.address);
  });
  await verifyNativeManagementEndpoints(native, resolver);
  if (native.metadata.provider === "owner-test-limited-v1") process.stderr.write(limitedMetadataWarning + "\n");
  let pool: OraclePool | undefined, writer: NativePool | undefined;
  try {
    pool = await (factories?.read ?? createOraclePool)(oracleEnvironment(env));
    writer = await (factories?.native ?? createNativePool)(native.writer);
    const session = new OracleReadSession(pool), probe = writerReadSession(writer);
    const metadata = await readOwned(probe, q => certifyShiftManagementMetadata(q, native.metadata,
      native.source.reference.metadata.certificate));
    const { writer: _secrets, ...binding } = native;
    const snapshots = new OracleShiftManagementSnapshot(session, binding, metadata);
    await snapshots.read({ employeeId: binding.source.employeeId, shiftDayId: binding.source.selectedDayId });
    const admission = new NativeShiftAdmission(binding.authority);
    let activeMetadata = metadata;
    const uow = new OracleShiftManagementUow(writer, {
      operation: "native-shift-management-v0.1", reference: binding.source.reference,
      async assertConnection(q, signal) {
        activeMetadata = await certifyShiftManagementMetadata(q, binding.metadata, binding.source.reference.metadata.certificate, signal);
        return { operation: "native-shift-management-v0.1", reference: binding.source.reference };
      },
      async inspect(q, selected, signal) {
        const current = await readNativeShiftSource(q, activeMetadata, binding.source, selected, signal);
        if (binding.source.overlayWrite !== null) {
          const exists = current.core.overlays.some(row => row.SHF_EMPLOYEE_DAY_ID === binding.source.selectedDayId);
          if (exists !== (binding.source.overlayWrite === "update")) shiftFail("STALE_PREPARATION");
        }
        return current;
      },
      membershipGuard: current => nativeShiftMembershipGuard(current, binding.source, activeMetadata.schemas),
    }, admission, binding.execution);
    const app = new OracleShiftManagementApplication(snapshots, uow, admission, binding);
    const runtime = await createRuntime(config, new OracleDetailReader(session), undefined, {
      reader: new OracleCurrentReader(session), searchReader: new OracleSearchReader(session),
      myShiftsReader: new OracleMyShiftsReader(session), shiftItemsReader: new OracleShiftItemsReader(session),
      employeeCardReader: new OracleEmployeeCardReader(session), attendanceReader: new OracleAttendanceReader(session),
      shiftManagement: app,
    });
    const server = createLoopbackServer(runtime, { shiftManagementOrigins: origins });
    const listening = once(server, "listening"); server.listen(port, "127.0.0.1"); await listening;
    return { server, pools: [pool, writer] };
  } catch (error) {
    await Promise.allSettled([...(pool ? [pool.close()] : []), ...(writer ? [writer.close()] : [])]);
    throw error;
  }
}
