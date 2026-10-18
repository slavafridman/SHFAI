// Actual Angular + Chrome. ALL /api requests are intercepted synthetic fixtures.
// No Oracle/backend readiness probe and no app-level fake catalog/fallback.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const app = process.env.SHF_UI_URL ?? 'http://127.0.0.1:4320';
const cdp = process.env.SHF_CDP_URL ?? 'http://127.0.0.1:9322';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(app));
const target = (await fetch(`${cdp}/json/list`).then(r => r.json())).find(t => t.type === 'page');
assert(target, 'Start your OWN isolated Chrome as documented');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0, handler;
const pending = new Map(), external = [], errors = [], calls = [];
socket.onmessage = event => {
  const m = JSON.parse(event.data);
  if (m.id) {
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  else if (m.method === 'Network.requestWillBeSent') {
    const url = m.params.request.url;
    if (!url.startsWith(app) && !url.startsWith('data:') && !url.startsWith('about:')) external.push(url);
  } else if (m.method === 'Fetch.requestPaused') {
    void handler(m.params).catch(e => errors.push(e.message));
  }
};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function wait(expression) {
  for (let i = 0; i < 180; i++) {
    if (await evaluate(expression)) return;
    await new Promise(r => setTimeout(r, 75));
  }
  throw new Error(`Timed out: ${expression}`);
}
async function size(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await wait(`innerWidth === ${width} && innerHeight === ${height}`);
}
async function navigate(path) { await send('Page.navigate', { url: app + path }); }
async function key(key, code = key, modifiers = 0) {
  const vk = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, ArrowDown: 40, ArrowUp: 38 }[key] ?? 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: vk,
    ...(key === ' ' ? { text: ' ' } : key === 'Enter' ? { text: '\r' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode: vk });
}
async function click(selector) {
  const r = await evaluate(`(async () => {
    const n = document.querySelector(${JSON.stringify(selector)});
    if (!n) throw Error('Missing click target'); n.scrollIntoView({block:'nearest'});
    for (let i=0;i<90;i++) {
      await new Promise(r => requestAnimationFrame(r));
      const r=n.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
      if (n.contains(document.elementFromPoint(x,y))) return {x,y};
    }
    throw Error('Click target obscured: ' + ${JSON.stringify(selector)});
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...r, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...r, button: 'left', clickCount: 1 });
  await evaluate(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
}
async function input(id, value) {
  await evaluate(`(() => { const n=document.getElementById(${JSON.stringify(id)});
    n.focus(); n.value=${JSON.stringify(value)}; n.dispatchEvent(new Event('input',{bubbles:true}));
    n.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await evaluate(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { captureBeyondViewport: false });
  await mkdir('.angular/browser-evidence', { recursive: true });
  await writeFile(`.angular/browser-evidence/${name}.png`, Buffer.from(data, 'base64'));
}
async function noOverflow() {
  assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'Page has no horizontal overflow');
}
const raw = JSON.parse(await readFile(new URL('../fixtures/rows.synthetic.json', import.meta.url), 'utf8'));
const sample = (employeeId = '1001', shiftDayId = '2001') => {
  const r = raw.find(r => r.employeeId === employeeId) ?? raw[0];
  return { employeeId, shiftDayId, employee: { firstName: r.firstName, lastName: r.lastName, orgUnitId: r.orgUnitId },
    effectiveShift: { startLocal: r.baselineStartLocal, endLocal: r.baselineEndLocal, activityData: r.baselineActivityData, siteId: r.baselineSiteId },
    attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
};
const principal = () => ({
  principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'],
    capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read'], employeeId: null, resourceScope: { orgUnitIds: ['TEST-U', 'TEST-V'] } },
  dataSource: 'isolated-fixture',
});
const context = () => ({
  defaults: { mode: 'at', attendanceDate: '2026-10-15', currentTime: '10:00', mokedCode: 'P01' },
  mokedOptions: [{ code: 'P01', label: 'מוקד בדיקה', unitType: 'G01' }],
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
const row = (day = '2001') => ({
  shiftDayId: day, employee: { employeeId: '1001', firstName: 'בדיקה', lastName: 'סינתטית',
    unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: context().mokedOptions[0] } },
  startLocal: '2026-10-14T23:30:11', endLocal: '2026-10-15T11:00:22', workingFromHome: false,
  activities: [{ code: 'A', label: 'פעילות בדיקה' }, { code: 'B', label: null }], innerJob: null,
  attendanceDisplay: { kind: 'not-recorded' },
});
let listMode = 'normal', detailMode = 'normal', identityMode = 'normal', contextMode = 'normal', held = null;
let searchMode = 'normal', searchContextMode = 'normal';
const searchContext = () => ({
  defaults: { attendanceDate: '2026-10-15', timeFrom: '10:00', timeTo: '10:00', mokedCode: null,
    teamCodes: [], innerJobCodes: [], workLocations: [] },
  mokedOptions: [...context().mokedOptions, { code: 'P02', label: 'מוקד נוסף', unitType: 'G01' }],
  teamOptions: [{ code: 'TEST-U', label: 'צוות בדיקה', unitType: 'J01', parentMokedCode: 'P01' },
    { code: 'TEST-V', label: 'צוות נוסף', unitType: 'J01', parentMokedCode: 'P02' }],
  innerJobOptions: [{ code: '1', label: 'תפקיד בדיקה' }],
  workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
function searchList(url) {
  const p = url.searchParams, limit = Number(p.get('limit') ?? 25), offset = Number(p.get('offset') ?? 0);
  const makeRow = day => {
    const { attendanceDisplay, ...core } = row(day);
    return { ...core, startLocal: `${p.get('attendanceDate')}T${p.get('timeFrom')}:00`,
      endLocal: `${p.get('attendanceDate')}T23:59:37`, innerJob: { code: '1', label: 'תפקיד בדיקה' },
      activityFallback: null, workingFromHome: null,
      indicators: { hasRemark: true, hasCancelLoginAnnotation: true, timeOrLocationChanged: true,
        split: true, addedStaffing: true, employeeReassigned: true, extensionAllocated: null } };
  };
  return { items: searchMode === 'empty' ? [] : searchMode === 'pages' ?
    Array.from({ length: limit }, (_, i) => makeRow(String(3001 + offset + i))) : [makeRow('3001')],
    applied: { attendanceDate: p.get('attendanceDate'), timeFrom: p.get('timeFrom'), timeTo: p.get('timeTo'),
      mokedCode: p.get('mokedCode'), teamCodes: (p.get('teamCodes')?.split(',') ?? []).sort(),
      innerJobCodes: (p.get('innerJobCodes')?.split(',') ?? []).sort(),
      workLocations: ['home', 'site'].filter(x => p.get('workLocations')?.split(',').includes(x)), sort: 'effective-start-asc' },
    page: { limit, offset, hasMore: searchMode === 'pages' && offset === 0,
      nextOffset: searchMode === 'pages' && offset === 0 ? limit : null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: searchMode === 'source-mismatch' ? 'oracle-read-only' : 'isolated-fixture' };
}
const problem = status => ({
  type: `urn:shf:problem:${({ 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'SHIFT_DAY_NOT_FOUND', 500: 'INVALID_SOURCE_DATA', 503: 'DEPENDENCY_TIMEOUT' })[status]}`,
  code: ({ 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'SHIFT_DAY_NOT_FOUND', 500: 'INVALID_SOURCE_DATA', 503: 'DEPENDENCY_TIMEOUT' })[status],
  status, title: 'Synthetic sanitized test', requestId: 'browser-fixture',
});
const fulfill = (requestId, body, responseCode = 200) => send('Fetch.fulfillRequest', {
  requestId, responseCode, responseHeaders: [
    { name: 'Content-Type', value: responseCode === 200 ? 'application/json' : 'application/problem+json' },
    { name: 'Cache-Control', value: 'no-store' },
  ], body: Buffer.from(JSON.stringify(body)).toString('base64'),
});
handler = async event => {
  const url = new URL(event.request.url); calls.push(url.pathname + url.search);
  if (url.pathname.endsWith('/identity')) {
    if (identityMode === 'failure') return fulfill(event.requestId, problem(503), 503);
    const value = principal();
    if (identityMode === 'malformed') value.principal.capabilities = ['shift-day:read'];
    if (['no-search', 'search-only'].includes(identityMode)) {
      value.principal.provider = 'real'; value.principal.synthetic = false;
      value.principal.capabilities = identityMode === 'no-search' ? ['current-shifts:read'] : ['shift-search:read'];
    }
    return fulfill(event.requestId, value);
  }
  if (url.pathname === '/api/v1/shift-search/filter-context') {
    if (searchContextMode === 'hold') { held = { id: event.requestId, url }; return; }
    const v = searchContext();
    if (searchContextMode === 'source-mismatch') v.dataSource = 'oracle-read-only';
    if (searchContextMode === 'malformed') v.teamOptions[0].parentMokedCode = 'absent';
    return fulfill(event.requestId, v);
  }
  if (url.pathname === '/api/v1/shift-search') {
    if (searchMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof searchMode === 'number') return fulfill(event.requestId,
      { ...problem(searchMode), ...(searchMode === 400 ?
        { invalidParameters: [{ name: 'timeTo', reason: 'invalid-format' }] } : {}) }, searchMode);
    const v = searchList(url);
    if (searchMode === 'malformed') delete v.items[0].indicators;
    return fulfill(event.requestId, v);
  }
  if (url.pathname.endsWith('/filter-context')) {
    if (contextMode === 'failure') return fulfill(event.requestId, problem(503), 503);
    return fulfill(event.requestId, context());
  }
  if (url.pathname === '/api/v1/current-shifts') {
    if (listMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof listMode === 'number') return fulfill(event.requestId, problem(listMode), listMode);
    return fulfill(event.requestId, list(url));
  }
  if (url.pathname.startsWith('/api/v1/employees/')) {
    if (detailMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof detailMode === 'number') return fulfill(event.requestId, problem(detailMode), detailMode);
    const parts = url.pathname.split('/');
    return fulfill(event.requestId, sample(parts[4], parts[6]));
  }
  throw Error(`Unexpected API path ${url.pathname}`);
};
function list(url) {
  const p = url.searchParams, offset = Number(p.get('offset') ?? 0), limit = Number(p.get('limit') ?? 25);
  let items = listMode === 'empty' ? [] : [row(), row('2002'), row('2003')];
  items[1] && (items[1].attendanceDisplay = { kind: 'missing-reason', reason: { code: '2', label: 'סיבת בדיקה' } });
  items[2] && (items[2].attendanceDisplay = { kind: 'station-arrival', atLocal: '2026-10-15T09:51:00' });
  if (listMode === 'pages') items = Array.from({ length: limit }, (_, i) => row(String(2001 + offset + i)));
  return { items, applied: {
    requestedMode: p.get('mode'), attendanceDate: p.get('attendanceDate') ?? '2026-10-15',
    currentTime: p.get('currentTime') ?? '08:07', mokedCode: p.get('mokedCode'),
    sort: 'effective-start-asc' }, page: { limit, offset, hasMore: listMode === 'pages' && offset === 0,
    nextOffset: listMode === 'pages' && offset === 0 ? limit : null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
}
const readyList = () => wait(`!!document.querySelector('#results-heading') && !!document.querySelector('table')`);
const readyDetail = () => wait(`document.activeElement.id === 'result-heading'`);
try {
  console.log('Browser:', (await send('Browser.getVersion')).product, 'Angular with intercepted synthetic HTTP ONLY');
  await send('Runtime.enable'); await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/v1/*', requestStage: 'Request' }] });
  if (!process.env.SHF_SEARCH_ONLY) {
  await size(1440, 900); await navigate('/'); await readyList();
  assert.equal(await evaluate('location.pathname'), '/current-shifts');
  assert.equal(await evaluate('document.documentElement.lang'), 'he');
  assert.equal(await evaluate('getComputedStyle(document.body).direction'), 'rtl');
  assert.equal(await evaluate(`getComputedStyle(document.documentElement).backgroundColor`), 'rgb(250, 250, 250)');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.wordmark')).color`), 'rgb(5, 106, 229)');
  assert.equal(await evaluate(`document.querySelectorAll('main').length`), 1);
  assert.equal(await evaluate(`document.querySelectorAll('thead th').length`), 10);
  assert(await evaluate(`document.querySelector('.sidebar').getBoundingClientRect().left > innerWidth / 2`));
  await noOverflow(); await screenshot('ui01-list-desktop');

  // Actual Material calendar, strict deterministic display and exact opener focus.
  assert.equal(await evaluate(`document.getElementById('filter-date').value`), '15/10/2026');
  await evaluate(`globalThis.__calendar = document.querySelector('mat-datepicker-toggle button')`);
  await click('mat-datepicker-toggle button'); await wait(`!!document.querySelector('mat-datepicker-content')`);
  await wait(`document.querySelector('mat-datepicker-content').contains(document.activeElement)`);
  await new Promise(r => setTimeout(r, 300));
  await key('Escape'); await wait(`!document.querySelector('mat-datepicker-content')`);
  assert(await evaluate(`document.activeElement === globalThis.__calendar`));
  await input('filter-date', '31/02/2026'); await click('#list-search');
  await wait(`document.getElementById('filter-date').getAttribute('aria-invalid') === 'true'`);
  assert.equal(await evaluate('document.activeElement.id'), 'filter-date');
  assert.equal(await evaluate(`document.getElementById('filter-date').value`), '31/02/2026');
  await input('filter-date', '15/10/2026');

  // Material hour/minute dialog, arbitrary minute and cancel/Escape semantics.
  await click('#time-open'); await wait(`!!document.querySelector('shf-minute-picker')`);
  await new Promise(r => setTimeout(r, 150));
  await evaluate(`document.getElementById('picker-hour').focus()`); await key('Enter');
  await wait(`document.querySelectorAll('[role="option"]').length === 24`);
  await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.trim()==='08').click()`);
  await evaluate(`document.getElementById('picker-minute').focus()`); await key('Enter');
  await wait(`document.querySelectorAll('[role="option"]').length === 60`);
  await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.trim()==='07').click()`);
  await click('#time-apply'); await wait(`!document.querySelector('shf-minute-picker')`);
  await wait(`document.activeElement.id === 'time-open'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`), '08:07');
  await click('#time-open'); await wait(`!!document.querySelector('shf-minute-picker')`);
  await key('Escape'); await wait(`!document.querySelector('shf-minute-picker')`);
  await wait(`document.activeElement.id === 'time-open'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`), '08:07');
  for (const bad of ['24:00', '8:07', '']) {
    await input('filter-time', bad); await click('#time-open');
    assert.equal(await evaluate('document.activeElement.id'), 'filter-time');
    assert.equal(await evaluate(`document.getElementById('filter-time').value`), bad);
    assert.equal(await evaluate(`!!document.querySelector('shf-minute-picker')`), false);
  }
  await input('filter-time', '10:00'); await click('#list-search'); await readyList();
  await click('#current-mode input');
  await wait(`document.getElementById('filter-time').disabled && document.getElementById('filter-time').value === '08:07'`);
  await readyList();
  assert.equal(await evaluate(`document.getElementById('filter-time').value`), '08:07');
  assert(await evaluate(`document.getElementById('filter-time').disabled && document.getElementById('time-open').disabled`));
  const currentCall = calls.filter(c => c.startsWith('/api/v1/current-shifts?')).at(-1);
  assert(currentCall.includes('mode=current') && !currentCall.includes('attendanceDate') && !currentCall.includes('currentTime'));
  await click('#current-mode input');
  await wait(`!document.getElementById('filter-time').disabled && document.getElementById('filter-time').value === '10:00'`);
  await readyList();
  assert.equal(await evaluate(`document.getElementById('filter-time').value`), '10:00');
  console.log('PASS: Material calendar strict date + exact Escape focus; 24/60 minute dialog 08:07/apply/cancel/invalid preservation; current server minute/reset.');

  // Pages freeze minute. No total claim, real offset controls.
  listMode = 'pages'; await click('#list-search');
  await wait(`document.querySelectorAll('tbody tr').length === 25`);
  await click('#next-page'); await wait(`document.querySelector('.pager').textContent.includes('26–50')`);
  assert(calls.at(-1).includes('offset=25') && calls.at(-1).includes('mode=at'));
  listMode = 'normal'; await click('#previous-page');
  await wait(`!!document.getElementById('detail-2001') && document.querySelectorAll('tbody tr').length === 3`);
  await click('#detail-2001'); await readyDetail();
  assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/2001');
  assert(await evaluate(`document.querySelector('#back-action').textContent.includes('חזרה למשמרות נוכחיות')`));
  assert(await evaluate(`document.querySelector('.topbar').getBoundingClientRect().top === 0`));
  assert(await evaluate(`document.querySelector('.time-value').getBoundingClientRect().bottom < 900`));
  assert.equal(await evaluate(`document.querySelector('#diagnostic-context').open`), false);
  await screenshot('ui01-detail-desktop');
  await click('#back-action'); await readyList(); await wait(`document.activeElement.id === 'detail-2001'`);
  assert.equal(await evaluate(`document.getElementById('filter-time').value`), '10:00');

  for (const width of [390, 320]) {
    await size(width, 844); await navigate('/current-shifts'); await readyList(); await noOverflow();
    await screenshot(`ui01-list-mobile-${width}`);
    await click('#menu-open'); await wait(`document.getElementById('menu').open`);
    for (let i = 0; i < 8; i++) {
      await key('Tab');
      assert(await evaluate(`document.activeElement === document.body || document.getElementById('menu').contains(document.activeElement)`),
        'Native modal keeps page controls out of the tab sequence (browser chrome may receive focus)');
    }
    await key('Escape'); await wait(`!document.getElementById('menu').open`);
    assert.equal(await evaluate('document.activeElement.id'), 'menu-open');
    await click('#time-open'); await wait(`!!document.querySelector('shf-minute-picker')`); await noOverflow();
    await screenshot(`ui01-timepicker-mobile-${width}`); await key('Escape');
    await wait(`!document.querySelector('shf-minute-picker')`);
    await click('#detail-2001'); await readyDetail(); await noOverflow();
    assert(await evaluate(`document.querySelectorAll('.time-value')[1].getBoundingClientRect().bottom < 844`),
      'Both actual shift times above 844px fold');
    await screenshot(`ui01-detail-mobile-${width}`);
  }
  console.log('PASS: 1440×900 / 390×844 / 320×844 RTL shell/list/detail, actual row/back/opener, mobile menu Tab/Escape/exact focus, minute dialog reflow.');

  // Long strings, exact 38-digit IDs, escaped raw source and text-spacing reflow.
  const longId = '9'.repeat(38);
  await navigate(`/employees/${longId}/shift-days/2002`); await readyDetail(); await noOverflow();
  assert(await evaluate(`document.querySelector('.raw').textContent.includes('<b>בדיקה בלבד</b>')`));
  assert.equal(await evaluate(`document.querySelector('.raw b')`), null);
  await click('.technical-data summary'); await noOverflow();
  assert(await evaluate(`document.querySelector('.metadata').textContent.includes('${longId}')`));
  await evaluate(`(() => { const s=document.createElement('style'); s.id='spacing';
    s.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}';
    document.head.append(s); })()`);
  await noOverflow(); await screenshot('ui01-long-320'); await evaluate(`document.getElementById('spacing').remove()`);

  // Original exact-element reload regression: pending/terminal 200 and 503 × desktop/mobile.
  for (const width of [1440, 320]) for (const status of [200, 503]) {
    await size(width, width === 1440 ? 900 : 844); detailMode = 'normal';
    await navigate('/employees/1001/shift-days/2001'); await readyDetail();
    await evaluate(`globalThis.__reload=document.getElementById('reload-action'); __reload.focus()`);
    detailMode = 'hold'; held = null; const before = calls.filter(c => c.startsWith('/api/v1/employees/')).length;
    await key(' ', 'Space'); await wait(`document.getElementById('reload-action').getAttribute('aria-busy') === 'true'`);
    assert(held); assert(await evaluate(`document.activeElement === globalThis.__reload`));
    await key(' ', 'Space'); await key(' ', 'Space');
    assert.equal(calls.filter(c => c.startsWith('/api/v1/employees/')).length - before, 1);
    await fulfill(held.id, status === 200 ? sample() : problem(status), status);
    await wait(`document.getElementById('reload-action').getAttribute('aria-busy') === 'false' &&
      !!document.getElementById('${status === 200 ? 'result-heading' : 'error-heading'}')`);
    await new Promise(r => setTimeout(r, 100));
    assert(await evaluate(`document.activeElement === globalThis.__reload && document.getElementById('reload-action') === globalThis.__reload`));
    console.log('PASS exact reload element:', { width, status, requests: 1 });
  }
  // Late detail A cannot replace B. No BODY text as focus oracle.
  detailMode = 'hold'; held = null;
  await navigate('/employees/1001/shift-days/2001'); await wait(`!!document.querySelector('mat-progress-bar')`);
  for (let i = 0; !held && i < 50; i++) await new Promise(r => setTimeout(r, 25));
  const late = held; detailMode = 'normal';
  await click('#diagnostic-summary');
  await input('employeeId', '1002'); await input('shiftDayId', '2002'); await click('button[type="submit"]');
  await readyDetail();
  await fulfill(late.id, sample()).catch(() => {});
  await new Promise(r => setTimeout(r, 100));
  assert.equal(await evaluate('location.pathname'), '/employees/1002/shift-days/2002');
  assert.equal(await evaluate('document.activeElement.id'), 'result-heading');

  // The same late-A/B protection on the new list, not just the legacy detail slice.
  listMode = 'hold'; held = null; await navigate('/current-shifts');
  await wait(`!!document.querySelector('mat-progress-bar')`);
  for (let i = 0; !held && i < 50; i++) await new Promise(r => setTimeout(r, 25));
  assert(held); const lateList = held;
  await screenshot('ui01-list-loading');
  listMode = 'normal'; await input('filter-time', '11:00'); await click('#list-search');
  await readyList(); await wait(`document.querySelector('.applied').textContent.includes('11:00')`);
  await fulfill(lateList.id, list(lateList.url)).catch(() => {});
  await new Promise(r => setTimeout(r, 100));
  assert(await evaluate(`document.querySelector('.applied').textContent.includes('11:00')`));
  assert.equal(await evaluate('document.activeElement.id'), 'results-heading');

  for (const status of [401, 403, 404, 500, 503]) {
    detailMode = status; await navigate('/employees/1001/shift-days/2001');
    await wait(`!!document.getElementById('error-heading')`);
    assert.equal(await evaluate(`!!document.querySelector('.detail-card')`), false);
  }
  detailMode = 'normal';
  for (const mode of ['empty', 400, 401, 403, 500, 503]) {
    listMode = mode; await navigate('/current-shifts');
    await wait(mode === 'empty' ? `!!document.querySelector('#results-heading')` : `!!document.getElementById('list-error')`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
    if (mode === 'empty' || mode === 503) await screenshot(`ui01-list-${mode}`);
  }
  listMode = 'normal';
  for (const mode of ['failure', 'malformed']) {
    identityMode = mode; const before = calls.length;
    await navigate('/current-shifts'); await wait(`!!document.querySelector('#list-error')`);
    assert.equal(calls.slice(before).filter(c => c !== '/api/v1/identity').length, 0, 'Identity fails closed before context/list');
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
  }
  identityMode = 'normal'; contextMode = 'failure'; await navigate('/current-shifts');
  await wait(`!!document.querySelector('#list-error')`); contextMode = 'normal';
  await click('#list-retry'); await readyList();
  console.log('PASS: empty/error/retry/identity failure, detail 401/403/404/500/503, list 400/401/403/500/503; no fallback; long text; stale detail A/B.');
  }
  // SHF-SEARCH-UI-18: real Angular route, intercepted synthetic responses only.
  contextMode = 'normal'; identityMode = 'normal';
  const readySearchContext = () => wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
  const readySearch = () => wait(`!!document.getElementById('search-results')`);
  for (const width of [1440, 390, 320]) {
    await size(width, width === 1440 ? 900 : 844);
    const before = calls.filter(c => c.startsWith('/api/v1/shift-search?')).length;
    await navigate('/shift-search'); await readySearchContext();
    assert.equal(calls.filter(c => c.startsWith('/api/v1/shift-search?')).length, before, 'No automatic result GET');
    assert.equal(await evaluate(`document.getElementById('search-date').value`), '15/10/2026');
    await click('#search-submit'); await readySearch(); await noOverflow();
    assert.equal(await evaluate(`document.querySelectorAll('.indicators li').length`), 7);
    assert(await evaluate(`document.querySelector('.indicators').textContent.includes('הערת ביטול כניסה') &&
      document.querySelector('.indicators').textContent.includes('הקצאת שלוחה: לא ישים')`));
    assert(await evaluate(`document.querySelector('.applied').textContent.includes('10:00–10:00')`));
    await screenshot(`search18-results-${width}`);
    if (width !== 1440) {
      await click('#menu-open'); await wait(`document.getElementById('menu').open`); await key('Escape');
      await wait(`document.activeElement.id === 'menu-open'`);
    }
  }
  await size(1440, 900); await navigate('/shift-search'); await readySearchContext();
  // The two controls target one dialog; every hour/minute exists, Escape restores exact opener.
  for (const [target, hour, minute] of [['timeFrom', '00', '00'], ['timeTo', '23', '59'], ['timeFrom', '08', '07']]) {
    const other = target === 'timeFrom' ? 'timeTo' : 'timeFrom';
    const prior = await evaluate(`document.getElementById('search-${other}').value`);
    await click(`#search-${target}-open`); await wait(`!!document.querySelector('shf-minute-picker')`);
    await new Promise(r => setTimeout(r, 80));
    await evaluate(`document.getElementById('picker-hour').focus()`); await key('Enter');
    await wait(`document.querySelectorAll('[role="option"]').length === 24`);
    await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.trim()===${JSON.stringify(hour)}).click()`);
    await evaluate(`document.getElementById('picker-minute').focus()`); await key('Enter');
    await wait(`document.querySelectorAll('[role="option"]').length === 60`);
    await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.trim()===${JSON.stringify(minute)}).click()`);
    await click('#time-apply'); await wait(`document.activeElement.id === 'search-${target}-open'`);
    assert.equal(await evaluate(`document.getElementById('search-${target}').value`), `${hour}:${minute}`);
    assert.equal(await evaluate(`document.getElementById('search-${other}').value`), prior);
  }
  await click('#search-timeTo-open'); await wait(`!!document.querySelector('shf-minute-picker')`);
  await key('Escape'); await wait(`document.activeElement.id === 'search-timeTo-open'`);
  assert.equal(await evaluate(`document.getElementById('search-timeTo').value`), '23:59');
  await evaluate(`globalThis.__searchCalendar=document.querySelector('mat-datepicker-toggle button')`);
  await click('mat-datepicker-toggle button'); await wait(`!!document.querySelector('mat-datepicker-content')`);
  await wait(`document.querySelector('mat-datepicker-content').contains(document.activeElement)`);
  // Datepicker registers terminal keyboard handling after its opening animation.
  await new Promise(r => setTimeout(r, 300));
  await key('Escape'); await wait(`!document.querySelector('mat-datepicker-content')`);
  assert(await evaluate(`document.activeElement === globalThis.__searchCalendar`));
  for (const bad of ['29/02/2027', '31/04/2026', '00/10/2026', '0001', '10/15/2026']) {
    await input('search-date', bad); await click('#search-submit');
    await wait(`document.activeElement.id === 'search-date'`);
    assert.equal(await evaluate(`document.getElementById('search-date').value`), bad);
    assert.equal(await evaluate(`document.getElementById('search-date').getAttribute('aria-invalid')`), 'true');
  }
  for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati']) {
    await send('Emulation.setTimezoneOverride', { timezoneId: zone });
    await send('Emulation.setLocaleOverride', { locale: 'en-US' });
    for (const date of ['29/02/2028', '01/01/0001', '15/10/2026']) {
      await input('search-date', date); await click('#search-submit'); await readySearch();
      assert.equal(await evaluate(`document.getElementById('search-date').value`), date);
      assert(calls.filter(c => c.startsWith('/api/v1/shift-search?')).at(-1).includes(`attendanceDate=${date.split('/').reverse().join('-')}`));
    }
  }
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Jerusalem' });
  await send('Emulation.setLocaleOverride', { locale: 'he-IL' });
  for (const bad of ['9:05', '24:00', '12:60', ' 08:07', '08:07:00']) {
    await input('search-timeFrom', bad); await click('#search-submit');
    await wait(`document.activeElement.id === 'search-timeFrom'`);
    assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`), bad);
  }
  await input('search-timeFrom', '10:01'); await input('search-timeTo', '10:00'); await click('#search-submit');
  await wait(`document.activeElement.id === 'search-timeTo'`);
  await input('search-timeFrom', '10:00'); await click('#search-submit'); await readySearch();
  // Actual named Material options, selected values and parent-driven reset.
  await click('#search-teamCodes'); await wait(`document.querySelectorAll('[role="option"]').length === 2`);
  await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.includes('צוות בדיקה')).click()`);
  await key('Escape'); await click('#search-moked');
  await wait(`document.querySelectorAll('[role="option"]').length === 3`);
  await evaluate(`[...document.querySelectorAll('[role="option"]')].find(n=>n.textContent.includes('מוקד בדיקה')).click()`);
  await wait(`document.querySelector('#search-teamCodes').textContent.trim() === ''`);
  await click('#search-teamCodes'); await wait(`document.querySelectorAll('[role="option"]').length === 1`);
  await evaluate(`document.querySelector('[role="option"]').click()`); await key('Escape');
  await click('#search-innerJobCodes'); await wait(`document.querySelectorAll('[role="option"]').length === 1`);
  await evaluate(`document.querySelector('[role="option"]').click()`); await key('Escape');
  await click('#search-workLocations'); await wait(`document.querySelectorAll('[role="option"]').length === 2`);
  await evaluate(`[...document.querySelectorAll('[role="option"]')].forEach(n=>n.click())`); await key('Escape');
  await click('#search-submit'); await readySearch();
  const selectedCall = calls.filter(c => c.startsWith('/api/v1/shift-search?')).at(-1);
  assert(selectedCall.includes('teamCodes=TEST-U') && selectedCall.includes('innerJobCodes=1') &&
    new URL(app + selectedCall).searchParams.get('workLocations') === 'home,site');
  // Stable paging + actual browser Back restores submitted page, selections, scroll and exact link.
  searchMode = 'pages'; await click('#search-submit'); await readySearch();
  await click('#search-next'); await wait(`!!document.getElementById('search-detail-3026')`);
  await evaluate(`(() => { const n=document.getElementById('search-detail-3026'); n.scrollIntoView({block:'center'});
    globalThis.__searchScroll=scrollY; globalThis.__searchTable=document.querySelector('.table-wrap').scrollLeft; n.click(); })()`);
  await readyDetail(); assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/3026');
  assert(await evaluate(`document.getElementById('back-action').textContent.includes('חזרה לחיפוש')`));
  assert(await evaluate(`document.querySelector('.sidebar a[aria-current="page"]').getAttribute('href') === '/shift-search'`));
  await evaluate('history.back()'); await wait(`document.activeElement.id === 'search-detail-3026'`);
  assert(await evaluate(`Math.abs(scrollY-globalThis.__searchScroll)<=1 && document.querySelector('.table-wrap').scrollLeft===globalThis.__searchTable`));
  assert(await evaluate(`document.getElementById('search-teamCodes').textContent.includes('צוות בדיקה')`));
  assert(calls.filter(c => c.startsWith('/api/v1/shift-search?')).at(-1).includes('offset=25'));
  await input('search-timeTo', '23:59'); assert.equal(await evaluate(`!!document.querySelector('.row-link')`), false);
  searchMode = 'normal'; await click('#search-submit'); await readySearch();
  // Search late success/error/403 are separately tested with uncooperative transport in Angular.
  searchMode = 'hold'; held = null; await click('#search-submit');
  await wait(`!!document.querySelector('mat-progress-bar')`); assert(held); const lateSearch = held;
  searchMode = 'normal'; await input('search-timeTo', '23:58'); await click('#search-submit'); await readySearch();
  await fulfill(lateSearch.id, searchList(lateSearch.url)).catch(() => {});
  await new Promise(r => setTimeout(r, 100));
  assert(await evaluate(`document.querySelector('.applied').textContent.includes('23:58')`));
  assert.equal(await evaluate('document.activeElement.id'), 'search-results');
  for (const mode of ['empty', 400, 401, 403, 500, 503, 'source-mismatch', 'malformed']) {
    searchMode = mode; await navigate('/shift-search'); await readySearchContext(); await click('#search-submit');
    await wait(mode === 'empty' ? `!!document.getElementById('search-results')` : `!!document.getElementById('search-error')`);
    if (mode === 400) await wait(`document.activeElement.id === 'search-timeTo'`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
    if (mode === 503) { searchMode = 'normal'; await click('#search-retry'); await readySearch(); }
    if (mode === 403) assert.equal(await evaluate(`document.getElementById('search-submit').disabled`), true);
  }
  searchMode = 'normal';
  for (const mode of ['source-mismatch', 'malformed']) {
    searchContextMode = mode; await navigate('/shift-search'); await wait(`!!document.getElementById('search-error')`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
  }
  searchContextMode = 'normal';
  for (const mode of ['failure', 'malformed', 'no-search', 'search-only']) {
    identityMode = mode; const before = calls.length;
    await navigate('/shift-search');
    if (mode === 'search-only') { await readySearchContext(); await click('#search-submit'); await readySearch();
      assert.equal(await evaluate(`!!document.querySelector('.row-link')`), false);
    } else { await wait(`!!document.getElementById('search-error')`);
      assert.equal(calls.slice(before).filter(c => c !== '/api/v1/identity').length, 0);
    }
  }
  identityMode = 'normal';
  console.log('PASS SEARCH18: 1440/390/320 RTL/no page overflow; two actual Material picker targets 24/60, 00:00/23:59/08:07; calendar Escape; invalid dates/minutes/range/equality; en-US UTC-/+; scoped named multiselects; 7 flags; pages -> effective detail -> browser Back exact filters/page/scroll/opener; dirty/race; empty/400/401/403/500/503/retry/malformed/source/capability failures.');
  assert.equal(await evaluate(`localStorage.length + sessionStorage.length`), 0);
  assert.deepEqual(external, [], 'No external runtime assets/API');
  assert.deepEqual(errors, [], 'No runtime JS exceptions');
  console.log('PASS: no browser storage, external requests or runtime exceptions. Screenshots .angular/browser-evidence, synthetic only.');
} finally {
  await send('Fetch.disable').catch(() => {}); socket.close();
}
