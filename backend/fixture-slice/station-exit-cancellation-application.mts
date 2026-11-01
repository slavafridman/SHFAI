import { createHmac, randomBytes } from "node:crypto";
import type { Clock } from "./current-shifts-contracts.mts";
import type { PrincipalV1 } from "./contracts.mts";
import type { CancellationApplicationPort } from "./station-exit-cancellation-ports.mts";
import type { CancellationReceiptV1 } from "./station-exit-cancellation-contracts.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
import type { CancellationSnapshot } from "./station-exit-cancellation-domain.mts";
import { decideCancellation } from "./station-exit-cancellation-domain.mts";
import { cancellationAccessPolicy } from "./access-policy.mts";
import { canonical, same } from "./stage-arrival-domain.mts";
import { selection } from "./stage-arrival-validation.mts";
import { cancellationCommand, cancellationDraft } from "./station-exit-cancellation-validation.mts";
import { CancellationError } from "./station-exit-cancellation-errors.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

// Explicitly isolated fixture store, NOT a native UoW/admission implementation.
export class CancellationFixtureStore {
  private facts: CancellationSnapshot;
  private attempted: boolean;
  private readonly uncertain: boolean;
  constructor(facts: CancellationSnapshot, scenario: "ready" | "not-recorded" | "early-deferred" |
    "partner-required" | "partner-unknown" | "outcome-unknown" | "authority-consumed") {
    if (facts.source !== "isolated-fixture") throw Error("Fixture source required");
    this.facts = structuredClone(facts);
    this.attempted = scenario === "authority-consumed"; this.uncertain = scenario === "outcome-unknown";
  }
  read() { return structuredClone(this.facts); }
  assertAvailable() { if (this.attempted) stageFail("LIVE_WRITES_DISABLED"); }
  execute(before: CancellationSnapshot, decide: (f: CancellationSnapshot) => void, signal?: AbortSignal) {
    checkStageBudget(signal); this.assertAvailable();
    this.attempted = true; // Retained even after stale/uncertain attempts; no reset or retry.
    if (!same(before, this.facts)) stageFail("STALE_PREPARATION");
    decide(this.read()); checkStageBudget(signal);
    const a = this.facts.rows.SHF_ATTENDANCE;
    if (!a || a.STATION_EXIT_TIME === null) throw new CancellationError("EXIT_NOT_RECORDED");
    a.STATION_EXIT_TIME = null; a.STATION_EXIT_USER = null;
    if (this.uncertain) stageFail("COMMAND_OUTCOME_UNKNOWN");
    return this.read();
  }
}
type Preparation = { principal: PrincipalV1; snapshot: CancellationSnapshot; issued: number; expires: number; fingerprint: string };
export class CancellationFixtureApplication implements CancellationApplicationPort {
  private readonly store: CancellationFixtureStore;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly grants: string[];
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  private attempted?: { id: string; payload: string };
  private readonly policy = cancellationAccessPolicy("isolated-fixture");
  constructor(store: CancellationFixtureStore, clock: Clock, zone: string, grants: string[]) {
    this.store = store; this.clock = clock; this.zone = zone; this.grants = [...grants];
    if (!grants.includes(store.read().orgUnitId)) throw Error("Exact cancellation unit grant required");
  }
  private admit(p: PrincipalV1, target: StageArrivalSelectionV1, commit = false) {
    if (commit) this.policy.requireCommit(p); else this.policy.requirePrepare(p);
    const s = selection(target), f = this.store.read();
    if (!same(this.policy.authorizedTeamIds(p), this.grants) || !this.grants.includes(f.orgUnitId) ||
        s.employeeId !== f.employeeId || s.shiftDayId !== f.shiftDayId) stageFail("SHIFT_DAY_NOT_FOUND");
    return structuredClone(p);
  }
  private ready(f: CancellationSnapshot, now: Date) {
    const d = decideCancellation(f, now, this.zone);
    if (d.eligibility === "not-recorded") throw new CancellationError("EXIT_NOT_RECORDED");
    if (d.eligibility !== "eligible") stageFail("COMMAND_SCOPE_DEFERRED");
    return d;
  }
  async context(p: PrincipalV1, target: StageArrivalSelectionV1, signal?: AbortSignal) {
    this.admit(p, target); checkStageBudget(signal); this.store.assertAvailable();
    const f = this.store.read(), now = this.clock.now(), d = decideCancellation(f, now, this.zone);
    checkStageBudget(signal);
    return { employeeId: f.employeeId, shiftDayId: f.shiftDayId, orgUnitId: f.orgUnitId, planned: f.planned,
      recorded: d.recorded, serverTime: { instant: now.toISOString(), local: d.local, businessTimeZone: this.zone },
      policy: f.policy, mode: "isolated-fixture" as const, dataSource: "isolated-fixture" as const,
      eligibility: d.eligibility, blockers: d.blockers };
  }
  async validate(p: PrincipalV1, target: StageArrivalSelectionV1, input: unknown, signal?: AbortSignal) {
    const principal = this.admit(p, target); cancellationDraft(input); checkStageBudget(signal); this.store.assertAvailable();
    const snapshot = this.store.read(), now = this.clock.now(), d = this.ready(snapshot, now);
    checkStageBudget(signal);
    const expires = Math.min(now.getTime() + 30000, d.transition);
    if (expires <= now.getTime()) stageFail("COMMAND_SCOPE_DEFERRED");
    for (const [token, prep] of this.tokens) if (prep.expires <= now.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fp = createHmac("sha256", this.key).update(canonical({ principal, snapshot, draft: {}, zone: this.zone,
      validationToken, issued: now.toISOString(), expires,
      warning: "RECORDED_EXIT_WILL_BE_CLEARED", operationConfirmationRequired: true })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot, issued: now.getTime(), expires, fingerprint: fp });
    return { employeeId: snapshot.employeeId, shiftDayId: snapshot.shiftDayId, state: "ready" as const,
      evaluatedAt: now.toISOString(), evaluatedLocal: d.local, expiresAt: new Date(expires).toISOString(),
      businessTimeZone: this.zone, validationToken, fingerprint: fp, originalExitLocal: d.recorded.stationExitLocal!,
      warnings: ["RECORDED_EXIT_WILL_BE_CLEARED"] as ["RECORDED_EXIT_WILL_BE_CLEARED"],
      confirmationRequired: true as const, dataSource: "isolated-fixture" as const };
  }
  async command(p: PrincipalV1, target: StageArrivalSelectionV1, input: unknown, signal?: AbortSignal): Promise<CancellationReceiptV1> {
    const principal = this.admit(p, target, true), cmd = cancellationCommand(input); checkStageBudget(signal);
    if (this.attempted?.id === cmd.commandId && this.attempted.payload !== canonical(cmd)) stageFail("COMMAND_ID_CONFLICT");
    this.store.assertAvailable();
    const prep = this.tokens.get(cmd.validationToken), now = this.clock.now();
    if (!prep || prep.fingerprint !== cmd.fingerprint || !same(prep.principal, principal) ||
        now.getTime() < prep.issued || now.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
    const original = this.ready(prep.snapshot, now).recorded;
    this.tokens.delete(cmd.validationToken); this.attempted = { id: cmd.commandId, payload: canonical(cmd) };
    const after = this.store.execute(prep.snapshot, f => {
      this.admit(p, target, true); this.ready(f, this.clock.now());
    }, signal);
    const recorded = decideCancellation(after, this.clock.now(), this.zone).recorded;
    if (recorded.stationArrivalLocal === null || recorded.stationExitLocal !== null) stageFail("COMMAND_OUTCOME_UNKNOWN");
    return { commandId: cmd.commandId, employeeId: after.employeeId, shiftDayId: after.shiftDayId,
      originalExitLocal: original.stationExitLocal!, recorded: { ...recorded, stationArrivalLocal: recorded.stationArrivalLocal, stationExitLocal: null },
      businessTimeZone: this.zone, outcome: "simulated", dataSource: "isolated-fixture",
      commitAcknowledgedAt: null, readBackVerifiedAt: null, replayed: false, receiptPersistence: "none", partnerCompletion: "not-invoked" };
  }
}
