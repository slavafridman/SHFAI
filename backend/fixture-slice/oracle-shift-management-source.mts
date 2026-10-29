// Actual §49 source assembler and SQL membership witnesses. No transport,
// sequence allocation, business mutation, default execution or authority IO.
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import type { ShiftAdmissionReferenceV1, ShiftOperationKindV1, ShiftSelectionV1 } from "./shift-management-contracts.mts";
import type { ShiftBaseline, ShiftOverlay, ShiftSnapshot } from "./shift-management-model.mts";
import { validateShiftSnapshot } from "./shift-management-model.mts";
import type { ShiftOracleInspection } from "./oracle-shift-management-uow.mts";
import type { ShiftOracleColumn, ShiftOracleRow } from "./oracle-shift-management-sql.mts";
import { parseShiftOracleRow, shiftOracleProjection, validateShiftOracleInsertability,
  validateShiftOracleCoreProjection } from "./oracle-shift-management-sql.mts";
import { readShiftOracleWindow, shiftOracleCandidateBody } from "./oracle-shift-management-snapshot.mts";
import { shiftManagementPolicyKeys as keys, shiftManagementSourceTables } from "./native-shift-management-scope.mts";
import type { observeShiftManagementMetadata } from "./oracle-shift-management-metadata.mts";
import { assertShiftWorkAllowed, validateShiftDurationPolicy, shiftCivilMinute, shiftOriginalWeek } from "./shift-management-domain.mts";
import { decimalId, localDateTime, text } from "./contract-validation.mts";
import { canonical, fingerprint, same } from "./stage-arrival-domain.mts";
import { shiftFail } from "./shift-management-errors.mts";

