import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { ReplacementApi, type DemoReplacementList, type DemoReplacementPreview } from './replacement-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון או לבדוק את מועמדי ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-replacement',
  imports: [MatButtonModule],
  templateUrl: './replacement.html',
  styleUrl: './replacement.scss',
})
export class Replacement implements OnInit {
  private readonly api = inject(ReplacementApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private listRequest?: Subscription;
  private previewRequest?: Subscription;
  private selectedId = '';

  protected readonly data = signal<DemoReplacementList | null>(null);
  protected readonly preview = signal<DemoReplacementPreview | null>(null);
  protected readonly loading = signal(false);
  protected readonly calculating = signal(false);
  protected readonly error = signal('');
  protected readonly previewError = signal('');

  ngOnInit(): void { this.load(); }

  protected load(): void {
    this.listRequest?.unsubscribe();
    this.previewRequest?.unsubscribe();
    this.data.set(null);
    this.preview.set(null);
    this.error.set('');
    this.previewError.set('');
    this.calculating.set(false);
    this.loading.set(true);
    this.listRequest = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.data.set(data); this.loading.set(false); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }

  protected check(id: string): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
    this.previewError.set('');
    this.calculating.set(false);
    const data = this.data();
    if (!data || !data.items.some(item => item.id === id)) {
      this.previewError.set('המועמד אינו זמין ברשימת ההדגמה.'); return;
    }
    this.selectedId = id;
    this.calculating.set(true);
    this.previewRequest = this.api.preview(id, data.source.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: preview => {
        this.preview.set(preview); this.calculating.set(false);
        afterNextRender(() => this.document.getElementById('replacement-result-title')?.focus(), { injector: this.injector });
      },
      error: error => { this.previewError.set(errorText(error)); this.calculating.set(false); },
    });
  }

  protected close(): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
    this.previewError.set('');
    this.calculating.set(false);
    this.document.getElementById(`replacement-${this.selectedId}`)?.focus();
  }

  protected label(status: DemoReplacementPreview['eligibility']): string {
    return {
      'eligible-under-demo-policy': 'מתאים לפי כללי ההדגמה בלבד — לא אישור',
      blocked: 'חסום לפי נתוני ההדגמה',
      'confirmation-required': 'נדרשת בדיקה או הסכמה — אינה זמינה בהדגמה',
      unknown: 'אין די מידע מאומת לתוצאת התאמה',
    }[status];
  }
}
