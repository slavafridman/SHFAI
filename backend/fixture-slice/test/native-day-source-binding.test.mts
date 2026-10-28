// Isolated source observations; never a source value learned from live Oracle.
import test from "node:test";
import assert from "node:assert/strict";
import { NativeOracleDouble, nativeConfig } from "./native-stage-arrival-double.mts";
import { StationOracleDouble, stationConfig } from "./native-station-arrival-double.mts";
import { ExitOracleDouble, exitConfig } from "./native-station-exit-double.mts";
import { nativeBinding, nativeEnvironment, nativeIdentityBindingReference, expectedNativeDaySource } from "../native-stage-arrival-config.mts";
import type { NativeMetadataProvider } from "../native-stage-arrival-config.mts";
import { stationBinding, stationEnvironment, stationIdentityReference } from "../native-station-arrival-config.mts";
import { exitBinding, exitEnvironment, exitIdentityReference } from "../native-station-exit-config.mts";
import { OracleReadSession } from "../oracle-session.mts";
import type { OraclePool } from "../oracle-session.mts";
import { OracleStageArrivalUow } from "../oracle-stage-arrival-uow.mts";
import { OracleStationArrivalUow } from "../oracle-station-arrival-uow.mts";
import { OracleStationExitUow } from "../oracle-station-exit-uow.mts";
import { OracleStageArrivalApplication } from "../oracle-stage-arrival-application.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import { OracleStationExitApplication } from "../oracle-station-exit-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import type { NativePool } from "../oracle-stage-arrival-uow.mts";
import { nativeTables, nativeMetadataDigest } from "../oracle-stage-arrival-snapshot.mts";
import { stationTables } from "../oracle-station-arrival-snapshot.mts";
import { exitTables, exitMetadataDigest } from "../oracle-station-exit-snapshot.mts";
import { limitedMetadataCoverage, limitedCollectorMethod, metadataWaiverId } from "../native-metadata-limited.mts";
import type { LimitedOperation } from "../native-metadata-limited.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pilotEmployeeNumber, pilotEmployeePrefix } from "../native-pilot-identity.mts";
import { stationOverlap } from "../oracle-station-arrival-domain.mts";

