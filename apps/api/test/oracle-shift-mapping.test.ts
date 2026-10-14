import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapOraclePersonalShift } from '../src/personal-shifts/oracle-shift-mapping.js';
import { PersonalShiftsError } from '../src/personal-shifts/personal-shifts.js';
import type { PersonalShiftScope } from '../src/personal-shifts/contracts.js';

const actor: PersonalShiftScope = { actorEmployeeId: '101', canViewBaseline: true };
const ownerLinks = [
  { ownerKey: '00000101', employeeId: '101' },
  { ownerKey: '00000102', employeeId: '102' },
];
function day() {
  return {
    SHF_EMPLOYEE_DAY_ID: '1001', WM_DAY_TYPE: '4', EMP_ID_NUMBER: '00000101',
    WM_SHIFT_START_DATETIME: '2026-10-14T08:00:00', WM_SHIFT_END_DATETIME: '2026-10-14T16:00:00',
    WM_SITE_ID: '12', WM_SCH_ACTIVITY_ID_DATA: 'synthetic-activity', WORK_FROM_HOME: 'N',
    SPLIT_SHIFT: 'N', SPLIT_START: null, SPLIT_END: null,
  };
}
function change(): Record<string, unknown> {
  return {
    SHF_EMPLOYEE_DAY_ID: '1001', NEW_DAY_TYPE: '4', NEW_EMPLOYEE_ID: '00000101', CANCEL_REASON_CODE: null,
    NEW_SHIFT_START: null, NEW_SHIFT_END: null, NEW_SITE_ID: null, NEW_ACTIVITY: null,
    NEW_WORK_FROM_HOME: 'N', NEW_SPLIT_SHIFT: 'N', NEW_SPLIT_START: null, NEW_SPLIT_END: null,
  };
}
function group(changes: readonly unknown[] = [], baseline: Record<string, unknown> = day()) {
  return { day: baseline, changes, ownerLinks };
}
function rejects(input: unknown, scope = actor) {
  assert.throws(() => mapOraclePersonalShift(input, scope), (error: unknown) => {
    assert.ok(error instanceof PersonalShiftsError);
    assert.equal(error.code, 'DATA_CONTRACT_UNVERIFIED');
    return true;
  });
}

test('baseline maps explicit internal ownership and immutable string identifiers without exposing extra source fields', () => {
  const input = group([], { ...day(), MODIFICATION_USER: 'synthetic-private-value', SOURCE: 'untrusted-origin' });
  const before = structuredClone(input);
  const item = mapOraclePersonalShift(input, actor);
  assert.equal(item?.id, '1001');
  assert.equal(item?.projection, 'baseline');
  assert.equal(item?.effective.employeeId, '101');
  assert.deepEqual(item?.baseline, item?.effective);
  assert.equal(item?.baselineAvailability, 'available');
  assert.ok(!JSON.stringify(item).includes('synthetic-private-value'));
  assert.ok(!JSON.stringify(item).includes('untrusted-origin'));
  assert.deepEqual(input, before);
  assert.deepEqual(mapOraclePersonalShift(input, actor), item);
});

test('change-row presence controls projection and nullable schedule fields inherit independently', () => {
  const input = group([{ ...change(), NEW_SHIFT_START: '2026-10-14T09:00:00', NEW_SITE_ID: '0', NEW_WORK_FROM_HOME: 'y' }],
    { ...day(), WM_DAY_TYPE: '1' });
  const item = mapOraclePersonalShift(input, actor);
  assert.equal(item?.projection, 'override');
  assert.equal(item?.effective.startLocal, '2026-10-14T09:00:00');
  assert.equal(item?.effective.endLocal, '2026-10-14T16:00:00');
  assert.equal(item?.effective.siteId, '0');
  assert.equal(item?.effective.activityId, 'synthetic-activity');
  assert.equal(item?.effective.workFromHome, true);
  assert.equal(item?.baseline?.startLocal, '2026-10-14T08:00:00');
  assert.equal(mapOraclePersonalShift(group([change()]), actor)?.projection, 'override');
});

test('null or missing changed day type never resurrects a valid baseline activity', () => {
  rejects(group([{ ...change(), NEW_DAY_TYPE: null }]));
  const missing = change(); delete missing['NEW_DAY_TYPE'];
  rejects(group([missing]));
});

test('unknown or malformed controlling day types fail while exact numeric or string activity codes work', () => {
  for (const type of [null, undefined, 0, -1, 8, 4.5, '04', '4.0', ' 4', 'unknown', {}, []]) {
    rejects(group([], { ...day(), WM_DAY_TYPE: type }));
    rejects(group([{ ...change(), NEW_DAY_TYPE: type }]));
  }
  assert.ok(mapOraclePersonalShift(group([], { ...day(), WM_DAY_TYPE: 4 }), actor));
  assert.ok(mapOraclePersonalShift(group([{ ...change(), NEW_DAY_TYPE: 4 }]), actor));
});

