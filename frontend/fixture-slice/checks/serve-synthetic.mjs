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
const current = await load('current-shifts.synthetic.json');
// Explicit frontend test opt-in to the stable backend §29 fixture seam.
// Every context reuses the IDENTICAL complete raw detail snapshot. No DB input,
// runtime application fallback, second source, or change to existing fixtures.
const selectedItems = process.env.SHF_UI_ITEMS_FIXTURE === '1' ? {
  contexts: merged.map(detail => {
    const team = current.catalog.teams.find(t => t.code === detail.orgUnitId);
    const moked = current.catalog.mokedUnits.find(m => m.code === team?.parentMokedCode);
    assert(team && moked, 'Synthetic context must have its exact existing hierarchy');
    return { detail, unit: { code: team.code, label: team.label, moked }, innerJobCode: null };
  }),
  activities: [...new Map([...current.activities, ...search.activities].map(a => [a.code, a])).values()],
  innerJobs: [], exceptions: [{ code: '-9', label: null }], timeoffs: [{ code: '0', label: null }],
  items: merged.flatMap(detail => Array.from({ length: 30 }, (_, i) => ({
    shiftDayId: detail.shiftDayId, stateCode: i % 3 === 0 ? '4' : i % 3 === 1 ? '2' : '7',
    typeCode: i % 3 === 0 ? null : i % 3 === 1 ? '0' : '-9',
    startLocal: `${detail.baselineStartLocal.slice(0,10)}T23:00:${String(i).padStart(2,'0')}`,
    endLocal: detail.changedEndLocal ?? detail.baselineEndLocal ?? detail.baselineStartLocal,
    durationMinutes: i === 0 ? '-5' : i === 1 ? '99999999999999999999999999999999999999' : '0',
    breakExitLocal: i === 0 ? detail.baselineStartLocal : null, breakReturnLocal: null,
    remark: i === 0 ? '<img src=x onerror=alert(1)> &\nסינתטי בלבד' : null,
    sourceCode: i === 0 ? 'DEL' : 'TEST', cancellationReason: null,
  }))),
} : null;
const schedule = structuredClone(search);
schedule.days = search.days.map(d => ({ ...d, hasChange: false }));
assert.equal(new Set(merged.map(r => `${r.employeeId}/${r.shiftDayId}`)).size, merged.length, 'No duplicate detail pairs');
const server = await startFromEnvironment({
  SHF_FIXTURE_CONFIG: JSON.stringify(config),
  SHF_FIXTURE_ROWS: JSON.stringify(merged),
  SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(current),
  SHF_SHIFT_SEARCH_FIXTURE: JSON.stringify(search),
  SHF_MY_SHIFTS_FIXTURE: JSON.stringify(schedule),
  ...(selectedItems ? { SHF_SHIFT_ITEMS_FIXTURE: JSON.stringify(selectedItems) } : {}),
  SHF_FIXTURE_PORT: process.env.SHF_FIXTURE_PORT ?? '4318',
});
console.log('Explicit synthetic fixture backend ready on loopback:', server.address().port);
let closing = false;
const stop = async () => { if (!closing) { closing = true; await stopBackendServer(server); } };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
