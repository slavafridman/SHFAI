import { decimalId, localDateTime, record, text } from "./contract-validation.mts";
import { exact, parseStageJson } from "./stage-arrival-validation.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { ShiftManagementError, shiftFail } from "./shift-management-errors.mts";
import type { CsvShiftCommandV1, ShiftCommandV1, ShiftDraftV1, ShiftInvalidParameterNameV1,
  ShiftSelectionV1, ShiftWarningCodeV1, ShiftReceiptV1, ShiftOperationKindV1 } from "./shift-management-contracts.mts";

function invalid(name: ShiftInvalidParameterNameV1): never {
  return shiftFail("INVALID_REQUEST", {
    invalidParameters: [{ name, reason: "invalid-format" }],
  });
}
function string(value: unknown, name: ShiftInvalidParameterNameV1,
  valid: (value: string) => boolean): string {
  if (typeof value !== "string" || !valid(value)) return invalid(name);
  return value;
}
function id(value: unknown, name: ShiftInvalidParameterNameV1, maximum = 38): string {
  return string(value, name, candidate => decimalId(candidate, maximum));
}
function minute(value: unknown, name: "startLocal" | "endLocal"): string {
  return string(value, name, candidate => localDateTime(candidate) && candidate.endsWith(":00"));
}
function plain(value: unknown, name: ShiftInvalidParameterNameV1, maximum: number): string {
  return string(value, name, candidate =>
    text(candidate, maximum, 1) && !/[\p{Cc}\p{Cf}]/u.test(candidate));
}
function remark(value: unknown): string | null {
  return value === null ? null : plain(value, "remark", 500);
}
function location(value: unknown): "home" | "site" {
  if (value !== "home" && value !== "site") return invalid("workLocation");
  return value;
}

