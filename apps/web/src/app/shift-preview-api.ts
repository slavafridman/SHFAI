import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import type { DemoShiftPreview, DemoShiftPreviewContext, DemoShiftProposal } from '../../../api/src/stub/shift-preview-contracts';
import { isPersonalShiftItem, isShiftSchedule, ShiftsApi } from './shifts-api';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoShiftPreview, DemoShiftPreviewContext, DemoShiftProposal };

function context(value: unknown): value is DemoShiftPreviewContext {
  return record(value) && isPersonalShiftItem(value['shift']) && value['shift'].effective.employeeId === '00000001'
    && value['shift'].baseline === null && value['policyVersion'] === 'synthetic-shift-policy-1'
    && typeof value['previewAvailable'] === 'boolean'
    && (value['unavailableReason'] === null || typeof value['unavailableReason'] === 'string')
    && Array.isArray(value['breaks']) && value['breaks'].length <= 3
    && value['breaks'].every((item: unknown) => record(item) && typeof item['id'] === 'string'
      && local(item['startLocal']) && local(item['endLocal']));
}

function result(value: unknown): value is DemoShiftPreview {
  if (!record(value) || value['previewOnly'] !== true || value['saved'] !== false
    || value['policyVersion'] !== 'synthetic-shift-policy-1' || !isPersonalShiftItem(value['before'])
    || value['before'].baseline !== null || value['before'].effective.employeeId !== '00000001' || !isShiftSchedule(value['proposed'])
    || value['proposed'].employeeId !== '00000001' || typeof value['reason'] !== 'string'
    || !record(value['minutes']) || !Array.isArray(value['warnings'])
    || !value['warnings'].every((warning: unknown) => typeof warning === 'string')) { return false; }
  const minutes = value['minutes'];
  const proposed = value['proposed'];
  const span = (Date.parse(proposed.endLocal + 'Z') - Date.parse(proposed.startLocal + 'Z')) / 60_000;
  const enabled = proposed.split.enabled;
  if (enabled === null) { return false; }
  const gap = enabled && proposed.split.gapStartLocal !== null && proposed.split.gapEndLocal !== null
    ? (Date.parse(proposed.split.gapEndLocal + 'Z') - Date.parse(proposed.split.gapStartLocal + 'Z')) / 60_000 : 0;
  const first = enabled && proposed.split.gapStartLocal !== null
    ? (Date.parse(proposed.split.gapStartLocal + 'Z') - Date.parse(proposed.startLocal + 'Z')) / 60_000 : null;
  const second = enabled && proposed.split.gapEndLocal !== null
    ? (Date.parse(proposed.endLocal + 'Z') - Date.parse(proposed.split.gapEndLocal + 'Z')) / 60_000 : null;
  return Number.isSafeInteger(span) && span >= 240 && span <= 960 && Number.isSafeInteger(gap) && gap >= 0
    && span - gap >= 240 && (!enabled || (gap >= 120 && first !== null && first >= 120 && second !== null && second >= 120))
    && minutes['span'] === span && minutes['working'] === span - gap && minutes['gap'] === gap
    && minutes['firstPart'] === first && minutes['secondPart'] === second;
}

@Injectable({ providedIn: 'root' })
export class ShiftPreviewApi {
  private readonly http = inject(HttpClient);
  private readonly shifts = inject(ShiftsApi);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(
      map(value => {
        if (!synthetic(value) || !record(value['personalShifts']) || !record(value['personalShifts']['preview'])
          || value['personalShifts']['preview']['enabled'] !== true) { throw new StubContractError(); }
        return true;
      }),
      switchMap(() => this.shifts.list('2026-10-14', '2026-10-18')),
    );
  }

  context(id: string) {
    return this.http.get<unknown>(`/api/v1/shifts/${encodeURIComponent(id)}/shift-preview-context`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !context(value['item']) || value['item'].shift.id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }

  preview(id: string, proposal: DemoShiftProposal) {
    return this.http.post<unknown>(`/api/v1/shifts/${encodeURIComponent(id)}/shift-change-previews`, proposal).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['shiftId'] !== id || !result(value['item'])
        || value['item'].before.id !== id || value['item'].proposed.startLocal !== proposal.startLocal
        || value['item'].proposed.endLocal !== proposal.endLocal || value['item'].reason !== proposal.reason.trim()
        || value['item'].proposed.split.enabled !== (proposal.split !== null)
        || value['item'].proposed.split.gapStartLocal !== (proposal.split?.gapStartLocal ?? null)
        || value['item'].proposed.split.gapEndLocal !== (proposal.split?.gapEndLocal ?? null)) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
