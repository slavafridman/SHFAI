import { afterNextRender, Component, DestroyRef, ElementRef, Injector, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { displayTime, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { stationIdentity, stationSource, stationContext, stationValidation, stationReceipt, stationProblem,
  type StationContext, type StationValidation, type StationReceipt, type StationCommand,
  type StationArrivalValidationV1 } from './station-arrival-contract';
import { StationArrivalSession } from './station-arrival-session';
import { StageArrivalSession } from './stage-arrival-session';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';
import { StationArrivalDialog, type StationArrivalDialogData } from './station-arrival-dialog';
type State = 'chooser' | 'loading' | 'denied' | 'ready' | 'ineligible' | 'validating' |
  'warning' | 'review' | 'committing' | 'success' | 'error' | 'expired' | 'unknown' | 'recovery';
@Component({
  selector: 'shf-station-arrival',
  imports: [WorkspaceShell, RouterLink, MatButtonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './station-arrival-page.html', styleUrl: './station-arrival-page.scss',
})
export class StationArrivalPage {
  readonly session = inject(StationArrivalSession);
  readonly stage = inject(StageArrivalSession);
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly state = signal<State>('chooser');
  readonly selection = signal<ArrivalSelection | null>(null);
  readonly context = signal<StationContext | null>(null);
  readonly validation = signal<StationValidation | null>(null);
  readonly receipt = signal<StationReceipt | null>(null);
  readonly reason = new FormControl<string | null>(null);
  readonly message = signal('');
  readonly reviewOffered = signal(false);
  readonly halted = signal(false);
  readonly time = displayTime;
  private generation = 0;
  private alive = true;
  private bound = '';
  private prepared = '';
  private acknowledged = '';
  private deadline = 0;
  private restoring = false;
  private work?: Subscription;
  private identityWork?: Subscription;
  private warning?: MatDialogRef<StationArrivalDialog, boolean>;
  private operation?: MatDialogRef<StationArrivalDialog, boolean>;
  private operationApproved = false;
  nativeMode() { return stationSource(this.principal()) === 'oracle-test' || this.selection()?.dataSource === 'oracle-test'; }
  constructor() {
    effect(() => {
      const pending = this.nativeMode() || !['ready', 'error', 'expired'].includes(this.state()) || this.halted() || this.blocked();
      if (pending && this.reason.enabled) this.reason.disable({ emitEvent: false });
      else if (!pending && this.reason.disabled) this.reason.enable({ emitEvent: false });
    });
    this.journey.attach(this.host.nativeElement, () => ({ stationSelection: this.selection() }));
    afterNextRender(() => {
      if (!this.restoring) {
        this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
    });
    this.reason.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.state() === 'committing') { this.unknown(); return; }
      this.invalidate();
      if (this.context()?.eligibility === 'eligible' && !this.blocked() && !this.halted()) this.state.set('ready');
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.invalidate(); this.context.set(null); this.receipt.set(null);
      const restored = this.journey.saved<{ stationSelection: ArrivalSelection | null }>();
      this.restoring = !!restored;
      const s = restored ? restored.stationSelection : this.session.selection;
      const selected = s && s.employeeId === params.get('employeeId') && s.shiftDayId === params.get('shiftDayId') &&
        ['isolated-fixture', 'oracle-test'].includes(s.dataSource) ? structuredClone(s) : null;
      this.selection.set(selected);
      if (selected) this.session.selection = structuredClone(selected);
      this.recheck();
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.invalidate(); this.identityWork?.unsubscribe();
      // Unsubscription is NOT proof of cancellation: opaque safety survives.
    });
  }
  allowed() { return this.identityState() === 'ready' && stationIdentity(this.principal()); }
  blocked() { return this.session.blocked(this.selection()) || this.stage.affects(this.selection()); }
  private unresolved() {
    const s = this.selection();
    return (s ? this.session.affects(s) : this.session.uncertain()) || this.stage.affects(s);
  }
  private active(gen: number) { return this.alive && gen === this.generation; }
  private invalidate() {
    this.generation++; this.work?.unsubscribe();
    const warning = this.warning; this.warning = undefined; warning?.close(false);
    const operation = this.operation; this.operation = undefined; operation?.close(false); this.operationApproved = false;
    this.validation.set(null); this.bound = ''; this.prepared = ''; this.acknowledged = ''; this.deadline = 0;
  }
  private sameSelection(s: ArrivalSelection) {
    const p = this.principal();
    return this.allowed() && p !== null && s.dataSource === stationSource(p) && s.actor === actorBinding(p) &&
      p.principal.resourceScope.orgUnitIds.includes(s.orgUnitId) &&
      JSON.stringify(s) === JSON.stringify(this.session.selection);
  }
  private binding() {
    return JSON.stringify(['station-arrival', this.generation, this.selection(), this.session.selection,
      this.principal(), this.context(), this.reason.value]);
  }
  recheck() {
    this.invalidate(); this.identityWork?.unsubscribe(); this.context.set(null); this.receipt.set(null);
    this.principal.set(null); this.identityState.set('loading'); this.reviewOffered.set(false);
    this.halted.set(false); this.state.set('loading');
    const gen = this.generation;
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!stationIdentity(value)) {
          this.identityState.set('error'); this.state.set('denied');
          this.message.set('נדרשת זהות סינתטית תקפה עם הרשאות ומקור מדויקים: fixture משותף או native station TEST. אין מעבר אוטומטי לסימולציה.'); return;
        }
        this.principal.set(value); this.identityState.set('ready');
        if (this.unresolved()) { this.recovery(); return; }
        const s = this.selection();
        if (!s) { this.state.set('chooser'); return; }
        if (!this.sameSelection(s)) {
          this.state.set('denied'); this.message.set('הזהות, המקור או הצוות השתנו. יש לבחור רשומה מחדש.'); return;
        }
        this.loadContext();
      },
      error: () => { if (this.active(gen)) {
        this.identityState.set('error'); this.state.set('denied');
        this.message.set('לא ניתן לאמת זהות. אין הנחת מנהל מערכת ואין הרשאות חלופיות.');
      } },
    });
  }
  private loadContext() {
    const s = this.selection();
    if (!s || !this.sameSelection(s) || this.unresolved()) return;
    const gen = this.generation; this.state.set('loading');
    // Always fresh F2 context. Never reuse an F1 response/preparation/receipt.
    this.work = this.api.stationArrivalContext(s.employeeId, s.shiftDayId).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!this.sameSelection(s) || !stationContext(value, s)) { this.fail('הקשר לא עקבי או מקור שגוי. הפעולה חסומה.'); this.halted.set(true); return; }
        this.context.set(structuredClone(value));
        this.state.set(value.eligibility === 'eligible' && value.withinArrivalWindow && !this.session.recorded(s) ? 'ready' : 'ineligible');
        this.message.set(this.session.recorded(s) ? 'הפעולה כבר אושרה. הקשר חדש לקריאה בלבד; אין רישום נוסף ואין UNKNOWN חדש.' :
          value.eligibility === 'already-recorded' ? 'הגעה לעמדה כבר רשומה — מצב נצפה לקריאה בלבד, לא קבלה משוחזרת ולא שיוך לפקודה.' :
          value.eligibility === 'eligible' && value.withinArrivalWindow
          ? 'הקשר חדש מהשרת — טרם נשלחה פקודת רישום.' : 'הרשומה אינה כשירה או מחוץ לחלון. אין הוספה, דריסה או כניסה חוזרת.');
        afterNextRender(() => {
          if (this.active(gen)) this.journey.restore(this.host.nativeElement);
        }, { injector: this.injector });
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  late() {
    const c = this.context();
    // Presentation only; backend decides classification and warning/minutes.
    return !this.nativeMode() && !!c && c.serverTime.local > c.planned.startLocal;
  }
  reasonLabel() { return this.context()?.lateReasonOptions.find(r => r.code === this.reason.value)?.label ?? 'תיאור לא זמין'; }
  canValidate() {
    return this.allowed() && !this.halted() && !this.blocked() && this.context()?.eligibility === 'eligible' &&
      this.context()?.withinArrivalWindow && ['ready', 'error', 'expired'].includes(this.state());
  }
  validate() {
    if (!this.canValidate()) return;
    const s = this.selection()!, c = this.context()!;
    if (!this.sameSelection(s)) { this.invalidate(); this.fail('ההקשר השתנה. יש לבחור מחדש.'); return; }
    if ((this.late() && this.reason.value === null) || (this.reason.value !== null &&
      !c.lateReasonOptions.some(r => r.code === this.reason.value))) {
      this.reason.setErrors({ required: true }); this.reason.markAsTouched(); this.focusAfterRender('#station-reason'); return;
    }
    this.invalidate();
    const gen = this.generation, binding = this.binding(), started = performance.now();
    this.state.set('validating'); this.message.set('בדיקה טהורה — ללא שינוי, ללא קבלה וללא ביקורת עסקית.');
    this.work = this.api.stationArrivalValidate(s.employeeId, s.shiftDayId, { lateReasonCode: this.nativeMode() ? null : this.reason.value }).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (binding !== this.binding() || !stationValidation(value, c) ||
          (value.confirmationRequired ? this.reason.value === null : this.reason.value !== null)) {
          this.fail('תשובת הבדיקה אינה תואמת להקשר ולטיוטה. יש לרענן הקשר.'); this.halted.set(true); return;
        }
        this.validation.set(structuredClone(value)); this.prepared = JSON.stringify(value); this.bound = binding;
        this.deadline = started + Date.parse(value.expiresAt) - Date.parse(value.evaluatedAt);
        if (this.expired()) return;
        if (value.dataSource === 'isolated-fixture' && value.confirmationRequired) this.showWarning(value, gen, binding);
        else this.review();
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private review() {
    this.reviewOffered.set(true); this.state.set('review');
    this.message.set('יש לסקור ולאשר את כל הפעולה. עד כה לא נרשמה הגעה.');
  }
  private showWarning(v: StationArrivalValidationV1, gen: number, binding: string) {
    this.state.set('warning');
    const opener = this.host.nativeElement.querySelector<HTMLElement>('#station-validate');
    const ref = this.dialog.open<StationArrivalDialog, StationArrivalDialogData, boolean>(StationArrivalDialog, {
      data: { kind: 'fixture-warning', name: this.selection()!.name, planned: this.context()!.planned.startLocal,
        reason: this.reasonLabel(), validation: structuredClone(v) },
      direction: 'rtl', width: '560px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      panelClass: 'shf-arrival-dialog', restoreFocus: false, autoFocus: '#station-warning-cancel',
      enterAnimationDuration: 0, exitAnimationDuration: 0, ariaLabel: 'אזהרת איחור לעמדה — ללא רישום',
    });
    this.warning = ref;
    const instance = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
      if (!this.active(gen)) return;
      this.warning = undefined;
      if (binding !== this.binding() || this.prepared !== JSON.stringify(this.validation())) {
        this.invalidate(); this.fail('ההקשר השתנה. נדרשת בדיקה חדשה.');
      } else if (accepted !== true || !instance.confirmed || !instance.accepted.value) {
        this.invalidate(); this.state.set('ready'); this.message.set('האזהרה בוטלה. לא נשלחה פקודה.');
      } else if (!this.expired()) { this.acknowledged = binding; this.review(); }
      this.restoreOpener(opener);
    });
  }
  private expired() {
    if (this.validation() && performance.now() < this.deadline) return false;
    this.invalidate(); this.state.set('expired'); this.message.set('תוקף הבדיקה פג. יש לבדוק ולסקור מחדש. לא נשלחה פקודה.');
    return true;
  }
  confirm() {
    if (this.state() !== 'review') return;
    const s = this.selection(), c = this.context(), v = this.validation();
    if (!s || !c || !v || !this.sameSelection(s) || this.blocked() ||
      this.bound !== this.binding() || this.prepared !== JSON.stringify(v) ||
      (v.confirmationRequired && this.acknowledged !== this.bound)) {
      this.invalidate(); this.recovery(); return;
    }
    if (this.expired()) return;
    if (this.nativeMode() && !this.operationApproved) { this.showOperation(s, c, v); return; }
    const base = {
      validationToken: v.validationToken, fingerprint: v.fingerprint,
    };
    const command: StationCommand = this.nativeMode() ? {
      ...base, commandId: crypto.randomUUID(), draft: { lateReasonCode: null }, confirmation: null,
      operationConfirmation: { accepted: true },
    } : {
      commandId: crypto.randomUUID(), draft: { lateReasonCode: this.reason.value },
      ...base,
      confirmation: v.confirmationRequired ? { accepted: true, warningCodes: ['STATION_ARRIVAL_LATE'] } : null,
    };
    if (!this.session.begin(s, command.commandId)) { this.invalidate(); this.recovery(); return; }
    const gen = this.generation, binding = this.bound;
    this.state.set('committing'); this.message.set(this.nativeMode() ?
      'פקודת כתיבה למסד TEST נשלחה. אין לשלוח שוב. עזיבה אינה ביטול.' : 'פקודת סימולציה נשלחה. אין לשלוח שוב. עזיבה אינה ביטול.');
    this.keepConfirmVisible();
    this.work = this.api.stationArrivalCommand(s.employeeId, s.shiftDayId, command).subscribe({
      next: value => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || !this.sameSelection(s) || this.prepared !== JSON.stringify(this.validation()) ||
          !stationReceipt(value, c, command, v) || !this.session.resolve(s, command.commandId)) { this.unknown(); return; }
        this.receipt.set(structuredClone(value)); this.validation.set(null); this.state.set('success');
        this.message.set(this.nativeMode() ?
          'השרת אישר COMMIT ובדיקה חוזרת תואמת של הגעה לעמדה במסד TEST. שינוי בדיקה אמיתי, לא סימולציה; שותף חיצוני לא הופעל.' :
          'הגעה לעמדה נרשמה בסימולציה בזיכרון בלבד — קבלת F2 וביקורת זיכרון. זו אינה כניסה אמיתית.');
        this.keepConfirmVisible();
      },
      error: e => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || !this.sameSelection(s) || !(e instanceof HttpErrorResponse) ||
          !this.problemMedia(e) || !stationProblem(e.error, e.status, command.commandId, s.dataSource) ||
          e.error.effect === 'unknown' || ['COMMAND_IN_PROGRESS', 'COMMAND_ID_CONFLICT'].includes(e.error.code) ||
          !this.session.resolve(s, command.commandId, false)) { this.unknown(); return; }
        this.handleError(e, command.commandId);
        this.keepConfirmVisible();
      },
    });
  }
  private showOperation(s: ArrivalSelection, c: StationContext, v: StationValidation) {
    if (this.operation) return;
    if (c.dataSource !== 'oracle-test' || v.dataSource !== 'oracle-test') {
      this.invalidate(); this.fail('מקור הבדיקה השתנה. נדרשת בדיקה חדשה.'); return;
    }
    const gen = this.generation, binding = this.bound;
    const opener = this.host.nativeElement.querySelector<HTMLElement>('#station-confirm');
    const ref = this.dialog.open<StationArrivalDialog, StationArrivalDialogData, boolean>(StationArrivalDialog, {
      data: { kind: 'native-confirmation', selection: structuredClone(s), context: structuredClone(c), validation: structuredClone(v) },
      direction: 'rtl', width: '560px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      panelClass: 'shf-arrival-dialog', restoreFocus: false, autoFocus: '#native-station-operation-cancel',
      enterAnimationDuration: 0, exitAnimationDuration: 0, ariaLabel: 'אישור רישום הגעה לעמדה במסד TEST',
    });
    this.operation = ref;
    const instance = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
      if (!this.active(gen)) return;
      this.operation = undefined;
      if (binding !== this.binding() || this.prepared !== JSON.stringify(this.validation())) {
        this.invalidate(); this.fail('ההקשר השתנה. נדרשת בדיקה חדשה.');
      } else if (accepted === true && instance.confirmed && instance.accepted.value) {
        this.operationApproved = true; this.confirm();
      } else { this.invalidate(); this.state.set('ready'); this.message.set('האישור בוטל. לא נשלחה פקודה ולא בוצע עדכון.'); }
      this.restoreOpener(opener);
    });
  }
  private problemMedia(e: HttpErrorResponse) {
    return /^application\/problem\+json(?:;\s*charset=utf-8)?$/i.test(e.headers.get('Content-Type') ?? '') &&
      e.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') &&
      e.headers.get('X-Content-Type-Options')?.toLowerCase() === 'nosniff';
  }
  private handleError(e: unknown, commandId: string | null = null) {
    this.invalidate();
    if (e instanceof HttpErrorResponse && this.problemMedia(e) && stationProblem(e.error, e.status, commandId,
      this.selection()?.dataSource ?? 'isolated-fixture')) {
      this.message.set(`${e.error.code} — ${e.error.effect === 'rolled-back' ? 'השרת אישר ביטול מלא' : 'השרת דחה לפני שינוי'}. אין ניסיון חוזר אוטומטי.`);
      this.state.set('error'); this.halted.set(e.error.nextAction === 'stop' || e.error.nextAction === 'prepare-again');
      if (e.error.nextAction === 'prepare-again') this.context.set(null); // Fresh context required, not old F1/F2 prep.
      if (e.status === 422 && !this.nativeMode()) {
        this.reason.enable({ emitEvent: false }); this.reason.setErrors({ server: true });
        this.reason.markAsTouched(); this.focusAfterRender('#station-reason');
      }
      if (e.status === 401 || e.status === 403) { this.principal.set(null); this.context.set(null); this.state.set('denied'); }
    } else this.fail('לא ניתן להשלים בדיקה טהורה. לא נשלחה פקודה. הטיוטה נשמרה.');
  }
  private fail(message: string) { this.state.set('error'); this.message.set(message); }
  private recovery() {
    this.state.set('recovery'); this.message.set('UNKNOWN / RECOVERY REQUIRED — אין לשלוח שוב. תוצאה קודמת לא הוכרעה; יש לפנות לאחראי התהליך. החלפת מסך אינה פתרון.');
  }
  private unknown() {
    this.invalidate(); this.receipt.set(null); this.state.set('unknown');
    this.message.set('UNKNOWN — אין לשלוח שוב. תוצאת הפעולה אינה ידועה; נדרשת בדיקת מפעיל. אין אישור הצלחה או אפס השפעות.');
    this.keepConfirmVisible();
  }
  private focusAfterRender(selector: string) {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector });
  }
  private keepConfirmVisible() {
    this.restoreOpener(this.host.nativeElement.querySelector<HTMLElement>('#station-confirm'), false);
  }
  private restoreOpener(opener: HTMLElement | null, restore = true) {
    const gen = this.generation;
    afterNextRender(() => {
      if (!this.active(gen) || !opener?.isConnected || !this.host.nativeElement.contains(opener)) return;
      if (!restore && document.activeElement !== opener) return;
      if (document.activeElement !== document.body && document.activeElement !== opener) return;
      opener.focus({ preventScroll: true });
      const stickyBottom = Math.max(0, ...[...this.host.nativeElement.querySelectorAll<HTMLElement>('.topbar,.mockbar')]
        .filter(n => ['sticky', 'fixed'].includes(getComputedStyle(n).position)).map(n => n.getBoundingClientRect().bottom));
      const style = getComputedStyle(opener), ring = (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0);
      // Scroll offsets are integer CSS pixels; round outward so a fractional
      // button edge cannot clip the measured ring by a fraction of a pixel.
      const clearance = Math.ceil(ring) + 1;
      opener.style.scrollMarginBlockStart = `${Math.ceil(stickyBottom) + clearance}px`;
      opener.style.scrollMarginBlockEnd = `${clearance}px`;
      const rect = opener.getBoundingClientRect();
      if (rect.top - ring < stickyBottom || rect.bottom + ring > innerHeight)
        opener.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }, { injector: this.injector });
  }
  openStage() {
    const s = this.selection();
    if (!s || this.nativeMode() || !this.allowed() || this.session.affects(s) || this.stage.affects(s) || this.state() === 'committing') return;
    this.invalidate(); this.stage.selection = structuredClone(s);
    void this.router.navigate(['/employees', s.employeeId, 'shift-days', s.shiftDayId, 'stage-arrival']);
  }
  cancel() {
    if (this.state() === 'committing') return;
    this.invalidate(); this.journey.back('/attendance');
  }
}
