// Synthetic test data only. No application interception or runtime success factory.
import { managementCapabilities, type IdentityResponseV1 } from './contract';
import type { ShiftManagementContextV1, ShiftPreparationV1, ShiftDraftV1, ShiftStateV1,
  CsvShiftPreviewV1, ShiftReceiptV1, ReceiptBinding } from './shift-management-contract';
export const managementIdentityFixture = (native = true): IdentityResponseV1 => ({
  dataSource: native ? 'oracle' : 'isolated-fixture',
  principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'],
    capabilities: [...managementCapabilities], employeeId: null, resourceScope: { orgUnitIds: ['0021'] } },
});
export const managementStateFixture = (): ShiftStateV1 => ({
  shiftDayId: '6201', status: 'scheduled', startLocal: '2026-12-02T10:00:00', endLocal: '2026-12-02T18:00:00',
  activityCode: '12', siteId: '8', workLocation: 'site', paidMinutes: '480', workMinutes: '480', source: 'WFM',
});
export function managementContextFixture(day = false, native = true): ShiftManagementContextV1 {
  return {
    contractVersion: '49-v0.1', employeeId: '9001',
    employee: { firstName: 'עובד', lastName: 'בדיקה סינתטי', orgUnitId: '0021' },
    selected: day ? managementStateFixture() : null, eligibility: 'supported', blockers: [], siteId: '8',
    activityOptions: [{ code: '12', label: 'פעילות בדיקה' }, { code: '13', label: null }],
    startEndReasonOptions: [{ code: '1', label: 'שינוי סינתטי' }],
    cancelReasonOptions: [{ code: 'C1', label: 'ביטול סינתטי' }],
    workLocationOptions: ['home', 'site'], limits: { csvBytes: 1048576, csvRows: 100, atomicApply: true },
    serverTime: { instant: '2026-12-01T08:00:00Z', local: '2026-12-01T10:00:00' }, businessTimeZone: 'Asia/Jerusalem',
    ...(native ? { mode: 'test-oracle-controlled', dataSource: 'oracle-test' } as const :
      { mode: 'isolated-fixture', dataSource: 'isolated-fixture' } as const),
  };
}
export const managementDraftFixture = (): ShiftDraftV1 => ({
  kind: 'create', startLocal: '2026-12-02T10:00:00', endLocal: '2026-12-02T18:00:00',
  activityCode: '12', workLocation: 'site', remark: null,
});
export function managementPreparationFixture(c = managementContextFixture(), d = managementDraftFixture()): ShiftPreparationV1 {
  const before = c.selected;
  const after = d.kind === 'cancel' && before ? { ...before, status: 'cancelled' as const, source: 'SHF' } :
    d.kind !== 'cancel' ? { ...managementStateFixture(), shiftDayId: d.kind === 'create' ? null : d.shiftDayId,
      startLocal: d.startLocal, endLocal: d.endLocal, activityCode: d.activityCode, workLocation: d.workLocation,
      source: d.kind === 'create' ? 'fExtra' : 'SHF' } : managementStateFixture();
  return { contractVersion: '49-v0.1', employeeId: c.employeeId, validationToken: 'A'.repeat(43),
    fingerprint: 'a'.repeat(64), expiresAt: '2026-12-01T08:02:00Z', businessTimeZone: c.businessTimeZone,
    dataSource: c.dataSource, effects: [{ row: 1, before, after,
      warningCodes: d.kind === 'cancel' ? ['SOURCE_BECOMES_SHF', 'LOGICAL_CANCEL_PRESERVES_HISTORY'] :
        d.kind === 'change' ? ['SOURCE_BECOMES_SHF'] : [] }] };
}
export function managementCsvFixture(c = managementContextFixture()): CsvShiftPreviewV1 {
  const effect = managementPreparationFixture(c).effects[0];
  return { contractVersion: '49-v0.1', employeeId: c.employeeId, encoding: 'utf-8',
    dataSource: c.dataSource, businessTimeZone: c.businessTimeZone, state: 'ready',
    previewToken: 'B'.repeat(43), fingerprint: 'b'.repeat(64), expiresAt: '2026-12-01T08:02:00Z',
    rows: [{ line: 2, effect: { ...effect, row: 2 }, errors: [] },
      { line: 3, effect: { ...effect, row: 3, after: { ...effect.after, startLocal: '2026-12-03T10:00:00',
        endLocal: '2026-12-03T18:00:00' } }, errors: [] }] };
}
export function managementReceiptFixture(b: ReceiptBinding): ShiftReceiptV1 {
  const base = { contractVersion: '49-v0.1' as const, employeeId: b.employeeId, commandId: b.commandId, kind: b.kind,
    effects: b.effects.map((e, i) => ({ ...e, after: { ...e.after, shiftDayId: e.after.shiftDayId ?? String(7201 + i) } })),
    commitAcknowledgedAt: '2026-12-01T08:01:00Z', readBackVerifiedAt: '2026-12-01T08:01:01Z',
    businessTimeZone: b.businessTimeZone, replayed: false as const, receiptPersistence: 'none' as const,
    partnerCompletion: 'not-invoked' as const };
  return b.dataSource === 'oracle-test' ? { ...base, dataSource: 'oracle-test', outcome: 'oracle-test-committed' } :
    { ...base, dataSource: 'isolated-fixture', outcome: 'fixture-committed' };
}
