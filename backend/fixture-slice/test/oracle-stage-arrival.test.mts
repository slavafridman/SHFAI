import test from "node:test";
import assert from "node:assert/strict";
import { nativeOnTime } from "../oracle-stage-arrival-domain.mts";
import { nativeCommand, nativeDraft, validNativeReceipt } from "../native-stage-arrival-validation.mts";
import { validateStageArrivalMode } from "../stage-arrival-validation.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { NativeOracleDouble, nativeSelection, cleanNative, nativeConfig } from "./native-stage-arrival-double.mts";
import type { NativeStageArrivalValidationV1 } from "../oracle-stage-arrival-contracts.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { NativeAllowance } from "../oracle-stage-arrival-application.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { sampleStageArrivalConfig } from "../stage-arrival-sample.mts";
import { currentRequestBudget } from "../request-budget-context.mts";
import { setTimeout as sleep } from "node:timers/promises";

const plan = { planned: { startLocal: "2026-10-20T12:20:00", endLocal: "2026-10-20T20:20:00" },
  policy: { revision: "synthetic-policy", configuredMinutes: 10 } };
const rejects = (code: string) => (e: unknown) => e instanceof StageArrivalError && e.code === code;
test("N01 native on-time intersection uses TODAY, exact seconds and actual policy", () => {
  assert.equal(nativeOnTime(plan, new Date("2026-10-20T12:10:00Z"), "UTC").local, "2026-10-20T12:10:00");
  for (const instant of ["2026-10-20T12:10:00.001Z", "2026-10-20T11:19:59Z", "2026-10-19T12:00:00Z"])
    assert.throws(() => nativeOnTime(plan, new Date(instant), "UTC"), rejects("COMMAND_SCOPE_DEFERRED"));
});
test("N01 native grammar requires explicit whole-operation confirmation and null/null draft", () => {
  const input = { commandId: "90000000-0000-4000-8000-000000000001", draft: { lateReasonCode: null, lateRemark: null },
    validationToken: "A".repeat(43), fingerprint: "a".repeat(64), confirmation: null,
    operationConfirmation: { accepted: true } };
  assert.deepEqual(nativeCommand(input), input);
  assert.throws(() => nativeCommand({ ...input, operationConfirmation: { accepted: false } }), rejects("INVALID_REQUEST"));
  assert.throws(() => nativeCommand({ ...input, clock: "client" }), rejects("INVALID_REQUEST"));
  assert.throws(() => nativeDraft({ lateReasonCode: "1", lateRemark: null }), rejects("INVALID_REQUEST"));
});
test("N01 native configuration has a separate isolated TEST branch, never production", () => {
  const c = { attendanceStageArrivalMode: "test-oracle-controlled", dataSource: "oracle-read-only",
    deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC",
    oracleTestScopeConfirmed: true };
  assert.equal(validateStageArrivalMode(c), "test-oracle-controlled");
  for (const delta of [{ deploymentClass: "production" }, { deploymentClass: "local-development" },
    { dataSource: "isolated-fixture" }, { syntheticAdministratorEnabled: false }])
    assert.throws(() => validateStageArrivalMode({ ...c, ...delta }));
});

const cmd = (v: NativeStageArrivalValidationV1) => ({ commandId: "90000000-0000-4000-8000-000000000001",
  draft: cleanNative, confirmation: null, operationConfirmation: { accepted: true },
  validationToken: v.validationToken, fingerprint: v.fingerprint });
const errorEffect = (code: string, effect: string) => (e: unknown) =>
  e instanceof StageArrivalError && e.code === code && e.effect === effect;
