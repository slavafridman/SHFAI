import type { SelectedShiftItemsV1 } from './shift-items-contract';
import { fixtureRow } from './test-fixtures';
/** Tests only. Never imported by the application. */
export function fixtureItems(employeeId = '1001', shiftDayId = '2001'): SelectedShiftItemsV1 {
  return {
    shiftDay: fixtureRow(employeeId, shiftDayId),
    displayContext: {
      unit: { code: 'TEST-U', label: 'צוות בדיקה', moked: { code: 'P01', label: 'מוקד בדיקה', unitType: 'G01' } },
      activities: [{ code: 'A', label: 'בדיקה' }, { code: 'A', label: null }], innerJob: null,
    },
    items: [
      { key: { shiftDayId, startLocal: '2026-10-15T23:59:30' }, kind: 'break', stateCode: '4', type: null,
        startLocal: '2026-10-15T23:59:30', endLocal: '2026-10-16T00:10:15',
        durationMinutes: '-5', breakExitLocal: null, breakReturnLocal: null, remark: '<טקסט> &\nבדיקה', sourceCode: 'DEL' },
      { key: { shiftDayId, startLocal: '2026-10-16T01:00:00' }, kind: 'timeoff', stateCode: '2',
        type: { code: '0', label: 'בדיקה' }, startLocal: '2026-10-16T01:00:00', endLocal: '2026-10-16T00:00:00',
        durationMinutes: '99999999999999999999999999999999999999',
        breakExitLocal: null, breakReturnLocal: null, remark: null, sourceCode: 'TEST' },
      { key: { shiftDayId, startLocal: '2026-10-16T01:00:30' }, kind: 'exception', stateCode: '7',
        type: { code: '-9', label: null }, startLocal: '2026-10-16T01:00:30', endLocal: '2026-10-16T01:10:00',
        durationMinutes: '0', breakExitLocal: null, breakReturnLocal: null, remark: ' ', sourceCode: 'TEST' },
    ],
    applied: { sort: 'start-asc' }, page: { limit: 25, offset: 0, hasMore: false, nextOffset: null },
  };
}
