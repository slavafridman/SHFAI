import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const expectedConfig = Object.freeze({
  deploymentClass: 'local-development', authenticationMode: 'synthetic',
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ['DEMO'],
  dataSource: 'isolated-fixture', businessTimeZone: 'UTC',
  attendanceStageArrivalMode: 'disabled',
});
export function childEnvironment(environment) {
  // Explicit command, not authentication fallback. Reject forbidden input before
  // importing the application, opening sockets, factories or reading its config.
  assert.equal(environment.SHF_DEMO_OPT_IN, 'synthetic-empty-dev');
  assert.equal(environment.SHF_APP_ENV, 'dev');
  assert.equal(environment.NODE_ENV, 'development');
  assert.equal(environment.NODE_OPTIONS, undefined);
  for (const key of Object.keys(environment)) {
    if (key.startsWith('SHF_') && !['SHF_DEMO_OPT_IN', 'SHF_APP_ENV'].includes(key))
      throw Error('Forbidden demo environment input');
  }
  const raw = readFileSync('/app/config-examples/dev.example.json', 'utf8');
  assert.deepEqual(JSON.parse(raw), expectedConfig);
  return {
    PATH: '/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', HOME: '/tmp',
    LANG: 'C.UTF-8', NODE_ENV: 'development', SHF_APP_ENV: 'dev',
    SHF_FIXTURE_CONFIG: raw, SHF_FIXTURE_PORT: '4301', SHF_FIXTURE_ROWS: '[]',
  };
}
