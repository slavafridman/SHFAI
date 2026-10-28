import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { exact, facts } from "./stage-arrival-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { StationArrivalCommitV1, StationArrivalDraftV1, StationArrivalFactsV1,
  StationArrivalFixtureEnvelopeV1, StationArrivalFixtureExtraV1 } from "./station-arrival-contracts.mts";
import { canonical } from "./stage-arrival-domain.mts";
import type { StageArrivalSelectionV1 } from "./stage-arrival-contracts.mts";
import { nativeStationMode } from "./native-station-arrival-config.mts";
import type { StationArrivalModeVNext } from "./oracle-station-arrival-contracts.mts";

export function validStationReceipt(value: unknown, cmd: StationArrivalCommitV1, s: StageArrivalSelectionV1): boolean {
  if (!exact(value, ["commandId", "employeeId", "shiftDayId", "outcome", "recorded", "committedAt",
    "businessTimeZone", "replayed", "partnerCompletion", "dataSource"]) ||
      value.commandId !== cmd.commandId || value.employeeId !== s.employeeId || value.shiftDayId !== s.shiftDayId ||
      value.outcome !== "fixture-committed" || value.dataSource !== "isolated-fixture" ||
      value.partnerCompletion !== "not-invoked" || typeof value.replayed !== "boolean" ||
      !text(value.businessTimeZone, 128, 1) || typeof value.committedAt !== "string" ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value.committedAt) ||
      !Number.isFinite(Date.parse(value.committedAt)) ||
      !exact(value.recorded, ["stageArrivalLocal", "stationArrivalLocal", "stationExitLocal", "briefing", "stationLate"]) ||
      !(value.recorded.stageArrivalLocal === null || localDateTime(value.recorded.stageArrivalLocal)) ||
      !localDateTime(value.recorded.stationArrivalLocal) || value.recorded.stationExitLocal !== null ||
      !(value.recorded.briefing === null || typeof value.recorded.briefing === "boolean") ||
      value.recorded.stageArrivalLocal !== null && value.recorded.stageArrivalLocal > value.recorded.stationArrivalLocal)
    return false;
  const late = value.recorded.stationLate;
  return cmd.confirmation === null ? late === null : exact(late, ["reasonCode", "minutes", "remark"]) &&
    late.reasonCode === cmd.draft.lateReasonCode && typeof late.minutes === "string" &&
    /^(0|[1-9][0-9]{0,9})$/.test(late.minutes) && late.remark === null;
}

