import test from "node:test";
import assert from "node:assert/strict";
import { validateStageArrivalMode } from "../stage-arrival-validation.mts";
import { sampleStageArrivalConfig } from "../stage-arrival-sample.mts";
import { sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { MemoryStageArrivalStore, MemoryStageArrivalTokens } from "../stage-arrival-memory.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { createStageArrivalFixture } from "../stage-arrival-fixture.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { stageArrivalAccessPolicy } from "../access-policy.mts";
import { validatePrincipal } from "../contract-validation.mts";
import { command, draft, facts, parseStageJson, selection } from "../stage-arrival-validation.mts";
import { classify, instantFor } from "../stage-arrival-domain.mts";
import type { StageArrivalCommandBindingV1, StageArrivalFactsV1 } from "../stage-arrival-contracts.mts";
import type { PrincipalV1 } from "../contracts.mts";
import { SliceError } from "../errors.mts";
import { currentRequestBudget, withRequestBudget } from "../request-budget-context.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { VirtualClock, clean, late, selected, principal, commitInput, fixture, cancellationFixture } from "./stage-arrival-helpers.mts";
const code = (c: string) => ({ code: c });
function zero(store: MemoryStageArrivalStore) {
  const s = store.inspectSnapshot();
  assert.equal(s.receipts, 0); assert.equal(s.audits, 0); assert.equal(s.active, 0);
  assert.equal(s.rows[0]?.attendance?.stageArrivalLocal ?? null, null);
}

test("F01 mode defaults disabled and rejects Oracle, production and implicit opt-in", () => {
  assert.equal(validateStageArrivalMode({}), "disabled");
  assert.equal(validateStageArrivalMode(sampleStageArrivalConfig), "isolated-fixture");
  for (const patch of [{ dataSource: "oracle-read-only" }, { deploymentClass: "production" },
    { authenticationMode: "real" }, { syntheticAdministratorEnabled: false },
    { attendanceStageArrivalMode: "native" }, { nativeWriteAdapter: {} }, { oracleTestScopeConfirmed: true }])
    assert.throws(() => validateStageArrivalMode({ ...sampleStageArrivalConfig, ...patch }));
});

test("F01 exact nine enabled, seven disabled/Oracle; null actor and no Administrator fallback", async () => {
  const enabled = await principal();
  assert.deepEqual(enabled.capabilities, ["shift-day:read", "current-shifts:read", "shift-search:read",
    "my-shifts:read", "shift-items:read", "employee:read", "attendance:read",
    "attendance-stage-arrival:prepare", "attendance-stage-arrival:commit"]);
  assert.equal(enabled.employeeId, null); validatePrincipal(enabled, "isolated-fixture");
  const { attendanceStageArrivalMode: _, ...disabled } = sampleStageArrivalConfig;
  for (const config of [disabled, { ...disabled, dataSource: "oracle-read-only", oracleTestScopeConfirmed: true }]) {
    const p = await new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
    assert.equal(p.capabilities.length, 7); validatePrincipal(p, "disabled");
    assert.throws(() => validatePrincipal(enabled, "disabled"), code("UNAUTHENTICATED"));
  }
  const rt = await createRuntime(disabled, new FixtureReader([]));
  assert.throws(() => rt.stageArrivalContext(enabled, selected), code("LIVE_WRITES_DISABLED"));
  await assert.rejects(createRuntime(sampleStageArrivalConfig, new FixtureReader([])));
  const real = { deploymentClass: "isolated-test-demo", authenticationMode: "real", syntheticAdministratorEnabled: false,
    realProviderId: "test-only", businessTimeZone: "Asia/Jerusalem", dataSource: "isolated-fixture" };
  await assert.rejects(createRuntime(real, new FixtureReader([])));
  const failed = await createRuntime(real, new FixtureReader([]), async () => ({
    authenticate: async () => { throw new Error("not a credential verification"); },
  }));
  await assert.rejects(failed.authenticate({ authorization: null }), code("DEPENDENCY_UNAVAILABLE"));
  const bad = await createRuntime(real, new FixtureReader([]), async () => ({
    authenticate: async () => { throw new SliceError("UNAUTHENTICATED"); },
  }));
  await assert.rejects(bad.authenticate({ authorization: null }), code("UNAUTHENTICATED"));
});

test("F02 independent prepare/commit and early admission before context/store; no role bypass", async () => {
  const p: PrincipalV1 = { ...await principal(), provider: "real", synthetic: false, roles: ["Administrator"] };
  const f = fixture(); let reads = 0;
  const original = f.store.read.bind(f.store);
  f.store.read = async (...args) => { reads++; return original(...args); };
  for (const caps of [[], ["attendance:read"] as const, ["attendance-stage-arrival:commit"] as const]) {
    const missing = { ...p, capabilities: [...caps] };
    await assert.rejects(f.app.context(missing, selected), code("FORBIDDEN"));
    await assert.rejects(f.app.validate(missing, selected, clean), code("FORBIDDEN"));
  }
  const prepareOnly: PrincipalV1 = { ...p, capabilities: ["attendance-stage-arrival:prepare"] };
  const validation = await f.app.validate(prepareOnly, selected, clean); assert.equal(validation.state, "ready");
  const before = reads;
  await assert.rejects(f.app.commit(prepareOnly, selected, commitInput(validation)), code("FORBIDDEN"));
  assert.equal(reads, before); assert.equal(before, 1);
  stageArrivalAccessPolicy.requirePrepare(prepareOnly);
  assert.throws(() => stageArrivalAccessPolicy.requireCommit(prepareOnly), code("FORBIDDEN"));
  zero(f.store);
});

test("F02 exact scope and three resource keys, no parent/prefix/personal ID inference", async () => {
  const p = await principal(), f = fixture();
  for (const target of [{ ...selected, employeeId: "9002" }, { ...selected, shiftDayId: "6202" },
    { ...selected, employeeId: "123456789" }])
    await assert.rejects(f.app.context(p, target), code("SHIFT_DAY_NOT_FOUND"));
  for (const units of [["0012"], ["002"], ["00210"], []]) {
    const real: PrincipalV1 = { ...p, synthetic: false, provider: "real", resourceScope: { orgUnitIds: units } };
    await assert.rejects(f.app.context(real, selected), code("SHIFT_DAY_NOT_FOUND"));
  }
  const malformed = structuredClone(sampleStageArrivalFacts);
  malformed.attendance!.attendanceKey.shiftDayId = "6202";
  assert.throws(() => fixture([malformed]), code("INVALID_SOURCE_DATA"));
  zero(f.store);
});

test("F03 context/validation/cancel are pure; explicit clean commit exactly one + replay after token expiry", async () => {
  const p = await principal(), f = fixture(), before = f.store.inspectSnapshot();
  const context = await f.app.context(p, selected);
  assert.equal(context.eligibility, "eligible"); assert.equal(context.dataSource, "isolated-fixture");
  const v = await f.app.validate(p, selected, clean);
  assert.equal(v.state, "ready"); assert.deepEqual(v.warnings, []); assert.equal(v.confirmationRequired, false);
  assert.match(v.validationToken, /^[A-Za-z0-9_-]{43}$/); assert.match(v.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt), 120000);
  assert.deepEqual(f.store.inspectSnapshot(), before); // Cancel = no command.
  f.clock.advance(5100);
  const cmd = commitInput(v), receipt = await f.app.commit(p, selected, cmd);
  assert.equal(receipt.recorded.stageArrivalLocal, "2026-10-20T10:22:05");
  assert.equal(receipt.committedAt, "2026-10-20T07:22:05.100Z");
  assert.equal(receipt.partnerCompletion, "not-invoked"); assert.equal(receipt.outcome, "fixture-committed");
  const s = f.store.inspectSnapshot(); assert.equal(s.receipts, 1); assert.equal(s.audits, 1);
  assert.equal(s.rows.length, 1); assert.deepEqual(s.rows[0].attendance?.attendanceKey, { shiftDayId: "6201" });
  assert.equal(s.rows[0].attendance?.stageArrivalUser, p.displayName);
  assert.equal((await f.app.context(p, selected)).eligibility, "already-recorded");
  f.clock.advance(121000);
  assert.equal((await f.app.commit(p, selected, cmd)).replayed, true);
  assert.equal(f.store.inspectSnapshot().receipts, 1);
  await assert.rejects(f.app.commit(p, selected, { ...cmd, commandId: "22222222-2222-4222-8222-222222222222" }), code("ALREADY_REGISTERED"));
});

