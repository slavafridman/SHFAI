// Test-driver only: observe this minute picker's overlay lifecycle. Never send
// Escape, close a component, sleep or retry an interaction from this checker.
export interface PickerOverlayOptions {
  phase: 'select-open' | 'select-closed' | 'dialog-closed';
  selectId: string;
  panelId?: string;
  paneId?: string;
  dialogId?: string;
  dialogPaneId?: string;
  openerId?: string;
  timeoutMs?: number;
}
export function waitForPickerOverlay(options: PickerOverlayOptions): Promise<{
  phase: PickerOverlayOptions['phase']; panelId: string; paneId: string; dialogId: string; dialogPaneId: string;
  stableFrames: number; finiteAnimations: number; focusedId: string;
}> {
  return new Promise((resolve, reject) => {
    let raf = 0, stableFrames = 0, previous = '', done = false, reason = 'waiting-for-overlay-state';
    const stop = () => { done = true; cancelAnimationFrame(raf); clearTimeout(deadline); };
    const deadline = setTimeout(() => {
      stop(); reject(new Error(`Picker overlay timeout: ${options.phase}; ${reason}`));
    }, options.timeoutMs ?? 5000);
    const frame = () => {
      if (done) return;
      try {
        const trigger = document.getElementById(options.selectId);
        const dialog = options.dialogId ? document.getElementById(options.dialogId) : trigger?.closest('mat-dialog-container');
        const panelId = options.panelId ?? trigger?.getAttribute('aria-controls') ?? '';
        const panel = panelId ? document.getElementById(panelId) : null;
        const paneId = options.paneId ?? panel?.closest('.cdk-overlay-pane')?.id ?? '';
        const dialogId = options.dialogId ?? dialog?.id ?? '';
        const dialogPaneId = options.dialogPaneId ?? dialog?.closest('.cdk-overlay-pane')?.id ?? '';
        const panes = [paneId, dialogPaneId].map(id => document.getElementById(id)).filter((p): p is HTMLElement => !!p);
        const finite = () => {
          const animations = new Set(panes.flatMap(p => p.getAnimations?.({ subtree: true }) ?? []));
          return [...animations].filter(a => a.effect &&
            (a.pending || !['finished', 'idle'].includes(a.playState)) &&
            Number.isFinite(a.effect.getComputedTiming().endTime) &&
            Number.isFinite(a.effect.getTiming().iterations)).length;
        };
        const focused = document.activeElement;
        const expanded = trigger?.getAttribute('aria-expanded');
        const opener = options.openerId ? document.getElementById(options.openerId) : null;
        let ready = false;
        if (options.phase === 'select-open') {
          ready = !!trigger && !!dialog && !!panel && !!paneId && !!dialogPaneId && expanded === 'true' &&
            (focused === trigger || !!(focused && panel.contains(focused)));
        } else if (options.phase === 'select-closed') {
          ready = !!trigger && !!dialog && !!panelId && !panel && expanded === 'false' &&
            focused === trigger && dialog.contains(trigger);
        } else {
          // In attendance the opener's aria-expanded is reset by afterClosed.
          // DOM removal alone is not sufficient evidence of focus restoration.
          ready = !!dialogId && !dialog && !!opener && focused === opener &&
            opener.getAttribute('aria-expanded') === 'false';
        }
        const active = finite();
        reason = active ? 'finite-overlay-animation' : 'panel-aria-or-exact-focus-not-ready';
        const key = JSON.stringify({ panelId, paneId, dialogId, dialogPaneId, expanded, focused: focused?.id });
        if (ready && !active && !finite()) {
          stableFrames = key === previous ? stableFrames + 1 : 1; previous = key;
          if (stableFrames >= 2) {
            stop(); resolve({ phase: options.phase, panelId, paneId, dialogId, dialogPaneId,
              stableFrames, finiteAnimations: 0, focusedId: focused?.id ?? '' }); return;
          }
        } else { stableFrames = 0; previous = ''; }
        raf = requestAnimationFrame(frame);
      } catch (error) { stop(); reject(error); }
    };
    raf = requestAnimationFrame(frame);
  });
}
