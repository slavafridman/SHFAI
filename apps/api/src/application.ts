import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { StubModule } from './stub/stub.module.js';

export async function createApplication(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<NestFastifyApplication> {
  const mode = environment['SHF_STUB_API'];
  if (mode !== undefined && mode !== 'true' && mode !== 'false') {
    throw new Error('SHF_STUB_API must be true or false.');
  }
  if (mode === 'true' && environment['ORACLE_ENABLED'] !== undefined && environment['ORACLE_ENABLED'] !== 'false') {
    throw new Error('Stub API cannot be enabled together with Oracle access.');
  }
  if (mode === 'true') {
    Logger.warn('SYNTHETIC STUB API: no authentication, Oracle access or real business results.', 'StubApi');
  }
  const application = await NestFactory.create<NestFastifyApplication>(
    mode === 'true' ? StubModule : AppModule,
    new FastifyAdapter({ bodyLimit: 64 * 1024, requestTimeout: 10_000 }),
    { logger: ['error', 'warn', 'log'] },
  );
  application.enableShutdownHooks();
  return application;
}
