import { createHmac, randomBytes } from "node:crypto";
import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { LateStationArrivalApplicationPort, NativeLateStationContextV1, NativeLateStationDraftV1,
  NativeLateStationCommitV1, NativeLateStationValidationV1, NativeLateStationReceiptV1,
  PartnerStationArrivalObligationPort } from "./oracle-station-arrival-late-contracts.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
import type { LateSnapshot } from "./oracle-station-arrival-late-snapshot.mts";
import { OracleLateStationArrivalUow } from "./oracle-station-arrival-late-uow.mts";
import { lateBinding, lateIdentityReference } from "./native-station-arrival-late-config.mts";
import type { LateBinding } from "./native-station-arrival-late-config.mts";
import { nativeLateStationArrivalAccessPolicy as policy } from "./access-policy.mts";
import { lateCommand, lateDraft } from "./native-station-arrival-late-validation.mts";
import { stationLateTiming, lateReasonCatalog, requireLateReason } from "./oracle-station-arrival-late-domain.mts";
import { NativeAllowance } from "./oracle-stage-arrival-application.mts";
import { canonical, same, civil } from "./stage-arrival-domain.mts";
import { selection } from "./stage-arrival-validation.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { currentRequestBudget, withRequestBudget } from "./request-budget-context.mts";
type Preparation = { principal: PrincipalV1; snapshot: LateSnapshot; draft: NativeLateStationDraftV1;
  issued: number; expires: number; minutes: number; fingerprint: string };
