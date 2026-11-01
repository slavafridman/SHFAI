// QA-UI-01: actual deployed Angular, no response interception/product replacement.
// Read-only navigation with synthetic route IDs; owned Chrome/profile cleaned up.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { ownedProtocolBrowser } from './owned-protocol-browser.mjs';
import { waitForCurrentShiftsErrorReady, drawerTraceInstaller, namedDrawerStage,
  checkMobileDrawer } from './workspace-shell-readiness.mjs';

let origin = process.argv[2] ?? 'http://127.0.0.1:18080';
let server;
if (origin === '--build') {
  // Separate local fixed-shell proof. No running Docker change, backend,
  // credential verification or API fixtures: every API is explicitly unavailable.
  assert(process.argv[3], '--build requires an existing browser build directory');
  const root = resolve(process.argv[3]);
  await readFile(resolve(root, 'index.html'));
  server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (path.startsWith('/api/')) { response.writeHead(503); response.end(); return; }
      const file = extname(path) ? resolve(root, '.' + path) : resolve(root, 'index.html');
      if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
      const bytes = await readFile(file);
      response.writeHead(200, {'Content-Type': {
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
        '.css': 'text/css', '.map': 'application/json',
      }[extname(file)] ?? 'application/octet-stream'});
      response.end(bytes);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });
  origin = 'http://127.0.0.1:' + server.address().port;
  console.log('LOCAL FIXED BUILD ONLY; identity/API unavailable (503); not deployed Docker', origin);
}
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
let browser;
const failures = [];
try {
  browser = await ownedProtocolBrowser(origin);
  await browser.send('Page.addScriptToEvaluateOnNewDocument', {source: drawerTraceInstaller});
  const focusedTrace = process.argv.includes('--mobile-trace');
  for (const width of focusedTrace ? [360] : [1440, 360]) {
    for (const [index, path] of (focusedTrace ? ['/current-shifts', '/current-shifts'] :
      ['/current-shifts', '/employees/TEST-E1/operational-card?origin=qa-ui-01&filter=a%2Fb']).entries()) {
      const world = `${width}:${path}:${focusedTrace ? (index ? 'warm' : 'cold') : index}`;
      const stage = (label, action) => namedDrawerStage(browser, `${world}:${label}`, action);
      await browser.send('Emulation.setDeviceMetricsOverride', {
        width, height: 800, deviceScaleFactor: 1, mobile: false,
      });
      await browser.send('Page.navigate', { url: origin + path });
      await stage('page.heading-and-skip-ready', () => browser.wait(`location.href === ${JSON.stringify(origin + path)} &&
        !!document.querySelector('main h1') && !!document.querySelector('a.skip')`));
      if (path === '/current-shifts') await stage('page.final-error-ready', () => waitForCurrentShiftsErrorReady(browser));
      await browser.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
      // Reach the semantic link by actual backward keyboard traversal, not .click().
      for (let tabs = 0; tabs < 80; tabs++) {
        if (await browser.evaluate(`document.activeElement?.matches('a.skip')`)) break;
        await browser.send('Input.dispatchKeyEvent', {
          type: 'keyDown', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9,
        });
        await browser.send('Input.dispatchKeyEvent', {
          type: 'keyUp', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9,
        });
      }
      await browser.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
      const before = await browser.evaluate(`(() => {
        const skip = document.querySelector('a.skip');
        const main = document.querySelector('main');
        const target = main.querySelector('h1') || main;
        window.__qaSkip = {main, target, click: null, key: null};
        sessionStorage.removeItem('__qaSkipInput');
        document.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            window.__qaSkip.key = {trusted: e.isTrusted, target: e.target === skip};
            sessionStorage.setItem('__qaSkipInput', JSON.stringify({key: window.__qaSkip.key}));
          }
        }, {once: true, capture: true});
        document.addEventListener('click', e => {
          window.__qaSkip.click = {trusted: e.isTrusted, prevented: e.defaultPrevented, target: e.target === skip};
          sessionStorage.setItem('__qaSkipInput', JSON.stringify({
            key: window.__qaSkip.key, click: window.__qaSkip.click}));
        }, {once: true});
        const r = skip.getBoundingClientRect();
        return {url: location.href, length: history.length, state: JSON.stringify(history.state),
          scroll: [scrollX, scrollY], focused: document.activeElement === skip,
          semantic: skip.getAttribute('href') === '#main' && document.querySelector('#main') === main &&
            skip.textContent === 'דילוג לתוכן הראשי',
          rect: {top: r.top, bottom: r.bottom, left: r.left, right: r.right},
          visible: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth};
      })()`);
      await browser.key('Enter');
      // Native click/default action is synchronous; drain microtasks and paint,
      // without an arbitrary delay or retry that could conceal a focus steal.
      await browser.evaluate('new Promise(r => queueMicrotask(() => requestAnimationFrame(() => requestAnimationFrame(r))))');
      const after = await browser.evaluate(`(() => {
        const proof = window.__qaSkip;
        const input = JSON.parse(sessionStorage.getItem('__qaSkipInput') || '{}');
        const target = proof?.target;
        const r = target?.getBoundingClientRect();
        const top = r && document.elementFromPoint(Math.max(0, r.left) + Math.min(r.width / 2, 20),
          Math.max(0, r.top) + Math.min(r.height / 2, 10));
        return {url: location.href, length: history.length, state: JSON.stringify(history.state),
          scroll: [scrollX, scrollY], key: input.key, click: input.click,
          focus: document.activeElement?.tagName, focusText: document.activeElement?.textContent?.slice(0, 80),
          sameView: proof?.main === document.querySelector('main'),
          focused: document.activeElement === target && target?.getAttribute('tabindex') === '-1',
          unobscured: !!r && r.top >= 0 && r.bottom <= innerHeight &&
            (top === target || target?.contains(top)),
          rtl: getComputedStyle(document.documentElement).direction === 'rtl',
          noOverflow: document.documentElement.scrollWidth <= innerWidth};
      })()`);
      try {
        assert(before.focused && before.semantic && before.visible, 'keyboard-reachable visible Hebrew fragment anchor');
        assert(after.key?.trusted && after.key.target && after.click?.trusted && after.click.target,
          'trusted Enter produces normal anchor click');
        assert(after.click.prevented, 'native default navigation cancelled');
        assert.deepEqual([after.url, after.length, after.state, after.scroll],
          [before.url, before.length, before.state, before.scroll], 'route/query/history/scroll unchanged');
        assert(after.sameView && after.focused && after.unobscured, 'same view with safe unobscured heading/main focus');
        assert(after.rtl && after.noOverflow, 'RTL without viewport overflow');
        console.log('PASS ALL SKIP ASSERTIONS', {width, path});
        if (width === 360) {
          await checkMobileDrawer(browser, stage);
          console.log('PASS drawer Escape/opener and mobile-to-desktop/main focus', {path});
          console.log('DRAWER TIMED TRACE', world,
            JSON.stringify(await browser.evaluate('window.__qaDrawerTrace.events')));
        }
        console.log('PASS QA-UI-01', {width, path, before, after});
      } catch (error) {
        failures.push({width, path, reason: error.message, before, after});
        console.log('FAIL QA-UI-01', JSON.stringify(failures.at(-1)));
      }
    }
  }
  if (process.argv.includes('--rapid-reopen')) {
    // Independent ROOT regression: no close-completion or modal-readiness
    // admission between these synchronous user-handler activations.
    for (const temperature of ['cold', 'warm']) {
      if (temperature === 'cold') await browser.send('Network.clearBrowserCache');
      await browser.send('Emulation.setDeviceMetricsOverride', {
        width: 360, height: 800, deviceScaleFactor: 1, mobile: false,
      });
      await browser.send('Page.navigate', {url: origin + '/current-shifts'});
      await waitForCurrentShiftsErrorReady(browser);
      await browser.evaluate(`(() => {
        const dialog = document.querySelector('#menu');
        const opener = document.querySelector('#menu-open');
        window.__qaRapid = {heading: document.querySelector('main h1'), closedWhileOpen: null};
        dialog.addEventListener('close', () => {
          window.__qaRapid.closedWhileOpen = dialog.open;
        }, {once: true});
        opener.click();
        document.querySelector('#menu-close').click();
        opener.click();
        if (!dialog.open) throw Error('Rapid sequence failed to reopen native dialog');
      })()`);
      // Observe the actual queued native event, never delay reopen to avoid it.
      await browser.wait('window.__qaRapid.closedWhileOpen !== null');
      const reopened = await browser.evaluate(`(() => {
        const anchors = [...document.querySelectorAll('#menu .cdk-focus-trap-anchor')];
        return {queuedCloseSawOpen: window.__qaRapid.closedWhileOpen,
          nativeOpen: document.querySelector('#menu').open,
          expanded: document.querySelector('#menu-open').getAttribute('aria-expanded'),
          trapActive: anchors.length === 2 && anchors.every(a => a.tabIndex === 0)};
      })()`);
      assert.deepEqual(reopened, {
        queuedCloseSawOpen: true, nativeOpen: true, expanded: 'true', trapActive: true,
      }, 'queued native close preserves reopened native/ARIA/CDK state');
      await browser.send('Emulation.setDeviceMetricsOverride', {
        width: 1440, height: 800, deviceScaleFactor: 1, mobile: false,
      });
      await browser.wait(`!document.querySelector('#menu').open &&
        document.activeElement === window.__qaRapid.heading`);
      const closed = await browser.evaluate(`({
        nativeOpen: document.querySelector('#menu').open,
        expanded: document.querySelector('#menu-open').getAttribute('aria-expanded'),
        headingFocused: document.activeElement === window.__qaRapid.heading,
        bodyFocused: document.activeElement === document.body,
        trapInactive: [...document.querySelectorAll('#menu .cdk-focus-trap-anchor')].every(a => a.tabIndex === -1)
      })`);
      assert.deepEqual(closed, {nativeOpen: false, expanded: 'false',
        headingFocused: true, bodyFocused: false, trapInactive: true});
      console.log('PASS ROOT rapid reopen / queued native close / desktop H1', {temperature, reopened, closed});
    }
  }
  browser.assertClean();
  assert.equal(failures.length, 0, `${failures.length}/${focusedTrace ? 2 : 4} deployed composite worlds failed (see named stages)`);
} finally {
  await browser?.close();
  if (server) await new Promise((accept, reject) => server.close(error => error ? reject(error) : accept()));
}
