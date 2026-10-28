import test from "node:test";
import assert from "node:assert/strict";
import { nativeBinding, nativeIdentityBindingReference } from "../native-stage-arrival-config.mts";
import { stationBinding, stationIdentityReference } from "../native-station-arrival-config.mts";
import { exitBinding, exitIdentityReference } from "../native-station-exit-config.mts";
import { nativeMetadataQueries, nativeMetadataDigest, nativeTables, collectLimitedMetadataEvidence } from "../oracle-stage-arrival-snapshot.mts";
import { NativeOracleDouble, nativeConfig } from "./native-stage-arrival-double.mts";
import { StationOracleDouble, stationConfig } from "./native-station-arrival-double.mts";
import { ExitOracleDouble, exitConfig } from "./native-station-exit-double.mts";
import { parseLimitedMetadataEvidence, limitedMetadataDigest, limitedMetadataWarning, validateLimitedMetadataStartup } from "../native-metadata-limited.mts";
import type { LimitedOperation } from "../native-metadata-limited.mts";
import { OracleReadSession } from "../oracle-session.mts";
import type { OraclePool } from "../oracle-session.mts";
import type { NativePool } from "../oracle-stage-arrival-uow.mts";
import { OracleStageArrivalUow } from "../oracle-stage-arrival-uow.mts";
import { OracleStationArrivalUow } from "../oracle-station-arrival-uow.mts";
import { OracleStationExitUow } from "../oracle-station-exit-uow.mts";
import { OracleStageArrivalApplication } from "../oracle-stage-arrival-application.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import { OracleStationExitApplication } from "../oracle-station-exit-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { withRequestBudget } from "../request-budget-context.mts";

const waiver = { id: "shf-test-dba-two-view-waiver-20261028-v0.1", accepted: true,
  externalEffectsAssessment: "unknown-user-waived" };
test("limited provider accepts only its exact waiver branch without noExternalEffectsConfirmed", () => {
  const d = new NativeOracleDouble();
  try {
    const { noExternalEffectsConfirmed: _old, ...common } = d.binding;
    const b = nativeBinding({ ...common, metadataProvider: "owner-test-limited-v1", metadataCoverageWaiver: waiver });
    assert.equal(b.metadataProvider, "owner-test-limited-v1");
    assert.equal(Object.hasOwn(b, "noExternalEffectsConfirmed"), false);
    for (const bad of [{ ...b, noExternalEffectsConfirmed: true }, { ...b, noExternalEffectsConfirmed: false },
      { ...common, metadataProvider: "owner-test-limited-v1" }, { ...b, metadataCoverageWaiver: { ...waiver, accepted: false } }])
      assert.throws(() => nativeBinding(bad));
  } finally { d.dispose(); }
});
test("limited query plan has seven required USER observations plus scoped owner triggers, never either waived DBA query", () => {
  const sql = nativeMetadataQueries(Object.keys(nativeTables), "owner-test-limited-v1");
  assert.equal(sql.length, 8);
  assert.doesNotMatch(sql.join("\n"), /\bdba_|user_role_privs/i);
  assert.match(sql[7], /FROM user_triggers WHERE table_owner='SHIFTER'/);
});

