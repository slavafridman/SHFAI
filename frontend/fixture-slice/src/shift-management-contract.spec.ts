import { describe, expect, it } from 'vitest';
import { identity, readCapabilities } from './contract';
import { managementContext, preparation, receipt, csvPreview, draft, managementProblem,
  type ReceiptBinding, type ShiftDraftV1 } from './shift-management-contract';
import { managementIdentityFixture, managementContextFixture, managementPreparationFixture,
  managementDraftFixture, managementCsvFixture, managementReceiptFixture } from './shift-management-fixtures';

const management = ['shift-management:prepare', 'shift-management:create', 'shift-management:change',
  'shift-management:cancel', 'shift-management:csv-preview', 'shift-management:csv-apply',
  'shift-management:test-oracle-write'];
const principal = (caps: string[]) => ({ dataSource: 'oracle', principal: {
  subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
  displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'],
  capabilities: caps, employeeId: null, resourceScope: { orgUnitIds: ['101'] },
} });
describe('49-v0.1 identity admission', () => {
  it('accepts precisely read7 followed by management7 for the approved Oracle actor', () => {
    expect(identity(principal([...readCapabilities, ...management]))).toBe(true);
  });
  describe('49-v0.1 strict runtime boundary', () => {
    const c = managementContextFixture(), d = managementDraftFixture(), p = managementPreparationFixture();
    const binding: ReceiptBinding = { employeeId: c.employeeId, commandId: '12345678-1234-4123-8123-123456789abc',
      kind: 'create', dataSource: c.dataSource, businessTimeZone: c.businessTimeZone, effects: p.effects };
    it('accepts canonical context, draft, preparation, CSV and verified receipt', () => {
      expect(managementContext(c, '9001', null, managementIdentityFixture())).toBe(true);
      expect(draft(d)).toBe(true); expect(preparation(p, c, d)).toBe(true);
      expect(csvPreview(managementCsvFixture(), c, 'utf-8')).toBe(true);
      expect(receipt(managementReceiptFixture(binding), binding)).toBe(true);
    });
    it('rejects unknown context fields, wrong selection, source/mode, duplicate catalogs and scope', () => {
      for (const bad of [{ ...c, extra: true }, { ...c, employeeId: '9002' },
        { ...c, mode: 'isolated-fixture' }, { ...c, activityOptions: [...c.activityOptions, c.activityOptions[0]] },
        { ...c, employee: { ...c.employee, orgUnitId: '9999' } }, { ...c, selected: {} }])
        expect(managementContext(bad, '9001', null, managementIdentityFixture())).toBe(false);
    });
    it('does not silently strip extra draft fields or accept seconds/implicit overnight', () => {
      expect(draft({ ...d, source: 'SHF' })).toBe(false);
      expect(draft({ ...d, startLocal: '2026-12-02T10:00:01' })).toBe(false);
      expect(draft({ ...d, endLocal: '2026-12-02T01:00:00' })).toBe(false);
    });
    it('rejects wrong plan, duplicate/unknown warning sets and malformed ready/invalid CSV tokens', () => {
      expect(preparation({ ...p, effects: [{ ...p.effects[0], after: { ...p.effects[0].after, activityCode: '13' } }] }, c, d)).toBe(false);
      for (const warnings of [['UNKNOWN'], ['DURATION_CHANGED', 'DURATION_CHANGED']])
        expect(preparation({ ...p, effects: [{ ...p.effects[0], warningCodes: warnings }] }, c, d)).toBe(false);
      const csv = managementCsvFixture();
      expect(csvPreview({ ...csv, state: 'invalid' }, c, 'utf-8')).toBe(false);
      expect(csvPreview({ ...csv, previewToken: null }, c, 'utf-8')).toBe(false);
      expect(csvPreview(csv, c, 'windows-1255')).toBe(false);
    });
    it('rejects ACK-only, changed effects/kind/source, reconstructed/replayed and wrong-command receipts', () => {
      const r = managementReceiptFixture(binding);
      for (const bad of [{ ...r, readBackVerifiedAt: null }, { ...r, commandId: crypto.randomUUID() },
        { ...r, dataSource: 'isolated-fixture' }, { ...r, kind: 'cancel' }, { ...r, replayed: true },
        { ...r, effects: [] }, { ...r, effects: [{ ...r.effects[0], after: { ...r.effects[0].after, workMinutes: '1' } }] }])
        expect(receipt(bad, binding)).toBe(false);
    });
    it('compares server observation timestamps including fractional-second order, not string-Z lexical order', () => {
      const r = managementReceiptFixture(binding);
      expect(receipt({ ...r, commitAcknowledgedAt: '2026-12-01T08:01:00Z',
        readBackVerifiedAt: '2026-12-01T08:01:00.001Z' }, binding)).toBe(true);
      expect(receipt({ ...r, commitAcknowledgedAt: '2026-12-01T08:01:00.001Z',
        readBackVerifiedAt: '2026-12-01T08:01:00Z' }, binding)).toBe(false);
      expect(receipt(r, { ...binding, observedAt: '2026-12-01T09:00:00Z' })).toBe(false);
    });
    it('rejects omitted semantic warnings instead of permitting unacknowledged cancel/source changes', () => {
      const c = managementContextFixture(true);
      const d: ShiftDraftV1 = { kind: 'cancel', shiftDayId: '6201', reasonCode: 'C1', remark: null };
      const p = managementPreparationFixture(c, d);
      expect(preparation(p, c, d)).toBe(true);
      expect(preparation({ ...p, effects: [{ ...p.effects[0], warningCodes: [] }] }, c, d)).toBe(false);
    });
    it('accepts only canonical problem status/effect/action and sanitized named fields', () => {
      const p = { type: 'urn:shf:problem:COMMAND_OUTCOME_UNKNOWN', title: 'תוצאה לא ידועה', status: 503,
        code: 'COMMAND_OUTCOME_UNKNOWN', requestId: 'synthetic-request', commandId: binding.commandId,
        effect: 'unknown', nextAction: 'reconcile' };
      expect(managementProblem(p, 503, binding.commandId)).toBe(true);
      expect(managementProblem({ ...p, nextAction: 'prepare-again' }, 503, binding.commandId)).toBe(false);
      expect(managementProblem({ ...p, invalidParameters: [{ name: '012345678', reason: 'invalid-format' }] },
        503, binding.commandId)).toBe(false);
    });
  });
  it('rejects reordered, missing, duplicated and unknown management grants', () => {
    for (const caps of [
      [...readCapabilities, ...management.toReversed()], [...readCapabilities, ...management.slice(1)],
      [...readCapabilities, ...management, management[0]], [...readCapabilities, ...management, 'unknown'],
    ]) expect(identity(principal(caps))).toBe(false);
  });
  it('preserves the original ordered read-only family', () => {
    expect(identity(principal([...readCapabilities]))).toBe(true);
    expect(identity(principal([...readCapabilities].reverse()))).toBe(false);
  });
});