export class OracleLateStationArrivalApplication implements LateStationArrivalApplicationPort {
  readonly dataSource = "oracle-test";
  private readonly uow: OracleLateStationArrivalUow;
  private readonly binding: LateBinding;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly grants: readonly string[];
  private readonly partner: PartnerStationArrivalObligationPort<LateSnapshot>;
  private readonly allowance: NativeAllowance;
  private readonly identityReference: string;
  private readonly key = randomBytes(32);
  private readonly tokens = new Map<string, Preparation>();
  constructor(uow: OracleLateStationArrivalUow, binding: LateBinding, clock: Clock, zone: string,
    grants: readonly string[], partner: PartnerStationArrivalObligationPort<LateSnapshot>) {
    if (!(uow instanceof OracleLateStationArrivalUow) || !partner || typeof partner.assess !== "function")
      throw Error("Concrete late UoW and abstract obligation assessment required");
    this.uow = uow; this.binding = lateBinding(binding); this.clock = clock; this.zone = zone;
    this.grants = [...grants]; this.partner = partner; this.identityReference = lateIdentityReference(this.binding);
    if (uow.identityReference !== this.identityReference || uow.businessTimeZone !== zone ||
        !grants.includes(binding.orgUnitId)) throw Error("Late identity/zone/exact grant mismatch");
    uow.coordinator.assertAvailableSync(this.binding.employeeId);
    this.allowance = new NativeAllowance(this.binding); this.allowance.assertUnused();
  }
  private admit(p: PrincipalV1, input: StageArrivalSelectionV1, commit = false) {
    if (commit) policy.requireCommit(p); else policy.requirePrepare(p);
    const s = selection(input);
    if (!same(policy.authorizedTeamIds(p), this.grants) || !this.grants.includes(this.binding.orgUnitId) ||
        s.employeeId !== this.binding.employeeId || s.shiftDayId !== this.binding.shiftDayId) stageFail("SHIFT_DAY_NOT_FOUND");
    if (this.uow.identityReference !== this.identityReference) stageFail("LIVE_WRITES_DISABLED");
    return { s, principal: structuredClone(p) };
  }
  private window(now: Date) {
    if (!Number.isFinite(now.getTime()) || now.getTime() < Date.parse(this.binding.windowStart) ||
        now.getTime() >= Date.parse(this.binding.windowEnd)) stageFail("COMMAND_SCOPE_DEFERRED");
  }
  private eligible(snapshot: LateSnapshot, now: Date, draft?: NativeLateStationDraftV1) {
    this.window(now);
    const c = stationLateTiming(snapshot, now, this.zone), a = snapshot.rows.SHF_ATTENDANCE;
    if (a?.STATION_ARRIVAL_TIME != null) stageFail("ALREADY_REGISTERED");
    if (snapshot.blockers.length || a?.STAGE_ARRIVAL_TIME != null && a.STAGE_ARRIVAL_TIME > c.local)
      stageFail("COMMAND_SCOPE_DEFERRED");
    const obligations = this.partner.assess(snapshot);
    if (obligations.state !== "not-required" || !Array.isArray(obligations.effects) || obligations.effects.length)
      stageFail("COMMAND_SCOPE_DEFERRED");
    if (draft) requireLateReason(snapshot.reasons, draft.lateReasonCode);
    return c;
  }
  async assertReady(signal?: AbortSignal) {
    await this.uow.coordinator.assertAvailable(this.binding.employeeId, signal);
    this.eligible(await this.uow.read(signal), this.clock.now()); checkStageBudget(signal);
  }
  async context(p: PrincipalV1, input: StageArrivalSelectionV1, signal?: AbortSignal): Promise<NativeLateStationContextV1> {
    return this.budget(owned => this.readContext(p, input, owned), signal);
  }
  private async readContext(p: PrincipalV1, input: StageArrivalSelectionV1, signal?: AbortSignal): Promise<NativeLateStationContextV1> {
    const { s } = this.admit(p, input);
    await this.uow.coordinator.assertAvailable(s.employeeId, signal);
    const snapshot = await this.uow.read(signal), now = this.clock.now();
    this.window(now);
    let withinArrivalWindow = true;
    try { stationLateTiming(snapshot, now, this.zone); }
    catch (e) {
      if (!(e instanceof StageArrivalError) || e.code !== "COMMAND_SCOPE_DEFERRED") throw e;
      withinArrivalWindow = false;
    }
    const local = civil(now, this.zone), a = snapshot.rows.SHF_ATTENDANCE;
    const blockers = [...snapshot.blockers];
    const obligation = this.partner.assess(snapshot);
    if (a?.STAGE_ARRIVAL_TIME != null && a.STAGE_ARRIVAL_TIME > local ||
        obligation.state !== "not-required" || !Array.isArray(obligation.effects) || obligation.effects.length)
      blockers.push("UNSUPPORTED_DAY");
    checkStageBudget(signal);
    return { ...s, orgUnitId: snapshot.orgUnitId, planned: snapshot.planned,
      recorded: { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: a?.STATION_ARRIVAL_TIME ?? null,
        stationExitLocal: a?.STATION_EXIT_TIME ?? null,
        briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null },
      serverTime: { instant: now.toISOString(), local, businessTimeZone: this.zone },
      arrivalWindow: { earliestLocal: snapshot.planned.startLocal, latestLocal: snapshot.planned.endLocal },
      withinArrivalWindow, eligibility: a?.STATION_ARRIVAL_TIME != null ? "already-recorded" :
        blockers.length || !withinArrivalWindow ? "deferred" : "eligible",
      blockers: [...new Set(blockers)], lateReasonOptions: lateReasonCatalog(snapshot.reasons), dataSource: "oracle-test" };
  }
  async validate(p: PrincipalV1, input: StageArrivalSelectionV1, raw: NativeLateStationDraftV1,
    signal?: AbortSignal): Promise<NativeLateStationValidationV1> {
    return this.budget(owned => this.prepare(p, input, raw, owned), signal);
  }
  private async prepare(p: PrincipalV1, input: StageArrivalSelectionV1, raw: NativeLateStationDraftV1,
    signal?: AbortSignal): Promise<NativeLateStationValidationV1> {
    const { s, principal } = this.admit(p, input), draft = lateDraft(raw);
    await this.uow.coordinator.assertAvailable(s.employeeId, signal); this.allowance.assertUnused();
    const snapshot = await this.uow.read(signal), now = this.clock.now(), c = this.eligible(snapshot, now, draft);
    const expires = Math.min(now.getTime() + 120000, c.transition, Date.parse(this.binding.windowEnd));
    for (const [token, prep] of this.tokens) if (prep.expires <= now.getTime()) this.tokens.delete(token);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const validationToken = randomBytes(32).toString("base64url");
    const fingerprint = createHmac("sha256", this.key).update(canonical({ binding: this.binding,
      identityReference: this.identityReference, principal, snapshot, draft, minutes: c.minutes,
      zone: this.zone, validationToken, expires })).digest("hex");
    this.tokens.set(validationToken, { principal, snapshot: structuredClone(snapshot), draft, minutes: c.minutes,
      issued: now.getTime(), expires, fingerprint });
    checkStageBudget(signal);
    return { ...s, state: "warning-requires-confirmation", evaluatedAt: now.toISOString(), evaluatedLocal: c.local,
      expiresAt: new Date(expires).toISOString(), businessTimeZone: this.zone, validationToken, fingerprint,
      warnings: [{ code: "STATION_ARRIVAL_LATE", minutes: String(c.minutes) }], confirmationRequired: true, dataSource: "oracle-test" };
  }
  async command(p: PrincipalV1, input: StageArrivalSelectionV1, raw: NativeLateStationCommitV1,
    signal?: AbortSignal): Promise<NativeLateStationReceiptV1> {
    return this.budget(owned => this.execute(p, input, raw, owned), signal);
  }
  private async budget<T>(work: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    // Direct application invocation has the same total budget as HTTP.
    if (!currentRequestBudget()) {
      const abort = new AbortController();
      const relay = () => abort.abort();
      signal?.addEventListener("abort", relay, { once: true });
      if (signal?.aborted) abort.abort();
      const timer = setTimeout(relay, 5000); timer.unref();
      try { return await withRequestBudget(abort.signal, 5000, () => work(abort.signal)); }
      finally { clearTimeout(timer); signal?.removeEventListener("abort", relay); }
    }
    return work(signal);
  }
  private async execute(p: PrincipalV1, input: StageArrivalSelectionV1, raw: NativeLateStationCommitV1,
    signal?: AbortSignal): Promise<NativeLateStationReceiptV1> {
    const { s, principal } = this.admit(p, input, true), cmd = lateCommand(raw);
    checkStageBudget(signal);
    const prep = this.tokens.get(cmd.validationToken), now = this.clock.now();
    if (!prep || prep.fingerprint !== cmd.fingerprint || !same(prep.principal, principal) ||
        !same(prep.draft, cmd.draft) || now.getTime() < prep.issued || now.getTime() >= prep.expires)
      stageFail("STALE_PREPARATION");
    this.eligible(prep.snapshot, now, cmd.draft);
    this.tokens.delete(cmd.validationToken);
    const global = await this.uow.coordinator.consume({ employeeId: s.employeeId,
      operation: "station-arrival-late", commandId: cmd.commandId }, signal);
    this.allowance.consume();
    const result = await this.uow.execute(prep.snapshot, current => {
      this.admit(principal, s, true); checkStageBudget(signal);
      const fresh = this.clock.now();
      if (fresh.getTime() < prep.issued || fresh.getTime() >= prep.expires) stageFail("STALE_PREPARATION");
      const c = this.eligible(current, fresh, cmd.draft);
      if (c.minutes !== prep.minutes || !same(current, prep.snapshot)) stageFail("STALE_PREPARATION");
      return { local: c.local, actor: principal.subject, reasonCode: cmd.draft.lateReasonCode, minutes: c.minutes };
    }, global, signal);
    const a = prep.snapshot.rows.SHF_ATTENDANCE;
    return { ...s, commandId: cmd.commandId, outcome: "oracle-test-committed", dataSource: "oracle-test",
      recorded: { stageArrivalLocal: a?.STAGE_ARRIVAL_TIME ?? null, stationArrivalLocal: result.local, stationExitLocal: null,
        briefing: a?.TADREECH === "1" ? true : a?.TADREECH === "0" ? false : null,
        stationLate: { reasonCode: result.reasonCode, minutes: String(result.minutes), remark: null } },
      commitAcknowledgedAt: result.acknowledged, readBackVerifiedAt: result.verified, replayed: false,
      receiptPersistence: "none", businessTimeZone: this.zone, partnerCompletion: "not-invoked" };
  }
}
