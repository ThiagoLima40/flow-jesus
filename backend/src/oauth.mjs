import { decrypt, encrypt, random } from './crypto.mjs';
import { logOAuthFailure, TokenExchangeError } from './oauth-diagnostics.mjs';
const DAY = 86400000;
export class OAuthError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function exchange(cfg, grant, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(`${cfg.baseUrl}/oauth/token`, {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': cfg.userAgent },
      body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...grant }).toString(),
    });
  } catch (error) {
    // Exception messages can contain request credentials. Only classify by name.
    throw new TokenExchangeError(null, ['TimeoutError', 'AbortError'].includes(error?.name)
      ? 'Tempo limite excedido antes de receber resposta HTTP do Melhor Envio.'
      : 'Falha de transporte antes de receber resposta HTTP do Melhor Envio.');
  }
  if (response.status >= 300 && response.status < 400) throw new TokenExchangeError(response.status, 'Endpoint OAuth retornou redirecionamento; código não reenviado.');
  let value;
  try { value = await response.json(); }
  catch {
    throw new TokenExchangeError(response.status, 'Resposta não JSON ou ilegível; conteúdo omitido por segurança.');
  }
  if (!response.ok) {
    throw new TokenExchangeError(response.status, 'O provedor recusou a autorização; detalhes omitidos por segurança.');
  }
  if (!value || typeof value.access_token !== 'string' || !value.access_token || typeof value.refresh_token !== 'string' || !value.refresh_token ||
      typeof value.token_type !== 'string' || value.token_type.toLowerCase() !== 'bearer' || !Number.isFinite(value.expires_in) || value.expires_in <= 0 || value.expires_in > 365 * 86400) {
    throw new TokenExchangeError(response.status, 'Resposta de token inválida; conteúdo omitido por segurança.');
  }
  return { access_token: value.access_token, refresh_token: value.refresh_token, token_type: 'Bearer', expires_in: value.expires_in };
}
async function persist(store, cfg, owner, tokens, now) {
  await store.save(cfg.connectionId, owner, await encrypt(tokens, cfg.tokenKey, cfg.connectionId), now + tokens.expires_in * 1000, now + 45 * DAY, now);
}
export async function authorizeCode(store, cfg, code, fetchImpl = fetch, now = Date.now()) {
  const owner = random();
  if (!await store.acquire(cfg.connectionId, owner, now, true)) throw new OAuthError(409, 'Outra autorização ou renovação está em andamento. Tente novamente.');
  let attempted = false;
  let stage = 'token_exchange';
  try {
    attempted = true;
    const tokens = await exchange(cfg, { grant_type: 'authorization_code', redirect_uri: cfg.redirectUri, code }, fetchImpl);
    stage = 'token_persistence';
    await persist(store, cfg, owner, tokens, now);
  } catch (error) {
    const diagnostic = error instanceof TokenExchangeError ? error.diagnostic : { http_status: null, message: stage === 'token_persistence' ? 'Falha ao criptografar ou persistir tokens.' : 'Falha interna na troca OAuth.' };
    logOAuthFailure(stage, diagnostic.http_status);
    await store.release(cfg.connectionId, owner, attempted);
    throw new OAuthError(502, 'Não foi possível concluir a autorização. Inicie novamente.');
  }
}
export async function refreshIfNeeded(store, cfg, fetchImpl = fetch, now = Date.now()) {
  const row = await store.read(cfg.connectionId);
  if (!row || row.status === 'unconnected') return 'unconnected';
  if (row.status === 'reauthorize') return 'reauthorize';
  if (!row.lock_owner && row.expires_at > now + 3 * DAY) return 'current';
  const owner = random();
  if (!await store.acquire(cfg.connectionId, owner, now)) {
    const current = await store.read(cfg.connectionId);
    return current?.status === 'reauthorize' ? 'reauthorize' : 'busy';
  }
  let attempted = false;
  try {
    // Re-read under lock: another worker may already have rotated the token.
    const current = await store.read(cfg.connectionId);
    if (current.expires_at > now + 3 * DAY) { await store.release(cfg.connectionId, owner); return 'current'; }
    if (current.refresh_expires_at <= now) { await store.release(cfg.connectionId, owner, true); return 'reauthorize'; }
    const tokens = await decrypt(current.encrypted_tokens, cfg.tokenKey, cfg.connectionId);
    attempted = true;
    const renewed = await exchange(cfg, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token }, fetchImpl);
    await persist(store, cfg, owner, renewed, now);
    return 'renewed';
  } catch (error) {
    if (error instanceof TokenExchangeError) logOAuthFailure('token_refresh', error.diagnostic.http_status);
    await store.release(cfg.connectionId, owner, attempted);
    // Network/commit ambiguity: preserve ciphertext but block automatic reuse.
    throw new OAuthError(502, attempted ? 'Renovação não confirmada. Autorize novamente.' : 'Não foi possível ler os tokens. Verifique a configuração.');
  }
}
// For future server-side shipping calls only. Never expose this through HTTP.
export async function getAccessToken(store, cfg, fetchImpl = fetch, now = Date.now()) {
  const outcome = await refreshIfNeeded(store, cfg, fetchImpl, now);
  if (!['current', 'renewed'].includes(outcome)) throw new OAuthError(503, 'Integração indisponível.');
  const row = await store.read(cfg.connectionId);
  if (row.status !== 'connected' || row.lock_owner || row.expires_at <= now) throw new OAuthError(503, 'Integração indisponível.');
  return (await decrypt(row.encrypted_tokens, cfg.tokenKey, cfg.connectionId)).access_token;
}
