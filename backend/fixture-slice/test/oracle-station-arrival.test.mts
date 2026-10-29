import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { StationOracleDouble, stationSelection as selection, stationDraft as draft } from "./native-station-arrival-double.mts";
import { nativeStationCommand, validNativeStationReceipt } from "../native-station-arrival-validation.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { same } from "../stage-arrival-domain.mts";
import { record } from "../contract-validation.mts";
import { withRequestBudget } from "../request-budget-context.mts";
import { stationTables, stationCandidateSql, stationCandidateScope } from "../oracle-station-arrival-snapshot.mts";
import type { NativeSchema } from "../oracle-stage-arrival-snapshot.mts";
import { ExitOracleDouble } from "./native-station-exit-double.mts";
import { OracleStationArrivalApplication } from "../oracle-station-arrival-application.mts";
import type { StationCandidate } from "../oracle-station-arrival-domain.mts";
import type { NativeStationArrivalValidationV1 } from "../oracle-station-arrival-contracts.mts";
const command = (v: NativeStationArrivalValidationV1) => nativeStationCommand({ commandId: randomUUID(), draft,
  validationToken: v.validationToken, fingerprint: v.fingerprint, confirmation: null, operationConfirmation: { accepted: true } });
const error = (code: string, effect = "none") => (e: unknown) => e instanceof StageArrivalError && e.code === code && e.effect === effect;
async function prepared(d: StationOracleDouble) {
  const { app, principal, uow } = await d.application();
  const v = await app.validate(principal, selection, draft);
  return { app, principal, uow, cmd: command(v) };
}
const independentCandidateSchema: NativeSchema = {
  SHF_EMPLOYEE_DAY: [
    { name: "SHF_EMPLOYEE_DAY_ID", kind: "number" }, { name: "EMP_ID_NUMBER", kind: "text" },
    { name: "WM_SHIFT_START_DATETIME", kind: "date" }, { name: "WM_SHIFT_END_DATETIME", kind: "date" },
    { name: "SOURCE", kind: "text" }, { name: "WM_SITE_ID", kind: "number" },
  ],
  SHF_DAY_CHANGES: [
    { name: "SHF_EMPLOYEE_DAY_ID", kind: "number" }, { name: "NEW_EMPLOYEE_ID", kind: "text" },
    { name: "NEW_SHIFT_START", kind: "date" }, { name: "NEW_SHIFT_END", kind: "date" },
    { name: "NEW_ACTIVITY", kind: "text" }, { name: "NEW_SITE_ID", kind: "number" },
  ],
};
test("candidate SELECT uses disjoint day-row UNION ALL and distinct changed-owner keys before the unfiltered all-overlay join", () => {
  const sql = stationCandidateSql(independentCandidateSchema);
  assert.equal((sql.match(/\bUNION ALL\b/g) ?? []).length, 1);
  assert.match(sql, /SELECT DISTINCT candidate_owner.SHF_EMPLOYEE_DAY_ID/);
  assert.match(sql, /candidate_owner.NEW_EMPLOYEE_ID=:prefix/);
  assert.match(sql, /d.EMP_ID_NUMBER=:prefix/);
  assert.match(sql, /\(d.EMP_ID_NUMBER<>:prefix OR d.EMP_ID_NUMBER IS NULL\)/);
  assert.doesNotMatch(sql, /\bEXISTS\b|\bCOALESCE\b|\bROWNUM\b|\bFETCH FIRST\b|\bROWID\b/);
  const outer = /\)\s+d\s+LEFT JOIN SHIFTER.SHF_DAY_CHANGES c\s+ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID\s*$/;
  assert.match(sql, outer);
  assert.doesNotMatch(sql, /c.NEW_EMPLOYEE_ID\s*(?:=|<>|IN\b)/);
  const rawColumns = independentCandidateSchema.SHF_EMPLOYEE_DAY.map(c => `d.${c.name}`).join(",");
  assert.equal(sql.split(`SELECT ${rawColumns} FROM SHIFTER.SHF_EMPLOYEE_DAY d`).length - 1, 2);
  for (const [table, alias] of [["SHF_EMPLOYEE_DAY", "d"], ["SHF_DAY_CHANGES", "c"]])
    for (const column of independentCandidateSchema[table]) assert.ok(sql.includes(`AS "${alias}_${column.name}"`));
  // The command-side old-value/count scope is deliberately NOT rewritten.
  assert.equal(stationCandidateScope, `(d.EMP_ID_NUMBER=:prefix OR EXISTS
  (SELECT 1 FROM SHIFTER.SHF_DAY_CHANGES candidate_owner
   WHERE candidate_owner.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID AND candidate_owner.NEW_EMPLOYEE_ID=:prefix))`);
});

