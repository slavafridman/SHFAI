import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import type { Observable } from 'rxjs';
import { SliceApi } from './api';
import { routes } from './routes';
import { StationArrivalPage } from './station-arrival-page';
import { StationArrivalSession } from './station-arrival-session';
import { stationIdentityFixture, stationSelectionFixture, stationContextFixture, stationValidationFixture } from './station-arrival-fixtures';
type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; contexts: Call[] = []; validations: Call[] = []; commands: Call[] = [];
  identity() { return this.work(this.identities); }
  stationArrivalContext() { return this.work(this.contexts); }
  stationArrivalValidate() { return this.work(this.validations); }
  stationArrivalCommand() { return this.work(this.commands); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('F2 generation/cancellation guards with deliberately ineffective unsubscription', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  async function setup() {
    history.replaceState({}, ''); sessionStorage.clear();
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    TestBed.inject(StationArrivalSession).selection = stationSelectionFixture();
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/employees/9001/shift-days/6201/station-arrival', StationArrivalPage);
    api.identities[0].next(stationIdentityFixture()); api.contexts[0].next(stationContextFixture());
    return { api, page, harness };
  }
  it.each(['success', 'error'])('late validation %s cannot replace a newer preparation', async kind => {
    const { api, page } = await setup();
    page.validate(); page.reason.setValue('1'); page.reason.setValue(null); page.validate();
    api.validations[1].next(stationValidationFixture());
    const snapshot = [page.state(), page.validation(), page.message()];
    if (kind === 'success') api.validations[0].next(stationValidationFixture(true));
    else api.validations[0].error(Error('late transport'));
    expect([page.state(), page.validation(), page.message()]).toEqual(snapshot);
    expect(api.commands).toHaveLength(0);
  });
  it('expired monotonic preparation never sends a command', async () => {
    const { api, page } = await setup();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(100);
    page.validate(); api.validations[0].next(stationValidationFixture());
    clock.mockReturnValue(120101); page.confirm();
    expect(page.state()).toBe('expired'); expect(page.validation()).toBeNull(); expect(api.commands).toHaveLength(0);
  });
  it('pending departure/recheck keeps UNKNOWN safety; late success/error cannot clear it', async () => {
    const { api, page } = await setup();
    page.validate(); api.validations[0].next(stationValidationFixture()); page.confirm();
    expect(api.commands).toHaveLength(1);
    page.recheck(); api.identities[1].next(stationIdentityFixture());
    const snapshot = [page.state(), page.message(), page.receipt()];
    api.commands[0].next({ outcome: 'fixture-committed' }); api.commands[0].error(Error('late'));
    expect([page.state(), page.message(), page.receipt()]).toEqual(snapshot);
    expect(page.state()).toBe('recovery'); expect(TestBed.inject(StationArrivalSession).uncertain()).toBe(true);
  });
  it('session selection/actor change during command cannot yield success or false zero', async () => {
    const { api, page } = await setup();
    page.validate(); api.validations[0].next(stationValidationFixture()); page.confirm();
    TestBed.inject(StationArrivalSession).selection!.actor = 'changed';
    api.commands[0].next({ outcome: 'fixture-committed' });
    expect(page.state()).toBe('unknown'); expect(page.receipt()).toBeNull();
    expect(TestBed.inject(StationArrivalSession).uncertain()).toBe(true);
  });
});
