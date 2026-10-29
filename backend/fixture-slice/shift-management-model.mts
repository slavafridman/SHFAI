// Backend-private parsed facts/plans for the canonical generic package ports.
// Not REST DTOs, an SQL interface, or permission to access a database.
import type { PrincipalV1 } from "./contracts.mts";
import type { ShiftAdmissionReferenceV1, ShiftDraftV1, ShiftEffectV1,
  ShiftOperationKindV1 } from "./shift-management-contracts.mts";
import type { ShiftDurationPolicy } from "./shift-management-domain.mts";
import { record, decimalId, localDateTime, text } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { pilotEmployeeNumber, pilotEmployeePrefix } from "./native-pilot-identity.mts";
import { shiftFail } from "./shift-management-errors.mts";
import { same } from "./stage-arrival-domain.mts";

export type ShiftScalar = string | number | null;
export interface ShiftBaseline {
  shiftDayId: string; employeeNumber: string; dateLocal: string; dayType: string;
  startLocal: string; endLocal: string; dayStartLocal: string | null; dayEndLocal: string | null;
  activityCode: string; siteId: string; paidMinutes: string; workMinutes: string;
  workFromHome: string | null; splitShift: string | null; switchDayId: string | null;
  exceptionType: string | null; timeoffType: string | null; source: string;
  remark: string | null;
  // Every other observed column, including NULL, is retained privately.
  preserved: Record<string, ShiftScalar>;
}
export interface ShiftOverlay {
  employeeNumber: string | null; dayType: string | null;
  startLocal: string | null; endLocal: string | null;
  dayStartLocal: string | null; dayEndLocal: string | null;
  activityCode: string | null; siteId: string | null;
  paidMinutes: string | null; workMinutes: string | null;
  workFromHome: string | null; splitShift: string | null;
  exceptionType: string | null; timeoffType: string | null;
  startReasonCode: string | null; endReasonCode: string | null;
  cancelReasonCode: string | null; cancelRemark: string | null;
  modificationLocal: string | null; modificationUser: string | null;
  preserved: Record<string, ShiftScalar>;
}
export interface ShiftDayFacts {
  baseline: ShiftBaseline;
  overlay: ShiftOverlay | null;
  // Physical attendance originals: all observed columns, not selected flags.
  attendance: Record<string, ShiftScalar> | null;
}
export interface ShiftSnapshot {
  reference: ShiftAdmissionReferenceV1;
  employee: {
    employeeId: string; firstName: string; lastName: string; orgUnitId: string;
    employeeNumber: string; prefixEmployeeIds: string[];
    statusCode: string | null; workFromHome: string | null; siteIds: string[];
  };
  days: ShiftDayFacts[];
  dependencies: Array<{ kind: "report" | "event" | "exception" | "exchange" | "pool" | "unknown";
    id: string; state: "active" | "inactive" | "unknown"; shiftDayId: string | null }>;
  policy: ShiftDurationPolicy;
  activityOptions: Array<{ code: string; label: string | null }>;
  startEndReasonOptions: Array<{ code: string; label: string | null }>;
  cancelReasonOptions: Array<{ code: string; label: string | null }>;
  partnerPolicy: { managedBreaks: "enabled" | "disabled" | "unknown";
    cti: "required" | "not-required" | "unknown" };
  textStorage: { charset: "AL32UTF8" | "IW8ISO8859P8";
    remarkBytes: number; cancelReasonBytes: number; actorBytes: number };
  validUntil: string;
  // Policy/catalog/identity raw originals beyond normalized fields, for drift.
  preserved: Record<string, ShiftScalar>;
  nativeFacts?: {
    planningStartLocal: string; planningEndLocal: string; schemaCertificate: string;
    baselineDefaults: Record<string, string | null>; overlayDefaults: Record<string, string | null>;
    employeeOriginal: Record<string, string | null>;
    review: { state: "not-required" | "required" | "unknown"; effectFingerprint: string; certificate: string } | null;
    witnesses: Array<{ table: string; columns: string[]; rows: Array<Record<string, string | null>> }>;
  };
}
export interface ShiftCreatePlan { day: ShiftBaseline }
export interface ShiftOverlayPlan { dayId: string; before: ShiftOverlay | null; after: ShiftOverlay }
export interface ShiftSourcePlan { dayId: string; original: ShiftBaseline; from: "WFM"; to: "SHF" }
export interface ShiftPlanEntry { row: number; draft: ShiftDraftV1; overnight: boolean }
export interface ShiftPlan {
  kind: ShiftOperationKindV1; entries: ShiftPlanEntry[]; effects: ShiftEffectV1[];
}
export function freezeShift<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeShift(child);
    Object.freeze(value);
  }
  return value;
}
function scalarMap(value: unknown): boolean {
  return record(value) && Object.keys(value).length <= 1000 && Object.entries(value).every(([key, item]) =>
    /^[A-Za-z][A-Za-z0-9_]*$/.test(key) && (item === null ||
      typeof item === "string" && item.isWellFormed() && item.length <= 8192 ||
      typeof item === "number" && Number.isSafeInteger(item)));
}
const nullableText = (v: unknown) => v === null || text(v, 8192);
const minutes = (v: unknown) => typeof v === "string" && /^(?:0|[1-9][0-9]{0,9})$/.test(v);
const local = (v: unknown) => localDateTime(v);
const nullableLocal = (v: unknown) => v === null || local(v);
const nullableId = (v: unknown) => v === null || decimalId(v);
function baseline(value: unknown): boolean {
  return exact(value, ["shiftDayId", "employeeNumber", "dateLocal", "dayType", "startLocal", "endLocal",
    "dayStartLocal", "dayEndLocal", "activityCode", "siteId", "paidMinutes", "workMinutes", "workFromHome",
    "splitShift", "switchDayId", "exceptionType", "timeoffType", "source", "remark", "preserved"]) &&
    decimalId(value.shiftDayId, 10) && pilotEmployeePrefix(value.employeeNumber) &&
    local(value.dateLocal) &&
    typeof value.dayType === "string" && /^[0-9]+$/.test(value.dayType) &&
    local(value.startLocal) && local(value.endLocal) && nullableLocal(value.dayStartLocal) && nullableLocal(value.dayEndLocal) &&
    decimalId(value.activityCode) && decimalId(value.siteId) && minutes(value.paidMinutes) && minutes(value.workMinutes) &&
    nullableText(value.workFromHome) && nullableText(value.splitShift) && nullableText(value.switchDayId) &&
    nullableText(value.exceptionType) && nullableText(value.timeoffType) &&
    text(value.source, 15, 1) && nullableText(value.remark) && scalarMap(value.preserved);
}
function overlay(value: unknown): boolean {
  return exact(value, ["employeeNumber", "dayType", "startLocal", "endLocal", "dayStartLocal", "dayEndLocal",
    "activityCode", "siteId", "paidMinutes", "workMinutes", "workFromHome", "splitShift", "exceptionType",
    "timeoffType", "startReasonCode", "endReasonCode", "cancelReasonCode", "cancelRemark",
    "modificationLocal", "modificationUser", "preserved"]) &&
    (value.employeeNumber === null || pilotEmployeePrefix(value.employeeNumber)) &&
    (value.dayType === null || typeof value.dayType === "string" && /^[0-9]+$/.test(value.dayType)) &&
    nullableLocal(value.startLocal) && nullableLocal(value.endLocal) &&
    nullableLocal(value.dayStartLocal) && nullableLocal(value.dayEndLocal) &&
    nullableId(value.activityCode) && nullableId(value.siteId) &&
    (value.paidMinutes === null || minutes(value.paidMinutes)) &&
    (value.workMinutes === null || minutes(value.workMinutes)) &&
    nullableText(value.workFromHome) && nullableText(value.splitShift) &&
    nullableText(value.exceptionType) && nullableText(value.timeoffType) &&
    nullableId(value.startReasonCode) && nullableId(value.endReasonCode) &&
    nullableText(value.cancelReasonCode) && nullableText(value.cancelRemark) &&
    nullableLocal(value.modificationLocal) && nullableText(value.modificationUser) && scalarMap(value.preserved);
}
function options(value: unknown, cancellation = false): boolean {
  if (!Array.isArray(value) || value.length > 100) return false;
  const seen = new Set<string>();
  return value.every(item => {
    if (!exact(item, ["code", "label"]) || typeof item.code !== "string" ||
        !(cancellation ? text(item.code, 10, 1) : decimalId(item.code)) ||
        !(item.label === null || text(item.label, 256, 1)) || seen.has(item.code)) return false;
    seen.add(item.code); return true;
  });
}
export function validateShiftSnapshot(value: unknown, reference: Readonly<ShiftAdmissionReferenceV1>,
  employeeId: string): asserts value is ShiftSnapshot {
  const fail = (): never => shiftFail("INVALID_SOURCE_DATA");
  if (!exact(value, ["reference", "employee", "days", "dependencies", "policy", "activityOptions",
    "startEndReasonOptions", "cancelReasonOptions", "partnerPolicy", "textStorage", "validUntil", "preserved",
    ...(record(value) && Object.hasOwn(value, "nativeFacts") ? ["nativeFacts"] : [])]) ||
      !same(value.reference, reference)) return fail();
  const e = value.employee;
  if (!exact(e, ["employeeId", "firstName", "lastName", "orgUnitId", "employeeNumber", "prefixEmployeeIds",
    "statusCode", "workFromHome", "siteIds"]) || e.employeeId !== employeeId || !decimalId(e.employeeId) ||
      !text(e.firstName, 256) || !text(e.lastName, 256) || !unitCode(e.orgUnitId) ||
      !pilotEmployeeNumber(e.employeeNumber) || !nullableText(e.statusCode) || !nullableText(e.workFromHome) ||
      !Array.isArray(e.prefixEmployeeIds) || e.prefixEmployeeIds.length !== 1 || e.prefixEmployeeIds[0] !== e.employeeId ||
      !Array.isArray(e.siteIds) || e.siteIds.length !== 1 || !decimalId(e.siteIds[0])) return fail();
  if (!Array.isArray(value.days) || value.days.length > 1000 ||
      value.days.some(day => !exact(day, ["baseline", "overlay", "attendance"]) ||
        !baseline(day.baseline) || !(day.overlay === null || overlay(day.overlay)) ||
        !(day.attendance === null || scalarMap(day.attendance)))) return fail();
  const ids = value.days.map(day => record(day.baseline) ? day.baseline.shiftDayId : null);
  if (new Set(ids).size !== ids.length) shiftFail("INVALID_SOURCE_DATA");
  if (!Array.isArray(value.dependencies) || value.dependencies.length > 1000 ||
      value.dependencies.some(d => !exact(d, ["kind", "id", "state", "shiftDayId"]) ||
        !["report", "event", "exception", "exchange", "pool", "unknown"].includes(String(d.kind)) ||
        !text(d.id, 128, 1) || !["active", "inactive", "unknown"].includes(String(d.state)) ||
        !(d.shiftDayId === null || decimalId(d.shiftDayId, 10)))) return fail();
  if (!exact(value.policy, ["minimumMinutes", "maximumMinutes", "gapMinutes"]) ||
      typeof value.policy.minimumMinutes !== "number" || typeof value.policy.maximumMinutes !== "number" ||
      typeof value.policy.gapMinutes !== "number" ||
      !options(value.activityOptions) || !options(value.startEndReasonOptions) || !options(value.cancelReasonOptions, true) ||
      !exact(value.partnerPolicy, ["managedBreaks", "cti"]) ||
      !["enabled", "disabled", "unknown"].includes(String(value.partnerPolicy.managedBreaks)) ||
      !["required", "not-required", "unknown"].includes(String(value.partnerPolicy.cti)) ||
      !exact(value.textStorage, ["charset", "remarkBytes", "cancelReasonBytes", "actorBytes"]) ||
      !["AL32UTF8", "IW8ISO8859P8"].includes(String(value.textStorage.charset)) ||
      [value.textStorage.remarkBytes, value.textStorage.cancelReasonBytes, value.textStorage.actorBytes]
        .some(cap => typeof cap !== "number" || !Number.isSafeInteger(cap) || cap <= 0) ||
      typeof value.validUntil !== "string" ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(value.validUntil) ||
      !Number.isFinite(Date.parse(value.validUntil)) || !scalarMap(value.preserved)) return fail();
  if (Object.hasOwn(value, "nativeFacts")) {
    const n = value.nativeFacts;
    const nativeMap = (v: unknown) => scalarMap(v) && record(v) &&
      Object.values(v).every(cell => cell === null || typeof cell === "string");
    if (reference.mode !== "test-oracle-controlled" || !exact(n, ["planningStartLocal", "planningEndLocal",
      "schemaCertificate", "baselineDefaults", "overlayDefaults", "employeeOriginal", "review", "witnesses"]) ||
        !local(n.planningStartLocal) || !local(n.planningEndLocal) ||
        typeof n.planningStartLocal !== "string" || typeof n.planningEndLocal !== "string" ||
        n.planningStartLocal >= n.planningEndLocal || n.schemaCertificate !== reference.metadata.certificate ||
        !nativeMap(n.baselineDefaults) || !nativeMap(n.overlayDefaults) || !nativeMap(n.employeeOriginal) ||
        !(n.review === null || exact(n.review, ["state", "effectFingerprint", "certificate"]) &&
          ["not-required", "required", "unknown"].includes(String(n.review.state)) &&
          typeof n.review.effectFingerprint === "string" && /^[0-9a-f]{64}$/.test(n.review.effectFingerprint) &&
          typeof n.review.certificate === "string" && /^[0-9a-f]{64}$/.test(n.review.certificate)) ||
        !Array.isArray(n.witnesses) || n.witnesses.length > 32 ||
        n.witnesses.some(w => !exact(w, ["table", "columns", "rows"]) ||
          typeof w.table !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(w.table) ||
          !Array.isArray(w.columns) || w.columns.length < 1 || w.columns.length > 1000 ||
          new Set(w.columns).size !== w.columns.length ||
          w.columns.some(c => typeof c !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(c)) ||
          !Array.isArray(w.rows) || w.rows.length > 1000 || w.rows.some(r => !nativeMap(r)))) return fail();
  }
}
// Digests never enter HTTP/logs. Use the complete actor/grants, not role names.
export function shiftActorBinding(principal: Readonly<PrincipalV1>, authGeneration: string) {
  return { principal, authGeneration, authorizedTeamIds: [...principal.resourceScope.orgUnitIds] };
}
