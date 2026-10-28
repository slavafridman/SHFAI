import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { displayTime } from './contract';
import type { ArrivalSelection } from './stage-arrival-contract';
import type { StationArrivalValidationV1 } from './station-arrival-contract';
import type { NativeStationArrivalContextV1, NativeStationArrivalValidationV1 } from '../../../backend/fixture-slice/oracle-station-arrival-contracts.mts';
import type { StationExitContextV1, StationExitValidationV1 } from './station-exit-contract';

export type StationArrivalDialogData =
  | { kind: 'fixture-warning'; name: string; planned: string; reason: string; validation: StationArrivalValidationV1 }
  | { kind: 'native-confirmation'; selection: ArrivalSelection; context: NativeStationArrivalContextV1;
      validation: NativeStationArrivalValidationV1 }
  | { kind: 'native-exit-confirmation'; selection: ArrivalSelection; context: StationExitContextV1;
      validation: StationExitValidationV1 };

@Component({
  selector: 'shf-station-arrival-dialog',
  imports: [MatDialogModule, MatCheckboxModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './station-arrival-dialog.html',
  styleUrl: './station-arrival-dialog.scss',
})
export class StationArrivalDialog {
  readonly data = inject<StationArrivalDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<StationArrivalDialog, boolean>);
  readonly accepted = new FormControl(false, { nonNullable: true });
  readonly time = displayTime;
  readonly labels = this.data.kind === 'native-exit-confirmation' ? {
    title: 'אישור רישום יציאה מעמדה במסד TEST',
    ackId: 'native-exit-operation-ack', cancelId: 'native-exit-operation-cancel',
    confirmId: 'native-exit-operation-confirm',
    consent: 'קראתי ואני מאשר/ת את כל פעולת הכתיבה למסד TEST',
    cancel: 'ביטול — ללא עדכון', primary: 'אישור רישום יציאה מעמדה במסד TEST',
  } : this.data.kind === 'native-confirmation' ? {
    title: 'אישור רישום הגעה לעמדה במסד TEST',
    ackId: 'native-station-operation-ack', cancelId: 'native-station-operation-cancel',
    confirmId: 'native-station-operation-confirm',
    consent: 'קראתי ואני מאשר/ת את כל פעולת הכתיבה למסד TEST',
    cancel: 'ביטול — ללא עדכון', primary: 'אישור רישום הגעה לעמדה במסד TEST',
  } : {
    title: 'אזהרת איחור לעמדה — סימולציה בלבד',
    ackId: 'station-warning-ack', cancelId: 'station-warning-cancel', confirmId: 'station-warning-review',
    consent: 'קראתי את אזהרת האיחור המדויקת לעמדה',
    cancel: 'ביטול — ללא רישום', primary: 'מעבר לסקירת סימולציה',
  };
  confirmed = false;
  confirm() { if (this.accepted.value) { this.confirmed = true; this.ref.close(true); } }
}
