import { test } from "node:test";
import assert from "node:assert/strict";
import { stationClassify } from "../station-arrival-domain.mts";
import { sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { sampleStageArrivalConfig } from "../stage-arrival-sample.mts";
import { randomUUID } from "node:crypto";
import type { Clock } from "../current-shifts-contracts.mts";
import type { StationArrivalCommitV1, StationArrivalFixtureExtraV1 } from "../station-arrival-contracts.mts";
import { MemoryStageArrivalStore } from "../stage-arrival-memory.mts";
import type { StageArrivalTestFault } from "../stage-arrival-memory.mts";
import { StationArrivalApplication } from "../station-arrival-application.mts";
import { StageArrivalApplication } from "../stage-arrival-application.mts";
import { SyntheticAdministratorProvider, createRuntime } from "../synthetic-identity.mts";
import { stageArrivalReadAdapters } from "../stage-arrival-fixture.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { stationEnvelope, stationCommand, stationDraft } from "../station-arrival-validation.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { validateRuntimeConfig } from "../runtime-config.mts";
import { validatePrincipal } from "../contract-validation.mts";
import { SliceError } from "../errors.mts";
import { createStationArrivalFixture } from "../station-arrival-fixture.mts";
import { currentRequestBudget } from "../request-budget-context.mts";

class FixedClock implements Clock {
  time = Date.parse("2026-10-20T10:30:00Z");
  now() { return new Date(this.time); }
}
const config = { ...sampleStageArrivalConfig, businessTimeZone: "UTC",
  attendanceStationArrivalMode: "isolated-fixture" };
function extra(): StationArrivalFixtureExtraV1 {
  return { ...sampleStageArrivalFacts.selection, revision: "station-1", stationArrivalUser: null,
    stationExitUser: null, stationLate: null, flagPresent: false, locked: false,
    fullDayExceptionPresent: false, overlappingShiftPresent: false, policyRevision: "station-policy-1" };
}
async function setup(fault?: StageArrivalTestFault, edit?: (f: typeof sampleStageArrivalFacts, x: StationArrivalFixtureExtraV1) => void) {
  const row = structuredClone(sampleStageArrivalFacts), x = extra(), clock = new FixedClock();
  edit?.(row, x);
  const store = new MemoryStageArrivalStore([row], clock, fault, [x]);
  const app = new StationArrivalApplication(store, clock, "UTC");
  const f1 = new StageArrivalApplication(store, clock, "UTC");
  const p = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
  const s = row.selection;
  return { app, f1, p, s, store, clock };
}
function code(expected: string) {
  return (e: unknown) => e instanceof StageArrivalError && e.code === expected;
}
async function prepared(t: Awaited<ReturnType<typeof setup>>, late = false): Promise<StationArrivalCommitV1> {
  const draft = { lateReasonCode: late ? "1" : null };
  const v = await t.app.validate(t.p, t.s, draft);
  return { commandId: randomUUID(), draft, validationToken: v.validationToken, fingerprint: v.fingerprint,
    confirmation: late ? { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] } : null };
}

test("F2 offset zero, inclusive arrival window and strict lateness", () => {
  const f = structuredClone(sampleStageArrivalFacts);
  const start = Date.parse(f.planned.startLocal + "Z");
  const exact = stationClassify(f, new Date(start), "UTC");
  assert.equal(exact.confirmationRequired, false);
  assert.equal(exact.withinArrivalWindow, true);
  const late = stationClassify(f, new Date(start + 1), "UTC");
  assert.deepEqual(late.warnings, [{ code: "STATION_ARRIVAL_LATE", minutes: "0" }]);
  assert.equal(stationClassify(f, new Date(start - 3600000), "UTC").withinArrivalWindow, true);
  assert.equal(stationClassify(f, new Date(start - 3600001), "UTC").withinArrivalWindow, false);
});

