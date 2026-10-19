// Shared test-driver synchronization only, never imported into the application.
// `input.disabled` ignores a disabled fieldset. :disabled is the effective
// native state; a mounted initial Angular view is not a completed context.
export function formReadyExpression(scope: string, input: string, submit: string,
  defaults: Record<string, string> = {}): string {
  return `(() => {
    const root=document.querySelector(${JSON.stringify(scope)});
    const input=document.getElementById(${JSON.stringify(input)});
    const submit=document.getElementById(${JSON.stringify(submit)});
    return !!root && !!input && !!submit && root.contains(input) && root.contains(submit) &&
      input.getClientRects().length>0 && !input.matches(':disabled') && !submit.matches(':disabled') &&
      !root.querySelector('mat-progress-bar') && !!input.value &&
      Object.entries(${JSON.stringify(defaults)}).every(([id,value])=>document.getElementById(id)?.value===value);
  })()`;
}

type Driver = {
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  evaluate: (expression: string) => Promise<unknown>;
  wait: (expression: string) => Promise<unknown>;
};
export function physicalInput({ send, evaluate, wait }: Driver) {
  return async (id: string, value: string): Promise<void> => {
    const target = JSON.stringify(id), text = JSON.stringify(value);
    await wait(`(() => {const n=document.getElementById(${target});return !!n &&
      n.getClientRects().length>0 && !n.matches(':disabled') && !n.readOnly;})()`);
    const unchanged = await evaluate(`document.getElementById(${target}).value===${text}`) === true;
    await evaluate(`document.getElementById(${target}).focus({preventScroll:true})`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
    await send('Input.insertText', { text: value });
    // Native blur/change and Angular's touched/dirty path, not synthetic DOM
    // event injection. This also commits the Material date input before Apply.
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    // Native value/class changes precede Angular's scheduled DOM render (e.g.
    // clearing dirty result rows). Wait for rendering, not an arbitrary sleep;
    // otherwise a pre-existing ng-dirty class can admit the previous table.
    await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    await wait(`(() => {const n=document.getElementById(${target});return !!n && n.value===${text} &&
      (!n.hasAttribute('formcontrolname') || ((${unchanged} || n.classList.contains('ng-dirty')) && n.classList.contains('ng-touched')));})()`);
  };
}
