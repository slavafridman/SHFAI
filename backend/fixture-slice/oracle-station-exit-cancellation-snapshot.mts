import type { CancellationBindingV1 } from "./station-exit-cancellation-private-contracts.mts";
import type { CancellationSnapshot } from "./station-exit-cancellation-domain.mts";
import { completeCancellationOriginalsDigest } from "./station-exit-cancellation-domain.mts";
import { cancellationBindingScopeDigest } from "./native-station-exit-cancellation-config.mts";
import { exitSnapshot, exitTables } from "./oracle-station-exit-snapshot.mts";
import { stationOverlap } from "./oracle-station-arrival-domain.mts";
import type { StationCandidate } from "./oracle-station-arrival-domain.mts";
import type { NativeQuery, NativeSchema, NativeRow } from "./oracle-stage-arrival-snapshot.mts";
import { expression } from "./oracle-stage-arrival-snapshot.mts";
import { record, localDateTime } from "./contract-validation.mts";
import { fingerprint } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";

export const cancellationDependencies = ["SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"] as const;
export type CancellationEvidence = { candidates: StationCandidate[]; dependencies: Record<string, NativeRow[]> };
export type NativeCancellationSnapshot = CancellationSnapshot & {
  dependencies: CancellationSnapshot["dependencies"] & { completeEvidence: CancellationEvidence };
};
export function cancellationRow(v: unknown, columns: NativeSchema[string]): NativeRow {
  if (!record(v) || Object.keys(v).length !== columns.length) stageFail("INVALID_SOURCE_DATA");
  return Object.fromEntries(columns.map(c => {
    const value = v[c.name];
    if (value !== null && (typeof value !== "string" || !value.isWellFormed() || Buffer.byteLength(value) > 8192 ||
        c.kind === "date" && !localDateTime(value) ||
        c.kind === "number" && !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value))) stageFail("INVALID_SOURCE_DATA");
    return [c.name, value];
  }));
}
export async function cancellationSnapshot(q: NativeQuery, schema: NativeSchema, b: CancellationBindingV1,
  zone: string, signal?: AbortSignal): Promise<NativeCancellationSnapshot> {
  // Inquiry is shared, but neither exit eligibility nor exit writer authority
  // is reused. New schema projects every physical owned column.
  const base = await exitSnapshot(q, schema, b, zone, signal);
  const dependencies: Record<string, NativeRow[]> = {};
  for (const table of cancellationDependencies) {
    const column = table === "SHF_EMPLOYEE_REPORTS" ? "EMPLOYEE_ID" : "AGENT_DAY_ID";
    const key = table === "SHF_EMPLOYEE_REPORTS" ? b.employeeId : b.shiftDayId;
    const raw = await q(`/* cancellation:dependency:${table} */ SELECT ${schema[table].map(c =>
      `${expression(c)} AS "${c.name}"`).join(",")} FROM SHIFTER.${table}
      WHERE ${column}=TO_NUMBER(:key) AND ROWNUM<=1001`, { key }, 1001);
    if (raw.length > 1000) stageFail("INVALID_SOURCE_DATA");
    dependencies[table] = raw.map(v => cancellationRow(v, schema[table])).sort((a, c) => fingerprint(a).localeCompare(fingerprint(c)));
  }
  const overlap = stationOverlap(base.candidates, b.shiftDayId, base.planned, zone,
    base.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER!.slice(0, 8), () => checkStageBudget(signal));
  const f: NativeCancellationSnapshot = { employeeId: b.employeeId, shiftDayId: b.shiftDayId, orgUnitId: base.orgUnitId,
    planned: base.planned, policy: base.policy,
    policyProvenance: { early: base.rows.unit0 ?? base.rows.system0!, after: base.rows.unit1 ?? base.rows.system1! },
    rows: base.rows, dependencies: { reports: base.reports, exceptions: base.exceptions, overlap,
      completeEvidence: { candidates: base.candidates, dependencies } },
    source: "oracle-test", expectedDaySource: b.expectedDaySource, bindingScopeDigest: cancellationBindingScopeDigest(b),
    windowStart: b.windowStart, windowEnd: b.windowEnd, partnerReview: b.partnerReview };
  // Unknown nonneutral columns cannot silently become a new supported workflow.
  for (const [key, row] of Object.entries(f.rows)) {
    const table = key === "team" || key === "parent" ? "SHF_ORG_UNIT" : key === "mapping" ? "SHF_ORG_UNITS_SHF_SITES" :
      key.startsWith("system") ? "SHF_SYSTEM_PARAM" : key.startsWith("unit") ? "SHF_UNIT_PARAM" : key;
    if (!row || table === "SHF_ATTENDANCE") continue; // attendance pure rules inspect every column.
    const known = new Set<string>((exitTables as Record<string, readonly string[]>)[table]);
    for (const [column, value] of Object.entries(row))
      if (!known.has(column) && value !== null) stageFail("COMMAND_SCOPE_DEFERRED");
  }
  checkStageBudget(signal); return f;
}
export function assertCancellationCertified(f: NativeCancellationSnapshot, b: CancellationBindingV1) {
  if (f.source !== "oracle-test" || f.bindingScopeDigest !== b.cancellationCertificate.bindingScopeDigest ||
      completeCancellationOriginalsDigest(f) !== b.cancellationCertificate.completeOriginalsDigest)
    stageFail("STALE_PREPARATION");
}
