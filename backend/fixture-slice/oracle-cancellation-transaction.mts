// Bounded native protocol kernel: owns SQL, break, rollback and lease lifetime.
// It is not a domain writer, does not construct pools or operation authority.
import type { BindParameters } from "oracledb";
import type { NativeConnection, NativePool } from "./oracle-stage-arrival-uow.mts";
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { record } from "./contract-validation.mts";
export interface CancellationTransaction {
  query: NativeQuery;
  update(sql: string, binds: BindParameters, guard: () => void): Promise<number | undefined>;
  commit(guard: () => void): Promise<string>;
}
export function cancellationOracleError(e: unknown): StageArrivalError {
  if (e instanceof StageArrivalError) return e;
  const code = record(e) ? e.code : undefined;
  return new StageArrivalError(code === "ORA-00054" ? "COMMAND_IN_PROGRESS" :
    ["ORA-01013", "DPI-1067", "NJS-040"].includes(String(code)) ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
}
export async function cancellationTransaction<T>(pool: NativePool,
  work: (tx: CancellationTransaction) => Promise<T>, signal?: AbortSignal): Promise<T> {
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
    try { const value = await invoke(); guard(); return value; } finally { active = false; }
  };
  signal?.addEventListener("abort", abort, { once: true });
  ambient?.signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, Math.max(1, deadline - performance.now())); timer.unref();
  try {
    guard(); c = await pool.getConnection(); guard();
    const tx: CancellationTransaction = {
      query: async (sql, binds, bound) => {
        if (!/^\s*(?:\/\*.*?\*\/\s*)?SELECT\b/is.test(sql) || /\bNEXTVAL\b/i.test(sql) || bound < 1 || bound > 1001)
          stageFail("INTERNAL_ERROR");
        const r = await op(() => c!.execute(sql, binds, bound));
        if (!Array.isArray(r.rows) || r.rows.length > bound) stageFail("INVALID_SOURCE_DATA");
        return r.rows;
      },
      update: (sql, binds, finalGuard) => op(() => {
        if (!/^\/\* cancellation:update \*\/ UPDATE SHIFTER\.SHF_ATTENDANCE a SET\s+STATION_EXIT_TIME=NULL,STATION_EXIT_USER=NULL WHERE/.test(sql))
          stageFail("INTERNAL_ERROR");
        finalGuard(); guard(); attempted = true; return c!.execute(sql, binds, 1);
      }).then(r => r.rowsAffected),
      commit: finalGuard => op(() => {
        finalGuard(); guard(); commitSent = true;
        return c!.commit().then(() => { committed = true; return new Date().toISOString(); });
      }),
    };
    result = { value: await work(tx) }; guard();
  } catch (e) { primary = commitSent ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") : cancellationOracleError(e); }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort); ambient?.signal.removeEventListener("abort", abort);
    // Native execute and break promises settle BEFORE rollback/release.
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
      if (unsafe || commitSent && (!committed || primary)) {
        unsafe = true;
        if (attempted || commitSent) primary = new StageArrivalError("COMMAND_OUTCOME_UNKNOWN");
      }
      try { await c.close(unsafe); }
      catch {
        primary = attempted || commitSent ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") :
          primary ?? new StageArrivalError("DEPENDENCY_UNAVAILABLE");
        try { await c.close(true); } catch { /* owned sanitized UNKNOWN retained */ }
      }
    }
  }
  if (primary) throw primary;
  if (!result) stageFail("INTERNAL_ERROR");
  return result.value;
}
