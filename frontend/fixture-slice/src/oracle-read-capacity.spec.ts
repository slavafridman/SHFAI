import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SliceApi } from './api';
import { identity, managementCapabilities, nativeCancellationCapabilities, f1Capabilities,
  jointArrivalCapabilities, nativeArrivalCapabilities, nativeStationCapabilities, nativeLateCapabilities,
  nativeExitCapabilities, fixtureCancellationCapabilities } from './contract';
import { cancellationIdentity } from './station-exit-cancellation-contract';
import { filterContext } from './current-shifts-contract';
import { searchContext } from './shift-search-contract';
import { attendanceContext } from './attendance-contract';
import { oracleReadCatalog, oracleReadIdentity } from './oracle-read-capacity-fixtures';

describe('55-scope-v0.2 identity and catalog capacity — synthetic only', () => {
  for (const count of [1, 100, 101, 1000, 1001]) it(`Oracle exact R7 scope ${count}`, () => {
    expect(identity(oracleReadIdentity(count))).toBe(count <= 1000);
  });
  it('does not widen fixture, real, reordered, unknown or writer identities', () => {
    for (const alter of [
      (p: ReturnType<typeof oracleReadIdentity>) => { p.dataSource = 'isolated-fixture'; },
      (p: ReturnType<typeof oracleReadIdentity>) => { p.principal.capabilities.reverse(); },
      (p: ReturnType<typeof oracleReadIdentity>) => { p.principal.capabilities = [...managementCapabilities]; },
      (p: ReturnType<typeof oracleReadIdentity>) => { p.principal.capabilities = [...nativeCancellationCapabilities]; },
      (p: ReturnType<typeof oracleReadIdentity>) => { p.principal.synthetic = false; p.principal.provider = 'real'; },
    ]) {
      const p = oracleReadIdentity(101); alter(p);
      expect(identity(p)).toBe(false); expect(cancellationIdentity(p)).toBe(false);
    }
    expect(identity({ ...oracleReadIdentity(), dataSource: 'unknown' })).toBe(false);
    const p = oracleReadIdentity(); p.principal.roles = [];
    expect(identity(p)).toBe(false);
    expect(cancellationIdentity(oracleReadIdentity())).toBe(false);
  });
  for (const [source, caps] of [
    ['isolated-fixture', f1Capabilities], ['isolated-fixture', jointArrivalCapabilities],
    ['isolated-fixture', fixtureCancellationCapabilities], ['isolated-fixture', managementCapabilities],
    ['oracle', nativeArrivalCapabilities], ['oracle', nativeStationCapabilities],
    ['oracle', nativeLateCapabilities], ['oracle', nativeExitCapabilities],
    ['oracle', nativeCancellationCapabilities], ['oracle', managementCapabilities],
  ] as const) it(`${source}/${caps[7]} remains bounded100`, () => {
    const p = oracleReadIdentity(100); p.dataSource = source; p.principal.capabilities = [...caps];
    expect(identity(p)).toBe(true);
    p.principal.resourceScope.orgUnitIds.push('TAIL');
    expect(identity(p)).toBe(false); expect(cancellationIdentity(p)).toBe(false);
  });
  it('rejects duplicate IDs, wildcard/list scope and source-like extra capabilities', () => {
    for (const bad of ['*', 'a,b', 'a b', '\u0000', '']) {
      const p = oracleReadIdentity(); p.principal.resourceScope.orgUnitIds[999] = bad;
      expect(identity(p)).toBe(false);
    }
    const p = oracleReadIdentity(); p.principal.resourceScope.orgUnitIds[999] = p.principal.resourceScope.orgUnitIds[0];
    expect(identity(p)).toBe(false);
  });
  for (const distinct of [false, true]) it(`complete 1000 options, distinct parents=${distinct}`, () => {
    const c = oracleReadCatalog(1000, distinct), p = oracleReadIdentity();
    expect(filterContext({ ...c, defaults: { mode: 'at', attendanceDate: '2026-10-19',
      currentTime: '10:00', mokedCode: c.defaults.mokedCode } }, p)).toBe(true);
    expect(searchContext(c, p)).toBe(true); expect(attendanceContext(c, p)).toBe(true);
    // Search teams already had a 1000 catalog ceiling; only parent capacity changes.
    expect(searchContext(c)).toBe(!distinct); expect(attendanceContext(c)).toBe(false);
    expect(attendanceContext(oracleReadCatalog(1001, distinct), p)).toBe(false);
    c.teamOptions[999].code = c.teamOptions[0].code;
    expect(attendanceContext(c, p)).toBe(false);
  });
  it('rejects partial, foreign, overflowing or mismatched-source expanded catalogs', () => {
    const p = oracleReadIdentity(), partial = oracleReadCatalog();
    partial.teamOptions.pop();
    expect(searchContext(partial, p)).toBe(false); expect(attendanceContext(partial, p)).toBe(false);
    const foreign = oracleReadCatalog(); foreign.teamOptions[999].code = 'OTHER';
    expect(searchContext(foreign, p)).toBe(false);
    const fixture = oracleReadCatalog(); fixture.dataSource = 'isolated-fixture';
    expect(searchContext(fixture, p)).toBe(false); expect(attendanceContext(fixture, p)).toBe(false);
    const overflow = oracleReadCatalog(1001, true);
    expect(filterContext({ ...overflow, defaults: { mode: 'at', attendanceDate: '2026-10-19',
      currentTime: '10:00', mokedCode: null } }, p)).toBe(false);
  });
});