test("F04 late warning before write; reason/ack/cancel zero, explicit exact confirmation one", async () => {
  const row = structuredClone(sampleStageArrivalFacts); row.planned.startLocal = "2026-10-20T10:00:00";
  const f = fixture([row]), p = await principal();
  await assert.rejects(f.app.validate(p, selected, clean), code("BUSINESS_VALIDATION_FAILED"));
  await assert.rejects(f.app.validate(p, selected, { ...late, lateReasonCode: "2" }), code("BUSINESS_VALIDATION_FAILED"));
  const v = await f.app.validate(p, selected, late);
  assert.deepEqual(v.warnings, [{ code: "STAGE_ARRIVAL_LATE", minutes: "22" }]);
  assert.equal(v.state, "warning-requires-confirmation"); zero(f.store);
  const cmd = commitInput(v, late);
  await assert.rejects(f.app.commit(p, selected, { ...cmd, confirmation: null }), code("CONFIRMATION_REQUIRED"));
  zero(f.store); // dialog cancellation has no API and no lock/reservation.
  f.clock.advance(5000);
  const r = await f.app.commit(p, selected, cmd);
  assert.deepEqual(r.recorded.stageLate, { reasonCode: "1", minutes: "22", remark: null });
  assert.equal(f.store.inspectSnapshot().audits, 1);
  const onTime = fixture(); await assert.rejects(onTime.app.validate(p, selected, late), code("BUSINESS_VALIDATION_FAILED"));
});

