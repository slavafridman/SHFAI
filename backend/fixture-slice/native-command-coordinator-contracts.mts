// Canonical TYPE-ONLY §50-v0.1 / Q50-A01, approved 2026-11-01 09:31+02.
// Additional admission, never replacement operation authority or a receipt.
import type { DecimalId } from "./contracts.mts";
import type { StageArrivalCommandIdV1 } from "./stage-arrival-contracts.mts";
import type {
  ShiftCommandUnitOfWork, ShiftConsumedAdmissionV1, ShiftLockedWork,
  ShiftRecordedEffectV1, ShiftSelectionV1, ShiftTransactionAcknowledgmentV1,
} from "./shift-management-contracts.mts";

// Exact private JSON shape of SHF_NATIVE_COMMAND_COORDINATOR_CONFIG.
// Types do not validate canonical absolute local paths or operator trust.
export interface NativeCommandCoordinatorConfigV1 {
  directory: string;
  targetScope: string;
}
export interface NativeCommandCoordinatorNamespaceV1 {
  version: "shf-native-command-coordinator-v1";
  canonicalDirectory: string;
  targetScope: string;
  database: string;
  schema: string;
}
export interface NativeCommandCoordinatorGuardV1 {
  version: "shf-native-command-coordinator-v1";
  targetScope: string;
  employeeScope: string; // exact lowercase SHA-256 key, runtime checked
  state: "ready" | "consumed";
}
// Attribution is handle binding only; NEVER part of the employee scope key.
export type NativeCommandOperationV1 =
  | "stage-arrival" | "station-arrival" | "station-arrival-late" | "station-exit"
  | "create" | "change" | "cancel" | "csv-create"
  | "station-exit-cancellation";
export interface NativeCommandCoordinatorBindingV1 {
  employeeId: DecimalId;
  operation: NativeCommandOperationV1;
  commandId: StageArrivalCommandIdV1;
}
// Erased private brand prevents a plain HTTP token/object satisfying admission.
// Runtime provenance/ownership checking is still mandatory; casts prove nothing.
declare const nativeCommandAdmissionBrand: unique symbol;
export interface NativeCommandAdmissionV1 {
  readonly [nativeCommandAdmissionBrand]: true;
}
export interface NativeCommandCoordinatorPort {
  // Read-only validation of config/target/namespace/employee guard/marker.
  // Missing/unreadable/malformed/consumed/foreign authority throws fail-closed.
  assertAvailable(employeeId: DecimalId, signal?: AbortSignal): Promise<void>;
  // After auth/plan/consents; exclusive marker+fsync then identity-checked
  // existing guard consumed+fsync BEFORE old allowance and any business effect.
  consume(binding: Readonly<NativeCommandCoordinatorBindingV1>,
    signal?: AbortSignal): Promise<NativeCommandAdmissionV1>;
  // Synchronous guard at mutation/COMMIT boundary, no await gap before send.
  // Rechecks owned handle/binding AND same consumed guard/marker/manifest.
  assertMutationAllowed(admission: NativeCommandAdmissionV1,
    binding: Readonly<NativeCommandCoordinatorBindingV1>): void;
}
// Required constructor/composition dependency for EVERY enabled native writer.
// No optional/no-op/default. Startup validates assertAvailable before ANY pool,
// operation-authority construction/consumption or listener; readonly unaffected.
export interface NativeCommandCoordinatorDependencyV1 {
  coordinator: NativeCommandCoordinatorPort;
}
// Backend implements these overlays for native-only mutation seams. Existing
// fixture ports and §49 signatures stay unchanged. Other existing execute args
// retain their private types; globalAdmission is additionally mandatory.
export interface NativeCoordinatedAttendanceUnitOfWork<Snapshot, Decision, Result>
  extends NativeCommandCoordinatorDependencyV1 {
  execute(before: Snapshot, decide: (current: Snapshot) => Decision,
    globalAdmission: NativeCommandAdmissionV1,
    signal?: AbortSignal): Promise<Result>;
}
export type NativeCoordinatedShiftCommandUnitOfWork<
  Snapshot, CreatePlan, OverlayPlan, SourcePlan,
> = Omit<ShiftCommandUnitOfWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan>,
  "run"> & NativeCommandCoordinatorDependencyV1 & {
  run(selection: ShiftSelectionV1 & {
    admission: ShiftConsumedAdmissionV1; // old per-op authority STILL mandatory
    globalAdmission: NativeCommandAdmissionV1;
  }, work: (locked:
    ShiftLockedWork<Snapshot, CreatePlan, OverlayPlan, SourcePlan>) =>
    Promise<ShiftRecordedEffectV1[]>,
  signal?: AbortSignal): Promise<ShiftTransactionAcknowledgmentV1>;
};

// Operator provisions namespace.json + EXISTING employee guard outside repo.
// One fixed local target/host namespace shared across accounts/aliases/profiles,
// all days/kinds/processes; no default/mkdir/new UUID/network share/reseed.
// key=SHA-256 UTF-8 canonical JSON array
// ["shf-native-command-coordinator-v1",targetScope,employeeId].
// Paths employee-<key>.json and employee-<key>.attempted; absent guard denies.
// Any marker/nonready/unreadable state denies every future kind/day. Retain
// marker AND consumed guard after EVERY attempt incl success/rollback/UNKNOWN.
// Deliberately NO finish/release/reset/retry method or terminal receipt journal.
// Partial acquisition may consume with zero effects; never reopen on error.
// Old proofs/wire/grants/queries/digests/fuses unchanged; consumed F1 immutable.
// Required in startFromEnvironment before management branch, direct
// startNativeManagement and all F1/F2/late/exit/49 application-UoW compositions,
// incl profileless startup. Context/validate/CSV preview recheck read-only.
// Runtime validates file/path/inode/fsync and handle ownership; type-only ports
// do not enforce this yet. Backend must reject missing/foreign admission in
// direct UoW tests, not only environment tests, before DML/NEXTVAL/COMMIT.
// No distributed or power-loss exactly-once claim: both-record loss/ready
// restoration or trusted config replacement may be undetectable. Stop/reconcile
// on suspected loss; separately controlled operator reprovisioning with all
// writers stopped only, not authorized by coding approval. Unmodified old
// binaries/legacy/other hosts require external exclusion. Additional fence
// reconciliation never revives independently consumed operation allowances.
