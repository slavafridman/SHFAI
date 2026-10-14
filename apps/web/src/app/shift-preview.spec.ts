import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ShiftPreview } from './shift-preview';
import type { DemoShiftPreviewContext } from './shift-preview-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T06:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capability = { ...marker, personalShifts: { preview: { enabled: true } } };
const source: DemoShiftPreviewContext = {
  shift: {
    id: '9007199254740993', projection: 'baseline', baseline: null, baselineAvailability: 'not-authorized',
    effective: {
      employeeId: '00000001', startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T16:00:00',
      activityId: null, siteId: null, workFromHome: false, split: { enabled: false, gapStartLocal: null, gapEndLocal: null },
    },
  },
  breaks: [{ id: 'break-1', startLocal: '2026-10-14T10:00:00', endLocal: '2026-10-14T10:15:00' }],
  previewAvailable: true, unavailableReason: null, policyVersion: 'synthetic-shift-policy-1',
};

describe('Pure shift-time and split demo UI', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftPreview], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(ShiftPreview);
    fixture.detectChanges();
    return fixture;
  }
  function initialize(context = source) {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    http.expectOne(request => request.url === '/api/v1/me/shifts')
      .flush({ ...marker, ...metadata, items: [context.shift], nextCursor: null });
    http.expectOne(`/api/v1/shifts/${source.shift.id}/shift-preview-context`).flush({ ...marker, ...metadata, item: context });
  }
  function input(element: HTMLElement, selector: string, value: string) {
    const field = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!field) { throw new Error('Missing proposal field.'); }
    field.value = value; field.dispatchEvent(new Event('input'));
  }
  function submit(element: HTMLElement) {
    element.querySelector<HTMLButtonElement>('form[aria-label="חישוב הצעת משמרת ללא שמירה"] button[type="submit"]')?.click();
  }
  function flush(split = false, saved = false, working = 480) {
    const request = http.expectOne(request => request.method === 'POST');
    const proposal = request.request.body;
    request.flush({
      ...marker, ...metadata, shiftId: source.shift.id,
      item: {
        previewOnly: true, saved, policyVersion: source.policyVersion, before: source.shift, reason: proposal.reason.trim(),
        proposed: {
          ...source.shift.effective, startLocal: proposal.startLocal, endLocal: proposal.endLocal,
          split: { enabled: split, gapStartLocal: proposal.split?.gapStartLocal ?? null, gapEndLocal: proposal.split?.gapEndLocal ?? null },
        },
        minutes: { span: split ? 600 : 480, working, gap: split ? 120 : 0, firstPart: split ? 360 : null, secondPart: split ? 120 : null },
        warnings: ['הדגמה שלא נשמרה.'],
      },
    });
    return request;
  }

  it('requires marked capability and source, with no calculation before explicit input', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/me/shifts');
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(2);
    expect(element.textContent).toContain('אין שינוי במשמרות או בהפסקות');
    http.expectNone(request => request.method === 'POST');
  });

  it('rejects empty/whitespace reason and invalid dates locally, preserving drafts', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    input(element, '#proposal-reason', ' ');
    submit(element); await fixture.whenStable();
    expect(element.textContent).toContain('יש להזין תאריכים, שעות וסיבה');
    http.expectNone(request => request.method === 'POST');
    input(element, '#proposal-reason', 'הדגמה');
    input(element, '#proposal-start-date', '2026-02-30');
    submit(element); await fixture.whenStable();
    http.expectNone(request => request.method === 'POST');
    expect(element.querySelector<HTMLTextAreaElement>('#proposal-reason')?.value).toBe('הדגמה');
  });

  it('shows explicit unsaved before/proposed values for a pure shift POST', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    input(element, '#proposal-reason', 'הדגמה בלבד');
    submit(element);
    const request = flush();
    expect(request.request.body).toEqual({
      startLocal: '2026-10-14T08:00:00', endLocal: '2026-10-14T16:00:00', reason: 'הדגמה בלבד', split: null,
    });
    await fixture.whenStable();
    expect(element.querySelector('.proposal-result')?.textContent).toContain('לא נשמרה');
    expect(element.querySelector('.proposal-result')?.textContent).toContain('480');
    http.expectNone(request => /change-proposals|operations|transactions/.test(request.url));
  });

  it('submits explicit split dates and renders two segments and correct work/gap minutes', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    await fixture.whenStable();
    expect(element.querySelectorAll('mat-datepicker-toggle button').length).toBe(4);
    input(element, '#proposal-end-time', '18:00');
    input(element, '#proposal-reason', 'פיצול הדגמה');
    submit(element);
    const request = flush(true);
    expect(request.request.body.split).toEqual({
      gapStartLocal: '2026-10-14T14:00:00', gapEndLocal: '2026-10-14T16:00:00',
    });
    await fixture.whenStable();
    expect(element.querySelector('.proposal-result')?.textContent).toContain('חלק ראשון');
    expect(element.querySelector('.proposal-result')?.textContent).toContain('חלק שני');
    expect(element.querySelector('.proposal-result')?.textContent).toContain('עבודה מוצעת: 480');
    expect(element.querySelector('.proposal-result')?.textContent).toContain('פער: 120');
  });

  it('retains a rule-rejected split draft without deleting source breaks or showing a result', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    input(element, '#proposal-reason', 'הדגמה');
    submit(element);
    http.expectOne(request => request.method === 'POST').flush({
      ...marker, title: 'ההצעה מתנגשת בהפסקה מתוכננת. הפסקות והצעות אינן נמחקות או משתנות.',
    }, { status: 422, statusText: 'Unprocessable Content' });
    await fixture.whenStable();
    expect(element.textContent).toContain('הפסקות והצעות אינן נמחקות');
    expect(element.querySelector('.proposal-result')).toBeNull();
    expect(element.querySelector<HTMLTextAreaElement>('#proposal-reason')?.value).toBe('הדגמה');
  });

  it('cancels in-flight calculation and removes stale successful result when draft changes', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    input(element, '#proposal-reason', 'הדגמה');
    submit(element);
    const old = http.expectOne(request => request.method === 'POST');
    input(element, '#proposal-reason', 'טיוטה חדשה');
    expect(old.cancelled).toBe(true);
    await fixture.whenStable();
    submit(element); flush(); await fixture.whenStable();
    expect(element.querySelector('.proposal-result')).not.toBeNull();
    input(element, '#proposal-end-time', '18:00');
    await fixture.whenStable();
    expect(element.querySelector('.proposal-result')).toBeNull();
  });

  it('rejects saved/completed and wrong-minute results rather than claiming success', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    input(element, '#proposal-reason', 'הדגמה');
    submit(element); flush(false, true); await fixture.whenStable();
    expect(element.querySelector('.proposal-result')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    submit(element); flush(false, false, 999); await fixture.whenStable();
    expect(element.querySelector('.proposal-result')).toBeNull();
  });

  it('keeps source/partner-unverified calculation disabled', async () => {
    const fixture = start();
    initialize({ ...source, previewAvailable: false, unavailableReason: 'SHIFT_SOURCE_POLICY_UNVERIFIED' });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector<HTMLButtonElement>('form[aria-label="חישוב הצעת משמרת ללא שמירה"] button[type="submit"]')?.disabled).toBe(true);
    http.expectNone(request => request.method === 'POST');
  });
});
