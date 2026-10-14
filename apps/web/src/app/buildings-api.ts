import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { DemoBuilding } from '../../../api/src/stub/building-contracts';
import { metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoBuilding };
const unitId = 'synthetic-team-a';
function text(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}
function building(value: unknown): value is DemoBuilding {
  return record(value) && Object.keys(value).every(key => ['id', 'name', 'orgUnit', 'address', 'seatCapacity'].includes(key))
    && typeof value['id'] === 'string' && /^[1-9]\d{0,37}$/.test(value['id']) && text(value['name'], 256)
    && record(value['orgUnit']) && value['orgUnit']['id'] === unitId && text(value['orgUnit']['name'], 256)
    && Object.keys(value['orgUnit']).every(key => key === 'id' || key === 'name')
    && (value['address'] === null || text(value['address'], 512))
    && (value['seatCapacity'] === null || (typeof value['seatCapacity'] === 'number'
      && Number.isSafeInteger(value['seatCapacity']) && value['seatCapacity'] >= 0));
}

@Injectable({ providedIn: 'root' })
export class BuildingsApi {
  private readonly http = inject(HttpClient);
  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['buildings']) || !record(value['buildings']['read'])
        || value['buildings']['read']['enabled'] !== true) { throw new StubContractError(); }
      return true;
    }));
  }
  list(search: string) {
    const normalized = search.trim().toLocaleLowerCase('he');
    return this.http.get<unknown>('/api/v1/buildings', { params: { search, limit: '100' } }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['unitId'] !== unitId || value['search'] !== normalized
        || value['nextCursor'] !== null || !Array.isArray(value['items']) || value['items'].length > 100
        || !value['items'].every(building) || new Set(value['items'].map(item => item.id)).size !== value['items'].length
        || !value['items'].every(item => item.id.includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized))) {
        throw new StubContractError();
      }
      return { items: value['items'], search: normalized, fetchedAt: String(value['fetchedAt']) };
    }));
  }
  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/buildings/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !building(value['item']) || value['item'].id !== id) {
        throw new StubContractError();
      }
      return { item: value['item'], fetchedAt: String(value['fetchedAt']) };
    }));
  }
}
