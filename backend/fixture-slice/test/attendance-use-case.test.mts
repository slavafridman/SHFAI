import test from "node:test";
import assert from "node:assert/strict";
import { sampleConfig, sampleAttendanceFixture } from "../attendance-sample.mts";
import { AttendanceFixtureReader } from "../attendance-fixture.mts";
import { ReadAttendance, attendanceDefaults } from "../read-attendance.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import type { PrincipalV1 } from "../contracts.mts";
import { accessPolicy } from "../access-policy.mts";
import { validatePrincipal } from "../contract-validation.mts";
import { attendanceRow } from "../attendance-projection.mts";
import { attendanceProblem } from "../attendance-errors.mts";

const mock = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const real = (changes: Partial<PrincipalV1> = {}): PrincipalV1 => ({
  ...mock, subject: "isolated:test", provider: "real", synthetic: false, roles: [],
  capabilities: ["attendance:read"], employeeId: null, ...changes,
});
const request = { attendanceDate: "2026-10-19", timeFrom: "10:00", timeTo: "10:00" };
const clock = { now: () => new Date("2026-10-19T20:11:59Z") };
const app = (data = structuredClone(sampleAttendanceFixture)) =>
  new ReadAttendance(new AttendanceFixtureReader(data), clock, "Asia/Jerusalem", "isolated-fixture");
