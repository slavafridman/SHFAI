import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('staffing reads cover all three kinds with exact capacity, unknown/stale facts and no workflow changes', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const first = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests' });
    assert.equal(first.statusCode, 200);
    assert.equal(first.headers['cache-control'], 'no-store');
    const body = JSON.parse(first.body);
    assert.equal(body.synthetic, true);
    assert.equal(body.items.length, 6);
    assert.ok(!first.body.includes('synthetic-hidden'));
    for (const [kind, count] of [['reinforcement', 2], ['time-change', 2], ['reduction', 2]] as const) {
      const filtered = await app.inject({ method: 'GET', url: `/api/v1/staffing-requests?kind=${kind}` });
      assert.equal(JSON.parse(filtered.body).items.length, count);
    }
    for (const id of ['93000001', '93000002', '93000003', '93000004', '93000005', '93000007']) {
      const detail = await app.inject({ method: 'GET', url: `/api/v1/staffing-requests/${id}` });
      assert.equal(detail.statusCode, 200);
      assert.deepEqual(JSON.parse(detail.body).item, body.items.find((item: { id: string }) => item.id === id));
      const candidates = await app.inject({ method: 'GET', url: `/api/v1/staffing-requests/${id}/candidates` });
      assert.equal(candidates.statusCode, 200);
      assert.equal(JSON.parse(candidates.body).requestId, id);
      assert.ok(!candidates.body.includes('00000004'));
      if (id === '93000003') { assert.deepEqual(JSON.parse(candidates.body).items, []); }
      if (id === '93000004') {
        assert.equal(JSON.parse(detail.body).item.remaining, null);
        assert.equal(JSON.parse(candidates.body).items[0].freshness, 'unknown');
      }
      if (id === '93000002') {
        assert.equal(JSON.parse(detail.body).item.remaining, 0);
        assert.equal(JSON.parse(detail.body).item.deadlineState, 'elapsed');
      }
    }
    for (const suffix of ['', '/candidates', '/applications', '/assignments', '/approvals', '/cancellations']) {
      for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
        assert.equal((await app.inject({ method, url: '/api/v1/staffing-requests/93000001' + suffix, payload: {} })).statusCode, 404);
      }
    }
    const after = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests' });
    assert.deepEqual(JSON.parse(after.body).items, body.items);
  } finally { await app.close(); }
});

test('staffing scope and pagination do not reveal foreign data or silently truncate', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    for (const suffix of ['', '/candidates']) {
      const foreign = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests/93000006' + suffix });
      const missing = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests/93000099' + suffix });
      assert.equal(foreign.statusCode, 404);
      assert.equal(foreign.body, missing.body);
    }
    for (const query of ['kind=invalid', 'unitId=foreign', 'cursor=x', 'limit=0', 'limit=101']) {
      assert.equal((await app.inject({ method: 'GET', url: '/api/v1/staffing-requests?' + query })).statusCode, 400);
    }
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/staffing-requests?limit=1' })).statusCode, 503);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/staffing-requests/93000001/candidates?limit=1' })).statusCode, 503);
    const stale = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests/93000005/candidates' });
    assert.ok(JSON.parse(stale.body).items.some((item: { freshness: string }) => item.freshness === 'stale'));
  } finally { await app.close(); }
});
