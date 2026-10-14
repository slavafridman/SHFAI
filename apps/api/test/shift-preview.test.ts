import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { parseShiftProposal, previewShiftChange, ShiftPreviewError, syntheticShiftContext } from '../src/stub/shift-preview.js';
import type { DemoShiftProposal } from '../src/stub/shift-preview-contracts.js';

function context(id = '9007199254740993') {
  const value = syntheticShiftContext(id);
  if (value === null) { throw new Error('Missing shift demo context.'); }
  return value;
}
function proposal(): DemoShiftProposal {
  return { startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T18:00:00', reason: 'הדגמה בלבד', split: null };
}
function errorCode(code: string) { return (error: unknown) => error instanceof ShiftPreviewError && error.code === code; }

test('plain and split previews calculate exact local minutes without changing source shift/breaks', () => {
  const source = context();
  const before = structuredClone(source);
  const plain = previewShiftChange(source, proposal());
  assert.equal(plain.minutes.working, 600);
  assert.equal(plain.saved, false);
  const split = previewShiftChange(source, {
    ...proposal(), split: { gapStartLocal: '2026-10-14T14:00:00', gapEndLocal: '2026-10-14T16:00:00' },
  });
  assert.deepEqual(split.minutes, { span: 600, working: 480, gap: 120, firstPart: 360, secondPart: 120 });
  assert.equal(split.proposed.split.enabled, true);
  assert.deepEqual(source, before);
  assert.deepEqual(previewShiftChange(source, proposal()), plain);
});

test('strict shift body/calendar/reason validation rejects actor selectors and impossible or second-precision dates', () => {
  for (const value of [null, {}, { ...proposal(), reason: ' ' }, { ...proposal(), reason: 'x'.repeat(201) },
    { ...proposal(), employeeId: '00000002' }, { ...proposal(), startLocal: '2026-02-30T08:00:00' },
    { ...proposal(), startLocal: '2026-10-14T08:00:23' }, { ...proposal(), split: {} }]) {
    assert.throws(() => parseShiftProposal(value), errorCode('INVALID_SHIFT_PROPOSAL'));
  }
});

test('split bounds, 120-minute boundaries, second-part time and break conflicts reject rather than cleaning up', () => {
  const source = { ...context(), breaks: [] };
  const base = { ...proposal(), startLocal: '2026-10-14T12:00:00', endLocal: '2026-10-14T18:00:00',
    split: { gapStartLocal: '2026-10-14T14:00:00', gapEndLocal: '2026-10-14T16:00:00' } };
  assert.equal(previewShiftChange(source, base).minutes.working, 240);
  for (const split of [
    { gapStartLocal: '2026-10-14T13:59:00', gapEndLocal: '2026-10-14T16:00:00' },
    { gapStartLocal: '2026-10-14T14:01:00', gapEndLocal: '2026-10-14T16:00:00' },
    { gapStartLocal: '2026-10-14T14:00:00', gapEndLocal: '2026-10-14T16:01:00' },
    { gapStartLocal: '2026-10-14T19:00:00', gapEndLocal: '2026-10-14T20:00:00' },
  ]) { assert.throws(() => previewShiftChange(source, { ...base, split }), errorCode('SPLIT_DURATION_INVALID')); }
  assert.throws(() => previewShiftChange(source, { ...proposal(), split: {
    gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T14:00:00',
  } }), errorCode('SPLIT_SECOND_PART_TOO_EARLY'));
  assert.throws(() => previewShiftChange(context(), { ...proposal(), split: {
    gapStartLocal: '2026-10-14T13:00:00', gapEndLocal: '2026-10-14T16:00:00',
  } }), errorCode('PLANNED_BREAK_CONFLICT'));
});

test('span/window/overnight and unavailable policy gates remain explicit', () => {
  const source = { ...context(), breaks: [] };
  assert.equal(previewShiftChange(source, { ...proposal(), endLocal: '2026-10-14T12:00:00' }).minutes.span, 240);
  assert.equal(previewShiftChange(source, { ...proposal(), endLocal: '2026-10-15T00:00:00' }).minutes.span, 960);
  for (const endLocal of ['2026-10-14T11:59:00', '2026-10-15T00:01:00', '2026-10-14T07:00:00']) {
    assert.throws(() => previewShiftChange(source, { ...proposal(), endLocal }), errorCode('SHIFT_DURATION_INVALID'));
  }
  assert.throws(() => previewShiftChange(source, { ...proposal(), startLocal: '2026-10-13T08:00:00' }), errorCode('SHIFT_OUTSIDE_DEMO_WINDOW'));
  const overnight = previewShiftChange(context('9007199254740998'), {
    ...proposal(), startLocal: '2026-10-16T23:00:00', endLocal: '2026-10-17T07:00:00',
  });
  assert.equal(overnight.minutes.span, 480);
  assert.throws(() => previewShiftChange(context('9007199254740995'), proposal()), errorCode('SHIFT_PREVIEW_UNAVAILABLE'));
});

test('shift preview POST remains scoped/unsaved and repeated requests leave shifts and breaks unchanged', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const path = '/api/v1/shifts/9007199254740993';
    const before = await app.inject({ method: 'GET', url: path + '/breaks' });
    for (let i = 0; i < 2; i++) {
      const response = await app.inject({ method: 'POST', url: path + '/shift-change-previews', payload: proposal() });
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['x-shf-data-source'], 'synthetic-stub');
      const body = JSON.parse(response.body);
      assert.equal(body.item.saved, false);
      assert.equal(body.item.previewOnly, true);
      assert.equal(Object.hasOwn(body, 'operationId'), false);
    }
    const conflict = await app.inject({ method: 'POST', url: path + '/shift-change-previews', payload: {
      ...proposal(), split: { gapStartLocal: '2026-10-14T13:00:00', gapEndLocal: '2026-10-14T16:00:00' },
    } });
    assert.equal(conflict.statusCode, 422);
    const after = await app.inject({ method: 'GET', url: path + '/breaks' });
    assert.deepEqual(JSON.parse(after.body).item, JSON.parse(before.body).item);
    const foreign = await app.inject({ method: 'POST', url: '/api/v1/shifts/9007199254740996/shift-change-previews', payload: proposal() });
    const missing = await app.inject({ method: 'POST', url: '/api/v1/shifts/42/shift-change-previews', payload: proposal() });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    assert.equal((await app.inject({ method: 'POST', url: path + '/change-proposals', payload: proposal() })).statusCode, 404);
  } finally { await app.close(); }
});
