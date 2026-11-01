import { registerHooks } from 'node:module';
// Packaging tripwire: isolated demo cannot import the Oracle driver even if a
// future application branch accidentally attempts to. Not a substitute for gates.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'oracledb' || specifier.startsWith('oracledb/'))
      throw Error('Oracle driver prohibited in local demo');
    return next(specifier, context);
  },
});
let server;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try {
    if (server) {
      const { stopBackendServer } = await import('../server.mts');
      await stopBackendServer(server);
    }
    process.stdout.write('DEMO backend drained\n');
  } catch {
    process.stderr.write('DEMO backend drain failed\n');
    process.exitCode = 1;
  }
}
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
try {
  const { startFromEnvironment } = await import('../server.mts');
  const forbidden = async () => { throw Error('Oracle factory prohibited'); };
  server = await startFromEnvironment(process.env, undefined, {
    read: forbidden, native: forbidden, resolveEndpoint: forbidden,
  });
  if (stopping) {
    const { stopBackendServer } = await import('../server.mts');
    await stopBackendServer(server);
  }
} catch {
  process.stderr.write('DEMO backend startup rejected\n');
  process.exitCode = 1;
}