type ModelDay = { id: number | null; employee: string | null; payload: string };
type ModelChange = { id: number | null; employee: string | null; payload: string };
// Independent relational model of SQL equality/inequality in WHERE/ON:
// comparisons with NULL are UNKNOWN (not JavaScript NULL===NULL).
const sqlEqual = <T,>(a: T | null, b: T | null) => a !== null && b !== null && a === b;
const sqlUnequal = <T,>(a: T | null, b: T | null) => a !== null && b !== null && a !== b;
function modelJoinedBag(days: ModelDay[], changes: ModelChange[]): string[] {
  return days.flatMap(d => {
    const matches = changes.filter(c => sqlEqual(c.id, d.id));
    const joined: Array<ModelChange | null> = matches.length ? matches : [null];
    return joined.map(c => JSON.stringify([d.id, d.employee, d.payload, c?.id ?? null, c?.employee ?? null, c?.payload ?? null]));
  }).sort();
}
function oldCandidateBag(days: ModelDay[], changes: ModelChange[], prefix: string | null) {
  return modelJoinedBag(days.filter(d => sqlEqual(d.employee, prefix) ||
    changes.some(c => sqlEqual(c.id, d.id) && sqlEqual(c.employee, prefix))), changes);
}
function disjointCandidateBag(days: ModelDay[], changes: ModelChange[], prefix: string | null) {
  const keys = [...new Set(changes.filter(c => sqlEqual(c.employee, prefix)).map(c => c.id))];
  const baseline = days.filter(d => sqlEqual(d.employee, prefix));
  const changedOnly = days.filter(d => (sqlUnequal(d.employee, prefix) || d.employee === null) &&
    keys.some(key => sqlEqual(d.id, key)));
  return modelJoinedBag([...baseline, ...changedOnly], changes);
}
function unsafePlainKeyBag(days: ModelDay[], changes: ModelChange[], prefix: string | null) {
  const keys = [...new Set([...days.filter(d => sqlEqual(d.employee, prefix)).map(d => d.id),
    ...changes.filter(c => sqlEqual(c.employee, prefix)).map(c => c.id)])];
  return modelJoinedBag(days.filter(d => keys.some(key => sqlEqual(d.id, key))), changes);
}
test("independent 25,434-case bag matrix preserves old OR/EXISTS with NULL keys/prefixes, duplicate rows/overlays and orphans", () => {
  const p = "PREFIX01", other = "OTHER001";
  const alternatives: Array<{ id: number | null; employee: string | null }> = [];
  for (const id of [1, 2, 3, null]) for (const employee of [p, other, null]) alternatives.push({ id, employee });
  const overlays: ModelChange[][] = [[], ...alternatives.map(c => [{ ...c, payload: "c0" }])];
  for (const a of alternatives) for (const b of alternatives)
    overlays.push([{ ...a, payload: "c0" }, { ...b, payload: "c1" }]);
  let cases = 0;
  for (const prefix of [p, null]) for (const firstId of [1, 2, null]) for (const secondId of [1, 2, null])
    for (const firstOwner of [p, other, null]) for (const secondOwner of [p, other, null]) for (const changes of overlays) {
      const days = [{ id: firstId, employee: firstOwner, payload: "d0" },
        { id: secondId, employee: secondOwner, payload: "d1" }];
      assert.deepEqual(disjointCandidateBag(days, changes, prefix), oldCandidateBag(days, changes, prefix));
      cases++;
    }
  assert.equal(cases, 25434); // One node:test case; no Oracle timing/plan claim.
});
test("plain key UNION counterexamples stay visible; UNION ALL retains physically identical malformed day rows", () => {
  const p = "PREFIX01";
  for (const days of [
    [{ id: null, employee: p, payload: "null-key" }],
    [{ id: 1, employee: p, payload: "owned" }, { id: 1, employee: "OTHER001", payload: "other-owner" }],
  ]) {
    assert.notDeepEqual(unsafePlainKeyBag(days, [], p), oldCandidateBag(days, [], p));
    assert.deepEqual(disjointCandidateBag(days, [], p), oldCandidateBag(days, [], p));
  }
  const duplicate = { id: 1, employee: p, payload: "identical" };
  assert.equal(disjointCandidateBag([duplicate, { ...duplicate }], [], p).length, 2);
});
test("changed-only and moved-away membership never hides another overlay or converts prefix case", () => {
  const p = "PREFIX01";
  const days = [
    { id: 1, employee: p, payload: "baseline-moved-away" },
    { id: 2, employee: "OTHER001", payload: "changed-only" },
    { id: 3, employee: null, payload: "NULL-baseline-changed-only" },
    { id: 4, employee: "OTHER001", payload: "unrelated" },
    { id: 5, employee: "prefix01", payload: "different-case" },
  ];
  const changes = [
    { id: 1, employee: "OTHER001", payload: "moved" },
    { id: 2, employee: p, payload: "matching" }, { id: 2, employee: "OTHER001", payload: "duplicate-other-owner" },
    { id: 2, employee: null, payload: "duplicate-NULL-owner" }, { id: 3, employee: p, payload: "changed" },
    { id: 99, employee: p, payload: "orphan" }, { id: null, employee: p, payload: "NULL-key-orphan" },
  ];
  const bag = disjointCandidateBag(days, changes, p);
  assert.deepEqual(bag, oldCandidateBag(days, changes, p));
  assert.equal(bag.length, 5);
  assert.ok(bag.some(r => r.includes("duplicate-other-owner")) && bag.some(r => r.includes("duplicate-NULL-owner")));
  assert.ok(!bag.some(r => /unrelated|different-case|orphan/.test(r)));
});
test("candidate bag retains >1000 raw overlays so only the existing outer1001 overflow lookahead applies", () => {
  const p = "PREFIX01", days = [{ id: 1, employee: "OTHER001", payload: "changed-only" }];
  const changes = Array.from({ length: 1002 }, (_, i) => ({ id: 1, employee: i === 0 ? p : "OTHER001", payload: `c${i}` }));
  const bag = disjointCandidateBag(days, changes, p);
  assert.deepEqual(bag, oldCandidateBag(days, changes, p));
  assert.equal(bag.length, 1002);
  assert.equal(bag.slice(0, 1001).length, 1001);
  assert.doesNotMatch(stationCandidateSql(independentCandidateSchema), /\bROWNUM\b|\bFETCH FIRST\b/);
});
for (const source of ["station", "exit"] as const)
  test(`shared ${source} reader retains final ORDER and outer ROWNUM1001 around the candidate SELECT`, async () => {
    const d = source === "station" ? new StationOracleDouble() : new ExitOracleDouble();
    try {
      const { app, principal } = await d.application();
      await app.validate(principal, selection, source === "station" ? draft : {});
      const query = d.sql.find(q => q.sql.includes(`${source}:candidates`)); assert.ok(query);
      assert.match(query.sql, /UNION ALL/);
      assert.match(query.sql, /ORDER BY d.SHF_EMPLOYEE_DAY_ID,c.SHF_EMPLOYEE_DAY_ID\) WHERE ROWNUM<=1001/);
      assert.equal((query.sql.match(/\bROWNUM\b/g) ?? []).length, 1);
      assert.doesNotMatch(query.sql, /c.NEW_EMPLOYEE_ID\s*=/);
      assert.equal(existsSync(d.binding.allowanceFile), false);
      assert.equal(d.events.includes("write:update"), false);
    } finally { d.dispose(); }
  });
