import type { NativeStageArrivalCommitV1 } from "./oracle-stage-arrival-contracts.mts";
import { exact } from "./stage-arrival-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { localDateTime, text } from "./contract-validation.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";

export function nativeDraft(value: unknown): { lateReasonCode: null; lateRemark: null } {
  if (!exact(value, ["lateReasonCode", "lateRemark"]) || value.lateReasonCode !== null ||
      value.lateRemark !== null) stageFail("INVALID_REQUEST");
  return { lateReasonCode: null, lateRemark: null };
}
export function nativeCommand(value: unknown): NativeStageArrivalCommitV1 {
  if (!exact(value, ["commandId", "draft", "validationToken", "fingerprint", "confirmation", "operationConfirmation"]) ||
      !exact(value.operationConfirmation, ["accepted"]) || value.operationConfirmation.accepted !== true ||
      value.confirmation !== null ||
      typeof value.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.commandId) ||
      typeof value.validationToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value.validationToken) ||
      typeof value.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(value.fingerprint)) stageFail("INVALID_REQUEST");
  return { commandId: value.commandId, validationToken: value.validationToken, fingerprint: value.fingerprint,
    draft: nativeDraft(value.draft), confirmation: null, operationConfirmation: { accepted: true } };
}
function nativeInstant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) ||
      !localDateTime(value.slice(0, 19))) return false;
  const instant = Date.parse(value);
  return Number.isFinite(instant) && new Date(instant).toISOString() === value;
}
export function validNativeReceipt(v: unknown, c: NativeStageArrivalCommitV1, s: StageArrivalSelectionV1) {
  if (!exact(v, ["commandId", "employeeId", "shiftDayId", "outcome", "recorded", "commitAcknowledgedAt",
    "readBackVerifiedAt", "businessTimeZone", "replayed", "receiptPersistence", "partnerCompletion", "dataSource"]) ||
      v.outcome !== "oracle-test-committed" || v.dataSource !== "oracle-test" ||
      v.commandId !== c.commandId || v.employeeId !== s.employeeId || v.shiftDayId !== s.shiftDayId ||
      v.partnerCompletion !== "not-invoked" || !text(v.businessTimeZone, 128, 1) ||
      v.replayed !== false || v.receiptPersistence !== "none" ||
      !nativeInstant(v.commitAcknowledgedAt) || !nativeInstant(v.readBackVerifiedAt) ||
      Date.parse(v.readBackVerifiedAt) < Date.parse(v.commitAcknowledgedAt) ||
      !exact(v.recorded, ["stageArrivalLocal", "briefing", "stageLate"]) ||
      !localDateTime(v.recorded.stageArrivalLocal) || v.recorded.stageLate !== null ||
      v.recorded.briefing !== false) return false;
  return true;
}
