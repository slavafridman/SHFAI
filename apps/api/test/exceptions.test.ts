import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('exception reads distinguish day/timed/original/changed/cancelled records and remain scoped/immutable', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const query = '?from=2026-10-14&toExclusive=2026-10-18&limit=100';
    const active = await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query });
    assert.equal(active.statusCode, 200);
    assert.equal(active.headers['cache-control'], 'no-store');
    assert.equal(JSON.parse(active.body).items.length, 5);
    const history = await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query + '&includeCancelled=true' });
    const items = JSON.parse(history.body).items;
    assert.equal(items.length, 6);
    for (const item of items) {
      const detail = await app.inject({ method: 'GET', url: `/api/v1/exceptions/${item.id}` });
      assert.deepEqual(JSON.parse(detail.body).item, item);
      if (item.interval.kind === 'full-day') {
        assert.equal(item.interval.startLocal, null);
        assert.equal(item.interval.endLocal, null);
      }
    }
    const changed = items.find((item: { id: string }) => item.id === '94000002');
    assert.equal(changed.interval.startLocal, '2026-10-15T14:00:00');
    assert.equal(changed.originalInterval.startLocal, '2026-10-15T12:00:00');
    const redacted = items.find((item: { id: string }) => item.id === '94000005');
    assert.equal(redacted.originalInterval, null);
    assert.equal(redacted.originalAvailability, 'not-authorized');
    assert.equal(redacted.reason, null);
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/exceptions/94000007' });
    const missing = await app.inject({ method: 'GET', url: '/api/v1/exceptions/94000099' });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
      for (const suffix of ['', '/cancellations', '/remark']) {
        assert.equal((await app.inject({ method, url: '/api/v1/exceptions/94000001' + suffix, payload: {} })).statusCode, 404);
      }
    }
    const after = await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query + '&includeCancelled=true' });
    assert.deepEqual(JSON.parse(after.body).items, items);
  } finally { await app.close(); }
});

test('employee time-off filters by start/business date, preserves overnight end and denies foreign scope', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const query = '?from=2026-10-14&toExclusive=2026-10-18';
    const mine = await app.inject({ method: 'GET', url: '/api/v1/employees/00000001/time-off' + query });
    assert.equal(mine.statusCode, 200);
    assert.deepEqual(JSON.parse(mine.body).items.map((item: { id: string }) => item.id), ['94000003', '94000001']);
    const empty = await app.inject({ method: 'GET', url: '/api/v1/employees/00000002/time-off' + query });
    assert.deepEqual(JSON.parse(empty.body).items, []);
    const history = await app.inject({ method: 'GET', url: '/api/v1/employees/00000001/time-off' + query + '&includeCancelled=true' });
    assert.equal(JSON.parse(history.body).items.length, 3);
    const night = await app.inject({ method: 'GET', url: '/api/v1/employees/00000001/time-off?from=2026-10-16&toExclusive=2026-10-17' });
    assert.equal(JSON.parse(night.body).items[0].interval.endLocal, '2026-10-17T01:00:00');
    const nextDay = await app.inject({ method: 'GET', url: '/api/v1/employees/00000001/time-off?from=2026-10-17&toExclusive=2026-10-18' });
    assert.deepEqual(JSON.parse(nextDay.body).items, []);
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/employees/00000004/time-off' + query });
    const absent = await app.inject({ method: 'GET', url: '/api/v1/employees/00000099/time-off' + query });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, absent.body);
  } finally { await app.close(); }
});

test('exception filters reject malformed dates/selectors and insufficient limits without fake truncation', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const query = '?from=2026-10-14&toExclusive=2026-10-18';
    for (const extra of ['&kind=bad', '&includeCancelled=1', '&unitId=foreign', '&limit=0', '&cursor=x']) {
      assert.equal((await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query + extra })).statusCode, 400);
    }
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/exceptions?from=2026-02-30&toExclusive=2026-03-01' })).statusCode, 400);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query + '&limit=1' })).statusCode, 503);
    const days = await app.inject({ method: 'GET', url: '/api/v1/exceptions' + query + '&kind=full-day' });
    assert.equal(JSON.parse(days.body).items.length, 2);
  } finally { await app.close(); }
});
