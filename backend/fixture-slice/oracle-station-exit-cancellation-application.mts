import { createHmac, randomBytes } from "node:crypto";
import type { PrincipalV1 } from "./contracts.mts";
import type { CancellationApplicationPort } from "./station-exit-cancellation-ports.mts";
import type { CancellationBindingV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationReceiptV1 } from "./station-exit-cancellation-contracts.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
import type { NativeCancellationSnapshot } from "./oracle-station-exit-cancellation-snapshot.mts";
import { assertCancellationCertified } from "./oracle-station-exit-cancellation-snapshot.mts";
import { OracleStationExitCancellationUow } from "./oracle-station-exit-cancellation-uow.mts";
import { cancellationBinding, cancellationIdentityReference } from "./native-station-exit-cancellation-config.mts";
import { cancellationCommand, cancellationDraft } from "./station-exit-cancellation-validation.mts";
import { decideCancellation } from "./station-exit-cancellation-domain.mts";
import { cancellationAccessPolicy } from "./access-policy.mts";
import { CancellationError } from "./station-exit-cancellation-errors.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { selection } from "./stage-arrival-validation.mts";
import { canonical, same, civil } from "./stage-arrival-domain.mts";
import { systemClock } from "./read-current-shifts.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

type Preparation = { principal: PrincipalV1; snapshot: NativeCancellationSnapshot; issued: number; expires: number; fingerprint: string };
export class OracleStationExitCancellationApplication implements CancellationApplicationPort {
  private readonly uow: OracleStationExitCancellationUow;
  private readonly binding: CancellationBindingV1;
  private readonly zone: string;
  private readonly grants: readonly string[];
  private readonly identity: string;
  private readonly policy = cancellationAccessPolicy("test-oracle-controlled");
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  private inFlight = false;
  private attempted?: { id: string; payload: string };
  // Native clock intentionally has NO injection seam.
  constructor(uow: OracleStationExitCancellationUow, binding: CancellationBindingV1, zone: string, grants: readonly string[]) {
    if (!(uow instanceof OracleStationExitCancellationUow)) stageFail("LIVE_WRITES_DISABLED");
    this.binding = cancellationBinding(binding); this.uow = uow; this.zone = zone; this.grants = [...grants];
    this.identity = cancellationIdentityReference(this.binding);
    if (uow.identityReference !== this.identity || uow.businessTimeZone !== zone || !grants.includes(binding.orgUnitId))
      throw Error("Cancellation composition mismatch");
    uow.coordinator.assertAvailableSync(binding.employeeId);
  }
  private admit(p: PrincipalV1, target: StageArrivalSelectionV1, commit = false) {
    try { validatePrincipal(p); } catch { stageFail("UNAUTHENTICATED"); }
    if (commit) this.policy.requireCommit(p); else this.policy.requirePrepare(p);
    const s = selection(target);
    if (this.identity !== this.uow.identityReference) stageFail("LIVE_WRITES_DISABLED");
    if (!same(this.policy.authorizedTeamIds(p), this.grants) || !this.grants.includes(this.binding.orgUnitId) ||
        s.employeeId !== this.binding.employeeId || s.shiftDayId !== this.binding.shiftDayId) stageFail("SHIFT_DAY_NOT_FOUND");
    return structuredClone(p);
  }
  private ready(f: NativeCancellationSnapshot, now: Date) {
    const d = decideCancellation(f, now, this.zone);
    if (d.eligibility === "not-recorded") throw new CancellationError("EXIT_NOT_RECORDED");
    if (d.eligibility !== "eligible") stageFail("COMMAND_SCOPE_DEFERRED");
    assertCancellationCertified(f, this.binding); return d;
  }
  async assertReady(signal?: AbortSignal) {
    const f = await this.uow.read(signal);
    const d = decideCancellation(f, systemClock.now(), this.zone);
    assertCancellationCertified(f, this.binding);
    // An operator window may start in the future. Establish current facts,
    // without issuing a preparation before that start or relaxing any other
    // business/partner blocker.
    if (d.eligibility === "not-recorded") throw new CancellationError("EXIT_NOT_RECORDED");
    const now = systemClock.now().getTime(), day = f.planned.startLocal.slice(0, 10);
    if (f.planned.endLocal.slice(0, 10) !== day || [f.windowStart, f.windowEnd].some(t =>
        civil(new Date(t), this.zone).slice(0, 10) !== day) ||
        d.blockers.some(b => b !== "OUTSIDE_CANCELLATION_WINDOW") ||
        now >= Date.parse(this.binding.windowStart) && d.eligibility !== "eligible" ||
        now >= Date.parse(this.binding.windowEnd)) stageFail("COMMAND_SCOPE_DEFERRED");
    await this.uow.authority.assertAvailable(d.scope, signal);
  }
  async context(p: PrincipalV1, target: StageArrivalSelectionV1, signal?: AbortSignal) {
    this.admit(p, target); checkStageBudget(signal);
    await this.uow.coordinator.assertAvailable(this.binding.employeeId, signal);
    const f = await this.uow.read(signal), now = systemClock.now(), d = decideCancellation(f, now, this.zone);
    // Current facts must match operator certificate even for GET. Never grant
    // availability after row clearing/guard reconciliation alone.
    await this.uow.authority.assertAvailable(d.scope, signal); checkStageBudget(signal);
    return { employeeId: f.employeeId, shiftDayId: f.shiftDayId, orgUnitId: f.orgUnitId, planned: f.planned,
      recorded: d.recorded, serverTime: { instant: now.toISOString(), local: d.local, businessTimeZone: this.zone },
      policy: f.policy, mode: "test-oracle-controlled" as const, dataSource: "oracle-test" as const,
      eligibility: d.eligibility, blockers: d.blockers };
  }
  async validate(p: PrincipalV1, target: StageArrivalSelectionV1, input: unknown, signal?: AbortSignal) {
    const principal = this.admit(p, target); cancellationDraft(input); checkStageBudget(signal);
    await this.uow.coordinator.assertAvailable(this.binding.employeeId, signal);
    const snapshot = await this.uow.read(signal), now = systemClock.now(), d = this.ready(snapshot, now);
    await this.uow.authority.assertAvailable(d.scope, signal); checkStageBudget(signal);
    const fresh = systemClock.now(), expires = Math.min(now.getTime() + 30000, d.transition, Date.parse(this.binding.partnerReview.expiresAt));
    if (fresh.getTime() < now.getTime() || fresh.getTime() >= expires) stageFail("STALE_PREPARATION");
    this.ready(snapshot, fresh);
    for (const [token, prep] of this.tokens) if (prep.expires <= fresh.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fp = createHmac("sha256", this.key).update(canonical({ principal, snapshot, binding: this.binding,
      identity: this.identity, draft: {}, zone: this.zone, validationToken, issued: now.toISOString(), expires,
      warning: "RECORDED_EXIT_WILL_BE_CLEARED", operationConfirmationRequired: true })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot: structuredClone(snapshot), issued: now.getTime(), expires, fingerprint: fp });
    return { employeeId: snapshot.employeeId, shiftDayId: snapshot.shiftDayId, state: "ready" as const,
      evaluatedAt: now.toISOString(), evaluatedLocal: d.local, expiresAt: new Date(expires).toISOString(),
      businessTimeZone: this.zone, validationToken, fingerprint: fp, originalExitLocal: d.recorded.stationExitLocal!,
      warnings: ["RECORDED_EXIT_WILL_BE_CLEARED"] as ["RECORDED_EXIT_WILL_BE_CLEARED"],
      confirmationRequired: true as const, dataSource: "oracle-test" as const };
  }
  async command(p: PrincipalV1, target: StageArrivalSelectionV1, input: unknown, signal?: AbortSignal): Promise<CancellationReceiptV1> {
    const principal = this.admit(p, target, true), cmd = cancellationCommand(input); checkStageBudget(signal);
    if (this.attempted?.id === cmd.commandId && this.attempted.payload !== canonical(cmd)) stageFail("COMMAND_ID_CONFLICT");
    if (this.inFlight) stageFail("COMMAND_IN_PROGRESS");
    await this.uow.coordinator.assertAvailable(this.binding.employeeId, signal);
    const prep = this.tokens.get(cmd.validationToken), now = systemClock.now();
    if (!prep || prep.fingerprint !== cmd.fingerprint || !same(prep.principal, principal) ||
        now.getTime() < prep.issued || now.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
    const current = await this.uow.read(signal);
    if (!same(current, prep.snapshot)) stageFail("STALE_PREPARATION");
    const d = this.ready(current, systemClock.now());
    await this.uow.authority.assertAvailable(d.scope, signal);
    checkStageBudget(signal);
    if (this.inFlight) stageFail("COMMAND_IN_PROGRESS");
    if (systemClock.now().getTime() >= prep.expires) stageFail("STALE_PREPARATION");
    this.inFlight = true; this.attempted = { id: cmd.commandId, payload: canonical(cmd) };
    this.tokens.delete(cmd.validationToken);
    try {
      const global = await this.uow.coordinator.consume({ employeeId: current.employeeId,
        operation: "station-exit-cancellation", commandId: cmd.commandId }, signal);
      if (!same(this.admit(p, target, true), prep.principal)) stageFail("STALE_PREPARATION");
      this.ready(current, systemClock.now()); checkStageBudget(signal);
      if (systemClock.now().getTime() >= prep.expires) stageFail("STALE_PREPARATION");
      const operation = await this.uow.authority.consume(d.scope, cmd.commandId, global, signal);
      const result = await this.uow.execute(current, f => {
        if (!same(this.admit(p, target, true), prep.principal)) stageFail("STALE_PREPARATION");
        const t = systemClock.now().getTime();
        if (t < prep.issued || t >= prep.expires) stageFail("STALE_PREPARATION");
        this.ready(f, new Date(t));
      }, global, operation, signal);
      return { commandId: cmd.commandId, employeeId: current.employeeId, shiftDayId: current.shiftDayId,
        originalExitLocal: d.recorded.stationExitLocal!, ...result, businessTimeZone: this.zone,
        outcome: "oracle-test-committed", dataSource: "oracle-test", replayed: false,
        receiptPersistence: "none", partnerCompletion: "not-invoked" };
    } finally { this.inFlight = false; }
  }
}
