import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StageArrivalSession } from './stage-arrival-session';
import { nativeSelectionFixture } from './native-arrival-fixtures';
import { arrivalSelectionFixture } from './stage-arrival-fixtures';
const slot = 'shfNativeArrivalSafety', attempt = '12345678-1234-4123-8123-123456789abc';
describe('Native minimal safety markers, no personal cache or authority', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.removeItem(slot); sessionStorage.removeItem('shfStageArrivalSafety'); });
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.removeItem(slot); sessionStorage.removeItem('shfStageArrivalSafety'); });
  it('survives a new document/source even when current history entry has no prior marker', () => {
    const first = new StageArrivalSession(); expect(first.begin(nativeSelectionFixture(), attempt)).toBe(true);
    history.replaceState({}, '');
    const next = new StageArrivalSession();
    expect(next.uncertain()).toBe(true); expect(next.blocked(arrivalSelectionFixture())).toBe(true);
    expect(next.blocked(nativeSelectionFixture())).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(slot)!)).toEqual([
      { commandId: attempt, kind: 'stage-arrival', mode: 'test-oracle-controlled' }]);
    expect(sessionStorage.getItem(slot)).not.toMatch(/9001|6201|actor|fingerprint|validationToken|receipt|name/);
  });
  it('fixture selection cannot resolve a native attempt as fixture proof', () => {
    const session = new StageArrivalSession(); session.begin(nativeSelectionFixture(), attempt);
    expect(session.resolve(arrivalSelectionFixture(), attempt)).toBe(false);
    expect(session.uncertain()).toBe(true);
  });
  it('known native success clears opaque pending marker but remains terminal across changed grants/unit', () => {
    const session = new StageArrivalSession(), s = nativeSelectionFixture(); session.begin(s, attempt);
    expect(session.resolve(s, attempt)).toBe(true);
    expect(sessionStorage.getItem(slot)).toBeNull(); expect(session.uncertain()).toBe(false);
    expect(session.blocked({ ...s, actor: 'changed', orgUnitId: 'new-unit' })).toBe(true);
  });
  it('known native no-effect clears safety only on explicit bound resolution', () => {
    const session = new StageArrivalSession(), s = nativeSelectionFixture(); session.begin(s, attempt);
    expect(session.resolve(s, attempt, false)).toBe(true); expect(session.blocked(s)).toBe(false);
    expect(sessionStorage.getItem(slot)).toBeNull();
  });
  for (const raw of ['not-json', '{}', '[]', '[{"commandId":"bad"}]']) {
    it(`corrupt safety (${raw}) fails closed, never proves no prior effect`, () => {
      sessionStorage.setItem(slot, raw); const session = new StageArrivalSession();
      expect(session.uncertain()).toBe(true); expect(session.begin(nativeSelectionFixture(), attempt)).toBe(false);
    });
  }
  it('unavailable marker persistence prevents native POST admission', () => {
    const session = new StageArrivalSession();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('unavailable'); });
    expect(session.begin(nativeSelectionFixture(), attempt)).toBe(false); expect(session.uncertain()).toBe(true);
  });
});
