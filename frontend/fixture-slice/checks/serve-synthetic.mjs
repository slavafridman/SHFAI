// Explicit local test helper ONLY. No Oracle environment/config is forwarded.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFromEnvironment, stopBackendServer } from '../../../backend/fixture-slice/server.mts';
const load = async name => JSON.parse(await readFile(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
const config = await load('config.synthetic.json');
assert.equal(config.dataSource, 'isolated-fixture'); assert.equal(config.deploymentClass, 'local-development');
assert.equal(config.authenticationMode, 'synthetic'); assert.equal(config.syntheticAdministratorEnabled, true);
const search = await load('shift-search.synthetic.json'), detail = await load('search-detail.synthetic.json');
// Stable synthetic IDs; 30 rows exercise offset pagination without personal data.
search.days = Array.from({ length: 30 }, (_, i) => ({ ...structuredClone(search.days[0]), shiftDayId: String(3001 + i) }));
const details = search.days.map(d => ({ ...structuredClone(detail[0]), shiftDayId: d.shiftDayId }));
const merged = [...await load('rows.synthetic.json'), ...details];
const schedule = structuredClone(search);
schedule.days = search.days.map(d => ({ ...d, hasChange: false }));
assert.equal(new Set(merged.map(r => `${r.employeeId}/${r.shiftDayId}`)).size, merged.length, 'No duplicate detail pairs');
const server = await startFromEnvironment({
  SHF_FIXTURE_CONFIG: JSON.stringify(config),
  SHF_FIXTURE_ROWS: JSON.stringify(merged),
  SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(await load('current-shifts.synthetic.json')),
  SHF_SHIFT_SEARCH_FIXTURE: JSON.stringify(search),
  SHF_MY_SHIFTS_FIXTURE: JSON.stringify(schedule),
  SHF_FIXTURE_PORT: process.env.SHF_FIXTURE_PORT ?? '4318',
});
console.log('Explicit synthetic fixture backend ready on loopback:', server.address().port);
let closing = false;
const stop = async () => { if (!closing) { closing = true; await stopBackendServer(server); } };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