for (const briefing of [null, "0", "1"]) for (const stage of [null, "2026-10-28T11:00:00"])
  test(`F2 Oracle preserves EVERY original: briefing=${briefing}, stage=${stage}`, async () => {
    const d = new StationOracleDouble();
    try {
      Object.assign(d.rows.SHF_ATTENDANCE!, { TADREECH: briefing, STAGE_ARRIVAL_TIME: stage, STAGE_ARRIVAL_USER: stage && "synthetic-original" });
      const before = structuredClone(d.rows.SHF_ATTENDANCE), { app, principal, cmd } = await prepared(d);
      assert.equal(existsSync(d.binding.allowanceFile), false);
      const receipt = await app.commit(principal, selection, cmd);
      assert.ok(validNativeStationReceipt(receipt, cmd, selection));
      assert.equal(receipt.recorded.briefing, briefing === null ? null : briefing === "1");
      const expected = { ...before, STATION_ARRIVAL_TIME: "2026-10-28T12:00:00", STATION_ARRIVAL_USER: "synthetic:administrator" };
      assert.ok(same(d.rows.SHF_ATTENDANCE, expected));
      assert.equal(receipt.recorded.stageArrivalLocal, stage);
      assert.equal(receipt.receiptPersistence, "none");
      assert.equal(existsSync(d.binding.allowanceFile), true);
      const update = d.sql.find(s => s.sql.includes("station:update")); assert.ok(update);
      const set = update.sql.split(" SET")[1].split(" WHERE")[0];
      assert.match(set, /STATION_ARRIVAL_TIME=/); assert.match(set, /STATION_ARRIVAL_USER=/);
      assert.doesNotMatch(set, /TADREECH|STAGE_ARRIVAL|INSERT|STATION_EXIT/);
      assert.match(update.sql, /SHF_LOCKED/); assert.match(update.sql, /SHF_EMPLOYEE_EXCEPTIONS_BASE/);
      assert.match(update.sql, /candidate_owner.NEW_EMPLOYEE_ID=:prefix/);
      assert.ok(record(update.binds));
      for (const value of Object.values(before!)) assert.ok(Object.values(update.binds).includes(value));
      await assert.rejects(app.commit(principal, selection, { ...cmd, commandId: randomUUID() }), error("ALREADY_REGISTERED"));
    } finally { d.dispose(); }
  });
