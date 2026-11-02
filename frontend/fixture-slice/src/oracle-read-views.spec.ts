import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { routes } from './routes';
import { oracleReadCatalog, oracleReadIdentity } from './oracle-read-capacity-fixtures';
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
describe('55-scope-v0.2 all seven read routes — Angular mocked HTTP, not Oracle', () => {
  let http: HttpTestingController, h: RouterTestingHarness;
  beforeEach(async () => {
    history.replaceState({}, '');
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); history.replaceState({}, ''); });
  for (const route of ['search', 'attendance'] as const) for (const kind of ['partial', 'overflow'] as const)
    it(`${route}: ${kind} catalog clears results and keeps the form disabled`, async () => {
      await h.navigateByUrl(paths[route]);
      http.expectOne('/api/v1/identity').flush(oracleReadIdentity());
      const catalog = oracleReadCatalog(kind === 'overflow' ? 1001 : 1000);
      if (kind === 'partial') catalog.teamOptions.pop();
      const path = route === 'search' ? 'shift-search' : 'attendance';
      http.expectOne('/api/v1/' + path + '/filter-context').flush(catalog);
      h.detectChanges();
      const page = h.routeDebugElement!.componentInstance as ShiftSearchPage | AttendancePage;
      expect(page.context()).toBeNull(); expect(page.result()).toBeNull();
      expect(page.state()).toBe('error'); expect(page.form.disabled).toBe(true);
      http.expectNone(r => r.url === '/api/v1/' + path);
    });
  for (const index of [0, 999]) for (const name of Object.keys(paths) as (keyof typeof paths)[])
    it(`${name}: 1000 exact grants and selected team index ${index}`, async () => {
      await h.navigateByUrl(paths[name]);
      const p = oracleReadIdentity(), c = oracleReadCatalog(), t = c.teamOptions[index];
      const unit = { code: t.code, label: t.label, moked: c.mokedOptions[0] };
      http.expectOne('/api/v1/identity').flush(p);
      const read = (url: string, body: object) => {
        const r = http.expectOne(r => r.url === '/api/v1' + url);
        expect(r.request.method).toBe('GET'); expect(r.request.cache).toBe('no-store'); r.flush(body);
      };
      if (name === 'current') {
        const ctx = contextFixture(); ctx.dataSource = 'oracle-read-only';
        ctx.mokedOptions = c.mokedOptions; ctx.defaults.mokedCode = 'P0000';
        read('/current-shifts/filter-context', ctx);
        const list = listFixture(); list.dataSource = 'oracle-read-only';
        list.applied.mokedCode = 'P0000'; list.items[0].employee.unit = unit;
        read('/current-shifts', list);
      } else if (name === 'search' || name === 'attendance') {
        const page = h.routeDebugElement!.componentInstance as ShiftSearchPage | AttendancePage;
        const ctx = name === 'search' ? searchContextFixture() : attendanceContextFixture();
        c.defaults.attendanceDate = ctx.defaults.attendanceDate;
        Object.assign(ctx, c); read(`/${name === 'search' ? 'shift-search' : 'attendance'}/filter-context`, ctx);
        h.detectChanges();
        expect(page.teams()).toHaveLength(1000);
        // Existing Material overlay renders the complete provider, including escaped tail labels.
        const loader = TestbedHarnessEnvironment.loader(h.fixture);
        const select = await loader.getHarness(MatSelectHarness.with({ selector: '[formControlName="teamCodes"]' }));
        await select.open();
        expect(await select.getOptions()).toHaveLength(1000);
        await select.close();
        expect(document.querySelector('תג')).toBeNull();
        page.form.controls.teamCodes.setValue(c.teamOptions.slice(0, 101).map(x => x.code));
        if (page instanceof ShiftSearchPage) page.search(); else page.apply();
        http.expectNone(r => r.url === '/api/v1/' + (name === 'search' ? 'shift-search' : 'attendance'));
        expect(page.form.controls.teamCodes.value).toHaveLength(101);
        page.clearUnavailable();
        expect(page.form.controls.teamCodes.value).toEqual([]);
        page.form.controls.teamCodes.setValue([t.code]);
        if (page instanceof ShiftSearchPage) page.search(); else page.apply();
        const list = name === 'search' ? searchListFixture() : attendanceListFixture();
        list.dataSource = 'oracle-read-only'; list.applied.mokedCode = 'P0000';
        list.applied.teamCodes = [t.code]; list.items[0].employee.unit = unit;
        read('/' + (name === 'search' ? 'shift-search' : 'attendance'), list);
      } else if (name === 'schedule') {
        const ctx = scheduleContextFixture(); ctx.dataSource = 'oracle-read-only';
        ctx.actor.employee!.unit = unit; read('/my-shifts/context', ctx);
        const list = scheduleListFixture(); list.dataSource = 'oracle-read-only';
        list.actor = ctx.actor; list.items[0].employee.unit = unit; read('/my-shifts', list);
      } else if (name === 'detail') {
        const row = fixtureRow(); row.dataSource = 'oracle'; row.employee.orgUnitId = t.code;
        read(paths[name], row);
      } else if (name === 'items') {
        const body = fixtureItems(); body.shiftDay.dataSource = 'oracle';
        body.shiftDay.employee.orgUnitId = t.code; body.displayContext.unit = unit; read(paths[name], body);
      } else {
        const body = fixtureEmployeeCard(); body.dataSource = 'oracle-read-only';
        body.employee.unit = { ...unit, label: `צוות בדיקה ${index}` }; read(paths[name], body);
      }
      h.detectChanges();
      const page = h.routeDebugElement!.componentInstance as {
        row?: () => unknown; result?: () => unknown;
        principal: () => ReturnType<typeof oracleReadIdentity> | null;
      };
      expect(page.principal()?.principal.resourceScope.orgUnitIds).toEqual(p.principal.resourceScope.orgUnitIds);
      expect(page.row?.() ?? page.result?.()).toBeTruthy();
      http.expectNone(r => r.method !== 'GET');
    });
});
