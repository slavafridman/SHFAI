import { describe, expect, it } from 'vitest';
import { identity, nativeArrivalCapabilities } from './contract';
import { arrivalSource, arrivalIdentity, f1Identity, arrivalContext, arrivalValidation, arrivalCommand,
  arrivalReceipt, arrivalProblem } from './stage-arrival-contract';
import { nativeIdentityFixture as principal, nativeSelectionFixture as selection, nativeContextFixture as context,
  nativeValidationFixture as validation, nativeReceiptFixture as receipt, nativeCommandFixture as command } from './native-arrival-fixtures';
import { arrivalIdentityFixture, arrivalContextFixture, arrivalSelectionFixture, arrivalReceiptFixture,
  arrivalProblemFixture } from './stage-arrival-fixtures';
import { fixtureIdentity } from './test-fixtures';
describe('APP43/45 v0.1 strict native public branch', () => {
  it('admits exact 7/read-only, 9/fixture, 10/native, never 11/F2 or role fallback', () => {
    const seven = fixtureIdentity(); seven.dataSource = 'oracle';
    expect(identity(seven)).toBe(true); expect(arrivalSource(seven)).toBeNull();
    expect(arrivalSource(arrivalIdentityFixture())).toBe('isolated-fixture');
    expect(identity(principal())).toBe(true); expect(arrivalIdentity(principal())).toBe(true);
    expect(arrivalSource(principal())).toBe('oracle-test'); expect(f1Identity(principal())).toBe(false);
    for (const right of nativeArrivalCapabilities) {
      const p = principal(); p.principal.capabilities = p.principal.capabilities.filter(c => c !== right);
      expect(arrivalSource(p)).toBeNull();
    }
    for (const mutate of [(p: any) => p.dataSource = 'isolated-fixture',
      (p: any) => p.principal.capabilities.reverse(), (p: any) => p.principal.capabilities.push('attendance-station-arrival:commit'),
      (p: any) => p.principal.employeeId = '9001', (p: any) => p.principal.provider = 'real',
      (p: any) => p.principal.capabilities.push(p.principal.capabilities[0])]) {
      const p = principal(); mutate(p); expect(identity(p)).toBe(false); expect(arrivalSource(p)).toBeNull();
    }
  });
  it('binds native context to the selected read resource and refuses private/unknown fields atomically', () => {
    expect(arrivalContext(context(), selection())).toBe(true);
    expect(arrivalContext(context(), arrivalSelectionFixture())).toBe(false);
    expect(arrivalContext(arrivalContextFixture(), selection())).toBe(false);
    for (const mutate of [
      (c: any) => c.employeeId = '9002', (c: any) => c.shiftDayId = '6202',
      (c: any) => c.orgUnitId = '0022', (c: any) => c.dataSource = 'oracle',
      (c: any) => c.lateReasonOptions = [{ code: '1', label: 'unexpected' }],
      (c: any) => c.privateApprovalKey = 'not-public', (c: any) => c.recorded.operator = 'not-public',
      (c: any) => c.planned.beforeImage = {}, (c: any) => c.serverTime.local = '2026-10-20T11:22:00',
      (c: any) => c.serverTime.businessTimeZone = 'Unknown/Zone',
    ]) { const c = context(); mutate(c); expect(arrivalContext(c, selection())).toBe(false); }
    const s = selection(); s.attendanceKey.shiftDayId = '6202'; expect(arrivalContext(context(), s)).toBe(false);
  });
  it('native PURE response must be ready without any late warning or field substitution', () => {
    expect(arrivalValidation(validation(), context())).toBe(true);
    for (const mutate of [(v: any) => v.dataSource = 'isolated-fixture',
      (v: any) => v.warnings = [{ code: 'STAGE_ARRIVAL_LATE', minutes: '0' }],
      (v: any) => v.state = 'warning-requires-confirmation', (v: any) => v.confirmationRequired = true,
      (v: any) => v.evaluatedLocal = '2026-10-20T11:22:00', (v: any) => v.expiresAt = v.evaluatedAt,
      (v: any) => v.validationToken = 'x'.repeat(42), (v: any) => v.fingerprint = 'A'.repeat(64),
      (v: any) => v.employeeId = '9002', (v: any) => v.evaluatedAt = '2026-10-20T07:21:00Z',
      (v: any) => v.serverClockOverride = true]) {
      const v = validation(); mutate(v); expect(arrivalValidation(v, context())).toBe(false);
    }
  });
  it('native request requires exact whole-operation consent and null/null draft, fixture is unchanged', () => {
    expect(arrivalCommand(command(), 'oracle-test')).toBe(true);
    expect(arrivalCommand(command(), 'isolated-fixture')).toBe(false);
    const { operationConfirmation, ...fixture } = command();
    expect(arrivalCommand(fixture, 'isolated-fixture')).toBe(true);
    expect(arrivalCommand(fixture, 'oracle-test')).toBe(false);
    for (const mutate of [(c: any) => c.operationConfirmation.accepted = false,
      (c: any) => c.operationConfirmation.extra = true, (c: any) => c.draft.lateReasonCode = '1',
      (c: any) => c.confirmation = { accepted: true, warningCodes: ['STAGE_ARRIVAL_LATE'] },
      (c: any) => c.draft.time = '2026-10-20T10:00:00', (c: any) => c.commandId = 'bad']) {
      const c = command(); mutate(c); expect(arrivalCommand(c, 'oracle-test')).toBe(false);
    }
  });
  it('success needs the exact native outcome/source and ACK + independent readback evidence', () => {
    expect(arrivalReceipt(receipt(), context(), command(), validation())).toBe(true);
    expect(arrivalReceipt(arrivalReceiptFixture(command()), context(), command(), validation())).toBe(false);
    expect(arrivalReceipt(receipt(), arrivalContextFixture(), command(), validation())).toBe(false);
    expect(arrivalReceipt(receipt(), context(), { ...command(), fingerprint: 'b'.repeat(64) }, validation())).toBe(false);
    expect(arrivalReceipt(receipt(), context(), { ...command(), validationToken: 'y'.repeat(43) }, validation())).toBe(false);
    for (const mutate of [(r: any) => delete r.readBackVerifiedAt, (r: any) => delete r.commitAcknowledgedAt,
      (r: any) => r.dataSource = 'isolated-fixture', (r: any) => r.outcome = 'fixture-committed',
      (r: any) => r.receiptPersistence = 'durable', (r: any) => r.replayed = true,
      (r: any) => r.committedAt = '2026-10-20T07:22:05Z', (r: any) => r.readBackVerifiedAt = '2026-10-20T07:22:00Z',
      (r: any) => r.recorded.stageArrivalLocal = '2026-10-20T10:23:00',
      (r: any) => r.recorded.stageArrivalLocal = '2026-10-20T10:21:00',
      (r: any) => r.recorded.stageLate = {}, (r: any) => r.recorded.briefing = null,
      (r: any) => r.recorded.rawSQL = 'not-public', (r: any) => r.employeeId = '9002',
      (r: any) => r.commandId = '12345678-1234-4123-8123-123456789abd',
    ]) { const r = receipt(); mutate(r); expect(arrivalReceipt(r, context(), command(), validation())).toBe(false); }
  });
  it('only native errors allow operationConfirmation; unknown effect cannot be disguised', () => {
    const p = { ...arrivalProblemFixture(400, 'INVALID_REQUEST', null, 'none', 'correct-and-validate'),
      invalidParameters: [{ name: 'operationConfirmation', reason: 'required' }] };
    expect(arrivalProblem(p, 400, null, 'oracle-test')).toBe(true);
    expect(arrivalProblem(p, 400, null)).toBe(false);
    for (const code of ['DEPENDENCY_TIMEOUT', 'INTERNAL_ERROR', 'STALE_PREPARATION']) {
      const p = arrivalProblemFixture(code === 'STALE_PREPARATION' ? 409 : code === 'INTERNAL_ERROR' ? 500 : 503,
        code, command().commandId, 'unknown', 'stop');
      expect(arrivalProblem(p, p.status, command().commandId, 'oracle-test')).toBe(false);
    }
  });
});
