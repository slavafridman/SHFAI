// Operator-only basic connectivity, NOT readiness, target identity or write authority.
// No ENV files, application authentication, business records or metadata inputs.
import { fork } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { oracleEnvironment } from "./runtime-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { createOraclePool } from "./oracle-session.mts";
import type { OracleConnection, OraclePool } from "./oracle-session.mts";
import { record } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";

const inputKeys = [
  "SHF_ORACLE_CONNECT_STRING", "SHF_ORACLE_USER", "SHF_ORACLE_PASSWORD",
  "SHF_ORACLE_CLIENT_LIB_DIR", "TNS_ADMIN",
] as const;
const reasons = [
  "NONE", "OPT_IN_REQUIRED", "MISSING_INPUTS", "INPUT_REJECTED", "RUNTIME_UNAPPROVED",
  "QUERY_OR_CONNECTION_FAILED", "CLEANUP_UNACKNOWLEDGED", "WORKER_UNACKNOWLEDGED",
] as const;
type Summary = {
  status: "CONNECTIVITY_OK" | "CONNECTION_FAILED" | "BLOCKED" | "UNKNOWN";
  reason: typeof reasons[number];
  missing: string[];
  connected: boolean;
  querySucceeded: boolean;
  rollbackAck: boolean;
  closeAck: boolean;
  poolDrainAck: boolean;
  childExitAck: boolean;
  targetIdentityVerified: false;
  nativeWritesAuthorized: false;
  releaseReady: false;
  oracleCode?: string;
};
function empty(): Summary {
  return {
    status: "BLOCKED", reason: "INPUT_REJECTED", missing: [],
    connected: false, querySucceeded: false, rollbackAck: false, closeAck: false,
    poolDrainAck: false, childExitAck: false,
    targetIdentityVerified: false, nativeWritesAuthorized: false, releaseReady: false,
  };
}
function localPath(v: string | undefined): boolean {
  // Syntax only: do not discover/read client or TNS files. Driver owns resolution.
  return typeof v === "string" && v.length <= 4096 && v.trim() === v &&
    /^[A-Za-z]:\\/.test(v) && !/[\u0000-\u001f]/.test(v);
}
function preflight(source: NodeJS.ProcessEnv, optIn: boolean): { summary: Summary; oracle?: OracleEnvironment } {
  const summary = empty();
  summary.missing = inputKeys.filter(k => !source[k]);
  if (!optIn) { summary.reason = "OPT_IN_REQUIRED"; return { summary }; }
  if (source.NODE_ENV !== undefined && !["development", "test"].includes(source.NODE_ENV) ||
    source.SHF_APP_ENV !== undefined && !["dev", "test"].includes(source.SHF_APP_ENV) ||
    Object.keys(source).some(k => k === "SHF_ORACLE_CONFIG" || k.startsWith("SHF_NATIVE_") ||
      k.startsWith("SHF_TEST_ORACLE_") || /^SHF_.*(?:WRITE|COOR)/.test(k)))
    return { summary };
  if (summary.missing.length) { summary.reason = "MISSING_INPUTS"; return { summary }; }
  try {
    const oracle = oracleEnvironment(source); // existing TEST alias allowlist
    // Oracle unquoted account casing only; reject quoted/case-sensitive names.
    // Preserve the supplied username when connecting.
    if (!/^shifter$/i.test(oracle.user) || !localPath(oracle.clientLibDir) || !localPath(source.TNS_ADMIN))
      return { summary };
    return { summary, oracle };
  } catch { return { summary }; }
}
export function validateConnectionRuntime(platform: string, node: string, driver?: string): void {
  if (platform !== "win32" || !/^24\./.test(node) || driver !== undefined && driver !== "26.0.0")
    throw { connectivityBlocked: true };
}
async function realPool(oracle: OracleEnvironment): Promise<OraclePool> {
  validateConnectionRuntime(process.platform, process.versions.node);
  const { default: driver } = await import("oracledb");
  validateConnectionRuntime(process.platform, process.versions.node, driver.versionString);
  // Existing factory: Thick Client19.3, poolMin0, lazy driver, autoCommit:false.
  return createOraclePool(oracle);
}
function safeCode(error: unknown): string | undefined {
  const e = record(error) && record(error.cause) ? error.cause : error;
  const code = record(e) ? e.oracleCode ?? e.code ??
    (Number.isInteger(e.errorNum) && Number(e.errorNum) > 0 && Number(e.errorNum) <= 99999
      ? `ORA-${String(e.errorNum).padStart(5, "0")}` : undefined) : undefined;
  return typeof code === "string" && /^(?:ORA-\d{5}|NJS-\d{3}|DPI-\d{4})$/.test(code) ? code : undefined;
}

