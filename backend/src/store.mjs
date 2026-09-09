export class Store {
  constructor(db) { this.db = db; }
  async cleanup(now) { await this.db.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').bind(now).run(); }
  async addState(stateHash, browserHash, id, now) {
    const result = await this.db.prepare(`INSERT INTO oauth_states (state_hash, browser_hash, connection_id, expires_at)
      SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM oauth_states WHERE connection_id = ?) < 50`)
      .bind(stateHash, browserHash, id, now + 600000, id).run();
    return result.meta.changes === 1;
  }
  async consumeState(stateHash, browserHash, id, now) {
    return this.db.prepare(`DELETE FROM oauth_states WHERE state_hash = ? AND browser_hash = ? AND connection_id = ? AND expires_at > ? RETURNING state_hash`)
      .bind(stateHash, browserHash, id, now).first();
  }
  async read(id) { return this.db.prepare('SELECT * FROM oauth_connections WHERE id = ?').bind(id).first(); }
  async acquire(id, owner, now, reauthorizing = false) {
    await this.db.prepare('INSERT OR IGNORE INTO oauth_connections (id, updated_at) VALUES (?, ?)').bind(id, now).run();
    // Expired lease may mean a refresh was accepted but its response was lost.
    // Never automatically reuse that refresh token; a fresh OAuth flow can recover.
    await this.db.prepare(`UPDATE oauth_connections SET status = 'reauthorize', lock_owner = NULL, lock_until = NULL
      WHERE id = ? AND lock_owner IS NOT NULL AND lock_until <= ?`).bind(id, now).run();
    const result = await this.db.prepare(`UPDATE oauth_connections SET lock_owner = ?, lock_until = ?
      WHERE id = ? AND lock_owner IS NULL AND (? = 1 OR status = 'connected')`)
      .bind(owner, now + 90000, id, reauthorizing ? 1 : 0).run();
    return result.meta.changes === 1;
  }
  async save(id, owner, payload, expiresAt, refreshExpiresAt, now) {
    const result = await this.db.prepare(`UPDATE oauth_connections SET encrypted_tokens = ?, expires_at = ?, refresh_expires_at = ?,
      status = 'connected', updated_at = ?, lock_owner = NULL, lock_until = NULL WHERE id = ? AND lock_owner = ?`)
      .bind(payload, expiresAt, refreshExpiresAt, now, id, owner).run();
    if (result.meta.changes !== 1) throw new Error('Lease lost');
  }
  async release(id, owner, uncertain = false) {
    await this.db.prepare(`UPDATE oauth_connections SET lock_owner = NULL, lock_until = NULL,
      status = CASE WHEN ? = 1 THEN 'reauthorize' ELSE status END WHERE id = ? AND lock_owner = ?`)
      .bind(uncertain ? 1 : 0, id, owner).run();
  }
}
