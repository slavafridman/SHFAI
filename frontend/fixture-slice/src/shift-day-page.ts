import {
  afterNextRender, Component, DestroyRef, ElementRef, inject, signal, viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SliceApi } from './api';
import { WorkspaceShell } from './workspace-shell';
import { ListNavigation } from './list-navigation';
import { ViewHistory } from './view-history';
import {
  detail, displayTime, id, identity, problem,
  type EmployeeShiftDayResponseV1, type IdentityResponseV1,
} from './contract';

type Pair = { employeeId: string; shiftDayId: string };
const same = (a: Pair | null, b: Pair | null) =>
  !!a && !!b && a.employeeId === b.employeeId && a.shiftDayId === b.shiftDayId;
const COPY = {
  identity: 'לא ניתן לטעון את פרטי הזהות. לא הוצגו נתוני עובד.',
  mismatch: 'התקבלה תשובה שאינה תואמת לבקשה. לא הוצגו נתונים.',
  unavailable: 'לא ניתן לטעון את הפרטים כעת. אפשר לנסות שוב.',
  internal: 'לא ניתן להציג את הרשומה עקב שגיאה. לא בוצע שינוי בנתונים.',
  forbidden: 'אין הרשאה להצגת פרטי משמרת.',
  unauthenticated: 'לא ניתן לאמת את הזהות. יש לטעון מחדש את פרטי הזהות.',
};

@Component({
  selector: 'shf-shift-day',
  imports: [
    ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatProgressBarModule, WorkspaceShell,
  ],
  templateUrl: './shift-day-page.html',
  styleUrl: './shift-day-page.scss',
})
export class ShiftDayPage {
  readonly journey = inject(ViewHistory);
  private readonly api = inject(SliceApi);
  private readonly navigation = inject(ListNavigation);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly title = viewChild<ElementRef<HTMLElement>>('pageTitle');
  readonly technical = viewChild<ElementRef<HTMLDetailsElement>>('technical');
  readonly fromDiagnostic = signal(false);
  readonly fromList = signal(false);
  readonly fromSearch = signal(false);
  readonly fromSchedule = signal(false);
  sourceUnit() {
    if (this.fromSchedule()) {
      const row = this.navigation.scheduleDetail;
      return row && row.dataSource === this.principal()?.dataSource &&
        row.unit.code === this.row()?.employee.orgUnitId ? row.unit : null;
    }
    const origin = this.fromSearch() ? this.navigation.searchOrigin : this.navigation.origin;
    return this.fromList() && origin && origin.dataSource === this.principal()?.dataSource &&
      origin.unit.code === this.row()?.employee.orgUnitId ? origin.unit : null;
  }
  readonly form = new FormGroup({
    employeeId: new FormControl('', { nonNullable: true, validators: [
      Validators.required, Validators.pattern(/^[1-9][0-9]{0,37}$/),
    ] }),
    shiftDayId: new FormControl('', { nonNullable: true, validators: [
      Validators.required, Validators.pattern(/^[1-9][0-9]{0,9}$/),
    ] }),
  });
  readonly principal = signal<IdentityResponseV1 | null>(null);
  readonly identityState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly identityError = signal('');
  readonly forbidden = signal(false);
  readonly row = signal<EmployeeShiftDayResponseV1 | null>(null);
  readonly state = signal<'initial' | 'loading' | 'success' | 'error' | 'dirty'>('initial');
  readonly message = signal('');
  readonly announcement = signal('');
  readonly reference = signal('');
  readonly committed = signal<Pair | null>(null);
  readonly invalidRoute = signal(false);
  private identityGeneration = 0;
  private generation = 0;
  private alive = true;
  private identityWork?: Subscription;
  private detailWork?: Subscription;
  private deferredRoute: Pair | null = null;
  private ownNavigation: Pair | null = null;
  readonly time = displayTime;

