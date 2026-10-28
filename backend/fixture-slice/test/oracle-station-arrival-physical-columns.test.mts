// Independent historical-schema fixture, NOT current Oracle certification.
// Attendance column names/types below are deliberately NOT read from any
// production table constant or the tag-based protocol double's catalog.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { StationOracleDouble, stationSelection, stationDraft } from "./native-station-arrival-double.mts";
import { NativeOracleDouble } from "./native-stage-arrival-double.mts";
import { OracleReadSession } from "../oracle-session.mts";
import type { OraclePool } from "../oracle-session.mts";
import type { NativePool } from "../oracle-stage-arrival-uow.mts";
import { OracleStationArrivalUow } from "../oracle-station-arrival-uow.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { stationConfig } from "./native-station-arrival-double.mts";
import { nativeMetadataDigest } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeMetadataProvider } from "../native-stage-arrival-config.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";

type PhysicalColumn = { name: string; type: "NUMBER" | "VARCHAR2" | "DATE"; bytes: number };
// oracle-columns.csv:17–38; addLate versus addStageLate are separate triplets.
const attendance: PhysicalColumn[] = [
  { name: "SHF_EMPLOYEE_DAY_ID", type: "NUMBER", bytes: 22 },
  { name: "LATE_MINUTES", type: "NUMBER", bytes: 22 },
  { name: "LATE_REASON_ID", type: "NUMBER", bytes: 22 },
  { name: "LATE_REMARK", type: "VARCHAR2", bytes: 2000 },
  { name: "MISSING_REMARK", type: "VARCHAR2", bytes: 2000 },
  { name: "MISSING_TIME", type: "DATE", bytes: 7 },
  { name: "MISS_REASON_ID", type: "NUMBER", bytes: 22 },
  { name: "OPTIONAL1", type: "VARCHAR2", bytes: 50 },
  { name: "STAGE_ARRIVAL_TIME", type: "DATE", bytes: 7 },
  { name: "STAGE_ARRIVAL_USER", type: "VARCHAR2", bytes: 100 },
  { name: "STATION_ARRIVAL_TIME", type: "DATE", bytes: 7 },
  { name: "STATION_ARRIVAL_USER", type: "VARCHAR2", bytes: 100 },
  { name: "STATION_EXIT_TIME", type: "DATE", bytes: 7 },
  { name: "STATION_EXIT_USER", type: "VARCHAR2", bytes: 100 },
  { name: "STAGE_LATE_REMARK", type: "VARCHAR2", bytes: 2000 },
  { name: "STAGE_LATE_MINUTES", type: "NUMBER", bytes: 22 },
  { name: "STAGE_LATE_REASON_ID", type: "NUMBER", bytes: 22 },
  { name: "TADREECH", type: "NUMBER", bytes: 22 },
  { name: "LATE_FLAG_P2", type: "VARCHAR2", bytes: 50 },
  { name: "STAGE_ARRIVAL_TIME_P2", type: "DATE", bytes: 7 },
  { name: "STAGE_ARRIVAL_USER_P2", type: "VARCHAR2", bytes: 100 },
  { name: "TADREECH_P2", type: "NUMBER", bytes: 22 },
];
const support: Record<string, string> = {
  SHF_EMPLOYEES: "EMPLOYEE_ID:N EMP_ID_NUMBER:T FIRST_NAME:T LAST_NAME:T ORG_UNIT_ID:T SHF_LOCKED:T",
  SHF_EMPLOYEE_DAY: "SHF_EMPLOYEE_DAY_ID:N EMP_ID_NUMBER:T WM_DAY_TYPE:N WM_SHIFT_START_DATETIME:D WM_SHIFT_END_DATETIME:D WM_SCH_ACTIVITY_ID_DATA:T WM_EXCEPTION_TYPE_ID:N SPLIT_SHIFT:T SPLIT_START:D SPLIT_END:D SOURCE:T",
  SHF_DAY_CHANGES: "SHF_EMPLOYEE_DAY_ID:N NEW_EMPLOYEE_ID:T NEW_DAY_TYPE:N NEW_SHIFT_START:D NEW_SHIFT_END:D NEW_ACTIVITY:T NEW_EXCEPTION_TYPE_ID:N CANCEL_REASON_CODE:N NEW_SPLIT_SHIFT:T NEW_SPLIT_START:D NEW_SPLIT_END:D",
  SHF_ORG_UNIT: "ORG_UNIT_ID:T UNIT_TYPE_ID:T PARENT_UNIT:T",
  SHF_EMPLOYEE_REPORTS: "EMPLOYEE_ID:N APPROVED_TIME:D",
  SHF_EMPLOYEE_EXCEPTIONS: "AGENT_DAY_ID:N",
  SHF_EMPLOYEE_EXCEPTIONS_BASE: "AGENT_DAY_ID:N",
};
const reviewedScope = ["SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE",
  "SHF_ORG_UNIT", "SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE"];
