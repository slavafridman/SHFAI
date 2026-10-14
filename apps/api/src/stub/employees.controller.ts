import { Controller, Get, Header, HttpException, Param, Query, UseFilters } from '@nestjs/common';
import { DEMO_EMPLOYEE_UNIT, syntheticEmployees } from './employee-fixtures.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/employees')
@UseFilters(StubProblemFilter)
export class StubEmployeesController {
  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    const search = query['search'] ?? '';
    const limit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => !['search', 'limit'].includes(key))
      || typeof search !== 'string' || search.length > 80
      || typeof limit !== 'string' || !/^[1-9]\d{0,2}$/.test(limit) || Number(limit) > 100) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן העובדים אינו תקין.'), 400);
    }
    const normalized = search.trim().toLocaleLowerCase('he');
    const items = syntheticEmployees().filter(employee => employee.orgUnit.id === DEMO_EMPLOYEE_UNIT
      && (employee.id.includes(normalized) || employee.displayName.toLocaleLowerCase('he').includes(normalized)));
    if (items.length > Number(limit)) {
      throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return { ...STUB_MARKER, items, nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^\d{1,128}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה העובד או הבקשה אינם תקינים.'), 400);
    }
    const item = syntheticEmployees().find(employee => employee.id === id && employee.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    if (!item) {
      throw new HttpException(stubProblem(404, 'EMPLOYEE_NOT_FOUND', 'כרטיס העובד אינו זמין להצגה.'), 404);
    }
    return { ...STUB_MARKER, item, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }
}
