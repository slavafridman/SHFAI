import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { DemoAttendance, DemoAttendanceRow } from '../../../api/src/stub/operational-contracts';
import { isPersonalShiftItem } from './shifts-api';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type OperationalMode = 'schedule' | 'attendance';
export type OperationalRow = Omit<DemoAttendanceRow, 'attendance'> & { readonly attendance: DemoAttendance | null };

function actual(value: unknown): value is DemoAttendance {
  return record(value)
    && (value['stageArrivalLocal'] === null || local(value['stageArrivalLocal']))
    && (value['stationArrivalLocal'] === null || local(value['stationArrivalLocal']))
    && (value['stationExitLocal'] === null || local(value['stationExitLocal']))
    && (value['missingReason'] === null || typeof value['missingReason'] === 'string')
    && (value['lateMinutes'] === null || (typeof value['lateMinutes'] === 'number'
      && Number.isSafeInteger(value['lateMinutes']) && value['lateMinutes'] >= 0));
}

@Injectable({ providedIn: 'root' })
export class OperationalApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['operationalReads']) || !record(value['operationalReads']['read'])
        || value['operationalReads']['read']['enabled'] !== true) {
        throw new StubContractError();
      }
      return true;
    }));
  }

  list(mode: OperationalMode, from: string, toExclusive: string) {
    return this.http.get<unknown>(mode === 'schedule' ? '/api/v1/shifts' : '/api/v1/attendance', {
      params: { from, toExclusive, limit: '100' },
    }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['unitId'] !== 'synthetic-team-a'
        || !Array.isArray(value['items']) || value['items'].length > 100 || value['nextCursor'] !== null) {
        throw new StubContractError();
      }
      const items: OperationalRow[] = value['items'].map((row: unknown) => {
        if (!record(row) || typeof row['employeeName'] !== 'string' || !isPersonalShiftItem(row['shift'])
          || row['shift'].baseline !== null || row['shift'].baselineAvailability === 'available'
          || !['00000001', '00000002', '00000003'].includes(row['shift'].effective.employeeId)
          || (mode === 'attendance' && !actual(row['attendance']))) {
          throw new StubContractError();
        }
        return { employeeName: row['employeeName'], shift: row['shift'], attendance: actual(row['attendance']) ? row['attendance'] : null };
      });
      return { items, fetchedAt: String(value['fetchedAt']) };
    }));
  }
}
