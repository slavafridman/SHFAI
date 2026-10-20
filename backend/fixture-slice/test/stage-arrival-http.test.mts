import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import type { OutgoingHttpHeaders } from "node:http";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { createConnection } from "node:net";
import { createLoopbackServer } from "../http-adapter.mts";
import { stopBackendServer, startFromEnvironment } from "../server.mts";
import { createRuntime } from "../synthetic-identity.mts";
import type { SliceRuntime } from "../synthetic-identity.mts";
import { FixtureReader } from "../fixture-reader.mts";
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { VirtualClock, runtimeFixture, clean, late, selected, commitInput } from "./stage-arrival-helpers.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { SliceError } from "../errors.mts";
import { record } from "../contract-validation.mts";
import type { StageArrivalValidationDraftV1 } from "../stage-arrival-contracts.mts";
import type { StageArrivalHttpOptions } from "../stage-arrival-http.mts";
import { exact } from "../stage-arrival-validation.mts";

const base = "/api/v1/employees/9001/shift-days/6201/stage-arrival";
const chromeClientHints = {
  "sec-ch-ua": '"Chromium";v="141", "Google Chrome";v="141", "Not_A Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};
async function serve(rt: SliceRuntime, work: (url: string) => Promise<void>, options: StageArrivalHttpOptions = {}) {
  const server = createLoopbackServer(rt, options); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const a = server.address(); if (!a || typeof a === "string") throw Error("No listener");
  try { await work(`http://127.0.0.1:${a.port}`); } finally { await stopBackendServer(server); }
}
function post(url: string, input: unknown) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(input) });
}
async function object(response: Response) {
  const v: unknown = await response.json(); assert.ok(record(v)); return v;
}
// Parse the actual HTTP body without casting unknown to a canonical type.
function validation(v: unknown): StageArrivalValidationDraftV1 {
  assert.ok(exact(v, ["employeeId", "shiftDayId", "state", "evaluatedAt", "evaluatedLocal", "expiresAt",
    "businessTimeZone", "fingerprint", "validationToken", "warnings", "confirmationRequired", "dataSource"]));
  assert.equal(v.employeeId, "9001"); assert.equal(v.shiftDayId, "6201"); assert.equal(v.state, "ready");
  assert.equal(v.dataSource, "isolated-fixture"); assert.equal(v.confirmationRequired, false);
  assert.ok(typeof v.evaluatedAt === "string" && typeof v.evaluatedLocal === "string" &&
    typeof v.expiresAt === "string" && typeof v.businessTimeZone === "string" &&
    typeof v.fingerprint === "string" && typeof v.validationToken === "string");
  assert.deepEqual(v.warnings, []);
  return { employeeId: "9001", shiftDayId: "6201", state: "ready", evaluatedAt: v.evaluatedAt,
    evaluatedLocal: v.evaluatedLocal, expiresAt: v.expiresAt, businessTimeZone: v.businessTimeZone,
    fingerprint: v.fingerprint, validationToken: v.validationToken, warnings: [], confirmationRequired: false,
    dataSource: "isolated-fixture" };
}
function raw(url: string, method: string, payload = "", headers: OutgoingHttpHeaders | string[] = {}) {
  return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: unknown }>((resolve, reject) => {
    const req = request(url, { method, headers }, response => {
      const parts: Buffer[] = [];
      response.on("data", part => parts.push(Buffer.from(part)));
      response.on("end", () => {
        try { resolve({ status: response.statusCode!, headers: response.headers,
          body: Buffer.concat(parts).length ? JSON.parse(Buffer.concat(parts).toString()) : null }); }
        catch (e) { reject(e); }
      });
    });
    req.once("error", reject); req.end(payload);
  });
}
test("ARR-HTTP actual GET/POST three operations, purity0 then commit1 and replay1, unchanged read DTOs", async () => {
  const f = await runtimeFixture();
  await serve(f.runtime, async url => {
    const id = await object(await fetch(url + "/api/v1/identity"));
    assert.ok(record(id.principal)); assert.equal(id.principal.employeeId, null);
    assert.ok(Array.isArray(id.principal.capabilities)); assert.equal(id.principal.capabilities.length, 9);
    assert.deepEqual(Object.keys(id).sort(), ["dataSource", "principal"]);
    const context = await fetch(url + base + "/context");
    assert.equal(context.status, 200); assert.equal(context.headers.get("cache-control"), "no-store");
    assert.equal(context.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await object(context)).dataSource, "isolated-fixture");
    const vresponse = await post(url + base + "/validations", clean);
    assert.equal(vresponse.status, 200); const v = validation(await vresponse.json());
    assert.equal(f.store.inspectSnapshot().receipts, 0); assert.equal(f.store.inspectSnapshot().audits, 0);
    f.clock.advance(5000);
    const cmd = commitInput(v), committed = await post(url + base + "/commands", cmd);
    assert.equal(committed.status, 200); const r = await object(committed);
    assert.equal(r.dataSource, "isolated-fixture"); assert.equal(r.partnerCompletion, "not-invoked");
    assert.equal(r.outcome, "fixture-committed"); assert.equal(r.replayed, false);
    assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
    assert.equal((await object(await post(url + base + "/commands", cmd))).replayed, true);
    const detail = await object(await fetch(url + "/api/v1/employees/9001/shift-days/6201"));
    assert.ok(record(detail.attendance)); assert.equal(detail.attendance.stageArrivalLocal, "2026-10-20T10:22:05");
    assert.equal(detail.dataSource, "isolated-fixture");
    const listResponse = await fetch(url + "/api/v1/attendance?attendanceDate=2026-10-20&timeFrom=10:30&timeTo=10:30");
    assert.equal(listResponse.status, 200);
    const list = await object(listResponse); assert.equal(list.dataSource, "isolated-fixture");
    assert.ok(Array.isArray(list.items)); assert.equal(list.items.length, 1);
    const row: unknown = list.items[0]; assert.ok(record(row) && record(row.attendance));
    assert.equal(row.attendance.stageArrivalLocal, "2026-10-20T10:22:05");
    assert.deepEqual(Object.keys(row.attendance).sort(), ["briefingRecorded", "missingReasonCode",
      "stageArrivalLocal", "stationArrivalLocal", "stationExitLocal"]);
  });
});

