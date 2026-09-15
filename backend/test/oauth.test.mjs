import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import { handle, scheduled } from '../src/worker.mjs';
import { config } from '../src/config.mjs';
import { random, hash, b64, decrypt, encrypt } from '../src/crypto.mjs';
import { Store } from '../src/store.mjs';
import { authorizeCode, refreshIfNeeded, getAccessToken } from '../src/oauth.mjs';
const origin = 'https://flowjesus-melhor-envio.test.workers.dev';
const secrets = {
  MELHOR_ENVIO_SETUP_MODE: 'false', MELHOR_ENVIO_ENVIRONMENT: 'sandbox',
  MELHOR_ENVIO_REDIRECT_URI: `${origin}/api/melhor-envio/callback`,
  MELHOR_ENVIO_CLIENT_ID: 'test-client', MELHOR_ENVIO_CLIENT_SECRET: 'test-secret',
  MELHOR_ENVIO_ADMIN_PASSWORD: random(), MELHOR_ENVIO_TOKEN_KEY: b64(crypto.getRandomValues(new Uint8Array(32))),
  MELHOR_ENVIO_USER_AGENT: 'FlowJesus (test@example.com)', MELHOR_ENVIO_SCOPES: 'shipping-calculate', MELHOR_ENVIO_ORIGIN_POSTAL_CODE: '01001000',
};
const authorization = `Basic ${btoa(`admin:${secrets.MELHOR_ENVIO_ADMIN_PASSWORD}`)}`;
const tokenBody = suffix => ({ access_token: `private-access-${suffix}`, refresh_token: `private-refresh-${suffix}`, token_type: 'Bearer', expires_in: 2592000 });
let mf, env, cfg, store;
before(async () => {
  mf = new Miniflare({ modules: true, scriptPath: new URL('../src/worker.mjs', import.meta.url).pathname, compatibilityDate: '2026-08-01', d1Databases: ['DB'], bindings: secrets });
  const DB = await mf.getD1Database('DB');
  const schema = await readFile(new URL('../migrations/0001_oauth.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').filter(s => s.trim())) await DB.prepare(statement).run();
  env = { ...secrets, DB }; cfg = await config(env); store = new Store(DB);
});
after(async () => { await mf?.dispose(); });
beforeEach(async () => {
  await env.DB.batch([env.DB.prepare('DELETE FROM oauth_states'), env.DB.prepare('DELETE FROM oauth_connections')]);
});
const req = (path, options) => new Request(`${origin}${path}`, options);
async function begin() {
  const response = await mf.dispatchFetch(`${origin}/api/melhor-envio/authorize`, { redirect: 'manual', headers: { Authorization: authorization } });
  assert.equal(response.status, 302);
  const url = new URL(response.headers.get('location'));
  assert.equal(url.origin, 'https://sandbox.melhorenvio.com.br');
  assert.equal(url.searchParams.get('redirect_uri'), secrets.MELHOR_ENVIO_REDIRECT_URI);
  assert.equal(url.searchParams.has('client_secret'), false);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  return { state: url.searchParams.get('state'), cookie: response.headers.get('set-cookie').split(';')[0] };
}
const callback = (flow, extra = 'code=test-code') => req(`/api/melhor-envio/callback?state=${flow.state}&${extra}`, { headers: { Cookie: flow.cookie } });
async function seed() {
  await authorizeCode(store, cfg, 'code', async () => Response.json(tokenBody('initial')));
}
async function due() { await env.DB.prepare('UPDATE oauth_connections SET expires_at = ? WHERE id = ?').bind(Date.now() + 86400000, cfg.connectionId).run(); }

test('Worker runtime and D1 health, setup mode and admin protection', async () => {
  const health = await mf.dispatchFetch(`${origin}/health`);
  assert.equal(health.status, 200); assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal((await handle(req('/api/melhor-envio/status'), env)).status, 401);
  assert.equal((await handle(req('/api/melhor-envio/authorize'), env)).status, 401);
  const setup = { ...env, MELHOR_ENVIO_SETUP_MODE: 'true', MELHOR_ENVIO_CLIENT_SECRET: '' };
  assert.equal((await handle(req('/api/melhor-envio/authorize'), setup)).status, 503);
  assert.equal((await handle(req('/'), setup)).status, 200);
  await assert.rejects(config({ ...env, MELHOR_ENVIO_REDIRECT_URI: 'http://example.com/api/melhor-envio/callback' }));
  await assert.rejects(config({ ...env, MELHOR_ENVIO_TOKEN_KEY: 'invalid' }));
});

