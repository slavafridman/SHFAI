import type { DemoExceptionInterval, DemoExceptionRecord } from './exception-contracts.js';
import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';

function day(date: string): DemoExceptionInterval {
  return { kind: 'full-day', date, startLocal: null, endLocal: null };
}
function timed(startLocal: string, endLocal: string): DemoExceptionInterval {
  return { kind: 'timed', date: null, startLocal, endLocal };
}

export function syntheticExceptions(): readonly DemoExceptionRecord[] {
  const fixtures = [
    {
      id: '94000001', employeeId: '00000001', category: 'time-off', status: 'active', provenance: 'baseline',
      interval: day('2026-10-15'), originalInterval: null, originalAvailability: 'not-present',
      reason: 'יום חופשה סינתטי', remark: null, cancellationReason: null,
    },
    {
      id: '94000002', employeeId: '00000002', category: 'exception', status: 'active', provenance: 'override',
      interval: timed('2026-10-15T14:00:00', '2026-10-15T15:00:00'),
      originalInterval: timed('2026-10-15T12:00:00', '2026-10-15T13:00:00'), originalAvailability: 'available',
      reason: 'חריגה מתוזמנת לדוגמה', remark: 'תכנון קודם ושינוי סינתטיים בלבד.', cancellationReason: null,
    },
    {
      id: '94000003', employeeId: '00000001', category: 'time-off', status: 'active', provenance: 'baseline',
      interval: timed('2026-10-16T23:00:00', '2026-10-17T01:00:00'),
      originalInterval: null, originalAvailability: 'not-present', reason: null, remark: null, cancellationReason: null,
    },
    {
      id: '94000004', employeeId: '00000001', category: 'time-off', status: 'cancelled', provenance: 'override',
      interval: day('2026-10-16'), originalInterval: day('2026-10-15'), originalAvailability: 'available',
      reason: 'יום היעדרות סינתטי שבוטל', remark: 'היסטוריה לקריאה בלבד.', cancellationReason: 'ביטול מומצא לתצוגה בלבד',
    },
    {
      id: '94000005', employeeId: '00000001', category: 'exception', status: 'active', provenance: 'override',
      interval: timed('2026-10-17T09:00:00', '2026-10-17T10:00:00'),
      originalInterval: null, originalAvailability: 'not-authorized', reason: null,
      remark: '<strong>הערת הדגמה היא טקסט, לא HTML</strong>', cancellationReason: null,
    },
    {
      id: '94000006', employeeId: '00000003', category: 'time-off', status: 'active', provenance: 'baseline',
      interval: day('2026-10-17'), originalInterval: null, originalAvailability: 'not-present',
      reason: null, remark: null, cancellationReason: null,
    },
    {
      id: '94000007', employeeId: '00000004', category: 'time-off', status: 'active', provenance: 'baseline',
      interval: day('2026-10-17'), originalInterval: null, originalAvailability: 'not-present',
      reason: 'synthetic-hidden-exception', remark: null, cancellationReason: null,
    },
  ] satisfies readonly Omit<DemoExceptionRecord, 'unitId' | 'employeeName'>[];
  return fixtures.flatMap(record => {
    const employee = syntheticEmployees().find(item => item.id === record.employeeId && item.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    return employee === undefined ? [] : [{ ...record, unitId: DEMO_EMPLOYEE_UNIT, employeeName: employee.displayName }];
  });
}
