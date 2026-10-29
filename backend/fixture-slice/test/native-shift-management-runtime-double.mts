// Explicit isolated Oracle/catalog/OS protocol pools. No live client/DNS or
// operational certificate/capacity is supplied by these synthetic test packets.
import { mkdtempSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NativeConnection, NativePool } from "../oracle-stage-arrival-uow.mts";
import type { OraclePool } from "../oracle-session.mts";
import type { ShiftDraftV1, ShiftEffectV1, ShiftOperationKindV1 } from "../shift-management-contracts.mts";
import type { ShiftOracleRow } from "../oracle-shift-management-sql.mts";
import { shiftOracleStaticDefault } from "../oracle-shift-management-sql.mts";
import { sourceFixture } from "./oracle-shift-management-source-double.mts";
import { observeShiftManagementMetadata } from "../oracle-shift-management-metadata.mts";
import type { ShiftManagementMetadataOptions } from "../oracle-shift-management-metadata.mts";
import { readNativeShiftSource } from "../oracle-shift-management-source.mts";
import { parseNativeManagementEnvironment } from "../native-shift-management-config.mts";
import { nativeShiftEmployeeScope } from "../native-shift-management-admission.mts";
import { planShifts, effectiveShift } from "../shift-management-rules.mts";
import { managementPrincipal } from "./shift-management-helpers.mts";
import { fingerprint } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import type { NativeIdentity } from "../native-stage-arrival-config.mts";
import { metadataWaiverId } from "../native-metadata-limited.mts";

