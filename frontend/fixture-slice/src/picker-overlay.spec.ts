import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForPickerOverlay } from '../checks/picker-overlay';

describe('minute picker Escape-stack checker (synthetic lifecycle, not native browser events)', () => {
  let host: HTMLElement;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  });
  afterEach(() => { host?.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  function fixture() {
    host = document.createElement('section');
    host.innerHTML = `<button id="attendance-timeFrom-open" aria-expanded="true">Open</button>
      <div class="cdk-overlay-pane" id="test-dialog-pane"><mat-dialog-container id="test-dialog">
        <button id="picker-minute" aria-expanded="true" aria-controls="test-select-panel">Minute</button>
      </mat-dialog-container></div>
      <div class="cdk-overlay-pane" id="test-select-pane"><div id="test-select-panel" role="listbox">Options</div></div>`;
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('#picker-minute')!;
    const opener = host.querySelector<HTMLButtonElement>('#attendance-timeFrom-open')!;
    const panel = host.querySelector('#test-select-panel')!, dialog = host.querySelector('mat-dialog-container')!;
    trigger.focus();
    const ids = { selectId:'picker-minute', panelId:'test-select-panel', paneId:'test-select-pane',
      dialogId:'test-dialog', dialogPaneId:'test-dialog-pane', openerId:'attendance-timeFrom-open', timeoutMs:200 };
    return { trigger, opener, panel, dialog, ids };
  }
  it('waits for panel removal, collapsed aria, exact select focus AND finite closing animations before allowing next Escape', async () => {
    const f = fixture(); let finiteActive = true, resolved = false;
    const animation = (infinite: boolean) => ({
      pending:false, get playState() { return infinite || finiteActive ? 'running' : 'finished'; },
      effect: { getComputedTiming: () => ({ endTime:infinite ? Infinity : 150 }),
        getTiming: () => ({ iterations:infinite ? Infinity : 1 }) },
    });
    Object.defineProperty(host.querySelector('#test-select-pane'), 'getAnimations',
      { value:() => [animation(false),animation(true)] });
    const work = waitForPickerOverlay({ ...f.ids, phase:'select-closed' }).then(v => { resolved = true; return v; });
    await vi.advanceTimersByTimeAsync(32); expect(resolved).toBe(false);
    f.panel.remove(); f.trigger.setAttribute('aria-expanded','false');
    await vi.advanceTimersByTimeAsync(32); expect(resolved).toBe(false);
    finiteActive = false;
    await vi.advanceTimersByTimeAsync(16); expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16);
    const data = await work;
    expect(data.focusedId).toBe('picker-minute'); expect(data.stableFrames).toBe(2);
    expect(data.finiteAnimations).toBe(0);
  });
  it('dialog DOM removal alone does not imply afterClosed/exact opener readiness', async () => {
    const f = fixture(); let resolved = false;
    const work = waitForPickerOverlay({ ...f.ids, phase:'dialog-closed' }).then(v => { resolved = true; return v; });
    f.dialog.remove();
    await vi.advanceTimersByTimeAsync(32); expect(resolved).toBe(false);
    f.opener.focus();
    await vi.advanceTimersByTimeAsync(32); expect(resolved).toBe(false);
    f.opener.setAttribute('aria-expanded','false');
    await vi.advanceTimersByTimeAsync(32);
    expect((await work).focusedId).toBe('attendance-timeFrom-open');
  });
  it('fails at a bounded deadline on wrong select focus without injecting a third Escape or any key', async () => {
    const f = fixture(), key = vi.fn();
    host.addEventListener('keydown',key);
    f.panel.remove(); f.trigger.setAttribute('aria-expanded','false'); f.opener.focus();
    const assertion = expect(waitForPickerOverlay({ ...f.ids, phase:'select-closed' })).rejects.toThrow('Picker overlay timeout');
    await vi.advanceTimersByTimeAsync(201); await assertion;
    expect(key).not.toHaveBeenCalled();
  });
});
