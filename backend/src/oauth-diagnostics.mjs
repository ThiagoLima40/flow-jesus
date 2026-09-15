// Temporary OAuth diagnostics. Never log raw responses, requests or exceptions.
export function safeErrorBody(value, secrets = []) {
  const fields = ['error', 'error_description', 'message', 'hint'];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '[body omitted: unexpected format]';
  const hidden = [...secrets];
  function collect(node) {
    if (typeof node === 'string' && node) hidden.push(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(collect);
  }
  for (const [key, item] of Object.entries(value)) if (!fields.includes(key)) collect(item);
  const variants = hidden.filter(Boolean).flatMap(s => [s, encodeURIComponent(s), new URLSearchParams({ v: s }).toString().slice(2)]).sort((a, b) => b.length - a.length);
  const result = {};
  for (const field of fields) {
    if (typeof value[field] !== 'string') continue;
    let text = value[field];
    for (const secret of variants) text = text.split(secret).join('[REDACTED]');
    text = text.replace(/(?:Bearer\s+)[^\s"'<>]+/gi, 'Bearer [REDACTED]')
      .replace(/\b(?:client_secret|authorization_code|code|access_token|refresh_token|token)\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi, '[REDACTED]')
      .replace(/[A-Za-z0-9_+/=-]{32,}(?:\.[A-Za-z0-9_+/=-]+)*/g, '[REDACTED]');
    result[field] = text.slice(0, 1000);
  }
  return Object.keys(result).length ? result : '[body omitted: no diagnostic fields]';
}

export function logOAuthFailure(stage, status = null, body = null) {
  const message = typeof body === 'string' ? body : Object.entries(body || {}).map(([key, value]) => `${key}: ${value}`).join('; ');
  const diagnostic = { http_status: status, message: message || stage };
  console.error({ event: 'melhor_envio_oauth_diagnostic', ...diagnostic });
  return diagnostic;
}

export class TokenExchangeError extends Error {
  constructor(status, message) {
    super('OAuth token exchange failed');
    this.diagnostic = { http_status: status, message };
  }
}
