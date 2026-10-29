// Native transaction kernel only. No pool creation, default evidence provider,
// allowance provisioning, environment loader or fixture/native fallback.
import type { NativeConnection, NativePool } from "./oracle-stage-arrival-uow.mts";
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import type { ShiftAdmissionPlanV1, ShiftAdmissionReferenceV1, ShiftCommandUnitOfWork,
  ShiftConsumedAdmissionV1, ShiftRecordedEffectV1, ShiftSelectionV1, ShiftTransactionAcknowledgmentV1 } from "./shift-management-contracts.mts";
import type { ShiftLockedWork } from "./shift-management-contracts.mts";
import type { ShiftCreatePlan, ShiftOverlayPlan, ShiftSnapshot, ShiftSourcePlan } from "./shift-management-model.mts";
import { freezeShift, validateShiftSnapshot } from "./shift-management-model.mts";
import type { ShiftOracleCore, ShiftOracleSchema, ShiftOracleStatement } from "./oracle-shift-management-sql.mts";
import { guardedShiftOracleInsert, shiftOracleInsertDay, shiftOracleMarkSource, shiftOracleOverlay,
  validateShiftOracleSchema } from "./oracle-shift-management-sql.mts";
import { validateShiftOracleInsertability, validateShiftOracleCoreProjection } from "./oracle-shift-management-sql.mts";
import { effectiveShift } from "./shift-management-rules.mts";
import { ShiftManagementError, ShiftUowRejection, shiftAfterRollback, shiftFail, shiftUnknown } from "./shift-management-errors.mts";
import { decimalId, record, text } from "./contract-validation.mts";
import { same, fingerprint, instantFor } from "./stage-arrival-domain.mts";
import { currentRequestBudget } from "./request-budget-context.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { shiftManagementAccessPolicy } from "./access-policy.mts";
import { requireShiftTextFits, shiftTextByteLength } from "./shift-management-text.mts";
import { exact } from "./stage-arrival-validation.mts";
import { unitCode } from "./current-shifts-validation.mts";