test("F05 two tokens concurrent on same attendance: one write, collision bounded, mutex released", async () => {
  const f = fixture(), p = await principal();
  const a = await f.app.validate(p, selected, clean), b = await f.app.validate(p, selected, clean);
  const results = await Promise.allSettled([
    f.app.commit(p, selected, commitInput(a)),
    f.app.commit(p, selected, commitInput(b, clean, "22222222-2222-4222-8222-222222222222")),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const rejected = results.find(r => r.status === "rejected");
  assert.ok(rejected && rejected.status === "rejected");
  assert.equal(Reflect.get(rejected.reason, "code"), "COMMAND_IN_PROGRESS");
  assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
  assert.equal(f.store.inspectSnapshot().active, 0);
  const replay = await f.app.commit(p, selected, commitInput(a)); assert.equal(replay.replayed, true);
});

test("F05 same in-flight command/key mismatch and retained payload mismatch do not leak receipts", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean), c = commitInput(v);
  const first = f.app.commit(p, selected, c);
  await assert.rejects(f.app.commit(p, selected, { ...c, fingerprint: "a".repeat(64) }), code("COMMAND_ID_CONFLICT"));
  await first;
  await assert.rejects(f.app.commit(p, selected, { ...c, draft: late }), code("COMMAND_ID_CONFLICT"));
  const other: PrincipalV1 = { ...p, provider: "real", synthetic: false, subject: "other-session" };
  await assert.rejects(f.app.commit(other, selected, c), code("ALREADY_REGISTERED"));
  assert.equal(f.store.inspectSnapshot().receipts, 1);
});

test("F06 token opaque binding: forged, actor/grants/draft/scope/fingerprint/session mismatch zero", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean), c = commitInput(v);
  for (const patch of [{ validationToken: "a".repeat(43) }, { fingerprint: "a".repeat(64) },
    { draft: late }])
    await assert.rejects(f.app.commit(p, selected, { ...c, ...patch }), code("STALE_PREPARATION"));
  const other: PrincipalV1 = { ...p, provider: "real", synthetic: false, subject: "other" };
  await assert.rejects(f.app.commit(other, selected, c), code("STALE_PREPARATION"));
  const grants: PrincipalV1 = { ...other, subject: p.subject, resourceScope: { orgUnitIds: ["0021", "0022"] } };
  await assert.rejects(f.app.commit(grants, selected, c), code("STALE_PREPARATION"));
  const second = fixture();
  await assert.rejects(second.app.commit(p, selected, c), code("STALE_PREPARATION"));
  zero(f.store); zero(second.store);
});

