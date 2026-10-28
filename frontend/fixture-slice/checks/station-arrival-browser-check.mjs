// Owned Chrome profile/tab only. Production artifact + synthetic intercepted HTTP.
// NO backend, DNS, Oracle, login verification or native F2 claim.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { physicalInput, formReadyExpression } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';
import { proveArrivalFocus } from './arrival-focus-proof.mjs';
import { startStationBrowserServer } from './station-arrival-browser-server.mts';
import { nativeStationBrowserDouble as nativeDouble } from './native-station-browser-double.mts';
const proxy = process.argv.includes('--fixture-proxy');
const nativeProtocol = process.argv.includes('--native-protocol-double');
const nativeStation = process.argv.includes('--native-station') || nativeProtocol;
assert(!(proxy && nativeStation), 'fixture backend and native intercepted protocols are distinct');
const helper = await startStationBrowserServer(proxy, nativeProtocol), app = helper.origin;
let cdp;
const profile = resolve(`.angular/f2-chrome-${crypto.randomUUID()}`);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank'],
  { stdio: 'ignore' });
let socket, seq = 0, paused, late = false, rightsCount = 11, stage = null, station = null;
const waiting = new Map(), calls = [], errors = [], external = [];
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, ms = 15000) {
  const start = performance.now();
  while (performance.now() - start < ms) { const value = await fn(); if (value) return value; await pause(30); }
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
const rights = ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read',
  'employee:read', 'attendance:read', 'attendance-stage-arrival:prepare', 'attendance-stage-arrival:commit',
  'attendance-station-arrival:prepare', 'attendance-station-arrival:commit'];
const identity = () => nativeStation ? nativeDouble.identity() : ({ principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
  displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
  capabilities: rights.slice(0, rightsCount), resourceScope: { orgUnitIds: ['0021'] } }, dataSource: 'isolated-fixture' });
