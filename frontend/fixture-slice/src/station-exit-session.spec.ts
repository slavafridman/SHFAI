import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { StationExitSession } from './station-exit-session';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { exitSelectionFixture as selection } from './station-exit-fixtures';
describe('§47 exit opaque safety, cross-source tuple interlock', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it('uses only its own namespace; same tuple blocks despite source/actor/unit change', () => {
    const s = selection(), session = new StationExitSession(), attempt = crypto.randomUUID();
    expect(session.begin(s, attempt)).toBe(true);
    expect(history.state.shfNativeStationExitSafety).toEqual([{ commandId: attempt, kind: 'station-exit', mode: 'test-oracle-controlled' }]);
    expect(session.affects({ ...s, dataSource: 'isolated-fixture', actor: 'changed', orgUnitId: 'other' })).toBe(true);
    expect(session.affects({ ...s, employeeId: '9002' })).toBe(false);
    expect(session.begin(s, crypto.randomUUID())).toBe(false);
    expect(JSON.stringify(history.state)).not.toMatch(/9001|6201|actor|fingerprint|validationToken|receipt/);
    expect(new StageArrivalSession().resolve(s, attempt)).toBe(false);
    expect(new StationArrivalSession().resolve(s, attempt)).toBe(false);
  });
  it('reload/history cannot restore bindings or escape UNKNOWN with a fresh UUID', () => {
    const session = new StationExitSession(), s = selection(), attempt = crypto.randomUUID();
    session.begin(s, attempt); const old = structuredClone(history.state); history.replaceState({}, '');
    const reload = new StationExitSession();
    expect(reload.affects({ ...s, employeeId: '9002' })).toBe(true);
    expect(reload.resolve(s, attempt)).toBe(false); expect(reload.begin(s, crypto.randomUUID())).toBe(false);
    reload.merge(old); expect(reload.uncertain()).toBe(true);
  });
  it('only original source/tuple can resolve; settled history does not resurrect in this process', () => {
    const session = new StationExitSession(), s = selection(), attempt = crypto.randomUUID();
    session.begin(s, attempt); const old = structuredClone(history.state);
    expect(session.resolve({ ...s, dataSource: 'isolated-fixture' }, attempt)).toBe(false);
    expect(session.resolve({ ...s, shiftDayId: '6202' }, attempt)).toBe(false);
    expect(session.resolve(s, attempt)).toBe(true); session.merge(old);
    expect(session.uncertain()).toBe(false); expect(session.recorded(s)).toBe(true);
    expect(sessionStorage.getItem('shfNativeStationExitSafety')).toBeNull();
  });
  it.each(['bad', '{}', '[]', '[{"kind":"station-arrival"}]'])('corrupt persisted marker blocks all commands: %s', raw => {
    sessionStorage.setItem('shfNativeStationExitSafety', raw);
    expect(new StationExitSession().begin(selection(), crypto.randomUUID())).toBe(false);
  });
  it('storage failure blocks dispatch conservatively', () => {
    const session = new StationExitSession();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('denied'); });
    expect(session.begin(selection(), crypto.randomUUID())).toBe(false); expect(session.uncertain()).toBe(true);
  });
  for (const Mode of [StageArrivalSession, StationArrivalSession]) for (const dataSource of ['oracle-test', 'isolated-fixture'] as const) {
    it(`${Mode.name}/${dataSource} unresolved tuple affects exit across source change`, () => {
      const session = new Mode(), s = { ...selection(), dataSource };
      expect(session.begin(s, crypto.randomUUID())).toBe(true);
      expect(session.crossAffects({ ...s, dataSource: dataSource === 'oracle-test' ? 'isolated-fixture' : 'oracle-test' })).toBe(true);
      expect(session.crossAffects({ ...s, employeeId: '9002' })).toBe(false);
    });
  }
});
