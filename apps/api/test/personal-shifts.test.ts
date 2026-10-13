import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PersonalShiftScope } from '../src/personal-shifts/contracts.js';
import {
  parsePersonalShiftQuery,
  PersonalShiftsError,
  projectPersonalShift,
  selectPersonalShifts,
} from '../src/personal-shifts/personal-shifts.js';

const actorA: PersonalShiftScope = { actorEmployeeId: '00000001', canViewBaseline: true };
const actorB: PersonalShiftScope = { actorEmployeeId: '00000002', canViewBaseline: false };
const query = { from: '2026-10-14', toExclusive: '2026-10-15', limit: 25 };

function scheduleFacts(employeeId = actorA.actorEmployeeId) {
  return {
    employeeId,
    startLocal: '2026-10-14T08:00:00',
    endLocal: '2026-10-14T16:00:00',
    siteId: 'synthetic-site-x',
    activityId: 'synthetic-activity',
    workFromHomeFlag: 'N',
    split: { flag: 'N', gapStartLocal: null, gapEndLocal: null },
  };
}

function shiftFacts(id = '9007199254740993') {
  const baseline = scheduleFacts();
  return { id, projection: 'baseline', eligibility: 'included', baseline, effective: { ...baseline } };
}

function expectError(action: () => unknown, code: PersonalShiftsError['code'], field?: string) {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof PersonalShiftsError);
    assert.equal(error.code, code);
    if (field !== undefined) {
      assert.equal(error.errors[0]?.field, field);
    }
    return true;
  });
}

test('query defaults and limit boundaries are explicit and bounded', () => {
  assert.deepEqual(parsePersonalShiftQuery({ from: query.from, toExclusive: query.toExclusive }), query);
  for (const limit of [1, 100, '1', '100']) {
    assert.equal(parsePersonalShiftQuery({ ...query, limit }).limit, Number(limit));
  }
  for (const limit of [0, 101, 1.5, NaN, Infinity, '1.5', ' 25', '025', '25abc', null, []]) {
    expectError(() => parsePersonalShiftQuery({ ...query, limit }), 'INVALID_QUERY', 'limit');
  }
});

test('calendar validation handles leap days and century rules without local time-zone conversion', () => {
  for (const from of ['2024-02-29', '2000-02-29', '0001-01-01']) {
    const toExclusive = from === '0001-01-01' ? '0001-01-02' : from.slice(0, 4) + '-03-01';
    assert.equal(parsePersonalShiftQuery({ from, toExclusive }).from, from);
  }
  for (const from of ['2026-02-30', '2026-02-29', '1900-02-29', '0000-01-01', '2026-13-01', '2026-10-00']) {
    expectError(() => parsePersonalShiftQuery({ ...query, from }), 'INVALID_QUERY', 'from');
  }
  assert.deepEqual(parsePersonalShiftQuery({ from: '2026-10-24', toExclusive: '2026-10-26' }), {
    from: '2026-10-24', toExclusive: '2026-10-26', limit: 25,
  });
});

test('half-open query interval accepts 31 days but rejects empty, reversed and wider intervals', () => {
  assert.equal(parsePersonalShiftQuery({ from: '2026-10-01', toExclusive: '2026-11-01' }).limit, 25);
  for (const toExclusive of ['2026-10-01', '2026-09-30', '2026-11-02']) {
    expectError(() => parsePersonalShiftQuery({ from: '2026-10-01', toExclusive }), 'INVALID_QUERY', 'toExclusive');
  }
  expectError(() => parsePersonalShiftQuery({ ...query, toExclusive: '2026-02-30' }), 'INVALID_QUERY', 'toExclusive');
});

test('unknown selectors and malformed request objects are rejected', () => {
  for (const input of [null, [], 'dates', {}, { ...query, employeeId: actorB.actorEmployeeId }, { ...query, sort: 'sql' }]) {
    expectError(() => parsePersonalShiftQuery(input), 'INVALID_QUERY');
  }
});

test('cursor handling stays explicitly gated instead of pretending to implement pagination', () => {
  for (const cursor of ['synthetic-cursor', '', null, undefined]) {
    expectError(() => parsePersonalShiftQuery({ ...query, cursor }), 'DATA_CONTRACT_UNVERIFIED', 'cursor');
  }
});

