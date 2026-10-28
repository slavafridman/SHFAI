import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StationArrivalPage } from './station-arrival-page';
import { StationArrivalDialog } from './station-arrival-dialog';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalSession } from './stage-arrival-session';
import { nativeStationIdentityFixture as principal, nativeStationSelectionFixture as selection,
  nativeStationContextFixture as context, nativeStationValidationFixture as validation,
  nativeStationReceiptFixture as receipt } from './native-station-arrival-fixtures';
import { stationContextFixture, stationReceiptFixture } from './station-arrival-fixtures';
import { nativeIdentityFixture, nativeCommandFixture } from './native-arrival-fixtures';
import { arrivalProblemFixture } from './stage-arrival-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/station-arrival';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemWire = { ...wire.headers, 'Content-Type': 'application/problem+json' };
describe('§46 native station UI typed HTTP double, NOT Oracle', () => {
  let http: HttpTestingController, h: RouterTestingHarness, page: StationArrivalPage, session: StationArrivalSession;
  const render = () => h.detectChanges();
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(p = principal(), c: object = context()) {
    session.selection = selection();
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(p);
    if (page.state() === 'loading') http.expectOne(base + '/context').flush(c, wire);
    render();
  }
  function prepare(v: object = validation()) {
    page.validate(); const r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({ lateReasonCode: null }); expect(r.request.params.keys()).toEqual([]);
    r.flush(v, wire); render(); noCommand();
  }
  function dialog() {
    page.confirm(); render();
    const ref = TestBed.inject(MatDialog).openDialogs[0];
    expect(ref.componentInstance).toBeInstanceOf(StationArrivalDialog);
    expect((ref.componentInstance as StationArrivalDialog).data.kind).toBe('native-confirmation'); noCommand(); return ref;
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
    http = TestBed.inject(HttpTestingController); session = TestBed.inject(StationArrivalSession);
    h = await RouterTestingHarness.create();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    history.replaceState({}, ''); sessionStorage.clear();
  });
  it('honest native/synthetic notices, no inputs/reasons/F1; null stage is not a prerequisite', async () => {
    await start(); expect(page.state()).toBe('ready'); expect(page.allowed()).toBe(true);
    const text = h.routeNativeElement!.textContent!;
    expect(text).toContain('הגעה לעמדה — TEST'); expect(text).toContain('כתיבה בפועל למסד TEST');
    expect(text).toContain('מנהל מערכת סינתטי אינו העובד'); expect(text).toContain('NULL — לא ידוע');
    expect(text).not.toContain('ללא Oracle'); expect(text).not.toContain('סימולציה מבודדת בלבד');
    expect(h.routeNativeElement!.querySelector('input,mat-select,#station-to-stage')).toBeNull();
    page.openStage(); expect(page.principal()?.principal.employeeId).toBeNull();
    http.expectNone(r => r.url.includes('/stage-arrival/')); noCommand();
  });
  it('PURE -> review -> dialog has zero commands; explicit native consent dispatches exactly once', async () => {
    await start(); prepare(); const request = await approve();
    expect(request.request.body).toEqual({ commandId: expect.stringMatching(/^[a-f0-9-]{36}$/),
      draft: { lateReasonCode: null }, fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43),
      confirmation: null, operationConfirmation: { accepted: true } });
    expect(request.request.method).toBe('POST'); expect(request.request.params.keys()).toEqual([]);
    expect(request.request.cache).toBe('no-store'); expect(request.request.timeout).toBe(5000);
    expect(history.state.shfNativeStationSafety).toEqual([{ commandId: request.request.body.commandId,
      kind: 'station-arrival', mode: 'test-oracle-controlled' }]);
    expect(history.state.shfNativeSafety).toBeUndefined(); expect(history.state.shfF2Safety).toBeUndefined();
    expect(JSON.stringify(history.state)).not.toMatch(/9001|6201|fingerprint|validationToken|recorded|receipt/);
    page.confirm(); page.validate(); noCommand();
    request.flush(receipt(request.request.body), wire); render();
    expect(page.state()).toBe('success'); expect(page.receipt()?.outcome).toBe('oracle-test-committed');
    expect(h.routeNativeElement!.textContent).toContain('אישור COMMIT אינו רגע השמירה המדויק');
    expect(session.uncertain()).toBe(false); page.confirm(); page.validate(); noCommand();
  });
  it('dialog cancel invalidates preparation with no effects and no safety marker', async () => {
    await start(); prepare(); const ref = dialog();
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve)); ref.close(false); await closed; render();
    expect(page.validation()).toBeNull(); expect(page.state()).toBe('ready');
    expect(h.routeNativeElement!.querySelector('#station-confirm')).not.toBeNull();
    expect(h.routeNativeElement!.querySelector('#station-confirm')?.getAttribute('aria-disabled')).toBe('true');
    expect(session.uncertain()).toBe(false); expect(sessionStorage.getItem('shfNativeStationArrivalSafety')).toBeNull(); noCommand();
  });
  it('absent/failed identity never falls back to Administrator or starts a context request', async () => {
    session.selection = selection();
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush({}, { status: 503, statusText: 'Unavailable' }); render();
    expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull(); page.validate(); page.confirm();
    http.expectNone(base + '/context'); noCommand();
  });
  it('expired native preparation has zero effects and must be prepared and reviewed again', async () => {
    let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
    await start(); prepare(); now += 121000;
    page.confirm(); render(); expect(page.state()).toBe('expired'); expect(page.validation()).toBeNull();
    expect(session.uncertain()).toBe(false); expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0); noCommand();
  });
  it('original process/actor/context drift cannot reuse a native preparation', async () => {
    await start(); prepare(); session.selection = { ...selection(), actor: 'other process identity' };
    page.confirm(); render(); expect(page.state()).toBe('recovery'); noCommand();
  });
  it('pending departure is not cancellation; opposite native F1 remains blocked on return', async () => {
    await start(); prepare(); const req = await approve();
    page.cancel(); expect(page.state()).toBe('committing');
    await h.navigateByUrl('/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(principal()); render();
    expect(req.cancelled).toBe(true); expect(session.affects(selection())).toBe(true);
    expect(page.receipt()).toBeNull(); noCommand();
  });
  it('native warning response cannot open a warning override or dispatch a command', async () => {
    await start(); prepare({ ...validation(), state: 'warning-requires-confirmation', confirmationRequired: true,
      warnings: [{ code: 'STATION_ARRIVAL_LATE', minutes: '1' }] });
    expect(page.state()).toBe('error'); expect(page.halted()).toBe(true);
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0); page.confirm(); noCommand();
  });
  for (const mode of ['stage10', 'missing', 'wrong-source', 'grants'] as const) {
    it(`refuses ${mode} before native context`, async () => {
      const p = mode === 'stage10' ? nativeIdentityFixture() : principal();
      if (mode === 'missing') p.principal.capabilities.pop();
      if (mode === 'wrong-source') p.dataSource = 'isolated-fixture';
      if (mode === 'grants') p.principal.resourceScope.orgUnitIds = ['0022'];
      await start(p); expect(page.state()).toBe('denied'); expect(page.context()).toBeNull(); noCommand();
    });
  }
  it('fixture source mismatch cannot become native data or automatic fallback', async () => {
    await start(principal(), stationContextFixture()); expect(page.context()).toBeNull(); expect(page.canValidate()).toBe(false);
    page.validate(); noCommand(); http.expectNone(base + '/validations');
  });
  for (const corrupt of ['fixture', 'stage', 'no-readback', 'wrong-preserved', 'wrong-token', 'replay', 'envelope'] as const) {
    it(`post-dispatch ${corrupt} stays UNKNOWN across recheck, reload and new UUID`, async () => {
      await start(); prepare(); const req = await approve();
      let r: object = receipt(req.request.body);
      if (corrupt === 'fixture') r = stationReceiptFixture(req.request.body);
      if (corrupt === 'stage') r = { ...receipt(req.request.body), recorded: { stageArrivalLocal: '2026-10-20T10:22:10', briefing: false, stageLate: null } };
      if (corrupt === 'no-readback') { const copy = { ...receipt(req.request.body) }; delete (copy as any).readBackVerifiedAt; r = copy; }
      if (corrupt === 'wrong-preserved') r = { ...receipt(req.request.body), recorded: { ...receipt().recorded, briefing: true } };
      if (corrupt === 'wrong-token') page.validation.update(v => v ? { ...v, validationToken: 'x'.repeat(43) } : v);
      if (corrupt === 'replay') r = { ...receipt(req.request.body), replayed: true };
      req.flush(r, corrupt === 'envelope' ? { headers: {} } : wire); render();
      expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull(); expect(session.uncertain()).toBe(true);
      page.recheck(); http.expectOne('/api/v1/identity').flush(principal()); render();
      expect(page.state()).toBe('recovery'); noCommand(); http.expectNone(base + '/context');
      history.replaceState({}, ''); const reloaded = new StationArrivalSession();
      expect(reloaded.begin(selection(), crypto.randomUUID())).toBe(false);
      expect(reloaded.resolve(selection(), req.request.body.commandId)).toBe(false);
    });
  }
  it('already recorded is read-only observed state, never a reconstructed receipt', async () => {
    const c = context(); c.eligibility = 'already-recorded'; c.recorded.stationArrivalLocal = '2026-10-20T10:20:00';
    await start(principal(), c); expect(page.state()).toBe('ineligible'); expect(page.receipt()).toBeNull();
    expect(page.message()).toContain('לא קבלה משוחזרת'); page.validate(); noCommand();
  });
  it('stale command discards preparation and requires fresh context, validation and review', async () => {
    await start(); prepare(); const req = await approve();
    req.flush(arrivalProblemFixture(409, 'STALE_PREPARATION', req.request.body.commandId, 'rolled-back', 'prepare-again'),
      { status: 409, statusText: 'Conflict', headers: problemWire }); render();
    expect(page.state()).toBe('error'); expect(page.context()).toBeNull(); expect(page.validation()).toBeNull();
    expect(session.uncertain()).toBe(false); page.confirm(); page.validate(); noCommand();
  });
  it('a native stage UNKNOWN blocks native station on the same tuple without sharing its receipt namespace', async () => {
    const stage = TestBed.inject(StageArrivalSession); expect(stage.begin(selection(), nativeCommandFixture().commandId)).toBe(true);
    await start(); expect(page.state()).toBe('recovery'); expect(session.uncertain()).toBe(false);
    http.expectNone(base + '/context'); noCommand();
  });
});