test("F2 pure context/validation then station-only commit with NULL stage, replay/conflict/already", async () => {
  const t = await setup(), before = t.store.inspectSnapshot();
  assert.equal((await t.app.context(t.p, t.s)).eligibility, "eligible");
  const cmd = await prepared(t);
  assert.deepEqual(t.store.inspectSnapshot(), before);
  const receipt = await t.app.commit(t.p, t.s, cmd);
  assert.equal(receipt.recorded.stageArrivalLocal, null);
  assert.equal(receipt.recorded.briefing, null);
  assert.equal(receipt.partnerCompletion, "not-invoked");
  const after = t.store.inspectSnapshot();
  assert.equal(after.rows[0].attendance?.stageArrivalLocal, null);
  assert.equal(after.rows[0].attendance?.stageArrivalUser, null);
  assert.equal(after.stationExtras[0].stationArrivalUser, t.p.subject);
  assert.equal(after.stationReceipts, 1); assert.equal(after.stationAudits, 1);
  t.clock.time += 180000;
  assert.equal((await t.app.commit(t.p, t.s, cmd)).replayed, true);
  assert.deepEqual(t.store.inspectSnapshot(), after);
  await assert.rejects(t.app.commit(t.p, t.s, { ...cmd, fingerprint: "a".repeat(64) }), code("COMMAND_ID_CONFLICT"));
  await assert.rejects(t.app.commit(t.p, t.s, { ...cmd, commandId: randomUUID() }), code("ALREADY_REGISTERED"));
});

test("F2 late ACK required before any effect, preserves F1 late and briefing", async () => {
  const t = await setup(undefined, f => {
    f.attendance!.stageArrivalLocal = "2026-10-20T10:29:00";
    f.attendance!.stageArrivalUser = "synthetic:prior";
    f.attendance!.stageLateReasonCode = "1"; f.attendance!.stageLateMinutes = "2";
    f.attendance!.stageLateRemark = "synthetic"; f.attendance!.briefing = true;
  });
  t.clock.time += 61000;
  const before = t.store.inspectSnapshot(), cmd = await prepared(t, true);
  await assert.rejects(t.app.commit(t.p, t.s, { ...cmd, confirmation: null }), code("CONFIRMATION_REQUIRED"));
  assert.deepEqual(t.store.inspectSnapshot(), before);
  const r = await t.app.commit(t.p, t.s, cmd);
  assert.deepEqual(r.recorded.stationLate, { reasonCode: "1", minutes: "1", remark: null });
  const a = t.store.inspectSnapshot().rows[0].attendance!;
  assert.equal(a.briefing, true); assert.equal(a.stageLateRemark, "synthetic");
  assert.equal(a.stageLateMinutes, "2");
});

for (const flag of ["flagPresent", "locked", "fullDayExceptionPresent", "overlappingShiftPresent"] as const) {
  test(`F2 explicit extra blocker ${flag} defers with zero effects`, async () => {
    const t = await setup(undefined, (_, x) => { x[flag] = true; });
    assert.equal((await t.app.context(t.p, t.s)).eligibility, "deferred");
    await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("COMMAND_SCOPE_DEFERRED"));
    assert.equal(t.store.inspectSnapshot().stationReceipts, 0);
  });
}
for (const flag of ["missingPresent", "outstandingReportsPresent", "splitOrP2", "cancelledOrNonActivityDay"] as const) {
  test(`F2 base dependency ${flag} is not bypassed by Administrator`, async () => {
    const t = await setup(undefined, f => { f[flag] = true; });
    await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("COMMAND_SCOPE_DEFERRED"));
  });
}
test("F2 missing row defers, exit-only defers, station-late defers", async () => {
  for (const edit of [
    (f: typeof sampleStageArrivalFacts) => { f.attendance = null; },
    (f: typeof sampleStageArrivalFacts, x: StationArrivalFixtureExtraV1) => {
      f.attendance!.stationExitLocal = "2026-10-20T10:00:00"; x.stationExitUser = "synthetic:prior";
    },
    (_: typeof sampleStageArrivalFacts, x: StationArrivalFixtureExtraV1) => {
      x.stationLate = { reasonCode: "1", minutes: "0", remark: null };
    },
  ]) {
    const t = await setup(undefined, edit);
    await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("COMMAND_SCOPE_DEFERRED"));
  }
});
test("F2 window, reason, Clock and future stage validation", async () => {
  const t = await setup();
  for (const time of ["2026-10-20T09:29:59Z", "2026-10-20T18:30:00.001Z"]) {
    t.clock.time = Date.parse(time);
    await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("BUSINESS_VALIDATION_FAILED"));
  }
  t.clock.time = Date.parse("2026-10-20T10:31:00Z");
  await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("BUSINESS_VALIDATION_FAILED"));
  await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: "99" }), code("BUSINESS_VALIDATION_FAILED"));
  t.clock.time = NaN;
  await assert.rejects(t.app.context(t.p, t.s), code("INVALID_SOURCE_DATA"));
  const future = await setup(undefined, f => {
    f.attendance!.stageArrivalLocal = "2026-10-20T10:31:00"; f.attendance!.stageArrivalUser = "synthetic:prior";
  });
  await assert.rejects(future.app.validate(future.p, future.s, { lateReasonCode: null }), code("INVALID_SOURCE_DATA"));
});

