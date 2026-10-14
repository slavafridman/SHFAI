import { Body, Controller, Get, Header, HttpCode, HttpException, Param, Post, Query, UseFilters } from '@nestjs/common';
import { parseShiftProposal, previewShiftChange, ShiftPreviewError, syntheticShiftContext } from './shift-preview.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1/shifts/:id')
@UseFilters(StubProblemFilter)
export class StubShiftPreviewsController {
  private context(id: string, query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה המשמרת או הבקשה אינם תקינים.'), 400);
    }
    const context = syntheticShiftContext(id);
    if (context === null) {
      throw new HttpException(stubProblem(404, 'SHIFT_NOT_FOUND', 'המשמרת אינה זמינה להצגה.'), 404);
    }
    return context;
  }

  @Get('shift-preview-context')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  source(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return { ...STUB_MARKER, item: this.context(id, query), fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }

  @Post('shift-change-previews')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  preview(@Param('id') id: string, @Query() query: Record<string, unknown>, @Body() body: unknown) {
    const context = this.context(id, query);
    try {
      const item = previewShiftChange(context, parseShiftProposal(body));
      return { ...STUB_MARKER, item, shiftId: id, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
    } catch (error: unknown) {
      if (!(error instanceof ShiftPreviewError)) { throw error; }
      const status = error.code === 'INVALID_SHIFT_PROPOSAL' ? 400 : error.code === 'SHIFT_PREVIEW_UNAVAILABLE' ? 503 : 422;
      throw new HttpException({
        ...stubProblem(status, error.code, error.message),
        errors: error.field === null ? [] : [{ field: error.field, code: error.code, message: error.message }],
      }, status);
    }
  }
}
