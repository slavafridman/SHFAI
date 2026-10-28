import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { nativeBinding, nativeEndpointProof, resolveNativeEndpointProof, parseNativeIdentity, nativeIdentityBindingReference } from "../native-stage-arrival-config.mts";
import { nativeIdentity } from "../oracle-stage-arrival-snapshot.mts";
import type { NativeQuery } from "../oracle-stage-arrival-snapshot.mts";
import { NativeOracleDouble, nativeConfig, nativeSelection, cleanNative } from "./native-stage-arrival-double.mts";
import { startFromEnvironment, stopBackendServer } from "../server.mts";
import { OracleStageArrivalApplication } from "../oracle-stage-arrival-application.mts";
import { OracleStageArrivalUow } from "../oracle-stage-arrival-uow.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { StageArrivalError } from "../stage-arrival-errors.mts";
import { nativeCommand } from "../native-stage-arrival-validation.mts";
import { record } from "../contract-validation.mts";

const mapping = () => ({
  kind: "configured-address-sets", revision: "synthetic-proof-r1",
  connectionAliases: ["CTIDBT_WFMT", "CTIDBT_WFMT.WORLD"],
  endpoint: { kind: "dns", name: "endpoint.synthetic.test", addresses: ["192.0.2.10", "2001:db8::10"] },
  serverHosts: [{ kind: "dns", name: "node.synthetic.test", addresses: ["2001:0DB8:0:0:0:0:0:10", "192.0.2.10"] }],
});
test("ID-ENDPOINT configured Oracle Net underscore spelling is exact; SERVER_HOST remains strict", async () => {
  const p = mapping(); p.endpoint.name = "oracle_net.synthetic.test";
  const parsed = nativeEndpointProof(p);
  assert.equal(parsed.endpoint.name, "oracle_net.synthetic.test");
  assert.deepEqual(parsed.endpoint.addresses, ["192.0.2.10", "2001:db8::10"]);
  const names: string[] = [];
  const resolved = await resolveNativeEndpointProof({ ...p,
    endpoint: { kind: "dns", name: p.endpoint.name },
    serverHosts: [{ kind: "dns", name: p.serverHosts[0].name }] },
  async name => { names.push(name); return ["2001:db8::10", "192.0.2.10"]; });
  assert.deepEqual(names, ["oracle_net.synthetic.test", "node.synthetic.test"]);
  assert.deepEqual(parsed, resolved);
  p.serverHosts[0].name = "node_name.synthetic.test";
  assert.throws(() => nativeEndpointProof(p));
  await assert.rejects(resolveNativeEndpointProof({ ...p,
    endpoint: { kind: "dns", name: p.endpoint.name },
    serverHosts: [{ kind: "dns", name: p.serverHosts[0].name }] }, async () => ["192.0.2.10"]));
});
for (const name of ["_oracle.test", "oracle_.test", "oracle..test", ".oracle.test", "a".repeat(64) + ".test",
  "a.".repeat(128) + "test", " oracle_net.test", "oracle_net.test ", "oracle_\nnet.test",
  "*.oracle_net.test", "http://oracle_net.test", "oracle_net.test:1521", "oracle_net.test/path"])
  test(`ID-ENDPOINT malformed configured name ${JSON.stringify(name)} fails before resolver`, async () => {
    const p = mapping(); p.endpoint.name = name;
    assert.throws(() => nativeEndpointProof(p));
    let called = false;
    await assert.rejects(resolveNativeEndpointProof({ ...p, endpoint: { kind: "dns", name } },
      async () => { called = true; return ["192.0.2.10"]; }));
    assert.equal(called, false);
  });
