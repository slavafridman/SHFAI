import { test } from "node:test";
import assert from "node:assert/strict";
import { CurrentFixtureReader } from "../current-shifts-fixture.mts";
import { ReadCurrentShifts } from "../read-current-shifts.mts";
import { data, day, principal, at } from "./current-fixtures.mts";
import { parseCurrentQuery, validateCurrentRequest } from "../current-shifts-validation.mts";
import { clockMinute } from "../read-current-shifts.mts";
import { currentProblem } from "../current-shifts-errors.mts";
import type { CurrentShiftReadPort, CurrentShiftRowV1 } from "../current-shifts-contracts.mts";
import { readEmployeeShiftDay } from "../read-employee-shift-day.mts";
import { FixtureReader } from "../fixture-reader.mts";

const service = (fixture = data(), zone = "UTC") =>
  new ReadCurrentShifts(new CurrentFixtureReader(fixture), { now: () => new Date("2024-03-01T00:00:59Z") }, zone);
const query = (s: string) => parseCurrentQuery(new URLSearchParams(s));

test("NEXT01-04/05 focused: overnight interval and exact teams, not parent siblings", async () => {
  const fixture = data([day(), day({ shiftDayId: "2", employeeKey: "TEST0002" })]);
  const before = JSON.stringify(fixture);
  const reader = new CurrentFixtureReader(fixture, ["T01"]);
  const service = new ReadCurrentShifts(reader, { now: () => new Date("2024-03-01T00:00:59Z") }, "UTC");
  const context = await service.context(principal());
  assert.deepEqual(context.mokedOptions.map(p => p.code), ["01"]);
  const result = await service.list(principal(), { ...at, mokedCode: "01" });
  assert.deepEqual(result.items.map(r => r.shiftDayId), ["1"]);
  assert.equal(result.items[0].endLocal, "2024-03-01T02:00:19");
  assert.equal(result.items[0].employee.unit.code, "T01");
  await assert.rejects(service.list(principal(), { ...at, mokedCode: "T01" }), { code: "FORBIDDEN" });
  assert.equal(JSON.stringify(fixture), before);
});

test("NEXT01-01/02: exact calendar, minute, mode and query grammar", () => {
  for (const date of ["0001-01-01", "9999-12-31", "2000-02-29", "2024-02-29"])
    for (const time of ["00:00", "23:59"])
      assert.equal(query(`mode=at&attendanceDate=${date}&currentTime=${time}`).mode, "at");
  for (const date of ["", "0000-01-01", "1900-02-29", "2024-02-30", "2024-13-01",
    "2024-00-01", "2024-01-00", "29/02/2024", "1001", "2024-01-01T00:00:00", " 2024-01-01"])
    assert.throws(() => query(`mode=at&attendanceDate=${encodeURIComponent(date)}&currentTime=00:00`), { code: "INVALID_REQUEST" });
  for (const time of ["", "24:00", "9:05", "00:60", "00:00:00", "00:00Z", "1e2", " 00:00", "00:00+03:00"])
    assert.throws(() => query(`mode=at&attendanceDate=2024-01-01&currentTime=${encodeURIComponent(time)}`), { code: "INVALID_REQUEST" });
  for (const raw of ["", "mode=at", "mode=AT", "mode=current&attendanceDate=2024-01-01",
    "mode=current&currentTime=00:00", "mode=current&offset=1", "mode=current&mode=at",
    "mode=current&unit=T01", "mode=current&mokedCode=-1", "mode=current&mokedCode=null",
    "mode=current&mokedCode=", "mode=current&mokedCode=%2001", "mode=current&sort=name",
    "mode=current&limit=0", "mode=current&limit=101", "mode=current&limit=01", "mode=current&limit=1.0",
    "mode=current&limit=1e2", "mode=current&offset=-1", "mode=current&offset=10001", "mode=current&offset=00",
    "mode=current&mode[]=current", "mode=current&limit=+1", "mode=current&sort="])
    assert.throws(() => query(raw), { code: "INVALID_REQUEST" });
  assert.deepEqual(query("mode=current"), { mode: "current", limit: 25, offset: 0, sort: "effective-start-asc" });
  for (const raw of [null, [], { ...at, limit: "1" }, { ...at, mokedCode: null },
    { ...at, offset: NaN }, { ...at, sort: {} }, { ...at, employeeId: "1" }])
    assert.throws(() => validateCurrentRequest(raw), { code: "INVALID_REQUEST" });
});

