import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OrdersDatabase } from "@/lib/order-store";
import { PaymentWebhookError, reconcilePayment, verifyPaymentSignature } from "@/lib/payment-webhook";
import { reconcileOrder } from "@/lib/order-webhook";
import { notifyPaidOrder } from "@/lib/paid-order-email";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (status: number) => Response.json({ received: status === 200 }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL === "1") {
      // Preserve the signed query and headers; secrets and D1 stay in the Worker.
      const url = new URL(request.url);
      const response = await fetch(`https://flow-jesus.flowjesusoficial.workers.dev/api/mercadopago/webhook${url.search}`, {
        method: "POST", headers: {
          "x-signature": request.headers.get("x-signature") || "",
          "x-request-id": request.headers.get("x-request-id") || "",
        }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45000),
      });
      return reply(response.status === 200 ? 200 : [400, 401, 409].includes(response.status) ? response.status : 503);
    }
    const env = getCloudflareContext().env as {
      ORDERS_DB?: OrdersDatabase; MERCADOPAGO_ACCESS_TOKEN?: string; MERCADOPAGO_WEBHOOK_SECRET?: string;
      RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string;
    };
    if (!env.ORDERS_DB || !env.MERCADOPAGO_ACCESS_TOKEN || !env.MERCADOPAGO_WEBHOOK_SECRET) return reply(503);
    const paymentId = await verifyPaymentSignature(request, env.MERCADOPAGO_WEBHOOK_SECRET);
    if (!paymentId) return reply(401);
    const types = new URL(request.url).searchParams.getAll("type");
    if (types.length > 1) return reply(400);
    const type = types[0] || (/^ORD/.test(paymentId) ? "order" : "payment");
    if (!["payment", "order"].includes(type)) return reply(400);
    if (type === "order" ? !/^ORD[A-Z0-9]{26}$/.test(paymentId) : !/^[1-9]\d*$/.test(paymentId)) return reply(400);
    // The body is deliberately unused: ID comes from the signature, every
    // financial field comes from the API. This also avoids proxying buyer data.
    if (type === "order") await reconcileOrder(env.ORDERS_DB, env.MERCADOPAGO_ACCESS_TOKEN, paymentId);
    else await reconcilePayment(env.ORDERS_DB, env.MERCADOPAGO_ACCESS_TOKEN, paymentId);
    await notifyPaidOrder(env.ORDERS_DB, env, { type: type as "payment" | "order", id: paymentId });
    return reply(200);
  } catch (error) {
    // Never return/log provider bodies, request contents or exception messages.
    return reply(error instanceof PaymentWebhookError ? error.status : 503);
  }
}
