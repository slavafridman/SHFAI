import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCsv as parseCsv } from './csv.mjs';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, '..', '..');
const document = path.join(root, 'docs', 'SHF_REVERSE_ENGINEERING_DESIGN.md');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lineCounts = new Map();
function sourceLines(file) {
  if (!lineCounts.has(file)) lineCounts.set(file, fs.readFileSync(file, 'utf8').split('\n').length);
  return lineCounts.get(file);
}
const csvFiles = fs.readdirSync(output).filter(name => name.endsWith('.csv')).sort();
let rowReferences = 0;
for (const name of csvFiles) {
  const rows = parseCsv(path.join(output, name));
  for (const row of rows) {
    if (!row.file || !row.line) continue;
    const source = path.resolve(root, row.file.replaceAll('/', '\\'));
    assert.ok(fs.existsSync(source), `Missing source: ${row.file}`);
    const lines = sourceLines(source);
    assert.ok(Number(row.line) >= 1 && Number(row.line) <= lines,
      `Out-of-bounds line: ${row.file}:${row.line}`);
    rowReferences++;
  }
}
const manifest = parseCsv(path.join(output, 'source-manifest.csv'));
for (const row of manifest) {
  const bytes = fs.readFileSync(path.resolve(root, row.file.replaceAll('/', '\\')));
  assert.equal(hash(bytes), row.sha256, `Source changed since extraction: ${row.file}`);
}
const text = fs.readFileSync(document, 'utf8');
let localLinks = 0;
let anchoredLinks = 0;
for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (/^https?:\/\//.test(target)) continue;
  const [filename, anchor] = target.split('#');
  if (!filename) continue;
  const file = path.resolve(path.dirname(document), filename.replaceAll('/', '\\'));
  if (file === path.join(output, 'verification.json')) { localLinks++; continue; }
  assert.ok(fs.existsSync(file), `Missing document link: ${target}`);
  localLinks++;
  if (anchor?.startsWith('L')) {
    const line = Number(anchor.slice(1));
    const lines = sourceLines(file);
    assert.ok(Number.isInteger(line) && line > 0 && line <= lines, `Bad line anchor: ${target}`);
    anchoredLinks++;
  }
}
const coverage = JSON.parse(fs.readFileSync(path.join(output, 'coverage.json'), 'utf8'));
assert.equal(coverage.sources, manifest.length);
assert.equal(coverage.java, 239);
assert.equal(coverage.jsp, 185);
assert.equal(coverage.application_js, 19);
assert.equal(coverage.routes, 216);
assert.equal(coverage.action_forwards, 305);
assert.equal(coverage.global_forwards, 4);
assert.deepEqual(coverage.route_action_sources_missing, []);
assert.deepEqual(coverage.database_objects_unmatched, []);
assert.equal(coverage.physical.object_counts.TABLE, 78);
assert.equal(coverage.physical.object_counts.VIEW, 2);
assert.equal(coverage.physical.foreign_keys, 29);
const routes = parseCsv(path.join(output, 'routes.csv'));
assert.equal(new Set(routes.map(row => row.path)).size, 215);
assert.deepEqual(coverage.duplicate_routes,
  [{ path: '/shift/viewOriginalShiftDialog', lines: [925, 929] }],
  'Legacy duplicate-route anomaly changed; inspect and update the design evidence.');
const schema = parseCsv(path.join(output, 'schema-usage-map.csv'));
assert.equal(schema.length, 80);
const captures = fs.readdirSync(output)
  .filter(name => name.startsWith('oracle-') && /\.(csv|txt)$/.test(name)).sort()
  .map(name => ({ file: name, sha256: hash(fs.readFileSync(path.join(output, name))) }));
const result = { task_id: 'SHF-RE-2026-10-15', checked_at: new Date().toISOString(),
  status: 'passed_with_documented_source_anomaly', csv_files: csvFiles.length, inventory_row_references: rowReferences,
  source_hashes_verified: manifest.length, document_local_links: localLinks,
  document_line_anchors: anchoredLinks, route_paths_unique: 215,
  legacy_route_uniqueness: 'failed: identical mapping declared twice',
  documented_duplicate_routes: coverage.duplicate_routes,
  physical_table_view_rows: schema.length, document_sha256: hash(fs.readFileSync(document)),
  oracle_capture_hashes: captures,
  limitations: 'Structural/static evidence verification only; no Java build, UI, business-data, EMS or application behavior test.' };
fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, oracle_capture_hashes: captures.length }, null, 2));