export function parseShiftSelection(value: unknown): ShiftSelectionV1 {
  if (!exact(value, ["employeeId", "shiftDayId"])) return invalid("employeeId");
  return { employeeId: id(value.employeeId, "employeeId"),
    shiftDayId: value.shiftDayId === null ? null : id(value.shiftDayId, "shiftDayId", 10) };
}
export function parseShiftDraft(value: unknown): ShiftDraftV1 {
  if (!record(value)) return invalid("draft");
  if (value.kind === "create") {
    if (!exact(value, ["kind", "startLocal", "endLocal", "activityCode", "workLocation", "remark"]))
      return invalid("draft");
    return { kind: "create", startLocal: minute(value.startLocal, "startLocal"),
      endLocal: minute(value.endLocal, "endLocal"), activityCode: id(value.activityCode, "activityCode"),
      workLocation: location(value.workLocation), remark: remark(value.remark) };
  }
  if (value.kind === "change") {
    if (!exact(value, ["kind", "shiftDayId", "startLocal", "endLocal", "activityCode",
      "workLocation", "startReasonCode", "endReasonCode"])) return invalid("draft");
    return { kind: "change", shiftDayId: id(value.shiftDayId, "shiftDayId", 10),
      startLocal: minute(value.startLocal, "startLocal"), endLocal: minute(value.endLocal, "endLocal"),
      activityCode: id(value.activityCode, "activityCode"), workLocation: location(value.workLocation),
      startReasonCode: value.startReasonCode === null ? null : id(value.startReasonCode, "startReasonCode"),
      endReasonCode: value.endReasonCode === null ? null : id(value.endReasonCode, "endReasonCode") };
  }
  if (value.kind === "cancel") {
    if (!exact(value, ["kind", "shiftDayId", "reasonCode", "remark"])) return invalid("draft");
    return { kind: "cancel", shiftDayId: id(value.shiftDayId, "shiftDayId", 10),
      reasonCode: plain(value.reasonCode, "reasonCode", 10), remark: remark(value.remark) };
  }
  return invalid("kind");
}
export function parseShiftPreparationRequest(value: unknown): ShiftDraftV1 {
  if (!exact(value, ["draft"])) return invalid("body");
  return parseShiftDraft(value.draft);
}
function warning(value: unknown): value is ShiftWarningCodeV1 {
  return value === "DURATION_CHANGED" || value === "SOURCE_BECOMES_SHF" ||
    value === "OVERNIGHT_NORMALIZED" || value === "LOGICAL_CANCEL_PRESERVES_HISTORY";
}
function binding(value: Record<string, unknown>) {
  const commandId = string(value.commandId, "commandId",
    candidate => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(candidate));
  const fingerprint = string(value.fingerprint, "fingerprint", candidate => /^[0-9a-f]{64}$/.test(candidate));
  if (!exact(value.operationConfirmation, ["accepted"]) || value.operationConfirmation.accepted !== true)
    return invalid("operationConfirmation");
  if (!Array.isArray(value.acknowledgedWarningCodes) || value.acknowledgedWarningCodes.length > 4)
    return invalid("acknowledgedWarningCodes");
  const acknowledgedWarningCodes: ShiftWarningCodeV1[] = [];
  for (const candidate of value.acknowledgedWarningCodes) {
    if (!warning(candidate) || acknowledgedWarningCodes.includes(candidate))
      return invalid("acknowledgedWarningCodes");
    acknowledgedWarningCodes.push(candidate);
  }
  return { commandId, fingerprint, operationConfirmation: { accepted: true as const }, acknowledgedWarningCodes };
}
function token(value: unknown, name: "validationToken" | "previewToken"): string {
  return string(value, name, candidate => /^[A-Za-z0-9_-]{43}$/.test(candidate) &&
    Buffer.from(candidate, "base64url").toString("base64url") === candidate);
}
export function parseShiftCommand(value: unknown): ShiftCommandV1 {
  if (!exact(value, ["commandId", "draft", "validationToken", "fingerprint",
    "operationConfirmation", "acknowledgedWarningCodes"])) return invalid("body");
  return { ...binding(value), draft: parseShiftDraft(value.draft),
    validationToken: token(value.validationToken, "validationToken") };
}
export function parseCsvShiftCommand(value: unknown): CsvShiftCommandV1 {
  if (!exact(value, ["commandId", "previewToken", "fingerprint",
    "operationConfirmation", "acknowledgedWarningCodes"])) return invalid("body");
  return { ...binding(value), previewToken: token(value.previewToken, "previewToken") };
}
export function requireShiftAcknowledgments(expected: readonly ShiftWarningCodeV1[],
  actual: readonly unknown[], operationAccepted: boolean): void {
  const required = new Set(expected), supplied = new Set(actual);
  if (!operationAccepted || actual.length !== supplied.size || required.size !== supplied.size ||
      [...required].some(code => !supplied.has(code)))
    throw new ShiftManagementError({ status: 409, code: "CONFIRMATION_REQUIRED",
      effect: "none", nextAction: "prepare-again" });
}

export function parseShiftJson(raw: string, signal?: AbortSignal): unknown {
  assertShiftWorkAllowed(signal);
  if (typeof raw !== "string") return invalid("body");
  if (Buffer.byteLength(raw, "utf8") > 16384) shiftFail("REQUEST_TOO_LARGE");
  if (!raw.isWellFormed()) return invalid("body");
  // Existing duplicate/escaped-key grammar is reused unchanged. Tighten this
  // operation's container depth to eight before calling its sixteen-depth parser.
  let depth = 0, quoted = false;
  for (let i = 0; i < raw.length; i++) {
    if (i % 256 === 0) assertShiftWorkAllowed(signal);
    const character = raw[i];
    if (quoted) {
      if (character === "\\") i++;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === "{" || character === "[") {
      if (++depth > 8) return invalid("body");
    } else if (character === "}" || character === "]") {
      if (--depth < 0) return invalid("body");
    }
  }
  let value: unknown;
  try { value = parseStageJson(raw); }
  catch { return invalid("body"); }
  const wellFormed = (entry: unknown): boolean => {
    if (typeof entry === "string") return entry.isWellFormed();
    if (Array.isArray(entry)) return entry.every(wellFormed);
    if (record(entry)) return Object.entries(entry).every(([key, item]) =>
      key.isWellFormed() && wellFormed(item));
    return true;
  };
  if (!wellFormed(value)) return invalid("body");
  return value;
}

