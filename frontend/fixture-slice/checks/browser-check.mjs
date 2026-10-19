// Actual Angular + Chrome. ALL /api requests are intercepted synthetic fixtures.
// No Oracle/backend readiness probe and no app-level fake catalog/fallback.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const app = process.env.SHF_UI_URL ?? 'http://127.0.0.1:4328';
const cdp = process.env.SHF_CDP_URL ?? 'http://127.0.0.1:9338';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(app));
const target = (await fetch(`${cdp}/json/list`).then(r => r.json())).find(t => t.type === 'page');
assert(target, 'Start your OWN isolated Chrome as documented');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0, handler, navigationLoaded;
const pending = new Map(), external = [], errors = [], calls = [];
socket.onmessage = event => {
  const m = JSON.parse(event.data);
  if (m.id) {
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  } else if (m.method === 'Page.loadEventFired') navigationLoaded?.();
  else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    errors.push(m.params.args.map(a => a.description?.split('\n')[0] ?? a.value ?? 'console error').join(' '));
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
async function navigate(path) {
  await send('Page.enable');
  const loaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Document load timed out')), 20000);
    navigationLoaded = () => { clearTimeout(timer); resolve(); };
  });
  await send('Page.navigate', { url: app + path }); await loaded; navigationLoaded = null;
}
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
    capabilities: ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read', 'shift-items:read', 'employee:read'], employeeId: null, resourceScope: { orgUnitIds: ['TEST-U', 'TEST-V'] } },
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
let scheduleMode = 'normal', scheduleContextMode = 'normal';
let itemsMode = 'normal';
let cardMode = 'normal';
function operationalCard(url) {
  const employeeId = url.pathname.split('/')[4];
  const v = { employeeId, employee: {
    firstName: 'דנה', lastName: 'לוי',
    unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: { code: 'P01', label: 'מוקד בדיקה', unitType: 'G01' } },
    job: { code: '11', label: 'תפקיד בדיקה' }, innerJob: { code: '101', label: 'תפקיד פנימי לבדיקה' },
    privateSentinel: 'PRIVATE_CARD_SENTINEL',
  }, businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture', privateSentinel: 'PRIVATE_CARD_SENTINEL' };
  if (cardMode === 'unknown') { v.employee.job = {code:'-9',label:null}; v.employee.innerJob = null; }
  if (cardMode === 'self-parent') v.employee.unit.moked.code = v.employee.unit.code;
  if (cardMode === 'wrong-id') v.employeeId = '999';
  if (cardMode === 'scope') v.employee.unit.code = 'OTHER';
  if (cardMode === 'malformed') v.employee.job.code = '0';
  if (cardMode === 'source') v.dataSource = 'oracle-read-only';
  if (cardMode === 'oracle') v.dataSource = 'oracle-read-only';
  if (cardMode === 'long') {
    v.employee.firstName = 'א'.repeat(40); v.employee.lastName = 'ב'.repeat(40);
    v.employee.unit.label = 'צ'.repeat(256); v.employee.unit.moked.label = 'מ'.repeat(256);
    v.employee.job.code = '9'.repeat(38); v.employee.innerJob.label = 'ת'.repeat(256);
  }
  return v;
}
function selectedItems(url) {
  const parts = url.pathname.split('/'), employee = parts[4], day = parts[6];
  const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'));
  const kinds = ['break', 'timeoff', 'exception'];
  const count = itemsMode === 'empty' ? 0 : itemsMode === 'self-parent' ? 25 : itemsMode === 'pages' ? offset === 0 ? 25 : 5 : 3;
  const rows = Array.from({ length: count }, (_, i) => {
    const start = `2026-10-15T23:${String(i).padStart(2,'0')}:${i === 2 ? '30' : '00'}`;
    const kind = kinds[i % 3];
    return { key: { shiftDayId: day, startLocal: start }, kind,
      stateCode: kind === 'break' ? '4' : kind === 'timeoff' ? '2' : '7',
      type: kind === 'break' ? null : { code: kind === 'timeoff' ? '0' : '-9', label: null },
      startLocal: start, endLocal: '2026-10-16T00:10:13',
      durationMinutes: i === 0 ? '-5' : i === 1 ? '99999999999999999999999999999999999999' : '0',
      breakExitLocal: kind === 'break' && i === 0 ? '2026-10-15T23:01:02' : null,
      breakReturnLocal: null, remark: i === 0 ? '<img src=x onerror=alert(1)> &\nסינתטי בלבד' : null, sourceCode: i === 0 ? 'DEL' : 'TEST' };
  });
  const v = { shiftDay: sample(employee, day), displayContext: { unit: row().employee.unit,
    activities: row().activities, innerJob: null }, items: rows, applied: { sort: 'start-asc' },
    page: { limit, offset, hasMore: itemsMode === 'pages' && offset === 0,
      nextOffset: itemsMode === 'pages' && offset === 0 ? 25 : null } };
  if (itemsMode === 'source') v.shiftDay.dataSource = 'oracle';
  if (itemsMode === 'mismatch') v.shiftDay.employeeId = '9999';
  if (itemsMode === 'malformed') v.items[0].durationMinutes = '-0';
  if (itemsMode === 'self-parent') v.displayContext.unit.moked.code = v.displayContext.unit.code;
  if (itemsMode === 'oracle-valid') v.shiftDay.dataSource = 'oracle';
  return v;
}
function scheduleContext(url) {
  const mode = url.searchParams.get('mode'), employee = row().employee;
  if (mode === 'selected') employee.employeeId = url.searchParams.get('employeeId');
  const linked = identityMode === 'self-linked';
  return { actor: { mode, employee: mode === 'self' && !linked ? null : employee },
    selectionRequired: mode === 'self' && !linked,
    canSelectEmployee: !['self-linked', 'self-unlinked', 'schedule-only'].includes(identityMode),
    defaults: { dateFrom: '2026-10-15', dateTo: '2026-10-28' },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
}
function scheduleList(url) {
  const p = url.searchParams, actor = scheduleContext(url).actor;
  const limit = Number(p.get('limit')), offset = Number(p.get('offset'));
  const count = scheduleMode === 'empty' ? 0 : scheduleMode === 'pages' ? offset === 0 ? 25 : 5 : 2;
  return { actor, items: Array.from({ length: count }, (_, i) => ({
    shiftDayId: String(4001 + offset + i), employee: actor.employee,
    startLocal: p.get('dateFrom') + 'T23:30:11',
    endLocal: i % 2 ? null : p.get('dateTo') + 'T23:59:22', activities: row().activities })),
    applied: { mode: p.get('mode'), employeeId: actor.employee.employeeId,
      dateFrom: p.get('dateFrom'), dateTo: p.get('dateTo'), sort: 'effective-start-asc' },
    page: { limit, offset, hasMore: scheduleMode === 'pages' && offset === 0,
      nextOffset: scheduleMode === 'pages' && offset === 0 ? 25 : null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: scheduleMode === 'source-mismatch' ? 'oracle-read-only' : 'isolated-fixture' };
}
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
    if (identityMode === 'oracle-items') value.dataSource = 'oracle';
    if (['no-items','no-card'].includes(identityMode)) {
      value.principal.provider = 'real'; value.principal.synthetic = false; value.principal.employeeId = '1001';
      value.principal.capabilities = value.principal.capabilities.filter(c => c !== (identityMode === 'no-items' ? 'shift-items:read' : 'employee:read'));
    }
    if (identityMode === 'no-detail-items') {
      value.principal.provider = 'real'; value.principal.synthetic = false;
      value.principal.capabilities = ['shift-items:read']; value.principal.employeeId = '1001';
    }
    if (identityMode === 'malformed') value.principal.capabilities = ['shift-day:read'];
    if (['no-search', 'search-only'].includes(identityMode)) {
      value.principal.provider = 'real'; value.principal.synthetic = false;
      value.principal.capabilities = identityMode === 'no-search' ? ['current-shifts:read'] : ['shift-search:read'];
    }
    if (['self-linked', 'self-unlinked', 'schedule-only'].includes(identityMode)) {
      value.principal.provider = 'real'; value.principal.synthetic = false;
      value.principal.capabilities = ['my-shifts:read'];
      value.principal.employeeId = identityMode === 'self-linked' ? '1001' : null;
    }
    return fulfill(event.requestId, value);
  }
  if (url.pathname === '/api/v1/my-shifts/context') {
    if (scheduleContextMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof scheduleContextMode === 'number') return fulfill(event.requestId, problem(scheduleContextMode), scheduleContextMode);
    const value = scheduleContext(url);
    if (scheduleContextMode === 'source-mismatch') value.dataSource = 'oracle-read-only';
    if (scheduleContextMode === 'malformed') value.selectionRequired = !value.selectionRequired;
    return fulfill(event.requestId, value);
  }
  if (url.pathname === '/api/v1/my-shifts') {
    if (scheduleMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof scheduleMode === 'number') return fulfill(event.requestId,
      { ...problem(scheduleMode), ...(scheduleMode === 400 ? { invalidParameters: [{ name: 'dateTo', reason: 'invalid-format' }] } : {}) }, scheduleMode);
    const value = scheduleList(url);
    if (scheduleMode === 'malformed') value.items[0].employee = { ...value.actor.employee, employeeId: '9999' };
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
  if (url.pathname.endsWith('/breaks-and-exceptions')) {
    if (itemsMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof itemsMode === 'number') return fulfill(event.requestId, problem(itemsMode), itemsMode);
    if (itemsMode === 'ambiguity') return fulfill(event.requestId, {
      ...problem(500), code: 'AMBIGUOUS_SHIFT_ITEMS', type: 'urn:shf:problem:AMBIGUOUS_SHIFT_ITEMS',
    }, 500);
    return fulfill(event.requestId, selectedItems(url));
  }
  if (url.pathname.endsWith('/operational-card')) {
    if (cardMode === 'hold') { held = { id: event.requestId, url }; return; }
    if (typeof cardMode === 'number') {
      const code = ({400:'INVALID_REQUEST',401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'EMPLOYEE_NOT_FOUND',
        500:'INVALID_SOURCE_DATA',503:'DEPENDENCY_UNAVAILABLE'})[cardMode];
      return fulfill(event.requestId, {...problem(cardMode),code,type:`urn:shf:problem:${code}`},cardMode);
    }
    return fulfill(event.requestId, operationalCard(url));
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
  if (process.env.SHF_CARD_ONLY) {
    await (await import('./employee-card-browser-check.mjs')).runEmployeeCardChecks({
      assert, send, evaluate, wait, size, navigate, key, click, input, screenshot, noOverflow, calls, readyList, readyDetail,
      setCard: v => { cardMode = v; }, setIdentity: v => { identityMode = v; }, setList: v => { listMode = v; },
      release: async () => {
        const old = held; held = null;
        if (old) {
          try { await fulfill(old.id, operationalCard(old.url)); }
          catch (e) {
            // Chrome may already have invalidated an actually aborted A. Only
            // that exact CDP transport outcome is expected; unit tests separately
            // deliver late callbacks using an intentionally ineffective abort.
            if (!e.message.includes('Invalid InterceptionId')) throw e;
          }
        }
      },
    });
  } else if (process.env.SHF_ITEMS_ONLY) {
    const run = process.env.SHF_ITEMS_REVIEW_ONLY === '1'
      ? (await import('./items-review-check.mjs')).runItemsReviewChecks
      : (await import('./items-browser-check.mjs')).runItemsChecks;
    await run({ assert, send, evaluate, wait, size, navigate, key, click, input,
      screenshot, noOverflow, calls, readyList, readyDetail,
      setItems: value => { itemsMode = value; }, setIdentity: value => { identityMode = value; },
      setList: value => { listMode = value; }, setSearch: value => { searchMode = value; },
      setSchedule: value => { scheduleMode = value; },
      release: async (status = 200) => { const old = held; held = null;
        if (old) await fulfill(old.id, status === 200 ? selectedItems(old.url) : problem(status), status); },
    });
  } else {
  if (!process.env.SHF_SEARCH_ONLY && !process.env.SHF_SCHEDULE_ONLY) {
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
  const readySearchContext = () => wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled &&
    !!document.getElementById('search-date').value && !!document.getElementById('search-timeFrom').value && !!document.getElementById('search-timeTo').value`);
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
  const scheduleReady = () => wait(`!!document.getElementById('schedule-results')`);
  for (const width of [1440, 390, 320]) {
    await size(width, width === 1440 ? 900 : 844);
    let before = calls.length;
    await navigate('/my-shifts'); await wait(`document.querySelector('main')?.textContent.includes('נדרשת בחירת')`);
    assert.equal(calls.slice(before).filter(c => c.startsWith('/api/v1/my-shifts?')).length, 0);
    assert.equal(await evaluate(`document.querySelectorAll('main input').length`), 0);
    await noOverflow(); await screenshot(`schedule18-no-selection-${width}`);
    await navigate('/shift-search'); await readySearchContext(); await click('#search-submit'); await readySearch();
    await click('#search-schedule-3001'); await scheduleReady();
    assert(await evaluate(`document.querySelector('.actor').textContent.includes('תוצאת חיפוש')`));
    assert.equal(await evaluate(`document.getElementById('schedule-dateFrom').value`), '15/10/2026');
    assert.equal(await evaluate(`document.getElementById('schedule-dateTo').value`), '28/10/2026');
    assert(await evaluate(`document.querySelector('tbody').textContent.includes('לא זמין')`));
    assert(await evaluate(`document.querySelector('tbody').textContent.includes('ביום אחר')`));
    await noOverflow(); await screenshot(`schedule18-selected-${width}`);
    assert(await evaluate(`document.querySelectorAll('tbody tr:first-child [data-label]').length === 6`));
    assert(await evaluate(`[...document.querySelectorAll('tbody .date-time-token')].every(n => {
      const r=document.createRange();r.selectNodeContents(n);return new Set([...r.getClientRects()].map(x=>x.top)).size<=1;})`));
    if (width !== 1440) {
      await click('#menu-open'); await wait(`document.getElementById('menu').open`);
      await evaluate(`document.querySelector('#menu a:last-of-type').focus()`); await key('Tab');
      assert(await evaluate(`document.getElementById('menu').contains(document.activeElement)`));
      await key('Escape'); await wait(`document.activeElement.id === 'menu-open'`);
    }
    await click('#schedule-detail-4002'); await wait(`document.activeElement.id === 'result-heading'`);
    assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/4002');
    assert(await evaluate(`document.getElementById('back-action').textContent.includes('משמרות העובד/ת')`));
    await evaluate('history.back()'); await wait(`document.activeElement.id === 'schedule-detail-4002'`);
    await evaluate('history.forward()'); await wait(`document.activeElement.id === 'result-heading'`);
    await click('#back-action'); await wait(`document.activeElement.id === 'schedule-detail-4002'`);
    await click('#schedule-back'); await wait(`document.activeElement.id === 'search-schedule-3001'`);
    await navigate('/current-shifts'); await readyList(); await click('#schedule-2001'); await scheduleReady();
    assert(await evaluate(`document.querySelector('.actor').textContent.includes('משמרות נוכחיות')`));
    await click('#schedule-detail-4001'); await wait(`document.activeElement.id === 'result-heading'`);
    await click('#back-action'); await wait(`document.activeElement.id === 'schedule-detail-4001'`);
    await click('#schedule-back'); await wait(`document.activeElement.id === 'schedule-2001'`);
    console.log('PASS SCHEDULE18 navigation and RTL reflow', width);
  }
  await size(1440, 900); await navigate('/my-shifts/selected/1001'); await scheduleReady();
  // Each calendar has a distinct target and restores its exact trigger on Escape.
  for (const index of [0, 1]) {
    await evaluate(`globalThis.__rangeTrigger = document.querySelectorAll('mat-datepicker-toggle button')[${index}]`);
    await evaluate(`globalThis.__rangeTrigger.focus()`); await key('Enter'); await wait(`!!document.querySelector('mat-datepicker-content')`);
    await wait(`document.querySelector('mat-datepicker-content').contains(document.activeElement)`);
    await new Promise(r => setTimeout(r, 300));
    await key('Escape'); await wait(`!document.querySelector('mat-datepicker-content')`);
    await wait(`document.activeElement === globalThis.__rangeTrigger`);
  }
  // Actual Material leap-day selection, from and to target independently.
  for (const [id, toggle] of [['dateFrom', 0], ['dateTo', 1]]) {
    await input(`schedule-${id}`, '28/02/2024');
    await evaluate(`document.querySelectorAll('mat-datepicker-toggle button')[${toggle}].click()`);
    await wait(`!!document.querySelector('mat-calendar')`);
    await evaluate(`[...document.querySelectorAll('.mat-calendar-body-cell')].find(n => n.textContent.trim()==='29').click()`);
    await wait(`!document.querySelector('mat-datepicker-content')`);
    assert.equal(await evaluate(`document.getElementById('schedule-${id}').value`), '29/02/2024');
  }
  await click('#schedule-apply'); await scheduleReady();
  for (const [from, to, valid] of [
    ['01/10/2026','31/10/2026',true], ['01/10/2026','01/11/2026',false],
    ['18/10/2026','18/10/2026',true], ['29/02/2100','01/03/2100',false],
    ['29/02/2000','01/03/2000',true], ['01/01/0001','01/01/0001',true],
    ['31/12/9999','31/12/9999',true], ['01/01/0000','01/01/0000',false],
    ['31/04/2026','01/05/2026',false], ['10/31/2026','01/11/2026',false],
  ]) {
    await input('schedule-dateFrom', from); await input('schedule-dateTo', to);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
    await click('#schedule-apply');
    if (valid) await scheduleReady();
    else { await wait(`document.querySelector('mat-error') !== null`);
      assert.equal(await evaluate(`document.getElementById('schedule-dateFrom').value`), from); }
  }
  for (const timezoneId of ['America/Los_Angeles', 'Pacific/Auckland']) {
    await send('Emulation.setTimezoneOverride', { timezoneId });
    await send('Emulation.setLocaleOverride', { locale: 'en-US' });
    await input('schedule-dateFrom','28/02/2024'); await input('schedule-dateTo','01/03/2024');
    await click('#schedule-apply'); await scheduleReady();
    assert(calls.at(-1).includes('dateFrom=2024-02-28') && calls.at(-1).includes('dateTo=2024-03-01'));
  }
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Jerusalem' });
  await send('Emulation.setLocaleOverride', { locale: 'he-IL' });
  scheduleMode = 'pages'; await navigate('/my-shifts/selected/1001'); await scheduleReady();
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 25);
  await click('#schedule-next'); await wait(`!!document.getElementById('schedule-detail-4026')`);
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 5);
  await click('#schedule-detail-4026'); await wait(`document.activeElement.id === 'result-heading'`);
  await evaluate('history.back()'); await wait(`document.activeElement.id === 'schedule-detail-4026'`);
  scheduleMode = 'hold'; await input('schedule-dateFrom', '16/10/2026'); await click('#schedule-apply');
  await wait(`document.querySelector('mat-progress-bar') !== null`); while (!held) await new Promise(r => setTimeout(r, 25));
  const lateSchedule = held; held = null;
  scheduleMode = 'normal'; await input('schedule-dateFrom', '17/10/2026'); await click('#schedule-apply'); await scheduleReady();
  await fulfill(lateSchedule.id, scheduleList(lateSchedule.url)).catch(() => {});
  await new Promise(r => setTimeout(r, 100));
  assert(await evaluate(`document.querySelector('.results').textContent.includes('17/10/2026')`));
  for (const mode of ['empty',400,401,403,404,500,503,'source-mismatch','malformed']) {
    scheduleMode = mode; await navigate('/my-shifts/selected/1001');
    await wait(mode === 'empty' ? `!!document.getElementById('schedule-results')` : `!!document.getElementById('schedule-error')`);
    if (mode === 400) await wait(`document.activeElement.id === 'schedule-dateTo'`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
  }
  scheduleMode = 'normal';
  for (const mode of ['source-mismatch','malformed',403]) {
    scheduleContextMode = mode; await navigate('/my-shifts/selected/1001');
    await wait(`!!document.getElementById('schedule-error')`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false);
  }
  scheduleContextMode = 'normal';
  for (const mode of ['self-linked','self-unlinked']) {
    identityMode = mode; await navigate('/my-shifts');
    if (mode === 'self-linked') { await scheduleReady();
      assert.equal(await evaluate(`document.querySelector('h1').textContent`), 'המשמרות שלי');
      assert.equal(await evaluate(`!!document.querySelector('tbody a')`), false);
    } else await wait(`document.querySelector('main')?.textContent.includes('קישור עובד/ת מאומת')`);
  }
  identityMode = 'self-linked'; scheduleContextMode = 403; await navigate('/my-shifts/selected/1001');
  await wait(`!!document.getElementById('schedule-error')`);
  identityMode = 'normal'; scheduleContextMode = 'normal';
  await navigate('/my-shifts/selected/' + '9'.repeat(38)); await scheduleReady();
  await size(320,844);
  await evaluate(`document.getElementById('schedule-technical').open=true`);
  await noOverflow();
  assert.equal(await evaluate(`document.querySelector('#schedule-technical bdi').textContent.length`),38);
  const colors = await evaluate(`(() => {
    document.querySelector('h1').focus({preventScroll:true});
    const c=n=>getComputedStyle(n).color;
    return {body:c(document.querySelector('h1')), muted:c(document.querySelector('.cell-note')),
      primary:getComputedStyle(document.getElementById('schedule-apply')).backgroundColor,
      onPrimary:c(document.getElementById('schedule-apply')),
      focus:getComputedStyle(document.querySelector('h1')).outlineColor};
  })()`);
  const luminance = color => {
    const [r,g,b] = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
      const x=v/255; return x<=0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4;
    }); return .2126*r+.7152*g+.0722*b;
  };
  const contrast = (a,b) => { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const measured = {bodyOnWhite:contrast(colors.body,'rgb(255,255,255)'),
    mutedOnWhite:contrast(colors.muted,'rgb(255,255,255)'), button:contrast(colors.primary,colors.onPrimary),
    focusOnWhite:contrast(colors.focus,'rgb(255,255,255)')};
  assert(measured.bodyOnWhite>=4.5 && measured.mutedOnWhite>=4.5 && measured.button>=4.5 && measured.focusOnWhite>=3);
  console.log('PASS limited computed-color pairs (not complete WCAG audit):', measured);
  console.log('PASS SCHEDULE18: no-selection/no list; both explicit row sources and nested own-ID detail/back/history; 1440/390/320; two Material calendars/Escape/leap target; strict 31/32/equality/0001/9999; UTC-/+ en-US; 25+5 paging; dirty/cancel/late; errors400/401/403/404/500/503/malformed/source; future real-self double and real-selected denial. No real provider/authentication claim.');
  }
  assert.equal(await evaluate(`localStorage.length + sessionStorage.length`), 0);
  assert.deepEqual(external, [], 'No external runtime assets/API');
  assert.deepEqual(errors, [], 'No runtime JS exceptions');
  console.log('PASS: no browser storage, external requests or runtime exceptions. Screenshots .angular/browser-evidence, synthetic only.');
} finally {
  await send('Fetch.disable').catch(() => {}); socket.close();
}
