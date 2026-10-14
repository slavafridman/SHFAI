import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import type { PersonalShiftItem, PersonalShiftList, ShiftSchedule } from '../../../api/src/personal-shifts/contracts';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { PersonalShiftItem, ShiftSchedule };
export { StubContractError };

function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

export function isShiftSchedule(value: unknown): value is ShiftSchedule {
  if (!record(value) || !record(value['split'])) {
    return false;
  }
  const split = value['split'];
  return typeof value['employeeId'] === 'string' && local(value['startLocal']) && local(value['endLocal'])
    && nullableString(value['siteId']) && nullableString(value['activityId'])
    && (value['workFromHome'] === null || typeof value['workFromHome'] === 'boolean')
    && (split['enabled'] === null || typeof split['enabled'] === 'boolean')
    && (split['gapStartLocal'] === null || local(split['gapStartLocal']))
    && (split['gapEndLocal'] === null || local(split['gapEndLocal']));
}

export function isPersonalShiftItem(value: unknown): value is PersonalShiftItem {
  if (!record(value)) {
    return false;
  }
  const availability = value['baselineAvailability'];
  const validBaseline = availability === 'available' ? isShiftSchedule(value['baseline'])
    : (availability === 'not-authorized' || availability === 'not-present') && value['baseline'] === null;
  return typeof value['id'] === 'string' && /^[1-9]\d{0,37}$/.test(value['id'])
    && (value['projection'] === 'baseline' || value['projection'] === 'override')
    && isShiftSchedule(value['effective']) && validBaseline;
}

@Injectable({ providedIn: 'root' })
export class ShiftsApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return forkJoin({
      identity: this.http.get<unknown>('/api/v1/me'),
      capabilities: this.http.get<unknown>('/api/v1/me/capabilities'),
    }).pipe(map(({ identity, capabilities }) => {
      if (!synthetic(identity) || typeof identity['displayName'] !== 'string'
        || !synthetic(capabilities) || !record(capabilities['personalShifts'])
        || !record(capabilities['personalShifts']['read'])
        || capabilities['personalShifts']['read']['enabled'] !== true) {
        throw new StubContractError();
      }
      return { displayName: identity['displayName'] };
    }));
  }

  list(from: string, toExclusive: string) {
    return this.http.get<unknown>('/api/v1/me/shifts', { params: { from, toExclusive, limit: '100' } })
      .pipe(map(value => {
        if (!synthetic(value) || !metadata(value) || !Array.isArray(value['items'])
          || !value['items'].every(isPersonalShiftItem) || value['nextCursor'] !== null) {
          throw new StubContractError();
        }
        const response: PersonalShiftList = {
          items: value['items'], nextCursor: null,
          fetchedAt: String(value['fetchedAt']), businessTimeZone: 'Asia/Jerusalem',
        };
        return response;
      }));
  }

  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/shifts/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !isPersonalShiftItem(value['item']) || value['item'].id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
