import { Logger } from '@nestjs/common';
import { createApplication } from './application.js';
import { parsePort } from './configuration.js';

async function bootstrap(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1 || (arguments_.length === 1 && arguments_[0] !== '--stub')) {
    throw new Error('Only the optional --stub startup argument is supported.');
  }
  const port = parsePort(process.env['PORT']);
  const application = await createApplication(arguments_.length === 1
    ? { ...process.env, SHF_STUB_API: 'true' } : process.env);
  await application.listen(port, '127.0.0.1');
  Logger.log(`Local API listening on http://127.0.0.1:${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup failure.';
  Logger.error(message, undefined, 'Bootstrap');
  process.exitCode = 1;
});
