import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, renameSync, linkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NativeCommandCoordinator, nativeEmployeeScope } from "../native-command-coordinator.mts";
import type { NativeCommandAdmissionV1 } from "../native-command-coordinator-contracts.mts";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { spawn } from "node:child_process";

export function provisionCoordinator() {
  const directory = mkdtempSync(join(tmpdir(), "shf50-synthetic-"));
  const targetScope = "synthetic-local-target", employeeId = "900001";
  const key = nativeEmployeeScope(targetScope, employeeId);
  const guard = join(directory, `employee-${key}.json`);
  const marker = join(directory, `employee-${key}.attempted`);
  const namespace = { version: "shf-native-command-coordinator-v1", canonicalDirectory: directory,
    targetScope, database: "SYNTHETIC", schema: "SHIFTER" };
  writeFileSync(join(directory, "namespace.json"), JSON.stringify(namespace));
  writeFileSync(guard, JSON.stringify({ version: namespace.version, targetScope, employeeScope: key, state: "ready" }));
  const create = () => new NativeCommandCoordinator({ directory, targetScope }, namespace);
  return { directory, employeeId, key, guard, marker, create,
    cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}
test("global competition retains both fences across operation/day/profile/restart with opaque binding", async () => {
  const f = provisionCoordinator();
  try {
    const first = f.create(), second = f.create();
    const binding = { employeeId: f.employeeId, operation: "stage-arrival" as const, commandId: "00000000-0000-4000-8000-000000000001" };
    await first.assertAvailable(f.employeeId);
    assert.throws(() => first.assertMutationAllowed({} as NativeCommandAdmissionV1, binding));
    const results = await Promise.allSettled([first.consume(binding),
      second.consume({ ...binding, operation: "station-arrival-late" })]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    const success = results[0]; assert.equal(success?.status, "fulfilled");
    if (success?.status !== "fulfilled") throw Error("missing handle");
    first.assertMutationAllowed(success.value, binding);
    assert.throws(() => second.assertMutationAllowed(success.value, binding));
    assert.throws(() => first.assertMutationAllowed(success.value, { ...binding, operation: "station-exit" }));
    await assert.rejects(f.create().assertAvailable(f.employeeId));
    assert.equal(JSON.parse(readFileSync(f.guard, "utf8")).state, "consumed");
    assert.ok(readFileSync(f.marker).length);
  } finally { f.cleanup(); }
});
test("missing, partial, foreign, linked and replaced records fail closed with zero provisioning", async () => {
  for (const fault of ["missing", "partial", "foreign", "linked", "replaced"] as const) {
    const f = provisionCoordinator();
    try {
      const c = f.create();
      if (fault === "missing") rmSync(f.guard);
      if (fault === "partial") writeFileSync(f.marker, "");
      if (fault === "foreign") writeFileSync(f.guard, "{}");
      if (fault === "linked") linkSync(f.guard, join(f.directory, "hardlink"));
      if (fault === "replaced") {
        renameSync(join(f.directory, "namespace.json"), join(f.directory, "old.json"));
        writeFileSync(join(f.directory, "namespace.json"), readFileSync(join(f.directory, "old.json")));
      }
      await assert.rejects(c.assertAvailable(f.employeeId));
      await assert.rejects(c.consume({ employeeId: f.employeeId, operation: "cancel", commandId: "00000000-0000-4000-8000-000000000002" }));
    } finally { f.cleanup(); }
  }
});
test("short marker write and fsync failure retain denial, never manufacture a power-loss proof", async () => {
  for (const fault of ["write", "fsync"] as const) {
    const f = provisionCoordinator(), c = f.create();
    const saved = { writeSync: fs.writeSync, fsyncSync: fs.fsyncSync };
    try {
      if (fault === "write") fs.writeSync = (() => 0) as typeof fs.writeSync;
      else fs.fsyncSync = () => { throw Error("Isolated fsync uncertainty"); };
      syncBuiltinESMExports();
      await assert.rejects(c.consume({ employeeId: f.employeeId, operation: "station-arrival-late",
        commandId: "00000000-0000-4000-8000-000000000003" }), { code: "LIVE_WRITES_DISABLED" });
    } finally { Object.assign(fs, saved); syncBuiltinESMExports(); }
    try {
      await assert.rejects(f.create().assertAvailable(f.employeeId), { code: "LIVE_WRITES_DISABLED" });
      assert.equal(JSON.parse(readFileSync(f.guard, "utf8")).state, "ready");
      assert.ok(fs.existsSync(f.marker)); // Even zero-length acquisition is retained.
    } finally { f.cleanup(); }
  }
});
test("two actual isolated Node processes compete across kinds; exactly one retained global admission", async () => {
  const f = provisionCoordinator();
  try {
    const moduleUrl = new URL("../native-command-coordinator.mts", import.meta.url).href;
    const code = `import { NativeCommandCoordinator } from ${JSON.stringify(moduleUrl)};
      const c = new NativeCommandCoordinator(${JSON.stringify({ directory: f.directory, targetScope: "synthetic-local-target" })},
        { database: "SYNTHETIC", schema: "SHIFTER" });
      try { await c.consume({ employeeId: ${JSON.stringify(f.employeeId)}, operation: process.argv[1],
        commandId: "00000000-0000-4000-8000-000000000004" }); console.log("admitted"); }
      catch { console.log("denied"); }`;
    const run = (operation: string) => new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", code, operation],
        { env: { SystemRoot: process.env.SystemRoot }, stdio: ["ignore", "pipe", "pipe"] });
      let output = ""; child.stdout.on("data", b => { output += b.toString(); });
      child.once("error", reject); child.once("exit", status => {
        if (status !== 0) reject(Error("Isolated coordinator child failed")); else resolve(output.trim());
      });
    });
    assert.deepEqual((await Promise.all([run("stage-arrival"), run("csv-create")])).sort(), ["admitted", "denied"]);
    for (const operation of ["station-arrival", "station-arrival-late", "station-exit", "change", "cancel"])
      assert.equal(await run(operation), "denied");
    assert.equal(JSON.parse(readFileSync(f.guard, "utf8")).state, "consumed");
    assert.ok(readFileSync(f.marker).length);
  } finally { f.cleanup(); }
});
test("same coordinator denial is not an auth/storage fallback and cannot invalidate its already-owned winning handle", async () => {
  const f = provisionCoordinator();
  try {
    const c = f.create(), binding = { employeeId: f.employeeId, operation: "station-arrival-late" as const,
      commandId: "00000000-0000-4000-8000-000000000005" };
    const handle = await c.consume(binding);
    await assert.rejects(c.consume({ ...binding, operation: "station-arrival" }));
    c.assertMutationAllowed(handle, binding);
    renameSync(f.marker, join(f.directory, "retained-marker"));
    assert.throws(() => c.assertMutationAllowed(handle, binding));
    renameSync(join(f.directory, "retained-marker"), f.marker);
    assert.throws(() => c.assertMutationAllowed(handle, binding)); // Observed loss remains quarantined.
  } finally { f.cleanup(); }
});
test("operator-formatted ready guard consumes its existing inode without trailing-byte corruption", async () => {
  const f = provisionCoordinator();
  try {
    const content = JSON.parse(readFileSync(f.guard, "utf8"));
    writeFileSync(f.guard, JSON.stringify(content, null, 2) + "\n");
    const c = f.create(), binding = { employeeId: f.employeeId, operation: "station-exit" as const,
      commandId: "00000000-0000-4000-8000-000000000006" };
    const handle = await c.consume(binding);
    c.assertMutationAllowed(handle, binding);
    assert.equal(JSON.parse(readFileSync(f.guard, "utf8")).state, "consumed");
  } finally { f.cleanup(); }
});
