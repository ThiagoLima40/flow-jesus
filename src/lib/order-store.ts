import type { Customer, DeliveryAddress } from "./order-input";

// Structural subset of D1: runtime access is exclusively a Worker binding.
type Statement = {
  bind(...values: (string | number | null)[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type OrdersDatabase = { prepare(sql: string): Statement };
export type OrderSnapshot = {
  customer: Customer; address: DeliveryAddress;
  items: { productId: string; name: string; color: string; size: string; quantity: number; unitPriceCents: number; subtotalCents: number }[];
  subtotalCents: number; coupon: string; couponDiscountCents: number; pixDiscountCents: number;
  shipping: { serviceId: number; name: string; company: string | null; amountCents: number };
  totalCents: number; paymentMethod: "pix" | "other";
};
export type StoredOrder = {
  order_number: string; request_hash: string; status: string; created_at: string;
  payment_setup_status: "not_started" | "creating" | "ready" | "review_required";
  checkout_url: string | null;
};
export async function orderRequestHash(value: unknown) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export class OrderStore {
  constructor(private db: OrdersDatabase) {}
  async find(checkoutKey: string) {
    return this.db.prepare("SELECT order_number, request_hash, status, created_at, payment_setup_status, checkout_url FROM orders WHERE checkout_key = ?")
      .bind(checkoutKey).first<StoredOrder>();
  }
  async create(checkoutKey: string, requestHash: string, order: OrderSnapshot) {
    const now = new Date().toISOString();
    const number = `FJ-${crypto.randomUUID().toUpperCase()}`;
    // A single INSERT atomically persists the complete immutable purchase snapshot.
    await this.db.prepare(`INSERT INTO orders (
      order_number, checkout_key, request_hash, customer_name, customer_email, customer_phone,
      address_json, items_json, subtotal_cents, coupon, coupon_discount_cents, pix_discount_cents,
      shipping_service_id, shipping_name, shipping_company, shipping_cents, total_cents,
      payment_method, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(checkout_key) DO NOTHING`).bind(number, checkoutKey, requestHash,
      order.customer.name, order.customer.email, order.customer.phone, JSON.stringify(order.address), JSON.stringify(order.items),
      order.subtotalCents, order.coupon, order.couponDiscountCents, order.pixDiscountCents,
      order.shipping.serviceId, order.shipping.name, order.shipping.company, order.shipping.amountCents,
      order.totalCents, order.paymentMethod, now, now).run();
    const stored = await this.find(checkoutKey);
    if (!stored) throw new Error("Order storage unavailable");
    return stored;
  }
  async claim(number: string) {
    const result = await this.db.prepare(`UPDATE orders SET payment_setup_status = 'creating', updated_at = ?
      WHERE order_number = ? AND payment_setup_status = 'not_started' AND status = 'aguardando pagamento'`)
      .bind(new Date().toISOString(), number).run();
    return result.meta.changes === 1;
  }
  async attachPayment(number: string, payment: { id: string; url: string; kind: "payment" | "preference" }) {
    const result = await this.db.prepare(`UPDATE orders SET mercado_pago_payment_id = ?, mercado_pago_preference_id = ?,
      checkout_url = ?, payment_setup_status = 'ready', updated_at = ? WHERE order_number = ? AND payment_setup_status = 'creating'`)
      .bind(payment.kind === "payment" ? payment.id : null, payment.kind === "preference" ? payment.id : null,
        payment.url, new Date().toISOString(), number).run();
    if (result.meta.changes !== 1) throw new Error("Payment reference storage unavailable");
  }
  async requireReview(number: string) {
    await this.db.prepare(`UPDATE orders SET payment_setup_status = 'review_required', updated_at = ?
      WHERE order_number = ? AND payment_setup_status = 'creating'`).bind(new Date().toISOString(), number).run();
  }
}