test("F06 original facts/policy/catalog/revision/current state race under ownership is stale or already", async () => {
  const edits: Array<(f: StageArrivalFactsV1) => void> = [
    f => { f.policy.configuredMinutes = 1; }, f => { f.policy.revision = "2"; },
    f => { f.planned.startLocal = "2026-10-20T10:29:00"; }, f => { f.revision = "2"; },
    f => { f.missingPresent = true; }, f => { f.outstandingReportsPresent = true; },
    f => { f.attendance = null; }, f => { f.attendance!.briefing = true; },
    f => { f.lateReasonOptions[0].label = "שינוי"; },
  ];
  const p = await principal();
  for (const edit of edits) {
    const f = fixture(), v = await f.app.validate(p, selected, clean);
    f.store.reviseForIsolatedTest(rows => edit(rows[0]));
    await assert.rejects(f.app.commit(p, selected, commitInput(v)), code("STALE_PREPARATION")); zero(f.store);
  }
  let f: ReturnType<typeof fixture>;
  f = fixture(undefined, point => { if (point === "reserved") f.store.reviseForIsolatedTest(rows => { rows[0].revision = "race"; }); });
  const v = await f.app.validate(p, selected, clean);
  await assert.rejects(f.app.commit(p, selected, commitInput(v)), code("STALE_PREPARATION")); zero(f.store);
});

test("F07 exact 120 seconds and earliest minute transition expiry, strict equality/subsecond minutes zero", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean);
  f.clock.advance(120000);
  await assert.rejects(f.app.commit(p, selected, commitInput(v)), code("STALE_PREPARATION")); zero(f.store);
  const row = structuredClone(sampleStageArrivalFacts); row.planned.startLocal = "2026-10-20T10:22:00";
  const eq = fixture([row]);
  const onTime = await eq.app.validate(p, selected, clean);
  assert.equal(onTime.state, "ready");
  assert.equal(Date.parse(onTime.expiresAt) - Date.parse(onTime.evaluatedAt), 1);
  eq.clock.advance(1);
  await assert.rejects(eq.app.commit(p, selected, commitInput(onTime)), code("STALE_PREPARATION"));
  const subsecond = await eq.app.validate(p, selected, late);
  assert.deepEqual(subsecond.warnings, [{ code: "STAGE_ARRIVAL_LATE", minutes: "0" }]);
  assert.equal(subsecond.expiresAt, "2026-10-20T07:23:00.000Z");
  eq.clock.advance(59999);
  await assert.rejects(eq.app.commit(p, selected, commitInput(subsecond, late)), code("STALE_PREPARATION")); zero(eq.store);
});

test("F07 zone gaps/folds and invalid clock/policy fail closed, never guessed eligibility", () => {
  assert.throws(() => instantFor("2026-03-08T02:30:00", "America/New_York"), code("INVALID_SOURCE_DATA"));
  assert.throws(() => instantFor("2026-11-01T01:30:00", "America/New_York"), code("INVALID_SOURCE_DATA"));
  assert.throws(() => classify(sampleStageArrivalFacts, new Date(NaN), "Asia/Jerusalem"), code("INVALID_SOURCE_DATA"));
  assert.equal(instantFor("2026-10-20T10:22:00", "Asia/Jerusalem"), Date.parse("2026-10-20T07:22:00Z"));
});

test("F08 every pre-install fault is atomic zero; staged rollback and released lock", async () => {
  const p = await principal();
  for (const point of ["reserved", "decided", "staged"] as const) {
    let inject = true;
    const f = fixture(undefined, at => { if (at === point && inject) throw Error("isolated test fault"); });
    const v = await f.app.validate(p, selected, clean);
    await assert.rejects(f.app.commit(p, selected, commitInput(v)),
      { code: "INTERNAL_ERROR", effect: point === "staged" ? "rolled-back" : "none" });
    zero(f.store); inject = false;
    await f.app.commit(p, selected, commitInput(v));
    assert.equal(f.store.inspectSnapshot().receipts, 1);
  }
});

test("F09 lost acknowledgment after atomic install UNKNOWN, no false zero/automatic retry; context truthful", async () => {
  let lose = true;
  const f = fixture(undefined, point => { if (point === "installed" && lose) throw Error("lost ack"); });
  const p = await principal(), v = await f.app.validate(p, selected, clean);
  await assert.rejects(f.app.commit(p, selected, commitInput(v)),
    { code: "COMMAND_OUTCOME_UNKNOWN", effect: "unknown" });
  const s = f.store.inspectSnapshot();
  assert.equal(s.receipts, 1); assert.equal(s.audits, 1); assert.equal(s.active, 0);
  assert.equal((await f.app.context(p, selected)).recorded.stageArrivalLocal, "2026-10-20T10:22:00");
  lose = false;
  // This is a direct port replay test, NOT an automatic retry or a new API.
  assert.equal((await f.app.commit(p, selected, commitInput(v))).replayed, true);
  assert.equal(f.store.inspectSnapshot().receipts, 1);
});

