// Synthetic typed HTTP doubles only. Never operational Oracle evidence.
import type { NativeStationArrivalContextV1, NativeStationArrivalValidationV1,
  NativeStationArrivalCommitV1, NativeStationArrivalReceiptV1 } from '../../../backend/fixture-slice/oracle-station-arrival-contracts.mts';
import { nativeStationCapabilities, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { stationContextFixture, stationValidationFixture, stationSelectionFixture } from './station-arrival-fixtures';
export const nativeStationIdentityFixture = (): IdentityResponseV1 => ({
  principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
    capabilities: [...nativeStationCapabilities], resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'oracle',
});
export const nativeStationSelectionFixture = (): ArrivalSelection => ({
  ...stationSelectionFixture(), dataSource: 'oracle-test', actor: actorBinding(nativeStationIdentityFixture()),
});
export const nativeStationContextFixture = (): NativeStationArrivalContextV1 => ({
  ...stationContextFixture(), dataSource: 'oracle-test', lateReasonOptions: [],
  recorded: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, briefing: null },
});
export const nativeStationValidationFixture = (): NativeStationArrivalValidationV1 => ({
  ...stationValidationFixture(), dataSource: 'oracle-test', state: 'ready', warnings: [], confirmationRequired: false,
});
export const nativeStationCommandFixture = (): NativeStationArrivalCommitV1 => ({
  commandId: '12345678-1234-4123-8123-123456789abc', draft: { lateReasonCode: null }, confirmation: null,
  fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43), operationConfirmation: { accepted: true },
});
export const nativeStationReceiptFixture = (cmd = nativeStationCommandFixture(),
  c = nativeStationContextFixture()): NativeStationArrivalReceiptV1 => ({
  commandId: cmd.commandId, employeeId: c.employeeId, shiftDayId: c.shiftDayId, outcome: 'oracle-test-committed',
  recorded: { ...c.recorded, stationArrivalLocal: '2026-10-20T10:22:10', stationExitLocal: null, stationLate: null },
  commitAcknowledgedAt: '2026-10-20T07:22:11.000Z', readBackVerifiedAt: '2026-10-20T07:22:12.000Z',
  businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none',
  partnerCompletion: 'not-invoked', dataSource: 'oracle-test',
});