type Kind = "stage" | "station" | "exit";
function fixture(kind: Kind, provider: NativeMetadataProvider = "dba-v1") {
  const d = kind === "stage" ? new NativeOracleDouble() : kind === "station" ? new StationOracleDouble() : new ExitOracleDouble();
  const config = kind === "stage" ? nativeConfig : kind === "station" ? stationConfig : exitConfig;
  const raw: Record<string, unknown> = { ...d.binding };
  let duplicatePrefix = false;
  let observeMissingLocks = false;
  const operation: LimitedOperation = kind === "stage" ? "native-stage-arrival-v0.1" :
    kind === "station" ? "native-station-arrival-v0.1" : "native-station-exit-v0.1";
  const scope = Object.keys(kind === "stage" ? nativeTables : kind === "station" ? stationTables : exitTables);
  const key = kind === "stage" ? "metadataDigest" : kind === "station" ? "stationMetadataDigest" : "exitMetadataDigest";
  if (provider !== "dba-v1") raw.metadataProvider = provider;
  if (provider === "owner-test-limited-v1") {
    delete raw.noExternalEffectsConfirmed;
    raw.metadataCoverageWaiver = { id: metadataWaiverId, accepted: true, externalEffectsAssessment: "unknown-user-waived" };
  }
  const certify = () => {
    raw[key] = provider === "owner-test-limited-v1" ? fingerprint({ version: "shf-owner-test-limited-proof-v1", provider, owner: "SHIFTER", operation,
      tableScope: scope, waiverId: metadataWaiverId, collectorMethod: limitedCollectorMethod, coverage: limitedMetadataCoverage,
      observations: { columns: d.proof[0], constraints: d.proof[1], constraintColumns: d.proof[2], policies: d.proof[4],
        tablePrivileges: d.proof[5], columnPrivileges: d.proof[6], dependencies: d.proof[8] }, ownerTriggers: [] }) :
      kind === "exit" ? exitMetadataDigest({ operation: "native-station-exit-v0.1", metadataProvider: provider }, d.proof) :
        nativeMetadataDigest(provider, operation, scope, d.proof);
  };
  certify();
  const writePool: NativePool = {
    async getConnection() {
      const c = await d.writePool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        const locked = /FROM SHIFTER\.(SHF_EMPLOYEE_DAY|SHF_EMPLOYEES)\b[\s\S]*FOR UPDATE NOWAIT/.exec(sql)?.[1];
        if (observeMissingLocks && locked && d.rows[locked] === null) return { rows: [] };
        if (duplicatePrefix && /SUBSTR\(EMP_ID_NUMBER,1,8\)=:prefix/.test(sql))
          return { rows: [{ employeeId: "9001" }, { employeeId: "9002" }] };
        if (provider === "owner-test-limited-v1") {
          assert.doesNotMatch(sql, /\bFROM dba_(?:triggers|role_privs)\b/i);
          const sources = ["user_tab_cols", "user_constraints", "user_cons_columns", "user_policies",
            "user_tab_privs", "user_col_privs", "user_dependencies", "user_triggers"];
          const slot = sources.findIndex(view => new RegExp(`\\bFROM ${view}\\b`, "i").test(sql));
          if (slot >= 0) {
            assert.equal(bound, 1001);
            return { rows: structuredClone(slot === 7 ? [] : d.proof[[0, 1, 2, 4, 5, 6, 8][slot]]) };
          }
        }
        return c.execute(sql, binds, bound);
      } };
    }, close: () => d.writePool.close(),
  };
  const readPool: OraclePool = {
    async getConnection() {
      const c = await d.readPool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        if (duplicatePrefix && /SUBSTR\(EMP_ID_NUMBER,1,8\)=:prefix/.test(sql))
          return [{ employeeId: "9001" }, { employeeId: "9002" }];
        return c.execute(sql, binds, bound);
      } };
    }, close: () => d.readPool.close(),
  };
  const binding = () => kind === "stage" ? nativeBinding(raw) : kind === "station" ? stationBinding(raw) : exitBinding(raw);
  return { d, raw, binding, key, certify, selection: { employeeId: "9001", shiftDayId: "6201" },
    duplicatePrefix: () => { duplicatePrefix = true; },
    missingLocks: () => { observeMissingLocks = true; },
    draft: kind === "stage" ? { lateReasonCode: null, lateRemark: null } : kind === "station" ? { lateReasonCode: null } : {},
    principal: () => new SyntheticAdministratorProvider(config).authenticate({ authorization: null }),
    environment(): NodeJS.ProcessEnv {
      const prefix = kind === "stage" ? "STAGE" : kind === "station" ? "STATION" : "EXIT";
      return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(config),
        SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: provider === "owner-test-limited-v1" ? "true" : "false",
        SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
        [`SHF_TEST_ORACLE_${prefix}_WRITE_ENABLED`]: "true", [`SHF_NATIVE_${prefix}_CONNECT_STRING`]: "CTIDBT_WFMT",
        [`SHF_NATIVE_${prefix}_USER`]: "SHIFTER", [`SHF_NATIVE_${prefix}_PASSWORD`]: "synthetic-only-not-a-secret",
        [`SHF_NATIVE_${prefix}_CLIENT_LIB_DIR`]: "synthetic-unused", [`SHF_NATIVE_${prefix}_BINDING`]: JSON.stringify(raw) };
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
    } };
}
for (const kind of ["stage", "station", "exit"] as const)
  test(`${kind} explicit independently configured fifteen-byte day source matches without retagging`, async () => {
    const f = fixture(kind);
    try {
      const observed = "SYNTHETIC_DAYS1";
      assert.equal(Buffer.byteLength(observed), 15);
      f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = observed;
      const legacy = await f.application(), p = await f.principal();
      await assert.rejects(legacy.app.validate(p, f.selection, f.draft), { code: "SHIFT_DAY_NOT_FOUND" });
      f.raw.expectedDaySource = observed;
      const { app } = await f.application();
      const v = await app.validate(p, f.selection, f.draft);
      assert.equal(v.dataSource, "oracle-test");
      assert.equal(f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE, observed);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });

function reference(b: ReturnType<typeof nativeBinding> | ReturnType<typeof stationBinding> | ReturnType<typeof exitBinding>) {
  return "metadataDigest" in b ? nativeIdentityBindingReference(b) :
    "stationMetadataDigest" in b ? stationIdentityReference(b) : exitIdentityReference(b);
}
for (const kind of ["stage", "station", "exit"] as const) {
  test(`${kind} optional source grammar is exact, bounded by bytes, and never coerces empty to NULL`, () => {
    const f = fixture(kind);
    try {
      const omitted = f.binding(), old = reference(omitted);
      assert.equal(Object.hasOwn(omitted, "expectedDaySource"), false);
      assert.equal(expectedNativeDaySource(omitted), "SYNTHETIC_DAYS");
      for (const value of ["SYNTHETIC_DAYS", "SYNTHETIC_DAYS1", "WFM ", "X'Y", "א".repeat(7) + "A", null]) {
        f.raw.expectedDaySource = value;
        const b = f.binding();
        assert.equal(b.expectedDaySource, value);
        assert.equal(expectedNativeDaySource(b), value);
        assert.equal(Object.isFrozen(b), true);
        if (value === "SYNTHETIC_DAYS") assert.equal(reference(b), old);
        else assert.notEqual(reference(b), old);
      }
      for (const value of [undefined, "", "A".repeat(16), "א".repeat(8), "\n", "A\tB", "A\0B", "A\u200bB",
        "\ud800", false, 0, [], {}]) {
        f.raw.expectedDaySource = value;
        assert.throws(f.binding);
      }
      delete f.raw.expectedDaySource;
      f.raw.expectedDaySources = "SYNTHETIC_DAYS1";
      assert.throws(f.binding);
    } finally { f.d.dispose(); }
  });
  for (const provider of ["dba-v1", "owner-hybrid-v1", "owner-test-limited-v1"] as const) {
    for (const value of ["SYNTHETIC_DAYS1", null])
      test(`${kind} ${provider} environment translation preserves explicit source ${JSON.stringify(value)}`, () => {
        const f = fixture(kind, provider);
        try {
          f.raw.expectedDaySource = value;
          const env = f.environment();
          const parsed = kind === "stage" ? nativeEnvironment(env, true) :
            kind === "station" ? stationEnvironment(env, true) : exitEnvironment(env, true);
          assert.ok(parsed);
          assert.equal(parsed.binding.expectedDaySource, value);
          assert.equal(parsed.binding.metadataProvider ?? "dba-v1", provider);
          assert.equal(parsed.binding.employeeId, "9001");
          assert.equal(parsed.binding.shiftDayId, "6201");
        } finally { f.d.dispose(); }
      });
    for (const source of ["SYNTHETIC_DAYS", "SYNTHETIC_DAYS1", "WFM ", null])
      test(`${kind} ${provider} exact source ${JSON.stringify(source)} is independent of its metadata certificate`, async () => {
        const f = fixture(kind, provider);
        try {
          const certificate = f.raw[f.key];
          f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = source;
          if (source !== "SYNTHETIC_DAYS") f.raw.expectedDaySource = source;
          const { app } = await f.application(), p = await f.principal();
          const v = await app.validate(p, f.selection, f.draft);
          assert.equal(v.dataSource, "oracle-test");
          assert.equal(f.raw[f.key], certificate);
          assert.equal(f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE, source);
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
          assert.equal(f.d.events.includes("write:update"), false);
        } finally { f.d.dispose(); }
      });
    for (const [expected, observed] of [
      ["SYNTHETIC_DAYS1", "SYNTHETIC_DAYS"], ["WFM", "wfm"], ["WFM", "WFM "], ["WFM ", "WFM"],
      ["SYNTHETIC_*", "SYNTHETIC_DAYS1"], [null, "SYNTHETIC_DAYS1"], ["SYNTHETIC_DAYS1", null],
    ] as const)
      test(`${kind} ${provider} expected ${JSON.stringify(expected)} does not admit ${JSON.stringify(observed)}`, async () => {
        const f = fixture(kind, provider);
        try {
          f.raw.expectedDaySource = expected;
          f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = observed;
          const { app } = await f.application();
          await assert.rejects(app.validate(await f.principal(), f.selection, f.draft), { code: "SHIFT_DAY_NOT_FOUND" });
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
          assert.equal(f.d.events.includes("write:update"), false);
        } finally { f.d.dispose(); }
      });
    for (const source of ["SYNTHETIC_DAYS1", null])
      test(`${kind} ${provider} command preserves complete source originals ${JSON.stringify(source)} without SOURCE SET`, async () => {
        const f = fixture(kind, provider);
        try {
          f.raw.expectedDaySource = source; f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = source;
          const { app } = await f.application(), p = await f.principal();
          const v = await app.validate(p, f.selection, f.draft);
          const receipt = await app.commit(p, f.selection, { commandId: randomUUID(), draft: f.draft,
            validationToken: v.validationToken, fingerprint: v.fingerprint,
            ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } });
          assert.equal(receipt.outcome, "oracle-test-committed");
          const update = f.d.sql.find(q => /\bUPDATE SHIFTER.SHF_ATTENDANCE\b/.test(q.sql));
          assert.ok(update && record(update.binds));
          const predicates = [...update.sql.matchAll(/\bd\.SOURCE=:(old\d+)\b/g)];
          assert.ok(predicates.length > 0);
          for (const match of predicates) {
            assert.equal(update.binds[match[1]], source);
            assert.match(update.sql, new RegExp(`d\\.SOURCE IS NULL AND :${match[1]} IS NULL`));
          }
          const set = /\bSET\b([\s\S]*?)\bWHERE\b/i.exec(update.sql)?.[1]; assert.ok(set);
          assert.doesNotMatch(set, /\bSOURCE\b/i);
          assert.equal(f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE, source);
        } finally { f.d.dispose(); }
      });
    for (const employeeNumber of ["TEST0001", "TEST0001A", "test0001a", "12345678", "123456789", "000000001"])
      test(`${kind} ${provider} alphanumeric/numeric private employee number ${employeeNumber} retains exact eight-character ownership`, async () => {
        const f = fixture(kind, provider);
        try {
          f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER = employeeNumber;
          f.d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = employeeNumber.slice(0, 8);
          const { app } = await f.application(), p = await f.principal();
          assert.equal((await app.validate(p, f.selection, f.draft)).dataSource, "oracle-test");
          const prefix = f.d.sql.find(q => /SUBSTR\(EMP_ID_NUMBER,1,8\)=:prefix/.test(q.sql));
          assert.ok(prefix && record(prefix.binds));
          assert.equal(prefix.binds.prefix, employeeNumber.slice(0, 8));
          assert.doesNotMatch(prefix.sql, /TO_NUMBER\(:prefix\)/);
          assert.equal(f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER, employeeNumber);
          await assert.rejects(app.validate(p, { employeeId: "TEST0001", shiftDayId: "6201" }, f.draft), { code: "INVALID_REQUEST" });
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
        } finally { f.d.dispose(); }
      });
  }
  for (const employeeNumber of ["TEST001", "TEST0001AB", "TEST0001 ", " TEST0001", "TEST-001A", "TEST_001A", "TEST000אA", "", null, 123456789])
    test(`${kind} malformed private employee number ${JSON.stringify(employeeNumber)} is not normalized/coerced`, async () => {
      const f = fixture(kind);
      try {
        // Raw row seam intentionally admits unknown values; SQL-result parser
        // and/or private employee grammar must deny rather than coerce them.
        Object.assign(f.d.rows.SHF_EMPLOYEES!, { EMP_ID_NUMBER: employeeNumber });
        const { app } = await f.application();
        await assert.rejects(app.validate(await f.principal(), f.selection, f.draft));
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  for (const defect of ["mismatch", "case-mismatch", "invalid-day", "duplicate-prefix"])
    test(`${kind} private alphanumeric prefix ${defect} still denies ownership/ambiguity`, async () => {
      const f = fixture(kind);
      try {
        f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER = "TEST0001A";
        f.d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = defect === "case-mismatch" ? "test0001" :
          defect === "invalid-day" ? "TEST001" : defect === "mismatch" ? "TEST0002" : "TEST0001";
        if (defect === "duplicate-prefix") f.duplicatePrefix();
        const { app } = await f.application();
        await assert.rejects(app.validate(await f.principal(), f.selection, f.draft),
          { code: defect === "duplicate-prefix" ? "INVALID_SOURCE_DATA" : "SHIFT_DAY_NOT_FOUND" });
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  for (const defect of ["capacity", "char-semantics", "type"])
    test(`${kind} employee number requires certified VARCHAR2 BYTE capacity sufficient for nine ASCII bytes: ${defect}`, async () => {
      const f = fixture(kind);
      try {
        for (const c of f.d.proof[0]) if (record(c) && c.tableName === "SHF_EMPLOYEES" && c.columnName === "EMP_ID_NUMBER") {
          if (defect === "capacity") c.dataLength = 8;
          if (defect === "char-semantics") c.charUsed = "C";
          if (defect === "type") c.dataType = "NUMBER";
        }
        f.certify();
        await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED" });
        assert.equal(f.d.events.some(e => e.includes(":privilege:") || e.includes(":row:") || e === "write:update"), false);
      } finally { f.d.dispose(); }
    });
  for (const activity of ["0", "SYNTHETIC_ACTIVITY"])
    test(`${kind} accepted private identifier/source does NOT waive nonnull activity ${activity}`, async () => {
      const f = fixture(kind);
      try {
        f.raw.expectedDaySource = "SYNTHETIC_DAYS1";
        f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "SYNTHETIC_DAYS1";
        f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER = "TEST0001A"; f.d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = "TEST0001";
        f.d.rows.SHF_EMPLOYEE_DAY!.WM_SCH_ACTIVITY_ID_DATA = activity;
        const { app } = await f.application();
        await assert.rejects(app.validate(await f.principal(), f.selection, f.draft), { code: "COMMAND_SCOPE_DEFERRED" });
        assert.equal(f.d.rows.SHF_EMPLOYEE_DAY!.WM_SCH_ACTIVITY_ID_DATA, activity);
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  for (const changedFact of ["SOURCE", "employee-number-suffix", "employee-number-prefix"])
    test(`${kind} prepared ${changedFact} drift is stale before DML and keeps the spent operation fuse`, async () => {
      const f = fixture(kind);
      try {
        f.raw.expectedDaySource = "SYNTHETIC_DAYS1";
        f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "SYNTHETIC_DAYS1";
        f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER = "TEST0001A"; f.d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = "TEST0001";
        const { app } = await f.application(), p = await f.principal();
        const v = await app.validate(p, f.selection, f.draft);
        if (changedFact === "SOURCE") f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "WFM";
        else f.d.rows.SHF_EMPLOYEES!.EMP_ID_NUMBER = changedFact === "employee-number-suffix" ? "TEST0001B" : "NEXT0001A";
        await assert.rejects(app.commit(p, f.selection, { commandId: randomUUID(), draft: f.draft,
          validationToken: v.validationToken, fingerprint: v.fingerprint,
          ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } }),
        { code: "STALE_PREPARATION", effect: "none" });
        assert.equal(f.d.events.includes("write:update"), false);
        assert.equal(f.d.events.includes("write:commit"), false);
        assert.equal(existsSync(f.d.binding.allowanceFile), true);
      } finally { f.d.dispose(); }
    });
  for (const table of ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY"])
    for (const missingAt of ["lock", "snapshot"])
      test(`${kind} missing whole ${table} at prepared ${missingAt} remains private404, not a broad stale catch`, async () => {
        const f = fixture(kind);
        try {
          f.raw.expectedDaySource = "SYNTHETIC_DAYS1"; f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "SYNTHETIC_DAYS1";
          const { app } = await f.application(), p = await f.principal();
          const v = await app.validate(p, f.selection, f.draft);
          f.d.rows[table] = null;
          if (missingAt === "lock") f.missingLocks();
          await assert.rejects(app.context(p, f.selection), { code: "SHIFT_DAY_NOT_FOUND", effect: "none" });
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
          await assert.rejects(app.commit(p, f.selection, { commandId: randomUUID(), draft: f.draft,
            validationToken: v.validationToken, fingerprint: v.fingerprint,
            ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } }),
          { code: "SHIFT_DAY_NOT_FOUND", effect: "none" });
          assert.equal(f.d.events.includes("write:update"), false);
          assert.equal(f.d.events.includes("write:commit"), false);
          assert.equal(existsSync(f.d.binding.allowanceFile), true);
        } finally { f.d.dispose(); }
      });
  test(`${kind} unprepared mismatched SOURCE remains private404; request flags cannot fabricate a prepared read`, async () => {
    const f = fixture(kind);
    try {
      f.raw.expectedDaySource = "SYNTHETIC_DAYS1"; f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "WFM";
      const { app } = await f.application(), p = await f.principal();
      await assert.rejects(app.context(p, f.selection), { code: "SHIFT_DAY_NOT_FOUND" });
      await assert.rejects(app.validate(p, f.selection, f.draft), { code: "SHIFT_DAY_NOT_FOUND" });
      const count = f.d.events.length;
      await assert.rejects(app.context(p, { ...f.selection, prepared: true }), { code: "INVALID_REQUEST" });
      await assert.rejects(app.validate(p, f.selection, { ...f.draft, prepared: true }), { code: "INVALID_REQUEST" });
      await assert.rejects(app.commit(p, f.selection, { commandId: randomUUID(), draft: f.draft,
        validationToken: "a".repeat(43), fingerprint: "a".repeat(64), prepared: true,
        ...(kind === "exit" ? {} : { confirmation: null }), operationConfirmation: { accepted: true } }),
      { code: "INVALID_REQUEST" });
      assert.equal(f.d.events.length, count);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });
  for (const defect of ["marker", "tuple", "employee-owner", "org-owner"])
    test(`${kind} matching configured NULL SOURCE is not synthetic ownership proof: wrong ${defect} denies`, async () => {
      const f = fixture(kind);
      try {
        f.raw.expectedDaySource = null; f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = null;
        if (defect === "marker") { f.d.rows.SHF_EMPLOYEES!.FIRST_NAME = "synthetic-wrong"; f.d.rows.SHF_EMPLOYEES!.LAST_NAME = "synthetic-wrong"; }
        if (defect === "tuple") f.d.rows.SHF_EMPLOYEE_DAY!.SHF_EMPLOYEE_DAY_ID = "6202";
        if (defect === "employee-owner") f.d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = "88888888";
        if (defect === "org-owner") f.d.rows.SHF_EMPLOYEES!.ORG_UNIT_ID = "T002";
        const { app } = await f.application();
        await assert.rejects(app.validate(await f.principal(), f.selection, f.draft), { code: "SHIFT_DAY_NOT_FOUND" });
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
      } finally { f.d.dispose(); }
    });
  test(`${kind} source expectation is immutable and app/UoW source-reference drift rejects construction`, async () => {
    const f = fixture(kind);
    try {
      f.raw.expectedDaySource = "SYNTHETIC_DAYS1"; f.d.rows.SHF_EMPLOYEE_DAY!.SOURCE = "SYNTHETIC_DAYS1";
      const { app, uow } = await f.application(), p = await f.principal();
      await app.validate(p, f.selection, f.draft);
      f.raw.expectedDaySource = null;
      const changed = f.binding(); assert.notEqual(reference(changed), uow.identityReference);
      if ("metadataDigest" in changed && uow instanceof OracleStageArrivalUow)
        assert.throws(() => new OracleStageArrivalApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      else if ("stationMetadataDigest" in changed && uow instanceof OracleStationArrivalUow)
        assert.throws(() => new OracleStationArrivalApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      else if ("exitMetadataDigest" in changed && uow instanceof OracleStationExitUow)
        assert.throws(() => new OracleStationExitApplication(uow, changed, f.d.clock, "UTC", ["T001"]));
      else assert.fail("Wrong isolated operation type");
      // Mutating the caller's packet has not changed either admitted object.
      assert.equal((await app.validate(p, f.selection, f.draft)).dataSource, "oracle-test");
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
    } finally { f.d.dispose(); }
  });
}
test("private pilot grammar does not become public numeric-ID grammar", () => {
  for (const v of ["TEST0001", "TEST0001A", "000000001", "12345678"]) assert.equal(pilotEmployeeNumber(v), true);
  for (const v of ["TEST0001", "00000000", "12345678"]) assert.equal(pilotEmployeePrefix(v), true);
  for (const v of ["TEST0001A", "TEST001", "TEST-001", "TEST000א", 12345678, null]) assert.equal(pilotEmployeePrefix(v), false);
});
test("F2 overlap classifies exact alpha/zero-preserving day and overlay prefixes without numeric conversion", () => {
  const planned = { startLocal: "2026-10-28T12:00:00", endLocal: "2026-10-28T20:00:00" };
  const day = { SHF_EMPLOYEE_DAY_ID: "6201", EMP_ID_NUMBER: "TEST0001", WM_DAY_TYPE: "4",
    WM_SHIFT_START_DATETIME: planned.startLocal, WM_SHIFT_END_DATETIME: planned.endLocal,
    WM_SCH_ACTIVITY_ID_DATA: null, WM_EXCEPTION_TYPE_ID: null, SPLIT_SHIFT: "N", SPLIT_START: null, SPLIT_END: null };
  const selected = { day, change: null };
  assert.equal(stationOverlap([selected], "6201", planned, "UTC", "TEST0001", () => {}), false);
  const overlap = { day: { ...day, SHF_EMPLOYEE_DAY_ID: "6202", EMP_ID_NUMBER: "OTHER001" },
    change: { SHF_EMPLOYEE_DAY_ID: "6202", NEW_EMPLOYEE_ID: "TEST0001" } };
  assert.equal(stationOverlap([selected, overlap], "6201", planned, "UTC", "TEST0001", () => {}), true);
  for (const bad of ["TEST-001", "TEST001", "TEST0001A", "TEST000א"]) {
    assert.throws(() => stationOverlap([{ day: { ...day, EMP_ID_NUMBER: bad }, change: null }],
      "6201", planned, "UTC", "TEST0001", () => {}), { code: "INVALID_SOURCE_DATA" });
    assert.throws(() => stationOverlap([selected, { ...overlap,
      change: { ...overlap.change, NEW_EMPLOYEE_ID: bad } }], "6201", planned, "UTC", "TEST0001", () => {}),
    { code: "INVALID_SOURCE_DATA" });
  }
});
