import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { routes } from './routes';
import { CurrentShiftsPage } from './current-shifts-page';
import { ShiftDayPage } from './shift-day-page';
import { CivilDateAdapter, dateWire } from './civil-date-adapter';
import { currentList, filterContext, currentProblem, coherentSource } from './current-shifts-contract';
import { contextFixture, listFixture, listRowFixture } from './current-shifts-fixtures';
import { fixtureIdentity, fixtureRow } from './test-fixtures';
import { MinutePicker } from './minute-picker';
import { ListNavigation } from './list-navigation';

describe('SHF-IMPL-UI-01 current list — Angular / mocked HTTP', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: CurrentShiftsPage;
  const render = () => harness.detectChanges();
  const dom = () => harness.routeNativeElement!;
  const settle = async () => { await new Promise(r => setTimeout(r, 0)); render(); };
  const request = () => http.expectOne(r => r.url === '/api/v1/current-shifts');
  const ready = () => {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity()); render();
    http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture()); render();
  };
  const success = () => { ready(); request().flush(listFixture()); render(); };
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl('/current-shifts', CurrentShiftsPage); render();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.inject(MatDialog).closeAll(); });

  it('identity then context then exact no-store GET; no browser defaults, catalog labels are distinct', async () => {
    expect(page.context()).toBeNull(); expect(page.form.controls.date.value).toBeNull();
    ready();
    const r = request();
    expect(r.request.method).toBe('GET'); expect(r.request.body).toBeNull(); expect(r.request.cache).toBe('no-store');
    expect(r.request.params.keys().sort()).toEqual(['attendanceDate', 'currentTime', 'limit', 'mode', 'mokedCode', 'offset', 'sort']);
    expect(r.request.params.get('mokedCode')).toBe('P01');
    expect(r.request.params.get('attendanceDate')).toBe('2026-10-15');
    r.flush(listFixture()); await settle();
    expect(dom().textContent).toContain('צוות בדיקה');
    expect(dom().textContent).toContain('מוקד בדיקה');
    expect(dom().querySelectorAll('thead th')).toHaveLength(10);
    expect(dom().querySelector('#filter-date')?.getAttribute('dir')).toBe('ltr');
    expect(dom().textContent).toContain('14/10/2026');
    expect(dom().textContent).toContain('15/10/2026');
    expect(page.result()?.items[0].startLocal).toBe('2026-10-14T23:30:11');
  });
  it('root is the business list, not the diagnostic ID page', async () => {
    ready(); request().flush(listFixture());
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/current-shifts');
  });
  it('strict calendar parsing never accepts US order, leniency or fallback to today', () => {
    const adapter = dom() && harness.routeDebugElement!.injector.get(DateAdapter) as CivilDateAdapter;
    for (const bad of ['2/10/2026', '10/15/2026', '31/02/2026', ' 15/10/2026', '00/01/2026', '15/10/0000']) {
      expect(adapter.isValid(adapter.parse(bad)!)).toBe(false);
    }
    expect(dateWire(adapter.parse('29/02/2024')!)).toBe('2024-02-29');
    expect(dateWire(adapter.parse('01/01/0001')!)).toBe('0001-01-01');
    ready(); request().flush(listFixture());
  });
  it('invalid time/date stay entered, linked errors and focus, zero list GET', () => {
    success();
    for (const time of ['24:00', '8:07', '', '10:00:00', ' 08:07']) {
      page.form.controls.time.setValue(time); page.search(); render();
      expect(page.form.controls.time.value).toBe(time);
      expect(document.activeElement?.id).toBe('filter-time');
      http.expectNone(r => r.url === '/api/v1/current-shifts');
      page.openTime(); expect(page.pickerOpen()).toBe(false);
    }
    page.form.controls.date.setValue(null); page.search(); render();
    expect(document.activeElement?.id).toBe('filter-date');
    expect(dom().querySelector('#filter-date')?.getAttribute('aria-describedby')).toContain('mat-mdc-error');
  });
  it('all-authorized omits parent; current omits civil date/time, server minute drives display, no polling', () => {
    success();
    page.form.controls.moked.setValue(null); page.toggleCurrent(true); render();
    const r = request();
    expect(r.request.params.get('mode')).toBe('current');
    expect(r.request.params.has('attendanceDate')).toBe(false);
    expect(r.request.params.has('currentTime')).toBe(false);
    expect(r.request.params.has('mokedCode')).toBe(false);
    const value = listFixture(); value.applied = { ...value.applied, requestedMode: 'current', mokedCode: null, currentTime: '08:07' };
    r.flush(value); render();
    expect(page.form.controls.time.value).toBe('08:07');
    expect(page.form.controls.time.disabled).toBe(true);
    expect(dom().textContent).toContain('מצב נוכחי הוערך');
    http.expectNone(r => r.url === '/api/v1/current-shifts');
    page.toggleCurrent(false);
    http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture());
    request().flush(listFixture()); render();
    expect(page.form.controls.time.value).toBe('10:00'); expect(page.form.controls.time.enabled).toBe(true);
  });
  it('minute picker exposes all 24/60 values; cancel preserves input; apply commits exact 08:07', async () => {
    success(); page.form.controls.time.setValue('23:59'); page.openTime(); render();
    const dialog = TestBed.inject(MatDialog).openDialogs[0];
    const picker = dialog.componentInstance as MinutePicker;
    expect(picker.hours).toHaveLength(24); expect(picker.minutes).toHaveLength(60);
    expect(picker.hour).toBe('23'); expect(picker.minute).toBe('59');
    dialog.close(); await settle();
    expect(page.form.controls.time.value).toBe('23:59');
    page.openTime(); render();
    const next = TestBed.inject(MatDialog).openDialogs[0]; next.close('08:07'); await settle();
    expect(page.form.controls.time.value).toBe('08:07');
    expect(page.pickerOpen()).toBe(false);
  });
  it('empty is real 200; missing reason has priority, not an absence inference; unresolved labels stay explicit', () => {
    ready(); request().flush(listFixture([])); render();
    expect(page.state()).toBe('empty'); expect(dom().querySelector('table')).toBeNull();
    page.search();
    const row = listRowFixture(); row.attendanceDisplay = { kind: 'missing-reason', reason: { code: '2', label: 'סיבת בדיקה' } };
    request().flush(listFixture([row])); render();
    expect(dom().querySelector('.reason')?.textContent).toBe('סיבת בדיקה');
    expect(dom().textContent).toContain('תיאור לא זמין (קוד A)');
    expect(dom().textContent).not.toContain('נעדר');
  });
  it('current next page freezes server minute in at-mode; offset ceiling explained with no fake total', () => {
    success(); page.toggleCurrent(true);
    const first = listFixture(Array.from({ length: 25 }, (_, n) => listRowFixture(String(2001 + n))));
    first.applied.requestedMode = 'current'; first.page.hasMore = true; first.page.nextOffset = 25;
    request().flush(first); render();
    page.page(25);
    const r = request();
    expect(r.request.params.get('mode')).toBe('at'); expect(r.request.params.get('currentTime')).toBe('10:00');
    expect(r.request.params.get('offset')).toBe('25');
    const second = listFixture(); second.page.offset = 25; r.flush(second); render();
    expect(page.evaluatedCurrent()).toBe(true);
    expect(dom().querySelector('#next-page')?.hasAttribute('disabled')).toBe(true);
  });
  it('filter edits cancel pending A; B success cannot be replaced by A', () => {
    ready(); const a = request();
    page.form.controls.time.setValue('11:00'); render();
    expect(a.cancelled).toBe(true); expect(page.result()).toBeNull();
    page.search(); const b = request();
    const row = listFixture(); row.applied.currentTime = '11:00'; b.flush(row); render();
    expect(page.result()?.applied.currentTime).toBe('11:00');
  });
  for (const status of [200, 503]) {
    it(`current refresh keeps exact button focus pending/terminal ${status}, with one request`, async () => {
      success(); page.toggleCurrent(true);
      const current = listFixture(); current.applied.requestedMode = 'current';
      request().flush(current); render();
      const button = dom().querySelector<HTMLButtonElement>('#list-refresh')!;
      button.focus(); button.click(); render();
      const pending = request();
      expect(button.disabled).toBe(false); expect(button.getAttribute('aria-busy')).toBe('true');
      expect(document.activeElement).toBe(button); expect(page.result()).toBeNull();
      button.click(); button.click(); http.expectNone(r => r.url === '/api/v1/current-shifts');
      if (status === 200) pending.flush(current);
      else pending.flush({ type: 'urn:shf:problem:DEPENDENCY_TIMEOUT', status: 503, code: 'DEPENDENCY_TIMEOUT', title: 'Synthetic', requestId: 'refresh-test' }, { status, statusText: 'Timeout' });
      await settle();
      expect(dom().querySelector('#list-refresh')).toBe(button); expect(document.activeElement).toBe(button);
      expect(button.getAttribute('aria-busy')).toBe('false');
    });
  }
  for (const status of [400, 401, 403, 500, 503]) {
    it(`${status} failure is explicit, input retained, no success/fallback/auto retry`, () => {
      ready();
      const code = ({ 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 500: 'INVALID_SOURCE_DATA', 503: 'DEPENDENCY_TIMEOUT' } as Record<number, string>)[status];
      request().flush({ type: `urn:shf:problem:${code}`, status, code, title: '<script>secret</script>', requestId: 'test-error' }, { status, statusText: 'Synthetic' });
      render();
      expect(page.state()).toBe('error'); expect(page.result()).toBeNull();
      expect(dom().textContent).not.toContain('secret'); expect(page.form.controls.time.value).toBe('10:00');
      expect(page.canRead()).toBe(![401, 403].includes(status));
      http.expectNone(r => r.url === '/api/v1/current-shifts');
    });
  }
  it('absent/failed identity never calls context/list and never creates Admin', () => {
    http.expectOne('/api/v1/identity').flush({}, { status: 503, statusText: 'No identity' }); render();
    expect(page.principal()).toBeNull(); page.search(); page.retry();
    http.expectNone('/api/v1/current-shifts/filter-context');
  });
  it('real principal without list capability never loads context, despite Administrator label', () => {
    const value = fixtureIdentity(); value.principal.synthetic = false; value.principal.provider = 'real';
    value.principal.capabilities = ['shift-day:read'];
    http.expectOne('/api/v1/identity').flush(value); render();
    expect(page.canRead()).toBe(false); http.expectNone('/api/v1/current-shifts/filter-context');
  });
  it('malformed/mismatched success fails closed, no partial row', () => {
    ready(); const bad = listFixture(); bad.applied.currentTime = '11:00';
    request().flush(bad); render(); expect(page.result()).toBeNull(); expect(page.state()).toBe('error');
    page.retry(); const bad2 = listFixture(); bad2.items[0].employee.unit.moked.code = 'UNKNOWN';
    request().flush(bad2); render(); expect(page.result()).toBeNull();
  });
  it('approved Oracle source-name pair stays explicit and synthetic identity is still labeled', () => {
    const identity = fixtureIdentity(); identity.dataSource = 'oracle';
    http.expectOne('/api/v1/identity').flush(identity);
    http.expectOne('/api/v1/current-shifts/filter-context').flush({ ...contextFixture(), dataSource: 'oracle-read-only' });
    request().flush({ ...listFixture(), dataSource: 'oracle-read-only' }); render();
    expect(page.state()).toBe('success');
    expect(dom().textContent).toContain('Oracle TEST — קריאה בלבד');
    expect(dom().textContent).toContain('מנהל מערכת סינתטי');
    expect(dom().textContent).toContain('לא בוצע אימות סיסמה אמיתית');
  });
  it('fixture identity plus Oracle context fails before any list GET', () => {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/current-shifts/filter-context').flush({ ...contextFixture(), dataSource: 'oracle-read-only' }); render();
    expect(page.result()).toBeNull(); expect(page.state()).toBe('error');
    http.expectNone(r => r.url === '/api/v1/current-shifts');
  });
  it('bounded window stops at offset ceiling even when the server reports more', () => {
    success(); page.page(10000);
    const value = listFixture(Array.from({ length: 25 }, (_, n) => listRowFixture(String(2001 + n))));
    value.page = { limit: 25, offset: 10000, hasMore: true, nextOffset: null };
    request().flush(value); render();
    expect(dom().textContent).toContain('הגעת לגבול חלון התוצאות');
    expect(dom().querySelector<HTMLButtonElement>('#next-page')!.disabled).toBe(true);
    page.page(10025); http.expectNone(r => r.url === '/api/v1/current-shifts');
  });
  it('list detail uses exact IDs; supported back restores page/filter/opener context without external URL', async () => {
    success();
    const link = dom().querySelector<HTMLAnchorElement>('#detail-2001')!;
    expect(link.getAttribute('href')).toBe('/employees/1001/shift-days/2001');
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    link.click(); await harness.fixture.whenStable(); render();
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/employees/1001/shift-days/2001').flush(fixtureRow()); render();
    expect(dom().querySelector('#back-action')?.textContent).toContain('חזרה למשמרות נוכחיות');
    dom().querySelector<HTMLButtonElement>('#back-action')!.click();
    await harness.fixture.whenStable(); render();
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture());
    request().flush(listFixture()); await settle();
    expect(TestBed.inject(Router).url).toBe('/current-shifts');
    expect(document.activeElement?.id).toBe('detail-2001');
    spy.mockRestore();
  });
  it('detail ID inputs are a secondary collapsed disclosure, not primary navigation', async () => {
    ready(); request().flush(listFixture());
    await harness.navigateByUrl('/shift-day', ShiftDayPage);
    http.expectOne('/api/v1/identity').flush(fixtureIdentity()); render();
    expect(dom().querySelector<HTMLDetailsElement>('#diagnostic-context')!.open).toBe(false);
    dom().querySelector<HTMLButtonElement>('.state-panel button')!.click(); render();
    expect(dom().querySelector<HTMLDetailsElement>('#diagnostic-context')!.open).toBe(true);
    expect(document.activeElement?.id).toBe('employeeId');
  });
  it('fresh back-page without original row focuses real results, not a fabricated opener', async () => {
    success();
    const navigation = TestBed.inject(ListNavigation);
    navigation.origin = { request: { mode: 'at', attendanceDate: '2026-10-15', currentTime: '10:00',
      mokedCode: 'P01' }, evaluatedCurrent: false, scroll: 0, tableScroll: 0,
      opener: 'detail-2001', employeeId: '1001', shiftDayId: '2001',
      unit: { code: 'TEST-U', label: 'צוות בדיקה', parentLabel: 'מוקד בדיקה' } };
    await harness.navigateByUrl('/shift-day', ShiftDayPage);
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    navigation.returning = true;
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    await harness.navigateByUrl('/current-shifts', CurrentShiftsPage);
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture());
    request().flush(listFixture([])); await settle();
    expect(document.activeElement?.id).toBe('results-heading');
    expect(dom().querySelector('#detail-2001')).toBeNull();
    expect(dom().querySelector('[role="status"]')?.textContent).toContain('הרשומה המקורית אינה מופיעה');
    scroll.mockRestore();
  });
});

