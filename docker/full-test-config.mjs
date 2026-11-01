import assert from 'node:assert/strict';

export function fullChildEnvironment(environment) {
  // Validate before any application import. No native configuration is forwarded.
  assert.equal(environment.SHF_DEMO_OPT_IN, 'synthetic-full-test');
  assert.equal(environment.NODE_ENV, 'test');
  const expected = {
    SHF_FULL_MODE: environment.SHF_FULL_MODE,
    SHF_FULL_PROFILE: 'test',
    SHF_FULL_DEPLOYMENT_CLASS: 'isolated-test-demo',
    SHF_FULL_SYNTHETIC_ADMINISTRATOR: 'true',
    SHF_FULL_PORT: '4301',
    SHF_FULL_ORIGINS: environment.SHF_FULL_ORIGINS,
    NODE_ENV: 'test',
  };
  assert.ok(['READONLY', 'management', 'cancellation'].includes(expected.SHF_FULL_MODE));
  for (const [key, value] of Object.entries(expected)) assert.equal(environment[key], value);
  assert.equal(environment.NODE_OPTIONS, undefined);
  for (const key of Object.keys(environment))
    if (key.startsWith('SHF_') && key !== 'SHF_DEMO_OPT_IN' && !(key in expected))
      throw Error('Forbidden FULL TEST environment input');
  const origins = JSON.parse(expected.SHF_FULL_ORIGINS);
  assert.ok(Array.isArray(origins) && origins.length === 1);
  const url = new URL(origins[0]);
  assert.equal(url.origin, origins[0]);
  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  return expected;
}
