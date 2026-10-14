import { Controller, Get, Header, HttpException, Param, Query, UseFilters } from '@nestjs/common';
import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import { syntheticBuildings } from './building-fixtures.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/buildings')
@UseFilters(StubProblemFilter)
export class StubBuildingsController {
  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    const search = query['search'] ?? '';
    const limit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => !['search', 'limit'].includes(key))
      || typeof search !== 'string' || search.length > 80
      || typeof limit !== 'string' || !/^[1-9]\d{0,2}$/.test(limit) || Number(limit) > 100) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן המבנים אינו תקין.'), 400);
    }
    const normalized = search.trim().toLocaleLowerCase('he');
    const items = syntheticBuildings().filter(item => item.orgUnit.id === DEMO_EMPLOYEE_UNIT
      && (item.id.includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized)));
    if (items.length > Number(limit)) {
      throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return {
      ...STUB_MARKER, unitId: DEMO_EMPLOYEE_UNIT, search: normalized, items, nextCursor: null,
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה המבנה או הבקשה אינם תקינים.'), 400);
    }
    const item = syntheticBuildings().find(candidate => candidate.id === id && candidate.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    if (!item) {
      throw new HttpException(stubProblem(404, 'BUILDING_NOT_FOUND', 'פרטי המבנה אינם זמינים להצגה.'), 404);
    }
    return { ...STUB_MARKER, item, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }
}
