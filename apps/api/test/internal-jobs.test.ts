import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { syntheticInternalJobs } from '../src/stub/internal-job-fixtures.js';
import { matchesInternalJobStatus } from '../src/stub/internal-job-contracts.js';

test('internal jobs preserve scoped catalog facts, lossless IDs, inactive/unknown and zero/null groups', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const before = syntheticInternalJobs();
    const response = await app.inject({ method: 'GET', url: '/api/v1/internal-jobs' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-shf-data-source'], 'synthetic-stub');
    const body = JSON.parse(response.body);
    assert.equal(body.synthetic, true);
    assert.equal(body.authenticated, false);
    assert.equal(body.sourceVersion, 'synthetic-job-catalog-1');
    assert.equal(body.items.length, 3);
    assert.equal(body.items[1].active, false);
    assert.equal(body.items[1].groupCode, '0');
    assert.equal(body.items[2].active, null);
    assert.equal(body.items[2].groupCode, null);
    assert.equal(body.items[2].id, '9007199254740997');
    assert.ok(!response.body.includes('synthetic-hidden'));
    for (const item of body.items) {
      const detail = await app.inject({ method: 'GET', url: `/api/v1/internal-jobs/${item.id}` });
      assert.deepEqual(JSON.parse(detail.body).item, item);
    }
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/internal-jobs/95000004' });
    const absent = await app.inject({ method: 'GET', url: '/api/v1/internal-jobs/95000099' });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, absent.body);
    assert.deepEqual(syntheticInternalJobs(), before);
  } finally { await app.close(); }
});

test('status and ID/name filters are exact; unknown never becomes inactive and bounds fail explicitly', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    for (const [status, id] of [['active', '95000001'], ['inactive', '95000002'], ['unknown', '9007199254740997']]) {
      const response = await app.inject({ method: 'GET', url: `/api/v1/internal-jobs?status=${status}` });
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).status, status);
      assert.deepEqual(JSON.parse(response.body).items.map((item: { id: string }) => item.id), [id]);
    }
    assert.equal(matchesInternalJobStatus(null, 'inactive'), false);
    assert.equal(matchesInternalJobStatus(false, 'unknown'), false);
    const search = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/internal-jobs?search=%20DEMO%20&status=unknown' })).body);
    assert.equal(search.search, 'demo');
    assert.equal(search.items[0].id, '9007199254740997');
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/internal-jobs?search=95000002&status=active' })).body).items.length, 0);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/internal-jobs?limit=1' })).statusCode, 503);
    for (const query of ['status=invalid', 'status=active&status=inactive', 'limit=0', 'limit=101', 'limit=1.5',
      'search=a&search=b', 'unitId=foreign', 'groupCode=12', 'cursor=next', `search=${'a'.repeat(81)}`]) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/internal-jobs?${query}` })).statusCode, 400);
    }
    for (const path of ['0', '01', '-1', 'invalid', '95000001?unitId=foreign']) {
      assert.equal((await app.inject({ method: 'GET', url: `/api/v1/internal-jobs/${path}` })).statusCode, 400);
    }
  } finally { await app.close(); }
});

test('internal jobs expose read-only capability and no edit, group assignment, reload or real-mode route', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  const real = await createApplication({});
  try {
    await app.init(); await real.init();
    const capability = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me/capabilities' })).body);
    assert.equal(capability.internalJobs.read.enabled, true);
    assert.equal(capability.internalJobs.write.enabled, false);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      assert.equal((await app.inject({ method, url: '/api/v1/internal-jobs/95000001', payload: {} })).statusCode, 404);
    }
    for (const path of ['/api/v1/internal-jobs', '/api/v1/internal-jobs/95000001/group', '/api/v1/internal-jobs/reload']) {
      assert.equal((await app.inject({ method: 'POST', url: path, payload: {} })).statusCode, 404);
    }
    assert.equal((await real.inject({ method: 'GET', url: '/api/v1/internal-jobs' })).statusCode, 404);
  } finally { await app.close(); await real.close(); }
});
