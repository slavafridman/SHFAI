import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Breaks } from './breaks';
import type { DemoBreakView } from './breaks-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const capability = { ...marker, breaks: { read: { enabled: true }, preview: { enabled: true } } };
const sample: DemoBreakView = {
  shift: {
    id: '9007199254740993', projection: 'baseline', baseline: null, baselineAvailability: 'not-authorized',
    effective: {
      employeeId: '00000001', startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T16:00:00',
      siteId: null, activityId: null, workFromHome: false, split: { enabled: false, gapStartLocal: null, gapEndLocal: null },
    },
  },
  breaks: [
    {
      id: 'break-1', startLocal: '2026-10-14T10:00:00', endLocal: '2026-10-14T10:15:00',
      actualStartLocal: '2026-10-14T10:00:23', actualEndLocal: null,
    },
  ],
  previewAvailable: true, unavailableReason: null,
  policy: { version: 'synthetic-break-policy-1', edgeMinutes: 60, gapMinutes: 60, minDurationMinutes: 1, maxDurationMinutes: 120 },
};
const metadata = { fetchedAt: '2026-10-14T06:00:00Z', businessTimeZone: 'Asia/Jerusalem' };

describe('Pure synthetic break previews', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breaks], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(Breaks);
    fixture.detectChanges();
    return fixture;
  }
  function initialize(view = sample) {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    http.expectOne(request => request.url === '/api/v1/me/shifts')
      .flush({ ...marker, ...metadata, items: [view.shift], nextCursor: null });
    http.expectOne(`/api/v1/shifts/${sample.shift.id}/breaks`).flush({ ...marker, ...metadata, item: view });
  }
  function submit(element: HTMLElement) {
    element.querySelector<HTMLButtonElement>('form[aria-label="חישוב הצעת הפסקה ללא שמירה"] button[type="submit"]')?.click();
  }
  function flushPreview(start = '2026-10-14T10:00:00', saved = false) {
    const request = http.expectOne(`/api/v1/shifts/${sample.shift.id}/break-change-previews`);
    request.flush({
      ...marker, ...metadata, shiftId: sample.shift.id,
      item: {
        previewOnly: true, saved, policyVersion: 'synthetic-break-policy-1', before: sample.breaks[0],
        proposed: { id: 'break-1', startLocal: start, endLocal: new Date(Date.parse(start + 'Z') + 15 * 60_000).toISOString().slice(0, 19) },
        durationMinutes: 15, warnings: ['חישוב סינתטי שלא נשמר.'],
      },
    });
    return request;
  }

  it('loads labelled scoped break data only after capability and preserves actual seconds/nulls', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/me/shifts');
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('2026-10-14T10:00:23');
    expect(element.querySelector('tbody')?.textContent).toContain('לא נרשם בהדגמה');
    expect(element.textContent).toContain('אפס אינו מחיקה');
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(1);
  });

  it('POSTs only a proposed calculation and displays not-saved result without changing planned/actual rows', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const before = element.querySelector('tbody')?.textContent;
    submit(element);
    const request = flushPreview();
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ breakId: 'break-1', startLocal: '2026-10-14T10:00:00', durationMinutes: 15 });
    await fixture.whenStable();
    expect(element.querySelector('.preview')?.textContent).toContain('לא נשמרה');
    expect(element.querySelector('tbody')?.textContent).toBe(before);
    expect(element.querySelector('.preview')?.textContent).toContain('נתוני הביצוע לא השתנו');
    http.expectNone(request => /proposals|transactions|operations/.test(request.url));
  });

  it('retains the draft and displays backend rule errors without a fake preview', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const time = element.querySelector<HTMLInputElement>('#break-time');
    if (!time) { throw new Error('Missing local time.'); }
    time.value = '11:46';
    time.dispatchEvent(new Event('input'));
    submit(element);
    http.expectOne(request => request.method === 'POST').flush({
      ...marker, title: 'יש לשמור לפחות 60 דקות בין הפסקות.',
      errors: [{ field: 'startLocal' }],
    }, { status: 422, statusText: 'Unprocessable Content' });
    await fixture.whenStable();
    expect(element.textContent).toContain('יש לשמור לפחות 60 דקות בין הפסקות');
    expect(time.value).toBe('11:46');
    expect(element.querySelector('.preview')).toBeNull();
  });

  it('rejects zero duration locally and keeps unverified-source previews disabled', async () => {
    const fixture = start();
    initialize({ ...sample, previewAvailable: false, unavailableReason: 'MANAGED_POLICY_UNVERIFIED' });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector<HTMLButtonElement>('form[aria-label="חישוב הצעת הפסקה ללא שמירה"] button[type="submit"]')?.disabled).toBe(true);
    expect(element.textContent).toContain('מדיניות מקור');
    http.expectNone(request => request.method === 'POST');
  });

  it('rejects zero/decimal duration and impossible date before preview HTTP', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const duration = element.querySelector<HTMLInputElement>('#break-duration');
    if (!duration) { throw new Error('Missing duration field.'); }
    for (const input of ['0', '1.5']) {
      duration.value = input;
      duration.dispatchEvent(new Event('input'));
      submit(element);
      await fixture.whenStable();
      expect(element.textContent).toContain('משך שלם');
      http.expectNone(request => request.method === 'POST');
    }
    duration.value = '15';
    duration.dispatchEvent(new Event('input'));
    const date = element.querySelector<HTMLInputElement>('#break-date');
    if (!date) { throw new Error('Missing calendar date.'); }
    date.value = '2026-02-30';
    date.dispatchEvent(new Event('input'));
    submit(element);
    await fixture.whenStable();
    http.expectNone(request => request.method === 'POST');
  });

  it('cancels in-flight preview on draft edit and clears successful stale result immediately', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    const old = http.expectOne(request => request.method === 'POST');
    const time = element.querySelector<HTMLInputElement>('#break-time');
    if (!time) { throw new Error('Missing local time.'); }
    time.value = '11:45';
    time.dispatchEvent(new Event('input'));
    expect(old.cancelled).toBe(true);
    await fixture.whenStable();
    submit(element);
    flushPreview('2026-10-14T11:45:00');
    await fixture.whenStable();
    expect(element.querySelector('.preview')).not.toBeNull();
    time.value = '11:46';
    time.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(element.querySelector('.preview')).toBeNull();
  });

  it('rejects completion-shaped or unmarked preview responses instead of claiming a save', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    flushPreview('2026-10-14T10:00:00', true);
    await fixture.whenStable();
    expect(element.querySelector('.preview')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('rejects an inconsistent proposed end/duration instead of showing a plausible but wrong preview', async () => {
    const fixture = start();
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    http.expectOne(request => request.method === 'POST').flush({
      ...marker, ...metadata, shiftId: sample.shift.id,
      item: {
        previewOnly: true, saved: false, policyVersion: 'synthetic-break-policy-1', before: sample.breaks[0],
        proposed: { id: 'break-1', startLocal: '2026-10-14T10:00:00', endLocal: '2026-10-14T10:30:00' },
        durationMinutes: 15, warnings: [],
      },
    });
    await fixture.whenStable();
    expect(element.querySelector('.preview')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('cancels preview on a shift replacement and clears the previous draft when the new source has no breaks', async () => {
    const fixture = start();
    const empty: DemoBreakView = {
      ...sample, shift: {
        ...sample.shift, id: '9007199254740999',
        effective: { ...sample.shift.effective, startLocal: '2026-10-17T08:00:00', endLocal: '2026-10-17T16:00:00' },
      },
      breaks: [], previewAvailable: false, unavailableReason: 'BREAK_SOURCE_UNVERIFIED',
    };
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    http.expectOne(request => request.url === '/api/v1/me/shifts')
      .flush({ ...marker, ...metadata, items: [sample.shift, empty.shift], nextCursor: null });
    http.expectOne(`/api/v1/shifts/${sample.shift.id}/breaks`).flush({ ...marker, ...metadata, item: sample });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    const pending = http.expectOne(request => request.method === 'POST');
    const select = element.querySelector<HTMLSelectElement>('#break-shift');
    if (!select) { throw new Error('Missing shift selector.'); }
    select.value = empty.shift.id;
    select.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('form[aria-label="בחירת משמרת להפסקות הדגמה"] button')?.click();
    expect(pending.cancelled).toBe(true);
    http.expectOne(`/api/v1/shifts/${empty.shift.id}/breaks`).flush({ ...marker, ...metadata, item: empty });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#break-date')?.value).toBe('2026-10-17');
    expect(element.querySelector<HTMLInputElement>('#break-time')?.value).toBe('');
    expect(element.querySelector('.preview')).toBeNull();
    expect(element.textContent).toContain('אין הפסקות מתוכננות');
  });
});
