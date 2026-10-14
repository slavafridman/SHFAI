import { Injectable } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter, type MatDateFormats } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

const isoInputFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };

export function calendarDateString(value: Date | null): string | null {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    return null;
  }
  const year = value.getFullYear();
  if (year < 1 || year > 9999) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const result = new Date(0);
  result.setFullYear(year, month - 1, day);
  result.setHours(0, 0, 0, 0);
  return calendarDateString(result) === value ? result : null;
}

@Injectable()
export class IsoCalendarAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    return value === null || value === undefined || value === '' ? null
      : parseCalendarDate(value) ?? this.invalid();
  }

  override format(value: Date, displayFormat: object): string {
    if (displayFormat !== isoInputFormat) {
      return super.format(value, displayFormat);
    }
    const formatted = calendarDateString(value);
    if (formatted === null) {
      throw new Error('Cannot format an invalid calendar date.');
    }
    return formatted;
  }
}

function hebrewCalendarLabels(): MatDatepickerIntl {
  const labels = new MatDatepickerIntl();
  labels.calendarLabel = 'לוח שנה לבחירת תאריך';
  labels.openCalendarLabel = 'פתיחת לוח שנה';
  labels.closeCalendarLabel = 'סגירת לוח שנה';
  labels.prevMonthLabel = 'החודש הקודם';
  labels.nextMonthLabel = 'החודש הבא';
  labels.prevYearLabel = 'השנה הקודמת';
  labels.nextYearLabel = 'השנה הבאה';
  labels.prevMultiYearLabel = 'טווח השנים הקודם';
  labels.nextMultiYearLabel = 'טווח השנים הבא';
  labels.switchToMonthViewLabel = 'בחירת חודש';
  labels.switchToMultiYearViewLabel = 'בחירת שנה';
  labels.startDateLabel = 'תאריך התחלה';
  labels.endDateLabel = 'תאריך סיום';
  labels.comparisonDateLabel = 'תאריך להשוואה';
  return labels;
}

const formats: MatDateFormats = {
  parse: { dateInput: isoInputFormat },
  display: {
    dateInput: isoInputFormat,
    monthYearLabel: { year: 'numeric', month: 'long' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export const CALENDAR_PROVIDERS = [
  { provide: DateAdapter, useClass: IsoCalendarAdapter },
  { provide: MAT_DATE_LOCALE, useValue: 'he' },
  { provide: MAT_DATE_FORMATS, useValue: formats },
  { provide: MatDatepickerIntl, useFactory: hebrewCalendarLabels },
];
