import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { EmployeeCardPage } from './employee-card-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { fixtureEmployeeCard } from './employee-card-fixtures';
type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; cards: Call[] = [];
  identity() { return this.work(this.identities); }
  employeeCard() { return this.work(this.cards); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('CARD generation + scope/source epoch / abort deliberately ineffective', () => {
  afterEach(() => TestBed.resetTestingModule());
  async function setup() {
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers:[provideRouter(routes),{provide:SliceApi,useValue:api}] });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/employees/1001/operational-card',EmployeeCardPage);
    api.identities[0].next(fixtureIdentity()); harness.detectChanges();
    return {api,harness,page};
  }
  it.each(['success','error','forbidden'] as const)('late A %s cannot alter B data/state/focus/capability', async kind => {
    const {api,harness,page} = await setup();
    await harness.navigateByUrl('/employees/1002/operational-card',EmployeeCardPage);
    api.cards[1].next(fixtureEmployeeCard('1002')); harness.detectChanges();
    await new Promise(r=>setTimeout(r,0));
    const snapshot = [page.result(),page.message(),page.state(),page.canRead(),document.activeElement];
    if (kind === 'success') api.cards[0].next(fixtureEmployeeCard());
    else api.cards[0].error(new HttpErrorResponse({status:kind === 'forbidden' ? 403 : 503}));
    harness.detectChanges(); await new Promise(r=>setTimeout(r,0));
    expect(api.cards[0].cancelled).toBe(true);
    expect([page.result(),page.message(),page.state(),page.canRead(),document.activeElement]).toEqual(snapshot);
  });
  it('identity revoke clears every field and old identity/card callbacks cannot revive it', async () => {
    const {api,harness,page} = await setup();
    api.cards[0].next(fixtureEmployeeCard()); expect(page.result()).not.toBeNull();
    page.recheckIdentity(); expect(page.result()).toBeNull(); expect(page.principal()).toBeNull();
    api.identities[1].error(new Error('synthetic failure'));
    api.identities[0].next(fixtureIdentity()); api.cards[0].next(fixtureEmployeeCard());
    expect(page.result()).toBeNull(); expect(page.principal()).toBeNull(); expect(page.identityState()).toBe('error');
    harness.fixture.destroy(); api.cards[0].error(new HttpErrorResponse({status:403}));
    expect(page.result()).toBeNull();
  });
  it('new scope epoch rejects formerly admitted team and never caches success', async () => {
    const {api,page} = await setup();
    api.cards[0].next(fixtureEmployeeCard()); page.recheckIdentity();
    const p = fixtureIdentity(); p.principal.resourceScope.orgUnitIds = ['OTHER'];
    api.identities[1].next(p); api.cards[1].next(fixtureEmployeeCard());
    expect(page.result()).toBeNull(); expect(page.state()).toBe('error');
    api.cards[0].next(fixtureEmployeeCard()); expect(page.result()).toBeNull();
  });
});
