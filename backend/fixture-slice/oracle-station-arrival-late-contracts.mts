// Canonical TYPE-ONLY §50-v0.1, approved 2026-11-01 09:31+02.
// Includes §§50.1–50.8/Q50-A01; implementation only, not operational GO.
// No runtime exports, grants, parser, configuration, filesystem or Oracle IO.
import type { DecimalId, PrincipalV1 } from "./contracts.mts";
import type {
  StageArrivalMinutesV1, StageArrivalSelectionV1,
} from "./stage-arrival-contracts.mts";
import type {
  NativeStationArrivalCommitV1, NativeStationArrivalContextV1,
  NativeStationArrivalProblemV1, NativeStationArrivalReceiptV1,
  NativeStationArrivalValidationV1,
} from "./oracle-station-arrival-contracts.mts";

export type NativeLateStationCapabilityV1 =
  | "attendance-station-arrival-late:prepare"
  | "attendance-station-arrival-late:commit"
  | "attendance-station-arrival-late:test-oracle-write";
export type NativeLateStationModeV1 = "disabled" | "test-oracle-controlled";
export interface NativeLateStationDraftV1 {
  lateReasonCode: DecimalId;
  lateRemark: null;
}
export type NativeLateStationContextV1 =
  Omit<NativeStationArrivalContextV1, "lateReasonOptions"> & {
    lateReasonOptions: Array<{ code: DecimalId; label: string }>;
  };
export type NativeLateStationValidationV1 =
  Omit<NativeStationArrivalValidationV1,
    "state" | "warnings" | "confirmationRequired"> & {
    state: "warning-requires-confirmation";
    warnings: [{ code: "STATION_ARRIVAL_LATE"; minutes: StageArrivalMinutesV1 }];
    confirmationRequired: true;
  };
export type NativeLateStationCommitV1 =
  Omit<NativeStationArrivalCommitV1, "draft" | "confirmation"> & {
    draft: NativeLateStationDraftV1;
    confirmation: { accepted: true; warningCodes: ["STATION_ARRIVAL_LATE"] };
  };
export type NativeLateStationReceiptV1 =
  Omit<NativeStationArrivalReceiptV1, "recorded"> & {
    recorded: Omit<NativeStationArrivalReceiptV1["recorded"], "stationLate"> & {
      stationLate: {
        reasonCode: DecimalId; minutes: StageArrivalMinutesV1; remark: null;
      };
    };
  };
// Distribute without widening status/code/effect/nextAction combinations.
type WithLateInvalidParameters<T> = T extends unknown
  ? Omit<T, "invalidParameters"> & {
    invalidParameters?: Array<{
      name: NonNullable<
        NativeStationArrivalProblemV1["invalidParameters"]
      >[number]["name"] | "lateRemark";
      reason: "required" | "invalid-format" | "unsupported";
    }>;
  } : never;
export type NativeLateStationProblemV1 =
  WithLateInvalidParameters<NativeStationArrivalProblemV1>;

export interface LateStationArrivalApplicationPort {
  context(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    signal?: AbortSignal): Promise<NativeLateStationContextV1>;
  validate(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    draft: NativeLateStationDraftV1,
    signal?: AbortSignal): Promise<NativeLateStationValidationV1>;
  command(principal: PrincipalV1, selection: StageArrivalSelectionV1,
    commit: NativeLateStationCommitV1,
    signal?: AbortSignal): Promise<NativeLateStationReceiptV1>;
}
// Backend-private parsed plan type, not a raw SQL/HTTP/Oracle DTO.
export interface PartnerStationArrivalObligationPort<SelectedPlan> {
  assess(selectedPlan: SelectedPlan): {
    state: "not-required" | "required" | "unknown";
    effects: Array<"cti-arrival" | "managed-break-change">;
  };
}

// B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-arrival-late.
// GET B/context: no token. POST B/validations: exact Draft, pure preparation.
// POST B/commands: exact Commit, both explicit consents. No query/time/minutes,
// free remark/status/reset/retry/pagination endpoint or ordinary-F2 fallback.
// Runtime must reject duplicate/unknown keys; scalar aliases are NOT parsers.
// Backend ordered grants are existing R7 then exactly the three late rights.
// Context/validate require prepare+native; command all3 before ports and under
// ownership. Principal/provider/identity shape unchanged; production mock
// rejected, real provider required outside approved mock, no auth-error fallback.
//
// Configured systemClock, same business date, unique instants, start<now<=end;
// full-instant floor elapsed minutes includes0; no F1 offset. Oracle DATE
// stores seconds, classification uses full instant. Expiry is min(120s,next
// late-minute boundary,end+1ms); at/after expiry reject and invalidate both ACKs.
// Unique bounded type2 catalog, safe nonempty label and exact flags0/0 only.
// Null-remark subset is NOT proof of optional remark/report/mood semantics;
// any known/unknown requirement defers. Only partner not-required+effects[]
// admits; assessment is pure local evidence, never simulated completion.
//
// Mandatory global coordinator §50.4 BEFORE old per-operation allowance and
// mutation; late allowance/proof namespace native-station-arrival-late-v0.1.
// All existing operation proofs/digests/allowances remain independently required.
// One existing-row UPDATE SET ONLY STATION_ARRIVAL_TIME, STATION_ARRIVAL_USER,
// LATE_REASON_ID, LATE_MINUTES, LATE_REMARK. No INSERT/upsert/sequence/functions.
// Full originals/dependencies/catalog reread under bounded NOWAIT locks, fresh
// Clock/reauthorization and certified external writer exclusion; preserve all
// other columns incl null/coherent stage and briefing. Rowcount1 is candidate
// only; success requires COMMIT ACK plus independent identity-checked complete
// preservation readback. Receipt is nonpersistent and partner not-invoked.
// Unproved attempted effect/ACK/readback/rollback -> UNKNOWN/reconcile, never
// replay/none/inferred success. Autonomous/unknown observer effects cannot be
// promised undone. Two waived metadata UNKNOWNs require a new late certificate.
// Explicit+ambient cancellation and synchronous final admission guards with
// no await gap before DML/COMMIT; no automatic reset/retry/release or live GO.