function metadata(tableName: string, c: PhysicalColumn) {
  return { tableName, columnName: c.name, dataType: c.type, dataLength: c.bytes,
    charUsed: c.type === "VARCHAR2" ? "B" : null, nullable: "Y", virtualColumn: "NO" };
}
function independentColumns() {
  const supportColumns = Object.entries(support).flatMap(([table, columns]) =>
    columns.split(" ").map(spec => {
      const [name, kind] = spec.split(":");
      const type = kind === "N" ? "NUMBER" : kind === "D" ? "DATE" : "VARCHAR2";
      return metadata(table, { name, type, bytes: type === "NUMBER" ? 22 : type === "DATE" ? 7 : 100 });
    }));
  return [...supportColumns, ...attendance.map(c => metadata("SHF_ATTENDANCE", c))];
}
const physicalNames = new Set(attendance.map(c => c.name));
function physical(column: string) {
  if (!physicalNames.has(column.toUpperCase()))
    throw Object.assign(Error("Unknown isolated physical attendance identifier"), { code: "ORA-00904" });
}
// Bounded test-only expression/alias lexer, not a production SQL parser.
// Remove aliases/literals BEFORE checking source identifiers: valid DTO aliases
// must never conceal a nonexistent column in a source expression.
function validateAttendanceSql(sql: string) {
  const clean = sql.replace(/\/\*[\s\S]*?\*\//g, " ");
  const from = /\bFROM\s+SHIFTER\.SHF_ATTENDANCE\b/i.exec(clean);
  if (from && /^\s*SELECT\b/i.test(clean)) {
    const projection = clean.slice(clean.search(/\bSELECT\b/i) + 6, from.index)
      .replace(/\bAS\s+"[^"]*"/gi, " ").replace(/'(?:''|[^'])*'/g, " ");
    const grammar = new Set(["CASE", "WHEN", "THEN", "ELSE", "END", "IS", "NULL", "AND", "OR",
      "NOT", "TO_CHAR", "TO_DATE", "TO_NUMBER", "COUNT", "AS"]);
    for (const token of projection.matchAll(/\b[A-Z_][A-Z0-9_]*\b/gi)) {
      const name = token[0].toUpperCase(), after = projection.slice(token.index + token[0].length);
      if (after.startsWith(".") || grammar.has(name)) continue;
      physical(name);
    }
  }
  if (/^\s*UPDATE\s+SHIFTER\.SHF_ATTENDANCE\b/i.test(clean)) {
    const set = /\bSET\b([\s\S]*?)\bWHERE\b/i.exec(clean)?.[1];
    assert.ok(set);
    for (const assignment of set.matchAll(/(?:^|,)\s*([A-Z_][A-Z0-9_]*)\s*=/gi)) physical(assignment[1]);
    for (const column of clean.matchAll(/\ba\.([A-Z_][A-Z0-9_]*)\b/gi)) physical(column[1]);
  }
}
function fixture(provider: NativeMetadataProvider) {
  const d = new StationOracleDouble();
  d.proof[0] = independentColumns();
  d.rows.SHF_ATTENDANCE = Object.fromEntries(attendance.map(c => [c.name, null]));
  Object.assign(d.rows.SHF_ATTENDANCE, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: "0" });
  d.binding.metadataProvider = provider;
  const certify = () => {
    d.binding.stationMetadataDigest = nativeMetadataDigest(provider, "native-station-arrival-v0.1", reviewedScope, d.proof);
  };
  certify();
  const readPool: OraclePool = {
    async getConnection() {
      const c = await d.readPool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        validateAttendanceSql(sql); return c.execute(sql, binds, bound);
      } };
    }, close: () => d.readPool.close(),
  };
  const writePool: NativePool = {
    async getConnection() {
      const c = await d.writePool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        validateAttendanceSql(sql); return c.execute(sql, binds, bound);
      } };
    }, close: () => d.writePool.close(),
  };
  return { d, certify, async application() {
    // Reconstruct after any synthetic metadata edit so the privately supplied
    // reviewed certificate is immutable in the UoW under test.
    const current = new OracleStationArrivalUow(writePool, new OracleReadSession(readPool), d.binding, "UTC");
    await current.initialize();
    const app = new OracleStationArrivalApplication(current, d.binding, d.clock, "UTC", ["T001"]);
    const principal = await new SyntheticAdministratorProvider(stationConfig).authenticate({ authorization: null });
    return { app, principal, uow: current };
  } };
}
test("independent physical parser rejects unknown source identifiers even behind a valid alias", () => {
  validateAttendanceSql('SELECT TO_CHAR(LATE_REASON_ID) AS "lateReason" FROM SHIFTER.SHF_ATTENDANCE WHERE 1=0');
  for (const bad of ["STATION_LATE_REASON_ID", "STATION_LATE_MINUTES", "STATION_LATE_REMARK", "UNKNOWN_SOURCE"]) {
    assert.throws(() => validateAttendanceSql(`SELECT TO_CHAR(${bad}) AS "LATE_REASON_ID" FROM SHIFTER.SHF_ATTENDANCE WHERE 1=0`),
      { code: "ORA-00904" });
    assert.throws(() => validateAttendanceSql(`UPDATE SHIFTER.SHF_ATTENDANCE a SET STATION_ARRIVAL_USER=:actor WHERE a.${bad} IS NULL`),
      { code: "ORA-00904" });
  }
});
for (const provider of ["dba-v1", "owner-hybrid-v1"] as const)
  test(`independent real-name attendance catalog is eligible with all late fields NULL (${provider})`, async () => {
    const f = fixture(provider);
    try {
      const { app, principal } = await f.application();
      const context = await app.context(principal, stationSelection);
      assert.equal(context.eligibility, "eligible");
      const validation = await app.validate(principal, stationSelection, stationDraft);
      assert.equal(validation.state, "ready");
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
      for (const [slot, view] of [[3, "dba_triggers"], [7, "dba_role_privs"]] as const) {
        const query = f.d.sql.find(q => q.sql.includes(`station:metadata:${slot}`)); assert.ok(query);
        assert.match(query.sql, new RegExp(`FROM ${view}\\b`));
      }
    } finally { f.d.dispose(); }
  });
