import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { displayTime } from './contract';
import { warningsFor, warningLabels, type ShiftEffectV1, type ShiftWarningCodeV1,
  type ShiftOperationKindV1 } from './shift-management-contract';
export interface ManagementReview {
  kind: ShiftOperationKindV1; native: boolean; effects: ShiftEffectV1[];
}
export interface ManagementConsent { accepted: true; warningCodes: ShiftWarningCodeV1[] }
@Component({
  selector: 'shf-shift-management-dialog',
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './shift-management-dialog.html',
  styleUrl: './shift-management-dialog.scss',
})
export class ShiftManagementDialog {
  readonly data = inject<ManagementReview>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ShiftManagementDialog, ManagementConsent>);
  readonly warnings = warningsFor(this.data.effects);
  readonly checks = new Map(this.warnings.map(w => [w, new FormControl(false, { nonNullable: true })]));
  readonly operation = new FormControl(false, { nonNullable: true });
  readonly labels = warningLabels;
  readonly time = displayTime;
  readonly action = this.data.kind === 'csv-create' ? 'החלת כל שורות הייבוא' :
    this.data.kind === 'cancel' ? 'ביטול לוגי של המשמרת' : 'שמירת השינוי';
  canConfirm() { return this.operation.value && this.warnings.every(w => this.checks.get(w)?.value === true); }
  confirm() {
    if (this.canConfirm()) this.ref.close({ accepted: true, warningCodes: [...this.warnings] });
  }
}
