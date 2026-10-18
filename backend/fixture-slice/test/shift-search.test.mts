import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSearchQuery, validateSearchRequest } from "../shift-search-validation.mts";
import { SearchFixtureReader } from "../shift-search-fixture.mts";
import type { SearchFixtureDay, SearchFixtureData } from "../shift-search-fixture.mts";
import { sampleSearchFixture, sampleConfig } from "../shift-search-sample.mts";
import { ReadShiftSearch } from "../read-shift-search.mts";
import { principal } from "./current-fixtures.mts";
import { projectSearchShift } from "../shift-search-projection.mts";
import { searchProblem } from "../shift-search-errors.mts";
import { validateSearchCatalog } from "../shift-search-validation.mts";

export const searchPrincipal = () => principal({ capabilities: ["shift-search:read"] });
export const searchRequest = { attendanceDate: "2026-10-15", timeFrom: "10:00", timeTo: "10:00" };
export function searchData(days: readonly SearchFixtureDay[] = structuredClone(sampleSearchFixture.days)): SearchFixtureData {
  return structuredClone({ ...sampleSearchFixture, days });
}
export function searchService(data = searchData()) {
  return new ReadShiftSearch(new SearchFixtureReader(data), { now: () => new Date("2026-10-15T20:11:00Z") },
    sampleConfig.businessTimeZone, "isolated-fixture");
}

test("SEARCH01 strict single date, equal inclusive minutes, defaults and normalized exact lists", () => {
  const request = parseSearchQuery(new URLSearchParams(
    "attendanceDate=2024-02-29&timeFrom=10:00&timeTo=10:00&teamCodes=T02,T01&workLocations=site,home"));
  assert.deepEqual(request, { attendanceDate: "2024-02-29", timeFrom: "10:00", timeTo: "10:00",
    teamCodes: ["T01", "T02"], workLocations: ["home", "site"], limit: 25, offset: 0, sort: "effective-start-asc" });
  for (const suffix of ["&timeTo=11:00", "&employeeId=1", "&teamCodes=T,T", "&innerJobCodes=01",
    "&workLocations=null", "&limit=01", "&offset=10001"]) {
    assert.throws(() => parseSearchQuery(new URLSearchParams(
      "attendanceDate=2024-02-29&timeFrom=10:00&timeTo=10:00" + suffix)));
  }
  assert.throws(() => validateSearchRequest({ attendanceDate: "2023-02-29", timeFrom: "10:00", timeTo: "10:00" }));
  assert.throws(() => validateSearchRequest({ attendanceDate: "2024-02-29", timeFrom: "10:01", timeTo: "10:00" }));
});

