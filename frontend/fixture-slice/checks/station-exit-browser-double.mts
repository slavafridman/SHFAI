// SYNTHETIC HTTP only; canonical type imports are erased.
import type { IdentityResponseV1 } from '../../../backend/fixture-slice/contracts.mts';
import type { StationExitContextV1, StationExitValidationV1, StationExitCommitV1,
  StationExitReceiptV1 } from '../../../backend/fixture-slice/station-exit-contracts.mts';
export const stationExitBrowserDouble = {
  identity(): IdentityResponseV1 {
    return { principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
      displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
      capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read',
        'employee:read', 'attendance:read', 'attendance-station-exit:prepare', 'attendance-station-exit:commit',
        'attendance-station-exit:test-oracle-write'], resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'oracle' };
  },
  context(mode: 'ordinary' | 'early' | 'missing' = 'ordinary', exit: string | null = null): StationExitContextV1 {
    return { employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
      planned: { startLocal: '2026-10-28T10:00:00', endLocal: '2026-10-28T18:00:00' },
      recorded: { stageArrivalLocal: null, stationArrivalLocal: mode === 'missing' ? null : '2026-10-28T09:55:00',
        stationExitLocal: exit, briefing: null },
      serverTime: { instant: exit ? '2026-10-28T15:59:06.000Z' : mode === 'early' ? '2026-10-28T15:59:00.000Z' : '2026-10-28T15:59:00.001Z',
        local: exit ? '2026-10-28T17:59:06' : '2026-10-28T17:59:00', businessTimeZone: 'Asia/Jerusalem' },
      policy: { maxEarlyWholeMinutes: 0, maxAfterEndMinutes: 30 },
      exitWindow: { earliestInclusiveAt: '2026-10-28T15:59:00.001Z', latestInclusiveAt: '2026-10-28T16:30:00.000Z' },
      classification: mode === 'early' ? 'early-manager-decision-deferred' : 'ordinary',
      withinExitWindow: mode !== 'early', eligibility: exit ? 'already-recorded' : mode === 'ordinary' ? 'eligible' : 'deferred',
      blockers: mode === 'missing' ? ['STATION_ARRIVAL_REQUIRED'] : [], dataSource: 'oracle-test' };
  },
  validation(): StationExitValidationV1 {
    return { employeeId: '9001', shiftDayId: '6201', state: 'ready',
      evaluatedAt: '2026-10-28T15:59:00.001Z', evaluatedLocal: '2026-10-28T17:59:00',
      expiresAt: '2026-10-28T16:01:00.001Z', businessTimeZone: 'Asia/Jerusalem',
      fingerprint: 'e'.repeat(64), validationToken: 'x'.repeat(43), warnings: [], confirmationRequired: false,
      dataSource: 'oracle-test' };
  },
  receipt(command: StationExitCommitV1): StationExitReceiptV1 {
    return { commandId: command.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
      recorded: { stageArrivalLocal: null, stationArrivalLocal: '2026-10-28T09:55:00',
        stationExitLocal: '2026-10-28T17:59:04', briefing: null },
      commitAcknowledgedAt: '2026-10-28T15:59:05.000Z', readBackVerifiedAt: '2026-10-28T15:59:06.000Z',
      businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none',
      partnerCompletion: 'not-invoked', dataSource: 'oracle-test' };
  },
};
