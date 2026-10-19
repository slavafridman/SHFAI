import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForCalendarGeometry } from '../checks/calendar-geometry';

describe('H02 scoped calendar geometry checker (synthetic frames/animations, not browser geometry)', () => {
  let frame: number, host: HTMLElement;
  let priorHitTest: PropertyDescriptor | undefined;
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height, x: left, y: top, right: left + width, bottom: top + height, toJSON: () => ({}) }) as DOMRect;
  beforeEach(() => {
    frame = 0;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => { frame++; callback(performance.now()); }, 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    vi.stubGlobal('innerWidth', 320);
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(320);
    vi.spyOn(document.documentElement, 'scrollWidth', 'get').mockReturnValue(320);
    priorHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
  });
  afterEach(() => {
    host?.remove();
    if (priorHitTest) Object.defineProperty(document, 'elementFromPoint', priorHitTest);
    else Reflect.deleteProperty(document, 'elementFromPoint');
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  });
  function fixture() {
    host = document.createElement('div'); host.className = 'cdk-overlay-pane';
    const calendar = document.createElement('mat-calendar'); calendar.className = 'geometry-fixture';
    const period = document.createElement('button'); period.textContent = 'אוקטובר 2026';
    period.className = 'mat-calendar-period-button';
    const month = document.createElement('mat-month-view');
    calendar.append(period, month); host.append(calendar); document.body.append(host);
    const state = { animations: [] as Animation[], offset: () => 0, covered: false, width: 45.703125 };
    const nodes = Array.from({ length: 31 }, (_, i) => {
      const n = document.createElement('button');
      n.id = `geometry-day-${i + 1}`; n.className = 'mat-calendar-body-cell'; n.textContent = String(i + 1);
      n.setAttribute('aria-label', `Synthetic day ${i + 1}`); n.style.fontSize = '14px'; month.append(n);
      vi.spyOn(n, 'getBoundingClientRect').mockImplementation(() =>
        rect((i % 7) * state.width + state.offset(), 60 + Math.floor(i / 7) * 45.6875, state.width, 45.6875));
      return n;
    });
    vi.spyOn(calendar, 'getBoundingClientRect').mockReturnValue(rect(0, 40, 320, 350));
    const animations = vi.fn(() => state.animations);
    Object.defineProperty(host, 'getAnimations', { value: animations, configurable: true });
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: (x: number, y: number) =>
      state.covered ? host : nodes.find(n => {
        const r = n.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      }) ?? host });
    nodes[18].focus(); month.setAttribute('aria-activedescendant', nodes[18].id);
    const run = () => waitForCalendarGeometry({ selector: '.geometry-fixture', expectedPeriod: 'אוקטובר 2026',
      expectedActiveDay: '19', timeoutMs: 500 });
    return { state, nodes, month, calendar, animations, run };
  }
  const animation = (active: () => boolean, infinite = false) => ({
    get playState() { return active() ? 'running' : 'finished'; }, pending: false,
    effect: { getTiming: () => ({ iterations: infinite ? Infinity : 1 }),
      getComputedTiming: () => ({ endTime: infinite ? Infinity : 150 }) },
  }) as unknown as Animation;
  it('waits for finite popup/cell animations and then three consecutive stable rAF samples', async () => {
    const f = fixture(); f.state.animations = [animation(() => frame < 4)];
    let resolved = false; const work = f.run().then(v => { resolved = true; return v; });
    await vi.advanceTimersByTimeAsync(16 * 5); expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16);
    const data = await work;
    expect(data.signals.stableFrames).toBe(3); expect(data.signals.finiteAnimations).toBe(0);
    expect(data.signals.peakFiniteAnimations).toBe(1);
    expect(f.animations).toHaveBeenCalledWith({ subtree: true });
  });
  it('does not admit two moving samples followed by only two stable frames', async () => {
    const f = fixture(); f.state.offset = () => frame < 3 ? 3 - frame : 0;
    let resolved = false; const work = f.run().then(v => { resolved = true; return v; });
    await vi.advanceTimersByTimeAsync(16 * 4); expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16);
    expect((await work).signals.stableFrames).toBe(3);
  });
  it('ignores an infinite focus ripple inside the scoped popup without waiting on document/network idle', async () => {
    const f = fixture(); f.state.animations = [animation(() => true, true)];
    await vi.advanceTimersByTimeAsync(16); // no work until the checker is invoked
    const work = f.run(); await vi.advanceTimersByTimeAsync(16 * 3);
    const data = await work;
    expect(data.signals.ignoredInfiniteAnimations).toBe(1);
    expect(data.signals.elapsedMs).toBe(48);
  });
  it('returns stable clipped/undersize facts promptly for the unchanged caller assertions to FAIL', async () => {
    const f = fixture(); f.state.covered = true; f.state.width = 40;
    const work = f.run(); await vi.advanceTimersByTimeAsync(16 * 3);
    const data = await work;
    expect(data.signals.elapsedMs).toBe(48);
    expect(data.cells.every(c => c.width >= 44 && c.height >= 44)).toBe(false);
    expect(data.cells.every(c => c.uncovered)).toBe(false);
    // The driver must not poll until a failing static layout "happens to pass".
    expect(data.signals.stableFrames).toBe(3);
  });
  it('bounds never-completing finite animation waits with a real rejection deadline', async () => {
    const f = fixture(); f.state.animations = [animation(() => true)];
    const assertion = expect(f.run()).rejects.toThrow('Calendar geometry timeout: finite-popup-or-calendar-animation');
    await vi.advanceTimersByTimeAsync(501); await assertion;
  });
  it('rejects outgoing focus/aria/month context until the focused current day is coherent for three frames', async () => {
    const f = fixture(); f.month.setAttribute('aria-activedescendant', 'outgoing-day'); f.nodes[17].focus();
    f.calendar.setAttribute('aria-activedescendant', 'outgoing-root-day');
    f.calendar.querySelector('.mat-calendar-period-button')!.textContent = 'נובמבר 2026';
    let resolved = false; const work = f.run().then(v => { resolved = true; return v; });
    await vi.advanceTimersByTimeAsync(16 * 4); expect(resolved).toBe(false);
    f.nodes[18].focus(); f.month.setAttribute('aria-activedescendant', f.nodes[18].id);
    f.calendar.setAttribute('aria-activedescendant', f.nodes[18].id);
    f.calendar.querySelector('.mat-calendar-period-button')!.textContent = 'אוקטובר 2026';
    await vi.advanceTimersByTimeAsync(16 * 2); expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16); expect((await work).signals.stableFrames).toBe(3);
  });
});
