import type { BindParameters } from "oracledb";
import type { NativePool, NativeConnection } from "./oracle-stage-arrival-uow.mts";
import type { NativeQuery, NativeSchema } from "./oracle-stage-arrival-snapshot.mts";
import { nativeIdentity } from "./oracle-stage-arrival-snapshot.mts";
import type { OracleReadSession } from "./oracle-session.mts";
import { lateBinding, lateIdentityReference } from "./native-station-arrival-late-config.mts";
import type { LateBinding } from "./native-station-arrival-late-config.mts";
import { lateSafety, lateSnapshot, lateUpdate, lateDependencyTables } from "./oracle-station-arrival-late-snapshot.mts";
import type { LateSnapshot } from "./oracle-station-arrival-late-snapshot.mts";
import { NativeCommandCoordinator } from "./native-command-coordinator.mts";
import type { NativeCommandAdmissionV1 } from "./native-command-coordinator-contracts.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { record } from "./contract-validation.mts";
import { same } from "./stage-arrival-domain.mts";
import { exact } from "./stage-arrival-validation.mts";
type Decision = { local: string; actor: string; reasonCode: string; minutes: number };
type Transaction = { query: NativeQuery;
  update(sql: string, binds: BindParameters, guard: () => void): Promise<number | undefined>;
  commit(guard: () => void): Promise<void> };
