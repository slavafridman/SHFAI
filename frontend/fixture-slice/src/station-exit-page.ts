import { afterNextRender, Component, DestroyRef, ElementRef, Injector, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { displayTime, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { exitIdentity, exitContext, exitValidation, exitCommand, exitReceipt, exitProblem, exitBlockerCopy,
  type StationExitContextV1, type StationExitValidationV1, type StationExitReceiptV1,
  type StationExitCommitV1 } from './station-exit-contract';
import { StationExitSession } from './station-exit-session';
import { StageArrivalSession } from './stage-arrival-session';
import { StationArrivalSession } from './station-arrival-session';
import { StationArrivalDialog, type StationArrivalDialogData } from './station-arrival-dialog';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';
type State = 'chooser' | 'loading' | 'denied' | 'ready' | 'ineligible' | 'validating' |
  'review' | 'committing' | 'success' | 'error' | 'expired' | 'unknown' | 'recovery';
@Component({
  selector: 'shf-station-exit',
  imports: [WorkspaceShell, RouterLink, MatButtonModule],
  templateUrl: './station-exit-page.html', styleUrl: './station-exit-page.scss',
})
export class StationExitPage {
  readonly session = inject(StationExitSession);
  private readonly stage = inject(StageArrivalSession);
  private readonly station = inject(StationArrivalSession);
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly state = signal<State>('chooser');
  readonly selection = signal<ArrivalSelection | null>(null);
  readonly context = signal<StationExitContextV1 | null>(null);
  readonly validation = signal<StationExitValidationV1 | null>(null);
  readonly receipt = signal<StationExitReceiptV1 | null>(null);
  readonly message = signal('');
  readonly reviewOffered = signal(false);
  readonly time = displayTime;
  readonly blockerCopy = exitBlockerCopy;
  private generation = 0;
  private alive = true;
  private restoring = false;
  private work?: Subscription;
  private identityWork?: Subscription;
  private operation?: MatDialogRef<StationArrivalDialog, boolean>;
  private bound = '';
  private prepared = '';
  private deadline = 0;
  constructor() {
    // Volatile selected-resource context only. Never restore preparation/receipt.
    this.journey.attach(this.host.nativeElement, () => ({ exitSelection: this.selection() }));
    afterNextRender(() => {
      if (!this.restoring) {
        this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.invalidate(); this.context.set(null); this.receipt.set(null);
      const restored = this.journey.saved<{ exitSelection: ArrivalSelection | null }>();
      this.restoring = !!restored;
      const s = restored ? restored.exitSelection : this.session.selection;
      const selected = s && s.employeeId === params.get('employeeId') && s.shiftDayId === params.get('shiftDayId') &&
        s.dataSource === 'oracle-test' ? structuredClone(s) : null;
      this.selection.set(selected);
      if (selected) this.session.selection = structuredClone(selected);
      this.recheck();
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.invalidate(); this.identityWork?.unsubscribe();
      // Leaving/unsubscribing is not cancellation; unresolved marker survives.
    });
  }
  allowed() { return this.identityState() === 'ready' && exitIdentity(this.principal()); }
  private unresolved() {
    const s = this.selection();
    return this.session.affects(s) || this.stage.crossAffects(s) || this.station.crossAffects(s);
  }
  blocked() { return this.session.blocked(this.selection()) || this.stage.crossAffects(this.selection()) || this.station.crossAffects(this.selection()); }
  private active(gen: number) { return this.alive && gen === this.generation; }
  private invalidate() {
    this.generation++; this.work?.unsubscribe();
    const ref = this.operation; this.operation = undefined; ref?.close(false);
    this.validation.set(null); this.bound = ''; this.prepared = ''; this.deadline = 0;
  }
  private sameSelection(s: ArrivalSelection) {
    const p = this.principal();
    return this.allowed() && p !== null && s.dataSource === 'oracle-test' && s.actor === actorBinding(p) &&
      p.principal.resourceScope.orgUnitIds.includes(s.orgUnitId) &&
      JSON.stringify(s) === JSON.stringify(this.session.selection);
  }
  private binding() {
    return JSON.stringify(['station-exit', this.generation, this.selection(), this.session.selection,
      this.principal(), this.context(), {}]);
  }
  recheck() {
    if (this.state() === 'committing') { this.unknown(); return; }
    this.invalidate(); this.identityWork?.unsubscribe(); this.context.set(null); this.receipt.set(null);
    this.principal.set(null); this.identityState.set('loading'); this.reviewOffered.set(false);
    this.state.set('loading');
    const gen = this.generation;
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!exitIdentity(value)) {
          this.identityState.set('error'); this.state.set('denied');
          this.message.set('נדרשת זהות סינתטית תקפה עם מקור Oracle ועשר הרשאות יציאה מדויקות. אין הרשאות חלופיות או מעבר לסימולציה.'); return;
        }
        this.principal.set(value); this.identityState.set('ready');
        if (this.unresolved()) { this.recovery(); return; }
        const s = this.selection();
        if (!s) { this.state.set('chooser'); this.message.set('יש לבחור רשומה במפורש.'); return; }
        if (!this.sameSelection(s)) {
          this.state.set('denied'); this.message.set('הזהות, המקור או הצוות השתנו. יש לבחור רשומה מחדש.'); return;
        }
        this.loadContext(s);
      },
      error: () => { if (this.active(gen)) {
        this.identityState.set('error'); this.state.set('denied');
        this.message.set('לא ניתן לאמת זהות. אין הנחת מנהל מערכת ואין הרשאות חלופיות.');
      } },
    });
  }
  private loadContext(s: ArrivalSelection) {
    const gen = this.generation;
    this.work = this.api.stationExitContext(s.employeeId, s.shiftDayId).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (!this.sameSelection(s) || !exitContext(value, s)) { this.fail('הקשר יציאה לא עקבי או מקור שגוי. הפעולה חסומה; יש לטעון הקשר חדש.'); return; }
        this.context.set(structuredClone(value));
        this.state.set(value.eligibility === 'eligible' && !this.session.recorded(s) ? 'ready' : 'ineligible');
        this.message.set(this.session.recorded(s) ? 'הפעולה כבר אושרה. הקשר חדש לקריאה בלבד; אין רישום נוסף.' :
          value.eligibility === 'already-recorded' ? 'יציאה מעמדה כבר רשומה — מצב נצפה לקריאה בלבד, לא קבלת פקודה ולא קבלה משוחזרת.' :
          value.eligibility === 'eligible' ? 'הקשר חדש מהשרת — טרם נשלחה פקודת יציאה.' : 'אין כשירות ליציאה רגילה. לא יבוצע עדכון.');
        afterNextRender(() => { if (this.active(gen)) this.journey.restore(this.host.nativeElement); }, { injector: this.injector });
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  canValidate() { return this.allowed() && !this.blocked() && this.context()?.eligibility === 'eligible' && this.state() === 'ready'; }
  validate() {
    if (!this.canValidate()) return;
    const s = this.selection()!, c = this.context()!;
    if (!this.sameSelection(s)) { this.invalidate(); this.fail('ההקשר השתנה. יש לבחור מחדש.'); return; }
    this.invalidate();
    const gen = this.generation, binding = this.binding(), started = performance.now();
    this.state.set('validating'); this.message.set('בדיקה טהורה — ללא שינוי נתונים וללא פקודת כתיבה.');
    this.work = this.api.stationExitValidate(s.employeeId, s.shiftDayId, {}).subscribe({
      next: value => {
        if (!this.active(gen)) return;
        if (binding !== this.binding() || !this.sameSelection(s) || this.blocked() || !exitValidation(value, c)) {
          this.fail('תשובת הבדיקה אינה תואמת להקשר יציאה. יש לטעון הקשר חדש ולסקור מחדש.'); return;
        }
        this.validation.set(structuredClone(value)); this.prepared = JSON.stringify(value); this.bound = binding;
        this.deadline = started + Date.parse(value.expiresAt) - Date.parse(value.evaluatedAt);
        if (this.expired()) return;
        this.reviewOffered.set(true); this.state.set('review');
        this.message.set('יש לסקור ולאשר את כל הפעולה. עד כה לא נרשמה יציאה.');
      },
      error: e => { if (this.active(gen)) this.handleError(e); },
    });
  }
  private expired() {
    if (this.validation() && performance.now() < this.deadline) return false;
    this.invalidate(); this.context.set(null); this.state.set('expired');
    this.message.set('תוקף הבדיקה פג. יש לטעון הקשר חדש, לבדוק ולסקור מחדש. לא נשלחה פקודה.'); return true;
  }
  confirm() {
    if (this.state() !== 'review' || this.operation) return;
    const s = this.selection(), c = this.context(), v = this.validation();
    if (!s || !c || !v || !this.sameSelection(s) || this.blocked() ||
      this.bound !== this.binding() || this.prepared !== JSON.stringify(v)) { this.invalidate(); this.recovery(); return; }
    if (this.expired()) return;
    const gen = this.generation, binding = this.bound;
    const opener = this.host.nativeElement.querySelector<HTMLElement>('#exit-confirm');
    const ref = this.dialog.open<StationArrivalDialog, StationArrivalDialogData, boolean>(StationArrivalDialog, {
      data: { kind: 'native-exit-confirmation', selection: structuredClone(s), context: structuredClone(c), validation: structuredClone(v) },
      direction: 'rtl', width: '560px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      panelClass: 'shf-arrival-dialog', restoreFocus: false, autoFocus: '#native-exit-operation-cancel',
      enterAnimationDuration: 0, exitAnimationDuration: 0, ariaLabel: 'אישור רישום יציאה מעמדה במסד TEST',
    });
    this.operation = ref;
    const instance = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
      if (!this.active(gen)) return;
      this.operation = undefined;
      if (binding !== this.binding() || !this.sameSelection(s) || this.blocked() ||
        this.prepared !== JSON.stringify(this.validation())) { this.invalidate(); this.recovery(); }
      else if (accepted === true && instance.confirmed && instance.accepted.value) {
        if (!this.expired()) this.dispatch(s, c, v, gen, binding);
      } else {
        this.invalidate(); this.state.set('ready'); this.message.set('האישור בוטל. לא נשלחה פקודה ולא בוצע עדכון.');
      }
      this.restoreOpener(opener);
    });
  }
  private dispatch(s: ArrivalSelection, c: StationExitContextV1, v: StationExitValidationV1, gen: number, binding: string) {
    const command: StationExitCommitV1 = { commandId: crypto.randomUUID(), draft: {},
      validationToken: v.validationToken, fingerprint: v.fingerprint, operationConfirmation: { accepted: true } };
    if (!exitCommand(command) || this.blocked() || !this.session.begin(s, command.commandId)) { this.invalidate(); this.recovery(); return; }
    this.state.set('committing'); this.message.set('פקודת כתיבה למסד TEST נשלחה. אין לשלוח שוב. עזיבה אינה ביטול.');
    this.work = this.api.stationExitCommand(s.employeeId, s.shiftDayId, command).subscribe({
      next: value => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || !this.sameSelection(s) || this.prepared !== JSON.stringify(this.validation()) ||
          !exitReceipt(value, c, command, v) || !this.session.resolve(s, command.commandId)) { this.unknown(); return; }
        this.receipt.set(structuredClone(value)); this.validation.set(null); this.state.set('success');
        this.message.set('השרת אישר COMMIT ובדיקה חוזרת עצמאית תואמת של יציאה מעמדה במסד TEST. שינוי בדיקה אמיתי, לא סימולציה; שותף חיצוני לא הופעל.');
        this.restoreOpener(this.host.nativeElement.querySelector<HTMLElement>('#exit-confirm'), false);
      },
      error: e => {
        if (!this.active(gen) || this.state() !== 'committing') return;
        if (binding !== this.binding() || !this.sameSelection(s) || !(e instanceof HttpErrorResponse) ||
          !this.problemMedia(e) || !exitProblem(e.error, e.status, command.commandId) || e.error.effect === 'unknown' ||
          ['COMMAND_IN_PROGRESS', 'COMMAND_ID_CONFLICT'].includes(e.error.code) ||
          !this.session.resolve(s, command.commandId, false)) { this.unknown(); return; }
        this.handleError(e, command.commandId);
      },
    });
  }
  private problemMedia(e: HttpErrorResponse) {
    return /^application\/problem\+json(?:;\s*charset=utf-8)?$/i.test(e.headers.get('Content-Type') ?? '') &&
      e.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') &&
      e.headers.get('X-Content-Type-Options')?.toLowerCase() === 'nosniff';
  }
  private handleError(e: unknown, commandId: string | null = null) {
    this.invalidate(); this.context.set(null);
    if (e instanceof HttpErrorResponse && this.problemMedia(e) && exitProblem(e.error, e.status, commandId)) {
      if (e.error.effect === 'unknown') { this.recovery(); return; }
      this.fail(`${e.error.code} — ${e.error.effect === 'rolled-back' ? 'השרת אישר ביטול מלא' : 'השרת דחה לפני שינוי'}. נדרשים הקשר חדש, בדיקה וסקירה; אין ניסיון חוזר אוטומטי.`);
      if (e.status === 401 || e.status === 403) { this.principal.set(null); this.identityState.set('error'); this.state.set('denied'); }
    } else this.fail('לא ניתן להשלים בדיקה טהורה. לא נשלחה פקודה. יש לטעון הקשר חדש; אין מעבר לסימולציה.');
  }
  private fail(text: string) { this.state.set('error'); this.message.set(text); }
  private recovery() {
    this.state.set('recovery');
    this.message.set('UNKNOWN / RECOVERY REQUIRED — תוצאה קודמת לא הוכרעה. אין לשלוח שוב; נדרשת בדיקת מפעיל ידנית. החלפת מסך או מקור אינה פתרון.');
  }
  private unknown() {
    this.invalidate(); this.receipt.set(null); this.state.set('unknown');
    this.message.set('תוצאת העדכון אינה ידועה. אין לשלוח שוב; נדרשת בדיקת מפעיל. אין אישור הצלחה או אפס השפעות.');
    this.restoreOpener(this.host.nativeElement.querySelector<HTMLElement>('#exit-confirm'), false);
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
      const clearance = Math.ceil(ring) + 1;
      opener.style.scrollMarginBlockStart = `${Math.ceil(stickyBottom) + clearance}px`;
      opener.style.scrollMarginBlockEnd = `${clearance}px`;
      const rect = opener.getBoundingClientRect();
      if (rect.top - ring < stickyBottom || rect.bottom + ring > innerHeight)
        opener.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }, { injector: this.injector });
  }
  cancel() {
    if (this.state() === 'committing') return;
    this.invalidate(); this.journey.back('/attendance');
  }
}
