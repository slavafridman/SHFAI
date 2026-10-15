import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { SliceApi } from './api';
import { routes } from './routes';
import { ShiftDayPage } from './shift-day-page';
import { fixtureIdentity, fixtureProblem, fixtureRow } from './test-fixtures';
import type { Observable } from 'rxjs';

type Call = {
  next: (v: unknown) => void;
  error: (v: unknown) => void;
  cancelled: boolean;
};
// Deliberately violates cancellation, unlike RxJS/HttpClient: guards must still work.
class UncooperativeApi {
  identities: Call[] = [];
  details: Call[] = [];
  identity() { return this.work(this.identities); }
  detail() { return this.work(this.details); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false };
      queue.push(call);
      return { unsubscribe: () => { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('UI02-09 generation guards independent of HTTP cancellation', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup(path = '/shift-day') {
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(path, ShiftDayPage);
    return { api, harness, page };
  }
  for (const late of ['success', 'error'] as const) {
    it(`A late ${late} after B cannot change B data/status/live text/focus`, async () => {
      const { api, harness, page } = await setup();
      api.identities[0].next(fixtureIdentity());
      page.form.setValue({ employeeId: '1001', shiftDayId: '2001' }); page.submit();
      await harness.fixture.whenStable();
      page.form.setValue({ employeeId: '1002', shiftDayId: '2002' }); page.submit();
      const [a, b] = api.details;
      b.next(fixtureRow('1002', '2002'));
      harness.detectChanges();
      await new Promise(r => setTimeout(r, 0));
      const snapshot = [page.row(), page.state(), page.message(), page.announcement(), document.activeElement];
      if (late === 'success') a.next(fixtureRow());
      else a.error(new HttpErrorResponse({ status: 403, error: fixtureProblem(403, 'FORBIDDEN') }));
      harness.detectChanges();
      await new Promise(r => setTimeout(r, 0));
      expect(a.cancelled).toBe(true);
      expect([page.row(), page.state(), page.message(), page.announcement(), document.activeElement]).toEqual(snapshot);
    });
  }
  it('input change without submit suppresses late data and focus', async () => {
    const { api, harness, page } = await setup();
    api.identities[0].next(fixtureIdentity());
    page.form.setValue({ employeeId: '1001', shiftDayId: '2001' }); page.submit();
    page.form.controls.employeeId.setValue('1002');
    api.details[0].next(fixtureRow());
    harness.detectChanges();
    expect(page.row()).toBeNull();
    expect(page.state()).toBe('dirty');
  });
  it('identity invalidation rejects late detail and older identity success/error', async () => {
    const { api, page } = await setup();
    api.identities[0].next(fixtureIdentity());
    page.form.setValue({ employeeId: '1001', shiftDayId: '2001' }); page.submit();
    page.recheckIdentity();
    api.details[0].next(fixtureRow());
    api.identities[0].next(fixtureIdentity());
    expect(page.principal()).toBeNull();
    api.identities[1].next(fixtureIdentity());
    api.identities[0].error(new Error('late provider failure'));
    expect(page.identityState()).toBe('ready');
    expect(page.row()).toBeNull();
  });
  it('direct valid URL waits for identity and reads once, malformed URL never reads', async () => {
    const { api, page } = await setup('/employees/1001/shift-days/2001');
    expect(api.details).toHaveLength(0);
    api.identities[0].next(fixtureIdentity());
    expect(api.details).toHaveLength(1);
    api.details[0].next(fixtureRow());
    expect(page.row()?.shiftDayId).toBe('2001');
  });
  it('initial malformed deep link stays a local context error through identity loading', async () => {
    const { api, harness, page } = await setup('/employees/01/shift-days/2001');
    expect(page.invalidRoute()).toBe(true);
    expect(page.state()).toBe('error');
    api.identities[0].next(fixtureIdentity());
    harness.detectChanges();
    expect(page.state()).toBe('error');
    expect(api.details).toHaveLength(0);
    expect(harness.routeNativeElement?.querySelector('a[routerLink]')?.textContent).toContain('בחירת הקשר חדש');
  });
  it('route destruction suppresses late identity/detail callbacks', async () => {
    const { api, harness, page } = await setup();
    api.identities[0].next(fixtureIdentity());
    page.form.setValue({ employeeId: '1001', shiftDayId: '2001' }); page.submit();
    harness.fixture.destroy();
    api.details[0].next(fixtureRow());
    api.identities[0].error(new Error('late identity'));
    expect(page.row()).toBeNull();
    expect(api.details[0].cancelled).toBe(true);
  });
});
