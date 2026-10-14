import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Staffing } from './staffing';
import type { DemoStaffingRequest } from './staffing-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { clockLocal: '2026-10-13T08:00:00', fetchedAt: '2026-10-14T07:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capabilities = { ...marker, staffing: { read: { enabled: true } } };
const sample: DemoStaffingRequest = {
  id: '93000002', kind: 'time-change', unitId: 'synthetic-team-a', title: 'בקשת הדגמה',
  startLocal: '2026-10-17T08:00:00', endLocal: '2026-10-17T16:00:00',
  requested: 2, approved: 2, remaining: 0, deadlineLocal: '2026-10-13T07:00:00',
  deadlineState: 'elapsed', freshness: 'stale', note: null,
};
function list(items: readonly unknown[] = [sample]) {
  return { ...marker, ...metadata, items, nextCursor: null };
}

describe('Read-only staffing request and candidate demo', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Staffing], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(Staffing);
    fixture.detectChanges();
    return fixture;
  }
  function initialize(items: readonly unknown[] = [sample]) {
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/staffing-requests').flush(list(items));
  }
  async function openDetail(fixture: ReturnType<typeof start>, item = sample) {
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#staffing-${item.id}`)?.click();
    http.expectOne(`/api/v1/staffing-requests/${item.id}`).flush({ ...marker, ...metadata, item });
    await fixture.whenStable();
    return element;
  }
  function loadCandidates(element: HTMLElement) {
    const button = [...element.querySelectorAll<HTMLButtonElement>('.staffing-detail button')]
      .find(item => item.textContent?.trim() === 'הצגת מועמדי הבקשה לדוגמה');
    if (!button) { throw new Error('Missing read-only candidate action.'); }
    button.click();
    return http.expectOne(request => request.url === `/api/v1/staffing-requests/${sample.id}/candidates`);
  }

  it('gates reads and displays full capacity zero, expired deadline and stale request without registration', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/staffing-requests');
    initialize();
    await fixture.whenStable();
    const element = await openDetail(fixture);
    expect(element.querySelector('tbody tr')?.querySelectorAll('td')[4]?.textContent).toBe('0');
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('קיבולת מלאה');
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('המועד חלף');
    expect(element.textContent).toContain('נתון ישן');
    http.expectNone(request => request.method !== 'GET');
  });

  it('keeps unknown capacity distinct and renders HTML-like request notes as text', async () => {
    const unknown: DemoStaffingRequest = {
      ...sample, requested: null, approved: null, remaining: null,
      deadlineLocal: null, deadlineState: 'unknown', freshness: 'unknown', note: '<strong>טקסט הדגמה</strong>',
    };
    const fixture = start(); initialize([unknown]); await fixture.whenStable();
    const element = await openDetail(fixture, unknown);
    expect(element.querySelector('tbody tr')?.querySelectorAll('td')[4]?.textContent).toBe('לא ידוע');
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('<strong>טקסט הדגמה</strong>');
    expect(element.querySelector('.staffing-detail strong')).toBeNull();
    expect(element.querySelector('.staffing-detail')?.textContent).not.toContain('קיבולת מלאה');
  });

  it('loads candidates on demand with stale/unknown labels and no implicit eligibility or assignment', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element = await openDetail(fixture);
    http.expectNone(request => request.url.endsWith('/candidates'));
    const request = loadCandidates(element);
    expect(request.request.method).toBe('GET');
    request.flush({
      ...marker, ...metadata, requestId: sample.id, nextCursor: null,
      items: [
        { id: 'staff-candidate-1', employeeId: '00000002', employeeName: 'מועמד הדגמה', freshness: 'stale', asOfLocal: '2026-10-12T08:00:00', note: null },
        { id: 'staff-candidate-2', employeeId: '00000003', employeeName: 'מועמד לא ידוע', freshness: 'unknown', asOfLocal: null, note: null },
      ],
    });
    await fixture.whenStable();
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('עדכניות לא ידועה');
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('דורש בדיקה מחדש');
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('אינו זכאות');
    http.expectNone(request => request.method !== 'GET');
  });

  it('rejects wrong request context and foreign candidate scope while retaining the valid request detail', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element = await openDetail(fixture);
    loadCandidates(element).flush({ ...list([]), requestId: '93000006' });
    await fixture.whenStable();
    expect(element.querySelector('.staffing-detail')).not.toBeNull();
    expect(element.querySelector('.staffing-detail')?.textContent).toContain('תגובת ההדגמה אינה תקינה');
    loadCandidates(element).flush({
      ...list(), requestId: sample.id,
      items: [{ id: 'staff-candidate-4', employeeId: '00000004', employeeName: 'hidden', freshness: 'current', asOfLocal: metadata.clockLocal, note: null }],
    });
    await fixture.whenStable();
    expect(element.textContent).not.toContain('hidden');
    expect(element.querySelector('#staffing-candidates-title')).toBeNull();
  });

  it('handles empty and failed candidate reads distinctly without replacing the card or showing stale entries', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element = await openDetail(fixture);
    loadCandidates(element).flush({ ...list([]), requestId: sample.id });
    await fixture.whenStable();
    expect(element.textContent).toContain('אין מועמדי הדגמה לבקשה זו');
    loadCandidates(element).flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector('.staffing-detail')).not.toBeNull();
    expect(element.textContent).toContain('לא ניתן לטעון');
    expect(element.textContent).not.toContain('אין מועמדי הדגמה לבקשה זו');
  });

  it('cancels detail/candidate work on close or new filter, and preserves the chosen filter after service failure', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element = await openDetail(fixture);
    const candidate = loadCandidates(element);
    element.querySelector<HTMLButtonElement>('.staffing-close')?.click();
    expect(candidate.cancelled).toBe(true);
    await fixture.whenStable();
    expect(element.querySelector('.staffing-detail')).toBeNull();
    element.querySelector<HTMLButtonElement>(`#staffing-${sample.id}`)?.click();
    const detail = http.expectOne(`/api/v1/staffing-requests/${sample.id}`);
    const kind = element.querySelector<HTMLSelectElement>('#staffing-kind');
    if (!kind) { throw new Error('Missing request-kind filter.'); }
    kind.value = 'reduction';
    kind.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(detail.cancelled).toBe(true);
    const request = http.expectOne(request => request.url === '/api/v1/staffing-requests');
    expect(request.request.params.get('kind')).toBe('reduction');
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(kind.value).toBe('reduction');
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('rejects unmarked capability, contradictory capacity and incorrect filtered request kinds', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capabilities, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/staffing-requests');
    const element: HTMLElement = fixture.nativeElement;
    const retry = [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('ניסיון נוסף'));
    retry?.click();
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/staffing-requests').flush(list([{ ...sample, remaining: 1 }]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    const kind = element.querySelector<HTMLSelectElement>('#staffing-kind');
    if (!kind) { throw new Error('Missing request-kind filter.'); }
    kind.value = 'reduction'; kind.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    http.expectOne(request => request.url === '/api/v1/staffing-requests').flush(list());
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });
});
