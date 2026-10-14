import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { CALENDAR_PROVIDERS, calendarDateString, parseCalendarDate } from './calendar';

describe('Hebrew calendar date-only adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: CALENDAR_PROVIDERS }));

  it('preserves calendar dates through local date components, including leap and DST-adjacent days', () => {
    for (const input of ['2024-02-29', '2000-02-29', '2026-10-25', '0001-01-01', '9999-12-31']) {
      expect(calendarDateString(parseCalendarDate(input))).toBe(input);
    }
  });

  it('rejects impossible/ambiguous dates and empty or malformed inputs', () => {
    const adapter = TestBed.inject<DateAdapter<Date>>(DateAdapter);
    for (const input of ['2026-02-30', '1900-02-29', '0000-01-01', '10/11/2026', '2026-10-14Z']) {
      expect(parseCalendarDate(input)).toBeNull();
      const date = adapter.parse(input, null);
      expect(date === null || !adapter.isValid(date)).toBe(true);
    }
    expect(adapter.parse('', null)).toBeNull();
    expect(calendarDateString(new Date(NaN))).toBeNull();
  });

  it('formats ISO inputs and exposes Hebrew assistive calendar labels', () => {
    const adapter = TestBed.inject<DateAdapter<Date>>(DateAdapter);
    const date = parseCalendarDate('2026-10-14');
    if (!date) { throw new Error('Expected valid synthetic calendar date.'); }
    expect(adapter.format(date, TestBed.inject(MAT_DATE_FORMATS).display.dateInput)).toBe('2026-10-14');
    const labels = TestBed.inject(MatDatepickerIntl);
    expect(labels.openCalendarLabel).toBe('פתיחת לוח שנה');
    expect(labels.nextMonthLabel).toBe('החודש הבא');
    expect(labels.closeCalendarLabel).toBe('סגירת לוח שנה');
  });
});
