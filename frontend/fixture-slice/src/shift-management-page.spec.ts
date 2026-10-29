import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { routes } from './routes';
import { ShiftManagementPage } from './shift-management-page';
import { ShiftManagementDialog } from './shift-management-dialog';
import { managementContextFixture, managementIdentityFixture, managementDraftFixture,
  managementPreparationFixture, managementReceiptFixture, managementCsvFixture } from './shift-management-fixtures';
import { dateFromWire } from './civil-date-adapter';
import { readCapabilities } from './contract';
import type { ShiftDraftV1, ReceiptBinding, CsvShiftPreviewV1 } from './shift-management-contract';
const base = '/api/v1/employees/9001/shift-management';
const wire = { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff' } };
const problemWire = { headers: { ...wire.headers, 'Content-Type': 'application/problem+json' } };
describe('M3 complete Angular flows with typed isolated HTTP only', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: ShiftManagementPage;
  const settle = async () => { await new Promise(r => setTimeout(r, 0)); harness.detectChanges(); };
  async function start(day = false, native = true, context = managementContextFixture(day, native)) {
    page = await harness.navigateByUrl(day ? '/employees/9001/shift-days/6201/manage' :
      '/employees/9001/shift-management', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush(managementIdentityFixture(native));
    http.expectOne(base + (day ? '/shift-days/6201' : '') + '/context').flush(context, wire);
    harness.detectChanges();
  }
  function fillCreate() {
    page.form.patchValue({ startDate: dateFromWire('2026-12-02'), endDate: dateFromWire('2026-12-02'),
      startTime: '10:00', endTime: '18:00', activityCode: '12', workLocation: 'site' });
    harness.detectChanges();
  }
  function prepare(c = managementContextFixture(), d: ShiftDraftV1 = managementDraftFixture()) {
    page.prepare(); page.prepare();
    const r = http.expectOne(base + '/preparations');
    expect(r.request.body).toEqual({ draft: d }); r.flush(managementPreparationFixture(c, d), wire);
    harness.detectChanges(); expect(page.state()).toBe('review');
    http.expectNone(base + '/commands');
  }
  async function confirm() {
    page.reviewOperation(); harness.detectChanges(); await settle();
    const dialog = TestBed.inject(MatDialog).openDialogs[0].componentInstance as ShiftManagementDialog;
    for (const control of dialog.checks.values()) control.setValue(true);
    dialog.operation.setValue(true); dialog.confirm(); await settle();
  }
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
  });
  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(MatDialog).closeAll(); http.verify({ ignoreCancelled: true }); vi.restoreAllMocks();
    history.replaceState({}, ''); sessionStorage.clear();
  });
  it('initial create has no business defaults or actor-as-employee and does not prepare automatically', async () => {
    await start(); expect(page.state()).toBe('editing'); expect(page.buildDraft()).toBeNull();
    expect(page.principal()?.principal.employeeId).toBeNull(); expect(page.employeeId).toBe('9001');
    http.expectNone(base + '/preparations'); http.expectNone(base + '/commands');
    expect(harness.routeNativeElement?.textContent).toContain('מסד TEST — שינוי אמיתי מבוקר');
  });
  it('missing identity grants no Administrator, context, fallback or command', async () => {
    page = await harness.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush({});
    expect(page.state()).toBe('denied'); expect(page.principal()).toBeNull(); page.prepare();
    http.expectNone(base + '/context'); http.expectNone(base + '/commands');
  });
  it('read7 identity cannot open management and native attendance rights are never added', async () => {
    page = await harness.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    const p = managementIdentityFixture(); p.principal.capabilities = [...readCapabilities];
    http.expectOne('/api/v1/identity').flush(p);
    expect(page.state()).toBe('denied'); http.expectNone(base + '/context');
  });
  it.each(['deferred', 'already-cancelled'] as const)('shows server %s without override or reconstructed receipt', async state => {
    const c = managementContextFixture(true);
    c.eligibility = state;
    if (state === 'deferred') c.blockers = ['ATTENDANCE_PRESENT'];
    else c.selected!.status = 'cancelled';
    await start(true, true, c); page.prepare();
    expect(page.state()).toBe(state === 'deferred' ? 'deferred' : 'cancelled');
    expect(page.receipt()).toBeNull(); http.expectNone(base + '/preparations');
  });
  it('creates only after review/whole consent, waits for full verified response and prevents double command', async () => {
    await start(); fillCreate(); prepare(); await confirm();
    const r = http.expectOne(base + '/commands');
    expect(r.request.body.draft).toEqual(managementDraftFixture());
    expect(r.request.body.operationConfirmation).toEqual({ accepted: true });
    expect(r.request.body.acknowledgedWarningCodes).toEqual([]);
    page.prepare(); page.reviewOperation();
    expect(page.state()).toBe('submitting'); expect(page.receipt()).toBeNull(); expect(page.blocked()).toBe(true);
    const binding: ReceiptBinding = { employeeId: '9001', kind: 'create', commandId: r.request.body.commandId,
      effects: managementPreparationFixture().effects, dataSource: 'oracle-test', businessTimeZone: 'Asia/Jerusalem' };
    r.flush(managementReceiptFixture(binding), wire); harness.detectChanges();
    expect(page.state()).toBe('committed'); expect(page.blocked()).toBe(false);
    expect(page.message()).toBe('השינוי נשמר במסד TEST ואומת בקריאה נפרדת');
    expect(sessionStorage.getItem('shfShiftManagementSafety')).toBeNull();
    expect(JSON.stringify(history.state)).not.toContain('fingerprint');
  });
  it('labels isolated fixture receipt as simulated, never native success', async () => {
    await start(false, false); fillCreate();
    const c = managementContextFixture(false, false);
    prepare(c); await confirm();
    const r = http.expectOne(base + '/commands');
    r.flush(managementReceiptFixture({ employeeId: '9001', kind: 'create', commandId: r.request.body.commandId,
      effects: managementPreparationFixture(c).effects, dataSource: 'isolated-fixture', businessTimeZone: c.businessTimeZone }), wire);
    expect(page.message()).toContain('בסימולציה מבודדת בלבד');
  });
  it('dismissal/escape-equivalent closes review without any command or quarantine', async () => {
    await start(); fillCreate(); prepare(); page.reviewOperation(); await settle();
    TestBed.inject(MatDialog).openDialogs[0].close(); await settle();
    expect(page.state()).toBe('review'); expect(page.blocked()).toBe(false); http.expectNone(base + '/commands');
  });
  it('cannot forge dialog-close consent without operating the unchecked whole checkbox', async () => {
    await start(); fillCreate(); prepare(); page.reviewOperation(); await settle();
    TestBed.inject(MatDialog).openDialogs[0].close({ accepted: true, warningCodes: [] }); await settle();
    http.expectNone(base + '/commands'); expect(page.state()).toBe('editing');
  });
  it('draft edit invalidates all previews and an open review; no stale response can restore it', async () => {
    await start(); fillCreate(); prepare(); page.reviewOperation(); await settle();
    page.form.controls.endTime.setValue('17:00'); await settle();
    expect(page.prepared()).toBeNull(); expect(page.preview()).toBeNull();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(page.state()).toBe('editing'); http.expectNone(base + '/commands');
  });
  it('late preparation after a newer draft is unsubscribed and cannot become review', async () => {
    await start(); fillCreate(); page.prepare();
    const pending = http.expectOne(base + '/preparations');
    page.form.controls.endTime.setValue('17:00');
    expect(pending.cancelled).toBe(true); expect(page.prepared()).toBeNull(); expect(page.state()).toBe('editing');
  });
  it('expires volatile preparation without submitting and preserves entered values for a fresh server check', async () => {
    await start(); fillCreate(); vi.useFakeTimers(); prepare();
    vi.advanceTimersByTime(120001);
    expect(page.state()).toBe('expired'); expect(page.prepared()).toBeNull();
    expect(page.form.controls.startTime.value).toBe('10:00');
    page.reviewOperation(); http.expectNone(base + '/commands');
    expect(page.canPrepare()).toBe(true);
  });
  it('requires explicit full overnight end date, not implicit browser rollover', async () => {
    await start(); fillCreate(); page.form.controls.endTime.setValue('02:00');
    page.prepare(); http.expectNone(base + '/preparations');
    page.form.controls.endDate.setValue(dateFromWire('2026-12-03'));
    expect(page.buildDraft()?.kind).toBe('create');
  });
  it('change sends null reasons when activity/location only, with no editable remark', async () => {
    await start(true); page.form.patchValue({ activityCode: '13', workLocation: 'home', remark: 'not sent', startReasonCode: '1' });
    const d: ShiftDraftV1 = { kind: 'change', shiftDayId: '6201', startLocal: '2026-12-02T10:00:00',
      endLocal: '2026-12-02T18:00:00', activityCode: '13', workLocation: 'home', startReasonCode: null, endReasonCode: null };
    expect(page.buildDraft()).toEqual(d);
    prepare(managementContextFixture(true), d);
    expect(harness.routeNativeElement?.querySelector('#management-remark')).toBeNull();
  });
  it('requires reasons iff corresponding times changed, including date changes', async () => {
    await start(true); page.form.controls.startTime.setValue('11:00');
    expect(page.buildDraft()).toBeNull();
    page.form.controls.startReasonCode.setValue('1');
    expect(page.buildDraft()).toMatchObject({ startReasonCode: '1', endReasonCode: null });
    page.form.controls.endDate.setValue(dateFromWire('2026-12-03'));
    expect(page.buildDraft()).toBeNull();
    page.form.controls.endReasonCode.setValue('1');
    expect(page.buildDraft()).toMatchObject({ startReasonCode: '1', endReasonCode: '1' });
  });
  it('cancel sends exact logical-cancel draft and exact union of warning ACKs; never DELETE', async () => {
    await start(true); page.chooseKind('cancel');
    page.form.patchValue({ reasonCode: 'C1', remark: 'בדיקה סינתטית' });
    const d: ShiftDraftV1 = { kind: 'cancel', shiftDayId: '6201', reasonCode: 'C1', remark: 'בדיקה סינתטית' };
    prepare(managementContextFixture(true), d); await confirm();
    const r = http.expectOne(base + '/commands');
    expect(r.request.method).toBe('POST'); expect(r.request.body.draft).toEqual(d);
    expect(r.request.body.acknowledgedWarningCodes).toEqual(['SOURCE_BECOMES_SHF', 'LOGICAL_CANCEL_PRESERVES_HISTORY']);
    r.flush(managementReceiptFixture({ employeeId: '9001', kind: 'cancel', commandId: r.request.body.commandId,
      effects: managementPreparationFixture(managementContextFixture(true), d).effects,
      dataSource: 'oracle-test', businessTimeZone: 'Asia/Jerusalem' }), wire);
    expect(page.receipt()?.effects[0].after.status).toBe('cancelled');
  });
  it.each(['malformed', 'wrong-source', 'wrong-kind', 'lost'] as const)('%s response after dispatch becomes UNKNOWN, no new UUID/reset/fallback', async mode => {
    await start(); fillCreate(); prepare(); await confirm();
    const r = http.expectOne(base + '/commands');
    if (mode === 'lost') r.error(new ProgressEvent('error'));
    else {
      const b: ReceiptBinding = { employeeId: '9001', kind: 'create', commandId: r.request.body.commandId,
        effects: managementPreparationFixture().effects, dataSource: 'oracle-test', businessTimeZone: 'Asia/Jerusalem' };
      r.flush(mode === 'malformed' ? {} : { ...managementReceiptFixture(b),
        ...(mode === 'wrong-source' ? { dataSource: 'isolated-fixture' } : { kind: 'change' }) }, wire);
    }
    expect(page.state()).toBe('unknown'); expect(page.safety.affectsEmployee('9001')).toBe(true);
    page.recheckIdentity(); page.chooseKind('csv-create'); page.prepare();
    http.expectNone('/api/v1/identity'); http.expectNone(base + '/commands');
    expect(page.receipt()).toBeNull(); expect(page.message()).toContain('אין לשלוח שוב');
  });
  it('proven canonical no-effect rejection preserves entered form, invalidates preparation and does not claim success', async () => {
    await start(); fillCreate(); prepare(); await confirm();
    const r = http.expectOne(base + '/commands');
    r.flush({ type: 'urn:shf:problem:STALE_PREPARATION', title: 'נדרשת בדיקה מחדש', requestId: 'synthetic-request',
      commandId: r.request.body.commandId, status: 409, code: 'STALE_PREPARATION', effect: 'none', nextAction: 'prepare-again' },
    { ...problemWire, status: 409, statusText: 'Conflict' });
    expect(page.state()).toBe('expired'); expect(page.form.controls.startTime.value).toBe('10:00');
    expect(page.prepared()).toBeNull(); expect(page.receipt()).toBeNull(); expect(page.blocked()).toBe(false);
  });
  it('actor/source drift while a command is pending cannot settle an old uncertain attempt', async () => {
    await start(); fillCreate(); prepare(); await confirm();
    const r = http.expectOne(base + '/commands');
    page.principal.set(managementIdentityFixture(false));
    r.flush(managementReceiptFixture({ employeeId: '9001', kind: 'create', commandId: r.request.body.commandId,
      effects: managementPreparationFixture().effects, dataSource: 'oracle-test', businessTimeZone: 'Asia/Jerusalem' }), wire);
    expect(page.state()).toBe('unknown'); expect(page.safety.affectsEmployee('9001')).toBe(true);
    expect(page.receipt()).toBeNull();
  });
  it('server named-field errors are surfaced without echoing input and preserve the entered data', async () => {
    await start(); fillCreate(); page.prepare();
    http.expectOne(base + '/preparations').flush({
      type: 'urn:shf:problem:BUSINESS_VALIDATION_FAILED', title: 'נדרשת בדיקת ערכים', requestId: 'synthetic-request',
      commandId: null, status: 422, code: 'BUSINESS_VALIDATION_FAILED', effect: 'none', nextAction: 'correct-and-validate',
      invalidParameters: [{ name: 'activityCode', reason: 'unsupported' }],
      ruleViolations: [{ row: 1, field: 'activityCode', code: 'SITE_ACTIVITY_MISMATCH' }],
    }, { ...problemWire, status: 422, statusText: 'Unprocessable Entity' });
    harness.detectChanges();
    expect(page.parameterErrors()).toEqual([{ name: 'activityCode', reason: 'unsupported' }]);
    expect(page.form.controls.activityCode.value).toBe('12');
    expect(page.form.controls.activityCode.hasError('server')).toBe(true);
    expect(harness.routeNativeElement?.textContent).toContain('הפעילות אינה מתאימה לאתר');
    page.form.controls.activityCode.setValue('13');
    expect(page.parameterErrors()).toEqual([]); expect(page.form.controls.activityCode.hasError('server')).toBe(false);
  });
  async function csvSetup(preview: CsvShiftPreviewV1 = managementCsvFixture()) {
    await start(); page.chooseKind('csv-create'); page.encoding.setValue('utf-8');
    const encoded = new TextEncoder().encode('personalId,activityCode,date,location,startTime,endTime\r\nX000000001,12,02/12/2026,m,10:00,18:00');
    const buffer = new ArrayBuffer(encoded.length), bytes = new Uint8Array(buffer); bytes.set(encoded);
    const file = new File([bytes], 'synthetic.csv', { type: 'text/csv' });
    // jsdom's File lacks arrayBuffer in some versions; the test supplies a browser-equivalent byte reader.
    Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
    const input = document.createElement('input'); input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });
    await page.selectFile({ target: input } as unknown as Event);
    page.prepare(); const r = http.expectOne(base + '/csv-previews');
    expect(r.request.body).toBe(bytes.buffer); r.flush(preview, wire); harness.detectChanges();
  }
  it('CSV previews original bytes then applies exactly two rows atomically with token only (no CSV/personal ID)', async () => {
    await csvSetup(); expect(page.state()).toBe('review'); expect(page.validRows()).toBe(2); await confirm();
    const r = http.expectOne(base + '/csv-commands');
    expect(Object.keys(r.request.body).sort()).toEqual(['acknowledgedWarningCodes', 'commandId', 'fingerprint',
      'operationConfirmation', 'previewToken']);
    expect(JSON.stringify(r.request.body)).not.toContain('000000001');
    r.flush(managementReceiptFixture({ employeeId: '9001', commandId: r.request.body.commandId, kind: 'csv-create',
      dataSource: 'oracle-test', businessTimeZone: 'Asia/Jerusalem',
      effects: managementCsvFixture().rows.flatMap(row => row.effect ? [row.effect] : []) }), wire);
    expect(page.state()).toBe('committed'); expect(page.receipt()?.effects.length).toBe(2);
    expect(page.filename()).toBe('');
  });
  it('invalid CSV with physical line/column errors cannot apply valid rows or retain ready authority', async () => {
    const v = managementCsvFixture();
    const invalid: CsvShiftPreviewV1 = { ...v, state: 'invalid', previewToken: null, fingerprint: null, expiresAt: null,
      rows: [{ line: 2, effect: null, errors: [{ column: 'personalId', code: 'CSV_EMPLOYEE_MISMATCH' }] }] };
    await csvSetup(invalid); expect(page.state()).toBe('invalid'); page.reviewOperation();
    http.expectNone(base + '/csv-commands');
    expect(harness.routeNativeElement?.textContent).toContain('personalId');
    expect(harness.routeNativeElement?.textContent).not.toContain('000000001');
    expect(harness.routeNativeElement?.querySelector('#management-review')).toBeNull();
  });
  it('encoding change invalidates complete CSV review and requires a new byte preview', async () => {
    await csvSetup(); page.encoding.setValue('windows-1255');
    expect(page.preview()).toBeNull(); expect(page.state()).toBe('editing'); page.reviewOperation();
    http.expectNone(base + '/csv-commands');
  });
});
