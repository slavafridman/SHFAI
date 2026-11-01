import { describe, expect, it, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationStart, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { WorkspaceShell } from './workspace-shell';
import { fixtureIdentity } from './test-fixtures';

@Component({
  imports: [WorkspaceShell],
  template: '<shf-workspace-shell><h1 tabindex="-1">משמרות נוכחיות</h1></shf-workspace-shell>',
})
class SkipLinkPage {}

describe('shared RTL workspace shell (DOM only; native focus trap separately in browser)', () => {
  for (const url of ['/current-shifts', '/employees/TEST-E1/shift-days/TEST-D1?origin=qa&filter=a%2Fb']) {
    it(`skip anchor cancels native navigation and preserves route/query/view at ${url}`, async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([
        { path: 'current-shifts', component: SkipLinkPage },
        { path: 'employees/:employeeId/shift-days/:shiftDayId', component: SkipLinkPage },
      ])] });
      const harness = await RouterTestingHarness.create();
      const page = await harness.navigateByUrl(url, SkipLinkPage);
      const dom = harness.routeNativeElement!;
      const skip = dom.querySelector<HTMLAnchorElement>('a.skip')!;
      const heading = dom.querySelector<HTMLElement>('main h1')!;
      const router = TestBed.inject(Router);
      const location = TestBed.inject(Location);
      const before = [router.url, location.path(true), history.length, structuredClone(history.state)];
      const starts: NavigationStart[] = [];
      const subscription = router.events.subscribe(event => {
        if (event instanceof NavigationStart) starts.push(event);
      });
      expect(skip.tagName).toBe('A');
      expect(skip.getAttribute('href')).toBe('#main');
      expect(skip.textContent).toBe('דילוג לתוכן הראשי');
      expect(dom.querySelector(skip.getAttribute('href')!)).toBe(dom.querySelector('main'));
      skip.focus();
      // jsdom cannot synthesize a trusted Enter. Dispatch the native click that
      // Enter produces; the deployed Chrome checker covers trusted keyboard input.
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(skip.dispatchEvent(click)).toBe(false);
      expect(click.defaultPrevented).toBe(true);
      await harness.fixture.whenStable();
      expect(document.activeElement).toBe(heading);
      expect(heading.getAttribute('tabindex')).toBe('-1');
      expect([router.url, location.path(true), history.length, history.state]).toEqual(before);
      expect(starts).toHaveLength(0);
      expect(harness.routeDebugElement!.componentInstance).toBe(page);
      subscription.unsubscribe();
      harness.fixture.destroy();
    });
  }
  it('skip anchor focuses main safely when no heading is projected', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkspaceShell);
    fixture.detectChanges();
    const dom = fixture.nativeElement as HTMLElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    dom.querySelector<HTMLAnchorElement>('a.skip')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dom.querySelector('main'));
    expect(dom.querySelector('main')!.getAttribute('tabindex')).toBe('-1');
    fixture.destroy();
  });
  it('honest navigation, safe menu Escape and exact trigger restoration', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkspaceShell);
    fixture.componentRef.setInput('principal', fixtureIdentity());
    fixture.componentRef.setInput('identityState', 'ready');
    fixture.detectChanges();
    const dom = fixture.nativeElement as HTMLElement;
    const dialog = dom.querySelector<HTMLDialogElement>('dialog')!;
    // jsdom has no modal implementation: model only native open/close, not a trap.
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    const opener = dom.querySelector<HTMLButtonElement>('#menu-open')!;
    fixture.componentInstance.openMenu(); fixture.detectChanges();
    expect(dialog.open).toBe(true); expect(opener.getAttribute('aria-expanded')).toBe('true');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true })); fixture.detectChanges();
    expect(dialog.open).toBe(false); expect(document.activeElement).toBe(opener);
    expect(opener.getAttribute('aria-expanded')).toBe('false');
    expect(dom.querySelector('.sidebar a')?.getAttribute('href')).toBe('/current-shifts');
    expect(dom.querySelector('.sidebar a[href="/shift-search"]')).not.toBeNull();
    expect(dom.querySelectorAll('.sidebar [aria-disabled="true"]')).toHaveLength(0);
    expect(dom.querySelector('.sidebar a[href="/my-shifts"]')).not.toBeNull();
    expect(dom.textContent).toContain('לא בוצע אימות סיסמה אמיתית');
    fixture.destroy();
  });
  it('absent identity has no enabled actor links or Administrator fallback', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkspaceShell);
    fixture.componentRef.setInput('identityState', 'error'); fixture.detectChanges();
    const dom = fixture.nativeElement as HTMLElement;
    expect(dom.querySelector('.sidebar a')).toBeNull();
    expect(dom.textContent).toContain('אין הנחת מנהל מערכת');
    fixture.destroy();
  });
  it('queued native close cannot clear a rapid reopen; desktop resize closes and focuses H1', async () => {
    const media = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => media);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SkipLinkPage);
    try {
      fixture.detectChanges();
      await fixture.whenStable();
      const shell = fixture.debugElement.query(By.directive(WorkspaceShell)).componentInstance as WorkspaceShell;
      const dom = fixture.nativeElement as HTMLElement;
      const dialog = dom.querySelector<HTMLDialogElement>('dialog')!;
      dialog.showModal = () => { dialog.open = true; };
      dialog.close = () => { dialog.open = false; };
      shell.openMenu();
      shell.closeMenu();
      shell.openMenu();
      // Deliver the first close's queued notification AFTER the new native open.
      dialog.dispatchEvent(new Event('close'));
      fixture.detectChanges();
      expect(dialog.open).toBe(true);
      expect(shell.menuOpen()).toBe(true);
      expect(dom.querySelector('#menu-open')!.getAttribute('aria-expanded')).toBe('true');
      const trap = fixture.debugElement.query(By.directive(CdkTrapFocus)).injector.get(CdkTrapFocus);
      expect(trap.enabled).toBe(true);
      expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      media.matches = true;
      media.addEventListener.mock.calls[0][1]();
      fixture.detectChanges();
      expect(dialog.open).toBe(false);
      expect(shell.menuOpen()).toBe(false);
      expect(trap.enabled).toBe(false);
      expect(document.activeElement).toBe(dom.querySelector('main h1'));
      expect(document.activeElement).not.toBe(document.body);
    } finally {
      fixture.destroy();
      vi.unstubAllGlobals();
    }
  });
  it('ordinary native close still clears expanded state and CDK trap', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkspaceShell);
    fixture.detectChanges();
    const dom = fixture.nativeElement as HTMLElement;
    const dialog = dom.querySelector<HTMLDialogElement>('dialog')!;
    dialog.showModal = () => { dialog.open = true; };
    fixture.componentInstance.openMenu();
    fixture.detectChanges();
    dialog.open = false;
    dialog.dispatchEvent(new Event('close'));
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
    expect(dom.querySelector('#menu-open')!.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.debugElement.query(By.directive(CdkTrapFocus)).injector.get(CdkTrapFocus).enabled).toBe(false);
    fixture.destroy();
  });
});
