// Test-driver only. Self-contained so the same function can run in Chrome via
// Runtime.evaluate and in focused checker regressions. No application imports.
export interface CalendarGeometryOptions {
  selector: string;
  expectedPeriod: string;
  expectedActiveDay: string;
  expectedCells?: number;
  timeoutMs?: number;
}
export interface CalendarGeometrySnapshot {
  viewport: number;
  client: number;
  page: number;
  font: string;
  calendar: number;
  cells: Array<{
    day: string; label: string | null;
    width: number; height: number; left: number; right: number; top: number; bottom: number;
    uncovered: boolean;
  }>;
  signals: {
    stableFrames: number;
    finiteAnimations: number;
    peakFiniteAnimations: number;
    ignoredInfiniteAnimations: number;
    elapsedMs: number;
  };
}
export function waitForCalendarGeometry(options: CalendarGeometryOptions): Promise<CalendarGeometrySnapshot> {
  const { selector, expectedPeriod, expectedActiveDay, expectedCells = 31, timeoutMs = 5000 } = options;
  return new Promise((resolve, reject) => {
    const started = performance.now();
    let raf = 0, stableFrames = 0, priorKey = '', priorNodes: Element[] = [];
    let priorCalendar: Element | null = null, peakFinite = 0, ignoredInfinite = 0, reason = 'not-mounted';
    let done = false;
    const stop = () => { done = true; cancelAnimationFrame(raf); clearTimeout(deadline); };
    const deadline = setTimeout(() => {
      stop();
      reject(new Error(`Calendar geometry timeout: ${reason}; stableFrames=${stableFrames}; peakFinite=${peakFinite}`));
    }, timeoutMs);
    const reset = (why: string) => {
      reason = why; stableFrames = 0; priorKey = ''; priorNodes = []; priorCalendar = null;
    };
    const activeAnimations = (pane: Element): number => {
      // Scope is the actual popup and its positioning ancestors, never document
      // animations/network idle. Descendant focus ripples with infinite timing
      // are explicitly ignored; finite entry/month/cell transitions must finish.
      const animations = new Set(pane.getAnimations?.({ subtree: true }) ?? []);
      let ancestor = pane.parentElement;
      while (ancestor && !ancestor.classList.contains('cdk-overlay-container')) {
        for (const animation of ancestor.getAnimations?.() ?? []) animations.add(animation);
        ancestor = ancestor.parentElement;
      }
      let active = 0, infinite = 0;
      for (const animation of animations) {
        if (!animation.effect || (!animation.pending && ['finished', 'idle'].includes(animation.playState))) continue;
        const timing = animation.effect.getComputedTiming(), iterations = animation.effect.getTiming().iterations;
        if (!Number.isFinite(timing.endTime) || !Number.isFinite(iterations)) { infinite++; continue; }
        active++;
      }
      peakFinite = Math.max(peakFinite, active); ignoredInfinite = Math.max(ignoredInfinite, infinite);
      return active;
    };
    const frame = () => {
      if (done) return;
      try {
        const calendars = document.querySelectorAll(selector), calendar = calendars.length === 1 ? calendars[0] : null;
        const pane = calendar?.closest('.cdk-overlay-pane');
        const nodes = calendar ? [...calendar.querySelectorAll<HTMLButtonElement>('.mat-calendar-body-cell')] : [];
        const period = calendar?.querySelector('.mat-calendar-period-button')?.textContent?.replace(/\s+/g, ' ').trim();
        const focused = document.activeElement?.closest('.mat-calendar-body-cell');
        const ariaOwners = calendar ? [calendar, ...calendar.querySelectorAll('[aria-activedescendant]')] : [];
        const ariaCurrent = ariaOwners.every(owner => {
          const id = owner.getAttribute('aria-activedescendant');
          return !id || nodes.some(n => n.id === id);
        });
        if (!calendar || !pane || !calendar.querySelector('mat-month-view') || nodes.length !== expectedCells) {
          reset('missing-or-outgoing-month');
        } else if (period !== expectedPeriod || !focused || !nodes.includes(focused as HTMLButtonElement) ||
            focused.textContent?.trim() !== expectedActiveDay || !ariaCurrent) {
          reset('focus-period-or-aria-not-current');
        } else if (activeAnimations(pane)) {
          reset('finite-popup-or-calendar-animation');
        } else {
          const cells = nodes.map(n => {
            const r = n.getBoundingClientRect();
            return { day: n.textContent?.trim() ?? '', label: n.getAttribute('aria-label'),
              width: r.width, height: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom,
              uncovered: [[r.left + 1, r.top + 1], [r.right - 1, r.top + 1],
                [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1]]
                .every(([x, y]) => n.contains(document.elementFromPoint(x, y))) };
          });
          const data = { viewport: innerWidth, client: document.documentElement.clientWidth,
            page: document.documentElement.scrollWidth, font: getComputedStyle(nodes[0]).fontSize,
            calendar: calendar.getBoundingClientRect().width, cells };
          // Geometry reads can flush styles and start a CSS transition; sample
          // the scoped animation state again AFTER the reads/hit tests.
          if (activeAnimations(pane)) reset('animation-started-during-style-flush');
          else if (cells.some(c => c.width <= 0 || c.height <= 0)) reset('zero-geometry');
          else {
            const key = JSON.stringify(data);
            const sameNodes = calendar === priorCalendar && nodes.every((n, i) => n === priorNodes[i]);
            stableFrames = sameNodes && key === priorKey ? stableFrames + 1 : 1;
            priorKey = key; priorNodes = nodes; priorCalendar = calendar; reason = 'waiting-for-three-stable-frames';
            if (stableFrames >= 3) {
              stop();
              // Settled does not mean conforming: return persistent clipping
              // or undersize unchanged for the caller's original assertions to
              // FAIL immediately, rather than waiting until it happens to pass.
              resolve({ ...data, signals: { stableFrames, finiteAnimations: 0, peakFiniteAnimations: peakFinite,
                ignoredInfiniteAnimations: ignoredInfinite, elapsedMs: performance.now() - started } });
              return;
            }
          }
        }
        raf = requestAnimationFrame(frame);
      } catch (error) { stop(); reject(error); }
    };
    raf = requestAnimationFrame(frame);
  });
}