test("N02 real native application/double: PURE0, three fields only, release then independent readback", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application();
    assert.equal(principal.employeeId, null); assert.equal(principal.capabilities.length, 10);
    const before = structuredClone(d.rows);
    const c = await app.context(principal, nativeSelection);
    const v = await app.validate(principal, nativeSelection, cleanNative);
    assert.equal(c.dataSource, "oracle-test"); assert.deepEqual(c.lateReasonOptions, []);
    assert.equal(v.state, "ready");
    assert.ok(!d.sql.some(q => /UPDATE|FOR UPDATE|INSERT|DELETE/.test(q.sql)));
    assert.deepEqual(d.rows, before);
    const receipt = await app.commit(principal, nativeSelection, cmd(v));
    assert.equal(validNativeReceipt(receipt, nativeCommand(cmd(v)), nativeSelection), true);
    assert.equal(validNativeReceipt({ ...receipt, dataSource: "isolated-fixture" }, nativeCommand(cmd(v)), nativeSelection), false);
    assert.equal(validNativeReceipt({ ...receipt, committedAt: receipt.commitAcknowledgedAt }, nativeCommand(cmd(v)), nativeSelection), false);
    assert.equal(validNativeReceipt({ ...receipt, replayed: true }, nativeCommand(cmd(v)), nativeSelection), false);
    assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.receiptPersistence, "none");
    assert.equal(receipt.replayed, false); assert.equal(receipt.partnerCompletion, "not-invoked");
    assert.ok(!Object.hasOwn(receipt, "committedAt"));
    const expected = structuredClone(before);
    Object.assign(expected.SHF_ATTENDANCE!, { STAGE_ARRIVAL_TIME: "2026-10-20T12:00:00",
      STAGE_ARRIVAL_USER: principal.subject, TADREECH: "0" });
    assert.deepEqual(d.rows, expected);
    const update = d.sql.find(q => q.sql.includes("native:update"))!;
    assert.deepEqual(update.sql.split(" SET")[1].split(" WHERE")[0].match(/(?:STAGE_[A-Z_]+|TADREECH)=/g),
      ["STAGE_ARRIVAL_TIME=", "STAGE_ARRIVAL_USER=", "TADREECH="]);
    assert.ok(update.sql.includes("a.STAGE_ARRIVAL_TIME IS NULL"));
    assert.ok(update.sql.includes("NOT EXISTS") && update.sql.includes("SHF_DAY_CHANGES"));
    assert.ok(!d.sql.some(q => /INSERT|DELETE|MERGE|SHF_INS_AND|registerStage|validateUpdate|cancelMissing/.test(q.sql)));
    assert.ok(!d.sql.some(q => q.source === "write" && q.sql === "SET TRANSACTION READ ONLY"));
    const ack = d.events.lastIndexOf("write:commit-ack"), released = d.events.lastIndexOf("write:close:false");
    assert.ok(ack < released && released < d.events.lastIndexOf("read:lease"));
    assert.throws(() => new NativeAllowance(d.binding).assertUnused(), rejects("LIVE_WRITES_DISABLED"));
    await assert.rejects(app.validate(principal, nativeSelection, cleanNative), rejects("LIVE_WRITES_DISABLED"));
    await assert.rejects(app.commit(principal, nativeSelection, cmd(v)), rejects("ALREADY_REGISTERED"));
    assert.equal(d.events.filter(e => e === "write:update").length, 1);
  } finally { d.dispose(); }
});
for (const count of [0, 2, undefined]) test(`N03 affected rows ${count}: proven rollback, no commit`, async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    d.count = count;
    await assert.rejects(app.commit(principal, nativeSelection, cmd(v)),
      errorEffect(count === 0 ? "STALE_PREPARATION" : "INVALID_SOURCE_DATA", "rolled-back"));
    assert.equal(d.committed, false); assert.equal(d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_TIME, null);
    assert.ok(d.events.includes("write:rollback"));
  } finally { d.dispose(); }
});
for (const failure of ["commit-lost", "readback-fail", "readback-mismatch", "rollback-unconfirmed"] as const)
  test(`N04 ${failure}: UNKNOWN, quarantine, no retry or compensating update`, async () => {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      d.hook = event => {
        if (failure === "commit-lost" && event === "write:commit-ack") throw { code: "NJS-500" };
        if (failure === "readback-fail" && d.committed && event === "read:native:identity") throw { code: "NJS-500" };
        if (failure === "readback-mismatch" && d.committed && event === "read:native:row:SHF_ATTENDANCE")
          d.rows.SHF_ATTENDANCE!.TADREECH = "1";
        if (failure === "rollback-unconfirmed" && ["write:updated", "write:rollback"].includes(event)) throw { code: "NJS-500" };
      };
      await assert.rejects(app.commit(principal, nativeSelection, cmd(v)), errorEffect("COMMAND_OUTCOME_UNKNOWN", "unknown"));
      assert.throws(() => new NativeAllowance(d.binding).assertUnused(), rejects("LIVE_WRITES_DISABLED"));
      await assert.rejects(app.commit(principal, nativeSelection, { ...cmd(v),
        commandId: "90000000-0000-4000-8000-000000000002" }));
      assert.equal(d.events.filter(e => e === "write:update").length, 1);
      assert.equal(d.events.filter(e => e === "write:commit").length, failure === "rollback-unconfirmed" ? 0 : 1);
      if (failure === "commit-lost" || failure === "rollback-unconfirmed") assert.ok(d.events.includes("write:close:true"));
    } finally { d.dispose(); }
  });
