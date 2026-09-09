CREATE TABLE oauth_states (
  state_hash TEXT PRIMARY KEY,
  browser_hash TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX oauth_states_expiry ON oauth_states(expires_at);
CREATE INDEX oauth_states_connection ON oauth_states(connection_id);

CREATE TABLE oauth_connections (
  id TEXT PRIMARY KEY,
  encrypted_tokens TEXT,
  expires_at INTEGER,
  refresh_expires_at INTEGER,
  status TEXT NOT NULL DEFAULT 'unconnected' CHECK (status IN ('unconnected', 'connected', 'reauthorize')),
  lock_owner TEXT,
  lock_until INTEGER,
  updated_at INTEGER NOT NULL
);
