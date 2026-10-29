// Real owned Chrome + isolated typed HTTP DOUBLE. No backend runtime/Oracle/EMS.
// Builds use .angular/u49-production, never overwrite foundation delivery output.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { registerHooks } from 'node:module';
import { physicalInput } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';

// Reuse existing TYPE-CHECKED, pure TypeScript test fixtures. Resolve only their
// extensionless local imports; do not load application services or backend code.
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.includes('/frontend/fixture-slice/src/') && /^\.\.?\/[^.]+$/.test(specifier))
    return next(specifier + '.ts', context);
  return next(specifier, context);
} });
const f = await import('../src/shift-management-fixtures.ts');
const reads = await import('../src/current-shifts-fixtures.ts');
const guards = await import('../src/shift-management-contract.ts');
const stage = await import('../src/native-arrival-fixtures.ts');
const station = await import('../src/native-station-arrival-fixtures.ts');
const exit = await import('../src/station-exit-fixtures.ts');
const root = resolve(process.argv[2] ?? '.angular/u49-production/browser');
const profile = resolve(`.angular/u49-chrome-${crypto.randomUUID()}`);
const calls = [], browserErrors = [], external = [], measures = [];
let mode = 'ordinary', cancelled = false, selected = f.managementStateFixture();
/** @type {{res: import('node:http').ServerResponse, binding: import('../src/shift-management-contract.ts').ReceiptBinding} | undefined} */
let pending;
let prepared, preview, rawExpected, lastQuery, native = true, family = 'management';
const pause = ms => new Promise(r => setTimeout(r, ms));
const identity = () => {
  if (family === 'stage') return stage.nativeIdentityFixture();
  if (family === 'station') return station.nativeStationIdentityFixture();
  if (family === 'exit') return exit.exitIdentityFixture();
  const p = f.managementIdentityFixture(native); p.principal.resourceScope.orgUnitIds = ['TEST-U', 'TEST-V']; return p;
};
const context = day => {
  const c = f.managementContextFixture(day, native); c.employee.orgUnitId = 'TEST-U';
  if (day) { c.selected = structuredClone(selected); c.eligibility = cancelled ? 'already-cancelled' : 'supported'; }
  return c;
};
function json(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': status === 200 ? 'application/json; charset=utf-8' : 'application/problem+json',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body));
}
const server = createServer(async (req, res) => {
  try {
    assert(req.url);
    const url = new URL(req.url, 'http://127.0.0.1');
    if (!url.pathname.startsWith('/api/')) {
      const path = resolve(root, '.' + url.pathname);
      if (path !== root && !path.startsWith(root + '\\') && !path.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
      const file = extname(path) ? path : resolve(root, 'index.html');
      try {
        const data = await readFile(file); res.writeHead(200, {
          'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream',
          'Cache-Control': 'no-store' }); res.end(data);
      } catch { res.writeHead(404); res.end(); }
      return;
    }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks), path = url.pathname;
    calls.push({ path, method: req.method, query: url.search, bytes: bytes.length });
    if (path === '/api/v1/identity') {
      if (mode === 'absent-identity') return json(res, {});
      return json(res, identity());
    }
    if (path === '/api/v1/current-shifts/filter-context') {
      const c = reads.contextFixture(); c.dataSource = 'oracle-read-only';
      c.defaults.attendanceDate = '2026-12-02'; return json(res, c);
    }
    if (path === '/api/v1/current-shifts') {
      const row = reads.listRowFixture('6201'); row.employee.employeeId = '9001';
      row.startLocal = selected.startLocal; row.endLocal = selected.endLocal;
      const data = reads.listFixture(cancelled ? [] : [row]);
      data.dataSource = 'oracle-read-only';
      const attendanceDate = url.searchParams.get('attendanceDate'), currentTime = url.searchParams.get('currentTime');
      assert(attendanceDate && currentTime);
      data.applied = { requestedMode: 'at', attendanceDate,
        currentTime, mokedCode: url.searchParams.get('mokedCode'), sort: 'effective-start-asc' };
      data.page.offset = Number(url.searchParams.get('offset'));
      data.page.hasMore = data.page.offset === 0;
      data.page.nextOffset = data.page.hasMore ? 25 : null;
      if (data.page.hasMore && !cancelled) data.items = Array.from({ length: 25 }, (_, i) =>
        ({ ...structuredClone(row), shiftDayId: String(6201 + i) }));
      lastQuery = url.search; return json(res, data);
    }
    const base = '/api/v1/employees/9001/shift-management';
    assert.equal(url.search, '', 'management has no query');
    if (path === base + '/context') return json(res, context(false));
    if (path === base + '/shift-days/6201/context') return json(res, context(true));
    if (path === base + '/preparations') {
      const body = JSON.parse(bytes.toString('utf8')); assert(guards.exact(body, 'draft')); assert(guards.draft(body.draft));
      prepared = f.managementPreparationFixture(context(body.draft.kind !== 'create'), body.draft);
      return json(res, prepared);
    }
    if (path === base + '/csv-previews') {
      assert.equal(req.headers['content-type'], 'text/csv; charset=utf-8');
      assert(rawExpected && bytes.equals(rawExpected), 'CSV bytes unchanged'); // never print byte diffs
      preview = f.managementCsvFixture(context(false));
      if (mode === 'csv-invalid') preview = { ...preview, state: 'invalid', previewToken: null, fingerprint: null, expiresAt: null,
        rows: preview.rows.map(r => ({ line: r.line, effect: null, errors: [{ column: 'row', code: 'CSV_DUPLICATE' }] })) };
      return json(res, preview);
    }
    if (path === base + '/commands' || path === base + '/csv-commands') {
      const body = JSON.parse(bytes.toString('utf8')), csv = path.endsWith('/csv-commands');
      assert(guards.command(body, csv)); assert(!pending, 'one in flight');
      const effects = csv ? preview.rows.flatMap(r => r.effect ? [r.effect] : []) : prepared.effects;
      assert(guards.sameWarnings(body.acknowledgedWarningCodes, guards.warningsFor(effects)));
      /** @type {import('../src/shift-management-contract.ts').ReceiptBinding} */
      const binding = { employeeId: '9001', commandId: body.commandId, kind: 'draft' in body ? body.draft.kind : 'csv-create',
        dataSource: native ? 'oracle-test' : 'isolated-fixture', businessTimeZone: 'Asia/Jerusalem', effects };
      pending = { res, binding };
      if (mode === 'lost') { pending = undefined; res.destroy(); }
      return;
    }
    throw Error('Unexpected local endpoint: ' + path);
  } catch (e) { browserErrors.push(e.message); if (!res.headersSent) res.writeHead(500); res.end(); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const address = server.address(); assert(address && typeof address !== 'string');
const app = `http://127.0.0.1:${address.port}`;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank',
], { stdio: 'ignore' });
let socket, cdp, seq = 0;
const waiting = new Map();
async function until(fn, label, timeout = 15000) {
  const start = performance.now();
  while (performance.now() - start < timeout) { const result = await fn(); if (result) return result; await pause(30); }
  throw Error('Timeout: ' + label);
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { waiting.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
    waiting.set(id, { resolve: v => { clearTimeout(timer); resolve(v); }, reject: e => { clearTimeout(timer); reject(e); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
const wait = expression => until(() => evaluate(expression), expression);
const commandCount = () => calls.filter(c => /\/(?:csv-)?commands$/.test(c.path)).length;
async function key(key, code = key, modifiers = 0) {
  if (key === 'Escape') await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  const vk = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, Home: 36, End: 35, ArrowDown: 40 }[key] ?? 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: vk,
    ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: vk });
}
async function activate(selector) {
  await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing control');
    n.scrollIntoView({block:'center'});n.focus({preventScroll:true});})()`);
  await key('Enter');
}
async function navigate(path, clearSafety = false) {
  if (clearSafety) await evaluate('sessionStorage.clear()'); // NEW isolated test scenario, never an application reset action.
  await evaluate('window.__u49Leaving=true');
  await send('Page.navigate', { url: app + path });
  await wait(`window.__u49Leaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
}
async function ready(day = false) {
  await navigate(day ? '/employees/9001/shift-days/6201/manage' : '/employees/9001/shift-management');
  await wait(`!!document.getElementById('management-prepare') && !document.querySelector('mat-progress-bar')`);
}
async function choose(id, last = false) {
  await wait(`!!document.getElementById(${JSON.stringify(id)})`);
  await activate('#' + id); await wait(`!!document.querySelector('[role="listbox"]')`);
  await key(last ? 'End' : 'Home'); await key('Enter'); await wait(`!document.querySelector('[role="listbox"]')`);
}
const input = physicalInput({ send, evaluate, wait });
async function createDraft() {
  await input('management-startDate', '02/12/2026'); await input('management-endDate', '02/12/2026');
  await input('management-startTime', '10:00'); await input('management-endTime', '18:00');
  await choose('management-activityCode'); await choose('management-workLocation', true);
}
async function prepare() {
  await activate('#management-prepare'); await wait(`!!document.getElementById('management-review')`);
}
async function openReview() {
  await activate('#management-review'); await wait(`!!document.querySelector('mat-dialog-container')`);
  await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  assert(await evaluate(`document.activeElement.id==='management-review-heading'`), 'meaningful initial dialog focus');
  assert(await evaluate(`[...document.querySelectorAll('mat-dialog-container mat-checkbox input')].every(n=>!n.checked)`), 'all consent initially unchecked');
}
async function accept() {
  const ids = await evaluate(`[...document.querySelectorAll('mat-dialog-container mat-checkbox input')].map(n=>n.id)`);
  for (const id of ids) { await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`); await key(' ', 'Space'); }
  await wait(`!document.getElementById('management-review-confirm').disabled`);
  await activate('#management-review-confirm'); await until(() => pending, 'one held typed command');
  await wait(`document.getElementById('management-status')?.textContent.includes('הפקודה נשלחה')`);
  assert(await evaluate(`document.getElementById('management-prepare').disabled && !document.querySelector('.success')`), 'pending prevents repeat and no premature result');
}
function held() { const p = pending; assert(p, 'held command required'); return p; }
async function release() {
  const p = pending; assert(p); pending = undefined;
  const result = f.managementReceiptFixture(p.binding);
  if (p.binding.kind === 'cancel') { selected = structuredClone(result.effects[0].after); cancelled = true; }
  if (p.binding.kind === 'change') selected = structuredClone(result.effects[0].after);
  json(p.res, result);
  await wait(`!!document.querySelector('.success')`);
}
async function geometry(width, zoom = 1) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.documentElement.style.zoom=${JSON.stringify(String(zoom))}`);
  const result = await evaluate(`(()=>{
    const controls=[...document.querySelectorAll('shf-shift-management button')].filter(n=>n.getClientRects().length);
    return { width:innerWidth, scroll:document.documentElement.scrollWidth,
      rtl:getComputedStyle(document.querySelector('shf-shift-management')).direction,
      minTarget:Math.min(...controls.map(n=>n.getBoundingClientRect().height)),
      motion:matchMedia('(prefers-reduced-motion: reduce)').matches };
  })()`);
  assert(result.scroll <= result.width, `no page overflow ${width}/${zoom}: ${JSON.stringify(result)}`);
  assert.equal(result.rtl, 'rtl'); assert(result.minTarget >= 24); assert(result.motion);
  measures.push({ viewport: width, cssZoom: zoom, ...result });
}
async function upload(invalid = false) {
  mode = invalid ? 'csv-invalid' : 'ordinary';
  await activate('#management-import'); await wait(`!!document.getElementById('management-file')`);
  await choose('management-encoding');
  rawExpected = Buffer.from('personalId,activityCode,date,location,startTime,endTime\r\nX000000001,12,02/12/2026,m,10:00,18:00\r\n000000001,12,03/12/2026,m,10:00,18:00\r\n', 'utf8');
  await evaluate(`(()=>{
    const transfer=new DataTransfer();
    transfer.items.add(new File([new Uint8Array(${JSON.stringify([...rawExpected])})], '<synthetic>.csv', {type:'text/csv'}));
    const n=document.getElementById('management-file');n.files=transfer.files;n.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await wait(`document.querySelector('.file-field')?.textContent.includes('<synthetic>.csv') && !document.querySelector('mat-progress-bar')`);
  await activate('#management-prepare');
  await wait(invalid ? `document.getElementById('management-status')?.textContent.includes('הקובץ אינו תקף')` :
    `!!document.getElementById('management-review')`);
  assert(await evaluate(`!document.querySelector('main').textContent.includes('000000001') && !document.querySelector('.file-field img')`), 'no identity echo or filename HTML execution');
}
try {
  await until(async () => { try {
    const port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    if (!/^\d+$/.test(port)) return false; cdp = 'http://127.0.0.1:' + port; return (await fetch(cdp + '/json/version')).ok;
  } catch { return false; } }, 'owned Chrome readiness');
  const target = await fetch(cdp + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = waiting.get(m.id); if (p) { waiting.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } }
    else if (m.method === 'Runtime.exceptionThrown') browserErrors.push(m.params.exceptionDetails.text);
    else if (m.method === 'Network.requestWillBeSent') {
      const url = m.params.request.url;
      if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:') && !url.startsWith('blob:')) external.push(url);
    }
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.bringToFront');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await ready();
  console.log('CHECK M3 geometry/create/keyboard review');
  const contrast = await evaluate(`(()=>{
    const luminance=color=>{
      const rgb=color.match(/[.\\d]+/g).slice(0,3).map(Number).map(v=>{
        v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
      });return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
    };
    const ratio=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);};
    const button=document.getElementById('management-prepare'), style=getComputedStyle(button);
    const text=getComputedStyle(document.querySelector('shf-shift-management')).color;
    return {primaryText:ratio(style.backgroundColor,getComputedStyle(button.querySelector('.mdc-button__label')).color),
      bodyText:ratio(text,'rgb(255,255,255)'),focusIndicator:ratio('rgb(0,47,101)','rgb(255,255,255)')};
  })()`);
  assert(contrast.primaryText >= 4.5 && contrast.bodyText >= 4.5 && contrast.focusIndicator >= 3);
  console.log('MEASURED sRGB contrast subset ' + JSON.stringify(contrast));
  for (const width of [1440, 390, 320]) await geometry(width);
  await geometry(720, 2); await geometry(1440);
  await activate('#management-prepare');
  await wait(`document.activeElement.id==='management-startDate'`);
  await activate('mat-form-field:has(#management-startDate) mat-datepicker-toggle button');
  await wait(`!!document.querySelector('mat-datepicker-content [role="grid"]')`);
  await key('Escape');
  await wait(`!document.querySelector('mat-datepicker-content') &&
    document.activeElement===document.querySelector('mat-form-field:has(#management-startDate) mat-datepicker-toggle button')`);
  await createDraft(); await prepare(); await openReview();
  await geometry(320);
  assert(await evaluate(`(()=>{const n=document.querySelector('mat-dialog-container');return n.scrollWidth<=n.clientWidth &&
    [...n.querySelectorAll('button')].filter(n=>n.getClientRects().length).every(n=>n.getBoundingClientRect().height>=24);})()`),
    'review reflow and keyboard targets at320');
  await geometry(1440);
  for (let i = 0; i < 10; i++) {
    await key('Tab'); assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`), 'dialog keyboard focus trapped');
  }
  const before = commandCount(); await key('Escape');
  await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='management-review'`);
  assert.equal(commandCount(), before, 'Escape zero commands');
  await openReview(); await accept(); assert.equal(commandCount(), before + 1); await release();

  // Change activity only: conditional reasons remain null, no changed remark.
  await ready(true); await choose('management-activityCode', true); await prepare(); await openReview();
  console.log('CHECK M3 activity-only change');
  assert(await evaluate(`document.querySelector('mat-dialog-container').textContent.includes('מקור עסקי')`));
  await accept(); assert.equal(held().binding.kind, 'change'); await release();

  // CSV invalid cannot apply; ready whole two-row apply. Template has no identity.
  selected = f.managementStateFixture(); cancelled = false;
  console.log('CHECK M3 invalid CSV then atomic two-row apply');
  await ready(); const csvBefore = commandCount(); await upload(true);
  assert.equal(commandCount(), csvBefore); assert(await evaluate(`!document.getElementById('management-review')`));
  await geometry(320); await geometry(1440);
  await ready(); await upload(); await openReview(); await accept();
  assert.equal(held().binding.effects.length, 2); assert.equal(held().binding.kind, 'csv-create'); await release();

  // Real browser history through page25, RTL table scroll, exact filters and vanished cancelled opener.
  await navigate('/current-shifts'); await wait(`!!document.getElementById('management-6201')`);
  console.log('CHECK M3 page25/cancel/Back/Forward');
  await activate('#next-page'); await wait(`document.getElementById('previous-page')?.disabled===false`);
  const query = lastQuery;
  await evaluate(`(()=>{const n=document.getElementById('management-6201');n.scrollIntoView({block:'center'});n.focus();
    document.querySelector('.table-wrap').scrollLeft=-80;window.__u49Origin={scroll:scrollY,horizontal:document.querySelector('.table-wrap').scrollLeft};})()`);
  await key('Enter'); await wait(`!!document.getElementById('management-cancel')`);
  await activate('#management-cancel'); await choose('management-reasonCode'); await prepare(); await openReview(); await accept(); await release();
  assert(cancelled); await evaluate('history.back()');
  await wait(`location.pathname==='/current-shifts' && document.querySelector('main')?.textContent.includes('לא נמצאו משמרות')`);
  assert.equal(lastQuery, query, 'exact filter/page/sort query restored after cancel');
  await wait(`document.activeElement.id==='results-heading'`);
  await wait(`[...document.querySelectorAll('[aria-live]')].some(n=>n.textContent.includes('הרשומה המקורית אינה מופיעה'))`);
  await evaluate('history.forward()'); await wait(`location.pathname.endsWith('/manage') && document.getElementById('management-status')?.textContent.includes('כבר מבוטלת')`);
  console.log('CHECK M3 Forward fresh already-cancelled context observed');
  assert(await evaluate(`!document.querySelector('.success') && !document.getElementById('management-review')`), 'no receipt/token restoration or autosubmit');

  // Isolated fixture copy is visibly different, then lost response quarantines all flows after reload.
  native = false; cancelled = false; selected = f.managementStateFixture(); mode = 'ordinary';
  console.log('CHECK M3 simulation label and post-dispatch lost-response quarantine');
  await ready(); assert(await evaluate(`document.querySelector('main').textContent.includes('סימולציה מבודדת')`));
  native = true; await ready(); await createDraft(); await prepare(); await openReview();
  await accept(); const loss = held(); pending = undefined; loss.res.destroy();
  await wait(`document.getElementById('management-status')?.textContent.includes('תוצאת העדכון אינה ידועה')`);
  const lostCount = commandCount(); await navigate('/employees/9001/shift-days/6201/manage');
  await wait(`document.getElementById('management-status')?.textContent.includes('תוצאת העדכון אינה ידועה')`);
  assert(await evaluate(`!document.getElementById('management-prepare') && !document.getElementById('management-review')`));
  assert.equal(commandCount(), lostCount); assert.equal(external.length, 0); assert.deepEqual(browserErrors, []);
  console.log('CHECK targeted native F1/F2/exit browser interlock after management UNKNOWN');
  for (const [name, suffix] of [['stage', 'stage-arrival'], ['station', 'station-arrival'], ['exit', 'station-exit']]) {
    family = name;
    await navigate('/employees/9001/shift-days/6201/' + suffix);
    await wait(`document.querySelector('main')?.textContent.includes('RECOVERY REQUIRED')`);
    assert.equal(commandCount(), lostCount, 'cross-operation quarantine: ' + name);
    assert(!calls.some(c => c.path.includes('/' + suffix + '/')), 'no native context/prepare/command after M3 uncertainty');
  }
  console.log('PASS U49 real Chrome / typed HTTP DOUBLE ONLY: create/change/cancel/CSV2 atomic receipt-shape, invalid CSV, original bytes, exact query page25, Back/Forward, no receipt restore, UNKNOWN reload quarantine, keyboard Escape/trap/opener/first error.');
  console.log('MEASUREMENTS ' + JSON.stringify(measures));
} finally {
  const tail = (() => pending)();
  if (tail) { tail.res.destroy(); pending = undefined; }
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([send('Browser.close'), pause(2000)]); } catch { /* Owned Chrome may close socket first. */ }
    socket.close();
  }
  if (chrome.exitCode === null) {
    const exited = once(chrome, 'exit'); chrome.kill(); await Promise.race([exited, pause(3000)]);
  }
  const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed;
  hooks.deregister();
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  console.log('CLEANUP owned HTTP server/Chrome/profile closed; no backend runtime, DB, EMS, screenshots or fixture content logs.');
}
