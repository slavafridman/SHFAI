import { createHmac, randomBytes } from "node:crypto";
import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { NativeStationArrivalContextV1, NativeStationArrivalValidationV1,
  NativeStationArrivalReceiptV1 } from "./oracle-station-arrival-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { nativeStationArrivalAccessPolicy as policy, stationArrivalAccessPolicy } from "./access-policy.mts";
import { nativeStationCommand, nativeStationDraft } from "./native-station-arrival-validation.mts";
import { stationBinding, stationIdentityReference } from "./native-station-arrival-config.mts";
import type { StationBinding } from "./native-station-arrival-config.mts";
import type { StationSnapshot } from "./oracle-station-arrival-snapshot.mts";
import type { OracleStationArrivalUow } from "./oracle-station-arrival-uow.mts";
import { stationOnTime } from "./oracle-station-arrival-domain.mts";
import { NativeAllowance } from "./oracle-stage-arrival-application.mts";
import { canonical, civil, same } from "./stage-arrival-domain.mts";
import { selection } from "./stage-arrival-validation.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

type Preparation = { principal: PrincipalV1; snapshot: StationSnapshot; issued: number; expires: number;
  fingerprint: string; identityReference: string };
export class OracleStationArrivalApplication {
  readonly dataSource = "oracle-test";
  private readonly uow: OracleStationArrivalUow;
  private readonly binding: StationBinding;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly grants: readonly string[];
  private readonly allowance: NativeAllowance;
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  private readonly identityReference: string;
  private knownCommitted = false;
  constructor(uow: OracleStationArrivalUow, binding: StationBinding, clock: Clock, zone: string, grants: readonly string[]) {
    this.uow = uow; this.binding = stationBinding(binding); this.clock = clock; this.zone = zone;
    this.identityReference = stationIdentityReference(this.binding);
    if (uow.identityReference !== this.identityReference || uow.businessTimeZone !== zone)
      throw Error("Station identity reference/zone mismatch");
    this.grants = [...grants]; this.allowance = new NativeAllowance(this.binding);
    if (!grants.includes(this.binding.orgUnitId)) throw Error("Station exact grant required");
    this.allowance.assertUnused();
  }
  private admit(p: unknown, target: unknown, commit = false) {
    try { validatePrincipal(p); } catch { stageFail("UNAUTHENTICATED"); }
    if (commit) policy.requireCommit(p); else policy.requirePrepare(p);
    if (this.uow.identityReference !== this.identityReference) stageFail("LIVE_WRITES_DISABLED");
    const s = selection(target), grants = stationArrivalAccessPolicy.authorizedTeamIds(p);
    if (!same(grants, this.grants) || !grants.includes(this.binding.orgUnitId) ||
        s.employeeId !== this.binding.employeeId || s.shiftDayId !== this.binding.shiftDayId) stageFail("SHIFT_DAY_NOT_FOUND");
    return { p: structuredClone(p), s };
  }
  private window(now: Date) {
    if (!Number.isFinite(now.getTime()) || now.getTime() < Date.parse(this.binding.windowStart) ||
        now.getTime() >= Date.parse(this.binding.windowEnd)) stageFail("COMMAND_SCOPE_DEFERRED");
  }
  private eligible(f: StationSnapshot, local: string) {
    if (f.rows.SHF_ATTENDANCE?.STATION_ARRIVAL_TIME != null) stageFail("ALREADY_REGISTERED");
    if (f.blockers.length) stageFail("COMMAND_SCOPE_DEFERRED");
    const stage = f.rows.SHF_ATTENDANCE?.STAGE_ARRIVAL_TIME;
    if (stage != null && stage > local) stageFail("COMMAND_SCOPE_DEFERRED");
  }
  async assertReady(signal?: AbortSignal) {
    checkStageBudget(signal);
    const f = await this.uow.read(signal), now = this.clock.now();
    this.window(now); this.eligible(f, stationOnTime(f, now, this.zone).local); checkStageBudget(signal);
  }
  async context(p: unknown, target: unknown, signal?: AbortSignal): Promise<NativeStationArrivalContextV1> {
    const { s } = this.admit(p, target); checkStageBudget(signal);
    const f = await this.uow.read(signal), now = this.clock.now(); this.window(now);
    const c = stationOnTime(f, now, this.zone); checkStageBudget(signal);
    const a = f.rows.SHF_ATTENDANCE;
    const blockers = [...f.blockers];
    if (a?.STAGE_ARRIVAL_TIME != null && a.STAGE_ARRIVAL_TIME > c.local && !blockers.includes("UNSUPPORTED_DAY"))
      blockers.push("UNSUPPORTED_DAY");
    return { ...s, orgUnitId: f.orgUnitId, planned: f.planned,
      recorded: { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: a?.STATION_ARRIVAL_TIME ?? null,
        stationExitLocal: a?.STATION_EXIT_TIME ?? null, briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null },
      serverTime: { instant: now.toISOString(), local: civil(now, this.zone), businessTimeZone: this.zone },
      arrivalWindow: c.arrivalWindow, withinArrivalWindow: true,
      eligibility: a?.STATION_ARRIVAL_TIME != null ? "already-recorded" : blockers.length ? "deferred" : "eligible",
      blockers, lateReasonOptions: [], dataSource: "oracle-test" };
  }
  async validate(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<NativeStationArrivalValidationV1> {
    const { p: principal, s } = this.admit(p, target); nativeStationDraft(input); checkStageBudget(signal);
    this.allowance.assertUnused();
    const snapshot = await this.uow.read(signal), now = this.clock.now(); this.window(now);
    const c = stationOnTime(snapshot, now, this.zone); this.eligible(snapshot, c.local); checkStageBudget(signal);
    const expires = Math.min(now.getTime() + 120000, c.transition, Date.parse(this.binding.windowEnd));
    for (const [token, prep] of this.tokens) if (prep.expires <= now.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fp = createHmac("sha256", this.key).update(canonical({ operation: this.binding.operation, binding: this.binding,
      identityReference: this.identityReference, principal, snapshot, zone: this.zone, validationToken, expires })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot: structuredClone(snapshot), issued: now.getTime(),
      expires, fingerprint: fp, identityReference: this.identityReference });
    return { ...s, state: "ready", evaluatedAt: now.toISOString(), evaluatedLocal: c.local, expiresAt: new Date(expires).toISOString(),
      businessTimeZone: this.zone, fingerprint: fp, validationToken, warnings: [], confirmationRequired: false, dataSource: "oracle-test" };
  }
  async commit(p: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<NativeStationArrivalReceiptV1> {
    const { p: principal, s } = this.admit(p, target, true), cmd = nativeStationCommand(input);
    checkStageBudget(signal);
    if (this.knownCommitted) {
      const f = await this.uow.read(signal);
      if (f.rows.SHF_ATTENDANCE?.STATION_ARRIVAL_TIME != null) stageFail("ALREADY_REGISTERED");
      stageFail("LIVE_WRITES_DISABLED");
    }
    const prep = this.tokens.get(cmd.validationToken), now = this.clock.now();
    if (!prep || prep.identityReference !== this.uow.identityReference || prep.fingerprint !== cmd.fingerprint ||
        !same(prep.principal, principal) || now.getTime() < prep.issued || now.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
    this.window(now);
    checkStageBudget(signal);
    this.tokens.delete(cmd.validationToken);
    this.allowance.consume(); // Separate operation-bound single-attempt fuse, before acquisition.
    const result = await this.uow.execute(prep.snapshot, current => {
      this.admit(principal, s, true); checkStageBudget(signal);
      const fresh = this.clock.now();
      if (fresh.getTime() < prep.issued || fresh.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
      this.window(fresh);
      const c = stationOnTime(current, fresh, this.zone); this.eligible(current, c.local);
      if (!same(prep.snapshot, current)) stageFail("STALE_PREPARATION");
      const actor = principal.subject;
      if (actor !== "synthetic:administrator" || Buffer.byteLength(actor) > 100) stageFail("FORBIDDEN");
      checkStageBudget(signal); return { local: c.local, actor };
    }, signal);
    this.knownCommitted = true;
    try { checkStageBudget(signal); } catch { stageFail("COMMAND_OUTCOME_UNKNOWN"); }
    const before = prep.snapshot.rows.SHF_ATTENDANCE;
    return { commandId: cmd.commandId, ...s, outcome: "oracle-test-committed", dataSource: "oracle-test",
      recorded: { stageArrivalLocal: before?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: result.local, stationExitLocal: null,
        briefing: before?.TADREECH === "1" ? true : before?.TADREECH === "0" ? false : null, stationLate: null },
      commitAcknowledgedAt: result.acknowledged, readBackVerifiedAt: result.verified, replayed: false,
      receiptPersistence: "none", businessTimeZone: this.zone, partnerCompletion: "not-invoked" };
  }
}
