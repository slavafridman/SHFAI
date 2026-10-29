// U49 Phase B: actual Node/native composition over explicit isolated Oracle/OS
// protocol doubles. No .test.mts import, real driver factory, DNS or inherited ENV.
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { registerHooks } from "node:module";
import { startFromEnvironment, stopBackendServer } from "../../../backend/fixture-slice/server.mts";
import { nativeRuntimeFixture } from "../../../backend/fixture-slice/test/native-shift-management-runtime-double.mts";
import type { BackendPoolFactories } from "../../../backend/fixture-slice/server.mts";
import type { ShiftOperationKindV1, ShiftReceiptV1, ShiftManagementContextV1,
  ShiftPreparationV1, CsvShiftPreviewV1 } from "../../../backend/fixture-slice/shift-management-contracts.mts";
import type { IdentityResponseV1 } from "../../../backend/fixture-slice/contracts.mts";
import { record } from "../../../backend/fixture-slice/contract-validation.mts";

// Same narrow resolution bridge as the existing U49 browser checker. Load only
// the actual pure frontend guards, then remove the hook; no Angular services.
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.includes("/frontend/fixture-slice/src/") && /^\.\.?\/[^.]+$/.test(specifier))
    return next(specifier + ".ts", context);
  return next(specifier, context);
} });
const guards = await import("../src/shift-management-contract.ts");
hooks.deregister();

