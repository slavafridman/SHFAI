import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { ShiftSearchPage } from './shift-search-page';
import { ShiftDayPage } from './shift-day-page';
import { searchContext, searchList, searchProblem } from './shift-search-contract';
import { searchContextFixture, searchListFixture, searchRequestFixture, searchRowFixture } from './shift-search-fixtures';
import { fixtureIdentity, fixtureRow } from './test-fixtures';
import { MinutePicker } from './minute-picker';
import { identity } from './contract';

describe('SHF-SEARCH-UI-18 Angular / synthetic HTTP', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: ShiftSearchPage;
  const render = () => harness.detectChanges();
  const dom = () => harness.routeNativeElement!;
  const settle = async () => { await new Promise(r => setTimeout(r, 0)); render(); };
  const request = () => http.expectOne(r => r.url === '/api/v1/shift-search');
  const ready = () => {
    const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds.push('TEST-V');
    http.expectOne('/api/v1/identity').flush(p);
    const ctx = http.expectOne('/api/v1/shift-search/filter-context');
    expect(ctx.request.params.keys()).toEqual([]); expect(ctx.request.body).toBeNull();
    ctx.flush(searchContextFixture()); render();
  };
  const success = () => { ready(); page.search(); request().flush(searchListFixture()); render(); };
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl('/shift-search', ShiftSearchPage); render();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.inject(MatDialog).closeAll(); });
  it('loads only context until explicit search, exact no-store GET, equal bounds and effective link', () => {
    ready(); http.expectNone(r => r.url === '/api/v1/shift-search');
    page.search(); const r = request();
    expect(r.request.method).toBe('GET'); expect(r.request.body).toBeNull(); expect(r.request.cache).toBe('no-store');
    expect(r.request.params.keys().sort()).toEqual(['attendanceDate', 'limit', 'offset', 'sort', 'timeFrom', 'timeTo']);
    r.flush(searchListFixture()); render();
    expect(dom().querySelector('#search-detail-3001')?.getAttribute('href')).toBe('/employees/1001/shift-days/3001');
    expect(dom().querySelectorAll('.indicators li')).toHaveLength(7);
    expect(dom().textContent).toContain('תיאור לא זמין (קוד B)');
    expect(dom().textContent).toContain('16/10/2026');
    expect(dom().querySelectorAll('thead th')).toHaveLength(10);
  });
  it('real capabilities are independent; synthetic requires four ordered capabilities', () => {
    const p = fixtureIdentity(); p.principal.provider = 'real'; p.principal.synthetic = false;
    p.principal.capabilities = ['current-shifts:read']; expect(identity(p)).toBe(true);
    http.expectOne('/api/v1/identity').flush(p); render();
    expect(page.canRead()).toBe(false); expect(page.state()).toBe('error');
    http.expectNone('/api/v1/shift-search/filter-context');
    expect(dom().querySelector('a[href="/shift-search"]')).toBeNull();
    const s = fixtureIdentity(); s.principal.capabilities.reverse(); expect(identity(s)).toBe(false);
  });
  it('D01 marks only complete date/time tokens as nonbreaking, preserving separate date lines and text wrapping', () => {
    success();
    const tokens = [...dom().querySelectorAll<HTMLElement>('tbody .date-time-token')];
    expect(tokens.map(t => t.textContent)).toEqual(['15/10/2026', '10:00:00', '01:00:13', '16/10/2026']);
    expect(tokens.every(t => t.tagName === 'BDI' && t.dir === 'ltr')).toBe(true);
    expect(tokens.filter(t => t.classList.contains('cell-note'))).toHaveLength(2);
    expect(dom().querySelector('tbody th .date-time-token')).toBeNull();
    expect(dom().querySelector('.activity-line .date-time-token')).toBeNull();
    for (const token of tokens) {
      expect(getComputedStyle(token).whiteSpace).toBe('nowrap');
      expect(getComputedStyle(token).overflowWrap).toBe('normal');
    }
  });
  it('search-only principal gets search but no detail links', () => {
    const p = fixtureIdentity(); p.principal.provider = 'real'; p.principal.synthetic = false; p.principal.capabilities = ['shift-search:read'];
    p.principal.resourceScope.orgUnitIds.push('TEST-V');
    http.expectOne('/api/v1/identity').flush(p); http.expectOne('/api/v1/shift-search/filter-context').flush(searchContextFixture());
    page.search(); request().flush(searchListFixture()); render();
    expect(dom().querySelector('.row-link')).toBeNull(); expect(page.result()).not.toBeNull();
  });
  it('absent/malformed identity fails closed without context or Administrator fallback', () => {
    http.expectOne('/api/v1/identity').flush({}); render();
    expect(page.principal()).toBeNull(); expect(page.canRead()).toBe(false); expect(page.context()).toBeNull();
  });
  it('raw malformed/reversed minutes preserve input and focus first invalid, no GET; correcting from clears range', () => {
    ready();
    for (const invalid of ['9:05', '24:00', '12:60', ' 08:07', '08:07:00']) {
      page.form.controls.timeFrom.setValue(invalid); page.search(); render();
      expect(page.form.controls.timeFrom.value).toBe(invalid); expect(document.activeElement?.id).toBe('search-timeFrom');
      http.expectNone(r => r.url === '/api/v1/shift-search');
    }
    page.form.controls.timeFrom.setValue('10:01'); page.search(); render();
    expect(document.activeElement?.id).toBe('search-timeTo'); expect(page.form.controls.timeTo.hasError('range')).toBe(true);
    page.form.controls.timeFrom.setValue('10:00'); page.search(); request().flush(searchListFixture());
  });
  it('both independent picker targets use all 24 hours/60 minutes and restore exact opener', async () => {
    ready();
    for (const target of ['timeFrom', 'timeTo'] as const) {
      for (const value of ['23:59', '00:00', '08:07']) {
        const other = target === 'timeFrom' ? 'timeTo' : 'timeFrom', before = page.form.controls[other].value;
        page.openTime(target); render(); const dialog = TestBed.inject(MatDialog).openDialogs[0];
        const picker = dialog.componentInstance as MinutePicker;
        expect(picker.hours).toHaveLength(24); expect(picker.minutes).toHaveLength(60);
        dialog.close(value); await settle();
        expect(page.form.controls[target].value).toBe(value); expect(page.form.controls[other].value).toBe(before);
        expect(document.activeElement?.id).toBe(`search-${target}-open`);
      }
    }
    page.openTime('timeTo'); TestBed.inject(MatDialog).openDialogs[0].close(); await settle();
    expect(page.form.controls.timeTo.value).toBe('08:07');
  });
  it('named parent/catalog subsets; change parent clears all teams and rows, optional list wire uses single comma key', () => {
    success(); page.form.controls.teamCodes.setValue(['TEST-U', 'TEST-V']);
    page.form.controls.moked.setValue('P01'); expect(page.form.controls.teamCodes.value).toEqual([]);
    expect(page.teams().map(t => t.code)).toEqual(['TEST-U']); expect(page.result()).toBeNull();
    page.form.patchValue({ teamCodes: ['TEST-U'], innerJobCodes: ['1'], workLocations: ['home', 'site'] });
    page.search(); const r = request(); expect(r.request.params.getAll('workLocations')).toEqual(['home,site']);
    const req = { ...searchRequestFixture(), mokedCode: 'P01', teamCodes: ['TEST-U'], innerJobCodes: ['1'], workLocations: ['home', 'site'] as ('home' | 'site')[] };
    r.flush(searchListFixture(req)); render(); expect(page.state()).toBe('success');
  });
  it('edit cancels stale requests and navigation snapshot; late A cannot replace B', () => {
    ready(); page.search(); const a = request();
    page.form.controls.timeTo.setValue('23:59'); expect(a.cancelled).toBe(true);
    page.search(); const b = request(); b.flush(searchListFixture({ ...searchRequestFixture(), timeTo: '23:59' })); render();
    expect(page.result()?.applied.timeTo).toBe('23:59');
    page.form.controls.timeTo.setValue('10:00'); expect(page.result()).toBeNull();
  });
  it('400 maps timeTo without losing input; 503 explicit retry; 403 invalidates catalogue', async () => {
    ready(); page.search();
    const problem = (status: number, code: string) => ({ status, code, type: `urn:shf:problem:${code}`, title: 'Synthetic', requestId: 'search-test' });
    request().flush({ ...problem(400, 'INVALID_REQUEST'), invalidParameters: [{ name: 'timeTo', reason: 'invalid-format' }] }, { status: 400, statusText: 'Bad Request' });
    await settle(); expect(document.activeElement?.id).toBe('search-timeTo'); expect(page.form.controls.timeTo.value).toBe('10:00');
    page.form.controls.timeTo.setValue('10:00'); page.search();
    request().flush(problem(503, 'DEPENDENCY_TIMEOUT'), { status: 503, statusText: 'Unavailable' }); render();
    expect(page.state()).toBe('error'); expect(page.context()).not.toBeNull(); page.retry();
    request().flush(problem(403, 'FORBIDDEN'), { status: 403, statusText: 'Forbidden' }); render();
    expect(page.context()).toBeNull(); expect(page.result()).toBeNull(); expect(page.canRead()).toBe(false);
  });
  it('source mismatch/malformed list and malformed context fail closed', () => {
    ready(); page.search(); const v = searchListFixture(); v.dataSource = 'oracle-read-only'; request().flush(v); render();
    expect(page.state()).toBe('error'); expect(page.result()).toBeNull();
    page.loadContext(); const c = searchContextFixture(); c.dataSource = 'oracle-read-only';
    http.expectOne('/api/v1/shift-search/filter-context').flush(c); render(); expect(page.context()).toBeNull();
  });
  it('empty and stable paging never invent total; ceiling hasMore with null next is valid', () => {
    ready(); page.search(); const value = searchListFixture(searchRequestFixture(), Array.from({ length: 25 }, (_, i) => searchRowFixture(String(3001 + i))));
    value.page.hasMore = true; value.page.nextOffset = 25; request().flush(value);
    page.page(25); const next = request(); expect(next.request.params.get('offset')).toBe('25');
    next.flush(searchListFixture({ ...searchRequestFixture(), offset: 25 }, [])); render();
    expect(page.state()).toBe('empty'); expect(dom().querySelector('#search-prev')?.hasAttribute('disabled')).toBe(false);
    expect(dom().textContent).toContain('ללא ספירה כוללת');
  });
  it('invalid/inactive role 400 invalidates catalogue, retains draft, rechecks without silently broadening', () => {
    ready(); page.form.controls.innerJobCodes.setValue(['1']); page.search();
    request().flush({ status: 400, code: 'INVALID_REQUEST', type: 'urn:shf:problem:INVALID_REQUEST',
      title: 'Synthetic', requestId: 'catalog', invalidParameters: [{ name: 'innerJobCodes', reason: 'invalid-format' }] },
      { status: 400, statusText: 'Bad Request' });
    expect(page.context()).toBeNull(); expect(page.form.getRawValue().innerJobCodes).toEqual(['1']);
    page.retry(); const ctx = searchContextFixture(); ctx.innerJobOptions = [];
    http.expectOne('/api/v1/shift-search/filter-context').flush(ctx); render();
    expect(page.unavailable()).toBe(true); expect(page.state()).toBe('error');
    http.expectNone(r => r.url === '/api/v1/shift-search');
    page.clearUnavailable(); expect(page.form.controls.innerJobCodes.value).toEqual([]);
    expect(page.state()).toBe('dirty'); expect(page.result()).toBeNull();
  });
  it('context cannot invent a team grant, even under an authorized parent or Administrator role', () => {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/shift-search/filter-context').flush(searchContextFixture()); render();
    expect(page.context()).toBeNull(); expect(page.canRead()).toBe(true); expect(page.state()).toBe('error');
    page.search(); http.expectNone(r => r.url === '/api/v1/shift-search');
  });
  it('Oracle identity maps only to oracle-read-only search, never fixture fallback', () => {
    const p = fixtureIdentity(); p.dataSource = 'oracle'; p.principal.resourceScope.orgUnitIds.push('TEST-V');
    http.expectOne('/api/v1/identity').flush(p);
    const ctx = searchContextFixture(); ctx.dataSource = 'oracle-read-only';
    http.expectOne('/api/v1/shift-search/filter-context').flush(ctx);
    page.search(); const value = searchListFixture(); value.dataSource = 'oracle-read-only'; request().flush(value); render();
    expect(page.state()).toBe('success'); expect(dom().textContent).toContain('Oracle TEST');
  });
  for (const code of ['AMBIGUOUS_SHIFT_SEARCH', 'INVALID_SOURCE_DATA', 'INTERNAL_ERROR']) {
    it(`500 ${code} clears rows without fixture fallback; retry preserves exact request`, () => {
      ready(); page.search();
      request().flush({ status: 500, code, type: `urn:shf:problem:${code}`, title: 'Synthetic', requestId: 'safe-500' },
        { status: 500, statusText: 'Error' }); render();
      expect(page.result()).toBeNull(); expect(page.reference()).toBe('safe-500');
      page.retry(); const r = request(); expect(r.request.params.get('timeFrom')).toBe('10:00');
      r.flush(searchListFixture()); render(); expect(page.state()).toBe('success');
    });
  }
  it('401 clears identity/catalogue; no hidden reauthentication or unconditional synthetic session', () => {
    ready(); page.search();
    request().flush({ status: 401, code: 'UNAUTHENTICATED', type: 'urn:shf:problem:UNAUTHENTICATED',
      title: 'Synthetic', requestId: 'safe-401' }, { status: 401, statusText: 'Unauthorized' }); render();
    expect(page.principal()).toBeNull(); expect(page.context()).toBeNull(); expect(page.form.getRawValue().timeFrom).toBe('10:00');
    page.retry(); http.expectNone('/api/v1/identity'); http.expectNone('/api/v1/shift-search/filter-context');
  });
  it('search -> effective detail -> back revalidates context and restores page/opener', async () => {
    success();
    page.openDetail(page.result()!.items[0], new MouseEvent('click', { button: 0, cancelable: true }));
    await new Promise(r => setTimeout(r, 0)); render();
    const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds.push('TEST-V');
    http.expectOne('/api/v1/identity').flush(p);
    http.expectOne('/api/v1/employees/1001/shift-days/3001').flush(fixtureRow('1001', '3001')); render();
    expect(TestBed.inject(Router).url).toBe('/employees/1001/shift-days/3001');
    const detail = harness.routeDebugElement!.componentInstance as ShiftDayPage;
    expect(detail.fromSearch()).toBe(true); detail.backToEntry(); await new Promise(r => setTimeout(r, 0)); render();
    http.expectOne('/api/v1/identity').flush(p);
    http.expectOne('/api/v1/shift-search/filter-context').flush(searchContextFixture());
    request().flush(searchListFixture()); await settle();
    expect(document.activeElement?.id).toBe('search-detail-3001');
  });
});

