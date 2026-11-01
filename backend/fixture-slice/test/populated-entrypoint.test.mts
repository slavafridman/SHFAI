import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { fullManagementSnapshot, fullItems } from "../populated-world.mts";
import { record } from "../contract-validation.mts";

const environment = (mode: string): NodeJS.ProcessEnv => ({
  SHF_FULL_MODE: mode, SHF_FULL_PROFILE: "test", SHF_FULL_DEPLOYMENT_CLASS: "isolated-test-demo",
  SHF_FULL_SYNTHETIC_ADMINISTRATOR: "true", SHF_FULL_PORT: "0",
  SHF_FULL_ORIGINS: '["http://localhost:4200"]', NODE_ENV: "test",
});
for (const mode of ["READONLY", "management", "cancellation"]) {
  test(`clean child CLI ${mode} starts all ports under driver tripwire, frozen demo only`, async () => {
    const child = spawn(process.execPath, ["--import", "./test/populated-driver-tripwire.mts", "populated-server.mts"],
      { env: environment(mode), stdio: ["ignore", "pipe", "pipe"] });
    let output = "", error = "";
    child.stderr.on("data", data => { error += String(data); });
    const closed = once(child, "close");
    const deadline = setTimeout(() => child.kill(), 10000);
    try {
      const line = await new Promise<string>((resolve, reject) => {
        child.stdout.on("data", data => {
          output += String(data);
          if (output.includes("\n")) resolve(output.split("\n")[0]);
        });
        child.once("error", reject);
        child.once("exit", () => reject(Error("CLI exited before readiness: " + error)));
      });
      const metadata: unknown = JSON.parse(line); assert.ok(record(metadata));
      assert.equal(metadata.mode, mode); assert.equal(metadata.syntheticOnly, true);
      assert.equal(metadata.clock, "frozen-demo"); assert.equal(metadata.clockInstant, "2026-11-01T12:00:00.123Z");
      assert.equal(metadata.inquiryProbes, 11); assert.equal(metadata.zone, "UTC");
      assert.equal(typeof metadata.port, "number"); assert.equal(error, "");
    } finally { clearTimeout(deadline); child.kill(); await closed; }
  });
}
test("CLI contaminated or missing ENV fails before listen with constant safe diagnostic", async () => {
  for (const env of [{}, { ...environment("READONLY"), SHF_ORACLE_CONFIG: "forbidden-synthetic-input" },
    { ...environment("management"), NODE_ENV: "production" }]) {
    const child = spawn(process.execPath, ["--import", "./test/populated-driver-tripwire.mts", "populated-server.mts"],
      { env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "", error = "";
    child.stdout.on("data", data => { output += String(data); });
    child.stderr.on("data", data => { error += String(data); });
    const [code] = await once(child, "close");
    assert.equal(code, 1); assert.equal(output, "");
    assert.equal(error.trim(), "Isolated FULL fixture startup rejected");
  }
});
test("synthetic JSON before-images retain single-representation Hebrew, civil seconds and decimal strings", () => {
  const physical = fullManagementSnapshot(true), items = fullItems();
  const encoded = JSON.stringify({ physical, items });
  assert.deepEqual(JSON.parse(encoded), { physical, items });
  assert.ok(encoded.isWellFormed()); assert.ok(encoded.includes("סינתטית"));
  assert.ok(!encoded.includes("×"));
  assert.equal(physical.days[0].attendance!.STAGE_ARRIVAL_TIME, "2026-11-01T11:00:01");
  assert.equal(physical.days[0].baseline.paidMinutes, "420");
  assert.equal(physical.days[1].baseline.endLocal, "2026-11-03T01:00:00");
  assert.equal(items[0].durationMinutes, "15"); assert.equal(items[1].durationMinutes, "5");
});
test("literal server runtime closure includes all four M02 modules and no test/runtime asset dependency", async () => {
  // Static compatibility with current Get-ShifterClosure rules, not an archive
  // build, Git enumeration, Docker operation or native runtime verification.
  const queue = ["server.mts"], seen = new Set<string>();
  const manifest: unknown = JSON.parse(await readFile("package.json", "utf8"));
  assert.ok(record(manifest) && record(manifest.dependencies));
  const dependencies = Object.keys(manifest.dependencies);
  const pattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;
  while (queue.length) {
    const name = queue.shift()!;
    if (seen.has(name)) continue;
    seen.add(name);
    assert.match(name, /^[a-z][a-z0-9-]*\.mts$/);
    assert.doesNotMatch(name, /live-check|test|sample/);
    const source = await readFile(name, "utf8");
    assert.doesNotMatch(source, /new\s+URL\s*\(\s*["'][^"']+["']\s*,\s*import\.meta\.url/);
    assert.doesNotMatch(source, /\bimport\s*\(\s*[^"'\s]/);
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith("./")) queue.push(specifier.slice(2));
      else assert.ok(specifier.startsWith("node:") || dependencies.includes(specifier), specifier);
    }
  }
  for (const name of ["populated-server.mts", "populated-config.mts", "populated-world.mts", "populated-readers.mts"])
    assert.ok(seen.has(name));
});
