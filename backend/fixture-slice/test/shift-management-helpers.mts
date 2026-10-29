// Explicit synthetic fixture data and controlled test Clock. Not native proof.
import type { PrincipalV1 } from "../contracts.mts";
import type { ShiftCommandV1, ShiftDraftV1, ShiftPreparationV1 } from "../shift-management-contracts.mts";
import type { ShiftSnapshot } from "../shift-management-model.mts";
import { shiftManagementActorCapabilities } from "../shift-management-capabilities.mts";

export function managementClock() {
  let time = Date.parse("2027-01-01T00:00:00Z");
  return { now: () => new Date(time), advance: (milliseconds: number) => { time += milliseconds; } };
}
export function managementPrincipal(): PrincipalV1 {
  return { subject: "synthetic:administrator", provider: "synthetic", synthetic: true,
    displayName: "Synthetic Administrator (local/isolated only)", roles: ["Administrator"],
    capabilities: [...shiftManagementActorCapabilities], employeeId: null, resourceScope: { orgUnitIds: ["J01"] } };
}
export function managementFixtureSnapshot(): ShiftSnapshot {
  return {
    reference: { namespace: "shift-management-v0.1", identityRevision: "isolated-synthetic-identity-v1",
      operatorScopeRevision: "isolated-synthetic-scope-v1", mode: "isolated-fixture",
      dataSource: "isolated-fixture", metadata: null },
    employee: { employeeId: "1", firstName: "בדיקה", lastName: "סינתטית", orgUnitId: "J01",
      employeeNumber: "001234567", prefixEmployeeIds: ["1"], statusCode: "3", workFromHome: "1", siteIds: ["1"] },
    days: [], dependencies: [],
    policy: { minimumMinutes: 30, maximumMinutes: 720, gapMinutes: 60 },
    activityOptions: [{ code: "1", label: "סינתטי" }, { code: "2", label: null }],
    startEndReasonOptions: [{ code: "1", label: "סינתטי" }],
    cancelReasonOptions: [{ code: "C1", label: "סינתטי" }],
    partnerPolicy: { managedBreaks: "disabled", cti: "not-required" },
    textStorage: { charset: "AL32UTF8", remarkBytes: 500, cancelReasonBytes: 10, actorBytes: 100 },
    validUntil: "2027-01-10T00:00:00.000Z", preserved: { SYNTHETIC_POLICY_REVISION: "1" },
  };
}
export function createDraft(): Extract<ShiftDraftV1, { kind: "create" }> {
  return { kind: "create", startLocal: "2027-01-04T09:00:00", endLocal: "2027-01-04T10:00:00",
    activityCode: "1", workLocation: "site", remark: null };
}
export function commandFor(prepared: ShiftPreparationV1, draft: ShiftDraftV1, suffix: number): ShiftCommandV1 {
  return { commandId: `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`, draft,
    validationToken: prepared.validationToken, fingerprint: prepared.fingerprint,
    operationConfirmation: { accepted: true },
    acknowledgedWarningCodes: [...new Set(prepared.effects.flatMap(effect => effect.warningCodes))] };
}
