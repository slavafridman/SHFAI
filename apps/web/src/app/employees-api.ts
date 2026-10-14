import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { DemoEmployee, DemoEmployeeRecord, EmployeeSection } from '../../../api/src/stub/employee-contracts';
import { metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoEmployee, DemoEmployeeRecord, EmployeeSection };

function employeeRecord(value: unknown): value is DemoEmployeeRecord {
  return record(value) && typeof value['id'] === 'string' && typeof value['label'] === 'string'
    && (value['detail'] === null || typeof value['detail'] === 'string')
    && (value['dateLocal'] === null || (typeof value['dateLocal'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value['dateLocal'])));
}

function employee(value: unknown): value is DemoEmployee {
  return record(value) && typeof value['id'] === 'string' && /^\d{1,128}$/.test(value['id'])
    && typeof value['displayName'] === 'string' && record(value['orgUnit'])
    && value['orgUnit']['id'] === 'synthetic-team-a' && typeof value['orgUnit']['name'] === 'string'
    && (value['jobName'] === null || typeof value['jobName'] === 'string');
}

@Injectable({ providedIn: 'root' })
export class EmployeesApi {
  private readonly http = inject(HttpClient);

  records(id: string, section: EmployeeSection) {
    return this.http.get<unknown>(`/api/v1/employees/${encodeURIComponent(id)}/${section}`, { params: { limit: '100' } })
      .pipe(map(value => {
        if (!synthetic(value) || !metadata(value) || value['employeeId'] !== id || value['section'] !== section
          || !Array.isArray(value['items']) || value['items'].length > 100
          || !value['items'].every(employeeRecord) || value['nextCursor'] !== null) {
          throw new StubContractError();
        }
        return { items: value['items'], fetchedAt: String(value['fetchedAt']) };
      }));
  }

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['employees']) || !record(value['employees']['read'])
        || value['employees']['read']['enabled'] !== true) {
        throw new StubContractError();
      }
      return true;
    }));
  }

  list(search: string) {
    return this.http.get<unknown>('/api/v1/employees', { params: { search, limit: '100' } }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !Array.isArray(value['items']) || value['items'].length > 100
        || !value['items'].every(employee) || value['nextCursor'] !== null) {
        throw new StubContractError();
      }
      return { items: value['items'], fetchedAt: String(value['fetchedAt']) };
    }));
  }

  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/employees/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !employee(value['item']) || value['item'].id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
