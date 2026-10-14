import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { calculateStaffingReport, DemoReportError, parseReportQuery } from '../src/stub/report-calculation.js';
import { syntheticReportStaff, syntheticRequiredHeadcount } from '../src/stub/report-fixtures.js';
import type { DemoReportQuery } from '../src/stub/report-contracts.js';

const query: DemoReportQuery = {
  fromLocal: '2026-10-14T08:00:00', toExclusiveLocal: '2026-10-14T10:00:00',
  includeBreaks: true, includeExceptions: true,
};
function code(value: string) { return (error: unknown) => error instanceof DemoReportError && error.code === value; }

test('exact partial overlap is seven minutes, union deductions occur once and known-only totals are precise', () => {
  const staff = syntheticReportStaff();
  const forecast = syntheticRequiredHeadcount();
  const before = structuredClone({ staff, forecast });
  const result = calculateStaffingReport(query, staff, forecast);
  assert.equal(result.intervals.length, 8);
  assert.equal(result.intervals[0]?.modifiedAvailableMinutes, 7);
  assert.equal(result.intervals[0]?.baselineAvailableMinutes, 30);
  assert.equal(result.intervals[0]?.modifiedGapMinutes, -23);
  assert.equal(result.intervals[1]?.modifiedAvailableMinutes, 5);
  assert.equal(result.intervals[2]?.modifiedAvailableMinutes, 25);
  assert.equal(result.intervals[3]?.requiredMinutes, null);
  assert.equal(result.intervals[3]?.modifiedGapMinutes, null);
  assert.equal(result.intervals[5]?.requiredHeadcount, 0);
  assert.equal(result.intervals[5]?.requiredMinutes, 0);
  assert.deepEqual(result.totals, {
    baselineGrossMinutes: 240, baselineAvailableMinutes: 225,
    modifiedGrossMinutes: 202, modifiedAvailableMinutes: 187,
    knownForecastIntervals: 7, missingForecastIntervals: 1, knownRequiredMinutes: 210,
    knownBaselineStaffMinutes: 195, knownModifiedStaffMinutes: 157,
    knownBaselineGapMinutes: -15, knownModifiedGapMinutes: -53,
    comparisonScope: 'known-forecast-intervals-only',
  });
  assert.deepEqual({ staff, forecast }, before);
  assert.deepEqual(calculateStaffingReport(query, staff, forecast), result);
});

test('deduction switches apply to both projections and duplicate shifts never count one employee twice', () => {
  const gross = calculateStaffingReport({ ...query, includeBreaks: false, includeExceptions: false });
  assert.equal(gross.totals.baselineAvailableMinutes, 240);
  assert.equal(gross.totals.modifiedAvailableMinutes, 202);
  assert.equal(calculateStaffingReport({ ...query, includeExceptions: false }).totals.modifiedAvailableMinutes, 192);
  assert.equal(calculateStaffingReport({ ...query, includeBreaks: false }).totals.modifiedAvailableMinutes, 192);
  const staff = syntheticReportStaff();
  const first = staff[0];
  assert.ok(first);
  assert.deepEqual(calculateStaffingReport(query, [...staff, structuredClone(first)]).totals,
    calculateStaffingReport(query, staff).totals);
});

test('unavailable union is clipped to shift and interval and full local-day exclusion gives zero without negatives', () => {
  const staff = syntheticReportStaff()[0];
  assert.ok(staff);
  const fullDay = { startLocal: '2026-10-14T00:00:00', endLocal: '2026-10-15T00:00:00' };
  const projection = { ...staff.baseline, exceptions: [fullDay, fullDay] };
  const report = calculateStaffingReport(query, [{ ...staff, baseline: projection, modified: projection }], {});
  assert.equal(report.totals.baselineAvailableMinutes, 0);
  assert.ok(report.intervals.every(row => row.modifiedAvailableMinutes === 0 && row.modifiedGapMinutes === null));
});

test('quarter-hour and four-hour bounds, midnight, source errors and unknown coverage never become fake zero forecast', () => {
  for (const input of [
    { ...query, fromLocal: '2026-10-14T08:01:00' }, { ...query, toExclusiveLocal: '2026-10-14T12:15:00' },
    { ...query, toExclusiveLocal: query.fromLocal }, { ...query, fromLocal: '2026-02-30T08:00:00' },
    { ...query, includeBreaks: 'invalid' }, { ...query, unitId: 'foreign' },
  ]) { assert.throws(() => parseReportQuery(input), code('INVALID_REPORT_QUERY')); }
  assert.equal(calculateStaffingReport({ ...query, toExclusiveLocal: '2026-10-14T12:00:00' }).intervals.length, 16);
  const night = calculateStaffingReport({ ...query, fromLocal: '2026-10-14T23:00:00', toExclusiveLocal: '2026-10-15T01:00:00' });
  assert.equal(night.totals.modifiedAvailableMinutes, 120);
  assert.equal(night.totals.knownModifiedGapMinutes, 0);
  const emptyForecast = calculateStaffingReport({ ...query, fromLocal: '2026-10-14T18:00:00', toExclusiveLocal: '2026-10-14T19:00:00' });
  assert.equal(emptyForecast.totals.knownForecastIntervals, 0);
  assert.ok(emptyForecast.intervals.every(row => row.requiredHeadcount === null));
  assert.throws(() => calculateStaffingReport({ ...query, fromLocal: '2026-10-15T08:00:00', toExclusiveLocal: '2026-10-15T09:00:00' }), code('REPORT_SOURCE_UNAVAILABLE'));
  assert.throws(() => calculateStaffingReport(query, syntheticReportStaff(), { [query.fromLocal]: -1 }), code('REPORT_SOURCE_INVALID'));
  assert.throws(() => calculateStaffingReport(query, syntheticReportStaff(), {
    '2026-10-14T08:00:00': Math.floor(Number.MAX_SAFE_INTEGER / 15),
    '2026-10-14T08:15:00': Math.floor(Number.MAX_SAFE_INTEGER / 15),
  }), code('REPORT_SOURCE_INVALID'));
});

test('bounded GET returns exact aggregate shape without employees, writes, publication or exports', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const url = '/api/v1/reports/staffing-forecast?fromLocal=2026-10-14T08:00:00&toExclusiveLocal=2026-10-14T10:00:00';
    const response = await app.inject({ method: 'GET', url });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'no-store');
    const body = JSON.parse(response.body);
    assert.equal(body.synthetic, true);
    assert.equal(body.item.sourceVersion, 'synthetic-report-source-1');
    assert.equal(body.item.intervals[0].modifiedAvailableMinutes, 7);
    assert.ok(!response.body.includes('employeeId'));
    assert.ok(!response.body.includes('00000004'));
    assert.deepEqual(JSON.parse((await app.inject({ method: 'GET', url })).body).item, body.item);
    assert.equal((await app.inject({ method: 'GET', url: url + '&unitId=foreign' })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/reports/staffing-forecast', payload: {} })).statusCode, 404);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/exports', payload: {} })).statusCode, 404);
  } finally { await app.close(); }
});
