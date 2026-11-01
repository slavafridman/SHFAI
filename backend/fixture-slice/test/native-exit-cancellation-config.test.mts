import test from "node:test";
import assert from "node:assert/strict";
import { cancellationMetadataProof, cancellationMetadataDigest, cancellationSchema, cancellationWaiverId } from "../native-station-exit-cancellation-metadata.mts";
import { cancellationBinding, parseCancellationPrivateJson } from "../native-station-exit-cancellation-config.mts";
import { CancellationOracleDouble } from "./native-exit-cancellation-double.mts";
import { limitedCollectorMethod, limitedMetadataCoverage, parseLimitedMetadataEvidence, limitedObservationNames } from "../native-metadata-limited.mts";
import type { LimitedOperation } from "../native-metadata-limited.mts";
import { nativeMetadataDigest } from "../oracle-stage-arrival-snapshot.mts";
import { fingerprint } from "../stage-arrival-domain.mts";

test("native cancellation rejects old proof packets and incomplete bindings", () => {
  for (const operation of ["native-station-exit-v0.1", "native-stage-arrival-v0.1",
    "native-station-arrival-late-v0.1", undefined]) {
    assert.throws(() => cancellationMetadataProof({ operation }));
    assert.throws(() => cancellationBinding({ operation }));
  }
});
test("native cancellation never accepts an array as a purpose-bound metadata packet", () => {
  assert.throws(() => cancellationMetadataProof(Array.from({ length: 9 }, () => [])));
});
for (const fault of ["nullable-time", "nullable-user", "virtual", "char-user", "date-impostor", "day-key",
  "duplicate-column", "trigger", "policy", "constraint-disabled", "unknown-type"])
  test(`current metadata ${fault} cannot certify NULL clear`, async () => {
    const d = new CancellationOracleDouble();
    try {
      const b = await d.certifyCancellation(), packet = structuredClone(b.cancellationCertificate.metadataProof);
      assert.ok(packet.provider !== "owner-test-limited-v1");
      const time = packet.proof[0].find(r => r.tableName === "SHF_ATTENDANCE" && r.columnName === "STATION_EXIT_TIME")!;
      const user = packet.proof[0].find(r => r.tableName === "SHF_ATTENDANCE" && r.columnName === "STATION_EXIT_USER")!;
      if (fault === "nullable-time") time.nullable = "N";
      if (fault === "nullable-user") user.nullable = "N";
      if (fault === "virtual") time.virtualColumn = "YES";
      if (fault === "char-user") user.dataType = "CHAR";
      if (fault === "date-impostor") time.dataType = "VARCHAR2";
      if (fault === "day-key") packet.proof[2].pop();
      if (fault === "duplicate-column") packet.proof[0].push({ ...time });
      if (fault === "trigger") packet.proof[3].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_TRIGGER", status: "ENABLED" });
      if (fault === "policy") packet.proof[4].push({ tableName: "SHF_ATTENDANCE", name: "SYNTHETIC_POLICY", enabled: "YES" });
      if (fault === "constraint-disabled") packet.proof[1][0].status = "DISABLED";
      if (fault === "unknown-type") time.dataType = "TIMESTAMP";
      assert.throws(() => cancellationSchema(packet, b.writeIdentity.user));
    } finally { d.dispose(); }
  });
test("new limited purpose preserves exactly two UNKNOWNs and is rejected by old digest/parser", async () => {
  const d = new CancellationOracleDouble();
  try {
    const b = await d.certifyCancellation(), proof = b.cancellationCertificate.metadataProof;
    assert.ok(proof.provider !== "owner-test-limited-v1");
    const p = proof.proof;
    const packet = { version: "shf-exit-cancellation-owner-test-limited-proof-v1", provider: "owner-test-limited-v1",
      owner: "SHIFTER", operation: b.operation, tableScope: proof.tableScope, waiverId: cancellationWaiverId,
      collectorMethod: limitedCollectorMethod, coverage: limitedMetadataCoverage,
      observations: Object.fromEntries(limitedObservationNames.map((n, i) => [n, p[[0, 1, 2, 4, 5, 6, 8][i]]])),
      ownerTriggers: p[3] };
    const parsed = cancellationMetadataProof(packet);
    assert.equal(cancellationMetadataDigest(parsed), fingerprint(parsed));
    assert.ok(parsed.provider === "owner-test-limited-v1");
    assert.equal(parsed.coverage.unavailable.length, 2);
    assert.equal(parsed.coverage.unavailable[0].view, "DBA_TRIGGERS");
    assert.equal(parsed.coverage.unavailable[1].view, "DBA_ROLE_PRIVS");
    assert.ok(cancellationSchema(parsed, "SHIFTER").SHF_ATTENDANCE);
    assert.throws(() => parseLimitedMetadataEvidence(parsed, b.operation as LimitedOperation, proof.tableScope));
    assert.throws(() => nativeMetadataDigest("owner-test-limited-v1", b.operation, proof.tableScope, parsed));
    assert.throws(() => cancellationMetadataProof({ ...packet, coverage: { ...packet.coverage, unavailable: [] } }));
  } finally { d.dispose(); }
});
test("private JSON rejects duplicate decoded keys, depth/size overflow and malformed syntax", () => {
  assert.throws(() => parseCancellationPrivateJson('{"operation":"x","\\u006fperation":"y"}'));
  assert.throws(() => parseCancellationPrivateJson("[".repeat(14) + "0" + "]".repeat(14)));
  assert.throws(() => parseCancellationPrivateJson(JSON.stringify("x".repeat(1048576))));
  assert.throws(() => parseCancellationPrivateJson("{"));
});
test("actual VARCHAR2 BYTE/CHAR originals retain metadata and do not require a new actor string", async () => {
  const d = new CancellationOracleDouble();
  try {
    for (const charUsed of ["B", "C"]) {
      const b = await d.certifyCancellation(), packet = structuredClone(b.cancellationCertificate.metadataProof);
      assert.ok(packet.provider !== "owner-test-limited-v1");
      const user = packet.proof[0].find(r => r.tableName === "SHF_ATTENDANCE" && r.columnName === "STATION_EXIT_USER")!;
      user.charUsed = charUsed; user.dataLength = 7;
      assert.ok(cancellationSchema(packet, "SHIFTER").SHF_ATTENDANCE);
    }
  } finally { d.dispose(); }
});
