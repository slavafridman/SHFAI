import type { PartnerStationArrivalObligationPort } from "./oracle-station-arrival-late-contracts.mts";
import type { LateSnapshot } from "./oracle-station-arrival-late-snapshot.mts";
import { lateTables } from "./oracle-station-arrival-late-snapshot.mts";
// Pure local assessment of the explicitly approved first-arrival subset.
// Legacy registerStation/addLate have no transport call. Complete supported
// snapshot + certified writer exclusion is necessary; this is NOT a claim
// about other workflows, triggers, external observers or partner completion.
export class BoundedLateStationObligations implements PartnerStationArrivalObligationPort<LateSnapshot> {
  assess(plan: LateSnapshot): ReturnType<PartnerStationArrivalObligationPort<LateSnapshot>["assess"]> {
    if (plan.blockers.length || !plan.rows.SHF_ATTENDANCE ||
        (plan.rows.SHF_DAY_CHANGES?.NEW_DAY_TYPE ?? plan.rows.SHF_EMPLOYEE_DAY?.WM_DAY_TYPE) !== "4")
      return { state: "unknown", effects: [] };
    for (const [key, allowed] of [
      ["SHF_EMPLOYEES", lateTables.SHF_EMPLOYEES], ["SHF_EMPLOYEE_DAY", lateTables.SHF_EMPLOYEE_DAY],
      ["SHF_DAY_CHANGES", lateTables.SHF_DAY_CHANGES], ["team", lateTables.SHF_ORG_UNIT], ["parent", lateTables.SHF_ORG_UNIT],
    ] as const) {
      const row = plan.rows[key];
      if (row && Object.keys(row).some(k => !allowed.some(name => name === k))) return { state: "unknown", effects: [] };
    }
    return { state: "not-required", effects: [] };
  }
}