type Kind = "stage" | "station" | "exit";
const scopes = {
  stage: ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE", "SHF_ORG_UNIT",
    "SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM", "SHF_EMPLOYEE_REPORTS"],
  station: ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE", "SHF_ORG_UNIT",
    "SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"],
  exit: ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE", "SHF_ORG_UNIT",
    "SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE",
    "SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM", "SHF_ORG_UNITS_SHF_SITES"],
};
// Independent Oracle11 physical catalog, never built from required-column lists.
const catalogSpec: Record<string, string> = {
  SHF_EMPLOYEES: "EMPLOYEE_ID:N EMP_ID_NUMBER:T FIRST_NAME:T LAST_NAME:T ORG_UNIT_ID:T SHF_LOCKED:T",
  SHF_EMPLOYEE_DAY: "SHF_EMPLOYEE_DAY_ID:N EMP_ID_NUMBER:T WM_DAY_TYPE:N WM_SHIFT_START_DATETIME:D WM_SHIFT_END_DATETIME:D WM_SCH_ACTIVITY_ID_DATA:T WM_EXCEPTION_TYPE_ID:N SPLIT_SHIFT:T SPLIT_START:D SPLIT_END:D SOURCE:T WM_SITE_ID:N",
  SHF_DAY_CHANGES: "SHF_EMPLOYEE_DAY_ID:N NEW_EMPLOYEE_ID:T NEW_DAY_TYPE:N NEW_SHIFT_START:D NEW_SHIFT_END:D NEW_ACTIVITY:T NEW_EXCEPTION_TYPE_ID:N CANCEL_REASON_CODE:N NEW_SPLIT_SHIFT:T NEW_SPLIT_START:D NEW_SPLIT_END:D NEW_SITE_ID:N",
  SHF_ATTENDANCE: "SHF_EMPLOYEE_DAY_ID:N LATE_MINUTES:N LATE_REASON_ID:N LATE_REMARK:T MISSING_REMARK:T MISSING_TIME:D MISS_REASON_ID:N OPTIONAL1:T STAGE_ARRIVAL_TIME:D STAGE_ARRIVAL_USER:T STATION_ARRIVAL_TIME:D STATION_ARRIVAL_USER:T STATION_EXIT_TIME:D STATION_EXIT_USER:T STAGE_LATE_REMARK:T STAGE_LATE_MINUTES:N STAGE_LATE_REASON_ID:N TADREECH:N LATE_FLAG_P2:T STAGE_ARRIVAL_TIME_P2:D STAGE_ARRIVAL_USER_P2:T TADREECH_P2:N",
  SHF_ORG_UNIT: "ORG_UNIT_ID:T UNIT_TYPE_ID:T PARENT_UNIT:T",
  SHF_SYSTEM_PARAM: "PARAM_KEY:T DEFAULT_VALUE:T", SHF_UNIT_PARAM: "PARAM_KEY:T ORG_UNIT_ID:T PARAM_VALUE:T",
  SHF_EMPLOYEE_REPORTS: "EMPLOYEE_ID:N APPROVED_TIME:D",
  SHF_EMPLOYEE_EXCEPTIONS: "AGENT_DAY_ID:N", SHF_EMPLOYEE_EXCEPTIONS_BASE: "AGENT_DAY_ID:N",
  SHF_ORG_UNITS_SHF_SITES: "SS_SITE_ID:N SOU_ORG_UNIT_ID:T",
};
function physicalCatalog(scope: string[]) {
  return scope.flatMap(tableName => catalogSpec[tableName].split(" ").map(spec => {
    const [columnName, type] = spec.split(":");
    return { tableName, columnName, dataType: type === "N" ? "NUMBER" : type === "D" ? "DATE" : "VARCHAR2",
      dataLength: type === "N" ? 22 : type === "D" ? 7 : columnName.endsWith("REMARK") ? 2000 : 100,
      charUsed: type === "T" ? "B" : null, nullable: "Y", virtualColumn: "NO", hidden: false };
  }));
}
function assertOracle11Projection(sql: string) {
  if (/\b(?:user|dba)_tab_columns\b/i.test(sql) && /\bvirtual_column\b/i.test(sql))
    throw Object.assign(Error("Synthetic Oracle11 missing TAB_COLUMNS.VIRTUAL_COLUMN"), { code: "ORA-00904" });
  if (/\bFROM user_tab_cols\b/i.test(sql)) {
    assert.match(sql, /tc\.hidden_column='NO'/);
    assert.match(sql, /EXISTS\s*\(SELECT 1 FROM user_tables tt WHERE tt.table_name=tc.table_name AND tt.temporary='N'\)/);
    assert.match(sql, /ORDER BY tc.table_name,tc.column_id/);
    for (const name of ["table_name", "column_name", "data_type", "data_length", "char_used", "nullable", "virtual_column"])
      assert.match(sql.slice(0, sql.indexOf("FROM")), new RegExp(`\\b${name}\\b`));
  }
}
function fixture(kind: Kind, realClock = false) {
  const d = kind === "stage" ? new NativeOracleDouble(realClock) :
    kind === "station" ? new StationOracleDouble(realClock) : new ExitOracleDouble(realClock);
  const config = kind === "stage" ? nativeConfig : kind === "station" ? stationConfig : exitConfig;
  const operation: LimitedOperation = kind === "stage" ? "native-stage-arrival-v0.1" :
    kind === "station" ? "native-station-arrival-v0.1" : "native-station-exit-v0.1";
  const catalog = physicalCatalog(scopes[kind]);
  const old = d.rows.SHF_ATTENDANCE!;
  d.rows.SHF_ATTENDANCE = Object.fromEntries(catalog.filter(c => c.tableName === "SHF_ATTENDANCE")
    .map(c => [c.columnName, old[c.columnName] ?? null]));
  const observed: unknown[][] = [
    [], [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", kind: "P", status: "ENABLED", validated: "VALIDATED",
      referencedOwner: null, referencedConstraint: null }],
    [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", columnName: "SHF_EMPLOYEE_DAY_ID", position: 1 }],
    [], [], [], [], [],
  ];
  const syncColumns = () => { observed[0] = catalog.filter(c => !c.hidden).map(({ hidden: _hidden, ...row }) => row); };
  syncColumns();
  const evidence = () => ({
    version: "shf-owner-test-limited-proof-v1", provider: "owner-test-limited-v1", owner: "SHIFTER", operation,
    tableScope: scopes[kind], waiverId: waiver.id, collectorMethod: "user-tab-cols-visible-v1",
    coverage: { kind: "owner-only-two-dba-scopes-user-waived", unavailable: [
      { view: "DBA_TRIGGERS", formerSlot: 3, state: "unknown-user-waived" },
      { view: "DBA_ROLE_PRIVS", formerSlot: 7, state: "unknown-user-waived" },
    ], ownerTriggers: "owner-only-observed" },
    observations: { columns: observed[0], constraints: observed[1], constraintColumns: observed[2], policies: observed[3],
      tablePrivileges: observed[4], columnPrivileges: observed[5], dependencies: observed[6] }, ownerTriggers: observed[7],
  });
  const raw: Record<string, unknown> = { ...d.binding, metadataProvider: "owner-test-limited-v1", metadataCoverageWaiver: waiver };
  delete raw.noExternalEffectsConfirmed;
  const digestKey = kind === "stage" ? "metadataDigest" : kind === "station" ? "stationMetadataDigest" : "exitMetadataDigest";
  const certify = () => { raw[digestKey] = fingerprint(evidence()); };
  certify();
  const binding = () => kind === "stage" ? nativeBinding(raw) : kind === "station" ? stationBinding(raw) : exitBinding(raw);
  const calls: string[] = [];
  let fault = -1;
  let observedSession: Record<string, string> | undefined;
  const intercept = (sql: string): unknown[] | undefined => {
    assertOracle11Projection(sql);
    if (observedSession && sql.includes("native:identity")) return [observedSession];
    if (/\bFROM (?:dba_|user_role_privs)/i.test(sql))
      throw Object.assign(Error("Unexpected waived dictionary query"), { code: "ORA-00942" });
    const views = ["user_tab_cols", "user_constraints", "user_cons_columns", "user_policies", "user_tab_privs",
      "user_col_privs", "user_dependencies", "user_triggers"];
    const slot = views.findIndex(view => new RegExp(`\\bFROM ${view}\\b`, "i").test(sql));
    if (slot < 0) return undefined;
    calls.push(sql);
    if (slot === fault) throw Object.assign(Error("Synthetic required owner view unavailable"), { code: "ORA-00942" });
    return structuredClone(observed[slot]);
  };
  const readPool: OraclePool = {
    async getConnection() {
      const c = await d.readPool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        const rows = intercept(sql); return rows === undefined ? c.execute(sql, binds, bound) : rows;
      } };
    }, close: () => d.readPool.close(),
  };
  const writePool: NativePool = {
    async getConnection() {
      const c = await d.writePool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        const rows = intercept(sql);
        if (rows !== undefined) { assert.equal(bound, /:limited:/.test(sql) ? 1001 : 1); return { rows }; }
        return c.execute(sql, binds, bound);
      } };
    }, close: () => d.writePool.close(),
  };
  const selection = { employeeId: "9001", shiftDayId: "6201" };
  const draft = kind === "stage" ? { lateReasonCode: null, lateRemark: null } : kind === "station" ? { lateReasonCode: null } : {};
  const principal = () => new SyntheticAdministratorProvider(config).authenticate({ authorization: null });
  return { d, kind, config, operation, catalog, observed, syncColumns, evidence, raw, certify, binding, calls,
    selection, draft, principal, readPool, writePool, failAt: (slot: number) => { fault = slot; },
    sessionObservation: (row: Record<string, string>) => { observedSession = row; },
    environment(): NodeJS.ProcessEnv {
      const prefix = kind === "stage" ? "STAGE" : kind === "station" ? "STATION" : "EXIT";
      return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0",
        SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
        SHF_ORACLE_PASSWORD: "synthetic-only-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused",
        SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: "true", [`SHF_TEST_ORACLE_${prefix}_WRITE_ENABLED`]: "true",
        [`SHF_NATIVE_${prefix}_CONNECT_STRING`]: "CTIDBT_WFMT", [`SHF_NATIVE_${prefix}_USER`]: "SHIFTER",
        [`SHF_NATIVE_${prefix}_PASSWORD`]: "synthetic-only-not-a-secret", [`SHF_NATIVE_${prefix}_CLIENT_LIB_DIR`]: "synthetic-unused",
        [`SHF_NATIVE_${prefix}_BINDING`]: JSON.stringify(raw),
        [kind === "stage" ? "SHF_STAGE_ARRIVAL_ORIGINS" : kind === "station" ? "SHF_STATION_ARRIVAL_ORIGINS" :
          "SHF_STATION_EXIT_ORIGINS"]: '["http://localhost:4521"]' };
    },
    async application() {
      const b = binding(), session = new OracleReadSession(readPool);
      if ("metadataDigest" in b) {
        const uow = new OracleStageArrivalUow(writePool, session, b); await uow.initialize();
        return { uow, app: new OracleStageArrivalApplication(uow, b, d.clock, "UTC", ["T001"]) };
      }
      if ("stationMetadataDigest" in b) {
        const uow = new OracleStationArrivalUow(writePool, session, b, "UTC"); await uow.initialize();
        return { uow, app: new OracleStationArrivalApplication(uow, b, d.clock, "UTC", ["T001"]) };
      }
      const uow = new OracleStationExitUow(writePool, session, b, "UTC"); await uow.initialize();
      return { uow, app: new OracleStationExitApplication(uow, b, d.clock, "UTC", ["T001"]) };
    },
  };
}
for (const kind of ["stage", "station", "exit"] as const) {
  test(`${kind} limited collects exactly eight required owner observations and preserves explicit UNKNOWN coverage`, async () => {
    const f = fixture(kind);
    try {
      const { app } = await f.application(), p = await f.principal();
      const v = await app.validate(p, f.selection, f.draft);
      assert.equal(v.dataSource, "oracle-test");
      assert.equal(f.calls.length, 8);
      assert.equal(Object.hasOwn(f.binding(), "noExternalEffectsConfirmed"), false);
      const parsed = parseLimitedMetadataEvidence(f.evidence(), f.operation, scopes[kind]);
      assert.equal(parsed.coverage.unavailable.length, 2);
      assert.equal(parsed.collectorMethod, "user-tab-cols-visible-v1");
      assert.equal(limitedMetadataDigest(parsed, f.operation, scopes[kind]), f.raw[
        kind === "stage" ? "metadataDigest" : kind === "station" ? "stationMetadataDigest" : "exitMetadataDigest"]);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });
  for (let slot = 0; slot < 8; slot++)
    test(`${kind} limited required owner source${slot} ORA-00942 is NOT waived`, async () => {
      const f = fixture(kind);
      try {
        f.failAt(slot);
        await assert.rejects(f.application(), { code: "DEPENDENCY_UNAVAILABLE" });
        assert.equal(f.calls.length, slot + 1);
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
        assert.equal(f.d.events.includes("write:update"), false);
      } finally { f.d.dispose(); }
    });
  for (const defect of ["malformed", "overflow"])
    for (let slot = 0; slot < 8; slot++)
      test(`${kind} limited source${slot} ${defect} result fails closed`, async () => {
        const f = fixture(kind);
        try {
          f.observed[slot] = defect === "malformed" ? [{ unexpected: "synthetic" }] :
            Array.from({ length: 1001 }, () => ({ unexpected: "synthetic" }));
          f.certify();
          await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
        } finally { f.d.dispose(); }
      });
  for (const defect of ["owner-trigger-enabled", "policy-enabled", "constraint-disabled", "duplicate-column",
    "visible-virtual", "missing-virtual", "null-virtual", "unknown-virtual", "hidden-required", "missing-table", "invalid-type"])
    test(`${kind} Oracle11 limited ${defect} is rejected, never hidden/faked`, async () => {
      const f = fixture(kind);
      try {
        if (defect === "owner-trigger-enabled") f.observed[7].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_TRIGGER", status: "ENABLED" });
        if (defect === "policy-enabled") f.observed[3].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_POLICY", enabled: "YES" });
        if (defect === "constraint-disabled") for (const r of f.observed[1]) if (record(r)) r.status = "DISABLED";
        if (defect === "duplicate-column") f.observed[0].push(structuredClone(f.observed[0][0]));
        if (["visible-virtual", "missing-virtual", "null-virtual", "unknown-virtual"].includes(defect)) {
          const r = f.observed[0][0]; assert.ok(record(r));
          if (defect === "missing-virtual") delete r.virtualColumn;
          else r.virtualColumn = defect === "visible-virtual" ? "YES" : defect === "null-virtual" ? null : "UNKNOWN";
        }
        if (defect === "hidden-required") { f.catalog[0].hidden = true; f.syncColumns(); }
        if (defect === "missing-table") f.observed[0] = f.observed[0].filter(r => record(r) && r.tableName !== "SHF_EMPLOYEES");
        if (defect === "invalid-type") for (const r of f.observed[0]) if (record(r) && r.columnName === "STATION_ARRIVAL_TIME")
          r.dataType = "TIMESTAMP";
        f.certify();
        await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(f.d.events.includes("write:update"), false);
      } finally { f.d.dispose(); }
    });
  test(`${kind} hidden virtual columns are excluded; disabled owner trigger is observed rather than assumed absent`, async () => {
    const f = fixture(kind);
    try {
      f.catalog.push({ ...f.catalog[0], columnName: "SYNTHETIC_HIDDEN", hidden: true, virtualColumn: "YES" });
      f.syncColumns();
      f.observed[7].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_DISABLED", status: "DISABLED" });
      f.certify();
      await f.application();
      const evidence = parseLimitedMetadataEvidence(f.evidence(), f.operation, scopes[kind]);
      assert.equal(evidence.ownerTriggers.length, 1);
      assert.equal(evidence.observations.columns.some(r => r.columnName === "SYNTHETIC_HIDDEN"), false);
    } finally { f.d.dispose(); }
  });
  test(`${kind} changed owner-trigger inventory invalidates the operator certificate instead of autoaccepting`, async () => {
    const f = fixture(kind);
    try {
      f.observed[7].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_NEW_DISABLED", status: "DISABLED" });
      await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
    } finally { f.d.dispose(); }
  });
  for (const defect of ["provider", "owner", "operation", "waiver", "collector", "coverage-empty", "coverage-safe",
    "scope-order", "scope-subset", "scope-extra", "unknown-observation", "missing-observation", "fake-nine-arrays"])
    test(`${kind} limited certificate ${defect} provenance cannot be substituted`, () => {
      const f = fixture(kind);
      try {
        const evidence: Record<string, unknown> = structuredClone(f.evidence());
        if (defect === "provider") evidence.provider = "owner-hybrid-v1";
        if (defect === "owner") evidence.owner = "SYNTHETIC_OTHER";
        if (defect === "operation") evidence.operation = kind === "exit" ? "native-stage-arrival-v0.1" : "native-station-exit-v0.1";
        if (defect === "waiver") evidence.waiverId = "synthetic-other-waiver";
        if (defect === "collector") evidence.collectorMethod = "user-tab-columns-v1";
        if (defect === "coverage-empty") evidence.coverage = { ...f.evidence().coverage, unavailable: [] };
        if (defect === "coverage-safe") evidence.coverage = { ...f.evidence().coverage, ownerTriggers: "cross-owner-certified" };
        if (defect === "scope-order") evidence.tableScope = [...scopes[kind]].reverse();
        if (defect === "scope-subset") evidence.tableScope = scopes[kind].slice(1);
        if (defect === "scope-extra") evidence.tableScope = [...scopes[kind], "SYNTHETIC_EXTRA"];
        if (defect === "unknown-observation") evidence.observations = { ...f.evidence().observations, roles: [] };
        if (defect === "missing-observation") {
          const observations: Record<string, unknown> = { ...f.evidence().observations };
          delete observations.policies; evidence.observations = observations;
        }
        assert.throws(() => limitedMetadataDigest(defect === "fake-nine-arrays" ? Array.from({ length: 9 }, () => []) :
          evidence, f.operation, scopes[kind]), { code: "LIVE_WRITES_DISABLED" });
      } finally { f.d.dispose(); }
    });
  test(`${kind} limited native command keeps SET scope, fuse, COMMIT/readback and nonpersistent receipt`, async () => {
    const f = fixture(kind);
    try {
      const { app } = await f.application(), p = await f.principal(), v = await app.validate(p, f.selection, f.draft);
      const before = structuredClone(f.d.rows.SHF_ATTENDANCE!);
      const cmd = { commandId: randomUUID(), draft: f.draft, validationToken: v.validationToken, fingerprint: v.fingerprint,
        ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } };
      const receipt = await app.commit(p, f.selection, cmd);
      assert.equal(receipt.outcome, "oracle-test-committed");
      assert.equal(receipt.receiptPersistence, "none");
      assert.equal(existsSync(f.d.binding.allowanceFile), true);
      const update = f.d.sql.find(q => /\bUPDATE SHIFTER.SHF_ATTENDANCE\b/.test(q.sql)); assert.ok(update);
      const set = /\bSET\b([\s\S]*?)\bWHERE\b/i.exec(update.sql)?.[1]; assert.ok(set);
      const columns = [...set.matchAll(/(?:^|,)\s*([A-Z_][A-Z0-9_]*)\s*=/g)].map(m => m[1]);
      const allowed = kind === "stage" ? ["STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "TADREECH"] :
        kind === "station" ? ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER"] : ["STATION_EXIT_TIME", "STATION_EXIT_USER"];
      assert.deepEqual(columns, allowed);
      for (const [k, value] of Object.entries(before)) if (!allowed.includes(k)) assert.equal(f.d.rows.SHF_ATTENDANCE![k], value);
      assert.equal(f.calls.length, 16); // startup + locked current safety, not a nine-slot facade
      await assert.rejects(app.commit(p, f.selection, { ...cmd, commandId: randomUUID() }));
      assert.equal(f.d.events.filter(e => e === "write:update").length, 1);
    } finally { f.d.dispose(); }
  });
  for (const phase of ["before-update", "commit-ack", "readback"])
    test(`${kind} limited ${phase} cancellation/uncertainty keeps original ownership and UNKNOWN semantics`, async () => {
      const f = fixture(kind), abort = new AbortController();
      try {
        const { app } = await f.application(), p = await f.principal(), v = await app.validate(p, f.selection, f.draft);
        const cmd = { commandId: randomUUID(), draft: f.draft, validationToken: v.validationToken, fingerprint: v.fingerprint,
          ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } };
        f.d.hook = event => {
          if (phase === "before-update" && event === "write:updated") abort.abort();
          if (phase === "commit-ack" && event === "write:commit-ack") abort.abort();
          if (phase === "readback" && f.d.committed && event === "read:lease") throw Error("synthetic read loss");
        };
        await assert.rejects(withRequestBudget(abort.signal, 5000, async () => await app.commit(p, f.selection, cmd, abort.signal)),
          phase === "before-update" ? { code: "DEPENDENCY_TIMEOUT", effect: "rolled-back" } :
            { code: "COMMAND_OUTCOME_UNKNOWN", effect: "unknown" });
        assert.equal(existsSync(f.d.binding.allowanceFile), true);
        if (phase === "before-update") assert.equal(f.d.events.includes("write:commit"), false);
      } finally { f.d.dispose(); }
    });
  test(`${kind} limited privileges do not bypass business validation`, async () => {
    const f = fixture(kind);
    try {
      f.d.rows.SHF_ATTENDANCE!.MISS_REASON_ID = "1";
      const { app } = await f.application();
      await assert.rejects(app.validate(await f.principal(), f.selection, f.draft), { code: "COMMAND_SCOPE_DEFERRED" });
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });
}
test("Oracle11 protocol rejects TAB_COLUMNS.VIRTUAL_COLUMN, while limited query retains visible COLS guard", () => {
  for (const provider of ["dba-v1", "owner-hybrid-v1"] as const)
    assert.throws(() => assertOracle11Projection(nativeMetadataQueries(scopes.stage, provider)[0]), { code: "ORA-00904" });
  const query = nativeMetadataQueries(scopes.stage, "owner-test-limited-v1")[0];
  assertOracle11Projection(query);
  assert.throws(() => assertOracle11Projection(query.replace("tc.hidden_column='NO'", "1=1")));
});
for (const kind of ["stage", "station", "exit"] as const) {
  for (const defect of ["missing-flag", "false-flag", "typo-flag", "profileless", "dev", "production", "NODE_ENV-production",
    "local-development", "missing-native-flag", "mixed-native", "mixed-fixture", "missing-waiver", "wrong-waiver",
    "false-waiver", "true-external-assertion", "false-external-assertion", "strict-with-limited-flag",
    "nonowner-user", "nonowner-schema", "unknown-private-field"])
    test(`${kind} limited startup ${defect} denies before either pool/listener`, async () => {
      const f = fixture(kind, true); let factories = 0;
      try {
        const e = f.environment();
        const packet = { ...f.raw };
        const prefix = kind === "stage" ? "STAGE" : kind === "station" ? "STATION" : "EXIT";
        const config: Record<string, unknown> = { ...f.config };
        if (defect === "missing-flag") delete e.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED;
        if (defect === "false-flag") e.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED = "false";
        if (defect === "typo-flag") e.SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED = "TRUE";
        if (defect === "profileless") delete e.SHF_APP_ENV;
        if (defect === "dev") e.SHF_APP_ENV = "dev";
        if (defect === "production") e.SHF_APP_ENV = "production";
        if (defect === "NODE_ENV-production") e.NODE_ENV = "production";
        if (defect === "local-development") config.deploymentClass = "local-development";
        if (defect === "missing-native-flag") delete e[`SHF_TEST_ORACLE_${prefix}_WRITE_ENABLED`];
        if (defect === "mixed-native") e[kind === "stage" ? "SHF_TEST_ORACLE_EXIT_WRITE_ENABLED" : "SHF_TEST_ORACLE_STAGE_WRITE_ENABLED"] = "true";
        if (defect === "mixed-fixture") e.SHF_ATTENDANCE_FIXTURE = "{}";
        if (defect === "missing-waiver") delete packet.metadataCoverageWaiver;
        if (defect === "wrong-waiver") packet.metadataCoverageWaiver = { ...waiver, id: "synthetic-other" };
        if (defect === "false-waiver") packet.metadataCoverageWaiver = { ...waiver, accepted: false };
        if (defect === "true-external-assertion") packet.noExternalEffectsConfirmed = true;
        if (defect === "false-external-assertion") packet.noExternalEffectsConfirmed = false;
        if (defect === "strict-with-limited-flag") {
          packet.metadataProvider = "owner-hybrid-v1"; packet.noExternalEffectsConfirmed = true;
          delete packet.metadataCoverageWaiver;
        }
        if (defect === "nonowner-user" || defect === "nonowner-schema") {
          packet.writeIdentity = { ...f.d.binding.writeIdentity,
            [defect === "nonowner-user" ? "user" : "schema"]: "SYNTHETIC_OTHER" };
          if (defect === "nonowner-user") e[`SHF_NATIVE_${prefix}_USER`] = "SYNTHETIC_OTHER";
        }
        if (defect === "unknown-private-field") packet.bypass = true;
        e[`SHF_NATIVE_${prefix}_BINDING`] = JSON.stringify(packet);
        e.SHF_ORACLE_CONFIG = JSON.stringify(config);
        await assert.rejects(startFromEnvironment(e, f.d.clock, {
          read: async () => { factories++; throw Error("Unexpected pool creation"); },
          native: async () => { factories++; throw Error("Unexpected pool creation"); },
        }));
        assert.equal(factories, 0);
        assert.equal(f.d.events.length, 0);
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  test(`${kind} limited entrypoint warns with exact fixed text before readiness/pools and does not change public identity`, async () => {
    const f = fixture(kind, true), warnings: string[] = [];
    const write = process.stderr.write;
    let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
    process.stderr.write = (chunk: string | Uint8Array) => { warnings.push(Buffer.from(chunk).toString()); return true; };
    try {
      server = await startFromEnvironment(f.environment(), f.d.clock, {
        read: async () => { assert.deepEqual(warnings, [limitedMetadataWarning + "\n"]); return f.readPool; },
        native: async () => { assert.deepEqual(warnings, [limitedMetadataWarning + "\n"]); return f.writePool; },
      });
      assert.equal(f.calls.length, 8);
      const address = server.address(); assert.ok(address && typeof address !== "string");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/identity`);
      assert.equal(response.status, 200);
      const identity: unknown = await response.json(); assert.ok(record(identity));
      assert.equal(identity.dataSource, "oracle");
      assert.doesNotMatch(JSON.stringify(identity), /metadataCoverageWaiver|collectorMethod|UNKNOWN/);
      assert.deepEqual(warnings, [limitedMetadataWarning + "\n"]);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
    } finally {
      process.stderr.write = write;
      if (server) await stopBackendServer(server);
      f.d.dispose();
    }
  });
  test(`${kind} limited certificate/provider drift cannot be combined with a prepared UoW`, async () => {
    const f = fixture(kind);
    try {
      const { app, uow } = await f.application(), p = await f.principal();
      await app.validate(p, f.selection, f.draft);
      const key = kind === "stage" ? "metadataDigest" : kind === "station" ? "stationMetadataDigest" : "exitMetadataDigest";
      f.raw[key] = "a".repeat(64);
      const changed = f.binding();
      if ("metadataDigest" in changed && uow instanceof OracleStageArrivalUow) {
        assert.notEqual(nativeIdentityBindingReference(changed), uow.identityReference);
        assert.throws(() => new OracleStageArrivalApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      } else if ("stationMetadataDigest" in changed && uow instanceof OracleStationArrivalUow) {
        assert.notEqual(stationIdentityReference(changed), uow.identityReference);
        assert.throws(() => new OracleStationArrivalApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      } else if ("exitMetadataDigest" in changed && uow instanceof OracleStationExitUow) {
        assert.notEqual(exitIdentityReference(changed), uow.identityReference);
        assert.throws(() => new OracleStationExitApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      } else assert.fail("Wrong isolated operation type");
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
    } finally { f.d.dispose(); }
  });
  for (const field of ["user", "schema"])
    test(`${kind} actual owner session ${field} mismatch rejects before USER observations`, async () => {
      const f = fixture(kind);
      try {
        f.sessionObservation({ database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service",
          user: "SHIFTER", schema: "SHIFTER", [field]: "SYNTHETIC_OTHER" });
        await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(f.calls.length, 0);
      } finally { f.d.dispose(); }
    });
  test(`${kind} guarded operator collector returns reviewable limited evidence without a supplied certificate or business reads`, async () => {
    const f = fixture(kind);
    const c = await f.writePool.getConnection();
    try {
      const evidence = await collectLimitedMetadataEvidence(async (sql, binds, bound) => {
        assert.match(sql, /^\s*(?:\/\*.*?\*\/\s*)?SELECT\b/is);
        const result = await c.execute(sql, binds, bound);
        assert.ok(Array.isArray(result.rows)); return result.rows;
      }, f.d.binding.writeIdentity, f.operation, scopes[kind]);
      assert.deepEqual(evidence, f.evidence());
      assert.equal(f.calls.length, 8);
      assert.equal(f.d.events.some(e => e.includes(":row:") || e === "write:update" || e === "write:commit"), false);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
    } finally { await c.rollback(); await c.close(); f.d.dispose(); }
  });
}
test("disabled/read-only construction rejects stray true/malformed limited flags; false/omitted remain ordinary", async () => {
  const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC", dataSource: "isolated-fixture" };
  for (const flag of [undefined, "false"]) assert.equal(validateLimitedMetadataStartup({
    SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: flag }, config), false);
  for (const flag of ["true", "", "TRUE", "0"]) {
    let calls = 0;
    await assert.rejects(startFromEnvironment({ SHF_APP_ENV: "test", SHF_FIXTURE_CONFIG: JSON.stringify(config),
      SHF_FIXTURE_PORT: "0", SHF_FIXTURE_ROWS: "[]", SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: flag }, undefined, {
      read: async () => { calls++; throw Error("Unexpected factory"); }, native: async () => { calls++; throw Error("Unexpected factory"); },
    }));
    assert.equal(calls, 0);
  }
});

// Independently specified Oracle constraint observations: CHECK is not an
// ordered key; PK/UK/FK columns retain their actual positive ordinal values.
function withNullableCheck(kind: Kind) {
  const f = fixture(kind);
  const definition = (name: string, type: string) => ({
    tableName: "SHF_ATTENDANCE", name, kind: type, status: "ENABLED", validated: "VALIDATED",
    referencedOwner: type === "R" ? "SHIFTER" : null, referencedConstraint: type === "R" ? "SYNTHETIC_PARENT_PK" : null,
  });
  f.observed[1].push(definition("SYNTHETIC_CHECK", "C"), definition("SYNTHETIC_UK", "U"), definition("SYNTHETIC_FK", "R"));
  f.observed[2].push(
    { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_CHECK", columnName: "TADREECH", position: null },
    { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_UK", columnName: "STAGE_ARRIVAL_USER", position: 1 },
    { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_UK", columnName: "TADREECH", position: 2 },
    { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_FK", columnName: "LATE_REASON_ID", position: 1 },
  );
  f.certify();
  return f;
}
test("QA48-META-01 F1 required STATION_EXIT_TIME VARCHAR2 fails before privilege/business reads with matching limited certificate", async () => {
  const f = fixture("stage");
  try {
    const column = f.catalog.find(c => c.tableName === "SHF_ATTENDANCE" && c.columnName === "STATION_EXIT_TIME");
    assert.ok(column); column.dataType = "VARCHAR2"; column.charUsed = "B"; column.dataLength = 100;
    f.syncColumns(); f.certify();
    assert.equal(f.raw.metadataDigest, limitedMetadataDigest(f.evidence(), f.operation, scopes.stage));
    await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED", effect: "none" });
    assert.equal(f.d.events.some(e => e.includes(":privilege:") || e.includes(":row:") || e === "write:update"), false);
    assert.equal(existsSync(f.d.binding.allowanceFile), false);
  } finally { f.d.dispose(); }
});
for (const [table, columnName] of [
  ["SHF_EMPLOYEE_DAY", "WM_SHIFT_START_DATETIME"], ["SHF_EMPLOYEE_DAY", "WM_SHIFT_END_DATETIME"],
  ["SHF_EMPLOYEE_DAY", "SPLIT_START"], ["SHF_EMPLOYEE_DAY", "SPLIT_END"],
  ["SHF_DAY_CHANGES", "NEW_SHIFT_START"], ["SHF_DAY_CHANGES", "NEW_SHIFT_END"],
  ["SHF_DAY_CHANGES", "NEW_SPLIT_START"], ["SHF_DAY_CHANGES", "NEW_SPLIT_END"],
  ["SHF_ATTENDANCE", "STAGE_ARRIVAL_TIME"], ["SHF_ATTENDANCE", "STATION_ARRIVAL_TIME"],
  ["SHF_ATTENDANCE", "STATION_EXIT_TIME"], ["SHF_ATTENDANCE", "MISSING_TIME"],
  ["SHF_EMPLOYEE_REPORTS", "APPROVED_TIME"],
] as const)
  test(`F1 required DATE ${table}.${columnName} cannot be certified as VARCHAR2 even when nullable`, async () => {
    const f = fixture("stage");
    try {
      const c = f.catalog.find(r => r.tableName === table && r.columnName === columnName);
      assert.ok(c); c.dataType = "VARCHAR2"; c.charUsed = "B"; c.dataLength = 100;
      f.syncColumns(); f.certify();
      assert.equal(f.raw.metadataDigest, limitedMetadataDigest(f.evidence(), f.operation, scopes.stage));
      await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED", effect: "none" });
      assert.equal(f.d.events.some(e => e.includes(":privilege:") || e.includes(":row:") || e === "write:update"), false);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
    } finally { f.d.dispose(); }
  });
for (const provider of ["dba-v1", "owner-hybrid-v1"] as const)
  test(`QA48-META-01 F1 ${provider} also rejects VARCHAR2 exit time with its matching unchanged certificate formula`, async () => {
    const d = new NativeOracleDouble();
    try {
      for (const c of d.proof[0]) if (record(c) && c.tableName === "SHF_ATTENDANCE" && c.columnName === "STATION_EXIT_TIME")
        c.dataType = "VARCHAR2";
      d.binding.metadataProvider = provider;
      d.binding.metadataDigest = nativeMetadataDigest(provider, "native-stage-arrival-v0.1", Object.keys(nativeTables), d.proof);
      await assert.rejects(d.application(), { code: "LIVE_WRITES_DISABLED", effect: "none" });
      assert.equal(d.events.some(e => e.includes(":privilege:") || e.includes(":row:") || e === "write:update"), false);
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
for (const kind of ["stage", "station", "exit"] as const) {
  test(`${kind} Oracle CHECK POSITION NULL is preserved beside positive PK/UK/FK positions through collection/certificate`, async () => {
    const f = withNullableCheck(kind);
    try {
      const { app } = await f.application(), p = await f.principal();
      await app.validate(p, f.selection, f.draft);
      const parsed = parseLimitedMetadataEvidence(f.evidence(), f.operation, scopes[kind]);
      assert.deepEqual(parsed.observations.constraints, f.observed[1]);
      assert.deepEqual(parsed.observations.constraintColumns, f.observed[2]);
      const check = parsed.observations.constraintColumns.find(r => r.name === "SYNTHETIC_CHECK");
      assert.ok(check); assert.equal(check.position, null);
      assert.equal(parsed.observations.constraintColumns.length, 5);
      assert.deepEqual(parsed.observations.constraintColumns.filter(r => r.name === "SYNTHETIC_UK").map(r => r.position), [1, 2]);
      assert.equal(limitedMetadataDigest(parsed, f.operation, scopes[kind]), fingerprint(f.evidence()));
      const changed = structuredClone(f.evidence());
      const row = changed.observations.constraintColumns.find(r => record(r) && r.name === "SYNTHETIC_CHECK");
      assert.ok(record(row)); row.position = 1;
      assert.notEqual(fingerprint(changed), limitedMetadataDigest(parsed, f.operation, scopes[kind]));
      assert.notEqual(limitedMetadataDigest(changed, f.operation, scopes[kind]), limitedMetadataDigest(parsed, f.operation, scopes[kind]));
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });
  test(`${kind} CHECK multiple NULLs and positive ordinals survive actual collector without sorting/dropping/defaults`, async () => {
    const f = withNullableCheck(kind);
    f.observed[2].push(
      { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_CHECK", columnName: "LATE_MINUTES", position: null },
      { tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_CHECK", columnName: "LATE_REMARK", position: 3 },
    );
    f.certify();
    const c = await f.writePool.getConnection();
    try {
      const collected = await collectLimitedMetadataEvidence(async (sql, binds, bound) => {
        const result = await c.execute(sql, binds, bound); assert.ok(Array.isArray(result.rows)); return result.rows;
      }, f.d.binding.writeIdentity, f.operation, scopes[kind]);
      assert.deepEqual(collected.observations.constraintColumns, f.observed[2]);
      assert.deepEqual(collected.observations.constraints, f.observed[1]);
      assert.deepEqual(collected.observations.constraintColumns.filter(r => r.name === "SYNTHETIC_CHECK").map(r => r.position),
        [null, null, 3]);
      assert.equal(collected.observations.constraintColumns.length, 7);
      assert.equal(limitedMetadataDigest(collected, f.operation, scopes[kind]), fingerprint(f.evidence()));
    } finally { await c.rollback(); await c.close(); f.d.dispose(); }
  });
  for (const defect of ["disabled", "not-validated"])
    test(`${kind} nullable CHECK still enforces ${defect} constraint safety`, async () => {
      const f = withNullableCheck(kind);
      try {
        const c = f.observed[1].find(r => record(r) && r.name === "SYNTHETIC_CHECK"); assert.ok(record(c));
        if (defect === "disabled") c.status = "DISABLED"; else c.validated = "NOT VALIDATED";
        f.certify();
        await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  for (const defect of ["null-P", "null-U", "null-R", "undefined", "missing", "zero", "negative", "fractional", "string",
    "NaN", "Infinity", "-Infinity", "unknown-name", "wrong-table", "unknown-type", "unsupported-type",
    "duplicate-constraint", "duplicate-key-order", "duplicate-key-column", "reversed-key-order",
    "missing-key-order", "missing-key-members", "duplicate-check-column"])
    test(`${kind} constraint association ${defect} remains fail-closed`, () => {
      const f = withNullableCheck(kind);
      try {
        const key = f.observed[2].find(r => record(r) && r.name === "SYNTHETIC_UK" && r.position === 2);
        const check = f.observed[2].find(r => record(r) && r.name === "SYNTHETIC_CHECK");
        assert.ok(record(key) && record(check));
        if (defect.startsWith("null-")) {
          const name = defect === "null-P" ? "SYNTHETIC_PK" : defect === "null-U" ? "SYNTHETIC_UK" : "SYNTHETIC_FK";
          const r = f.observed[2].find(r => record(r) && r.name === name); assert.ok(record(r)); r.position = null;
        }
        if (defect === "undefined") check.position = undefined;
        if (defect === "missing") delete check.position;
        if (defect === "zero") check.position = 0;
        if (defect === "negative") key.position = -1;
        if (defect === "fractional") key.position = 1.5;
        if (defect === "string") key.position = "2";
        if (defect === "NaN") key.position = NaN;
        if (defect === "Infinity") key.position = Infinity;
        if (defect === "-Infinity") key.position = -Infinity;
        if (defect === "unknown-name") check.name = "SYNTHETIC_UNKNOWN";
        if (defect === "wrong-table") check.tableName = "SHF_EMPLOYEES";
        if (defect === "unknown-type" || defect === "unsupported-type") {
          const c = f.observed[1].find(r => record(r) && r.name === "SYNTHETIC_CHECK"); assert.ok(record(c));
          c.kind = defect === "unknown-type" ? "UNKNOWN" : "V";
        }
        if (defect === "duplicate-constraint") f.observed[1].push(structuredClone(f.observed[1][0]));
        if (defect === "duplicate-key-order") key.position = 1;
        if (defect === "duplicate-key-column") key.columnName = "STAGE_ARRIVAL_USER";
        if (defect === "reversed-key-order") {
          const other = f.observed[2].find(r => record(r) && r.name === "SYNTHETIC_UK" && r.position === 1);
          assert.ok(record(other)); other.position = 2; key.position = 1;
        }
        if (defect === "missing-key-order") key.position = 3;
        if (defect === "missing-key-members") f.observed[2] = f.observed[2].filter(r => record(r) && r.name !== "SYNTHETIC_PK");
        if (defect === "duplicate-check-column") f.observed[2].push(structuredClone(check));
        assert.throws(() => parseLimitedMetadataEvidence(f.evidence(), f.operation, scopes[kind]), { code: "LIVE_WRITES_DISABLED" });
      } finally { f.d.dispose(); }
    });
}
