import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PersonalMessages } from './personal-messages';
import type { PersonalMessage } from './messages-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const capability = { ...marker, personalMessages: { read: { enabled: true } } };
const sample: PersonalMessage = {
  id: '8007199254740993', createdLocal: '2026-10-17T09:00:00',
  subject: 'הודעת הדגמה', text: '<img src="synthetic-invalid" onerror="alert(1)">',
  note: null, isRead: false, type: 'OFFER_REPLACE',
};
function envelope(items: readonly PersonalMessage[] = [sample]) {
  return { ...marker, items, nextCursor: null, fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
}

describe('Read-only personal messages demo', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalMessages], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function start() {
    const fixture = TestBed.createComponent(PersonalMessages);
    fixture.detectChanges();
    return fixture;
  }
  function initialize() {
    http.expectOne('/api/v1/me/capabilities').flush(capability);
    return http.expectOne(request => request.url === '/api/v1/me/messages');
  }

  it('gates list reads on a synthetic capability and only uses GET requests', async () => {
    const fixture = start();
    http.expectNone(request => request.url === '/api/v1/me/messages');
    const request = initialize();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('all');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('הצגת הודעה אינה מסמנת');
    expect(element.textContent).toContain('טרם נקראה בנתוני ההדגמה');
    expect(element.querySelectorAll('li').length).toBe(1);
  });

  it('rejects non-synthetic or denied capability without requesting messages', async () => {
    const fixture = start();
    http.expectOne('/api/v1/me/capabilities').flush({ ...capability, synthetic: false });
    await fixture.whenStable();
    http.expectNone(request => request.url === '/api/v1/me/messages');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('אינה מסומנת כנתונים סינתטיים');
    expect(element.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('renders message content strictly as text and preserves unread state on detail open/close', async () => {
    const fixture = start();
    initialize().flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#message-open-${sample.id}`)?.click();
    const request = http.expectOne(`/api/v1/me/messages/${sample.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ ...marker, item: sample, fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem' });
    await fixture.whenStable();
    expect(element.querySelector('.message-text')?.textContent).toBe(sample.text);
    expect(element.querySelector('.message-detail img')).toBeNull();
    expect(element.querySelector('.message-detail')?.textContent).toContain('מצב הקריאה לא השתנה');
    element.querySelector<HTMLButtonElement>('.message-detail button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.message-detail')).toBeNull();
    expect(element.textContent).toContain('טרם נקראה בנתוני ההדגמה');
    http.expectNone(request => request.method !== 'GET');
  });

  it('shows unknown read status distinctly and preserves the selected filter after failure', async () => {
    const fixture = start();
    initialize().flush(envelope([{ ...sample, isRead: null }]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('מצב קריאה לא ידוע');
    const select = element.querySelector<HTMLSelectElement>('select');
    if (!select) { throw new Error('Missing message filter.'); }
    select.value = 'unknown';
    select.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    const request = http.expectOne(request => request.url === '/api/v1/me/messages');
    expect(request.request.params.get('status')).toBe('unknown');
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(select.value).toBe('unknown');
    expect(element.textContent).toContain('לא ניתן לטעון');
    expect(element.querySelector('li')).toBeNull();
  });

  it('distinguishes a successful empty list from a malformed or unlabelled response', async () => {
    const fixture = start();
    initialize().flush(envelope([]));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('לא נמצאו הודעות');
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    http.expectOne(request => request.url === '/api/v1/me/messages').flush({ ...envelope(), synthetic: false });
    await fixture.whenStable();
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    expect(element.textContent).not.toContain('לא נמצאו הודעות');
    expect(element.querySelector('li')).toBeNull();
  });

  it('cancels stale list and detail requests on refresh', async () => {
    const fixture = start();
    const older = initialize();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(older.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/me/messages').flush(envelope());
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>(`#message-open-${sample.id}`)?.click();
    const detail = http.expectOne(`/api/v1/me/messages/${sample.id}`);
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(detail.cancelled).toBe(true);
    http.expectOne(request => request.url === '/api/v1/me/messages').flush(envelope([]));
    await fixture.whenStable();
    expect(element.querySelector('.message-detail')).toBeNull();
  });

  it('rejects mismatched detail identity without replacing the valid list', async () => {
    const fixture = start();
    initialize().flush(envelope());
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>(`#message-open-${sample.id}`)?.click();
    http.expectOne(`/api/v1/me/messages/${sample.id}`).flush({
      ...marker, item: { ...sample, id: '8007199254740996' },
      fetchedAt: '2026-10-13T12:00:00Z', businessTimeZone: 'Asia/Jerusalem',
    });
    await fixture.whenStable();
    expect(element.querySelector('.message-detail')).toBeNull();
    expect(element.querySelectorAll('li').length).toBe(1);
    expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
  });
});
