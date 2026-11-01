import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NativeCommandSession } from './native-command-session';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StationExitSession } from './station-exit-session';
import { ShiftManagementSession } from './shift-management-session';
import { lateSelectionFixture as selection } from './station-arrival-late-fixtures';
describe('canonical50 employee UI quarantine — NOT server coordinator authority', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it.each(['F1', 'F2', 'late', 'exit', '49'])('%s UNKNOWN shares employee block across all days/actors/sources/fresh UUID', kind => {
    const global = new NativeCommandSession(), s = selection(), attempt = crypto.randomUUID();
    const stage = new StageArrivalSession(global), station = new StationArrivalSession(global),
      exit = new StationExitSession(global), management = new ShiftManagementSession(global);
    expect(kind === 'F1' ? stage.begin(s, attempt) : kind === 'exit' ? exit.begin(s, attempt) :
      kind === '49' ? management.begin(s.employeeId, 'volatile', attempt) : station.begin(s, attempt)).toBe(true);
    const changed = { ...s, shiftDayId: '6202', attendanceKey: { shiftDayId: '6202' },
      actor: 'different', orgUnitId: 'other', dataSource: 'isolated-fixture' as const };
    expect(stage.affects(changed)).toBe(true); expect(station.affects(changed)).toBe(true);
    expect(exit.affects(changed)).toBe(true); expect(management.affectsEmployee(s.employeeId)).toBe(true);
    expect(global.affectsEmployee('9002')).toBe(false);
    expect(global.begin(s.employeeId, crypto.randomUUID())).toBe(false);
    const raw = sessionStorage.getItem('shfNativeCommandSafety')!;
    expect(JSON.parse(raw)).toEqual([attempt]); expect(raw).not.toMatch(/9001|6201|volatile|actor|token|receipt|fingerprint/);
    history.replaceState({}, '');
    const reload = new NativeCommandSession(); expect(reload.affectsEmployee('9002')).toBe(true);
    expect(reload.resolve(s.employeeId, attempt)).toBe(false);
    expect(reload.begin(s.employeeId, crypto.randomUUID())).toBe(false);
  });
  it.each(['not-json', '{}', '[]', '["bad"]'])('corrupt opaque store %s fails closed', raw => {
    sessionStorage.setItem('shfNativeCommandSafety', raw);
    expect(new NativeCommandSession().begin('9001', crypto.randomUUID())).toBe(false);
  });
  it('old native marker after upgrade blocks other families, not only its old tuple', () => {
    sessionStorage.setItem('shfNativeArrivalSafety', JSON.stringify([{ commandId: crypto.randomUUID(),
      kind: 'stage-arrival', mode: 'test-oracle-controlled' }]));
    const global = new NativeCommandSession();
    expect(new StationExitSession(global).begin(selection(), crypto.randomUUID())).toBe(false);
    expect(new ShiftManagementSession(global).begin('9002', 'new', crypto.randomUUID())).toBe(false);
  });
  it('binding is volatile and cannot be restored from settled history; persistence failure blocks dispatch', () => {
    const global = new NativeCommandSession(), attempt = crypto.randomUUID();
    expect(global.begin('9001', attempt)).toBe(true); const old = structuredClone(history.state);
    expect(global.resolve('9002', attempt)).toBe(false); expect(global.resolve('9001', attempt)).toBe(true);
    global.merge(old); expect(global.affectsEmployee('9001')).toBe(false);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('synthetic denied'); });
    expect(global.begin('9001', crypto.randomUUID())).toBe(false); expect(global.affectsEmployee('9001')).toBe(true);
  });
});
