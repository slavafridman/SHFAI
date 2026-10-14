import { Controller, Get, Header, HttpException, Param, Query, UseFilters } from '@nestjs/common';
import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import { DEMO_INTERNAL_JOB_SOURCE, isInternalJobStatus, matchesInternalJobStatus } from './internal-job-contracts.js';
import { syntheticInternalJobs } from './internal-job-fixtures.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/internal-jobs')
@UseFilters(StubProblemFilter)
export class StubInternalJobsController {
  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    const search = query['search'] ?? '';
    const status = query['status'] ?? 'all';
    const limit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => !['search', 'status', 'limit'].includes(key))
      || typeof search !== 'string' || search.length > 80 || !isInternalJobStatus(status)
      || typeof limit !== 'string' || !/^[1-9]\d{0,2}$/.test(limit) || Number(limit) > 100) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן התפקידים אינו תקין.'), 400);
    }
    const normalized = search.trim().toLocaleLowerCase('he');
    const items = syntheticInternalJobs().filter(item => item.orgUnit.id === DEMO_EMPLOYEE_UNIT
      && matchesInternalJobStatus(item.active, status)
      && (item.id.includes(normalized) || item.name.toLocaleLowerCase('he').includes(normalized)));
    if (items.length > Number(limit)) {
      throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return {
      ...STUB_MARKER, sourceVersion: DEMO_INTERNAL_JOB_SOURCE, unitId: DEMO_EMPLOYEE_UNIT,
      search: normalized, status, items, nextCursor: null,
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה התפקיד או הבקשה אינם תקינים.'), 400);
    }
    const item = syntheticInternalJobs().find(candidate => candidate.id === id && candidate.orgUnit.id === DEMO_EMPLOYEE_UNIT);
    if (!item) {
      throw new HttpException(stubProblem(404, 'INTERNAL_JOB_NOT_FOUND', 'פרטי התפקיד אינם זמינים להצגה.'), 404);
    }
    return {
      ...STUB_MARKER, sourceVersion: DEMO_INTERNAL_JOB_SOURCE, item,
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }
}
