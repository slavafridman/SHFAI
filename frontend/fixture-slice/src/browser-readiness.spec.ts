import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { formReadyExpression } from '../checks/browser-interactions';
import { routes } from './routes';
import { fixtureIdentity } from './test-fixtures';
import { attendanceContextFixture } from './attendance-fixtures';
import { searchContextFixture } from './shift-search-fixtures';

describe('browser runner effective readiness (no sleeps or app state mutation)', () => {
  // jsdom has no layout. Only visibility is supplied here; actual geometry and
  // native CDP input acceptance are verified by the stock Chrome runners.
  beforeEach(() => vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList));
  afterEach(() => { vi.restoreAllMocks(); document.querySelector('#readiness-fixture')?.remove(); });
  const evaluate = (expression: string) => (0, eval)(expression) as boolean;
  it('does not confuse an enabled input property with effective disabled fieldset ancestry', () => {
    const host = document.createElement('section'); host.id = 'readiness-fixture';
    host.innerHTML = '<form><fieldset disabled><input id="driver-input" value="server"><button id="driver-submit">Apply</button></fieldset></form>';
    document.body.append(host);
    const input = host.querySelector('input')!;
    expect(input.disabled).toBe(false); expect(input.matches(':disabled')).toBe(true);
    const expression = formReadyExpression('#readiness-fixture', 'driver-input', 'driver-submit', { 'driver-input': 'server' });
    expect(evaluate(expression)).toBe(false);
    host.querySelector('fieldset')!.disabled = false;
    expect(evaluate(expression)).toBe(true);
  });
  it('requires the completed expected server default, not merely mounted/nonempty DOM', () => {
    const host = document.createElement('section'); host.id = 'readiness-fixture';
    host.innerHTML = '<form><input id="driver-input" value=""><button id="driver-submit">Apply</button><mat-progress-bar></mat-progress-bar></form>';
    document.body.append(host);
    const expression = formReadyExpression('#readiness-fixture', 'driver-input', 'driver-submit', { 'driver-input': '19/10/2026' });
    expect(evaluate(expression)).toBe(false);
    host.querySelector('mat-progress-bar')!.remove();
    host.querySelector('input')!.value = 'stale';
    expect(evaluate(expression)).toBe(false);
    host.querySelector('input')!.value = '19/10/2026';
    expect(evaluate(expression)).toBe(true);
  });
  for (const route of ['attendance', 'shift-search'] as const) {
    it(`${route}: withholds driver readiness through delayed identity AND context, then preserves the original server defaults`, async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
      const http = TestBed.inject(HttpTestingController), harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/${route}`); harness.detectChanges();
      const prefix = route === 'attendance' ? 'attendance' : 'search';
      const expression = formReadyExpression(route === 'attendance' ? 'shf-attendance' : 'shf-shift-search',
        `${prefix}-date`, `${prefix}-submit`, { [`${prefix}-timeFrom`]: '10:00', [`${prefix}-timeTo`]: '10:00',
          [`${prefix}-date`]: route === 'attendance' ? '19/10/2026' : '15/10/2026' });
      expect(document.getElementById(`${prefix}-date`)).not.toBeNull();
      expect(evaluate(expression)).toBe(false);
      const principal = fixtureIdentity(); principal.principal.resourceScope.orgUnitIds.push('TEST-V');
      http.expectOne('/api/v1/identity').flush(principal); harness.detectChanges();
      const context = http.expectOne(`/api/v1/${route}/filter-context`);
      expect(evaluate(expression)).toBe(false);
      // No timer/retry advances a context; only the actual response may enable
      // entry. This is the production stock-driver predicate, not a test clone.
      context.flush(route === 'attendance' ? attendanceContextFixture() : searchContextFixture()); harness.detectChanges();
      expect(evaluate(expression)).toBe(true);
      http.expectNone(r => r.url === `/api/v1/${route}`); http.verify();
    });
  }
});
