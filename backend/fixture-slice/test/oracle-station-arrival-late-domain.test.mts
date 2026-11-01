import test from "node:test";
import assert from "node:assert/strict";
import { stationLateTiming, lateReasonCatalog, requireLateReason } from "../oracle-station-arrival-late-domain.mts";
import { lateDraft, lateCommand } from "../native-station-arrival-late-validation.mts";
const plan = { planned: { startLocal: "2026-11-01T10:00:00", endLocal: "2026-11-01T11:00:00" } };
test("strict full-instant late boundary, subminute0, floor, inclusive end and minute expiry", () => {
  assert.throws(() => stationLateTiming(plan, new Date("2026-11-01T10:00:00.000Z"), "UTC"), { code: "COMMAND_SCOPE_DEFERRED" });
  const zero = stationLateTiming(plan, new Date("2026-11-01T10:00:00.001Z"), "UTC");
  assert.equal(zero.minutes, 0);
  assert.equal(zero.transition, Date.parse("2026-11-01T10:01:00Z"));
  assert.equal(stationLateTiming(plan, new Date("2026-11-01T10:00:59.999Z"), "UTC").minutes, 0);
  assert.equal(stationLateTiming(plan, new Date("2026-11-01T10:01:00.000Z"), "UTC").minutes, 1);
  assert.equal(stationLateTiming(plan, new Date("2026-11-01T11:00:00.000Z"), "UTC").minutes, 60);
  assert.throws(() => stationLateTiming(plan, new Date("2026-11-01T11:00:00.001Z"), "UTC"), { code: "COMMAND_SCOPE_DEFERRED" });
});
test("same-date transition-crossing plan defers despite unique endpoints; normal zone days remain supported", () => {
  const planned = { startLocal: "2026-03-08T00:30:00", endLocal: "2026-03-08T04:00:00" };
  assert.throws(() => stationLateTiming({ planned }, new Date("2026-03-08T07:30:00.000Z"), "America/New_York"),
    { code: "COMMAND_SCOPE_DEFERRED" });
  assert.throws(() => stationLateTiming({ planned: {
    startLocal: "2026-11-01T00:30:00", endLocal: "2026-11-01T04:00:00",
  } }, new Date("2026-11-01T08:30:00.000Z"), "America/New_York"), { code: "COMMAND_SCOPE_DEFERRED" });
  assert.equal(stationLateTiming({ planned: {
    startLocal: "2026-03-09T00:30:00", endLocal: "2026-03-09T04:00:00",
  } }, new Date("2026-03-09T07:30:00.000Z"), "America/New_York").minutes, 180);
});
test("same-date stop and nonunique gap/fold values preserve fail-closed timing", () => {
  assert.throws(() => stationLateTiming({ planned: {
    startLocal: "2026-11-01T23:59:00", endLocal: "2026-11-02T01:00:00",
  } }, new Date("2026-11-02T00:00:00Z"), "UTC"), { code: "COMMAND_SCOPE_DEFERRED" });
  for (const startLocal of ["2026-03-08T02:30:00", "2026-11-01T01:30:00"])
    assert.throws(() => stationLateTiming({ planned: {
      startLocal, endLocal: startLocal.slice(0, 10) + "T04:00:00",
    } }, new Date("2026-11-01T08:00:00Z"), "America/New_York"), { code: "INVALID_SOURCE_DATA" });
});
test("catalog exact type2, unique safe labels and flags0 only; missing reason422, unknown requirement defers", () => {
  const reason = { REASON_ID: "1", REASON_DESC: "Synthetic reason", SER_TYPE: "2", REPORTED: "0", REPORT_REQUESTED: "0" };
  assert.deepEqual(lateReasonCatalog([reason]), [{ code: "1", label: "Synthetic reason" }]);
  assert.throws(() => requireLateReason([reason], "2"), { code: "BUSINESS_VALIDATION_FAILED" });
  assert.throws(() => requireLateReason([{ ...reason, REPORT_REQUESTED: null }], "1"), { code: "COMMAND_SCOPE_DEFERRED" });
  assert.throws(() => requireLateReason([{ ...reason, REMARK_REQUIRED: "1" }], "1"), { code: "COMMAND_SCOPE_DEFERRED" });
  assert.throws(() => lateReasonCatalog([reason, reason]), { code: "INVALID_SOURCE_DATA" });
  assert.throws(() => lateReasonCatalog([{ ...reason, SER_TYPE: "3" }]), { code: "INVALID_SOURCE_DATA" });
});
test("dedicated null-only draft and two exact consents, no ordinary-F2 fallback", () => {
  const draft = { lateReasonCode: "1", lateRemark: null };
  assert.deepEqual(lateDraft(draft), draft);
  assert.throws(() => lateDraft({ ...draft, lateRemark: "" }), { code: "INVALID_REQUEST" });
  const command = { commandId: "00000000-0000-4000-8000-000000000050", draft,
    validationToken: "a".repeat(43), fingerprint: "a".repeat(64),
    confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] }, operationConfirmation: { accepted: true } };
  assert.deepEqual(lateCommand(command), command);
  assert.throws(() => lateCommand({ ...command, confirmation: null }), { code: "CONFIRMATION_REQUIRED" });
  assert.throws(() => lateCommand({ ...command, operationConfirmation: { accepted: false } }), { code: "INVALID_REQUEST" });
});