  constructor() {
    this.journey.attach(this.host.nativeElement);
    afterNextRender(() => {
      this.title()?.nativeElement.focus({ preventScroll: true });
      document.documentElement.scrollTop = 0;
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.cancelDetail();
      this.deferredRoute = null;
      this.state.set('dirty');
      this.message.set('ההקשר השתנה. יש להציג את הפרטים מחדש.');
      this.announcement.set(this.message());
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const employeeId = params.get('employeeId'), shiftDayId = params.get('shiftDayId');
      const pair = employeeId !== null && shiftDayId !== null ? { employeeId, shiftDayId } : null;
      const schedule = this.navigation.scheduleDetail;
      this.fromSchedule.set(this.navigation.detailOrigin === 'my-shifts' && !!pair &&
        pair.employeeId === schedule?.employeeId && pair.shiftDayId === schedule?.shiftDayId);
      const origin = this.navigation.detailOrigin === 'shift-search' ? this.navigation.searchOrigin : this.navigation.origin;
      this.fromList.set(!!pair && !!origin && pair.employeeId === origin.employeeId && pair.shiftDayId === origin.shiftDayId);
      this.fromSearch.set(this.fromList() && this.navigation.detailOrigin === 'shift-search');
      if (this.fromList()) this.navigation.returning = true;
      // Only our supported diagnostic origin is recognized; never follow a return URL.
      this.fromDiagnostic.set(!!pair &&
        this.router.currentNavigation()?.extras.state?.['origin'] === 'shift-day-diagnostic');
      if (same(pair, this.ownNavigation)) { this.ownNavigation = null; return; }
      this.ownNavigation = null;
      this.cancelDetail();
      this.committed.set(null);
      this.deferredRoute = null;
      this.invalidRoute.set(false);
      this.form.reset(pair ?? { employeeId: '', shiftDayId: '' }, { emitEvent: false });
      this.state.set('initial');
      this.message.set('');
      this.queueFocus('h1', this.generation);
      if (pair) {
        if (!id(pair.employeeId) || !id(pair.shiftDayId, 10)) {
          this.invalidRoute.set(true);
          this.state.set('error');
          this.message.set('הקשר לא תקין. יש להזין מזהים תקינים בטופס בחירת ההקשר.');
          this.form.markAllAsTouched();
        } else {
          this.committed.set(pair);
          this.deferredRoute = pair;
          if (this.canRead()) { this.deferredRoute = null; this.load(pair, false); }
        }
      }
    });
    this.recheckIdentity();
    this.destroy.onDestroy(() => {
      this.alive = false;
      this.identityGeneration++;
      this.cancelDetail();
      this.identityWork?.unsubscribe();
    });
  }

