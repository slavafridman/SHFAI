import { Body, Controller, Get, Header, HttpCode, HttpException, Param, Post, Query, UseFilters } from '@nestjs/common';
import { syntheticBreakView } from './break-fixtures.js';
import { BreakPreviewError, parseBreakProposal, previewBreakChange } from './break-preview.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/shifts/:id')
@UseFilters(StubProblemFilter)
export class StubBreaksController {
  private view(id: string, query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה המשמרת או הבקשה אינם תקינים.'), 400);
    }
    const view = syntheticBreakView(id);
    if (view === null) {
      throw new HttpException(stubProblem(404, 'SHIFT_NOT_FOUND', 'המשמרת אינה זמינה להצגה.'), 404);
    }
    return view;
  }

  @Get('breaks')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  breaks(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return { ...STUB_MARKER, item: this.view(id, query), fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }

  @Post('break-change-previews')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  preview(@Param('id') id: string, @Query() query: Record<string, unknown>, @Body() body: unknown) {
    const view = this.view(id, query);
    try {
      const item = previewBreakChange(view, parseBreakProposal(body));
      return { ...STUB_MARKER, item, shiftId: id, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
    } catch (error: unknown) {
      if (!(error instanceof BreakPreviewError)) { throw error; }
      const status = error.code === 'INVALID_PROPOSAL' ? 400
        : error.code === 'BREAK_PREVIEW_UNAVAILABLE' ? 503 : error.code === 'BREAK_NOT_FOUND' ? 404 : 422;
      throw new HttpException({
        ...stubProblem(status, error.code, error.message),
        errors: error.field === null ? [] : [{ field: error.field, code: error.code, message: error.message }],
      }, status);
    }
  }
}
