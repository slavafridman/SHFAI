import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { DEMO_INTERNAL_JOB_SOURCE, matchesInternalJobStatus } from '../../../api/src/stub/internal-job-contracts';
import type { DemoInternalJob, DemoInternalJobStatus } from '../../../api/src/stub/internal-job-contracts';
import { metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoInternalJob, DemoInternalJobStatus };
export { isInternalJobStatus } from '../../../api/src/stub/internal-job-contracts';
const unitId = 'synthetic-team-a';
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 256;
}
function job(value: unknown): value is DemoInternalJob {
  return record(value) && Object.keys(value).every(key => ['id', 'name', 'orgUnit', 'active', 'groupCode'].includes(key))
    && typeof value['id'] === 'string' && /^[1-9]\d{0,37}$/.test(value['id']) && text(value['name'])
    && record(value['orgUnit']) && value['orgUnit']['id'] === unitId && text(value['orgUnit']['name'])
    && Object.keys(value['orgUnit']).every(key => key === 'id' || key === 'name')
    && (value['active'] === null || typeof value['active'] === 'boolean')
    && (value['groupCode'] === null || (typeof value['groupCode'] === 'string' && /^(?:0|[1-9]\d{0,37})$/.test(value['groupCode'])));
}

@Injectable({ providedIn: 'root' })
export class InternalJobsApi {
  private readonly http = inject(HttpClient);
  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['internalJobs']) || !record(value['internalJobs']['read'])
        || value['internalJobs']['read']['enabled'] !== true) { throw new StubContractError(); }
      return true;
    }));
  }
  list(search: string, status: DemoInternalJobStatus) {
    const normalized = search.trim().toLocaleLowerCase('he');
    return this.http.get<unknown>('/api/v1/internal-jobs', { params: { search, status, limit: '100' } }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['sourceVersion'] !== DEMO_INTERNAL_JOB_SOURCE
        || value['unitId'] !== unitId || value['search'] !== normalized || value['status'] !== status
        || value['nextCursor'] !== null || !Array.isArray(value['items']) || value['items'].length > 100
        || !value['items'].every(job) || new Set(value['items'].map(item => item.id)).size !== value['items'].length
        || !value['items'].every(item => matchesInternalJobStatus(item.active, status)
          && (item.id.includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized)))) {
        throw new StubContractError();
      }
      return { items: value['items'], search: normalized, status, sourceVersion: DEMO_INTERNAL_JOB_SOURCE, fetchedAt: String(value['fetchedAt']) };
    }));
  }
  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/internal-jobs/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['sourceVersion'] !== DEMO_INTERNAL_JOB_SOURCE
        || !job(value['item']) || value['item'].id !== id) { throw new StubContractError(); }
      return { item: value['item'], fetchedAt: String(value['fetchedAt']) };
    }));
  }
}
