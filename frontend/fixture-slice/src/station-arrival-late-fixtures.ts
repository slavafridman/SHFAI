// SYNTHETIC TYPED HTTP ONLY; not native clock, persistence or partner proof.
import { nativeLateCapabilities, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { nativeStationContextFixture, nativeStationSelectionFixture } from './native-station-arrival-fixtures';
import type { NativeLateStationContextV1, NativeLateStationValidationV1,
  NativeLateStationCommitV1, NativeLateStationReceiptV1 } from './station-arrival-late-contract';
export const lateIdentityFixture = (): IdentityResponseV1 => ({
  principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
    capabilities: [...nativeLateCapabilities], resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'oracle',
});
export const lateContextFixture = (minute = '0'): NativeLateStationContextV1 => ({
  ...nativeStationContextFixture(),
  planned: { startLocal: minute === '0' ? '2026-10-20T10:22:00' : '2026-10-20T10:21:00', endLocal: '2026-10-20T18:30:00' },
  arrivalWindow: { earliestLocal: minute === '0' ? '2026-10-20T10:22:00' : '2026-10-20T10:21:00', latestLocal: '2026-10-20T18:30:00' },
  lateReasonOptions: [{ code: '1', label: 'סיבה סינתטית בלבד' }],
});
export const lateSelectionFixture = (minute = '0'): ArrivalSelection => ({
  ...nativeStationSelectionFixture(), startLocal: lateContextFixture(minute).planned.startLocal,
  actor: actorBinding(lateIdentityFixture()),
});
export const lateValidationFixture = (minute = '0'): NativeLateStationValidationV1 => ({
  employeeId: '9001', shiftDayId: '6201', state: 'warning-requires-confirmation',
  evaluatedAt: '2026-10-20T07:22:06.000Z', evaluatedLocal: '2026-10-20T10:22:06',
  expiresAt: '2026-10-20T07:23:00.000Z', businessTimeZone: 'Asia/Jerusalem',
  fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43), confirmationRequired: true,
  warnings: [{ code: 'STATION_ARRIVAL_LATE', minutes: minute }], dataSource: 'oracle-test',
});
export const lateCommandFixture = (): NativeLateStationCommitV1 => ({
  commandId: '12345678-1234-4123-8123-123456789abc', draft: { lateReasonCode: '1', lateRemark: null },
  validationToken: 's'.repeat(43), fingerprint: 'b'.repeat(64),
  confirmation: { accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] }, operationConfirmation: { accepted: true },
});
export const lateReceiptFixture = (cmd = lateCommandFixture(), minute = '0'): NativeLateStationReceiptV1 => ({
  commandId: cmd.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
  recorded: { ...lateContextFixture(minute).recorded, stationExitLocal: null, stationArrivalLocal: '2026-10-20T10:22:10',
    stationLate: { reasonCode: cmd.draft.lateReasonCode, minutes: minute, remark: null } },
  commitAcknowledgedAt: '2026-10-20T07:22:11.000Z', readBackVerifiedAt: '2026-10-20T07:22:12.000Z',
  businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none',
  partnerCompletion: 'not-invoked', dataSource: 'oracle-test',
});
