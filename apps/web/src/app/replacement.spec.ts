import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Replacement } from './replacement';
import type { DemoReplacementList, DemoReplacementPreview } from './replacement-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T07:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capabilities = { ...marker, replacement: { read: { enabled: true }, preview: { enabled: true } } };
const data: DemoReplacementList = {
  source: {
    id: '91000001', employeeId: '00000001', employeeName: 'עובד הדגמה ראשון',
    startLocal: '2026-10-16T08:00:00', endLocal: '2026-10-16T16:00:00', siteId: 'synthetic-site-x',
  },
  items: [1, 2, 3, 4].map(index => ({
    id: `candidate-${index}`,
    shift: {
      id: String(92000000 + index), employeeId: index % 2 ? '00000002' : '00000003', employeeName: `מועמד הדגמה ${index}`,
      startLocal: '2026-10-17T08:00:00', endLocal: '2026-10-17T16:00:00', siteId: null,
    },
  })),
  policyVersion: 'synthetic-replacement-policy-1', clockLocal: '2026-10-13T08:00:00', nextCursor: null,
};
function result(id: string, eligibility: DemoReplacementPreview['eligibility']): DemoReplacementPreview {
  return {
    previewOnly: true, saved: false, accepted: false, policyVersion: data.policyVersion,
    sourceShiftId: data.source.id, candidateId: id, eligibility,
    blockers: eligibility === 'blocked' ? [{ code: 'REST_GAP_TOO_SHORT', message: 'מנוחה סינתטית קצרה מדי.' }] : [],
    warnings: eligibility === 'confirmation-required' ? [{ code: 'REVIEW_REQUIRED', message: 'נדרשת בדיקה; לא בוצע אישור.' }] : [],
    unknowns: eligibility === 'unknown' ? [{ code: 'REST_FACTS_UNKNOWN', message: 'אין די מידע.' }] : [],
  };
}

describe('Synthetic replacement candidates and eligibility', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Replacement], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start() {
    const fixture = TestBed.createComponent(Replacement);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/replacement-candidates').flush({ ...marker, ...metadata, ...data });
  }
  function select(element: HTMLElement, id: string) {
    element.querySelector<HTMLButtonElement>(`#replacement-${id}`)?.click();
  }

  it('gates candidate reads on synthetic capability and distinguishes all four result categories', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/replacement-candidates');
    initialize();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(4);
    expect(element.textContent).toContain('אינו השעה הנוכחית');
    for (const [index, status, label] of [
      [1, 'eligible-under-demo-policy', 'מתאים לפי כללי ההדגמה בלבד'],
      [2, 'blocked', 'חסום לפי נתוני ההדגמה'],
      [3, 'confirmation-required', 'נדרשת בדיקה או הסכמה'],
      [4, 'unknown', 'אין די מידע מאומת'],
    ] as const) {
      const id = `candidate-${index}`;
      select(element, id);
      const request = http.expectOne('/api/v1/replacement-eligibility-previews');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ candidateId: id });
      request.flush({ ...marker, ...metadata, item: result(id, status) });
      await fixture.whenStable();
      expect(element.querySelector('.replacement-result h3')?.textContent).toContain(label);
      expect(element.querySelector('.replacement-result')?.textContent).toContain('לא נשמרה ולא התקבלה');
      expect(element.querySelectorAll('tbody tr').length).toBe(4);
    }
    http.expectNone(request => /acceptance|change-proposals|transactions/.test(request.url));
  });

  it('rejects real/unmarked capabilities without querying candidates', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capabilities, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/replacement-candidates');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('rejects accepted or contradictory eligible results instead of masking blockers', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews')
      .flush({ ...marker, ...metadata, item: { ...result('candidate-1', 'eligible-under-demo-policy'), accepted: true } });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews').flush({
      ...marker, ...metadata, item: { ...result('candidate-1', 'blocked'), eligibility: 'eligible-under-demo-policy' },
    });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('cancels older preview and list-refresh work, and closing restores a clean list', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    select(element, 'candidate-1');
    const older = http.expectOne('/api/v1/replacement-eligibility-previews');
    select(element, 'candidate-2');
    expect(older.cancelled).toBe(true);
    http.expectOne('/api/v1/replacement-eligibility-previews')
      .flush({ ...marker, ...metadata, item: result('candidate-2', 'blocked') });
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('.replacement-result button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
    select(element, 'candidate-3');
    const pending = http.expectOne('/api/v1/replacement-eligibility-previews');
    element.querySelector<HTMLButtonElement>('button')?.click();
    expect(pending.cancelled).toBe(true);
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/replacement-candidates').flush({ ...marker, ...metadata, ...data });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
  });

  it('distinguishes empty candidate data from explicit failure without dropping a valid list after preview error', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/replacement-candidates')
      .flush({ ...marker, ...metadata, ...data, items: [] });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('אין מועמדי הדגמה');
    element.querySelector<HTMLButtonElement>('button')?.click();
    initialize();
    await fixture.whenStable();
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(4);
    expect(element.textContent).toContain('לא ניתן לטעון או לבדוק');
  });

  it('refuses out-of-team candidate rows and renders issue messages as plain text', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews').flush({
      ...marker, ...metadata, item: {
        ...result('candidate-1', 'confirmation-required'),
        warnings: [{ code: 'REVIEW_REQUIRED', message: '<img src="synthetic-invalid">' }],
      },
    });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')?.textContent).toContain('<img');
    expect(element.querySelector('.replacement-result img')).toBeNull();
    element.querySelector<HTMLButtonElement>('button')?.click();
    http.expectOne('/api/v1/me/capabilities').flush(capabilities);
    http.expectOne(request => request.url === '/api/v1/replacement-candidates').flush({
      ...marker, ...metadata, ...data,
      items: [{ ...data.items[0], shift: { ...data.items[0]?.shift, employeeId: '00000004' } }],
    });
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('rejects a preview for another candidate or source while keeping the current list', async () => {
    const fixture = start(); initialize(); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews')
      .flush({ ...marker, ...metadata, item: result('candidate-2', 'blocked') });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
    expect(element.querySelectorAll('tbody tr').length).toBe(4);
    select(element, 'candidate-1');
    http.expectOne('/api/v1/replacement-eligibility-previews')
      .flush({ ...marker, ...metadata, item: { ...result('candidate-1', 'blocked'), sourceShiftId: 'foreign-source' } });
    await fixture.whenStable();
    expect(element.querySelector('.replacement-result')).toBeNull();
  });
});