test("F09 deterministic deadlines/abort before vs after effect, no late success and lock release", async () => {
  const p = await principal();
  for (const point of ["reserved", "staged", "installed"] as const) {
    const ac = new AbortController();
    const f = fixture(undefined, at => { if (point === at) ac.abort(); });
    const v = await f.app.validate(p, selected, clean);
    await assert.rejects(withRequestBudget(ac.signal, 5000, () => f.app.commit(p, selected, commitInput(v), ac.signal)),
      { code: point === "installed" ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT",
        effect: point === "installed" ? "unknown" : "none" });
    assert.equal(f.store.inspectSnapshot().active, 0);
    if (point === "installed") assert.equal(f.store.inspectSnapshot().audits, 1); else zero(f.store);
  }
  const f = fixture(), v = await f.app.validate(p, selected, clean);
  await assert.rejects(withRequestBudget(new AbortController().signal, -1,
    () => f.app.commit(p, selected, commitInput(v))), code("DEPENDENCY_TIMEOUT")); zero(f.store);
});

test("F10 existing row only; every deferred prerequisite and duplicate rejected, no insert/merge", async () => {
  const p = await principal();
  const edits: Array<(f: StageArrivalFactsV1) => void> = [
    f => { f.attendance = null; }, f => { f.missingPresent = true; },
    f => { f.outstandingReportsPresent = true; }, f => { f.splitOrP2 = true; },
    f => { f.cancelledOrNonActivityDay = true; }, f => { f.attendance!.briefing = true; },
    f => { f.attendance!.stationArrivalLocal = "2026-10-20T10:21:00"; },
    f => { f.attendance!.stationExitLocal = "2026-10-20T10:21:00"; },
    f => { f.attendance!.stageLateMinutes = "1"; },
  ];
  for (const edit of edits) {
    const row = structuredClone(sampleStageArrivalFacts); edit(row); const f = fixture([row]);
    assert.equal((await f.app.context(p, selected)).eligibility, "deferred");
    await assert.rejects(f.app.validate(p, selected, clean), code("COMMAND_SCOPE_DEFERRED")); zero(f.store);
  }
  const duplicate = fixture([sampleStageArrivalFacts, sampleStageArrivalFacts]);
  await assert.rejects(duplicate.app.context(p, selected), code("AMBIGUOUS_ATTENDANCE")); zero(duplicate.store);
});

test("F10 strict unknown input and source validation including duplicate decoded keys; no coercion", () => {
  for (const input of [null, {}, { ...clean, extra: null }, { ...clean, lateReasonCode: 1 },
    { ...clean, lateRemark: "a\nb" }, { ...clean, lateRemark: "<script>" },
    { ...clean, lateRemark: "a".repeat(501) }, { ...clean, lateRemark: "\ud800" },
    { ...clean, signal: { aborted: false } }])
    assert.throws(() => draft(input), code("INVALID_REQUEST"));
  for (const s of [{ employeeId: "09001", shiftDayId: "6201" }, { employeeId: 9001, shiftDayId: "6201" },
    { employeeId: "9001", shiftDayId: "62010000000" }, { ...selected, actAs: "9001" }])
    assert.throws(() => selection(s), code("INVALID_REQUEST"));
  for (const json of ['{"lateReasonCode":null,"lateReasonCode":null,"lateRemark":null}',
    '{"lateReasonCode":null,"\\u006cateReasonCode":null,"lateRemark":null}',
    '{"x":{"a":1,"a":2}}', '{"x":1,}', "null false", "[".repeat(20) + "]".repeat(20)])
    assert.throws(() => parseStageJson(json), code("INVALID_REQUEST"));
  assert.deepEqual(parseStageJson(JSON.stringify(clean)), clean);
  assert.throws(() => command({ commandId: "forged" }), code("INVALID_REQUEST"));
  for (const patch of [{ source: { ...sampleStageArrivalFacts.source, dataSource: "oracle" } },
    { policy: { revision: "1", configuredMinutes: "0" } }, { missingPresent: "false" },
    { lateReasonOptions: null }, { lateReasonOptions: Array(101).fill({ code: "1", label: null }) },
    { lateReasonOptions: [{ code: "1", label: null }, { code: "1", label: null }] }])
    assert.throws(() => facts({ ...sampleStageArrivalFacts, ...patch }), code("INVALID_SOURCE_DATA"));
});