export async function startManagementProtocolWorld(kind: ShiftOperationKindV1, origin: string,
  fault: "none" | "insert2" | "readbackMismatch" = "none") {
  const f = await nativeRuntimeFixture(kind);
  const original = structuredClone(f.data);
  // nativeRuntimeFixture constructs this literal exclusively from synthetic test
  // values. Do not copy process.env, read operator packets or use shared paths.
  const keys = ["SHF_APP_ENV", "SHF_ORACLE_CONFIG", "SHF_ORACLE_PORT", "SHF_ORACLE_CONNECT_STRING",
    "SHF_ORACLE_USER", "SHF_ORACLE_PASSWORD", "SHF_ORACLE_CLIENT_LIB_DIR", "SHF_NATIVE_SHIFT_CONNECT_STRING",
    "SHF_NATIVE_SHIFT_USER", "SHF_NATIVE_SHIFT_PASSWORD", "SHF_NATIVE_SHIFT_CLIENT_LIB_DIR",
    "SHF_TEST_ORACLE_SHIFT_WRITE_ENABLED", "SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED",
    "SHF_SHIFT_MANAGEMENT_ORIGINS", "SHF_NATIVE_SHIFT_BINDING"] as const;
  assert.deepEqual(Object.keys(f.env).sort(), [...keys].sort(), "only whitelisted synthetic test environment");
  const env: NodeJS.ProcessEnv = Object.fromEntries(keys.map(k => [k, f.env[k]]));
  env.SHF_SHIFT_MANAGEMENT_ORIGINS = JSON.stringify([origin]);
  let endpointCalls = 0;
  const factories: Required<BackendPoolFactories> = {
    read: () => f.factories.read(),
    native: () => f.factories.native(),
    resolveEndpoint: async () => { endpointCalls++; return f.factories.resolveEndpoint(); },
  };
  let server: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
  let releaseGate: (() => void) | undefined;
  let lastReceipt: ShiftReceiptV1 | undefined;
  let identity: IdentityResponseV1 | undefined;
  let context: ShiftManagementContextV1 | undefined;
  let lastPreparation: ShiftPreparationV1 | CsvShiftPreviewV1 | undefined;
  let commandReadLeases = 0;
  const responses: Array<{ path: string; status: number; body: unknown }> = [];
  try {
    // Fixture clock is deliberately NOT injected: native uses the real systemClock.
    server = await startFromEnvironment(env, undefined, factories);
    const address = server.address(); assert(address && typeof address !== "string");
    assert.equal(f.stats.readPools, 1); assert.equal(f.stats.nativePools, 1); assert(endpointCalls > 0);
    if (fault !== "none") f.faults[fault] = true;
    return {
      kind, fault, csv: f.csv, draft: f.draft, origin: `http://127.0.0.1:${address.port}`,
      stats: f.stats,
      observe(path: string, status: number, body: unknown, request?: unknown, contentType?: string) {
        responses.push({ path, status, body });
        if (status !== 200) return;
        if (path.endsWith("/identity")) {
          assert(guards.managementIdentity(body), "canonical observed identity");
          identity = body;
        } else if (path.endsWith("/context")) {
          assert(identity, "observed identity before context");
          assert(guards.managementContext(body, "1", kind === "change" || kind === "cancel" ? "7" : null, identity),
            "canonical observed management context");
          context = body;
        } else if (path.endsWith("/preparations")) {
          assert(context && record(request) && guards.draft(request.draft), "observed context and request draft");
          assert(guards.preparation(body, context, request.draft), "canonical observed preparation");
          lastPreparation = body;
        } else if (path.endsWith("/csv-previews")) {
          assert(context, "observed context before CSV preview");
          assert(contentType === "text/csv; charset=utf-8" || contentType === "text/csv; charset=windows-1255");
          const encoding = contentType === "text/csv; charset=utf-8" ? "utf-8" : "windows-1255";
          assert(guards.csvPreview(body, context, encoding), "canonical observed CSV preview");
          lastPreparation = body;
        } else if (path.endsWith("/commands") || path.endsWith("/csv-commands")) {
          assert(context && lastPreparation && guards.command(request, kind === "csv-create"),
            "observed command and validated preparation required");
          const effects = "rows" in lastPreparation ? lastPreparation.rows.map(row => {
            assert(row.effect); return row.effect;
          }) : lastPreparation.effects;
          assert(guards.receipt(body, { employeeId: context.employeeId, kind, commandId: request.commandId,
            dataSource: context.dataSource, businessTimeZone: context.businessTimeZone, effects,
            observedAt: context.serverTime.instant }), "canonical observed receipt bound to request/preparation");
          lastReceipt = body;
        }
      },
      lastResponse() { return responses.at(-1); },
      receipt() { assert(lastReceipt, "actual HTTP receipt required"); return lastReceipt; },
      preparation() {
        return lastPreparation;
      },
      assertPure() {
        assert.equal(f.stats.commits, 0); assert.equal(f.stats.sequence, 0); assert.equal(f.stats.locks, 0);
        assert.equal(f.stats.active, 0); assert(isDeepStrictEqual(f.data, original), "pure operations preserve physical rows");
      },
      holdSql() {
        assert(!releaseGate, "one owned gate");
        commandReadLeases = f.stats.readLeases;
        const gate = new Promise<void>(resolve => { releaseGate = resolve; });
        f.pauseSql(() => gate);
      },
      releaseSql() { f.pauseSql(undefined); releaseGate?.(); releaseGate = undefined; },
      async verifySuccess() {
        assert(lastReceipt, "actual HTTP receipt required, not inferred from rows");
        const receipt = lastReceipt;
        assert.equal(receipt.kind, kind); assert.equal(receipt.employeeId, "1");
        assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.dataSource, "oracle-test");
        assert.equal(receipt.partnerCompletion, "not-invoked"); assert.equal(receipt.replayed, false);
        assert.equal(f.stats.commits, 1); assert.equal(f.stats.active, 0);
        assert.equal(f.stats.sequence, kind === "csv-create" ? 2 : kind === "create" ? 1 : 0);
        assert.equal(receipt.effects.length, kind === "csv-create" ? 2 : 1);
        const commit = f.events.lastIndexOf("commit"), writerClosed = f.events.indexOf("writer-close", commit);
        const readback = f.events.indexOf("read-acquire", commit);
        assert(commit >= 0 && writerClosed > commit && readback > writerClosed);
        assert(f.events.indexOf("read-close", readback) > readback);
        assert(f.stats.readLeases > commandReadLeases, "separate guarded readback lease");
        assert.equal(f.data.SHF_ATTENDANCE.length, original.SHF_ATTENDANCE.length, "attendance preserved");
        if (kind === "create" || kind === "csv-create") {
          assert.equal(f.data.SHF_EMPLOYEE_DAY.length, receipt.effects.length);
          assert.equal(f.data.SHF_DAY_CHANGES.length, 0);
          for (const effect of receipt.effects) {
            const row = f.data.SHF_EMPLOYEE_DAY.find(r => r.SHF_EMPLOYEE_DAY_ID === effect.after.shiftDayId);
            assert(row); assert.equal(row.SOURCE, "fExtra"); assert.equal(row.WM_DAY_TYPE, "4");
            assert.equal(row.WM_START_DATETIME, effect.after.startLocal);
            assert.equal(row.WM_END_DATETIME, effect.after.endLocal);
            assert.equal(row.WM_PAID_MINUTES, effect.after.paidMinutes);
            assert.equal(row.WM_WORK_MINUTES, effect.after.workMinutes);
          }
        } else {
          assert(isDeepStrictEqual(f.data.SHF_EMPLOYEE_DAY, original.SHF_EMPLOYEE_DAY.map(row => ({ ...row, SOURCE: "SHF" }))),
            "base physical rows preserved except approved source transition");
          assert.equal(f.data.SHF_DAY_CHANGES.length, 1);
          const overlay = f.data.SHF_DAY_CHANGES[0];
          assert.equal(overlay.SHF_EMPLOYEE_DAY_ID, "7");
          if (kind === "change") {
            assert.equal(overlay.NEW_ACTIVITY, "2"); assert.equal(overlay.NEW_PAID_MINUTES, "60");
            assert.equal(overlay.NEW_WORK_MINUTES, "60");
          } else {
            assert.equal(overlay.NEW_DAY_TYPE, "1"); assert.equal(overlay.NEW_EMPLOYEE_ID, "99999999");
            assert.equal(receipt.effects[0].after.status, "cancelled");
            assert.equal(receipt.effects[0].after.paidMinutes, receipt.effects[0].before?.paidMinutes);
          }
        }
        await assertConsumed();
        return summary();
      },
      async verifyFailure() {
        assert.equal(lastReceipt, undefined); assert.equal(f.stats.active, 0);
        const problem = responses.findLast(r => /\/(?:commands|csv-commands)$/.test(r.path));
        assert(problem && record(problem.body));
        if (fault === "insert2") {
          assert.equal(problem.status, 503); assert.equal(problem.body.effect, "rolled-back");
          assert.equal(f.stats.commits, 0); assert.equal(f.stats.sequence, 2); assert(f.stats.rollbacks > 0);
          assert(isDeepStrictEqual(f.data, original), "all ordinary rows rolled back, not an HTTP-fabricated failure");
        } else {
          assert.equal(problem.status, 503); assert.equal(problem.body.code, "COMMAND_OUTCOME_UNKNOWN");
          assert.equal(problem.body.effect, "unknown"); assert.equal(f.stats.commits, 1);
          assert.equal(f.data.SHF_EMPLOYEE_DAY.length, 1, "commit is not undone by readback uncertainty");
        }
        await assertConsumed();
        return summary();
      },
      async proveRestartFence() {
        await stop();
        // Same world and same consumed TEMP namespace. Never reset/reprovision it.
        let unexpected: Awaited<ReturnType<typeof startFromEnvironment>> | undefined;
        let denied = false;
        try { unexpected = await startFromEnvironment(env, undefined, factories); }
        catch (e) { denied = record(e) && e.code === "COMMAND_SCOPE_DEFERRED"; }
        finally { if (unexpected) await stopBackendServer(unexpected); }
        assert(denied, "same consumed world must deny restart, even with no browser state");
        await assertConsumed();
      },
      async close() {
        f.pauseSql(undefined); releaseGate?.(); releaseGate = undefined;
        try {
          await stop(); assert.equal(f.stats.active, 0);
          assert.equal(f.stats.closes, f.stats.writeLeases, "all native/probe leases closed");
          assert.equal(f.events.filter(e => e === "read-acquire").length, f.events.filter(e => e === "read-close").length);
          assert.equal(f.stats.poolCloses, f.stats.readPools + f.stats.nativePools);
        } finally { f.close(); }
        await assert.rejects(access(f.directory), { code: "ENOENT" });
      },
    };
  } catch (e) {
    try { await stop(); } finally { f.close(); }
    throw e;
  }
  async function stop() { if (server) { const owned = server; server = undefined; await stopBackendServer(owned); } }
  async function assertConsumed() {
    const namespace: unknown = JSON.parse(await readFile(join(f.directory, "namespace.json"), "utf8"));
    assert(record(namespace)); assert.equal(namespace.state, "consumed");
  }
  function summary() {
    return { kind, fault, commits: f.stats.commits, rollbacks: f.stats.rollbacks, sequence: f.stats.sequence,
      locks: f.stats.locks, active: f.stats.active, readLeases: f.stats.readLeases,
      writeLeases: f.stats.writeLeases, committedDays: f.data.SHF_EMPLOYEE_DAY.length,
      committedOverlays: f.data.SHF_DAY_CHANGES.length, separateReadback: f.events.indexOf("read-acquire", f.events.indexOf("commit")) >= 0 };
  }
}
