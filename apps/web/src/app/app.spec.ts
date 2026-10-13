import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders Hebrew landmarks and truthful disconnected states', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('תשתית הפרויקט');
    expect(element.textContent).toContain('אין חיבור למסד הנתונים');
    expect(element.textContent).toContain('לא זמין בשלב הנוכחי');
    expect(element.querySelector('main')?.getAttribute('aria-labelledby')).toBe('page-title');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
  });

  it('does not offer a working sign-in or business action', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-describedby')).toBe('identity-note');
    expect(element.querySelector('input, form, table')).toBeNull();
  });
});
