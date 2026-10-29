// Isolate the historical unhandled spawn error so a red test cannot crash the
// runner or strand its owned TEMP profile. Never start or alter installed Chrome.
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { once } from 'node:events';
import { access, rm } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

if (process.argv.includes('--missing-chrome-worker')) {
  const originalSpawn = childProcess.spawn;
  let profile;
  childProcess.spawn = (_executable, args, options) => {
    profile = args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length);
    process.send({ profile });
    // Guaranteed absent inside this just-created profile; real spawn emits ENOENT.
    return originalSpawn(join(profile, 'nonexistent-chrome.exe'), args, options);
  };
  syncBuiltinESMExports();
  const { ownedProtocolBrowser } = await import('./owned-protocol-browser.mjs');
  await assert.rejects(ownedProtocolBrowser('http://127.0.0.1:1'), { code: 'ENOENT' });
  assert(profile);
  await assert.rejects(access(profile), { code: 'ENOENT' });
  process.disconnect();
} else {
  test('missing Chrome rejects ENOENT and removes its owned profile without CDP', { timeout: 10000 }, async () => {
    let profile, stderr = '';
    const worker = childProcess.fork(fileURLToPath(import.meta.url), ['--missing-chrome-worker'],
      { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    worker.on('message', message => { profile = message.profile; });
    worker.stderr.on('data', chunk => { stderr += chunk; });
    const exited = once(worker, 'exit');
    const timer = setTimeout(() => worker.kill(), 8000);
    try {
      const [code, signal] = await exited;
      assert.equal(signal, null, 'worker must exit naturally');
      assert.equal(code, 0, stderr);
      assert(profile, 'spawn stub captured owned profile');
      await assert.rejects(access(profile), { code: 'ENOENT' });
    } finally {
      clearTimeout(timer);
      // Red/prior behavior may crash before helper cleanup; parent owns recovery.
      if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
  });
}
