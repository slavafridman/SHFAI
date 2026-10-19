import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { AttendancePage } from './attendance-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { attendanceContextFixture, attendanceListFixture, attendanceRequestFixture } from './attendance-fixtures';
const actor = () => { const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds.push('TEST-V'); return p; };
type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; contexts: Call[] = []; lists: Call[] = [];
  identity() { return this.work(this.identities); }
  attendanceContext() { return this.work(this.contexts); }
  attendance() { return this.work(this.lists); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('attendance generations / deliberately ineffective abort', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup() {
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/attendance', AttendancePage);
    api.identities[0].next(actor()); api.contexts[0].next(attendanceContextFixture());
    return { api, harness, page };
  }
  for (const late of ['success', 'error', 'forbidden'] as const) {
    it(`late A ${late} cannot replace B result, announcement, permission or focus`, async () => {
      const { api, harness, page } = await setup();
      page.apply(); page.form.controls.timeTo.setValue('23:59'); page.apply();
      api.lists[1].next(attendanceListFixture({ ...attendanceRequestFixture(), timeTo: '23:59' }));
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      const state = [page.result(), page.context(), page.state(), page.announcement(), document.activeElement, page.canRead()];
      if (late === 'success') api.lists[0].next(attendanceListFixture());
      else api.lists[0].error(late === 'error' ? new Error('synthetic') : new HttpErrorResponse({ status: 403,
        error: { status: 403, code: 'FORBIDDEN', type: 'urn:shf:problem:FORBIDDEN', title: 'Synthetic', requestId: 'late' } }));
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      expect(api.lists[0].cancelled).toBe(true);
      expect([page.result(), page.context(), page.state(), page.announcement(), document.activeElement, page.canRead()]).toEqual(state);
    });
  }
  it('recheck/destroy invalidate all old identity/context/list callbacks', async () => {
    const { api, harness, page } = await setup(); page.apply(); page.recheckIdentity();
    api.identities[0].next(actor()); api.contexts[0].next(attendanceContextFixture()); api.lists[0].next(attendanceListFixture());
    expect(page.principal()).toBeNull(); expect(page.context()).toBeNull(); expect(page.result()).toBeNull();
    api.identities[1].next(actor()); api.contexts[1].next(attendanceContextFixture()); page.apply();
    api.lists[1].next(attendanceListFixture()); expect(page.state()).toBe('success');
    harness.fixture.destroy(); api.lists[1].next(attendanceListFixture()); api.identities[1].error(new Error('late'));
    expect(page.result()).toBeNull();
  });
});
