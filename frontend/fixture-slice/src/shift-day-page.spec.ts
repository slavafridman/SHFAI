import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { ShiftDayPage } from './shift-day-page';
import { fixtureIdentity, fixtureProblem, fixtureRow } from './test-fixtures';

describe('UI02 single shift-day page (Angular + mocked HTTP, jsdom)', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let page: ShiftDayPage;
  const url = '/api/v1/employees/1001/shift-days/2001';
  const render = () => harness.detectChanges();
  const dom = () => harness.routeNativeElement!;
  const text = () => dom().textContent!;
  const settle = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    render();
  };
  function ready() {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    render();
  }
  function enter(employeeId = '1001', shiftDayId = '2001') {
    page.form.setValue({ employeeId, shiftDayId });
    page.submit();
    render();
  }
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl('/shift-day', ShiftDayPage);
    render();
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('UI02-01/04 initial identity loading permits typing but no requests or default employee', () => {
    expect(page.form.getRawValue()).toEqual({ employeeId: '', shiftDayId: '' });
    expect(page.canRead()).toBe(false);
    page.form.setValue({ employeeId: '1001', shiftDayId: '2001' });
    page.submit();
    http.expectNone(url);
    ready();
    expect(page.principal()?.principal.employeeId).toBeNull();
    expect(text()).toContain('לא בוצע אימות סיסמה אמיתית');
    expect(text()).toContain('מקור נתונים: נתוני הדגמה מבודדים');
    expect(dom().querySelectorAll('h1')).toHaveLength(1);
    expect(dom().querySelectorAll('main')).toHaveLength(1);
    expect(dom().querySelector('.skip')?.getAttribute('href')).toBe('#main');
    expect(dom().querySelector('#employeeId')?.getAttribute('dir')).toBe('ltr');
  });

  it('UI02-01/03/07 exact pair, one GET, URL navigation reuses the page and focuses result', async () => {
    ready();
    enter();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    expect(req.request.params.keys()).toEqual([]);
    req.flush(fixtureRow());
    await settle();
    expect(TestBed.inject(Router).url).toBe('/employees/1001/shift-days/2001');
    expect(page.row()?.employeeId).toBe('1001');
    expect(text()).toContain('15/10/2026 23:30:00');
    expect(text()).toContain('16/10/2026 07:00:00');
    expect(text()).toContain('לא זמין');
    expect(dom().querySelector('#result-heading')).toBe(document.activeElement);
    http.expectNone('/api/v1/identity');
  });

  it('UI02-02/03 invalid submit preserves input and focuses the first invalid field', () => {
    ready();
    for (const invalid of ['', ' ', '01', '+1', '1e2', '١', '1'.repeat(39)]) {
      page.form.setValue({ employeeId: invalid, shiftDayId: '2001' });
      page.submit();
      render();
      expect(page.form.controls.employeeId.value).toBe(invalid);
      expect(page.fieldError('employeeId')).not.toBe('');
      expect(document.activeElement?.id).toBe('employeeId');
      http.expectNone(url);
    }
    expect(dom().querySelector('#employeeId')?.getAttribute('aria-invalid')).toBe('true');
    expect(dom().querySelector('#employeeId')?.getAttribute('aria-describedby')).toContain('employee-error');
    page.form.setValue({ employeeId: '9'.repeat(38), shiftDayId: '9'.repeat(11) });
    page.submit(); render();
    expect(document.activeElement?.id).toBe('shiftDayId');
  });

  it('UI02-02 exact 38-digit ID survives entry, request, result and URL', async () => {
    ready();
    const big = '9'.repeat(38);
    enter(big);
    http.expectOne(`/api/v1/employees/${big}/shift-days/2001`).flush(fixtureRow(big));
    await settle();
    expect(text()).toContain(big);
    expect(page.form.controls.employeeId.value).toBe(big);
    expect(TestBed.inject(Router).url).toContain(big);
  });

  it('UI02-08 identity failure never falls back; explicit retry only', () => {
    http.expectOne('/api/v1/identity').flush({}, { status: 503, statusText: 'Unavailable' });
    render();
    expect(page.principal()).toBeNull();
    expect(page.canRead()).toBe(false);
    expect(text()).toContain('לא ניתן לטעון את פרטי הזהות');
    page.submit();
    http.expectNone(url);
    page.recheckIdentity();
    ready();
    expect(page.canRead()).toBe(true);
  });

  it('UI02-01 missing capability disables submission without expanding Administrator role', () => {
    const value = fixtureIdentity();
    value.principal.provider = 'real';
    value.principal.synthetic = false;
    value.principal.capabilities = [];
    http.expectOne('/api/v1/identity').flush(value);
    enter();
    expect(page.canRead()).toBe(false);
    http.expectNone(url);
    expect(text()).toContain('אין הרשאה להצגת פרטי משמרת');
  });

  for (const [status, code, expected] of [
    [400, 'INVALID_REQUEST', 'יש לבדוק את המזהים'],
    [401, 'UNAUTHENTICATED', 'לא ניתן לאמת את הזהות'],
    [403, 'FORBIDDEN', 'אין הרשאה להצגת פרטי משמרת'],
    [404, 'SHIFT_DAY_NOT_FOUND', 'לא נמצאה רשומה זמינה להקשר שנבחר'],
    [503, 'DEPENDENCY_UNAVAILABLE', 'אפשר לנסות שוב'],
    [503, 'DEPENDENCY_TIMEOUT', 'אפשר לנסות שוב'],
    [500, 'AMBIGUOUS_SHIFT_DAY', 'לא בוצע שינוי בנתונים'],
    [500, 'INVALID_SOURCE_DATA', 'לא בוצע שינוי בנתונים'],
    [500, 'INTERNAL_ERROR', 'לא בוצע שינוי בנתונים'],
  ] as const) {
    it(`UI02-08 handles ${status}/${code} safely, preserves input, no auto retry`, async () => {
      ready(); enter();
      const p = fixtureProblem(status, code);
      p.title = '<script>unsafe server text</script>';
      if (status === 400) p.invalidParameters = [{ name: 'employeeId', reason: 'invalid-format' }];
      http.expectOne(url).flush(p, { status, statusText: 'Synthetic failure' });
      await settle();
      expect(page.row()).toBeNull();
      expect(text()).toContain(expected);
      expect(text()).not.toContain('unsafe server text');
      expect(page.form.controls.employeeId.value).toBe('1001');
      expect(document.activeElement?.id).toBe('error-heading');
      expect(page.canRead()).toBe(![401, 403].includes(status));
      http.expectNone(url);
      if (status === 400) expect(page.form.controls.employeeId.hasError('server')).toBe(true);
    });
  }

  it('UI02-08 network, unknown code/status and non-JSON failures are sanitized', () => {
    ready(); enter();
    http.expectOne(url).error(new ProgressEvent('error'));
    render();
    expect(text()).toContain('אפשר לנסות שוב');
    page.reload();
    http.expectOne(url).flush('<h1>unsafe raw HTML</h1>', { status: 502, statusText: 'Bad Gateway' });
    render();
    expect(text()).not.toContain('unsafe raw HTML');
    expect(page.row()).toBeNull();
    page.reload();
    http.expectOne(url).flush(fixtureProblem(503, 'INTERNAL_ERROR'), { status: 503, statusText: 'Unavailable' });
    render();
    expect(text()).toContain('לא בוצע שינוי בנתונים');
  });

  it('UI02-08 all-null optional fields are a successful record, not empty', () => {
    ready(); enter();
    const row = fixtureRow();
    row.effectiveShift = { startLocal: null, endLocal: null, activityData: null, siteId: null };
    http.expectOne(url).flush(row);
    render();
    expect(page.state()).toBe('success');
    expect(dom().querySelector('.detail-card')).not.toBeNull();
    expect(dom().querySelectorAll('.detail-secondary dd')).toHaveLength(5);
    expect([...dom().querySelectorAll('.detail-secondary dd')].every(n => n.textContent === 'לא זמין')).toBe(true);
  });

  it('UI02-09 duplicate activation suppressed; edits cancel and clear old data immediately', () => {
    ready(); enter();
    const request = http.expectOne(url);
    page.submit(); page.reload();
    http.expectNone(url);
    page.form.controls.employeeId.setValue('1002');
    render();
    expect(request.cancelled).toBe(true);
    expect(page.row()).toBeNull();
    expect(page.state()).toBe('dirty');
    expect(text()).toContain('ההקשר השתנה');
    page.submit();
    http.expectOne('/api/v1/employees/1002/shift-days/2001').flush(fixtureRow('1002'));
    render();
    expect(page.row()?.employeeId).toBe('1002');
  });

  it('UI02-03/09 reload clears old success, keeps focus, never restores stale success on failure', async () => {
    ready(); enter();
    http.expectOne(url).flush(fixtureRow());
    await settle();
    const reload = [...dom().querySelectorAll('button')].find(b => b.textContent?.includes('טעינה מחדש'))!;
    reload.focus(); reload.click(); render();
    expect(page.row()).toBeNull();
    expect(document.activeElement).toBe(reload);
    http.expectOne(url).flush(fixtureProblem(503, 'DEPENDENCY_TIMEOUT'), { status: 503, statusText: 'Timeout' });
    await settle();
    expect(page.row()).toBeNull();
    expect(document.activeElement).toBe(reload);
  });

  for (const status of [200, 503] as const) {
    it(`D01/H01 reload remains focusable pending and after ${status}; repeated activation sends one GET`, async () => {
      ready(); enter();
      http.expectOne(url).flush(fixtureRow());
      await settle();
      const reload = dom().querySelector<HTMLButtonElement>('#reload-action')!;
      reload.focus(); reload.click(); render();
      const pending = http.expectOne(url);
      expect(page.row()).toBeNull();
      expect(reload.disabled).toBe(false);
      expect(reload.getAttribute('aria-disabled')).toBe('true');
      expect(reload.getAttribute('aria-busy')).toBe('true');
      expect(document.activeElement).toBe(reload);
      reload.click(); reload.click(); page.reload(); page.submit(); render();
      http.expectNone(url);
      expect(document.activeElement).toBe(reload);
      if (status === 200) pending.flush(fixtureRow());
      else pending.flush(fixtureProblem(503, 'DEPENDENCY_TIMEOUT'), { status: 503, statusText: 'Timeout' });
      await settle();
      expect(dom().querySelector('#reload-action')).toBe(reload);
      expect(document.activeElement).toBe(reload);
      expect(reload.disabled).toBe(false);
      expect(reload.getAttribute('aria-disabled')).toBe('false');
      expect(reload.getAttribute('aria-busy')).toBe('false');
      expect(page.state()).toBe(status === 200 ? 'success' : 'error');
      http.expectNone(url);
    });
  }

  it('UI02-09 identity recheck invalidates pending detail', () => {
    ready(); enter();
    const request = http.expectOne(url);
    page.recheckIdentity();
    expect(request.cancelled).toBe(true);
    expect(page.row()).toBeNull();
    ready();
    http.expectNone(url);
  });

  it('UI02-01/09 direct URL/history pair waits for identity, and navigation clears pending context', async () => {
    ready();
    await harness.navigateByUrl('/employees/1002/shift-days/2002');
    const a = http.expectOne('/api/v1/employees/1002/shift-days/2002');
    await harness.navigateByUrl('/employees/1001/shift-days/2001');
    expect(a.cancelled).toBe(true);
    http.expectOne(url).flush(fixtureRow());
    render();
    expect(page.form.getRawValue()).toEqual({ employeeId: '1001', shiftDayId: '2001' });
    await harness.navigateByUrl('/shift-day');
    render();
    expect(page.row()).toBeNull();
    expect(page.form.controls.employeeId.value).toBe('');
  });

  it('UI02-01 malformed direct URL is local error; zero detail calls', async () => {
    ready();
    await harness.navigateByUrl('/employees/01/shift-days/2001');
    render();
    expect(page.invalidRoute()).toBe(true);
    expect(text()).toContain('הקשר לא תקין');
    expect(dom().querySelector('a[href="/shift-day"]')?.textContent).toContain('בחירת הקשר חדש');
  });

  for (const mutation of [
    (v: ReturnType<typeof fixtureRow>) => { v.employeeId = '1002'; },
    (v: ReturnType<typeof fixtureRow>) => { v.shiftDayId = '2002'; },
    (v: ReturnType<typeof fixtureRow>) => { v.dataSource = 'oracle'; },
    (v: ReturnType<typeof fixtureRow>) => { v.effectiveShift.startLocal = '2026-02-30T12:00:00'; },
  ]) {
    it('UI02-10 invalid/mismatched 200 never exposes partial data', () => {
      ready(); enter();
      const value = fixtureRow(); mutation(value);
      http.expectOne(url).flush(value);
      render();
      expect(page.row()).toBeNull();
      expect(text()).toContain('התקבלה תשובה שאינה תואמת לבקשה');
    });
  }

  it('UI02-05/07/10 long mixed-direction content and markup remain exact plain text', () => {
    ready(); enter();
    const value = fixtureRow();
    value.employee.firstName = 'א'.repeat(40);
    value.effectiveShift.activityData = '<img src=x onerror=alert(1)>;אב TEST';
    http.expectOne(url).flush(value);
    render();
    expect(text()).toContain(value.employee.firstName);
    expect(text()).toContain(value.effectiveShift.activityData);
    expect(dom().querySelector('img')).toBeNull();
    expect(dom().querySelector('.raw')?.textContent).toBe(value.effectiveShift.activityData);
  });

  it('UI02-10 unexpected identity source or invalid synthetic employee never authorizes detail', () => {
    const value = fixtureIdentity();
    value.dataSource = 'unapproved-source' as 'oracle';
    http.expectOne('/api/v1/identity').flush(value);
    enter();
    expect(page.canRead()).toBe(false);
    http.expectNone(url);
    page.recheckIdentity();
    const bad = fixtureIdentity(); bad.principal.employeeId = '1001';
    http.expectOne('/api/v1/identity').flush(bad);
    expect(page.principal()).toBeNull();
    expect(page.canRead()).toBe(false);
  });
});
