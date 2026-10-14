import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Reports } from './reports';
import type { DemoStaffingReport } from './reports-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T09:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capability = { ...marker, reports: { read: { enabled: true } } };

function sample(deduct = true, missingAll = false): DemoStaffingReport {
  const baseline = deduct ? [30, 20, 25, 30, 30, 30, 30, 30] : Array.from({ length: 8 }, () => 30);
  const modified = deduct ? [7, 5, 25, 30, 30, 30, 30, 30] : [7, 15, 30, 30, 30, 30, 30, 30];
  const demand = missingAll ? Array.from({ length: 8 }, () => null) : [2, 2, 3, null, 2, 0, 3, 2];
  const intervals = baseline.map((staff, index) => {
    const start = Date.parse('2026-10-14T08:00:00Z') + index * 15 * 60_000;
    const required = demand[index] ?? null;
    const requiredMinutes = required === null ? null : required * 15;
    const modifiedMinutes = modified[index];
    if (modifiedMinutes === undefined) { throw new Error('Missing synthetic report interval.'); }
    return {
      startLocal: new Date(start).toISOString().slice(0, 19),
      endExclusiveLocal: new Date(start + 15 * 60_000).toISOString().slice(0, 19),
      baselineGrossMinutes: 30, baselineAvailableMinutes: staff,
      modifiedGrossMinutes: index === 0 ? 7 : index === 1 ? 15 : 30,
      modifiedAvailableMinutes: modifiedMinutes, requiredHeadcount: required, requiredMinutes,
      baselineGapMinutes: requiredMinutes === null ? null : staff - requiredMinutes,
      modifiedGapMinutes: requiredMinutes === null ? null : modifiedMinutes - requiredMinutes,
    };
  });
  const known = intervals.filter(row => row.requiredMinutes !== null);
  const required = known.reduce((total, row) => total + (row.requiredMinutes ?? 0), 0);
  const baselineKnown = known.reduce((total, row) => total + row.baselineAvailableMinutes, 0);
  const modifiedKnown = known.reduce((total, row) => total + row.modifiedAvailableMinutes, 0);
  return {
    sourceVersion: 'synthetic-report-source-1', unitId: 'synthetic-team-a', intervalMinutes: 15,
    query: { fromLocal: '2026-10-14T08:00:00', toExclusiveLocal: '2026-10-14T10:00:00', includeBreaks: deduct, includeExceptions: deduct },
    intervals,
    totals: {
      baselineGrossMinutes: 240, baselineAvailableMinutes: baseline.reduce((total, value) => total + value, 0),
      modifiedGrossMinutes: 202, modifiedAvailableMinutes: modified.reduce((total, value) => total + value, 0),
      knownForecastIntervals: known.length, missingForecastIntervals: 8 - known.length,
      knownRequiredMinutes: required, knownBaselineStaffMinutes: baselineKnown, knownModifiedStaffMinutes: modifiedKnown,
      knownBaselineGapMinutes: baselineKnown - required, knownModifiedGapMinutes: modifiedKnown - required,
      comparisonScope: 'known-forecast-intervals-only',
    },
    warnings: ['דוח סינתטי ללא פרסום או יצוא.'],
  };
}
describe('Exact synthetic staffing/forecast report', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start() {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast');
  }
  function submit(element: HTMLElement) { element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click(); }

  it('gates reads and displays seven exact minutes with 0.47 display-only equivalence and known-only totals', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/reports/staffing-forecast');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('fromLocal')).toBe('2026-10-14T08:00:00');
    request.flush({ ...marker, ...metadata, item: sample() });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const cells = element.querySelector('tbody tr')?.querySelectorAll('td');
    expect(cells?.[4]?.textContent).toBe('7');
    expect(cells?.[5]?.textContent?.trim()).toBe('0.47');
    expect(element.querySelector('.summary')?.textContent).toContain('157');
    expect(element.querySelector('.summary')?.textContent).toContain('-53');
    expect(element.querySelectorAll('tbody tr').length).toBe(8);
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(2);
    http.expectNone(request => request.method !== 'GET');
  });

  it('keeps unknown demand and gaps distinct from zero demand, without manufacturing a full-window comparison', async () => {
    const fixture = start(); initialize().flush({ ...marker, ...metadata, item: sample() }); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[3]?.querySelectorAll('td')[6]?.textContent).toBe('לא ידוע');
    expect(rows[3]?.querySelectorAll('td')[8]?.textContent?.trim()).toBe('לא ידוע');
    expect(rows[5]?.querySelectorAll('td')[6]?.textContent).toBe('0');
    submit(element);
    http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast')
      .flush({ ...marker, ...metadata, item: sample(true, true) });
    await fixture.whenStable();
    expect(element.textContent).toContain('אין מידע תחזית ידוע');
    expect(element.querySelector('.summary')?.textContent).not.toContain('פער שינוי ידוע');
  });

  it('submits deduction filters explicitly and displays gross staffing when both are disabled', async () => {
    const fixture = start(); initialize().flush({ ...marker, ...metadata, item: sample() }); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(input => input.click());
    submit(element);
    const request = http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast');
    expect(request.request.params.get('includeBreaks')).toBe('false');
    expect(request.request.params.get('includeExceptions')).toBe('false');
    request.flush({ ...marker, ...metadata, item: sample(false) });
    await fixture.whenStable();
    expect(element.querySelector('.summary')?.textContent).toContain('202');
    expect(element.textContent).toContain('הפסקות מנוכות: לא');
  });

  it('rejects inconsistent sums, reordered intervals or wrong source scope instead of showing a plausible report', async () => {
    const fixture = start(); initialize().flush({ ...marker, ...metadata, item: sample() }); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const valid = sample();
    for (const item of [
      { ...valid, totals: { ...valid.totals, knownModifiedGapMinutes: 999 } },
      { ...valid, intervals: [...valid.intervals].reverse() },
      { ...valid, unitId: 'synthetic-team-b' },
      { ...valid, query: { ...valid.query, includeExceptions: false } },
      { ...valid, intervals: valid.intervals.slice(1) },
      { ...valid, totals: { ...valid.totals, knownRequiredMinutes: Number.MAX_SAFE_INTEGER + 1 } },
      { ...valid, intervals: valid.intervals.map((row, index) => index === 0 ? { ...row, modifiedAvailableMinutes: '7' } : row) },
    ]) {
      submit(element);
      http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast').flush({ ...marker, ...metadata, item });
      await fixture.whenStable();
      expect(element.querySelector('tbody')).toBeNull();
      expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    }
  });

  it('rejects non-quarter times and windows above four hours locally before requesting data', async () => {
    const fixture = start(); initialize().flush({ ...marker, ...metadata, item: sample() }); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const from = element.querySelector<HTMLInputElement>('#report-from-time');
    const to = element.querySelector<HTMLInputElement>('#report-to-time');
    if (!from || !to) { throw new Error('Missing report time fields.'); }
    from.value = '08:01'; from.dispatchEvent(new Event('input')); submit(element);
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/reports/staffing-forecast');
    expect(element.textContent).toContain('בגבולות רבע שעה');
    from.value = '08:00'; from.dispatchEvent(new Event('input'));
    to.value = '12:15'; to.dispatchEvent(new Event('input')); submit(element);
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/reports/staffing-forecast');
    to.value = '10:00'; to.dispatchEvent(new Event('input'));
    const date = element.querySelector<HTMLInputElement>('#report-from-date');
    if (!date) { throw new Error('Missing report calendar field.'); }
    date.value = '2026-02-30'; date.dispatchEvent(new Event('input')); submit(element);
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/reports/staffing-forecast');
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('cancels superseded report requests, clears stale rows on failure and retains calendar inputs', async () => {
    const fixture = start(); const older = initialize(); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    expect(older.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast')
      .flush({ ...marker, ...metadata, item: sample() });
    await fixture.whenStable();
    submit(element);
    http.expectOne(request => request.url === '/api/v1/reports/staffing-forecast').flush(
      { ...marker, title: 'מקור ההדגמה אינו זמין לטווח.' }, { status: 503, statusText: 'Unavailable' },
    );
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('מקור ההדגמה אינו זמין');
    expect(element.querySelector<HTMLInputElement>('#report-from-date')?.value).toBe('2026-10-14');
  });

  it('refuses unmarked capabilities and reports without silently falling back to fabricated staffing', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/reports/staffing-forecast');
    const element: HTMLElement = fixture.nativeElement;
    const retry = [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('ניסיון נוסף'));
    retry?.click();
    initialize().flush({ ...marker, ...metadata, synthetic: false, item: sample() });
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });
});