test("F10 bounded tokens TTL, immutable binding and receipt retention/process isolation", async () => {
  const clock = new VirtualClock(), tokens = new MemoryStageArrivalTokens(clock), f = fixture(), p = await principal();
  const v = await f.app.validate(p, selected, clean);
  const binding = {
    source: f.store.source, actor: { subject: p.subject, provider: p.provider, synthetic: p.synthetic, authorizedTeamIds: ["0021"] },
    facts: sampleStageArrivalFacts, draft: clean, evaluatedAt: v.evaluatedAt, evaluatedLocal: v.evaluatedLocal,
    businessTimeZone: v.businessTimeZone, warnings: [], confirmationRequired: false,
    fingerprint: v.fingerprint, expiresAt: v.expiresAt, nextWarningOrMinuteTransitionAt: null,
  };
  const first = tokens.issue(binding);
  for (let i = 1; i < 1000; i++) tokens.issue(binding);
  assert.equal(tokens.size, 1000);
  assert.throws(() => tokens.issue(binding), code("DEPENDENCY_UNAVAILABLE"));
  const copy = tokens.find(first)!; copy.draft.lateReasonCode = "999";
  assert.equal(tokens.find(first)?.draft.lateReasonCode, null);
  clock.advance(120000); assert.equal(tokens.find(first), null); assert.equal(tokens.size, 0);
  const c = commitInput(v); await f.app.commit(p, selected, c); f.clock.advance(900000);
  await assert.rejects(f.app.commit(p, selected, c), code("ALREADY_REGISTERED"));
  assert.equal(f.store.inspectSnapshot().receipts, 0); assert.equal(f.store.inspectSnapshot().audits, 0);
});

test("F01 coherent runtime/source/session construction rejects mixed, native or foreign read adapters", async () => {
  const clock = new VirtualClock(), a = createStageArrivalFixture([sampleStageArrivalFacts], clock);
  const b = createStageArrivalFixture([sampleStageArrivalFacts], clock);
  const rt = await createRuntime(sampleStageArrivalConfig, a.detail, undefined,
    { reader: a.current, clock, attendanceReader: a.attendance, stageArrivalStore: a.store });
  assert.equal((await rt.authenticate({ authorization: null })).capabilities.length, 9);
  await assert.rejects(createRuntime(sampleStageArrivalConfig, a.detail, undefined,
    { reader: b.current, clock, stageArrivalStore: a.store }));
  await assert.rejects(createRuntime(sampleStageArrivalConfig, new FixtureReader([]), undefined,
    { reader: a.current, clock, stageArrivalStore: a.store }));
  await assert.rejects(createRuntime(sampleStageArrivalConfig, a.detail, undefined,
    { reader: a.current, clock: new VirtualClock(), stageArrivalStore: a.store }));
  const nativeOptions = { reader: a.current, clock, nativeWriteAdapter: { dataSource: "oracle" } };
  await assert.rejects(createRuntime(sampleStageArrivalConfig, a.detail, undefined, nativeOptions));
});

test("F05 identical simultaneous command reports in-progress, retained identical reply one effect", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean), c = commitInput(v);
  const pending = f.app.commit(p, selected, c);
  await assert.rejects(f.app.commit(p, selected, c), code("COMMAND_IN_PROGRESS"));
  await pending;
  assert.equal((await f.app.commit(p, selected, c)).replayed, true);
  assert.equal(f.store.inspectSnapshot().audits, 1);
  const wrongScope: PrincipalV1 = { ...p, provider: "real", synthetic: false, resourceScope: { orgUnitIds: ["0012"] } };
  await assert.rejects(f.app.commit(wrongScope, selected, c), code("SHIFT_DAY_NOT_FOUND"));
});

test("F07 fresh Clock sampled under the owned mutex, not preview or request start", async () => {
  let f: ReturnType<typeof fixture>;
  f = fixture(undefined, point => { if (point === "reserved") f.clock.advance(5000); });
  const p = await principal(), v = await f.app.validate(p, selected, clean);
  const r = await f.app.commit(p, selected, commitInput(v));
  assert.equal(v.evaluatedLocal, "2026-10-20T10:22:00");
  assert.equal(r.recorded.stageArrivalLocal, "2026-10-20T10:22:05");
});

