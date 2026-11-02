// Standalone operator check, NOT a server entrypoint, certificate or command authority.
// No ENV files, native bindings, allowance paths or business records are read.
import { lookup } from "node:dns/promises";
import { fork } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { win32 } from "node:path";
import { isIP } from "node:net";
import { oracleEnvironment, validateRuntimeConfig } from "./runtime-config.mts";
import { shiftManagementMode } from "./shift-management-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { createOraclePool } from "./oracle-session.mts";
import type { OracleConnection, OraclePool } from "./oracle-session.mts";
import { parseNativeIdentity, nativeEndpointProof, nativeEndpointHostMatches,
  nativeTargetReference, resolveNativeEndpointProof } from "./native-stage-arrival-config.mts";
import type { NativeIdentity, NativeEndpointProof, NativeEndpointResolver } from "./native-stage-arrival-config.mts";
import { nativeMetadataQueries } from "./oracle-stage-arrival-snapshot.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { same } from "./stage-arrival-domain.mts";

export const readinessKeys = [
  "SHF_APP_ENV", "NODE_ENV", "SHF_ORACLE_CONFIG", "SHF_ORACLE_CONNECT_STRING",
  "SHF_ORACLE_USER", "SHF_ORACLE_PASSWORD", "SHF_ORACLE_CLIENT_LIB_DIR",
  "SHF_ORACLE_READINESS_PROOF", "SHF_ORACLE_READINESS_METADATA",
  "TNS_ADMIN",
] as const;
export interface ReadinessSummary {
  version: "oracle-test-readiness-v1";
  status: "PASS" | "BLOCKED";
  codes: ReadinessCode[];
  presence: Record<string, boolean>;
  missing: string[];
  poolAttempts: number;
  connectionAttempts: number;
  queries: number;
  identityPass: boolean;
  metadataPass: boolean;
  metadataRows: number;
  rollbackAck: boolean;
  leaseCloseAck: boolean;
  poolDrainAck: boolean;
  oracleCode?: string;
  unknown: readonly string[];
}
export interface ReadinessDependencies {
  createPool?: (env: OracleEnvironment) => Promise<OraclePool>;
  resolveEndpoint?: NativeEndpointResolver;
  signal?: AbortSignal;
  // Isolated tests can SHORTEN, never extend the 5s total budget.
  budgetMs?: number;
  onProgress?: (summary: ReadinessSummary) => void;
}
type ReadProof = {
  readIdentity: NativeIdentity; endpointProof: NativeEndpointProof;
  serviceName: string; runtimeAlias: string; windowStart: string; windowEnd: string;
};
function fail(code: string): never { throw { readinessCode: code }; }
function json(raw: string): unknown {
  if (Buffer.byteLength(raw, "utf8") > 16384) fail("INVALID_CONFIG");
  try { return parseStageJson(raw); } catch { return fail("INVALID_CONFIG"); }
}
function reference(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v);
}
function instant(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
    Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
}
function proof(raw: string, env: OracleEnvironment): ReadProof {
  const v = json(raw);
  if (!exact(v, ["version", "purpose", "environment", "independentOperatorPinned",
    "frozenIdentityReference", "runtimeAliasBindingReference", "runtimeAlias",
    "windowStart", "windowEnd", "readIdentity", "endpointProof", "serviceName"]) ||
    v.version !== "oracle-test-readiness-v1" || v.purpose !== "metadata-review" ||
    v.environment !== "test" || v.independentOperatorPinned !== true ||
    !reference(v.frozenIdentityReference) || !reference(v.runtimeAliasBindingReference) ||
    v.frozenIdentityReference === v.runtimeAliasBindingReference ||
    v.runtimeAlias !== env.connectString || !reference(v.serviceName) ||
    !instant(v.windowStart) || !instant(v.windowEnd))
    fail("INDEPENDENT_PROOF_REQUIRED");
  let readIdentity: NativeIdentity, endpointProof: NativeEndpointProof;
  try {
    readIdentity = parseNativeIdentity(v.readIdentity);
    endpointProof = nativeEndpointProof(v.endpointProof);
  } catch { return fail("INVALID_IDENTITY_PROOF"); }
  const target = nativeTargetReference(readIdentity).target;
  if (readIdentity.user !== env.user || readIdentity.user !== readIdentity.schema ||
    readIdentity.schema !== "SHIFTER" ||
    !endpointProof.connectionAliases.includes(env.connectString.toUpperCase()) ||
    (target.kind === "sid" ? !same(target.endpointProof, endpointProof) :
      target.serviceName !== v.serviceName || !nativeEndpointHostMatches(endpointProof, target.host)))
    fail("INVALID_IDENTITY_PROOF");
  return { readIdentity, endpointProof, serviceName: v.serviceName, runtimeAlias: v.runtimeAlias,
    windowStart: v.windowStart, windowEnd: v.windowEnd };
}
function current(p: ReadProof) {
  const now = Date.now();
  if (Date.parse(p.windowStart) > now || now >= Date.parse(p.windowEnd) ||
    Date.parse(p.windowStart) >= Date.parse(p.windowEnd)) fail("PROOF_WINDOW_INVALID");
}
const identitySql = `SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "database",
  SYS_CONTEXT('USERENV','SERVER_HOST') AS "host",SYS_CONTEXT('USERENV','SERVICE_NAME') AS "service",
  SYS_CONTEXT('USERENV','INSTANCE_NAME') AS "instance",
  SYS_CONTEXT('USERENV','SESSION_USER') AS "user",SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS "schema" FROM dual`;
