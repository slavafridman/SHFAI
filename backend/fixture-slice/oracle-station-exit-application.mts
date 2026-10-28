import { createHmac, randomBytes } from "node:crypto";
import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { StationExitContextV1, StationExitValidationV1, StationExitReceiptV1 } from "./station-exit-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { stationExitAccessPolicy as policy } from "./access-policy.mts";
import { exitCommand, exitDraft } from "./station-exit-validation.mts";
import { exitBinding, exitIdentityReference } from "./native-station-exit-config.mts";
import type { ExitBinding } from "./native-station-exit-config.mts";
import type { ExitSnapshot } from "./oracle-station-exit-snapshot.mts";
import type { OracleStationExitUow } from "./oracle-station-exit-uow.mts";
import { exitTiming } from "./oracle-station-exit-domain.mts";
import { NativeAllowance } from "./oracle-stage-arrival-application.mts";
import { canonical, civil, same } from "./stage-arrival-domain.mts";
import { selection } from "./stage-arrival-validation.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

type Preparation = { principal: PrincipalV1; snapshot: ExitSnapshot; issued: number; expires: number;
  fingerprint: string; identityReference: string };
export class OracleStationExitApplication {
  readonly dataSource = "oracle-test";
  private readonly uow: OracleStationExitUow;
  private readonly binding: ExitBinding;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly grants: readonly string[];
  private readonly allowance: NativeAllowance;
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  private readonly identityReference: string;
  private inFlight = false;
  private knownCommitted = false;
  // Bounded (one physical attempt per app/tuple); no receipt or replay cache.
  private attemptedCommand?: { id: string; payload: string };
  constructor(uow: OracleStationExitUow, binding: ExitBinding, clock: Clock, zone: string, grants: readonly string[]) {
    this.uow = uow; this.binding = exitBinding(binding); this.clock = clock; this.zone = zone;
    this.identityReference = exitIdentityReference(this.binding);
    if (uow.identityReference !== this.identityReference || uow.businessTimeZone !== zone)
      throw Error("Exit identity reference/zone mismatch");
    this.grants = [...grants]; this.allowance = new NativeAllowance(this.binding);
    if (!grants.includes(this.binding.orgUnitId)) throw Error("Exit exact grant required");
    this.allowance.assertUnused();
  }
  private admit(p: unknown, target: unknown, commit = false) {
    try { validatePrincipal(p); } catch { stageFail("UNAUTHENTICATED"); }
    if (commit) policy.requireCommit(p); else policy.requirePrepare(p);
    if (this.uow.identityReference !== this.identityReference) stageFail("LIVE_WRITES_DISABLED");
    const s = selection(target), grants = policy.authorizedTeamIds(p);
    if (!same(grants, this.grants) || !grants.includes(this.binding.orgUnitId) ||
        s.employeeId !== this.binding.employeeId || s.shiftDayId !== this.binding.shiftDayId) stageFail("SHIFT_DAY_NOT_FOUND");
    return { p: structuredClone(p), s };
  }
  private ready(f: ExitSnapshot, now: Date) {
    if (f.rows.SHF_ATTENDANCE?.STATION_EXIT_TIME != null) stageFail("ALREADY_REGISTERED");
    const c = exitTiming(f, now, this.zone, this.binding);
    if (f.blockers.length || !c.withinExitWindow || c.classification !== "ordinary") stageFail("COMMAND_SCOPE_DEFERRED");
    return c;
  }
  async assertReady(signal?: AbortSignal) {
    checkStageBudget(signal);
    const f = await this.uow.read(signal);
    this.ready(f, this.clock.now()); checkStageBudget(signal);
  }
  async context(p: unknown, target: unknown, signal?: AbortSignal): Promise<StationExitContextV1> {
    const { s } = this.admit(p, target); checkStageBudget(signal);
    const f = await this.uow.read(signal), now = this.clock.now(), c = exitTiming(f, now, this.zone, this.binding);
    checkStageBudget(signal);
    const a = f.rows.SHF_ATTENDANCE;
    return { ...s, orgUnitId: f.orgUnitId, planned: f.planned, policy: f.policy,
      recorded: { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: a?.STATION_ARRIVAL_TIME ?? null,
        stationExitLocal: a?.STATION_EXIT_TIME ?? null, briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null },
      serverTime: { instant: now.toISOString(), local: civil(now, this.zone), businessTimeZone: this.zone },
      exitWindow: c.exitWindow, classification: c.classification, withinExitWindow: c.withinExitWindow,
      eligibility: a?.STATION_EXIT_TIME != null ? "already-recorded" :
        f.blockers.length || !c.withinExitWindow ? "deferred" : "eligible",
      blockers: f.blockers, dataSource: "oracle-test" };
  }
  async validate(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<StationExitValidationV1> {
    const { p: principal, s } = this.admit(p, target); exitDraft(input); checkStageBudget(signal);
    this.allowance.assertUnused();
    const snapshot = await this.uow.read(signal), now = this.clock.now(), c = this.ready(snapshot, now);
    checkStageBudget(signal);
    const expires = Math.min(now.getTime() + 120000, c.transition);
    for (const [token, prep] of this.tokens) if (prep.expires <= now.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fp = createHmac("sha256", this.key).update(canonical({ operation: this.binding.operation, binding: this.binding,
      identityReference: this.identityReference, principal, snapshot, zone: this.zone, draft: {}, issued: now.toISOString(),
      classification: c.classification, validationToken, expires })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot: structuredClone(snapshot), issued: now.getTime(),
      expires, fingerprint: fp, identityReference: this.identityReference });
    return { ...s, state: "ready", evaluatedAt: now.toISOString(), evaluatedLocal: c.local, expiresAt: new Date(expires).toISOString(),
      businessTimeZone: this.zone, fingerprint: fp, validationToken, warnings: [], confirmationRequired: false, dataSource: "oracle-test" };
  }
  async commit(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<StationExitReceiptV1> {
    const { p: principal, s } = this.admit(p, target, true), cmd = exitCommand(input);
    checkStageBudget(signal);
    const payload = canonical(cmd);
    if (this.attemptedCommand?.id === cmd.commandId && this.attemptedCommand.payload !== payload)
      stageFail("COMMAND_ID_CONFLICT");
    if (this.inFlight) stageFail("COMMAND_IN_PROGRESS");
    if (this.knownCommitted) {
      const f = await this.uow.read(signal);
      if (f.rows.SHF_ATTENDANCE?.STATION_EXIT_TIME != null) stageFail("ALREADY_REGISTERED");
      stageFail("LIVE_WRITES_DISABLED");
    }
    const prep = this.tokens.get(cmd.validationToken), now = this.clock.now();
    if (!prep || prep.identityReference !== this.uow.identityReference || prep.fingerprint !== cmd.fingerprint ||
        !same(prep.principal, principal) || now.getTime() < prep.issued || now.getTime() >= prep.expires)
      stageFail("STALE_PREPARATION");
    this.ready(prep.snapshot, now);
    // Synchronous reservation and allowance before the first acquisition/await.
    this.inFlight = true;
    this.attemptedCommand = { id: cmd.commandId, payload };
    this.tokens.delete(cmd.validationToken);
    try {
      this.allowance.consume();
      const result = await this.uow.execute(prep.snapshot, current => {
        this.admit(principal, s, true); checkStageBudget(signal);
        const fresh = this.clock.now();
        if (fresh.getTime() < prep.issued || fresh.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
        const c = this.ready(current, fresh);
        return { local: c.local, actor: principal.subject };
      }, signal);
      this.knownCommitted = true; this.tokens.clear();
      const a = prep.snapshot.rows.SHF_ATTENDANCE;
      if (!a?.STATION_ARRIVAL_TIME) stageFail("COMMAND_OUTCOME_UNKNOWN");
      return { ...s, commandId: cmd.commandId, outcome: "oracle-test-committed",
        recorded: { stageArrivalLocal: a.STAGE_ARRIVAL_TIME, stationArrivalLocal: a.STATION_ARRIVAL_TIME,
          stationExitLocal: result.local, briefing: a.TADREECH === "1" ? true : a.TADREECH === "0" ? false : null },
        commitAcknowledgedAt: result.acknowledged, readBackVerifiedAt: result.verified, businessTimeZone: this.zone,
        replayed: false, receiptPersistence: "none", partnerCompletion: "not-invoked", dataSource: "oracle-test" };
    } finally { this.inFlight = false; }
  }
}