test("F04 clean command cannot acknowledge arbitrary/future warnings; malformed acknowledgment zero", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean), c = commitInput(v);
  await assert.rejects(f.app.commit(p, selected, { ...c,
    confirmation: { accepted: true, warningCodes: ["STAGE_ARRIVAL_LATE"] } }), code("CONFIRMATION_REQUIRED"));
  for (const confirmation of [true, {}, { accepted: false, warningCodes: ["STAGE_ARRIVAL_LATE"] },
    { accepted: true, warningCodes: [] }, { accepted: true, warningCodes: ["OTHER"] },
    { accepted: true, warningCodes: ["STAGE_ARRIVAL_LATE"], timestamp: "forged" }])
    await assert.rejects(f.app.commit(p, selected, { ...c, confirmation }), code("INVALID_REQUEST"));
  zero(f.store);
});

test("F10 duplicate day owner across teams cannot select first row for effect", async () => {
  const row = structuredClone(sampleStageArrivalFacts); row.orgUnitId = "0022"; row.selection.employeeId = "9002";
  const f = fixture([row, sampleStageArrivalFacts]);
  await assert.rejects(f.app.context(await principal(), selected), code("AMBIGUOUS_ATTENDANCE")); zero(f.store);
});

test("F10 UoW reservation bound1000, no in-flight eviction or unbounded mutex queue", async () => {
  const f = fixture(), p = await principal(), v = await f.app.validate(p, selected, clean);
  const b: StageArrivalCommandBindingV1 = { source: f.store.source,
    actor: { subject: p.subject, provider: p.provider, synthetic: true, authorizedTeamIds: ["0021"] },
    selection: selected, command: commitInput(v) };
  const pending = Array.from({ length: 1000 }, (_, i) => f.store.compareCheckAndCommit({
    ...b, selection: { ...selected, shiftDayId: String(i + 1) },
  }, () => ({ kind: "reject", problem: { type: "urn:shf:problem:SHIFT_DAY_NOT_FOUND", title: "SHIFT_DAY_NOT_FOUND",
    status: 404, code: "SHIFT_DAY_NOT_FOUND", requestId: "test", commandId: null, effect: "none", nextAction: "stop" } })));
  assert.equal(f.store.inspectSnapshot().active, 1000);
  await assert.rejects(f.store.compareCheckAndCommit({ ...b, selection: { ...selected, shiftDayId: "1001" } },
    () => { throw Error("must not be called"); }), code("DEPENDENCY_UNAVAILABLE"));
  await Promise.all(pending); zero(f.store);
});

test("F10 receipt+audit bound1000 rejects saturation atomically before effect; expiry restores capacity", async () => {
  const f = fixture(), p = await principal();
  const v = await f.app.validate(p, selected, clean);
  // Pure isolated UoW capacity fixture; the public application has no reset,
  // overwrite or bulk command. Only the explicitly labeled test seam resets.
  for (let i = 1; i <= 1000; i++) {
    const b: StageArrivalCommandBindingV1 = { source: f.store.source,
      actor: { subject: p.subject, provider: p.provider, synthetic: true, authorizedTeamIds: ["0021"] },
      selection: selected, command: commitInput(v, clean, `${i.toString(16).padStart(8, "0")}-1111-4111-8111-111111111111`) };
    const result = await f.store.compareCheckAndCommit(b, tx => {
      assert.equal(tx.current.kind, "one");
      if (tx.current.kind !== "one") throw Error("Expected isolated row");
      return { kind: "install", expected: tx.current.facts,
        write: { attendanceKey: { shiftDayId: "6201" }, stageArrivalLocal: "2026-10-20T10:22:00",
          stageArrivalUser: p.displayName, briefing: false, stageLate: null },
        receipt: { ...selected, commandId: b.command.commandId, outcome: "fixture-committed",
          recorded: { stageArrivalLocal: "2026-10-20T10:22:00", briefing: false, stageLate: null },
          committedAt: f.clock.now().toISOString(), businessTimeZone: "Asia/Jerusalem", replayed: false,
          partnerCompletion: "not-invoked", dataSource: "isolated-fixture" },
        audit: tx.audit.stage(b) };
    });

    assert.equal(result.kind, "receipt");
    f.store.reviseForIsolatedTest(rows => {
      rows[0].attendance!.stageArrivalLocal = null; rows[0].attendance!.stageArrivalUser = null;
    });
  }
  assert.equal(f.store.inspectSnapshot().receipts, 1000);
  const ready = await f.app.validate(p, selected, clean);
  await assert.rejects(f.app.commit(p, selected, commitInput(ready,
    clean, "ffffffff-ffff-4fff-8fff-ffffffffffff")), { code: "DEPENDENCY_UNAVAILABLE", effect: "none" });
  assert.equal(f.store.inspectSnapshot().rows[0].attendance?.stageArrivalLocal, null);
  assert.equal(f.store.inspectSnapshot().audits, 1000); assert.equal(f.store.inspectSnapshot().active, 0);
  f.clock.advance(900000);
  const fresh = await f.app.validate(p, selected, late); // clock is now after planned start
  await f.app.commit(p, selected, commitInput(fresh, late, "ffffffff-ffff-4fff-8fff-ffffffffffff"));
  assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
});

