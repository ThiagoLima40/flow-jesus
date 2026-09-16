import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logOAuthFailure } from '../src/oauth-diagnostics.mjs';
import { authorizeCode } from '../src/oauth.mjs';

test('diagnostics discard arbitrary provider messages, headers and credentials', t => {
  const logs = [];
  t.mock.method(console, 'error', value => logs.push(value));
  logOAuthFailure('unknown-private-stage', 'private-status', { refresh_token: 'private-refresh', message: 'Bearer private-token' });
  assert.deepEqual(logs, [{ event: 'melhor_envio_oauth_diagnostic', http_status: null, stage: 'oauth_failure' }]);
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
  assert.equal(logs[0].stage, 'token_exchange');
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
  await assert.rejects(authorizeCode(store, cfg, 'private-code', async () => Response.json({ error: 'invalid_client', message: 'Client authentication failed', client_secret: 'private-secret', code: 'private-code', access_token: 'private-token' }, { status: 401 })), error => { assert.equal(error.message, 'Não foi possível concluir a autorização. Inicie novamente.'); return true; });
  assert.equal(logs[0].http_status, 401);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].stage, 'token_exchange');
  assert.doesNotMatch(JSON.stringify(logs), /private-secret|private-code|private-token/);
});
