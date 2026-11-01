import { describe, it, expect } from 'vitest';
import { cancellationWorld } from './station-exit-cancellation-fixtures';
import { cancellationIdentity, cancellationContext, cancellationValidation, cancellationCommand,
  cancellationDraft, cancellationReceipt, cancellationProblem } from './station-exit-cancellation-contract';
describe('U52 canonical source guards', () => {
  for (const native of [false, true]) {
    const w = cancellationWorld(native);
    it(`accepts exact ${native ? 'typed native protocol' : 'fixture'} DTOs`, () => {
      expect(cancellationIdentity(w.identity)).toBe(true);
      expect(cancellationContext(w.context, w.selection)).toBe(true);
      expect(cancellationValidation(w.validation, w.context)).toBe(true);
      expect(cancellationCommand(w.command)).toBe(true);
      expect(cancellationReceipt(w.receipt, w.context, w.command, w.validation)).toBe(true);
    });
    it(`rejects mixed sources, unsolicited fields and resource drift ${native}`, () => {
      expect(cancellationContext({ ...w.context, dataSource: native ? 'isolated-fixture' : 'oracle-test' }, w.selection)).toBe(false);
      expect(cancellationContext({ ...w.context, exitWindow: {} }, w.selection)).toBe(false);
      expect(cancellationContext(w.context, { ...w.selection, employeeId: '9999' })).toBe(false);
      expect(cancellationReceipt({ ...w.receipt, dataSource: native ? 'isolated-fixture' : 'oracle-test' }, w.context, w.command, w.validation)).toBe(false);
    });
    it(`requires original and all preserved public values ${native}`, () => {
      for (const patch of [{ originalExitLocal: null }, { recorded: { ...w.receipt.recorded, briefing: false } },
        { recorded: { ...w.receipt.recorded, stationArrivalLocal: null } }, { replayed: true }, { partnerCompletion: 'completed' }]) {
        expect(cancellationReceipt({ ...w.receipt, ...patch }, w.context, w.command, w.validation)).toBe(false);
      }
      expect(cancellationReceipt({ ...w.receipt, commitAcknowledgedAt: native ? null : w.validation.evaluatedAt }, w.context, w.command, w.validation)).toBe(false);
    });
    it(`bounds preparation at 30 seconds and binds exact warning ${native}`, () => {
      for (const patch of [{ expiresAt: '2026-11-01T14:05:30.001Z' }, { expiresAt: w.validation.evaluatedAt },
        { originalExitLocal: null }, { warnings: [{ code: 'RECORDED_EXIT_WILL_BE_CLEARED' }] }, { confirmationRequired: false }]) {
        expect(cancellationValidation({ ...w.validation, ...patch }, w.context)).toBe(false);
      }
    });
  }
  it('requires exactly empty draft and BOTH independent exact consents', () => {
    const w = cancellationWorld();
    for (const value of [null, [], { time: '' }, { reason: null }, { user: '1001' }]) expect(cancellationDraft(value)).toBe(false);
    for (const patch of [{ warningConfirmation: { accepted: false, code: 'RECORDED_EXIT_WILL_BE_CLEARED' } },
      { operationConfirmation: { accepted: false } }, { warningConfirmation: { accepted: true } }, { extra: true }])
      expect(cancellationCommand({ ...w.command, ...patch })).toBe(false);
  });
  it('rejects identity fallback, wrong native grants and extra principal fields', () => {
    const w = cancellationWorld();
    expect(cancellationIdentity(null)).toBe(false);
    expect(cancellationIdentity({ ...w.identity, dataSource: 'oracle' })).toBe(false);
    expect(cancellationIdentity({ ...w.identity, principal: { ...w.identity.principal, employeeId: '1001' } })).toBe(false);
  });
  it('not-recorded is context observation, never a receipt', () => {
    const w = cancellationWorld();
    const c = { ...w.context, eligibility: 'not-recorded', recorded: { ...w.context.recorded, stationExitLocal: null } };
    expect(cancellationContext(c, w.selection)).toBe(true);
    expect(cancellationValidation(w.validation, { ...w.context, eligibility: 'not-recorded' })).toBe(false);
  });
  it('bounds sanitized cancellation-only problem names', () => {
    const p = { type: 'urn:shf:problem:CONFIRMATION_REQUIRED', title: 'נדרש אישור', status: 409,
      code: 'CONFIRMATION_REQUIRED', requestId: 'safe-id', commandId: null, effect: 'none', nextAction: 'correct-and-validate',
      invalidParameters: [{ name: 'warningConfirmation', reason: 'required' }] };
    expect(cancellationProblem(p, 409, null)).toBe(true);
    expect(cancellationProblem({ ...p, invalidParameters: Array(11).fill(p.invalidParameters[0]) }, 409, null)).toBe(false);
    expect(cancellationProblem({ ...p, effect: 'unknown' }, 409, null)).toBe(false);
  });
});
