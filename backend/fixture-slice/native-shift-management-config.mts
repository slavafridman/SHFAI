// Strict private TEST packet parser. Pure parsing precedes pool/fuse/listener IO.
import type { NativeIdentity, NativeEndpointResolver } from "./native-stage-arrival-config.mts";
import { parseNativeIdentity, nativeTargetReference, resolveNativeEndpointProof } from "./native-stage-arrival-config.mts";
import { parseMetadataCoverageWaiver } from "./native-metadata-limited.mts";
import { oracleEnvironment, validateRuntimeConfig } from "./runtime-config.mts";
import type { OracleEnvironment } from "./runtime-config.mts";
import type { NativeSourceScope } from "./oracle-shift-management-source.mts";
import type { NativeShiftAdmissionOptions } from "./native-shift-management-admission.mts";
import type { ShiftManagementMetadataOptions } from "./oracle-shift-management-metadata.mts";
import { shiftManagementSourceTables } from "./native-shift-management-scope.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { decimalId, text } from "./contract-validation.mts";
import { localDateTime } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { freezeShift } from "./shift-management-model.mts";
import { shiftManagementMode, validateShiftManagementEnvironment } from "./shift-management-config.mts";
import type { ShiftOperationKindV1 } from "./shift-management-contracts.mts";
import { isAbsolute } from "node:path";

