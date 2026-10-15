// Optional dependency-free CDP check against OWN loopback processes only.
// Start services/Chrome per README; this script never starts or deploys services.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const app = 'http://127.0.0.1:4320';
const targets = await fetch('http://127.0.0.1:9322/json/list').then(r => r.json());
const target = targets.find(t => t.type === 'page');
assert(target, 'Start an isolated Chrome page as documented');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
const externalRequests = [];
const runtimeErrors = [];
let pausedHandler = null;
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  } else if (message.method === 'Network.requestWillBeSent') {
    const url = message.params.request.url;
    if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:'))
      externalRequests.push(url);
  } else if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails.text);
  } else if (message.method === 'Fetch.requestPaused' && pausedHandler) {
    void pausedHandler(message.params).catch(e => runtimeErrors.push(e.message));
  }
};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
  return value.result.value;
}
async function wait(expression) {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(expression)) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timed out: ${expression}`);
}
async function size(width, height = 1000) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
}
async function fill(employeeId, shiftDayId) {
  await evaluate(`(() => {
    for (const [id, value] of ${JSON.stringify([['employeeId', employeeId], ['shiftDayId', shiftDayId]])}) {
      const input = document.getElementById(id); input.focus(); input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
}
async function submit() {
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { captureBeyondViewport: true });
  await mkdir('.angular/browser-evidence', { recursive: true });
  await writeFile(`.angular/browser-evidence/${name}.png`, Buffer.from(data, 'base64'));
}
async function key(key, code, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers,
    windowsVirtualKeyCode: key === 'Tab' ? 9 : key === 'Enter' ? 13 : 32,
    ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } :
      key === ' ' ? { text: ' ', unmodifiedText: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
}
async function contrast(selector, property = 'color') {
  return evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    const rgba = color => {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const s = getComputedStyle(node);
    const fg = rgba(s[${JSON.stringify(property)}]);
    let parent = node, bg;
    do { bg = rgba(getComputedStyle(parent).backgroundColor); parent = parent.parentElement; }
    while (bg[3] === 0 && parent);
    const lum = rgb => rgb.slice(0, 3).map(x => {
      const c = x / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const a = lum(fg), b = lum(bg);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  })()`);
}
try {
  console.log('Browser:', (await send('Browser.getVersion')).product);
  await send('Runtime.enable');
  await send('Network.enable');
  await size(1280);
  await send('Page.navigate', { url: `${app}/shift-day` });
  await wait(`document.querySelector('button[type="submit"]') && !document.querySelector('button[type="submit"]').disabled`);
  assert.equal(await evaluate(`document.documentElement.lang`), 'he');
  assert.equal(await evaluate(`getComputedStyle(document.body).direction`), 'rtl');
  assert.equal(await evaluate(`document.querySelectorAll('main').length`), 1);

  // Actual browser keyboard validation and focus, no synthetic Angular calls.
  await evaluate(`document.getElementById('employeeId').focus()`);
  await key('Tab', 'Tab');
  assert.equal(await evaluate('document.activeElement.id'), 'shiftDayId');
  await key('Tab', 'Tab', 8); // Shift+Tab
  assert.equal(await evaluate('document.activeElement.id'), 'employeeId');
  await key('Enter', 'Enter');
  await wait(`document.getElementById('employeeId').getAttribute('aria-invalid') === 'true'`);
  assert.equal(await evaluate('document.activeElement.id'), 'employeeId');
  const measured = {
    bodyText: await contrast('main'),
    errorText: await contrast('mat-error'),
    primaryButton: await contrast('button[type="submit"]'),
    secondaryButton: await contrast('button[mat-stroked-button]'),
  };
  for (const [name, ratio] of Object.entries(measured)) assert(ratio >= 4.5, `${name} contrast ${ratio}`);
  console.log('Measured representative text contrast ratios:', measured);
  const boundaryRatio = await contrast('.mdc-notched-outline__leading', 'borderColor');
  assert(boundaryRatio >= 3, `Invalid control boundary contrast ${boundaryRatio}`);
  assert(await evaluate(`[...document.querySelectorAll('button')].every(n => {
    const r = n.getBoundingClientRect(); return r.width >= 48 && r.height >= 48;
  })`), 'All current action targets at least 48x48 CSS px');

  // Real frontend -> Angular proxy -> real loopback fixture backend.
  await fill('1001', '2001'); await submit();
  await wait(`document.getElementById('result-heading') && document.activeElement.id === 'result-heading'`);
  assert(await evaluate(`document.body.textContent.includes('16/10/2026 07:00:00')`));
  assert(await evaluate(`document.body.textContent.includes('לא בוצע אימות סיסמה אמיתית')`));
  await wait(`getComputedStyle(document.getElementById('result-heading')).outlineStyle === 'solid'`);
  assert(await evaluate(`parseFloat(getComputedStyle(document.getElementById('result-heading')).outlineWidth) >= 3`));
  const focusRatio = await contrast('#result-heading', 'outlineColor');
  assert(focusRatio >= 3, `Focus outline contrast ${focusRatio}`);
  console.log('Measured nontext contrast:', { invalidBoundary: boundaryRatio, resultFocusOutline: focusRatio });
  await screenshot('desktop-rtl');

  const longId = '9'.repeat(38);
  await fill(longId, '2002'); await submit();
  await wait(`document.getElementById('result-context')?.textContent.includes('${longId}')`);
  assert.equal(await evaluate(`document.querySelector('.raw bdi').textContent.includes('<b>בדיקה בלבד</b>')`), true);
  assert.equal(await evaluate(`document.querySelector('.raw b')`), null);
  await size(320, 900);
  await wait(`getComputedStyle(document.querySelector('main')).paddingInlineStart === '16px'`);
  await wait(`document.documentElement.scrollWidth <= innerWidth`);
  assert(await evaluate(`[...document.querySelectorAll('h1, button, input, #result-context')].every(n => {
    const r = n.getBoundingClientRect(); return r.left >= 0 && r.right <= document.documentElement.clientWidth;
  })`), 'Essential controls remain inside narrow RTL viewport');
  assert(await evaluate(`document.querySelector('#result-heading').getBoundingClientRect().width <= 288`));
  await screenshot('narrow-rtl-long');
  await evaluate(`(() => {
    const s = document.createElement('style'); s.id = 'text-spacing-check';
    s.textContent = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }';
    document.head.append(s);
  })()`);
  assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  await screenshot('narrow-text-spacing');
  await evaluate(`document.getElementById('text-spacing-check').remove()`);
  await fill('01', '2002'); await submit();
  await wait(`document.querySelector('mat-error')?.textContent.includes('עד 38 ספרות')`);
  assert(await evaluate(`(() => {
    const f = [...document.querySelectorAll('mat-form-field')];
    return f[0].getBoundingClientRect().bottom <= f[1].getBoundingClientRect().top;
  })()`), 'Narrow multiline field errors do not overlap the next field');
  await fill(longId, '2002'); await submit();
  await wait(`document.getElementById('result-context')?.textContent.includes('${longId}')`);
  console.log('PASS: real proxy/fixture integration; keyboard validation/result focus; 1280/320 RTL; long IDs/raw markup; text-spacing reflow.');

  // Browser error/reload/race scenarios use clearly isolated intercepted HTTP.
  const sample = await fetch('http://127.0.0.1:4310/api/v1/employees/1001/shift-days/2001').then(r => r.json());
  const fulfill = (requestId, body, responseCode = 200) => send('Fetch.fulfillRequest', {
    requestId, responseCode, responseHeaders: [
      { name: 'Content-Type', value: responseCode === 200 ? 'application/json' : 'application/problem+json' },
      { name: 'Cache-Control', value: 'no-store' },
    ], body: Buffer.from(JSON.stringify(body)).toString('base64'),
  });
  let mode = 'matrix-ready', held = null, detailRequests = 0;
  pausedHandler = async event => {
    detailRequests++;
    const parts = new URL(event.request.url).pathname.split('/');
    if (mode === 'matrix-hold' || (mode === 'race' && parts[4] === '1001')) held = event.requestId;
    else await fulfill(event.requestId, { ...sample, employeeId: parts[4], shiftDayId: parts[6] });
  };
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/v1/employees/*', requestStage: 'Request' }] });

  // D01/H01: exact element identity, actual keyboard Space, delayed HTTP.
  // BODY also contains the reload label, so textContent is NEVER a focus oracle.
  for (const width of [1280, 320]) {
    for (const status of [200, 503]) {
      mode = 'matrix-ready';
      held = null;
      await size(width, 1000);
      await send('Page.navigate', { url: `${app}/shift-day` });
      await wait(`location.pathname === '/shift-day' && document.getElementById('employeeId')?.value === '' &&
        document.querySelector('button[type="submit"]') && !document.querySelector('button[type="submit"]').disabled`);
      await fill('1001', '2001'); await submit();
      await wait(`document.getElementById('result-heading') && document.activeElement.id === 'result-heading'`);
      await evaluate(`(() => {
        globalThis.__shfReload = document.getElementById('reload-action');
        globalThis.__shfReload.scrollIntoView({ block: 'center' });
        globalThis.__shfReload.focus();
      })()`);
      assert(await evaluate(`document.activeElement === globalThis.__shfReload`));
      mode = 'matrix-hold';
      const before = detailRequests;
      await key(' ', 'Space');
      for (let i = 0; i < 100 && !held; i++) await new Promise(r => setTimeout(r, 20));
      assert(held, `${width}/${status}: keyboard Space starts reload GET`);
      await wait(`document.getElementById('reload-action')?.getAttribute('aria-busy') === 'true'`);
      const pendingIsReload = await evaluate(`document.activeElement === globalThis.__shfReload`);
      assert(pendingIsReload, `${width}/${status}: pending focus must be the saved reload button, not BODY`);
      assert(await evaluate(`!globalThis.__shfReload.disabled && globalThis.__shfReload.getAttribute('aria-disabled') === 'true'`));
      assert.equal(await evaluate(`document.getElementById('result-heading')`), null);
      await key(' ', 'Space');
      await key(' ', 'Space');
      await new Promise(r => setTimeout(r, 200));
      assert.equal(detailRequests - before, 1, `${width}/${status}: repeated Space must not start another GET`);
      assert(await evaluate(`document.activeElement === globalThis.__shfReload`), 'Repeated pending activation retains focus');
      const response = status === 200 ? sample : {
        type: 'urn:shf:problem:DEPENDENCY_TIMEOUT', title: 'Synthetic',
        status: 503, code: 'DEPENDENCY_TIMEOUT', requestId: 'browser-synthetic',
      };
      await fulfill(held, response, status);
      await wait(`document.getElementById('reload-action')?.getAttribute('aria-busy') === 'false' &&
        !!document.getElementById('${status === 200 ? 'result-heading' : 'error-heading'}')`);
      await new Promise(r => setTimeout(r, 100)); // Include scheduled terminal focus work.
      const terminalIsReload = await evaluate(`document.activeElement === globalThis.__shfReload`);
      assert(terminalIsReload, `${width}/${status}: terminal focus must remain on the saved reload button`);
      assert(await evaluate(`document.getElementById('reload-action') === globalThis.__shfReload &&
        !globalThis.__shfReload.disabled && globalThis.__shfReload.getAttribute('aria-disabled') === 'false'`));
      assert.equal(detailRequests - before, 1, 'Exactly one detail GET through terminal outcome');
      console.log('PASS D01/H01:', { width, status, pendingIsReload, terminalIsReload, detailGETs: detailRequests - before });
    }
  }

  mode = 'race';
  held = null;
  await fill('1001', '2001'); await submit();
  for (let i = 0; i < 100 && !held; i++) await new Promise(r => setTimeout(r, 20));
  assert(held, 'A request held');
  await fill('1002', '2002'); await submit();
  await wait(`document.getElementById('result-context')?.textContent.includes('1002')`);
  // Browser may already have canceled A; either path must leave B unchanged.
  await fulfill(held, sample).catch(() => {});
  await new Promise(r => setTimeout(r, 200));
  assert(await evaluate(`document.getElementById('result-context').textContent.includes('1002')`));
  assert.equal(await evaluate(`document.activeElement.id`), 'result-heading');
  assert.equal(await evaluate(`localStorage.length + sessionStorage.length`), 0);
  assert.deepEqual(externalRequests, [], 'No external app-runtime requests/fonts/icons');
  assert.deepEqual(runtimeErrors, [], 'No browser runtime exceptions');
  await evaluate(`delete globalThis.__shfReload`);
  console.log('PASS: exact 4-case keyboard reload focus matrix and delayed-A/B race; no browser storage/external requests/runtime exceptions.');
  console.log('Screenshots: .angular/browser-evidence (synthetic only; ignored). Not a screen-reader/contrast/full WCAG audit.');
} finally {
  await send('Fetch.disable').catch(() => {});
  socket.close();
}