test("NEXT01-03: one clock sample, legacy minute 10/11, civil rollover, DST and years", async () => {
  for (const [instant, zone, round, date, time] of [
    ["2024-02-29T23:10:59Z", "UTC", true, "2024-02-29", "23:00"],
    ["2024-02-29T23:11:00Z", "UTC", true, "2024-03-01", "00:00"],
    ["2024-12-31T23:59:59Z", "UTC", true, "2025-01-01", "00:00"],
    ["2024-03-01T08:11:59Z", "UTC", false, "2024-03-01", "08:11"],
    ["2024-03-29T00:30:59Z", "Asia/Jerusalem", false, "2024-03-29", "03:30"],
    ["2024-03-28T23:11:59Z", "Asia/Jerusalem", true, "2024-03-29", "03:00"],
    ["2024-10-26T22:11:59Z", "Asia/Jerusalem", true, "2024-10-27", "01:00"],
    ["2024-10-26T22:30:59Z", "Asia/Jerusalem", false, "2024-10-27", "01:30"],
    ["2024-10-26T23:30:59Z", "Asia/Jerusalem", false, "2024-10-27", "01:30"],
    ["0001-01-01T00:00:00Z", "UTC", false, "0001-01-01", "00:00"],
  ] as const) {
    let calls = 0;
    const result = clockMinute({ now: () => { calls++; return new Date(instant); } }, zone, round);
    assert.equal(calls, 1);
    assert.deepEqual(result, { attendanceDate: date, currentTime: time });
  }
  assert.throws(() => clockMinute({ now: () => new Date(NaN) }, "UTC", false), { code: "INVALID_SOURCE_DATA" });
  assert.throws(() => clockMinute({ now: () => new Date("9999-12-31T23:11:00Z") }, "UTC", true), { code: "INVALID_SOURCE_DATA" });
  // Manual DST gap/overlap is a civil filter, never repaired into an instant.
  assert.equal(query("mode=at&attendanceDate=2024-03-29&currentTime=02:30").currentTime, "02:30");
  let calls = 0;
  const app = new ReadCurrentShifts(new CurrentFixtureReader(data()), {
    now: () => { calls++; return new Date("2024-03-01T00:00:59Z"); },
  }, "UTC");
  const list = await app.list(principal(), { mode: "current", limit: 1 });
  assert.equal(calls, 1);
  assert.equal(list.applied.currentTime, "00:00");
  await app.list(principal(), { ...at, offset: 1 });
  assert.equal(calls, 1);
  await app.context(principal());
  assert.equal(calls, 2);
});

test("NEXT01-04: inclusive start/exclusive end, changed employee and day type, null intervals", async () => {
  const fixture = data([
    day({ shiftDayId: "1", baselineStartLocal: "2024-03-01T00:00:00", baselineEndLocal: "2024-03-01T01:00:00" }),
    day({ shiftDayId: "2", baselineEndLocal: "2024-03-01T00:00:00" }),
    day({ shiftDayId: "3", cancellationReason: "0" }),
    day({ shiftDayId: "4", changedDayType: 3 }),
    day({ shiftDayId: "5", baselineDayType: 3, changedDayType: 4 }),
    day({ shiftDayId: "6", changedStartLocal: "2024-03-01T00:00:01" }),
    day({ shiftDayId: "7", baselineStartLocal: null }),
    day({ shiftDayId: "8", employeeKey: "UNKNOWN1" }),
    day({ shiftDayId: "9", employeeKey: "TEST0002", changedEmployeeKey: "TEST0001" }),
    day({ shiftDayId: "10", changedEmployeeKey: "TEST0002" }),
    day({ shiftDayId: "11", changedEndLocal: "2024-03-01T00:00:00" }),
  ]);
  assert.deepEqual((await service(fixture).list(principal(), at)).items.map(r => r.shiftDayId), ["5", "9", "1"]);
});