test('baseline mapping preserves lossless IDs and does not mutate source facts', () => {
  const facts = shiftFacts();
  const before = structuredClone(facts);
  const item = projectPersonalShift(facts, actorA);
  assert.equal(item?.id, '9007199254740993');
  assert.equal(item?.effective.employeeId, '00000001');
  assert.equal(item?.baselineAvailability, 'available');
  assert.deepEqual(item?.baseline, item?.effective);
  assert.deepEqual(facts, before);
  assert.notEqual(item?.effective, facts.effective);
});

test('effective override ownership scopes reads and independently redacts the original owner', () => {
  const facts = {
    ...shiftFacts(),
    projection: 'override',
    effective: { ...scheduleFacts(actorB.actorEmployeeId), siteId: 'synthetic-site-y' },
  };
  assert.equal(projectPersonalShift(facts, actorA), null);
  const item = projectPersonalShift(facts, actorB);
  assert.equal(item?.effective.siteId, 'synthetic-site-y');
  assert.equal(item?.baseline, null);
  assert.equal(item?.baselineAvailability, 'not-authorized');
  assert.ok(!JSON.stringify(item).includes(actorA.actorEmployeeId));
});

test('changed times, site and home-work remain separate from the authorized baseline', () => {
  const item = projectPersonalShift({
    ...shiftFacts(),
    projection: 'override',
    effective: {
      ...scheduleFacts(),
      startLocal: '2026-10-14T09:00:00',
      endLocal: '2026-10-14T17:00:00',
      siteId: 'synthetic-site-y',
      workFromHomeFlag: 'Y',
    },
  }, actorA);
  assert.equal(item?.effective.startLocal, '2026-10-14T09:00:00');
  assert.equal(item?.effective.endLocal, '2026-10-14T17:00:00');
  assert.equal(item?.effective.siteId, 'synthetic-site-y');
  assert.equal(item?.effective.workFromHome, true);
  assert.equal(item?.baseline?.startLocal, '2026-10-14T08:00:00');
  assert.equal(item?.baseline?.endLocal, '2026-10-14T16:00:00');
  assert.equal(item?.baseline?.siteId, 'synthetic-site-x');
  assert.equal(item?.baseline?.workFromHome, false);
});

test('absent baseline is explicit, while baseline provenance must match its original schedule', () => {
  const facts = { ...shiftFacts(), projection: 'override', baseline: null };
  assert.equal(projectPersonalShift(facts, actorA)?.baselineAvailability, 'not-present');
  expectError(() => projectPersonalShift({ ...facts, projection: 'baseline' }, actorA), 'DATA_CONTRACT_UNVERIFIED');
  expectError(() => projectPersonalShift({
    ...shiftFacts(),
    effective: { ...scheduleFacts(), siteId: 'synthetic-site-y' },
  }, actorA), 'DATA_CONTRACT_UNVERIFIED');
});

test('normalized inclusion facts do not guess cancellation or day-type semantics', () => {
  assert.equal(projectPersonalShift({ ...shiftFacts(), eligibility: 'excluded' }, actorA), null);
  expectError(() => projectPersonalShift({ ...shiftFacts(), eligibility: 'unverified' }, actorA), 'DATA_CONTRACT_UNVERIFIED');
  expectError(() => projectPersonalShift({ ...shiftFacts(), eligibility: null }, actorA), 'DATA_CONTRACT_UNVERIFIED');
});

test('unknown and invalid flags are not silently converted to false', () => {
  const effective = { ...scheduleFacts(), workFromHomeFlag: null };
  const item = projectPersonalShift({ ...shiftFacts(), projection: 'override', effective }, actorA);
  assert.equal(item?.effective.workFromHome, null);
  for (const flag of ['Y', 'y', 'N', 'n']) {
    const mapped = projectPersonalShift({
      ...shiftFacts(), projection: 'override', effective: { ...effective, workFromHomeFlag: flag },
    }, actorA);
    assert.equal(mapped?.effective.workFromHome, flag.toUpperCase() === 'Y');
  }
  expectError(() => projectPersonalShift({
    ...shiftFacts(), projection: 'override', effective: { ...effective, workFromHomeFlag: '0' },
  }, actorA), 'DATA_CONTRACT_UNVERIFIED');
});