test("F08 final expected-field comparison rejects a changed snapshot after decision or staging", async () => {
  const p = await principal();
  for (const point of ["decided", "staged"] as const) {
    let f: ReturnType<typeof fixture>;
    f = fixture(undefined, at => {
      if (point === at) f.store.reviseForIsolatedTest(rows => {
        // Same opaque revision on purpose: original fields must ALSO compare.
        rows[0].policy.configuredMinutes = 1;
      });
    });
    const v = await f.app.validate(p, selected, clean);
    await assert.rejects(f.app.commit(p, selected, commitInput(v)),
      { code: "STALE_PREPARATION", effect: point === "staged" ? "rolled-back" : "none" });
    zero(f.store);
  }
});

// Separate explicit and ALS controllers: an uncancelled ambient context MUST
// NOT mask explicit cancellation, nor may a live explicit signal mask ALS.
const cancellationModes = [
  { name: "without ALS", source: "explicit", ambient: false },
  { name: "with independent ALS", source: "explicit", ambient: true },
  { name: "ambient-only", source: "ambient", ambient: true },
  { name: "ambient with live explicit", source: "ambient-explicit", ambient: true },
  { name: "both signals", source: "both", ambient: true },
  { name: "ambient deadline", source: "deadline", ambient: true },
] as const;
const cancellationPhases = ["before-call", "reservation-wait", "reserved", "decided", "staged", "installed"] as const;
for (const layer of ["application", "runtime"] as const) {
  for (const mode of cancellationModes) {
    for (const phase of cancellationPhases) {
      test(`D01 ${layer} ${mode.name} ${phase}: pre-install none0 / post-install UNKNOWN1, released mutex`, async () => {
        const explicit = new AbortController(), ambient = new AbortController();
        const cancel = () => {
          if (mode.source === "explicit" || mode.source === "both") explicit.abort();
          if (mode.source === "ambient" || mode.source === "ambient-explicit" || mode.source === "both") ambient.abort();
          if (mode.source === "deadline") {
            const budget = currentRequestBudget(); assert.ok(budget);
            budget.deadline = performance.now() - 1;
          }
        };
        const f = await cancellationFixture(layer, point => { if (point === phase) cancel(); });
        const before = f.store.inspectSnapshot();
        const work = async () => {
          assert.equal(currentRequestBudget() !== undefined, mode.ambient);
          if (phase === "before-call") cancel();
          // Invoke synchronously until the UoW's sole reservation microtask.
          const pending = f.execute(mode.source === "ambient" ? undefined : explicit.signal);
          if (phase === "reservation-wait") cancel();
          let failure: unknown;
          try { await pending; } catch (error) { failure = error; }
          const s = f.store.inspectSnapshot(), installed = phase === "installed";
          assert.deepEqual([s.rows[0].attendance?.stageArrivalLocal ?? null, s.receipts, s.audits, s.active],
            installed ? ["2026-10-20T10:22:00", 1, 1, 0] : [null, 0, 0, 0]);
          if (!installed) assert.deepEqual(s.rows, before.rows);
          assert.ok(failure instanceof StageArrivalError);
          assert.equal(failure.code, installed ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT");
          assert.equal(failure.effect, installed ? "unknown" : "none");
        };
        if (mode.ambient) await withRequestBudget(ambient.signal, 5000, work);
        else await work();
      });
    }
  }
}
