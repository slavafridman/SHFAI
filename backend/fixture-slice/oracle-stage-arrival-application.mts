import { createHmac, randomBytes } from "node:crypto";
import { closeSync, fsyncSync, openSync, writeSync, lstatSync } from "node:fs";
import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { NativeStageArrivalContextV1, NativeStageArrivalValidationV1,
  NativeStageArrivalReceiptV1 } from "./oracle-stage-arrival-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { nativeStageArrivalAccessPolicy as policy, stageArrivalAccessPolicy } from "./access-policy.mts";
import { nativeCommand, nativeDraft } from "./native-stage-arrival-validation.mts";
import type { OracleStageArrivalUow } from "./oracle-stage-arrival-uow.mts";
import { nativeBinding, verifiedNativeAllowancePath, nativeIdentityBindingReference } from "./native-stage-arrival-config.mts";
import type { NativeBinding } from "./native-stage-arrival-config.mts";
import type { NativeSnapshot } from "./oracle-stage-arrival-snapshot.mts";
import { nativeOnTime } from "./oracle-stage-arrival-domain.mts";
import { canonical, civil, same } from "./stage-arrival-domain.mts";
import { selection } from "./stage-arrival-validation.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

type Preparation = { principal: PrincipalV1; snapshot: NativeSnapshot;
  issued: number; expires: number; fingerprint: string; identityReference: string };
