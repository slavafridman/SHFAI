import { inject, Injectable } from '@angular/core';
import { HttpClient, type HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import type { CurrentShiftRequestV1 } from './current-shifts-contract';
import type { ShiftSearchRequestV1 } from '../../../backend/fixture-slice/shift-search-contracts.mts';
import type { MyShiftsContextRequestV1, MyShiftsRequestV1 } from '../../../backend/fixture-slice/my-shifts-contracts.mts';
import type { SelectedShiftItemsRequestV1 } from './shift-items-contract';
import type { AttendanceRequestV1 } from '../../../backend/fixture-slice/attendance-contracts.mts';
import type { StageArrivalDraftV1, StageArrivalCommitDraftV1 } from '../../../backend/fixture-slice/stage-arrival-contracts.mts';
import type { NativeStageArrivalCommitV1 } from '../../../backend/fixture-slice/oracle-stage-arrival-contracts.mts';

@Injectable({ providedIn: 'root' })
export class SliceApi {
  private readonly http = inject(HttpClient);
  stageArrivalContext(employeeId: string, shiftDayId: string) {
    return this.http.get<unknown>(this.arrivalBase(employeeId, shiftDayId) + '/context',
      { cache: 'no-store', timeout: 5000, observe: 'response' }).pipe(map(r => this.arrivalBody(r, 65536)));
  }
  stageArrivalValidate(employeeId: string, shiftDayId: string, draft: StageArrivalDraftV1) {
    return this.http.post<unknown>(this.arrivalBase(employeeId, shiftDayId) + '/validations', draft,
      { cache: 'no-store', timeout: 5000, observe: 'response', headers: { 'Content-Type': 'application/json' } })
      .pipe(map(r => this.arrivalBody(r, 16384)));
  }
  stageArrivalCommand(employeeId: string, shiftDayId: string, command: StageArrivalCommitDraftV1 | NativeStageArrivalCommitV1) {
    return this.http.post<unknown>(this.arrivalBase(employeeId, shiftDayId) + '/commands', command,
      { cache: 'no-store', timeout: 5000, observe: 'response', headers: { 'Content-Type': 'application/json' } })
      .pipe(map(r => this.arrivalBody(r, 16384)));
  }
  private arrivalBase(employeeId: string, shiftDayId: string) {
    return `/api/v1/employees/${employeeId}/shift-days/${shiftDayId}/stage-arrival`;
  }
  private arrivalBody(response: HttpResponse<unknown>, maxBytes: number): unknown {
    if (response.status !== 200 || !/^application\/json(?:;\s*charset=utf-8)?$/i.test(response.headers.get('Content-Type') ?? '') ||
      !response.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') ||
      response.headers.get('X-Content-Type-Options')?.toLowerCase() !== 'nosniff' ||
      new TextEncoder().encode(JSON.stringify(response.body)).length > maxBytes)
      throw Error('Invalid stage-arrival response envelope');
    return response.body;
  }
  attendanceContext() {
    return this.http.get<unknown>('/api/v1/attendance/filter-context', { cache: 'no-store' });
  }
  attendance(request: AttendanceRequestV1) {
    const params: Record<string, string> = {
      attendanceDate: request.attendanceDate, timeFrom: request.timeFrom, timeTo: request.timeTo,
      limit: String(request.limit ?? 25), offset: String(request.offset ?? 0), sort: 'effective-start-asc',
    };
    if (request.mokedCode !== undefined) params['mokedCode'] = request.mokedCode;
    for (const key of ['teamCodes', 'innerJobCodes', 'workLocations'] as const)
      if (request[key]?.length) params[key] = request[key]!.join(',');
    return this.http.get<unknown>('/api/v1/attendance', { params, cache: 'no-store' });
  }
  employeeCard(employeeId: string) {
    return this.http.get<unknown>(`/api/v1/employees/${employeeId}/operational-card`, { cache: 'no-store' });
  }
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
