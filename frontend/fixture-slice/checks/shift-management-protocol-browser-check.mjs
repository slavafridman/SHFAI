// U49 Phase B: actual Angular -> forwarding proxy -> actual Node application ->
// native UoW/source assembler/admission/readback over EXPLICIT protocol doubles.
// No canned HTTP responses, manual command POSTs, .test imports or live driver.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { startManagementProtocolWorld } from './shift-management-protocol-backend.mts';
import { ownedProtocolBrowser, until } from './owned-protocol-browser.mjs';
import { record } from '../../../backend/fixture-slice/contract-validation.mts';

const root = resolve(process.argv[2] ?? '.angular/u49-production/browser');
await readFile(resolve(root, 'index.html')); // fail before starting owned resources
const summaries = [];
/** @type {import('../../../backend/fixture-slice/shift-management-contracts.mts').ShiftOperationKindV1[]} */
const kinds = ['create', 'change', 'cancel', 'csv-create'];
const displayTime = v => `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)} ${v.slice(11)}`;
for (const kind of kinds) {
  let world, browser;
  const calls = [], failures = [];
  const server = createServer(async (req, res) => {
    try {
      assert(req.url);
      const url = new URL(req.url, 'http://127.0.0.1');
      if (!url.pathname.startsWith('/api/')) {
        const path = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
        const file = extname(path) ? path : resolve(root, 'index.html');
        let data;
        try { data = await readFile(file); } catch { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript',
          '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data); return;
      }
      assert(world, 'backend ready before browser');
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      calls.push({ path: url.pathname, method: req.method });
      /** @type {Record<string, string>} */
      const headers = {};
      for (const name of ['content-type', 'origin', 'accept'])
        if (typeof req.headers[name] === 'string') headers[name] = req.headers[name];
      // Forward bytes/Origin unchanged. Never synthesize successful API effects.
      const upstream = await fetch(world.origin + url.pathname + url.search, {
        method: req.method, headers, ...(body.length ? { body } : {}), signal: AbortSignal.timeout(12000),
      });
      const bytes = Buffer.from(await upstream.arrayBuffer());
      world.observe(url.pathname, upstream.status, JSON.parse(bytes.toString('utf8')),
        body.length && headers['content-type']?.startsWith('application/json') ? JSON.parse(body.toString('utf8')) : undefined,
        headers['content-type']);
      /** @type {import('node:http').OutgoingHttpHeaders} */
      const responseHeaders = {};
      for (const name of ['content-type', 'cache-control', 'x-content-type-options']) {
        const value = upstream.headers.get(name);
        if (value !== null) responseHeaders[name] = value;
      }
      res.writeHead(upstream.status, responseHeaders);
      res.end(bytes);
    } catch {
      failures.push('forwarding failure');
      if (!res.headersSent) res.writeHead(502);
      res.end();
    }
  });
  try {
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); assert(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`;
    world = await startManagementProtocolWorld(kind, origin);
    assert((await fetch(origin + '/', { signal: AbortSignal.timeout(3000) })).ok, 'static listener responsive');
    assert((await fetch(world.origin + '/api/v1/identity', { signal: AbortSignal.timeout(3000) })).ok,
      'actual Node listener responsive');
    browser = await ownedProtocolBrowser(origin);
    const b = browser;
    const path = ['change', 'cancel'].includes(kind) ?
      '/employees/1/shift-days/7/manage' : '/employees/1/shift-management';
    await b.send('Page.navigate', { url: origin + path });
    await b.wait(`!!document.getElementById('management-prepare') && !document.querySelector('mat-progress-bar')`);
    assert(await b.evaluate(`getComputedStyle(document.querySelector('shf-shift-management')).direction==='rtl'`));
    assert(await b.evaluate(`document.querySelector('.mockbar').textContent.includes('מנהל מערכת סינתטי') &&
      document.querySelector('.mockbar').textContent.includes('לא בוצע אימות סיסמה אמיתית')`),
      'explicit synthetic Administrator indication, not credential verification');
    assert(await b.evaluate(`document.querySelector('.environment').textContent.includes('TEST')`));
    assert(await b.evaluate(`document.querySelector('.context').textContent.includes('אינו/ה זהות היישום')`),
      'employee context separate from identity');
    world.assertPure();
    if (kind === 'create') {
      assert(world.draft.kind === 'create');
      const date = world.draft.startLocal.slice(0, 10).split('-').reverse().join('/');
      await b.input('management-startDate', date); await b.input('management-endDate', date);
      await b.input('management-startTime', '09:00'); await b.input('management-endTime', '10:00');
      await b.choose('management-activityCode'); await b.choose('management-workLocation', true);
    } else if (kind === 'change') {
      await b.choose('management-activityCode', true);
    } else if (kind === 'cancel') {
      await b.activate('#management-cancel'); await b.choose('management-reasonCode');
    } else {
      await b.activate('#management-import'); await b.wait(`!!document.getElementById('management-file')`);
      await b.choose('management-encoding');
      // File selection on the actual input; synthetic bytes remain memory-only.
      await b.evaluate(`(()=>{
        const transfer=new DataTransfer();
        transfer.items.add(new File([${JSON.stringify(world.csv)}], 'synthetic.csv', {type:'text/csv'}));
        const n=document.getElementById('management-file');n.files=transfer.files;
        n.dispatchEvent(new Event('change',{bubbles:true}));
      })()`);
      await b.wait(`document.querySelector('.file-field')?.textContent.includes('synthetic.csv') &&
        !document.querySelector('mat-progress-bar')`);
    }
    await b.activate('#management-prepare');
    await b.wait(`!!document.getElementById('management-review')`);
    world.assertPure();
    // The observer uses the actual frontend preparation/CSV guards against the
    // observed identity/context/request, not a second assertion-only validator.
    const preparation = world.preparation();
    assert(preparation && preparation.contractVersion === '49-v0.1' && preparation.dataSource === 'oracle-test',
      'actual native preparation');
    if (kind === 'csv-create') {
      assert('rows' in preparation && preparation.state === 'ready');
      assert.equal(preparation.rows.length, 2);
      assert(preparation.rows.every(r => r.effect && !r.errors.length));
      assert.equal(await b.evaluate(`document.querySelectorAll('tbody tr').length`), 2);
    } else { assert('effects' in preparation); assert.equal(preparation.effects.length, 1); }
    await b.activate('#management-review'); await b.wait(`!!document.querySelector('mat-dialog-container')`);
    await b.modalReady();
    assert(await b.evaluate(`document.activeElement.id==='management-review-heading'`), 'initial review focus');
    assert.equal(await b.evaluate(`document.querySelectorAll('mat-dialog-container section.effect').length`),
      kind === 'csv-create' ? 2 : 1);
    const effects = 'rows' in preparation ? preparation.rows.map(row => {
      assert(row.effect); return row.effect;
    }) : preparation.effects;
    const displayed = await b.evaluate(`[...document.querySelectorAll('mat-dialog-container section.effect')].map(n=>
      [...n.querySelectorAll('article')].map(a=>[...a.querySelectorAll('dd')].map(d=>d.textContent.trim())))`);
    const fields = state => [state.status === 'cancelled' ? 'מבוטלת לוגית — היסטוריה נשמרת' : 'מתוכננת — פעילות',
      displayTime(state.startLocal), displayTime(state.endLocal), state.activityCode, state.siteId,
      state.workLocation === 'home' ? 'בית' : 'אתר', `${state.paidMinutes} / ${state.workMinutes}`, state.source];
    assert.deepEqual(displayed, effects.map(e => [
      e.before ? [e.before.status === 'cancelled' ? 'מבוטלת' : 'מתוכננת', ...fields(e.before).slice(1)] : [],
      fields(e.after),
    ]), 'displayed before/after fields match actual native preparation');
    assert(await b.evaluate(`[...document.querySelectorAll('mat-dialog-container mat-checkbox input')].every(n=>!n.checked)`));
    // Escape is non-mutating and focus returns predictably.
    await b.key('Escape');
    await b.wait(`!document.querySelector('mat-dialog-container') && document.activeElement.id==='management-review'`);
    world.assertPure();
    assert.equal(calls.filter(c => /\/(?:csv-)?commands$/.test(c.path)).length, 0);
    await b.activate('#management-review'); await b.wait(`!!document.querySelector('mat-dialog-container')`);
    await b.modalReady();
    const ids = await b.evaluate(`[...document.querySelectorAll('mat-dialog-container mat-checkbox input')].map(n=>n.id)`);
    assert(ids.length > 0);
    for (const id of ids) {
      await b.evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`); await b.key(' ', 'Space');
    }
    await b.wait(`!document.getElementById('management-review-confirm').disabled`);
    world.holdSql();
    await b.activate('#management-review-confirm');
    await until(() => world.stats.active === 1, 'actual native SQL held', 4000);
    await b.wait(`document.getElementById('management-status')?.textContent.includes('הפקודה נשלחה')`);
    assert.equal(world.stats.commits, 0);
    assert(await b.evaluate(`!document.querySelector('.success') && document.getElementById('management-prepare').disabled`),
      'no premature success; repeat submission disabled');
    world.releaseSql();
    await b.wait(`!!document.querySelector('.success')`);
    const summary = await world.verifySuccess();
    const response = world.lastResponse();
    assert(response);
    assert.equal(response.status, 200);
    const receipt = world.receipt();
    assert(await b.evaluate(`document.querySelector('.success').textContent.includes('השינוי נשמר ואומת') &&
      document.querySelector('.success').textContent.includes('לא הופעל שותף חיצוני')`));
    assert.deepEqual(await b.evaluate(`[...document.querySelectorAll('.success a')].map(n=>n.getAttribute('href'))`),
      receipt.effects.map(e => `/employees/1/shift-days/${e.after.shiftDayId}/manage`));
    assert(await b.evaluate(`document.querySelector('.success').textContent.includes('מספר משמרות: ${receipt.effects.length}')`));
    assert.equal(calls.filter(c => /\/(?:csv-)?commands$/.test(c.path)).length, 1, 'exactly one UI command');
    b.assertClean(); assert.deepEqual(failures, []);
    summaries.push(summary);
    console.log('PASS actual Angular/Node/native protocol ' + JSON.stringify(summary));
  } catch (error) {
    // Whitelisted diagnostics only: never print CSV, receipts/tokens, identity or config.
    console.error('FAIL ' + kind + ': ' + error.message);
    console.error('API paths/methods ' + JSON.stringify(calls));
    const last = world?.lastResponse();
    const classification = record(last?.body) ? last.body : {};
    console.error('Last API classification ' + JSON.stringify(last && { path: last.path, status: last.status,
      code: classification.code, mode: classification.mode, eligibility: classification.eligibility, blockers: classification.blockers }));
    if (browser) console.error('UI state ' + JSON.stringify(await browser.evaluate(`({
      status:document.getElementById('management-status')?.textContent,
      prepare:!!document.getElementById('management-prepare'),
      error:!!document.querySelector('.error'), path:location.pathname})`)));
    throw error;
  } finally {
    world?.releaseSql();
    try { if (browser) await browser.close(); }
    finally {
      try { if (world) await world.close(); }
      finally {
        const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed;
      }
    }
    console.log('CLEANUP owned browser/profile, Node pools/authority TEMP and proxy: ' + kind);
  }
}
assert.equal(summaries.length, 4);
console.log('PASS U49 Phase B four fresh isolated worlds; actual HTTP/native UoW over protocol doubles, NOT live Oracle/EMS.');
