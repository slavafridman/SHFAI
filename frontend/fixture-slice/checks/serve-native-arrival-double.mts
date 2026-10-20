// EXPLICIT SYNTHETIC HTTP DOUBLE ONLY. This is NOT the native adapter.
// Canonical imports are TYPE-ONLY. No backend runtime, ENV/configuration,
// Oracle client, credentials, private binding, allowance file or SQL access.
import { createServer, type ServerResponse } from 'node:http';
import type { IdentityResponseV1, EmployeeShiftDayResponseV1 } from '../../../backend/fixture-slice/contracts.mts';
import type { AttendanceFilterContextV1, AttendanceListV1 } from '../../../backend/fixture-slice/attendance-contracts.mts';
import type { NativeStageArrivalContextV1, NativeStageArrivalValidationV1,
  NativeStageArrivalCommitV1, NativeStageArrivalReceiptV1,
  NativeStageArrivalProblemV1 } from '../../../backend/fixture-slice/oracle-stage-arrival-contracts.mts';
if (!process.argv.includes('--synthetic-native-http-double')) throw Error('Explicit synthetic HTTP double opt-in required');
const p: IdentityResponseV1 = { principal: {
  subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
  displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
  capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read',
    'employee:read', 'attendance:read', 'attendance-stage-arrival:prepare', 'attendance-stage-arrival:commit',
    'attendance-stage-arrival:test-oracle-write'], resourceScope: { orgUnitIds: ['0021'] },
}, dataSource: 'oracle' };
const c: NativeStageArrivalContextV1 = { employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
  planned: { startLocal: '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
  recorded: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, briefing: false },
  serverTime: { instant: '2026-10-20T07:22:00.000Z', local: '2026-10-20T10:22:00', businessTimeZone: 'Asia/Jerusalem' },
  eligibility: 'eligible', blockers: [], lateReasonOptions: [], dataSource: 'oracle-test' };
const v: NativeStageArrivalValidationV1 = { employeeId: '9001', shiftDayId: '6201', state: 'ready',
  evaluatedAt: '2026-10-20T07:22:00.000Z', evaluatedLocal: '2026-10-20T10:22:00', expiresAt: '2026-10-20T07:24:00.000Z',
  businessTimeZone: 'Asia/Jerusalem', fingerprint: 'a'.repeat(64), validationToken: 'x'.repeat(43),
  warnings: [], confirmationRequired: false, dataSource: 'oracle-test' };
