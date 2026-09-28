ALTER TABLE orders ADD COLUMN paid_email_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (paid_email_status IN ('pending', 'sending', 'sent', 'review_required'));
ALTER TABLE orders ADD COLUMN paid_email_payload_json TEXT
  CHECK (paid_email_payload_json IS NULL OR json_valid(paid_email_payload_json));
ALTER TABLE orders ADD COLUMN paid_email_first_attempt_ms INTEGER;
ALTER TABLE orders ADD COLUMN paid_email_lease_until_ms INTEGER;
ALTER TABLE orders ADD COLUMN paid_email_claim_token TEXT;
ALTER TABLE orders ADD COLUMN paid_email_resend_id TEXT;
ALTER TABLE orders ADD COLUMN paid_email_sent_at TEXT;