test('OAuth state is hashed, browser-bound, atomic and survives independent requests', async () => {
  const flow = await begin();
  const rows = await env.DB.prepare('SELECT * FROM oauth_states').all();
  assert.equal(rows.results.length, 1); assert.equal(rows.results[0].state_hash, await hash(flow.state));
  assert.doesNotMatch(JSON.stringify(rows.results), new RegExp(flow.state));
  assert.equal((await handle(req(`/api/melhor-envio/callback?state=${flow.state}&code=x`), env)).status, 400);
  let exchanges = 0;
  const provider = async (url, options) => {
    exchanges++; assert.equal(url, `${cfg.baseUrl}/oauth/token`);
    assert.equal(new URLSearchParams(options.body).get('redirect_uri'), secrets.MELHOR_ENVIO_REDIRECT_URI);
    assert.equal(new URLSearchParams(options.body).get('code'), 'test-code');
    assert.equal(options.redirect, 'manual');
    assert.equal(new URLSearchParams(options.body).get('grant_type'), 'authorization_code');
    assert.equal(new URLSearchParams(options.body).get('client_secret'), secrets.MELHOR_ENVIO_CLIENT_SECRET);
    assert.equal(options.headers['User-Agent'], secrets.MELHOR_ENVIO_USER_AGENT);
    return Response.json(tokenBody('initial'));
  };
  const responses = await Promise.all([handle(callback(flow), env, provider), handle(callback(flow), env, provider)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]); assert.equal(exchanges, 1);
  for (const response of responses) assert.doesNotMatch(await response.text(), /private-access|private-refresh|test-secret/);
  const row = await new Store(env.DB).read(cfg.connectionId);
  assert.equal(row.status, 'connected'); assert.doesNotMatch(row.encrypted_tokens, /private-access|private-refresh/);
  assert.equal((await decrypt(row.encrypted_tokens, cfg.tokenKey, cfg.connectionId)).refresh_token, 'private-refresh-initial');
});

test('expired state, duplicate parameters and denied authorization cannot exchange codes', async () => {
  const expired = await begin();
  await env.DB.prepare('UPDATE oauth_states SET expires_at = 1').run();
  const provider = async () => { assert.fail('provider must not be called'); };
  assert.equal((await handle(callback(expired), env, provider)).status, 400);
  const denied = await begin();
  assert.equal((await handle(callback(denied, 'error=access_denied'), env, provider)).status, 400);
  const duplicate = await begin();
  assert.equal((await handle(callback(duplicate, 'code=a&code=b'), env, provider)).status, 400);
  assert.equal(await env.DB.prepare('SELECT state_hash FROM oauth_states WHERE state_hash = ?').bind(await hash(denied.state)).first(), null);
});

test('provider errors never leak secrets or create a connected account', async () => {
  const flow = await begin();
  const response = await handle(callback(flow), env, async () => new Response('private-refresh test-secret', { status: 400 }));
  assert.equal(response.status, 502); assert.doesNotMatch(await response.text(), /private-refresh|test-secret/);
  assert.equal((await store.read(cfg.connectionId)).status, 'reauthorize');
});

test('AES-GCM rejects wrong keys, wrong connection and ciphertext tampering', async () => {
  const ciphertext = await encrypt({ token: 'private' }, cfg.tokenKey, cfg.connectionId);
  await assert.rejects(decrypt(ciphertext, b64(crypto.getRandomValues(new Uint8Array(32))), cfg.connectionId));
  await assert.rejects(decrypt(ciphertext, cfg.tokenKey, 'other-account'));
  const value = JSON.parse(ciphertext); value.data = (value.data[0] === 'A' ? 'B' : 'A') + value.data.slice(1);
  await assert.rejects(decrypt(JSON.stringify(value), cfg.tokenKey, cfg.connectionId));
});

