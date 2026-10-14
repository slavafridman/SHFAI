import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InternalJobs } from './internal-jobs';
import type { DemoInternalJob, DemoInternalJobStatus } from './internal-jobs-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { fetchedAt: '2026-10-14T10:00:00Z', businessTimeZone: 'Asia/Jerusalem', sourceVersion: 'synthetic-job-catalog-1' };
const capability = { ...marker, internalJobs: { read: { enabled: true } } };
const unit = { id: 'synthetic-team-a', name: 'צוות הדגמה א׳' };
const active: DemoInternalJob = { id: '95000001', name: 'תפקיד פעיל לדוגמה', orgUnit: unit, active: true, groupCode: '12' };
const inactive: DemoInternalJob = { id: '95000002', name: 'תפקיד לא פעיל לדוגמה', orgUnit: unit, active: false, groupCode: '0' };
const unknown: DemoInternalJob = { id: '9007199254740997', name: '<b>תפקיד הדגמה בלבד</b> — Demo ABC', orgUnit: unit, active: null, groupCode: null };
const items = [active, inactive, unknown];
function response(rows: readonly DemoInternalJob[] = items, search = '', status: DemoInternalJobStatus = 'all') {
  return { ...marker, ...metadata, unitId: unit.id, search, status, items: rows, nextCursor: null };
}
describe('Read-only synthetic internal job catalog', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalJobs], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function start() { const fixture = TestBed.createComponent(InternalJobs); fixture.detectChanges(); return fixture; }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/internal-jobs');
  }
  function click(element: HTMLElement, label: string) {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === label);
    if (!button) { throw new Error(`Missing button: ${label}`); }
    button.click();
  }
  function submit(element: HTMLElement, search = '', status: DemoInternalJobStatus = 'all') {
    const input = element.querySelector<HTMLInputElement>('#internal-job-search');
    const select = element.querySelector<HTMLSelectElement>('#internal-job-status');
    if (!input || !select) { throw new Error('Missing job filters.'); }
    input.value = search; input.dispatchEvent(new Event('input'));
    select.value = status; select.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
  }

  it('gates reads and preserves large IDs, inactive/unknown and zero/unknown group codes', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/internal-jobs');
    const request = initialize();
    expect(request.request.params.get('limit')).toBe('100');
    expect(request.request.params.get('status')).toBe('all');
    request.flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[1]?.querySelectorAll('td')[2]?.textContent).toBe('לא פעיל בהדגמה');
    expect(rows[1]?.querySelectorAll('td')[3]?.textContent).toBe('0');
    expect(rows[2]?.querySelectorAll('td')[0]?.textContent).toBe('9007199254740997');
    expect(rows[2]?.querySelectorAll('td')[2]?.textContent).toBe('מצב לא ידוע');
    expect(rows[2]?.querySelectorAll('td')[3]?.textContent).toBe('לא ידוע');
    expect(element.textContent).toContain('אינו מועד רענון המטמון הישן');
    http.expectNone(request => request.method !== 'GET');
  });

  it('applies status filters exactly and never treats unknown as inactive', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    for (const item of items) {
      const status = item.active === null ? 'unknown' : item.active ? 'active' : 'inactive';
      submit(element, '', status);
      const request = http.expectOne(request => request.url === '/api/v1/internal-jobs');
      expect(request.request.params.get('status')).toBe(status);
      request.flush(response([item], '', status)); await fixture.whenStable();
      expect(element.querySelectorAll('tbody tr').length).toBe(1);
      expect(element.querySelector('tbody tr td')?.textContent).toBe(item.id);
    }
    submit(element, '', 'inactive');
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(response([unknown], '', 'inactive'));
    await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });

  it('normalizes ID/name search and supports valid empty combinations', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    submit(element, ' DEMO ', 'unknown');
    const request = http.expectOne(request => request.url === '/api/v1/internal-jobs');
    expect(request.request.params.get('search')).toBe(' DEMO ');
    request.flush(response([unknown], 'demo', 'unknown')); await fixture.whenStable();
    expect(element.querySelector('tbody tr td')?.textContent).toBe(unknown.id);
    submit(element, inactive.id, 'active');
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(response([], inactive.id, 'active'));
    await fixture.whenStable();
    expect(element.textContent).toContain('לא נמצאו תפקידי הדגמה בסינון זה');
    expect(element.querySelector('tbody')).toBeNull();
  });

  it('renders HTML-like names literally and manages detail and return focus', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const opener = element.querySelector<HTMLButtonElement>(`#internal-job-open-${unknown.id}`);
    opener?.click();
    http.expectOne(`/api/v1/internal-jobs/${unknown.id}`).flush({ ...marker, ...metadata, item: unknown });
    await fixture.whenStable();
    expect(element.querySelector('.job-card')?.textContent).toContain(unknown.name);
    expect(element.querySelector('.job-card b')).toBeNull();
    expect(element.ownerDocument.activeElement?.id).toBe('internal-job-detail-title');
    click(element, 'סגירת פרטי תפקיד'); await fixture.whenStable();
    expect(element.ownerDocument.activeElement).toBe(opener);
    expect(element.querySelector('.job-card')).toBeNull();
  });

  it('rejects wrong source/scope/context, duplicate IDs, malformed flags/groups and extra dispatch data', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    for (const payload of [
      { ...response(), sourceVersion: 'unverified-live-catalog' },
      { ...response(), unitId: 'foreign' },
      { ...response(), search: 'wrong' },
      { ...response(), status: 'active' },
      response([active, active]),
      { ...response(), items: [{ ...active, active: 1 }] },
      { ...response(), items: [{ ...active, active: undefined }] },
      { ...response(), items: [{ ...active, groupCode: 0 }] },
      { ...response(), items: [{ ...active, groupCode: undefined }] },
      { ...response(), items: [{ ...active, groupCode: '-1' }] },
      { ...response(), items: [{ ...active, id: Number(unknown.id) }] },
      { ...response(), items: [{ ...active, orgUnit: { ...unit, id: 'foreign' } }] },
      { ...response(), items: [{ ...active, managedDispatch: true }] },
    ]) {
      submit(element);
      http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(payload);
      await fixture.whenStable();
      expect(element.querySelector('tbody')).toBeNull();
      expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    }
  });

  it('cancels superseded list/detail and rejects overly long or invalid filters locally', async () => {
    const fixture = start(); const older = initialize(); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    submit(element);
    expect(older.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(response()); await fixture.whenStable();
    element.querySelector<HTMLButtonElement>(`#internal-job-open-${active.id}`)?.click();
    const detail = http.expectOne(`/api/v1/internal-jobs/${active.id}`);
    submit(element, '', 'unknown');
    expect(detail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(response([unknown], '', 'unknown'));
    await fixture.whenStable();
    submit(element, 'a'.repeat(81)); await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/internal-jobs');
    expect(element.ownerDocument.activeElement?.id).toBe('internal-job-search');
    const select = element.querySelector<HTMLSelectElement>('#internal-job-status');
    const input = element.querySelector<HTMLInputElement>('#internal-job-search');
    if (!select || !input) { throw new Error('Missing filters.'); }
    input.value = ''; input.dispatchEvent(new Event('input'));
    select.value = ''; select.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/internal-jobs');
    expect(element.ownerDocument.activeElement?.id).toBe('internal-job-status');
  });

  it('retains the list on wrong-detail/error data and retries without updates', async () => {
    const fixture = start(); initialize().flush(response()); await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#internal-job-open-${inactive.id}`)?.click();
    http.expectOne(`/api/v1/internal-jobs/${inactive.id}`).flush({ ...marker, ...metadata, item: active });
    await fixture.whenStable();
    expect(element.querySelector('.job-card')).toBeNull();
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    click(element, 'ניסיון נוסף לפרטי תפקיד');
    http.expectOne(`/api/v1/internal-jobs/${inactive.id}`).flush({ ...marker, title: 'פרטי קטלוג אינם זמינים.' }, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.textContent).toContain('פרטי קטלוג אינם זמינים');
    click(element, 'ניסיון נוסף לפרטי תפקיד');
    http.expectOne(`/api/v1/internal-jobs/${inactive.id}`).flush({ ...marker, ...metadata, item: inactive });
    await fixture.whenStable();
    expect(element.querySelector('.job-card')?.textContent).toContain('לא פעיל בהדגמה');
    expect(element.querySelector('.job-card dd:last-of-type')?.textContent).toBe('0');
    http.expectNone(request => request.method !== 'GET');
  });

  it('refuses disabled/unmarked capabilities or responses and retains filters through list failure/retry', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...marker, internalJobs: { read: { enabled: false } } });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/internal-jobs');
    const element: HTMLElement = fixture.nativeElement;
    click(element, 'ניסיון נוסף לתפקידים');
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/internal-jobs');
    click(element, 'ניסיון נוסף לתפקידים');
    initialize().flush({ ...response(), synthetic: false }); await fixture.whenStable();
    expect(element.querySelector('tbody')).toBeNull();
    submit(element, 'DEMO', 'unknown');
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('#internal-job-search')?.value).toBe('DEMO');
    expect(element.querySelector<HTMLSelectElement>('#internal-job-status')?.value).toBe('unknown');
    click(element, 'ניסיון נוסף לתפקידים');
    http.expectOne(request => request.url === '/api/v1/internal-jobs').flush(response([unknown], 'demo', 'unknown'));
    await fixture.whenStable();
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
  });
});
