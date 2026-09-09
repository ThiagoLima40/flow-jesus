import { config, setupMode, PREFIX } from './config.mjs';
import { random, hash, equal } from './crypto.mjs';
import { Store } from './store.mjs';
import { authorizeCode, refreshIfNeeded, OAuthError } from './oauth.mjs';
const COOKIE = '__Host-flowjesus-me';
const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
function reply(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: {
    'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", ...headers,
  } });
}
const json = (value, status = 200) => reply(JSON.stringify(value), status, { 'Content-Type': 'application/json' });
async function admin(request, cfg) {
  const expected = `Basic ${btoa(`admin:${cfg.adminPassword}`)}`;
  return equal(request.headers.get('Authorization') || '', expected);
}
function single(params, name) { return params.getAll(name).length === 1 ? params.get(name) : null; }
export async function handle(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const isCallback = url.pathname === `${PREFIX}/callback`;
  try {
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ service: 'FlowJesus — Melhor Envio', environment_url: `${url.origin}/`, redirect_uri: `${url.origin}${PREFIX}/callback` });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      await env.DB.prepare('SELECT 1').first();
      return json({ status: 'ok' });
    }
    const paths = [`${PREFIX}/authorize`, `${PREFIX}/callback`, `${PREFIX}/status`, `${PREFIX}/refresh`];
    if (!paths.includes(url.pathname)) return reply('Não encontrado.', 404);
    const method = url.pathname === `${PREFIX}/refresh` ? 'POST' : 'GET';
    if (request.method !== method) return reply('Método não permitido.', 405, { Allow: method });
    if (setupMode(env)) return reply('Integração aguardando configuração administrativa.', 503);
    const cfg = await config(env);
    if (url.origin !== cfg.origin) return reply('Utilize o endereço configurado para esta integração.', 400);
    const store = new Store(env.DB);
    if (!isCallback && !await admin(request, cfg)) return reply('Autenticação administrativa necessária.', 401, { 'WWW-Authenticate': 'Basic realm="FlowJesus Melhor Envio"' });
    if (url.pathname === `${PREFIX}/authorize`) {
      const now = Date.now();
      await store.cleanup(now);
      const state = random(), browser = random();
      if (!await store.addState(await hash(state), await hash(browser), cfg.connectionId, now)) return reply('Aguarde antes de iniciar outra autorização.', 429);
      const authorization = new URL('/oauth/authorize', cfg.baseUrl);
      authorization.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: 'code', scope: cfg.scope, state }).toString();
      return reply('', 302, { Location: authorization.href, 'Set-Cookie': cookie(browser, 600) });
    }
    if (isCallback) {
      const state = single(url.searchParams, 'state');
      const browserCookies = (request.headers.get('Cookie') || '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${COOKIE}=`));
      const browser = browserCookies.length === 1 ? browserCookies[0].slice(COOKIE.length + 1) : '';
      const cleared = { 'Set-Cookie': cookie('', 0) };
      if (!/^[a-f0-9]{64}$/.test(state || '') || !/^[a-f0-9]{64}$/.test(browser) ||
          !await store.consumeState(await hash(state), await hash(browser), cfg.connectionId, Date.now())) return reply('Autorização inválida ou expirada. Inicie novamente.', 400, cleared);
      if (url.searchParams.has('error')) return reply('Autorização não concedida no Melhor Envio.', 400, cleared);
      const code = single(url.searchParams, 'code');
      if (!code?.trim() || code.length > 4096) return reply('Código de autorização ausente ou inválido.', 400, cleared);
      await authorizeCode(store, cfg, code, fetchImpl);
      return reply('Melhor Envio autorizado com sucesso. Você pode fechar esta janela.', 200, cleared);
    }
    if (url.pathname === `${PREFIX}/status`) {
      const row = await store.read(cfg.connectionId);
      return json({ status: row?.status || 'unconnected', expires_at: row?.expires_at || null, refresh_expires_at: row?.refresh_expires_at || null, renewal_in_progress: Boolean(row?.lock_owner) });
    }
    // Custom header plus origin validation prevents browser CSRF with cached Basic auth.
    if (request.headers.get('X-FlowJesus-Admin') !== '1' || (request.headers.has('Origin') && request.headers.get('Origin') !== cfg.origin)) return reply('Requisição administrativa inválida.', 403);
    return json({ status: await refreshIfNeeded(store, cfg, fetchImpl) });
  } catch (error) {
    return reply(error instanceof OAuthError ? error.message : 'Serviço indisponível. Verifique a configuração administrativa.', error instanceof OAuthError ? error.status : 503,
      isCallback ? { 'Set-Cookie': cookie('', 0) } : {});
  }
}
export async function scheduled(_event, env) {
  if (setupMode(env)) return;
  const cfg = await config(env);
  const store = new Store(env.DB);
  await store.cleanup(Date.now());
  try {
    const status = await refreshIfNeeded(store, cfg);
    if (status === 'reauthorize') console.warn('Melhor Envio: nova autorização necessária.');
  } catch {
    // Static message only: do not log token payloads, authorization codes or secrets.
    console.error('Melhor Envio: renovação não concluída; verifique o status administrativo.');
    throw new Error('Melhor Envio renewal failed');
  }
}
export default { fetch: (request, env) => handle(request, env), scheduled };
