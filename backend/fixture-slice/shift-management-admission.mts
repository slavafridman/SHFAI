import { randomBytes } from "node:crypto";
import type { Clock } from "./current-shifts-contracts.mts";
import type { ShiftAdmissionPlanV1, ShiftAdmissionOutcomeV1, ShiftAdmissionReferenceV1,
  ShiftCommandAdmission, ShiftCommandBindingV1, ShiftConsumedAdmissionV1 } from "./shift-management-contracts.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { freezeShift } from "./shift-management-model.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { requireShiftAcknowledgments } from "./shift-management-validation.mts";
import { shiftFail } from "./shift-management-errors.mts";
import { decimalId, text, validatePrincipal } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";

type FixtureReference = Extract<ShiftAdmissionReferenceV1, { mode: "isolated-fixture" }>;
interface Preparation { plan: ShiftAdmissionPlanV1; fingerprint: string }
interface Attempt { handle: ShiftConsumedAdmissionV1; binding: ShiftCommandBindingV1;
  plan: ShiftAdmissionPlanV1; settled: boolean }

// Explicit isolated test/demo implementation. It cannot certify native fuse
// durability, survive process loss, or be constructed with an Oracle reference.
export class IsolatedShiftAdmission implements ShiftCommandAdmission {
  readonly reference: Readonly<FixtureReference>;
  private readonly tokens = new Map<string, Preparation>();
  private readonly commands = new Map<string, Attempt>();
  private readonly employees = new Set<string>();
  private readonly quarantined = new Set<string>();
  private readonly handles = new WeakMap<ShiftConsumedAdmissionV1, Attempt>();
  private readonly clock: Clock;
  constructor(reference: FixtureReference, clock: Clock) {
    if (!exact(reference, ["namespace", "identityRevision", "operatorScopeRevision", "mode", "dataSource", "metadata"]) ||
        reference.mode !== "isolated-fixture" || reference.dataSource !== "isolated-fixture" ||
        reference.metadata !== null || reference.namespace !== "shift-management-v0.1" ||
        !text(reference.identityRevision, 128, 1) || !text(reference.operatorScopeRevision, 128, 1))
      throw Error("Isolated management admission reference required");
    this.reference = freezeShift(structuredClone(reference)); this.clock = clock;
  }
  private prune() {
    const now = this.clock.now().getTime();
    if (!Number.isFinite(now)) shiftFail("INVALID_SOURCE_DATA");
    for (const [token, preparation] of this.tokens)
      if (Date.parse(preparation.plan.expiresAt) <= now) this.tokens.delete(token);
    return now;
  }
  private available(employeeId: string) {
    if (this.quarantined.has(employeeId)) shiftFail("COMMAND_SCOPE_DEFERRED");
    if (this.employees.has(employeeId)) shiftFail("COMMAND_IN_PROGRESS");
  }
  async prepare(plan: ShiftAdmissionPlanV1, signal?: AbortSignal) {
    assertShiftWorkAllowed(signal);
    const now = this.prune();
    this.available(plan.employeeId);
    try { validatePrincipal(plan.principal, "shift-management"); }
    catch { shiftFail("UNAUTHENTICATED"); }
    if (!decimalId(plan.employeeId) || !text(plan.authGeneration, 128, 1) ||
        !/^[0-9a-f]{64}$/.test(plan.planDigest) || !/^[0-9a-f]{64}$/.test(plan.snapshotRevision) ||
        !Number.isFinite(Date.parse(plan.expiresAt)) ||
        new Date(plan.expiresAt).toISOString() !== plan.expiresAt ||
        !same(plan.authorizedTeamIds, plan.principal.resourceScope.orgUnitIds) ||
        !Array.isArray(plan.effects) || plan.effects.length < 1 || plan.effects.length > 100)
      shiftFail("INVALID_SOURCE_DATA");
    if (!same(plan.reference, this.reference) || Date.parse(plan.expiresAt) <= now ||
        Date.parse(plan.expiresAt) > now + 120000) shiftFail("STALE_PREPARATION");
    if (this.tokens.size >= 1000) shiftFail("DEPENDENCY_UNAVAILABLE");
    const token = randomBytes(32).toString("base64url");
    const owned = structuredClone(plan);
    const digest = fingerprint(owned);
    this.tokens.set(token, { plan: freezeShift(owned), fingerprint: digest });
    return { validationToken: token, fingerprint: digest, expiresAt: plan.expiresAt };
  }
  async consume(binding: ShiftCommandBindingV1, signal?: AbortSignal): Promise<ShiftConsumedAdmissionV1> {
    assertShiftWorkAllowed(signal); this.prune(); this.available(binding.employeeId);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(binding.commandId))
      shiftFail("INVALID_REQUEST");
    const prior = this.commands.get(binding.commandId);
    if (prior) {
      if (!same(prior.binding, binding)) shiftFail("COMMAND_ID_CONFLICT");
      shiftFail(prior.settled ? "COMMAND_SCOPE_DEFERRED" : "COMMAND_IN_PROGRESS");
    }
    const prepared = this.tokens.get(binding.validationToken);
    if (!prepared) shiftFail("STALE_PREPARATION");
    const plan = prepared.plan;
    if (!same(binding.reference, this.reference) || binding.fingerprint !== prepared.fingerprint ||
        !same(plan.reference, binding.reference) || plan.kind !== binding.kind ||
        plan.employeeId !== binding.employeeId || !same(plan.principal, binding.principal) ||
        plan.authGeneration !== binding.authGeneration || !same(plan.authorizedTeamIds, binding.authorizedTeamIds) ||
        plan.planDigest !== binding.planDigest) shiftFail("STALE_PREPARATION");
    requireShiftAcknowledgments([...new Set(plan.effects.flatMap(effect => effect.warningCodes))],
      binding.acknowledgedWarningCodes, binding.operationConfirmation?.accepted === true);
    if (this.commands.size >= 1000) shiftFail("DEPENDENCY_UNAVAILABLE");
    // No await gap between final guard, reservation, token consumption and
    // command registration. Native durability is deliberately not simulated.
    assertShiftWorkAllowed(signal);
    const handle = freezeShift({ reference: this.reference, kind: binding.kind,
      employeeId: binding.employeeId, commandId: binding.commandId, planDigest: binding.planDigest,
      attemptHandle: randomBytes(32).toString("base64url") });
    const attempt: Attempt = { handle, binding: freezeShift(structuredClone(binding)), plan, settled: false };
    this.tokens.delete(binding.validationToken); this.employees.add(binding.employeeId);
    this.commands.set(binding.commandId, attempt); this.handles.set(handle, attempt);
    return handle;
  }
  assertOwned(handle: ShiftConsumedAdmissionV1): void {
    const attempt = this.handles.get(handle);
    if (!attempt || attempt.settled || !same(handle.reference, this.reference) ||
        !this.employees.has(handle.employeeId)) shiftFail("STALE_PREPARATION");
  }
  async finish(handle: ShiftConsumedAdmissionV1, outcome: ShiftAdmissionOutcomeV1): Promise<void> {
    this.assertOwned(handle);
    const attempt = this.handles.get(handle);
    if (!attempt) shiftFail("INVALID_SOURCE_DATA");
    if (!["verified", "rejected", "unknown"].includes(outcome.kind)) shiftFail("INVALID_SOURCE_DATA");
    if (outcome.kind !== "verified" && (outcome.problem.commandId !== handle.commandId ||
        outcome.kind === "unknown" && (outcome.problem.effect !== "unknown" ||
          outcome.problem.code !== "COMMAND_OUTCOME_UNKNOWN"))) shiftFail("INVALID_SOURCE_DATA");
    if (outcome.kind === "verified" && (outcome.receipt.commandId !== handle.commandId ||
        outcome.receipt.employeeId !== handle.employeeId || outcome.receipt.kind !== handle.kind ||
        outcome.receipt.outcome !== "fixture-committed" || outcome.receipt.dataSource !== "isolated-fixture"))
      shiftFail("INVALID_SOURCE_DATA");
    if (outcome.kind === "verified") {
      if (outcome.receipt.effects.length !== attempt.plan.effects.length) shiftFail("INVALID_SOURCE_DATA");
      for (let i = 0; i < outcome.receipt.effects.length; i++) {
        const actual = outcome.receipt.effects[i], expected = attempt.plan.effects[i];
        if (actual.row !== expected.row || !same(actual.before, expected.before) ||
            !same(actual.warningCodes, expected.warningCodes) ||
            !decimalId(actual.after.shiftDayId, 10) ||
            expected.after.shiftDayId !== null && actual.after.shiftDayId !== expected.after.shiftDayId ||
            !same({ ...actual.after, shiftDayId: expected.after.shiftDayId }, expected.after))
          shiftFail("INVALID_SOURCE_DATA");
      }
    }
    if (outcome.kind === "unknown") this.quarantined.add(handle.employeeId);
    attempt.settled = true; this.employees.delete(handle.employeeId);
  }
  inspect() {
    return { preparations: this.tokens.size, retainedCommands: this.commands.size,
      active: this.employees.size, quarantined: this.quarantined.size };
  }
}
