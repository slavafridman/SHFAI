import { isAbsolute, resolve, relative, dirname, basename, join } from "node:path";
import { lstatSync, realpathSync } from "node:fs";
import { decimalId, record, text } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { isIP } from "node:net";
import { fingerprint, same } from "./stage-arrival-domain.mts";

export const nativeMarker = "SHF_TEST_ARRIVAL_20261020_B";
export interface NativeLegacyIdentity {
  database: string; host: string; service: string; user: string; schema: string;
}
export interface NativeEndpointMapping {
  readonly kind: "dns" | "address"; readonly name: string; readonly addresses: readonly string[];
}
export interface NativeEndpointProof {
  readonly kind: "configured-address-sets"; readonly revision: string;
  readonly connectionAliases: readonly string[];
  readonly endpoint: NativeEndpointMapping; readonly serverHosts: readonly NativeEndpointMapping[];
}
export type NativeTarget =
  | { readonly kind: "sid"; readonly instanceSid: string; readonly endpointProof: NativeEndpointProof }
  | { readonly kind: "service-reference"; readonly serviceName: string; readonly host: string };
export type NativeIdentity = NativeLegacyIdentity |
  { database: string; user: string; schema: string; readonly target: NativeTarget };
export type NativeMetadataProvider = "dba-v1" | "owner-hybrid-v1";
export function parseMetadataProvider(value: unknown): NativeMetadataProvider {
  if (value !== "dba-v1" && value !== "owner-hybrid-v1") throw Error("Explicit supported native metadata provider required");
  return value;
}
export function selectedMetadataProvider(binding: { metadataProvider?: unknown }): NativeMetadataProvider {
  return Object.hasOwn(binding, "metadataProvider") ? parseMetadataProvider(binding.metadataProvider) : "dba-v1";
}
export interface NativeBinding {
  marker: typeof nativeMarker;
  employeeId: string; shiftDayId: string; orgUnitId: string;
  readIdentity: NativeIdentity; writeIdentity: NativeIdentity;
  metadataDigest: string;
  metadataProvider?: NativeMetadataProvider;
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
const identityError = (): never => { throw Error("Independent native TEST identity/proof required"); };
function referenceText(v: unknown, max = 128): v is string {
  return text(v, max, 1) && !/[\s\p{Cc}\p{Cf}*?%]/u.test(v);
}
function address(value: unknown): string {
  if (!referenceText(value, 45) || value.includes("%")) return identityError();
  if (isIP(value) === 4) return value;
  if (isIP(value) === 6) {
    try { return new URL(`http://[${value}]/`).hostname.slice(1, -1); } catch { return identityError(); }
  }
  return identityError();
}
function addresses(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) return identityError();
  return Object.freeze([...new Set(Array.from(value, address))].sort());
}
function mappingName(v: unknown, role: "endpoint" | "server-host" = "server-host"): { kind: "dns" | "address"; name: string } {
  if (!exact(v, ["kind", "name"]) || !referenceText(v.name, 253)) return identityError();
  if (v.kind === "address") return { kind: "address", name: address(v.name) };
  const grammar = role === "endpoint"
    ? /^(?:[A-Za-z0-9](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9])?)(?:\.[A-Za-z0-9](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9])?)*\.?$/
    : /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.?$/;
  if (v.kind !== "dns" || isIP(v.name) !== 0 || !grammar.test(v.name))
    return identityError();
  // DNS spellings are explicit members, not inferred case/suffix/reverse aliases.
  return { kind: "dns", name: v.name };
}
function mapping(v: unknown, role: "endpoint" | "server-host"): NativeEndpointMapping {
  if (!exact(v, ["kind", "name", "addresses"])) return identityError();
  const name = mappingName({ kind: v.kind, name: v.name }, role), set = addresses(v.addresses);
  if (name.kind === "address" && !same(set, [address(name.name)])) return identityError();
  return Object.freeze({ ...name, addresses: set });
}
function proofHeader(v: unknown) {
  if (!exact(v, ["kind", "revision", "connectionAliases", "endpoint", "serverHosts"]) ||
      v.kind !== "configured-address-sets" || !referenceText(v.revision) ||
      !Array.isArray(v.connectionAliases) || v.connectionAliases.length < 1 || v.connectionAliases.length > 2 ||
      !Array.isArray(v.serverHosts) || v.serverHosts.length < 1 || v.serverHosts.length > 16) return identityError();
  const aliases = Array.from(v.connectionAliases, (alias: unknown) => {
    if (!referenceText(alias) || !["CTIDBT_WFMT", "CTIDBT_WFMT.WORLD"].includes(alias.toUpperCase())) return identityError();
    return alias.toUpperCase();
  });
  if (new Set(aliases).size !== aliases.length) return identityError();
  return { revision: v.revision, connectionAliases: Object.freeze(aliases.sort()),
    endpoint: v.endpoint, serverHosts: v.serverHosts };
}
export function nativeEndpointProof(v: unknown): NativeEndpointProof {
  const header = proofHeader(v), endpoint = mapping(header.endpoint, "endpoint");
  const hosts = Array.from(header.serverHosts, host => mapping(host, "server-host"));
  if (new Set(hosts.map(h => h.name)).size !== hosts.length ||
      hosts.some(h => !same(h.addresses, endpoint.addresses))) return identityError();
  return Object.freeze({ kind: "configured-address-sets", revision: header.revision,
    connectionAliases: header.connectionAliases, endpoint,
    serverHosts: Object.freeze(hosts.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) });
}
export function nativeEndpointHostMatches(proof: NativeEndpointProof, observed: unknown): boolean {
  if (!referenceText(observed, 253)) return false;
  // Literal normalization is not DNS alias learning. DNS spellings still need
  // exact declared membership; only typed literal members use canonical IPs.
  return proof.serverHosts.some(host => {
    if (host.kind === "dns") return host.name === observed;
    try { return host.name === address(observed); } catch { return false; }
  });
}
// Optional private configuration-step factory. No default/live resolver, no DB
// reply argument, no resolver use in nativeIdentity. Runtime accepts the frozen
// independently prepared proof via the existing ENV packet.
export type NativeEndpointResolver = (configuredName: string, signal: AbortSignal) => Promise<readonly string[]>;
export async function resolveNativeEndpointProof(input: unknown, resolver: NativeEndpointResolver,
  signal?: AbortSignal): Promise<NativeEndpointProof> {
  const header = proofHeader(input), endpoint = mappingName(header.endpoint, "endpoint");
  const hosts = Array.from(header.serverHosts, host => mappingName(host, "server-host"));
  if (new Set(hosts.map(h => h.name)).size !== hosts.length) return identityError();
  const controller = new AbortController(), abort = () => controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const cancelled = new Promise<never>((_, reject) => {
      const fail = () => reject(Error("Native endpoint proof unavailable"));
      controller.signal.addEventListener("abort", fail, { once: true });
      if (controller.signal.aborted) fail();
      timer = setTimeout(abort, 1000);
    });
    const work = async () => {
      const cache = new Map<string, readonly string[]>();
      const resolve = async (name: { kind: "dns" | "address"; name: string }) => {
        controller.signal.throwIfAborted();
        let set = cache.get(name.kind + ":" + name.name);
        if (!set) {
          set = name.kind === "address" ? [address(name.name)] : addresses(await resolver(name.name, controller.signal));
          controller.signal.throwIfAborted();
          cache.set(name.kind + ":" + name.name, set);
        }
        return { ...name, addresses: set };
      };
      const resolvedEndpoint = await resolve(endpoint), resolvedHosts = [];
      for (const host of hosts) resolvedHosts.push(await resolve(host));
      return nativeEndpointProof({ kind: "configured-address-sets", revision: header.revision,
        connectionAliases: header.connectionAliases, endpoint: resolvedEndpoint, serverHosts: resolvedHosts });
    };
    return await Promise.race([work(), cancelled]);
  } catch { throw Error("Native endpoint proof unavailable"); }
  finally { if (timer) clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
export function parseNativeIdentity(v: unknown): NativeIdentity {
  if (!record(v)) return identityError();
  const legacy = Object.hasOwn(v, "host") || Object.hasOwn(v, "service");
  if (!exact(v, legacy ? ["database", "host", "service", "user", "schema"] : ["database", "user", "schema", "target"]))
    return identityError();
  if (![v.database, v.user, v.schema].every(x => referenceText(x)) ||
      typeof v.schema !== "string" || !/^[A-Z][A-Z0-9_#$]{0,29}$/.test(v.schema)) return identityError();
  const account = { database: String(v.database), user: String(v.user), schema: v.schema };
  if (legacy) {
    if (!referenceText(v.host) || !referenceText(v.service)) return identityError();
    return Object.freeze({ ...account, host: v.host, service: v.service });
  }
  const t = v.target;
  if (exact(t, ["kind", "instanceSid", "endpointProof"]) && t.kind === "sid" && referenceText(t.instanceSid))
    return Object.freeze({ ...account, target: Object.freeze({ kind: "sid", instanceSid: t.instanceSid,
      endpointProof: nativeEndpointProof(t.endpointProof) }) });
  if (exact(t, ["kind", "serviceName", "host"]) && t.kind === "service-reference" &&
      referenceText(t.serviceName) && referenceText(t.host))
    return Object.freeze({ ...account, target: Object.freeze({ kind: "service-reference",
      serviceName: t.serviceName, host: t.host }) });
  return identityError();
}
export function nativeTargetReference(identity: NativeIdentity) {
  return { database: identity.database, target: "host" in identity
    ? { kind: "service-reference" as const, serviceName: identity.service, host: identity.host } : identity.target };
}
export function nativeIdentityBindingReference(binding: NativeBinding) {
  return fingerprint({
    read: { ...nativeTargetReference(binding.readIdentity), user: binding.readIdentity.user, schema: binding.readIdentity.schema },
    write: { ...nativeTargetReference(binding.writeIdentity), user: binding.writeIdentity.user, schema: binding.writeIdentity.schema },
    metadata: { provider: selectedMetadataProvider(binding), operation: "native-stage-arrival-v0.1",
      digest: binding.metadataDigest },
  });
}
export function nativeBinding(v: unknown): NativeBinding {
  const hasProvider = record(v) && Object.hasOwn(v, "metadataProvider");
  const metadataProvider = hasProvider ? parseMetadataProvider(v.metadataProvider) : undefined;
  if (!exact(v, ["marker", "employeeId", "shiftDayId", "orgUnitId", "readIdentity", "writeIdentity",
    "metadataDigest", "approval", "freezeOwner", "recoveryOwner", "windowStart", "windowEnd", "allowanceFile",
    "writerFreezeConfirmed", "noExternalEffectsConfirmed", "singleExecutorConfirmed",
    ...(hasProvider ? ["metadataProvider"] : [])]) ||
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
  const readIdentity = parseNativeIdentity(v.readIdentity), writeIdentity = parseNativeIdentity(v.writeIdentity);
  if (!same(nativeTargetReference(readIdentity), nativeTargetReference(writeIdentity))) throw Error("Native source mismatch");
  if (metadataProvider === "owner-hybrid-v1" && (writeIdentity.user !== "SHIFTER" || writeIdentity.schema !== "SHIFTER"))
    throw Error("Owner-hybrid requires independently expected SHIFTER writer and schema");
  return Object.freeze({ marker: nativeMarker, employeeId: v.employeeId, shiftDayId: v.shiftDayId,
    orgUnitId: v.orgUnitId, readIdentity, writeIdentity, metadataDigest: v.metadataDigest,
    ...(metadataProvider === undefined ? {} : { metadataProvider }),
    approval: v.approval, freezeOwner: v.freezeOwner, recoveryOwner: v.recoveryOwner,
    writerFreezeConfirmed: true, noExternalEffectsConfirmed: true, singleExecutorConfirmed: true,
    windowStart: v.windowStart, windowEnd: v.windowEnd, allowanceFile: path });
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
  const reference = nativeTargetReference(binding.readIdentity);
  if (reference.target.kind === "sid") {
    const aliases = reference.target.endpointProof.connectionAliases, readAlias = env.SHF_ORACLE_CONNECT_STRING;
    if (typeof readAlias !== "string" || !aliases.includes(readAlias.toUpperCase()) ||
        !aliases.includes(writer.connectString.toUpperCase()) || env.SHF_ORACLE_USER !== binding.readIdentity.user)
      throw Error("Native independently configured connection/account mismatch");
  }
  return { writer, binding };
}
