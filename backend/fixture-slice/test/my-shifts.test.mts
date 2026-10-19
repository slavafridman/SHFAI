import test from "node:test";
import assert from "node:assert/strict";
import { ReadMyShifts } from "../read-my-shifts.mts";
import { MyShiftsFixtureReader } from "../my-shifts-fixture.mts";
import { sampleConfig, sampleMyShiftsFixture } from "../my-shifts-sample.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { myShiftsAccessPolicy } from "../access-policy.mts";
import { parseMyShiftsQuery, addCivilDates } from "../my-shifts-validation.mts";
import type { PrincipalV1 } from "../contracts.mts";
import type { MyShiftsFixtureData } from "../my-shifts-fixture.mts";
import { readEmployeeShiftDay } from "../read-employee-shift-day.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { sampleMyShiftsDetailRows } from "../my-shifts-sample.mts";

const principal = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const service = new ReadMyShifts(new MyShiftsFixtureReader(sampleMyShiftsFixture),
  myShiftsAccessPolicy(sampleConfig), { now: () => new Date("2024-02-28T23:30:00Z") },
  "Asia/Jerusalem", "isolated-fixture");
test("MY18-01 synthetic self is honest and never performs a read", async () => {
  const noRead = new ReadMyShifts({ readEmployeeContext: async () => { throw Error("unexpected"); },
    readRows: async () => { throw Error("unexpected"); } }, myShiftsAccessPolicy(sampleConfig),
  { now: () => new Date("2024-02-28T23:30:00Z") }, "Asia/Jerusalem", "isolated-fixture");
  const context = await noRead.context(principal, { mode: "self" });
  assert.equal(context.actor.employee, null); assert.equal(context.selectionRequired, true);
  assert.equal(context.canSelectEmployee, true);
  assert.deepEqual(context.defaults, { dateFrom: "2024-02-29", dateTo: "2024-03-13" });
  await assert.rejects(noRead.list(principal, { mode: "self", dateFrom: "2024-02-29", dateTo: "2024-03-01" }),
    { code: "EMPLOYEE_CONTEXT_REQUIRED" });
  assert.deepEqual(principal.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"]);
});

const actorId = "9007199254740993";
const request = { mode: "selected" as const, employeeId: actorId, dateFrom: "2024-02-29", dateTo: "2024-03-01" };
const realConfig = { ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
  syntheticOrgUnitIds: undefined, realProviderId: "isolated-test-double" };
const real = (overrides: Partial<PrincipalV1> = {}): PrincipalV1 => ({
  ...principal, subject: "isolated:real-provider-double", provider: "real", synthetic: false,
  roles: [], capabilities: ["my-shifts:read"], employeeId: actorId, ...overrides,
});
function fixtureService(data: MyShiftsFixtureData) {
  return new ReadMyShifts(new MyShiftsFixtureReader(data), myShiftsAccessPolicy(sampleConfig),
    { now: () => new Date("2024-03-28T22:30:00Z") }, "Asia/Jerusalem", "isolated-fixture");
}
test("MY18-01/02/12 verified real-self seam; independent capability, real selected denied before port", async () => {
  let reads = 0;
  const reader = new MyShiftsFixtureReader(sampleMyShiftsFixture);
  const counted = { readEmployeeContext: async (...args: Parameters<typeof reader.readEmployeeContext>) => {
    reads++; return reader.readEmployeeContext(...args);
  }, readRows: reader.readRows.bind(reader) };
  const s = new ReadMyShifts(counted, myShiftsAccessPolicy(realConfig),
    { now: () => new Date("2024-01-01T00:00:00Z") }, "Asia/Jerusalem", "isolated-fixture");
  await assert.rejects(s.context(real(), { mode: "selected", employeeId: actorId }), { code: "FORBIDDEN" });
  await assert.rejects(s.context(real({ capabilities: [] }), { mode: "self" }), { code: "FORBIDDEN" });
  assert.equal(reads, 0);
  assert.equal((await s.context(real({ employeeId: null }), { mode: "self" })).canSelectEmployee, false);
  assert.equal(reads, 0);
  const list = await s.list(real(), { mode: "self", dateFrom: request.dateFrom, dateTo: request.dateTo });
  assert.equal(list.actor.employee?.employeeId, actorId); assert.equal(list.applied.employeeId, actorId);
  await assert.rejects(readEmployeeShiftDay(real(), actorId, "1", new FixtureReader(sampleMyShiftsDetailRows),
    "Asia/Jerusalem"), { code: "FORBIDDEN" });
});
test("MY18-03 scope is exact, empty/parent do not broaden, and list revalidates moved actors", async () => {
  const s = fixtureService(sampleMyShiftsFixture);
  for (const p of [real({ resourceScope: { orgUnitIds: [] } }), real({ resourceScope: { orgUnitIds: ["01"] } })])
    await assert.rejects(s.context(p, { mode: "self" }), { code: "FORBIDDEN" });
  await s.context(principal, { mode: "selected", employeeId: actorId });
  const moved = structuredClone(sampleMyShiftsFixture);
  const movedData: MyShiftsFixtureData = { ...moved, catalog: { ...moved.catalog,
    teams: [...moved.catalog.teams, { code: "T02", label: "צוות אחר", unitType: "J01", parentMokedCode: "01" }] },
    employees: moved.employees.map(e => ({ ...e, teamCode: "T02" })) };
  await assert.rejects(fixtureService(movedData).list(principal, request), { code: "FORBIDDEN" });
  assert.deepEqual(await s.list(principal, { ...request, dateFrom: "2020-01-01", dateTo: "2020-01-01" })
    .then(r => [r.items.length, r.actor.employee?.employeeId]), [0, actorId]);
});
test("MY18-04 one zone clock sample, no next-hour rounding; DST and final-year clamping", async () => {
  for (const [instant, from, to] of [
    ["2024-03-28T22:30:00Z", "2024-03-29", "2024-04-11"],
    ["2024-10-26T22:30:00Z", "2024-10-27", "2024-11-09"],
    ["9999-12-30T12:30:00Z", "9999-12-30", "9999-12-31"],
    ["2024-12-31T20:59:00Z", "2024-12-31", "2025-01-13"],
  ]) {
    let samples = 0;
    const s = new ReadMyShifts(new MyShiftsFixtureReader(sampleMyShiftsFixture), myShiftsAccessPolicy(sampleConfig),
      { now: () => { samples++; return new Date(instant); } }, "Asia/Jerusalem", "isolated-fixture");
    assert.deepEqual((await s.context(principal, { mode: "self" })).defaults, { dateFrom: from, dateTo: to });
    assert.equal(samples, 1);
  }
});
test("MY18-05 any change suppresses baseline; changed own keys/type/start/cancellation control membership", async () => {
  const base = sampleMyShiftsFixture.days[0];
  for (const delta of [{ changedEmployeeKey: null }, { changedDayType: null }, { changedStartLocal: null },
    { cancellationReason: "1" }, { changedEmployeeKey: "TEST0002" }]) {
    const data = { ...sampleMyShiftsFixture, days: [{ ...base, hasChange: true, changedDayType: 4,
      changedEmployeeKey: "TEST0001", changedStartLocal: base.baselineStartLocal, ...delta }] };
    assert.equal((await fixtureService(data).list(principal, request)).items.length, 0);
  }
  const reassigned = { ...sampleMyShiftsFixture, days: [{ ...base, hasChange: true, changedDayType: 4,
    changedEmployeeKey: "TEST0002", changedStartLocal: base.baselineStartLocal }] };
  const list = await fixtureService(reassigned).list(principal, { ...request, employeeId: "1001" });
  assert.equal(list.items[0].employee.employeeId, "1001");
  // Not an active employee filter, attendance/missing reason or cancel-login condition.
});
test("MY18-06 effective fallback, detail coherence, orphan and reversed end errors", async () => {
  const base = sampleMyShiftsFixture.days[0];
  const changed = { ...base, hasChange: true, changedDayType: 4, changedEmployeeKey: "TEST0001",
    changedStartLocal: "2024-02-29T23:05:37", changedEndLocal: null, changedActivityData: null };
  const data = { ...sampleMyShiftsFixture, days: [changed] };
  const list = await fixtureService(data).list(principal, request);
  const detail = await readEmployeeShiftDay(principal, actorId, "1", new FixtureReader([{
    ...sampleMyShiftsDetailRows[0], changedStartLocal: changed.changedStartLocal,
  }]), "Asia/Jerusalem");
  assert.equal(list.items[0].startLocal, detail.effectiveShift.startLocal);
  assert.equal(list.items[0].endLocal, detail.effectiveShift.endLocal);
  assert.equal(list.items[0].activities[0].code, "A");
  for (const delta of [{ baselinePresent: false }, { changedEndLocal: "2024-02-29T22:00:00" }])
    await assert.rejects(fixtureService({ ...data, days: [{ ...changed, ...delta }] }).list(principal, request),
      { code: "INVALID_SOURCE_DATA" });
});
test("MY18-07 anomalous legacy attendance key cannot affect schedule; duplicates off-page fail", async () => {
  const data = { ...sampleMyShiftsFixture, attendance: [
    { shiftDayId: "1", missingReason: "7", stationArrivalLocal: null },
    { shiftDayId: "1", missingReason: null, stationArrivalLocal: null },
    { shiftDayId: "1001", missingReason: null, stationArrivalLocal: null },
  ] };
  const before = JSON.stringify(data);
  assert.deepEqual((await fixtureService(data).list(principal, request)).items,
    (await service.list(principal, request)).items);
  assert.equal(JSON.stringify(data), before);
  for (const duplicate of [
    { ...data, days: [...data.days, data.days[0]] },
    { ...data, employees: [...data.employees, { ...data.employees[0], employeeId: "2" }] },
  ])
    await assert.rejects(fixtureService(duplicate).list(principal, { ...request, offset: 10000 }),
      { code: "AMBIGUOUS_MY_SHIFTS" });
});
test("MY18-04/09 boundary seconds, stable numeric day order, empty page and capped lookahead", async () => {
  const base = sampleMyShiftsFixture.days[0];
  const data = { ...sampleMyShiftsFixture, days: [
    ...["10", "2"].map(id => ({ ...base, shiftDayId: id, baselineStartLocal: "2024-02-29T00:00:00",
      baselineEndLocal: null })),
    { ...base, shiftDayId: "3", baselineStartLocal: "2024-03-01T23:59:59", baselineEndLocal: null },
    { ...base, shiftDayId: "4", baselineStartLocal: "2024-03-02T00:00:00", baselineEndLocal: null },
  ] };
  assert.deepEqual((await fixtureService(data).list(principal, request)).items.map(r => r.shiftDayId), ["2", "10", "3"]);
  assert.equal((await fixtureService(data).list(principal, { ...request, offset: 10000 })).items.length, 0);
  const seed = (await service.list(principal, request)).items[0];
  const capped = new ReadMyShifts({ readEmployeeContext: async () => seed.employee,
    readRows: async () => [{ ...seed, shiftDayId: "1" }, { ...seed, shiftDayId: "2" }] },
  myShiftsAccessPolicy(sampleConfig), { now: () => new Date() }, "Asia/Jerusalem", "isolated-fixture");
  const page = (await capped.list(principal, { ...request, offset: 10000, limit: 1 })).page;
  assert.equal(page.hasMore, true); assert.equal(page.nextOffset, null);
});
test("MY18-08/10 port corruption, excess lookahead and employee mismatch never serialize partial success", async () => {
  const seed = (await service.list(principal, request)).items[0];
  for (const rows of [[{ ...seed, employee: { ...seed.employee, employeeId: "1001" } }],
    [{ ...seed, endLocal: "2020-01-01T00:00:00" }], [{ ...seed, activities: Array(101).fill({ code: "A", label: null }) }],
    Array(3).fill(seed)]) {
    const s = new ReadMyShifts({ readEmployeeContext: async () => seed.employee, readRows: async () => rows },
      myShiftsAccessPolicy(sampleConfig), { now: () => new Date() }, "Asia/Jerusalem", "isolated-fixture");
    await assert.rejects(s.list(principal, { ...request, limit: 1 }), { code: "INVALID_SOURCE_DATA" });
  }
});
test("MY18-07 source characterization uses synthetic anomalous attendance and day-start-desc only", async () => {
  // Characterization of the source expressions, not execution of legacy Java/SQL.
  const key = "10010001", base = sampleMyShiftsFixture.days[0];
  const d = { ...base, hasChange: true, changedEmployeeKey: key, changedDayType: 4,
    changedStartLocal: "2024-02-29T23:00:17" };
  const attendance = [{ shiftDayId: key, missingReason: null, stationArrivalLocal: null },
    { shiftDayId: key, missingReason: null, stationArrivalLocal: null }];
  assert.equal(attendance.filter(a => a.shiftDayId === d.changedEmployeeKey).length, 2);
  assert.equal(attendance.filter(a => a.shiftDayId === d.shiftDayId).length, 0);
  const source = { ...sampleMyShiftsFixture, employees: [{
    ...sampleMyShiftsFixture.employees[0], employeeNumber: key + "-synthetic",
  }], days: [d], attendance };
  assert.equal((await fixtureService(source).list(principal, request)).items.length, 1);
  const positional = [
    { shiftDayId: "1", dayStart: "2024-02-29T01:00:00", start: "2024-02-29T23:00:00" },
    { shiftDayId: "2", dayStart: "2024-02-29T02:00:00", start: "2024-02-29T20:00:00" },
    { shiftDayId: "3", dayStart: "2024-02-29T03:00:00", start: "2024-02-29T22:00:00" },
  ];
  const legacy = [...positional].sort((a, b) => b.dayStart.localeCompare(a.dayStart)).map(r => r.shiftDayId);
  const target = [...positional].sort((a, b) => a.start.localeCompare(b.start)).map(r => r.shiftDayId);
  assert.deepEqual(legacy, ["3", "2", "1"]); assert.deepEqual(target, ["2", "3", "1"]);
});
test("MY18-10 fixture operation resolves actor exactly once and independently revalidates each request", async () => {
  const reader = new MyShiftsFixtureReader(sampleMyShiftsFixture);
  const readActor = reader.readEmployeeContext.bind(reader);
  let calls = 0;
  reader.readEmployeeContext = async (...args) => { calls++; return readActor(...args); };
  const s = new ReadMyShifts(reader, myShiftsAccessPolicy(sampleConfig),
    { now: () => new Date() }, "Asia/Jerusalem", "isolated-fixture");
  await s.context(principal, { mode: "selected", employeeId: actorId }); assert.equal(calls, 1);
  await s.list(principal, request); assert.equal(calls, 2);
  await s.list(principal, { ...request, offset: 1 }); assert.equal(calls, 3);
});
test("MY18-02 selected exact actor, precision, null end, unknown activities", async () => {
  const result = await service.list(principal, { mode: "selected", employeeId: "9007199254740993",
    dateFrom: "2024-02-29", dateTo: "2024-03-01", limit: 1 });
  assert.equal(result.items[0].startLocal, "2024-02-29T23:00:17");
  assert.equal(result.items[0].endLocal, "2024-03-01T02:00:19");
  assert.deepEqual(result.items[0].activities.map(a => a.code), ["A", "UNRESOLVED", "A"]);
  assert.equal(result.page.hasMore, true); assert.equal(result.page.nextOffset, 1);
  const last = await service.list(principal, { mode: "selected", employeeId: "9007199254740993",
    dateFrom: "2024-02-29", dateTo: "2024-03-01", offset: 1 });
  assert.equal(last.items[0].endLocal, null);
  await assert.rejects(service.context(principal, { mode: "selected", employeeId: "9" }), { code: "FORBIDDEN" });
});
test("MY18-03 strict civil 31/32 dates, equal, leap, year cap and forbidden keys", () => {
  const parse = (q: string) => parseMyShiftsQuery(new URLSearchParams(q), true);
  const base = "mode=self&dateFrom=2024-02-01&dateTo=";
  assert.equal(parse(base + "2024-03-02").dateTo, "2024-03-02");
  assert.throws(() => parse(base + "2024-03-03"), { code: "INVALID_REQUEST" });
  assert.throws(() => parse("mode=self&dateFrom=2023-02-29&dateTo=2023-02-29"));
  assert.equal(parse("mode=self&dateFrom=0001-01-01&dateTo=0001-01-01").dateFrom, "0001-01-01");
  assert.equal(addCivilDates("9999-12-28", 13), "9999-12-31");
  for (const query of ["mode=self", base + "2024-02-01&employeeId=1",
    base + "2024-02-01&mode=self", base + "2024-02-01&limit=01"])
    assert.throws(() => parse(query), { code: "INVALID_REQUEST" });
});
