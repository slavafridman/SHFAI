import test from "node:test";
import assert from "node:assert/strict";
import { readShiftOracleWindow } from "../oracle-shift-management-snapshot.mts";
import { shiftOracleInsertDay, shiftOracleStaticDefault, validateShiftOracleSchema } from "../oracle-shift-management-sql.mts";
import { oracleManagementSchema, oracleBaseline, oracleEmployee, oracleScope, nativeProtocolFixture } from "./oracle-shift-management-double.mts";
import type { NativeQuery } from "../oracle-stage-arrival-snapshot.mts";
import { ShiftManagementError, ShiftUowRejection } from "../shift-management-errors.mts";
import { OracleShiftManagementUow } from "../oracle-shift-management-uow.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { setImmediate as turn } from "node:timers/promises";
import { managementPrincipal } from "./shift-management-helpers.mts";
import type { ShiftBaseline } from "../shift-management-model.mts";

test("native physical context uses scoped plain SELECTs and retains full originals without sequence/locks", async () => {
  const calls: string[] = [];
  const query: NativeQuery = async sql => {
    calls.push(sql);
    if (sql.includes("shf49:employee")) return [oracleEmployee()];
    if (sql.includes("shf49:prefix")) return [{ EMPLOYEE_ID: "1" }];
    if (sql.includes("shf49:days")) return [oracleBaseline()];
    if (sql.includes("shf49:overlays") || sql.includes("shf49:attendance")) return [];
    throw Error("Unexpected isolated query");
  };
  const result = await readShiftOracleWindow(query, oracleManagementSchema(),
    { employeeId: "1", shiftDayId: "7" }, oracleScope());
  assert.deepEqual(result.days, [oracleBaseline()]);
  assert.equal(result.employee.EMP_ID_NUMBER, "001234567");
  assert.equal(calls.length, 5);
  for (const sql of calls) {
    assert.match(sql, /^SELECT|^WITH/);
    assert.doesNotMatch(sql, /NEXTVAL|FOR UPDATE|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
    assert.ok(!sql.includes("001234567"));
  }
});
test("native create SQL binds the approved16 columns only and preserves reviewed omitted defaults", () => {
  const plan = shiftOracleInsertDay(oracleManagementSchema(), {
    day: { shiftDayId: "8", employeeNumber: "00123456", dateLocal: "2027-01-04T00:00:00",
      dayType: "4", startLocal: "2027-01-04T09:00:00", endLocal: "2027-01-04T10:00:00",
      dayStartLocal: "2027-01-04T09:00:00", dayEndLocal: "2027-01-04T10:00:00",
      activityCode: "1", siteId: "1", paidMinutes: "60", workMinutes: "60", workFromHome: "N",
      splitShift: "N", switchDayId: null, exceptionType: null, timeoffType: null,
      source: "fExtra", remark: "סינתטי", preserved: {} },
  });
  assert.match(plan.sql, /^INSERT INTO SHIFTER\.SHF_EMPLOYEE_DAY/);
  assert.ok(!plan.sql.includes("סינתטי") && !plan.sql.includes("00123456"));
  assert.equal(Object.keys(plan.binds).length, 16);
  assert.equal(plan.after.WM_SCHEDULE_DAY_ID, null);
  assert.equal(plan.after.EMP_ID_NUMBER, "00123456");
});
for (const kind of ["create", "change", "cancel", "csv-create"] as const) {
  test(`native ${kind} kernel executes actual bound SQL then one COMMIT ACK, not a receipt`, async () => {
    const f = nativeProtocolFixture(kind), ack = await f.run();
    assert.equal(ack.effects.length, kind === "csv-create" ? 2 : 1);
    assert.equal(f.inspect().commits, 1); assert.equal(f.inspect().rollbacks, 0); assert.equal(f.inspect().closed, 1);
    assert.ok(!("outcome" in ack) && !("readBackVerifiedAt" in ack));
    assert.equal(f.inspect().sequenceCalls, kind === "csv-create" ? 2 : kind === "create" ? 1 : 0);
    assert.ok(f.events.indexOf("proof") < f.events.indexOf("employee-lock"));
    assert.ok(f.events.indexOf("commit") > f.events.lastIndexOf("sql-settled"));
    if (kind === "change" || kind === "cancel") {
      assert.equal(f.inspect().core.days[0].SOURCE, "SHF");
      assert.equal(f.inspect().core.overlays.length, 1);
      const overlayInsert = f.statements.find(call => call.sql.startsWith("INSERT INTO SHIFTER.SHF_DAY_CHANGES"));
      assert.equal(overlayInsert?.binds.w_source, "SHF"); // Own mutation frame, never stale WFM.
      assert.ok(f.events.indexOf("mark-source") < f.events.indexOf("insert-overlay"));
      if (kind === "cancel") {
        assert.equal(f.inspect().core.overlays[0].NEW_EMPLOYEE_ID, "99999999");
        assert.equal(f.inspect().core.overlays[0].NEW_DAY_TYPE, "1");
        assert.equal(f.inspect().core.days[0].WM_PAID_MINUTES, "60");
      }
    }
    for (const statement of f.statements) assert.ok(!statement.sql.includes("001234567"));
  });
}
test("native CSV second INSERT failure rolls back both ordinary rows, not sequence allocation", async () => {
  const f = nativeProtocolFixture(); f.faults.insert2 = true;
  await assert.rejects(f.run(), (error: unknown) =>
    error instanceof ShiftUowRejection && error.problemCase.effect === "rolled-back");
  assert.equal(f.inspect().core.days.length, 0); assert.equal(f.inspect().sequenceCalls, 2);
  assert.equal(f.inspect().commits, 0); assert.equal(f.inspect().rollbacks, 1); assert.equal(f.inspect().closed, 1);
});
for (const count of [0, 2, undefined]) {
  test(`native actual rowsAffected=${String(count)} cannot be staged into fake success1`, async () => {
    const f = nativeProtocolFixture(); f.faults.count = count;
    await assert.rejects(f.run(), (error: unknown) => error instanceof ShiftManagementError &&
      error.code === (count === 0 ? "STALE_PREPARATION" : "INVALID_SOURCE_DATA") &&
      error.problemCase.effect === "rolled-back");
    assert.equal(f.inspect().core.days.length, 0); assert.equal(f.inspect().commits, 0);
    assert.equal(f.inspect().rollbacks, 1);
  });
}
for (const fault of ["commitAck", "rollback", "close"] as const) {
  test(`native ${fault} failure is UNKNOWN; no retry/compensation/receipt`, async () => {
    const f = nativeProtocolFixture(); f.faults[fault] = true;
    if (fault === "rollback") f.faults.insert2 = true;
    await assert.rejects(f.run(), { code: "COMMAND_OUTCOME_UNKNOWN" });
    assert.equal(f.inspect().commits, fault === "rollback" ? 0 : 1);
    assert.ok(f.events.includes("drop"));
    assert.equal(f.events.filter(event => event === "acquire").length, 1);
  });
}
test("wrong identity/metadata reference denies before NEXTVAL or DML", async () => {
  const f = nativeProtocolFixture(); f.faults.proof = true;
  await assert.rejects(f.run(), { code: "LIVE_WRITES_DISABLED" });
  assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
  assert.equal(f.inspect().rollbacks, 1);
});
test("wrong consumed handle and expired/exclusion scope fail before pool IO", async () => {
  const f = nativeProtocolFixture();
  await assert.rejects(f.uow.run({ ...f.selection, admission: { ...f.handle } }, async () => []),
    { code: "STALE_PREPARATION" });
  assert.equal(f.events.length, 0);
  const scope = { ...f.scope, windowEnd: new Date(Date.now() - 1).toISOString(),
    windowStart: new Date(Date.now() - 60000).toISOString() };
  const expired = new OracleShiftManagementUow(f.pool, f.evidence, f.authority, scope);
  await assert.rejects(expired.run(f.selection, async () => []), { code: "LIVE_WRITES_DISABLED" });
  assert.equal(f.events.length, 0);
});
test("acquire failure is known zero-effects, not fictional rollback", async () => {
  const f = nativeProtocolFixture(); f.faults.acquire = true;
  await assert.rejects(f.run(), (error: unknown) => error instanceof ShiftUowRejection &&
    error.ordinaryRollbackProved === false && error.problemCase.effect === "none");
  assert.equal(f.inspect().rollbacks, 0); assert.equal(f.inspect().sequenceCalls, 0);
});
for (const fault of ["duplicateId", "overflowId"] as const) {
  test(`native sequence ${fault} fails safely with retained sequence gaps`, async () => {
    const f = nativeProtocolFixture(); f.faults[fault] = true;
    await assert.rejects(f.run(), { code: "INVALID_SOURCE_DATA" });
    assert.equal(f.inspect().commits, 0); assert.equal(f.inspect().core.days.length, 0);
    assert.ok(f.inspect().sequenceCalls > 0);
  });
}
for (const sql of ["SYSDATE", "SHIFTER.SHF_AGENT_DAY_ID.NEXTVAL", "some_function()", "SYS_CONTEXT('USERENV','SESSION_USER')"]) {
  test(`unreviewed Oracle DATA_DEFAULT ${sql.split("(")[0]} denies before sequence/DML`, async () => {
    const f = nativeProtocolFixture();
    const column = f.schema.SHF_EMPLOYEE_DAY.find(c => c.name === "WM_SCHEDULE_DAY_ID"); assert.ok(column);
    column.defaultSql = sql;
    await assert.rejects(f.run(), { code: "LIVE_WRITES_DISABLED" });
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
  });
}
test("Oracle static defaults preserve NULL and quoted text/number, never evaluate expressions", () => {
  const column = oracleManagementSchema().SHF_EMPLOYEE_DAY[4];
  assert.equal(shiftOracleStaticDefault({ ...column, defaultSql: "'O''Brien'" }), "O'Brien");
  assert.equal(shiftOracleStaticDefault({ ...column, defaultSql: "'SYSDATE'" }), "SYSDATE");
  assert.equal(shiftOracleStaticDefault({ ...column, defaultSql: "''" }), null);
  assert.equal(shiftOracleStaticDefault({ ...column, kind: "number", defaultSql: "0" }), "0");
  assert.throws(() => shiftOracleStaticDefault({ ...column, nullable: false, defaultSql: null }),
    { code: "LIVE_WRITES_DISABLED" });
});
test("all13 source DATE columns are required as DATE, even if observed rows are NULL", () => {
  const schema = oracleManagementSchema(); let checked = 0;
  for (const table of ["SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE"] as const) {
    for (let i = 0; i < schema[table].length; i++) {
      if (schema[table][i].kind !== "date") continue;
      const changed = structuredClone(schema); changed[table][i].kind = "text";
      assert.throws(() => validateShiftOracleSchema(changed), { code: "LIVE_WRITES_DISABLED" }); checked++;
    }
  }
  assert.equal(checked, 13);
});
test("native callback cannot allocate before locked full read, fabricate effects or exceed admitted rows", async () => {
  const first = nativeProtocolFixture();
  await assert.rejects(first.uow.run(first.selection, async locked => { await locked.nextDayId(); return []; }),
    { code: "STALE_PREPARATION" });
  assert.equal(first.inspect().sequenceCalls, 0);
  const second = nativeProtocolFixture();
  await assert.rejects(second.uow.run(second.selection, async locked => {
    await locked.readLockedSnapshot(); return [];
  }), { code: "INVALID_SOURCE_DATA" });
  assert.equal(second.inspect().commits, 0);
});
const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};
test("abort drains outstanding SQL and BREAK before rollback/close; never releases a busy lease", async () => {
  const f = nativeProtocolFixture(), executing = deferred(), releaseSql = deferred(), releaseBreak = deferred();
  f.pauseSql(async () => { executing.resolve(); await releaseSql.promise; });
  f.pauseBreak(() => releaseBreak.promise);
  const controller = new AbortController();
  const pending = f.run(controller.signal); const rejection = assert.rejects(pending, { code: "COMMAND_OUTCOME_UNKNOWN" });
  await executing.promise; controller.abort(); await turn();
  assert.equal(f.inspect().active, 1); assert.equal(f.inspect().closed, 0); assert.equal(f.inspect().rollbacks, 0);
  releaseSql.resolve(); await turn();
  assert.equal(f.inspect().closed, 0); assert.equal(f.inspect().rollbacks, 0);
  releaseBreak.resolve(); await rejection;
  assert.ok(f.events.indexOf("rollback") > f.events.indexOf("sql-settled"));
  assert.ok(f.events.indexOf("rollback") > f.events.indexOf("break-settled"));
  assert.equal(f.inspect().active, 0); assert.equal(f.inspect().closed, 1);
});
test("explicit/ambient abort before native work cannot acquire a pool or consume sequence", async () => {
  const f = nativeProtocolFixture(), abort = new AbortController(); abort.abort();
  await assert.rejects(f.run(abort.signal), { code: "DEPENDENCY_TIMEOUT" });
  await withRequestBudget(abort.signal, 5000, async () => {
    await assert.rejects(f.run(), { code: "DEPENDENCY_TIMEOUT" });
  });
  assert.equal(f.events.length, 0);
});
for (const kind of ["change", "cancel"] as const) {
  test(`native ${kind} UPDATE-existing-overlay preserves fields outside its exact SET allowlist`, async () => {
    const f = nativeProtocolFixture(kind, true), ack = await f.run();
    assert.equal(ack.effects.length, 1); assert.equal(f.inspect().commits, 1);
    const update = f.statements.find(call => call.sql.startsWith("UPDATE SHIFTER.SHF_DAY_CHANGES"));
    assert.ok(update);
    const set = update.sql.split("WHERE")[0];
    assert.doesNotMatch(set, /NEW_SITE_ID=|NEW_SPLIT_SHIFT=|NEW_POOL_ERR=|NEW_EXCEPTION_TYPE_ID=|NEW_TIMEOFF_TYPE_ID=/);
    if (kind === "change") assert.doesNotMatch(set, /NEW_EMPLOYEE_ID=|NEW_DAY_TYPE=|CANCEL_REASON_CODE=/);
    if (kind === "cancel") assert.doesNotMatch(set, /NEW_SHIFT_START=|NEW_PAID_MINUTES=|NEW_ACTIVITY=/);
    assert.equal(f.inspect().core.overlays[0].NEW_POOL_ERR, null);
    assert.equal(f.inspect().sequenceCalls, 0);
  });
}
for (const scenario of ["duplicate-baseline", "missing-column", "wrong-date", "extra-column",
  "ambiguous-prefix", "extra-prefix-column", "orphan-attendance", "overflow"] as const) {
  test(`physical source ${scenario} fails closed, never repairs/truncates/chooses-first`, async () => {
    const schema = oracleManagementSchema();
    const query: NativeQuery = async sql => {
      if (sql.includes("shf49:employee")) return [oracleEmployee()];
      if (sql.includes("shf49:prefix")) return scenario === "ambiguous-prefix" ?
        [{ EMPLOYEE_ID: "1" }, { EMPLOYEE_ID: "2" }] : scenario === "extra-prefix-column" ?
          [{ EMPLOYEE_ID: "1", UNKNOWN: "unexpected" }] : [{ EMPLOYEE_ID: "1" }];
      if (sql.includes("shf49:days")) {
        const row = oracleBaseline();
        if (scenario === "duplicate-baseline") return [row, { ...row }];
        if (scenario === "missing-column") delete row.WM_WORK_MINUTES;
        if (scenario === "wrong-date") row.WM_DATE = "2027-02-29T00:00:00";
        if (scenario === "extra-column") row.UNOBSERVED_COLUMN = "unexpected";
        if (scenario === "overflow") return Array.from({ length: 1001 }, (_, i) =>
          ({ ...row, SHF_EMPLOYEE_DAY_ID: String(i + 1) }));
        return [row];
      }
      if (sql.includes("shf49:overlays")) return [];
      if (sql.includes("shf49:attendance")) return scenario === "orphan-attendance" ?
        [{ SHF_EMPLOYEE_DAY_ID: "99", STAGE_ARRIVAL_TIME: null, STATION_ARRIVAL_TIME: null,
          STATION_EXIT_TIME: null, LATE_REMARK: null }] : [];
      throw Error("Unexpected isolated SELECT");
    };
    await assert.rejects(readShiftOracleWindow(query, schema, { employeeId: "1", shiftDayId: "7" }, oracleScope()),
      { code: scenario === "overflow" ? "DEPENDENCY_UNAVAILABLE" : "INVALID_SOURCE_DATA" });
  });
}
test("native candidate SQL uses whole intervals, hidden overlay membership and bound selected ID", async () => {
  const calls: string[] = [];
  const query: NativeQuery = async sql => {
    calls.push(sql);
    if (sql.includes("shf49:employee")) return [oracleEmployee()];
    if (sql.includes("shf49:prefix")) return [{ EMPLOYEE_ID: "1" }];
    if (sql.includes("shf49:days")) return [oracleBaseline()];
    return [];
  };
  await readShiftOracleWindow(query, oracleManagementSchema(), { employeeId: "1", shiftDayId: "7" }, oracleScope());
  const sql = calls.find(call => call.includes("shf49:days")); assert.ok(sql);
  assert.match(sql, /WM_SHIFT_START_DATETIME<TO_DATE\(:rangeEnd/);
  assert.match(sql, /WM_SHIFT_END_DATETIME>TO_DATE\(:rangeStart/);
  assert.match(sql, /NVL\(c.NEW_SHIFT_START,d.WM_SHIFT_START_DATETIME\)/);
  assert.match(sql, /NVL\(c.NEW_SHIFT_END,d.WM_SHIFT_END_DATETIME\)/);
  assert.match(sql, /TO_NUMBER\(:selectedDay\) AND d.EMP_ID_NUMBER=:employeeKey/);
  assert.doesNotMatch(sql, /SUBSTR\(e\.EMP_ID_NUMBER|NEW_EMPLOYEE_ID\s*!=\s*'99999999'/);
});
test("native normalized source cannot disagree with physical owner/SOURCE/attendance before-images", async () => {
  const f = nativeProtocolFixture("change");
  const inspect = f.evidence.inspect.bind(f.evidence);
  f.evidence.inspect = async (...args) => {
    const result = await inspect(...args); result.snapshot.days[0].baseline.source = "SHF"; return result;
  };
  await assert.rejects(f.run(), { code: "INVALID_SOURCE_DATA" });
  assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
});
test("native preparation snapshot revision binds policy/catalog facts before effects", async () => {
  const f = nativeProtocolFixture();
  f.snapshot.policy.gapMinutes++;
  await assert.rejects(f.run(), { code: "STALE_PREPARATION" });
  assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
});
test("evidence adapter cannot invoke NEXTVAL or FOR UPDATE through its plain-query seam", async () => {
  for (const sql of ["SELECT SHIFTER.SHF_AGENT_DAY_ID.NEXTVAL FROM dual",
    "SELECT EMPLOYEE_ID FROM SHIFTER.SHF_EMPLOYEES FOR UPDATE NOWAIT"]) {
    const f = nativeProtocolFixture();
    f.evidence.assertConnection = async q => {
      await q(sql, {}, 1);
      return { operation: "native-shift-management-v0.1", reference: f.evidence.reference };
    };
    await assert.rejects(f.run(), { code: "INVALID_SOURCE_DATA" });
    assert.equal(f.inspect().sequenceCalls, 0); assert.equal(f.inspect().commits, 0);
  }
});
test("membership bind names cannot collide with effect/original bind frames", async () => {
  const f = nativeProtocolFixture();
  f.evidence.membershipGuard = () => ({
    sql: "NOT EXISTS (SELECT 1 FROM SHIFTER.SHF_EMPLOYEE_REPORTS p WHERE p.EMPLOYEE_ID=TO_NUMBER(:v0))",
    binds: { v0: "unexpected-collision" },
  });
  await assert.rejects(f.run(), { code: "INVALID_SOURCE_DATA" });
  assert.equal(f.inspect().commits, 0); assert.equal(f.inspect().core.days.length, 0);
});
test("native callback cannot leave SQL unawaited and cause rollback/close before settlement", async () => {
  const f = nativeProtocolFixture("create"), entered = deferred(), release = deferred();
  f.pauseSql(async () => { entered.resolve(); await release.promise; });
  let detachedResult: Promise<unknown> | undefined;
  const running = f.uow.run(f.selection, async locked => {
    await locked.readLockedSnapshot(); const id = await locked.nextDayId(), effect = f.plan.effects[0];
    const day: ShiftBaseline = { shiftDayId: id, employeeNumber: "00123456", dateLocal: "2027-01-04T00:00:00",
      dayType: "4", startLocal: effect.after.startLocal, endLocal: effect.after.endLocal,
      dayStartLocal: effect.after.startLocal, dayEndLocal: effect.after.endLocal,
      activityCode: "1", siteId: "1", paidMinutes: "60", workMinutes: "60", workFromHome: "N", splitShift: "N",
      source: "fExtra", remark: null, exceptionType: null, timeoffType: null, switchDayId: null,
      preserved: { WM_SCHEDULE_DAY_ID: null } };
    // Deliberately broken internal callback. The kernel still owns its SQL.
    detachedResult = locked.insertDay({ day }).then(value => value, error => error);
    return [];
  });
  const rejection = assert.rejects(running, { code: "INVALID_SOURCE_DATA" });
  await entered.promise; await turn();
  try { assert.equal(f.inspect().active, 1); assert.equal(f.inspect().closed, 0); assert.equal(f.inspect().rollbacks, 0); }
  finally { release.resolve(); }
  await rejection; await detachedResult;
  assert.equal(f.inspect().active, 0); assert.equal(f.inspect().commits, 0);
  assert.equal(f.inspect().rollbacks, 1); assert.equal(f.inspect().closed, 1);
});
test("native authority capabilities are checked independently of Administrator role", async () => {
  const f = nativeProtocolFixture();
  const original = f.authority.planFor.bind(f.authority);
  f.authority.planFor = attempt => ({ ...original(attempt), principal: { ...managementPrincipal(),
    capabilities: managementPrincipal().capabilities.filter(c => c !== "shift-management:test-oracle-write") } });
  await assert.rejects(f.run(), { code: "UNAUTHENTICATED" });
  assert.equal(f.events.length, 0);
});
test("native locks employee first and day IDs numerically, not lexicographically or driver order", async () => {
  const f = nativeProtocolFixture("cancel", false, ["10", "2"]);
  await f.run();
  assert.deepEqual(f.events.filter(event => event === "employee-lock" || event.startsWith("day-lock:")),
    ["employee-lock", "day-lock:2", "day-lock:7", "day-lock:10"]);
  assert.equal(f.inspect().commits, 1);
});
