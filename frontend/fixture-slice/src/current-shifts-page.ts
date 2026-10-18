import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { identity, displayTime, type IdentityResponseV1 } from './contract';
import {
  filterContext, currentList, currentProblem, minute, coherentSource,
  type CurrentShiftFilterContextV1, type CurrentShiftListV1, type CurrentShiftRequestV1,
  type CurrentShiftRowV1, type CatalogValueV1,
} from './current-shifts-contract';
import { CivilDateAdapter, CIVIL_FORMATS, dateFromWire, dateWire } from './civil-date-adapter';
import { WorkspaceShell } from './workspace-shell';
import { MinutePicker } from './minute-picker';
import { ListNavigation } from './list-navigation';

function hebrewCalendar(): MatDatepickerIntl {
  const intl = new MatDatepickerIntl();
  intl.openCalendarLabel = 'פתיחת לוח שנה';
  intl.closeCalendarLabel = 'סגירת לוח שנה';
  intl.prevMonthLabel = 'החודש הקודם';
  intl.nextMonthLabel = 'החודש הבא';
  intl.prevYearLabel = 'השנה הקודמת';
  intl.nextYearLabel = 'השנה הבאה';
  intl.prevMultiYearLabel = 'טווח השנים הקודם';
  intl.nextMultiYearLabel = 'טווח השנים הבא';
  intl.switchToMonthViewLabel = 'בחירת תאריך';
  intl.switchToMultiYearViewLabel = 'בחירת חודש ושנה';
  return intl;
}
@Component({
  selector: 'shf-current-shifts',
  imports: [
    WorkspaceShell, ReactiveFormsModule, RouterLink, MatDatepickerModule, MatButtonModule,
    MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: CivilDateAdapter }, { provide: MAT_DATE_FORMATS, useValue: CIVIL_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' }, { provide: MatDatepickerIntl, useFactory: hebrewCalendar },
  ],
  templateUrl: './current-shifts-page.html',
  styleUrl: './current-shifts-page.scss',
})
export class CurrentShiftsPage {
  private readonly api = inject(SliceApi);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly navigation = inject(ListNavigation);
  readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null, Validators.required),
    time: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)] }),
    moked: new FormControl<string | null>({ value: null, disabled: true }),
  });
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly context = signal<CurrentShiftFilterContextV1 | null>(null);
  readonly result = signal<CurrentShiftListV1 | null>(null);
  readonly current = signal(false);
  readonly evaluatedCurrent = signal(false);
  readonly state = signal<'initial' | 'context-loading' | 'loading' | 'success' | 'empty' | 'error' | 'dirty'>('initial');
  readonly message = signal('');
  readonly reference = signal('');
  readonly announcement = signal('');
  readonly denied = signal(false);
  readonly pickerOpen = signal(false);
  readonly displayTime = displayTime;
  readonly minDate = dateFromWire('0001-01-01');
  readonly maxDate = dateFromWire('9999-12-31');
  private identityGen = 0;
  private generation = 0;
  private alive = true;
  private identityWork?: Subscription;
  private work?: Subscription;
  private lastRequest: CurrentShiftRequestV1 | null = null;
  private restore = this.navigation.returning && this.navigation.detailOrigin !== 'shift-search' ? this.navigation.origin : null;
  constructor() {
    this.navigation.returning = false;
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.cancel();
      this.state.set('dirty');
      this.message.set('המסננים השתנו. יש לחפש מחדש כדי להציג תוצאות.');
      this.announcement.set(this.message());
    });
    this.recheckIdentity();
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGen++; this.cancel(); this.identityWork?.unsubscribe();
      this.dialog.closeAll();
    });
  }
  canRead(): boolean {
    return this.identityState() === 'ready' && !this.denied() &&
      !!this.principal()?.principal.capabilities.includes('current-shifts:read');
  }
  private cancel(): void {
    this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set('');
  }
  recheckIdentity(): void {
    this.cancel(); this.identityWork?.unsubscribe(); const gen = ++this.identityGen;
    this.principal.set(null); this.context.set(null); this.identityState.set('loading');
    this.form.controls.moked.disable({ emitEvent: false });
    this.identityError.set(''); this.denied.set(false); this.state.set('initial');
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGen) return;
        if (!identity(value)) { this.failIdentity('התקבלה זהות לא תקינה. לא הוצגו נתוני עובד.'); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (this.canRead()) this.loadContext();
        else this.fail('אין הרשאה להצגת משמרות נוכחיות.');
      },
      error: () => { if (this.alive && gen === this.identityGen) this.failIdentity('לא ניתן לטעון את פרטי הזהות. לא הוצגו נתוני עובד.'); },
    });
  }
  private failIdentity(message: string): void {
    this.cancel(); this.principal.set(null); this.identityState.set('error');
    this.identityError.set(message); this.fail(message);
  }
  loadContext(): void {
    if (!this.canRead()) return;
    this.cancel(); const gen = this.generation;
    this.context.set(null); this.state.set('context-loading');
    this.message.set('טוען אפשרויות סינון…');
    this.work = this.api.filterContext().subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!filterContext(value) || !coherentSource(this.principal()?.dataSource, value.dataSource)) {
          this.fail('התקבלה תשובת מסננים לא תקינה. לא הוצגו תוצאות.'); return;
        }
        this.context.set(value);
        this.form.controls.moked.enable({ emitEvent: false });
        const saved = this.restore;
        const defaults = saved?.request.mode === 'at' ? saved.request : value.defaults;
        if (defaults.mokedCode && !value.mokedOptions.some(p => p.code === defaults.mokedCode)) {
          this.fail('המוקד השמור אינו זמין בהרשאות הנוכחיות. יש לבחור מסננים מחדש.'); return;
        }
        this.current.set(saved?.evaluatedCurrent ?? false);
        this.enableDateTime(!this.current());
        this.form.setValue({
          date: dateFromWire(defaults.attendanceDate), time: defaults.currentTime,
          moked: defaults.mokedCode ?? null,
        }, { emitEvent: false });
        if (saved) {
          this.evaluatedCurrent.set(saved.evaluatedCurrent);
          this.fetch(saved.request, false, true);
          this.restore = null;
        } else { this.evaluatedCurrent.set(false); this.search(); }
      },
      error: error => { if (this.active(gen)) this.handleError(error); },
    });
  }
  private active(gen: number): boolean { return this.alive && gen === this.generation && this.canRead(); }
  private enableDateTime(enabled: boolean): void {
    for (const control of [this.form.controls.date, this.form.controls.time])
      enabled ? control.enable({ emitEvent: false }) : control.disable({ emitEvent: false });
  }
  toggleCurrent(checked: boolean): void {
    this.current.set(checked);
    this.cancel();
    this.state.set('initial');
    if (checked) {
      this.enableDateTime(false);
      this.search();
    } else this.loadContext();
  }
  search(focus = true): void {
    if (!this.canRead() || !this.context() || this.state() === 'loading') return;
    this.form.markAllAsTouched();
    if (!this.current() && this.form.invalid) {
      this.focus(this.form.controls.date.invalid ? '#filter-date' : '#filter-time'); return;
    }
    const value = this.form.getRawValue();
    const common = { ...(value.moked ? { mokedCode: value.moked } : {}), limit: 25, offset: 0, sort: 'effective-start-asc' as const };
    const request: CurrentShiftRequestV1 = this.current() ? { ...common, mode: 'current', offset: 0 } :
      { ...common, mode: 'at', attendanceDate: dateWire(value.date!), currentTime: value.time };
    this.evaluatedCurrent.set(this.current());
    this.fetch(request, focus);
  }
  retry(): void {
    if (!this.canRead()) return;
    if (!this.context()) { this.loadContext(); return; }
    if (this.lastRequest) this.fetch(this.lastRequest, true);
    else this.search();
  }
  page(offset: number): void {
    const result = this.result();
    if (!result || offset < 0 || offset > 10000) return;
    const a = result.applied;
    this.fetch({ mode: 'at', attendanceDate: a.attendanceDate, currentTime: a.currentTime,
      ...(a.mokedCode ? { mokedCode: a.mokedCode } : {}), limit: result.page.limit, offset, sort: a.sort }, true);
  }
  private fetch(request: CurrentShiftRequestV1, focus: boolean, restore = false): void {
    this.cancel(); const gen = this.generation, ctx = this.context()!;
    this.lastRequest = request; this.state.set('loading'); this.message.set('טוען משמרות…');
    this.announcement.set(this.message());
    const origin = restore ? this.restore : null;
    this.work = this.api.currentShifts(request).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!currentList(value, request, ctx)) { this.fail('התקבלה תשובה שאינה תואמת לבקשה. לא הוצגו תוצאות.'); return; }
        this.result.set(value); this.state.set(value.items.length ? 'success' : 'empty');
        this.message.set(value.items.length ? `נטענו ${value.items.length} משמרות בעמוד` : 'לא נמצאו משמרות במסננים שנבחרו.');
        this.announcement.set(this.message());
        if (request.mode === 'current') {
          this.form.patchValue({ date: dateFromWire(value.applied.attendanceDate), time: value.applied.currentTime }, { emitEvent: false });
        }
        if (origin) {
          this.defer(() => {
            const table = this.host.nativeElement.querySelector<HTMLElement>('.table-wrap');
            if (table) table.scrollLeft = origin.tableScroll;
            if (this.host.nativeElement.querySelector(`#${origin.opener}`)) {
              this.focus(`#${origin.opener}`, true);
            } else {
              this.focus('#results-heading', true);
              this.announcement.set(`${this.message()} הרשומה המקורית אינה מופיעה בעמוד המעודכן.`);
            }
            window.scrollTo(0, origin.scroll);
          }, gen);
        } else if (focus) this.defer(() => this.focus('#results-heading', true), gen);
      },
      error: error => { if (this.active(gen)) this.handleError(error, focus); },
    });
  }
  private handleError(error: unknown, focus = true): void {
    let message = 'לא ניתן לטעון משמרות כעת. אפשר לנסות שוב.';
    if (error instanceof HttpErrorResponse && currentProblem(error.error, error.status)) {
      this.reference.set(error.error.requestId);
      if (error.status === 401) {
        this.identityGen++; this.identityWork?.unsubscribe(); this.principal.set(null);
        this.identityState.set('error'); this.identityError.set('לא ניתן לאמת את הזהות. יש לבדוק זהות מחדש.');
        message = this.identityError();
      } else if (error.status === 403) {
        this.denied.set(true); message = 'אין הרשאה להצגת משמרות או למוקד שנבחר. יש לבדוק זהות מחדש.';
      } else if (error.status === 400) {
        message = 'יש לבדוק את מסנני החיפוש. הערכים שהוזנו נשמרו.';
      } else if (error.status === 500) message = 'לא ניתן להציג תוצאות עקב שגיאת נתונים. לא בוצע שינוי בנתונים.';
    } else if (error instanceof HttpErrorResponse && error.status !== 0) {
      message = 'התקבלה תשובת שגיאה לא תקינה. לא הוצגו תוצאות.';
    }
    this.fail(message, focus || !this.canRead());
  }
  private fail(message: string, focus = true): void {
    this.result.set(null); this.state.set('error'); this.message.set(message); this.announcement.set(message);
    if (focus) this.defer(() => this.focus('#list-error'), this.generation);
  }
  private defer(work: () => void, gen: number): void {
    setTimeout(() => { if (this.alive && gen === this.generation) work(); });
  }
  private focus(selector: string, preventScroll = false): void {
    this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus({ preventScroll });
  }
  openTime(): void {
    const control = this.form.controls.time;
    if (this.current() || this.pickerOpen()) return;
    if (!minute(control.value)) { control.markAsTouched(); this.focus('#filter-time'); return; }
    this.pickerOpen.set(true);
    this.dialog.open(MinutePicker, { data: control.value, direction: 'rtl', width: '380px', maxWidth: 'calc(100vw - 32px)',
      ariaLabel: 'בחירת שעה ודקה', restoreFocus: true, autoFocus: 'first-tabbable',
      enterAnimationDuration: 0, exitAnimationDuration: 0 })
      .afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(value => {
        this.pickerOpen.set(false);
        if (minute(value)) control.setValue(value);
        this.focus('#time-open', true);
      });
  }
  label(value: CatalogValueV1): string {
    return value.label ?? `תיאור לא זמין (קוד ${value.code})`;
  }
  startDate(row: CurrentShiftRowV1): string { return displayTime(row.startLocal).slice(0, 10); }
  weekday(row: CurrentShiftRowV1): string {
    return new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(dateFromWire(row.startLocal.slice(0, 10)));
  }
  openDetail(row: CurrentShiftRowV1, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    const result = this.result();
    if (!result || !this.principal()?.principal.capabilities.includes('shift-day:read')) return;
    const a = result.applied;
    this.navigation.origin = {
      request: { mode: 'at', attendanceDate: a.attendanceDate, currentTime: a.currentTime,
        ...(a.mokedCode ? { mokedCode: a.mokedCode } : {}), limit: result.page.limit, offset: result.page.offset, sort: a.sort },
      evaluatedCurrent: this.evaluatedCurrent(), scroll: window.scrollY, opener: `detail-${row.shiftDayId}`,
      tableScroll: this.host.nativeElement.querySelector<HTMLElement>('.table-wrap')?.scrollLeft ?? 0,
      employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId,
      unit: { code: row.employee.unit.code, label: row.employee.unit.label, parentLabel: row.employee.unit.moked.label },
    };
    this.navigation.returning = true;
    this.navigation.detailOrigin = 'current-shifts';
    void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId], { state: { origin: 'current-shifts' } });
  }
}
