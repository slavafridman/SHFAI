import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { CurrentShiftRequestV1 } from './current-shifts-contract';
import type { ShiftSearchRequestV1 } from '../../../backend/fixture-slice/shift-search-contracts.mts';
import type { MyShiftsContextRequestV1, MyShiftsRequestV1 } from '../../../backend/fixture-slice/my-shifts-contracts.mts';
import type { SelectedShiftItemsRequestV1 } from './shift-items-contract';

@Injectable({ providedIn: 'root' })
export class SliceApi {
  private readonly http = inject(HttpClient);
  shiftItems(request: SelectedShiftItemsRequestV1) {
    return this.http.get<unknown>(
      `/api/v1/employees/${request.employeeId}/shift-days/${request.shiftDayId}/breaks-and-exceptions`,
      { params: { limit: String(request.limit ?? 25), offset: String(request.offset ?? 0),
        sort: 'start-asc' }, cache: 'no-store' });
  }
  // Runtime validation is mandatory; HTTP generic types do not validate JSON.
  identity() {
    return this.http.get<unknown>('/api/v1/identity', { cache: 'no-store' });
  }
  detail(employeeId: string, shiftDayId: string) {
    return this.http.get<unknown>(
      `/api/v1/employees/${employeeId}/shift-days/${shiftDayId}`, { cache: 'no-store' });
  }
  filterContext() {
    return this.http.get<unknown>('/api/v1/current-shifts/filter-context', { cache: 'no-store' });
  }
  searchContext() {
    return this.http.get<unknown>('/api/v1/shift-search/filter-context', { cache: 'no-store' });
  }
  myShiftsContext(request: MyShiftsContextRequestV1) {
    const params: Record<string, string> = { mode: request.mode };
    if (request.mode === 'selected') params['employeeId'] = request.employeeId;
    return this.http.get<unknown>('/api/v1/my-shifts/context', { params, cache: 'no-store' });
  }
  myShifts(request: MyShiftsRequestV1) {
    const params: Record<string, string> = { mode: request.mode, dateFrom: request.dateFrom,
      dateTo: request.dateTo, limit: String(request.limit ?? 25), offset: String(request.offset ?? 0),
      sort: 'effective-start-asc' };
    if (request.mode === 'selected') params['employeeId'] = request.employeeId;
    return this.http.get<unknown>('/api/v1/my-shifts', { params, cache: 'no-store' });
  }
  shiftSearch(request: ShiftSearchRequestV1) {
    const params: Record<string, string> = {
      attendanceDate: request.attendanceDate, timeFrom: request.timeFrom, timeTo: request.timeTo,
      limit: String(request.limit ?? 25), offset: String(request.offset ?? 0), sort: 'effective-start-asc',
    };
    if (request.mokedCode !== undefined) params['mokedCode'] = request.mokedCode;
    for (const key of ['teamCodes', 'innerJobCodes', 'workLocations'] as const)
      if (request[key]?.length) params[key] = request[key]!.join(',');
    return this.http.get<unknown>('/api/v1/shift-search', { params, cache: 'no-store' });
  }
  currentShifts(request: CurrentShiftRequestV1) {
    const params: Record<string, string> = { mode: request.mode };
    if (request.mode === 'at') {
      params['attendanceDate'] = request.attendanceDate;
      params['currentTime'] = request.currentTime;
    }
    if (request.mokedCode !== undefined) params['mokedCode'] = request.mokedCode;
    params['limit'] = String(request.limit ?? 25);
    params['offset'] = String(request.offset ?? 0);
    params['sort'] = 'effective-start-asc';
    return this.http.get<unknown>('/api/v1/current-shifts', { params, cache: 'no-store' });
  }
}
