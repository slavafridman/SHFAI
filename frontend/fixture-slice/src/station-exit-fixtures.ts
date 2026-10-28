// SYNTHETIC typed HTTP doubles only — never native execution evidence.
import type { IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import type { StationExitContextV1, StationExitValidationV1, StationExitCommitV1,
  StationExitReceiptV1 } from '../../../backend/fixture-slice/station-exit-contracts.mts';
export function exitIdentityFixture(): IdentityResponseV1 {
  return { principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
    capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read',
      'shift-items:read', 'employee:read', 'attendance:read', 'attendance-station-exit:prepare',
      'attendance-station-exit:commit', 'attendance-station-exit:test-oracle-write'],
    resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'oracle' };
}
export function exitSelectionFixture(): ArrivalSelection {
  return { employeeId: '9001', shiftDayId: '6201', attendanceKey: { shiftDayId: '6201' }, orgUnitId: '0021',
    name: 'עובד בדיקה סינתטי', startLocal: '2026-10-28T10:00:00', endLocal: '2026-10-28T18:00:00',
    dataSource: 'oracle-test', actor: actorBinding(exitIdentityFixture()) };
}
export function exitContextFixture(): StationExitContextV1 {
  return { employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
    planned: { startLocal: '2026-10-28T10:00:00', endLocal: '2026-10-28T18:00:00' },
    recorded: { stageArrivalLocal: null, stationArrivalLocal: '2026-10-28T09:55:00',
      stationExitLocal: null, briefing: null },
    serverTime: { instant: '2026-10-28T15:59:00.001Z', local: '2026-10-28T17:59:00',
      businessTimeZone: 'Asia/Jerusalem' },
    policy: { maxEarlyWholeMinutes: 0, maxAfterEndMinutes: 30 },
    exitWindow: { earliestInclusiveAt: '2026-10-28T15:59:00.001Z', latestInclusiveAt: '2026-10-28T16:30:00.000Z' },
    classification: 'ordinary', withinExitWindow: true, eligibility: 'eligible', blockers: [], dataSource: 'oracle-test' };
}
export function exitValidationFixture(): StationExitValidationV1 {
  return { employeeId: '9001', shiftDayId: '6201', state: 'ready',
    evaluatedAt: '2026-10-28T15:59:00.001Z', evaluatedLocal: '2026-10-28T17:59:00',
    expiresAt: '2026-10-28T16:01:00.001Z', businessTimeZone: 'Asia/Jerusalem',
    fingerprint: 'e'.repeat(64), validationToken: 'x'.repeat(43), warnings: [],
    confirmationRequired: false, dataSource: 'oracle-test' };
}
export function exitCommandFixture(): StationExitCommitV1 {
  return { commandId: '12345678-1234-4234-8234-123456789abc', draft: {},
    fingerprint: 'e'.repeat(64), validationToken: 'x'.repeat(43), operationConfirmation: { accepted: true } };
}
export function exitReceiptFixture(command = exitCommandFixture()): StationExitReceiptV1 {
  return { commandId: command.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
    recorded: { ...exitContextFixture().recorded, stationArrivalLocal: '2026-10-28T09:55:00',
      stationExitLocal: '2026-10-28T17:59:04' },
    commitAcknowledgedAt: '2026-10-28T15:59:05.000Z', readBackVerifiedAt: '2026-10-28T15:59:06.000Z',
    businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none',
    partnerCompletion: 'not-invoked', dataSource: 'oracle-test' };
}
