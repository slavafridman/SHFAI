// ISOLATED TEST DOUBLE: synthetic in-memory Oracle protocol, not live evidence.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BindParameters } from "oracledb";
import type { NativePool, NativeConnection } from "../oracle-stage-arrival-uow.mts";
import type { OraclePool } from "../oracle-session.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { OracleStationExitUow } from "../oracle-station-exit-uow.mts";
import { OracleStationExitApplication } from "../oracle-station-exit-application.mts";
import { exitTables, exitMetadataDigest, exitPolicyKeys } from "../oracle-station-exit-snapshot.mts";
import type { NativeRow } from "../oracle-stage-arrival-snapshot.mts";
import type { StationCandidate } from "../oracle-station-arrival-domain.mts";
import type { ExitBinding } from "../native-station-exit-config.mts";
import { nativeMarker } from "../native-stage-arrival-config.mts";
import { record } from "../contract-validation.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
export const exitConfig = { attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
  attendanceStationExitMode: "test-oracle-controlled", dataSource: "oracle-read-only", oracleTestScopeConfirmed: true,
  deploymentClass: "isolated-test-demo", authenticationMode: "synthetic", syntheticAdministratorEnabled: true,
  syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC" };
export const exitSelection = { employeeId: "9001", shiftDayId: "6201" };
export class ExitOracleDouble {
  readonly directory = mkdtempSync(join(tmpdir(), "shf-exit-double-"));
  readonly binding: ExitBinding;
  readonly rows: Record<string, NativeRow | null>;
  readonly proof: unknown[][];
  readonly events: string[] = [];
  readonly sql: Array<{ sql: string; binds: BindParameters; source: "read" | "write" }> = [];
  readonly observations = {
    read: { database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service", user: "SYNTHETIC_READ", schema: "SYNTHETIC_READ" },
    write: { database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service", user: "SHIFTER", schema: "SHIFTER" },
  };
  clockMs = Date.parse("2026-10-28T15:59:30.123Z");
  readonly clock = { now: () => new Date(this.clockMs) };
  committed = false;
  count: number | undefined = 1;
  reports = "0"; exceptions = "0"; baseExceptions = "0";
  extraCandidates: StationCandidate[] = [];
  duplicateTable?: string;
  hook?: (event: string) => Promise<void> | void;
  async point(event: string) { this.events.push(event); await this.hook?.(event); }
  constructor(realClock = false, fixtureClockMs?: number) {
    if (realClock) this.clockMs = fixtureClockMs ?? Date.now();
    this.binding = { marker: nativeMarker, ...exitSelection, orgUnitId: "T001",
      operation: "native-station-exit-v0.1", exitMetadataDigest: "0".repeat(64),
      readIdentity: { ...this.observations.read }, writeIdentity: { ...this.observations.write },
      approval: "synthetic-approval", freezeOwner: "synthetic-freeze", recoveryOwner: "synthetic-recovery",
      writerFreezeConfirmed: true, noExternalEffectsConfirmed: true, singleExecutorConfirmed: true,
      windowStart: new Date(this.clockMs - 600000).toISOString(), windowEnd: new Date(this.clockMs + 1200000).toISOString(),
      allowanceFile: join(this.directory, "station-exit-single-attempt") };
    const number = new Set(["EMPLOYEE_ID", "SHF_EMPLOYEE_DAY_ID", "WM_DAY_TYPE", "WM_EXCEPTION_TYPE_ID",
      "NEW_DAY_TYPE", "NEW_EXCEPTION_TYPE_ID", "CANCEL_REASON_CODE", "TADREECH", "MISS_REASON_ID",
      "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "LATE_REASON_ID", "LATE_MINUTES", "AGENT_DAY_ID",
      "WM_SITE_ID", "NEW_SITE_ID", "SS_SITE_ID"]);
    const date = new Set(["WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME", "NEW_SHIFT_START", "NEW_SHIFT_END",
      "SPLIT_START", "SPLIT_END", "NEW_SPLIT_START", "NEW_SPLIT_END", "STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME",
      "STATION_EXIT_TIME", "MISSING_TIME", "APPROVED_TIME"]);
    this.proof = [Object.entries(exitTables).flatMap(([tableName, names]) => names.map(columnName => ({
      tableName, columnName, dataType: number.has(columnName) ? "NUMBER" : date.has(columnName) ? "DATE" : "VARCHAR2",
      dataLength: columnName === "EMP_ID_NUMBER" ? 9 : 100, charUsed: "B", nullable: "Y", virtualColumn: "NO",
    }))), [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", kind: "P", status: "ENABLED", validated: "VALIDATED",
      referencedOwner: null, referencedConstraint: null }],
    [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", columnName: "SHF_EMPLOYEE_DAY_ID", position: 1 }],
    [], [], [], [], [], []];
    this.certify();
    this.rows = Object.fromEntries(Object.entries(exitTables).map(([table, names]) =>
      [table, Object.fromEntries(names.map(name => [name, null]))]));
    Object.assign(this.rows.SHF_EMPLOYEES!, { EMPLOYEE_ID: "9001", EMP_ID_NUMBER: "999999991", FIRST_NAME: nativeMarker,
      LAST_NAME: "Synthetic", ORG_UNIT_ID: "T001", SHF_LOCKED: "0" });
    const day = new Date(this.clockMs).toISOString().slice(0, 10);
    // Real-clock entrypoints may run before 08:00 UTC; keep synthetic arrival/start
    // on today's UTC date and no later than the same captured clock.
    const start = realClock ? new Date(Math.max(Date.parse(day + "T00:00:00Z"),
      this.clockMs - 3600000)).toISOString().slice(0, 19) : day + "T08:00:00";
    // Keep the plan on today's date; A10 admits the fractional final second
    // after this whole-second end without changing the production midnight guard.
    const end = realClock ? new Date(Math.min(this.clockMs + 10000,
      Date.parse(day + "T23:59:59Z"))).toISOString().slice(0, 19) : day + "T16:00:00";
    Object.assign(this.rows.SHF_EMPLOYEE_DAY!, { SHF_EMPLOYEE_DAY_ID: "6201", EMP_ID_NUMBER: "99999999", WM_DAY_TYPE: "4",
      WM_SHIFT_START_DATETIME: start, WM_SHIFT_END_DATETIME: end,
      WM_SITE_ID: "7001", SPLIT_SHIFT: "N", SOURCE: "SYNTHETIC_DAYS" });
    this.rows.SHF_DAY_CHANGES = null;
    Object.assign(this.rows.SHF_ATTENDANCE!, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: "0",
      STATION_ARRIVAL_TIME: start, STATION_ARRIVAL_USER: "synthetic-original" });
    this.rows.team = { ORG_UNIT_ID: "T001", UNIT_TYPE_ID: "J01", PARENT_UNIT: "M001" };
    this.rows.parent = { ORG_UNIT_ID: "M001", UNIT_TYPE_ID: "G01", PARENT_UNIT: null };
    this.rows.mapping = { SS_SITE_ID: "7001", SOU_ORG_UNIT_ID: "M001" };
    for (const [i, key] of exitPolicyKeys.entries()) {
      this.rows[`system${i}`] = { PARAM_KEY: key, DEFAULT_VALUE: i === 0 ? "0" : "10" };
      this.rows[`unit${i}`] = null;
    }
  }
  certify() { this.binding.exitMetadataDigest = exitMetadataDigest(this.binding, this.proof); }
  dispose() { rmSync(this.directory, { force: true, recursive: true }); }
  private async query(sql: string, binds: BindParameters, source: "read" | "write") {
    this.sql.push({ sql, binds: structuredClone(binds), source });
    const tag = /\/\* ((?:native|exit):[^*]+) \*\//.exec(sql)?.[1] ?? (sql.startsWith("SET") ? "readonly" : "probe");
    await this.point(`${source}:${tag}`);
    if (tag === "readonly") return [];
    if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
    if (tag === "probe") {
      if (sql.includes('"grantCode"')) return [{ grantCode: "T001", teamCode: "T001", teamLabel: "Synthetic team", teamType: "J01",
        code: "M001", label: "Synthetic parent", unitType: "G01" }];
      if (sql.toLowerCase().includes("shf_inner_jobs")) return [];
      return [{ probe: 1 }];
    }
    if (tag === "native:identity") return [structuredClone(this.observations[source])];
    if (tag.startsWith("exit:metadata:")) return structuredClone(this.proof[Number(tag.split(":")[2])]);
    if (tag.startsWith("exit:privilege:")) return [];
    if (tag.startsWith("exit:lock:")) return [{ key: 1 }];
    if (tag === "exit:marker" || tag === "exit:prefix") return [{ employeeId: "9001" }];
    if (tag === "exit:reports") return [{ count: this.reports }];
    if (tag === "exit:exceptions") return [{ count: this.exceptions }];
    if (tag === "exit:exceptions-base") return [{ count: this.baseExceptions }];
    if (tag === "exit:candidates") {
      return [{ day: this.rows.SHF_EMPLOYEE_DAY!, change: this.rows.SHF_DAY_CHANGES }, ...this.extraCandidates]
        .map(c => Object.fromEntries([...Object.entries(c.day).map(([k, v]) => [`d_${k}`, v]),
          ...exitTables.SHF_DAY_CHANGES.map(k => [`c_${k}`, c.change?.[k] ?? null])]));
    }
    if (tag.startsWith("native:row:") && record(binds)) {
      const table = tag.slice("native:row:".length);
      const i = binds.policyKey === exitPolicyKeys[0] ? 0 : 1;
      const key = table === "SHF_ORG_UNIT" ? binds.unit === "T001" ? "team" : "parent" :
        table === "SHF_ORG_UNITS_SHF_SITES" ? "mapping" : table === "SHF_SYSTEM_PARAM" ? `system${i}` :
        table === "SHF_UNIT_PARAM" ? `unit${i}` : table;
      return this.rows[key] ? Array.from({ length: this.duplicateTable === table ? 2 : 1 }, () => structuredClone(this.rows[key])) : [];
    }
    throw Error("Unexpected isolated exit query");
  }
  readonly readPool: OraclePool = {
    getConnection: async () => {
      await this.point("read:lease");
      return { callTimeout: 0, execute: (sql, binds) => this.query(sql, binds, "read"),
        break: async () => { await this.point("read:break"); }, rollback: async () => { await this.point("read:rollback"); },
        close: async drop => { await this.point(`read:close:${Boolean(drop)}`); } };
    }, close: async () => { await this.point("read:pool-close"); },
  };
  readonly writePool: NativePool = {
    getConnection: async (): Promise<NativeConnection> => {
      await this.point("write:lease");
      let staged: NativeRow | null = null, active = false;
      return { callTimeout: 0, execute: async (sql, binds) => {
        if (!sql.includes("exit:update")) return { rows: await this.query(sql, binds, "write") };
        this.sql.push({ sql, binds: structuredClone(binds), source: "write" }); active = true;
        try {
          await this.point("write:update");
          if (this.count === 1 && record(binds)) staged = { ...this.rows.SHF_ATTENDANCE!,
            STATION_EXIT_TIME: String(binds.newExitLocal), STATION_EXIT_USER: String(binds.actor) };
          await this.point("write:updated"); return { rowsAffected: this.count };
        } finally { active = false; }
      }, commit: async () => {
        active = true;
        try {
          await this.point("write:commit"); if (staged) this.rows.SHF_ATTENDANCE = staged;
          staged = null; this.committed = true; await this.point("write:commit-ack");
        } finally { active = false; }
      }, rollback: async () => { await this.point("write:rollback"); staged = null; },
      break: async () => { await this.point("write:break"); },
      close: async drop => { if (active) throw Error("Busy lease released"); await this.point(`write:close:${Boolean(drop)}`); } };
    }, close: async () => { await this.point("write:pool-close"); },
  };
  async application(zone = "UTC") {
    const uow = new OracleStationExitUow(this.writePool, new OracleReadSession(this.readPool), this.binding, zone);
    await uow.initialize();
    const app = new OracleStationExitApplication(uow, this.binding, this.clock, zone, ["T001"]);
    const principal = await new SyntheticAdministratorProvider(exitConfig).authenticate({ authorization: null });
    return { app, principal, uow };
  }
}
