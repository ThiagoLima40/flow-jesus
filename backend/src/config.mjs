import { hash, unb64 } from './crypto.mjs';
export const PREFIX = '/api/melhor-envio';
export function setupMode(env) {
  if (!['true', 'false'].includes(env.MELHOR_ENVIO_SETUP_MODE)) throw new Error('Invalid setup mode');
  return env.MELHOR_ENVIO_SETUP_MODE === 'true';
}
export async function config(env) {
  const required = name => {
    if (typeof env[name] !== 'string' || !env[name].trim()) throw new Error('Missing configuration');
    return env[name].trim();
  };
  const environment = required('MELHOR_ENVIO_ENVIRONMENT');
  if (!['sandbox', 'production'].includes(environment)) throw new Error('Invalid environment');
  const redirectUri = required('MELHOR_ENVIO_REDIRECT_URI');
  const callback = new URL(redirectUri);
  if (callback.protocol !== 'https:' || callback.pathname !== `${PREFIX}/callback` || callback.search || callback.hash || callback.username || callback.password || /seusubdominio/i.test(callback.hostname)) throw new Error('Invalid callback');
  const clientId = required('MELHOR_ENVIO_CLIENT_ID');
  const adminPassword = required('MELHOR_ENVIO_ADMIN_PASSWORD');
  const tokenKey = required('MELHOR_ENVIO_TOKEN_KEY');
  if (adminPassword.length < 24 || unb64(tokenKey).length !== 32) throw new Error('Invalid secrets');
  return {
    clientId, clientSecret: required('MELHOR_ENVIO_CLIENT_SECRET'), adminPassword, tokenKey,
    redirectUri, origin: callback.origin, userAgent: required('MELHOR_ENVIO_USER_AGENT'),
    scope: env.MELHOR_ENVIO_SCOPES || 'shipping-calculate',
    baseUrl: environment === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br',
    originPostalCode: required('MELHOR_ENVIO_ORIGIN_POSTAL_CODE').replace(/\D/g, ''),
    connectionId: await hash(`${environment}:${clientId}`),
  };
}
