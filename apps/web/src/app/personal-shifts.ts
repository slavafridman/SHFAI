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
import { Subscription } from 'rxjs';
import { ShiftsApi, StubContractError, type PersonalShiftItem } from './shifts-api';

function date(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

function range(from: string, to: string): string | null {
  const start = date(from);
  const end = date(to);
  if (start === null || end === null || end < start || (end.getTime() - start.getTime()) / 86_400_000 >= 31) {
    return null;
  }
  end.setUTCDate(end.getUTCDate() + 1);
  const exclusive = end.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(exclusive) ? exclusive : null;
}

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
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
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
    from: new FormControl('2026-10-14', { nonNullable: true, validators: [Validators.required] }),
    to: new FormControl('2026-10-17', { nonNullable: true, validators: [Validators.required] }),
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
    const { from, to } = this.filters.getRawValue();
    const toExclusive = range(from, to);
    if (this.filters.invalid || toExclusive === null) {
      this.filterError.set('יש לבחור תאריכים תקינים בטווח של יום אחד עד 31 ימים.');
      this.document.getElementById(date(from) === null ? 'shift-from' : 'shift-to')?.focus();
      return;
    }
    this.loading.set(true);
    this.listRequest = this.api.list(from, toExclusive).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
