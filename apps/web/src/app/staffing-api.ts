import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { DemoStaffingCandidate, DemoStaffingCapacity, DemoStaffingKind, DemoStaffingPreview, DemoStaffingRequest } from '../../../api/src/stub/staffing-contracts';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoStaffingCandidate, DemoStaffingKind, DemoStaffingPreview, DemoStaffingRequest };

function count(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}
function freshness(value: unknown): value is DemoStaffingRequest['freshness'] {
  return value === 'current' || value === 'stale' || value === 'unknown';
}
function capacity(value: unknown): value is DemoStaffingCapacity {
  if (!record(value) || !count(value['requested']) || !count(value['approved']) || !count(value['remaining'])) { return false; }
  const requested = value['requested'];
  const approved = value['approved'];
  return requested !== null && approved !== null
    ? approved <= requested && value['remaining'] === requested - approved
    : value['remaining'] === null;
}
function issues(value: unknown): value is readonly { code: string; message: string }[] {
  return Array.isArray(value) && value.length <= 20 && value.every((item: unknown) =>
    record(item) && typeof item['code'] === 'string' && typeof item['message'] === 'string');
}
function preview(value: unknown): value is DemoStaffingPreview {
  if (!record(value) || value['previewOnly'] !== true || value['saved'] !== false
    || value['assigned'] !== false || value['approved'] !== false
    || value['policyVersion'] !== 'synthetic-staffing-policy-1'
    || typeof value['requestId'] !== 'string' || typeof value['candidateId'] !== 'string'
    || !issues(value['blockers']) || !issues(value['unknowns']) || !capacity(value['capacityBefore'])
    || !Array.isArray(value['warnings']) || !value['warnings'].every((item: unknown) => typeof item === 'string')) { return false; }
  const expected = value['blockers'].length ? 'blocked' : value['unknowns'].length ? 'unknown' : 'eligible-under-demo-policy';
  if (value['outcome'] !== expected) { return false; }
  if (expected !== 'eligible-under-demo-policy') { return value['capacityIfApplied'] === null; }
  const before = value['capacityBefore'];
  const projected = value['capacityIfApplied'];
  return before.requested !== null && before.approved !== null && before.remaining !== null && before.remaining >= 1
    && capacity(projected) && projected.requested === before.requested
    && projected.approved === before.approved + 1 && projected.remaining === before.remaining - 1;
}
function request(value: unknown): value is DemoStaffingRequest {
  if (!record(value) || typeof value['id'] !== 'string' || !/^[1-9]\d{0,37}$/.test(value['id'])
    || (value['kind'] !== 'reinforcement' && value['kind'] !== 'time-change' && value['kind'] !== 'reduction')
    || value['unitId'] !== 'synthetic-team-a' || typeof value['title'] !== 'string'
    || !local(value['startLocal']) || !local(value['endLocal']) || value['endLocal'] <= value['startLocal']
    || !count(value['requested']) || !count(value['approved']) || !count(value['remaining'])
    || !freshness(value['freshness']) || (value['note'] !== null && typeof value['note'] !== 'string')) { return false; }
  const requested = value['requested'];
  const approved = value['approved'];
  const capacity = requested !== null && approved !== null ? approved <= requested && value['remaining'] === requested - approved
    : value['remaining'] === null;
  const deadline = value['deadlineState'] === 'unknown' ? value['deadlineLocal'] === null
    : (value['deadlineState'] === 'open' || value['deadlineState'] === 'elapsed') && local(value['deadlineLocal']);
  return capacity && deadline;
}
function candidate(value: unknown): value is DemoStaffingCandidate {
  return record(value) && typeof value['id'] === 'string' && /^staff-candidate-\d+$/.test(value['id'])
    && typeof value['employeeId'] === 'string' && ['00000001', '00000002', '00000003'].includes(value['employeeId'])
    && typeof value['employeeName'] === 'string' && freshness(value['freshness'])
    && (value['freshness'] === 'unknown' ? value['asOfLocal'] === null : local(value['asOfLocal']))
    && (value['note'] === null || typeof value['note'] === 'string');
}
function envelope(value: unknown): value is Record<string, unknown> {
  return synthetic(value) && metadata(value) && value['clockLocal'] === '2026-10-13T08:00:00';
}

@Injectable({ providedIn: 'root' })
export class StaffingApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['staffing']) || !record(value['staffing']['read'])
        || value['staffing']['read']['enabled'] !== true) { throw new StubContractError(); }
      return { previewAvailable: record(value['staffing']['preview']) && value['staffing']['preview']['enabled'] === true };
    }));
  }

  preview(request: DemoStaffingRequest, candidateId: string) {
    return this.http.post<unknown>(`/api/v1/staffing-requests/${encodeURIComponent(request.id)}/eligibility-previews`, { candidateId })
      .pipe(map(value => {
        if (!envelope(value) || !preview(value['item']) || value['item'].requestId !== request.id
          || value['item'].candidateId !== candidateId || value['item'].capacityBefore.requested !== request.requested
          || value['item'].capacityBefore.approved !== request.approved || value['item'].capacityBefore.remaining !== request.remaining) {
          throw new StubContractError();
        }
        return value['item'];
      }));
  }

  list(kind: 'all' | DemoStaffingKind) {
    return this.http.get<unknown>('/api/v1/staffing-requests', { params: { kind, limit: '100' } }).pipe(map(value => {
      if (!envelope(value) || !Array.isArray(value['items']) || value['items'].length > 100
        || !value['items'].every(request) || value['nextCursor'] !== null) { throw new StubContractError(); }
      if (kind !== 'all' && value['items'].some(item => item.kind !== kind)) { throw new StubContractError(); }
      return { items: value['items'], fetchedAt: String(value['fetchedAt']) };
    }));
  }

  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/staffing-requests/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!envelope(value) || !request(value['item']) || value['item'].id !== id) { throw new StubContractError(); }
      return value['item'];
    }));
  }

  candidates(id: string) {
    return this.http.get<unknown>(`/api/v1/staffing-requests/${encodeURIComponent(id)}/candidates`, { params: { limit: '100' } })
      .pipe(map(value => {
        if (!envelope(value) || value['requestId'] !== id || !Array.isArray(value['items']) || value['items'].length > 100
          || !value['items'].every(candidate) || value['nextCursor'] !== null) { throw new StubContractError(); }
        return value['items'];
      }));
  }
}
