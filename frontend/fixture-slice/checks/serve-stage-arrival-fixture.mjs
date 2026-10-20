// ISOLATED TEST HELPER ONLY. Start only after backend-owner READY relay.
// No .env, inherited source configuration, Oracle adapter, or control endpoint.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from '../../../backend/fixture-slice/stage-arrival-sample.mts';
import { createStageArrivalFixture } from '../../../backend/fixture-slice/stage-arrival-fixture.mts';
import { createRuntime } from '../../../backend/fixture-slice/synthetic-identity.mts';
import { createLoopbackServer } from '../../../backend/fixture-slice/http-adapter.mts';
import { MemoryStageArrivalStore } from '../../../backend/fixture-slice/stage-arrival-memory.mts';
import { stageArrivalReadAdapters } from '../../../backend/fixture-slice/stage-arrival-fixture.mts';
assert(process.argv.includes('--isolated-fixture'), 'Explicit isolated-fixture opt-in required');
assert.equal(sampleStageArrivalConfig.dataSource, 'isolated-fixture');
assert.equal(sampleStageArrivalConfig.attendanceStageArrivalMode, 'isolated-fixture');
assert.equal(sampleStageArrivalConfig.syntheticAdministratorEnabled, true);
const scenario = process.argv.find(v => v.startsWith('--scenario='))?.slice(11) ?? 'clean';
assert(['clean', 'late', 'unknown', 'stale', 'expired'].includes(scenario), 'Known isolated test scenario required');
let elapsed = 0;
const clock = { now: () => new Date(Date.parse('2026-10-20T07:22:00.000Z') + elapsed) };
const facts = structuredClone(sampleStageArrivalFacts);
if (scenario === 'late') facts.planned.startLocal = '2026-10-20T10:00:00';
let store;
if (scenario === 'unknown' || scenario === 'stale') {
  // Approved backend INTERNAL test seams only, never HTTP/control endpoints.
  store = new MemoryStageArrivalStore([facts], clock, point => {
    if (scenario === 'unknown' && point === 'installed') throw Error('Synthetic post-install lost acknowledgment');
    if (scenario === 'stale' && point === 'reserved')
      store.reviseForIsolatedTest(rows => { rows[0].revision = 'isolated-test-conflict'; rows[0].policy.revision = 'changed-test-policy'; });
  });
} else store = createStageArrivalFixture([facts], clock).store;
const f1 = { store, ...stageArrivalReadAdapters(store) };
const runtime = await createRuntime(sampleStageArrivalConfig, f1.detail, undefined,
  { reader: f1.current, attendanceReader: f1.attendance, stageArrivalStore: f1.store, clock });
const server = createLoopbackServer(runtime, { stageArrivalOrigins: ['http://127.0.0.1:4388'] });
server.on('request', (request, response) => {
  const operation = /^\/api\/v1\/employees\/9001\/shift-days\/6201\/stage-arrival\/(context|validations|commands)$/.exec(request.url ?? '')?.[1];
  if (!operation) return;
  response.once('finish', () => {
    const s = store.inspectSnapshot();
    console.log('F1 TEST observation', { scenario, operation, status: response.statusCode,
      installed: s.rows.filter(r => r.attendance !== null && r.attendance.stageArrivalLocal !== null).length,
      receipts: s.receipts, audits: s.audits });
    if (scenario === 'expired' && operation === 'validations' && response.statusCode === 200) elapsed = 121000;
    // Retained KNOWN receipt must replay even after its preparation expired.
    // Only this process-owned test Clock advances; no sleep/control endpoint.
    if (scenario === 'clean' && operation === 'commands' && response.statusCode === 200 && elapsed === 0) {
      elapsed = 121000;
      console.log('F1 TEST clock advanced beyond validation lifetime, within retained receipt lifetime');
    }
  });
});
server.listen(4398, '127.0.0.1', () => console.log(`F1 backend TEST fixture READY 4398; scenario=${scenario}; fixed/injected clock; memory only`));
const close = () => { server.close(); server.closeAllConnections(); };
process.once('SIGINT', close); process.once('SIGTERM', close);
await once(server, 'close');