type NativeReference = Extract<ShiftAdmissionReferenceV1, { mode: "test-oracle-controlled" }>;
export interface ShiftOracleInspection { snapshot: ShiftSnapshot; core: ShiftOracleCore; schema: ShiftOracleSchema }
export interface ShiftOracleEvidence {
  readonly operation: "native-shift-management-v0.1";
  readonly reference: Readonly<NativeReference>;
  // Required actual identity/metadata/sequence proof, never a default "safe".
  assertConnection(query: NativeQuery, signal?: AbortSignal): Promise<{
    operation: "native-shift-management-v0.1"; reference: Readonly<NativeReference>;
  }>;
  inspect(query: NativeQuery, selection: ShiftSelectionV1, signal?: AbortSignal): Promise<ShiftOracleInspection>;
  // Private adapter-owned membership/absence witnesses for the scoped window,
  // policies/catalog/dependents. Caller input/HTTP never supplies SQL.
  membershipGuard(current: ShiftOracleInspection): { sql: string; binds: Record<string, string | null> };
}
export interface ShiftOracleAuthority {
  readonly reference: Readonly<NativeReference>;
  // Synchronous process-owned handle check, backed by consumed durable native
  // authority. No implementation/default is manufactured in this kernel.
  planFor(attempt: ShiftConsumedAdmissionV1): Readonly<ShiftAdmissionPlanV1>;
}
export interface ShiftOracleExecutionScope {
  employeeId: string; orgUnitId: string; windowStart: string; windowEnd: string;
  businessTimeZone: string;
  writerExclusion: { confirmed: true; owner: string };
  maximumRows: number;
}
function mapped(error: unknown): ShiftManagementError {
  if (error instanceof ShiftManagementError) return error;
  const code = record(error) && typeof error.code === "string" ? error.code : "";
  return new ShiftManagementError(code === "ORA-00054" ?
    { status: 409, code: "COMMAND_IN_PROGRESS", effect: "none", nextAction: "stop" } :
    ["ORA-01013", "DPI-1067", "NJS-040"].includes(code) ?
      { status: 503, code: "DEPENDENCY_TIMEOUT", effect: "none", nextAction: "stop" } :
      { status: 503, code: "DEPENDENCY_UNAVAILABLE", effect: "none", nextAction: "stop" });
}
export class OracleShiftManagementUow implements ShiftCommandUnitOfWork<
  ShiftSnapshot, ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan> {
  readonly reference: Readonly<NativeReference>;
  private readonly pool: NativePool;
  private readonly evidence: ShiftOracleEvidence;
  private readonly authority: ShiftOracleAuthority;
  private readonly scope: Readonly<ShiftOracleExecutionScope>;
  constructor(pool: NativePool, evidence: ShiftOracleEvidence, authority: ShiftOracleAuthority,
    scope: ShiftOracleExecutionScope) {
    const r = evidence.reference;
    if (r.mode !== "test-oracle-controlled" || r.dataSource !== "oracle-test" ||
        r.namespace !== "shift-management-v0.1" || !r.metadata ||
        !/^[0-9a-f]{64}$/.test(r.metadata.certificate) || !text(r.identityRevision, 128, 1) ||
        !text(r.operatorScopeRevision, 128, 1) || evidence.operation !== "native-shift-management-v0.1" ||
        !same(r, authority.reference) || !decimalId(scope.employeeId) ||
        !unitCode(scope.orgUnitId) || !text(scope.businessTimeZone, 128, 1) ||
        !/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)*$/.test(scope.businessTimeZone) || !scope.writerExclusion ||
        scope.writerExclusion.confirmed !== true || !text(scope.writerExclusion.owner, 128, 1) ||
        !Number.isInteger(scope.maximumRows) || scope.maximumRows < 1 || scope.maximumRows > 100 ||
        !Number.isFinite(Date.parse(scope.windowStart)) || !Number.isFinite(Date.parse(scope.windowEnd)) ||
        Date.parse(scope.windowStart) >= Date.parse(scope.windowEnd))
      throw Error("Exact native management execution scope required");
    const metadata = r.metadata;
    if (metadata.provider === "owner-test-limited-v1") {
      if (!exact(metadata, ["provider", "certificate", "waiverId", "unavailable"]) ||
          metadata.waiverId !== "shf-test-dba-two-view-waiver-20261028-v0.1" ||
          !same(metadata.unavailable, ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"]))
        throw Error("Exact limited management metadata reference required");
    } else if (!exact(metadata, ["provider", "certificate"]) ||
        metadata.provider !== "dba-v1" && metadata.provider !== "owner-hybrid-v1")
      throw Error("Exact supported management metadata reference required");
    for (const instant of [scope.windowStart, scope.windowEnd])
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(instant) ||
          new Date(instant).toISOString() !== instant) throw Error("Exact management UTC execution window required");
    new Intl.DateTimeFormat("en", { timeZone: scope.businessTimeZone });
    this.reference = freezeShift(structuredClone(r)); this.pool = pool; this.evidence = evidence;
    this.authority = authority; this.scope = freezeShift(structuredClone(scope));
  }
  async run(selection: ShiftSelectionV1 & { admission: ShiftConsumedAdmissionV1 },
    work: Parameters<ShiftCommandUnitOfWork<ShiftSnapshot, ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan>["run"]>[1],
    signal?: AbortSignal): Promise<ShiftTransactionAcknowledgmentV1> {
    const ambient = currentRequestBudget();
    const executionZone = this.scope.businessTimeZone;
    const deadline = Math.min(ambient?.deadline ?? Infinity, performance.now() + 5000);
    let c: NativeConnection | undefined, active = false, cancelled = false, unsafe = false;
    let attempted = false, commitAttempted = false, committed = false, closing = false;
    let result: ShiftTransactionAcknowledgmentV1 | undefined, primary: ShiftManagementError | undefined;
    const breaks: Promise<void>[] = [];
    const pending = new Set<Promise<unknown>>();
    const plan = freezeShift(structuredClone(this.authority.planFor(selection.admission)));
    const policy = shiftManagementAccessPolicy("test-oracle-controlled");
    policy.requireCommand(plan.principal, plan.kind);
    if (!same(policy.authorizedTeamIds(plan.principal), plan.authorizedTeamIds)) shiftFail("UNAUTHENTICATED");
    const guard = () => {
      assertShiftWorkAllowed(signal);
      if (closing) shiftFail("STALE_PREPARATION");
      if (cancelled || performance.now() >= deadline) shiftFail("DEPENDENCY_TIMEOUT");
      const now = Date.now();
      if (now < Date.parse(this.scope.windowStart) || now >= Date.parse(this.scope.windowEnd))
        shiftFail("LIVE_WRITES_DISABLED");
      if (!same(this.reference, this.evidence.reference) || !same(this.reference, this.authority.reference) ||
          !same(selection.admission.reference, this.reference) || !same(plan, this.authority.planFor(selection.admission)) ||
          !same(plan.reference, this.reference) || plan.planDigest !== selection.admission.planDigest ||
          plan.kind !== selection.admission.kind || plan.employeeId !== selection.employeeId ||
          selection.admission.employeeId !== selection.employeeId ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(selection.admission.commandId) ||
          selection.employeeId !== this.scope.employeeId || !plan.authorizedTeamIds.includes(this.scope.orgUnitId) ||
          plan.effects.length < 1 || plan.effects.length > this.scope.maximumRows ||
          !Number.isFinite(Date.parse(plan.expiresAt)) || Date.parse(plan.expiresAt) <= now ||
          Date.parse(plan.expiresAt) > Date.parse(this.scope.windowEnd)) shiftFail("STALE_PREPARATION");
    };
    const abort = () => {
      if (cancelled) return; cancelled = true;
      if (active && c) {
        try { breaks.push(c.break().catch(() => { unsafe = true; })); }
        catch { unsafe = true; }
      }
    };
    signal?.addEventListener("abort", abort, { once: true });
    ambient?.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, Math.max(1, deadline - performance.now())); timer.unref();
    const observe = <T,>(running: Promise<T>): Promise<T> => {
      pending.add(running);
      void running.then(() => pending.delete(running), () => pending.delete(running));
      return running;
    };
    const op = <T,>(invoke: () => Promise<T>): Promise<T> => {
      const running = (async () => {
        guard(); if (!c) shiftFail("DEPENDENCY_UNAVAILABLE");
        if (active) shiftFail("INVALID_SOURCE_DATA");
        c.callTimeout = Math.max(1, Math.ceil(deadline - performance.now())); active = true;
        try { const value = await invoke(); guard(); return value; }
        finally { active = false; }
      })();
      return observe(running);
    };
    const rows = async (sql: string, binds: Record<string, string | null>, bound: number, effect = false) => {
      const lease = c; if (!lease) shiftFail("DEPENDENCY_UNAVAILABLE");
      const r = await op(() => { guard(); if (effect) attempted = true; return lease.execute(sql, binds, bound); });
      if (!Array.isArray(r.rows) || r.rows.length > bound) shiftFail("INVALID_SOURCE_DATA");
      return r.rows;
    };
    const query: NativeQuery = async (sql, binds, bound) => {
      if (!/^\s*(?:SELECT|WITH)\b/i.test(sql) || /\b(?:NEXTVAL|FOR\s+UPDATE|INSERT|DELETE|UPDATE|MERGE)\b/i.test(sql) ||
          !Number.isInteger(bound) || bound < 1 || bound > 1001) shiftFail("INVALID_SOURCE_DATA");
      const lease = c; if (!lease) shiftFail("DEPENDENCY_UNAVAILABLE");
      const r = await op(() => lease.execute(sql, binds, bound));
      if (!Array.isArray(r.rows) || r.rows.length > bound) shiftFail("INVALID_SOURCE_DATA");
      return r.rows;
    };
    try {
      guard(); c = await this.pool.getConnection(); guard();
      const proof = await this.evidence.assertConnection(query, signal);
      if (proof.operation !== "native-shift-management-v0.1" || !same(proof.reference, this.reference))
        shiftFail("LIVE_WRITES_DISABLED");
      const employeeLock = await rows(`SELECT /* shf49:lock:employee */ TO_CHAR(EMPLOYEE_ID,'TM9') AS "key"
        FROM SHIFTER.SHF_EMPLOYEES WHERE EMPLOYEE_ID=TO_NUMBER(:employeeId)
          AND ORG_UNIT_ID=:orgUnitId FOR UPDATE NOWAIT`,
      { employeeId: selection.employeeId, orgUnitId: this.scope.orgUnitId }, 2);
      if (employeeLock.length !== 1 || !record(employeeLock[0]) || employeeLock[0].key !== selection.employeeId)
        shiftFail(employeeLock.length ? "INVALID_SOURCE_DATA" : "SHIFT_DAY_NOT_FOUND");
      const inspect = async () => {
        const inspection = await this.evidence.inspect(query, selection, signal);
        validateShiftSnapshot(inspection.snapshot, this.reference, selection.employeeId);
        validateShiftOracleSchema(inspection.schema);
        validateShiftOracleCoreProjection(inspection.snapshot, inspection.core);
        if (inspection.snapshot.employee.orgUnitId !== this.scope.orgUnitId ||
            inspection.core.employee.EMPLOYEE_ID !== selection.employeeId) shiftFail("SHIFT_DAY_NOT_FOUND");
        return structuredClone(inspection);
      };
      const before = await inspect();
      const ids = before.core.days.map(day => day.SHF_EMPLOYEE_DAY_ID);
      if (ids.some(id => !decimalId(id, 10)) || new Set(ids).size !== ids.length) shiftFail("INVALID_SOURCE_DATA");
      const orderedIds = ids.filter((id): id is string => typeof id === "string")
        .sort((a, b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0);
      for (const id of orderedIds) {
        const locked = await rows(`SELECT /* shf49:lock:day */ TO_CHAR(SHF_EMPLOYEE_DAY_ID,'TM9') AS "key"
          FROM SHIFTER.SHF_EMPLOYEE_DAY WHERE SHF_EMPLOYEE_DAY_ID=TO_NUMBER(:dayId) FOR UPDATE NOWAIT`, { dayId: id }, 2);
        if (locked.length !== 1 || !record(locked[0]) || locked[0].key !== id) shiftFail("STALE_PREPARATION");
      }
      const current = await inspect();
      if (!same(current, before) || fingerprint(current.snapshot) !== plan.snapshotRevision) shiftFail("STALE_PREPARATION");
      const insertTable = plan.kind === "create" || plan.kind === "csv-create" ? "SHF_EMPLOYEE_DAY" :
        !current.core.overlays.some(row => row.SHF_EMPLOYEE_DAY_ID === selection.shiftDayId) ? "SHF_DAY_CHANGES" : null;
      if (insertTable) {
        const defaults = validateShiftOracleInsertability(current.schema, insertTable);
        for (const column of current.schema[insertTable]) {
          const value = defaults[column.name];
          if (!Object.hasOwn(defaults, column.name) || value === null || column.kind !== "text") continue;
          const bytes = shiftTextByteLength(value, current.snapshot.textStorage.charset);
          if (bytes === null || bytes > column.dataLength) shiftFail("LIVE_WRITES_DISABLED");
        }
      }
      let callbackClosed = false, read = false, nextEffect = 0;
      const allocations = new Set<string>(), written = new Set<string>(), recorded: ShiftRecordedEffectV1[] = [];
      const frameGuard = () => { guard(); if (callbackClosed || !read) shiftFail("STALE_PREPARATION"); };
      const mutate = async (statement: ShiftOracleStatement): Promise<number> => {
        const lease = c; if (!lease) shiftFail("DEPENDENCY_UNAVAILABLE");
        if (Buffer.byteLength(statement.sql) > 262144) shiftFail("DEPENDENCY_UNAVAILABLE");
        const r = await op(() => { frameGuard(); attempted = true; return lease.execute(statement.sql, statement.binds, 1); });
        if (r.rowsAffected === 0) shiftFail("STALE_PREPARATION");
        if (r.rowsAffected !== 1) shiftFail("INVALID_SOURCE_DATA");
        return r.rowsAffected;
      };
      const witnesses = () => {
        frameGuard();
        const witness = this.evidence.membershipGuard(current);
        if (!witness.sql || /;|\b(?:NEXTVAL|INSERT|UPDATE|DELETE|MERGE)\b/i.test(witness.sql))
          shiftFail("INVALID_SOURCE_DATA");
        return witness;
      };
      const expectedEffect = () => {
        const effect = plan.effects[nextEffect];
        if (!effect) shiftFail("INVALID_SOURCE_DATA");
        return effect;
      };
      try {
        const methods: ShiftLockedWork<ShiftSnapshot, ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan> = {
          async readLockedSnapshot() { guard(); if (callbackClosed) shiftFail("STALE_PREPARATION"); read = true; return structuredClone(current.snapshot); },
          nextDayId: async () => {
            frameGuard();
            if (!["create", "csv-create"].includes(plan.kind) || allocations.size >= plan.effects.length)
              shiftFail("INVALID_SOURCE_DATA");
            const result = await rows(`SELECT /* shf49:sequence */ TO_CHAR(SHIFTER.SHF_AGENT_DAY_ID.NEXTVAL,
              'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "dayId" FROM dual`, {}, 1, true);
            const row = result[0];
            if (result.length !== 1 || !record(row) || !decimalId(row.dayId, 10))
              shiftFail("INVALID_SOURCE_DATA");
            const id = row.dayId;
            if (allocations.has(id) || current.core.days.some(day => day.SHF_EMPLOYEE_DAY_ID === id))
              shiftFail("INVALID_SOURCE_DATA");
            allocations.add(id); return id;
          },
          insertDay: async create => {
            frameGuard(); const effect = expectedEffect(), id = create.day.shiftDayId;
            if (!["create", "csv-create"].includes(plan.kind) || !allocations.has(id) || written.has(id) ||
                effect.before !== null || effect.after.shiftDayId !== null) shiftFail("INVALID_SOURCE_DATA");
            const state = { shiftDayId: id, status: "scheduled" as const, startLocal: create.day.startLocal,
              endLocal: create.day.endLocal, activityCode: create.day.activityCode, siteId: create.day.siteId,
              workLocation: create.day.workFromHome === "Y" ? "home" as const : "site" as const,
              paidMinutes: create.day.paidMinutes, workMinutes: create.day.workMinutes, source: create.day.source };
            if (!same({ ...state, shiftDayId: null }, effect.after)) shiftFail("STALE_PREPARATION");
            requireShiftTextFits(create.day.remark, Math.min(500, current.snapshot.textStorage.remarkBytes),
              current.snapshot.textStorage.charset, "remark");
            const witness = witnesses();
            const statement = guardedShiftOracleInsert(shiftOracleInsertDay(current.schema, create),
              current.schema, current.core, witness.sql, witness.binds);
            const count = await mutate(statement);
            current.core.days.push(statement.after);
            current.snapshot.days.push({ baseline: structuredClone(create.day), overlay: null, attendance: null });
            recorded.push({ ...effect, after: state }); written.add(id); nextEffect++; return count;
          },
          markSource: async source => {
            frameGuard(); const effect = expectedEffect();
            const day = current.snapshot.days.find(day => day.baseline.shiftDayId === source.dayId);
            if (!day || !["change", "cancel"].includes(plan.kind) || !same(day.baseline, source.original) ||
                effect.before?.source !== "WFM" || effect.after.source !== "SHF" ||
                effect.after.shiftDayId !== source.dayId) shiftFail("STALE_PREPARATION");
            const witness = witnesses();
            const statement = shiftOracleMarkSource(current.schema, current.core, source, witness.sql, witness.binds);
            const count = await mutate(statement), index = current.core.days.findIndex(row => row.SHF_EMPLOYEE_DAY_ID === source.dayId);
            current.core.days[index] = statement.after; day.baseline.source = "SHF"; return count;
          },
          insertOverlay: async overlay => writeOverlay(overlay, true),
          updateOverlay: async overlay => writeOverlay(overlay, false),
        };
        const returned = await work({
          readLockedSnapshot: () => observe(methods.readLockedSnapshot()),
          nextDayId: () => observe(methods.nextDayId()),
          insertDay: value => observe(methods.insertDay(value)),
          insertOverlay: value => observe(methods.insertOverlay(value)),
          updateOverlay: value => observe(methods.updateOverlay(value)),
          markSource: value => observe(methods.markSource(value)),
        });
        if (!same(returned, recorded) || nextEffect !== plan.effects.length ||
            allocations.size !== (plan.kind === "create" || plan.kind === "csv-create" ? plan.effects.length : 0))
          shiftFail("INVALID_SOURCE_DATA");
        frameGuard();
        const lease = c; if (!lease) shiftFail("DEPENDENCY_UNAVAILABLE");
        await op(() => { frameGuard(); commitAttempted = true; return lease.commit().then(() => { committed = true; }); });
        result = { effects: structuredClone(recorded), commitAcknowledgedAt: new Date().toISOString() };
      } finally { callbackClosed = true; }
      async function writeOverlay(overlay: ShiftOverlayPlan, inserting: boolean): Promise<number> {
        frameGuard(); const effect = expectedEffect();
        const day = current.snapshot.days.find(day => day.baseline.shiftDayId === overlay.dayId);
        if (!day || effect.after.shiftDayId !== overlay.dayId || written.has(overlay.dayId) ||
            !same(day.overlay, overlay.before) || plan.kind !== "change" && plan.kind !== "cancel")
          shiftFail("STALE_PREPARATION");
        const proposed = { ...day, overlay: structuredClone(overlay.after) };
        if (overlay.after.modificationUser !== plan.principal.subject ||
            Math.abs(Date.now() - instantFor(overlay.after.modificationLocal, executionZone)) > 5000)
          shiftFail("STALE_PREPARATION");
        requireShiftTextFits(overlay.after.modificationUser, Math.min(100, current.snapshot.textStorage.actorBytes),
          current.snapshot.textStorage.charset, null);
        requireShiftTextFits(overlay.after.cancelReasonCode, Math.min(10, current.snapshot.textStorage.cancelReasonBytes),
          current.snapshot.textStorage.charset, "reasonCode");
        requireShiftTextFits(overlay.after.cancelRemark, Math.min(500, current.snapshot.textStorage.remarkBytes),
          current.snapshot.textStorage.charset, "remark");
        const state = effectiveShift(current.snapshot, proposed);
        if (!same(state, effect.after)) shiftFail("STALE_PREPARATION");
        const witness = witnesses();
        const statement = shiftOracleOverlay(current.schema, current.core, overlay, plan.kind, inserting, witness.sql, witness.binds);
        const count = await mutate(statement);
        if (inserting) current.core.overlays.push(statement.after);
        else current.core.overlays[current.core.overlays.findIndex(row => row.SHF_EMPLOYEE_DAY_ID === overlay.dayId)] = statement.after;
        day.overlay = structuredClone(overlay.after);
        recorded.push({ ...effect, after: state }); written.add(overlay.dayId); nextEffect++; return count;
      }
    } catch (error) {
      primary = commitAttempted || cancelled && attempted ? shiftUnknown() : mapped(error);
    } finally {
      closing = true;
      while (pending.size) await Promise.allSettled([...pending]);
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort); ambient?.signal.removeEventListener("abort", abort);
      await Promise.all(breaks); // Native SQL/COMMIT awaited above; BREAK settles before cleanup.
      if (c) {
        if (!committed) {
          try { c.callTimeout = 1000; await c.rollback(); if (primary && primary.code !== "COMMAND_OUTCOME_UNKNOWN") primary = shiftAfterRollback(primary); }
          catch { unsafe = true; primary = attempted || commitAttempted ? shiftUnknown() : primary ?? mapped(null); }
        }
        if (commitAttempted && (!committed || primary)) unsafe = true;
        try { await c.close(unsafe); }
        catch {
          primary = attempted || commitAttempted ? shiftUnknown() : primary ?? mapped(null);
          try { await c.close(true); } catch { /* No raw error/secret logs or success fallback. */ }
        }
      } else if (primary && !attempted) {
        // No lease or SQL existed: known zero business effects, not a fictional
        // database rollback. The consumed authority is still not reopened.
        primary = new ShiftUowRejection(primary.problemCase, primary.details, false);
      }
    }
    if (primary) throw primary;
    if (!result) throw shiftUnknown();
    return result;
  }
}
