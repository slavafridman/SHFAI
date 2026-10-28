import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalSession } from './stage-arrival-session';
import { nativeStationSelectionFixture as selection } from './native-station-arrival-fixtures';
describe('native F2 opaque safety namespace', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.clear(); });
  afterEach(() => { history.replaceState({}, ''); sessionStorage.clear(); });
  it('same native tuple blocks opposite F1, actor change and UUID do not clear UNKNOWN', () => {
    const s = selection(), station = new StationArrivalSession(), stage = new StageArrivalSession(), id = crypto.randomUUID();
    expect(station.begin(s, id)).toBe(true); expect(station.affects({ ...s, actor: 'changed' })).toBe(true);
    expect(station.affects({ ...s, orgUnitId: '0022' })).toBe(true);
    expect(station.begin(s, crypto.randomUUID())).toBe(false); expect(stage.resolve(s, id)).toBe(false);
    expect(station.affects({ ...s, employeeId: '9002' })).toBe(false);
    expect(station.resolve({ ...s, dataSource: 'isolated-fixture' }, id)).toBe(false);
    const state = structuredClone(history.state); history.replaceState({}, '');
    const reloaded = new StationArrivalSession(); expect(reloaded.affects(s)).toBe(true);
    expect(reloaded.resolve(s, id)).toBe(false); reloaded.merge(state);
    expect(JSON.stringify(history.state)).not.toContain(s.employeeId);
    expect(sessionStorage.getItem('shfNativeStationArrivalSafety')).not.toMatch(/9001|6201|actor|fingerprint|validationToken/);
  });
  it('resolves only original source/tuple/attempt; old history cannot resurrect settled work in this process', () => {
    const s = selection(), session = new StationArrivalSession(), id = crypto.randomUUID();
    session.begin(s, id); const old = structuredClone(history.state);
    expect(session.resolve({ ...s, shiftDayId: '6202' }, id)).toBe(false);
    expect(session.resolve(s, id)).toBe(true); session.merge(old);
    expect(session.uncertain()).toBe(false); expect(session.recorded(s)).toBe(true);
    expect(sessionStorage.getItem('shfNativeStationArrivalSafety')).toBeNull();
  });
  it.each(['bad', '{}', '[]', '[{"kind":"stage-arrival"}]'])('corrupt native station marker fails closed: %s', raw => {
    sessionStorage.setItem('shfNativeStationArrivalSafety', raw);
    const session = new StationArrivalSession(); expect(session.uncertain()).toBe(true);
    expect(session.begin(selection(), crypto.randomUUID())).toBe(false);
  });
});
