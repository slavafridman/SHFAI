import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
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
import { attendanceContext, attendanceList, attendanceProblem, type AttendanceFilterContextV1,
  type AttendanceListV1, type AttendanceRequestV1, type AttendanceRowV1 } from './attendance-contract';
import { CivilDateAdapter, CIVIL_FORMATS, dateFromWire, dateWire, calendarLabels } from './civil-date-adapter';
import { WorkspaceShell } from './workspace-shell';
import { MinutePicker } from './minute-picker';
import { ListNavigation } from './list-navigation';
import { ViewHistory } from './view-history';
import { EmployeeName } from './employee-name';
import { StageArrivalSession } from './stage-arrival-session';
import { arrivalSource, actorBinding } from './stage-arrival-contract';
import { StationArrivalSession } from './station-arrival-session';
import { stationSource } from './station-arrival-contract';

const timeControl = () => new FormControl('', { nonNullable: true,
  validators: [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)] });

@Component({
  selector: 'shf-attendance',
  imports: [EmployeeName, WorkspaceShell, ReactiveFormsModule, RouterLink, MatDatepickerModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  providers: [{ provide: DateAdapter, useClass: CivilDateAdapter }, { provide: MAT_DATE_FORMATS, useValue: CIVIL_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' }, { provide: MatDatepickerIntl, useFactory: calendarLabels }],
  templateUrl: './attendance-page.html', styleUrl: './attendance-page.scss',
})
export class AttendancePage {
  private readonly arrival = inject(StageArrivalSession);
  readonly station = inject(StationArrivalSession);
  readonly journey = inject(ViewHistory);
  readonly navigation = inject(ListNavigation);
  private readonly api = inject(SliceApi);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null, Validators.required), timeFrom: timeControl(), timeTo: timeControl(),
    moked: new FormControl<string | null>(null), teamCodes: new FormControl<string[]>([], { nonNullable: true }),
    innerJobCodes: new FormControl<string[]>([], { nonNullable: true }),
    workLocations: new FormControl<('home' | 'site')[]>([], { nonNullable: true }),
  });
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly context = signal<AttendanceFilterContextV1 | null>(null);
  readonly result = signal<AttendanceListV1 | null>(null);
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
  private identityGeneration = 0;
  private alive = true;
  private initialized = false;
  private work?: Subscription;
  private identityWork?: Subscription;
  private lastRequest: AttendanceRequestV1 | null = null;
  private draft = this.journey.saved<{
    form: ReturnType<AttendancePage['form']['getRawValue']>; dirty: boolean;
    request: AttendanceRequestV1 | null; dateText: string;
  }>();
  constructor() {
    const restoring = !!this.draft;
    afterNextRender(() => {
      if (!restoring) {
        this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
    });
    this.journey.attach(this.host.nativeElement, () => ({
      form: this.form.getRawValue(), dirty: this.state() === 'dirty', request: this.lastRequest,
      dateText: this.host.nativeElement.querySelector<HTMLInputElement>('#attendance-date')?.value ?? '',
    }));
    this.form.controls.moked.valueChanges.pipe(takeUntilDestroyed()).subscribe(parent => {
      this.form.controls.teamCodes.setValue(this.form.controls.teamCodes.value.filter(code =>
        this.context()?.teamOptions.some(t => t.code === code && (!parent || t.parentMokedCode === parent))), { emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.cancel(); this.lastRequest = null;
      for (const control of Object.values(this.form.controls)) {
        if (control.hasError('server') || control.hasError('range')) control.updateValueAndValidity({ emitEvent: false });
      }
      this.state.set('dirty'); this.say('המסננים השתנו. יש להחיל מחדש כדי להציג רשומות.');
    });
    this.recheckIdentity();
    this.destroy.onDestroy(() => {
      this.alive = false; this.identityGeneration++; this.identityWork?.unsubscribe(); this.cancel(); this.dialog.closeAll();
    });
  }
  canRead() { return this.identityState() === 'ready' && !this.denied() &&
    !!this.principal()?.principal.capabilities.includes('attendance:read'); }
  teams() { const parent = this.form.controls.moked.value;
    return this.context()?.teamOptions.filter(t => !parent || t.parentMokedCode === parent) ?? []; }
  private say(text: string) { this.message.set(text); this.announcement.set(text); }
  private cancel() { this.generation++; this.work?.unsubscribe(); this.result.set(null); this.reference.set(''); }
  private active(gen: number) { return this.alive && gen === this.generation && this.canRead(); }
  recheckIdentity() {
    this.cancel(); this.context.set(null); this.identityWork?.unsubscribe();
    const gen = ++this.identityGeneration;
    this.form.disable({ emitEvent: false }); this.principal.set(null); this.identityState.set('loading');
    this.denied.set(false); this.identityError.set('');
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGeneration) return;
        if (!identity(value)) { this.identityFailure(); return; }
        this.principal.set(value); this.identityState.set('ready');
        if (this.canRead()) this.loadContext(); else this.fail('אין הרשאה לבירור נוכחות.');
      },
      error: () => { if (this.alive && gen === this.identityGeneration) this.identityFailure(); },
    });
  }
  private identityFailure() {
    this.cancel(); this.context.set(null); this.principal.set(null); this.identityState.set('error');
    this.identityError.set('אין זהות תקפה. לא ניתן לאמת את הזהות; אין הנחת מנהל מערכת.');
    this.fail(this.identityError());
  }
  loadContext() {
    if (!this.canRead()) return;
    this.cancel(); const gen = this.generation;
    this.context.set(null); this.form.disable({ emitEvent: false }); this.state.set('context-loading');
    this.say('טוען הקשר לבירור נוכחות…');
    this.work = this.api.attendanceContext().subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!attendanceContext(value) || !coherentSource(this.principal()?.dataSource, value.dataSource) ||
            !value.teamOptions.every(t => this.principal()!.principal.resourceScope.orgUnitIds.includes(t.code))) {
          this.fail('התקבל הקשר מסננים לא עקבי. לא הוצגו רשומות.'); return;
        }
        this.context.set(value);
        const draft = this.draft; this.draft = null;
        if (draft) { this.form.setValue(draft.form, { emitEvent: false }); this.initialized = true; }
        if (!this.initialized) {
          const d = value.defaults;
          this.form.setValue({ date: dateFromWire(d.attendanceDate), timeFrom: d.timeFrom, timeTo: d.timeTo,
            moked: d.mokedCode, teamCodes: [...d.teamCodes], innerJobCodes: [...d.innerJobCodes],
            workLocations: [...d.workLocations] }, { emitEvent: false });
          this.initialized = true;
        }
        this.form.enable({ emitEvent: false });
        if (!this.validCatalog()) { this.fail('בחירה שמורה אינה זמינה בהרשאות הנוכחיות. הערכים נשמרו; יש לנקות בחירות לא זמינות.'); return; }
        this.state.set(draft?.dirty ? 'dirty' : 'initial');
        this.say(value.teamOptions.length ? 'יש לבחור מסננים וללחוץ על החלה.' : 'אין צוותים מורשים לבירור.');
        if (draft && !draft.dirty && draft.request) this.fetch(draft.request, false);
        else if (draft) this.defer(() => {
          const input = this.host.nativeElement.querySelector<HTMLInputElement>('#attendance-date');
          if (input) input.value = draft.dateText;
          this.restoreView();
        }, gen);
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private validCatalog() {
    const ctx = this.context(), v = this.form.getRawValue();
    return !!ctx && (!v.moked || ctx.mokedOptions.some(m => m.code === v.moked)) &&
      v.teamCodes.every(code => this.teams().some(t => t.code === code)) &&
      v.innerJobCodes.every(code => ctx.innerJobOptions.some(r => r.code === code)) &&
      v.workLocations.every(code => ctx.workLocationOptions.some(l => l.code === code));
  }
  unavailable() { return !!this.context() && !this.validCatalog(); }
  unavailableSelection() { const v = this.form.getRawValue();
    return [v.moked, ...v.teamCodes, ...v.innerJobCodes, ...v.workLocations].filter(Boolean).join(', '); }
  clearUnavailable() {
    const ctx = this.context(); if (!ctx) return;
    const v = this.form.getRawValue(), moked = ctx.mokedOptions.some(m => m.code === v.moked) ? v.moked : null;
    this.form.patchValue({ moked, teamCodes: v.teamCodes.filter(code => ctx.teamOptions.some(t =>
      t.code === code && (!moked || t.parentMokedCode === moked))),
      innerJobCodes: v.innerJobCodes.filter(code => ctx.innerJobOptions.some(r => r.code === code)),
      workLocations: v.workLocations.filter(code => ctx.workLocationOptions.some(l => l.code === code)) });
  }
  apply() {
    if (!this.canRead() || !this.context() || this.state() === 'loading') return;
    this.form.markAllAsTouched(); const v = this.form.getRawValue();
    if (minute(v.timeFrom) && minute(v.timeTo) && v.timeFrom > v.timeTo) this.form.controls.timeTo.setErrors({ range: true });
    if (this.form.invalid) {
      const first = Object.keys(this.form.controls).find(k => this.form.get(k)?.invalid);
      this.focus(`#attendance-${first}`); return;
    }
    if (!this.validCatalog()) { this.fail('אפשרויות הסינון שנבחרו אינן זמינות. יש לנקות בחירות לא זמינות.'); return; }
    this.fetch({ attendanceDate: dateWire(v.date!), timeFrom: v.timeFrom, timeTo: v.timeTo,
      ...(v.moked ? { mokedCode: v.moked } : {}), ...(v.teamCodes.length ? { teamCodes: [...v.teamCodes] } : {}),
      ...(v.innerJobCodes.length ? { innerJobCodes: [...v.innerJobCodes] } : {}),
      ...(v.workLocations.length ? { workLocations: [...v.workLocations] } : {}),
      limit: 25, offset: 0, sort: 'effective-start-asc' }, true);
  }
  reload() {
    if (!this.canRead() || this.state() === 'loading' || this.state() === 'context-loading') return;
    if (!this.context()) this.loadContext();
    else if (this.lastRequest) this.fetch({ ...this.lastRequest, offset: 0 }, false);
    else this.apply();
  }
  page(offset: number) {
    if (!this.result() || !this.lastRequest || offset < 0 || offset > 10000) return;
    this.fetch({ ...this.lastRequest, offset }, true);
  }
  private fetch(request: AttendanceRequestV1, focus: boolean) {
    this.cancel(); const gen = this.generation, ctx = this.context()!;
    this.lastRequest = structuredClone(request); this.state.set('loading'); this.say('טוען רשומות…');
    this.work = this.api.attendance(request).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!attendanceList(value, request, ctx)) { this.fail('לא ניתן להציג רשומות עקביות. התקבלה תשובה שאינה תואמת לבקשה.'); return; }
        this.result.set(value); this.state.set(value.items.length ? 'success' : 'empty');
        this.say(value.items.length ? `נטענו ${value.items.length} ימי משמרת בעמוד` :
          'לא נמצאו ימי משמרת עם תחילה או חזרה מפיצול בטווח שנבחר.');
        this.defer(() => {
          if (!this.restoreView() && focus) this.focus('#attendance-results');
        }, gen);
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private handleError(error: unknown) {
    let text = 'השירות אינו זמין כעת. הערכים שהוזנו נשמרו; אפשר לנסות שוב.';
    let field: string | undefined;
    if (error instanceof HttpErrorResponse && attendanceProblem(error.error, error.status)) {
      this.reference.set(error.error.requestId);
      if (error.status === 401) { this.identityFailure(); return; }
      if (error.status === 403) {
        this.denied.set(true); this.context.set(null); text = 'אין הרשאה לבירור או למסנן שנבחר. יש לבדוק זהות מחדש.';
      } else if (error.status === 400) {
        text = 'יש לבדוק את המסננים. הערכים שהוזנו נשמרו.';
        const map: Record<string, string> = { attendanceDate: 'date', timeFrom: 'timeFrom', timeTo: 'timeTo',
          mokedCode: 'moked', teamCodes: 'teamCodes', innerJobCodes: 'innerJobCodes', workLocations: 'workLocations' };
        for (const p of error.error.invalidParameters ?? []) {
          const name = map[p.name];
          if (name) { this.form.get(name)?.setErrors({ server: true }); field ??= name; }
          if (['mokedCode', 'teamCodes', 'innerJobCodes', 'workLocations'].includes(p.name)) this.context.set(null);
        }
      } else if (error.status === 500) text = 'לא ניתן להציג רשומות עקביות. לא בוצע שינוי בנתונים.';
    } else if (error instanceof HttpErrorResponse && error.status !== 0) text = 'התקבלה תשובת שגיאה לא תקינה. לא הוצגו רשומות.';
    this.form.markAllAsTouched(); this.fail(text, !field || !this.context());
    if (field && this.context()) this.defer(() => this.focus(`#attendance-${field}`), this.generation);
  }
  private fail(text: string, focus = true) {
    if (!this.context() || !this.canRead()) this.form.disable({ emitEvent: false });
    this.result.set(null); this.state.set('error'); this.say(text);
    // A reload button remains mounted, including during pending/error/success.
    // Do not steal its focus on terminal errors.
    if (focus && document.activeElement?.id !== 'attendance-reload') this.defer(() => this.focus('#attendance-error'), this.generation);
  }
  private defer(fn: () => void, gen: number) { setTimeout(() => { if (this.alive && gen === this.generation) fn(); }); }
  private restoreView() {
    return this.journey.restore(this.host.nativeElement, {
      selector: '#attendance-results',
      onMissing: () => this.announcement.set(`${this.message()} הרשומה המקורית אינה מופיעה בעמוד המעודכן.`),
    });
  }
  private focus(selector: string) { this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(); }
  openTime(target: 'timeFrom' | 'timeTo') {
    if (!this.canRead() || !this.context() || this.pickerTarget()) return;
    const control = this.form.controls[target];
    if (!minute(control.value)) { control.markAsTouched(); this.focus(`#attendance-${target}`); return; }
    this.pickerTarget.set(target);
    this.dialog.open(MinutePicker, { data: control.value, direction: 'rtl', width: '380px', maxWidth: 'calc(100vw - 32px)',
      ariaLabel: target === 'timeFrom' ? 'בחירת שעה — משעה' : 'בחירת שעה — עד שעה',
      restoreFocus: true, autoFocus: 'first-tabbable', enterAnimationDuration: 0, exitAnimationDuration: 0 })
      .afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(value => {
        this.pickerTarget.set(null); if (minute(value)) control.setValue(value);
        this.host.nativeElement.querySelector<HTMLElement>(`#attendance-${target}-open`)?.focus({ preventScroll: true });
      });
  }
  label(v: CatalogValueV1) { return v.label ?? 'תיאור לא זמין'; }
  canReadItems() { const caps = this.principal()?.principal.capabilities;
    return !!caps?.includes('shift-items:read') && caps.includes('shift-day:read'); }
  canOpenArrival(row: AttendanceRowV1) {
    const source = arrivalSource(this.principal());
    return source !== null && this.result()?.dataSource === (source === 'oracle-test' ? 'oracle-read-only' : 'isolated-fixture') &&
      !!row.shiftDayId && row.planned.startLocal !== null && row.planned.endLocal !== null &&
      this.principal()!.principal.resourceScope.orgUnitIds.includes(row.employee.unit.code);
  }
  canOpenStation(row: AttendanceRowV1) {
    const source = stationSource(this.principal());
    return source !== null && this.result()?.dataSource === (source === 'oracle-test' ? 'oracle-read-only' : 'isolated-fixture') &&
      !!row.shiftDayId && row.planned.startLocal !== null && row.planned.endLocal !== null &&
      this.principal()!.principal.resourceScope.orgUnitIds.includes(row.employee.unit.code);
  }
  openStation(row: AttendanceRowV1, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    if (!this.canOpenStation(row) || !this.result()?.items.includes(row)) return;
    this.station.selection = { employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId!,
      attendanceKey: { shiftDayId: row.shiftDayId! }, orgUnitId: row.employee.unit.code,
      name: `${row.employee.firstName} ${row.employee.lastName}`, startLocal: row.planned.startLocal!,
      endLocal: row.planned.endLocal!, dataSource: stationSource(this.principal())!, actor: actorBinding(this.principal()!) };
    void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId, 'station-arrival'],
      { state: { origin: 'attendance' } });
  }
  openArrival(row: AttendanceRowV1, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    if (!this.canOpenArrival(row) || !this.result()?.items.includes(row)) return;
    this.arrival.selection = { employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId!,
      attendanceKey: { shiftDayId: row.shiftDayId! }, orgUnitId: row.employee.unit.code,
      name: `${row.employee.firstName} ${row.employee.lastName}`, startLocal: row.planned.startLocal!,
      endLocal: row.planned.endLocal!, dataSource: arrivalSource(this.principal())!, actor: actorBinding(this.principal()!) };
    void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId, 'stage-arrival'],
      { state: { origin: 'attendance' } });
  }
  open(row: AttendanceRowV1, event: MouseEvent, target: 'detail' | 'items' | 'schedule') {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    const caps = this.principal()?.principal.capabilities;
    if (!this.result() || !this.lastRequest || !row.shiftDayId ||
        !caps?.includes(target === 'schedule' ? 'my-shifts:read' : 'shift-day:read') ||
        (target === 'items' && !this.canReadItems())) return;
    this.navigation.attendanceOrigin = { dataSource: this.principal()!.dataSource, request: structuredClone(this.lastRequest),
      scroll: window.scrollY, tableScroll: this.host.nativeElement.querySelector<HTMLElement>('.table-wrap')?.scrollLeft ?? 0,
      opener: `attendance-${target}-${row.shiftDayId}`, employeeId: row.employee.employeeId, shiftDayId: row.shiftDayId,
      unit: { code: row.employee.unit.code, label: row.employee.unit.label, parentLabel: row.employee.unit.moked.label } };
    this.navigation.detailOrigin = 'attendance'; this.navigation.returning = true;
    if (target === 'schedule') {
      this.navigation.scheduleUpstream = 'attendance'; this.navigation.schedule = null;
      void this.router.navigate(['/my-shifts/selected', row.employee.employeeId], { state: { origin: 'attendance' } });
    } else void this.router.navigate(['/employees', row.employee.employeeId, 'shift-days', row.shiftDayId,
      ...(target === 'items' ? ['breaks-and-exceptions'] : [])], { state: { origin: 'attendance' } });
  }
}