for (const changed of ["plan", "policy", "reassignment", "marker", "grants", "expired", "late", "attendance", "duplicate", "lock"] as const)
  test(`N05 ${changed}: fresh revalidation rejects without update`, async () => {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      if (changed === "plan") d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME = "2026-10-20T21:00:00";
      if (changed === "policy") d.rows.SHF_SYSTEM_PARAM!.DEFAULT_VALUE = "11";
      if (changed === "reassignment") d.rows.SHF_EMPLOYEES!.ORG_UNIT_ID = "T002";
      if (changed === "marker") d.rows.SHF_EMPLOYEES!.FIRST_NAME = "not-the-marker";
      if (changed === "grants") principal.resourceScope.orgUnitIds = ["T002"];
      if (changed === "expired") d.clockMs += 120000;
      if (changed === "late") d.clockMs += 660000;
      if (changed === "attendance") d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME = "2026-10-20T12:00:01";
      d.hook = event => {
        if (changed === "duplicate" && event === "write:native:lock:SHF_ATTENDANCE")
          throw new StageArrivalError("AMBIGUOUS_ATTENDANCE");
        if (changed === "lock" && event === "write:native:lock:SHF_ATTENDANCE") throw { code: "ORA-00054" };
      };
      await assert.rejects(app.commit(principal, nativeSelection, cmd(v)), e => e instanceof StageArrivalError && e.effect === "none");
      assert.ok(!d.events.includes("write:update")); assert.ok(!d.committed);
    } finally { d.dispose(); }
  });
for (const point of ["write:lease", "write:native:row:SHF_UNIT_PARAM", "write:updated", "write:commit", "write:commit-ack"] as const)
  for (const cancellation of ["explicit", "ambient"] as const)
    test(`N06 ${cancellation} abort at ${point}: before vs during commit`, async () => {
      const d = new NativeOracleDouble(), controller = new AbortController();
      try {
        const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
        d.hook = event => { if (event === point) controller.abort(); };
        const call = () => app.commit(principal, nativeSelection, cmd(v), cancellation === "explicit" ? controller.signal : undefined);
        const during = point === "write:commit" || point === "write:commit-ack";
        await assert.rejects(cancellation === "ambient" ? withRequestBudget(controller.signal, 5000, call) : call(),
          errorEffect(during ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT",
            during ? "unknown" : point === "write:updated" ? "rolled-back" : "none"));
        assert.equal(d.events.filter(e => e === "write:commit").length, during ? 1 : 0);
        assert.ok(d.events.some(e => e.startsWith("write:close")));
      } finally { d.dispose(); }
    });
