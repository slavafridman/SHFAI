// ISOLATED TEST/DEMO DOUBLE: no Oracle import, physical metadata proof, durable
// allowance, autonomous effects or real partner completion is manufactured.
import type { Clock } from "./current-shifts-contracts.mts";
import type { ShiftAdmissionReferenceV1, ShiftCommandUnitOfWork, ShiftSnapshotPort } from "./shift-management-contracts.mts";
import type { ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan, ShiftSnapshot } from "./shift-management-model.mts";
import { freezeShift, validateShiftSnapshot } from "./shift-management-model.mts";
import { IsolatedShiftAdmission } from "./shift-management-admission.mts";
import { ShiftManagementApplication } from "./shift-management-application.mts";
import { shiftManagementAccessPolicy } from "./access-policy.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { shiftAfterRollback, shiftFail, shiftUnknown } from "./shift-management-errors.mts";
import { record, text } from "./contract-validation.mts";
import { exact } from "./stage-arrival-validation.mts";
import { same } from "./stage-arrival-domain.mts";

type Fault = "insert-2" | "rowcount-zero" | "rowcount-many" | "rowcount-undefined" |
  "commit-ack" | "readback" | "rollback";
type FixtureReference = Extract<ShiftAdmissionReferenceV1, { mode: "isolated-fixture" }>;
function parseIsolatedSnapshot(value: unknown): ShiftSnapshot {
  if (!record(value) || !record(value.employee) || typeof value.employee.employeeId !== "string" ||
      !exact(value.reference, ["namespace", "identityRevision", "operatorScopeRevision", "mode", "dataSource", "metadata"]) ||
      value.reference.namespace !== "shift-management-v0.1" || value.reference.mode !== "isolated-fixture" ||
      value.reference.dataSource !== "isolated-fixture" || value.reference.metadata !== null ||
      !text(value.reference.identityRevision, 128, 1) || !text(value.reference.operatorScopeRevision, 128, 1))
    throw Error("Explicit isolated management snapshot required");
  const reference: FixtureReference = { namespace: "shift-management-v0.1",
    identityRevision: value.reference.identityRevision, operatorScopeRevision: value.reference.operatorScopeRevision,
    mode: "isolated-fixture", dataSource: "isolated-fixture", metadata: null };
  validateShiftSnapshot(value, reference, value.employee.employeeId);
  return structuredClone(value);
}
export function createIsolatedShiftManagement(input: unknown, clock: Clock, businessTimeZone: string) {
  let state = parseIsolatedSnapshot(input);
  if (state.reference.mode !== "isolated-fixture") throw Error("Native reference is not an isolated fixture");
  const reference = freezeShift(structuredClone(state.reference));
  const admission = new IsolatedShiftAdmission(reference, clock);
  let nextId = state.days.reduce((max, day) => BigInt(day.baseline.shiftDayId) > max ?
    BigInt(day.baseline.shiftDayId) : max, 0n) + 1n;
  let sequenceCalls = 0, commits = 0, rollbacks = 0, active = 0, readbackPending = false;
  let fault: Fault | undefined;
  let hook: ((phase: "locked" | "before-commit") => Promise<void>) | undefined;
  const snapshots: ShiftSnapshotPort<ShiftSnapshot> = {
    reference,
    async read(selection, signal) {
      assertShiftWorkAllowed(signal);
      if (selection.employeeId !== state.employee.employeeId) shiftFail("SHIFT_DAY_NOT_FOUND");
      if (readbackPending && fault === "readback") { fault = undefined; readbackPending = false; throw Error("Isolated readback fault"); }
      readbackPending = false;
      return structuredClone(state);
    },
  };
  const uow: ShiftCommandUnitOfWork<ShiftSnapshot, ShiftCreatePlan, ShiftOverlayPlan, ShiftSourcePlan> = {
    reference,
    async run(selection, work, signal) {
      admission.assertOwned(selection.admission);
      if (selection.employeeId !== state.employee.employeeId || !same(selection.admission.reference, reference))
        shiftFail("STALE_PREPARATION");
      if (active) shiftFail("COMMAND_IN_PROGRESS");
      active++;
      const original = structuredClone(state), staged = structuredClone(state);
      let committed = false, closed = false, inserted = 0;
      const guard = () => {
        assertShiftWorkAllowed(signal); admission.assertOwned(selection.admission);
        if (closed) shiftFail("STALE_PREPARATION");
      };
      const rowcount = (apply: () => number) => {
        guard();
        if (fault === "rowcount-zero") { fault = undefined; return 0; }
        if (fault === "rowcount-many") { fault = undefined; return 2; }
        if (fault === "rowcount-undefined") { fault = undefined; return undefined; }
        return apply();
      };
      try {
        const effects = await work({
          async readLockedSnapshot() {
            guard(); await hook?.("locked"); guard(); return structuredClone(staged);
          },
          async nextDayId() { guard(); sequenceCalls++; return String(nextId++); },
          async insertDay(plan) {
            return rowcount(() => {
              if (!["create", "csv-create"].includes(selection.admission.kind)) shiftFail("INVALID_SOURCE_DATA");
              if (++inserted === 2 && (fault === "insert-2" || fault === "rollback"))
                throw Error("Isolated staged insert fault");
              if (staged.days.some(day => day.baseline.shiftDayId === plan.day.shiftDayId)) return 0;
              staged.days.push({ baseline: structuredClone(plan.day), overlay: null, attendance: null }); return 1;
            });
          },
          async insertOverlay(plan) {
            return rowcount(() => {
              const day = staged.days.find(day => day.baseline.shiftDayId === plan.dayId);
              if (!day || day.overlay !== null || plan.before !== null) return 0;
              day.overlay = structuredClone(plan.after); return 1;
            });
          },
          async updateOverlay(plan) {
            return rowcount(() => {
              const day = staged.days.find(day => day.baseline.shiftDayId === plan.dayId);
              if (!day || day.overlay === null || !same(day.overlay, plan.before)) return 0;
              day.overlay = structuredClone(plan.after); return 1;
            });
          },
          async markSource(plan) {
            return rowcount(() => {
              const day = staged.days.find(day => day.baseline.shiftDayId === plan.dayId);
              if (!day || !same(day.baseline, plan.original) || day.baseline.source !== "WFM" ||
                  plan.from !== "WFM" || plan.to !== "SHF") return 0;
              day.baseline.source = "SHF"; return 1;
            });
          },
        });
        await hook?.("before-commit"); guard();
        if (!same(state, original)) shiftFail("STALE_PREPARATION");
        validateShiftSnapshot(staged, reference, selection.employeeId);
        guard(); state = staged; committed = true; commits++; readbackPending = true;
        if (fault === "commit-ack") { fault = undefined; throw shiftUnknown(); }
        return { effects, commitAcknowledgedAt: clock.now().toISOString() };
      } catch (error) {
        if (committed) throw shiftUnknown();
        if (fault === "rollback") { fault = undefined; throw shiftUnknown(); }
        fault = undefined; rollbacks++;
        throw shiftAfterRollback(error);
      } finally { closed = true; active--; }
    },
  };
  const app = new ShiftManagementApplication({ snapshots, uow, admission,
    policy: shiftManagementAccessPolicy("isolated-fixture"), clock, businessTimeZone,
    authGeneration: () => "isolated-fixture-auth-generation-v1" });
  return {
    app, snapshots, uow, admission,
    inspect: () => ({ snapshot: structuredClone(state), sequenceCalls, commits, rollbacks, active }),
    failNext(value: Fault) { fault = value; },
    onStepForIsolatedTest(value: typeof hook) { hook = value; },
    reviseForIsolatedTest(work: (snapshot: ShiftSnapshot) => void) {
      const changed = structuredClone(state); work(changed);
      validateShiftSnapshot(changed, reference, state.employee.employeeId); state = changed;
    },
  };
}
