import { Controller, Get, Header, HttpException, Query, UseFilters } from '@nestjs/common';
import { calculateStaffingReport, DemoReportError, parseReportQuery } from './report-calculation.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/reports')
@UseFilters(StubProblemFilter)
export class StubReportsController {
  @Get('staffing-forecast')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  report(@Query() query: unknown) {
    try {
      return {
        ...STUB_MARKER, item: calculateStaffingReport(parseReportQuery(query)),
        fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
      };
    } catch (error: unknown) {
      if (!(error instanceof DemoReportError)) { throw error; }
      const status = error.code === 'INVALID_REPORT_QUERY' ? 400 : 503;
      throw new HttpException(stubProblem(status, error.code, error.message), status);
    }
  }
}
