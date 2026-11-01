import { describe, it, expect } from 'vitest';
import { lateIdentity, lateContext, lateValidation, lateCommand, lateReceipt, lateDraft } from './station-arrival-late-contract';
import { lateIdentityFixture as identity, lateContextFixture as context, lateSelectionFixture as selection,
  lateValidationFixture as validation, lateCommandFixture as command, lateReceiptFixture as receipt } from './station-arrival-late-fixtures';
import { stationContext, stationValidation } from './station-arrival-contract';
describe('canonical50-v0.1 dedicated late runtime guards — synthetic only', () => {
  it.each(['0', '1'])('accepts strict late %s minutes, never ordinary F2 fallback', minute => {
    expect(lateIdentity(identity())).toBe(true);
    expect(lateContext(context(minute), selection(minute))).toBe(true);
    expect(lateValidation(validation(minute), context(minute))).toBe(true);
    expect(lateCommand(command())).toBe(true);
    expect(lateReceipt(receipt(command(), minute), context(minute), command(), validation(minute))).toBe(true);
    expect(stationContext(context(minute), selection(minute))).toBe(false);
    expect(stationValidation(validation(minute), { ...context(minute), lateReasonOptions: [] })).toBe(false);
  });
  it('rejects boundary minute mismatch and expiry crossing the next minute', () => {
    expect(lateValidation(validation('1'), context('0'))).toBe(false);
    expect(lateValidation({ ...validation(), expiresAt: '2026-10-20T07:23:00.001Z' }, context())).toBe(false);
    expect(lateValidation({ ...validation(), expiresAt: validation().evaluatedAt }, context())).toBe(false);
    expect(lateContext({ ...context(), serverTime: { ...context().serverTime, local: context().planned.startLocal } }, selection())).toBe(false);
  });
  it('strict late subsecond 0 is valid even when Oracle DATE equals planned start; exact instant start is not late', () => {
    const c = { ...context(), serverTime: { ...context().serverTime,
      instant: '2026-10-20T07:22:00.300Z', local: '2026-10-20T10:22:00' } };
    const v = { ...validation(), evaluatedAt: '2026-10-20T07:22:00.300Z', evaluatedLocal: '2026-10-20T10:22:00' };
    expect(lateContext(c, selection())).toBe(true); expect(lateValidation(v, c)).toBe(true);
    expect(lateContext({ ...c, serverTime: { ...c.serverTime, instant: '2026-10-20T07:22:00.000Z' } }, selection())).toBe(false);
    expect(lateValidation({ ...v, evaluatedAt: '2026-10-20T07:22:00.000Z' }, c)).toBe(false);
    expect(lateReceipt({ ...receipt(), recorded: { ...receipt().recorded, stationArrivalLocal: '2026-10-20T10:22:00' } },
      c, command(), v)).toBe(true);
    expect(lateValidation({ ...validation(), evaluatedAt: '2026-10-20T07:22:06.900Z',
      expiresAt: '2026-10-20T07:23:00.001Z' }, context())).toBe(false);
  });
  it('rejects each missing consent, extra draft/time/remark, foreign source, catalog and identity', () => {
    expect(lateCommand({ ...command(), confirmation: null })).toBe(false);
    expect(lateCommand({ ...command(), operationConfirmation: { accepted: false } })).toBe(false);
    expect(lateCommand({ ...command(), timestamp: validation().evaluatedAt })).toBe(false);
    expect(lateDraft({ lateReasonCode: '01', lateRemark: null })).toBe(false);
    expect(lateDraft({ lateReasonCode: '1', lateRemark: '' })).toBe(false);
    expect(lateContext({ ...context(), dataSource: 'isolated-fixture' }, selection())).toBe(false);
    expect(lateContext({ ...context(), lateReasonOptions: [{ code: '1', label: null }] }, selection())).toBe(false);
    expect(lateContext(context(), { ...selection(), orgUnitId: '9999' })).toBe(false);
    expect(lateIdentity({ ...identity(), principal: { ...identity().principal, capabilities: [...identity().principal.capabilities].reverse() } })).toBe(false);
  });
  it('requires ACK plus independent readback and exact late preservation, not optimistic/replayed completion', () => {
    for (const bad of [{ ...receipt(), readBackVerifiedAt: null }, { ...receipt(), replayed: true },
      { ...receipt(), dataSource: 'isolated-fixture' }, { ...receipt(), partnerCompletion: 'completed' },
      { ...receipt(), recorded: { ...receipt().recorded, briefing: true } },
      { ...receipt(), recorded: { ...receipt().recorded, stationLate: null } }])
      expect(lateReceipt(bad, context(), command(), validation())).toBe(false);
  });
});
