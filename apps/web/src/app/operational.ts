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
import { OperationalApi, type OperationalMode, type OperationalRow } from './operational-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון את התצוגה התפעולית כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-operational',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: CALENDAR_PROVIDERS,
  templateUrl: './operational.html',
  styleUrl: './operational.scss',
})
export class Operational implements OnInit {
  private readonly api = inject(OperationalApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private request?: Subscription;
  private initialization?: Subscription;

  protected readonly filters = new FormGroup({
    from: new FormControl<Date | null>(parseCalendarDate('2026-10-14'), Validators.required),
    to: new FormControl<Date | null>(parseCalendarDate('2026-10-17'), Validators.required),
  });
  protected readonly mode = signal<OperationalMode>('schedule');
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly rows = signal<readonly OperationalRow[]>([]);
  protected readonly error = signal('');
  protected readonly fetchedAt = signal('');
  protected readonly selected = signal<OperationalRow | null>(null);
  private selectedId = '';

  ngOnInit(): void { this.connect(); }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.ready.set(false);
    this.loading.set(true);
    this.error.set('');
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.ready.set(true); this.load(); },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected changeMode(mode: OperationalMode): void {
    this.mode.set(mode);
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.rows.set([]);
    this.selected.set(null);
    this.error.set('');
    this.fetchedAt.set('');
    this.loading.set(false);
    if (!this.ready()) { return; }
    const { from, to } = this.filters.getRawValue();
    const interval = calendarRange(from, to);
    if (this.filters.invalid || interval === null) {
      this.error.set('יש לבחור תאריכים תקינים בטווח של יום אחד עד 31 ימים.');
      this.document.getElementById(this.filters.controls.from.invalid ? 'ops-from' : 'ops-to')?.focus();
      return;
    }
    this.loading.set(true);
    this.request = this.api.list(this.mode(), interval.from, interval.toExclusive)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => { this.rows.set(result.items); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
        error: error => { this.loading.set(false); this.error.set(errorText(error)); },
      });
  }

  protected open(row: OperationalRow): void {
    this.selectedId = row.shift.id;
    this.selected.set(row);
    afterNextRender(() => this.document.getElementById('ops-detail-title')?.focus(), { injector: this.injector });
  }

  protected close(): void {
    this.selected.set(null);
    this.document.getElementById(`ops-row-${this.selectedId}`)?.focus();
  }
}