test("N07 safety metadata and exact identity fail closed before startup/command", async () => {
  for (const kind of ["digest", "trigger", "vpd", "type", "identity", "wrong-identity", "virtual-report", "grant"] as const) {
    const d = new NativeOracleDouble();
    try {
      if (kind === "digest") d.binding.metadataDigest = "a".repeat(64);
      if (kind === "trigger") d.proof[3] = [{ status: "ENABLED" }];
      if (kind === "vpd") d.proof[4] = [{ enabled: "YES" }];
      if (kind === "type") d.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "UNREVIEWED_LOB", dataType: "CLOB" });
      if (kind === "identity") d.hook = event => { if (event === "write:native:identity") throw { code: "ORA-01031" }; };
      if (kind === "wrong-identity") d.hook = event => {
        if (event === "write:native:identity") d.binding.writeIdentity.database = "SYNTHETIC_OTHER";
      };
      if (kind === "virtual-report") {
        for (const c of d.proof[0]) if (typeof c === "object" && c !== null &&
            "tableName" in c && c.tableName === "SHF_EMPLOYEE_REPORTS" && "virtualColumn" in c)
          c.virtualColumn = "YES";
      }
      if (kind === "grant") d.binding.writeIdentity.user = "SYNTHETIC_NO_GRANTS";
      if (kind !== "digest") d.binding.metadataDigest = fingerprint(d.proof);
      await assert.rejects(d.application());
      assert.ok(!d.events.includes("write:update")); assert.ok(d.events.includes("write:rollback"));
    } finally { d.dispose(); }
  }
});
test("N07 exact ordered 7/9/10 rights; native ports not reached on malformed identity or missing capability", async () => {
  const d = new NativeOracleDouble();
  try {
    for (const [c, count] of [[{ ...sampleStageArrivalConfig, attendanceStageArrivalMode: "disabled" }, 7],
      [sampleStageArrivalConfig, 9], [nativeConfig, 10]] as const) {
      const p = await new SyntheticAdministratorProvider(c).authenticate({ authorization: null });
      assert.equal(p.capabilities.length, count); assert.equal(p.employeeId, null);
    }
    const { app, principal } = await d.application();
    const n = d.sql.length;
    await assert.rejects(app.context(null, nativeSelection), rejects("UNAUTHENTICATED"));
    const p = { ...principal, synthetic: false };
    await assert.rejects(app.context(p, nativeSelection), rejects("UNAUTHENTICATED"));
    const real = { ...principal, provider: "real", synthetic: false, roles: [], capabilities: ["shift-day:read"] };
    await assert.rejects(app.context(real, nativeSelection), rejects("FORBIDDEN"));
    const fixturePrincipal = await new SyntheticAdministratorProvider(sampleStageArrivalConfig).authenticate({ authorization: null });
    await assert.rejects(app.context(fixturePrincipal, nativeSelection), rejects("FORBIDDEN"));
    assert.equal(d.sql.length, n);
  } finally { d.dispose(); }
});
for (const fault of ["lease", "query", "update-timeout", "rollback", "close-after-rollback", "close-after-commit"] as const)
  test(`N03/N04 native protocol ${fault}: proven rollback vs UNKNOWN, primary retained`, async () => {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      d.hook = event => {
        if (fault === "lease" && event === "write:lease") throw { code: "NJS-040" };
        if (fault === "query" && event === "write:native:row:SHF_ATTENDANCE") throw { code: "NJS-500" };
        if (fault === "update-timeout" && event === "write:updated") throw { code: "DPI-1067" };
        if (fault === "rollback" && event === "write:rollback") throw { code: "NJS-500" };
        if (fault === "close-after-rollback" && event === "write:update") throw new StageArrivalError("STALE_PREPARATION");
        if (fault === "close-after-rollback" && event === "write:close:false") throw { code: "NJS-500" };
        if (fault === "close-after-commit" && event === "write:close:false") throw { code: "NJS-500" };
        if (fault === "rollback" && event === "write:updated") throw { code: "NJS-500" };
      };
      const expected = fault === "lease" ? ["DEPENDENCY_TIMEOUT", "none"] : fault === "query" ? ["DEPENDENCY_UNAVAILABLE", "none"] :
        fault === "update-timeout" ? ["DEPENDENCY_TIMEOUT", "rolled-back"] :
        fault === "close-after-rollback" ? ["STALE_PREPARATION", "rolled-back"] : ["COMMAND_OUTCOME_UNKNOWN", "unknown"];
      await assert.rejects(app.commit(principal, nativeSelection, cmd(v)), errorEffect(expected[0], expected[1]));
      assert.equal(d.events.filter(e => e === "write:commit").length, fault === "close-after-commit" ? 1 : 0);
      if (fault === "rollback") assert.ok(d.events.includes("write:close:true"));
    } finally { d.dispose(); }
  });
