import test from "node:test";
import assert from "node:assert/strict";
import fs, { mkdtempSync, realpathSync, writeFileSync, rmSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { NativeShiftAdmission, nativeShiftEmployeeScope } from "../native-shift-management-admission.mts";
import { nativeProtocolFixture } from "./oracle-shift-management-double.mts";
import type { ShiftCommandBindingV1 } from "../shift-management-contracts.mts";
import type { ShiftReceiptV1 } from "../shift-management-contracts.mts";
import { shiftProblem, shiftUnknown } from "../shift-management-errors.mts";
import { syncBuiltinESMExports } from "node:module";
import { spawnSync } from "node:child_process";
import { OracleShiftManagementUow } from "../oracle-shift-management-uow.mts";

function fixture() {
  const protocol = nativeProtocolFixture();
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), "shf49-authority-test-")));
  const options = { reference: protocol.authority.reference, employeeId: "1", orgUnitId: "J01",
    authorizedTeamIds: ["J01"], expectedKind: protocol.plan.kind, expectedPlanDigest: protocol.plan.planDigest,
    expectedRows: protocol.plan.effects.length, windowStart: protocol.scope.windowStart,
    windowEnd: protocol.scope.windowEnd, businessTimeZone: "UTC", authorityDirectory: directory };
  writeFileSync(join(directory, "namespace.json"), JSON.stringify({
    version: "shf-management-native-authority-v1", namespace: "shift-management-v0.1",
    canonicalDirectory: directory, employeeScope: nativeShiftEmployeeScope("1"),
    identityRevision: options.reference.identityRevision, state: "ready",
  }), { flag: "wx" });
  const admission = new NativeShiftAdmission(options);
  return { ...protocol, directory, options, admission,
    close: () => rmSync(directory, { recursive: true, force: true }) };
}
async function binding(f: ReturnType<typeof fixture>): Promise<ShiftCommandBindingV1> {
  const prep = await f.admission.prepare(f.plan);
  return { reference: f.admission.reference, kind: f.plan.kind, employeeId: "1",
    principal: f.plan.principal, authGeneration: f.plan.authGeneration, authorizedTeamIds: ["J01"],
    commandId: f.handle.commandId, validationToken: prep.validationToken, fingerprint: prep.fingerprint,
    planDigest: f.plan.planDigest, operationConfirmation: { accepted: true },
    acknowledgedWarningCodes: [...new Set(f.plan.effects.flatMap(effect => effect.warningCodes))] };
}
test("native preparation is volatile-only; consumption persists one shared employee fuse", async () => {
  const f = fixture();
  try {
    const before = readdirSync(f.directory);
    const input = await binding(f);
    assert.deepEqual(readdirSync(f.directory), before);
    await assert.rejects(f.admission.consume({ ...input, fingerprint: "e".repeat(64) }), { code: "STALE_PREPARATION" });
    assert.deepEqual(readdirSync(f.directory), before);
    const attempt = await f.admission.consume(input);
    assert.equal(f.admission.planFor(attempt).planDigest, f.plan.planDigest);
    assert.equal(readdirSync(f.directory).length, 2);
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.throws(() => new NativeShiftAdmission({ ...f.options, expectedKind: "create", expectedRows: 1,
      expectedPlanDigest: "f".repeat(64), reference: { ...f.options.reference, operatorScopeRevision: "new-config-uuid" } }),
    { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("native UNKNOWN survives object restart; no new UUID/opkind/reference can reopen authority", async () => {
  const f = fixture();
  try {
    const input = await binding(f), attempt = await f.admission.consume(input);
    const problem = shiftProblem(shiftUnknown(), "isolated-authority-test", input.commandId);
    if (problem.effect !== "unknown") throw Error("Test expected UNKNOWN");
    await f.admission.finish(attempt, { kind: "unknown", problem });
    await assert.rejects(f.admission.prepare(f.plan), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("native prepare and wrong binding/consent use zero filesystem authority IO", async () => {
  const f = fixture();
  const saved = { lstatSync: fs.lstatSync, openSync: fs.openSync, readSync: fs.readSync,
    writeSync: fs.writeSync, fsyncSync: fs.fsyncSync };
  let calls = 0;
  const forbidden = () => { calls++; throw Error("Isolated preview attempted filesystem authority IO"); };
  try {
    Object.assign(fs, { lstatSync: forbidden, openSync: forbidden, readSync: forbidden,
      writeSync: forbidden, fsyncSync: forbidden }); syncBuiltinESMExports();
    const input = await binding(f);
    await assert.rejects(f.admission.consume({ ...input, fingerprint: "e".repeat(64) }), { code: "STALE_PREPARATION" });
    await assert.rejects(f.admission.consume({ ...input, acknowledgedWarningCodes: ["DURATION_CHANGED"] }),
      { code: "CONFIRMATION_REQUIRED" });
    assert.equal(calls, 0);
  } finally { Object.assign(fs, saved); syncBuiltinESMExports(); f.close(); }
});
test("native consumed namespace remains blocked in an actual new Node process", async () => {
  const f = fixture();
  try {
    await f.admission.consume(await binding(f));
    const moduleUrl = new URL("../native-shift-management-admission.mts", import.meta.url).href;
    const code = `import { readFileSync } from "node:fs";
      import { NativeShiftAdmission } from ${JSON.stringify(moduleUrl)};
      const options = JSON.parse(readFileSync(0,"utf8"));
      try { new NativeShiftAdmission(options); process.exitCode=9; }
      catch (error) {
        if (error.code === "COMMAND_SCOPE_DEFERRED") console.log("blocked");
        else process.exitCode=10;
      }`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
      input: JSON.stringify(f.options), encoding: "utf8", timeout: 15000,
      env: { SystemRoot: process.env.SystemRoot },
    });
    assert.equal(child.status, 0, child.stderr); assert.equal(child.stdout.trim(), "blocked");
  } finally { f.close(); }
});
test("native marker content is status only, never command/digest/identity/receipt data", async () => {
  const f = fixture();
  try {
    const input = await binding(f), attempt = await f.admission.consume(input);
    const problem = shiftProblem(shiftUnknown(), "isolated-test", input.commandId);
    if (problem.effect !== "unknown") throw Error("Test expected UNKNOWN");
    await f.admission.finish(attempt, { kind: "unknown", problem });
    const marker = readdirSync(f.directory).find(name => name.endsWith(".consumed")); assert.ok(marker);
    const contents = readFileSync(join(f.directory, marker), "utf8");
    assert.match(contents, /^CONSUMED:/); assert.match(contents, /UNKNOWN\n$/);
    for (const secret of [input.commandId, input.planDigest, input.fingerprint, input.validationToken, input.principal.subject])
      assert.ok(!contents.includes(secret));
    assert.throws(() => f.admission.planFor(attempt), { code: "STALE_PREPARATION" });
  } finally { f.close(); }
});
test("crash-before-terminal and malformed zero-byte marker are both permanently spent", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.directory, `employee-${nativeShiftEmployeeScope("1")}.consumed`), "", { flag: "wx" });
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("changed namespace after preview denies consumption and never provisions a replacement", async () => {
  const f = fixture();
  try {
    const input = await binding(f);
    writeFileSync(join(f.directory, "namespace.json"), '{"changed":true}');
    await assert.rejects(f.admission.consume(input), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
    await assert.rejects(f.admission.prepare(f.plan), { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("copied namespace cannot silently change authority directory to escape a spent employee", async () => {
  const f = fixture(), copied = realpathSync.native(mkdtempSync(join(tmpdir(), "shf49-authority-copy-test-")));
  try {
    await f.admission.consume(await binding(f));
    writeFileSync(join(copied, "namespace.json"), readFileSync(join(f.directory, "namespace.json")));
    assert.throws(() => new NativeShiftAdmission({ ...f.options, authorityDirectory: copied }),
      { code: "LIVE_WRITES_DISABLED" });
  } finally { f.close(); rmSync(copied, { recursive: true, force: true }); }
});
test("wrong kind/rows/actor/scope/plan cannot mint native authority tokens", async () => {
  const f = fixture();
  try {
    for (const plan of [
      { ...f.plan, kind: "create" as const }, { ...f.plan, employeeId: "2" },
      { ...f.plan, planDigest: "d".repeat(64) }, { ...f.plan, effects: f.plan.effects.slice(0, 1) },
      { ...f.plan, authorizedTeamIds: ["OTHER"] },
    ]) await assert.rejects(f.admission.prepare(plan));
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { f.close(); }
});
test("invalid native options fail before any filesystem examination", () => {
  const f = fixture(), original = fs.lstatSync;
  let calls = 0;
  try {
    Object.assign(fs, { lstatSync: () => { calls++; throw Error("Unexpected native option filesystem IO"); } });
    syncBuiltinESMExports();
    for (const patch of [
      { authorityDirectory: "relative" }, { expectedRows: 101 }, { expectedPlanDigest: "bad" },
      { windowEnd: new Date(Date.now() - 1).toISOString() }, { businessTimeZone: "" },
      { authorizedTeamIds: ["*"] }, { extra: true },
      { reference: { ...f.options.reference, mode: "isolated-fixture" } },
    ]) assert.throws(() => Reflect.construct(NativeShiftAdmission, [{ ...f.options, ...patch }]));
    assert.equal(calls, 0);
  } finally { Object.assign(fs, { lstatSync: original }); syncBuiltinESMExports(); f.close(); }
});
test("persistent consumed authority composes with the actual SQL kernel; ACK alone never reopens it", async () => {
  const f = fixture();
  try {
    const input = await binding(f), attempt = await f.admission.consume(input);
    const uow = new OracleShiftManagementUow(f.pool, f.evidence, f.admission, f.scope);
    const ack = await uow.run({ ...f.selection, admission: attempt }, f.work);
    assert.equal(ack.effects.length, 2); assert.equal(f.inspect().commits, 1);
    assert.ok(!("outcome" in ack));
    // Explicit isolated readback-loss outcome. No real native receipt is invented.
    const problem = shiftProblem(shiftUnknown(), "isolated-readback-loss", input.commandId);
    if (problem.effect !== "unknown") throw Error("Test expected UNKNOWN");
    await f.admission.finish(attempt, { kind: "unknown", problem });
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("confirmed native SQL rollback still consumes the one-attempt authority across restart", async () => {
  const f = fixture();
  try {
    const input = await binding(f), attempt = await f.admission.consume(input);
    const uow = new OracleShiftManagementUow(f.pool, f.evidence, f.admission, f.scope);
    f.faults.insert2 = true;
    let captured: unknown;
    await assert.rejects(uow.run({ ...f.selection, admission: attempt }, f.work), asyncReject);
    function asyncReject(error: unknown) {
      captured = error;
      const problem = shiftProblem(error, "isolated-rollback", input.commandId);
      assert.equal(problem.effect, "rolled-back"); return true;
    }
    const problem = shiftProblem(captured, "isolated-rollback", input.commandId);
    if (problem.effect === "unknown") throw Error("Test expected ordinary rejection");
    await f.admission.finish(attempt, { kind: "rejected", problem });
    assert.equal(f.inspect().commits, 0); assert.equal(f.inspect().sequenceCalls, 2);
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
  } finally { f.close(); }
});
test("isolated verified-receipt DTO settlement neither persists/replays the receipt nor reopens native authority", async () => {
  const f = fixture();
  try {
    const input = await binding(f), attempt = await f.admission.consume(input);
    // Explicit isolated port-caller double, NOT evidence of a real DB commit
    // or readback. The installed application must supply both before finish.
    const instant = new Date().toISOString();
    const receipt: ShiftReceiptV1 = { contractVersion: "49-v0.1", commandId: input.commandId,
      employeeId: "1", kind: "csv-create", effects: f.plan.effects.map((effect, i) =>
        ({ ...effect, after: { ...effect.after, shiftDayId: String(i + 8) } })),
      outcome: "oracle-test-committed", dataSource: "oracle-test", commitAcknowledgedAt: instant,
      readBackVerifiedAt: instant, businessTimeZone: "UTC", replayed: false,
      receiptPersistence: "none", partnerCompletion: "not-invoked" };
    await assert.rejects(f.admission.finish(attempt, { kind: "verified", receipt: { ...receipt, employeeId: "2" } }),
      { code: "INVALID_SOURCE_DATA" });
    await f.admission.finish(attempt, { kind: "verified", receipt });
    assert.throws(() => f.admission.planFor(attempt), { code: "STALE_PREPARATION" });
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
    const marker = readdirSync(f.directory).find(name => name.endsWith(".consumed")); assert.ok(marker);
    const contents = readFileSync(join(f.directory, marker), "utf8");
    assert.match(contents, /VERIFIED\n$/); assert.ok(!contents.includes(input.commandId) && !contents.includes("effects"));
  } finally { f.close(); }
});
test("lost consumed marker cannot reopen the already consumed operator namespace after restart", async () => {
  const f = fixture();
  try {
    await f.admission.consume(await binding(f));
    const marker = readdirSync(f.directory).find(name => name.endsWith(".consumed")); assert.ok(marker);
    rmSync(join(f.directory, marker)); // Explicit isolated lost-journal fault.
    assert.throws(() => new NativeShiftAdmission(f.options), { code: "COMMAND_SCOPE_DEFERRED" });
    assert.deepEqual(readdirSync(f.directory), ["namespace.json"]);
  } finally { f.close(); }
});
