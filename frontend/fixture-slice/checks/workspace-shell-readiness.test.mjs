import assert from 'node:assert/strict';
import test from 'node:test';
import { currentShiftsErrorReady, waitForCurrentShiftsErrorReady, checkMobileDrawer,
  drawerCloseReady, armDrawerClose, namedDrawerStage, drawerTraceInstaller } from './workspace-shell-readiness.mjs';

test('H1/error render alone cannot authorize keyboard before scheduled error focus', () => {
  const error = {};
  const results = { getAttribute: () => 'false', querySelector: () => null };
  const document = { readyState: 'complete', activeElement: {},
    querySelector: selector => selector === '#list-error' ? error : results };
  const ready = () => Function('document', `return ${currentShiftsErrorReady}`)(document);
  assert.equal(ready(), false);
  document.activeElement = error;
  assert.equal(ready(), true);
  document.readyState = 'interactive';
  assert.equal(ready(), false);
  document.readyState = 'complete';
  results.getAttribute = () => 'true';
  assert.equal(ready(), false);
  results.getAttribute = () => 'false';
  results.querySelector = () => ({});
  assert.equal(ready(), false);
});

test('bounded final-state observation precedes microtask/paint and a non-retrying recheck', async () => {
  const calls = [];
  await waitForCurrentShiftsErrorReady({
    wait: async expression => calls.push(['wait', expression]),
    evaluate: async expression => { calls.push(['evaluate', expression]); return true; },
  });
  assert.deepEqual(calls.map(([kind]) => kind), ['wait', 'evaluate', 'evaluate']);
  assert.equal(calls[0][1], currentShiftsErrorReady);
  assert.match(calls[1][1], /queueMicrotask.*requestAnimationFrame.*requestAnimationFrame/);
  assert.equal(calls[2][1], currentShiftsErrorReady);
});

test('state/focus change across paint fails explicitly instead of retrying or forcing focus', async () => {
  let evaluations = 0;
  await assert.rejects(waitForCurrentShiftsErrorReady({
    wait: async () => {},
    evaluate: async () => ++evaluations === 1,
  }), /readiness changed/);
  assert.equal(evaluations, 2);
});

test('closed DOM/exact opener alone is not completed native close lifecycle', () => {
  const opener = {getAttribute: () => 'false'};
  const document = {activeElement: opener,
    querySelector: selector => selector === '#menu-open' ? opener : null};
  const window = {__qaDrawerClose: {complete: false, reopened: false}};
  const ready = () => Function('document', 'window', `return ${drawerCloseReady}`)(document, window);
  assert.equal(ready(), false);
  window.__qaDrawerClose.complete = true;
  assert.equal(ready(), true);
  opener.getAttribute = () => 'true';
  assert.equal(ready(), false);
  opener.getAttribute = () => 'false';
  document.activeElement = {};
  assert.equal(ready(), false);
  window.__qaDrawerClose.reopened = true;
  assert.throws(ready, /reopened before prior native close/);
});

test('close observation is armed once before Escape, does not close or focus', () => {
  let listener, options;
  const dialog = {open: true, addEventListener: (type, fn, opts) => {
    assert.equal(type, 'close'); listener = fn; options = opts;
  }};
  const window = {};
  Function('document', 'window', armDrawerClose)({querySelector: () => dialog}, window);
  assert.deepEqual(options, {once: true});
  assert.deepEqual(window.__qaDrawerClose, {complete: false, reopened: false});
  dialog.open = false;
  listener();
  assert.deepEqual(window.__qaDrawerClose, {complete: true, reopened: false});
  assert.throws(() => Function('document', 'window', armDrawerClose)(
    {querySelector: () => dialog}, window), /without open drawer/);
});

function drawerDouble(failAt) {
  const stages = [], calls = [];
  const browser = Object.fromEntries(['activate', 'wait', 'modalReady', 'evaluate', 'key', 'send']
    .map(method => [method, async (...args) => {calls.push([method, ...args]);}]));
  const stage = async (label, action) => {
    stages.push(label);
    if (label === failAt) throw Error('negative: ' + label);
    return action();
  };
  return {browser, stage, stages, calls};
}

test('both opens require modal readiness; native close completes before second activation/resize', async () => {
  const proof = drawerDouble();
  await checkMobileDrawer(proof.browser, proof.stage);
  assert.deepEqual(proof.stages, [
    'drawer.first.activate', 'drawer.first.open', 'drawer.first.keyboard-modal-ready',
    'drawer.first.arm-native-close-completion', 'drawer.first.Escape',
    'drawer.first.closed-and-exact-opener', 'drawer.first.native-close-complete',
    'drawer.second.activate', 'drawer.second.open', 'drawer.second.keyboard-modal-ready',
    'drawer.second.menu-state-ready', 'drawer.second.resize-desktop',
    'drawer.second.closed-and-exact-skip-target',
  ]);
  assert.equal(proof.calls.filter(([method]) => method === 'modalReady').length, 2);
  assert.equal(proof.calls.find(([method]) => method === 'evaluate')[1], armDrawerClose);
  assert(proof.calls.some(([method, expression]) => method === 'wait' && expression === drawerCloseReady));
  assert.match(proof.calls.at(-1)[1], /!document.querySelector\('dialog\[open\]'\).*document.activeElement === window.__qaSkip.target/s);
});

for (const failed of ['drawer.first.native-close-complete', 'drawer.second.keyboard-modal-ready',
  'drawer.second.menu-state-ready']) {
  test(`failed ${failed} prevents resize, without retries/recovery focus`, async () => {
    const proof = drawerDouble(failed);
    await assert.rejects(checkMobileDrawer(proof.browser, proof.stage), new RegExp(failed));
    assert(!proof.calls.some(([method]) => method === 'send'));
    assert.equal(proof.stages.filter(stage => stage === failed).length, 1);
  });
}

test('named stage retains original cause and emits only whitelisted diagnostic', async () => {
  const original = Error('bounded wait expired');
  const calls = [];
  const browser = {evaluate: async expression => {
    calls.push(expression); return {snapshot: {width: 360}, events: []};
  }};
  await assert.rejects(namedDrawerStage(browser, 'drawer.second.closed-and-exact-skip-target',
    async () => {throw original;}), error =>
      error.cause === original && error.message.startsWith('drawer.second.closed-and-exact-skip-target:'));
  assert.equal(calls.length, 2);
  assert.doesNotMatch(drawerTraceInstaller, /textContent|value\b|ng\.|principal|capabilities|history|fetch/);
  assert.match(drawerTraceInstaller, /min-width: 761px/);
});
