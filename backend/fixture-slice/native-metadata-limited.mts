// Backend-private §48 evidence/admission. No provider, connection or public DTO.
import { exact } from "./stage-arrival-validation.mts";
import { record } from "./contract-validation.mts";
import { fingerprint, same } from "./stage-arrival-domain.mts";
import { stageFail } from "./stage-arrival-errors.mts";

export const metadataWaiverId = "shf-test-dba-two-view-waiver-20261028-v0.1";
export type MetadataCoverageWaiver = {
  id: typeof metadataWaiverId; accepted: true; externalEffectsAssessment: "unknown-user-waived";
};
export function parseMetadataCoverageWaiver(v: unknown): MetadataCoverageWaiver {
  if (!exact(v, ["id", "accepted", "externalEffectsAssessment"]) || v.id !== metadataWaiverId ||
      v.accepted !== true || v.externalEffectsAssessment !== "unknown-user-waived")
    throw Error("Exact explicit TEST metadata coverage waiver required");
  return Object.freeze({ id: metadataWaiverId, accepted: true, externalEffectsAssessment: "unknown-user-waived" });
}
export const limitedMetadataCoverage = Object.freeze({
  kind: "owner-only-two-dba-scopes-user-waived" as const,
  unavailable: Object.freeze([
    Object.freeze({ view: "DBA_TRIGGERS", formerSlot: 3, state: "unknown-user-waived" } as const),
    Object.freeze({ view: "DBA_ROLE_PRIVS", formerSlot: 7, state: "unknown-user-waived" } as const),
  ] as const),
  ownerTriggers: "owner-only-observed" as const,
});
export const limitedCollectorMethod = "user-tab-cols-visible-v1";
export type LimitedOperation = "native-stage-arrival-v0.1" | "native-station-arrival-v0.1" | "native-station-exit-v0.1"
  | "native-shift-management-v0.1";
export const limitedObservationNames = ["columns", "constraints", "constraintColumns", "policies",
  "tablePrivileges", "columnPrivileges", "dependencies"] as const;
export type ParsedMetadataRow = Record<string, string | number | null>;
export type LimitedObservations = Record<typeof limitedObservationNames[number], ParsedMetadataRow[]>;
export interface LimitedMetadataEvidence {
  version: "shf-owner-test-limited-proof-v1"; provider: "owner-test-limited-v1"; owner: "SHIFTER";
  operation: LimitedOperation; tableScope: string[]; waiverId: typeof metadataWaiverId;
  collectorMethod: typeof limitedCollectorMethod;
  coverage: typeof limitedMetadataCoverage;
  observations: LimitedObservations; ownerTriggers: ParsedMetadataRow[];
}
const fail = (): never => stageFail("LIVE_WRITES_DISABLED");
const label = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 256 &&
  v.isWellFormed() && !/[\p{Cc}]/u.test(v);
