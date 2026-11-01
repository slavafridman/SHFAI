import type { CancellationFixtureManifestV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationSnapshot } from "./station-exit-cancellation-domain.mts";
import { completeCancellationOriginalsDigest } from "./station-exit-cancellation-domain.mts";
import { CancellationFixtureStore, CancellationFixtureApplication } from "./station-exit-cancellation-application.mts";
export { cancellationManifest } from "./station-exit-cancellation-validation.mts";
import { civil, fingerprint } from "./stage-arrival-domain.mts";
import { exitTables } from "./oracle-station-exit-snapshot.mts";
import { nativeMarker } from "./native-stage-arrival-config.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { performance } from "node:perf_hooks";
import type { RawShiftDay, ShiftDayReadResult } from "./contracts.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { same } from "./stage-arrival-domain.mts";

export class CancellationDetailFixtureReader extends FixtureReader {
  private readonly store: CancellationFixtureStore;
  constructor(rows: RawShiftDay[], store: CancellationFixtureStore) {
    super(rows); this.store = store;
    const f = store.read(), selected = rows.filter(r => r.employeeId === f.employeeId && r.shiftDayId === f.shiftDayId);
    if (selected.length !== 1) throw Error("Cancellation fixture requires one coherent selected detail");
    const row = selected[0], a = f.rows.SHF_ATTENDANCE!;
    if (row.orgUnitId !== f.orgUnitId || row.baselineStartLocal !== f.planned.startLocal ||
        row.baselineEndLocal !== f.planned.endLocal || row.changedStartLocal !== null || row.changedEndLocal !== null ||
        !same([row.stageArrivalLocal, row.stationArrivalLocal, row.stationExitLocal],
          [a.STAGE_ARRIVAL_TIME, a.STATION_ARRIVAL_TIME, a.STATION_EXIT_TIME]))
      throw Error("Cancellation detail/source snapshot mismatch");
  }
  override async readByDayId(id: string): Promise<ShiftDayReadResult> {
    const result = await super.readByDayId(id), f = this.store.read();
    if (result.kind !== "one" || result.row.employeeId !== f.employeeId || result.row.shiftDayId !== f.shiftDayId)
      return result;
    return { kind: "one", row: { ...result.row, stationExitLocal: f.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME } };
  }
}

export function createCancellationFixture(manifest: CancellationFixtureManifestV1, zone: string, orgUnitId: string,
  grants: string[] = [orgUnitId], ticking = false) {
  // Fixed explicit manifest clock ONLY for isolated fixture; never passed to native.
  let clockMs = Date.parse(manifest.clockInstant);
  const started = performance.now();
  const clock = { now: () => new Date(clockMs + (ticking ? Math.floor(performance.now() - started) : 0)) };
  const start = civil(new Date(clockMs - 3600000), zone);
  const end = civil(new Date(clockMs + 60000), zone);
  const exit = civil(new Date(clockMs - (manifest.scenarioId === "early-deferred" ? 3600000 : 10000)), zone);
  const rows: CancellationSnapshot["rows"] = Object.fromEntries(Object.entries(exitTables).map(([table, columns]) =>
    [table, Object.fromEntries(columns.map(c => [c, null]))]));
  Object.assign(rows.SHF_EMPLOYEES!, { EMPLOYEE_ID: "9001", EMP_ID_NUMBER: "999999991", FIRST_NAME: nativeMarker,
    LAST_NAME: "Synthetic", ORG_UNIT_ID: orgUnitId, SHF_LOCKED: "0" });
  Object.assign(rows.SHF_EMPLOYEE_DAY!, { SHF_EMPLOYEE_DAY_ID: "6201", EMP_ID_NUMBER: "99999999",
    WM_DAY_TYPE: "4", WM_SHIFT_START_DATETIME: start, WM_SHIFT_END_DATETIME: end,
    WM_SITE_ID: "7001", SPLIT_SHIFT: "N", SOURCE: "SYNTHETIC_DAYS" });
  rows.SHF_DAY_CHANGES = null;
  Object.assign(rows.SHF_ATTENDANCE!, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: null,
    STATION_ARRIVAL_TIME: start, STATION_ARRIVAL_USER: "synthetic-original",
    STATION_EXIT_TIME: manifest.scenarioId === "not-recorded" ? null : exit,
    STATION_EXIT_USER: manifest.scenarioId === "not-recorded" ? null : "synthetic-legacy" });
  const day = civil(clock.now(), zone).slice(0, 10);
  const facts: CancellationSnapshot = { employeeId: "9001", shiftDayId: "6201", orgUnitId,
    source: "isolated-fixture", expectedDaySource: "SYNTHETIC_DAYS", rows, planned: { startLocal: start, endLocal: end },
    policy: { maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 10 },
    policyProvenance: { early: { PARAM_KEY: "SYNTHETIC_EARLY", DEFAULT_VALUE: "5" },
      after: { PARAM_KEY: "SYNTHETIC_AFTER", DEFAULT_VALUE: "10" } },
    dependencies: { reports: "0", exceptions: { current: "0", base: "0" }, overlap: false,
      completeEvidence: { syntheticOnly: true, candidates: [rows.SHF_EMPLOYEE_DAY], reports: [], exceptions: [], baseExceptions: [] } },
    bindingScopeDigest: fingerprint({ syntheticOnly: true, manifest, orgUnitId, zone }),
    windowStart: new Date(clockMs - 1000).toISOString(), windowEnd: new Date(clockMs + 600000).toISOString(),
    partnerReview: { version: "shf-exit-cancellation-partner-review-v1", purpose: "clear-recorded-ordinary-station-exit",
      assessment: manifest.scenarioId === "partner-required" ? "required" : manifest.scenarioId === "partner-unknown" ? "unknown" : "not-required",
      reviewReference: "synthetic-only-review", reviewedBy: "synthetic-business-owner",
      reviewedAt: new Date(clockMs - 1000).toISOString(), expiresAt: new Date(clockMs + 600000).toISOString(),
      bindingScopeDigest: "", completeOriginalsDigest: "" } };
  if (start.slice(0, 10) !== day || end.slice(0, 10) !== day ||
      civil(new Date(facts.windowStart), zone).slice(0, 10) !== day ||
      civil(new Date(facts.windowEnd), zone).slice(0, 10) !== day) stageFail("COMMAND_SCOPE_DEFERRED");
  facts.partnerReview.bindingScopeDigest = facts.bindingScopeDigest;
  facts.partnerReview.completeOriginalsDigest = completeCancellationOriginalsDigest(facts);
  const store = new CancellationFixtureStore(facts, manifest.scenarioId);
  return { app: new CancellationFixtureApplication(store, clock, zone, grants), store, clock,
    // Isolated test-only controllable clock. Runtime composition does not expose it over HTTP.
    advanceClock(ms: number) { if (!Number.isSafeInteger(ms)) throw Error("Invalid fixture clock increment"); clockMs += ms; } };
}
