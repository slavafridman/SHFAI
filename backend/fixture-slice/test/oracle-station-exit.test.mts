import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ExitOracleDouble, exitSelection as selection } from "./native-station-exit-double.mts";
import { exitCommand, validExitReceipt } from "../station-exit-validation.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { same } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { OracleStationExitApplication } from "../oracle-station-exit-application.mts";
import type { StationExitValidationV1 } from "../station-exit-contracts.mts";
import { exitBinding, exitIdentityReference } from "../native-station-exit-config.mts";
import { exitTables, exitPolicyKeys } from "../oracle-station-exit-snapshot.mts";
const command = (v: StationExitValidationV1) => exitCommand({ commandId: randomUUID(), draft: {},
  validationToken: v.validationToken, fingerprint: v.fingerprint, operationConfirmation: { accepted: true } });
const error = (code: string, effect = "none") => (e: unknown) => e instanceof StageArrivalError && e.code === code && e.effect === effect;
async function prepared(d: ExitOracleDouble) {
  const { app, principal, uow } = await d.application();
  const v = await app.validate(principal, selection, {});
  return { app, principal, uow, cmd: command(v) };
}
for (const briefing of [null, "0", "1"]) for (const stage of [null, "2026-10-28T07:59:00"])
  test(`exit preserves full attendance briefing=${briefing},stage=${stage}`, async () => {
    const d = new ExitOracleDouble();
    try {
      Object.assign(d.rows.SHF_ATTENDANCE!, { TADREECH: briefing, STAGE_ARRIVAL_TIME: stage, STAGE_ARRIVAL_USER: stage && "synthetic-original" });
      const before = structuredClone(d.rows.SHF_ATTENDANCE), { app, principal, cmd } = await prepared(d);
      const noWrite = d.events.length;
      await app.context(principal, selection); await app.validate(principal, selection, {});
      assert.equal(existsSync(d.binding.allowanceFile), false);
      assert.ok(!d.events.slice(noWrite).some(v => v.startsWith("write:")));
      const receipt = await app.commit(principal, selection, cmd);
      assert.ok(validExitReceipt(receipt, cmd, selection));
      assert.ok(same(d.rows.SHF_ATTENDANCE, { ...before, STATION_EXIT_TIME: "2026-10-28T15:59:30",
        STATION_EXIT_USER: "synthetic:administrator" }));
      const update = d.sql.find(s => s.sql.includes("exit:update")); assert.ok(update);
      const set = update.sql.split(" SET")[1].split(" WHERE")[0];
      assert.equal((set.match(/\bSTATION_EXIT_(?:TIME|USER)=/g) ?? []).length, 2);
      assert.match(set, /STATION_EXIT_TIME=/); assert.match(set, /STATION_EXIT_USER=/);
      assert.doesNotMatch(set, /STATION_ARRIVAL|TADREECH|INSERT|STAGE_|NEXTVAL/);
      for (const table of ["SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM", "SHF_ORG_UNITS_SHF_SITES", "SHF_EMPLOYEE_EXCEPTIONS_BASE"])
        assert.ok(update.sql.includes(table));
      assert.ok(record(update.binds));
      for (const value of Object.values(before!)) assert.ok(Object.values(update.binds).includes(value));
      await assert.rejects(app.commit(principal, selection, { ...cmd, commandId: randomUUID() }), error("ALREADY_REGISTERED"));
    } finally { d.dispose(); }
  });
