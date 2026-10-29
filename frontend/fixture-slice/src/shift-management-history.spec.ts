import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { ShiftManagementPage } from './shift-management-page';
import { ViewHistory } from './view-history';
import { managementContextFixture, managementIdentityFixture } from './shift-management-fixtures';
const wire = { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } };
describe('M3 volatile history, never prepared authority or raw input', () => {
  let http: HttpTestingController, h: RouterTestingHarness;
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it('new route/history entry never restores form, token, file or result and never auto-submits', async () => {
    const page = await h.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush(managementIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-management/context').flush(managementContextFixture(), wire);
    page.form.controls.remark.setValue('ephemeral-entered-value');
    await h.navigateByUrl('/employees/9001/shift-days/6201/manage', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush(managementIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-management/shift-days/6201/context').flush(managementContextFixture(true), wire);
    const current = h.routeDebugElement!.componentInstance as ShiftManagementPage;
    expect(current.form.controls.remark.value).toBe('');
    expect(current.preview()).toBeNull(); expect(current.prepared()).toBeNull(); expect(current.receipt()).toBeNull();
    expect(current.filename()).toBe('');
    expect(JSON.stringify(history.state)).not.toContain('ephemeral-entered-value');
    expect(JSON.stringify(history.state)).not.toContain('9001');
    expect(sessionStorage.length).toBe(0);
    http.expectNone(r => r.method === 'POST');
  });
  it('restoration without a known popped entry is inert; browser geometry is checked separately', async () => {
    await h.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush(managementIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-management/context').flush(managementContextFixture(), wire);
    const journey = TestBed.inject(ViewHistory);
    // Exercise the same public restoration API with no false claim of browser layout.
    const host = document.createElement('section');
    host.innerHTML = '<h1 tabindex="-1">כותרת בטוחה</h1><h2 id="safe-results" tabindex="-1">תוצאות</h2><div class="table-wrap"></div>';
    document.body.append(host);
    expect(journey.restore(host, { selector: '#safe-results', onMissing: () => {} })).toBe(false);
    host.remove();
    // Actual Back/Forward, geometry and vanished-opener path are covered in owned Chrome check.
  });
  it('pending navigation warns that a dispatched command cannot be cancelled by leaving', async () => {
    const page = await h.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    http.expectOne('/api/v1/identity').flush(managementIdentityFixture());
    http.expectOne('/api/v1/employees/9001/shift-management/context').flush(managementContextFixture(), wire);
    page.state.set('submitting'); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(page.canLeave()).toBe(false); expect(page.state()).toBe('submitting');
    confirm.mockReturnValue(true); expect(page.canLeave()).toBe(true); expect(page.state()).toBe('unknown');
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('ניווט אינו מבטל'));
  });
});
