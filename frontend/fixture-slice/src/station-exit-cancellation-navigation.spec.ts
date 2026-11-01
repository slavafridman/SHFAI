import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NavigationStart } from '@angular/router';
import { firstValueFrom, filter, Subject } from 'rxjs';
import { ViewHistory } from './view-history';
import { routes } from './routes';
import { AttendancePage } from './attendance-page';
import { ShiftDayPage } from './shift-day-page';
import { StationExitCancellationSession } from './station-exit-cancellation-session';
import { cancellationWorld } from './station-exit-cancellation-fixtures';
import { attendanceContextFixture, attendanceListFixture, attendanceRowFixture } from './attendance-fixtures';
import { fixtureRow } from './test-fixtures';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
describe('U52 selected-resource navigation — mocked HTTP, existing history only', () => {
  let h: RouterTestingHarness, http: HttpTestingController;
  beforeEach(async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    sessionStorage.clear(); history.replaceState({}, '');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });

  afterEach(() => { http.verify({ ignoreCancelled: true }); vi.restoreAllMocks(); sessionStorage.clear(); history.replaceState({}, ''); });
  for (const native of [false, true]) {
    it(`attendance maps ${native ? 'oracle-read-only→oracle-test' : 'fixture→fixture'} without credential/employee fallback`, async () => {
      const w = cancellationWorld(native), page = await h.navigateByUrl('/attendance', AttendancePage);
      http.expectOne('/api/v1/identity').flush(w.identity);
      const c = attendanceContextFixture(); c.dataSource = native ? 'oracle-read-only' : 'isolated-fixture';
      http.expectOne('/api/v1/attendance/filter-context').flush(c);
      const row = attendanceRowFixture('2001', '1001');
      row.employee.unit.code = 'U01'; row.planned = { ...row.planned, startLocal: w.selection.startLocal, endLocal: w.selection.endLocal };
      const result = attendanceListFixture(undefined, [row]); result.dataSource = native ? 'oracle-read-only' : 'isolated-fixture';
      page.result.set(result); h.detectChanges();
      expect(page.canOpenCancellation(row)).toBe(true);
      expect(page.canOpenCancellation({ ...row, employee: { ...row.employee, unit: { ...row.employee.unit, code: 'OTHER' } } })).toBe(false);
      const done = firstValueFrom(TestBed.inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)));
      page.openCancellation(row, new MouseEvent('click'));
      await done;
      expect(TestBed.inject(StationExitCancellationSession).selection).toMatchObject({
        employeeId: '1001', shiftDayId: '2001', orgUnitId: 'U01', dataSource: w.selection.dataSource });
      expect(TestBed.inject(Router).url).toBe('/employees/1001/shift-days/2001/station-exit-cancellation');
      http.expectOne('/api/v1/identity').flush(w.identity);
      http.expectOne('/api/v1/employees/1001/shift-days/2001/station-exit-cancellation/context').flush(w.context, wire);
      http.expectNone(r => r.url.endsWith('/commands') || r.url.endsWith('/validations'));
      expect(JSON.stringify(history.state)).not.toMatch(/1001|2001|fingerprint|validationToken|receipt/);
    });
  }
  it('detail requires supplied resource facts and source, not editable cancellation fields', async () => {
    const w = cancellationWorld(), page = await h.navigateByUrl('/employees/1001/shift-days/2001', ShiftDayPage);
    http.expectOne('/api/v1/identity').flush(w.identity);
    http.expectOne('/api/v1/employees/1001/shift-days/2001').flush({ ...fixtureRow('1001', '2001'),
      employee: { firstName: 'Synthetic', lastName: 'Fixture', orgUnitId: 'U01' },
      effectiveShift: { ...fixtureRow().effectiveShift, startLocal: w.selection.startLocal, endLocal: w.selection.endLocal } });
    h.detectChanges(); expect(page.canOpenCancellation()).toBe(true);
    expect(h.routeNativeElement!.querySelector('#detail-cancellation')).not.toBeNull();
    page.row.set({ ...page.row()!, dataSource: 'oracle' }); expect(page.canOpenCancellation()).toBe(false);
    expect(TestBed.inject(StationExitCancellationSession).selection).toBeNull();
  });
});

describe('U52 direct-detail popped journey regression — synthetic router events, not browser geometry', () => {
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it('marks the detail ancestor for opener and scroll restoration without serializing business context', () => {
    const events = new Subject<NavigationStart | NavigationEnd>();
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes), { provide: Router, useValue: { events } },
    ] });
    const journey = TestBed.inject(ViewHistory);
    const host = document.createElement('section');
    host.innerHTML = '<h1 tabindex="-1">כותרת</h1><button id="detail-cancellation">ביטול רישום יציאה</button>';
    document.body.append(host);
    try {
      const detail = '/employees/9001/shift-days/6201', cancellation = detail + '/station-exit-cancellation';
      events.next(new NavigationStart(1, detail));
      events.next(new NavigationEnd(1, detail, detail));
      const token = history.state.shfView;
      journey.attach(host);
      const opener = host.querySelector<HTMLButtonElement>('#detail-cancellation')!;
      vi.spyOn(opener, 'getClientRects').mockReturnValue([new DOMRect()] as unknown as DOMRectList);
      const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      opener.focus();
      events.next(new NavigationStart(2, cancellation));
      events.next(new NavigationEnd(2, cancellation, cancellation));
      events.next(new NavigationStart(3, detail, 'popstate', { navigationId: 1, shfView: token }));
      events.next(new NavigationEnd(3, detail, detail));
      expect(journey.restore(host)).toBe(true);
      expect(document.activeElement).toBe(opener);
      expect(scroll).toHaveBeenCalled();
      expect(journey.restore(host)).toBe(false);
      expect(JSON.stringify(history.state)).not.toMatch(/9001|6201|fingerprint|validationToken|receipt/);
    } finally { host.remove(); }
  });
});
