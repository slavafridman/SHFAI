import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Staffing } from './staffing';
import type { DemoStaffingPreview, DemoStaffingRequest } from './staffing-api';

const marker = { mode: 'stub', synthetic: true, authenticated: false };
const metadata = { clockLocal: '2026-10-13T08:00:00', fetchedAt: '2026-10-14T08:00:00Z', businessTimeZone: 'Asia/Jerusalem' };
const capability = { ...marker, staffing: { read: { enabled: true }, preview: { enabled: true } } };
const source: DemoStaffingRequest = {
  id: '93000001', kind: 'reinforcement', unitId: 'synthetic-team-a', title: 'תגבור הדגמה',
  startLocal: '2026-10-16T08:00:00', endLocal: '2026-10-16T16:00:00',
  requested: 3, approved: 1, remaining: 2, deadlineLocal: '2026-10-15T18:00:00',
  deadlineState: 'open', freshness: 'current', note: null,
};
const candidates = [
  { id: 'staff-candidate-1', employeeId: '00000002', employeeName: 'מועמד הדגמה', freshness: 'current', asOfLocal: metadata.clockLocal, note: null },
  { id: 'staff-candidate-2', employeeId: '00000003', employeeName: 'מועמד ישן', freshness: 'stale', asOfLocal: '2026-10-12T08:00:00', note: null },
];
function result(outcome: DemoStaffingPreview['outcome'] = 'eligible-under-demo-policy', candidateId = 'staff-candidate-1'): DemoStaffingPreview {
  return {
    previewOnly: true, saved: false, assigned: false, approved: false, policyVersion: 'synthetic-staffing-policy-1',
    requestId: source.id, candidateId, outcome,
    blockers: outcome === 'blocked' ? [{ code: 'CAPACITY_FULL', message: 'לא נותר מקום בדוגמה.' }] : [],
    unknowns: outcome === 'unknown' ? [{ code: 'STALE_CONTEXT', message: 'המועמד דורש בדיקה מחדש.' }] : [],
    capacityBefore: { requested: 3, approved: 1, remaining: 2 },
    capacityIfApplied: outcome === 'eligible-under-demo-policy' ? { requested: 3, approved: 2, remaining: 1 } : null,
    warnings: ['חישוב בלבד שלא נשמר.'],
  };
}