for (const [label, change, code] of [
  ["station required", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME = null; d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_USER = null; }, "COMMAND_SCOPE_DEFERRED"],
  ["row required", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE = null; }, "COMMAND_SCOPE_DEFERRED"],
  ["locked", (d: ExitOracleDouble) => { d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1"; }, "COMMAND_SCOPE_DEFERRED"],
  ["report", (d: ExitOracleDouble) => { d.reports = "1"; }, "COMMAND_SCOPE_DEFERRED"],
  ["exception", (d: ExitOracleDouble) => { d.baseExceptions = "1"; }, "COMMAND_SCOPE_DEFERRED"],
  ["missing", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.MISS_REASON_ID = "1"; }, "COMMAND_SCOPE_DEFERRED"],
  ["flag", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.OPTIONAL1 = "Y"; }, "COMMAND_SCOPE_DEFERRED"],
  ["late", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.STAGE_LATE_REASON_ID = "1"; }, "COMMAND_SCOPE_DEFERRED"],
  ["overlap", (d: ExitOracleDouble) => { d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null }); }, "COMMAND_SCOPE_DEFERRED"],
  ["orphan exit", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = "synthetic"; }, "INVALID_SOURCE_DATA"],
  ["orphan station", (d: ExitOracleDouble) => { d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_USER = null; }, "INVALID_SOURCE_DATA"],
  ["future stage", (d: ExitOracleDouble) => { Object.assign(d.rows.SHF_ATTENDANCE!, { STAGE_ARRIVAL_TIME: "2026-10-28T09:00:00", STAGE_ARRIVAL_USER: "synthetic" }); }, "INVALID_SOURCE_DATA"],
  ["unknown flag", (d: ExitOracleDouble) => { d.rows.SHF_EMPLOYEES!.SHF_LOCKED = null; }, "INVALID_SOURCE_DATA"],
  ["mapping parent", (d: ExitOracleDouble) => { d.rows.mapping!.SOU_ORG_UNIT_ID = "M002"; }, "INVALID_SOURCE_DATA"],
  ["policy missing", (d: ExitOracleDouble) => { d.rows.system0 = null; }, "INVALID_SOURCE_DATA"],
] as const) test(`exit ${label} fails without allowance/DML`, async () => {
  const d = new ExitOracleDouble();
  try {
    change(d); const { app, principal } = await d.application();
    await assert.rejects(app.validate(principal, selection, {}), error(code));
    assert.equal(existsSync(d.binding.allowanceFile), false); assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
for (const count of [0, 2, undefined]) test(`exit rowsAffected=${count} is not success`, async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d); d.count = count;
    await assert.rejects(app.commit(principal, selection, cmd), error(count === 0 ? "STALE_PREPARATION" : "INVALID_SOURCE_DATA", "rolled-back"));
    assert.equal(d.committed, false); assert.ok(d.events.includes("write:rollback"));
    assert.equal(existsSync(d.binding.allowanceFile), true);
  } finally { d.dispose(); }
});
for (const field of ["policy", "mapping", "report", "briefing", "owner", "overlay", "overlap"])
  test(`exit locked re-read detects changed ${field}`, async () => {
    const d = new ExitOracleDouble();
    try {
      const { app, principal, cmd, uow } = await prepared(d);
      d.hook = event => {
        if (event !== "write:exit:lock:SHF_EMPLOYEES") return;
        if (field === "policy") d.rows.system0!.DEFAULT_VALUE = "5";
        if (field === "mapping") d.rows.mapping!.SOU_ORG_UNIT_ID = "M002";
        if (field === "report") d.reports = "1";
        if (field === "briefing") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
        if (field === "owner") d.rows.SHF_EMPLOYEES!.ORG_UNIT_ID = "T002";
        if (field === "overlay") d.rows.SHF_DAY_CHANGES = { ...Object.fromEntries(Object.keys(d.rows.SHF_EMPLOYEE_DAY!).map(k => [k, null])),
          SHF_EMPLOYEE_DAY_ID: "6201" };
        if (field === "overlap") d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null });
      };
      await assert.rejects(app.commit(principal, selection, cmd));
      assert.equal(d.events.includes("write:update"), false);
    } finally { d.dispose(); }
  });
for (const phase of ["commit", "commit-ack", "readback", "preservation"])
  test(`exit ${phase} ambiguous => UNKNOWN and no retry`, async () => {
    const d = new ExitOracleDouble();
    try {
      const { app, principal, cmd, uow } = await prepared(d);
      d.hook = event => {
        if (event === `write:${phase}` || phase === "readback" && d.committed && event === "read:lease") throw Error("synthetic failure");
        if (phase === "preservation" && event === "write:commit-ack") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
      };
      await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
      await assert.rejects(app.commit(principal, selection, { ...cmd, commandId: randomUUID() }));
      assert.equal(d.events.filter(e => e === "write:update").length, 1);
      assert.throws(() => new OracleStationExitApplication(uow, d.binding, d.clock, "UTC", ["T001"]), /LIVE_WRITES_DISABLED/);
    } finally { d.dispose(); }
  });
