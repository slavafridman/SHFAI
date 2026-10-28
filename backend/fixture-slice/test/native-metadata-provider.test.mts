import test from "node:test";
import assert from "node:assert/strict";
import { nativeBinding, nativeEnvironment, nativeIdentityBindingReference } from "../native-stage-arrival-config.mts";
import type { NativeBinding, NativeMetadataProvider } from "../native-stage-arrival-config.mts";
import { stationBinding, stationEnvironment, stationIdentityReference } from "../native-station-arrival-config.mts";
import type { StationBinding } from "../native-station-arrival-config.mts";
import { nativeMetadataQueries, nativeMetadataSql, nativeMetadataDigest, nativeTables, nativeSafety } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeQuery } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeMetadataOperation } from "../oracle-stage-arrival-snapshot.mts";
import { stationTables, stationSafety } from "../oracle-station-arrival-snapshot.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { NativeOracleDouble } from "./native-stage-arrival-double.mts";
import { StationOracleDouble } from "./native-station-arrival-double.mts";
import { OracleStageArrivalApplication } from "../oracle-stage-arrival-application.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import { existsSync } from "node:fs";

test("metadata provider omission/explicit DBA retain existing nine-slot query text", () => {
  assert.deepEqual(nativeMetadataQueries(Object.keys(nativeTables)), nativeMetadataSql);
  assert.deepEqual(nativeMetadataQueries(Object.keys(nativeTables), "dba-v1"), nativeMetadataSql);
  const d = new NativeOracleDouble();
  try {
    assert.equal(nativeBinding({ ...d.binding, metadataProvider: "dba-v1" }).metadataProvider, "dba-v1");
    assert.equal(Object.hasOwn(nativeBinding(d.binding), "metadataProvider"), false);
  } finally { d.dispose(); }
});
test("explicit hybrid uses seven scoped USER slots and retains exact cross-owner trigger/PUBLIC role DBA queries", () => {
  const sql = nativeMetadataQueries(Object.keys(nativeTables), "owner-hybrid-v1");
  assert.equal(sql.length, 9);
  for (const [slot, view] of [[0, "user_tab_columns"], [1, "user_constraints"], [2, "user_cons_columns"],
    [4, "user_policies"], [5, "user_tab_privs"], [6, "user_col_privs"], [8, "user_dependencies"]] as const)
    assert.match(sql[slot], new RegExp(`FROM ${view}\\b`));
  assert.equal(sql[3], nativeMetadataSql[3]); assert.equal(sql[7], nativeMetadataSql[7]);
  for (let i = 0; i < 9; i++) {
    const projection = (s: string) => s.slice(0, s.indexOf("FROM")).replace(/\s+/g, " ").trim();
    assert.equal(projection(sql[i]), projection(nativeMetadataSql[i]));
    assert.equal(sql[i].slice(sql[i].lastIndexOf("ORDER BY")), nativeMetadataSql[i].slice(nativeMetadataSql[i].lastIndexOf("ORDER BY")));
  }
  assert.match(sql[0], /FROM user_tables tt WHERE tt.table_name=tc.table_name AND tt.temporary='N'/);
  assert.doesNotMatch(sql[0], /\bowner\b/i);
  assert.doesNotMatch(sql[4], /object_owner/i);
  assert.doesNotMatch(sql[8], /WHERE owner=/i);
  for (const slot of [5, 6]) assert.match(sql[slot], /owner='SHIFTER'/);
  assert.doesNotMatch(sql.join("\n"), /user_triggers|user_role_privs|\ball_/i);
});
test("F1 and F2 carry the private hybrid selector and reject malformed/unknown selectors and extra fields", () => {
  const f1 = new NativeOracleDouble(), f2 = new StationOracleDouble();
  try {
    assert.equal(nativeBinding({ ...f1.binding, metadataProvider: "owner-hybrid-v1" }).metadataProvider, "owner-hybrid-v1");
    assert.equal(stationBinding({ ...f2.binding, metadataProvider: "owner-hybrid-v1" }).metadataProvider, "owner-hybrid-v1");
    for (const metadataProvider of [undefined, null, "", "owner", "OWNER-HYBRID-V1", " owner-hybrid-v1", false])
      for (const [parse, binding] of [[nativeBinding, f1.binding], [stationBinding, f2.binding]] as const)
        assert.throws(() => parse({ ...binding, metadataProvider }));
    assert.throws(() => nativeBinding({ ...f1.binding, metadataProvider: "dba-v1", metadataFallback: true }));
    assert.throws(() => stationBinding({ ...f2.binding, metadataProvider: "dba-v1", metadataFallback: true }));
  } finally { f1.dispose(); f2.dispose(); }
});