describe('SHF-SEARCH-UI-18 unknown payload guards', () => {
  it('strict scoped bounded context, not aliases/default invention', () => {
    expect(searchContext(searchContextFixture())).toBe(true);
    for (const mutate of [
      (v: ReturnType<typeof searchContextFixture>) => v.teamOptions.push(v.teamOptions[0]),
      (v: ReturnType<typeof searchContextFixture>) => { v.teamOptions[0].parentMokedCode = 'absent'; },
      (v: ReturnType<typeof searchContextFixture>) => { v.defaults.timeTo = '23:59'; },
      (v: ReturnType<typeof searchContextFixture>) => { v.innerJobOptions[0].label = null; },
    ]) { const v = searchContextFixture(); mutate(v); expect(searchContext(v)).toBe(false); }
  });
  it('inclusive start seconds, not current overlap; source/applied/page/order/flag fail closed', () => {
    const req = searchRequestFixture(), ctx = searchContextFixture();
    expect(searchList(searchListFixture(), req, ctx)).toBe(true);
    for (const start of ['2026-10-14T23:00:00', '2026-10-15T10:00:01']) {
      const v = searchListFixture(); v.items[0].startLocal = start; expect(searchList(v, req, ctx)).toBe(false);
    }
    const v = searchListFixture(); v.items[0].indicators.extensionAllocated = false;
    expect(searchList(v, req, ctx)).toBe(false);
    const duplicate = searchListFixture(req, [searchRowFixture(), searchRowFixture()]);
    expect(searchList(duplicate, req, ctx)).toBe(false);
    expect(searchProblem({ status: 500, code: 'AMBIGUOUS_SHIFT_SEARCH', type: 'urn:shf:problem:AMBIGUOUS_SHIFT_SEARCH', title: 'Synthetic', requestId: 'safe' }, 500)).toBe(true);
  });
  it('bounds, stable numeric order, exact applied selections and pagination ceiling are checked', () => {
    const req = { ...searchRequestFixture(), offset: 10000 }, ctx = searchContextFixture();
    const v = searchListFixture(req, Array.from({ length: 25 }, (_, i) => searchRowFixture(String(3001 + i))));
    v.page.hasMore = true; expect(searchList(v, req, ctx)).toBe(true);
    v.page.nextOffset = 10025; expect(searchList(v, req, ctx)).toBe(false);
    const wrong = searchListFixture(); wrong.applied.teamCodes = ['TEST-U'];
    expect(searchList(wrong, searchRequestFixture(), ctx)).toBe(false);
    const order = searchListFixture(searchRequestFixture(), [searchRowFixture('10'), searchRowFixture('9')]);
    expect(searchList(order, searchRequestFixture(), ctx)).toBe(false);
    const extra = searchListFixture(); extra.items[0].indicators.hasRemark = 'yes' as unknown as boolean;
    expect(searchList(extra, searchRequestFixture(), ctx)).toBe(false);
  });
});
