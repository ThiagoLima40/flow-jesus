import { NextRequest, NextResponse } from "next/server";
import { products } from "@/data/products";

export const runtime = "nodejs";

const mercadoPagoCheckoutEndpoint = "https://api.mercadopago.com/checkout/preferences";

function redactCredentials(value: string, credentials: string[]) {
  return credentials.reduce((text, credential) => text.replaceAll(credential, "[REDACTED]"), value);
}

type CheckoutItem = { productId: string; size: string; color: string; qty: number };

export async function POST(request: NextRequest) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("Mercado Pago checkout unavailable", {
      endpoint: mercadoPagoCheckoutEndpoint,
      reason: "MERCADOPAGO_ACCESS_TOKEN is missing or empty",
    });
    return NextResponse.json({ error: "Pagamento indisponível no momento." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { items, shipping } = body as { items?: unknown; shipping?: unknown };
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 || !["normal", "expressa"].includes(shipping as string)) {
    return NextResponse.json({ error: "Itens ou entrega inválidos." }, { status: 400 });
  }

  let subtotalCents = 0;
  const orderItems = [];
  for (const raw of items) {
    const item = raw as Partial<CheckoutItem> | null;
    if (!item || typeof item.productId !== "string" || typeof item.size !== "string" ||
        typeof item.color !== "string" || !Number.isSafeInteger(item.qty) ||
        (item.qty as number) < 1 || (item.qty as number) > 100) {
      return NextResponse.json({ error: "Item inválido." }, { status: 400 });
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.sizes.includes(item.size) || !product.colors.some((c) => c.name === item.color)) {
      return NextResponse.json({ error: "Produto ou variação inválida." }, { status: 400 });
    }

    const unitCents = Math.round(product.price * 100);
    subtotalCents += unitCents * (item.qty as number);
    orderItems.push({
      id: product.id,
      title: `${product.name} - ${item.size} - ${item.color}`,
      quantity: item.qty,
      currency_id: "BRL",
      unit_price: unitCents / 100,
    });
  }

  const shippingCents = shipping === "expressa" ? 3490 : subtotalCents > 25000 ? 0 : 1990;
  if (shippingCents) {
    orderItems.push({
      id: "shipping",
      title: "Frete",
      quantity: 1,
      currency_id: "BRL",
      unit_price: shippingCents / 100,
    });
  }

  try {
    const response = await fetch(mercadoPagoCheckoutEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        items: orderItems,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      let errorBody: unknown = null;
      const errorResponse = response.clone();
      try {
        errorBody = await response.json();
      } catch {
        // A resposta de erro pode não conter JSON.
      }

      const credentials = [token, process.env.MERCADOPAGO_CLIENT_SECRET].filter(
        (value): value is string => Boolean(value),
      );
      const emptyJson = errorBody == null || errorBody === "" ||
        (typeof errorBody === "object" && Object.keys(errorBody).length === 0);
      let rawErrorBody: string | undefined;
      if (emptyJson) {
        const rawText = redactCredentials(await errorResponse.text(), credentials);
        rawErrorBody = /bearer\s+\S+|authorization|access[_ -]?token|client[_ -]?secret|password|api[_ -]?key|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(rawText)
          ? "[REDACTED]"
          : rawText;
      }
      const safeErrorBody = JSON.stringify(errorBody, (key, value: unknown) => {
        if (/(authorization|access[_-]?token|client[_-]?secret|password|api[_-]?key)/i.test(key)) {
          return "[REDACTED]";
        }
        if (typeof value === "string") {
          return redactCredentials(value, credentials);
        }
        return value;
      });
      const requestId = response.headers.get("x-request-id");
      const correlationId = response.headers.get("x-correlation-id");
      console.error("Mercado Pago checkout request failed", {
        endpoint: mercadoPagoCheckoutEndpoint,
        status: response.status,
        statusText: redactCredentials(response.statusText, credentials),
        requestId: requestId && redactCredentials(requestId, credentials),
        ...(correlationId && { correlationId: redactCredentials(correlationId, credentials) }),
        errorBody: safeErrorBody,
        ...(rawErrorBody !== undefined && { rawErrorBody }),
      });
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
    }

    const preference: unknown = await response.json();
    const checkoutUrl = (preference as { init_point?: unknown })?.init_point;
    if (typeof checkoutUrl !== "string" || !/^https:\/\/(?:[\w-]+\.)?mercadopago\.com(?:\.[a-z]{2})?\//i.test(checkoutUrl)) {
      return NextResponse.json({ error: "Resposta de pagamento inválida." }, { status: 502 });
    }

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (error) {
    const credentials = [token, process.env.MERCADOPAGO_CLIENT_SECRET].filter(
      (value): value is string => Boolean(value),
    );
    console.error("Mercado Pago checkout request exception", {
      endpoint: mercadoPagoCheckoutEndpoint,
      message: error instanceof Error ? redactCredentials(error.message, credentials) : "Unknown exception",
    });
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
  }
}
