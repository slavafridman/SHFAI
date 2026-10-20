import { afterNextRender, Component, DestroyRef, ElementRef, Injector, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { identity, displayTime, type IdentityResponseV1 } from './contract';
import { actorBinding, arrivalContext, arrivalValidation, arrivalReceipt, arrivalProblem,
  f1Identity, type StageArrivalContextDraftV1, type StageArrivalValidationDraftV1,
  type StageArrivalReceiptDraftV1, type StageArrivalCommitDraftV1, type ArrivalSelection } from './stage-arrival-contract';
import { StageArrivalSession } from './stage-arrival-session';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';

@Component({
  selector: 'shf-arrival-warning',
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>אזהרת איחור — סימולציה בלבד
      <small class="warning-isolation">ללא Oracle, ללא הגעה אמיתית</small>
    </h2>
    <mat-dialog-content dir="rtl">
      <p>ללא Oracle, ללא הגעה אמיתית. אימות זהות אמיתי לא בוצע.</p>
      <p>{{ data.name }} · תחילה מתוכננת: <bdi dir="ltr">{{ displayTime(data.planned) }}</bdi></p>
      <p>זמן שנבדק בשרת: <bdi dir="ltr">{{ displayTime(data.validation.evaluatedLocal) }}</bdi>
        · <bdi>{{ data.validation.businessTimeZone }}</bdi></p>
      <p>איחור שחושב בשרת: {{ data.validation.warnings[0].minutes }} דקות.</p>
      <p>סיבה: {{ data.reason }}. האישור כאן מעביר לסקירת הפעולה בלבד, ללא רישום.</p>
      <mat-checkbox id="arrival-warning-ack" [formControl]="accepted">קראתי את האזהרה המדויקת</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(false)">ביטול</button>
      <button id="arrival-warning-review" mat-flat-button type="button" [disabled]="!accepted.value"
        (click)="review()">מעבר לסקירת סימולציה</button>
    </mat-dialog-actions>`,
  styles: [`:host { display:flex; flex-direction:column; max-height:calc(100dvh - 24px); min-height:0; overflow-wrap:anywhere; }
    button { min-height:48px; height:auto; max-width:100%; white-space:normal; }
    [mat-dialog-title], mat-dialog-actions { flex-shrink:0; }
    mat-dialog-content { flex:1 1 auto; min-height:0; max-height:none; overflow:auto; }
    .warning-isolation { display:block; font-size:.6em; line-height:1.4; padding:6px; background:#fff4cc; color:#493600; border-inline-start:4px solid #856300; }
    mat-dialog-actions { flex-wrap:wrap; gap:8px; }`],
})
export class ArrivalWarning {
  readonly data = inject<{ name: string; planned: string; reason: string; validation: StageArrivalValidationDraftV1 }>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ArrivalWarning>);
  readonly accepted = new FormControl(false, { nonNullable: true });
  readonly displayTime = displayTime;
  reviewed = false;
  review() { if (this.accepted.value) { this.reviewed = true; this.ref.close(true); } }
}
type State = 'chooser' | 'loading' | 'ready' | 'ineligible' | 'validating' | 'warning' |
  'review' | 'committing' | 'success' | 'error' | 'expired' | 'unknown' | 'recovery' | 'denied';

@Component({
  selector: 'shf-stage-arrival',
  imports: [WorkspaceShell, RouterLink, MatButtonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './stage-arrival-page.html', styleUrl: './stage-arrival-page.scss',
})
export class StageArrivalPage {
  readonly session = inject(StageArrivalSession);
  readonly journey = inject(ViewHistory);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SliceApi);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialog = inject(MatDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly state = signal<State>('chooser');
  readonly context = signal<StageArrivalContextDraftV1 | null>(null);
  readonly validation = signal<StageArrivalValidationDraftV1 | null>(null);
  readonly receipt = signal<StageArrivalReceiptDraftV1 | null>(null);
  readonly commandSent = signal(false);
  readonly halted = signal(false);
  readonly message = signal('');
  readonly selection = signal<ArrivalSelection | null>(null);
  readonly reason = new FormControl<string | null>(null);
  readonly displayTime = displayTime;
  private work?: Subscription;
  private identityWork?: Subscription;
  private generation = 0;
  private alive = true;
  private bound = '';
  private acknowledged = '';
  private prepared = '';
  private deadline = 0;
  private warning?: MatDialogRef<ArrivalWarning>;
  reasonLabel() { return this.context()?.lateReasonOptions.find(o => o.code === this.reason.value)?.label ?? 'לא נבחרה סיבה'; }
  blockerLabel(code: StageArrivalContextDraftV1['blockers'][number]) {
    return ({
      ATTENDANCE_ROW_REQUIRED: 'אין רשומת נוכחות קיימת — לא תתווסף רשומה.',
      MISSING_PRESENT: 'קיימת אי־נוכחות הדורשת טיפול מחוץ לסימולציה.',
      REPORT_REVIEW_REQUIRED: 'נדרשת בדיקת דיווחים לפני המשך.',
      UNSUPPORTED_DAY: 'יום העבודה אינו נתמך בסימולציה זו.',
      DEPENDENT_ATTENDANCE_PRESENT: 'קיימים דיווחי עמדה או יציאה — הפעולה אינה בסקופ.',
      EXISTING_STAGE_LATE: 'קיימים פרטי איחור רשומים.',
      BRIEFING_PRESENT: 'קיים תדריך רשום.',
    } as const)[code];
  }
  constructor() {
    effect(() => {
      const pending = this.state() === 'validating' || this.state() === 'committing';
      if (pending && this.reason.enabled) this.reason.disable({ emitEvent: false });
      else if (!pending && this.reason.disabled) this.reason.enable({ emitEvent: false });
    });
    // Only a volatile immutable selected-row snapshot per entry. NEVER attach
    // draft/preparation/token/acknowledgment/receipt to history or local slots.
    this.journey.attach(this.host.nativeElement, () => ({ arrivalSelection: this.selection() }));
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    });
    this.reason.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.state() === 'committing') { this.unknown(); return; }
      this.invalidate();
      if (this.context()?.eligibility === 'eligible' && this.allowed() && !this.halted() && !this.session.blocked(this.selection()))
        this.state.set('ready');
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.invalidate(); this.context.set(null); this.receipt.set(null);
      this.reason.reset(null, { emitEvent: false });
      const restored = this.journey.saved<{ arrivalSelection: ArrivalSelection | null }>();
      const s = restored ? restored.arrivalSelection : this.session.selection;
      const selected = s && s.employeeId === params.get('employeeId') && s.shiftDayId === params.get('shiftDayId') ? structuredClone(s) : null;
      this.selection.set(selected);
      if (selected) this.session.selection = structuredClone(selected);
      this.recheck();
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.invalidate(); this.identityWork?.unsubscribe();
      // Pending marker is intentionally not resolved by unsubscribe/navigation.
    });
  }
  allowed() { return this.identityState() === 'ready' && f1Identity(this.principal()); }
  private invalidate() {
    this.generation++; this.work?.unsubscribe(); this.warning?.close(false); this.warning = undefined;
    this.validation.set(null); this.bound = ''; this.acknowledged = ''; this.prepared = ''; this.deadline = 0;
  }
  recheck() {
    const pending = this.state() === 'committing';
    this.invalidate(); this.identityWork?.unsubscribe(); this.context.set(null); this.receipt.set(null);
    this.commandSent.set(false);
    this.halted.set(false);
    this.principal.set(null); this.identityState.set('loading'); this.reason.reset(null, { emitEvent: false });
    this.state.set(pending || this.session.uncertain() ? 'recovery' : 'loading');
    const gen = this.generation;
    this.identityWork = this.api.identity().subscribe({
      next: v => {
        if (!this.active(gen) || this.identityState() !== 'loading') return;
        if (!identity(v)) { this.identityState.set('error'); this.state.set('denied'); this.message.set('אין זהות תקפה. אין כניסה חלופית כמנהל מערכת.'); return; }
        this.principal.set(v); this.identityState.set('ready');
        if (!this.allowed()) { this.state.set('denied'); this.message.set('קריאה בלבד: סימולציה זמינה רק במופע מבודד עם שתי ההרשאות הנפרדות.'); return; }
        if (this.session.uncertain()) { this.recovery(); return; }
        const s = this.selection();
        if (!s) { this.state.set('chooser'); return; }
        if (s.actor !== actorBinding(v) || !v.principal.resourceScope.orgUnitIds.includes(s.orgUnitId)) {
          this.state.set('denied'); this.selection.set(null); this.message.set('הזהות או ההרשאות השתנו. יש לבחור רשומה מחדש בבירור נוכחות.'); return;
        }
        this.loadContext();
      },
      error: () => { if (this.active(gen)) { this.identityState.set('error'); this.state.set('denied'); this.message.set('לא ניתן לאמת זהות. אין הרשאות חלופיות.'); } },
    });
  }
  private active(gen: number) { return this.alive && gen === this.generation; }
  private problemMedia(e: HttpErrorResponse) {
    return /^application\/problem\+json(?:;\s*charset=utf-8)?$/i.test(e.headers.get('Content-Type') ?? '') &&
      e.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') &&
      e.headers.get('X-Content-Type-Options')?.toLowerCase() === 'nosniff';
  }
  private recovery() {
    this.state.set('recovery');
    this.message.set('RECOVERY REQUIRED — תוצאה קודמת לא הוכרעה. אין להכין או לשלוח רישום חדש.');
  }
  private loadContext() {
    const s = this.selection();
    if (!this.allowed() || !s || this.session.uncertain()) return;
    const gen = this.generation; this.state.set('loading');
    this.work = this.api.stageArrivalContext(s.employeeId, s.shiftDayId).subscribe({
      next: v => {
        if (!this.active(gen) || this.state() !== 'loading') return;
        if (!arrivalContext(v, s) || !this.sameSelection(s)) { this.fail('הקשר לא עקבי או מקור לא מבודד. הפעולה חסומה.'); return; }
        this.context.set(v); this.state.set(v.eligibility === 'eligible' && !this.session.recorded(s) ? 'ready' : 'ineligible');
        if (this.session.recorded(s)) {
          this.message.set('הפעולה כבר אושרה בסימולציה במופע זה. אין רישום נוסף; הקשר השרת מוצג לקריאה בלבד.');
          return;
        }
        this.message.set(v.eligibility === 'eligible' ? 'ההקשר מוכן לבדיקה טהורה — טרם נשלחה פקודת רישום.' :
          'הרשומה אינה כשירה: אין הוספה, דריסה או ביטול שקט.');
      },
      error: e => { if (this.active(gen)) this.handleError(e, null); },
    });
  }
  private sameSelection(s: ArrivalSelection) {
    return this.allowed() && JSON.stringify(this.session.selection) === JSON.stringify(s) &&
      this.principal() !== null && s.actor === actorBinding(this.principal()!);
  }
  private binding() {
    return JSON.stringify([this.generation, this.selection(), this.session.selection,
      this.principal(), this.context(), this.reason.value]);
  }
  canValidate() {
    return this.allowed() && !this.halted() && !!this.context() && this.context()!.eligibility === 'eligible' &&
      !this.session.blocked(this.selection()) && ['ready', 'error', 'expired'].includes(this.state());
  }
  validate() {
    if (!this.canValidate()) return;
    const s = this.selection()!, c = this.context()!;
    if (!this.sameSelection(s)) { this.fail('ההקשר השתנה. יש לבחור את הרשומה מחדש.'); return; }
    if (this.reason.value !== null && !c.lateReasonOptions.some(o => o.code === this.reason.value)) {
      this.fail('יש לבחור סיבה מהאפשרויות שהשרת החזיר.'); return;
    }
    this.invalidate(); const gen = this.generation, binding = this.binding(), started = performance.now();
    this.commandSent.set(false);
    this.state.set('validating'); this.message.set('בודקים בלבד — ללא שינוי עסקי.');
    this.work = this.api.stageArrivalValidate(s.employeeId, s.shiftDayId, { lateReasonCode: this.reason.value, lateRemark: null }).subscribe({
      next: v => {
        if (!this.active(gen) || this.state() !== 'validating') return;
        if (this.binding() !== binding || !arrivalValidation(v, c) ||
          (v.confirmationRequired ? this.reason.value === null : this.reason.value !== null)) {
          this.fail('תשובת הבדיקה אינה תואמת להקשר ולטיוטה. יש לבדוק מחדש.'); return;
        }
        const admitted = structuredClone(v);
        this.validation.set(admitted); this.bound = binding; this.prepared = JSON.stringify(admitted);
        // Elapsed monotonic time only, never derive business lateness from client clock.
        this.deadline = started + Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt);
        if (this.expired()) return;
        if (admitted.confirmationRequired) this.showWarning(admitted, gen, binding);
        else { this.state.set('review'); this.message.set('יש לסקור את כל הפעולה. הבדיקה לא רשמה הגעה.'); }
      },
      error: e => { if (this.active(gen)) this.handleError(e, null); },
    });
  }
  private showWarning(v: StageArrivalValidationDraftV1, gen: number, binding: string) {
    this.state.set('warning');
    const ref = this.dialog.open(ArrivalWarning, {
      data: { name: this.selection()!.name, planned: this.context()!.planned.startLocal,
        reason: this.context()!.lateReasonOptions.find(o => o.code === this.reason.value)?.label ?? 'סיבה ללא תיאור', validation: structuredClone(v) },
      direction: 'rtl', width: '560px', maxWidth: 'calc(100vw - 24px)', restoreFocus: true,
      maxHeight: 'calc(100dvh - 24px)',
      autoFocus: 'first-tabbable', enterAnimationDuration: 0, exitAnimationDuration: 0,
      ariaLabel: 'אזהרת איחור — מעבר לסקירה בלבד, ללא רישום',
    });
    this.warning = ref;
    const warning = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
      if (!this.active(gen)) return;
      if (binding !== this.binding() || this.prepared !== JSON.stringify(this.validation())) {
        this.invalidate(); this.fail('ההקשר או פרטי הבדיקה השתנו. נדרשת בדיקה חדשה.'); return;
      }
      this.warning = undefined;
      if (accepted !== true || !warning.reviewed || !warning.accepted.value) {
        this.invalidate(); this.state.set('ready'); this.message.set('האזהרה בוטלה. לא נשלחה פקודת רישום.'); return;
      }
      if (this.expired()) return;
      this.acknowledged = binding; this.state.set('review'); this.message.set('האזהרה נקראה. עדיין נדרש אישור סימולציה מפורש.');
    });
  }
  private expired() {
    if (!this.validation() || performance.now() >= this.deadline) {
      this.invalidate(); this.state.set('expired'); this.message.set('תוקף הבדיקה פג. יש לבדוק ולסקור מחדש; לא נשלחה פקודה.'); return true;
    }
    return false;
  }
  confirm() {
    if (this.state() !== 'review') return;
    if (!this.allowed() || this.session.blocked(this.selection())) {
      this.invalidate(); this.context.set(null); this.reason.reset(null, { emitEvent: false });
      if (this.session.uncertain()) this.recovery();
      else if (this.selection() && this.session.recorded(this.selection()!))
        this.fail('הפעולה כבר אושרה בסימולציה במופע זה. אין לשלוח רישום נוסף.');
      else { this.principal.set(null); this.state.set('denied'); this.message.set('הזהות או מקור ההדגמה אינם תקפים. הפעולה חסומה.'); }
      return;
    }
    const s = this.selection()!, c = this.context()!, v = this.validation();
    if (!v || this.prepared !== JSON.stringify(v) || this.bound !== this.binding() || !this.sameSelection(s) ||
      (v.confirmationRequired && this.acknowledged !== this.bound)) {
      this.invalidate(); this.fail('ההקשר או אישור האזהרה השתנו. נדרשת בדיקה חדשה.'); return;
    }
    if (this.expired()) return;
    const command: StageArrivalCommitDraftV1 = { commandId: crypto.randomUUID(),
      draft: { lateReasonCode: this.reason.value, lateRemark: null }, validationToken: v.validationToken,
      fingerprint: v.fingerprint,
      confirmation: v.confirmationRequired ? { accepted: true, warningCodes: ['STAGE_ARRIVAL_LATE'] } : null };
    // Persist BEFORE POST. Failure to establish safety means no POST.
    if (!this.session.begin(s, command.commandId)) { this.recovery(); return; }
    const gen = this.generation, binding = this.bound;
    this.commandSent.set(true); this.state.set('committing'); this.message.set('פקודת סימולציה נשלחה. אין לשלוח שוב; עזיבה אינה ביטול.');
    this.work = this.api.stageArrivalCommand(s.employeeId, s.shiftDayId, command).subscribe({
      next: value => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || this.prepared !== JSON.stringify(this.validation()) ||
          !this.sameSelection(s) || !arrivalReceipt(value, c, command, v)) { this.unknown(); return; }
        this.session.resolve(s, command.commandId); this.receipt.set(value); this.validation.set(null);
        this.state.set('success'); this.message.set('הסימולציה נרשמה בזיכרון המופע בלבד. זו אינה הגעה אמיתית.');
      },
      error: e => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (!(e instanceof HttpErrorResponse) || !this.problemMedia(e) || !arrivalProblem(e.error, e.status, command.commandId) ||
          e.error.effect === 'unknown' ||
          e.error.code === 'COMMAND_IN_PROGRESS' || e.error.code === 'COMMAND_ID_CONFLICT') { this.unknown(); return; }
        this.session.resolve(s, command.commandId, false);
        this.handleError(e, command.commandId);
      },
    });
  }
  private handleError(e: unknown, commandId: string | null) {
    this.validation.set(null); this.bound = ''; this.acknowledged = '';
    if (e instanceof HttpErrorResponse && this.problemMedia(e) && arrivalProblem(e.error, e.status, commandId)) {
      this.state.set(e.error.nextAction === 'prepare-again' && commandId === null ? 'expired' : 'error');
      this.message.set(`${e.error.code} — ${e.error.effect === 'rolled-back' ? 'השרת אישר ביטול מלא של שינוי ההדגמה' : 'השרת דחה לפני שינוי'}. אין ניסיון חוזר אוטומטי.`);
      this.halted.set(e.error.nextAction === 'stop');
      if (e.status === 422) {
        if (this.reason.disabled) this.reason.enable({ emitEvent: false });
        this.reason.setErrors({ server: true }); this.reason.markAsTouched();
        const gen = this.generation;
        afterNextRender(() => {
          if (this.active(gen) && this.reason.hasError('server'))
            this.host.nativeElement.querySelector<HTMLElement>('#arrival-reason')?.focus();
        }, { injector: this.injector });
      }
      if (e.status === 401 || e.status === 403) {
        this.principal.set(null); this.context.set(null); this.reason.reset(null, { emitEvent: false }); this.state.set('denied');
      }
    } else this.fail('לא ניתן להשלים בדיקה טהורה. לא נשלחה פקודת רישום. הטיוטה נשמרה.');
  }
  private fail(message: string) { this.state.set('error'); this.message.set(message); }
  private unknown() {
    this.invalidate(); this.receipt.set(null);
    this.state.set('unknown');
    this.message.set('UNKNOWN — תוצאת הרישום אינה ידועה. אין לשלוח שוב. אין אישור הצלחה או אפס השפעות; נדרש בירור עם בעל מופע ההדגמה.');
  }
  cancel() {
    if (this.state() === 'committing') return;
    this.invalidate(); this.journey.back('/attendance');
  }
}