test("NEXT01-05/09: all authorized union, exact leading-zero parents, no units and empty pages", async () => {
  const app = service(data([day(), day({ shiftDayId: "2", employeeKey: "TEST0002" }),
    day({ shiftDayId: "3", employeeKey: "TEST0003" })]));
  const p = principal({ resourceScope: { orgUnitIds: ["T01", "T03"] } });
  assert.deepEqual((await app.context(p)).mokedOptions.map(o => o.code), ["01", "02"]);
  assert.equal((await app.context(p)).defaults.mokedCode, null);
  assert.deepEqual((await app.list(p, at)).items.map(r => r.shiftDayId), ["1", "3"]);
  assert.deepEqual((await app.list(p, { ...at, mokedCode: "02" })).items.map(r => r.shiftDayId), ["3"]);
  for (const code of ["03", "T02", "1"])
    await assert.rejects(app.list(p, { ...at, mokedCode: code }), { code: "FORBIDDEN" });
  const empty = principal({ resourceScope: { orgUnitIds: [] } });
  assert.deepEqual((await app.context(empty)).mokedOptions, []);
  assert.deepEqual((await app.list(empty, at)).items, []);
  assert.deepEqual((await app.list(p, { ...at, offset: 9999 })).page,
    { limit: 25, offset: 9999, hasMore: false, nextOffset: null });
  await assert.rejects(app.list(empty, { ...at, mokedCode: "01" }), { code: "FORBIDDEN" });
});

test("NEXT01-06: capabilities centrally enforced before catalog/read, list does not grant detail", async () => {
  let calls = 0;
  const reader: CurrentShiftReadPort = {
    async readMokedOptions() { calls++; return []; }, async readRows() { calls++; return []; },
  };
  const app = new ReadCurrentShifts(reader, { now: () => new Date() }, "UTC");
  const p = principal({ capabilities: ["shift-day:read"] });
  await assert.rejects(app.context(p), { code: "FORBIDDEN" });
  await assert.rejects(app.list(p, at), { code: "FORBIDDEN" });
  assert.equal(calls, 0);
  await assert.rejects(readEmployeeShiftDay(principal({ capabilities: ["current-shifts:read"] }),
    "1", "1", new FixtureReader([]), "UTC"), { code: "FORBIDDEN" });
});

test("NEXT01-07: fixture hierarchy/labels/fields fail closed without truncation or guessed catalog", () => {
  const f = data();
  for (const candidate of [
    null, {}, { ...f, catalog: { ...f.catalog, mokedUnits: [...f.catalog.mokedUnits, f.catalog.mokedUnits[0]] } },
    { ...f, catalog: { ...f.catalog, mokedUnits: [{ code: "01", label: "<b>HTML</b>", unitType: "G01" }] } },
    { ...f, catalog: { ...f.catalog, teams: [{ ...f.catalog.teams[0], parentMokedCode: "unknown" }] } },
    { ...f, catalog: { ...f.catalog, teams: [{ ...f.catalog.teams[0], unitType: "G01" }] } },
    { ...f, catalog: { ...f.catalog, mokedUnits: Array.from({ length: 101 }, (_, i) =>
      ({ code: String(i), label: "Synthetic", unitType: "G01" })) } },
    { ...f, employees: [{ ...f.employees[0], teamCode: "missing" }] },
    { ...f, employees: [{ ...f.employees[0], employeeId: "9007199254740993.0" }] },
    { ...f, employees: [{ ...f.employees[0], firstName: "א".repeat(41) }] },
    { ...f, activities: [{ code: "A", label: "" }] },
    { ...f, activities: [{ code: "A", label: "x".repeat(257) }] },
    { ...f, days: [day({ baselineActivityData: Array(101).fill("A").join(";") })] },
    { ...f, days: [day({ baselineActivityData: "x".repeat(129) })] },
    { ...f, days: [day({ baselineStartLocal: "2024-02-30T00:00:00" })] },
    { ...f, attendance: [{ shiftDayId: "1", missingReason: "-1", stationArrivalLocal: null }] },
    { ...f, attendance: [{ shiftDayId: "1", missingReason: "1.0", stationArrivalLocal: null }] },
  ]) assert.throws(() => new CurrentFixtureReader(candidate), { code: "INVALID_SOURCE_DATA" });
  for (const ids of [["01"], ["missing"], ["T01", "T01"]])
    assert.throws(() => new CurrentFixtureReader(f, ids), { code: "INVALID_SOURCE_DATA" });
});

