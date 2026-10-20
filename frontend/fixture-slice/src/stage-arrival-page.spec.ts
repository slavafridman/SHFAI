import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StageArrivalPage, ArrivalWarning } from './stage-arrival-page';
import { StageArrivalSession } from './stage-arrival-session';
import { ViewHistory } from './view-history';
import { arrivalContextFixture, arrivalIdentityFixture, arrivalSelectionFixture,
  arrivalValidationFixture, arrivalReceiptFixture, arrivalProblemFixture } from './stage-arrival-fixtures';
import { fixtureIdentity } from './test-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/stage-arrival';
const wire = { headers: { 'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemHeaders = { ...wire.headers, 'Content-Type': 'application/problem+json; charset=utf-8' };
describe('F1 Angular / synthetic HTTP only', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: StageArrivalPage, session: StageArrivalSession;
  const render = () => harness.detectChanges();
  const command = () => http.expectOne(base + '/commands');
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(selected = true, p = arrivalIdentityFixture()) {
    if (selected) session.selection = arrivalSelectionFixture();
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(p);
    if (selected && page.state() === 'loading') {
      const r = http.expectOne(base + '/context');
      expect(r.request.method).toBe('GET'); expect(r.request.body).toBeNull();
      expect(r.request.params.keys()).toEqual([]); expect(r.request.cache).toBe('no-store');
      expect(r.request.timeout).toBe(5000); r.flush(arrivalContextFixture(), wire);
    }
    render();
  }
  function validate(late = false) {
    if (late) page.reason.setValue('1');
    page.validate(); const r = http.expectOne(base + '/validations');
    expect(r.request.method).toBe('POST'); expect(r.request.params.keys()).toEqual([]);
    expect(r.request.body).toEqual({ lateReasonCode: late ? '1' : null, lateRemark: null });
    expect(r.request.headers.get('Content-Type')).toBe('application/json');
    expect(r.request.timeout).toBe(5000); expect(r.request.cache).toBe('no-store');
    r.flush(arrivalValidationFixture(late), wire); render(); noCommand();
  }
  beforeEach(async () => {
    sessionStorage.removeItem('shfStageArrivalSafety'); sessionStorage.removeItem('shfStationArrivalSafety');
    history.replaceState({}, '');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); session = TestBed.inject(StageArrivalSession);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => { TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks(); history.replaceState({}, '');
    sessionStorage.removeItem('shfStageArrivalSafety'); sessionStorage.removeItem('shfStationArrivalSafety'); });
  it('direct route is safe chooser: no arbitrary employee request or command form', async () => {
    await start(false); expect(page.state()).toBe('chooser'); noCommand(); http.expectNone(base + '/context');
    expect(harness.routeNativeElement!.querySelector('#arrival-validate')).toBeNull();
  });
  it('clean prepare0 -> explicit confirm1, guarded duplicate while pending, exact body / history before POST', async () => {
    await start(); validate(); expect(page.state()).toBe('review');
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#arrival-confirm')!; button.focus();
    button.click(); render(); const r = command();
    expect(r.request.method).toBe('POST'); expect(r.request.params.keys()).toEqual([]);
    expect(r.request.headers.get('Content-Type')).toBe('application/json');
    expect(r.request.timeout).toBe(5000); expect(r.request.cache).toBe('no-store');
    expect(history.state.shfF1Safety).toEqual([r.request.body.commandId]);
    expect(JSON.stringify(history.state)).not.toContain('9001'); expect(JSON.stringify(history.state)).not.toContain('validationToken');
    expect(r.request.body).toEqual({ commandId: expect.stringMatching(/^[a-f0-9-]{36}$/),
      draft: { lateReasonCode: null, lateRemark: null }, validationToken: 'x'.repeat(43), fingerprint: 'a'.repeat(64), confirmation: null });
    button.click(); page.confirm(); noCommand(); expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(button);
    r.flush(arrivalReceiptFixture(r.request.body), wire); render();
    expect(page.state()).toBe('success'); expect(page.receipt()?.partnerCompletion).toBe('not-invoked');
    expect(session.blocked(session.selection)).toBe(true); expect(history.state.shfF1Safety).toBeUndefined();
    page.confirm(); page.validate(); noCommand(); http.expectNone(base + '/validations');
  });
  it('known success can read already-recorded context again without being mislabeled UNKNOWN', async () => {
    await start(); validate(); page.confirm(); const r = command();
    r.flush(arrivalReceiptFixture(r.request.body), wire);
    page = await harness.navigateByUrl('/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    expect(page.state()).toBe('chooser');
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    const c = arrivalContextFixture(); c.eligibility = 'already-recorded';
    c.recorded.stageArrivalLocal = '2026-10-20T10:22:05'; c.recorded.briefing = false;
    http.expectOne(base + '/context').flush(c, wire); render();
    expect(page.state()).toBe('ineligible'); expect(page.canValidate()).toBe(false);
    expect(harness.routeNativeElement!.querySelector('#recovery-title')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('#arrival-validate')).toBeNull(); noCommand();
  });
  it('late warning cancel0 / acknowledge -> review0 -> explicit confirm1 with exact warning', async () => {
    await start(); validate(true);
    let ref = TestBed.inject(MatDialog).openDialogs[0];
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    ref.close(false); await closed; render();
    expect(page.state()).toBe('ready'); expect(page.validation()).toBeNull(); noCommand();
    validate(true); ref = TestBed.inject(MatDialog).openDialogs[0];
    const warning = ref.componentInstance as ArrivalWarning;
    warning.review(); expect(page.state()).toBe('warning'); noCommand();
    const reviewed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    warning.accepted.setValue(true); warning.review(); await reviewed; render();
    expect(page.state()).toBe('review'); noCommand();
    page.confirm(); const r = command();
    expect(r.request.body.confirmation).toEqual({ accepted: true, warningCodes: ['STAGE_ARRIVAL_LATE'] });
    r.flush(arrivalReceiptFixture(r.request.body), wire); expect(page.state()).toBe('success');
  });
  it('input change invalidates warning, forged acceptance cannot revive preparation', async () => {
    await start(); validate(true); const ref = TestBed.inject(MatDialog).openDialogs[0];
    page.reason.setValue(null); ref.close(true); render(); page.confirm(); noCommand(); expect(page.validation()).toBeNull();
  });
  it('a bare forged dialog true without checkbox and review is not acknowledgment', async () => {
    await start(); validate(true); const ref = TestBed.inject(MatDialog).openDialogs[0];
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    ref.close(true); await closed; render(); page.confirm();
    expect(page.state()).toBe('ready'); expect(page.validation()).toBeNull(); noCommand();
  });
  it('exact expiry uses elapsed monotonic time, no auto-POST or auto-revalidation', async () => {
    let now = 0; vi.spyOn(performance, 'now').mockImplementation(() => now);
    await start(); validate(); now = 120000; page.confirm(); noCommand(); expect(page.state()).toBe('expired');
    http.expectNone(base + '/validations');
  });
  it('changing actor, selected tuple, context timestamp or grants blocks confirmation', async () => {
    await start(); validate(); session.selection!.attendanceKey.shiftDayId = '6202'; page.confirm(); noCommand();
    expect(page.validation()).toBeNull();
  });
  for (const mutation of ['token', 'fingerprint', 'time', 'source', 'actor', 'grants'] as const) {
    it(`changed ${mutation} cannot reuse a prepared operation or acknowledgment`, async () => {
      await start(); validate();
      if (mutation === 'token') page.validation()!.validationToken = 'y'.repeat(43);
      if (mutation === 'fingerprint') page.validation()!.fingerprint = 'b'.repeat(64);
      if (mutation === 'time') page.context()!.serverTime.local = '2026-10-20T10:23:00';
      if (mutation === 'source') (page.context() as any).dataSource = 'oracle';
      if (mutation === 'actor') page.principal()!.principal.subject = 'other';
      if (mutation === 'grants') page.principal()!.principal.resourceScope.orgUnitIds.push('0022');
      page.confirm(); noCommand(); expect(page.receipt()).toBeNull();
    });
  }
  for (const scenario of ['disconnect', '500', 'wrong-source', 'malformed', 'unknown'] as const) {
    it(`${scenario} after command -> UNKNOWN never retry / false zero, marker survives reload and chooser`, async () => {
      await start(); validate(); page.confirm(); const r = command();
      if (scenario === 'disconnect') r.error(new ProgressEvent('error'));
      if (scenario === '500') r.flush({ message: 'Synthetic unproved server failure' }, { status: 500, statusText: 'Error', headers: problemHeaders });
      if (scenario === 'wrong-source') r.flush({ ...arrivalReceiptFixture(r.request.body), dataSource: 'oracle' }, wire);
      if (scenario === 'malformed') r.flush({}, wire);
      if (scenario === 'unknown') r.flush(arrivalProblemFixture(503, 'COMMAND_OUTCOME_UNKNOWN', r.request.body.commandId, 'unknown', 'reconcile'), { status: 503, statusText: 'Unknown', headers: problemHeaders });
      expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull();
      const reloaded = new StageArrivalSession(); expect(reloaded.selection).toBeNull();
      expect(reloaded.blocked(arrivalSelectionFixture())).toBe(true);
      page.confirm(); page.validate(); noCommand(); http.expectNone(base + '/validations');
      page = await harness.navigateByUrl('/stage-arrival', StageArrivalPage);
      http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture()); render();
      expect(history.state.shfF1Safety).toHaveLength(1); expect(page.state()).toBe('recovery');
      page.recheck(); http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
      http.expectNone(base + '/context'); noCommand();
    });
  }
  it('pending navigation retains marker and cannot be interpreted as cancellation', async () => {
    await start(); validate(); page.confirm(); const r = command();
    page = await harness.navigateByUrl('/stage-arrival', StageArrivalPage);
    expect(r.cancelled).toBe(true);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    expect(page.state()).toBe('recovery'); expect(history.state.shfF1Safety).toHaveLength(1); noCommand();
  });
  it('seven-capability Oracle remains valid read-only and never requests F1 context', async () => {
    const p = fixtureIdentity(); p.dataSource = 'oracle';
    await start(true, p); expect(page.identityState()).toBe('ready'); expect(page.state()).toBe('denied');
    expect(page.principal()?.dataSource).toBe('oracle'); http.expectNone(base + '/context'); noCommand();
  });
  it('missing identity/capability has no Administrator fallback', async () => {
    const p = arrivalIdentityFixture(); p.principal.capabilities.pop();
    await start(true, p); expect(page.identityState()).toBe('error'); expect(page.principal()).toBeNull(); noCommand();
  });
  it('missing attendance row is ineligible, no validation / insert', async () => {
    session.selection = arrivalSelectionFixture();
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    http.expectOne(base + '/context').flush({ ...arrivalContextFixture(), eligibility: 'deferred', blockers: ['ATTENDANCE_ROW_REQUIRED'] }, wire);
    page.validate(); expect(page.state()).toBe('ineligible'); noCommand(); http.expectNone(base + '/validations');
  });
  it('409 stale is proven-none, requires explicit prepare/review again, never auto retry', async () => {
    await start(); validate(); page.confirm(); const r = command();
    r.flush(arrivalProblemFixture(409, 'STALE_PREPARATION', r.request.body.commandId, 'none', 'prepare-again'),
      { status: 409, statusText: 'Conflict', headers: problemHeaders });
    expect(page.receipt()).toBeNull(); expect(page.validation()).toBeNull(); noCommand();
    expect(session.blocked(session.selection)).toBe(false); expect(page.canValidate()).toBe(true);
  });
  it('canonical known-before-effect 500/none is an explicit stopped failure, not a forged receipt or retry', async () => {
    await start(); validate(); page.confirm(); const r = command();
    r.flush(arrivalProblemFixture(500, 'INTERNAL_ERROR', r.request.body.commandId),
      { status: 500, statusText: 'Synthetic error', headers: problemHeaders });
    expect(page.state()).toBe('error'); expect(page.canValidate()).toBe(false);
    expect(page.receipt()).toBeNull(); page.confirm(); page.validate(); noCommand();
  });
  for (const status of [400, 401, 403, 404, 422] as const) {
    it(`pure validation ${status} preserves no-command semantics and exact independent problems`, async () => {
      await start(); page.validate(); const r = http.expectOne(base + '/validations');
      const code = ({ 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN',
        404: 'SHIFT_DAY_NOT_FOUND', 422: 'BUSINESS_VALIDATION_FAILED' })[status];
      r.flush(arrivalProblemFixture(status, code, null, 'none', [400, 422].includes(status) ? 'correct-and-validate' : 'stop'),
        { status, statusText: 'Synthetic error', headers: problemHeaders });
      render(); expect(page.validation()).toBeNull(); expect(page.receipt()).toBeNull(); noCommand();
      if (status === 422) { expect(page.reason.hasError('server')).toBe(true); expect(page.reason.touched).toBe(true); }
      if ([401, 403].includes(status)) expect(page.principal()).toBeNull();
      if (status === 404) expect(page.canValidate()).toBe(false);
    });
  }
  it('history merge retains prior opaque safety when traversing an older entry and new chooser navigation', async () => {
    const attempt = '12345678-1234-4123-8123-123456789abc';
    session.merge({ shfF1Safety: [attempt] }); history.replaceState({ navigationId: 9 }, '');
    session.merge({ navigationId: 3 }); session.persist();
    expect(history.state.shfF1Safety).toEqual([attempt]);
    await start(false); expect(page.state()).toBe('recovery'); noCommand(); http.expectNone(base + '/context');
    expect(JSON.stringify(history.state)).not.toContain('employeeId');
  });
  it('restores an immutable per-entry selected row, never the last other worker or its preparation', async () => {
    await start(); validate();
    const a = structuredClone(page.selection()!);
    const b = { ...arrivalSelectionFixture(), employeeId: '9002', shiftDayId: '6202',
      attendanceKey: { shiftDayId: '6202' }, name: 'עובד/ת דוגמה ב׳' };
    session.selection = b;
    page = await harness.navigateByUrl('/employees/9002/shift-days/6202/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    http.expectOne('/api/v1/employees/9002/shift-days/6202/stage-arrival/context').flush({
      ...arrivalContextFixture(), employeeId: '9002', shiftDayId: '6202',
    }, wire);
    expect(page.selection()?.employeeId).toBe('9002'); expect(page.validation()).toBeNull();
    // Simulate ViewHistory's already independently tested restored-entry seam.
    vi.spyOn(TestBed.inject(ViewHistory), 'saved').mockReturnValue({ arrivalSelection: a });
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(arrivalIdentityFixture());
    http.expectOne(base + '/context').flush(arrivalContextFixture(), wire);
    render(); expect(page.selection()).toEqual(a); expect(page.selection()).not.toBe(a);
    expect(page.validation()).toBeNull(); expect(page.state()).toBe('ready');
    expect(page.principal()?.principal.employeeId).toBeNull();
    expect(JSON.stringify(history.state)).not.toContain('9001'); noCommand();
  });
  for (const envelope of ['missing-media', 'wrong-media', 'cache', 'nosniff', '202'] as const) {
    it(`command success with ${envelope} response envelope is UNKNOWN, not a receipt`, async () => {
      await start(); validate(); page.confirm(); const r = command();
      const headers: Record<string, string> = { ...wire.headers };
      if (envelope === 'missing-media') delete headers['Content-Type'];
      if (envelope === 'wrong-media') headers['Content-Type'] = 'text/html';
      if (envelope === 'cache') headers['Cache-Control'] = 'public';
      if (envelope === 'nosniff') delete headers['X-Content-Type-Options'];
      r.flush(arrivalReceiptFixture(r.request.body), { headers, ...(envelope === '202' ? { status: 202, statusText: 'Accepted' } : {}) });
      expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull(); noCommand();
    });
  }
});
