import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SliceApi } from './api';
import { lateCommandFixture as command, lateContextFixture as context, lateValidationFixture as validation } from './station-arrival-late-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/station-arrival-late';
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
describe('dedicated50 API client exact bodies/envelopes — mocked HTTP only', () => {
  let api: SliceApi, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(SliceApi); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses only dedicated paths; no timestamp, query or default/null reason', () => {
    api.stationArrivalLateContext('9001', '6201').subscribe();
    let r = http.expectOne(base + '/context');
    expect(r.request.method).toBe('GET'); expect(r.request.body).toBeNull(); r.flush(context(), { headers });
    api.stationArrivalLateValidate('9001', '6201', { lateReasonCode: '1', lateRemark: null }).subscribe();
    r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({ lateReasonCode: '1', lateRemark: null });
    expect(r.request.timeout).toBe(5000); expect(r.request.cache).toBe('no-store');
    expect(r.request.params.keys()).toEqual([]); r.flush(validation(), { headers });
    api.stationArrivalLateCommand('9001', '6201', command()).subscribe();
    r = http.expectOne(base + '/commands'); expect(r.request.body).toEqual(command()); r.flush({}, { headers });
    http.expectNone(r => /\/station-arrival\//.test(r.url));
  });
  it.each(['Content-Type', 'Cache-Control', 'X-Content-Type-Options'])('fails explicitly without %s response protection', key => {
    let failed = false;
    api.stationArrivalLateContext('9001', '6201').subscribe({ error: () => { failed = true; } });
    const changed: Record<string, string> = { ...headers }; delete changed[key];
    http.expectOne(base + '/context').flush(context(), { headers: changed }); expect(failed).toBe(true);
  });
  it('never accepts pending HTTP202 as a final receipt', () => {
    let failed = false;
    api.stationArrivalLateCommand('9001', '6201', command()).subscribe({ error: () => { failed = true; } });
    http.expectOne(base + '/commands').flush({}, { headers, status: 202, statusText: 'Pending' }); expect(failed).toBe(true);
  });
});
