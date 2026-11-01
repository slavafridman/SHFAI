import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lateOracleDouble, lateDraft, lateSelection, lateConfig } from "./native-station-arrival-late-double.mts";
import type { NativeLateStationValidationV1 } from "../oracle-station-arrival-late-contracts.mts";
import { OracleLateStationArrivalUow } from "../oracle-station-arrival-late-uow.mts";
import type { NativeCommandAdmissionV1 } from "../native-command-coordinator-contracts.mts";
import { BoundedLateStationObligations } from "../station-arrival-late-obligations.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { lateBinding } from "../native-station-arrival-late-config.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { OracleLateStationArrivalApplication } from "../oracle-station-arrival-late-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
const command = (v: NativeLateStationValidationV1) => ({ commandId: randomUUID(), draft: lateDraft,
  validationToken: v.validationToken, fingerprint: v.fingerprint,
  confirmation: { accepted: true as const, warningCodes: ["STATION_ARRIVAL_LATE"] as ["STATION_ARRIVAL_LATE"] },
  operationConfirmation: { accepted: true as const } });
test("DST-crossing actual context defers and validation grants no command authority or coordinator/DML effects", async () => {
  const f = lateOracleDouble();
  try {
    f.d.clockMs = Date.parse("2026-03-08T07:30:00.000Z");
    Object.assign(f.d.rows.SHF_EMPLOYEE_DAY!, {
      WM_SHIFT_START_DATETIME: "2026-03-08T00:30:00", WM_SHIFT_END_DATETIME: "2026-03-08T04:00:00",
      WM_DATE: "2026-03-08T00:00:00", WM_START_DATETIME: "2026-03-08T00:30:00", WM_END_DATETIME: "2026-03-08T04:00:00",
    });
    const binding = lateBinding({ ...f.binding,
      windowStart: "2026-03-08T07:00:00.000Z", windowEnd: "2026-03-08T08:00:00.000Z" });
    const zone = "America/New_York";
    const uow = new OracleLateStationArrivalUow(f.d.writePool, new OracleReadSession(f.d.readPool), binding, zone, f.coordinator);
    await uow.initialize();
    const app = new OracleLateStationArrivalApplication(uow, binding, f.d.clock, zone, ["T001"], new BoundedLateStationObligations());
    const principal = await new SyntheticAdministratorProvider({ ...lateConfig, businessTimeZone: zone })
      .authenticate({ authorization: null });
    const directory = (JSON.parse(f.environment().SHF_NATIVE_COMMAND_COORDINATOR_CONFIG!) as { directory: string }).directory;
    const records = () => readdirSync(directory).map(name => [name, readFileSync(join(directory, name), "utf8")]);
    const beforeRecords = records(), beforeRows = structuredClone(f.d.rows), beforeEvents = f.d.events.length;
    const context = await app.context(principal, lateSelection);
    assert.equal(context.eligibility, "deferred");
    assert.equal(context.withinArrivalWindow, false);
    assert.equal("validationToken" in context, false);
    await assert.rejects(app.validate(principal, lateSelection, lateDraft), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.deepEqual(records(), beforeRecords);
    await f.coordinator.assertAvailable(lateSelection.employeeId);
    assert.equal(existsSync(binding.allowanceFile), false);
    assert.equal(f.d.sql.some(s => /FOR UPDATE|NEXTVAL|\b(?:UPDATE|INSERT|DELETE|MERGE)\s+SHIFTER/i.test(s.sql)), false);
    assert.equal(f.d.events.slice(beforeEvents).some(e => e.startsWith("write:")), false);
    assert.deepEqual(f.d.rows, beforeRows);
  } finally { f.d.dispose(); }
});
test("late context/validation PURE0; actual five-SET kernel, NULL stage, full preservation, ACK and independent readback", async () => {
  const f = lateOracleDouble();
  try {
    const { app, principal } = await f.application(), before = structuredClone(f.d.rows);
    const context = await app.context(principal, lateSelection);
    assert.deepEqual(context.lateReasonOptions, [{ code: "1001", label: "Synthetic late reason" }]);
    const v = await app.validate(principal, lateSelection, lateDraft);
    assert.deepEqual(v.warnings, [{ code: "STATION_ARRIVAL_LATE", minutes: "0" }]);
    assert.equal(existsSync(f.binding.allowanceFile), false);
    assert.equal(f.d.sql.some(s => /FOR UPDATE|NEXTVAL|UPDATE SHIFTER/i.test(s.sql)), false);
    const receipt = await app.command(principal, lateSelection, command(v));
    assert.equal(receipt.recorded.stationLate.minutes, "0");
    assert.equal(receipt.recorded.stageArrivalLocal, null); assert.equal(receipt.recorded.briefing, null);
    assert.equal(receipt.partnerCompletion, "not-invoked");
    const updates = f.d.sql.filter(s => s.sql.includes("station-late:update")); assert.equal(updates.length, 1);
    assert.ok(Object.keys(updates[0]!.binds).every(key => key.length <= 30));
    const locks = f.d.sql.filter(s => s.sql.includes("station-late:lock:"));
    assert.ok(locks.some(s => s.sql.includes("SHF_EVENT_REASON")));
    assert.ok(locks.every(s => /ROWNUM<=|ROWNUM\s*<=/.test(s.sql) && /FOR UPDATE NOWAIT/.test(s.sql)));
    const set = updates[0]!.sql.split(" SET")[1]!.split(" WHERE")[0]!;
    assert.deepEqual([...set.replace(/'[^']*'/g, "''").matchAll(/\b([A-Z_]+)\s*=/g)].map(m => m[1]),
      ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER", "LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"]);
    const expected = structuredClone(before);
    Object.assign(expected.SHF_ATTENDANCE!, { STATION_ARRIVAL_TIME: receipt.recorded.stationArrivalLocal,
      STATION_ARRIVAL_USER: principal.subject, LATE_REASON_ID: "1001", LATE_MINUTES: "0", LATE_REMARK: null });
    assert.deepEqual(f.d.rows, expected);
    const ack = f.d.events.indexOf("write:commit-ack"), release = f.d.events.indexOf("write:close:false", ack);
    assert.ok(release > ack); assert.ok(f.d.events.indexOf("read:lease", release) > release);
    await assert.rejects(f.coordinator.assertAvailable(lateSelection.employeeId), { code: "LIVE_WRITES_DISABLED" });
  } finally { f.d.dispose(); }
});
for (const fault of ["row0", "row2", "ack", "readback", "expiry", "reason", "locked"] as const) {
  test(`late ${fault}: no retry, retained global fence only after attempt; business validation preserved`, async () => {
    const f = lateOracleDouble();
    try {
      const { app, principal } = await f.application();
      if (fault === "locked") f.d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1";
      if (fault === "reason") {
        await assert.rejects(app.validate(principal, lateSelection, { ...lateDraft, lateReasonCode: "1002" }),
          { code: "BUSINESS_VALIDATION_FAILED" }); return;
      }
      if (fault === "locked") {
        await assert.rejects(app.validate(principal, lateSelection, lateDraft), { code: "COMMAND_SCOPE_DEFERRED" }); return;
      }
      const v = await app.validate(principal, lateSelection, lateDraft);
      if (fault === "expiry") f.d.clockMs = Date.parse(v.expiresAt);
      if (fault === "row0") f.d.count = 0;
      if (fault === "row2") f.d.count = 2;
      if (fault === "ack") f.d.hook = event => { if (event === "write:commit-ack") throw Error("Isolated ACK loss"); };
      if (fault === "readback") f.d.hook = event => { if (event === "read:lease" && f.d.committed) throw Error("Isolated readback loss"); };
      await assert.rejects(app.command(principal, lateSelection, command(v)), { code:
        fault === "expiry" ? "STALE_PREPARATION" : fault === "row0" ? "STALE_PREPARATION" :
        fault === "row2" ? "INVALID_SOURCE_DATA" : "COMMAND_OUTCOME_UNKNOWN" });
      if (fault === "expiry") assert.equal(existsSync(f.binding.allowanceFile), false);
      else await assert.rejects(f.coordinator.assertAvailable(lateSelection.employeeId));
      assert.ok(f.d.events.filter(e => e === "write:commit").length <= 1);
    } finally { f.d.dispose(); }
  });
}
test("direct late UoW missing/foreign admission fails before pool or DML", async () => {
  const f = lateOracleDouble();
  try {
    const { uow } = await f.application(), snapshot = await uow.read(), before = f.d.events.length;
    await assert.rejects(uow.execute(snapshot, () => ({ local: "2026-10-28T12:00:00", actor: "synthetic:administrator",
      reasonCode: "1001", minutes: 0 }), {} as NativeCommandAdmissionV1), { code: "LIVE_WRITES_DISABLED" });
    assert.equal(f.d.events.length, before);
    assert.throws(() => Reflect.construct(OracleLateStationArrivalUow, [f.d.writePool, {}, f.binding, "UTC"]),
      { code: "LIVE_WRITES_DISABLED" });
  } finally { f.d.dispose(); }
});
test("required/unknown partner, remark/report flags, catalog/locked original changes defer with zero transport", async () => {
  for (const state of ["required", "unknown"] as const) {
    const f = lateOracleDouble();
    try {
      const partner = new BoundedLateStationObligations();
      partner.assess = () => ({ state, effects: ["cti-arrival"] });
      const { app, principal } = await f.application(partner);
      const context = await app.context(principal, lateSelection);
      assert.equal(context.eligibility, "deferred");
      await assert.rejects(app.validate(principal, lateSelection, lateDraft), { code: "COMMAND_SCOPE_DEFERRED" });
      assert.equal(existsSync(f.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:commit"), false);
    } finally { f.d.dispose(); }
  }
  for (const fault of ["reason-flags", "catalog-change", "schedule-counters"] as const) {
    const f = lateOracleDouble();
    try {
      const { app, principal } = await f.application();
      if (fault === "reason-flags") {
        f.d.lateReasons![0]!.REPORT_REQUESTED = "1";
        await assert.rejects(app.validate(principal, lateSelection, lateDraft), { code: "COMMAND_SCOPE_DEFERRED" });
        assert.equal(existsSync(f.binding.allowanceFile), false);
      } else {
        const v = await app.validate(principal, lateSelection, lateDraft);
        if (fault === "catalog-change") f.d.lateReasons![0]!.REASON_DESC = "Synthetic changed catalog";
        else f.d.rows.SHF_EMPLOYEE_DAY!.WM_PAID_MINUTES = "481";
        await assert.rejects(app.command(principal, lateSelection, command(v)), { code: "STALE_PREPARATION" });
        assert.equal(f.d.events.includes("write:update"), false);
        await assert.rejects(f.coordinator.assertAvailable(lateSelection.employeeId));
      }
    } finally { f.d.dispose(); }
  }
});
test("late explicit cancellation breaks and drains an uncooperative COMMIT; ACK after cancellation is UNKNOWN, never retry", async () => {
  const f = lateOracleDouble(), abort = new AbortController();
  let entered!: () => void, release!: () => void;
  const reached = new Promise<void>(r => { entered = r; }), gate = new Promise<void>(r => { release = r; });
  try {
    const { app, principal } = await f.application(), v = await app.validate(principal, lateSelection, lateDraft);
    f.d.hook = async event => { if (event === "write:commit") { entered(); await gate; } };
    const running = app.command(principal, lateSelection, command(v), abort.signal);
    void running.catch(() => {});
    await reached; abort.abort();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(f.d.events.includes("write:break"), true);
    assert.equal(f.d.events.slice(f.d.events.indexOf("write:commit")).some(e => e.startsWith("write:close:")), false);
    release();
    await assert.rejects(running, { code: "COMMAND_OUTCOME_UNKNOWN" });
    assert.equal(f.d.events.filter(e => e === "write:commit").length, 1);
    assert.ok(f.d.events.includes("write:close:true"));
    await assert.rejects(f.coordinator.assertAvailable(lateSelection.employeeId));
  } finally { release?.(); f.d.dispose(); }
});
test("late command respects an existing ALS budget instead of granting another 5000ms", async () => {
  const f = lateOracleDouble();
  try {
    const { app, principal } = await f.application(), v = await app.validate(principal, lateSelection, lateDraft);
    const abort = new AbortController();
    await assert.rejects(withRequestBudget(abort.signal, 0, () => app.command(principal, lateSelection, command(v))),
      { code: "DEPENDENCY_TIMEOUT" });
    assert.equal(f.d.events.includes("write:update"), false); assert.equal(existsSync(f.binding.allowanceFile), false);
  } finally { f.d.dispose(); }
});