// Worker operation. Injected pool is for isolated tests only, never selected by ENV.
// Production execution MUST use the supervised CLI below: native acquisition and
// cleanup may hang beyond callTimeout and are bounded by killing the owned child.
export async function runConnectionProbe(source: NodeJS.ProcessEnv, optIn: boolean,
  deps: { createPool?: (env: OracleEnvironment) => Promise<OraclePool> } = {}): Promise<Summary> {
  const { summary, oracle } = preflight(source, optIn);
  if (!oracle) return summary;
  let pool: OraclePool | undefined, connection: OracleConnection | undefined;
  try {
    pool = await (deps.createPool ?? realPool)(oracle);
    connection = await pool.getConnection(); // exactly one acquisition, no retries
    summary.connected = true;
    connection.callTimeout = 3000;
    const rows = await connection.execute('SELECT 1 AS "ok" FROM dual', {}, 2);
    if (!Array.isArray(rows) || rows.length !== 1 || !exact(rows[0], ["ok"]) || rows[0].ok !== 1)
      throw new Error("Unexpected constant query result");
    summary.querySucceeded = true;
    summary.status = "CONNECTIVITY_OK";
    summary.reason = "NONE";
  } catch (error) {
    summary.status = record(error) && error.connectivityBlocked === true ? "BLOCKED" : "CONNECTION_FAILED";
    summary.reason = summary.status === "BLOCKED" ? "RUNTIME_UNAPPROVED" : "QUERY_OR_CONNECTION_FAILED";
    const code = safeCode(error);
    if (code) summary.oracleCode = code;
  } finally {
    let cleanupFailed = false;
    if (connection) {
      try { connection.callTimeout = 1000; await connection.rollback(); summary.rollbackAck = true; }
      catch { cleanupFailed = true; }
      try { await connection.close(!summary.rollbackAck); summary.closeAck = true; }
      catch { cleanupFailed = true; }
    }
    if (pool) {
      try { await pool.close(); summary.poolDrainAck = true; }
      catch { cleanupFailed = true; }
    }
    if (cleanupFailed) { summary.status = "UNKNOWN"; summary.reason = "CLEANUP_UNACKNOWLEDGED"; }
  }
  return summary;
}

