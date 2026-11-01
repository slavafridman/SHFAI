import { test } from "node:test";
import assert from "node:assert/strict";
import * as canonical from "../native-command-coordinator-contracts.mts";
import type { CapabilityV1 } from "../contracts.mts";
import type {
  NativeCommandAdmissionV1, NativeCommandCoordinatorBindingV1,
  NativeCommandCoordinatorConfigV1, NativeCommandCoordinatorDependencyV1,
  NativeCommandCoordinatorGuardV1, NativeCommandCoordinatorNamespaceV1,
  NativeCommandCoordinatorPort, NativeCommandOperationV1,
  NativeCoordinatedAttendanceUnitOfWork, NativeCoordinatedShiftCommandUnitOfWork,
} from "../native-command-coordinator-contracts.mts";
import type {
  ShiftCommandUnitOfWork, ShiftConsumedAdmissionV1, ShiftSelectionV1,
} from "../shift-management-contracts.mts";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type Snapshot = { revision: string };
type Plan = { local: string; actor: string };
type Result = { local: string; actor: string; acknowledged: string; verified: string };
type Attendance = NativeCoordinatedAttendanceUnitOfWork<Snapshot, Plan, Result>;
type OldManagement = ShiftCommandUnitOfWork<Snapshot, Plan, Plan, Plan>;
type Management = NativeCoordinatedShiftCommandUnitOfWork<Snapshot, Plan, Plan, Plan>;
type Selection = Parameters<Management["run"]>[0];
type Reads = "shift-day:read" | "current-shifts:read" | "shift-search:read"
  | "my-shifts:read" | "shift-items:read" | "employee:read" | "attendance:read";
type Rights = "prepare" | "commit" | "test-oracle-write";
type Checks = [
  Assert<Equal<keyof NativeCommandCoordinatorConfigV1, "directory" | "targetScope">>,
  Assert<Equal<keyof NativeCommandCoordinatorNamespaceV1,
    "version" | "canonicalDirectory" | "targetScope" | "database" | "schema">>,
  Assert<Equal<NativeCommandCoordinatorNamespaceV1["version"],
    "shf-native-command-coordinator-v1">>,
  Assert<Equal<keyof NativeCommandCoordinatorGuardV1,
    "version" | "targetScope" | "employeeScope" | "state">>,
  Assert<Equal<NativeCommandCoordinatorGuardV1["state"], "ready" | "consumed">>,
  Assert<Equal<NativeCommandOperationV1,
    "stage-arrival" | "station-arrival" | "station-arrival-late" | "station-exit"
    | "create" | "change" | "cancel" | "csv-create" | "station-exit-cancellation">>,
  Assert<Equal<keyof NativeCommandCoordinatorBindingV1,
    "employeeId" | "operation" | "commandId">>,
  Assert<Equal<Assignable<{}, NativeCommandAdmissionV1>, false>>,
  Assert<Equal<Assignable<string, NativeCommandAdmissionV1>, false>>,
  Assert<Equal<Assignable<ShiftConsumedAdmissionV1, NativeCommandAdmissionV1>, false>>,
  Assert<Equal<Assignable<{}, NativeCommandCoordinatorDependencyV1>, false>>,
  Assert<Equal<NativeCommandCoordinatorDependencyV1["coordinator"],
    NativeCommandCoordinatorPort>>,
  Assert<Equal<keyof NativeCommandCoordinatorPort,
    "assertAvailable" | "consume" | "assertMutationAllowed">>,
  Assert<Equal<ReturnType<NativeCommandCoordinatorPort["assertAvailable"]>, Promise<void>>>,
  Assert<Equal<Parameters<NativeCommandCoordinatorPort["assertAvailable"]>,
    [employeeId: string, signal?: AbortSignal]>>,
  Assert<Equal<Parameters<NativeCommandCoordinatorPort["consume"]>,
    [binding: Readonly<NativeCommandCoordinatorBindingV1>, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<NativeCommandCoordinatorPort["consume"]>,
    Promise<NativeCommandAdmissionV1>>>,
  Assert<Equal<Parameters<NativeCommandCoordinatorPort["assertMutationAllowed"]>,
    [admission: NativeCommandAdmissionV1,
      binding: Readonly<NativeCommandCoordinatorBindingV1>]>>,
  Assert<Equal<ReturnType<NativeCommandCoordinatorPort["assertMutationAllowed"]>, void>>,
  Assert<Equal<Parameters<Attendance["execute"]>,
    [before: Snapshot, decide: (current: Snapshot) => Plan,
      globalAdmission: NativeCommandAdmissionV1, signal?: AbortSignal]>>,
  Assert<Equal<ReturnType<Attendance["execute"]>, Promise<Result>>>,
  Assert<Equal<Selection, ShiftSelectionV1 & {
    admission: ShiftConsumedAdmissionV1; globalAdmission: NativeCommandAdmissionV1;
  }>>,
  Assert<Equal<Assignable<ShiftSelectionV1 & { admission: ShiftConsumedAdmissionV1 },
    Selection>, false>>,
  Assert<Equal<Assignable<ShiftSelectionV1 & { globalAdmission: NativeCommandAdmissionV1 },
    Selection>, false>>,
  Assert<Equal<Parameters<Management["run"]>[1], Parameters<OldManagement["run"]>[1]>>,
  Assert<Equal<Parameters<Management["run"]>[2], AbortSignal | undefined>>,
  Assert<Equal<ReturnType<Management["run"]>, ReturnType<OldManagement["run"]>>>,
  Assert<Equal<Parameters<OldManagement["run"]>[0],
    ShiftSelectionV1 & { admission: ShiftConsumedAdmissionV1 }>>,
  // Union delta only: exact old families remain. Actual ordered grants are
  // covered by existing runtime suites, not these compile-time union checks.
  Assert<Equal<Exclude<CapabilityV1,
    `attendance-${string}` | `shift-management:${string}`>, Reads>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-stage-arrival:${string}`>,
    `attendance-stage-arrival:${Rights}`>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-arrival:${string}`>,
    `attendance-station-arrival:${Rights}`>>,
  Assert<Equal<Extract<CapabilityV1, `attendance-station-exit:${string}`>,
    `attendance-station-exit:${Rights}`>>,
  Assert<Equal<Extract<CapabilityV1, `shift-management:${string}`>,
    "shift-management:prepare" | "shift-management:create" | "shift-management:change"
    | "shift-management:cancel" | "shift-management:csv-preview"
    | "shift-management:csv-apply" | "shift-management:test-oracle-write">>,
];
type AllChecks = Assert<Equal<Checks[number], true>>;

test("§50 global coordinator canonical namespace is runtime-empty, no filesystem IO", () => {
  assert.deepEqual(Object.keys(canonical), []);
});
