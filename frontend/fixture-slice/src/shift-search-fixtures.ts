import type { ShiftSearchFilterContextV1, ShiftSearchListV1, ShiftSearchRowV1, ShiftSearchRequestV1 } from './shift-search-contract';
// Isolated synthetic test data only. Never imported by the application.
export const searchContextFixture = (): ShiftSearchFilterContextV1 => ({
  defaults: { attendanceDate: '2026-10-15', timeFrom: '10:00', timeTo: '10:00', mokedCode: null,
    teamCodes: [], innerJobCodes: [], workLocations: [] },
  mokedOptions: [{ code: 'P01', label: 'מוקד בדיקה', unitType: 'G01' }, { code: 'P02', label: 'מוקד נוסף', unitType: 'G01' }],
  teamOptions: [{ code: 'TEST-U', label: 'צוות בדיקה', unitType: 'J01', parentMokedCode: 'P01' },
    { code: 'TEST-V', label: 'צוות נוסף', unitType: 'J01', parentMokedCode: 'P02' }],
  innerJobOptions: [{ code: '1', label: 'תפקיד בדיקה' }],
  workLocationOptions: [{ code: 'home', label: 'בית' }, { code: 'site', label: 'אתר' }],
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
export const searchRowFixture = (day = '3001'): ShiftSearchRowV1 => ({
  shiftDayId: day, employee: { employeeId: '1001', firstName: 'בדיקה', lastName: 'סינתטית',
    unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: searchContextFixture().mokedOptions[0] } },
  startLocal: '2026-10-15T10:00:00', endLocal: '2026-10-16T01:00:13', workingFromHome: null,
  activities: [{ code: 'A', label: 'פעילות בדיקה' }, { code: 'B', label: null }],
  innerJob: { code: '1', label: 'תפקיד בדיקה' }, activityFallback: null,
  indicators: { hasRemark: true, hasCancelLoginAnnotation: true, timeOrLocationChanged: true,
    split: true, addedStaffing: true, employeeReassigned: true, extensionAllocated: null },
});
export const searchRequestFixture = (): ShiftSearchRequestV1 => ({
  attendanceDate: '2026-10-15', timeFrom: '10:00', timeTo: '10:00', limit: 25, offset: 0, sort: 'effective-start-asc',
});
export const searchListFixture = (request = searchRequestFixture(), items = [searchRowFixture()]): ShiftSearchListV1 => ({
  items, applied: { attendanceDate: request.attendanceDate, timeFrom: request.timeFrom, timeTo: request.timeTo,
    mokedCode: request.mokedCode ?? null, teamCodes: [...request.teamCodes ?? []].sort(),
    innerJobCodes: [...request.innerJobCodes ?? []].sort(), workLocations: ['home', 'site'].filter(x =>
      request.workLocations?.includes(x as 'home' | 'site')) as ('home' | 'site')[], sort: 'effective-start-asc' },
  page: { limit: request.limit ?? 25, offset: request.offset ?? 0, hasMore: false, nextOffset: null },
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
