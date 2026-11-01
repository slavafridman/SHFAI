import { lstatSync } from "node:fs";
import type { Stats } from "node:fs";
import { NativeAllowance } from "./oracle-stage-arrival-application.mts";
import { verifiedNativeAllowancePath } from "./native-stage-arrival-config.mts";
import { cancellationBinding, cancellationBindingScopeDigest } from "./native-station-exit-cancellation-config.mts";
import type { CancellationBindingV1, CancellationScopeV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationOperationAdmissionV1, CancellationOperatorAdmissionPort } from "./station-exit-cancellation-ports.mts";
import type { NativeCommandAdmissionV1 } from "./native-command-coordinator-contracts.mts";
import { NativeCommandCoordinator } from "./native-command-coordinator.mts";
import { same } from "./stage-arrival-domain.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { exact } from "./stage-arrival-validation.mts";

export class CancellationOperatorAdmission implements CancellationOperatorAdmissionPort {
  private readonly fuse: NativeAllowance;
  private readonly binding: CancellationBindingV1;
  private readonly coordinator: NativeCommandCoordinator;
  private readonly owned = new WeakMap<CancellationOperationAdmissionV1, {
    scope: CancellationScopeV1; commandId: string; file: Stats; global: NativeCommandAdmissionV1;
  }>();
  constructor(binding: CancellationBindingV1, coordinator: NativeCommandCoordinator) {
    if (!(coordinator instanceof NativeCommandCoordinator)) stageFail("LIVE_WRITES_DISABLED");
    this.binding = cancellationBinding(binding); this.coordinator = coordinator;
    coordinator.assertAvailableSync(binding.employeeId);
    this.fuse = new NativeAllowance(binding); this.fuse.assertUnused();
  }
  private assertScope(scope: CancellationScopeV1) {
    if (!exact(scope, ["bindingScopeDigest", "completeOriginalsDigest"]) ||
        scope.bindingScopeDigest !== cancellationBindingScopeDigest(this.binding) ||
        scope.completeOriginalsDigest !== this.binding.cancellationCertificate.completeOriginalsDigest)
      stageFail("STALE_PREPARATION");
  }
  async assertAvailable(scope: CancellationScopeV1, signal?: AbortSignal) {
    checkStageBudget(signal); this.assertScope(scope);
    await this.coordinator.assertAvailable(this.binding.employeeId, signal);
    this.fuse.assertUnused(); checkStageBudget(signal);
  }
  async consume(scope: CancellationScopeV1, commandId: string, global: NativeCommandAdmissionV1, signal?: AbortSignal) {
    this.assertScope(scope); checkStageBudget(signal);
    const b = this.coordinator.bindingFor(global, this.binding.employeeId, "station-exit-cancellation");
    if (b.commandId !== commandId) stageFail("LIVE_WRITES_DISABLED");
    this.coordinator.assertMutationAllowed(global, b);
    // Exclusive create+fsync occurs after both application consents and global
    // consumption. No restore on any subsequent result.
    this.fuse.consume();
    const file = lstatSync(this.binding.allowanceFile);
    if (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1) stageFail("LIVE_WRITES_DISABLED");
    const handle = Object.freeze(Object.create(null)) as CancellationOperationAdmissionV1;
    this.owned.set(handle, { scope: structuredClone(scope), commandId, file, global });
    this.assertMutationAllowed(handle, scope, commandId); return handle;
  }
  assertMutationAllowed(handle: CancellationOperationAdmissionV1, scope: CancellationScopeV1, commandId: string) {
    checkStageBudget(); this.assertScope(scope);
    const now = Date.now();
    if (now < Date.parse(this.binding.windowStart) || now >= Date.parse(this.binding.windowEnd) ||
        now < Date.parse(this.binding.partnerReview.reviewedAt) || now >= Date.parse(this.binding.partnerReview.expiresAt))
      stageFail("STALE_PREPARATION");
    const owned = this.owned.get(handle);
    if (!owned || owned.commandId !== commandId || !same(owned.scope, scope)) stageFail("LIVE_WRITES_DISABLED");
    const b = this.coordinator.bindingFor(owned.global, this.binding.employeeId, "station-exit-cancellation");
    this.coordinator.assertMutationAllowed(owned.global, b);
    try {
      if (verifiedNativeAllowancePath(this.binding.allowanceFile) !== this.binding.allowanceFile) stageFail("LIVE_WRITES_DISABLED");
      const current = lstatSync(this.binding.allowanceFile), old = owned.file;
      if (!current.isFile() || current.isSymbolicLink() || current.nlink !== 1 ||
          current.dev !== old.dev || current.ino !== old.ino || current.birthtimeMs !== old.birthtimeMs ||
          current.size !== old.size || current.mtimeMs !== old.mtimeMs) stageFail("LIVE_WRITES_DISABLED");
    } catch { stageFail("LIVE_WRITES_DISABLED"); }
  }
}
