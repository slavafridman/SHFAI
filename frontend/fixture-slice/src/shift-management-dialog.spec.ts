import { afterEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ShiftManagementDialog, type ManagementReview, type ManagementConsent } from './shift-management-dialog';
import { managementPreparationFixture, managementContextFixture } from './shift-management-fixtures';
describe('one M3 typed Material review dialog', () => {
  afterEach(() => TestBed.inject(MatDialog).closeAll());
  it('all warnings and whole operation are independently unchecked and required', () => {
    TestBed.configureTestingModule({});
    const effects = managementPreparationFixture(managementContextFixture(true), {
      kind: 'cancel', shiftDayId: '6201', reasonCode: 'C1', remark: null,
    }).effects;
    const ref = TestBed.inject(MatDialog).open<ShiftManagementDialog, ManagementReview, ManagementConsent>(
      ShiftManagementDialog, { data: { kind: 'cancel', native: true, effects }, direction: 'rtl' });
    const d = ref.componentInstance;
    expect(d.operation.value).toBe(false); expect([...d.checks.values()].every(c => !c.value)).toBe(true);
    d.operation.setValue(true); expect(d.canConfirm()).toBe(false);
    d.checks.get('SOURCE_BECOMES_SHF')!.setValue(true); expect(d.canConfirm()).toBe(false);
    d.checks.get('LOGICAL_CANCEL_PRESERVES_HISTORY')!.setValue(true); expect(d.canConfirm()).toBe(true);
    d.operation.setValue(false); expect(d.canConfirm()).toBe(false);
  });
});
