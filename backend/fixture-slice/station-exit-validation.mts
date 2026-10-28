import { exact } from "./stage-arrival-validation.mts";
import { localDateTime, text } from "./contract-validation.mts";
import type { StationExitCommitV1 } from "./station-exit-contracts.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
import { stageFail } from "./stage-arrival-errors.mts";
export function exitDraft(v: unknown): {} {
  if (!exact(v, [])) stageFail("INVALID_REQUEST");
  return {};
}
export function exitCommand(v: unknown): StationExitCommitV1 {
  if (!exact(v, ["commandId", "draft", "validationToken", "fingerprint", "operationConfirmation"]) ||
      typeof v.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v.commandId) ||
      typeof v.validationToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
      typeof v.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(v.fingerprint) ||
      !exact(v.operationConfirmation, ["accepted"]) || v.operationConfirmation.accepted !== true)
    stageFail("INVALID_REQUEST");
  return { commandId: v.commandId, draft: exitDraft(v.draft), validationToken: v.validationToken,
    fingerprint: v.fingerprint, operationConfirmation: { accepted: true } };
}
function instant(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
    localDateTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
}
export function validExitReceipt(v: unknown, c: StationExitCommitV1, s: StageArrivalSelectionV1) {
  return exact(v, ["commandId", "employeeId", "shiftDayId", "outcome", "recorded", "commitAcknowledgedAt",
    "readBackVerifiedAt", "businessTimeZone", "replayed", "receiptPersistence", "partnerCompletion", "dataSource"]) &&
    v.commandId === c.commandId && v.employeeId === s.employeeId && v.shiftDayId === s.shiftDayId &&
    v.outcome === "oracle-test-committed" && v.dataSource === "oracle-test" &&
    v.replayed === false && v.receiptPersistence === "none" && v.partnerCompletion === "not-invoked" &&
    instant(v.commitAcknowledgedAt) && instant(v.readBackVerifiedAt) && v.readBackVerifiedAt >= v.commitAcknowledgedAt &&
    text(v.businessTimeZone, 128, 1) &&
    exact(v.recorded, ["stageArrivalLocal", "stationArrivalLocal", "stationExitLocal", "briefing"]) &&
    (v.recorded.stageArrivalLocal === null || localDateTime(v.recorded.stageArrivalLocal)) &&
    localDateTime(v.recorded.stationArrivalLocal) && localDateTime(v.recorded.stationExitLocal) &&
    v.recorded.stationArrivalLocal <= v.recorded.stationExitLocal &&
    (v.recorded.stageArrivalLocal === null || v.recorded.stageArrivalLocal <= v.recorded.stationArrivalLocal) &&
    (v.recorded.briefing === null || typeof v.recorded.briefing === "boolean");
}
