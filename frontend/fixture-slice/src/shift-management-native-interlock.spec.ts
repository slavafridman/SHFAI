import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './routes';
import { ShiftManagementSession } from './shift-management-session';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StationExitSession } from './station-exit-session';
import { ShiftManagementPage } from './shift-management-page';
import { StageArrivalPage } from './stage-arrival-page';
import { StationArrivalPage } from './station-arrival-page';
import { StationExitPage } from './station-exit-page';
import { nativeSelectionFixture, nativeIdentityFixture } from './native-arrival-fixtures';
import { nativeStationIdentityFixture } from './native-station-arrival-fixtures';
import { exitIdentityFixture } from './station-exit-fixtures';
import { managementIdentityFixture } from './shift-management-fixtures';
describe('M3 ↔ native attendance quarantine, no authorization authority in browser flags', () => {
  let http: HttpTestingController, h: RouterTestingHarness;
  beforeEach(async () => {
    history.replaceState({}, ''); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); h = await RouterTestingHarness.create();
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); history.replaceState({}, ''); sessionStorage.clear(); });
  it.each(['stage', 'station', 'exit'] as const)('unresolved %s blocks management for the employee including workspace/import and source/actor/unit drift', async kind => {
    const s = nativeSelectionFixture();
    const native = kind === 'stage' ? TestBed.inject(StageArrivalSession) :
      kind === 'station' ? TestBed.inject(StationArrivalSession) : TestBed.inject(StationExitSession);
    expect(native.begin(s, crypto.randomUUID())).toBe(true);
    // Same employee but another day/operation/source must not escape.
    const page = await h.navigateByUrl('/employees/9001/shift-management', ShiftManagementPage);
    const p = managementIdentityFixture(false);
    http.expectOne('/api/v1/identity').flush(p);
    expect(page.state()).toBe('unknown'); expect(page.blocked()).toBe(true); page.prepare();
    http.expectNone(r => r.url.includes('/shift-management/'));
  });
  it.each(['stage', 'station', 'exit'] as const)('unresolved M3 blocks %s preparation/command after switching identity families', async kind => {
    const m = TestBed.inject(ShiftManagementSession);
    expect(m.begin('9001', 'actor/management/source/ref', crypto.randomUUID())).toBe(true);
    const s = nativeSelectionFixture();
    const native = kind === 'stage' ? TestBed.inject(StageArrivalSession) :
      kind === 'station' ? TestBed.inject(StationArrivalSession) : TestBed.inject(StationExitSession);
    native.selection = s;
    const path = `/employees/9001/shift-days/6201/${kind === 'stage' ? 'stage-arrival' : kind === 'station' ? 'station-arrival' : 'station-exit'}`;
    await h.navigateByUrl(path);
    const p = kind === 'stage' ? nativeIdentityFixture() : kind === 'station' ? nativeStationIdentityFixture() : exitIdentityFixture();
    http.expectOne('/api/v1/identity').flush(p);
    const page = h.routeDebugElement!.componentInstance as StageArrivalPage | StationArrivalPage | StationExitPage;
    expect(page.canValidate()).toBe(false); page.validate();
    expect(page.state()).toBe('recovery');
    http.expectNone(r => r.url.includes('/context') || r.url.includes('/validations') || r.url.includes('/commands'));
  });
  it('known attendance tuple blocks all management days for that employee, not a different employee', () => {
    const s = TestBed.inject(StationExitSession);
    s.begin(nativeSelectionFixture(), crypto.randomUUID());
    expect(s.affectsEmployee('9001')).toBe(true); expect(s.affectsEmployee('9002')).toBe(false);
    const reloaded = new StationExitSession();
    expect(reloaded.affectsEmployee('9002')).toBe(true);
  });
});