test("N06 native in-flight commit settles AND break settles before unsafe drop; no abort undo promise", async () => {
  const d = new NativeOracleDouble(), controller = new AbortController();
  let releaseCommit!: () => void, releaseBreak!: () => void, entered!: () => void;
  const gate = new Promise<void>(resolve => { releaseCommit = resolve; });
  const breakGate = new Promise<void>(resolve => { releaseBreak = resolve; });
  const entry = new Promise<void>(resolve => { entered = resolve; });
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    const closedBefore = d.events.filter(e => e.startsWith("write:close")).length;
    d.hook = async event => {
      if (event === "write:commit") { entered(); await gate; }
      if (event === "write:break") await breakGate;
    };
    const call = app.commit(principal, nativeSelection, cmd(v), controller.signal);
    const assertion = assert.rejects(call, errorEffect("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    await entry; controller.abort(); await sleep(5);
    assert.equal(d.events.filter(e => e.startsWith("write:close")).length, closedBefore);
    releaseCommit(); await sleep(5);
    assert.equal(d.events.filter(e => e.startsWith("write:close")).length, closedBefore);
    releaseBreak(); await assertion;
    assert.ok(d.committed); assert.equal(d.events.at(-1), "write:close:true");
  } finally { releaseCommit?.(); releaseBreak?.(); d.dispose(); }
});
for (const point of ["write:lease", "write:updated"] as const)
  test(`N06 ALS deadline expired at ${point}, no active signal needed`, async () => {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      d.hook = event => { if (event === point) currentRequestBudget()!.deadline = performance.now() - 1; };
      const controller = new AbortController();
      await assert.rejects(withRequestBudget(controller.signal, 5000,
        () => app.commit(principal, nativeSelection, cmd(v))), errorEffect("DEPENDENCY_TIMEOUT",
        point === "write:updated" ? "rolled-back" : "none"));
      assert.equal(controller.signal.aborted, false);
      assert.equal(d.events.filter(e => e === "write:commit").length, 0);
    } finally { d.dispose(); }
  });
