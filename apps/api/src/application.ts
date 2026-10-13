import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

export async function createApplication(): Promise<NestFastifyApplication> {
  const application = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 64 * 1024, requestTimeout: 10_000 }),
    { logger: ['error', 'warn', 'log'] },
  );
  application.enableShutdownHooks();
  return application;
}
