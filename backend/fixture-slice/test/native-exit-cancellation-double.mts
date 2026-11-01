// ISOLATED Oracle protocol double. TEMP authority is synthetic provisioning,
// never an operator mount, captured F1 allowance, live pool or completion.
import type { BindParameters } from "oracledb";
import { join } from "node:path";
import type { NativeConnection, NativePool } from "../oracle-stage-arrival-uow.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { ExitOracleDouble, exitSelection } from "./native-station-exit-double.mts";
import { syntheticCoordinator, syntheticCoordinatorEnvironment } from "./native-coordinator-provision.mts";
import type { CancellationBindingV1 } from "../station-exit-cancellation-private-contracts.mts";
import { cancellationMetadataDigest, cancellationOperation, cancellationTableScope,
  cancellationSchema, cancellationWaiverId } from "../native-station-exit-cancellation-metadata.mts";
import { limitedCollectorMethod, limitedMetadataCoverage, limitedObservationNames } from "../native-metadata-limited.mts";
import type { CancellationMetadataProofV1 } from "../station-exit-cancellation-private-contracts.mts";
import { cancellationBindingScopeDigest, cancellationBinding } from "../native-station-exit-cancellation-config.mts";
import { cancellationSnapshot } from "../oracle-station-exit-cancellation-snapshot.mts";
import { completeCancellationOriginalsDigest } from "../station-exit-cancellation-domain.mts";
import { CancellationOperatorAdmission } from "../native-station-exit-cancellation-admission.mts";
import { OracleStationExitCancellationUow } from "../oracle-station-exit-cancellation-uow.mts";
import { OracleStationExitCancellationApplication } from "../oracle-station-exit-cancellation-application.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { record } from "../contract-validation.mts";
import type { NativeRow } from "../oracle-stage-arrival-snapshot.mts";
export const cancellationNativeConfig = { attendanceStageArrivalMode: "disabled", attendanceStationArrivalMode: "disabled",
  attendanceStationArrivalLateMode: "disabled", attendanceStationExitMode: "disabled", shiftManagementMode: "disabled",
  attendanceStationExitCancellationMode: "test-oracle-controlled", dataSource: "oracle-read-only",
  oracleTestScopeConfirmed: true, deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], businessTimeZone: "UTC" };