function isPacket(v: unknown): v is Summary {
  const keys = Object.keys(empty());
  if (!record(v) || !exact(v, Object.hasOwn(v, "oracleCode") ? [...keys, "oracleCode"] : keys) ||
    !["CONNECTIVITY_OK", "CONNECTION_FAILED", "BLOCKED", "UNKNOWN"].includes(String(v.status)) ||
    !reasons.some(r => r === v.reason) || !Array.isArray(v.missing) ||
    v.missing.length > inputKeys.length || new Set(v.missing).size !== v.missing.length ||
    !v.missing.every(k => inputKeys.some(known => known === k)) ||
    ["connected", "querySucceeded", "rollbackAck", "closeAck", "poolDrainAck"].some(k => typeof v[k] !== "boolean") ||
    v.childExitAck !== false || v.targetIdentityVerified !== false ||
    v.nativeWritesAuthorized !== false || v.releaseReady !== false ||
    Object.hasOwn(v, "oracleCode") && (typeof v.oracleCode !== "string" ||
      !/^(?:ORA-\d{5}|NJS-\d{3}|DPI-\d{4})$/.test(v.oracleCode))) return false;
  if ((v.querySucceeded || v.rollbackAck || v.closeAck) && !v.connected ||
    v.connected && v.missing.length !== 0) return false;
  if (v.status === "CONNECTIVITY_OK")
    return v.reason === "NONE" && v.missing.length === 0 && v.connected === true &&
      v.querySucceeded === true && v.rollbackAck === true && v.closeAck === true &&
      v.poolDrainAck === true && !Object.hasOwn(v, "oracleCode");
  if (v.status === "CONNECTION_FAILED")
    return v.reason === "QUERY_OR_CONNECTION_FAILED" && v.missing.length === 0 &&
      v.querySucceeded === false &&
      (!v.connected || v.poolDrainAck === true && v.rollbackAck === true && v.closeAck === true);
  if (v.status === "BLOCKED")
    return v.reason === "RUNTIME_UNAPPROVED" && !v.connected && !v.querySucceeded &&
      !v.rollbackAck && !v.closeAck && !v.poolDrainAck && !Object.hasOwn(v, "oracleCode");
  return v.reason === "CLEANUP_UNACKNOWLEDGED" &&
    (!v.poolDrainAck || v.connected === true && (!v.rollbackAck || !v.closeAck));
}
export function connectionCheckExitCode(summary: Summary): number {
  if (summary.status === "CONNECTIVITY_OK" && summary.childExitAck) return 0;
  if (summary.status === "CONNECTION_FAILED" && summary.childExitAck) return 1;
  return 2;
}
function workerExitCode(summary: Summary): number {
  return summary.status === "CONNECTIVITY_OK" ? 0 : summary.status === "CONNECTION_FAILED" ? 1 : 2;
}
export async function runConnectionCheck(source: NodeJS.ProcessEnv, optIn: boolean,
  deps: {
    forkChild?: (env: NodeJS.ProcessEnv) => ChildProcess;
    budgetMs?: number; // isolated tests may shorten, never extend the 5s deadline
    signal?: AbortSignal;
  } = {}): Promise<Summary> {
  const budget = Math.max(50, Math.min(5000, Number.isFinite(deps.budgetMs) ? deps.budgetMs! : 5000));
  const deadline = performance.now() + budget;
  const { summary, oracle } = preflight(source, optIn);
  if (!oracle) return summary; // no fork/driver/client resolution on rejected inputs
  if (deps.signal?.aborted) return { ...empty(), status: "UNKNOWN", reason: "WORKER_UNACKNOWLEDGED" };
  const env: NodeJS.ProcessEnv = {};
  for (const key of inputKeys) env[key] = source[key];
  // Minimal Windows process support, not arbitrary inherited private settings.
  for (const key of Object.keys(source))
    if (["SYSTEMROOT", "WINDIR", "PATH", "TEMP", "TMP", "USERPROFILE", "COMSPEC", "PATHEXT"].includes(key.toUpperCase()))
      env[key] = source[key];
  return new Promise<Summary>(resolve => {
    let child: ChildProcess | undefined, packet: Summary | undefined;
    let settled = false, invalid = false, terminating = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    let endTimer: ReturnType<typeof setTimeout> | undefined;
    function finish(exitAck: boolean, code: number | null = null, signal: NodeJS.Signals | null = null) {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer); clearTimeout(endTimer);
      deps.signal?.removeEventListener("abort", cancel);
      child?.removeListener("message", message);
      child?.removeListener("exit", exited);
      // Retain a harmless error listener: late spawn errors must not print stacks.
      if (!invalid && !terminating && exitAck && packet && signal === null &&
        code === workerExitCode(packet) && performance.now() < deadline) {
        resolve({ ...packet, childExitAck: true });
      } else {
        resolve({ ...empty(), status: "UNKNOWN", reason: "WORKER_UNACKNOWLEDGED", childExitAck: exitAck });
      }
    }
    function terminate() {
      if (settled || terminating) return;
      terminating = true;
      try { child?.kill("SIGKILL"); } catch { /* kill delivery is not an exit ACK */ }
    }
    function message(value: unknown) {
      if (settled) return;
      if (packet || !isPacket(value)) { invalid = true; terminate(); return; }
      packet = value; // only one complete closed-set packet; no progress payloads
    }
    function cancel() { invalid = true; terminate(); }
    function exited(code: number | null, signal: NodeJS.Signals | null) { finish(true, code, signal); }
    // Reserve time INSIDE the same absolute budget for actual child exit ACK.
    killTimer = setTimeout(terminate, Math.max(1, deadline - performance.now() - Math.min(500, budget / 3)));
    endTimer = setTimeout(() => { terminate(); finish(false); }, Math.max(1, deadline - performance.now()));
    try {
      child = (deps.forkChild ?? (inputs => fork(fileURLToPath(import.meta.url),
        ["--test-connectivity", "--connectivity-worker"], {
          env: inputs, execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"],
        })))(env);
      child.on("message", message);
      child.once("exit", exited);
      child.on("error", () => { invalid = true; terminate(); if (!child?.pid) finish(false); });
      if (child.exitCode !== null || child.signalCode !== null) finish(true, child.exitCode, child.signalCode);
      else if (!child.pid) { invalid = true; terminate(); finish(false); }
      if (!settled) {
        deps.signal?.addEventListener("abort", cancel, { once: true });
        if (deps.signal?.aborted) cancel();
      }
    } catch { invalid = true; terminate(); finish(false); }
  });
}
if (import.meta.main) {
  const worker = process.argv.slice(2).join(" ") === "--test-connectivity --connectivity-worker" && !!process.send;
  if (worker) {
    let result: Summary;
    try { result = await runConnectionProbe(process.env, true); }
    catch { result = { ...empty(), status: "UNKNOWN", reason: "WORKER_UNACKNOWLEDGED" }; }
    process.exitCode = workerExitCode(result);
    process.send?.(result, () => process.disconnect());
    // Natural exit after acknowledged pool drain; never force a successful exit.
  } else {
    const controller = new AbortController(), cancel = () => controller.abort();
    process.once("SIGINT", cancel);
    process.once("SIGTERM", cancel);
    const result = await runConnectionCheck(process.env,
      process.argv.length === 3 && process.argv[2] === "--test-connectivity", { signal: controller.signal });
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
    // At deadline an unacknowledged child must not keep this CLI alive via IPC.
    // Successful exit is possible only AFTER the supervisor observed child exit.
    process.stdout.write(JSON.stringify(result) + "\n", () => process.exit(connectionCheckExitCode(result)));
  }
}
