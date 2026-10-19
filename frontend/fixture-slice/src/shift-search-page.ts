import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { identity, displayTime, type IdentityResponseV1 } from './contract';
import { coherentSource, minute, type CatalogValueV1 } from './current-shifts-contract';
import {
  searchContext, searchList, searchProblem, type ShiftSearchFilterContextV1, type ShiftSearchListV1,
  type ShiftSearchRequestV1, type ShiftSearchRowV1, type ShiftSearchWorkLocationV1,
} from './shift-search-contract';
import { CivilDateAdapter, CIVIL_FORMATS, dateFromWire, dateWire, calendarLabels } from './civil-date-adapter';
import { WorkspaceShell } from './workspace-shell';
import { MinutePicker } from './minute-picker';
import { ListNavigation } from './list-navigation';
import { ViewHistory } from './view-history';
import { EmployeeName } from './employee-name';

const timeControl = () => new FormControl('', { nonNullable: true,
  validators: [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)] });

@Component({
  selector: 'shf-shift-search',
  imports: [EmployeeName,WorkspaceShell, ReactiveFormsModule, RouterLink, MatDatepickerModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  providers: [{ provide: DateAdapter, useClass: CivilDateAdapter }, { provide: MAT_DATE_FORMATS, useValue: CIVIL_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' }, { provide: MatDatepickerIntl, useFactory: calendarLabels }],
  templateUrl: './shift-search-page.html', styleUrl: './shift-search-page.scss',
})
export class ShiftSearchPage {
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly navigation = inject(ListNavigation);
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null, Validators.required), timeFrom: timeControl(), timeTo: timeControl(),
    moked: new FormControl<string | null>(null), teamCodes: new FormControl<string[]>([], { nonNullable: true }),
    innerJobCodes: new FormControl<string[]>([], { nonNullable: true }),
    workLocations: new FormControl<ShiftSearchWorkLocationV1[]>([], { nonNullable: true }),
  });
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly context = signal<ShiftSearchFilterContextV1 | null>(null);
  readonly result = signal<ShiftSearchListV1 | null>(null);
  readonly state = signal<'initial' | 'context-loading' | 'loading' | 'success' | 'empty' | 'error' | 'dirty'>('initial');
  readonly denied = signal(false);
  readonly message = signal('');
  readonly announcement = signal('');
  readonly reference = signal('');
  readonly pickerTarget = signal<'timeFrom' | 'timeTo' | null>(null);
  readonly displayTime = displayTime;
  readonly minDate = dateFromWire('0001-01-01');
  readonly maxDate = dateFromWire('9999-12-31');
  private generation = 0;
  private identityGen = 0;
  private alive = true;
  private initialized = false;
  private identityWork?: Subscription;
  private work?: Subscription;
  private lastRequest: ShiftSearchRequestV1 | null = null;
  private historyDraft = this.journey.saved<{
    form: ReturnType<ShiftSearchPage['form']['getRawValue']>; dirty: boolean;
    request: ShiftSearchRequestV1 | null; dateText: string;
  }>();
  private restore = this.navigation.returning && (this.navigation.detailOrigin === 'shift-search' ||
    this.navigation.scheduleUpstream === 'shift-search') ? this.navigation.searchOrigin : null;

  constructor() {
    this.journey.attach(this.host.nativeElement, () => ({
      form: this.form.getRawValue(), dirty: this.state() === 'dirty', request: this.lastRequest,
      dateText: this.host.nativeElement.querySelector<HTMLInputElement>('#search-date')?.value ?? '',
    }));
    this.navigation.returning = false;
    this.form.controls.moked.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.teamCodes.setValue([], { emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.cancel(); this.restore = null; this.navigation.searchOrigin = null; this.lastRequest = null;
      // Clear only server errors; local validators recompute without normalizing text.
      for (const control of Object.values(this.form.controls)) {
        if (control.hasError('server')) { const { server, ...errors } = control.errors!; control.setErrors(Object.keys(errors).length ? errors : null); }
      }
      if (this.form.controls.timeTo.hasError('range')) this.form.controls.timeTo.updateValueAndValidity({ emitEvent: false });
      this.state.set('dirty'); this.message.set('המסננים השתנו. יש לחפש מחדש כדי להציג תוצאות.');
      this.announcement.set(this.message());
    });
    this.recheckIdentity();
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGen++; this.identityWork?.unsubscribe(); this.cancel(); this.dialog.closeAll();
    });
  }
  canRead(): boolean {
    return this.identityState() === 'ready' && !this.denied() && !!this.principal()?.principal.capabilities.includes('shift-search:read');
  }
  teams() {
    const parent = this.form.controls.moked.value;
    return this.context()?.teamOptions.filter(t => !parent || t.parentMokedCode === parent) ?? [];
  }
  private cancel(): void { this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set(''); }
  private active(gen: number): boolean { return this.alive && gen === this.generation && this.canRead(); }
  recheckIdentity(): void {
    this.cancel(); this.context.set(null); this.identityWork?.unsubscribe(); const gen = ++this.identityGen;
    this.form.disable({ emitEvent: false });
    this.principal.set(null); this.identityState.set('loading'); this.denied.set(false); this.identityError.set('');
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGen) return;
        if (!identity(value)) { this.identityFailure(); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (this.canRead()) this.loadContext(); else this.fail('אין הרשאה לחיפוש משמרות.');
      },
      error: () => { if (this.alive && gen === this.identityGen) this.identityFailure(); },
    });
  }
  private identityFailure(): void {
    this.cancel(); this.principal.set(null); this.context.set(null); this.identityState.set('error');
    this.form.disable({ emitEvent: false });
    this.identityError.set('לא ניתן לאמת את הזהות. אין הנחת מנהל מערכת. יש לבדוק זהות מחדש.');
    this.fail(this.identityError());
  }
  loadContext(): void {
    if (!this.canRead()) return;
    this.cancel(); const gen = this.generation; this.context.set(null); this.state.set('context-loading');
    this.form.disable({ emitEvent: false });
    this.message.set('טוען אפשרויות סינון…'); this.announcement.set(this.message());
    this.work = this.api.searchContext().subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!searchContext(value) || !coherentSource(this.principal()?.dataSource, value.dataSource) ||
            !value.teamOptions.every(t => this.principal()!.principal.resourceScope.orgUnitIds.includes(t.code))) {
          this.fail('התקבלה תשובת מסננים לא תקינה. לא הוצגו תוצאות.'); return;
        }
        this.context.set(value);
        const saved = this.restore;
        const draft = this.historyDraft;
        if (draft) {
          this.historyDraft = null;
          this.form.setValue(draft.form, { emitEvent: false }); this.initialized = true;
        }
        if (!draft && (saved || !this.initialized)) {
          const d = saved?.request ?? value.defaults;
          this.form.setValue({ date: dateFromWire(d.attendanceDate), timeFrom: d.timeFrom, timeTo: d.timeTo,
            moked: d.mokedCode ?? null, teamCodes: d.teamCodes ?? [], innerJobCodes: d.innerJobCodes ?? [],
            workLocations: d.workLocations ?? [] }, { emitEvent: false });
          this.initialized = true;
        }
        if (!this.validCatalog()) {
          this.restore = null; this.form.enable({ emitEvent: false });
          this.fail('בחירה שמורה אינה זמינה בהרשאות הנוכחיות. הערכים נשמרו; יש לנקות בחירות לא זמינות ולבחור מחדש.'); return;
        }
        this.form.enable({ emitEvent: false });
        if (draft) {
          this.restore = null;
          if (draft.dirty || !draft.request) {
            this.state.set(draft.dirty ? 'dirty' : 'initial');
            this.message.set('יש לבחור מסננים וללחוץ על חיפוש משמרות.');
            this.defer(() => {
              const input = this.host.nativeElement.querySelector<HTMLInputElement>('#search-date');
              if (input) input.value = draft.dateText;
              this.journey.restore(this.host.nativeElement);
            }, gen);
          } else this.fetch(draft.request, false, saved);
          return;
        }
        this.state.set('initial'); this.message.set('יש לבחור מסננים וללחוץ על חיפוש משמרות.'); this.announcement.set(this.message());
        if (saved) { this.restore = null; this.fetch(saved.request, false, saved); }
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private validCatalog(): boolean {
    const ctx = this.context(), v = this.form.getRawValue();
    return !!ctx && (!v.moked || ctx.mokedOptions.some(m => m.code === v.moked)) &&
      v.teamCodes.every(code => this.teams().some(t => t.code === code)) &&
      v.innerJobCodes.every(code => ctx.innerJobOptions.some(r => r.code === code)) &&
      v.workLocations.every(code => ctx.workLocationOptions.some(l => l.code === code));
  }
  unavailable(): boolean { return !!this.context() && !this.validCatalog(); }
  unavailableSelection(): string {
    const v = this.form.getRawValue();
    return [v.moked, ...v.teamCodes, ...v.innerJobCodes, ...v.workLocations].filter(Boolean).join(', ');
  }
  clearUnavailable(): void {
    const ctx = this.context();
    if (!ctx) return;
    const v = this.form.getRawValue();
    const moked = ctx.mokedOptions.some(m => m.code === v.moked) ? v.moked : null;
    this.form.patchValue({ moked, teamCodes: v.teamCodes.filter(code => ctx.teamOptions.some(t =>
      t.code === code && (!moked || t.parentMokedCode === moked))),
      innerJobCodes: v.innerJobCodes.filter(code => ctx.innerJobOptions.some(r => r.code === code)),
      workLocations: v.workLocations.filter(code => ctx.workLocationOptions.some(l => l.code === code)) });
  }
  search(): void {
    if (!this.canRead() || !this.context() || this.state() === 'loading') return;
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (minute(v.timeFrom) && minute(v.timeTo) && v.timeFrom > v.timeTo)
      this.form.controls.timeTo.setErrors({ range: true });
    if (this.form.invalid) {
      const field = Object.keys(this.form.controls).find(k => this.form.get(k)?.invalid)!;
      this.focus(`#search-${field}`); return;
    }
    if (!this.validCatalog()) { this.fail('אפשרויות הסינון שנבחרו אינן זמינות. יש לנקות בחירות לא זמינות ולבחור מחדש.'); return; }
    this.fetch({ attendanceDate: dateWire(v.date!), timeFrom: v.timeFrom, timeTo: v.timeTo,
      ...(v.moked ? { mokedCode: v.moked } : {}), ...(v.teamCodes.length ? { teamCodes: [...v.teamCodes] } : {}),
      ...(v.innerJobCodes.length ? { innerJobCodes: [...v.innerJobCodes] } : {}),
      ...(v.workLocations.length ? { workLocations: [...v.workLocations] } : {}),
      limit: 25, offset: 0, sort: 'effective-start-asc' }, true);
  }
  retry(): void {
    if (!this.canRead()) return;
    if (!this.context()) this.loadContext();
    else if (this.lastRequest) this.fetch(this.lastRequest, true);
    else this.search();
  }
  page(offset: number): void {
    if (!this.result() || !this.lastRequest || offset < 0 || offset > 10000) return;
    this.fetch({ ...this.lastRequest, offset }, true);
  }
  private fetch(request: ShiftSearchRequestV1, focus: boolean, origin: typeof this.restore = null): void {
    this.cancel(); const gen = this.generation, ctx = this.context()!;
    this.lastRequest = request; this.state.set('loading'); this.message.set('טוען תוצאות חיפוש…'); this.announcement.set(this.message());
    this.work = this.api.shiftSearch(request).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!searchList(value, request, ctx)) { this.fail('התקבלה תשובה שאינה תואמת לבקשה. לא הוצגו תוצאות.'); return; }
        this.result.set(value); this.state.set(value.items.length ? 'success' : 'empty');
        this.message.set(value.items.length ? `נטענו ${value.items.length} משמרות בעמוד` : 'לא נמצאו משמרות במסננים שנבחרו.');
        this.announcement.set(this.message());
        if (origin) this.defer(() => {
          const table = this.host.nativeElement.querySelector<HTMLElement>('.table-wrap');
          if (table) table.scrollLeft = origin.tableScroll;
          const opener = this.host.nativeElement.querySelector<HTMLElement>(`#${origin.opener}`);
          if (opener) opener.focus({ preventScroll: true });
          else { this.focus('#search-results', true); this.announcement.set(`${this.message()} הרשומה המקורית אינה מופיעה בעמוד המעודכן.`); }
          window.scrollTo(0, origin.scroll);
        }, gen);
        else if (focus) this.defer(() => this.focus('#search-results'), gen);
        this.defer(() => this.journey.restore(this.host.nativeElement), gen);
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private handleError(error: unknown): void {
    let message = 'לא ניתן לטעון תוצאות כעת. אפשר לנסות שוב.';
    let invalidField: string | undefined;
    if (error instanceof HttpErrorResponse && searchProblem(error.error, error.status)) {
      this.reference.set(error.error.requestId);
      if (error.status === 401) { this.identityFailure(); return; }
      if (error.status === 403) {
        this.context.set(null); this.denied.set(true);
        message = 'אין הרשאה לחיפוש או למסננים שנבחרו. יש לבדוק זהות מחדש.';
      } else if (error.status === 400) {
        message = 'יש לבדוק את מסנני החיפוש. הערכים שהוזנו נשמרו.';
        const map: Record<string, string> = { attendanceDate: 'date', timeFrom: 'timeFrom', timeTo: 'timeTo',
          mokedCode: 'moked', teamCodes: 'teamCodes', innerJobCodes: 'innerJobCodes', workLocations: 'workLocations' };
        for (const p of error.error.invalidParameters ?? []) {
          const field = map[p.name];
          if (field) { this.form.get(field)?.setErrors({ server: true }); invalidField ??= field; }
          if (['mokedCode', 'teamCodes', 'innerJobCodes', 'workLocations'].includes(p.name)) this.context.set(null);
        }
      } else if (error.status === 500) message = 'לא ניתן להציג תוצאות עקב שגיאת נתונים. לא בוצע שינוי בנתונים.';
    } else if (error instanceof HttpErrorResponse && error.status !== 0) message = 'התקבלה תשובת שגיאה לא תקינה. לא הוצגו תוצאות.';
    this.form.markAllAsTouched();
    this.fail(message, !invalidField || !this.context());
    if (invalidField && this.context()) this.defer(() => this.focus(`#search-${invalidField}`), this.generation);
  }
  private fail(message: string, focus = true): void {
    if (!this.context() || !this.canRead()) this.form.disable({ emitEvent: false });
    this.result.set(null); this.state.set('error'); this.message.set(message); this.announcement.set(message);
    if (focus) this.defer(() => this.focus('#search-error'), this.generation);
  }
  private defer(work: () => void, gen: number): void { setTimeout(() => { if (this.alive && gen === this.generation) work(); }); }
  private focus(selector: string, preventScroll = false): void { this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus({ preventScroll }); }
  openTime(target: 'timeFrom' | 'timeTo'): void {
    if (!this.canRead() || !this.context() || this.pickerTarget()) return;
    const control = this.form.controls[target];
    if (!minute(control.value)) { control.markAsTouched(); this.focus(`#search-${target}`); return; }
    this.pickerTarget.set(target);
    this.dialog.open(MinutePicker, { data: control.value, direction: 'rtl', width: '380px', maxWidth: 'calc(100vw - 32px)',
      ariaLabel: target === 'timeFrom' ? 'בחירת שעת התחלה — משעה' : 'בחירת שעת התחלה — עד שעה',
      restoreFocus: true, autoFocus: 'first-tabbable', enterAnimationDuration: 0, exitAnimationDuration: 0 })
      .afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(value => {
        this.pickerTarget.set(null); if (minute(value)) control.setValue(value); this.focus(`#search-${target}-open`, true);
      });
  }
  label(v: CatalogValueV1): string { return v.label ?? `תיאור לא זמין (קוד ${v.code})`; }
  weekday(row: ShiftSearchRowV1): string { return new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(dateFromWire(row.startLocal.slice(0, 10))); }
  indicators(row: ShiftSearchRowV1): string[] {
    const i = row.indicators;
    return [`קיימת הערה: ${i.hasRemark ? 'כן' : 'לא'}`, `הערת ביטול כניסה: ${i.hasCancelLoginAnnotation ? 'כן' : 'לא'}`,
      `שינוי בזמן או במיקום: ${i.timeOrLocationChanged ? 'כן' : 'לא'}`, `משמרת מפוצלת: ${i.split ? 'כן' : 'לא'}`,
      `תגבור: ${i.addedStaffing ? 'כן' : 'לא'}`, `שינוי שיבוץ עובד: ${i.employeeReassigned ? 'כן' : 'לא'}`,
      `הקצאת שלוחה: ${i.extensionAllocated === null ? 'לא ישים' : i.extensionAllocated ? 'כן' : 'לא'}`];
  }
  openSchedule(row: ShiftSearchRowV1, event: MouseEvent): void { this.openDetail(row, event, true); }
  canReadItems(): boolean { const caps = this.principal()?.principal.capabilities;
    return !!caps?.includes('shift-items:read') && caps.includes('shift-day:read'); }
  openItems(row: ShiftSearchRowV1, event: MouseEvent): void { this.openDetail(row, event, false, true); }
  openDetail(row: ShiftSearchRowV1, event: MouseEvent, schedule = false, items = false): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    if (!this.result() || !this.lastRequest || !this.principal()?.principal.capabilities.includes(schedule ? 'my-shifts:read' : 'shift-day:read')) return;
    if (items && !this.canReadItems()) return;
    this.navigation.searchOrigin = { dataSource: this.principal()!.dataSource, request: structuredClone(this.lastRequest), scroll: window.scrollY,
      tableScroll: this.host.nativeElement.querySelector<HTMLElement>('.table-wrap')?.scrollLeft ?? 0,
      opener: `search-${items ? 'items' : schedule ? 'schedule' : 'detail'}-${row.shiftDayId}`, employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId,
      unit: { code: row.employee.unit.code, label: row.employee.unit.label, parentLabel: row.employee.unit.moked.label } };
    this.navigation.detailOrigin = 'shift-search'; this.navigation.returning = true;
    if (items) {
      void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId, 'breaks-and-exceptions']); return;
    }
    if (schedule) {
      this.navigation.scheduleUpstream = 'shift-search'; this.navigation.schedule = null;
      void this.router.navigate(['/my-shifts/selected', row.employee.employeeId], { state: { origin: 'shift-search' } }); return;
    }
    void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId], { state: { origin: 'shift-search' } });
  }
}
