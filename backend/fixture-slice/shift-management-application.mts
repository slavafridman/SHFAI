import type { PrincipalV1 } from "./contracts.mts";
import type { Clock } from "./current-shifts-contracts.mts";
import type { CsvShiftCommandV1, CsvShiftEncodingV1, CsvShiftPreviewV1, CsvShiftPreviewRowV1,
  ShiftAdmissionReferenceV1, ShiftCommandAdmission, ShiftCommandUnitOfWork,
  ShiftManagementAccessPolicy, ShiftManagementApplicationPort, ShiftManagementContextV1,
  ShiftPreparationV1, ShiftCommandV1, ShiftDraftV1, ShiftReceiptV1, ShiftSelectionV1,
  ShiftSnapshotPort, ShiftConsumedAdmissionV1, ShiftRecordedEffectV1 } from "./shift-management-contracts.mts";
import type { ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan, ShiftSnapshot, ShiftPlan } from "./shift-management-model.mts";
import { freezeShift, validateShiftSnapshot } from "./shift-management-model.mts";
import { assertShiftWorkAllowed, shiftIntervalsConflict, validateShiftDurationPolicy, validateShiftInterval } from "./shift-management-domain.mts";
import { changedOverlay, effectiveShift, planShifts, shiftBlockers, shiftDay, snapshotPartnerPort } from "./shift-management-rules.mts";
import { parseShiftCsv } from "./shift-management-csv.mts";
import type { ParsedShiftCsv } from "./shift-management-csv.mts";
import { parseCsvShiftCommand, parseShiftCommand, parseShiftDraft, parseShiftSelection } from "./shift-management-validation.mts";
import { ShiftManagementError, ShiftUowRejection, shiftFail, shiftProblem, shiftUnknown } from "./shift-management-errors.mts";
import { civil, fingerprint, instantFor, same } from "./stage-arrival-domain.mts";

