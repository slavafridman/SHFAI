import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StageArrivalPage, NativeArrivalConfirmation } from './stage-arrival-page';
import { StageArrivalSession } from './stage-arrival-session';
import { actorBinding } from './stage-arrival-contract';
import { nativeContextFixture, nativeIdentityFixture, nativeSelectionFixture,
  nativeValidationFixture, nativeReceiptFixture } from './native-arrival-fixtures';
import { arrivalIdentityFixture, arrivalSelectionFixture, arrivalReceiptFixture, arrivalProblemFixture } from './stage-arrival-fixtures';
import { fixtureIdentity } from './test-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/stage-arrival';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
const problemWire = { ...wire.headers, 'Content-Type': 'application/problem+json' };
describe('Native UI / HTTP testing double, NOT Oracle execution', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: StageArrivalPage, session: StageArrivalSession;
  const render = () => harness.detectChanges();
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(p = nativeIdentityFixture(), c: object = nativeContextFixture()) {
    session.selection = nativeSelectionFixture();
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(p);
    if (page.state() === 'loading') http.expectOne(base + '/context').flush(c, wire);
    render();
  }
  function prepare(v: object = nativeValidationFixture()) {
    page.validate(); const r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({ lateReasonCode: null, lateRemark: null });
    expect(r.request.method).toBe('POST'); expect(r.request.params.keys()).toEqual([]);
    r.flush(v, wire); render(); noCommand();
  }
  function dialog() {
    page.confirm(); render();
    const ref = TestBed.inject(MatDialog).openDialogs[0];
    expect(ref.componentInstance).toBeInstanceOf(NativeArrivalConfirmation); noCommand(); return ref;
  }
  async function approve() {
    const ref = dialog(), op = ref.componentInstance as NativeArrivalConfirmation;
    const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    op.accepted.setValue(true); op.approve(); await closed; render();
    return http.expectOne(base + '/commands');
  }
  beforeEach(async () => {
    history.replaceState({}, '');
    sessionStorage.removeItem('shfNativeArrivalSafety');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); session = TestBed.inject(StageArrivalSession);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => { TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    history.replaceState({}, ''); sessionStorage.removeItem('shfNativeArrivalSafety'); });
  it('10/native source is not rejected by fixture9 check; distinct honest badges and no arrival time/reason input', async () => {
    await start(); expect(page.state()).toBe('ready'); expect(page.allowed()).toBe(true);
    const text = harness.routeNativeElement!.textContent!;
    expect(text).toContain('Controlled TEST Oracle write'); expect(text).toContain('oracle-test');
    expect(text).toContain('ללא רישום איחור'); expect(text).not.toContain('ללא כתיבות Oracle');
    expect(harness.routeNativeElement!.querySelector('input,mat-select')).toBeNull();
    expect(page.principal()?.principal.employeeId).toBeNull(); noCommand();
  });
  for (const mode of ['read7', 'fixture9', 'missing', 'extra11', 'wrong-source', 'grants'] as const) {
    it(`${mode} cannot acquire native context or command authority`, async () => {
      const p = mode === 'read7' ? fixtureIdentity() : mode === 'fixture9' ? arrivalIdentityFixture() : nativeIdentityFixture();
      if (mode === 'read7') p.dataSource = 'oracle';
      if (mode === 'missing') p.principal.capabilities.pop();
      if (mode === 'extra11') (p.principal.capabilities as string[]).push('attendance-station-arrival:commit');
      if (mode === 'wrong-source') p.dataSource = 'isolated-fixture';
      if (mode === 'grants') p.principal.resourceScope.orgUnitIds = ['0022'];
      await start(p); expect(page.state()).toBe('denied'); expect(page.context()).toBeNull();
      http.expectNone(base + '/context'); page.validate(); page.confirm(); noCommand();
    });
  }
  it('PURE0 -> review0 -> full dialog0 -> explicit confirmation1; stable pending focus and exact command', async () => {
    await start(); prepare(); expect(page.state()).toBe('review');
    const request = await approve();
    expect(request.request.body).toEqual({ commandId: expect.stringMatching(/^[a-f0-9-]{36}$/),
      draft: { lateReasonCode: null, lateRemark: null }, fingerprint: 'a'.repeat(64),
      validationToken: 'x'.repeat(43), confirmation: null, operationConfirmation: { accepted: true } });
    expect(request.request.method).toBe('POST'); expect(request.request.params.keys()).toEqual([]);
    expect(request.request.cache).toBe('no-store'); expect(request.request.timeout).toBe(5000);
    expect(history.state.shfNativeSafety).toEqual([{ commandId: request.request.body.commandId,
      kind: 'stage-arrival', mode: 'test-oracle-controlled' }]);
    expect(JSON.stringify(history.state)).not.toMatch(/9001|6201|fingerprint|validationToken|recorded|receipt/);
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#arrival-confirm')!;
    button.focus(); button.click(); page.confirm(); render(); noCommand();
    expect(button.getAttribute('aria-disabled')).toBe('true'); expect(document.activeElement).toBe(button);
    request.flush(nativeReceiptFixture(request.request.body), wire); render();
    expect(page.state()).toBe('success'); expect(page.receipt()?.outcome).toBe('oracle-test-committed');
    expect(harness.routeNativeElement!.querySelector('#arrival-success')!.textContent).not.toContain('הצלחה בסימולציה');
    expect(history.state.shfNativeSafety).toBeUndefined();
    page.validate(); page.confirm(); noCommand(); http.expectNone(base + '/validations');
  });
  it('UI-D01 registers scoped component keyboard rings and opts the overlay into its namespace, without button opacity', async () => {
    await start(); prepare(); const ref = dialog();
    expect(document.querySelector('.cdk-overlay-pane.shf-arrival-dialog')).not.toBeNull();
    const rules = [...document.styleSheets].flatMap(s => [...s.cssRules])
      .filter((r): r is CSSStyleRule => r instanceof CSSStyleRule);
    // The unit runner does not attach external global CSS. Do not synthesize
    // it here: overlay focus is measured from real Chrome screenshot pixels.
    for (const scope of ['.actions']) {
      const focus = rules.filter(r => r.selectorText.includes(scope) && r.selectorText.includes('.mat-mdc-button-base') &&
        r.selectorText.includes(':focus-visible') && r.selectorText.includes('.cdk-keyboard-focused'));
      expect(focus.some(r => r.style.getPropertyValue('outline') === '3px solid #002f65' &&
        r.style.getPropertyValue('outline-offset') === '3px'), `${scope}: ${focus.map(r => r.cssText).join('\n')}`).toBe(true);
    }
    expect(rules.filter(r => r.selectorText.includes('.actions') && r.selectorText.includes('[aria-disabled="true"]'))
      .every(r => r.style.getPropertyValue('opacity') === '')).toBe(true);
    ref.close(false);
  });
  it('UI-D02 restores the exact opener AFTER pending render and scrolls only when measured outside viewport', async () => {
    await start(); prepare();
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#arrival-confirm')!;
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 926, 240, 48));
    const scroll = vi.fn(() => {
      expect(document.activeElement).toBe(button);
      expect(page.state()).toBe('committing');
      expect(button.textContent).toContain('ממתינים לתוצאה');
    });
    Object.defineProperty(button, 'scrollIntoView', { configurable: true, value: scroll });
    button.focus();
    const r = await approve(); TestBed.tick(); render();
    expect(document.activeElement).toBe(button); expect(scroll).toHaveBeenCalled();
    expect(scroll).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    expect(button.getAttribute('aria-disabled')).toBe('true'); page.confirm(); noCommand();
    // A later result must not steal the user's focus or scroll to the old node.
    scroll.mockClear();
    const other = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#arrival-cancel')!; other.focus();
    r.flush(nativeReceiptFixture(r.request.body), wire); TestBed.tick(); render();
    expect(document.activeElement).toBe(other); expect(scroll).not.toHaveBeenCalled();
  });
  it('UI-D02 in-view pending opener needs no scroll and stale generation cannot restore it after recheck', async () => {
    await start(); prepare();
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#arrival-confirm')!;
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 200, 240, 48));
    const scroll = vi.fn();
    Object.defineProperty(button, 'scrollIntoView', { configurable: true, value: scroll });
    button.focus(); const r = await approve(); TestBed.tick(); render();
    expect(document.activeElement).toBe(button); expect(scroll).not.toHaveBeenCalled();
    page.recheck(); http.expectOne('/api/v1/identity').flush(nativeIdentityFixture()); TestBed.tick(); render();
    expect(page.state()).toBe('recovery'); expect(r.cancelled).toBe(true);
    expect(scroll).not.toHaveBeenCalled(); noCommand();
  });
  for (const action of ['cancel', 'forged-true', 'checkbox-without-button', 'changed-selection', 'expiry'] as const) {
    it(`dialog ${action} sends zero commands and cannot reuse consent`, async () => {
      await start(); prepare(); const ref = dialog(), op = ref.componentInstance as NativeArrivalConfirmation;
      const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
      if (action === 'checkbox-without-button') op.accepted.setValue(true);
      if (action === 'changed-selection') session.selection = { ...session.selection!, employeeId: '9002' };
      if (action === 'expiry') vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 121000);
      if (action === 'expiry' || action === 'changed-selection') { op.accepted.setValue(true); op.approve(); }
      else ref.close(action === 'cancel' ? false : true);
      await closed; render(); noCommand(); http.expectNone(base + '/validations');
      expect(page.validation()).toBeNull(); page.confirm(); noCommand();
    });
  }
  it('malformed/late PURE response never offers native late command or client-derived minutes', async () => {
    await start(); prepare({ ...nativeValidationFixture(), state: 'warning-requires-confirmation',
      warnings: [{ code: 'STAGE_ARRIVAL_LATE', minutes: '0' }], confirmationRequired: true });
    expect(page.state()).toBe('error'); expect(page.validation()).toBeNull();
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0); page.confirm(); noCommand();
  });
  for (const field of ['fingerprint', 'token', 'context', 'source', 'operator', 'grants', 'attendanceKey'] as const) {
    it(`changed ${field} after preparation cannot submit, even through whole-operation dialog`, async () => {
      await start(); prepare();
      if (field === 'fingerprint') page.validation()!.fingerprint = 'b'.repeat(64);
      if (field === 'token') page.validation()!.validationToken = 'y'.repeat(43);
      if (field === 'context') page.context()!.planned.startLocal = '2026-10-20T10:31:00';
      if (field === 'source') page.context()!.dataSource = 'isolated-fixture';
      if (field === 'operator') page.principal()!.principal.subject = 'different-operator';
      if (field === 'grants') page.principal()!.principal.resourceScope.orgUnitIds = [];
      if (field === 'attendanceKey') session.selection!.attendanceKey.shiftDayId = '6202';
      page.confirm();
      const ref = TestBed.inject(MatDialog).openDialogs[0];
      if (ref) {
        const op = ref.componentInstance as NativeArrivalConfirmation;
        const closed = new Promise(resolve => ref.afterClosed().subscribe(resolve));
        op.accepted.setValue(true); op.approve(); await closed;
      }
      noCommand(); expect(page.validation()).toBeNull();
    });
  }
  it('absent identity never falls back to synthetic Administrator or acquires context', async () => {
    session.selection = nativeSelectionFixture();
    page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    http.expectOne('/api/v1/identity').flush(null); render();
    expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull();
    http.expectNone(base + '/context'); page.validate(); page.confirm(); noCommand();
  });
  it('late/expired server refusal explicitly stops with no backdating or late controls', async () => {
    await start(); page.validate();
    http.expectOne(base + '/validations').flush(arrivalProblemFixture(409, 'COMMAND_SCOPE_DEFERRED'),
      { status: 409, statusText: 'Conflict', headers: problemWire });
    render(); expect(page.message()).toContain('איחור או חלון שפג'); expect(page.canValidate()).toBe(false);
    noCommand(); expect(harness.routeNativeElement!.querySelector('input')).toBeNull();
  });
  for (const response of ['fixture', 'no-readback', 'readback-before-ack', 'network', 'unknown', 'malformed-error', 'bad-envelope'] as const) {
    it(`${response} after POST is UNKNOWN, never success or retry`, async () => {
      await start(); prepare(); const r = await approve();
      if (response === 'fixture') r.flush(arrivalReceiptFixture(r.request.body), wire);
      else if (response === 'network') r.error(new ProgressEvent('error'));
      else if (response === 'unknown' || response === 'malformed-error')
        r.flush(arrivalProblemFixture(503, 'COMMAND_OUTCOME_UNKNOWN', r.request.body.commandId,
          response === 'unknown' ? 'unknown' : 'none', 'reconcile'), { status: 503, statusText: 'Unavailable', headers: problemWire });
      else {
        const receipt: any = nativeReceiptFixture(r.request.body);
        if (response === 'no-readback') delete receipt.readBackVerifiedAt;
        if (response === 'readback-before-ack') receipt.readBackVerifiedAt = '2026-10-20T07:22:00Z';
        r.flush(receipt, response === 'bad-envelope' ? {} : wire);
      }
      render(); expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull();
      expect(session.uncertain()).toBe(true); expect(history.state.shfNativeSafety).toHaveLength(1);
      page.confirm(); page.validate(); noCommand(); http.expectNone(base + '/validations');
    });
  }
  for (const effect of ['none', 'rolled-back']) {
    it(`definitive ${effect} allows ONLY explicit new preparation, not auto retry`, async () => {
      await start(); prepare(); const r = await approve();
      r.flush(arrivalProblemFixture(409, 'STALE_PREPARATION', r.request.body.commandId, effect, 'prepare-again'),
        { status: 409, statusText: 'Conflict', headers: problemWire });
      expect(session.uncertain()).toBe(false); expect(page.canValidate()).toBe(true);
      expect(page.validation()).toBeNull(); noCommand(); http.expectNone(base + '/validations');
      page.confirm(); noCommand(); prepare(); noCommand();
    });
  }
  it('UNKNOWN survives native10 -> fixture9 -> read7 -> native10 without any new context/prepare/command', async () => {
    await start(); prepare(); const r = await approve(); r.error(new ProgressEvent('error'));
    for (const p of [arrivalIdentityFixture(), fixtureIdentity(), nativeIdentityFixture()]) {
      session.selection = p.dataSource === 'oracle' ? nativeSelectionFixture() : arrivalSelectionFixture();
      session.selection.actor = actorBinding(p);
      page.selection.set(structuredClone(session.selection));
      page.recheck(); http.expectOne('/api/v1/identity').flush(p);
      page.validate(); page.confirm(); noCommand(); http.expectNone(base + '/context'); http.expectNone(base + '/validations');
      expect(session.uncertain()).toBe(true); expect(page.receipt()).toBeNull();
    }
    // Simulated reload reconstructs only the minimal marker, not cached payload.
    const reloaded = new StageArrivalSession(); expect(reloaded.blocked(nativeSelectionFixture())).toBe(true);
    expect(reloaded.blocked(arrivalSelectionFixture())).toBe(true);
    expect(sessionStorage.getItem('shfNativeArrivalSafety')).not.toMatch(/9001|6201|fingerprint|validationToken|actor|receipt/);
  });
  it('changed source/grants during pending retains safety even if a definitive old rejection arrives', async () => {
    await start(); prepare(); const r = await approve();
    page.principal.set(arrivalIdentityFixture());
    r.flush(arrivalProblemFixture(409, 'STALE_PREPARATION', r.request.body.commandId, 'none', 'prepare-again'),
      { status: 409, statusText: 'Conflict', headers: problemWire });
    expect(page.state()).toBe('unknown'); expect(session.uncertain()).toBe(true); noCommand();
  });
  it('known native success cannot be reopened by changed actor grants for the same tuple', async () => {
    await start(); prepare(); const r = await approve(); r.flush(nativeReceiptFixture(r.request.body), wire);
    const s = nativeSelectionFixture(); s.actor = 'changed-actor'; expect(session.blocked(s)).toBe(true);
  });
});
