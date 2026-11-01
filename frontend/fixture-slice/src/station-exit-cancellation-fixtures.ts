import type { ArrivalSelection } from './stage-arrival-contract';
import { fixtureCancellationCapabilities, nativeCancellationCapabilities, type IdentityResponseV1 } from './contract';
import { actorBinding } from './stage-arrival-contract';
import type { CancellationContextV1, CancellationValidationV1, CancellationCommandV1, CancellationReceiptV1 } from './station-exit-cancellation-contract';
// Factory-only synthetic worlds. No environment, runtime or infrastructure imports.
export function cancellationWorld(native = false) {
  const identity: IdentityResponseV1 = { dataSource: native ? 'oracle' : 'isolated-fixture', principal: {
    subject: 'synthetic:administrator', displayName: 'Synthetic Administrator (local/isolated only)',
    provider: 'synthetic', synthetic: true, employeeId: null, roles: ['Administrator'],
    capabilities: [...(native ? nativeCancellationCapabilities : fixtureCancellationCapabilities)],
    resourceScope: { orgUnitIds: ['U01'] },
  } };
  const selection: ArrivalSelection = { employeeId: '1001', shiftDayId: '2001', orgUnitId: 'U01',
    name: 'עובד הדמיה', startLocal: '2026-11-01T08:00:00', endLocal: '2026-11-01T16:00:00',
    attendanceKey: { shiftDayId: '2001' }, actor: actorBinding(identity),
    dataSource: native ? 'oracle-test' : 'isolated-fixture' };
  const context: CancellationContextV1 = { employeeId: selection.employeeId, shiftDayId: selection.shiftDayId,
    orgUnitId: selection.orgUnitId, planned: { startLocal: selection.startLocal, endLocal: selection.endLocal },
    recorded: { stageArrivalLocal: null, stationArrivalLocal: '2026-11-01T08:00:00',
      stationExitLocal: '2026-11-01T16:00:00', briefing: null },
    serverTime: { instant: '2026-11-01T14:05:00.000Z', local: '2026-11-01T16:05:00', businessTimeZone: 'Asia/Jerusalem' },
    policy: { maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 30 },
    mode: native ? 'test-oracle-controlled' : 'isolated-fixture', dataSource: selection.dataSource,
    eligibility: 'eligible', blockers: [] };
  const validation: CancellationValidationV1 = { employeeId: selection.employeeId, shiftDayId: selection.shiftDayId,
    state: 'ready', evaluatedAt: context.serverTime.instant, evaluatedLocal: context.serverTime.local,
    expiresAt: '2026-11-01T14:05:30.000Z', businessTimeZone: context.serverTime.businessTimeZone,
    validationToken: 't'.repeat(43), fingerprint: 'a'.repeat(64), originalExitLocal: context.recorded.stationExitLocal!,
    warnings: ['RECORDED_EXIT_WILL_BE_CLEARED'], confirmationRequired: true, dataSource: selection.dataSource };
  const command: CancellationCommandV1 = { commandId: '11111111-1111-4111-8111-111111111111', draft: {},
    validationToken: validation.validationToken, fingerprint: validation.fingerprint,
    warningConfirmation: { accepted: true, code: 'RECORDED_EXIT_WILL_BE_CLEARED' },
    operationConfirmation: { accepted: true } };
  const base = { commandId: command.commandId, employeeId: selection.employeeId, shiftDayId: selection.shiftDayId,
    originalExitLocal: validation.originalExitLocal, recorded: { ...context.recorded,
      stationArrivalLocal: '2026-11-01T08:00:00', stationExitLocal: null },
    businessTimeZone: validation.businessTimeZone, replayed: false, receiptPersistence: 'none', partnerCompletion: 'not-invoked' } as const;
  const receipt: CancellationReceiptV1 = native ? { ...base, outcome: 'oracle-test-committed', dataSource: 'oracle-test',
    commitAcknowledgedAt: '2026-11-01T14:05:01.000Z', readBackVerifiedAt: '2026-11-01T14:05:02.000Z' } :
    { ...base, outcome: 'simulated', dataSource: 'isolated-fixture', commitAcknowledgedAt: null, readBackVerifiedAt: null };
  return { identity, selection, context, validation, command, receipt };
}