function validShiftState(value: unknown): boolean {
  return exact(value, ["shiftDayId", "status", "startLocal", "endLocal", "activityCode", "siteId",
    "workLocation", "paidMinutes", "workMinutes", "source"]) && decimalId(value.shiftDayId, 10) &&
    (value.status === "scheduled" || value.status === "cancelled") &&
    localDateTime(value.startLocal) && localDateTime(value.endLocal) &&
    value.endLocal > value.startLocal && decimalId(value.activityCode) && decimalId(value.siteId) &&
    (value.workLocation === "home" || value.workLocation === "site") &&
    typeof value.paidMinutes === "string" && /^(?:0|[1-9][0-9]{0,9})$/.test(value.paidMinutes) &&
    typeof value.workMinutes === "string" && /^(?:0|[1-9][0-9]{0,9})$/.test(value.workMinutes) &&
    (value.source === "WFM" || value.source === "SHF" || value.source === "fExtra");
}
export function validShiftReceipt(value: unknown, expected: {
  employeeId: string; commandId: string; kind: ShiftOperationKindV1;
  source: "isolated-fixture" | "oracle-test"; zone: string;
}): value is ShiftReceiptV1 {
  if (!exact(value, ["contractVersion", "commandId", "employeeId", "kind", "effects",
    "commitAcknowledgedAt", "readBackVerifiedAt", "businessTimeZone", "replayed", "receiptPersistence",
    "partnerCompletion", "outcome", "dataSource"]) || value.contractVersion !== "49-v0.1" ||
      value.employeeId !== expected.employeeId || value.commandId !== expected.commandId ||
      value.kind !== expected.kind || value.businessTimeZone !== expected.zone ||
      value.dataSource !== expected.source ||
      value.outcome !== (expected.source === "isolated-fixture" ? "fixture-committed" : "oracle-test-committed") ||
      value.replayed !== false || value.receiptPersistence !== "none" || value.partnerCompletion !== "not-invoked" ||
      !Array.isArray(value.effects) || value.effects.length < 1 ||
      value.effects.length > (expected.kind === "csv-create" ? 100 : 1)) return false;
  for (const instant of [value.commitAcknowledgedAt, value.readBackVerifiedAt])
    if (typeof instant !== "string" ||
        !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(instant) ||
        !Number.isFinite(Date.parse(instant)) || new Date(instant).toISOString() !== instant) return false;
  if (typeof value.readBackVerifiedAt !== "string" || typeof value.commitAcknowledgedAt !== "string" ||
      value.readBackVerifiedAt < value.commitAcknowledgedAt) return false;
  const ids = new Set<string>(); let lastRow = 0;
  for (const effect of value.effects) {
    if (!exact(effect, ["row", "before", "after", "warningCodes"]) ||
        typeof effect.row !== "number" || !Number.isInteger(effect.row) ||
        effect.row < (expected.kind === "csv-create" ? 2 : 1) || effect.row <= lastRow ||
        !validShiftState(effect.after) || !record(effect.after) ||
        typeof effect.after.shiftDayId !== "string" || ids.has(effect.after.shiftDayId) ||
        !Array.isArray(effect.warningCodes) || effect.warningCodes.some(code => !warning(code)) ||
        new Set(effect.warningCodes).size !== effect.warningCodes.length) return false;
    lastRow = effect.row; ids.add(effect.after.shiftDayId);
    if (expected.kind === "create" || expected.kind === "csv-create") {
      if (effect.before !== null || effect.after.status !== "scheduled" || effect.after.source !== "fExtra") return false;
    } else {
      if (!validShiftState(effect.before) || !record(effect.before) ||
          effect.before.shiftDayId !== effect.after.shiftDayId || effect.before.status !== "scheduled" ||
          effect.after.status !== (expected.kind === "cancel" ? "cancelled" : "scheduled")) return false;
      const before = effect.before, after = effect.after;
      if (expected.kind === "cancel" && ["startLocal", "endLocal", "activityCode", "siteId", "workLocation",
        "paidMinutes", "workMinutes"].some(key => before[key] !== after[key])) return false;
    }
  }
  return true;
}
