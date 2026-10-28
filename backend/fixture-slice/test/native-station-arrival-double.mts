// Isolated protocol double ONLY. Never a real Oracle/partner implementation.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BindParameters } from "oracledb";
import type { NativePool, NativeConnection } from "../oracle-stage-arrival-uow.mts";
import type { OraclePool } from "../oracle-session.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { OracleStationArrivalUow } from "../oracle-station-arrival-uow.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import { stationTables } from "../oracle-station-arrival-snapshot.mts";
import type { NativeRow } from "../oracle-stage-arrival-snapshot.mts";
import type { StationBinding } from "../native-station-arrival-config.mts";
import { nativeMarker } from "../native-stage-arrival-config.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";

export const stationConfig = { attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "test-oracle-controlled",
  dataSource: "oracle-read-only", oracleTestScopeConfirmed: true, deploymentClass: "isolated-test-demo",
  authenticationMode: "synthetic", syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC" };
export const stationSelection = { employeeId: "9001", shiftDayId: "6201" };
export const stationDraft = { lateReasonCode: null };
export class StationOracleDouble {
  readonly directory = mkdtempSync(join(tmpdir(), "shf-station-double-"));
  readonly binding: StationBinding;
  readonly rows: Record<string, NativeRow | null>;
  readonly proof: unknown[][];
  readonly events: string[] = [];
  readonly sql: Array<{ sql: string; binds: BindParameters; source: "read" | "write" }> = [];
  readonly observations = {
    read: { database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service", user: "SYNTHETIC_READ", schema: "SYNTHETIC_READ" },
    write: { database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service", user: "SHIFTER", schema: "SHIFTER" },
  };
  clockMs = Date.parse("2026-10-28T12:00:00.000Z");
  readonly clock = { now: () => new Date(this.clockMs) };
  committed = false;
  count: number | undefined = 1;
  reports = "0";
  exceptions = "0";
  baseExceptions = "0";
  extraCandidates: Array<{ day: NativeRow; change: NativeRow | null }> = [];
  hook?: (event: string) => Promise<void> | void;
  async point(event: string) { this.events.push(event); await this.hook?.(event); }
  constructor(realClock = false) {
    if (realClock) this.clockMs = Date.now();
    this.binding = { marker: nativeMarker, ...stationSelection, orgUnitId: "T001",
      operation: "native-station-arrival-v0.1", stationMetadataDigest: "0".repeat(64),
      readIdentity: { ...this.observations.read }, writeIdentity: { ...this.observations.write },
      approval: "synthetic-approval", freezeOwner: "synthetic-freeze", recoveryOwner: "synthetic-recovery",
      writerFreezeConfirmed: true, noExternalEffectsConfirmed: true, singleExecutorConfirmed: true,
      windowStart: new Date(this.clockMs - 60000).toISOString(), windowEnd: new Date(this.clockMs + 1200000).toISOString(),
      allowanceFile: join(this.directory, "station-arrival-single-attempt") };
    const number = new Set(["EMPLOYEE_ID", "SHF_EMPLOYEE_DAY_ID", "WM_DAY_TYPE", "WM_EXCEPTION_TYPE_ID",
      "NEW_DAY_TYPE", "NEW_EXCEPTION_TYPE_ID", "CANCEL_REASON_CODE", "TADREECH", "MISS_REASON_ID",
      "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES", "LATE_REASON_ID", "LATE_MINUTES", "AGENT_DAY_ID", "TADREECH_P2"]);
    const date = new Set(["WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME", "NEW_SHIFT_START", "NEW_SHIFT_END",
      "SPLIT_START", "SPLIT_END", "NEW_SPLIT_START", "NEW_SPLIT_END", "STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME",
      "STATION_EXIT_TIME", "MISSING_TIME", "APPROVED_TIME", "STAGE_ARRIVAL_TIME_P2"]);
    // Historical attendance names are independent of stationTables, so a
    // misspelled production requirement cannot silently rewrite this catalog.
    const fixtureTables = { ...stationTables, SHF_ATTENDANCE: [
      "SHF_EMPLOYEE_DAY_ID", "LATE_MINUTES", "LATE_REASON_ID", "LATE_REMARK", "MISSING_REMARK", "MISSING_TIME",
      "MISS_REASON_ID", "OPTIONAL1", "STAGE_ARRIVAL_TIME", "STAGE_ARRIVAL_USER", "STATION_ARRIVAL_TIME",
      "STATION_ARRIVAL_USER", "STATION_EXIT_TIME", "STATION_EXIT_USER", "STAGE_LATE_REMARK", "STAGE_LATE_MINUTES",
      "STAGE_LATE_REASON_ID", "TADREECH", "LATE_FLAG_P2", "STAGE_ARRIVAL_TIME_P2", "STAGE_ARRIVAL_USER_P2", "TADREECH_P2",
    ] };
    this.proof = [Object.entries(fixtureTables).flatMap(([tableName, names]) => names.map(columnName => ({
      tableName, columnName, dataType: number.has(columnName) ? "NUMBER" : date.has(columnName) ? "DATE" : "VARCHAR2",
      dataLength: 100, charUsed: "B", nullable: "Y", virtualColumn: "NO",
    }))), [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", kind: "P", status: "ENABLED", validated: "VALIDATED",
      referencedOwner: null, referencedConstraint: null }],
    [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", columnName: "SHF_EMPLOYEE_DAY_ID", position: 1 }],
    [], [], [], [], [], []];
    this.certify();
    this.rows = Object.fromEntries(Object.entries(fixtureTables).map(([table, names]) =>
      [table, Object.fromEntries(names.map(name => [name, null]))]));
    Object.assign(this.rows.SHF_EMPLOYEES!, { EMPLOYEE_ID: "9001", EMP_ID_NUMBER: "999999991", FIRST_NAME: nativeMarker,
      LAST_NAME: "Synthetic", ORG_UNIT_ID: "T001", SHF_LOCKED: "0" });
    Object.assign(this.rows.SHF_EMPLOYEE_DAY!, { SHF_EMPLOYEE_DAY_ID: "6201", EMP_ID_NUMBER: "99999999", WM_DAY_TYPE: "4",
      WM_SHIFT_START_DATETIME: new Date(this.clockMs + 1200000).toISOString().slice(0, 19),
      WM_SHIFT_END_DATETIME: new Date(this.clockMs + 28800000).toISOString().slice(0, 19), SPLIT_SHIFT: "N", SOURCE: "SYNTHETIC_DAYS" });
    this.rows.SHF_DAY_CHANGES = null;
    Object.assign(this.rows.SHF_ATTENDANCE!, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: "0" });
    this.rows.team = { ORG_UNIT_ID: "T001", UNIT_TYPE_ID: "J01", PARENT_UNIT: "M001" };
    this.rows.parent = { ORG_UNIT_ID: "M001", UNIT_TYPE_ID: "G01", PARENT_UNIT: null };
  }
  certify() { this.binding.stationMetadataDigest = fingerprint({ operation: this.binding.operation, proof: this.proof }); }
  dispose() { rmSync(this.directory, { force: true, recursive: true }); }
  private async query(sql: string, binds: BindParameters, source: "read" | "write") {
    this.sql.push({ sql, binds: structuredClone(binds), source });
    const tag = /\/\* ((?:native|station):[^*]+) \*\//.exec(sql)?.[1] ?? (sql.startsWith("SET") ? "readonly" : "probe");
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
    if (tag.startsWith("station:metadata:")) return structuredClone(this.proof[Number(tag.split(":")[2])]);
    if (tag.startsWith("station:privilege:")) return [];
    if (tag.startsWith("station:lock:")) return [{ key: 1 }];
    if (tag === "station:marker" || tag === "station:prefix") return [{ employeeId: "9001" }];
    if (tag === "station:reports") return [{ count: this.reports }];
    if (tag === "station:exceptions") return [{ count: this.exceptions }];
    if (tag === "station:exceptions-base") return [{ count: this.baseExceptions }];
    if (tag === "station:candidates") {
      const candidates = [{ day: this.rows.SHF_EMPLOYEE_DAY!, change: this.rows.SHF_DAY_CHANGES }, ...this.extraCandidates];
      return candidates.map(c => Object.fromEntries([
        ...Object.entries(c.day).map(([k, v]) => [`d_${k}`, v]),
        ...stationTables.SHF_DAY_CHANGES.map(k => [`c_${k}`, c.change?.[k] ?? null]),
      ]));
    }
    if (tag.startsWith("native:row:")) {
      const table = tag.slice("native:row:".length);
      const key = table === "SHF_ORG_UNIT" && record(binds) ? binds.unit === "T001" ? "team" : "parent" : table;
      return this.rows[key] ? [structuredClone(this.rows[key])] : [];
    }
    throw Error("Unexpected isolated station query");
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
      return { callTimeout: 0,
        execute: async (sql, binds) => {
          if (!sql.includes("station:update")) return { rows: await this.query(sql, binds, "write") };
          this.sql.push({ sql, binds: structuredClone(binds), source: "write" }); active = true;
          try {
            await this.point("write:update");
            if (this.count === 1 && record(binds)) staged = { ...this.rows.SHF_ATTENDANCE!,
              STATION_ARRIVAL_TIME: String(binds.newStationLocal), STATION_ARRIVAL_USER: String(binds.actor) };
            await this.point("write:updated"); return { rowsAffected: this.count };
          } finally { active = false; }
        },
        commit: async () => {
          active = true;
          try {
            await this.point("write:commit"); if (staged) this.rows.SHF_ATTENDANCE = staged;
            staged = null; this.committed = true; await this.point("write:commit-ack");
          } finally { active = false; }
        },
        rollback: async () => { await this.point("write:rollback"); staged = null; },
        break: async () => { await this.point("write:break"); },
        close: async drop => { if (active) throw Error("Busy lease released"); await this.point(`write:close:${Boolean(drop)}`); },
      };
    }, close: async () => { await this.point("write:pool-close"); },
  };
  async application(zone = "UTC") {
    const uow = new OracleStationArrivalUow(this.writePool, new OracleReadSession(this.readPool), this.binding, zone);
    await uow.initialize();
    const app = new OracleStationArrivalApplication(uow, this.binding, this.clock, zone, ["T001"]);
    const principal = await new SyntheticAdministratorProvider(stationConfig).authenticate({ authorization: null });
    return { app, principal, uow };
  }
}
