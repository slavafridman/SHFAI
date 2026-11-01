import type { NativePool } from "./oracle-stage-arrival-uow.mts";
import type { OracleReadSession } from "./oracle-session.mts";
import type { NativeQuery, NativeSchema } from "./oracle-stage-arrival-snapshot.mts";
import type { CancellationBindingV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationOperationAdmissionV1, CancellationNativeCompletionV1, CancellationUow } from "./station-exit-cancellation-ports.mts";
import type { NativeCommandAdmissionV1 } from "./native-command-coordinator-contracts.mts";
import { NativeCommandCoordinator } from "./native-command-coordinator.mts";
import { CancellationOperatorAdmission } from "./native-station-exit-cancellation-admission.mts";
import { cancellationBinding, cancellationIdentityReference } from "./native-station-exit-cancellation-config.mts";
import { cancellationSafety } from "./native-station-exit-cancellation-metadata.mts";
import { cancellationSnapshot, assertCancellationCertified } from "./oracle-station-exit-cancellation-snapshot.mts";
import type { NativeCancellationSnapshot } from "./oracle-station-exit-cancellation-snapshot.mts";
import { cancellationRecorded, completeCancellationOriginalsDigest, decideCancellation } from "./station-exit-cancellation-domain.mts";
import { cancellationUpdate } from "./oracle-station-exit-cancellation-sql.mts";
import { cancellationTransaction, cancellationOracleError } from "./oracle-cancellation-transaction.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { same } from "./stage-arrival-domain.mts";
import { stageFail, StageArrivalError } from "./stage-arrival-errors.mts";

