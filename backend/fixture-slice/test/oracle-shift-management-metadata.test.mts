import test from "node:test";
import assert from "node:assert/strict";
import { observeShiftManagementMetadata, certifyShiftManagementMetadata } from "../oracle-shift-management-metadata.mts";
import type { ShiftManagementMetadataOptions } from "../oracle-shift-management-metadata.mts";
import { oracleManagementSchema } from "./oracle-shift-management-double.mts";
import type { NativeQuery } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeMetadataProvider } from "../native-stage-arrival-config.mts";
import { metadataWaiverId } from "../native-metadata-limited.mts";

function fixture(provider: NativeMetadataProvider = "owner-test-limited-v1") {
  const schema = oracleManagementSchema(), tables = Object.keys(schema), calls: string[] = [];
  const columns = Object.entries(schema).flatMap(([tableName, members]) => members.map(c => ({
    tableName, columnName: c.name, dataType: c.kind === "text" ? "VARCHAR2" : c.kind === "date" ? "DATE" : "NUMBER",
    dataLength: c.dataLength, charUsed: c.charUsed, nullable: c.nullable ? "Y" : "N", virtualColumn: "NO",
  })));
  const properties = Object.entries(schema).flatMap(([tableName, members]) => members.map(c => ({
    tableName, columnName: c.name, defaultSql: c.defaultSql, dataPrecision: c.kind === "number" ? 10 : null,
    dataScale: c.kind === "number" ? 0 : null, charLength: c.kind === "text" ? c.dataLength : 0, hiddenColumn: "NO",
  })));
  const constraints = tables.map((tableName, i) => ({ tableName, name: `ISOLATED_PK_${i}`, kind: "P",
    status: "ENABLED", validated: "VALIDATED", referencedOwner: null, referencedConstraint: null }));
  const constraintColumns: Array<{ tableName: string; name: string; columnName: string; position: number | null }> =
    tables.map((tableName, i) => ({ tableName, name: `ISOLATED_PK_${i}`,
    columnName: tableName === "SHF_EMPLOYEES" ? "EMPLOYEE_ID" : "SHF_EMPLOYEE_DAY_ID", position: 1 }));
  const rows: Record<string, unknown[]> = { columns, constraints, constraintColumns, properties,
    triggers: [], ownerTriggers: [], policies: [], tablePrivileges: [], columnPrivileges: [], roles: [], dependencies: [],
    sequence: [{ owner: "SHIFTER", name: "SHF_AGENT_DAY_ID", minValue: "1", maxValue: "9999999999999999999999999999",
      incrementBy: "1", cycleFlag: "N", orderFlag: "N", cacheSize: "20" }],
    sequencePrivileges: [], charset: [{ charset: "IW8ISO8859P8" }] };
  const identity = { database: "ISOLATED", host: "isolated.invalid", service: "ISOLATED",
    user: "SHIFTER", schema: "SHIFTER" };
  const options: ShiftManagementMetadataOptions = { provider, identity, tables, kind: "create",
    ...(provider === "owner-test-limited-v1" ? { coverageWaiver: {
      id: metadataWaiverId, accepted: true as const, externalEffectsAssessment: "unknown-user-waived" as const,
    } } : {}) };
  let fail: string | undefined;
  const query: NativeQuery = async sql => {
    calls.push(sql);
    if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
    if (sql.includes("native:identity")) return [identity];
    if (sql.includes("shf49:metadata:readProbe:")) return [];
    const tag = /shf49:metadata:([A-Za-z]+)/.exec(sql)?.[1];
    if (!tag || fail === tag || !Object.hasOwn(rows, tag)) throw Error("Isolated required metadata observation failed");
    return structuredClone(rows[tag]);
  };
  return { query, options, calls, rows, columns, properties, constraints, constraintColumns,
    failObservation(tag: string) { fail = tag; } };
}
test("management limited metadata observes real COLS/default/sequence shapes and preserves two unknown scopes", async () => {
  const f = fixture(), observed = await observeShiftManagementMetadata(f.query, f.options);
  assert.match(observed.certificate, /^[0-9a-f]{64}$/);
  assert.deepEqual(observed.coverage.unavailable, ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"]);
  const columns = f.calls.find(sql => sql.includes("metadata:columns")); assert.ok(columns);
  assert.match(columns, /user_tab_cols/i); assert.doesNotMatch(columns, /user_tab_columns/i);
  assert.match(columns, /hidden_column='NO'/i); assert.match(columns, /temporary='N'/i);
  assert.ok(f.calls.some(sql => /data_default AS "defaultSql"/i.test(sql)));
  assert.ok(f.calls.some(sql => sql.includes("metadata:sequence")));
  assert.ok(!f.calls.some(sql => /\bNEXTVAL\b|\bFOR UPDATE\b|\bDBA_TRIGGERS\b|\bDBA_ROLE_PRIVS\b/i.test(sql)));
});
test("management certificates bind provider/operation/defaults/kind and cannot reuse a wrong certificate", async () => {
  const limited = fixture(), first = await observeShiftManagementMetadata(limited.query, limited.options);
  const dba = fixture("dba-v1"), second = await observeShiftManagementMetadata(dba.query, dba.options);
  assert.notEqual(first.certificate, second.certificate);
  await assert.rejects(certifyShiftManagementMetadata(limited.query, limited.options, second.certificate),
    { code: "LIVE_WRITES_DISABLED" });
  const property = limited.properties.find(row => row.columnName === "WM_SCHEDULE_DAY_ID"); assert.ok(property);
  property.defaultSql = "1";
  const changed = await observeShiftManagementMetadata(limited.query, limited.options);
  assert.notEqual(changed.certificate, first.certificate);
});
test("limited waiver never masks a failed required properties query", async () => {
  const f = fixture(); f.failObservation("properties");
  await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
});
for (const provider of ["dba-v1", "owner-hybrid-v1", "owner-test-limited-v1"] as const) {
  test(`management ${provider} uses actual COLS and an operation-specific certificate`, async () => {
    const f = fixture(provider), observed = await observeShiftManagementMetadata(f.query, f.options);
    const certified = await certifyShiftManagementMetadata(f.query, f.options, observed.certificate);
    assert.equal(certified.certificate, observed.certificate);
    assert.equal(certified.proof.operation, "native-shift-management-v0.1");
    const source = f.calls.find(sql => sql.includes("metadata:columns")); assert.ok(source);
    assert.match(source, provider === "dba-v1" ? /dba_tab_cols/i : /user_tab_cols/i);
    assert.doesNotMatch(source, /\b(?:dba|user)_tab_columns\b/i);
    assert.equal(f.calls.some(sql => sql.includes("metadata:roles")), provider !== "owner-test-limited-v1");
  });
}
for (const observation of ["columns", "constraints", "constraintColumns", "policies", "tablePrivileges",
  "columnPrivileges", "dependencies", "ownerTriggers", "sequence", "sequencePrivileges", "charset"] as const) {
  test(`limited metadata required ${observation} failure is not an extra waiver`, async () => {
    const f = fixture(); f.failObservation(observation);
    await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
  });
}
test("Oracle CHECK constraints preserve multiple NULL positions; P/U/R NULL/gaps reject", async () => {
  const f = fixture();
  f.constraints.push({ tableName: "SHF_EMPLOYEE_DAY", name: "ISOLATED_CHECK", kind: "C",
    status: "ENABLED", validated: "VALIDATED", referencedOwner: null, referencedConstraint: null });
  f.constraintColumns.push({ tableName: "SHF_EMPLOYEE_DAY", name: "ISOLATED_CHECK", columnName: "SOURCE", position: null },
    { tableName: "SHF_EMPLOYEE_DAY", name: "ISOLATED_CHECK", columnName: "EMP_ID_NUMBER", position: null });
  const result = await observeShiftManagementMetadata(f.query, f.options);
  assert.equal(result.observations.constraintColumns.filter(row => row.position === null).length, 2);
  for (const position of [null, 2]) {
    const invalid = fixture(); invalid.constraintColumns[0].position = position;
    await assert.rejects(observeShiftManagementMetadata(invalid.query, invalid.options), { code: "LIVE_WRITES_DISABLED" });
  }
});
test("known enabled trigger/policy and virtual/hidden/missing DATE facts deny", async () => {
  for (const scenario of ["trigger", "policy", "virtual", "hidden", "date"] as const) {
    const f = fixture();
    if (scenario === "trigger") f.rows.ownerTriggers = [{ tableName: "SHF_EMPLOYEE_DAY", name: "ISOLATED_TRIGGER", status: "ENABLED" }];
    if (scenario === "policy") f.rows.policies = [{ tableName: "SHF_EMPLOYEE_DAY", name: "ISOLATED_POLICY", enabled: "YES" }];
    if (scenario === "virtual") f.columns[0].virtualColumn = "YES";
    if (scenario === "hidden") f.properties[0].hiddenColumn = "YES";
    if (scenario === "date") {
      const column = f.columns.find(row => row.columnName === "WM_DATE"); assert.ok(column); column.dataType = "VARCHAR2";
    }
    await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
  }
});
test("nonowner cannot infer sequence/write permission from a role label or missing grants", async () => {
  const f = fixture("dba-v1"); f.options.identity.user = "ISOLATED_WRITER";
  f.rows.roles = [{ grantee: "ISOLATED_WRITER", role: "DBA", defaultRole: "YES" }];
  await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
  f.rows.sequencePrivileges = [{ owner: "SHIFTER", name: "SHF_AGENT_DAY_ID", grantee: "ISOLATED_WRITER", privilege: "SELECT" }];
  await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
  f.rows.tablePrivileges = [{ tableName: "SHF_EMPLOYEE_DAY", grantee: "ISOLATED_WRITER", privilege: "INSERT" }];
  assert.match((await observeShiftManagementMetadata(f.query, f.options)).certificate, /^[0-9a-f]{64}$/);
});
test("change/cancel do not observe or consume sequence authority, and kind changes the certificate", async () => {
  const f = fixture(), created = await observeShiftManagementMetadata(f.query, f.options);
  for (const kind of ["change", "cancel"] as const) {
    const other = fixture(), result = await observeShiftManagementMetadata(other.query, { ...other.options, kind });
    assert.equal(result.sequence, null);
    assert.notEqual(result.certificate, created.certificate);
    assert.ok(!other.calls.some(sql => sql.includes("metadata:sequence")));
  }
});
test("malformed LONG/default/sequence/charset observations are never repaired into supported facts", async () => {
  for (const scenario of ["long", "sequence", "charset", "precision", "missing-properties"] as const) {
    const f = fixture();
    if (scenario === "long") f.rows.properties = [{ ...f.properties[0], defaultSql: { value: "NULL" } }, ...f.properties.slice(1)];
    if (scenario === "sequence") f.rows.sequence = [];
    if (scenario === "charset") f.rows.charset = [{ charset: "UNKNOWN" }];
    if (scenario === "precision") {
      const prop = f.properties.find(row => row.dataPrecision !== null); assert.ok(prop); prop.dataPrecision = 39;
    }
    if (scenario === "missing-properties") f.rows.properties = f.properties.slice(1);
    await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
  }
});
test("strict/hybrid do not receive a limited waiver; invalid certificates fail before queries", async () => {
  const f = fixture("owner-hybrid-v1");
  await assert.rejects(Reflect.apply(observeShiftManagementMetadata, null, [f.query, {
    ...f.options, coverageWaiver: { id: metadataWaiverId, accepted: true, externalEffectsAssessment: "unknown-user-waived" },
  }]), { code: "LIVE_WRITES_DISABLED" });
  assert.equal(f.calls.length, 0);
  await assert.rejects(certifyShiftManagementMetadata(f.query, f.options, "bad"), { code: "LIVE_WRITES_DISABLED" });
  assert.equal(f.calls.length, 0);
});
test("readonly dependency LONG metadata is retained without inventing a writable core codec or size", async () => {
  const f = fixture();
  f.options.tables = [...f.options.tables, "SHF_EMPLOYEE_EVENTS"];
  f.columns.push({ tableName: "SHF_EMPLOYEE_EVENTS", columnName: "REMARK", dataType: "LONG",
    dataLength: 0, charUsed: null, nullable: "Y", virtualColumn: "NO" });
  f.properties.push({ tableName: "SHF_EMPLOYEE_EVENTS", columnName: "REMARK", defaultSql: null,
    dataPrecision: null, dataScale: null, charLength: 0, hiddenColumn: "NO" });
  const result = await observeShiftManagementMetadata(f.query, f.options);
  assert.equal(result.schemas.SHF_EMPLOYEE_EVENTS[0].dataLength, 0);
  assert.equal(result.proof.observations.columns.find(row => row.tableName === "SHF_EMPLOYEE_EVENTS")?.dataType, "LONG");
  assert.ok(f.calls.some(sql => sql.includes("metadata:readProbe:SHF_EMPLOYEE_EVENTS")));
});
test("native mutable remark/actor/reason metadata must preserve actual VARCHAR2 BYTE semantics", async () => {
  const f = fixture();
  const remark = f.columns.find(row => row.tableName === "SHF_EMPLOYEE_DAY" && row.columnName === "REMARK");
  assert.ok(remark); remark.charUsed = "C";
  await assert.rejects(observeShiftManagementMetadata(f.query, f.options), { code: "LIVE_WRITES_DISABLED" });
});