type Uow = ShiftCommandUnitOfWork<ShiftSnapshot, ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan>;
interface Prepared {
  snapshot: ShiftSnapshot; plan: ShiftPlan; digest: string; fingerprint: string; expiresAt: string;
  actor: PrincipalV1; authGeneration: string;
}
export class ShiftManagementApplication implements ShiftManagementApplicationPort {
  readonly reference: Readonly<ShiftAdmissionReferenceV1>;
  private readonly snapshots: ShiftSnapshotPort<ShiftSnapshot>;
  private readonly uow: Uow;
  private readonly admission: ShiftCommandAdmission;
  private readonly policy: ShiftManagementAccessPolicy;
  private readonly clock: Clock;
  private readonly zone: string;
  private readonly generation: () => string;
  private readonly selectedScope: { employeeId: string; orgUnitId: string } | undefined;
  private readonly csvIdentity: {
    read(p: PrincipalV1, employeeId: string, signal?: AbortSignal): Promise<string>;
    snapshot(p: PrincipalV1, selection: ShiftSelectionV1, fullNumber: string, signal?: AbortSignal): Promise<ShiftSnapshot>;
  } | undefined;
  private readonly preparations = new Map<string, Prepared>();
  private readonly quarantined = new Set<string>();
  private readonly commands = new Map<string, { digest: string; active: boolean }>();
  // Backend-private transport hook. No public reset/reconcile endpoint exists.
  quarantineTransport(employeeId: string): void { this.quarantined.add(employeeId); }
  get businessTimeZone(): string { return this.zone; }
  constructor(options: {
    snapshots: ShiftSnapshotPort<ShiftSnapshot>; uow: Uow; admission: ShiftCommandAdmission;
    policy: ShiftManagementAccessPolicy; clock: Clock; businessTimeZone: string; authGeneration: () => string;
    csvIdentity?: ShiftManagementApplication["csvIdentity"];
    selectedScope?: { employeeId: string; orgUnitId: string };
  }) {
    if (!same(options.snapshots.reference, options.uow.reference) ||
        !same(options.snapshots.reference, options.admission.reference))
      throw Error("Management port references must match");
    new Intl.DateTimeFormat("en", { timeZone: options.businessTimeZone });
    this.reference = freezeShift(structuredClone(options.admission.reference));
    this.snapshots = options.snapshots; this.uow = options.uow; this.admission = options.admission;
    this.policy = options.policy; this.clock = options.clock; this.zone = options.businessTimeZone;
    this.generation = options.authGeneration;
    this.csvIdentity = options.csvIdentity;
    this.selectedScope = options.selectedScope ? Object.freeze({ ...options.selectedScope }) : undefined;
  }
  private now(signal?: AbortSignal): Date {
    assertShiftWorkAllowed(signal);
    const now = this.clock.now();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) shiftFail("INVALID_SOURCE_DATA");
    return now;
  }
  private scoped(p: PrincipalV1, snapshot: ShiftSnapshot, employeeId: string): void {
    validateShiftSnapshot(snapshot, this.reference, employeeId);
    validateShiftDurationPolicy(snapshot.policy);
    if (!this.policy.authorizedTeamIds(p).includes(snapshot.employee.orgUnitId)) shiftFail("SHIFT_DAY_NOT_FOUND");
    if (Date.parse(snapshot.validUntil) <= this.now().getTime()) shiftFail("DEPENDENCY_TIMEOUT");
  }
  private async read(p: PrincipalV1, selection: ShiftSelectionV1, signal?: AbortSignal): Promise<ShiftSnapshot> {
    this.policy.requirePrepare(p); this.now(signal);
    if (this.selectedScope && (selection.employeeId !== this.selectedScope.employeeId ||
        !this.policy.authorizedTeamIds(p).includes(this.selectedScope.orgUnitId))) shiftFail("SHIFT_DAY_NOT_FOUND");
    const snapshot = await this.snapshots.read(selection, signal);
    this.now(signal); this.scoped(p, snapshot, selection.employeeId);
    return snapshot;
  }
  async context(p: PrincipalV1, input: ShiftSelectionV1, signal?: AbortSignal): Promise<ShiftManagementContextV1> {
    this.policy.requirePrepare(p);
    const selection = parseShiftSelection(input);
    const snapshot = await this.read(p, selection, signal), now = this.now(signal);
    const day = selection.shiftDayId === null ? null : shiftDay(snapshot, selection.shiftDayId);
    const selected = day ? effectiveShift(snapshot, day) : null;
    const blockers = shiftBlockers(snapshot, day);
    // Eligibility is advisory. Preparation always reloads/revalidates all facts.
    if (selected?.status !== "cancelled" && selected) {
      try { validateShiftInterval(selected, { minimumMinutes: 1, maximumMinutes: 9999999999,
        gapMinutes: snapshot.policy.gapMinutes }, now, this.zone, signal); }
      catch (error) {
        if (!(error instanceof ShiftManagementError) || error.code !== "BUSINESS_VALIDATION_FAILED") throw error;
        blockers.push(...(error.details.ruleViolations ?? []).map(rule => rule.code));
      }
    }
    const common = {
      contractVersion: "49-v0.1" as const, employeeId: selection.employeeId,
      employee: { firstName: snapshot.employee.firstName, lastName: snapshot.employee.lastName,
        orgUnitId: snapshot.employee.orgUnitId }, selected,
      eligibility: selected?.status === "cancelled" ? "already-cancelled" as const :
        blockers.length ? "deferred" as const : "supported" as const,
      blockers: [...new Set(blockers)], siteId: snapshot.employee.siteIds[0],
      activityOptions: structuredClone(snapshot.activityOptions),
      startEndReasonOptions: structuredClone(snapshot.startEndReasonOptions),
      cancelReasonOptions: structuredClone(snapshot.cancelReasonOptions),
      workLocationOptions: snapshot.employee.workFromHome === "1" ?
        ["home" as const, "site" as const] : ["site" as const],
      limits: { csvBytes: 1048576 as const, csvRows: 100 as const, atomicApply: true as const },
      serverTime: { instant: now.toISOString(), local: civil(now, this.zone) }, businessTimeZone: this.zone,
    };
    return this.reference.mode === "isolated-fixture" ?
      { ...common, mode: "isolated-fixture", dataSource: "isolated-fixture" } :
      { ...common, mode: "test-oracle-controlled", dataSource: "oracle-test" };
  }
  private async retain(p: PrincipalV1, snapshot: ShiftSnapshot, plan: ShiftPlan, signal?: AbortSignal) {
    const now = this.now(signal);
    for (const [token, prepared] of this.preparations)
      if (Date.parse(prepared.expiresAt) <= now.getTime()) this.preparations.delete(token);
    if (this.preparations.size >= 1000) shiftFail("DEPENDENCY_UNAVAILABLE");
    const expires = Math.min(now.getTime() + 120000, Date.parse(snapshot.validUntil),
      ...plan.effects.map(effect => instantFor(effect.before?.startLocal ?? effect.after.startLocal, this.zone)));
    if (expires <= now.getTime()) shiftFail("STALE_PREPARATION");
    const digest = fingerprint({ snapshot, plan, zone: this.zone }), authGeneration = this.generation();
    const preparation = await this.admission.prepare({ reference: this.reference, kind: plan.kind,
      employeeId: snapshot.employee.employeeId, principal: p, authGeneration,
      authorizedTeamIds: this.policy.authorizedTeamIds(p), planDigest: digest,
      snapshotRevision: fingerprint(snapshot), expiresAt: new Date(expires).toISOString(),
      effects: plan.effects }, signal);
    this.preparations.set(preparation.validationToken, freezeShift(structuredClone({
      snapshot, plan, digest, fingerprint: preparation.fingerprint,
      expiresAt: preparation.expiresAt, actor: p, authGeneration,
    })));
    return preparation;
  }
  async prepare(p: PrincipalV1, employeeId: string, input: ShiftDraftV1,
    signal?: AbortSignal): Promise<ShiftPreparationV1> {
    this.policy.requirePrepare(p);
    if (this.quarantined.has(employeeId)) shiftFail("COMMAND_SCOPE_DEFERRED");
    const draft = parseShiftDraft(input), selection = parseShiftSelection({
      employeeId, shiftDayId: draft.kind === "create" ? null : draft.shiftDayId,
    });
    const snapshot = await this.read(p, selection, signal);
    const plan = planShifts(snapshot, [{ row: 1, draft, overnight: false }], p, this.now(signal), this.zone, signal);
    const prep = await this.retain(p, snapshot, plan, signal);
    const effect = plan.effects[0];
    if (!effect) shiftFail("INVALID_SOURCE_DATA");
    return { contractVersion: "49-v0.1", employeeId, ...prep, effects: [structuredClone(effect)],
      businessTimeZone: this.zone, dataSource: this.reference.dataSource };
  }
  async previewCsv(p: PrincipalV1, employeeId: string, bytes: Uint8Array, encoding: CsvShiftEncodingV1,
    signal?: AbortSignal): Promise<CsvShiftPreviewV1> {
    this.policy.requireCsvPreview(p);
    if (this.quarantined.has(employeeId)) shiftFail("COMMAND_SCOPE_DEFERRED");
    const selection = parseShiftSelection({ employeeId, shiftDayId: null });
    let snapshot: ShiftSnapshot;
    let parsed: ParsedShiftCsv;
    if (this.reference.mode === "test-oracle-controlled") {
      if (!this.csvIdentity) shiftFail("LIVE_WRITES_DISABLED");
      const number = await this.csvIdentity.read(p, employeeId, signal);
      parsed = parseShiftCsv(bytes, encoding, number, signal);
      if (parsed.rows.every(row => row.draft === null))
        return { contractVersion: "49-v0.1", employeeId, encoding, dataSource: "oracle-test",
          businessTimeZone: this.zone, state: "invalid", previewToken: null, fingerprint: null, expiresAt: null,
          rows: parsed.rows.map(row => ({ line: row.line, effect: null, errors: row.errors })) };
      snapshot = await this.csvIdentity.snapshot(p, selection, number, signal);
      this.scoped(p, snapshot, employeeId);
      if (snapshot.employee.employeeNumber !== number) shiftFail("STALE_PREPARATION");
    } else {
      snapshot = await this.read(p, selection, signal);
      parsed = parseShiftCsv(bytes, encoding, snapshot.employee.employeeNumber, signal);
    }
    const now = this.now(signal);
    const rows: CsvShiftPreviewRowV1[] = [];
    const entries = [];
    for (const row of parsed.rows) {
      const result: CsvShiftPreviewRowV1 = { line: row.line, effect: null, errors: structuredClone(row.errors) };
      rows.push(result);
      if (!row.draft) continue;
      const entry = { row: row.line, draft: row.draft, overnight: row.warningCodes.includes("OVERNIGHT_NORMALIZED") };
      entries.push(entry);
      try { result.effect = planShifts(snapshot, [entry], p, now, this.zone, signal, "csv-row").effects[0]; }
      catch (error) {
        if (!(error instanceof ShiftManagementError) || error.code !== "BUSINESS_VALIDATION_FAILED") throw error;
        result.errors.push(...(error.details.ruleViolations ?? []).map(violation =>
          ({ column: "row" as const, code: violation.code })));
      }
    }
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      assertShiftWorkAllowed(signal);
      const a = rows[i], b = rows[j];
      if (a.effect && b.effect && shiftIntervalsConflict(a.effect.after, b.effect.after, snapshot.policy.gapMinutes))
        for (const row of [a, b]) if (!row.errors.some(error => error.code === "SHIFT_OVERLAP_OR_GAP"))
          row.errors.push({ column: "row", code: "SHIFT_OVERLAP_OR_GAP" });
    }
    const common = { contractVersion: "49-v0.1" as const, employeeId, encoding, rows,
      businessTimeZone: this.zone, dataSource: this.reference.dataSource };
    if (rows.some(row => row.errors.length)) {
      for (const row of rows) if (row.errors.length) row.effect = null;
      return { ...common, state: "invalid", previewToken: null, fingerprint: null, expiresAt: null };
    }
    const effects = rows.flatMap(row => row.effect ? [row.effect] : []);
    if (effects.length !== rows.length || entries.length !== rows.length) shiftFail("INVALID_SOURCE_DATA");
    // A privately reviewed obligation decision binds the WHOLE normalized
    // file, never each isolated row or a partial-success subset.
    if (snapshotPartnerPort(snapshot).assess({ kind: "csv-create", effects }).state !== "not-required") {
      for (const row of rows) { row.effect = null; row.errors.push({ column: "row", code: "PARTNER_REQUIRED_OR_UNKNOWN" }); }
      return { ...common, state: "invalid", previewToken: null, fingerprint: null, expiresAt: null };
    }
    const prep = await this.retain(p, snapshot, { kind: "csv-create", entries, effects }, signal);
    return { ...common, state: "ready", previewToken: prep.validationToken,
      fingerprint: prep.fingerprint, expiresAt: prep.expiresAt };
  }
  async command(p: PrincipalV1, employeeId: string, input: ShiftCommandV1,
    signal?: AbortSignal): Promise<ShiftReceiptV1> {
    this.policy.requirePrepare(p);
    if (this.quarantined.has(employeeId)) shiftFail("COMMAND_SCOPE_DEFERRED");
    const command = parseShiftCommand(input);
    this.policy.requireCommand(p, command.draft.kind);
    const requestDigest = this.checkCommand(p, employeeId, command.commandId, command);
    const prepared = this.preparations.get(command.validationToken);
    if (!prepared || prepared.plan.kind !== command.draft.kind ||
        !same(prepared.plan.entries[0]?.draft, command.draft)) shiftFail("STALE_PREPARATION");
    return this.execute(p, employeeId, command.commandId, command.validationToken, command.fingerprint,
      command.operationConfirmation, command.acknowledgedWarningCodes, prepared, requestDigest, signal);
  }
  async commandCsv(p: PrincipalV1, employeeId: string, input: CsvShiftCommandV1,
    signal?: AbortSignal): Promise<ShiftReceiptV1> {
    this.policy.requireCommand(p, "csv-create");
    if (this.quarantined.has(employeeId)) shiftFail("COMMAND_SCOPE_DEFERRED");
    const command = parseCsvShiftCommand(input), prepared = this.preparations.get(command.previewToken);
    const requestDigest = this.checkCommand(p, employeeId, command.commandId, command);
    if (!prepared || prepared.plan.kind !== "csv-create") shiftFail("STALE_PREPARATION");
    return this.execute(p, employeeId, command.commandId, command.previewToken, command.fingerprint,
      command.operationConfirmation, command.acknowledgedWarningCodes, prepared, requestDigest, signal);
  }
  private async execute(p: PrincipalV1, employeeId: string, commandId: string, validationToken: string,
    fingerprintValue: string, operationConfirmation: { accepted: true },
    acknowledgedWarningCodes: ShiftCommandV1["acknowledgedWarningCodes"], prepared: Prepared, requestDigest: string,
    signal?: AbortSignal): Promise<ShiftReceiptV1> {
    parseShiftSelection({ employeeId, shiftDayId: null });
    this.now(signal);
    if (employeeId !== prepared.snapshot.employee.employeeId || !same(p, prepared.actor) ||
        this.generation() !== prepared.authGeneration || Date.parse(prepared.expiresAt) <= this.now(signal).getTime())
      shiftFail("STALE_PREPARATION");
    const attempt = await this.admission.consume({
      reference: this.reference, kind: prepared.plan.kind, employeeId, principal: p,
      authGeneration: this.generation(), authorizedTeamIds: this.policy.authorizedTeamIds(p),
      commandId, validationToken, fingerprint: fingerprintValue, planDigest: prepared.digest,
      operationConfirmation, acknowledgedWarningCodes,
    }, signal);
    this.commands.set(commandId, { digest: requestDigest, active: true });
    this.preparations.delete(validationToken);
    const selection = { employeeId, shiftDayId: prepared.plan.entries[0].draft.kind === "create" ?
      null : prepared.plan.entries[0].draft.shiftDayId };
    let expected: ShiftSnapshot | undefined;
    let recorded: ShiftRecordedEffectV1[] = [];
    let acknowledged = false;
    try {
      const ack = await this.uow.run({ ...selection, admission: attempt }, async locked => {
        const snapshot = await locked.readLockedSnapshot();
        this.scoped(p, snapshot, employeeId);
        if (!same(snapshot, prepared.snapshot) || this.generation() !== prepared.authGeneration)
          shiftFail("STALE_PREPARATION");
        const now = this.now(signal);
        const plan = planShifts(snapshot, prepared.plan.entries, p, now, this.zone, signal);
        if (!same(plan, prepared.plan)) shiftFail("STALE_PREPARATION");
        expected = structuredClone(snapshot);
        const guard = () => {
          this.now(signal);
          if (Date.parse(prepared.expiresAt) <= this.now(signal).getTime() ||
              this.generation() !== prepared.authGeneration) shiftFail("STALE_PREPARATION");
        };
        const one = (count: number | undefined) => {
          if (count === 0) shiftFail("STALE_PREPARATION");
          if (count !== 1) shiftFail("INVALID_SOURCE_DATA");
        };
        recorded = [];
        for (let i = 0; i < plan.entries.length; i++) {
          const entry = plan.entries[i], effect = plan.effects[i], draft = entry.draft;
          if (draft.kind === "create") {
            guard(); const id = await locked.nextDayId(); guard();
            if (!/^[1-9][0-9]{0,9}$/.test(id) || expected.days.some(day => day.baseline.shiftDayId === id))
              shiftFail("INVALID_SOURCE_DATA");
            const day = { shiftDayId: id, employeeNumber: snapshot.employee.employeeNumber.slice(0, 8),
              dateLocal: draft.startLocal.slice(0, 10) + "T00:00:00", dayType: "4",
              startLocal: draft.startLocal, endLocal: draft.endLocal,
              dayStartLocal: draft.startLocal, dayEndLocal: draft.endLocal, activityCode: draft.activityCode,
              siteId: effect.after.siteId, paidMinutes: effect.after.paidMinutes, workMinutes: effect.after.workMinutes,
              workFromHome: draft.workLocation === "home" ? "Y" : "N", splitShift: "N",
              switchDayId: null, exceptionType: null, timeoffType: null, source: "fExtra",
              remark: draft.remark, preserved: Object.fromEntries(Object.entries(snapshot.nativeFacts?.baselineDefaults ?? {})
                .filter(([key]) => key !== "WM_EXCEPTION_TYPE_ID" && key !== "WM_TIMEOFF_TYPE_ID")) };
            guard(); one(await locked.insertDay({ day }));
            expected.days.push({ baseline: day, overlay: null, attendance: null });
            recorded.push({ ...effect, after: { ...effect.after, shiftDayId: id } });
          } else {
            const day = shiftDay(expected, draft.shiftDayId);
            if (day.baseline.source === "WFM") {
              const original = structuredClone(day.baseline);
              guard(); one(await locked.markSource({ dayId: draft.shiftDayId, original, from: "WFM", to: "SHF" }));
              day.baseline.source = "SHF";
            }
            const overlay = changedOverlay(day, draft, effect, p.subject, now, this.zone, snapshot.nativeFacts?.overlayDefaults);
            const overlayPlan = { dayId: draft.shiftDayId, before: structuredClone(day.overlay), after: overlay };
            guard();
            one(await (day.overlay === null ? locked.insertOverlay(overlayPlan) : locked.updateOverlay(overlayPlan)));
            day.overlay = overlay;
            recorded.push({ ...effect, after: { ...effect.after, shiftDayId: draft.shiftDayId } });
          }
        }
        expected.days.sort((a, b) => BigInt(a.baseline.shiftDayId) < BigInt(b.baseline.shiftDayId) ? -1 :
          BigInt(a.baseline.shiftDayId) > BigInt(b.baseline.shiftDayId) ? 1 : 0);
        guard();
        return structuredClone(recorded);
      }, signal);
      acknowledged = true;
      this.now(signal);
      if (!expected || !same(ack.effects, recorded) ||
          !Number.isFinite(Date.parse(ack.commitAcknowledgedAt))) throw shiftUnknown();
      const readback = await this.snapshots.read(selection, signal);
      this.now(signal); this.scoped(p, readback, employeeId);
      if (!same(readback, expected)) throw shiftUnknown();
      const common = { contractVersion: "49-v0.1" as const, commandId, employeeId,
        kind: prepared.plan.kind, effects: structuredClone(recorded),
        commitAcknowledgedAt: ack.commitAcknowledgedAt, readBackVerifiedAt: this.now(signal).toISOString(),
        businessTimeZone: this.zone, replayed: false as const, receiptPersistence: "none" as const,
        partnerCompletion: "not-invoked" as const };
      if (Date.parse(common.readBackVerifiedAt) < Date.parse(common.commitAcknowledgedAt)) throw shiftUnknown();
      const receipt: ShiftReceiptV1 = this.reference.mode === "isolated-fixture" ?
        { ...common, outcome: "fixture-committed", dataSource: "isolated-fixture" } :
        { ...common, outcome: "oracle-test-committed", dataSource: "oracle-test" };
      await this.admission.finish(attempt, { kind: "verified", receipt });
      return receipt;
    } catch (error) {
      // Only an owning UoW's explicit proof can establish ordinary rollback.
      // Any generic failure or uncertainty after ACK becomes UNKNOWN.
      const problem = shiftProblem(error, "backend-private", commandId);
      if (acknowledged || signal?.aborted || !(error instanceof ShiftUowRejection) || problem.effect === "unknown") {
        await this.finishUnknown(attempt, commandId); throw shiftUnknown();
      }
      try { await this.admission.finish(attempt, { kind: "rejected", problem }); }
      catch { await this.finishUnknown(attempt, commandId); throw shiftUnknown(); }
      throw error;
    } finally {
      const retained = this.commands.get(commandId);
      if (retained) retained.active = false;
    }
  }
  private checkCommand(p: PrincipalV1, employeeId: string, commandId: string, command: ShiftCommandV1 | CsvShiftCommandV1) {
    const digest = fingerprint({ p, employeeId, command });
    const prior = this.commands.get(commandId);
    if (!prior) return digest;
    if (prior.digest !== digest) shiftFail("COMMAND_ID_CONFLICT");
    shiftFail(prior.active ? "COMMAND_IN_PROGRESS" : "COMMAND_SCOPE_DEFERRED");
  }
  private async finishUnknown(attempt: ShiftConsumedAdmissionV1, commandId: string) {
    this.quarantined.add(attempt.employeeId);
    const problem = shiftProblem(shiftUnknown(), "backend-private", commandId);
    if (problem.effect !== "unknown") throw shiftUnknown();
    try { await this.admission.finish(attempt, { kind: "unknown", problem }); }
    catch { throw shiftUnknown(); } // Never return success or release quarantine on settlement failure.
  }
}
