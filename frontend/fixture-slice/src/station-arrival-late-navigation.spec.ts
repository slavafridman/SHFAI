import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { ShiftDayPage } from './shift-day-page';
import { ListNavigation } from './list-navigation';
import { StationArrivalSession } from './station-arrival-session';
import { lateIdentityFixture, lateContextFixture } from './station-arrival-late-fixtures';
import { fixtureRow } from './test-fixtures';
describe('approved50 dedicated late selected-day journey — mocked HTTP', () => {
  let h: RouterTestingHarness, http: HttpTestingController;
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); history.replaceState({}, ''); sessionStorage.clear(); });
  async function start(bound: boolean) {
    const nav = TestBed.inject(ListNavigation);
    if (bound) {
      nav.detailOrigin = 'my-shifts';
      nav.scheduleDetail = { employeeId: '9001', shiftDayId: '6201', dataSource: 'oracle',
        unit: { code: '0021', label: 'צוות סינתטי', parentLabel: 'מוקד סינתטי' } };
    }
    const page = await h.navigateByUrl('/employees/9001/shift-days/6201', ShiftDayPage);
    http.expectOne('/api/v1/identity').flush(lateIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-days/6201').flush({
      ...fixtureRow('9001', '6201'), dataSource: 'oracle',
      employee: { firstName: 'עובד', lastName: 'סינתטי', orgUnitId: '0021' },
      effectiveShift: { ...fixtureRow().effectiveShift,
        startLocal: lateContextFixture().planned.startLocal, endLocal: lateContextFixture().planned.endLocal },
    }); h.detectChanges(); return page;
  }
  it('does not offer an arbitrary/direct/diagnostic employee picker as late authority', async () => {
    const page = await start(false); expect(page.canOpenLate()).toBe(false);
    expect(h.routeNativeElement!.querySelector('#detail-station-late')).toBeNull();
    expect(TestBed.inject(StationArrivalSession).selection).toBeNull();
    http.expectNone(r => r.url.includes('/station-arrival-late/'));
  });
  it('bound selected day opens exact dedicated route and volatile tuple only, no carried consent', async () => {
    const page = await start(true); expect(page.canOpenLate()).toBe(true);
    const done = firstValueFrom(TestBed.inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)));
    page.openLate(new MouseEvent('click', { button: 0 }));
    await done;
    expect(TestBed.inject(Router).url).toBe('/employees/9001/shift-days/6201/station-arrival-late');
    expect(TestBed.inject(StationArrivalSession).selection).toMatchObject({
      employeeId: '9001', shiftDayId: '6201', orgUnitId: '0021', dataSource: 'oracle-test',
    });
    http.expectOne('/api/v1/identity').flush(lateIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-days/6201/station-arrival-late/context').flush(lateContextFixture(), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
    http.expectNone(r => r.url.endsWith('/validations') || r.url.endsWith('/commands'));
    expect(JSON.stringify(history.state)).not.toMatch(/9001|6201|token|fingerprint|reason|receipt/);
  });
});
