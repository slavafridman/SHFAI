// Real Angular -> existing Angular loopback proxy -> EXPLICIT synthetic backend.
// Refuses non-fixture identity before opening the UI or requesting business data.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const app = process.env.SHF_UI_URL ?? 'http://127.0.0.1:4328';
const cdp = process.env.SHF_CDP_URL ?? 'http://127.0.0.1:9338';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(app) && /^http:\/\/127\.0\.0\.1:\d+$/.test(cdp));
const identity = await fetch(`${app}/api/v1/identity`, { cache: 'no-store' }).then(r => r.json());
assert.equal(identity.dataSource, 'isolated-fixture', 'Never run against Oracle');
assert.equal(identity.principal.synthetic, true);
assert.deepEqual(identity.principal.capabilities, ['shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read']);
const target = (await fetch(`${cdp}/json/list`).then(r => r.json())).find(t => t.type === 'page');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => { socket.onopen = r; });
let id = 0;
const pending = new Map(), errors = [], apiResponses = [];
socket.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id) {
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    errors.push(m.params.args.map(a => a.description?.split('\n')[0] ?? a.value ?? 'console error').join(' '));
  else if (m.method === 'Network.responseReceived' && m.params.response.url.includes('/api/v1/')) {
    apiResponses.push({ url: new URL(m.params.response.url).pathname, status: m.params.response.status,
      cache: m.params.response.headers['cache-control'] ?? m.params.response.headers['Cache-Control'] });
  }
};
async function searchScenarios() {
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${app}/shift-search` });
    await wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
    assert.equal(await evaluate(`!!document.querySelector('table')`), false, 'No hidden automatic search');
    await input('search-date', '15/10/2026'); await input('search-timeFrom', '10:00'); await input('search-timeTo', '10:00');
    await evaluate(`document.getElementById('search-submit').click()`);
    await wait(`!!document.getElementById('search-detail-3001')`);
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 25);
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr:first-child .indicators li').length`), 7);
    assert(await evaluate(`document.querySelector('table').textContent.includes('תיאור לא זמין (קוד UNKNOWN)')`));
    assert(await evaluate(`document.querySelector('.applied').textContent.includes('נתוני הדגמה מבודדים')`));
    await evaluate(`document.getElementById('search-next').click()`);
    await wait(`!!document.getElementById('search-detail-3026')`);
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 5);
    await screenshot(`search18-proxy-results-${width}`);
    await evaluate(`(() => { const n=document.getElementById('search-detail-3026'); n.scrollIntoView({block:'nearest'});
      globalThis.__searchScroll=scrollY; globalThis.__searchTable=document.querySelector('.table-wrap').scrollLeft; n.click(); })()`);
    await wait(`document.activeElement.id === 'result-heading'`);
    assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/3026');
    assert(await evaluate(`document.getElementById('back-action').textContent.includes('חזרה לחיפוש')`));
    assert(await evaluate(`document.querySelector('.detail-card').textContent.includes('16/10/2026')`));
    await screenshot(`search18-proxy-detail-${width}`);
    await evaluate('history.back()');
    await wait(`document.activeElement.id === 'search-detail-3026'`);
    assert.equal(await evaluate(`document.getElementById('search-timeFrom').value`), '10:00');
    assert.equal(await evaluate(`document.getElementById('search-timeTo').value`), '10:00');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 5);
    assert(await evaluate(`Math.abs(scrollY-globalThis.__searchScroll)<=1 && document.querySelector('.table-wrap').scrollLeft===globalThis.__searchTable`));
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    await evaluate('history.forward()'); await wait(`document.activeElement.id === 'result-heading'`);
    await evaluate('history.back()'); await wait(`document.activeElement.id === 'search-detail-3026'`);
    await input('search-timeFrom', '10:01'); await input('search-timeTo', '10:01');
    assert.equal(await evaluate(`!!document.querySelector('.row-link')`), false);
    await evaluate(`document.getElementById('search-submit').click()`);
    await wait(`!!document.getElementById('search-results') && !document.querySelector('table')`);
    console.log('PASS actual fixture SEARCH18:', { width, equality: '10:00 inclusive', rows: '25+5', detailDay: '3026',
      browserBackForward: 'page/filters/scroll/exact opener', empty: '10:01', intercepted: false });
  }
}
// D01 narrow visual retest: real DOM Range geometry, not jsdom text assertions.
async function searchTokenScenarios() {
    for (const width of [1440, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: `${app}/shift-search` });
      await wait(`!!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
      await input('search-date', '15/10/2026'); await input('search-timeFrom', '10:00'); await input('search-timeTo', '10:00');
      await evaluate(`document.getElementById('search-submit').click()`);
      await wait(`!!document.getElementById('search-detail-3001')`);
      const measurement = await evaluate(`(() => {
        const round=n=>Math.round(n*100)/100;
        const rows=[...document.querySelectorAll('tbody tr')];
        const measure=n=>{
          const range=document.createRange(); range.selectNodeContents(n);
          const rects=[...range.getClientRects()].filter(r=>r.width>0 && r.height>0);
          return {value:n.textContent, lines:new Set(rects.map(r=>round(r.top))).size,
            tokenWidth:round(range.getBoundingClientRect().width),
            cellWidth:round(n.closest('td').getBoundingClientRect().width),
            whiteSpace:getComputedStyle(n).whiteSpace, overflowWrap:getComputedStyle(n).overflowWrap};
        };
        const wrap=document.querySelector('.table-wrap');
        return {width:innerWidth, pageWidth:document.documentElement.scrollWidth,
          tableViewport:wrap.clientWidth, tableScrollWidth:wrap.scrollWidth,
          rowCount:rows.length, firstRow:[...rows[0].querySelectorAll('.date-time-token')].map(measure),
          allTokens:[...document.querySelectorAll('tbody .date-time-token')].map(measure),
          rows:rows.map(row=>({fields:row.children.length, flags:row.querySelectorAll('.indicators li').length,
            visible:[...row.children].every(c=>getComputedStyle(c).display!=='none' && c.getBoundingClientRect().height>0)})),
          longTextWrap:getComputedStyle(rows[0].querySelector('[data-label="פעילות"]')).overflowWrap,
          mobileLabels:[...rows[0].children].map(c=>getComputedStyle(c,'::before').content)};
      })()`);
      assert(measurement.pageWidth <= width, 'No PAGE overflow (allow vertical scrollbar)');
      assert.equal(measurement.allTokens.length, measurement.rowCount * 4);
      assert(measurement.allTokens.every(t => t.lines === 1 && t.whiteSpace === 'nowrap' && t.overflowWrap === 'normal'));
      assert(measurement.rows.every(r => r.fields === 10 && r.flags === 7 && r.visible));
      assert.equal(measurement.longTextWrap, 'anywhere', 'Long raw text still wraps');
      assert.deepEqual(measurement.firstRow.map(t => t.value), ['15/10/2026', '10:00:00', '01:00:13', '16/10/2026']);
      if (width <= 760) assert(measurement.mobileLabels.every(s => s !== 'none' && s !== 'normal' && s !== '""'));
      await evaluate(`document.querySelector('tbody tr').scrollIntoView({block:'start'})`);
      await screenshot(`search18-D01-tokens-${width}`);
      const { allTokens, rows, mobileLabels, ...summary } = measurement;
      console.log('PASS SHF-SEARCH-QA-UI-18-D01 DOM Range:', JSON.stringify(summary));
    }
}
async function scheduleScenarios() {
      for (const width of [1440,390,320]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
        await send('Page.navigate', { url: `${app}/my-shifts` });
        await wait(`location.pathname === '/my-shifts' && document.querySelector('main')?.textContent.includes('נדרשת בחירת')`);
        assert.equal(await evaluate(`document.querySelectorAll('main input').length`), 0);
        await send('Page.navigate', { url: `${app}/shift-search` });
        await wait(`location.pathname === '/shift-search' && !!document.getElementById('search-submit') && !document.getElementById('search-submit').disabled`);
        await input('search-date','15/10/2026'); await input('search-timeFrom','10:00'); await input('search-timeTo','10:00');
        await evaluate(`document.getElementById('search-submit').click()`);
        await wait(`!!document.getElementById('search-schedule-3001')`);
        await evaluate(`document.getElementById('search-schedule-3001').click()`);
        await wait(`!!document.getElementById('schedule-dateFrom') && !document.getElementById('schedule-apply').disabled`);
        await input('schedule-dateFrom','15/10/2026'); await input('schedule-dateTo','28/10/2026');
        await evaluate(`document.getElementById('schedule-apply').click()`);
        await wait(`!!document.getElementById('schedule-detail-3001')`);
        assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 25);
        assert(await evaluate(`document.querySelector('.actor').textContent.includes('תוצאת חיפוש')`));
        await screenshot(`schedule18-proxy-${width}`);
        await evaluate(`document.getElementById('schedule-next').click()`);
        await wait(`!!document.getElementById('schedule-detail-3026')`);
        assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 5);
        await evaluate(`(() => { const n=document.getElementById('schedule-detail-3026'); n.scrollIntoView({block:'nearest'});
          globalThis.__scheduleScroll=scrollY; globalThis.__scheduleTable=document.querySelector('.table-wrap').scrollLeft; n.click(); })()`);
        await wait(`document.activeElement.id === 'result-heading'`);
        assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/3026');
        assert(await evaluate(`document.querySelector('.detail-card').textContent.includes('צוות בדיקה סינתטי')`));
        await evaluate('history.back()'); await wait(`document.activeElement.id === 'schedule-detail-3026'`);
        assert.equal(await evaluate(`document.getElementById('schedule-dateFrom').value`), '15/10/2026');
        assert(await evaluate(`Math.abs(scrollY-globalThis.__scheduleScroll)<=1 && document.querySelector('.table-wrap').scrollLeft===globalThis.__scheduleTable`));
        await evaluate('history.forward()'); await wait(`document.activeElement.id === 'result-heading'`);
        await evaluate(`document.getElementById('back-action').click()`); await wait(`document.activeElement.id === 'schedule-detail-3026'`);
        await evaluate(`document.getElementById('schedule-back').click()`); await wait(`document.activeElement.id === 'search-schedule-3001'`);
        assert.equal(await evaluate(`document.getElementById('search-date').value`), '15/10/2026');
        assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
        console.log('PASS actual fixture SCHEDULE18', { width, rows: '25+5', detail: '3026', nestedReturn: 'schedule -> exact search opener', noInterception: true });
      }
    }
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value;
}
async function wait(expression) {
  for (let n = 0; n < 180; n++) {
    if (await evaluate(expression)) return;
    await new Promise(r => setTimeout(r, 75));
  }
  throw Error(`Timed out ${expression}`);
}
async function input(id, value) {
  await evaluate(`(() => { const n=document.getElementById('${id}'); n.value='${value}';
    n.dispatchEvent(new Event('input',{bubbles:true})); n.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}
async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { captureBeyondViewport: false });
  await mkdir('.angular/browser-evidence', { recursive: true });
  await writeFile(`.angular/browser-evidence/${name}.png`, Buffer.from(r.data, 'base64'));
}
try {
  await send('Fetch.disable'); await send('Runtime.enable'); await send('Network.enable');
  if (process.env.SHF_SEARCH_TOKEN_ONLY === '1') {
    await searchTokenScenarios();
    assert(apiResponses.some(r => r.url.endsWith('/shift-search')));
    assert(apiResponses.every(r => r.status === 200 && r.cache === 'no-store'));
    assert.deepEqual(errors, []);
  } else {
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${app}/current-shifts` });
    await wait(`!!document.getElementById('results-heading')`);
    await input('filter-date', '15/10/2026'); await input('filter-time', '23:59');
    await evaluate(`document.getElementById('list-search').click()`);
    await wait(`!!document.getElementById('detail-2001') && document.querySelector('.applied').textContent.includes('23:59')`);
    assert(await evaluate(`document.querySelector('table').textContent.includes('צוות בדיקה סינתטי')`));
    assert(await evaluate(`document.querySelector('.source-label').textContent.includes('נתוני הדגמה מבודדים')`));
    await screenshot(`ui01-proxy-list-${width}`);
    await evaluate(`(() => { const link=document.getElementById('detail-2001'); link.scrollIntoView({block:'nearest'});
      globalThis.__tableScroll=document.querySelector('.table-wrap').scrollLeft; globalThis.__pageScroll=scrollY; link.click(); })()`);
    await wait(`document.activeElement.id === 'result-heading'`);
    assert.equal(await evaluate('location.pathname'), '/employees/1001/shift-days/2001');
    assert(await evaluate(`document.querySelector('.detail-card').textContent.includes('16/10/2026')`));
    assert(await evaluate(`document.querySelector('.detail-card').textContent.includes('צוות בדיקה סינתטי')`));
    assert(await evaluate(`document.querySelectorAll('.time-value')[1].getBoundingClientRect().bottom < ${width === 1440 ? 900 : 844}`));
    await screenshot(`ui01-proxy-detail-${width}`);
    await evaluate(`history.back()`);
    await wait(`document.activeElement.id === 'detail-2001'`);
    assert.equal(await evaluate(`document.getElementById('filter-time').value`), '23:59');
    assert(await evaluate(`document.querySelector('.table-wrap').scrollLeft === globalThis.__tableScroll`));
    assert(await evaluate(`Math.abs(scrollY-globalThis.__pageScroll) <= 1`));
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    console.log('PASS real fixture proxy:', { width, list: 200, detail: 200, historyBack: 'filters/page/vertical+table-scroll/exact-opener' });
  }
  await searchScenarios();
  await scheduleScenarios();
  assert(apiResponses.some(r => r.url.endsWith('/filter-context')));
  assert(apiResponses.some(r => r.url.endsWith('/current-shifts')));
  assert(apiResponses.some(r => r.url.endsWith('/shift-days/2001')));
  assert(apiResponses.some(r => r.url.endsWith('/shift-search')));
  assert(apiResponses.some(r => r.url.endsWith('/shift-search/filter-context')));
  assert(apiResponses.some(r => r.url.endsWith('/my-shifts/context')));
  assert(apiResponses.some(r => r.url.endsWith('/my-shifts')));
  assert(apiResponses.some(r => r.url.endsWith('/shift-days/3026')));
  assert(apiResponses.every(r => r.status === 200 && r.cache === 'no-store'));
  assert.deepEqual(errors, []);
  console.log('PASS actual loopback fixture API no-store responses, no intercepted HTTP, no Oracle, no runtime exceptions.');
  }
} finally { socket.close(); }
