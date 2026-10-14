import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import type {
  DemoReplacementCandidate, DemoReplacementIssue, DemoReplacementList, DemoReplacementPreview, DemoReplacementShift,
} from '../../../api/src/stub/replacement-contracts';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoReplacementList, DemoReplacementPreview };

function shift(value: unknown): value is DemoReplacementShift {
  return record(value) && typeof value['id'] === 'string' && /^\d+$/.test(value['id'])
    && typeof value['employeeId'] === 'string' && typeof value['employeeName'] === 'string'
    && local(value['startLocal']) && local(value['endLocal'])
    && (value['siteId'] === null || typeof value['siteId'] === 'string');
}
function candidate(value: unknown): value is DemoReplacementCandidate {
  return record(value) && typeof value['id'] === 'string' && /^candidate-\d{1,3}$/.test(value['id'])
    && shift(value['shift']) && ['00000002', '00000003'].includes(value['shift'].employeeId);
}
function issues(value: unknown): value is readonly DemoReplacementIssue[] {
  return Array.isArray(value) && value.length <= 20 && value.every((item: unknown) =>
    record(item) && typeof item['code'] === 'string' && typeof item['message'] === 'string');
}
function preview(value: unknown): value is DemoReplacementPreview {
  if (!record(value) || value['previewOnly'] !== true || value['saved'] !== false || value['accepted'] !== false
    || value['policyVersion'] !== 'synthetic-replacement-policy-1'
    || typeof value['sourceShiftId'] !== 'string' || typeof value['candidateId'] !== 'string'
    || !issues(value['blockers']) || !issues(value['warnings']) || !issues(value['unknowns'])) { return false; }
  const expected = value['blockers'].length ? 'blocked' : value['unknowns'].length ? 'unknown'
    : value['warnings'].length ? 'confirmation-required' : 'eligible-under-demo-policy';
  return value['eligibility'] === expected;
}

@Injectable({ providedIn: 'root' })
export class ReplacementApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(
      map(value => {
        if (!synthetic(value) || !record(value['replacement']) || !record(value['replacement']['read'])
          || !record(value['replacement']['preview']) || value['replacement']['read']['enabled'] !== true
          || value['replacement']['preview']['enabled'] !== true) { throw new StubContractError(); }
        return true;
      }),
      switchMap(() => this.http.get<unknown>('/api/v1/replacement-candidates', { params: { limit: '100' } })),
      map(value => {
        if (!synthetic(value) || !metadata(value) || !shift(value['source']) || value['source'].employeeId !== '00000001'
          || !Array.isArray(value['items']) || value['items'].length > 100 || !value['items'].every(candidate)
          || new Set(value['items'].map(item => item.id)).size !== value['items'].length
          || value['policyVersion'] !== 'synthetic-replacement-policy-1'
          || value['clockLocal'] !== '2026-10-13T08:00:00' || value['nextCursor'] !== null) {
          throw new StubContractError();
        }
        const result: DemoReplacementList = {
          source: value['source'], items: value['items'], policyVersion: 'synthetic-replacement-policy-1',
          clockLocal: '2026-10-13T08:00:00', nextCursor: null,
        };
        return result;
      }),
    );
  }

  preview(candidateId: string, sourceShiftId: string) {
    return this.http.post<unknown>('/api/v1/replacement-eligibility-previews', { candidateId }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !preview(value['item'])
        || value['item'].candidateId !== candidateId || value['item'].sourceShiftId !== sourceShiftId) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
