import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PersonalShifts } from './personal-shifts';
import type { PersonalShiftItem } from './shifts-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const identity = { ...marker, displayName: 'עובד הדגמה' };
const capabilities = { ...marker, personalShifts: { read: { enabled: true } } };
const shift: PersonalShiftItem = {
  id: '9007199254740993',
  projection: 'override',
  effective: {
    employeeId: '00000001',
    startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T16:00:00',
    siteId: 'synthetic-site', activityId: 'synthetic-activity', workFromHome: true,
    split: { enabled: true, gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T14:00:00' },
  },
  baseline: null,
  baselineAvailability: 'not-authorized',
};

function list(items: readonly PersonalShiftItem[] = [shift]) {
  return { ...marker, items, nextCursor: null, fetchedAt: '2026-10-13T11:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
}

describe('Personal shifts synthetic HTTP workflow', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalShifts],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(PersonalShifts);
    fixture.detectChanges();
    return fixture;
  }

  function initialize() {
    http.expectOne('/api/v1/me').flush(identity);
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    return http.expectOne(request => request.url === '/api/v1/me/shifts');
  }

  it('checks labelled identity/capability before reading and converts inclusive end by calendar day', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/me/shifts');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-10-14');
    expect(request.request.params.get('toExclusive')).toBe('2026-10-18');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('נתונים סינתטיים בלבד');
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    expect(element.textContent).toContain('2026-10-14');
    expect(element.textContent).toContain('שינוי');
  });

  it('does not request shifts when identity is not explicitly synthetic', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me').flush({ ...identity, synthetic: false });
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/me/shifts');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('אינה מסומנת כנתונים סינתטיים');
    expect(element.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('distinguishes successful empty data from dependency failure and preserves filters', async () => {
    const fixture = start();
    initialize().flush(list([]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('לא נמצאו משמרות');
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    http.expectOne(request => request.url === '/api/v1/me/shifts').flush(
      {}, { status: 503, statusText: 'Unavailable' },
    );
    await fixture.whenStable();
    expect(element.textContent).toContain('לא ניתן לטעון');
    expect(element.textContent).not.toContain('לא נמצאו משמרות');
    expect(element.querySelector<HTMLInputElement>('#shift-from')?.value).toBe('2026-10-14');
  });

  it('rejects unlabelled or malformed list results without displaying stale rows', async () => {
    const fixture = start();
    initialize().flush({ ...list(), synthetic: false });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('אינה מסומנת כנתונים סינתטיים');
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    http.expectOne(request => request.url === '/api/v1/me/shifts').flush({ ...list(), items: [{ id: 'broken' }] });
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('shows local split details and redaction, with a close action', async () => {
    const fixture = start();
    initialize().flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#shift-detail-${shift.id}`)?.click();
    http.expectOne(`/api/v1/shifts/${shift.id}`).flush({
      ...marker, item: shift, fetchedAt: '2026-10-13T11:00:00Z', businessTimeZone: 'Asia/Jerusalem',
    });
    await fixture.whenStable();
    expect(element.querySelector('#detail-title')?.textContent).toContain('פרטי משמרת הדגמה');
    expect(element.textContent).toContain('2026-10-14T12:00:00');
    expect(element.textContent).toContain('התכנון המקורי אינו מוצג');
    element.querySelector<HTMLButtonElement>('.detail button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.detail')).toBeNull();
  });

  it('cancels previous filter and detail reads when a newer filter supersedes them', async () => {
    const fixture = start();
    const older = initialize();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(older.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/me/shifts').flush(list());
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>(`#shift-detail-${shift.id}`)?.click();
    const detail = http.expectOne(`/api/v1/shifts/${shift.id}`);
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(detail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/me/shifts').flush(list([]));
    await fixture.whenStable();
    expect(element.querySelector('.detail')).toBeNull();
    expect(element.textContent).toContain('לא נמצאו משמרות');
  });

  it('rejects reversed and over-31-day filters locally without a data request', async () => {
    const fixture = start();
    initialize().flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const end = element.querySelector<HTMLInputElement>('#shift-to');
    if (!end) { throw new Error('Expected inclusive end field.'); }
    for (const value of ['2026-10-13', '2026-11-14']) {
      end.value = value;
      end.dispatchEvent(new Event('input'));
      element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await fixture.whenStable();
      expect(element.textContent).toContain('יש לבחור תאריכים תקינים');
      http.expectNone(request => request.url === '/api/v1/me/shifts');
    }
  });

  it('detail failure is explicit and does not remove the successfully loaded table', async () => {
    const fixture = start();
    initialize().flush(list());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#shift-detail-${shift.id}`)?.click();
    http.expectOne(`/api/v1/shifts/${shift.id}`).flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(element.querySelector('.detail')).toBeNull();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    expect(element.textContent).toContain('אינם זמינים');
  });
});
