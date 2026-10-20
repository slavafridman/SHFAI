import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { unitCode, plainLabel } from "./current-shifts-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { StageArrivalCommitDraftV1, StageArrivalDraftV1, StageArrivalFactsV1,
  StageArrivalModeV1, StageArrivalSelectionV1, StageArrivalSourceBindingV1 } from "./stage-arrival-contracts.mts";

export function validateStageArrivalMode(value: unknown): StageArrivalModeV1 {
  if (!record(value)) throw Error("Invalid stage-arrival configuration");
  const mode = value.attendanceStageArrivalMode;
  if (mode === undefined || mode === "disabled") return "disabled";
  if (mode !== "isolated-fixture" || value.dataSource !== "isolated-fixture" ||
      !["local-development", "isolated-test-demo"].includes(String(value.deploymentClass)) ||
      value.authenticationMode !== "synthetic" || value.syntheticAdministratorEnabled !== true)
    throw Error("Isolated stage-arrival configuration required");
  if (Object.keys(value).some(key => !["attendanceStageArrivalMode", "dataSource", "deploymentClass",
    "authenticationMode", "syntheticAdministratorEnabled", "syntheticOrgUnitIds", "businessTimeZone"].includes(key)))
    throw Error("Unsupported isolated stage-arrival configuration");
  return mode;
}
export function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return record(value) && Object.keys(value).length === keys.length &&
    keys.every(k => Object.hasOwn(value, k));
}
export function selection(value: unknown): StageArrivalSelectionV1 {
  if (!exact(value, ["employeeId", "shiftDayId"]) ||
      !decimalId(value.employeeId) || !decimalId(value.shiftDayId, 10)) stageFail("INVALID_REQUEST");
  return { employeeId: value.employeeId, shiftDayId: value.shiftDayId };
}
export function draft(value: unknown): StageArrivalDraftV1 {
  if (!exact(value, ["lateReasonCode", "lateRemark"]) ||
      !(value.lateReasonCode === null || decimalId(value.lateReasonCode)) ||
      !(value.lateRemark === null || (text(value.lateRemark, 500) &&
        !/[\p{Cc}\p{Cf}<>]/u.test(value.lateRemark)))) stageFail("INVALID_REQUEST");
  return { lateReasonCode: value.lateReasonCode, lateRemark: value.lateRemark };
}
export function command(value: unknown): StageArrivalCommitDraftV1 {
  if (!exact(value, ["commandId", "draft", "validationToken", "fingerprint", "confirmation"]) ||
      typeof value.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.commandId) ||
      typeof value.validationToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value.validationToken) ||
      typeof value.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(value.fingerprint)) stageFail("INVALID_REQUEST");
  let confirmation: StageArrivalCommitDraftV1["confirmation"] = null;
  if (value.confirmation !== null) {
    if (!exact(value.confirmation, ["accepted", "warningCodes"]) || value.confirmation.accepted !== true ||
        !Array.isArray(value.confirmation.warningCodes) || value.confirmation.warningCodes.length !== 1 ||
        value.confirmation.warningCodes[0] !== "STAGE_ARRIVAL_LATE") stageFail("INVALID_REQUEST");
    confirmation = { accepted: true, warningCodes: ["STAGE_ARRIVAL_LATE"] };
  }
  return { commandId: value.commandId, draft: draft(value.draft),
    validationToken: value.validationToken, fingerprint: value.fingerprint, confirmation };
}
export function validReceipt(value: unknown, expected: StageArrivalCommitDraftV1,
    selected: StageArrivalSelectionV1, zone: string | null = null): boolean {
    if (!exact(value, ["commandId", "employeeId", "shiftDayId", "outcome", "recorded", "committedAt",
      "businessTimeZone", "replayed", "partnerCompletion", "dataSource"]) ||
        value.commandId !== expected.commandId || value.employeeId !== selected.employeeId ||
        value.shiftDayId !== selected.shiftDayId || value.outcome !== "fixture-committed" ||
        value.dataSource !== "isolated-fixture" || value.partnerCompletion !== "not-invoked" ||
        typeof value.replayed !== "boolean" || !text(value.businessTimeZone, 128, 1) ||
        zone !== null && zone !== value.businessTimeZone ||
        typeof value.committedAt !== "string" ||
        !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,9})?Z$/.test(value.committedAt) ||
        !Number.isFinite(Date.parse(value.committedAt)) ||
        !exact(value.recorded, ["stageArrivalLocal", "briefing", "stageLate"]) ||
        !localDateTime(value.recorded.stageArrivalLocal) || value.recorded.briefing !== false) return false;
    const late = value.recorded.stageLate;
    if (expected.confirmation === null) return late === null;
    return exact(late, ["reasonCode", "minutes", "remark"]) && late.reasonCode === expected.draft.lateReasonCode &&
      typeof late.minutes === "string" && /^(0|[1-9][0-9]{0,9})$/.test(late.minutes) &&
      late.remark === expected.draft.lateRemark;
}
export function sourceBinding(v: unknown): asserts v is StageArrivalSourceBindingV1 {
  if (!exact(v, ["environment", "fixtureSession", "dataSource"]) ||
      !text(v.environment, 128, 1) || !text(v.fixtureSession, 128, 1) ||
      v.dataSource !== "isolated-fixture") stageFail("INVALID_SOURCE_DATA");
}
export function facts(v: unknown): asserts v is StageArrivalFactsV1 {
  const fail = () => stageFail("INVALID_SOURCE_DATA");
  if (!exact(v, ["source", "selection", "orgUnitId", "parentUnitId", "revision", "policy", "planned",
    "attendance", "missingPresent", "outstandingReportsPresent", "splitOrP2", "cancelledOrNonActivityDay", "lateReasonOptions"])) fail();
  // The guard is repeated for narrowing without unchecked assertions.
  if (!record(v)) return fail();
  sourceBinding(v.source);
  if (!exact(v.selection, ["employeeId", "shiftDayId"]) || !decimalId(v.selection.employeeId) ||
      !decimalId(v.selection.shiftDayId, 10) || !unitCode(v.orgUnitId) || !unitCode(v.parentUnitId) ||
      v.orgUnitId === v.parentUnitId ||
      !text(v.revision, 128, 1) || !exact(v.policy, ["revision", "configuredMinutes"]) ||
      !text(v.policy.revision, 128, 1) || typeof v.policy.configuredMinutes !== "number" ||
      !Number.isSafeInteger(v.policy.configuredMinutes) ||
      !exact(v.planned, ["startLocal", "endLocal"]) || !localDateTime(v.planned.startLocal) ||
      !localDateTime(v.planned.endLocal) || v.planned.endLocal < v.planned.startLocal) return fail();
  for (const flag of ["missingPresent", "outstandingReportsPresent", "splitOrP2", "cancelledOrNonActivityDay"])
    if (typeof v[flag] !== "boolean") fail();
  if (!Array.isArray(v.lateReasonOptions) || v.lateReasonOptions.length > 100) return fail();
  const codes = new Set<string>();
  for (const item of v.lateReasonOptions) {
    if (!exact(item, ["code", "label"]) || !decimalId(item.code) ||
        !(item.label === null || plainLabel(item.label, 1)) || codes.has(item.code)) return fail();
    codes.add(item.code);
  }
  const a = v.attendance;
  if (a === null) return;
  if (!exact(a, ["attendanceKey", "stageArrivalLocal", "stageArrivalUser", "stationArrivalLocal",
    "stationExitLocal", "briefing", "stageLateReasonCode", "stageLateMinutes", "stageLateRemark"]) ||
      !exact(a.attendanceKey, ["shiftDayId"]) || a.attendanceKey.shiftDayId !== v.selection.shiftDayId ||
      !(a.briefing === null || typeof a.briefing === "boolean") ||
      !(a.stageArrivalUser === null || text(a.stageArrivalUser, 128)) ||
      !(a.stageLateReasonCode === null || decimalId(a.stageLateReasonCode)) ||
      !(a.stageLateMinutes === null || (typeof a.stageLateMinutes === "string" && /^(0|[1-9][0-9]{0,9})$/.test(a.stageLateMinutes))) ||
      !(a.stageLateRemark === null || (text(a.stageLateRemark, 500) && !/[\p{Cc}\p{Cf}<>]/u.test(a.stageLateRemark)))) return fail();
  for (const key of ["stageArrivalLocal", "stationArrivalLocal", "stationExitLocal"])
    if (!(a[key] === null || localDateTime(a[key]))) fail();
}

