import { pathToFileURL } from "node:url";
import { createRuntime } from "./synthetic-identity.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { createLoopbackServer } from "./http-adapter.mts";
import { validateConfig } from "./contract-validation.mts";
import type { RawShiftDay } from "./contracts.mts";

// No defaults: executable requires explicit isolated config, rows and port.
// Environment JSON is synthetic-only; this executable has no credential/provider input.
export async function startFromEnvironment(environment: NodeJS.ProcessEnv) {
  const config = validateConfig(JSON.parse(environment.SHF_FIXTURE_CONFIG ?? "null"));
  if (config.deploymentClass === "production" || config.authenticationMode !== "synthetic")
    throw new Error("Executable fixture server requires explicit isolated synthetic mode");
  const rows: unknown = JSON.parse(environment.SHF_FIXTURE_ROWS ?? "null");
  if (!Array.isArray(rows) || rows.some(row => row === null || typeof row !== "object" || Array.isArray(row)))
    throw new Error("Explicit synthetic fixture rows required");
  const portText = environment.SHF_FIXTURE_PORT;
  if (typeof portText !== "string" || !/^(0|[1-9][0-9]{0,4})$/.test(portText) || Number(portText) > 65535)
    throw new Error("Explicit loopback port required");
  const runtime = await createRuntime(config, new FixtureReader(rows as RawShiftDay[]));
  const server = createLoopbackServer(runtime);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(portText), "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = await startFromEnvironment(process.env);
    const stop = () => { server.close(); server.closeIdleConnections(); };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch {
    // Never print configuration, fixtures, authorization or raw exception messages.
    process.stderr.write("Fixture server startup rejected\n");
    process.exitCode = 1;
  }
}
