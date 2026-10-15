import type { CurrentShiftFilterContextV1, CurrentShiftListV1, CurrentShiftRowV1 } from './current-shifts-contract';
// Test-only synthetic fixtures; never used by the application as a fallback.
export const contextFixture = (): CurrentShiftFilterContextV1 => ({
  defaults: { mode: 'at', attendanceDate: '2026-10-15', currentTime: '10:00', mokedCode: 'P01' },
  mokedOptions: [{ code: 'P01', label: 'מוקד בדיקה', unitType: 'G01' }],
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
export const listRowFixture = (day = '2001'): CurrentShiftRowV1 => ({
  shiftDayId: day, employee: { employeeId: '1001', firstName: 'עובד', lastName: 'לדוגמה',
    unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: contextFixture().mokedOptions[0] } },
  startLocal: '2026-10-14T23:30:11', endLocal: '2026-10-15T11:00:22',
  workingFromHome: null, activities: [{ code: 'A', label: 'פעילות לדוגמה' }, { code: 'A', label: null }],
  innerJob: null, attendanceDisplay: { kind: 'not-recorded' },
});
export const listFixture = (items = [listRowFixture()]): CurrentShiftListV1 => ({
  items, applied: { requestedMode: 'at', attendanceDate: '2026-10-15', currentTime: '10:00', mokedCode: 'P01', sort: 'effective-start-asc' },
  page: { limit: 25, offset: 0, hasMore: false, nextOffset: null },
  businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture',
});
