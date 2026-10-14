import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApplication } from '../src/application.js';

const url = '/api/v1/auth/sso-simulation';
const claims = { user: 'synthetic-user', domain_user: 'DEMO\\synthetic-domain-user' };

test('SSO claims are accepted only as unverified simulation with no cookie, session, permissions or external access', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const response = await app.inject({ method: 'POST', url, payload: claims });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-shf-data-source'], 'synthetic-stub');
    assert.equal(response.headers['set-cookie'], undefined);
    const body = JSON.parse(response.body);
    assert.deepEqual(body, {
      mode: 'stub', synthetic: true, authenticated: false,
      simulationOnly: true, claimsAccepted: true, identityAssurance: 'unverified',
      sessionCreated: false, permissions: [], oracleAccess: false, nemoContacted: false,
      nextStep: 'VERIFIED_SSO_REQUIRED', fetchedAt: body.fetchedAt,
    });
    assert.ok(Number.isFinite(Date.parse(body.fetchedAt)));
    assert.ok(!response.body.includes(claims.user));
    assert.ok(!response.body.includes('synthetic-domain-user'));
  } finally { await app.close(); }
});

test('simulation requires exactly two bounded nonblank string claims and reports invalid input without echoing it', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    for (const payload of [
      {}, [], { user: claims.user }, { domain_user: claims.domain_user },
      { ...claims, user: '' }, { ...claims, domain_user: '   ' },
      { ...claims, user: 1255 }, { ...claims, domain_user: null },
      { ...claims, user: 'x'.repeat(129) }, { ...claims, domain_user: 'x'.repeat(129) },
      { ...claims, user: 'synthetic-private-value\n' },
      { ...claims, domain_user: 'synthetic-private-value\u0000' },
      { ...claims, role: 'ADMIN' }, { ...claims, employeeId: '1255' },
      { ...claims, authenticated: true }, { ...claims, password: 'synthetic-private-value' },
    ]) {
      const response = await app.inject({ method: 'POST', url, payload });
      assert.equal(response.statusCode, 400);
      const body = JSON.parse(response.body);
      assert.equal(body.code, 'INVALID_SSO_SIMULATION');
      assert.equal(body.authenticated, false);
      assert.equal(body.synthetic, true);
      assert.equal(response.headers['cache-control'], 'no-store');
      assert.equal(response.headers['set-cookie'], undefined);
      assert.ok(!response.body.includes('synthetic-private-value'));
    }
    assert.equal((await app.inject({
      method: 'POST', url, payload: { user: 'u'.repeat(128), domain_user: 'd'.repeat(128) },
    })).statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: url + '?env=t', payload: claims })).statusCode, 400);
  } finally { await app.close(); }
});

test('accepted fields do not change demo actor, capabilities or enable a real remark write', async () => {
  const app = await createApplication({ SHF_STUB_API: 'true' });
  try {
    await app.init();
    const before = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me' })).body);
    const capabilities = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me/capabilities' })).body);
    assert.equal(capabilities.ssoSimulation.preview.enabled, true);
    assert.equal(capabilities.ssoSimulation.write.enabled, false);
    for (const user of ['synthetic-admin', 'synthetic-other-user']) {
      const response = await app.inject({
        method: 'POST', url, payload: { user, domain_user: user },
        headers: { authorization: 'Bearer synthetic-untrusted-token', cookie: 'user=synthetic-untrusted-user' },
      });
      assert.equal(JSON.parse(response.body).authenticated, false);
      assert.equal(response.headers['set-cookie'], undefined);
      assert.deepEqual(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me' })).body), before);
      assert.deepEqual(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/me/capabilities' })).body), capabilities);
    }
    assert.equal((await app.inject({
      method: 'PATCH', url: '/api/v1/shifts/1255/remark', payload: { remark: 'synthetic-remark' },
    })).statusCode, 404);
  } finally { await app.close(); }
});

test('simulation route is absent in real mode and cannot coexist with enabled Oracle access', async () => {
  const app = await createApplication({});
  try {
    await app.init();
    assert.equal((await app.inject({ method: 'POST', url, payload: claims })).statusCode, 404);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: claims })).statusCode, 404);
  } finally { await app.close(); }
  await assert.rejects(createApplication({ SHF_STUB_API: 'true', ORACLE_ENABLED: 'true' }),
    /Stub API cannot be enabled together with Oracle access/);
});