const context = () => nativeStation ? nativeDouble.context(stage, station) : ({
  employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021',
  planned: { startLocal: late ? '2026-10-20T10:00:00' : '2026-10-20T10:30:00', endLocal: '2026-10-20T18:30:00' },
  recorded: { stageArrivalLocal: stage, stationArrivalLocal: station, stationExitLocal: null, briefing: false },
  serverTime: { instant: '2026-10-20T07:22:06.000Z', local: '2026-10-20T10:22:06', businessTimeZone: 'Asia/Jerusalem' },
  arrivalWindow: { earliestLocal: late ? '2026-10-20T09:00:00' : '2026-10-20T09:30:00', latestLocal: '2026-10-20T18:30:00' },
  withinArrivalWindow: true, eligibility: station ? 'already-recorded' : 'eligible', blockers: [],
  lateReasonOptions: [{ code: '1', label: 'סיבה סינתטית בלבד' }], dataSource: 'isolated-fixture',
});
const validation = (kind = 'station') => nativeStation ? nativeDouble.validation() : ({
  employeeId: '9001', shiftDayId: '6201', state: late ? 'warning-requires-confirmation' : 'ready',
  evaluatedAt: '2026-10-20T07:22:06.000Z', evaluatedLocal: '2026-10-20T10:22:06', expiresAt: '2026-10-20T07:24:06.000Z',
  businessTimeZone: 'Asia/Jerusalem', fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43),
  warnings: late ? [{ code: kind === 'station' ? 'STATION_ARRIVAL_LATE' : 'STAGE_ARRIVAL_LATE', minutes: '22' }] : [],
  confirmationRequired: late, dataSource: 'isolated-fixture',
});
async function fulfill(e, body, status = 200) {
  await send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: status, responseHeaders: [
    { name: 'Content-Type', value: status === 200 ? 'application/json' : 'application/problem+json' },
    { name: 'Cache-Control', value: 'no-store' }, { name: 'X-Content-Type-Options', value: 'nosniff' }],
  body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function intercept(e) {
  const url = new URL(e.request.url), path = url.pathname;
  calls.push({ path, method: e.request.method });
  if (path === '/api/v1/identity') return fulfill(e, identity());
  if (path.endsWith('/attendance/filter-context')) return fulfill(e, {
    defaults: { attendanceDate: '2026-10-20', timeFrom: '10:00', timeTo: '10:00', mokedCode: '0012',
      teamCodes: [], innerJobCodes: [], workLocations: [] },
    mokedOptions: [{ code: '0012', label: 'מוקד סימולציה', unitType: 'G01' }],
    teamOptions: [{ code: '0021', label: 'צוות סימולציה', unitType: 'J01', parentMokedCode: '0012' }],
    innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
    businessTimeZone: 'Asia/Jerusalem', dataSource: nativeStation ? 'oracle-read-only' : 'isolated-fixture',
  });
  if (path === '/api/v1/attendance') {
    const p = url.searchParams, c = context();
    return fulfill(e, {
      items: [{ shiftDayId: '6201', employee: { employeeId: '9001', firstName: 'עובד', lastName: 'סימולציה',
        unit: { code: '0021', label: 'צוות סימולציה', moked: { code: '0012', label: 'מוקד סימולציה', unitType: 'G01' } } },
      planned: { ...c.planned, workingFromHome: false, activities: [], activityFallback: null, innerJob: null },
      attendance: { stageArrivalLocal: stage, stationArrivalLocal: station, stationExitLocal: null,
        missingReasonCode: null, briefingRecorded: false } }],
      applied: { attendanceDate: p.get('attendanceDate'), timeFrom: p.get('timeFrom'), timeTo: p.get('timeTo'),
        mokedCode: p.get('mokedCode'), teamCodes: [], innerJobCodes: [], workLocations: [], sort: 'effective-start-asc' },
      page: { limit: Number(p.get('limit')), offset: Number(p.get('offset')), hasMore: false, nextOffset: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: nativeStation ? 'oracle-read-only' : 'isolated-fixture',
    });
  }
  assert.equal(url.search, '');
  if (path.endsWith('/stage-arrival/context')) {
    const c = context(); delete c.arrivalWindow; delete c.withinArrivalWindow;
    c.eligibility = stage ? 'already-recorded' : 'eligible'; return fulfill(e, c);
  }
  if (path.endsWith('/station-arrival/context')) return fulfill(e, context());
  if (path.endsWith('/validations')) return fulfill(e, validation(path.includes('/station-') ? 'station' : 'stage'));
  if (path.endsWith('/commands')) { assert.equal(paused, undefined); paused = e; return; }
  throw Error('Unexpected HTTP endpoint ' + path);
}
async function key(key, code = key, modifiers = 0) {
  await send('Page.bringToFront'); await wait('document.hasFocus()');
  if (key === 'Escape') await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
  const vk = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, ArrowDown: 40 }[key] ?? 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: vk,
    ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: vk });
}
async function activate(selector) {
  await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing '+${JSON.stringify(selector)});
    n.scrollIntoView({block:'center'});n.focus({preventScroll:true});if(document.activeElement!==n)throw Error('No focus');})()`);
  await key('Enter');
}
async function navigate(path) {
  await evaluate('window.__f2Leaving=true');
  await send('Page.navigate', { url: app + path });
  await wait(`window.__f2Leaving!==true && location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);
}
async function enter(kind = 'station') {
  await navigate('/attendance');
  await wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit'));
  const input = physicalInput({ send, evaluate, wait });
  const time = proxy ? '10:30' : '10:00';
  const nativePlan = nativeProtocol ? helper.nativeInspect().planned.startLocal : null;
  await input('attendance-date', nativeProtocol ? `${nativePlan.slice(8,10)}/${nativePlan.slice(5,7)}/${nativePlan.slice(0,4)}` : '20/10/2026');
  await input('attendance-timeFrom', nativeProtocol ? nativePlan.slice(11,16) : time);
  await input('attendance-timeTo', nativeProtocol ? nativePlan.slice(11,16) : time);
  await activate('#attendance-submit'); await wait(`!!document.getElementById('attendance-station-6201')`);
  if (kind === 'stage') { await activate('#attendance-arrival-6201'); await wait(`!!document.getElementById('arrival-validate')`); return; }
  await evaluate(`(()=>{const n=document.getElementById('attendance-station-6201');
    n.scrollIntoView({block:'center'});n.focus({preventScroll:true});
    const table=document.querySelector('.table-wrap');table.scrollLeft=-80;
    window.__f2Origin={scroll:scrollY,horizontal:table.scrollLeft};})()`);
  await key('Enter'); await wait(`!!document.getElementById('station-validate')`);
}
const count = kind => calls.filter(c => c.path.endsWith('/' + kind)).length;
async function screenshot(name) {
  await mkdir('.angular/browser-evidence', { recursive: true });
  const { data } = await send('Page.captureScreenshot', { captureBeyondViewport: false });
  await writeFile(`.angular/browser-evidence/F2-${name}-SYNTHETIC.png`, Buffer.from(data, 'base64'));
}
try {
  await until(async () => {
    try { const port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      if (!/^\d+$/.test(port)) return false; cdp = 'http://127.0.0.1:' + port; return true;
    } catch { return false; }
  }, 'owned ephemeral Chrome port');
  await until(async () => { try { return (await fetch(cdp + '/json/version')).ok; } catch { return false; } }, 'owned Chrome');
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
      if ((proxy || nativeProtocol) && url.startsWith(app + '/api/')) calls.push({ path: new URL(url).pathname, method: m.params.request.method });
      if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:')) external.push(url);
    }
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  if (!proxy && !nativeProtocol) await send('Fetch.enable', { patterns: [{ urlPattern: app + '/api/*' }] });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (nativeProtocol) {
    await enter();
    assert(await evaluate(`document.body.textContent.includes('כתיבה בפועל למסד TEST') && !document.getElementById('station-to-stage')`));
    assert.equal(helper.nativeInspect().syntheticAllowanceConsumed, false);
    await activate('#station-validate'); await wait(`!!document.getElementById('station-confirm')`);
    await activate('#station-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
    await key('Escape'); await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='station-confirm'`);
    assert.equal(count('commands'), 0); assert.equal(helper.nativeInspect().syntheticAllowanceConsumed, false);
    assert.equal(helper.nativeInspect().events.filter(e => e === 'write:update' || e === 'write:commit').length, 0);
    await activate('#station-validate'); await wait(`document.getElementById('station-confirm')?.getAttribute('aria-disabled')!=='true'`);
    await activate('#station-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
    await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
    await evaluate(`document.querySelector('#native-station-operation-ack input').focus()`); await key(' ', 'Space');
    await wait(`!document.getElementById('native-station-operation-confirm').disabled`);
    helper.nativeHold();
    await activate('#native-station-operation-confirm');
    await until(() => helper.nativeInspect().events.includes('write:update'), 'actual native UoW double DML');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='station-confirm'`);
    for (let i = 0; i < 3; i++) await key(' ', 'Space');
    assert.equal(count('commands'), 1);
    helper.nativeRelease();
    await wait(`!!document.querySelector('.receipt')`);
    const proof = helper.nativeInspect();
    assert.equal(proof.committed, true); assert.equal(proof.syntheticAllowanceConsumed, true);
    assert.equal(proof.events.filter(e => e === 'write:update').length, 1);
    assert.equal(proof.events.filter(e => e === 'write:commit').length, 1);
    assert(proof.events.includes('write:commit-ack'));
    assert(proof.events.some((e, i) => e === 'read:lease' && i > proof.events.indexOf('write:commit-ack')), 'separate readback');
    assert.deepEqual(Object.keys(proof.attendance).filter(k => proof.attendance[k] !== proof.before[k]).sort(),
      ['STATION_ARRIVAL_TIME', 'STATION_ARRIVAL_USER']);
    const update = proof.sql.filter(s => s.sql.includes('station:update'));
    assert.equal(update.length, 1);
    const set = update[0].sql.split(/\bSET\b/i)[1].split(/\bWHERE\b/i)[0];
    assert.deepEqual([...set.replace(/'(?:''|[^'])*'/g, "''").matchAll(/\b([A-Z_]+)\s*=/g)].map(m => m[1]),
      ['STATION_ARRIVAL_TIME', 'STATION_ARRIVAL_USER'], 'exactly two SET assignments (excluding NLS string literals)');
    assert(await evaluate(`document.querySelector('.receipt').textContent.includes('oracle-test-committed')`));
    const readback = await evaluate(`(async()=>{const r=await fetch('/api/v1/employees/9001/shift-days/6201',{cache:'no-store'});
      const b=await r.json();return {status:r.status,source:b.dataSource,stage:b.attendance.stageArrivalLocal,station:b.attendance.stationArrivalLocal};})()`);
    assert.deepEqual(readback, { status: 200, source: 'oracle',
      stage: proof.before.STAGE_ARRIVAL_TIME, station: proof.attendance.STATION_ARRIVAL_TIME });
    const disabled = await evaluate(`(async()=>{const r=await fetch('/api/v1/employees/9001/shift-days/6201/stage-arrival/context',{cache:'no-store'});
      const b=await r.json();return {status:r.status,code:b.code};})()`);
    assert.deepEqual(disabled, { status: 403, code: 'LIVE_WRITES_DISABLED' });
    await screenshot('NATIVE-PROTOCOL-DOUBLE-success');
    assert.equal(errors.length, 0, errors.join('\\n')); assert.equal(external.length, 0);
    console.log('PASS actual owned loopback native F2 protocol DOUBLE: actual runtime/identity/HTTP/prepare/application/UoW; cancel0/allowance0; pending duplicate block; one UPDATE/two SET + COMMIT ACK + separate readback; stage/user/briefing/all other fields preserved; detail readback; F1 disabled403. NO Oracle connection or pilot proof.');
    console.log(JSON.stringify({ actualBackendProtocol: true, oraclePoolDouble: true, interceptedHttp: false,
      liveOracle: false, commands: count('commands'), updates: 1, commits: 1, preservedFields: true,
      runtimeErrors: errors.length, unexpectedRequests: external.length, fullWcagConformance: false }));
  } else if (nativeStation) {
    await enter();
    assert(await evaluate(`document.body.textContent.includes('כתיבה בפועל למסד TEST') &&
      document.body.textContent.includes('הגעה לעמדה — TEST') &&
      !document.body.textContent.includes('ללא Oracle') && !document.querySelector('#station-to-stage,mat-select,input')`));
    assert.equal(calls.filter(c => c.path.includes('/stage-arrival/')).length, 0);
    for (const width of [1440, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`), 'native context no overflow ' + width);
      await screenshot('NATIVE-context-' + width);
    }
    await activate('#station-validate'); await wait(`!!document.getElementById('station-confirm')`);
    const before = count('commands');
    await activate('#station-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
    assert.equal(count('commands'), before);
    for (const width of [1440, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      const ready = await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
      assert.equal(ready.kind, 'dialog'); assert.equal(ready.finiteAnimations, 0);
      assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
      assert(await evaluate(`[...document.querySelectorAll('mat-dialog-actions button')].every(n=>{
        const r=n.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.height>=48;})`));
      for (let i = 0; i < 6; i++) {
        await key('Tab', 'Tab', i % 2 ? 1 : 0);
        assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`));
      }
      await screenshot('NATIVE-confirm-' + width);
    }
    await key('Escape'); await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='station-confirm'`);
    await proveArrivalFocus({ send, evaluate }, '#station-confirm', 'native F2 Escape320');
    assert.equal(count('commands'), before);
    assert(await evaluate(`document.getElementById('station-confirm').getAttribute('aria-disabled')==='true'`), 'cancel discards preparation');
    await activate('#station-validate'); await wait(`document.getElementById('station-confirm')?.getAttribute('aria-disabled')!=='true'`);
    await activate('#station-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
    await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
    await evaluate(`document.querySelector('#native-station-operation-ack input').focus()`); await key(' ', 'Space');
    await wait(`document.querySelector('#native-station-operation-ack input').checked && !document.getElementById('native-station-operation-confirm').disabled`);
    await activate('#native-station-operation-confirm'); await until(() => paused, 'native command');
    await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='station-confirm'`);
    await proveArrivalFocus({ send, evaluate }, '#station-confirm', 'native F2 pending320');
    const ev = paused; paused = undefined; const cmd = JSON.parse(ev.request.postData);
    assert.deepEqual(cmd, { commandId: cmd.commandId, draft: { lateReasonCode: null }, fingerprint: 'b'.repeat(64),
      validationToken: 's'.repeat(43), confirmation: null, operationConfirmation: { accepted: true } });
    for (let i = 0; i < 3; i++) await key(' ', 'Space');
    assert.equal(count('commands'), before + 1);
    station = '2026-10-20T10:22:10'; await fulfill(ev, nativeDouble.receipt(cmd, stage));
    await wait(`!!document.querySelector('.receipt')`);
    await proveArrivalFocus({ send, evaluate }, '#station-confirm', 'native F2 success320');
    assert(await evaluate(`document.querySelector('.receipt').textContent.includes('אישור COMMIT אינו רגע השמירה המדויק') &&
      !sessionStorage.getItem('shfNativeStationArrivalSafety')`));
    await screenshot('NATIVE-success320');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await activate('#station-back'); await wait(`document.activeElement.id==='attendance-station-6201'`);
    assert(await evaluate(`document.getElementById('attendance-timeFrom').value==='10:00'`));
    assert.deepEqual(await evaluate(`({scroll:scrollY,horizontal:document.querySelector('.table-wrap').scrollLeft})`),
      await evaluate('window.__f2Origin'), 'native origin RTL/vertical/exact opener');
    await evaluate('history.forward()'); await wait(`document.getElementById('station-status')?.textContent.includes('כבר אושרה')`);
    assert(await evaluate(`!document.querySelector('.receipt')`), 'no reconstructed receipt on Forward');
    // Independent synthetic scenario; a fresh document is NOT an application reset.
    station = null; stage = '2026-10-20T10:20:00'; await enter();
    await activate('#station-validate'); await wait(`!!document.getElementById('station-confirm')`);
    await activate('#station-confirm'); await wait(`!!document.querySelector('mat-dialog-container')`);
    await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
    await evaluate(`document.querySelector('#native-station-operation-ack input').focus()`); await key(' ', 'Space');
    await wait(`document.querySelector('#native-station-operation-ack input').checked && !document.getElementById('native-station-operation-confirm').disabled`);
    await activate('#native-station-operation-confirm'); await until(() => paused, 'native malformed readback scenario');
    const lost = paused; paused = undefined;
    await fulfill(lost, { ...nativeDouble.receipt(JSON.parse(lost.request.postData), stage),
      recorded: { ...nativeDouble.receipt(JSON.parse(lost.request.postData), stage).recorded, briefing: true } });
    await wait(`document.getElementById('station-status')?.textContent.includes('UNKNOWN')`);
    const contexts = count('context'), stopped = count('commands');
    assert(await evaluate(`!document.querySelector('.receipt') && sessionStorage.getItem('shfNativeStationArrivalSafety') &&
      !sessionStorage.getItem('shfStationArrivalSafety') && !sessionStorage.getItem('shfNativeArrivalSafety')`));
    await navigate('/station-arrival'); await wait(`document.getElementById('station-status')?.textContent.includes('RECOVERY REQUIRED')`);
    assert.equal(count('context'), contexts); assert.equal(count('commands'), stopped);
    assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0, external.join('\n'));
    console.log('PASS NATIVE F2 typed synthetic HTTP + real Chrome: honest notices; no F1/late inputs; context/dialog1440/390/320; keyboard trap/Escape zero commands; exact focus/pixel contrast; consent; pending duplicate block; ACK+readback success; origin RTL/scroll/opener; wrong preservation UNKNOWN+reload.');
    console.log(JSON.stringify({ nativeStationUI: true, typedSyntheticHttpOnly: true, backendImported: false,
      liveOracle: false, widths: [1440, 390, 320], commands: stopped, runtimeErrors: errors.length,
      unexpectedRequests: external.length, fullWcagConformance: false, manualAT: false }));
  } else if (proxy) {
    await enter('stage');
    await activate('#arrival-validate'); await wait(`!!document.getElementById('arrival-confirm')`);
    assert.equal(helper.inspect().receipts, 0); assert.equal(helper.inspect().stationReceipts, 0);
    await activate('#arrival-confirm'); await wait(`!!document.getElementById('arrival-success')`);
    const original = helper.inspect();
    assert.equal(original.receipts, 1); assert.equal(original.stationReceipts, 0);
    await activate('#arrival-to-station'); await wait(`!!document.getElementById('station-validate')`);
    assert(await evaluate(`document.querySelector('.facts').textContent.includes('20/10/2026 10:22:06')`));
    await activate('#station-validate'); await wait(`!!document.getElementById('station-confirm')`);
    assert.equal(helper.inspect().stationReceipts, 0); assert.equal(helper.inspect().stationAudits, 0);
    await activate('#station-confirm'); await wait(`!!document.querySelector('.receipt')`);
    const snapshot = helper.inspect();
    assert.equal(snapshot.receipts, 1); assert.equal(snapshot.audits, 1);
    assert.equal(snapshot.stationReceipts, 1); assert.equal(snapshot.stationAudits, 1); assert.equal(snapshot.active, 0);
    assert.equal(snapshot.rows[0].attendance.stageArrivalLocal, original.rows[0].attendance.stageArrivalLocal);
    assert.equal(snapshot.rows[0].attendance.stageArrivalUser, original.rows[0].attendance.stageArrivalUser);
    assert.equal(snapshot.rows[0].attendance.briefing, original.rows[0].attendance.briefing);
    assert.notEqual(snapshot.rows[0].revision, original.rows[0].revision);
    assert(await evaluate(`document.querySelector('.receipt').textContent.includes('20/10/2026 10:22:06')`));
    await screenshot('ACTUAL-JOINT-FIXTURE-success');
    const readback = await evaluate(`(async()=>{const r=await fetch('/api/v1/employees/9001/shift-days/6201',{cache:'no-store'});
      const b=await r.json();return {status:r.status,source:b.dataSource,stage:b.attendance.stageArrivalLocal,station:b.attendance.stationArrivalLocal};})()`);
    assert.deepEqual(readback, { status: 200, source: 'isolated-fixture',
      stage: '2026-10-20T10:22:06', station: '2026-10-20T10:22:06' });
    assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0);
    console.log('PASS ACTUAL owned loopback joint fixture: browser F1 review0/commit1 -> fresh F2 context -> review0/commit1; preserved stage/user/briefing; shared revision advanced; F1 receipt/audit1/1 and F2 receipt/audit1/1; independent detail readback; no interception/Oracle.');
    console.log(JSON.stringify({ actualFixtureBackend: true, interceptedHttp: false, nativeF2: false,
      commands: count('commands'), runtimeErrors: errors.length, unexpectedRequests: external.length, fullWcagConformance: false }));
  } else {
  await navigate('/station-arrival'); await wait(`document.body.textContent.includes('לא נבחרה רשומה')`);
  assert.equal(count('context'), 0); assert.equal(count('commands'), 0);
  // Exact 9-right identity remains valid but has no F2 entry.
  rightsCount = 9; await navigate('/attendance');
  await wait(formReadyExpression('shf-attendance', 'attendance-date', 'attendance-submit'));
  await activate('#attendance-submit'); await wait(`!!document.getElementById('attendance-arrival-6201')`);
  assert(await evaluate(`!document.getElementById('attendance-station-6201')`));
  rightsCount = 11; await enter();
  assert(await evaluate(`document.body.textContent.includes('FIXTURE LOCAL ONLY') && document.body.textContent.includes('NULL')`));
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`), 'no page overflow ' + width);
    await screenshot('context-' + width);
  }
  await activate('#station-validate'); await wait(`!!document.getElementById('station-confirm')`);
  assert.equal(count('commands'), 0, 'on-time review is pure');
  await activate('#station-confirm'); await until(() => paused, 'pending station command');
  const before = count('commands'); for (let i = 0; i < 3; i++) await key(' ', 'Space');
  assert.equal(count('commands'), before);
  assert.equal(await evaluate('document.activeElement.id'), 'station-confirm');
  await proveArrivalFocus({send,evaluate}, '#station-confirm', 'F2 pending320');
  const ev = paused; paused = undefined; const cmd = JSON.parse(ev.request.postData);
  station = '2026-10-20T10:22:10';
  await fulfill(ev, { commandId: cmd.commandId, employeeId: '9001', shiftDayId: '6201', outcome: 'fixture-committed',
    recorded: { stageArrivalLocal: stage, stationArrivalLocal: station, stationExitLocal: null, briefing: false, stationLate: null },
    committedAt: '2026-10-20T07:22:10.000Z', businessTimeZone: 'Asia/Jerusalem', replayed: false,
    partnerCompletion: 'not-invoked', dataSource: 'isolated-fixture' });
  await wait(`!!document.querySelector('.receipt')`);
  await proveArrivalFocus({send,evaluate}, '#station-confirm', 'F2 success320');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await activate('#station-back'); await wait(`document.activeElement.id==='attendance-station-6201'`);
  assert(await evaluate(`document.getElementById('attendance-timeFrom').value==='10:00'`));
  const originGeometry = await evaluate(`({actual:{scroll:scrollY,horizontal:document.querySelector('.table-wrap').scrollLeft},expected:window.__f2Origin})`);
  assert.deepEqual(originGeometry.actual, originGeometry.expected, 'real origin vertical and RTL horizontal scroll');
  await evaluate('history.forward()');
  await wait(`document.getElementById('station-status')?.textContent.includes('כבר אושרה')`);
  await wait(`!document.querySelector('.receipt') && document.getElementById('station-validate')?.getAttribute('aria-disabled')==='true'`);
  // Fresh document = independent synthetic double session, not an application reset.
  late = true; station = null; stage = '2026-10-20T10:10:00'; await enter();
  await activate('#station-reason'); await wait(`!!document.querySelector('mat-option')`);
  await key('ArrowDown'); await key('Enter');
  await wait(`document.getElementById('station-reason').textContent.includes('סיבה סינתטית')`);
  await activate('#station-validate'); await wait(`!!document.querySelector('mat-dialog-container')`);
  const commandsBeforeCancel = count('commands');
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    const ready = await evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`);
    assert.equal(ready.kind, 'dialog'); assert.equal(ready.finiteAnimations, 0);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    assert(await evaluate(`[...document.querySelectorAll('mat-dialog-actions button')].every(n=>{
      const r=n.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.height>=48;})`));
    for (let i = 0; i < 6; i++) {
      await key('Tab', 'Tab', i % 2 ? 1 : 0);
      assert(await evaluate(`!!document.activeElement.closest('mat-dialog-container')`));
    }
    await screenshot('warning-' + width);
  }
  await key('Escape'); await wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='station-validate'`);
  await proveArrivalFocus({send,evaluate}, '#station-validate', 'F2 Escape320');
  assert.equal(count('commands'), commandsBeforeCancel);
  const focusGeometry = await evaluate(`(()=>{const n=document.activeElement,r=n.getBoundingClientRect(),s=getComputedStyle(n);
    const bottom=Math.max(...[...document.querySelectorAll('.topbar,.mockbar')].map(n=>n.getBoundingClientRect().bottom));
    return {id:n.id,top:r.top,bottom:r.bottom,stickyBottom:bottom,height:innerHeight,outline:s.outlineStyle,width:s.outlineWidth};})()`);
  assert(focusGeometry.top >= focusGeometry.stickyBottom + 6 && focusGeometry.bottom + 6 <= focusGeometry.height &&
    focusGeometry.outline === 'solid' && parseFloat(focusGeometry.width) >= 3,
    'exact keyboard opener and visible unobscured high-contrast focus ring: ' + JSON.stringify(focusGeometry));
  await activate('#station-validate'); await wait(`!!document.querySelector('mat-dialog-container')`);
  await evaluate(`document.querySelector('#station-warning-ack input').focus()`); await key(' ', 'Space');
  await wait(`document.querySelector('#station-warning-ack input').checked && !document.getElementById('station-warning-review').disabled`);
  await activate('#station-warning-review'); await wait(`!document.querySelector('mat-dialog-container') && !!document.getElementById('station-confirm')`);
  assert.equal(count('commands'), commandsBeforeCancel);
  await activate('#station-confirm'); await until(() => paused, 'late command');
  const lost = paused; paused = undefined;
  assert.deepEqual(JSON.parse(lost.request.postData).confirmation, { accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] });
  await send('Fetch.failRequest', { requestId: lost.requestId, errorReason: 'Failed' });
  await wait(`document.getElementById('station-status')?.textContent.includes('UNKNOWN')`);
  await proveArrivalFocus({send,evaluate}, '#station-confirm', 'F2 UNKNOWN320');
  await screenshot('unknown-320');
  assert(await evaluate(`!document.querySelector('.receipt') && sessionStorage.getItem('shfStationArrivalSafety') &&
    !sessionStorage.getItem('shfStageArrivalSafety') && !sessionStorage.getItem('shfNativeArrivalSafety')`));
  const stopped = count('commands'), contexts = count('context');
  await navigate('/station-arrival'); await wait(`document.getElementById('station-status')?.textContent.includes('RECOVERY REQUIRED')`);
  assert.equal(count('context'), contexts); assert.equal(count('commands'), stopped);
  assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0, external.join('\n'));
  console.log('PASS F2 SYNTHETIC CDP: chooser; 9/11 rights; null/existing stage; context1440/390/320; keyboard/dialog trap/Escape/exact unobscured focus; reduced-motion; pure review; doubleactivation; success; origin filters+focus; transport UNKNOWN+reload namespaces.');
  console.log(JSON.stringify({ syntheticHttpOnly: true, nativeF2: false, liveBackend: false,
    widths: [1440, 390, 320], commands: stopped, runtimeErrors: errors.length, unexpectedRequests: external.length,
    fullWcagConformance: false, manualAT: false }));
  }
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} socket.close(); }
  if (chrome.exitCode === null) chrome.kill();
  try {
    await pause(200); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  } finally { await helper.close(); }
}
