import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Employees } from './employees';
import type { DemoEmployee } from './employees-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const capability = { ...marker, employees: { read: { enabled: true } } };
const sample: DemoEmployee = {
  id: '00000003', displayName: 'עובד הדגמה עם שם ארוך — Demo ABC',
  orgUnit: { id: 'synthetic-team-a', name: 'צוות הדגמה א׳' }, jobName: null,
};
function list(items: readonly DemoEmployee[] = [sample]) {
  return { ...marker, items, nextCursor: null, fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
}

describe('Scoped synthetic employee search/card', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employees], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(Employees);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/employees');
  }

  it('requires labelled capability, preserves string IDs and renders unknown job explicitly', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/employees');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('00000003');
    expect(element.textContent).toContain('Demo ABC');
    expect(element.textContent).toContain('תפקיד: לא ידוע');
  });

  it('rejects unlabelled or denied demo capabilities before reading employee data', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/employees');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('shows minimized card and treats HTML-like names as text, without write controls', async () => {
    const fixture = start();
    const item = { ...sample, displayName: '<img src="synthetic-invalid"> Demo ABC' };
    initialize().flush(list([item]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#employee-open-00000003')?.click();
    const request = http.expectOne('/api/v1/employees/00000003');
    expect(request.request.method).toBe('GET');
    request.flush({ ...marker, item, fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem' });
    await fixture.whenStable();
    expect(element.querySelector('.employee-card')?.textContent).toContain(item.displayName);
    expect(element.querySelector('.employee-card')?.textContent).toContain('00000003');
    expect(element.querySelector('img')).toBeNull();
    element.querySelector<HTMLButtonElement>('.employee-card button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.employee-card')).toBeNull();
    http.expectNone(request => request.method !== 'GET');
  });

  it('keeps search input on failure and distinguishes successful empty results', async () => {
    const fixture = start();
    initialize().flush(list([]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('לא נמצאו עובדים');
    const input = element.querySelector<HTMLInputElement>('#employee-search');
    if (!input) { throw new Error('Missing employee search input.'); }
    input.value = ' Demo ABC ';
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    const request = http.expectOne(request => request.url === '/api/v1/employees');
    expect(request.request.params.get('search')).toBe('Demo ABC');
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(input.value).toBe(' Demo ABC ');
    expect(element.textContent).toContain('לא ניתן לטעון');
    expect(element.textContent).not.toContain('לא נמצאו עובדים');
  });

  it('rejects out-of-demo-scope rows and mismatched cards instead of displaying them', async () => {
    const fixture = start();
    initialize().flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#employee-open-00000003')?.click();
    http.expectOne('/api/v1/employees/00000003').flush({
      ...marker, item: { ...sample, id: '00000004', orgUnit: { id: 'synthetic-team-b', name: 'hidden' } },
      fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem',
    });
    await fixture.whenStable();
    expect(element.querySelector('.employee-card')).toBeNull();
    expect(element.textContent).not.toContain('hidden');
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('cancels stale search/card requests and rejects search beyond 80 characters locally', async () => {
    const fixture = start();
    const older = initialize();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(older.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/employees').flush(list());
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('#employee-open-00000003')?.click();
    const card = http.expectOne('/api/v1/employees/00000003');
    const input = element.querySelector<HTMLInputElement>('#employee-search');
    if (!input) { throw new Error('Missing employee search input.'); }
    input.value = 'x'.repeat(81);
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(card.cancelled).toBe(true);
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/employees');
    expect(element.textContent).toContain('ניתן להזין עד 80 תווים');
  });
});
