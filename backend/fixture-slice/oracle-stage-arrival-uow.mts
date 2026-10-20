import oracledb from "oracledb";
import type { BindParameters } from "oracledb";
import { randomUUID } from "node:crypto";
import type { OracleEnvironment } from "./runtime-config.mts";
import type { OracleReadSession } from "./oracle-session.mts";
import type { NativeBinding } from "./native-stage-arrival-config.mts";
import { nativeIdentity, nativeSafety, nativeSnapshot, nativeUpdate } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeQuery, NativeSchema, NativeSnapshot } from "./oracle-stage-arrival-snapshot.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { record } from "./contract-validation.mts";
import { same } from "./stage-arrival-domain.mts";

// Separate port: OracleReadSession intentionally has neither commit nor a DML
// result. Tests inject only explicit doubles of these internal interfaces.
export interface NativeConnection {
  callTimeout: number;
  execute(sql: string, binds: BindParameters, bound: number): Promise<{ rows?: unknown[]; rowsAffected?: number }>;
  commit(): Promise<void>; rollback(): Promise<void>; break(): Promise<void>; close(drop?: boolean): Promise<void>;
}
export interface NativePool { getConnection(): Promise<NativeConnection>; close(): Promise<void> }
export async function createNativePool(env: OracleEnvironment): Promise<NativePool> {
  try {
    // Read pool initialized the approved Thick client first. No install/upgrade.
    if (oracledb.thin || !oracledb.oracleClientVersionString.startsWith("19.3.")) throw Error("Client");
    const pool = await oracledb.createPool({ user: env.user, password: env.password, connectString: env.connectString,
      poolMin: 0, poolMax: 1, poolIncrement: 1, queueMax: 1, queueTimeout: 1000,
      poolTimeout: 30, stmtCacheSize: 20, poolAlias: randomUUID() });
    return {
      async getConnection() {
        const c = await pool.getConnection();
        return {
          get callTimeout() { return c.callTimeout ?? 0; }, set callTimeout(v: number) { c.callTimeout = v; },
          async execute(sql, binds, bound) {
            const r = await c.execute<unknown>(sql, binds, { autoCommit: false, outFormat: oracledb.OUT_FORMAT_OBJECT,
              maxRows: bound, fetchArraySize: Math.min(bound, 100), prefetchRows: Math.min(bound, 100) });
            return { rows: r.rows, rowsAffected: r.rowsAffected };
          },
          commit: () => c.commit(), rollback: () => c.rollback(), break: () => c.break(),
          close: (drop = false) => c.close({ drop }),
        };
      }, close: () => pool.close(0),
    };
  } catch { return stageFail("DEPENDENCY_UNAVAILABLE"); }
}
function mapped(error: unknown): StageArrivalError {
  if (error instanceof StageArrivalError) return error;
  const code = record(error) && typeof error.code === "string" ? error.code : "";
  const result = new StageArrivalError(code === "ORA-00054" ? "COMMAND_IN_PROGRESS" :
    ["ORA-01013", "DPI-1067", "NJS-040"].includes(code) ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
  if (/^(ORA-[0-9]{5}|DPI-[0-9]{4}|NJS-[0-9]{3})$/.test(code)) result.cause = { oracleCode: code };
  return result;
}
export class OracleStageArrivalUow {
  readonly dataSource = "oracle-test";
  private readonly pool: NativePool;
  private readonly reads: OracleReadSession;
  private readonly binding: NativeBinding;
  private schema?: NativeSchema;
  constructor(pool: NativePool, reads: OracleReadSession, binding: NativeBinding) {
    this.pool = pool; this.reads = reads; this.binding = structuredClone(binding);
  }
  // Startup certification uses only SELECTs on the writer, followed by rollback.
  async initialize(signal?: AbortSignal) {
    this.schema = await this.lease(async q => nativeSafety(q, this.binding), signal);
  }
  async read(signal?: AbortSignal) {
    const schema = this.schema;
    if (!schema) stageFail("LIVE_WRITES_DISABLED");
    checkStageBudget(signal);
    let nativeError: StageArrivalError | undefined;
    try {
      return await this.reads.read(async q => {
        try {
          // Keep OracleReadSession's existing SELECT-only guard unchanged.
          const query: NativeQuery = (sql, binds, bound) =>
            q(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound);
          await nativeIdentity(query, this.binding.readIdentity);
          const snapshot = await nativeSnapshot(query, schema, this.binding);
          checkStageBudget(signal); return snapshot;
        } catch (e) {
          if (e instanceof StageArrivalError) nativeError = e;
          throw e;
        }
      }, signal);
    } catch (e) {
      if (nativeError) throw nativeError;
      if (e instanceof StageArrivalError) throw e;
      // OracleReadSession sanitizes custom errors to its read error family.
      if (record(e) && typeof e.code === "string" &&
          ["INVALID_SOURCE_DATA", "DEPENDENCY_TIMEOUT", "DEPENDENCY_UNAVAILABLE"].includes(e.code))
        throw new StageArrivalError(e.code === "INVALID_SOURCE_DATA" ? "INVALID_SOURCE_DATA" :
          e.code === "DEPENDENCY_TIMEOUT" ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
      throw mapped(e);
    }
  }
  private async lease<T>(work: (q: NativeQuery) => Promise<T>, signal?: AbortSignal) {
    // Reuse the same safe lifecycle without exposing mutation to startup.
    return this.transaction(async tx => work(tx.query), signal);
  }
  private async transaction<T>(work: (tx: {
    query: NativeQuery; update(sql: string, binds: BindParameters): Promise<number | undefined>;
    commit(): Promise<void>;
  }) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const ambient = currentRequestBudget(), deadline = Math.min(ambient?.deadline ?? Infinity, performance.now() + 5000);
    let c: NativeConnection | undefined, active = false, unsafe = false, attempted = false, commitAttempted = false;
    let committed = false, primary: StageArrivalError | undefined, result: T | undefined;
    let cancelled = false;
    const breaks: Promise<void>[] = [];
    const abort = () => {
      if (cancelled) return;
      cancelled = true;
      if (active && c) {
        try { breaks.push(c.break().catch(() => { unsafe = true; })); }
        catch { unsafe = true; }
      }
    };
    const guard = () => {
      checkStageBudget(signal);
      if (cancelled || performance.now() >= deadline) stageFail("DEPENDENCY_TIMEOUT");
    };
    signal?.addEventListener("abort", abort, { once: true });
    ambient?.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, Math.max(1, deadline - performance.now()));
    timer.unref();
    const op = async <R,>(invoke: () => Promise<R>) => {
      if (!c) stageFail("INTERNAL_ERROR");
      c.callTimeout = Math.max(1, Math.ceil(deadline - performance.now()));
      guard(); active = true;
      try { const r = await invoke(); guard(); return r; }
      finally { active = false; }
    };
    try {
      guard(); c = await this.pool.getConnection(); guard();
      const tx = {
        query: async (sql: string, binds: BindParameters, bound: number) => {
          if (!/^\s*(?:\/\*.*?\*\/\s*)?SELECT\b/is.test(sql) || bound < 1 || bound > 1001) stageFail("INTERNAL_ERROR");
          const r = await op(() => c!.execute(sql, binds, bound));
          if (!Array.isArray(r.rows) || r.rows.length > bound) stageFail("INVALID_SOURCE_DATA");
          return r.rows;
        },
        update: async (sql: string, binds: BindParameters) => op(() => {
          // This callback is synchronous through initiating execute: no await
          // gap between the last explicit+ALS guard and attempted effect.
          guard(); attempted = true;
          return c!.execute(sql, binds, 1);
        }).then(r => r.rowsAffected),
        commit: async () => op(() => {
          guard(); commitAttempted = true;
          return c!.commit().then(() => { committed = true; });
        }),
      };
      result = await work(tx);
      guard();
    } catch (e) {
      primary = commitAttempted ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") : mapped(e);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      ambient?.signal.removeEventListener("abort", abort);
      // All native operations have settled at this point. A pending break must
      // settle before rollback; never release a busy/uncertain lease.
      await Promise.all(breaks);
      if (c) {
        if (!committed) {
          try {
            c.callTimeout = 1000; await c.rollback();
            if (attempted && !commitAttempted && primary)
              primary = new StageArrivalError(primary.code, "rolled-back");
          } catch {
            unsafe = true;
            primary = attempted || commitAttempted ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") :
              primary ?? new StageArrivalError("DEPENDENCY_UNAVAILABLE");
            primary.cause = { cleanupCode: "NATIVE_ROLLBACK_UNCONFIRMED" };
          }
        }
        if (commitAttempted && (!committed || primary)) unsafe = true;
        try { await c.close(unsafe); }
        catch {
          // Do not overwrite the primary error with cleanup details.
          primary ??= new StageArrivalError(commitAttempted ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_UNAVAILABLE");
          primary.cause = { cleanupCode: "NATIVE_CLOSE_FAILED" };
          // Native operation/rollback have settled; do not return an unsafe
          // lease to the pool if ordinary close itself was not acknowledged.
          try { await c.close(true); } catch { /* primary retained, no raw logs */ }
        }
      }
    }
    if (primary) throw primary;
    return result as T;
  }
  async execute(before: NativeSnapshot,
    decide: (current: NativeSnapshot) => { local: string; actor: string }, signal?: AbortSignal) {
    const expectedSchema = this.schema;
    if (!expectedSchema) stageFail("LIVE_WRITES_DISABLED");
    const proposed = await this.transaction(async tx => {
      const schema = await nativeSafety(tx.query, this.binding);
      if (!same(schema, expectedSchema)) stageFail("STALE_PREPARATION");
      // Existing physical row locks plus full predicates. These locks are NOT
      // a promise of cross-table serializability: the operator's contextual
      // writer freeze (including legacy/report/policy writers) is mandatory.
      for (const [table, column, value] of [
        ["SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEE_DAY", "SHF_EMPLOYEE_DAY_ID", this.binding.shiftDayId],
        ["SHF_EMPLOYEES", "EMPLOYEE_ID", this.binding.employeeId],
      ]) {
        const rows = await tx.query(`/* native:lock:${table} */ SELECT ${column} AS "key"
          FROM SHIFTER.${table} WHERE ${column}=TO_NUMBER(:key) FOR UPDATE NOWAIT`, { key: value }, 2);
        if (rows.length > 1) stageFail("AMBIGUOUS_ATTENDANCE");
        if (rows.length !== 1) stageFail("SHIFT_DAY_NOT_FOUND");
      }
      const current = await nativeSnapshot(tx.query, schema, this.binding);
      const next = decide(current);
      if (!same(before, current)) stageFail("STALE_PREPARATION");
      checkStageBudget(signal);
      const update = nativeUpdate(schema, current, this.binding, next.local, next.actor);
      const count = await tx.update(update.sql, update.binds);
      if (count === 0) stageFail("STALE_PREPARATION");
      if (count !== 1) stageFail("INVALID_SOURCE_DATA");
      checkStageBudget(signal);
      await tx.commit();
      return { ...next, acknowledged: new Date().toISOString() };
    }, signal);
    // Writer lease is released before acquiring a new independent READ ONLY
    // transaction. No commit retry, compensation, or success from equality.
    try {
      checkStageBudget(signal);
      const actual = await this.read(signal), expected = structuredClone(before);
      const a = expected.rows.SHF_ATTENDANCE;
      if (!a) stageFail("COMMAND_OUTCOME_UNKNOWN");
      a.STAGE_ARRIVAL_TIME = proposed.local; a.STAGE_ARRIVAL_USER = proposed.actor; a.TADREECH = "0";
      if (!same(actual, expected)) stageFail("COMMAND_OUTCOME_UNKNOWN");
      checkStageBudget(signal);
      const verified = new Date().toISOString();
      if (verified < proposed.acknowledged) stageFail("COMMAND_OUTCOME_UNKNOWN");
      return { ...proposed, verified };
    } catch { return stageFail("COMMAND_OUTCOME_UNKNOWN"); }
  }
}
