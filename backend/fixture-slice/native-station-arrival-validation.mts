import type { NativeStationArrivalCommitV1 } from "./oracle-station-arrival-contracts.mts";
import { exact } from "./stage-arrival-validation.mts";
import { nativeCommand } from "./native-stage-arrival-validation.mts";
import { localDateTime, text } from "./contract-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";

export function nativeStationDraft(v: unknown): { lateReasonCode: null } {
  if (!exact(v, ["lateReasonCode"]) || v.lateReasonCode !== null) stageFail("INVALID_REQUEST");
  return { lateReasonCode: null };
}
export function nativeStationCommand(v: unknown): NativeStationArrivalCommitV1 {
  if (!exact(v, ["commandId", "draft", "validationToken", "fingerprint", "confirmation", "operationConfirmation"]))
    stageFail("INVALID_REQUEST");
  const draft = nativeStationDraft(v.draft);
  const c = nativeCommand({ ...v, draft: { ...draft, lateRemark: null } });
  return { ...c, draft };
}
function instant(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
    localDateTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
}
export function validNativeStationReceipt(v: unknown, c: NativeStationArrivalCommitV1, s: StageArrivalSelectionV1) {
  return exact(v, ["commandId", "employeeId", "shiftDayId", "outcome", "recorded", "commitAcknowledgedAt",
    "readBackVerifiedAt", "businessTimeZone", "replayed", "receiptPersistence", "partnerCompletion", "dataSource"]) &&
    v.outcome === "oracle-test-committed" && v.dataSource === "oracle-test" &&
    v.commandId === c.commandId && v.employeeId === s.employeeId && v.shiftDayId === s.shiftDayId &&
    v.partnerCompletion === "not-invoked" && text(v.businessTimeZone, 128, 1) &&
    v.replayed === false && v.receiptPersistence === "none" &&
    instant(v.commitAcknowledgedAt) && instant(v.readBackVerifiedAt) &&
    v.readBackVerifiedAt >= v.commitAcknowledgedAt &&
    exact(v.recorded, ["stageArrivalLocal", "stationArrivalLocal", "stationExitLocal", "briefing", "stationLate"]) &&
    (v.recorded.stageArrivalLocal === null || localDateTime(v.recorded.stageArrivalLocal)) &&
    localDateTime(v.recorded.stationArrivalLocal) && v.recorded.stationExitLocal === null && v.recorded.stationLate === null &&
    (v.recorded.briefing === null || typeof v.recorded.briefing === "boolean") &&
    (v.recorded.stageArrivalLocal === null || v.recorded.stageArrivalLocal <= v.recorded.stationArrivalLocal);
}