for (const [label, change] of [
  ["locked", (d: StationOracleDouble) => { d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1"; }],
  ["report", (d: StationOracleDouble) => { d.reports = "1"; }],
  ["partial/full exception", (d: StationOracleDouble) => { d.exceptions = "1"; }],
  ["base exception", (d: StationOracleDouble) => { d.baseExceptions = "1"; }],
  ["flag", (d: StationOracleDouble) => { d.rows.SHF_ATTENDANCE!.OPTIONAL1 = "Y"; }],
  ["station late", (d: StationOracleDouble) => { d.rows.SHF_ATTENDANCE!.LATE_REASON_ID = "1"; }],
  ["stage late", (d: StationOracleDouble) => { d.rows.SHF_ATTENDANCE!.STAGE_LATE_REASON_ID = "1"; }],
  ["orphan station user", (d: StationOracleDouble) => { d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_USER = "synthetic-orphan"; }],
  ["exit user", (d: StationOracleDouble) => { d.rows.SHF_ATTENDANCE!.STATION_EXIT_USER = "synthetic-exit"; }],
  ["future stage", (d: StationOracleDouble) => { Object.assign(d.rows.SHF_ATTENDANCE!, { STAGE_ARRIVAL_TIME: "2026-10-28T12:01:00", STAGE_ARRIVAL_USER: "synthetic" }); }],
  ["overlap", (d: StationOracleDouble) => { d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null }); }],
] as const) test(`F2 ${label} defers pure validation without fuse/DML`, async () => {
  const d = new StationOracleDouble();
  try {
    change(d);
    const { app, principal } = await d.application();
    const context = await app.context(principal, selection); assert.equal(context.eligibility, "deferred");
    await assert.rejects(app.validate(principal, selection, draft), error("COMMAND_SCOPE_DEFERRED"));
    assert.equal(existsSync(d.binding.allowanceFile), false); assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
for (const field of ["SHF_LOCKED", "TADREECH", "STAGE_ARRIVAL_USER"] as const)
  test(`F2 invalid ${field} is not silently defaulted`, async () => {
    const d = new StationOracleDouble();
    try {
      if (field === "SHF_LOCKED") d.rows.SHF_EMPLOYEES![field] = null;
      else d.rows.SHF_ATTENDANCE![field] = "invalid";
      const { app, principal } = await d.application();
      await assert.rejects(app.validate(principal, selection, draft), error("INVALID_SOURCE_DATA"));
    } finally { d.dispose(); }
  });
for (const count of [0, 2, undefined]) test(`F2 rowsAffected=${count} cannot become success`, async () => {
  const d = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d); d.count = count;
    await assert.rejects(app.commit(principal, selection, cmd), error(count === 0 ? "STALE_PREPARATION" : "INVALID_SOURCE_DATA", "rolled-back"));
    assert.equal(d.committed, false); assert.ok(d.events.includes("write:rollback"));
    assert.equal(existsSync(d.binding.allowanceFile), true);
  } finally { d.dispose(); }
});
for (const fact of ["report", "lock", "briefing", "exception", "overlap"])
  test(`F2 locked reread detects changed ${fact} before UPDATE`, async () => {
    const d = new StationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d);
      d.hook = event => {
        if (event === "write:station:lock:SHF_EMPLOYEES") {
          if (fact === "report") d.reports = "1";
          if (fact === "lock") d.rows.SHF_EMPLOYEES!.SHF_LOCKED = "1";
          if (fact === "briefing") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
          if (fact === "exception") d.baseExceptions = "1";
          if (fact === "overlap") d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null });
        }
      };
      await assert.rejects(app.commit(principal, selection, cmd), error("STALE_PREPARATION"));
      assert.equal(d.events.includes("write:update"), false);
    } finally { d.dispose(); }
  });
