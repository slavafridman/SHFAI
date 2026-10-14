import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { EmployeesApi, type DemoEmployee } from './employees-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון את עובדי ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-employees',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class Employees implements OnInit {
  private readonly api = inject(EmployeesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly cardHeading = viewChild<ElementRef<HTMLElement>>('cardHeading');
  private listRequest?: Subscription;
  private cardRequest?: Subscription;
  private initialization?: Subscription;
  private selectedId = '';

  protected readonly search = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<readonly DemoEmployee[]>([]);
  protected readonly card = signal<DemoEmployee | null>(null);
  protected readonly cardLoading = signal(false);
  protected readonly error = signal('');
  protected readonly cardError = signal('');
  protected readonly fetchedAt = signal('');

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

  protected load(): void {
    this.listRequest?.unsubscribe();
    this.cardRequest?.unsubscribe();
    this.items.set([]);
    this.card.set(null);
    this.cardLoading.set(false);
    this.cardError.set('');
    this.error.set('');
    this.fetchedAt.set('');
    this.loading.set(false);
    if (!this.ready()) { return; }
    if (this.search.invalid) {
      this.error.set('ניתן להזין עד 80 תווים לחיפוש.');
      this.document.getElementById('employee-search')?.focus();
      return;
    }
    this.loading.set(true);
    this.listRequest = this.api.list(this.search.value.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.items.set(result.items); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected open(id: string): void {
    this.cardRequest?.unsubscribe();
    this.selectedId = id;
    this.card.set(null);
    this.cardError.set('');
    this.cardLoading.set(true);
    this.cardRequest = this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: item => {
        this.card.set(item);
        this.cardLoading.set(false);
        afterNextRender(() => this.cardHeading()?.nativeElement.focus(), { injector: this.injector });
      },
      error: error => { this.cardLoading.set(false); this.cardError.set(errorText(error)); },
    });
  }

  protected close(): void {
    this.cardRequest?.unsubscribe();
    this.card.set(null);
    this.cardLoading.set(false);
    this.cardError.set('');
    this.document.getElementById(`employee-open-${this.selectedId}`)?.focus();
  }
}
