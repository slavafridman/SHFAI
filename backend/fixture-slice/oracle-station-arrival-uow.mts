import type { BindParameters } from "oracledb";
import type { OracleReadSession } from "./oracle-session.mts";
import type { NativePool, NativeConnection } from "./oracle-stage-arrival-uow.mts";
import type { NativeQuery, NativeSchema } from "./oracle-stage-arrival-snapshot.mts";
import { nativeIdentity } from "./oracle-stage-arrival-snapshot.mts";
import { stationBinding, stationIdentityReference } from "./native-station-arrival-config.mts";
import type { StationBinding } from "./native-station-arrival-config.mts";
import { stationSafety, stationSnapshot, stationUpdate } from "./oracle-station-arrival-snapshot.mts";
import type { StationSnapshot } from "./oracle-station-arrival-snapshot.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { record } from "./contract-validation.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { same } from "./stage-arrival-domain.mts";

function mapped(e: unknown): StageArrivalError {
  if (e instanceof StageArrivalError) return e;
  const code = record(e) && typeof e.code === "string" ? e.code : "";
  const error = new StageArrivalError(code === "ORA-00054" ? "COMMAND_IN_PROGRESS" :
    ["ORA-01013", "DPI-1067", "NJS-040"].includes(code) ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
  if (/^(ORA-[0-9]{5}|DPI-[0-9]{4}|NJS-[0-9]{3})$/.test(code)) error.cause = { oracleCode: code };
  return error;
}
type Transaction = {
  query: NativeQuery;
  update(sql: string, binds: BindParameters): Promise<number | undefined>;
  commit(finalGuard: () => void): Promise<void>;
};
// Dedicated F2 transaction, never a mutating OracleReadSession, fixture port,
// F1 blockers/UPDATE, or persisted receipt.
export class OracleStationArrivalUow {
  readonly dataSource = "oracle-test";
  private readonly pool: NativePool;
  private readonly reads: OracleReadSession;
  private readonly binding: StationBinding;
  private readonly zone: string;
  private schema?: NativeSchema;
  get identityReference() { return stationIdentityReference(this.binding); }
  get businessTimeZone() { return this.zone; }
  constructor(pool: NativePool, reads: OracleReadSession, binding: StationBinding, zone: string) {
    this.pool = pool; this.reads = reads; this.binding = stationBinding(binding); this.zone = zone;
    new Intl.DateTimeFormat("en", { timeZone: zone });
  }
  async initialize(signal?: AbortSignal) {
    this.schema = await this.transaction(tx => stationSafety(tx.query, this.binding), signal);
  }
  async read(signal?: AbortSignal): Promise<StationSnapshot> {
    const schema = this.schema;
    if (!schema) stageFail("LIVE_WRITES_DISABLED");
    checkStageBudget(signal);
    let nativeError: StageArrivalError | undefined;
    try {
      return await this.reads.read(async q => {
        try {
          const query: NativeQuery = (sql, binds, bound) =>
            q(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound);
          await nativeIdentity(query, this.binding.readIdentity);
          const result = await stationSnapshot(query, schema, this.binding, this.zone, signal);
          checkStageBudget(signal); return result;
        } catch (e) { if (e instanceof StageArrivalError) nativeError = e; throw e; }
      }, signal);
    } catch (e) {
      if (nativeError) throw nativeError;
      if (record(e) && ["INVALID_SOURCE_DATA", "DEPENDENCY_TIMEOUT"].includes(String(e.code)))
        throw new StageArrivalError(e.code === "INVALID_SOURCE_DATA" ? "INVALID_SOURCE_DATA" : "DEPENDENCY_TIMEOUT");
      throw mapped(e);
    }
  }
  private async transaction<T>(work: (tx: Transaction) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const ambient = currentRequestBudget(), deadline = Math.min(ambient?.deadline ?? Infinity, performance.now() + 5000);
    let c: NativeConnection | undefined, active = false, unsafe = false, attempted = false, commitSent = false;
    let committed = false, primary: StageArrivalError | undefined, result: { value: T } | undefined, cancelled = false;
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
    signal?.addEventListener("abort", abort, { once: true });
    ambient?.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, Math.max(1, deadline - performance.now())); timer.unref();
    const op = async <R,>(invoke: () => Promise<R>) => {
      if (!c) stageFail("INTERNAL_ERROR");
      c.callTimeout = Math.max(1, Math.ceil(deadline - performance.now()));
      guard(); active = true;
      // Await the UNDERLYING promise, not merely a timeout race. Break/rollback
      // and pool shutdown cannot release an actively executing connection.
      try { const r = await invoke(); guard(); return r; } finally { active = false; }
    };
    try {
      guard(); c = await this.pool.getConnection(); guard();
      const tx: Transaction = {
        query: async (sql, binds, bound) => {
          if (!/^\s*(?:\/\*.*?\*\/\s*)?SELECT\b/is.test(sql) || bound < 1 || bound > 1001) stageFail("INTERNAL_ERROR");
          const r = await op(() => c!.execute(sql, binds, bound));
          if (!Array.isArray(r.rows) || r.rows.length > bound) stageFail("INVALID_SOURCE_DATA");
          return r.rows;
        },
        update: (sql, binds) => op(() => {
          guard(); attempted = true; return c!.execute(sql, binds, 1);
        }).then(r => r.rowsAffected),
        commit: finalGuard => op(() => {
          finalGuard(); guard(); commitSent = true;
          return c!.commit().then(() => { committed = true; });
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
            primary.cause = { cleanupCode: "NATIVE_STATION_ROLLBACK_UNCONFIRMED" };
          }
        }
        if (commitSent && (!committed || primary)) unsafe = true;
        try { await c.close(unsafe); }
        catch {
          primary ??= new StageArrivalError(commitSent ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_UNAVAILABLE");
          primary.cause = { cleanupCode: "NATIVE_STATION_CLOSE_FAILED" };
          try { await c.close(true); } catch { /* sanitized primary retained */ }
        }
      }
    }
    if (primary) throw primary;
    if (!result) stageFail("INTERNAL_ERROR");
    return result.value;
  }
  async execute(before: StationSnapshot,
    decide: (current: StationSnapshot) => { local: string; actor: string }, signal?: AbortSignal) {
    const expectedSchema = this.schema;
    if (!expectedSchema) stageFail("LIVE_WRITES_DISABLED");
    const proposed = await this.transaction(async tx => {
      const schema = await stationSafety(tx.query, this.binding);
      if (!same(schema, expectedSchema)) stageFail("STALE_PREPARATION");
      // External operational freeze remains necessary for contextual rows not
      // covered by these short physical NOWAIT locks and full DML predicates.
      for (const [table, column, value] of [
        ["SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEES", "EMPLOYEE_ID", this.binding.employeeId],
      ]) {
        const r = await tx.query(`/* station:lock:${table} */ SELECT ${column} AS "key"
          FROM SHIFTER.${table} WHERE ${column}=TO_NUMBER(:key) FOR UPDATE NOWAIT`, { key: value }, 2);
        if (r.length > 1) stageFail("AMBIGUOUS_ATTENDANCE");
        if (r.length !== 1) stageFail("SHIFT_DAY_NOT_FOUND");
      }
      const current = await stationSnapshot(tx.query, schema, this.binding, this.zone, signal);
      if (!same(before, current)) stageFail("STALE_PREPARATION");
      const next = decide(current);
      const update = stationUpdate(schema, current, this.binding, next.local, next.actor);
      // No await gap between the last business/budget decision and SQL send.
      decide(current); checkStageBudget(signal);
      const count = await tx.update(update.sql, update.binds);
      if (count === 0) stageFail("STALE_PREPARATION");
      if (count !== 1) stageFail("INVALID_SOURCE_DATA");
      await tx.commit(() => { decide(current); checkStageBudget(signal); });
      return { ...next, acknowledged: new Date().toISOString() };
    }, signal);
    try {
      checkStageBudget(signal);
      const actual = await this.read(signal), expected = structuredClone(before);
      const a = expected.rows.SHF_ATTENDANCE;
      if (!a) stageFail("COMMAND_OUTCOME_UNKNOWN");
      // Full preservation readback, not merely matching the two new columns.
      a.STATION_ARRIVAL_TIME = proposed.local; a.STATION_ARRIVAL_USER = proposed.actor;
      if (!same(actual, expected)) stageFail("COMMAND_OUTCOME_UNKNOWN");
      checkStageBudget(signal);
      const verified = new Date().toISOString();
      if (verified < proposed.acknowledged) stageFail("COMMAND_OUTCOME_UNKNOWN");
      return { ...proposed, verified };
    } catch { return stageFail("COMMAND_OUTCOME_UNKNOWN"); }
  }
}
