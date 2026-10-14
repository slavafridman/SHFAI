import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';
import { parsePort } from '../src/configuration.js';

test('local foundation returns 404 for unimplemented business reads and writes', async () => {
  const application = await createApplication();
  try {
    await application.init();
    for (const url of [
      '/', '/me', '/me/capabilities', '/me/shifts', '/shifts',
      '/api/v1/me', '/api/v1/me/capabilities', '/api/v1/me/shifts',
      '/api/v1/shifts/9007199254740993',
      '/api/v1/me/messages', '/api/v1/me/messages/8007199254740993',
      '/api/v1/employees', '/api/v1/employees/00000001',
    ]) {
      const response = await application.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 404, url);
    }
    for (const url of ['/shifts', '/me/messages', '/breaks', '/api/v1/shifts']) {
      const response = await application.inject({
        method: 'POST',
        url,
        payload: { employeeId: 'synthetic-only' },
      });
      assert.equal(response.statusCode, 404, url);
    }
  } finally {
    await application.close();
  }
});

test('port configuration accepts only explicit valid port numbers', () => {
  assert.equal(parsePort(undefined), 3000);
  assert.equal(parsePort('3100'), 3100);
  assert.equal(parsePort('65535'), 65535);
  for (const input of ['', '0', '-1', '65536', '3.5', '3000abc', ' 3000', '1e3']) {
    assert.throws(() => parsePort(input), /PORT must be an integer/);
  }
});
