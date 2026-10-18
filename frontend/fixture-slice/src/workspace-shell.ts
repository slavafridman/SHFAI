import {
  afterNextRender, Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { RouterLink } from '@angular/router';
import type { IdentityResponseV1 } from './contract';

/** Presentation only: no session defaults, resource context or navigation claims. */
@Component({
  selector: 'shf-workspace-shell',
  imports: [MatButtonModule, RouterLink, CdkTrapFocus],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss',
})
export class WorkspaceShell {
  readonly principal = input<IdentityResponseV1 | null>(null);
  readonly identityState = input<'loading' | 'ready' | 'error'>('loading');
  readonly identityMessage = input('');
  readonly active = input<'detail' | 'list' | 'search' | 'schedule'>('detail');
  readonly recheck = output<void>();
  readonly menu = viewChild.required<ElementRef<HTMLDialogElement>>('menu');
  readonly opener = viewChild.required<unknown, ElementRef<HTMLButtonElement>>('opener', { read: ElementRef });
  readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  readonly menuOpen = signal(false);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof matchMedia === 'undefined') return;
      const desktop = matchMedia('(min-width: 761px)');
      const resize = () => {
        if (desktop.matches && this.menuOpen()) {
          this.closeMenu(false);
          this.focusMain();
        }
      };
      desktop.addEventListener('change', resize);
      this.destroy.onDestroy(() => desktop.removeEventListener('change', resize));
    });
  }
  focusMain(): void {
    (this.main().nativeElement.querySelector<HTMLElement>('h1') ??
      this.main().nativeElement).focus({ preventScroll: true });
  }
  openMenu(): void {
    if (this.menuOpen()) return;
    this.menu().nativeElement.showModal();
    this.menuOpen.set(true);
  }
  closeMenu(restore = true): void {
    this.menu().nativeElement.close();
    this.menuOpen.set(false);
    if (restore) this.opener().nativeElement.focus({ preventScroll: true });
  }
}
