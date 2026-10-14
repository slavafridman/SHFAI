import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { StaffingApi, type DemoStaffingCandidate, type DemoStaffingKind, type DemoStaffingPreview, type DemoStaffingRequest } from './staffing-api';
import { StubContractError } from './stub-response';

function errorText(error: unknown): string {
  return error instanceof StubContractError ? error.message
    : 'לא ניתן לטעון את בקשות ההדגמה כעת. יש לבדוק את שרת ה־stub ולנסות שוב.';
}

@Component({
  selector: 'app-staffing',
  imports: [ReactiveFormsModule, MatButtonModule],
  templateUrl: './staffing.html',
  styleUrl: './staffing.scss',
})
export class Staffing implements OnInit {
  private readonly api = inject(StaffingApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private initialization?: Subscription;
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private candidateRequest?: Subscription;
  private selectedId = '';
  private previewRequest?: Subscription;
  private previewCandidateId = '';

  protected readonly previewAvailable = signal(false);
  protected readonly preview = signal<DemoStaffingPreview | null>(null);
  protected readonly previewLoading = signal(false);
  protected readonly previewError = signal('');
  protected readonly kind = new FormControl<'all' | DemoStaffingKind>('all', { nonNullable: true });
  protected readonly ready = signal(false);
  protected readonly loading = signal(false);
  protected readonly items = signal<readonly DemoStaffingRequest[]>([]);
  protected readonly detail = signal<DemoStaffingRequest | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly error = signal('');
  protected readonly detailError = signal('');
  protected readonly candidates = signal<readonly DemoStaffingCandidate[]>([]);
  protected readonly candidatesLoaded = signal(false);
  protected readonly candidatesLoading = signal(false);
  protected readonly candidateError = signal('');
  protected readonly fetchedAt = signal('');

  ngOnInit(): void { this.connect(); }

  private clearCandidates(): void {
    this.clearPreview();
    this.candidateRequest?.unsubscribe();
    this.candidates.set([]);
    this.candidatesLoaded.set(false);
    this.candidatesLoading.set(false);
    this.candidateError.set('');
  }

  private clearPreview(): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
    this.previewLoading.set(false);
    this.previewError.set('');
  }

  protected checkCandidate(id: string): void {
    this.clearPreview();
    const request = this.detail();
    if (!request || !this.previewAvailable() || !this.candidates().some(item => item.id === id)) {
      this.previewError.set('חישוב ההדגמה אינו זמין למועמד או לבקשה זו.'); return;
    }
    this.previewCandidateId = id;
    this.previewLoading.set(true);
    this.previewRequest = this.api.preview(request, id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.preview.set(result); this.previewLoading.set(false);
        afterNextRender(() => this.document.getElementById('staffing-preview-title')?.focus(), { injector: this.injector });
      },
      error: error => { this.previewError.set(errorText(error)); this.previewLoading.set(false); },
    });
  }

  protected closePreview(): void {
    this.clearPreview();
    this.document.getElementById(`staffing-preview-${this.previewCandidateId}`)?.focus();
  }

  protected outcome(value: DemoStaffingPreview['outcome']): string {
    return {
      'eligible-under-demo-policy': 'מתאים בחישוב ההדגמה בלבד — ללא שיוך או אישור',
      blocked: 'חסום לפי נתוני ההדגמה',
      unknown: 'אין מידע מאומת לחישוב קיבולת והתאמה',
    }[value];
  }

  protected connect(): void {
    this.initialization?.unsubscribe();
    this.ready.set(false);
    this.previewAvailable.set(false);
    this.loading.set(true);
    this.error.set('');
    this.initialization = this.api.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: capability => { this.previewAvailable.set(capability.previewAvailable); this.ready.set(true); this.load(); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }

  protected load(): void {
    this.listRequest?.unsubscribe();
    this.detailRequest?.unsubscribe();
    this.clearCandidates();
    this.items.set([]);
    this.detail.set(null);
    this.detailLoading.set(false);
    this.error.set('');
    this.detailError.set('');
    this.fetchedAt.set('');
    if (!this.ready()) { return; }
    this.loading.set(true);
    this.listRequest = this.api.list(this.kind.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.items.set(result.items); this.fetchedAt.set(result.fetchedAt); this.loading.set(false); },
      error: error => { this.error.set(errorText(error)); this.loading.set(false); },
    });
  }

  protected open(id: string): void {
    this.detailRequest?.unsubscribe();
    this.clearCandidates();
    this.detail.set(null);
    this.detailError.set('');
    this.selectedId = id;
    this.detailLoading.set(true);
    this.detailRequest = this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: item => {
        this.detail.set(item); this.detailLoading.set(false);
        afterNextRender(() => this.document.getElementById('staffing-detail-title')?.focus(), { injector: this.injector });
      },
      error: error => { this.detailError.set(errorText(error)); this.detailLoading.set(false); },
    });
  }

  protected loadCandidates(): void {
    const request = this.detail();
    if (!request) { return; }
    this.clearCandidates();
    this.candidatesLoading.set(true);
    this.candidateRequest = this.api.candidates(request.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: items => { this.candidates.set(items); this.candidatesLoaded.set(true); this.candidatesLoading.set(false); },
      error: error => { this.candidateError.set(errorText(error)); this.candidatesLoading.set(false); },
    });
  }

  protected close(): void {
    this.detailRequest?.unsubscribe();
    this.clearCandidates();
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
    this.document.getElementById(`staffing-${this.selectedId}`)?.focus();
  }

  protected kindLabel(value: DemoStaffingKind): string {
    return { reinforcement: 'תגבור', 'time-change': 'שינוי שעות', reduction: 'צמצום' }[value];
  }
  protected freshness(value: DemoStaffingRequest['freshness']): string {
    return { current: 'מעודכן בתרחיש ההדגמה בלבד', stale: 'נתון ישן — דורש בדיקה מחדש', unknown: 'עדכניות לא ידועה' }[value];
  }
  protected deadline(value: DemoStaffingRequest['deadlineState']): string {
    return { open: 'המועד פתוח בתרחיש בלבד', elapsed: 'המועד חלף בתרחיש ההדגמה', unknown: 'מצב המועד לא ידוע' }[value];
  }
}