test("F2 exact start admitted; start+1ms expires preparation and cannot write", async () => {
  const d = new StationOracleDouble();
  try {
    d.clockMs += 1200000; d.binding.windowEnd = new Date(d.clockMs + 60000).toISOString();
    const { app, principal, cmd } = await prepared(d);
    d.clockMs++;
    await assert.rejects(app.commit(principal, selection, cmd), error("STALE_PREPARATION"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
for (const phase of ["write:commit", "write:commit-ack", "readback", "preservation"])
  test(`F2 ${phase} ambiguity yields UNKNOWN/no replay`, async () => {
    const d = new StationOracleDouble();
    try {
      const { app, principal, cmd } = await prepared(d);
      d.hook = event => {
        if (event === phase) throw Error("synthetic transport loss");
        if (d.committed && event === "read:lease" && phase === "readback") throw Error("synthetic read loss");
        if (d.committed && event === "read:lease" && phase === "preservation") d.rows.SHF_ATTENDANCE!.TADREECH = "1";
      };
      await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
      d.hook = undefined;
      await assert.rejects(app.commit(principal, selection, { ...cmd, commandId: randomUUID() }), error("STALE_PREPARATION"));
      await assert.rejects(app.validate(principal, selection, draft), error("LIVE_WRITES_DISABLED"));
    } finally { d.dispose(); }
  });
for (const ambient of [false, true]) for (const phase of ["write:updated", "write:commit-ack"])
  test(`F2 ${ambient ? "ALS" : "explicit"} abort at ${phase} respects COMMIT boundary`, async () => {
    const d = new StationOracleDouble(), abort = new AbortController();
    try {
      const { app, principal, cmd } = await prepared(d);
      d.hook = event => { if (event === phase) abort.abort(); };
      const run = () => app.commit(principal, selection, cmd, ambient ? undefined : abort.signal);
      await assert.rejects(ambient ? withRequestBudget(abort.signal, 5000, run) : run(),
        error(phase === "write:updated" ? "DEPENDENCY_TIMEOUT" : "COMMAND_OUTCOME_UNKNOWN",
          phase === "write:updated" ? "rolled-back" : "unknown"));
      assert.equal(d.committed, phase === "write:commit-ack");
      if (phase === "write:updated") assert.equal(d.events.includes("write:commit"), false);
    } finally { d.dispose(); }
  });
test("F2 rollback failure after attempted update is UNKNOWN", async () => {
  const d = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d); d.count = 0;
    d.hook = e => { if (e === "write:rollback") throw Error("synthetic rollback loss"); };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    assert.ok(d.events.includes("write:close:true"));
  } finally { d.dispose(); }
});
test("F2 foreign application tokens/principal/source and races cannot reopen operation fuse", async () => {
  const d = new StationOracleDouble(), other = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d), foreign = await prepared(other);
    await assert.rejects(app.commit(principal, selection, foreign.cmd), error("STALE_PREPARATION"));
    await assert.rejects(app.commit({ ...principal, resourceScope: { orgUnitIds: ["T002"] } }, selection, cmd), error("SHIFT_DAY_NOT_FOUND"));
    await assert.rejects(app.commit(principal, { ...selection, shiftDayId: "6202" }, cmd), error("SHIFT_DAY_NOT_FOUND"));
    const results = await Promise.allSettled([app.commit(principal, selection, cmd), app.commit(principal, selection, cmd)]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(d.events.filter(e => e === "write:update").length, 1);
  } finally { d.dispose(); other.dispose(); }
});
test("F2 changed-employee overlay uses effective ownership, never baseline-only discovery", async () => {
  const d = new StationOracleDouble();
  try {
    d.rows.SHF_EMPLOYEE_DAY!.EMP_ID_NUMBER = "88888888";
    d.rows.SHF_DAY_CHANGES = Object.fromEntries(stationTables.SHF_DAY_CHANGES.map(k => [k, null]));
    Object.assign(d.rows.SHF_DAY_CHANGES, { SHF_EMPLOYEE_DAY_ID: "6201", NEW_EMPLOYEE_ID: "99999999" });
    const { app, principal, cmd } = await prepared(d);
    assert.equal((await app.commit(principal, selection, cmd)).outcome, "oracle-test-committed");
    const query = d.sql.find(s => s.sql.includes("station:candidates")); assert.ok(query);
    assert.match(query.sql, /UNION ALL/);
    assert.match(query.sql, /\(d.EMP_ID_NUMBER<>:prefix OR d.EMP_ID_NUMBER IS NULL\)/);
    assert.match(query.sql, /candidate_owner.NEW_EMPLOYEE_ID=:prefix/);
    assert.doesNotMatch(query.sql, /WHERE COALESCE/);
    assert.doesNotMatch(query.sql, /TRUNC|SYSDATE|BETWEEN/);
  } finally { d.dispose(); }
});
for (const kind of ["duplicate", "overflow", "unknown-endpoint", "full-day", "split", "invalid-month", "invalid-date"])
  test(`F2 overlap ${kind} evidence fails closed before token/fuse`, async () => {
    const d = new StationOracleDouble();
    try {
      const other: StationCandidate = { day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" }, change: null };
      if (kind === "duplicate") d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY! }, change: null });
      if (kind === "overflow") d.extraCandidates.push(...Array.from({ length: 1000 }, (_, i) =>
        ({ day: { ...other.day, SHF_EMPLOYEE_DAY_ID: String(7000 + i) }, change: null })));
      if (kind === "unknown-endpoint") { other.day.WM_SHIFT_END_DATETIME = null; d.extraCandidates.push(other); }
      if (kind === "full-day") { other.day.WM_DAY_TYPE = "1"; d.extraCandidates.push(other); }
      if (kind === "split") { other.day.SPLIT_SHIFT = "Y"; d.extraCandidates.push(other); }
      if (kind === "invalid-month" || kind === "invalid-date") {
        other.day.WM_SHIFT_START_DATETIME = kind === "invalid-month" ? "2026-13-01T01:00:00" : "2026-02-30T01:00:00";
        d.extraCandidates.push(other);
      }
      const { app, principal } = await d.application();
      await assert.rejects(app.validate(principal, selection, draft),
        error(kind === "full-day" || kind === "split" ? "COMMAND_SCOPE_DEFERRED" : "INVALID_SOURCE_DATA"));
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
for (const defect of ["missing-station-user", "capacity", "char-semantics", "trigger", "VPD", "F1-digest"])
  test(`F2 current metadata ${defect} cannot borrow F1 certification`, async () => {
    const d = new StationOracleDouble();
    try {
      if (defect === "missing-station-user") d.proof[0] = d.proof[0].filter(c => !record(c) || c.columnName !== "STATION_ARRIVAL_USER");
      if (defect === "capacity" || defect === "char-semantics")
        for (const c of d.proof[0]) if (record(c) && c.columnName === "STATION_ARRIVAL_USER") {
          if (defect === "capacity") c.dataLength = 22; else c.charUsed = "C";
        }
      if (defect === "trigger") d.proof[3].push({ status: "ENABLED" });
      if (defect === "VPD") d.proof[4].push({ enabled: "YES" });
      d.certify();
      if (defect === "F1-digest") d.binding.stationMetadataDigest = "0".repeat(64);
      await assert.rejects(d.application(), error("LIVE_WRITES_DISABLED"));
      assert.equal(existsSync(d.binding.allowanceFile), false);
      assert.ok(d.events.includes("write:rollback"));
    } finally { d.dispose(); }
  });
test("F2 complete attendance originals include operator-certified nullable unknown columns with unique old binds", async () => {
  const d = new StationOracleDouble();
  try {
    d.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "SYNTHETIC_NULL_DEPENDENCY", dataType: "VARCHAR2",
      dataLength: 100, charUsed: "B", nullable: "Y", virtualColumn: "NO" });
    d.rows.SHF_ATTENDANCE!.SYNTHETIC_NULL_DEPENDENCY = null; d.certify();
    const { app, principal, cmd } = await prepared(d);
    await app.commit(principal, selection, cmd);
    const update = d.sql.find(s => s.sql.includes("station:update")); assert.ok(update && record(update.binds));
    for (const column of Object.keys(d.rows.SHF_ATTENDANCE!)) {
      const escaped = column.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.match(update.sql, new RegExp(`a\\.${escaped}=.*:old[0-9]+`));
    }
    const oldKeys = Object.keys(update.binds).filter(k => /^old\d+$/.test(k));
    assert.ok(oldKeys.length >= Object.keys(d.rows.SHF_ATTENDANCE!).length);
    for (const key of oldKeys) assert.equal((update.sql.match(new RegExp(`:${key}\\b`, "g")) ?? []).length, 2);
  } finally { d.dispose(); }
});
test("F2 NOWAIT contention rolls back without UPDATE; allowance still spent", async () => {
  const d = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:station:lock:SHF_ATTENDANCE") throw Object.assign(Error("synthetic busy"), { code: "ORA-00054" }); };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_IN_PROGRESS"));
    assert.equal(d.events.includes("write:update"), false); assert.equal(existsSync(d.binding.allowanceFile), true);
  } finally { d.dispose(); }
});
test("F2 independent readback identity mismatch remains UNKNOWN", async () => {
  const d = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:commit-ack") d.observations.read.host = "synthetic-wrong"; };
    await assert.rejects(app.commit(principal, selection, cmd), error("COMMAND_OUTCOME_UNKNOWN", "unknown"));
    assert.equal(d.committed, true);
  } finally { d.dispose(); }
});
test("F2 explicit preabort never consumes fuse or acquires lease", async () => {
  const d = new StationOracleDouble(), abort = new AbortController();
  try {
    const { app, principal, cmd } = await prepared(d), count = d.events.length; abort.abort();
    await assert.rejects(app.commit(principal, selection, cmd, abort.signal), error("DEPENDENCY_TIMEOUT"));
    assert.equal(d.events.length, count); assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("F2 pending UPDATE remains owned through abort, native break, rollback and close", async () => {
  const d = new StationOracleDouble(), abort = new AbortController();
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>(r => { release = r; }), entry = new Promise<void>(r => { entered = r; });
  let pending: Promise<unknown> | undefined;
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = async e => { if (e === "write:update") { entered(); await gate; } };
    pending = app.commit(principal, selection, cmd, abort.signal);
    const check = assert.rejects(pending, error("DEPENDENCY_TIMEOUT", "rolled-back"));
    await entry; abort.abort();
    assert.equal(d.events.includes("write:close:false"), true); // initialization lease only
    const closes = d.events.filter(e => e.startsWith("write:close:")).length;
    await new Promise<void>(r => setTimeout(r, 10));
    assert.equal(d.events.filter(e => e.startsWith("write:close:")).length, closes);
    assert.ok(d.events.includes("write:break")); release(); await check;
    assert.equal(d.events.includes("write:commit"), false);
  } finally { release(); await pending?.catch(() => {}); d.dispose(); }
});
test("F2 UoW reference/zone cannot change behind an admitted application", async () => {
  const d = new StationOracleDouble();
  try {
    const { uow } = await d.application();
    assert.throws(() => new OracleStationArrivalApplication(uow, d.binding, d.clock, "Asia/Jerusalem", ["T001"]));
    const changed = structuredClone(d.binding);
    changed.readIdentity.database = "SYNTHETIC_OTHER";
    changed.writeIdentity.database = "SYNTHETIC_OTHER";
    assert.throws(() => new OracleStationArrivalApplication(uow, changed, d.clock, "UTC", ["T001"]));
  } finally { d.dispose(); }
});
test("F2 final pre-COMMIT business Clock guard rolls back when start+1ms arrives during UPDATE", async () => {
  const d = new StationOracleDouble();
  try {
    const { app, principal, cmd } = await prepared(d);
    d.hook = e => { if (e === "write:updated") d.clockMs += 1200001; };
    await assert.rejects(app.commit(principal, selection, cmd), error("STALE_PREPARATION", "rolled-back"));
    assert.equal(d.events.includes("write:commit"), false);
    assert.equal(d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME, null);
  } finally { d.dispose(); }
});
for (const date of ["2026-03-29", "2026-10-25"])
  test(`F2 stored stage in London fold/gap ${date} cannot be treated as valid pre-existing stage`, async () => {
    const d = new StationOracleDouble();
    try {
      Object.assign(d.rows.SHF_ATTENDANCE!, { STAGE_ARRIVAL_TIME: `${date}T01:30:00`, STAGE_ARRIVAL_USER: "synthetic-stage" });
      const { app, principal } = await d.application("Europe/London");
      await assert.rejects(app.validate(principal, selection, draft), error("INVALID_SOURCE_DATA"));
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
test("F2 duplicate overlays cannot hide behind changed-owner scope filtering", async () => {
  const d = new StationOracleDouble();
  try {
    const change = Object.fromEntries(stationTables.SHF_DAY_CHANGES.map(k => [k, null]));
    const day = { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" };
    d.extraCandidates.push(
      { day, change: { ...change, SHF_EMPLOYEE_DAY_ID: "6202", NEW_EMPLOYEE_ID: "88888888" } },
      { day, change: { ...change, SHF_EMPLOYEE_DAY_ID: "6202", NEW_EMPLOYEE_ID: "99999999" } });
    const { app, principal } = await d.application();
    await assert.rejects(app.validate(principal, selection, draft), error("INVALID_SOURCE_DATA"));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
test("F2 coherent moved-away baseline candidate is validated before exclusion, not misreported overlapping", async () => {
  const d = new StationOracleDouble();
  try {
    const change = Object.fromEntries(stationTables.SHF_DAY_CHANGES.map(k => [k, null]));
    d.extraCandidates.push({ day: { ...d.rows.SHF_EMPLOYEE_DAY!, SHF_EMPLOYEE_DAY_ID: "6202" },
      change: { ...change, SHF_EMPLOYEE_DAY_ID: "6202", NEW_EMPLOYEE_ID: "88888888" } });
    const { app, principal, cmd } = await prepared(d);
    assert.equal((await app.commit(principal, selection, cmd)).outcome, "oracle-test-committed");
  } finally { d.dispose(); }
});
