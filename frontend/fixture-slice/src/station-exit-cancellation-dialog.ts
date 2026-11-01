import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { displayTime } from './contract';
import type { CancellationContextV1, CancellationValidationV1 } from './station-exit-cancellation-contract';
export type CancellationDialogData = { context: CancellationContextV1; validation: CancellationValidationV1 };
@Component({
  selector: 'shf-cancellation-dialog',
  imports: [MatDialogModule, ReactiveFormsModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title id="cancellation-review-title">רישום היציאה הקיים ינוקה</h2>
    <mat-dialog-content id="cancellation-review-description">
      <p>ינוקו רק זמן היציאה וחותמת המפעיל; המשמרת, ההגעות, התדריך וכל היתר יישמרו.</p>
      <p>ניקוי היציאה אינו פותח מחדש סמכות כתיבה. לא הופעל שותף חיצוני.</p>
      <mat-checkbox id="cancellation-warning-ack" [formControl]="warning"
        aria-label="אישור אזהרת ניקוי יציאה" aria-describedby="cancellation-review-description">
        קראתי והבנתי שרישום היציאה הקיים ינוקה
      </mat-checkbox>
      <dl class="review">
        <div><dt>כעת — יציאה</dt><dd><bdi dir="ltr">{{ time(data.validation.originalExitLocal) }}</bdi></dd></div>
        <div><dt>לאחר הביטול — יציאה</dt><dd>לא נרשמה יציאה</dd></div>
        <div><dt>הגעה לעמדה — ללא שינוי</dt><dd><bdi dir="ltr">{{ time(data.context.recorded.stationArrivalLocal) }}</bdi></dd></div>
        <div><dt>הגעה לבמה — ללא שינוי</dt><dd>{{ data.context.recorded.stageArrivalLocal ? time(data.context.recorded.stageArrivalLocal) : 'לא נרשמה הגעה לבמה' }}</dd></div>
        <div><dt>תדריך — ללא שינוי</dt><dd>{{ data.context.recorded.briefing === null ? 'לא ידוע' : data.context.recorded.briefing ? 'כן' : 'לא' }}</dd></div>
        <div><dt>מקור</dt><dd>{{ data.context.dataSource === 'isolated-fixture' ? 'הדמיה מבודדת בלבד — ללא Oracle' : 'כתיבה בפועל למסד TEST — לא ייצור' }}</dd></div>
        <div><dt>נבדק בזמן השרת</dt><dd><bdi dir="ltr">{{ time(data.validation.evaluatedLocal) }}</bdi></dd></div>
        <div><dt>נבדק / תוקף עד — UTC</dt><dd><bdi dir="ltr">{{ data.validation.evaluatedAt }} / {{ data.validation.expiresAt }}</bdi></dd></div>
        <div><dt>אזור זמן עסקי</dt><dd><bdi dir="ltr">{{ data.validation.businessTimeZone }}</bdi></dd></div>
      </dl>
      <mat-checkbox id="cancellation-operation-ack" [formControl]="operation"
        aria-label="אישור כל הפעולה" aria-describedby="cancellation-review-description">
        אני מאשר/ת את כל פעולת ביטול רישום היציאה בהקשר ובמקור המוצגים
      </mat-checkbox>
      <p>Escape או חזרה ללא שינוי סוגרים את הסקירה ללא שליחת פקודה. Enter מפעיל רק את הכפתור שבמיקוד. Space משנה אישור.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button id="cancellation-safe-cancel" (click)="ref.close(false)">חזרה ללא שינוי</button>
      <button mat-flat-button id="cancellation-send" [disabled]="!warning.value || !operation.value" (click)="confirm()">
        {{ data.context.dataSource === 'isolated-fixture' ? 'הדמיית ביטול רישום יציאה' : 'שליחת ביטול רישום יציאה — TEST' }}
      </button>
    </mat-dialog-actions>`,
  styles: [`
    :host { display:block; direction:rtl; min-inline-size:0; }
    .review { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
    dt { font-weight:600; } dd { margin:0; overflow-wrap:anywhere; }
    mat-checkbox { display:block; margin-block:1rem; }
    mat-dialog-actions { gap:.5rem; flex-wrap:wrap; }
    @media(max-width:600px) { .review { grid-template-columns:1fr; } }
  `],
})
export class StationExitCancellationDialog {
  readonly data = inject<CancellationDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<StationExitCancellationDialog, boolean>);
  readonly warning = new FormControl(false, { nonNullable: true });
  readonly operation = new FormControl(false, { nonNullable: true });
  readonly time = displayTime;
  confirmed = false;
  confirm() {
    if (this.warning.value && this.operation.value) { this.confirmed = true; this.ref.close(true); }
  }
}