for (const failure of ["empty", "overlap", "family", "ESERVFAIL", "timeout"] as const)
  test(`ID-ENDPOINT underscore syntax never bypasses ${failure} proof failure`, async () => {
    const p = mapping();
    const input = { ...p, endpoint: { kind: "dns", name: "oracle_net.synthetic.test" },
      serverHosts: [{ kind: "dns", name: "node.synthetic.test" }] };
    const controller = new AbortController();
    await assert.rejects(resolveNativeEndpointProof(input, async (name, signal) => {
      if (failure === "ESERVFAIL") throw Object.assign(Error("synthetic resolver"), { code: "ESERVFAIL" });
      if (failure === "timeout") {
        controller.abort();
        signal.throwIfAborted();
      }
      if (failure === "empty") return [];
      return name.startsWith("oracle_") ? ["192.0.2.10", "2001:db8::10"] :
        failure === "family" ? ["192.0.2.10"] : ["192.0.2.10", "2001:db8::11"];
    }, controller.signal));
  });
const sid = () => ({ database: "SYNTHETIC_DOCUMENTED_DB", user: "SYNTHETIC_READ", schema: "SYNTHETIC_READ",
  target: { kind: "sid", instanceSid: "synthetic_instance", endpointProof: mapping() } });
function query(observed: unknown, calls: string[]): NativeQuery {
  return async sql => {
    calls.push(sql);
    return sql.includes("nls_session_parameters") ? [{ calendar: "GREGORIAN" }] : [observed];
  };
}
test("ID-SID independent DB/INSTANCE/endpoint/account, unrelated service: passes without invented expectation", async () => {
  const d = new NativeOracleDouble(), calls: string[] = [];
  try {
    const b = nativeBinding({ ...d.binding, readIdentity: sid(),
      writeIdentity: { ...sid(), user: "SYNTHETIC_WRITE", schema: "SYNTHETIC_WRITE" } });
    await nativeIdentity(query({ database: "SYNTHETIC_DOCUMENTED_DB", instance: "synthetic_instance",
      host: "node.synthetic.test", service: "unrelated_observed_service", user: "SYNTHETIC_READ", schema: "SYNTHETIC_READ" }, calls), b.readIdentity);
    assert.ok(calls.some(sql => sql.includes("INSTANCE_NAME")));
    assert.equal(existsSync(d.binding.allowanceFile), false);
  } finally { d.dispose(); }
});
function observed() {
  return { database: "SYNTHETIC_DOCUMENTED_DB", instance: "synthetic_instance", host: "node.synthetic.test",
    service: "unrelated_observed_service", user: "SYNTHETIC_READ", schema: "SYNTHETIC_READ" };
}
function configure(d: NativeOracleDouble, revision = "synthetic-proof-r1") {
  const r = sid(); r.target.endpointProof.revision = revision;
  d.binding.readIdentity = parseNativeIdentity(r);
  d.binding.writeIdentity = parseNativeIdentity({ ...r, user: "SHIFTER", schema: "SHIFTER" });
  d.identityObservations = { read: observed(), write: { ...observed(), user: "SHIFTER", schema: "SHIFTER" } };
}
function command(v: unknown) {
  assert.ok(record(v));
  return nativeCommand({ commandId: "90000000-0000-4000-8000-000000000001", draft: cleanNative,
    confirmation: null, operationConfirmation: { accepted: true }, validationToken: v.validationToken, fingerprint: v.fingerprint });
}
function environment(d: NativeOracleDouble): NodeJS.ProcessEnv {
  return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(nativeConfig), SHF_ORACLE_PORT: "0",
    SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: d.binding.readIdentity.user,
    SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused-path",
    SHF_TEST_ORACLE_STAGE_WRITE_ENABLED: "true", SHF_STAGE_ARRIVAL_ORIGINS: '["http://localhost:4521"]',
    SHF_NATIVE_STAGE_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_NATIVE_STAGE_USER: d.binding.writeIdentity.user,
    SHF_NATIVE_STAGE_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_STAGE_CLIENT_LIB_DIR: "synthetic-unused-path",
    SHF_NATIVE_STAGE_BINDING: JSON.stringify(d.binding) };
}
const denied = (e: unknown) => e instanceof StageArrivalError && e.code === "LIVE_WRITES_DISABLED" && e.effect === "none";
for (const field of ["database", "instance", "host", "user", "schema"] as const)
  test(`ID-SID wrong ${field} denies, even with apparently matching service`, async () => {
    const d = new NativeOracleDouble(), calls: string[] = [];
    try {
      const b = nativeBinding({ ...d.binding, readIdentity: sid(), writeIdentity: sid() });
      await assert.rejects(nativeIdentity(query({ ...observed(), [field]: "synthetic_wrong", service: "synthetic_instance" }, calls),
        b.readIdentity), denied);
      assert.ok(!calls.some(sql => /FOR UPDATE|UPDATE |SHF_ATTENDANCE/.test(sql)));
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
test("ID-SERVICE explicit adaptation equals legacy; wrong exact host/service never falls back to INSTANCE", async () => {
  const d = new NativeOracleDouble();
  try {
    const legacy = d.binding.readIdentity;
    assert.ok("host" in legacy);
    const explicit = parseNativeIdentity({ database: legacy.database, user: legacy.user, schema: legacy.schema,
      target: { kind: "service-reference", host: legacy.host, serviceName: legacy.service } });
    const b = nativeBinding({ ...d.binding, readIdentity: explicit });
    await nativeIdentity(query(legacy, []), b.readIdentity);
    assert.equal(nativeIdentityBindingReference(b), nativeIdentityBindingReference(nativeBinding(d.binding)));
    for (const changed of [{ host: legacy.host.toUpperCase() }, { service: "wrong" }, { database: "wrong" },
      { user: "wrong" }, { schema: "wrong" }])
      await assert.rejects(nativeIdentity(query({ ...legacy, ...changed, instance: "synthetic_instance" }, []), explicit), denied);
  } finally { d.dispose(); }
});
for (const bad of ["both", "neither", "unknown-kind", "blank-db", "blank-sid", "wildcard-db", "wildcard-sid", "spaced-sid",
  "missing-db", "schema-case", "unknown-field", "mixed-flat"] as const)
  test(`ID-CONFIG rejects ${bad} without defaulting expected identifiers`, () => {
    const d = new NativeOracleDouble();
    try {
      const r = sid();
      const invalid = bad === "both" ? { ...r, target: { ...r.target, serviceName: "synthetic_instance" } } :
        bad === "neither" ? { database: r.database, user: r.user, schema: r.schema } :
        bad === "unknown-kind" ? { ...r, target: { ...r.target, kind: "auto" } } :
        bad === "blank-db" ? { ...r, database: "" } :
        bad === "blank-sid" ? { ...r, target: { ...r.target, instanceSid: "" } } :
        bad === "wildcard-db" ? { ...r, database: "*" } :
        bad === "wildcard-sid" ? { ...r, target: { ...r.target, instanceSid: "%" } } :
        bad === "spaced-sid" ? { ...r, target: { ...r.target, instanceSid: " synthetic_instance" } } :
        bad === "missing-db" ? { user: r.user, schema: r.schema, target: r.target } :
        bad === "schema-case" ? { ...r, schema: "synthetic_read" } :
        bad === "unknown-field" ? { ...r, learned: true } : { ...r, host: "node.synthetic.test", service: "reply" };
      assert.throws(() => nativeBinding({ ...d.binding, readIdentity: invalid, writeIdentity: invalid }));
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
for (const bad of ["empty", "different", "overlap", "unmapped", "duplicate-host", "wildcard-host", "invalid-address",
  "wrong-literal", "bad-alias", "many-hosts", "many-addresses", "blank-revision", "unknown-member"] as const)
  test(`ID-PROOF rejects ${bad}: no partial address-set or learned-alias acceptance`, () => {
    const d = new NativeOracleDouble(), r = sid(), p = r.target.endpointProof;
    try {
      if (bad === "empty") p.serverHosts[0].addresses = [];
      if (bad === "different") p.serverHosts[0].addresses = ["192.0.2.11", "2001:db8::11"];
      if (bad === "overlap") p.serverHosts[0].addresses = ["192.0.2.10"];
      if (bad === "duplicate-host") p.serverHosts.push({ ...p.serverHosts[0] });
      if (bad === "wildcard-host") p.serverHosts[0].name = "*.synthetic.test";
      if (bad === "invalid-address") p.serverHosts[0].addresses = ["192.0.2.999"];
      if (bad === "bad-alias") p.connectionAliases = ["LEARNED_ALIAS"];
      if (bad === "many-hosts") p.serverHosts = Array.from({ length: 17 }, (_, i) => ({ ...p.serverHosts[0], name: `node${i}.synthetic.test` }));
      if (bad === "many-addresses") p.endpoint.addresses = Array.from({ length: 17 }, (_, i) => `192.0.2.${i + 1}`);
      if (bad === "blank-revision") p.revision = " ";
      const proof = bad === "unmapped" ? { ...p, serverHosts: [] } :
        bad === "wrong-literal" ? { ...p, endpoint: { kind: "address", name: "192.0.2.99", addresses: p.endpoint.addresses } } :
        bad === "unknown-member" ? { ...p, skipHost: true } : p;
      const invalid = { ...r, target: { ...r.target, endpointProof: proof } };
      assert.throws(() => nativeBinding({ ...d.binding, readIdentity: invalid, writeIdentity: invalid }));
      assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
test("ID-PROOF exact declared alias membership only; normalized equal sets and explicit shortname work", async () => {
  const d = new NativeOracleDouble(), r = sid();
  try {
    r.target.endpointProof.serverHosts.push({ ...r.target.endpointProof.serverHosts[0], name: "node-short" });
    const b = nativeBinding({ ...d.binding, readIdentity: r, writeIdentity: r });
    for (const host of ["node.synthetic.test", "node-short"])
      await nativeIdentity(query({ ...observed(), host, service: null }, []), b.readIdentity);
    for (const host of ["node", "NODE-SHORT", "node-short.evil.test", "reverse.synthetic.test", "192.0.2.10"])
      await assert.rejects(nativeIdentity(query({ ...observed(), host }, []), b.readIdentity), denied);
    assert.ok("target" in b.readIdentity && b.readIdentity.target.kind === "sid");
    assert.ok(Object.isFrozen(b.readIdentity.target.endpointProof.serverHosts));
    assert.ok(Object.isFrozen(b.readIdentity.target.endpointProof.endpoint.addresses));
    r.target.endpointProof.serverHosts[0].addresses[0] = "192.0.2.99"; // Does not mutate frozen reference.
    await nativeIdentity(query(observed(), []), b.readIdentity);
  } finally { d.dispose(); }
});
test("ID-PROOF malformed sparse arrays from a configuration/resolver step are rejected, never coerced", () => {
  const d = new NativeOracleDouble();
  try {
    for (const field of ["addresses", "serverHosts", "connectionAliases"]) {
      const r = sid(), p = r.target.endpointProof;
      const proof = field === "addresses" ? { ...p, endpoint: { ...p.endpoint, addresses: new Array<unknown>(1) } } :
        { ...p, [field]: new Array<unknown>(1) };
      const invalid = { ...r, target: { ...r.target, endpointProof: proof } };
      assert.throws(() => nativeBinding({ ...d.binding, readIdentity: invalid, writeIdentity: invalid }));
    }
  } finally { d.dispose(); }
});
function proofNames() {
  const p = mapping();
  return { kind: p.kind, revision: p.revision, connectionAliases: p.connectionAliases,
    endpoint: { kind: p.endpoint.kind, name: p.endpoint.name },
    serverHosts: p.serverHosts.map(x => ({ kind: x.kind, name: x.name })) };
}
for (const failure of ["reject", "empty", "invalid", "overlap", "aborted", "timeout"] as const)
  test(`ID-DNS configuration resolver ${failure} denies sanitized, never learns DB names`, async () => {
    const called: string[] = [], controller = new AbortController();
    if (failure === "aborted") controller.abort();
    await assert.rejects(resolveNativeEndpointProof(proofNames(), async (name, signal) => {
      called.push(name);
      if (failure === "reject") throw Error("synthetic-private-resolver-error");
      if (failure === "empty") return [];
      if (failure === "invalid") return ["not-an-address"];
      if (failure === "timeout") return new Promise<readonly string[]>((_, reject) =>
        signal.addEventListener("abort", () => reject(Error("synthetic-cancelled")), { once: true }));
      return name === "endpoint.synthetic.test" ? ["192.0.2.10", "192.0.2.11"] : ["192.0.2.10"];
    }, controller.signal), e => e instanceof Error && e.message === "Native endpoint proof unavailable");
    assert.ok(called.every(name => ["endpoint.synthetic.test", "node.synthetic.test"].includes(name)));
    if (failure === "aborted") assert.equal(called.length, 0);
  });
test("ID-DNS literal endpoint proof uses no resolver and rejects family/set substitution", async () => {
  const p = proofNames();
  p.endpoint = { kind: "address", name: "192.0.2.10" };
  p.serverHosts = [{ kind: "address", name: "192.0.2.10" }];
  let calls = 0;
  const proof = await resolveNativeEndpointProof(p, async () => { calls++; throw Error("must not resolve literal"); });
  assert.equal(calls, 0); assert.deepEqual(proof.endpoint.addresses, ["192.0.2.10"]);
  const d = new NativeOracleDouble(), r = sid();
  try {
    const literal = { ...r, target: { ...r.target, endpointProof: proof } };
    const b = nativeBinding({ ...d.binding, readIdentity: literal, writeIdentity: literal });
    await nativeIdentity(query({ ...observed(), host: "192.0.2.10" }, []), b.readIdentity);
    const mismatched = { ...proof, serverHosts: [{ kind: "address", name: "::ffff:192.0.2.10",
      addresses: ["::ffff:192.0.2.10"] }] };
    assert.throws(() => nativeBinding({ ...d.binding, readIdentity: { ...r, target: { ...r.target, endpointProof: mismatched } } }));
  } finally { d.dispose(); }
});
test("ID-LITERAL equivalent IPv6 spellings identify the same explicitly declared literal, no DNS alias lookup", async () => {
  const d = new NativeOracleDouble(), r = sid();
  try {
    const proof = { ...mapping(),
      endpoint: { kind: "address", name: "2001:0DB8:0:0:0:0:0:10", addresses: ["2001:db8::10"] },
      serverHosts: [{ kind: "address", name: "2001:DB8::10", addresses: ["2001:0db8:0:0:0:0:0:10"] }] };
    const literal = { ...r, target: { ...r.target, endpointProof: proof } };
    const b = nativeBinding({ ...d.binding, readIdentity: literal, writeIdentity: literal });
    for (const host of ["2001:db8::10", "2001:0db8:0:0:0:0:0:10"])
      await nativeIdentity(query({ ...observed(), host }, []), b.readIdentity);
    for (const host of ["2001:db8::11", "2001:db8::10%zone", "node.synthetic.test"])
      await assert.rejects(nativeIdentity(query({ ...observed(), host }, []), b.readIdentity), denied);
  } finally { d.dispose(); }
});
for (const mismatch of ["kind", "database", "instance", "endpoint", "revision", "aliases"] as const)
  test(`ID-BIND mixed read/write ${mismatch} rejects before any pool lease`, () => {
    const d = new NativeOracleDouble(), r = sid();
    try {
      configure(d);
      const w = sid();
      if (mismatch === "database") w.database = "SYNTHETIC_OTHER_DB";
      if (mismatch === "instance") w.target.instanceSid = "other_instance";
      if (mismatch === "endpoint") w.target.endpointProof.endpoint.name = "other-endpoint.synthetic.test";
      if (mismatch === "revision") w.target.endpointProof.revision = "synthetic-proof-r2";
      if (mismatch === "aliases") w.target.endpointProof.connectionAliases = ["CTIDBT_WFMT"];
      const write = mismatch === "kind" ? { ...r, target: { kind: "service-reference", serviceName: "synthetic_instance",
        host: "node.synthetic.test" } } : w;
      assert.throws(() => new OracleStageArrivalUow(d.writePool, new OracleReadSession(d.readPool),
        { ...d.binding, writeIdentity: parseNativeIdentity(write) }));
      assert.equal(d.events.length, 0); assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
test("ID-UOW read and write accounts are independent; full SID command and separate readback pass", async () => {
  const d = new NativeOracleDouble();
  try {
    configure(d);
    const { app, principal, uow } = await d.application(), reference = uow.identityReference;
    const v = await app.validate(principal, nativeSelection, cleanNative);
    const r = await app.commit(principal, nativeSelection, command(v));
    assert.equal(r.outcome, "oracle-test-committed"); assert.equal(uow.identityReference, reference);
    assert.equal(d.binding.readIdentity.user, "SYNTHETIC_READ"); assert.equal(d.binding.writeIdentity.user, "SHIFTER");
    assert.equal(d.events.filter(e => e === "write:commit").length, 1);
    assert.ok(d.sql.filter(q => q.sql.includes("native:identity")).every(q => q.sql.includes("INSTANCE_NAME")));
  } finally { d.dispose(); }
});
for (const pool of ["read", "write"] as const)
  for (const field of ["database", "instance", "host", "user", "schema"] as const)
    test(`ID-UOW ${pool} wrong ${field}: identity fails before business/allowance`, async () => {
      const d = new NativeOracleDouble();
      try {
        configure(d);
        const uow = new OracleStageArrivalUow(d.writePool, new OracleReadSession(d.readPool), d.binding);
        if (pool === "read") await uow.initialize();
        d.identityObservations![pool][field] = "synthetic_wrong";
        const before = d.sql.length;
        await assert.rejects(pool === "write" ? uow.initialize() : uow.read(), denied);
        assert.ok(!d.sql.slice(before).some(q => /native:row:|native:metadata|native:lock|native:update/.test(q.sql)));
        assert.equal(existsSync(d.binding.allowanceFile), false);
      } finally { d.dispose(); }
    });
for (const field of ["database", "instance", "host", "user", "schema"] as const)
  test(`ID-COMMAND fresh writer ${field} mismatch denies before lock/UPDATE/COMMIT`, async () => {
    const d = new NativeOracleDouble();
    try {
      configure(d);
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      d.identityObservations!.write[field] = "synthetic_wrong";
      await assert.rejects(app.commit(principal, nativeSelection, command(v)), denied);
      assert.ok(!d.sql.some(q => /FOR UPDATE|native:update/.test(q.sql)));
      assert.equal(d.committed, false);
      // Existing single-attempt command fuse policy is unchanged: this was an
      // explicitly confirmed command attempt, not the identity-only diagnostic.
      assert.equal(existsSync(d.binding.allowanceFile), true);
    } finally { d.dispose(); }
  });
for (const field of ["database", "instance", "host", "user", "schema"] as const)
  test(`ID-READBACK post-COMMIT ${field} mismatch is UNKNOWN, no retry/success/rollback claim`, async () => {
    const d = new NativeOracleDouble();
    try {
      configure(d);
      const { app, principal } = await d.application(), v = await app.validate(principal, nativeSelection, cleanNative);
      d.hook = event => { if (event === "read:native:identity" && d.committed) d.identityObservations!.read[field] = "synthetic_wrong"; };
      await assert.rejects(app.commit(principal, nativeSelection, command(v)), { code: "COMMAND_OUTCOME_UNKNOWN", effect: "unknown" });
      assert.equal(d.committed, true); assert.equal(d.events.filter(e => e === "write:commit").length, 1);
      assert.equal(d.events.filter(e => e === "write:update").length, 1);
      assert.equal(existsSync(d.binding.allowanceFile), true);
    } finally { d.dispose(); }
  });
test("ID-TOKEN target/proof revision changes require a new application; old preparation is invalid", async () => {
  const d = new NativeOracleDouble();
  try {
    configure(d);
    const first = await d.application(), v = await first.app.validate(first.principal, nativeSelection, cleanNative);
    const firstRef = first.uow.identityReference;
    configure(d, "synthetic-proof-r2");
    const second = await d.application();
    assert.notEqual(second.uow.identityReference, firstRef);
    assert.throws(() => new OracleStageArrivalApplication(first.uow, d.binding, d.clock, "UTC", ["T001"]),
      /Native identity reference mismatch/);
    await assert.rejects(second.app.commit(second.principal, nativeSelection, command(v)), { code: "STALE_PREPARATION", effect: "none" });
    assert.equal(existsSync(d.binding.allowanceFile), false);
    assert.ok(!d.events.includes("write:update"));
  } finally { d.dispose(); }
});
test("ID-BOOT actual TEST entrypoint accepts SID proof with separate read/write account and ten capabilities", async () => {
  const d = new NativeOracleDouble(true);
  let server;
  try {
    configure(d);
    server = await startFromEnvironment(environment(d), undefined, { read: async () => d.readPool, native: async () => d.writePool });
    const a = server.address(); assert.ok(a && typeof a !== "string");
    const r = await fetch(`http://127.0.0.1:${a.port}/api/v1/identity`), p: unknown = await r.json();
    assert.equal(r.status, 200); assert.ok(record(p) && record(p.principal));
    assert.equal(p.dataSource, "oracle"); assert.equal(p.principal.employeeId, null);
    assert.ok(Array.isArray(p.principal.capabilities)); assert.equal(p.principal.capabilities.length, 10);
    assert.equal(existsSync(d.binding.allowanceFile), false);
    assert.ok(!d.sql.some(q => /FOR UPDATE|UPDATE |INSERT/.test(q.sql)));
  } finally { if (server) await stopBackendServer(server); d.dispose(); }
});
for (const invalid of ["missing-proof", "mixed-proof", "undeclared-read-alias", "undeclared-write-alias", "read-account"] as const)
  test(`ID-BOOT ${invalid} denies configuration before factory/allowance`, async () => {
    const d = new NativeOracleDouble(true);
    try {
      configure(d);
      const e = environment(d);
      if (invalid === "missing-proof") e.SHF_NATIVE_STAGE_BINDING = JSON.stringify({ ...d.binding,
        readIdentity: { ...sid(), target: { kind: "sid", instanceSid: "synthetic_instance" } } });
      if (invalid === "mixed-proof") e.SHF_NATIVE_STAGE_BINDING = JSON.stringify({ ...d.binding,
        writeIdentity: { ...sid(), target: { ...sid().target, instanceSid: "different" } } });
      if (invalid === "undeclared-read-alias" || invalid === "undeclared-write-alias") {
        const r = sid(); r.target.endpointProof.connectionAliases = [invalid === "undeclared-read-alias" ? "CTIDBT_WFMT.WORLD" : "CTIDBT_WFMT"];
        e.SHF_NATIVE_STAGE_BINDING = JSON.stringify({ ...d.binding, readIdentity: r,
          writeIdentity: { ...r, user: "SHIFTER", schema: "SHIFTER" } });
      }
      if (invalid === "read-account") e.SHF_ORACLE_USER = "SHIFTER";
      let factories = 0;
      await assert.rejects(startFromEnvironment(e, undefined, { read: async () => { factories++; return d.readPool; },
        native: async () => { factories++; return d.writePool; } }));
      assert.equal(factories, 0); assert.equal(existsSync(d.binding.allowanceFile), false);
    } finally { d.dispose(); }
  });
test("ID-SERVICE existing literal host/service packet remains unchanged", async () => {
  const d = new NativeOracleDouble();
  try {
    const b = nativeBinding(d.binding);
    assert.deepEqual(b.readIdentity, d.binding.readIdentity);
    await nativeIdentity(query(d.binding.readIdentity, []), b.readIdentity);
  } finally { d.dispose(); }
});
test("ID-DNS proof builder resolves only configured names via isolated DNS double", async () => {
  const called: string[] = [], p = mapping();
  const proof = await resolveNativeEndpointProof({
    kind: p.kind, revision: p.revision, connectionAliases: p.connectionAliases,
    endpoint: { kind: "dns", name: p.endpoint.name },
    serverHosts: p.serverHosts.map(x => ({ kind: x.kind, name: x.name })),
  }, async name => { called.push(name); return ["192.0.2.10", "2001:db8::10"]; });
  assert.deepEqual(called, ["endpoint.synthetic.test", "node.synthetic.test"]);
  assert.deepEqual(proof.endpoint.addresses, ["192.0.2.10", "2001:db8::10"]);
});
