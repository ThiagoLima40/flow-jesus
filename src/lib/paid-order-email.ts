import type { DeliveryAddress } from "./order-input";
import type { OrderSnapshot, OrdersDatabase } from "./order-store";

type EmailEnvironment = { RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string };
type PaidOrder = {
  order_number: string; customer_name: string; customer_email: string; customer_phone: string;
  address_json: string; items_json: string; subtotal_cents: number; coupon: string;
  coupon_discount_cents: number; pix_discount_cents: number; shipping_cents: number; total_cents: number;
  shipping_mode: string; shipping_company: string | null; shipping_name: string; payment_method: string; paid_at: string;
  paid_email_status: "pending" | "sending" | "sent" | "review_required";
  paid_email_payload_json: string | null; paid_email_first_attempt_ms: number | null;
  paid_email_lease_until_ms: number | null;
};
const retryWindowMs = 23 * 60 * 60 * 1000; // Resend retains idempotency keys for 24 hours; leave a safety margin.
const leaseMs = 60 * 1000;
const unavailable = () => new Error("Paid order email unavailable");
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function emailPayload(order: PaidOrder, from: string) {
  const address = JSON.parse(order.address_json) as DeliveryAddress;
  const items = JSON.parse(order.items_json) as OrderSnapshot["items"];
  if (!order.paid_at || !Number.isFinite(Date.parse(order.paid_at))) throw unavailable();
  const pickup = order.shipping_mode === "pickup";
  const receipt = pickup ? "RETIRADA NO LOCAL" : "Entrega";
  const paidAt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium",
  }).format(new Date(order.paid_at));
  const text = [
    `PEDIDO PAGO — ${order.order_number}`, "", `Forma de recebimento: ${receipt}`,
    ...(pickup ? [] : [`Transportadora: ${order.shipping_company || "Não informada"}`, `Modalidade de frete: ${order.shipping_name}`]),
    "", `Cliente: ${order.customer_name}`, `Telefone / WhatsApp: ${order.customer_phone}`, `E-mail: ${order.customer_email}`,
    "", "PRODUTOS", ...items.map(item =>
      `${item.name} | Cor: ${item.color} | Tamanho: ${item.size} | Quantidade: ${item.quantity} | Unitário: ${money(item.unitPriceCents)} | Subtotal: ${money(item.subtotalCents)}`),
    "", `Subtotal: ${money(order.subtotal_cents)}`,
    `Desconto do cupom${order.coupon ? ` (${order.coupon})` : ""}: ${money(order.coupon_discount_cents)}`,
    `Desconto Pix: ${money(order.pix_discount_cents)}`,
    `Desconto total: ${money(order.coupon_discount_cents + order.pix_discount_cents)}`,
    `Frete: ${money(order.shipping_cents)}`, `Total: ${money(order.total_cents)}`,
    `Pagamento: ${order.payment_method === "pix" ? "Pix" : "Cartão e outros meios"}`,
    "", "ENDEREÇO DO CLIENTE", `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ""}`,
    `${address.neighborhood} — ${address.city}/${address.state}`,
    `CEP ${address.postalCode.replace(/^(\d{5})(\d{3})$/, "$1-$2")} — ${address.country}`,
    "", `Data/hora do pagamento: ${paidAt} (America/Sao_Paulo)`,
  ].join("\n");
  return {
    from, to: ["flowjesusoficial@gmail.com"], reply_to: order.customer_email,
    subject: `Pedido pago FlowJesus: ${order.order_number}${pickup ? " — RETIRADA NO LOCAL" : " — Entrega"}`,
    text,
    html: `<h1>Pedido pago</h1><h2>${receipt}</h2><div style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(text)}</div>`,
  };
}

