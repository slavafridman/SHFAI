import { test } from "node:test";
import assert from "node:assert/strict";
import { isAbsolute } from "node:path";
import { loadDemoAssets, startOracleDemo } from "../oracle-demo-host.mts";
import { env, options, protocolDouble, raw } from "./oracle-demo-test-helper.mts";

// Explicit artifact suite, intentionally NOT *.test.mts. Never default to old output.
// Test-only process input; never consumed by application or public configuration.
test("demo actual compiled TEST browser plus source API host run with an explicitly isolated protocol double", async () => {
  const stage = process.env.SHF_TEST_ARTIFACT_STAGE;
  assert.ok(stage && isAbsolute(stage), "Explicit absolute current TEST artifact stage required");
  const oracle = protocolDouble();
  const demo = await startOracleDemo(env, options, {
    assets: () => loadDemoAssets(stage), read: async () => oracle.pool,
  });
  try {
    const page = await raw(demo.url, "/");
    assert.equal(page.status, 200); assert.match(page.body, /<html\b/i);
    const identity = await raw(demo.url, "/api/v1/identity", { "Sec-Fetch-Dest": "empty" });
    assert.equal(identity.status, 200); assert.match(identity.body, /"dataSource":"oracle"/);
    assert.match(identity.body, /synthetic:administrator/);
    assert.equal((await raw(demo.url, "/readyz")).status, 200);
  } finally { await demo.stop(); }
  assert.equal(oracle.closed, 1);
});
