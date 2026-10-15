import { Injectable } from '@angular/core';
import type { CurrentShiftRequestV1 } from './current-shifts-contract';

export interface ListReturn {
  request: CurrentShiftRequestV1;
  evaluatedCurrent: boolean;
  scroll: number;
  tableScroll: number;
  opener: string;
  employeeId: string;
  shiftDayId: string;
  unit: { code: string; label: string; parentLabel: string };
}
/** Volatile UI context only; no storage, results, identity or authorization cache. */
@Injectable({ providedIn: 'root' })
export class ListNavigation {
  origin: ListReturn | null = null;
  returning = false;
}
