import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalSession } from './stage-arrival-session';
import { stationSelectionFixture } from './station-arrival-fixtures';
const attempt = '12345678-1234-4123-8123-123456789abc';
describe('operation-specific F1/F2 opaque safety', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it('retains both namespaces without allowing cross-kind resolution', () => {
    const stage = new StageArrivalSession(), station = new StationArrivalSession(), s = stationSelectionFixture();
    expect(stage.begin(s, attempt)).toBe(true); expect(station.resolve(s, attempt)).toBe(false);
    expect(station.begin({ ...s, employeeId: '9002' }, crypto.randomUUID())).toBe(true);
    expect(Object.keys(history.state).sort()).toEqual(['shfF1Safety', 'shfF2Safety']);
    expect(stage.uncertain()).toBe(true); expect(station.uncertain()).toBe(true);
  });
  it('same source/tuple stays dependent after actor change, unrelated row/native is not F2 uncertainty', () => {
    const station = new StationArrivalSession(), s = stationSelectionFixture(); station.begin(s, attempt);
    expect(station.affects({ ...s, actor: 'changed' })).toBe(true);
    expect(station.affects({ ...s, employeeId: '9002', shiftDayId: '6202' })).toBe(false);
    expect(station.affects({ ...s, dataSource: 'oracle-test' })).toBe(false);
    expect(new StageArrivalSession().uncertain()).toBe(false);
  });
  it('F1 fixture safety survives new document independently of native/F2', () => {
    const s = stationSelectionFixture(), stage = new StageArrivalSession(); stage.begin(s, attempt);
    history.replaceState({}, '');
    expect(new StageArrivalSession().uncertain()).toBe(true);
    expect(new StationArrivalSession().uncertain()).toBe(false);
    expect(sessionStorage.getItem('shfNativeArrivalSafety')).toBeNull();
    expect(sessionStorage.getItem('shfStageArrivalSafety')).not.toMatch(/9001|6201|reason|actor|token/);
  });
  it('settled attempt is not resurrected by older entry in same document; no receipt cached', () => {
    const station = new StationArrivalSession(), s = stationSelectionFixture(); station.begin(s, attempt);
    const old = structuredClone(history.state); expect(station.resolve(s, attempt)).toBe(true);
    station.merge(old); expect(station.uncertain()).toBe(false); expect(station.recorded(s)).toBe(true);
    expect(sessionStorage.getItem('shfStationArrivalSafety')).toBeNull();
    expect(station.begin(s, crypto.randomUUID())).toBe(false);
  });
  it.each(['bad', '{}', '[]', '["not-a-uuid"]'])('corrupt F2 safety fails closed: %s', raw => {
    sessionStorage.setItem('shfStationArrivalSafety', raw); const station = new StationArrivalSession();
    expect(station.uncertain()).toBe(true); expect(station.begin(stationSelectionFixture(), attempt)).toBe(false);
  });
  it('unavailable safety storage forbids dispatch admission', () => {
    const station = new StationArrivalSession();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('storage unavailable'); });
    expect(station.begin(stationSelectionFixture(), attempt)).toBe(false); expect(station.uncertain()).toBe(true);
  });
});
