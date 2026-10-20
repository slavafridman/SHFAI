// Synthetic HTTP/browser fixtures only, never native facts or business defaults.
import { jointArrivalCapabilities, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import type { StationArrivalContextV1, StationArrivalValidationV1, StationArrivalCommitV1,
  StationArrivalReceiptV1 } from './station-arrival-contract';
export const stationIdentityFixture = (): IdentityResponseV1 => ({
  principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
    capabilities: [...jointArrivalCapabilities], resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'isolated-fixture',
});
export const stationSelectionFixture = (): ArrivalSelection => ({
  employeeId: '9001', shiftDayId: '6201', attendanceKey: { shiftDayId: '6201' }, orgUnitId: '0021',
  name: 'עובד סימולציה', startLocal: '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00',
  actor: actorBinding(stationIdentityFixture()), dataSource: 'isolated-fixture',
});
export const stationContextFixture = (late = false): StationArrivalContextV1 => ({
  employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
  planned: { startLocal: late ? '2026-10-20T10:00:00' : '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
  recorded: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, briefing: false },
  serverTime: { instant: '2026-10-20T07:22:06.000Z', local: '2026-10-20T10:22:06', businessTimeZone: 'Asia/Jerusalem' },
  arrivalWindow: { earliestLocal: late ? '2026-10-20T09:00:00' : '2026-10-20T09:30:00', latestLocal: '2026-10-20T18:30:00' },
  withinArrivalWindow: true, eligibility: 'eligible', blockers: [],
  lateReasonOptions: [{ code: '1', label: 'סיבה סינתטית בלבד' }], dataSource: 'isolated-fixture',
});
export const stationValidationFixture = (late = false): StationArrivalValidationV1 => ({
  employeeId: '9001', shiftDayId: '6201', state: late ? 'warning-requires-confirmation' : 'ready',
  evaluatedAt: '2026-10-20T07:22:06.000Z', evaluatedLocal: '2026-10-20T10:22:06',
  expiresAt: '2026-10-20T07:24:06.000Z', businessTimeZone: 'Asia/Jerusalem',
  fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43),
  warnings: late ? [{ code: 'STATION_ARRIVAL_LATE', minutes: '22' }] : [], confirmationRequired: late,
  dataSource: 'isolated-fixture',
});
export const stationReceiptFixture = (cmd: StationArrivalCommitV1, c = stationContextFixture()): StationArrivalReceiptV1 => ({
  commandId: cmd.commandId, employeeId: c.employeeId, shiftDayId: c.shiftDayId, outcome: 'fixture-committed',
  recorded: { stageArrivalLocal: c.recorded.stageArrivalLocal, stationArrivalLocal: '2026-10-20T10:22:10',
    stationExitLocal: null, briefing: c.recorded.briefing,
    stationLate: cmd.confirmation ? { reasonCode: cmd.draft.lateReasonCode!, minutes: '22', remark: null } : null },
  committedAt: '2026-10-20T07:22:10.000Z', businessTimeZone: 'Asia/Jerusalem', replayed: false,
  partnerCompletion: 'not-invoked', dataSource: 'isolated-fixture',
});