test("N02 token namespace binds actor/grants/policy/mode; altered token/fingerprint never reaches native port", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    const before = d.events.length;
    await assert.rejects(app.commit(principal, nativeSelection, { ...cmd(v), fingerprint: "a".repeat(64) }), rejects("STALE_PREPARATION"));
    await assert.rejects(app.commit(principal, nativeSelection, { ...cmd(v), validationToken: "B".repeat(43) }), rejects("STALE_PREPARATION"));
    assert.equal(d.events.length, before);
    const other = await d.application();
    await assert.rejects(other.app.commit(other.principal, nativeSelection, cmd(v)), rejects("STALE_PREPARATION"));
    assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
test("N05 late/historical native preparation cannot issue a token or invoke legacy reason writes", async () => {
  for (const delta of [-660000, 86400000, -86400000]) {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application();
      // Only synthetic double facts change; server Clock/approval stay current.
      for (const field of ["WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME"])
        d.rows.SHF_EMPLOYEE_DAY![field] = new Date(Date.parse(d.rows.SHF_EMPLOYEE_DAY![field]! + "Z") + delta).toISOString().slice(0, 19);
      await assert.rejects(app.validate(principal, nativeSelection, cleanNative), rejects("COMMAND_SCOPE_DEFERRED"));
      assert.ok(!d.events.includes("write:update"));
      assert.ok(!d.sql.some(q => /FOR UPDATE/.test(q.sql)));
    } finally { d.dispose(); }
  }
});
test("N07 freshly changed metadata denies the command even when token snapshot otherwise matches", async () => {
  const d = new NativeOracleDouble();
  try {
    const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
    d.proof[3].push({ status: "ENABLED", name: "SYNTHETIC_NEW_TRIGGER" });
    await assert.rejects(app.commit(principal, nativeSelection, cmd(v)), errorEffect("LIVE_WRITES_DISABLED", "none"));
    assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
for (const condition of ["missing", "briefing", "station", "stage-late", "P2", "split", "cancel", "activity",
  "nonactivity", "unknown-flag", "invalid-policy", "unit-policy"] as const)
  test(`N01/N05 preserved business guard ${condition}, no native mutation or token`, async () => {
    const d = new NativeOracleDouble();
    try {
      const { app, principal } = await d.application();
      if (condition === "missing") d.rows.SHF_ATTENDANCE!.MISS_REASON_ID = "1";
      if (condition === "briefing") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
      if (condition === "station") d.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = "2026-10-20T12:00:00";
      if (condition === "stage-late") d.rows.SHF_ATTENDANCE!.STAGE_LATE_MINUTES = "0";
      if (condition === "P2") {
        // Reviewed synthetic metadata variant; make a new initialized app.
        d.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "TADREECH_P2", dataType: "NUMBER",
          dataLength: 22, charUsed: null, nullable: "Y", virtualColumn: "NO" });
        d.binding.metadataDigest = fingerprint(d.proof);
        d.rows.SHF_ATTENDANCE!.TADREECH_P2 = "1";
      }
      if (condition === "split") d.rows.SHF_EMPLOYEE_DAY!.SPLIT_SHIFT = "Y";
      if (condition === "unknown-flag") d.rows.SHF_EMPLOYEE_DAY!.SPLIT_SHIFT = "UNKNOWN";
      if (condition === "cancel") {
        d.rows.SHF_DAY_CHANGES = { SHF_EMPLOYEE_DAY_ID: "6201", NEW_EMPLOYEE_ID: "99999999", NEW_DAY_TYPE: "4",
          NEW_SHIFT_START: null, NEW_SHIFT_END: null, NEW_ACTIVITY: null, NEW_EXCEPTION_TYPE_ID: null,
          CANCEL_REASON_CODE: "1", NEW_SPLIT_SHIFT: null, NEW_SPLIT_START: null, NEW_SPLIT_END: null };
      }
      if (condition === "activity") d.rows.SHF_EMPLOYEE_DAY!.WM_SCH_ACTIVITY_ID_DATA = "synthetic-unsupported-activity";
      if (condition === "nonactivity") d.rows.SHF_EMPLOYEE_DAY!.WM_DAY_TYPE = "1";
      if (condition === "invalid-policy") d.rows.SHF_SYSTEM_PARAM!.DEFAULT_VALUE = "01";
      if (condition === "unit-policy") d.rows.SHF_UNIT_PARAM = { PARAM_KEY: "shf.param.minutesArrivalBeforeStation",
        ORG_UNIT_ID: "M001", PARAM_VALUE: "25" };
      const use = condition === "P2" ? await d.application() : { app, principal };
      await assert.rejects(use.app.validate(use.principal, nativeSelection, cleanNative),
        rejects(condition === "unknown-flag" || condition === "invalid-policy" ? "INVALID_SOURCE_DATA" : "COMMAND_SCOPE_DEFERRED"));
      assert.ok(!d.sql.some(q => /FOR UPDATE|UPDATE |INSERT/.test(q.sql)));
    } finally { d.dispose(); }
  });