// Called only after signature verification and authoritative reconciliation.
// Read the saved payment association and paid state, never the webhook body.
export async function notifyPaidOrder(
  db: OrdersDatabase, env: EmailEnvironment, resource: { type: "payment" | "order"; id: string },
  fetchImpl: typeof fetch = fetch, now: () => number = Date.now,
) {
  const column = resource.type === "order" ? "mercado_pago_order_id" : "mercado_pago_payment_id";
  const order = await db.prepare(`SELECT order_number, customer_name, customer_email, customer_phone,
    address_json, items_json, subtotal_cents, coupon, coupon_discount_cents, pix_discount_cents,
    shipping_cents, total_cents, shipping_mode, shipping_company, shipping_name, payment_method, paid_at,
    paid_email_status, paid_email_payload_json, paid_email_first_attempt_ms, paid_email_lease_until_ms
    FROM orders WHERE ${column} = ? AND status = 'pago'`).bind(resource.id).first<PaidOrder>();
  if (!order || order.paid_email_status === "sent") return;
  const current = now();
  if (order.paid_email_status === "review_required") throw unavailable();
  if (order.paid_email_status === "sending" && (order.paid_email_lease_until_ms ?? 0) > current) throw unavailable();
  if (order.paid_email_first_attempt_ms !== null && current - order.paid_email_first_attempt_ms >= retryWindowMs) {
    // An accepted email may have lost its response. Never resend after Resend's
    // deduplication window; retain the record for explicit provider reconciliation.
    await db.prepare(`UPDATE orders SET paid_email_status = 'review_required'
      WHERE order_number = ? AND paid_email_status IN ('pending', 'sending')
      AND (paid_email_lease_until_ms IS NULL OR paid_email_lease_until_ms <= ?)`)
      .bind(order.order_number, current).run();
    throw unavailable();
  }
  if (!env.RESEND_API_KEY) throw unavailable();
  const payload = order.paid_email_payload_json ?? JSON.stringify(emailPayload(order,
    env.CONTACT_FROM_EMAIL || "Contato FlowJesus <contato@flowjesus.com>"));
  const claim = crypto.randomUUID();
  const claimed = await db.prepare(`UPDATE orders SET paid_email_status = 'sending', paid_email_claim_token = ?,
    paid_email_lease_until_ms = ?, paid_email_first_attempt_ms = COALESCE(paid_email_first_attempt_ms, ?),
    paid_email_payload_json = COALESCE(paid_email_payload_json, ?)
    WHERE order_number = ? AND status = 'pago' AND paid_email_status IN ('pending', 'sending')
      AND (paid_email_lease_until_ms IS NULL OR paid_email_lease_until_ms <= ?)
      AND (paid_email_first_attempt_ms IS NULL OR paid_email_first_attempt_ms > ?)`)
    .bind(claim, current + leaseMs, current, payload, order.order_number, current, current - retryWindowMs).run();
  if (claimed.meta.changes !== 1) throw unavailable();
  try {
    // Re-read the frozen payload: another expired attempt may have saved it
    // between our first SELECT and the atomic claim.
    const frozen = await db.prepare(`SELECT paid_email_payload_json, paid_email_first_attempt_ms, paid_email_lease_until_ms FROM orders
      WHERE order_number = ? AND status = 'pago' AND paid_email_claim_token = ?`)
      .bind(order.order_number, claim).first<{
        paid_email_payload_json: string; paid_email_first_attempt_ms: number; paid_email_lease_until_ms: number;
      }>();
    if (!frozen || now() >= frozen.paid_email_lease_until_ms || now() - frozen.paid_email_first_attempt_ms >= retryWindowMs) throw unavailable();
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST", headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json",
        "Idempotency-Key": `flowjesus-paid-order/${order.order_number}`,
      }, body: frozen.paid_email_payload_json, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw unavailable();
    const result: unknown = await response.json();
    const emailId = (result as { id?: unknown } | null)?.id;
    if (typeof emailId !== "string" || !emailId || emailId.length > 200) throw unavailable();
    const saved = await db.prepare(`UPDATE orders SET paid_email_status = 'sent', paid_email_resend_id = ?,
      paid_email_sent_at = ?, paid_email_claim_token = NULL, paid_email_lease_until_ms = NULL
      WHERE order_number = ? AND paid_email_status = 'sending' AND paid_email_claim_token = ?`)
      .bind(emailId, new Date(now()).toISOString(), order.order_number, claim).run();
    if (saved.meta.changes !== 1) throw unavailable();
  } catch {
    // No provider body, credentials or customer data in errors/logs. Payment
    // stays paid; HTTP 503 lets Mercado Pago redeliver the notification.
    await db.prepare(`UPDATE orders SET paid_email_status = 'pending', paid_email_claim_token = NULL, paid_email_lease_until_ms = NULL
      WHERE order_number = ? AND paid_email_status = 'sending' AND paid_email_claim_token = ?`)
      .bind(order.order_number, claim).run();
    throw unavailable();
  }
}
