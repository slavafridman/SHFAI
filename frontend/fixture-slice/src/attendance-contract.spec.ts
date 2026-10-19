import { describe, expect, it } from 'vitest';
import { attendanceContext, attendanceList, attendanceProblem, attendanceRow } from './attendance-contract';
import { attendanceContextFixture, attendanceListFixture, attendanceRequestFixture, attendanceRowFixture } from './attendance-fixtures';
import { coherentSource } from './current-shifts-contract';
import { identity } from './contract';
import { fixtureIdentity } from './test-fixtures';

describe('attendance §35/36/37 exact boundary regressions', () => {
  it('requires seven ordered unique synthetic rights, null actor and no invented capability', () => {
    const p = fixtureIdentity(); expect(identity(p)).toBe(true);
    p.principal.capabilities.reverse(); expect(identity(p)).toBe(false);
    const duplicate = fixtureIdentity(); duplicate.principal.capabilities.push('attendance:read'); expect(identity(duplicate)).toBe(false);
    const old = fixtureIdentity(); old.principal.capabilities.pop(); expect(identity(old)).toBe(false);
    const linked = fixtureIdentity(); linked.principal.employeeId = '1001'; expect(identity(linked)).toBe(false);
  });
  it('isolates Oracle read-only resources from identity/detail oracle markers and all fixture combinations', () => {
    expect(coherentSource('oracle', 'oracle-read-only')).toBe(true);
    expect(coherentSource('oracle', 'isolated-fixture')).toBe(false);
    expect(coherentSource('isolated-fixture', 'oracle-read-only')).toBe(false);
    const ctx = attendanceContextFixture(); ctx.dataSource = 'oracle-read-only';
    const list = attendanceListFixture(); list.dataSource = 'oracle-read-only';
    expect(attendanceList(list, attendanceRequestFixture(), ctx)).toBe(true);
  });
  it('preserves leading-zero exact distinct team/direct-parent identifiers', () => {
    const ctx = attendanceContextFixture(); ctx.mokedOptions[0].code = '01';
    ctx.teamOptions[0].code = '001'; ctx.teamOptions[0].parentMokedCode = '01';
    const list = attendanceListFixture(); list.items[0].employee.unit.code = '001';
    list.items[0].employee.unit.moked.code = '01';
    expect(attendanceContext(ctx)).toBe(true); expect(attendanceList(list, attendanceRequestFixture(), ctx)).toBe(true);
    list.items[0].employee.unit.code = '01'; expect(attendanceList(list, attendanceRequestFixture(), ctx)).toBe(false);
  });
  it('accepts empty scoped context with no default parent and no widening', () => {
    const ctx = attendanceContextFixture(); ctx.mokedOptions = []; ctx.teamOptions = []; ctx.innerJobOptions = [];
    expect(attendanceContext(ctx)).toBe(true);
    expect(attendanceList(attendanceListFixture(undefined, []), attendanceRequestFixture(), ctx)).toBe(true);
    expect(attendanceList(attendanceListFixture(), attendanceRequestFixture(), ctx)).toBe(false);
  });
  for (const kind of ['wrong-team-kind', 'wrong-parent-kind', 'missing-parent', 'duplicate-team', 'duplicate-role', 'unknown-default-role'] as const) {
    it(`rejects ${kind} context atomically rather than selecting a first catalog match`, () => {
      const ctx = attendanceContextFixture();
      if (kind === 'wrong-team-kind') ctx.teamOptions[0].unitType = 'G01' as 'J01';
      if (kind === 'wrong-parent-kind') ctx.mokedOptions[0].unitType = 'J01' as 'G01';
      if (kind === 'missing-parent') ctx.teamOptions[0].parentMokedCode = 'ABSENT';
      if (kind === 'duplicate-team') ctx.teamOptions.push(ctx.teamOptions[0]);
      if (kind === 'duplicate-role') ctx.innerJobOptions.push(ctx.innerJobOptions[0]);
      if (kind === 'unknown-default-role') ctx.defaults.innerJobCodes.push('999');
      expect(attendanceContext(ctx)).toBe(false);
    });
  }
  it('does not equate display home fallback with raw source membership', () => {
    const request = { ...attendanceRequestFixture(), workLocations: ['home', 'site'] as ('home' | 'site')[] };
    const list = attendanceListFixture(request);
    // Branch filter can differ from effective display fallback; only backend
    // knows the raw value. UI must not discard/reclassify this accepted row.
    list.items[0].planned.workingFromHome = null;
    expect(attendanceList(list, request, attendanceContextFixture())).toBe(true);
  });
  it('retains full local endpoint independence, Gregorian bounds and plaintext activity tokens', () => {
    const row = attendanceRowFixture();
    row.planned.startLocal = '0001-01-01T00:00:00'; row.planned.endLocal = '9999-12-31T23:59:59';
    row.attendance = { stageArrivalLocal: '9999-12-31T23:59:59', stationArrivalLocal: null,
      stationExitLocal: '0001-01-01T00:00:00', missingReasonCode: '-99999999999999999999999999999999999999', briefingRecorded: true };
    row.planned.activities = [{ code: '00;<img>', label: '<img src=x onerror=alert(1)>' }];
    expect(attendanceRow(row)).toBe(true);
    row.attendance.missingReasonCode = '-0'; expect(attendanceRow(row)).toBe(false);
  });
  it('checks exact applied lists, date, page ceiling/lookahead, row order and duplicate day independently', () => {
    const ctx = attendanceContextFixture(), req = attendanceRequestFixture();
    const list = attendanceListFixture();
    list.applied.attendanceDate = '2026-10-18'; expect(attendanceList(list, req, ctx)).toBe(false);
    list.applied.attendanceDate = req.attendanceDate;
    list.page.nextOffset = 25; expect(attendanceList(list, req, ctx)).toBe(false);
    list.page.nextOffset = null; list.items.push(list.items[0]); expect(attendanceList(list, req, ctx)).toBe(false);
    list.items = [attendanceRowFixture('5202'), attendanceRowFixture('5201')];
    expect(attendanceList(list, req, ctx)).toBe(false);
    list.items.reverse(); expect(attendanceList(list, req, ctx)).toBe(true);
    list.items[0].planned.startLocal = null; expect(attendanceList(list, req, ctx)).toBe(false);
    list.items.reverse(); expect(attendanceList(list, req, ctx)).toBe(true);
  });
  it('does not mistake foreign/wrong-status problems for attendance authorization failures', () => {
    const p = { code: 'FORBIDDEN', type: 'urn:shf:problem:FORBIDDEN', title: 'Synthetic', status: 500, requestId: 'test' };
    expect(attendanceProblem(p, 403)).toBe(false); expect(attendanceProblem(p, 500)).toBe(false);
    expect(attendanceProblem({ ...p, code: 'SHIFT_DAY_NOT_FOUND', type: 'urn:shf:problem:SHIFT_DAY_NOT_FOUND', status:404 },404)).toBe(false);
  });
});
