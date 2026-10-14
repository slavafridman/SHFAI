import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { DEMO_PARAMETER_CODES, isDemoParameterValue, resolveDemoParameter } from '../src/stub/system-parameter-contracts.js';
import { syntheticSystemParameters } from '../src/stub/system-parameter-fixtures.js';

test('parameter resolution uses null-only fallback, preserves zero/decimal/precision and rejects invalid raw values', () => {
  assert.deepEqual(resolveDemoParameter('0', '5'), { effectiveValue: '0', resolution: 'unit' });
  assert.deepEqual(resolveDemoParameter(null, '11.50'), { effectiveValue: '11.50', resolution: 'default' });
  assert.deepEqual(resolveDemoParameter(null, null), { effectiveValue: null, resolution: 'unknown' });
  assert.equal(resolveDemoParameter('9007199254740993.00', null).effectiveValue, '9007199254740993.00');
  assert.equal(resolveDemoParameter(null, '0011.50').effectiveValue, '0011.50');
  assert.equal(isDemoParameterValue(0), false);
  for (const value of ['', ' ', '-1', 'false', '1e3', '1.', '1.1234567890', '1'.repeat(39)]) {
    assert.equal(isDemoParameterValue(value), false);
    assert.throws(() => resolveDemoParameter(value, '5'), RangeError);
    assert.throws(() => resolveDemoParameter('0', value), RangeError);
  }
});

test('parameter reads preserve scoped allowlist, raw/default/effective provenance and immutable fixtures', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const before = syntheticSystemParameters();
    const response = await app.inject({ method: 'GET', url: '/api/v1/system-parameters' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-shf-data-source'], 'synthetic-stub');
    const body = JSON.parse(response.body);
    assert.equal(body.synthetic, true);
    assert.equal(body.authenticated, false);
    assert.equal(body.sourceVersion, 'synthetic-parameter-catalog-1');
    assert.deepEqual(body.items.map((item: { code: string }) => item.code), [...DEMO_PARAMETER_CODES]);
    assert.deepEqual(body.items.map((item: { effectiveValue: string | null }) => item.effectiveValue), ['0', '11.50', null]);
    assert.deepEqual(body.items.map((item: { resolution: string }) => item.resolution), ['unit', 'default', 'unknown']);
    assert.deepEqual(body.items.map((item: { unitValue: string | null }) => item.unitValue), ['0', null, null]);
    assert.ok(!response.body.includes('synthetic-hidden'));
    assert.ok(!response.body.includes('modificationUser'));
    for (const item of body.items) {
      assert.equal(item.measurement, 'unverified');
      const detail = await app.inject({ method: 'GET', url: `/api/v1/system-parameters/${item.code}` });
      assert.deepEqual(JSON.parse(detail.body).item, item);
    }
    const forbidden = await app.inject({ method: 'GET', url: '/api/v1/system-parameters/shf.param.poolEnabled' });
    const missing = await app.inject({ method: 'GET', url: '/api/v1/system-parameters/absent' });
    assert.equal(forbidden.statusCode, 404);
    assert.equal(forbidden.body, missing.body);
    assert.deepEqual(syntheticSystemParameters(), before);
  } finally { await app.close(); }
});

test('parameter query is bounded code/name search; no hierarchy/default overrides or flag discovery are accepted', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const search = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/system-parameters?search=%20DIFFERENCE%20' })).body);
    assert.equal(search.search, 'difference');
    assert.equal(search.items[0].code, 'shf.param.differenceBetweenShifts');
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/system-parameters?search=pool' })).body).items.length, 0);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/system-parameters?limit=1' })).statusCode, 503);
    for (const query of ['limit=0', 'limit=101', 'limit=1.5', 'limit=1&limit=2', 'search=a&search=b',
      'unitId=foreign', 'agaf=foreign', 'useDefault=false', 'cursor=next', `search=${'a'.repeat(81)}`]) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/system-parameters?${query}` })).statusCode, 400);
    }
    for (const code of ['shf.param.lockEmployees', 'shf.param.managedBreakEnabled', 'shf.param.poolEnabled', 'shf.param.iwdDefaultTimeToComplete']) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/system-parameters/${code}` })).statusCode, 404);
    }
    for (const path of ['123', '%20', 'x'.repeat(81), `${DEMO_PARAMETER_CODES[0]}?unitId=foreign`]) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/system-parameters/${path}` })).statusCode, 400);
    }
  } finally { await app.close(); }
});

test('parameter capability is read-only and no edit/reload/apply or real-mode routes exist', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  const real = await createApplication({});
  try {
    await app.init(); await real.init();
    const capability = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me/capabilities' })).body);
    assert.equal(capability.systemParameters.read.enabled, true);
    assert.equal(capability.systemParameters.write.enabled, false);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      assert.equal((await app.inject({ method, url: `/api/v1/system-parameters/${DEMO_PARAMETER_CODES[0]}`, payload: {} })).statusCode, 404);
    }
    for (const path of ['/api/v1/system-parameters', '/api/v1/system-parameters/reload', '/api/v1/system-parameters/apply']) {
      assert.equal((await app.inject({ method: 'POST', url: path, payload: {} })).statusCode, 404);
    }
    assert.equal((await real.inject({ method: 'GET', url: '/api/v1/system-parameters' })).statusCode, 404);
  } finally { await app.close(); await real.close(); }
});