// Reuse the versioned visible owner-column collector; constant scope, bound column
// names, no caller-selected SQL/identifiers and no business-table FROM.
const columnsSql = `SELECT * FROM (${nativeMetadataQueries(["SHF_ATTENDANCE"], "owner-test-limited-v1")[0]})
  WHERE "columnName" IN (:exitTime,:exitUser)`;
const charsetSql = `SELECT parameter AS "parameter",value AS "value" FROM nls_database_parameters
  WHERE parameter IN ('NLS_CHARACTERSET','NLS_NCHAR_CHARACTERSET') ORDER BY parameter`;
function verifyIdentity(rows: unknown[], p: ReadProof) {
  const r = rows[0], expected = p.readIdentity, target = nativeTargetReference(expected).target;
  if (rows.length !== 1 || !exact(r, ["database", "host", "service", "instance", "user", "schema"]) ||
    r.database !== expected.database || r.user !== expected.user || r.schema !== expected.schema ||
    r.service !== p.serviceName || !nativeEndpointHostMatches(p.endpointProof, r.host) ||
    (target.kind === "sid" ? r.instance !== target.instanceSid : r.host !== target.host))
    fail("IDENTITY_MISMATCH");
}
function verifyMetadata(columns: unknown[], charset: unknown[]) {
  if (columns.length !== 2 || charset.length !== 2) fail("METADATA_INCOMPLETE");
  for (const name of ["STATION_EXIT_TIME", "STATION_EXIT_USER"]) {
    const matches = columns.filter(r => record(r) && r.columnName === name);
    const r = matches[0];
    if (matches.length !== 1 || !record(r) || r.tableName !== "SHF_ATTENDANCE" ||
      r.nullable !== "Y" || r.virtualColumn !== "NO" ||
      typeof r.dataLength !== "number" || !Number.isSafeInteger(r.dataLength) || r.dataLength < 1 ||
      (name === "STATION_EXIT_TIME" ? r.dataType !== "DATE" || r.dataLength !== 7 || r.charUsed !== null :
        r.dataType !== "VARCHAR2" || !["B", "C"].includes(String(r.charUsed))))
      fail("METADATA_MISMATCH");
  }
  for (const parameter of ["NLS_CHARACTERSET", "NLS_NCHAR_CHARACTERSET"]) {
    const matches = charset.filter(r => record(r) && r.parameter === parameter);
    if (matches.length !== 1 || !record(matches[0]) ||
      typeof matches[0].value !== "string" || !/^[A-Z0-9_]{1,64}$/.test(matches[0].value))
      fail("METADATA_MISMATCH");
  }
}
const resolveEndpoint: NativeEndpointResolver = async (name, signal) => {
  signal.throwIfAborted();
  const result = await lookup(name, { all: true });
  signal.throwIfAborted();
  return result.map(r => r.address);
};
async function realPool(env: OracleEnvironment) {
  // Factory-only dependency check. No client discovery/install/path logging.
  if (process.platform !== "win32" || !process.versions.node.startsWith("24."))
    fail("RUNTIME_UNAPPROVED");
  const { default: driver } = await import("oracledb");
  if (driver.versionString !== "26.0.0") fail("DRIVER_UNAPPROVED");
  return createOraclePool(env);
}
function safeCode(error: unknown): string | undefined {
  const e = record(error) && record(error.cause) ? error.cause : error;
  const code = record(e) ? e.oracleCode ?? e.code ??
    (Number.isInteger(e.errorNum) && Number(e.errorNum) > 0 && Number(e.errorNum) <= 99999
      ? `ORA-${String(e.errorNum).padStart(5, "0")}` : undefined) : undefined;
  return typeof code === "string" && /^(?:ORA-\d{5}|DPI-\d{4}|NJS-\d{3})$/.test(code) ? code : undefined;
}
const cleanupCodes = ["DEPENDENCY_OR_CONFIG_UNAVAILABLE", "ROLLBACK_UNACKNOWLEDGED",
  "LEASE_CLOSE_UNACKNOWLEDGED", "BUSY_LEASE_UNACKNOWLEDGED", "POOL_DRAIN_UNACKNOWLEDGED",
  "CLI_INVALID_SUMMARY", "CLI_EXIT_UNACKNOWLEDGED", "CLI_DEADLINE_UNACKNOWLEDGED",
  "CLI_CANCELLED_UNACKNOWLEDGED", "READ_ONLY_CHECK_PASSED_NOT_RELEASE"] as const;
