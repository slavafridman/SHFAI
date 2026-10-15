import { Injectable } from '@angular/core';
import { NativeDateAdapter, type MatDateFormats } from '@angular/material/core';
import { civilDate } from './current-shifts-contract';

const pad = (n: number, length = 2) => String(n).padStart(length, '0');
export const dateWire = (d: Date): string => `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dateFromWire = (s: string): Date => {
  const d = new Date(2000, 0, 1);
  d.setFullYear(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return d;
};

/** Date objects exist only inside Material controls. No source timestamp/UTC conversion. */
@Injectable()
export class CivilDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) return null;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    const wire = m ? `${m[3]}-${m[2]}-${m[1]}` : '';
    return civilDate(wire) ? dateFromWire(wire) : this.invalid();
  }
  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'civil-date') return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${pad(date.getFullYear(), 4)}`;
    return super.format(date, displayFormat as object);
  }
  override getFirstDayOfWeek(): number { return 0; }
}
export const CIVIL_FORMATS: MatDateFormats = {
  parse: { dateInput: 'civil-date' },
  display: {
    dateInput: 'civil-date', monthYearLabel: { year: 'numeric', month: 'long' },
    dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
