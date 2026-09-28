ALTER TABLE orders ADD COLUMN mercado_pago_order_id TEXT;
ALTER TABLE orders ADD COLUMN mercado_pago_order_status TEXT;
ALTER TABLE orders ADD COLUMN mercado_pago_order_updated_at TEXT;
CREATE UNIQUE INDEX orders_mercado_pago_order_id ON orders(mercado_pago_order_id);