const context: AttendanceFilterContextV1 = {
  defaults: { attendanceDate: '2026-10-20', timeFrom: '10:30', timeTo: '10:30',
    mokedCode: '0012', teamCodes: [], innerJobCodes: [], workLocations: [] },
  mokedOptions: [{ code: '0012', label: 'מוקד סינתטי', unitType: 'G01' }],
  teamOptions: [{ code: '0021', label: 'צוות סינתטי', unitType: 'J01', parentMokedCode: '0012' }],
  innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only' };
let accepted = false;
const counts = { contexts: 0, validations: 0, commandAttempts: 0, syntheticAccepted: 0 };
function json(res: ServerResponse, body: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': status === 200 ? 'application/json' : 'application/problem+json',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body));
}
function invalid(res: ServerResponse, commandId: string | null = null) {
  const problem: NativeStageArrivalProblemV1 = { type: 'urn:shf:problem:INVALID_REQUEST',
    title: 'SYNTHETIC HTTP double refusal', status: 400, code: 'INVALID_REQUEST', requestId: 'synthetic-double',
    commandId, effect: 'none', nextAction: 'correct-and-validate' };
  json(res, problem, 400);
}
const exact = (value: unknown, names: string): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === names.split(' ').sort().join(',');
function command(value: unknown): value is NativeStageArrivalCommitV1 {
  return exact(value, 'commandId draft validationToken fingerprint confirmation operationConfirmation') &&
    typeof value.commandId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.commandId) &&
    value.validationToken === v.validationToken && value.fingerprint === v.fingerprint && value.confirmation === null &&
    exact(value.draft, 'lateReasonCode lateRemark') && value.draft.lateReasonCode === null && value.draft.lateRemark === null &&
    exact(value.operationConfirmation, 'accepted') && value.operationConfirmation.accepted === true;
}
const base = '/api/v1/employees/9001/shift-days/6201';
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1'), path = url.pathname;
  if (req.method === 'GET' && path === '/api/v1/identity') return json(res, p);
  if (req.method === 'GET' && path === '/api/v1/attendance/filter-context') return json(res, context);
  if (req.method === 'GET' && path === '/api/v1/attendance') {
    const list: AttendanceListV1 = { items: [{ shiftDayId: '6201',
      employee: { employeeId: '9001', firstName: 'עובד/ת', lastName: 'SYNTHETIC HTTP DOUBLE',
        unit: { code: '0021', label: 'צוות סינתטי', moked: { code: '0012', label: 'מוקד סינתטי', unitType: 'G01' } } },
      planned: { ...c.planned, workingFromHome: false, activities: [], activityFallback: null, innerJob: null },
      attendance: { stageArrivalLocal: accepted ? '2026-10-20T10:22:05' : null,
        stationArrivalLocal: null, stationExitLocal: null, missingReasonCode: null, briefingRecorded: false } }],
      applied: { attendanceDate: url.searchParams.get('attendanceDate')!, timeFrom: url.searchParams.get('timeFrom')!,
        timeTo: url.searchParams.get('timeTo')!, mokedCode: url.searchParams.get('mokedCode'),
        teamCodes: [], innerJobCodes: [], workLocations: [], sort: 'effective-start-asc' },
      page: { limit: 25, offset: 0, hasMore: false, nextOffset: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only' };
    return json(res, list);
  }
  if (req.method === 'GET' && path === base) {
    const detail: EmployeeShiftDayResponseV1 = { employeeId: '9001', shiftDayId: '6201',
      employee: { firstName: 'עובד/ת', lastName: 'SYNTHETIC HTTP DOUBLE', orgUnitId: '0021' },
      effectiveShift: { ...c.planned, activityData: null, siteId: null },
      attendance: { stageArrivalLocal: accepted ? '2026-10-20T10:22:05' : null, stationArrivalLocal: null, stationExitLocal: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle' };
    return json(res, detail);
  }
  if (url.search || !path.startsWith(base + '/stage-arrival/')) return invalid(res);
  if (req.method === 'GET' && path.endsWith('/context')) {
    counts.contexts++;
    const current: NativeStageArrivalContextV1 = accepted ? { ...c, eligibility: 'already-recorded',
      recorded: { ...c.recorded, stageArrivalLocal: '2026-10-20T10:22:05' } } : c;
    return json(res, current);
  }
  if (req.method !== 'POST') return invalid(res);
  let text = '';
  for await (const chunk of req) {
    text += String(chunk); if (Buffer.byteLength(text) > 16384) return invalid(res);
  }
  let body: unknown; try { body = JSON.parse(text); } catch { return invalid(res); }
  if (path.endsWith('/validations')) {
    if (!exact(body, 'lateReasonCode lateRemark') || body.lateReasonCode !== null || body.lateRemark !== null) return invalid(res);
    counts.validations++; return json(res, v); // PURE: no synthetic acceptance.
  }
  if (!path.endsWith('/commands')) return invalid(res);
  counts.commandAttempts++;
  if (!command(body) || accepted) return invalid(res);
  accepted = true; counts.syntheticAccepted++;
  const receipt: NativeStageArrivalReceiptV1 = { commandId: body.commandId, employeeId: '9001', shiftDayId: '6201',
    outcome: 'oracle-test-committed', dataSource: 'oracle-test',
    recorded: { stageArrivalLocal: '2026-10-20T10:22:05', briefing: false, stageLate: null },
    commitAcknowledgedAt: '2026-10-20T07:22:06.000Z', readBackVerifiedAt: '2026-10-20T07:22:07.000Z',
    businessTimeZone: 'Asia/Jerusalem', replayed: false, receiptPersistence: 'none', partnerCompletion: 'not-invoked' };
  // Intentional bounded DOUBLE latency for native keyboard pending checks.
  setTimeout(() => json(res, receipt), 1500);
  console.log('SYNTHETIC HTTP DOUBLE counters, NOT Oracle effects', counts);
});
server.listen(4407, '127.0.0.1', () => console.log('SYNTHETIC NATIVE HTTP DOUBLE READY 4407 — NOT Oracle/native adapter'));
const close = () => { server.close(); server.closeAllConnections(); };
process.once('SIGINT', close); process.once('SIGTERM', close);
