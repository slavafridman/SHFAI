// Isolated Oracle protocol double. NO live database/client connection.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BindParameters } from "oracledb";
import type { NativeBinding } from "../native-stage-arrival-config.mts";
import { nativeMarker } from "../native-stage-arrival-config.mts";
import type { NativeConnection, NativePool } from "../oracle-stage-arrival-uow.mts";
import { OracleStageArrivalUow } from "../oracle-stage-arrival-uow.mts";
import { OracleReadSession } from "../oracle-session.mts";
import type { OraclePool, OracleConnection } from "../oracle-session.mts";
import { nativeTables, policyKey } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeRow } from "../oracle-stage-arrival-snapshot.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { OracleStageArrivalApplication } from "../oracle-stage-arrival-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { record } from "../contract-validation.mts";

export const nativeConfig = {
  attendanceStageArrivalMode: "test-oracle-controlled", dataSource: "oracle-read-only",
  oracleTestScopeConfirmed: true, deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC",
};
export const nativeSelection = { employeeId: "9001", shiftDayId: "6201" };
export const cleanNative = { lateReasonCode: null, lateRemark: null };
export class NativeOracleDouble {
  readonly directory = mkdtempSync(join(tmpdir(), "shf-native-double-"));
  readonly binding: NativeBinding;
  readonly proof: unknown[][];
  readonly events: string[] = [];
  readonly sql: Array<{ sql: string; binds: BindParameters; source: "read" | "write" }> = [];
  readonly rows: Record<string, NativeRow | null>;
  clockMs = Date.parse("2026-10-20T12:00:00.000Z");
  readonly clock = { now: () => new Date(this.clockMs) };
  committed = false;
  count: number | undefined = 1;
  hook?: (event: string) => Promise<void> | void;
  // Independent synthetic observations, never private expectations learned
  // from a real connection. SID tests explicitly configure both accounts.
  identityObservations?: { read: Record<string, string | null>; write: Record<string, string | null> };
  private async point(event: string) { this.events.push(event); await this.hook?.(event); }
  constructor(realClock = false) {
    if (realClock) this.clockMs = Date.now();
    const civil = (ms: number) => new Date(ms).toISOString().slice(0, 19);
    const identity = { database: "SYNTHETIC_TEST", host: "synthetic-host", service: "synthetic-service",
      user: "SHIFTER", schema: "SHIFTER" };
    this.binding = { marker: nativeMarker, ...nativeSelection, orgUnitId: "T001",
      readIdentity: identity, writeIdentity: { ...identity }, metadataDigest: "0".repeat(64),
      approval: "synthetic-approval", freezeOwner: "synthetic-freeze-owner", recoveryOwner: "synthetic-recovery-owner",
      writerFreezeConfirmed: true, noExternalEffectsConfirmed: true, singleExecutorConfirmed: true,
      windowStart: new Date(this.clockMs - 60000).toISOString(), windowEnd: new Date(this.clockMs + 1200000).toISOString(),
      allowanceFile: join(this.directory, "operator-allowance") };
    const numeric = new Set(["EMPLOYEE_ID", "SHF_EMPLOYEE_DAY_ID", "WM_DAY_TYPE", "WM_EXCEPTION_TYPE_ID",
      "NEW_DAY_TYPE", "NEW_EXCEPTION_TYPE_ID", "CANCEL_REASON_CODE", "TADREECH", "MISS_REASON_ID",
      "STAGE_LATE_REASON_ID", "STAGE_LATE_MINUTES"]);
    const dates = new Set(["WM_SHIFT_START_DATETIME", "WM_SHIFT_END_DATETIME", "NEW_SHIFT_START", "NEW_SHIFT_END",
      "SPLIT_START", "SPLIT_END", "NEW_SPLIT_START", "NEW_SPLIT_END", "STAGE_ARRIVAL_TIME", "STATION_ARRIVAL_TIME",
      "STATION_EXIT_TIME", "MISSING_TIME", "APPROVED_TIME"]);
    const columns = Object.entries(nativeTables).flatMap(([tableName, names]) => names.map(columnName => ({
      tableName, columnName, dataType: numeric.has(columnName) ? "NUMBER" : dates.has(columnName) ? "DATE" : "VARCHAR2",
      dataLength: 100, charUsed: null, nullable: "Y", virtualColumn: "NO",
    })));
    this.proof = [columns, [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK",
      kind: "P", status: "ENABLED", validated: "VALIDATED", referencedOwner: null, referencedConstraint: null }],
    [{ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_PK", columnName: "SHF_EMPLOYEE_DAY_ID", position: 1 }],
    [], [], [], [], [], []];
    this.binding.metadataDigest = fingerprint(this.proof);
    this.rows = Object.fromEntries(Object.entries(nativeTables).map(([table, names]) =>
      [table, Object.fromEntries(names.map(name => [name, null]))]));
    Object.assign(this.rows.SHF_EMPLOYEES!, { EMPLOYEE_ID: "9001", EMP_ID_NUMBER: "999999991",
      FIRST_NAME: nativeMarker, LAST_NAME: "Synthetic", ORG_UNIT_ID: "T001" });
    Object.assign(this.rows.SHF_EMPLOYEE_DAY!, { SHF_EMPLOYEE_DAY_ID: "6201", EMP_ID_NUMBER: "99999999", WM_DAY_TYPE: "4",
      WM_SHIFT_START_DATETIME: civil(this.clockMs + 1200000), WM_SHIFT_END_DATETIME: civil(this.clockMs + 28800000),
      SPLIT_SHIFT: "N", SOURCE: "SYNTHETIC_DAYS" });
    this.rows.SHF_DAY_CHANGES = null;
    Object.assign(this.rows.SHF_ATTENDANCE!, { SHF_EMPLOYEE_DAY_ID: "6201", TADREECH: "0" });
    this.rows.team = { ORG_UNIT_ID: "T001", UNIT_TYPE_ID: "J01", PARENT_UNIT: "M001" };
    this.rows.parent = { ORG_UNIT_ID: "M001", UNIT_TYPE_ID: "G01", PARENT_UNIT: null };
    this.rows.SHF_SYSTEM_PARAM = { PARAM_KEY: policyKey, DEFAULT_VALUE: "10" };
    this.rows.SHF_UNIT_PARAM = null;
  }
  dispose() { rmSync(this.directory, { force: true, recursive: true }); }
  private async query(sql: string, binds: BindParameters, source: "read" | "write") {
    this.sql.push({ sql, binds: structuredClone(binds), source });
    const tag = /\/\* (native:[^*]+) \*\//.exec(sql)?.[1] ?? (sql.startsWith("SET") ? "readonly" : "probe");
    await this.point(`${source}:${tag}`);
    if (tag === "readonly") return [];
    if (sql.includes("nls_session_parameters")) return [{ calendar: "GREGORIAN" }];
    if (tag === "probe") {
      if (sql.includes('"grantCode"')) return [{ grantCode: "T001", teamCode: "T001", teamLabel: "Synthetic team",
        teamType: "J01", code: "M001", label: "Synthetic parent", unitType: "G01" }];
      if (sql.toLowerCase().includes("shf_inner_jobs")) return [];
      return [{ probe: 1 }];
    }
    if (tag === "native:identity") return [structuredClone(this.identityObservations?.[source] ??
      (source === "read" ? this.binding.readIdentity : this.binding.writeIdentity))];
    if (tag.startsWith("native:metadata:")) return structuredClone(this.proof[Number(tag.split(":")[2])]);
    if (tag.startsWith("native:privilege:")) return [];
    if (tag.startsWith("native:lock:")) return [{ key: 1 }];
    if (["native:marker", "native:prefix"].includes(tag)) return [{ employeeId: "9001" }];
    if (tag === "native:reports") return [{ count: "0" }];
    if (tag.startsWith("native:row:")) {
      const table = tag.slice("native:row:".length);
      const key = table === "SHF_ORG_UNIT" && record(binds) ? binds.unit === "T001" ? "team" : "parent" : table;
      const row = this.rows[key];
      return row ? [structuredClone(row)] : [];
    }
    throw Error("Unexpected double query");
  }
  readonly readPool: OraclePool = {
    getConnection: async (): Promise<OracleConnection> => {
      await this.point("read:lease");
      return { callTimeout: 0, execute: (sql, binds) => this.query(sql, binds, "read"),
        break: async () => { await this.point("read:break"); },
        rollback: async () => { await this.point("read:rollback"); },
        close: async drop => { await this.point(`read:close:${Boolean(drop)}`); } };
    },
    close: async () => { await this.point("read:pool-close"); },
  };
  readonly writePool: NativePool = {
    getConnection: async (): Promise<NativeConnection> => {
      await this.point("write:lease");
      let staged: NativeRow | null = null, settled = true;
      return {
        callTimeout: 0,
        execute: async (sql, binds) => {
          if (!sql.includes("native:update")) return { rows: await this.query(sql, binds, "write") };
          this.sql.push({ sql, binds: structuredClone(binds), source: "write" });
          settled = false;
          try {
            await this.point("write:update");
            if (this.count === 1 && record(binds)) staged = { ...this.rows.SHF_ATTENDANCE!,
              STAGE_ARRIVAL_TIME: String(binds.newStageLocal), STAGE_ARRIVAL_USER: String(binds.actor), TADREECH: "0" };
            await this.point("write:updated");
            return { rowsAffected: this.count };
          } finally { settled = true; }
        },
        commit: async () => {
          settled = false;
          try {
            await this.point("write:commit");
            if (staged) this.rows.SHF_ATTENDANCE = staged;
            staged = null; this.committed = true;
            await this.point("write:commit-ack");
          } finally { settled = true; }
        },
        rollback: async () => { await this.point("write:rollback"); staged = null; },
        break: async () => { await this.point("write:break"); },
        close: async drop => {
          if (!settled) throw Error("Busy lease released");
          await this.point(`write:close:${Boolean(drop)}`);
        },
      };
    }, close: async () => { await this.point("write:pool-close"); },
  };
  async application() {
    const uow = new OracleStageArrivalUow(this.writePool, new OracleReadSession(this.readPool), this.binding);
    await uow.initialize();
    const app = new OracleStageArrivalApplication(uow, this.binding, this.clock, "UTC", ["T001"]);
    const principal = await new SyntheticAdministratorProvider(nativeConfig).authenticate({ authorization: null });
    return { app, principal, uow };
  }
}
