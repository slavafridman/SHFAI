import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Operational } from './operational';
import type { DemoAttendanceRow } from '../../../api/src/stub/operational-contracts';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const capabilities = { ...marker, operationalReads: { read: { enabled: true } } };
const row: DemoAttendanceRow = {
  employeeName: 'עובד הדגמה',
  shift: {
    id: '9007199254740998', projection: 'baseline', baseline: null, baselineAvailability: 'not-authorized',
    effective: {
      employeeId: '00000001', startLocal: '2026-10-16T23:00:00', endLocal: '2026-10-17T06:00:00',
      siteId: null, activityId: null, workFromHome: null, split: { enabled: null, gapStartLocal: null, gapEndLocal: null },
    },
  },
  attendance: {
    stageArrivalLocal: null, stationArrivalLocal: '2026-10-16T23:00:00',
    stationExitLocal: '2026-10-17T06:00:00', lateMinutes: 0, missingReason: null,
  },
};

function envelope(items: readonly unknown[] = [row]) {
  return { ...marker, unitId: 'synthetic-team-a', items, nextCursor: null, fetchedAt: '2026-10-14T06:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
}

describe('Read-only operational schedule/attendance demo', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Operational], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(Operational);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    return http.expectOne(request => request.url === '/api/v1/shifts');
  }
  function button(element: HTMLElement, label: string) {
    const found = [...element.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label);
    if (!found) { throw new Error('Missing operational action.'); }
    return found;
  }

  it('gates reads, sends inclusive calendar filters and keeps actual data out of schedule presentation', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/shifts');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-10-14');
    expect(request.request.params.get('toExclusive')).toBe('2026-10-18');
    request.flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('2026-10-17T06:00:00');
    expect(element.querySelector('thead')?.textContent).not.toContain('הגעה לעמדה');
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(2);
  });

  it('distinguishes actual zero, null, missing reason and next-day departure without inferred attendance', async () => {
    const fixture = start();
    initialize().flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    button(element, 'נוכחות').click();
    const unknown = {
      ...row, shift: { ...row.shift, id: '9007199254740999' },
      attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, lateMinutes: null, missingReason: 'סיבה סינתטית' },
    };
    http.expectOne(request => request.url === '/api/v1/attendance').flush(envelope([row, unknown]));
    await fixture.whenStable();
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0]?.querySelectorAll('td')[6]?.textContent).toBe('0');
    expect(rows[1]?.querySelectorAll('td')[6]?.textContent).toBe('לא ידוע');
    expect(rows[1]?.textContent).toContain('לא נרשם בנתוני ההדגמה');
    expect(rows[1]?.textContent).toContain('סיבה סינתטית');
    expect(rows[0]?.textContent).toContain('2026-10-17T06:00:00');
    http.expectNone(request => request.method !== 'GET');
  });

  it('cancels superseded mode reads and clears stale detail when mode changes', async () => {
    const fixture = start();
    const old = initialize();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    button(element, 'נוכחות').click();
    expect(old.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/attendance').flush(envelope());
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('#ops-row-9007199254740998')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.ops-detail')).not.toBeNull();
    button(element, 'סידור עבודה').click();
    http.expectOne(request => request.url === '/api/v1/shifts').flush(envelope([]));
    await fixture.whenStable();
    expect(element.querySelector('.ops-detail')).toBeNull();
    expect(element.textContent).toContain('לא נמצאו משמרות הדגמה');
  });

  it('rejects wrong scope and malformed actuals without showing protected rows or fabricated zero', async () => {
    const fixture = start();
    initialize().flush({ ...envelope(), unitId: 'synthetic-team-b' });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    button(element, 'נוכחות').click();
    http.expectOne(request => request.url === '/api/v1/attendance').flush(envelope([{ ...row, attendance: { ...row.attendance, lateMinutes: '0' } }]));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('preserves date filters across explicit failures and rejects invalid ranges before HTTP', async () => {
    const fixture = start();
    initialize().flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    button(element, 'נוכחות').click();
    http.expectOne(request => request.url === '/api/v1/attendance').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#ops-from')?.value).toBe('2026-10-14');
    expect(element.textContent).toContain('לא ניתן לטעון את התצוגה התפעולית');
    const end = element.querySelector<HTMLInputElement>('#ops-to');
    if (!end) { throw new Error('Missing operational calendar.'); }
    end.value = '2026-10-01';
    end.dispatchEvent(new Event('input'));
    button(element, 'הצגת נתונים תפעוליים').click();
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/attendance');
    expect(element.textContent).toContain('יש לבחור תאריכים תקינים');
  });

  it('requires synthetic capability and does not query operations when disabled', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capabilities, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/shifts');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });
});
