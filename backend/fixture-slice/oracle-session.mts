import oracledb from "oracledb";
import type { BindParameters } from "oracledb";
import { SliceError } from "./errors.mts";
import { CurrentShiftError } from "./current-shifts-errors.mts";
import { ShiftSearchError } from "./shift-search-errors.mts";
import { MyShiftsError } from "./my-shifts-errors.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { record } from "./contract-validation.mts";
import { randomUUID } from "node:crypto";
import { ShiftItemsError } from "./shift-items-errors.mts";

// Minimal isolated-mockable infrastructure port; never exposes raw Oracle errors.
export interface OracleConnection {
  callTimeout: number;
  execute(sql: string, binds: BindParameters, maxRows: number): Promise<unknown[]>;
  break(): Promise<void>;
  rollback(): Promise<void>;
  close(drop?: boolean): Promise<void>;
}
export interface OraclePool {
  getConnection(): Promise<OracleConnection>;
  close(): Promise<void>;
}
export async function createOraclePool(env: OracleEnvironment): Promise<OraclePool> {
  try {
    oracledb.initOracleClient({ libDir: env.clientLibDir });
    if (oracledb.thin || !oracledb.oracleClientVersionString.startsWith("19.3."))
      throw new Error("Unapproved Oracle client");
    const pool = await oracledb.createPool({
      user: env.user, password: env.password, connectString: env.connectString,
      poolMin: 0, poolMax: 4, poolIncrement: 1, queueMax: 20, queueTimeout: 2000,
      poolTimeout: 30, stmtCacheSize: 20,
      poolAlias: randomUUID(),
    });
    return {
      async getConnection() {
        const c = await pool.getConnection();
        return {
          get callTimeout() { return c.callTimeout ?? 0; },
          set callTimeout(value: number) { c.callTimeout = value; },
          async execute(sql, binds, maxRows) {
            const result = await c.execute<unknown>(sql, binds, {
              autoCommit: false, outFormat: oracledb.OUT_FORMAT_OBJECT,
              maxRows, fetchArraySize: Math.min(maxRows, 100), prefetchRows: Math.min(maxRows, 100),
            });
            return result.rows ?? [];
          },
          break: () => c.break(), rollback: () => c.rollback(), close: (drop = false) => c.close({ drop }),
        };
      },
      close: () => pool.close(0),
    };
  } catch (error) { return dependency(error); }
}
function dependency(error: unknown): never {
  if (error instanceof SliceError || error instanceof CurrentShiftError || error instanceof ShiftSearchError ||
      error instanceof MyShiftsError || error instanceof ShiftItemsError) throw error;
  const code = record(error) && typeof error.code === "string" ? error.code
    : record(error) && typeof error.errorNum === "number" &&
        Number.isInteger(error.errorNum) && error.errorNum > 0 && error.errorNum <= 99999
      ? `ORA-${String(error.errorNum).padStart(5, "0")}` : undefined;
  const failure = new SliceError(code === "DPI-1067" || code === "NJS-040" || code === "ORA-01013"
    ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE");
  // Internal diagnostic code only; no raw driver message/SQL/connection detail.
  // Problem serializers project only the existing public fields.
  if (typeof code === "string" && /^(?:ORA-[0-9]{5}|DPI-[0-9]{4}|NJS-[0-9]{3})$/.test(code))
    failure.cause = { oracleCode: code };
  throw failure;
}
export class OracleReadSession {
  private readonly pool: OraclePool;
  constructor(pool: OraclePool) { this.pool = pool; }
  async read<T>(work: (query: (sql: string, binds: BindParameters, bound: number) => Promise<unknown[]>) => Promise<T>): Promise<T> {
    const context = currentRequestBudget();
    const controller = new AbortController();
    const deadline = context?.deadline ?? performance.now() + 5000;
    const abort = () => controller.abort(new SliceError("DEPENDENCY_TIMEOUT"));
    context?.signal.addEventListener("abort", abort, { once: true });
    if (context?.signal.aborted) abort();
    const timer = setTimeout(abort, Math.max(1, deadline - performance.now()));
    let connection: OracleConnection | undefined;
    let pendingBreak: Promise<void> | undefined;
    let active = false;
    let primaryFailure = false;
    let unsafe = false;
    const cancel = () => {
      if (active && connection)
        pendingBreak = connection.break().catch(() => { unsafe = true; });
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    const query = async (sql: string, binds: BindParameters, bound: number) => {
      controller.signal.throwIfAborted();
      if (!connection || !Number.isInteger(bound) || bound < 1 || bound > 1001)
        throw new SliceError("INTERNAL_ERROR");
      if (sql !== "SET TRANSACTION READ ONLY" && !/^\s*(SELECT|WITH)\b/i.test(sql))
        throw new SliceError("INTERNAL_ERROR");
      connection.callTimeout = Math.max(1, Math.min(5000, Math.ceil(deadline - performance.now())));
      active = true;
      try {
        const rows = await connection.execute(sql, binds, bound);
        controller.signal.throwIfAborted();
        if (!Array.isArray(rows) || rows.length > bound) throw new SliceError("INVALID_SOURCE_DATA");
        return rows;
      } finally { active = false; }
    };
    try {
      controller.signal.throwIfAborted();
      connection = await this.pool.getConnection();
      controller.signal.throwIfAborted();
      await query("SET TRANSACTION READ ONLY", {}, 1);
      return await work(query);
    } catch (error) {
      primaryFailure = true;
      if (controller.signal.aborted) throw new SliceError("DEPENDENCY_TIMEOUT");
      return dependency(error);
    } finally {
      clearTimeout(timer);
      context?.signal.removeEventListener("abort", abort);
      controller.signal.removeEventListener("abort", cancel);
      if (pendingBreak) await pendingBreak;
      if (connection) {
        // Wait for the native operation/break before releasing; never return a busy lease.
        let cleanupError: unknown;
        try { connection.callTimeout = 1000; await connection.rollback(); } catch (error) { cleanupError = error; unsafe = true; }
        try { await connection.close(unsafe); } catch (error) { cleanupError ??= error; }
        if (cleanupError !== undefined && !primaryFailure) dependency(cleanupError);
      }
    }
  }
}
