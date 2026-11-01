import test from "node:test";
import assert from "node:assert/strict";
import { lateOracleDouble, lateDraft, lateSelection } from "./native-station-arrival-late-double.mts";
import { lateBinding } from "../native-station-arrival-late-config.mts";
import { lateTables } from "../oracle-station-arrival-late-snapshot.mts";
import { limitedMetadataCoverage, limitedCollectorMethod, metadataWaiverId, limitedMetadataDigest } from "../native-metadata-limited.mts";
import { OracleLateStationArrivalUow } from "../oracle-station-arrival-late-uow.mts";
import { OracleLateStationArrivalApplication } from "../oracle-station-arrival-late-application.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { BoundedLateStationObligations } from "../station-arrival-late-obligations.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { lateConfig } from "./native-station-arrival-late-double.mts";
import { randomUUID } from "node:crypto";
import type { NativePool } from "../oracle-stage-arrival-uow.mts";
import { nativeMetadataDigest } from "../oracle-stage-arrival-snapshot.mts";
test("late has a separate limited certificate with exactly two UNKNOWN waivers; no old certificate substitution", async () => {
  const f = lateOracleDouble();
  try {
    const operation = "native-station-arrival-late-v0.1", tableScope = Object.keys(lateTables), p = f.d.proof;
    const proof = { version: "shf-owner-test-limited-proof-v1", provider: "owner-test-limited-v1", owner: "SHIFTER",
      operation, tableScope, waiverId: metadataWaiverId, collectorMethod: limitedCollectorMethod,
      coverage: limitedMetadataCoverage, observations: { columns: p[0], constraints: p[1], constraintColumns: p[2],
        policies: p[4], tablePrivileges: p[5], columnPrivileges: p[6], dependencies: p[8] }, ownerTriggers: p[3] };
    const observations = [p[0], p[1], p[2], p[4], p[5], p[6], p[8], p[3]];
    const names = ["columns", "constraints", "constraintColumns", "policies", "tablePrivileges", "columnPrivileges", "dependencies", "ownerTriggers"];
    const pool: NativePool = { async getConnection() {
      const c = await f.d.writePool.getConnection();
      return { ...c, async execute(sql, binds, bound) {
        assert.equal(/\bDBA_TRIGGERS\b|\bDBA_ROLE_PRIVS\b/.test(sql), false);
        const tag = /station:limited:([^* ]+)/.exec(sql)?.[1];
        if (tag) return { rows: structuredClone(observations[names.indexOf(tag)]) };
        return c.execute(sql, binds, bound);
      } };
    }, close: () => f.d.writePool.close() };
    const { noExternalEffectsConfirmed: _old, ...common } = f.binding;
    const binding = lateBinding({ ...common, metadataProvider: "owner-test-limited-v1",
      metadataCoverageWaiver: { id: metadataWaiverId, accepted: true, externalEffectsAssessment: "unknown-user-waived" },
      lateMetadataDigest: limitedMetadataDigest(proof, operation, tableScope) });
    assert.deepEqual(limitedMetadataCoverage.unavailable.map(r => r.view), ["DBA_TRIGGERS", "DBA_ROLE_PRIVS"]);
    const wrong = new OracleLateStationArrivalUow(pool, new OracleReadSession(f.d.readPool),
      { ...binding, lateMetadataDigest: f.binding.lateMetadataDigest }, "UTC", f.coordinator);
    await assert.rejects(wrong.initialize(), { code: "LIVE_WRITES_DISABLED" });
    const uow = new OracleLateStationArrivalUow(pool, new OracleReadSession(f.d.readPool), binding, "UTC", f.coordinator);
    await uow.initialize();
    const app = new OracleLateStationArrivalApplication(uow, binding, f.d.clock, "UTC", ["T001"], new BoundedLateStationObligations());
    const principal = await new SyntheticAdministratorProvider(lateConfig).authenticate({ authorization: null });
    const v = await app.validate(principal, lateSelection, lateDraft);
    const receipt = await app.command(principal, lateSelection, { commandId: randomUUID(), draft: lateDraft,
      validationToken: v.validationToken, fingerprint: v.fingerprint,
      confirmation: { accepted: true, warningCodes: ["STATION_ARRIVAL_LATE"] }, operationConfirmation: { accepted: true } });
    assert.equal(receipt.outcome, "oracle-test-committed"); assert.equal(receipt.partnerCompletion, "not-invoked");
    assert.equal(f.d.events.filter(e => e === "write:commit").length, 1);
  } finally { f.d.dispose(); }
});
for (const defect of ["missing-catalog-column", "ordinary-two-column-grants"] as const) {
  test(`late metadata ${defect} denies before business DML with an independently matching certificate`, async () => {
    const f = lateOracleDouble();
    try {
      let writeIdentity = f.binding.writeIdentity;
      if (defect === "missing-catalog-column") f.d.proof[0] = f.d.proof[0].filter(row =>
        !(typeof row === "object" && row !== null && "tableName" in row && "columnName" in row &&
          row.tableName === "SHF_EVENT_REASON" && row.columnName === "REASON_DESC"));
      else {
        writeIdentity = { ...writeIdentity, user: "SYNTHETIC_WRITER" };
        f.d.observations.write.user = writeIdentity.user;
        f.d.proof[6] = ["STATION_ARRIVAL_TIME", "STATION_ARRIVAL_USER"].map(columnName =>
          ({ tableName: "SHF_ATTENDANCE", columnName, grantee: writeIdentity.user, privilege: "UPDATE" }));
      }
      const binding = lateBinding({ ...f.binding, writeIdentity,
        lateMetadataDigest: nativeMetadataDigest("dba-v1", "native-station-arrival-late-v0.1", Object.keys(lateTables), f.d.proof) });
      const uow = new OracleLateStationArrivalUow(f.d.writePool, new OracleReadSession(f.d.readPool), binding, "UTC", f.coordinator);
      await assert.rejects(uow.initialize(), { code: "LIVE_WRITES_DISABLED" });
      assert.equal(f.d.events.includes("write:update"), false);
      assert.equal(f.d.events.includes("write:commit"), false);
      await f.coordinator.assertAvailable(lateSelection.employeeId);
    } finally { f.d.dispose(); }
  });
}
