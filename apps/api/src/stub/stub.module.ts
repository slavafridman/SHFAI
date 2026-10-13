import {
  ArgumentsHost, Catch, Controller, ExceptionFilter, Get, Header, HttpException,
  Logger, Module, Param, Query, UseFilters,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { parsePersonalShiftQuery, PersonalShiftsError, projectPersonalShift, selectPersonalShifts } from '../personal-shifts/personal-shifts.js';
import { createSyntheticShiftFacts } from './fixtures.js';
import { syntheticPersonalMessages } from './message-fixtures.js';

const marker = { mode: 'stub', synthetic: true, authenticated: false } as const;
const scope = { actorEmployeeId: '00000001', canViewBaseline: false };

function problem(status: number, code: string, title: string) {
  return { type: 'about:blank', status, code, title, ...marker };
}

@Catch(PersonalShiftsError, HttpException)
class StubProblemFilter implements ExceptionFilter {
  catch(error: PersonalShiftsError | HttpException, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status = error instanceof PersonalShiftsError
      ? error.code === 'INVALID_QUERY' ? 400 : 503
      : error.getStatus();
    const payload = error instanceof PersonalShiftsError
      ? { ...problem(status, error.code, error.message), errors: error.errors }
      : error.getResponse();
    Logger.warn(JSON.stringify({ event: 'stub_request_rejected', status }), 'StubApi');
    void reply.code(status).header('Cache-Control', 'no-store')
      .header('X-SHF-Data-Source', 'synthetic-stub')
      .type('application/problem+json').send(payload);
  }
}

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
        preview: { enabled: false, reason: 'NOT_IMPLEMENTED' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      personalMessages: {
        read: { enabled: true, reason: 'SYNTHETIC_DEMO_ONLY' },
        write: { enabled: false, reason: 'READ_ONLY_STUB' },
      },
      integrationAvailable: false,
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

@Module({ controllers: [StubController] })
export class StubModule {}