test('known nonactivity types are exclusions without fabricated schedules or owner links', () => {
  for (const type of [1, 2, 3, 5, 6, 7, '1', '2', '3', '5', '6', '7']) {
    assert.equal(mapOraclePersonalShift({
      day: { SHF_EMPLOYEE_DAY_ID: '1001', WM_DAY_TYPE: type }, changes: [], ownerLinks: [],
    }, actor), null);
    assert.equal(mapOraclePersonalShift({
      day: { SHF_EMPLOYEE_DAY_ID: '1001' },
      changes: [{ SHF_EMPLOYEE_DAY_ID: '1001', NEW_DAY_TYPE: type, NEW_EMPLOYEE_ID: null, CANCEL_REASON_CODE: null }],
      ownerLinks: [],
    }, actor), null);
  }
});

test('cancellation sentinel excludes without reason, dates, new day type or sentinel employee link', () => {
  assert.equal(mapOraclePersonalShift({
    day: { SHF_EMPLOYEE_DAY_ID: '1001' },
    changes: [{ SHF_EMPLOYEE_DAY_ID: '1001', NEW_EMPLOYEE_ID: '99999999', CANCEL_REASON_CODE: null }],
    ownerLinks: [],
  }, actor), null);
  rejects(group([{ ...change(), NEW_EMPLOYEE_ID: 99999999 }]));
});

test('any non-null cancellation reason excludes activity independently of ordinary or sentinel owner', () => {
  for (const reason of ['synthetic-reason', '0', '', ' ']) {
    for (const owner of ['00000101', '99999999', null]) {
      assert.equal(mapOraclePersonalShift(group([{ ...change(), NEW_EMPLOYEE_ID: owner, CANCEL_REASON_CODE: reason }]), actor), null);
    }
  }
  rejects(group([{ ...change(), CANCEL_REASON_CODE: 0 }]));
  const missing = change(); delete missing['CANCEL_REASON_CODE'];
  rejects(group([missing]));
});

test('duplicate or foreign change associations remain errors even for cancelled rows', () => {
  const cancelled = { ...change(), NEW_EMPLOYEE_ID: '99999999' };
  rejects(group([cancelled, cancelled]));
  rejects(group([{ ...cancelled, SHF_EMPLOYEE_DAY_ID: '1002' }]));
  for (const changes of [null, {}, [null], [day(), change()]]) {
    rejects({ ...group(), changes });
  }
});

test('owner links must be explicit and unique without prefix matching or raw identity substitution', () => {
  rejects({ ...group(), ownerLinks: [] });
  rejects({ ...group(), ownerLinks: [ownerLinks[0], ownerLinks[0]] });
  rejects({ ...group(), ownerLinks: [ownerLinks[0], { ownerKey: '00000101', employeeId: '102' }] });
  rejects({ ...group(), ownerLinks: [{ ownerKey: '000001019', employeeId: '101' }] });
  rejects(group([{ ...change(), NEW_EMPLOYEE_ID: null }]));
  assert.equal(mapOraclePersonalShift({
    ...group(), ownerLinks: [{ ownerKey: '00000101', employeeId: '9007199254740993' }],
  }, { actorEmployeeId: '9007199254740993', canViewBaseline: true })?.effective.employeeId, '9007199254740993');
  for (const employeeId of [101, '0101', '-1', '1.0', '1'.repeat(39)]) {
    rejects({ ...group(), ownerLinks: [{ ownerKey: '00000101', employeeId }] });
  }
});

test('raw numeric keys/sites are string-only and retain zero without precision-loss conversion', () => {
  assert.equal(mapOraclePersonalShift(group([], { ...day(), SHF_EMPLOYEE_DAY_ID: '9999999999', WM_SITE_ID: '0' }), actor)?.id, '9999999999');
  for (const id of [1001, '01001', '0', '10000000000', '9007199254740993']) {
    rejects(group([], { ...day(), SHF_EMPLOYEE_DAY_ID: id }));
  }
  for (const site of [12, null, '01', '-1', '1.5', '10000000000']) {
    rejects(group([], { ...day(), WM_SITE_ID: site }));
  }
  const largeSite = '12345678901234567890123456789012345678';
  assert.equal(mapOraclePersonalShift(group([{ ...change(), NEW_SITE_ID: largeSite }]), actor)?.effective.siteId, largeSite);
});

