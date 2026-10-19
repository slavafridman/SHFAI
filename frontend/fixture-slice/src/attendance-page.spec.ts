import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepicker } from '@angular/material/datepicker';
import { By } from '@angular/platform-browser';
import { routes } from './routes';
import { AttendancePage } from './attendance-page';
import { attendanceContext, attendanceRow, attendanceList, attendanceProblem } from './attendance-contract';
import { attendanceContextFixture, attendanceListFixture, attendanceRequestFixture, attendanceRowFixture } from './attendance-fixtures';
import { fixtureIdentity } from './test-fixtures';

describe('SHF-ATTENDANCE-UI-19 Angular / synthetic HTTP', () => {
  let http: HttpTestingController, harness: RouterTestingHarness, page: AttendancePage;
  const render = () => harness.detectChanges();
  const request = () => http.expectOne(r => r.url === '/api/v1/attendance');
  const ready = () => {
    const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds.push('TEST-V');
    http.expectOne('/api/v1/identity').flush(p);
    http.expectOne('/api/v1/attendance/filter-context').flush(attendanceContextFixture()); render();
  };
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl('/attendance', AttendancePage); render();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.inject(MatDialog).closeAll(); });
  it('D01 registers a scoped solid 3px keyboard outline for the actual reload node', () => {
    ready(); const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#attendance-reload')!;
    button.focus();
    expect(document.activeElement).toBe(button);
    // jsdom cannot establish physical keyboard :focus-visible modality. Assert
    // the scoped rule here; Chrome separately measures the effective outline.
    const rule = [...document.styleSheets].flatMap(s => [...s.cssRules])
      .find(r => r instanceof CSSStyleRule && r.selectorText.includes('#attendance-reload') &&
        r.selectorText.includes(':focus-visible')) as CSSStyleRule | undefined;
    expect(rule?.style.getPropertyValue('outline')).toBe('3px solid #002f65');
    expect(rule?.style.getPropertyValue('outline-offset')).toBe('3px');
  });
  it('D02 uses Material touch/block-scroll overlay with an attendance-only panel class', () => {
    ready();
    const picker = harness.fixture.debugElement.query(By.directive(MatDatepicker)).componentInstance as MatDatepicker<Date>;
    expect(picker.touchUi).toBe(true); expect(picker.panelClass).toEqual(['shf-attendance-calendar']);
    picker.open(); render();
    expect(document.querySelector('mat-calendar.shf-attendance-calendar')).not.toBeNull();
    picker.close();
  });
  it('makes only two new exact GETs, no list before Apply, uses server clock, renders 12 source columns', () => {
    ready(); http.expectNone(r => r.url === '/api/v1/attendance');
    expect(page.form.controls.timeFrom.value).toBe('10:00');
    page.apply(); const r = request();
    expect(r.request.params.keys().sort()).toEqual(['attendanceDate', 'timeFrom', 'timeTo', 'limit', 'offset', 'sort'].sort());
    expect(r.request.method).toBe('GET'); expect(r.request.body).toBeNull(); expect(r.request.cache).toBe('no-store');
    r.flush(attendanceListFixture()); render();
    expect(harness.routeNativeElement!.querySelectorAll('thead th')).toHaveLength(12);
    expect(harness.routeNativeElement!.querySelector('#attendance-detail-5201')?.getAttribute('href')).toBe('/employees/1001/shift-days/5201');
    expect(page.principal()?.principal.employeeId).toBeNull();
  });
  it('does not infer arrival, absence or start-in-range; preserves split-only null start, night and signed reason', () => {
    ready(); const row = attendanceRowFixture(); row.planned.startLocal = null;
    row.attendance = { stageArrivalLocal: null, stationArrivalLocal: '2026-10-20T00:07:13',
      stationExitLocal: '2026-10-19T01:00:01', missingReasonCode: '-2', briefingRecorded: false };
    page.apply(); request().flush(attendanceListFixture(undefined, [row])); render();
    expect(page.result()?.items[0]).toEqual(row);
    expect(harness.routeNativeElement!.textContent).toContain('20/10/2026 00:07:13');
    expect(harness.routeNativeElement!.textContent).toContain('-2');
    for (const field of ['stageArrivalLocal', 'stationArrivalLocal', 'stationExitLocal'] as const) {
      const independent = attendanceRowFixture();
      independent.employee.firstName = '<img src=x>';
      independent.planned.activities = [{ code: '00<script>', label: '<iframe src=x>' }];
      independent.attendance[field] = '2026-10-20T03:04:05';
      page.apply(); request().flush(attendanceListFixture(undefined, [independent])); render();
      expect(page.result()?.items[0].attendance).toEqual(independent.attendance);
      expect(harness.routeNativeElement!.textContent).toContain('20/10/2026 03:04:05');
      expect(harness.routeNativeElement!.textContent).toContain('<img src=x>');
      expect(harness.routeNativeElement!.textContent).toContain('00<script>');
      expect(harness.routeNativeElement!.querySelector('main img,main iframe,main script')).toBeNull();
    }
  });
  it('Administrator without independent cap never calls either reader', () => {
    const p = fixtureIdentity(); p.principal.synthetic = false; p.principal.provider = 'real';
    p.principal.capabilities = p.principal.capabilities.filter(c => c !== 'attendance:read');
    http.expectOne('/api/v1/identity').flush(p); render();
    expect(page.canRead()).toBe(false); page.apply(); page.loadContext();
    http.expectNone('/api/v1/attendance/filter-context'); http.expectNone(r => r.url === '/api/v1/attendance');
  });
  it('rejects six-cap synthetic identity with no fallback', () => {
    const p = fixtureIdentity(); p.principal.capabilities.pop();
    http.expectOne('/api/v1/identity').flush(p); render(); expect(page.principal()).toBeNull();
    http.expectNone('/api/v1/attendance/filter-context');
  });
  it('retains compatible teams on parent change, clears incompatible teams and stale rows', () => {
    ready(); page.apply(); request().flush(attendanceListFixture());
    page.form.controls.teamCodes.setValue(['TEST-U', 'TEST-V']); page.form.controls.moked.setValue('P01');
    expect(page.form.controls.teamCodes.value).toEqual(['TEST-U']); expect(page.result()).toBeNull();
    page.form.controls.moked.setValue(null); expect(page.form.controls.teamCodes.value).toEqual(['TEST-U']);
  });
  it('serializes only approved optional filters as single comma values, retaining source NULL semantics', () => {
    ready(); page.form.patchValue({ moked: 'P01', teamCodes: ['TEST-U'], innerJobCodes: ['1'], workLocations: ['home', 'site'] });
    page.apply(); const r = request();
    expect(r.request.params.getAll('teamCodes')).toEqual(['TEST-U']);
    expect(r.request.params.getAll('innerJobCodes')).toEqual(['1']);
    expect(r.request.params.getAll('workLocations')).toEqual(['home,site']);
    expect(r.request.params.has('employeeId')).toBe(false); expect(r.request.params.has('mode')).toBe(false);
    const req = { ...attendanceRequestFixture(), mokedCode: 'P01', teamCodes: ['TEST-U'], innerJobCodes: ['1'],
      workLocations: ['home', 'site'] as ('home' | 'site')[] };
    const row = attendanceRowFixture(); row.planned.innerJob = { code: '1', label: 'תפקיד הדגמה' };
    r.flush(attendanceListFixture(req, [row])); expect(page.result()).not.toBeNull();
  });
  it('pages with frozen applied query, consumes returned lookahead and explicit reload resets offset0', () => {
    ready(); page.apply();
    const rows = Array.from({ length: 25 }, (_, i) => attendanceRowFixture(String(5201+i)));
    const first = attendanceListFixture(undefined, rows); first.page.hasMore = true; first.page.nextOffset = 25;
    request().flush(first); page.page(25); const next = request();
    expect(next.request.params.get('offset')).toBe('25'); expect(next.request.params.get('timeFrom')).toBe('10:00');
    const req = { ...attendanceRequestFixture(), offset: 25 };
    next.flush(attendanceListFixture(req, [attendanceRowFixture('5226')])); render();
    expect(page.result()?.page.offset).toBe(25);
    page.reload(); const reload = request(); expect(reload.request.params.get('offset')).toBe('0');
    reload.flush(first);
    page.form.controls.timeFrom.setValue('09:00'); page.page(25);
    http.expectNone(r => r.url === '/api/v1/attendance'); expect(page.result()).toBeNull();
  });
  it('retains invalid inputs, focuses TO for reversed interval, equality valid and edits cancel races', () => {
    ready(); page.form.controls.timeFrom.setValue('10:01'); page.apply(); render();
    expect(page.form.controls.timeTo.hasError('range')).toBe(true); expect(document.activeElement?.id).toBe('attendance-timeTo');
    page.form.controls.timeFrom.setValue('10:00'); page.apply(); const r = request();
    page.form.controls.timeTo.setValue('bad'); expect(r.cancelled).toBe(true); expect(page.result()).toBeNull();
    page.apply(); expect(page.form.controls.timeTo.value).toBe('bad'); http.expectNone(r => r.url === '/api/v1/attendance');
  });
  it('retains exact reload DOM node and focus during pending, success and error; pending reload sends nothing', () => {
    ready(); page.apply(); request().flush(attendanceListFixture()); render();
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#attendance-reload')!;
    button.focus(); button.click(); const r = request(); render();
    expect(document.activeElement).toBe(button); button.click(); http.expectNone(r => r.url === '/api/v1/attendance');
    r.flush(attendanceListFixture()); render(); expect(document.activeElement).toBe(button);
    button.click(); request().flush({ bad: true }, { status: 500, statusText: 'Synthetic' }); render();
    expect(harness.routeNativeElement!.querySelector('#attendance-reload')).toBe(button); expect(document.activeElement).toBe(button);
  });
  for (const [status, code] of [[400, 'INVALID_REQUEST'], [401, 'UNAUTHENTICATED'], [403, 'FORBIDDEN'],
    [500, 'INVALID_SOURCE_DATA'], [503, 'DEPENDENCY_TIMEOUT']] as const) {
    it(`terminal reload ${status} retains actual button and focus, clears stale rows without fallback`, async () => {
      ready(); page.apply(); request().flush(attendanceListFixture()); render();
      const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('#attendance-reload')!;
      button.focus(); button.click(); const r = request(); render();
      expect(document.activeElement).toBe(button);
      r.flush({ type: `urn:shf:problem:${code}`, code, status, title: 'Synthetic', requestId: 'test' },
        { status, statusText: 'Synthetic' });
      render(); await new Promise(r => setTimeout(r, 0)); render();
      expect(harness.routeNativeElement!.querySelector('#attendance-reload')).toBe(button);
      expect(document.activeElement).toBe(button); expect(page.result()).toBeNull();
      if (status === 401 || status === 403) {
        button.click(); http.expectNone(r => r.url === '/api/v1/attendance' || r.url.endsWith('/filter-context'));
      }
    });
  }
  it('keeps two independent Material minute dialog targets and all minutes', async () => {
    ready();
    for (const target of ['timeFrom', 'timeTo'] as const) {
      const other = target === 'timeFrom' ? 'timeTo' : 'timeFrom', old = page.form.controls[other].value;
      page.openTime(target); const dialog = TestBed.inject(MatDialog).openDialogs[0];
      expect(dialog.componentInstance.hours).toHaveLength(24); expect(dialog.componentInstance.minutes).toHaveLength(60);
      dialog.close('08:07'); await new Promise(r => setTimeout(r, 0)); render(); expect(page.form.controls[target].value).toBe('08:07');
      expect(page.form.controls[other].value).toBe(old);
    }
  });
});
describe('attendance atomic runtime guards', () => {
  it('accepts exact source no-attendance row, raw 0/negative/null; preserves duplicate codes', () => {
    for (const code of [null, '0', '-1', '123']) {
      const row = attendanceRowFixture(); row.attendance.missingReasonCode = code;
      row.planned.activities.push(row.planned.activities[0]); expect(attendanceRow(row)).toBe(true);
    }
  });
  it('rejects wrong G01/J01, same-code hierarchy, missing/unknown parent, duplicate and source mixing', () => {
    const ctx = attendanceContextFixture(); expect(attendanceContext(ctx)).toBe(true);
    const broken = structuredClone(ctx); broken.teamOptions[0].code = broken.mokedOptions[0].code;
    expect(attendanceContext(broken)).toBe(false);
    const list = attendanceListFixture(); list.items[0].employee.unit.moked.unitType = 'J01' as 'G01';
    expect(attendanceList(list, attendanceRequestFixture(), ctx)).toBe(false);
    list.items = [attendanceRowFixture()]; list.dataSource = 'oracle-read-only';
    expect(attendanceList(list, attendanceRequestFixture(), ctx)).toBe(false);
  });
  it('rejects one malformed row atomically, missing day, private fields, reverse planned endpoints and malformed actual', () => {
    const row = attendanceRowFixture();
    for (const bad of [{ ...row, shiftDayId: null }, { ...row, attendanceUserID: 'x' },
      { ...row, planned: { ...row.planned, endLocal: '2026-10-18T00:00:00' } },
      { ...row, attendance: { ...row.attendance, stationExitLocal: '2026-10-19T00:00:00Z' } }]) {
      expect(attendanceRow(bad)).toBe(false);
      expect(attendanceList({ ...attendanceListFixture(), items: [row, bad] }, attendanceRequestFixture(), attendanceContextFixture())).toBe(false);
    }
  });
  it('accepts only resource-specific problem codes and status pairs', () => {
    for (const [status, code] of [[400, 'INVALID_REQUEST'], [401, 'UNAUTHENTICATED'], [403, 'FORBIDDEN'],
      [500, 'AMBIGUOUS_ATTENDANCE'], [503, 'DEPENDENCY_TIMEOUT']] as const) {
      expect(attendanceProblem({ type: `urn:shf:problem:${code}`, title: 'Synthetic', code, status, requestId: 'test-01' }, status)).toBe(true);
    }
    expect(attendanceProblem({ type: 'urn:shf:problem:AMBIGUOUS_SHIFT_SEARCH', title: 'Synthetic',
      code: 'AMBIGUOUS_SHIFT_SEARCH', status: 500, requestId: 'test' }, 500)).toBe(false);
  });
});
