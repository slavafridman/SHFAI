import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, appendFileSync } from "node:fs";
import { CancellationOracleDouble, cancellationSelection as selection } from "./native-exit-cancellation-double.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { cancellationCommand } from "../station-exit-cancellation-validation.mts";
import { same } from "../stage-arrival-domain.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { record } from "../contract-validation.mts";
import type { NativeCommandAdmissionV1 } from "../native-command-coordinator-contracts.mts";
import type { CancellationOperationAdmissionV1 } from "../station-exit-cancellation-ports.mts";
const error = (code: string, effect = "none") => (e: unknown) => e instanceof StageArrivalError && e.code === code && e.effect === effect;
async function prepared(d: CancellationOracleDouble) {
  const result = await d.cancellationApplication();
  const v = await result.app.validate(result.principal, selection, {});
  const cmd = cancellationCommand({ commandId: randomUUID(), draft: {}, validationToken: v.validationToken,
    fingerprint: v.fingerprint, warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" },
    operationConfirmation: { accepted: true } });
  return { ...result, cmd, v };
}
test("native protocol clears only two NULLs, releases writer then independent READ ONLY and retains both guards", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd, coordinator, v } = await prepared(d);
    assert.ok(Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt) <= 30000);
    const before = structuredClone(d.rows), offset = d.events.length;
    await app.context(principal, selection); await app.validate(principal, selection, {});
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    assert.ok(!d.events.slice(offset).some(e => e.includes(":lock:") || e === "write:update"));
    const receipt = await app.command(principal, selection, cmd);
    assert.equal(receipt.commandId, cmd.commandId);
    assert.equal(receipt.employeeId, selection.employeeId);
    assert.equal(receipt.shiftDayId, selection.shiftDayId);
    assert.equal(receipt.businessTimeZone, "UTC");
    assert.equal(receipt.recorded.stationExitLocal, null);
    before.SHF_ATTENDANCE!.STATION_EXIT_TIME = null; before.SHF_ATTENDANCE!.STATION_EXIT_USER = null;
    assert.ok(same(d.rows, before));
    assert.equal(receipt.outcome, "oracle-test-committed");
    assert.ok(receipt.commitAcknowledgedAt && receipt.readBackVerifiedAt);
    const sql = d.sql.find(s => s.sql.includes("cancellation:update"))!;
    assert.match(sql.sql, /SET\s+STATION_EXIT_TIME=NULL,STATION_EXIT_USER=NULL WHERE/);
    assert.doesNotMatch(sql.sql, /\bINSERT\b|NEXTVAL|newExitLocal|:actor/);
    const lastWriteClose = d.events.lastIndexOf("write:close:false");
    assert.ok(d.events.indexOf("read:lease", lastWriteClose) > lastWriteClose);
    assert.ok(existsSync(d.cancellationBinding.allowanceFile));
    await assert.rejects(coordinator.assertAvailable(selection.employeeId), error("LIVE_WRITES_DISABLED"));
    await assert.rejects(app.command(principal, selection, { ...cmd, commandId: randomUUID() }), error("LIVE_WRITES_DISABLED"));
  } finally { d.dispose(); }
});
for (const count of [0, 2, undefined]) test(`native rowsAffected=${count} rolls back, retains admission, never receipts`, async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d); const before = structuredClone(d.rows);
    d.count = count;
    await assert.rejects(app.command(principal, selection, cmd), error(count === 0 ? "STALE_PREPARATION" : "INVALID_SOURCE_DATA", "rolled-back"));
    assert.ok(same(before, d.rows)); assert.equal(d.committed, false);
    assert.ok(existsSync(d.cancellationBinding.allowanceFile));
    await assert.rejects(app.context(principal, selection), error("LIVE_WRITES_DISABLED"));
  } finally { d.dispose(); }
});
for (const phase of ["commit", "commit-ack", "readback", "preservation", "close", "rollback"])
  test(`native ${phase} uncertainty yields UNKNOWN and no retry`, async () => {
    const d = new CancellationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d);
      if (phase === "rollback") d.count = 0;
      d.hook = event => {
        if (event === `write:${phase}` || phase === "close" && event === "write:close:false" ||
            phase === "readback" && d.committed && event === "read:lease") throw Error("synthetic fault");
        if (phase === "preservation" && event === "write:commit-ack") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
      };
      await assert.rejects(app.command(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
      d.hook = undefined;
      await assert.rejects(app.command(principal, selection, { ...cmd, commandId: randomUUID() }), error("LIVE_WRITES_DISABLED"));
      assert.equal(d.events.filter(e => e === "write:update").length, 1);
    } finally { d.dispose(); }
  });
