import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { syntheticReplacementScenario } from '../src/stub/replacement-fixtures.js';
import { previewReplacement } from '../src/stub/replacement-preview.js';

test('replacement classification separates blockers, review warnings and unknown facts without modifying either side', () => {
  const scenario = syntheticReplacementScenario();
  const before = structuredClone(scenario);
  const expected = ['eligible-under-demo-policy', 'blocked', 'confirmation-required', 'unknown'];
  scenario.rows.forEach((row, index) => {
    const preview = previewReplacement(scenario.source, row.candidate, row.facts);
    assert.equal(preview.eligibility, expected[index]);
    assert.equal(preview.saved, false);
    assert.equal(preview.accepted, false);
  });
  assert.deepEqual(scenario, before);
});

test('both participants require all four rest gaps at least 660 minutes; null/invalid cannot become eligible', () => {
  const scenario = syntheticReplacementScenario();
  const row = scenario.rows[0];
  assert.ok(row);
  for (let i = 0; i < 4; i++) {
    const rest: [number | null, number | null, number | null, number | null] = [...row.facts.restMinutes];
    rest[i] = 659;
    assert.equal(previewReplacement(scenario.source, row.candidate, { ...row.facts, restMinutes: rest }).eligibility, 'blocked');
    rest[i] = null;
    assert.equal(previewReplacement(scenario.source, row.candidate, { ...row.facts, restMinutes: rest }).eligibility, 'unknown');
  }
  assert.equal(previewReplacement(scenario.source, row.candidate, row.facts).eligibility, 'eligible-under-demo-policy');
  const mixed = previewReplacement(scenario.source, row.candidate, { ...row.facts, restMinutes: [659, null, 720, 660] });
  assert.equal(mixed.eligibility, 'blocked');
  assert.ok(mixed.unknowns.length > 0);
});

test('same owner/times, attendance on either side, lead, duration and night-site gates remain discriminating', () => {
  const scenario = syntheticReplacementScenario();
  const row = scenario.rows[0];
  assert.ok(row);
  for (const candidate of [
    { ...row.candidate, shift: { ...row.candidate.shift, employeeId: scenario.source.employeeId } },
    { ...row.candidate, shift: { ...row.candidate.shift, startLocal: scenario.source.startLocal, endLocal: scenario.source.endLocal } },
    { ...row.candidate, shift: { ...row.candidate.shift, endLocal: '2026-10-17T18:01:00' } },
    { ...row.candidate, shift: { ...row.candidate.shift, startLocal: '2026-10-13T09:59:00', endLocal: '2026-10-13T17:59:00' } },
    { ...row.candidate, shift: { ...row.candidate.shift, startLocal: '2026-10-17T23:00:00', endLocal: '2026-10-18T07:00:00', siteId: 'other-site' } },
  ]) { assert.equal(previewReplacement(scenario.source, candidate, row.facts).eligibility, 'blocked'); }
  assert.equal(previewReplacement(scenario.source, row.candidate, { ...row.facts, sourceAttendanceClear: false }).eligibility, 'blocked');
  assert.equal(previewReplacement(scenario.source, row.candidate, { ...row.facts, candidateAttendanceClear: false }).eligibility, 'blocked');
  const boundary = { ...row.candidate, shift: { ...row.candidate.shift, startLocal: '2026-10-13T10:00:00', endLocal: '2026-10-13T20:00:00' } };
  assert.equal(previewReplacement(scenario.source, boundary, row.facts).eligibility, 'eligible-under-demo-policy');
  assert.equal(previewReplacement({
    ...scenario.source, startLocal: '2026-10-13T09:59:00', endLocal: '2026-10-13T17:59:00',
  }, row.candidate, row.facts).eligibility, 'blocked');
  assert.equal(previewReplacement(scenario.source, {
    ...row.candidate,
    shift: { ...row.candidate.shift, startLocal: '2026-10-17T23:00:00', endLocal: '2026-10-18T07:00:00', siteId: null },
  }, row.facts).eligibility, 'unknown');
});

test('candidate GET and pure preview POST are labelled, scoped, bounded and unchanged after preview', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const before = await app.inject({ method: 'GET', url: '/api/v1/replacement-candidates' });
    assert.equal(before.statusCode, 200);
    const list = JSON.parse(before.body);
    assert.equal(list.items.length, 4);
    assert.equal(list.synthetic, true);
    assert.ok(!before.body.includes('restMinutes'));
    assert.ok(!before.body.includes('00000004'));
    const expected = ['eligible-under-demo-policy', 'blocked', 'confirmation-required', 'unknown'];
    for (let i = 0; i < 4; i++) {
      const result = await app.inject({ method: 'POST', url: '/api/v1/replacement-eligibility-previews', payload: { candidateId: `candidate-${i + 1}` } });
      assert.equal(result.statusCode, 200);
      assert.equal(result.headers['cache-control'], 'no-store');
      const body = JSON.parse(result.body);
      assert.equal(body.item.eligibility, expected[i]);
      assert.equal(body.item.saved, false);
      assert.equal(body.item.accepted, false);
      assert.equal(Object.hasOwn(body, 'operationId'), false);
    }
    const after = await app.inject({ method: 'GET', url: '/api/v1/replacement-candidates' });
    assert.deepEqual(JSON.parse(after.body).items, list.items);
    const foreign = await app.inject({ method: 'POST', url: '/api/v1/replacement-eligibility-previews', payload: { candidateId: 'candidate-5' } });
    const missing = await app.inject({ method: 'POST', url: '/api/v1/replacement-eligibility-previews', payload: { candidateId: 'candidate-99' } });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/replacement-candidates?limit=1' })).statusCode, 503);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/replacement-candidates?unitId=foreign' })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/replacement-eligibility-previews', payload: { candidateId: 'candidate-1', confirm: true } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/replacement-acceptances', payload: { candidateId: 'candidate-1' } })).statusCode, 404);
  } finally { await app.close(); }
});