test("exit concurrent tuple admission, changed payload conflict, foreign token leaves fuse unused", async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    await assert.rejects(app.commit(principal, selection, { ...cmd, validationToken: "x".repeat(43) }), error("STALE_PREPARATION"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
    let release!: () => void, entered!: () => void;
    const hold = new Promise<void>(r => { release = r; }), at = new Promise<void>(r => { entered = r; });
    d.hook = async e => { if (e === "write:lease") { entered(); await hold; } };
    const pending = app.commit(principal, selection, cmd); await at;
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_IN_PROGRESS"));
    await assert.rejects(app.commit(principal, selection, { ...cmd, commandId: randomUUID() }), error("COMMAND_IN_PROGRESS"));
    await assert.rejects(app.commit(principal, selection, { ...cmd, fingerprint: "a".repeat(64) }), error("COMMAND_ID_CONFLICT"));
    release(); await pending;
  } finally { d.dispose(); }
});
for (const phase of ["write:exit:lock:SHF_EMPLOYEES", "write:update", "write:commit", "write:commit-ack"])
  for (const ambient of [false, true]) test(`exit ${ambient ? "ALS" : "signal"} abort at ${phase}`, async () => {
    const d = new ExitOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d), abort = new AbortController();
      d.hook = e => { if (e === phase) abort.abort(); };
      const work = () => app.commit(principal, selection, cmd, ambient ? undefined : abort.signal);
      await assert.rejects(ambient ? withRequestBudget(abort.signal, 5000, work) : work(),
        error(phase.includes("commit") ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT",
          phase.includes("commit") ? "unknown" : phase === "write:update" ? "rolled-back" : "none"));
      assert.ok(d.events.includes("write:break"));
      if (!phase.includes("commit")) assert.equal(d.committed, false);
    } finally { d.dispose(); }
  });