export class OracleStationExitCancellationUow implements CancellationUow<NativeCancellationSnapshot, void, CancellationNativeCompletionV1> {
  readonly coordinator: NativeCommandCoordinator;
  readonly authority: CancellationOperatorAdmission;
  readonly dataSource = "oracle-test";
  private readonly pool: NativePool;
  private readonly reads: OracleReadSession;
  private readonly binding: CancellationBindingV1;
  private readonly zone: string;
  private schema?: NativeSchema;
  get identityReference() { return cancellationIdentityReference(this.binding); }
  get businessTimeZone() { return this.zone; }
  constructor(pool: NativePool, reads: OracleReadSession, binding: CancellationBindingV1, zone: string,
    coordinator: NativeCommandCoordinator, authority: CancellationOperatorAdmission) {
    if (!(coordinator instanceof NativeCommandCoordinator) || !(authority instanceof CancellationOperatorAdmission))
      stageFail("LIVE_WRITES_DISABLED");
    this.pool = pool; this.reads = reads; this.binding = cancellationBinding(binding); this.zone = zone;
    this.coordinator = coordinator; this.authority = authority;
    new Intl.DateTimeFormat("en", { timeZone: zone });
  }
  async initialize(signal?: AbortSignal) {
    await this.coordinator.assertAvailable(this.binding.employeeId, signal);
    this.schema = await cancellationTransaction(this.pool, tx => cancellationSafety(tx.query, this.binding), signal);
  }
  async read(signal?: AbortSignal): Promise<NativeCancellationSnapshot> {
    const expected = this.schema;
    if (!expected) stageFail("LIVE_WRITES_DISABLED");
    let captured: StageArrivalError | undefined;
    try {
      return await this.reads.read(async query => {
        try {
          const q: NativeQuery = (sql, binds, bound) =>
            query(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound);
          const actual = await cancellationSafety(q, this.binding, true);
          if (!same(actual, expected)) stageFail("STALE_PREPARATION");
          return await cancellationSnapshot(q, actual, this.binding, this.zone, signal);
        } catch (e) { if (e instanceof StageArrivalError) captured = e; throw e; }
      }, signal);
    } catch (e) { throw captured ?? cancellationOracleError(e); }
  }
  async execute(before: NativeCancellationSnapshot, decide: (current: NativeCancellationSnapshot) => void,
    global: NativeCommandAdmissionV1, operation: CancellationOperationAdmissionV1,
    signal?: AbortSignal): Promise<CancellationNativeCompletionV1> {
    const b = this.binding, binding = this.coordinator.bindingFor(global, b.employeeId, "station-exit-cancellation");
    const scope = { bindingScopeDigest: before.bindingScopeDigest, completeOriginalsDigest: completeCancellationOriginalsDigest(before) };
    const guard = () => {
      checkStageBudget(signal);
      this.coordinator.assertMutationAllowed(global, binding);
      this.authority.assertMutationAllowed(operation, scope, binding.commandId);
    };
    guard(); assertCancellationCertified(before, b);
    const expectedSchema = this.schema;
    if (!expectedSchema) stageFail("LIVE_WRITES_DISABLED");
    const commitAcknowledgedAt = await cancellationTransaction(this.pool, async tx => {
      const schema = await cancellationSafety(tx.query, b);
      if (!same(schema, expectedSchema)) stageFail("STALE_PREPARATION");
      // Source/binding/operator proof excludes external membership writers;
      // NOWAIT row locks do not claim to exclude absent-row phantoms.
      if (b.writerFreezeConfirmed !== true || !b.freezeOwner || b.singleExecutorConfirmed !== true) stageFail("LIVE_WRITES_DISABLED");
      const prefix = before.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER!.slice(0, 8);
      const locks = [
        ["SHF_EMPLOYEES", "EMPLOYEE_ID", "EMPLOYEE_ID=TO_NUMBER(:key)", b.employeeId, true],
        ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID", "EMP_ID_NUMBER=:key OR SHF_EMPLOYEE_DAY_ID IN (SELECT SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_DAY_CHANGES WHERE NEW_EMPLOYEE_ID=:key)", prefix, true],
        ["SHF_DAY_CHANGES", "SHF_EMPLOYEE_DAY_ID", "SHF_EMPLOYEE_DAY_ID IN (SELECT SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY WHERE EMP_ID_NUMBER=:key) OR NEW_EMPLOYEE_ID=:key", prefix, false],
        ["SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID", "SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:key)", b.shiftDayId, true],
        ["SHF_EMPLOYEE_REPORTS", "EMPLOYEE_ID", "EMPLOYEE_ID=TO_NUMBER(:key)", b.employeeId, false],
        ["SHF_EMPLOYEE_EXCEPTIONS", "AGENT_DAY_ID", "AGENT_DAY_ID=TO_NUMBER(:key)", b.shiftDayId, false],
        ["SHF_EMPLOYEE_EXCEPTIONS_BASE", "AGENT_DAY_ID", "AGENT_DAY_ID=TO_NUMBER(:key)", b.shiftDayId, false],
        ["SHF_ORG_UNIT", "ORG_UNIT_ID", "ORG_UNIT_ID=:key OR ORG_UNIT_ID=(SELECT PARENT_UNIT FROM SHIFTER.SHF_ORG_UNIT WHERE ORG_UNIT_ID=:key)", b.orgUnitId, true],
        ["SHF_ORG_UNITS_SHF_SITES", "SS_SITE_ID", "SS_SITE_ID=TO_NUMBER(:key)", before.rows.mapping!.SS_SITE_ID, true],
        ["SHF_SYSTEM_PARAM", "PARAM_KEY", "PARAM_KEY IN (:key,:other)", before.rows.system0!.PARAM_KEY, true],
        ["SHF_UNIT_PARAM", "PARAM_KEY", "ORG_UNIT_ID=:key", before.rows.parent!.ORG_UNIT_ID, false],
      ] as const;
      for (const [table, column, where, key, required] of locks) {
        const rows = await tx.query(`/* cancellation:lock:${table} */ SELECT ${column} AS "key"
          FROM SHIFTER.${table} WHERE ${where} ORDER BY ${column} FOR UPDATE NOWAIT`,
        { key, ...(table === "SHF_SYSTEM_PARAM" ? { other: before.rows.system1!.PARAM_KEY } : {}) }, 1001);
        if (rows.length > 1000) stageFail("INVALID_SOURCE_DATA");
        if (required && !rows.length) stageFail("STALE_PREPARATION");
      }
      const current = await cancellationSnapshot(tx.query, schema, b, this.zone, signal);
      if (!same(current, before)) stageFail("STALE_PREPARATION");
      const redecide = () => {
        if (decideCancellation(current, new Date(), this.zone).eligibility !== "eligible") stageFail("COMMAND_SCOPE_DEFERRED");
        assertCancellationCertified(current, b); decide(current); guard();
      };
      redecide();
      const update = cancellationUpdate(schema, current);
      const final = redecide;
      const count = await tx.update(update.sql, update.binds, final);
      if (count === 0) stageFail("STALE_PREPARATION");
      if (count !== 1) stageFail("INVALID_SOURCE_DATA");
      return tx.commit(final);
    }, signal);
    // Writer lease is closed before a NEW independent SET TRANSACTION READ
    // ONLY lease/identity/full-image comparison. ACK alone never yields receipt.
    try {
      guard();
      const actual = await this.read(signal), expected = structuredClone(before);
      expected.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = null;
      expected.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = null;
      if (!same(actual, expected)) stageFail("COMMAND_OUTCOME_UNKNOWN");
      guard();
      const readBackVerifiedAt = new Date().toISOString(), recorded = cancellationRecorded(actual);
      if (readBackVerifiedAt < commitAcknowledgedAt || !recorded.stationArrivalLocal || recorded.stationExitLocal !== null ||
          actual.rows.SHF_ATTENDANCE!.STATION_EXIT_USER !== null) stageFail("COMMAND_OUTCOME_UNKNOWN");
      return { recorded: { ...recorded, stationArrivalLocal: recorded.stationArrivalLocal, stationExitLocal: null },
        commitAcknowledgedAt, readBackVerifiedAt };
    } catch { return stageFail("COMMAND_OUTCOME_UNKNOWN"); }
  }
}
