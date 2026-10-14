import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CALENDAR_PROVIDERS, calendarDateString, calendarRange, parseCalendarDate } from './calendar';
import { Subscription } from 'rxjs';
import { ShiftsApi, StubContractError, type PersonalShiftItem } from './shifts-api';

function errorText(error: unknown): string {
  if (error instanceof StubContractError) {
    return error.message;
  }
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'נתוני ההדגמה אינם זמינים. יש להפעיל את שרת ה־stub או לרענן את הרשימה.';
  }
  return 'לא ניתן לטעון את נתוני ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-personal-shifts',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './personal-shifts.html',
  styleUrl: './personal-shifts.scss',
})
export class PersonalShifts implements OnInit {
  private readonly api = inject(ShiftsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private initialization?: Subscription;
  private selectedId = '';
  private readonly detailHeading = viewChild<ElementRef<HTMLElement>>('detailHeading');

  protected readonly filters = new FormGroup({
    from: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), { validators: [Validators.required] }),
    to: new FormControl<Date | null>(parseCalendarDate('2026-10-17'), { validators: [Validators.required] }),
  });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly displayName = signal('');
  protected readonly items = signal<readonly PersonalShiftItem[]>([]);
  protected readonly detail = signal<PersonalShiftItem | null>(null);
  protected readonly error = signal('');
  protected readonly detailError = signal('');
  protected readonly filterError = signal('');
  protected readonly fetchedAt = signal('');

  ngOnInit(): void {
    this.connect();
  }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.ready.set(false);
    this.error.set('');
    this.loading.set(true);
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: identity => {
        this.displayName.set(identity.displayName);
        this.ready.set(true);
        this.load();
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected load(): void {
    this.listRequest?.unsubscribe();
    this.detailRequest?.unsubscribe();
    this.detailLoading.set(false);
    this.detail.set(null);
    this.detailError.set('');
    this.items.set([]);
    this.fetchedAt.set('');
    this.error.set('');
    this.filterError.set('');
    this.loading.set(false);
    if (!this.ready()) {
      return;
    }
    const values = this.filters.getRawValue();
    const from = calendarDateString(values.from);
    const interval = calendarRange(values.from, values.to);
    if (this.filters.invalid || interval === null) {
      this.filterError.set('יש לבחור תאריכים תקינים בטווח של יום אחד עד 31 ימים.');
      this.document.getElementById(this.filters.controls.from.invalid || from === null ? 'shift-from' : 'shift-to')?.focus();
      return;
    }
    this.loading.set(true);
    this.listRequest = this.api.list(interval.from, interval.toExclusive).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.items.set(result.items);
        this.fetchedAt.set(result.fetchedAt);
        this.loading.set(false);
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected openDetail(id: string): void {
    this.detailRequest?.unsubscribe();
    this.selectedId = id;
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.detailRequest = this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.detail.set(result);
        this.detailLoading.set(false);
        afterNextRender(() => this.detailHeading()?.nativeElement.focus(), { injector: this.injector });
      },
      error: error => { this.detailLoading.set(false); this.detailError.set(errorText(error)); },
    });
  }

  protected closeDetail(): void {
    this.detailRequest?.unsubscribe();
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(false);
    this.document.getElementById(`shift-detail-${this.selectedId}`)?.focus();
  }

  protected flag(value: boolean | null): string {
    return value === null ? 'לא ידוע' : value ? 'כן' : 'לא';
  }
}
