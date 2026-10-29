// Single-attempt TEST filesystem authority, not durable receipts/idempotency.
// The operator provisions the directory/namespace file; application never
// creates directories, deletes markers, reseeds or silently changes paths.
import { closeSync, constants, fstatSync, fsyncSync, ftruncateSync, lstatSync, openSync, readSync, writeSync } from "node:fs";
import type { Stats } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type { ShiftAdmissionPlanV1, ShiftAdmissionOutcomeV1, ShiftAdmissionReferenceV1,
  ShiftConsumedAdmissionV1, ShiftOperationKindV1 } from "./shift-management-contracts.mts";
import { ShiftAdmissionKernel } from "./shift-management-admission.mts";
import type { ShiftAdmissionBoundary } from "./shift-management-admission.mts";
import { verifiedNativeAllowancePath } from "./native-stage-arrival-config.mts";
import { decimalId, text } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { freezeShift } from "./shift-management-model.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { shiftFail, shiftUnknown } from "./shift-management-errors.mts";
import { shiftManagementAccessPolicy } from "./access-policy.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { parseShiftJson } from "./shift-management-validation.mts";

type NativeReference = Extract<ShiftAdmissionReferenceV1, { mode: "test-oracle-controlled" }>;
export interface NativeShiftAdmissionOptions {
  reference: NativeReference; employeeId: string; orgUnitId: string;
  authorizedTeamIds: readonly string[];
  expectedKind: ShiftOperationKindV1; expectedPlanDigest: string; expectedRows: number;
  windowStart: string; windowEnd: string; businessTimeZone: string; authorityDirectory: string;
}
export const nativeShiftEmployeeScope = (employeeId: string) => {
  if (!decimalId(employeeId)) shiftFail("LIVE_WRITES_DISABLED");
  return fingerprint({ namespace: "shift-management-v0.1", employeeId });
};
function utc(value: string) {
  return typeof value === "string" &&
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function validateOptions(value: NativeShiftAdmissionOptions) {
  if (!exact(value, ["reference", "employeeId", "orgUnitId", "authorizedTeamIds", "expectedKind",
    "expectedPlanDigest", "expectedRows", "windowStart", "windowEnd", "businessTimeZone", "authorityDirectory"]) ||
      !exact(value.reference, ["namespace", "identityRevision", "operatorScopeRevision", "mode", "dataSource", "metadata"]) ||
      value.reference.mode !== "test-oracle-controlled" || value.reference.dataSource !== "oracle-test" ||
      value.reference.namespace !== "shift-management-v0.1" || !value.reference.metadata ||
      !/^[0-9a-f]{64}$/.test(value.reference.metadata.certificate) ||
      !text(value.reference.identityRevision, 128, 1) || !text(value.reference.operatorScopeRevision, 128, 1) ||
      !decimalId(value.employeeId) || !unitCode(value.orgUnitId) ||
      !Array.isArray(value.authorizedTeamIds) || value.authorizedTeamIds.length < 1 ||
      value.authorizedTeamIds.length > 100 || value.authorizedTeamIds.some(id => !unitCode(id)) ||
      new Set(value.authorizedTeamIds).size !== value.authorizedTeamIds.length ||
      !value.authorizedTeamIds.includes(value.orgUnitId) ||
      !["create", "change", "cancel", "csv-create"].includes(value.expectedKind) ||
      !/^[0-9a-f]{64}$/.test(value.expectedPlanDigest) || !Number.isInteger(value.expectedRows) ||
      value.expectedRows < 1 || value.expectedRows > 100 || value.expectedKind !== "csv-create" && value.expectedRows !== 1 ||
      !utc(value.windowStart) || !utc(value.windowEnd) || value.windowStart >= value.windowEnd ||
      Date.now() < Date.parse(value.windowStart) || Date.now() >= Date.parse(value.windowEnd) ||
      !text(value.businessTimeZone, 128, 1) ||
      !/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(value.businessTimeZone) ||
      !text(value.authorityDirectory, 4096, 1) || !isAbsolute(value.authorityDirectory))
    throw Error("Exact native management authority options required");
  const metadata = value.reference.metadata;
  if (metadata.provider === "owner-test-limited-v1") {
    if (!exact(metadata, ["provider", "certificate", "waiverId", "unavailable"]) ||
        metadata.waiverId !== "shf-test-dba-two-view-waiver-20261028-v0.1" ||
        !same(metadata.unavailable, ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"]))
      throw Error("Exact limited management metadata reference required");
  } else if (!exact(metadata, ["provider", "certificate"]) ||
      metadata.provider !== "dba-v1" && metadata.provider !== "owner-hybrid-v1")
    throw Error("Exact management metadata reference required");
  new Intl.DateTimeFormat("en", { timeZone: value.businessTimeZone });
}
const identicalFile = (a: Stats, b: Stats) =>
  a.isFile() && b.isFile() && !a.isSymbolicLink() && !b.isSymbolicLink() &&
  a.nlink === 1 && b.nlink === 1 && a.dev === b.dev && a.ino === b.ino && a.birthtimeMs === b.birthtimeMs;
function readNamespace(path: string): { raw: string; file: Stats } {
  let fd: number | undefined;
  try {
    const before = lstatSync(path);
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.size > 16384)
      shiftFail("LIVE_WRITES_DISABLED");
    fd = openSync(path, "r");
    const opened = fstatSync(fd), buffer = Buffer.alloc(16385);
    if (!identicalFile(before, opened)) shiftFail("LIVE_WRITES_DISABLED");
    let length = 0;
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null);
      if (count === 0) break;
      length += count;
    }
    const after = fstatSync(fd), current = lstatSync(path);
    if (length > 16384 || after.size !== length || !identicalFile(opened, after) ||
        !identicalFile(after, current) || opened.mtimeMs !== after.mtimeMs ||
        opened.size !== after.size) shiftFail("LIVE_WRITES_DISABLED");
    return { raw: new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, length)),
      file: after };
  } catch { return shiftFail("LIVE_WRITES_DISABLED"); }
  finally { if (fd !== undefined) closeSync(fd); }
}
class NativeShiftFileBoundary implements ShiftAdmissionBoundary {
  readonly mode = "test-oracle-controlled";
  private readonly options: Readonly<NativeShiftAdmissionOptions>;
  private readonly markerPath: string;
  private readonly namespacePath: string;
  private namespaceFile: Stats;
  private namespaceDigest: string;
  private readonly namespaceContent: {
    version: string; namespace: string; canonicalDirectory: string; employeeScope: string; identityRevision: string;
  };
  private blocked = false;
  private owned: { handle: ShiftConsumedAdmissionV1; file: Stats } | undefined;
  constructor(options: NativeShiftAdmissionOptions) {
    this.options = freezeShift(structuredClone(options));
    const namespacePath = verifiedNativeAllowancePath(join(options.authorityDirectory, "namespace.json"));
    if (dirname(namespacePath) !== options.authorityDirectory) shiftFail("LIVE_WRITES_DISABLED");
    const observed = readNamespace(namespacePath);
    this.namespacePath = namespacePath; this.namespaceFile = observed.file; this.namespaceDigest = fingerprint(observed.raw);
    try {
      const manifest: unknown = parseShiftJson(observed.raw);
      if (!exact(manifest, ["version", "namespace", "canonicalDirectory", "employeeScope", "identityRevision", "state"]) ||
          manifest.version !== "shf-management-native-authority-v1" || manifest.namespace !== "shift-management-v0.1" ||
          manifest.canonicalDirectory !== options.authorityDirectory ||
          manifest.employeeScope !== nativeShiftEmployeeScope(options.employeeId) ||
          manifest.identityRevision !== options.reference.identityRevision ||
          manifest.state !== "ready" && manifest.state !== "consumed") shiftFail("LIVE_WRITES_DISABLED");
      this.blocked = manifest.state === "consumed";
    } catch { shiftFail("LIVE_WRITES_DISABLED"); }
    this.namespaceContent = { version: "shf-management-native-authority-v1", namespace: "shift-management-v0.1",
      canonicalDirectory: options.authorityDirectory, employeeScope: nativeShiftEmployeeScope(options.employeeId),
      identityRevision: options.reference.identityRevision };
    // Neither commandId, operation kind, metadata/operator revision nor a
    // process nonce affects this stable employee marker filename.
    this.markerPath = verifiedNativeAllowancePath(join(options.authorityDirectory,
      `employee-${nativeShiftEmployeeScope(options.employeeId)}.consumed`));
    try { lstatSync(this.markerPath); this.blocked = true; }
    catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) shiftFail("LIVE_WRITES_DISABLED");
    }
    this.assertAvailable(options.employeeId);
  }
  private window() {
    const now = Date.now();
    if (now < Date.parse(this.options.windowStart) || now >= Date.parse(this.options.windowEnd))
      shiftFail("COMMAND_SCOPE_DEFERRED");
  }
  validatePlan(plan: ShiftAdmissionPlanV1): void {
    this.window();
    shiftManagementAccessPolicy("test-oracle-controlled").requirePrepare(plan.principal);
    if (plan.employeeId !== this.options.employeeId || !same(plan.reference, this.options.reference) ||
        !same(plan.authorizedTeamIds, this.options.authorizedTeamIds) ||
        plan.kind !== this.options.expectedKind || plan.planDigest !== this.options.expectedPlanDigest ||
        plan.effects.length !== this.options.expectedRows || Date.parse(plan.expiresAt) > Date.parse(this.options.windowEnd))
      shiftFail("COMMAND_SCOPE_DEFERRED");
  }
  assertAvailable(employeeId: string): void {
    this.window();
    if (employeeId !== this.options.employeeId) shiftFail("SHIFT_DAY_NOT_FOUND");
    if (this.blocked) shiftFail("COMMAND_SCOPE_DEFERRED");
    // Deliberately memory-only. Context/prepare/preview never touch the fuse.
  }
  consume(handle: ShiftConsumedAdmissionV1): void {
    assertShiftWorkAllowed(); this.assertAvailable(handle.employeeId);
    this.blocked = true; // No error can reopen authority in this process.
    let fd: number | undefined, namespaceFd: number | undefined;
    try {
      if (verifiedNativeAllowancePath(this.markerPath) !== this.markerPath) shiftFail("LIVE_WRITES_DISABLED");
      const observed = readNamespace(this.namespacePath);
      if (!identicalFile(this.namespaceFile, observed.file) || fingerprint(observed.raw) !== this.namespaceDigest)
        shiftFail("LIVE_WRITES_DISABLED");
      assertShiftWorkAllowed(); this.window();
      fd = openSync(this.markerPath, "wx", 0o600);
      const marker = "CONSUMED: operator reconciliation required before reopening\n";
      if (writeSync(fd, marker) !== Buffer.byteLength(marker)) shiftFail("LIVE_WRITES_DISABLED");
      fsyncSync(fd);
      const file = fstatSync(fd);
      if (!identicalFile(file, lstatSync(this.markerPath))) shiftFail("LIVE_WRITES_DISABLED");
      // Also consume the EXISTING operator-provisioned namespace inode. A
      // lost newly-created marker cannot turn an already used namespace into
      // "never attempted" after restart. Malformed/partial writes fail closed.
      namespaceFd = openSync(this.namespacePath, constants.O_WRONLY); // Never O_CREAT.
      if (!identicalFile(observed.file, fstatSync(namespaceFd))) shiftFail("LIVE_WRITES_DISABLED");
      const consumed = JSON.stringify({ ...this.namespaceContent, state: "consumed" });
      ftruncateSync(namespaceFd, 0);
      if (writeSync(namespaceFd, consumed) !== Buffer.byteLength(consumed)) shiftFail("LIVE_WRITES_DISABLED");
      fsyncSync(namespaceFd);
      const namespace = fstatSync(namespaceFd);
      if (namespace.size !== Buffer.byteLength(consumed) || !identicalFile(namespace, lstatSync(this.namespacePath)))
        shiftFail("LIVE_WRITES_DISABLED");
      this.namespaceFile = namespace; this.namespaceDigest = fingerprint(consumed);
      this.owned = { handle, file };
    } catch { shiftFail("COMMAND_SCOPE_DEFERRED"); }
    finally {
      let failed = false;
      for (const handle of [namespaceFd, fd]) if (handle !== undefined) {
        try { closeSync(handle); } catch { failed = true; }
      }
      if (failed) shiftFail("COMMAND_SCOPE_DEFERRED");
    }
  }
  assertConsumed(handle: ShiftConsumedAdmissionV1): void {
    try {
      const namespace = lstatSync(this.namespacePath);
      if (this.owned?.handle !== handle || !identicalFile(this.owned.file, lstatSync(this.markerPath)))
        shiftFail("STALE_PREPARATION");
      if (!identicalFile(namespace, this.namespaceFile) || namespace.mtimeMs !== this.namespaceFile.mtimeMs ||
          namespace.size !== this.namespaceFile.size) shiftFail("STALE_PREPARATION");
    } catch { shiftFail("COMMAND_SCOPE_DEFERRED"); }
  }
  finish(handle: ShiftConsumedAdmissionV1, outcome: ShiftAdmissionOutcomeV1): void {
    // Terminal recording/cleanup may outlive the operational window; it never
    // grants further mutation, reopens authority or reconstructs a receipt.
    let fd: number | undefined;
    try {
      if (this.owned?.handle !== handle || !identicalFile(this.owned.file, lstatSync(this.markerPath))) throw shiftUnknown();
      if (outcome.kind === "verified" && outcome.receipt.businessTimeZone !== this.options.businessTimeZone)
        throw shiftUnknown();
      fd = openSync(this.markerPath, constants.O_WRONLY | constants.O_APPEND); // Never recreate a lost journal.
      if (!identicalFile(this.owned.file, fstatSync(fd))) throw shiftUnknown();
      const status = outcome.kind === "verified" ? "VERIFIED\n" : outcome.kind === "unknown" ? "UNKNOWN\n" : "REJECTED\n";
      if (writeSync(fd, status) !== Buffer.byteLength(status)) throw shiftUnknown();
      fsyncSync(fd);
    } catch { throw shiftUnknown(); }
    finally { if (fd !== undefined) closeSync(fd); }
  }
}
export class NativeShiftAdmission extends ShiftAdmissionKernel<NativeReference> {
  constructor(options: NativeShiftAdmissionOptions) {
    validateOptions(options); // No filesystem IO before every structural gate.
    const boundary = new NativeShiftFileBoundary(options);
    super(options.reference, { now: () => new Date() }, boundary);
  }
}
