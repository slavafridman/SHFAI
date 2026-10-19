import type { AttendanceFilterContextV1, AttendanceRequestV1, AttendanceListV1, AttendanceRowV1 } from './attendance-contract';
// Synthetic only; shared with the isolated browser interceptor, never a fallback.
export function attendanceContextFixture(): AttendanceFilterContextV1 {
  return {
    defaults: { attendanceDate: '2026-10-19', timeFrom: '10:00', timeTo: '10:00', mokedCode: null,
      teamCodes: [], innerJobCodes: [], workLocations: [] },
    mokedOptions: [{ code: 'P01', label: 'מוקד הדגמה א', unitType: 'G01' }, { code: 'P02', label: 'מוקד הדגמה ב', unitType: 'G01' }],
    teamOptions: [{ code: 'TEST-U', label: 'צוות הדגמה א', unitType: 'J01', parentMokedCode: 'P01' },
      { code: 'TEST-V', label: 'צוות הדגמה ב', unitType: 'J01', parentMokedCode: 'P02' }],
    innerJobOptions: [{ code: '1', label: 'תפקיד הדגמה' }],
    workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
  };
}
export function attendanceRequestFixture(): AttendanceRequestV1 {
  return { attendanceDate: '2026-10-19', timeFrom: '10:00', timeTo: '10:00', limit: 25, offset: 0, sort: 'effective-start-asc' };
}
export function attendanceRowFixture(shiftDayId = '5201', employeeId = '1001'): AttendanceRowV1 {
  return { shiftDayId,
    employee: { employeeId, firstName: 'דנה', lastName: 'סינתטית',
      unit: { code: 'TEST-U', label: 'צוות הדגמה א', moked: { code: 'P01', label: 'מוקד הדגמה א', unitType: 'G01' } } },
    planned: { startLocal: '2026-10-19T10:00:00', endLocal: '2026-10-19T18:00:00', workingFromHome: null,
      activities: [{ code: '00UNKNOWN', label: null }], activityFallback: null, innerJob: null },
    attendance: { stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null, missingReasonCode: null, briefingRecorded: null } };
}
export function attendanceListFixture(request = attendanceRequestFixture(), items = [attendanceRowFixture()]): AttendanceListV1 {
  return { items, applied: { attendanceDate: request.attendanceDate, timeFrom: request.timeFrom, timeTo: request.timeTo,
    mokedCode: request.mokedCode ?? null, teamCodes: [...request.teamCodes ?? []].sort(),
    innerJobCodes: [...request.innerJobCodes ?? []].sort(), workLocations: ['home', 'site'].filter(x =>
      request.workLocations?.includes(x as 'home' | 'site')) as ('home' | 'site')[], sort: 'effective-start-asc' },
    page: { limit: request.limit ?? 25, offset: request.offset ?? 0, hasMore: false, nextOffset: null },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
}