// Private operator protocol only; no shared application DTO or command authority.
type ReadinessCode = typeof cleanupCodes[number] | typeof preflightCodes[number];
const preflightCodes = ["INVALID_CONFIG", "INDEPENDENT_PROOF_REQUIRED", "INVALID_IDENTITY_PROOF",
  "PROOF_WINDOW_INVALID", "IDENTITY_MISMATCH", "METADATA_INCOMPLETE", "METADATA_MISMATCH",
  "RUNTIME_UNAPPROVED", "DRIVER_UNAPPROVED", "DEADLINE_EXCEEDED", "PRODUCTION_OR_ENV_REJECTED",
  "STRAY_CONFIG", "MISSING_CONFIG", "INVALID_READ_PROFILE", "INVALID_CLIENT_CONFIG",
  "INVALID_METADATA_SCOPE", "ENDPOINT_PROOF_MISMATCH", "INVALID_SOURCE_DATA"] as const;
const failureCodes = new Set<string>(preflightCodes);
const knownReadinessKeys = new Set<string>(readinessKeys);
const requiredReadinessKeys = readinessKeys.filter(k => k !== "NODE_ENV" && k !== "SHF_ORACLE_READINESS_METADATA");
const unknownLimits = ["CROSS_OWNER_TRIGGERS", "ROLE_PUBLIC_PRIVILEGES", "REQUIRED_USER_PRIVILEGES",
  "NATIVE_RELEASE_AUTHORITY", "LIVE_DATABASE_COMPATIBILITY"] as const;
