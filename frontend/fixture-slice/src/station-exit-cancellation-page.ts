import { afterNextRender, Component, DestroyRef, ElementRef, HostListener, Injector, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SliceApi } from './api';
import { displayTime, type IdentityResponseV1 } from './contract';
import { actorBinding, type ArrivalSelection } from './stage-arrival-contract';
import { cancellationIdentity, cancellationSource, cancellationContext, cancellationValidation,
  cancellationCommand, cancellationReceipt, cancellationProblem, cancellationBlockerCopy,
  type CancellationContextV1, type CancellationValidationV1, type CancellationReceiptV1,
  type CancellationCommandV1 } from './station-exit-cancellation-contract';
import { StationExitCancellationSession } from './station-exit-cancellation-session';
import { StationExitCancellationDialog, type CancellationDialogData } from './station-exit-cancellation-dialog';
import { WorkspaceShell } from './workspace-shell';
import { ViewHistory } from './view-history';
type State = 'loading' | 'chooser' | 'denied' | 'ready' | 'ineligible' | 'validating' |
  'review' | 'pending' | 'success' | 'error' | 'expired' | 'unknown' | 'blocked';
@Component({
  selector: 'shf-station-exit-cancellation',
  imports: [WorkspaceShell, MatButtonModule],
  templateUrl: './station-exit-cancellation-page.html', styleUrl: './station-exit-cancellation-page.scss',
})
export class StationExitCancellationPage {
  readonly session = inject(StationExitCancellationSession);
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly state = signal<State>('loading');
  readonly selection = signal<ArrivalSelection | null>(null);
  readonly context = signal<CancellationContextV1 | null>(null);
  readonly validation = signal<CancellationValidationV1 | null>(null);
  readonly receipt = signal<CancellationReceiptV1 | null>(null);
  readonly message = signal('');
  readonly time = displayTime;
  readonly blockers = cancellationBlockerCopy;
  private generation = 0;
  private alive = true;
  private work?: Subscription;
  private identityWork?: Subscription;
  private operation?: MatDialogRef<StationExitCancellationDialog, boolean>;
  private bound = '';
  private prepared = '';
  private deadline = 0;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    this.journey.attach(this.host.nativeElement, () => ({ cancellationSelection: this.selection() }));
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.invalidate(); this.context.set(null); this.receipt.set(null);
      const saved = this.journey.saved<{ cancellationSelection: ArrivalSelection | null }>();
      const s = saved ? saved.cancellationSelection : this.session.selection;
      const selected = s && s.employeeId === params.get('employeeId') && s.shiftDayId === params.get('shiftDayId') ?
        structuredClone(s) : null;
      this.selection.set(selected);
      if (selected) this.session.selection = structuredClone(selected);
      this.recheck();
    });
    this.destroy.onDestroy(() => {
      this.alive = false; this.invalidate(); this.identityWork?.unsubscribe();
      // An unresolved native dispatch remains in the shared quarantine.
    });
  }
  allowed() { return this.identityState() === 'ready' && cancellationIdentity(this.principal()); }
  blocked() { return this.session.blocked(this.selection()); }
  private active(gen: number) { return this.alive && gen === this.generation; }
  private invalidate() {
    this.generation++; this.work?.unsubscribe(); clearTimeout(this.expiryTimer);
    const ref = this.operation; this.operation = undefined;
    if (ref) { ref.componentInstance.warning.setValue(false); ref.componentInstance.operation.setValue(false); ref.close(false); }
    this.validation.set(null); this.bound = ''; this.prepared = ''; this.deadline = 0;
  }
  private same(s: ArrivalSelection) {
    const p = this.principal();
    return this.allowed() && p !== null && cancellationSource(p) === s.dataSource &&
      s.actor === actorBinding(p) && p.principal.resourceScope.orgUnitIds.includes(s.orgUnitId) &&
      JSON.stringify(s) === JSON.stringify(this.session.selection);
  }
  private binding() { return JSON.stringify([this.generation, this.selection(), this.session.selection, this.principal(), this.context(), {}]); }
  recheck() {
    if (this.state() === 'pending') { this.unknown(); return; }
    this.invalidate(); this.identityWork?.unsubscribe(); this.context.set(null); this.receipt.set(null);
    this.principal.set(null); this.identityState.set('loading'); this.state.set('loading');
    this.message.set('טוענים זהות והקשר — ללא שינוי');
    const gen = this.generation;
    this.identityWork = this.api.identity().subscribe({
      next: p => {
        if (!this.active(gen)) return;
        if (!cancellationIdentity(p)) { this.deny(); return; }
        this.principal.set(p); this.identityState.set('ready');
        const s = this.selection();
        if (!s) { this.state.set('chooser'); this.message.set('יש לבחור רשומה בבירור נוכחות. כתובת המסך אינה הרשאה.'); return; }
        if (!this.same(s)) { this.deny(); return; }
        if (this.blocked()) { this.stop(); return; }
        this.work = this.api.cancellationContext(s.employeeId, s.shiftDayId).subscribe({
          next: c => {
            if (!this.active(gen)) return;
            if (!this.same(s) || !cancellationContext(c, s) || this.blocked()) { this.fail('המקור או הקשר הרשומה אינם תואמים. הפעולה חסומה.'); return; }
            this.context.set(structuredClone(c));
            this.state.set(c.eligibility === 'eligible' ? 'ready' : 'ineligible');
            this.message.set(c.eligibility === 'eligible' ? 'הקשר נצפה בלבד — טרם נשלחה פקודה' :
              c.eligibility === 'not-recorded' ? 'לא נרשמה יציאה — זו אינה קבלת ביטול' : 'הפעולה נדחתה לבירור — אין שינוי');
            afterNextRender(() => { if (this.active(gen)) this.journey.restore(this.host.nativeElement); }, { injector: this.injector });
          },
          error: e => { if (this.active(gen)) this.handleError(e, null); },
        });
      },
      error: () => { if (this.active(gen)) this.deny(); },
    });
  }
  canValidate() { return this.allowed() && !this.blocked() && this.state() === 'ready' && this.context()?.eligibility === 'eligible'; }
  validate() {
    if (!this.canValidate()) return;
    const s = this.selection()!, c = this.context()!;
    if (!this.same(s)) { this.invalidate(); this.fail('ההקשר השתנה — נדרשת בחירה חדשה'); return; }
    this.invalidate(); const gen = this.generation, binding = this.binding(), started = performance.now();
    this.state.set('validating'); this.message.set('בודקים ללא שינוי — ללא נעילה או צריכת סמכות כתיבה');
    this.work = this.api.cancellationValidate(s.employeeId, s.shiftDayId, {}).subscribe({
      next: v => {
        if (!this.active(gen)) return;
        if (!this.same(s) || this.blocked() || binding !== this.binding() || !cancellationValidation(v, c)) {
          this.invalidate(); this.fail('תשובת הבדיקה אינה תואמת למקור או להקשר — נדרשת בדיקה חדשה'); return;
        }
        this.validation.set(structuredClone(v)); this.prepared = JSON.stringify(v); this.bound = binding;
        this.deadline = started + Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt);
        if (this.expired()) return;
        this.state.set('review'); this.message.set('יש לסקור את ניקוי היציאה ולאשר בנפרד את האזהרה ואת כל הפעולה');
        this.expiryTimer = setTimeout(() => { if (this.active(gen) && this.state() === 'review') this.expired(); }, Math.max(0, this.deadline - performance.now()));
      },
      error: e => { if (this.active(gen)) this.handleError(e, null); },
    });
  }
  private expired() {
    if (this.validation() && performance.now() < this.deadline) return false;
    this.invalidate(); this.context.set(null); this.state.set('expired');
    this.message.set('תוקף הבדיקה פג — שני האישורים בוטלו. נדרשים הקשר חדש ובדיקה חדשה; לא נשלחה פקודה');
    this.focusSummary(); return true;
  }
  confirm() {
    if (this.state() !== 'review' || this.operation || this.dialog.openDialogs.length ||
      this.host.nativeElement.querySelector('#menu[open]')) return;
    const s = this.selection(), c = this.context(), v = this.validation();
    if (!s || !c || !v || !this.same(s) || this.blocked() || this.bound !== this.binding() || this.prepared !== JSON.stringify(v)) {
      this.invalidate(); this.fail('ההקשר השתנה — האישורים בוטלו'); return;
    }
    if (this.expired()) return;
    const gen = this.generation, binding = this.bound;
    const ref = this.dialog.open<StationExitCancellationDialog, CancellationDialogData, boolean>(StationExitCancellationDialog, {
      data: { context: structuredClone(c), validation: structuredClone(v) },
      direction: 'rtl', width: '640px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      autoFocus: '#cancellation-safe-cancel', restoreFocus: false, ariaLabelledBy: 'cancellation-review-title',
      ariaDescribedBy: 'cancellation-review-description', enterAnimationDuration: 0, exitAnimationDuration: 0,
    });
    this.operation = ref; const instance = ref.componentInstance;
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(accepted => {
      if (!this.active(gen)) return;
      this.operation = undefined;
      if (binding !== this.binding() || !this.same(s) || this.blocked() || this.prepared !== JSON.stringify(this.validation())) {
        this.invalidate(); this.fail('ההקשר השתנה — שני האישורים בוטלו');
      } else if (accepted === true && instance.confirmed && instance.warning.value && instance.operation.value) {
        if (!this.expired()) this.dispatch(s, c, v, gen, binding);
      } else {
        this.invalidate(); this.state.set('ready'); this.message.set('הסקירה בוטלה — לא נשלחה פקודה ולא בוצע עדכון');
      }
      instance.warning.setValue(false); instance.operation.setValue(false);
      afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(this.state() === 'ready' ?
        '#cancellation-validate' : '#cancellation-summary')?.focus({ preventScroll: true }), { injector: this.injector });
    });
  }
  private dispatch(s: ArrivalSelection, c: CancellationContextV1, v: CancellationValidationV1, gen: number, binding: string) {
    const command: CancellationCommandV1 = { commandId: crypto.randomUUID(), draft: {},
      validationToken: v.validationToken, fingerprint: v.fingerprint,
      warningConfirmation: { accepted: true, code: 'RECORDED_EXIT_WILL_BE_CLEARED' },
      operationConfirmation: { accepted: true } };
    if (!cancellationCommand(command) || !this.session.begin(s, command.commandId)) { this.invalidate(); this.stop(); return; }
    clearTimeout(this.expiryTimer); this.state.set('pending'); this.message.set('הפקודה נשלחה — אין לשלוח שוב. עזיבה אינה ביטול או אישור תוצאה');
    this.work = this.api.cancellationCommand(s.employeeId, s.shiftDayId, command).subscribe({
      next: r => {
        if (!this.active(gen)) return;
        if (this.state() !== 'pending' || binding !== this.binding() || !this.same(s) ||
          this.prepared !== JSON.stringify(this.validation()) || !cancellationReceipt(r, c, command, v)) { this.unknown(); return; }
        this.receipt.set(structuredClone(r)); this.validation.set(null); this.prepared = ''; this.bound = '';
        this.state.set('success');
        this.message.set(r.outcome === 'simulated' ? 'הדמיה בלבד — רישום היציאה נוקה בנתונים סינתטיים. ללא Oracle; לא הופעל שותף חיצוני' :
          'השרת אישר COMMIT ובדיקה חוזרת עצמאית של הניקוי והשימור במסד TEST. לא הופעל שותף חיצוני');
        this.focusSummary();
      },
      error: e => {
        if (!this.active(gen)) return;
        if (binding !== this.binding() || !this.same(s) || !(e instanceof HttpErrorResponse) ||
          !this.problemMedia(e) || !cancellationProblem(e.error, e.status, command.commandId) ||
          e.error.effect === 'unknown' || ['COMMAND_IN_PROGRESS', 'COMMAND_ID_CONFLICT'].includes(e.error.code)) { this.unknown(); return; }
        this.handleError(e, command.commandId);
      },
    });
  }
  private problemMedia(e: HttpErrorResponse) {
    return /^application\/problem\+json(?:;\s*charset=utf-8)?$/i.test(e.headers.get('Content-Type') ?? '') &&
      e.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') &&
      e.headers.get('X-Content-Type-Options')?.toLowerCase() === 'nosniff';
  }
  private handleError(e: unknown, commandId: string | null) {
    this.invalidate(); this.context.set(null);
    if (e instanceof HttpErrorResponse && this.problemMedia(e) && cancellationProblem(e.error, e.status, commandId)) {
      if (e.error.effect === 'unknown') { this.unknown(); return; }
      this.fail(e.error.code === 'EXIT_NOT_RECORDED' ? 'לא נרשמה יציאה — זו אינה קבלת ביטול' :
        e.error.code === 'STALE_PREPARATION' ? 'הנתונים או תוקף הבדיקה השתנו — שני האישורים בוטלו; אין שליחה אוטומטית' :
        `${e.error.code} — ${e.error.effect === 'rolled-back' ? 'השרת אישר ביטול מלא' : 'השרת דחה לפני שינוי'}. אין ניסיון חוזר אוטומטי; סמכות כתיבה אינה נפתחת מחדש`);
      if (e.status === 401 || e.status === 403) this.deny();
    } else this.fail('לא ניתן לטעון או לבדוק את ההקשר. לא נשלחה פקודה; אין מעבר אוטומטי לסימולציה');
  }
  private deny() { this.principal.set(null); this.identityState.set('error'); this.context.set(null); this.state.set('denied');
    this.message.set('אין הרשאה או שהמקור לא אומת. אין הנחת מנהל מערכת ואין אימות סיסמה חלופי'); }
  private fail(text: string) { this.state.set('error'); this.message.set(text); this.focusSummary(); }
  private stop() { this.state.set('blocked'); this.message.set('סמכות כתיבה קודמת נצרכה או תוצאה קודמת אינה ידועה. ניקוי יציאה אינו פותח סמכות. נדרש בירור מפעיל מחוץ לממשק — אין כפתור לפתיחה מחדש'); }
  private unknown() { this.invalidate(); this.receipt.set(null); this.state.set('unknown');
    this.message.set('התוצאה אינה ידועה — אין לשלוח שוב; נדרש בירור מפעיל. החלפת עובד, יום, מקור, מסך או טעינה מחדש אינה בירור תוצאה'); this.focusSummary(); }
  private focusSummary() { afterNextRender(() => { if (this.alive) this.host.nativeElement.querySelector<HTMLElement>('#cancellation-summary')?.focus({ preventScroll: true }); }, { injector: this.injector }); }
  cancel() {
    if (['pending', 'success', 'unknown', 'blocked'].includes(this.state())) return;
    this.invalidate(); this.journey.back('/attendance');
  }
  back() { this.invalidate(); this.journey.back('/attendance'); }
  @HostListener('document:keydown', ['$event'])
  escape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || this.operation ||
      this.dialog.openDialogs.length || this.host.nativeElement.querySelector('#menu[open]') ||
      ['pending', 'success', 'unknown', 'blocked'].includes(this.state())) return;
    event.preventDefault(); this.cancel();
  }
}
