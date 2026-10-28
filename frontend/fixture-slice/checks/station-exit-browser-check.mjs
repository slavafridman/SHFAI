// Owned Chrome/port0 + production artifact + typed HTTP doubles. NO backend runtime.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startStationBrowserServer } from './station-arrival-browser-server.mts';
import { stationExitBrowserDouble as double } from './station-exit-browser-double.mts';
import { physicalInput, formReadyExpression } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';
import { proveArrivalFocus } from './arrival-focus-proof.mjs';
const protocol = process.argv.includes('--native-protocol-double');
const helper = await startStationBrowserServer(false, false, protocol), app = helper.origin;
const profile = resolve(`.angular/exit-chrome-${crypto.randomUUID()}`);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank'],
  { stdio: 'ignore' });
let socket, seq = 0, paused, mode = 'ordinary', recorded = null, source = 'exit', cdp;
const waiting = new Map(), calls = [], errors = [], external = [];
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, ms = 15000) {
  const start = performance.now();
  while (performance.now() - start < ms) { const result = await fn(); if (result) return result; await pause(30); }
  throw Error('Timeout: ' + label);
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq; waiting.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
const wait = expression => until(() => evaluate(expression), expression);
const count = name => calls.filter(c => c.path.endsWith('/' + name)).length;
async function fulfill(e, body) {
  await send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 200, responseHeaders: [
    { name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' },
    { name: 'X-Content-Type-Options', value: 'nosniff' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function intercept(e) {
  const url = new URL(e.request.url), path = url.pathname;
  calls.push({ path, method: e.request.method, body: e.request.postData });
  if (path === '/api/v1/identity') {
    const p = double.identity();
    if (source === 'fixture') {
      p.dataSource = 'isolated-fixture'; p.principal.capabilities.splice(7, 3,
        'attendance-stage-arrival:prepare', 'attendance-stage-arrival:commit',
        'attendance-station-arrival:prepare', 'attendance-station-arrival:commit');
    }
    return fulfill(e, p);
  }
  if (path === '/api/v1/attendance/filter-context') return fulfill(e, {
    defaults: { attendanceDate: '2026-10-28', timeFrom: '10:00', timeTo: '10:00', mokedCode: '0012',
      teamCodes: [], innerJobCodes: [], workLocations: [] },
    mokedOptions: [{ code: '0012', label: 'מוקד בדיקה סינתטי', unitType: 'G01' }],
    teamOptions: [{ code: '0021', label: 'צוות בדיקה סינתטי', unitType: 'J01', parentMokedCode: '0012' }],
    innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only',
  });
  if (path === '/api/v1/attendance') {
    const p = url.searchParams, c = double.context(mode, recorded);
    return fulfill(e, {
      items: [{ shiftDayId: '6201', employee: { employeeId: '9001', firstName: 'עובד', lastName: 'בדיקה סינתטי',
        unit: { code: '0021', label: 'צוות בדיקה סינתטי', moked: { code: '0012', label: 'מוקד בדיקה סינתטי', unitType: 'G01' } } },
      planned: { ...c.planned, workingFromHome: false, activities: [], activityFallback: null, innerJob: null },
      attendance: { stageArrivalLocal: c.recorded.stageArrivalLocal, stationArrivalLocal: c.recorded.stationArrivalLocal,
        stationExitLocal: c.recorded.stationExitLocal, missingReasonCode: null, briefingRecorded: c.recorded.briefing } }],
      applied: { attendanceDate: p.get('attendanceDate'), timeFrom: p.get('timeFrom'), timeTo: p.get('timeTo'),
        mokedCode: p.get('mokedCode'), teamCodes: [], innerJobCodes: [], workLocations: [], sort: 'effective-start-asc' },
      page: { limit: Number(p.get('limit')), offset: Number(p.get('offset')), hasMore: false, nextOffset: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only',
    });
  }
  assert.equal(url.search, '');
  if (path.endsWith('/station-exit/context')) return fulfill(e, double.context(mode, recorded));
  if (path.endsWith('/station-exit/validations')) {
    assert.equal(e.request.method, 'POST'); assert.deepEqual(JSON.parse(e.request.postData), {});
    return fulfill(e, double.validation());
  }
  if (path.endsWith('/station-exit/commands')) { assert.equal(paused, undefined); paused = e; return; }
  throw Error('Unexpected endpoint: ' + path);
}
async function key(key, code = key, modifiers = 0) {
  await send('Page.bringToFront'); await wait('document.hasFocus()');
  if (key === 'Escape') await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  const vk = { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[key] ?? 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: vk,
    ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: vk });
}
async function activate(selector) {
  await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing button');
    n.scrollIntoView({block:'center'});n.focus({preventScroll:true});})()`);
  await key('Enter');
}
async function navigate(path) {
  await evaluate('window.__exitLeaving=true');
  await send('Page.navigate', { url: app + path });
  await wait(`window.__exitLeaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
}
async function enter() {
  await navigate('/attendance');
  await wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit'));
  const input = physicalInput({ send, evaluate, wait });
  const plan = protocol ? helper.exitInspect().planned.startLocal : null;
  await input('attendance-date', plan ? `${plan.slice(8,10)}/${plan.slice(5,7)}/${plan.slice(0,4)}` : '28/10/2026');
  await input('attendance-timeFrom', plan ? plan.slice(11,16) : '09:00'); await input('attendance-timeTo', plan ? plan.slice(11,16) : '11:00');
  await activate('#attendance-submit'); await wait(`!!document.getElementById('attendance-exit-6201')`);
  assert(await evaluate(`document.getElementById('attendance-exit-6201').textContent==='יציאה מעמדה — בדיקת כשירות במסד TEST' &&
    document.getElementById('attendance-exit-6201').getAttribute('aria-label').includes(${JSON.stringify(protocol ? 'PROTOCOL DOUBLE' : 'עובד בדיקה סינתטי')}) &&
    !document.getElementById('attendance-arrival-6201') && !document.getElementById('attendance-station-6201')`));
  await evaluate(`(()=>{const n=document.getElementById('attendance-exit-6201'); n.scrollIntoView({block:'center'}); n.focus({preventScroll:true});
    const t=document.querySelector('.table-wrap');t.scrollLeft=-80;window.__exitOrigin={scroll:scrollY,horizontal:t.scrollLeft};})()`);
  await key('Enter'); await wait(`!!document.getElementById('exit-validate')`);
}
async function prepare() {
  await activate('#exit-validate');
  await wait(`!!document.getElementById('exit-confirm') && document.getElementById('exit-confirm').getAttribute('aria-disabled')!=='true'`);
}
async function open() {
  await activate('#exit-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
  await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
}
async function accept() {
  await evaluate(`document.querySelector('#native-exit-operation-ack input').focus()`); await key(' ', 'Space');
  await wait(`!document.getElementById('native-exit-operation-confirm').disabled`);
  await activate('#native-exit-operation-confirm');
  await until(() => paused, 'one synthetic command held pending');
  await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='exit-confirm'`);
}
async function geometry(width) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth &&
    getComputedStyle(document.querySelector('.exit-page')).direction==='rtl' &&
    [...document.querySelectorAll('.exit-page button')].every(n=>{const r=n.getBoundingClientRect();return r.height>=24;})`), 'RTL/reflow/targets ' + width);
}
try {
  await until(async () => { try {
    const port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
    if (!/^\d+$/.test(port)) return false; cdp = 'http://127.0.0.1:' + port; return (await fetch(cdp + '/json/version')).ok;
  } catch { return false; } }, 'owned Chrome readiness');
  const target = await fetch(cdp + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = waiting.get(m.id); if (p) { waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); } }
    else if (m.method === 'Fetch.requestPaused') void intercept(m.params).catch(e => errors.push(e.message));
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    else if (m.method === 'Network.requestWillBeSent') {
      const url = m.params.request.url;
      if (protocol && url.startsWith(app + '/api/')) calls.push({ path: new URL(url).pathname, method: m.params.request.method, body: m.params.request.postData });
      if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:')) external.push(url);
    }
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  if (!protocol) await send('Fetch.enable', { patterns: [{ urlPattern: app + '/api/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (protocol) {
    await enter();
    assert.equal(helper.exitInspect().syntheticAllowanceConsumed, false);
    await prepare(); await open(); await key('Escape');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='exit-confirm'`);
    assert.equal(count('commands'), 0); assert.equal(helper.exitInspect().syntheticAllowanceConsumed, false);
    assert.equal(helper.exitInspect().events.filter(e => e === 'write:update' || e === 'write:commit').length, 0);
    await geometry(320); await prepare(); await open();
    await evaluate(`document.querySelector('#native-exit-operation-ack input').focus()`); await key(' ', 'Space');
    await wait(`!document.getElementById('native-exit-operation-confirm').disabled`);
    helper.exitHold(); await activate('#native-exit-operation-confirm');
    await until(() => helper.exitInspect().events.includes('write:update'), 'actual exit UoW double DML');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='exit-confirm'`);
    for (let i = 0; i < 3; i++) await key(' ', 'Space');
    assert.equal(count('commands'), 1);
    helper.exitRelease();
    await wait(`document.getElementById('exit-status').textContent.includes('השרת אישר COMMIT')`);
    await proveArrivalFocus({ send, evaluate }, '#exit-confirm', 'exit actual protocol success 320');
    const proof = helper.exitInspect();
    assert.equal(proof.committed, true); assert.equal(proof.syntheticAllowanceConsumed, true);
    assert.equal(proof.events.filter(e => e === 'write:update').length, 1);
    assert.equal(proof.events.filter(e => e === 'write:commit').length, 1);
    assert(proof.events.includes('write:commit-ack'));
    assert(proof.events.some((e, i) => e === 'read:lease' && i > proof.events.indexOf('write:commit-ack')), 'separate readback');
    assert.deepEqual(Object.keys(proof.attendance).filter(k => proof.attendance[k] !== proof.before[k]).sort(),
      ['STATION_EXIT_TIME', 'STATION_EXIT_USER'], 'all other attendance columns preserved');
    const updates = proof.sql.filter(s => s.sql.includes('exit:update')); assert.equal(updates.length, 1);
    const set = updates[0].sql.split(/\bSET\b/i)[1].split(/\bWHERE\b/i)[0];
    assert.deepEqual([...set.replace(/'(?:''|[^'])*'/g, "''").matchAll(/\b([A-Z_]+)\s*=/g)].map(m => m[1]),
      ['STATION_EXIT_TIME', 'STATION_EXIT_USER']);
    const posted = JSON.parse(calls.find(c => c.path.endsWith('/commands')).body);
    assert.deepEqual(Object.keys(posted).sort(), ['commandId', 'draft', 'fingerprint', 'operationConfirmation', 'validationToken']);
    assert.deepEqual(posted.draft, {}); assert.deepEqual(posted.operationConfirmation, { accepted: true });
    for (const operation of ['stage-arrival', 'station-arrival']) {
      const result = await evaluate(`(async()=>{const r=await fetch('/api/v1/employees/9001/shift-days/6201/${operation}/context',{cache:'no-store'});
        const b=await r.json();return {status:r.status,code:b.code};})()`);
      assert.deepEqual(result, { status: 403, code: 'LIVE_WRITES_DISABLED' });
    }
    const result = await evaluate(`(async()=>{const r=await fetch('/api/v1/employees/9001/shift-days/6201',{cache:'no-store'});
      const b=await r.json();return {status:r.status,source:b.dataSource,attendance:b.attendance};})()`);
    assert.deepEqual(result, { status: 200, source: 'oracle', attendance: {
      stageArrivalLocal: proof.before.STAGE_ARRIVAL_TIME, stationArrivalLocal: proof.before.STATION_ARRIVAL_TIME,
      stationExitLocal: proof.attendance.STATION_EXIT_TIME } });
    assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0, external.join('\n'));
    console.log('PASS §47 actual native HTTP/application/UoW + Oracle PROTOCOL DOUBLE: UI selected tuple -> pure prepare -> Escape0 effects -> whole-operation consent -> one exact two-SET UPDATE -> COMMIT ACK + separate matching readback; ALL other attendance columns preserved, null stage/briefing; F1/F2 disabled403.');
    console.log(JSON.stringify({ mode: 'actual-backend-protocol-double', oracle: false, realAllowance: false,
      commands: count('commands'), widths: [1440,320], fullWcagConformance: false, manualAT: false }));
  } else {
  for (const blocked of ['early', 'missing']) {
    mode = blocked; await enter();
    await wait(`document.getElementById('exit-validate').getAttribute('aria-disabled')==='true'`);
    const copy = blocked === 'early' ? 'יציאה מוקדמת דורשת החלטת מנהל — התהליך אינו זמין בגרסה זו' : 'נדרשת הגעה רשומה לעמדה לפני יציאה';
    assert(await evaluate(`document.body.textContent.includes(${JSON.stringify(copy)}) && !document.querySelector('.exit-page input,.exit-page mat-select')`));
    assert.equal(count('validations'), 0); assert.equal(count('commands'), 0);
  }
  mode = 'ordinary'; await enter();
  for (const width of [1440, 390, 320]) {
    await geometry(width); await prepare(); await open();
    assert(await evaluate(`document.getElementById('native-exit-operation-confirm').disabled &&
      !document.querySelector('#native-exit-operation-ack input').checked &&
      document.activeElement.id==='native-exit-operation-cancel' &&
      document.querySelector('mat-dialog-container').scrollWidth<=innerWidth`));
    for (let i = 0; i < 10; i++) {
      await key('Tab');
      assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`), 'dialog keyboard trap');
    }
    await key('Tab', 'Tab', 8);
    assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`));
    await key('Escape');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='exit-confirm'`);
    await proveArrivalFocus({ send, evaluate }, '#exit-confirm', `exit Escape ${width}`);
    assert.equal(count('commands'), 0);
  }
  await prepare(); await open(); await accept();
  const committed = paused; paused = undefined;
  const command = JSON.parse(committed.request.postData);
  assert.deepEqual(Object.keys(command).sort(), ['commandId', 'draft', 'fingerprint', 'operationConfirmation', 'validationToken']);
  assert.deepEqual(command.draft, {}); assert.deepEqual(command.operationConfirmation, { accepted: true });
  for (let i = 0; i < 3; i++) await key(' ', 'Space');
  assert.equal(count('commands'), 1);
  await proveArrivalFocus({ send, evaluate }, '#exit-confirm', 'exit pending 320');
  recorded = '2026-10-28T17:59:04'; await fulfill(committed, double.receipt(command));
  await wait(`document.getElementById('exit-status').textContent.includes('השרת אישר COMMIT')`);
  await proveArrivalFocus({ send, evaluate }, '#exit-confirm', 'exit success 320');
  assert(await evaluate(`document.body.textContent.includes('בדיקה חוזרת עצמאית') &&
    !sessionStorage.getItem('shfNativeStationExitSafety')`));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await activate('#exit-back'); await wait(`location.pathname==='/attendance' && !!document.getElementById('attendance-exit-6201')`);
  assert(await evaluate(`document.activeElement.id==='attendance-exit-6201' &&
    document.getElementById('attendance-timeFrom').value==='09:00' && document.getElementById('attendance-timeTo').value==='11:00' &&
    Math.abs(scrollY-window.__exitOrigin.scroll)<=2 && document.querySelector('.table-wrap').scrollLeft===window.__exitOrigin.horizontal`), 'origin focus, filters and both scroll axes');
  await evaluate('history.forward()');
  await wait(`location.pathname.endsWith('/station-exit') && document.getElementById('exit-status')?.textContent.includes('לקריאה בלבד')`);
  assert(await evaluate(`!document.body.textContent.includes('מזהה פקודה:') &&
    document.getElementById('exit-validate').getAttribute('aria-disabled')==='true'`));
  assert.equal(count('commands'), 1);
  // New clean document with synthetic server originals, not a reset of UNKNOWN.
  recorded = null; await enter(); await geometry(320); await prepare(); await open(); await accept();
  const unknown = paused; paused = undefined;
  await fulfill(unknown, { ...double.receipt(JSON.parse(unknown.request.postData)), readBackVerifiedAt: null });
  await wait(`document.getElementById('exit-status').textContent.includes('תוצאת העדכון אינה ידועה')`);
  await proveArrivalFocus({ send, evaluate }, '#exit-confirm', 'exit UNKNOWN 320');
  const commands = count('commands'), contexts = count('context');
  await navigate('/station-exit');
  await wait(`document.getElementById('exit-status')?.textContent.includes('RECOVERY REQUIRED')`);
  assert.equal(count('commands'), commands); assert.equal(count('context'), contexts);
  source = 'fixture'; await navigate('/station-arrival');
  await wait(`document.getElementById('station-status')?.textContent.includes('RECOVERY REQUIRED')`);
  await navigate('/stage-arrival');
  await wait(`document.getElementById('arrival-status')?.textContent.includes('RECOVERY REQUIRED')`);
  assert.equal(count('commands'), commands); assert.equal(count('context'), contexts);
  assert(await evaluate(`sessionStorage.getItem('shfNativeStationExitSafety') &&
    !sessionStorage.getItem('shfNativeStationArrivalSafety') && !sessionStorage.getItem('shfNativeArrivalSafety')`));
  assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0, external.join('\n'));
  console.log('PASS §47 SYNTHETIC CDP: exact selected opener; early/missing blockers; server bounds; 1440/390/320 RTL/reflow/targets; checkbox/trap/Escape/zero commands; pending duplicates; ACK+readback DTO; origin filters/focus + forward readonly; malformed readback UNKNOWN/reload/cross-source F1/F2 interlock.');
  console.log(JSON.stringify({ mode: 'typed-synthetic-http-only', backendRuntime: false, oracle: false,
    widths: [1440, 390, 320], commands, runtimeErrors: errors.length, fullWcagConformance: false, manualAT: false }));
  }
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} socket.close(); }
  if (chrome.exitCode === null) chrome.kill();
  try { await pause(200); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 }); }
  finally { await helper.close(); }
}