  canRead(): boolean {
    return this.identityState() === 'ready' && !this.forbidden() &&
      !!this.principal()?.principal.capabilities.includes('shift-day:read');
  }
  disabledReason(): string {
    if (this.identityState() === 'loading') return 'טוען את פרטי מצב ההדגמה…';
    if (this.identityState() !== 'ready') return this.identityError() || COPY.identity;
    return this.canRead() ? '' : COPY.forbidden;
  }
  isSamePending(): boolean {
    return this.state() === 'loading' && same(this.committed(), this.form.getRawValue());
  }
  fieldError(name: 'employeeId' | 'shiftDayId'): string {
    const control = this.form.controls[name];
    if (!control.touched || !control.invalid) return '';
    if (control.hasError('required')) return name === 'employeeId'
      ? 'יש להזין מזהה עובד' : 'יש להזין מזהה יום עבודה';
    return `יש להזין ספרות 0–9 בלבד, ללא אפס מוביל או רווחים, עד ${name === 'employeeId' ? 38 : 10} ספרות`;
  }
  focusInput(name = 'employeeId'): void {
    if (this.technical()) this.technical()!.nativeElement.open = true;
    this.host.nativeElement.querySelector<HTMLInputElement>(`#${name}`)?.focus();
  }
  backToEntry(): void {
    if (this.journey.parentPath()?.endsWith('/breaks-and-exceptions')) { this.journey.back(); return; }
    if (this.fromSchedule() && this.navigation.schedule) {
      this.navigation.returning = true;
      if (this.journey.backIf(this.navigation.schedule.path)) return;
      void this.router.navigate([this.navigation.schedule.path]); return;
    }
    if (this.fromList()) {
      this.navigation.returning = true;
      if (this.journey.backIf(this.fromSearch() ? '/shift-search' : '/current-shifts')) return;
      void this.router.navigate([this.fromSearch() ? '/shift-search' : '/current-shifts']);
      return;
    }
    void this.router.navigate(['/shift-day']).then(() => this.focusInput());
  }
  private cancelDetail(): void {
    this.generation++;
    this.detailWork?.unsubscribe();
    this.row.set(null);
    this.reference.set('');
    this.announcement.set('');
  }
  recheckIdentity(): void {
    this.cancelDetail();
    const gen = ++this.identityGeneration;
    this.identityWork?.unsubscribe();
    this.principal.set(null);
    this.identityState.set('loading');
    this.identityError.set('');
    this.forbidden.set(false);
    this.state.set(this.invalidRoute() ? 'error' : 'initial');
    this.message.set(this.invalidRoute()
      ? 'הקשר לא תקין. יש להזין מזהים תקינים בטופס בחירת ההקשר.' : '');
    this.announcement.set('טוען את פרטי מצב ההדגמה…');
    this.identityWork = this.api.identity().subscribe({
      next: value => {
        if (!this.alive || gen !== this.identityGeneration) return;
        if (!identity(value)) { this.failIdentity(COPY.mismatch); return; }
        this.principal.set(value);
        this.identityState.set('ready');
        this.announcement.set('');
        const pair = this.deferredRoute;
        this.deferredRoute = null;
        if (pair && this.canRead()) this.load(pair, false);
      },
      error: () => {
        if (this.alive && gen === this.identityGeneration) this.failIdentity(COPY.identity);
      },
    });
  }
  private failIdentity(message: string): void {
    this.cancelDetail();
    this.principal.set(null);
    this.identityState.set('error');
    this.identityError.set(message);
    this.announcement.set(message);
    this.queueFocus('#identity-heading', this.generation);
  }
  submit(): void {
    if (!this.canRead() || this.isSamePending()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusInput(this.form.controls.employeeId.invalid ? 'employeeId' : 'shiftDayId');
      return;
    }
    const pair = this.form.getRawValue();
    const reload = same(pair, this.committed());
    this.invalidRoute.set(false);
    this.deferredRoute = null;
    this.committed.set(pair);
    this.ownNavigation = pair;
    if (this.router.url === '/shift-day') this.fromDiagnostic.set(true);
    void this.router.navigate(['/employees', pair.employeeId, 'shift-days', pair.shiftDayId], {
      state: this.fromDiagnostic() ? { origin: 'shift-day-diagnostic' } : {},
    })
      .then(ok => { if (!ok && same(pair, this.ownNavigation)) this.ownNavigation = null; });
    this.load(pair, reload);
  }
  reload(): void {
    const pair = this.committed();
    if (pair && this.canRead() && this.state() !== 'loading' && this.state() !== 'dirty')
      this.load(pair, true);
  }
  canReadItems(): boolean { return this.canRead() && !!this.principal()?.principal.capabilities.includes('shift-items:read'); }
  fromItems(): boolean { return !!this.journey.parentPath()?.endsWith('/breaks-and-exceptions'); }
  openItems(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    const row = this.row();
    if (!row || !this.canReadItems()) return;
    const path = `/employees/${row.employeeId}/shift-days/${row.shiftDayId}/breaks-and-exceptions`;
    if (!this.journey.backIf(path)) void this.router.navigateByUrl(path);
  }
  private load(pair: Pair, reload: boolean): void {
    this.cancelDetail();
    const gen = this.generation, identityGen = this.identityGeneration;
    this.state.set('loading');
    this.message.set('טוען פרטי משמרת…');
    this.announcement.set(this.message());
    const current = () => this.alive && gen === this.generation &&
      identityGen === this.identityGeneration && this.canRead();
    this.detailWork = this.api.detail(pair.employeeId, pair.shiftDayId).subscribe({
      next: value => {
        if (!current()) return;
        if (!detail(value, pair.employeeId, pair.shiftDayId, this.principal()!.dataSource)) {
          this.terminalError(COPY.mismatch, gen, reload); return;
        }
        this.row.set(value);
        this.state.set('success');
        this.message.set('פרטי המשמרת נטענו');
        this.announcement.set(this.message());
        if (!reload) this.queueFocus('#result-heading', gen);
        setTimeout(() => { if (current()) this.journey.restore(this.host.nativeElement); });
      },
      error: (error: unknown) => {
        if (!current()) return;
        this.handleError(error, gen, reload);
      },
    });
  }
  private handleError(error: unknown, gen: number, reload: boolean): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.terminalError(COPY.unavailable, gen, reload); return;
    }
    if (error.status === 0) { this.terminalError(COPY.unavailable, gen, reload); return; }
    if (!problem(error.error, error.status)) {
      this.terminalError(COPY.internal, gen, reload); return;
    }
    const p = error.error;
    this.reference.set(p.requestId);
    switch (p.status) {
      case 400:
        for (const parameter of p.invalidParameters ?? []) {
          if (parameter.name === 'employeeId' || parameter.name === 'shiftDayId') {
            const control = this.form.controls[parameter.name];
            control.setErrors({ server: true });
            control.markAsTouched();
          }
        }
        this.terminalError('לא ניתן להציג את הפרטים. יש לבדוק את המזהים שהוזנו.', gen, reload);
        break;
      case 401:
        this.identityGeneration++;
        this.identityWork?.unsubscribe();
        this.cancelDetail();
        this.principal.set(null);
        this.identityState.set('error');
        this.identityError.set(COPY.unauthenticated);
        this.terminalError(COPY.unauthenticated, this.generation, reload);
        break;
      case 403:
        this.forbidden.set(true);
        this.terminalError(COPY.forbidden, gen, reload);
        break;
      case 404:
        this.terminalError('לא נמצאה רשומה זמינה להקשר שנבחר.', gen, reload);
        break;
      case 503: this.terminalError(COPY.unavailable, gen, reload); break;
      default: this.terminalError(COPY.internal, gen, reload);
    }
  }
  private terminalError(message: string, gen: number, reload: boolean): void {
    this.row.set(null);
    this.state.set('error');
    this.message.set(message);
    this.announcement.set(reload ? message : '');
    if (!reload || !this.canRead()) this.queueFocus('#error-heading', gen);
  }
  private queueFocus(selector: string, gen: number): void {
    // After signal-driven rendering; generation check also protects focus from late work.
    setTimeout(() => {
      if (this.alive && gen === this.generation)
        this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
    });
  }
}
