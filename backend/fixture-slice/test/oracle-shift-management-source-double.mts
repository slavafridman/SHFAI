// ISOLATED complete-source/catalog double, never a current DB observation.
import { oracleManagementSchema, oracleEmployee } from "./oracle-shift-management-double.mts";
import type { ShiftOracleColumn, ShiftOracleRow } from "../oracle-shift-management-sql.mts";
import type { NativeQuery } from "../oracle-stage-arrival-snapshot.mts";
import { shiftManagementSourceTables, shiftManagementPolicyKeys } from "../native-shift-management-scope.mts";
import { observeShiftManagementMetadata } from "../oracle-shift-management-metadata.mts";
import { metadataWaiverId } from "../native-metadata-limited.mts";
import type { NativeSourceScope } from "../oracle-shift-management-source.mts";
import { record } from "../contract-validation.mts";

export async function sourceFixture() {
  const schemas: Record<string, ShiftOracleColumn[]> = oracleManagementSchema();
  const col = (name: string, kind: ShiftOracleColumn["kind"]): ShiftOracleColumn =>
    ({ name, kind, nullable: true, dataLength: kind === "date" ? 7 : kind === "number" ? 22 : 500,
      charUsed: kind === "text" ? "B" : null, defaultSql: null });
  schemas.SHF_EMPLOYEE_DAY.push(...["WM_SHIFT_ID", "POOL_EXT_NUM"].map(n => col(n, "number")),
    ...["WM_SCH_STATE_DATA", "POOL_ERR"].map(n => col(n, "text")),
    ...["SPLIT_START", "SPLIT_END"].map(n => col(n, "date")));
  schemas.SHF_DAY_CHANGES.push(...["SWITCH_DAY_ID", "NEW_POOL_EXT_NUM"].map(n => col(n, "number")),
    ...["NEW_SPLIT_START", "NEW_SPLIT_END"].map(n => col(n, "date")));
  const fields: Record<string, Array<[string, ShiftOracleColumn["kind"]]>> = {
    SHF_ORG_UNIT: [["ORG_UNIT_ID", "text"], ["ORG_UNIT_NAME", "text"], ["UNIT_TYPE_ID", "text"], ["PARENT_UNIT", "text"]],
    SHF_ORG_UNITS_SHF_SITES: [["SOU_ORG_UNIT_ID", "text"], ["SS_SITE_ID", "number"]],
    SHF_SYSTEM_PARAM: [["PARAM_KEY", "text"], ["DEFAULT_VALUE", "text"]],
    SHF_UNIT_PARAM: [["PARAM_KEY", "text"], ["ORG_UNIT_ID", "text"], ["PARAM_VALUE", "text"]],
    SHF_ACTIVITY_TYPE: [["ACTIVITY_TYPE_ID", "number"], ["ACTIVITY_TYPE_NAME", "text"], ["SITE_ID", "number"]],
    SHF_EVENT_REASON: [["REASON_ID", "number"], ["REASON_DESC", "text"], ["SER_TYPE", "number"]],
    SHF_EMPLOYEE_REPORTS: [["SHF_EMPLOYEE_DAY_ID", "number"], ["EMPLOYEE_ID", "number"], ["APPROVED_TIME", "date"]],
    SHF_EMPLOYEE_EVENTS: [["EVENT_ID", "number"], ["EMPLOYEE_ID", "number"], ["EMPLOYEE_DAY_ID", "number"],
      ["EVENT_TIME", "date"], ["STATUS", "number"]],
    SHF_EMPLOYEE_EXCEPTIONS: [["AGENT_DAY_ID", "number"], ["START_TIME", "date"], ["END_TIME", "date"], ["STATE_TYPE", "number"]],
    SHF_EMPLOYEE_EXCEPTIONS_BASE: [["AGENT_DAY_ID", "number"], ["START_TIME", "date"], ["END_TIME", "date"], ["STATE_TYPE", "number"]],
    SHF_REPLACE_CANDIDATES: [["SHF_EMPLOYEE_DAY_ID", "number"], ["STATUS", "text"]],
    SHF_REPLACE_BREAK_CANDIDATES: [["SHF_EMPLOYEE_DAY_ID", "number"], ["STATUS", "text"]],
    SHF_TIME_CHANGE_CANDIDATES: [["EMPLOYEE_DAY_ID", "number"], ["APPROVE_TIME", "date"]],
    SHF_SHIFT_REDUCE_CANDIDATE: [["SHF_EMPLOYEE_DAY_ID", "number"], ["APPROVE_TIME", "date"]],
  };
  for (const [table, columns] of Object.entries(fields)) schemas[table] = columns.map(([n, k]) => col(n, k));
  const data: Record<string, ShiftOracleRow[]> = Object.fromEntries(shiftManagementSourceTables.map(t => [t, []]));
  data.SHF_EMPLOYEES = [oracleEmployee()];
  data.SHF_ORG_UNIT = [
    { ORG_UNIT_ID: "J01", ORG_UNIT_NAME: "סינתטי", UNIT_TYPE_ID: "J01", PARENT_UNIT: "M01" },
    { ORG_UNIT_ID: "M01", ORG_UNIT_NAME: "סינתטי", UNIT_TYPE_ID: "G01", PARENT_UNIT: null },
  ];
  data.SHF_ORG_UNITS_SHF_SITES = [{ SOU_ORG_UNIT_ID: "M01", SS_SITE_ID: "1" }];
  data.SHF_SYSTEM_PARAM = [
    { PARAM_KEY: shiftManagementPolicyKeys.minimum, DEFAULT_VALUE: "30" },
    { PARAM_KEY: shiftManagementPolicyKeys.maximum, DEFAULT_VALUE: "720" },
    { PARAM_KEY: shiftManagementPolicyKeys.gap, DEFAULT_VALUE: "1" },
    { PARAM_KEY: shiftManagementPolicyKeys.managed, DEFAULT_VALUE: "false" },
  ];
  data.SHF_ACTIVITY_TYPE = [{ ACTIVITY_TYPE_ID: "1", ACTIVITY_TYPE_NAME: "סינתטי", SITE_ID: "1" }];
  data.SHF_EVENT_REASON = [{ REASON_ID: "1", REASON_DESC: "סינתטי", SER_TYPE: "3" },
    { REASON_ID: "2", REASON_DESC: "סינתטי", SER_TYPE: "8" }];
  const tables = [...shiftManagementSourceTables];
  const columns = tables.flatMap(tableName => schemas[tableName].map(c => ({ tableName, columnName: c.name,
    dataType: c.kind === "text" ? "VARCHAR2" : c.kind === "date" ? "DATE" : "NUMBER",
    dataLength: c.dataLength, charUsed: c.charUsed, nullable: c.nullable ? "Y" : "N", virtualColumn: "NO" })));
  const metadataRows: Record<string, unknown[]> = {
    columns, properties: tables.flatMap(tableName => schemas[tableName].map(c => ({
      tableName, columnName: c.name, defaultSql: c.defaultSql, dataPrecision: c.kind === "number" ? 10 : null,
      dataScale: c.kind === "number" ? 0 : null, charLength: c.kind === "text" ? c.dataLength : 0, hiddenColumn: "NO",
    }))),
    constraints: tables.slice(0, 4).map((tableName, i) => ({ tableName, name: `ISOLATED_PK_${i}`, kind: "P",
      status: "ENABLED", validated: "VALIDATED", referencedOwner: null, referencedConstraint: null })),
    constraintColumns: tables.slice(0, 4).map((tableName, i) => ({ tableName, name: `ISOLATED_PK_${i}`,
      columnName: tableName === "SHF_EMPLOYEES" ? "EMPLOYEE_ID" : "SHF_EMPLOYEE_DAY_ID", position: 1 })),
    policies: [], tablePrivileges: [], columnPrivileges: [], dependencies: [], ownerTriggers: [],
    sequence: [{ owner: "SHIFTER", name: "SHF_AGENT_DAY_ID", minValue: "1", maxValue: "9999999999999999999999999999",
      incrementBy: "1", cycleFlag: "N", orderFlag: "N", cacheSize: "20" }],
    sequencePrivileges: [], charset: [{ charset: "IW8ISO8859P8" }],
  };
  const identity = { database: "ISOLATED", host: "isolated.invalid", service: "ISOLATED", user: "SHIFTER", schema: "SHIFTER" };
  const calls: string[] = [];
  const queryOn = async (view: Record<string, ShiftOracleRow[]>, sql: string, binds: import("oracledb").BindParameters,
    _bound: number): Promise<unknown[]> => {
    calls.push(sql);
    if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
    if (sql.includes("native:identity")) return [identity];
    if (sql.includes("metadata:readProbe:")) return [];
    const metaTag = /shf49:metadata:([A-Za-z]+)/.exec(sql)?.[1];
    const meta = metaTag === "readColumns" ? "columns" : metaTag === "readProperties" ? "properties" :
      metaTag === "readCharset" ? "charset" : metaTag;
    if (meta) { if (!Object.hasOwn(metadataRows, meta)) throw Error("Unknown isolated metadata query"); return structuredClone(metadataRows[meta]); }
    if (sql.includes("shf49:prefix")) return [{ EMPLOYEE_ID: "1" }];
    if (sql.includes("shf49:csvFullIdentity")) return [{ employeeId: "1" }];
    const core = sql.includes("shf49:employee") || sql.includes("shf49:csvIdentity") ? "SHF_EMPLOYEES" : sql.includes("shf49:days") ? "SHF_EMPLOYEE_DAY" :
      sql.includes("shf49:overlays") ? "SHF_DAY_CHANGES" : sql.includes("shf49:attendance") ? "SHF_ATTENDANCE" : undefined;
    const table = core ?? /shf49:source:([A-Z_]+)/.exec(sql)?.[1];
    if (!table || !Object.hasOwn(view, table)) throw Error("Unknown isolated source query");
    const names = [...sql.matchAll(/\bAS "([A-Z][A-Z0-9_]*)"/g)].map(m => m[1]);
    return view[table].map(row => Object.fromEntries(names.map(name => [name, row[name]])));
  };
  const query: NativeQuery = (sql, binds, bound) => queryOn(data, sql, binds, bound);
  const metadata = await observeShiftManagementMetadata(query, { provider: "owner-test-limited-v1", identity, tables,
    kind: "create", coverageWaiver: { id: metadataWaiverId, accepted: true, externalEffectsAssessment: "unknown-user-waived" } });
  const scope: NativeSourceScope = {
    reference: { namespace: "shift-management-v0.1", mode: "test-oracle-controlled", dataSource: "oracle-test",
      identityRevision: "isolated-source-identity", operatorScopeRevision: "isolated-source-scope",
      metadata: { provider: "owner-test-limited-v1", certificate: metadata.certificate, waiverId: metadataWaiverId,
        unavailable: ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"] } },
    employeeId: "1", orgUnitId: "J01", selectedDayId: null, kind: "create", overlayWrite: null,
    planningStartLocal: "2027-01-03T00:00:00", planningEndLocal: "2027-01-10T00:00:00",
    windowEnd: new Date(Date.now() + 120000).toISOString(), scopeFingerprint: "d".repeat(64), review: null,
  };
  return { schemas, data, query, queryOn, metadata, scope, calls, metadataRows };
}
