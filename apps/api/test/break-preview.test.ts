import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syntheticBreakView } from '../src/stub/break-fixtures.js';
import { BreakPreviewError, parseBreakProposal, previewBreakChange } from '../src/stub/break-preview.js';
import type { DemoBreakView } from '../src/stub/break-contracts.js';
import { createApplication } from '../src/application.js';

function view(id = '9007199254740993'): DemoBreakView {
  const result = syntheticBreakView(id);
  if (result === null) { throw new Error('Missing synthetic break view.'); }
  return result;
}
function proposal(startLocal = '2026-10-14T11:45:00', durationMinutes = 15) {
  return { breakId: 'break-1', startLocal, durationMinutes };
}
function code(expected: string) {
  return (error: unknown) => error instanceof BreakPreviewError && error.code === expected;
}

test('pure preview accepts exact shift-edge/inter-break boundaries and never mutates its inputs', () => {
  const source = view();
  const before = structuredClone(source);
  for (const start of ['2026-10-14T09:00:00', '2026-10-14T11:45:00', '2026-10-14T14:45:00']) {
    const result = previewBreakChange(source, proposal(start));
    assert.equal(result.saved, false);
    assert.equal(result.previewOnly, true);
    assert.equal(result.proposed.startLocal, start);
    assert.equal(result.before.actualStartLocal, '2026-10-14T10:00:23');
  }
  assert.deepEqual(source, before);
  assert.deepEqual(previewBreakChange(source, proposal()), previewBreakChange(source, proposal()));
  assert.equal(previewBreakChange(source, proposal('2026-10-14T09:00:00', 120)).durationMinutes, 120);
  assert.equal(previewBreakChange(source, proposal('2026-10-14T09:00:00', 1)).durationMinutes, 1);
});

test('one minute inside margins, overlap and inter-break gap under 60 are rejected', () => {
  for (const start of ['2026-10-14T08:59:00', '2026-10-14T14:46:00']) {
    assert.throws(() => previewBreakChange(view(), proposal(start)), code('BREAK_OUTSIDE_ALLOWED_RANGE'));
  }
  for (const start of ['2026-10-14T11:46:00', '2026-10-14T13:05:00', '2026-10-14T14:29:00']) {
    assert.throws(() => previewBreakChange(view(), proposal(start)), code('BREAK_GAP_TOO_SHORT'));
  }
});

test('invalid dates, seconds, zero/deletion and oversized/malformed bodies never become previews', () => {
  for (const value of [null, {}, { ...proposal(), durationMinutes: 0 }, { ...proposal(), durationMinutes: 121 },
    { ...proposal(), durationMinutes: 1.5 }, { ...proposal(), durationMinutes: '15' }, { ...proposal(), actorId: 'spoof' },
    proposal('2026-02-30T11:45:00'), proposal('2026-10-14T11:45:23'), proposal('2026-10-14T11:45:00Z')]) {
    assert.throws(() => parseBreakProposal(value), code('INVALID_PROPOSAL'));
  }
  assert.equal(parseBreakProposal(proposal('2026-10-14T09:00:00', 1)).durationMinutes, 1);
  assert.equal(parseBreakProposal(proposal('2026-10-14T09:00:00', 120)).durationMinutes, 120);
});

test('overnight local preview preserves next-day times and unverified policy remains unavailable', () => {
  const overnight = previewBreakChange(view('9007199254740998'), proposal('2026-10-17T01:45:00'));
  assert.equal(overnight.proposed.endLocal, '2026-10-17T02:00:00');
  for (const id of ['9007199254740994', '9007199254740995', '9007199254740999']) {
    assert.throws(() => previewBreakChange(view(id), proposal()), code('BREAK_PREVIEW_UNAVAILABLE'));
  }
});

test('stub break GET/preview POST is scoped and zero-effect; apply/delete/partner commands remain absent', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const url = '/api/v1/shifts/9007199254740993';
    const initial = await app.inject({ method: 'GET', url: url + '/breaks' });
    assert.equal(initial.statusCode, 200);
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await app.inject({ method: 'POST', url: url + '/break-change-previews', payload: proposal() });
      assert.equal(result.statusCode, 200);
      assert.equal(result.headers['cache-control'], 'no-store');
      const body = JSON.parse(result.body);
      assert.equal(body.synthetic, true);
      assert.equal(body.item.previewOnly, true);
      assert.equal(body.item.saved, false);
      assert.equal(Object.hasOwn(body, 'operationId'), false);
      assert.equal(Object.hasOwn(body, 'transactionId'), false);
    }
    for (const [payload, status] of [[proposal('2026-10-14T11:46:00'), 422], [{ ...proposal(), durationMinutes: 0 }, 400]] as const) {
      assert.equal((await app.inject({ method: 'POST', url: url + '/break-change-previews', payload })).statusCode, status);
    }
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/shifts/9007199254740994/break-change-previews', payload: proposal() })).statusCode, 503);
    assert.equal((await app.inject({ method: 'POST', url: url + '/break-change-previews', payload: { ...proposal(), breakId: 'break-3' } })).statusCode, 404);
    const foreign = await app.inject({ method: 'GET', url: '/api/v1/shifts/9007199254740996/breaks' });
    const missing = await app.inject({ method: 'GET', url: '/api/v1/shifts/42/breaks' });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    for (const method of ['PATCH', 'DELETE'] as const) {
      assert.equal((await app.inject({ method, url: url + '/breaks', payload: {} })).statusCode, 404);
    }
    assert.equal((await app.inject({ method: 'POST', url: url + '/break-change-proposals', payload: proposal() })).statusCode, 404);
    const after = await app.inject({ method: 'GET', url: url + '/breaks' });
    assert.deepEqual(JSON.parse(after.body).item, JSON.parse(initial.body).item);
  } finally { await app.close(); }
});
