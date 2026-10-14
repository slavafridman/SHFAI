import { Controller, Get, Header, HttpException, Param, Query, UseFilters } from '@nestjs/common';
import { parsePersonalShiftQuery } from '../personal-shifts/personal-shifts.js';
import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import { syntheticExceptions } from './exception-fixtures.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

function selectRecords(query: Record<string, unknown>, employeeId?: string) {
  const kind = query['kind'] ?? 'all';
  const cancelled = query['includeCancelled'] ?? 'false';
  if (Object.keys(query).some(key => !['from', 'toExclusive', 'limit', 'kind', 'includeCancelled'].includes(key))
    || typeof kind !== 'string' || !['all', 'full-day', 'timed'].includes(kind)
    || (cancelled !== 'true' && cancelled !== 'false')) {
    throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנני חריגות והיעדרויות אינם תקינים.'), 400);
  }
  const dates = parsePersonalShiftQuery({ from: query['from'], toExclusive: query['toExclusive'], limit: query['limit'] ?? '25' });
  const items = syntheticExceptions().filter(item => {
    const date = item.interval.kind === 'full-day' ? item.interval.date : item.interval.startLocal.slice(0, 10);
    return date >= dates.from && date < dates.toExclusive && (kind === 'all' || item.interval.kind === kind)
      && (cancelled === 'true' || item.status === 'active')
      && (employeeId === undefined || (item.employeeId === employeeId && item.category === 'time-off'));
  }).sort((a, b) => {
    const ad = a.interval.kind === 'full-day' ? a.interval.date : a.interval.startLocal;
    const bd = b.interval.kind === 'full-day' ? b.interval.date : b.interval.startLocal;
    return ad < bd ? 1 : ad > bd ? -1 : BigInt(a.id) < BigInt(b.id) ? 1 : BigInt(a.id) > BigInt(b.id) ? -1 : 0;
  });
  if (items.length > dates.limit) {
    throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
  }
  return items;
}
function envelope() {
  return { ...STUB_MARKER, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
}

@Controller('api/v1')
@UseFilters(StubProblemFilter)
export class StubExceptionsController {
  @Get('exceptions')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    return { ...envelope(), items: selectRecords(query), nextCursor: null };
  }

  @Get('exceptions/:id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה החריגה או הבקשה אינם תקינים.'), 400);
    }
    const item = syntheticExceptions().find(record => record.id === id);
    if (!item) {
      throw new HttpException(stubProblem(404, 'EXCEPTION_NOT_FOUND', 'הרשומה אינה זמינה בהיקף ההדגמה.'), 404);
    }
    return { ...envelope(), item };
  }

  @Get('employees/:id/time-off')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  timeOff(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^\d{1,128}$/.test(id)) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה העובד אינו תקין.'), 400);
    }
    if (!syntheticEmployees().some(employee => employee.id === id && employee.orgUnit.id === DEMO_EMPLOYEE_UNIT)) {
      throw new HttpException(stubProblem(404, 'EMPLOYEE_NOT_FOUND', 'העובד אינו זמין בהיקף ההדגמה.'), 404);
    }
    return { ...envelope(), employeeId: id, items: selectRecords(query, id), nextCursor: null };
  }
}
