import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { ShiftItemsPage } from './shift-items-page';
import { fixtureIdentity } from './test-fixtures';
import { fixtureItems } from './shift-items-fixtures';

describe('ITEMS Angular page / single unknown HTTP boundary', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: ShiftItemsPage;
  const path = '/employees/1001/shift-days/2001/breaks-and-exceptions';
  const endpoint = '/api/v1' + path;
  const render = () => harness.detectChanges();
  const dom = () => harness.routeNativeElement!;
  const text = () => dom().textContent!;
  const identity = (withItems = true) => {
    const p = fixtureIdentity();
    if (!withItems) {
      p.principal.provider = 'real'; p.principal.synthetic = false; p.principal.employeeId = '1001';
      p.principal.capabilities = p.principal.capabilities.filter(c => c !== 'shift-items:read');
    }
    http.expectOne('/api/v1/identity').flush(p); render();
  };
  const get = () => http.expectOne(r => r.url === endpoint);
  const settle = async () => { await new Promise(r => setTimeout(r, 0)); render(); };
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl(path, ShiftItemsPage); render();
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('waits for validated identity and issues exactly one readonly GET with only approved params', () => {
    http.expectNone(endpoint); identity();
    const req = get(); expect(req.request.method).toBe('GET'); expect(req.request.body).toBeNull();
    expect(req.request.params.keys().sort()).toEqual(['limit', 'offset', 'sort']);
    expect(req.request.params.get('limit')).toBe('25'); expect(req.request.params.get('sort')).toBe('start-asc');
    expect(req.request.cache).toBe('no-store');
    req.flush(fixtureItems()); render();
    expect(page.result()?.shiftDay.employeeId).toBe('1001');
    expect(dom().querySelectorAll('input,select,textarea')).toHaveLength(0);
    expect(text()).toContain('לא בוצע אימות סיסמה אמיתית');
    expect(text()).toContain('הקשר מהתשובה הנוכחית');
  });
  it('missing new right preserves old navigation and does not grant from Administrator role', () => {
    identity(false); http.expectNone(endpoint);
    expect(page.canRead()).toBe(false); expect(page.result()).toBeNull();
    expect(dom().querySelector('.sidebar a[href="/current-shifts"]')).not.toBeNull();
    expect(dom().querySelector('.sidebar a[href="/shift-search"]')).not.toBeNull();
    expect(dom().querySelector('.sidebar a[href="/my-shifts"]')).not.toBeNull();
    expect(text()).toContain('אין הרשאה לתצוגה זו');
  });
  it('requires detail right as well as items right for a real principal', () => {
    const p = fixtureIdentity();
    p.principal = { ...p.principal, subject: 'verified-test', provider: 'real', synthetic: false,
      roles: ['Administrator'], capabilities: ['shift-items:read'], employeeId: '1001' };
    http.expectOne('/api/v1/identity').flush(p); render();
    expect(page.canRead()).toBe(false); http.expectNone(endpoint);
  });
  it('invalid/absent identity never falls back to synthetic Administrator', () => {
    http.expectOne('/api/v1/identity').flush({ principal: null }); render();
    expect(page.identityState()).toBe('error'); expect(page.principal()).toBeNull(); http.expectNone(endpoint);
  });
  it('renders all eight fields, seconds, raw classification and escaped text with no computed duration', () => {
    identity(); const v = fixtureItems(); v.items[0].breakExitLocal = '2026-10-16T00:00:01';
    get().flush(v); render();
    expect(dom().querySelectorAll('tbody tr')).toHaveLength(3);
    expect(dom().querySelectorAll('tbody tr:first-child td')).toHaveLength(8);
    for (const s of ['23:59:30', '00:10:15', '00:00:01', 'אין ערך רשום', 'לא חל',
      '-5', '99999999999999999999999999999999999999', 'שם סוג לא ידוע', '-9', 'DEL',
      '<טקסט> &', 'קוד מצב מקור']) expect(text()).toContain(s);
    expect(dom().querySelector('טקסט')).toBeNull();
    expect(dom().querySelectorAll('[innerHTML]')).toHaveLength(0);
  });
  it('D01 retains the complete duration in a named keyboard-scrollable local token, not raw-text nowrap', () => {
    identity(); get().flush(fixtureItems()); render();
    const token = dom().querySelector<HTMLElement>('tbody tr:nth-child(2) .duration-value')!;
    expect(token).not.toBeNull();
    expect(token.textContent).toBe('9'.repeat(38));
    expect(token.getAttribute('dir')).toBe('ltr');
    expect(token.getAttribute('tabindex')).toBe('0');
    expect(token.getAttribute('aria-label')).toContain('משך רשום בדקות');
    expect(getComputedStyle(token).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(token).overflowX).toBe('auto');
    expect(getComputedStyle(token).maxWidth).toBe('100%');
    expect(dom().querySelector('pre.duration-value')).toBeNull();
  });
  it('D03 rejects the entire malformed self-parent context with zero rows or caption', () => {
    identity(); const v = fixtureItems();
    v.displayContext.unit.moked.code = v.displayContext.unit.code;
    get().flush(v); render();
    expect(page.state()).toBe('error'); expect(page.result()).toBeNull();
    expect(dom().querySelectorAll('.context-card,tbody tr')).toHaveLength(0);
  });
  it.each(['employee', 'day', 'source', 'rows', 'context'] as const)('rejects %s mismatch without partial caption/items', key => {
    identity(); const v = fixtureItems();
    if (key === 'employee') v.shiftDay.employeeId = '1002';
    if (key === 'day') v.shiftDay.shiftDayId = '2002';
    if (key === 'source') v.shiftDay.dataSource = 'oracle';
    if (key === 'rows') v.items[0].durationMinutes = '-0';
    if (key === 'context') v.displayContext.unit.code = 'OTHER';
    get().flush(v); render();
    expect(page.state()).toBe('error'); expect(page.result()).toBeNull();
    expect(dom().querySelector('.context-card')).toBeNull(); expect(dom().querySelector('tbody')).toBeNull();
  });
  it('keeps reload mounted/focused across loading and failure and ignores repeat Space clicks', async () => {
    identity(); get().flush(fixtureItems()); await settle();
    const button = dom().querySelector<HTMLButtonElement>('#items-reload')!; button.focus();
    button.click(); render(); button.click(); button.click(); render();
    const req = get();
    expect(dom().querySelector('#items-reload')).toBe(button);
    expect(document.activeElement).toBe(button); expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(page.result()).toBeNull();
    req.flush({}, { status: 503, statusText: 'Synthetic' }); await settle();
    expect(dom().querySelector('#items-reload')).toBe(button); expect(document.activeElement).toBe(button);
    http.expectNone(endpoint);
  });
  it('supports authorized empty and later empty, 25+5 paging, previous and reload0 without a total', async () => {
    identity(); const v = fixtureItems(), first = v.items[0];
    v.items = Array.from({ length: 25 }, (_, i) => {
      const t = `2026-10-15T23:${String(i).padStart(2,'0')}:00`;
      return { ...first, key: { shiftDayId: '2001', startLocal: t }, startLocal: t };
    });
    v.page = { limit: 25, offset: 0, hasMore: true, nextOffset: 25 };
    get().flush(v); render(); page.next(); render();
    const r = get(); expect(r.request.params.get('offset')).toBe('25');
    const tail = fixtureItems(); tail.items = v.items.slice(0,5);
    tail.page = { limit: 25, offset: 25, hasMore: false, nextOffset: null };
    r.flush(tail); await settle(); expect(page.result()?.items).toHaveLength(5);
    expect(document.activeElement?.id).toBe('items-next');
    page.previous(); get().flush(v); render(); page.next();
    tail.items = []; get().flush(tail); render(); expect(page.state()).toBe('empty');
    expect(page.result()?.shiftDay.employeeId).toBe('1001');
    page.reload(); const reload = get(); expect(reload.request.params.get('offset')).toBe('0');
    reload.flush(fixtureItems());
  });
  it.each([
    [400,'INVALID_REQUEST','הבקשה אינה תקינה'], [401,'UNAUTHENTICATED','נדרש אימות'],
    [403,'FORBIDDEN','אין הרשאה'], [404,'SHIFT_DAY_NOT_FOUND','המשמרת אינה זמינה'],
    [500,'AMBIGUOUS_SHIFT_DAY','הקשר לא חד־משמעי'], [500,'AMBIGUOUS_SHIFT_ITEMS','הקשר לא חד־משמעי'],
    [500,'INVALID_SOURCE_DATA','שגיאת מקור'], [503,'DEPENDENCY_TIMEOUT','פג הזמן'],
    [503,'DEPENDENCY_UNAVAILABLE','השירות אינו זמין'],
  ])('surfaces %s %s explicitly and removes all data', (status, code, copy) => {
    identity();
    get().flush({ status, code, type: `urn:shf:problem:${code}`, title: 'Synthetic', requestId: 'synthetic-1' },
      { status: Number(status), statusText: 'Synthetic' }); render();
    expect(page.state()).toBe('error'); expect(page.result()).toBeNull(); expect(text()).toContain(copy);
    expect(dom().querySelector('#items-back')).not.toBeNull();
    if (status === 401) expect(page.principal()).toBeNull();
  });
  it('aborts old context on route change, clears data and binds the new employee/day', async () => {
    identity(); const old = get();
    page = await harness.navigateByUrl('/employees/1002/shift-days/2002/breaks-and-exceptions', ShiftItemsPage);
    expect(old.cancelled).toBe(true); expect(page.result()).toBeNull();
    const next = http.expectOne(r => r.url === '/api/v1/employees/1002/shift-days/2002/breaks-and-exceptions');
    next.flush(fixtureItems('1002','2002')); render();
    expect(page.result()?.shiftDay.shiftDayId).toBe('2002');
  });
  it('rejects unknown/duplicate/noncanonical query without requesting items', async () => {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity()); render();
    page = await harness.navigateByUrl(path + '?limit=25&%6cimit=25', ShiftItemsPage);
    expect(page.request).toBeNull(); http.expectNone(endpoint);
  });
  it('does not request malformed route identifiers or expose an arbitrary ID input', async () => {
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    page = await harness.navigateByUrl('/employees/01/shift-days/2001/breaks-and-exceptions', ShiftItemsPage);
    render(); expect(page.request).toBeNull(); http.expectNone(endpoint);
    expect(dom().querySelectorAll('input')).toHaveLength(0);
  });
});
