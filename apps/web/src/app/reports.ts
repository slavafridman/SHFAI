import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { localWallMinute } from '../../../api/src/personal-shifts/wall-time';
import { CALENDAR_PROVIDERS, calendarDateString, parseCalendarDate } from './calendar';
import { ReportsApi, type DemoStaffingReport } from './reports-api';
import { StubContractError, synthetic } from './stub-response';

function timeControl(value: string) {
  return new FormControl(value, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)] });
}
function localDate(date: Date | null, time: string): string | null {
  const day = calendarDateString(date);
  return day === null ? null : `${day}T${time}:00`;
}
function errorText(error: unknown): string {
  if (error instanceof StubContractError) { return error.message; }
  if (error instanceof HttpErrorResponse && synthetic(error.error) && typeof error.error['title'] === 'string') {
    return error.error['title'];
  }
  return 'לא ניתן לטעון את דוח ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly api = inject(ReportsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private initialization?: Subscription;
  private request?: Subscription;

  protected readonly form = new FormGroup({
    fromDate: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), Validators.required),
    fromTime: timeControl('08:00'),
    toDate: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), Validators.required),
    toTime: timeControl('10:00'),
    includeBreaks: new FormControl(true, { nonNullable: true }),
    includeExceptions: new FormControl(true, { nonNullable: true }),
  });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly report = signal<DemoStaffingReport | null>(null);
  protected readonly error = signal('');
  protected readonly fetchedAt = signal('');

  ngOnInit(): void { this.connect(); }
  protected connect(): void {
    this.initialization?.unsubscribe();
    this.ready.set(false);
    this.loading.set(true);
    this.error.set('');
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.ready.set(true); this.load(); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }
  protected load(): void {
    this.request?.unsubscribe();
    this.report.set(null);
    this.error.set('');
    this.fetchedAt.set('');
    this.loading.set(false);
    if (!this.ready()) { return; }
    const values = this.form.getRawValue();
    const fromLocal = localDate(values.fromDate, values.fromTime);
    const toExclusiveLocal = localDate(values.toDate, values.toTime);
    const start = localWallMinute(fromLocal);
    const end = localWallMinute(toExclusiveLocal);
    if (this.form.invalid || fromLocal === null || toExclusiveLocal === null || start === null || end === null
      || start % 15 !== 0 || end % 15 !== 0 || end <= start || end - start > 240) {
      this.error.set('יש לבחור 15–240 דקות ובגבולות רבע שעה, עם תאריכים ושעות תקינים.');
      const field = this.form.controls.fromDate.invalid ? 'report-from-date' : start === null || start % 15 !== 0 ? 'report-from-time'
        : this.form.controls.toDate.invalid ? 'report-to-date' : 'report-to-time';
      this.document.getElementById(field)?.focus();
      return;
    }
    this.loading.set(true);
    this.request = this.api.report({
      fromLocal, toExclusiveLocal, includeBreaks: values.includeBreaks, includeExceptions: values.includeExceptions,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.report.set(result.item); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }
  protected equivalent(minutes: number): string { return (minutes / 15).toFixed(2); }
}
