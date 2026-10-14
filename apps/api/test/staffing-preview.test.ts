import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { syntheticStaffingCandidates, syntheticStaffingEligibilityFacts, syntheticStaffingRequests } from '../src/stub/staffing-fixtures.js';
import { previewStaffingCandidate } from '../src/stub/staffing-preview.js';

function source(id: string, candidateId = 'staff-candidate-1') {
  const request = syntheticStaffingRequests().find(item => item.id === id);
  const candidate = syntheticStaffingCandidates(id).find(item => item.id === candidateId);
  assert.ok(request);
  assert.ok(candidate);
  return { request, candidate, facts: syntheticStaffingEligibilityFacts(candidateId) };
}

test('all three request types project one hypothetical slot without assigning or modifying anything', () => {
  for (const id of ['93000001', '93000005', '93000007']) {
    const { request, candidate, facts } = source(id);
    const before = structuredClone({ request, candidate, facts });
    const result = previewStaffingCandidate(request, candidate, facts);
    assert.equal(result.outcome, 'eligible-under-demo-policy');
    assert.equal(result.saved, false);
    assert.equal(result.assigned, false);
    assert.equal(result.approved, false);
    assert.equal(result.capacityIfApplied?.approved, (request.approved ?? -1) + 1);
    assert.equal(result.capacityIfApplied?.remaining, (request.remaining ?? -1) - 1);
    assert.deepEqual({ request, candidate, facts }, before);
    assert.deepEqual(previewStaffingCandidate(request, candidate, facts), result);
  }
});

test('full/elapsed and duplicate are blockers; stale or unknown capacity never produces a hypothetical result', () => {
  for (const [id, candidateId, outcome] of [
    ['93000002', 'staff-candidate-1', 'blocked'],
    ['93000004', 'staff-candidate-3', 'unknown'],
    ['93000001', 'staff-candidate-2', 'unknown'],
    ['93000005', 'staff-candidate-5', 'blocked'],
  ] as const) {
    const { request, candidate, facts } = source(id, candidateId);
    const result = previewStaffingCandidate(request, candidate, facts);
    assert.equal(result.outcome, outcome);
    assert.equal(result.capacityIfApplied, null);
  }
  const { request, candidate, facts } = source('93000001');
  assert.equal(previewStaffingCandidate({ ...request, remaining: 3 }, candidate, facts).outcome, 'unknown');
  assert.equal(previewStaffingCandidate(request, candidate, { ...facts, jobCompatible: false }).outcome, 'blocked');
  assert.equal(previewStaffingCandidate(request, candidate, { ...facts, intervalCompatible: null }).outcome, 'unknown');
});

test('last-slot and deadline/lead equality remain exact, while one minute too late or too short blocks', () => {
  const { request, candidate, facts } = source('93000005');
  const result = previewStaffingCandidate(request, candidate, facts);
  assert.equal(result.capacityIfApplied?.remaining, 0);
  const boundary = { ...request, startLocal: '2026-10-13T10:00:00', endLocal: '2026-10-13T18:00:00', deadlineLocal: '2026-10-13T08:00:00' };
  assert.equal(previewStaffingCandidate(boundary, candidate, facts).outcome, 'eligible-under-demo-policy');
  assert.equal(previewStaffingCandidate({ ...boundary, startLocal: '2026-10-13T09:59:00' }, candidate, facts).outcome, 'blocked');
  assert.equal(previewStaffingCandidate({ ...boundary, deadlineLocal: '2026-10-13T07:59:00', deadlineState: 'elapsed' }, candidate, facts).outcome, 'blocked');
});

test('scoped staffing preview POST is strict and repeated success/failure leaves request and candidates unchanged', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const path = '/api/v1/staffing-requests/93000001';
    const before = await app.inject({ method: 'GET', url: path });
    const candidatesBefore = await app.inject({ method: 'GET', url: path + '/candidates' });
    for (const candidateId of ['staff-candidate-1', 'staff-candidate-1', 'staff-candidate-2']) {
      const response = await app.inject({ method: 'POST', url: path + '/eligibility-previews', payload: { candidateId } });
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['cache-control'], 'no-store');
      const body = JSON.parse(response.body);
      assert.equal(body.synthetic, true);
      assert.equal(body.item.saved, false);
      assert.equal(body.item.assigned, false);
      assert.equal(body.item.approved, false);
      assert.equal(Object.hasOwn(body, 'operationId'), false);
    }
    const foreign = await app.inject({ method: 'POST', url: path + '/eligibility-previews', payload: { candidateId: 'staff-candidate-4' } });
    const missing = await app.inject({ method: 'POST', url: path + '/eligibility-previews', payload: { candidateId: 'staff-candidate-99' } });
    assert.equal(foreign.statusCode, 404);
    assert.equal(foreign.body, missing.body);
    const foreignRequest = await app.inject({
      method: 'POST', url: '/api/v1/staffing-requests/93000006/eligibility-previews', payload: { candidateId: 'staff-candidate-1' },
    });
    const missingRequest = await app.inject({
      method: 'POST', url: '/api/v1/staffing-requests/93000099/eligibility-previews', payload: { candidateId: 'staff-candidate-1' },
    });
    assert.equal(foreignRequest.statusCode, 404);
    assert.equal(foreignRequest.body, missingRequest.body);
    for (const payload of [{ candidateId: 'staff-candidate-1', approved: true }, { candidateId: 'staff-candidate-1', remaining: 100 }, {}]) {
      assert.equal((await app.inject({ method: 'POST', url: path + '/eligibility-previews', payload })).statusCode, 400);
    }
    const after = await app.inject({ method: 'GET', url: path });
    const candidatesAfter = await app.inject({ method: 'GET', url: path + '/candidates' });
    assert.deepEqual(JSON.parse(after.body).item, JSON.parse(before.body).item);
    assert.deepEqual(JSON.parse(candidatesAfter.body).items, JSON.parse(candidatesBefore.body).items);
    for (const [id, candidateId, outcome] of [
      ['93000002', 'staff-candidate-1', 'blocked'],
      ['93000004', 'staff-candidate-3', 'unknown'],
      ['93000007', 'staff-candidate-1', 'eligible-under-demo-policy'],
    ] as const) {
      const response = await app.inject({ method: 'POST', url: `/api/v1/staffing-requests/${id}/eligibility-previews`, payload: { candidateId } });
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).item.outcome, outcome);
    }
    const lastSlot = await Promise.all([1, 2].map(() => app.inject({
      method: 'POST', url: '/api/v1/staffing-requests/93000005/eligibility-previews',
      payload: { candidateId: 'staff-candidate-1' },
    })));
    assert.ok(lastSlot.every(response => JSON.parse(response.body).item.capacityIfApplied.remaining === 0));
    const unchanged = await app.inject({ method: 'GET', url: '/api/v1/staffing-requests/93000005' });
    assert.equal(JSON.parse(unchanged.body).item.remaining, 1);
    assert.equal((await app.inject({ method: 'POST', url: path + '/assignments', payload: {} })).statusCode, 404);
  } finally { await app.close(); }
});
