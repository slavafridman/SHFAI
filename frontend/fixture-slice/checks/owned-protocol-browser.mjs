// Small CDP harness using the established management-browser interaction pattern.
// Owned Chrome/profile only; no global process termination or installed packages.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { physicalInput } from './browser-interactions.ts';
import { waitForKeyboardModalReady } from './keyboard-modal.ts';

export async function until(fn, label, timeout = 15000) {
  const end = performance.now() + timeout;
  while (performance.now() < end) {
    const result = await fn();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 30)); // condition polling, not readiness sleep
  }
  throw Error('Timeout: ' + label);
}
export async function ownedProtocolBrowser(origin) {
  const profile = await mkdtemp(join(tmpdir(), 'shf49-browser-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--disable-component-update', 'about:blank',
  ], { stdio: 'ignore' });
  let socket, sequence = 0;
  const pending = new Map(), errors = [], external = [];
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
      pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); },
        reject: error => { clearTimeout(timer); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error('Browser evaluation failed: ' + result.exceptionDetails.text);
    return result.result.value;
  }
  const wait = expression => until(() => evaluate(expression), 'browser condition');
  async function key(key, code = key) {
    const vk = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, Home: 36, End: 35, ArrowDown: 40 }[key] ?? 0;
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk,
      ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  }
  async function activate(selector) {
    await wait(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});
      return !!n && !!n.getClientRects().length && !n.matches(':disabled');})()`);
    await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});
      if(!n || n.matches(':disabled'))throw Error('Missing/disabled control');
      n.scrollIntoView({block:'center'});n.focus({preventScroll:true});})()`);
    await key('Enter');
  }
  async function choose(id, last = false) {
    await activate('#' + id); await wait(`!!document.querySelector('[role="listbox"]')`);
    await key(last ? 'End' : 'Home'); await key('Enter');
    await wait(`!document.querySelector('[role="listbox"]')`);
  }
  async function close() {
    try {
      if (socket?.readyState === WebSocket.OPEN) socket.close();
      for (const p of pending.values()) p.reject(Error('Owned browser closing'));
      pending.clear();
      if (chrome.pid !== undefined && chrome.exitCode === null && chrome.signalCode === null) {
        const exited = once(chrome, 'exit');
        chrome.kill();
        await Promise.race([exited, new Promise((_, reject) => {
          const timer = setTimeout(() => reject(Error('Owned Chrome did not exit')), 5000); timer.unref();
        })]);
      }
    } finally {
      await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
  }
  try {
    await once(chrome, 'spawn'); // installs an error listener before async ENOENT
    const cdp = await until(async () => {
      try {
        const port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
        if (!/^\d+$/.test(port)) return false;
        const url = 'http://127.0.0.1:' + port;
        return (await fetch(url + '/json/version', { signal: AbortSignal.timeout(1000) })).ok && url;
      } catch { return false; }
    }, 'owned Chrome readiness');
    const target = await fetch(cdp + '/json/new?about:blank', { method: 'PUT', signal: AbortSignal.timeout(3000) }).then(r => r.json());
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.onmessage = event => {
      const m = JSON.parse(event.data);
      if (m.id) {
        const p = pending.get(m.id);
        if (p) { pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); }
      } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
      else if (m.method === 'Network.requestWillBeSent' &&
        ![origin + '/', 'data:', 'about:', 'blob:'].some(prefix => m.params.request.url.startsWith(prefix))) external.push('non-local request');
    };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Page.bringToFront');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    return { send, evaluate, wait, key, activate, choose, close,
      input: physicalInput({ send, evaluate, wait }),
      modalReady: () => evaluate(`(${waitForKeyboardModalReady.toString()})(5000)`),
      assertClean() { assert.deepEqual(errors, []); assert.deepEqual(external, []); } };
  } catch (error) { await close(); throw error; }
}
