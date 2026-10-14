import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import type { DemoBreak, DemoBreakPreview, DemoBreakProposal, DemoBreakView } from '../../../api/src/stub/break-contracts';
import { isPersonalShiftItem, ShiftsApi } from './shifts-api';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoBreakPreview, DemoBreakView };

function breakItem(value: unknown): value is DemoBreak {
  return record(value) && typeof value['id'] === 'string' && /^break-[1-3]$/.test(value['id'])
    && local(value['startLocal']) && local(value['endLocal'])
    && (value['actualStartLocal'] === null || local(value['actualStartLocal']))
    && (value['actualEndLocal'] === null || local(value['actualEndLocal']));
}

function view(value: unknown): value is DemoBreakView {
  return record(value) && isPersonalShiftItem(value['shift'])
    && value['shift'].effective.employeeId === '00000001' && value['shift'].baseline === null
    && Array.isArray(value['breaks']) && value['breaks'].length <= 3 && value['breaks'].every(breakItem)
    && typeof value['previewAvailable'] === 'boolean'
    && (value['unavailableReason'] === null || typeof value['unavailableReason'] === 'string')
    && record(value['policy']) && value['policy']['version'] === 'synthetic-break-policy-1'
    && value['policy']['edgeMinutes'] === 60 && value['policy']['gapMinutes'] === 60
    && value['policy']['minDurationMinutes'] === 1 && value['policy']['maxDurationMinutes'] === 120;
}

function preview(value: unknown): value is DemoBreakPreview {
  return record(value) && value['previewOnly'] === true && value['saved'] === false
    && value['policyVersion'] === 'synthetic-break-policy-1' && breakItem(value['before'])
    && record(value['proposed']) && value['proposed']['id'] === value['before'].id
    && local(value['proposed']['startLocal']) && local(value['proposed']['endLocal'])
    && typeof value['durationMinutes'] === 'number' && Number.isInteger(value['durationMinutes'])
    && value['durationMinutes'] >= 1 && value['durationMinutes'] <= 120
    && (Date.parse(value['proposed']['endLocal'] + 'Z') - Date.parse(value['proposed']['startLocal'] + 'Z'))
      / 60_000 === value['durationMinutes']
    && Array.isArray(value['warnings']) && value['warnings'].every((item: unknown) => typeof item === 'string');
}

@Injectable({ providedIn: 'root' })
export class BreaksApi {
  private readonly http = inject(HttpClient);
  private readonly shifts = inject(ShiftsApi);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(
      map(value => {
        if (!synthetic(value) || !record(value['breaks']) || !record(value['breaks']['read'])
          || !record(value['breaks']['preview']) || value['breaks']['read']['enabled'] !== true
          || value['breaks']['preview']['enabled'] !== true) { throw new StubContractError(); }
        return true;
      }),
      switchMap(() => this.shifts.list('2026-10-14', '2026-10-18')),
    );
  }

  view(id: string) {
    return this.http.get<unknown>(`/api/v1/shifts/${encodeURIComponent(id)}/breaks`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !view(value['item']) || value['item'].shift.id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }

  preview(id: string, proposal: DemoBreakProposal) {
    return this.http.post<unknown>(`/api/v1/shifts/${encodeURIComponent(id)}/break-change-previews`, proposal).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || value['shiftId'] !== id || !preview(value['item'])
        || value['item'].proposed.id !== proposal.breakId || value['item'].proposed.startLocal !== proposal.startLocal
        || value['item'].durationMinutes !== proposal.durationMinutes) { throw new StubContractError(); }
      return value['item'];
    }));
  }
}