test("ARR-HTTP Chrome client hints reach context/validation/command unchanged, metadata grants no identity", async () => {
  const f = await runtimeFixture();
  await serve(f.runtime, async url => {
    const context = await raw(url + base + "/context", "GET", "", chromeClientHints);
    assert.equal(context.status, 200);
    assert.ok(record(context.body));
    assert.equal(context.body.dataSource, "isolated-fixture");
    assert.equal(context.body.eligibility, "eligible");
    assert.deepEqual(f.store.inspectSnapshot().rows[0].attendance?.attendanceKey, { shiftDayId: "6201" });
    assert.equal(f.store.inspectSnapshot().receipts, 0);
    assert.equal(f.store.inspectSnapshot().audits, 0);
    const payload = JSON.stringify(clean);
    const prepared = await raw(url + base + "/validations", "POST", payload, {
      ...chromeClientHints, "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload),
    });
    assert.equal(prepared.status, 200);
    const v = validation(prepared.body);
    assert.equal(f.store.inspectSnapshot().rows[0].attendance?.stageArrivalLocal, null);
    assert.equal(f.store.inspectSnapshot().receipts, 0);
    assert.equal(f.store.inspectSnapshot().audits, 0);
    const commandBody = JSON.stringify(commitInput(v));
    const committed = await raw(url + base + "/commands", "POST", commandBody, {
      ...chromeClientHints, "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(commandBody),
    });
    assert.equal(committed.status, 200);
    assert.ok(record(committed.body));
    assert.equal(committed.body.dataSource, "isolated-fixture");
    assert.equal(committed.body.outcome, "fixture-committed");
    assert.equal(committed.body.partnerCompletion, "not-invoked");
    const state = f.store.inspectSnapshot();
    assert.equal(state.receipts, 1); assert.equal(state.audits, 1); assert.equal(state.active, 0);
    assert.equal(state.rows[0].attendance?.stageArrivalUser, "Synthetic Administrator (local/isolated only)");
    const p = await f.runtime.authenticate({ authorization: null });
    assert.equal(p.employeeId, null); assert.equal(p.capabilities.length, 9);
    assert.equal(p.subject, "synthetic:administrator");
  });
});

