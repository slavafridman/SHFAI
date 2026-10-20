import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { StageArrivalActorBindingV1, StageArrivalCommandBindingV1, StageArrivalContextDraftV1,
  StageArrivalFactsV1, StageArrivalPreparationBindingV1, StageArrivalSourceStateV1,
  StageArrivalValidationDraftV1 } from "./stage-arrival-contracts.mts";
import { validatePrincipal } from "./contract-validation.mts";
import { stageArrivalAccessPolicy as policy } from "./access-policy.mts";
import { command, draft, facts, selection } from "./stage-arrival-validation.mts";
import { blockers, classify, fingerprint, same, validateBusiness } from "./stage-arrival-domain.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { checkStageBudget, MemoryStageArrivalStore, MemoryStageArrivalTokens } from "./stage-arrival-memory.mts";

export class StageArrivalApplication {
  private readonly store: MemoryStageArrivalStore;
  private readonly tokens: MemoryStageArrivalTokens;
  private readonly clock: Clock;
  private readonly zone: string;
  constructor(store: MemoryStageArrivalStore, clock: Clock, zone: string) {
    if (!(store instanceof MemoryStageArrivalStore) || store.dataSource !== "isolated-fixture" || !store.ownsClock(clock))
      throw Error("Only process-owned fixture UoW supported");
    this.store = store; this.clock = clock; this.zone = zone;
    this.tokens = new MemoryStageArrivalTokens(clock);
  }
  private admit(principal: unknown, target: unknown, commit = false) {
    try { validatePrincipal(principal); } catch { stageFail("UNAUTHENTICATED"); }
    const s = selection(target);
    if (commit) policy.requireCommit(principal); else policy.requirePrepare(principal);
    const actor: StageArrivalActorBindingV1 = {
      subject: principal.subject, provider: principal.provider, synthetic: principal.synthetic,
      authorizedTeamIds: policy.authorizedTeamIds(principal),
    };
    return { s, actor, p: structuredClone(principal) };
  }
  private resolved(state: StageArrivalSourceStateV1, s: ReturnType<typeof selection>, actor: StageArrivalActorBindingV1) {
    if (state.kind === "not-found") stageFail("SHIFT_DAY_NOT_FOUND");
    if (state.kind === "ambiguous") stageFail("AMBIGUOUS_ATTENDANCE");
    facts(state.facts);
    const f = state.facts;
    if (!same(f.source, this.store.source)) stageFail("INVALID_SOURCE_DATA");
    if (!same(f.selection, s) || !actor.authorizedTeamIds.includes(f.orgUnitId)) stageFail("SHIFT_DAY_NOT_FOUND");
    return f;
  }
  async context(principal: unknown, target: unknown, signal?: AbortSignal): Promise<StageArrivalContextDraftV1> {
    const { s, actor } = this.admit(principal, target);
    checkStageBudget(signal);
    const f = this.resolved(await this.store.read(s, actor.authorizedTeamIds), s, actor);
    checkStageBudget(signal);
    const now = this.clock.now(), c = classify(f, now, this.zone), b = blockers(f), a = f.attendance;
    return { ...s, orgUnitId: f.orgUnitId, planned: structuredClone(f.planned),
      recorded: { stageArrivalLocal: a?.stageArrivalLocal ?? null, stationArrivalLocal: a?.stationArrivalLocal ?? null,
        stationExitLocal: a?.stationExitLocal ?? null, briefing: a?.briefing ?? null },
      serverTime: { instant: now.toISOString(), local: c.local, businessTimeZone: this.zone },
      eligibility: a?.stageArrivalLocal != null ? "already-recorded" : b.length ? "deferred" : "eligible",
      blockers: b, lateReasonOptions: structuredClone(f.lateReasonOptions), dataSource: "isolated-fixture" };
  }
  async validate(principal: unknown, target: unknown, input: unknown, signal?: AbortSignal): Promise<StageArrivalValidationDraftV1> {
    const { s, actor } = this.admit(principal, target), d = draft(input);
    checkStageBudget(signal);
    const f = this.resolved(await this.store.read(s, actor.authorizedTeamIds), s, actor);
    checkStageBudget(signal);
    const now = this.clock.now(), c = validateBusiness(f, d, now, this.zone);
    const expiresAt = new Date(Math.min(now.getTime() + 120000, c.transition)).toISOString();
    const binding: StageArrivalPreparationBindingV1 = {
      source: { ...this.store.source }, actor, facts: f, draft: d,
      evaluatedAt: now.toISOString(), evaluatedLocal: c.local, businessTimeZone: this.zone,
      warnings: c.warnings, confirmationRequired: c.confirmationRequired,
      fingerprint: fingerprint({ source: this.store.source, actor, f, d, zone: this.zone,
        warnings: c.warnings, confirmationRequired: c.confirmationRequired }),
      expiresAt, nextWarningOrMinuteTransitionAt: new Date(c.transition).toISOString(),
    };
    const validationToken = this.tokens.issue(binding);
    return { ...s, state: c.confirmationRequired ? "warning-requires-confirmation" : "ready",
      evaluatedAt: binding.evaluatedAt, evaluatedLocal: c.local, expiresAt, businessTimeZone: this.zone,
      fingerprint: binding.fingerprint, validationToken, warnings: c.warnings,
      confirmationRequired: c.confirmationRequired, dataSource: "isolated-fixture" };
  }
  async commit(principal: unknown, target: unknown, input: unknown, signal?: AbortSignal) {
    const { s, actor, p } = this.admit(principal, target, true), cmd = command(input);
    checkStageBudget(signal);
    const binding: StageArrivalCommandBindingV1 = { source: { ...this.store.source }, actor, selection: s, command: cmd };
    const result = await this.store.compareCheckAndCommit(binding, tx => {
      // Reauthorization and exact ownership before receipt inspection, including
      // on replay. The copied principal cannot change under a user dialog.
      policy.requireCommit(p); checkStageBudget(signal);
      const f = this.resolved(tx.current, s, actor);
      const receipt = tx.receipts.inspect(binding);
      if (receipt.kind === "completed") return { kind: "replay", receipt: receipt.receipt };
      if (receipt.kind === "conflict") stageFail("COMMAND_ID_CONFLICT");
      if (receipt.kind === "in-progress") stageFail("COMMAND_IN_PROGRESS");
      const now = tx.clock.now();
      const prep = this.tokens.findAt(cmd.validationToken, now);
      // Existing arrival has the specified rejection, not a success or a new
      // receipt synthesized from the state.
      if (f.attendance?.stageArrivalLocal != null) stageFail("ALREADY_REGISTERED");
      if (!prep || !same(prep.source, binding.source) || !same(prep.actor, actor) ||
          !same(prep.facts.selection, s) || !same(prep.draft, cmd.draft) ||
          prep.fingerprint !== cmd.fingerprint || prep.businessTimeZone !== this.zone ||
          !same(prep.facts, f)) stageFail("STALE_PREPARATION");
      if (now.getTime() < Date.parse(prep.evaluatedAt) || now.getTime() >= Date.parse(prep.expiresAt))
        stageFail("STALE_PREPARATION");
      const c = validateBusiness(f, cmd.draft, now, this.zone);
      if (!same(c.warnings, prep.warnings) || c.confirmationRequired !== prep.confirmationRequired)
        stageFail("STALE_PREPARATION");
      if (c.confirmationRequired ? cmd.confirmation === null : cmd.confirmation !== null)
        stageFail("CONFIRMATION_REQUIRED");
      const stageLate = c.confirmationRequired && cmd.draft.lateReasonCode !== null
        ? { reasonCode: cmd.draft.lateReasonCode, minutes: c.warnings[0].minutes, remark: cmd.draft.lateRemark } : null;
      const terminal = {
        commandId: cmd.commandId, ...s, outcome: "fixture-committed" as const,
        recorded: { stageArrivalLocal: c.local, briefing: false as const, stageLate },
        committedAt: now.toISOString(), businessTimeZone: this.zone, replayed: false,
        partnerCompletion: "not-invoked" as const, dataSource: "isolated-fixture" as const,
      };
      // Bound success before installation (the HTTP serializer repeats it).
      if (Buffer.byteLength(JSON.stringify(terminal)) > 16384) stageFail("INTERNAL_ERROR");
      checkStageBudget(signal);
      return { kind: "install", expected: f,
        write: { attendanceKey: { shiftDayId: s.shiftDayId }, stageArrivalLocal: c.local,
          stageArrivalUser: p.displayName, briefing: false, stageLate },
        receipt: terminal, audit: tx.audit.stage(binding) };
    }, signal);
    if (result.kind === "problem")
      throw new StageArrivalError(result.problem.code, result.problem.effect);
    // Abort/lost response after installation is UNKNOWN, never a false none.
    try { checkStageBudget(signal); } catch { stageFail("COMMAND_OUTCOME_UNKNOWN"); }
    return result.receipt;
  }
}
