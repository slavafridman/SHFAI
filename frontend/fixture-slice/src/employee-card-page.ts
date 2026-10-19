import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription, combineLatest } from 'rxjs';
import { SliceApi } from './api';
import { id, identity, type IdentityResponseV1 } from './contract';
import { employeeCard, employeeCardProblem, projectEmployeeCard, type EmployeeOperationalCardV1 } from './employee-card-contract';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';

@Component({
  selector: 'shf-employee-card',
  imports: [WorkspaceShell, RouterLink, MatButtonModule, MatProgressBarModule],
  templateUrl: './employee-card-page.html', styleUrl: './employee-card-page.scss',
})
export class EmployeeCardPage {
  private readonly api = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly journey = inject(ViewHistory);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly result = signal<EmployeeOperationalCardV1 | null>(null);
  readonly state = signal<'selection' | 'loading' | 'success' | 'error'>('selection');
  readonly message = signal('לא נבחר עובד/ת. יש לפתוח כרטיס מתוך רשימת מקור.');
  readonly reference = signal('');
  readonly denied = signal(false);
  private employeeId: string | null = null;
  private routeValid = false;
  private generation = 0;
  private identityGeneration = 0;
  private alive = true;
  private work?: Subscription;
  private identityWork?: Subscription;

  constructor() {
    this.journey.attach(this.host.nativeElement);
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(takeUntilDestroyed()).subscribe(([params, query]) => {
      this.cancel();
      this.employeeId = params.get('employeeId');
      const url = this.router.currentNavigation()?.extractedUrl.toString() ?? this.router.url;
      this.routeValid = id(this.employeeId) && query.keys.length === 0 && !url.includes('?');
      if (!this.employeeId) {
        this.state.set('selection'); this.message.set('לא נבחר עובד/ת. יש לפתוח כרטיס מתוך רשימת מקור.');
      } else if (!this.routeValid) this.fail('הבקשה אינה תקינה. יש לפתוח כרטיס מתוך רשימת מקור.');
      else if (this.canRead()) this.load();
      else if (this.identityState() === 'loading') {
        this.state.set('loading'); this.message.set('טוענים כרטיס עובד/ת…');
      } else this.fail('אין הרשאה לכרטיס עובד/ת.');
    });
    this.recheckIdentity();
    setTimeout(() => {
      if (!this.alive || this.journey.restore(this.host.nativeElement)) return;
      window.scrollTo(0, 0);
      this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGeneration++; this.cancel(); this.identityWork?.unsubscribe();
    });
  }
  canRead() {
    const p = this.principal()?.principal;
    return this.identityState() === 'ready' && !this.denied() && !!p?.capabilities.includes('employee:read') &&
      (p.synthetic || (p.employeeId !== null && p.employeeId === this.employeeId));
  }
  backLabel() {
    const path = this.journey.parentPath();
    return path?.endsWith('/breaks-and-exceptions') ? 'חזרה להפסקות וחריגות חלקיות' :
      path?.includes('/shift-days/') ? 'חזרה לפרטי משמרת' :
      path?.startsWith('/my-shifts') ? 'חזרה למשמרות העובד/ת' :
      path === '/attendance' ? 'חזרה לבירור נוכחות' :
      path === '/shift-search' ? 'חזרה לחיפוש משמרות' :
      path === '/current-shifts' ? 'חזרה למשמרות נוכחיות' : 'משמרות נוכחיות — ללא רשימת מקור שמורה';
  }
  private cancel() {
    this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set('');
  }
  recheckIdentity() {
    this.cancel(); this.identityWork?.unsubscribe(); const epoch = ++this.identityGeneration;
    this.principal.set(null); this.denied.set(false); this.identityState.set('loading'); this.identityError.set('');
    if (this.routeValid) { this.state.set('loading'); this.message.set('טוענים כרטיס עובד/ת…'); }
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || epoch !== this.identityGeneration) return;
        if (!identity(value)) { this.identityFailure(); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (!this.employeeId) return;
        if (!this.routeValid) this.fail('הבקשה אינה תקינה. יש לפתוח כרטיס מתוך רשימת מקור.');
        else if (!this.canRead()) this.fail('אין הרשאה לכרטיס עובד/ת.');
        else this.load();
      },
      error: () => { if (this.alive && epoch === this.identityGeneration) this.identityFailure(); },
    });
  }
  private identityFailure() {
    this.cancel(); this.principal.set(null); this.identityState.set('error');
    this.identityError.set('אין זהות תקפה. לא ניתן לאמת את הזהות; אין הנחת מנהל מערכת.');
    this.fail(this.identityError());
  }
  reload() { if (this.state() !== 'loading' && this.canRead() && this.routeValid) this.load(); }
  private load() {
    if (!this.employeeId || !this.routeValid || !this.canRead()) return;
    this.cancel();
    const generation = this.generation, epoch = this.identityGeneration, selected = this.employeeId;
    const actor = this.principal()!;
    const current = () => this.alive && generation === this.generation && epoch === this.identityGeneration &&
      selected === this.employeeId && this.principal() === actor && this.canRead();
    this.state.set('loading'); this.message.set('טוענים כרטיס עובד/ת…');
    this.work = this.api.employeeCard(selected).subscribe({
      next: value => {
        if (!current()) return;
        if (!employeeCard(value, selected, actor)) {
          this.fail('לא ניתן להציג כרטיס עקבי. התקבלה תשובה לא תקינה או הקשר לא תואם.'); return;
        }
        this.result.set(projectEmployeeCard(value)); this.state.set('success'); this.message.set('כרטיס עובד/ת נטען.');
        setTimeout(() => { if (current()) this.journey.restore(this.host.nativeElement); });
      },
      error: (error: HttpErrorResponse) => {
        if (!current()) return;
        const valid = employeeCardProblem(error.error, error.status);
        const code = valid ? error.error.code : '';
        if (valid) this.reference.set(error.error.requestId);
        if (error.status === 401) {
          this.cancel(); this.principal.set(null); this.identityState.set('error');
          this.identityError.set('אין זהות תקפה. יש לבדוק זהות מחדש.');
        }
        if (error.status === 403) this.denied.set(true);
        this.fail(error.status === 401 ? 'אין זהות תקפה. יש לבדוק זהות מחדש.' :
          error.status === 403 ? 'אין הרשאה לכרטיס עובד/ת.' :
          error.status === 404 ? 'הכרטיס אינו זמין.' :
          error.status === 400 ? 'הבקשה אינה תקינה.' :
          error.status === 503 || error.status === 0
            ? (code === 'DEPENDENCY_TIMEOUT' ? 'פג זמן ההמתנה. אפשר לנסות שוב.' : 'השירות אינו זמין כעת. אפשר לנסות שוב.')
            : 'לא ניתן להציג כרטיס עקבי. אפשר לנסות שוב.');
      },
    });
  }
  private fail(message: string) { this.result.set(null); this.state.set('error'); this.message.set(message); }
}
