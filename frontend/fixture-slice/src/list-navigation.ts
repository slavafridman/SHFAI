import { Injectable } from '@angular/core';
import type { CurrentShiftRequestV1 } from './current-shifts-contract';
import type { ShiftSearchRequestV1 } from './shift-search-contract';
import type { MyShiftsRequestV1 } from './my-shifts-contract';
import type { AttendanceRequestV1 } from './attendance-contract';

export interface ListReturn {
  dataSource?: 'isolated-fixture' | 'oracle';
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
  searchOrigin: (Omit<ListReturn, 'request' | 'evaluatedCurrent'> & { request: ShiftSearchRequestV1 }) | null = null;
  attendanceOrigin: (Omit<ListReturn, 'request' | 'evaluatedCurrent'> & { request: AttendanceRequestV1 }) | null = null;
  detailOrigin: 'current-shifts' | 'shift-search' | 'my-shifts' | 'attendance' | null = null;
  scheduleUpstream: 'current-shifts' | 'shift-search' | 'attendance' | null = null;
  schedule: { path: string; request: MyShiftsRequestV1 | null; fromText: string; toText: string;
    scroll: number; tableScroll: number; opener: string; technical: boolean } | null = null;
  scheduleDetail: (Pick<ListReturn, 'employeeId' | 'shiftDayId' | 'unit'> & {
    dataSource: 'isolated-fixture' | 'oracle';
  }) | null = null;
  returning = false;
}
