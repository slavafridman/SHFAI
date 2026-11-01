import { basename } from "node:path";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { decimalId, record } from "./contract-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { nativeMarker, parseNativeIdentity, nativeTargetReference, parseExpectedDaySource,
  verifiedNativeAllowancePath } from "./native-stage-arrival-config.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { freezeShift } from "./shift-management-model.mts";
import { oracleEnvironment } from "./runtime-config.mts";
import { validateCancellationEnvironment, validateCancellationConfig } from "./station-exit-cancellation-config.mts";
import { cancellationMetadataProof, cancellationMetadataDigest, cancellationOperation, cancellationTableScope,
  cancellationWaiverId, cancellationSchema } from "./native-station-exit-cancellation-metadata.mts";
import type { CancellationBindingV1 } from "./station-exit-cancellation-private-contracts.mts";

export const cancellationFingerprint = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const label = (v: unknown): v is string => typeof v === "string" && v.length >= 1 && v.length <= 128 &&
  v.isWellFormed() && v.trim().length > 0 && !/[\p{Cc}\p{Cf}]/u.test(v);
const instant = (v: unknown): v is string => typeof v === "string" &&
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(v) &&
  v.slice(0, 4) !== "0000" && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
export function parseCancellationPrivateJson(raw: string): unknown {
  if (typeof raw !== "string" || Buffer.byteLength(raw) > 1048576) throw Error("Private cancellation packet bound");
  const v = parseStageJson(raw);
  const depth = (x: unknown, d: number): void => {
    if (d > 12) throw Error("Private cancellation packet depth");
    if (x && typeof x === "object") for (const child of Object.values(x)) depth(child, d + 1);
  };
  depth(v, 0); return v;
}
export function cancellationBindingScopeDigest(b: CancellationBindingV1) {
  return fingerprint({ operation: b.operation, marker: b.marker, employeeId: b.employeeId, shiftDayId: b.shiftDayId,
    orgUnitId: b.orgUnitId, expectedDaySource: b.expectedDaySource, readIdentity: b.readIdentity,
    writeIdentity: b.writeIdentity, metadataProvider: b.metadataProvider,
    cancellationMetadataDigest: b.cancellationMetadataDigest, approval: b.approval, freezeOwner: b.freezeOwner,
    recoveryOwner: b.recoveryOwner, writerFreezeConfirmed: b.writerFreezeConfirmed,
    singleExecutorConfirmed: b.singleExecutorConfirmed, windowStart: b.windowStart, windowEnd: b.windowEnd,
    allowanceFile: b.allowanceFile, metadataPermission: b.metadataProvider === "owner-test-limited-v1" ?
      b.metadataCoverageWaiver : b.noExternalEffectsConfirmed, coordinatorNamespace: "shf-native-command-coordinator-v1" });
}
export const cancellationIdentityReference = (b: CancellationBindingV1) => fingerprint(b);
export function cancellationBinding(value: unknown): CancellationBindingV1 {
  const limited = record(value) && value.metadataProvider === "owner-test-limited-v1";
  if (!exact(value, ["operation", "marker", "employeeId", "shiftDayId", "orgUnitId", "expectedDaySource",
    "readIdentity", "writeIdentity", "metadataProvider", "cancellationMetadataDigest", "cancellationCertificate",
    "partnerReview", "approval", "freezeOwner", "recoveryOwner", "writerFreezeConfirmed", "singleExecutorConfirmed",
    "windowStart", "windowEnd", "allowanceFile", ...(limited ? ["metadataCoverageWaiver"] : ["noExternalEffectsConfirmed"])]) ||
      value.operation !== cancellationOperation || value.marker !== nativeMarker ||
      !decimalId(value.employeeId) || !decimalId(value.shiftDayId, 10) || !unitCode(value.orgUnitId) ||
      !cancellationFingerprint(value.cancellationMetadataDigest) ||
      ![value.approval, value.freezeOwner, value.recoveryOwner].every(label) ||
      value.writerFreezeConfirmed !== true || value.singleExecutorConfirmed !== true ||
      !instant(value.windowStart) || !instant(value.windowEnd) || value.windowStart >= value.windowEnd ||
      typeof value.allowanceFile !== "string" || !basename(value.allowanceFile).startsWith("station-exit-cancellation-"))
    throw Error("Exact private cancellation binding required");
  if (limited) {
    if (!exact(value.metadataCoverageWaiver, ["id", "accepted", "externalEffectsAssessment", "operation"]) ||
        value.metadataCoverageWaiver.id !== cancellationWaiverId || value.metadataCoverageWaiver.accepted !== true ||
        value.metadataCoverageWaiver.externalEffectsAssessment !== "unknown-user-waived" ||
        value.metadataCoverageWaiver.operation !== cancellationOperation) throw Error("New cancellation waiver required");
  } else if (!["dba-v1", "owner-hybrid-v1"].includes(String(value.metadataProvider)) ||
      value.noExternalEffectsConfirmed !== true) throw Error("Explicit cancellation metadata permission required");
  const readIdentity = parseNativeIdentity(value.readIdentity), writeIdentity = parseNativeIdentity(value.writeIdentity);
  if (!same(nativeTargetReference(readIdentity), nativeTargetReference(writeIdentity)) ||
      readIdentity.schema !== writeIdentity.schema ||
      value.metadataProvider !== "dba-v1" && (writeIdentity.user !== "SHIFTER" || writeIdentity.schema !== "SHIFTER"))
    throw Error("Cancellation identity mismatch");
  parseExpectedDaySource(value.expectedDaySource);
  const c = value.cancellationCertificate;
  if (!exact(c, ["version", "operation", "tableScope", "metadataProof", "updateColumns", "replacement",
    "completeOriginalsDigest", "bindingScopeDigest"]) || c.version !== "shf-native-exit-cancellation-certificate-v1" ||
      c.operation !== cancellationOperation || !same(c.tableScope, cancellationTableScope) ||
      !same(c.updateColumns, ["STATION_EXIT_TIME", "STATION_EXIT_USER"]) ||
      !same(c.replacement, { STATION_EXIT_TIME: null, STATION_EXIT_USER: null }) ||
      !cancellationFingerprint(c.completeOriginalsDigest) || !cancellationFingerprint(c.bindingScopeDigest))
    throw Error("Current NULL-clear certificate required");
  const metadataProof = cancellationMetadataProof(c.metadataProof);
  if (metadataProof.provider !== value.metadataProvider ||
      cancellationMetadataDigest(metadataProof) !== value.cancellationMetadataDigest)
    throw Error("Cancellation certificate metadata mismatch");
  cancellationSchema(metadataProof, writeIdentity.user);
  const r = value.partnerReview;
  if (!exact(r, ["version", "purpose", "assessment", "reviewReference", "reviewedBy", "reviewedAt", "expiresAt",
    "bindingScopeDigest", "completeOriginalsDigest"]) || r.version !== "shf-exit-cancellation-partner-review-v1" ||
      r.purpose !== "clear-recorded-ordinary-station-exit" ||
      !["not-required", "required", "unknown"].includes(String(r.assessment)) ||
      !label(r.reviewReference) || !label(r.reviewedBy) || !instant(r.reviewedAt) || !instant(r.expiresAt) ||
      r.reviewedAt >= r.expiresAt || r.expiresAt > value.windowEnd ||
      r.bindingScopeDigest !== c.bindingScopeDigest || r.completeOriginalsDigest !== c.completeOriginalsDigest)
    throw Error("Exact purpose-bound cancellation partner review required");
  const allowanceFile = verifiedNativeAllowancePath(value.allowanceFile);
  if (allowanceFile !== value.allowanceFile) throw Error("Canonical cancellation allowance required");
  const b = structuredClone({ ...value, readIdentity, writeIdentity, allowanceFile }) as CancellationBindingV1;
  if (cancellationBindingScopeDigest(b) !== c.bindingScopeDigest) throw Error("Cancellation scope digest mismatch");
  return freezeShift(b);
}
export function cancellationNativeEnvironment(env: NodeJS.ProcessEnv, config: unknown) {
  validateCancellationEnvironment(config, env);
  const c = validateCancellationConfig(config);
  if (c.attendanceStationExitCancellationMode !== "test-oracle-controlled") throw Error("Native cancellation mode required");
  const binding = cancellationBinding(parseCancellationPrivateJson(env.SHF_NATIVE_EXIT_CANCELLATION_BINDING ?? ""));
  if ((env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED === "true") !== (binding.metadataProvider === "owner-test-limited-v1"))
    throw Error("Cancellation metadata provider opt-in mismatch");
  const writer = oracleEnvironment({ SHF_ORACLE_CONNECT_STRING: env.SHF_NATIVE_EXIT_CANCELLATION_CONNECT_STRING,
    SHF_ORACLE_USER: env.SHF_NATIVE_EXIT_CANCELLATION_USER, SHF_ORACLE_PASSWORD: env.SHF_NATIVE_EXIT_CANCELLATION_PASSWORD,
    SHF_ORACLE_CLIENT_LIB_DIR: env.SHF_NATIVE_EXIT_CANCELLATION_CLIENT_LIB_DIR });
  const read = oracleEnvironment(env);
  if (writer.user !== binding.writeIdentity.user || read.user !== binding.readIdentity.user ||
      Date.now() >= Date.parse(binding.windowEnd)) throw Error("Cancellation account/window mismatch");
  const target = nativeTargetReference(binding.readIdentity).target;
  if (target.kind === "sid" && ![read.connectString, writer.connectString].every(s =>
      target.endpointProof.connectionAliases.includes(s.toUpperCase()))) throw Error("Cancellation alias mismatch");
  return { writer, binding };
}
