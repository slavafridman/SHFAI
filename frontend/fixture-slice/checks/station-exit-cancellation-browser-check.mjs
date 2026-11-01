// Actual Angular -> Node C52 fixture or explicitly injected native protocol
// entrypoint. No inherited SHF ENV, canned receipt, real driver/DNS/Oracle/EMS.
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { startFromEnvironment, stopBackendServer } from '../../../backend/fixture-slice/server.mts';
import { cancellationFixtureEnvironment } from '../../../backend/fixture-slice/test/station-exit-cancellation-fixture-environment.mts';
import { ownedProtocolBrowser, until } from './owned-protocol-browser.mjs';
import { startCancellationProtocolWorld, cancellationNavigationEnvironment } from './station-exit-cancellation-protocol-backend.mts';

const root = resolve(process.argv[2] ?? '.angular/u52-production/browser');
const scenario = process.argv[3] ?? 'ready';
const native = scenario.startsWith('native-');
const fault = native ? scenario.slice(7) : null;
assert(['ready', 'not-recorded', 'early-deferred', 'partner-required', 'partner-unknown',
  'outcome-unknown', 'authority-consumed', 'native-success', 'native-ack-loss',
  'native-readback-mismatch', 'native-rollback', 'native-preconsumed', 'navigation', 'expiry'].includes(scenario));
await readFile(resolve(root, 'index.html'));
assert.equal(Object.keys(process.env).some(k => k.startsWith('SHF_')), false,
  'U52 runs with absent inherited SHF configuration; only explicit synthetic environments are allowed');
