import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pixDiscountCents } from "@/lib/pricing";
import { createPixPayment } from "@/lib/pix-payment";
import { products } from "@/data/products";

export const runtime = "nodejs";

const mercadoPagoCheckoutEndpoint = "https://api.mercadopago.com/checkout/preferences";

type CheckoutItem = { productId: string; size: string; color: string; qty: number };

export async function POST(request: NextRequest) {
  // O secret permanece no Worker; a Vercel encaminha somente o pedido.
  if (process.env.VERCEL === "1") {
    try {
      const response = await fetch("https://flow-jesus.flowjesusoficial.workers.dev/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
      return NextResponse.json(await response.json(), { status: response.status });
    } catch {
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
    }
  }
  let token: string | undefined;
  try {
    token = (getCloudflareContext().env as { MERCADOPAGO_ACCESS_TOKEN?: string }).MERCADOPAGO_ACCESS_TOKEN;
  } catch {
    // O Next.js fora do Cloudflare não tem bindings; usa a variável local.
    token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  }
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

  const { items, shipping, coupon, discountCents, totalCents, paymentMethod, payerEmail, pixRequestId } = body as {
    items?: unknown; shipping?: unknown; coupon?: unknown; discountCents?: unknown; totalCents?: unknown;
    paymentMethod?: unknown; payerEmail?: unknown; pixRequestId?: unknown;
  };
  const isPix = paymentMethod === "pix";
  if (paymentMethod !== undefined && paymentMethod !== "other" && !isPix) {
    return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
  }
  if (isPix && (typeof payerEmail !== "string" || payerEmail.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail.trim()) || typeof pixRequestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pixRequestId))) {
    return NextResponse.json({ error: "Informe um e-mail válido para gerar o Pix e tente novamente." }, { status: 400 });
  }
  const cartCheckout = shipping !== null && typeof shipping === "object";
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      !cartCheckout) {
    return NextResponse.json({ error: "Itens ou entrega inválidos." }, { status: 400 });
  }

  let subtotalCents = 0;
  let orderItems = [];
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
      quantity: item.qty as number,
      currency_id: "BRL",
      unit_price: unitCents / 100,
    });
  }

  let shippingCents = 0;
  if (cartCheckout) {
    const { amountCents, serviceId, postalCode } = shipping as { amountCents?: unknown; serviceId?: unknown; postalCode?: unknown };
    if (!Number.isSafeInteger(serviceId) || typeof postalCode !== "string" || !/^\d{8}$/.test(postalCode)) {
      return NextResponse.json({ error: "Calcule o frete e selecione uma modalidade." }, { status: 400 });
    }
    const expectedDiscount = (coupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0) + (isPix ? pixDiscountCents(subtotalCents) : 0);
    if (!Number.isSafeInteger(amountCents) || (amountCents as number) < 0 ||
        !["", "FLOW10"].includes(coupon as string) || discountCents !== expectedDiscount ||
        !Number.isSafeInteger(totalCents) || totalCents !== subtotalCents - expectedDiscount + (amountCents as number)) {
      return NextResponse.json({ error: "Total, frete ou desconto inválido. Atualize o carrinho." }, { status: 400 });
    }
    try {
      const quoteResponse = await fetch("https://flowjesus-melhor-envio.flowjesusoficial.workers.dev/api/melhor-envio/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPostalCode: postalCode, products: (items as CheckoutItem[]).map(item => ({
          id: item.productId, width: 25, height: 8, length: 30, weight: 0.3,
          insuranceValue: products.find(p => p.id === item.productId)!.price, quantity: item.qty,
        })) }),
        cache: "no-store", signal: AbortSignal.timeout(20000),
      });
      const quote = await quoteResponse.json();
      if (!quoteResponse.ok || !Array.isArray(quote.services)) throw new Error("quote unavailable");
      const service = quote.services.find((option: { id: number }) => option.id === serviceId);
      if (!service || typeof service.price !== "number" || !Number.isFinite(service.price) || service.price < 0 || Math.round(service.price * 100) !== amountCents) {
        return NextResponse.json({ error: "O frete mudou ou está indisponível. Calcule novamente e selecione uma opção." }, { status: 409 });
      }
    } catch {
      return NextResponse.json({ error: "Não foi possível confirmar o frete. Calcule novamente." }, { status: 502 });
    }
    shippingCents = amountCents as number;
    // Rateia o desconto em centavos, preservando os produtos e as quantidades.
    // Divide uma linha somente quando o arredondamento exige preços diferentes.
    let accumulatedCents = 0;
    let allocatedCents = 0;
    orderItems = orderItems.flatMap((item) => {
      accumulatedCents += Math.round(item.unit_price * 100) * item.quantity;
      const targetCents = Math.round(accumulatedCents * (subtotalCents - expectedDiscount) / subtotalCents);
      const lineCents = targetCents - allocatedCents;
      allocatedCents = targetCents;
      const unitCents = Math.floor(lineCents / item.quantity);
      const remainder = lineCents % item.quantity;
      return [
        { ...item, quantity: item.quantity - remainder, unit_price: unitCents / 100 },
        { ...item, quantity: remainder, unit_price: (unitCents + 1) / 100 },
      ].filter((line) => line.quantity > 0);
    });
  }
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
    if (isPix) {
      // Use the server-priced products and the verified, undiscounted freight.
      const couponDiscount = coupon === "FLOW10" ? Math.round(subtotalCents / 10) : 0;
      const checkoutUrl = await createPixPayment(token, {
        amountCents: subtotalCents - couponDiscount - pixDiscountCents(subtotalCents) + shippingCents,
        email: (payerEmail as string).trim(),
        requestId: pixRequestId as string,
        order: { items, shipping, coupon },
      });
      return NextResponse.json({ checkout_url: checkoutUrl });
    }
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
      // Provider bodies, headers and exception messages may contain credentials.
      console.error("Mercado Pago checkout request failed", {
        endpoint: mercadoPagoCheckoutEndpoint,
        status: response.status,
      });
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
    }

    const preference: unknown = await response.json();
    const checkoutUrl = (preference as { init_point?: unknown })?.init_point;
    if (typeof checkoutUrl !== "string" || !/^https:\/\/(?:[\w-]+\.)?mercadopago\.com(?:\.[a-z]{2})?\//i.test(checkoutUrl)) {
      return NextResponse.json({ error: "Resposta de pagamento inválida." }, { status: 502 });
    }

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch {
    console.error("Mercado Pago checkout request exception", {
      endpoint: isPix ? "https://api.mercadopago.com/v1/payments" : mercadoPagoCheckoutEndpoint,
    });
    return NextResponse.json({ error: isPix ? "Não foi possível gerar o Pix. Tente novamente." : "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
  }
}