type Binding = NativeBinding | StationBinding;
function inspect(q: NativeQuery, b: Binding) {
  return "stationMetadataDigest" in b ? stationSafety(q, b) : nativeSafety(q, b);
}
function fixture(kind: "stage" | "station") {
  const d = kind === "stage" ? new NativeOracleDouble() : new StationOracleDouble();
  const operation: NativeMetadataOperation = kind === "stage" ? "native-stage-arrival-v0.1" : "native-station-arrival-v0.1";
  const tables = Object.keys(kind === "stage" ? nativeTables : stationTables);
  const digest = (provider: NativeMetadataProvider, proof = d.proof) => nativeMetadataDigest(provider, operation, tables, proof);
  const binding = (provider: NativeMetadataProvider, certificate = digest(provider), extra: Record<string, unknown> = {}): Binding =>
    kind === "stage"
      ? nativeBinding({ ...d.binding, metadataProvider: provider, metadataDigest: certificate, ...extra })
      : stationBinding({ ...d.binding, metadataProvider: provider, stationMetadataDigest: certificate, ...extra });
  return { d, operation, tables, digest, binding };
}
// Synthetic protocol observations, independent of the expected configuration.
// No Oracle client/session or automatic metadata fallback is installed.
function protocol(proof: unknown[][], options: {
  observed?: Record<string, string>; failSlot?: number; failProbe?: boolean;
} = {}) {
  const calls: Array<{ sql: string; bound: number; binds: unknown }> = [];
  const q: NativeQuery = async (sql, binds, bound) => {
    calls.push({ sql, binds, bound });
    if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
    if (sql.includes("native:identity")) return [options.observed ?? {
      database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service", user: "SHIFTER", schema: "SHIFTER",
    }];
    const slot = /(?:native|station):metadata:(\d+)/.exec(sql);
    if (slot) {
      const i = Number(slot[1]);
      assert.equal(bound, 1001);
      if (i === 7) assert.deepEqual(binds, { writeUser: "SHIFTER" });
      else assert.deepEqual(binds, {});
      if (options.failSlot === i) throw Object.assign(Error("synthetic dictionary visibility"), { code: "ORA-00942" });
      return structuredClone(proof[i]);
    }
    if (/:(?:privilege):/.test(sql)) {
      assert.equal(bound, 1); assert.match(sql, /WHERE 1=0/);
      if (options.failProbe) throw Object.assign(Error("synthetic table visibility"), { code: "ORA-00942" });
      return [];
    }
    throw Error("Unexpected isolated metadata query");
  };
  return { q, calls };
}
for (const kind of ["stage", "station"] as const) {
  test(`${kind} legacy DBA digest formula and explicit DBA certificate remain unchanged`, async () => {
    const f = fixture(kind);
    try {
      assert.equal(f.digest("dba-v1"), kind === "stage" ? fingerprint(f.d.proof) :
        fingerprint({ operation: "native-station-arrival-v0.1", proof: f.d.proof }));
      const p = protocol(f.d.proof);
      const schema = await inspect(p.q, f.binding("dba-v1"));
      assert.ok(schema.SHF_ATTENDANCE);
      assert.equal(p.calls.filter(c => /:metadata:/.test(c.sql)).length, 9);
    } finally { f.d.dispose(); }
  });
  test(`${kind} default DBA visibility failure does not select hybrid automatically`, async () => {
    const f = fixture(kind);
    try {
      const p = protocol(f.d.proof, { failSlot: 0 });
      await assert.rejects(inspect(p.q, f.d.binding), { code: "ORA-00942" });
      assert.equal(p.calls.filter(c => /:metadata:/.test(c.sql)).length, 1);
      assert.match(p.calls[p.calls.length - 1].sql, /FROM dba_tab_columns/);
      assert.doesNotMatch(p.calls.map(c => c.sql).join("\n"), /FROM user_/);
    } finally { f.d.dispose(); }
  });
  test(`${kind} hybrid certificate has versioned owner/provider/operation/scope provenance and executes every probe`, async () => {
    const f = fixture(kind);
    try {
      assert.equal(f.digest("owner-hybrid-v1"), fingerprint({
        version: "shf-native-metadata-v1", provider: "owner-hybrid-v1", owner: "SHIFTER",
        operation: f.operation, tableScope: f.tables, proof: f.d.proof,
      }));
      assert.notEqual(f.digest("owner-hybrid-v1"), f.digest("dba-v1"));
      const p = protocol(f.d.proof), b = f.binding("owner-hybrid-v1");
      const schema = await inspect(p.q, b);
      assert.equal(p.calls.filter(c => /:privilege:/.test(c.sql)).length, f.tables.length);
      assert.equal(Object.keys(schema).length, f.tables.length);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      const sql = p.calls.filter(c => /:metadata:/.test(c.sql)).map(c => c.sql);
      assert.match(sql[3], /FROM dba_triggers WHERE table_owner='SHIFTER'/);
      assert.match(sql[7], /FROM dba_role_privs WHERE grantee IN \(:writeUser,'PUBLIC'\)/);
    } finally { f.d.dispose(); }
  });
  for (const field of ["user", "schema"] as const)
    test(`${kind} hybrid actual ${field} mismatch rejects before ANY metadata query`, async () => {
      const f = fixture(kind);
      try {
        const p = protocol(f.d.proof, { observed: { database: "SYNTHETIC_TEST", host: "synthetic-host",
          service: "synthetic-service", user: "SHIFTER", schema: "SHIFTER", [field]: "SYNTHETIC_OTHER" } });
        await assert.rejects(inspect(p.q, f.binding("owner-hybrid-v1")), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(p.calls.some(c => /:metadata:/.test(c.sql)), false);
      } finally { f.d.dispose(); }
    });
  for (const field of ["user", "schema"] as const)
    test(`${kind} hybrid independently expected ${field} must be the actual SHIFTER owner`, async () => {
      const f = fixture(kind);
      try {
        assert.throws(() => f.binding("owner-hybrid-v1", f.digest("owner-hybrid-v1"), {
          writeIdentity: { ...f.d.binding.writeIdentity, [field]: "SYNTHETIC_OTHER" },
        }));
        const b = f.binding("owner-hybrid-v1"), p = protocol(f.d.proof);
        const forged = { ...b, writeIdentity: { ...b.writeIdentity, [field]: "SYNTHETIC_OTHER" } };
        await assert.rejects(inspect(p.q, forged), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(p.calls.length, 0);
      } finally { f.d.dispose(); }
    });
  for (const slot of [3, 7])
    test(`${kind} hybrid retained DBA slot${slot} ORA-00942 remains a hard stop, never empty/fallback`, async () => {
      const f = fixture(kind);
      try {
        const p = protocol(f.d.proof, { failSlot: slot });
        await assert.rejects(inspect(p.q, f.binding("owner-hybrid-v1")), { code: "ORA-00942" });
        assert.equal(p.calls.filter(c => /:metadata:/.test(c.sql)).length, slot + 1);
        assert.equal(p.calls.some(c => /:privilege:/.test(c.sql)), false);
        assert.doesNotMatch(p.calls.map(c => c.sql).join("\n"), /user_triggers|user_role_privs/);
      } finally { f.d.dispose(); }
    });
  for (const mutation of ["missing-column", "malformed-row", "overflow", "constraint-status", "constraint-validation",
    "date-type", "byte-capacity", "VPD", "cross-owner-trigger", "writer-probe"] as const)
    test(`${kind} hybrid ${mutation} fails closed even with a reviewed digest`, async () => {
      const f = fixture(kind);
      try {
        const proof = f.d.proof;
        const arrival = kind === "stage" ? "STAGE_ARRIVAL" : "STATION_ARRIVAL";
        if (mutation === "missing-column") proof[0] = proof[0].filter(c => !record(c) || c.columnName !== arrival + "_USER");
        if (mutation === "malformed-row") proof[6].push(null);
        if (mutation === "overflow") proof[6] = Array.from({ length: 1001 }, () => ({ tableName: "SHF_ATTENDANCE" }));
        if (mutation === "constraint-status" || mutation === "constraint-validation")
          for (const c of proof[1]) if (record(c)) {
            if (mutation === "constraint-status") c.status = "DISABLED"; else c.validated = "NOT VALIDATED";
          }
        if (mutation === "date-type" || mutation === "byte-capacity")
          for (const c of proof[0]) if (record(c) && c.columnName === arrival + (mutation === "date-type" ? "_TIME" : "_USER")) {
            if (mutation === "date-type") c.dataType = "TIMESTAMP"; else c.dataLength = 23;
          }
        if (mutation === "VPD") proof[4].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_VPD", enabled: "YES" });
        if (mutation === "cross-owner-trigger") proof[3].push({ tableName: "SHF_ATTENDANCE",
          name: "SYNTHETIC_OTHER_OWNER_TRIGGER", status: "ENABLED" });
        const p = protocol(proof, { failProbe: mutation === "writer-probe" });
        await assert.rejects(inspect(p.q, f.binding("owner-hybrid-v1")));
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  for (const changed of ["PUBLIC-role", "other-grantor-table", "other-grantor-column", "external-dependency"])
    test(`${kind} hybrid detects ${changed} drift without silently accepting a new certificate`, async () => {
      const f = fixture(kind);
      try {
        const b = f.binding("owner-hybrid-v1");
        if (changed === "PUBLIC-role") f.d.proof[7].push({ grantee: "PUBLIC", role: "SYNTHETIC_PUBLIC_ROLE", defaultRole: "YES" });
        if (changed === "other-grantor-table") f.d.proof[5].push({ tableName: "SHF_ATTENDANCE", grantee: "PUBLIC", privilege: "SELECT" });
        if (changed === "other-grantor-column") f.d.proof[6].push({ tableName: "SHF_ATTENDANCE",
          columnName: "STATION_ARRIVAL_TIME", grantee: "PUBLIC", privilege: "UPDATE" });
        if (changed === "external-dependency") f.d.proof[8].push({ name: "SHF_ATTENDANCE", type: "TABLE",
          referencedOwner: "SYNTHETIC_EXTERNAL", referencedName: "SYNTHETIC_OBJECT", referencedType: "TYPE" });
        const p = protocol(f.d.proof);
        await assert.rejects(inspect(p.q, b), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(p.calls.some(c => /:privilege:/.test(c.sql)), false);
      } finally { f.d.dispose(); }
    });
  for (const wrong of ["provider", "operation", "scope"] as const)
    test(`${kind} hybrid rejects ${wrong} certificate provenance`, async () => {
      const f = fixture(kind);
      try {
        const digest = wrong === "provider" ? f.digest("dba-v1") :
          nativeMetadataDigest("owner-hybrid-v1", wrong === "operation" ?
            kind === "stage" ? "native-station-arrival-v0.1" : "native-stage-arrival-v0.1" : f.operation,
          wrong === "scope" ? f.tables.slice(1) : f.tables, f.d.proof);
        await assert.rejects(inspect(protocol(f.d.proof).q, f.binding("owner-hybrid-v1", digest)), { code: "LIVE_WRITES_DISABLED" });
      } finally { f.d.dispose(); }
    });
}
test("F1 and F2 private environment parsing carries selector without native F1 translation losing F2 provenance", () => {
  const f1 = new NativeOracleDouble(), f2 = new StationOracleDouble();
  try {
    const common = { SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SHIFTER" };
    const stage = nativeEnvironment({ ...common, SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true",
      SHF_NATIVE_STAGE_CONNECT_STRING: "CTIDBT_WFMT", SHF_NATIVE_STAGE_USER: "SHIFTER",
      SHF_NATIVE_STAGE_PASSWORD: "synthetic-not-a-secret", SHF_NATIVE_STAGE_CLIENT_LIB_DIR: "synthetic-unused",
      SHF_NATIVE_STAGE_BINDING: JSON.stringify({ ...f1.binding, metadataProvider: "owner-hybrid-v1" }) }, true);
    assert.equal(stage?.binding.metadataProvider, "owner-hybrid-v1");
    const station = stationEnvironment({ ...common, SHF_ORACLE_USER: f2.binding.readIdentity.user,
      SHF_TEST_ORACLE_STATION_WRITE_ENABLED: "true", SHF_NATIVE_STATION_CONNECT_STRING: "CTIDBT_WFMT",
      SHF_NATIVE_STATION_USER: "SHIFTER", SHF_NATIVE_STATION_PASSWORD: "synthetic-not-a-secret",
      SHF_NATIVE_STATION_CLIENT_LIB_DIR: "synthetic-unused",
      SHF_NATIVE_STATION_BINDING: JSON.stringify({ ...f2.binding, metadataProvider: "owner-hybrid-v1" }) }, true);
    assert.equal(station?.binding.metadataProvider, "owner-hybrid-v1");
    assert.equal(station?.binding.operation, "native-station-arrival-v0.1");
  } finally { f1.dispose(); f2.dispose(); }
});
test("F1 preparation reference includes metadata provider/digest and rejects app/UoW certificate drift", async () => {
  const d = new NativeOracleDouble();
  try {
    const { uow, app, principal } = await d.application();
    const prep = await app.validate(principal, { employeeId: "9001", shiftDayId: "6201" }, { lateReasonCode: null, lateRemark: null });
    assert.ok(prep.validationToken);
    const legacy = nativeBinding(d.binding), explicit = nativeBinding({ ...d.binding, metadataProvider: "dba-v1" });
    assert.equal(nativeIdentityBindingReference(legacy), nativeIdentityBindingReference(explicit));
    for (const patch of [{ metadataProvider: "owner-hybrid-v1" }, { metadataDigest: "a".repeat(64) }]) {
      const b = nativeBinding({ ...d.binding, ...patch });
      assert.notEqual(nativeIdentityBindingReference(b), uow.identityReference);
      assert.throws(() => new OracleStageArrivalApplication(uow, b, d.clock, "UTC", ["T001"]));
    }
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("F2 preparation reference includes metadata provider/digest and rejects app/UoW certificate drift", async () => {
  const d = new StationOracleDouble();
  try {
    const { uow, app, principal } = await d.application();
    const prep = await app.validate(principal, { employeeId: "9001", shiftDayId: "6201" }, { lateReasonCode: null });
    assert.ok(prep.validationToken);
    const legacy = stationBinding(d.binding), explicit = stationBinding({ ...d.binding, metadataProvider: "dba-v1" });
    assert.equal(stationIdentityReference(legacy), stationIdentityReference(explicit));
    for (const patch of [{ metadataProvider: "owner-hybrid-v1" }, { stationMetadataDigest: "a".repeat(64) }]) {
      const b = stationBinding({ ...d.binding, ...patch });
      assert.notEqual(stationIdentityReference(b), uow.identityReference);
      assert.throws(() => new OracleStationArrivalApplication(uow, b, d.clock, "UTC", ["T001"]));
    }
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("F1 hybrid construction issues pure preparation using the exact supplied provider certificate", async () => {
  const d = new NativeOracleDouble();
  try {
    d.binding.metadataProvider = "owner-hybrid-v1";
    d.binding.metadataDigest = nativeMetadataDigest("owner-hybrid-v1", "native-stage-arrival-v0.1", Object.keys(nativeTables), d.proof);
    const { app, principal } = await d.application();
    const v = await app.validate(principal, { employeeId: "9001", shiftDayId: "6201" }, { lateReasonCode: null, lateRemark: null });
    assert.equal(v.dataSource, "oracle-test");
    assert.equal(v.state, "ready");
    assert.equal(existsSync(d.binding.allowanceFile), false);
    assert.equal(d.events.includes("write:update"), false);
    assert.match(d.sql.find(s => s.sql.includes("native:metadata:0"))!.sql, /FROM user_tab_columns/);
  } finally { d.dispose(); }
});
test("F2 hybrid construction issues pure preparation using the exact supplied provider certificate", async () => {
  const d = new StationOracleDouble();
  try {
    d.binding.metadataProvider = "owner-hybrid-v1";
    d.binding.stationMetadataDigest = nativeMetadataDigest("owner-hybrid-v1", d.binding.operation, Object.keys(stationTables), d.proof);
    const { app, principal } = await d.application();
    const v = await app.validate(principal, { employeeId: "9001", shiftDayId: "6201" }, { lateReasonCode: null });
    assert.equal(v.dataSource, "oracle-test");
    assert.equal(v.state, "ready");
    assert.equal(existsSync(d.binding.allowanceFile), false);
    assert.equal(d.events.includes("write:update"), false);
    assert.match(d.sql.find(s => s.sql.includes("station:metadata:0"))!.sql, /FROM user_tab_columns/);
  } finally { d.dispose(); }
});
