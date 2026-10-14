import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { syntheticBuildings } from '../src/stub/building-fixtures.js';

test('building list/detail preserve fixed scope, nullable capacity, literal addresses and read immutability', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const before = syntheticBuildings();
    const list = await app.inject({ method: 'GET', url: '/api/v1/buildings' });
    assert.equal(list.statusCode, 200);
    assert.equal(list.headers['cache-control'], 'no-store');
    assert.equal(list.headers['x-shf-data-source'], 'synthetic-stub');
    const body = JSON.parse(list.body);
    assert.equal(body.synthetic, true);
    assert.equal(body.authenticated, false);
    assert.equal(body.items.length, 3);
    assert.equal(body.items[1].seatCapacity, 0);
    assert.equal(body.items[2].seatCapacity, null);
    assert.ok(!list.body.includes('synthetic-hidden'));
    for (const item of body.items) {
      const detail = await app.inject({ method: 'GET', url: `/api/v1/buildings/${item.id}` });
      assert.deepEqual(JSON.parse(detail.body).item, item);
    }
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/buildings/94000004' });
    const absent = await app.inject({ method: 'GET', url: '/api/v1/buildings/94000099' });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, absent.body);
    assert.deepEqual(syntheticBuildings(), before);
  } finally { await app.close(); }
});

test('building filters are bounded and exact with explicit empty, invalid and insufficient-limit outcomes', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const search = await app.inject({ method: 'GET', url: '/api/v1/buildings?search=%20DEMO%20' });
    assert.equal(JSON.parse(search.body).search, 'demo');
    assert.equal(JSON.parse(search.body).items[0].id, '94000003');
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/buildings?search=absent' })).body).items.length, 0);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/buildings?limit=1' })).statusCode, 503);
    for (const query of ['limit=0', 'limit=101', 'limit=1.5', 'limit=1&limit=2', 'unitId=foreign', 'cursor=next', `search=${'a'.repeat(81)}`]) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/buildings?${query}` })).statusCode, 400);
    }
    for (const path of ['0', '01', '-1', 'invalid', '94000001?unitId=foreign']) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/buildings/${path}` })).statusCode, 400);
    }
  } finally { await app.close(); }
});

test('building capability is read-only; mutations are absent and disabled real mode serves no building route', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  const real = await createApplication({});
  try {
    await app.init(); await real.init();
    const capability = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me/capabilities' })).body);
    assert.equal(capability.buildings.read.enabled, true);
    assert.equal(capability.buildings.write.enabled, false);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      assert.equal((await app.inject({ method, url: '/api/v1/buildings/94000001', payload: {} })).statusCode, 404);
    }
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/buildings', payload: {} })).statusCode, 404);
    assert.equal((await real.inject({ method: 'GET', url: '/api/v1/buildings' })).statusCode, 404);
  } finally { await app.close(); await real.close(); }
});
