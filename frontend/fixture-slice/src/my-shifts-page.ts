import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { id, identity, displayTime, type IdentityResponseV1 } from './contract';
import { scheduleContext, scheduleList, scheduleProblem, validRange,
  type MyShiftsContextRequestV1, type MyShiftsContextV1, type MyShiftsListV1,
  type MyShiftsRequestV1, type MyShiftRowV1 } from './my-shifts-contract';
import { CivilDateAdapter, CIVIL_FORMATS, dateFromWire, dateWire, calendarLabels } from './civil-date-adapter';
import { WorkspaceShell } from './workspace-shell';
import { ListNavigation } from './list-navigation';
import { ViewHistory } from './view-history';

@Component({
  selector: 'shf-my-shifts',
  imports: [WorkspaceShell, ReactiveFormsModule, RouterLink, MatDatepickerModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule],
  providers: [{ provide: DateAdapter, useClass: CivilDateAdapter }, { provide: MAT_DATE_FORMATS, useValue: CIVIL_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' }, { provide: MatDatepickerIntl, useFactory: calendarLabels }],
  templateUrl: './my-shifts-page.html', styleUrl: './my-shifts-page.scss',
})
export class MyShiftsPage {
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly adapter = inject<DateAdapter<Date>>(DateAdapter);
  readonly navigation = inject(ListNavigation);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly context = signal<MyShiftsContextV1 | null>(null);
  readonly result = signal<MyShiftsListV1 | null>(null);
  readonly state = signal<'loading' | 'success' | 'empty' | 'selection' | 'dirty' | 'error'>('loading');
  readonly message = signal('');
  readonly reference = signal('');
  readonly denied = signal(false);
  readonly form = new FormGroup({
    dateFrom: new FormControl<Date | null>(null, Validators.required),
    dateTo: new FormControl<Date | null>(null, Validators.required),
  });
  readonly minDate = dateFromWire('0001-01-01');
  readonly maxDate = dateFromWire('9999-12-31');
  readonly time = (value: string | null) => displayTime(value).slice(0, 16);
  readonly precision = (value: string | null) => value === null ? 'לא זמין' : `תאריך ושעה בדיוק שניות: ${displayTime(value)}`;
  weekday(value: string) {
    return new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(dateFromWire(value.slice(0, 10)));
  }
  selector: MyShiftsContextRequestV1 = { mode: 'self' };
  private generation = 0;
  private identityGeneration = 0;
  private alive = true;
  private work?: Subscription;
  private identityWork?: Subscription;
  private lastRequest: MyShiftsRequestV1 | null = null;
  private saved: ListNavigation['schedule'] = null;
  private pendingOpener: string | null = null;
  private remember() {
    if (!this.context()?.actor.employee) return;
    const input = (name: string) => this.host.nativeElement.querySelector<HTMLInputElement>(`#schedule-${name}`)?.value ?? '';
    this.navigation.schedule = { path: this.path(), request: this.lastRequest,
      fromText: input('dateFrom'), toText: input('dateTo'), scroll: window.scrollY,
      tableScroll: this.host.nativeElement.querySelector<HTMLElement>('.table-wrap')?.scrollLeft ?? 0,
      opener: this.host.nativeElement.contains(document.activeElement) && document.activeElement?.id ? document.activeElement.id : 'schedule-results',
      technical: this.host.nativeElement.querySelector<HTMLDetailsElement>('#schedule-technical')?.open ?? false };
  }

  constructor() {
    this.journey.attach(this.host.nativeElement, () => {
      this.remember();
      if (this.pendingOpener && this.navigation.schedule) this.navigation.schedule.opener = this.pendingOpener;
      return null;
    });
    afterNextRender(() => this.focus('h1', true));
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.cancel(); this.lastRequest = null;
      for (const control of Object.values(this.form.controls)) {
        if (control.hasError('server') || control.hasError('range')) control.updateValueAndValidity({ emitEvent: false });
      }
      this.state.set('dirty'); this.message.set('התאריכים השתנו. יש להחיל מחדש להצגת משמרות.');
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.remember();
      this.cancel(); const employeeId = params.get('employeeId');
      this.selector = employeeId === null ? { mode: 'self' } : { mode: 'selected', employeeId };
      this.saved = this.navigation.schedule?.path === this.path() ? this.navigation.schedule : null;
      this.lastRequest = null; this.context.set(null);
      if (this.identityState() === 'ready') this.loadContext();
    });
    this.recheckIdentity();
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGeneration++; this.cancel(); this.identityWork?.unsubscribe();
    });
  }
  path(): string { return this.selector.mode === 'self' ? '/my-shifts' : `/my-shifts/selected/${this.selector.employeeId}`; }
  canRead(): boolean { return this.identityState() === 'ready' && !this.denied() &&
    !!this.principal()?.principal.capabilities.includes('my-shifts:read'); }
  upstream() {
    if (this.selector.mode !== 'selected') return null;
    const kind = this.navigation.scheduleUpstream;
    const source = kind === 'shift-search' ? this.navigation.searchOrigin : kind === 'current-shifts' ? this.navigation.origin : null;
    return source?.employeeId === this.selector.employeeId ? kind : null;
  }
  private cancel() { this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set(''); }
  private active(gen: number) { return this.alive && gen === this.generation && this.canRead(); }
  recheckIdentity() {
    if (this.context()?.actor.employee) { this.remember(); this.saved = this.navigation.schedule; }
    this.cancel(); this.context.set(null); this.form.disable({ emitEvent: false });
    this.identityWork?.unsubscribe(); const gen = ++this.identityGeneration;
    this.principal.set(null); this.denied.set(false); this.identityError.set(''); this.identityState.set('loading');
    this.state.set('loading'); this.message.set('טוען זהות…');
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGeneration) return;
        if (!identity(value)) { this.identityFailure(); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (this.canRead()) this.loadContext(); else this.fail('אין הרשאה להצגת משמרות העובד/ת.');
      },
      error: () => { if (this.alive && gen === this.identityGeneration) this.identityFailure(); },
    });
  }
  private identityFailure() {
    this.cancel(); this.context.set(null); this.principal.set(null); this.identityState.set('error');
    this.identityError.set('לא ניתן לאמת את הזהות. אין הנחת מנהל מערכת.');
    this.form.disable({ emitEvent: false }); this.fail(this.identityError());
  }
  loadContext() {
    if (!this.canRead()) return;
    this.cancel(); this.lastRequest = null; this.context.set(null); this.form.disable({ emitEvent: false });
    if (this.selector.mode === 'selected' && !id(this.selector.employeeId)) {
      this.fail('הקשר עובד/ת לא תקין. יש לבחור מתוך תוצאות מורשות.'); return;
    }
    const gen = this.generation, selector = this.selector;
    this.state.set('loading'); this.message.set('טוען הקשר עובד/ת…');
    this.work = this.api.myShiftsContext(selector).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!scheduleContext(value, selector, this.principal()!)) { this.fail('התקבלה תשובה שאינה תואמת להקשר. לא הוצגו נתונים.'); return; }
        this.context.set(value);
        if (value.selectionRequired) {
          this.state.set('selection'); this.message.set(value.canSelectEmployee ?
            'יש לבחור עובד/ת מתוצאות חיפוש המשמרות או מהמשמרות הנוכחיות.' : 'לא קיים קישור עובד/ת מאומת לזהות. יש לפנות לתמיכה.');
          return;
        }
        this.form.enable({ emitEvent: false });
        this.form.reset({ dateFrom: dateFromWire(value.defaults.dateFrom), dateTo: dateFromWire(value.defaults.dateTo) }, { emitEvent: false });
        if (this.saved) {
          this.form.setValue({ dateFrom: this.adapter.parse(this.saved.fromText, 'civil-date'), dateTo: this.adapter.parse(this.saved.toText, 'civil-date') }, { emitEvent: false });
          this.defer(() => {
            for (const [key, text] of [['dateFrom', this.saved!.fromText], ['dateTo', this.saved!.toText]]) {
              const input = this.host.nativeElement.querySelector<HTMLInputElement>(`#schedule-${key}`);
              if (input) input.value = text;
            }
          }, gen);
          if (this.saved.request) { this.fetch(this.saved.request, true); return; }
          this.state.set('dirty'); this.message.set('התאריכים נשמרו. יש להחיל מחדש.');
          this.defer(() => this.journey.restore(this.host.nativeElement), gen); return;
        }
        this.apply(false);
      },
      error: error => { if (this.active(gen)) this.handleError(error); },
    });
  }
  apply(focus = true) {
    if (!this.canRead() || !this.context()?.actor.employee || this.state() === 'loading' && this.lastRequest) return;
    this.cancel();
    const { dateFrom: from, dateTo: to } = this.form.getRawValue();
    if (from && to && !this.form.invalid && !validRange(dateWire(from), dateWire(to))) this.form.controls.dateTo.setErrors({ range: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched(); this.state.set('dirty'); this.message.set('יש לבדוק תאריכים: עד 31 ימים כולל שני הגבולות.');
      this.focus(this.form.controls.dateFrom.invalid ? '#schedule-dateFrom' : '#schedule-dateTo'); return;
    }
    this.fetch({ ...this.selector, dateFrom: dateWire(from!), dateTo: dateWire(to!), limit: 25, offset: 0, sort: 'effective-start-asc' }, false, focus);
  }
  page(offset: number) { if (this.lastRequest && offset >= 0 && offset <= 10000) this.fetch({ ...this.lastRequest, offset }); }
  retry() { if (this.context()?.actor.employee && this.lastRequest) this.fetch(this.lastRequest); else this.loadContext(); }
  private fetch(request: MyShiftsRequestV1, restore = false, focus = true) {
    this.cancel(); const gen = this.generation, ctx = this.context()!;
    this.lastRequest = request; this.state.set('loading'); this.message.set('טוען משמרות…');
    this.work = this.api.myShifts(request).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!scheduleList(value, request, ctx)) { this.fail('התקבלה תשובה שאינה תואמת לבקשה. לא הוצגו נתונים.'); return; }
        this.result.set(value); this.state.set(value.items.length ? 'success' : 'empty');
        this.message.set(value.items.length ? `נטענו ${value.items.length} משמרות בעמוד` : 'לא נמצאו התחלות משמרת בטווח שנבחר.');
        this.defer(() => {
          if (restore && this.saved) {
            const table = this.host.nativeElement.querySelector<HTMLElement>('.table-wrap');
            if (table) table.scrollLeft = this.saved.tableScroll;
            const technical = this.host.nativeElement.querySelector<HTMLDetailsElement>('#schedule-technical');
            if (technical) technical.open = this.saved.technical;
            this.focus(`#${this.saved.opener}`, true); window.scrollTo(0, this.saved.scroll);
          } else if (focus) this.focus('#schedule-results');
          this.journey.restore(this.host.nativeElement);
        }, gen);
      },
      error: error => { if (this.active(gen)) this.handleError(error); },
    });
  }
  private handleError(error: unknown) {
    let message = 'לא ניתן לטעון משמרות כעת. אפשר לנסות שוב.', field = '';
    if (error instanceof HttpErrorResponse && scheduleProblem(error.error, error.status)) {
      this.reference.set(error.error.requestId);
      if (error.status === 401) { this.identityFailure(); return; }
      if (error.status === 403) { this.denied.set(true); this.context.set(null); message = 'הבחירה אינה זמינה או שאין הרשאה. יש לבדוק זהות מחדש.'; }
      if (error.status === 409) { this.context.set(null); message = 'נדרש קישור עובד/ת מאומת או בחירה מורשית.'; }
      if (error.status === 400) {
        message = 'יש לבדוק את התאריכים. הערכים שהוזנו נשמרו.';
        for (const key of ['dateFrom', 'dateTo'] as const) if (error.error.invalidParameters?.some(p => p.name === key)) {
          this.form.controls[key].setErrors({ server: true }); field ||= key;
        }
        this.form.markAllAsTouched();
      }
      if (error.status === 500) message = 'לא ניתן להציג משמרות עקב שגיאת נתונים.';
    } else if (error instanceof HttpErrorResponse && error.status !== 0) message = 'התקבלה תשובת שגיאה לא תקינה. לא הוצגו נתונים.';
    this.fail(message, !field);
    if (field) this.defer(() => this.focus(`#schedule-${field}`), this.generation);
  }
  private fail(message: string, focus = true) {
    this.result.set(null); this.state.set('error'); this.message.set(message);
    if (!this.context()?.actor.employee || !this.canRead()) this.form.disable({ emitEvent: false });
    if (focus) this.defer(() => this.focus('#schedule-error'), this.generation);
  }
  private defer(fn: () => void, gen: number) { setTimeout(() => { if (this.alive && gen === this.generation) fn(); }); }
  private focus(selector: string, preventScroll = false) {
    (this.host.nativeElement.querySelector<HTMLElement>(selector) ?? this.host.nativeElement.querySelector<HTMLElement>('h1'))?.focus({ preventScroll });
  }
  canReadItems(): boolean { const caps = this.principal()?.principal.capabilities;
    return !!caps?.includes('shift-items:read') && caps.includes('shift-day:read'); }
  openItems(row: MyShiftRowV1, event: MouseEvent) { this.openDetail(row, event, true); }
  openDetail(row: MyShiftRowV1, event: MouseEvent, items = false) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    if (!this.result() || !this.principal()?.principal.capabilities.includes('shift-day:read')) return;
    if (items && !this.canReadItems()) return;
    this.remember();
    this.pendingOpener = `schedule-${items ? 'items' : 'detail'}-${row.shiftDayId}`;
    this.navigation.schedule!.opener = this.pendingOpener;
    const unit = this.context()!.actor.employee!.unit;
    this.navigation.scheduleDetail = { employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId,
      unit: { code: unit.code, label: unit.label, parentLabel: unit.moked.label },
      dataSource: this.principal()!.dataSource };
    this.navigation.detailOrigin = 'my-shifts'; this.navigation.returning = true;
    if (items) {
      void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId, 'breaks-and-exceptions']); return;
    }
    void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId], { state: { origin: 'my-shifts' } });
  }
  back() {
    const upstream = this.upstream(); if (!upstream) return;
    this.navigation.detailOrigin = upstream; this.navigation.returning = true;
    if (this.journey.backIf(`/${upstream}`)) return;
    void this.router.navigate([`/${upstream}`]);
  }
}