test("F2 F1 preparation invalidation and operation token/UUID namespaces", async () => {
  const t = await setup();
  const station = await prepared(t);
  const d = { lateReasonCode: null, lateRemark: null };
  const stage = await t.f1.validate(t.p, t.s, d);
  const stageCmd = { commandId: station.commandId, draft: d, validationToken: stage.validationToken,
    fingerprint: stage.fingerprint, confirmation: null };
  await assert.rejects(t.app.commit(t.p, t.s, { ...station, validationToken: stage.validationToken }), code("STALE_PREPARATION"));
  await t.f1.commit(t.p, t.s, stageCmd);
  await assert.rejects(t.app.commit(t.p, t.s, station), code("STALE_PREPARATION"));
  const renewed = await prepared(t);
  await t.app.commit(t.p, t.s, { ...renewed, commandId: station.commandId });
  assert.equal(t.store.inspectSnapshot().receipts, 1);
  assert.equal(t.store.inspectSnapshot().stationReceipts, 1);
  const reverse = await setup();
  const sv = await reverse.f1.validate(reverse.p, reverse.s, d);
  await reverse.app.commit(reverse.p, reverse.s, await prepared(reverse));
  await assert.rejects(reverse.f1.commit(reverse.p, reverse.s, { ...stageCmd, validationToken: sv.validationToken,
    fingerprint: sv.fingerprint }), code("STALE_PREPARATION"));
});
test("F2 minute transition, equality+1ms and expiry require new preparation", async () => {
  for (const delta of [1, 120000]) {
    const t = await setup(), cmd = await prepared(t);
    t.clock.time += delta;
    await assert.rejects(t.app.commit(t.p, t.s, cmd), code("STALE_PREPARATION"));
  }
  const t = await setup(); t.clock.time += 1000;
  const cmd = await prepared(t, true); t.clock.time += 59000;
  await assert.rejects(t.app.commit(t.p, t.s, cmd), code("STALE_PREPARATION"));
});
test("F2 scoped access and strict request grammar", async () => {
  const t = await setup();
  await assert.rejects(t.app.context({}, t.s), code("UNAUTHENTICATED"));
  const real = { ...t.p, synthetic: false, provider: "real", capabilities: t.p.capabilities.filter(c => c !== "attendance-station-arrival:prepare") };
  await assert.rejects(t.app.context(real, t.s), code("FORBIDDEN"));
  await assert.rejects(t.app.commit({ ...real, capabilities: ["attendance-station-arrival:prepare"] }, t.s, await prepared(t)), code("FORBIDDEN"));
  await assert.rejects(t.app.context({ ...t.p, resourceScope: { orgUnitIds: ["0099"] } }, t.s), code("SHIFT_DAY_NOT_FOUND"));
  await assert.rejects(t.app.context(t.p, { ...t.s, employeeId: "9999" }), code("SHIFT_DAY_NOT_FOUND"));
  assert.throws(() => stationDraft({ lateReasonCode: null, lateRemark: null }), code("INVALID_REQUEST"));
  const cmd = await prepared(t);
  assert.throws(() => stationCommand({ ...cmd, confirmation: { accepted: true, warningCodes: ["STAGE_ARRIVAL_LATE"] } }), code("INVALID_REQUEST"));
});

