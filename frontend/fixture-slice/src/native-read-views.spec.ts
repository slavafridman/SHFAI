import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { nativeIdentityFixture } from './native-arrival-fixtures';
import { fixtureRow } from './test-fixtures';
import { contextFixture, listFixture } from './current-shifts-fixtures';
import { searchContextFixture, searchListFixture } from './shift-search-fixtures';
import { scheduleContextFixture, scheduleListFixture } from './my-shifts-fixtures';
import { attendanceContextFixture, attendanceListFixture } from './attendance-fixtures';
import { fixtureEmployeeCard } from './employee-card-fixtures';
import { fixtureItems } from './shift-items-fixtures';
import { ShiftSearchPage } from './shift-search-page';
import { AttendancePage } from './attendance-page';
const paths = {
  current: '/current-shifts', search: '/shift-search', schedule: '/my-shifts/selected/1001',
  detail: '/employees/1001/shift-days/2001', items: '/employees/1001/shift-days/2001/breaks-and-exceptions',
  card: '/employees/1001/operational-card', attendance: '/attendance',
};
describe('Exact native10 identity preserves ALL seven existing read views and source guards', () => {
  let http: HttpTestingController, h: RouterTestingHarness;
  beforeEach(async () => {
    history.replaceState({}, '');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); history.replaceState({}, ''); });
  for (const name of Object.keys(paths) as (keyof typeof paths)[]) for (const coherent of [true, false]) {
    it(`${name}: ${coherent ? 'Oracle read DTO works' : 'fixture read DTO is refused without fallback'} under native identity`, async () => {
      await h.navigateByUrl(paths[name]);
      const p = nativeIdentityFixture(); p.principal.resourceScope.orgUnitIds = ['TEST-U', 'TEST-V'];
      http.expectOne('/api/v1/identity').flush(p);
      const source = coherent ? 'oracle-read-only' as const : 'isolated-fixture' as const;
      const read = (url: string, body: object) => {
        const req = http.expectOne(r => r.url === '/api/v1' + url);
        expect(req.request.method).toBe('GET'); expect(req.request.cache).toBe('no-store'); req.flush(body);
      };
      if (name === 'current') {
        read('/current-shifts/filter-context', { ...contextFixture(), dataSource: 'oracle-read-only' });
        read('/current-shifts', { ...listFixture(), dataSource: source });
      } else if (name === 'search') {
        read('/shift-search/filter-context', { ...searchContextFixture(), dataSource: 'oracle-read-only' });
        (h.routeDebugElement!.componentInstance as ShiftSearchPage).search();
        read('/shift-search', { ...searchListFixture(), dataSource: source });
      } else if (name === 'schedule') {
        read('/my-shifts/context', { ...scheduleContextFixture(), dataSource: 'oracle-read-only' });
        read('/my-shifts', { ...scheduleListFixture(), dataSource: source });
      } else if (name === 'attendance') {
        read('/attendance/filter-context', { ...attendanceContextFixture(), dataSource: 'oracle-read-only' });
        (h.routeDebugElement!.componentInstance as AttendancePage).apply();
        read('/attendance', { ...attendanceListFixture(), dataSource: source });
      } else if (name === 'detail') {
        read(paths[name], { ...fixtureRow(), dataSource: coherent ? 'oracle' : 'isolated-fixture' });
      } else if (name === 'items') {
        const body = fixtureItems(); body.shiftDay.dataSource = coherent ? 'oracle' : 'isolated-fixture';
        read(paths[name], body);
      } else read(paths[name], { ...fixtureEmployeeCard(), dataSource: source });
      h.detectChanges();
      const page = h.routeDebugElement!.componentInstance as { row?: () => unknown; result?: () => unknown };
      expect(!!(page.row?.() ?? page.result?.())).toBe(coherent);
      expect(h.routeNativeElement!.textContent).toContain('Controlled TEST Oracle write');
      http.expectNone(r => r.url.includes('/stage-arrival/'));
    });
  }
});