for (const consent of ["warningConfirmation", "operationConfirmation"]) test(`native ${consent} missing: zero consumption`, async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd, coordinator } = await prepared(d);
    await assert.rejects(app.command(principal, selection, { ...cmd, [consent]: null }));
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    await coordinator.assertAvailable(selection.employeeId);
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
for (const field of ["owner", "overlay", "policy", "mapping", "employee", "unknown", "dependency", "candidates"])
  test(`native complete locked snapshot catches ${field} drift before DML`, async () => {
    const d = new CancellationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d);
      d.hook = event => {
        if (event !== "write:cancellation:lock:SHF_ATTENDANCE") return;
        if (field === "owner") d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = "99999998";
        if (field === "overlay") d.rows.SHF_DAY_CHANGES = { SHF_EMPLOYEE_DAY_ID: "6201" };
        if (field === "policy") d.rows.system0!.DEFAULT_VALUE = "3";
        if (field === "mapping") d.rows.mapping!.SOU_ORG_UNIT_ID = "M002";
        if (field === "employee") d.rows.SHF_EMPLOYEES!.LAST_NAME = "synthetic-changed";
        if (field === "unknown") d.rows.SHF_ATTENDANCE!.SYNTHETIC_UNOWNED = "nonneutral";
        if (field === "dependency") d.dependentRows.SHF_EMPLOYEE_REPORTS.push({ EMPLOYEE_ID: "9001", APPROVED_TIME: "2026-11-01T00:00:00" });
        if (field === "candidates") d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null });
      };
      await assert.rejects(app.command(principal, selection, cmd));
      assert.equal(d.events.includes("write:update"), false);
      assert.ok(existsSync(d.cancellationBinding.allowanceFile));
    } finally { d.dispose(); }
  });
for (const field of ["STAGE_ARRIVAL_USER", "STATION_ARRIVAL_USER", "SYNTHETIC_UNOWNED", "SOURCE", "dependency"])
  test(`native post-ACK preservation mismatch ${field} is UNKNOWN`, async () => {
    const d = new CancellationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d);
      d.hook = event => {
        if (event !== "write:commit-ack") return;
        if (field === "SOURCE") d.rows.SHF_EMPLOYEE_DAY!.SOURCE = null;
        else if (field === "dependency") d.dependentRows.SHF_EMPLOYEE_REPORTS.push({ EMPLOYEE_ID: "9001", APPROVED_TIME: null });
        else d.rows.SHF_ATTENDANCE![field] = "synthetic-drift";
      };
      await assert.rejects(app.command(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    } finally { d.dispose(); }
  });
test("native UoW denies absent/foreign opaque admissions before leasing a writer", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { uow } = await d.cancellationApplication(), before = await uow.read(), offset = d.events.length;
    await assert.rejects(uow.execute(before, () => {}, {} as NativeCommandAdmissionV1, {} as CancellationOperationAdmissionV1));
    assert.ok(!d.events.slice(offset).includes("write:lease"));
  } finally { d.dispose(); }
});
test("native prior coordinated exit consumed denies context/check without own allowance", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, coordinator } = await d.cancellationApplication();
    await coordinator.consume({ employeeId: selection.employeeId, operation: "station-exit", commandId: randomUUID() });
    await assert.rejects(app.context(principal, selection), error("LIVE_WRITES_DISABLED"));
    await assert.rejects(app.validate(principal, selection, {}), error("LIVE_WRITES_DISABLED"));
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
for (const point of ["write:cancellation:lock:SHF_ATTENDANCE", "write:updated", "write:commit-ack"])
  test(`native explicit abort at ${point} drains and closes safely`, async () => {
    const d = new CancellationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d), abort = new AbortController();
      d.hook = event => { if (event === point) abort.abort(); };
      await assert.rejects(app.command(principal, selection, cmd, abort.signal),
        error(point === "write:commit-ack" ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT",
          point === "write:commit-ack" ? "unknown" : point === "write:updated" ? "rolled-back" : "none"));
      assert.ok(d.events.includes("write:break"));
      assert.ok(d.events.some(e => e.startsWith("write:close:")));
      assert.ok(existsSync(d.cancellationBinding.allowanceFile));
    } finally { d.dispose(); }
  });
