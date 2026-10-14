import { localWallMinute } from '../personal-shifts/wall-time.js';
import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import type { DemoReportQuery, DemoReportSpan, DemoReportStaff, DemoStaffingReport, DemoStaffingReportRow } from './report-contracts.js';
import { syntheticReportStaff, syntheticRequiredHeadcount } from './report-fixtures.js';

export class DemoReportError extends Error {
  constructor(readonly code: 'INVALID_REPORT_QUERY' | 'REPORT_SOURCE_INVALID' | 'REPORT_SOURCE_UNAVAILABLE', message: string) { super(message); }
}
function boolean(value: unknown): boolean {
  if (value === undefined || value === true || value === 'true') { return true; }
  if (value === false || value === 'false') { return false; }
  throw new DemoReportError('INVALID_REPORT_QUERY', 'מסנני הפסקות וחריגות חייבים להיות true או false.');
}
export function parseReportQuery(value: unknown): DemoReportQuery {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || Object.keys(value).some(key => !['fromLocal', 'toExclusiveLocal', 'includeBreaks', 'includeExceptions'].includes(key))
    || !('fromLocal' in value) || typeof value.fromLocal !== 'string'
    || !('toExclusiveLocal' in value) || typeof value.toExclusiveLocal !== 'string') {
    throw new DemoReportError('INVALID_REPORT_QUERY', 'יש לספק התחלה וסיום מקומיים לדוח בלבד.');
  }
  const from = localWallMinute(value.fromLocal);
  const to = localWallMinute(value.toExclusiveLocal);
  if (from === null || to === null || from % 15 !== 0 || to % 15 !== 0 || to <= from || to - from > 240) {
    throw new DemoReportError('INVALID_REPORT_QUERY', 'חלון הדוח חייב להיות 15–240 דקות ובגבולות רבע שעה.');
  }
  return {
    fromLocal: value.fromLocal, toExclusiveLocal: value.toExclusiveLocal,
    includeBreaks: boolean('includeBreaks' in value ? value.includeBreaks : undefined),
    includeExceptions: boolean('includeExceptions' in value ? value.includeExceptions : undefined),
  };
}
type Interval = readonly [number, number];
function minutes(span: DemoReportSpan): Interval {
  const start = localWallMinute(span.startLocal);
  const end = localWallMinute(span.endLocal);
  if (start === null || end === null || end <= start) {
    throw new DemoReportError('REPORT_SOURCE_INVALID', 'טווח נתוני ההדגמה אינו תקין; אין חישוב ברירת מחדל.');
  }
  return [start, end];
}
function merged(spans: readonly Interval[], from: number, to: number): Interval[] {
  const clipped = spans.map(([start, end]): Interval => [Math.max(start, from), Math.min(end, to)])
    .filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  const result: Interval[] = [];
  for (const span of clipped) {
    const previous = result[result.length - 1];
    if (previous && span[0] <= previous[1]) {
      result[result.length - 1] = [previous[0], Math.max(previous[1], span[1])];
    } else { result.push(span); }
  }
  return result;
}
function staffing(
  records: readonly DemoReportStaff[], projection: 'baseline' | 'modified', from: number, to: number, query: DemoReportQuery,
) {
  const allowed = new Set(syntheticEmployees().filter(employee => employee.orgUnit.id === DEMO_EMPLOYEE_UNIT).map(employee => employee.id));
  const grouped = new Map<string, { shifts: Interval[]; unavailable: Interval[] }>();
  for (const record of records) {
    if (record.unitId !== DEMO_EMPLOYEE_UNIT || !allowed.has(record.employeeId)) { continue; }
    const schedule = record[projection];
    if (typeof schedule.active !== 'boolean') {
      throw new DemoReportError('REPORT_SOURCE_INVALID', 'מצב שיבוץ בדוגמה אינו מאומת.');
    }
    if (!schedule.active) { continue; }
    const group = grouped.get(record.employeeId) ?? { shifts: [], unavailable: [] };
    group.shifts.push(minutes(schedule.shift));
    const exclusions = [
      ...(query.includeBreaks ? schedule.breaks : []), ...(query.includeExceptions ? schedule.exceptions : []),
    ];
    group.unavailable.push(...exclusions.map(minutes));
    grouped.set(record.employeeId, group);
  }
  let gross = 0;
  let deducted = 0;
  for (const group of grouped.values()) {
    const available = merged(group.shifts, from, to);
    const excluded = merged(group.unavailable, from, to);
    gross += available.reduce((sum, [start, end]) => sum + end - start, 0);
    for (const [start, end] of available) {
      for (const [unavailableStart, unavailableEnd] of excluded) {
        deducted += Math.max(0, Math.min(end, unavailableEnd) - Math.max(start, unavailableStart));
      }
    }
  }
  return { gross, available: gross - deducted };
}
function local(minute: number) { return new Date(minute * 60_000).toISOString().slice(0, 19); }

