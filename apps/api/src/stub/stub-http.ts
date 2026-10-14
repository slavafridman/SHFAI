import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { PersonalShiftsError } from '../personal-shifts/personal-shifts.js';

export const STUB_MARKER = { mode: 'stub', synthetic: true, authenticated: false } as const;

export function stubProblem(status: number, code: string, title: string) {
  return { type: 'about:blank', status, code, title, ...STUB_MARKER };
}

@Catch(PersonalShiftsError, HttpException)
export class StubProblemFilter implements ExceptionFilter {
  catch(error: PersonalShiftsError | HttpException, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status = error instanceof PersonalShiftsError
      ? error.code === 'INVALID_QUERY' ? 400 : 503
      : error.getStatus();
    const payload = error instanceof PersonalShiftsError
      ? { ...stubProblem(status, error.code, error.message), errors: error.errors }
      : error.getResponse();
    Logger.warn(JSON.stringify({ event: 'stub_request_rejected', status }), 'StubApi');
    void reply.code(status).header('Cache-Control', 'no-store')
      .header('X-SHF-Data-Source', 'synthetic-stub')
      .type('application/problem+json').send(payload);
  }
}