for (const point of ["reserved", "decided", "staged", "installed"] as const) {
  for (const ambient of [false, true]) {
    test(`F2 ${ambient ? "ALS" : "explicit"} cancellation at ${point}: atomic zero or UNKNOWN1`, async () => {
      const abort = new AbortController(), live = new AbortController();
      const t = await setup(p => { if (p === point) abort.abort(); });
      const cmd = await prepared(t);
      const run = () => t.app.commit(t.p, t.s, cmd, ambient ? live.signal : abort.signal);
      const result = ambient ? withRequestBudget(abort.signal, 5000, run) : run();
      await assert.rejects(result, code(point === "installed" ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT"));
      const snap = t.store.inspectSnapshot();
      assert.equal(snap.stationReceipts, point === "installed" ? 1 : 0);
      assert.equal(snap.stationAudits, snap.stationReceipts);
      assert.equal(snap.rows[0].attendance?.stationArrivalLocal !== null, point === "installed");
      assert.equal(snap.active, 0);
    });
  }
}
test("F2 UNKNOWN retained replay stays operation scoped", async () => {
  let fail = true;
  const t = await setup(point => { if (fail && point === "installed") { fail = false; throw Error("isolated loss"); } });
  const cmd = await prepared(t);
  await assert.rejects(t.app.commit(t.p, t.s, cmd), code("COMMAND_OUTCOME_UNKNOWN"));
  assert.equal((await t.app.commit(t.p, t.s, cmd)).replayed, true);
  assert.equal(t.store.inspectSnapshot().receipts, 0);
});
test("F2 shared tuple reservation excludes F1 and F2 concurrently", async () => {
  const t = await setup(), cmd = await prepared(t);
  const d = { lateReasonCode: null, lateRemark: null }, v = await t.f1.validate(t.p, t.s, d);
  const first = t.app.commit(t.p, t.s, cmd);
  await assert.rejects(t.f1.commit(t.p, t.s, { commandId: randomUUID(), draft: d,
    fingerprint: v.fingerprint, validationToken: v.validationToken, confirmation: null }), code("COMMAND_IN_PROGRESS"));
  await first;
});
test("F2 coherent envelope rejects unmatched, duplicate, omitted and orphan facts", () => {
  const valid = { stageRows: [structuredClone(sampleStageArrivalFacts)], stationFacts: [extra()] };
  assert.equal(stationEnvelope(valid).stageRows.length, 1);
  for (const value of [
    { ...valid, stationFacts: [] },
    { ...valid, stageRows: [...valid.stageRows, ...valid.stageRows], stationFacts: [...valid.stationFacts, ...valid.stationFacts] },
    { ...valid, stationFacts: [{ ...extra(), employeeId: "999" }] },
    { ...valid, stationFacts: [{ ...extra(), stationArrivalUser: "orphan" }] },
    { ...valid, stationFacts: [{ ...extra(), locked: undefined }] },
    { ...valid, unknown: true },
  ]) assert.throws(() => stationEnvelope(value), code("INVALID_SOURCE_DATA"));
});
test("F2 exact 11 rights, disabled7, F1-only9; native/Oracle/production modes reject F2", async () => {
  assert.equal((await new SyntheticAdministratorProvider(config).authenticate({ authorization: null })).capabilities.length, 11);
  assert.equal((await new SyntheticAdministratorProvider(sampleStageArrivalConfig).authenticate({ authorization: null })).capabilities.length, 9);
  const disabled = { ...sampleStageArrivalConfig, attendanceStageArrivalMode: "disabled" };
  assert.equal((await new SyntheticAdministratorProvider(disabled).authenticate({ authorization: null })).capabilities.length, 7);
  for (const bad of [
    { ...config, attendanceStageArrivalMode: "disabled" }, { ...config, attendanceStageArrivalMode: "test-oracle-controlled" },
    { ...config, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true },
    { ...config, deploymentClass: "production" }, { ...config, attendanceStationArrivalMode: "native" },
    { ...config, syntheticAdministratorEnabled: false },
  ]) assert.throws(() => validateRuntimeConfig(bad));
  const t = await setup(), adapters = stageArrivalReadAdapters(t.store);
  const runtime = await createRuntime(config, adapters.detail, undefined, { reader: adapters.current,
    attendanceReader: adapters.attendance, clock: t.clock, stageArrivalStore: t.store });
  assert.equal((await runtime.authenticate({ authorization: null })).capabilities.length, 11);
  assert.equal((await runtime.stationArrivalContext(t.p, t.s)).dataSource, "isolated-fixture");
  for (const mode of ["disabled", "isolated-fixture", "test-oracle-controlled"] as const) {
    assert.throws(() => validatePrincipal(t.p, mode), SliceError);
    assert.throws(() => validatePrincipal({ ...t.p, synthetic: false, provider: "real" }, mode), SliceError);
  }
});

test("F2 full base+extra comparisons invalidate despite unchanged revision", async () => {
  for (const mutation of [
    (value: { stageRows: typeof sampleStageArrivalFacts[]; stationFacts: StationArrivalFixtureExtraV1[] }) => {
      value.stationFacts[0].policyRevision = "updated-policy";
    },
    (value: { stageRows: typeof sampleStageArrivalFacts[]; stationFacts: StationArrivalFixtureExtraV1[] }) => {
      value.stationFacts[0].locked = true;
    },
    (value: { stageRows: typeof sampleStageArrivalFacts[]; stationFacts: StationArrivalFixtureExtraV1[] }) => {
      value.stageRows[0].lateReasonOptions[0].label = "changed synthetic label";
    },
  ]) {
    const t = await setup(), cmd = await prepared(t);
    t.store.reviseStationForIsolatedTest(mutation);
    await assert.rejects(t.app.commit(t.p, t.s, cmd), code("STALE_PREPARATION"));
    assert.equal(t.store.inspectSnapshot().stationReceipts, 0);
  }
});
test("F2 validates a fresh timestamp within same warning bucket and preserves overnight/leap dates", async () => {
  const t = await setup();
  t.clock.time += 1000;
  const cmd = await prepared(t, true); t.clock.time += 20000;
  const r = await t.app.commit(t.p, t.s, cmd);
  assert.equal(r.recorded.stationArrivalLocal, "2026-10-20T10:30:21");
  assert.equal(r.recorded.stationLate?.minutes, "0");
  const overnight = structuredClone(sampleStageArrivalFacts);
  overnight.planned = { startLocal: "2028-02-29T23:00:00", endLocal: "2028-03-01T05:00:00" };
  assert.equal(stationClassify(overnight, new Date("2028-03-01T00:00:00Z"), "UTC").withinArrivalWindow, true);
  assert.throws(() => stationClassify(overnight, new Date("invalid"), "UTC"), code("INVALID_SOURCE_DATA"));
});
test("F2 startup rejects DST folds/gaps, impossible source and time ordering", () => {
  for (const plan of [
    { startLocal: "2026-03-08T02:30:00", endLocal: "2026-03-08T04:30:00" },
    { startLocal: "2026-11-01T01:30:00", endLocal: "2026-11-01T04:30:00" },
    { startLocal: "2026-02-29T01:30:00", endLocal: "2026-02-29T04:30:00" },
  ]) {
    const row = structuredClone(sampleStageArrivalFacts); row.planned = plan;
    assert.throws(() => createStationArrivalFixture({ stageRows: [row], stationFacts: [extra()] },
      new FixedClock(), "America/New_York"), code("INVALID_SOURCE_DATA"));
  }
  const row = structuredClone(sampleStageArrivalFacts), x = extra();
  row.attendance!.stageArrivalLocal = "2026-10-20T11:00:00"; row.attendance!.stageArrivalUser = "synthetic:prior";
  row.attendance!.stationArrivalLocal = "2026-10-20T10:00:00"; x.stationArrivalUser = "synthetic:prior";
  assert.throws(() => createStationArrivalFixture({ stageRows: [row], stationFacts: [x] }, new FixedClock(), "UTC"),
    code("INVALID_SOURCE_DATA"));
});
test("F2 process restart/source and grant changes cannot reuse preparation or disclose retained receipt", async () => {
  const a = await setup(), cmd = await prepared(a), b = await setup();
  await assert.rejects(b.app.commit(b.p, b.s, cmd), code("STALE_PREPARATION"));
  await a.app.commit(a.p, a.s, cmd);
  await assert.rejects(a.app.commit({ ...a.p, resourceScope: { orgUnitIds: ["0021", "0022"] } }, a.s, cmd),
    code("COMMAND_ID_CONFLICT"));
  a.clock.time += 900000;
  await assert.rejects(a.app.commit(a.p, a.s, cmd), code("ALREADY_REGISTERED"));
  assert.deepEqual([a.store.inspectSnapshot().stationReceipts, a.store.inspectSnapshot().stationAudits], [0, 0]);
});
test("F2 shared preparation capacity1000 across operations fails before effect and expires", async () => {
  const t = await setup();
  for (let i = 0; i < 999; i++)
    t.store.reservePreparation(`isolated-${i}`, "2026-10-20T10:30:00.001Z", "2026-10-20T10:30:00.000Z");
  await t.f1.validate(t.p, t.s, { lateReasonCode: null, lateRemark: null });
  await assert.rejects(t.app.validate(t.p, t.s, { lateReasonCode: null }), code("DEPENDENCY_UNAVAILABLE"));
  assert.equal(t.store.inspectSnapshot().stationReceipts, 0);
  t.clock.time += 1000;
  assert.equal((await t.app.validate(t.p, t.s, { lateReasonCode: "1" })).warnings[0].minutes, "0");
});
for (const point of ["before-call", "reservation-wait", "decided", "staged", "installed"] as const) {
  test(`F2 runtime independent ALS deadline at ${point} preserves synchronous final guard`, async () => {
    const t = await setup(p => {
      if (p === point) {
        const budget = currentRequestBudget(); assert.ok(budget); budget.deadline = performance.now() - 1;
      }
    });
    const adapters = stageArrivalReadAdapters(t.store);
    const rt = await createRuntime(config, adapters.detail, undefined, { reader: adapters.current,
      attendanceReader: adapters.attendance, stageArrivalStore: t.store, clock: t.clock });
    const validation = await rt.stationArrivalValidate(t.p, t.s, { lateReasonCode: null });
    const cmd: StationArrivalCommitV1 = { commandId: randomUUID(), draft: { lateReasonCode: null },
      fingerprint: validation.fingerprint, validationToken: validation.validationToken, confirmation: null };
    const signal = new AbortController();
    await assert.rejects(withRequestBudget(new AbortController().signal, 5000, async () => {
      const budget = currentRequestBudget(); assert.ok(budget);
      if (point === "before-call") budget.deadline = performance.now() - 1;
      const work = rt.stationArrivalCommit(t.p, t.s, cmd, signal.signal);
      if (point === "reservation-wait") budget.deadline = performance.now() - 1;
      return work;
    }), code(point === "installed" ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT"));
    assert.equal(t.store.inspectSnapshot().stationReceipts, point === "installed" ? 1 : 0);
    assert.equal(t.store.inspectSnapshot().active, 0);
  });
}
for (const point of ["reserved", "decided", "staged"] as const) {
  test(`F2 isolated fault at ${point} preserves atomic snapshot and releases ownership`, async () => {
    const t = await setup(p => { if (p === point) throw Error("isolated injected failure"); });
    const before = t.store.inspectSnapshot(), cmd = await prepared(t);
    await assert.rejects(t.app.commit(t.p, t.s, cmd), e => e instanceof StageArrivalError &&
      e.code === "INTERNAL_ERROR" && e.effect === (point === "staged" ? "rolled-back" : "none"));
    assert.deepEqual(t.store.inspectSnapshot(), before);
  });
}
test("F2 final full-original compare rejects a change after private staging", async () => {
  let owner: MemoryStageArrivalStore | undefined;
  const t = await setup(point => {
    if (point === "staged") owner!.reviseStationForIsolatedTest(v => { v.stationFacts[0].policyRevision = "changed-under-owner"; });
  });
  owner = t.store;
  await assert.rejects(t.app.commit(t.p, t.s, await prepared(t)), code("STALE_PREPARATION"));
  const s = t.store.inspectSnapshot();
  assert.equal(s.rows[0].attendance?.stationArrivalLocal, null);
  assert.deepEqual([s.stationReceipts, s.stationAudits, s.active], [0, 0, 0]);
});
