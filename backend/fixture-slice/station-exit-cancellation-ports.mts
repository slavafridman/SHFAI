// TYPE-ONLY C52-v0.2 ports. No implementation, transport or runtime authority.
import type { PrincipalV1 } from "./contracts.mts";
import type {
  StageArrivalCommandIdV1, StageArrivalInstantV1, StageArrivalSelectionV1,
} from "./stage-arrival-contracts.mts";
import type {
  CancellationCommandV1, CancellationContextV1, CancellationDraftV1,
  CancellationReceiptV1, CancellationValidationV1,
} from "./station-exit-cancellation-contracts.mts";
import type {
  CancellationPartnerReviewV1, CancellationScopeV1,
} from "./station-exit-cancellation-private-contracts.mts";
import type {
  NativeCommandAdmissionV1, NativeCommandCoordinatorDependencyV1,
} from "./native-command-coordinator-contracts.mts";

export interface CancellationApplicationPort {
  context(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    signal?: AbortSignal): Promise<CancellationContextV1>;
  validate(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    draft: CancellationDraftV1, signal?: AbortSignal): Promise<CancellationValidationV1>;
  command(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    command: CancellationCommandV1, signal?: AbortSignal): Promise<CancellationReceiptV1>;
}
// Snapshot/Decision are backend-private parsed facts/plans, NOT public raw
// schemas. Generic seams deliberately do not invent a physical row layout.
// Snapshot must include complete originals/policies/dependencies as §52.4.3.
export interface CancellationReader<Snapshot> {
  read(signal?: AbortSignal): Promise<Snapshot>;
}
export interface CancellationRules<Snapshot, Decision> {
  decide(snapshot: Snapshot, serverNow: StageArrivalInstantV1): Decision;
}
export interface CancellationPartnerAssessmentPort {
  assess(input: CancellationScopeV1 & {
    purpose: "clear-recorded-ordinary-station-exit";
    review: CancellationPartnerReviewV1;
  }): { assessment: "not-required" | "required" | "unknown" };
}
declare const cancellationOperationAdmissionBrand: unique symbol;
export interface CancellationOperationAdmissionV1 {
  readonly [cancellationOperationAdmissionBrand]: true;
}
export interface CancellationOperatorAdmissionPort {
  assertAvailable(scope: CancellationScopeV1, signal?: AbortSignal): Promise<void>;
  consume(scope: CancellationScopeV1, commandId: StageArrivalCommandIdV1,
    globalAdmission: NativeCommandAdmissionV1,
    signal?: AbortSignal): Promise<CancellationOperationAdmissionV1>;
  assertMutationAllowed(handle: CancellationOperationAdmissionV1,
    scope: CancellationScopeV1, commandId: StageArrivalCommandIdV1): void;
}
// ACK + complete verified preservation is a prerequisite, NOT a candidate row
// count. Backend-private result extends these existing dedicated receipt fields,
// without publishing raw row/SQL/bindings through the application boundary.
export type CancellationNativeCompletionV1 = Pick<Extract<CancellationReceiptV1,
  { dataSource: "oracle-test" }>,
  "recorded" | "commitAcknowledgedAt" | "readBackVerifiedAt">;
export interface CancellationUow<Snapshot, Decision,
  Result extends CancellationNativeCompletionV1>
  extends NativeCommandCoordinatorDependencyV1 {
  execute(before: Snapshot, decide: (current: Snapshot) => Decision,
    globalAdmission: NativeCommandAdmissionV1,
    operationAdmission: CancellationOperationAdmissionV1,
    signal?: AbortSignal): Promise<Result>;
}

// Application consumes shared employee-wide coordinator FIRST, then own
// cancellation allowance after fresh authorization/checks/TWO independent
// consents. Both admissions mandatory even in direct native UoW composition.
// No optional/no-op/default; provenance/ownership checked at runtime, no cast
// is authorization. Startup/context/check assert availability read-only only.
// Pure partner assessment: absent/expired/mismatched/uncovered review unknown;
// reviewedAt<=now<expiresAt<=windowEnd, both original/scope digests bound.
// required/unknown -> defer, no token/effects. Synthetic review not native GO.
// UoW NOWAIT/autoCommit=false/reload/full null-safe originals+fresh pure decide;
// one existing-row NULL-clear only. rows0 stale/proven rollback,1 candidate,
// >1/undefined invariant+rollback. No function/NEXTVAL/ledger/EMS/event/mood.
// Explicit signal AND ambient deadline+owned coordinator+own allowance
// synchronously immediately pre-DML/pre-COMMIT; no await gap before send.
// ACK loss/readback mismatch/budget loss/possible effects -> UNKNOWN, not receipt.
// No finish/release/reset/retry/provision/reconcile method. Retain consumed
// guard+marker+own allowance after all attempts, including success/rollback.
// Prior coordinated exit blocks cancellation until separately controlled
// operator reconciliation/reprovisioning; consumed F1 fuse remains immutable.
// Clearing database fields or coordinator reconciliation never reopens old
// operation allowance automatically; no distributed/power-loss guarantee.