export async function nativeRuntimeFixture(kind: ShiftOperationKindV1) {
  const f = await sourceFixture(), directory = realpathSync.native(mkdtempSync(join(tmpdir(), "shf49-runtime-test-")));
  const date = new Date(); date.setUTCDate(date.getUTCDate() + 7); date.setUTCHours(0, 0, 0, 0);
  const day = date.toISOString().slice(0, 10), next = new Date(date); next.setUTCDate(next.getUTCDate() + 1);
  const secondDay = next.toISOString().slice(0, 10);
  const lower = new Date(date); lower.setUTCDate(lower.getUTCDate() - 7);
  const upper = new Date(date); upper.setUTCDate(upper.getUTCDate() + 14);
  const draft: ShiftDraftV1 = kind === "change" ? { kind, shiftDayId: "7", startLocal: day + "T09:00:00",
    endLocal: day + "T10:00:00", activityCode: "2", workLocation: "site", startReasonCode: null, endReasonCode: null } :
    kind === "cancel" ? { kind, shiftDayId: "7", reasonCode: "2", remark: null } :
      { kind: "create", startLocal: day + "T09:00:00", endLocal: day + "T10:00:00",
        activityCode: "1", workLocation: "site", remark: null };
  if (kind === "change" || kind === "cancel") {
    const raw = Object.fromEntries(f.schemas.SHF_EMPLOYEE_DAY.map(c => [c.name, null]));
    Object.assign(raw, { SHF_EMPLOYEE_DAY_ID: "7", EMP_ID_NUMBER: "00123456", SOURCE: "WFM", WM_DAY_TYPE: "4",
      WM_DATE: day + "T00:00:00", WM_START_DATETIME: day + "T09:00:00", WM_END_DATETIME: day + "T10:00:00",
      WM_SHIFT_START_DATETIME: day + "T09:00:00", WM_SHIFT_END_DATETIME: day + "T10:00:00", WM_SCH_ACTIVITY_ID_DATA: "1",
      WM_SITE_ID: "1", WM_PAID_MINUTES: "60", WM_WORK_MINUTES: "60", WORK_FROM_HOME: "N", SPLIT_SHIFT: "N" });
    f.data.SHF_EMPLOYEE_DAY = [raw];
  }
  f.data.SHF_ACTIVITY_TYPE.push({ ACTIVITY_TYPE_ID: "2", ACTIVITY_TYPE_NAME: "סינתטי", SITE_ID: "1" });
  const identity: NativeIdentity = { database: "ISOLATED", user: "SHIFTER", schema: "SHIFTER", target: {
    kind: "sid", instanceSid: "ISOLATED", endpointProof: { kind: "configured-address-sets", revision: "isolated-proof",
      connectionAliases: ["CTIDBT_WFMT"], endpoint: { kind: "address", name: "127.0.0.1", addresses: ["127.0.0.1"] },
      serverHosts: [{ kind: "dns", name: "isolated.invalid", addresses: ["127.0.0.1"] }] } } };
  const stats = { readPools: 0, nativePools: 0, commits: 0, rollbacks: 0, closes: 0, active: 0,
    sequence: 0, locks: 0, readLeases: 0, writeLeases: 0, poolCloses: 0, breaks: 0 };
  const faults = { readbackIdentity: false, readbackMismatch: false, commitAck: false, insert2: false,
    rowsAffected: 1 as number | undefined, metadata: false };
  const events: string[] = [], sqlCalls: string[] = [];
  let sqlGate: (() => Promise<void>) | undefined;
  let nextId = 100n;
  const q = async (view: Record<string, ShiftOracleRow[]>, sql: string, binds: import("oracledb").BindParameters, bound: number,
    readLease = false): Promise<unknown[]> => {
    sqlCalls.push(sql);
    if (record(binds) && Object.keys(binds).some(name => !new RegExp(`:${name}\\b`).test(sql)))
      throw Error("Isolated Oracle rejects an unused named bind");
    if (sql === "SET TRANSACTION READ ONLY") return [];
    if (sql.includes("native:identity")) return [{ database: faults.readbackIdentity && readLease && stats.commits ? "WRONG" : "ISOLATED",
      instance: "ISOLATED", host: "isolated.invalid", service: "ISOLATED", user: "SHIFTER", schema: "SHIFTER" }];
    if (sql.includes('"grantCode"')) return [{ grantCode: "J01", teamCode: "J01", teamLabel: "סינתטי", teamType: "J01",
      code: "M01", label: "סינתטי", unitType: "G01" }];
    if (/FROM SHIFTER\.shf_inner_jobs/i.test(sql)) return []; // Explicit empty isolated inquiry table.
    if (faults.metadata && sql.includes("metadata:properties")) throw Error("Isolated metadata fault");
    const result = await f.queryOn(view, sql, binds, bound);
    if (faults.readbackMismatch && readLease && stats.commits && sql.includes("shf49:days")) {
      return result.map(row => record(row) ? { ...row, REMARK: "isolated-readback-drift" } : row);
    }
    return result;
  };
  const metadataOptions: ShiftManagementMetadataOptions = { provider: "owner-test-limited-v1", identity, tables: f.metadata.proof.tableScope, kind,
    coverageWaiver: { id: metadataWaiverId, accepted: true as const, externalEffectsAssessment: "unknown-user-waived" as const } };
  const metadata = await observeShiftManagementMetadata((sql, binds, bound) => q(f.data, sql, binds, bound), metadataOptions);
  const config = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
    syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["J01"], dataSource: "oracle-read-only",
    oracleTestScopeConfirmed: true, businessTimeZone: "UTC", shiftManagement: { mode: "test-oracle-controlled" } };
  const binding = { version: "shf-management-native-v1", scopeRevision: "isolated-native-operation", employeeId: "1", orgUnitId: "J01",
    selectedDayId: kind === "change" || kind === "cancel" ? "7" : null, readIdentity: identity, writeIdentity: identity,
    metadata: { provider: "owner-test-limited-v1", certificate: metadata.certificate, coverageWaiver: metadataOptions.coverageWaiver },
    operation: { kind, rows: kind === "csv-create" ? 2 : 1, planDigest: "0".repeat(64),
      planningStartLocal: lower.toISOString().slice(0, 19), planningEndLocal: upper.toISOString().slice(0, 19),
      overlayWrite: kind === "change" || kind === "cancel" ? "insert" : null },
    window: { start: new Date(Date.now() - 60000).toISOString(), end: new Date(Date.now() + 300000).toISOString() },
    authorityDirectory: directory, writerExclusion: { confirmed: true, owner: "ISOLATED-ONLY" }, singleExecutorConfirmed: true,
    approvalId: "ISOLATED-ONLY", recoveryOwner: "ISOLATED-ONLY",
    review: { state: "not-required", effectFingerprint: "0".repeat(64), certificate: "b".repeat(64) },
    capacity: { rows: kind === "csv-create" ? 2 : 1, requestBudgetMs: 5000, worstCaseMs: 1000,
      source: "authorized-test-measurement", certificate: "c".repeat(64) } };
  const env: NodeJS.ProcessEnv = { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(config), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SHIFTER", SHF_ORACLE_PASSWORD: "isolated-not-live",
    SHF_ORACLE_CLIENT_LIB_DIR: "isolated-not-a-client", SHF_NATIVE_SHIFT_CONNECT_STRING: "CTIDBT_WFMT",
    SHF_NATIVE_SHIFT_USER: "SHIFTER", SHF_NATIVE_SHIFT_PASSWORD: "isolated-not-live", SHF_NATIVE_SHIFT_CLIENT_LIB_DIR: "isolated-not-a-client",
    SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED: "true", SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: "true",
    SHF_SHIFT_MANAGEMENT_ORIGINS: '["http://localhost:16040"]', SHF_NATIVE_SHIFT_BINDING: JSON.stringify(binding) };
  let native = parseNativeManagementEnvironment(env, config);
  let snapshot = (await readNativeShiftSource((sql, binds, bound) => q(f.data, sql, binds, bound),
    metadata, native.source, { employeeId: "1", shiftDayId: binding.selectedDayId })).snapshot;
  const before = snapshot.days[0] ? effectiveShift(snapshot, snapshot.days[0]) : null;
  const createEffect = (start: string, end: string, row: number): ShiftEffectV1 => ({ row, before: null, warningCodes: [],
    after: { shiftDayId: null, status: "scheduled", startLocal: start, endLocal: end, activityCode: "1",
      siteId: "1", workLocation: "site", paidMinutes: "60", workMinutes: "60", source: "fExtra" } });
  const effects: ShiftEffectV1[] = kind === "csv-create" ? [createEffect(day + "T09:00:00", day + "T10:00:00", 2),
    createEffect(secondDay + "T09:00:00", secondDay + "T10:00:00", 3)] :
    kind === "create" ? [createEffect(day + "T09:00:00", day + "T10:00:00", 1)] : (() => {
      if (!before) throw Error("Isolated expected original");
      return [{ row: 1, before, after: { ...before, source: "SHF", ...(kind === "cancel" ?
        { status: "cancelled" as const } : { activityCode: "2" }) },
      warningCodes: kind === "cancel" ? ["SOURCE_BECOMES_SHF" as const, "LOGICAL_CANCEL_PRESERVES_HISTORY" as const] :
        ["SOURCE_BECOMES_SHF" as const] }];
    })();
  binding.review.effectFingerprint = fingerprint({ employeeId: "1", kind, effects });
  env.SHF_NATIVE_SHIFT_BINDING = JSON.stringify(binding); native = parseNativeManagementEnvironment(env, config);
  snapshot = (await readNativeShiftSource((sql, binds, bound) => q(f.data, sql, binds, bound),
    metadata, native.source, { employeeId: "1", shiftDayId: binding.selectedDayId })).snapshot;
  const entries = kind === "csv-create" ? [
    { row: 2, overnight: false, draft: { kind: "create" as const, startLocal: day + "T09:00:00", endLocal: day + "T10:00:00",
      activityCode: "1", workLocation: "site" as const, remark: null } },
    { row: 3, overnight: false, draft: { kind: "create" as const, startLocal: secondDay + "T09:00:00", endLocal: secondDay + "T10:00:00",
      activityCode: "1", workLocation: "site" as const, remark: null } },
  ] : [{ row: 1, draft, overnight: false }];
  const plan = planShifts(snapshot, entries, managementPrincipal(), new Date(), "UTC");
  binding.operation.planDigest = fingerprint({ snapshot, plan, zone: "UTC" });
  env.SHF_NATIVE_SHIFT_BINDING = JSON.stringify(binding); native = parseNativeManagementEnvironment(env, config);
  writeFileSync(join(directory, "namespace.json"), JSON.stringify({ version: "shf-management-native-authority-v1",
    namespace: "shift-management-v0.1", canonicalDirectory: directory, employeeScope: nativeShiftEmployeeScope("1"),
    identityRevision: native.source.reference.identityRevision, state: "ready" }), { flag: "wx" });
  const readPool: OraclePool = { async getConnection() {
    const view = structuredClone(f.data); stats.readLeases++; events.push("read-acquire");
    return { callTimeout: 0, execute: (sql, binds, bound) => q(view, sql, binds, bound, true),
      async break() {}, async rollback() {}, async close() { events.push("read-close"); } };
  }, async close() { stats.poolCloses++; } };
  const nativePool: NativePool = { async getConnection() {
    let view = structuredClone(f.data), inserts = 0; stats.writeLeases++; events.push("writer-acquire");
    const connection: NativeConnection = { callTimeout: 0,
      async execute(sql, input, bound) {
        if (!record(input)) throw Error("Isolated named binds required");
        if (Object.keys(input).some(name => !new RegExp(`:${name}\\b`).test(sql)))
          throw Error("Isolated Oracle rejects an unused DML bind");
        if (sql.includes("shf49:lock:")) { stats.locks++; return { rows: [{ key: input.employeeId ?? input.dayId }] }; }
        if (sql.includes("shf49:sequence")) { stats.sequence++; return { rows: [{ dayId: String(nextId++) }] }; }
        if (/^(?:SELECT|WITH|SET)\b/.test(sql)) return { rows: await q(view, sql, input, bound) };
        stats.active++; events.push("sql-start");
        try {
          await sqlGate?.();
          const get = (key: string) => {
            const v = input[key]; if (!(v === null || typeof v === "string")) throw Error("Isolated bind type"); return v;
          };
          const insert = /^INSERT INTO SHIFTER\.(SHF_EMPLOYEE_DAY|SHF_DAY_CHANGES) \(([^)]+)\)/.exec(sql);
          if (insert) {
            if (++inserts === 2 && faults.insert2) throw Error("Isolated second-row SQL fault");
            const row: ShiftOracleRow = {}, names = insert[2].split(",");
            names.forEach((name, i) => { row[name] = get(`v${i}`); });
            for (const c of f.schemas[insert[1]]) if (!Object.hasOwn(row, c.name)) row[c.name] = shiftOracleStaticDefault(c);
            view[insert[1]].push(row); return { rowsAffected: faults.rowsAffected };
          }
          const update = /^UPDATE SHIFTER\.(SHF_EMPLOYEE_DAY|SHF_DAY_CHANGES) SET/.exec(sql);
          if (update) {
            const row = view[update[1]].find(row => row.SHF_EMPLOYEE_DAY_ID === (input.dayId ?? input.targetDay));
            if (!row) return { rowsAffected: 0 };
            if (update[1] === "SHF_EMPLOYEE_DAY") row.SOURCE = get("newSource");
            else for (const match of sql.split("WHERE")[0].matchAll(/([A-Z_]+)=(?:TO_(?:DATE|NUMBER)\()?:([a-z][0-9]+)/g))
              row[match[1]] = get(match[2]);
            return { rowsAffected: faults.rowsAffected };
          }
          throw Error("Unexpected isolated DML");
        } finally { stats.active--; events.push("sql-settled"); }
      },
      async commit() { events.push("commit"); stats.commits++;
        for (const table of Object.keys(f.data)) f.data[table] = structuredClone(view[table]);
        if (faults.commitAck) throw Error("Isolated ACK loss"); },
      async rollback() { stats.rollbacks++; view = structuredClone(f.data); },
      async break() { stats.breaks++; events.push("break"); },
      async close() {
        if (stats.active) throw Error("Isolated unsafe lease close");
        stats.closes++; events.push("writer-close");
      },
    }; return connection;
  }, async close() { if (stats.active) throw Error("Isolated unsafe pool close"); stats.poolCloses++; } };
  const factories = { read: async () => { stats.readPools++; return readPool; },
    native: async () => { stats.nativePools++; return nativePool; },
    resolveEndpoint: async () => ["127.0.0.1"] };
  const csv = "personalId,activityCode,date,location,startTime,endTime\n" +
    `001234567,1,${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)},m,09:00,10:00\n` +
    `X001234567,1,${secondDay.slice(8, 10)}/${secondDay.slice(5, 7)}/${secondDay.slice(0, 4)},m,09:00,10:00`;
  return { ...f, env, config, binding, native, factories, draft, csv, stats, faults, events, sqlCalls,
    directory, pauseSql(value: typeof sqlGate) { sqlGate = value; },
    close: () => rmSync(directory, { recursive: true, force: true }) };
}
