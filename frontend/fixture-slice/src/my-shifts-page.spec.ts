import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { MyShiftsPage } from './my-shifts-page';
import { fixtureIdentity, fixtureRow } from './test-fixtures';
import { scheduleContextFixture, scheduleListFixture } from './my-shifts-fixtures';
import { scheduleContext, scheduleList, validRange } from './my-shifts-contract';
import { dateFromWire } from './civil-date-adapter';
import { ShiftDayPage } from './shift-day-page';
import { ListNavigation } from './list-navigation';

describe('SHF-SCHEDULE-UI-18 / synthetic HTTP', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: MyShiftsPage;
  const render = () => harness.detectChanges();
  const open = async (path = '/my-shifts/selected/1001') => {
    page = await harness.navigateByUrl(path, MyShiftsPage);
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
  };
  const context = () => http.expectOne(r => r.url === '/api/v1/my-shifts/context');
  const list = () => http.expectOne(r => r.url === '/api/v1/my-shifts');
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('null synthetic self requests only context and offers real discovery links, no ID form/list', async () => {
    await open('/my-shifts'); const r = context();
    expect(r.request.params.keys()).toEqual(['mode']); expect(r.request.params.get('mode')).toBe('self');
    r.flush(scheduleContextFixture('self')); render();
    http.expectNone(r => r.url === '/api/v1/my-shifts');
    expect(page.state()).toBe('selection');
    expect(harness.routeNativeElement!.querySelector('input')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('a[href="/shift-search"]')).not.toBeNull();
  });
  it('selected context precedes exact no-store GET with server defaults; own detail pair', async () => {
    await open(); const c = context();
    expect(c.request.params.keys().sort()).toEqual(['employeeId','mode']);
    expect(c.request.params.get('employeeId')).toBe('1001'); c.flush(scheduleContextFixture());
    const r = list(); expect(r.request.method).toBe('GET'); expect(r.request.cache).toBe('no-store');
    expect(r.request.params.keys().sort()).toEqual(['dateFrom','dateTo','employeeId','limit','mode','offset','sort']);
    expect(r.request.params.get('dateTo')).toBe('2026-10-28');
    r.flush(scheduleListFixture()); render();
    expect(page.state()).toBe('success');
    expect(harness.routeNativeElement!.querySelector('#schedule-detail-3001')?.getAttribute('href')).toBe('/employees/1001/shift-days/3001');
    expect(page.principal()?.principal.employeeId).toBeNull();
  });
  it.each([
    ['2024-02-28','2024-03-01',true],['2026-10-01','2026-10-31',true],
    ['2026-10-01','2026-11-01',false],['2026-10-18','2026-10-18',true],
    ['2100-02-29','2100-03-01',false],['2000-02-29','2000-03-01',true],
    ['0001-01-01','0001-01-01',true],['9999-12-31','9999-12-31',true],
    ['0000-01-01','0000-01-01',false],['2026-11-01','2026-10-01',false],
  ])('civil range %s..%s => %s', (from, to, valid) => expect(validRange(from, to)).toBe(valid));
  it('dirty edits cancel pending list, clear stale links and range errors focus second input', async () => {
    await open(); context().flush(scheduleContextFixture()); render(); const old = list();
    page.form.controls.dateFrom.setValue(dateFromWire('2026-10-01'));
    page.form.controls.dateTo.setValue(dateFromWire('2026-11-01'));
    expect(old.cancelled).toBe(true); expect(page.result()).toBeNull();
    page.apply(); render(); expect(page.form.controls.dateTo.hasError('range')).toBe(true);
    http.expectNone(r => r.url === '/api/v1/my-shifts');
  });
  it('rejects mixed source, selected mismatch and synthetic self masquerade', () => {
    const p = fixtureIdentity(), request = { mode: 'selected' as const, employeeId: '1001' };
    const c = scheduleContextFixture();
    expect(scheduleContext(c, request, p)).toBe(true);
    expect(scheduleContext({ ...c, dataSource: 'oracle-read-only' }, request, p)).toBe(false);
    expect(scheduleContext(c, { ...request, employeeId: '1002' }, p)).toBe(false);
    expect(scheduleContext({ ...c, actor: { ...c.actor, mode: 'self' } }, { mode: 'self' }, p)).toBe(false);
    const l = scheduleListFixture(); l.items[0].employee = { ...l.items[0].employee, employeeId: '9999' };
    expect(scheduleList(l, { ...request, dateFrom: c.defaults.dateFrom, dateTo: c.defaults.dateTo }, c)).toBe(false);
  });
  it('future verified real provider double resolves self without employeeId query or selected privilege', async () => {
    page = await harness.navigateByUrl('/my-shifts', MyShiftsPage);
    const p = fixtureIdentity(); p.principal.provider = 'real'; p.principal.synthetic = false;
    p.principal.employeeId = '1001'; p.principal.capabilities = ['my-shifts:read'];
    http.expectOne('/api/v1/identity').flush(p);
    const ctx = scheduleContextFixture(); ctx.actor.mode = 'self'; ctx.canSelectEmployee = false;
    context().flush(ctx); const r = list();
    expect(r.request.params.get('mode')).toBe('self');
    expect(r.request.params.has('employeeId')).toBe(false);
    const value = scheduleListFixture(); value.actor.mode = 'self'; value.applied.mode = 'self';
    r.flush(value); render();
    expect(page.state()).toBe('success');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('המשמרות שלי');
    expect(harness.routeNativeElement!.querySelector('tbody a')).toBeNull();
  });
  it('real unlinked is missing-link guidance, not demo selection or a fabricated empty list', async () => {
    page = await harness.navigateByUrl('/my-shifts', MyShiftsPage);
    const p = fixtureIdentity(); p.principal.provider = 'real'; p.principal.synthetic = false;
    p.principal.capabilities = ['my-shifts:read'];
    http.expectOne('/api/v1/identity').flush(p);
    const ctx = scheduleContextFixture('self'); ctx.canSelectEmployee = false;
    context().flush(ctx); render();
    expect(page.state()).toBe('selection'); expect(page.message()).toContain('קישור');
    http.expectNone(r => r.url === '/api/v1/my-shifts');
    expect(harness.routeNativeElement!.querySelector('main a')).toBeNull();
  });
  it.each([400,401,403,409,500,503])('sanitized %s list failure is explicit, no fallback/retry/partial data', async status => {
    await open(); context().flush(scheduleContextFixture()); render();
    const code = ({ 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN',
      409: 'EMPLOYEE_CONTEXT_REQUIRED', 500: 'AMBIGUOUS_MY_SHIFTS', 503: 'DEPENDENCY_TIMEOUT' } as Record<number,string>)[status];
    list().flush({ type: `urn:shf:problem:${code}`, code, title: 'Synthetic failure', status, requestId: 'safe-01',
      ...(status === 400 ? { invalidParameters: [{ name: 'dateTo', reason: 'invalid-format' }] } : {}) },
    { status, statusText: 'Synthetic failure' }); render();
    expect(page.state()).toBe('error'); expect(page.result()).toBeNull();
    expect(page.form.controls.dateFrom.value?.getFullYear()).toBe(2026);
    if (status === 400) expect(page.form.controls.dateTo.hasError('server')).toBe(true);
    if (status === 401) expect(page.principal()).toBeNull();
    if (status === 403) expect(page.denied()).toBe(true);
    http.expectNone(r => r.url.startsWith('/api/v1/my-shifts'));
  });
  it.each(['missing','three-caps','no-capability'])('failed/absent identity %s never loads context or assumes Administrator', async kind => {
    page = await harness.navigateByUrl('/my-shifts', MyShiftsPage);
    const p = fixtureIdentity();
    if (kind === 'three-caps') p.principal.capabilities.pop();
    if (kind === 'no-capability') {
      p.principal.provider = 'real'; p.principal.synthetic = false; p.principal.capabilities = ['shift-day:read'];
    }
    http.expectOne('/api/v1/identity').flush(kind === 'missing' ? {} : p); render();
    expect(page.canRead()).toBe(false); expect(page.state()).toBe('error');
    http.expectNone(r => r.url.startsWith('/api/v1/my-shifts'));
  });
  it('typed selected route rejects bad ID before HTTP and scope denial never becomes empty', async () => {
    await open('/my-shifts/selected/01'); render();
    expect(page.state()).toBe('error'); http.expectNone(r => r.url.startsWith('/api/v1/my-shifts'));
    page = await harness.navigateByUrl('/my-shifts/selected/1001', MyShiftsPage);
    context().flush({ type: 'urn:shf:problem:FORBIDDEN', code: 'FORBIDDEN', title: 'Unavailable',
      status: 403, requestId: 'safe-02' }, { status: 403, statusText: 'Forbidden' }); render();
    expect(page.result()).toBeNull(); expect(page.denied()).toBe(true);
  });
  it('actor A context cancellation then B cannot retain A caption/range/links', async () => {
    await open(); const a = context();
    page = await harness.navigateByUrl('/my-shifts/selected/1002', MyShiftsPage);
    expect(a.cancelled).toBe(true);
    const c = scheduleContextFixture(); c.actor.employee!.employeeId = '1002';
    context().flush(c); const l = scheduleListFixture();
    l.actor.employee!.employeeId = '1002'; l.items[0].employee.employeeId = '1002'; l.applied.employeeId = '1002';
    list().flush(l); render(); expect(page.context()?.actor.employee?.employeeId).toBe('1002');
    expect(page.principal()?.principal.employeeId).toBeNull();
  });
  it('list paging has no total, capped next stays null; empty later page allows previous', async () => {
    await open(); context().flush(scheduleContextFixture()); const value = scheduleListFixture();
    list().flush(value); render(); page.page(25);
    const r = list(); expect(r.request.params.get('offset')).toBe('25');
    value.items = []; value.page.offset = 25; r.flush(value); render();
    expect(page.state()).toBe('empty');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('#schedule-next')?.disabled).toBe(true);
    expect(harness.routeNativeElement!.textContent).toContain('הקודם');
  });
  it('schedule detail preserves own IDs, server source unit and recoverable 404 back path', async () => {
    await open(); context().flush(scheduleContextFixture()); list().flush(scheduleListFixture()); render();
    const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('#schedule-detail-3001')!;
    link.click(); await TestBed.inject(Router).navigateByUrl('/employees/1001/shift-days/3001');
    http.expectOne('/api/v1/identity').flush(fixtureIdentity());
    http.expectOne('/api/v1/employees/1001/shift-days/3001').flush({
      type: 'urn:shf:problem:SHIFT_DAY_NOT_FOUND', code: 'SHIFT_DAY_NOT_FOUND', status: 404, title: 'Not found', requestId: 'safe-404',
    }, { status: 404, statusText: 'Not found' });
    render();
    const detail = harness.routeDebugElement!.componentInstance as ShiftDayPage;
    expect(detail.fromSchedule()).toBe(true);
    expect(harness.routeNativeElement!.querySelector('#back-action')?.textContent).toContain('משמרות העובד/ת');
    expect(TestBed.inject(ListNavigation).schedule?.request?.dateFrom).toBe('2026-10-15');
    expect(detail.row()).toBeNull();
    // Navigation labels may not cross an identity/detail source change.
    detail.row.set(fixtureRow('1001', '3001'));
    expect(detail.sourceUnit()?.code).toBe('TEST-U');
    const switched = fixtureIdentity(); switched.dataSource = 'oracle'; detail.principal.set(switched);
    expect(detail.sourceUnit()).toBeNull();
  });
  it('accepts only coherent Oracle source pair and exact clamped final-year context defaults', () => {
    const p = fixtureIdentity(); p.dataSource = 'oracle';
    const ctx = scheduleContextFixture(); ctx.dataSource = 'oracle-read-only';
    const req = { mode: 'selected' as const, employeeId: '1001' };
    expect(scheduleContext(ctx, req, p)).toBe(true);
    ctx.defaults = { dateFrom: '9999-12-30', dateTo: '9999-12-31' };
    expect(scheduleContext(ctx, req, p)).toBe(true);
    ctx.defaults.dateTo = '9999-12-30';
    expect(scheduleContext(ctx, req, p)).toBe(false);
  });
  it.each(['duplicate','end-before-start','activity-bound','unknown-source','wrong-page','wrong-order'])('rejects malformed list invariant %s', kind => {
    const ctx = scheduleContextFixture(), value = scheduleListFixture();
    const row = value.items[0];
    if (kind === 'duplicate') value.items.push(structuredClone(row));
    if (kind === 'end-before-start') row.endLocal = '2026-10-14T00:00:00';
    if (kind === 'activity-bound') row.activities = Array.from({ length: 101 }, () => ({ code: 'A', label: null }));
    if (kind === 'unknown-source') (value as unknown as Record<string,unknown>)['dataSource'] = 'oracle';
    if (kind === 'wrong-page') value.page.nextOffset = 25;
    if (kind === 'wrong-order') value.items.push({ ...structuredClone(row), shiftDayId: '1', startLocal: '2026-10-15T00:00:00' });
    expect(scheduleList(value, { mode: 'selected', employeeId: '1001', ...ctx.defaults }, ctx)).toBe(false);
  });
});