function readinessCode(v: unknown): v is ReadinessCode {
  return typeof v === "string" && (failureCodes.has(v) || cleanupCodes.some(c => c === v));
}
export function isReadinessSummary(v: unknown): v is ReadinessSummary {
  const keys = ["version", "status", "codes", "presence", "missing", "poolAttempts", "connectionAttempts",
    "queries", "identityPass", "metadataPass", "metadataRows", "rollbackAck", "leaseCloseAck",
    "poolDrainAck", "unknown"];
  if (!record(v) || !exact(v, Object.hasOwn(v, "oracleCode") ? [...keys, "oracleCode"] : keys) ||
    v.version !== "oracle-test-readiness-v1" || (v.status !== "PASS" && v.status !== "BLOCKED") ||
    !Array.isArray(v.codes) || v.codes.length > failureCodes.size + cleanupCodes.length ||
    !v.codes.every(readinessCode) || new Set(v.codes).size !== v.codes.length ||
    !exact(v.presence, readinessKeys) || !Object.values(v.presence).every(b => typeof b === "boolean") ||
    !Array.isArray(v.missing) || v.missing.length > requiredReadinessKeys.length ||
    new Set(v.missing).size !== v.missing.length ||
    !v.missing.every(k => typeof k === "string" && requiredReadinessKeys.some(r => r === k) &&
      record(v.presence) && v.presence[k] === false) ||
    !Array.isArray(v.unknown) || v.unknown.length !== unknownLimits.length ||
    !v.unknown.every((k, i) => k === unknownLimits[i]) ||
    ["identityPass", "metadataPass", "rollbackAck", "leaseCloseAck", "poolDrainAck"]
      .some(k => typeof v[k] !== "boolean") ||
    [["poolAttempts", 1], ["connectionAttempts", 1], ["queries", 8], ["metadataRows", 4]]
      .some(([k, max]) => typeof k !== "string" || typeof max !== "number" ||
        typeof v[k] !== "number" || !Number.isSafeInteger(v[k]) || v[k] < 0 || v[k] > max) ||
    Object.hasOwn(v, "oracleCode") && (typeof v.oracleCode !== "string" ||
      !/^(?:ORA-\d{5}|DPI-\d{4}|NJS-\d{3})$/.test(v.oracleCode))) return false;
  if (v.status === "PASS") {
    return v.codes.length === 1 && v.codes[0] === "READ_ONLY_CHECK_PASSED_NOT_RELEASE" &&
      v.missing.length === 0 && requiredReadinessKeys.every(k => record(v.presence) && v.presence[k] === true) &&
      v.poolAttempts === 1 && v.connectionAttempts === 1 && v.identityPass === true &&
      v.rollbackAck === true && v.leaseCloseAck === true && v.poolDrainAck === true &&
      (v.metadataPass === true ? v.queries === 4 && v.metadataRows === 4 :
        v.queries === 2 && v.metadataRows === 0) && !Object.hasOwn(v, "oracleCode");
  }
  return Number(v.connectionAttempts) <= Number(v.poolAttempts) &&
    (v.queries === 0 || v.connectionAttempts === 1) &&
    (v.identityPass === false || v.connectionAttempts === 1 && Number(v.queries) >= 2) &&
    (v.metadataPass === true ? v.identityPass === true && v.metadataRows === 4 && Number(v.queries) >= 4 :
      v.metadataRows === 0) &&
    (v.rollbackAck === false || v.connectionAttempts === 1) &&
    (v.leaseCloseAck === false || v.connectionAttempts === 1) &&
    (v.poolDrainAck === false || v.poolAttempts === 1) &&
    !v.codes.includes("READ_ONLY_CHECK_PASSED_NOT_RELEASE") &&
    (v.codes.length > 0 || v.poolAttempts === 1); // in-flight progress may have no failure yet
}
function initialSummary(env: NodeJS.ProcessEnv): ReadinessSummary {
  return {
    version: "oracle-test-readiness-v1", status: "BLOCKED", codes: [],
    presence: Object.fromEntries(readinessKeys.map(k => [k, typeof env[k] === "string" && env[k]!.length > 0])),
    missing: [], poolAttempts: 0, connectionAttempts: 0, queries: 0,
    identityPass: false, metadataPass: false, metadataRows: 0,
    rollbackAck: false, leaseCloseAck: false, poolDrainAck: false,
    unknown: unknownLimits,
  };
}
// Synchronous configuration/proof validation ONLY: no DNS, paths, driver or pool
// access. Both parent and worker use the same ordering and sanitized failures.
// Admission here is not endpoint/identity verification or readiness success.
function preflight(env: NodeJS.ProcessEnv): {
  result: ReadinessSummary; admitted?: { oracle: OracleEnvironment; p: ReadProof };
} {
  const result = initialSummary(env);
  try {
    if (env.NODE_ENV === "production" || env.SHF_APP_ENV !== undefined && env.SHF_APP_ENV !== "test")
      fail("PRODUCTION_OR_ENV_REJECTED");
    // Stray native authority is rejected by KEY only; never inspect those values.
    if (Object.keys(env).some(k => k.startsWith("SHF_NATIVE_") ||
      k.startsWith("SHF_TEST_ORACLE_") || k.startsWith("SHF_ORACLE_READINESS_") &&
      !knownReadinessKeys.has(k))) fail("STRAY_CONFIG");
    result.missing = requiredReadinessKeys.filter(k => !result.presence[k]);
    if (result.missing.length) fail("MISSING_CONFIG");
    if (env.NODE_ENV !== undefined && env.NODE_ENV !== "test") fail("PRODUCTION_OR_ENV_REJECTED");
    const config = validateRuntimeConfig(json(env.SHF_ORACLE_CONFIG!));
    const profile: Record<string, unknown> = { ...config };
    if (config.dataSource !== "oracle-read-only" || config.deploymentClass !== "isolated-test-demo" ||
      shiftManagementMode(config) !== "disabled" ||
      ["attendanceStageArrivalMode", "attendanceStationArrivalMode", "attendanceStationArrivalLateMode",
        "attendanceStationExitMode", "attendanceStationExitCancellationMode", "shiftManagementMode"]
        .some(k => profile[k] !== undefined && profile[k] !== "disabled"))
      fail("INVALID_READ_PROFILE");
    const oracle = oracleEnvironment(env);
    if (!win32.isAbsolute(oracle.clientLibDir) || !/^[A-Za-z]:\\/.test(oracle.clientLibDir))
      fail("INVALID_CLIENT_CONFIG");
    // Validate syntax only; never open/discover a TNS directory in preflight.
    if (!env.TNS_ADMIN || !win32.isAbsolute(env.TNS_ADMIN) || !/^[A-Za-z]:\\/.test(env.TNS_ADMIN))
      fail("INVALID_CLIENT_CONFIG");
    if (env.SHF_ORACLE_READINESS_METADATA !== undefined && env.SHF_ORACLE_READINESS_METADATA !== "M26")
      fail("INVALID_METADATA_SCOPE");
    const p = proof(env.SHF_ORACLE_READINESS_PROOF!, oracle);
    current(p);
    return { result, admitted: { oracle, p } };
  } catch (error) {
    result.codes.push(record(error) && readinessCode(error.readinessCode) && failureCodes.has(error.readinessCode)
      ? error.readinessCode : "DEPENDENCY_OR_CONFIG_UNAVAILABLE");
    const code = safeCode(error);
    if (code) result.oracleCode = code;
    return { result };
  }
}
export async function runOracleTestReadiness(env: NodeJS.ProcessEnv,
  deps: ReadinessDependencies = {}): Promise<ReadinessSummary> {
  // Preflight is inside the same total budget, not an extra admission window.
  const budget = Math.max(10, Math.min(5000, deps.budgetMs ?? 5000));
  const deadline = performance.now() + budget, reserve = Math.min(1000, budget / 3);
  const checked = preflight(env), { result } = checked;
  if (!checked.admitted) {
    deps.onProgress?.(result);
    return result;
  }
  const { oracle, p } = checked.admitted;
  const controller = new AbortController(), abort = () => controller.abort();
  deps.signal?.addEventListener("abort", abort, { once: true });
  if (deps.signal?.aborted) abort();
  let pool: OraclePool | undefined, connection: OracleConnection | undefined;
  let active: Promise<unknown> | undefined, busy = false, unsafe = false;
  function recordLateCleanup(code: "POOL_DRAIN_UNACKNOWLEDGED" | "LEASE_CLOSE_UNACKNOWLEDGED") {
    result.status = "BLOCKED";
    if (code === "POOL_DRAIN_UNACKNOWLEDGED") result.poolDrainAck = false;
    else result.leaseCloseAck = false;
    result.codes = result.codes.filter(c => c !== "READ_ONLY_CHECK_PASSED_NOT_RELEASE");
    if (!result.codes.includes(code)) result.codes.push(code);
    // Progress is a sanitized projection, including after the bounded return.
    // A closed IPC consumer must not produce an unhandled late cleanup error.
    try { deps.onProgress?.(result); } catch { /* already BLOCKED/unacknowledged */ }
  }
  function lateCleanup(code: "POOL_DRAIN_UNACKNOWLEDGED" | "LEASE_CLOSE_UNACKNOWLEDGED",
    close: () => Promise<void>) {
    // This work is already outside admission/ACK. Record it before invoking close;
    // a late resolution never turns a bounded unknown into a successful ACK.
    const unacknowledged = () => recordLateCleanup(code);
    unacknowledged();
    try { void close().then(unacknowledged, unacknowledged); }
    catch { unacknowledged(); }
  }
  async function bounded<T>(work: Promise<T>, end: number, honourAbort = true): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    try {
      return await Promise.race([work, new Promise<never>((_, reject) => {
        onAbort = () => reject({ readinessCode: "DEADLINE_EXCEEDED" });
        if (honourAbort) {
          controller.signal.addEventListener("abort", onAbort, { once: true });
          if (controller.signal.aborted) onAbort();
        }
        timer = setTimeout(onAbort, Math.max(1, end - performance.now()));
      })]);
    } finally {
      if (timer) clearTimeout(timer);
      if (onAbort) controller.signal.removeEventListener("abort", onAbort);
    }
  }
  try {
    current(p);
    controller.signal.throwIfAborted();
    const frozen = p.endpointProof;
    const resolved = await bounded(resolveNativeEndpointProof({
      ...frozen, endpoint: { kind: frozen.endpoint.kind, name: frozen.endpoint.name },
      serverHosts: frozen.serverHosts.map(h => ({ kind: h.kind, name: h.name })),
    }, deps.resolveEndpoint ?? resolveEndpoint, controller.signal), deadline - reserve);
    if (!same(resolved, frozen)) fail("ENDPOINT_PROOF_MISMATCH");
    // No DB-derived names or address learning; resolver is finite and proof-selected.
    if (frozen.endpoint.addresses.some(a => !isIP(a))) fail("INVALID_IDENTITY_PROOF");
    current(p);
    result.poolAttempts++;
    deps.onProgress?.(result);
    const pendingPool = (deps.createPool ?? realPool)(oracle);
    void pendingPool.then(late => {
      if (controller.signal.aborted) lateCleanup("POOL_DRAIN_UNACKNOWLEDGED", () => late.close());
    }, () => { if (controller.signal.aborted) recordLateCleanup("POOL_DRAIN_UNACKNOWLEDGED"); });
    pool = await bounded(pendingPool, deadline - reserve);
    current(p);
    result.connectionAttempts++;
    deps.onProgress?.(result);
    const pendingConnection = pool.getConnection();
    void pendingConnection.then(late => {
      if (controller.signal.aborted) lateCleanup("LEASE_CLOSE_UNACKNOWLEDGED", () => late.close(true));
    }, () => { if (controller.signal.aborted) recordLateCleanup("LEASE_CLOSE_UNACKNOWLEDGED"); });
    connection = await bounded(pendingConnection, deadline - reserve);
    async function query(sql: string, binds: Parameters<OracleConnection["execute"]>[1], maxRows: number) {
      current(p);
      controller.signal.throwIfAborted();
      if (!connection || result.queries >= 8 || performance.now() >= deadline - reserve) fail("DEADLINE_EXCEEDED");
      connection.callTimeout = Math.max(1, Math.ceil(deadline - reserve - performance.now()));
      result.queries++;
      deps.onProgress?.(result);
      busy = true;
      active = connection.execute(sql, binds, maxRows).finally(() => { busy = false; });
      const rows = await bounded(active, deadline - reserve);
      if (!Array.isArray(rows) || rows.length > maxRows) fail("INVALID_SOURCE_DATA");
      current(p);
      return rows;
    }
    await query("SET TRANSACTION READ ONLY", {}, 1);
    verifyIdentity(await query(identitySql, {}, 1), p);
    result.identityPass = true;
    deps.onProgress?.(result);
    if (env.SHF_ORACLE_READINESS_METADATA === "M26") {
      const columns = await query(columnsSql, { exitTime: "STATION_EXIT_TIME", exitUser: "STATION_EXIT_USER" }, 3);
      const charset = await query(charsetSql, {}, 3);
      verifyMetadata(columns, charset);
      result.metadataRows = columns.length + charset.length;
      result.metadataPass = true;
    }
    result.status = "PASS";
  } catch (error) {
    controller.abort();
    unsafe = true;
    result.codes.push(record(error) && readinessCode(error.readinessCode) && failureCodes.has(error.readinessCode)
      ? error.readinessCode : "DEPENDENCY_OR_CONFIG_UNAVAILABLE");
    const code = safeCode(error);
    if (code) result.oracleCode = code;
  } finally {
    if (connection) {
      if (busy) {
        try {
          await bounded(connection.break(), deadline, false);
          if (active) await bounded(active, deadline, false);
        } catch { unsafe = true; }
      }
      // Never release a still-busy lease. CLI terminates the isolated process if
      // native cancellation/cleanup cannot ACK within this SAME total budget.
      if (!busy && performance.now() < deadline) {
        try {
          connection.callTimeout = Math.max(1, Math.ceil(deadline - performance.now()));
          busy = true;
          active = connection.rollback().finally(() => { busy = false; });
          await bounded(active, deadline, false);
          result.rollbackAck = true;
        } catch { unsafe = true; result.codes.push("ROLLBACK_UNACKNOWLEDGED"); }
        if (!busy && performance.now() < deadline) {
          try {
            await bounded(connection.close(unsafe), deadline, false);
            result.leaseCloseAck = true;
          } catch { result.codes.push("LEASE_CLOSE_UNACKNOWLEDGED"); }
        } else result.codes.push("LEASE_CLOSE_UNACKNOWLEDGED");
      } else result.codes.push("BUSY_LEASE_UNACKNOWLEDGED");
    }
    if (pool && performance.now() < deadline) {
      try { await bounded(pool.close(), deadline, false); result.poolDrainAck = true; }
      catch { result.codes.push("POOL_DRAIN_UNACKNOWLEDGED"); }
    } else if (pool) result.codes.push("POOL_DRAIN_UNACKNOWLEDGED");
    controller.abort();
    deps.signal?.removeEventListener("abort", abort);
    if (result.poolAttempts && (!result.poolDrainAck || result.connectionAttempts &&
      (!result.rollbackAck || !result.leaseCloseAck))) result.status = "BLOCKED";
    if (result.status === "PASS") result.codes.push("READ_ONLY_CHECK_PASSED_NOT_RELEASE");
    result.codes = [...new Set(result.codes)];
    deps.onProgress?.(result);
  }
  return result;
}
export interface CliReadinessSummary extends ReadinessSummary {
  // True means no owned child remains: no child was needed, or exit was observed.
  // It never acknowledges Oracle rollback/lease/pool cleanup.
  childExitAck: boolean;
}
interface CliDependencies {
  // Module-isolated owned fork hook. Never selected by ENV/the supported CLI.
  forkChild?: (env: NodeJS.ProcessEnv) => ChildProcess;
  signal?: AbortSignal;
  budgetMs?: number; // tests may shorten the original absolute deadline only
}
export async function runReadinessCli(source: NodeJS.ProcessEnv,
  deps: CliDependencies = {}): Promise<CliReadinessSummary> {
  const deadline = performance.now() + Math.max(10, Math.min(5000, deps.budgetMs ?? 5000));
  const env: NodeJS.ProcessEnv = {};
  for (const key of readinessKeys) if (source[key] !== undefined) env[key] = source[key];
  for (const key of Object.keys(source)) {
    if (key.startsWith("SHF_NATIVE_") || key.startsWith("SHF_TEST_ORACLE_") ||
      key.startsWith("SHF_ORACLE_READINESS_") && !knownReadinessKeys.has(key))
      env[key] = ""; // Preserve key-only rejection, never copy stray values.
  }
  const checked = preflight(env);
  if (!checked.admitted) return { ...checked.result, childExitAck: true };
  let last = checked.result;
  return new Promise<CliReadinessSummary>(resolve => {
    let child: ChildProcess | undefined, complete = false, settled = false, exitAck = false;
    let terminationRequested = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function markBlocked(code: ReadinessCode) {
      last = { ...last, status: "BLOCKED", codes: [...last.codes.filter(c =>
        c !== "READ_ONLY_CHECK_PASSED_NOT_RELEASE" && c !== "MISSING_CONFIG"), code] };
      last.codes = [...new Set(last.codes)];
    }
    function finish() {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      deps.signal?.removeEventListener("abort", cancel);
      child?.removeListener("message", message);
      child?.removeListener("exit", exited);
      child?.removeListener("close", exited);
      if (performance.now() >= deadline) markBlocked("CLI_DEADLINE_UNACKNOWLEDGED");
      if (!exitAck) markBlocked("CLI_EXIT_UNACKNOWLEDGED");
      resolve({ ...last, childExitAck: exitAck });
    }
    function terminate() {
      if (terminationRequested || exitAck) return;
      terminationRequested = true;
      if (child && (child.exitCode !== null || child.signalCode !== null)) {
        exitAck = true;
        return;
      }
      try {
        if (!child?.pid || !child.kill("SIGKILL")) markBlocked("CLI_EXIT_UNACKNOWLEDGED");
      } catch { markBlocked("CLI_EXIT_UNACKNOWLEDGED"); }
      // kill's return value is NOT an exit ACK. Only exit/close settles early.
    }
    function block(code: ReadinessCode) {
      markBlocked(code);
      complete = true;
      terminate();
      if (exitAck) finish();
    }
    function cancel() { block("CLI_CANCELLED_UNACKNOWLEDGED"); }
    function message(value: unknown) {
      if (settled) return;
      if (!exact(value, ["kind", "summary"]) ||
        (value.kind !== "progress" && value.kind !== "complete") || !isReadinessSummary(value.summary) ||
        value.kind === "complete" && value.summary.codes.length === 0) {
        block("CLI_INVALID_SUMMARY");
        return;
      }
      if (complete) return;
      last = value.summary;
      if (value.kind === "complete") {
        complete = true;
        terminate();
        if (exitAck) finish();
      }
    }
    function exited() {
      exitAck = true;
      if (!complete) markBlocked("CLI_EXIT_UNACKNOWLEDGED");
      finish();
    }
    timer = setTimeout(() => {
      markBlocked("CLI_DEADLINE_UNACKNOWLEDGED");
      terminate();
      finish(); // no extra grace timer; failure truthfully retains unknown exit
    }, Math.max(1, deadline - performance.now()));
    try {
      const forkChild = deps.forkChild ?? (inputs => fork(fileURLToPath(import.meta.url), [], {
        env: inputs, execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"],
      }));
      child = forkChild(env);
      child.on("message", message);
      child.once("error", () => {
        block("DEPENDENCY_OR_CONFIG_UNAVAILABLE");
        if (!child?.pid) finish(); // spawn failed: no exit event is promised
      });
      child.once("exit", exited);
      child.once("close", exited);
      if (child.exitCode !== null || child.signalCode !== null) exited();
      else if (!child.pid) { block("DEPENDENCY_OR_CONFIG_UNAVAILABLE"); finish(); }
      if (!settled) {
        deps.signal?.addEventListener("abort", cancel, { once: true });
        if (deps.signal?.aborted) cancel();
      }
    } catch {
      markBlocked("DEPENDENCY_OR_CONFIG_UNAVAILABLE");
      finish();
    }
  });
}
if (import.meta.main) {
  if (process.send) {
    const controller = new AbortController(), cancel = () => controller.abort();
    process.once("SIGINT", cancel);
    process.once("SIGTERM", cancel);
    const result = await runOracleTestReadiness(process.env, {
      signal: controller.signal, budgetMs: 4400,
      onProgress: summary => process.send?.({ kind: "progress", summary }),
    });
    process.send({ kind: "complete", summary: result }, () => process.exit(result.status === "PASS" ? 0 : 2));
  } else {
    const controller = new AbortController(), cancel = () => controller.abort();
    process.once("SIGINT", cancel);
    process.once("SIGTERM", cancel);
    const result = await runReadinessCli(process.env, { signal: controller.signal });
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
    process.stdout.write(JSON.stringify(result) + "\n",
      () => process.exit(result.status === "PASS" ? 0 : 2));
  }
}
