import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Buildings } from './buildings';
import type { DemoBuilding } from './buildings-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T10:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capability = { ...marker, buildings: { read: { enabled: true } } };
const unit = { id: 'synthetic-team-a', name: 'צוות הדגמה א׳' };
const items: DemoBuilding[] = [
  { id: '94000001', name: 'מבנה ראשי לדוגמה', orgUnit: unit, address: 'כתובת מומצאת', seatCapacity: 72 },
  { id: '94000002', name: 'מבנה ללא מושבים לדוגמה', orgUnit: unit, address: '<b>כתובת הדגמה בלבד</b>', seatCapacity: 0 },
  { id: '94000003', name: 'מבנה עם פרטים לא ידועים — Demo ABC', orgUnit: unit, address: null, seatCapacity: null },
];
function response(rows: readonly DemoBuilding[] = items, search = '') {
  return { ...marker, ...metadata, unitId: unit.id, search, items: rows, nextCursor: null };
}
describe('Read-only synthetic building directory', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buildings], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start() { const fixture = TestBed.createComponent(Buildings); fixture.detectChanges(); return fixture; }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/buildings');
  }
  function click(element: HTMLElement, label: string) {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === label);
    if (!button) { throw new Error(`Missing button: ${label}`); }
    button.click();
  }
  function search(element: HTMLElement, value: string) {
    const input = element.querySelector<HTMLInputElement>('#building-search');
    if (!input) { throw new Error('Missing building search input.'); }
    input.value = value; input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
  }

  it('gates requests and distinguishes zero from unknown without enabling write controls', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/buildings');
    const request = initialize();
    expect(request.request.params.get('limit')).toBe('100');
    expect(request.request.params.get('search')).toBe('');
    request.flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    expect(element.querySelectorAll('tbody tr')[1]?.querySelectorAll('td')[2]?.textContent).toBe('0');
    expect(element.querySelectorAll('tbody tr')[2]?.querySelectorAll('td')[2]?.textContent).toBe('לא ידוע');
    expect(element.textContent).toContain('אין הזדהות או הרשאת מנהל אמיתית');
    http.expectNone(request => request.method !== 'GET');
  });

  it('renders literal address text, focuses detail and returns focus to the invoking row', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const opener = element.querySelector<HTMLButtonElement>('#building-open-94000002');
    opener?.click();
    http.expectOne('/api/v1/buildings/94000002').flush({ ...marker, ...metadata, item: items[1] });
    await fixture.whenStable();
    expect(element.querySelector('.building-card')?.textContent).toContain('<b>כתובת הדגמה בלבד</b>');
    expect(element.querySelector('.building-card b')).toBeNull();
    expect(element.ownerDocument.activeElement?.id).toBe('building-detail-title');
    click(element, 'סגירת פרטי מבנה');
    await fixture.whenStable();
    expect(element.querySelector('.building-card')).toBeNull();
    expect(element.ownerDocument.activeElement).toBe(opener);
  });

  it('keeps normalized search context and represents a valid empty result', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    search(element, ' DEMO ');
    const request = http.expectOne(request => request.url === '/api/v1/buildings');
    expect(request.request.params.get('search')).toBe(' DEMO ');
    request.flush(response([items[2]!], 'demo')); await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    search(element, 'absent');
    http.expectOne(request => request.url === '/api/v1/buildings').flush(response([], 'absent'));
    await fixture.whenStable();
    expect(element.textContent).toContain('לא נמצאו מבני הדגמה');
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('rejects scope, duplicate IDs, unsafe/null-shape data and mismatched query rather than showing a directory', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    for (const payload of [
      { ...response(), unitId: 'synthetic-team-b' },
      { ...response(), search: 'wrong' },
      response([items[0]!, items[0]!]),
      response([{ ...items[0]!, seatCapacity: Number.MAX_SAFE_INTEGER + 1 }]),
      response([{ ...items[0]!, seatCapacity: -1 }]),
      { ...response(), items: [{ ...items[0], seatCapacity: undefined }] },
      { ...response(), items: [{ ...items[0], address: undefined }] },
      { ...response(), items: [{ ...items[0], orgUnit: { ...unit, id: 'foreign' } }] },
      { ...response(), items: [{ ...items[0], managedDispatch: true }] },
    ]) {
      search(element, '');
      http.expectOne(request => request.url === '/api/v1/buildings').flush(payload);
      await fixture.whenStable();
      expect(element.querySelector('tbody')).toBeNull();
      expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    }
  });

  it('cancels superseded list and detail reads; invalid input clears stale data without another request', async () => {
    const fixture = start(); const oldList = initialize(); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    search(element, '');
    expect(oldList.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/buildings').flush(response());
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('#building-open-94000001')?.click();
    const oldDetail = http.expectOne('/api/v1/buildings/94000001');
    search(element, 'absent');
    expect(oldDetail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/buildings').flush(response([], 'absent'));
    await fixture.whenStable();
    search(element, 'a'.repeat(81)); await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/buildings');
    expect(element.textContent).toContain('לכל היותר 80');
    expect(element.ownerDocument.activeElement?.id).toBe('building-search');
  });

  it('retains list/search on failed detail, rejects wrong detail ID and allows retry without mutation', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#building-open-94000001')?.click();
    http.expectOne('/api/v1/buildings/94000001').flush({ ...marker, ...metadata, item: items[1] });
    await fixture.whenStable();
    expect(element.querySelector('.building-card')).toBeNull();
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    click(element, 'ניסיון נוסף לפרטי מבנה');
    http.expectOne('/api/v1/buildings/94000001').flush({ ...marker, title: 'פרטי הדגמה אינם זמינים.' }, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.textContent).toContain('פרטי הדגמה אינם זמינים');
    click(element, 'ניסיון נוסף לפרטי מבנה');
    http.expectOne('/api/v1/buildings/94000001').flush({ ...marker, ...metadata, item: items[0] });
    await fixture.whenStable();
    expect(element.querySelector('.building-card')?.textContent).toContain('72');
    http.expectNone(request => request.method !== 'GET');
  });

  it('refuses unmarked capability/result data and retains search through a failed list and retry', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/buildings');
    const element: HTMLElement = fixture.nativeElement;
    click(element, 'ניסיון נוסף למבנים');
    initialize().flush({ ...response(), synthetic: false }); await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    search(element, 'DEMO');
    http.expectOne(request => request.url === '/api/v1/buildings').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#building-search')?.value).toBe('DEMO');
    click(element, 'ניסיון נוסף למבנים');
    http.expectOne(request => request.url === '/api/v1/buildings').flush(response([items[2]!], 'demo'));
    await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
  });
});
