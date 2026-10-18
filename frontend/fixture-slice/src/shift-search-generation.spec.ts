import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { ShiftSearchPage } from './shift-search-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { searchContextFixture, searchListFixture, searchRequestFixture } from './shift-search-fixtures';
const principal = () => {
  const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds.push('TEST-V'); return p;
};
type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; contexts: Call[] = []; lists: Call[] = [];
  identity() { return this.work(this.identities); }
  searchContext() { return this.work(this.contexts); }
  shiftSearch() { return this.work(this.lists); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('search generations with deliberately uncooperative transport', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup() {
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/shift-search', ShiftSearchPage);
    api.identities[0].next(principal()); api.contexts[0].next(searchContextFixture());
    return { page, api, harness };
  }
  for (const late of ['success', 'error', 'forbidden'] as const) {
    it(`late A ${late} cannot replace B data/state/announcement/focus`, async () => {
      const { page, api, harness } = await setup();
      page.search(); page.form.controls.timeTo.setValue('23:59'); page.search();
      api.lists[1].next(searchListFixture({ ...searchRequestFixture(), timeTo: '23:59' }));
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      const snapshot = [page.result(), page.context(), page.state(), page.announcement(), document.activeElement, page.canRead()];
      if (late === 'success') api.lists[0].next(searchListFixture());
      else api.lists[0].error(late === 'error' ? new Error('late') : new HttpErrorResponse({ status: 403,
        error: { status: 403, code: 'FORBIDDEN', type: 'urn:shf:problem:FORBIDDEN', title: 'Synthetic', requestId: 'late' } }));
      harness.detectChanges(); await new Promise(r => setTimeout(r, 0));
      expect(api.lists[0].cancelled).toBe(true);
      expect([page.result(), page.context(), page.state(), page.announcement(), document.activeElement, page.canRead()]).toEqual(snapshot);
    });
  }
  it('identity/context recheck and destroy invalidate all older callbacks', async () => {
    const { page, api, harness } = await setup(); page.search(); page.recheckIdentity();
    api.lists[0].next(searchListFixture()); api.contexts[0].next(searchContextFixture()); api.identities[0].next(principal());
    expect(page.principal()).toBeNull(); expect(page.context()).toBeNull(); expect(page.result()).toBeNull();
    api.identities[1].next(principal()); api.contexts[1].next(searchContextFixture()); page.search();
    api.lists[1].next(searchListFixture()); expect(page.state()).toBe('success');
    harness.fixture.destroy(); api.lists[1].next(searchListFixture()); api.identities[1].error(new Error('late'));
    expect(page.result()).toBeNull();
  });
});
