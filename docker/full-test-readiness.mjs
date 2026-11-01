import { registerHooks } from 'node:module';
// Readiness imports the approved application modules in the supervisor too.
// Neither parent nor backend child may load the driver.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'oracledb' || specifier.startsWith('oracledb/'))
      throw Error('Oracle driver prohibited in isolated packaging readiness');
    return next(specifier, context);
  },
});
export async function fullReady(environment) {
  try {
    const { checkFullTestReadiness } = await import('../populated-server.mts');
    const result = await checkFullTestReadiness({
      mode: environment.SHF_FULL_MODE, url: 'http://127.0.0.1:4301',
    }, environment.SHF_FULL_MODE);
    return result.probes.length === 11;
  } catch { return false; }
}