test("NEXT01-08: stable numeric sort, page boundaries, lookahead and offset ceiling", async () => {
  const app = service(data([day({ shiftDayId: "10" }), day({ shiftDayId: "2" }), day({ shiftDayId: "1" })]));
  assert.deepEqual((await app.list(principal(), { ...at, limit: 2 })).items.map(r => r.shiftDayId), ["1", "2"]);
  assert.deepEqual((await app.list(principal(), { ...at, limit: 2 })).page,
    { limit: 2, offset: 0, hasMore: true, nextOffset: 2 });
  assert.deepEqual((await app.list(principal(), { ...at, limit: 2, offset: 2 })).items.map(r => r.shiftDayId), ["10"]);
  const many = service(data(Array.from({ length: 10102 }, (_, i) => day({ shiftDayId: String(i + 1) }))));
  assert.deepEqual((await many.list(principal(), { ...at, limit: 100, offset: 10000 })).page,
    { limit: 100, offset: 10000, hasMore: true, nextOffset: null });
  assert.equal((await many.list(principal(), { ...at, limit: 1, offset: 9999 })).page.nextOffset, 10000);
});

test("NEXT01-08/09: joined duplicate days/employees/attendance ambiguous before paging, sanitized", async () => {
  const fixtures = [
    data([day(), day()]),
    { ...data(), employees: [...data().employees,
      { ...data().employees[0], employeeId: "9007199254740999" }] },
    { ...data(), attendance: [
      { shiftDayId: "1", missingReason: null, stationArrivalLocal: null },
      { shiftDayId: "1", missingReason: "0", stationArrivalLocal: null }] },
  ];
  for (const fixture of fixtures) {
    try { await service(fixture).list(principal(), { ...at, offset: 9999 }); assert.fail("must reject"); }
    catch (e) {
      const problem = currentProblem(e, "test-correlation");
      assert.equal(problem.code, "AMBIGUOUS_CURRENT_SHIFT");
      assert.equal(problem.status, 500);
      assert.ok(!JSON.stringify(problem).includes("900719925"));
    }
  }
});

test("NEXT01-10: NVL overlays, original seconds, attendance priority, unknown labels and home null", async () => {
  for (const [home, expected] of [[null, null], ["Y", true], ["y", true], ["n", false], ["", false]] as const) {
    const result = await service(data([day({ changedHome: home })])).list(principal(), at);
    assert.equal(result.items[0].workingFromHome, expected);
    assert.deepEqual(result.items[0].activities, [
      { code: "A", label: "Synthetic activity" }, { code: "UNKNOWN", label: null },
      { code: "A", label: "Synthetic activity" }]);
    assert.equal(result.items[0].innerJob, null);
    assert.deepEqual(result.items[0].attendanceDisplay, { kind: "not-recorded" });
  }
  for (const reason of ["1", "0", null]) {
    const f = { ...data([day({ baselineHome: "y", changedHome: "n", changedActivityData: "NEW;;NEW" })]),
      attendance: [{ shiftDayId: "1", missingReason: reason, stationArrivalLocal: "2024-03-01T00:00:37" }] };
    const r = (await service(f).list(principal(), at)).items[0];
    assert.equal(r.workingFromHome, false);
    assert.deepEqual(r.activities, [{ code: "NEW", label: null }, { code: "NEW", label: null }]);
    assert.deepEqual(r.attendanceDisplay, reason === "1"
      ? { kind: "missing-reason", reason: { code: "1", label: null } }
      : { kind: "station-arrival", atLocal: "2024-03-01T00:00:37" });
  }
  const r = (await service(data([day({ changedEmployeeKey: "TEST0002" })])).list(
    principal({ resourceScope: { orgUnitIds: ["T02"] } }), at)).items[0];
  assert.equal(r.employee.employeeId, "9007199254740994");
  assert.equal(r.employee.firstName, "Synthetic");
  assert.deepEqual(r.innerJob, { code: "J", label: null });
});

