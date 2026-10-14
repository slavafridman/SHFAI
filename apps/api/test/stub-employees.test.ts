import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('employee stub is scoped, bounded and minimized with exact leading-zero IDs', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    const list = await application.inject({ method: 'GET', url: '/api/v1/employees' });
    assert.equal(list.statusCode, 200);
    assert.equal(list.headers['x-shf-data-source'], 'synthetic-stub');
    const response = JSON.parse(list.body);
    assert.deepEqual(response.items.map((item: { id: string }) => item.id), ['00000001', '00000002', '00000003']);
    assert.ok(!list.body.includes('synthetic-hidden'));
    for (const item of response.items) {
      assert.deepEqual(Object.keys(item).sort(), ['displayName', 'id', 'jobName', 'orgUnit']);
      const detail = await application.inject({ method: 'GET', url: `/api/v1/employees/${item.id}` });
      assert.deepEqual(JSON.parse(detail.body).item, item);
    }
    const exact = await application.inject({ method: 'GET', url: '/api/v1/employees?search=00000002' });
    assert.equal(JSON.parse(exact.body).items.length, 1);
    const english = await application.inject({ method: 'GET', url: '/api/v1/employees?search=demo%20abc' });
    assert.equal(JSON.parse(english.body).items[0].id, '00000003');
    const empty = await application.inject({ method: 'GET', url: '/api/v1/employees?search=no-match' });
    assert.deepEqual(JSON.parse(empty.body).items, []);
    const missing = await application.inject({ method: 'GET', url: '/api/v1/employees/99999999' });
    const foreign = await application.inject({ method: 'GET', url: '/api/v1/employees/00000004' });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
      const denied = await application.inject({ method, url: '/api/v1/employees/00000001', payload: {} });
      assert.equal(denied.statusCode, 404);
    }
  } finally { await application.close(); }
});

test('employee query rejects client scope selectors, oversized search and invalid limits', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    for (const query of ['orgUnitId=synthetic-team-b', 'cursor=x', 'limit=0', 'limit=101', `search=${'x'.repeat(81)}`]) {
      const response = await application.inject({ method: 'GET', url: `/api/v1/employees?${query}` });
      assert.equal(response.statusCode, 400);
      assert.equal(JSON.parse(response.body).synthetic, true);
    }
    const small = await application.inject({ method: 'GET', url: '/api/v1/employees?limit=1' });
    assert.equal(small.statusCode, 503);
  } finally { await application.close(); }
});
