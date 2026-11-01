import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { StationArrivalPage } from './station-arrival-page';
import { StationArrivalDialog } from './station-arrival-dialog';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalSession } from './stage-arrival-session';
import { StationExitSession } from './station-exit-session';
import { ShiftManagementSession } from './shift-management-session';
import { NativeCommandSession } from './native-command-session';
import { lateIdentityFixture as identity, lateContextFixture as context, lateSelectionFixture as selection,
  lateValidationFixture as validation, lateReceiptFixture as receipt } from './station-arrival-late-fixtures';
import { nativeStationIdentityFixture } from './native-station-arrival-fixtures';
const base = '/api/v1/employees/9001/shift-days/6201/station-arrival-late';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
describe('approved50-v0.1 page — synthetic typed HTTP, not Oracle', () => {
  let http: HttpTestingController, h: RouterTestingHarness, page: StationArrivalPage;
  const render = () => h.detectChanges();
  const noCommand = () => http.expectNone(base + '/commands');
  async function start(minute = '0', p: object = identity()) {
    TestBed.inject(StationArrivalSession).selection = selection(minute);
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-arrival-late', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(p);
    if (page.state() === 'loading') http.expectOne(base + '/context').flush(context(minute), wire);
    render();
  }
  function prepare(minute = '0') {
    page.reason.setValue('1'); page.validate();
    const r = http.expectOne(base + '/validations');
    expect(r.request.body).toEqual({ lateReasonCode: '1', lateRemark: null });
    r.flush(validation(minute), wire); render(); noCommand();
  }
  function currentDialog() {
    const ref = TestBed.inject(MatDialog).openDialogs[0];
    if (!(ref?.componentInstance instanceof StationArrivalDialog)) throw Error('Missing typed dialog');
    return { ref, instance: ref.componentInstance };
  }
  async function accept() {
    const { ref, instance } = currentDialog();
    const done = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    instance.accepted.setValue(true); instance.confirm(); await done; render();
  }
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    history.replaceState({}, ''); sessionStorage.clear();
  });
  it.each(['0', '1'])('two fresh unchecked consents before exactly one command for late%s', async minute => {
    await start(minute);
    expect(page.canValidate()).toBe(false); expect(page.reason.value).toBeNull();
    expect(h.routeNativeElement!.textContent).toContain('הגעה לעמדה באיחור — TEST');
    expect(h.routeNativeElement!.querySelector('textarea,input[type=datetime-local]')).toBeNull();
    prepare(minute);
    expect(currentDialog().instance.data.kind).toBe('native-late-warning');
    expect(currentDialog().instance.accepted.value).toBe(false);
    currentDialog().instance.confirm(); noCommand();
    await accept(); expect(page.state()).toBe('review'); noCommand();
    page.confirm(); render();
    expect(currentDialog().instance.data.kind).toBe('native-late-confirmation');
    expect(currentDialog().instance.accepted.value).toBe(false); currentDialog().instance.confirm(); noCommand();
    await accept();
    const r = http.expectOne(base + '/commands');
    expect(r.request.body).toEqual({ commandId: expect.stringMatching(/^[a-f0-9-]{36}$/),
      draft: { lateReasonCode: '1', lateRemark: null }, fingerprint: 'b'.repeat(64), validationToken: 's'.repeat(43),
      confirmation: { accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] }, operationConfirmation: { accepted: true } });
    expect(page.state()).toBe('committing'); expect(page.receipt()).toBeNull();
    page.confirm(); page.validate(); noCommand();
    r.flush(receipt(r.request.body, minute), wire); render();
    expect(page.state()).toBe('success'); expect(page.receipt()?.dataSource).toBe('oracle-test');
    expect(h.routeNativeElement!.textContent).toContain('אין השלמת שותף חיצוני');
    page.confirm(); page.validate(); noCommand();
  });
  it('cancel whole consent clears warning ACK and requires pure reprepare, zero command', async () => {
    await start(); prepare(); await accept(); page.confirm(); render();
    const { ref } = currentDialog(), done = new Promise(resolve => ref.afterClosed().subscribe(resolve));
    ref.close(false); await done; render();
    expect(page.validation()).toBeNull(); expect(page.state()).toBe('ready');
    expect(TestBed.inject(NativeCommandSession).affectsEmployee('9001')).toBe(false); noCommand();
    page.confirm(); noCommand(); prepare(); expect(currentDialog().instance.accepted.value).toBe(false);
  });
  it('expiry at minute clears preparation and consent; late0 is not on-time', async () => {
    let now = 100; vi.spyOn(performance, 'now').mockImplementation(() => now);
    await start(); prepare(); await accept(); now += 54000;
    page.confirm(); render(); expect(page.state()).toBe('expired'); expect(page.validation()).toBeNull(); noCommand();
  });
  it('wrong exact native identity is denied without fallback or ordinary context', async () => {
    await start('0', nativeStationIdentityFixture());
    expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull(); noCommand();
    http.expectNone(base + '/context'); http.expectNone(r => r.url.endsWith('/station-arrival/context'));
  });
  it('missing selected row never auto-selects from URL or consumes a preparation', async () => {
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-arrival-late', StationArrivalPage);
    http.expectOne('/api/v1/identity').flush(identity()); render();
    expect(page.state()).toBe('chooser'); expect(page.selection()).toBeNull(); http.expectNone(base + '/context'); noCommand();
  });
  it('failed identity remains denied; stale canceled identity generation cannot load old context', async () => {
    TestBed.inject(StationArrivalSession).selection = selection();
    page = await h.navigateByUrl('/employees/9001/shift-days/6201/station-arrival-late', StationArrivalPage);
    const old = http.expectOne('/api/v1/identity'); page.recheck(); expect(old.cancelled).toBe(true);
    http.expectOne('/api/v1/identity').flush({}, { status: 503, statusText: 'Synthetic unavailable' }); render();
    expect(page.principal()).toBeNull(); expect(page.state()).toBe('denied'); http.expectNone(base + '/context'); noCommand();
  });
  it('pure pending context recheck cancels old generation and never preserves consents', async () => {
    await start(); page.reason.setValue('1'); page.validate();
    const old = http.expectOne(base + '/validations'); page.recheck(); expect(old.cancelled).toBe(true);
    http.expectOne('/api/v1/identity').flush(identity()); http.expectOne(base + '/context').flush(context(), wire); render();
    expect(page.validation()).toBeNull(); expect(page.reason.value).toBe('1'); noCommand();
  });
  it('catalog label drift clears even an existing reason code; no remembered substitution', async () => {
    await start(); page.reason.setValue('1'); page.recheck(); http.expectOne('/api/v1/identity').flush(identity());
    http.expectOne(base + '/context').flush({ ...context(), lateReasonOptions: [{ code: '1', label: 'תיאור סינתטי חדש' }] }, wire); render();
    expect(page.reason.value).toBeNull(); expect(page.validation()).toBeNull(); expect(page.canValidate()).toBe(false); noCommand();
  });
  it('empty catalog, deferred and already observed states are read-only, not this command success', async () => {
    await start(); page.recheck(); http.expectOne('/api/v1/identity').flush(identity());
    http.expectOne(base + '/context').flush({ ...context(), lateReasonOptions: [] }, wire); render();
    expect(page.canValidate()).toBe(false); expect(page.receipt()).toBeNull(); noCommand();
    page.recheck(); http.expectOne('/api/v1/identity').flush(identity());
    http.expectOne(base + '/context').flush({ ...context(), eligibility: 'deferred', blockers: ['UNSUPPORTED_DAY'] }, wire); render();
    expect(page.state()).toBe('ineligible'); expect(page.message()).toContain('הכרעת בעל'); noCommand();
    page.recheck(); http.expectOne('/api/v1/identity').flush(identity());
    http.expectOne(base + '/context').flush({ ...context(), eligibility: 'already-recorded',
      recorded: { ...context().recorded, stationArrivalLocal: '2026-10-20T10:22:03' } }, wire); render();
    expect(page.state()).toBe('ineligible'); expect(page.receipt()).toBeNull(); noCommand();
  });
  it('catalog/context drift and actor generation drift cannot reuse preparation', async () => {
    await start(); prepare(); await accept();
    page.context.update(c => c ? { ...c, lateReasonOptions: [{ code: '1', label: 'השתנה' }] } : null);
    page.confirm(); render(); expect(page.state()).toBe('recovery'); noCommand();
  });
  it('UNKNOWN blocks ALL native families on other days/source and reload with a fresh UUID', async () => {
    await start(); prepare(); await accept(); page.confirm(); render(); await accept();
    const r = http.expectOne(base + '/commands'); r.flush({}, { status: 503, statusText: 'Unknown' }); render();
    expect(page.state()).toBe('unknown');
    const changed = { ...selection(), shiftDayId: '6202', attendanceKey: { shiftDayId: '6202' }, actor: 'changed', dataSource: 'isolated-fixture' as const };
    expect(TestBed.inject(StageArrivalSession).affects(changed)).toBe(true);
    expect(TestBed.inject(StationExitSession).affects(changed)).toBe(true);
    expect(TestBed.inject(ShiftManagementSession).affectsEmployee('9001')).toBe(true);
    expect(TestBed.inject(StationArrivalSession).begin(changed, crypto.randomUUID())).toBe(false);
    const persisted = sessionStorage.getItem('shfNativeCommandSafety')!;
    expect(persisted).not.toMatch(/9001|6201|token|fingerprint|reason|receipt|actor/);
    const reloaded = new NativeCommandSession();
    expect(reloaded.affectsEmployee('9999')).toBe(true);
    expect(reloaded.begin('9001', crypto.randomUUID())).toBe(false);
    page.recheck(); http.expectOne('/api/v1/identity').flush(identity()); render();
    expect(page.state()).toBe('recovery'); noCommand();
  });
});