const hash = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const utc = (v: unknown): v is string => typeof v === "string" &&
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const fail = (): never => { throw Error("Exact bounded native management packet required"); };
export interface NativeManagementConfiguration {
  writer: OracleEnvironment; readIdentity: NativeIdentity; writeIdentity: NativeIdentity;
  source: NativeSourceScope; authority: NativeShiftAdmissionOptions;
  metadata: ShiftManagementMetadataOptions;
  execution: { employeeId: string; orgUnitId: string; windowStart: string; windowEnd: string;
    businessTimeZone: string; writerExclusion: { confirmed: true; owner: string }; maximumRows: number };
}
export function parseNativeManagementEnvironment(env: NodeJS.ProcessEnv, configuration: unknown): NativeManagementConfiguration {
  const config = validateRuntimeConfig(configuration);
  if (shiftManagementMode(config) !== "test-oracle-controlled" ||
      validateShiftManagementEnvironment(config, env) !== "test-oracle-controlled" ||
      config.authenticationMode !== "synthetic" || config.deploymentClass !== "isolated-test-demo")
    return fail();
  const allowed = ["SHF_NATIVE_SHIFT_CONNECT_STRING", "SHF_NATIVE_SHIFT_USER", "SHF_NATIVE_SHIFT_PASSWORD",
    "SHF_NATIVE_SHIFT_CLIENT_LIB_DIR", "SHF_NATIVE_SHIFT_BINDING"];
  if (Object.keys(env).some(key => key.startsWith("SHF_NATIVE_SHIFT_") && !allowed.includes(key)) ||
      typeof env.SHF_NATIVE_SHIFT_BINDING !== "string" || Buffer.byteLength(env.SHF_NATIVE_SHIFT_BINDING) > 16384)
    return fail();
  const input: unknown = parseStageJson(env.SHF_NATIVE_SHIFT_BINDING);
  if (!exact(input, ["version", "scopeRevision", "employeeId", "orgUnitId", "selectedDayId", "readIdentity",
    "writeIdentity", "metadata", "operation", "window", "authorityDirectory", "writerExclusion",
    "singleExecutorConfirmed", "approvalId", "recoveryOwner", "review", "capacity"]) ||
      input.version !== "shf-management-native-v1" || !text(input.scopeRevision, 128, 1) ||
      !decimalId(input.employeeId) || !unitCode(input.orgUnitId) ||
      !config.syntheticOrgUnitIds.includes(input.orgUnitId) ||
      !(input.selectedDayId === null || decimalId(input.selectedDayId, 10)) ||
      !text(input.authorityDirectory, 4096, 1) || !isAbsolute(input.authorityDirectory) ||
      !exact(input.writerExclusion, ["confirmed", "owner"]) || input.writerExclusion.confirmed !== true ||
      !text(input.writerExclusion.owner, 128, 1) || input.singleExecutorConfirmed !== true ||
      !text(input.approvalId, 128, 1) || !text(input.recoveryOwner, 128, 1) ||
      !exact(input.window, ["start", "end"]) || !utc(input.window.start) || !utc(input.window.end) ||
      Date.now() < Date.parse(input.window.start) || Date.now() >= Date.parse(input.window.end) ||
      !exact(input.operation, ["kind", "rows", "planDigest", "planningStartLocal", "planningEndLocal", "overlayWrite"]) ||
      !["create", "change", "cancel", "csv-create"].includes(String(input.operation.kind)) ||
      typeof input.operation.rows !== "number" || !Number.isInteger(input.operation.rows) ||
      input.operation.rows < 1 || input.operation.rows > 100 || !hash(input.operation.planDigest) ||
      !localDateTime(input.operation.planningStartLocal) || !localDateTime(input.operation.planningEndLocal) ||
      input.operation.planningStartLocal >= input.operation.planningEndLocal ||
      !input.operation.planningStartLocal.endsWith(":00") || !input.operation.planningEndLocal.endsWith(":00") ||
      !exact(input.capacity, ["rows", "requestBudgetMs", "worstCaseMs", "certificate", "source"]) ||
      typeof input.capacity.rows !== "number" || !Number.isInteger(input.capacity.rows) ||
      input.capacity.rows < input.operation.rows || input.capacity.rows > 100 || input.capacity.requestBudgetMs !== 5000 ||
      typeof input.capacity.worstCaseMs !== "number" || !Number.isSafeInteger(input.capacity.worstCaseMs) ||
      input.capacity.worstCaseMs <= 0 || input.capacity.worstCaseMs >= 5000 || !hash(input.capacity.certificate) ||
      input.capacity.source !== "authorized-test-measurement") return fail();
  const kind: ShiftOperationKindV1 = input.operation.kind === "create" ? "create" : input.operation.kind === "change" ?
    "change" : input.operation.kind === "cancel" ? "cancel" : "csv-create";
  const creates = kind === "create" || kind === "csv-create";
  if ((kind !== "csv-create" && input.operation.rows !== 1) || (creates ?
    input.selectedDayId !== null || input.operation.overlayWrite !== null :
    input.selectedDayId === null || input.operation.overlayWrite !== "insert" && input.operation.overlayWrite !== "update"))
    return fail();
  const readIdentity = parseNativeIdentity(input.readIdentity), writeIdentity = parseNativeIdentity(input.writeIdentity);
  if ("host" in readIdentity || "host" in writeIdentity || readIdentity.target.kind !== "sid" ||
      writeIdentity.target.kind !== "sid" || !same(nativeTargetReference(readIdentity), nativeTargetReference(writeIdentity)))
    return fail();
  const writer = oracleEnvironment({ SHF_ORACLE_CONNECT_STRING: env.SHF_NATIVE_SHIFT_CONNECT_STRING,
    SHF_ORACLE_USER: env.SHF_NATIVE_SHIFT_USER, SHF_ORACLE_PASSWORD: env.SHF_NATIVE_SHIFT_PASSWORD,
    SHF_ORACLE_CLIENT_LIB_DIR: env.SHF_NATIVE_SHIFT_CLIENT_LIB_DIR });
  const aliases = readIdentity.target.endpointProof.connectionAliases;
  if (writer.user !== writeIdentity.user || env.SHF_ORACLE_USER !== readIdentity.user ||
      typeof env.SHF_ORACLE_CONNECT_STRING !== "string" || !aliases.includes(env.SHF_ORACLE_CONNECT_STRING.toUpperCase()) ||
      !aliases.includes(writer.connectString.toUpperCase())) return fail();
  const m = input.metadata;
  if (!exact(m, m && typeof m === "object" && "provider" in m && m.provider === "owner-test-limited-v1" ?
    ["provider", "certificate", "coverageWaiver"] : ["provider", "certificate"]) ||
      !hash(m.certificate) || m.provider !== "dba-v1" && m.provider !== "owner-hybrid-v1" && m.provider !== "owner-test-limited-v1")
    return fail();
  const provider = m.provider;
  const waiver = provider === "owner-test-limited-v1" ? parseMetadataCoverageWaiver(m.coverageWaiver) : undefined;
  if (provider === "owner-test-limited-v1" && env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED !== "true" ||
      provider !== "owner-test-limited-v1" && env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED === "true") return fail();
  let review: NativeSourceScope["review"] = null;
  if (input.review !== null) {
    if (!exact(input.review, ["state", "effectFingerprint", "certificate"]) ||
        !["not-required", "required", "unknown"].includes(String(input.review.state)) ||
        !hash(input.review.effectFingerprint) || !hash(input.review.certificate)) return fail();
    review = { state: input.review.state === "not-required" ? "not-required" :
      input.review.state === "required" ? "required" : "unknown",
    effectFingerprint: input.review.effectFingerprint, certificate: input.review.certificate };
  }
  const identityRevision = fingerprint({ read: { ...nativeTargetReference(readIdentity), user: readIdentity.user,
    schema: readIdentity.schema }, write: { ...nativeTargetReference(writeIdentity), user: writeIdentity.user, schema: writeIdentity.schema } });
  const reference: NativeSourceScope["reference"] = { namespace: "shift-management-v0.1",
    mode: "test-oracle-controlled", dataSource: "oracle-test", identityRevision,
    operatorScopeRevision: input.scopeRevision, metadata: provider === "owner-test-limited-v1" ?
      { provider, certificate: m.certificate, waiverId: "shf-test-dba-two-view-waiver-20261028-v0.1",
        unavailable: ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"] } : { provider, certificate: m.certificate } };
  const scopeFingerprint = fingerprint({ ...input, operation: { ...input.operation, planDigest: null } });
  const source: NativeSourceScope = { reference, employeeId: input.employeeId, orgUnitId: input.orgUnitId,
    selectedDayId: input.selectedDayId, kind, overlayWrite: creates ? null :
      input.operation.overlayWrite === "insert" ? "insert" : "update",
    planningStartLocal: input.operation.planningStartLocal, planningEndLocal: input.operation.planningEndLocal,
    windowEnd: input.window.end, scopeFingerprint, review };
  const authority: NativeShiftAdmissionOptions = { reference, employeeId: input.employeeId, orgUnitId: input.orgUnitId,
    authorizedTeamIds: [...config.syntheticOrgUnitIds], expectedKind: kind, expectedPlanDigest: input.operation.planDigest,
    expectedRows: input.operation.rows, windowStart: input.window.start, windowEnd: input.window.end,
    businessTimeZone: config.businessTimeZone, authorityDirectory: input.authorityDirectory };
  const composed: NativeManagementConfiguration = { writer, readIdentity, writeIdentity, source, authority,
    metadata: { provider, identity: writeIdentity, tables: [...shiftManagementSourceTables], kind,
      ...(waiver ? { coverageWaiver: waiver } : {}) },
    execution: { employeeId: input.employeeId, orgUnitId: input.orgUnitId, windowStart: input.window.start,
      windowEnd: input.window.end, businessTimeZone: config.businessTimeZone,
      writerExclusion: { confirmed: true, owner: input.writerExclusion.owner }, maximumRows: input.operation.rows } };
  return freezeShift(composed);
}
export async function verifyNativeManagementEndpoints(config: NativeManagementConfiguration,
  resolver: NativeEndpointResolver, signal?: AbortSignal) {
  const target = nativeTargetReference(config.readIdentity).target;
  if (target.kind !== "sid") return fail();
  const expected = target.endpointProof;
  const actual = await resolveNativeEndpointProof({ kind: expected.kind, revision: expected.revision,
    connectionAliases: expected.connectionAliases, endpoint: { kind: expected.endpoint.kind, name: expected.endpoint.name },
    serverHosts: expected.serverHosts.map(host => ({ kind: host.kind, name: host.name })) }, resolver, signal);
  if (!same(actual, target.endpointProof)) return fail();
}
