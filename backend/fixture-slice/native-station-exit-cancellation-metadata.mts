import { exact } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { exitTables } from "./oracle-station-exit-snapshot.mts";
import { nativeIdentity, nativeMetadataQueries } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeQuery, NativeSchema, NativeMetadataOperation } from "./oracle-stage-arrival-snapshot.mts";
import { limitedCollectorMethod, limitedMetadataCoverage, limitedObservationNames,
  parseScopedMetadataObservations } from "./native-metadata-limited.mts";
import type { CancellationBindingV1, CancellationMetadataProofV1 } from "./station-exit-cancellation-private-contracts.mts";
import { pilotEmployeeNumberColumn } from "./native-pilot-identity.mts";

export const cancellationOperation = "native-station-exit-cancellation-v0.1" satisfies NativeMetadataOperation;
export const cancellationTableScope = Object.freeze(Object.keys(exitTables));
export const cancellationWaiverId = "shf-test-exit-cancellation-two-view-waiver-v0.1";
const denied = (): never => stageFail("LIVE_WRITES_DISABLED");
export function cancellationMetadataProof(v: unknown): CancellationMetadataProofV1 {
  if (Buffer.byteLength(JSON.stringify(v) ?? "") > 1048576) return denied();
  const limited = record(v) && v.provider === "owner-test-limited-v1";
  if (!exact(v, limited ? ["version", "provider", "owner", "operation", "tableScope", "waiverId",
    "collectorMethod", "coverage", "observations", "ownerTriggers"] :
    ["version", "provider", "owner", "operation", "tableScope", "proof"]) ||
      v.owner !== "SHIFTER" || v.operation !== cancellationOperation ||
      !same(v.tableScope, cancellationTableScope)) return denied();
  let observations: unknown, triggers: unknown;
  if (limited) {
    if (v.version !== "shf-exit-cancellation-owner-test-limited-proof-v1" ||
        v.waiverId !== cancellationWaiverId || v.collectorMethod !== limitedCollectorMethod ||
        !same(v.coverage, limitedMetadataCoverage)) return denied();
    observations = v.observations; triggers = v.ownerTriggers;
  } else {
    if (v.version !== "shf-native-exit-cancellation-metadata-v1" ||
        !["dba-v1", "owner-hybrid-v1"].includes(String(v.provider)) ||
        !Array.isArray(v.proof) || v.proof.length !== 9 ||
        v.proof.some(a => !Array.isArray(a) || a.length > 1000)) return denied();
    const p = v.proof;
    observations = { columns: p[0], constraints: p[1], constraintColumns: p[2],
      policies: p[4], tablePrivileges: p[5], columnPrivileges: p[6], dependencies: p[8] };
    triggers = p[3];
    for (const r of p[7]) if (!exact(r, ["grantee", "role", "defaultRole"]) ||
        ![r.grantee, r.role].every(t => typeof t === "string" && t.length > 0 && t.length <= 256 &&
          t.isWellFormed() && !/[\p{Cc}\p{Cf}]/u.test(t)) ||
        !["YES", "NO"].includes(String(r.defaultRole))) return denied();
  }
  const parsed = parseScopedMetadataObservations(observations, triggers, cancellationTableScope);
  const arrays = [...Object.values(parsed.observations), parsed.triggers];
  if (arrays.some(a => new Set(a.map(r => fingerprint(r))).size !== a.length)) return denied();
  // Packet shape validation is not deployed metadata verification.
  return structuredClone(v) as CancellationMetadataProofV1;
}
export const cancellationMetadataDigest = (v: unknown) => fingerprint(cancellationMetadataProof(v));
export function cancellationSchema(packet: CancellationMetadataProofV1, writer: string): NativeSchema {
  const proof = cancellationMetadataProof(packet);
  const p = proof.provider === "owner-test-limited-v1" ?
    parseScopedMetadataObservations(proof.observations, proof.ownerTriggers, cancellationTableScope) :
    parseScopedMetadataObservations({ columns: proof.proof[0], constraints: proof.proof[1],
      constraintColumns: proof.proof[2], policies: proof.proof[4], tablePrivileges: proof.proof[5],
      columnPrivileges: proof.proof[6], dependencies: proof.proof[8] }, proof.proof[3], cancellationTableScope);
  const o = p.observations;
  if (!o.constraints.length || o.constraints.some(r => r.status !== "ENABLED" || r.validated !== "VALIDATED") ||
      p.triggers.some(r => r.status !== "DISABLED") || o.policies.some(r => r.enabled !== "NO")) return denied();
  for (const table of ["SHF_ATTENDANCE", "SHF_EMPLOYEE_DAY"]) {
    if (!o.constraints.some(r => r.tableName === table && ["P", "U"].includes(String(r.kind)) &&
        o.constraintColumns.filter(c => c.tableName === table && c.name === r.name).length === 1 &&
        o.constraintColumns.some(c => c.tableName === table && c.name === r.name &&
          c.columnName === "SHF_EMPLOYEE_DAY_ID" && c.position === 1))) return denied();
  }
  const schema: NativeSchema = {};
  for (const [table, required] of Object.entries(exitTables)) {
    const physical = o.columns.filter(r => r.tableName === table);
    schema[table] = physical.map(r => {
      if (typeof r.columnName !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(r.columnName) ||
          r.virtualColumn !== "NO") return denied();
      const kind = r.dataType === "DATE" ? "date" : r.dataType === "NUMBER" ? "number" :
        ["VARCHAR2", "CHAR", "NVARCHAR2", "NCHAR"].includes(String(r.dataType)) ? "text" : null;
      if (!kind) return denied();
      if (r.columnName === "EMP_ID_NUMBER" && table === "SHF_EMPLOYEES" &&
          !pilotEmployeeNumberColumn({ dataType: r.dataType, dataLength: r.dataLength, charUsed: r.charUsed })) return denied();
      // Preserve source types, rather than accepting a text/date impostor whose
      // current value happens to be NULL.
      if ((r.columnName.endsWith("_TIME") || /(?:DATETIME|SHIFT_START|SHIFT_END|SPLIT_START|SPLIT_END)$/.test(r.columnName)) &&
          kind !== "date") return denied();
      if (["SHF_EMPLOYEE_DAY_ID", "EMPLOYEE_ID", "AGENT_DAY_ID", "WM_SITE_ID", "NEW_SITE_ID", "SS_SITE_ID",
        "TADREECH", "WM_DAY_TYPE", "NEW_DAY_TYPE", "WM_EXCEPTION_TYPE_ID", "NEW_EXCEPTION_TYPE_ID", "CANCEL_REASON_CODE",
        "MISS_REASON_ID", "LATE_REASON_ID", "LATE_MINUTES", "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES"].includes(r.columnName) && kind !== "number") return denied();
      if (r.columnName.endsWith("_USER") && kind !== "text") return denied();
      if (["SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM"].includes(table) && kind !== "text" ||
          ["SHF_LOCKED", "SOU_ORG_UNIT_ID"].includes(r.columnName) && kind !== "text") return denied();
      if (["STATION_EXIT_TIME", "STATION_EXIT_USER"].includes(r.columnName) && table === "SHF_ATTENDANCE" &&
          (r.nullable !== "Y" || r.dataType !== (r.columnName === "STATION_EXIT_TIME" ? "DATE" : "VARCHAR2")))
        return denied();
      return { name: r.columnName, kind };
    });
    if (required.some(c => !schema[table].some(r => r.name === c)) ||
        new Set(schema[table].map(c => c.name)).size !== schema[table].length) return denied();
  }
  if (writer !== "SHIFTER" && !o.tablePrivileges.some(r => r.tableName === "SHF_ATTENDANCE" &&
      r.grantee === writer && r.privilege === "UPDATE") &&
      !["STATION_EXIT_TIME", "STATION_EXIT_USER"].every(column => o.columnPrivileges.some(r =>
        r.tableName === "SHF_ATTENDANCE" && r.columnName === column && r.grantee === writer && r.privilege === "UPDATE")))
    return denied();
  return schema;
}
export async function cancellationSafety(q: NativeQuery, b: CancellationBindingV1, readOnly = false): Promise<NativeSchema> {
  await nativeIdentity(q, readOnly ? b.readIdentity : b.writeIdentity);
  const observed: unknown[][] = [];
  for (const [i, sql] of nativeMetadataQueries(cancellationTableScope, b.metadataProvider).entries()) {
    const rows = await q(`/* cancellation:metadata:${i} */ ${sql}`,
      b.metadataProvider !== "owner-test-limited-v1" && i === 7 ? { writeUser: b.writeIdentity.user } : {}, 1001);
    if (rows.length > 1000) return denied();
    observed.push(rows);
  }
  const wrapper = b.metadataProvider === "owner-test-limited-v1" ? {
    version: "shf-exit-cancellation-owner-test-limited-proof-v1", provider: b.metadataProvider, owner: "SHIFTER",
    operation: cancellationOperation, tableScope: cancellationTableScope, waiverId: cancellationWaiverId,
    collectorMethod: limitedCollectorMethod, coverage: limitedMetadataCoverage,
    observations: Object.fromEntries(limitedObservationNames.map((n, i) => [n, observed[i]])),
    ownerTriggers: observed[7],
  } : { version: "shf-native-exit-cancellation-metadata-v1", provider: b.metadataProvider, owner: "SHIFTER",
    operation: cancellationOperation, tableScope: cancellationTableScope, proof: observed };
  const packet = cancellationMetadataProof(wrapper);
  if (!same(packet, b.cancellationCertificate.metadataProof) ||
      cancellationMetadataDigest(packet) !== b.cancellationMetadataDigest) return denied();
  const schema = cancellationSchema(packet, b.writeIdentity.user);
  for (const [table, columns] of Object.entries(schema))
    if ((await q(`/* cancellation:privilege:${table} */ SELECT ${columns.map(c => c.name).join(",")}
      FROM SHIFTER.${table} WHERE 1=0`, {}, 1)).length) return denied();
  return schema;
}