type Metadata = Awaited<ReturnType<typeof observeShiftManagementMetadata>>;
export interface NativeSourceScope {
  reference: Extract<ShiftAdmissionReferenceV1, { mode: "test-oracle-controlled" }>;
  employeeId: string; orgUnitId: string; selectedDayId: string | null;
  kind: ShiftOperationKindV1; overlayWrite: "insert" | "update" | null;
  planningStartLocal: string; planningEndLocal: string; windowEnd: string; scopeFingerprint: string;
  review: NonNullable<ShiftSnapshot["nativeFacts"]>["review"];
}
const baselineMap = {
  shiftDayId: "SHF_EMPLOYEE_DAY_ID", employeeNumber: "EMP_ID_NUMBER", dateLocal: "WM_DATE", dayType: "WM_DAY_TYPE",
  startLocal: "WM_SHIFT_START_DATETIME", endLocal: "WM_SHIFT_END_DATETIME",
  dayStartLocal: "WM_START_DATETIME", dayEndLocal: "WM_END_DATETIME", activityCode: "WM_SCH_ACTIVITY_ID_DATA",
  siteId: "WM_SITE_ID", paidMinutes: "WM_PAID_MINUTES", workMinutes: "WM_WORK_MINUTES", workFromHome: "WORK_FROM_HOME",
  splitShift: "SPLIT_SHIFT", exceptionType: "WM_EXCEPTION_TYPE_ID", timeoffType: "WM_TIMEOFF_TYPE_ID", source: "SOURCE", remark: "REMARK",
} as const;
const overlayMap = {
  employeeNumber: "NEW_EMPLOYEE_ID", dayType: "NEW_DAY_TYPE", startLocal: "NEW_SHIFT_START", endLocal: "NEW_SHIFT_END",
  dayStartLocal: "NEW_DAY_START", dayEndLocal: "NEW_DAY_END", activityCode: "NEW_ACTIVITY", siteId: "NEW_SITE_ID",
  paidMinutes: "NEW_PAID_MINUTES", workMinutes: "NEW_WORK_MINUTES", workFromHome: "NEW_WORK_FROM_HOME",
  splitShift: "NEW_SPLIT_SHIFT", exceptionType: "NEW_EXCEPTION_TYPE_ID", timeoffType: "NEW_TIMEOFF_TYPE_ID",
  startReasonCode: "START_CHANGE_REASON", endReasonCode: "END_CHANGE_REASON", cancelReasonCode: "CANCEL_REASON_CODE",
  cancelRemark: "CANCEL_REASON_REMARK", modificationLocal: "MODIFICATION_TIME", modificationUser: "MODIFICATION_USER",
} as const;
function value(row: ShiftOracleRow, column: string): string | null {
  if (!Object.hasOwn(row, column)) shiftFail("INVALID_SOURCE_DATA");
  return row[column];
}
function required(row: ShiftOracleRow, column: string): string {
  const v = value(row, column); if (v === null) shiftFail("INVALID_SOURCE_DATA"); return v;
}
function extras(row: ShiftOracleRow, mapped: readonly string[]): ShiftOracleRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !mapped.includes(key)));
}
function baseline(row: ShiftOracleRow): ShiftBaseline {
  return { shiftDayId: required(row, baselineMap.shiftDayId), employeeNumber: required(row, baselineMap.employeeNumber),
    dateLocal: required(row, baselineMap.dateLocal), dayType: required(row, baselineMap.dayType),
    startLocal: required(row, baselineMap.startLocal), endLocal: required(row, baselineMap.endLocal),
    dayStartLocal: value(row, baselineMap.dayStartLocal), dayEndLocal: value(row, baselineMap.dayEndLocal),
    activityCode: required(row, baselineMap.activityCode), siteId: required(row, baselineMap.siteId),
    paidMinutes: required(row, baselineMap.paidMinutes), workMinutes: required(row, baselineMap.workMinutes),
    workFromHome: value(row, baselineMap.workFromHome), splitShift: value(row, baselineMap.splitShift),
    exceptionType: value(row, baselineMap.exceptionType), timeoffType: value(row, baselineMap.timeoffType),
    source: required(row, baselineMap.source), remark: value(row, baselineMap.remark), switchDayId: null,
    preserved: extras(row, Object.values(baselineMap)) };
}
function overlay(row: ShiftOracleRow): ShiftOverlay {
  return { employeeNumber: value(row, overlayMap.employeeNumber), dayType: value(row, overlayMap.dayType),
    startLocal: value(row, overlayMap.startLocal), endLocal: value(row, overlayMap.endLocal),
    dayStartLocal: value(row, overlayMap.dayStartLocal), dayEndLocal: value(row, overlayMap.dayEndLocal),
    activityCode: value(row, overlayMap.activityCode), siteId: value(row, overlayMap.siteId),
    paidMinutes: value(row, overlayMap.paidMinutes), workMinutes: value(row, overlayMap.workMinutes),
    workFromHome: value(row, overlayMap.workFromHome), splitShift: value(row, overlayMap.splitShift),
    exceptionType: value(row, overlayMap.exceptionType), timeoffType: value(row, overlayMap.timeoffType),
    startReasonCode: value(row, overlayMap.startReasonCode), endReasonCode: value(row, overlayMap.endReasonCode),
    cancelReasonCode: value(row, overlayMap.cancelReasonCode), cancelRemark: value(row, overlayMap.cancelRemark),
    modificationLocal: value(row, overlayMap.modificationLocal), modificationUser: value(row, overlayMap.modificationUser),
    preserved: extras(row, ["SHF_EMPLOYEE_DAY_ID", ...Object.values(overlayMap)]) };
}
function civilOffset(local: string, minutes: number): string {
  const date = new Date((shiftCivilMinute(local) + minutes) * 60000);
  if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) shiftFail("COMMAND_SCOPE_DEFERRED");
  // Gregorian arithmetic scratch value, NOT a UTC interpretation/payroll time.
  return date.toISOString().slice(0, 19);
}
function gapMinutes(value: string | null): number {
  const match = typeof value === "string" && /^(0|[1-9][0-9]{0,8})(?:\.([0-9]{1,6}))?$/.exec(value);
  if (!match) shiftFail("INVALID_SOURCE_DATA");
  const fraction = match[2] ?? "", divisor = 10n ** BigInt(fraction.length);
  const numerator = (BigInt(match[1]) * divisor + BigInt(fraction || "0")) * 60n;
  if (numerator % divisor !== 0n || numerator / divisor > 9999999999n) shiftFail("INVALID_SOURCE_DATA");
  return Number(numerator / divisor); // Bounded policy minutes, never identifiers.
}
function predicate(table: string): string {
  const candidates = shiftOracleCandidateBody("w_");
  switch (table) {
    case "SHF_ORG_UNIT": return "r.ORG_UNIT_ID=:w_team OR r.ORG_UNIT_ID=(SELECT PARENT_UNIT FROM SHIFTER.SHF_ORG_UNIT WHERE ORG_UNIT_ID=:w_team)";
    case "SHF_ORG_UNITS_SHF_SITES": return "r.SOU_ORG_UNIT_ID=:w_parent";
    case "SHF_SYSTEM_PARAM": return "r.PARAM_KEY IN (:w_min,:w_max,:w_gap,:w_managed)";
    case "SHF_UNIT_PARAM": return "r.ORG_UNIT_ID=:w_parent AND r.PARAM_KEY IN (:w_min,:w_max,:w_gap,:w_managed)";
    case "SHF_ACTIVITY_TYPE": return "r.SITE_ID=TO_NUMBER(:w_site)";
    case "SHF_EVENT_REASON": return "r.SER_TYPE IN (TO_NUMBER(:w_time_reason),TO_NUMBER(:w_cancel_reason))";
    case "SHF_EMPLOYEE_REPORTS": return "r.EMPLOYEE_ID=TO_NUMBER(:w_employee) AND r.APPROVED_TIME IS NULL";
    case "SHF_EMPLOYEE_EVENTS": return `r.EMPLOYEE_ID=TO_NUMBER(:w_employee) AND
      ((r.EVENT_TIME>=TO_DATE(:w_rangeStart,'YYYY-MM-DD"T"HH24:MI:SS') AND
        r.EVENT_TIME<TO_DATE(:w_rangeEnd,'YYYY-MM-DD"T"HH24:MI:SS')) OR r.EMPLOYEE_DAY_ID IN (${candidates}))`;
    case "SHF_EMPLOYEE_EXCEPTIONS": case "SHF_EMPLOYEE_EXCEPTIONS_BASE": return `r.AGENT_DAY_ID IN (${candidates})`;
    case "SHF_TIME_CHANGE_CANDIDATES": return `r.EMPLOYEE_DAY_ID IN (${candidates}) AND r.APPROVE_TIME IS NULL`;
    case "SHF_SHIFT_REDUCE_CANDIDATE": return `r.SHF_EMPLOYEE_DAY_ID IN (${candidates}) AND r.APPROVE_TIME IS NULL`;
    case "SHF_REPLACE_CANDIDATES": case "SHF_REPLACE_BREAK_CANDIDATES": return `r.SHF_EMPLOYEE_DAY_ID IN (${candidates})`;
    default: return shiftFail("INVALID_SOURCE_DATA");
  }
}
function fixedBinds(scope: NativeSourceScope, parent: string | null, site: string | null,
  prefix: string | null, rangeStart: string, rangeEnd: string): Record<string, string | null> {
  return { w_team: scope.orgUnitId, w_parent: parent, w_site: site, w_employee: scope.employeeId,
    w_employeeKey: prefix, w_selectedDay: scope.selectedDayId, w_rangeStart: rangeStart, w_rangeEnd: rangeEnd,
    w_min: keys.minimum, w_max: keys.maximum, w_gap: keys.gap, w_managed: keys.managed,
    w_time_reason: "3", w_cancel_reason: "8" }; // SHFConstants.CHANGE_SHIFT_REASON / CANCEL_SHIFT.
}
export async function readNativeShiftSource(query: NativeQuery, metadata: Metadata, scope: NativeSourceScope,
  selected: ShiftSelectionV1, signal?: AbortSignal, expectedEmployeeNumber?: string): Promise<ShiftOracleInspection> {
  assertShiftWorkAllowed(signal);
  if (!same(metadata.proof.tableScope, shiftManagementSourceTables) || metadata.proof.operation !== "native-shift-management-v0.1" ||
      metadata.proof.kind !== scope.kind || metadata.certificate !== scope.reference.metadata.certificate ||
      selected.employeeId !== scope.employeeId || scope.selectedDayId !== null &&
        selected.shiftDayId !== null && selected.shiftDayId !== scope.selectedDayId)
    shiftFail("SHIFT_DAY_NOT_FOUND");
  if (!localDateTime(scope.planningStartLocal) || !localDateTime(scope.planningEndLocal) ||
      scope.planningStartLocal >= scope.planningEndLocal || !/^[0-9a-f]{64}$/.test(scope.scopeFingerprint))
    shiftFail("LIVE_WRITES_DISABLED");
  const witnesses: NonNullable<ShiftSnapshot["nativeFacts"]>["witnesses"] = [];
  let binds = fixedBinds(scope, null, null, null, scope.planningStartLocal, scope.planningEndLocal);
  const collect = async (table: string) => {
    const schema = metadata.schemas[table];
    if (!schema?.length) shiftFail("INVALID_SOURCE_DATA");
    // LONG event remark is not a decision input. Any scoped event already
    // blocks this subset; do not fetch arbitrary LONG payloads to infer absence.
    const columns = schema.filter(c => !(table === "SHF_EMPLOYEE_EVENTS" && c.name === "REMARK"));
    const sql = `SELECT /* shf49:source:${table} */ ${columns.map(c =>
      `${shiftOracleProjection(c, "r.")} AS "${c.name}"`).join(",")} FROM SHIFTER.${table} r
      WHERE (${predicate(table)})`;
    const used = Object.fromEntries(Object.entries(binds).filter(([name]) => new RegExp(`:${name}\\b`).test(sql)));
    const rows = await query(sql, used, 1001);
    assertShiftWorkAllowed(signal);
    if (rows.length > 1000) shiftFail("DEPENDENCY_UNAVAILABLE");
    const parsed = rows.map(row => parseShiftOracleRow(row, columns))
      .sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0);
    witnesses.push({ table, columns: columns.map(c => c.name), rows: parsed });
    return parsed;
  };
  const org = await collect("SHF_ORG_UNIT"), team = org.find(row => row.ORG_UNIT_ID === scope.orgUnitId);
  if (!team || team.UNIT_TYPE_ID !== "J01" || !team.PARENT_UNIT) shiftFail("INVALID_SOURCE_DATA");
  const parent = org.find(row => row.ORG_UNIT_ID === team.PARENT_UNIT);
  if (!parent || parent.UNIT_TYPE_ID !== "G01" || org.length !== 2) shiftFail("INVALID_SOURCE_DATA");
  binds.w_parent = parent.ORG_UNIT_ID;
  const mappings = await collect("SHF_ORG_UNITS_SHF_SITES");
  if (mappings.length !== 1 || !decimalId(mappings[0].SS_SITE_ID)) shiftFail("INVALID_SOURCE_DATA");
  const site = mappings[0].SS_SITE_ID; binds.w_site = site;
  const system = await collect("SHF_SYSTEM_PARAM"), unit = await collect("SHF_UNIT_PARAM");
  const parameter = (key: string, mandatory = true): string | null => {
    const defaults = system.filter(row => row.PARAM_KEY === key), overrides = unit.filter(row => row.PARAM_KEY === key);
    if (defaults.length > 1 || overrides.length > 1 || mandatory && defaults.length !== 1) shiftFail("INVALID_SOURCE_DATA");
    return overrides[0]?.PARAM_VALUE ?? defaults[0]?.DEFAULT_VALUE ?? null;
  };
  const minimum = parameter(keys.minimum), maximum = parameter(keys.maximum), managed = parameter(keys.managed, false);
  if (typeof minimum !== "string" || !/^[1-9][0-9]{0,9}$/.test(minimum) ||
      typeof maximum !== "string" || !/^[1-9][0-9]{0,9}$/.test(maximum)) shiftFail("INVALID_SOURCE_DATA");
  const policy = { minimumMinutes: Number(minimum), maximumMinutes: Number(maximum), gapMinutes: gapMinutes(parameter(keys.gap)) };
  validateShiftDurationPolicy(policy);
  const rangeStart = civilOffset(scope.planningStartLocal, -policy.gapMinutes);
  const rangeEnd = civilOffset(scope.planningEndLocal, policy.gapMinutes);
  const core = await readShiftOracleWindow(query, metadata.core, { employeeId: scope.employeeId,
    shiftDayId: scope.selectedDayId }, { employeeId: scope.employeeId, orgUnitId: scope.orgUnitId,
    rangeStart, rangeEnd, ...(expectedEmployeeNumber === undefined ? {} : { expectedEmployeeNumber }) }, signal);
  const employee = core.employee;
  if (selected.shiftDayId !== null && !core.days.some(row => row.SHF_EMPLOYEE_DAY_ID === selected.shiftDayId))
    shiftFail("SHIFT_DAY_NOT_FOUND");
  binds = fixedBinds(scope, parent.ORG_UNIT_ID, site, required(employee, "EMP_ID_NUMBER").slice(0, 8), rangeStart, rangeEnd);
  const activities = await collect("SHF_ACTIVITY_TYPE"), reasons = await collect("SHF_EVENT_REASON");
  const numericOptions = (rows: ShiftOracleRow[], code: string, label: string) => {
    if (rows.length > 100 || rows.some(row => !decimalId(row[code]) ||
        !(row[label] === null || text(row[label], 256, 1))) ||
        new Set(rows.map(row => row[code])).size !== rows.length) shiftFail("INVALID_SOURCE_DATA");
    return rows.map(row => ({ code: required(row, code), label: value(row, label) }))
      .sort((a, b) => BigInt(a.code) < BigInt(b.code) ? -1 : BigInt(a.code) > BigInt(b.code) ? 1 : 0);
  };
  if (reasons.some(row => row.SER_TYPE !== "3" && row.SER_TYPE !== "8")) shiftFail("INVALID_SOURCE_DATA");
  const dependencies: ShiftSnapshot["dependencies"] = [];
  for (const table of shiftManagementSourceTables.slice(10)) {
    const rows = await collect(table);
    const kind = table === "SHF_EMPLOYEE_REPORTS" ? "report" : table === "SHF_EMPLOYEE_EVENTS" ? "event" :
      table.includes("EXCEPTIONS") ? "exception" : "exchange";
    for (const row of rows) dependencies.push({ kind, id: fingerprint({ table, row }), state: "unknown", shiftDayId: null });
  }
  const defaults = scope.kind === "create" || scope.kind === "csv-create" ?
    validateShiftOracleInsertability(metadata.core, "SHF_EMPLOYEE_DAY") : {};
  const overlayDefaults = scope.overlayWrite === "insert" ?
    validateShiftOracleInsertability(metadata.core, "SHF_DAY_CHANGES") : {};
  const bytes = (table: string, column: string) => {
    const descriptor = metadata.schemas[table]?.find(c => c.name === column);
    if (!descriptor || descriptor.kind !== "text" || descriptor.charUsed !== "B") shiftFail("INVALID_SOURCE_DATA");
    return descriptor.dataLength;
  };
  const charset = metadata.charset;
  if (charset !== "AL32UTF8" && charset !== "IW8ISO8859P8") shiftFail("INVALID_SOURCE_DATA");
  const snapshot: ShiftSnapshot = {
    reference: scope.reference,
    employee: { employeeId: required(employee, "EMPLOYEE_ID"), employeeNumber: required(employee, "EMP_ID_NUMBER"),
      firstName: required(employee, "FIRST_NAME"), lastName: required(employee, "LAST_NAME"),
      orgUnitId: required(employee, "ORG_UNIT_ID"), prefixEmployeeIds: core.prefixEmployees.map(row => required(row, "EMPLOYEE_ID")),
      statusCode: value(employee, "STATUS_ID"), workFromHome: value(employee, "WORK_FROM_HOME"), siteIds: [site] },
    days: core.days.map(row => {
      const change = core.overlays.find(o => o.SHF_EMPLOYEE_DAY_ID === row.SHF_EMPLOYEE_DAY_ID);
      return { baseline: baseline(row), overlay: change ? overlay(change) : null,
        attendance: core.attendance.find(a => a.SHF_EMPLOYEE_DAY_ID === row.SHF_EMPLOYEE_DAY_ID) ?? null };
    }),
    dependencies, policy, activityOptions: numericOptions(activities, "ACTIVITY_TYPE_ID", "ACTIVITY_TYPE_NAME"),
    startEndReasonOptions: numericOptions(reasons.filter(row => row.SER_TYPE === "3"), "REASON_ID", "REASON_DESC"),
    cancelReasonOptions: numericOptions(reasons.filter(row => row.SER_TYPE === "8"), "REASON_ID", "REASON_DESC"),
    partnerPolicy: { managedBreaks: managed === "true" ? "enabled" : managed === "false" ? "disabled" : "unknown",
      cti: scope.review?.state ?? "unknown" },
    textStorage: { charset, remarkBytes: Math.min(bytes("SHF_EMPLOYEE_DAY", "REMARK"),
      bytes("SHF_DAY_CHANGES", "CANCEL_REASON_REMARK")),
      cancelReasonBytes: bytes("SHF_DAY_CHANGES", "CANCEL_REASON_CODE"), actorBytes: bytes("SHF_DAY_CHANGES", "MODIFICATION_USER") },
    validUntil: scope.windowEnd, preserved: { SOURCE_SCOPE: scope.scopeFingerprint, MOKED_CODE: parent.ORG_UNIT_ID },
    nativeFacts: { planningStartLocal: scope.planningStartLocal, planningEndLocal: scope.planningEndLocal,
      schemaCertificate: metadata.certificate, baselineDefaults: defaults, overlayDefaults,
      employeeOriginal: employee, review: scope.review, witnesses },
  };
  validateShiftSnapshot(snapshot, scope.reference, scope.employeeId);
  validateShiftOracleCoreProjection(snapshot, core);
  if (scope.selectedDayId !== null) {
    const selectedDay = snapshot.days.find(day => day.baseline.shiftDayId === scope.selectedDayId);
    if (!selectedDay) shiftFail("SHIFT_DAY_NOT_FOUND");
    const week = shiftOriginalWeek({ startLocal: selectedDay.overlay?.startLocal ?? selectedDay.baseline.startLocal,
      endLocal: selectedDay.overlay?.endLocal ?? selectedDay.baseline.endLocal });
    if (week.startLocal < scope.planningStartLocal || week.endLocal > scope.planningEndLocal)
      shiftFail("COMMAND_SCOPE_DEFERRED");
  }
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 2097152) shiftFail("DEPENDENCY_UNAVAILABLE");
  return { snapshot, core, schema: metadata.core };
}
export function nativeShiftMembershipGuard(current: ShiftOracleInspection, scope: NativeSourceScope,
  schemas: Record<string, ShiftOracleColumn[]>) {
  const facts = current.snapshot.nativeFacts;
  if (!facts || facts.schemaCertificate !== scope.reference.metadata.certificate) shiftFail("INVALID_SOURCE_DATA");
  const parent = current.snapshot.preserved.MOKED_CODE;
  if (typeof parent !== "string") shiftFail("INVALID_SOURCE_DATA");
  const binds = fixedBinds(scope, parent, current.snapshot.employee.siteIds[0],
    current.snapshot.employee.employeeNumber.slice(0, 8), civilOffset(scope.planningStartLocal, -current.snapshot.policy.gapMinutes),
    civilOffset(scope.planningEndLocal, current.snapshot.policy.gapMinutes));
  const candidates = shiftOracleCandidateBody("w_"), parts = [
    `(SELECT COUNT(*) FROM (${candidates}))=TO_NUMBER(:w_days)`,
    `(SELECT COUNT(*) FROM SHIFTER.SHF_DAY_CHANGES r WHERE r.SHF_EMPLOYEE_DAY_ID IN (${candidates}))=TO_NUMBER(:w_overlays)`,
    `(SELECT COUNT(*) FROM SHIFTER.SHF_ATTENDANCE r WHERE r.SHF_EMPLOYEE_DAY_ID IN (${candidates}))=TO_NUMBER(:w_attendance)`,
  ];
  binds.w_days = String(current.core.days.length); binds.w_overlays = String(current.core.overlays.length);
  binds.w_attendance = String(current.core.attendance.length);
  for (let i = 0; i < facts.witnesses.length; i++) {
    const witness = facts.witnesses[i], where = predicate(witness.table), key = `w_count_${i}`;
    binds[key] = String(witness.rows.length);
    parts.push(`(SELECT COUNT(*) FROM SHIFTER.${witness.table} r WHERE (${where}))=TO_NUMBER(:${key})`);
    for (let j = 0; j < witness.rows.length; j++) {
      const row = witness.rows[j], comparisons: string[] = [];
      for (let k = 0; k < witness.columns.length; k++) {
        const name = witness.columns[k], bind = `w_orig_${i}_${j}_${k}`;
        const column = schemas[witness.table]?.find(c => c.name === name);
        if (!column || !Object.hasOwn(row, name)) shiftFail("INVALID_SOURCE_DATA");
        binds[bind] = row[name];
        const expression = shiftOracleProjection(column, "r.");
        comparisons.push(`((${expression}=:${bind}) OR (r.${name} IS NULL AND :${bind} IS NULL))`);
      }
      parts.push(`EXISTS (SELECT 1 FROM SHIFTER.${witness.table} r WHERE (${where}) AND ${comparisons.join(" AND ")})`);
    }
  }
  return { sql: parts.join(" AND "), binds };
}