test("AT19-01 seven capabilities, synthetic actor never selected employee, attendance-only real team inquiry", async () => {
  assert.equal(mock.capabilities.length, 7); assert.equal(mock.employeeId, null); validatePrincipal(mock);
  for (const cap of mock.capabilities) accessPolicy.requireCapability(mock, cap);
  assert.equal((await app().list(real(), request)).items.length, 2);
  for (const cap of mock.capabilities.filter(c => c !== "attendance:read"))
    assert.throws(() => accessPolicy.requireCapability(real(), cap), { code: "FORBIDDEN" });
  let calls = 0;
  const reader = { dataSource: "isolated-fixture" as const, async readContext() { calls++; throw Error(); },
    async read() { calls++; return []; } };
  const use = new ReadAttendance(reader, clock, "Asia/Jerusalem", "isolated-fixture");
  for (const claims of [real({ capabilities: mock.capabilities.filter(c => c !== "attendance:read") }),
    real({ roles: ["Administrator"], capabilities: [] })]) {
    await assert.rejects(use.list(claims, request), { code: "FORBIDDEN" });
    await assert.rejects(use.context(claims), { code: "FORBIDDEN" });
  }
  await assert.rejects(use.list({ ...mock, employeeId: "1" }, request), { code: "UNAUTHENTICATED" });
  await assert.rejects(use.list(real({ capabilities: [] }), { ...request, timeTo: "09:59" }), { code: "INVALID_REQUEST" });
  assert.equal(calls, 0);
});
test("AT19-02 exact scope and generic forbidden filters, original grants role eligibility", async () => {
  for (const change of [{ mokedCode: "private" }, { teamCodes: ["T02"] }, { innerJobCodes: ["999"] }])
    await assert.rejects(app().list(real(), { ...request, ...change }), { code: "FORBIDDEN" });
  assert.equal((await app().list(real({ resourceScope: { orgUnitIds: [] } }), request)).items.length, 0);
  const c = await app().context(real({ resourceScope: { orgUnitIds: [] } }));
  assert.equal(c.teamOptions.length, 0); assert.equal(c.innerJobOptions.length, 0); assert.equal(c.workLocationOptions.length, 2);
  await assert.rejects(app().context(real({ resourceScope: { orgUnitIds: ["T0"] } })), { code: "INVALID_SOURCE_DATA" });
  const d = structuredClone(sampleAttendanceFixture);
  d.catalog = { mokedUnits: [...d.catalog.mokedUnits, { code: "02", label: "מוקד אחר", unitType: "G01" }],
    teams: [...d.catalog.teams, { code: "T02", label: "צוות אחר", unitType: "J01", parentMokedCode: "02" }] };
  d.innerJobs = [{ code: "101", label: "פנימי", active: 1, orgUnitId: "T02" }];
  const p = real({ resourceScope: { orgUnitIds: ["T01", "T02"] } });
  assert.equal((await app(d).list(p, { ...request, mokedCode: "01", innerJobCodes: ["101"] })).items.length, 2);
  await assert.rejects(app(d).list(p, { ...request, mokedCode: "01", teamCodes: ["T02"] }), { code: "FORBIDDEN" });
});
test("AT19-04 configured-zone one sample midnight, threshold, DST and year clamp", async () => {
  let calls = 0;
  const c = await new ReadAttendance(new AttendanceFixtureReader(sampleAttendanceFixture),
    { now() { calls++; return clock.now(); } }, "Asia/Jerusalem", "isolated-fixture").context(mock);
  assert.equal(calls, 1); assert.equal(c.defaults.attendanceDate, "2026-10-20"); assert.equal(c.defaults.timeFrom, "00:00");
  const at = (s: string, zone = "UTC") => attendanceDefaults({ now: () => new Date(s) }, zone);
  assert.deepEqual(at("2024-02-29T23:10:59Z"), { attendanceDate: "2024-02-29", currentTime: "23:00" });
  assert.deepEqual(at("2024-02-29T23:11:00Z"), { attendanceDate: "2024-03-01", currentTime: "00:00" });
  assert.deepEqual(at("2024-03-10T06:11:00Z", "America/New_York"), { attendanceDate: "2024-03-10", currentTime: "03:00" });
  assert.deepEqual(at("9999-12-31T23:11:00Z"), { attendanceDate: "9999-12-31", currentTime: "23:00" });
  assert.throws(() => attendanceDefaults({ now: () => new Date(NaN) }, "UTC"), { code: "INVALID_SOURCE_DATA" });
});
test("AT19-05 branch-owned start OR split seconds, cancellation-null, no changed NVL membership rescue", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.days = [{ ...d.days[0], baselineStartLocal: "2026-10-19T10:00:30", baselineSplitEndLocal: null }];
  assert.equal((await app(d).list(mock, request)).items.length, 0);
  d.days = [{ ...d.days[0], baselineStartLocal: null, baselineSplitEndLocal: "2026-10-19T10:00:00" }];
  assert.equal((await app(d).list(mock, request)).items[0].planned.startLocal, null);
  for (const cancellationReason of [null, "0", "-1"]) {
    d.days = [{ ...d.days[0], hasChange: true, changedEmployeeKey: "TEST0001", changedDayType: 4,
      changedSplitEndLocal: "2026-10-19T10:00:00", cancellationReason }];
    assert.equal((await app(d).list(mock, request)).items.length, cancellationReason === null ? 1 : 0);
  }
  d.days = [{ ...d.days[0], cancellationReason: null, changedDayType: null }];
  assert.equal((await app(d).list(mock, request)).items.length, 0);
});
test("AT19-05 raw location membership differs from effective display; no active/missing exclusion", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.days = [{ ...d.days[0], hasChange: true, changedEmployeeKey: "TEST0001", changedDayType: 4,
    changedSplitEndLocal: "2026-10-19T10:00:00", changedStartLocal: null, changedHome: null }];
  assert.equal((await app(d).list(mock, request)).items[0].planned.workingFromHome, true);
  assert.equal((await app(d).list(mock, { ...request, workLocations: ["home","site"] })).items.length, 0);
  d.days = [{ ...d.days[0], changedHome: "N" }];
  assert.equal((await app(d).list(mock, { ...request, workLocations: ["site"] })).items.length, 1);
});
test("AT19-06/07 independent actual fields, raw reason 0/negative/null and strict briefing/planned source", async () => {
  for (const reason of [null, "0", "-1", "9".repeat(38)]) {
    const d = structuredClone(sampleAttendanceFixture);
    d.attendance = [{ shiftDayId: "19001", stageArrivalLocal: null, stationArrivalLocal: null,
      stationExitLocal: "2026-10-20T23:59:59", missingReasonCode: reason, briefingCode: null }];
    const row = (await app(d).list(mock, request)).items.find(r => r.shiftDayId === "19001")!;
    assert.equal(row.attendance.missingReasonCode, reason); assert.equal(row.attendance.stationArrivalLocal, null);
    assert.equal(row.attendance.stationExitLocal, "2026-10-20T23:59:59");
    assert.equal(row.attendance.briefingRecorded, null);
    assert.deepEqual(Object.keys(row).sort(), ["attendance","employee","planned","shiftDayId"]);
  }
  for (const change of [{ missingReasonCode: "1.5" }, { missingReasonCode: "-0" }, { briefingCode: "2" }]) {
    const d = structuredClone(sampleAttendanceFixture); d.attendance = [{ ...d.attendance[0], ...change }];
    await assert.rejects(app(d).list(mock, request), { code: "INVALID_SOURCE_DATA" });
  }
  const d = structuredClone(sampleAttendanceFixture);
  d.days = [{ ...d.days[0], baselineEndLocal: "2026-10-18T00:00:00" }];
  await assert.rejects(app(d).list(mock, request), { code: "INVALID_SOURCE_DATA" });
});
test("AT19-08 catalog fallback, duplicates, nullable unknown labels and null-last precise stable page", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.days = [{ ...d.days[0], baselineActivityData: ";;", exceptionCode: "3" }, { ...d.days[0], shiftDayId: "19003",
    baselineStartLocal: null, baselineSplitEndLocal: "2026-10-19T10:00:00" }];
  d.exceptions = [{ code: "3", label: "חריגה" }];
  const first = await app(d).list(mock, { ...request, limit: 1 });
  assert.equal(first.items[0].planned.activityFallback?.label, "חריגה");
  assert.equal(first.page.hasMore, true); assert.equal(first.page.nextOffset, 1);
  const next = await app(d).list(mock, { ...request, limit: 1, offset: 1 });
  assert.equal(next.items[0].planned.startLocal, null); assert.equal(next.page.hasMore, false);
  const empty = await app(d).list(mock, { ...request, offset: 10000 }); assert.equal(empty.items.length, 0);
  d.exceptions = [{ code: "3", label: "א" }, { code: "3", label: "א" }];
  await assert.rejects(app(d).list(mock, request), { code: "INVALID_SOURCE_DATA" });
});
test("AT19-09 ambiguity prefix employee/overlay/attendance before page even if sibling suppressed", async () => {
  for (const variant of ["employee", "day", "overlay", "attendance"]) {
    const d = structuredClone(sampleAttendanceFixture);
    if (variant === "employee") d.employees = [...d.employees, { ...d.employees[0], employeeId: "2", teamCode: "private" }];
    if (variant === "day") d.days = [...d.days, d.days[0]];
    if (variant === "overlay") d.days = [...d.days, { ...d.days[0], hasChange: true, changedDayType: 4,
      changedEmployeeKey: "TEST0001", changedStartLocal: "2026-10-19T10:00:00" },
      { ...d.days[0], hasChange: true, changedDayType: 3 }];
    if (variant === "attendance") d.attendance = [...d.attendance, d.attendance[0]];
    await assert.rejects(app(d).list(mock, { ...request, offset: 10000 }), { code: "AMBIGUOUS_ATTENDANCE" });
  }
});
test("AT19-11 projection refuses invalid rows and errors do not leak arbitrary source properties", async () => {
  const rows = (await app().list(mock, request)).items;
  const extended = { ...rows[0], secret: "private", attendance: { ...rows[0].attendance, user: "private" } };
  const reader = { dataSource: "isolated-fixture" as const, async readContext() { throw Error(); }, async read() { return [extended]; } };
  const result = await new ReadAttendance(reader, clock, "UTC", "isolated-fixture").list(mock, request);
  assert.equal(JSON.stringify(result).includes("private"), false);
  assert.equal(attendanceRow({ ...rows[0], shiftDayId: null }), false);
  assert.equal(JSON.stringify(attendanceProblem(new Error("private SQL"), "opaque")).includes("private"), false);
  assert.throws(() => new ReadAttendance({ ...reader, dataSource: "oracle-read-only" }, clock, "UTC", "isolated-fixture"));
});
test("AT19-01 disabled/production/mixed mock configuration and provider errors never grant Administrator", async () => {
  for (const change of [{ syntheticAdministratorEnabled: false }, { deploymentClass: "production" },
    { deploymentClass: "invalid" }, { realProviderId: "not-installed" }])
    assert.throws(() => new SyntheticAdministratorProvider({ ...sampleConfig, ...change }));
  const config = { ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
    syntheticOrgUnitIds: undefined, realProviderId: "isolated-test-double" };
  await assert.rejects(createRuntime(config, new FixtureReader([])));
  const runtime = await createRuntime(config, new FixtureReader([]), async () => ({
    async authenticate() { throw Error("private provider failure"); },
  }));
  await assert.rejects(runtime.authenticate({ authorization: null }), { code: "DEPENDENCY_UNAVAILABLE" });
  const malformed = await createRuntime(config, new FixtureReader([]), async () => ({
    async authenticate() { return {} as never; },
  }));
  await assert.rejects(malformed.authenticate({ authorization: null }), { code: "UNAUTHENTICATED" });
});
test("AT19-05 any overlay suppresses baseline, removed old-employee join, orphan attendance never invented", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.days = [{ ...d.days[0], hasChange: true, employeeKey: "NOOLD001", changedEmployeeKey: "TEST0001",
    changedDayType: 4, changedStartLocal: "2026-10-19T10:00:00" }];
  assert.equal((await app(d).list(mock, request)).items.length, 1);
  d.days = [{ ...d.days[0], hasChange: false }, { ...d.days[0], changedDayType: 3 }];
  assert.equal((await app(d).list(mock, request)).items.length, 0);
  d.days = []; // recorded attendance has no qualifying scheduled day.
  assert.equal((await app(d).list(mock, request)).items.length, 0);
});
test("AT19-08 source whitespace/Oracle empty, raw negative role and strict labels/precision", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.employees = [{ ...d.employees[0], innerJobCode: "-9" }];
  d.innerJobs = []; // selected inactive/unknown role keeps exact code, null label.
  d.attendance = [{ ...d.attendance[0], missingReasonCode: "", briefingCode: "" }];
  const r = (await app(d).list(mock, request)).items.find(r => r.shiftDayId === "19002")!;
  assert.deepEqual(r.planned.innerJob, { code: "-9", label: null });
  assert.equal(r.attendance.missingReasonCode, null); assert.equal(r.attendance.briefingRecorded, null);
  for (const change of [{ employeeId: "1.5" }, { employeeId: "9".repeat(39) },
    { firstName: "<script>" }, { lastName: "" }, { firstName: "א".repeat(41) }]) {
    const bad = structuredClone(sampleAttendanceFixture);
    bad.employees = [{ ...bad.employees[0], ...change }];
    await assert.rejects(async () => app(bad).list(mock, request), { code: "INVALID_SOURCE_DATA" });
  }
  const badHome = structuredClone(sampleAttendanceFixture);
  badHome.days = [{ ...badHome.days[0], baselineHome: "unknown" }];
  await assert.rejects(app(badHome).list(mock, request), { code: "INVALID_SOURCE_DATA" });
});
test("AT19-09 full lookahead101, numeric IDs, pagination ceiling and immutable concurrent reads", async () => {
  const d = structuredClone(sampleAttendanceFixture);
  d.days = Array.from({ length: 102 }, (_, i) => ({ ...d.days[0], shiftDayId: String(i+1) }));
  const use = app(d), before = structuredClone(d);
  const [one,two] = await Promise.all([use.list(mock, { ...request, limit: 100 }),
    use.list(mock, { ...request, limit: 100 })]);
  assert.deepEqual(one, two); assert.deepEqual(d, before);
  assert.equal(one.items.length, 100); assert.equal(one.page.hasMore, true); assert.equal(one.page.nextOffset, 100);
  assert.equal(one.items[1].shiftDayId, "2"); assert.equal(one.items[9].shiftDayId, "10");
  const reader = { dataSource: "isolated-fixture" as const, async readContext() { throw Error(); },
    async read() { return one.items.slice(0,2); } };
  const ceiling = await new ReadAttendance(reader, clock, "UTC", "isolated-fixture")
    .list(mock, { ...request, limit: 1, offset: 10000 });
  assert.equal(ceiling.page.hasMore, true); assert.equal(ceiling.page.nextOffset, null);
});
