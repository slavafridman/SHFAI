// ISOLATED ORACLE PROTOCOL DOUBLE DATA. Historical source column names are
// evidence for SQL tests, NOT current physical metadata/default certification.
import type { ShiftOracleColumn, ShiftOracleRow, ShiftOracleSchema, ShiftOracleCore } from "../oracle-shift-management-sql.mts";
import { shiftOracleStaticDefault } from "../oracle-shift-management-sql.mts";
import { OracleShiftManagementUow } from "../oracle-shift-management-uow.mts";
import type { ShiftOracleAuthority, ShiftOracleEvidence } from "../oracle-shift-management-uow.mts";
import type { NativeConnection, NativePool } from "../oracle-stage-arrival-uow.mts";
import { readShiftOracleWindow } from "../oracle-shift-management-snapshot.mts";
import type { ShiftAdmissionPlanV1, ShiftAdmissionReferenceV1, ShiftConsumedAdmissionV1,
  ShiftOperationKindV1, ShiftRecordedEffectV1 } from "../shift-management-contracts.mts";
import type { ShiftBaseline, ShiftOverlay } from "../shift-management-model.mts";
import { managementFixtureSnapshot, managementPrincipal, createDraft } from "./shift-management-helpers.mts";
import { changedOverlay, planShifts } from "../shift-management-rules.mts";
import { record } from "../contract-validation.mts";
import { shiftFail } from "../shift-management-errors.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
export const oracleScope = () => ({ employeeId: "1", orgUnitId: "J01",
  rangeStart: "2027-01-03T00:00:00", rangeEnd: "2027-01-10T00:00:00" });
const column = (name: string, kind: ShiftOracleColumn["kind"], nullable = true): ShiftOracleColumn =>
  ({ name, kind, nullable, dataLength: kind === "date" ? 7 : kind === "number" ? 22 : 500,
    charUsed: kind === "text" ? "B" : null, defaultSql: null });
