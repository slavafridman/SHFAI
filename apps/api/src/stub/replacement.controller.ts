import { Body, Controller, Get, Header, HttpCode, HttpException, Post, Query, UseFilters } from '@nestjs/common';
import { syntheticReplacementScenario } from './replacement-fixtures.js';
import { previewReplacement } from './replacement-preview.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

@Controller('api/v1')
@UseFilters(StubProblemFilter)
export class StubReplacementController {
  @Get('replacement-candidates')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  candidates(@Query() query: Record<string, unknown>) {
    const limit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => key !== 'limit') || typeof limit !== 'string'
      || !/^[1-9]\d{0,2}$/.test(limit) || Number(limit) > 100) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן מועמדי ההדגמה אינו תקין.'), 400);
    }
    const scenario = syntheticReplacementScenario();
    if (scenario.rows.length > Number(limit)) {
      throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return {
      ...STUB_MARKER, source: scenario.source, items: scenario.rows.map(row => row.candidate),
      policyVersion: 'synthetic-replacement-policy-1', clockLocal: '2026-10-13T08:00:00',
      nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Post('replacement-eligibility-previews')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  preview(@Query() query: Record<string, unknown>, @Body() body: unknown) {
    if (Object.keys(query).length || typeof body !== 'object' || body === null || Array.isArray(body)
      || Object.keys(body).length !== 1 || !('candidateId' in body)
      || typeof body.candidateId !== 'string' || !/^candidate-\d{1,3}$/.test(body.candidateId)) {
      throw new HttpException(stubProblem(400, 'INVALID_PROPOSAL', 'יש לבחור מזהה מועמד הדגמה בלבד.'), 400);
    }
    const scenario = syntheticReplacementScenario();
    const row = scenario.rows.find(item => item.candidate.id === body.candidateId);
    if (row === undefined) {
      throw new HttpException(stubProblem(404, 'CANDIDATE_NOT_FOUND', 'המועמד אינו זמין בתרחיש ההדגמה.'), 404);
    }
    return {
      ...STUB_MARKER, item: previewReplacement(scenario.source, row.candidate, row.facts),
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }
}