test('enabled split maps a gap inside the local schedule without computing an instant or duration', () => {
  const effective = {
    ...scheduleFacts(),
    split: { flag: 'Y', gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T14:00:00' },
  };
  const item = projectPersonalShift({ ...shiftFacts(), projection: 'override', effective }, actorA);
  assert.deepEqual(item?.effective.split, {
    enabled: true, gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T14:00:00',
  });
  const unknown = projectPersonalShift({
    ...shiftFacts(), projection: 'override', effective: { ...effective, split: { flag: null, gapStartLocal: null, gapEndLocal: null } },
  }, actorA);
  assert.equal(unknown?.effective.split.enabled, null);
});

test('inconsistent split gaps fail explicitly', () => {
  const cases = [
    { flag: 'Y', gapStartLocal: null, gapEndLocal: null },
    { flag: 'N', gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T14:00:00' },
    { flag: 'Y', gapStartLocal: '2026-10-14T07:00:00', gapEndLocal: '2026-10-14T14:00:00' },
    { flag: 'Y', gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T17:00:00' },
    { flag: 'Y', gapStartLocal: '2026-10-14T14:00:00', gapEndLocal: '2026-10-14T12:00:00' },
  ];
  for (const split of cases) {
    expectError(() => projectPersonalShift({
      ...shiftFacts(), projection: 'override', effective: { ...scheduleFacts(), split },
    }, actorA), 'DATA_CONTRACT_UNVERIFIED');
  }
});

test('inclusive split shape boundaries preserve normalized facts without deciding a duration policy', () => {
  for (const gap of [
    { gapStartLocal: '2026-10-14T08:00:00', gapEndLocal: '2026-10-14T16:00:00' },
    { gapStartLocal: '2026-10-14T12:00:00', gapEndLocal: '2026-10-14T12:00:00' },
  ]) {
    const item = projectPersonalShift({
      ...shiftFacts(),
      projection: 'override',
      effective: { ...scheduleFacts(), split: { flag: 'Y', ...gap } },
    }, actorA);
    assert.equal(item?.effective.split.gapStartLocal, gap.gapStartLocal);
    assert.equal(item?.effective.split.gapEndLocal, gap.gapEndLocal);
  }
});

test('unsafe identifiers and invalid local timestamps are rejected without including input in errors', () => {
  for (const id of [Number('9007199254740993'), '0', '01', '-1', '1e3', '1'.repeat(39), undefined]) {
    expectError(() => projectPersonalShift({ ...shiftFacts(), id }, actorA), 'DATA_CONTRACT_UNVERIFIED');
  }
  for (const startLocal of ['2026-02-30T08:00:00', '2026-10-14T24:00:00', '2026-10-14T08:60:00', '2026-10-14T08:00:60', '2026-10-14T08:00:00Z']) {
    expectError(() => projectPersonalShift({
      ...shiftFacts(), projection: 'override', effective: { ...scheduleFacts(), startLocal },
    }, actorA), 'DATA_CONTRACT_UNVERIFIED');
  }
  const sensitiveSyntheticValue = 'synthetic-sensitive-value';
  assert.throws(() => projectPersonalShift({
    ...shiftFacts(),
    projection: 'override',
    effective: { ...scheduleFacts(), workFromHomeFlag: sensitiveSyntheticValue },
  }, actorA), (error: unknown) => {
    assert.ok(error instanceof PersonalShiftsError);
    const serialized = JSON.stringify({ message: error.message, code: error.code, errors: error.errors });
    assert.ok(!serialized.includes(sensitiveSyntheticValue));
    assert.ok(!serialized.includes(actorA.actorEmployeeId));
    return true;
  });
});

test('half-open selection includes lower midnight and overnight shifts but not upper midnight', () => {
  function at(id: string, startLocal: string, endLocal: string) {
    return { ...shiftFacts(id), projection: 'override', effective: { ...scheduleFacts(), startLocal, endLocal } };
  }
  const result = selectPersonalShifts([
    at('1', '2026-10-14T00:00:00', '2026-10-14T08:00:00'),
    at('2', '2026-10-14T23:00:00', '2026-10-15T06:00:00'),
    at('3', '2026-10-15T00:00:00', '2026-10-15T08:00:00'),
  ], actorA, query);
  assert.deepEqual(result.items.map(item => item.id), ['2', '1']);
  assert.equal(result.hasMore, false);
  assert.equal(result.items[0]?.effective.endLocal, '2026-10-15T06:00:00');
});

test('ordering uses exact numeric IDs for equal starts rather than lossy numbers or lexical order', () => {
  const result = selectPersonalShifts([
    shiftFacts('9'), shiftFacts('10'), shiftFacts('9007199254740992'), shiftFacts('9007199254740993'),
  ], actorA, query);
  assert.deepEqual(result.items.map(item => item.id), ['9007199254740993', '9007199254740992', '10', '9']);
});

test('selection is bounded and reports more rows without inventing a cursor or truncated success', () => {
  const result = selectPersonalShifts([shiftFacts('1'), shiftFacts('2'), shiftFacts('3')], actorA, { ...query, limit: 2 });
  assert.deepEqual(result.items.map(item => item.id), ['3', '2']);
  assert.equal(result.hasMore, true);
  assert.equal(Object.hasOwn(result, 'nextCursor'), false);
  expectError(() => selectPersonalShifts([], actorA, { ...query, limit: 101 }), 'INVALID_QUERY', 'limit');
  const maximumPage = selectPersonalShifts(
    Array.from({ length: 101 }, (_, index) => shiftFacts(String(index + 1))),
    actorA,
    { ...query, limit: 100 },
  );
  assert.equal(maximumPage.items.length, 100);
  assert.equal(maximumPage.hasMore, true);
  assert.equal(maximumPage.items[0]?.id, '101');
  assert.equal(maximumPage.items[99]?.id, '2');
});

test('scope validation fails closed even for an empty synthetic dataset', () => {
  expectError(() => selectPersonalShifts([], {
    ...actorA, actorEmployeeId: '',
  }, query), 'DATA_CONTRACT_UNVERIFIED');
});

test('nullable reference IDs remain null and malformed schedule facts fail explicitly', () => {
  const item = projectPersonalShift({
    ...shiftFacts(),
    projection: 'override',
    effective: { ...scheduleFacts(), siteId: null, activityId: null },
  }, actorA);
  assert.equal(item?.effective.siteId, null);
  assert.equal(item?.effective.activityId, null);
  for (const input of [
    null,
    { ...shiftFacts(), projection: 'unverified' },
    { ...shiftFacts(), projection: 'override', effective: { ...scheduleFacts(), siteId: '' } },
    { ...shiftFacts(), projection: 'override', effective: { ...scheduleFacts(), endLocal: '2026-10-14T07:00:00' } },
  ]) {
    expectError(() => projectPersonalShift(input, actorA), 'DATA_CONTRACT_UNVERIFIED');
  }
});

test('duplicate matching facts fail instead of being arbitrarily deduplicated', () => {
  expectError(() => selectPersonalShifts([shiftFacts('1'), shiftFacts('1')], actorA, query), 'DATA_CONTRACT_UNVERIFIED');
});

test('separate actors and repeated calls share no mutable authority or result state', async () => {
  const facts = [
    shiftFacts('1'),
    { ...shiftFacts('2'), projection: 'override', effective: scheduleFacts(actorB.actorEmployeeId) },
  ];
  const before = structuredClone(facts);
  const [first, second] = await Promise.all([
    Promise.resolve(selectPersonalShifts(facts, actorA, query)),
    Promise.resolve(selectPersonalShifts(facts, actorB, query)),
  ]);
  assert.deepEqual(first.items.map(item => item.id), ['1']);
  assert.deepEqual(second.items.map(item => item.id), ['2']);
  assert.deepEqual(facts, before);
  assert.deepEqual(selectPersonalShifts([], actorA, query), { items: [], hasMore: false });
});