const nullableLabel = (v: unknown) => v === null || label(v);
const positive = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const columns = { tableName: label, columnName: label, dataType: label,
  dataLength: (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0,
  charUsed: (v: unknown) => v === null || v === "B" || v === "C",
  nullable: (v: unknown) => v === "Y" || v === "N", virtualColumn: (v: unknown) => v === "YES" || v === "NO" };
const shapes: Record<string, Record<string, (v: unknown) => boolean>> = {
  columns,
  constraints: { tableName: label, name: label, kind: label, status: label, validated: label,
    referencedOwner: nullableLabel, referencedConstraint: nullableLabel },
  constraintColumns: { tableName: label, name: label, columnName: label, position: (v: unknown) => v === null || positive(v) },
  policies: { tableName: label, name: label, enabled: (v: unknown) => v === "YES" || v === "NO" },
  tablePrivileges: { tableName: label, grantee: label, privilege: label },
  columnPrivileges: { tableName: label, columnName: label, grantee: label, privilege: label },
  dependencies: { name: label, type: label, referencedOwner: nullableLabel,
    referencedName: nullableLabel, referencedType: nullableLabel },
  ownerTriggers: { tableName: label, name: label, status: (v: unknown) => v === "ENABLED" || v === "DISABLED" },
};
function rows(value: unknown, name: string, scope: readonly string[]): ParsedMetadataRow[] {
  if (!Array.isArray(value) || value.length > 1000) return fail();
  return Array.from(value, r => {
    const shape = shapes[name];
    if (!exact(r, Object.keys(shape))) return fail();
    const result: ParsedMetadataRow = {};
    for (const [k, check] of Object.entries(shape)) {
      const v = r[k];
      if (!check(v) || !(v === null || typeof v === "string" || typeof v === "number")) return fail();
      result[k] = v;
    }
    if (!scope.includes(String(result[name === "dependencies" ? "name" : "tableName"]))) return fail();
    return result;
  });
}
function validateConstraintPositions(constraints: ParsedMetadataRow[], members: ParsedMetadataRow[]) {
  const definitions = new Map<string, { kind: string; columns: Set<string>; nextPosition: number; count: number }>();
  const key = (tableName: string, name: string) => JSON.stringify([tableName, name]);
  for (const c of constraints) {
    if (typeof c.tableName !== "string" || typeof c.name !== "string" || typeof c.kind !== "string") return fail();
    const id = key(c.tableName, c.name);
    if (definitions.has(id)) return fail();
    definitions.set(id, { kind: c.kind, columns: new Set(), nextPosition: 1, count: 0 });
  }
  for (const c of members) {
    if (typeof c.tableName !== "string" || typeof c.name !== "string" || typeof c.columnName !== "string") return fail();
    const definition = definitions.get(key(c.tableName, c.name));
    if (!definition || definition.columns.has(c.columnName)) return fail();
    definition.columns.add(c.columnName); definition.count++;
    // Oracle CHECK constraints are non-positional. Preserve explicit NULL (or
    // an observed positive ordinal) verbatim; multiple NULLs are not key order.
    if (definition.kind === "C") {
      if (c.position !== null && !positive(c.position)) return fail();
    } else if (["P", "U", "R"].includes(definition.kind)) {
      // Check the ORIGINAL observation sequence; no sorting, gap repair,
      // coercion or NULL-to-zero/default normalization can certify a key.
      if (!positive(c.position) || c.position !== definition.nextPosition) return fail();
      definition.nextPosition++;
    } else return fail();
  }
  for (const d of definitions.values())
    if (["P", "U", "R"].includes(d.kind) && d.count === 0) return fail();
}
export function parseLimitedMetadataEvidence(v: unknown, operation: LimitedOperation,
  tableScope: readonly string[]): LimitedMetadataEvidence {
  if (!["native-stage-arrival-v0.1", "native-station-arrival-v0.1", "native-station-exit-v0.1", "native-shift-management-v0.1"].includes(operation) ||
      !tableScope.length || new Set(tableScope).size !== tableScope.length ||
      tableScope.some(t => !/^[A-Z][A-Z0-9_]{0,29}$/.test(t)) ||
      !exact(v, ["version", "provider", "owner", "operation", "tableScope", "waiverId", "collectorMethod",
        "coverage", "observations", "ownerTriggers"]) ||
      v.version !== "shf-owner-test-limited-proof-v1" || v.provider !== "owner-test-limited-v1" ||
      v.owner !== "SHIFTER" || v.operation !== operation || v.waiverId !== metadataWaiverId ||
      v.collectorMethod !== limitedCollectorMethod || !same(v.tableScope, tableScope) ||
      !same(v.coverage, limitedMetadataCoverage) || !exact(v.observations, limitedObservationNames))
    return fail();
  const o = v.observations;
  const observations: LimitedObservations = {
    columns: rows(o.columns, "columns", tableScope), constraints: rows(o.constraints, "constraints", tableScope),
    constraintColumns: rows(o.constraintColumns, "constraintColumns", tableScope), policies: rows(o.policies, "policies", tableScope),
    tablePrivileges: rows(o.tablePrivileges, "tablePrivileges", tableScope),
    columnPrivileges: rows(o.columnPrivileges, "columnPrivileges", tableScope), dependencies: rows(o.dependencies, "dependencies", tableScope),
  };
  validateConstraintPositions(observations.constraints, observations.constraintColumns);
  return { version: "shf-owner-test-limited-proof-v1", provider: "owner-test-limited-v1", owner: "SHIFTER",
    operation, tableScope: [...tableScope], waiverId: metadataWaiverId, collectorMethod: limitedCollectorMethod,
    coverage: limitedMetadataCoverage, observations, ownerTriggers: rows(v.ownerTriggers, "ownerTriggers", tableScope) };
}
// Shared row-shape/cardinality validation only: no provider/coverage waiver or
// "no external effects" assertion is manufactured for nonlimited consumers.
export function parseScopedMetadataObservations(value: unknown, triggers: unknown,
  tableScope: readonly string[]): { observations: LimitedObservations; triggers: ParsedMetadataRow[] } {
  if (!exact(value, limitedObservationNames)) return fail();
  const observations: LimitedObservations = {
    columns: rows(value.columns, "columns", tableScope),
    constraints: rows(value.constraints, "constraints", tableScope),
    constraintColumns: rows(value.constraintColumns, "constraintColumns", tableScope),
    policies: rows(value.policies, "policies", tableScope),
    tablePrivileges: rows(value.tablePrivileges, "tablePrivileges", tableScope),
    columnPrivileges: rows(value.columnPrivileges, "columnPrivileges", tableScope),
    dependencies: rows(value.dependencies, "dependencies", tableScope),
  };
  validateConstraintPositions(observations.constraints, observations.constraintColumns);
  return { observations, triggers: rows(triggers, "ownerTriggers", tableScope) };
}
export function limitedMetadataDigest(v: unknown, operation: LimitedOperation, scope: readonly string[]) {
  return fingerprint(parseLimitedMetadataEvidence(v, operation, scope));
}
export const limitedMetadataWarning = "WARNING: TEST LIMITED METADATA COVERAGE — DBA_TRIGGERS and DBA_ROLE_PRIVS unavailable scopes ignored by explicit user waiver (2026-10-28). Cross-owner triggers and role/PUBLIC grants remain UNKNOWN; database safety and full rollback are NOT certified.";
export function validateLimitedMetadataStartup(env: NodeJS.ProcessEnv, config: unknown): boolean {
  const flag = env.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED;
  if (flag !== undefined && flag !== "false" && flag !== "true") throw Error("Invalid TEST limited metadata opt-in");
  if (!record(config)) throw Error("Explicit backend configuration required");
  const modes = [
    ["attendanceStageArrivalMode", "SHF_NATIVE_STAGE_BINDING", "SHF_TEST_ORACLE_STAGE_WRITE_ENABLED", "SHF_NATIVE_STAGE_"],
    ["attendanceStationArrivalMode", "SHF_NATIVE_STATION_BINDING", "SHF_TEST_ORACLE_STATION_WRITE_ENABLED", "SHF_NATIVE_STATION_"],
    ["attendanceStationExitMode", "SHF_NATIVE_EXIT_BINDING", "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED", "SHF_NATIVE_EXIT_"],
  ];
  const active = modes.filter(([mode]) => config[mode] === "test-oracle-controlled");
  const selected = active.some(([, key]) => {
    const packet: unknown = JSON.parse(env[key] ?? "null");
    return record(packet) && packet.metadataProvider === "owner-test-limited-v1";
  });
  if (!selected) {
    if (flag === "true") throw Error("Limited metadata flag requires an explicitly selected limited native operation");
    return false;
  }
  if (flag !== "true" || env.SHF_APP_ENV !== "test" || env.NODE_ENV === "production" ||
      config.deploymentClass !== "isolated-test-demo" || config.dataSource !== "oracle-read-only" ||
      config.oracleTestScopeConfirmed !== true || config.authenticationMode !== "synthetic" ||
      config.syntheticAdministratorEnabled !== true || active.length !== 1 || env[active[0][2]] !== "true")
    throw Error("Explicit isolated TEST limited metadata admission required");
  if (modes.some(([mode, , flag, prefix]) => config[mode] !== "test-oracle-controlled" &&
      (config[mode] !== undefined && config[mode] !== "disabled" ||
       env[flag] !== undefined && env[flag] !== "false" || Object.keys(env).some(k => k.startsWith(prefix)))) ||
      Object.keys(env).some(k => k.endsWith("_FIXTURE") || k.startsWith("SHF_FIXTURE_")))
    throw Error("Limited metadata requires one native operation without fixture/native mixing");
  return true;
}
export function requireLimitedMetadataEnvironment(env: NodeJS.ProcessEnv) {
  const config: unknown = JSON.parse(env.SHF_ORACLE_CONFIG ?? "null");
  if (!validateLimitedMetadataStartup(env, config)) throw Error("Limited TEST environment required");
}
