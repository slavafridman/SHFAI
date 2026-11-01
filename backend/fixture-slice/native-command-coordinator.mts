// §50-v0.1: additional retained local admission fence, NOT a receipt journal.
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, fsyncSync, ftruncateSync, lstatSync, openSync,
  readSync, realpathSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Stats } from "node:fs";
import type { NativeCommandAdmissionV1, NativeCommandCoordinatorBindingV1,
  NativeCommandCoordinatorNamespaceV1, NativeCommandCoordinatorPort } from "./native-command-coordinator-contracts.mts";
import { decimalId, record } from "./contract-validation.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { canonical, same } from "./stage-arrival-domain.mts";
import { verifiedNativeAllowancePath } from "./native-stage-arrival-config.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

const version = "shf-native-command-coordinator-v1";
const operations = ["stage-arrival", "station-arrival", "station-arrival-late", "station-exit",
  "create", "change", "cancel", "csv-create"];
function deny(): never { return stageFail("LIVE_WRITES_DISABLED"); }
function identity(s: Stats) { return { dev: s.dev, ino: s.ino, birthtimeMs: s.birthtimeMs }; }
function regular(s: Stats) {
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || !s.ino || s.size > 4096) deny();
}
function scope(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
}
export function nativeEmployeeScope(targetScope: string, employeeId: string) {
  if (!scope(targetScope) || !decimalId(employeeId)) return deny();
  return createHash("sha256").update(JSON.stringify([version, targetScope, employeeId]), "utf8").digest("hex");
}
type FileProof = { path: string; stat: ReturnType<typeof identity>; bytes: string };
type Admission = { binding: NativeCommandCoordinatorBindingV1; guard: FileProof; marker: FileProof };
export class NativeCommandCoordinator implements NativeCommandCoordinatorPort {
  private readonly directory: string;
  private readonly namespace: NativeCommandCoordinatorNamespaceV1;
  private readonly manifest: FileProof;
  private readonly ancestors = new Map<string, ReturnType<typeof identity>>();
  private readonly handles = new WeakMap<object, Admission>();
  private uncertain = false;
  constructor(raw: unknown, target: { database: string; schema: string }) {
    try {
      if (!exact(raw, ["directory", "targetScope"]) || typeof raw.directory !== "string" ||
          raw.directory.length > 4096 ||
          !scope(raw.targetScope) || !scope(target.database) || !scope(target.schema)) deny();
      const path = verifiedNativeAllowancePath(join(raw.directory, "namespace.json"));
      this.directory = dirname(path);
      // Require exact canonical input, not an alias/path guess or auto provisioning.
      if (raw.directory !== this.directory || realpathSync.native(this.directory) !== this.directory) deny();
      for (let cursor = this.directory; ; cursor = dirname(cursor)) {
        const s = lstatSync(cursor);
        if (!s.isDirectory() || s.isSymbolicLink() || !s.ino) deny();
        this.ancestors.set(cursor, identity(s));
        if (dirname(cursor) === cursor) break;
      }
      this.namespace = { version, canonicalDirectory: this.directory, targetScope: raw.targetScope,
        database: target.database, schema: target.schema };
      this.manifest = this.file(path);
      if (!same(parseStageJson(this.manifest.bytes), this.namespace)) deny();
    } catch { deny(); }
  }
  private paths(employeeId: string) {
    const key = nativeEmployeeScope(this.namespace.targetScope, employeeId);
    return { key, guard: join(this.directory, `employee-${key}.json`),
      marker: join(this.directory, `employee-${key}.attempted`) };
  }
  private file(path: string): FileProof {
    let fd: number | undefined;
    try {
      const before = lstatSync(path); regular(before);
      fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      const opened = fstatSync(fd); regular(opened);
      if (!same(identity(before), identity(opened))) deny();
      const buffer = Buffer.alloc(4097);
      let length = 0;
      while (length < buffer.length) {
        const count = readSync(fd, buffer, length, buffer.length - length, null);
        if (count === 0) break;
        length += count;
      }
      if (length > 4096 || length !== opened.size) deny();
      const bytes = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, length));
      const after = lstatSync(path), finished = fstatSync(fd);
      regular(after);
      if (!same(identity(opened), identity(after)) || !same(identity(opened), identity(finished)) ||
          finished.size !== opened.size || finished.mtimeMs !== opened.mtimeMs ||
          after.size !== finished.size || after.mtimeMs !== finished.mtimeMs) deny();
      return { path, stat: identity(after), bytes };
    } catch { return deny(); }
    finally { if (fd !== undefined) closeSync(fd); }
  }
  private recheck(proof: FileProof) {
    const current = this.file(proof.path);
    if (!same(current.stat, proof.stat) || current.bytes !== proof.bytes) deny();
  }
  private infrastructure() {
    if (this.uncertain) deny();
    for (const [path, expected] of this.ancestors) {
      const current = lstatSync(path);
      if (!current.isDirectory() || current.isSymbolicLink() || !same(identity(current), expected)) deny();
    }
    this.recheck(this.manifest);
  }
  private available(employeeId: string): FileProof {
    this.infrastructure();
    const p = this.paths(employeeId);
    try { lstatSync(p.marker); deny(); }
    catch (e) { if (!record(e) || e.code !== "ENOENT") deny(); }
    const guard = this.file(p.guard);
    if (!same(parseStageJson(guard.bytes), { version, targetScope: this.namespace.targetScope,
      employeeScope: p.key, state: "ready" })) deny();
    return guard;
  }
  async assertAvailable(employeeId: string, signal?: AbortSignal) {
    this.assertAvailableSync(employeeId, signal);
  }
  assertAvailableSync(employeeId: string, signal?: AbortSignal) {
    checkStageBudget(signal);
    try { this.available(employeeId); } catch { deny(); }
    checkStageBudget(signal);
  }
  async consume(binding: Readonly<NativeCommandCoordinatorBindingV1>, signal?: AbortSignal): Promise<NativeCommandAdmissionV1> {
    return this.consumeSync(binding, signal);
  }
  consumeSync(binding: Readonly<NativeCommandCoordinatorBindingV1>, signal?: AbortSignal): NativeCommandAdmissionV1 {
    checkStageBudget(signal);
    let markerFd: number | undefined, guardFd: number | undefined;
    try {
      if (!exact(binding, ["employeeId", "operation", "commandId"]) ||
          !operations.includes(binding.operation) ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(binding.commandId)) deny();
      const guard = this.available(binding.employeeId), p = this.paths(binding.employeeId);
      // Even partial acquisition stays denied forever. No unlink/reset on errors.
      markerFd = openSync(p.marker, "wx", 0o600);
      const markerBytes = canonical({ version, targetScope: this.namespace.targetScope, employeeScope: p.key,
        state: "consumed" });
      const markerBuffer = Buffer.from(markerBytes);
      if (writeSync(markerFd, markerBuffer) !== markerBuffer.length) deny();
      fsyncSync(markerFd);
      const markerStat = fstatSync(markerFd); regular(markerStat);
      const marker = this.file(p.marker);
      if (!same(marker.stat, identity(markerStat)) || marker.bytes !== markerBytes) deny();
      this.infrastructure(); this.recheck(guard);
      guardFd = openSync(p.guard, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0));
      const opened = fstatSync(guardFd); regular(opened);
      if (!same(identity(opened), guard.stat)) deny();
      this.recheck(guard);
      const bytes = canonical({ version, targetScope: this.namespace.targetScope, employeeScope: p.key, state: "consumed" });
      // Rewrite only the existing pinned inode. Marker already retained+fsynced;
      // truncation/short write errors can consume admission with zero business effects.
      const buffer = Buffer.from(bytes);
      ftruncateSync(guardFd, 0);
      if (writeSync(guardFd, buffer, 0, buffer.length, 0) !== buffer.length) deny();
      fsyncSync(guardFd);
      const consumed = this.file(p.guard);
      if (!same(consumed.stat, guard.stat) || !same(parseStageJson(consumed.bytes),
          parseStageJson(bytes))) deny();
      checkStageBudget(signal);
      const handle = Object.freeze({});
      this.handles.set(handle, { binding: structuredClone(binding), guard: consumed, marker });
      this.assertMutationAllowed(handle as NativeCommandAdmissionV1, binding);
      return handle as NativeCommandAdmissionV1;
    } catch { return deny(); }
    finally {
      let failed = false;
      for (const fd of [guardFd, markerFd]) if (fd !== undefined) {
        try { closeSync(fd); } catch { failed = true; }
      }
      if (failed) { this.uncertain = true; deny(); }
    }
  }
  assertMutationAllowed(handle: NativeCommandAdmissionV1, binding: Readonly<NativeCommandCoordinatorBindingV1>) {
    checkStageBudget();
    const owned = this.handles.get(handle);
    if (!owned || !same(owned.binding, binding)) deny();
    try {
      this.infrastructure(); this.recheck(owned.guard); this.recheck(owned.marker);
    } catch { this.uncertain = true; deny(); }
  }
  // Private native adapter seam: never exposed over HTTP or a receipt.
  bindingFor(handle: NativeCommandAdmissionV1, employeeId: string,
    operation: NativeCommandCoordinatorBindingV1["operation"]) {
    const owned = this.handles.get(handle);
    if (!owned || owned.binding.employeeId !== employeeId || owned.binding.operation !== operation) deny();
    this.assertMutationAllowed(handle, owned.binding);
    return Object.freeze({ ...owned.binding });
  }
}

// Strict ENV reader. Caller supplies the already parsed frozen target, never credentials.
export async function nativeCoordinatorFromEnvironment(env: NodeJS.ProcessEnv,
  targets: readonly { employeeId: string; writeIdentity: { database: string; schema: string } }[]) {
  if (!targets.length) {
    if (env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG !== undefined) deny();
    return undefined;
  }
  if (env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG === undefined) deny();
  if (Buffer.byteLength(env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG, "utf8") > 8192) deny();
  let raw: unknown;
  try { raw = parseStageJson(env.SHF_NATIVE_COMMAND_COORDINATOR_CONFIG); } catch { return deny(); }
  const first = targets[0]!;
  if (targets.some(t => !same(t.writeIdentity.database, first.writeIdentity.database) ||
      t.writeIdentity.schema !== first.writeIdentity.schema)) deny();
  const coordinator = new NativeCommandCoordinator(raw, first.writeIdentity);
  for (const target of targets) await coordinator.assertAvailable(target.employeeId);
  return coordinator;
}
