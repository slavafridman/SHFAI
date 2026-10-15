import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'shf-minute-picker',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, FormsModule],
  template: `
    <h2 mat-dialog-title>בחירת שעה</h2>
    <mat-dialog-content>
      <p>שעון 24 שעות · דיוק של דקה</p>
      <div class="minute-fields">
        <mat-form-field appearance="outline"><mat-label>שעה (<bdi dir="ltr">00–23</bdi>)</mat-label>
          <mat-select id="picker-hour" [(ngModel)]="hour" dir="ltr">
            @for (value of hours; track value) { <mat-option [value]="value">{{ value }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>דקה (<bdi dir="ltr">00–59</bdi>)</mat-label>
          <mat-select id="picker-minute" [(ngModel)]="minute" dir="ltr">
            @for (value of minutes; track value) { <mat-option [value]="value">{{ value }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close type="button">ביטול</button>
      <button id="time-apply" mat-flat-button type="button" (click)="ref.close(hour + ':' + minute)">החלה</button>
    </mat-dialog-actions>`,
  styles: [`
    .minute-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:16px }
    mat-form-field { min-width:0; width:100% } p { font-size:13px; margin:0 }
    @media(max-width:350px) { .minute-fields { grid-template-columns:1fr; gap:8px } }
  `],
})
export class MinutePicker {
  readonly ref = inject(MatDialogRef<MinutePicker, string>);
  private readonly value = inject<string>(MAT_DIALOG_DATA);
  readonly hours = Array.from({ length: 24 }, (_, n) => String(n).padStart(2, '0'));
  readonly minutes = Array.from({ length: 60 }, (_, n) => String(n).padStart(2, '0'));
  hour = this.value.slice(0, 2);
  minute = this.value.slice(3, 5);
}