export const cancellationSelection = exitSelection;
export class CancellationOracleDouble extends ExitOracleDouble {
  cancellationBinding!: CancellationBindingV1;
  limited = false;
  readonly dependentRows: Record<string, NativeRow[]> = {
    SHF_EMPLOYEE_REPORTS: [], SHF_EMPLOYEE_EXCEPTIONS: [], SHF_EMPLOYEE_EXCEPTIONS_BASE: [],
  };
  constructor() {
    super(true);
    this.observations.read.schema = "SHIFTER";
    Object.assign(this.rows.SHF_ATTENDANCE!, { STATION_EXIT_TIME: new Date(this.clockMs - 1000).toISOString().slice(0, 19),
      STATION_EXIT_USER: "synthetic-original-exit" });
    // Extra physical preserved column, not a fabricated source field.
    this.proof[0].push({ tableName: "SHF_ATTENDANCE", columnName: "SYNTHETIC_UNOWNED",
      dataType: "VARCHAR2", dataLength: 100, charUsed: "B", nullable: "Y", virtualColumn: "NO" });
    this.rows.SHF_ATTENDANCE!.SYNTHETIC_UNOWNED = null;
    this.proof[1].push({ tableName: "SHF_EMPLOYEE_DAY", name: "SYNTHETIC_DAY_PK", kind: "P",
      status: "ENABLED", validated: "VALIDATED", referencedOwner: null, referencedConstraint: null });
    this.proof[2].push({ tableName: "SHF_EMPLOYEE_DAY", name: "SYNTHETIC_DAY_PK", columnName: "SHF_EMPLOYEE_DAY_ID", position: 1 });
  }
  async certifyCancellation() {
    const packet = (this.limited ? {
      version: "shf-exit-cancellation-owner-test-limited-proof-v1", provider: "owner-test-limited-v1", owner: "SHIFTER",
      operation: cancellationOperation, tableScope: [...cancellationTableScope], waiverId: cancellationWaiverId,
      collectorMethod: limitedCollectorMethod, coverage: limitedMetadataCoverage,
      observations: Object.fromEntries(limitedObservationNames.map((n, i) => [n, structuredClone(this.proof[[0, 1, 2, 4, 5, 6, 8][i]])])),
      ownerTriggers: structuredClone(this.proof[3]),
    } : { version: "shf-native-exit-cancellation-metadata-v1", provider: "dba-v1", owner: "SHIFTER",
      operation: cancellationOperation, tableScope: [...cancellationTableScope], proof: structuredClone(this.proof) }) as CancellationMetadataProofV1;
    const digest = cancellationMetadataDigest(packet);
    const { operation: _op, exitMetadataDigest: _digest, ...base } = this.binding;
    const b = { ...base, readIdentity: { ...this.observations.read }, metadataProvider: packet.provider, operation: cancellationOperation,
      expectedDaySource: this.rows.SHF_EMPLOYEE_DAY!.SOURCE, allowanceFile: join(this.directory, "station-exit-cancellation-attempt"),
      cancellationMetadataDigest: digest,
      cancellationCertificate: { version: "shf-native-exit-cancellation-certificate-v1", operation: cancellationOperation,
        tableScope: [...cancellationTableScope], metadataProof: packet, updateColumns: ["STATION_EXIT_TIME", "STATION_EXIT_USER"],
        replacement: { STATION_EXIT_TIME: null, STATION_EXIT_USER: null }, bindingScopeDigest: "0".repeat(64),
        completeOriginalsDigest: "0".repeat(64) },
      partnerReview: { version: "shf-exit-cancellation-partner-review-v1", purpose: "clear-recorded-ordinary-station-exit",
        assessment: "not-required", reviewReference: "synthetic-null-only-source-review", reviewedBy: "synthetic-reviewer",
        reviewedAt: new Date(this.clockMs - 60000).toISOString(), expiresAt: base.windowEnd,
        bindingScopeDigest: "0".repeat(64), completeOriginalsDigest: "0".repeat(64) },
    } as CancellationBindingV1;
    if (this.limited) {
      delete (b as unknown as Record<string, unknown>).noExternalEffectsConfirmed;
      Object.assign(b, { metadataCoverageWaiver: { id: cancellationWaiverId, accepted: true,
        externalEffectsAssessment: "unknown-user-waived", operation: cancellationOperation } });
    }
    const schema = cancellationSchema(packet, b.writeIdentity.user);
    const before = await cancellationSnapshot((sql, binds) => this.query(sql, binds, "read"), schema, b, "UTC");
    const scope = cancellationBindingScopeDigest(b), originals = completeCancellationOriginalsDigest(before);
    Object.assign(b.cancellationCertificate, { bindingScopeDigest: scope, completeOriginalsDigest: originals });
    Object.assign(b.partnerReview, { bindingScopeDigest: scope, completeOriginalsDigest: originals });
    this.cancellationBinding = cancellationBinding(b);
    return this.cancellationBinding;
  }
  protected override async query(sql: string, binds: BindParameters, source: "read" | "write") {
    const tag = /\/\* (cancellation:[^*]+) \*\//.exec(sql)?.[1];
    if (!tag) return super.query(sql, binds, source);
    this.sql.push({ sql, binds: structuredClone(binds), source }); await this.point(`${source}:${tag}`);
    if (tag.startsWith("cancellation:metadata:")) {
      const index = Number(tag.split(":")[2]);
      return structuredClone(this.proof[this.limited ? [0, 1, 2, 4, 5, 6, 8, 3][index] : index]);
    }
    if (tag.startsWith("cancellation:privilege:")) return [];
    if (tag.startsWith("cancellation:dependency:")) return structuredClone(this.dependentRows[tag.split(":")[2]]);
    if (tag.startsWith("cancellation:lock:")) return [{ key: "synthetic" }];
    throw Error("Unexpected cancellation SELECT");
  }
  readonly cancellationWritePool: NativePool = {
    getConnection: async (): Promise<NativeConnection> => {
      await this.point("write:lease");
      let staged: NativeRow | null = null, active = false;
      return { callTimeout: 0, execute: async (sql, binds) => {
        if (!sql.includes("cancellation:update")) return { rows: await this.query(sql, binds, "write") };
        this.sql.push({ sql, binds: structuredClone(binds), source: "write" }); active = true;
        try {
          await this.point("write:update");
          if (this.count === 1 && record(binds)) staged = { ...this.rows.SHF_ATTENDANCE!, STATION_EXIT_TIME: null, STATION_EXIT_USER: null };
          await this.point("write:updated"); return { rowsAffected: this.count };
        } finally { active = false; }
      }, commit: async () => {
        active = true;
        try {
          await this.point("write:commit"); if (staged) this.rows.SHF_ATTENDANCE = staged;
          staged = null; this.committed = true; await this.point("write:commit-ack");
        } finally { active = false; }
      }, rollback: async () => { await this.point("write:rollback"); staged = null; },
      break: async () => { await this.point("write:break"); },
      close: async drop => { if (active) throw Error("Busy cancellation lease released"); await this.point(`write:close:${Boolean(drop)}`); } };
    }, close: async () => { await this.point("write:pool-close"); },
  };
  async cancellationApplication() {
    if (!this.cancellationBinding) await this.certifyCancellation();
    const binding = this.cancellationBinding, coordinator = syntheticCoordinator(this.directory, binding);
    const authority = new CancellationOperatorAdmission(binding, coordinator);
    const uow = new OracleStationExitCancellationUow(this.cancellationWritePool, new OracleReadSession(this.readPool),
      binding, "UTC", coordinator, authority);
    await uow.initialize();
    const app = new OracleStationExitCancellationApplication(uow, binding, "UTC", ["T001"]);
    const principal = await new SyntheticAdministratorProvider(cancellationNativeConfig).authenticate({ authorization: null });
    return { app, principal, uow, authority, coordinator };
  }
  environment(): NodeJS.ProcessEnv {
    if (!this.cancellationBinding) throw Error("Certify synthetic protocol first");
    return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(cancellationNativeConfig),
      SHF_ORACLE_PORT: "0", SHF_STATION_EXIT_CANCELLATION_ORIGINS: '["http://127.0.0.1:4200"]',
      SHF_TEST_ORACLE_EXIT_CANCELLATION_WRITE_ENABLED: "true",
      SHF_NATIVE_EXIT_CANCELLATION_BINDING: JSON.stringify(this.cancellationBinding),
      ...(this.limited ? { SHF_TEST_ORACLE_METADATA_LIMITED_ENABLED: "true" } : {}),
      SHF_NATIVE_EXIT_CANCELLATION_CONNECT_STRING: "CTIDBT_WFMT", SHF_NATIVE_EXIT_CANCELLATION_USER: "SHIFTER",
      SHF_NATIVE_EXIT_CANCELLATION_PASSWORD: "synthetic-not-a-secret", SHF_NATIVE_EXIT_CANCELLATION_CLIENT_LIB_DIR: "synthetic-no-client",
      SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: "SYNTHETIC_READ",
      SHF_ORACLE_PASSWORD: "synthetic-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-no-client",
      SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: syntheticCoordinatorEnvironment(this.directory, this.cancellationBinding) };
  }
}
