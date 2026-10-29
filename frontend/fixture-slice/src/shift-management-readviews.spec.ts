import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { managementIdentityFixture, managementContextFixture } from './shift-management-fixtures';
import { contextFixture, listFixture } from './current-shifts-fixtures';
import { searchContextFixture, searchListFixture } from './shift-search-fixtures';
import { scheduleContextFixture, scheduleListFixture } from './my-shifts-fixtures';
import { attendanceContextFixture, attendanceListFixture } from './attendance-fixtures';
import { CurrentShiftsPage } from './current-shifts-page';
import { ShiftSearchPage } from './shift-search-page';
import { MyShiftsPage } from './my-shifts-page';
import { AttendancePage } from './attendance-page';
import { ListNavigation } from './list-navigation';
import { arrivalIdentity } from './stage-arrival-contract';
import { stationIdentity } from './station-arrival-contract';
import { exitIdentity } from './station-exit-contract';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
describe('M3 selected employee navigation and old native command separation', () => {
  let http: HttpTestingController, h: RouterTestingHarness;
  const identity = () => {
    const p = managementIdentityFixture(); p.principal.resourceScope.orgUnitIds = ['TEST-U', 'TEST-V'];
    http.expectOne('/api/v1/identity').flush(p);
  };
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); history.replaceState({}, ''); sessionStorage.clear(); });
  async function destination(employeeId: string, dayId: string) {
    await h.fixture.whenStable(); identity();
    expect(TestBed.inject(Router).url).toBe(`/employees/${employeeId}/shift-days/${dayId}/manage`);
    const c = managementContextFixture(true);
    c.employeeId = employeeId; c.employee.orgUnitId = 'TEST-U'; c.selected!.shiftDayId = dayId;
    http.expectOne(`/api/v1/employees/${employeeId}/shift-management/shift-days/${dayId}/context`).flush(c, wire);
    h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('ניהול משמרות');
  }
  it('current row preserves exact submitted filters and uses clicked effective employee/day', async () => {
    const p = await h.navigateByUrl('/current-shifts', CurrentShiftsPage); identity();
    http.expectOne('/api/v1/current-shifts/filter-context').flush({ ...contextFixture(), dataSource: 'oracle-read-only' });
    const data = listFixture(); data.dataSource = 'oracle-read-only';
    data.items[0].employee.employeeId = '1002';
    http.expectOne(r => r.url === '/api/v1/current-shifts').flush(data); h.detectChanges();
    p.openDetail(data.items[0], new MouseEvent('click', { cancelable: true }), false, false, true);
    await destination('1002', data.items[0].shiftDayId);
    const origin = TestBed.inject(ListNavigation).origin!;
    expect(origin.request.offset).toBe(data.page.offset); expect(origin.request.attendanceDate).toBe(data.applied.attendanceDate);
    expect(origin.request.currentTime).toBe(data.applied.currentTime);
    expect(origin.opener).toBe('management-' + data.items[0].shiftDayId);
    expect(origin.employeeId).toBe('1002');
  });
  it('search row preserves its submitted date/time/page/sort rather than rewriting the query', async () => {
    const p = await h.navigateByUrl('/shift-search', ShiftSearchPage); identity();
    http.expectOne('/api/v1/shift-search/filter-context').flush({ ...searchContextFixture(), dataSource: 'oracle-read-only' });
    p.search(); const data = { ...searchListFixture(), dataSource: 'oracle-read-only' };
    http.expectOne(r => r.url === '/api/v1/shift-search').flush(data); h.detectChanges();
    p.openDetail(data.items[0], new MouseEvent('click', { cancelable: true }), false, false, true);
    await destination(data.items[0].employee.employeeId, data.items[0].shiftDayId);
    expect(TestBed.inject(ListNavigation).searchOrigin!.opener).toBe('search-management-' + data.items[0].shiftDayId);
  });
  it('selected schedule enables create and selected-day management without actor self-link', async () => {
    const p = await h.navigateByUrl('/my-shifts/selected/1001', MyShiftsPage); identity();
    http.expectOne(r => r.url === '/api/v1/my-shifts/context').flush({ ...scheduleContextFixture(), dataSource: 'oracle-read-only' });
    const data = { ...scheduleListFixture(), dataSource: 'oracle-read-only' };
    http.expectOne(r => r.url === '/api/v1/my-shifts').flush(data); h.detectChanges();
    expect(h.routeNativeElement!.querySelector('#schedule-management-create')?.getAttribute('href')).toBe('/employees/1001/shift-management');
    p.openDetail(data.items[0], new MouseEvent('click', { cancelable: true }), false, true);
    await destination('1001', data.items[0].shiftDayId);
    expect(TestBed.inject(ListNavigation).schedule!.opener).toBe('schedule-management-' + data.items[0].shiftDayId);
  });
  it('attendance new-management actor has management entry but no F1/F2/exit command entry', async () => {
    const p = await h.navigateByUrl('/attendance', AttendancePage); identity();
    http.expectOne('/api/v1/attendance/filter-context').flush({ ...attendanceContextFixture(), dataSource: 'oracle-read-only' });
    p.apply(); const data = { ...attendanceListFixture(), dataSource: 'oracle-read-only' };
    http.expectOne(r => r.url === '/api/v1/attendance').flush(data); h.detectChanges();
    const row = data.items[0];
    expect(h.routeNativeElement!.querySelector('[id^="attendance-management-"]')).not.toBeNull();
    expect(h.routeNativeElement!.querySelector('[id^="attendance-arrival-"]')).toBeNull();
    expect(h.routeNativeElement!.querySelector('[id^="attendance-station-"]')).toBeNull();
    expect(h.routeNativeElement!.querySelector('[id^="attendance-exit-"]')).toBeNull();
    p.open(row, new MouseEvent('click', { cancelable: true }), 'management');
    await destination(row.employee.employeeId, row.shiftDayId!);
    expect(TestBed.inject(ListNavigation).attendanceOrigin!.opener).toBe('attendance-management-' + row.shiftDayId);
  });
  it('management14 is not a native attendance identity or automatic write authorization', () => {
    const p = managementIdentityFixture();
    expect(arrivalIdentity(p)).toBe(false); expect(stationIdentity(p)).toBe(false); expect(exitIdentity(p)).toBe(false);
  });
});
