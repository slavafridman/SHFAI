import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { fixtureIdentity, fixtureRow } from './test-fixtures';
import { contextFixture, listFixture, listRowFixture } from './current-shifts-fixtures';
import { searchContextFixture, searchListFixture, searchRowFixture } from './shift-search-fixtures';
import { scheduleContextFixture, scheduleListFixture } from './my-shifts-fixtures';
import { CurrentShiftsPage } from './current-shifts-page';
import { ShiftSearchPage } from './shift-search-page';
import { MyShiftsPage } from './my-shifts-page';
import { ShiftDayPage } from './shift-day-page';
import { ListNavigation } from './list-navigation';
import { fixtureItems } from './shift-items-fixtures';

describe('ITEMS four actual effective-pair entry actions', () => {
  let http: HttpTestingController, harness: RouterTestingHarness;
  const event = () => new MouseEvent('click', { button: 0, cancelable: true });
  const p = () => { const v = fixtureIdentity(); v.principal.capabilities.push('shift-items:read');
    v.principal.resourceScope.orgUnitIds.push('TEST-V'); return v; };
  const identity = () => http.expectOne('/api/v1/identity').flush(p());
  const settle = async () => { await new Promise(r => setTimeout(r,0)); harness.detectChanges(); };
  async function expectItems(employeeId: string, day: string) {
    await harness.fixture.whenStable(); await settle(); identity();
    const target = `/employees/${employeeId}/shift-days/${day}/breaks-and-exceptions`;
    expect(TestBed.inject(Router).url).toBe(target);
    const req = http.expectOne(r => r.url === '/api/v1' + target);
    req.flush(fixtureItems(employeeId,day)); harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(3);
  }
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify({ ignoreCancelled:true }));
  it('current action uses the clicked row, not another selected/global employee', async () => {
    const page = await harness.navigateByUrl('/current-shifts',CurrentShiftsPage);
    identity(); http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture());
    const row = listRowFixture('2202'); row.employee.employeeId = '1002';
    http.expectOne(r => r.url === '/api/v1/current-shifts').flush(listFixture([row])); harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('#items-2202')?.getAttribute('href'))
      .toBe('/employees/1002/shift-days/2202/breaks-and-exceptions');
    page.openItems(row,event()); await expectItems('1002','2202');
    expect(TestBed.inject(ListNavigation).origin?.opener).toBe('items-2202');
  });
  it('reassigned search row retains its effective pair; detail remains a separate action', async () => {
    const page = await harness.navigateByUrl('/shift-search',ShiftSearchPage); identity();
    http.expectOne('/api/v1/shift-search/filter-context').flush(searchContextFixture());
    page.search(); const row = searchRowFixture('3303'); row.employee.employeeId = '1003';
    http.expectOne(r => r.url === '/api/v1/shift-search').flush(searchListFixture(undefined,[row]));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('#search-detail-3303')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('#search-items-3303')).not.toBeNull();
    page.openItems(row,event()); await expectItems('1003','3303');
    expect(TestBed.inject(ListNavigation).searchOrigin?.shiftDayId).toBe('3303');
  });
  it('schedule own row does not overwrite upstream search/discovery metadata', async () => {
    const nav = TestBed.inject(ListNavigation);
    nav.searchOrigin = { request: { attendanceDate:'2026-10-15', timeFrom:'10:00', timeTo:'10:00' },
      employeeId:'1001',shiftDayId:'3001',unit:{code:'TEST-U',label:'בדיקה',parentLabel:'בדיקה'},
      scroll:99,tableScroll:-12,opener:'search-schedule-3001' };
    nav.scheduleUpstream = 'shift-search'; const upstream = structuredClone(nav.searchOrigin);
    const page = await harness.navigateByUrl('/my-shifts/selected/1001',MyShiftsPage); identity();
    http.expectOne(r => r.url === '/api/v1/my-shifts/context').flush(scheduleContextFixture());
    const v = scheduleListFixture(); v.items[0].shiftDayId='4404';
    http.expectOne(r => r.url === '/api/v1/my-shifts').flush(v); harness.detectChanges();
    page.openItems(v.items[0],event()); await expectItems('1001','4404');
    expect(nav.searchOrigin).toEqual(upstream); expect(nav.scheduleUpstream).toBe('shift-search');
    expect(nav.scheduleDetail?.shiftDayId).toBe('4404'); expect(nav.schedule?.opener).toBe('schedule-items-4404');
  });
  it('detail action uses only a successful matched detail, keeps its independent upstream', async () => {
    const page = await harness.navigateByUrl('/employees/1005/shift-days/5505',ShiftDayPage); identity();
    http.expectOne('/api/v1/employees/1005/shift-days/5505').flush(fixtureRow('1005','5505'));
    harness.detectChanges(); expect(harness.routeNativeElement!.querySelector('#detail-items')).not.toBeNull();
    page.openItems(event()); await expectItems('1005','5505');
  });
  it('modifiers keep native safe deep links without capturing an unauthorized origin', async () => {
    const page = await harness.navigateByUrl('/current-shifts',CurrentShiftsPage); identity();
    http.expectOne('/api/v1/current-shifts/filter-context').flush(contextFixture());
    http.expectOne(r => r.url === '/api/v1/current-shifts').flush(listFixture()); harness.detectChanges();
    page.openItems(page.result()!.items[0],new MouseEvent('click',{ctrlKey:true}));
    expect(TestBed.inject(Router).url).toBe('/current-shifts'); expect(TestBed.inject(ListNavigation).origin).toBeNull();
  });
});
