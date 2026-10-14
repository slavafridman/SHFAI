import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { SystemParametersApi, type DemoSystemParameter } from './system-parameters-api';
import { StubContractError, synthetic } from './stub-response';

function errorText(error: unknown): string {
  if (error instanceof StubContractError) { return error.message; }
  if (error instanceof HttpErrorResponse && synthetic(error.error) && typeof error.error['title'] === 'string') {
    return error.error['title'];
  }
  return 'לא ניתן לטעון את פרמטרי ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-system-parameters',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './system-parameters.html',
  styleUrl: './system-parameters.scss',
})
export class SystemParameters implements OnInit {
  private readonly api = inject(SystemParametersApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('parameterHeading');
  private initialization?: Subscription;
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private selectedCode = '';
  protected readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true, validators: Validators.maxLength(80) }),
  });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<readonly DemoSystemParameter[]>([]);
  protected readonly fetchedAt = signal('');
  protected readonly sourceVersion = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly error = signal('');
  protected readonly detail = signal<DemoSystemParameter | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal('');
  protected readonly detailFetchedAt = signal('');

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
    this.detailRequest?.unsubscribe();
    this.items.set([]);
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
    this.detailFetchedAt.set('');
    this.error.set('');
    this.fetchedAt.set('');
    this.sourceVersion.set('');
    this.loading.set(false);
    this.selectedCode = '';
    if (!this.ready()) { return; }
    if (this.form.invalid) {
      this.error.set('יש להזין לכל היותר 80 תווים לחיפוש פרמטר.');
      this.document.getElementById('system-parameter-search')?.focus();
      return;
    }
    this.loading.set(true);
    this.listRequest = this.api.list(this.form.controls.search.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.items.set(result.items); this.appliedSearch.set(result.search);
        this.sourceVersion.set(result.sourceVersion); this.fetchedAt.set(result.fetchedAt); this.loading.set(false);
      },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }
  protected open(code: string): void {
    this.detailRequest?.unsubscribe();
    this.selectedCode = code;
    this.detail.set(null);
    this.detailError.set('');
    this.detailFetchedAt.set('');
    this.detailLoading.set(true);
    this.detailRequest = this.api.detail(code).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.detail.set(result.item); this.detailFetchedAt.set(result.fetchedAt); this.detailLoading.set(false);
        afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
      },
      error: error => { this.detailLoading.set(false); this.detailError.set(errorText(error)); },
    });
  }
  protected retryDetail(): void { this.open(this.selectedCode); }
  protected close(): void {
    this.detailRequest?.unsubscribe();
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
    this.detailFetchedAt.set('');
    this.document.getElementById(`system-parameter-open-${this.selectedCode}`)?.focus();
  }
  protected resolutionLabel(value: DemoSystemParameter['resolution']): string {
    return value === 'unit' ? 'ערך יחידה בהדגמה' : value === 'default' ? 'ברירת מחדל בהדגמה' : 'ללא ערך ידוע';
  }
}
