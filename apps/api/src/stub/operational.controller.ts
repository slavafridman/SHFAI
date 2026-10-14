import { Controller, Get, Header, Query, UseFilters } from '@nestjs/common';
import { syntheticAttendance, syntheticOperationalShifts } from './operational-fixtures.js';
import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import { STUB_MARKER, StubProblemFilter } from './stub-http.js';

@Controller('api/v1')
@UseFilters(StubProblemFilter)
export class StubOperationalController {
  @Get('shifts')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  shifts(@Query() query: unknown) {
    return {
      ...STUB_MARKER, unitId: DEMO_EMPLOYEE_UNIT, items: syntheticOperationalShifts(query),
      nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get('attendance')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  attendance(@Query() query: unknown) {
    return {
      ...STUB_MARKER, unitId: DEMO_EMPLOYEE_UNIT, items: syntheticAttendance(query),
      nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }
}
