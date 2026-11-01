import { spawn } from 'node:child_process';
import { createServer, get } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFileSync } from 'node:fs';
import { childEnvironment } from './local-demo-config.mjs';
import { fullChildEnvironment } from './full-test-config.mjs';
import { fullReady } from './full-test-readiness.mjs';

const purposes = Object.freeze(['synthetic-empty-dev', 'synthetic-full-test']);
let imagePurpose;

export function identityReady() {
  return new Promise(resolve => {
    let deadline;
    const finish = value => { clearTimeout(deadline); resolve(value); };
    const request = get('http://127.0.0.1:4301/api/v1/identity', response => {
      let body = '';
      response.on('data', chunk => {
        body += chunk;
        if (Buffer.byteLength(body) > 32768) request.destroy();
      });
      response.on('error', () => finish(false));
      response.on('end', () => {
        try {
          // Immutable image purpose prevents a TEST browser being started as empty DEV
          // (or vice versa). Environment overrides cannot relabel the payload.
          if (imagePurpose !== process.env.SHF_DEMO_OPT_IN)
            throw Error('Image purpose and explicit opt-in mismatch');
          const result = JSON.parse(body), p = result.principal;
          finish(response.statusCode === 200 && result.dataSource === 'isolated-fixture'
            && p.synthetic === true && p.provider === 'synthetic'
            && p.subject === 'synthetic:administrator' && p.employeeId === null
            && JSON.stringify(p.roles) === '["Administrator"]'
            && JSON.stringify(p.resourceScope.orgUnitIds) === '["DEMO"]'
            && p.capabilities.length === 7
            && p.capabilities.every(c => c.endsWith(':read')));
        } catch { finish(false); }
      });
    });
    // Wall-clock budget, not an inactivity timeout that slow chunks can reset.
    deadline = setTimeout(() => request.destroy(), 700);
    request.on('error', () => finish(false));
  });
}

const children = new Map();
let stopping = false, readyServer, forced = false;
function start(name, executable, args, env) {
  const child = spawn(executable, args, { env, stdio: 'inherit' });
  const closed = new Promise(resolve => {
    child.once('error', () => {
      process.stderr.write(`DEMO ${name} spawn failed\n`);
      void shutdown(1);
    });
    child.once('close', (code, signal) => {
      resolve();
      process.stdout.write(`DEMO ${name} reaped code=${code} signal=${signal ?? 'none'}\n`);
      if (!stopping) void shutdown(1);
      else if (signal || code !== 0) process.exitCode = 1;
    });
  });
  children.set(name, { child, closed });
  return child;
}
async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  readyServer?.close();
  readyServer?.closeAllConnections();
  // First stop proxy admission gracefully, then invoke backend stop/drain.
  children.get('nginx')?.child.kill('SIGQUIT');
  children.get('backend')?.child.kill('SIGTERM');
  const deadline = setTimeout(() => {
    forced = true;
    process.exitCode = 1;
    process.stderr.write('DEMO shutdown deadline; forced termination, no rollback claim\n');
    for (const { child } of children.values())
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }, 15000);
  await Promise.all([...children.values()].map(c => c.closed));
  clearTimeout(deadline);
  process.stdout.write(`DEMO supervisor stopped; forced=${forced}\n`);
}
process.once('SIGTERM', () => void shutdown(0));
process.once('SIGINT', () => void shutdown(0));
try {
  // Read the immutable build marker once, before config selection or any spawn.
  // Neither an environment input nor a browser flag can relabel this payload.
  imagePurpose = readFileSync('/app/packaging-scope', 'utf8');
  const selectedPurpose = process.env.SHF_DEMO_OPT_IN;
  if (!purposes.includes(imagePurpose) || !purposes.includes(selectedPurpose)
    || imagePurpose !== selectedPurpose || process.env.NODE_ENV === 'production')
    throw Error('Image purpose and explicit opt-in mismatch');
  const full = selectedPurpose === 'synthetic-full-test';
  const env = full ? fullChildEnvironment(process.env) : childEnvironment(process.env);
  const probe = full ? () => fullReady(env) : identityReady;
  start('backend', '/usr/local/bin/node', [full
    ? '/app/packaging/full-test-backend.mjs' : '/app/packaging/local-demo-backend.mjs'], env);
  const deadline = Date.now() + 10000;
  let ready = false;
  while (!stopping && Date.now() < deadline) {
    if (await probe()) { ready = true; break; }
    await sleep(100);
  }
  if (!ready || stopping) throw Error('Identity readiness failed');
  start('nginx', '/usr/sbin/nginx', ['-e', '/dev/null', '-g', 'daemon off;'], {
    PATH: env.PATH, HOME: env.HOME, LANG: env.LANG,
  });
  readyServer = createServer(async (request, response) => {
    const nginx = children.get('nginx')?.child;
    const ok = request.url === '/readyz' && !stopping && nginx
      && nginx.exitCode === null && nginx.signalCode === null && await probe();
    response.writeHead(ok ? 200 : 503, {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    });
    response.end(JSON.stringify({ ready: Boolean(ok), profile: full ? 'test' : 'dev',
      dataSource: 'isolated-fixture', authentication: 'synthetic',
      ...(full ? { mode: env.SHF_FULL_MODE, clock: 'frozen-demo',
        clockInstant: '2026-11-01T12:00:00.123Z', nativeOracle: false, nativeEMS: false } : {}),
      scope: full ? 'exact mode capabilities; 7 populated inquiries + 4 scoped contexts; no native readiness'
        : 'identity-only; empty demo; no Oracle/EMS/write readiness' }));
  });
  readyServer.requestTimeout = 2000;
  readyServer.headersTimeout = 2000;
  await new Promise((resolve, reject) => {
    readyServer.once('error', reject);
    readyServer.listen(4302, '127.0.0.1', resolve);
  });
  process.stdout.write(full ? 'FULL TEST populated synthetic inquiries ready; frozen clock; volatile; no native writes\n'
    : 'DEMO explicit empty DEV synthetic identity ready; volatile; no native writes\n');
} catch {
  process.stderr.write('DEMO startup rejected\n');
  await shutdown(1);
}
