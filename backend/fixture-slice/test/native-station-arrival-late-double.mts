// ISOLATED Oracle protocol double; no driver or transport completion is faked.
import { join } from "node:path";
import { StationOracleDouble, stationSelection } from "./native-station-arrival-double.mts";
import { syntheticCoordinator, syntheticCoordinatorEnvironment } from "./native-coordinator-provision.mts";
import { OracleLateStationArrivalUow } from "../oracle-station-arrival-late-uow.mts";
import { OracleLateStationArrivalApplication } from "../oracle-station-arrival-late-application.mts";
import { lateBinding } from "../native-station-arrival-late-config.mts";
import { nativeMetadataDigest } from "../oracle-stage-arrival-snapshot.mts";
import { lateTables } from "../oracle-station-arrival-late-snapshot.mts";
import { OracleReadSession } from "../oracle-session.mts";
import { SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { BoundedLateStationObligations } from "../station-arrival-late-obligations.mts";
export const lateConfig = { deploymentClass: "isolated-test-demo", authenticationMode: "synthetic",
  syntheticAdministratorEnabled: true, syntheticOrgUnitIds: ["T001"], dataSource: "oracle-read-only",
  oracleTestScopeConfirmed: true, attendanceStageArrivalMode: "disabled",
  attendanceStationArrivalLateMode: "test-oracle-controlled", businessTimeZone: "UTC" } as const;
export const lateSelection = stationSelection;
export const lateDraft = { lateReasonCode: "1001", lateRemark: null };
export function lateOracleDouble(realClock = false) {
  const d = new StationOracleDouble(realClock);
  const midnight = Date.parse(new Date(d.clockMs).toISOString().slice(0, 10) + "T00:00:00Z");
  d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME = new Date(Math.max(midnight, d.clockMs - 30000)).toISOString().slice(0, 19);
  d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME = new Date(d.clockMs + 3600000).toISOString().slice(0, 19);
  d.rows.SHF_ATTENDANCE!.TADREECH = null;
  for (const [table, columns] of [
    ["SHF_EMPLOYEE_DAY", ["WM_DATE", "WM_START_DATETIME", "WM_END_DATETIME", "WM_PAID_MINUTES", "WM_WORK_MINUTES"]],
    ["SHF_DAY_CHANGES", ["NEW_DAY_START", "NEW_DAY_END", "NEW_PAID_MINUTES", "NEW_WORK_MINUTES"]],
  ] as const) for (const name of columns) {
    d.proof[0].push({ tableName: table, columnName: name, dataType: name.endsWith("MINUTES") ? "NUMBER" : "DATE",
      dataLength: 22, charUsed: null, nullable: "Y", virtualColumn: "NO" });
    if (d.rows[table]) d.rows[table]![name] = name.endsWith("MINUTES") ? "480" : d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME;
  }
  d.lateReasons = [{ REASON_ID: "1001", BRANCH_ID: null, REASON_DESC: "Synthetic late reason",
    REPORTED: "0", REPORT_REQUESTED: "0", SER_TYPE: "2" }];
  for (const name of lateTables.SHF_EVENT_REASON) d.proof[0].push({
    tableName: "SHF_EVENT_REASON", columnName: name, dataType: name === "REASON_DESC" ? "VARCHAR2" : "NUMBER",
    dataLength: 100, charUsed: name === "REASON_DESC" ? "B" : null, nullable: "Y", virtualColumn: "NO",
  });
  const { operation: _op, stationMetadataDigest: _digest, ...common } = d.binding;
  const binding = lateBinding({ ...common, operation: "native-station-arrival-late-v0.1",
    lateMetadataDigest: nativeMetadataDigest("dba-v1", "native-station-arrival-late-v0.1", Object.keys(lateTables), d.proof),
    allowanceFile: join(d.directory, "station-arrival-late-single-attempt") });
  const coordinator = syntheticCoordinator(d.directory, binding);
  return { d, binding, coordinator, async application(partner = new BoundedLateStationObligations()) {
    const uow = new OracleLateStationArrivalUow(d.writePool, new OracleReadSession(d.readPool), binding, "UTC", coordinator);
    await uow.initialize();
    const app = new OracleLateStationArrivalApplication(uow, binding, d.clock, "UTC", ["T001"], partner);
    const principal = await new SyntheticAdministratorProvider(lateConfig).authenticate({ authorization: null });
    return { app, uow, principal };
  }, environment(): NodeJS.ProcessEnv {
    return { SHF_APP_ENV: "test", SHF_ORACLE_CONFIG: JSON.stringify(lateConfig), SHF_ORACLE_PORT: "0",
      SHF_ORACLE_CONNECT_STRING: "CTIDBT_WFMT", SHF_ORACLE_USER: binding.readIdentity.user,
      SHF_ORACLE_PASSWORD: "synthetic-double-not-a-secret", SHF_ORACLE_CLIENT_LIB_DIR: "synthetic-unused",
      SHF_TEST_ORACLE_STATION_LATE_WRITE_ENABLED: "true", SHF_STATION_ARRIVAL_LATE_ORIGINS: '["http://localhost:4521"]',
      SHF_NATIVE_LATE_CONNECT_STRING: "CTIDBT_WFMT.WORLD", SHF_NATIVE_LATE_USER: binding.writeIdentity.user,
      SHF_NATIVE_LATE_PASSWORD: "synthetic-double-not-a-secret", SHF_NATIVE_LATE_CLIENT_LIB_DIR: "synthetic-unused",
      SHF_NATIVE_LATE_BINDING: JSON.stringify(binding),
      SHF_NATIVE_COMMAND_COORDINATOR_CONFIG: syntheticCoordinatorEnvironment(d.directory, binding) };
  }, factories: { read: async () => d.readPool, native: async () => d.writePool } };
}