test("ARR-HTTP Chrome client hints preserve byte caps, duplicates, Origin/media and unknown-header rejection", async () => {
  const f = await runtimeFixture(), origin = "http://localhost:4320";
  await serve(f.runtime, async url => {
    const allowed = await raw(url + base + "/context", "GET", "", { ...chromeClientHints, Origin: origin });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers["cache-control"], "no-store");
    const bounded = await raw(url + base + "/context", "GET", "", {
      ...chromeClientHints, "sec-ch-ua": "a".repeat(15000),
    });
    assert.equal(bounded.status, 200); // ignored metadata, still within total16KiB
    for (const hints of Object.keys(chromeClientHints)) {
      const large = await raw(url + base + "/context", "GET", "", {
        ...chromeClientHints, [hints]: "a".repeat(16500),
      });
      assert.equal(large.status, 413);
      assert.ok(record(large.body)); assert.equal(large.body.code, "REQUEST_TOO_LARGE");
      assert.equal(large.body.effect, "none");
      const duplicate = await raw(url + base + "/context", "GET", "", [
        "Host", "127.0.0.1", ...Object.entries(chromeClientHints).flat(),
        hints.toUpperCase(), "duplicate",
      ]);
      assert.equal(duplicate.status, 400);
      assert.ok(record(duplicate.body)); assert.equal(duplicate.body.code, "INVALID_REQUEST");
    }
    for (const name of ["sec-ch-ua-full-version-list", "sec-ch-unknown", "sec-other", "x-application-actor", "cookie"]) {
      const rejected = await raw(url + base + "/context", "GET", "", { ...chromeClientHints, [name]: "unsupported" });
      assert.equal(rejected.status, 400);
      assert.ok(record(rejected.body)); assert.equal(rejected.body.effect, "none");
    }
    const p = await f.runtime.authenticate({ authorization: null });
    const v = await f.runtime.stageArrivalValidate(p, selected, clean);
    for (const [endpoint, input] of [["validations", clean], ["commands", commitInput(v)]] as const) {
      const payload = JSON.stringify(input);
      const rejected = await raw(url + base + "/" + endpoint, "POST", payload, {
        ...chromeClientHints, "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload), "x-application-actor": "unsupported",
      });
      assert.equal(rejected.status, 400);
      assert.ok(record(rejected.body)); assert.equal(rejected.body.code, "INVALID_REQUEST");
      assert.equal(rejected.body.effect, "none");
    }
    const deniedOrigin = await raw(url + base + "/context", "GET", "", {
      ...chromeClientHints, Origin: "http://localhost:9999",
    });
    assert.equal(deniedOrigin.status, 403);
    const invalidMedia = await raw(url + base + "/validations", "POST", "{}", {
      ...chromeClientHints, "Content-Type": "text/plain", "Content-Length": 2,
    });
    assert.equal(invalidMedia.status, 415);
    const largeBody = "a".repeat(8193);
    const rejectedBody = await raw(url + base + "/validations", "POST", largeBody, {
      ...chromeClientHints, "Content-Type": "application/json", "Content-Length": largeBody.length,
    });
    assert.equal(rejectedBody.status, 413);
    const duplicateJson = '{"lateReasonCode":null,"lateReasonCode":null,"lateRemark":null}';
    const rejectedJson = await raw(url + base + "/validations", "POST", duplicateJson, {
      ...chromeClientHints, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(duplicateJson),
    });
    assert.equal(rejectedJson.status, 400);
  }, { stageArrivalOrigins: [origin] });
  const state = f.store.inspectSnapshot();
  assert.equal(state.rows[0].attendance?.stageArrivalLocal, null);
  assert.equal(state.receipts, 0); assert.equal(state.audits, 0); assert.equal(state.active, 0);
});

