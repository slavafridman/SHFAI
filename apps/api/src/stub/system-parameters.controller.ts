import { Controller, Get, Header, HttpException, Param, Query, UseFilters } from '@nestjs/common';
import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import { DEMO_PARAMETER_SOURCE, isDemoParameterCode } from './system-parameter-contracts.js';
import { syntheticSystemParameters } from './system-parameter-fixtures.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/system-parameters')
@UseFilters(StubProblemFilter)
export class StubSystemParametersController {
  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    const search = query['search'] ?? '';
    const limit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => !['search', 'limit'].includes(key))
      || typeof search !== 'string' || search.length > 80
      || typeof limit !== 'string' || !/^[1-9]\d{0,2}$/.test(limit) || Number(limit) > 100) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן הפרמטרים אינו תקין.'), 400);
    }
    const normalized = search.trim().toLocaleLowerCase('he');
    const items = syntheticSystemParameters().filter(item => item.orgUnit.id === DEMO_EMPLOYEE_UNIT
      && isDemoParameterCode(item.code)
      && (item.code.toLocaleLowerCase('he').includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized)));
    if (items.length > Number(limit)) {
      throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return {
      ...STUB_MARKER, sourceVersion: DEMO_PARAMETER_SOURCE, unitId: DEMO_EMPLOYEE_UNIT,
      search: normalized, items, nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get(':code')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('code') code: string, @Query() query: Record<string, unknown>) {
    if (!/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(code) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'קוד הפרמטר או הבקשה אינם תקינים.'), 400);
    }
    const item = isDemoParameterCode(code) ? syntheticSystemParameters().find(candidate =>
      candidate.code === code && candidate.orgUnit.id === DEMO_EMPLOYEE_UNIT) : undefined;
    if (!item) {
      throw new HttpException(stubProblem(404, 'PARAMETER_NOT_FOUND', 'פרטי הפרמטר אינם זמינים להצגה.'), 404);
    }
    return {
      ...STUB_MARKER, sourceVersion: DEMO_PARAMETER_SOURCE, item,
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }
}
