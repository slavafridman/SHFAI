import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { EmployeeCardPage } from './employee-card-page';
import { fixtureIdentity } from './test-fixtures';
import { fixtureEmployeeCard } from './employee-card-fixtures';

describe('CARD real Angular component / synthetic HTTP', () => {
  let http: HttpTestingController, h: RouterTestingHarness, page: EmployeeCardPage;
  const path = '/employees/1001/operational-card', endpoint = '/api/v1' + path;
  const render = () => h.detectChanges();
  const dom = () => h.routeNativeElement!;
  const actor = () => { http.expectOne('/api/v1/identity').flush(fixtureIdentity()); render(); };
  const get = () => http.expectOne(endpoint);
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers:[provideRouter(routes),provideHttpClient(),provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
    page = await h.navigateByUrl(path, EmployeeCardPage); render();
  });
  afterEach(() => http.verify({ignoreCancelled:true}));
  it('waits for identity, then one direct GET, no query/body/cache/context', () => {
    http.expectNone(endpoint); actor(); const req = get();
    expect(req.request.method).toBe('GET'); expect(req.request.params.keys()).toEqual([]);
    expect(req.request.body).toBeNull(); expect(req.request.cache).toBe('no-store');
    req.flush(fixtureEmployeeCard()); render();
    expect(page.state()).toBe('success'); expect(dom().querySelectorAll('input,select,textarea,img')).toHaveLength(0);
    expect(dom().textContent).toContain('לא בוצע אימות סיסמה אמיתית');
    expect(dom().querySelectorAll('.fields > div')).toHaveLength(6);
    expect(dom().querySelector('#card-technical')?.hasAttribute('open')).toBe(false);
  });
  it('old five rights and Administrator role do not grant the independent right', () => {
    const p = fixtureIdentity(); p.principal.synthetic = false; p.principal.provider = 'real';
    p.principal.employeeId = '1001'; p.principal.capabilities.pop();
    http.expectOne('/api/v1/identity').flush(p); render(); http.expectNone(endpoint);
    expect(page.state()).toBe('error'); expect(page.canRead()).toBe(false);
  });
  it.each([null, '1002'])('real unlinked/other employee %s is denied without card request', employeeId => {
    const p = fixtureIdentity(); p.principal.synthetic = false; p.principal.provider = 'real'; p.principal.employeeId = employeeId;
    http.expectOne('/api/v1/identity').flush(p); render(); http.expectNone(endpoint); expect(page.canRead()).toBe(false);
  });
  it('rejects old synthetic five-capability identity, never falls back', () => {
    const p = fixtureIdentity(); p.principal.capabilities.pop();
    http.expectOne('/api/v1/identity').flush(p); render();
    expect(page.identityState()).toBe('error'); expect(page.principal()).toBeNull(); http.expectNone(endpoint);
  });
  it('unknown job and missing internal job have different truthful labels', () => {
    actor(); const v = fixtureEmployeeCard(); v.employee.job = {code:'-9',label:null}; v.employee.innerJob = null;
    get().flush(v); render(); const fields = dom().querySelectorAll('.fields dd');
    expect(fields[4].textContent).toContain('תיאור לא זמין'); expect(fields[4].textContent).toContain('-9');
    expect(fields[5].textContent?.trim()).toBe('לא צוין');
  });
  it('never retains private extras even in state/hidden DOM', () => {
    actor(); const v: any = fixtureEmployeeCard(); v.employee.extraPrivate = 'PRIVATE_SENTINEL';
    v.extraPrivate = 'PRIVATE_SENTINEL'; get().flush(v); render();
    expect(JSON.stringify(page.result())).not.toContain('PRIVATE_SENTINEL');
    expect(dom().innerHTML).not.toContain('PRIVATE_SENTINEL');
  });
  it.each([400,401,403,404,500,503])('terminal %s clears previous success, keeps stable focused reload', status => {
    actor(); get().flush(fixtureEmployeeCard()); render();
    const button = dom().querySelector<HTMLButtonElement>('#card-reload')!; button.focus(); button.click(); render();
    button.click(); button.click(); const req = get();
    expect(page.result()).toBeNull(); expect(dom().querySelector('#card-reload')).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false);
    req.flush({}, {status,statusText:'Synthetic'}); render();
    expect(page.result()).toBeNull(); expect(page.state()).toBe('error');
    expect(document.activeElement).toBe(button); expect(dom().querySelector('#card-reload')).toBe(button);
  });
  it('rechecks identity with card removed immediately, cancels old GET and rejects absent identity', () => {
    actor(); const pending = get(); page.recheckIdentity(); render(); expect(pending.cancelled).toBe(true);
    http.expectOne('/api/v1/identity').flush({principal:null}); render();
    expect(page.result()).toBeNull(); expect(page.principal()).toBeNull(); expect(page.identityState()).toBe('error');
  });
  it('route B cancels A and commits B only', async () => {
    actor(); const a = get();
    page = await h.navigateByUrl('/employees/1002/operational-card', EmployeeCardPage);
    expect(a.cancelled).toBe(true); expect(page.result()).toBeNull();
    http.expectOne('/api/v1/employees/1002/operational-card').flush(fixtureEmployeeCard('1002')); render();
    expect(page.result()?.employeeId).toBe('1002');
  });
  it.each(['/employees/01/operational-card','/employees/1001/operational-card?day=2','/employee-card'])(
    'invalid/cold route %s never requests arbitrary employee', async path => {
      http.expectOne('/api/v1/identity').flush({principal:null});
      await h.navigateByUrl('/current-shifts');
      http.expectOne('/api/v1/identity').flush({principal:null});
      page = await h.navigateByUrl(path, EmployeeCardPage); render(); actor(); http.expectNone(endpoint);
      expect(page.result()).toBeNull(); expect(TestBed.inject(Router).url).toBe(path);
    });
});
