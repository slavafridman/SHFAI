import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkspaceShell } from './workspace-shell';
import { fixtureIdentity } from './test-fixtures';

describe('shared RTL workspace shell (DOM only; native focus trap separately in browser)', () => {
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
    expect(dom.querySelectorAll('.sidebar [aria-disabled="true"]')).toHaveLength(2);
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
});
