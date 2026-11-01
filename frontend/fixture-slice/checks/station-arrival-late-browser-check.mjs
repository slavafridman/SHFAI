// Synthetic typed HTTP late0/late1 AND actual Node/domain/native UoW protocol doubles.
// Owned loopback only. No process.env, driver, DNS, broker, .test imports or real operator provisioning.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { registerHooks } from 'node:module';
import { ownedProtocolBrowser } from './owned-protocol-browser.mjs';
import { startLateProtocolWorld } from './station-arrival-late-protocol-backend.mts';
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.includes('/frontend/fixture-slice/src/') && /^\.\.?\/[^.]+$/.test(specifier))
    return next(specifier + '.ts', context);
  return next(specifier, context);
} });
const fx = await import('../src/station-arrival-late-fixtures.ts');
const guards = await import('../src/station-arrival-late-contract.ts');
hooks.deregister();
const root = resolve(process.argv[2] ?? '.angular/ui50-production/browser');
await readFile(resolve(root, 'index.html'));
const summaries = [];
for (const mode of ['fixture0', 'fixture1', 'native-success', 'native-defer', 'native-unknown']) {
  let world, browser, observedIdentity, observedContext, observedValidation, observedCommand, observedReceipt;
  let commandRelease;
  const responses = [], failures = [];
  const minute = mode === 'fixture1' ? '1' : '0';
  const fixture = mode.startsWith('fixture');
  const base = '/api/v1/employees/9001/shift-days/6201/station-arrival-late';
  const commands = () => responses.filter(r => r.path === base + '/commands');
  const fixtureResponse = (url, method, body) => {
    const c = fx.lateContextFixture(minute);
    if (url.pathname === '/api/v1/identity') return fx.lateIdentityFixture();
    if (url.pathname === '/api/v1/attendance/filter-context') return {
      defaults: { attendanceDate: '2026-10-20', timeFrom: '00:00', timeTo: '00:00', mokedCode: 'M001',
        teamCodes: [], innerJobCodes: [], workLocations: [] },
      mokedOptions: [{ code: 'M001', label: 'מוקד סינתטי', unitType: 'G01' }],
      teamOptions: [{ code: '0021', label: 'צוות סינתטי', unitType: 'J01', parentMokedCode: 'M001' }],
      innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
      businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only',
    };
    if (url.pathname === '/api/v1/attendance') return {
      items: [{ shiftDayId: '6201', employee: { employeeId: '9001', firstName: 'עובד', lastName: 'סינתטי HTTP בלבד',
        unit: { code: '0021', label: 'צוות סינתטי', moked: { code: 'M001', label: 'מוקד סינתטי', unitType: 'G01' } } },
        planned: { ...c.planned, workingFromHome: null, activities: [], activityFallback: null, innerJob: null },
        attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
          missingReasonCode: null, briefingRecorded: null } }],
      applied: { attendanceDate: url.searchParams.get('attendanceDate'), timeFrom: url.searchParams.get('timeFrom'),
        timeTo: url.searchParams.get('timeTo'), mokedCode: url.searchParams.get('mokedCode'), teamCodes: [], innerJobCodes: [], workLocations: [],
        sort: 'effective-start-asc' },
      page: { limit: Number(url.searchParams.get('limit')), offset: Number(url.searchParams.get('offset')), hasMore: false, nextOffset: null },
      businessTimeZone: 'Asia/Jerusalem', dataSource: 'oracle-read-only',
    };
    if (url.pathname === base + '/context') return c;
    if (url.pathname === base + '/validations') {
      assert.equal(method, 'POST'); assert(guards.lateDraft(body)); return fx.lateValidationFixture(minute);
    }
    if (url.pathname === base + '/commands') {
      assert.equal(method, 'POST'); assert(guards.lateCommand(body)); return fx.lateReceiptFixture(body, minute);
    }
    throw Error('Unexpected synthetic endpoint');
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (!url.pathname.startsWith('/api/')) {
        const path = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
        const file = extname(path) ? path : resolve(root, 'index.html');
        let data; try { data = await readFile(file); } catch { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream' });
        res.end(data); return;
      }
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const bytes = Buffer.concat(chunks), body = bytes.length ? JSON.parse(bytes.toString()) : undefined;
      let status, value, headers;
      if (fixture) {
        status = 200; value = fixtureResponse(url, req.method, body);
        headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
      } else {
        assert(world);
        const forwarded = {};
        for (const key of ['origin', 'content-type', 'accept']) if (typeof req.headers[key] === 'string') forwarded[key] = req.headers[key];
        const upstream = await fetch(world.origin + url.pathname + url.search, { method: req.method,
          headers: forwarded, ...(bytes.length ? { body: bytes } : {}), signal: AbortSignal.timeout(10000) });
        status = upstream.status; value = await upstream.json(); headers = {};
        for (const key of ['content-type', 'cache-control', 'x-content-type-options']) headers[key] = upstream.headers.get(key);
      }
      responses.push({ path: url.pathname, method: req.method, status, value });
      if (status === 200) {
        if (url.pathname.endsWith('/identity')) { assert(guards.lateIdentity(value)); observedIdentity = value; }
        if (url.pathname === base + '/context') {
          assert(observedIdentity);
          const selection = { ...fx.lateSelectionFixture(minute), orgUnitId: fixture ? '0021' : 'T001',
            startLocal: value.planned.startLocal, endLocal: value.planned.endLocal };
          assert(guards.lateContext(value, selection)); observedContext = value;
        }
        if (url.pathname === base + '/validations') {
          assert(guards.lateValidation(value, observedContext)); observedValidation = value;
        }
        if (url.pathname === base + '/commands') {
          assert(guards.lateCommand(body)); observedCommand = body;
          assert(guards.lateReceipt(value, observedContext, body, observedValidation)); observedReceipt = value;
        }
      }
      if (fixture && url.pathname === base + '/commands') await new Promise(resolve => { commandRelease = resolve; });
      res.writeHead(status, headers); res.end(JSON.stringify(value));
    } catch (error) {
      failures.push(error.message); if (!res.headersSent) res.writeHead(502); res.end();
    }
  });
  try {
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    if (!fixture) world = await startLateProtocolWorld(origin, mode === 'native-defer' ? 'defer' : mode === 'native-unknown' ? 'unknown' : 'none');
    browser = await ownedProtocolBrowser(origin); const b = browser;
    if (mode === 'fixture1') await b.send('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 800, deviceScaleFactor: 1, mobile: false,
    });
    await b.send('Page.navigate', { url: origin + '/attendance' });
    await b.wait(`!!document.getElementById('attendance-submit') && !document.getElementById('attendance-submit').disabled`);
    const date = fixture ? '2026-10-20' : world.date;
    await b.input('attendance-date', date.split('-').reverse().join('/'));
    await b.input('attendance-timeFrom', '00:00'); await b.input('attendance-timeTo', '23:59');
    await b.activate('#attendance-submit'); await b.wait(`!!document.getElementById('attendance-late-6201')`);
    assert.equal(observedIdentity.principal.capabilities.filter(c => c.endsWith(':read')).length, 7);
    assert(await b.evaluate(`document.querySelectorAll('.sidebar nav a').length >= 5`), 'approved unbound read-navigation visible');
    await b.evaluate(`(()=>{const n=document.getElementById('attendance-late-6201');
      n.scrollIntoView({block:'center'});n.focus({preventScroll:true});
      const table=document.querySelector('.table-wrap');if(table)table.scrollLeft=-120;
      window.scrollTo(0,Math.min(180,document.documentElement.scrollHeight-innerHeight));
      window.__shfLateOriginView={scroll:scrollY,horizontal:table?.scrollLeft??0};})()`);
    await b.key('Enter');
    await b.wait(`!!document.getElementById('station-status') && !document.getElementById('station-status').textContent.includes('טוענים')`);
    await b.wait(`document.querySelector('shf-station-arrival h1')?.textContent.includes('באיחור')`);
    assert(await b.evaluate(`getComputedStyle(document.querySelector('.station-page')).direction==='rtl'`));
    assert(await b.evaluate(`document.documentElement.scrollWidth<=innerWidth`), 'responsive page without horizontal overflow');
    assert(await b.evaluate(`document.querySelector('.mockbar').textContent.includes('לא בוצע אימות סיסמה אמיתית')`));
    assert(await b.evaluate(`!document.querySelector('textarea,input[type="datetime-local"]')`));
    if (mode === 'native-defer') {
      assert.equal(observedContext.eligibility, 'deferred');
      assert(await b.evaluate(`document.getElementById('station-validate').getAttribute('aria-disabled')==='true'`));
      world.assertPure(); assert.equal(commands().length, 0);
      b.assertClean(); assert.deepEqual(failures, []);
      summaries.push({ mode, result: 'actual pure context deferred, zero mutation/commands' }); continue;
    }
    await b.wait(`!!document.getElementById('station-reason') && document.getElementById('station-reason').getAttribute('aria-disabled')!=='true'`);
    await b.choose('station-reason', true);
    await b.activate('#station-validate'); await b.wait(`!!document.querySelector('mat-dialog-container')`);
    await b.modalReady(); assert(await b.evaluate(`document.activeElement.id==='station-warning-cancel'`));
    assert(await b.evaluate(`(()=>{const r=document.querySelector('mat-dialog-container').getBoundingClientRect();
      return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight})()`), 'modal remains within viewport');
    assert(await b.evaluate(`!document.querySelector('#station-warning-ack input').checked`));
    assert.equal(commands().length, 0); if (world) world.assertPure();
    // Escape Cancel0, exact opener restoration, no hidden warning ACK.
    await b.key('Escape'); await b.wait(`!document.querySelector('mat-dialog-container')`);
    await b.wait(`document.activeElement.id==='station-validate'`);
    assert.equal(commands().length, 0);
    await b.activate('#station-validate'); await b.wait(`!!document.querySelector('mat-dialog-container')`); await b.modalReady();
    await b.evaluate(`document.querySelector('#station-warning-ack input').focus()`); await b.key(' ', 'Space');
    await b.activate('#station-warning-review'); await b.wait(`!document.querySelector('mat-dialog-container')`);
    await b.wait(`document.activeElement.id==='station-review-title'`);
    assert.equal(commands().length, 0);
    await b.activate('#station-confirm'); await b.wait(`!!document.querySelector('mat-dialog-container')`); await b.modalReady();
    assert(await b.evaluate(`document.activeElement.id==='native-station-operation-cancel'`));
    assert(await b.evaluate(`!document.querySelector('#native-station-operation-ack input').checked`));
    // Keyboard focus stays inside the actual Material modal.
    for (let i = 0; i < 8; i++) {
      await b.key('Tab'); assert(await b.evaluate(`!!document.activeElement.closest('mat-dialog-container')`));
    }
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9 });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9 });
    assert(await b.evaluate(`!!document.activeElement.closest('mat-dialog-container')`), 'Shift+Tab remains in modal');
    assert.equal(commands().length, 0);
    if (world) world.hold();
    await b.evaluate(`document.querySelector('#native-station-operation-ack input').focus()`); await b.key(' ', 'Space');
    await b.activate('#native-station-operation-confirm'); await b.wait(`!document.querySelector('mat-dialog-container')`);
    await b.wait(`document.getElementById('station-status').textContent.includes('נשלחה')`);
    assert(await b.evaluate(`(()=>{const n=document.getElementById('station-confirm');
      const pending=!document.querySelector('.receipt') && n.getAttribute('aria-disabled')==='true';
      n.click(); return pending;})()`)); // deliberate repeat handler check while the response is held
    // Release immediately after observing pending/repeat-disable. Extra CDP
    // focus/readiness trips here can exhaust the unchanged 5000ms HTTP budget
    // during concurrent builds; that correctly yields UNKNOWN, not success.
    if (fixture) commandRelease?.();
    else world.release();
    if (mode === 'native-unknown') {
      await b.wait(`document.getElementById('station-status').textContent.includes('UNKNOWN')`);
      assert(!observedReceipt); assert.equal(commands().length, 1);
      assert.equal(commands()[0].status, 503); assert.equal(commands()[0].value.code, 'COMMAND_OUTCOME_UNKNOWN');
      assert.equal(world.inspect().committed, true, 'lost ACK double actually committed; UI must not infer success');
      await b.activate('#station-back'); await b.wait(`!!document.getElementById('attendance-submit')`);
      await b.wait(`!!document.getElementById('attendance-late-6201')`); await b.activate('#attendance-late-6201');
      await b.wait(`document.getElementById('station-status')?.textContent.includes('UNKNOWN')`);
      assert.equal(commands().length, 1);
      await b.send('Page.reload');
      await b.wait(`document.getElementById('station-status')?.textContent.includes('UNKNOWN')`);
      assert.equal(commands().length, 1); assert(!observedReceipt);
      const upstream = await fetch(world.origin + base + '/context', { headers: { Origin: origin } });
      // Coordinator availability is a fail-closed LIVE_WRITES_DISABLED gate,
      // not an invented status/reconciliation endpoint for the previous command.
      assert.equal(upstream.status, 403); assert.equal((await upstream.json()).code, 'LIVE_WRITES_DISABLED');
      summaries.push({ mode, result: 'actual committed lost-ACK UNKNOWN; retained server fence; return/reload no retry' });
    } else {
      await b.wait(`!!document.querySelector('.receipt')`); assert(observedReceipt);
      assert.equal(commands().length, 1);
      if (world) { world.assertSuccess(); assert(Number(observedReceipt.recorded.stationLate.minutes) >= 1); }
      else assert.equal(observedReceipt.recorded.stationLate.minutes, minute);
      // Exact filter/opener history restoration without replay.
      await b.activate('#station-back'); await b.wait(`!!document.getElementById('attendance-submit')`);
      await b.wait(`document.activeElement.id==='attendance-late-6201'`);
      assert.equal(await b.evaluate(`document.getElementById('attendance-date').value`), date.split('-').reverse().join('/'));
      assert(await b.evaluate(`scrollY===window.__shfLateOriginView.scroll &&
        (document.querySelector('.table-wrap')?.scrollLeft??0)===window.__shfLateOriginView.horizontal`),
        'exact source vertical and RTL horizontal scroll restored');
      assert.equal(commands().length, 1);
      summaries.push({ mode, result: fixture ? `typed HTTP late${minute}, no native claim` : 'actual UoW >=1 receipt, exact five SET fields/preservation/readback' });
    }
    b.assertClean(); assert.deepEqual(failures, []);
  } catch (error) {
    console.error('FAIL synthetic browser case', mode, failures,
      responses.map(r => ({ path: r.path, status: r.status, code: r.value?.code })));
    if (browser) console.error('Synthetic screen diagnostic:', await browser.evaluate(`document.body.innerText.slice(0,1800)`));
    throw error;
  } finally {
    commandRelease?.(); world?.release();
    if (browser) await browser.close();
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    if (world) await world.close();
  }
}
console.log('PASS canonical50-v0.1 owned browser evidence ' + JSON.stringify(summaries));