test('refresh rotates both tokens, persists them and skips fresh tokens', async () => {
  await seed();
  assert.equal(await refreshIfNeeded(store, cfg, () => assert.fail()), 'current');
  await due(); let calls = 0;
  const provider = async (_url, options) => {
    calls++; assert.equal(new URLSearchParams(options.body).get('grant_type'), 'refresh_token');
    assert.equal(new URLSearchParams(options.body).get('refresh_token'), 'private-refresh-initial');
    return Response.json(tokenBody('renewed'));
  };
  assert.equal(await refreshIfNeeded(store, cfg, provider), 'renewed');
  assert.equal(await getAccessToken(new Store(env.DB), cfg, provider), 'private-access-renewed');
  assert.equal(calls, 1);
  const row = await store.read(cfg.connectionId);
  assert.equal(row.lock_owner, null); assert.ok(row.refresh_expires_at > Date.now() + 44 * 86400000);
});

test('concurrent refreshes send the refresh token to the provider only once', async () => {
  await seed(); await due();
  let release, entered;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { entered = resolve; });
  let calls = 0;
  const provider = async () => { calls++; entered(); await gate; return Response.json(tokenBody('renewed')); };
  const first = refreshIfNeeded(new Store(env.DB), cfg, provider);
  await started;
  try { assert.equal(await refreshIfNeeded(new Store(env.DB), cfg, provider), 'busy'); }
  finally { release(); }
  assert.equal(await first, 'renewed'); assert.equal(calls, 1);
});

test('uncertain remote result blocks reuse and a new OAuth flow recovers', async () => {
  await seed(); await due();
  await assert.rejects(refreshIfNeeded(store, cfg, async () => { throw new Error('Timeout with possible rotation'); }));
  assert.equal((await store.read(cfg.connectionId)).status, 'reauthorize');
  assert.equal(await refreshIfNeeded(store, cfg, () => assert.fail()), 'reauthorize');
  await seed(); assert.equal((await store.read(cfg.connectionId)).status, 'connected');
});

test('write failure after provider success preserves old ciphertext and blocks replay', async () => {
  await seed(); await due();
  const before = (await store.read(cfg.connectionId)).encrypted_tokens;
  const failing = new Store(env.DB); failing.save = async () => { throw new Error('D1 unavailable'); };
  await assert.rejects(refreshIfNeeded(failing, cfg, async () => Response.json(tokenBody('rotated'))));
  const row = await store.read(cfg.connectionId);
  assert.equal(row.encrypted_tokens, before); assert.equal(row.status, 'reauthorize');
});

test('expired leases fence old writers and expired refresh tokens require reauthorization', async () => {
  await seed(); await due();
  assert.equal(await store.acquire(cfg.connectionId, 'old-owner', Date.now() - 100000), true);
  assert.equal(await refreshIfNeeded(store, cfg, () => assert.fail()), 'reauthorize');
  await assert.rejects(store.save(cfg.connectionId, 'old-owner', '{}', 1, 1, Date.now()));
  await seed(); await due();
  await env.DB.prepare('UPDATE oauth_connections SET refresh_expires_at = 1').run();
  assert.equal(await refreshIfNeeded(store, cfg, () => assert.fail()), 'reauthorize');
});

test('manual refresh requires admin and CSRF protection; status never exposes tokens', async () => {
  await seed();
  const status = await handle(req('/api/melhor-envio/status', { headers: { Authorization: authorization } }), env);
  assert.equal(status.status, 200); assert.doesNotMatch(await status.text(), /private-access|private-refresh|encrypted_tokens/);
  const request = headers => req('/api/melhor-envio/refresh', { method: 'POST', headers: { Authorization: authorization, ...headers } });
  assert.equal((await handle(request({}), env)).status, 403);
  assert.equal((await handle(request({ 'X-FlowJesus-Admin': '1', Origin: 'https://evil.example' }), env)).status, 403);
  assert.equal((await handle(request({ 'X-FlowJesus-Admin': '1' }), env)).status, 200);
});

test('scheduled job skips healthy tokens and cleans expired OAuth state', async () => {
  await seed(); await begin();
  await env.DB.prepare('UPDATE oauth_states SET expires_at = 1').run();
  await scheduled({}, env);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) AS total FROM oauth_states').first()).total, 0);
  assert.equal((await store.read(cfg.connectionId)).status, 'connected');
});
