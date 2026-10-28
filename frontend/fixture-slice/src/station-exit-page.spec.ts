import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StationExitPage } from './station-exit-page';
import { StationExitSession } from './station-exit-session';
import { StationArrivalDialog } from './station-arrival-dialog';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalPage } from './stage-arrival-page';
import { StationArrivalPage } from './station-arrival-page';
import { SliceApi } from './api';
import { nativeIdentityFixture } from './native-arrival-fixtures';
import { nativeStationIdentityFixture } from './native-station-arrival-fixtures';
import { stationIdentityFixture as jointIdentityFixture } from './station-arrival-fixtures';
import { actorBinding } from './stage-arrival-contract';
import { arrivalProblemFixture } from './stage-arrival-fixtures';
import { exitIdentityFixture as principal, exitSelectionFixture as selection, exitContextFixture as context,
  exitValidationFixture as validation, exitReceiptFixture as receipt } from './station-exit-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/station-exit';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemWire = { ...wire.headers, 'Content-Type': 'application/problem+json' };
describe('§47 native exit Angular typed HTTP doubles only — NOT Oracle', () => {
  let http: HttpTestingController, h: RouterTestingHarness, page: StationExitPage, session: StationExitSession;
  const render = () => h.detectChanges();
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(p = principal(), c: object = context()) {
    session.selection = selection();
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-exit', StationExitPage);
    http.expectOne('/api/v1/identity').flush(p);
    if (page.state() === 'loading') http.expectOne(base + '/context').flush(c, wire);
    render();
  }
  function prepare(v: object = validation()) {
    page.validate(); const r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({}); expect(r.request.params.keys()).toEqual([]);
    r.flush(v, wire); render(); noCommand();
  }
  function dialog() {
    page.confirm(); render();
    const ref = TestBed.inject(MatDialog).openDialogs[0];
    expect(ref.componentInstance).toBeInstanceOf(StationArrivalDialog);
    expect((ref.componentInstance as StationArrivalDialog).data.kind).toBe('native-exit-confirmation');
    noCommand(); return ref;
  }
  async function approve() {
    const ref = dialog(), op = ref.componentInstance as StationArrivalDialog;
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    op.accepted.setValue(true); op.confirm(); await closed; render();
    return http.expectOne(base + '/commands');
  }
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); session = TestBed.inject(StationExitSession);
    h = await RouterTestingHarness.create();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    history.replaceState({}, ''); sessionStorage.clear();
  });
  it('honest TEST/synthetic notices, server bounds/seconds/policy and NULL stage/briefing; no business inputs', async () => {
    await start(); expect(page.state()).toBe('ready'); expect(page.allowed()).toBe(true);
    const text = h.routeNativeElement!.textContent!;
    for (const copy of ['יציאה מעמדה — TEST', 'כתיבה בפועל למסד TEST', 'מנהל מערכת סינתטי אינו העובד',
      'לא נרשמה הגעה לבמה', 'לא ידוע — NULL', '2026-10-28T15:59:00.001Z', 'Asia/Jerusalem'])
      expect(text).toContain(copy);
    expect(h.routeNativeElement!.querySelector('input,mat-select')).toBeNull();
    expect(page.principal()?.principal.employeeId).toBeNull(); noCommand();
  });
  it('pure validation -> review -> unchecked whole-operation consent -> one exact native command', async () => {
    await start(); prepare(); const req = await approve();
    expect(req.request.method).toBe('POST'); expect(req.request.cache).toBe('no-store');
    expect(req.request.timeout).toBe(5000); expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toEqual({ commandId: expect.any(String), draft: {}, fingerprint: 'e'.repeat(64),
      validationToken: 'x'.repeat(43), operationConfirmation: { accepted: true } });
    expect(history.state.shfNativeStationExitSafety).toHaveLength(1);
    expect(history.state.shfNativeStationSafety).toBeUndefined(); expect(history.state.shfNativeSafety).toBeUndefined();
    page.confirm(); page.validate(); noCommand(); page.cancel(); expect(page.state()).toBe('committing');
    req.flush(receipt(req.request.body), wire); render();
    expect(page.state()).toBe('success'); expect(session.uncertain()).toBe(false);
    expect(h.routeNativeElement!.textContent).toContain('אישור COMMIT אינו רגע השמירה המדויק');
    page.confirm(); page.validate(); noCommand();
  });
  it('unchecked direct confirm and cancel send zero commands; cancel discards token, not safety', async () => {
    await start(); prepare(); const ref = dialog(), op = ref.componentInstance as StationArrivalDialog;
    op.confirm(); expect(op.confirmed).toBe(false); noCommand(); expect(session.uncertain()).toBe(false);
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); ref.close(false); await closed; render();
    expect(page.state()).toBe('ready'); expect(page.validation()).toBeNull(); noCommand();
  });
  it('an untrusted close(true) without checked/confirmed consent cannot dispatch', async () => {
    await start(); prepare(); const ref = dialog();
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); ref.close(true); await closed; render();
    expect(page.state()).toBe('ready'); expect(session.uncertain()).toBe(false); noCommand();
  });
  it('lost selected context after reload uses chooser, not restored tokens or URL-derived business context', async () => {
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-exit', StationExitPage);
    http.expectOne('/api/v1/identity').flush(principal()); render();
    expect(page.state()).toBe('chooser'); http.expectNone(base + '/context'); noCommand();
  });
  it('failed/absent identity never falls back to Administrator or sends context', async () => {
    session.selection = selection();
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-exit', StationExitPage);
    http.expectOne('/api/v1/identity').flush({}, { status: 503, statusText: 'Unavailable' }); render();
    expect(page.principal()).toBeNull(); expect(page.state()).toBe('denied'); http.expectNone(base + '/context'); noCommand();
  });
  for (const mode of ['stage10', 'station10', 'fixture11', 'missing', 'wrong-source', 'grants', 'count-only'] as const) {
    it(`refuses ${mode} before exit context`, async () => {
      const p = mode === 'stage10' ? nativeIdentityFixture() : mode === 'station10' ? nativeStationIdentityFixture() :
        mode === 'fixture11' ? jointIdentityFixture() : principal();
      if (mode === 'missing') p.principal.capabilities.pop();
      if (mode === 'wrong-source') p.dataSource = 'isolated-fixture';
      if (mode === 'grants') p.principal.resourceScope.orgUnitIds = ['0022'];
      if (mode === 'count-only') p.principal.capabilities.reverse();
      await start(p); expect(page.state()).toBe('denied'); expect(page.context()).toBeNull(); noCommand();
    });
  }
  for (const mode of ['early', 'missing-station', 'window', 'already'] as const) {
    it(`${mode} is read-only, no manager/reason/token/auto-arrival`, async () => {
      const c = context(); c.eligibility = 'deferred';
      if (mode === 'early') { c.classification = 'early-manager-decision-deferred'; c.withinExitWindow = false; }
      if (mode === 'missing-station') { c.recorded.stationArrivalLocal = null; c.blockers = ['STATION_ARRIVAL_REQUIRED']; }
      if (mode === 'window') { c.classification = 'outside-window'; c.withinExitWindow = false; }
      if (mode === 'already') { c.eligibility = 'already-recorded'; c.recorded.stationExitLocal = '2026-10-28T17:58:00'; }
      await start(principal(), c); expect(page.state()).toBe('ineligible'); expect(page.receipt()).toBeNull();
      if (mode === 'early') expect(h.routeNativeElement!.textContent).toContain('יציאה מוקדמת דורשת החלטת מנהל — התהליך אינו זמין בגרסה זו');
      if (mode === 'missing-station') expect(h.routeNativeElement!.textContent).toContain('נדרשת הגעה רשומה לעמדה לפני יציאה');
      page.validate(); page.confirm(); noCommand(); http.expectNone(base + '/validations');
      http.expectNone(r => /\/(stage-arrival|station-arrival)\//.test(r.url));
    });
  }
  it('invalid source before dispatch halts, never creates uncertainty or fallback', async () => {
    await start(principal(), { ...context(), dataSource: 'isolated-fixture' });
    expect(page.context()).toBeNull(); page.validate(); page.confirm(); noCommand();
    expect(session.uncertain()).toBe(false);
  });
  it('API strict empty-draft guard rejects TS {} permissiveness before HttpClient', () => {
    const api = TestBed.inject(SliceApi);
    expect(() => api.stationExitValidate('9001', '6201', { reason: null } as any)).toThrow();
    http.expectNone(base + '/validations');
  });
  it('expired preparation requires fresh context and re-review, including while dialog open', async () => {
    let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
    await start(); prepare(); const ref = dialog(), op = ref.componentInstance as StationArrivalDialog;
    now += 121000;
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); op.accepted.setValue(true); op.confirm(); await closed;
    expect(page.state()).toBe('expired'); expect(page.context()).toBeNull(); expect(page.validation()).toBeNull(); noCommand();
  });
  it('actor/context drift invalidates open dialog before any dispatch', async () => {
    await start(); prepare(); const ref = dialog(), op = ref.componentInstance as StationArrivalDialog;
    session.selection = { ...selection(), actor: 'different' };
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); op.accepted.setValue(true); op.confirm(); await closed;
    expect(page.state()).toBe('recovery'); noCommand();
  });
  for (const corrupt of ['fixture', 'no-readback', 'wrong-preserved', 'wrong-command', 'replay', 'envelope', 'transport'] as const) {
    it(`post-dispatch ${corrupt} stays UNKNOWN across recheck/reload/new UUID`, async () => {
      await start(); prepare(); const req = await approve();
      let r: object = receipt(req.request.body);
      if (corrupt === 'fixture') r = { ...r, dataSource: 'isolated-fixture' };
      if (corrupt === 'no-readback') { const copy = { ...receipt(req.request.body) }; delete (copy as any).readBackVerifiedAt; r = copy; }
      if (corrupt === 'wrong-preserved') r = { ...r, recorded: { ...receipt().recorded, briefing: true } };
      if (corrupt === 'wrong-command') r = { ...r, commandId: crypto.randomUUID() };
      if (corrupt === 'replay') r = { ...r, replayed: true };
      if (corrupt === 'transport') req.error(new ProgressEvent('error'));
      else req.flush(r, corrupt === 'envelope' ? { headers: {} } : wire);
      render(); expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull(); expect(session.uncertain()).toBe(true);
      page.recheck(); http.expectOne('/api/v1/identity').flush(principal()); render();
      expect(page.state()).toBe('recovery'); http.expectNone(base + '/context'); noCommand();
      history.replaceState({}, ''); const reload = new StationExitSession();
      expect(reload.begin(selection(), crypto.randomUUID())).toBe(false);
      expect(reload.resolve(selection(), req.request.body.commandId)).toBe(false);
    });
  }
  it('stale/rolled-back command needs fresh context, never auto-retry', async () => {
    await start(); prepare(); const req = await approve();
    req.flush(arrivalProblemFixture(409, 'STALE_PREPARATION', req.request.body.commandId, 'rolled-back', 'prepare-again'),
      { status: 409, statusText: 'Conflict', headers: problemWire }); render();
    expect(page.state()).toBe('error'); expect(page.context()).toBeNull(); expect(page.validation()).toBeNull();
    expect(session.uncertain()).toBe(false); page.confirm(); page.validate(); noCommand();
  });
  it('pending departure keeps safety; unsubscribing is not cancellation', async () => {
    await start(); prepare(); const req = await approve();
    page = await h.navigateByUrl('/station-exit', StationExitPage);
    http.expectOne('/api/v1/identity').flush(principal()); render();
    expect(req.cancelled).toBe(true); expect(page.state()).toBe('recovery'); expect(session.uncertain()).toBe(true); noCommand();
  });
  for (const Mode of [StageArrivalSession, StationArrivalSession]) for (const dataSource of ['oracle-test', 'isolated-fixture'] as const) {
    it(`${Mode.name}/${dataSource} UNKNOWN blocks exit before context`, async () => {
      const other = Mode === StageArrivalSession ? TestBed.inject(StageArrivalSession) : TestBed.inject(StationArrivalSession);
      expect(other.begin({ ...selection(), dataSource }, crypto.randomUUID())).toBe(true);
      await start(); expect(page.state()).toBe('recovery'); http.expectNone(base + '/context'); noCommand();
    });
  }
  for (const operation of ['stage', 'station'] as const) for (const native of [true, false]) {
    it(`exit uncertainty blocks ${native ? 'native' : 'fixture'} ${operation} despite source change`, async () => {
      session.begin(selection(), crypto.randomUUID());
      const p = native ? operation === 'stage' ? nativeIdentityFixture() : nativeStationIdentityFixture() : jointIdentityFixture();
      p.principal.resourceScope.orgUnitIds = ['0021'];
      const s = { ...selection(), dataSource: native ? 'oracle-test' as const : 'isolated-fixture' as const, actor: actorBinding(p) };
      if (operation === 'stage') TestBed.inject(StageArrivalSession).selection = s;
      else TestBed.inject(StationArrivalSession).selection = s;
      const target = `/employees/9001/shift-days/6201/${operation}-arrival`;
      await h.navigateByUrl(target); http.expectOne('/api/v1/identity').flush(p); render();
      const other = h.routeDebugElement!.componentInstance as StageArrivalPage | StationArrivalPage;
      expect(other.state()).toBe('recovery'); other.validate(); other.confirm();
      http.expectNone(r => r.url.endsWith('/context') || r.url.endsWith('/validations') || r.url.endsWith('/commands'));
    });
  }
});