// Exclusive operator-controlled file is only a persistent admission fuse:
// it contains NO business keys, identities, before-images, command receipts or
// secrets. Same path must be retained across process restarts. Removing it or
// issuing a new path is a manual operator/DBA reconciliation action, not an API.
export class NativeAllowance {
  private readonly path: string;
  private used = false;
  constructor(binding: NativeBinding) { this.path = binding.allowanceFile; }
  assertUnused() {
    if (this.used) stageFail("LIVE_WRITES_DISABLED");
    try {
      if (verifiedNativeAllowancePath(this.path) !== this.path) stageFail("LIVE_WRITES_DISABLED");
    } catch { stageFail("LIVE_WRITES_DISABLED"); }
    try { lstatSync(this.path); }
    catch (e) { if (e instanceof Error && "code" in e && e.code === "ENOENT") return; throw Error("Allowance unavailable"); }
    stageFail("LIVE_WRITES_DISABLED");
  }
  consume() {
    this.assertUnused(); this.used = true;
    let fd: number | undefined;
    try {
      const path = verifiedNativeAllowancePath(this.path);
      if (path !== this.path) stageFail("LIVE_WRITES_DISABLED");
      fd = openSync(path, "wx", 0o600);
      writeSync(fd, "CONSUMED: operator reconciliation required before any reopening\n");
      fsyncSync(fd);
    } catch { stageFail("LIVE_WRITES_DISABLED"); }
    finally { if (fd !== undefined) closeSync(fd); }
  }
}
export class OracleStageArrivalApplication {
  readonly dataSource = "oracle-test";
  private readonly uow: OracleStageArrivalUow;
  private readonly binding: NativeBinding;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly grants: readonly string[];
  private readonly allowance: NativeAllowance;
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  private knownCommitted = false; // No receipt/replay storage; only a local deny guard.
  private readonly identityReference: string;
  constructor(uow: OracleStageArrivalUow, binding: NativeBinding, clock: Clock, zone: string, grants: readonly string[]) {
    this.uow = uow; this.binding = nativeBinding(binding); this.clock = clock; this.zone = zone;
    this.identityReference = nativeIdentityBindingReference(this.binding);
    if (this.identityReference !== uow.identityReference) throw Error("Native identity reference mismatch");
    this.grants = [...grants]; this.allowance = new NativeAllowance(this.binding);
    if (!this.grants.includes(this.binding.orgUnitId)) throw Error("Native exact grant required");
    this.allowance.assertUnused();
  }
  private admit(p: unknown, target: unknown, commit = false) {
    try { validatePrincipal(p); } catch { stageFail("UNAUTHENTICATED"); }
    if (commit) policy.requireCommit(p); else policy.requirePrepare(p);
    if (this.identityReference !== this.uow.identityReference) stageFail("LIVE_WRITES_DISABLED");
    const s = selection(target), grants = stageArrivalAccessPolicy.authorizedTeamIds(p);
    if (!same(grants, this.grants) || !grants.includes(this.binding.orgUnitId) ||
        s.employeeId !== this.binding.employeeId || s.shiftDayId !== this.binding.shiftDayId)
      stageFail("SHIFT_DAY_NOT_FOUND");
    return { p: structuredClone(p), s };
  }
  private window(now: Date) {
    if (now.getTime() < Date.parse(this.binding.windowStart) || now.getTime() >= Date.parse(this.binding.windowEnd))
      stageFail("COMMAND_SCOPE_DEFERRED");
  }
  private eligible(f: NativeSnapshot) {
    if (f.rows.SHF_ATTENDANCE?.STAGE_ARRIVAL_TIME != null) stageFail("ALREADY_REGISTERED");
    if (f.blockers.length) stageFail("COMMAND_SCOPE_DEFERRED");
  }
  async assertReady(signal?: AbortSignal) {
    checkStageBudget(signal);
    const snapshot = await this.uow.read(signal), now = this.clock.now();
    this.window(now); this.eligible(snapshot); nativeOnTime(snapshot, now, this.zone);
    checkStageBudget(signal);
  }
  async context(p: unknown, target: unknown, signal?: AbortSignal): Promise<NativeStageArrivalContextV1> {
    const { s } = this.admit(p, target);
    checkStageBudget(signal);
    const f = await this.uow.read(signal), now = this.clock.now();
    this.window(now);
    checkStageBudget(signal);
    // Native late/out-of-window is unsupported, not a reason-bearing warning.
    nativeOnTime(f, now, this.zone);
    const a = f.rows.SHF_ATTENDANCE;
    return { ...s, orgUnitId: f.orgUnitId, planned: f.planned,
      recorded: { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: a?.STATION_ARRIVAL_TIME ?? null,
        stationExitLocal: a?.STATION_EXIT_TIME ?? null, briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null },
      serverTime: { instant: now.toISOString(), local: civil(now, this.zone), businessTimeZone: this.zone },
      eligibility: a?.STAGE_ARRIVAL_TIME != null ? "already-recorded" : f.blockers.length ? "deferred" : "eligible",
      blockers: f.blockers, lateReasonOptions: [], dataSource: "oracle-test" };
  }
  async validate(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<NativeStageArrivalValidationV1> {
    const { p: principal, s } = this.admit(p, target); nativeDraft(input);
    checkStageBudget(signal);
    this.allowance.assertUnused();
    const snapshot = await this.uow.read(signal), now = this.clock.now();
    this.window(now); this.eligible(snapshot);
    const c = nativeOnTime(snapshot, now, this.zone);
    checkStageBudget(signal);
    const expires = Math.min(now.getTime() + 120000, c.transition, Date.parse(this.binding.windowEnd));
    for (const [token, prep] of this.tokens) if (prep.expires <= now.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fp = createHmac("sha256", this.key).update(canonical({ mode: "test-oracle-controlled",
      binding: this.binding, identityReference: this.identityReference,
      principal, snapshot, zone: this.zone, validationToken, expires })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot: structuredClone(snapshot), issued: now.getTime(), expires,
      fingerprint: fp, identityReference: this.identityReference });
    return { ...s, state: "ready", evaluatedAt: now.toISOString(), evaluatedLocal: c.local,
      expiresAt: new Date(expires).toISOString(), businessTimeZone: this.zone,
      fingerprint: fp, validationToken, warnings: [], confirmationRequired: false, dataSource: "oracle-test" };
  }
  async commit(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<NativeStageArrivalReceiptV1> {
    const { p: principal, s } = this.admit(p, target, true), cmd = nativeCommand(input);
    checkStageBudget(signal);
    if (this.knownCommitted) {
      const current = await this.uow.read(signal);
      if (current.rows.SHF_ATTENDANCE?.STAGE_ARRIVAL_TIME != null) stageFail("ALREADY_REGISTERED");
      stageFail("LIVE_WRITES_DISABLED"); // Never reopen after external removal.
    }
    const prep = this.tokens.get(cmd.validationToken), now = this.clock.now();
    if (!prep || prep.identityReference !== this.uow.identityReference ||
        prep.fingerprint !== cmd.fingerprint || !same(prep.principal, principal) ||
        now.getTime() < prep.issued || now.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
    this.window(now);
    this.tokens.delete(cmd.validationToken);
    // Consume BEFORE acquisition, including failed/UNKNOWN attempts. UUIDs,
    // process restarts and memory receipt lookups cannot reopen this allowance.
    this.allowance.consume();
    const result = await this.uow.execute(prep.snapshot, current => {
      this.admit(principal, s, true);
      checkStageBudget(signal);
      this.eligible(current);
      const fresh = this.clock.now();
      if (fresh.getTime() < prep.issued || fresh.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
      this.window(fresh);
      const c = nativeOnTime(current, fresh, this.zone);
      if (!same(prep.snapshot, current)) stageFail("STALE_PREPARATION");
      const actor = principal.subject;
      if (actor !== "synthetic:administrator" || Buffer.byteLength(actor) > 100) stageFail("FORBIDDEN");
      checkStageBudget(signal);
      return { local: c.local, actor };
    }, signal);
    this.knownCommitted = true;
    try { checkStageBudget(signal); } catch { stageFail("COMMAND_OUTCOME_UNKNOWN"); }
    return { commandId: cmd.commandId, ...s, outcome: "oracle-test-committed", dataSource: "oracle-test",
      recorded: { stageArrivalLocal: result.local, briefing: false, stageLate: null },
      commitAcknowledgedAt: result.acknowledged, readBackVerifiedAt: result.verified, replayed: false,
      receiptPersistence: "none", businessTimeZone: this.zone, partnerCompletion: "not-invoked" };
  }
}
