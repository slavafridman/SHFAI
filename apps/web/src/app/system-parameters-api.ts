import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { DEMO_PARAMETER_CODES, DEMO_PARAMETER_SOURCE, isDemoParameterCode, isDemoParameterValue, resolveDemoParameter } from '../../../api/src/stub/system-parameter-contracts';
import type { DemoSystemParameter } from '../../../api/src/stub/system-parameter-contracts';
import { metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoSystemParameter };
const unitId = 'synthetic-team-a';
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 256;
}
function parameter(value: unknown): value is DemoSystemParameter {
  if (!record(value) || Object.keys(value).some(key =>
    !['code', 'name', 'orgUnit', 'unitValue', 'defaultValue', 'effectiveValue', 'resolution', 'measurement'].includes(key))
    || !isDemoParameterCode(value['code']) || !text(value['name']) || value['measurement'] !== 'unverified'
    || !record(value['orgUnit']) || value['orgUnit']['id'] !== unitId || !text(value['orgUnit']['name'])
    || Object.keys(value['orgUnit']).some(key => key !== 'id' && key !== 'name')) { return false; }
  const unitValue = value['unitValue'];
  const defaultValue = value['defaultValue'];
  if (!isDemoParameterValue(unitValue) || !isDemoParameterValue(defaultValue)) { return false; }
  const resolved = resolveDemoParameter(unitValue, defaultValue);
  return value['effectiveValue'] === resolved.effectiveValue && value['resolution'] === resolved.resolution;
}

@Injectable({ providedIn: 'root' })
export class SystemParametersApi {
  private readonly http = inject(HttpClient);
  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['systemParameters']) || !record(value['systemParameters']['read'])
        || value['systemParameters']['read']['enabled'] !== true) { throw new StubContractError(); }
      return true;
    }));
  }
  list(search: string) {
    const normalized = search.trim().toLocaleLowerCase('he');
    return this.http.get<unknown>('/api/v1/system-parameters', { params: { search, limit: '100' } }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['sourceVersion'] !== DEMO_PARAMETER_SOURCE
        || value['unitId'] !== unitId || value['search'] !== normalized || value['nextCursor'] !== null
        || !Array.isArray(value['items']) || value['items'].length > DEMO_PARAMETER_CODES.length || !value['items'].every(parameter)
        || new Set(value['items'].map(item => item.code)).size !== value['items'].length
        || !value['items'].every(item => item.code.toLocaleLowerCase('he').includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized))) {
        throw new StubContractError();
      }
      return { items: value['items'], search: normalized, sourceVersion: DEMO_PARAMETER_SOURCE, fetchedAt: String(value['fetchedAt']) };
    }));
  }
  detail(code: string) {
    return this.http.get<unknown>(`/api/v1/system-parameters/${encodeURIComponent(code)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['sourceVersion'] !== DEMO_PARAMETER_SOURCE
        || !parameter(value['item']) || value['item'].code !== code) { throw new StubContractError(); }
      return { item: value['item'], fetchedAt: String(value['fetchedAt']) };
    }));
  }
}
