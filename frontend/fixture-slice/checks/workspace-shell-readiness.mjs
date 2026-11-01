// QA-UI-01 deployed error-world precondition, not a product focus workaround.
// Observing the error heading's focus proves CurrentShiftsPage.defer has run;
// neither H1 presence nor a paint alone proves the API/error task is complete.
export const currentShiftsErrorReady = `(() => {
  const error = document.querySelector('#list-error');
  const results = document.querySelector('section[aria-label="תוצאות משמרות"]');
  return document.readyState === 'complete' && !!error &&
    results?.getAttribute('aria-busy') === 'false' &&
    !results.querySelector('mat-progress-bar') && document.activeElement === error;
})()`;

export async function waitForCurrentShiftsErrorReady(browser) {
  await browser.wait(currentShiftsErrorReady); // existing bounded CDP condition polling
  // Drain focus-associated microtasks and paint before sending trusted keys.
  await browser.evaluate('new Promise(r => queueMicrotask(() => requestAnimationFrame(() => requestAnimationFrame(r))))');
  // Do not quietly retry if focus/load state changed across the rendering boundary.
  if (!await browser.evaluate(currentShiftsErrorReady)) {
    throw Error('Current-shifts final error readiness changed before keyboard traversal');
  }
}

  // Public DOM/browser signals only. No Angular instances, identity, text, inputs,
  // API bodies or private fields. Installed before navigation so lifecycle events
  // are not missed; wrappers forward the native media API without changing it.
  export const drawerTraceInstaller = `(() => {
    const events = [];
    const focus = node => node === document.querySelector('main h1') ? 'main-h1' :
      node === document.querySelector('main') ? 'main' :
      node?.id === 'menu-open' ? 'menu-open' :
      node?.id === 'menu-close' ? 'menu-close' :
      node?.closest?.('#menu') ? 'drawer-control' :
      node?.matches?.('a.skip') ? 'skip' : node === document.body ? 'body' : 'other';
    const record = (signal, detail = {}) => {
      events.push({ms: Number(performance.now().toFixed(2)), signal, ...detail});
      if (events.length > 160) events.shift();
    };
    const snapshot = () => ({
      ms: Number(performance.now().toFixed(2)), width: innerWidth,
      visualWidth: visualViewport?.width, desktop: matchMedia('(min-width: 761px)').matches,
      dialogOpen: !!document.querySelector('#menu[open]'),
      expanded: document.querySelector('#menu-open')?.getAttribute('aria-expanded'),
      focus: focus(document.activeElement), hasFocus: document.hasFocus(),
      visibility: document.visibilityState,
      targetFocused: !!window.__qaSkip && document.activeElement === window.__qaSkip.target,
      trapAnchors: document.querySelectorAll('#menu .cdk-focus-trap-anchor').length,
    });
    document.addEventListener('focusin', e => record('focusin', {focus: focus(e.target)}), true);
    document.addEventListener('focusout', e => record('focusout', {focus: focus(e.target)}), true);
    for (const type of ['close', 'cancel', 'toggle']) {
      document.addEventListener(type, e => {
        if (e.target?.id === 'menu') record(type, {open: e.target.open});
      }, true);
    }
    addEventListener('resize', () => record('viewport', {width: innerWidth}));
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const media = nativeMatchMedia(query);
      if (query === '(min-width: 761px)') {
        const add = media.addEventListener.bind(media);
        const remove = media.removeEventListener.bind(media);
        media.addEventListener = (type, listener, options) => {
          if (type === 'change') record('breakpoint-listener-installed', {matches: media.matches});
          return add(type, listener, options);
        };
        media.removeEventListener = (type, listener, options) => {
          if (type === 'change') record('breakpoint-listener-removed');
          return remove(type, listener, options);
        };
      }
      return media;
    };
    nativeMatchMedia('(min-width: 761px)').addEventListener('change',
      e => record('media-change', {matches: e.matches, width: innerWidth}));
    window.__qaDrawerTrace = {events, snapshot, record};
  })()`;

  export async function namedDrawerStage(browser, label, action) {
    await browser.evaluate(`window.__qaDrawerTrace.record('stage-start', {stage:${JSON.stringify(label)}})`);
    try {
      const result = await action();
      console.log('PASS STAGE', label, await browser.evaluate('window.__qaDrawerTrace.snapshot()'));
      return result;
    } catch (error) {
      const diagnostic = await browser.evaluate(`({
        snapshot: window.__qaDrawerTrace.snapshot(), events: window.__qaDrawerTrace.events
      })`);
      console.log('FAIL NAMED STAGE', label, JSON.stringify(diagnostic));
      throw new Error(`${label}: ${error.message}`, {cause: error});
    }
  }

export const armDrawerClose = `(() => {
  const dialog = document.querySelector('#menu');
  if (!dialog?.open) throw Error('Cannot arm close completion without open drawer');
  window.__qaDrawerClose = {complete: false, reopened: false};
  dialog.addEventListener('close', () => {
    window.__qaDrawerClose.complete = true;
    window.__qaDrawerClose.reopened = dialog.open;
  }, {once: true});
})()`;

export const drawerCloseReady = `(() => {
  const completion = window.__qaDrawerClose;
  if (completion?.reopened) throw Error('Drawer reopened before prior native close event completed');
  return completion?.complete === true && !document.querySelector('dialog[open]') &&
    document.querySelector('#menu-open')?.getAttribute('aria-expanded') === 'false' &&
    document.activeElement === document.querySelector('#menu-open');
})()`;

// Native close is a queued task, not equivalent to !dialog.open/opener focus.
// The template's (close) resets menuOpen: complete that lifecycle before the
// next independent interaction; never repair state or focus in the driver.
export async function checkMobileDrawer(browser, stage = (label, action) => namedDrawerStage(browser, label, action)) {
    await stage('drawer.first.activate', () => browser.activate('#menu-open'));
    await stage('drawer.first.open', () => browser.wait(`!!document.querySelector('dialog[open]')`));
    await stage('drawer.first.keyboard-modal-ready', () => browser.modalReady());
    await stage('drawer.first.arm-native-close-completion', () => browser.evaluate(armDrawerClose));
    await stage('drawer.first.Escape', () => browser.key('Escape'));
    await stage('drawer.first.closed-and-exact-opener', () => browser.wait(`!document.querySelector('dialog[open]') &&
      document.activeElement === document.querySelector('#menu-open')`));
    await stage('drawer.first.native-close-complete', () => browser.wait(drawerCloseReady));
    await stage('drawer.second.activate', () => browser.activate('#menu-open'));
    await stage('drawer.second.open', () => browser.wait(`!!document.querySelector('dialog[open]')`));
    await stage('drawer.second.keyboard-modal-ready', () => browser.modalReady());
    await stage('drawer.second.menu-state-ready', () => browser.wait(`document.querySelector('#menu-open')?.getAttribute('aria-expanded') === 'true'`));
    await stage('drawer.second.resize-desktop', () => browser.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 800, deviceScaleFactor: 1, mobile: false,
    }));
    await stage('drawer.second.closed-and-exact-skip-target', () => browser.wait(`!document.querySelector('dialog[open]') &&
      document.activeElement === window.__qaSkip.target`));
  }
