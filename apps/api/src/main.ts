import { Logger } from '@nestjs/common';
import { createApplication } from './application.js';
import { parsePort } from './configuration.js';

async function bootstrap(): Promise<void> {
  const port = parsePort(process.env['PORT']);
  const application = await createApplication();
  await application.listen(port, '127.0.0.1');
  Logger.log(`Local foundation listening on http://127.0.0.1:${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup failure.';
  Logger.error(message, undefined, 'Bootstrap');
  process.exitCode = 1;
});
