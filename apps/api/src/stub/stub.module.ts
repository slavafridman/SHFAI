import { Controller, Get, Header, HttpException, Module, Param, Query, UseFilters } from '@nestjs/common';
import { parsePersonalShiftQuery, projectPersonalShift, selectPersonalShifts } from '../personal-shifts/personal-shifts.js';
import { createSyntheticShiftFacts } from './fixtures.js';
import { syntheticPersonalMessages } from './message-fixtures.js';
import { STUB_MARKER as marker, stubProblem as problem, StubProblemFilter } from './stub-http.js';
import { StubEmployeesController } from './employees.controller.js';
import { StubOperationalController } from './operational.controller.js';
import { StubBreaksController } from './breaks.controller.js';
import { StubShiftPreviewsController } from './shift-previews.controller.js';
import { StubReplacementController } from './replacement.controller.js';
import { StubStaffingController } from './staffing.controller.js';
import { StubExceptionsController } from './exceptions.controller.js';

const scope = { actorEmployeeId: '00000001', canViewBaseline: false };

@Controller('api/v1')
@UseFilters(StubProblemFilter)
export class StubController {
  @Get('me')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  me() {
    return {
      ...marker, actorId: 'synthetic-demo-actor', employeeId: scope.actorEmployeeId,
      displayName: 'עובד הדגמה — נתונים סינתטיים', businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get('me/capabilities')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  capabilities() {
    return {
      ...marker,
      personalShifts: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        preview: { enabled: true, reason: 'SYNTHETIC_POLICY_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      personalMessages: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      employees: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      integrationAvailable: false,
      exceptions: {
        read: { enabled: true, reason: 'SYNTHETIC_SCENARIO_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      staffing: {
        read: { enabled: true, reason: 'SYNTHETIC_SCENARIO_ONLY' },
        preview: { enabled: true, reason: 'SYNTHETIC_POLICY_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      replacement: {
        read: { enabled: true, reason: 'SYNTHETIC_SCENARIO_ONLY' },
        preview: { enabled: true, reason: 'SYNTHETIC_POLICY_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      breaks: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        preview: { enabled: true, reason: 'SYNTHETIC_POLICY_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      operationalReads: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
    };
  }

  @Get('me/shifts')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  shifts(@Query() query: unknown) {
    const selection = selectPersonalShifts(createSyntheticShiftFacts(), scope, parsePersonalShiftQuery(query));
    if (selection.hasMore) {
      throw new HttpException(problem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return {
      ...marker, items: selection.items, nextCursor: null,
      fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem',
    };
  }

  @Get('me/messages')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  messages(@Query() query: Record<string, unknown>) {
    const status = query['status'] ?? 'all';
    const rawLimit = query['limit'] ?? '25';
    if (Object.keys(query).some(key => !['status', 'limit'].includes(key))
      || typeof status !== 'string' || !['all', 'unread', 'read', 'unknown'].includes(status)
      || typeof rawLimit !== 'string' || !/^[1-9]\d{0,2}$/.test(rawLimit) || Number(rawLimit) > 100) {
      throw new HttpException(problem(400, 'INVALID_QUERY', 'מסנן ההודעות אינו תקין.'), 400);
    }
    const messages = syntheticPersonalMessages(scope.actorEmployeeId).filter(message =>
      status === 'all' || (status === 'unread' && message.isRead === false)
      || (status === 'read' && message.isRead === true) || (status === 'unknown' && message.isRead === null));
    if (messages.length > Number(rawLimit)) {
      throw new HttpException(problem(503, 'STUB_PAGINATION_UNAVAILABLE', 'יש להגדיל את מגבלת התוצאות; דפדוף אינו זמין בהדגמה.'), 503);
    }
    return { ...marker, items: messages, nextCursor: null, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }

  @Get('me/messages/:id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  message(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(problem(400, 'INVALID_QUERY', 'מזהה ההודעה או הבקשה אינם תקינים.'), 400);
    }
    const item = syntheticPersonalMessages(scope.actorEmployeeId).find(message => message.id === id);
    if (!item) {
      throw new HttpException(problem(404, 'MESSAGE_NOT_FOUND', 'ההודעה אינה זמינה להצגה.'), 404);
    }
    return { ...marker, item, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }
  @Get('shifts/:id')
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  detail(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    if (!/^[1-9]\d{0,37}$/.test(id) || Object.keys(query).length > 0) {
      throw new HttpException(problem(400, 'INVALID_QUERY', 'מזהה המשמרת או הבקשה אינם תקינים.'), 400);
    }
    const item = createSyntheticShiftFacts()
      .map(fact => projectPersonalShift(fact, scope))
      .find(candidate => candidate?.id === id);
    if (!item) {
      throw new HttpException(problem(404, 'SHIFT_NOT_FOUND', 'המשמרת אינה זמינה להצגה.'), 404);
    }
    return { ...marker, item, fetchedAt: new Date().toISOString(), businessTimeZone: 'Asia/Jerusalem' };
  }
}

@Module({ controllers: [StubController, StubEmployeesController, StubOperationalController, StubBreaksController, StubShiftPreviewsController, StubReplacementController, StubStaffingController, StubExceptionsController] })
export class StubModule {}
