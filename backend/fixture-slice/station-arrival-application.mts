import { randomBytes } from "node:crypto";
import type { Clock } from "./current-shifts-contracts.mts";
import type { StageArrivalActorBindingV1 } from "./stage-arrival-contracts.mts";
import type { StationArrivalCommandBindingV1, StationArrivalContextV1, StationArrivalFactsV1,
  StationArrivalPreparationBindingV1, StationArrivalReceiptV1, StationArrivalSourceStateV1,
  StationArrivalValidationV1 } from "./station-arrival-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { stationArrivalAccessPolicy as policy } from "./access-policy.mts";
import { selection } from "./stage-arrival-validation.mts";
import { stationCommand, stationDraft, stationFacts } from "./station-arrival-validation.mts";
import { stationBlockers, stationBusiness, stationClassify, stationNow } from "./station-arrival-domain.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { checkStageBudget, MemoryStageArrivalStore } from "./stage-arrival-memory.mts";

export class StationArrivalApplication {
  private readonly tokens = new Map<string, StationArrivalPreparationBindingV1>();
  private readonly store: MemoryStageArrivalStore;
  private readonly clock: Clock;
  private readonly zone: string;
  constructor(store: MemoryStageArrivalStore, clock: Clock, zone: string) {
    if (!(store instanceof MemoryStageArrivalStore) || !store.stationEnabled || !store.ownsClock(clock))
      throw Error("Joint process-owned fixture store and Clock required");
    this.store = store; this.clock = clock; this.zone = zone;
  }
  private admit(principal: unknown, target: unknown, commit = false) {
    try { validatePrincipal(principal); } catch { stageFail("UNAUTHENTICATED"); }
    const s = selection(target);
    if (commit) policy.requireCommit(principal); else policy.requirePrepare(principal);
    const actor: StageArrivalActorBindingV1 = { subject: principal.subject, provider: principal.provider,
      synthetic: principal.synthetic, authorizedTeamIds: policy.authorizedTeamIds(principal) };
    return { s, actor, p: structuredClone(principal) };
  }
  private resolved(state: StationArrivalSourceStateV1, s: ReturnType<typeof selection>, actor: StageArrivalActorBindingV1) {
    if (state.kind === "not-found") stageFail("SHIFT_DAY_NOT_FOUND");
    if (state.kind === "ambiguous") stageFail("AMBIGUOUS_ATTENDANCE");
    const f = state.facts; stationFacts(f);
    if (!same(f.base.source, this.store.source)) stageFail("INVALID_SOURCE_DATA");
    if (!same(f.base.selection, s) || !actor.authorizedTeamIds.includes(f.base.orgUnitId)) stageFail("SHIFT_DAY_NOT_FOUND");
    return f;
  }
  private prune(now: Date) {
    for (const [key, value] of this.tokens) if (Date.parse(value.expiresAt) <= now.getTime()) this.tokens.delete(key);
  }
  async context(principal: unknown, target: unknown, signal?: AbortSignal): Promise<StationArrivalContextV1> {
    const { s, actor } = this.admit(principal, target); checkStageBudget(signal);
    const f = this.resolved(await this.store.station.read(s, actor.authorizedTeamIds), s, actor);
    checkStageBudget(signal);
    const now = stationNow(this.clock), c = stationClassify(f.base, now, this.zone), b = stationBlockers(f), a = f.base.attendance;
    if (a?.stageArrivalLocal && !a.stationArrivalLocal && a.stageArrivalLocal > c.local) stageFail("INVALID_SOURCE_DATA");
    return { ...s, orgUnitId: f.base.orgUnitId, planned: structuredClone(f.base.planned),
      recorded: { stageArrivalLocal: a?.stageArrivalLocal ?? null, stationArrivalLocal: a?.stationArrivalLocal ?? null,
        stationExitLocal: a?.stationExitLocal ?? null, briefing: a?.briefing ?? null },
      serverTime: { instant: now.toISOString(), local: c.local, businessTimeZone: this.zone },
      arrivalWindow: c.arrivalWindow, withinArrivalWindow: c.withinArrivalWindow,
      eligibility: a?.stationArrivalLocal != null ? "already-recorded" : b.length ? "deferred" : "eligible",
      blockers: b, lateReasonOptions: structuredClone(f.base.lateReasonOptions), dataSource: "isolated-fixture" };
  }
  async validate(principal: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<StationArrivalValidationV1> {
    const { s, actor } = this.admit(principal, target), d = stationDraft(input); checkStageBudget(signal);
    const f = this.resolved(await this.store.station.read(s, actor.authorizedTeamIds), s, actor);
    checkStageBudget(signal);
    const now = stationNow(this.clock), c = stationBusiness(f, d, now, this.zone);
    this.prune(now);
    if (this.tokens.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const binding: StationArrivalPreparationBindingV1 = {
      operation: "station-arrival", source: { ...this.store.source }, actor, facts: f, draft: d,
      evaluatedAt: now.toISOString(), evaluatedLocal: c.local, businessTimeZone: this.zone,
      warnings: c.warnings, confirmationRequired: c.confirmationRequired,
      fingerprint: fingerprint({ operation: "station-arrival", source: this.store.source, actor, f, d,
        zone: this.zone, warnings: c.warnings, confirmationRequired: c.confirmationRequired }),
      expiresAt: new Date(Math.min(now.getTime() + 120000, c.transition)).toISOString(),
      nextWarningOrMinuteTransitionAt: new Date(c.transition).toISOString(),
    };
    const validationToken = randomBytes(32).toString("base64url");
    this.store.reservePreparation(validationToken, binding.expiresAt, binding.evaluatedAt);
    this.tokens.set(validationToken, structuredClone(binding));
    return { ...s, state: c.confirmationRequired ? "warning-requires-confirmation" : "ready",
      evaluatedAt: binding.evaluatedAt, evaluatedLocal: c.local, expiresAt: binding.expiresAt,
      businessTimeZone: this.zone, fingerprint: binding.fingerprint, validationToken,
      warnings: c.warnings, confirmationRequired: c.confirmationRequired, dataSource: "isolated-fixture" };
  }
  async commit(principal: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<StationArrivalReceiptV1> {
    const { s, actor, p } = this.admit(principal, target, true), cmd = stationCommand(input);
    checkStageBudget(signal);
    const b: StationArrivalCommandBindingV1 = { operation: "station-arrival", source: { ...this.store.source },
      actor, selection: s, command: cmd };
    const result = await this.store.station.compareCheckAndCommit(b, tx => {
      policy.requireCommit(p); checkStageBudget(signal);
      const f: StationArrivalFactsV1 = this.resolved(tx.current, s, actor);
      const retained = tx.receipts.inspect(b);
      if (retained.kind === "completed") return { kind: "replay", receipt: retained.receipt };
      if (retained.kind === "conflict") stageFail("COMMAND_ID_CONFLICT");
      if (retained.kind === "in-progress") stageFail("COMMAND_IN_PROGRESS");
      const now = stationNow(tx.clock); this.prune(now);
      const prep = this.tokens.get(cmd.validationToken);
      if (f.base.attendance?.stationArrivalLocal != null) stageFail("ALREADY_REGISTERED");
      if (!prep || prep.operation !== "station-arrival" || !same(prep.source, b.source) ||
          !same(prep.actor, actor) || !same(prep.facts, f) || !same(prep.draft, cmd.draft) ||
          prep.fingerprint !== cmd.fingerprint || prep.businessTimeZone !== this.zone ||
          now.getTime() < Date.parse(prep.evaluatedAt) || now.getTime() >= Date.parse(prep.expiresAt))
        stageFail("STALE_PREPARATION");
      const c = stationBusiness(f, cmd.draft, now, this.zone);
      if (!same(c.warnings, prep.warnings) || c.confirmationRequired !== prep.confirmationRequired) stageFail("STALE_PREPARATION");
      if (c.confirmationRequired ? cmd.confirmation === null : cmd.confirmation !== null) stageFail("CONFIRMATION_REQUIRED");
      const stationLate = c.confirmationRequired && cmd.draft.lateReasonCode !== null
        ? { reasonCode: cmd.draft.lateReasonCode, minutes: c.warnings[0].minutes, remark: null } : null;
      const receipt: StationArrivalReceiptV1 = { commandId: cmd.commandId, ...s, outcome: "fixture-committed",
        recorded: { stageArrivalLocal: f.base.attendance?.stageArrivalLocal ?? null, stationArrivalLocal: c.local,
          stationExitLocal: null, briefing: f.base.attendance?.briefing ?? null, stationLate },
        committedAt: now.toISOString(), businessTimeZone: this.zone, replayed: false,
        partnerCompletion: "not-invoked", dataSource: "isolated-fixture" };
      if (Buffer.byteLength(JSON.stringify(receipt)) > 16384) stageFail("INTERNAL_ERROR");
      checkStageBudget(signal);
      return { kind: "install", expected: f, write: { attendanceKey: { shiftDayId: s.shiftDayId },
        stationArrivalLocal: c.local, stationArrivalUser: actor.subject, stationLate },
        receipt, audit: tx.audit.stage(b) };
    }, signal);
    if (result.kind === "problem") throw new StageArrivalError(result.problem.code, result.problem.effect);
    return result.receipt;
  }
}