describe('55-scope-v0.2 shared seven-route identity transport — mocked HTTP', () => {
  let http: HttpTestingController, api: SliceApi;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); api = TestBed.inject(SliceApi);
  });
  afterEach(() => http.verify());
  it('accepts UTF-8 >16KiB only after exact Oracle R7 validation; no invented headers', () => {
    const p = oracleReadIdentity(), bytes = new TextEncoder().encode(JSON.stringify(p)).length;
    expect(bytes).toBeGreaterThan(16384); expect(bytes).toBeLessThan(2097152);
    let result: unknown;
    api.identity().subscribe(v => result = v);
    const r = http.expectOne('/api/v1/identity');
    expect(r.request.cache).toBe('no-store'); expect(r.request.headers.keys()).toEqual([]);
    r.flush(p); expect(result).toEqual(p);
  });
  it('bounds actual raw escaping/whitespace before parsing and rejects malformed JSON', () => {
    for (const raw of ['{', ' '.repeat(2097153) + JSON.stringify(oracleReadIdentity()),
      ' '.repeat(16384) + JSON.stringify({ ...oracleReadIdentity(1), dataSource: 'isolated-fixture' })]) {
      let failed = false;
      api.identity().subscribe({ error: () => failed = true });
      http.expectOne('/api/v1/identity').flush(raw);
      expect(failed).toBe(true);
    }
    const raw = JSON.stringify(oracleReadIdentity()).replace(/[א-ת]/g,
      c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    let accepted = false;
    api.identity().subscribe(() => accepted = true);
    http.expectOne('/api/v1/identity').flush(raw);
    expect(accepted).toBe(true);
  });
  for (const kind of ['fixture-padding', 'invalid', 'writer', 'over2MiB'] as const)
    it(`rejects ${kind} without emitting an identity`, () => {
      const p = oracleReadIdentity(kind === 'fixture-padding' ? 100 : 1000);
      if (kind === 'fixture-padding') p.dataSource = 'isolated-fixture';
      if (kind === 'writer') p.principal.capabilities = [...managementCapabilities];
      const body = { ...p, padding: 'א'.repeat(kind === 'over2MiB' ? 1048576 : 9000),
        ...(kind === 'invalid' ? { dataSource: 'unknown' } : {}) };
      let failed = false, emitted = false;
      api.identity().subscribe({ next: () => emitted = true, error: () => failed = true });
      http.expectOne('/api/v1/identity').flush(body);
      expect(failed).toBe(true); expect(emitted).toBe(false);
    });
});
