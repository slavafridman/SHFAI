// Isolated verification only. A driver resolution attempt makes the process fail,
// even if application code catches its error. No driver is imported by this hook.
import { registerHooks } from "node:module";
let attempts = 0;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "oracledb" || specifier.includes("/oracledb/")) {
      attempts++;
      throw Error("Isolated verification forbids Oracle driver import");
    }
    return nextResolve(specifier, context);
  },
});
export function driverImportAttempts() { return attempts; }
process.once("exit", () => { if (attempts !== 0) process.exitCode = 1; });
