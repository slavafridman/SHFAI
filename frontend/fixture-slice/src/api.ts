import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { CurrentShiftRequestV1 } from './current-shifts-contract';

@Injectable({ providedIn: 'root' })
export class SliceApi {
  private readonly http = inject(HttpClient);
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
