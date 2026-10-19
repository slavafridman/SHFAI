import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { JsonPipe } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { SliceApi } from './api';
import { id, identity, displayTime, type IdentityResponseV1 } from './contract';
import { itemsQuery, itemsResponse, itemsProblem, type SelectedShiftItemsV1,
  type SelectedShiftItemV1, type SelectedShiftItemsRequestV1 } from './shift-items-contract';
import { WorkspaceShell } from './workspace-shell';
import { ListNavigation } from './list-navigation';
import { ViewHistory } from './view-history';
import { EmployeeName } from './employee-name';

@Component({
  selector: 'shf-shift-items',
  imports: [EmployeeName, WorkspaceShell, RouterLink, MatButtonModule, MatProgressBarModule, JsonPipe],
  templateUrl: './shift-items-page.html', styleUrl: './shift-items-page.scss',
})
export class ShiftItemsPage {
  private readonly api = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly navigation = inject(ListNavigation);
  readonly journey = inject(ViewHistory);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly result = signal<SelectedShiftItemsV1 | null>(null);
  readonly state = signal<'initial' | 'loading' | 'success' | 'empty' | 'error'>('initial');
  readonly message = signal('');
  readonly reference = signal('');
  readonly code = signal('');
  readonly denied = signal(false);
  request: SelectedShiftItemsRequestV1 | null = null;
  private generation = 0;
  private identityGeneration = 0;
  private alive = true;
  private work?: Subscription;
  private identityWork?: Subscription;
  private offsets: number[] = [];
  private pendingOffset = 0;
  private routeValid = false;
  readonly time = displayTime;
  constructor() {
    const saved = this.journey.saved<{ offset: number; offsets: number[] }>();
    this.pendingOffset = saved?.offset ?? 0; this.offsets = saved?.offsets ?? [];
    this.journey.attach(this.host.nativeElement, () => ({ offset: this.request?.offset ?? 0, offsets: this.offsets }));
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(takeUntilDestroyed()).subscribe(([params]) => {
      this.cancel();
      const employeeId = params.get('employeeId'), shiftDayId = params.get('shiftDayId');
      const routeUrl = this.router.currentNavigation()?.extractedUrl.toString() ?? this.router.url;
      const q = itemsQuery(routeUrl.split('?')[1]?.split('#')[0] ?? '');
      this.routeValid = !!q && id(employeeId) && id(shiftDayId, 10);
      this.request = this.routeValid ? { employeeId: employeeId!, shiftDayId: shiftDayId!, ...q! } : null;
      if (this.request && saved && !routeUrl.includes('?')) this.request.offset = this.pendingOffset;
      this.state.set('initial');
      if (!this.routeValid) this.fail('לא נבחרו עובד/ת ויום עבודה תקינים. יש לפתוח מתוך רשימת מקור.');
      else if (this.canRead()) this.load(this.request!.offset ?? 0);
      else if (this.identityState() === 'loading') {
        this.state.set('loading'); this.message.set('טוענים זהות והקשר…');
      }
    });
    this.recheckIdentity();
    setTimeout(() => {
      if (!this.alive) return;
      window.scrollTo(0, 0);
      this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGeneration++; this.cancel(); this.identityWork?.unsubscribe();
    });
  }
  canRead() {
    const caps = this.principal()?.principal.capabilities;
    return this.identityState() === 'ready' && !this.denied() &&
      !!caps?.includes('shift-items:read') && caps.includes('shift-day:read');
  }
  active(): 'list' | 'search' | 'schedule' {
    const origin = this.navigation.detailOrigin;
    return origin === 'my-shifts' ? 'schedule' : origin === 'shift-search' ? 'search' : 'list';
  }
  originLabel() {
    const parent = this.journey.parentPath();
    if (parent?.endsWith('/breaks-and-exceptions')) return 'הפסקות וחריגות חלקיות';
    if (parent?.startsWith('/employees/')) return 'פרטי משמרת';
    return parent?.startsWith('/my-shifts') ? 'משמרות העובד/ת' :
      parent === '/shift-search' ? 'חיפוש משמרות' : parent === '/current-shifts' ? 'משמרות נוכחיות' : 'משמרות נוכחיות — ללא רשימת מקור שמורה';
  }
  private cancel() { this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set(''); this.code.set(''); }
  recheckIdentity() {
    const offset = this.request?.offset ?? 0;
    this.cancel(); this.identityWork?.unsubscribe(); const gen = ++this.identityGeneration;
    this.principal.set(null); this.denied.set(false); this.identityState.set('loading'); this.identityError.set('');
    if (this.routeValid) { this.state.set('loading'); this.message.set('טוענים זהות והקשר…'); }
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGeneration) return;
        if (!identity(value)) { this.identityFailure(); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (!this.canRead()) this.fail('אין הרשאה לתצוגה זו. נדרשות הרשאות פרטי משמרת ורשומות חלקיות.');
        else if (this.request && this.routeValid) this.load(offset);
        else this.fail('לא נבחרו עובד/ת ויום עבודה תקינים. יש לפתוח מתוך רשימת מקור.');
      },
      error: () => { if (this.alive && gen === this.identityGeneration) this.identityFailure(); },
    });
  }
  private identityFailure() {
    this.cancel(); this.principal.set(null); this.identityState.set('error');
    this.identityError.set('נדרש אימות. לא ניתן לאמת את הזהות; אין הנחת מנהל מערכת.');
    this.fail(this.identityError());
  }
  reload() {
    if (!this.canRead() || !this.request || this.state() === 'loading') return;
    this.offsets = []; this.load(0);
  }
  previous() {
    if (!this.canRead() || this.state() === 'loading' || !this.request || !(this.request.offset ?? 0)) return;
    this.load(this.offsets.pop() ?? Math.max(0, (this.request.offset ?? 0) - (this.request.limit ?? 25)), 'items-previous');
  }
  next() {
    const p = this.result()?.page;
    if (!this.canRead() || this.state() === 'loading' || p?.nextOffset == null) return;
    this.offsets.push(p.offset); this.load(p.nextOffset, 'items-next');
  }
  private load(offset: number, focus?: 'items-next' | 'items-previous') {
    if (!this.request || !this.canRead()) return;
    this.request = { ...this.request, offset };
    this.cancel(); const gen = this.generation, identityGen = this.identityGeneration, request = { ...this.request };
    this.state.set('loading'); this.message.set('טוענים את ההקשר והרשומות…');
    const current = () => this.alive && gen === this.generation && identityGen === this.identityGeneration && this.canRead();
    this.work = this.api.shiftItems(request).subscribe({
      next: value => {
        if (!current()) return;
        if (!itemsResponse(value, request, this.principal()!.dataSource)) {
          this.fail('התקבלה תשובה לא תקינה או הקשר לא תואם. לא הוצגו נתונים.'); return;
        }
        this.result.set(value); this.state.set(value.items.length ? 'success' : 'empty');
        this.message.set(value.items.length ? `נטענו ${value.items.length} רשומות בעמוד` : 'לא נמצאו רשומות חלקיות מקושרות');
        setTimeout(() => {
          if (!current()) return;
          if (this.journey.restore(this.host.nativeElement)) return;
          if (focus) this.host.nativeElement.querySelector<HTMLElement>(`#${focus}`)?.focus({ preventScroll: true });
        });
      },
      error: (error: unknown) => {
        if (!current()) return;
        if (!(error instanceof HttpErrorResponse) || error.status === 0) { this.fail('השירות אינו זמין או פג הזמן. אפשר לנסות שוב ידנית.'); return; }
        if (!itemsProblem(error.error, error.status)) { this.fail('התקבלה תשובת שגיאה לא תקינה. לא הוצגו נתונים.'); return; }
        const p = error.error;
        if (p.status === 401) { this.identityFailure(); return; }
        if (p.status === 403) this.denied.set(true);
        this.reference.set(p.requestId); this.code.set(p.code);
        this.fail(p.status === 400 ? 'הבקשה אינה תקינה. יש לפתוח מחדש מתוך רשימת המקור.' :
          p.status === 403 ? 'אין הרשאה לתצוגה זו.' :
          p.status === 404 ? 'המשמרת אינה זמינה בהקשר שנבחר.' :
          p.status === 503 ? 'השירות אינו זמין או פג הזמן. אפשר לנסות שוב ידנית.' :
          'לא ניתן להציג נתונים עקב שגיאת מקור או הקשר לא חד־משמעי.');
      },
    });
  }
  private fail(message: string) { this.result.set(null); this.state.set('error'); this.message.set(message); }
  kind(item: SelectedShiftItemV1) { return item.kind === 'break' ? 'הפסקה' : item.kind === 'timeoff' ? 'היעדרות חלקית' : 'חריגה חלקית'; }
  back() { this.journey.back(); }
  openDetail(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    const row = this.result()?.shiftDay;
    if (!row) return;
    const target = `/employees/${row.employeeId}/shift-days/${row.shiftDayId}`;
    // An existing detail opener is a return, not another entry in a cycle.
    if (this.journey.backIf(target)) return;
    void this.router.navigateByUrl(target);
  }
}
