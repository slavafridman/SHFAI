import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { CALENDAR_PROVIDERS, calendarRange, parseCalendarDate } from './calendar';
import type { DemoEmployee } from './employees-api';
import { ExceptionsApi, type DemoExceptionInterval, type DemoExceptionRecord, type ExceptionMode } from './exceptions-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון את חריגות והיעדרויות ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-exceptions',
  imports: [ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './exceptions.html',
  styleUrl: './exceptions.scss',
})
export class Exceptions implements OnInit {
  private readonly api = inject(ExceptionsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private initialization?: Subscription;
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private selectedId = '';

  protected readonly filters = new FormGroup({
    from: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), Validators.required),
    to: new FormControl<Date | null>(parseCalendarDate('2026-10-17'), Validators.required),
    employeeId: new FormControl('00000001', { nonNullable: true }),
    kind: new FormControl<'all' | 'full-day' | 'timed'>('all', { nonNullable: true }),
    includeCancelled: new FormControl(false, { nonNullable: true }),
  });
  protected readonly mode = signal<ExceptionMode>('exceptions');
  protected readonly employees = signal<readonly DemoEmployee[]>([]);
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<readonly DemoExceptionRecord[]>([]);
  protected readonly detail = signal<DemoExceptionRecord | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly error = signal('');
  protected readonly detailError = signal('');
  protected readonly fetchedAt = signal('');

  ngOnInit(): void { this.connect(); }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.ready.set(false);
    this.loading.set(true);
    this.error.set('');
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.employees.set(result.items); this.ready.set(true); this.load(); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }
  protected changeMode(mode: ExceptionMode): void {
    this.mode.set(mode);
    this.load();
  }
  protected load(): void {
    this.listRequest?.unsubscribe();
    this.detailRequest?.unsubscribe();
    this.items.set([]);
    this.detail.set(null);
    this.detailLoading.set(false);
    this.error.set('');
    this.detailError.set('');
    this.fetchedAt.set('');
    this.loading.set(false);
    if (!this.ready()) { return; }
    const values = this.filters.getRawValue();
    const interval = calendarRange(values.from, values.to);
    if (this.filters.invalid || interval === null) {
      this.error.set('יש לבחור תאריכים תקינים בטווח של יום אחד עד 31 ימים.');
      this.document.getElementById(this.filters.controls.from.invalid ? 'exception-from' : 'exception-to')?.focus();
      return;
    }
    if (this.mode() === 'time-off' && !this.employees().some(employee => employee.id === values.employeeId)) {
      this.error.set('יש לבחור עובד בהיקף ההדגמה.'); this.document.getElementById('exception-employee')?.focus(); return;
    }
    this.loading.set(true);
    this.listRequest = this.api.list({
      ...interval, mode: this.mode(), employeeId: values.employeeId,
      kind: values.kind, includeCancelled: values.includeCancelled,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.items.set(result.items); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }
  protected open(id: string): void {
    this.detailRequest?.unsubscribe();
    this.detail.set(null);
    this.detailError.set('');
    this.selectedId = id;
    this.detailLoading.set(true);
    this.detailRequest = this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: item => {
        this.detail.set(item); this.detailLoading.set(false);
        afterNextRender(() => this.document.getElementById('exception-detail-title')?.focus(), { injector: this.injector });
      },
      error: error => { this.detailError.set(errorText(error)); this.detailLoading.set(false); },
    });
  }
  protected close(): void {
    this.detailRequest?.unsubscribe();
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
    this.document.getElementById(`exception-${this.selectedId}`)?.focus();
  }
  protected intervalText(interval: DemoExceptionInterval): string {
    return interval.kind === 'full-day' ? interval.date : `${interval.startLocal} – ${interval.endLocal}`;
  }
}
