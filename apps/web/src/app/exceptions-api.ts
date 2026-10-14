import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import type { DemoExceptionInterval, DemoExceptionRecord } from '../../../api/src/stub/exception-contracts';
import { parseCalendarDate } from './calendar';
import { EmployeesApi } from './employees-api';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoExceptionInterval, DemoExceptionRecord };
export type ExceptionMode = 'exceptions' | 'time-off';
export interface ExceptionFilters {
  readonly mode: ExceptionMode; readonly employeeId: string;
  readonly from: string; readonly toExclusive: string;
  readonly kind: 'all' | 'full-day' | 'timed'; readonly includeCancelled: boolean;
}

function localRead(value: unknown): value is string {
  return local(value) && parseCalendarDate(value.slice(0, 10)) !== null
    && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60;
}
function interval(value: unknown): value is DemoExceptionInterval {
  if (!record(value)) { return false; }
  return value['kind'] === 'full-day'
    ? typeof value['date'] === 'string' && parseCalendarDate(value['date']) !== null
      && value['startLocal'] === null && value['endLocal'] === null
    : value['kind'] === 'timed' && value['date'] === null && localRead(value['startLocal'])
      && localRead(value['endLocal']) && value['endLocal'] > value['startLocal'];
}
function item(value: unknown): value is DemoExceptionRecord {
  if (!record(value) || typeof value['id'] !== 'string' || !/^[1-9]\d{0,37}$/.test(value['id'])
    || value['unitId'] !== 'synthetic-team-a' || typeof value['employeeId'] !== 'string'
    || !['00000001', '00000002', '00000003'].includes(value['employeeId']) || typeof value['employeeName'] !== 'string'
    || (value['category'] !== 'exception' && value['category'] !== 'time-off')
    || (value['status'] !== 'active' && value['status'] !== 'cancelled')
    || (value['provenance'] !== 'baseline' && value['provenance'] !== 'override') || !interval(value['interval'])
    || (value['reason'] !== null && typeof value['reason'] !== 'string')
    || (value['remark'] !== null && typeof value['remark'] !== 'string')
    || (value['cancellationReason'] !== null && typeof value['cancellationReason'] !== 'string')
    || (value['status'] === 'active' && value['cancellationReason'] !== null)) { return false; }
  return value['originalAvailability'] === 'available' ? value['provenance'] === 'override' && interval(value['originalInterval'])
    : (value['originalAvailability'] === 'not-present' || value['originalAvailability'] === 'not-authorized')
      && value['originalInterval'] === null;
}

@Injectable({ providedIn: 'root' })
export class ExceptionsApi {
  private readonly http = inject(HttpClient);
  private readonly employees = inject(EmployeesApi);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(
      map(value => {
        if (!synthetic(value) || !record(value['exceptions']) || !record(value['exceptions']['read'])
          || value['exceptions']['read']['enabled'] !== true || !record(value['employees'])
          || !record(value['employees']['read']) || value['employees']['read']['enabled'] !== true) {
          throw new StubContractError();
        }
        return true;
      }),
      switchMap(() => this.employees.list('')),
    );
  }

  list(filters: ExceptionFilters) {
    const url = filters.mode === 'exceptions' ? '/api/v1/exceptions'
      : `/api/v1/employees/${encodeURIComponent(filters.employeeId)}/time-off`;
    return this.http.get<unknown>(url, {
      params: {
        from: filters.from, toExclusive: filters.toExclusive, kind: filters.kind,
        includeCancelled: String(filters.includeCancelled), limit: '100',
      },
    }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !Array.isArray(value['items']) || value['items'].length > 100
        || !value['items'].every(item) || value['nextCursor'] !== null
        || (filters.mode === 'time-off' && value['employeeId'] !== filters.employeeId)) { throw new StubContractError(); }
      if (value['items'].some(record => {
        const date = record.interval.kind === 'full-day' ? record.interval.date : record.interval.startLocal.slice(0, 10);
        return date < filters.from || date >= filters.toExclusive || (!filters.includeCancelled && record.status === 'cancelled')
        || (filters.kind !== 'all' && record.interval.kind !== filters.kind)
        || (filters.mode === 'time-off' && (record.employeeId !== filters.employeeId || record.category !== 'time-off'));
      })) {
        throw new StubContractError();
      }
      return { items: value['items'], fetchedAt: String(value['fetchedAt']) };
    }));
  }

  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/exceptions/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !item(value['item']) || value['item'].id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