test("NEXT01-09/10: typed read port is runtime checked, cannot leak extra fields or scope", async () => {
  const original = (await service().list(principal(), at)).items[0];
  const option = original.employee.unit.moked;
  const corrupted: CurrentShiftRowV1[] = [
    { ...original, employee: { ...original.employee, employeeId: "01" } },
    { ...original, activities: [{ code: "A", label: "<script>" }] },
    { ...original, attendanceDisplay: { kind: "missing-reason", reason: { code: "-1", label: null } } },
    { ...original, startLocal: "2024-03-01T01:00:00" },
    { ...original, employee: { ...original.employee, unit: { ...original.employee.unit, code: "T02" } } },
    { ...original, employee: { ...original.employee, unit: { ...original.employee.unit,
      moked: { ...option, label: "Invented label" } } } },
  ];
  for (const row of corrupted) {
    const port: CurrentShiftReadPort = { async readMokedOptions() { return [option]; }, async readRows() { return [row]; } };
    await assert.rejects(new ReadCurrentShifts(port, { now: () => new Date() }, "UTC").list(principal(), at),
      { code: "INVALID_SOURCE_DATA" });
  }
  const port: CurrentShiftReadPort = { async readMokedOptions() { return [option]; },
    async readRows() { return [{ ...original, secret: "not-wire-data" }]; } };
  const wire = await new ReadCurrentShifts(port, { now: () => new Date() }, "UTC").list(principal(), at);
  assert.ok(!JSON.stringify(wire).includes("not-wire-data"));
});

test("NEXT01-11/13: concurrent repeated reads are pure, independent DTOs and stable detail identity", async () => {
  const f = data();
  const before = JSON.stringify(f);
  const app = service(f);
  const results = await Promise.all(Array.from({ length: 12 }, () => app.list(principal(), at)));
  for (const result of results) assert.deepEqual(result, results[0]);
  results[0].items[0].activities[0].label = "edited-client-copy";
  assert.equal((await app.list(principal(), at)).items[0].activities[0].label, "Synthetic activity");
  assert.equal(JSON.stringify(f), before);
  const r = results[1].items[0];
  assert.equal(r.shiftDayId, "1");
  assert.equal(r.employee.employeeId, "9007199254740993");
  // Link identifiers come from the row, not the null employee of the actor.
  assert.equal(principal().employeeId, null);
});

test("NEXT01-08 / §22.4: reassignment does not conceal old-employee join multiplicity", async () => {
  const f = data([day({ employeeKey: "TEST0002", changedEmployeeKey: "TEST0001" })]);
  const duplicateOld = { ...f, employees: [...f.employees,
    { ...f.employees[1], employeeId: "9007199254740999", teamCode: "T03" }] };
  await assert.rejects(service(duplicateOld).list(principal(), { ...at, offset: 10000 }),
    { code: "AMBIGUOUS_CURRENT_SHIFT" });
});

test("NEXT01-04/10: fixture prefix join counts Unicode characters like Oracle SUBSTR", async () => {
  const f = data([day({ employeeKey: "😀TEST001" })]);
  const fixture = { ...f, employees: [
    { ...f.employees[0], employeeNumber: "😀TEST001-extra" },
  ] };
  assert.equal((await service(fixture).list(principal(), at)).items.length, 1);
});
