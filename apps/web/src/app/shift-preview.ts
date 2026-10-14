import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { CALENDAR_PROVIDERS, calendarDateString, parseCalendarDate } from './calendar';
import { ShiftPreviewApi, type DemoShiftPreview, type DemoShiftPreviewContext } from './shift-preview-api';
import type { PersonalShiftItem } from './shifts-api';
import { StubContractError, synthetic } from './stub-response';

function timeControl(value: string) {
  return new FormControl(value, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)] });
}
function dateControl(value: string) { return new FormControl<Date | null>(parseCalendarDate(value), Validators.required); }
function localValue(date: Date | null, time: string): string | null {
  const day = calendarDateString(date);
  return day !== null && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ? `${day}T${time}:00` : null;
}
function errorText(error: unknown): string {
  if (error instanceof StubContractError) { return error.message; }
  if (error instanceof HttpErrorResponse && synthetic(error.error) && typeof error.error['title'] === 'string') {
    return error.error['title'];
  }
  return 'לא ניתן לחשב את הצעת המשמרת כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-shift-preview',
  imports: [ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './shift-preview.html',
  styleUrl: './shift-preview.scss',
})
export class ShiftPreview implements OnInit {
  private readonly api = inject(ShiftPreviewApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private initialization?: Subscription;
  private sourceRequest?: Subscription;
  private previewRequest?: Subscription;

  protected readonly shiftId = new FormControl('9007199254740993', { nonNullable: true });
  protected readonly form = new FormGroup({
    startDate: dateControl('2026-10-14'), startTime: timeControl('08:00'),
    endDate: dateControl('2026-10-14'), endTime: timeControl('18:00'),
    split: new FormControl(false, { nonNullable: true }),
    gapStartDate: dateControl('2026-10-14'), gapStartTime: timeControl('14:00'),
    gapEndDate: dateControl('2026-10-14'), gapEndTime: timeControl('16:00'),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)] }),
  });
  protected readonly shifts = signal<readonly PersonalShiftItem[]>([]);
  protected readonly source = signal<DemoShiftPreviewContext | null>(null);
  protected readonly preview = signal<DemoShiftPreview | null>(null);
  protected readonly loading = signal(false);
  protected readonly calculating = signal(false);
  protected readonly ready = signal(false);
  protected readonly error = signal('');
  protected readonly previewError = signal('');

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.clearPreview());
    this.connect();
  }
  private clearPreview(): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
    this.previewError.set('');
    this.calculating.set(false);
  }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.loading.set(true);
    this.ready.set(false);
    this.error.set('');
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.shifts.set(result.items); this.ready.set(true); this.load(); },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected load(): void {
    this.sourceRequest?.unsubscribe();
    this.clearPreview();
    this.source.set(null);
    this.error.set('');
    if (!this.ready()) { return; }
    if (!this.shifts().some(item => item.id === this.shiftId.value)) {
      this.loading.set(false); this.error.set('משמרת ההדגמה אינה זמינה.'); return;
    }
    this.loading.set(true);
    this.sourceRequest = this.api.context(this.shiftId.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: source => {
        this.source.set(source);
        const schedule = source.shift.effective;
        this.form.reset({
          startDate: parseCalendarDate(schedule.startLocal.slice(0, 10)), startTime: schedule.startLocal.slice(11, 16),
          endDate: parseCalendarDate(schedule.endLocal.slice(0, 10)), endTime: schedule.endLocal.slice(11, 16),
          split: schedule.split.enabled === true,
          gapStartDate: parseCalendarDate((schedule.split.gapStartLocal ?? schedule.startLocal).slice(0, 10)),
          gapStartTime: schedule.split.gapStartLocal?.slice(11, 16) ?? '14:00',
          gapEndDate: parseCalendarDate((schedule.split.gapEndLocal ?? schedule.startLocal).slice(0, 10)),
          gapEndTime: schedule.split.gapEndLocal?.slice(11, 16) ?? '16:00', reason: '',
        });
        this.loading.set(false);
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected calculate(): void {
    this.clearPreview();
    const source = this.source();
    if (!source?.previewAvailable) { this.previewError.set('מדיניות מקור או שותף למשמרת זו לא אומתה.'); return; }
    const values = this.form.getRawValue();
    const startLocal = localValue(values.startDate, values.startTime);
    const endLocal = localValue(values.endDate, values.endTime);
    const gapStartLocal = localValue(values.gapStartDate, values.gapStartTime);
    const gapEndLocal = localValue(values.gapEndDate, values.gapEndTime);
    if (startLocal === null || endLocal === null || !values.reason.trim() || this.form.controls.reason.invalid
      || (values.split && (gapStartLocal === null || gapEndLocal === null))) {
      this.previewError.set('יש להזין תאריכים, שעות וסיבה תקינים; לפיצול יש להזין גם גבולות פער.');
      const field = startLocal === null ? this.form.controls.startDate.invalid ? 'proposal-start-date' : 'proposal-start-time'
        : endLocal === null ? this.form.controls.endDate.invalid ? 'proposal-end-date' : 'proposal-end-time'
          : this.form.controls.reason.invalid ? 'proposal-reason'
            : gapStartLocal === null ? this.form.controls.gapStartDate.invalid ? 'proposal-gap-start-date' : 'proposal-gap-start-time'
              : this.form.controls.gapEndDate.invalid ? 'proposal-gap-end-date' : 'proposal-gap-end-time';
      this.document.getElementById(field)?.focus();
      return;
    }
    this.calculating.set(true);
    this.previewRequest = this.api.preview(source.shift.id, {
      startLocal, endLocal, reason: values.reason,
      split: values.split && gapStartLocal !== null && gapEndLocal !== null ? { gapStartLocal, gapEndLocal } : null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: preview => {
        this.preview.set(preview); this.calculating.set(false);
        afterNextRender(() => this.document.getElementById('shift-proposal-result')?.focus(), { injector: this.injector });
      },
      error: error => { this.previewError.set(errorText(error)); this.calculating.set(false); },
    });
  }
}
