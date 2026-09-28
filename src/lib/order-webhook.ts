import type { OrdersDatabase } from "./order-store";
import { PaymentWebhookError } from "./payment-webhook";

type Json = Record<string, unknown>;
const object = (value: unknown): Json => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const numericId = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) && value > 0) ||
  (typeof value === "string" && /^[1-9]\d{0,30}$/.test(value)) ? String(value) : null;
function check(condition: unknown): asserts condition {
  if (!condition) throw new PaymentWebhookError(409);
}
function cents(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,12}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
function timestamp(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) return null;
  // Orders API timestamps can have nanoseconds. Preserve their ordering rather
  // than collapsing two different updates into the same JavaScript millisecond.
  const fraction = value.match(/\.(\d{1,9})(?:Z|[+-]\d{2}:\d{2})$/)?.[1] || "";
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, `.${fraction.padEnd(9, "0")}Z`);
}
type Stored = {
  order_number: string; total_cents: number; currency: string; payment_method: string; status: string;
  mercado_pago_payment_id: string | null; mercado_pago_preference_id: string | null;
  mercado_pago_order_id: string | null; mercado_pago_order_updated_at: string | null;
};

// Orders API IDs are not Payments API IDs. Never send PAY/ORD to /v1/payments.
export async function reconcileOrder(db: OrdersDatabase, token: string, resourceId: string, fetchImpl: typeof fetch = fetch) {
  check(/^ORD[A-Z0-9]{26}$/.test(resourceId));
  async function get(path: string) {
    const response = await fetchImpl(`https://api.mercadopago.com${path}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new PaymentWebhookError(503);
    return object(await response.json());
  }
  const remote = await get(`/v1/orders/${resourceId}`);
  check(remote.id === resourceId && remote.type === "online" && remote.live_mode !== false);
  const reference = remote.external_reference;
  if (typeof reference !== "string" || !/^FJ-[0-9A-F-]{36}$/.test(reference)) return;
  const stored = await db.prepare(`SELECT order_number, total_cents, currency, payment_method, status,
    mercado_pago_payment_id, mercado_pago_preference_id, mercado_pago_order_id, mercado_pago_order_updated_at
    FROM orders WHERE order_number = ?`).bind(reference).first<Stored>();
  if (!stored) throw new PaymentWebhookError(503);
  check(cents(remote.total_amount) === stored.total_cents);
  // Some Orders API responses express the currency through country_code only.
  check(remote.currency != null ? remote.currency === stored.currency : remote.country_code === "BR" && stored.currency === "BRL");
  if (remote.country_code != null) check(remote.country_code === "BR");
  const account = await get("/users/me");
  check(numericId(account.id) && numericId(remote.user_id) === numericId(account.id));
  check(!Array.isArray(account.tags) || !account.tags.includes("test_user"));
  if (remote.collector_id != null) check(numericId(remote.collector_id) === numericId(account.id));
  check(!stored.mercado_pago_order_id || stored.mercado_pago_order_id === resourceId);
  const preference = remote.preference_id ?? null;
  check(preference === null || typeof preference === "string" && preference.length > 0);
  check(!stored.mercado_pago_preference_id || preference === stored.mercado_pago_preference_id);
  const updated = timestamp(remote.last_updated_date);
  check(updated);
  if (stored.mercado_pago_order_updated_at && updated <= stored.mercado_pago_order_updated_at) return;

  const payments = object(remote.transactions).payments;
  check(payments === undefined || Array.isArray(payments));
  // orders currently represents one integral payment. Split payments must not
  // be silently reduced to an arbitrary transaction or treated as fully paid.
  check(!payments || payments.length <= 1);
  const transaction = object(payments?.[0]);
  let paymentId: string | null = null;
  if (payments?.length) {
    check(typeof transaction.id === "string" && /^PAY[A-Z0-9]{26}$/.test(transaction.id));
    paymentId = transaction.id;
    check(cents(transaction.amount) === stored.total_cents);
    if (stored.payment_method === "pix") check(object(transaction.payment_method).id === "pix");
  }
  check(!stored.mercado_pago_payment_id || stored.mercado_pago_payment_id === paymentId);
  const statuses: Record<string, string> = {
    created: "aguardando pagamento", processing: "aguardando pagamento", action_required: "aguardando pagamento",
    processed: "pago", failed: "cancelado", canceled: "cancelado", expired: "cancelado", refunded: "estornado",
  };
  const remoteStatus = typeof remote.status === "string" ? remote.status : "";
  if (!Object.hasOwn(statuses, remoteStatus)) throw new PaymentWebhookError(409);
  const status = remoteStatus === "processed" && remote.status_detail === "refunded" ? "estornado" : statuses[remoteStatus];
  if (status === "pago") check(remote.status_detail === "accredited" && paymentId &&
    transaction.status === "processed" && transaction.status_detail === "accredited" &&
    cents(remote.total_paid_amount) === stored.total_cents);
  if (status === "estornado") {
    const refunds = object(remote.transactions).refunds;
    check(paymentId && remote.status_detail === "refunded" && Array.isArray(refunds) && refunds.length > 0);
    const seen = new Set<string>();
    let total = 0;
    for (const raw of refunds) {
      const refund = object(raw);
      check(typeof refund.id === "string" && !seen.has(refund.id) && refund.transaction_id === paymentId);
      seen.add(refund.id);
      if (refund.status === "processed") {
        const amount = cents(refund.amount);
        check(amount !== null && amount > 0);
        total += amount;
      }
    }
    check(total === stored.total_cents);
  }
  if (stored.status === "estornado" || stored.status === "pago" && !["pago", "estornado"].includes(status)) return;
  // Orders API does not guarantee date_approved. Store the time at which the
  // provider reports accreditation when an explicit approval date is absent.
  const paidAt = status === "pago" ? (timestamp(transaction.date_approved) || updated) : timestamp(transaction.date_approved);
  if (paidAt) check(paidAt <= updated);
  const result = await db.prepare(`UPDATE orders SET status = ?, payment_setup_status = 'ready',
    mercado_pago_order_id = ?, mercado_pago_order_status = ?, mercado_pago_order_updated_at = ?,
    mercado_pago_payment_id = COALESCE(mercado_pago_payment_id, ?),
    mercado_pago_preference_id = COALESCE(mercado_pago_preference_id, ?),
    paid_at = COALESCE(paid_at, ?), updated_at = ?
    WHERE order_number = ? AND status = ? AND mercado_pago_order_id IS ?
      AND mercado_pago_order_updated_at IS ? AND mercado_pago_payment_id IS ? AND mercado_pago_preference_id IS ?`)
    .bind(status, resourceId, remoteStatus, updated, paymentId, preference as string | null,
      ["pago", "estornado"].includes(status) && paidAt ? new Date(paidAt).toISOString() : null, new Date().toISOString(), reference,
      stored.status, stored.mercado_pago_order_id, stored.mercado_pago_order_updated_at,
      stored.mercado_pago_payment_id, stored.mercado_pago_preference_id).run();
  if (result.meta.changes !== 1) throw new PaymentWebhookError(503);
}
