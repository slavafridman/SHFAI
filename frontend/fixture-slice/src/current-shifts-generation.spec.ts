import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import type { Observable } from 'rxjs';
import { CurrentShiftsPage } from './current-shifts-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { contextFixture, listFixture } from './current-shifts-fixtures';

type Call = { next: (value: unknown) => void; error: (error: unknown) => void; cancelled: boolean };
class UncooperativeCurrentApi {
  identities: Call[] = [];
  contexts: Call[] = [];
  lists: Call[] = [];
  identity() { return this.work(this.identities); }
  filterContext() { return this.work(this.contexts); }
  currentShifts() { return this.work(this.lists); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('current list generation guards (intentionally uncooperative transport)', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup() {
    const api = new UncooperativeCurrentApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/current-shifts', CurrentShiftsPage);
    api.identities[0].next(fixtureIdentity()); api.contexts[0].next(contextFixture());
    return { page, api, harness };
  }
  for (const late of ['success', 'error']) {
    it(`late A ${late} cannot replace B data, live state or focus`, async () => {
      const { page, api, harness } = await setup();
      page.form.controls.time.setValue('11:00'); page.search();
      const b = listFixture(); b.applied.currentTime = '11:00'; api.lists[1].next(b);
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      const snapshot = [page.result(), page.state(), page.message(), page.announcement(), document.activeElement];
      if (late === 'success') api.lists[0].next(listFixture());
      else api.lists[0].error(new Error('late failure'));
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      expect(api.lists[0].cancelled).toBe(true);
      expect([page.result(), page.state(), page.message(), page.announcement(), document.activeElement]).toEqual(snapshot);
    });
  }
  it('identity recheck suppresses older identity/context/list, without Admin fallback', async () => {
    const { page, api, harness } = await setup();
    page.recheckIdentity();
    api.lists[0].next(listFixture()); api.contexts[0].next(contextFixture());
    api.identities[0].next(fixtureIdentity()); harness.detectChanges();
    expect(page.principal()).toBeNull(); expect(page.result()).toBeNull(); expect(page.context()).toBeNull();
    api.identities[1].next(fixtureIdentity()); api.contexts[1].next(contextFixture());
    api.lists[1].next(listFixture()); harness.detectChanges();
    expect(page.state()).toBe('success');
    harness.fixture.destroy(); api.lists[1].next(listFixture()); api.identities[1].error(new Error('late'));
    expect(page.result()).toBeNull();
  });
});
