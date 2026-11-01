// Isolated TEST provisioning ONLY. Never imported by application modules.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NativeCommandCoordinator, nativeEmployeeScope } from "../native-command-coordinator.mts";
const fixtures = new Map<string, NativeCommandCoordinator>();
export function syntheticCoordinator(parent: string,
  binding: { employeeId: string; writeIdentity: { database: string; schema: string } }) {
  const directory = join(parent, "global-coordinator"), targetScope = "synthetic-local-target";
  const known = fixtures.get(directory);
  if (known) return known;
  mkdirSync(directory);
  const namespace = { version: "shf-native-command-coordinator-v1", canonicalDirectory: directory,
    targetScope, database: binding.writeIdentity.database, schema: binding.writeIdentity.schema };
  const employeeScope = nativeEmployeeScope(targetScope, binding.employeeId);
  writeFileSync(join(directory, "namespace.json"), JSON.stringify(namespace));
  writeFileSync(join(directory, `employee-${employeeScope}.json`),
    JSON.stringify({ version: namespace.version, targetScope, employeeScope, state: "ready" }));
  const coordinator = new NativeCommandCoordinator({ directory, targetScope }, namespace);
  fixtures.set(directory, coordinator);
  return coordinator;
}
export function syntheticCoordinatorEnvironment(parent: string,
  binding: Parameters<typeof syntheticCoordinator>[1]) {
  syntheticCoordinator(parent, binding);
  return JSON.stringify({ directory: join(parent, "global-coordinator"), targetScope: "synthetic-local-target" });
}
