import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { id, displayTime, type IdentityResponseV1 } from './contract';
import { CivilDateAdapter, CIVIL_FORMATS, calendarLabels, dateFromWire, dateWire } from './civil-date-adapter';
import { MinutePicker } from './minute-picker';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StationExitSession } from './station-exit-session';
import { ShiftManagementSession } from './shift-management-session';
import { ShiftManagementApi } from './shift-management-api';
import { ShiftManagementDialog, type ManagementReview, type ManagementConsent } from './shift-management-dialog';
import {
  canManage, managementIdentity, draft, equal, sameWarnings, warningsFor, managementProblem, ruleLabel, fieldLabel,
  type ShiftManagementContextV1, type ShiftDraftV1, type ShiftPreparationV1, type CsvShiftPreviewV1,
  type CsvShiftEncodingV1, type ShiftOperationKindV1, type ShiftReceiptV1, type ShiftEffectV1,
  type ReceiptBinding, type ShiftCommandV1, type CsvShiftCommandV1,
} from './shift-management-contract';

type State = 'loading' | 'editing' | 'preparing' | 'invalid' | 'review' | 'confirming' |
  'submitting' | 'committed' | 'cancelled' | 'deferred' | 'expired' | 'error' | 'denied' | 'unknown';
@Component({
  selector: 'shf-shift-management',
  imports: [WorkspaceShell, ReactiveFormsModule, RouterLink, MatDatepickerModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule],
  providers: [{ provide: DateAdapter, useClass: CivilDateAdapter }, { provide: MAT_DATE_FORMATS, useValue: CIVIL_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' }, { provide: MatDatepickerIntl, useFactory: calendarLabels }],
  templateUrl: './shift-management-page.html', styleUrl: './shift-management-page.scss',
})
export class ShiftManagementPage {
  readonly journey = inject(ViewHistory);
  readonly safety = inject(ShiftManagementSession);
  private readonly stage = inject(StageArrivalSession);
  private readonly station = inject(StationArrivalSession);
  private readonly exit = inject(StationExitSession);
  private readonly api = inject(ShiftManagementApi);
  private readonly identityApi = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityMessage = signal('');
  readonly state = signal<State>('loading');
  readonly message = signal('');
  readonly reference = signal('');
  readonly context = signal<ShiftManagementContextV1 | null>(null);
  readonly prepared = signal<ShiftPreparationV1 | null>(null);
  readonly preview = signal<CsvShiftPreviewV1 | null>(null);
  readonly receipt = signal<ShiftReceiptV1 | null>(null);
  readonly kind = signal<ShiftOperationKindV1>('create');
  readonly filename = signal('');
  readonly fileReading = signal(false);
  readonly ruleErrors = signal<Array<{ row: number | null; field: string | null; code: string }>>([]);
  readonly parameterErrors = signal<Array<{ name: string; reason: string }>>([]);
  readonly form = new FormGroup({
    startDate: new FormControl<Date | null>(null), endDate: new FormControl<Date | null>(null),
    startTime: new FormControl('', { nonNullable: true, validators: Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/) }),
    endTime: new FormControl('', { nonNullable: true, validators: Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/) }),
    activityCode: new FormControl<string | null>(null), workLocation: new FormControl<'home' | 'site' | null>(null),
    startReasonCode: new FormControl<string | null>(null), endReasonCode: new FormControl<string | null>(null),
    reasonCode: new FormControl<string | null>(null), remark: new FormControl('', { nonNullable: true,
      validators: control => typeof control.value !== 'string' || [...control.value].length > 500 ||
        /[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF]/u.test(control.value) ? { presentation: true } : null }),
  });
  readonly encoding = new FormControl<CsvShiftEncodingV1 | null>(null);
  readonly minDate = dateFromWire('0001-01-01');
  readonly maxDate = dateFromWire('9999-12-31');
  readonly time = displayTime;
  readonly ruleLabel = ruleLabel;
  readonly fieldLabel = fieldLabel;
  employeeId: string | null = null;
  dayId: string | null = null;
  private bytes: ArrayBuffer | null = null;
  private generation = 0;
  private alive = true;
  private work?: Subscription;
  private identityWork?: Subscription;
  private commandWork?: Subscription;
  private review?: MatDialogRef<ShiftManagementDialog, ManagementConsent>;
  private deadline?: ReturnType<typeof setTimeout>;
  private bound = '';
  private preparedSnapshot = '';
  private submittedDraft: ShiftDraftV1 | null = null;

  constructor() {
    // Deliberately no local-form callback: history must not save CSV or authority.
    this.journey.attach(this.host.nativeElement);
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.edited());
    this.encoding.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.edited());
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      if (this.state() === 'submitting') this.unknown();
      this.invalidate(); this.clearFile(); this.context.set(null); this.receipt.set(null);
      this.employeeId = params.get('employeeId'); this.dayId = params.get('shiftDayId');
      this.kind.set(this.dayId ? 'change' : 'create');
      this.form.reset(undefined, { emitEvent: false }); this.encoding.reset(null, { emitEvent: false });
      this.recheckIdentity();
    });
    const unload = (e: BeforeUnloadEvent) => {
      if (this.state() === 'submitting') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', unload);
    this.destroy.onDestroy(() => {
      this.alive = false; this.invalidate(); this.identityWork?.unsubscribe(); this.commandWork?.unsubscribe();
      this.clearFile(); window.removeEventListener('beforeunload', unload);
    });
  }
  private focus(selector = '#management-status') {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus({ preventScroll: false }),
      { injector: this.injector });
  }
  private active(gen: number) { return this.alive && gen === this.generation; }
  private invalidate() {
    this.generation++; this.work?.unsubscribe(); this.work = undefined;
    const review = this.review; this.review = undefined; review?.close();
    if (this.deadline) clearTimeout(this.deadline);
    this.deadline = undefined; this.prepared.set(null); this.preview.set(null);
    this.bound = ''; this.preparedSnapshot = ''; this.submittedDraft = null;
  }
  private clearFile() { this.bytes = null; this.filename.set(''); this.fileReading.set(false); }
  private edited() {
    if (this.state() === 'submitting') { this.unknown(); return; }
    this.invalidate(); if (this.fileReading()) this.clearFile();
    this.ruleErrors.set([]); this.parameterErrors.set([]); this.reference.set('');
    for (const control of Object.values(this.form.controls)) {
      if (control.hasError('server')) control.updateValueAndValidity({ emitEvent: false });
    }
    if (this.context()?.eligibility !== 'supported' || ['unknown', 'committed', 'denied'].includes(this.state())) return;
    this.state.set('editing'); this.message.set('הפרטים השתנו. נדרשת בדיקה ותצוגה מקדימה חדשה — טרם בוצע שינוי.');
  }
  blocked() {
    return this.safety.affectsEmployee(this.employeeId) || this.stage.affectsEmployee(this.employeeId) ||
      this.station.affectsEmployee(this.employeeId) || this.exit.affectsEmployee(this.employeeId);
  }
  private binding() {
    return JSON.stringify({ principal: this.principal(), employeeId: this.employeeId, dayId: this.dayId,
      context: this.context(), kind: this.kind(), draft: this.kind() === 'csv-create' ? null : this.buildDraft(),
      encoding: this.encoding.value });
  }
  recheckIdentity() {
    if (this.state() === 'submitting' || this.state() === 'unknown') { this.unknown(); return; }
    this.invalidate(); this.clearFile(); this.identityWork?.unsubscribe(); this.context.set(null);
    this.principal.set(null); this.identityState.set('loading'); this.identityMessage.set('');
    this.state.set('loading'); this.message.set('טוענים זהות והקשר עובד/ת מהשרת.');
    const gen = this.generation;
    this.identityWork = this.identityApi.identity().subscribe({
      next: p => {
        if (!this.active(gen)) return;
        if (!managementIdentity(p)) { this.deny('זהות לא תקפה — אין הרשאות חלופיות ואין הנחת מנהל מערכת.'); return; }
        this.principal.set(p); this.identityState.set('ready');
        if (!canManage(p)) { this.deny('אין הרשאות ניהול משמרות מתאימות למקור זה. הבירורים נשארים לקריאה בלבד.'); return; }
        if (!id(this.employeeId) || this.dayId !== null && !id(this.dayId, 10)) {
          this.state.set('error'); this.message.set('הקשר עובד/ת או משמרת חסר או לא תקף. יש לבחור רשומה מתוך בירור.'); return;
        }
        if (this.blocked()) { this.unknown(); return; }
        this.loadContext(p, this.employeeId, this.dayId, gen);
      },
      error: () => { if (this.active(gen)) this.deny('לא ניתן לאמת זהות. לא הוענקו הרשאות חלופיות.'); },
    });
  }
  private deny(message: string) {
    this.state.set('denied'); this.identityState.set('error'); this.identityMessage.set(message);
    this.message.set(message); this.focus();
  }
  private loadContext(p: IdentityResponseV1, employeeId: string, dayId: string | null, gen: number) {
    this.work = this.api.context(p, employeeId, dayId).subscribe({
      next: c => {
        if (!this.active(gen)) return;
        this.context.set(structuredClone(c)); this.ruleErrors.set([]);
        const selected = c.selected;
        if (selected) this.form.patchValue({
          startDate: dateFromWire(selected.startLocal.slice(0, 10)), endDate: dateFromWire(selected.endLocal.slice(0, 10)),
          startTime: selected.startLocal.slice(11, 16), endTime: selected.endLocal.slice(11, 16),
          activityCode: selected.activityCode, workLocation: selected.workLocation,
        }, { emitEvent: false });
        this.form.enable({ emitEvent: false }); this.encoding.enable({ emitEvent: false });
        this.state.set(c.eligibility === 'supported' ? 'editing' : c.eligibility === 'already-cancelled' ? 'cancelled' : 'deferred');
        this.message.set(c.eligibility === 'supported' ? 'הקשר מוכן לעריכה. בדיקה וסקירה אינן שומרות שינוי.' :
          c.eligibility === 'already-cancelled' ? 'המשמרת כבר מבוטלת — מצב נצפה בלבד, לא קבלת פעולה. אין שחזור או ביטול נוסף.' :
            'הפעולה אינה נתמכת בהקשר הנוכחי. אין עקיפת מנהל ואין שינוי נוכחות או פרטים תלויים.');
        afterNextRender(() => {
          if (this.active(gen) && !this.journey.restore(this.host.nativeElement)) this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus();
        }, { injector: this.injector });
      },
      error: e => { if (this.active(gen)) this.failure(e, null); },
    });
  }
  chooseKind(kind: ShiftOperationKindV1) {
    if (!this.editable() || this.busy() ||
      !canManage(this.principal(), kind) || (this.dayId ? !['change', 'cancel'].includes(kind) : !['create', 'csv-create'].includes(kind))) return;
    this.kind.set(kind); this.form.controls.remark.reset('', { emitEvent: false });
    this.edited();
  }
  busy() { return ['loading', 'preparing', 'confirming', 'submitting'].includes(this.state()) || this.fileReading(); }
  editable() { return this.context()?.eligibility === 'supported' &&
    !['loading', 'submitting', 'committed', 'unknown', 'denied'].includes(this.state()) && !this.blocked(); }
  canPrepare() { return this.editable() && !this.busy() && canManage(this.principal(), this.kind()); }
  allowedKind(kind: ShiftOperationKindV1) { return this.editable() && !this.busy() && canManage(this.principal(), kind); }
  startChanged() { const c = this.context()?.selected; return !!c && this.local('start') !== c.startLocal; }
  endChanged() { const c = this.context()?.selected; return !!c && this.local('end') !== c.endLocal; }
  private local(edge: 'start' | 'end'): string | null {
    const d = this.form.controls[edge === 'start' ? 'startDate' : 'endDate'].value;
    const t = this.form.controls[edge === 'start' ? 'startTime' : 'endTime'].value;
    return d && Number.isFinite(d.getTime()) && /^\d{2}:\d{2}$/.test(t) ? `${dateWire(d)}T${t}:00` : null;
  }
  buildDraft(): ShiftDraftV1 | null {
    const c = this.context(), f = this.form.getRawValue(), kind = this.kind();
    const r = f.remark === '' ? null : f.remark;
    if (!c || kind === 'csv-create') return null;
    if (kind === 'cancel') {
      if (!this.dayId || !f.reasonCode || !c.cancelReasonOptions.some(o => o.code === f.reasonCode)) return null;
      const d = { kind, shiftDayId: this.dayId, reasonCode: f.reasonCode, remark: r };
      return draft(d) ? d : null;
    }
    const startLocal = this.local('start'), endLocal = this.local('end');
    if (!startLocal || !endLocal || !f.activityCode || !f.workLocation ||
      !c.activityOptions.some(o => o.code === f.activityCode) || !c.workLocationOptions.includes(f.workLocation)) return null;
    const common = { startLocal, endLocal, activityCode: f.activityCode, workLocation: f.workLocation };
    if (kind === 'create') {
      const d = { kind, ...common, remark: r }; return draft(d) ? d : null;
    }
    if (!this.dayId || this.startChanged() && !c.startEndReasonOptions.some(o => o.code === f.startReasonCode) ||
      this.endChanged() && !c.startEndReasonOptions.some(o => o.code === f.endReasonCode)) return null;
    const d = { kind, shiftDayId: this.dayId, ...common,
      startReasonCode: this.startChanged() ? f.startReasonCode : null,
      endReasonCode: this.endChanged() ? f.endReasonCode : null };
    return draft(d) ? d : null;
  }
  pickTime(edge: 'start' | 'end') {
    if (!this.editable()) return;
    const control = this.form.controls[edge === 'start' ? 'startTime' : 'endTime'];
    const ref = this.dialog.open<MinutePicker, string, string>(MinutePicker, { data: /^\d{2}:\d{2}$/.test(control.value) ? control.value : '00:00',
      direction: 'rtl', width: '420px', maxWidth: 'calc(100vw - 24px)', restoreFocus: true });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(v => { if (v && this.editable()) control.setValue(v); });
  }
  async selectFile(event: Event) {
    if (!this.editable()) return;
    const input = event.target as HTMLInputElement, file = input.files?.[0];
    this.edited(); this.clearFile(); input.value = '';
    if (!file) return;
    if (file.size === 0 || file.size > 1048576) {
      this.state.set('error'); this.message.set('נדרש קובץ שאינו ריק ועד 1 MiB. הקובץ לא נשלח.'); this.focus(); return;
    }
    const gen = this.generation; this.fileReading.set(true);
    try {
      const bytes = await file.arrayBuffer();
      if (!this.active(gen)) return;
      this.bytes = bytes; this.filename.set(file.name); this.fileReading.set(false);
    } catch {
      if (this.active(gen)) { this.clearFile(); this.state.set('error'); this.message.set('לא ניתן לקרוא את הקובץ. לא נשלחה בקשה.'); this.focus(); }
    }
  }
  downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['personalId,activityCode,date,location,startTime,endTime\r\n'],
      { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'shift-template.csv'; a.click(); URL.revokeObjectURL(url);
  }
  prepare() {
    if (!this.canPrepare()) return;
    const c = this.context()!, kind = this.kind(), d = this.buildDraft(), enc = this.encoding.value;
    if (kind === 'csv-create' ? !this.bytes || !enc : !d) {
      this.message.set('יש להשלים ערכים תקפים: תאריכים מלאים, שעות 24 שעות, פעילות, מיקום וסיבות נדרשות; בייבוא נדרשים קובץ וקידוד מפורש.');
      this.form.markAllAsTouched(); this.focus();
      afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid, mat-select.ng-invalid')?.focus(),
        { injector: this.injector });
      return;
    }
    this.invalidate(); this.ruleErrors.set([]); this.parameterErrors.set([]); this.reference.set('');
    const gen = this.generation, binding = this.binding();
    this.state.set('preparing'); this.message.set('בדיקה טהורה מהשרת — ללא שינוי נתונים.');
    if (kind === 'csv-create' && enc && this.bytes) {
      this.work = this.api.preview(c, this.bytes, enc).subscribe({
        next: v => {
          if (!this.active(gen) || binding !== this.binding()) return;
          this.preview.set(structuredClone(v));
          if (v.state === 'invalid') {
            this.state.set('invalid'); this.message.set('הקובץ אינו תקף. אף שורה לא הוחלה; יש לתקן בקובץ ולבדוק מחדש.'); this.focus(); return;
          }
          this.ready(gen, binding, v.expiresAt);
        }, error: e => { if (this.active(gen)) this.failure(e, null); },
      });
    } else if (d) {
      this.submittedDraft = structuredClone(d);
      this.work = this.api.prepare(c, d).subscribe({
        next: v => {
          if (!this.active(gen) || binding !== this.binding()) return;
          this.prepared.set(structuredClone(v)); this.ready(gen, binding, v.expiresAt);
        }, error: e => { if (this.active(gen)) this.failure(e, null); },
      });
    }
  }
  private ready(gen: number, binding: string, expiresAt: string) {
    this.bound = binding; this.preparedSnapshot = JSON.stringify({ p: this.prepared(), csv: this.preview() });
    this.state.set('review'); this.message.set('בדיקה הושלמה. טרם נשמר שינוי — נדרשת סקירה ואישור מפורש.');
    // Conservative UI expiry relative to server observation; never browser wall-clock eligibility.
    const c = this.context()!;
    const duration = Math.min(120000, Math.max(0, Date.parse(expiresAt) - Date.parse(c.serverTime.instant)));
    this.deadline = setTimeout(() => {
      if (!this.active(gen) || this.state() === 'submitting') return;
      this.invalidate(); this.state.set('expired'); this.message.set('תוקף הסקירה פג. נדרשת בדיקה חדשה. לא נשלחה פקודה.'); this.focus();
    }, duration);
    this.focus('#management-review');
  }
  effects(): ShiftEffectV1[] {
    return this.prepared()?.effects ?? this.preview()?.rows.flatMap(r => r.effect ? [r.effect] : []) ?? [];
  }
  validRows() { return this.preview()?.rows.filter(r => r.effect !== null && !r.errors.length).length ?? 0; }
  csvErrorIds(line: number, fields: string[]) {
    const errors = this.preview()?.rows.find(row => row.line === line)?.errors ?? [];
    const ids = errors.flatMap((e, i) => fields.includes(e.column) || e.column === 'row' ? [`csv-error-${line}-${i}`] : []);
    return ids.length ? ids.join(' ') : null;
  }
  reviewOperation() {
    if (this.state() !== 'review' || this.review || this.blocked() || this.bound !== this.binding() ||
      this.preparedSnapshot !== JSON.stringify({ p: this.prepared(), csv: this.preview() })) return;
    const gen = this.generation, binding = this.bound;
    this.state.set('confirming');
    const ref = this.dialog.open<ShiftManagementDialog, ManagementReview, ManagementConsent>(ShiftManagementDialog, {
      data: { kind: this.kind(), native: this.context()!.dataSource === 'oracle-test', effects: structuredClone(this.effects()) },
      direction: 'rtl', width: '780px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      autoFocus: '#management-review-heading', restoreFocus: false, ariaLabelledBy: 'management-review-heading',
      enterAnimationDuration: 0, exitAnimationDuration: 0,
    });
    this.review = ref;
    const instance = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(consent => {
      if (!this.active(gen)) return;
      this.review = undefined;
      if (!consent) { this.state.set('review'); this.focus('#management-review'); return; }
      if (binding !== this.binding() || !sameWarnings(consent.warningCodes, warningsFor(this.effects())) ||
        consent.accepted !== true || !instance.canConfirm()) {
        this.invalidate(); this.state.set('editing'); this.message.set('האישור אינו תואם לסקירה. יש לבדוק מחדש.'); this.focus(); return;
      }
      this.submit(binding);
    });
  }
  private submit(binding: string) {
    const c = this.context(), p = this.prepared(), csv = this.preview(), kind = this.kind();
    if (!c || this.blocked() || binding !== this.binding() ||
      this.preparedSnapshot !== JSON.stringify({ p, csv }) || !canManage(this.principal(), kind)) return;
    const commandId = crypto.randomUUID();
    const common = { commandId, fingerprint: p?.fingerprint ?? csv?.fingerprint ?? '',
      operationConfirmation: { accepted: true as const }, acknowledgedWarningCodes: warningsFor(this.effects()) };
    let body: ShiftCommandV1 | CsvShiftCommandV1;
    if (kind === 'csv-create' && csv?.state === 'ready') body = { ...common, previewToken: csv.previewToken };
    else if (p && this.submittedDraft && equal(this.submittedDraft, this.buildDraft()))
      body = { ...common, draft: structuredClone(this.submittedDraft), validationToken: p.validationToken };
    else return;
    const expected: ReceiptBinding = { employeeId: c.employeeId, commandId, kind, dataSource: c.dataSource,
      businessTimeZone: c.businessTimeZone, effects: structuredClone(this.effects()) };
    if (!this.safety.begin(c.employeeId, binding, commandId)) { this.unknown(); return; }
    if (this.deadline) clearTimeout(this.deadline);
    this.form.disable({ emitEvent: false }); this.encoding.disable({ emitEvent: false });
    this.state.set('submitting'); this.message.set('הפקודה נשלחה. ניווט או סגירה אינם מבטלים שמירה שנשלחה. אין לשלוח שוב.'); this.focus();
    const gen = this.generation;
    try {
      this.commandWork = this.api.command(c, body, expected).subscribe({
        next: r => {
          if (!this.active(gen) || this.state() !== 'submitting') return;
          if (binding !== this.binding()) { this.unknown(); return; }
          if (!this.safety.resolve(c.employeeId, binding, commandId)) { this.unknown(); return; }
          this.receipt.set(structuredClone(r)); this.invalidate(); this.clearFile(); this.state.set('committed');
          this.message.set(r.dataSource === 'oracle-test' ? 'השינוי נשמר במסד TEST ואומת בקריאה נפרדת' :
            'השינוי הוחל בסימולציה מבודדת בלבד — אין כתיבה ל־Oracle');
          this.focus();
        },
        error: e => {
          if (!this.active(gen) || this.state() !== 'submitting') return;
          if (binding !== this.binding()) { this.unknown(); return; }
          if (this.problemEnvelope(e) && managementProblem(e.error, e.status, commandId) && e.error.effect !== 'unknown' &&
            this.safety.resolve(c.employeeId, binding, commandId)) {
            this.form.enable({ emitEvent: false }); this.encoding.enable({ emitEvent: false });
            this.failure(e, commandId);
          } else this.unknown();
        },
      });
    } catch { this.unknown(); }
  }
  private problemEnvelope(e: unknown): e is HttpErrorResponse {
    return e instanceof HttpErrorResponse && /^application\/problem\+json(?:;\s*charset=utf-8)?$/i.test(e.headers.get('Content-Type') ?? '') &&
      !!e.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') &&
      e.headers.get('X-Content-Type-Options')?.toLowerCase() === 'nosniff';
  }
  private failure(e: unknown, commandId: string | null) {
    this.invalidate(); this.state.set('error');
    this.message.set('לא ניתן להשלים את הבקשה. הערכים נשמרו לעריכה; אין הצגת הצלחה.');
    let firstField: string | null = null;
    if (this.problemEnvelope(e) && managementProblem(e.error, e.status, commandId)) {
      const p = e.error;
      this.reference.set(p.requestId); this.ruleErrors.set(p.ruleViolations ?? []);
      this.parameterErrors.set(p.invalidParameters ?? []);
      if (p.nextAction === 'stop') {
        this.state.set(p.code === 'ALREADY_CANCELLED' ? 'cancelled' : 'denied');
        this.form.disable({ emitEvent: false }); this.encoding.disable({ emitEvent: false });
      }
      else if (p.nextAction === 'prepare-again') this.state.set('expired');
      else if (p.nextAction === 'correct-and-validate') {
        for (const field of [...(p.invalidParameters ?? []).map(v => v.name), ...(p.ruleViolations ?? []).flatMap(v => v.field ? [v.field] : [])]) {
          const name = field === 'startLocal' ? 'startDate' : field === 'endLocal' ? 'endDate' : field;
          const control = this.form.get(name);
          if (control) {
            control.setErrors({ ...control.errors, server: true }); control.markAsTouched();
            firstField ??= name;
          }
        }
      }
      if (p.code === 'SHIFT_DAY_NOT_FOUND') this.message.set('העובד/ת או המשמרת לא נמצאו בהיקף המורשה. אין בחירה חלופית.');
      else if (p.code === 'ALREADY_CANCELLED') this.message.set('המשמרת כבר מבוטלת. אין קבלה משוחזרת ואין ביטול נוסף.');
    }
    this.focus();
    if (firstField) this.focus('#management-' + firstField);
  }
  private unknown() {
    this.invalidate(); this.clearFile(); this.state.set('unknown');
    this.form.disable({ emitEvent: false }); this.encoding.disable({ emitEvent: false });
    this.message.set('תוצאת העדכון אינה ידועה. אין לשלוח שוב; נדרשת בדיקת מפעיל.'); this.focus();
  }
  canLeave(): boolean {
    if (this.state() !== 'submitting') return true;
    if (!window.confirm('הפקודה כבר נשלחה. ניווט אינו מבטל אותה; יידרש בירור מפעיל אם התוצאה תאבד. להמשיך?')) return false;
    this.unknown(); return true;
  }
}
