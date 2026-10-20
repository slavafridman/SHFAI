import { randomBytes, randomUUID } from "node:crypto";
import type { Clock } from "./current-shifts-contracts.mts";
import type { StageArrivalAtomicDecisionV1, StageArrivalCommandBindingV1,
  StageArrivalCommandResultV1, StageArrivalContextPort, StageArrivalFactsV1,
  StageArrivalFixtureAuditV1, StageArrivalFixtureTransactionV1, StageArrivalPreparationBindingV1,
  StageArrivalReceiptDraftV1, StageArrivalReceiptStateV1, StageArrivalSelectionV1,
  StageArrivalSourceBindingV1, StageArrivalUnitOfWorkPort, StageArrivalValidationTokenPort } from "./stage-arrival-contracts.mts";
import { facts, sourceBinding } from "./stage-arrival-validation.mts";
import { canonical, same } from "./stage-arrival-domain.mts";
import { StageArrivalError, stageFail, stageProblem } from "./stage-arrival-errors.mts";
import { currentRequestBudget } from "./request-budget-context.mts";

export function checkStageBudget(signal?: AbortSignal) {
  const b = currentRequestBudget();
  if (signal?.aborted || b?.signal.aborted || b && performance.now() >= b.deadline)
    stageFail("DEPENDENCY_TIMEOUT");
}
export class MemoryStageArrivalTokens implements StageArrivalValidationTokenPort {
  private readonly values = new Map<string, StageArrivalPreparationBindingV1>();
  private readonly clock: Clock;
  constructor(clock: Clock) { this.clock = clock; }
  private prune(now = this.clock.now().getTime()) {
    for (const [k, v] of this.values) if (Date.parse(v.expiresAt) <= now) this.values.delete(k);
  }
  issue(binding: StageArrivalPreparationBindingV1) {
    // Reuse validation's one authoritative sample; token allocation does not
    // take a second business-clock reading.
    this.prune(Date.parse(binding.evaluatedAt));
    if (this.values.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    const token = randomBytes(32).toString("base64url");
    this.values.set(token, structuredClone(binding)); return token;
  }
  findAt(token: string, now: Date) {
    this.prune(now.getTime()); return structuredClone(this.values.get(token) ?? null);
  }
  find(token: string) { return this.findAt(token, this.clock.now()); }
  get size() { this.prune(); return this.values.size; }
}
type Terminal = { binding: StageArrivalCommandBindingV1; receipt: StageArrivalReceiptDraftV1;
  audit: StageArrivalFixtureAuditV1; expiresAt: number };
type Snapshot = { rows: StageArrivalFactsV1[]; terminal: Map<string, Terminal> };
// Explicitly isolated fault seam, never loaded from an HTTP request/config.
export type StageArrivalTestFault = (point: "reserved" | "decided" | "staged" | "installed") => void;
export class MemoryStageArrivalStore implements StageArrivalContextPort, StageArrivalUnitOfWorkPort {
  readonly dataSource = "isolated-fixture" as const;
  readonly source: StageArrivalSourceBindingV1;
  private snapshot: Snapshot;
  private readonly active = new Map<string, StageArrivalCommandBindingV1>();
  private readonly clock: Clock;
  private readonly fault?: StageArrivalTestFault;
  constructor(rows: readonly StageArrivalFactsV1[], clock: Clock, fault?: StageArrivalTestFault) {
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > 1000) stageFail("INVALID_SOURCE_DATA");
    for (const row of rows) facts(row);
    const first = rows[0].source;
    if (rows.some(r => !same(r.source, first))) stageFail("INVALID_SOURCE_DATA");
    sourceBinding(first);
    this.source = Object.freeze({ ...first, fixtureSession: randomUUID() });
    this.snapshot = { rows: rows.map(r => ({ ...structuredClone(r), source: { ...this.source } })), terminal: new Map() };
    this.clock = clock; this.fault = fault;
  }
  ownsClock(clock: Clock) { return this.clock === clock; }
  private state(s: StageArrivalSelectionV1, grants: readonly string[]) {
    const rows = this.snapshot.rows.filter(r => r.selection.shiftDayId === s.shiftDayId);
    if (!rows.some(r => same(r.selection, s) && grants.includes(r.orgUnitId))) return { kind: "not-found" } as const;
    if (rows.length !== 1) return { kind: "ambiguous" } as const;
    facts(rows[0]); return { kind: "one", facts: structuredClone(rows[0]) } as const;
  }
  async read(s: StageArrivalSelectionV1, grants: readonly string[]) { return this.state(s, grants); }
  private key(b: StageArrivalCommandBindingV1) {
    return canonical([b.source, b.actor.subject, b.selection, b.command.commandId]);
  }
  private prune(now: number) {
    const terminal = new Map(this.snapshot.terminal);
    for (const [k, v] of terminal) if (v.expiresAt <= now) terminal.delete(k);
    this.snapshot = { ...this.snapshot, terminal };
  }
  private inspect(b: StageArrivalCommandBindingV1): StageArrivalReceiptStateV1 {
    const retained = this.snapshot.terminal.get(this.key(b));
    if (retained) {
      // A changed session/actor/grants must not reveal a prior receipt.
      if (!same(retained.binding, b)) return { kind: "conflict" };
      return { kind: "completed", receipt: { ...structuredClone(retained.receipt), replayed: true } };
    }
    const active = this.active.get(canonical(b.selection));
    if (active) return { kind: same(active, b) ? "in-progress" :
      this.key(active) === this.key(b) ? "conflict" : "in-progress" };
    return { kind: "new" };
  }
  async compareCheckAndCommit(b: StageArrivalCommandBindingV1,
    decide: (t: StageArrivalFixtureTransactionV1) => StageArrivalAtomicDecisionV1,
    signal?: AbortSignal): Promise<StageArrivalCommandResultV1> {
    const resource = canonical(b.selection);
    checkStageBudget(signal);
    if (!same(b.source, this.source)) stageFail("STALE_PREPARATION");
    this.prune(this.clock.now().getTime());
    if (this.active.has(resource)) {
      const previous = this.active.get(resource)!;
      stageFail(this.key(previous) === this.key(b) && !same(previous, b) ? "COMMAND_ID_CONFLICT" : "COMMAND_IN_PROGRESS");
    }
    if (this.active.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
    this.active.set(resource, structuredClone(b));
    let installed = false, staged = false;
    try {
      // Reservation is visible to competing requests. No UI or external I/O
      // occurs while owned; only this bounded microtask scheduling boundary.
      await Promise.resolve();
      checkStageBudget(signal); this.fault?.("reserved"); checkStageBudget(signal);
      const current = this.state(b.selection, b.actor.authorizedTeamIds);
      const result = decide({
        current, clock: this.clock,
        receipts: { inspect: binding => {
          if (!same(binding, b)) stageFail("INTERNAL_ERROR");
          // Ignore our own reservation, but not a retained terminal.
          const terminal = this.snapshot.terminal.get(this.key(b));
          return terminal ? this.inspect(b) : { kind: "new" };
        } },
        audit: { stage: binding => {
          if (!same(binding, b)) stageFail("INTERNAL_ERROR");
          return { subject: b.actor.subject, commandId: b.command.commandId, ...b.selection, outcome: "fixture-committed" };
        } },
      });
      this.fault?.("decided"); checkStageBudget(signal);
      if (result.kind === "reject") return { kind: "problem", problem: result.problem };
      if (result.kind === "replay") return { kind: "receipt", receipt: structuredClone(result.receipt) };
      if (current.kind !== "one" || !same(current.facts, result.expected) ||
          !result.expected.attendance || !same(result.write.attendanceKey, result.expected.attendance.attendanceKey))
        stageFail("STALE_PREPARATION");
      const compareExpected = () => {
        const latest = this.state(b.selection, b.actor.authorizedTeamIds);
        if (latest.kind !== "one" || !same(latest.facts, result.expected)) stageFail("STALE_PREPARATION");
      };
      compareExpected();
      if (this.snapshot.terminal.size >= 1000) stageFail("DEPENDENCY_UNAVAILABLE");
      staged = true;
      const rows = structuredClone(this.snapshot.rows);
      const row = rows.find(r => same(r.selection, b.selection));
      if (!row?.attendance || row.attendance.stageArrivalLocal !== null) stageFail("STALE_PREPARATION");
      const w = result.write, a = row.attendance;
      a.stageArrivalLocal = w.stageArrivalLocal; a.stageArrivalUser = w.stageArrivalUser; a.briefing = false;
      a.stageLateReasonCode = w.stageLate?.reasonCode ?? null;
      a.stageLateMinutes = w.stageLate?.minutes ?? null; a.stageLateRemark = w.stageLate?.remark ?? null;
      row.revision = randomUUID();
      const terminal = new Map(this.snapshot.terminal);
      terminal.set(this.key(b), { binding: structuredClone(b), receipt: structuredClone(result.receipt),
        audit: structuredClone(result.audit), expiresAt: Date.parse(result.receipt.committedAt) + 900000 });
      this.fault?.("staged"); checkStageBudget(signal);
      compareExpected();
      // Only installation point: business row + terminal receipt + audit switch
      // as one snapshot. No independently visible write or rollback callback.
      // Last synchronous guard covers explicit cancellation AND ambient
      // cancellation/deadline, including changes during the final compare.
      checkStageBudget(signal);
      this.snapshot = { rows, terminal }; installed = true;
      this.fault?.("installed"); checkStageBudget(signal);
      return { kind: "receipt", receipt: structuredClone(result.receipt) };
    } catch (e) {
      if (installed) return { kind: "problem", problem: stageProblem(new StageArrivalError("COMMAND_OUTCOME_UNKNOWN"), "fixture") };
      // §40.5: proven pre-install cancellation installed nothing, even if
      // private staging was built. Other staged failures retain rollback proof.
      if (e instanceof StageArrivalError && (!staged || e.code === "DEPENDENCY_TIMEOUT")) throw e;
      return { kind: "problem", problem: stageProblem(new StageArrivalError(
        e instanceof StageArrivalError ? e.code : "INTERNAL_ERROR", staged ? "rolled-back" : "none"), "fixture") };
    } finally { this.active.delete(resource); }
  }
  // Diagnostics for isolated tests/read adapters only; no receipt/status API.
  inspectSnapshot() {
    return { rows: structuredClone(this.snapshot.rows), receipts: this.snapshot.terminal.size,
      audits: this.snapshot.terminal.size, active: this.active.size };
  }
  // Isolated test double control only. Never exposed through runtime or HTTP.
  reviseForIsolatedTest(update: (rows: StageArrivalFactsV1[]) => void) {
    const rows = structuredClone(this.snapshot.rows); update(rows);
    for (const row of rows) {
      facts(row);
      if (!same(row.source, this.source)) stageFail("INVALID_SOURCE_DATA");
    }
    this.snapshot = { ...this.snapshot, rows };
  }
}
