import { isAbsolute, resolve, relative, dirname, basename, join } from "node:path";
import { lstatSync, realpathSync } from "node:fs";
import { decimalId, record, text } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { oracleEnvironment } from "./runtime-config.mts";

export const nativeMarker = "SHF_TEST_ARRIVAL_20261020_B";
export interface NativeIdentity {
  database: string; host: string; service: string; user: string; schema: string;
}
export interface NativeBinding {
  marker: typeof nativeMarker;
  employeeId: string; shiftDayId: string; orgUnitId: string;
  readIdentity: NativeIdentity; writeIdentity: NativeIdentity;
  metadataDigest: string;
  approval: string; freezeOwner: string; recoveryOwner: string;
  writerFreezeConfirmed: true; noExternalEffectsConfirmed: true; singleExecutorConfirmed: true;
  windowStart: string; windowEnd: string;
  allowanceFile: string;
}
export interface NativeConfiguration { writer: OracleEnvironment; binding: NativeBinding }
function localPath(path: string) {
  if (process.platform !== "win32") return path;
  // Normalize supported local DOS extended syntax before comparing boundaries.
  // UNC/network shares and volume/device namespaces cannot establish the local
  // physical repo boundary here; reject them before any filesystem/network IO.
  const normalized = path.replaceAll("/", "\\").replace(/^\\\\\?\\([A-Za-z]:\\)/, "$1");
  if (!/^[A-Za-z]:\\/.test(normalized)) throw Error("Local external operator allowance required");
  return normalized;
}
function contained(root: string, path: string) {
  const r = relative(root, path);
  return r === "" || r !== ".." && !r.startsWith("../") && !r.startsWith("..\\") && !isAbsolute(r);
}
export function verifiedNativeAllowancePath(input: string): string {
  try {
    const path = resolve(localPath(input)), parent = dirname(path), name = basename(path);
    if (!isAbsolute(input) || !name || name === "." || name === ".." ||
        /[\p{Cc}]/u.test(name) || process.platform === "win32" && /[:. ]$|:/.test(name))
      throw Error("Invalid allowance path");
    // Check every existing ancestor, not just the final parent. No mkdir,
    // symlink/junction traversal or current-working-directory root assumption.
    for (let cursor = parent; ; cursor = dirname(cursor)) {
      const stat = lstatSync(cursor);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error("Untrusted allowance ancestor");
      if (dirname(cursor) === cursor) break;
    }
    const repo = resolve(import.meta.dirname, "../.."), realRepo = localPath(realpathSync.native(repo));
    const realParent = localPath(realpathSync.native(parent));
    if (contained(repo, path) || contained(realRepo, realParent)) throw Error("Repository allowance forbidden");
    const result = join(realParent, name);
    try {
      if (lstatSync(result).isSymbolicLink()) throw Error("Allowance link forbidden");
    } catch (e) {
      if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
    }
    return result;
  } catch { throw Error("Trusted existing local external allowance directory required"); }
}
function identity(v: unknown): NativeIdentity {
  if (!exact(v, ["database", "host", "service", "user", "schema"]) ||
      ![v.database, v.host, v.service, v.user, v.schema].every(x => text(x, 128, 1)) ||
      typeof v.schema !== "string" || !/^[A-Z][A-Z0-9_#$]{0,29}$/.test(v.schema))
    throw Error("Independent native TEST identity required");
  return { database: String(v.database), host: String(v.host), service: String(v.service),
    user: String(v.user), schema: v.schema };
}
export function nativeBinding(v: unknown): NativeBinding {
  if (!exact(v, ["marker", "employeeId", "shiftDayId", "orgUnitId", "readIdentity", "writeIdentity",
    "metadataDigest", "approval", "freezeOwner", "recoveryOwner", "windowStart", "windowEnd", "allowanceFile",
    "writerFreezeConfirmed", "noExternalEffectsConfirmed", "singleExecutorConfirmed"]) ||
      v.marker !== nativeMarker || !decimalId(v.employeeId) || !decimalId(v.shiftDayId, 10) ||
      !unitCode(v.orgUnitId) || typeof v.metadataDigest !== "string" || !/^[a-f0-9]{64}$/.test(v.metadataDigest) ||
      !text(v.approval, 128, 1) || !text(v.freezeOwner, 128, 1) || !text(v.recoveryOwner, 128, 1) ||
      v.writerFreezeConfirmed !== true || v.noExternalEffectsConfirmed !== true || v.singleExecutorConfirmed !== true ||
      typeof v.windowStart !== "string" || typeof v.windowEnd !== "string" ||
      ![v.windowStart, v.windowEnd].every(t => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(t) && Number.isFinite(Date.parse(t))) ||
      Date.parse(v.windowStart) >= Date.parse(v.windowEnd) ||
      !text(v.allowanceFile, 4096, 1) || !isAbsolute(v.allowanceFile))
    throw Error("Exact private native TEST binding required");
  // The durable allowance marker is operator-controlled, outside source and
  // application directories. It is NOT a command receipt or a recovery ledger.
  const path = verifiedNativeAllowancePath(v.allowanceFile);
  const readIdentity = identity(v.readIdentity), writeIdentity = identity(v.writeIdentity);
  if (readIdentity.database !== writeIdentity.database || readIdentity.host !== writeIdentity.host ||
      readIdentity.service !== writeIdentity.service) throw Error("Native source mismatch");
  return { marker: nativeMarker, employeeId: v.employeeId, shiftDayId: v.shiftDayId,
    orgUnitId: v.orgUnitId, readIdentity, writeIdentity, metadataDigest: v.metadataDigest,
    approval: v.approval, freezeOwner: v.freezeOwner, recoveryOwner: v.recoveryOwner,
    writerFreezeConfirmed: true, noExternalEffectsConfirmed: true, singleExecutorConfirmed: true,
    windowStart: v.windowStart, windowEnd: v.windowEnd, allowanceFile: path };
}
export function nativeEnvironment(env: NodeJS.ProcessEnv, enabled: boolean): NativeConfiguration | undefined {
  const keys = Object.keys(env).filter(k => k.startsWith("SHF_NATIVE_STAGE_"));
  const flag = env.SHF_TEST_ORACLE_STAGE_WRITE_ENABLED;
  if (!enabled) {
    if (flag !== undefined && flag !== "false" || keys.length) throw Error("Native mode is disabled");
    return undefined;
  }
  if (flag !== "true" || keys.some(k => !["SHF_NATIVE_STAGE_CONNECT_STRING", "SHF_NATIVE_STAGE_USER",
    "SHF_NATIVE_STAGE_PASSWORD", "SHF_NATIVE_STAGE_CLIENT_LIB_DIR", "SHF_NATIVE_STAGE_BINDING"].includes(k)))
    throw Error("Explicit native TEST write enablement required");
  const writer = oracleEnvironment({
    SHF_ORACLE_CONNECT_STRING: env.SHF_NATIVE_STAGE_CONNECT_STRING,
    SHF_ORACLE_USER: env.SHF_NATIVE_STAGE_USER, SHF_ORACLE_PASSWORD: env.SHF_NATIVE_STAGE_PASSWORD,
    SHF_ORACLE_CLIENT_LIB_DIR: env.SHF_NATIVE_STAGE_CLIENT_LIB_DIR,
  });
  let parsed: unknown;
  try { parsed = JSON.parse(env.SHF_NATIVE_STAGE_BINDING ?? "null"); } catch { throw Error("Invalid native binding"); }
  const binding = nativeBinding(parsed);
  if (writer.user !== binding.writeIdentity.user || !record(parsed)) throw Error("Native account mismatch");
  return { writer, binding };
}
