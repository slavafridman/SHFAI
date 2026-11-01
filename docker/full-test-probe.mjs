// Packaging-only stdin harness; NOT copied into the image/runtime context.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fullChildEnvironment } from '/app/packaging/full-test-config.mjs';

const origin = 'http://127.0.0.1:18080';
const envFor = mode => ({
  NODE_ENV: 'test', SHF_DEMO_OPT_IN: 'synthetic-full-test', SHF_FULL_MODE: mode,
  SHF_FULL_PROFILE: 'test', SHF_FULL_DEPLOYMENT_CLASS: 'isolated-test-demo',
  SHF_FULL_SYNTHETIC_ADMINISTRATOR: 'true', SHF_FULL_PORT: '4301',
  SHF_FULL_ORIGINS: JSON.stringify([origin]),
});
assert.equal(process.getuid(), 101);
assert.equal(process.version, 'v24.21.0');
assert.equal(readFileSync('/app/packaging-scope', 'utf8'), 'synthetic-full-test');
assert.deepEqual(Object.keys(JSON.parse(readFileSync('/app/package.json')) .dependencies), ['oracledb']);
assert.deepEqual(readdirSync('/app/node_modules').filter(n => !n.startsWith('.')), ['oracledb']);
assert.equal(JSON.parse(readFileSync('/app/node_modules/oracledb/package.json')).version, '26.0.0');
assert.equal(existsSync('/app/test'), false);
assert.equal(existsSync('/usr/local/bin/npm'), false);
assert.equal(existsSync('/opt/oracle'), false);
assert.ok(!readFileSync('/proc/net/route', 'utf8').split('\n').slice(1)
  .some(line => line.trim().split(/\s+/)[1] === '00000000'));
assert.equal(readdirSync('/usr/share/nginx/html').some(n => n.endsWith('.map')), false);
for (const mode of ['READONLY', 'management', 'cancellation']) fullChildEnvironment(envFor(mode));
const invalid = [
  {}, { ...envFor('READONLY'), NODE_ENV: 'production' },
  { ...envFor('READONLY'), SHF_FULL_PROFILE: 'production' },
  { ...envFor('READONLY'), SHF_FULL_SYNTHETIC_ADMINISTRATOR: 'false' },
  { ...envFor('all') }, { ...envFor('READONLY'), SHF_DEMO_OPT_IN: 'synthetic-empty-dev' },
  ...['SHF_ORACLE_CONFIG', 'SHF_NATIVE_COMMAND_COORDINATOR_CONFIG', 'NODE_OPTIONS',
    'SHF_FIXTURE_ROWS', 'SHF_NATIVE_CONFIG'].map(k => ({ ...envFor('READONLY'), [k]: '{}' })),
];
for (const env of invalid) assert.throws(() => fullChildEnvironment(env));
console.log(`PASS pre-import gates=${invalid.length}; three valid exclusive modes; UID101/runtime dependencies only/no maps`);

