import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
}