export function calculateStaffingReport(
  input: DemoReportQuery,
  records: readonly DemoReportStaff[] = syntheticReportStaff(),
  forecast: Readonly<Record<string, number | null>> = syntheticRequiredHeadcount(),
): DemoStaffingReport {
  const query = parseReportQuery(input);
  if (query.fromLocal < '2026-10-14T00:00:00' || query.toExclusiveLocal > '2026-10-15T02:00:00') {
    throw new DemoReportError('REPORT_SOURCE_UNAVAILABLE', 'מקור הדגמה ידוע רק ל־14.10.2026 ועד 15.10.2026 בשעה 02:00.');
  }
  const from = localWallMinute(query.fromLocal);
  const to = localWallMinute(query.toExclusiveLocal);
  if (from === null || to === null) { throw new DemoReportError('INVALID_REPORT_QUERY', 'טווח דוח אינו תקין.'); }
  const intervals: DemoStaffingReportRow[] = [];
  for (let start = from; start < to; start += 15) {
    const baseline = staffing(records, 'baseline', start, start + 15, query);
    const modified = staffing(records, 'modified', start, start + 15, query);
    const requiredHeadcount = forecast[local(start)] ?? null;
    if (requiredHeadcount !== null && (!Number.isSafeInteger(requiredHeadcount) || requiredHeadcount < 0)) {
      throw new DemoReportError('REPORT_SOURCE_INVALID', 'נתון דרישה בדוח ההדגמה אינו תקין.');
    }
    const requiredMinutes = requiredHeadcount === null ? null : requiredHeadcount * 15;
    if (requiredMinutes !== null && !Number.isSafeInteger(requiredMinutes)) {
      throw new DemoReportError('REPORT_SOURCE_INVALID', 'נתון דרישה חורג מדיוק מספרי בטוח.');
    }
    intervals.push({
      startLocal: local(start), endExclusiveLocal: local(start + 15),
      baselineGrossMinutes: baseline.gross, baselineAvailableMinutes: baseline.available,
      modifiedGrossMinutes: modified.gross, modifiedAvailableMinutes: modified.available,
      requiredHeadcount, requiredMinutes,
      baselineGapMinutes: requiredMinutes === null ? null : baseline.available - requiredMinutes,
      modifiedGapMinutes: requiredMinutes === null ? null : modified.available - requiredMinutes,
    });
  }
  const known = intervals.filter(row => row.requiredMinutes !== null);
  const sum = (rows: readonly DemoStaffingReportRow[], field: 'baselineGrossMinutes' | 'baselineAvailableMinutes' | 'modifiedGrossMinutes'
    | 'modifiedAvailableMinutes' | 'requiredMinutes') => {
    const total = rows.reduce((result, row) => result + (row[field] ?? 0), 0);
    if (!Number.isSafeInteger(total)) { throw new DemoReportError('REPORT_SOURCE_INVALID', 'סיכום הדוח חורג מדיוק מספרי בטוח.'); }
    return total;
  };
  const required = sum(known, 'requiredMinutes');
  const baselineKnown = sum(known, 'baselineAvailableMinutes');
  const modifiedKnown = sum(known, 'modifiedAvailableMinutes');
  return {
    sourceVersion: 'synthetic-report-source-1', unitId: 'synthetic-team-a', intervalMinutes: 15,
    query, intervals,
    totals: {
      baselineGrossMinutes: sum(intervals, 'baselineGrossMinutes'), baselineAvailableMinutes: sum(intervals, 'baselineAvailableMinutes'),
      modifiedGrossMinutes: sum(intervals, 'modifiedGrossMinutes'), modifiedAvailableMinutes: sum(intervals, 'modifiedAvailableMinutes'),
      knownForecastIntervals: known.length, missingForecastIntervals: intervals.length - known.length,
      knownRequiredMinutes: required, knownBaselineStaffMinutes: baselineKnown, knownModifiedStaffMinutes: modifiedKnown,
      knownBaselineGapMinutes: baselineKnown - required, knownModifiedGapMinutes: modifiedKnown - required,
      comparisonScope: 'known-forecast-intervals-only',
    },
    warnings: [
      'דקות כוח אדם סינתטיות, לא נוכחות או שכר. אין המרת רגעי Oracle/UTC או חישוב שעון קיץ.',
      'טווחי דרישה חסרה אינם מחושבים כדרישה אפס ואינם נכללים בסיכום ההשוואה.',
      'דוגמת דיווח נפרדת; אין משקלי פעילות, חיזוי אופטימיזציה, יצוא, פרסום BI או הפעלת batch.',
    ],
  };
}
