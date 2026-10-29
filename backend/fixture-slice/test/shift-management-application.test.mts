import test from "node:test";
import assert from "node:assert/strict";
import { createIsolatedShiftManagement } from "../shift-management-fixture.mts";
import { managementFixtureSnapshot, managementPrincipal, managementClock, createDraft,
  commandFor } from "./shift-management-helpers.mts";
import { ShiftManagementError } from "../shift-management-errors.mts";

test("isolated context/prepare/CSV-preview are pure; create/change/cancel use one admission", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const p = managementPrincipal();
  const before = f.inspect();
  const context = await f.app.context(p, { employeeId: "1", shiftDayId: null });
  assert.equal(context.eligibility, "supported");
  assert.equal(context.dataSource, "isolated-fixture");
  const prepared = await f.app.prepare(p, "1", createDraft());
  assert.deepEqual(f.inspect(), before);
  const created = await f.app.command(p, "1", commandFor(prepared, createDraft(), 1));
  assert.equal(created.outcome, "fixture-committed");
  const dayId = created.effects[0].after.shiftDayId;
  const change = { ...createDraft(), kind: "change" as const, shiftDayId: dayId,
    startLocal: "2027-01-04T10:00:00", endLocal: "2027-01-04T11:00:00",
    startReasonCode: "1", endReasonCode: "1" };
  const { remark: _, ...changedDraft } = change;
  const changed = await f.app.prepare(p, "1", changedDraft);
  assert.equal((await f.app.command(p, "1", commandFor(changed, changedDraft, 2))).effects[0].after.startLocal,
    changedDraft.startLocal);
  const cancel = { kind: "cancel" as const, shiftDayId: dayId, reasonCode: "C1", remark: null };
  const cancelled = await f.app.prepare(p, "1", cancel);
  const receipt = await f.app.command(p, "1", commandFor(cancelled, cancel, 3));
  assert.equal(receipt.effects[0].after.status, "cancelled");
  assert.equal(receipt.effects[0].after.startLocal, changedDraft.startLocal);
  assert.equal((await f.app.context(p, { employeeId: "1", shiftDayId: dayId })).eligibility, "already-cancelled");
  assert.equal(f.inspect().commits, 3);
  assert.equal(f.inspect().active, 0);
});

test("wrong actor/consent does not consume preparation; UNKNOWN blocks every flow", async () => {
  const f = createIsolatedShiftManagement(managementFixtureSnapshot(), managementClock(), "UTC");
  const p = managementPrincipal();
  const prepared = await f.app.prepare(p, "1", createDraft());
  const command = commandFor(prepared, createDraft(), 4);
  await assert.rejects(f.app.command({ ...p, resourceScope: { orgUnitIds: ["OTHER"] } }, "1", command));
  assert.equal(f.inspect().commits, 0);
  f.failNext("readback");
  await assert.rejects(f.app.command(p, "1", command),
    (error: unknown) => error instanceof ShiftManagementError && error.code === "COMMAND_OUTCOME_UNKNOWN");
  for (const id of [5, 6]) {
    await assert.rejects(f.app.prepare(p, "1", createDraft()), { code: "COMMAND_SCOPE_DEFERRED" });
    await assert.rejects(f.app.command(p, "1", { ...command, commandId: commandFor(prepared, createDraft(), id).commandId }));
  }
  assert.equal(f.inspect().commits, 1);
});
