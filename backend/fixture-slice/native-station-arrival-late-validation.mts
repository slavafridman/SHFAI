import { decimalId, record } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { nativeCommand } from "./native-stage-arrival-validation.mts";
import type { NativeLateStationCommitV1, NativeLateStationDraftV1 } from "./oracle-station-arrival-late-contracts.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { validNativeStationReceipt } from "./native-station-arrival-validation.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
export function lateDraft(v: unknown): NativeLateStationDraftV1 {
  if (!exact(v, ["lateReasonCode", "lateRemark"]) || !decimalId(v.lateReasonCode) || v.lateRemark !== null)
    stageFail("INVALID_REQUEST");
  return { lateReasonCode: v.lateReasonCode, lateRemark: null };
}
export function lateCommand(v: unknown): NativeLateStationCommitV1 {
  if (!exact(v, ["commandId", "draft", "validationToken", "fingerprint", "confirmation", "operationConfirmation"]))
    stageFail("INVALID_REQUEST");
  const draft = lateDraft(v.draft);
  if (!exact(v.confirmation, ["accepted", "warningCodes"]) || v.confirmation.accepted !== true ||
      !Array.isArray(v.confirmation.warningCodes) || v.confirmation.warningCodes.length !== 1 ||
      v.confirmation.warningCodes[0] !== "STATION_ARRIVAL_LATE") stageFail("CONFIRMATION_REQUIRED");
  const parsed = nativeCommand({ ...v, draft: { lateReasonCode: null, lateRemark: null }, confirmation: null });
  return { ...parsed, draft, confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] } };
}
export function validLateReceipt(v: unknown, cmd: NativeLateStationCommitV1, s: StageArrivalSelectionV1) {
  if (!record(v) || !record(v.recorded) || !exact(v.recorded.stationLate, ["reasonCode", "minutes", "remark"]) ||
      v.recorded.stationLate.reasonCode !== cmd.draft.lateReasonCode || v.recorded.stationLate.remark !== null ||
      typeof v.recorded.stationLate.minutes !== "string" || !/^(0|[1-9][0-9]{0,9})$/.test(v.recorded.stationLate.minutes)) return false;
  return validNativeStationReceipt({ ...v, recorded: { ...v.recorded, stationLate: null } },
    { ...cmd, draft: { lateReasonCode: null }, confirmation: null }, s);
}
