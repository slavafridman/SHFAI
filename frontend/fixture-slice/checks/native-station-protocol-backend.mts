// Explicit owned-loopback integration against the actual native application,
// HTTP adapter and UoW with the backend's synthetic Oracle PROTOCOL double.
// No driver/client factory, environment loading, credentials or real allowance.
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { StationOracleDouble, stationConfig } from '../../../backend/fixture-slice/test/native-station-arrival-double.mts';
import { createRuntime } from '../../../backend/fixture-slice/synthetic-identity.mts';
import { createLoopbackServer } from '../../../backend/fixture-slice/http-adapter.mts';
import type { EmployeeShiftDayReader } from '../../../backend/fixture-slice/contracts.mts';
import type { AttendanceReadPort, AttendanceRowV1 } from '../../../backend/fixture-slice/attendance-contracts.mts';
import type { CurrentShiftReadPort } from '../../../backend/fixture-slice/current-shifts-contracts.mts';
export async function startNativeStationProtocolBackend(origin: string) {
  const d = new StationOracleDouble(true);
  d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_TIME = new Date(d.clockMs - 300000).toISOString().slice(0, 19);
  d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_USER = 'SYNTHETIC previous stage';
  d.rows.SHF_ATTENDANCE!.TADREECH = '1';
  const before = structuredClone(d.rows.SHF_ATTENDANCE);
  let release = () => {};
  const parent = { code: 'M001', label: 'מוקד פרוטוקול סינתטי', unitType: 'G01' as const };
  const row = (): AttendanceRowV1 => ({
    shiftDayId: '6201',
    employee: { employeeId: '9001', firstName: 'עובד/ת', lastName: 'PROTOCOL DOUBLE',
      unit: { code: 'T001', label: 'צוות פרוטוקול סינתטי', moked: parent } },
    planned: { startLocal: d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_START_DATETIME!,
      endLocal: d.rows.SHF_EMPLOYEE_DAY!.WM_SHIFT_END_DATETIME!,
      workingFromHome: false, activities: [], activityFallback: null, innerJob: null },
    attendance: { stageArrivalLocal: d.rows.SHF_ATTENDANCE!.STAGE_ARRIVAL_TIME,
      stationArrivalLocal: d.rows.SHF_ATTENDANCE!.STATION_ARRIVAL_TIME,
      stationExitLocal: d.rows.SHF_ATTENDANCE!.STATION_EXIT_TIME, missingReasonCode: null,
      briefingRecorded: d.rows.SHF_ATTENDANCE!.TADREECH === '1' },
  });
  const detail: EmployeeShiftDayReader & { dataSource: 'oracle' } = {
    dataSource: 'oracle',
    readByDayId: async day => day !== '6201' ? { kind: 'not-found' } : { kind: 'one', row: {
      shiftDayId: '6201', employeeId: '9001', firstName: 'עובד/ת', lastName: 'PROTOCOL DOUBLE', orgUnitId: 'T001',
      baselineStartLocal: row().planned.startLocal, changedStartLocal: null,
      baselineEndLocal: row().planned.endLocal, changedEndLocal: null,
      baselineActivityData: null, changedActivityData: null, baselineSiteId: null, changedSiteId: null,
      stageArrivalLocal: row().attendance.stageArrivalLocal, stationArrivalLocal: row().attendance.stationArrivalLocal,
      stationExitLocal: row().attendance.stationExitLocal,
    } },
  };
  const current: CurrentShiftReadPort & { dataSource: 'oracle-read-only' } = {
    dataSource: 'oracle-read-only', readMokedOptions: async () => [parent], readRows: async () => [] };
  const attendance: AttendanceReadPort = {
    dataSource: 'oracle-read-only',
    readContext: async () => ({ mokedOptions: [parent],
      teamOptions: [{ code: 'T001', label: 'צוות פרוטוקול סינתטי', unitType: 'J01', parentMokedCode: 'M001' }],
      innerJobOptions: [], workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }] }),
    read: async s => s.offset === 0 && s.attendanceDate === row().planned.startLocal!.slice(0, 10) &&
      s.authorizedTeamUnitIds.includes('T001') ? [row()] : [],
  };
  let server: ReturnType<typeof createLoopbackServer> | undefined;
  try {
    const { app } = await d.application();
    const runtime = await createRuntime(stationConfig, detail, undefined, {
      reader: current, clock: d.clock, attendanceReader: attendance, nativeStationArrival: app,
    });
    server = createLoopbackServer(runtime, { stationArrivalOrigins: [origin] });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); if (!address || typeof address === 'string') throw Error('Missing owned protocol port');
    return {
      port: address.port,
      inspect: () => ({ events: [...d.events], sql: structuredClone(d.sql), before,
        planned: row().planned,
        attendance: structuredClone(d.rows.SHF_ATTENDANCE), committed: d.committed,
        syntheticAllowanceConsumed: existsSync(d.binding.allowanceFile) }),
      hold: () => {
        const gate = new Promise<void>(r => { release = r; });
        d.hook = event => event === 'write:update' ? gate : undefined;
      },
      release: () => release(),
      close: async () => {
        release();
        const closed = new Promise<void>(resolve => server!.close(() => resolve()));
        server!.closeAllConnections(); await closed;
        await d.readPool.close(); await d.writePool.close(); d.dispose();
      },
    };
  } catch (e) {
    release(); if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); }
    await d.readPool.close(); await d.writePool.close(); d.dispose(); throw e;
  }
}
