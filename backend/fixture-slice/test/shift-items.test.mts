import test from "node:test";
import assert from "node:assert/strict";
import type { PrincipalV1 } from "../contracts.mts";
import type { SelectedShiftItemsReadPort } from "../shift-items-contracts.mts";
import { GetSelectedShiftItems } from "../read-shift-items.mts";
import { ShiftItemsFixtureReader } from "../shift-items-fixture.mts";
import { shiftItemsAccessPolicy } from "../access-policy.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { sampleConfig, sampleShiftItemsFixture, sampleShiftItemsDetailRows } from "../shift-items-sample.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { readEmployeeShiftDay } from "../read-employee-shift-day.mts";
import { validateItemsRequest } from "../shift-items-validation.mts";

const principal = await new SyntheticAdministratorProvider(sampleConfig).authenticate({ authorization: null });
const request = { employeeId: "9007199254740993", shiftDayId: "1" };
const service = (data = sampleShiftItemsFixture) => new GetSelectedShiftItems(new ShiftItemsFixtureReader(data),
  shiftItemsAccessPolicy(sampleConfig), "Asia/Jerusalem");
const realConfig = { ...sampleConfig, authenticationMode: "real", syntheticAdministratorEnabled: false,
  syntheticOrgUnitIds: undefined, realProviderId: "isolated-test-double" };
const real = (overrides: Partial<PrincipalV1> = {}): PrincipalV1 => ({ ...principal,
  subject: "isolated:real-double", provider: "real", synthetic: false, roles: [],
  employeeId: request.employeeId, ...overrides });

