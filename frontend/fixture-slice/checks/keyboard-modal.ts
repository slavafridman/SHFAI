// Test-driver only. One shared admission barrier before native modal Escape.
// Observes standard Material/CDK/native-dialog state; never closes/focuses an
// overlay, disables animations or sends a recovery key.
export function waitForKeyboardModalReady(timeoutMs = 5000): Promise<{
  kind: string; scopeId: string; paneId: string; focusedId: string; focusedTag: string;
  hasFocus: boolean; stableFrames: number; finiteAnimations: number; peakFiniteAnimations: number;
}> {
  return new Promise((resolve, reject) => {
    let raf = 0, done = false, frames = 0, prior = '', peak = 0, reason = 'no-live-modal';
    let scope: Element | null = null, kind = '', trigger: Element | null = null;
    let priorControls: Element[] = [], priorFocus: Element | null = null;
    const stop = () => { done = true; cancelAnimationFrame(raf); clearTimeout(deadline); };
    const deadline = setTimeout(() => {
      stop(); reject(new Error(`Keyboard modal not ready: ${reason}; kind=${kind}; stableFrames=${frames}; peakFinite=${peak}`));
    }, timeoutMs);
    const frame = () => {
      if (done) return;
      try {
        if (!scope) {
          const panels = [...document.querySelectorAll('[role="listbox"]')];
          for (const panel of panels.reverse()) {
            const owner = [...document.querySelectorAll('[role="combobox"][aria-expanded="true"]')]
              .find(n => n.getAttribute('aria-controls') === panel.id);
            if (owner) { scope = panel; trigger = owner; kind = 'select'; break; }
          }
          if (!scope) {
            scope = document.querySelector('mat-datepicker-content');
            if (scope) kind = 'calendar';
          }
          if (!scope) {
            scope = [...document.querySelectorAll('mat-dialog-container')].at(-1) ?? null;
            if (scope) kind = 'dialog';
          }
          if (!scope) {
            scope = [...document.querySelectorAll('dialog[open]')].at(-1) ?? null;
            if (scope) kind = 'native-dialog';
          }
        }
        const focus = document.activeElement, pane = scope?.closest('.cdk-overlay-pane');
        const hasFocus = document.hasFocus() && document.visibilityState === 'visible';
        const inScope = !!scope && !!focus && (scope.contains(focus) || (kind === 'select' && focus === trigger));
        // A closing select may still be the top keyboard-dispatcher entry even
        // after focus/aria have returned to its underlying dialog.
        const blockingPanel = !!scope && kind !== 'select' && [...document.querySelectorAll('[role="listbox"]')]
          .some(p => p.getClientRects().length > 0);
        const roots = pane ? [pane] : scope ? [scope] : [];
        const finite = () => {
          const animations = new Set(roots.flatMap(n => n.getAnimations?.({ subtree:true }) ?? []));
          let ancestor = pane?.parentElement;
          while (ancestor && !ancestor.classList.contains('cdk-overlay-container')) {
            for (const a of ancestor.getAnimations?.() ?? []) animations.add(a);
            ancestor = ancestor.parentElement;
          }
          const count = [...animations].filter(a => a.effect &&
            (a.pending || !['finished','idle'].includes(a.playState)) &&
            Number.isFinite(a.effect.getComputedTiming().endTime) &&
            Number.isFinite(a.effect.getTiming().iterations)).length;
          peak = Math.max(peak,count); return count;
        };
        const active = finite();
        const controls = scope ? [...scope.querySelectorAll('.mat-calendar-body-cell,[role="option"],button,input,[role="combobox"]')] : [];
        const ariaOwners = scope ? [scope, ...scope.querySelectorAll('[aria-activedescendant]'), ...(trigger ? [trigger] : [])] : [];
        const ariaCurrent = ariaOwners.every(n => {
          const id = n.getAttribute('aria-activedescendant');
          return !id || !!(scope && [...scope.querySelectorAll('[id]')].some(c => c.id === id));
        });
        const rect = (n: Element) => { const r=n.getBoundingClientRect(); return [r.left,r.top,r.width,r.height]; };
        const bounds = scope ? rect(scope) : [];
        const focusBounds = focus ? rect(focus) : [];
        const open = kind !== 'select' || trigger?.getAttribute('aria-expanded') === 'true';
        const exiting = !!scope?.closest('.mat-datepicker-content-exit,.mat-select-panel-exit,.mdc-dialog--closing');
        reason = !hasFocus ? 'document-not-focused' : !inScope ? 'focus-outside-intended-modal' :
          blockingPanel ? 'closing-select-still-attached' : active ? 'finite-opening-animation' :
          'geometry-or-open-state-not-settled';
        if (scope?.isConnected && hasFocus && inScope && !blockingPanel && !active && open && !exiting && ariaCurrent &&
            bounds[2] > 0 && bounds[3] > 0 && focusBounds[2] > 0 && focusBounds[3] > 0) {
          const key = JSON.stringify({ bounds, focusBounds, controls: controls.map(rect),
            period: scope.querySelector('.mat-calendar-period-button')?.textContent, focused: focus?.id, tag: focus?.tagName });
          const sameNodes=focus===priorFocus && controls.length===priorControls.length && controls.every((n,i)=>n===priorControls[i]);
          frames = key === prior && sameNodes ? frames + 1 : 1; prior = key; priorControls=controls; priorFocus=focus;
          if (frames >= 3 && !finite()) {
            stop(); resolve({kind,scopeId:scope.id,paneId:pane?.id ?? '',focusedId:focus?.id ?? '',
              focusedTag:focus?.tagName ?? '',hasFocus,stableFrames:frames,finiteAnimations:0,peakFiniteAnimations:peak}); return;
          }
        } else { frames = 0; prior = ''; priorControls=[]; priorFocus=null; }
        raf = requestAnimationFrame(frame);
      } catch (error) { stop(); reject(error); }
    };
    raf = requestAnimationFrame(frame);
  });
}
