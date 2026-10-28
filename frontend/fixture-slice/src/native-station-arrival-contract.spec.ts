import { describe, expect, it } from 'vitest';
import { identity, nativeStationCapabilities } from './contract';
import { arrivalIdentity } from './stage-arrival-contract';
import { stationSource, stationContext, stationValidation, stationCommand, stationReceipt, stationProblem } from './station-arrival-contract';
import { nativeStationIdentityFixture as principal, nativeStationSelectionFixture as selection,
  nativeStationContextFixture as context, nativeStationValidationFixture as validation,
  nativeStationCommandFixture as command, nativeStationReceiptFixture as receipt } from './native-station-arrival-fixtures';
import { nativeIdentityFixture } from './native-arrival-fixtures';
import { stationIdentityFixture, stationContextFixture, stationReceiptFixture } from './station-arrival-fixtures';
import { arrivalProblemFixture } from './stage-arrival-fixtures';
describe('§46 v0.1 native station strict source branch (static doubles)', () => {
  it('distinguishes native station10 from native stage10 and fixture11 without changing F1', () => {
    expect(identity(principal())).toBe(true); expect(stationSource(principal())).toBe('oracle-test');
    expect(arrivalIdentity(principal())).toBe(false); expect(stationSource(nativeIdentityFixture())).toBeNull();
    expect(stationSource(stationIdentityFixture())).toBe('isolated-fixture');
    for (const right of nativeStationCapabilities) {
      const p = principal(); p.principal.capabilities = p.principal.capabilities.filter(c => c !== right);
      expect(stationSource(p)).toBeNull();
    }
    for (const mutate of [(p: any) => p.dataSource = 'isolated-fixture',
      (p: any) => p.principal.capabilities.reverse(), (p: any) => p.principal.employeeId = '9001',
      (p: any) => p.principal.capabilities.push('attendance-stage-arrival:commit'),
      (p: any) => p.principal.capabilities.push(p.principal.capabilities[0])]) {
      const p = principal(); mutate(p); expect(identity(p)).toBe(false); expect(stationSource(p)).toBeNull();
    }
  });
  it('admits null or existing stage and all three briefing values, never fixture context or native reasons', () => {
    for (const stage of [null, '2026-10-20T10:20:00']) for (const briefing of [null, true, false]) {
      const c = context(); c.recorded.stageArrivalLocal = stage; c.recorded.briefing = briefing;
      expect(stationContext(c, selection())).toBe(true);
      expect(stationReceipt(receipt(command(), c), c, command(), validation())).toBe(true);
    }
    expect(stationContext(stationContextFixture(), selection())).toBe(false);
    for (const mutate of [(c: any) => c.lateReasonOptions = [{ code: '1', label: 'no' }],
      (c: any) => c.dataSource = 'oracle', (c: any) => c.recorded.extra = null,
      (c: any) => c.serverTime.local = '2026-10-20T11:22:06',
      (c: any) => c.employeeId = '9002']) {
      const c = context(); mutate(c); expect(stationContext(c, selection())).toBe(false);
    }
  });
  it('requires ready native validation and exact consent/null draft; no warning override', () => {
    expect(stationValidation(validation(), context())).toBe(true);
    expect(stationCommand(command(), 'oracle-test')).toBe(true);
    expect(stationCommand(command(), 'isolated-fixture')).toBe(false);
    for (const mutate of [(v: any) => v.dataSource = 'isolated-fixture',
      (v: any) => v.state = 'warning-requires-confirmation', (v: any) => v.confirmationRequired = true,
      (v: any) => v.warnings = [{ code: 'STATION_ARRIVAL_LATE', minutes: '1' }],
      (v: any) => { v.evaluatedAt = '2026-10-20T07:31:00Z'; v.evaluatedLocal = '2026-10-20T10:31:00'; v.expiresAt = '2026-10-20T07:32:00Z'; }]) {
      const v = validation(); mutate(v); expect(stationValidation(v, context())).toBe(false);
    }
    for (const mutate of [(c: any) => delete c.operationConfirmation,
      (c: any) => c.operationConfirmation.accepted = false, (c: any) => c.operationConfirmation.extra = true,
      (c: any) => c.draft.lateReasonCode = '1', (c: any) => c.draft.lateRemark = null,
      (c: any) => c.confirmation = { accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] }]) {
      const c = command(); mutate(c); expect(stationCommand(c, 'oracle-test')).toBe(false);
    }
  });
  it('requires matching native ACK/readback, original tokens and every exposed preserved field', () => {
    expect(stationReceipt(receipt(), context(), command(), validation())).toBe(true);
    expect(stationReceipt(stationReceiptFixture(command()), context(), command(), validation())).toBe(false);
    expect(stationReceipt(receipt(), context(), { ...command(), validationToken: 'x'.repeat(43) }, validation())).toBe(false);
    expect(stationReceipt(receipt(), context(), { ...command(), fingerprint: 'a'.repeat(64) }, validation())).toBe(false);
    for (const mutate of [(r: any) => delete r.readBackVerifiedAt, (r: any) => delete r.commitAcknowledgedAt,
      (r: any) => r.committedAt = r.commitAcknowledgedAt, (r: any) => r.replayed = true,
      (r: any) => r.receiptPersistence = 'durable', (r: any) => r.partnerCompletion = 'complete',
      (r: any) => r.recorded.briefing = false, (r: any) => r.recorded.stageArrivalLocal = '2026-10-20T10:20:00',
      (r: any) => r.recorded.stationArrivalLocal = '2026-10-20T10:31:00',
      (r: any) => r.readBackVerifiedAt = '2026-10-20T07:22:10Z',
      (r: any) => r.outcome = 'fixture-committed', (r: any) => r.dataSource = 'isolated-fixture']) {
      const r = receipt(); mutate(r); expect(stationReceipt(r, context(), command(), validation())).toBe(false);
    }
  });
  it('native error adds only operationConfirmation, never stage-only parameters or invented effects', () => {
    const p = { ...arrivalProblemFixture(400, 'INVALID_REQUEST', null, 'none', 'correct-and-validate'),
      invalidParameters: [{ name: 'operationConfirmation', reason: 'required' }] };
    expect(stationProblem(p, 400, null, 'oracle-test')).toBe(true);
    expect(stationProblem(p, 400, null)).toBe(false);
    p.invalidParameters[0].name = 'lateRemark';
    expect(stationProblem(p, 400, null, 'oracle-test')).toBe(false);
  });
});
