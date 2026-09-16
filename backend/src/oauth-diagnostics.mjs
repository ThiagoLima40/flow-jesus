// Log only locally defined events and numeric status, never provider text.
export function logOAuthFailure(stage, status = null) {
  const event = ['token_exchange', 'token_persistence', 'token_refresh'].includes(stage) ? stage : 'oauth_failure';
  const diagnostic = { http_status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null, stage: event };
  console.error({ event: 'melhor_envio_oauth_diagnostic', ...diagnostic });
  return diagnostic;
}

export class TokenExchangeError extends Error {
  constructor(status, message) {
    super('OAuth token exchange failed');
    this.diagnostic = { http_status: status, message };
  }
}