export function oracleManagementSchema(): ShiftOracleSchema {
  return {
    SHF_EMPLOYEES: [column("EMPLOYEE_ID", "number", false), column("EMP_ID_NUMBER", "text", false),
      column("FIRST_NAME", "text"), column("LAST_NAME", "text"), column("ORG_UNIT_ID", "text", false),
      column("STATUS_ID", "number"), column("WORK_FROM_HOME", "text")],
    SHF_EMPLOYEE_DAY: [
      column("SHF_EMPLOYEE_DAY_ID", "number", false), column("WM_DATE", "date", false),
      column("WM_DAY_TYPE", "number", false), column("EMP_ID_NUMBER", "text"), column("SOURCE", "text"),
      column("WM_SCH_ACTIVITY_ID_DATA", "text"), column("WM_START_DATETIME", "date"),
      column("WM_END_DATETIME", "date"), column("WM_SHIFT_START_DATETIME", "date"), column("WM_SHIFT_END_DATETIME", "date"),
      column("WM_SITE_ID", "number", false), column("WM_PAID_MINUTES", "number", false),
      column("WM_WORK_MINUTES", "number", false), column("REMARK", "text"),
      column("WORK_FROM_HOME", "text", false), column("SPLIT_SHIFT", "text", false),
      column("WM_SCHEDULE_DAY_ID", "number"), column("WM_EXCEPTION_TYPE_ID", "number"), column("WM_TIMEOFF_TYPE_ID", "number"),
    ],
    SHF_DAY_CHANGES: [column("SHF_EMPLOYEE_DAY_ID", "number", false),
      ...["NEW_DAY_START", "NEW_SHIFT_START", "NEW_DAY_END", "NEW_SHIFT_END", "MODIFICATION_TIME"]
        .map(name => column(name, "date")),
      ...["NEW_DAY_TYPE", "NEW_SITE_ID", "NEW_PAID_MINUTES", "NEW_WORK_MINUTES", "NEW_EXCEPTION_TYPE_ID",
        "NEW_TIMEOFF_TYPE_ID", "START_CHANGE_REASON", "END_CHANGE_REASON"].map(name => column(name, "number")),
      ...["NEW_EMPLOYEE_ID", "NEW_ACTIVITY", "MODIFICATION_USER", "CANCEL_REASON_CODE", "CANCEL_REASON_REMARK"]
        .map(name => column(name, "text")),
      column("NEW_WORK_FROM_HOME", "text", false), column("NEW_SPLIT_SHIFT", "text", false),
      column("NEW_POOL_ERR", "text")],
    SHF_ATTENDANCE: [column("SHF_EMPLOYEE_DAY_ID", "number", false), column("STAGE_ARRIVAL_TIME", "date"),
      column("STATION_ARRIVAL_TIME", "date"), column("STATION_EXIT_TIME", "date"), column("LATE_REMARK", "text")],
  };
}
export function oracleEmployee(): ShiftOracleRow {
  return { EMPLOYEE_ID: "1", EMP_ID_NUMBER: "001234567", FIRST_NAME: "בדיקה",
    LAST_NAME: "סינתטית", ORG_UNIT_ID: "J01", STATUS_ID: "3", WORK_FROM_HOME: "1" };
}
export function oracleBaseline(): ShiftOracleRow {
  return { SHF_EMPLOYEE_DAY_ID: "7", WM_DATE: "2027-01-04T00:00:00", WM_DAY_TYPE: "4",
    EMP_ID_NUMBER: "00123456", SOURCE: "WFM", WM_SCH_ACTIVITY_ID_DATA: "1",
    WM_START_DATETIME: "2027-01-04T09:00:00", WM_END_DATETIME: "2027-01-04T10:00:00",
    WM_SHIFT_START_DATETIME: "2027-01-04T09:00:00", WM_SHIFT_END_DATETIME: "2027-01-04T10:00:00",
    WM_SITE_ID: "1", WM_PAID_MINUTES: "60", WM_WORK_MINUTES: "60", REMARK: null,
    WORK_FROM_HOME: "N", SPLIT_SHIFT: "N", WM_SCHEDULE_DAY_ID: null,
    WM_EXCEPTION_TYPE_ID: null, WM_TIMEOFF_TYPE_ID: null };
}
function physicalOverlay(overlay: ShiftOverlay): ShiftOracleRow {
  return {
    SHF_EMPLOYEE_DAY_ID: "7", NEW_EMPLOYEE_ID: overlay.employeeNumber, NEW_DAY_TYPE: overlay.dayType,
    NEW_DAY_START: overlay.dayStartLocal, NEW_DAY_END: overlay.dayEndLocal,
    NEW_SHIFT_START: overlay.startLocal, NEW_SHIFT_END: overlay.endLocal, NEW_ACTIVITY: overlay.activityCode,
    NEW_SITE_ID: overlay.siteId, NEW_PAID_MINUTES: overlay.paidMinutes, NEW_WORK_MINUTES: overlay.workMinutes,
    NEW_WORK_FROM_HOME: overlay.workFromHome, NEW_SPLIT_SHIFT: overlay.splitShift,
    NEW_EXCEPTION_TYPE_ID: overlay.exceptionType, NEW_TIMEOFF_TYPE_ID: overlay.timeoffType,
    START_CHANGE_REASON: overlay.startReasonCode, END_CHANGE_REASON: overlay.endReasonCode,
    CANCEL_REASON_CODE: overlay.cancelReasonCode, CANCEL_REASON_REMARK: overlay.cancelRemark,
    MODIFICATION_TIME: overlay.modificationLocal, MODIFICATION_USER: overlay.modificationUser, NEW_POOL_ERR: null,
  };
}
export function nativeProtocolFixture(kind: ShiftOperationKindV1 = "csv-create", existingOverlay = false,
  extraDayIds: string[] = []) {
  const reference: Extract<ShiftAdmissionReferenceV1, { mode: "test-oracle-controlled" }> = {
    namespace: "shift-management-v0.1", identityRevision: "isolated-oracle-protocol-identity",
    operatorScopeRevision: "isolated-oracle-protocol-scope", mode: "test-oracle-controlled",
    dataSource: "oracle-test", metadata: { provider: "dba-v1", certificate: "a".repeat(64) },
  };
  const snapshot = managementFixtureSnapshot(); snapshot.reference = reference;
  const originalDay: ShiftBaseline = { shiftDayId: "7", employeeNumber: "00123456",
    dateLocal: "2027-01-04T00:00:00", dayType: "4", startLocal: "2027-01-04T09:00:00",
    endLocal: "2027-01-04T10:00:00", dayStartLocal: "2027-01-04T09:00:00", dayEndLocal: "2027-01-04T10:00:00",
    activityCode: "1", siteId: "1", paidMinutes: "60", workMinutes: "60", workFromHome: "N", splitShift: "N",
    switchDayId: null, exceptionType: null, timeoffType: null, source: "WFM", remark: null,
    preserved: { WM_SCHEDULE_DAY_ID: null } };
  if (kind === "change" || kind === "cancel") snapshot.days.push({ baseline: originalDay, overlay: null, attendance: null });
  if (existingOverlay && snapshot.days[0]) {
    snapshot.days[0].overlay = {
      employeeNumber: "00123456", dayType: "4", startLocal: null, endLocal: null,
      dayStartLocal: null, dayEndLocal: null, activityCode: "1", siteId: "1",
      paidMinutes: null, workMinutes: null, workFromHome: "N", splitShift: "N",
      exceptionType: null, timeoffType: null, startReasonCode: null, endReasonCode: null,
      cancelReasonCode: null, cancelRemark: null, modificationLocal: new Date().toISOString().slice(0, 19),
      modificationUser: managementPrincipal().subject, preserved: { NEW_POOL_ERR: null },
    };
  }
  for (let i = 0; i < extraDayIds.length; i++) {
    const date = `2027-01-${String(8 + i).padStart(2, "0")}`;
    snapshot.days.push({ baseline: { ...originalDay, shiftDayId: extraDayIds[i],
      dateLocal: date + "T00:00:00", startLocal: date + "T09:00:00", endLocal: date + "T10:00:00",
      dayStartLocal: date + "T09:00:00", dayEndLocal: date + "T10:00:00" }, overlay: null, attendance: null });
  }
  const entries = kind === "csv-create" ? [
    { row: 2, draft: { ...createDraft(), startLocal: "2027-01-05T09:00:00", endLocal: "2027-01-05T10:00:00" }, overnight: false },
    { row: 3, draft: { ...createDraft(), startLocal: "2027-01-06T09:00:00", endLocal: "2027-01-06T10:00:00" }, overnight: false },
  ] : kind === "create" ? [{ row: 1, draft: createDraft(), overnight: false }] :
    kind === "change" ? [{ row: 1, draft: { kind: "change" as const, shiftDayId: "7",
      startLocal: originalDay.startLocal, endLocal: originalDay.endLocal, activityCode: "2",
      workLocation: "site" as const, startReasonCode: null, endReasonCode: null }, overnight: false }] :
      [{ row: 1, draft: { kind: "cancel" as const, shiftDayId: "7", reasonCode: "C1", remark: "סינתטי" }, overnight: false }];
  const domainPlan = planShifts(snapshot, entries, managementPrincipal(), new Date("2027-01-01T00:00:00Z"), "UTC");
  const plan: ShiftAdmissionPlanV1 = { reference, kind, employeeId: "1", principal: managementPrincipal(),
    authGeneration: "isolated-protocol-auth", authorizedTeamIds: ["J01"], planDigest: fingerprint({ snapshot, plan: domainPlan, zone: "UTC" }),
    snapshotRevision: fingerprint(snapshot), expiresAt: new Date(Date.now() + 30000).toISOString(), effects: domainPlan.effects };
  const handle: ShiftConsumedAdmissionV1 = { reference, kind, employeeId: "1",
    commandId: "00000000-0000-4000-8000-000000000001", planDigest: plan.planDigest,
    attemptHandle: "isolated-process-owned-protocol-handle" };
  const schema = oracleManagementSchema();
  let committedCore: ShiftOracleCore = { employee: oracleEmployee(), prefixEmployees: [{ EMPLOYEE_ID: "1" }],
    days: snapshot.days.map(day => ({ ...oracleBaseline(), SHF_EMPLOYEE_DAY_ID: day.baseline.shiftDayId,
      WM_DATE: day.baseline.dateLocal, WM_START_DATETIME: day.baseline.dayStartLocal,
      WM_END_DATETIME: day.baseline.dayEndLocal, WM_SHIFT_START_DATETIME: day.baseline.startLocal,
      WM_SHIFT_END_DATETIME: day.baseline.endLocal })),
    overlays: snapshot.days[0]?.overlay ? [physicalOverlay(snapshot.days[0].overlay)] : [], attendance: [] };
  let staged = structuredClone(committedCore), nextId = 8n, inserts = 0, active = 0;
  const events: string[] = [], statements: Array<{ sql: string; binds: Record<string, unknown> }> = [];
  const faults: { insert2: boolean; count: number | undefined; commitAck: boolean; rollback: boolean;
    close: boolean; proof: boolean; acquire: boolean; duplicateId: boolean; overflowId: boolean } =
    { insert2: false, count: 1, commitAck: false, rollback: false,
    close: false, proof: false, acquire: false, duplicateId: false, overflowId: false };
  let gate: (() => Promise<void>) | undefined, breakGate: (() => Promise<void>) | undefined;
  let commits = 0, rollbacks = 0, closed = 0, breaks = 0, sequenceCalls = 0;
  const connection: NativeConnection = {
    callTimeout: 0,
    async execute(sql, input) {
      if (!record(input)) throw Error("Isolated protocol expects named binds");
      const binds = input; statements.push({ sql, binds: structuredClone(binds) });
      if (sql.includes("isolated:management-proof")) { events.push("proof"); return { rows: [{ observed: "1" }] }; }
      if (sql.includes("shf49:lock:employee")) { events.push("employee-lock"); return { rows: [{ key: "1" }] }; }
      if (sql.includes("shf49:lock:day")) { events.push(`day-lock:${String(binds.dayId)}`); return { rows: [{ key: binds.dayId }] }; }
      if (sql.includes("shf49:employee")) return { rows: [staged.employee] };
      if (sql.includes("shf49:prefix")) return { rows: staged.prefixEmployees };
      if (sql.includes("shf49:days")) return { rows: staged.days };
      if (sql.includes("shf49:overlays")) return { rows: staged.overlays };
      if (sql.includes("shf49:attendance")) return { rows: staged.attendance };
      if (sql.includes("shf49:sequence")) {
        events.push("sequence"); sequenceCalls++;
        return { rows: [{ dayId: faults.overflowId ? "10000000000" : faults.duplicateId ? "8" : String(nextId++) }] };
      }
      active++; events.push("sql-start");
      try {
        await gate?.();
        const inserted = /^INSERT INTO SHIFTER\.(SHF_EMPLOYEE_DAY|SHF_DAY_CHANGES) \(([^)]+)\)/.exec(sql);
        const stringBind = (key: string) => {
          const value = binds[key]; if (!(value === null || typeof value === "string")) throw Error("Isolated invalid bind");
          return value;
        };
        if (inserted) {
          if (inserted[1] === "SHF_EMPLOYEE_DAY" && ++inserts === 2 && faults.insert2) throw Error("Isolated second INSERT failure");
          if (inserted[1] === "SHF_DAY_CHANGES" && binds.w_source !== staged.days[0]?.SOURCE)
            return { rowsAffected: 0 }; // Catches stale original WFM after OWN markSource.
          const table = inserted[1] === "SHF_EMPLOYEE_DAY" ? schema.SHF_EMPLOYEE_DAY : schema.SHF_DAY_CHANGES;
          const row: ShiftOracleRow = {};
          const names = inserted[2].split(",");
          names.forEach((name, i) => { row[name] = stringBind(`v${i}`); });
          for (const column of table) if (!Object.hasOwn(row, column.name)) row[column.name] = shiftOracleStaticDefault(column);
          (inserted[1] === "SHF_EMPLOYEE_DAY" ? staged.days : staged.overlays).push(row);
          events.push(inserted[1] === "SHF_EMPLOYEE_DAY" ? "insert-day" : "insert-overlay");
          return { rowsAffected: faults.count };
        }
        if (sql.startsWith("UPDATE SHIFTER.SHF_EMPLOYEE_DAY SET SOURCE")) {
          const row = staged.days.find(row => row.SHF_EMPLOYEE_DAY_ID === binds.dayId);
          if (!row || row.SOURCE !== binds.w_source) return { rowsAffected: 0 };
          row.SOURCE = stringBind("newSource"); events.push("mark-source"); return { rowsAffected: faults.count };
        }
        if (sql.startsWith("UPDATE SHIFTER.SHF_DAY_CHANGES")) {
          const row = staged.overlays.find(row => row.SHF_EMPLOYEE_DAY_ID === binds.targetDay);
          if (!row) return { rowsAffected: 0 };
          const set = sql.split("WHERE")[0];
          for (const match of set.matchAll(/([A-Z_]+)=(?:TO_(?:DATE|NUMBER)\()?:([a-z][0-9]+)/g))
            row[match[1]] = stringBind(match[2]);
          events.push("update-overlay"); return { rowsAffected: faults.count };
        }
        throw Error("Unexpected isolated native SQL");
      } finally { active--; events.push("sql-settled"); }
    },
    async commit() {
      events.push("commit"); commits++; committedCore = structuredClone(staged);
      if (faults.commitAck) throw Error("Isolated COMMIT acknowledgment lost");
    },
    async rollback() { assertNotActive(); events.push("rollback"); rollbacks++; if (faults.rollback) throw Error("Isolated rollback failure"); staged = structuredClone(committedCore); },
    async break() { events.push("break"); breaks++; await breakGate?.(); events.push("break-settled"); },
    async close(drop) { assertNotActive(); events.push(drop ? "drop" : "close"); closed++; if (faults.close) throw Error("Isolated close failure"); },
  };
  function assertNotActive() { if (active) throw Error("Unsafe isolated cleanup while SQL pending"); }
  const pool: NativePool = { async getConnection() {
    events.push("acquire"); if (faults.acquire) throw Error("Isolated acquire failure");
    staged = structuredClone(committedCore); return connection;
  }, async close() {} };
  const evidence: ShiftOracleEvidence = { operation: "native-shift-management-v0.1", reference,
    async assertConnection(q) {
      await q("SELECT /* isolated:management-proof */ 1 AS \"observed\" FROM dual", {}, 1);
      return { operation: "native-shift-management-v0.1",
        reference: faults.proof ? { ...reference, identityRevision: "WRONG-ISOLATED-PROOF" } : reference };
    },
    async inspect(q, selection, signal) {
      const core = await readShiftOracleWindow(q, schema, selection, oracleScope(), signal);
      return { core, snapshot: structuredClone(snapshot), schema };
    },
    membershipGuard(current) {
      return { sql: `NOT EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_REPORTS p
        WHERE p.EMPLOYEE_ID=TO_NUMBER(:w_employee) AND p.APPROVED_TIME IS NULL)
        AND (SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_DAY membership
          WHERE membership.EMP_ID_NUMBER=:w_prefix
            AND membership.WM_SHIFT_START_DATETIME<TO_DATE(:w_end,'YYYY-MM-DD"T"HH24:MI:SS')
            AND membership.WM_SHIFT_END_DATETIME>TO_DATE(:w_start,'YYYY-MM-DD"T"HH24:MI:SS'))=TO_NUMBER(:w_count)
        AND (:w_source IS NULL OR EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_DAY owned
          WHERE owned.SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:w_existing_day) AND owned.SOURCE=:w_source))`,
      binds: { w_employee: "1", w_source: current.core.days[0]?.SOURCE ?? null,
        w_existing_day: current.core.days[0]?.SHF_EMPLOYEE_DAY_ID ?? null, w_count: String(current.core.days.length),
        w_prefix: "00123456", w_start: oracleScope().rangeStart, w_end: oracleScope().rangeEnd } };
    },
  };
  const authority: ShiftOracleAuthority = { reference, planFor(attempt) {
    if (attempt !== handle) shiftFail("STALE_PREPARATION"); return plan;
  } };
  const scope = { employeeId: "1", orgUnitId: "J01", businessTimeZone: "UTC",
    windowStart: new Date(Date.now() - 60000).toISOString(), windowEnd: new Date(Date.now() + 60000).toISOString(),
    writerExclusion: { confirmed: true as const, owner: "ISOLATED-PROTOCOL-DOUBLE" }, maximumRows: domainPlan.effects.length };
  const uow = new OracleShiftManagementUow(pool, evidence, authority, scope);
  const selection = { employeeId: "1", shiftDayId: kind === "change" || kind === "cancel" ? "7" : null, admission: handle };
  const work: Parameters<OracleShiftManagementUow["run"]>[1] = async locked => {
    const current = await locked.readLockedSnapshot(), effects: ShiftRecordedEffectV1[] = [];
    for (let i = 0; i < domainPlan.entries.length; i++) {
      const entry = domainPlan.entries[i], effect = domainPlan.effects[i], draft = entry.draft;
      if (draft.kind === "create") {
        const id = await locked.nextDayId();
        const day: ShiftBaseline = { ...originalDay, shiftDayId: id, dateLocal: draft.startLocal.slice(0, 10) + "T00:00:00",
          startLocal: draft.startLocal, endLocal: draft.endLocal, dayStartLocal: draft.startLocal, dayEndLocal: draft.endLocal,
          source: "fExtra", remark: draft.remark };
        await locked.insertDay({ day }); effects.push({ ...effect, after: { ...effect.after, shiftDayId: id } });
      } else {
        const day = current.days[0];
        if (day.baseline.source === "WFM") await locked.markSource({ dayId: "7", original: day.baseline, from: "WFM", to: "SHF" });
        const after = changedOverlay(day, draft, effect, managementPrincipal().subject, new Date(), "UTC");
        const overlayPlan = { dayId: "7", before: day.overlay, after };
        if (day.overlay === null) await locked.insertOverlay(overlayPlan);
        else await locked.updateOverlay(overlayPlan);
        effects.push({ ...effect, after: { ...effect.after, shiftDayId: "7" } });
      }
    }
    return effects;
  };
  const run = (signal?: AbortSignal) => uow.run(selection, work, signal);
  return { uow, run, work, pool, evidence, authority, scope, handle, plan, snapshot, schema, selection, faults,
    events, statements, pauseSql(value: typeof gate) { gate = value; }, pauseBreak(value: typeof breakGate) { breakGate = value; },
    inspect: () => ({ core: structuredClone(committedCore), commits, rollbacks, closed, breaks, sequenceCalls, active }) };
}
