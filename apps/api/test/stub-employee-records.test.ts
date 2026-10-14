import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('employee child reads are scoped, labelled, bounded and immutable for all three sections', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    for (const section of ['skills', 'events', 'education']) {
      const path = `/api/v1/employees/00000001/${section}`;
      const first = await application.inject({ method: 'GET', url: path });
      assert.equal(first.statusCode, 200);
      assert.equal(first.headers['cache-control'], 'no-store');
      assert.equal(first.headers['x-shf-data-source'], 'synthetic-stub');
      const body = JSON.parse(first.body);
      assert.equal(body.synthetic, true);
      assert.equal(body.authenticated, false);
      assert.equal(body.employeeId, '00000001');
      assert.equal(body.section, section);
      assert.ok(body.items.length > 0);
      for (const item of body.items) {
        assert.deepEqual(Object.keys(item).sort(), ['dateLocal', 'detail', 'id', 'label']);
      }
      const foreign = await application.inject({ method: 'GET', url: `/api/v1/employees/00000004/${section}` });
      const missing = await application.inject({ method: 'GET', url: `/api/v1/employees/99999999/${section}` });
      assert.equal(foreign.statusCode, 404);
      assert.equal(foreign.body, missing.body);
      const empty = await application.inject({ method: 'GET', url: `/api/v1/employees/00000002/${section}` });
      assert.deepEqual(JSON.parse(empty.body).items, []);
      const unknown = await application.inject({ method: 'GET', url: `/api/v1/employees/00000003/${section}` });
      assert.equal(JSON.parse(unknown.body).items[0].dateLocal, null);
      assert.equal(JSON.parse(unknown.body).items[0].detail, null);
      for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
        assert.equal((await application.inject({ method, url: path, payload: {} })).statusCode, 404);
      }
      assert.deepEqual(JSON.parse((await application.inject({ method: 'GET', url: path })).body).items, body.items);
    }
  } finally { await application.close(); }
});

test('employee child endpoints reject selector overrides and malformed or incomplete pagination', async () => {
  const application = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await application.init();
    for (const query of ['employeeId=00000004', 'cursor=x', 'limit=0', 'limit=101', 'limit=1.5']) {
      assert.equal((await application.inject({ method: 'GET', url: `/api/v1/employees/00000001/skills?${query}` })).statusCode, 400);
    }
    assert.equal((await application.inject({ method: 'GET', url: '/api/v1/employees/00000001/skills?limit=1' })).statusCode, 503);
    assert.equal((await application.inject({ method: 'GET', url: '/api/v1/employees/00000001/courses' })).statusCode, 404);
  } finally { await application.close(); }
});
