// Chrome + SYNTHETIC Fetch interception ONLY. No Oracle/native adapter,
// accounts, ENV, protected files, real records, SQL or backend imports.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { formReadyExpression, physicalInput } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';
import { proveArrivalFocus } from './arrival-focus-proof.mjs';
const app = 'http://127.0.0.1:4406', cdp = 'http://127.0.0.1:9406';
const httpDouble = process.argv.includes('--http-double');
const focusRetest = process.argv.includes('--focus-retest');
const profile = resolve(`.angular/native-arrival-${crypto.randomUUID()}`);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=9406', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--disable-component-update', 'about:blank'], { stdio: 'ignore' });
let socket, targetId, sequence = 0, mode = 'clean', identityMode = 'native', pausedCommand;
let requests = [], errors = [], external = [];
const pending = new Map();
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, name, ms = 15000) {
  const end = performance.now() + ms;
  while (performance.now() < end) { const result = await fn(); if (result) return result; await pause(25); }
  throw Error('Timeout: ' + name);
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
const wait = expression => until(() => evaluate(expression), expression);
const count = suffix => requests.filter(r => r.path.endsWith('/' + suffix)).length;
const rights = ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read',
  'employee:read', 'attendance:read', 'attendance-stage-arrival:prepare', 'attendance-stage-arrival:commit',
  'attendance-stage-arrival:test-oracle-write'];
const fixture = () => identityMode === 'fixture9';
const identity = () => ({ principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
  displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
  capabilities: rights.slice(0, identityMode === 'read7' ? 7 : fixture() ? 9 : 10), resourceScope: { orgUnitIds: ['0021'] } },
  dataSource: fixture() ? 'isolated-fixture' : 'oracle' });