describe('current wire runtime boundary', () => {
  it('strict context catalog, page, date and problem validation', () => {
    expect(filterContext(contextFixture())).toBe(true);
    const context = contextFixture(); context.mokedOptions[0].unitType = 'J01' as 'G01';
    expect(filterContext(context)).toBe(false);
    const query = { mode: 'at' as const, attendanceDate: '2026-10-15', currentTime: '10:00', mokedCode: 'P01' };
    expect(currentList(listFixture(), query, contextFixture())).toBe(true);
    const list = listFixture(); list.page.nextOffset = 25;
    expect(currentList(list, query, contextFixture())).toBe(false);
    expect(currentProblem({ type: 'urn:shf:problem:INTERNAL_ERROR', code: 'INTERNAL_ERROR', status: 503, title: 'x', requestId: 'x' }, 503)).toBe(false);
  });
  it('source names map exactly; no fixture/Oracle mixing or unknown source alias', () => {
    expect(coherentSource('oracle', 'oracle-read-only')).toBe(true);
    expect(coherentSource('isolated-fixture', 'isolated-fixture')).toBe(true);
    for (const pair of [['oracle', 'isolated-fixture'], ['isolated-fixture', 'oracle-read-only'],
      ['oracle', 'oracle'], ['anything', 'oracle-read-only']]) expect(coherentSource(...pair as [string, string])).toBe(false);
  });
});
