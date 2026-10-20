import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { StageArrivalPage } from './stage-arrival-page';
import { SliceApi } from './api';
import { routes } from './routes';
import { StageArrivalSession } from './stage-arrival-session';
import { arrivalContextFixture, arrivalSelectionFixture, arrivalIdentityFixture, arrivalValidationFixture } from './stage-arrival-fixtures';
type Call = { next: (v: unknown) => void; error: (e: unknown) => void; cancelled: boolean };
class UncooperativeApi {
  identities: Call[] = []; contexts: Call[] = []; validations: Call[] = []; commands: Call[] = [];
  identity() { return this.work(this.identities); }
  stageArrivalContext() { return this.work(this.contexts); }
  stageArrivalValidate() { return this.work(this.validations); }
  stageArrivalCommand() { return this.work(this.commands); }
  private work(queue: Call[]): Observable<unknown> {
    return { subscribe(observer: Call) {
      const call = { ...observer, cancelled: false }; queue.push(call);
      return { unsubscribe() { call.cancelled = true; } };
    } } as unknown as Observable<unknown>;
  }
}
describe('F1 generations / intentionally ineffective cancellation', () => {
  afterEach(() => { TestBed.resetTestingModule(); history.replaceState({}, ''); });
  async function setup() {
    history.replaceState({}, '');
    const api = new UncooperativeApi();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SliceApi, useValue: api }] });
    TestBed.inject(StageArrivalSession).selection = arrivalSelectionFixture();
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/employees/9001/shift-days/6201/stage-arrival', StageArrivalPage);
    api.identities[0].next(arrivalIdentityFixture()); api.contexts[0].next(arrivalContextFixture());
    return { api, harness, page };
  }
  for (const late of ['success', 'error', 'forbidden'] as const) {
    it(`late A ${late} cannot replace B review, identity, announcement or focus`, async () => {
      const { api, harness, page } = await setup();
      page.validate(); page.reason.setValue('1'); page.reason.setValue(null); page.validate();
      api.validations[1].next(arrivalValidationFixture()); harness.detectChanges();
      const state = [page.validation(), page.context(), page.state(), page.message(), page.principal(), document.activeElement];
      if (late === 'success') api.validations[0].next(arrivalValidationFixture(true));
      else api.validations[0].error(late === 'error' ? Error('synthetic') : new HttpErrorResponse({ status: 403 }));
      harness.detectChanges();
      expect(api.validations[0].cancelled).toBe(true);
      expect([page.validation(), page.context(), page.state(), page.message(), page.principal(), document.activeElement]).toEqual(state);
      expect(api.commands).toHaveLength(0);
    });
  }
  it('wrong-context validation does not become review; old identity/context callbacks cannot replace refreshed scope', async () => {
    const { api, page } = await setup();
    page.validate(); api.validations[0].next({ ...arrivalValidationFixture(), employeeId: '9002' });
    expect(page.validation()).toBeNull(); expect(page.state()).toBe('error');
    page.recheck(); api.identities[0].next(arrivalIdentityFixture()); api.contexts[0].next(arrivalContextFixture());
    expect(page.principal()).toBeNull(); expect(page.context()).toBeNull();
    api.identities[1].next(arrivalIdentityFixture()); api.contexts[1].next(arrivalContextFixture());
    expect(page.state()).toBe('ready'); expect(api.commands).toHaveLength(0);
  });
  it('late receipt after pending departure/recheck never replaces RECOVERY REQUIRED', async () => {
    const { api, page, harness } = await setup();
    page.validate(); api.validations[0].next(arrivalValidationFixture()); page.confirm();
    page.recheck(); api.identities[1].next(arrivalIdentityFixture());
    const before = [page.state(), page.message(), page.receipt()];
    api.commands[0].next({ outcome: 'fixture-committed' }); api.commands[0].error(new Error('late'));
    harness.detectChanges();
    expect(api.commands[0].cancelled).toBe(true); expect(page.state()).toBe('recovery');
    expect([page.state(), page.message(), page.receipt()]).toEqual(before);
    expect(api.commands).toHaveLength(1); expect(api.contexts).toHaveLength(1);
  });
  it('a late success callback after UNKNOWN is ignored even when cancellation does nothing', async () => {
    const { api, page } = await setup();
    page.validate(); api.validations[0].next(arrivalValidationFixture()); page.confirm();
    api.commands[0].error(new Error('synthetic lost response'));
    const prior = [page.state(), page.message(), page.receipt()];
    api.commands[0].next({ outcome: 'fixture-committed' });
    expect([page.state(), page.message(), page.receipt()]).toEqual(prior);
    expect(page.state()).toBe('unknown'); expect(history.state.shfF1Safety).toHaveLength(1);
    expect(api.commands).toHaveLength(1);
  });
});