const context = () => ({
  employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
  planned: { startLocal: '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
  recorded: { stageArrivalLocal: mode === 'already' ? '2026-10-20T10:21:00' : null,
    stationArrivalLocal: null, stationExitLocal: null, briefing: false },
  serverTime: { instant: '2026-10-20T07:22:00.000Z', local: '2026-10-20T10:22:00', businessTimeZone: 'Asia/Jerusalem' },
  eligibility: mode === 'already' ? 'already-recorded' : 'eligible', blockers: [],
  lateReasonOptions: [], dataSource: fixture() ? 'isolated-fixture' : 'oracle-test',
});
const validation = () => ({
  employeeId: '9001', shiftDayId: '6201', state: 'ready',
  evaluatedAt: '2026-10-20T07:22:00.000Z', evaluatedLocal: '2026-10-20T10:22:00',
  expiresAt: '2026-10-20T07:24:00.000Z', businessTimeZone: 'Asia/Jerusalem',
  fingerprint: 'a'.repeat(64), validationToken: 'x'.repeat(43), warnings: [], confirmationRequired: false,
  dataSource: 'oracle-test',
});
const problem = (status, code, commandId = null, effect = 'none', nextAction = 'stop') =>
  ({ type: `urn:shf:problem:${code}`, title: 'SYNTHETIC HTTP refusal', status, code,
    requestId: 'synthetic-native', commandId, effect, nextAction });
async function fulfill(e, body, status = 200) {
  await send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status, responseHeaders: [
    { name: 'Content-Type', value: status === 200 ? 'application/json' : 'application/problem+json' },
    { name: 'Cache-Control', value: 'no-store' }, { name: 'X-Content-Type-Options', value: 'nosniff' },
  ], body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function intercept(e) {
  const url = new URL(e.request.url), path = url.pathname;
  requests.push({ path, method: e.request.method });
  if (path !== '/api/v1/attendance') assert.equal(url.search, '');
  if (path === '/api/v1/identity') return fulfill(e, identity());
  if (path === '/api/v1/attendance/filter-context') return fulfill(e, {
    defaults: { attendanceDate: '2026-10-20', timeFrom: '10:30', timeTo: '10:30',
      mokedCode: '0012', teamCodes: [], innerJobCodes: [], workLocations: [] },
    mokedOptions: [{ code: '0012', label: 'מוקד סינתטי', unitType: 'G01' }],
    teamOptions: [{ code: '0021', label: 'צוות סינתטי', unitType: 'J01', parentMokedCode: '0012' }],
    innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
    businessTimeZone: 'Asia/Jerusalem', dataSource: fixture() ? 'isolated-fixture' : 'oracle-read-only',
  });
  if (path === '/api/v1/attendance') {
    const p = url.searchParams;
    return fulfill(e, {
      items: [{ shiftDayId: '6201', employee: { employeeId: '9001', firstName: 'עובד/ת', lastName: 'SYNTHETIC TEST',
        unit: { code: '0021', label: 'צוות סינתטי', moked: { code: '0012', label: 'מוקד סינתטי', unitType: 'G01' } } },
      planned: { ...context().planned, workingFromHome: false, activities: [], activityFallback: null, innerJob: null },
      attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
        missingReasonCode: null, briefingRecorded: false } }],
      applied: { attendanceDate: p.get('attendanceDate'), timeFrom: p.get('timeFrom'), timeTo: p.get('timeTo'),
        mokedCode: p.get('mokedCode'), teamCodes: [], innerJobCodes: [], workLocations: [], sort: 'effective-start-asc' },
      page: { limit: Number(p.get('limit')), offset: Number(p.get('offset')), hasMore: false, nextOffset: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: fixture() ? 'isolated-fixture' : 'oracle-read-only',
    });
  }
  if (path.endsWith('/stage-arrival/context')) return fulfill(e, context());
  if (path.endsWith('/validations')) {
    assert.deepEqual(JSON.parse(e.request.postData), { lateReasonCode: null, lateRemark: null });
    if (mode === 'late') return fulfill(e, problem(409, 'COMMAND_SCOPE_DEFERRED'), 409);
    if (mode === 'forged-clock') return fulfill(e, { ...validation(), evaluatedLocal: '2026-10-20T11:22:00' });
    if (mode === 'wrong-employee') return fulfill(e, { ...validation(), employeeId: '9002' });
    if (mode === 'late-warning') return fulfill(e, { ...validation(), state: 'warning-requires-confirmation',
      warnings: [{ code: 'STAGE_ARRIVAL_LATE', minutes: '0' }], confirmationRequired: true });
    return fulfill(e, validation());
  }
  if (path.endsWith('/commands')) {
    const c = JSON.parse(e.request.postData);
    assert.deepEqual(Object.keys(c).sort(), ['commandId', 'draft', 'validationToken', 'fingerprint', 'confirmation', 'operationConfirmation'].sort());
    assert.deepEqual(c.operationConfirmation, { accepted: true }); assert.equal(c.confirmation, null);
    assert.deepEqual(c.draft, { lateReasonCode: null, lateRemark: null });
    assert.equal(c.fingerprint, 'a'.repeat(64)); assert.equal(c.validationToken, 'x'.repeat(43));
    pausedCommand = { event: e, body: c }; return;
  }
  throw Error('Unexpected synthetic endpoint ' + path);
}
async function key(key, code = key, modifiers = 0) {
  await send('Page.bringToFront'); await wait('document.hasFocus()');
  const vk = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[key] ?? 0;
  if (key === 'Escape') await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: vk,
    ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: vk });
}
async function activate(selector, space = false) {
  await evaluate(`(() => { const n=document.querySelector(${JSON.stringify(selector)}); if(!n)throw Error('Missing target');
    n.scrollIntoView({block:'center'}); n.focus({preventScroll:true}); if(document.activeElement!==n)throw Error('Focus'); })()`);
  await key(space ? ' ' : 'Enter', space ? 'Space' : 'Enter');
}
async function navigate(path) {
  await evaluate('window.__leaving=true');
  await send('Page.navigate', { url: app + path });
  await wait(`!window.__leaving && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
}
async function newCase(name, actor = 'native') {
  if (socket) { await send('Target.closeTarget', { targetId }); socket.close(); }
  mode = name; identityMode = actor; pausedCommand = null; requests = [];
  const target = await fetch(cdp + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  targetId = target.id; socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); } }
    else if (m.method === 'Fetch.requestPaused') void intercept(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    else if (m.method === 'Network.requestWillBeSent') {
      const url = m.params.request.url;
      if (httpDouble && url.startsWith(app + '/api/')) {
        requests.push({ path: new URL(url).pathname, method: m.params.request.method });
        if (url.endsWith('/stage-arrival/commands')) pausedCommand = { body: JSON.parse(m.params.request.postData) };
      }
      if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:')) external.push(url);
    }
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (!httpDouble) await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__testElapsed=0;
    {const actual=performance.now.bind(performance);performance.now=()=>actual()+window.__testElapsed;}` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate('/attendance');
}
async function enter(fromCurrent = false) {
  if (!fromCurrent) await navigate('/attendance');
  await wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit',
    { 'attendance-date': '20/10/2026', 'attendance-timeFrom': '10:30', 'attendance-timeTo': '10:30' }));
  const input = physicalInput({ send, evaluate, wait });
  await input('attendance-date', '20/10/2026');
  await activate('#attendance-submit');
  await wait(`!!document.getElementById('attendance-arrival-6201')`);
  await activate('#attendance-arrival-6201');
  await wait(`!!document.getElementById('arrival-validate') || !!document.getElementById('recovery-title') ||
    document.getElementById('arrival-status')?.textContent.includes('אינה כשירה')`);
}
async function prepare() {
  await activate('#arrival-validate');
  await wait(`!!document.getElementById('arrival-review-title') || document.getElementById('arrival-status').textContent.includes('COMMAND_SCOPE_DEFERRED') ||
    document.getElementById('arrival-status').textContent.includes('אינה תואמת')`);
}
async function openConfirmation() {
  await activate('#arrival-confirm');
  const ready = await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  assert.equal(ready.kind, 'dialog'); assert(ready.stableFrames >= 3);
  assert.equal(await evaluate('document.activeElement.id'), 'native-operation-cancel');
}
async function approve() {
  await openConfirmation();
  await activate('#native-operation-ack input', true);
  await wait(`document.querySelector('#native-operation-ack input').checked && !document.getElementById('native-operation-confirm').disabled`);
  await activate('#native-operation-confirm');
  await until(() => pausedCommand, 'one native command paused');
  await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='arrival-confirm'`);
  assert.equal(count('commands'), 1);
}
async function answer(kind) {
  const { event, body: c } = pausedCommand; pausedCommand = null;
  if (kind === 'network') return send('Fetch.failRequest', { requestId: event.requestId, errorReason: 'ConnectionReset' });
  if (kind === 'unknown') return fulfill(event, problem(503, 'COMMAND_OUTCOME_UNKNOWN', c.commandId, 'unknown', 'reconcile'), 503);
  if (kind === 'stale') return fulfill(event, problem(409, 'STALE_PREPARATION', c.commandId, 'none', 'prepare-again'), 409);
  const r = { commandId: c.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'oracle-test-committed',
    recorded: { stageArrivalLocal: '2026-10-20T10:22:05', briefing: false, stageLate: null },
    commitAcknowledgedAt: '2026-10-20T07:22:06.000Z', readBackVerifiedAt: '2026-10-20T07:22:07.000Z',
    businessTimeZone: 'Asia/Jerusalem', replayed: false, partnerCompletion: 'not-invoked',
    dataSource: 'oracle-test', receiptPersistence: 'none' };
  if (kind === 'no-readback') delete r.readBackVerifiedAt;
  if (kind === 'fixture-receipt') { r.dataSource = 'isolated-fixture'; r.outcome = 'fixture-committed'; }
  return fulfill(event, r);
}
async function screenshot(name) {
  await mkdir('.angular/browser-evidence', { recursive: true });
  const { data } = await send('Page.captureScreenshot', { captureBeyondViewport: false });
  await writeFile(`.angular/browser-evidence/NATIVE-${name}-SYNTHETIC.png`, Buffer.from(data, 'base64'));
}
try {
  await until(async () => { try { return (await fetch(cdp + '/json/version')).ok; } catch { return false; } }, 'own Chrome readiness');
  if (httpDouble) {
    await newCase('clean'); await enter(true); await prepare();
    assert.equal(count('commands'), 0);
    await openConfirmation(); await key('Escape');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='arrival-confirm'`);
    assert.equal(count('commands'), 0);
    await prepare(); await approve();
    await proveArrivalFocus({ send, evaluate }, '#arrival-confirm', 'HTTP pending 1440');
    for (let i = 0; i < 3; i++) await key(' ', 'Space');
    assert.equal(count('commands'), 1);
    await wait(`!!document.getElementById('arrival-success')`);
    await proveArrivalFocus({ send, evaluate }, '#arrival-confirm', 'HTTP success 1440');
    assert(await evaluate(`document.getElementById('arrival-success').textContent.includes('oracle-test-committed') &&
      !history.state.shfNativeSafety && document.activeElement.id==='arrival-confirm'`));
    const detail = await evaluate(`fetch('/api/v1/employees/9001/shift-days/6201').then(r=>r.json()).then(r=>({
      source:r.dataSource,stage:r.attendance.stageArrivalLocal}))`);
    assert.deepEqual(detail, { source: 'oracle', stage: '2026-10-20T10:22:05' });
    await screenshot('http-double-success-1440');
    await activate('#arrival-cancel');
    await wait(`document.activeElement.id==='attendance-arrival-6201'`);
    assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`), '10:30');
    assert.equal(await evaluate(`document.getElementById('attendance-date').value`), '20/10/2026');
    assert(await evaluate(`document.querySelector('tbody').textContent.includes('20/10/2026 10:22:05')`));
    assert.equal(count('commands'), 1);
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('NATIVE Chrome + real same-origin HTTP PASS — typed SYNTHETIC STUB ONLY, NOT Oracle/native adapter; prepare/escape0, command1', {
      context: count('context'), validations: count('validations'), commands: count('commands'),
    });
  } else if (focusRetest) {
    for (const width of [1440, 390, 320]) for (const outcome of ['clean', 'unknown']) {
      await newCase('clean'); await enter(true);
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await evaluate(`document.documentElement.style.fontSize=${width === 320 ? "'30px'" : "''"}`);
      await prepare();
      // Establish keyboard modality, then the exact review opener. No geometry
      // assistance is performed after the command transitions/layout changes.
      await key('Tab');
      await evaluate(`document.getElementById('arrival-confirm').focus({preventScroll:true})`);
      await evaluate(`document.getElementById('arrival-confirm').scrollIntoView({block:'center'})`);
      await proveArrivalFocus({ send, evaluate }, '#arrival-confirm', `review ${width}/${outcome}`);
      await openConfirmation();
      await proveArrivalFocus({ send, evaluate }, '#native-operation-cancel', `Cancel ${width}/${outcome}`);
      if (outcome === 'clean') await screenshot(`focus-retest-Cancel-${width}`);
      await activate('#native-operation-ack input', true);
      await wait(`document.querySelector('#native-operation-ack input').checked && !document.getElementById('native-operation-confirm').disabled`);
      await key('Tab'); await key('Tab');
      await proveArrivalFocus({ send, evaluate }, '#native-operation-confirm', `final-confirm ${width}/${outcome}`);
      if (outcome === 'clean') await screenshot(`focus-retest-final-confirm-${width}`);
      await key('Enter'); await until(() => pausedCommand, 'native command paused');
      await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='arrival-confirm'`);
      await proveArrivalFocus({ send, evaluate }, '#arrival-confirm', `pending ${width}/${outcome}`);
      await screenshot(`focus-retest-pending-${width}-${outcome}`);
      for (let i = 0; i < 3; i++) await key(' ', 'Space');
      assert.equal(count('commands'), 1);
      await answer(outcome);
      await wait(outcome === 'clean' ? `!!document.getElementById('arrival-success')` :
        `document.getElementById('arrival-status').textContent.includes('UNKNOWN')`);
      await proveArrivalFocus({ send, evaluate }, '#arrival-confirm', `${outcome === 'clean' ? 'SUCCESS' : 'UNKNOWN'} ${width}`);
      await screenshot(`focus-retest-${outcome}-${width}${width === 320 ? '-font30' : ''}`);
    }
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('PASS UI-D01/UI-D02 bounded retest: exact rings/pixels/geometry/contrast at all three viewports; command1 each');
  } else {
  await newCase('clean'); await enter(true);
  assert(await evaluate(`document.body.textContent.includes('Controlled TEST Oracle write') &&
    document.body.textContent.includes('oracle-test') && !document.body.textContent.includes('ללא כתיבות Oracle') &&
    document.documentElement.dir==='rtl' && !document.querySelector('shf-stage-arrival input, shf-stage-arrival mat-select')`));
  await activate('#arrival-cancel');
  await wait(`document.activeElement.id==='attendance-arrival-6201'`);
  assert.equal(await evaluate(`document.getElementById('attendance-timeFrom').value`), '10:30');
  assert.equal(count('commands'), 0);
  await activate('#attendance-arrival-6201'); await wait(`!!document.getElementById('arrival-validate')`);
  await prepare(); assert.equal(count('commands'), 0);
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.documentElement.style.fontSize=${width === 320 ? "'30px'" : "''"}`);
    await openConfirmation();
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`), 'no page overflow ' + width);
    assert(await evaluate(`(() => { const n=document.querySelector('mat-dialog-container'),r=n.getBoundingClientRect();
      return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight &&
        [...n.querySelectorAll('button')].every(n=>n.getBoundingClientRect().height>=48); })()`), 'bounded dialog ' + width);
    await screenshot('confirmation-' + width + (width === 320 ? '-font30' : ''));
    await key('Tab'); assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`));
    await key('Escape'); await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='arrival-confirm'`);
    assert.equal(count('commands'), 0);
    await prepare();
  }
  await evaluate(`document.documentElement.style.fontSize=''`);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await openConfirmation(); await activate('#native-operation-cancel');
  await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='arrival-confirm'`);
  assert.equal(count('commands'), 0);
  await prepare(); await approve();
  for (let i = 0; i < 3; i++) await key(' ', 'Space');
  assert.equal(count('commands'), 1);
  assert.equal(await evaluate('document.activeElement.id'), 'arrival-confirm');
  assert(await evaluate(`document.getElementById('arrival-confirm').getAttribute('aria-disabled')==='true' &&
    history.state.shfNativeSafety[0].mode==='test-oracle-controlled' &&
    !/9001|6201|validationToken|fingerprint|recorded|receipt/.test(JSON.stringify(history.state))`));
  await answer('clean'); await wait(`!!document.getElementById('arrival-success')`);
  assert(await evaluate(`document.getElementById('arrival-success').textContent.includes('oracle-test-committed') &&
    !document.getElementById('arrival-success').textContent.includes('הצלחה בסימולציה') &&
    document.activeElement.id==='arrival-confirm' && !history.state.shfNativeSafety`));
  await screenshot('success-1440');
  console.log('PASS native intercepted prepare0 / Cancel+Escape0 / confirm1 / pending+200 focus / RTL 1440,390,320-font30');

  for (const kind of ['unknown', 'network', 'no-readback', 'fixture-receipt', 'stale']) {
    await newCase(kind); await enter(true); await prepare(); await approve(); await answer(kind);
    await wait(`document.getElementById('arrival-status').textContent.includes(${JSON.stringify(kind === 'stale' ? 'STALE_PREPARATION' : 'UNKNOWN')})`);
    assert.equal(count('commands'), 1); assert(await evaluate(`!document.getElementById('arrival-success') && document.activeElement.id==='arrival-confirm'`));
    if (kind === 'stale') {
      assert(await evaluate('!history.state.shfNativeSafety')); assert.equal(count('validations'), 1);
    } else {
      assert(await evaluate('history.state.shfNativeSafety.length===1'));
      const before = [count('context'), count('validations'), count('commands')];
      if (kind === 'unknown') {
        for (const actor of ['fixture9', 'read7', 'native']) {
          identityMode = actor;
          await navigate('/attendance');
          await wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit'));
          await activate('#attendance-submit'); await wait(`!!document.querySelector('tbody tr')`);
          if (actor === 'read7') assert(await evaluate(`!document.getElementById('attendance-arrival-6201')`));
          else {
            await wait(`!!document.getElementById('attendance-arrival-6201')`);
            await activate('#attendance-arrival-6201'); await wait(`!!document.getElementById('recovery-title')`);
            assert(await evaluate(`!document.body.textContent.includes('תהליך fixture מבודד חדש')`),
              'Unresolved native attempt must never offer fixture reset/new-demo guidance');
          }
          assert.deepEqual([count('context'), count('validations'), count('commands')], before);
        }
      }
      await send('Page.reload'); await wait(`!!document.getElementById('recovery-title')`);
      assert.deepEqual([count('context'), count('validations'), count('commands')], before);
    }
    console.log(`PASS synthetic POST1 ${kind}: honest ${kind === 'stale' ? 'known-none, explicit prepare only' : 'UNKNOWN, no cached receipt or recovery POST'}`);
  }
  for (const kind of ['late', 'forged-clock', 'wrong-employee', 'late-warning', 'already']) {
    await newCase(kind); await enter(true);
    if (kind !== 'already') await prepare();
    assert.equal(count('commands'), 0);
    assert(await evaluate(`!document.getElementById('arrival-confirm') && !document.querySelector('mat-dialog-container')`));
    console.log('PASS native refusal/guard0 ' + kind);
  }
  await newCase('expiry'); await enter(true); await prepare();
  await openConfirmation();
  await evaluate('window.__testElapsed=121000');
  await activate('#native-operation-ack input', true);
  await wait(`document.querySelector('#native-operation-ack input').checked && !document.getElementById('native-operation-confirm').disabled`);
  await activate('#native-operation-confirm');
  await wait(`!document.querySelector('mat-dialog-container') && document.getElementById('arrival-status').textContent.includes('תוקף הבדיקה פג')`);
  assert.equal(count('commands'), 0);
  console.log('PASS monotonic expiry0, no backdating/server-clock substitution');
  await newCase('pending'); await enter(true); await prepare(); await approve();
  const before = [count('context'), count('validations'), count('commands')];
  await send('Page.reload'); await wait(`!!document.getElementById('recovery-title')`);
  assert.deepEqual([count('context'), count('validations'), count('commands')], before);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log('NATIVE Chrome PASS — SYNTHETIC HTTP interception, NOT actual Oracle/native adapter evidence');
  }
} catch (e) {
  console.error('Native synthetic browser failure', e.message, await evaluate(`({
    path:location.pathname,status:document.getElementById('arrival-status')?.textContent,active:document.activeElement?.id,
    dialog:!!document.querySelector('mat-dialog-container')})`).catch(() => null), { errors });
  throw e;
} finally {
  if (socket?.readyState === 1) { try { await send('Browser.close'); } catch {} socket.close(); }
  if (chrome.exitCode === null) chrome.kill();
  await new Promise(r => chrome.exitCode !== null ? r() : chrome.once('exit', r));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
