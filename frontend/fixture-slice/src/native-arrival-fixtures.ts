// Synthetic HTTP DTOs ONLY. No native writer, runtime fallback or private binding.
import type { NativeStageArrivalContextV1, NativeStageArrivalValidationV1, NativeStageArrivalCommitV1,
  NativeStageArrivalReceiptV1 } from '../../../backend/fixture-slice/oracle-stage-arrival-contracts.mts';
import { nativeArrivalCapabilities } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { arrivalIdentityFixture, arrivalSelectionFixture, arrivalContextFixture, arrivalValidationFixture } from './stage-arrival-fixtures';
export function nativeIdentityFixture() {
  const p = arrivalIdentityFixture(); p.dataSource = 'oracle';
  p.principal.capabilities = [...nativeArrivalCapabilities]; return p;
}
export function nativeSelectionFixture(): ArrivalSelection {
  return { ...arrivalSelectionFixture(), dataSource: 'oracle-test', actor: actorBinding(nativeIdentityFixture()) };
}
export function nativeContextFixture(): NativeStageArrivalContextV1 {
  return { ...arrivalContextFixture(), dataSource: 'oracle-test', lateReasonOptions: [] };
}
export function nativeValidationFixture(): NativeStageArrivalValidationV1 {
  return { ...arrivalValidationFixture(), dataSource: 'oracle-test', state: 'ready', warnings: [], confirmationRequired: false };
}
export function nativeCommandFixture(): NativeStageArrivalCommitV1 {
  return { commandId: '12345678-1234-4123-8123-123456789abc', draft: { lateReasonCode: null, lateRemark: null },
    fingerprint: 'a'.repeat(64), validationToken: 'x'.repeat(43), confirmation: null, operationConfirmation: { accepted: true } };
}
export function nativeReceiptFixture(cmd = nativeCommandFixture()): NativeStageArrivalReceiptV1 {
  return { commandId: cmd.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
    recorded: { stageArrivalLocal: '2026-10-20T10:22:05', briefing: false, stageLate: null },
    commitAcknowledgedAt: '2026-10-20T07:22:06.000Z', readBackVerifiedAt: '2026-10-20T07:22:07.000Z',
    businessTimeZone: 'Asia/Jerusalem', replayed: false, partnerCompletion: 'not-invoked',
    dataSource: 'oracle-test', receiptPersistence: 'none' };
}