const detailPath = '/api/v1/employees/9001/shift-days/6201';
const commandBase = detailPath + '/station-exit-cancellation';
const counts = { context: 0, validations: 0, commands: 0 };
const admission = { contextOriginPresent: false, contextStatus: 0 };
let backend, world, backendPort = 0, browser, held, receipt, problem, validation, observedCommand;
let stage = 'entry';
const ui = createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    if (!backendPort) { res.writeHead(503); res.end(); return; }
    const url = new URL(req.url, 'http://127.0.0.1');
    const kind = Object.keys(counts).find(k => url.pathname === commandBase + '/' + k);
    if (kind) {
      counts[kind]++;
      assert.equal(url.search, '');
      assert.equal(req.method, kind === 'context' ? 'GET' : 'POST');
      if (kind === 'context') admission.contextOriginPresent = typeof req.headers.origin === 'string';
    }
    // Byte-preserving reverse proxy only. Never constructs or interprets receipts.
    const forward = () => {
      if (kind === 'commands') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => { observedCommand = JSON.parse(Buffer.concat(chunks).toString()); });
      }
      const upstream = request({ host: '127.0.0.1', port: backendPort, path: req.url, method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:' + backendPort } },
      response => {
        if (kind === 'context') admission.contextStatus = response.statusCode;
        if (kind === 'validations' || kind === 'commands') {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            if (kind === 'validations' && response.statusCode === 200) validation = body;
            if (kind === 'commands') {
              if (response.statusCode === 200) receipt = body;
              else problem = body;
            }
          });
        }
        res.writeHead(response.statusCode, response.headers); response.pipe(res);
      });
      upstream.once('error', () => { res.writeHead(503); res.end(); });
      req.pipe(upstream);
    };
    if (kind === 'commands') {
      req.pause(); held = forward; return; // bounded browser pending proof before forwarding
    }
    forward(); return;
  }
  try {
    const path = resolve(root, '.' + new URL(req.url, 'http://127.0.0.1').pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const file = extname(path) ? path : resolve(root, 'index.html');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store' }); res.end(content);
  } catch { res.writeHead(404); res.end(); }
});
async function observation() {
  const response = await fetch(`http://127.0.0.1:${backendPort}` + detailPath);
  assert.equal(response.status, 200); return response.json();
}
try {
  ui.listen(0, '127.0.0.1'); await once(ui, 'listening');
  const origin = 'http://127.0.0.1:' + ui.address().port;
  const env = scenario === 'navigation' ? cancellationNavigationEnvironment() :
    cancellationFixtureEnvironment(native || scenario === 'expiry' ? 'ready' : scenario); // whitelist, not {...process.env}
  env.SHF_STATION_EXIT_CANCELLATION_ORIGINS = JSON.stringify([origin]);
  const forbiddenFactory = async () => { throw Error('No infrastructure factory allowed in U52 fixture check'); };
  if (native) {
    world = await startCancellationProtocolWorld(origin, fault);
    if (!world) {
      console.log('PASS U52 native protocol preconsumed: startup denied; all factories=0; retained TEMP guards; rows unchanged; cleanup=true');
      // The startup denial is not a browser/receipt success.
      backendPort = 0;
    } else backendPort = world.port;
  } else {
    backend = await startFromEnvironment(env, { now: () => new Date('2026-11-01T12:00:00.123Z') },
      { read: forbiddenFactory, native: forbiddenFactory, resolveEndpoint: forbiddenFactory });
    backendPort = backend.address().port;
  }
  if (scenario === 'native-preconsumed') {
    assert.equal(world, null);
  } else {
  const before = await observation();
  browser = await ownedProtocolBrowser(origin);
  if (scenario === 'navigation') {
    stage = 'attendance origin navigation';
    await browser.send('Page.navigate', { url: origin + '/attendance' });
    await browser.wait(`!!document.querySelector('#attendance-date') && !document.querySelector('#attendance-date').matches(':disabled')`);
    await browser.input('attendance-date', '01/11/2026');
    await browser.input('attendance-timeFrom', '10:59');
    await browser.input('attendance-timeTo', '12:01');
    await browser.choose('attendance-moked', true);
    await browser.activate('#attendance-submit');
    await browser.wait(`document.querySelectorAll('tbody tr').length===25`);
    for (let page = 1; page <= 4; page++) {
      await browser.activate('#attendance-next');
      await browser.wait(`document.querySelector('.pager')?.textContent.includes('היסט: ${page * 25}')`);
    }
    await browser.wait(`document.querySelectorAll('tbody tr').length===5 && !!document.querySelector('#attendance-cancellation-6201')`);
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: false });
    await browser.evaluate(`document.querySelector('.table-wrap').scrollLeft=-180`);
    // Keyboard activation scrolls its opener into view; capture that exact
    // origin at NavigationStart, not a guessed RTL scroll sign.
    await browser.evaluate(`document.querySelector('#attendance-cancellation-6201').scrollIntoView({block:'center'});
      document.querySelector('#attendance-cancellation-6201').focus({preventScroll:true})`);
    const saved = await browser.evaluate(`({scroll:scrollY,horizontal:document.querySelector('.table-wrap').scrollLeft,
      date:document.querySelector('#attendance-date').value,from:document.querySelector('#attendance-timeFrom').value,
      to:document.querySelector('#attendance-timeTo').value,moked:document.querySelector('#attendance-moked').textContent})`);
    await browser.key('Enter');
    await browser.wait(`!!document.querySelector('shf-station-exit-cancellation .facts')`);
    await browser.key('Escape');
    await browser.wait(`document.activeElement?.id==='attendance-cancellation-6201'`);
    assert.deepEqual(await browser.evaluate(`({scroll:scrollY,horizontal:document.querySelector('.table-wrap').scrollLeft,
      date:document.querySelector('#attendance-date').value,from:document.querySelector('#attendance-timeFrom').value,
      to:document.querySelector('#attendance-timeTo').value,moked:document.querySelector('#attendance-moked').textContent})`), saved);
    assert(await browser.evaluate(`document.querySelectorAll('tbody tr').length===5 && !document.querySelector('#attendance-prev').disabled &&
      document.documentElement.dir==='rtl' && document.documentElement.scrollWidth<=innerWidth`));
    assert.equal(counts.context, 1); assert.equal(counts.validations, 0); assert.equal(counts.commands, 0);
    assert.deepEqual(await observation(), before); browser.assertClean();
    console.log('PASS U52 actual Angular→Node navigation: selected attendance row; four pages25→last5; date/time/moked, document and RTL table scroll/opener exact restoration via page Escape; validations/commands=0');
  } else {
  await browser.send('Page.navigate', { url: origin + '/employees/9001/shift-days/6201' });
  await browser.wait(`!!document.querySelector('#detail-cancellation')`);
  stage = 'selected cancellation context';
  await browser.activate('#detail-cancellation');
  await browser.wait(`!!document.querySelector('shf-station-exit-cancellation .facts') ||
    document.querySelector('#cancellation-summary')?.textContent.includes('אין הרשאה')`);
  if (scenario !== 'authority-consumed' && !admission.contextOriginPresent && admission.contextStatus === 403) {
    throw Error('B52 admission seam: same-origin browser GET context omits Origin; mandatory Origin GET rejected 403 before context. No proxy injection/fallback permitted.');
  }
  if (scenario === 'authority-consumed') {
    assert.equal(admission.contextStatus, 403);
    assert(await browser.evaluate(`document.querySelector('#cancellation-validate').disabled &&
      !document.querySelector('shf-station-exit-cancellation [aria-label="תוצאת ביטול רישום היציאה"]')`));
    assert.equal(counts.validations, 0); assert.equal(counts.commands, 0);
    assert.deepEqual(await observation(), before);
    console.log('PASS U52 fixture authority-consumed: denied context; validation/commands=0; no receipt or operator button');
  } else {
  assert(await browser.evaluate(`!!document.querySelector('shf-station-exit-cancellation .facts')`));
  assert.equal(counts.context, 1); assert.equal(counts.commands, 0);
  const admissionBase = `http://127.0.0.1:${backendPort}` + commandBase;
  assert.equal((await fetch(admissionBase + '/context', { headers: { Origin: 'http://foreign.invalid' } })).status, 403);
  for (const suffix of ['/validations', '/commands'])
    for (const headers of [{ 'Content-Type': 'application/json' }, { 'Content-Type': 'application/json', Origin: 'http://foreign.invalid' }])
      assert.equal((await fetch(admissionBase + suffix, { method: 'POST', headers, body: '{}' })).status, 403);
  assert.deepEqual(await observation(), before); world?.assertPure();
  assert(await browser.evaluate(`document.documentElement.dir==='rtl' && document.documentElement.lang==='he' &&
    document.body.textContent.includes('מנהל מערכת סינתטי אינו העובד') &&
    document.body.textContent.includes(${JSON.stringify(native ? 'כתיבה בפועל למסד TEST — לא ייצור' : 'הדמיה מבודדת בלבד — ללא Oracle')}) &&
    !document.querySelector('shf-station-exit-cancellation input')`));
  if (!native && !['ready', 'outcome-unknown', 'expiry'].includes(scenario)) {
    await browser.wait(`document.querySelector('#cancellation-validate').disabled`);
    const labels = { 'not-recorded': 'זו אינה קבלת ביטול', 'early-deferred': 'יציאה רגילה',
      'partner-required': 'בדיקת חובות שותף', 'partner-unknown': 'בדיקת חובות שותף' };
    assert(await browser.evaluate(`document.body.textContent.includes(${JSON.stringify(labels[scenario])})`));
    assert.equal(counts.validations, 0); assert.equal(counts.commands, 0);
    assert.deepEqual(await observation(), before);
    console.log(`PASS U52 actual Angular→Node isolated fixture ${scenario}; context=1 validations=0 commands=0 unchanged=true`);
  } else {
    await browser.wait(`!document.querySelector('#cancellation-validate').disabled`);
    await browser.evaluate(`(async()=>{
      const button=document.querySelector('#cancellation-validate');
      await Promise.all(button.getAnimations({subtree:true}).map(a=>a.finished));
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    })()`);
    const contrast = await browser.evaluate(`(()=>{
      const luminance=color=>{
        const rgb=color.match(/[.\\d]+/g).slice(0,3).map(Number).map(v=>{
          v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
        });return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
      };
      const ratio=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);};
      const button=document.querySelector('#cancellation-validate'), style=getComputedStyle(button);
      const background=getComputedStyle(document.documentElement).backgroundColor;
      const text=getComputedStyle(document.querySelector('.cancellation-page')).color;
      return {primaryText:ratio(style.backgroundColor,getComputedStyle(button.querySelector('.mdc-button__label')).color),
        bodyText:ratio(text,background)};
    })()`);
    console.log('MEASURED U52 sRGB contrast subset', contrast);
    assert(contrast.primaryText >= 4.5 && contrast.bodyText >= 4.5, 'Measured primary/body sRGB text contrast subset');
    await browser.activate('#cancellation-validate'); await browser.wait(`!!document.querySelector('#cancellation-review')`);
    await browser.activate('#cancellation-review'); await browser.modalReady();
    await browser.wait(`document.activeElement?.id==='cancellation-safe-cancel'`);
    assert(await browser.evaluate(`document.querySelectorAll('mat-dialog-container').length===1 &&
      !document.querySelector('#cancellation-warning-ack input').checked &&
      !document.querySelector('#cancellation-operation-ack input').checked &&
      document.querySelector('#cancellation-send').disabled`));
    for (let i = 0; i < 6; i++) {
      await browser.key('Tab');
      assert(await browser.evaluate(`!!document.activeElement?.closest('mat-dialog-container')`), 'Keyboard Tab stays in one RTL dialog');
    }
    if (scenario === 'expiry') {
      stage = 'monotonic preparation expiry';
      await until(() => browser.evaluate(`!document.querySelector('mat-dialog-container') &&
        document.body.textContent.includes('תוקף') && !document.querySelector('#cancellation-review')`),
        'actual preparation expires without dispatch', 40000);
      assert.equal(counts.commands, 0); assert.equal(counts.validations, 1);
      assert.deepEqual(await observation(), before); browser.assertClean();
      console.log('PASS U52 actual fixture/browser expiry: server TTL<=30s; open review invalidated; commands=0; data unchanged');
    } else {
    stage = 'safe Cancel Enter';
    await browser.activate('#cancellation-safe-cancel');
    await browser.wait(`document.activeElement?.id==='cancellation-validate' && !document.querySelector('mat-dialog-container')`);
    assert.equal(counts.commands, 0); assert.deepEqual(await observation(), before); world?.assertPure();
    await browser.activate('#cancellation-validate'); await browser.activate('#cancellation-review'); await browser.modalReady();
    await browser.wait(`document.activeElement?.id==='cancellation-safe-cancel'`);
    stage = 'safe Escape';
    await browser.key('Escape'); await browser.wait(`!document.querySelector('mat-dialog-container')`);
    await browser.wait(`document.activeElement?.id==='cancellation-validate'`);
    assert.equal(counts.commands, 0); assert.deepEqual(await observation(), before);
    world?.assertPure();
    await browser.activate('#cancellation-validate'); await browser.activate('#cancellation-review'); await browser.modalReady();
    stage = 'responsive review';
    for (const width of [320, 390, 1440]) {
      await browser.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert(await browser.evaluate(`document.documentElement.scrollWidth <= innerWidth &&
        document.querySelector('mat-dialog-container').getBoundingClientRect().width <= innerWidth &&
        [...document.querySelectorAll('mat-dialog-container button')].every(n=>n.getBoundingClientRect().height>=24)`));
    }
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 500, deviceScaleFactor: 2, mobile: false });
    assert(await browser.evaluate(`document.documentElement.scrollWidth<=innerWidth`)); // 200% equivalent CSS viewport, not manual zoom/AT
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.evaluate(`document.querySelector('#cancellation-warning-ack input').focus()`);
    stage = 'warning-only consent';
    await browser.key(' ', 'Space');
    assert(await browser.evaluate(`document.querySelector('#cancellation-warning-ack input').checked &&
      !document.querySelector('#cancellation-operation-ack input').checked && document.querySelector('#cancellation-send').disabled`));
    assert.equal(counts.commands, 0);
    world?.assertPure();
    await browser.evaluate(`document.querySelector('#cancellation-operation-ack input').focus()`);
    stage = 'two consents';
    await browser.key(' ', 'Space');
    await browser.wait(`!document.querySelector('#cancellation-send').disabled`);
    assert(await browser.evaluate(`document.querySelector('#cancellation-warning-ack input').checked &&
      document.querySelector('#cancellation-operation-ack input').checked && !document.querySelector('#cancellation-send').disabled`),
      'Both keyboard consents must enable deliberate dispatch');
    assert.equal(counts.commands, 0);
    assert.equal(validation.dataSource, native ? 'oracle-test' : 'isolated-fixture');
    assert(Date.parse(validation.expiresAt) - Date.parse(validation.evaluatedAt) <= 30000);
    if (native) assert.notEqual(validation.evaluatedAt, '0001-01-01T00:00:00.000Z');
    await browser.activate('#cancellation-send');
    stage = 'pending dispatch';
    await browser.wait(`document.body.textContent.includes('הפקודה נשלחה — אין לשלוח שוב')`);
    await until(() => counts.commands === 1 && typeof held === 'function', 'actual command reached held forwarding seam');
    assert.equal(counts.commands, 1);
    assert(await browser.evaluate(`document.querySelector('#cancellation-cancel').disabled &&
      document.querySelector('#cancellation-validate').disabled && !document.querySelector('mat-dialog-container')`));
    assert.deepEqual(await observation(), before); // no optimistic business mutation while held
    world?.assertPure(); world?.armFault();
    assert.equal(typeof held, 'function'); held(); held = undefined;
    const uncertain = scenario === 'outcome-unknown' || ['ack-loss', 'readback-mismatch'].includes(fault);
    stage = 'backend result';
    const rollback = fault === 'rollback';
    await browser.wait(`document.body.textContent.includes(${JSON.stringify(uncertain ? 'התוצאה אינה ידועה — אין לשלוח שוב' :
      rollback ? 'הנתונים או תוקף הבדיקה השתנו' : native ? 'השרת אישר COMMIT ובדיקה חוזרת עצמאית' :
      'הדמיה בלבד — רישום היציאה נוקה בנתונים סינתטיים')})`);
    await browser.wait(`document.activeElement?.id==='cancellation-summary'`);
    const after = await observation();
    assert.equal(after.attendance.stationExitLocal, rollback ? before.attendance.stationExitLocal : null);
    assert.deepEqual({ ...after, attendance: { ...after.attendance, stationExitLocal: before.attendance.stationExitLocal } }, before);
    assert.equal(counts.commands, 1); assert.equal(counts.validations, 3);
    assert.deepEqual(observedCommand.draft, {});
    assert.deepEqual(observedCommand.warningConfirmation, { accepted: true, code: 'RECORDED_EXIT_WILL_BE_CLEARED' });
    assert.deepEqual(observedCommand.operationConfirmation, { accepted: true });
    assert.equal(observedCommand.validationToken, validation.validationToken);
    assert.equal(observedCommand.fingerprint, validation.fingerprint);
    if (uncertain || rollback) {
      assert.equal(receipt, undefined); assert(problem);
      assert.equal(problem.effect, rollback ? 'rolled-back' : 'unknown');
      assert(await browser.evaluate(`!document.querySelector('[aria-label="תוצאת ביטול רישום היציאה"]')`));
    } else {
      assert.equal(receipt.outcome, native ? 'oracle-test-committed' : 'simulated');
      assert.equal(receipt.commandId, observedCommand.commandId);
      assert.equal(receipt.dataSource, native ? 'oracle-test' : 'isolated-fixture');
      assert.equal(receipt.partnerCompletion, 'not-invoked'); assert.equal(receipt.receiptPersistence, 'none');
      if (!native) {
        assert.equal(receipt.commitAcknowledgedAt, null); assert.equal(receipt.readBackVerifiedAt, null);
        assert(await browser.evaluate(`document.body.textContent.includes('אין — NULL')`));
      } else assert(await browser.evaluate(`document.body.textContent.includes('אישור COMMIT אינו רגע השמירה המדויק') &&
        document.body.textContent.includes('בדיקה חוזרת עצמאית')`));
    }
    await world?.assertResult(receipt);
    // Independent actual backend admission after the attempt; no manual command
    // or invented receipt. A new browser navigation must not dispatch again.
    const fence = await fetch(`http://127.0.0.1:${backendPort}` + commandBase + '/context');
    assert.equal(fence.status, 403);
    await browser.activate('#cancellation-back');
    await browser.wait(`!!document.querySelector('#detail-cancellation')`);
    await browser.wait(`document.activeElement?.id==='detail-cancellation'`);
    await browser.activate('#detail-cancellation');
    await browser.wait(`document.querySelector('#cancellation-validate')?.disabled`);
    assert.equal(counts.commands, 1);
    browser.assertClean();
    console.log(`PASS U52 actual Angular→Node ${scenario}: validations=3 commands=1; safe Cancel Enter/Escape=0 effects; Tab trap; two Space consents; pending=unchanged; independent detail/preservation; receipt=${uncertain || rollback ? 'none' : native ? 'protocol-ACK+readback' : 'simulated-NULL'}; retained fence; Back/opener focus; widths=320,390,1440 and 200%-equivalent viewport; live Oracle/EMS=none (not full WCAG)`);
  }
  }
  }
  }
  }
  if (browser) browser.assertClean();
} catch (error) {
  console.error('FAIL U52 isolated browser stage:', stage, error.message);
  console.error('Safe route counts:', counts);
  console.error('Safe GET admission metadata:', admission);
  if (browser) console.error('Safe DOM readiness flags:', await browser.evaluate(`({
    ready:document.readyState, main:!!document.querySelector('main'),
    detail:!!document.querySelector('shf-shift-day'), error:!!document.querySelector('#error-heading'),
    correctPath:location.pathname==='/employees/9001/shift-days/6201', list:!!document.querySelector('shf-current-shifts'),
    hostChildren:[...document.querySelector('shf-root').children].map(n=>n.tagName),
    result:!!document.querySelector('#result-heading'), cancellation:!!document.querySelector('#detail-cancellation'),
    identityError:!!document.querySelector('.identity-error'), scripts:document.scripts.length
    ,contextError:document.querySelector('#cancellation-summary')?.textContent.includes('המקור או הקשר'),
    sourceError:document.querySelector('#cancellation-summary')?.textContent.includes('אין הרשאה'),
    chooser:document.querySelector('#cancellation-summary')?.textContent.includes('יש לבחור'),
    loadError:document.querySelector('#cancellation-summary')?.textContent.includes('לא ניתן לטעון')
  })`));
  throw error;
} finally {
  try {
    if (browser) {
      try { await browser.send('Browser.close'); } catch { /* Native close may close CDP first. */ }
      await browser.close();
    }
  } finally {
    if (held) { held(); held = undefined; }
    await new Promise(resolve => { ui.close(resolve); ui.closeAllConnections(); });
    if (backend) await stopBackendServer(backend);
    if (world) await world.close();
  }
}
