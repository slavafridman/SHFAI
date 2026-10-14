import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SystemParameters } from './system-parameters';
import type { DemoSystemParameter } from './system-parameters-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T11:00:00Z', businessTimeZone: 'Asia/Jerusalem', sourceVersion: 'synthetic-parameter-catalog-1' };
const capability = { ...marker, systemParameters: { read: { enabled: true } } };
const unit = { id: 'synthetic-team-a', name: 'צוות הדגמה א׳' };
const overridden: DemoSystemParameter = {
  code: 'shf.param.minutesArrivalBeforeStation', name: 'תזמון כניסה לתחנה — דוגמה', orgUnit: unit,
  unitValue: '0', defaultValue: '5', effectiveValue: '0', resolution: 'unit', measurement: 'unverified',
};
const inherited: DemoSystemParameter = {
  code: 'shf.param.differenceBetweenShifts', name: 'מרווח בין משמרות — דוגמה', orgUnit: unit,
  unitValue: null, defaultValue: '11.50', effectiveValue: '11.50', resolution: 'default', measurement: 'unverified',
};
const unknown: DemoSystemParameter = {
  code: 'shf.param.minimalShiftDuration', name: 'משך משמרת מזערי — דוגמה', orgUnit: unit,
  unitValue: null, defaultValue: null, effectiveValue: null, resolution: 'unknown', measurement: 'unverified',
};
const items = [overridden, inherited, unknown];
function response(rows: readonly DemoSystemParameter[] = items, search = '') {
  return { ...marker, ...metadata, unitId: unit.id, search, items: rows, nextCursor: null };
}
describe('Allowlisted synthetic scheduling parameter view', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemParameters], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start() { const fixture = TestBed.createComponent(SystemParameters); fixture.detectChanges(); return fixture; }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/system-parameters');
  }
  function click(element: HTMLElement, label: string) {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === label);
    if (!button) { throw new Error(`Missing button: ${label}`); }
    button.click();
  }
  function submit(element: HTMLElement, value = '') {
    const input = element.querySelector<HTMLInputElement>('#system-parameter-search');
    if (!input) { throw new Error('Missing parameter search input.'); }
    input.value = value; input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
  }
  function opener(element: HTMLElement, code: string) {
    return element.querySelector<HTMLButtonElement>(`[id="system-parameter-open-${code}"]`);
  }

  it('gates reads and displays unit zero, exact default decimal and unknown with distinct provenance', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/system-parameters');
    const request = initialize();
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[0]?.querySelectorAll('td')[4]?.textContent).toBe('0');
    expect(rows[0]?.querySelectorAll('td')[5]?.textContent).toBe('ערך יחידה בהדגמה');
    expect(rows[1]?.querySelectorAll('td')[4]?.textContent).toBe('11.50');
    expect(rows[1]?.querySelectorAll('td')[5]?.textContent).toBe('ברירת מחדל בהדגמה');
    expect(rows[2]?.querySelectorAll('td')[4]?.textContent).toBe('לא ידוע');
    expect(rows[2]?.querySelectorAll('td')[5]?.textContent).toBe('ללא ערך ידוע');
    expect(element.textContent).toContain('אינו משנה את כללי ההדגמות האחרות');
    http.expectNone(request => request.method !== 'GET');
  });

  it('preserves numeric strings beyond JS precision, leading zeros and scale instead of parsing or rounding', async () => {
    const fixture = start();
    const precise: DemoSystemParameter = { ...overridden, unitValue: '9007199254740993.00', effectiveValue: '9007199254740993.00' };
    const scaled: DemoSystemParameter = { ...inherited, defaultValue: '0011.50', effectiveValue: '0011.50' };
    initialize().flush(response([precise, scaled, unknown])); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('tbody tr')[0]?.querySelectorAll('td')[4]?.textContent).toBe('9007199254740993.00');
    expect(element.querySelectorAll('tbody tr')[1]?.querySelectorAll('td')[4]?.textContent).toBe('0011.50');
  });

  it('normalizes code/name search and supports a genuine empty search result without discovering flags', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element, ' DIFFERENCE ');
    const request = http.expectOne(request => request.url === '/api/v1/system-parameters');
    expect(request.request.params.get('search')).toBe(' DIFFERENCE ');
    request.flush(response([inherited], 'difference')); await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    submit(element, 'pool');
    http.expectOne(request => request.url === '/api/v1/system-parameters').flush(response([], 'pool'));
    await fixture.whenStable();
    expect(element.textContent).toContain('לא נמצאו פרמטרי הדגמה');
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('opens literal-text detail with full provenance and restores focus on close', async () => {
    const fixture = start();
    const item: DemoSystemParameter = { ...overridden, name: '<b>דוגמה בלבד</b>' };
    initialize().flush(response([item, inherited, unknown])); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const button = opener(element, item.code);
    button?.click();
    http.expectOne(`/api/v1/system-parameters/${item.code}`).flush({ ...marker, ...metadata, item });
    await fixture.whenStable();
    expect(element.querySelector('.parameter-card')?.textContent).toContain(item.name);
    expect(element.querySelector('.parameter-card b')).toBeNull();
    expect(element.querySelectorAll('.parameter-card dd')[2]?.textContent).toBe('0');
    expect(element.querySelectorAll('.parameter-card dd')[3]?.textContent).toBe('5');
    expect(element.ownerDocument.activeElement?.id).toBe('system-parameter-detail-title');
    click(element, 'סגירת פרטי פרמטר'); await fixture.whenStable();
    expect(element.ownerDocument.activeElement).toBe(button);
  });

  it('rejects off-allowlist/scope/context, malformed values and contradictory effective-value provenance', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    for (const payload of [
      { ...response(), sourceVersion: 'unverified-live-config' },
      { ...response(), unitId: 'foreign' },
      { ...response(), search: 'wrong' },
      response([overridden, overridden]),
      { ...response(), items: [{ ...overridden, code: 'shf.param.poolEnabled' }] },
      { ...response(), items: [{ ...overridden, unitValue: 0 }] },
      { ...response(), items: [{ ...overridden, unitValue: undefined }] },
      { ...response(), items: [{ ...overridden, defaultValue: '' }] },
      { ...response(), items: [{ ...overridden, effectiveValue: '5', resolution: 'default' }] },
      { ...response(), items: [{ ...inherited, effectiveValue: '11.5' }] },
      { ...response(), items: [{ ...unknown, effectiveValue: '0' }] },
      { ...response(), items: [{ ...overridden, measurement: 'minutes' }] },
      { ...response(), items: [{ ...overridden, orgUnit: { ...unit, id: 'foreign' } }] },
      { ...response(), items: [{ ...overridden, managedEnabled: true }] },
      { ...response(), items: [{ ...overridden, modificationUser: 'synthetic-hidden-owner' }] },
    ]) {
      submit(element);
      http.expectOne(request => request.url === '/api/v1/system-parameters').flush(payload);
      await fixture.whenStable();
      expect(element.querySelector('tbody')).toBeNull();
      expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    }
  });

  it('cancels replaced list/detail work and rejects overlong search locally with field focus', async () => {
    const fixture = start(); const previous = initialize(); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    expect(previous.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/system-parameters').flush(response()); await fixture.whenStable();
    opener(element, overridden.code)?.click();
    const previousDetail = http.expectOne(`/api/v1/system-parameters/${overridden.code}`);
    submit(element, 'difference');
    expect(previousDetail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/system-parameters').flush(response([inherited], 'difference'));
    await fixture.whenStable();
    submit(element, 'a'.repeat(81)); await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/system-parameters');
    expect(element.ownerDocument.activeElement?.id).toBe('system-parameter-search');
    expect(element.textContent).toContain('לכל היותר 80');
  });

  it('retains list on wrong-detail/error data and retries the exact parameter without mutation', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    opener(element, overridden.code)?.click();
    http.expectOne(`/api/v1/system-parameters/${overridden.code}`).flush({ ...marker, ...metadata, item: inherited });
    await fixture.whenStable();
    expect(element.querySelector('.parameter-card')).toBeNull();
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    click(element, 'ניסיון נוסף לפרטי פרמטר');
    http.expectOne(`/api/v1/system-parameters/${overridden.code}`).flush({ ...marker, title: 'פרטי פרמטר אינם זמינים.' }, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.textContent).toContain('פרטי פרמטר אינם זמינים');
    click(element, 'ניסיון נוסף לפרטי פרמטר');
    http.expectOne(`/api/v1/system-parameters/${overridden.code}`).flush({ ...marker, ...metadata, item: overridden });
    await fixture.whenStable();
    expect(element.querySelector('.parameter-card')?.textContent).toContain('ערך יחידה בהדגמה');
    http.expectNone(request => request.method !== 'GET');
  });

  it('refuses disabled/unmarked capability/result and retains search through a failed list and retry', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...marker, systemParameters: { read: { enabled: false } } });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/system-parameters');
    const element: HTMLElement = fixture.nativeElement;
    click(element, 'ניסיון נוסף לפרמטרים');
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/system-parameters');
    click(element, 'ניסיון נוסף לפרמטרים');
    initialize().flush({ ...response(), synthetic: false }); await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    submit(element, 'DIFFERENCE');
    http.expectOne(request => request.url === '/api/v1/system-parameters').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#system-parameter-search')?.value).toBe('DIFFERENCE');
    click(element, 'ניסיון נוסף לפרמטרים');
    http.expectOne(request => request.url === '/api/v1/system-parameters').flush(response([inherited], 'difference'));
    await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
  });
});
