import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { MessagesApi, type MessageReadStatus, type PersonalMessage } from './messages-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון את הודעות ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-personal-messages',
  imports: [ReactiveFormsModule, MatButtonModule],
  templateUrl: './personal-messages.html',
  styleUrl: './personal-messages.scss',
})
export class PersonalMessages implements OnInit {
  private readonly api = inject(MessagesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly detailHeading = viewChild<ElementRef<HTMLElement>>('messageHeading');
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private initialization?: Subscription;
  private selectedId = '';

  protected readonly status = new FormControl<MessageReadStatus>('all', { nonNullable: true });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<readonly PersonalMessage[]>([]);
  protected readonly detail = signal<PersonalMessage | null>(null);
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
    this.error.set('');
    this.fetchedAt.set('');
    if (!this.ready()) { return; }
    this.loading.set(true);
    this.listRequest = this.api.list(this.status.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.items.set(result.items); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
      error: error => { this.loading.set(false); this.error.set(errorText(error)); },
    });
  }

  protected open(id: string): void {
    this.detailRequest?.unsubscribe();
    this.selectedId = id;
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.detailRequest = this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: item => {
        this.detail.set(item);
        this.detailLoading.set(false);
        afterNextRender(() => this.detailHeading()?.nativeElement.focus(), { injector: this.injector });
      },
      error: error => { this.detailLoading.set(false); this.detailError.set(errorText(error)); },
    });
  }

  protected close(): void {
    this.detailRequest?.unsubscribe();
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
    this.document.getElementById(`message-open-${this.selectedId}`)?.focus();
  }

  protected readLabel(value: boolean | null): string {
    return value === null ? 'מצב קריאה לא ידוע' : value ? 'נקראה בנתוני ההדגמה' : 'טרם נקראה בנתוני ההדגמה';
  }
}
