import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

test('operational schedule/attendance share scoped effective projection and distinct actual null/zero facts', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const query = '?from=2026-10-14&toExclusive=2026-10-18&limit=100';
    const schedule = await app.inject({ method: 'GET', url: '/api/v1/shifts' + query });
    const attendance = await app.inject({ method: 'GET', url: '/api/v1/attendance' + query });
    assert.equal(schedule.statusCode, 200);
    assert.equal(attendance.statusCode, 200);
    assert.equal(attendance.headers['cache-control'], 'no-store');
    const planned = JSON.parse(schedule.body);
    const actual = JSON.parse(attendance.body);
    assert.equal(actual.synthetic, true);
    assert.equal(actual.unitId, 'synthetic-team-a');
    assert.equal(actual.items.length, 7);
    assert.deepEqual(actual.items.map((row: { shift: unknown }) => row.shift),
      planned.items.map((row: { shift: unknown }) => row.shift));
    assert.ok(!schedule.body.includes('00000004'));
    assert.ok(!schedule.body.includes('9007199254740997'));
    const byId = new Map<string, { shift: { effective: { employeeId: string }; baseline: unknown }; attendance: {
      lateMinutes: number | null; stationExitLocal: string | null; missingReason: string | null;
    } }>(actual.items.map((row: { shift: { id: string } }) => [row.shift.id, row]));
    assert.equal(byId.get('9007199254740993')?.attendance.lateMinutes, 0);
    assert.equal(byId.get('9007199254740994')?.attendance.lateMinutes, 5);
    assert.equal(byId.get('9007199254740994')?.attendance.stationExitLocal, null);
    assert.equal(byId.get('9007199254740999')?.attendance.lateMinutes, null);
    assert.ok(byId.get('9007199254740995')?.attendance.missingReason);
    assert.equal(byId.get('9007199254740998')?.attendance.stationExitLocal, '2026-10-17T06:00:00');
    assert.equal(byId.get('9007199254741000')?.shift.effective.employeeId, '00000002');
    assert.ok(actual.items.every((row: { shift: { baseline: unknown } }) => row.shift.baseline === null));
    for (const method of ['POST', 'PATCH', 'DELETE'] as const) {
      assert.equal((await app.inject({ method, url: '/api/v1/attendance', payload: {} })).statusCode, 404);
    }
    const repeated = await app.inject({ method: 'GET', url: '/api/v1/attendance' + query });
    assert.deepEqual(JSON.parse(repeated.body).items, actual.items);
  } finally { await app.close(); }
});

test('operational reads enforce date, limit and scope gates without fake truncation', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    for (const path of ['/api/v1/shifts', '/api/v1/attendance']) {
      for (const query of ['', '?from=2026-02-30&toExclusive=2026-03-01',
        '?from=2026-10-14&toExclusive=2026-10-18&unitId=synthetic-team-b']) {
        assert.equal((await app.inject({ method: 'GET', url: path + query })).statusCode, 400);
      }
      assert.equal((await app.inject({ method: 'GET', url: path + '?from=2026-10-14&toExclusive=2026-10-18&limit=1' })).statusCode, 503);
      const empty = await app.inject({ method: 'GET', url: path + '?from=2026-11-01&toExclusive=2026-11-02' });
      assert.deepEqual(JSON.parse(empty.body).items, []);
      const day = await app.inject({ method: 'GET', url: path + '?from=2026-10-16&toExclusive=2026-10-17' });
      assert.equal(JSON.parse(day.body).items.length, 3);
    }
  } finally { await app.close(); }
});
