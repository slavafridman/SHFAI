import { Body, Controller, Get, Header, HttpCode, HttpException, Param, Post, Query, UseFilters } from '@nestjs/common';
import { DEMO_EMPLOYEE_UNIT } from './employee-fixtures.js';
import type { DemoStaffingRequest } from './staffing-contracts.js';
import { STAFFING_CLOCK_LOCAL, syntheticStaffingCandidates, syntheticStaffingEligibilityFacts, syntheticStaffingRequests } from './staffing-fixtures.js';
import { previewStaffingCandidate } from './staffing-preview.js';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

function limit(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d{0,2}$/.test(value) || Number(value) > 100) {
    throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מגבלת בקשות או מועמדים אינה תקינה.'), 400);
  }
  return Number(value);
}
function requireFits(count: number, maximum: number): void {
  if (count > maximum) {
    throw new HttpException(stubProblem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
  }
}
function envelope() {
  return {
    ...STUB_MARKER, clockLocal: STAFFING_CLOCK_LOCAL,
    fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
  };
}

@Controller('api/v1/staffing-requests')
@UseFilters(StubProblemFilter)
export class StubStaffingController {
  @Post(':id/eligibility-previews')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  preview(@Param('id') id: string, @Query() query: Record<string, unknown>, @Body() body: unknown) {
    if (Object.keys(query).length || typeof body !== 'object' || body === null || Array.isArray(body)
      || Object.keys(body).length !== 1 || !('candidateId' in body)
      || typeof body.candidateId !== 'string' || !/^staff-candidate-\d{1,3}$/.test(body.candidateId)) {
      throw new HttpException(stubProblem(400, 'INVALID_PROPOSAL', 'יש לבחור מועמד לבקשה בלבד; אין אפשרות להעביר אישור או קיבולת.'), 400);
    }
    const request = this.requireRequest(id);
    const candidate = syntheticStaffingCandidates(id).find(item => item.id === body.candidateId);
    if (!candidate) {
      throw new HttpException(stubProblem(404, 'STAFFING_CANDIDATE_NOT_FOUND', 'המועמד אינו זמין בבקשת ההדגמה.'), 404);
    }
    return {
      ...envelope(), item: previewStaffingCandidate(request, candidate, syntheticStaffingEligibilityFacts(candidate.id)),
    };
  }

  private requireRequest(id: string): DemoStaffingRequest {
    if (!/^[1-9]\d{0,37}$/.test(id)) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מזהה הבקשה אינו תקין.'), 400);
    }
    const item = syntheticStaffingRequests().find(request => request.id === id && request.unitId === DEMO_EMPLOYEE_UNIT);
    if (!item) {
      throw new HttpException(stubProblem(404, 'STAFFING_REQUEST_NOT_FOUND', 'הבקשה אינה זמינה בתרחיש ההדגמה.'), 404);
    }
    return item;
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  list(@Query() query: Record<string, unknown>) {
    const kind = query['kind'] ?? 'all';
    if (Object.keys(query).some(key => !['kind', 'limit'].includes(key))
      || typeof kind !== 'string' || !['all', 'reinforcement', 'time-change', 'reduction'].includes(kind)) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן סוג הבקשה אינו תקין.'), 400);
    }
    const maximum = limit(query['limit'] ?? '25');
    const items = syntheticStaffingRequests().filter(request => request.unitId === DEMO_EMPLOYEE_UNIT
      && (kind === 'all' || request.kind === kind)).sort((a, b) => a.startLocal.localeCompare(b.startLocal) || a.id.localeCompare(b.id));
    requireFits(items.length, maximum);
    return { ...envelope(), items, nextCursor: null };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן פרטי הבקשה אינו נתמך.'), 400);
    }
    return { ...envelope(), item: this.requireRequest(id) };
  }

  @Get(':id/candidates')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  candidates(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).some(key => key !== 'limit')) {
      throw new HttpException(stubProblem(400, 'INVALID_QUERY', 'מסנן מועמדי בקשה אינו נתמך.'), 400);
    }
    this.requireRequest(id);
    const maximum = limit(query['limit'] ?? '25');
    const items = syntheticStaffingCandidates(id);
    requireFits(items.length, maximum);
    return { ...envelope(), requestId: id, items, nextCursor: null };
  }
}
