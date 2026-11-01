// M02 executable / programmatic isolated environment. No native factory seam.
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { createRuntime } from "./synthetic-identity.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { fullConfiguration, fullOptionsFromEnvironment, fixtureEpoch } from "./populated-config.mts";
import type { FullTestMode, FullTestOptions } from "./populated-config.mts";
import { fullManagementSnapshot, fullItems, frozenFixtureClock, cancellationInquiryMetadata, fullInquiryPaths } from "./populated-world.mts";
import { fullReadPorts, managementInquirySnapshot, cancellationInquirySnapshot } from "./populated-readers.mts";
import { createIsolatedShiftManagement } from "./shift-management-fixture.mts";
import type { CancellationFixtureManifestV1 } from "./station-exit-cancellation-private-contracts.mts";
import { record } from "./contract-validation.mts";
import { shiftManagementActorCapabilities } from "./shift-management-capabilities.mts";

export async function createFullTestWorld(mode: FullTestMode, scenario: CancellationFixtureManifestV1["scenarioId"] = "ready") {
  if (!["READONLY", "management", "cancellation"].includes(mode)) throw Error("Explicit FULL mode required");
  if (mode !== "cancellation" && scenario !== "ready") throw Error("Scenarios belong only to the cancellation world");
  const clock = frozenFixtureClock();
  if (mode === "management") {
    const management = createIsolatedShiftManagement(fullManagementSnapshot(true), clock, "UTC");
    return { ...fullReadPorts(() => managementInquirySnapshot(management.inspect().snapshot), fullItems()),
      clock, management, cancellation: undefined };
  }
  if (mode === "cancellation") {
    // Do not pull Oracle-named historical field inventories into READONLY/F1
    // module closures. This literal fixture import is branch-local only.
    const { createCancellationFixture, cancellationManifest } = await import("./station-exit-cancellation-fixture.mts");
    const manifest = cancellationManifest(JSON.stringify({ version: "shf-station-exit-cancellation-fixture-v1",
      scenarioId: scenario, clockInstant: fixtureEpoch }));
    const cancellation = createCancellationFixture(manifest, "UTC", "T001", ["T001"]);
    const inquiryMetadata = cancellationInquiryMetadata();
    return { ...fullReadPorts(() => cancellationInquirySnapshot(cancellation.store.read(), inquiryMetadata), []),
      clock: cancellation.clock, management: undefined, cancellation };
  }
  const initial = fullManagementSnapshot(false);
  return { ...fullReadPorts(() => managementInquirySnapshot(structuredClone(initial)), fullItems()),
    clock, management: undefined, cancellation: undefined };
}
export async function startFullTestEnvironment(mode: FullTestMode, options: FullTestOptions) {
  // Entire isolation preflight occurs before fixtures, provider, server or listening.
  const selected = fullConfiguration(mode, options);
  const world = await createFullTestWorld(selected.mode);
  const runtime = await createRuntime(selected.config, world.detail, undefined, {
    ...world.options, clock: world.clock, shiftManagement: world.management?.app, cancellation: world.cancellation?.app,
  });
  const server = createLoopbackServer(runtime, {
    shiftManagementOrigins: selected.mode === "management" ? selected.origins : undefined,
    stationExitCancellationOrigins: selected.mode === "cancellation" ? selected.origins : undefined,
  });
  try {
    const listening = once(server, "listening");
    server.listen(selected.port, "127.0.0.1"); await listening;
  } catch (error) { server.close(); throw error; }
  const address = server.address();
  if (!address || typeof address === "string") throw Error("Loopback fixture address unavailable");
  return { server, runtime, world, mode: selected.mode, url: `http://127.0.0.1:${address.port}`,
    metadata: { syntheticOnly: true, clock: "frozen-demo", clockInstant: fixtureEpoch, zone: "UTC" } };
}
export async function checkFullTestReadiness(started: Pick<Awaited<ReturnType<typeof startFullTestEnvironment>>, "mode" | "url">,
  expectedMode: FullTestMode, callerSignal?: AbortSignal) {
  // One total deadline, including identity and every inquiry body. An owned
  // caller can shorten/cancel it, but cannot extend the healthcheck budget.
  const deadline = AbortSignal.timeout(1000);
  const signal = callerSignal ? AbortSignal.any([deadline, callerSignal]) : deadline;
  signal.throwIfAborted();
  if (started.mode !== expectedMode) throw Error("FULL fixture readiness mode mismatch");
  const r7 = ["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read",
    "shift-items:read", "employee:read", "attendance:read"];
  const capabilities = expectedMode === "management" ? [...shiftManagementActorCapabilities] :
    expectedMode === "cancellation" ? [...r7, "attendance-station-exit-cancellation:prepare",
      "attendance-station-exit-cancellation:commit"] : r7;
  const identityResponse = await fetch(started.url + "/api/v1/identity", { signal });
  const identity: unknown = await identityResponse.json();
  signal.throwIfAborted();
  if (identityResponse.status !== 200 || !record(identity) || !record(identity.principal) ||
      identity.dataSource !== "isolated-fixture" ||
      identity.principal.synthetic !== true || identity.principal.provider !== "synthetic" ||
      identity.principal.subject !== "synthetic:administrator" || identity.principal.employeeId !== null ||
      JSON.stringify(identity.principal.roles) !== '["Administrator"]' ||
      JSON.stringify(identity.principal.capabilities) !== JSON.stringify(capabilities) ||
      JSON.stringify(identity.principal.resourceScope) !== JSON.stringify({ orgUnitIds: ["T001"] }))
    throw Error("FULL fixture readiness identity mismatch");
  const probes: Array<{ path: string; status: number }> = [];
  for (const [index, path] of fullInquiryPaths(expectedMode).entries()) {
    const response = await fetch(started.url + path, { signal }), text = await response.text();
    signal.throwIfAborted();
    const employee = expectedMode === "cancellation" ? "9001" : "1", day = expectedMode === "cancellation" ? "6201" : "19001";
    if (response.status !== 200 || !text.includes('"dataSource":"isolated-fixture"') ||
        response.headers.get("cache-control") !== "no-store" ||
        response.headers.get("x-content-type-options") !== "nosniff" ||
        index < 7 && (!text.includes(`"employeeId":"${employee}"`) || !text.includes("T001") ||
          index !== 5 && !text.includes(`"shiftDayId":"${day}"`)) ||
        index >= 7 && !text.includes(index === 7 ? "M001" : "T001") ||
        text.includes('"code":"T002"') || text.includes('"code":"T003"') || text.includes('"code":"M002"'))
      throw Error(`FULL fixture readiness inquiry unavailable: ${path}`);
    probes.push({ path, status: response.status });
  }
  return { mode: expectedMode, syntheticOnly: true, clock: "frozen-demo", probes };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const selected = fullOptionsFromEnvironment(process.env);
    const started = await startFullTestEnvironment(selected.mode as FullTestMode, selected.options);
    try {
      const readiness = await checkFullTestReadiness(started, started.mode);
      const address = started.server.address();
      console.log(JSON.stringify({ mode: started.mode, ...started.metadata,
        port: address && typeof address !== "string" ? address.port : null, inquiryProbes: readiness.probes.length }));
    } catch (error) { started.server.close(); started.server.closeAllConnections(); throw error; }
    for (const signal of ["SIGINT", "SIGTERM"] as const)
      process.once(signal, () => { started.server.close(); started.server.closeIdleConnections(); });
  } catch {
    console.error("Isolated FULL fixture startup rejected");
    process.exitCode = 1;
  }
}
