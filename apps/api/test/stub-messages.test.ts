import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('stub message list/detail preserve recipient privacy, read flags and safe text without mutations', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    const list = await application.inject({ method: 'GET', url: '/api/v1/me/messages' });
    assert.equal(list.statusCode, 200);
    assert.equal(list.headers['x-shf-data-source'], 'synthetic-stub');
    assert.equal(list.headers['cache-control'], 'no-store');
    const response = JSON.parse(list.body);
    assert.equal(response.synthetic, true);
    assert.deepEqual(response.items.map((item: { id: string }) => item.id), [
      '8007199254740993', '8007199254740994', '8007199254740995',
    ]);
    assert.ok(!list.body.includes('synthetic-hidden'));
    assert.ok(!list.body.includes('employeeId'));
    for (const [status, expected] of [['unread', false], ['read', true], ['unknown', null]] as const) {
      const filtered = await application.inject({ method: 'GET', url: `/api/v1/me/messages?status=${status}` });
      assert.equal(filtered.statusCode, 200);
      const items = JSON.parse(filtered.body).items;
      assert.equal(items.length, 1);
      assert.equal(items[0].isRead, expected);
      const detail = await application.inject({ method: 'GET', url: `/api/v1/me/messages/${items[0].id}` });
      assert.deepEqual(JSON.parse(detail.body).item, items[0]);
    }
    const after = await application.inject({ method: 'GET', url: '/api/v1/me/messages' });
    assert.deepEqual(JSON.parse(after.body).items, response.items);
    const missingBodies = [];
    for (const id of ['8007199254740996', '8007199254740997', '42']) {
      const denied = await application.inject({ method: 'GET', url: `/api/v1/me/messages/${id}` });
      assert.equal(denied.statusCode, 404);
      missingBodies.push(denied.body);
    }
    assert.equal(new Set(missingBodies).size, 1);
    for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
      for (const suffix of ['', '/read', '/deletion', '/acceptance']) {
        const denied = await application.inject({ method, url: `/api/v1/me/messages/8007199254740993${suffix}`, payload: {} });
        assert.equal(denied.statusCode, 404);
      }
    }
    const text = await application.inject({ method: 'GET', url: '/api/v1/me/messages/8007199254740995' });
    assert.ok(JSON.parse(text.body).item.text.startsWith('<img'));
  } finally {
    await application.close();
  }
});

test('stub message query rejects selectors, malformed limits and unsupported pagination', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    for (const query of ['status=bad', 'limit=0', 'limit=101', 'limit=1.5', 'employeeId=00000002', 'cursor=anything']) {
      const response = await application.inject({ method: 'GET', url: `/api/v1/me/messages?${query}` });
      assert.equal(response.statusCode, 400);
      assert.equal(JSON.parse(response.body).code, 'INVALID_QUERY');
    }
    const small = await application.inject({ method: 'GET', url: '/api/v1/me/messages?limit=1' });
    assert.equal(small.statusCode, 503);
    assert.equal(JSON.parse(small.body).code, 'STUB_PAGINATION_UNAVAILABLE');
  } finally {
    await application.close();
  }
});
