// Synthetic-only test data; not a runtime fallback.
import { fixtureIdentity } from './test-fixtures';
import { f1Capabilities } from './contract';
import { actorBinding, type ArrivalSelection, type StageArrivalContextDraftV1,
  type StageArrivalValidationDraftV1, type StageArrivalCommitDraftV1, type StageArrivalReceiptDraftV1 } from './stage-arrival-contract';
export function arrivalIdentityFixture() {
  const p = fixtureIdentity(); p.principal.capabilities = [...f1Capabilities];
  p.principal.resourceScope.orgUnitIds = ['0021']; return p;
}
export function arrivalSelectionFixture(): ArrivalSelection {
  return { employeeId: '9001', shiftDayId: '6201', attendanceKey: { shiftDayId: '6201' },
    orgUnitId: '0021', name: 'עובד/ת דוגמה א׳', startLocal: '2026-10-20T10:30:00',
    endLocal: '2026-10-20T18:30:00', dataSource: 'isolated-fixture', actor: actorBinding(arrivalIdentityFixture()) };
}
export function arrivalContextFixture(): StageArrivalContextDraftV1 {
  return { employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
    planned: { startLocal: '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
    recorded: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, briefing: null },
    serverTime: { instant: '2026-10-20T07:22:00.000Z', local: '2026-10-20T10:22:00', businessTimeZone: 'Asia/Jerusalem' },
    eligibility: 'eligible', blockers: [], lateReasonOptions: [{ code: '1', label: 'סיבת הדגמה בלבד' }],
    dataSource: 'isolated-fixture' };
}
export function arrivalValidationFixture(late = false): StageArrivalValidationDraftV1 {
  return { employeeId: '9001', shiftDayId: '6201', state: late ? 'warning-requires-confirmation' : 'ready',
    evaluatedAt: '2026-10-20T07:22:00.000Z', evaluatedLocal: '2026-10-20T10:22:00',
    expiresAt: late ? '2026-10-20T07:23:00.000Z' : '2026-10-20T07:24:00.000Z',
    businessTimeZone: 'Asia/Jerusalem', fingerprint: 'a'.repeat(64), validationToken: 'x'.repeat(43),
    warnings: late ? [{ code: 'STAGE_ARRIVAL_LATE', minutes: '22' }] : [], confirmationRequired: late,
    dataSource: 'isolated-fixture' };
}
export function arrivalReceiptFixture(cmd: StageArrivalCommitDraftV1): StageArrivalReceiptDraftV1 {
  return { commandId: cmd.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'fixture-committed',
    recorded: { stageArrivalLocal: '2026-10-20T10:22:05', briefing: false, stageLate: cmd.confirmation
      ? { reasonCode: cmd.draft.lateReasonCode!, minutes: '22', remark: null } : null },
    committedAt: '2026-10-20T07:22:05.000Z', businessTimeZone: 'Asia/Jerusalem',
    replayed: false, partnerCompletion: 'not-invoked', dataSource: 'isolated-fixture' };
}
export const arrivalProblemFixture = (status: number, code: string, commandId: string | null = null,
  effect = 'none', nextAction = 'stop') => ({
    type: `urn:shf:problem:${code}`, title: 'Synthetic rejection', status, code, requestId: 'synthetic-request',
    commandId, effect, nextAction,
  });