test("native ambient budget cancellation prevents DML even without explicit signal", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d), ambient = new AbortController();
    d.hook = event => { if (event === "write:cancellation:lock:SHF_ATTENDANCE") ambient.abort(); };
    await assert.rejects(withRequestBudget(ambient.signal, 5000, () => app.command(principal, selection, cmd)), error("DEPENDENCY_TIMEOUT"));
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
test("native actor capability drift while acquiring admissions denies pre-DML", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = event => { if (event === "write:cancellation:lock:SHF_ATTENDANCE") principal.capabilities = []; };
    await assert.rejects(app.command(principal, selection, cmd), error("UNAUTHENTICATED"));
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
test("dedicated limited Oracle protocol uses new waiver/metadata without fabricating two unknown views", async () => {
  const d = new CancellationOracleDouble(); d.limited = true;
  try {
    const { app, principal, cmd } = await prepared(d);
    const receipt = await app.command(principal, selection, cmd);
    assert.equal(receipt.outcome, "oracle-test-committed");
    assert.ok(!d.sql.some(s => /\b(?:dba_triggers|dba_role_privs)\b/i.test(s.sql)));
    assert.ok(d.cancellationBinding.metadataProvider === "owner-test-limited-v1");
    assert.equal(d.cancellationBinding.metadataCoverageWaiver.externalEffectsAssessment, "unknown-user-waived");
  } finally { d.dispose(); }
});
for (const briefing of [null, "0", "1"]) for (const stage of [false, true])
  test(`native preservation includes briefing=${briefing} coherent stage=${stage}`, async () => {
    const d = new CancellationOracleDouble();
    try {
      Object.assign(d.rows.SHF_ATTENDANCE!, { TADREECH: briefing,
        STAGE_ARRIVAL_TIME: stage ? d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME : null,
        STAGE_ARRIVAL_USER: stage ? "synthetic-stage-original" : null });
      const { app, principal, cmd } = await prepared(d);
      const before = structuredClone(d.rows.SHF_ATTENDANCE);
      const r = await app.command(principal, selection, cmd);
      assert.ok(same(d.rows.SHF_ATTENDANCE, { ...before, STATION_EXIT_TIME: null, STATION_EXIT_USER: null }));
      assert.equal(r.recorded.briefing, briefing === null ? null : briefing === "1");
    } finally { d.dispose(); }
  });
for (const deferred of ["early", "missing", "late", "flag", "locked", "report", "historical", "partner-required", "partner-unknown"])
  test(`native ${deferred} never prepares or consumes allowance`, async () => {
    const d = new CancellationOracleDouble();
    try {
      if (deferred === "early") d.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME;
      if (deferred === "missing") d.rows.SHF_ATTENDANCE!.MISS_REASON_ID = "1";
      if (deferred === "late") d.rows.SHF_ATTENDANCE!.LATE_REASON_ID = "1";
      if (deferred === "flag") d.rows.SHF_ATTENDANCE!.OPTIONAL1 = "Y";
      if (deferred === "locked") d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1";
      if (deferred === "report") d.reports = "1";
      if (deferred === "historical") {
        d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME = "2026-10-28T08:00:00";
        d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME = "2026-10-28T16:00:00";
        d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME = "2026-10-28T08:00:00";
        d.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = "2026-10-28T15:59:59";
      }
      await d.certifyCancellation();
      if (deferred.startsWith("partner-")) {
        // Reparse an explicitly different review, not mutate frozen authority.
        const b = structuredClone(d.cancellationBinding);
        b.partnerReview.assessment = deferred === "partner-required" ? "required" : "unknown";
        d.cancellationBinding = b;
      }
      const { app, principal } = await d.cancellationApplication();
      await assert.rejects(app.validate(principal, selection, {}));
      assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
      assert.equal(d.events.includes("write:update"), false);
    } finally { d.dispose(); }
  });
test("native consumed own allowance file drift rejects synchronously pre-DML and stays consumed", async () => {
  const d = new CancellationOracleDouble();
  try {
    const { app, principal, cmd, coordinator } = await prepared(d);
    d.hook = event => {
      if (event === "write:cancellation:lock:SHF_ATTENDANCE")
        appendFileSync(d.cancellationBinding.allowanceFile, "synthetic-corruption");
    };
    await assert.rejects(app.command(principal, selection, cmd), error("LIVE_WRITES_DISABLED"));
    assert.equal(d.events.includes("write:update"), false);
    assert.ok(existsSync(d.cancellationBinding.allowanceFile));
    await assert.rejects(coordinator.assertAvailable(selection.employeeId), error("LIVE_WRITES_DISABLED"));
  } finally { d.dispose(); }
});
test("native startup may precede operator window, but no preparation before start", async () => {
  const d = new CancellationOracleDouble();
  try {
    d.binding.windowStart = new Date(d.clockMs + 60000).toISOString();
    const { app, principal } = await d.cancellationApplication();
    await app.assertReady();
    await assert.rejects(app.validate(principal, selection, {}), error("COMMAND_SCOPE_DEFERRED"));
    assert.equal(d.events.includes("write:update"), false);
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("native current physical overlay projection preserves neutral new column in snapshot and readback", async () => {
  for (const overlay of [false, true]) {
    const d = new CancellationOracleDouble();
    try {
      d.proof[0].push({ tableName: "SHF_DAY_CHANGES", columnName: "SYNTHETIC_OVERLAY",
        dataType: "VARCHAR2", dataLength: 100, charUsed: "B", nullable: "Y", virtualColumn: "NO" });
      if (overlay) d.rows.SHF_DAY_CHANGES = Object.fromEntries(
        d.proof[0].filter(r => record(r) && r.tableName === "SHF_DAY_CHANGES")
          .map(r => {
            if (!record(r) || typeof r.columnName !== "string")
              throw Error("Isolated invalid column");
            return [r.columnName, r.columnName === "SHF_EMPLOYEE_DAY_ID" ? selection.shiftDayId : null];
          }));
      const { app, principal, cmd, uow } = await prepared(d);
      const before = await uow.read();
      assert.equal(before.dependencies.completeEvidence.candidates[0].change?.SYNTHETIC_OVERLAY, overlay ? null : undefined);
      assert.equal(before.rows.SHF_DAY_CHANGES?.SYNTHETIC_OVERLAY, overlay ? null : undefined);
      const receipt = await app.command(principal, selection, cmd);
      assert.equal(receipt.outcome, "oracle-test-committed");
      assert.ok(receipt.readBackVerifiedAt);
      const after = await uow.read();
      assert.deepEqual(after.dependencies.completeEvidence, before.dependencies.completeEvidence);
      assert.deepEqual(after.rows.SHF_DAY_CHANGES, before.rows.SHF_DAY_CHANGES);
      assert.ok(d.sql.filter(s => s.sql.includes("exit:candidates")).every(s =>
        s.sql.includes('c.SYNTHETIC_OVERLAY AS "c_SYNTHETIC_OVERLAY"')));
      const incompleteDay = { ...d.rows.SHF_EMPLOYEE_DAY! };
      delete incompleteDay.SOURCE;
      d.extraCandidates.push({ day: incompleteDay, change: d.rows.SHF_DAY_CHANGES });
      await assert.rejects(uow.read(), error("INVALID_SOURCE_DATA"));
    } finally { d.dispose(); }
  }
});
test("native real parser rejects nonneutral new column in a coherent physical overlay before DML", async () => {
  const d = new CancellationOracleDouble();
  try {
    d.proof[0].push({ tableName: "SHF_DAY_CHANGES", columnName: "SYNTHETIC_OVERLAY",
      dataType: "VARCHAR2", dataLength: 100, charUsed: "B", nullable: "Y", virtualColumn: "NO" });
    d.rows.SHF_DAY_CHANGES = Object.fromEntries(
      d.proof[0].filter(r => record(r) && r.tableName === "SHF_DAY_CHANGES")
        .map(r => {
          if (!record(r) || typeof r.columnName !== "string")
            throw Error("Isolated invalid column");
          return [r.columnName, r.columnName === "SHF_EMPLOYEE_DAY_ID" ? selection.shiftDayId : null];
        }));
    const { app, principal, cmd, uow } = await prepared(d);
    d.rows.SHF_DAY_CHANGES.SYNTHETIC_OVERLAY = "synthetic-nonneutral";
    await assert.rejects(uow.read(), error("COMMAND_SCOPE_DEFERRED"));
    await assert.rejects(app.validate(principal, selection, {}), error("COMMAND_SCOPE_DEFERRED"));
    assert.equal(existsSync(d.cancellationBinding.allowanceFile), false);
    await assert.rejects(app.command(principal, selection, cmd), error("COMMAND_SCOPE_DEFERRED"));
    assert.equal(d.events.includes("write:update"), false);
    assert.equal(d.committed, false);
  } finally { d.dispose(); }
});
