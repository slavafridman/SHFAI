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
import { BreaksApi, type DemoBreakPreview, type DemoBreakView } from './breaks-api';
import { CALENDAR_PROVIDERS, calendarDateString, parseCalendarDate } from './calendar';
import type { PersonalShiftItem } from './shifts-api';
import { record, StubContractError, synthetic } from './stub-response';

function errorText(error: unknown): string {
  if (error instanceof StubContractError) { return error.message; }
  if (error instanceof HttpErrorResponse && synthetic(error.error) && typeof error.error['title'] === 'string') {
    return error.error['title'];
  }
  return 'לא ניתן לטעון או לחשב את הפסקות ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-breaks',
  imports: [ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './breaks.html',
  styleUrl: './breaks.scss',
})
export class Breaks implements OnInit {
  private readonly api = inject(BreaksApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private initialization?: Subscription;
  private viewRequest?: Subscription;
  private previewRequest?: Subscription;

  protected readonly shiftId = new FormControl('9007199254740993', { nonNullable: true });
  protected readonly form = new FormGroup({
    breakId: new FormControl('break-1', { nonNullable: true, validators: Validators.required }),
    date: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), Validators.required),
    time: new FormControl('11:45', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)] }),
    duration: new FormControl<number | null>(15, [Validators.required, Validators.min(1), Validators.max(120)]),
  });
  protected readonly shifts = signal<readonly PersonalShiftItem[]>([]);
  protected readonly view = signal<DemoBreakView | null>(null);
  protected readonly preview = signal<DemoBreakPreview | null>(null);
  protected readonly loading = signal(false);
  protected readonly calculating = signal(false);
  protected readonly error = signal('');
  protected readonly previewError = signal('');
  protected readonly ready = signal(false);

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.previewRequest?.unsubscribe();
      this.calculating.set(false);
      this.preview.set(null);
      this.previewError.set('');
    });
    this.connect();
  }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.ready.set(false);
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.shifts.set(result.items);
        this.ready.set(true);
        this.load();
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected load(): void {
    this.viewRequest?.unsubscribe();
    this.previewRequest?.unsubscribe();
    this.view.set(null);
    this.preview.set(null);
    this.previewError.set('');
    this.calculating.set(false);
    this.error.set('');
    if (!this.ready()) { return; }
    if (!this.shifts().some(shift => shift.id === this.shiftId.value)) {
      this.loading.set(false);
      this.error.set('משמרת ההדגמה אינה זמינה ברשימה הנוכחית.');
      return;
    }
    this.loading.set(true);
    this.viewRequest = this.api.view(this.shiftId.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: view => {
        this.view.set(view);
        const first = view.breaks[0];
        if (first) {
          this.form.patchValue({
            breakId: first.id, date: parseCalendarDate(first.startLocal.slice(0, 10)),
            time: first.startLocal.slice(11, 16), duration: 15,
          });
        } else {
          this.form.reset({
            breakId: '', date: parseCalendarDate(view.shift.effective.startLocal.slice(0, 10)),
            time: '', duration: null,
          });
        }
        this.loading.set(false);
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected calculate(): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
    this.previewError.set('');
    this.calculating.set(false);
    const view = this.view();
    if (!view || !view.previewAvailable) {
      this.previewError.set('תצוגה מקדימה אינה זמינה למדיניות משמרת זו.');
      return;
    }
    const { date, time, duration, breakId } = this.form.getRawValue();
    const day = calendarDateString(date);
    if (this.form.invalid || day === null || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
      || duration === null || !Number.isInteger(duration)) {
      this.previewError.set('יש להזין תאריך, שעה מקומית ומשך שלם של 1–120 דקות.');
      this.document.getElementById(this.form.controls.date.invalid || day === null ? 'break-date'
        : this.form.controls.time.invalid || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ? 'break-time' : 'break-duration')?.focus();
      return;
    }
    this.calculating.set(true);
    this.previewRequest = this.api.preview(view.shift.id, { breakId, startLocal: `${day}T${time}:00`, durationMinutes: duration })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.preview.set(result);
          this.calculating.set(false);
          afterNextRender(() => this.document.getElementById('break-preview-title')?.focus(), { injector: this.injector });
        },
        error: error => {
          this.calculating.set(false);
          this.previewError.set(errorText(error));
          if (error instanceof HttpErrorResponse && record(error.error) && Array.isArray(error.error['errors'])
            && error.error['errors'].some((item: unknown) => record(item) && item['field'] === 'startLocal')) {
            this.document.getElementById('break-time')?.focus();
          }
        },
      });
  }
}