async function childRun(env, action) {
  const child = spawn(process.execPath, ['/app/packaging/local-demo-supervisor.mjs'],
    { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', d => { logs += d; process.stdout.write(d); });
  child.stderr.on('data', d => { logs += d; process.stderr.write(d); });
  const closed = once(child, 'close');
  const deadline = setTimeout(() => child.kill('SIGTERM'), 30000);
  try {
    if (!action) {
      const [code] = await closed;
      assert.equal(code, 1, logs);
      assert.ok(!logs.includes('inquiries ready'));
      return;
    }
    await action(child);
    child.kill('SIGTERM');
    const [code, signal] = await closed;
    assert.equal(signal, null, logs);
    assert.equal(code, 0, logs);
    assert.ok(logs.includes('FULL TEST backend drained'));
    assert.ok(logs.includes('forced=false'));
  } finally {
    clearTimeout(deadline);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM'); await closed;
    }
  }
}
for (const env of [invalid[0], invalid[1], invalid[6], invalid[7],
  { NODE_ENV: 'development', SHF_APP_ENV: 'dev', SHF_DEMO_OPT_IN: 'synthetic-empty-dev' }])
  await childRun(env);
async function json(path, status = 200, options) {
  const r = await fetch('http://127.0.0.1:8080' + path, {
    ...options, signal: AbortSignal.timeout(2500),
  });
  const b = await r.json();
  assert.equal(r.status, status, JSON.stringify(b));
  assert.equal(r.headers.get('cache-control'), 'no-store');
  return b;
}
const post = (path, body, status = 200, suppliedOrigin = origin) => json(path, status, {
  method: 'POST', headers: { origin: suppliedOrigin, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
for (const mode of ['READONLY', 'management', 'cancellation']) {
  await childRun(envFor(mode), async child => {
    let ready;
    for (let i = 0; i < 100; i++) {
      assert.equal(child.exitCode, null);
      try { ready = await json('/readyz'); if (ready.ready) break; } catch {}
      await sleep(100);
    }
    assert.equal(ready?.ready, true);
    assert.equal(ready.mode, mode);
    assert.equal(ready.profile, 'test');
    assert.equal(ready.nativeOracle, false);
    assert.equal(ready.nativeEMS, false);
    const identity = await json('/api/v1/identity');
    assert.equal(identity.principal.capabilities.length, mode === 'READONLY' ? 7 : mode === 'management' ? 14 : 9);
    // Import only the approved top-level world path helper, never test code.
    const { fullInquiryPaths } = await import('/app/populated-world.mts');
    for (const path of fullInquiryPaths(mode)) {
      const result = await json(path);
      // Some public contexts carry source metadata in nested context objects.
      // Use the existing application readiness check, not an invented flat DTO.
      assert.ok(JSON.stringify(result).includes('"dataSource":"isolated-fixture"'), path);
    }
    assert.equal((await fetch('http://127.0.0.1:8080/')).status, 200);
    if (mode === 'READONLY') assert.ok(identity.principal.capabilities.every(c => c.endsWith(':read')));
    if (mode === 'management') {
      const base = '/api/v1/employees/1/shift-management';
      const draft = { kind: 'change', shiftDayId: '19003', startLocal: '2026-11-04T09:00:00',
        endLocal: '2026-11-04T10:30:00', activityCode: '1', workLocation: 'site',
        startReasonCode: null, endReasonCode: '1' };
      await post(base + '/preparations', { draft }, 403, 'http://127.0.0.1:18081');
      const p = await post(base + '/preparations', { draft });
      const receipt = await post(base + '/commands', {
        commandId: '00000000-0000-4000-8000-000000000001', draft,
        validationToken: p.validationToken, fingerprint: p.fingerprint,
        operationConfirmation: { accepted: true },
        acknowledgedWarningCodes: [...new Set(p.effects.flatMap(e => e.warningCodes))],
      });
      assert.equal(receipt.outcome, 'fixture-committed');
      assert.equal(receipt.partnerCompletion, 'not-invoked');
      assert.ok(JSON.stringify(await json('/api/v1/employees/1/shift-days/19003')).includes('2026-11-04T10:30:00'));
    }
    if (mode === 'cancellation') {
      const base = '/api/v1/employees/9001/shift-days/6201/station-exit-cancellation';
      const detail = '/api/v1/employees/9001/shift-days/6201';
      assert.notEqual((await json(detail)).attendance.stationExitLocal, null);
      await post(base + '/validations', {}, 403, 'http://127.0.0.1:18081');
      const p = await post(base + '/validations', {});
      const command = { commandId: '00000000-0000-4000-8000-000000000002', draft: {},
        validationToken: p.validationToken, fingerprint: p.fingerprint,
        warningConfirmation: { accepted: true, code: 'RECORDED_EXIT_WILL_BE_CLEARED' },
        operationConfirmation: { accepted: true } };
      const receipt = await post(base + '/commands', command);
      assert.equal(receipt.outcome, 'simulated');
      assert.equal(receipt.partnerCompletion, 'not-invoked');
      assert.equal(receipt.commitAcknowledgedAt, null);
      assert.equal((await json(detail)).attendance.stationExitLocal, null);
      await post(base + '/commands', command, 403);
    }
    console.log(`PASS ${mode}: real proxy identity + 7 populated inquiries + 4 scoped contexts; exact capabilities; fixture transaction/readback where enabled`);
  });
}
console.log('PASS network-none image packaging; three exclusive processes; graceful lifecycle; no service deployment/native readiness claim');
