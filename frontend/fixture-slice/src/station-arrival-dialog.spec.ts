import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StationArrivalDialog, type StationArrivalDialogData } from './station-arrival-dialog';
import { stationContextFixture, stationValidationFixture } from './station-arrival-fixtures';
import { nativeStationContextFixture, nativeStationSelectionFixture,
  nativeStationValidationFixture } from './native-station-arrival-fixtures';

describe('shared F2 dialog keeps source-specific consent and copy', () => {
  afterEach(() => TestBed.resetTestingModule());
  for (const kind of ['fixture-warning', 'native-confirmation'] as const) {
    function setup() {
      const data: StationArrivalDialogData = kind === 'fixture-warning' ? {
        kind, name: 'עובד סימולציה', planned: stationContextFixture(true).planned.startLocal,
        reason: 'סיבה סינתטית בלבד', validation: stationValidationFixture(true),
      } : {
        kind, selection: nativeStationSelectionFixture(), context: nativeStationContextFixture(),
        validation: nativeStationValidationFixture(),
      };
      const close = vi.fn();
      TestBed.configureTestingModule({ imports: [StationArrivalDialog], providers: [
        { provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: { close } },
      ] });
      const fixture = TestBed.createComponent(StationArrivalDialog);
      fixture.detectChanges();
      return { fixture, dialog: fixture.componentInstance, close, host: fixture.nativeElement as HTMLElement };
    }
    it(`${kind}: renders only its approved body, Hebrew labels and stable selectors`, () => {
      const { host } = setup();
      const native = kind === 'native-confirmation';
      expect(host.querySelector(native ? '#native-station-operation-ack' : '#station-warning-ack')).not.toBeNull();
      expect(host.textContent).toContain(native ? 'כתיבה בפועל למסד TEST' : 'אזהרת איחור לעמדה — סימולציה בלבד');
      expect(host.textContent).not.toContain(native ? 'סימולציה מבודדת בלבד' : 'כתיבה בפועל למסד TEST');
      expect(host.textContent).toContain(native ? 'ישתנו בדיוק שני שדות' : 'מעבר לסקירת סימולציה');
      expect(host.querySelector('mat-dialog-content')?.getAttribute('dir')).toBe('rtl');
    });
    it(`${kind}: requires explicit checkbox consent before confirming`, () => {
      const { fixture, dialog, close, host } = setup();
      const id = kind === 'native-confirmation' ? '#native-station-operation-confirm' : '#station-warning-review';
      expect(host.querySelector<HTMLButtonElement>(id)?.disabled).toBe(true);
      dialog.confirm(); expect(dialog.confirmed).toBe(false); expect(close).not.toHaveBeenCalled();
      dialog.accepted.setValue(true); fixture.detectChanges();
      expect(host.querySelector<HTMLButtonElement>(id)?.disabled).toBe(false);
      dialog.confirm(); expect(dialog.confirmed).toBe(true); expect(close).toHaveBeenCalledExactlyOnceWith(true);
    });
    it(`${kind}: cancellation does not mark the operation confirmed`, () => {
      const { dialog, close, host } = setup();
      const id = kind === 'native-confirmation' ? '#native-station-operation-cancel' : '#station-warning-cancel';
      host.querySelector<HTMLButtonElement>(id)!.click();
      expect(close).toHaveBeenCalledExactlyOnceWith(false); expect(dialog.confirmed).toBe(false);
    });
  }
});
