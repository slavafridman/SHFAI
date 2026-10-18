import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { MyShiftsPage } from './my-shifts-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { scheduleContextFixture, scheduleListFixture } from './my-shifts-fixtures';
import { dateFromWire } from './civil-date-adapter';

type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; contexts: Call[] = []; lists: Call[] = [];
  identity() { return this.work(this.identities); }
  myShiftsContext() { return this.work(this.contexts); }
  myShifts() { return this.work(this.lists); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('schedule generation guards / intentionally ineffective abort', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup() {
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/my-shifts/selected/1001', MyShiftsPage);
    api.identities[0].next(fixtureIdentity()); api.contexts[0].next(scheduleContextFixture());
    harness.detectChanges();
    return { page, api, harness };
  }
  for (const late of ['success','error','forbidden'] as const) {
    it(`late range A ${late} cannot change B actor/data/state/message/focus/permission`, async () => {
      const { page, api, harness } = await setup();
      page.form.controls.dateFrom.setValue(dateFromWire('2026-10-16')); page.apply();
      const result = scheduleListFixture(); result.applied.dateFrom = '2026-10-16'; result.items = [];
      api.lists[1].next(result); harness.detectChanges(); await new Promise(r => setTimeout(r,0));
      const snapshot = [page.result(),page.context(),page.state(),page.message(),document.activeElement,page.canRead()];
      if (late === 'success') api.lists[0].next(scheduleListFixture());
      else api.lists[0].error(late === 'error' ? new Error('late') : new HttpErrorResponse({ status: 403,
        error: { status: 403, code: 'FORBIDDEN', type: 'urn:shf:problem:FORBIDDEN', title: 'Synthetic', requestId: 'late' } }));
      harness.detectChanges(); await new Promise(r => setTimeout(r,0));
      expect(api.lists[0].cancelled).toBe(true);
      expect([page.result(),page.context(),page.state(),page.message(),document.activeElement,page.canRead()]).toEqual(snapshot);
    });
  }
  it('late context A after route B cannot replace actor caption or defaults', async () => {
    const { page, api, harness } = await setup();
    await harness.navigateByUrl('/my-shifts/selected/1002', MyShiftsPage);
    const ctx = scheduleContextFixture(); ctx.actor.employee!.employeeId = '1002';
    api.contexts[1].next(ctx);
    const snapshot = [page.context(),page.state(),page.form.getRawValue(),api.lists.length];
    api.contexts[0].next(scheduleContextFixture());
    expect([page.context(),page.state(),page.form.getRawValue(),api.lists.length]).toEqual(snapshot);
  });
  it('identity recheck and destroy invalidate old context/list/identity callbacks', async () => {
    const { page, api, harness } = await setup();
    page.recheckIdentity(); api.identities[0].next(fixtureIdentity());
    api.contexts[0].next(scheduleContextFixture()); api.lists[0].next(scheduleListFixture());
    expect(page.principal()).toBeNull(); expect(page.context()).toBeNull(); expect(page.result()).toBeNull();
    api.identities[1].next(fixtureIdentity()); api.contexts[1].next(scheduleContextFixture());
    api.lists[1].next(scheduleListFixture()); expect(page.state()).toBe('success');
    harness.fixture.destroy(); api.lists[1].next(scheduleListFixture()); api.identities[1].error(new Error('late'));
    expect(page.result()).toBeNull();
  });
});
