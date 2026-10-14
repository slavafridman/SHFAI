import { DeferBlockState, TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function failInitialization() {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/me').flush({}, { status: 503, statusText: 'Unavailable' });
    http.match('/api/v1/me/capabilities').forEach(request => {
      if (!request.cancelled) {
        request.flush({}, { status: 503, statusText: 'Unavailable' });
      }
    });
  }

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    expect(blocks.length).toBe(12);
    for (const block of blocks) { await block.render(DeferBlockState.Complete); }
    failInitialization();
  });

  it('renders Hebrew landmarks and truthful disconnected states', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    for (const block of blocks) { await block.render(DeferBlockState.Complete); }
    failInitialization();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('סביבת הדגמה');
    expect(element.textContent).toContain('אין חיבור למסד הנתונים');
    expect(element.textContent).toContain('לא זמין בשלב הנוכחי');
    expect(element.querySelector('main')?.getAttribute('aria-labelledby')).toBe('page-title');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
  });

  it('does not offer a working sign-in or business action', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    for (const block of blocks) { await block.render(DeferBlockState.Complete); }
    failInitialization();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector<HTMLButtonElement>('button[aria-describedby="identity-note"]');
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-describedby')).toBe('identity-note');
    expect(element.textContent).toContain('נתונים סינתטיים');
  });
});
