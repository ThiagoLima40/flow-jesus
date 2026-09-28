ALTER TABLE orders ADD COLUMN shipping_mode TEXT NOT NULL DEFAULT 'delivery'
  CHECK (shipping_mode IN ('delivery', 'pickup') AND (shipping_mode != 'pickup' OR shipping_cents = 0));
