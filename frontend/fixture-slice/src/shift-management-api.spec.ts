import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShiftManagementApi } from './shift-management-api';
import { managementContextFixture, managementIdentityFixture, managementDraftFixture,
  managementPreparationFixture, managementCsvFixture } from './shift-management-fixtures';
const wire = { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff' } };
describe('M3 typed HTTP transport, no backend runtime', () => {
  let api: ShiftManagementApi, http: HttpTestingController;
  const base = '/api/v1/employees/9001/shift-management', c = managementContextFixture();
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ShiftManagementApi); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('GETs exact scoped context with no query/body and validates source', () => {
    let result: unknown;
    api.context(managementIdentityFixture(), '9001', null).subscribe(v => result = v);
    const r = http.expectOne(base + '/context');
    expect(r.request.method).toBe('GET'); expect(r.request.params.keys()).toEqual([]);
    expect(r.request.body).toBeNull(); expect(r.request.timeout).toBe(5000);
    r.flush(c, wire); expect(result).toEqual(c);
  });
  it('prepares exact draft but issues no command implicitly', () => {
    api.prepare(c, managementDraftFixture()).subscribe();
    const r = http.expectOne(base + '/preparations');
    expect(r.request.body).toEqual({ draft: managementDraftFixture() });
    r.flush(managementPreparationFixture(), wire); http.expectNone(base + '/commands');
  });
  it.each(['utf-8', 'windows-1255'] as const)('sends identical raw bytes with explicit %s charset', encoding => {
    const bytes = new Uint8Array([0x58, 0x30, 0x30, 0xe0, 0xff, 13, 10]).buffer;
    api.preview(c, bytes, encoding).subscribe();
    const r = http.expectOne(base + '/csv-previews');
    expect(r.request.body).toBe(bytes); expect(r.request.serializeBody()).toBe(bytes);
    expect(r.request.headers.get('Content-Type')).toBe(`text/csv; charset=${encoding}`);
    expect(r.request.params.keys()).toEqual([]);
    r.flush({ ...managementCsvFixture(), encoding }, wire);
  });
  it('rejects malformed envelopes instead of producing typed success', () => {
    let failed = false;
    api.context(managementIdentityFixture(), '9001', null).subscribe({ error: () => failed = true });
    http.expectOne(base + '/context').flush(c);
    expect(failed).toBe(true);
  });
  it('rejects oversized bytes before HTTP, without truncation/chunking', () => {
    expect(() => api.preview(c, new ArrayBuffer(1048577), 'utf-8')).toThrow();
    http.expectNone(base + '/csv-previews');
  });
});