function mapped(e: unknown) {
  if (e instanceof StageArrivalError) return e;
  const code = record(e) ? e.code : undefined;
  return new StageArrivalError(code === "ORA-00054" ? "COMMAND_IN_PROGRESS" :
    ["ORA-01013", "DPI-1067", "NJS-040"].includes(String(code)) ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
}
// Dedicated five-SET kernel. No F2 operation authority is reused.
export class OracleLateStationArrivalUow {
  readonly dataSource = "oracle-test";
  readonly coordinator: NativeCommandCoordinator;
  private readonly pool: NativePool;
  private readonly reads: OracleReadSession;
  private readonly binding: LateBinding;
  private readonly zone: string;
  private schema?: NativeSchema;
  get identityReference() { return lateIdentityReference(this.binding); }
  get businessTimeZone() { return this.zone; }
  constructor(pool: NativePool, reads: OracleReadSession, binding: LateBinding, zone: string, coordinator: NativeCommandCoordinator) {
    if (!(coordinator instanceof NativeCommandCoordinator)) stageFail("LIVE_WRITES_DISABLED");
    this.pool = pool; this.reads = reads; this.binding = lateBinding(binding); this.zone = zone; this.coordinator = coordinator;
    new Intl.DateTimeFormat("en", { timeZone: zone });
  }
  async initialize(signal?: AbortSignal) {
    await this.coordinator.assertAvailable(this.binding.employeeId, signal);
    this.schema = await this.transaction(tx => lateSafety(tx.query, this.binding), signal);
  }
  async read(signal?: AbortSignal): Promise<LateSnapshot> {
    if (!this.schema) stageFail("LIVE_WRITES_DISABLED");
    const schema = this.schema;
    let captured: StageArrivalError | undefined;
    try {
      return await this.reads.read(async query => {
        try {
          const q: NativeQuery = (sql, binds, bound) => query(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound);
          await nativeIdentity(q, this.binding.readIdentity);
          return await lateSnapshot(q, schema, this.binding, this.zone, signal);
        } catch (e) { if (e instanceof StageArrivalError) captured = e; throw e; }
      }, signal);
    } catch (e) { throw captured ?? mapped(e); }
  }
  private async transaction<T>(work: (tx: Transaction) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const ambient = currentRequestBudget(), deadline = Math.min(ambient?.deadline ?? Infinity, performance.now() + 5000);
    let c: NativeConnection | undefined, active = false, unsafe = false, attempted = false, commitSent = false;
    let committed = false, cancelled = false, primary: StageArrivalError | undefined, result: { value: T } | undefined;
    const breaks: Promise<void>[] = [];
    const abort = () => {
      if (cancelled) return;
      cancelled = true;
      if (active && c) {
        try { breaks.push(c.break().catch(() => { unsafe = true; })); } catch { unsafe = true; }
      }
    };
    const guard = () => {
      checkStageBudget(signal);
      if (cancelled || performance.now() >= deadline) stageFail("DEPENDENCY_TIMEOUT");
    };
    const op = async <R,>(invoke: () => Promise<R>) => {
      if (!c) stageFail("INTERNAL_ERROR");
      c.callTimeout = Math.max(1, Math.ceil(deadline - performance.now()));
      guard(); active = true;
      try { const r = await invoke(); guard(); return r; } finally { active = false; }
    };
    signal?.addEventListener("abort", abort, { once: true });
    ambient?.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, Math.max(1, deadline - performance.now())); timer.unref();
    try {
      guard(); c = await this.pool.getConnection(); guard();
      const tx: Transaction = {
        query: async (sql, binds, bound) => {
          if (!/^\s*(?:\/\*.*?\*\/\s*)?SELECT\b/is.test(sql) || /\bNEXTVAL\b/i.test(sql) || bound < 1 || bound > 1001)
            stageFail("INTERNAL_ERROR");
          const r = await op(() => c!.execute(sql, binds, bound));
          if (!Array.isArray(r.rows) || r.rows.length > bound) stageFail("INVALID_SOURCE_DATA");
          return r.rows;
        },
        update: (sql, binds, finalGuard) => op(() => {
          finalGuard(); guard(); attempted = true; return c!.execute(sql, binds, 1);
        }).then(r => r.rowsAffected),
        commit: finalGuard => op(() => {
          finalGuard(); guard(); commitSent = true; return c!.commit().then(() => { committed = true; });
        }),
      };
      result = { value: await work(tx) }; guard();
    } catch (e) { primary = commitSent ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") : mapped(e); }
    finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort); ambient?.signal.removeEventListener("abort", abort);
      await Promise.all(breaks);
      if (c) {
        if (!committed) {
          try {
            c.callTimeout = 1000; await c.rollback();
            if (attempted && !commitSent && primary) primary = new StageArrivalError(primary.code, "rolled-back");
          } catch {
            unsafe = true;
            primary = attempted || commitSent ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") :
              primary ?? new StageArrivalError("DEPENDENCY_UNAVAILABLE");
          }
        }
        if (commitSent && (!committed || primary)) unsafe = true;
        try { await c.close(unsafe); }
        catch {
          primary ??= new StageArrivalError(commitSent ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_UNAVAILABLE");
          try { await c.close(true); } catch { /* retain sanitized failure */ }
        }
      }
    }
    if (primary) throw primary;
    if (!result) stageFail("INTERNAL_ERROR");
    return result.value;
  }
  async execute(before: LateSnapshot, decide: (current: LateSnapshot) => Decision,
    globalAdmission: NativeCommandAdmissionV1, signal?: AbortSignal) {
    const global = this.coordinator.bindingFor(globalAdmission, this.binding.employeeId, "station-arrival-late");
    if (!exact(before.dependencies, lateDependencyTables)) stageFail("INVALID_SOURCE_DATA");
    const guard = () => this.coordinator.assertMutationAllowed(globalAdmission, global);
    const expectedSchema = this.schema;
    if (!expectedSchema) stageFail("LIVE_WRITES_DISABLED");
    const proposed = await this.transaction(async tx => {
      const schema = await lateSafety(tx.query, this.binding);
      if (!same(schema, expectedSchema)) stageFail("STALE_PREPARATION");
      for (const [table, column, key] of [
        ["SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEES", "EMPLOYEE_ID", this.binding.employeeId],
      ]) {
        const rows = await tx.query(`/* station-late:lock:${table} */ SELECT ${column} AS "key"
          FROM SHIFTER.${table} WHERE ${column}=TO_NUMBER(:key) AND ROWNUM<=2 FOR UPDATE NOWAIT`, { key }, 2);
        if (rows.length > 1) stageFail("AMBIGUOUS_ATTENDANCE");
        if (rows.length !== 1) stageFail("SHIFT_DAY_NOT_FOUND");
      }
      // Lock existing contextual witnesses as well. Empty relations/ranges
      // cannot be row-locked: certified external writer exclusion plus full
      // membership/absence predicates remain independently mandatory.
      const witnesses = [
        { table: "SHF_DAY_CHANGES", column: "SHF_EMPLOYEE_DAY_ID", key: this.binding.shiftDayId,
          numeric: true, count: before.rows.SHF_DAY_CHANGES ? 1 : 0, bound: 2 },
        { table: "SHF_ORG_UNIT", column: "ORG_UNIT_ID", key: before.rows.team!.ORG_UNIT_ID!,
          numeric: false, count: 1, bound: 2 },
        { table: "SHF_ORG_UNIT", column: "ORG_UNIT_ID", key: before.rows.parent!.ORG_UNIT_ID!,
          numeric: false, count: 1, bound: 2 },
        ...lateDependencyTables.map(table => ({
          table, column: table === "SHF_EMPLOYEE_REPORTS" ? "EMPLOYEE_ID" : "AGENT_DAY_ID",
          key: table === "SHF_EMPLOYEE_REPORTS" ? this.binding.employeeId : this.binding.shiftDayId,
          numeric: true, count: before.dependencies[table]!.length, bound: 1001,
        })),
      ];
      for (const witness of witnesses) {
        const rows = await tx.query(`/* station-late:lock:${witness.table} */ SELECT ${witness.column} AS "key"
          FROM SHIFTER.${witness.table} WHERE ${witness.column}=${witness.numeric ? "TO_NUMBER(:key)" : ":key"}
          AND ROWNUM<=${witness.bound} FOR UPDATE NOWAIT`, { key: witness.key }, witness.bound);
        if (rows.length !== witness.count) stageFail("STALE_PREPARATION");
      }
      const catalog = await tx.query(`/* station-late:lock:SHF_EVENT_REASON */ SELECT REASON_ID AS "key"
        FROM SHIFTER.SHF_EVENT_REASON WHERE SER_TYPE=2 AND ROWNUM<=1001 FOR UPDATE NOWAIT`, {}, 1001);
      if (catalog.length > 1000 || catalog.length !== before.reasons.length) stageFail("STALE_PREPARATION");
      for (const candidate of before.candidates) {
        const key = candidate.day.SHF_EMPLOYEE_DAY_ID!;
        if (key === this.binding.shiftDayId) continue;
        for (const [table, count] of [["SHF_EMPLOYEE_DAY", 1], ["SHF_DAY_CHANGES", candidate.change ? 1 : 0]] as const) {
          const rows = await tx.query(`/* station-late:lock:${table} */ SELECT SHF_EMPLOYEE_DAY_ID AS "key"
            FROM SHIFTER.${table} WHERE SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:key) AND ROWNUM<=2 FOR UPDATE NOWAIT`, { key }, 2);
          if (rows.length !== count) stageFail("STALE_PREPARATION");
        }
      }
      const current = await lateSnapshot(tx.query, schema, this.binding, this.zone, signal, before);
      if (!same(current, before)) stageFail("STALE_PREPARATION");
      const next = decide(current), update = lateUpdate(schema, before, this.binding, next);
      const finalGuard = () => {
        const fresh = decide(current);
        if (fresh.minutes !== next.minutes || fresh.reasonCode !== next.reasonCode || fresh.actor !== next.actor)
          stageFail("STALE_PREPARATION");
        guard(); checkStageBudget(signal);
      };
      const count = await tx.update(update.sql, update.binds, finalGuard);
      if (count === 0) stageFail("STALE_PREPARATION");
      if (count !== 1) stageFail("INVALID_SOURCE_DATA");
      await tx.commit(finalGuard);
      return { ...next, acknowledged: new Date().toISOString() };
    }, signal);
    // Writer release is completed by transaction before independent full readback.
    try {
      checkStageBudget(signal);
      const actual = await this.read(signal), expected = structuredClone(before), a = expected.rows.SHF_ATTENDANCE;
      if (!a) stageFail("COMMAND_OUTCOME_UNKNOWN");
      a.STATION_ARRIVAL_TIME = proposed.local; a.STATION_ARRIVAL_USER = proposed.actor;
      a.LATE_REASON_ID = proposed.reasonCode; a.LATE_MINUTES = String(proposed.minutes); a.LATE_REMARK = null;
      expected.blockers = [...new Set([...expected.blockers, "EXISTING_STATION_LATE" as const])];
      if (!same(actual, expected)) stageFail("COMMAND_OUTCOME_UNKNOWN");
      checkStageBudget(signal);
      const verified = new Date().toISOString();
      if (verified < proposed.acknowledged) stageFail("COMMAND_OUTCOME_UNKNOWN");
      return { ...proposed, verified };
    } catch { return stageFail("COMMAND_OUTCOME_UNKNOWN"); }
  }
}
