import type { MyShiftsContextV1, MyShiftsListV1 } from './my-shifts-contract';
import { searchRowFixture } from './shift-search-fixtures';
export function scheduleContextFixture(mode: 'self' | 'selected' = 'selected'): MyShiftsContextV1 {
  return { actor: { mode, employee: mode === 'self' ? null : searchRowFixture().employee },
    selectionRequired: mode === 'self', canSelectEmployee: true,
    defaults: { dateFrom: '2026-10-15', dateTo: '2026-10-28' },
    businessTimeZone: 'Asia/Jerusalem', dataSource: 'isolated-fixture' };
}
export function scheduleListFixture(): MyShiftsListV1 {
  const ctx = scheduleContextFixture(), row = searchRowFixture();
  return { actor: ctx.actor, items: [{ shiftDayId: row.shiftDayId, employee: row.employee,
    startLocal: row.startLocal, endLocal: row.endLocal, activities: row.activities }],
    applied: { mode: 'selected', employeeId: row.employee.employeeId, dateFrom: ctx.defaults.dateFrom,
      dateTo: ctx.defaults.dateTo, sort: 'effective-start-asc' },
    page: { limit: 25, offset: 0, hasMore: false, nextOffset: null },
    businessTimeZone: ctx.businessTimeZone, dataSource: ctx.dataSource };
}
