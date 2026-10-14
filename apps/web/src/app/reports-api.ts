import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { localWallMinute } from '../../../api/src/personal-shifts/wall-time';
import type { DemoReportQuery, DemoStaffingReport, DemoStaffingReportRow } from '../../../api/src/stub/report-contracts';
import { metadata, record, StubContractError, synthetic } from './stub-response';

export type { DemoReportQuery, DemoStaffingReport };

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}
function row(value: unknown): value is DemoStaffingReportRow {
  if (!record(value) || typeof value['startLocal'] !== 'string' || typeof value['endExclusiveLocal'] !== 'string') { return false; }
  const start = localWallMinute(value['startLocal']);
  const end = localWallMinute(value['endExclusiveLocal']);
  if (start === null || end === null || end - start !== 15 || start % 15 !== 0) { return false; }
  const baselineGross = value['baselineGrossMinutes'];
  const baselineAvailable = value['baselineAvailableMinutes'];
  const modifiedGross = value['modifiedGrossMinutes'];
  const modifiedAvailable = value['modifiedAvailableMinutes'];
  if (!integer(baselineGross) || !integer(baselineAvailable) || !integer(modifiedGross) || !integer(modifiedAvailable)
    || [baselineGross, baselineAvailable, modifiedGross, modifiedAvailable].some(minutes => minutes < 0 || minutes > 45)
    || baselineAvailable > baselineGross || modifiedAvailable > modifiedGross) { return false; }
  if (value['requiredHeadcount'] === null) {
    return value['requiredMinutes'] === null && value['baselineGapMinutes'] === null && value['modifiedGapMinutes'] === null;
  }
  return integer(value['requiredHeadcount']) && value['requiredHeadcount'] >= 0 && integer(value['requiredMinutes'])
    && value['requiredMinutes'] === value['requiredHeadcount'] * 15
    && value['baselineGapMinutes'] === baselineAvailable - value['requiredMinutes']
    && value['modifiedGapMinutes'] === modifiedAvailable - value['requiredMinutes'];
}

function report(value: unknown, query: DemoReportQuery): value is DemoStaffingReport {
  if (!record(value) || value['sourceVersion'] !== 'synthetic-report-source-1' || value['unitId'] !== 'synthetic-team-a'
    || value['intervalMinutes'] !== 15 || !record(value['query'])
    || value['query']['fromLocal'] !== query.fromLocal || value['query']['toExclusiveLocal'] !== query.toExclusiveLocal
    || value['query']['includeBreaks'] !== query.includeBreaks || value['query']['includeExceptions'] !== query.includeExceptions
    || !Array.isArray(value['intervals']) || !value['intervals'].every(row)
    || !record(value['totals']) || value['totals']['comparisonScope'] !== 'known-forecast-intervals-only'
    || !Array.isArray(value['warnings']) || !value['warnings'].every((warning: unknown) => typeof warning === 'string')) { return false; }
  const start = localWallMinute(query.fromLocal);
  const end = localWallMinute(query.toExclusiveLocal);
  if (start === null || end === null || value['intervals'].length !== (end - start) / 15
    || value['intervals'].length < 1 || value['intervals'].length > 16
    || value['intervals'].some((item, index) => localWallMinute(item.startLocal) !== start + index * 15)) { return false; }
  const rows = value['intervals'];
  const known = rows.filter(item => item.requiredMinutes !== null);
  const sum = (items: readonly DemoStaffingReportRow[], field: 'baselineGrossMinutes' | 'baselineAvailableMinutes'
    | 'modifiedGrossMinutes' | 'modifiedAvailableMinutes' | 'requiredMinutes') => items.reduce((total, item) => total + (item[field] ?? 0), 0);
  const required = sum(known, 'requiredMinutes');
  const expected = {
    baselineGrossMinutes: sum(rows, 'baselineGrossMinutes'), baselineAvailableMinutes: sum(rows, 'baselineAvailableMinutes'),
    modifiedGrossMinutes: sum(rows, 'modifiedGrossMinutes'), modifiedAvailableMinutes: sum(rows, 'modifiedAvailableMinutes'),
    knownForecastIntervals: known.length, missingForecastIntervals: rows.length - known.length, knownRequiredMinutes: required,
    knownBaselineStaffMinutes: sum(known, 'baselineAvailableMinutes'), knownModifiedStaffMinutes: sum(known, 'modifiedAvailableMinutes'),
    knownBaselineGapMinutes: sum(known, 'baselineAvailableMinutes') - required,
    knownModifiedGapMinutes: sum(known, 'modifiedAvailableMinutes') - required,
  };
  const totals = value['totals'];
  return Object.entries(expected).every(([field, expectedValue]) => Number.isSafeInteger(expectedValue) && totals[field] === expectedValue);
}

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['reports']) || !record(value['reports']['read'])
        || value['reports']['read']['enabled'] !== true) { throw new StubContractError(); }
      return true;
    }));
  }
  report(query: DemoReportQuery) {
    return this.http.get<unknown>('/api/v1/reports/staffing-forecast', {
      params: {
        fromLocal: query.fromLocal, toExclusiveLocal: query.toExclusiveLocal,
        includeBreaks: String(query.includeBreaks), includeExceptions: String(query.includeExceptions),
      },
    }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !report(value['item'], query)) { throw new StubContractError(); }
      return { item: value['item'], fetchedAt: String(value['fetchedAt']) };
    }));
  }
}
