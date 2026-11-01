// Baseline protocol-suite loader DOUBLE ONLY. No real driver/client is loaded.
// This exists for suites that statically import native adapters but supply their
// own typed SQL/pool doubles. Every actual driver operation fails the process.
import { registerHooks } from "node:module";
import assert from "node:assert/strict";
let factoryAttempts = 0, redirectedImports = 0;
const tripwireName = "__shfIsolatedDriverFactoryTripwire";
Object.defineProperty(globalThis, tripwireName, { value: () => {
  factoryAttempts++;
  throw Error("Real Oracle operation prohibited by isolated regression double");
} });
const source = `const forbidden = () => globalThis.${tripwireName}();
export default Object.freeze({
  versionString: "26.0.0-isolated-double", thin: true, oracleClientVersionString: "isolated-no-client",
  initOracleClient: forbidden, createPool: forbidden, getConnection: forbidden
});`;
const url = "data:text/javascript," + encodeURIComponent(source);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "oracledb") { redirectedImports++; return { url, shortCircuit: true }; }
    return nextResolve(specifier, context);
  },
});
process.once("exit", () => {
  assert.equal(factoryAttempts, 0, "Isolated regression attempted a real driver factory");
  console.log(`isolated-driver-double: realDriverImports=0 factoryAttempts=${factoryAttempts} redirectedImports=${redirectedImports}`);
});
