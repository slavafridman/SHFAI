import { describe, expect, it } from 'vitest';
import { identity, f1Capabilities } from './contract';
import { arrivalContext, arrivalValidation, arrivalReceipt, arrivalProblem, f1Identity } from './stage-arrival-contract';
import { arrivalContextFixture as context, arrivalSelectionFixture as selection,
  arrivalValidationFixture as validation, arrivalIdentityFixture, arrivalReceiptFixture as receipt,
  arrivalProblemFixture as problem } from './stage-arrival-fixtures';
import { fixtureIdentity } from './test-fixtures';
const cmd = { commandId: '12345678-1234-4123-8123-123456789abc', draft: { lateReasonCode: null, lateRemark: null },
  validationToken: 'x'.repeat(43), fingerprint: 'a'.repeat(64), confirmation: null };
describe('F1 canonical v0.1 atomic guards', () => {
  it('keeps seven rights valid and independently requires exact ordered nine + fixture for F1', () => {
    const seven = fixtureIdentity(); expect(identity(seven)).toBe(true); expect(f1Identity(seven)).toBe(false);
    seven.dataSource = 'oracle'; expect(identity(seven)).toBe(true); expect(f1Identity(seven)).toBe(false);
    const nine = arrivalIdentityFixture(); expect(f1Identity(nine)).toBe(true);
    nine.dataSource = 'oracle'; expect(identity(nine)).toBe(false);
    for (const missing of f1Capabilities) {
      const p = arrivalIdentityFixture(); p.principal.capabilities = p.principal.capabilities.filter(c => c !== missing);
      expect(f1Identity(p)).toBe(false);
    }
    const reordered = arrivalIdentityFixture(); reordered.principal.capabilities.reverse(); expect(identity(reordered)).toBe(false);
  });
  it('admits exactly context binding / catalog / eligibility, no invented attendanceId', () => {
    expect(arrivalContext(context(), selection())).toBe(true);
    for (const mutate of [
      (c: any) => c.employeeId = '9002', (c: any) => c.shiftDayId = 6201,
      (c: any) => c.dataSource = 'oracle', (c: any) => c.recorded.attendanceId = '1',
      (c: any) => c.recorded.briefing = true, (c: any) => c.recorded.stageArrivalLocal = '2026-10-20T10:00:00',
      (c: any) => c.planned.startLocal = '2026-02-30T00:00:00',
      (c: any) => c.blockers = ['UNKNOWN'], (c: any) => c.lateReasonOptions.push(c.lateReasonOptions[0]),
      (c: any) => c.serverTime.extra = true, (c: any) => c.eligibility = 'unknown',
    ]) { const c = context(); mutate(c); expect(arrivalContext(c, selection())).toBe(false); }
    const s = selection(); s.attendanceKey.shiftDayId = '6202'; expect(arrivalContext(context(), s)).toBe(false);
  });
  it('admits coherent blocked contexts without assuming attendance existence from nulls', () => {
    const c = context(); c.eligibility = 'deferred'; c.blockers = ['ATTENDANCE_ROW_REQUIRED'];
    expect(arrivalContext(c, selection())).toBe(true);
    c.eligibility = 'already-recorded'; expect(arrivalContext(c, selection())).toBe(false);
    c.recorded.stageArrivalLocal = '2026-10-20T10:00:00'; expect(arrivalContext(c, selection())).toBe(true);
  });
  it('strictly binds validation token, source, warning minutes, expiry and context', () => {
    expect(arrivalValidation(validation(), context())).toBe(true);
    expect(arrivalValidation(validation(true), context())).toBe(true);
    for (const mutate of [
      (v: any) => v.employeeId = '9002', (v: any) => v.dataSource = 'oracle',
      (v: any) => v.validationToken = 'short', (v: any) => v.fingerprint = 'A'.repeat(64),
      (v: any) => v.expiresAt = v.evaluatedAt, (v: any) => v.expiresAt = '2026-10-20T08:00:00Z',
      (v: any) => v.confirmationRequired = true, (v: any) => v.warnings = [{ code: 'OTHER', minutes: '1' }],
      (v: any) => v.extra = true,
    ]) { const v = validation(); mutate(v); expect(arrivalValidation(v, context())).toBe(false); }
  });
  it('wrong source or receipt binding is never success, including wrong late minutes', () => {
    expect(arrivalReceipt(receipt(cmd), context(), cmd, validation())).toBe(true);
    for (const mutate of [
      (r: any) => r.dataSource = 'oracle', (r: any) => r.partnerCompletion = 'complete',
      (r: any) => r.commandId = '12345678-1234-4123-8123-123456789abd',
      (r: any) => r.employeeId = '9002', (r: any) => r.recorded.briefing = true,
      (r: any) => r.recorded.stageLate = {}, (r: any) => r.outcome = 'committed',
      (r: any) => r.recorded.stageArrivalLocal = 'bad',
    ]) { const r = receipt(cmd); mutate(r); expect(arrivalReceipt(r, context(), cmd, validation())).toBe(false); }
  });
  it('problems use separate exact status/effect/nextAction and attempt binding', () => {
    expect(arrivalProblem(problem(503, 'COMMAND_OUTCOME_UNKNOWN', cmd.commandId, 'unknown', 'reconcile'), 503, cmd.commandId)).toBe(true);
    for (const p of [problem(503, 'COMMAND_OUTCOME_UNKNOWN'), problem(409, 'STALE_PREPARATION'),
      problem(403, 'FORBIDDEN', cmd.commandId), { ...problem(403, 'FORBIDDEN'), extra: 1 }])
      expect(arrivalProblem(p, p.status, null)).toBe(false);
    expect(arrivalProblem(problem(409, 'STALE_PREPARATION', null, 'none', 'prepare-again'), 409, null)).toBe(true);
  });
});
