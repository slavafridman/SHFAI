import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'oracledb' || specifier.startsWith('oracledb/'))
      throw Error('Oracle driver prohibited in FULL TEST');
    return next(specifier, context);
  },
});
let server, stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try {
    if (server) {
      const { stopBackendServer } = await import('../server.mts');
      await stopBackendServer(server);
    }
    process.stdout.write('FULL TEST backend drained\n');
  } catch { process.exitCode = 1; }
}
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
try {
  const { fullOptionsFromEnvironment } = await import('../populated-config.mts');
  const selected = fullOptionsFromEnvironment(process.env);
  const { startFullTestEnvironment, checkFullTestReadiness } = await import('../populated-server.mts');
  const started = await startFullTestEnvironment(selected.mode, selected.options);
  server = started.server;
  const readiness = await checkFullTestReadiness(started, selected.mode);
  console.log(JSON.stringify({ ...started.metadata, mode: selected.mode,
    inquiryProbes: readiness.probes, nativeOracle: false, nativeEMS: false }));
  if (stopping) {
    const { stopBackendServer } = await import('../server.mts');
    await stopBackendServer(server);
  }
} catch {
  process.stderr.write('FULL TEST backend startup rejected\n');
  process.exitCode = 1;
  if (server) {
    const { stopBackendServer } = await import('../server.mts');
    await stopBackendServer(server);
  }
}
