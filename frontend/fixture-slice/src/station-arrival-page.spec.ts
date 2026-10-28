import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
import { stationIdentityFixture, stationSelectionFixture, stationContextFixture,
  stationValidationFixture, stationReceiptFixture } from './station-arrival-fixtures';
import { arrivalIdentityFixture, arrivalReceiptFixture } from './stage-arrival-fixtures';
import { arrivalContextFixture, arrivalValidationFixture } from './stage-arrival-fixtures';
import { StageArrivalPage } from './stage-arrival-page';
import { Router } from '@angular/router';
const base = '/api/v1/employees/9001/shift-days/6201/station-arrival';
const wire = { headers: { 'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemWire = { headers: { ...wire.headers, 'Content-Type': 'application/problem+json' } };
describe('F2 §§41–42 Angular, isolated typed HTTP double only', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: StationArrivalPage, session: StationArrivalSession;
  const render = () => harness.detectChanges();
  async function start(selected = true, late = false, context = stationContextFixture(late)) {
    if (selected) {
      session.selection = stationSelectionFixture();
      session.selection.startLocal = context.planned.startLocal;
      session.selection.endLocal = context.planned.endLocal;
    }
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    if (selected && page.state() === 'loading') {
      const req = http.expectOne(base + '/context');
      expect(req.request.method).toBe('GET'); expect(req.request.params.keys()).toEqual([]);
      expect(req.request.cache).toBe('no-store'); expect(req.request.timeout).toBe(5000);
      req.flush(context, wire);
    }
    render();
  }
  function validate(late = false) {
    if (late) page.reason.setValue('1');
    page.validate(); page.validate();
    const r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({ lateReasonCode: late ? '1' : null });
    expect(r.request.params.keys()).toEqual([]); expect(r.request.method).toBe('POST');
    r.flush(stationValidationFixture(late), wire); render();
    http.expectNone(base + '/commands');
  }
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); session = TestBed.inject(StationArrivalSession);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true });
    history.replaceState({}, ''); sessionStorage.clear();
  });
  it('direct route/reload has chooser, no default employee, context or command', async () => {
    await start(false); expect(page.state()).toBe('chooser');
    http.expectNone(base + '/context'); http.expectNone(base + '/commands');
    expect(harness.routeNativeElement!.querySelector('#station-validate')).toBeNull();
  });
  it.each([
    ['ordinary', '2026-10-20T18:30:00'],
    ['zero-duration', '2026-10-20T10:30:00'],
    ['overnight', '2026-10-21T02:30:00'],
  ] as const)('%s null-stage/on-time context reaches review with no command before explicit confirmation', async (_name, endLocal) => {
    const c = stationContextFixture();
    c.planned.endLocal = endLocal; c.arrivalWindow.latestLocal = endLocal;
    const before = structuredClone(c);
    await start(true, false, c);
    expect(page.state()).toBe('ready');
    validate();
    expect(page.state()).toBe('review');
    expect(page.context()?.recorded.stageArrivalLocal).toBeNull();
    expect(page.reason.value).toBeNull(); expect(page.receipt()).toBeNull();
    expect(session.uncertain()).toBe(false);
    expect(history.state.shfF2Safety).toBeUndefined();
    expect(sessionStorage.getItem('shfStationArrivalSafety')).toBeNull();
    expect(c).toEqual(before);
    http.expectNone(base + '/commands');
    page.confirm();
    const r = http.expectOne(base + '/commands');
    expect(r.request.body.draft).toEqual({ lateReasonCode: null });
    r.flush(stationReceiptFixture(r.request.body, c), wire);
    expect(page.state()).toBe('success');
  });
  it('end-before-start context remains rejected without validation or command', async () => {
    const c = stationContextFixture();
    c.planned.endLocal = '2026-10-20T10:29:59'; c.arrivalWindow.latestLocal = c.planned.endLocal;
    await start(true, false, c);
    expect(page.state()).toBe('error'); expect(page.context()).toBeNull();
    page.validate(); page.confirm();
    http.expectNone(base + '/validations'); http.expectNone(base + '/commands');
  });
  it.each([null, arrivalIdentityFixture()])('absent or 9-right identity never admits F2: %j', async identity => {
    session.selection = stationSelectionFixture();
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(identity); render();
    expect(page.state()).toBe('denied'); http.expectNone(base + '/context');
  });
  it.each([null, '2026-10-20T10:10:00'])('preserves optional stage %s, pure validate then whole-operation confirm once', async stage => {
    const c = stationContextFixture(); c.recorded.stageArrivalLocal = stage;
    await start(true, false, c); validate(); expect(page.state()).toBe('review');
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#station-confirm')!;
    button.focus(); button.click(); render();
    const r = http.expectOne(base + '/commands');
    expect(r.request.body).toEqual({ commandId: expect.any(String), draft: { lateReasonCode: null },
      fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43), confirmation: null });
    expect(history.state.shfF2Safety).toEqual([r.request.body.commandId]);
    expect(sessionStorage.getItem('shfStationArrivalSafety')).toContain(r.request.body.commandId);
    expect(JSON.stringify(history.state)).not.toMatch(/9001|reason|fingerprint|validationToken/);
    page.confirm(); page.validate(); http.expectNone(base + '/commands'); http.expectNone(base + '/validations');
    r.flush(stationReceiptFixture(r.request.body, c), wire); render();
    expect(page.state()).toBe('success'); expect(page.receipt()?.recorded.stageArrivalLocal).toBe(stage);
    expect(sessionStorage.getItem('shfStationArrivalSafety')).toBeNull();
    expect(history.state.shfF2Safety).toBeUndefined(); expect(document.activeElement).toBe(button);
  });
  it('late missing reason is associated error, cancel0 / warning ACK0 / explicit confirmation1', async () => {
    await start(true, true); page.validate(); render();
    expect(page.reason.invalid).toBe(true); http.expectNone(base + '/validations');
    validate(true);
    let ref = TestBed.inject(MatDialog).openDialogs[0];
    let closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    ref.close(false); await closed; render();
    expect(page.state()).toBe('ready'); expect(page.validation()).toBeNull();
    validate(true); ref = TestBed.inject(MatDialog).openDialogs[0];
    const w = ref.componentInstance as StationArrivalDialog;
    expect(w.data.kind).toBe('fixture-warning');
    w.confirm(); expect(page.state()).toBe('warning');
    closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    w.accepted.setValue(true); w.confirm(); await closed; render();
    expect(page.state()).toBe('review'); http.expectNone(base + '/commands');
    page.confirm(); const r = http.expectOne(base + '/commands');
    expect(r.request.body.confirmation).toEqual({ accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] });
    r.flush(stationReceiptFixture(r.request.body, stationContextFixture(true)), wire);
    expect(page.state()).toBe('success');
  });
  it('reason change invalidates ACK and forged dialog acceptance', async () => {
    await start(true, true); validate(true); const ref = TestBed.inject(MatDialog).openDialogs[0];
    page.reason.setValue(null); ref.close(true); render(); page.confirm();
    expect(page.validation()).toBeNull(); http.expectNone(base + '/commands');
  });
  it('known success re-entry reads fresh context and does not become false UNKNOWN or a new receipt', async () => {
    await start(); validate(); page.confirm(); const r = http.expectOne(base + '/commands');
    r.flush(stationReceiptFixture(r.request.body), wire);
    await harness.navigateByUrl('/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    const c = stationContextFixture(); c.eligibility = 'already-recorded'; c.recorded.stationArrivalLocal = '2026-10-20T10:22:10';
    http.expectOne(base + '/context').flush(c, wire); render();
    expect(page.state()).toBe('ineligible'); expect(page.receipt()).toBeNull(); expect(session.uncertain()).toBe(false);
    page.validate(); page.confirm(); http.expectNone(base + '/commands');
  });
  it.each([false, true])('optional F1 review/success (%s) opens F2 with a NEW context, preserving F1 receipt', async committed => {
    const stage = TestBed.inject(StageArrivalSession), f1base = base.replace('/station-', '/stage-');
    stage.selection = stationSelectionFixture();
    const f1 = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    http.expectOne(f1base + '/context').flush(arrivalContextFixture(), wire);
    f1.validate(); http.expectOne(f1base + '/validations').flush(arrivalValidationFixture(), wire);
    let original = null;
    if (committed) {
      f1.confirm(); const r = http.expectOne(f1base + '/commands');
      r.flush(arrivalReceiptFixture(r.request.body), wire); original = structuredClone(f1.receipt());
    }
    expect(f1.canOpenStation()).toBe(true); f1.openStation();
    await TestBed.inject(Router).navigateByUrl('/employees/9001/shift-days/6201/station-arrival');
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    const c = stationContextFixture(); c.recorded.stageArrivalLocal = committed ? '2026-10-20T10:22:05' : null;
    http.expectOne(base + '/context').flush(c, wire); render();
    const f2 = harness.routeDebugElement!.componentInstance as StationArrivalPage;
    expect(f2.context()?.recorded.stageArrivalLocal).toBe(c.recorded.stageArrivalLocal);
    expect(f1.receipt()).toEqual(original); http.expectNone(f1base + '/commands');
  });
  it.each(['transport', 'malformed', 'F1', 'wrong-source'])('%s command result is UNKNOWN, never retry or receipt', async mode => {
    await start(); validate(); page.confirm(); const r = http.expectOne(base + '/commands');
    if (mode === 'transport') r.error(new ProgressEvent('error'));
    else if (mode === 'malformed') r.flush({}, wire);
    else if (mode === 'F1') r.flush(arrivalReceiptFixture(r.request.body), wire);
    else r.flush({ ...stationReceiptFixture(r.request.body), dataSource: 'oracle-test' }, wire);
    render(); expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull();
    page.confirm(); page.validate(); http.expectNone(base + '/commands');
    expect(session.uncertain()).toBe(true);
    const reloaded = new StationArrivalSession(); expect(reloaded.uncertain()).toBe(true);
    expect(TestBed.inject(StageArrivalSession).uncertain()).toBe(false);
  });
  it('pending route exit survives navigation and same tuple blocks dependent F1 without claiming cancellation', async () => {
    await start(); validate(); page.confirm(); const req = http.expectOne(base + '/commands');
    await harness.navigateByUrl('/station-arrival', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    expect(req.cancelled).toBe(true); expect(session.uncertain()).toBe(true);
    const f1 = TestBed.inject(StageArrivalSession);
    expect(f1.uncertain()).toBe(false);
    expect(session.affects(stationSelectionFixture())).toBe(true);
    expect(session.affects({ ...stationSelectionFixture(), employeeId: '9002', shiftDayId: '6202' })).toBe(false);
    expect(session.affects({ ...stationSelectionFixture(), dataSource: 'oracle-test' })).toBe(false);
  });
  it('F1 unresolved on same row blocks F2, independent namespaces survive history merge', async () => {
    const stage = TestBed.inject(StageArrivalSession), s = stationSelectionFixture(), attempt = crypto.randomUUID();
    expect(stage.begin(s, attempt)).toBe(true);
    await start(); expect(page.state()).toBe('recovery'); http.expectNone(base + '/context');
    expect(session.uncertain()).toBe(false); expect(history.state.shfF1Safety).toEqual([attempt]);
  });
  it('proven stale rejects without effect and demands fresh context, retaining reason', async () => {
    await start(); validate(); page.confirm(); const r = http.expectOne(base + '/commands');
    r.flush({ type: 'urn:shf:problem:STALE_PREPARATION', title: 'Synthetic stale', status: 409,
      code: 'STALE_PREPARATION', requestId: 'test', commandId: r.request.body.commandId, effect: 'none',
      nextAction: 'prepare-again' }, { ...problemWire, status: 409, statusText: 'Conflict' });
    render(); expect(page.state()).toBe('error'); expect(page.context()).toBeNull();
    expect(session.uncertain()).toBe(false); page.validate(); http.expectNone(base + '/validations');
    page.recheck(); http.expectOne('/api/v1/identity').flush(stationIdentityFixture());
    http.expectOne(base + '/context').flush(stationContextFixture(), wire);
    expect(page.state()).toBe('ready');
  });
  it.each(['missing', 'recorded', 'outside'])('ineligible %s never validates or overwrites', async mode => {
    const c = stationContextFixture();
    if (mode === 'missing') { c.eligibility = 'deferred'; c.blockers = ['ATTENDANCE_ROW_REQUIRED']; }
    if (mode === 'recorded') { c.eligibility = 'already-recorded'; c.recorded.stationArrivalLocal = '2026-10-20T10:10:00'; }
    if (mode === 'outside') c.withinArrivalWindow = false;
    await start(true, false, c); expect(page.state()).toBe('ineligible');
    expect(harness.routeNativeElement!.querySelector('#station-validate')?.getAttribute('aria-disabled')).toBe('true');
    page.validate(); page.confirm(); http.expectNone(base + '/validations'); http.expectNone(base + '/commands');
  });
});
