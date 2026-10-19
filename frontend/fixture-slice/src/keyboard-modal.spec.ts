import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForKeyboardModalReady } from '../checks/keyboard-modal';

describe('whole keyboard-modal admission (synthetic states, not native key delivery)', () => {
  let host: HTMLElement, focused: boolean, frame: number;
  beforeEach(() => {
    frame=0; focused=true;
    vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
    vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>
      setTimeout(()=>{frame++;callback(0)},16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
    vi.spyOn(document,'hasFocus').mockImplementation(()=>focused);
    vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
    vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element) {
      const left=Number(this.getAttribute('data-left')??0);
      return {left,top:0,width:320,height:400,right:left+320,bottom:400,x:left,y:0,toJSON:()=>({})} as DOMRect;
    });
    vi.spyOn(Element.prototype,'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    host=document.createElement('section');document.body.append(host);
  });
  afterEach(()=>{host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers()});
  function calendar() {
    host.innerHTML='<div class="cdk-overlay-pane" id="keyboard-pane"><mat-datepicker-content id="keyboard-calendar"><mat-calendar><button class="mat-calendar-body-cell" id="keyboard-day">19</button></mat-calendar></mat-datepicker-content></div><button id="outside">Outside</button>';
    const button=host.querySelector<HTMLButtonElement>('#keyboard-day')!;button.focus();
    return {button,pane:host.querySelector('#keyboard-pane')!,scope:host.querySelector('#keyboard-calendar')!};
  }
  const animation=(active:()=>boolean,infinite=false)=>({pending:false,get playState(){return active()?'running':'finished'},
    effect:{getComputedTiming:()=>({endTime:infinite?Infinity:150}),getTiming:()=>({iterations:infinite?Infinity:1})}});
  it('mounted calendar/day focus is NOT ready while the actual document lacks focus',async()=>{
    calendar();focused=false;let resolved=false;
    const work=waitForKeyboardModalReady(500).then(v=>{resolved=true;return v});
    await vi.advanceTimersByTimeAsync(64);expect(resolved).toBe(false);
    focused=true;await vi.advanceTimersByTimeAsync(48);
    expect((await work).hasFocus).toBe(true);
  });
  it('waits for finite Material opening animation and three stable frames before Escape admission',async()=>{
    const c=calendar();let active=true,resolved=false;
    Object.defineProperty(c.pane,'getAnimations',{value:()=>[animation(()=>active)]});
    const work=waitForKeyboardModalReady(500).then(v=>{resolved=true;return v});
    await vi.advanceTimersByTimeAsync(64);expect(resolved).toBe(false);
    active=false;await vi.advanceTimersByTimeAsync(32);expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16);
    const data=await work;expect(data.kind).toBe('calendar');expect(data.stableFrames).toBe(3);
    expect(data.finiteAnimations).toBe(0);expect(data.peakFiniteAnimations).toBe(1);
  });
  it('also rejects moving overlay geometry when there is no declared active animation',async()=>{
    const c=calendar();let resolved=false;
    vi.spyOn(c.scope,'getBoundingClientRect').mockImplementation(()=>({
      left:frame<3?3-frame:0,top:0,width:320,height:400,right:320,bottom:400,x:0,y:0,toJSON:()=>({}),
    }) as DOMRect);
    const work=waitForKeyboardModalReady(500).then(v=>{resolved=true;return v});
    await vi.advanceTimersByTimeAsync(64);expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(16);expect((await work).stableFrames).toBe(3);
  });
  it('accepts real select trigger focus outside the listbox, without stalling on infinite focus ripple',async()=>{
    host.innerHTML='<button role="combobox" aria-expanded="true" aria-controls="keyboard-panel" aria-activedescendant="keyboard-option" id="keyboard-select">Select</button><div class="cdk-overlay-pane"><div role="listbox" id="keyboard-panel"><div role="option" id="keyboard-option">00</div></div></div>';
    host.querySelector<HTMLButtonElement>('#keyboard-select')!.focus();
    Object.defineProperty(host.querySelector('.cdk-overlay-pane'),'getAnimations',{value:()=>[animation(()=>true,true)]});
    const work=waitForKeyboardModalReady(500);await vi.advanceTimersByTimeAsync(48);
    expect((await work).kind).toBe('select');
  });
  it('does not admit underlying dialog Escape while a collapsed select panel is still attached',async()=>{
    host.innerHTML='<div class="cdk-overlay-pane"><mat-dialog-container id="keyboard-dialog"><button role="combobox" aria-expanded="false" id="keyboard-select">Select</button></mat-dialog-container></div><div class="cdk-overlay-pane"><div role="listbox" id="closing-panel">Closing</div></div>';
    host.querySelector<HTMLButtonElement>('#keyboard-select')!.focus();let resolved=false;
    const work=waitForKeyboardModalReady(500).then(v=>{resolved=true;return v});
    await vi.advanceTimersByTimeAsync(64);expect(resolved).toBe(false);
    host.querySelector('#closing-panel')!.remove();await vi.advanceTimersByTimeAsync(48);
    expect((await work).kind).toBe('dialog');
  });
  it('supports a focused native modal dialog without polling unrelated page animations',async()=>{
    host.innerHTML='<dialog open id="keyboard-menu"><button id="keyboard-menu-close">Close</button></dialog>';
    host.querySelector<HTMLButtonElement>('button')!.focus();
    const work=waitForKeyboardModalReady(500);await vi.advanceTimersByTimeAsync(48);
    expect((await work).kind).toBe('native-dialog');
  });
  it('fails boundedly when focus stays outside the intended live calendar; never sends a key',async()=>{
    calendar();host.querySelector<HTMLButtonElement>('#outside')!.focus();
    const keys=vi.fn();host.addEventListener('keydown',keys);
    const assertion=expect(waitForKeyboardModalReady(200)).rejects.toThrow('focus-outside-intended-modal');
    await vi.advanceTimersByTimeAsync(201);await assertion;expect(keys).not.toHaveBeenCalled();
  });
});