test("ARR-HTTP strict body/query/IDs/method/media/duplicate decoded JSON; invalid never success-shaped", async () => {
  const f = await runtimeFixture();
  await serve(f.runtime, async url => {
    for (const path of [base + "/context?", base + "/context?x=1",
      base.replace("9001", "09001") + "/context", base.replace("6201", "%FF") + "/context"]) {
      const r = await fetch(url + path); assert.equal(r.status, 400);
      const p = await object(r); assert.equal(p.code, "INVALID_REQUEST"); assert.equal(p.effect, "none");
      assert.equal(p.dataSource, undefined); assert.equal(p.validationToken, undefined);
      assert.equal(p.nextAction, "correct-and-validate"); assert.equal(p.commandId, null);
    }
    for (const [path, allow] of [["context", "GET"], ["validations", "POST"], ["commands", "POST"]]) {
      const r = await fetch(url + base + "/" + path, { method: "PUT" });
      assert.equal(r.status, 405); assert.equal(r.headers.get("allow"), allow);
      assert.equal((await object(r)).code, "INVALID_REQUEST");
    }
    for (const input of [{ ...clean, timestamp: "2026-10-20T10:00:00" }, {}, null, late,
      { ...clean, lateReasonCode: 1 }, { ...clean, lateRemark: "<b>private</b>" }]) {
      const r = await post(url + base + "/validations", input);
      assert.equal(r.status, input === late ? 422 : 400); assert.equal((await object(r)).effect, "none");
    }
    for (const [payload, status] of [
      ['{"lateReasonCode":null,"lateReasonCode":null,"lateRemark":null}', 400],
      ['{"lateReasonCode":null,"\\u006cateReasonCode":null,"lateRemark":null}', 400],
      ["{", 400], ["x".repeat(8193), 413],
    ] as const) {
      const r = await raw(url + base + "/validations", "POST", payload, {
        "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
      assert.equal(r.status, status); assert.ok(record(r.body)); assert.equal(r.body.effect, "none");
    }
    assert.equal((await raw(url + base + "/context", "GET", "{}", { "Content-Length": 2 })).status, 400);
    for (const type of ["text/plain", "application/json; charset=latin1", "application/json; x=1"]) {
      const r = await raw(url + base + "/validations", "POST", "{}", { "Content-Type": type, "Content-Length": 2 });
      assert.equal(r.status, 415);
    }
    const compressed = await raw(url + base + "/validations", "POST", "{}", {
      "Content-Type": "application/json", "Content-Encoding": "gzip", "Content-Length": 2 });
    assert.equal(compressed.status, 415);
  });
  assert.equal(f.store.inspectSnapshot().receipts, 0); assert.equal(f.store.inspectSnapshot().audits, 0);
});

test("ARR-HTTP duplicate/unsupported headers, 16KiB budget, exact origin allowlist no credential cookies", async () => {
  const f = await runtimeFixture();
  await serve(f.runtime, async url => {
    for (const headers of [
      ["Host", "127.0.0.1", "Accept", "*/*", "Accept", "application/json"],
      ["Host", "127.0.0.1", "X-Impersonate", "9001"],
      ["Host", "127.0.0.1", "Cookie", "not-supported"],
    ]) assert.equal((await raw(url + base + "/context", "GET", "", headers)).status, 400);
    const large = await raw(url + base + "/context", "GET", "", { Accept: "a".repeat(16500) });
    assert.equal(large.status, 413);
    const parserOverflow = await raw(url + base + "/context", "GET", "", { Accept: "a".repeat(33000) });
    assert.equal(parserOverflow.status, 413); assert.ok(record(parserOverflow.body));
    assert.equal(parserOverflow.body.code, "REQUEST_TOO_LARGE"); assert.equal(parserOverflow.body.effect, "none");
    assert.equal(parserOverflow.headers["cache-control"], "no-store");
    const denied = await fetch(url + base + "/context", { headers: { Origin: "http://localhost:4320" } });
    assert.equal(denied.status, 403);
  });
  await serve(f.runtime, async url => {
    const allowed = await fetch(url + base + "/context", { headers: { Origin: "http://localhost:4320" } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:4320");
    assert.equal(allowed.headers.get("access-control-allow-credentials"), null);
  }, { stageArrivalOrigins: ["http://localhost:4320"] });
  assert.throws(() => createLoopbackServer(f.runtime, { stageArrivalOrigins: ["*"] }));
});

test("ARR-HTTP disabled mode preserves seven and denies known routes before fixture ports", async () => {
  const rt = await createRuntime({ ...sampleStageArrivalConfig, attendanceStageArrivalMode: "disabled" }, new FixtureReader([]));
  await serve(rt, async url => {
    for (const endpoint of ["context", "validations", "commands"]) {
      const r = endpoint === "context" ? await fetch(url + base + "/" + endpoint) :
        await post(url + base + "/" + endpoint, endpoint === "commands" ? commitInput({
          ...selected, state: "ready", evaluatedAt: "", evaluatedLocal: "", expiresAt: "", businessTimeZone: "",
          fingerprint: "a".repeat(64), validationToken: "a".repeat(43), warnings: [], confirmationRequired: false,
          dataSource: "isolated-fixture" }) : clean);
      assert.equal(r.status, 403); const p = await object(r);
      assert.equal(p.code, "LIVE_WRITES_DISABLED"); assert.equal(p.effect, "none");
    }
    const id = await object(await fetch(url + "/api/v1/identity"));
    assert.ok(record(id.principal) && Array.isArray(id.principal.capabilities));
    assert.equal(id.principal.capabilities.length, 7);
  });
});

test("ARR-HTTP source-honest UNKNOWN for post-install loss; read after UNKNOWN does not lie or invent receipt API", async () => {
  const f = await runtimeFixture(); let attempts = 0;
  const rt: SliceRuntime = { ...f.runtime, stageArrivalCommit: async (...args) => {
    attempts++; await f.runtime.stageArrivalCommit(...args);
    throw new StageArrivalError("COMMAND_OUTCOME_UNKNOWN");
  } };
  await serve(rt, async url => {
    const v = validation(await (await post(url + base + "/validations", clean)).json());
    const r = await post(url + base + "/commands", commitInput(v)); assert.equal(r.status, 503);
    const p = await object(r);
    assert.equal(p.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(p.effect, "unknown"); assert.equal(p.nextAction, "reconcile");
    assert.equal(p.commandId, commitInput(v).commandId); assert.equal(attempts, 1);
    assert.equal(p.outcome, undefined); assert.equal(p.recorded, undefined);
    const context = await object(await fetch(url + base + "/context")); assert.equal(context.eligibility, "already-recorded");
    assert.equal((await fetch(url + base + "/receipts")).status, 400);
    assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
  });
});

test("ARR-HTTP malformed/wrong-source or after-effect timeout cannot be success or ordinary retryable503", async () => {
  for (const failure of ["wrong-source", "shape", "timeout", "throw"] as const) {
    const f = await runtimeFixture();
    const rt: SliceRuntime = { ...f.runtime, stageArrivalCommit: async (...args) => {
      const r = await f.runtime.stageArrivalCommit(...args);
      if (failure === "timeout") throw new SliceError("DEPENDENCY_TIMEOUT");
      if (failure === "throw") throw new Error("do not log this business payload");
      // Simulate damaged integration boundary without casting unknown as DTO.
      const broken = { ...r }; if (failure === "shape") Reflect.deleteProperty(broken, "recorded");
      else Reflect.set(broken, "dataSource", "oracle");
      return broken;
    } };
    await serve(rt, async url => {
      const v = validation(await (await post(url + base + "/validations", clean)).json());
      const r = await post(url + base + "/commands", commitInput(v));
      assert.equal(r.status, 503); const p = await object(r);
      assert.equal(p.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(p.effect, "unknown");
      assert.equal(JSON.stringify(p).includes("payload"), false);
      assert.equal(f.store.inspectSnapshot().receipts, 1);
    });
  }
});

test("ARR-HTTP generic404 and authentication/capability errors never fabricate Administrator/success", async () => {
  const f = await runtimeFixture();
  await serve(f.runtime, async url => {
    for (const ids of [["9002", "6201"], ["9001", "6202"]]) {
      const r = await fetch(url + base.replace("9001", ids[0]).replace("6201", ids[1]) + "/context");
      assert.equal(r.status, 404); assert.equal((await object(r)).code, "SHIFT_DAY_NOT_FOUND");
    }
  });
  for (const [error, status] of [[new SliceError("UNAUTHENTICATED"), 401], [new Error("private"), 500]] as const) {
    await serve({ ...f.runtime, authenticate: async () => { throw error; } }, async url => {
      const r = await fetch(url + base + "/context"); assert.equal(r.status, status);
      assert.equal((await object(r)).effect, "none");
    });
  }
  const p = await f.runtime.authenticate({ authorization: null });
  await serve({ ...f.runtime, authenticate: async () => ({ ...p, provider: "real", synthetic: false,
    capabilities: ["attendance:read"] }) }, async url => {
    assert.equal((await fetch(url + base + "/context")).status, 403);
  });
  assert.equal(f.store.inspectSnapshot().receipts, 0);
});

test("ARR-HTTP executable reuses environment seam, explicit single F1 source, default mode unchanged", async () => {
  const env = { SHF_FIXTURE_CONFIG: JSON.stringify(sampleStageArrivalConfig), SHF_FIXTURE_PORT: "0",
    SHF_STAGE_ARRIVAL_FIXTURE: JSON.stringify([sampleStageArrivalFacts]) };
  const server = await startFromEnvironment(env, new VirtualClock());
  try {
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const id = await object(await fetch(`http://127.0.0.1:${a.port}/api/v1/identity`));
    assert.ok(record(id.principal) && Array.isArray(id.principal.capabilities));
    assert.equal(id.principal.capabilities.length, 9); assert.equal(id.dataSource, "isolated-fixture");
  } finally { await stopBackendServer(server); }
  for (const patch of [{ SHF_FIXTURE_ROWS: "[]" }, { SHF_STAGE_ARRIVAL_FIXTURE: undefined },
    { SHF_ATTENDANCE_FIXTURE: "{}" }, { SHF_CURRENT_SHIFTS_FIXTURE: "{}" }])
    await assert.rejects(startFromEnvironment({ ...env, ...patch }));
  for (const patch of [{ deploymentClass: "production" }, { dataSource: "oracle-read-only", oracleTestScopeConfirmed: true },
    { syntheticAdministratorEnabled: false }, { attendanceStageArrivalMode: "native" }])
    await assert.rejects(startFromEnvironment({ ...env, SHF_FIXTURE_CONFIG: JSON.stringify({ ...sampleStageArrivalConfig, ...patch }) }));
});

test("ARR-HTTP virtual deadline before UoW proves none, no late body/effect after provider resolves", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = await runtimeFixture();
  let entered!: () => void, release!: () => void, finished!: () => void;
  const arrived = new Promise<void>(r => { entered = r; });
  const gate = new Promise<void>(r => { release = r; });
  const done = new Promise<void>(r => { finished = r; });
  await serve({ ...f.runtime, authenticate: async (...args) => {
    entered(); await gate; const p = await f.runtime.authenticate(...args); finished(); return p;
  } }, async url => {
    const pending = raw(url + base + "/context", "GET");
    await arrived; t.mock.timers.tick(5000);
    const r = await pending; assert.equal(r.status, 503);
    assert.ok(record(r.body)); assert.equal(r.body.code, "DEPENDENCY_TIMEOUT"); assert.equal(r.body.effect, "none");
    release(); await done;
    assert.equal(f.store.inspectSnapshot().receipts, 0); assert.equal(f.store.inspectSnapshot().audits, 0);
  });
});

test("ARR-HTTP virtual timeout after effect is UNKNOWN and late receipt never sent/automatically retried", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = await runtimeFixture(), p = await f.runtime.authenticate({ authorization: null });
  const v = await f.runtime.stageArrivalValidate(p, selected, clean);
  let installed!: () => void, release!: () => void, finished!: () => void, calls = 0;
  const ready = new Promise<void>(r => { installed = r; });
  const gate = new Promise<void>(r => { release = r; });
  const done = new Promise<void>(r => { finished = r; });
  await serve({ ...f.runtime, stageArrivalCommit: async (...args) => {
    calls++; const receipt = await f.runtime.stageArrivalCommit(...args); installed();
    await gate; finished(); return receipt;
  } }, async url => {
    const payload = JSON.stringify(commitInput(v));
    const pending = raw(url + base + "/commands", "POST", payload,
      { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
    await ready; t.mock.timers.tick(5000);
    const r = await pending; assert.equal(r.status, 503); assert.ok(record(r.body));
    assert.equal(r.body.code, "COMMAND_OUTCOME_UNKNOWN"); assert.equal(r.body.effect, "unknown");
    assert.equal(r.body.nextAction, "reconcile");
    release(); await done;
    assert.equal(calls, 1); assert.equal(f.store.inspectSnapshot().receipts, 1);
    assert.equal(f.store.inspectSnapshot().audits, 1); assert.equal(f.store.inspectSnapshot().active, 0);
  });
});

test("ARR-HTTP actual socket loss after sent command leaves one effect; never proves cancellation/zero", async () => {
  const f = await runtimeFixture(), p = await f.runtime.authenticate({ authorization: null });
  const v = await f.runtime.stageArrivalValidate(p, selected, clean);
  let installed!: () => void, release!: () => void, finished!: () => void;
  const ready = new Promise<void>(r => { installed = r; });
  const gate = new Promise<void>(r => { release = r; });
  const done = new Promise<void>(r => { finished = r; });
  await serve({ ...f.runtime, stageArrivalCommit: async (...args) => {
    const receipt = await f.runtime.stageArrivalCommit(...args); installed(); await gate; finished(); return receipt;
  } }, async url => {
    const payload = JSON.stringify(commitInput(v));
    const req = request(url + base + "/commands", { method: "POST", headers: {
      "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } });
    const lost = new Promise<void>(resolve => { req.once("error", () => resolve()); });
    req.end(payload); await ready; req.destroy(new Error("isolated transport loss"));
    await lost; release(); await done;
    assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
    const context = await object(await fetch(url + base + "/context"));
    assert.equal(context.eligibility, "already-recorded");
    assert.equal(context.dataSource, "isolated-fixture");
  });
});

test("ARR-HTTP F1 bootstrap/context/validate/command with Oracle imports prohibited by module hook", () => {
  const script = `
    import { registerHooks } from "node:module";
    registerHooks({ resolve(specifier, context, next) {
      if (specifier.includes("oracledb") || /oracle-[^/]*\\.mts$/.test(specifier))
        throw Error("Oracle import prohibited in F1");
      return next(specifier, context);
    } });
    const { sampleStageArrivalConfig, sampleStageArrivalFacts } = await import("./stage-arrival-sample.mts");
    const { startFromEnvironment, stopBackendServer } = await import("./server.mts");
    const server = await startFromEnvironment({
      SHF_FIXTURE_CONFIG: JSON.stringify(sampleStageArrivalConfig), SHF_FIXTURE_PORT: "0",
      SHF_STAGE_ARRIVAL_FIXTURE: JSON.stringify([sampleStageArrivalFacts])
    }, { now: () => new Date("2026-10-20T07:22:00.000Z") });
    try {
      const a = server.address(); const url = "http://127.0.0.1:" + a.port +
        "/api/v1/employees/9001/shift-days/6201/stage-arrival";
      const context = await fetch(url + "/context"); if (context.status !== 200) throw Error("context");
      const headers = { "Content-Type": "application/json" };
      const draft = { lateReasonCode: null, lateRemark: null };
      const r = await fetch(url + "/validations", { method: "POST", headers, body: JSON.stringify(draft) });
      if (r.status !== 200) throw Error("validation"); const v = await r.json();
      const command = { commandId: "11111111-1111-4111-8111-111111111111", draft,
        fingerprint: v.fingerprint, validationToken: v.validationToken,
        confirmation: null };
      const result = await fetch(url + "/commands", { method: "POST", headers, body: JSON.stringify(command) });
      if (result.status !== 200) throw Error("command");
      const receipt = await result.json();
      if (receipt.dataSource !== "isolated-fixture" || receipt.partnerCompletion !== "not-invoked") throw Error("source");
      console.log("F1-no-Oracle");
    } finally { await stopBackendServer(server); }
  `;
  // The production executable defaults to systemClock. This child uses the
  // same approved clock-injection seam as other isolated fixture checks.
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /F1-no-Oracle/);
});

test("ARR-HTTP later pipelined parser failure never sends false none ahead of an installed command", async () => {
  const f = await runtimeFixture(), p = await f.runtime.authenticate({ authorization: null });
  const v = await f.runtime.stageArrivalValidate(p, selected, clean);
  let installed!: () => void, release!: () => void, finished!: () => void;
  const ready = new Promise<void>(r => { installed = r; });
  const gate = new Promise<void>(r => { release = r; });
  const done = new Promise<void>(r => { finished = r; });
  await serve({ ...f.runtime, stageArrivalCommit: async (...args) => {
    const receipt = await f.runtime.stageArrivalCommit(...args); installed(); await gate; finished(); return receipt;
  } }, async url => {
    const port = Number(new URL(url).port), socket = createConnection({ host: "127.0.0.1", port });
    const chunks: Buffer[] = []; socket.on("data", chunk => chunks.push(chunk));
    socket.on("error", () => { /* isolated socket loss is UNKNOWN, not a success */ });
    const closed = new Promise<void>(resolve => { socket.once("close", () => resolve()); });
    await once(socket, "connect");
    try {
      const body = JSON.stringify(commitInput(v));
      socket.write(`POST ${base}/commands HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
      await ready;
      socket.write(`GET ${base}/context HTTP/1.1\r\nHost: 127.0.0.1\r\nAccept: ${"a".repeat(33000)}\r\n\r\n`);
      await closed;
      assert.equal(Buffer.concat(chunks).length, 0); // no false typed none response for the first command
      release(); await done;
      assert.equal(f.store.inspectSnapshot().receipts, 1); assert.equal(f.store.inspectSnapshot().audits, 1);
    } finally { release(); socket.destroy(); }
  });
});