for (const provider of ["dba-v1", "owner-hybrid-v1"] as const) {
  for (const column of ["LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"])
    for (const defect of ["missing", "wrong-type"] as const)
      test(`independent ${provider} physical ${column} ${defect} fails certification before probes/business reads`, async () => {
        const f = fixture(provider);
        try {
          if (defect === "missing") f.d.proof[0] = f.d.proof[0].filter(c =>
            !record(c) || c.tableName !== "SHF_ATTENDANCE" || c.columnName !== column);
          else for (const c of f.d.proof[0]) if (record(c) && c.tableName === "SHF_ATTENDANCE" && c.columnName === column)
            c.dataType = column === "LATE_REMARK" ? "NUMBER" : "VARCHAR2";
          f.certify();
          await assert.rejects(f.application(), { code: "LIVE_WRITES_DISABLED", effect: "none" });
          assert.equal(f.d.events.some(e => e.includes(":privilege:") || e.includes(":row:") || e === "write:update"), false);
          assert.equal(existsSync(f.d.binding.allowanceFile), false);
        } finally { f.d.dispose(); }
      });
  for (const [column, value] of [["LATE_REASON_ID", "1"], ["LATE_MINUTES", "0"], ["LATE_REMARK", "synthetic remark"]] as const)
    test(`independent ${provider} nonnull ${column} maps to EXISTING_STATION_LATE without fuse/DML`, async () => {
      const f = fixture(provider);
      try {
        f.d.rows.SHF_ATTENDANCE![column] = value;
        const originals = structuredClone(f.d.rows.SHF_ATTENDANCE);
        const { app, principal } = await f.application();
        const context = await app.context(principal, stationSelection);
        assert.equal(context.eligibility, "deferred");
        assert.deepEqual(context.blockers, ["EXISTING_STATION_LATE"]);
        await assert.rejects(app.validate(principal, stationSelection, stationDraft), { code: "COMMAND_SCOPE_DEFERRED", effect: "none" });
        assert.deepEqual(f.d.rows.SHF_ATTENDANCE, originals);
        assert.equal(existsSync(f.d.binding.allowanceFile), false);
        assert.equal(f.d.events.includes("write:update"), false);
        assert.equal(f.d.events.includes("write:commit"), false);
      } finally { f.d.dispose(); }
    });
  test(`independent ${provider} privilege/projection/full UPDATE originals use physical late names and two SET columns only`, async () => {
    const f = fixture(provider);
    try {
      Object.assign(f.d.rows.SHF_ATTENDANCE!, { STAGE_ARRIVAL_TIME: "2026-10-28T11:00:00",
        STAGE_ARRIVAL_USER: "synthetic-preexisting-stage", TADREECH: "1" });
      const originals = structuredClone(f.d.rows.SHF_ATTENDANCE!);
      const { app, principal } = await f.application();
      const v = await app.validate(principal, stationSelection, stationDraft);
      const receipt = await app.commit(principal, stationSelection, {
        commandId: randomUUID(), draft: stationDraft, validationToken: v.validationToken, fingerprint: v.fingerprint,
        confirmation: null, operationConfirmation: { accepted: true },
      });
      assert.equal(receipt.outcome, "oracle-test-committed");
      assert.equal(receipt.recorded.stageArrivalLocal, originals.STAGE_ARRIVAL_TIME);
      assert.equal(receipt.recorded.briefing, true);
      const privilege = f.d.sql.find(q => q.sql.includes("station:privilege:SHF_ATTENDANCE"));
      const projection = f.d.sql.find(q => q.sql.includes("native:row:SHF_ATTENDANCE"));
      const update = f.d.sql.find(q => q.sql.includes("station:update"));
      assert.ok(privilege && projection && update && record(update.binds));
      for (const column of ["LATE_REASON_ID", "LATE_MINUTES", "LATE_REMARK"]) {
        assert.match(privilege.sql, new RegExp(`\\b${column}\\b`));
        assert.match(projection.sql, new RegExp(`\\b${column}\\b`));
        const predicate = new RegExp(`a\\.${column}=(?:TO_NUMBER\\()?:(old[0-9]+)\\b`).exec(update.sql);
        assert.ok(predicate, column + " has its own complete original-value binding");
        assert.equal(update.binds[predicate[1]], null);
      }
      const set = /\bSET\b([\s\S]*?)\bWHERE\b/i.exec(update.sql)?.[1]; assert.ok(set);
      assert.deepEqual([...set.matchAll(/(?:^|,)\s*([A-Z_][A-Z0-9_]*)\s*=/g)].map(m => m[1]),
        ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER"]);
      assert.doesNotMatch(f.d.sql.map(q => q.sql).join("\n"), /\bSTATION_LATE_[A-Z_]+\b/);
      for (const column of ["STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "STAGE_LATE_REMARK"])
        assert.equal(f.d.rows.SHF_ATTENDANCE![column], originals[column]);
      assert.deepEqual(f.d.rows.SHF_ATTENDANCE, { ...originals, STATION_ARRIVAL_TIME: "2026-10-28T12:00:00",
        STATION_ARRIVAL_USER: "synthetic:administrator" });
    } finally { f.d.dispose(); }
  });
}
for (const [column, value] of [["STAGE_LATE_REASON_ID", "1"], ["STAGE_LATE_MINUTES", "0"], ["STAGE_LATE_REMARK", "synthetic stage"]] as const)
  test(`independent nonnull ${column} stays a distinct preserved unsupported dependency, not station lateness`, async () => {
    const f = fixture("dba-v1");
    try {
      f.d.rows.SHF_ATTENDANCE![column] = value;
      const originals = structuredClone(f.d.rows.SHF_ATTENDANCE);
      const { app, principal } = await f.application();
      const context = await app.context(principal, stationSelection);
      assert.deepEqual(context.blockers, ["UNSUPPORTED_DAY"]);
      await assert.rejects(app.validate(principal, stationSelection, stationDraft), { code: "COMMAND_SCOPE_DEFERRED", effect: "none" });
      assert.deepEqual(f.d.rows.SHF_ATTENDANCE, originals);
      assert.equal(existsSync(f.d.binding.allowanceFile), false);
      assert.equal(f.d.events.includes("write:update"), false);
    } finally { f.d.dispose(); }
  });
for (const [column, value] of [["LATE_REASON_ID", "1"], ["LATE_MINUTES", "0"], ["LATE_REMARK", "synthetic station"]] as const)
  test(`unchanged F1 rejects nonnull physical ${column} from the independent complete attendance catalog`, async () => {
    const d = new NativeOracleDouble();
    try {
      d.proof[0] = d.proof[0].filter(c => !record(c) || c.tableName !== "SHF_ATTENDANCE")
        .concat(attendance.map(c => metadata("SHF_ATTENDANCE", c)));
      d.rows.SHF_ATTENDANCE = Object.fromEntries(attendance.map(c => [c.name, null]));
      Object.assign(d.rows.SHF_ATTENDANCE, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: "0", [column]: value });
      d.binding.metadataDigest = fingerprint(d.proof);
      const originals = structuredClone(d.rows.SHF_ATTENDANCE);
      const { app, principal } = await d.application();
      const context = await app.context(principal, stationSelection);
      assert.ok(context.blockers.includes("DEPENDENT_ATTENDANCE_PRESENT"));
      await assert.rejects(app.validate(principal, stationSelection, { lateReasonCode: null, lateRemark: null }),
        { code: "COMMAND_SCOPE_DEFERRED", effect: "none" });
      assert.deepEqual(d.rows.SHF_ATTENDANCE, originals);
      assert.equal(existsSync(d.binding.allowanceFile), false);
      assert.equal(d.events.includes("write:update"), false);
      assert.doesNotMatch(d.sql.map(q => q.sql).join("\n"), /\bSTATION_LATE_[A-Z_]+\b/);
    } finally { d.dispose(); }
  });
