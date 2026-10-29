// Operation-separated actual catalog collection. Observation is not operator GO.
// No NEXTVAL/default evaluation, DML, privilege grants or legacy helper calls.
import type { NativeQuery } from "./oracle-stage-arrival-snapshot.mts";
import { nativeIdentity, nativeMetadataQueries } from "./oracle-stage-arrival-snapshot.mts";
import type { NativeIdentity, NativeMetadataProvider } from "./native-stage-arrival-config.mts";
import { nativeTargetReference, parseMetadataProvider, parseNativeIdentity } from "./native-stage-arrival-config.mts";
import { parseScopedMetadataObservations, limitedMetadataCoverage, parseMetadataCoverageWaiver,
  limitedObservationNames } from "./native-metadata-limited.mts";
import type { MetadataCoverageWaiver } from "./native-metadata-limited.mts";
import type { ShiftOperationKindV1 } from "./shift-management-contracts.mts";
import type { ShiftOracleColumn, ShiftOracleSchema } from "./oracle-shift-management-sql.mts";
import { validateShiftOracleSchema } from "./oracle-shift-management-sql.mts";
import { exact } from "./stage-arrival-validation.mts";
import { text } from "./contract-validation.mts";
import { fingerprint } from "./stage-arrival-domain.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { shiftFail, ShiftManagementError } from "./shift-management-errors.mts";