for (const slot of [3, 7]) test(`exit hybrid retained DBA slot ${slot} 942 denies readiness`, async () => {
  const d = new ExitOracleDouble();
  try {
    d.binding.metadataProvider = "owner-hybrid-v1"; d.certify();
    d.hook = e => { if (e === `write:exit:metadata:${slot}`) throw { code: "ORA-00942" }; };
    await assert.rejects(d.application(), error("DEPENDENCY_UNAVAILABLE"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
for (const table of ["SHF_ATTENDANCE", "SHF_DAY_CHANGES", "SHF_EMPLOYEE_DAY", "SHF_ORG_UNITS_SHF_SITES",
  "SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM"]) test(`exit ${table} multiplicity fails closed`, async () => {
  const d = new ExitOracleDouble();
  try {
    if (table === "SHF_DAY_CHANGES") d.rows.SHF_DAY_CHANGES = Object.fromEntries(
      exitTables.SHF_DAY_CHANGES.map(k => [k, k === "SHF_EMPLOYEE_DAY_ID" ? "6201" : null]));
    if (table === "SHF_UNIT_PARAM") d.rows.unit0 = { PARAM_KEY: exitPolicyKeys[0], ORG_UNIT_ID: "M001", PARAM_VALUE: null };
    d.duplicateTable = table;
    const { app, principal } = await d.application();
    await assert.rejects(app.validate(principal, selection, {}), error("AMBIGUOUS_ATTENDANCE"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("exit actual LATE_* triplet is a blocker; no invented STATION_LATE_* schema dependency", async () => {
  const d = new ExitOracleDouble();
  try {
    assert.ok(exitTables.SHF_ATTENDANCE.includes("LATE_REASON_ID"));
    assert.ok(!Object.keys(d.rows.SHF_ATTENDANCE!).some(k => k.startsWith("STATION_LATE_")));
    d.rows.SHF_ATTENDANCE!.LATE_MINUTES = "0";
    const { app, principal } = await d.application();
    assert.deepEqual((await app.context(principal, selection)).blockers, ["EXISTING_LATE"]);
    await assert.rejects(app.validate(principal, selection, {}), error("COMMAND_SCOPE_DEFERRED"));
  } finally { d.dispose(); }
});
test("exit policy null/absent fallback originals and effective site override are actual facts", async () => {
  const d = new ExitOracleDouble();
  try {
    d.rows.SHF_DAY_CHANGES = Object.fromEntries(exitTables.SHF_DAY_CHANGES.map(k =>
      [k, k === "SHF_EMPLOYEE_DAY_ID" ? "6201" : k === "NEW_SITE_ID" ? "7002" : null]));
    d.rows.mapping!.SS_SITE_ID = "7002";
    d.rows.system0!.DEFAULT_VALUE = null;
    d.rows.unit0 = { PARAM_KEY: exitPolicyKeys[0], ORG_UNIT_ID: "M001", PARAM_VALUE: "0005" };
    d.rows.unit1 = { PARAM_KEY: exitPolicyKeys[1], ORG_UNIT_ID: "M001", PARAM_VALUE: null };
    const { app, principal, cmd } = await prepared(d);
    const context = await app.context(principal, selection);
    assert.deepEqual(context.policy, { maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 10 });
    await app.commit(principal, selection, cmd);
    const update = d.sql.find(s => s.sql.includes("exit:update")); assert.ok(update && record(update.binds));
    assert.equal(update.binds.site, "7002");
    assert.ok(Object.values(update.binds).includes("0005"));
  } finally { d.dispose(); }
});
for (const b of [0, 5]) test(`exit B=${b} exact early denies token; +1ms ordinary commits civil second`, async () => {
  const d = new ExitOracleDouble();
  try {
    d.rows.system0!.DEFAULT_VALUE = String(b);
    const boundary = Date.parse("2026-10-28T16:00:00Z") - (b + 1) * 60000;
    d.clockMs = boundary;
    const { app, principal } = await d.application();
    assert.equal((await app.context(principal, selection)).classification, "early-manager-decision-deferred");
    await assert.rejects(app.validate(principal, selection, {}), error("COMMAND_SCOPE_DEFERRED"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
    d.clockMs++;
    const v = await app.validate(principal, selection, {}), cmd = command(v);
    const r = await app.commit(principal, selection, cmd);
    assert.equal(r.recorded.stationExitLocal, new Date(boundary).toISOString().slice(0, 19));
  } finally { d.dispose(); }
});
test("exit inclusive upper has 1ms preparation, +1ms expires without allowance", async () => {
  const d = new ExitOracleDouble();
  try {
    d.clockMs = Date.parse("2026-10-28T16:10:00Z");
    const { app, principal } = await d.application();
    const v = await app.validate(principal, selection, {});
    assert.equal(Date.parse(v.expiresAt) - d.clockMs, 1);
    d.clockMs++;
    await assert.rejects(app.commit(principal, selection, command(v)), error("STALE_PREPARATION"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
for (const reason of ["expired", "rewind"]) test(`exit ${reason} immediately pre-COMMIT rolls back`, async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:updated") d.clockMs += reason === "expired" ? 120001 : -1; };
    await assert.rejects(app.commit(principal, selection, cmd), error("STALE_PREPARATION", "rolled-back"));
    assert.equal(d.committed, false); assert.ok(!d.events.includes("write:commit"));
  } finally { d.dispose(); }
});
test("exit NOWAIT contention has no DML or retry", async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:exit:lock:SHF_ATTENDANCE") throw { code: "ORA-00054" }; };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_IN_PROGRESS"));
    assert.equal(d.events.filter(e => e === "write:exit:lock:SHF_ATTENDANCE").length, 1);
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
test("exit DML failure with unproved rollback is UNKNOWN, not none or retryable", async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (["write:update", "write:rollback"].includes(e)) throw Error("synthetic"); };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    assert.ok(d.events.includes("write:close:true"));
  } finally { d.dispose(); }
});
test("exit metadata certificate drift and mismatched provider/identity constructions fail closed", async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, uow, cmd } = await prepared(d);
    for (const patch of [{ exitMetadataDigest: "a".repeat(64) }, { metadataProvider: "owner-hybrid-v1" as const },
      { readIdentity: { ...d.binding.readIdentity, user: "SYNTHETIC_OTHER" } }]) {
      const b = exitBinding({ ...d.binding, ...patch });
      assert.notEqual(exitIdentityReference(b), exitIdentityReference(d.binding));
      assert.throws(() => new OracleStationExitApplication(uow, b, d.clock, "UTC", ["T001"]), /identity reference/);
    }
    d.proof[8].push({ name: "SYNTHETIC_DRIFT" });
    await assert.rejects(app.commit(principal, selection, cmd), error("LIVE_WRITES_DISABLED"));
    assert.equal(d.events.includes("write:update"), false);
  } finally { d.dispose(); }
});
test("exit operation allowance rejects a physical junction ancestor", () => {
  const d = new ExitOracleDouble();
  const link = join(d.directory, "synthetic-alias");
  try {
    symlinkSync(d.directory, link, process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => exitBinding({ ...d.binding, allowanceFile: join(link, "station-exit-unused") }));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { if (existsSync(link)) unlinkSync(link); d.dispose(); }
});
test("exit foreign preparation/source, changed actor/grants/tuple cannot acquire writer or consume allowance", async () => {
  const d = new ExitOracleDouble(), foreign = new ExitOracleDouble();
  try {
    const { app, principal } = await d.application();
    const other = await prepared(foreign);
    await assert.rejects(app.commit(principal, selection, other.cmd), error("STALE_PREPARATION"));
    const v = await app.validate(principal, selection, {}), cmd = command(v);
    const before = d.events.length;
    await assert.rejects(app.commit({ ...principal, employeeId: selection.employeeId }, selection, cmd), error("UNAUTHENTICATED"));
    await assert.rejects(app.commit({ ...principal, resourceScope: { orgUnitIds: ["T001", "T002"] } }, selection, cmd), error("SHIFT_DAY_NOT_FOUND"));
    await assert.rejects(app.commit(principal, { ...selection, shiftDayId: "6202" }, cmd), error("SHIFT_DAY_NOT_FOUND"));
    assert.equal(d.events.length, before); assert.equal(existsSync(d.binding.allowanceFile), false);
    await app.commit(principal, selection, cmd); // failed foreign attempts did not destroy the valid preparation
  } finally { foreign.dispose(); d.dispose(); }
});
test("exit independent readback must reprove read account identity after ACK", async () => {
  const d = new ExitOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:commit-ack") d.observations.read.user = "SYNTHETIC_OTHER"; };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    assert.equal(d.committed, true);
  } finally { d.dispose(); }
});
test("exit full actual attendance projection preserves admitted P2 zero and rejects P2 payload", async () => {
  const d = new ExitOracleDouble();
  try {
    d.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "TADREECH_P2", dataType: "NUMBER",
      dataLength: 22, charUsed: null, nullable: "Y", virtualColumn: "NO" });
    d.rows.SHF_ATTENDANCE!.TADREECH_P2 = "0"; d.certify();
    const { app, principal, cmd } = await prepared(d);
    await app.commit(principal, selection, cmd);
    assert.equal(d.rows.SHF_ATTENDANCE!.TADREECH_P2, "0");
  } finally { d.dispose(); }
  const blocked = new ExitOracleDouble();
  try {
    blocked.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "LATE_FLAG_P2", dataType: "VARCHAR2",
      dataLength: 50, charUsed: "B", nullable: "Y", virtualColumn: "NO" });
    blocked.rows.SHF_ATTENDANCE!.LATE_FLAG_P2 = "Y"; blocked.certify();
    const { app, principal } = await blocked.application();
    await assert.rejects(app.validate(principal, selection, {}), error("COMMAND_SCOPE_DEFERRED"));
  } finally { blocked.dispose(); }
});
