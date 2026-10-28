// Typed SYNTHETIC browser HTTP responses; no backend runtime imports.
import type { IdentityResponseV1 } from '../../../backend/fixture-slice/contracts.mts';
import type { NativeStationArrivalContextV1, NativeStationArrivalValidationV1,
  NativeStationArrivalCommitV1, NativeStationArrivalReceiptV1 } from '../../../backend/fixture-slice/oracle-station-arrival-contracts.mts';
export const nativeStationBrowserDouble = {
  identity(): IdentityResponseV1 {
    return { principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
      displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
      capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read',
        'employee:read', 'attendance:read', 'attendance-station-arrival:prepare', 'attendance-station-arrival:commit',
        'attendance-station-arrival:test-oracle-write'], resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'oracle' };
  },
  context(stage: string | null, station: string | null): NativeStationArrivalContextV1 {
    return { employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
      planned: { startLocal: '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
      recorded: { stageArrivalLocal: stage, stationArrivalLocal: station, stationExitLocal: null, briefing: null },
      serverTime: { instant: '2026-10-20T07:22:06.000Z', local: '2026-10-20T10:22:06', businessTimeZone: 'Asia/Jerusalem' },
      arrivalWindow: { earliestLocal: '2026-10-20T09:30:00', latestLocal: '2026-10-20T18:30:00' },
      withinArrivalWindow: true, eligibility: station ? 'already-recorded' : 'eligible', blockers: [],
      lateReasonOptions: [], dataSource: 'oracle-test' };
  },
  validation(): NativeStationArrivalValidationV1 {
    return { employeeId: '9001', shiftDayId: '6201', state: 'ready',
      evaluatedAt: '2026-10-20T07:22:06.000Z', evaluatedLocal: '2026-10-20T10:22:06',
      expiresAt: '2026-10-20T07:24:06.000Z', businessTimeZone: 'Asia/Jerusalem',
      fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43), warnings: [], confirmationRequired: false,
      dataSource: 'oracle-test' };
  },
  receipt(command: NativeStationArrivalCommitV1, stage: string | null): NativeStationArrivalReceiptV1 {
    return { commandId: command.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
      recorded: { stageArrivalLocal: stage, stationArrivalLocal: '2026-10-20T10:22:10',
        stationExitLocal: null, briefing: null, stationLate: null },
      commitAcknowledgedAt: '2026-10-20T07:22:11.000Z', readBackVerifiedAt: '2026-10-20T07:22:12.000Z',
      businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none',
      partnerCompletion: 'not-invoked', dataSource: 'oracle-test' };
  },
};
