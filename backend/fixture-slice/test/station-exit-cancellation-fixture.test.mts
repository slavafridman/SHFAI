import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { PrincipalV1 } from "../contracts.mts";
import { createCancellationFixture, cancellationManifest } from "../station-exit-cancellation-fixture.mts";
import { cancellationProblem } from "../station-exit-cancellation-errors.mts";
import { cancellationCommand, cancellationDraft } from "../station-exit-cancellation-validation.mts";
import { decideCancellation, completeCancellationOriginalsDigest } from "../station-exit-cancellation-domain.mts";
import { same } from "../stage-arrival-domain.mts";
const p: PrincipalV1 = { subject: "synthetic:administrator", displayName: "Synthetic Administrator (local/isolated only)",
  synthetic: true, provider: "synthetic", employeeId: null, roles: ["Administrator"],
  capabilities: ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read",
    "employee:read", "attendance:read", "attendance-station-exit-cancellation:prepare", "attendance-station-exit-cancellation:commit"],
  resourceScope: { orgUnitIds: ["T001"] } };
const selected = { employeeId: "9001", shiftDayId: "6201" };
const fixture = (scenarioId = "ready") => createCancellationFixture(cancellationManifest(JSON.stringify({
  version: "shf-station-exit-cancellation-fixture-v1", scenarioId, clockInstant: "2026-11-01T12:00:00.123Z",
})), "UTC", "T001");
async function prepared(f: ReturnType<typeof fixture>) {
  const v = await f.app.validate(p, selected, {});
  return { v, cmd: cancellationCommand({ commandId: randomUUID(), draft: {},
    validationToken: v.validationToken, fingerprint: v.fingerprint,
    warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" }, operationConfirmation: { accepted: true } }) };
}
test("fixture context and repeated checks preserve every fact and authority", async () => {
  const f = fixture(), before = f.store.read();
  assert.equal((await f.app.context(p, selected)).eligibility, "eligible");
  const { v } = await prepared(f); await prepared(f);
  assert.deepEqual(v.warnings, ["RECORDED_EXIT_WILL_BE_CLEARED"]);
  assert.equal(Date.parse(v.expiresAt) - Date.parse(v.evaluatedAt), 30000);
  assert.deepEqual(f.store.read(), before); f.store.assertAvailable();
});
test("fixture clears only two fields, simulated receipt and retained authority", async () => {
  const f = fixture(), before = f.store.read(), { cmd } = await prepared(f);
  const r = await f.app.command(p, selected, cmd), after = f.store.read();
  const expected = structuredClone(before);
  expected.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME = null; expected.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = null;
  assert.ok(same(after, expected)); assert.equal(r.outcome, "simulated"); assert.equal(r.originalExitLocal, before.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME);
  assert.equal(r.commitAcknowledgedAt, null); assert.equal(r.readBackVerifiedAt, null);
  assert.equal(r.partnerCompletion, "not-invoked"); assert.equal(r.recorded.stationExitLocal, null);
  await assert.rejects(f.app.command(p, selected, { ...cmd, commandId: randomUUID() }), /LIVE_WRITES_DISABLED/);
});
for (const consent of ["warningConfirmation", "operationConfirmation"] as const)
  test(`${consent} alone is insufficient, zero mutation or consumption`, async () => {
    const f = fixture(), before = f.store.read(), { cmd } = await prepared(f);
    await assert.rejects(f.app.command(p, selected, { ...cmd, [consent]: { ...cmd[consent], accepted: false } }),
      e => cancellationProblem(e, "synthetic").code === "CONFIRMATION_REQUIRED" &&
        cancellationProblem(e, "synthetic").nextAction === "correct-and-validate");
    assert.deepEqual(f.store.read(), before); f.store.assertAvailable();
  });
for (const scenario of ["not-recorded", "early-deferred", "partner-required", "partner-unknown", "authority-consumed"])
  test(`fixture ${scenario} cannot obtain a receipt/preparation`, async () => {
    const f = fixture(scenario), before = f.store.read();
    await assert.rejects(prepared(f), scenario === "not-recorded" ? /EXIT_NOT_RECORDED/ :
      scenario === "authority-consumed" ? /LIVE_WRITES_DISABLED/ : /COMMAND_SCOPE_DEFERRED/);
    assert.deepEqual(f.store.read(), before);
    if (scenario !== "authority-consumed") f.store.assertAvailable();
  });
test("expiry invalidates both confirmations without effects", async () => {
  const f = fixture(), before = f.store.read(), { cmd } = await prepared(f); f.advanceClock(30000);
  await assert.rejects(f.app.command(p, selected, cmd), /STALE_PREPARATION/);
  assert.deepEqual(f.store.read(), before); f.store.assertAvailable();
});
test("UNKNOWN synthetic scenario never retries or produces native timestamps", async () => {
  const f = fixture("outcome-unknown"), { cmd } = await prepared(f);
  await assert.rejects(f.app.command(p, selected, cmd), e => cancellationProblem(e, "synthetic").effect === "unknown");
  await assert.rejects(prepared(f), /LIVE_WRITES_DISABLED/);
});
test("strict draft/command/manifest parsing rejects unknown and duplicate keys/coercion", () => {
  for (const draft of [null, [], "{}", { reason: null }, { time: "12:00" }]) assert.throws(() => cancellationDraft(draft));
  for (const raw of ['{"version":"x","version":"y"}', "{}", JSON.stringify({
    version: "shf-station-exit-cancellation-fixture-v1", scenarioId: "ready", clockInstant: "2026-11-01T12:00:00Z" })])
    assert.throws(() => cancellationManifest(raw));
});
test("selected resource and capabilities enforced before reads, no role bypass", async () => {
  const f = fixture();
  for (const bad of [{ ...p, employeeId: "9001" }, { ...p, resourceScope: { orgUnitIds: ["T002"] } },
    { ...p, capabilities: p.capabilities.slice(0, 7) }])
    await assert.rejects(f.app.context(bad, selected));
  await assert.rejects(f.app.context(p, { ...selected, employeeId: "9002" }), /SHIFT_DAY_NOT_FOUND/);
});
test("partner full-original drift and expired review defer", () => {
  const f = fixture(), facts = f.store.read();
  facts.rows.SHF_ATTENDANCE!.TADREECH = "1";
  assert.notEqual(completeCancellationOriginalsDigest(facts), facts.partnerReview.completeOriginalsDigest);
  assert.ok(decideCancellation(facts, f.clock.now(), "UTC").blockers.includes("PARTNER_REVIEW_REQUIRED"));
});
for (const field of ["MISS_REASON_ID", "LATE_REASON_ID", "OPTIONAL1", "UNSUPPORTED_BREAK"])
  test(`existing ${field} defers without data mutation`, () => {
    const f = fixture(), facts = f.store.read(); facts.rows.SHF_ATTENDANCE![field] = "1";
    const before = structuredClone(facts);
    assert.equal(decideCancellation(facts, f.clock.now(), "UTC").eligibility, "deferred");
    assert.deepEqual(facts, before);
  });
test("DST fold and gap originals conservatively defer", () => {
  const f = fixture(), facts = f.store.read();
  for (const local of ["2026-11-01T01:30:00", "2026-03-08T02:30:00"]) {
    facts.planned.startLocal = local; facts.planned.endLocal = local;
    assert.equal(decideCancellation(facts, f.clock.now(), "America/New_York").eligibility, "deferred");
  }
});
