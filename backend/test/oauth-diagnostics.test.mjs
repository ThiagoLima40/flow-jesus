import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeErrorBody } from '../src/oauth-diagnostics.mjs';
import { authorizeCode } from '../src/oauth.mjs';

test('diagnostic body retains provider explanation and removes credentials and tokens', () => {
  const body = safeErrorBody({
    error: 'invalid_grant',
    message: 'Client authentication failed: secret+/ code-value short-token',
    hint: 'secret%2B%2F code=other-code Bearer another-token',
    access_token: 'short-token', refresh_token: 'private-refresh',
    request: { client_secret: 'secret+/' },
    arbitrary: 'private-data',
  }, ['secret+/', 'code-value']);
  const output = JSON.stringify(body);
  assert.equal(body.error, 'invalid_grant');
  assert.match(body.message, /Client authentication failed/);
  for (const secret of ['secret+/', 'secret%2B%2F', 'code-value', 'short-token', 'other-code', 'another-token', 'private-refresh', 'private-data']) assert.ok(!output.includes(secret));
  assert.equal(safeErrorBody('<html>secret</html>'), '[body omitted: unexpected format]');
});

test('timeout and redirects produce one safe diagnostic and never retry the code', async t => {
  const logs = [];
  t.mock.method(console, 'error', value => logs.push(value));
  const store = { acquire: async () => true, release: async () => {}, saveDiagnostic: async () => {} };
  const cfg = { baseUrl: 'https://melhorenvio.com.br', clientId: '29688', clientSecret: 'private-secret', userAgent: 'test', redirectUri: 'https://example.com/callback' };
  let calls = 0;
  await assert.rejects(authorizeCode(store, cfg, 'private-code', async () => { calls++; throw new DOMException('private-secret private-code', 'TimeoutError'); }));
  assert.equal(calls, 1);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].http_status, null);
  assert.match(logs[0].message, /Tempo limite/);
  await assert.rejects(authorizeCode(store, cfg, 'private-code', async () => { calls++; return new Response(null, { status: 302, headers: { Location: 'https://example.com/?code=private-code' } }); }));
  assert.equal(calls, 2);
  assert.equal(logs.length, 2);
  assert.equal(logs[1].http_status, 302);
  assert.doesNotMatch(JSON.stringify(logs), /private-code|private-secret/);
});

test('exchange logs HTTP status and sanitized error but keeps browser message generic', async t => {
  const logs = [];
  t.mock.method(console, 'error', value => logs.push(value));
  const store = { acquire: async () => true, release: async () => {}, save: async () => assert.fail('must not persist') };
  const cfg = { baseUrl: 'https://melhorenvio.com.br', clientId: '29688', clientSecret: 'private-secret', userAgent: 'test', redirectUri: 'https://example.com/callback' };
  await assert.rejects(authorizeCode(store, cfg, 'private-code', async () => Response.json({ error: 'invalid_client', message: 'Client authentication failed', client_secret: 'private-secret', code: 'private-code', access_token: 'private-token' }, { status: 401 })), /Não foi possível concluir/);
  assert.equal(logs[0].http_status, 401);
  assert.equal(logs.length, 1);
  assert.match(logs[0].message, /invalid_client/);
  assert.doesNotMatch(JSON.stringify(logs), /private-secret|private-code|private-token/);
});