// A small bounded JSON grammar walker detects duplicate decoded keys BEFORE
// JSON.parse discards them (including escaped-key aliases). Body is <=8192 bytes.
export function parseStageJson(raw: string): unknown {
  let i = 0;
  const ws = () => { while (/\s/.test(raw[i] ?? "") && i < raw.length) i++; };
  const str = (): string => {
    const start = i++;
    while (i < raw.length) {
      const c = raw[i++];
      if (c === "\\") { i++; continue; }
      if (c === '"') { const v: unknown = JSON.parse(raw.slice(start, i)); if (typeof v === "string") return v; break; }
    }
    return stageFail("INVALID_REQUEST");
  };
  const value = (depth: number): void => {
    if (depth > 16) stageFail("INVALID_REQUEST");
    ws();
    if (raw[i] === '"') { str(); return; }
    if (raw[i] === "{" || raw[i] === "[") {
      const obj = raw[i++] === "{", end = obj ? "}" : "]", seen = new Set<string>();
      ws(); if (raw[i] === end) { i++; return; }
      for (;;) {
        ws();
        if (obj) {
          if (raw[i] !== '"') stageFail("INVALID_REQUEST");
          const key = str(); if (seen.has(key)) stageFail("INVALID_REQUEST"); seen.add(key);
          ws(); if (raw[i++] !== ":") stageFail("INVALID_REQUEST");
        }
        value(depth + 1); ws();
        if (raw[i] === end) { i++; return; }
        if (raw[i++] !== ",") stageFail("INVALID_REQUEST");
      }
    }
    const start = i;
    while (i < raw.length && !/[\s,\]}]/.test(raw[i])) i++;
    if (i === start) stageFail("INVALID_REQUEST");
  };
  try { value(0); ws(); if (i !== raw.length) stageFail("INVALID_REQUEST"); return JSON.parse(raw); }
  catch { return stageFail("INVALID_REQUEST"); }
}