test('included invalid dates and flags fail rather than convert Date, invent bounds or hide foreign malformed rows', () => {
  for (const time of [null, undefined, new Date('2026-10-14T08:00:00Z'), '2026-02-30T08:00:00',
    '2026-10-14T24:00:00', '2026-10-14T08:00:00Z', '2026-10-14T08:00:00+03:00']) {
    rejects(group([], { ...day(), WM_SHIFT_START_DATETIME: time }));
    rejects(group([{ ...change(), NEW_SHIFT_START: time === null ? 'invalid' : time }]));
  }
  for (const value of [null, undefined, true, 'true', ' N', '', 'unknown']) {
    rejects(group([], { ...day(), WORK_FROM_HOME: value }));
    rejects(group([{ ...change(), NEW_SPLIT_SHIFT: value }]));
  }
  rejects(group([{ ...change(), NEW_EMPLOYEE_ID: '00000102', NEW_SHIFT_START: 'invalid' }]));
  rejects(group([{ ...change(), NEW_SHIFT_START: '2026-10-14T09:00:00' }], { ...day(), WM_SHIFT_START_DATETIME: null }));
  rejects(group([], { ...day(), WM_SHIFT_END_DATETIME: '2026-10-14T07:59:59' }));
});

test('split boundaries inherit individually but inconsistent stale or disabled gaps are rejected', () => {
  const baseline = { ...day(), SPLIT_SHIFT: 'Y', SPLIT_START: '2026-10-14T12:00:00', SPLIT_END: '2026-10-14T13:00:00' };
  const item = mapOraclePersonalShift(group([{
    ...change(), NEW_SPLIT_SHIFT: 'y', NEW_SPLIT_START: '2026-10-14T11:30:00',
  }], baseline), actor);
  assert.deepEqual(item?.effective.split, { enabled: true, gapStartLocal: '2026-10-14T11:30:00', gapEndLocal: '2026-10-14T13:00:00' });
  rejects(group([{ ...change(), NEW_SPLIT_SHIFT: 'N' }], baseline));
  rejects(group([{ ...change(), NEW_SPLIT_SHIFT: 'Y' }]));
  rejects(group([{ ...change(), NEW_SPLIT_SHIFT: 'Y', NEW_SPLIT_START: '2026-10-14T14:00:00' }], baseline));
  rejects(group([], { ...baseline, SPLIT_START: '2026-10-14T07:00:00' }));
  rejects(group([], { ...baseline, SPLIT_END: '2026-10-14T13:00:00Z' }));
});

test('overnight wall strings keep their exact dates and seconds without timezone conversion', () => {
  const item = mapOraclePersonalShift(group([], {
    ...day(), WM_SHIFT_START_DATETIME: '2026-10-24T23:00:17', WM_SHIFT_END_DATETIME: '2026-10-25T06:00:23',
  }), actor);
  assert.equal(item?.effective.startLocal, '2026-10-24T23:00:17');
  assert.equal(item?.effective.endLocal, '2026-10-25T06:00:23');
});

test('effective ownership, transfer redaction and explicit baseline permission reuse existing projection', () => {
  const input = group([{ ...change(), NEW_EMPLOYEE_ID: '00000102' }]);
  assert.equal(mapOraclePersonalShift(input, actor), null);
  const item = mapOraclePersonalShift(input, { actorEmployeeId: '102', canViewBaseline: false });
  assert.equal(item?.effective.employeeId, '102');
  assert.equal(item?.baseline, null);
  assert.equal(item?.baselineAvailability, 'not-authorized');
  assert.ok(!JSON.stringify(item).includes('00000101'));
  assert.ok(!JSON.stringify(item).includes('"101"'));
  assert.equal(mapOraclePersonalShift(input, { actorEmployeeId: '102', canViewBaseline: true })?.baseline?.employeeId, '101');
});

test('malformed scope, records and links fail with redacted errors and no partial-success result', () => {
  for (const input of [null, [], {}, { ...group(), day: null }, { ...group(), ownerLinks: null },
    { ...group(), ownerLinks: [null] }, { ...group(), ownerLinks: [{ ownerKey: '99999999', employeeId: '101' }] }]) {
    rejects(input);
  }
  rejects(group(), { actorEmployeeId: '0101', canViewBaseline: true });
  assert.throws(() => mapOraclePersonalShift({
    ...group(), ownerLinks: [{ ownerKey: '00000101', employeeId: 'synthetic-private-employee' }],
  }, actor), (error: unknown) => {
    assert.ok(error instanceof PersonalShiftsError);
    assert.ok(!JSON.stringify(error).includes('synthetic-private-employee'));
    assert.ok(!error.message.includes('synthetic-private-employee'));
    return true;
  });
  assert.throws(() => [group(), group([{ ...change(), NEW_DAY_TYPE: null }])]
    .map(input => mapOraclePersonalShift(input, actor)), PersonalShiftsError);
});