test("SEARCH01-03 context exact catalog and Gregorian rounded-hour rollover, no full-day default", async () => {
  const context = await searchService().context(searchPrincipal());
  assert.deepEqual(context.defaults, { attendanceDate: "2026-10-16", timeFrom: "00:00", timeTo: "00:00",
    mokedCode: "01", teamCodes: [], innerJobCodes: [], workLocations: [] });
  assert.equal(context.teamOptions[0].code, "T01");
  assert.equal(context.innerJobOptions[0].code, "1");
  assert.deepEqual(context.workLocationOptions.map(v => v.code), ["home", "site"]);
});
test("SEARCH01-04/05 separate baseline UNION ALL changed membership, inclusive exact seconds and missing NULL", async () => {
  const base = structuredClone(sampleSearchFixture.days[0]);
  const cases: Array<[Partial<SearchFixtureDay>, number]> = [
    [{}, 1], [{ baselineStartLocal: "2026-10-15T09:59:59" }, 0],
    [{ baselineStartLocal: "2026-10-15T10:00:01" }, 0],
    [{ baselineStartLocal: "2026-10-14T23:00:00" }, 0],
    [{ hasChange: true }, 0], [{ hasChange: true, changedEmployeeKey: "TEST0001",
      changedDayType: 4, changedStartLocal: "2026-10-15T10:00:00" }, 1],
    [{ hasChange: true, changedEmployeeKey: "TEST0001", changedDayType: 4,
      changedStartLocal: "2026-10-15T10:00:00", cancellationReason: "0" }, 0],
  ];
  for (const [delta, expected] of cases) {
    const result = await searchService(searchData([{ ...base, ...delta }])).list(searchPrincipal(), searchRequest);
    assert.equal(result.items.length, expected);
  }
  for (const reason of [null, "0", "1"]) {
    const data = searchData();
    data.attendance = [{ shiftDayId: "3001", missingReason: reason, stationArrivalLocal: null }];
    assert.equal((await searchService(data).list(searchPrincipal(), searchRequest)).items.length, reason === null ? 1 : 0);
  }
});
test("SEARCH01-05 raw changed location NULL differs from effective display, both differs from omitted", async () => {
  const d = { ...structuredClone(sampleSearchFixture.days[0]), hasChange: true, changedEmployeeKey: "TEST0001",
    changedDayType: 4, changedStartLocal: "2026-10-15T10:00:00" };
  const service = searchService(searchData([d]));
  assert.equal((await service.list(searchPrincipal(), searchRequest)).items[0].workingFromHome, true);
  for (const workLocations of [["home"], ["site"], ["home", "site"]] as const)
    assert.equal((await service.list(searchPrincipal(), { ...searchRequest, workLocations: [...workLocations] })).items.length, 0);
});
test("SEARCH01-06 independent capabilities, exact team grants, parent mismatch and role selectability", async () => {
  const service = searchService();
  await assert.rejects(service.list(principal(), searchRequest), { code: "FORBIDDEN" });
  for (const filter of [{ teamCodes: ["T02"] }, { mokedCode: "1" }])
    await assert.rejects(service.list(searchPrincipal(), { ...searchRequest, ...filter }), { code: "FORBIDDEN" });
  await assert.rejects(service.list(searchPrincipal(), { ...searchRequest, innerJobCodes: ["2"] }),
    { code: "INVALID_REQUEST", invalidParameters: [{ name: "innerJobCodes", reason: "invalid-format" }] });
  assert.equal((await service.list(searchPrincipal(), { ...searchRequest, teamCodes: ["T01"],
    innerJobCodes: ["1"], workLocations: ["home"] })).items.length, 1);
  const d = searchData();
  d.catalog.mokedUnits = [...d.catalog.mokedUnits, { code: "02", label: "שני", unitType: "G01" }];
  d.catalog.teams = [...d.catalog.teams, { code: "T02", label: "שני", unitType: "J01", parentMokedCode: "02" }];
  await assert.rejects(searchService(d).list(principal({ capabilities: ["shift-search:read"],
    resourceScope: { orgUnitIds: ["T01", "T02"] } }), { ...searchRequest, mokedCode: "01", teamCodes: ["T02"] }),
  { code: "INVALID_REQUEST", invalidParameters: [{ name: "teamCodes", reason: "invalid-format" }] });
  const empty = principal({ capabilities: ["shift-search:read"], resourceScope: { orgUnitIds: [] } });
  assert.equal((await service.list(empty, searchRequest)).items.length, 0);
  assert.deepEqual((await service.context(empty)).innerJobOptions, []);
});
test("SEARCH01-07 scoped roles active==1 and exact grants; malformed catalogs fail, no truncation", async () => {
  for (const bad of [
    (d: SearchFixtureData) => { d.innerJobs = [{ ...d.innerJobs[0], label: "" }]; },
    (d: SearchFixtureData) => { d.innerJobs = Array.from({ length: 1001 }, (_, i) => ({ ...d.innerJobs[0], code: String(i + 1) })); },
    (d: SearchFixtureData) => { d.catalog.teams = [...d.catalog.teams, { ...d.catalog.teams[0] }]; },
  ]) {
    const d = searchData(); bad(d);
    await assert.rejects(async () => searchService(d).context(searchPrincipal()), { code: "INVALID_SOURCE_DATA" });
  }
  const d = searchData();
  d.innerJobs = [{ ...d.innerJobs[0], active: 0 }, { ...d.innerJobs[0], code: "2", orgUnitId: "T02" }];
  assert.deepEqual((await searchService(d).context(searchPrincipal())).innerJobOptions, []);
});
test("SEARCH01-08 ambiguity includes e_old, attendance, cancel login and change multiplicity before empty offset", async () => {
  for (const mutate of [
    (d: SearchFixtureData) => { d.employees = [...d.employees, { ...d.employees[0], employeeId: "2", teamCode: "T02" }];
      d.catalog.teams = [...d.catalog.teams, { code: "T02", label: "אחר", unitType: "J01", parentMokedCode: "01" }]; },
    (d: SearchFixtureData) => { d.attendance = [1, 2].map(() => ({ shiftDayId: "3001", missingReason: null, stationArrivalLocal: null })); },
    (d: SearchFixtureData) => { d.cancelLogins = [1, 2].map(() => ({ shiftDayId: "3001", applier: null })); },
    (d: SearchFixtureData) => { d.days = [d.days[0], d.days[0]]; },
  ]) {
    const d = searchData(); mutate(d);
    await assert.rejects(searchService(d).list(searchPrincipal(), { ...searchRequest, offset: 10000 }),
      { code: "AMBIGUOUS_SHIFT_SEARCH" });
  }
});
test("SEARCH01-08 numeric stable paging, lookahead, 10000 ceiling and no total", async () => {
  const base = structuredClone(sampleSearchFixture.days[0]);
  const service = searchService(searchData(Array.from({ length: 10002 }, (_, i) => ({ ...base, shiftDayId: String(i + 1) }))));
  const first = await service.list(searchPrincipal(), { ...searchRequest, limit: 2 });
  assert.deepEqual(first.items.map(r => r.shiftDayId), ["1", "2"]);
  assert.deepEqual(first.page, { limit: 2, offset: 0, hasMore: true, nextOffset: 2 });
  const last = await service.list(searchPrincipal(), { ...searchRequest, limit: 1, offset: 10000 });
  assert.deepEqual(last.page, { limit: 1, offset: 10000, hasMore: true, nextOffset: null });
});
test("SEARCH01-10 seven markers, raw-token fallback, case sensitivity and asymmetric location change", () => {
  const d = structuredClone(sampleSearchFixture.days[0]), e = sampleSearchFixture.employees[0];
  const project = () => projectSearchShift(d, e, sampleSearchFixture.catalog.teams[0],
    sampleSearchFixture.catalog.mokedUnits[0], d.markers, sampleSearchFixture);
  assert.equal(project().activityFallback, null); // unresolved raw tokens retained
  d.baselineActivityData = ";;"; d.changedActivityData = null;
  assert.equal(project().activityFallback?.code, "1");
  d.changedEmployeeKey = "TEST0002"; d.changedHome = "N"; d.markers.source = "Fixture";
  assert.equal(project().indicators.employeeReassigned, true);
  assert.equal(project().indicators.timeOrLocationChanged, false);
  assert.equal(project().indicators.addedStaffing, false);
  d.changedEmployeeKey = d.employeeKey;
  assert.equal(project().indicators.timeOrLocationChanged, true);
  assert.equal(project().indicators.extensionAllocated, null);
  d.changedHome = "Y"; d.markers.changedSplit = "n";
  assert.equal(project().indicators.split, false);
  d.markers.changedSplit = "y"; d.markers.cancelLoginApplier = " ";
  assert.equal(project().indicators.split, true);
  assert.equal(project().indicators.hasCancelLoginAnnotation, false);
});
test("SHF-SEARCH-QA-API-18-D01 extension presence follows getShiftExtNum branch, not unconditional fallback", async () => {
  const cases = [
    { name: "baseline home with extension", changedStart: null, home: "Y", baseline: "Y", changed: null, expected: true },
    { name: "changed start with null new extension suppresses baseline", changedStart: "2026-10-15T10:00:00",
      home: "Y", baseline: "Y", changed: null, expected: false },
    { name: "changed start with new extension", changedStart: "2026-10-15T10:00:00",
      home: "Y", baseline: null, changed: "Y", expected: true },
    { name: "nonhome is not applicable", changedStart: "2026-10-15T10:00:00",
      home: "N", baseline: "Y", changed: "Y", expected: null },
    { name: "new extension wins even without changed start", changedStart: null,
      home: "Y", baseline: null, changed: "Y", expected: true },
    { name: "baseline home without extension", changedStart: null,
      home: "Y", baseline: null, changed: null, expected: false },
  ];
  for (const c of cases) {
    const d = structuredClone(sampleSearchFixture.days[0]);
    d.changedStartLocal = c.changedStart;
    d.baselineHome = c.home; d.changedHome = c.home;
    d.markers.baselineExtension = c.baseline; d.markers.changedExtension = c.changed;
    const projected = projectSearchShift(d, sampleSearchFixture.employees[0], sampleSearchFixture.catalog.teams[0],
      sampleSearchFixture.catalog.mokedUnits[0], d.markers, sampleSearchFixture);
    assert.equal(projected.indicators.extensionAllocated, c.expected, c.name);
  }
  const d = structuredClone(sampleSearchFixture.days[0]);
  Object.assign(d, { hasChange: true, changedEmployeeKey: d.employeeKey, changedDayType: 4,
    changedStartLocal: "2026-10-15T10:00:00", changedHome: "Y" });
  d.markers.baselineExtension = "Y"; d.markers.changedExtension = null;
  const result = await searchService(searchData([d])).list(searchPrincipal(), searchRequest);
  assert.equal(result.items[0].workingFromHome, true);
  assert.equal(result.items[0].indicators.extensionAllocated, false);
});
test("SEARCH01-11 repeated concurrent reads pure, abort prevents late success, sanitized unknown errors", async () => {
  const d = searchData(), before = structuredClone(d), service = searchService(d);
  const [a, b] = await Promise.all([service.list(searchPrincipal(), searchRequest), service.list(searchPrincipal(), searchRequest)]);
  assert.deepEqual(a, b); a.items[0].employee.firstName = "changed";
  assert.notEqual(a.items[0].employee.firstName, b.items[0].employee.firstName);
  assert.deepEqual(d, before);
  const c = new AbortController(); c.abort();
  await assert.rejects(service.list(searchPrincipal(), searchRequest, c.signal));
  assert.equal(searchProblem(new Error("secret"), "id").code, "INTERNAL_ERROR");
  assert.ok(!JSON.stringify(b).includes("synthetic\"")); // no remark body/extension
});
test("SEARCH01 grammar canonical dates/minutes/NUMBER and lists: boundaries, no coercion/sentinels", () => {
  for (const attendanceDate of ["0001-01-01", "9999-12-31", "2000-02-29"]) {
    assert.equal(validateSearchRequest({ attendanceDate, timeFrom: "00:00", timeTo: "23:59" }).attendanceDate, attendanceDate);
  }
  for (const attendanceDate of ["0000-01-01", "1900-02-29", "2024-04-31", "2024-2-29", "2024-02-29Z"])
    assert.throws(() => validateSearchRequest({ ...searchRequest, attendanceDate }));
  for (const timeFrom of ["24:00", "10:60", "10:00:00", "1000", " 10:00", "10:00Z"])
    assert.throws(() => validateSearchRequest({ ...searchRequest, timeFrom }));
  for (const innerJobCodes of [["0"], ["01"], ["-1"], ["1.0"], ["1".repeat(39)], ["1,2"], [], ["1", "1"]])
    assert.throws(() => validateSearchRequest({ ...searchRequest, innerJobCodes }));
  assert.equal(validateSearchRequest({ ...searchRequest, innerJobCodes: ["9".repeat(38)] }).innerJobCodes?.[0], "9".repeat(38));
  assert.throws(() => validateSearchRequest({ ...searchRequest, teamCodes: Array.from({ length: 101 }, (_, i) => `T${i}`) }));
  assert.throws(() => validateSearchRequest({ ...searchRequest, workLocations: ["home", "site", "home"] }));
  assert.throws(() => validateSearchRequest({ ...searchRequest, limit: "2" }));
});
test("SEARCH01 source/port projection is allowlisted; malformed row/unknown error cannot leak data", async () => {
  const fixture = new SearchFixtureReader(searchData());
  const validRow = (await searchService().list(searchPrincipal(), searchRequest)).items[0];
  const catalog = await fixture.readCatalog(["T01"]);
  const service = (row: unknown) => new ReadShiftSearch({
    readCatalog: async () => Object.assign(structuredClone(catalog), { secret: "source-secret" }),
    readRows: async () => [row] as typeof validRow[],
  }, { now: () => new Date("2026-10-15T07:00:00Z") }, "Asia/Jerusalem", "isolated-fixture");
  for (const row of [{ ...validRow, shiftDayId: 3001 }, { ...validRow, employee: { ...validRow.employee, employeeId: "01" } },
    { ...validRow, activityFallback: { code: "1", label: "bad-fallback-with-tokens" } },
    { ...validRow, indicators: { ...validRow.indicators, extensionAllocated: null } }])
    await assert.rejects(service(row).list(searchPrincipal(), searchRequest), { code: "INVALID_SOURCE_DATA" });
  const withExtra = service({ ...validRow, secret: "source-secret", employee: { ...validRow.employee, secret: "source-secret" } });
  assert.ok(!JSON.stringify(await withExtra.context(searchPrincipal())).includes("source-secret"));
  assert.ok(!JSON.stringify(await withExtra.list(searchPrincipal(), searchRequest)).includes("source-secret"));
  assert.throws(() => validateSearchCatalog({ ...catalog, teamOptions: [catalog.teamOptions[0], catalog.teamOptions[0]] }, ["T01"]),
    { code: "INVALID_SOURCE_DATA" });
});
