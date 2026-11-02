import test from "node:test";
import assert from "node:assert/strict";
import { createIsolatedShiftManagement } from "../shift-management-fixture.mts";
import { ShiftManagementError, ShiftUowRejection, shiftProblem, shiftUnknown } from "../shift-management-errors.mts";
import { shiftTextByteLength } from "../shift-management-text.mts";
import { ShiftManagementApplication } from "../shift-management-application.mts";
import { shiftManagementAccessPolicy } from "../access-policy.mts";
import { managementFixtureSnapshot, managementClock, managementPrincipal, createDraft,
  commandFor } from "./shift-management-helpers.mts";
import type { CsvShiftPreviewV1, CsvShiftCommandV1, ShiftDraftV1, ShiftStateV1 } from "../shift-management-contracts.mts";
import { assertShiftWorkAllowed, nextShiftCivilDate } from "../shift-management-domain.mts";
import { currentRequestBudget, withRequestBudget } from "../request-budget-context.mts";

const p = managementPrincipal();
const csvBytes = () => new TextEncoder().encode("personalId,activityCode,date,location,startTime,endTime\n" +
  "001234567,1,05/01/2027,m,09:00,10:00\nX001234567,1,06/01/2027,h,09:00,10:00");
function csvCommand(preview: CsvShiftPreviewV1, n = 1): CsvShiftCommandV1 {
  assert.equal(preview.state, "ready");
  if (preview.state !== "ready") throw Error("Test expected ready");
  return { commandId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, previewToken: preview.previewToken,
    fingerprint: preview.fingerprint, operationConfirmation: { accepted: true },
    acknowledgedWarningCodes: [...new Set(preview.rows.flatMap(row => row.effect?.warningCodes ?? []))] };
}
const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};
async function seeded() {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const prep = await f.app.prepare(p, "1", createDraft());
  const receipt = await f.app.command(p, "1", commandFor(prep, createDraft(), 99));
  const state: ShiftStateV1 = receipt.effects[0].after;
  return { ...f, state };
}
function changed(state: ShiftStateV1): Extract<ShiftDraftV1, { kind: "change" }> {
  return { kind: "change", shiftDayId: state.shiftDayId, startLocal: state.startLocal,
    endLocal: state.endLocal, activityCode: "2", workLocation: "site",
    startReasonCode: null, endReasonCode: null };
}
test("CSV second insert failure rolls back every ordinary row but retains sequence gaps", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const preview = await f.app.previewCsv(p, "1", csvBytes(), "utf-8");
  f.failNext("insert-2");
  await assert.rejects(f.app.commandCsv(p, "1", csvCommand(preview)),
    (error: unknown) => error instanceof ShiftManagementError && error.problemCase.effect === "rolled-back");
  const result = f.inspect();
  assert.equal(result.snapshot.days.length, 0); assert.equal(result.sequenceCalls, 2);
  assert.equal(result.commits, 0); assert.equal(result.rollbacks, 1); assert.equal(result.active, 0);
  await assert.rejects(f.app.commandCsv(p, "1", csvCommand(preview)), { code: "COMMAND_SCOPE_DEFERRED" });
});
for (const fault of ["rowcount-zero", "rowcount-many", "rowcount-undefined"] as const) {
  test(`required rowcount invariant ${fault} aborts the whole command`, async () => {
    const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
    const preview = await f.app.previewCsv(p, "1", csvBytes(), "utf-8");
    f.failNext(fault);
    await assert.rejects(f.app.commandCsv(p, "1", csvCommand(preview)),
      (error: unknown) => error instanceof ShiftManagementError && error.problemCase.effect === "rolled-back");
    assert.equal(f.inspect().snapshot.days.length, 0); assert.equal(f.inspect().commits, 0);
    assert.equal(f.inspect().active, 0); assert.equal(f.admission.inspect().active, 0);
  });
}
for (const fault of ["rollback", "commit-ack", "readback"] as const) {
  test(`${fault} uncertainty quarantines every CSV row and command kind, no retry/new UUID`, async () => {
    const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
    const preview = await f.app.previewCsv(p, "1", csvBytes(), "utf-8");
    f.failNext(fault);
    await assert.rejects(f.app.commandCsv(p, "1", csvCommand(preview)), { code: "COMMAND_OUTCOME_UNKNOWN" });
    await assert.rejects(f.app.previewCsv(p, "1", csvBytes(), "utf-8"), { code: "COMMAND_SCOPE_DEFERRED" });
    for (const draft of [createDraft(), { ...changed({ shiftDayId: "1", status: "scheduled", ...createDraft(),
      siteId: "1", source: "fExtra", paidMinutes: "60", workMinutes: "60" }) },
      { kind: "cancel" as const, shiftDayId: "1", reasonCode: "C1", remark: null }]) {
      await assert.rejects(f.app.prepare(p, "1", draft), { code: "COMMAND_SCOPE_DEFERRED" });
    }
    await assert.rejects(f.app.commandCsv(p, "1", csvCommand(preview, 2)), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.equal(f.admission.inspect().quarantined, 1);
    assert.equal(f.inspect().active, 0); assert.equal(f.admission.inspect().active, 0);
    assert.equal(f.inspect().commits, fault === "rollback" ? 0 : 1);
  });
}
test("one employee reservation covers CSV and single-create; review holds no ownership", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const preview = await f.app.previewCsv(p, "1", csvBytes(), "utf-8");
  const prep = await f.app.prepare(p, "1", createDraft());
  assert.equal(f.admission.inspect().active, 0); assert.equal(f.inspect().active, 0);
  const entered = deferred(), release = deferred();
  f.onStepForIsolatedTest(async phase => { if (phase === "locked") { entered.resolve(); await release.promise; } });
  const applying = f.app.commandCsv(p, "1", csvCommand(preview));
  await entered.promise;
  await assert.rejects(f.app.command(p, "1", commandFor(prep, createDraft(), 2)), { code: "COMMAND_IN_PROGRESS" });
  release.resolve(); await applying; f.onStepForIsolatedTest(undefined);
  await assert.rejects(f.app.command(p, "1", commandFor(prep, createDraft(), 2)), { code: "STALE_PREPARATION" });
  assert.equal(f.inspect().commits, 1); assert.equal(f.inspect().sequenceCalls, 2);
  assert.equal(f.inspect().active, 0);
});
test("wrong fingerprints, draft edits and warning sets do not consume usable tokens", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const prep = await f.app.prepare(p, "1", createDraft()), command = commandFor(prep, createDraft(), 1);
  await assert.rejects(f.app.command(p, "1", { ...command, fingerprint: "b".repeat(64) }), { code: "STALE_PREPARATION" });
  await assert.rejects(f.app.command(p, "1", { ...command, draft: { ...createDraft(), activityCode: "2" } }),
    { code: "STALE_PREPARATION" });
  await assert.rejects(f.app.command(p, "1", { ...command, acknowledgedWarningCodes: ["DURATION_CHANGED"] }),
    { code: "CONFIRMATION_REQUIRED" });
  assert.equal(f.admission.inspect().preparations, 1);
  await f.app.command(p, "1", command);
  await assert.rejects(f.app.command(p, "1", command), { code: "COMMAND_SCOPE_DEFERRED" });
  await assert.rejects(f.app.command(p, "1", { ...command, draft: { ...createDraft(), activityCode: "2" } }),
    { code: "COMMAND_ID_CONFLICT" });
  assert.equal(f.inspect().commits, 1);
});
test("expired token and changed authentication generation cannot acquire ownership", async () => {
  const clock = managementClock(), f = createIsolatedShiftManagement(managementFixtureSnapshot(), clock, "UTC");
  const prep = await f.app.prepare(p, "1", createDraft());
  clock.advance(120000);
  await assert.rejects(f.app.command(p, "1", commandFor(prep, createDraft(), 1)), { code: "STALE_PREPARATION" });
  let generation = "test-generation-1";
  const app = new ShiftManagementApplication({ snapshots: f.snapshots, uow: f.uow, admission: f.admission,
    policy: shiftManagementAccessPolicy("isolated-fixture"), clock, businessTimeZone: "UTC", authGeneration: () => generation });
  const current = await app.prepare(p, "1", createDraft()); generation = "test-generation-2";
  await assert.rejects(app.command(p, "1", commandFor(current, createDraft(), 2)), { code: "STALE_PREPARATION" });
  assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.admission.inspect().active, 0);
});
for (const field of ["policy", "catalog", "preserved", "dependencies"] as const) {
  test(`full ${field} drift is stale before any NEXTVAL/DML`, async () => {
    const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
    const prep = await f.app.prepare(p, "1", createDraft());
    f.reviseForIsolatedTest(snapshot => {
      if (field === "policy") snapshot.policy.gapMinutes++;
      if (field === "catalog") snapshot.activityOptions[0].label = "שינוי";
      if (field === "preserved") snapshot.preserved.SYNTHETIC_POLICY_REVISION = "2";
      if (field === "dependencies") snapshot.dependencies.push({ kind: "report", id: "R1",
        state: "active", shiftDayId: null });
    });
    await assert.rejects(f.app.command(p, "1", commandFor(prep, createDraft(), 1)), { code: "STALE_PREPARATION" });
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
  });
}
test("change marks only WFM source, preserves unrelated fields; cancellation retains historical values", async () => {
  const f = await seeded();
  f.reviseForIsolatedTest(snapshot => {
    snapshot.days[0].baseline.source = "WFM";
    snapshot.days[0].baseline.preserved.DEMO_ORIGINAL = "unaltered";
  });
  const draft = changed(f.state), prep = await f.app.prepare(p, "1", draft);
  assert.deepEqual(prep.effects[0].warningCodes, ["SOURCE_BECOMES_SHF"]);
  const receipt = await f.app.command(p, "1", commandFor(prep, draft, 1));
  assert.equal(receipt.effects[0].after.source, "SHF");
  assert.equal(f.inspect().snapshot.days[0].baseline.preserved.DEMO_ORIGINAL, "unaltered");
  const cancel = { kind: "cancel" as const, shiftDayId: f.state.shiftDayId, reasonCode: "C1", remark: "סינתטי" };
  const cancelPrep = await f.app.prepare(p, "1", cancel);
  const before = cancelPrep.effects[0].before;
  const cancelled = await f.app.command(p, "1", commandFor(cancelPrep, cancel, 2));
  assert.ok(before);
  for (const key of ["startLocal", "endLocal", "paidMinutes", "workMinutes", "activityCode", "siteId"] as const)
    assert.equal(cancelled.effects[0].after[key], before[key]);
  assert.equal(f.inspect().snapshot.days[0].overlay?.employeeNumber, "99999999");
  await assert.rejects(f.app.prepare(p, "1", cancel), { code: "ALREADY_CANCELLED" });
});
test("explicit zero accounting is not replaced by positive baseline or silently repaired", async () => {
  const f = await seeded();
  f.reviseForIsolatedTest(snapshot => { snapshot.days[0].baseline.paidMinutes = "0"; });
  await assert.rejects(f.app.prepare(p, "1", changed(f.state)),
    (error: unknown) => error instanceof ShiftManagementError &&
      error.details.ruleViolations?.some(rule => rule.code === "UNSUPPORTED_MINUTE_ACCOUNTING") === true);
});
test("no-op change and changed-time reasons are business validation, not generic update success", async () => {
  const f = await seeded();
  const draft = { ...changed(f.state), activityCode: f.state.activityCode };
  await assert.rejects(f.app.prepare(p, "1", draft),
    (error: unknown) => error instanceof ShiftManagementError &&
      error.details.ruleViolations?.some(rule => rule.code === "NO_CHANGE") === true);
  await assert.rejects(f.app.prepare(p, "1", { ...draft, startLocal: "2027-01-04T08:30:00" }),
    { code: "BUSINESS_VALIDATION_FAILED" });
});
for (const column of ["STATION_EXIT_TIME", "STAGE_ARRIVAL_USER", "LATE_REASON_ID", "LATE_REMARK",
  "STAGE_LATE_MINUTES", "MISSING_TIME", "MISSING_REMARK", "OPTIONAL1", "P2"]) {
  test(`actual attendance/dependency payload ${column} blocks change and cancel`, async () => {
    const f = await seeded();
    f.reviseForIsolatedTest(snapshot => {
      snapshot.days[0].attendance = { SHF_EMPLOYEE_DAY_ID: f.state.shiftDayId, TADREECH: null, [column]: "observed" };
    });
    await assert.rejects(f.app.prepare(p, "1", changed(f.state)), { code: "BUSINESS_VALIDATION_FAILED" });
    await assert.rejects(f.app.prepare(p, "1", { kind: "cancel", shiftDayId: f.state.shiftDayId, reasonCode: "C1", remark: null }),
      { code: "BUSINESS_VALIDATION_FAILED" });
  });
}
test("neutral attendance is retained, never created or updated by change", async () => {
  const f = await seeded();
  const attendance = { SHF_EMPLOYEE_DAY_ID: f.state.shiftDayId, TADREECH: "0", MISS_REASON_ID: "0", STATION_EXIT_TIME: null };
  f.reviseForIsolatedTest(snapshot => { snapshot.days[0].attendance = attendance; });
  const draft = changed(f.state), prep = await f.app.prepare(p, "1", draft);
  await f.app.command(p, "1", commandFor(prep, draft, 1));
  assert.deepEqual(f.inspect().snapshot.days[0].attendance, attendance);
});
for (const kind of ["report", "event", "exception", "exchange", "pool", "unknown"] as const) {
  test(`observed ${kind} dependency is a hard defer, not deleted or acknowledged away`, async () => {
    const snapshot = managementFixtureSnapshot();
    snapshot.dependencies.push({ kind, id: "SYNTHETIC1", state: "active", shiftDayId: null });
    const f = createIsolatedShiftManagement(snapshot, managementClock(), "UTC");
    await assert.rejects(f.app.prepare(p, "1", createDraft()), { code: "BUSINESS_VALIDATION_FAILED" });
    assert.equal(f.inspect().sequenceCalls, 0);
  });
}
test("unknown/required partner policy never becomes manufactured not-required or completion", async () => {
  for (const cti of ["unknown", "required"] as const) {
    const snapshot = managementFixtureSnapshot(); snapshot.partnerPolicy.cti = cti;
    const f = createIsolatedShiftManagement(snapshot, managementClock(), "UTC");
    const context = await f.app.context(p, { employeeId: "1", shiftDayId: null });
    assert.ok(context.blockers.includes("PARTNER_REQUIRED_OR_UNKNOWN"));
    await assert.rejects(f.app.prepare(p, "1", createDraft()), { code: "BUSINESS_VALIDATION_FAILED" });
    assert.equal(f.admission.inspect().preparations, 0);
  }
});
test("private physical alphanumeric8/9 admission is separate from numeric CSV identity", async () => {
  const snapshot = managementFixtureSnapshot(); snapshot.employee.employeeNumber = "TEST0001A";
  const f = createIsolatedShiftManagement(snapshot, managementClock(), "UTC");
  const prep = await f.app.prepare(p, "1", createDraft());
  await f.app.command(p, "1", commandFor(prep, createDraft(), 1));
  assert.equal(f.inspect().snapshot.days[0].baseline.employeeNumber, "TEST0001");
  await assert.rejects(f.app.previewCsv(p, "1", csvBytes(), "utf-8"), { code: "INVALID_SOURCE_DATA" });
});
test("Oracle Hebrew representability is distinct from CSV codec and obeys actual byte capacity", async () => {
  assert.equal(shiftTextByteLength("א\"ב'", "IW8ISO8859P8"), 4);
  assert.equal(shiftTextByteLength("א\"ב'", "AL32UTF8"), 6);
  assert.equal(shiftTextByteLength("€", "IW8ISO8859P8"), null);
  assert.equal(shiftTextByteLength("\uFFFD", "AL32UTF8"), null);
  const snapshot = managementFixtureSnapshot(); snapshot.textStorage.charset = "IW8ISO8859P8";
  snapshot.textStorage.remarkBytes = 2;
  const f = createIsolatedShiftManagement(snapshot, managementClock(), "UTC");
  await f.app.prepare(p, "1", { ...createDraft(), remark: "אב" });
  await assert.rejects(f.app.prepare(p, "1", { ...createDraft(), remark: "אבג" }),
    { code: "BUSINESS_VALIDATION_FAILED" });
  await assert.rejects(f.app.prepare(p, "1", { ...createDraft(), remark: "€" }),
    { code: "BUSINESS_VALIDATION_FAILED" });
});
test("forged consumed handle/terminal result cannot release employee ownership", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const entered = deferred(), release = deferred();
  f.onStepForIsolatedTest(async () => { entered.resolve(); await release.promise; });
  const prep = await f.app.prepare(p, "1", createDraft());
  const pending = f.app.command(p, "1", commandFor(prep, createDraft(), 1));
  await entered.promise;
  await assert.rejects(f.admission.finish({ reference: f.admission.reference, kind: "create", employeeId: "1",
    commandId: "00000000-0000-4000-8000-000000000001", planDigest: "a".repeat(64), attemptHandle: "forged" },
  { kind: "unknown", problem: (() => { const problem = shiftProblem(shiftUnknown(), "test", "00000000-0000-4000-8000-000000000001");
    if (problem.effect !== "unknown") throw Error("Test expected unknown"); return problem; })() }),
  { code: "STALE_PREPARATION" });
  assert.equal(f.admission.inspect().active, 1);
  release.resolve(); await pending;
  assert.equal(f.admission.inspect().active, 0);
});
test("independent readback compares preserved facts, not just displayed shift state", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const original = f.snapshots.read.bind(f.snapshots);
  f.snapshots.read = async (...args) => {
    if (f.inspect().commits) f.reviseForIsolatedTest(snapshot => { snapshot.preserved.SYNTHETIC_POLICY_REVISION = "DRIFT"; });
    return original(...args);
  };
  const prep = await f.app.prepare(p, "1", createDraft());
  await assert.rejects(f.app.command(p, "1", commandFor(prep, createDraft(), 1)), { code: "COMMAND_OUTCOME_UNKNOWN" });
  assert.equal(f.inspect().commits, 1); assert.equal(f.admission.inspect().quarantined, 1);
});
function hundredRowCsvBytes() {
  const rows = []; let date = "2027-01-04";
  for (let i = 0; i < 100; i++) {
    rows.push(`001234567,1,${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)},m,09:00,10:00`);
    date = nextShiftCivilDate(date);
  }
  return new TextEncoder().encode("personalId,activityCode,date,location,startTime,endTime\n" + rows.join("\n"));
}
test("100-row isolated application exercises one budget and one commit, not native capacity certification", async t => {
  // Semantic budget propagation/atomicity only. Real CPU/scheduler time is not
  // an Oracle/HTTP SLA. Advance virtual time at owned fixture boundaries; keep
  // every production validation and deadline guard enabled.
  const wallNow = performance.now.bind(performance), wallStart = wallNow();
  let now = 1000;
  t.mock.method(performance, "now", () => now);
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const before = f.inspect().snapshot;
  const bytes = hundredRowCsvBytes();
  const signal = new AbortController().signal;
  let budget: ReturnType<typeof currentRequestBudget>, sequenceChecks = 0, insertChecks = 0, readbacks = 0;
  const advance = (ms: number) => {
    assert.ok(budget); assert.equal(currentRequestBudget(), budget);
    assert.equal(budget.signal, signal); assert.equal(budget.deadline, 6000);
    now += ms; assertShiftWorkAllowed(signal);
  };
  const read = f.snapshots.read.bind(f.snapshots);
  const checkedRead: typeof f.snapshots.read = async (selection, signal) => {
    advance(10);
    if (f.inspect().commits) readbacks++;
    return read(selection, signal);
  };
  t.mock.method(f.snapshots, "read", checkedRead);
  const run = f.uow.run.bind(f.uow);
  const checkedRun: typeof f.uow.run = (selection, work, signal) => run(selection, locked => work({
    ...locked,
    async nextDayId() { advance(10); sequenceChecks++; return locked.nextDayId(); },
    async insertDay(plan) { advance(10); insertChecks++; return locked.insertDay(plan); },
  }), signal);
  t.mock.method(f.uow, "run", checkedRun);
  const phases: string[] = [];
  f.onStepForIsolatedTest(async phase => { advance(100); phases.push(phase); });
  try {
    await withRequestBudget(signal, 5000, async () => {
      budget = currentRequestBudget();
      const preview = await f.app.previewCsv(p, "1", bytes, "utf-8", signal);
      assert.equal(preview.state, "ready"); assert.equal(preview.rows.length, 100);
      assert.ok(preview.rows.every(row => row.errors.length === 0 && row.effect !== null));
      const receipt = await f.app.commandCsv(p, "1", csvCommand(preview), signal);
      advance(10);
      assert.equal(receipt.effects.length, 100);
      assert.equal(receipt.outcome, "fixture-committed"); assert.equal(receipt.partnerCompletion, "not-invoked");
      const after = f.inspect().snapshot;
      assert.deepEqual({ ...after, days: [] }, { ...before, days: [] });
      for (let i = 0; i < 100; i++) {
        const day = after.days[i];
        const effect: ShiftStateV1 = receipt.effects[i].after;
        assert.equal(day.overlay, null); assert.equal(day.attendance, null);
        for (const key of ["shiftDayId", "startLocal", "endLocal", "activityCode", "siteId",
          "paidMinutes", "workMinutes", "source"] as const) assert.equal(day.baseline[key], effect[key]);
        assert.equal(effect.startLocal.slice(0, 10), preview.rows[i].effect?.after.startLocal.slice(0, 10));
      }
    });
    const result = f.inspect();
    assert.equal(result.commits, 1); assert.equal(result.snapshot.days.length, 100);
    assert.equal(result.sequenceCalls, 100); assert.equal(result.rollbacks, 0);
    assert.equal(sequenceChecks, 100); assert.equal(insertChecks, 100); assert.equal(readbacks, 1);
    assert.deepEqual(phases, ["locked", "before-commit"]);
    assert.equal(now, 3230); // 2 reads + 200 row operations + 2 phases + final check.
    assert.equal(result.active, 0); assert.equal(f.admission.inspect().active, 0);
    assert.equal(currentRequestBudget(), undefined);
    t.diagnostic(`controlled budget elapsed=2230/5000ms; observed wall=${(wallNow() - wallStart).toFixed(1)}ms, NOT a wall-time SLA or native capacity certification`);
  } finally {
    f.onStepForIsolatedTest(undefined); t.mock.restoreAll();
  }
});
test("100-row isolated application rejects exactly 5000ms with zero effects and proven rollback", async t => {
  let now = 1000;
  t.mock.method(performance, "now", () => now);
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const before = f.inspect().snapshot, signal = new AbortController().signal;
  let budget: ReturnType<typeof currentRequestBudget>, locked = 0;
  f.onStepForIsolatedTest(async phase => {
    assert.equal(phase, "locked"); locked++;
    assert.equal(currentRequestBudget(), budget);
    now = 5999; assertShiftWorkAllowed(signal); // Still valid one ms before the boundary.
    now = 6000; // Unmodified fixture guard must reject before any sequence/DML.
  });
  try {
    await assert.rejects(withRequestBudget(signal, 5000, async () => {
      budget = currentRequestBudget();
      assert.equal(budget?.deadline, 6000);
      const preview = await f.app.previewCsv(p, "1", hundredRowCsvBytes(), "utf-8", signal);
      assert.equal(preview.state, "ready"); assert.equal(preview.rows.length, 100);
      assert.ok(preview.rows.every(row => row.errors.length === 0 && row.effect !== null));
      return f.app.commandCsv(p, "1", csvCommand(preview), signal);
    }), (error: unknown) => error instanceof ShiftUowRejection && error.code === "DEPENDENCY_TIMEOUT" &&
      error.problemCase.effect === "rolled-back" && error.ordinaryRollbackProved === true);
    const result = f.inspect();
    assert.equal(locked, 1); assert.deepEqual(result.snapshot, before);
    assert.equal(result.sequenceCalls, 0); assert.equal(result.commits, 0); assert.equal(result.rollbacks, 1);
    assert.equal(result.active, 0); assert.equal(f.admission.inspect().active, 0);
    assert.equal(currentRequestBudget(), undefined);
  } finally {
    f.onStepForIsolatedTest(undefined); t.mock.restoreAll();
  }
});
