// Real Angular -> existing Angular loopback proxy -> EXPLICIT synthetic backend.
// Refuses non-fixture identity before opening the UI or requesting business data.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const app = 'http://127.0.0.1:4320';
const identity = await fetch(`${app}/api/v1/identity`, { cache: 'no-store' }).then(r => r.json());
assert.equal(identity.dataSource, 'isolated-fixture', 'Never run against Oracle');
assert.equal(identity.principal.synthetic, true);
assert.deepEqual(identity.principal.capabilities, ['shift-day:read', 'current-shifts:read']);
const target = (await fetch('http://127.0.0.1:9322/json/list').then(r => r.json())).find(t => t.type === 'page');
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
  else if (m.method === 'Network.responseReceived' && m.params.response.url.includes('/api/v1/')) {
    apiResponses.push({ url: new URL(m.params.response.url).pathname, status: m.params.response.status,
      cache: m.params.response.headers['cache-control'] ?? m.params.response.headers['Cache-Control'] });
  }
};
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
  assert(apiResponses.some(r => r.url.endsWith('/filter-context')));
  assert(apiResponses.some(r => r.url.endsWith('/current-shifts')));
  assert(apiResponses.some(r => r.url.endsWith('/shift-days/2001')));
  assert(apiResponses.every(r => r.status === 200 && r.cache === 'no-store'));
  assert.deepEqual(errors, []);
  console.log('PASS actual loopback fixture API no-store responses, no intercepted HTTP, no Oracle, no runtime exceptions.');
} finally { socket.close(); }
