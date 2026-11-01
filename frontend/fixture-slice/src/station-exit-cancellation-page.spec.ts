import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StationExitCancellationPage } from './station-exit-cancellation-page';
import { StationExitCancellationSession } from './station-exit-cancellation-session';
import { StationExitCancellationDialog } from './station-exit-cancellation-dialog';
import { NativeCommandSession } from './native-command-session';
import { cancellationWorld } from './station-exit-cancellation-fixtures';
import { SliceApi } from './api';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StationExitSession } from './station-exit-session';
import { ShiftManagementSession } from './shift-management-session';
const base = '/api/v1/employees/1001/shift-days/2001/station-exit-cancellation';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemWire = { headers: { ...wire.headers, 'Content-Type': 'application/problem+json' } };
describe('U52 Angular typed HTTP: fixture/native guards, NOT actual native completion', () => {
  let http: HttpTestingController, h: RouterTestingHarness, page: StationExitCancellationPage;
  let world: ReturnType<typeof cancellationWorld>;
  const render = () => h.detectChanges();
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(native = false, context?: object) {
    world = cancellationWorld(native);
    TestBed.inject(StationExitCancellationSession).selection = world.selection;
    page = await h.navigateByUrl('/employees/1001/shift-days/2001/station-exit-cancellation', StationExitCancellationPage);
    http.expectOne('/api/v1/identity').flush(world.identity);
    if (page.state() === 'loading') http.expectOne(base + '/context').flush(context ?? world.context, wire);
    render();
  }
  function prepare() {
    page.validate(); const req = http.expectOne(base + '/validations');
    expect(req.request.body).toEqual({}); expect(req.request.params.keys()).toEqual([]);
    req.flush(world.validation, wire); render(); noCommand();
  }
  function review() {
    page.confirm(); render();
    const ref = TestBed.inject(MatDialog).openDialogs[0];
    expect(ref.componentInstance).toBeInstanceOf(StationExitCancellationDialog);
    noCommand(); return { ref, instance: ref.componentInstance as StationExitCancellationDialog };
  }
  async function dispatch() {
    const { ref, instance } = review();
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    instance.warning.setValue(true); instance.operation.setValue(true); instance.confirm();
    await closed; render(); return http.expectOne(base + '/commands');
  }
  beforeEach(async () => {
    sessionStorage.clear(); history.replaceState({}, '');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    sessionStorage.clear(); history.replaceState({}, '');
  });
  for (const native of [false, true]) {
    it(`read-only facts → two unchecked consents → one exact ${native ? 'native protocol double' : 'simulated'} command`, async () => {
      await start(native); expect(page.state()).toBe('ready');
      expect(page.principal()?.principal.employeeId).toBeNull();
      expect(h.routeNativeElement!.querySelector('input,mat-select')).toBeNull();
      expect(h.routeNativeElement!.textContent).toContain('לא נרשמה הגעה לבמה');
      prepare(); const req = await dispatch();
      expect(req.request.cache).toBe('no-store'); expect(req.request.timeout).toBe(5000);
      expect(req.request.body).toEqual({ ...world.command, commandId: expect.any(String) });
      expect(page.state()).toBe('pending'); expect(page.context()?.recorded.stationExitLocal).toBe(world.context.recorded.stationExitLocal);
      page.validate(); page.confirm(); page.cancel(); noCommand(); expect(page.state()).toBe('pending');
      req.flush({ ...world.receipt, commandId: req.request.body.commandId }, wire); render();
      expect(page.state()).toBe('success'); expect(page.receipt()?.recorded.stationExitLocal).toBeNull();
      expect(page.blocked()).toBe(true); // no reopened allowance after clearing exit
      const text = h.routeNativeElement!.textContent!;
      expect(text).toContain(native ? 'בדיקה חוזרת עצמאית' : 'זו אינה הוכחת כתיבה למסד אמיתי');
      expect(text).toContain('לא הופעל שותף חיצוני'); noCommand();
    });
    it(`mixed-source receipt after dispatch is UNKNOWN, not fallback ${native}`, async () => {
      await start(native); prepare(); const req = await dispatch();
      req.flush({ ...cancellationWorld(!native).receipt, commandId: req.request.body.commandId }, wire); render();
      expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull(); expect(page.blocked()).toBe(true);
      page.validate(); page.confirm(); noCommand();
      if (native) {
        const g = TestBed.inject(NativeCommandSession);
        expect(g.affectsEmployee('1001')).toBe(true);
        const opaque = JSON.stringify({ state: history.state, storage: sessionStorage.getItem('shfNativeCommandSafety') });
        expect(opaque).not.toContain(world.validation.validationToken); expect(opaque).not.toContain(world.validation.fingerprint);
        expect(opaque).not.toContain('1001'); expect(opaque).not.toContain('originalExitLocal');
        const restored = new NativeCommandSession(); expect(restored.affectsEmployee('9999')).toBe(true);
      }
    });
  }
  for (const one of ['warning', 'operation', 'neither'] as const) {
    it(`consent ${one} alone and untrusted close(true) have zero effects`, async () => {
      await start(); prepare(); const { ref, instance } = review();
      instance.warning.setValue(one === 'warning'); instance.operation.setValue(one === 'operation');
      instance.confirm(); expect(instance.confirmed).toBe(false); noCommand();
      const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); ref.close(true); await closed;
      render(); expect(page.state()).toBe('ready'); expect(page.validation()).toBeNull(); expect(page.blocked()).toBe(false);
    });
  }
  it('safe cancel has zero effects and clears both controls and preparation', async () => {
    await start(); prepare(); const { ref, instance } = review();
    instance.warning.setValue(true);
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); ref.close(false); await closed; render();
    expect(instance.warning.value).toBe(false); expect(instance.operation.value).toBe(false);
    expect(page.state()).toBe('ready'); noCommand();
  });
  it('private generation binding rejects context drift and regained originals', async () => {
    await start(); prepare(); const { ref, instance } = review();
    page.context.set({ ...world.context, policy: { ...world.context.policy, maxAfterEndMinutes: 31 } });
    instance.warning.setValue(true); instance.operation.setValue(true);
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); instance.confirm(); await closed; render();
    expect(page.state()).toBe('error'); expect(page.validation()).toBeNull();
    page.context.set(world.context); page.confirm(); noCommand();
  });
  it('TTL uses monotonic budget including request latency, clears both at expiry', async () => {
    await start(); let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
    prepare(); now += 30000; page.confirm(); render();
    expect(page.state()).toBe('expired'); expect(page.validation()).toBeNull(); noCommand();
  });
  it('fresh route or recheck rejects late preparation generations', async () => {
    await start(); page.validate(); const old = http.expectOne(base + '/validations');
    page.recheck(); expect(old.cancelled).toBe(true);
    http.expectOne('/api/v1/identity').flush(world.identity);
    http.expectOne(base + '/context').flush(world.context, wire); render();
    expect(page.validation()).toBeNull(); expect(page.state()).toBe('ready'); noCommand();
  });
  it('network loss after dispatch retains employee-wide UNKNOWN across day/source/new UUID', async () => {
    await start(true); prepare(); const req = await dispatch();
    req.error(new ProgressEvent('error')); render(); expect(page.state()).toBe('unknown');
    const g = TestBed.inject(NativeCommandSession);
    expect(g.begin('1001', crypto.randomUUID())).toBe(false);
    const session = TestBed.inject(StationExitCancellationSession);
    expect(session.blocked({ ...world.selection, shiftDayId: '2002', dataSource: 'isolated-fixture' })).toBe(true);
  });
  it('prior coordinated exit consumed global allowance cannot be undone by cancellation', async () => {
    const g = TestBed.inject(NativeCommandSession), attempt = crypto.randomUUID();
    expect(g.begin('1001', attempt)).toBe(true); expect(g.resolve('1001', attempt)).toBe(true);
    await start(true); expect(page.state()).toBe('blocked'); http.expectNone(base + '/context'); noCommand();
    expect(page.message()).toContain('מחוץ לממשק');
    const restored = new NativeCommandSession(); expect(restored.cancellationUnavailable('9999')).toBe(true);
  });
  it('already-null exit is observation only; deferred partner required/unknown and flags have Hebrew blockers', async () => {
    const w = cancellationWorld();
    await start(false, { ...w.context, eligibility: 'not-recorded', recorded: { ...w.context.recorded, stationExitLocal: null } });
    expect(page.state()).toBe('ineligible'); expect(page.message()).toContain('זו אינה קבלת ביטול'); noCommand();
  });
  it('strict source/resource identity rejects missing identity and wrong native grant', async () => {
    world = cancellationWorld();
    TestBed.inject(StationExitCancellationSession).selection = world.selection;
    page = await h.navigateByUrl('/employees/1001/shift-days/2001/station-exit-cancellation', StationExitCancellationPage);
    http.expectOne('/api/v1/identity').flush({ ...world.identity, dataSource: 'oracle' });
    render(); expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull(); http.expectNone(base + '/context');
  });
  it('refresh without trusted employee selection is chooser, never URL-derived command context', async () => {
    page = await h.navigateByUrl('/employees/1001/shift-days/2001/station-exit-cancellation', StationExitCancellationPage);
    http.expectOne('/api/v1/identity').flush(cancellationWorld().identity); render();
    expect(page.state()).toBe('chooser'); http.expectNone(base + '/context'); noCommand();
  });
  it('stale preparation problem clears both consents with no automatic command', async () => {
    await start(); page.validate();
    http.expectOne(base + '/validations').flush({ type: 'urn:shf:problem:STALE_PREPARATION', title: 'השתנה',
      status: 409, code: 'STALE_PREPARATION', requestId: 'safe', commandId: null, effect: 'none', nextAction: 'prepare-again' },
      { ...problemWire, status: 409, statusText: 'Conflict' });
    render(); expect(page.validation()).toBeNull(); expect(page.message()).toContain('שני האישורים בוטלו'); noCommand();
  });
  it('API rejects nonempty drafts/resources before HTTP and does not add query fields', () => {
    const api = TestBed.inject(SliceApi);
    expect(() => api.cancellationValidate('1001', '2001', { time: '' } as never)).toThrow();
    expect(() => api.cancellationContext('0', '2001')).toThrow(); http.expectNone(base + '/validations');
  });
  for (const blocker of ['PARTNER_REVIEW_REQUIRED', 'ORDINARY_EXIT_REQUIRED', 'OUTSIDE_CANCELLATION_WINDOW',
    'EMPLOYEE_LOCKED', 'MISSING_PRESENT', 'EXISTING_LATE', 'FLAG_PRESENT', 'OVERLAPPING_SHIFT', 'REPORT_REVIEW_REQUIRED']) {
    it(`server-deferred ${blocker} remains disabled with Hebrew assistive reason`, async () => {
      const w = cancellationWorld();
      await start(false, { ...w.context, eligibility: 'deferred', blockers: [blocker] });
      expect(page.state()).toBe('ineligible'); expect(page.canValidate()).toBe(false);
      expect(h.routeNativeElement!.querySelector('ul[aria-label]')!.textContent).toContain(blocker);
      page.validate(); noCommand(); http.expectNone(base + '/validations');
    });
  }
  it('U52 native UNKNOWN blocks old F1/F2/late/exit and four management writers through shared global seam', async () => {
    await start(true); prepare(); const req = await dispatch(); req.error(new ProgressEvent('error')); render();
    const changed = { ...world.selection, shiftDayId: '2002', attendanceKey: { shiftDayId: '2002' },
      actor: 'changed', orgUnitId: 'other', dataSource: 'isolated-fixture' as const };
    expect(TestBed.inject(StageArrivalSession).crossAffects(changed)).toBe(true);
    expect(TestBed.inject(StationArrivalSession).crossAffects(changed)).toBe(true);
    expect(TestBed.inject(StationExitSession).affects(changed)).toBe(true);
    expect(TestBed.inject(ShiftManagementSession).affectsEmployee('1001')).toBe(true);
    const g = TestBed.inject(NativeCommandSession);
    expect(g.begin('1001', crypto.randomUUID())).toBe(false);
  });
  it('proven rollback does not reopen native fence or offer resend', async () => {
    await start(true); prepare(); const req = await dispatch();
    req.flush({ type: 'urn:shf:problem:STALE_PREPARATION', title: 'השתנה', status: 409,
      code: 'STALE_PREPARATION', requestId: 'safe', commandId: req.request.body.commandId,
      effect: 'rolled-back', nextAction: 'prepare-again' }, { ...problemWire, status: 409, statusText: 'Conflict' });
    render(); expect(page.state()).toBe('error'); expect(page.blocked()).toBe(true);
    expect(h.routeNativeElement!.querySelector('#cancellation-refresh')).toBeNull(); noCommand();
  });
  it('malformed post-command media is UNKNOWN even with a receipt-shaped body', async () => {
    await start(true); prepare(); const req = await dispatch();
    req.flush({ ...world.receipt, commandId: req.request.body.commandId }, { headers: { 'Content-Type': 'text/plain' } });
    render(); expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull(); noCommand();
  });
  it('recheck while pending is not cancellation and never dispatches another command', async () => {
    await start(true); prepare(); const req = await dispatch();
    page.recheck(); render(); expect(req.cancelled).toBe(true); expect(page.state()).toBe('unknown');
    expect(page.blocked()).toBe(true); noCommand(); http.expectNone('/api/v1/identity');
  });
  it('pre-dispatch page cancel uses existing exact-origin history, clears preparation and has zero commands', async () => {
    await start(); prepare(); const back = vi.spyOn(page.journey, 'back').mockImplementation(() => {});
    page.cancel(); expect(back).toHaveBeenCalledExactlyOnceWith('/attendance');
    expect(page.validation()).toBeNull(); expect(page.blocked()).toBe(false); noCommand();
    expect(JSON.stringify(history.state)).not.toMatch(/1001|2001|fingerprint|validationToken|originalExit/);
  });
  it('HTTP identity failure is explicit, not Administrator fallback', async () => {
    TestBed.inject(StationExitCancellationSession).selection = cancellationWorld().selection;
    page = await h.navigateByUrl('/employees/1001/shift-days/2001/station-exit-cancellation', StationExitCancellationPage);
    http.expectOne('/api/v1/identity').error(new ProgressEvent('error')); render();
    expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull(); http.expectNone(base + '/context'); noCommand();
  });
});
