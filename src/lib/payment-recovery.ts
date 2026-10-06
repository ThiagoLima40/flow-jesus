import type { OrdersDatabase } from "./order-store";
import { reconcilePayment } from "./payment-webhook";
import { reconcileOrder } from "./order-webhook";
import { notifyPaidOrder } from "./paid-order-email";

type Environment = {
  ORDERS_DB?: OrdersDatabase; MERCADOPAGO_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string; ORDER_RECOVERY_START_AT?: string;
};
type Candidate = {
  order_number: string; status: string; payment_method: string;
  mercado_pago_payment_id: string | null; mercado_pago_order_id: string | null;
};

// Trusted scheduled execution, independent of webhook delivery. Never accept
// financial state from callers: reuse the complete provider reconciliation.
export async function recoverPayments(env: Environment, fetchImpl: typeof fetch = fetch, now: () => number = Date.now) {
  const db = env.ORDERS_DB, token = env.MERCADOPAGO_ACCESS_TOKEN;
  const start = env.ORDER_RECOVERY_START_AT;
  if (!db || !token || !start || !Number.isFinite(Date.parse(start))) throw new Error("Payment recovery configuration missing");
  const current = now();
  for (let i = 0; i < 5; i++) {
    // Atomic selection rotates fairly through failures and pending payments.
    // Updating only the checkpoint cannot change financial or email state.
    const order = await db.prepare(`UPDATE orders SET payment_recovery_checked_at = ?
      WHERE order_number = (SELECT order_number FROM orders
        WHERE created_at >= ? AND status IN ('aguardando pagamento', 'pago')
          AND paid_email_status IN ('pending', 'sending')
          AND (paid_email_lease_until_ms IS NULL OR paid_email_lease_until_ms <= ?)
          AND (payment_recovery_checked_at IS NULL OR payment_recovery_checked_at < ?)
          AND (mercado_pago_payment_id IS NOT NULL OR mercado_pago_preference_id IS NOT NULL
            OR mercado_pago_order_id IS NOT NULL OR payment_setup_status IN ('creating', 'review_required'))
        ORDER BY payment_recovery_checked_at, created_at LIMIT 1)
      RETURNING order_number, status, payment_method, mercado_pago_payment_id, mercado_pago_order_id`)
      .bind(new Date(current).toISOString(), new Date(start).toISOString(), current,
        new Date(current - 60000).toISOString()).first<Candidate>();
    if (!order) break;
    try {
      let resource: { type: "payment" | "order"; id: string };
      if (order.mercado_pago_order_id) resource = { type: "order", id: order.mercado_pago_order_id };
      else if (order.mercado_pago_payment_id && (order.payment_method === "pix" || order.status === "pago")) {
        resource = { type: "payment", id: order.mercado_pago_payment_id };
      } else {
        // Checkout Pro stores a preference, not a payment ID. Search only our
        // saved reference; a subsequent GET still validates every payment field.
        const query = new URLSearchParams({ external_reference: order.order_number, status: "approved",
          sort: "date_created", criteria: "desc", limit: "2" });
        const response = await fetchImpl(`https://api.mercadopago.com/v1/payments/search?${query}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error("Payment search unavailable");
        const data = await response.json() as { results?: { id?: unknown; external_reference?: unknown }[] };
        if (!Array.isArray(data.results)) throw new Error("Invalid payment search");
        if (data.results.length === 0) continue;
        if (data.results.length !== 1 || data.results[0].external_reference !== order.order_number ||
          !/^[1-9]\d{0,30}$/.test(String(data.results[0].id))) throw new Error("Payment requires review");
        resource = { type: "payment", id: String(data.results[0].id) };
      }
      if (resource.type === "order") await reconcileOrder(db, token, resource.id, fetchImpl);
      else await reconcilePayment(db, token, resource.id, fetchImpl);
      await notifyPaidOrder(db, env, resource, fetchImpl, now);
      console.info("flowjesus_payment_recovery", { orderNumber: order.order_number, outcome: "processed" });
    } catch {
      // A later cron retries independently of MP redelivery. Existing email
      // leases, frozen payload and Resend idempotency remain authoritative.
      console.info("flowjesus_payment_recovery", { orderNumber: order.order_number, outcome: "retry_required" });
    }
  }
}