export function stationMode(value: unknown): StationArrivalModeVNext {
  if (!record(value)) throw Error("Invalid station configuration");
  const mode = value.attendanceStationArrivalMode;
  if (mode === "test-oracle-controlled") return nativeStationMode(value);
  if (mode === undefined || mode === "disabled") return "disabled";
  if (mode !== "isolated-fixture" || value.attendanceStageArrivalMode !== "isolated-fixture" ||
      value.dataSource !== "isolated-fixture" ||
      !(value.deploymentClass === "local-development" || value.deploymentClass === "isolated-test-demo") ||
      value.authenticationMode !== "synthetic" ||
      value.syntheticAdministratorEnabled !== true) throw Error("Explicit joint fixture configuration required");
  return mode;
}
export function stationDraft(value: unknown): StationArrivalDraftV1 {
  if (!exact(value, ["lateReasonCode"]) || !(value.lateReasonCode === null || decimalId(value.lateReasonCode)))
    stageFail("INVALID_REQUEST");
  return { lateReasonCode: value.lateReasonCode };
}
export function stationCommand(value: unknown): StationArrivalCommitV1 {
  if (!exact(value, ["commandId", "draft", "validationToken", "fingerprint", "confirmation"]) ||
      typeof value.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.commandId) ||
      typeof value.validationToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value.validationToken) ||
      typeof value.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(value.fingerprint)) stageFail("INVALID_REQUEST");
  let confirmation: StationArrivalCommitV1["confirmation"] = null;
  if (value.confirmation !== null) {
    if (!exact(value.confirmation, ["accepted", "warningCodes"]) || value.confirmation.accepted !== true ||
        !Array.isArray(value.confirmation.warningCodes) || value.confirmation.warningCodes.length !== 1 ||
        value.confirmation.warningCodes[0] !== "STATION_ARRIVAL_LATE") stageFail("INVALID_REQUEST");
    confirmation = { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] };
  }
  return { commandId: value.commandId, draft: stationDraft(value.draft),
    validationToken: value.validationToken, fingerprint: value.fingerprint, confirmation };
}
export function stationExtra(value: unknown): asserts value is StationArrivalFixtureExtraV1 {
  if (!exact(value, ["employeeId", "shiftDayId", "revision", "stationArrivalUser", "stationExitUser",
    "stationLate", "flagPresent", "locked", "fullDayExceptionPresent", "overlappingShiftPresent", "policyRevision"]) ||
      !decimalId(value.employeeId) || !decimalId(value.shiftDayId, 10) ||
      !text(value.revision, 128, 1) || !text(value.policyRevision, 128, 1) ||
      !(value.stationArrivalUser === null || text(value.stationArrivalUser, 128, 1)) ||
      !(value.stationExitUser === null || text(value.stationExitUser, 128, 1)) ||
      [value.flagPresent, value.locked, value.fullDayExceptionPresent, value.overlappingShiftPresent].some(v => typeof v !== "boolean"))
    stageFail("INVALID_SOURCE_DATA");
  if (value.stationLate !== null && (!exact(value.stationLate, ["reasonCode", "minutes", "remark"]) ||
      !decimalId(value.stationLate.reasonCode) || typeof value.stationLate.minutes !== "string" ||
      !/^(0|[1-9][0-9]{0,9})$/.test(value.stationLate.minutes) || value.stationLate.remark !== null))
    stageFail("INVALID_SOURCE_DATA");
}
export function stationFacts(f: StationArrivalFactsV1) {
  facts(f.base); stationExtra(f.extra);
  const a = f.base.attendance, x = f.extra;
  if (f.base.selection.employeeId !== x.employeeId || f.base.selection.shiftDayId !== x.shiftDayId ||
      ((a?.stationArrivalLocal ?? null) === null) !== (x.stationArrivalUser === null) ||
      ((a?.stationExitLocal ?? null) === null) !== (x.stationExitUser === null) ||
      (!a && x.stationLate !== null) ||
      a && (a.stageArrivalLocal === null && (a.stageArrivalUser !== null || a.stageLateReasonCode !== null ||
        a.stageLateMinutes !== null || a.stageLateRemark !== null) ||
        a.stageArrivalLocal !== null && !a.stageArrivalUser ||
        (a.stageLateReasonCode === null) !== (a.stageLateMinutes === null) ||
        a.stageLateReasonCode === null && a.stageLateRemark !== null ||
        a.stageArrivalLocal && a.stationExitLocal && a.stageArrivalLocal > a.stationExitLocal))
    stageFail("INVALID_SOURCE_DATA");
}
export function stationEnvelope(value: unknown): StationArrivalFixtureEnvelopeV1 {
  if (!exact(value, ["stageRows", "stationFacts"]) || !Array.isArray(value.stageRows) ||
      !Array.isArray(value.stationFacts) || value.stageRows.length < 1 || value.stageRows.length > 1000 ||
      value.stationFacts.length !== value.stageRows.length) stageFail("INVALID_SOURCE_DATA");
  const rows: StationArrivalFixtureEnvelopeV1 = { stageRows: [], stationFacts: [] };
  const keys = new Set<string>(), days = new Set<string>();
  for (const row of value.stageRows) {
    facts(row);
    const key = canonical(row.selection);
    if (keys.has(key) || days.has(row.selection.shiftDayId)) stageFail("INVALID_SOURCE_DATA");
    keys.add(key); days.add(row.selection.shiftDayId); rows.stageRows.push(row);
  }
  const extras = new Set<string>();
  for (const x of value.stationFacts) {
    stationExtra(x);
    const key = canonical({ employeeId: x.employeeId, shiftDayId: x.shiftDayId });
    if (!keys.has(key) || extras.has(key)) stageFail("INVALID_SOURCE_DATA");
    extras.add(key); rows.stationFacts.push(x);
    const base = rows.stageRows.find(r => r.selection.employeeId === x.employeeId && r.selection.shiftDayId === x.shiftDayId)!;
    stationFacts({ base, extra: x });
  }
  return structuredClone(rows);
}