describe('Pure staffing eligibility/capacity previews', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Staffing], providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  async function start(previewAvailable = true) {
    const fixture = TestBed.createComponent(Staffing);
    fixture.detectChanges();
    http.expectOne('/api/v1/me/capabilities').flush({
      ...capability, staffing: { ...capability.staffing, preview: { enabled: previewAvailable } },
    });
    http.expectOne(request => request.url === '/api/v1/staffing-requests')
      .flush({ ...marker, ...metadata, items: [source], nextCursor: null });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('#staffing-93000001')?.click();
    http.expectOne('/api/v1/staffing-requests/93000001').flush({ ...marker, ...metadata, item: source });
    await fixture.whenStable();
    const button = [...element.querySelectorAll<HTMLButtonElement>('.staffing-detail button')]
      .find(item => item.textContent?.trim() === 'הצגת מועמדי הבקשה לדוגמה');
    button?.click();
    http.expectOne(request => request.url.endsWith('/candidates'))
      .flush({ ...marker, ...metadata, requestId: source.id, items: candidates, nextCursor: null });
    await fixture.whenStable();
    return { fixture, element };
  }
  function click(element: HTMLElement, id = 'staff-candidate-1') {
    element.querySelector<HTMLButtonElement>(`#staffing-preview-${id}`)?.click();
  }
  function flush(item = result()) {
    const request = http.expectOne('/api/v1/staffing-requests/93000001/eligibility-previews');
    request.flush({ ...marker, ...metadata, item });
    return request;
  }

  it('sends only candidate ID and shows conditional capacity without changing the request counters', async () => {
    const { fixture, element } = await start();
    const before = element.querySelector('tbody')?.textContent;
    click(element);
    const request = flush();
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ candidateId: 'staff-candidate-1' });
    await fixture.whenStable();
    expect(element.querySelector('.staffing-preview')?.textContent).toContain('נותר היפותטית 1');
    expect(element.querySelector('.staffing-preview')?.textContent).toContain('לא נשמר, לא שויך ולא אושר');
    expect(element.querySelector('tbody')?.textContent).toBe(before);
    http.expectNone(request => /assignments|approvals|applications/.test(request.url));
  });

  it('distinguishes blocked and unknown without showing speculative capacity', async () => {
    const { fixture, element } = await start();
    for (const outcome of ['blocked', 'unknown'] as const) {
      click(element);
      flush(result(outcome));
      await fixture.whenStable();
      expect(element.querySelector('.staffing-preview')?.textContent).toContain('לא חושבה קיבולת עתידית');
      expect(element.querySelector('.staffing-preview')?.textContent).not.toContain('נותר היפותטית');
    }
  });

  it('rejects assigned/approved/saved or wrong arithmetic results', async () => {
    const { fixture, element } = await start();
    for (const changes of [
      { assigned: true }, { approved: true }, { saved: true },
      { capacityIfApplied: { requested: 3, approved: 3, remaining: 0 } },
    ]) {
      click(element);
      http.expectOne(request => request.method === 'POST').flush({ ...marker, ...metadata, item: { ...result(), ...changes } });
      await fixture.whenStable();
      expect(element.querySelector('.staffing-preview')).toBeNull();
      expect(element.textContent).toContain('תגובת ההדגמה אינה תקינה');
    }
  });

  it('rejects wrong candidate/request or changed before snapshot and retains the valid card', async () => {
    const { fixture, element } = await start();
    for (const changes of [
      { requestId: '93000006' }, { candidateId: 'staff-candidate-4' },
      { capacityBefore: { requested: 4, approved: 2, remaining: 2 } },
    ]) {
      click(element);
      http.expectOne(request => request.method === 'POST').flush({ ...marker, ...metadata, item: { ...result(), ...changes } });
      await fixture.whenStable();
      expect(element.querySelector('.staffing-preview')).toBeNull();
      expect(element.querySelector('.staffing-detail')).not.toBeNull();
    }
  });

  it('cancels old candidate previews and closes results without removing the read-only candidate list', async () => {
    const { fixture, element } = await start();
    click(element);
    const older = http.expectOne(request => request.method === 'POST');
    click(element, 'staff-candidate-2');
    expect(older.cancelled).toBe(true);
    flush(result('unknown', 'staff-candidate-2'));
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('.staffing-preview button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.staffing-preview')).toBeNull();
    expect(element.querySelectorAll('.staffing-detail li').length).toBe(2);
  });

  it('keeps preview unavailable while read data still works when capability is not enabled', async () => {
    const { element } = await start(false);
    expect(element.querySelector<HTMLButtonElement>('#staffing-preview-staff-candidate-1')?.disabled).toBe(true);
    expect(element.textContent).toContain('תצוגה מקדימה אינה זמינה');
    expect(element.querySelector('.staffing-detail')).not.toBeNull();
    http.expectNone(request => request.method === 'POST');
  });

  it('retains detail/candidates on a calculation failure and cancels pending preview when closing the request', async () => {
    const { fixture, element } = await start();
    click(element);
    http.expectOne(request => request.method === 'POST').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(element.querySelector('.staffing-preview')).toBeNull();
    expect(element.querySelectorAll('.staffing-detail li').length).toBe(2);
    expect(element.textContent).toContain('לא ניתן לטעון');
    click(element);
    const pending = http.expectOne(request => request.method === 'POST');
    element.querySelector<HTMLButtonElement>('.staffing-close')?.click();
    expect(pending.cancelled).toBe(true);
    await fixture.whenStable();
    expect(element.querySelector('.staffing-detail')).toBeNull();
  });
});
