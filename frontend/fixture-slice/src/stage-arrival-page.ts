import { afterNextRender, Component, DestroyRef, ElementRef, Injector, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { identity, displayTime, type IdentityResponseV1 } from './contract';
import { actorBinding, arrivalContext, arrivalValidation, arrivalReceipt, arrivalProblem, arrivalCommand,
  arrivalIdentity, arrivalSource, type ArrivalContext, type ArrivalValidation,
  type ArrivalReceipt, type ArrivalCommand, type StageArrivalValidationDraftV1, type ArrivalSelection } from './stage-arrival-contract';
import { StageArrivalSession } from './stage-arrival-session';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';
import { StationArrivalSession } from './station-arrival-session';
import { StationExitSession } from './station-exit-session';
import { stationIdentity } from './station-arrival-contract';

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
  selector: 'shf-native-arrival-confirmation',
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>אישור עדכון Oracle TEST — לא סימולציה</h2>
    <mat-dialog-content dir="rtl">
      <p>Controlled TEST Oracle write · מקור: oracle-test. לא סביבת ייצור.</p>
      <p>עובד/ת: {{ data.selection.name }} · צוות <bdi>{{ data.context.orgUnitId }}</bdi></p>
      <p>מזהה עובד/ת: <bdi>{{ data.context.employeeId }}</bdi> · מזהה יום: <bdi>{{ data.context.shiftDayId }}</bdi></p>
      <p>יום: <bdi dir="ltr">{{ data.context.planned.startLocal.slice(0, 10) }}</bdi>.
        תחילה: <bdi dir="ltr">{{ time(data.context.planned.startLocal) }}</bdi> ·
        סיום: <bdi dir="ltr">{{ time(data.context.planned.endLocal) }}</bdi></p>
      <p>הגעה נוכחית: NULL / לא נרשמה → חותמת שרת מוצעת:
        <bdi dir="ltr">{{ time(data.validation.evaluatedLocal) }}</bdi> ·
        <bdi>{{ data.validation.businessTimeZone }}</bdi>.</p>
      <p>TADREECH: {{ data.context.recorded.briefing === null ? 'NULL' : '0' }} → 0 (ללא תדריך).
        שדה המפעיל יוחתם בשרת לפי המפעיל הסינתטי המורשה; ערכו הפרטי אינו חלק מהחוזה הציבורי.</p>
      <p>עדכון של שלושה שדות ברשומה קיימת אחת בלבד. הזמן הסופי ייקבע מחדש בשרת.
        איחור או חלון שפג יידחו, ללא עקיפה או שינוי שעה. שותף חיצוני לא יופעל.</p>
      <p>זהות מנהל סינתטית מקומית — ללא אימות סיסמה אמיתי.</p>
      <mat-checkbox id="native-operation-ack" [formControl]="accepted">אני מאשר/ת את כל פעולת עדכון TEST זו</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button id="native-operation-cancel" mat-button type="button" (click)="ref.close(false)">ביטול — ללא עדכון</button>
      <button id="native-operation-confirm" mat-flat-button type="button" [disabled]="!accepted.value"
        (click)="approve()">אישור עדכון TEST</button>
    </mat-dialog-actions>`,
  styles: [`:host { display:flex; flex-direction:column; min-height:0; max-height:calc(100dvh - 24px); overflow-wrap:anywhere; }
    mat-dialog-content { flex:1 1 auto; min-height:0; max-height:none; overflow:auto; }
    [mat-dialog-title], mat-dialog-actions { flex-shrink:0; }
    mat-dialog-actions { flex-wrap:wrap; gap:8px; }
    button { min-height:48px; height:auto; white-space:normal; max-width:100%; }`],
})
export class NativeArrivalConfirmation {
  readonly data = inject<{ selection: ArrivalSelection; context: ArrivalContext; validation: ArrivalValidation }>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<NativeArrivalConfirmation>);
  readonly accepted = new FormControl(false, { nonNullable: true });
  readonly time = displayTime;
  approved = false;
  approve() { if (this.accepted.value) { this.approved = true; this.ref.close(true); } }
}

@Component({
  selector: 'shf-stage-arrival',
  imports: [WorkspaceShell, RouterLink, MatButtonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './stage-arrival-page.html', styleUrl: './stage-arrival-page.scss',
})
export class StageArrivalPage {
  readonly station = inject(StationArrivalSession);
  readonly exit = inject(StationExitSession);
  private readonly router = inject(Router);
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
  readonly context = signal<ArrivalContext | null>(null);
  readonly validation = signal<ArrivalValidation | null>(null);
  readonly receipt = signal<ArrivalReceipt | null>(null);
  readonly commandSent = signal(false);
  readonly reviewOffered = signal(false);
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
  private operation?: MatDialogRef<NativeArrivalConfirmation>;
  private operationApproved = false;
  nativeMode() { return arrivalSource(this.principal()) === 'oracle-test' || this.selection()?.dataSource === 'oracle-test'; }
  reasonLabel() { return this.context()?.lateReasonOptions.find(o => o.code === this.reason.value)?.label ?? 'לא נבחרה סיבה'; }
  blockerLabel(code: ArrivalContext['blockers'][number]) {
    return ({
      ATTENDANCE_ROW_REQUIRED: 'אין רשומת נוכחות קיימת — לא תתווסף רשומה.',
      MISSING_PRESENT: this.nativeMode() ? 'קיימת אי־נוכחות הדורשת טיפול מחוץ לפיילוט.' : 'קיימת אי־נוכחות הדורשת טיפול מחוץ לסימולציה.',
      REPORT_REVIEW_REQUIRED: 'נדרשת בדיקת דיווחים לפני המשך.',
      UNSUPPORTED_DAY: this.nativeMode() ? 'יום העבודה אינו נתמך בפיילוט זה.' : 'יום העבודה אינו נתמך בסימולציה זו.',
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
  allowed() {
    return this.identityState() === 'ready' && arrivalIdentity(this.principal()) &&
      (!this.selection() || this.selection()!.dataSource === arrivalSource(this.principal()));
  }
  private invalidate() {
    this.generation++; this.work?.unsubscribe(); this.warning?.close(false); this.warning = undefined;
    this.operation?.close(false); this.operation = undefined;
    this.operationApproved = false;
    this.validation.set(null); this.bound = ''; this.acknowledged = ''; this.prepared = ''; this.deadline = 0;
  }
  recheck() {
    const pending = this.state() === 'committing';
    this.invalidate(); this.identityWork?.unsubscribe(); this.context.set(null); this.receipt.set(null);
    this.commandSent.set(false);
    this.reviewOffered.set(false);
    this.halted.set(false);
    this.principal.set(null); this.identityState.set('loading'); this.reason.reset(null, { emitEvent: false });
    this.state.set(pending || this.session.uncertain() ? 'recovery' : 'loading');
    const gen = this.generation;
    this.identityWork = this.api.identity().subscribe({
      next: v => {
        if (!this.active(gen) || this.identityState() !== 'loading') return;
        if (!identity(v)) { this.identityState.set('error'); this.state.set('denied'); this.message.set('אין זהות תקפה. אין כניסה חלופית כמנהל מערכת.'); return; }
        this.principal.set(v); this.identityState.set('ready');
        if (this.station.affects(this.selection()) || this.exit.affects(this.selection())) { this.recovery(); return; }
        if (!this.allowed()) { this.state.set('denied'); this.message.set('קריאה בלבד או מקור/הרשאות לא תואמים: נדרשת תצורה מפורשת. אין מעבר אוטומטי לסימולציה.'); return; }
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
        afterNextRender(() => {
          if (this.active(gen)) this.journey.restore(this.host.nativeElement);
        }, { injector: this.injector });
        if (this.session.recorded(s)) {
          this.message.set(this.nativeMode()
            ? 'הפעולה כבר אושרה במופע זה. אין רישום נוסף; הקשר השרת מוצג לקריאה בלבד.'
            : 'הפעולה כבר אושרה בסימולציה במופע זה. אין רישום נוסף; הקשר השרת מוצג לקריאה בלבד.');
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
      !this.session.blocked(this.selection()) && !this.station.affects(this.selection()) && !this.exit.affects(this.selection()) &&
      ['ready', 'error', 'expired'].includes(this.state());
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
        else { this.reviewOffered.set(true); this.state.set('review'); this.message.set('יש לסקור את כל הפעולה. הבדיקה לא רשמה הגעה.'); }
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
      panelClass: 'shf-arrival-dialog',
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
  /** Native dialog focus restoration must follow the pending/cancel render,
   * not Material's pre-layout restore. Later results only reveal an opener
   * that STILL owns focus; they never take it back from user navigation. */
  private keepCommandOpenerVisible(restore = false) {
    const opener = this.host.nativeElement.querySelector<HTMLButtonElement>('#arrival-confirm');
    const gen = this.generation;
    afterNextRender(() => {
      if (!this.active(gen) || !opener?.isConnected || !this.host.nativeElement.contains(opener)) return;
      if (restore) {
        if (document.activeElement !== document.body && document.activeElement !== opener) return;
        opener.focus({ preventScroll: true });
      }
      if (document.activeElement !== opener) return;
      const stickyBottom = Math.max(0, ...[...this.host.nativeElement.querySelectorAll<HTMLElement>('.topbar,.mockbar')]
        .filter(n => ['sticky', 'fixed'].includes(getComputedStyle(n).position))
        .map(n => n.getBoundingClientRect().bottom));
      const style = getComputedStyle(opener);
      const ring = (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0);
      // Measured header/ring geometry, not a viewport-specific Y offset.
      opener.style.scrollMarginBlockStart = `${stickyBottom + ring}px`;
      opener.style.scrollMarginBlockEnd = `${ring}px`;
      const rect = opener.getBoundingClientRect();
      if (rect.top - ring < stickyBottom || rect.bottom + ring > window.innerHeight)
        opener.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }, { injector: this.injector });
  }
  confirm(nativeAccepted = false) {
    if (this.state() !== 'review') return;
    if (!this.allowed() || this.session.blocked(this.selection()) || this.station.affects(this.selection()) || this.exit.affects(this.selection())) {
      this.invalidate(); this.context.set(null); this.reason.reset(null, { emitEvent: false });
      if (this.session.uncertain()) this.recovery();
      else if (this.selection() && this.session.recorded(this.selection()!))
        this.fail('הפעולה כבר אושרה במופע זה. אין לשלוח רישום נוסף.');
      else { this.principal.set(null); this.state.set('denied'); this.message.set('הזהות או מקור הפעולה אינם תקפים. הפעולה חסומה.'); }
      return;
    }
    const s = this.selection()!, c = this.context()!, v = this.validation();
    if (!v || this.prepared !== JSON.stringify(v) || this.bound !== this.binding() || !this.sameSelection(s) ||
      (v.confirmationRequired && this.acknowledged !== this.bound)) {
      this.invalidate(); this.fail('ההקשר או אישור האזהרה השתנו. נדרשת בדיקה חדשה.'); return;
    }
    if (this.expired()) return;
    // A public method argument is not consent: only the reviewed dialog path
    // may reach dispatch for native mode.
    if (this.nativeMode() && (!nativeAccepted || !this.operationApproved)) {
      if (this.operation) return;
      const gen = this.generation, binding = this.binding();
      const ref = this.dialog.open(NativeArrivalConfirmation, {
        data: structuredClone({ selection: this.selection(), context: this.context(), validation: this.validation() }),
        direction: 'rtl', width: '600px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
        restoreFocus: false, panelClass: 'shf-arrival-dialog',
        autoFocus: '#native-operation-cancel', enterAnimationDuration: 0, exitAnimationDuration: 0,
        ariaLabel: 'אישור כל פעולת עדכון Oracle TEST',
      });
      this.operation = ref;
      const operation = ref.componentInstance;
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
        if (!this.active(gen)) return;
        if (accepted === true && operation.approved && operation.accepted.value && this.binding() === binding) {
          this.operationApproved = true; this.confirm(true);
        }
        else {
          this.invalidate(); this.state.set('ready');
          this.message.set('האישור בוטל או ההקשר השתנה. לא נשלחה פקודה; נדרשת בדיקה חדשה.');
        }
        this.operation = undefined;
        this.keepCommandOpenerVisible(true);
      });
      return;
    }
    const command: ArrivalCommand = { commandId: crypto.randomUUID(),
      draft: { lateReasonCode: this.reason.value, lateRemark: null }, validationToken: v.validationToken,
      fingerprint: v.fingerprint,
      confirmation: v.confirmationRequired ? { accepted: true, warningCodes: ['STAGE_ARRIVAL_LATE'] } : null,
      ...(this.nativeMode() ? { operationConfirmation: { accepted: true as const } } : {}) };
    if (!arrivalCommand(command, c.dataSource)) { this.invalidate(); this.fail('פרטי הפעולה אינם תקפים. לא נשלחה פקודה.'); return; }
    // Persist BEFORE POST. Failure to establish safety means no POST.
    if (!this.session.begin(s, command.commandId)) { this.recovery(); return; }
    const gen = this.generation, binding = this.bound;
    this.commandSent.set(true); this.state.set('committing'); this.message.set(this.nativeMode()
      ? 'פקודת עדכון Oracle TEST נשלחה. אין לשלוח שוב; עזיבה אינה ביטול.'
      : 'פקודת סימולציה נשלחה. אין לשלוח שוב; עזיבה אינה ביטול.');
    this.keepCommandOpenerVisible();
    this.work = this.api.stageArrivalCommand(s.employeeId, s.shiftDayId, command).subscribe({
      next: value => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || this.prepared !== JSON.stringify(this.validation()) ||
          !this.sameSelection(s) || !arrivalReceipt(value, c, command, v)) { this.unknown(); return; }
        if (!this.session.resolve(s, command.commandId)) { this.unknown(); return; }
        this.receipt.set(value); this.validation.set(null);
        this.state.set('success'); this.message.set(this.nativeMode()
          ? 'עדכון Oracle TEST אושר ונבדק בקריאה עצמאית חוזרת. זהו שינוי נתוני בדיקה, לא סימולציה.'
          : 'הסימולציה נרשמה בזיכרון המופע בלבד. זו אינה הגעה אמיתית.');
        this.keepCommandOpenerVisible();
      },
      error: e => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || !this.sameSelection(s) ||
          !(e instanceof HttpErrorResponse) || !this.problemMedia(e) || !arrivalProblem(e.error, e.status, command.commandId, c.dataSource) ||
          e.error.effect === 'unknown' ||
          e.error.code === 'COMMAND_IN_PROGRESS' || e.error.code === 'COMMAND_ID_CONFLICT') { this.unknown(); return; }
        if (!this.session.resolve(s, command.commandId, false)) { this.unknown(); return; }
        this.handleError(e, command.commandId);
        this.keepCommandOpenerVisible();
      },
    });
  }
  private handleError(e: unknown, commandId: string | null) {
    this.validation.set(null); this.bound = ''; this.acknowledged = '';
    if (e instanceof HttpErrorResponse && this.problemMedia(e) && arrivalProblem(e.error, e.status, commandId, this.context()?.dataSource ?? this.selection()?.dataSource)) {
      this.state.set(e.error.nextAction === 'prepare-again' && commandId === null ? 'expired' : 'error');
      this.message.set(`${e.error.code} — ${e.error.effect === 'rolled-back' ? 'השרת אישר ביטול מלא של השינוי' : 'השרת דחה לפני שינוי'}. אין ניסיון חוזר אוטומטי. ${this.nativeMode() ? 'הפיילוט בזמן בלבד; איחור או חלון שפג אינם ניתנים לעקיפה.' : ''}`);
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
    this.message.set('UNKNOWN — תוצאת העדכון אינה ידועה. אין לשלוח שוב; נדרשת בדיקת מפעיל. אין אישור הצלחה או אפס השפעות.');
    this.keepCommandOpenerVisible();
  }
  cancel() {
    if (this.state() === 'committing') return;
    this.invalidate(); this.journey.back('/attendance');
  }
  canOpenStation() {
    return stationIdentity(this.principal()) && !!this.selection() && !this.session.uncertain() &&
      !this.station.affects(this.selection()) && !this.exit.affects(this.selection()) && ['ready', 'review', 'success', 'ineligible'].includes(this.state());
  }
  openStation() {
    if (!this.canOpenStation()) return;
    const s = this.selection()!;
    this.invalidate(); this.station.selection = structuredClone(s);
    void this.router.navigate(['/employees', s.employeeId, 'shift-days', s.shiftDayId, 'station-arrival']);
  }
}