test("BRX18-01/05/06/07 fixture shares detail semantics, full seconds and source markers without mutation", async () => {
  const before = structuredClone(sampleShiftItemsFixture);
  const response = await service().read(principal, request);
  assert.deepEqual(response.shiftDay, await readEmployeeShiftDay(principal, request.employeeId, "1",
    new FixtureReader(sampleShiftItemsDetailRows), "Asia/Jerusalem"));
  assert.deepEqual(response.items.map(r => r.kind), ["break", "timeoff", "exception"]);
  assert.deepEqual(response.displayContext.activities.map(r => r.label), ["פעילות סינתטית", null, "פעילות סינתטית"]);
  assert.equal(response.items[1].type?.label, null); assert.equal(response.items[2].type?.label, "חריגה סינתטית");
  assert.equal(response.items[0].sourceCode, "DEL"); assert.equal(response.shiftDay.dataSource, "isolated-fixture");
  assert.equal(principal.employeeId, null);
  assert.deepEqual(sampleShiftItemsFixture, before);
  response.items[0].remark = "client edit";
  assert.notEqual((await service().read(principal, request)).items[0].remark, "client edit");
});
test("BRX18-02 both independent capabilities and actor checks happen before any port calls", async () => {
  let calls = 0;
  const reader: SelectedShiftItemsReadPort = { dataSource: "isolated-fixture",
    async read() { calls++; throw Error("unexpected"); } };
  const s = new GetSelectedShiftItems(reader, shiftItemsAccessPolicy(realConfig), "Asia/Jerusalem");
  for (const p of [real({ capabilities: ["shift-day:read"] }), real({ capabilities: ["shift-items:read"] }),
    real({ capabilities: ["current-shifts:read", "shift-search:read", "my-shifts:read"] }),
    real({ employeeId: null }), real({ employeeId: "2" }), principal])
    await assert.rejects(s.read(p, request), { code: "FORBIDDEN" });
  assert.equal(calls, 0);
});
test("BRX18-02 verified real-self and explicit synthetic selected actor, empty scope never means all", async () => {
  const s = new GetSelectedShiftItems(new ShiftItemsFixtureReader(sampleShiftItemsFixture),
    shiftItemsAccessPolicy(realConfig), "Asia/Jerusalem");
  assert.equal((await s.read(real(), request)).items.length, 3);
  for (const scope of [[], ["01"], ["OTHER"]])
    await assert.rejects(s.read(real({ resourceScope: { orgUnitIds: scope } }), request), { code: "SHIFT_DAY_NOT_FOUND" });
});
test("BRX18-03 canonical IDs, 38 digit employee exactness, no numeric coercion", () => {
  validateItemsRequest({ employeeId: "9".repeat(38), shiftDayId: "9".repeat(10) });
  for (const patch of [{ employeeId: 9007199254740993 }, { employeeId: "0" }, { employeeId: "01" },
    { employeeId: "1e3" }, { employeeId: "9".repeat(39) }, { shiftDayId: "1".repeat(11) },
    { shiftDayId: "" }, { employeeId: " 1" }, { limit: "1" }, { fullDay: true }])
    assert.throws(() => validateItemsRequest({ ...request, ...patch }), { code: "INVALID_REQUEST" });
});
test("BRX18-04 absent, wrong employee, reassigned and out-of-scope share generic 404", async () => {
  for (const r of [{ ...request, employeeId: "2" }, { ...request, shiftDayId: "999" }])
    await assert.rejects(service().read(principal, r), { code: "SHIFT_DAY_NOT_FOUND" });
  const data = structuredClone(sampleShiftItemsFixture);
  data.contexts[0].detail.employeeId = "2";
  await assert.rejects(service(data).read(principal, request), { code: "SHIFT_DAY_NOT_FOUND" });
});
test("BRX18-04 full detail multiplicity precedes employee/scope choice and item reads", async () => {
  const data = structuredClone(sampleShiftItemsFixture);
  data.contexts.push({ ...structuredClone(data.contexts[0]), detail: { ...data.contexts[0].detail, employeeId: "2" } });
  data.items[0].durationMinutes = null;
  await assert.rejects(service(data).read(principal, request), { code: "AMBIGUOUS_SHIFT_DAY" });
});
test("BRX18-04/06 item duplicates across states detected BEFORE page and beyond-end empty page", async () => {
  const data = structuredClone(sampleShiftItemsFixture);
  data.items.push({ ...data.items[0], stateCode: "7", typeCode: "-9" });
  for (const offset of [0, 2, 10000])
    await assert.rejects(service(data).read(principal, { ...request, limit: 1, offset }), { code: "AMBIGUOUS_SHIFT_ITEMS" });
});
test("BRX18-05 membership is linked day/positive state/cancel-null, not source/date/full-day logic", async () => {
  const data = structuredClone(sampleShiftItemsFixture);
  for (const patch of [{ cancellationReason: "1" }, { stateCode: "0" }, { stateCode: "-1" }, { shiftDayId: "2" }])
    data.items.push({ ...data.items[0], ...patch });
  data.contexts[0].detail.changedStartLocal = "2024-04-01T12:00:00";
  data.items[0].startLocal = "2024-02-28T12:00:00";
  assert.equal((await service(data).read(principal, request)).items.length, 3);
});
test("BRX18-06 mandatory NULL duration/date fails, nullable actual/detail dates preserved, no recompute", async () => {
  for (const patch of [{ durationMinutes: null }, { startLocal: null }, { endLocal: null }]) {
    const data = structuredClone(sampleShiftItemsFixture); Object.assign(data.items[0], patch);
    await assert.rejects(service(data).read(principal, request), { code: "INVALID_SOURCE_DATA" });
  }
  const data = structuredClone(sampleShiftItemsFixture);
  data.contexts[0].detail.baselineEndLocal = null;
  const r = await service(data).read(principal, request);
  assert.equal(r.shiftDay.effectiveShift.endLocal, null);
  assert.equal(r.items[0].breakReturnLocal, null);
  assert.equal(r.items[1].durationMinutes, "-2");
});
test("BRX18-07 scoped catalog duplicates fail, missing labels honest and invalid hierarchy fails", async () => {
  for (const kind of ["activities", "exceptions"] as const) {
    const data = structuredClone(sampleShiftItemsFixture);
    data[kind].push({ ...data[kind][0] });
    await assert.rejects(service(data).read(principal, request), { code: "INVALID_SOURCE_DATA" });
  }
  const data = structuredClone(sampleShiftItemsFixture);
  data.contexts[0].unit.moked.unitType = "J01" as "G01";
  await assert.rejects(service(data).read(principal, request), { code: "INVALID_SOURCE_DATA" });
});
test("BRX18-08 paging lookahead, empty authorized page, 1/100 limits and ceiling", async () => {
  const s = service();
  const r = await s.read(principal, { ...request, limit: 1 });
  assert.equal(r.items.length, 1); assert.deepEqual(r.page, { limit: 1, offset: 0, hasMore: true, nextOffset: 1 });
  assert.equal((await s.read(principal, { ...request, limit: 100 })).items.length, 3);
  const empty = await s.read(principal, { ...request, offset: 10000 });
  assert.deepEqual(empty.items, []); assert.equal(empty.shiftDay.shiftDayId, "1");
  const data = structuredClone(sampleShiftItemsFixture);
  data.items = Array.from({ length: 10003 }, (_, i) => ({ ...data.items[0],
    startLocal: `2024-03-${String(Math.floor(i / 86400) + 1).padStart(2, "0")}T${String(Math.floor(i / 3600) % 24).padStart(2, "0")}:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}` }));
  const ceiling = await service(data).read(principal, { ...request, offset: 10000, limit: 1 });
  assert.equal(ceiling.page.hasMore, true); assert.equal(ceiling.page.nextOffset, null);
});
test("BRX18-09 abort rejects before port, port violations never become empty success", async () => {
  const c = new AbortController(); c.abort();
  await assert.rejects(service().read(principal, request, c.signal));
  const reader: SelectedShiftItemsReadPort = { dataSource: "isolated-fixture",
    async read() { throw Error("private source failure"); } };
  await assert.rejects(new GetSelectedShiftItems(reader, shiftItemsAccessPolicy(sampleConfig), "Asia/Jerusalem")
    .read(principal, request), /private source failure/);
});
test("BRX18-09/11 byte cap is sanitized source error; projection strips private adapter additions", async () => {
  const fixture = new ShiftItemsFixtureReader(sampleShiftItemsFixture);
  const reader: SelectedShiftItemsReadPort = { dataSource: "isolated-fixture",
    async read(s, signal) {
      const r = await fixture.read(s, signal);
      if (r.kind === "one") {
        Object.assign(r.rows[0], { privateInternal: "not-public" });
        Object.assign(r.displayContext, { employeeReference: "not-public" });
      }
      return r;
    } };
  const s = new GetSelectedShiftItems(reader, shiftItemsAccessPolicy(sampleConfig), "Asia/Jerusalem");
  assert.ok(!JSON.stringify(await s.read(principal, request)).includes("not-public"));
  // Fault-injected internal zone exercises the defense-in-depth response cap;
  // runtime configuration itself never permits this oversized value.
  const oversized = new GetSelectedShiftItems(reader, shiftItemsAccessPolicy(sampleConfig), "x".repeat(2 * 1024 * 1024));
  await assert.rejects(oversized.read(principal, request), { code: "INVALID_SOURCE_DATA" });
});
