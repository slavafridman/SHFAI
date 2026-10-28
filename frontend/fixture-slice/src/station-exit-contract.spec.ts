import { describe, expect, it } from 'vitest';
import { identity } from './contract';
import { arrivalIdentity } from './stage-arrival-contract';
import { stationIdentity } from './station-arrival-contract';
import { exitIdentity, exitContext, exitValidation, exitCommand, exitReceipt, exitProblem } from './station-exit-contract';
import { nativeExitCapabilities } from './contract';
import { arrivalProblemFixture } from './stage-arrival-fixtures';
import { exitIdentityFixture as principal, exitSelectionFixture as selection, exitContextFixture as context,
  exitValidationFixture as validation, exitCommandFixture as command, exitReceiptFixture as receipt } from './station-exit-fixtures';
describe('§47 exact native exit contract (static synthetic DTOs)', () => {
  it('accepts exact exit10 identity in read views, never grants either arrival mode', () => {
    expect(identity(principal())).toBe(true); expect(exitIdentity(principal())).toBe(true);
    expect(arrivalIdentity(principal())).toBe(false); expect(stationIdentity(principal())).toBe(false);
    const p = principal(); p.principal.capabilities.reverse(); expect(exitIdentity(p)).toBe(false);
    expect(exitIdentity({ ...principal(), dataSource: 'isolated-fixture' })).toBe(false);
    for (const right of nativeExitCapabilities) {
      const p = principal(); p.principal.capabilities = p.principal.capabilities.filter(c => c !== right);
      expect(exitIdentity(p)).toBe(false);
    }
  });
  it.each([null, false, true])('preserves nullable stage and briefing %s', briefing => {
    const c = context(); c.recorded.briefing = briefing;
    expect(exitContext(c, selection())).toBe(true);
    const r = receipt(); r.recorded.briefing = briefing;
    expect(exitReceipt(r, c, command(), validation())).toBe(true);
    r.recorded.stationArrivalLocal = '2026-10-28T09:56:00';
    expect(exitReceipt(r, c, command(), validation())).toBe(false);
  });
  it('renders early, missing station, outside/empty interval and already recorded without granting preparation', () => {
    for (const classification of ['early-manager-decision-deferred', 'outside-window'] as const) {
      const c = context(); c.classification = classification; c.eligibility = 'deferred'; c.withinExitWindow = false;
      expect(exitContext(c, selection())).toBe(true); expect(exitValidation(validation(), c)).toBe(false);
    }
    const c = context(); c.recorded.stationArrivalLocal = null; c.eligibility = 'deferred';
    c.blockers = ['STATION_ARRIVAL_REQUIRED']; expect(exitContext(c, selection())).toBe(true);
    c.eligibility = 'eligible'; c.blockers = []; expect(exitContext(c, selection())).toBe(false);
    const empty = context(); empty.exitWindow.earliestInclusiveAt = '2026-10-28T16:31:00.001Z';
    empty.withinExitWindow = false; empty.classification = 'outside-window'; empty.eligibility = 'deferred';
    expect(exitContext(empty, selection())).toBe(true);
    const done = context(); done.recorded.stationExitLocal = '2026-10-28T17:58:00'; done.eligibility = 'already-recorded';
    expect(exitContext(done, selection())).toBe(true); expect(exitValidation(validation(), done)).toBe(false);
  });
  it.each([null, [], '', 0, { reason: null }, { time: 'now' }, { managerId: '1' }])('rejects nonempty/nonobject draft %j', draft => {
    expect(exitCommand({ ...command(), draft })).toBe(false);
  });
  it('requires exact native consent and receipt ACK+independent readback, not durable/replayed/fixture', () => {
    expect(exitCommand(command())).toBe(true);
    expect(exitCommand({ ...command(), operationConfirmation: { accepted: false } })).toBe(false);
    expect(exitCommand({ ...command(), confirmation: null })).toBe(false);
    expect(exitReceipt(receipt(), context(), command(), validation())).toBe(true);
    for (const changed of [{ committedAt: validation().evaluatedAt }, { replayed: true },
      { dataSource: 'isolated-fixture' }, { receiptPersistence: 'durable' },
      { commandId: crypto.randomUUID() }, { readBackVerifiedAt: '2026-10-28T15:59:04.000Z' }])
      expect(exitReceipt({ ...receipt(), ...changed }, context(), command(), validation())).toBe(false);
    expect(exitReceipt(receipt(), context(), { ...command(), validationToken: 'z'.repeat(43) }, validation())).toBe(false);
    expect(exitReceipt(receipt(), context(), { ...command(), fingerprint: 'd'.repeat(64) }, validation())).toBe(false);
  });
  it('checks validation interval with milliseconds, without deriving a client classification/clock', () => {
    const c = context(), v = validation();
    expect(exitValidation(v, c)).toBe(true);
    v.evaluatedAt = '2026-10-28T15:59:00.000Z'; expect(exitValidation(v, c)).toBe(false);
    v.evaluatedAt = c.exitWindow.latestInclusiveAt; v.evaluatedLocal = '2026-10-28T18:30:00';
    v.expiresAt = '2026-10-28T16:30:00.001Z'; expect(exitValidation(v, c)).toBe(true);
    v.evaluatedAt = '2026-10-28T16:30:00.001Z'; expect(exitValidation(v, c)).toBe(false);
  });
  for (const b of [0, 5]) for (const offset of [-1, 0, 1]) {
    it(`follows server B=${b} classification at exclusive boundary ${offset}ms; does not round it`, () => {
      const c = context(), v = validation();
      const threshold = b === 0 ? '2026-10-28T15:59:00.000Z' : '2026-10-28T15:54:00.000Z';
      c.policy.maxEarlyWholeMinutes = b;
      c.exitWindow.earliestInclusiveAt = new Date(Date.parse(threshold) + 1).toISOString();
      c.serverTime.instant = new Date(Date.parse(threshold) + offset).toISOString();
      c.serverTime.local = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jerusalem',
        dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(c.serverTime.instant)).replace(' ', 'T');
      c.classification = offset <= 0 ? 'early-manager-decision-deferred' : 'ordinary';
      c.withinExitWindow = offset > 0; c.eligibility = offset > 0 ? 'eligible' : 'deferred';
      v.evaluatedAt = c.serverTime.instant; v.evaluatedLocal = c.serverTime.local;
      v.expiresAt = new Date(Date.parse(v.evaluatedAt) + 120000).toISOString();
      expect(exitContext(c, selection())).toBe(true);
      expect(exitValidation(v, c)).toBe(offset > 0);
    });
  }
  it('rejects source/tuple/policy/time and unknown-key corruption before presentation', () => {
    for (const mutate of [(c: any) => c.dataSource = 'oracle',
      (c: any) => c.employeeId = '9002', (c: any) => c.orgUnitId = '0022',
      (c: any) => c.recorded.briefing = 0, (c: any) => c.recorded.actor = 'client',
      (c: any) => c.policy.maxEarlyWholeMinutes = -1, (c: any) => c.policy.maxAfterEndMinutes = 0.1,
      (c: any) => c.serverTime.local = '2026-10-28T18:59:00',
      (c: any) => c.exitWindow.earliestInclusiveAt = '2026-10-28T16:31:00.000Z',
      (c: any) => c.blockers = ['INVENTED']]) {
      const c = context(); mutate(c); expect(exitContext(c, selection())).toBe(false);
    }
  });
  it('existing coherent stage is preserved, and malformed warning/confirmation/expiry is refused', () => {
    const c = context(), r = receipt();
    c.recorded.stageArrivalLocal = '2026-10-28T09:50:00'; r.recorded.stageArrivalLocal = c.recorded.stageArrivalLocal;
    expect(exitContext(c, selection())).toBe(true); expect(exitReceipt(r, c, command(), validation())).toBe(true);
    r.recorded.stageArrivalLocal = null; expect(exitReceipt(r, c, command(), validation())).toBe(false);
    for (const changed of [{ state: 'warning-requires-confirmation' }, { warnings: [{ code: 'LATE' }] },
      { confirmationRequired: true }, { expiresAt: '2026-10-28T16:01:00.002Z' }, { reason: null }])
      expect(exitValidation({ ...validation(), ...changed }, c)).toBe(false);
  });
  it('exit problem is an independent closed allowlist, not arrival warning or late fields', () => {
    const p = arrivalProblemFixture(409, 'STALE_PREPARATION', null, 'rolled-back', 'prepare-again');
    expect(exitProblem(p, 409, null)).toBe(true);
    expect(exitProblem({ ...p, code: 'CONFIRMATION_REQUIRED', type: 'urn:shf:problem:CONFIRMATION_REQUIRED' }, 409, null)).toBe(false);
    expect(exitProblem({ ...p, invalidParameters: [{ name: 'lateReasonCode', reason: 'required' }] }, 409, null)).toBe(false);
    expect(exitProblem({ ...p, effect: 'unknown' }, 409, null)).toBe(false);
    expect(exitProblem(arrivalProblemFixture(503, 'COMMAND_OUTCOME_UNKNOWN', command().commandId, 'unknown', 'reconcile'),
      503, command().commandId)).toBe(true);
  });
});
