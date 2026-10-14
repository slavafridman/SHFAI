import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Exceptions } from './exceptions';
import type { DemoExceptionRecord } from './exceptions-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T08:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capabilities = { ...marker, exceptions: { read: { enabled: true } }, employees: { read: { enabled: true } } };
const day: DemoExceptionRecord = {
  id: '94000001', unitId: 'synthetic-team-a', employeeId: '00000001', employeeName: 'עובד הדגמה',
  category: 'time-off', status: 'active', provenance: 'baseline',
  interval: { kind: 'full-day', date: '2026-10-15', startLocal: null, endLocal: null },
  originalInterval: null, originalAvailability: 'not-present', reason: null, remark: null, cancellationReason: null,
};
const changed: DemoExceptionRecord = {
  ...day, id: '94000002', category: 'exception', provenance: 'override',
  interval: { kind: 'timed', date: null, startLocal: '2026-10-16T23:00:00', endLocal: '2026-10-17T01:00:00' },
  originalInterval: { kind: 'timed', date: null, startLocal: '2026-10-16T22:00:00', endLocal: '2026-10-17T00:00:00' },
  originalAvailability: 'available', remark: '<strong>טקסט הדגמה</strong>',
};
function list(items: readonly unknown[] = [changed, day]) {
  return { ...marker, ...metadata, items, nextCursor: null };
}

describe('Read-only exception and time-off demo', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Exceptions], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(Exceptions);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/employees').flush({
      ...marker, ...metadata, items: [
        { id: '00000001', displayName: 'עובד הדגמה', orgUnit: { id: 'synthetic-team-a', name: 'צוות הדגמה' }, jobName: null },
        { id: '00000002', displayName: 'עובדת הדגמה', orgUnit: { id: 'synthetic-team-a', name: 'צוות הדגמה' }, jobName: null },
      ], nextCursor: null,
    });
    return http.expectOne(request => request.url === '/api/v1/exceptions');
  }
  function button(element: HTMLElement, name: string) {
    const found = [...element.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === name);
    if (!found) { throw new Error('Missing read-only exception action.'); }
    return found;
  }

  it('gates scoped reads and sends half-open dates while keeping full-day values date-only', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/exceptions');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('toExclusive')).toBe('2026-10-18');
    expect(request.request.params.get('includeCancelled')).toBe('false');
    request.flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
    expect(element.textContent).toContain('יום מלא');
    expect(element.textContent).toContain('2026-10-17T01:00:00');
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(2);
    expect(element.textContent).toContain('אינו חישוב 24 שעות UTC');
    http.expectNone(request => request.method !== 'GET');
  });

  it('renders changed original intervals, unknowns and remarks safely without mutation controls', async () => {
    const fixture = start(); initialize().flush(list()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#exception-94000002')?.click();
    http.expectOne('/api/v1/exceptions/94000002').flush({ ...marker, ...metadata, item: changed });
    await fixture.whenStable();
    expect(element.querySelector('.exception-detail')?.textContent).toContain('2026-10-16T22:00:00');
    expect(element.querySelector('.exception-detail')?.textContent).toContain('<strong>טקסט הדגמה</strong>');
    expect(element.querySelector('.exception-detail strong')).toBeNull();
    expect(element.querySelector('.exception-detail')?.textContent).toContain('סיבה: לא ידוע');
    button(element, 'סגירת פרטי רשומה').click();
    await fixture.whenStable();
    expect(element.querySelector('.exception-detail')).toBeNull();
  });

  it('includes cancelled history only by explicit filter and does not display it as active', async () => {
    const fixture = start(); initialize().flush(list([day])); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    button(element, 'הצגת חריגות והיעדרויות').click();
    const request = http.expectOne(request => request.url === '/api/v1/exceptions');
    expect(request.request.params.get('includeCancelled')).toBe('true');
    const cancelled = { ...day, id: '94000004', status: 'cancelled', cancellationReason: 'ביטול סינתטי' };
    request.flush(list([cancelled]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')?.textContent).toContain('מבוטל בדוגמה — היסטוריה בלבד');
    expect(element.querySelector('tbody')?.textContent).not.toContain('פעיל בדוגמה');
    element.querySelector<HTMLButtonElement>('#exception-94000004')?.click();
    http.expectOne('/api/v1/exceptions/94000004').flush({ ...marker, ...metadata, item: cancelled });
    await fixture.whenStable();
    expect(element.querySelector('.exception-detail')?.textContent).toContain('ביטול סינתטי');
  });

  it('keeps redacted planning hidden and rejects malformed full-day timestamps or leaked originals', async () => {
    const fixture = start();
    const hidden: DemoExceptionRecord = { ...changed, originalInterval: null, originalAvailability: 'not-authorized' };
    initialize().flush(list([hidden]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#exception-94000002')?.click();
    http.expectOne('/api/v1/exceptions/94000002').flush({ ...marker, ...metadata, item: hidden });
    await fixture.whenStable();
    expect(element.querySelector('.exception-detail')?.textContent).toContain('אין חשיפת בעלים קודם');
    button(element, 'הצגת חריגות והיעדרויות').click();
    http.expectOne(request => request.url === '/api/v1/exceptions').flush(list([{ ...day, interval: { ...day.interval, startLocal: '2026-10-15T00:00:00' } }]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    button(element, 'הצגת חריגות והיעדרויות').click();
    http.expectOne(request => request.url === '/api/v1/exceptions').flush(list([{ ...hidden, originalInterval: changed.originalInterval }]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('cancels old modes and enforces employee/category context for time-off responses', async () => {
    const fixture = start();
    const old = initialize();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    button(element, 'היעדרויות לעובד לדוגמה').click();
    expect(old.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/employees/00000001/time-off')
      .flush({ ...list([day]), employeeId: '00000002' });
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    button(element, 'הצגת חריגות והיעדרויות').click();
    http.expectOne(request => request.url === '/api/v1/employees/00000001/time-off')
      .flush({ ...list([changed]), employeeId: '00000001' });
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    button(element, 'הצגת חריגות והיעדרויות').click();
    http.expectOne(request => request.url === '/api/v1/employees/00000001/time-off')
      .flush({ ...list([]), employeeId: '00000001' });
    await fixture.whenStable();
    expect(element.textContent).toContain('אין רשומות הדגמה');
  });

  it('retains filters on failure, clears old detail on refresh and rejects invalid dates locally', async () => {
    const fixture = start(); initialize().flush(list()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#exception-94000002')?.click();
    const detail = http.expectOne('/api/v1/exceptions/94000002');
    button(element, 'הצגת חריגות והיעדרויות').click();
    expect(detail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/exceptions').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#exception-from')?.value).toBe('2026-10-14');
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('לא ניתן לטעון');
    const end = element.querySelector<HTMLInputElement>('#exception-to');
    if (!end) { throw new Error('Missing date filter.'); }
    end.value = '2026-02-30'; end.dispatchEvent(new Event('input'));
    button(element, 'הצגת חריגות והיעדרויות').click();
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/exceptions');
    expect(element.textContent).toContain('יש לבחור תאריכים תקינים');
  });

  it('rejects unmarked capabilities and out-of-range data rather than widening the chosen filters', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capabilities, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/employees');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    button(element, 'ניסיון נוסף לחריגות והיעדרויות').click();
    initialize().flush(list([{ ...day, interval: { kind: 'full-day', date: '2026-11-01', startLocal: null, endLocal: null } }]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
  });
});
