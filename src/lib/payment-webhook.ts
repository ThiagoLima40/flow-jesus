import type { OrdersDatabase } from "./order-store";

type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const id = (value: unknown): string | null =>
  (typeof value === "number" && Number.isSafeInteger(value) && value > 0) ||
  (typeof value === "string" && /^[1-9]\d{0,30}$/.test(value)) ? String(value) : null;
const date = (value: unknown): string | null => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const statusMap: Record<string, string> = {
  pending: "aguardando pagamento", approved: "pago", rejected: "cancelado", cancelled: "cancelado", refunded: "estornado",
};
export class PaymentWebhookError extends Error {
  constructor(public status: number) { super("Payment notification could not be processed"); }
}
function requireMatch(condition: unknown): asserts condition {
  if (!condition) throw new PaymentWebhookError(409);
}

// Use the signed query ID, never an unverified resource URL or body status.
export async function verifyPaymentSignature(request: Request, secret: string): Promise<string | null> {
  const url = new URL(request.url);
  const ids = url.searchParams.getAll("data.id");
  const paymentId = ids.length === 1 ? (id(ids[0]) || (/^ORD[A-Z0-9]{26}$/i.test(ids[0]) ? ids[0].toUpperCase() : null)) : null;
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature") || "";
  if (!paymentId || !requestId || !/^[\w-]{1,200}$/.test(requestId) || signature.length > 300) return null;
  const parts = signature.split(",").map(part => part.trim().split("="));
  const timestamps = parts.filter(([key]) => key === "ts");
  const signatures = parts.filter(([key]) => key === "v1");
  if (timestamps.length !== 1 || signatures.length !== 1) return null;
  const ts = timestamps[0][1];
  const digest = signatures[0][1];
  if (!/^\d{10,16}$/.test(ts || "") || !/^[a-fA-F0-9]{64}$/.test(digest || "")) return null;
  // No age cutoff: provider retries may be delayed. Replays only re-fetch current
  // authoritative state, and the database update is versioned and idempotent.
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const bytes = Uint8Array.from(digest.match(/../g)!, byte => parseInt(byte, 16));
  const valid = await crypto.subtle.verify("HMAC", key, bytes,
    new TextEncoder().encode(`id:${paymentId.toLowerCase()};request-id:${requestId};ts:${ts};`));
  return valid ? paymentId : null;
}

type PaymentOrder = {
  order_number: string; total_cents: number; currency: string; payment_method: string;
  status: string; mercado_pago_payment_id: string | null; mercado_pago_preference_id: string | null;
  mercado_pago_status: string | null; mercado_pago_updated_at: string | null;
};

export async function reconcilePayment(db: OrdersDatabase, token: string, paymentId: string, fetchImpl: typeof fetch = fetch) {
  async function get(path: string) {
    const response = await fetchImpl(`https://api.mercadopago.com${path}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new PaymentWebhookError(503);
    return object(await response.json());
  }
  const payment = await get(`/v1/payments/${paymentId}`);
  requireMatch(id(payment.id) === paymentId && payment.live_mode === true);
  const reference = payment.external_reference;
  // Legacy payments have no D1 order. Do not create an order from a notification.
  if (typeof reference !== "string" || !/^FJ-[0-9A-F-]{36}$/.test(reference)) return;
  const order = await db.prepare(`SELECT order_number, total_cents, currency, payment_method, status,
    mercado_pago_payment_id, mercado_pago_preference_id, mercado_pago_status, mercado_pago_updated_at
    FROM orders WHERE order_number = ?`).bind(reference).first<PaymentOrder>();
  if (!order) throw new PaymentWebhookError(503);
  const amount = payment.transaction_amount;
  requireMatch(typeof amount === "number" && Number.isFinite(amount) && Math.round(amount * 100) === order.total_cents &&
    Math.abs(amount * 100 - order.total_cents) < 0.00001 && payment.currency_id === order.currency);
  requireMatch(order.payment_method !== "pix" || payment.payment_method_id === "pix");
  const account = await get("/users/me");
  requireMatch(id(account.id) && id(payment.collector_id) === id(account.id));

  let preferenceId: string | null = null;
  if (payment.preference_id != null) {
    requireMatch(typeof payment.preference_id === "string" && payment.preference_id.length > 0);
    preferenceId = payment.preference_id;
  }
  const merchantOrder = object(payment.order);
  if (merchantOrder.id != null) {
    const merchantId = id(merchantOrder.id);
    requireMatch(merchantId && merchantOrder.type === "mercadopago");
    const merchant = await get(`/merchant_orders/${merchantId}`);
    requireMatch(id(merchant.id) === merchantId && merchant.external_reference === reference &&
      id(object(merchant.collector).id) === id(account.id) &&
      Array.isArray(merchant.payments) && merchant.payments.some(value => id(object(value).id) === paymentId) &&
      typeof merchant.preference_id === "string" && merchant.preference_id.length > 0);
    requireMatch(!preferenceId || preferenceId === merchant.preference_id);
    preferenceId = merchant.preference_id;
  }
  if (order.payment_method === "other") requireMatch(preferenceId);
  requireMatch(!order.mercado_pago_preference_id || preferenceId === order.mercado_pago_preference_id);

  const providerStatus = typeof payment.status === "string" ? payment.status : "";
  if (!Object.hasOwn(statusMap, providerStatus)) return;
  const updated = date(payment.date_last_updated);
  const approved = date(payment.date_approved);
  requireMatch(updated && (providerStatus !== "approved" || approved));
  if (approved) requireMatch(approved <= updated);
  const samePayment = order.mercado_pago_payment_id === paymentId;
  if (samePayment && order.mercado_pago_updated_at && updated <= order.mercado_pago_updated_at) return;
  // A preference may have several attempts. A successful (possibly already
  // refunded) payment can replace a failed attempt, never another paid order.
  if (order.mercado_pago_payment_id && !samePayment) {
    requireMatch(order.payment_method === "other" && !!order.mercado_pago_preference_id);
    if (!["approved", "refunded"].includes(providerStatus) || order.status === "pago" || order.status === "estornado") return;
  }
  if (order.status === "estornado" || (order.status === "pago" && providerStatus !== "approved" && providerStatus !== "refunded")) return;
  const result = await db.prepare(`UPDATE orders SET status = ?, payment_setup_status = 'ready',
    mercado_pago_payment_id = ?, mercado_pago_preference_id = COALESCE(mercado_pago_preference_id, ?),
    mercado_pago_status = ?, mercado_pago_updated_at = ?,
    paid_at = COALESCE(paid_at, ?), updated_at = ?
    WHERE order_number = ? AND status = ? AND mercado_pago_payment_id IS ?
      AND mercado_pago_preference_id IS ? AND mercado_pago_updated_at IS ?`)
    .bind(statusMap[providerStatus], paymentId, preferenceId, providerStatus, updated,
      providerStatus === "approved" || providerStatus === "refunded" ? approved : null,
      new Date().toISOString(), reference, order.status, order.mercado_pago_payment_id,
      order.mercado_pago_preference_id, order.mercado_pago_updated_at).run();
  // Concurrent change: ask the provider to retry with a fresh API/database read.
  if (result.meta.changes !== 1) throw new PaymentWebhookError(503);
}
