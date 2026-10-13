import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('stub mode is opt-in, rejects malformed mode and cannot coexist with Oracle', async () => {
  await assert.rejects(createApplication({ SHF_STUB_API: 'yes' }), /must be true or false/);
  for (const enabled of ['true', 'invalid', '']) {
    await assert.rejects(createApplication({ SHF_STUB_API: 'true', ORACLE_ENABLED: enabled }), /cannot be enabled together/);
  }
});

test('synthetic HTTP reads are labelled, bounded, scoped and read-only', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    const me = await application.inject({ method: 'GET', url: '/api/v1/me' });
    assert.equal(me.statusCode, 200);
    assert.equal(me.headers['cache-control'], 'no-store');
    assert.equal(me.headers['x-shf-data-source'], 'synthetic-stub');
    const identity = JSON.parse(me.body);
    assert.equal(identity.synthetic, true);
    assert.equal(identity.authenticated, false);
    assert.equal(identity.mode, 'stub');
    assert.equal(identity.employeeId, '00000001');

    const capabilities = await application.inject({ method: 'GET', url: '/api/v1/me/capabilities' });
    const capability = JSON.parse(capabilities.body);
    assert.equal(capability.personalShifts.read.enabled, true);
    assert.equal(capability.personalShifts.write.enabled, false);
    assert.equal(capability.integrationAvailable, false);

    const list = await application.inject({
      method: 'GET', url: '/api/v1/me/shifts?from=2026-10-14&toExclusive=2026-10-18',
      headers: { 'x-employee-id': '00000002' },
    });
    assert.equal(list.statusCode, 200);
    const result = JSON.parse(list.body);
    assert.equal(result.synthetic, true);
    assert.equal(result.nextCursor, null);
    assert.deepEqual(result.items.map((item: { id: string }) => item.id), [
      '9007199254740995', '9007199254740994', '9007199254740993',
    ]);
    assert.ok(!list.body.includes('00000002'));
    assert.equal(result.items[0].baseline, null);
    assert.equal(result.items[0].baselineAvailability, 'not-authorized');
    assert.equal(result.items[1].effective.split.enabled, true);
    assert.equal(result.items[1].effective.workFromHome, true);

    const detail = await application.inject({ method: 'GET', url: '/api/v1/shifts/9007199254740993' });
    assert.equal(detail.statusCode, 200);
    assert.equal(JSON.parse(detail.body).item.id, '9007199254740993');

    const empty = await application.inject({
      method: 'GET', url: '/api/v1/me/shifts?from=2026-11-01&toExclusive=2026-11-02',
    });
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(JSON.parse(empty.body).items, []);

    for (const url of [
      '/api/v1/me/shifts?from=2026-02-30&toExclusive=2026-03-01',
      '/api/v1/me/shifts?from=2026-10-14&toExclusive=2026-10-18&employeeId=00000002',
      '/api/v1/shifts/not-an-id',
    ]) {
      const response = await application.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 400);
      assert.ok(response.headers['content-type']?.includes('application/problem+json'));
      assert.equal(response.headers['x-shf-data-source'], 'synthetic-stub');
      assert.equal(JSON.parse(response.body).synthetic, true);
    }
    for (const url of [
      '/api/v1/me/shifts?from=2026-10-14&toExclusive=2026-10-18&limit=1',
      '/api/v1/me/shifts?from=2026-10-14&toExclusive=2026-10-18&cursor=stub',
    ]) {
      const response = await application.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 503);
      assert.ok(response.headers['content-type']?.includes('application/problem+json'));
    }
    const unavailable = [];
    for (const id of ['9007199254740996', '9007199254740997', '42']) {
      const response = await application.inject({ method: 'GET', url: `/api/v1/shifts/${id}` });
      assert.equal(response.statusCode, 404);
      unavailable.push(response.body);
    }
    assert.equal(new Set(unavailable).size, 1);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const response = await application.inject({
        method, url: '/api/v1/shifts/9007199254740993', payload: {},
      });
      assert.equal(response.statusCode, 404);
    }
    const after = await application.inject({ method: 'GET', url: '/api/v1/shifts/9007199254740993' });
    assert.deepEqual(JSON.parse(after.body).item, JSON.parse(detail.body).item);
  } finally {
    await application.close();
  }
});