export const shiftManagementMetadataOperation = "native-shift-management-v0.1";
export interface ShiftManagementMetadataOptions {
  provider: NativeMetadataProvider; identity: NativeIdentity; tables: readonly string[];
  kind: ShiftOperationKindV1; coverageWaiver?: MetadataCoverageWaiver;
}
interface ColumnProperty {
  tableName: string; columnName: string; defaultSql: string | null;
  dataPrecision: number | null; dataScale: number | null; charLength: number; hiddenColumn: "NO";
}
interface SequenceFacts {
  owner: "SHIFTER"; name: "SHF_AGENT_DAY_ID"; minValue: string; maxValue: string;
  incrementBy: string; cycleFlag: "N"; orderFlag: "Y" | "N"; cacheSize: string;
}
const coreTables = ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE"] as const;
function checkedOptions(options: ShiftManagementMetadataOptions) {
  if (!exact(options, options.provider === "owner-test-limited-v1" ?
    ["provider", "identity", "tables", "kind", "coverageWaiver"] : ["provider", "identity", "tables", "kind"]) ||
      !Array.isArray(options.tables) || options.tables.length < 4 || options.tables.length > 32 ||
      new Set(options.tables).size !== options.tables.length ||
      options.tables.some(table => !/^[A-Z][A-Z0-9_]{0,29}$/.test(table)) ||
      coreTables.some(table => !options.tables.includes(table)) ||
      !["create", "change", "cancel", "csv-create"].includes(options.kind)) shiftFail("LIVE_WRITES_DISABLED");
  parseMetadataProvider(options.provider);
  const identity = parseNativeIdentity(options.identity);
  if (options.provider !== "dba-v1" && (identity.user !== "SHIFTER" || identity.schema !== "SHIFTER"))
    shiftFail("LIVE_WRITES_DISABLED");
  if (options.provider === "owner-test-limited-v1") parseMetadataCoverageWaiver(options.coverageWaiver);
  return identity;
}
function catalogColumns(options: ShiftManagementMetadataOptions, properties: boolean) {
  const dba = options.provider === "dba-v1", list = options.tables.map(table => `'${table}'`).join(",");
  const selected = properties ?
    `tc.data_default AS "defaultSql",tc.data_precision AS "dataPrecision",tc.data_scale AS "dataScale",
      tc.char_length AS "charLength",tc.hidden_column AS "hiddenColumn"` :
    `tc.data_type AS "dataType",tc.data_length AS "dataLength",tc.char_used AS "charUsed",
      tc.nullable AS "nullable",tc.virtual_column AS "virtualColumn"`;
  // COLS, not COLUMNS: Oracle11's visible-only VIRTUAL_COLUMN source is real.
  return `SELECT tc.table_name AS "tableName",tc.column_name AS "columnName",${selected}
    FROM ${dba ? "dba" : "user"}_tab_cols tc WHERE ${dba ? "tc.owner='SHIFTER' AND" : ""}
      tc.table_name IN (${list}) AND tc.hidden_column='NO' AND EXISTS
      (SELECT 1 FROM ${dba ? "dba" : "user"}_tables tt WHERE ${dba ? "tt.owner=tc.owner AND" : ""}
        tt.table_name=tc.table_name AND tt.temporary='N') ORDER BY tc.table_name,tc.column_id`;
}
function properties(rows: unknown[], tables: readonly string[]): ColumnProperty[] {
  const result: ColumnProperty[] = [], seen = new Set<string>();
  for (const row of rows) {
    if (!exact(row, ["tableName", "columnName", "defaultSql", "dataPrecision", "dataScale", "charLength", "hiddenColumn"]) ||
        typeof row.tableName !== "string" || !tables.includes(row.tableName) ||
        typeof row.columnName !== "string" || !/^[A-Z][A-Z0-9_]{0,29}$/.test(row.columnName) ||
        !(row.defaultSql === null || text(row.defaultSql, 8192)) ||
        !(row.dataPrecision === null || typeof row.dataPrecision === "number" &&
          Number.isInteger(row.dataPrecision) && row.dataPrecision >= 1 && row.dataPrecision <= 38) ||
        !(row.dataScale === null || typeof row.dataScale === "number" &&
          Number.isInteger(row.dataScale) && row.dataScale >= -84 && row.dataScale <= 127) ||
        typeof row.charLength !== "number" || !Number.isSafeInteger(row.charLength) || row.charLength < 0 ||
        row.hiddenColumn !== "NO") shiftFail("LIVE_WRITES_DISABLED");
    const key = row.tableName + "/" + row.columnName;
    if (seen.has(key)) shiftFail("LIVE_WRITES_DISABLED");
    seen.add(key);
    result.push({ tableName: row.tableName, columnName: row.columnName, defaultSql: row.defaultSql,
      dataPrecision: row.dataPrecision, dataScale: row.dataScale, charLength: row.charLength, hiddenColumn: "NO" });
  }
  return result;
}
function sequence(rows: unknown[]): SequenceFacts {
  const row = rows[0], integer = (v: unknown) => typeof v === "string" && /^(?:0|[1-9][0-9]{0,37})$/.test(v);
  if (rows.length !== 1 || !exact(row, ["owner", "name", "minValue", "maxValue", "incrementBy", "cycleFlag", "orderFlag", "cacheSize"]) ||
      row.owner !== "SHIFTER" || row.name !== "SHF_AGENT_DAY_ID" ||
      typeof row.minValue !== "string" || !integer(row.minValue) || BigInt(row.minValue) < 1n ||
      typeof row.maxValue !== "string" || !integer(row.maxValue) || BigInt(row.maxValue) < BigInt(row.minValue) ||
      typeof row.incrementBy !== "string" || !integer(row.incrementBy) || BigInt(row.incrementBy) < 1n ||
      row.cycleFlag !== "N" || row.orderFlag !== "Y" && row.orderFlag !== "N" ||
      typeof row.cacheSize !== "string" || !integer(row.cacheSize)) shiftFail("LIVE_WRITES_DISABLED");
  return { owner: "SHIFTER", name: "SHF_AGENT_DAY_ID", minValue: row.minValue, maxValue: row.maxValue,
    incrementBy: row.incrementBy, cycleFlag: "N", orderFlag: row.orderFlag, cacheSize: row.cacheSize };
}
export async function observeShiftManagementMetadata(query: NativeQuery, options: ShiftManagementMetadataOptions,
  signal?: AbortSignal) {
  try {
    assertShiftWorkAllowed(signal);
    const identity = checkedOptions(options), limited = options.provider === "owner-test-limited-v1";
    const q: NativeQuery = async (sql, binds, bound) => {
      assertShiftWorkAllowed(signal);
      const result = await query(sql.replace(/^(\/\*.*?\*\/)\s*SELECT\b/is, "SELECT $1"), binds, bound);
      assertShiftWorkAllowed(signal);
      if (!Array.isArray(result) || result.length > 1000) shiftFail("LIVE_WRITES_DISABLED");
      return result;
    };
    await nativeIdentity(q, identity);
    const queries = [...nativeMetadataQueries([...options.tables], options.provider)];
    queries[0] = catalogColumns(options, false); // New operation only; old SQL/digests unchanged.
    const labels = limited ? [...limitedObservationNames, "ownerTriggers"] :
      ["columns", "constraints", "constraintColumns", "triggers", "policies", "tablePrivileges", "columnPrivileges", "roles", "dependencies"];
    const observed = new Map<string, unknown[]>();
    for (let i = 0; i < queries.length; i++) {
      const sql = queries[i].replace(/^SELECT\b/i, `SELECT /* shf49:metadata:${labels[i]} */`);
      observed.set(labels[i], await q(sql, !limited && i === 7 ? { writeUser: identity.user } : {}, 1001));
    }
    const parsed = parseScopedMetadataObservations({
      columns: observed.get("columns"), constraints: observed.get("constraints"),
      constraintColumns: observed.get("constraintColumns"), policies: observed.get("policies"),
      tablePrivileges: observed.get("tablePrivileges"), columnPrivileges: observed.get("columnPrivileges"),
      dependencies: observed.get("dependencies"),
    }, observed.get(limited ? "ownerTriggers" : "triggers"), options.tables);
    const facts = parsed.observations;
    if (!facts.constraints.length || facts.constraints.some(row => row.status !== "ENABLED" || row.validated !== "VALIDATED") ||
        parsed.triggers.some(row => row.status !== "DISABLED") || facts.policies.some(row => row.enabled !== "NO") ||
        facts.columns.some(row => row.virtualColumn !== "NO")) shiftFail("LIVE_WRITES_DISABLED");
    const roles = observed.get("roles") ?? [];
    if (!limited && roles.some(row => !exact(row, ["grantee", "role", "defaultRole"]) ||
        row.grantee !== identity.user && row.grantee !== "PUBLIC" || !text(row.role, 128, 1) ||
        row.defaultRole !== "YES" && row.defaultRole !== "NO")) shiftFail("LIVE_WRITES_DISABLED");
    const extended = properties(await q(catalogColumns(options, true)
      .replace(/^SELECT\b/i, "SELECT /* shf49:metadata:properties */"), {}, 1001), options.tables);
    if (extended.length !== facts.columns.length) shiftFail("LIVE_WRITES_DISABLED");
    const schemas: Record<string, ShiftOracleColumn[]> = {};
    for (const table of options.tables) {
      schemas[table] = [];
      for (const row of facts.columns.filter(row => row.tableName === table)) {
        const prop = extended.find(prop => prop.tableName === table && prop.columnName === row.columnName);
        const readOnlyText = !coreTables.some(coreTable => coreTable === table) &&
          ["NVARCHAR2", "NCHAR", "LONG"].includes(String(row.dataType));
        const kind = row.dataType === "DATE" ? "date" : row.dataType === "NUMBER" ? "number" :
          row.dataType === "VARCHAR2" || row.dataType === "CHAR" || readOnlyText ? "text" : null;
        if (!prop || kind === null || typeof row.columnName !== "string" ||
            typeof row.dataLength !== "number" || row.dataLength < 0 ||
            row.dataLength === 0 && !(readOnlyText && row.dataType === "LONG") ||
            row.charUsed !== "B" && row.charUsed !== "C" && row.charUsed !== null)
          shiftFail("LIVE_WRITES_DISABLED");
        schemas[table].push({ name: row.columnName, kind, nullable: row.nullable === "Y",
          dataLength: row.dataLength, charUsed: row.charUsed, defaultSql: prop.defaultSql });
      }
      if (!schemas[table].length || new Set(schemas[table].map(c => c.name)).size !== schemas[table].length)
        shiftFail("LIVE_WRITES_DISABLED");
    }
    const core: ShiftOracleSchema = { SHF_EMPLOYEES: schemas.SHF_EMPLOYEES, SHF_EMPLOYEE_DAY: schemas.SHF_EMPLOYEE_DAY,
      SHF_DAY_CHANGES: schemas.SHF_DAY_CHANGES, SHF_ATTENDANCE: schemas.SHF_ATTENDANCE };
    validateShiftOracleSchema(core);
    for (const [table, names] of [
      ["SHF_EMPLOYEE_DAY", ["REMARK", "SOURCE"]],
      ["SHF_DAY_CHANGES", ["MODIFICATION_USER", "CANCEL_REASON_CODE", "CANCEL_REASON_REMARK"]],
    ] as const) {
      for (const name of names) {
        const row = facts.columns.find(row => row.tableName === table && row.columnName === name);
        if (!row || row.dataType !== "VARCHAR2" || row.charUsed !== "B") shiftFail("LIVE_WRITES_DISABLED");
      }
    }
    for (const table of coreTables) {
      const pks = facts.constraints.filter(row => row.tableName === table && row.kind === "P");
      if (pks.length !== 1) shiftFail("LIVE_WRITES_DISABLED");
      const members = facts.constraintColumns.filter(row => row.tableName === table && row.name === pks[0].name);
      if (members.length !== 1 || members[0].columnName !==
          (table === "SHF_EMPLOYEES" ? "EMPLOYEE_ID" : "SHF_EMPLOYEE_DAY_ID")) shiftFail("LIVE_WRITES_DISABLED");
    }
    const creates = options.kind === "create" || options.kind === "csv-create";
    const dba = options.provider === "dba-v1";
    const sequenceFacts = creates ? sequence(await q(`SELECT /* shf49:metadata:sequence */
      ${dba ? "sequence_owner" : "'SHIFTER'"} AS "owner",sequence_name AS "name",
      TO_CHAR(min_value,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "minValue",
      TO_CHAR(max_value,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "maxValue",
      TO_CHAR(increment_by,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "incrementBy",
      cycle_flag AS "cycleFlag",order_flag AS "orderFlag",
      TO_CHAR(cache_size,'TM9','NLS_NUMERIC_CHARACTERS=''.,''') AS "cacheSize"
      FROM ${dba ? "dba" : "user"}_sequences WHERE ${dba ? "sequence_owner='SHIFTER' AND" : ""}
      sequence_name='SHF_AGENT_DAY_ID'`, {}, 2)) : null;
    const sequencePrivileges = creates ? await q(`SELECT /* shf49:metadata:sequencePrivileges */
      owner AS "owner",table_name AS "name",grantee AS "grantee",privilege AS "privilege"
      FROM ${dba ? "dba" : "user"}_tab_privs WHERE owner='SHIFTER' AND table_name='SHF_AGENT_DAY_ID'
      ORDER BY grantee,privilege`, {}, 1001) : [];
    if (sequencePrivileges.some(row => !exact(row, ["owner", "name", "grantee", "privilege"]) ||
        row.owner !== "SHIFTER" || row.name !== "SHF_AGENT_DAY_ID" ||
        !text(row.grantee, 128, 1) || !text(row.privilege, 128, 1))) shiftFail("LIVE_WRITES_DISABLED");
    if (creates && identity.user !== "SHIFTER" && !sequencePrivileges.some(row =>
      exact(row, ["owner", "name", "grantee", "privilege"]) && row.grantee === identity.user && row.privilege === "SELECT"))
      shiftFail("LIVE_WRITES_DISABLED");
    const tableGrant = (table: string, privilege: string, columns: readonly string[]) =>
      identity.user === "SHIFTER" || facts.tablePrivileges.some(row =>
        row.tableName === table && row.grantee === identity.user && row.privilege === privilege) ||
      columns.every(column => facts.columnPrivileges.some(row => row.tableName === table &&
        row.columnName === column && row.grantee === identity.user && row.privilege === privilege));
    if (creates ? !tableGrant("SHF_EMPLOYEE_DAY", "INSERT", ["SHF_EMPLOYEE_DAY_ID", "WM_DATE", "WM_DAY_TYPE",
      "EMP_ID_NUMBER", "SOURCE", "WM_SCH_ACTIVITY_ID_DATA", "WM_START_DATETIME", "WM_END_DATETIME",
      "WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME", "WM_SITE_ID", "WM_PAID_MINUTES", "WM_WORK_MINUTES",
      "REMARK", "WORK_FROM_HOME", "SPLIT_SHIFT"]) :
      !tableGrant("SHF_EMPLOYEE_DAY", "UPDATE", ["SOURCE"]) ||
      !facts.tablePrivileges.some(row => row.tableName === "SHF_DAY_CHANGES" && row.grantee === identity.user &&
        row.privilege === "INSERT") && identity.user !== "SHIFTER" ||
      !tableGrant("SHF_DAY_CHANGES", "UPDATE", options.kind === "cancel" ?
        ["NEW_DAY_TYPE", "NEW_EMPLOYEE_ID", "CANCEL_REASON_CODE", "CANCEL_REASON_REMARK", "MODIFICATION_TIME", "MODIFICATION_USER"] :
        ["NEW_DAY_START", "NEW_SHIFT_START", "NEW_DAY_END", "NEW_SHIFT_END", "NEW_ACTIVITY", "NEW_WORK_FROM_HOME",
          "NEW_PAID_MINUTES", "NEW_WORK_MINUTES", "START_CHANGE_REASON", "END_CHANGE_REASON", "MODIFICATION_TIME", "MODIFICATION_USER"]))
      shiftFail("LIVE_WRITES_DISABLED");
    const charsetRows = await q(`SELECT /* shf49:metadata:charset */ value AS "charset"
      FROM nls_database_parameters WHERE parameter='NLS_CHARACTERSET'`, {}, 2), charsetRow = charsetRows[0];
    if (charsetRows.length !== 1 || !exact(charsetRow, ["charset"]) ||
        charsetRow.charset !== "AL32UTF8" && charsetRow.charset !== "IW8ISO8859P8") shiftFail("LIVE_WRITES_DISABLED");
    for (const table of options.tables) {
      const rows = await q(`SELECT /* shf49:metadata:readProbe:${table} */ ${schemas[table].map(c => c.name).join(",")}
        FROM SHIFTER.${table} WHERE 1=0`, {}, 1);
      if (rows.length !== 0) shiftFail("LIVE_WRITES_DISABLED");
    }
    const coverage = limited ? { kind: limitedMetadataCoverage.kind, unavailable: ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"],
      externalEffectsAssessment: "unknown-user-waived" } :
      { kind: "catalog-observed", unavailable: [], externalEffectsAssessment: "catalog-scoped" };
    const proof = { version: "shf-management-metadata-v1", operation: shiftManagementMetadataOperation,
      provider: options.provider, owner: "SHIFTER", kind: options.kind, tableScope: [...options.tables],
      identity: nativeTargetReference(identity), coverage, observations: facts, triggers: parsed.triggers,
      ...(limited ? {} : { roles }), properties: extended, sequence: sequenceFacts, sequencePrivileges,
      charset: charsetRow.charset };
    return { certificate: fingerprint(proof), proof, coverage, schemas, core, properties: extended,
      sequence: sequenceFacts, charset: charsetRow.charset, observations: facts };
  } catch (error) {
    if (error instanceof ShiftManagementError && error.code === "DEPENDENCY_TIMEOUT") throw error;
    return shiftFail("LIVE_WRITES_DISABLED");
  }
}
export async function certifyShiftManagementMetadata(query: NativeQuery, options: ShiftManagementMetadataOptions,
  expectedCertificate: string, signal?: AbortSignal) {
  if (typeof expectedCertificate !== "string" || !/^[0-9a-f]{64}$/.test(expectedCertificate))
    shiftFail("LIVE_WRITES_DISABLED");
  const observed = await observeShiftManagementMetadata(query, options, signal);
  if (observed.certificate !== expectedCertificate) shiftFail("LIVE_WRITES_DISABLED");
  return observed;
}
